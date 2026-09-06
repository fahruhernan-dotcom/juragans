-- =========================================================================
-- JURAGAN B2B DYNAMIC WHATSAPP QUEUE VIEW (INDO & SG SEPARATION) - V2 ROBUST
-- =========================================================================

-- 1. Pastikan tabel juragan_b2b_settings memiliki baris default
CREATE TABLE IF NOT EXISTS public.juragan_b2b_settings (
  id uuid NOT NULL DEFAULT gen_random_uuid(),
  tenant_id uuid,
  active_target_country text DEFAULT 'Indonesia'::text,
  active_target_region text DEFAULT 'Solo Raya'::text,
  is_auto_outreach_active boolean DEFAULT true,
  daily_email_limit integer DEFAULT 10,
  daily_whatsapp_limit integer DEFAULT 10,
  offer_tasting_sample boolean DEFAULT true,
  sample_size_gram integer DEFAULT 100,
  updated_at timestamp with time zone DEFAULT now(),
  CONSTRAINT juragan_b2b_settings_pkey PRIMARY KEY (id)
);

-- Pastikan kolom daily_whatsapp_limit ada
ALTER TABLE IF EXISTS public.juragan_b2b_settings 
ADD COLUMN IF NOT EXISTS daily_whatsapp_limit integer DEFAULT 10;

-- Pastikan ada minimal 1 baris pengaturan default agar tidak kosong
INSERT INTO public.juragan_b2b_settings (
  active_target_country, 
  active_target_region, 
  is_auto_outreach_active, 
  daily_email_limit, 
  daily_whatsapp_limit, 
  offer_tasting_sample, 
  sample_size_gram
)
SELECT 'All', 'Solo Raya & Singapore', true, 10, 10, true, 100
WHERE NOT EXISTS (SELECT 1 FROM public.juragan_b2b_settings);

-- 2. Drop view lama
DROP VIEW IF EXISTS public.v_n8n_pending_whatsapp CASCADE;

-- 3. Buat VIEW: ANTREAN WHATSAPP SIAP KIRIM (v_n8n_pending_whatsapp)
CREATE OR REPLACE VIEW public.v_n8n_pending_whatsapp AS
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
    l.phone,
    l.email,
    l.rating,
    l.review_count,
    l.website,
    l.instagram_url,
    l.maps_url,
    l.lead_priority,
    l.status_whatsapp,
    COALESCE(l.status_whatsapp::text, 'pending') AS status,
    l.ai_menu_highlight,
    l.ai_custom_icebreaker,
    l.ai_generated_pitch,
    l.created_at,
    s.active_target_country AS current_active_country,
    s.is_auto_outreach_active,
    s.daily_whatsapp_limit,
    s.offer_tasting_sample,
    s.sample_size_gram
FROM public.b2b_leads l
CROSS JOIN (
  -- Menggunakan Scalar Subquery agar PASTI selalu menghasilkan 1 baris
  -- meskipun tabel juragan_b2b_settings belum memiliki data.
  SELECT 
    COALESCE(
      (SELECT active_target_country FROM public.juragan_b2b_settings LIMIT 1),
      'All'
    ) AS active_target_country,
    COALESCE(
      (SELECT is_auto_outreach_active FROM public.juragan_b2b_settings LIMIT 1),
      true
    ) AS is_auto_outreach_active,
    COALESCE(
      (SELECT daily_whatsapp_limit FROM public.juragan_b2b_settings LIMIT 1),
      10
    ) AS daily_whatsapp_limit,
    COALESCE(
      (SELECT offer_tasting_sample FROM public.juragan_b2b_settings LIMIT 1),
      true
    ) AS offer_tasting_sample,
    COALESCE(
      (SELECT sample_size_gram FROM public.juragan_b2b_settings LIMIT 1),
      100
    ) AS sample_size_gram
) s
WHERE 
  -- Status WhatsApp harus pending (casting ::text untuk mendukung tipe ENUM b2b_status_flow)
  (l.status_whatsapp::text ILIKE 'pending' OR l.status_whatsapp IS NULL)
  -- Memiliki nomor telepon yang valid (tidak kosong)
  AND (l.phone IS NOT NULL AND TRIM(l.phone) != '')
  -- Bukan record yang sudah dihapus
  AND (l.is_deleted = false OR l.is_deleted IS NULL)
  -- Filter Negara Dinamis & Ketat (Mencegah SG tercampur ke Indo & sebaliknya)
  AND (
    -- Kasus 1: Target Semua Wilayah
    s.active_target_country ILIKE 'All'
    OR s.active_target_country ILIKE 'Semua'
    
    -- Kasus 2: Target Khusus INDONESIA
    OR (
      s.active_target_country ILIKE 'Indonesia'
      AND (
        l.country ILIKE '%indonesia%'
        OR l.country ILIKE '%indo%'
        OR l.country = 'ID'
        OR (
          (l.country IS NULL OR TRIM(l.country) = '')
          AND (l.phone LIKE '+62%' OR l.phone LIKE '62%' OR l.phone LIKE '08%')
        )
      )
      -- Proteksi: Tolak bila ada indikasi Singapore
      AND NOT (
        l.country ILIKE '%singapore%'
        OR l.country ILIKE '%singapura%'
        OR l.country = 'SG'
        OR l.phone LIKE '+65%'
        OR l.phone LIKE '65%'
        OR l.address ILIKE '%singapore%'
      )
    )

    -- Kasus 3: Target Khusus SINGAPORE
    OR (
      s.active_target_country ILIKE 'Singapore'
      AND (
        l.country ILIKE '%singapore%'
        OR l.country ILIKE '%singapura%'
        OR l.country = 'SG'
        OR l.phone LIKE '+65%'
        OR l.phone LIKE '65%'
        OR l.address ILIKE '%singapore%'
      )
      -- Proteksi: Tolak bila ada indikasi nomor Indonesia
      AND NOT (
        l.country ILIKE '%indonesia%'
        OR (l.phone LIKE '+62%' OR l.phone LIKE '62%' OR l.phone LIKE '08%')
      )
    )

    -- Kasus 4: Target Negara Lainnya
    OR (
      s.active_target_country NOT ILIKE 'All'
      AND s.active_target_country NOT ILIKE 'Semua'
      AND s.active_target_country NOT ILIKE 'Indonesia'
      AND s.active_target_country NOT ILIKE 'Singapore'
      AND l.country ILIKE s.active_target_country
    )
  )
ORDER BY 
    CASE l.lead_priority 
        WHEN 'hot' THEN 1 
        WHEN 'warm' THEN 2 
        ELSE 3 
    END,
    l.rating DESC NULLS LAST,
    l.review_count DESC NULLS LAST;

-- 4. Berikan Hak Akses ke Supabase Roles
GRANT SELECT ON public.v_n8n_pending_whatsapp TO anon, authenticated, service_role;
