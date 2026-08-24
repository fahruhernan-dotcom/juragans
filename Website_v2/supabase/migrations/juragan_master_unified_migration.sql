-- ==============================================================================
-- JURAGAN BY ANAK BAWANG / SEMBAKO OS
-- MASTER UNIFIED DATABASE MIGRATION SCRIPT (FULL ERP + DYNAMIC BOM + B2B LEADS)
-- ==============================================================================
-- Cara Pakai:
-- Buka Supabase project yang dipakai di n8n -> Buka SQL Editor -> Paste & Klik RUN.
-- ==============================================================================

-- 1. EXTENSIONS & UTILITY FUNCTIONS
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";
CREATE EXTENSION IF NOT EXISTS pgcrypto;

CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
   NEW.updated_at = NOW();
   RETURN NEW;
END;
$$ LANGUAGE 'plpgsql';

-- Helper Tenant Security & Demo Fallback
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

-- ==============================================================================
-- 2. CORE MULTI-TENANT & AUTH TABLES
-- ==============================================================================

CREATE TABLE IF NOT EXISTS tenants (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    business_name TEXT NOT NULL,
    business_vertical TEXT DEFAULT 'distributor_sembako',
    user_type TEXT DEFAULT 'broker',
    sub_type TEXT DEFAULT 'distributor_sembako',
    owner_id UUID,
    plan TEXT DEFAULT 'starter',
    province TEXT,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS profiles (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    auth_user_id UUID NOT NULL,
    tenant_id UUID REFERENCES tenants(id) ON DELETE CASCADE,
    full_name TEXT NOT NULL,
    email TEXT,
    phone TEXT,
    role TEXT DEFAULT 'owner',
    app_role TEXT DEFAULT 'user',
    user_type TEXT DEFAULT 'broker',
    sub_type TEXT DEFAULT 'distributor_sembako',
    business_name TEXT,
    onboarded BOOLEAN DEFAULT true,
    business_model_selected BOOLEAN DEFAULT true,
    last_seen_at TIMESTAMPTZ DEFAULT NOW(),
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS tenant_memberships (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    auth_user_id UUID NOT NULL,
    tenant_id UUID REFERENCES tenants(id) ON DELETE CASCADE,
    role TEXT DEFAULT 'owner',
    app_role TEXT DEFAULT 'user',
    full_name TEXT,
    email TEXT,
    onboarded BOOLEAN DEFAULT true,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW(),
    UNIQUE(auth_user_id, tenant_id)
);

CREATE TABLE IF NOT EXISTS team_invitations (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    tenant_id UUID REFERENCES tenants(id) ON DELETE CASCADE,
    email TEXT NOT NULL,
    role TEXT NOT NULL DEFAULT 'staff',
    invited_by UUID,
    token TEXT UNIQUE NOT NULL,
    status TEXT DEFAULT 'pending',
    expires_at TIMESTAMPTZ,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- ==============================================================================
-- 3. ERP SEMBAKO TABLES (PRODUCTS, SUPPLIERS, CUSTOMERS, SALES, BATCHES)
-- ==============================================================================

CREATE TABLE IF NOT EXISTS sembako_products (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    tenant_id UUID REFERENCES tenants(id) ON DELETE CASCADE,
    sku TEXT DEFAULT '',
    product_name TEXT NOT NULL,
    category TEXT DEFAULT 'lainnya',
    unit TEXT DEFAULT 'pcs',
    current_stock NUMERIC(15,2) DEFAULT 0,
    min_stock_alert NUMERIC(15,2) DEFAULT 10,
    avg_buy_price NUMERIC(15,2) DEFAULT 0,
    sell_price NUMERIC(15,2) DEFAULT 0,
    notes TEXT,
    is_active BOOLEAN DEFAULT true,
    is_deleted BOOLEAN DEFAULT false,
    secondary_unit TEXT,
    conversion_rate NUMERIC(15,2),
    -- Multi-tier Regional Pricing
    harga_solo_rp NUMERIC(15,2) DEFAULT 0,
    harga_luar_kota_rp NUMERIC(15,2) DEFAULT 0,
    harga_grosir_rp NUMERIC(15,2) DEFAULT 0,
    harga_marketplace_promo_rp NUMERIC(15,2) DEFAULT 0,
    -- BOM Component Breakdown
    weight_gram INT DEFAULT 200,
    raw_ingredient_cost NUMERIC(15,2) DEFAULT 0,
    pouch_cost NUMERIC(15,2) DEFAULT 0,
    sticker_front_cost NUMERIC(15,2) DEFAULT 0,
    sticker_back_cost NUMERIC(15,2) DEFAULT 0,
    other_packaging_cost NUMERIC(15,2) DEFAULT 0,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS sembako_suppliers (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    tenant_id UUID REFERENCES tenants(id) ON DELETE CASCADE,
    supplier_name TEXT NOT NULL,
    phone TEXT DEFAULT '',
    address TEXT DEFAULT '',
    notes TEXT DEFAULT '',
    is_deleted BOOLEAN DEFAULT false,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS sembako_customers (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    tenant_id UUID REFERENCES tenants(id) ON DELETE CASCADE,
    customer_name TEXT NOT NULL,
    customer_type TEXT DEFAULT 'warung',
    phone TEXT DEFAULT '',
    address TEXT DEFAULT '',
    area TEXT DEFAULT '',
    payment_terms TEXT DEFAULT 'cash',
    credit_limit NUMERIC(15,2) DEFAULT 0,
    reliability_score NUMERIC(15,2) DEFAULT 100,
    notes TEXT DEFAULT '',
    is_deleted BOOLEAN DEFAULT false,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS sembako_stock_batches (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    tenant_id UUID REFERENCES tenants(id) ON DELETE CASCADE,
    product_id UUID REFERENCES sembako_products(id) ON DELETE CASCADE,
    supplier_id UUID REFERENCES sembako_suppliers(id) ON DELETE SET NULL,
    batch_number TEXT,
    qty_masuk NUMERIC(15,2) DEFAULT 0,
    qty_sisa NUMERIC(15,2) DEFAULT 0,
    buy_price NUMERIC(15,2) DEFAULT 0,
    entry_date DATE DEFAULT CURRENT_DATE,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS sembako_sales (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    tenant_id UUID REFERENCES tenants(id) ON DELETE CASCADE,
    customer_id UUID REFERENCES sembako_customers(id) ON DELETE SET NULL,
    customer_name TEXT,
    invoice_number TEXT,
    transaction_date TIMESTAMPTZ DEFAULT NOW(),
    due_date TIMESTAMPTZ,
    total_amount NUMERIC(15,2) DEFAULT 0,
    total_cogs NUMERIC(15,2) DEFAULT 0,
    delivery_cost NUMERIC(15,2) DEFAULT 0,
    other_cost NUMERIC(15,2) DEFAULT 0,
    net_profit NUMERIC(15,2) DEFAULT 0,
    paid_amount NUMERIC(15,2) DEFAULT 0,
    remaining_amount NUMERIC(15,2) DEFAULT 0,
    payment_status TEXT DEFAULT 'belum_lunas',
    notes TEXT,
    is_deleted BOOLEAN DEFAULT false,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS sembako_sale_items (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    tenant_id UUID REFERENCES tenants(id) ON DELETE CASCADE,
    sale_id UUID REFERENCES sembako_sales(id) ON DELETE CASCADE,
    product_id UUID REFERENCES sembako_products(id) ON DELETE SET NULL,
    product_name TEXT NOT NULL,
    unit TEXT DEFAULT 'pcs',
    quantity NUMERIC(15,2) DEFAULT 1,
    unit_price NUMERIC(15,2) DEFAULT 0,
    price_per_unit NUMERIC(15,2) DEFAULT 0,
    sell_price NUMERIC(15,2) DEFAULT 0,
    cogs_per_unit NUMERIC(15,2) DEFAULT 0,
    subtotal NUMERIC(15,2) DEFAULT 0,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS sembako_payments (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    tenant_id UUID REFERENCES tenants(id) ON DELETE CASCADE,
    sale_id UUID REFERENCES sembako_sales(id) ON DELETE CASCADE,
    payment_date TIMESTAMPTZ DEFAULT NOW(),
    amount_paid NUMERIC(15,2) DEFAULT 0,
    amount NUMERIC(15,2) DEFAULT 0,
    payment_method TEXT DEFAULT 'cash',
    notes TEXT,
    is_deleted BOOLEAN DEFAULT false,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS sembako_deliveries (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    tenant_id UUID REFERENCES tenants(id) ON DELETE CASCADE,
    sale_id UUID REFERENCES sembako_sales(id) ON DELETE SET NULL,
    driver_name TEXT,
    vehicle_type TEXT DEFAULT 'motor',
    delivery_status TEXT DEFAULT 'pending',
    delivery_cost NUMERIC(15,2) DEFAULT 0,
    destination_address TEXT,
    notes TEXT,
    is_deleted BOOLEAN DEFAULT false,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS sembako_returns (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    tenant_id UUID REFERENCES tenants(id) ON DELETE CASCADE,
    sale_id UUID REFERENCES sembako_sales(id) ON DELETE SET NULL,
    invoice_number TEXT,
    customer_name TEXT,
    product_id UUID REFERENCES sembako_products(id) ON DELETE SET NULL,
    product_name TEXT,
    quantity NUMERIC(15,2) DEFAULT 0,
    unit TEXT DEFAULT 'pcs',
    unit_price NUMERIC(15,2) DEFAULT 0,
    total_amount NUMERIC(15,2) DEFAULT 0,
    return_reason TEXT,
    return_status TEXT DEFAULT 'approved',
    refund_method TEXT DEFAULT 'potong_piutang',
    is_deleted BOOLEAN DEFAULT false,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS sembako_audit_logs (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    tenant_id UUID REFERENCES tenants(id) ON DELETE CASCADE,
    user_id UUID,
    user_name TEXT,
    action_type TEXT NOT NULL,
    product_name TEXT,
    old_value TEXT,
    new_value TEXT,
    notes TEXT,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS sembako_employees (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    tenant_id UUID REFERENCES tenants(id) ON DELETE CASCADE,
    name TEXT NOT NULL,
    role TEXT DEFAULT 'staff',
    phone TEXT,
    daily_wage NUMERIC(15,2) DEFAULT 0,
    monthly_salary NUMERIC(15,2) DEFAULT 0,
    is_active BOOLEAN DEFAULT true,
    is_deleted BOOLEAN DEFAULT false,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS sembako_attendance (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    tenant_id UUID REFERENCES tenants(id) ON DELETE CASCADE,
    employee_id UUID REFERENCES sembako_employees(id) ON DELETE CASCADE,
    attendance_date DATE DEFAULT CURRENT_DATE,
    status TEXT DEFAULT 'hadir',
    notes TEXT,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS sembako_payrolls (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    tenant_id UUID REFERENCES tenants(id) ON DELETE CASCADE,
    employee_id UUID REFERENCES sembako_employees(id) ON DELETE CASCADE,
    period_start DATE NOT NULL,
    period_end DATE NOT NULL,
    base_salary NUMERIC(15,2) DEFAULT 0,
    bonus NUMERIC(15,2) DEFAULT 0,
    deductions NUMERIC(15,2) DEFAULT 0,
    total_paid NUMERIC(15,2) DEFAULT 0,
    payment_status TEXT DEFAULT 'paid',
    payment_date TIMESTAMPTZ DEFAULT NOW(),
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- ==============================================================================
-- 4. DYNAMIC RAW MATERIALS & PACKAGING (BOM)
-- ==============================================================================

CREATE TABLE IF NOT EXISTS sembako_raw_materials (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    tenant_id UUID REFERENCES tenants(id) ON DELETE CASCADE,
    material_name TEXT NOT NULL,
    category TEXT DEFAULT 'kemasan', -- 'kemasan' | 'stiker' | 'kardus' | 'bahan_baku' | 'lainnya'
    unit TEXT DEFAULT 'pcs',         -- 'pcs' | 'lembar' | 'roll' | 'kg' | 'box'
    current_stock NUMERIC(15,2) DEFAULT 0,
    unit_cost NUMERIC(15,2) DEFAULT 0, -- HPP Satuan = Total Biaya / Qty
    total_spent NUMERIC(15,2) DEFAULT 0,
    min_stock_alert NUMERIC(15,2) DEFAULT 50,
    supplier_name TEXT,
    notes TEXT,
    is_deleted BOOLEAN DEFAULT false,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- ==============================================================================
-- 5. B2B LEADS & OUTREACH QUEUE (CONNECTING N8N & DASHBOARD WEB)
-- ==============================================================================

CREATE TABLE IF NOT EXISTS b2b_scraping_queue (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    tenant_id UUID REFERENCES tenants(id) ON DELETE SET NULL,
    target_location TEXT NOT NULL,
    country TEXT DEFAULT 'Singapore',
    city_or_region TEXT DEFAULT 'Singapore',
    status TEXT DEFAULT 'pending', -- 'pending' | 'in_progress' | 'completed' | 'failed'
    total_leads_found INT DEFAULT 0,
    last_scraped_at TIMESTAMPTZ,
    notes TEXT,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS b2b_leads (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    tenant_id UUID REFERENCES tenants(id) ON DELETE SET NULL,
    queue_id UUID REFERENCES b2b_scraping_queue(id) ON DELETE SET NULL,
    place_id TEXT,
    name TEXT NOT NULL,
    clean_name TEXT,
    category TEXT DEFAULT 'Indonesian restaurant',
    country TEXT DEFAULT 'Singapore',
    city TEXT DEFAULT 'Singapore',
    address TEXT,
    latitude NUMERIC(10,7),
    longitude NUMERIC(10,7),
    maps_url TEXT,
    phone TEXT,
    email TEXT,
    email_source TEXT,
    website TEXT,
    cms TEXT,
    has_contact_form BOOLEAN DEFAULT false,
    instagram_url TEXT,
    facebook_url TEXT,
    tiktok_url TEXT,
    linkedin_url TEXT,
    rating NUMERIC(3,2) DEFAULT 4.5,
    review_count INT DEFAULT 0,
    contactability_score INT DEFAULT 50,
    lead_priority TEXT DEFAULT 'warm', -- 'hot' | 'warm' | 'cold'
    status_email TEXT DEFAULT 'pending', -- 'pending' | 'sent' | 'replied' | 'bounced' | 'failed'
    status_whatsapp TEXT DEFAULT 'pending',
    pitch_subject TEXT,
    pitch_email TEXT,
    suggested_grade TEXT,
    notes TEXT,
    is_deleted BOOLEAN DEFAULT false,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- VIEW FOR N8N COLD OUTREACH POLLING
CREATE OR REPLACE VIEW v_n8n_pending_emails AS
SELECT 
    id AS lead_id,
    name AS restaurant_name,
    clean_name,
    category,
    country,
    city,
    address,
    email,
    rating,
    review_count,
    website,
    instagram_url,
    lead_priority,
    created_at
FROM b2b_leads
WHERE status_email = 'pending'
  AND email IS NOT NULL 
  AND email LIKE '%@%'
  AND is_deleted = false
ORDER BY 
    CASE lead_priority 
        WHEN 'hot' THEN 1 
        WHEN 'warm' THEN 2 
        ELSE 3 
    END,
    rating DESC,
    created_at ASC;

-- ==============================================================================
-- 6. POS TRANSACTION RPC (CREATE SALE & AUTO FIFO DEDUCTION)
-- ==============================================================================

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
    IF auth.uid() IS NOT NULL AND NOT public.has_tenant_access(p_tenant_id) THEN
        RAISE EXCEPTION 'Access Denied: User does not have access to tenant %', p_tenant_id;
    END IF;

    IF p_items IS NULL OR jsonb_typeof(p_items) != 'array' OR jsonb_array_length(p_items) = 0 THEN
        RAISE EXCEPTION 'Daftar produk tidak boleh kosong';
    END IF;

    v_date_str := to_char(COALESCE(p_transaction_date, NOW()), 'YYYYMMDD');
    v_rand := upper(substring(md5(random()::text) from 1 for 4));
    v_invoice_number := 'SMB-' || v_date_str || '-' || v_rand;

    -- Validasi Stok
    FOR v_item IN SELECT * FROM jsonb_array_elements(p_items) LOOP
        v_prod_str := v_item->>'product_id';
        IF v_prod_str IS NOT NULL AND v_prod_str ~* '^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$' THEN
            v_product_id := v_prod_str::UUID;
        ELSE
            v_product_id := NULL;
        END IF;

        v_product_name := COALESCE(v_item->>'product_name', 'Produk');
        v_qty := COALESCE((v_item->>'quantity')::NUMERIC, (v_item->>'qty')::NUMERIC, 1);
        v_price := COALESCE((v_item->>'price_per_unit')::NUMERIC, (v_item->>'sell_price')::NUMERIC, (v_item->>'price')::NUMERIC, 0);

        v_total_amount := v_total_amount + (v_qty * v_price);

        IF v_product_id IS NOT NULL THEN
            SELECT COALESCE(current_stock, 0) INTO v_avail_stock
            FROM public.sembako_products
            WHERE id = v_product_id AND tenant_id = p_tenant_id
            FOR UPDATE;

            IF v_avail_stock IS NOT NULL AND v_avail_stock < v_qty THEN
                RAISE EXCEPTION 'Stok produk % tidak mencukupi (Sisa: %, Diminta: %)', v_product_name, v_avail_stock, v_qty;
            END IF;
        END IF;
    END LOOP;

    -- Insert Sale Header
    INSERT INTO public.sembako_sales (
        tenant_id,
        customer_id,
        customer_name,
        invoice_number,
        transaction_date,
        due_date,
        total_amount,
        total_cogs,
        delivery_cost,
        other_cost,
        net_profit,
        paid_amount,
        remaining_amount,
        payment_status,
        notes
    ) VALUES (
        p_tenant_id,
        p_customer_id,
        p_customer_name,
        v_invoice_number,
        COALESCE(p_transaction_date, NOW()),
        p_due_date,
        v_total_amount,
        0,
        COALESCE(p_delivery_cost, 0),
        COALESCE(p_other_cost, 0),
        0,
        0,
        v_total_amount,
        'belum_lunas',
        p_notes
    ) RETURNING id INTO v_sale_id;

    -- Process Items & FIFO
    FOR v_item IN SELECT * FROM jsonb_array_elements(p_items) LOOP
        v_prod_str := v_item->>'product_id';
        IF v_prod_str IS NOT NULL AND v_prod_str ~* '^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$' THEN
            v_product_id := v_prod_str::UUID;
        ELSE
            v_product_id := NULL;
        END IF;

        v_product_name := COALESCE(v_item->>'product_name', 'Produk');
        v_unit := COALESCE(v_item->>'unit', 'pcs');
        v_qty := COALESCE((v_item->>'quantity')::NUMERIC, (v_item->>'qty')::NUMERIC, 1);
        v_price := COALESCE((v_item->>'price_per_unit')::NUMERIC, (v_item->>'sell_price')::NUMERIC, (v_item->>'price')::NUMERIC, 0);
        v_item_cogs := 0;

        IF v_product_id IS NOT NULL THEN
            v_qty_needed := v_qty;

            FOR v_batch IN (
                SELECT id, qty_sisa, buy_price
                FROM public.sembako_stock_batches
                WHERE product_id = v_product_id AND tenant_id = p_tenant_id AND qty_sisa > 0
                ORDER BY entry_date ASC, created_at ASC
                FOR UPDATE
            ) LOOP
                IF v_qty_needed <= 0 THEN
                    EXIT;
                END IF;

                v_deduct := LEAST(v_batch.qty_sisa, v_qty_needed);
                UPDATE public.sembako_stock_batches
                SET qty_sisa = qty_sisa - v_deduct, updated_at = NOW()
                WHERE id = v_batch.id;

                v_item_cogs := v_item_cogs + (v_deduct * COALESCE(v_batch.buy_price, 0));
                v_qty_needed := v_qty_needed - v_deduct;
            END LOOP;

            -- Fallback COGS if batch empty
            IF v_qty_needed > 0 THEN
                SELECT COALESCE(avg_buy_price, v_price * 0.75) INTO v_deduct
                FROM public.sembako_products WHERE id = v_product_id;
                v_item_cogs := v_item_cogs + (v_qty_needed * v_deduct);
            END IF;

            -- Update product current stock
            UPDATE public.sembako_products
            SET current_stock = GREATEST(0, current_stock - v_qty), updated_at = NOW()
            WHERE id = v_product_id;
        ELSE
            v_item_cogs := v_qty * (v_price * 0.75);
        END IF;

        v_total_cogs := v_total_cogs + v_item_cogs;

        INSERT INTO public.sembako_sale_items (
            tenant_id,
            sale_id,
            product_id,
            product_name,
            unit,
            quantity,
            unit_price,
            price_per_unit,
            sell_price,
            cogs_per_unit,
            subtotal
        ) VALUES (
            p_tenant_id,
            v_sale_id,
            v_product_id,
            v_product_name,
            v_unit,
            v_qty,
            v_price,
            v_price,
            v_price,
            CASE WHEN v_qty > 0 THEN ROUND(v_item_cogs / v_qty, 2) ELSE 0 END,
            v_qty * v_price
        );
    END LOOP;

    v_net_profit := GREATEST(0, (v_total_amount - v_total_cogs) - (COALESCE(p_delivery_cost, 0) + COALESCE(p_other_cost, 0)));

    UPDATE public.sembako_sales
    SET total_cogs = v_total_cogs, net_profit = v_net_profit, updated_at = NOW()
    WHERE id = v_sale_id
    RETURNING * INTO v_sale_record;

    RETURN to_jsonb(v_sale_record);
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = public, pg_temp;

-- ==============================================================================
-- 7. ROW LEVEL SECURITY (RLS) POLICIES
-- ==============================================================================

DO $$
DECLARE
    t text;
    tables text[] := ARRAY[
        'tenants', 'profiles', 'tenant_memberships', 'team_invitations',
        'sembako_products', 'sembako_suppliers', 'sembako_customers',
        'sembako_stock_batches', 'sembako_sales', 'sembako_sale_items',
        'sembako_payments', 'sembako_deliveries', 'sembako_returns',
        'sembako_audit_logs', 'sembako_employees', 'sembako_attendance',
        'sembako_payrolls', 'sembako_raw_materials', 'b2b_scraping_queue', 'b2b_leads'
    ];
BEGIN
    FOREACH t IN ARRAY tables LOOP
        EXECUTE format('ALTER TABLE IF EXISTS %I ENABLE ROW LEVEL SECURITY;', t);
        IF NOT EXISTS (
            SELECT 1 FROM pg_policies WHERE tablename = t AND policyname = t || '_all_policy'
        ) THEN
            EXECUTE format('CREATE POLICY %I ON %I FOR ALL USING (true) WITH CHECK (true);', t || '_all_policy', t);
        END IF;
    END LOOP;
END $$;

-- ==============================================================================
-- 8. DEFAULT DEMO TENANT & DATA SEED (FOR INSTANT ZERO-SETUP TESTING)
-- ==============================================================================

INSERT INTO tenants (id, business_name, business_vertical, user_type, sub_type, plan)
VALUES ('00000000-0000-0000-0000-000000000002', 'Juragan Bawang Boyolali', 'distributor_sembako', 'broker', 'distributor_sembako', 'pro')
ON CONFLICT (id) DO UPDATE SET business_name = EXCLUDED.business_name;

-- Sample Raw Materials (Bahan Baku & Kemasan)
INSERT INTO sembako_raw_materials (tenant_id, material_name, category, unit, current_stock, unit_cost, total_spent, min_stock_alert, supplier_name, notes)
VALUES
('00000000-0000-0000-0000-000000000002', 'Standing Pouch Matte 100g (Ziplock)', 'kemasan', 'pcs', 250, 1500, 375000, 50, 'Pabrik Kemasan Solo', 'Ukuran 12x20 cm matte ziplock'),
('00000000-0000-0000-0000-000000000002', 'Standing Pouch Matte 200g (Ziplock)', 'kemasan', 'pcs', 180, 1850, 333000, 50, 'Pabrik Kemasan Solo', 'Ukuran 14x22 cm matte ziplock'),
('00000000-0000-0000-0000-000000000002', 'Stiker Depan Gold Foil 100g', 'stiker', 'lembar', 300, 450, 135000, 50, 'Percetakan Stiker Jaya', 'Waterproof vinyl sticker label'),
('00000000-0000-0000-0000-000000000002', 'Stiker Belakang Nutrition & QR', 'stiker', 'lembar', 300, 350, 105000, 50, 'Percetakan Stiker Jaya', 'Stiker komposisi dan izin P-IRT'),
('00000000-0000-0000-0000-000000000002', 'Kardus Box Single Wall (Isi 24)', 'kardus', 'box', 45, 4500, 202500, 15, 'Kardus Karton Kartasura', 'Box tebal untuk kirim ke luar kota/ekspor'),
('00000000-0000-0000-0000-000000000002', 'Bawang Goreng Curah Grade Super', 'bahan_baku', 'kg', 60, 95000, 5700000, 15, 'Petani Bawang Boyolali', 'Bawang murni tanpa tepung berlebih')
ON CONFLICT DO NOTHING;

-- Initial Scraping Queue Target
INSERT INTO b2b_scraping_queue (tenant_id, target_location, country, city_or_region, status, notes)
VALUES
('00000000-0000-0000-0000-000000000002', 'Orchard Road, Singapore', 'Singapore', 'Central Singapore', 'pending', 'Fokus resto Padang, Ayam Penyet, dan Nusantara Resto'),
('00000000-0000-0000-0000-000000000002', 'Bangsar, Kuala Lumpur', 'Malaysia', 'Kuala Lumpur', 'pending', 'Target restoran Melayu & Indonesia di Bangsar')
ON CONFLICT DO NOTHING;
