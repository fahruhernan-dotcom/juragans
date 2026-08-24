import { useQuery } from '@tanstack/react-query'
import { supabase } from '../supabase'
import { useAuth } from './useAuth'

export function useSales() {
  const { tenant } = useAuth()
  return useQuery({
    queryKey: ['sales', tenant?.id],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('sales')
        .select(`
          id, 
          net_revenue, 
          delivery_cost, 
          total_revenue, 
          price_per_kg,
          total_weight_kg, 
          transaction_date, 
          payment_status, 
          paid_amount, 
          remaining_amount, 
          tenant_id,
          rpa_id,
          rpa_clients(rpa_name, phone), 
          purchases(total_cost, price_per_kg, farm_id, farms(farm_name)),
          deliveries(status, initial_weight_kg, arrived_weight_kg),
          payments(id, amount, payment_date, payment_method, notes)
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
