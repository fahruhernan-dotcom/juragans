-- ============================================================================
-- GOPEK DASHBOARD — MONTHLY SERVER BILLING REMINDER (PG_CRON)
-- File: supabase_monthly_server_billing_cron.sql
-- 
-- Fitur:
-- 1. Pengingat otomatis H-7 setiap hari (tanggal 21 s/d 28) sebelum jatuh tempo server tgl 28.
-- 2. Deteksi Cerdas: Otomatis SKIP jika tenant SUDAH BAYAR / lisensi diperpanjang (plan_expires_at > tgl 28).
-- 3. Otomatis SKIP lisensi PERMANENT / Unlimited / Dev (plan_expires_at IS NULL / > 100 tahun).
-- 4. Jadwal Eksekusi Harian: Setiap hari pukul 09:00 WIB (02:00 UTC) via pg_cron.
-- 5. Tersedia fungsi testing simulasi: public.test_send_server_billing_reminder().
-- ============================================================================

-- 1. Pastikan ekstensi pg_cron aktif
CREATE EXTENSION IF NOT EXISTS pg_cron;

-- 2. Fungsi Utama: Generator Pengingat Tagihan Server Developer
CREATE OR REPLACE FUNCTION public.cron_send_server_billing_reminder(
    p_simulated_day INTEGER DEFAULT NULL,
    p_force_tenant_id UUID DEFAULT NULL
)
RETURNS JSONB
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
    v_now_wib TIMESTAMP;
    v_current_year INTEGER;
    v_current_month INTEGER;
    v_current_day INTEGER;
    v_days_left INTEGER;
    v_month_name TEXT;
    v_month_due_date TIMESTAMPTZ;
    v_tenant RECORD;
    v_title TEXT;
    v_body TEXT;
    v_sent_count INTEGER := 0;
    v_skipped_paid_count INTEGER := 0;
    v_skipped_perm_count INTEGER := 0;
    v_details JSONB := '[]'::jsonb;
BEGIN
    -- Menentukan waktu hari ini berdasarkan Waktu Indonesia Barat (WIB = UTC+7)
    v_now_wib := (NOW() AT TIME ZONE 'Asia/Jakarta')::TIMESTAMP;
    v_current_year := EXTRACT(YEAR FROM v_now_wib)::INTEGER;
    v_current_month := EXTRACT(MONTH FROM v_now_wib)::INTEGER;
    v_current_day := COALESCE(p_simulated_day, EXTRACT(DAY FROM v_now_wib)::INTEGER);

    -- 1. Validasi Rentang Tanggal: Hanya berjalan pada tanggal 21 s/d 28
    IF v_current_day < 21 OR v_current_day > 28 THEN
        RETURN jsonb_build_object(
            'status', 'skipped_out_of_range',
            'message', 'Hari ini tanggal ' || v_current_day || '. Pengingat H-7 hanya aktif pada tanggal 21 s/d 28.',
            'current_day', v_current_day,
            'sent_count', 0
        );
    END IF;

    -- Hitung sisa hari menuju tanggal 28
    v_days_left := 28 - v_current_day;

    -- Nama Bulan dalam Bahasa Indonesia
    v_month_name := CASE v_current_month
        WHEN 1 THEN 'Januari'
        WHEN 2 THEN 'Februari'
        WHEN 3 THEN 'Maret'
        WHEN 4 THEN 'April'
        WHEN 5 THEN 'Mei'
        WHEN 6 THEN 'Juni'
        WHEN 7 THEN 'Juli'
        WHEN 8 THEN 'Agustus'
        WHEN 9 THEN 'September'
        WHEN 10 THEN 'Oktober'
        WHEN 11 THEN 'November'
        ELSE 'Desember'
    END;

    -- Batas jatuh tempo bulan ini (28 [Bulan Ini] 23:59:59 WIB)
    v_month_due_date := (make_date(v_current_year, v_current_month, 28) + TIME '23:59:59') AT TIME ZONE 'Asia/Jakarta';

    -- Susun Judul dan Pesan Notifikasi berdasarkan Countdown (H-7 s/d Hari H)
    IF v_days_left = 7 THEN
        v_title := '⏳ Pengingat Tagihan Server (H-7)';
        v_body := 'Tagihan langganan server aplikasi ERP akan jatuh tempo pada 28 ' || v_month_name || '. Mohon persiapkan pembayaran tepat waktu.';
    ELSIF v_days_left = 6 THEN
        v_title := '⏳ Pengingat Tagihan Server (H-6)';
        v_body := '6 hari lagi menuju jatuh tempo server (28 ' || v_month_name || '). Hubungi Developer untuk konfirmasi perpanjangan.';
    ELSIF v_days_left = 5 THEN
        v_title := '⏳ Pengingat Tagihan Server (H-5)';
        v_body := '5 hari lagi menuju jatuh tempo server (28 ' || v_month_name || '). Pastikan operasional toko Anda tetap lancar.';
    ELSIF v_days_left = 4 THEN
        v_title := '⏳ Pengingat Tagihan Server (H-4)';
        v_body := '4 hari lagi batas waktu pembayaran server aplikasi toko (28 ' || v_month_name || ').';
    ELSIF v_days_left = 3 THEN
        v_title := '⚠️ Tagihan Server Mendekati Jatuh Tempo (H-3)';
        v_body := '3 hari lagi! Segera lakukan pembayaran server sebelum 28 ' || v_month_name || ' agar data & aplikasi tetap aktif.';
    ELSIF v_days_left = 2 THEN
        v_title := '⚠️ Tagihan Server Mendekati Jatuh Tempo (H-2)';
        v_body := '2 hari lagi sebelum batas tanggal 28 ' || v_month_name || '. Mohon selesaikan administrasi server ke Developer.';
    ELSIF v_days_left = 1 THEN
        v_title := '🚨 Peringatan: Besok Jatuh Tempo Server! (H-1)';
        v_body := 'Tagihan server jatuh tempo BESOK (28 ' || v_month_name || '). Segera konfirmasi pembayaran ke Developer hari ini.';
    ELSE -- v_days_left = 0 (Hari H / Tanggal 28)
        v_title := '🚨 Hari Ini Batas Pembayaran Server!';
        v_body := 'Hari ini adalah tanggal jatuh tempo server (28 ' || v_month_name || '). Segera selesaikan pembayaran agar server tidak terkunci.';
    END IF;

    -- 2. Iterasi Setiap Tenant Aktif
    FOR v_tenant IN 
        SELECT id, business_name, plan_expires_at
        FROM public.tenants
        WHERE (p_force_tenant_id IS NULL OR id = p_force_tenant_id)
    LOOP
        -- a. Cek apakah lisensi PERMANENT / UNLIMITED (plan_expires_at NULL atau > 100 tahun)
        IF v_tenant.plan_expires_at IS NULL OR v_tenant.plan_expires_at > (NOW() + INTERVAL '100 years') THEN
            v_skipped_perm_count := v_skipped_perm_count + 1;
            CONTINUE;
        END IF;

        -- b. Cek apakah SUDAH DIBAYAR / SUDAH DIPERPANJANG (plan_expires_at sudah di bulan berikutnya)
        IF v_tenant.plan_expires_at > v_month_due_date THEN
            v_skipped_paid_count := v_skipped_paid_count + 1;
            CONTINUE;
        END IF;

        -- c. BELUM DIBAYAR: Kirim notifikasi pengingat ke pemilik toko
        PERFORM public.dispatch_tenant_notification(
            v_tenant.id,
            'SYSTEM_ALERT',
            v_title,
            v_body,
            jsonb_build_object(
                'route', '/akun',
                'type', 'SERVER_BILLING_REMINDER',
                'days_left', v_days_left,
                'due_date', v_month_due_date,
                'month_name', v_month_name
            )
        );

        v_sent_count := v_sent_count + 1;
        v_details := v_details || jsonb_build_object(
            'tenant_id', v_tenant.id,
            'business_name', v_tenant.business_name,
            'plan_expires_at', v_tenant.plan_expires_at
        );
    END LOOP;

    RETURN jsonb_build_object(
        'status', 'success',
        'current_day', v_current_day,
        'days_left', v_days_left,
        'title', v_title,
        'body', v_body,
        'sent_count', v_sent_count,
        'skipped_paid_count', v_skipped_paid_count,
        'skipped_permanent_count', v_skipped_perm_count,
        'tenants_notified', v_details
    );
END;
$$;


-- 3. Fungsi Helper untuk Testing / Simulasi Kapan Saja
-- Contoh penggunaan:
-- SELECT public.test_send_server_billing_reminder(21); -- Simulasi H-7
-- SELECT public.test_send_server_billing_reminder(27); -- Simulasi H-1
-- SELECT public.test_send_server_billing_reminder(28); -- Simulasi Hari H
CREATE OR REPLACE FUNCTION public.test_send_server_billing_reminder(
    p_simulated_day INTEGER DEFAULT 21,
    p_tenant_id UUID DEFAULT NULL
)
RETURNS JSONB
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
    RETURN public.cron_send_server_billing_reminder(p_simulated_day, p_tenant_id);
END;
$$;


-- 4. Daftarkan Jadwal Cron di pg_cron (Setiap Hari Pukul 09:00 WIB / 02:00 UTC)
-- Hapus jadwal lama jika sudah ada agar tidak duplikasi
SELECT cron.unschedule('monthly_server_billing_reminder_09am') 
WHERE EXISTS (SELECT 1 FROM cron.job WHERE jobname = 'monthly_server_billing_reminder_09am');

-- Jadwal: Setiap hari jam 02:00 UTC (Jam 09:00 WIB)
SELECT cron.schedule(
    'monthly_server_billing_reminder_09am',
    '0 2 * * *',
    $$SELECT public.cron_send_server_billing_reminder()$$
);
