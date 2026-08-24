import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { supabase } from '../../supabase'
import { toast } from 'sonner'
import { useAuth } from '../useAuth'
import { normalizeSupabaseError } from '../../supabaseErrorHandler'
import { logSupabaseError } from '@/lib/logger/supabaseLogger'
import { STALE_5M, sanitizeDBPayload, getTenantId } from './sembakoCommon'

export const useSembakoSuppliers = () => {
  const { tenant } = useAuth()
  return useQuery({
    queryKey: ['sembako-suppliers', tenant?.id],
    enabled: !!tenant?.id,
    staleTime: STALE_5M,
    queryFn: async () => {
      try {
        const { data: suppliers, error: suppError } = await supabase.from('sembako_suppliers')
          .select('*')
          .eq('tenant_id', tenant.id)
          .eq('is_deleted', false)
          .order('supplier_name')
        if (suppError) { console.warn('[useSembakoSuppliers]', suppError.message); return [] }

        // Fetch supplier batch total costs
        const { data: batches, error: batchError } = await supabase.from('sembako_stock_batches')
          .select('supplier_id, total_cost, qty_masuk, buy_price')
          .eq('tenant_id', tenant.id)
          .eq('is_deleted', false)

        // Fetch supplier payments
        const { data: payments, error: payError } = await supabase.from('sembako_supplier_payments')
          .select('supplier_id, amount')
          .eq('tenant_id', tenant.id)
          .eq('is_deleted', false)

        const batchCostMap = (batches || []).reduce((acc, b) => {
          if (!b.supplier_id) return acc
          const cost = Number(b.total_cost) > 0 ? Number(b.total_cost) : (Number(b.qty_masuk || 0) * Number(b.buy_price || 0))
          acc[b.supplier_id] = (acc[b.supplier_id] || 0) + cost
          return acc
        }, {})

        const paymentMap = (payments || []).reduce((acc, p) => {
          if (!p.supplier_id) return acc
          acc[p.supplier_id] = (acc[p.supplier_id] || 0) + (Number(p.amount) || 0)
          return acc
        }, {})

        return (suppliers || []).map(s => {
          const totalCost = batchCostMap[s.id] || 0
          const totalPaid = paymentMap[s.id] || 0
          return {
            ...s,
            total_purchase_value: totalCost,
            total_paid_value: totalPaid,
            total_outstanding: Math.max(0, totalCost - totalPaid)
          }
        })
      } catch (e) { console.warn('[useSembakoSuppliers]', e); return [] }
    }
  })
}

export const useCreateSembakoSupplier = () => {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: async (payload) => {
      const tenant_id = await getTenantId()
      const cleanPayload = sanitizeDBPayload({ ...payload, tenant_id }, 'sembako_suppliers')
      const { data, error } = await supabase.from('sembako_suppliers').insert(cleanPayload).select().single()
      if (error) {
        logSupabaseError(error, { table: 'sembako_suppliers', operation: 'insert', component: 'useSembakoData', actionName: 'sembako.supplier.create' })
        throw error
      }
      return data
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['sembako-suppliers'] })
      toast.success('Supplier berhasil ditambahkan')
    },
    onError: (err) => toast.error(normalizeSupabaseError(err).message),
  })
}

export const useUpdateSembakoSupplier = () => {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: async ({ id, ...updates }) => {
      const cleanUpdates = sanitizeDBPayload(updates, 'sembako_suppliers')
      const { error } = await supabase.from('sembako_suppliers')
        .update(cleanUpdates).eq('id', id)
      if (error) {
        logSupabaseError(error, { table: 'sembako_suppliers', operation: 'update', component: 'useSembakoData', actionName: 'sembako.supplier.update' })
        throw error
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['sembako-suppliers'] })
      toast.success('Supplier berhasil diperbarui')
    },
    onError: (err) => toast.error(normalizeSupabaseError(err).message),
  })
}

export const useDeleteSembakoSupplier = () => {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: async (arg) => {
      const id = typeof arg === 'object' ? arg.id : arg
      const deleteTransactions = typeof arg === 'object' ? Boolean(arg.deleteTransactions) : false

      const { error } = await supabase.from('sembako_suppliers')
        .update({ is_deleted: true }).eq('id', id)
      if (error) {
        logSupabaseError(error, { table: 'sembako_suppliers', operation: 'update', component: 'useSembakoData', actionName: 'sembako.supplier.delete' })
        throw error
      }

      // If requested, also soft delete all batches & payments linked to this supplier
      if (deleteTransactions) {
        await Promise.all([
          supabase.from('sembako_stock_batches').update({ is_deleted: true }).eq('supplier_id', id),
          supabase.from('sembako_supplier_payments').update({ is_deleted: true }).eq('supplier_id', id),
        ])
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['sembako-suppliers'] })
      queryClient.invalidateQueries({ queryKey: ['sembako-batches'] })
      queryClient.invalidateQueries({ queryKey: ['sembako-all-batches'] })
      queryClient.invalidateQueries({ queryKey: ['sembako-supplier-payments'] })
      queryClient.invalidateQueries({ queryKey: ['sembako-supplier-invoices'] })
      queryClient.invalidateQueries({ queryKey: ['sembako-dashboard-stats'] })
      toast.success('Supplier berhasil dihapus')
    },
    onError: (err) => toast.error(normalizeSupabaseError(err).message),
  })
}

export const useSembakoSupplierInvoices = (supplierId) => useQuery({
  queryKey: ['sembako-supplier-invoices', supplierId],
  enabled: !!supplierId,
  staleTime: STALE_5M,
  queryFn: async () => {
    const { data, error } = await supabase.from('sembako_stock_batches')
      .select('*, sembako_products(product_name, unit)')
      .eq('supplier_id', supplierId)
      .eq('is_deleted', false)
      .order('purchase_date', { ascending: false })
    if (error) throw normalizeSupabaseError(error)
    return (data || []).map(b => ({
      ...b,
      total_cost: Number(b.total_cost) > 0 ? Number(b.total_cost) : (Number(b.qty_masuk || 0) * Number(b.buy_price || 0))
    }))
  }
})

export const useSembakoSupplierPayments = (supplierId) => useQuery({
  queryKey: ['sembako-supplier-payments', supplierId],
  enabled: !!supplierId,
  staleTime: STALE_5M,
  queryFn: async () => {
    const { data, error } = await supabase.from('sembako_supplier_payments')
      .select('*')
      .eq('supplier_id', supplierId)
      .eq('is_deleted', false)
      .order('payment_date', { ascending: false })
    if (error) throw normalizeSupabaseError(error)
    return data
  }
})

export const useSembakoAllSupplierPayments = () => {
  const { tenant } = useAuth()
  return useQuery({
    queryKey: ['sembako-all-supplier-payments', tenant?.id],
    enabled: !!tenant?.id,
    staleTime: STALE_5M,
    queryFn: async () => {
      const { data, error } = await supabase.from('sembako_supplier_payments')
        .select('*')
        .eq('tenant_id', tenant.id)
        .eq('is_deleted', false)
        .order('payment_date', { ascending: true })
      if (error) throw normalizeSupabaseError(error)
      return data || []
    }
  })
}


export const useRecordSembakoSupplierPayment = () => {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: async (payload) => {
      const tenant_id = await getTenantId()
      const { error } = await supabase
        .from('sembako_supplier_payments')
        .insert({ ...payload, tenant_id })
      if (error) {
        logSupabaseError(error, { table: 'sembako_supplier_payments', operation: 'insert', component: 'useSembakoData', actionName: 'sembako.supplier_payment.create' })
        throw error
      }
    },
    onSuccess: (_, vars) => {
      queryClient.invalidateQueries({ queryKey: ['sembako-supplier-payments', vars.supplier_id] })
      queryClient.invalidateQueries({ queryKey: ['sembako-supplier-invoices', vars.supplier_id] })
      queryClient.invalidateQueries({ queryKey: ['sembako-suppliers'] })
      queryClient.invalidateQueries({ queryKey: ['sembako-dashboard-stats'] })
      toast.success('Pembayaran ke supplier dicatat')
    },
    onError: (err) => toast.error(normalizeSupabaseError(err).message),
  })
}
