-- ============================================================================
-- GOPEK DASHBOARD — NOTIFICATION TRIGGERS & BUSINESS EVENT HANDLERS
-- DDL Migration: Menghubungkan Event Bisnis ke In-App Notification & Push Service
-- ============================================================================

-- 1. Helper Function: Membuat Notifikasi untuk Anggota Tenant Sesuai Preferensi
CREATE OR REPLACE FUNCTION public.dispatch_tenant_notification(
    p_tenant_id UUID,
    p_type VARCHAR,
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
    v_pref_col TEXT;
BEGIN
    -- Tentukan kolom preferensi yang dicek
    v_pref_col := CASE p_type
        WHEN 'NEW_SALE' THEN 'notify_new_sale'
        WHEN 'PAYMENT_RECEIVED' THEN 'notify_payment_received'
        WHEN 'SALE_STATUS_CHANGED' THEN 'notify_sale_status_changed'
        WHEN 'LOW_STOCK' THEN 'notify_low_stock'
        WHEN 'DELIVERY_REMINDER' THEN 'notify_delivery'
        ELSE 'notify_system_alert'
    END;

    -- Iterasi semua user di tenant terkait
    FOR v_user_record IN 
        SELECT p.auth_user_id AS user_id
        FROM public.profiles p
        LEFT JOIN public.notification_preferences np 
            ON np.user_id = p.auth_user_id AND np.tenant_id = p_tenant_id
        WHERE p.tenant_id = p_tenant_id
          AND p.auth_user_id IS NOT NULL
          AND (
              np.id IS NULL -- Jika belum ada record preferensi, default aktif (TRUE)
              OR (
                  CASE v_pref_col
                      WHEN 'notify_new_sale' THEN COALESCE(np.notify_new_sale, TRUE)
                      WHEN 'notify_payment_received' THEN COALESCE(np.notify_payment_received, TRUE)
                      WHEN 'notify_sale_status_changed' THEN COALESCE(np.notify_sale_status_changed, TRUE)
                      WHEN 'notify_low_stock' THEN COALESCE(np.notify_low_stock, TRUE)
                      WHEN 'notify_delivery' THEN COALESCE(np.notify_delivery, TRUE)
                      ELSE COALESCE(np.notify_system_alert, TRUE)
                  END
              )
          )
    LOOP
        INSERT INTO public.notifications (
            tenant_id,
            user_id,
            type,
            title,
            body,
            data,
            is_read,
            created_at
        ) VALUES (
            p_tenant_id,
            v_user_record.user_id,
            p_type,
            p_title,
            p_body,
            p_data,
            FALSE,
            NOW()
        );
        
        v_inserted_count := v_inserted_count + 1;
    END LOOP;

    -- Catat event ke notification_events audit log (Aman jika tabel belum dibuat atau skema berbeda)
    BEGIN
        INSERT INTO public.notification_events (
            tenant_id,
            event_type,
            source_table,
            payload,
            status,
            created_at
        ) VALUES (
            p_tenant_id,
            p_type,
            'system',
            jsonb_build_object(
                'title', p_title,
                'body', p_body,
                'data', p_data,
                'recipient_count', v_inserted_count
            ),
            'completed',
            NOW()
        );
    EXCEPTION WHEN OTHERS THEN
        NULL;
    END;

    RETURN v_inserted_count;
END;
$$;


-- 2. Trigger Function: Saat Ada Penjualan/Pesanan Baru (NEW_SALE)
CREATE OR REPLACE FUNCTION public.trg_fn_notify_new_sale()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
    v_cust_name TEXT;
    v_total_fmt TEXT;
BEGIN
    v_cust_name := COALESCE(NEW.customer_name, 'Pelanggan');
    -- Kolom pada sembako_sales adalah total_amount (BUKAN grand_total)
    v_total_fmt := 'Rp ' || TO_CHAR(COALESCE(NEW.total_amount, 0), 'FM999G999G999G999');

    PERFORM public.dispatch_tenant_notification(
        NEW.tenant_id,
        'NEW_SALE',
        'Pesanan Baru: ' || COALESCE(NEW.invoice_number, 'Nota Baru'),
        v_cust_name || ' • Total ' || v_total_fmt,
        jsonb_build_object(
            'sale_id', NEW.id,
            'invoice_number', NEW.invoice_number,
            'route', '/broker/sembako/penjualan?saleId=' || NEW.id
        )
    );

    RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS trg_notify_new_sale ON public.sembako_sales;
CREATE TRIGGER trg_notify_new_sale
AFTER INSERT ON public.sembako_sales
FOR EACH ROW
EXECUTE FUNCTION public.trg_fn_notify_new_sale();


-- 3. Trigger Function: Saat Ada Pembayaran Masuk (PAYMENT_RECEIVED)
CREATE OR REPLACE FUNCTION public.trg_fn_notify_payment_received()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
    v_inv_no TEXT;
    v_amount_fmt TEXT;
    v_tenant_id UUID;
    v_method TEXT;
BEGIN
    -- Ambil nomor invoice dan tenant_id dari sembako_sales
    SELECT invoice_number, tenant_id INTO v_inv_no, v_tenant_id
    FROM public.sembako_sales
    WHERE id = NEW.sale_id;

    IF v_tenant_id IS NOT NULL THEN
        v_amount_fmt := 'Rp ' || TO_CHAR(COALESCE(NEW.amount, 0), 'FM999G999G999G999');
        v_method := COALESCE(NEW.payment_method, 'Tunai');

        PERFORM public.dispatch_tenant_notification(
            v_tenant_id,
            'PAYMENT_RECEIVED',
            'Pembayaran Diterima (' || v_method || ')',
            'Nota ' || COALESCE(v_inv_no, '-') || ' • ' || v_amount_fmt,
            jsonb_build_object(
                'payment_id', NEW.id,
                'sale_id', NEW.sale_id,
                'route', '/broker/sembako/penjualan?saleId=' || NEW.sale_id
            )
        );
    END IF;

    RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS trg_notify_payment_received ON public.sembako_payments;
CREATE TRIGGER trg_notify_payment_received
AFTER INSERT ON public.sembako_payments
FOR EACH ROW
EXECUTE FUNCTION public.trg_fn_notify_payment_received();


-- 4. Trigger Function: Saat Stok Produk Menipis (LOW_STOCK)
CREATE OR REPLACE FUNCTION public.trg_fn_notify_low_stock()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
    -- Hanya trigger jika stok baru turun ke atau di bawah batas minimum, dan sebelumnya di atas batas
    -- Kolom nama produk di sembako_products adalah product_name (BUKAN name)
    IF NEW.min_stock_alert IS NOT NULL 
       AND NEW.min_stock_alert > 0 
       AND NEW.current_stock <= NEW.min_stock_alert 
       AND (OLD.current_stock > NEW.min_stock_alert OR OLD.current_stock IS NULL) THEN

        PERFORM public.dispatch_tenant_notification(
            NEW.tenant_id,
            'LOW_STOCK',
            '⚠️ Peringatan Stok Menipis',
            COALESCE(NEW.product_name, 'Produk') || ' sisa ' || NEW.current_stock || ' ' || COALESCE(NEW.unit, 'item') || ' (Batas min: ' || NEW.min_stock_alert || ')',
            jsonb_build_object(
                'product_id', NEW.id,
                'product_name', NEW.product_name,
                'current_stock', NEW.current_stock,
                'route', '/broker/sembako/gudang'
            )
        );
    END IF;

    RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS trg_notify_low_stock ON public.sembako_products;
CREATE TRIGGER trg_notify_low_stock
AFTER UPDATE OF current_stock ON public.sembako_products
FOR EACH ROW
EXECUTE FUNCTION public.trg_fn_notify_low_stock();

