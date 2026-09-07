-- ==============================================================================
-- JURAGAN & SEMBAKO OS — STOCK CUSTODY, COMBINE PACKAGING & EMPLOYEE STOCK
-- Database: Supabase PostgreSQL
-- ==============================================================================

CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- 1. SEMBAKO STOCK CUSTODY (Saldo Stok per Lokasi / Pemegang)
-- Menyimpan kuantitas produk jadi di Gudang Utama atau dipegang Staf/Sales (e.g. Reyhan)
CREATE TABLE IF NOT EXISTS public.sembako_stock_custody (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    tenant_id UUID REFERENCES tenants(id) ON DELETE CASCADE,
    holder_type TEXT NOT NULL CHECK (holder_type IN ('warehouse', 'employee')),
    employee_id UUID REFERENCES sembako_employees(id) ON DELETE CASCADE,
    product_id UUID REFERENCES sembako_products(id) ON DELETE CASCADE,
    product_name TEXT NOT NULL,
    quantity NUMERIC(15,2) NOT NULL DEFAULT 0,
    unit TEXT DEFAULT 'pcs',
    notes TEXT,
    updated_at TIMESTAMPTZ DEFAULT NOW(),
    CONSTRAINT uq_stock_custody UNIQUE (tenant_id, holder_type, employee_id, product_id)
);

CREATE INDEX IF NOT EXISTS idx_stock_custody_tenant ON public.sembako_stock_custody(tenant_id);
CREATE INDEX IF NOT EXISTS idx_stock_custody_holder ON public.sembako_stock_custody(holder_type, employee_id);
CREATE INDEX IF NOT EXISTS idx_stock_custody_product ON public.sembako_stock_custody(product_id);

ALTER TABLE public.sembako_stock_custody ENABLE ROW LEVEL SECURITY;
DO $$ BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM pg_policies WHERE tablename = 'sembako_stock_custody' AND policyname = 'sembako_stock_custody_all'
    ) THEN
        CREATE POLICY sembako_stock_custody_all ON public.sembako_stock_custody FOR ALL USING (true) WITH CHECK (true);
    END IF;
END $$;

-- 2. SEMBAKO PACKAGING LOGS (Riwayat Combine / Racik Produk Jadi)
-- Mencatat aktivitas produksi/packing: bahan mentah apa yang dikonsumsi & jadi berapa produk
CREATE TABLE IF NOT EXISTS public.sembako_packaging_logs (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    tenant_id UUID REFERENCES tenants(id) ON DELETE CASCADE,
    pack_number TEXT NOT NULL,
    product_id UUID REFERENCES sembako_products(id) ON DELETE SET NULL,
    product_name TEXT NOT NULL,
    output_qty NUMERIC(15,2) NOT NULL DEFAULT 0,
    unit TEXT DEFAULT 'pcs',
    cogs_per_unit NUMERIC(15,2) DEFAULT 0,
    total_cogs NUMERIC(15,2) DEFAULT 0,
    materials_deducted JSONB DEFAULT '[]'::jsonb,
    notes TEXT,
    created_by TEXT DEFAULT 'Admin',
    created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_packaging_logs_tenant ON public.sembako_packaging_logs(tenant_id);
CREATE INDEX IF NOT EXISTS idx_packaging_logs_product ON public.sembako_packaging_logs(product_id);
CREATE INDEX IF NOT EXISTS idx_packaging_logs_created_at ON public.sembako_packaging_logs(created_at DESC);

ALTER TABLE public.sembako_packaging_logs ENABLE ROW LEVEL SECURITY;
DO $$ BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM pg_policies WHERE tablename = 'sembako_packaging_logs' AND policyname = 'sembako_packaging_logs_all'
    ) THEN
        CREATE POLICY sembako_packaging_logs_all ON public.sembako_packaging_logs FOR ALL USING (true) WITH CHECK (true);
    END IF;
END $$;

-- 3. SEMBAKO STOCK TRANSFERS (Riwayat Serah Terima & Bawa Stok Pegawai)
-- Mencatat mutasi keluar ke pegawai (bawa kanvas/keliling) dan pengembalian sisa ke gudang
CREATE TABLE IF NOT EXISTS public.sembako_stock_transfers (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    tenant_id UUID REFERENCES tenants(id) ON DELETE CASCADE,
    transfer_number TEXT NOT NULL,
    transfer_type TEXT NOT NULL CHECK (transfer_type IN ('handover_to_staff', 'return_to_warehouse', 'sale_deduction')),
    from_holder_type TEXT NOT NULL,
    from_employee_id UUID REFERENCES sembako_employees(id) ON DELETE SET NULL,
    to_holder_type TEXT NOT NULL,
    to_employee_id UUID REFERENCES sembako_employees(id) ON DELETE SET NULL,
    employee_name TEXT,
    product_id UUID REFERENCES sembako_products(id) ON DELETE CASCADE,
    product_name TEXT NOT NULL,
    quantity NUMERIC(15,2) NOT NULL DEFAULT 0,
    unit TEXT DEFAULT 'pcs',
    notes TEXT,
    created_by TEXT DEFAULT 'Admin',
    created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_stock_transfers_tenant ON public.sembako_stock_transfers(tenant_id);
CREATE INDEX IF NOT EXISTS idx_stock_transfers_emp ON public.sembako_stock_transfers(to_employee_id, from_employee_id);
CREATE INDEX IF NOT EXISTS idx_stock_transfers_created ON public.sembako_stock_transfers(created_at DESC);

ALTER TABLE public.sembako_stock_transfers ENABLE ROW LEVEL SECURITY;
DO $$ BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM pg_policies WHERE tablename = 'sembako_stock_transfers' AND policyname = 'sembako_stock_transfers_all'
    ) THEN
        CREATE POLICY sembako_stock_transfers_all ON public.sembako_stock_transfers FOR ALL USING (true) WITH CHECK (true);
    END IF;
END $$;
