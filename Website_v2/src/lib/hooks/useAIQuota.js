import { useQuery } from '@tanstack/react-query'
import { supabase } from '@/lib/supabase'
import { getEffectivePlan } from '@/lib/subscriptionUtils'
import { AI_PLAN_CONFIG } from '@/lib/constants/planGating'

/**
 * Returns AI chat quota info for the current tenant.
 * Limit is read from AI_PLAN_CONFIG (static constant per plan tier).
 * Business plan always returns quotaStatus: 'ok' (Infinity limit).
 *
 * @param {object} tenant
 * @returns {{
 *   plan: string,
 *   limit: number,
 *   used: number,
 *   remaining: number,
 *   quotaStatus: 'ok' | 'warning' | 'exceeded',
 *   canUseFeature: (featureName: string) => boolean,
 *   isLoading: boolean,
 * }}
 */
export function useAIQuota(tenant) {
  const plan = getEffectivePlan(tenant)
  const planConfig = AI_PLAN_CONFIG[plan] || AI_PLAN_CONFIG.starter
  const limit = planConfig.chat_sessions_per_month

  const now = new Date()
  const firstOfMonth = new Date(now.getFullYear(), now.getMonth(), 1).toISOString()

  const { data: used = 0, isLoading } = useQuery({
    queryKey: ['ai-quota', tenant?.id, now.getFullYear(), now.getMonth()],
    queryFn: async () => {
      const { count, error } = await supabase
        .from('ai_conversations')
        .select('id', { count: 'exact', head: true })
        .eq('tenant_id', tenant.id)
        .gte('created_at', firstOfMonth)
      if (error) throw error
      return count ?? 0
    },
    enabled: !!tenant?.id && limit !== Infinity,
    staleTime: 60_000,
  })

  const canUseFeature = (featureName) => {
    return planConfig.features?.[featureName] === true
  }

  // Infinity limit (business) — always ok, no counting needed
  if (limit === Infinity) {
    return {
      plan,
      limit,
      used: 0,
      remaining: Infinity,
      quotaStatus: 'ok',
      canUseFeature,
      isLoading: false,
    }
  }

  const remaining = Math.max(0, limit - used)
  let quotaStatus = 'ok'
  if (used >= limit) quotaStatus = 'exceeded'
  else if (used >= limit * 0.8) quotaStatus = 'warning'

  return {
    plan,
    limit,
    used,
    remaining,
    quotaStatus,
    canUseFeature,
    isLoading,
  }
}
