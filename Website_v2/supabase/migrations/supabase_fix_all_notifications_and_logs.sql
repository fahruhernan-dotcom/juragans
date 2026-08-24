-- =============================================================================
-- GOPEK DASHBOARD — MASTER FIX: NOTIFICATIONS, LOGS & ATOMIC SALE RPC
-- File: supabase_fix_all_notifications_and_logs.sql
--
-- MASALAH YANG DISELESAIKAN:
-- 1. Error 42809 pada create_sembako_sale_transaction (FOR UPDATE tidak boleh pada fungsi aggregate SUM)
-- 2. Error 42703: record "new" has no field "grand_total" (Diganti jadi total_amount)
-- 3. Error: column "name" does not exist pada sembako_products (Diganti jadi product_name)
-- 4. Error 404: system_error_logs table not found & log_pre_auth_error RPC
-- 5. Dukungan demo tenant (00000000-0000-0000-0000-000000000002) pada has_tenant_access
--
-- CARA MENJALANKAN:
-- Salin seluruh isi skrip ini, buka Supabase Dashboard -> SQL Editor -> Tempel -> Klik RUN.
-- =============================================================================

-- =============================================================================
-- 1. UTILITY: has_tenant_access (Mendukung Superadmin & Demo Tenant)
-- =============================================================================

CREATE OR REPLACE FUNCTION public.has_tenant_access(target_tenant_id UUID)
RETURNS BOOLEAN AS $$
BEGIN
  IF target_tenant_id IS NULL THEN
    RETURN TRUE;
  END IF;

  -- Izinkan demo fallback tenant
  IF target_tenant_id = '00000000-0000-0000-0000-000000000002'::UUID THEN
    RETURN TRUE;
  END IF;

  IF auth.uid() IS NULL THEN
    RETURN FALSE;
  END IF;

  -- Superadmin bypass
  IF COALESCE((auth.jwt() -> 'app_metadata' ->> 'is_superadmin')::boolean, false) = true THEN
    RETURN TRUE;
  END IF;

  RETURN EXISTS (
    SELECT 1 FROM public.profiles
    WHERE auth_user_id = auth.uid() AND tenant_id = target_tenant_id
  ) OR EXISTS (
    SELECT 1 FROM public.tenant_memberships
    WHERE auth_user_id = auth.uid() AND tenant_id = target_tenant_id
  ) OR EXISTS (
    SELECT 1 FROM public.tenants
    WHERE owner_id = auth.uid() AND id = target_tenant_id
  );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER STABLE SET search_path = public, pg_temp;

GRANT EXECUTE ON FUNCTION public.has_tenant_access(UUID) TO authenticated, anon;


-- =============================================================================
-- 2. TABEL & RPC: system_error_logs (Remote Logging & Pre-auth Logger)
-- =============================================================================

CREATE TABLE IF NOT EXISTS public.system_error_logs (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    level TEXT NOT NULL DEFAULT 'error',
    source TEXT NOT NULL DEFAULT 'frontend',
    vertical TEXT,
    role TEXT,
    tenant_id UUID REFERENCES public.tenants(id) ON DELETE SET NULL,
    user_id UUID REFERENCES auth.users(id) ON DELETE SET NULL,
    page_path TEXT,
    component TEXT,
    action_name TEXT,
    error_code TEXT,
    error_message TEXT,
    error_details TEXT,
    stack TEXT,
    metadata JSONB NOT NULL DEFAULT '{}'::jsonb,
    user_agent TEXT,
    app_version TEXT,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_system_error_logs_created ON public.system_error_logs(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_system_error_logs_tenant ON public.system_error_logs(tenant_id, created_at DESC);
CREATE INDEX IF NOT EXISTS idx_system_error_logs_source ON public.system_error_logs(source, level);

ALTER TABLE public.system_error_logs ENABLE ROW LEVEL SECURITY;

DO $$ 
BEGIN
    DROP POLICY IF EXISTS "Authenticated users can insert error logs" ON public.system_error_logs;
    DROP POLICY IF EXISTS "Users can view error logs for their tenant" ON public.system_error_logs;
EXCEPTION WHEN OTHERS THEN NULL;
END $$;

CREATE POLICY "Authenticated users can insert error logs" 
ON public.system_error_logs FOR INSERT 
TO authenticated 
WITH CHECK (true);

CREATE POLICY "Users can view error logs for their tenant" 
ON public.system_error_logs FOR SELECT 
TO authenticated 
USING (tenant_id IS NULL OR public.has_tenant_access(tenant_id));

CREATE OR REPLACE FUNCTION public.log_pre_auth_error(
    p_source TEXT,
    p_component TEXT,
    p_action_name TEXT,
    p_error_code TEXT,
    p_error_message TEXT,
    p_page_path TEXT,
    p_metadata JSONB DEFAULT '{}'::jsonb
)
RETURNS VOID
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
    INSERT INTO public.system_error_logs (
        level, source, component, action_name, error_code, error_message, page_path, metadata, created_at
    ) VALUES (
        'error', p_source, p_component, p_action_name, p_error_code, p_error_message, p_page_path, COALESCE(p_metadata, '{}'::jsonb), NOW()
    );
END;
$$;

GRANT EXECUTE ON FUNCTION public.log_pre_auth_error(TEXT, TEXT, TEXT, TEXT, TEXT, TEXT, JSONB) TO anon, authenticated;


-- =============================================================================
-- 3. TABEL: notification_events (Outbox)
-- =============================================================================

CREATE TABLE IF NOT EXISTS public.notification_events (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    tenant_id UUID NOT NULL REFERENCES public.tenants(id) ON DELETE CASCADE,
    event_type TEXT NOT NULL,
    source_table TEXT DEFAULT 'system',
    source_record_id UUID,
    payload JSONB NOT NULL DEFAULT '{}'::jsonb,
    status TEXT NOT NULL DEFAULT 'completed',
    recipient_count INT DEFAULT 0,
    attempt_count INT NOT NULL DEFAULT 0,
    last_error TEXT,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    processed_at TIMESTAMPTZ
);

ALTER TABLE public.notification_events ADD COLUMN IF NOT EXISTS source_table TEXT DEFAULT 'system';
ALTER TABLE public.notification_events ADD COLUMN IF NOT EXISTS recipient_count INT DEFAULT 0;
ALTER TABLE public.notification_events ALTER COLUMN source_table DROP NOT NULL;


-- =============================================================================
-- 4. HELPER FUNCTION: dispatch_tenant_notification
-- =============================================================================

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
    v_pref_col := CASE p_type
        WHEN 'NEW_SALE' THEN 'notify_new_sale'
        WHEN 'PAYMENT_RECEIVED' THEN 'notify_payment_received'
        WHEN 'SALE_STATUS_CHANGED' THEN 'notify_sale_status_changed'
        WHEN 'LOW_STOCK' THEN 'notify_low_stock'
        WHEN 'DELIVERY_REMINDER' THEN 'notify_delivery'
        ELSE 'notify_system_alert'
    END;

    FOR v_user_record IN 
        SELECT p.auth_user_id AS user_id
        FROM public.profiles p
        LEFT JOIN public.notification_preferences np 
            ON np.user_id = p.auth_user_id AND np.tenant_id = p_tenant_id
        WHERE p.tenant_id = p_tenant_id
          AND p.auth_user_id IS NOT NULL
          AND (
              np.id IS NULL
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
            tenant_id, user_id, type, title, body, data, is_read, created_at
        ) VALUES (
            p_tenant_id, v_user_record.user_id, p_type, p_title, p_body, p_data, FALSE, NOW()
        );
        v_inserted_count := v_inserted_count + 1;
    END LOOP;

    BEGIN
        INSERT INTO public.notification_events (
            tenant_id, event_type, source_table, payload, status, created_at
        ) VALUES (
            p_tenant_id, p_type, 'system',
            jsonb_build_object('title', p_title, 'body', p_body, 'data', p_data, 'recipient_count', v_inserted_count),
            'completed', NOW()
        );
    EXCEPTION WHEN OTHERS THEN
        NULL;
    END;

    RETURN v_inserted_count;
END;
$$;


-- =============================================================================
-- 5. TRIGGER NOTIFIKASI
-- =============================================================================

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

CREATE OR REPLACE FUNCTION public.trg_fn_notify_low_stock()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
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


-- Pastikan kompatibilitas kolom sembako_sale_items
ALTER TABLE IF EXISTS public.sembako_sale_items ADD COLUMN IF NOT EXISTS sell_price NUMERIC(15,2) DEFAULT 0;
ALTER TABLE IF EXISTS public.sembako_sale_items ADD COLUMN IF NOT EXISTS price_per_unit NUMERIC(15,2) DEFAULT 0;

CREATE OR REPLACE FUNCTION public.create_sembako_sale_transaction(
    p_tenant_id UUID,
    p_customer_id UUID,
    p_customer_name TEXT,
    p_transaction_date TIMESTAMPTZ,
    p_due_date TIMESTAMPTZ,
    p_delivery_cost NUMERIC,
    p_other_cost NUMERIC,
    p_notes TEXT,
    p_items JSONB
)
RETURNS JSONB AS $$
DECLARE
    v_date_str TEXT;
    v_rand TEXT;
    v_invoice_number TEXT;
    v_sale_id UUID;
    v_total_amount NUMERIC := 0;
    v_total_cogs NUMERIC := 0;
    v_net_profit NUMERIC := 0;
    v_item JSONB;
    v_prod_str TEXT;
    v_product_id UUID;
    v_product_name TEXT;
    v_unit TEXT;
    v_qty NUMERIC;
    v_price NUMERIC;
    v_item_cogs NUMERIC;
    v_batch RECORD;
    v_qty_needed NUMERIC;
    v_deduct NUMERIC;
    v_avail_stock NUMERIC;
    v_sale_record RECORD;
BEGIN
    -- 1. Verifikasi Akses Tenant
    IF auth.uid() IS NOT NULL AND NOT public.has_tenant_access(p_tenant_id) THEN
        RAISE EXCEPTION 'Access Denied: User does not have access to tenant %', p_tenant_id;
    END IF;

    -- Validasi payload items
    IF p_items IS NULL OR jsonb_typeof(p_items) != 'array' OR jsonb_array_length(p_items) = 0 THEN
        RAISE EXCEPTION 'Daftar produk tidak boleh kosong';
    END IF;

    -- 2. Generate Invoice Number
    v_date_str := to_char(COALESCE(p_transaction_date, NOW()), 'YYYYMMDD');
    v_rand := upper(substring(md5(random()::text) from 1 for 4));
    v_invoice_number := 'SMB-' || v_date_str || '-' || v_rand;

    -- 3. Calculate Totals & Validasi Stok (Lock Batches FOR UPDATE secara aman)
    FOR v_item IN SELECT * FROM jsonb_array_elements(p_items) LOOP
        v_prod_str := v_item->>'product_id';
        IF v_prod_str IS NOT NULL AND v_prod_str != '' AND v_prod_str != 'null' THEN
            v_product_id := v_prod_str::UUID;
        ELSE
            v_product_id := NULL;
        END IF;

        v_qty := COALESCE((v_item->>'quantity')::NUMERIC, 0);
        v_price := COALESCE((v_item->>'price_per_unit')::NUMERIC, (v_item->>'sell_price')::NUMERIC, 0);

        IF v_qty > 0 THEN
            v_total_amount := v_total_amount + (v_qty * v_price);
        END IF;

        IF v_product_id IS NOT NULL AND v_qty > 0 THEN
            -- Kunci baris batch secara individual
            PERFORM id 
            FROM public.sembako_stock_batches
            WHERE product_id = v_product_id AND is_deleted = false AND qty_sisa > 0
            FOR UPDATE;

            -- Hitung total stok yang tersedia
            SELECT COALESCE(SUM(qty_sisa), 0) INTO v_avail_stock
            FROM public.sembako_stock_batches
            WHERE product_id = v_product_id AND is_deleted = false AND qty_sisa > 0;

            IF v_avail_stock < v_qty THEN
                v_product_name := COALESCE(v_item->>'product_name', 'produk');
                RAISE EXCEPTION 'Stok % tidak cukup — tersedia %, diminta %', v_product_name, v_avail_stock, v_qty;
            END IF;
        END IF;
    END LOOP;

    -- 4. Calculate COGS (FIFO)
    FOR v_item IN SELECT * FROM jsonb_array_elements(p_items) LOOP
        v_prod_str := v_item->>'product_id';
        IF v_prod_str IS NOT NULL AND v_prod_str != '' AND v_prod_str != 'null' THEN
            v_product_id := v_prod_str::UUID;
        ELSE
            v_product_id := NULL;
        END IF;

        v_qty := COALESCE((v_item->>'quantity')::NUMERIC, 0);
        v_item_cogs := COALESCE((v_item->>'cogs_per_unit')::NUMERIC, 0);

        IF v_product_id IS NOT NULL AND v_qty > 0 THEN
            v_qty_needed := v_qty;
            v_item_cogs := 0;
            FOR v_batch IN 
                SELECT id, qty_sisa, buy_price 
                FROM public.sembako_stock_batches 
                WHERE product_id = v_product_id AND is_deleted = false AND qty_sisa > 0 
                ORDER BY created_at ASC 
            LOOP
                IF v_qty_needed <= 0 THEN EXIT; END IF;
                v_deduct := LEAST(v_batch.qty_sisa, v_qty_needed);
                v_item_cogs := v_item_cogs + (v_deduct * COALESCE(v_batch.buy_price, 0));
                v_qty_needed := v_qty_needed - v_deduct;
            END LOOP;
            IF v_qty > 0 THEN
                v_item_cogs := ROUND(v_item_cogs / v_qty);
            END IF;
        END IF;

        v_total_cogs := v_total_cogs + (v_qty * v_item_cogs);
    END LOOP;

    v_net_profit := GREATEST(0, v_total_amount - v_total_cogs - COALESCE(p_delivery_cost, 0) - COALESCE(p_other_cost, 0));

    -- 5. Insert Sale Main Record
    INSERT INTO public.sembako_sales (
        tenant_id, customer_id, customer_name, invoice_number,
        transaction_date, due_date, total_amount, total_cogs,
        net_profit, delivery_cost, other_cost, payment_status,
        paid_amount, remaining_amount, notes
    ) VALUES (
        p_tenant_id, p_customer_id, COALESCE(p_customer_name, 'Pelanggan'), v_invoice_number,
        COALESCE(p_transaction_date, NOW()), p_due_date, v_total_amount, v_total_cogs,
        v_net_profit, COALESCE(p_delivery_cost, 0), COALESCE(p_other_cost, 0), 'belum_lunas',
        0, v_total_amount, p_notes
    )
    RETURNING id INTO v_sale_id;

    -- 6. Insert Items & Perform FIFO Deductions
    FOR v_item IN SELECT * FROM jsonb_array_elements(p_items) LOOP
        v_prod_str := v_item->>'product_id';
        IF v_prod_str IS NOT NULL AND v_prod_str != '' AND v_prod_str != 'null' THEN
            v_product_id := v_prod_str::UUID;
        ELSE
            v_product_id := NULL;
        END IF;

        v_product_name := COALESCE(v_item->>'product_name', 'Produk');
        v_unit := COALESCE(v_item->>'unit', 'pcs');
        v_qty := COALESCE((v_item->>'quantity')::NUMERIC, 0);
        v_price := COALESCE((v_item->>'price_per_unit')::NUMERIC, (v_item->>'sell_price')::NUMERIC, 0);

        IF v_qty <= 0 THEN CONTINUE; END IF;

        -- Insert sale item (kolom harga jual adalah sell_price)
        INSERT INTO public.sembako_sale_items (
            sale_id, product_id, product_name, unit, quantity,
            sell_price, subtotal, cogs_per_unit, cogs_total
        ) VALUES (
            v_sale_id, v_product_id, v_product_name, v_unit, v_qty,
            v_price, ROUND(v_qty * v_price), v_item_cogs, ROUND(v_qty * v_item_cogs)
        );

        -- FIFO Deduction per batch
        IF v_product_id IS NOT NULL THEN
            v_qty_needed := v_qty;
            FOR v_batch IN 
                SELECT id, qty_sisa, buy_price 
                FROM public.sembako_stock_batches 
                WHERE product_id = v_product_id AND is_deleted = false AND qty_sisa > 0 
                ORDER BY created_at ASC 
            LOOP
                IF v_qty_needed <= 0 THEN EXIT; END IF;
                v_deduct := LEAST(v_batch.qty_sisa, v_qty_needed);

                -- Update batch stock
                UPDATE public.sembako_stock_batches 
                SET qty_sisa = qty_sisa - v_deduct 
                WHERE id = v_batch.id;

                -- Record stock out
                INSERT INTO public.sembako_stock_out (
                    tenant_id, product_id, batch_id, sale_id, qty_keluar, buy_price
                ) VALUES (
                    p_tenant_id, v_product_id, v_batch.id, v_sale_id, v_deduct, COALESCE(v_batch.buy_price, 0)
                );

                v_qty_needed := v_qty_needed - v_deduct;
            END LOOP;

            -- Sync product current_stock
            UPDATE public.sembako_products 
            SET current_stock = COALESCE((
                SELECT SUM(qty_sisa) FROM public.sembako_stock_batches 
                WHERE product_id = v_product_id AND is_deleted = false AND qty_sisa > 0
            ), 0)
            WHERE id = v_product_id;
        END IF;
    END LOOP;

    -- Return created sale JSON
    SELECT * INTO v_sale_record FROM public.sembako_sales WHERE id = v_sale_id;
    RETURN row_to_json(v_sale_record)::jsonb;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = public, pg_temp;

GRANT EXECUTE ON FUNCTION public.create_sembako_sale_transaction(UUID, UUID, TEXT, TIMESTAMPTZ, TIMESTAMPTZ, NUMERIC, NUMERIC, TEXT, JSONB) TO authenticated, anon;
