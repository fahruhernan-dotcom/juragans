import { useQuery } from '@tanstack/react-query'
import { supabase } from '../supabase'
import { useAuth } from './useAuth'

export function usePurchases() {
  const { tenant } = useAuth()
  return useQuery({
    queryKey: ['purchases', tenant?.id],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('purchases')
        .select(`
          id, 
          transaction_date, 
          quantity, 
          avg_weight_kg,
          total_weight_kg, 
          price_per_kg,
          total_cost,
          transport_cost,
          other_cost,
          total_modal, 
          tenant_id,
          farm_id,
          farms(farm_name)
        `)
        .eq('tenant_id', tenant.id)
        .eq('is_deleted', false)
        .order('transaction_date', { ascending: false })
      
      if (error) throw error
      return data
    },
    enabled: !!tenant?.id
  })
}
