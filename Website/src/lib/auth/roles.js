export const REGISTERED_ROLES = {
  dev: {
    user: { id: '00000000-0000-0000-0000-000000000001', email: 'dev@juragan.id' },
    profile: {
      id: 'prof-dev-001',
      auth_user_id: '00000000-0000-0000-0000-000000000001',
      tenant_id: '00000000-0000-0000-0000-000000000002',
      full_name: 'Superadmin Juragan',
      role: 'dev',
      app_role: 'dev',
      user_type: 'owner',
      business_name: 'Juragan by Anak Bawang',
      tenants: {
        id: '00000000-0000-0000-0000-000000000002',
        name: 'Juragan by Anak Bawang',
        business_name: 'Juragan by Anak Bawang',
        plan: 'pro',
      }
    }
  },
  owner: {
    user: { id: '00000000-0000-0000-0000-000000000002', email: 'owner@juragan.id' },
    profile: {
      id: 'prof-owner-001',
      auth_user_id: '00000000-0000-0000-0000-000000000002',
      tenant_id: '00000000-0000-0000-0000-000000000002',
      full_name: 'Juragan Owner',
      role: 'owner',
      app_role: 'owner',
      user_type: 'owner',
      business_name: 'Juragan by Anak Bawang',
      tenants: {
        id: '00000000-0000-0000-0000-000000000002',
        name: 'Juragan by Anak Bawang',
        business_name: 'Juragan by Anak Bawang',
        plan: 'pro',
      }
    }
  },
  admin: {
    user: { id: '00000000-0000-0000-0000-000000000003', email: 'admin@juragan.id' },
    profile: {
      id: 'prof-admin-001',
      auth_user_id: '00000000-0000-0000-0000-000000000003',
      tenant_id: '00000000-0000-0000-0000-000000000002',
      full_name: 'Admin Operational',
      role: 'admin',
      app_role: 'admin',
      user_type: 'staff',
      business_name: 'Juragan by Anak Bawang',
      tenants: {
        id: '00000000-0000-0000-0000-000000000002',
        name: 'Juragan by Anak Bawang',
        business_name: 'Juragan by Anak Bawang',
        plan: 'pro',
      }
    }
  }
}
