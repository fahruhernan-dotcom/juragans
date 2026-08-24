-- ============================================================================
-- GOPEK DASHBOARD — STORE OPERATIONS & DAILY CLOSING CRON (PG_CRON)
-- File: supabase_store_operations_cron.sql
-- 
-- Fitur:
-- 1. Rekap Omzet & Laba Tutup Toko Malam Hari (Jam 20:00 WIB / 13:00 UTC).
-- 2. Peringatan Stok Menipis & Kadaluwarsa Barang Gudang (Jam 07:30 WIB / 00:30 UTC).
-- 3. Penyesuaian Kolom Preferensi Notifikasi per User (notification_preferences).
-- 4. Fungsi Testing Simulasi Langsung: public.test_daily_closing_digest() & public.test_morning_stock_alert().
-- ============================================================================

-- 1. Pastikan ekstensi pg_cron aktif
CREATE EXTENSION IF NOT EXISTS pg_cron;

-- 2. Pastikan Kolom Preferensi Lengkap di notification_preferences
ALTER TABLE IF EXISTS public.notification_preferences 
ADD COLUMN IF NOT EXISTS notify_new_sale BOOLEAN NOT NULL DEFAULT TRUE,
ADD COLUMN IF NOT EXISTS notify_receivables BOOLEAN NOT NULL DEFAULT TRUE,
ADD COLUMN IF NOT EXISTS notify_low_stock BOOLEAN NOT NULL DEFAULT TRUE,
ADD COLUMN IF NOT EXISTS notify_daily_digest BOOLEAN NOT NULL DEFAULT TRUE,
ADD COLUMN IF NOT EXISTS notify_server_billing BOOLEAN NOT NULL DEFAULT TRUE;


-- ============================================================================
-- 3. FUNGSI 1: Rekap Penutupan Toko Malam Hari (Jam 20:00 WIB)
-- ============================================================================
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
    v_total_cash NUMERIC;
    v_total_receivable NUMERIC;
    v_total_profit NUMERIC;
    v_title TEXT;
    v_body TEXT;
    v_omzet_fmt TEXT;
    v_cash_fmt TEXT;
    v_profit_fmt TEXT;
    v_receivable_fmt TEXT;
    v_total_notifs INTEGER := 0;
    v_admin_roles TEXT[] := ARRAY['owner', 'admin', 'dev'];
    v_details JSONB := '[]'::jsonb;
BEGIN
    -- Waktu hari ini mulai jam 00:00:00 WIB
    v_today_start := (DATE_TRUNC('day', NOW() AT TIME ZONE 'Asia/Jakarta')) AT TIME ZONE 'Asia/Jakarta';

    -- Iterasi Setiap Tenant Aktif
    FOR v_tenant IN 
        SELECT id, business_name
        FROM public.tenants
        WHERE (p_force_tenant_id IS NULL OR id = p_force_tenant_id)
    LOOP
        -- Hitung performa penjualan hari ini
        SELECT 
            COUNT(id),
            COALESCE(SUM(total_amount), 0),
            COALESCE(SUM(paid_amount), 0),
            COALESCE(SUM(remaining_amount), 0),
            COALESCE(SUM(net_profit), 0)
        INTO 
            v_sales_count,
            v_total_omzet,
            v_total_cash,
            v_total_receivable,
            v_total_profit
        FROM public.sembako_sales
        WHERE tenant_id = v_tenant.id
          AND created_at >= v_today_start
          AND (is_deleted IS NULL OR is_deleted = false);

        v_omzet_fmt := 'Rp ' || TO_CHAR(v_total_omzet, 'FM999G999G999G999');
        v_cash_fmt := 'Rp ' || TO_CHAR(v_total_cash, 'FM999G999G999G999');
        v_profit_fmt := 'Rp ' || TO_CHAR(v_total_profit, 'FM999G999G999G999');
        v_receivable_fmt := 'Rp ' || TO_CHAR(v_total_receivable, 'FM999G999G999G999');

        IF v_sales_count > 0 THEN
            v_title := '🌙 Rekap Tutup Toko Hari Ini';
            v_body := 'Total hari ini: ' || v_sales_count || ' transaksi • Omzet ' || v_omzet_fmt || ' (Kas: ' || v_cash_fmt || ', Piutang: ' || v_receivable_fmt || ') • Estimasi Laba ' || v_profit_fmt || '. Kerja bagus hari ini!';
        ELSE
            v_title := '🌙 Laporan Penutup Toko Hari Ini';
            v_body := 'Belum ada transaksi penjualan yang tercatat hari ini. Cek rekap stok dan persiapkan untuk besok.';
        END IF;

        -- Kirimkan ke Owner & Admin
        PERFORM public.dispatch_tenant_role_notification(
            v_tenant.id,
            v_admin_roles,
            'DAILY_CLOSING_DIGEST',
            v_title,
            v_body,
            jsonb_build_object(
                'route', '/broker/sembako/laporan',
                'sales_count', v_sales_count,
                'total_omzet', v_total_omzet,
                'total_cash', v_total_cash,
                'total_receivable', v_total_receivable,
                'total_profit', v_total_profit
            )
        );

        v_total_notifs := v_total_notifs + 1;
        v_details := v_details || jsonb_build_object(
            'tenant_id', v_tenant.id,
            'business_name', v_tenant.business_name,
            'sales_count', v_sales_count,
            'total_omzet', v_total_omzet,
            'total_profit', v_total_profit
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


-- ============================================================================
-- 4. FUNGSI 2: Peringatan Stok Menipis & Kadaluwarsa Pagi Hari (Jam 07:30 WIB)
-- ============================================================================
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
    v_out_of_stock_count INTEGER;
    v_sample_product TEXT;
    v_sample_qty NUMERIC;
    v_sample_unit TEXT;
    v_expiring_batch_count INTEGER;
    v_sample_exp_product TEXT;
    v_sample_exp_date DATE;
    v_title TEXT;
    v_body TEXT;
    v_total_notifs INTEGER := 0;
    v_stock_roles TEXT[] := ARRAY['owner', 'admin', 'gudang', 'staff', 'dev'];
    v_details JSONB := '[]'::jsonb;
BEGIN
    -- Iterasi Setiap Tenant Aktif
    FOR v_tenant IN 
        SELECT id, business_name
        FROM public.tenants
        WHERE (p_force_tenant_id IS NULL OR id = p_force_tenant_id)
    LOOP
        -- 1. Cek Produk Stok Menipis (<= min_stock_alert) dan Stok Habis (0)
        SELECT 
            COUNT(id),
            COUNT(id) FILTER (WHERE current_stock <= 0)
        INTO 
            v_low_stock_count,
            v_out_of_stock_count
        FROM public.sembako_products
        WHERE tenant_id = v_tenant.id
          AND min_stock_alert IS NOT NULL
          AND min_stock_alert > 0
          AND current_stock <= min_stock_alert
          AND is_active = true
          AND (is_deleted IS NULL OR is_deleted = false);

        -- Ambil 1 contoh nama produk menipis untuk teks notifikasi
        IF v_low_stock_count > 0 THEN
            SELECT product_name, current_stock, unit
            INTO v_sample_product, v_sample_qty, v_sample_unit
            FROM public.sembako_products
            WHERE tenant_id = v_tenant.id
              AND min_stock_alert IS NOT NULL
              AND min_stock_alert > 0
              AND current_stock <= min_stock_alert
              AND is_active = true
              AND (is_deleted IS NULL OR is_deleted = false)
            ORDER BY current_stock ASC
            LIMIT 1;

            v_title := '⚠️ Peringatan Stok Pagi (' || v_low_stock_count || ' Produk Menipis)';
            v_body := 'Ada ' || v_low_stock_count || ' produk menipis (cth: ' || v_sample_product || ' sisa ' || v_sample_qty || ' ' || COALESCE(v_sample_unit, 'item') || ')';
            
            IF v_out_of_stock_count > 0 THEN
                v_body := v_body || ' dan ' || v_out_of_stock_count || ' produk HABIS TOTAL.';
            ELSE
                v_body := v_body || '. Cek gudang untuk persiapan kulakan.';
            END IF;

            PERFORM public.dispatch_tenant_role_notification(
                v_tenant.id,
                v_stock_roles,
                'LOW_STOCK_MORNING_ALERT',
                v_title,
                v_body,
                jsonb_build_object(
                    'route', '/broker/sembako/gudang',
                    'low_stock_count', v_low_stock_count,
                    'out_of_stock_count', v_out_of_stock_count
                )
            );

            v_total_notifs := v_total_notifs + 1;
        END IF;

        -- 2. Cek Batch yang Mendekati Kadaluwarsa dalam 30 Hari ke Depan
        SELECT COUNT(b.id)
        INTO v_expiring_batch_count
        FROM public.sembako_stock_batches b
        WHERE b.tenant_id = v_tenant.id
          AND b.expiry_date IS NOT NULL
          AND b.expiry_date >= CURRENT_DATE
          AND b.expiry_date <= (CURRENT_DATE + INTERVAL '30 days')
          AND b.qty_sisa > 0
          AND (b.is_deleted IS NULL OR b.is_deleted = false);

        IF v_expiring_batch_count > 0 THEN
            SELECT p.product_name, b.expiry_date
            INTO v_sample_exp_product, v_sample_exp_date
            FROM public.sembako_stock_batches b
            LEFT JOIN public.sembako_products p ON p.id = b.product_id
            WHERE b.tenant_id = v_tenant.id
              AND b.expiry_date IS NOT NULL
              AND b.expiry_date >= CURRENT_DATE
              AND b.expiry_date <= (CURRENT_DATE + INTERVAL '30 days')
              AND b.qty_sisa > 0
              AND (b.is_deleted IS NULL OR b.is_deleted = false)
            ORDER BY b.expiry_date ASC
            LIMIT 1;

            v_title := '⏳ Peringatan Kadaluwarsa (' || v_expiring_batch_count || ' Batch)';
            v_body := 'Terdapat ' || v_expiring_batch_count || ' batch mendekati kadaluwarsa (cth: ' || COALESCE(v_sample_exp_product, 'Produk') || ' exp ' || TO_CHAR(v_sample_exp_date, 'DD/MM/YYYY') || '). Utamakan penjualan batch ini (FIFO).';

            PERFORM public.dispatch_tenant_role_notification(
                v_tenant.id,
                v_stock_roles,
                'EXPIRY_MORNING_ALERT',
                v_title,
                v_body,
                jsonb_build_object(
                    'route', '/broker/sembako/gudang',
                    'expiring_batch_count', v_expiring_batch_count
                )
            );

            v_total_notifs := v_total_notifs + 1;
        END IF;

        v_details := v_details || jsonb_build_object(
            'tenant_id', v_tenant.id,
            'business_name', v_tenant.business_name,
            'low_stock_count', v_low_stock_count,
            'expiring_batch_count', v_expiring_batch_count
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


-- ============================================================================
-- 5. FUNGSI TESTING / SIMULASI MANUAL
-- ============================================================================
CREATE OR REPLACE FUNCTION public.test_daily_closing_digest(
    p_tenant_id UUID DEFAULT NULL
)
RETURNS JSONB
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
    RETURN public.cron_send_daily_closing_digest(p_tenant_id);
END;
$$;

CREATE OR REPLACE FUNCTION public.test_morning_stock_alert(
    p_tenant_id UUID DEFAULT NULL
)
RETURNS JSONB
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
    RETURN public.cron_send_morning_stock_alert(p_tenant_id);
END;
$$;


-- ============================================================================
-- 6. DAFTARKAN JADWAL CRON DI PG_CRON (WIB = UTC+7)
-- ============================================================================

-- Jadwal 1: Rekap Omzet Tutup Toko (Jam 20:00 WIB = 13:00 UTC)
SELECT cron.unschedule('daily_closing_digest_08pm') 
WHERE EXISTS (SELECT 1 FROM cron.job WHERE jobname = 'daily_closing_digest_08pm');

SELECT cron.schedule(
    'daily_closing_digest_08pm',
    '0 13 * * *',
    $$SELECT public.cron_send_daily_closing_digest()$$
);

-- Jadwal 2: Peringatan Stok & Expired Pagi (Jam 07:30 WIB = 00:30 UTC)
SELECT cron.unschedule('morning_stock_alert_0730am') 
WHERE EXISTS (SELECT 1 FROM cron.job WHERE jobname = 'morning_stock_alert_0730am');

SELECT cron.schedule(
    'morning_stock_alert_0730am',
    '30 0 * * *',
    $$SELECT public.cron_send_morning_stock_alert()$$
);
