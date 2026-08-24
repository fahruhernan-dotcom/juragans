-- =============================================================================
-- [SAMPLE / CONTOH] REGISTER STAF / ADMIN KASIR
-- Untuk mendaftarkan akun admin atau kasir tambahan di tenant toko
-- =============================================================================

CREATE EXTENSION IF NOT EXISTS pgcrypto;

DO $$
DECLARE
    v_user_id UUID;
    v_tenant_id UUID := '00000000-0000-0000-0000-000000000002';
    v_email TEXT := 'admin@tokocontoho.id';
    v_password TEXT := 'PasswordAdmin123';
    v_full_name TEXT := 'Admin Kasir Toko';
    v_business_name TEXT := 'Toko Sembako Berkah';
BEGIN
    -- 1. Pastikan Default Tenant Tersedia
    IF NOT EXISTS (SELECT 1 FROM tenants WHERE id = v_tenant_id) THEN
        INSERT INTO tenants (id, owner_id, business_name, business_vertical, user_type, sub_type, plan)
        VALUES (v_tenant_id, v_tenant_id, v_business_name, 'distributor_sembako', 'broker', 'distributor_sembako', 'pro');
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
            '{"provider":"email","providers":["email"]}'::jsonb,
            jsonb_build_object('full_name', v_full_name, 'email', v_email),
            NOW(),
            NOW()
        );
        RAISE NOTICE 'User auth staf baru dibuat dengan ID: %', v_user_id;
    ELSE
        UPDATE auth.users 
        SET encrypted_password = crypt(v_password, gen_salt('bf', 10)),
            email_confirmed_at = COALESCE(email_confirmed_at, NOW()),
            aud = 'authenticated',
            role = 'authenticated',
            raw_app_meta_data = '{"provider":"email","providers":["email"]}'::jsonb,
            raw_user_meta_data = jsonb_build_object('full_name', v_full_name, 'email', v_email),
            updated_at = NOW()
        WHERE id = v_user_id;
    END IF;

    -- 3. Sinkronisasi Identity auth.identities
    IF NOT EXISTS (SELECT 1 FROM auth.identities WHERE user_id = v_user_id) THEN
        INSERT INTO auth.identities (
            id,
            user_id,
            identity_data,
            provider,
            last_sign_in_at,
            created_at,
            updated_at
        ) VALUES (
            gen_random_uuid(),
            v_user_id,
            jsonb_build_object('sub', v_user_id::text, 'email', v_email),
            'email',
            NOW(),
            NOW(),
            NOW()
        );
    END IF;

    -- 4. Sinkronisasi Profile di public.profiles sebagai role 'admin'
    IF EXISTS (SELECT 1 FROM public.profiles WHERE auth_user_id = v_user_id OR LOWER(email) = LOWER(v_email)) THEN
        UPDATE public.profiles
        SET auth_user_id = v_user_id,
            tenant_id = v_tenant_id,
            email = v_email,
            full_name = v_full_name,
            role = 'admin',
            app_role = 'admin',
            user_type = 'broker',
            sub_type = 'distributor_sembako',
            business_name = v_business_name,
            onboarded = true,
            updated_at = NOW()
        WHERE auth_user_id = v_user_id OR LOWER(email) = LOWER(v_email);
    ELSE
        INSERT INTO public.profiles (
            id,
            auth_user_id,
            tenant_id,
            email,
            full_name,
            role,
            app_role,
            user_type,
            sub_type,
            business_name,
            onboarded,
            created_at,
            updated_at
        ) VALUES (
            gen_random_uuid(),
            v_user_id,
            v_tenant_id,
            v_email,
            v_full_name,
            'admin',
            'admin',
            'broker',
            'distributor_sembako',
            v_business_name,
            true,
            NOW(),
            NOW()
        );
    END IF;

    RAISE NOTICE 'SUCCESS: Akun Staf Admin % berhasil dikonfigurasi!', v_email;
END $$;
