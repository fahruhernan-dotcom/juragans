-- =============================================================================
-- GOPEK / SEMBAKO OS - ROBUST ATOMIC FIFO SALE TRANSACTION RPC
-- File: create_sembako_sale_transaction.sql
-- 
-- Perbaikan:
-- 1. Memperbaiki error PostgreSQL 42809 (FOR UPDATE cannot be used with aggregate SUM)
-- 2. Parsing UUID yang aman untuk product_id dan customer_id (mencegah syntax error "")
-- 3. Dukungan penuh untuk multi-tenant & demo fallback tenant
-- 4. Pengurangan stok FIFO atomik & kalkulasi laba bersih yang presisi
-- =============================================================================

-- Pastikan helper has_tenant_access sudah mendukung demo tenant & superadmin
CREATE OR REPLACE FUNCTION public.has_tenant_access(target_tenant_id UUID)
RETURNS BOOLEAN AS $$
BEGIN
  IF target_tenant_id IS NULL THEN
    RETURN TRUE;
  END IF;

  IF target_tenant_id = '00000000-0000-0000-0000-000000000002'::UUID THEN
    RETURN TRUE;
  END IF;

  IF auth.uid() IS NULL THEN
    RETURN FALSE;
  END IF;

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

-- Pastikan tabel sembako_sale_items memiliki kolom yang kompatibel
ALTER TABLE IF EXISTS public.sembako_sale_items ADD COLUMN IF NOT EXISTS sell_price NUMERIC(15,2) DEFAULT 0;
ALTER TABLE IF EXISTS public.sembako_sale_items ADD COLUMN IF NOT EXISTS price_per_unit NUMERIC(15,2) DEFAULT 0;

-- FUNGSI UTAMA: create_sembako_sale_transaction
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
    -- 1. Verify Tenant Security Access
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

    -- 3. Calculate Totals & Validasi Stok (Lock Batches FOR UPDATE tanpa fungsi aggregate)
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
            -- Kunci baris batch secara individual untuk mencegah race condition
            PERFORM id 
            FROM public.sembako_stock_batches
            WHERE product_id = v_product_id AND is_deleted = false AND qty_sisa > 0
            FOR UPDATE;

            -- Hitung total stok yang tersedia setelah lock
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
