import { useQuery } from '@tanstack/react-query'
import { supabase } from '@/lib/supabase'
import { getSubscriptionStatus } from '@/lib/subscriptionUtils'
import { usePlanConfigs } from '@/lib/hooks/useAdminData'
import { FALLBACK_TRANSACTION_QUOTA } from '@/lib/constants/planGating'

const FALLBACK_STARTER_LIMIT = FALLBACK_TRANSACTION_QUOTA

/**
 * Returns transaction quota info for the current tenant.
 * Limit is read from plan_configs (config_key: 'transaction_quota').
 * Only enforced for Starter plan (non-trial).
 *
 * @param {object} tenant
 * @param {object|string} [options] - Options object or string tableName ('sales' | 'sembako_sales')
 * @returns {{ used, limit, remaining, isAtLimit, isStarter, isLoading }}
 */
export function useTransactionQuota(tenant, options = {}) {
  const tableName = typeof options === 'string' ? options : (options.tableName || 'sales')
  const queryKeyPrefix = typeof options === 'object' && options.queryKeyPrefix ? options.queryKeyPrefix : `${tableName}-quota`

  const sub = getSubscriptionStatus(tenant)
  const isStarter = sub.status !== 'active' && sub.status !== 'trial'

  const { data: configs = {} } = usePlanConfigs()
  const limit = configs?.transaction_quota?.starter ?? FALLBACK_STARTER_LIMIT

  const now = new Date()
  const firstOfMonth = new Date(now.getFullYear(), now.getMonth(), 1).toISOString()

  const { data: used = 0, isLoading } = useQuery({
    queryKey: [queryKeyPrefix, tenant?.id, now.getFullYear(), now.getMonth()],
    queryFn: async () => {
      const { count, error } = await supabase
        .from(tableName)
        .select('id', { count: 'exact', head: true })
        .eq('tenant_id', tenant.id)
        .eq('is_deleted', false)
        .gte('transaction_date', firstOfMonth)
      if (error) throw error
      return count ?? 0
    },
    enabled: !!tenant?.id && isStarter,
    staleTime: 60_000,
  })

  if (!isStarter) {
    return { used: 0, limit: null, remaining: null, isAtLimit: false, isStarter: false, isLoading: false }
  }

  const remaining = Math.max(0, limit - used)
  return {
    used,
    limit,
    remaining,
    isAtLimit: used >= limit,
    isStarter: true,
    isLoading,
  }
}

