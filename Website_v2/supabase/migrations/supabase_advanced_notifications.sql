-- ============================================================================
-- GOPEK DASHBOARD — ADVANCED NOTIFICATIONS & CRON REMINDERS
-- 1. Pengingat Piutang Jatuh Tempo (Setiap Jam 09:00 WIB)
-- 2. Pengingat Masa Aktif Server / Lisensi (Setiap Jam 10:00 WIB)
-- 3. Trigger Realtime Retur Barang (sembako_returns)
-- ============================================================================

-- 1. FUNCTION & CRON: PENGINGAT PIUTANG JATUH TEMPO (JAM 09:00 WIB / 02:00 UTC)
CREATE OR REPLACE FUNCTION public.cron_send_receivables_due_reminder()
RETURNS INTEGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
    v_tenant RECORD;
    v_due_count INTEGER;
    v_total_due NUMERIC;
    v_total_fmt TEXT;
    v_cust_names TEXT;
    v_title TEXT;
    v_body TEXT;
    v_total_sent INTEGER := 0;
    v_today DATE;
    v_tomorrow DATE;
BEGIN
    v_today := (NOW() AT TIME ZONE 'Asia/Jakarta')::DATE;
    v_tomorrow := v_today + 1;

    FOR v_tenant IN 
        SELECT id, name FROM public.tenants
    LOOP
        -- Hitung piutang yang belum lunas dan jatuh tempo hari ini atau besok
        SELECT 
            COUNT(s.id),
            COALESCE(SUM(GREATEST(COALESCE(s.total_amount, 0) - COALESCE(s.paid_amount, 0), 0)), 0),
            STRING_AGG(DISTINCT COALESCE(s.customer_name, 'Pelanggan'), ', ')
        INTO 
            v_due_count,
            v_total_due,
            v_cust_names
        FROM public.sembako_sales s
        WHERE s.tenant_id = v_tenant.id
          AND (s.is_deleted IS NULL OR s.is_deleted = false)
          AND (s.payment_status IS NULL OR s.payment_status NOT IN ('lunas', 'PAID'))
          AND s.due_date IS NOT NULL
          AND s.due_date::DATE <= v_tomorrow
          AND s.due_date::DATE >= (v_today - INTERVAL '30 days'); -- Jangan sertakan piutang kedaluwarsa > 30 hari dalam cron harian

        IF v_due_count > 0 AND v_total_due > 0 THEN
            v_total_fmt := 'Rp ' || TO_CHAR(v_total_due, 'FM999G999G999G999');
            
            -- Potong string nama pelanggan jika terlalu panjang
            IF LENGTH(v_cust_names) > 60 THEN
                v_cust_names := SUBSTRING(v_cust_names FROM 1 FOR 57) || '...';
            END IF;

            v_title := '⚠️ ' || v_due_count || ' Tagihan Piutang Jatuh Tempo';
            v_body := 'Total ' || v_total_fmt || ' (' || COALESCE(v_cust_names, 'Toko Langganan') || '). Segera follow up tagihan!';

            PERFORM public.dispatch_tenant_notification(
                v_tenant.id,
                'RECEIVABLES_DUE',
                v_title,
                v_body,
                jsonb_build_object(
                    'route', '/broker/sembako/penjualan?filter=unpaid',
                    'due_count', v_due_count,
                    'total_due', v_total_due
                )
            );

            v_total_sent := v_total_sent + 1;
        END IF;
    END LOOP;

    RETURN v_total_sent;
END;
$$;

-- Daftarkan Jadwal Cron Jam 09:00 WIB (02:00 UTC)
SELECT cron.unschedule('daily_receivables_due_09am') WHERE EXISTS (SELECT 1 FROM cron.job WHERE jobname = 'daily_receivables_due_09am');
SELECT cron.schedule(
    'daily_receivables_due_09am',
    '0 2 * * *',
    $$SELECT public.cron_send_receivables_due_reminder()$$
);


-- 2. FUNCTION & CRON: PENGINGAT MASA AKTIF SERVER (JAM 10:00 WIB / 03:00 UTC)
CREATE OR REPLACE FUNCTION public.cron_send_license_expiry_reminder()
RETURNS INTEGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
    v_tenant RECORD;
    v_days_left INTEGER;
    v_title TEXT;
    v_body TEXT;
    v_total_sent INTEGER := 0;
    v_today DATE;
BEGIN
    v_today := (NOW() AT TIME ZONE 'Asia/Jakarta')::DATE;

    FOR v_tenant IN 
        SELECT id, name, active_until 
        FROM public.tenants
        WHERE active_until IS NOT NULL
    LOOP
        v_days_left := (v_tenant.active_until::DATE - v_today);

        -- Kirim peringatan saat sisa 7 hari, 3 hari, 1 hari, atau hari H
        IF v_days_left IN (7, 3, 1, 0) THEN
            IF v_days_left = 0 THEN
                v_title := '🚨 Masa Aktif Server Berakhir Hari Ini';
                v_body := 'Server ' || v_tenant.name || ' akan terkunci besok jika belum diperpanjang. Hubungi admin untuk perpanjangan.';
            ELSE
                v_title := 'ℹ️ Masa Aktif Server: Sisa ' || v_days_left || ' Hari';
                v_body := 'Server aktif hingga ' || TO_CHAR(v_tenant.active_until, 'DD Mon YYYY') || '. Pastikan perpanjang tepat waktu.';
            END IF;

            PERFORM public.dispatch_tenant_notification(
                v_tenant.id,
                'LICENSE_EXPIRING',
                v_title,
                v_body,
                jsonb_build_object(
                    'route', '/broker/sembako/akun',
                    'days_left', v_days_left,
                    'active_until', v_tenant.active_until
                )
            );

            v_total_sent := v_total_sent + 1;
        END IF;
    END LOOP;

    RETURN v_total_sent;
END;
$$;

-- Daftarkan Jadwal Cron Jam 10:00 WIB (03:00 UTC)
SELECT cron.unschedule('daily_license_expiry_10am') WHERE EXISTS (SELECT 1 FROM cron.job WHERE jobname = 'daily_license_expiry_10am');
SELECT cron.schedule(
    'daily_license_expiry_10am',
    '0 3 * * *',
    $$SELECT public.cron_send_license_expiry_reminder()$$
);


-- 3. TRIGGER REALTIME: SAAT ADA RETUR BARANG DITERIMA (sembako_returns)
CREATE OR REPLACE FUNCTION public.trg_fn_notify_return_created()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
    v_prod_name TEXT;
    v_party_name TEXT;
    v_qty_fmt TEXT;
BEGIN
    -- Ambil nama produk jika tersedia
    IF NEW.product_id IS NOT NULL THEN
        SELECT product_name INTO v_prod_name FROM public.sembako_products WHERE id = NEW.product_id;
    END IF;

    v_prod_name := COALESCE(v_prod_name, 'Produk');
    v_party_name := COALESCE(NEW.party_name, 'Pelanggan');
    v_qty_fmt := COALESCE(NEW.quantity::TEXT, '1') || ' ' || COALESCE(NEW.unit, 'item');

    PERFORM public.dispatch_tenant_notification(
        NEW.tenant_id,
        'RETURN_RECEIVED',
        '📦 Retur Barang Diterima',
        v_party_name || ' meretur ' || v_qty_fmt || ' ' || v_prod_name || ' (' || COALESCE(NEW.reason, 'Barang Rusak/Tukar') || ')',
        jsonb_build_object(
            'return_id', NEW.id,
            'sale_id', NEW.sale_id,
            'route', '/broker/sembako/retur'
        )
    );

    RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS trg_notify_return_created ON public.sembako_returns;
CREATE TRIGGER trg_notify_return_created
AFTER INSERT ON public.sembako_returns
FOR EACH ROW
EXECUTE FUNCTION public.trg_fn_notify_return_created();
