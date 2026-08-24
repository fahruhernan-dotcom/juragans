-- ==============================================================================
-- TERNAKOS / SEMBAKO OS - MASTER FULL DATABASE SCHEMA (VERSION 3.0)
-- 
-- Panduan Eksekusi:
-- 1. Buka Supabase Dashboard -> SQL Editor
-- 2. Buat "New Query", paste seluruh isi file ini, lalu klik "Run" (Ctrl + Enter)
-- 3. Seluruh tabel, fungsi RPC atomik, RLS isolasi tenant, dan akun demo akan siap 100%.
-- ==============================================================================

-- ==============================================================================
-- 1. EXTENSIONS & UTILITY FUNCTIONS
-- ==============================================================================
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";
CREATE EXTENSION IF NOT EXISTS pgcrypto;

CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
   NEW.updated_at = NOW();
   RETURN NEW;
END;
$$ LANGUAGE 'plpgsql';

-- ==============================================================================
-- 2. CORE TABLES (MULTI-TENANT & USER ACCESS)
-- ==============================================================================

-- 2.1 TENANTS (ORGANISASI / TOKO)
CREATE TABLE IF NOT EXISTS tenants (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    business_name TEXT NOT NULL,
    business_vertical TEXT DEFAULT 'distributor_sembako',
    user_type TEXT DEFAULT 'broker',
    sub_type TEXT DEFAULT 'distributor_sembako',
    owner_id UUID,
    plan TEXT DEFAULT 'starter',
    province TEXT,
    plan_expires_at TIMESTAMPTZ,
    billing_whatsapp TEXT,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- 2.2 PROFILES (PENGGUNA & METADATA BISNIS)
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
    tutorials_completed JSONB DEFAULT '{}'::jsonb,
    last_seen_at TIMESTAMPTZ DEFAULT NOW(),
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- 2.3 TENANT MEMBERSHIPS (MULTI-TENANT ACCESS MAPPING)
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

-- 2.4 TEAM INVITATIONS
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
-- 3. SEMBAKO / POS / INVENTORY MODULE TABLES
-- ==============================================================================

-- 3.1 SEMBAKO PRODUCTS
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
    is_active BOOLEAN DEFAULT true,
    is_deleted BOOLEAN DEFAULT false,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- 3.2 SEMBAKO SUPPLIERS
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

-- 3.3 SEMBAKO CUSTOMERS (TOKO / WARUNG MITRA)
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

-- 3.4 SEMBAKO SALES (INVOICE PENJUALAN)
CREATE TABLE IF NOT EXISTS sembako_sales (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    tenant_id UUID REFERENCES tenants(id) ON DELETE CASCADE,
    customer_id UUID REFERENCES sembako_customers(id) ON DELETE SET NULL,
    customer_name TEXT,
    invoice_number TEXT,
    transaction_date TIMESTAMPTZ DEFAULT NOW(),
    due_date TIMESTAMPTZ,
    subtotal NUMERIC(15,2) DEFAULT 0,
    total_amount NUMERIC(15,2) DEFAULT 0,
    total_cogs NUMERIC(15,2) DEFAULT 0,
    delivery_cost NUMERIC(15,2) DEFAULT 0,
    other_cost NUMERIC(15,2) DEFAULT 0,
    net_profit NUMERIC(15,2) DEFAULT 0,
    paid_amount NUMERIC(15,2) DEFAULT 0,
    remaining_amount NUMERIC(15,2) DEFAULT 0,
    overpay_amount NUMERIC(15,2) DEFAULT 0,
    is_overpaid BOOLEAN DEFAULT false,
    payment_status TEXT DEFAULT 'belum_lunas',
    notes TEXT,
    is_deleted BOOLEAN DEFAULT false,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- 3.5 SEMBAKO SALE ITEMS
CREATE TABLE IF NOT EXISTS sembako_sale_items (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    sale_id UUID REFERENCES sembako_sales(id) ON DELETE CASCADE,
    product_id UUID REFERENCES sembako_products(id) ON DELETE SET NULL,
    product_name TEXT NOT NULL,
    unit TEXT,
    quantity NUMERIC(15,2) DEFAULT 0,
    price_per_unit NUMERIC(15,2) DEFAULT 0,
    sell_price NUMERIC(15,2) DEFAULT 0,
    subtotal NUMERIC(15,2) DEFAULT 0,
    cogs_per_unit NUMERIC(15,2) DEFAULT 0,
    cogs_total NUMERIC(15,2) DEFAULT 0,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 3.6 SEMBAKO STOCK BATCHES (FIFO INVENTORY)
CREATE TABLE IF NOT EXISTS sembako_stock_batches (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    tenant_id UUID REFERENCES tenants(id) ON DELETE CASCADE,
    product_id UUID REFERENCES sembako_products(id) ON DELETE CASCADE,
    supplier_id UUID REFERENCES sembako_suppliers(id) ON DELETE SET NULL,
    batch_code TEXT,
    qty_masuk NUMERIC(15,2) DEFAULT 0,
    qty_awal NUMERIC(15,2) DEFAULT 0,
    qty_sisa NUMERIC(15,2) DEFAULT 0,
    buy_price NUMERIC(15,2) DEFAULT 0,
    total_cost NUMERIC(15,2) DEFAULT 0,
    purchase_date TIMESTAMPTZ DEFAULT NOW(),
    expiry_date TIMESTAMPTZ,
    notes TEXT,
    is_deleted BOOLEAN DEFAULT false,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- 3.7 SEMBAKO STOCK OUT (HISTORI KELUAR BARANG)
CREATE TABLE IF NOT EXISTS sembako_stock_out (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    tenant_id UUID REFERENCES tenants(id) ON DELETE CASCADE,
    sale_id UUID REFERENCES sembako_sales(id) ON DELETE CASCADE,
    product_id UUID REFERENCES sembako_products(id) ON DELETE CASCADE,
    batch_id UUID REFERENCES sembako_stock_batches(id) ON DELETE CASCADE,
    qty_keluar NUMERIC(15,2) DEFAULT 0,
    buy_price NUMERIC(15,2) DEFAULT 0,
    reason TEXT DEFAULT 'sale',
    notes TEXT,
    is_deleted BOOLEAN DEFAULT false,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 3.8 SEMBAKO DELIVERIES (SURAT JALAN & LOGISTIK)
CREATE TABLE IF NOT EXISTS sembako_deliveries (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    tenant_id UUID REFERENCES tenants(id) ON DELETE CASCADE,
    sale_id UUID REFERENCES sembako_sales(id) ON DELETE CASCADE,
    employee_id UUID,
    driver_name TEXT,
    vehicle_type TEXT,
    vehicle_plate TEXT,
    delivery_date TIMESTAMPTZ DEFAULT NOW(),
    delivery_area TEXT,
    delivery_cost NUMERIC(15,2) DEFAULT 0,
    status TEXT DEFAULT 'pending',
    departed_at TIMESTAMPTZ,
    arrived_at TIMESTAMPTZ,
    completed_at TIMESTAMPTZ,
    delivery_notes TEXT,
    notes TEXT,
    is_deleted BOOLEAN DEFAULT false,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- 3.9 SEMBAKO EMPLOYEES (DATA KARYAWAN & SUPIR)
CREATE TABLE IF NOT EXISTS sembako_employees (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    tenant_id UUID REFERENCES tenants(id) ON DELETE CASCADE,
    full_name TEXT NOT NULL,
    role TEXT DEFAULT 'Staff',
    phone TEXT,
    base_salary NUMERIC(15,2) DEFAULT 0,
    status TEXT DEFAULT 'aktif',
    is_deleted BOOLEAN DEFAULT false,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- 3.10 SEMBAKO PAYROLL (PENGGAJIAN & KOMISI)
CREATE TABLE IF NOT EXISTS sembako_payroll (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    tenant_id UUID REFERENCES tenants(id) ON DELETE CASCADE,
    employee_id UUID REFERENCES sembako_employees(id) ON DELETE CASCADE,
    period_type TEXT DEFAULT 'bulanan',
    period_date TIMESTAMPTZ DEFAULT NOW(),
    work_days NUMERIC(5,2) DEFAULT 0,
    trip_count NUMERIC(5,2) DEFAULT 0,
    sales_amount NUMERIC(15,2) DEFAULT 0,
    base_salary NUMERIC(15,2) DEFAULT 0,
    base_amount NUMERIC(15,2) DEFAULT 0,
    commission_amount NUMERIC(15,2) DEFAULT 0,
    bonus NUMERIC(15,2) DEFAULT 0,
    deductions NUMERIC(15,2) DEFAULT 0,
    deduction NUMERIC(15,2) DEFAULT 0,
    total_pay NUMERIC(15,2) DEFAULT 0,
    payment_status TEXT DEFAULT 'pending',
    paid_at TIMESTAMPTZ,
    notes TEXT,
    is_deleted BOOLEAN DEFAULT false,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- 3.11 SEMBAKO EXPENSES (BIAYA OPERASIONAL)
CREATE TABLE IF NOT EXISTS sembako_expenses (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    tenant_id UUID REFERENCES tenants(id) ON DELETE CASCADE,
    category TEXT DEFAULT 'operasional',
    description TEXT,
    amount NUMERIC(15,2) DEFAULT 0,
    expense_date TIMESTAMPTZ DEFAULT NOW(),
    is_deleted BOOLEAN DEFAULT false,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- 3.12 SEMBAKO PAYMENTS (PEMBAYARAN PIUTANG & REFUND)
CREATE TABLE IF NOT EXISTS sembako_payments (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    tenant_id UUID REFERENCES tenants(id) ON DELETE CASCADE,
    sale_id UUID REFERENCES sembako_sales(id) ON DELETE CASCADE,
    customer_id UUID REFERENCES sembako_customers(id) ON DELETE SET NULL,
    amount NUMERIC(15,2) DEFAULT 0,
    payment_date TIMESTAMPTZ DEFAULT NOW(),
    payment_method TEXT DEFAULT 'cash',
    reference_number TEXT,
    notes TEXT,
    is_deleted BOOLEAN DEFAULT false,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 3.13 SEMBAKO SUPPLIER PAYMENTS (PEMBAYARAN HUTANG KE SUPPLIER)
CREATE TABLE IF NOT EXISTS sembako_supplier_payments (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    tenant_id UUID REFERENCES tenants(id) ON DELETE CASCADE,
    supplier_id UUID REFERENCES sembako_suppliers(id) ON DELETE CASCADE,
    amount NUMERIC(15,2) DEFAULT 0,
    payment_date TIMESTAMPTZ DEFAULT NOW(),
    payment_method TEXT DEFAULT 'cash',
    reference_number TEXT,
    notes TEXT,
    is_deleted BOOLEAN DEFAULT false,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 3.14 SEMBAKO RETURNS (RETUR BARANG & REFUND)
CREATE TABLE IF NOT EXISTS sembako_returns (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    tenant_id UUID REFERENCES tenants(id) ON DELETE CASCADE,
    sale_id UUID REFERENCES sembako_sales(id) ON DELETE SET NULL,
    created_by UUID,
    return_number TEXT,
    return_type TEXT DEFAULT 'sale_return',
    party_name TEXT DEFAULT '',
    product_id UUID REFERENCES sembako_products(id) ON DELETE SET NULL,
    product_name TEXT DEFAULT '',
    customer_id UUID REFERENCES sembako_customers(id) ON DELETE SET NULL,
    supplier_id UUID REFERENCES sembako_suppliers(id) ON DELETE SET NULL,
    quantity NUMERIC(15,2) DEFAULT 1,
    unit TEXT DEFAULT 'pcs',
    unit_price NUMERIC(15,2) DEFAULT 0,
    cogs_per_unit NUMERIC(15,2) DEFAULT 0,
    total_amount NUMERIC(15,2) DEFAULT 0,
    reason TEXT DEFAULT 'Lainnya',
    action TEXT DEFAULT 'fifo_stock',
    status TEXT DEFAULT 'pending',
    notes TEXT DEFAULT '',
    is_deleted BOOLEAN DEFAULT false,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- 3.15 SEMBAKO AUDIT LOGS
CREATE TABLE IF NOT EXISTS sembako_audit_logs (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    tenant_id UUID REFERENCES tenants(id) ON DELETE CASCADE,
    user_name TEXT DEFAULT 'Sistem',
    role TEXT DEFAULT 'staff',
    action_type TEXT NOT NULL,
    product_name TEXT,
    old_qty NUMERIC(15,2),
    new_qty NUMERIC(15,2),
    notes TEXT,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- ==============================================================================
-- 4. NOTIFICATION & APP RELEASE INFRASTRUCTURE
-- ==============================================================================

-- 4.1 DEVICE TOKENS (FCM PUSH NOTIFICATION)
CREATE TABLE IF NOT EXISTS device_tokens (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    tenant_id UUID NOT NULL REFERENCES tenants(id) ON DELETE CASCADE,
    user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    device_token TEXT NOT NULL,
    platform TEXT NOT NULL DEFAULT 'android',
    device_name TEXT,
    is_active BOOLEAN NOT NULL DEFAULT TRUE,
    last_seen TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    CONSTRAINT uq_device_token UNIQUE (device_token)
);

-- 4.2 NOTIFICATION PREFERENCES
CREATE TABLE IF NOT EXISTS notification_preferences (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    tenant_id UUID NOT NULL REFERENCES tenants(id) ON DELETE CASCADE,
    user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    notify_sales_new BOOLEAN NOT NULL DEFAULT TRUE,
    notify_sales_paid BOOLEAN NOT NULL DEFAULT TRUE,
    notify_stock_empty BOOLEAN NOT NULL DEFAULT TRUE,
    notify_stock_expiring BOOLEAN NOT NULL DEFAULT TRUE,
    notify_debt_due BOOLEAN NOT NULL DEFAULT TRUE,
    notify_delivery_done BOOLEAN NOT NULL DEFAULT TRUE,
    notify_app_update BOOLEAN NOT NULL DEFAULT TRUE,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    CONSTRAINT uq_user_tenant_pref UNIQUE (user_id, tenant_id)
);

-- 4.3 NOTIFICATIONS (IN-APP BELL 🔔)
CREATE TABLE IF NOT EXISTS notifications (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    tenant_id UUID NOT NULL REFERENCES tenants(id) ON DELETE CASCADE,
    user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
    target_role TEXT,
    title TEXT NOT NULL,
    body TEXT NOT NULL,
    category TEXT NOT NULL DEFAULT 'system',
    action_url TEXT,
    metadata JSONB DEFAULT '{}'::jsonb,
    is_read BOOLEAN NOT NULL DEFAULT FALSE,
    read_at TIMESTAMPTZ,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- 4.4 NOTIFICATION EVENTS (EVENT OUTBOX QUEUE)
CREATE TABLE IF NOT EXISTS notification_events (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    tenant_id UUID NOT NULL REFERENCES tenants(id) ON DELETE CASCADE,
    event_type TEXT NOT NULL,
    title TEXT NOT NULL,
    body TEXT NOT NULL,
    payload JSONB DEFAULT '{}'::jsonb,
    target_users UUID[],
    target_roles TEXT[],
    action_url TEXT,
    is_processed BOOLEAN NOT NULL DEFAULT FALSE,
    processed_at TIMESTAMPTZ,
    error_message TEXT,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- 4.5 APP RELEASES (OTA UPDATE / APK VERSIONING)
CREATE TABLE IF NOT EXISTS app_releases (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    version TEXT NOT NULL,
    version_code INTEGER NOT NULL,
    release_notes TEXT DEFAULT '',
    download_url TEXT NOT NULL,
    apk_file_name TEXT DEFAULT '',
    file_size_bytes BIGINT DEFAULT 0,
    min_supported_version TEXT DEFAULT '1.0.0',
    is_critical BOOLEAN DEFAULT FALSE,
    is_active BOOLEAN DEFAULT TRUE,
    published_by UUID REFERENCES auth.users(id) ON DELETE SET NULL,
    published_at TIMESTAMPTZ DEFAULT NOW(),
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW(),
    CONSTRAINT uq_app_releases_version_code UNIQUE (version_code)
);

-- ==============================================================================
-- 5. TRIGGER REGISTRATIONS
-- ==============================================================================
DO $$
DECLARE
    t text;
BEGIN
    FOR t IN 
        SELECT unnest(ARRAY[
            'tenants', 'profiles', 'tenant_memberships', 'sembako_products', 
            'sembako_suppliers', 'sembako_customers', 'sembako_sales', 
            'sembako_stock_batches', 'sembako_deliveries', 'sembako_employees', 
            'sembako_payroll', 'sembako_expenses', 'sembako_returns',
            'device_tokens', 'notification_preferences', 'app_releases'
        ])
    LOOP
        EXECUTE format('DROP TRIGGER IF EXISTS trg_update_%I ON %I;', t, t);
        EXECUTE format('CREATE TRIGGER trg_update_%I BEFORE UPDATE ON %I FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();', t, t);
    END LOOP;
END $$;

-- ==============================================================================
-- 6. RPC FUNCTIONS & ATOMIC FIFO TRANSACTION
-- ==============================================================================

-- 6.1 HELPER: TENANT ACCESS VALIDATOR
CREATE OR REPLACE FUNCTION public.has_tenant_access(target_tenant_id UUID)
RETURNS BOOLEAN AS $$
BEGIN
  IF target_tenant_id IS NULL THEN
    RETURN TRUE;
  END IF;

  -- Demo Tenant bypass
  IF target_tenant_id = '00000000-0000-0000-0000-000000000002'::UUID THEN
    RETURN TRUE;
  END IF;

  IF auth.uid() IS NULL THEN
    RETURN FALSE;
  END IF;

  -- Superadmin check
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
$$ LANGUAGE plpgsql SECURITY DEFINER STABLE;

-- 6.2 HELPER: SYNC SALE FINANCIALS & REFUND
CREATE OR REPLACE FUNCTION fn_sync_sembako_sale_financials(p_sale_id UUID)
RETURNS VOID AS $$
DECLARE
    v_items_subtotal NUMERIC(15,2) := 0;
    v_returns_total NUMERIC(15,2) := 0;
    v_returns_cogs NUMERIC(15,2) := 0;
    v_raw_payments NUMERIC(15,2) := 0;
    v_refund_payments NUMERIC(15,2) := 0;
    v_final_paid NUMERIC(15,2) := 0;
    v_final_cogs NUMERIC(15,2) := 0;
    v_delivery_cost NUMERIC(15,2) := 0;
    v_other_cost NUMERIC(15,2) := 0;
    v_net_sales NUMERIC(15,2) := 0;
    v_remaining NUMERIC(15,2) := 0;
    v_overpay NUMERIC(15,2) := 0;
    v_is_overpaid BOOLEAN := false;
    v_payment_status TEXT := 'belum_lunas';
    v_net_profit NUMERIC(15,2) := 0;
    v_orig_cogs NUMERIC(15,2) := 0;
BEGIN
    SELECT COALESCE(SUM(subtotal), 0), COALESCE(SUM(cogs_total), 0)
    INTO v_items_subtotal, v_orig_cogs
    FROM sembako_sale_items
    WHERE sale_id = p_sale_id;

    SELECT COALESCE(SUM(total_amount), 0), COALESCE(SUM(quantity * cogs_per_unit), 0)
    INTO v_returns_total, v_returns_cogs
    FROM sembako_returns
    WHERE sale_id = p_sale_id AND is_deleted = false;

    SELECT 
        COALESCE(SUM(CASE WHEN amount > 0 THEN amount ELSE 0 END), 0),
        COALESCE(SUM(CASE WHEN amount < 0 THEN ABS(amount) ELSE 0 END), 0)
    INTO v_raw_payments, v_refund_payments
    FROM sembako_payments
    WHERE sale_id = p_sale_id AND is_deleted = false;

    v_final_paid := v_raw_payments - v_refund_payments;

    SELECT COALESCE(delivery_cost, 0), COALESCE(other_cost, 0)
    INTO v_delivery_cost, v_other_cost
    FROM sembako_sales
    WHERE id = p_sale_id;

    v_net_sales := GREATEST(0, (v_items_subtotal - v_returns_total) + v_delivery_cost + v_other_cost);
    v_final_cogs := GREATEST(0, v_orig_cogs - v_returns_cogs);
    v_net_profit := (v_items_subtotal - v_returns_total) - v_final_cogs - v_delivery_cost - v_other_cost;

    IF v_final_paid >= v_net_sales THEN
        v_remaining := 0;
        v_overpay := v_final_paid - v_net_sales;
        v_is_overpaid := (v_overpay > 0);
        v_payment_status := 'lunas';
    ELSE
        v_remaining := v_net_sales - v_final_paid;
        v_overpay := 0;
        v_is_overpaid := false;
        IF v_final_paid > 0 THEN
            v_payment_status := 'sebagian';
        ELSE
            v_payment_status := 'belum_lunas';
        END IF;
    END IF;

    UPDATE sembako_sales
    SET subtotal = v_items_subtotal,
        total_amount = v_net_sales,
        total_cogs = v_final_cogs,
        net_profit = v_net_profit,
        paid_amount = v_final_paid,
        remaining_amount = v_remaining,
        overpay_amount = v_overpay,
        is_overpaid = v_is_overpaid,
        payment_status = v_payment_status,
        updated_at = NOW()
    WHERE id = p_sale_id;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- 6.3 RPC: CREATE ATOMIC FIFO SALE TRANSACTION
CREATE OR REPLACE FUNCTION public.create_sembako_sale_transaction(
  p_tenant_id UUID,
  p_customer_id UUID,
  p_customer_name TEXT,
  p_invoice_number TEXT,
  p_transaction_date TIMESTAMPTZ,
  p_due_date TIMESTAMPTZ,
  p_delivery_cost NUMERIC,
  p_other_cost NUMERIC,
  p_paid_amount NUMERIC,
  p_notes TEXT,
  p_items JSONB,
  p_is_delivery BOOLEAN DEFAULT FALSE,
  p_driver_name TEXT DEFAULT NULL,
  p_delivery_area TEXT DEFAULT NULL
)
RETURNS JSONB
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_sale_id UUID;
  v_delivery_id UUID;
  v_total_subtotal NUMERIC(15,2) := 0;
  v_total_cogs NUMERIC(15,2) := 0;
  v_total_amount NUMERIC(15,2) := 0;
  v_net_profit NUMERIC(15,2) := 0;
  v_remaining_amount NUMERIC(15,2) := 0;
  v_payment_status TEXT := 'belum_lunas';
  
  v_item JSONB;
  v_product_id UUID;
  v_product_name TEXT;
  v_unit TEXT;
  v_quantity NUMERIC(15,2);
  v_sell_price NUMERIC(15,2);
  v_item_subtotal NUMERIC(15,2);
  
  v_item_cogs_total NUMERIC(15,2);
  v_item_cogs_per_unit NUMERIC(15,2);
  v_qty_needed NUMERIC(15,2);
  v_batch RECORD;
  v_take_qty NUMERIC(15,2);
  v_current_total_stock NUMERIC(15,2);
  v_available_batch_stock NUMERIC(15,2);
  v_product RECORD;
BEGIN
  IF NOT has_tenant_access(p_tenant_id) THEN
    RAISE EXCEPTION 'Akses ditolak: Anda tidak memiliki akses ke tenant ini.';
  END IF;

  IF p_items IS NULL OR jsonb_array_length(p_items) = 0 THEN
    RAISE EXCEPTION 'Item penjualan tidak boleh kosong.';
  END IF;

  -- 1. Validasi kecukupan stok semua item
  FOR v_item IN SELECT * FROM jsonb_array_elements(p_items)
  LOOP
    IF (v_item->>'product_id') IS NULL OR (v_item->>'product_id') = '' THEN
      RAISE EXCEPTION 'Format data salah: product_id kosong.';
    END IF;
    
    v_product_id := (v_item->>'product_id')::UUID;
    v_quantity   := COALESCE((v_item->>'quantity')::NUMERIC, 0);

    SELECT * INTO v_product FROM sembako_products WHERE id = v_product_id AND tenant_id = p_tenant_id;
    IF NOT FOUND THEN
      RAISE EXCEPTION 'Produk dengan ID % tidak ditemukan pada tenant ini.', v_product_id;
    END IF;

    SELECT COALESCE(SUM(qty_sisa), 0) INTO v_available_batch_stock
    FROM sembako_stock_batches
    WHERE product_id = v_product_id 
      AND tenant_id = p_tenant_id 
      AND qty_sisa > 0 
      AND is_deleted = false;

    IF v_available_batch_stock < v_quantity THEN
      RAISE EXCEPTION 'Stok batch tidak mencukupi untuk % (Sisa batch: %, Dibutuhkan: %).', 
        v_product.product_name, v_available_batch_stock, v_quantity;
    END IF;
  END LOOP;

  -- 2. Insert master invoice awal
  INSERT INTO sembako_sales (
    tenant_id, customer_id, customer_name, invoice_number,
    transaction_date, due_date, subtotal, total_amount,
    total_cogs, delivery_cost, other_cost, net_profit,
    paid_amount, remaining_amount, payment_status, notes
  ) VALUES (
    p_tenant_id, p_customer_id, p_customer_name, p_invoice_number,
    COALESCE(p_transaction_date, NOW()), p_due_date, 0, 0,
    0, COALESCE(p_delivery_cost, 0), COALESCE(p_other_cost, 0), 0,
    COALESCE(p_paid_amount, 0), 0, 'belum_lunas', p_notes
  )
  RETURNING id INTO v_sale_id;

  -- 3. Loop eksekusi FIFO per item
  FOR v_item IN SELECT * FROM jsonb_array_elements(p_items)
  LOOP
    v_product_id   := (v_item->>'product_id')::UUID;
    v_product_name := v_item->>'product_name';
    v_unit         := COALESCE(v_item->>'unit', 'pcs');
    v_quantity     := (v_item->>'quantity')::NUMERIC;
    v_sell_price   := (v_item->>'price_per_unit')::NUMERIC;
    v_item_subtotal := v_quantity * v_sell_price;
    v_total_subtotal := v_total_subtotal + v_item_subtotal;

    v_qty_needed := v_quantity;
    v_item_cogs_total := 0;

    FOR v_batch IN 
      SELECT id, qty_sisa, buy_price 
      FROM sembako_stock_batches 
      WHERE product_id = v_product_id 
        AND tenant_id = p_tenant_id 
        AND qty_sisa > 0 
        AND is_deleted = false
      ORDER BY purchase_date ASC, created_at ASC
      FOR UPDATE
    LOOP
      IF v_qty_needed <= 0 THEN
        EXIT;
      END IF;

      IF v_batch.qty_sisa >= v_qty_needed THEN
        v_take_qty := v_qty_needed;
      ELSE
        v_take_qty := v_batch.qty_sisa;
      END IF;

      UPDATE sembako_stock_batches
      SET qty_sisa = qty_sisa - v_take_qty, updated_at = NOW()
      WHERE id = v_batch.id;

      INSERT INTO sembako_stock_out (
        tenant_id, sale_id, product_id, batch_id,
        qty_keluar, buy_price, reason, notes
      ) VALUES (
        p_tenant_id, v_sale_id, v_product_id, v_batch.id,
        v_take_qty, v_batch.buy_price, 'sale', 'Nota: ' || p_invoice_number
      );

      v_item_cogs_total := v_item_cogs_total + (v_take_qty * v_batch.buy_price);
      v_qty_needed := v_qty_needed - v_take_qty;
    END LOOP;

    IF v_quantity > 0 THEN
      v_item_cogs_per_unit := v_item_cogs_total / v_quantity;
    ELSE
      v_item_cogs_per_unit := 0;
    END IF;

    v_total_cogs := v_total_cogs + v_item_cogs_total;

    INSERT INTO sembako_sale_items (
      sale_id, product_id, product_name, unit,
      quantity, price_per_unit, sell_price, subtotal,
      cogs_per_unit, cogs_total
    ) VALUES (
      v_sale_id, v_product_id, v_product_name, v_unit,
      v_quantity, v_sell_price, v_sell_price, v_item_subtotal,
      v_item_cogs_per_unit, v_item_cogs_total
    );

    UPDATE sembako_products
    SET current_stock = GREATEST(0, current_stock - v_quantity), updated_at = NOW()
    WHERE id = v_product_id;
  END LOOP;

  -- 4. Hitung total akhir
  v_total_amount := v_total_subtotal + COALESCE(p_delivery_cost, 0) + COALESCE(p_other_cost, 0);
  v_net_profit   := v_total_subtotal - v_total_cogs - COALESCE(p_delivery_cost, 0) - COALESCE(p_other_cost, 0);
  
  IF COALESCE(p_paid_amount, 0) >= v_total_amount THEN
    v_payment_status := 'lunas';
    v_remaining_amount := 0;
  ELSIF COALESCE(p_paid_amount, 0) > 0 THEN
    v_payment_status := 'sebagian';
    v_remaining_amount := v_total_amount - p_paid_amount;
  ELSE
    v_payment_status := 'belum_lunas';
    v_remaining_amount := v_total_amount;
  END IF;

  UPDATE sembako_sales
  SET subtotal = v_total_subtotal,
      total_amount = v_total_amount,
      total_cogs = v_total_cogs,
      net_profit = v_net_profit,
      remaining_amount = v_remaining_amount,
      payment_status = v_payment_status,
      updated_at = NOW()
  WHERE id = v_sale_id;

  -- 5. Jika ada pembayaran DP / Tunai di muka
  IF COALESCE(p_paid_amount, 0) > 0 THEN
    INSERT INTO sembako_payments (
      tenant_id, sale_id, customer_id, amount,
      payment_date, payment_method, notes
    ) VALUES (
      p_tenant_id, v_sale_id, p_customer_id, p_paid_amount,
      COALESCE(p_transaction_date, NOW()), 'cash', 'Pembayaran Awal Kasir'
    );
  END IF;

  -- 6. Jika dipilih buat Surat Jalan Pengiriman
  IF p_is_delivery = TRUE THEN
    INSERT INTO sembako_deliveries (
      tenant_id, sale_id, driver_name, delivery_area,
      delivery_cost, status, delivery_date
    ) VALUES (
      p_tenant_id, v_sale_id, p_driver_name, p_delivery_area,
      COALESCE(p_delivery_cost, 0), 'pending', COALESCE(p_transaction_date, NOW())
    ) RETURNING id INTO v_delivery_id;
  END IF;

  RETURN jsonb_build_object(
    'success', true,
    'sale_id', v_sale_id,
    'delivery_id', v_delivery_id,
    'invoice_number', p_invoice_number,
    'total_amount', v_total_amount,
    'net_profit', v_net_profit,
    'remaining_amount', v_remaining_amount,
    'payment_status', v_payment_status
  );
END;
$$;

-- ==============================================================================
-- 7. ROW LEVEL SECURITY (RLS) POLICIES
-- ==============================================================================

-- Aktifkan RLS pada seluruh tabel
ALTER TABLE tenants ENABLE ROW LEVEL SECURITY;
ALTER TABLE profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE tenant_memberships ENABLE ROW LEVEL SECURITY;
ALTER TABLE team_invitations ENABLE ROW LEVEL SECURITY;
ALTER TABLE sembako_products ENABLE ROW LEVEL SECURITY;
ALTER TABLE sembako_suppliers ENABLE ROW LEVEL SECURITY;
ALTER TABLE sembako_customers ENABLE ROW LEVEL SECURITY;
ALTER TABLE sembako_sales ENABLE ROW LEVEL SECURITY;
ALTER TABLE sembako_sale_items ENABLE ROW LEVEL SECURITY;
ALTER TABLE sembako_stock_batches ENABLE ROW LEVEL SECURITY;
ALTER TABLE sembako_stock_out ENABLE ROW LEVEL SECURITY;
ALTER TABLE sembako_deliveries ENABLE ROW LEVEL SECURITY;
ALTER TABLE sembako_employees ENABLE ROW LEVEL SECURITY;
ALTER TABLE sembako_payroll ENABLE ROW LEVEL SECURITY;
ALTER TABLE sembako_expenses ENABLE ROW LEVEL SECURITY;
ALTER TABLE sembako_payments ENABLE ROW LEVEL SECURITY;
ALTER TABLE sembako_supplier_payments ENABLE ROW LEVEL SECURITY;
ALTER TABLE sembako_returns ENABLE ROW LEVEL SECURITY;
ALTER TABLE sembako_audit_logs ENABLE ROW LEVEL SECURITY;
ALTER TABLE device_tokens ENABLE ROW LEVEL SECURITY;
ALTER TABLE notification_preferences ENABLE ROW LEVEL SECURITY;
ALTER TABLE notifications ENABLE ROW LEVEL SECURITY;
ALTER TABLE notification_events ENABLE ROW LEVEL SECURITY;
ALTER TABLE app_releases ENABLE ROW LEVEL SECURITY;

-- Pasang Policy Isolasi Multi-Tenant
CREATE POLICY "Tenant Isolation for tenants" ON tenants FOR ALL
USING (auth.uid() IS NOT NULL AND (id IN (SELECT tenant_id FROM public.profiles WHERE auth_user_id = auth.uid()) OR id IN (SELECT tenant_id FROM public.tenant_memberships WHERE auth_user_id = auth.uid()) OR owner_id = auth.uid() OR COALESCE((auth.jwt() -> 'app_metadata' ->> 'is_superadmin')::boolean, false) = true))
WITH CHECK (auth.uid() IS NOT NULL AND (id IN (SELECT tenant_id FROM public.profiles WHERE auth_user_id = auth.uid()) OR id IN (SELECT tenant_id FROM public.tenant_memberships WHERE auth_user_id = auth.uid()) OR owner_id = auth.uid() OR COALESCE((auth.jwt() -> 'app_metadata' ->> 'is_superadmin')::boolean, false) = true));

CREATE POLICY "Tenant Isolation for profiles" ON profiles FOR ALL
USING (auth.uid() IS NOT NULL AND (auth_user_id = auth.uid() OR has_tenant_access(tenant_id)))
WITH CHECK (auth.uid() IS NOT NULL AND (auth_user_id = auth.uid() OR has_tenant_access(tenant_id)));

CREATE POLICY "Tenant Isolation for tenant_memberships" ON tenant_memberships FOR ALL
USING (auth.uid() IS NOT NULL AND (auth_user_id = auth.uid() OR has_tenant_access(tenant_id)))
WITH CHECK (auth.uid() IS NOT NULL AND (auth_user_id = auth.uid() OR has_tenant_access(tenant_id)));

CREATE POLICY "Tenant Isolation for team_invitations" ON team_invitations FOR ALL
USING (has_tenant_access(tenant_id)) WITH CHECK (has_tenant_access(tenant_id));

CREATE POLICY "Tenant Isolation for sembako_products" ON sembako_products FOR ALL
USING (has_tenant_access(tenant_id)) WITH CHECK (has_tenant_access(tenant_id));

CREATE POLICY "Tenant Isolation for sembako_suppliers" ON sembako_suppliers FOR ALL
USING (has_tenant_access(tenant_id)) WITH CHECK (has_tenant_access(tenant_id));

CREATE POLICY "Tenant Isolation for sembako_customers" ON sembako_customers FOR ALL
USING (has_tenant_access(tenant_id)) WITH CHECK (has_tenant_access(tenant_id));

CREATE POLICY "Tenant Isolation for sembako_sales" ON sembako_sales FOR ALL
USING (has_tenant_access(tenant_id)) WITH CHECK (has_tenant_access(tenant_id));

CREATE POLICY "Tenant Isolation for sembako_sale_items" ON sembako_sale_items FOR ALL
USING (EXISTS (SELECT 1 FROM public.sembako_sales WHERE sembako_sales.id = sembako_sale_items.sale_id AND has_tenant_access(sembako_sales.tenant_id)))
WITH CHECK (EXISTS (SELECT 1 FROM public.sembako_sales WHERE sembako_sales.id = sembako_sale_items.sale_id AND has_tenant_access(sembako_sales.tenant_id)));

CREATE POLICY "Tenant Isolation for sembako_stock_batches" ON sembako_stock_batches FOR ALL
USING (has_tenant_access(tenant_id)) WITH CHECK (has_tenant_access(tenant_id));

CREATE POLICY "Tenant Isolation for sembako_stock_out" ON sembako_stock_out FOR ALL
USING (has_tenant_access(tenant_id)) WITH CHECK (has_tenant_access(tenant_id));

CREATE POLICY "Tenant Isolation for sembako_deliveries" ON sembako_deliveries FOR ALL
USING (has_tenant_access(tenant_id)) WITH CHECK (has_tenant_access(tenant_id));

CREATE POLICY "Tenant Isolation for sembako_employees" ON sembako_employees FOR ALL
USING (has_tenant_access(tenant_id)) WITH CHECK (has_tenant_access(tenant_id));

CREATE POLICY "Tenant Isolation for sembako_payroll" ON sembako_payroll FOR ALL
USING (has_tenant_access(tenant_id)) WITH CHECK (has_tenant_access(tenant_id));

CREATE POLICY "Tenant Isolation for sembako_expenses" ON sembako_expenses FOR ALL
USING (has_tenant_access(tenant_id)) WITH CHECK (has_tenant_access(tenant_id));

CREATE POLICY "Tenant Isolation for sembako_payments" ON sembako_payments FOR ALL
USING (has_tenant_access(tenant_id)) WITH CHECK (has_tenant_access(tenant_id));

CREATE POLICY "Tenant Isolation for sembako_supplier_payments" ON sembako_supplier_payments FOR ALL
USING (has_tenant_access(tenant_id)) WITH CHECK (has_tenant_access(tenant_id));

CREATE POLICY "Tenant Isolation for sembako_returns" ON sembako_returns FOR ALL
USING (has_tenant_access(tenant_id)) WITH CHECK (has_tenant_access(tenant_id));

CREATE POLICY "Tenant Isolation for sembako_audit_logs" ON sembako_audit_logs FOR ALL
USING (has_tenant_access(tenant_id)) WITH CHECK (has_tenant_access(tenant_id));

CREATE POLICY "Tenant Isolation for device_tokens" ON device_tokens FOR ALL
USING (auth.uid() IS NOT NULL AND user_id = auth.uid())
WITH CHECK (auth.uid() IS NOT NULL AND user_id = auth.uid());

CREATE POLICY "Tenant Isolation for notification_preferences" ON notification_preferences FOR ALL
USING (auth.uid() IS NOT NULL AND user_id = auth.uid())
WITH CHECK (auth.uid() IS NOT NULL AND user_id = auth.uid());

CREATE POLICY "Tenant Isolation for notifications" ON notifications FOR ALL
USING (has_tenant_access(tenant_id) AND (user_id IS NULL OR user_id = auth.uid()))
WITH CHECK (has_tenant_access(tenant_id));

CREATE POLICY "Tenant Isolation for notification_events" ON notification_events FOR ALL
USING (has_tenant_access(tenant_id)) WITH CHECK (has_tenant_access(tenant_id));

CREATE POLICY "Public Read Active App Releases" ON app_releases FOR SELECT
USING (is_active = TRUE);

CREATE POLICY "Superadmin Manage App Releases" ON app_releases FOR ALL
USING (COALESCE((auth.jwt() -> 'app_metadata' ->> 'is_superadmin')::boolean, false) = true)
WITH CHECK (COALESCE((auth.jwt() -> 'app_metadata' ->> 'is_superadmin')::boolean, false) = true);

-- ==============================================================================
-- 8. SEED DEFAULT TENANT, AUTH USERS & PROFILES
-- ==============================================================================

INSERT INTO tenants (id, business_name, business_vertical, user_type, sub_type, plan)
VALUES (
    '00000000-0000-0000-0000-000000000002',
    'Broker Dashboard Sembako',
    'distributor_sembako',
    'broker',
    'distributor_sembako',
    'pro'
) ON CONFLICT (id) DO NOTHING;

-- Seed Supabase Auth Users Table (auth.users)
INSERT INTO auth.users (
    id, instance_id, aud, role, email, encrypted_password, email_confirmed_at,
    raw_app_meta_data, raw_user_meta_data, created_at, updated_at
)
VALUES
(
    '00000000-0000-0000-0000-000000000001',
    '00000000-0000-0000-0000-000000000000',
    'authenticated', 'authenticated',
    'dev@sembako.id', crypt('dev123', gen_salt('bf')), NOW(),
    '{"provider":"email","providers":["email"],"is_superadmin":true}',
    '{"full_name":"Developer Superadmin"}', NOW(), NOW()
),
(
    '00000000-0000-0000-0000-000000000002',
    '00000000-0000-0000-0000-000000000000',
    'authenticated', 'authenticated',
    'owner@sembako.id', crypt('owner123', gen_salt('bf')), NOW(),
    '{"provider":"email","providers":["email"]}',
    '{"full_name":"Pemilik Toko"}', NOW(), NOW()
),
(
    '00000000-0000-0000-0000-000000000003',
    '00000000-0000-0000-0000-000000000000',
    'authenticated', 'authenticated',
    'admin@sembako.id', crypt('admin123', gen_salt('bf')), NOW(),
    '{"provider":"email","providers":["email"]}',
    '{"full_name":"Kasir / Admin"}', NOW(), NOW()
) ON CONFLICT (id) DO NOTHING;

-- Seed Supabase Auth Identities
INSERT INTO auth.identities (
    id, provider_id, user_id, identity_data, provider, last_sign_in_at, created_at, updated_at
)
VALUES
(
    '00000000-0000-0000-0000-000000000001', '00000000-0000-0000-0000-000000000001', '00000000-0000-0000-0000-000000000001',
    '{"sub":"00000000-0000-0000-0000-000000000001","email":"dev@sembako.id"}', 'email', NOW(), NOW(), NOW()
),
(
    '00000000-0000-0000-0000-000000000002', '00000000-0000-0000-0000-000000000002', '00000000-0000-0000-0000-000000000002',
    '{"sub":"00000000-0000-0000-0000-000000000002","email":"owner@sembako.id"}', 'email', NOW(), NOW(), NOW()
),
(
    '00000000-0000-0000-0000-000000000003', '00000000-0000-0000-0000-000000000003', '00000000-0000-0000-0000-000000000003',
    '{"sub":"00000000-0000-0000-0000-000000000003","email":"admin@sembako.id"}', 'email', NOW(), NOW(), NOW()
) ON CONFLICT (id) DO NOTHING;

-- Seed Profiles
INSERT INTO profiles (id, auth_user_id, tenant_id, full_name, email, role, app_role, user_type, sub_type, business_name, onboarded)
VALUES 
(
    '00000000-0000-0000-0000-000000000010', '00000000-0000-0000-0000-000000000001', '00000000-0000-0000-0000-000000000002',
    'Developer Superadmin', 'dev@sembako.id', 'dev', 'dev', 'broker', 'distributor_sembako', 'Broker Dashboard Sembako', true
),
(
    '00000000-0000-0000-0000-000000000020', '00000000-0000-0000-0000-000000000002', '00000000-0000-0000-0000-000000000002',
    'Pemilik Toko', 'owner@sembako.id', 'owner', 'owner', 'broker', 'distributor_sembako', 'Broker Dashboard Sembako', true
),
(
    '00000000-0000-0000-0000-000000000030', '00000000-0000-0000-0000-000000000003', '00000000-0000-0000-0000-000000000002',
    'Kasir / Admin', 'admin@sembako.id', 'admin', 'admin', 'broker', 'distributor_sembako', 'Broker Dashboard Sembako', true
) ON CONFLICT (id) DO NOTHING;

-- ==============================================================================
-- 9. RELOAD SUPABASE SCHEMA CACHE
-- ==============================================================================
NOTIFY pgrst, 'reload schema';

SELECT 'Migrasi Full Master Database Supabase Berhasil 100%! Semua kolom, tabel, fungsi FIFO, & RLS telah diselaraskan.' AS status;
