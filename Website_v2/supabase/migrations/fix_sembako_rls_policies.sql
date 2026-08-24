-- =============================================================================
-- GOPEK / SEMBAKO OS - FIX FINDING-01: SECURE TENANT-ISOLATED RLS POLICIES
-- Script ini menggantikan semua policy "USING (true)" dengan RLS Tenant Isolation.
-- Jalankan script ini di Supabase SQL Editor:
-- (Supabase Dashboard -> SQL Editor -> Run)
-- =============================================================================

-- 1. UTILITY HELPER FUNCTION (SECURITY DEFINER)
-- Memeriksa apakah auth.uid() saat ini memiliki hak akses ke target_tenant_id.
-- Menggunakan SECURITY DEFINER untuk menghindari evaluasi rekursif RLS pada tabel profiles/memberships.
CREATE OR REPLACE FUNCTION public.has_tenant_access(target_tenant_id UUID)
RETURNS BOOLEAN AS $$
BEGIN
  -- User tanpa autentikasi tidak boleh mengakses data tenant
  IF auth.uid() IS NULL THEN
    RETURN FALSE;
  END IF;

  -- Superadmin check (via JWT claim)
  IF COALESCE((auth.jwt() -> 'app_metadata' ->> 'is_superadmin')::boolean, false) = true THEN
    RETURN TRUE;
  END IF;

  -- Cek keanggotaan tenant pada profiles, tenant_memberships, atau ownership di tenants
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

-- Grant execution permission to authenticated users
GRANT EXECUTE ON FUNCTION public.has_tenant_access(UUID) TO authenticated;

-- 2. ENABLE RLS ON ALL CORE & SEMBAKO TABLES
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

-- 3. DROP OLD PERMISSIVE / CONFLICTING POLICIES
DO $$ 
BEGIN
    -- Drop old master policies
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
    
    -- Drop old specific policies from database.sql / fix scripts
    DROP POLICY IF EXISTS "Tenant Isolation Select for sembako_returns" ON sembako_returns;
    DROP POLICY IF EXISTS "Tenant Isolation Insert for sembako_returns" ON sembako_returns;
    DROP POLICY IF EXISTS "Tenant Isolation Update for sembako_returns" ON sembako_returns;
    DROP POLICY IF EXISTS "All authenticated sembako_payments" ON sembako_payments;
    DROP POLICY IF EXISTS "All authenticated sembako_returns" ON sembako_returns;
    DROP POLICY IF EXISTS "Tenant Isolation Policy for tenants" ON tenants;
    DROP POLICY IF EXISTS "Tenant Isolation Policy for profiles" ON profiles;
    DROP POLICY IF EXISTS "Tenant Isolation Policy for tenant_memberships" ON tenant_memberships;
EXCEPTION WHEN OTHERS THEN NULL;
END $$;

-- 4. CREATE STRICT TENANT ISOLATION POLICIES

-- 4.1 TENANTS
CREATE POLICY "Tenant Isolation Policy for tenants" ON tenants FOR ALL
USING (
  auth.uid() IS NOT NULL AND (
    id IN (SELECT tenant_id FROM public.profiles WHERE auth_user_id = auth.uid()) OR
    id IN (SELECT tenant_id FROM public.tenant_memberships WHERE auth_user_id = auth.uid()) OR
    owner_id = auth.uid() OR
    COALESCE((auth.jwt() -> 'app_metadata' ->> 'is_superadmin')::boolean, false) = true
  )
)
WITH CHECK (
  auth.uid() IS NOT NULL AND (
    id IN (SELECT tenant_id FROM public.profiles WHERE auth_user_id = auth.uid()) OR
    id IN (SELECT tenant_id FROM public.tenant_memberships WHERE auth_user_id = auth.uid()) OR
    owner_id = auth.uid() OR
    COALESCE((auth.jwt() -> 'app_metadata' ->> 'is_superadmin')::boolean, false) = true
  )
);

-- 4.2 PROFILES
CREATE POLICY "Tenant Isolation Policy for profiles" ON profiles FOR ALL
USING (
  auth.uid() IS NOT NULL AND (
    auth_user_id = auth.uid() OR
    has_tenant_access(tenant_id)
  )
)
WITH CHECK (
  auth.uid() IS NOT NULL AND (
    auth_user_id = auth.uid() OR
    has_tenant_access(tenant_id)
  )
);

-- 4.3 TENANT MEMBERSHIPS
CREATE POLICY "Tenant Isolation Policy for tenant_memberships" ON tenant_memberships FOR ALL
USING (
  auth.uid() IS NOT NULL AND (
    auth_user_id = auth.uid() OR
    has_tenant_access(tenant_id)
  )
)
WITH CHECK (
  auth.uid() IS NOT NULL AND (
    auth_user_id = auth.uid() OR
    has_tenant_access(tenant_id)
  )
);

-- 4.4 TEAM INVITATIONS
CREATE POLICY "Tenant Isolation Policy for team_invitations" ON team_invitations FOR ALL
USING (has_tenant_access(tenant_id))
WITH CHECK (has_tenant_access(tenant_id));

-- 4.5 SEMBAKO PRODUCTS
CREATE POLICY "Tenant Isolation Policy for sembako_products" ON sembako_products FOR ALL
USING (has_tenant_access(tenant_id))
WITH CHECK (has_tenant_access(tenant_id));

-- 4.6 SEMBAKO SUPPLIERS
CREATE POLICY "Tenant Isolation Policy for sembako_suppliers" ON sembako_suppliers FOR ALL
USING (has_tenant_access(tenant_id))
WITH CHECK (has_tenant_access(tenant_id));

-- 4.7 SEMBAKO CUSTOMERS
CREATE POLICY "Tenant Isolation Policy for sembako_customers" ON sembako_customers FOR ALL
USING (has_tenant_access(tenant_id))
WITH CHECK (has_tenant_access(tenant_id));

-- 4.8 SEMBAKO SALES
CREATE POLICY "Tenant Isolation Policy for sembako_sales" ON sembako_sales FOR ALL
USING (has_tenant_access(tenant_id))
WITH CHECK (has_tenant_access(tenant_id));

-- 4.9 SEMBAKO SALE ITEMS (linked via sembako_sales)
CREATE POLICY "Tenant Isolation Policy for sembako_sale_items" ON sembako_sale_items FOR ALL
USING (
  EXISTS (
    SELECT 1 FROM public.sembako_sales
    WHERE sembako_sales.id = sembako_sale_items.sale_id
    AND has_tenant_access(sembako_sales.tenant_id)
  )
)
WITH CHECK (
  EXISTS (
    SELECT 1 FROM public.sembako_sales
    WHERE sembako_sales.id = sembako_sale_items.sale_id
    AND has_tenant_access(sembako_sales.tenant_id)
  )
);

-- 4.10 SEMBAKO STOCK BATCHES
CREATE POLICY "Tenant Isolation Policy for sembako_stock_batches" ON sembako_stock_batches FOR ALL
USING (has_tenant_access(tenant_id))
WITH CHECK (has_tenant_access(tenant_id));

-- 4.11 SEMBAKO STOCK OUT
CREATE POLICY "Tenant Isolation Policy for sembako_stock_out" ON sembako_stock_out FOR ALL
USING (has_tenant_access(tenant_id))
WITH CHECK (has_tenant_access(tenant_id));

-- 4.12 SEMBAKO DELIVERIES
CREATE POLICY "Tenant Isolation Policy for sembako_deliveries" ON sembako_deliveries FOR ALL
USING (has_tenant_access(tenant_id))
WITH CHECK (has_tenant_access(tenant_id));

-- 4.13 SEMBAKO EMPLOYEES
CREATE POLICY "Tenant Isolation Policy for sembako_employees" ON sembako_employees FOR ALL
USING (has_tenant_access(tenant_id))
WITH CHECK (has_tenant_access(tenant_id));

-- 4.14 SEMBAKO PAYROLL
CREATE POLICY "Tenant Isolation Policy for sembako_payroll" ON sembako_payroll FOR ALL
USING (has_tenant_access(tenant_id))
WITH CHECK (has_tenant_access(tenant_id));

-- 4.15 SEMBAKO EXPENSES
CREATE POLICY "Tenant Isolation Policy for sembako_expenses" ON sembako_expenses FOR ALL
USING (has_tenant_access(tenant_id))
WITH CHECK (has_tenant_access(tenant_id));

-- 4.16 SEMBAKO PAYMENTS
CREATE POLICY "Tenant Isolation Policy for sembako_payments" ON sembako_payments FOR ALL
USING (has_tenant_access(tenant_id))
WITH CHECK (has_tenant_access(tenant_id));

-- 4.17 SEMBAKO SUPPLIER PAYMENTS
CREATE POLICY "Tenant Isolation Policy for sembako_supplier_payments" ON sembako_supplier_payments FOR ALL
USING (has_tenant_access(tenant_id))
WITH CHECK (has_tenant_access(tenant_id));

-- 4.18 SEMBAKO RETURNS
CREATE POLICY "Tenant Isolation Policy for sembako_returns" ON sembako_returns FOR ALL
USING (has_tenant_access(tenant_id))
WITH CHECK (has_tenant_access(tenant_id));

-- 4.19 SEMBAKO AUDIT LOGS
CREATE POLICY "Tenant Isolation Policy for sembako_audit_logs" ON sembako_audit_logs FOR ALL
USING (has_tenant_access(tenant_id))
WITH CHECK (has_tenant_access(tenant_id));
