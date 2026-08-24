-- =========================================================================
-- JURAGAN B2B OUTREACH CONTROL SCHEMA & N8N DYNAMIC VIEW
-- =========================================================================

-- 1. Table for B2B Outreach Engine Settings
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

-- Insert default row if not exists
INSERT INTO public.juragan_b2b_settings (active_target_country, active_target_region, is_auto_outreach_active, daily_email_limit, offer_tasting_sample)
SELECT 'Indonesia', 'Solo Raya', true, 10, true
WHERE NOT EXISTS (SELECT 1 FROM public.juragan_b2b_settings);

-- 2. Dynamic View for n8n Workflow Engine
-- n8n reads from this view directly to only process leads matching the web dashboard's active switches!
CREATE OR REPLACE VIEW public.v_n8n_active_pending_leads AS
SELECT 
  l.id,
  l.place_id,
  l.name,
  l.clean_name,
  l.category,
  l.country,
  l.city,
  l.address,
  l.phone,
  l.email,
  l.website,
  l.maps_url,
  l.rating,
  l.review_count,
  l.lead_priority,
  l.status_email,
  l.ai_menu_highlight,
  l.ai_custom_icebreaker,
  l.ai_generated_subject,
  l.ai_generated_pitch,
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
  AND (l.status_email = 'pending')
  AND (l.email IS NOT NULL AND l.email <> '')
  AND (l.is_deleted = false OR l.is_deleted IS NULL)
  AND (
    s.active_target_country = 'All' 
    OR s.active_target_country = 'Semua'
    OR l.country ILIKE s.active_target_country
  )
ORDER BY 
  CASE WHEN l.lead_priority = 'hot' THEN 1 WHEN l.lead_priority = 'warm' THEN 2 ELSE 3 END,
  l.rating DESC NULLS LAST;

-- Enable RLS & open policy for authenticated users
ALTER TABLE public.juragan_b2b_settings ENABLE ROW LEVEL SECURITY;

DO $$ 
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies 
    WHERE tablename = 'juragan_b2b_settings' 
    AND policyname = 'Allow all access to juragan_b2b_settings'
  ) THEN
    CREATE POLICY "Allow all access to juragan_b2b_settings" 
    ON public.juragan_b2b_settings 
    FOR ALL 
    TO public 
    USING (true) 
    WITH CHECK (true);
  END IF;
END $$;
