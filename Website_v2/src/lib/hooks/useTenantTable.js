import { useQuery } from '@tanstack/react-query'
import { supabase } from '../supabase'
import { useAuth } from './useAuth'

/**
 * Generic query hook for tenant-scoped Supabase tables with soft-delete support.
 *
 * @param {string} tableName - Supabase table name
 * @param {object} [options]
 * @param {string} [options.orderBy='created_at'] - Column to order by
 * @param {boolean} [options.ascending=false] - Sorting direction
 * @param {string} [options.select='*'] - Select columns
 * @param {string} [options.queryKeyPrefix] - Custom query key prefix
 * @param {boolean} [options.enabled=true] - Enable query flag
 * @returns {import('@tanstack/react-query').UseQueryResult}
 */
export function useTenantTable(tableName, options = {}) {
  const {
    orderBy = 'created_at',
    ascending = false,
    select = '*',
    queryKeyPrefix = tableName,
    enabled = true,
  } = options

  const { tenant } = useAuth()

  return useQuery({
    queryKey: [queryKeyPrefix, tenant?.id],
    queryFn: async () => {
      const { data, error } = await supabase
        .from(tableName)
        .select(select)
        .eq('tenant_id', tenant.id)
        .eq('is_deleted', false)
        .order(orderBy, { ascending })

      if (error) throw error
      return data
    },
    enabled: !!tenant?.id && enabled,
  })
}
