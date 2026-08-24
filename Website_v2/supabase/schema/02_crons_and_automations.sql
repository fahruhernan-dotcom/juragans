-- ==============================================================================
-- TERNAKOS / SEMBAKO OS - CRON JOBS & SERVER AUTOMATIONS (PG_CRON)
-- 
-- Fitur Otomatisasi:
-- 1. Peringatan Stok Rendah & Expired Gudang (Setiap Hari Pukul 07:30 WIB / 00:30 UTC)
-- 2. Peringatan Tagihan Server Developer (Setiap Hari tgl 21-28 Pukul 09:00 WIB / 02:00 UTC)
-- 3. Pengingat Piutang Pelanggan Jatuh Tempo (Setiap Hari Pukul 12:00 WIB / 05:00 UTC)
-- 4. Rekap Penutupan Toko Harian / Daily Closing (Setiap Hari Pukul 20:00 WIB / 13:00 UTC)
-- 
-- Catatan:
-- Ekstensi `pg_cron` memerlukan tier Supabase yang mendukung cron (Pro/Self-hosted).
-- Jalankan skrip ini setelah menjalankan `01_master_full_schema.sql`.
-- ==============================================================================

-- 1. Aktifkan Ekstensi pg_cron
CREATE EXTENSION IF NOT EXISTS pg_cron;

-- ==============================================================================
-- 2. CRON 1: Peringatan Stok Menipis & Kadaluwarsa (Pukul 07:30 WIB)
-- ==============================================================================
CREATE OR REPLACE FUNCTION public.cron_send_morning_stock_alert(
    p_force_tenant_id UUID DEFAULT NULL
)
RETURNS JSONB
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
    v_tenant RECORD;
    v_low_stock_count INTEGER;
    v_expiring_count INTEGER;
    v_title TEXT;
    v_body TEXT;
    v_total_notifs INTEGER := 0;
    v_admin_roles TEXT[] := ARRAY['owner', 'admin', 'dev'];
BEGIN
    FOR v_tenant IN 
        SELECT id, business_name
        FROM public.tenants
        WHERE (p_force_tenant_id IS NULL OR id = p_force_tenant_id)
    LOOP
        -- Hitung stok yang berada di bawah ambang batas minimal
        SELECT COUNT(*)
        INTO v_low_stock_count
        FROM public.sembako_products
        WHERE tenant_id = v_tenant.id
          AND is_deleted = false
          AND is_active = true
          AND current_stock <= min_stock_alert;

        -- Hitung batch yang kadaluwarsa dalam 30 hari ke depan
        SELECT COUNT(*)
        INTO v_expiring_count
        FROM public.sembako_stock_batches
        WHERE tenant_id = v_tenant.id
          AND is_deleted = false
          AND qty_sisa > 0
          AND expiry_date IS NOT NULL
          AND expiry_date <= (NOW() + INTERVAL '30 days');

        IF v_low_stock_count > 0 OR v_expiring_count > 0 THEN
            v_title := '⚠️ Alert Inventaris: ' || v_tenant.business_name;
            v_body := format('Terdapat %s produk menipis dan %s batch mendekati kadaluwarsa.', v_low_stock_count, v_expiring_count);
            
            INSERT INTO public.notifications (
                tenant_id, title, body, category, action_url, is_read, created_at
            ) VALUES (
                v_tenant.id, v_title, v_body, 'inventory', '/inventory', false, NOW()
            );
            v_total_notifs := v_total_notifs + 1;
        END IF;
    END LOOP;

    RETURN jsonb_build_object('success', true, 'alerts_sent', v_total_notifs);
END;
$$;

-- ==============================================================================
-- 3. CRON 2: Tagihan Server Developer (Pukul 09:00 WIB, tgl 21-28)
-- ==============================================================================
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
    v_tenant RECORD;
    v_sent_count INTEGER := 0;
BEGIN
    v_now_wib := (NOW() AT TIME ZONE 'Asia/Jakarta')::TIMESTAMP;
    v_current_year := EXTRACT(YEAR FROM v_now_wib)::INTEGER;
    v_current_month := EXTRACT(MONTH FROM v_now_wib)::INTEGER;
    v_current_day := COALESCE(p_simulated_day, EXTRACT(DAY FROM v_now_wib)::INTEGER);

    IF v_current_day < 21 OR v_current_day > 28 THEN
        RETURN jsonb_build_object('status', 'skipped', 'message', 'Diluar rentang periode tagihan tgl 21-28');
    END IF;

    FOR v_tenant IN
        SELECT id, business_name, plan_expires_at, billing_whatsapp
        FROM public.tenants
        WHERE (p_force_tenant_id IS NULL OR id = p_force_tenant_id)
          AND (plan_expires_at IS NULL OR plan_expires_at <= (NOW() + INTERVAL '7 days'))
    LOOP
        INSERT INTO public.notifications (
            tenant_id, title, body, category, action_url, is_read, created_at
        ) VALUES (
            v_tenant.id,
            '💳 Pengingat Iuran Layanan Server ' || v_tenant.business_name,
            'Jatuh tempo pemeliharaan server Anda jatuh pada tanggal 28 bulan ini. Silakan lakukan konfirmasi pembayaran.',
            'billing', '/settings', false, NOW()
        );
        v_sent_count := v_sent_count + 1;
    END LOOP;

    RETURN jsonb_build_object('success', true, 'reminders_sent', v_sent_count);
END;
$$;

-- ==============================================================================
-- 4. CRON 3: Pengingat Piutang Pelanggan Jatuh Tempo (Pukul 12:00 WIB)
-- ==============================================================================
CREATE OR REPLACE FUNCTION public.cron_send_customer_receivables_reminder(
    p_force_tenant_id UUID DEFAULT NULL
)
RETURNS JSONB
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
    v_tenant RECORD;
    v_sale RECORD;
    v_sent_count INTEGER := 0;
BEGIN
    FOR v_sale IN 
        SELECT s.id, s.tenant_id, s.customer_name, s.invoice_number, s.remaining_amount, s.due_date
        FROM public.sembako_sales s
        WHERE (p_force_tenant_id IS NULL OR s.tenant_id = p_force_tenant_id)
          AND s.payment_status IN ('belum_lunas', 'sebagian')
          AND s.is_deleted = false
          AND s.due_date IS NOT NULL
          AND s.due_date::date <= (NOW() AT TIME ZONE 'Asia/Jakarta')::date
    LOOP
        INSERT INTO public.notifications (
            tenant_id, title, body, category, action_url, is_read, created_at
        ) VALUES (
            v_sale.tenant_id,
            '⏳ Piutang Jatuh Tempo: ' || COALESCE(v_sale.customer_name, 'Pelanggan'),
            format('Nota %s sebesar Rp %s telah jatuh tempo. Segera lakukan penagihan.', v_sale.invoice_number, to_char(v_sale.remaining_amount, 'FM999,999,999')),
            'receivables', '/sales', false, NOW()
        );
        v_sent_count := v_sent_count + 1;
    END LOOP;

    RETURN jsonb_build_object('success', true, 'reminders_sent', v_sent_count);
END;
$$;

-- ==============================================================================
-- 5. CRON 4: Rekap Tutup Toko Harian (Pukul 20:00 WIB)
-- ==============================================================================
CREATE OR REPLACE FUNCTION public.cron_send_daily_closing_digest(
    p_force_tenant_id UUID DEFAULT NULL
)
RETURNS JSONB
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
    v_today_start TIMESTAMPTZ;
    v_tenant RECORD;
    v_sales_count INTEGER;
    v_total_omzet NUMERIC;
    v_total_profit NUMERIC;
    v_total_notifs INTEGER := 0;
BEGIN
    v_today_start := (DATE_TRUNC('day', NOW() AT TIME ZONE 'Asia/Jakarta')) AT TIME ZONE 'Asia/Jakarta';

    FOR v_tenant IN 
        SELECT id, business_name
        FROM public.tenants
        WHERE (p_force_tenant_id IS NULL OR id = p_force_tenant_id)
    LOOP
        SELECT 
            COUNT(*),
            COALESCE(SUM(total_amount), 0),
            COALESCE(SUM(net_profit), 0)
        INTO v_sales_count, v_total_omzet, v_total_profit
        FROM public.sembako_sales
        WHERE tenant_id = v_tenant.id
          AND is_deleted = false
          AND transaction_date >= v_today_start;

        IF v_sales_count > 0 THEN
            INSERT INTO public.notifications (
                tenant_id, title, body, category, action_url, is_read, created_at
            ) VALUES (
                v_tenant.id,
                '📊 Rekap Penutupan Toko Hari Ini',
                format('Hari ini terdapat %s transaksi. Total Omzet: Rp %s, Estimasi Laba Bersih: Rp %s.', 
                    v_sales_count, to_char(v_total_omzet, 'FM999,999,999'), to_char(v_total_profit, 'FM999,999,999')),
                'closing', '/reports', false, NOW()
            );
            v_total_notifs := v_total_notifs + 1;
        END IF;
    END LOOP;

    RETURN jsonb_build_object('success', true, 'digests_sent', v_total_notifs);
END;
$$;

-- ==============================================================================
-- 6. JADWALKAN CRON JOBS VIA PG_CRON (UTC TIMESTAMPS)
-- ==============================================================================
-- Hapus jadwal lama jika sudah terdaftar sebelumnya
DO $$
BEGIN
    PERFORM cron.unschedule('daily_morning_stock_alert');
    PERFORM cron.unschedule('daily_server_billing_reminder');
    PERFORM cron.unschedule('daily_customer_receivables_reminder');
    PERFORM cron.unschedule('daily_store_closing_digest');
EXCEPTION WHEN OTHERS THEN NULL;
END $$;

-- 1. Pukul 07:30 WIB (00:30 UTC)
SELECT cron.schedule('daily_morning_stock_alert', '30 0 * * *', 'SELECT public.cron_send_morning_stock_alert();');

-- 2. Pukul 09:00 WIB (02:00 UTC)
SELECT cron.schedule('daily_server_billing_reminder', '0 2 * * *', 'SELECT public.cron_send_server_billing_reminder();');

-- 3. Pukul 12:00 WIB (05:00 UTC)
SELECT cron.schedule('daily_customer_receivables_reminder', '0 5 * * *', 'SELECT public.cron_send_customer_receivables_reminder();');

-- 4. Pukul 20:00 WIB (13:00 UTC)
SELECT cron.schedule('daily_store_closing_digest', '0 13 * * *', 'SELECT public.cron_send_daily_closing_digest();');

SELECT 'Otomatisasi Cron Jobs Supabase Berhasil Diaktifkan!' AS status;
