import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { supabase } from '@/lib/supabase'
import { logSupabaseError } from '@/lib/logger/supabaseLogger'

export function useSiteConfig() {
  return useQuery({
    queryKey: ['site_config'],
    queryFn: async () => {
      const { data, error } = await supabase.from('site_config').select('key, value')
      if (error) throw error
      return Object.fromEntries(data.map(r => [r.key, r.value]))
    },
    staleTime: 1000 * 60 * 30, // static config — cached for 30 minutes
    refetchOnWindowFocus: false,
    refetchOnReconnect: false,
    refetchOnMount: false,
  })
}

export function useUpdateSiteConfig() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: async ({ key, value }) => {
      const { error } = await supabase
        .from('site_config')
        .upsert({ key, value, updated_at: new Date() }, { onConflict: 'key' })
      if (error) {
        logSupabaseError(error, { table: 'site_config', operation: 'upsert', component: 'useUpdateSiteConfig', actionName: 'admin.site_config.update' })
        throw error
      }
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: ['site_config'] }),
  })
}
