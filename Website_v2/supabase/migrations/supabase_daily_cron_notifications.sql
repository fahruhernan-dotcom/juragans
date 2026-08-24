-- ============================================================================
-- GOPEK DASHBOARD — DAILY SCHEDULED TRANSACTION NOTIFICATIONS (PG_CRON)
-- Jadwal: Jam 07:00 (Pagi), Jam 12:00 (Siang), Jam 15:00 (Sore), Jam 20:00 (Malam) WIB
-- ============================================================================

-- 1. Pastikan ekstensi pg_cron aktif
CREATE EXTENSION IF NOT EXISTS pg_cron;

-- 2. Function Generator Notifikasi Rekap Transaksi Harian
CREATE OR REPLACE FUNCTION public.cron_send_daily_sales_digest(p_time_label TEXT)
RETURNS INTEGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
    v_tenant RECORD;
    v_sales_count INTEGER;
    v_total_amount NUMERIC;
    v_title TEXT;
    v_body TEXT;
    v_total_sent INTEGER := 0;
    v_total_fmt TEXT;
    v_today_start TIMESTAMPTZ;
BEGIN
    -- Menghitung rentang hari ini berdasarkan Waktu Indonesia Barat (WIB = UTC+7)
    v_today_start := (DATE_TRUNC('day', NOW() AT TIME ZONE 'Asia/Jakarta')) AT TIME ZONE 'Asia/Jakarta';

    -- Iterasi setiap tenant aktif
    FOR v_tenant IN 
        SELECT id, name FROM public.tenants
    LOOP
        -- Hitung transaksi hari ini untuk tenant
        SELECT 
            COUNT(id),
            COALESCE(SUM(total_amount), 0)
        INTO 
            v_sales_count,
            v_total_amount
        FROM public.sembako_sales
        WHERE tenant_id = v_tenant.id
          AND created_at >= v_today_start
          AND (is_deleted IS NULL OR is_deleted = false);

        v_total_fmt := 'Rp ' || TO_CHAR(v_total_amount, 'FM999G999G999G999');

        -- Sesuaikan narasi notifikasi berdasarkan jam dan ada/tidaknya transaksi
        IF p_time_label = 'Pagi (07:00 WIB)' THEN
            IF v_sales_count > 0 THEN
                v_title := '☀️ Update Transaksi Pagi';
                v_body := 'Pagi ini sudah ada ' || v_sales_count || ' transaksi (' || v_total_fmt || '). Semangat mulai hari!';
            ELSE
                v_title := '☀️ Selamat Pagi! Siap Buka Toko?';
                v_body := 'Belum ada transaksi tercatat pagi ini. Jangan lupa cek stok & buka kasir.';
            END IF;

        ELSIF p_time_label = 'Siang (12:00 WIB)' THEN
            IF v_sales_count > 0 THEN
                v_title := '🍱 Rekap Penjualan Siang';
                v_body := 'Tengah hari ini: ' || v_sales_count || ' transaksi berhasil dengan total ' || v_total_fmt || '.';
            ELSE
                v_title := '🍱 Update Siang: Belum Ada Transaksi';
                v_body := 'Belum ada transaksi masuk sampai siang ini. Cek orderan dan pelanggan langganan.';
            END IF;

        ELSIF p_time_label = 'Sore (15:00 WIB)' THEN
            IF v_sales_count > 0 THEN
                v_title := '☕ Rekap Transaksi Sore';
                v_body := 'Total sore ini: ' || v_sales_count || ' transaksi (' || v_total_fmt || '). Cek stok barang yang jalan!';
            ELSE
                v_title := '☕ Update Sore: Belum Ada Transaksi';
                v_body := 'Belum ada transaksi hingga sore ini. Pantau ketersediaan barang di gudang.';
            END IF;

        ELSE -- Malam (20:00 WIB)
            IF v_sales_count > 0 THEN
                v_title := '🌙 Rekap Tutup Toko Malam';
                v_body := 'Total hari ini: ' || v_sales_count || ' transaksi dengan omzet ' || v_total_fmt || '. Kerja bagus hari ini!';
            ELSE
                v_title := '🌙 Laporan Penutup Hari';
                v_body := 'Tidak ada transaksi tercatat hari ini. Cek laporan dan persiapkan untuk besok.';
            END IF;
        END IF;

        -- Kirim notifikasi ke seluruh anggota tenant (otomatis sync ke in-app & FCM push)
        PERFORM public.dispatch_tenant_notification(
            v_tenant.id,
            'SYSTEM_ALERT',
            v_title,
            v_body,
            jsonb_build_object(
                'route', '/broker/sembako/penjualan',
                'sales_count', v_sales_count,
                'total_amount', v_total_amount,
                'time_label', p_time_label
            )
        );

        v_total_sent := v_total_sent + 1;
    END LOOP;

    RETURN v_total_sent;
END;
$$;


-- 3. Daftarkan Jadwal Cron di pg_cron (WIB = UTC+7)
-- Unschedule terlebih dahulu jika sudah pernah ada agar tidak duplikat
SELECT cron.unschedule('daily_sales_digest_07am') WHERE EXISTS (SELECT 1 FROM cron.job WHERE jobname = 'daily_sales_digest_07am');
SELECT cron.unschedule('daily_sales_digest_12pm') WHERE EXISTS (SELECT 1 FROM cron.job WHERE jobname = 'daily_sales_digest_12pm');
SELECT cron.unschedule('daily_sales_digest_03pm') WHERE EXISTS (SELECT 1 FROM cron.job WHERE jobname = 'daily_sales_digest_03pm');
SELECT cron.unschedule('daily_sales_digest_08pm') WHERE EXISTS (SELECT 1 FROM cron.job WHERE jobname = 'daily_sales_digest_08pm');

-- Jadwal 1: Jam 07:00 WIB (00:00 UTC)
SELECT cron.schedule(
    'daily_sales_digest_07am',
    '0 0 * * *',
    $$SELECT public.cron_send_daily_sales_digest('Pagi (07:00 WIB)')$$
);

-- Jadwal 2: Jam 12:00 WIB (05:00 UTC)
SELECT cron.schedule(
    'daily_sales_digest_12pm',
    '0 5 * * *',
    $$SELECT public.cron_send_daily_sales_digest('Siang (12:00 WIB)')$$
);

-- Jadwal 3: Jam 15:00 WIB (08:00 UTC)
SELECT cron.schedule(
    'daily_sales_digest_03pm',
    '0 8 * * *',
    $$SELECT public.cron_send_daily_sales_digest('Sore (15:00 WIB)')$$
);

-- Jadwal 4: Jam 20:00 WIB (13:00 UTC)
SELECT cron.schedule(
    'daily_sales_digest_08pm',
    '0 13 * * *',
    $$SELECT public.cron_send_daily_sales_digest('Malam (20:00 WIB)')$$
);
