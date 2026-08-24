-- =============================================================================
-- GOPEK / SEMBAKO OS - NOTIFICATION INFRASTRUCTURE SCHEMA (FASE 1)
-- File: supabase_notifications_schema.sql
-- 
-- Fitur:
-- 1. device_tokens: Menyimpan token FCM unik per perangkat user
-- 2. notification_preferences: Pengaturan preferensi notifikasi per user per tenant
-- 3. notifications: Histori notifikasi in-app untuk icon bell (🔔)
-- 4. notification_events: Outbox queue untuk event notifikasi asynchronous
-- 
-- Kepatuhan Keamanan:
-- - Row Level Security (RLS) diaktifkan pada semua tabel.
-- - Menggunakan helper function existing `public.has_tenant_access(target_tenant_id)`.
-- - Isolasi multi-tenant ketat & isolasi antar user.
-- - Mencegah client-side arbitrary notification injection (Insert notifications hanya via Service Role / Security Definer).
-- =============================================================================

-- Pastikan extension pgcrypto tersedia untuk gen_random_uuid()
CREATE EXTENSION IF NOT EXISTS "pgcrypto";

-- =============================================================================
-- 1. TABEL: device_tokens
-- =============================================================================
CREATE TABLE IF NOT EXISTS public.device_tokens (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    tenant_id UUID NOT NULL REFERENCES public.tenants(id) ON DELETE CASCADE,
    user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    device_token TEXT NOT NULL,
    platform TEXT NOT NULL DEFAULT 'android', -- 'android' | 'ios' | 'web'
    device_name TEXT,                        -- contoh: 'Samsung Galaxy A54', 'Xiaomi Redmi Note 12'
    is_active BOOLEAN NOT NULL DEFAULT TRUE,
    last_seen TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    CONSTRAINT uq_device_token UNIQUE (device_token)
);

-- Indexing untuk query cepat
CREATE INDEX IF NOT EXISTS idx_device_tokens_user_tenant_active 
ON public.device_tokens(user_id, tenant_id, is_active);

CREATE INDEX IF NOT EXISTS idx_device_tokens_token 
ON public.device_tokens(device_token);

CREATE INDEX IF NOT EXISTS idx_device_tokens_tenant 
ON public.device_tokens(tenant_id);

-- Enable RLS
ALTER TABLE public.device_tokens ENABLE ROW LEVEL SECURITY;

-- Drop existing policies if any (idempotency)
DO $$ 
BEGIN
    DROP POLICY IF EXISTS "Users can view their own device tokens" ON public.device_tokens;
    DROP POLICY IF EXISTS "Users can insert their own device tokens" ON public.device_tokens;
    DROP POLICY IF EXISTS "Users can update their own device tokens" ON public.device_tokens;
    DROP POLICY IF EXISTS "Users can delete their own device tokens" ON public.device_tokens;
    DROP POLICY IF EXISTS "Tenant Isolation for device_tokens" ON public.device_tokens;
EXCEPTION WHEN OTHERS THEN NULL;
END $$;

-- Policy 1: SELECT - User hanya bisa membaca token miliknya sendiri di dalam tenant yang sah
CREATE POLICY "Users can view their own device tokens" 
ON public.device_tokens FOR SELECT 
TO authenticated 
USING (
    auth.uid() IS NOT NULL 
    AND auth.uid() = user_id 
    AND public.has_tenant_access(tenant_id)
);

-- Policy 2: INSERT - User hanya bisa mendaftarkan token untuk dirinya sendiri
CREATE POLICY "Users can insert their own device tokens" 
ON public.device_tokens FOR INSERT 
TO authenticated 
WITH CHECK (
    auth.uid() IS NOT NULL 
    AND auth.uid() = user_id 
    AND public.has_tenant_access(tenant_id)
);

-- Policy 3: UPDATE - User hanya bisa mengubah token miliknya sendiri
CREATE POLICY "Users can update their own device tokens" 
ON public.device_tokens FOR UPDATE 
TO authenticated 
USING (
    auth.uid() IS NOT NULL 
    AND auth.uid() = user_id 
    AND public.has_tenant_access(tenant_id)
)
WITH CHECK (
    auth.uid() IS NOT NULL 
    AND auth.uid() = user_id 
    AND public.has_tenant_access(tenant_id)
);

-- Policy 4: DELETE - User hanya bisa menghapus token miliknya sendiri
CREATE POLICY "Users can delete their own device tokens" 
ON public.device_tokens FOR DELETE 
TO authenticated 
USING (
    auth.uid() IS NOT NULL 
    AND auth.uid() = user_id 
    AND public.has_tenant_access(tenant_id)
);


-- =============================================================================
-- 2. TABEL: notification_preferences
-- =============================================================================
CREATE TABLE IF NOT EXISTS public.notification_preferences (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    tenant_id UUID NOT NULL REFERENCES public.tenants(id) ON DELETE CASCADE,
    user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    notify_new_sale BOOLEAN NOT NULL DEFAULT TRUE,
    notify_payment_received BOOLEAN NOT NULL DEFAULT TRUE,
    notify_sale_status_changed BOOLEAN NOT NULL DEFAULT TRUE,
    notify_low_stock BOOLEAN NOT NULL DEFAULT TRUE,
    notify_delivery BOOLEAN NOT NULL DEFAULT TRUE,
    notify_system_alert BOOLEAN NOT NULL DEFAULT TRUE,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    CONSTRAINT uq_user_tenant_preferences UNIQUE (tenant_id, user_id)
);

-- Indexing
CREATE INDEX IF NOT EXISTS idx_notification_pref_tenant_user 
ON public.notification_preferences(tenant_id, user_id);

-- Enable RLS
ALTER TABLE public.notification_preferences ENABLE ROW LEVEL SECURITY;

DO $$ 
BEGIN
    DROP POLICY IF EXISTS "Users can view their own preferences" ON public.notification_preferences;
    DROP POLICY IF EXISTS "Users can insert their own preferences" ON public.notification_preferences;
    DROP POLICY IF EXISTS "Users can update their own preferences" ON public.notification_preferences;
EXCEPTION WHEN OTHERS THEN NULL;
END $$;

-- Policy 1: SELECT
CREATE POLICY "Users can view their own preferences" 
ON public.notification_preferences FOR SELECT 
TO authenticated 
USING (
    auth.uid() IS NOT NULL 
    AND auth.uid() = user_id 
    AND public.has_tenant_access(tenant_id)
);

-- Policy 2: INSERT
CREATE POLICY "Users can insert their own preferences" 
ON public.notification_preferences FOR INSERT 
TO authenticated 
WITH CHECK (
    auth.uid() IS NOT NULL 
    AND auth.uid() = user_id 
    AND public.has_tenant_access(tenant_id)
);

-- Policy 3: UPDATE
CREATE POLICY "Users can update their own preferences" 
ON public.notification_preferences FOR UPDATE 
TO authenticated 
USING (
    auth.uid() IS NOT NULL 
    AND auth.uid() = user_id 
    AND public.has_tenant_access(tenant_id)
)
WITH CHECK (
    auth.uid() IS NOT NULL 
    AND auth.uid() = user_id 
    AND public.has_tenant_access(tenant_id)
);


-- =============================================================================
-- 3. TABEL: notifications (In-App History & Notification Center)
-- =============================================================================
CREATE TABLE IF NOT EXISTS public.notifications (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    tenant_id UUID NOT NULL REFERENCES public.tenants(id) ON DELETE CASCADE,
    user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    type TEXT NOT NULL,              -- 'NEW_SALE' | 'PAYMENT_RECEIVED' | 'LOW_STOCK' | 'SALE_STATUS_CHANGED' | 'DELIVERY_REMINDER' | 'SYSTEM_ALERT'
    title TEXT NOT NULL,             -- contoh: "Pesanan Baru Masuk"
    body TEXT NOT NULL,              -- contoh: "INV-2026-001 • Bawang Merah 10 Kg (Rp 150.000)"
    data JSONB NOT NULL DEFAULT '{}'::jsonb, -- metadata: { "sale_id": "...", "route": "/broker/sembako/penjualan?saleId=..." }
    is_read BOOLEAN NOT NULL DEFAULT FALSE,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Indexing untuk query unread & pagination histori
CREATE INDEX IF NOT EXISTS idx_notifications_user_tenant_unread 
ON public.notifications(user_id, tenant_id, is_read, created_at DESC);

CREATE INDEX IF NOT EXISTS idx_notifications_tenant_created 
ON public.notifications(tenant_id, created_at DESC);

-- Enable RLS
ALTER TABLE public.notifications ENABLE ROW LEVEL SECURITY;

DO $$ 
BEGIN
    DROP POLICY IF EXISTS "Users can view their own notifications" ON public.notifications;
    DROP POLICY IF EXISTS "Users can update read status on their own notifications" ON public.notifications;
    DROP POLICY IF EXISTS "Users can delete their own notifications" ON public.notifications;
    DROP POLICY IF EXISTS "Service role has full access to notifications" ON public.notifications;
EXCEPTION WHEN OTHERS THEN NULL;
END $$;

-- Policy 1: SELECT - User hanya bisa membaca notifikasi yang ditujukan kepadanya dalam tenant-nya
CREATE POLICY "Users can view their own notifications" 
ON public.notifications FOR SELECT 
TO authenticated 
USING (
    auth.uid() IS NOT NULL 
    AND auth.uid() = user_id 
    AND public.has_tenant_access(tenant_id)
);

-- Policy 2: UPDATE - User HANYA bisa update notifikasi miliknya sendiri (misal: tandai sudah dibaca / mark as read)
CREATE POLICY "Users can update read status on their own notifications" 
ON public.notifications FOR UPDATE 
TO authenticated 
USING (
    auth.uid() IS NOT NULL 
    AND auth.uid() = user_id 
    AND public.has_tenant_access(tenant_id)
)
WITH CHECK (
    auth.uid() IS NOT NULL 
    AND auth.uid() = user_id 
    AND public.has_tenant_access(tenant_id)
);

-- Policy 3: DELETE - User bisa menghapus notifikasi miliknya sendiri
CREATE POLICY "Users can delete their own notifications" 
ON public.notifications FOR DELETE 
TO authenticated 
USING (
    auth.uid() IS NOT NULL 
    AND auth.uid() = user_id 
    AND public.has_tenant_access(tenant_id)
);

-- PENTING: TIDAK ADA POLICY INSERT UNTUK AUTHENTICATED USER BIASA.
-- Ini mencegah user menyuntikkan notifikasi palsu (arbitrary notification injection / spoofing) dari client side.
-- Insert notifikasi hanya dilakukan oleh backend / Service Role / Security Definer function pada fase berikutnya.


-- =============================================================================
-- 4. TABEL: notification_events (Outbox Layer untuk Asynchronous Dispatcher)
-- =============================================================================
CREATE TABLE IF NOT EXISTS public.notification_events (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    tenant_id UUID NOT NULL REFERENCES public.tenants(id) ON DELETE CASCADE,
    event_type TEXT NOT NULL,         -- 'NEW_SALE' | 'PAYMENT_RECEIVED' | 'LOW_STOCK' | 'DELIVERY'
    source_table TEXT NOT NULL,       -- 'sembako_sales' | 'sembako_payments' | 'sembako_products'
    source_record_id UUID,
    payload JSONB NOT NULL DEFAULT '{}'::jsonb,
    status TEXT NOT NULL DEFAULT 'pending', -- 'pending' | 'processing' | 'completed' | 'failed'
    attempt_count INT NOT NULL DEFAULT 0,
    last_error TEXT,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    processed_at TIMESTAMPTZ
);

-- Indexing untuk polling / trigger processing
CREATE INDEX IF NOT EXISTS idx_notif_events_status_created 
ON public.notification_events(status, created_at ASC);

CREATE INDEX IF NOT EXISTS idx_notif_events_tenant 
ON public.notification_events(tenant_id);

-- Enable RLS
ALTER TABLE public.notification_events ENABLE ROW LEVEL SECURITY;

DO $$ 
BEGIN
    DROP POLICY IF EXISTS "Tenant Isolation for notification_events" ON public.notification_events;
EXCEPTION WHEN OTHERS THEN NULL;
END $$;

-- Policy: Hanya user dengan akses tenant yang sah yang bisa melihat event outbox jika diperlukan untuk logging
CREATE POLICY "Tenant Isolation for notification_events" 
ON public.notification_events FOR SELECT 
TO authenticated 
USING (
    public.has_tenant_access(tenant_id)
);


-- =============================================================================
-- 5. HELPER FUNCTION: register_or_update_device_token (SECURITY DEFINER)
-- Mempermudah client APK untuk meregistrasi/update token secara atomic & aman.
-- =============================================================================
CREATE OR REPLACE FUNCTION public.register_device_token(
    p_tenant_id UUID,
    p_device_token TEXT,
    p_platform TEXT DEFAULT 'android',
    p_device_name TEXT DEFAULT NULL
)
RETURNS UUID AS $$
DECLARE
    v_token_id UUID;
BEGIN
    -- Validasi autentikasi
    IF auth.uid() IS NULL THEN
        RAISE EXCEPTION 'Not authenticated';
    END IF;

    -- Validasi hak akses tenant
    IF NOT public.has_tenant_access(p_tenant_id) THEN
        RAISE EXCEPTION 'Access denied to tenant %', p_tenant_id;
    END IF;

    -- Upsert token: Jika token sudah ada (misal re-login atau switch akun), update owner & last_seen
    INSERT INTO public.device_tokens (
        tenant_id,
        user_id,
        device_token,
        platform,
        device_name,
        is_active,
        last_seen,
        updated_at
    )
    VALUES (
        p_tenant_id,
        auth.uid(),
        p_device_token,
        COALESCE(p_platform, 'android'),
        p_device_name,
        TRUE,
        NOW(),
        NOW()
    )
    ON CONFLICT (device_token)
    DO UPDATE SET
        tenant_id = EXCLUDED.tenant_id,
        user_id = EXCLUDED.user_id,
        platform = EXCLUDED.platform,
        device_name = COALESCE(EXCLUDED.device_name, public.device_tokens.device_name),
        is_active = TRUE,
        last_seen = NOW(),
        updated_at = NOW()
    RETURNING id INTO v_token_id;

    RETURN v_token_id;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = public, pg_temp;

-- Grant execution permission to authenticated users
GRANT EXECUTE ON FUNCTION public.register_device_token(UUID, TEXT, TEXT, TEXT) TO authenticated;
