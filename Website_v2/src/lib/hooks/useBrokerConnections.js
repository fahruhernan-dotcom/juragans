import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { supabase } from '@/lib/supabase'
import { useAuth } from '@/lib/hooks/useAuth'
import { toast } from 'sonner'
import { logSupabaseError } from '@/lib/logger/supabaseLogger'

// Ambil semua koneksi yang melibatkan tenant aktif
export const useMyConnections = () => {
  const { tenant } = useAuth()
  return useQuery({
    queryKey: ['broker-connections', tenant?.id],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('broker_connections')
        .select(`
          *,
          requester:requester_tenant_id(id, business_name, business_vertical, sub_type),
          target:target_tenant_id(id, business_name, business_vertical, sub_type)
        `)
        .or(`requester_tenant_id.eq.${tenant.id},target_tenant_id.eq.${tenant.id}`)
        .order('created_at', { ascending: false })
      if (error) throw error
      return data
    },
    enabled: !!tenant?.id
  })
}

// Cek status koneksi dengan tenant tertentu
export const useConnectionStatus = (targetTenantId) => {
  const { tenant } = useAuth()
  return useQuery({
    queryKey: ['connection-status', tenant?.id, targetTenantId],
    queryFn: async () => {
      const { data } = await supabase
        .from('broker_connections')
        .select('id, status, requester_tenant_id')
        .or(
          `and(requester_tenant_id.eq.${tenant.id},target_tenant_id.eq.${targetTenantId}),` +
          `and(requester_tenant_id.eq.${targetTenantId},target_tenant_id.eq.${tenant.id})`
        )
        .maybeSingle()
      return data  // null = belum ada koneksi
    },
    enabled: !!tenant?.id && !!targetTenantId
  })
}

// Request koneksi baru
export const useRequestConnection = () => {
  const { tenant } = useAuth()
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: async ({ targetTenantId, targetType, message }) => {
      const { data, error } = await supabase
        .from('broker_connections')
        .insert({
          requester_tenant_id: tenant.id,
          requester_type: tenant.business_vertical,
          target_tenant_id: targetTenantId,
          target_type: targetType,
          message: message || null,
          status: 'pending'
        })
        .select()
        .single()
      if (error) {
        logSupabaseError(error, { table: 'broker_connections', operation: 'insert', component: 'useBrokerConnections', actionName: 'broker.connection.request' })
        throw error
      }
      return data
    },
    onSuccess: (_, vars) => {
      queryClient.invalidateQueries(['broker-connections', tenant.id])
      queryClient.invalidateQueries(['connection-status', tenant.id, vars.targetTenantId])
      toast.success('Permintaan koneksi terkirim')
    },
    onError: (err) => {
      if (err.code === '23505') {
        toast.error('Kamu sudah pernah request koneksi ini')
      } else {
        toast.error('Gagal mengirim permintaan')
      }
    }
  })
}

// Respond ke koneksi (active/rejected/blocked)
export const useRespondConnection = () => {
  const { tenant } = useAuth()
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: async ({ connectionId, status, rejectedReason }) => {
      const { data, error } = await supabase
        .from('broker_connections')
        .update({
          status,
          rejected_reason: rejectedReason || null,
          responded_at: new Date().toISOString()
        })
        .eq('id', connectionId)
        .select()
        .single()
      if (error) {
        logSupabaseError(error, { table: 'broker_connections', operation: 'update', component: 'useBrokerConnections', actionName: 'broker.connection.respond' })
        throw error
      }
      return data
    },
    onSuccess: (data) => {
      queryClient.invalidateQueries(['broker-connections', tenant.id])
      queryClient.invalidateQueries(['connection-status'])
      const messages = {
        active:   'Koneksi diterima',
        rejected: 'Koneksi ditolak',
        blocked:  'Pengguna diblokir'
      }
      toast.success(messages[data.status] || 'Status diperbarui')
    }
  })
}

// Cancel request (oleh requester, hanya jika masih pending)
export const useCancelConnection = () => {
  const { tenant } = useAuth()
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: async (connectionId) => {
      const { error } = await supabase
        .from('broker_connections')
        .delete()
        .eq('id', connectionId)
        .eq('requester_tenant_id', tenant.id)
        .eq('status', 'pending')
      if (error) {
        logSupabaseError(error, { table: 'broker_connections', operation: 'delete', component: 'useBrokerConnections', actionName: 'broker.connection.cancel' })
        throw error
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries(['broker-connections', tenant.id])
      queryClient.invalidateQueries(['connection-status'])
      toast.success('Permintaan dibatalkan')
    }
  })
}
