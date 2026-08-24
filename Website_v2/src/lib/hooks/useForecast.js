import { useQuery } from '@tanstack/react-query'
import { supabase } from '../supabase'

export function useForecast() {
  return useQuery({
    queryKey: ['forecast'],
    queryFn: async () => {
      const today = new Date().toISOString().split('T')[0]
      const nextWeek = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000)
        .toISOString().split('T')[0]

      const [batchesRes, ordersRes] = await Promise.all([
        supabase.from('chicken_batches')
          .select('*, farms(farm_name)')
          .eq('is_deleted', false)
          .in('status', ['growing', 'ready'])
          .lte('estimated_harvest_date', nextWeek)
          .gte('estimated_harvest_date', today),

        supabase.from('orders')
          .select('*, rpa_clients(rpa_name)')
          .eq('is_deleted', false)
          .in('status', ['open', 'matched'])
          .lte('requested_date', nextWeek),
      ])

      const batches = batchesRes.data || []
      const orders = ordersRes.data || []

      const totalSupply = batches.reduce((s, b) => s + (b.current_count || 0), 0)
      const totalDemand = orders.reduce((s, o) => s + (o.requested_count || 0), 0)
      const gap = totalSupply - totalDemand

      return { batches, orders, totalSupply, totalDemand, gap }
    },
  })
}
