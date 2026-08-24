-- =============================================================================
-- VIRGIN MASTER ERP - SUPABASE DATABASE MIGRATION SCRIPT
-- Description: Complete schema for Retur Produk & Inventory (sembako_returns) & FIFO batch tracking
-- =============================================================================

-- 1. Create sembako_returns Table
CREATE TABLE IF NOT EXISTS public.sembako_returns (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id UUID NOT NULL REFERENCES public.tenants(id) ON DELETE CASCADE,
  created_by UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  return_number VARCHAR(64) NOT NULL,
  return_type VARCHAR(32) NOT NULL DEFAULT 'sale_return' CHECK (return_type IN ('sale_return', 'purchase_return')),
  party_name VARCHAR(255) NOT NULL,
  customer_id UUID REFERENCES public.sembako_customers(id) ON DELETE SET NULL,
  supplier_id UUID REFERENCES public.sembako_suppliers(id) ON DELETE SET NULL,
  product_id UUID REFERENCES public.sembako_products(id) ON DELETE SET NULL,
  product_name VARCHAR(255) NOT NULL,
  quantity NUMERIC(12, 2) NOT NULL DEFAULT 1,
  unit VARCHAR(32) NOT NULL DEFAULT 'pcs',
  unit_price NUMERIC(15, 2) DEFAULT 0,
  total_amount NUMERIC(15, 2) DEFAULT 0,
  reason VARCHAR(255) DEFAULT 'Kemasan Cacat / Rusak',
  action VARCHAR(32) DEFAULT 'fifo_stock' CHECK (action IN ('fifo_stock', 'loss')),
  status VARCHAR(32) DEFAULT 'pending' CHECK (status IN ('pending', 'completed')),
  notes TEXT,
  is_deleted BOOLEAN DEFAULT FALSE,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- 2. Indexes for Performance Optimization
CREATE INDEX IF NOT EXISTS idx_sembako_returns_tenant_id ON public.sembako_returns(tenant_id);
CREATE INDEX IF NOT EXISTS idx_sembako_returns_product_id ON public.sembako_returns(product_id);
CREATE INDEX IF NOT EXISTS idx_sembako_returns_status ON public.sembako_returns(status);
CREATE INDEX IF NOT EXISTS idx_sembako_returns_created_at ON public.sembako_returns(created_at DESC);

-- 3. Enable Row Level Security (RLS)
ALTER TABLE public.sembako_returns ENABLE ROW LEVEL SECURITY;

-- 4. RLS Policies for sembako_returns
DROP POLICY IF EXISTS "Tenant Isolation Select for sembako_returns" ON public.sembako_returns;
CREATE POLICY "Tenant Isolation Select for sembako_returns"
  ON public.sembako_returns FOR SELECT
  USING (
    tenant_id IN (
      SELECT tenant_id FROM public.profiles WHERE auth_user_id = auth.uid()
    )
    OR tenant_id = '00000000-0000-0000-0000-000000000002'::uuid
  );

DROP POLICY IF EXISTS "Tenant Isolation Insert for sembako_returns" ON public.sembako_returns;
CREATE POLICY "Tenant Isolation Insert for sembako_returns"
  ON public.sembako_returns FOR INSERT
  WITH CHECK (
    tenant_id IN (
      SELECT tenant_id FROM public.profiles WHERE auth_user_id = auth.uid()
    )
    OR tenant_id = '00000000-0000-0000-0000-000000000002'::uuid
  );

DROP POLICY IF EXISTS "Tenant Isolation Update for sembako_returns" ON public.sembako_returns;
CREATE POLICY "Tenant Isolation Update for sembako_returns"
  ON public.sembako_returns FOR UPDATE
  USING (
    tenant_id IN (
      SELECT tenant_id FROM public.profiles WHERE auth_user_id = auth.uid()
    )
    OR tenant_id = '00000000-0000-0000-0000-000000000002'::uuid
  );

-- 5. Automatic Updated_At Trigger Function
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
   NEW.updated_at = NOW();
   RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS trg_sembako_returns_updated_at ON public.sembako_returns;
CREATE TRIGGER trg_sembako_returns_updated_at
  BEFORE UPDATE ON public.sembako_returns
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- =============================================================================
-- END OF MIGRATION SCRIPT
-- Execute this SQL directly in your Supabase SQL Editor.
-- =============================================================================
