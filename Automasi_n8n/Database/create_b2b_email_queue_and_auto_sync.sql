-- ==============================================================================
-- MIGRATION: B2B EMAIL OUTREACH QUEUE & AUTO-SYNC TRIGGER
-- ==============================================================================
-- Tabel ini secara otomatis menampung & memfilter SEMUA data prospek yang
-- memiliki email valid dari hasil scraping Google Maps (tabel b2b_leads).
-- Siap di-query oleh AI Agent (n8n) untuk pembuatan pitching English.
-- ==============================================================================

-- 1. Buat Tabel b2b_email_outreach_queue
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

-- 2. Trigger Auto-Updated Timestamp
DROP TRIGGER IF EXISTS trg_b2b_email_queue_updated_at ON b2b_email_outreach_queue;
CREATE TRIGGER trg_b2b_email_queue_updated_at
BEFORE UPDATE ON b2b_email_outreach_queue
FOR EACH ROW EXECUTE FUNCTION update_b2b_updated_at();

-- 3. Database Trigger Function: Otomatis Filter & Sync yang Punya Email dari b2b_leads
CREATE OR REPLACE FUNCTION fn_sync_lead_to_email_queue()
RETURNS TRIGGER AS $$
BEGIN
    -- Jika lead memiliki email yang valid
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
        -- Jika email dihapus atau kosong, hapus otomatis dari queue
        DELETE FROM b2b_email_outreach_queue WHERE lead_id = NEW.id;
    END IF;
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- 4. Pasang Trigger ke Tabel b2b_leads
DROP TRIGGER IF EXISTS trg_sync_lead_to_email_queue ON b2b_leads;
CREATE TRIGGER trg_sync_lead_to_email_queue
AFTER INSERT OR UPDATE ON b2b_leads
FOR EACH ROW EXECUTE FUNCTION fn_sync_lead_to_email_queue();

-- 5. Populasi Langsung Data yang Sudah Ada di b2b_leads
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

-- 6. Indexes & RLS Policy
CREATE INDEX IF NOT EXISTS idx_b2b_email_queue_status ON b2b_email_outreach_queue(status);
CREATE INDEX IF NOT EXISTS idx_b2b_email_queue_priority ON b2b_email_outreach_queue(lead_priority);
CREATE INDEX IF NOT EXISTS idx_b2b_email_queue_reviews ON b2b_email_outreach_queue(review_count DESC);

ALTER TABLE b2b_email_outreach_queue ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "Allow full access to b2b_email_outreach_queue" ON b2b_email_outreach_queue;
CREATE POLICY "Allow full access to b2b_email_outreach_queue" ON b2b_email_outreach_queue FOR ALL TO public USING (true) WITH CHECK (true);

-- 7. View Otomatis Rerank untuk AI Agent (n8n Fetch)
DROP VIEW IF EXISTS v_n8n_pending_emails CASCADE;
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
    -- Long-term interaction memory
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
