-- ==============================================================================
-- TERNAKOS / SEMBAKO OS - FULL MASTER DATABASE MIGRATION SCRIPT (VERSION 2.0)
-- Salin dan jalankan seluruh script ini di Supabase SQL Editor:
-- (Supabase Dashboard -> SQL Editor -> Run)
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

-- ==============================================================================
-- 2. CREATE CORE TABLES (IF NOT EXISTS)
-- ==============================================================================

-- 2.1 TENANTS
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

-- 2.2 PROFILES
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

-- 2.3 TENANT MEMBERSHIPS
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

-- 2.5 SEMBAKO PRODUCTS
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

-- 2.6 SEMBAKO SUPPLIERS
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

-- 2.7 SEMBAKO CUSTOMERS
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

-- 2.8 SEMBAKO SALES
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

-- 2.9 SEMBAKO SALE ITEMS
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

-- 2.10 SEMBAKO STOCK BATCHES
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

-- 2.11 SEMBAKO STOCK OUT
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

-- 2.12 SEMBAKO DELIVERIES
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

-- 2.13 SEMBAKO EMPLOYEES
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

-- 2.14 SEMBAKO PAYROLL
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

-- 2.15 SEMBAKO EXPENSES
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

-- 2.16 SEMBAKO PAYMENTS (CUSTOMER INVOICE PAYMENTS)
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

-- 2.17 SEMBAKO SUPPLIER PAYMENTS
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

-- 2.18 SEMBAKO RETURNS (RETUR SALE / PURCHASE)
CREATE TABLE IF NOT EXISTS sembako_returns (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    tenant_id UUID REFERENCES tenants(id) ON DELETE CASCADE,
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
    total_amount NUMERIC(15,2) DEFAULT 0,
    reason TEXT DEFAULT 'Lainnya',
    action TEXT DEFAULT 'fifo_stock',
    status TEXT DEFAULT 'pending',
    notes TEXT DEFAULT '',
    is_deleted BOOLEAN DEFAULT false,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- 2.19 SEMBAKO AUDIT LOGS
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
-- 3. ENSURE ALL COLUMNS EXIST (SAFETY ALTER STATEMENTS FOR EXISTING TABLES)
-- ==============================================================================

ALTER TABLE sembako_stock_batches
  ADD COLUMN IF NOT EXISTS batch_code TEXT,
  ADD COLUMN IF NOT EXISTS qty_masuk NUMERIC(15,2) DEFAULT 0,
  ADD COLUMN IF NOT EXISTS qty_awal NUMERIC(15,2) DEFAULT 0,
  ADD COLUMN IF NOT EXISTS qty_sisa NUMERIC(15,2) DEFAULT 0,
  ADD COLUMN IF NOT EXISTS buy_price NUMERIC(15,2) DEFAULT 0,
  ADD COLUMN IF NOT EXISTS total_cost NUMERIC(15,2) DEFAULT 0,
  ADD COLUMN IF NOT EXISTS purchase_date TIMESTAMPTZ DEFAULT NOW(),
  ADD COLUMN IF NOT EXISTS expiry_date TIMESTAMPTZ,
  ADD COLUMN IF NOT EXISTS notes TEXT,
  ADD COLUMN IF NOT EXISTS is_deleted BOOLEAN DEFAULT false;

ALTER TABLE sembako_products
  ADD COLUMN IF NOT EXISTS sku TEXT DEFAULT '',
  ADD COLUMN IF NOT EXISTS category TEXT DEFAULT 'lainnya',
  ADD COLUMN IF NOT EXISTS unit TEXT DEFAULT 'pcs',
  ADD COLUMN IF NOT EXISTS current_stock NUMERIC(15,2) DEFAULT 0,
  ADD COLUMN IF NOT EXISTS avg_buy_price NUMERIC(15,2) DEFAULT 0,
  ADD COLUMN IF NOT EXISTS sell_price NUMERIC(15,2) DEFAULT 0,
  ADD COLUMN IF NOT EXISTS min_stock_alert NUMERIC(15,2) DEFAULT 10,
  ADD COLUMN IF NOT EXISTS is_active BOOLEAN DEFAULT true,
  ADD COLUMN IF NOT EXISTS is_deleted BOOLEAN DEFAULT false;

ALTER TABLE sembako_customers
  ADD COLUMN IF NOT EXISTS customer_type TEXT DEFAULT 'warung',
  ADD COLUMN IF NOT EXISTS phone TEXT DEFAULT '',
  ADD COLUMN IF NOT EXISTS address TEXT DEFAULT '',
  ADD COLUMN IF NOT EXISTS area TEXT DEFAULT '',
  ADD COLUMN IF NOT EXISTS payment_terms TEXT DEFAULT 'cash',
  ADD COLUMN IF NOT EXISTS credit_limit NUMERIC(15,2) DEFAULT 0,
  ADD COLUMN IF NOT EXISTS reliability_score NUMERIC(15,2) DEFAULT 100,
  ADD COLUMN IF NOT EXISTS is_deleted BOOLEAN DEFAULT false;

ALTER TABLE sembako_suppliers
  ADD COLUMN IF NOT EXISTS phone TEXT DEFAULT '',
  ADD COLUMN IF NOT EXISTS address TEXT DEFAULT '',
  ADD COLUMN IF NOT EXISTS notes TEXT DEFAULT '',
  ADD COLUMN IF NOT EXISTS is_deleted BOOLEAN DEFAULT false;

ALTER TABLE sembako_returns
  ADD COLUMN IF NOT EXISTS return_number TEXT,
  ADD COLUMN IF NOT EXISTS return_type TEXT DEFAULT 'sale_return',
  ADD COLUMN IF NOT EXISTS party_name TEXT DEFAULT '',
  ADD COLUMN IF NOT EXISTS product_name TEXT DEFAULT '',
  ADD COLUMN IF NOT EXISTS unit TEXT DEFAULT 'pcs',
  ADD COLUMN IF NOT EXISTS unit_price NUMERIC(15,2) DEFAULT 0,
  ADD COLUMN IF NOT EXISTS total_amount NUMERIC(15,2) DEFAULT 0,
  ADD COLUMN IF NOT EXISTS action TEXT DEFAULT 'fifo_stock',
  ADD COLUMN IF NOT EXISTS status TEXT DEFAULT 'pending',
  ADD COLUMN IF NOT EXISTS is_deleted BOOLEAN DEFAULT false;

-- ==============================================================================
-- 4. PERFORMANCE INDEXES
-- ==============================================================================
CREATE INDEX IF NOT EXISTS idx_profiles_auth_user ON profiles(auth_user_id);
CREATE INDEX IF NOT EXISTS idx_tenant_memberships_auth ON tenant_memberships(auth_user_id);
CREATE INDEX IF NOT EXISTS idx_sembako_products_tenant ON sembako_products(tenant_id);
CREATE INDEX IF NOT EXISTS idx_sembako_products_deleted ON sembako_products(tenant_id, is_deleted);
CREATE INDEX IF NOT EXISTS idx_sembako_stock_batches_prod ON sembako_stock_batches(product_id);
CREATE INDEX IF NOT EXISTS idx_sembako_stock_batches_tenant ON sembako_stock_batches(tenant_id);
CREATE INDEX IF NOT EXISTS idx_sembako_sales_tenant ON sembako_sales(tenant_id);
CREATE INDEX IF NOT EXISTS idx_sembako_sales_customer ON sembako_sales(customer_id);
CREATE INDEX IF NOT EXISTS idx_sembako_sale_items_sale ON sembako_sale_items(sale_id);
CREATE INDEX IF NOT EXISTS idx_sembako_deliveries_sale ON sembako_deliveries(sale_id);
CREATE INDEX IF NOT EXISTS idx_sembako_customers_tenant ON sembako_customers(tenant_id);
CREATE INDEX IF NOT EXISTS idx_sembako_customers_area ON sembako_customers(tenant_id, area);
CREATE INDEX IF NOT EXISTS idx_sembako_suppliers_tenant ON sembako_suppliers(tenant_id);
CREATE INDEX IF NOT EXISTS idx_sembako_returns_tenant ON sembako_returns(tenant_id);
CREATE INDEX IF NOT EXISTS idx_sembako_audit_tenant ON sembako_audit_logs(tenant_id);

-- ==============================================================================
-- 5. ROW LEVEL SECURITY (RLS) POLICIES
-- ==============================================================================
ALTER TABLE tenants ENABLE ROW LEVEL SECURITY;
ALTER TABLE profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE tenant_memberships ENABLE ROW LEVEL SECURITY;
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

-- Utility Helper Function for RLS Tenant Access Verification
CREATE OR REPLACE FUNCTION public.has_tenant_access(target_tenant_id UUID)
RETURNS BOOLEAN AS $$
BEGIN
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

GRANT EXECUTE ON FUNCTION public.has_tenant_access(UUID) TO authenticated;

-- Drop existing policies if needed to avoid conflicts
DO $$ 
BEGIN
    DROP POLICY IF EXISTS "Public Read/Write for Tenants" ON tenants;
    DROP POLICY IF EXISTS "Public Read/Write for Profiles" ON profiles;
    DROP POLICY IF EXISTS "Public Read/Write for Memberships" ON tenant_memberships;
    DROP POLICY IF EXISTS "Public Read/Write for Products" ON sembako_products;
    DROP POLICY IF EXISTS "Public Read/Write for Suppliers" ON sembako_suppliers;
    DROP POLICY IF EXISTS "Public Read/Write for Customers" ON sembako_customers;
    DROP POLICY IF EXISTS "Public Read/Write for Sales" ON sembako_sales;
    DROP POLICY IF EXISTS "Public Read/Write for Sale Items" ON sembako_sale_items;
    DROP POLICY IF EXISTS "Public Read/Write for Batches" ON sembako_stock_batches;
    DROP POLICY IF EXISTS "Public Read/Write for Stock Out" ON sembako_stock_out;
    DROP POLICY IF EXISTS "Public Read/Write for Deliveries" ON sembako_deliveries;
    DROP POLICY IF EXISTS "Public Read/Write for Employees" ON sembako_employees;
    DROP POLICY IF EXISTS "Public Read/Write for Payroll" ON sembako_payroll;
    DROP POLICY IF EXISTS "Public Read/Write for Expenses" ON sembako_expenses;
    DROP POLICY IF EXISTS "Public Read/Write for Payments" ON sembako_payments;
    DROP POLICY IF EXISTS "Public Read/Write for Supplier Payments" ON sembako_supplier_payments;
    DROP POLICY IF EXISTS "Public Read/Write for Returns" ON sembako_returns;
    DROP POLICY IF EXISTS "Public Read/Write for Audit Logs" ON sembako_audit_logs;

    DROP POLICY IF EXISTS "Tenant Isolation Policy for tenants" ON tenants;
    DROP POLICY IF EXISTS "Tenant Isolation Policy for profiles" ON profiles;
    DROP POLICY IF EXISTS "Tenant Isolation Policy for tenant_memberships" ON tenant_memberships;
    DROP POLICY IF EXISTS "Tenant Isolation Policy for team_invitations" ON team_invitations;
    DROP POLICY IF EXISTS "Tenant Isolation Policy for sembako_products" ON sembako_products;
    DROP POLICY IF EXISTS "Tenant Isolation Policy for sembako_suppliers" ON sembako_suppliers;
    DROP POLICY IF EXISTS "Tenant Isolation Policy for sembako_customers" ON sembako_customers;
    DROP POLICY IF EXISTS "Tenant Isolation Policy for sembako_sales" ON sembako_sales;
    DROP POLICY IF EXISTS "Tenant Isolation Policy for sembako_sale_items" ON sembako_sale_items;
    DROP POLICY IF EXISTS "Tenant Isolation Policy for sembako_stock_batches" ON sembako_stock_batches;
    DROP POLICY IF EXISTS "Tenant Isolation Policy for sembako_stock_out" ON sembako_stock_out;
    DROP POLICY IF EXISTS "Tenant Isolation Policy for sembako_deliveries" ON sembako_deliveries;
    DROP POLICY IF EXISTS "Tenant Isolation Policy for sembako_employees" ON sembako_employees;
    DROP POLICY IF EXISTS "Tenant Isolation Policy for sembako_payroll" ON sembako_payroll;
    DROP POLICY IF EXISTS "Tenant Isolation Policy for sembako_expenses" ON sembako_expenses;
    DROP POLICY IF EXISTS "Tenant Isolation Policy for sembako_payments" ON sembako_payments;
    DROP POLICY IF EXISTS "Tenant Isolation Policy for sembako_supplier_payments" ON sembako_supplier_payments;
    DROP POLICY IF EXISTS "Tenant Isolation Policy for sembako_returns" ON sembako_returns;
    DROP POLICY IF EXISTS "Tenant Isolation Policy for sembako_audit_logs" ON sembako_audit_logs;
EXCEPTION WHEN OTHERS THEN NULL;
END $$;

-- Secure Tenant Isolation Policies
CREATE POLICY "Tenant Isolation Policy for tenants" ON tenants FOR ALL
USING (auth.uid() IS NOT NULL AND (id IN (SELECT tenant_id FROM public.profiles WHERE auth_user_id = auth.uid()) OR id IN (SELECT tenant_id FROM public.tenant_memberships WHERE auth_user_id = auth.uid()) OR owner_id = auth.uid() OR COALESCE((auth.jwt() -> 'app_metadata' ->> 'is_superadmin')::boolean, false) = true))
WITH CHECK (auth.uid() IS NOT NULL AND (id IN (SELECT tenant_id FROM public.profiles WHERE auth_user_id = auth.uid()) OR id IN (SELECT tenant_id FROM public.tenant_memberships WHERE auth_user_id = auth.uid()) OR owner_id = auth.uid() OR COALESCE((auth.jwt() -> 'app_metadata' ->> 'is_superadmin')::boolean, false) = true));

CREATE POLICY "Tenant Isolation Policy for profiles" ON profiles FOR ALL
USING (auth.uid() IS NOT NULL AND (auth_user_id = auth.uid() OR has_tenant_access(tenant_id)))
WITH CHECK (auth.uid() IS NOT NULL AND (auth_user_id = auth.uid() OR has_tenant_access(tenant_id)));

CREATE POLICY "Tenant Isolation Policy for tenant_memberships" ON tenant_memberships FOR ALL
USING (auth.uid() IS NOT NULL AND (auth_user_id = auth.uid() OR has_tenant_access(tenant_id)))
WITH CHECK (auth.uid() IS NOT NULL AND (auth_user_id = auth.uid() OR has_tenant_access(tenant_id)));

CREATE POLICY "Tenant Isolation Policy for team_invitations" ON team_invitations FOR ALL
USING (has_tenant_access(tenant_id)) WITH CHECK (has_tenant_access(tenant_id));

CREATE POLICY "Tenant Isolation Policy for sembako_products" ON sembako_products FOR ALL
USING (has_tenant_access(tenant_id)) WITH CHECK (has_tenant_access(tenant_id));

CREATE POLICY "Tenant Isolation Policy for sembako_suppliers" ON sembako_suppliers FOR ALL
USING (has_tenant_access(tenant_id)) WITH CHECK (has_tenant_access(tenant_id));

CREATE POLICY "Tenant Isolation Policy for sembako_customers" ON sembako_customers FOR ALL
USING (has_tenant_access(tenant_id)) WITH CHECK (has_tenant_access(tenant_id));

CREATE POLICY "Tenant Isolation Policy for sembako_sales" ON sembako_sales FOR ALL
USING (has_tenant_access(tenant_id)) WITH CHECK (has_tenant_access(tenant_id));

CREATE POLICY "Tenant Isolation Policy for sembako_sale_items" ON sembako_sale_items FOR ALL
USING (EXISTS (SELECT 1 FROM public.sembako_sales WHERE sembako_sales.id = sembako_sale_items.sale_id AND has_tenant_access(sembako_sales.tenant_id)))
WITH CHECK (EXISTS (SELECT 1 FROM public.sembako_sales WHERE sembako_sales.id = sembako_sale_items.sale_id AND has_tenant_access(sembako_sales.tenant_id)));

CREATE POLICY "Tenant Isolation Policy for sembako_stock_batches" ON sembako_stock_batches FOR ALL
USING (has_tenant_access(tenant_id)) WITH CHECK (has_tenant_access(tenant_id));

CREATE POLICY "Tenant Isolation Policy for sembako_stock_out" ON sembako_stock_out FOR ALL
USING (has_tenant_access(tenant_id)) WITH CHECK (has_tenant_access(tenant_id));

CREATE POLICY "Tenant Isolation Policy for sembako_deliveries" ON sembako_deliveries FOR ALL
USING (has_tenant_access(tenant_id)) WITH CHECK (has_tenant_access(tenant_id));

CREATE POLICY "Tenant Isolation Policy for sembako_employees" ON sembako_employees FOR ALL
USING (has_tenant_access(tenant_id)) WITH CHECK (has_tenant_access(tenant_id));

CREATE POLICY "Tenant Isolation Policy for sembako_payroll" ON sembako_payroll FOR ALL
USING (has_tenant_access(tenant_id)) WITH CHECK (has_tenant_access(tenant_id));

CREATE POLICY "Tenant Isolation Policy for sembako_expenses" ON sembako_expenses FOR ALL
USING (has_tenant_access(tenant_id)) WITH CHECK (has_tenant_access(tenant_id));

CREATE POLICY "Tenant Isolation Policy for sembako_payments" ON sembako_payments FOR ALL
USING (has_tenant_access(tenant_id)) WITH CHECK (has_tenant_access(tenant_id));

CREATE POLICY "Tenant Isolation Policy for sembako_supplier_payments" ON sembako_supplier_payments FOR ALL
USING (has_tenant_access(tenant_id)) WITH CHECK (has_tenant_access(tenant_id));

CREATE POLICY "Tenant Isolation Policy for sembako_returns" ON sembako_returns FOR ALL
USING (has_tenant_access(tenant_id)) WITH CHECK (has_tenant_access(tenant_id));

CREATE POLICY "Tenant Isolation Policy for sembako_audit_logs" ON sembako_audit_logs FOR ALL
USING (has_tenant_access(tenant_id)) WITH CHECK (has_tenant_access(tenant_id));

-- ==============================================================================
-- 6. SEED DEFAULT TENANT, AUTH USERS & PROFILES
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
-- 7. RELOAD SUPABASE SCHEMA CACHE (SOLVES ALL PGRST204 MISSING COLUMN ERRORS)
-- ==============================================================================
NOTIFY pgrst, 'reload schema';

SELECT 'Migrasi Full Master Database Supabase Berhasil 100%! Semua kolom & tabel telah diselaraskan.' AS status;
