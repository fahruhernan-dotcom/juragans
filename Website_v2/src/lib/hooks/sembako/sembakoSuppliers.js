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
        const { data: batches } = await supabase.from('sembako_stock_batches')
          .select('supplier_id, total_cost, qty_masuk, buy_price')
          .eq('tenant_id', tenant.id)
          .eq('is_deleted', false)

        // Fetch raw materials (Bahan Baku & Kemasan)
        const { data: rawMaterials } = await supabase.from('sembako_raw_materials')
          .select('id, supplier_name, total_spent, current_stock, unit_cost')
          .eq('tenant_id', tenant.id)
          .eq('is_deleted', false)

        // Fetch supplier payments
        const { data: payments } = await supabase.from('sembako_supplier_payments')
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
          const sName = (s.supplier_name || '').toLowerCase().trim()

          // Cost from SKU product stock batches
          const batchCost = batchCostMap[s.id] || 0

          // Cost from raw materials & packaging
          const rawMaterialCost = (rawMaterials || []).reduce((sum, r) => {
            const rSuppName = (r.supplier_name || '').toLowerCase().trim()
            if (rSuppName && rSuppName === sName) {
              const spent = Number(r.total_spent) > 0 ? Number(r.total_spent) : (Number(r.current_stock || 0) * Number(r.unit_cost || 0))
              return sum + spent
            }
            return sum
          }, 0)

          const totalCost = batchCost + rawMaterialCost
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

export const useSembakoSupplierInvoices = (supplierId) => {
  const { tenant } = useAuth()
  return useQuery({
    queryKey: ['sembako-supplier-invoices', supplierId, tenant?.id],
    enabled: !!supplierId && !!tenant?.id,
    staleTime: STALE_5M,
    queryFn: async () => {
      try {
        // 1. Get supplier info for name matching
        const { data: supplier } = await supabase.from('sembako_suppliers')
          .select('id, supplier_name')
          .eq('id', supplierId)
          .single()

        const supplierName = supplier?.supplier_name?.toLowerCase().trim() || ''

        // 2. Fetch product SKU batches
        const { data: batches } = await supabase.from('sembako_stock_batches')
          .select('*, sembako_products(product_name, unit)')
          .eq('supplier_id', supplierId)
          .eq('is_deleted', false)

        const mappedBatches = (batches || []).map(b => ({
          id: b.id,
          purchase_date: b.purchase_date || b.created_at,
          product_name: b.sembako_products?.product_name || 'Produk Jadi',
          item_category: 'produk_jadi',
          category_label: 'Produk Jadi',
          qty_masuk: b.qty_masuk,
          unit: b.sembako_products?.unit || 'Unit',
          buy_price: b.buy_price || 0,
          total_cost: Number(b.total_cost) > 0 ? Number(b.total_cost) : (Number(b.qty_masuk || 0) * Number(b.buy_price || 0)),
          qty_sisa: b.qty_sisa,
          notes: b.notes || '',
          sembako_products: b.sembako_products
        }))

        // 3. Fetch raw materials & packaging
        let mappedRawMaterials = []
        if (supplierName) {
          const { data: rawMaterials } = await supabase.from('sembako_raw_materials')
            .select('*')
            .eq('tenant_id', tenant.id)
            .eq('is_deleted', false)
            .ilike('supplier_name', supplier?.supplier_name)

          mappedRawMaterials = (rawMaterials || []).map(r => {
            const isBahan = ['bawang_mentah', 'bawang_curah', 'bawang_putih', 'minyak_goreng', 'tepung_bumbu', 'bahan_baku', 'bahan_lain'].includes(r.category)
            const spent = Number(r.total_spent) > 0 ? Number(r.total_spent) : (Number(r.current_stock || 0) * Number(r.unit_cost || 0))
            return {
              id: r.id,
              purchase_date: r.updated_at || r.created_at,
              product_name: r.material_name,
              item_category: isBahan ? 'bahan_baku' : 'kemasan',
              category_label: isBahan ? 'Bahan Baku Mentah' : 'Kemasan & Packaging',
              qty_masuk: r.current_stock,
              unit: r.unit || 'pcs',
              buy_price: r.unit_cost || 0,
              total_cost: spent,
              qty_sisa: r.current_stock,
              notes: r.notes || `Pembelian ${isBahan ? 'Bahan Baku' : 'Kemasan'} dari ${supplier?.supplier_name}`
            }
          })
        }

        // 4. Fetch restock audit logs
        let mappedRestockLogs = []
        if (supplierName) {
          const { data: auditLogs } = await supabase.from('sembako_audit_logs')
            .select('*')
            .eq('tenant_id', tenant.id)
            .eq('action_type', 'RESTOCK_BAHAN')
            .order('created_at', { ascending: false })

          mappedRestockLogs = (auditLogs || [])
            .filter(l => {
              try {
                if (l.notes && l.notes.startsWith('{')) {
                  const meta = JSON.parse(l.notes)
                  return (meta.supplier_name || '').toLowerCase().trim() === supplierName
                }
              } catch { /* ignore */ }
              return false
            })
            .map(l => {
              let meta = {}
              try { if (l.notes.startsWith('{')) meta = JSON.parse(l.notes) } catch { /* ignore */ }
              return {
                id: l.id,
                purchase_date: l.created_at || l.timestamp,
                product_name: l.product_name,
                item_category: 'restok_bahan',
                category_label: 'Restok Cepat',
                qty_masuk: meta.qty_added || 0,
                unit: meta.unit || 'pcs',
                buy_price: meta.unit_cost || 0,
                total_cost: meta.total_spent || (Number(meta.qty_added || 0) * Number(meta.unit_cost || 0)),
                qty_sisa: meta.new_stock ?? '-',
                notes: meta.notes || `Restok oleh ${l.user_name || 'Admin'}`
              }
            })
        }

        // Combine and sort chronologically descending
        const combined = [...mappedBatches, ...mappedRawMaterials, ...mappedRestockLogs]
          .sort((a, b) => new Date(b.purchase_date) - new Date(a.purchase_date))

        return combined
      } catch (e) {
        console.warn('[useSembakoSupplierInvoices]', e)
        return []
      }
    }
  })
}

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
