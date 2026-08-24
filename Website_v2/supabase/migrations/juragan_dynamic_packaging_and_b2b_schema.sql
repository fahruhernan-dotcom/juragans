-- ==============================================================================
-- JURAGAN & SEMBAKO OS — DYNAMIC RAW MATERIALS, PACKAGING & B2B LEADS EXTENSION
-- ==============================================================================

-- 1. EXTENSIONS
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- 2. DYNAMIC RAW MATERIALS & PACKAGING TABLE (Bahan Baku, Pouch, Stiker, Kardus)
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

-- Index & RLS
CREATE INDEX IF NOT EXISTS idx_raw_materials_tenant ON sembako_raw_materials(tenant_id);
ALTER TABLE sembako_raw_materials ENABLE ROW LEVEL SECURITY;

DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM pg_policies WHERE tablename = 'sembako_raw_materials' AND policyname = 'sembako_raw_materials_all'
    ) THEN
        CREATE POLICY sembako_raw_materials_all ON sembako_raw_materials FOR ALL USING (true) WITH CHECK (true);
    END IF;
END $$;

-- 3. EXTEND SEMBAKO PRODUCTS FOR DYNAMIC HPP BREAKDOWN & MULTI-REGION PRICING
ALTER TABLE sembako_products ADD COLUMN IF NOT EXISTS sku TEXT;
ALTER TABLE sembako_products ADD COLUMN IF NOT EXISTS weight_gram INT DEFAULT 200;
ALTER TABLE sembako_products ADD COLUMN IF NOT EXISTS raw_ingredient_cost NUMERIC(15,2) DEFAULT 0;
ALTER TABLE sembako_products ADD COLUMN IF NOT EXISTS pouch_cost NUMERIC(15,2) DEFAULT 0;
ALTER TABLE sembako_products ADD COLUMN IF NOT EXISTS sticker_front_cost NUMERIC(15,2) DEFAULT 0;
ALTER TABLE sembako_products ADD COLUMN IF NOT EXISTS sticker_back_cost NUMERIC(15,2) DEFAULT 0;
ALTER TABLE sembako_products ADD COLUMN IF NOT EXISTS other_packaging_cost NUMERIC(15,2) DEFAULT 0;
ALTER TABLE sembako_products ADD COLUMN IF NOT EXISTS harga_solo_rp NUMERIC(15,2) DEFAULT 0;
ALTER TABLE sembako_products ADD COLUMN IF NOT EXISTS harga_luar_kota_rp NUMERIC(15,2) DEFAULT 0;
ALTER TABLE sembako_products ADD COLUMN IF NOT EXISTS harga_grosir_rp NUMERIC(15,2) DEFAULT 0;
ALTER TABLE sembako_products ADD COLUMN IF NOT EXISTS harga_marketplace_promo_rp NUMERIC(15,2) DEFAULT 0;

-- 4. B2B LEADS & OUTREACH QUEUE (SUPPORT FOR N8N & MANUAL INPUT)
CREATE TABLE IF NOT EXISTS b2b_leads (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    tenant_id UUID REFERENCES tenants(id) ON DELETE SET NULL,
    queue_id UUID,
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
    notes TEXT,
    is_deleted BOOLEAN DEFAULT false,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_b2b_leads_status ON b2b_leads(status_email);
CREATE INDEX IF NOT EXISTS idx_b2b_leads_city ON b2b_leads(city);
ALTER TABLE b2b_leads ENABLE ROW LEVEL SECURITY;

DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM pg_policies WHERE tablename = 'b2b_leads' AND policyname = 'b2b_leads_all'
    ) THEN
        CREATE POLICY b2b_leads_all ON b2b_leads FOR ALL USING (true) WITH CHECK (true);
    END IF;
END $$;

-- 5. B2B SCRAPING QUEUE
CREATE TABLE IF NOT EXISTS b2b_scraping_queue (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    target_location TEXT NOT NULL,
    country TEXT DEFAULT 'Singapore',
    city_or_region TEXT DEFAULT 'Central Singapore',
    status TEXT DEFAULT 'pending', -- 'pending' | 'in_progress' | 'completed' | 'failed'
    scheduled_for TIMESTAMPTZ DEFAULT NOW(),
    notes TEXT,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

ALTER TABLE b2b_scraping_queue ENABLE ROW LEVEL SECURITY;
DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM pg_policies WHERE tablename = 'b2b_scraping_queue' AND policyname = 'b2b_scraping_queue_all'
    ) THEN
        CREATE POLICY b2b_scraping_queue_all ON b2b_scraping_queue FOR ALL USING (true) WITH CHECK (true);
    END IF;
END $$;

-- 6. VIEW FOR PENDING EMAIL OUTREACH
CREATE OR REPLACE VIEW v_n8n_pending_emails AS
SELECT 
    l.id AS lead_id,
    l.clean_name,
    l.name AS restaurant_name,
    l.category,
    l.address,
    l.city,
    l.country,
    l.email,
    l.phone,
    l.website,
    l.rating,
    l.review_count,
    l.lead_priority,
    l.status_email AS status,
    l.created_at
FROM b2b_leads l
WHERE l.email IS NOT NULL 
  AND l.email != '' 
  AND l.status_email = 'pending'
  AND l.is_deleted = false;

GRANT SELECT ON v_n8n_pending_emails TO anon, authenticated, service_role;
