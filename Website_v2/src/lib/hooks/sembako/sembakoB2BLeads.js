import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { supabase } from '../../supabase'
import { toast } from 'sonner'
import { useAuth } from '../useAuth'
import { normalizeSupabaseError } from '../../supabaseErrorHandler'
import { logSupabaseError } from '@/lib/logger/supabaseLogger'
import { STALE_1M, sanitizeDBPayload, getTenantId } from './sembakoCommon'

export const useB2BLeads = () => {
  return useQuery({
    queryKey: ['b2b-leads'],
    staleTime: STALE_1M,
    queryFn: async () => {
      try {
        const { data, error } = await supabase
          .from('b2b_leads')
          .select('*')
          .eq('is_deleted', false)
          .order('created_at', { ascending: false })

        if (error) {
          console.warn('[useB2BLeads]', error.message)
          return []
        }
        return data || []
      } catch (e) {
        console.warn('[useB2BLeads]', e)
        return []
      }
    }
  })
}

export const useB2BScrapingQueue = () => {
  return useQuery({
    queryKey: ['b2b-scraping-queue'],
    staleTime: STALE_1M,
    queryFn: async () => {
      try {
        const { data, error } = await supabase
          .from('b2b_scraping_queue')
          .select('*')
          .order('created_at', { ascending: false })

        if (error) {
          console.warn('[useB2BScrapingQueue]', error.message)
          return []
        }
        return data || []
      } catch (e) {
        console.warn('[useB2BScrapingQueue]', e)
        return []
      }
    }
  })
}

export const useCreateB2BLead = () => {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: async (payload) => {
      const tenant_id = await getTenantId()
      const cleanPayload = sanitizeDBPayload(
        { ...payload, tenant_id },
        'b2b_leads'
      )
      const { data, error } = await supabase
        .from('b2b_leads')
        .insert(cleanPayload)
        .select()
        .single()

      if (error) {
        logSupabaseError(error, {
          table: 'b2b_leads',
          operation: 'insert',
          component: 'useB2BLeads',
          actionName: 'b2b_leads.create'
        })
        throw error
      }
      return data
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['b2b-leads'] })
      toast.success('Prospek B2B berhasil ditambahkan')
    },
    onError: (err) => toast.error(normalizeSupabaseError(err).message),
  })
}

export const useUpdateB2BLead = () => {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: async ({ id, ...updates }) => {
      const cleanUpdates = sanitizeDBPayload(updates, 'b2b_leads')
      const { error } = await supabase
        .from('b2b_leads')
        .update(cleanUpdates)
        .eq('id', id)

      if (error) {
        logSupabaseError(error, {
          table: 'b2b_leads',
          operation: 'update',
          component: 'useB2BLeads',
          actionName: 'b2b_leads.update'
        })
        throw error
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['b2b-leads'] })
      toast.success('Data prospek B2B diperbarui')
    },
    onError: (err) => toast.error(normalizeSupabaseError(err).message),
  })
}

export const useDeleteB2BLead = () => {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: async (id) => {
      const { error } = await supabase
        .from('b2b_leads')
        .update({ is_deleted: true })
        .eq('id', id)

      if (error) {
        logSupabaseError(error, {
          table: 'b2b_leads',
          operation: 'delete',
          component: 'useB2BLeads',
          actionName: 'b2b_leads.delete'
        })
        throw error
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['b2b-leads'] })
      toast.success('Prospek B2B dihapus')
    },
    onError: (err) => toast.error(normalizeSupabaseError(err).message),
  })
}

export const useCreateScrapingQueueItem = () => {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: async (payload) => {
      const cleanPayload = sanitizeDBPayload(payload, 'b2b_scraping_queue')
      const { data, error } = await supabase
        .from('b2b_scraping_queue')
        .insert(cleanPayload)
        .select()
        .single()

      if (error) {
        logSupabaseError(error, {
          table: 'b2b_scraping_queue',
          operation: 'insert',
          component: 'useB2BScrapingQueue',
          actionName: 'b2b_scraping_queue.create'
        })
        throw error
      }
      return data
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['b2b-scraping-queue'] })
      toast.success('Antrean scraping berhasil didaftarkan')
    },
    onError: (err) => toast.error(normalizeSupabaseError(err).message),
  })
}

export const useB2BSettings = () => {
  return useQuery({
    queryKey: ['juragan-b2b-settings'],
    staleTime: STALE_1M,
    queryFn: async () => {
      try {
        const { data, error } = await supabase
          .from('juragan_b2b_settings')
          .select('*')
          .limit(1)
          .maybeSingle()

        if (error) {
          console.warn('[useB2BSettings]', error.message)
          return null
        }
        return data || null
      } catch (e) {
        console.warn('[useB2BSettings]', e)
        return null
      }
    }
  })
}

export const useUpdateB2BSettings = () => {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: async (updates) => {
      const tenant_id = await getTenantId()
      const cleanUpdates = sanitizeDBPayload(
        { ...updates, tenant_id, updated_at: new Date().toISOString() },
        'juragan_b2b_settings'
      )

      // Check existing row
      const { data: existing } = await supabase
        .from('juragan_b2b_settings')
        .select('id')
        .limit(1)
        .maybeSingle()

      if (existing?.id) {
        const { data, error } = await supabase
          .from('juragan_b2b_settings')
          .update(cleanUpdates)
          .eq('id', existing.id)
          .select()
          .single()

        if (error) throw error
        return data
      } else {
        const { data, error } = await supabase
          .from('juragan_b2b_settings')
          .insert(cleanUpdates)
          .select()
          .single()

        if (error) throw error
        return data
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['juragan-b2b-settings'] })
      toast.success('Pengaturan target outreach B2B diperbarui')
    },
    onError: (err) => toast.error(normalizeSupabaseError(err).message),
  })
}

