-- ==============================================================================
-- TERNAKOS / SEMBAKO OS - DELIVERIES, PAYMENTS & RETURNS FULL INIT & FIX SCRIPT
-- Jalankan seluruh script SQL ini di Supabase SQL Editor:
-- (Supabase Dashboard -> SQL Editor -> Run)
-- ==============================================================================

-- 1. EXTENSION SETUP
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- 2. PASTIKAN TABEL PARENT (TENANTS, CUSTOMERS, SALES) SUDAH ADA
CREATE TABLE IF NOT EXISTS tenants (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    business_name TEXT DEFAULT 'Distributor Sembako',
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS sembako_customers (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    tenant_id UUID,
    customer_name TEXT NOT NULL,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS sembako_sales (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    tenant_id UUID,
    customer_id UUID,
    invoice_number TEXT,
    total_amount NUMERIC(15,2) DEFAULT 0,
    paid_amount NUMERIC(15,2) DEFAULT 0,
    remaining_amount NUMERIC(15,2) DEFAULT 0,
    payment_status TEXT DEFAULT 'belum_lunas',
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 3. TABEL: sembako_deliveries (Pengiriman)
CREATE TABLE IF NOT EXISTS sembako_deliveries (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    tenant_id UUID,
    sale_id UUID,
    employee_id UUID,
    driver_name TEXT,
    vehicle_type TEXT,
    vehicle_plate TEXT,
    delivery_date TIMESTAMPTZ DEFAULT NOW(),
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

-- 4. TABEL: sembako_payments (Pembayaran Nota)
CREATE TABLE IF NOT EXISTS sembako_payments (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    tenant_id UUID,
    sale_id UUID,
    customer_id UUID,
    amount NUMERIC(15,2) DEFAULT 0,
    payment_date TIMESTAMPTZ DEFAULT NOW(),
    payment_method TEXT DEFAULT 'cash',
    reference_number TEXT,
    notes TEXT,
    is_deleted BOOLEAN DEFAULT false,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 5. TABEL: sembako_returns (Retur Produk)
CREATE TABLE IF NOT EXISTS sembako_returns (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    tenant_id UUID,
    created_by UUID,
    return_number TEXT,
    return_type TEXT DEFAULT 'sale_return',
    party_name TEXT DEFAULT '',
    product_id UUID,
    product_name TEXT DEFAULT '',
    customer_id UUID,
    supplier_id UUID,
    sale_id UUID,
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

-- 6. TAMBAHKAN KOLOM SECARA AMAN
ALTER TABLE sembako_deliveries ADD COLUMN IF NOT EXISTS tenant_id UUID;
ALTER TABLE sembako_deliveries ADD COLUMN IF NOT EXISTS sale_id UUID;
ALTER TABLE sembako_deliveries ADD COLUMN IF NOT EXISTS employee_id UUID;
ALTER TABLE sembako_deliveries ADD COLUMN IF NOT EXISTS driver_name TEXT;
ALTER TABLE sembako_deliveries ADD COLUMN IF NOT EXISTS vehicle_type TEXT;
ALTER TABLE sembako_deliveries ADD COLUMN IF NOT EXISTS vehicle_plate TEXT;
ALTER TABLE sembako_deliveries ADD COLUMN IF NOT EXISTS delivery_date TIMESTAMPTZ DEFAULT NOW();
ALTER TABLE sembako_deliveries ADD COLUMN IF NOT EXISTS status TEXT DEFAULT 'pending';
ALTER TABLE sembako_deliveries ADD COLUMN IF NOT EXISTS departed_at TIMESTAMPTZ;
ALTER TABLE sembako_deliveries ADD COLUMN IF NOT EXISTS arrived_at TIMESTAMPTZ;
ALTER TABLE sembako_deliveries ADD COLUMN IF NOT EXISTS completed_at TIMESTAMPTZ;
ALTER TABLE sembako_deliveries ADD COLUMN IF NOT EXISTS delivery_notes TEXT;
ALTER TABLE sembako_deliveries ADD COLUMN IF NOT EXISTS notes TEXT;
ALTER TABLE sembako_deliveries ADD COLUMN IF NOT EXISTS is_deleted BOOLEAN DEFAULT false;

ALTER TABLE sembako_payments ADD COLUMN IF NOT EXISTS tenant_id UUID;
ALTER TABLE sembako_payments ADD COLUMN IF NOT EXISTS sale_id UUID;
ALTER TABLE sembako_payments ADD COLUMN IF NOT EXISTS customer_id UUID;
ALTER TABLE sembako_payments ADD COLUMN IF NOT EXISTS amount NUMERIC(15,2) DEFAULT 0;
ALTER TABLE sembako_payments ADD COLUMN IF NOT EXISTS payment_date TIMESTAMPTZ DEFAULT NOW();
ALTER TABLE sembako_payments ADD COLUMN IF NOT EXISTS payment_method TEXT DEFAULT 'cash';
ALTER TABLE sembako_payments ADD COLUMN IF NOT EXISTS reference_number TEXT;
ALTER TABLE sembako_payments ADD COLUMN IF NOT EXISTS notes TEXT;
ALTER TABLE sembako_payments ADD COLUMN IF NOT EXISTS is_deleted BOOLEAN DEFAULT false;

ALTER TABLE sembako_returns ADD COLUMN IF NOT EXISTS tenant_id UUID;
ALTER TABLE sembako_returns ADD COLUMN IF NOT EXISTS customer_id UUID;
ALTER TABLE sembako_returns ADD COLUMN IF NOT EXISTS supplier_id UUID;
ALTER TABLE sembako_returns ADD COLUMN IF NOT EXISTS sale_id UUID;

-- 7. INDEKS UNTUK PERFORMA
CREATE INDEX IF NOT EXISTS idx_sembako_deliveries_sale ON sembako_deliveries(sale_id);
CREATE INDEX IF NOT EXISTS idx_sembako_deliveries_tenant ON sembako_deliveries(tenant_id);
CREATE INDEX IF NOT EXISTS idx_sembako_payments_sale ON sembako_payments(sale_id);
CREATE INDEX IF NOT EXISTS idx_sembako_payments_tenant ON sembako_payments(tenant_id);
CREATE INDEX IF NOT EXISTS idx_sembako_returns_sale ON sembako_returns(sale_id);
CREATE INDEX IF NOT EXISTS idx_sembako_returns_tenant ON sembako_returns(tenant_id);

-- 8. ROW LEVEL SECURITY (RLS) & KEBIJAKAN AKSES PERMISSIVE
ALTER TABLE sembako_deliveries ENABLE ROW LEVEL SECURITY;
ALTER TABLE sembako_payments ENABLE ROW LEVEL SECURITY;
ALTER TABLE sembako_returns ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Public Read/Write for Deliveries" ON sembako_deliveries;
DROP POLICY IF EXISTS "Public Read/Write for Payments" ON sembako_payments;
DROP POLICY IF EXISTS "Public Read/Write for Returns" ON sembako_returns;

CREATE POLICY "Public Read/Write for Deliveries" ON sembako_deliveries FOR ALL USING (true) WITH CHECK (true);
CREATE POLICY "Public Read/Write for Payments" ON sembako_payments FOR ALL USING (true) WITH CHECK (true);
CREATE POLICY "Public Read/Write for Returns" ON sembako_returns FOR ALL USING (true) WITH CHECK (true);

-- 9. RELOAD SUPABASE SCHEMA CACHE
NOTIFY pgrst, 'reload schema';
