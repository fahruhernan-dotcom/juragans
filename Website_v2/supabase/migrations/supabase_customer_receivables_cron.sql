-- ============================================================================
-- GOPEK DASHBOARD — CUSTOMER RECEIVABLES & DUE DATE NOTIFICATIONS (PG_CRON)
-- File: supabase_customer_receivables_cron.sql
-- 
-- Fitur:
-- 1. Pengingat Piutang Jatuh Tempo H-1, Hari H, dan Nunggak/Overdue (Telat Bayar).
-- 2. Target Penerima: HANYA ke ADMIN & OWNER toko (bukan staff/karyawan biasa).
-- 3. Jadwal Eksekusi Harian: Setiap hari pukul 12:00 SIANG WIB (05:00 UTC) via pg_cron.
-- 4. Deep Link langsung mengarah ke detail nota penjualan & tombol WhatsApp pelanggan.
-- 5. Tersedia fungsi testing simulasi: public.test_send_customer_receivables_reminder().
-- ============================================================================

-- 1. Pastikan ekstensi pg_cron aktif
CREATE EXTENSION IF NOT EXISTS pg_cron;

-- 2. Helper: Dispatch Notifikasi Khusus Role Tertentu (Admin & Owner)
CREATE OR REPLACE FUNCTION public.dispatch_tenant_role_notification(
    p_tenant_id UUID,
    p_target_roles TEXT[],
    p_type TEXT,
    p_title TEXT,
    p_body TEXT,
    p_data JSONB DEFAULT '{}'::JSONB
)
RETURNS INTEGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
    v_user_record RECORD;
    v_inserted_count INTEGER := 0;
BEGIN
    -- Ambil user yang memiliki role yang sesuai (Owner / Admin) di tenant terkait
    FOR v_user_record IN 
        SELECT DISTINCT p.auth_user_id AS user_id
        FROM public.profiles p
        LEFT JOIN public.tenant_memberships tm 
            ON tm.auth_user_id = p.auth_user_id AND tm.tenant_id = p_tenant_id
        WHERE p.tenant_id = p_tenant_id
          AND p.auth_user_id IS NOT NULL
          AND (
              p_target_roles IS NULL 
              OR LOWER(COALESCE(p.role, p.app_role, '')) = ANY(p_target_roles)
              OR LOWER(COALESCE(tm.role, tm.app_role, '')) = ANY(p_target_roles)
              OR (auth.jwt() -> 'app_metadata' ->> 'is_superadmin')::boolean = true
          )
    LOOP
        INSERT INTO public.notifications (
            tenant_id, user_id, type, title, body, data, is_read, created_at
        ) VALUES (
            p_tenant_id, v_user_record.user_id, p_type, p_title, p_body, p_data, FALSE, NOW()
        );
        v_inserted_count := v_inserted_count + 1;
    END LOOP;

    RETURN v_inserted_count;
END;
$$;


-- 3. Fungsi Utama: Generator Notifikasi Piutang Jatuh Tempo H-1, Hari H, & Overdue
CREATE OR REPLACE FUNCTION public.cron_send_customer_receivables_reminder(
    p_force_tenant_id UUID DEFAULT NULL
)
RETURNS JSONB
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
    v_today_start TIMESTAMPTZ;
    v_today_end TIMESTAMPTZ;
    v_tomorrow_start TIMESTAMPTZ;
    v_tomorrow_end TIMESTAMPTZ;
    v_tenant RECORD;
    v_sale RECORD;
    v_title TEXT;
    v_body TEXT;
    v_amount_fmt TEXT;
    v_days_overdue INTEGER;
    v_total_notifs INTEGER := 0;
    v_tenant_summary_count INTEGER := 0;
    v_tenant_summary_amount NUMERIC := 0;
    v_admin_roles TEXT[] := ARRAY['owner', 'admin', 'dev'];
    v_details JSONB := '[]'::jsonb;
BEGIN
    -- Rentang waktu berdasarkan Zona Waktu Indonesia Barat (WIB = Asia/Jakarta)
    v_today_start := (DATE_TRUNC('day', NOW() AT TIME ZONE 'Asia/Jakarta')) AT TIME ZONE 'Asia/Jakarta';
    v_today_end := v_today_start + INTERVAL '1 day' - INTERVAL '1 second';
    v_tomorrow_start := v_today_start + INTERVAL '1 day';
    v_tomorrow_end := v_tomorrow_start + INTERVAL '1 day' - INTERVAL '1 second';

    -- Iterasi Setiap Tenant Aktif
    FOR v_tenant IN 
        SELECT id, business_name
        FROM public.tenants
        WHERE (p_force_tenant_id IS NULL OR id = p_force_tenant_id)
    LOOP
        v_tenant_summary_count := 0;
        v_tenant_summary_amount := 0;

        -- Cari semua penjualan yang BELUM LUNAS dan memiliki due_date
        FOR v_sale IN 
            SELECT 
                s.id,
                s.invoice_number,
                COALESCE(c.customer_name, s.customer_name, 'Pelanggan') AS customer_name,
                COALESCE(c.phone, '') AS customer_phone,
                s.due_date,
                s.remaining_amount,
                s.total_amount
            FROM public.sembako_sales s
            LEFT JOIN public.sembako_customers c ON c.id = s.customer_id
            WHERE s.tenant_id = v_tenant.id
              AND s.payment_status != 'lunas'
              AND s.remaining_amount > 0
              AND s.due_date IS NOT NULL
              AND (s.is_deleted IS NULL OR s.is_deleted = false)
            ORDER BY s.due_date ASC
        LOOP
            v_amount_fmt := 'Rp ' || TO_CHAR(v_sale.remaining_amount, 'FM999G999G999G999');

            -- KASUS 1: H-1 (JATUH TEMPO BESOK)
            IF v_sale.due_date >= v_tomorrow_start AND v_sale.due_date <= v_tomorrow_end THEN
                v_title := '⏳ Piutang Jatuh Tempo Besok (H-1)';
                v_body := 'Nota ' || COALESCE(v_sale.invoice_number, 'SMB') || ' (' || v_sale.customer_name || ') senilai ' || v_amount_fmt || ' jatuh tempo BESOK. Siapkan agenda penagihan.';

                PERFORM public.dispatch_tenant_role_notification(
                    v_tenant.id,
                    v_admin_roles,
                    'RECEIVABLE_DUE_SOON',
                    v_title,
                    v_body,
                    jsonb_build_object(
                        'sale_id', v_sale.id,
                        'invoice_number', v_sale.invoice_number,
                        'customer_name', v_sale.customer_name,
                        'remaining_amount', v_sale.remaining_amount,
                        'phone', v_sale.customer_phone,
                        'route', '/broker/sembako/penjualan?saleId=' || v_sale.id
                    )
                );

                v_total_notifs := v_total_notifs + 1;
                v_tenant_summary_count := v_tenant_summary_count + 1;
                v_tenant_summary_amount := v_tenant_summary_amount + v_sale.remaining_amount;

            -- KASUS 2: HARI H (JATUH TEMPO HARI INI)
            ELSIF v_sale.due_date >= v_today_start AND v_sale.due_date <= v_today_end THEN
                v_title := '🚨 Jatuh Tempo Piutang Hari Ini!';
                v_body := 'Hari ini batas pembayaran ' || v_sale.customer_name || ' (Nota ' || COALESCE(v_sale.invoice_number, 'SMB') || ') senilai ' || v_amount_fmt || '. Mohon lakukan penagihan.';

                PERFORM public.dispatch_tenant_role_notification(
                    v_tenant.id,
                    v_admin_roles,
                    'RECEIVABLE_DUE_TODAY',
                    v_title,
                    v_body,
                    jsonb_build_object(
                        'sale_id', v_sale.id,
                        'invoice_number', v_sale.invoice_number,
                        'customer_name', v_sale.customer_name,
                        'remaining_amount', v_sale.remaining_amount,
                        'phone', v_sale.customer_phone,
                        'route', '/broker/sembako/penjualan?saleId=' || v_sale.id
                    )
                );

                v_total_notifs := v_total_notifs + 1;
                v_tenant_summary_count := v_tenant_summary_count + 1;
                v_tenant_summary_amount := v_tenant_summary_amount + v_sale.remaining_amount;

            -- KASUS 3: OVERDUE / TELAT BAYAR (Nunggak > 0 hari)
            -- Kirim peringatan pada hari ke-3, ke-7, ke-14, dan kelipatan 7 hari
            ELSIF v_sale.due_date < v_today_start THEN
                v_days_overdue := EXTRACT(DAY FROM (v_today_start - v_sale.due_date))::INTEGER;

                IF v_days_overdue IN (3, 7, 14, 21, 30, 45, 60) OR (v_days_overdue > 0 AND v_days_overdue % 7 = 0) THEN
                    v_title := '⚠️ Piutang Menunggak (Telat ' || v_days_overdue || ' Hari)';
                    v_body := 'Nota ' || COALESCE(v_sale.invoice_number, 'SMB') || ' (' || v_sale.customer_name || ') senilai ' || v_amount_fmt || ' telah melewati batas jatuh tempo ' || v_days_overdue || ' hari.';

                    PERFORM public.dispatch_tenant_role_notification(
                        v_tenant.id,
                        v_admin_roles,
                        'RECEIVABLE_OVERDUE',
                        v_title,
                        v_body,
                        jsonb_build_object(
                            'sale_id', v_sale.id,
                            'invoice_number', v_sale.invoice_number,
                            'customer_name', v_sale.customer_name,
                            'remaining_amount', v_sale.remaining_amount,
                            'days_overdue', v_days_overdue,
                            'phone', v_sale.customer_phone,
                            'route', '/broker/sembako/penjualan?saleId=' || v_sale.id
                        )
                    );

                    v_total_notifs := v_total_notifs + 1;
                    v_tenant_summary_count := v_tenant_summary_count + 1;
                    v_tenant_summary_amount := v_tenant_summary_amount + v_sale.remaining_amount;
                END IF;
            END IF;
        END LOOP;

        -- Jika ada lebih dari 3 nota sekaligus, tambahkan 1 notifikasi ringkasan agenda
        IF v_tenant_summary_count > 3 THEN
            PERFORM public.dispatch_tenant_role_notification(
                v_tenant.id,
                v_admin_roles,
                'RECEIVABLE_DAILY_SUMMARY',
                '📋 Rekap Agenda Penagihan Siang Ini',
                'Terdapat ' || v_tenant_summary_count || ' nota piutang yang perlu ditindaklanjuti dengan total Rp ' || TO_CHAR(v_tenant_summary_amount, 'FM999G999G999G999') || '.',
                jsonb_build_object(
                    'route', '/broker/sembako/penjualan',
                    'count', v_tenant_summary_count,
                    'total_amount', v_tenant_summary_amount
                )
            );
        END IF;

        v_details := v_details || jsonb_build_object(
            'tenant_id', v_tenant.id,
            'business_name', v_tenant.business_name,
            'notifs_generated', v_tenant_summary_count,
            'total_receivable_amount', v_tenant_summary_amount
        );
    END LOOP;

    RETURN jsonb_build_object(
        'status', 'success',
        'execution_time_wib', (NOW() AT TIME ZONE 'Asia/Jakarta')::TEXT,
        'total_notifications_sent', v_total_notifs,
        'tenant_summaries', v_details
    );
END;
$$;


-- 4. Fungsi Testing / Simulasi Langsung di SQL Editor
-- Penggunaan:
-- SELECT public.test_send_customer_receivables_reminder();
-- SELECT public.test_send_customer_receivables_reminder('00000000-0000-0000-0000-000000000002');
CREATE OR REPLACE FUNCTION public.test_send_customer_receivables_reminder(
    p_tenant_id UUID DEFAULT NULL
)
RETURNS JSONB
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
    RETURN public.cron_send_customer_receivables_reminder(p_tenant_id);
END;
$$;


-- 5. Daftarkan Jadwal Cron di pg_cron (Setiap Hari Pukul 12:00 SIANG WIB / 05:00 UTC)
-- Hapus jadwal lama jika sudah ada
SELECT cron.unschedule('customer_receivables_due_reminder_12pm') 
WHERE EXISTS (SELECT 1 FROM cron.job WHERE jobname = 'customer_receivables_due_reminder_12pm');

-- Jadwal: Setiap hari jam 05:00 UTC = Jam 12:00 Siang WIB
SELECT cron.schedule(
    'customer_receivables_due_reminder_12pm',
    '0 5 * * *',
    $$SELECT public.cron_send_customer_receivables_reminder()$$
);
