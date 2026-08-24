-- =============================================================================
-- GOPEK / SEMBAKO OS - SEED DEMO AUTH ACCOUNTS
-- Jalankan script ini di Supabase SQL Editor:
-- (Supabase Dashboard -> SQL Editor -> Run)
-- =============================================================================

CREATE EXTENSION IF NOT EXISTS pgcrypto;

-- 1. Ensure Tenant Record Exists
INSERT INTO tenants (id, owner_id, business_name, business_type, subscription_plan)
VALUES (
    '00000000-0000-0000-0000-000000000002',
    '00000000-0000-0000-0000-000000000002',
    'Broker Dashboard Sembako',
    'distributor_sembako',
    'pro'
) ON CONFLICT (id) DO NOTHING;

-- 2. Insert into auth.users
INSERT INTO auth.users (
    id, instance_id, aud, role, email, encrypted_password, email_confirmed_at,
    raw_app_meta_data, raw_user_meta_data, created_at, updated_at
)
VALUES
(
    '00000000-0000-0000-0000-000000000001',
    '00000000-0000-0000-0000-000000000000',
    'authenticated', 'authenticated',
    'dev@sembako.id', crypt('dev123', gen_salt('bf')), NOW(),
    '{"provider":"email","providers":["email"],"is_superadmin":true}',
    '{"full_name":"Developer Superadmin"}', NOW(), NOW()
),
(
    '00000000-0000-0000-0000-000000000002',
    '00000000-0000-0000-0000-000000000000',
    'authenticated', 'authenticated',
    'owner@sembako.id', crypt('owner123', gen_salt('bf')), NOW(),
    '{"provider":"email","providers":["email"]}',
    '{"full_name":"Pemilik Toko"}', NOW(), NOW()
),
(
    '00000000-0000-0000-0000-000000000003',
    '00000000-0000-0000-0000-000000000000',
    'authenticated', 'authenticated',
    'admin@sembako.id', crypt('admin123', gen_salt('bf')), NOW(),
    '{"provider":"email","providers":["email"]}',
    '{"full_name":"Kasir / Admin"}', NOW(), NOW()
) ON CONFLICT (id) DO UPDATE SET encrypted_password = EXCLUDED.encrypted_password;

-- 3. Insert into auth.identities
INSERT INTO auth.identities (
    id, provider_id, user_id, identity_data, provider, last_sign_in_at, created_at, updated_at
)
VALUES
(
    '00000000-0000-0000-0000-000000000001', '00000000-0000-0000-0000-000000000001', '00000000-0000-0000-0000-000000000001',
    '{"sub":"00000000-0000-0000-0000-000000000001","email":"dev@sembako.id"}', 'email', NOW(), NOW(), NOW()
),
(
    '00000000-0000-0000-0000-000000000002', '00000000-0000-0000-0000-000000000002', '00000000-0000-0000-0000-000000000002',
    '{"sub":"00000000-0000-0000-0000-000000000002","email":"owner@sembako.id"}', 'email', NOW(), NOW(), NOW()
),
(
    '00000000-0000-0000-0000-000000000003', '00000000-0000-0000-0000-000000000003', '00000000-0000-0000-0000-000000000003',
    '{"sub":"00000000-0000-0000-0000-000000000003","email":"admin@sembako.id"}', 'email', NOW(), NOW(), NOW()
) ON CONFLICT (id) DO NOTHING;

-- 4. Insert into profiles
INSERT INTO profiles (id, auth_user_id, tenant_id, full_name, email, role, app_role, user_type, sub_type, business_name, onboarded)
VALUES 
(
    '00000000-0000-0000-0000-000000000010', '00000000-0000-0000-0000-000000000001', '00000000-0000-0000-0000-000000000002',
    'Developer Superadmin', 'dev@sembako.id', 'dev', 'dev', 'broker', 'distributor_sembako', 'Broker Dashboard Sembako', true
),
(
    '00000000-0000-0000-0000-000000000020', '00000000-0000-0000-0000-000000000002', '00000000-0000-0000-0000-000000000002',
    'Pemilik Toko', 'owner@sembako.id', 'owner', 'owner', 'broker', 'distributor_sembako', 'Broker Dashboard Sembako', true
),
(
    '00000000-0000-0000-0000-000000000030', '00000000-0000-0000-0000-000000000003', '00000000-0000-0000-0000-000000000002',
    'Kasir / Admin', 'admin@sembako.id', 'admin', 'admin', 'broker', 'distributor_sembako', 'Broker Dashboard Sembako', true
) ON CONFLICT (id) DO UPDATE SET role = EXCLUDED.role, full_name = EXCLUDED.full_name;
