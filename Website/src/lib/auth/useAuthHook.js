import { useContext } from 'react'
import { AuthContext } from './AuthContext'
import { REGISTERED_ROLES } from './roles'

export function useAuth() {
  const ctx = useContext(AuthContext)
  if (!ctx) {
    return {
      user: REGISTERED_ROLES.owner.user,
      profile: REGISTERED_ROLES.owner.profile,
      tenant: REGISTERED_ROLES.owner.profile.tenants,
      profiles: [REGISTERED_ROLES.owner.profile],
      loading: false,
      switchTenant: async () => {},
      loginAsRole: async () => {},
      logout: async () => {},
    }
  }
  return ctx
}
