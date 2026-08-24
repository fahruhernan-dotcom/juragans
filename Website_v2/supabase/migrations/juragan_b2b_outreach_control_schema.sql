-- =========================================================================
-- JURAGAN B2B DYNAMIC EMAIL QUEUE & SCRAPER VIEW (REALTIME WEB SYNC)
-- =========================================================================

-- 1. Table for B2B Settings (Singleton Config)
CREATE TABLE IF NOT EXISTS public.juragan_b2b_settings (
  id uuid NOT NULL DEFAULT uuid_generate_v4(),
  tenant_id uuid,
  active_target_country text DEFAULT 'Indonesia'::text,
  active_target_region text DEFAULT 'Solo Raya'::text,
  is_auto_outreach_active boolean DEFAULT true,
  daily_email_limit integer DEFAULT 10,
  offer_tasting_sample boolean DEFAULT true,
  sample_size_gram integer DEFAULT 100,
  updated_at timestamp with time zone DEFAULT now(),
  CONSTRAINT juragan_b2b_settings_pkey PRIMARY KEY (id)
);

INSERT INTO public.juragan_b2b_settings (active_target_country, active_target_region, is_auto_outreach_active, daily_email_limit, offer_tasting_sample)
SELECT 'Indonesia', 'Solo Raya', true, 10, true
WHERE NOT EXISTS (SELECT 1 FROM public.juragan_b2b_settings);

-- 2. VIEW 1: ANTREAN EMAIL SIAP KIRIM (v_n8n_pending_emails)
-- n8n node "Pharsing All Scarping Data with Contain Email" membaca view ini
CREATE OR REPLACE VIEW public.v_n8n_pending_emails AS
SELECT 
    l.id AS lead_id,
    l.id,
    l.place_id,
    l.name AS restaurant_name,
    l.name,
    l.clean_name,
    l.category,
    l.country,
    l.city,
    l.address,
    l.email,
    l.phone,
    l.rating,
    l.review_count,
    l.website,
    l.instagram_url,
    l.maps_url,
    l.lead_priority,
    l.status_email,
    COALESCE(l.status_email, 'pending') AS status,
    l.ai_menu_highlight,
    l.ai_custom_icebreaker,
    l.ai_generated_subject,
    l.ai_generated_pitch,
    l.created_at,
    s.active_target_country AS current_active_country,
    s.is_auto_outreach_active,
    s.daily_email_limit,
    s.offer_tasting_sample,
    s.sample_size_gram
FROM public.b2b_leads l
CROSS JOIN (
  SELECT active_target_country, is_auto_outreach_active, daily_email_limit, offer_tasting_sample, sample_size_gram
  FROM public.juragan_b2b_settings
  LIMIT 1
) s
WHERE (s.is_auto_outreach_active = true)
  AND (l.status_email = 'pending' OR l.status_email IS NULL)
  AND (l.email IS NOT NULL AND l.email LIKE '%@%')
  AND (l.is_deleted = false OR l.is_deleted IS NULL)
  AND (
    s.active_target_country = 'All' 
    OR s.active_target_country = 'Semua'
    OR l.country ILIKE s.active_target_country
  )
ORDER BY 
    CASE l.lead_priority 
        WHEN 'hot' THEN 1 
        WHEN 'warm' THEN 2 
        ELSE 3 
    END,
    l.rating DESC NULLS LAST;

-- Alias view for backward compatibility
CREATE OR REPLACE VIEW public.v_n8n_active_pending_leads AS
SELECT * FROM public.v_n8n_pending_emails;

-- 3. VIEW 2: ANTREAN SCRAPER WILAYAH (v_n8n_active_scraping_queue)
-- n8n node "Get Location Sraping Queue" membaca view ini
CREATE OR REPLACE VIEW public.v_n8n_active_scraping_queue AS
SELECT 
    q.id AS queue_id,
    q.id,
    q.country,
    q.city_or_region,
    q.target_location,
    q.status,
    q.total_leads_collected,
    q.notes,
    q.created_at,
    s.active_target_country AS current_active_country
FROM public.b2b_scraping_queue q
CROSS JOIN (
  SELECT active_target_country, is_auto_outreach_active 
  FROM public.juragan_b2b_settings 
  LIMIT 1
) s
WHERE (s.is_auto_outreach_active = true)
  AND (q.status = 'pending')
  AND (
    s.active_target_country = 'All' 
    OR s.active_target_country = 'Semua' 
    OR q.country ILIKE s.active_target_country
  )
ORDER BY q.created_at ASC;

-- Grant permissions
GRANT SELECT ON public.v_n8n_pending_emails TO anon, authenticated, service_role;
GRANT SELECT ON public.v_n8n_active_pending_leads TO anon, authenticated, service_role;
GRANT SELECT ON public.v_n8n_active_scraping_queue TO anon, authenticated, service_role;
