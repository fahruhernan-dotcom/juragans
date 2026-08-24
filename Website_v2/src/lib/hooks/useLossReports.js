import { useQuery } from '@tanstack/react-query'
import { supabase } from '../supabase'

export function useLossReports() {
  return useQuery({
    queryKey: ['loss-reports'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('loss_reports')
        .select(`
          *,
          sales(rpa_clients(rpa_name)),
          deliveries(driver_name, vehicle_info)
        `)
        .eq('is_deleted', false)
        .order('report_date', { ascending: false })

      if (error) throw error
      return data
    },
  })
}
