import { createContext, useContext, useEffect, useState } from 'react'
import { supabase } from '../supabase'
import { getXBasePath } from '../businessModel'
import { setLoggerContext, logError } from '@/lib/logger/errorLogger'
import { logSupabaseError } from '@/lib/logger/supabaseLogger'

// ── Auth Context ───────────────────────────────────────────────────────────────
// Single source of truth untuk auth state.
// getSession() hanya dipanggil SEKALI di AuthProvider, bukan per-komponen.
// Semua pemanggil useAuth() membaca dari context yang sama → tidak ada race condition.

const AuthContext = createContext(null)

// ── Mock Bypass Accounts (Untuk Template / Demo Instant Access) ────────────────
export const MOCK_BYPASS_ACCOUNTS = {
  owner: {
    user: {
      id: '00000000-0000-0000-0000-000000000002',
      email: 'owner@juragans.id',
      app_metadata: { provider: 'email' },
      user_metadata: { full_name: 'Juragan Bawang (Owner)' }
    },
    profile: {
      id: '00000000-0000-0000-0000-000000000020',
      auth_user_id: '00000000-0000-0000-0000-000000000002',
      tenant_id: '00000000-0000-0000-0000-000000000002',
      full_name: 'Juragan Bawang (Owner)',
      email: 'owner@juragans.id',
      role: 'owner',
      app_role: 'owner',
      user_type: 'broker',
      sub_type: 'distributor_sembako',
      business_name: 'Juragans by Anak Bawang',
      onboarded: true,
      business_model_selected: true,
      tenants: {
        id: '00000000-0000-0000-0000-000000000002',
        business_name: 'Juragans by Anak Bawang',
        business_vertical: 'distributor_sembako',
        user_type: 'broker',
        sub_type: 'distributor_sembako',
        city: 'Boyolali',
        plan: 'pro'
      }
    }
  },
  dev: {
    user: {
      id: '00000000-0000-0000-0000-000000000001',
      email: 'dev@juragans.id',
      app_metadata: { is_superadmin: true, provider: 'email' },
      user_metadata: { full_name: 'Developer Superadmin (Juragan)' }
    },
    profile: {
      id: '00000000-0000-0000-0000-000000000010',
      auth_user_id: '00000000-0000-0000-0000-000000000001',
      tenant_id: '00000000-0000-0000-0000-000000000002',
      full_name: 'Developer Superadmin (Juragan)',
      email: 'dev@juragans.id',
      role: 'dev',
      app_role: 'dev',
      user_type: 'broker',
      sub_type: 'distributor_sembako',
      business_name: 'Juragans by Anak Bawang',
      onboarded: true,
      business_model_selected: true,
      tenants: {
        id: '00000000-0000-0000-0000-000000000002',
        business_name: 'Juragans by Anak Bawang',
        business_vertical: 'distributor_sembako',
        user_type: 'broker',
        sub_type: 'distributor_sembako',
        city: 'Boyolali',
        plan: 'pro'
      }
    }
  },
  admin: {
    user: {
      id: '00000000-0000-0000-0000-000000000003',
      email: 'admin@juragans.id',
      app_metadata: { provider: 'email' },
      user_metadata: { full_name: 'Kasir / Staf Toko (Juragan)' }
    },
    profile: {
      id: '00000000-0000-0000-0000-000000000030',
      auth_user_id: '00000000-0000-0000-0000-000000000003',
      tenant_id: '00000000-0000-0000-0000-000000000002',
      full_name: 'Kasir / Staf Toko (Juragan)',
      email: 'admin@juragans.id',
      role: 'admin',
      app_role: 'admin',
      user_type: 'broker',
      sub_type: 'distributor_sembako',
      business_name: 'Juragans by Anak Bawang',
      onboarded: true,
      business_model_selected: true,
      tenants: {
        id: '00000000-0000-0000-0000-000000000002',
        business_name: 'Juragans by Anak Bawang',
        business_vertical: 'distributor_sembako',
        user_type: 'broker',
        sub_type: 'distributor_sembako',
        city: 'Boyolali',
        plan: 'pro'
      }
    }
  }
}

// Throttling helper for last_seen_at updates (15 minutes per tenant ID)
const throttleLastSeenUpdate = async (userId, tenantId) => {
  if (!userId || !tenantId || userId.startsWith('00000000-0000-0000')) return
  const THROTTLE_MS = 15 * 60 * 1000 // 15 minutes
  const key = `ternakos_last_seen_${tenantId}`
  
  try {
    const lastUpdateStr = sessionStorage.getItem(key)
    const now = Date.now()
    if (lastUpdateStr) {
      const lastUpdate = parseInt(lastUpdateStr, 10)
      if (now - lastUpdate < THROTTLE_MS) {
        return
      }
    }
    
    sessionStorage.setItem(key, now.toString())
    
    const { error } = await supabase
      .from('profiles')
      .update({ 
        updated_at: new Date().toISOString(),
        last_seen_at: new Date().toISOString()
      })
      .eq('auth_user_id', userId)
      .eq('tenant_id', tenantId)

    if (error) {
      logError({
        level: 'error',
        source: 'supabase',
        component: 'AuthProvider',
        actionName: 'throttleLastSeenUpdate',
        error,
        metadata: {
          table: 'profiles',
          operation: 'update',
          target_tenant_id: tenantId,
        },
      })
    }
  } catch (err) {
    console.error('[useAuth] Error in throttleLastSeenUpdate:', err)
  }
}

// Helper untuk membaca & menulis cached auth snapshot lokal (instant zero-flash startup)
const getCachedAuthSnapshot = () => {
  try {
    const bypassRole = localStorage.getItem('ternakos_bypass_role')
    if (bypassRole && MOCK_BYPASS_ACCOUNTS[bypassRole]) {
      const mock = MOCK_BYPASS_ACCOUNTS[bypassRole]
      return {
        user: mock.user,
        profile: mock.profile,
        profiles: [mock.profile],
        ownerTenant: mock.profile.tenants,
      }
    }
    const saved = localStorage.getItem('ternakos_auth_snapshot')
    return saved ? JSON.parse(saved) : null
  } catch {
    return null
  }
}

const saveCachedAuthSnapshot = (data) => {
  try {
    if (data && data.profile) {
      localStorage.setItem('ternakos_auth_snapshot', JSON.stringify(data))
    } else {
      localStorage.removeItem('ternakos_auth_snapshot')
    }
  } catch {
    /* silent */
  }
}

export function AuthProvider({ children }) {
  const initialSnapshot = getCachedAuthSnapshot()

  const [user, setUser] = useState(initialSnapshot?.user || null)
  const [profile, setProfile] = useState(initialSnapshot?.profile || null)
  const [profiles, setProfiles] = useState(initialSnapshot?.profiles || [])
  const [ownerTenant, setOwnerTenant] = useState(initialSnapshot?.ownerTenant || null)
  // Jika sudah ada snapshot di localStorage, loading dimulai dengan false (instant render)
  const [loading, setLoading] = useState(!initialSnapshot?.profile)

  const getPersistedTenantId = () => localStorage.getItem('ternakos_active_tenant_id')
  const setPersistedTenantId = (id) => localStorage.setItem('ternakos_active_tenant_id', id)

  async function fetchAuthData(userId, { silent = false } = {}) {
    // Hanya tampilkan loading screen jika ini bukan silent refresh dan belum ada profile di memory/cache
    if (!silent && !profile) {
      setLoading(true)
    }
    setLoggerContext({ userId, tenantId: null, vertical: null, role: null })

    const { data: legacyProfiles, error: profilesError } = await supabase
      .from('profiles')
      .select('*, tenants(*)')
      .eq('auth_user_id', userId)

    if (profilesError) {
      logSupabaseError(profilesError, {
        table: 'profiles',
        operation: 'select',
        component: 'AuthProvider',
        actionName: 'auth.fetch_profiles',
      })
    }

    const { data: memberData, error: memberError } = await supabase
      .from('tenant_memberships')
      .select('*, tenants(*)')
      .eq('auth_user_id', userId)

    if (memberError) {
      logSupabaseError(memberError, {
        table: 'tenant_memberships',
        operation: 'select',
        component: 'AuthProvider',
        actionName: 'auth.fetch_memberships',
      })
    }

    const lpSafe = legacyProfiles || []
    const mdSafe = memberData || []
    const masterProfile = lpSafe.find(p => p.full_name) || lpSafe[0] || mdSafe[0] || {}
    
    let combined = mdSafe.map(m => {
      const legacyMatch = lpSafe.find(lp => lp.tenant_id === m.tenant_id)
      return {
        ...m,
        profile_id: legacyMatch?.id ?? null,
        app_role: legacyMatch?.app_role ?? m.app_role ?? masterProfile.app_role,
        role: legacyMatch?.role ?? m.role ?? masterProfile.role,
        full_name: m.full_name || masterProfile.full_name,
        avatar_url: m.avatar_url || masterProfile.avatar_url,
        onboarded: m.onboarded ?? masterProfile.onboarded,
        business_model_selected: m.business_model_selected ?? masterProfile.business_model_selected,
        is_onboarded: m.is_onboarded ?? masterProfile.is_onboarded,
        last_seen_at: m.last_seen_at || masterProfile.last_seen_at
      }
    })

    lpSafe.forEach(lp => {
      if (!combined.some(c => c.tenant_id === lp.tenant_id)) {
        combined.push(lp)
      }
    })

    if (combined.length === 0) {
      setProfiles([])
      setProfile(null)
      setUser(null)
      setLoading(false)
      saveCachedAuthSnapshot(null)
      return
    }

    setProfiles(combined)

    const savedTenantId = getPersistedTenantId()
    let active = null

    if (savedTenantId) {
      active = combined.find(p => p.tenant_id === savedTenantId)
    }

    if (!active && combined.length > 0) {
      active = combined.find(c => c.onboarded && c.role === 'owner')
        || combined.find(c => c.onboarded)
        || combined[0]
      if (active.tenant_id) setPersistedTenantId(active.tenant_id)
    }

    const ownedMembership = combined.find(m => m.role === 'owner')
    const activeOwnerTenant = ownedMembership?.tenants || active?.tenants
    setOwnerTenant(activeOwnerTenant)

    setProfile(active)
    setLoading(false)

    // Simpan snapshot auth terbaru ke storage lokal
    saveCachedAuthSnapshot({
      user: { id: userId },
      profile: active,
      profiles: combined,
      ownerTenant: activeOwnerTenant,
    })

    setLoggerContext({
      userId: active?.auth_user_id || userId,
      tenantId: active?.tenant_id || null,
      role: active?.app_role || active?.role || active?.user_type || null,
      vertical: null,
    })

    if (active?.tenant_id) {
      throttleLastSeenUpdate(userId, active.tenant_id)
    }
  }

  const loginAsBypass = (roleKey = 'owner') => {
    const mock = MOCK_BYPASS_ACCOUNTS[roleKey] || MOCK_BYPASS_ACCOUNTS.owner
    localStorage.setItem('ternakos_bypass_role', roleKey)
    localStorage.setItem('ternakos_active_tenant_id', mock.profile.tenant_id)
    setUser(mock.user)
    setProfile(mock.profile)
    setProfiles([mock.profile])
    setOwnerTenant(mock.profile.tenants)
    setLoading(false)
    saveCachedAuthSnapshot({
      user: mock.user,
      profile: mock.profile,
      profiles: [mock.profile],
      ownerTenant: mock.profile.tenants
    })
    return mock.profile
  }

  useEffect(() => {
    const bypassRole = localStorage.getItem('ternakos_bypass_role')
    if (bypassRole && MOCK_BYPASS_ACCOUNTS[bypassRole]) {
      loginAsBypass(bypassRole)
      return
    }

    supabase.auth.getSession().then(({ data: { session } }) => {
      if (session?.user) {
        setUser(session.user)
        // Jika sudah ada profile di initial snapshot, lakukan fetch secara silent
        fetchAuthData(session.user.id, { silent: Boolean(profile) })
      } else {
        setUser(null)
        setProfile(null)
        setProfiles([])
        setOwnerTenant(null)
        setLoading(false)
        saveCachedAuthSnapshot(null)
      }
    })

    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      (event, session) => {
        const activeBypass = localStorage.getItem('ternakos_bypass_role')
        if (activeBypass && MOCK_BYPASS_ACCOUNTS[activeBypass]) return

        if (session?.user) {
          setUser(session.user)
          // Token refresh atau window focus event selalu silent agar tidak merender LoadingScreen
          fetchAuthData(session.user.id, { silent: true })
        } else {
          setUser(null)
          setProfile(null)
          setProfiles([])
          setOwnerTenant(null)
          setLoading(false)
          saveCachedAuthSnapshot(null)
        }
      }
    )
    return () => subscription.unsubscribe()
  }, [])

  // Realtime subscription untuk mendengarkan perubahan lisensi di tabel tenants secara live
  useEffect(() => {
    const activeTenantId = profile?.tenants?.id || ownerTenant?.id
    if (!activeTenantId || activeTenantId.startsWith('00000000-0000-0000')) return

    const channelId = `public:tenants:${activeTenantId}:${Math.random().toString(36).slice(2, 9)}`
    const channel = supabase
      .channel(channelId)
      .on(
        'postgres_changes',
        { event: 'UPDATE', schema: 'public', table: 'tenants', filter: `id=eq.${activeTenantId}` },
        (payload) => {
          if (payload.new) {
            setProfile(prev => prev ? { ...prev, tenants: payload.new } : prev)
            setOwnerTenant(payload.new)
          }
        }
      )
      .subscribe()

    return () => {
      if (channel) {
        supabase.removeChannel(channel)
      }
    }
  }, [profile?.tenants?.id, ownerTenant?.id])

  const switchTenant = async (tenantId) => {
    const target = profiles.find(p => p.tenant_id === tenantId)
    if (target && user) {
      // 1. Update database active session (only safe fields like last_seen_at) - THROTTLED
      await throttleLastSeenUpdate(user.id, target.tenant_id)

      // 2. Update local state
      setProfile(target)
      setPersistedTenantId(target.tenant_id)
      return true
    }
    return false
  }

  // Dual-mode check: JWT app_metadata (Supabase Auth) OR profile.app_role/role column (DB)
  // app_metadata.is_superadmin requires a Supabase custom claim to be set.
  // profile.app_role / profile.role are set directly in the DB and available immediately.
  // Safety net: scan ALL profiles in case active profile is from tenant_memberships without app_role
  const isSuperadmin =
    user?.app_metadata?.is_superadmin === true ||
    profile?.app_role === 'superadmin' ||
    profile?.role === 'superadmin' ||
    profiles.some(p => p.app_role === 'superadmin' || p.role === 'superadmin')

  const logout = async () => {
    localStorage.removeItem('ternakos_bypass_role')
    localStorage.removeItem('sembako_active_role')
    localStorage.removeItem('ternakos_active_tenant_id')
    localStorage.removeItem('ternakos_auth_snapshot')
    try { await supabase.auth.signOut() } catch { /* ok */ }
    setUser(null)
    setProfile(null)
    setProfiles([])
    setOwnerTenant(null)
    setLoading(false)
  }

  const refetchProfile = async () => {
    if (user && !user.id?.startsWith('00000000-0000-0000')) {
      await fetchAuthData(user.id)
    }
  }

  const value = {
    user,
    profile,
    profiles,
    tenant: profile?.tenants,         // Active working tenant (for data fetching & routing)
    ownerTenant,                        // User's OWN tenant (for subscription & plan gating)
    isSuperadmin,
    loading,
    isBypassMode: Boolean(localStorage.getItem('ternakos_bypass_role')),
    loginAsBypass,
    switchTenant,
    logout,
    refetchProfile,
  }

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>
}

export function useAuth() {
  const ctx = useContext(AuthContext)
  if (!ctx) {
    // Graceful fallback during HMR or if called outside AuthProvider
    // NotificationsProvider and other consumers guard against null tenant/profile
    if (import.meta.env.DEV) {
      console.warn('[useAuth] Called outside <AuthProvider> — returning empty context.')
    }
    return {
      user: null, profile: null, tenant: null, tenants: [],
      loading: true, switchTenant: async () => { }, refetchProfile: () => { },
    }
  }
  return ctx
}

export const getBrokerBasePath = (tenant, profile) => {
  return getXBasePath(tenant, profile)
}

export const getPeternakBasePath = (tenant, profile) => {
  return getXBasePath(tenant, profile)
}
