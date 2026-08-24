import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { supabase } from '../supabase'
import { useAuth } from './useAuth'
import { toast } from 'sonner'
import { logSupabaseError } from '../logger/supabaseLogger'

const STALE_5M = 5 * 60 * 1000

export const useBrokerEmployees = () => {
  const { tenant } = useAuth()
  return useQuery({
    queryKey: ['broker-employees', tenant?.id],
    enabled: !!tenant?.id,
    staleTime: STALE_5M,
    queryFn: async () => {
      const { data, error } = await supabase
        .from('broker_employees')
        .select('*')
        .eq('tenant_id', tenant.id)
        .eq('is_deleted', false)
        .order('full_name')
      if (error) throw error
      return data ?? []
    }
  })
}

export const useCreateBrokerEmployee = () => {
  const queryClient = useQueryClient()
  const { tenant } = useAuth()
  return useMutation({
    mutationFn: async (payload) => {
      const { error } = await supabase
        .from('broker_employees')
        .insert({ ...payload, tenant_id: tenant.id })
      if (error) {
        logSupabaseError(error, { table: 'broker_employees', operation: 'insert', component: 'useBrokerKaryawanData', actionName: 'broker.employee.create' })
        throw error
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries(['broker-employees', tenant?.id])
      toast.success('Karyawan berhasil ditambahkan')
    },
    onError: (e) => toast.error('Gagal tambah karyawan: ' + e.message)
  })
}

export const useUpdateBrokerEmployee = () => {
  const queryClient = useQueryClient()
  const { tenant } = useAuth()
  return useMutation({
    mutationFn: async ({ id, ...updates }) => {
      const { error } = await supabase
        .from('broker_employees')
        .update(updates)
        .eq('id', id)
      if (error) {
        logSupabaseError(error, { table: 'broker_employees', operation: 'update', component: 'useBrokerKaryawanData', actionName: 'broker.employee.update' })
        throw error
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries(['broker-employees', tenant?.id])
      toast.success('Data karyawan diperbarui')
    },
    onError: (e) => toast.error('Gagal update: ' + e.message)
  })
}

export const useDeleteBrokerEmployee = () => {
  const queryClient = useQueryClient()
  const { tenant } = useAuth()
  return useMutation({
    mutationFn: async (id) => {
      const { error } = await supabase
        .from('broker_employees')
        .update({ is_deleted: true })
        .eq('id', id)
      if (error) {
        logSupabaseError(error, { table: 'broker_employees', operation: 'update', component: 'useBrokerKaryawanData', actionName: 'broker.employee.delete' })
        throw error
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries(['broker-employees', tenant?.id])
      toast.success('Karyawan dihapus')
    },
    onError: (e) => toast.error('Gagal hapus: ' + e.message)
  })
}
