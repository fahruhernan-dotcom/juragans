import { useEffect, useState, useCallback } from 'react'
import { supabase } from '../supabaseClient'
import { REGISTERED_ROLES } from './roles'
import { AuthContext } from './AuthContext'

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null)
  const [profile, setProfile] = useState(null)
  const [profiles, setProfiles] = useState([])
  const [ownerTenant, setOwnerTenant] = useState(null)
  const [loading, setLoading] = useState(true)

  const getPersistedTenantId = () => localStorage.getItem('juragan_active_tenant_id')
  const setPersistedTenantId = (id) => localStorage.setItem('juragan_active_tenant_id', id)

  const loadLocalRoleSession = useCallback(() => {
    const savedRole = localStorage.getItem('juragan_active_role') || 'owner'
    const config = REGISTERED_ROLES[savedRole] || REGISTERED_ROLES['owner']
    setUser(config.user)
    setProfile(config.profile)
    setProfiles([config.profile])
    setOwnerTenant(config.profile.tenants)
    setLoading(false)
    return true
  }, [])

  const fetchAuthData = useCallback(async (userId) => {
    setLoading(true)
    try {
      const { data: legacyProfiles } = await supabase
        .from('profiles')
        .select('*, tenants(*)')
        .eq('auth_user_id', userId)

      const lpSafe = legacyProfiles || []
      if (lpSafe.length > 0) {
        setProfiles(lpSafe)
        const savedTenantId = getPersistedTenantId()
        let active = savedTenantId ? lpSafe.find(p => p.tenant_id === savedTenantId) : lpSafe[0]
        if (!active) active = lpSafe[0]

        setProfile(active)
        setOwnerTenant(active?.tenants)
        if (active?.tenant_id) setPersistedTenantId(active.tenant_id)
        setLoading(false)
        return
      }
    } catch (err) {
      console.warn('[AuthProvider] Supabase fetch error, fallback to local role:', err)
    }

    loadLocalRoleSession()
  }, [loadLocalRoleSession])

  useEffect(() => {
    supabase.auth.getSession().then(({ data: { session } }) => {
      if (session?.user) {
        setUser(session.user)
        fetchAuthData(session.user.id)
      } else {
        loadLocalRoleSession()
      }
    })

    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      (_event, session) => {
        if (session?.user) {
          setUser(session.user)
          fetchAuthData(session.user.id)
        } else {
          loadLocalRoleSession()
        }
      }
    )
    return () => subscription.unsubscribe()
  }, [fetchAuthData, loadLocalRoleSession])

  const switchTenant = async (tenantId) => {
    const target = profiles.find(p => p.tenant_id === tenantId)
    if (target) {
      setProfile(target)
      setPersistedTenantId(target.tenant_id)
      return true
    }
    return false
  }

  const loginAsRole = async (roleKey) => {
    if (REGISTERED_ROLES[roleKey]) {
      localStorage.setItem('juragan_active_role', roleKey)
      loadLocalRoleSession()
      return true
    }
    return false
  }

  const logout = async () => {
    localStorage.removeItem('juragan_active_role')
    localStorage.removeItem('juragan_active_tenant_id')
    try { await supabase.auth.signOut() } catch { /* ok */ }
    setUser(null)
    setProfile(null)
    setProfiles([])
    setOwnerTenant(null)
    setLoading(false)
  }

  const value = {
    user,
    profile,
    profiles,
    tenant: profile?.tenants,
    ownerTenant,
    isSuperadmin: profile?.role === 'dev' || profile?.role === 'superadmin',
    loading,
    switchTenant,
    loginAsRole,
    logout,
  }

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>
}
