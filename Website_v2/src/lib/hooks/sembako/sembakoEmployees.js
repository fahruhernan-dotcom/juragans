import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { supabase } from '../../supabase'
import { toast } from 'sonner'
import { useAuth } from '../useAuth'
import { normalizeSupabaseError } from '../../supabaseErrorHandler'
import { logSupabaseError } from '@/lib/logger/supabaseLogger'
import { STALE_5M, sanitizeDBPayload, getTenantId } from './sembakoCommon'

export const useSembakoEmployees = () => {
  const { tenant } = useAuth()
  return useQuery({
    queryKey: ['sembako-employees', tenant?.id],
    enabled: !!tenant?.id,
    staleTime: STALE_5M,
    queryFn: async () => {
      try {
        const { data, error } = await supabase.from('sembako_employees')
          .select('*')
          .eq('tenant_id', tenant.id)
          .eq('is_deleted', false)
          .order('full_name')
        if (error) { console.warn('[useSembakoEmployees]', error.message); return [] }
        return data || []
      } catch (e) { console.warn('[useSembakoEmployees]', e); return [] }
    }
  })
}

export const useUpdateSembakoEmployee = () => {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: async ({ id, ...updates }) => {
      const cleanUpdates = sanitizeDBPayload(updates, 'sembako_employees')
      const { error } = await supabase.from('sembako_employees')
        .update(cleanUpdates).eq('id', id)
      if (error) {
        logSupabaseError(error, { table: 'sembako_employees', operation: 'update', component: 'useSembakoData', actionName: 'sembako.employee.update' })
        throw error
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['sembako-employees'] })
      toast.success('Data pegawai diperbarui')
    },
    onError: (err) => toast.error(normalizeSupabaseError(err).message),
  })
}

export const useMarkPayrollPaid = () => {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: async (id) => {
      const { error } = await supabase.from('sembako_payroll')
        .update({ payment_status: 'paid', paid_at: new Date().toISOString() })
        .eq('id', id)
      if (error) {
        logSupabaseError(error, { table: 'sembako_payroll', operation: 'update', component: 'useSembakoData', actionName: 'sembako.payroll.mark_paid' })
        throw error
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['sembako-payroll'] })
      queryClient.invalidateQueries({ queryKey: ['sembako-dashboard-stats'] })
      toast.success('Gaji ditandai lunas')
    },
    onError: (err) => toast.error(normalizeSupabaseError(err).message),
  })
}

export const useCreateSembakoEmployee = () => {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: async (payload) => {
      const tenant_id = await getTenantId()
      const cleanPayload = sanitizeDBPayload({ ...payload, tenant_id }, 'sembako_employees')
      const { error } = await supabase.from('sembako_employees').insert(cleanPayload)
      if (error) {
        logSupabaseError(error, { table: 'sembako_employees', operation: 'insert', component: 'useSembakoData', actionName: 'sembako.employee.create' })
        throw error
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['sembako-employees'] })
      toast.success('Pegawai berhasil ditambahkan')
    },
    onError: (err) => toast.error(normalizeSupabaseError(err).message),
  })
}

export const useRecordPayroll = () => {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: async ({ employee_id, period_type, period_date,
      work_days, trip_count, sales_amount, base_amount,
      commission_amount, bonus, deduction, notes }) => {
      const tenant_id = await getTenantId()
      const total_pay = (base_amount || 0) + (commission_amount || 0) + (bonus || 0) - (deduction || 0)
      const { error } = await supabase.from('sembako_payroll').insert({
        tenant_id, employee_id, period_type, period_date, work_days, trip_count, sales_amount, base_amount, commission_amount, bonus, deduction, total_pay, notes, payment_status: 'pending',
      })
      if (error) {
        logSupabaseError(error, { table: 'sembako_payroll', operation: 'insert', component: 'useSembakoData', actionName: 'sembako.payroll.create' })
        throw error
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['sembako-payroll'] })
      queryClient.invalidateQueries({ queryKey: ['sembako-dashboard-stats'] })
      toast.success('Gaji berhasil dicatat')
    },
    onError: (err) => toast.error(normalizeSupabaseError(err).message),
  })
}

export const useSembakoPayrolls = () => {
  const { tenant } = useAuth()
  return useQuery({
    queryKey: ['sembako-payroll', tenant?.id],
    enabled: !!tenant?.id,
    staleTime: STALE_5M,
    queryFn: async () => {
      try {
        const { data, error } = await supabase.from('sembako_payroll')
          .select('total_pay, period_date, payment_status')
          .eq('tenant_id', tenant.id)
          .eq('is_deleted', false)
        if (error || !data) return []
        return data
      } catch {
        return []
      }
    }
  })
}
