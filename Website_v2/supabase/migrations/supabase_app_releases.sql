-- ==============================================================================
-- Migration: In-App APK Releases & Storage Setup
-- Description: Creates app_releases table, apk-releases storage bucket, and notification trigger
-- ==============================================================================

-- 1. Create table for tracking app releases
CREATE TABLE IF NOT EXISTS public.app_releases (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    version VARCHAR(50) NOT NULL,              -- e.g. 'v0.9.5'
    build_number INTEGER NOT NULL,            -- e.g. 20260518 (for chronological comparison)
    release_notes TEXT NOT NULL,              -- Changelog description / markdown
    apk_download_url TEXT NOT NULL,           -- Direct APK download URL
    is_mandatory BOOLEAN DEFAULT false,       -- Forced update flag
    min_supported_build INTEGER DEFAULT 0,    -- Minimum supported build number
    created_at TIMESTAMPTZ DEFAULT now(),
    updated_at TIMESTAMPTZ DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.app_releases ENABLE ROW LEVEL SECURITY;

-- Allow public read access to app releases (so all app users can check for updates)
DROP POLICY IF EXISTS "Public can view app releases" ON public.app_releases;
CREATE POLICY "Public can view app releases"
    ON public.app_releases
    FOR SELECT
    USING (true);

-- Allow public and authenticated to insert or update releases
DROP POLICY IF EXISTS "Public and authenticated can manage releases" ON public.app_releases;
CREATE POLICY "Public and authenticated can manage releases"
    ON public.app_releases
    FOR ALL
    USING (true)
    WITH CHECK (true);

-- Create index for quick lookup of latest build
CREATE INDEX IF NOT EXISTS idx_app_releases_build_number ON public.app_releases (build_number DESC);

-- 2. Create public storage bucket for APK releases (Single-file overwrite)
INSERT INTO storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
VALUES (
    'apk-releases',
    'apk-releases',
    true,
    52428800, -- 50MB limit (plenty for APK ~10MB)
    ARRAY['application/vnd.android.package-archive', 'application/octet-stream']
)
ON CONFLICT (id) DO UPDATE SET
    public = true,
    file_size_limit = 52428800;

-- Storage RLS: Allow anyone to read/download APKs
DROP POLICY IF EXISTS "Public APK Access" ON storage.objects;
DROP POLICY IF EXISTS "Allow APK Uploads" ON storage.objects;
DROP POLICY IF EXISTS "Allow APK Updates" ON storage.objects;
DROP POLICY IF EXISTS "Allow authenticated APK upload" ON storage.objects;
DROP POLICY IF EXISTS "Allow authenticated APK update" ON storage.objects;

CREATE POLICY "Public APK Download Only"
    ON storage.objects
    FOR SELECT
    USING (bucket_id = 'apk-releases');

-- Note: Upload & Update are handled exclusively by GitHub Actions / Admin via SUPABASE_SERVICE_ROLE_KEY (bypasses RLS)

-- 3. Automatic Trigger: Broadcast in-app notification to all users when a new release is added
CREATE OR REPLACE FUNCTION public.fn_notify_on_new_app_release()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public, pg_temp
AS $$
DECLARE
    v_user_record RECORD;
BEGIN
    -- Check if notifications table exists
    IF to_regclass('public.notifications') IS NULL THEN
        RETURN NEW;
    END IF;

    -- Broadcast notification to all active users and their tenants
    FOR v_user_record IN (
        SELECT DISTINCT tenant_id, auth_user_id AS user_id
        FROM (
            SELECT tenant_id, auth_user_id 
            FROM public.profiles 
            WHERE tenant_id IS NOT NULL AND auth_user_id IS NOT NULL
            UNION
            SELECT tenant_id, auth_user_id 
            FROM public.tenant_memberships 
            WHERE tenant_id IS NOT NULL AND auth_user_id IS NOT NULL
        ) u
    )
    LOOP
        BEGIN
            INSERT INTO public.notifications (
                tenant_id,
                user_id,
                type,
                title,
                body,
                data,
                is_read,
                created_at
            ) VALUES (
                v_user_record.tenant_id,
                v_user_record.user_id,
                'SYSTEM_ALERT',
                '🚀 Pembaruan Aplikasi ' || NEW.version || ' Tersedia!',
                'Telah hadir versi baru dengan perbaikan sistem & fitur terbaru. Buka menu Akun > Periksa Pembaruan untuk update.',
                jsonb_build_object('version', NEW.version, 'build_number', NEW.build_number, 'route', '/dashboard/akun'),
                FALSE,
                NOW()
            );
        EXCEPTION WHEN OTHERS THEN
            NULL;
        END;
    END LOOP;

    RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS tr_notify_on_new_app_release ON public.app_releases;
CREATE TRIGGER tr_notify_on_new_app_release
    AFTER INSERT ON public.app_releases
    FOR EACH ROW
    EXECUTE FUNCTION public.fn_notify_on_new_app_release();

-- 4. Seed initial release data
INSERT INTO public.app_releases (version, build_number, release_notes, apk_download_url, is_mandatory)
VALUES (
    'v0.9.5',
    20260518,
    '• Perbaikan sistem Edit Nota (barang lama tersimpan utuh dan tidak ter-reset)' || E'\n' ||
    '• Validasi pemilihan toko cerdas dan auto-save toko baru' || E'\n' ||
    '• Pesan error lebih ramah dan informatif bagi pengguna' || E'\n' ||
    '• Fitur periksa & pasang pembaruan APK langsung dari dalam aplikasi',
    'https://kqbxzokrpcwuxrfjshuf.supabase.co/storage/v1/object/public/apk-releases/app-latest.apk',
    false
)
ON CONFLICT DO NOTHING;
