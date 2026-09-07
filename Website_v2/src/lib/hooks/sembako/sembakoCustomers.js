import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { supabase } from '../../supabase'
import { toast } from 'sonner'
import { useAuth } from '../useAuth'
import { normalizeSupabaseError } from '../../supabaseErrorHandler'
import { logSupabaseError } from '@/lib/logger/supabaseLogger'
import { STALE_5M, sanitizeDBPayload, getTenantId } from './sembakoCommon'
import { processSaleRow } from './sembakoSales'

export const useSembakoCustomers = () => {
  const { tenant } = useAuth()
  return useQuery({
    queryKey: ['sembako-customers', tenant?.id],
    enabled: !!tenant?.id,
    staleTime: STALE_5M,
    queryFn: async () => {
      try {
        const { data: customers, error: custError } = await supabase.from('sembako_customers')
          .select('*')
          .eq('tenant_id', tenant.id)
          .eq('is_deleted', false)
          .order('customer_name')
        if (custError) {
          logSupabaseError(custError, { table: 'sembako_customers', operation: 'select', component: 'useSembakoCustomers' })
          return []
        }

        // Efficiently fetch outstanding remaining_amount for active unpaid sales
        const { data: unpaidSales, error: salesError } = await supabase.from('sembako_sales')
          .select('id, customer_id, customer_name, total_amount, paid_amount, remaining_amount, payment_status, sembako_payments(amount, payment_method, is_deleted)')
          .eq('tenant_id', tenant.id)
          .eq('is_deleted', false)
          .neq('payment_status', 'lunas')
        
        if (salesError) {
          logSupabaseError(salesError, { table: 'sembako_sales', operation: 'select', component: 'useSembakoCustomers' })
          return customers || []
        }

        const outstandingMap = (unpaidSales || []).reduce((acc, sale) => {
          const cid = sale.customer_id
          if (!cid || sale.payment_status === 'lunas') return acc

          const payments = Array.isArray(sale.sembako_payments) ? sale.sembako_payments.filter(p => !p.is_deleted) : []
          const paidFromPayments = payments
            .filter(p => Number(p.amount || p.amount_paid || 0) > 0 && p.payment_method !== 'pengembalian_tunai_retur')
            .reduce((s, p) => s + (Number(p.amount || p.amount_paid) || 0), 0)
          const refundFromPayments = payments
            .filter(p => p.payment_method === 'pengembalian_tunai_retur' || Number(p.amount || p.amount_paid || 0) < 0)
            .reduce((s, p) => s + Math.abs(Number(p.amount || p.amount_paid || 0)), 0)

          const netPaid = Math.max(Number(sale.paid_amount || 0), Math.max(0, paidFromPayments - refundFromPayments))
          const totalAmt = Number(sale.total_amount || 0)
          const realRemaining = Math.max(0, totalAmt - netPaid)

          if (realRemaining > 0) {
            acc[cid] = (acc[cid] || 0) + realRemaining
          }
          return acc
        }, {})

        return (customers || []).map(c => ({
          ...c,
          total_outstanding: outstandingMap[c.id] || 0
        }))
      } catch (e) { console.warn('[useSembakoCustomers]', e); return [] }
    }
  })
}

export const useCreateSembakoCustomer = () => {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: async (payload) => {
      const tenant_id = await getTenantId()
      const cleanPayload = sanitizeDBPayload({ ...payload, tenant_id }, 'sembako_customers')
      const { data, error } = await supabase.from('sembako_customers')
        .insert(cleanPayload)
        .select().single()
      if (error) {
        logSupabaseError(error, { table: 'sembako_customers', operation: 'insert', component: 'useSembakoData', actionName: 'sembako.customer.create' })
        throw error
      }
      return data
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['sembako-customers'] })
      toast.success('Toko berhasil ditambahkan')
    },
    onError: (err) => toast.error(normalizeSupabaseError(err).message),
  })
}

export const useUpdateSembakoCustomer = () => {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: async ({ id, ...updates }) => {
      const cleanUpdates = sanitizeDBPayload(updates, 'sembako_customers')
      const { error } = await supabase.from('sembako_customers')
        .update(cleanUpdates).eq('id', id)
      if (error) {
        logSupabaseError(error, { table: 'sembako_customers', operation: 'update', component: 'useSembakoData', actionName: 'sembako.customer.update' })
        throw error
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['sembako-customers'] })
      toast.success('Toko berhasil diperbarui')
    },
    onError: (err) => toast.error(normalizeSupabaseError(err).message),
  })
}

export const useDeleteSembakoCustomer = () => {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: async (arg) => {
      const id = typeof arg === 'object' ? arg.id : arg
      const deleteTransactions = typeof arg === 'object' ? Boolean(arg.deleteTransactions) : false

      const { error } = await supabase.from('sembako_customers')
        .update({ is_deleted: true }).eq('id', id)
      if (error) {
        logSupabaseError(error, { table: 'sembako_customers', operation: 'update', component: 'useSembakoData', actionName: 'sembako.customer.delete' })
        throw error
      }

      // If requested, also soft delete all sales & payments linked to this customer
      if (deleteTransactions) {
        await Promise.all([
          supabase.from('sembako_sales').update({ is_deleted: true }).eq('customer_id', id),
          supabase.from('sembako_payments').update({ is_deleted: true }).eq('customer_id', id),
        ])
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['sembako-customers'] })
      queryClient.invalidateQueries({ queryKey: ['sembako-sales'] })
      queryClient.invalidateQueries({ queryKey: ['sembako-customer-invoices'] })
      queryClient.invalidateQueries({ queryKey: ['sembako-customer-payments'] })
      queryClient.invalidateQueries({ queryKey: ['sembako-dashboard-stats'] })
      toast.success('Toko berhasil dihapus')
    },
    onError: (err) => toast.error(normalizeSupabaseError(err).message),
  })
}

export const useSembakoCustomerInvoices = (customerId) => useQuery({
  queryKey: ['sembako-customer-invoices', customerId],
  enabled: !!customerId,
  staleTime: STALE_5M,
  queryFn: async () => {
    const { data, error } = await supabase.from('sembako_sales')
      .select('*, sembako_sale_items(*), sembako_payments(*)')
      .eq('customer_id', customerId)
      .eq('is_deleted', false)
      .order('transaction_date', { ascending: false })
    if (error) throw normalizeSupabaseError(error)

    // Fetch returns for these sales to calculate processed values
    const { data: dbReturns } = await supabase
      .from('sembako_returns')
      .select('*')
      .eq('customer_id', customerId)
      .eq('is_deleted', false)

    let localReturns = []
    try {
      const saved = localStorage.getItem('erp_retur_list')
      if (saved) localReturns = JSON.parse(saved)
    } catch (e) {
      console.warn('[useCustomerSales] Gagal parse erp_retur_list dari localStorage:', e.message)
    }

    // Deduplicate returns by ID to prevent double subtraction of synced records
    const returnsMap = {}
    const returnsData = []
    if (dbReturns) {
      dbReturns.forEach(r => {
        if (r.id) {
          returnsMap[r.id] = r
          returnsData.push(r)
        }
      })
    }
    localReturns.forEach(r => {
      if (r.id) {
        if (!returnsMap[r.id]) {
          returnsMap[r.id] = r
          returnsData.push(r)
        }
      } else {
        returnsData.push(r)
      }
    })

    return (data || []).map(sale => processSaleRow(sale, returnsData))
  }
})

export const useSembakoCustomerPayments = (customerId) => useQuery({
  queryKey: ['sembako-customer-payments', customerId],
  enabled: !!customerId,
  staleTime: STALE_5M,
  queryFn: async () => {
    try {
      const { data, error } = await supabase.from('sembako_payments')
        .select('*, sembako_sales(invoice_number, is_deleted)')
        .eq('customer_id', customerId)
        .order('payment_date', { ascending: false })
      if (error) {
        console.warn('[useSembakoCustomerPayments]', error.message)
        return []
      }
      return (data || []).filter(p => !p.sembako_sales || !p.sembako_sales.is_deleted)
    } catch (e) {
      console.warn('[useSembakoCustomerPayments]', e)
      return []
    }
  }
})
