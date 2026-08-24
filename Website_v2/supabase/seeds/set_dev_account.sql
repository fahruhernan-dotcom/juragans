-- =============================================================================
-- GOPEK / SEMBAKO OS - REGISTER & SET USER FAHRUHERNANSAKTI@GMAIL.COM AS DEV SUPERADMIN
-- Jalankan script ini di Supabase SQL Editor:
-- (Supabase Dashboard -> SQL Editor -> New Query -> Paste & Run)
-- =============================================================================

CREATE EXTENSION IF NOT EXISTS pgcrypto;

DO $$
DECLARE
    v_user_id UUID;
    v_tenant_id UUID := '00000000-0000-0000-0000-000000000002';
    v_email TEXT := 'fahruhernansakti@gmail.com';
    v_password TEXT := 'Hernan2004';
    v_full_name TEXT := 'Fahru Hernan Sakti (Dev)';
BEGIN
    -- 1. Pastikan Default Tenant Tersedia
    IF NOT EXISTS (SELECT 1 FROM tenants WHERE id = v_tenant_id) THEN
        INSERT INTO tenants (id, owner_id, business_name, business_vertical, user_type, sub_type, plan)
        VALUES (v_tenant_id, v_tenant_id, 'Broker Dashboard Sembako', 'distributor_sembako', 'broker', 'distributor_sembako', 'pro');
    END IF;

    -- 2. Cari atau Buat Akun di auth.users
    SELECT id INTO v_user_id FROM auth.users WHERE LOWER(email) = LOWER(v_email) LIMIT 1;

    IF v_user_id IS NULL THEN
        v_user_id := gen_random_uuid();

        INSERT INTO auth.users (
            id,
            instance_id,
            aud,
            role,
            email,
            encrypted_password,
            email_confirmed_at,
            raw_app_meta_data,
            raw_user_meta_data,
            created_at,
            updated_at
        ) VALUES (
            v_user_id,
            '00000000-0000-0000-0000-000000000000',
            'authenticated',
            'authenticated',
            v_email,
            crypt(v_password, gen_salt('bf', 10)),
            NOW(),
            '{"provider":"email","providers":["email"],"is_superadmin":true}'::jsonb,
            jsonb_build_object('full_name', v_full_name),
            NOW(),
            NOW()
        );
        RAISE NOTICE 'User auth DEV baru berhasil dibuat dengan ID: %', v_user_id;
    ELSE
        -- Update password, metadata superadmin & langsung konfirmasi email
        UPDATE auth.users 
        SET encrypted_password = crypt(v_password, gen_salt('bf', 10)),
            email_confirmed_at = COALESCE(email_confirmed_at, NOW()),
            aud = 'authenticated',
            role = 'authenticated',
            raw_app_meta_data = COALESCE(raw_app_meta_data, '{}'::jsonb) || '{"is_superadmin":true}'::jsonb,
            raw_user_meta_data = COALESCE(raw_user_meta_data, '{}'::jsonb) || jsonb_build_object('full_name', v_full_name),
            updated_at = NOW()
        WHERE id = v_user_id;
        RAISE NOTICE 'User auth DEV ditemukan (ID: %), password & status superadmin diperbarui.', v_user_id;
    END IF;

    -- 3. Sinkronkan auth.identities (id menggunakan tipe UUID)
    DELETE FROM auth.identities WHERE user_id = v_user_id;

    INSERT INTO auth.identities (
        id,
        provider_id,
        user_id,
        identity_data,
        provider,
        last_sign_in_at,
        created_at,
        updated_at
    ) VALUES (
        v_user_id,
        v_user_id::text,
        v_user_id,
        jsonb_build_object('sub', v_user_id::text, 'email', v_email, 'email_verified', true),
        'email',
        NOW(),
        NOW(),
        NOW()
    );

    -- 4. Update atau Insert ke tabel profiles
    IF EXISTS (SELECT 1 FROM profiles WHERE auth_user_id = v_user_id OR LOWER(email) = LOWER(v_email)) THEN
        UPDATE profiles 
        SET auth_user_id = v_user_id,
            role = 'dev',
            app_role = 'dev',
            user_type = 'broker',
            sub_type = 'distributor_sembako',
            tenant_id = v_tenant_id,
            full_name = COALESCE(full_name, v_full_name),
            email = v_email,
            onboarded = true,
            business_model_selected = true,
            updated_at = NOW()
        WHERE auth_user_id = v_user_id OR LOWER(email) = LOWER(v_email);
    ELSE
        INSERT INTO profiles (
            id,
            auth_user_id,
            tenant_id,
            full_name,
            email,
            role,
            app_role,
            user_type,
            sub_type,
            business_name,
            onboarded,
            business_model_selected,
            created_at,
            updated_at
        ) VALUES (
            gen_random_uuid(),
            v_user_id,
            v_tenant_id,
            v_full_name,
            v_email,
            'dev',
            'dev',
            'broker',
            'distributor_sembako',
            'Broker Dashboard Sembako',
            true,
            true,
            NOW(),
            NOW()
        );
    END IF;

    -- 5. Update atau Insert ke tabel tenant_memberships
    IF EXISTS (
        SELECT 1 FROM information_schema.tables 
        WHERE table_schema = 'public' AND table_name = 'tenant_memberships'
    ) THEN
        INSERT INTO tenant_memberships (
            id, auth_user_id, tenant_id, role, app_role, full_name, email, onboarded, created_at, updated_at
        ) VALUES (
            gen_random_uuid(),
            v_user_id,
            v_tenant_id,
            'dev',
            'dev',
            v_full_name,
            v_email,
            true,
            NOW(),
            NOW()
        )
        ON CONFLICT (auth_user_id, tenant_id) 
        DO UPDATE SET 
            role = 'dev',
            app_role = 'dev',
            full_name = EXCLUDED.full_name,
            email = EXCLUDED.email,
            onboarded = true,
            updated_at = NOW();
    END IF;

    RAISE NOTICE '=======================================================';
    RAISE NOTICE 'SUCCESS: Akun DEV SUPERADMIN berhasil diset!';
    RAISE NOTICE 'Email   : %', v_email;
    RAISE NOTICE 'Password: %', v_password;
    RAISE NOTICE 'Role    : dev / superadmin';
    RAISE NOTICE 'Tenant  : %', v_tenant_id;
    RAISE NOTICE '=======================================================';
END $$;
