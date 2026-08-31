-- ==============================================================================
-- MIGRATION: sembako_inventory_mutations (Kartu Stok & Buku Besar Mutasi Persediaan)
-- Database: Supabase PostgreSQL (Juragan by Anak Bawang)
-- ==============================================================================

-- 1. Create table sembako_inventory_mutations
CREATE TABLE IF NOT EXISTS public.sembako_inventory_mutations (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    tenant_id UUID,
    material_id UUID REFERENCES public.sembako_raw_materials(id) ON DELETE SET NULL,
    material_name TEXT NOT NULL,
    material_category TEXT,
    mutation_type TEXT NOT NULL CHECK (mutation_type IN ('IN', 'OUT', 'ADJUST')),
    action_type TEXT NOT NULL CHECK (action_type IN ('INITIAL', 'RESTOCK', 'SALE', 'OPNAME', 'RETURN')),
    quantity NUMERIC NOT NULL DEFAULT 0,
    unit TEXT DEFAULT 'pcs',
    unit_cost NUMERIC DEFAULT 0,
    total_cost NUMERIC DEFAULT 0,
    prev_stock NUMERIC DEFAULT 0,
    new_stock NUMERIC DEFAULT 0,
    ref_type TEXT, -- 'sale', 'purchase', 'opname', 'registration'
    ref_id TEXT,
    ref_number TEXT, -- Invoice / Faktur / PO number
    party_name TEXT, -- Supplier or Customer name
    notes TEXT,
    created_by TEXT DEFAULT 'Sistem',
    created_at TIMESTAMPTZ DEFAULT now()
);

-- 2. Create Indexes for High Performance Querying
CREATE INDEX IF NOT EXISTS idx_sembako_mutations_tenant ON public.sembako_inventory_mutations(tenant_id);
CREATE INDEX IF NOT EXISTS idx_sembako_mutations_material_id ON public.sembako_inventory_mutations(material_id);
CREATE INDEX IF NOT EXISTS idx_sembako_mutations_material_name ON public.sembako_inventory_mutations(material_name);
CREATE INDEX IF NOT EXISTS idx_sembako_mutations_action_type ON public.sembako_inventory_mutations(action_type);
CREATE INDEX IF NOT EXISTS idx_sembako_mutations_created_at ON public.sembako_inventory_mutations(created_at DESC);

-- 3. Enable RLS (Row Level Security)
ALTER TABLE public.sembako_inventory_mutations ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Allow authenticated read inventory mutations"
    ON public.sembako_inventory_mutations
    FOR SELECT
    TO authenticated, anon
    USING (true);

CREATE POLICY "Allow authenticated insert inventory mutations"
    ON public.sembako_inventory_mutations
    FOR INSERT
    TO authenticated, anon
    WITH CHECK (true);

CREATE POLICY "Allow authenticated update inventory mutations"
    ON public.sembako_inventory_mutations
    FOR UPDATE
    TO authenticated, anon
    USING (true);

CREATE POLICY "Allow authenticated delete inventory mutations"
    ON public.sembako_inventory_mutations
    FOR DELETE
    TO authenticated, anon
    USING (true);

-- 4. AUTO-BACKFILL / SEED INITIAL STOCKS FOR EXISTING MATERIALS
-- Memasukkan saldo awal pendaftaran untuk semua bahan baku & kemasan yang ada saat ini
INSERT INTO public.sembako_inventory_mutations (
    tenant_id,
    material_id,
    material_name,
    material_category,
    mutation_type,
    action_type,
    quantity,
    unit,
    unit_cost,
    total_cost,
    prev_stock,
    new_stock,
    ref_type,
    party_name,
    notes,
    created_by,
    created_at
)
SELECT 
    m.tenant_id,
    m.id AS material_id,
    m.material_name,
    m.category AS material_category,
    'IN' AS mutation_type,
    'INITIAL' AS action_type,
    CASE 
        WHEN m.unit_cost > 0 AND m.total_spent > 0 THEN ROUND(m.total_spent / m.unit_cost)
        WHEN m.current_stock > 0 THEN m.current_stock
        ELSE 1 
    END AS quantity,
    COALESCE(m.unit, 'pcs') AS unit,
    COALESCE(m.unit_cost, 0) AS unit_cost,
    COALESCE(NULLIF(m.total_spent, 0), (COALESCE(m.current_stock, 0) * COALESCE(m.unit_cost, 0))) AS total_cost,
    0 AS prev_stock,
    CASE 
        WHEN m.unit_cost > 0 AND m.total_spent > 0 THEN ROUND(m.total_spent / m.unit_cost)
        WHEN m.current_stock > 0 THEN m.current_stock
        ELSE 1 
    END AS new_stock,
    'registration' AS ref_type,
    COALESCE(m.supplier_name, 'Supplier Mandiri') AS party_name,
    'Saldo Awal / Pendaftaran Bahan Baku & Kemasan' AS notes,
    'Sistem Migrasi' AS created_by,
    COALESCE(m.created_at, now()) AS created_at
FROM public.sembako_raw_materials m
WHERE NOT EXISTS (
    SELECT 1 FROM public.sembako_inventory_mutations sim 
    WHERE sim.material_id = m.id AND sim.action_type = 'INITIAL'
)
AND (m.current_stock > 0 OR m.total_spent > 0);
