-- ==============================================================================
-- JURAGAN BY ANAK BAWANG — N8N DATABASE ENHANCEMENT & WEB COMPATIBILITY PATCH
-- ==============================================================================
-- Script ini dirancang khusus untuk database Supabase Anda yang sudah aktif di n8n.
-- Menambahkan tabel Kemasan/BOM Dinamis, kolom harga multi-tier, dan view sinkronisasi.
-- 
-- CARA PAKAI:
-- 1. Buka Supabase project n8n Anda.
-- 2. Buka SQL Editor -> New Query.
-- 3. Paste seluruh isi script ini -> Klik RUN.
-- ==============================================================================

-- 1. EXTENSIONS
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- 2. EXTEND TABEL juragan_products DENGAN KOLOM DYNAMIC BOM & PACKAGING
ALTER TABLE IF EXISTS juragan_products ADD COLUMN IF NOT EXISTS pouch_cost NUMERIC(15,2) DEFAULT 0;
ALTER TABLE IF EXISTS juragan_products ADD COLUMN IF NOT EXISTS sticker_front_cost NUMERIC(15,2) DEFAULT 0;
ALTER TABLE IF EXISTS juragan_products ADD COLUMN IF NOT EXISTS sticker_back_cost NUMERIC(15,2) DEFAULT 0;
ALTER TABLE IF EXISTS juragan_products ADD COLUMN IF NOT EXISTS other_packaging_cost NUMERIC(15,2) DEFAULT 0;
ALTER TABLE IF EXISTS juragan_products ADD COLUMN IF NOT EXISTS raw_ingredient_cost NUMERIC(15,2) DEFAULT 0;
ALTER TABLE IF EXISTS juragan_products ADD COLUMN IF NOT EXISTS harga_luar_kota_rp NUMERIC(15,2) DEFAULT 0;
ALTER TABLE IF EXISTS juragan_products ADD COLUMN IF NOT EXISTS notes TEXT;
ALTER TABLE IF EXISTS juragan_products ADD COLUMN IF NOT EXISTS is_deleted BOOLEAN DEFAULT false;

-- 3. TABEL DYNAMIC RAW MATERIALS & PACKAGING (Bahan Baku & Kemasan)
CREATE TABLE IF NOT EXISTS juragan_raw_materials (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
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

-- RLS Policy untuk juragan_raw_materials
ALTER TABLE juragan_raw_materials ENABLE ROW LEVEL SECURITY;
DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM pg_policies WHERE tablename = 'juragan_raw_materials' AND policyname = 'Allow Public Access juragan_raw_materials'
    ) THEN
        CREATE POLICY "Allow Public Access juragan_raw_materials" ON juragan_raw_materials FOR ALL USING (true) WITH CHECK (true);
    END IF;
END $$;

-- 4. SEED SAMPLE BAHAN KEMASAN BAWANG GORENG JURAGAN
INSERT INTO juragan_raw_materials (material_name, category, unit, current_stock, unit_cost, total_spent, min_stock_alert, supplier_name, notes)
VALUES
('Standing Pouch Matte 100g (Ziplock)', 'kemasan', 'pcs', 250, 1500, 375000, 50, 'Pabrik Kemasan Solo', 'Ukuran 12x20 cm matte ziplock'),
('Standing Pouch Matte 200g (Ziplock)', 'kemasan', 'pcs', 180, 1850, 333000, 50, 'Pabrik Kemasan Solo', 'Ukuran 14x22 cm matte ziplock'),
('Standing Pouch Matte 250g (Ziplock)', 'kemasan', 'pcs', 150, 2100, 315000, 50, 'Pabrik Kemasan Solo', 'Ukuran 16x24 cm matte ziplock'),
('Stiker Depan Gold Foil 100g', 'stiker', 'lembar', 300, 450, 135000, 50, 'Percetakan Stiker Jaya', 'Waterproof vinyl sticker label premium'),
('Stiker Belakang Nutrition & QR P-IRT', 'stiker', 'lembar', 300, 350, 105000, 50, 'Percetakan Stiker Jaya', 'Stiker komposisi dan izin edar'),
('Kardus Master Box (Isi 24 Pouch)', 'kardus', 'box', 45, 4500, 202500, 15, 'Kardus Karton Kartasura', 'Box tebal pengiriman luar kota & ekspor'),
('Bawang Goreng Curah Super Boyolali', 'bahan_baku', 'kg', 60, 95000, 5700000, 15, 'Kelompok Tani Bawang Boyolali', 'Bawang goreng murni renyah tanpa pengawet')
ON CONFLICT DO NOTHING;

-- 5. COMPATIBILITY VIEWS (Agar Web Dashboard Langsung Terhubung Mulus)
CREATE OR REPLACE VIEW sembako_raw_materials AS 
SELECT * FROM juragan_raw_materials;

CREATE OR REPLACE VIEW sembako_products AS
SELECT 
    id,
    sku,
    product_name,
    category,
    unit,
    weight_gram,
    COALESCE(hpp_per_unit, 0) AS avg_buy_price,
    COALESCE(harga_pusat_rp, harga_solo_rp, 0) AS sell_price,
    harga_pusat_rp,
    harga_solo_rp,
    harga_luar_kota_rp,
    COALESCE(harga_grosir_offline_rp, 0) AS harga_grosir_rp,
    harga_marketplace_promo_rp,
    harga_system_coret_rp,
    COALESCE(current_stock_pack, 0) AS current_stock,
    COALESCE(min_stock_alert, 10) AS min_stock_alert,
    raw_ingredient_cost,
    pouch_cost,
    sticker_front_cost,
    sticker_back_cost,
    other_packaging_cost,
    notes,
    COALESCE(is_active, true) AS is_active,
    COALESCE(is_deleted, false) AS is_deleted,
    created_at,
    updated_at
FROM juragan_products;

CREATE OR REPLACE VIEW sembako_customers AS
SELECT 
    id,
    customer_name,
    COALESCE(customer_category, 'warung') AS customer_type,
    b2b_priority_category,
    phone,
    address,
    area,
    notes,
    false AS is_deleted,
    created_at,
    updated_at
FROM juragan_customers;

CREATE OR REPLACE VIEW sembako_suppliers AS
SELECT 
    id,
    supplier_name,
    contact_person,
    phone,
    address,
    notes,
    false AS is_deleted,
    created_at,
    updated_at
FROM juragan_suppliers;

CREATE OR REPLACE VIEW sembako_stock_batches AS
SELECT 
    id,
    batch_code AS batch_number,
    supplier_id,
    variant_name,
    weight_kg AS qty_masuk,
    remaining_weight_kg AS qty_sisa,
    hpp_per_kg AS buy_price,
    total_cost,
    purchase_date AS entry_date,
    payment_status,
    notes,
    false AS is_deleted,
    created_at,
    updated_at
FROM juragan_stock_batches;

CREATE OR REPLACE VIEW sembako_sales AS
SELECT 
    id,
    invoice_number,
    customer_id,
    customer_name,
    order_source,
    transaction_date,
    total_amount,
    COALESCE(total_hpp, 0) AS total_cogs,
    0::numeric AS delivery_cost,
    0::numeric AS other_cost,
    COALESCE(net_profit, 0) AS net_profit,
    COALESCE(total_amount, 0) AS paid_amount,
    0::numeric AS remaining_amount,
    COALESCE(payment_status, 'lunas') AS payment_status,
    notes,
    area,
    items_summary,
    kardus,
    kartu_ucapan,
    false AS is_deleted,
    created_at,
    updated_at
FROM juragan_sales;

CREATE OR REPLACE VIEW sembako_sale_items AS
SELECT 
    id,
    sale_id,
    product_id,
    product_name,
    weight_gram,
    quantity,
    unit_price,
    unit_price AS price_per_unit,
    unit_price AS sell_price,
    cogs_per_unit,
    cogs_total,
    subtotal,
    created_at
FROM juragan_sale_items;

-- 6. VIEW AUTO POLLING UNTUK N8N COLD OUTREACH EMAIL
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
    ai_generated_subject,
    ai_generated_pitch,
    created_at
FROM b2b_leads
WHERE (status_email = 'pending' OR status_email IS NULL)
  AND email IS NOT NULL 
  AND email LIKE '%@%'
ORDER BY 
    CASE lead_priority 
        WHEN 'hot' THEN 1 
        WHEN 'warm' THEN 2 
        ELSE 3 
    END,
    rating DESC,
    created_at ASC;
