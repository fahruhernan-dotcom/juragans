-- ==============================================================================
-- TERNAK OS / SEMBAKO DASHBOARD - COMPREHENSIVE SUPABASE DATABASE MIGRATION SCRIPT
-- ==============================================================================
-- Jalankan skrip ini di Supabase Dashboard ➔ SQL Editor untuk menyelaraskan
-- seluruh kolom tabel Sembako Broker dengan fitur Frontend.
-- ==============================================================================

-- 1. TABEL SEMBAKO_CUSTOMERS (Toko & Customer)
-- Menambahkan kolom termin bayar, wilayah, limit kredit, dan rating keandalan
ALTER TABLE sembako_customers 
ADD COLUMN IF NOT EXISTS payment_terms text DEFAULT 'cash',
ADD COLUMN IF NOT EXISTS area text DEFAULT '',
ADD COLUMN IF NOT EXISTS credit_limit numeric DEFAULT 0,
ADD COLUMN IF NOT EXISTS reliability_score integer DEFAULT 3;

-- Indexing untuk query super cepat
CREATE INDEX IF NOT EXISTS idx_sembako_customers_tenant ON sembako_customers(tenant_id);
CREATE INDEX IF NOT EXISTS idx_sembako_customers_area ON sembako_customers(tenant_id, area);
CREATE INDEX IF NOT EXISTS idx_sembako_customers_deleted ON sembako_customers(tenant_id, is_deleted);

-- 2. TABEL SEMBAKO_SUPPLIERS (Supplier / Pemasok)
ALTER TABLE sembako_suppliers
ADD COLUMN IF NOT EXISTS phone text DEFAULT '',
ADD COLUMN IF NOT EXISTS address text DEFAULT '',
ADD COLUMN IF NOT EXISTS notes text DEFAULT '',
ADD COLUMN IF NOT EXISTS is_deleted boolean DEFAULT false;

CREATE INDEX IF NOT EXISTS idx_sembako_suppliers_tenant ON sembako_suppliers(tenant_id);

-- 3. TABEL SEMBAKO_PRODUCTS (Katalog Produk & Stok)
ALTER TABLE sembako_products
ADD COLUMN IF NOT EXISTS sku text DEFAULT '',
ADD COLUMN IF NOT EXISTS category text DEFAULT 'Umum',
ADD COLUMN IF NOT EXISTS unit text DEFAULT 'pcs',
ADD COLUMN IF NOT EXISTS current_stock numeric DEFAULT 0,
ADD COLUMN IF NOT EXISTS avg_buy_price numeric DEFAULT 0,
ADD COLUMN IF NOT EXISTS sell_price numeric DEFAULT 0,
ADD COLUMN IF NOT EXISTS min_stock_alert numeric DEFAULT 10,
ADD COLUMN IF NOT EXISTS is_active boolean DEFAULT true,
ADD COLUMN IF NOT EXISTS is_deleted boolean DEFAULT false;

CREATE INDEX IF NOT EXISTS idx_sembako_products_tenant ON sembako_products(tenant_id);
CREATE INDEX IF NOT EXISTS idx_sembako_products_deleted ON sembako_products(tenant_id, is_deleted);

-- 4. TABEL SEMBAKO_RETURNS (Retur Produk & Inventory)
CREATE TABLE IF NOT EXISTS sembako_returns (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id uuid NOT NULL,
  created_by uuid,
  return_number text NOT NULL,
  return_type text DEFAULT 'sale_return',
  party_name text DEFAULT '',
  product_id uuid REFERENCES sembako_products(id),
  product_name text DEFAULT '',
  quantity numeric DEFAULT 1,
  unit text DEFAULT 'pcs',
  unit_price numeric DEFAULT 0,
  total_amount numeric DEFAULT 0,
  reason text DEFAULT 'Lainnya',
  action text DEFAULT 'fifo_stock',
  status text DEFAULT 'pending',
  notes text DEFAULT '',
  is_deleted boolean DEFAULT false,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_sembako_returns_tenant ON sembako_returns(tenant_id);

-- 5. VERIFIKASI SELESAI
SELECT 'Database Supabase Sembako OS Berhasil Diperbarui & Diselaraskan!' as status;
