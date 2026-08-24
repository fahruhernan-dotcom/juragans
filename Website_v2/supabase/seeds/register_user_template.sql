-- ==============================================================================
-- 👑 VIRGIN MASTER DASHBOARD — UNIVERSAL USER REGISTRATION & ROLE ASSIGNMENT
-- ==============================================================================
-- Skrip serbaguna untuk mendaftarkan pengguna baru (Owner / Admin / Staff / Dev)
-- dan menghubungkannya ke tenant toko tertentu di Supabase.
-- ==============================================================================

DO $$
DECLARE
    -- ── 1. SESUAIKAN PARAMETER PENGGUNA BARU DI SINI ─────────────────────────
    v_email         TEXT := 'owner@tokobarumu.com';         -- Email akun login
    v_password      TEXT := 'PasswordAman123!';             -- Password login
    v_full_name     TEXT := 'Nama Pemilik / Admin';        -- Nama lengkap pengguna
    v_role          TEXT := 'owner';                        -- 'owner' | 'admin' | 'staff' | 'dev'
    v_business_name TEXT := 'Nama Toko / Distributor Baru'; -- Nama usaha bisnis klien
    v_sub_type      TEXT := 'distributor_sembako';          -- Vertikal bisnis
    
    -- ── VARIABEL INTERNAL ───────────────────────────────────────────────────
    v_user_id       UUID;
    v_tenant_id     UUID;
    v_profile_id    UUID := gen_random_uuid();
    v_encrypted_pw  TEXT;
BEGIN
    -- Hitung enkripsi password menggunakan bcrypt blowfish
    v_encrypted_pw := crypt(v_password, gen_salt('bf'));

    -- 1. Cek apakah user sudah ada di auth.users
    SELECT id INTO v_user_id FROM auth.users WHERE email = v_email;

    IF v_user_id IS NULL THEN
        v_user_id := gen_random_uuid();
        
        -- Insert ke auth.users
        INSERT INTO auth.users (
            instance_id, id, aud, role, email, encrypted_password,
            email_confirmed_at, raw_app_meta_data, raw_user_meta_data,
            created_at, updated_at, confirmation_token, email_change, email_change_token_new, recovery_token
        ) VALUES (
            '00000000-0000-0000-0000-000000000000',
            v_user_id,
            'authenticated',
            'authenticated',
            v_email,
            v_encrypted_pw,
            NOW(),
            '{"provider":"email","providers":["email"]}'::jsonb,
            jsonb_build_object('full_name', v_full_name, 'role', v_role),
            NOW(),
            NOW(),
            '', '', '', ''
        );

        -- Insert ke auth.identities
        INSERT INTO auth.identities (
            id, provider_id, user_id, identity_data, provider, last_sign_in_at, created_at, updated_at
        ) VALUES (
            v_user_id, v_user_id, v_user_id,
            jsonb_build_object('sub', v_user_id::text, 'email', v_email),
            'email', NOW(), NOW(), NOW()
        ) ON CONFLICT (id) DO NOTHING;
        
        RAISE NOTICE '✅ Akun auth.users baru dibuat dengan ID: %', v_user_id;
    ELSE
        -- Update password jika user sudah ada
        UPDATE auth.users 
        SET encrypted_password = v_encrypted_pw,
            raw_user_meta_data = jsonb_build_object('full_name', v_full_name, 'role', v_role),
            updated_at = NOW()
        WHERE id = v_user_id;
        
        RAISE NOTICE 'ℹ️ Akun auth.users sudah ada (ID: %). Password & metadata diperbarui.', v_user_id;
    END IF;

    -- 2. Cari tenant pertama atau buat baru jika belum ada
    SELECT id INTO v_tenant_id FROM public.tenants WHERE business_name = v_business_name LIMIT 1;

    IF v_tenant_id IS NULL THEN
        SELECT id INTO v_tenant_id FROM public.tenants ORDER BY created_at ASC LIMIT 1;
    END IF;

    IF v_tenant_id IS NULL THEN
        v_tenant_id := gen_random_uuid();
        INSERT INTO public.tenants (id, business_name, plan, sub_type, user_type, owner_id)
        VALUES (v_tenant_id, v_business_name, 'pro', v_sub_type, 'broker', v_user_id);
        RAISE NOTICE '🏢 Tenant baru dibuat: % (ID: %)', v_business_name, v_tenant_id;
    END IF;

    -- 3. Upsert profile ke public.profiles
    INSERT INTO public.profiles (
        id, auth_user_id, tenant_id, full_name, email, role, app_role,
        user_type, sub_type, business_name, onboarded, business_model_selected, created_at, updated_at
    )
    VALUES (
        v_profile_id, v_user_id, v_tenant_id, v_full_name, v_email, v_role, v_role,
        'broker', v_sub_type, v_business_name, true, true, NOW(), NOW()
    )
    ON CONFLICT (id) DO NOTHING;

    -- Update jika sudah ada profile dengan auth_user_id yang sama
    UPDATE public.profiles
    SET tenant_id = v_tenant_id,
        full_name = v_full_name,
        role = v_role,
        app_role = v_role,
        business_name = v_business_name,
        onboarded = true,
        updated_at = NOW()
    WHERE auth_user_id = v_user_id;

    -- 4. Upsert membership ke public.tenant_memberships
    INSERT INTO public.tenant_memberships (
        auth_user_id, tenant_id, role, app_role, full_name, email, onboarded, created_at, updated_at
    )
    VALUES (
        v_user_id, v_tenant_id, v_role, v_role, v_full_name, v_email, true, NOW(), NOW()
    )
    ON CONFLICT (auth_user_id, tenant_id) DO UPDATE
    SET role = EXCLUDED.role,
        app_role = EXCLUDED.app_role,
        full_name = EXCLUDED.full_name,
        email = EXCLUDED.email,
        updated_at = NOW();

    RAISE NOTICE '🎉 Sukses! User % telah didaftarkan dengan Role "%" pada Tenant "%" (ID: %)', v_email, v_role, v_business_name, v_tenant_id;
END $$;
