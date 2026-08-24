import { supabase } from './supabase'
import { isSuperadmin } from './auth'
import { getEffectivePlan } from './subscriptionUtils'

const MOCK_USER_ID = '00000000-0000-0000-0000-000000000001'
const MOCK_TENANT_ID = '00000000-0000-0000-0000-000000000002'

export async function getFeatureLimit(tenant, configKey) {
  if (!tenant || tenant.id === MOCK_TENANT_ID) return 99

  const DEFAULTS = {
    business_limit: { starter: 1, pro: 3, business: 999 },
    kandang_limit: { starter: 1, pro: 2, business: 99 },
    team_limit: { starter: 1, pro: 3, business: 99 }
  }

  try {
    const { data: configRow } = await supabase
      .from('plan_configs')
      .select('config_value')
      .eq('config_key', configKey)
      .maybeSingle()

    const config = configRow?.config_value ?? {}
    const plan = getEffectivePlan(tenant)
    return config[plan] ?? DEFAULTS[configKey]?.[plan] ?? 99
  } catch {
    return 99
  }
}

export async function getUserAddons(userId, type = 'business_slot') {
  if (!userId || userId === MOCK_USER_ID) return 0
  
  try {
    const { data: profile } = await supabase
      .from('profiles')
      .select('additional_slots')
      .eq('id', userId)
      .maybeSingle()

    if (type === 'business_slot') {
      return profile?.additional_slots ?? 0
    }
  } catch {
    // fallback
  }

  return 0
}

export async function checkQuotaUsage(tenant, profile, type) {
  if (!profile?.auth_user_id || profile.auth_user_id === MOCK_USER_ID || tenant?.id === MOCK_TENANT_ID) {
    return {
      usage: 1,
      limit: Infinity,
      canAdd: true,
      remaining: Infinity,
      isAdmin: true
    }
  }

  try {
    const { data: userProfiles } = await supabase
      .from('profiles')
      .select('role, user_type, app_role')
      .eq('auth_user_id', profile.auth_user_id)

    const isAdminGlobal = (userProfiles || []).some(p => isSuperadmin(p))

    if (isAdminGlobal) {
      return { usage: 0, limit: Infinity, canAdd: true, remaining: Infinity, isAdmin: true }
    }

    const baseLimit = await getFeatureLimit(tenant, type + '_limit')
    const extraSlots = await getUserAddons(profile?.id, type + '_slot')
    const totalLimit = baseLimit + extraSlots

    let currentUsage = 1
    return {
      usage: currentUsage,
      limit: totalLimit,
      canAdd: currentUsage < totalLimit,
      remaining: totalLimit - currentUsage
    }
  } catch {
    return { usage: 1, limit: Infinity, canAdd: true, remaining: Infinity, isAdmin: true }
  }
}
