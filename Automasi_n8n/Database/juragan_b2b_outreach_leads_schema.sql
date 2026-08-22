-- ==============================================================================
-- JURAGAN BY ANAK BAWANG — STANDALONE B2B LEADS & OUTREACH DATABASE
-- ==============================================================================
-- File: Automasi_n8n/Database/juragan_b2b_outreach_leads_schema.sql
-- Deskripsi: Database khusus untuk Lead Scraping (Google Maps), AI Enrichment,
--            dan Engine Otomasi Outreach (Cold Email & WhatsApp via n8n).
-- ==============================================================================

-- 1. EXTENSIONS & UTILITY
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";
CREATE EXTENSION IF NOT EXISTS pgcrypto;

CREATE OR REPLACE FUNCTION update_b2b_updated_at()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- 2. ENUM TYPES
DO $$ BEGIN
    CREATE TYPE b2b_lead_priority AS ENUM ('hot', 'warm', 'cold');
EXCEPTION
    WHEN duplicate_object THEN null;
END $$;

DO $$ BEGIN
    CREATE TYPE b2b_outreach_channel AS ENUM ('email', 'whatsapp', 'instagram_dm', 'phone_call');
EXCEPTION
    WHEN duplicate_object THEN null;
END $$;

DO $$ BEGIN
    CREATE TYPE b2b_status_flow AS ENUM (
        'pending',           -- Baru diimpor / belum diproses
        'queued',            -- Masuk antrian scheduler n8n
        'sent',              -- Pesan/Email terkirim
        'opened',            -- Email dibuka (via tracking pixel)
        'replied',           -- Lead merespon positif/bertanya
        'sample_requested',  -- Minta tester sampel 1kg untuk dicoba chef
        'sample_sent',       -- Sampel sedang dikirim ke Singapore
        'sample_tested',     -- Chef sudah mencoba sampel
        'deal_converted',    -- Deal menjadi pelanggan HORECA rutin
        'bounced',           -- Email invalid / WA tidak terdaftar
        'rejected',          -- Menolak tawaran
        'unresponsive'       -- Tidak membalas setelah multi-touch follow up
    );
EXCEPTION
    WHEN duplicate_object THEN null;
END $$;

-- ==============================================================================
-- 3. TABEL 1: MASTER B2B CAMPAIGNS (KAMPANYE PENAWARAN)
-- ==============================================================================
CREATE TABLE IF NOT EXISTS b2b_campaigns (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    campaign_name TEXT NOT NULL,                         -- Contoh: "SG Indonesian Resto - Bawang Boyolali Wave 1"
    target_country TEXT DEFAULT 'Singapore',
    target_industry TEXT DEFAULT 'Indonesian F&B',
    product_pitched TEXT DEFAULT 'Bawang Goreng Boyolali Grade S Murni & Grade A Crispy',
    is_active BOOLEAN DEFAULT true,
    daily_email_limit INT DEFAULT 20,                    -- Batas harian email agar aman dari spam
    daily_wa_limit INT DEFAULT 25,                       -- Batas harian WA
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- ==============================================================================
-- 4. TABEL 2: MASTER B2B LEADS (DATA PROSPECT DARI SCRAPER)
-- ==============================================================================
CREATE TABLE IF NOT EXISTS b2b_leads (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    campaign_id UUID REFERENCES b2b_campaigns(id) ON DELETE SET NULL,
    
    -- IDENTITAS BISNIS (DARI GOOGLE MAPS)
    place_id TEXT UNIQUE NOT NULL,                       -- Unique Key dari Google
    name TEXT NOT NULL,                                 -- Nama mentah (e.g. "Tambuah Mas ... | Michelin Guide")
    clean_name TEXT NOT NULL,                           -- Nama bersih (e.g. "Tambuah Mas")
    category TEXT DEFAULT 'Indonesian restaurant',      -- Kategori usaha
    country TEXT DEFAULT 'Singapore',
    city TEXT DEFAULT 'Singapore',
    address TEXT NOT NULL,                              -- Alamat lengkap resto
    latitude NUMERIC(10,7),
    longitude NUMERIC(10,7),
    maps_url TEXT,
    
    -- DATA KONTAK LENGKAP
    phone TEXT,                                         -- Format +65 ...
    email TEXT,                                         -- Email terverifikasi
    email_source TEXT,                                  -- Sumber email (mailto_link, website, etc)
    website TEXT,                                       -- URL Website
    cms TEXT,                                           -- WordPress, Wix, Webflow, Shopify, etc
    has_contact_form BOOLEAN DEFAULT false,
    
    -- MEDIA SOSIAL
    instagram_url TEXT,
    facebook_url TEXT,
    tiktok_url TEXT,
    linkedin_url TEXT,
    
    -- SCORING & SINYAL REPUTASI
    rating NUMERIC(3,2) DEFAULT 0,                      -- Skor Google Maps (misal 4.7)
    review_count INT DEFAULT 0,                         -- Total review
    contactability_score INT DEFAULT 50,                -- Skor 0 - 100
    lead_priority b2b_lead_priority DEFAULT 'warm',     -- 'hot' | 'warm' | 'cold'
    opportunity_tags TEXT[],                            -- Array e.g. ['stale_site', 'no_marketing']
    opening_hours JSONB,                                -- Detail jam buka
    
    -- STATUS ENGINE OUTREACH (N8N INTEGRATION)
    status_email b2b_status_flow DEFAULT 'pending',
    status_whatsapp b2b_status_flow DEFAULT 'pending',
    email_sent_count INT DEFAULT 0,
    wa_sent_count INT DEFAULT 0,
    last_contacted_at TIMESTAMPTZ,
    
    -- AI PERSOALISASI
    ai_menu_highlight TEXT,                             -- Sinyal menu dari AI (e.g. "Rendang, Bebek Goreng, Sup")
    ai_custom_icebreaker TEXT,                          -- Kalimat pembuka khusus yang dibuat AI
    ai_generated_subject TEXT,                          -- Subjek email terbaik
    ai_generated_pitch TEXT,                            -- Isi penawaran yang sudah dipersonalisasi
    
    -- METADATA
    scraped_at TIMESTAMPTZ,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

DROP TRIGGER IF EXISTS trg_b2b_leads_updated_at ON b2b_leads;
CREATE TRIGGER trg_b2b_leads_updated_at
BEFORE UPDATE ON b2b_leads
FOR EACH ROW EXECUTE FUNCTION update_b2b_updated_at();

-- ==============================================================================
-- 5. TABEL 3: OUTREACH COMMUNICATION LOGS (RIWAYAT PENGIRIMAN)
-- ==============================================================================
CREATE TABLE IF NOT EXISTS b2b_outreach_logs (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    lead_id UUID NOT NULL REFERENCES b2b_leads(id) ON DELETE CASCADE,
    channel b2b_outreach_channel NOT NULL,              -- 'email' | 'whatsapp'
    recipient TEXT NOT NULL,                            -- Alamat email / nomor WA
    subject TEXT,                                       -- Subjek (jika email)
    message_body TEXT NOT NULL,                         -- Isi pesan utuh
    status TEXT DEFAULT 'sent',                         -- 'sent' | 'failed' | 'delivered'
    error_details TEXT,                                 -- Jika gagal kirim
    sent_at TIMESTAMPTZ DEFAULT NOW(),
    reply_received_at TIMESTAMPTZ,
    reply_content TEXT
);

-- ==============================================================================
-- 6. TABEL 4: SAMPLE TESTER TRACKING (PENGIRIMAN SAMPEL KE SINGAPORE)
-- ==============================================================================
CREATE TABLE IF NOT EXISTS b2b_samples (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    lead_id UUID NOT NULL REFERENCES b2b_leads(id) ON DELETE CASCADE,
    sample_code TEXT UNIQUE NOT NULL,                   -- e.g. "SMP-SG-001"
    variant_sent TEXT NOT NULL,                         -- "Grade S Murni 1kg" | "Grade A Crispy 1kg" | "Combo Pack"
    pic_name TEXT,                                      -- Nama Chef / Manajer penerima
    shipping_courier TEXT DEFAULT 'SingPost / J&T SG',
    tracking_number TEXT,
    status TEXT DEFAULT 'in_transit',                   -- 'in_transit' | 'delivered' | 'feedback_received'
    chef_rating INT,                                    -- Skor kerenyahan/aroma dari chef (1 - 5)
    chef_feedback TEXT,                                 -- Catatan rasa/aroma dari chef
    conversion_deal BOOLEAN DEFAULT false,              -- Apakah lanjut jadi order rutin?
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

DROP TRIGGER IF EXISTS trg_b2b_samples_updated_at ON b2b_samples;
CREATE TRIGGER trg_b2b_samples_updated_at
BEFORE UPDATE ON b2b_samples
FOR EACH ROW EXECUTE FUNCTION update_b2b_updated_at();

-- ==============================================================================
-- 7. TABEL 5: B2B EMAIL OUTREACH QUEUE (OTOMATIS TERSINKRON & TERFILTER DARI B2B_LEADS)
-- ==============================================================================
-- Tabel ini secara otomatis menampung HANYA leads yang memiliki email valid.
-- Terhubung langsung ke b2b_leads (Foreign Key lead_id).
-- Siap ditarik oleh AI Pitching Agent di n8n untuk dibuatkan pitching English.
-- ==============================================================================
CREATE TABLE IF NOT EXISTS b2b_email_outreach_queue (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    lead_id UUID UNIQUE NOT NULL REFERENCES b2b_leads(id) ON DELETE CASCADE,
    restaurant_name TEXT NOT NULL,
    clean_name TEXT NOT NULL,
    email TEXT NOT NULL,
    category TEXT DEFAULT 'Indonesian restaurant',
    country TEXT DEFAULT 'Singapore',
    city TEXT DEFAULT 'Singapore',
    address TEXT,
    rating NUMERIC(3,2) DEFAULT 0,
    review_count INT DEFAULT 0,
    website TEXT,
    instagram_url TEXT,
    contactability_score INT DEFAULT 85,
    lead_priority b2b_lead_priority DEFAULT 'warm',
    status b2b_status_flow DEFAULT 'pending',
    ai_generated_subject TEXT,
    ai_generated_pitch TEXT,
    email_sent_count INT DEFAULT 0,
    last_contacted_at TIMESTAMPTZ,
    error_details TEXT,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

DROP TRIGGER IF EXISTS trg_b2b_email_queue_updated_at ON b2b_email_outreach_queue;
CREATE TRIGGER trg_b2b_email_queue_updated_at
BEFORE UPDATE ON b2b_email_outreach_queue
FOR EACH ROW EXECUTE FUNCTION update_b2b_updated_at();

-- Function & Trigger: Otomatis Filter & Sinkronkan Lead Ber-Email dari b2b_leads
CREATE OR REPLACE FUNCTION fn_sync_lead_to_email_queue()
RETURNS TRIGGER AS $$
BEGIN
    -- Jika lead memiliki email valid
    IF NEW.email IS NOT NULL AND TRIM(NEW.email) != '' AND NEW.email LIKE '%@%' THEN
        INSERT INTO b2b_email_outreach_queue (
            lead_id,
            restaurant_name,
            clean_name,
            email,
            category,
            country,
            city,
            address,
            rating,
            review_count,
            website,
            instagram_url,
            contactability_score,
            lead_priority,
            status,
            ai_generated_subject,
            ai_generated_pitch,
            email_sent_count,
            last_contacted_at
        ) VALUES (
            NEW.id,
            NEW.name,
            NEW.clean_name,
            LOWER(TRIM(NEW.email)),
            NEW.category,
            NEW.country,
            NEW.city,
            NEW.address,
            NEW.rating,
            NEW.review_count,
            NEW.website,
            NEW.instagram_url,
            NEW.contactability_score,
            NEW.lead_priority,
            NEW.status_email,
            NEW.ai_generated_subject,
            NEW.ai_generated_pitch,
            NEW.email_sent_count,
            NEW.last_contacted_at
        )
        ON CONFLICT (lead_id) DO UPDATE SET
            restaurant_name = EXCLUDED.restaurant_name,
            clean_name = EXCLUDED.clean_name,
            email = EXCLUDED.email,
            category = EXCLUDED.category,
            country = EXCLUDED.country,
            city = EXCLUDED.city,
            address = EXCLUDED.address,
            rating = EXCLUDED.rating,
            review_count = EXCLUDED.review_count,
            website = EXCLUDED.website,
            instagram_url = EXCLUDED.instagram_url,
            contactability_score = EXCLUDED.contactability_score,
            lead_priority = EXCLUDED.lead_priority,
            status = EXCLUDED.status,
            ai_generated_subject = COALESCE(EXCLUDED.ai_generated_subject, b2b_email_outreach_queue.ai_generated_subject),
            ai_generated_pitch = COALESCE(EXCLUDED.ai_generated_pitch, b2b_email_outreach_queue.ai_generated_pitch),
            email_sent_count = EXCLUDED.email_sent_count,
            last_contacted_at = EXCLUDED.last_contacted_at,
            updated_at = NOW();
    ELSE
        -- Jika email dihapus atau kosong, hapus otomatis dari antrian
        DELETE FROM b2b_email_outreach_queue WHERE lead_id = NEW.id;
    END IF;
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS trg_sync_lead_to_email_queue ON b2b_leads;
CREATE TRIGGER trg_sync_lead_to_email_queue
AFTER INSERT OR UPDATE ON b2b_leads
FOR EACH ROW EXECUTE FUNCTION fn_sync_lead_to_email_queue();

-- Otomatis Populasi Data Awal dari b2b_leads ke b2b_email_outreach_queue
INSERT INTO b2b_email_outreach_queue (
    lead_id, restaurant_name, clean_name, email, category, country, city,
    address, rating, review_count, website, instagram_url, contactability_score,
    lead_priority, status, ai_generated_subject, ai_generated_pitch,
    email_sent_count, last_contacted_at
)
SELECT 
    id, name, clean_name, LOWER(TRIM(email)), category, country, city,
    address, rating, review_count, website, instagram_url, contactability_score,
    lead_priority, status_email, ai_generated_subject, ai_generated_pitch,
    email_sent_count, last_contacted_at
FROM b2b_leads
WHERE email IS NOT NULL AND TRIM(email) != '' AND email LIKE '%@%'
ON CONFLICT (lead_id) DO NOTHING;

-- ==============================================================================
-- 8. INDEXES UNTUK QUERY N8N SUPAYA SUPER CEPAT
-- ==============================================================================
CREATE INDEX IF NOT EXISTS idx_b2b_leads_priority ON b2b_leads(lead_priority);
CREATE INDEX IF NOT EXISTS idx_b2b_leads_status_email ON b2b_leads(status_email);
CREATE INDEX IF NOT EXISTS idx_b2b_leads_status_wa ON b2b_leads(status_whatsapp);
CREATE INDEX IF NOT EXISTS idx_b2b_leads_email ON b2b_leads(email) WHERE email IS NOT NULL;
CREATE INDEX IF NOT EXISTS idx_b2b_leads_phone ON b2b_leads(phone) WHERE phone IS NOT NULL;

CREATE INDEX IF NOT EXISTS idx_b2b_email_queue_status ON b2b_email_outreach_queue(status);
CREATE INDEX IF NOT EXISTS idx_b2b_email_queue_priority ON b2b_email_outreach_queue(lead_priority);
CREATE INDEX IF NOT EXISTS idx_b2b_email_queue_reviews ON b2b_email_outreach_queue(review_count DESC);

-- ==============================================================================
-- 9. VIEWS UNTUK N8N WORKFLOW AUTOMATION
-- ==============================================================================

-- Drop existing views first to allow column reordering/renaming
DROP VIEW IF EXISTS v_n8n_pending_emails CASCADE;
DROP VIEW IF EXISTS v_n8n_pending_whatsapp CASCADE;

-- View 1: Antrian Cold Email Siap Tarik oleh n8n (Khusus yang memiliki email & status pending)
CREATE OR REPLACE VIEW v_n8n_pending_emails AS
SELECT 
    q.id AS queue_id,
    q.lead_id,
    q.restaurant_name,
    q.clean_name,
    q.category,
    q.country,
    q.city,
    q.address,
    q.email,
    q.website,
    q.instagram_url,
    q.rating,
    q.review_count,
    q.lead_priority,
    q.contactability_score,
    q.status,
    -- Riwayat interaksi masa lalu dari b2b_outreach_logs (Memory)
    COALESCE(
        (SELECT json_agg(json_build_object('subject', log.subject, 'date', log.sent_at)) 
         FROM b2b_outreach_logs log 
         WHERE log.lead_id = q.lead_id),
        '[]'::json
    ) AS past_pitch_history
FROM b2b_email_outreach_queue q
WHERE q.status = 'pending'
ORDER BY 
    CASE q.lead_priority 
        WHEN 'hot' THEN 1 
        WHEN 'warm' THEN 2 
        ELSE 3 
    END,
    q.contactability_score DESC,
    q.review_count DESC;

-- View 2: Antrian WhatsApp Outreach Siap Tarik oleh n8n
CREATE OR REPLACE VIEW v_n8n_pending_whatsapp AS
SELECT 
    id AS lead_id,
    name,
    clean_name,
    category,
    address,
    phone,
    website,
    instagram_url,
    rating,
    review_count,
    lead_priority,
    ai_menu_highlight
FROM b2b_leads
WHERE phone IS NOT NULL 
  AND phone != ''
  AND status_whatsapp = 'pending'
ORDER BY 
    CASE lead_priority 
        WHEN 'hot' THEN 1 
        WHEN 'warm' THEN 2 
        ELSE 3 
    END,
    review_count DESC;

-- ==============================================================================
-- 10. ROW LEVEL SECURITY (RLS) POLICIES FOR SUPABASE ANON & N8N
-- ==============================================================================
ALTER TABLE b2b_campaigns ENABLE ROW LEVEL SECURITY;
ALTER TABLE b2b_leads ENABLE ROW LEVEL SECURITY;
ALTER TABLE b2b_email_outreach_queue ENABLE ROW LEVEL SECURITY;
ALTER TABLE b2b_outreach_logs ENABLE ROW LEVEL SECURITY;
ALTER TABLE b2b_samples ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Allow full access to b2b_campaigns" ON b2b_campaigns;
DROP POLICY IF EXISTS "Allow full access to b2b_leads" ON b2b_leads;
DROP POLICY IF EXISTS "Allow full access to b2b_email_outreach_queue" ON b2b_email_outreach_queue;
DROP POLICY IF EXISTS "Allow full access to b2b_outreach_logs" ON b2b_outreach_logs;
DROP POLICY IF EXISTS "Allow full access to b2b_samples" ON b2b_samples;

CREATE POLICY "Allow full access to b2b_campaigns" ON b2b_campaigns FOR ALL TO public USING (true) WITH CHECK (true);
CREATE POLICY "Allow full access to b2b_leads" ON b2b_leads FOR ALL TO public USING (true) WITH CHECK (true);
CREATE POLICY "Allow full access to b2b_email_outreach_queue" ON b2b_email_outreach_queue FOR ALL TO public USING (true) WITH CHECK (true);
CREATE POLICY "Allow full access to b2b_outreach_logs" ON b2b_outreach_logs FOR ALL TO public USING (true) WITH CHECK (true);
CREATE POLICY "Allow full access to b2b_samples" ON b2b_samples FOR ALL TO public USING (true) WITH CHECK (true);

