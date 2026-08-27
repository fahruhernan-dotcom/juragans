import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { supabase } from '../../supabase'
import { toast } from 'sonner'
import { useAuth } from '../useAuth'
import { normalizeSupabaseError } from '../../supabaseErrorHandler'
import { logSupabaseError } from '@/lib/logger/supabaseLogger'
import { logError } from '@/lib/logger/errorLogger'
import { STALE_5M, sanitizeDBPayload, getTenantId } from './sembakoCommon'

import { calculateBomProductStock } from '@/lib/inventory/bomStockCalculator'

export const useSembakoProducts = () => {
  const { tenant } = useAuth()
  return useQuery({
    queryKey: ['sembako-products', tenant?.id],
    enabled: !!tenant?.id,
    staleTime: STALE_5M,
    queryFn: async () => {
      try {
        const [prodRes, batchRes, rawRes] = await Promise.all([
          supabase.from('sembako_products')
            .select('*')
            .eq('tenant_id', tenant.id)
            .eq('is_deleted', false)
            .order('product_name'),
          supabase.from('sembako_stock_batches')
            .select('product_id, qty_sisa, qty_masuk, buy_price')
            .eq('tenant_id', tenant.id)
            .eq('is_deleted', false)
            .gt('qty_sisa', 0),
          supabase.from('sembako_raw_materials')
            .select('*')
            .eq('tenant_id', tenant.id)
            .eq('is_deleted', false)
        ])

        if (prodRes.error) { console.warn('[useSembakoProducts]', prodRes.error.message); return [] }
        const products = prodRes.data || []
        const batches = batchRes.data || []
        const rawMaterials = rawRes.data || []

        const batchStockMap = {}
        const batchCostMap = {}  // weighted avg buy_price per product
        batches.forEach(b => {
          const qty = Number(b.qty_sisa) || 0
          batchStockMap[b.product_id] = (batchStockMap[b.product_id] || 0) + qty
          if (!batchCostMap[b.product_id]) batchCostMap[b.product_id] = { totalCost: 0, totalQty: 0 }
          batchCostMap[b.product_id].totalCost += qty * (Number(b.buy_price) || 0)
          batchCostMap[b.product_id].totalQty += qty
        })

        const syncedProducts = products.map(p => {
          const hasBatches = batchStockMap[p.id] !== undefined
          const batchSum = batchStockMap[p.id] || 0

          // Calculate live capacity from Bill of Materials (BOM)
          const bomData = calculateBomProductStock(p, rawMaterials)

          // SINGLE SOURCE OF TRUTH: If has physical finished batches use batchSum, otherwise auto-sync from BOM materials
          const realStock = hasBatches ? batchSum : (bomData.totalStock !== undefined ? bomData.totalStock : Number(p.current_stock || 0))

          // Fallback avg_buy_price from active batches (FIFO-weighted)
          const batchCost = batchCostMap[p.id]
          const batchAvgBuyPrice = batchCost && batchCost.totalQty > 0
            ? Math.round(batchCost.totalCost / batchCost.totalQty)
            : 0
          const realAvgBuyPrice = Number(p.avg_buy_price) || batchAvgBuyPrice

          // Auto-heal/sync database current_stock so DB is never desynchronized from BOM / batch sum
          if (Number(p.current_stock) !== realStock) {
            supabase.from('sembako_products').update({ current_stock: realStock }).eq('id', p.id).then(() => { })
          }

          return {
            ...p,
            current_stock: realStock,
            avg_buy_price: realAvgBuyPrice,
            bom_stock: bomData.totalStock,
            bom_bottleneck: bomData.bottleneck,
            bom_components: bomData.components,
          }
        })

        return syncedProducts
      } catch (e) { console.warn('[useSembakoProducts]', e); return [] }
    }
  })
}

export const useCreateSembakoProduct = () => {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: async (payload) => {
      const tenant_id = await getTenantId()
      const cleanPayload = sanitizeDBPayload({ ...payload, tenant_id }, 'sembako_products')
      const { error } = await supabase.from('sembako_products')
        .insert(cleanPayload)
      if (error) {
        logSupabaseError(error, { table: 'sembako_products', operation: 'insert', component: 'useSembakoData', actionName: 'sembako.product.create' })
        throw error
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['sembako-products'] })
      queryClient.invalidateQueries({ queryKey: ['sembako-dashboard-stats'] })
      toast.success('Produk berhasil ditambahkan')
    },
    onError: (err) => toast.error(normalizeSupabaseError(err).message),
  })
}

export const useUpdateSembakoProduct = () => {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: async ({ id, ...updates }) => {
      const cleanUpdates = sanitizeDBPayload(updates, 'sembako_products')
      const { error } = await supabase.from('sembako_products').update(cleanUpdates).eq('id', id)
      if (error) {
        logSupabaseError(error, { table: 'sembako_products', operation: 'update', component: 'useSembakoData', actionName: 'sembako.product.update' })
        throw error
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['sembako-products'] })
      queryClient.invalidateQueries({ queryKey: ['sembako-dashboard-stats'] })
      toast.success('Produk berhasil diperbarui')
    },
    onError: (err) => toast.error(normalizeSupabaseError(err).message),
  })
}

export const useSoftDeleteSembakoProduct = () => {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: async (id) => {
      // 1. Check if product still has active batch stock (qty_sisa > 0)
      const { data: activeBatches } = await supabase
        .from('sembako_stock_batches')
        .select('qty_sisa')
        .eq('product_id', id)
        .eq('is_deleted', false)
        .gt('qty_sisa', 0)

      const remainingStock = (activeBatches || []).reduce((s, b) => s + Number(b.qty_sisa || 0), 0)
      if (remainingStock > 0) {
        throw new Error(`Tidak dapat menghapus produk ini karena masih memiliki sisa stok aktif (${remainingStock} unit). Habiskan atau sesuaikan stok terlebih dahulu.`)
      }

      const { error: errProduct } = await supabase.from('sembako_products').update({ is_deleted: true }).eq('id', id)
      if (errProduct) {
        logSupabaseError(errProduct, { table: 'sembako_products', operation: 'update', component: 'useSembakoData', actionName: 'sembako.product.delete' })
        throw errProduct
      }
      const { error: errBatch } = await supabase.from('sembako_stock_batches').update({ is_deleted: true }).eq('product_id', id)
      if (errBatch) {
        // Partial commit: product marked deleted but related batches still active.
        logError({
          level: 'error', source: 'supabase', component: 'useSembakoData',
          actionName: 'sembako.product.delete.batch_sync',
          error: errBatch,
          metadata: { table: 'sembako_stock_batches', operation: 'update', partial: true, step: 'batch_soft_delete', product_id: id },
        })
        throw errBatch
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['sembako-products'] })
      queryClient.invalidateQueries({ queryKey: ['sembako-all-batches'] })
      queryClient.invalidateQueries({ queryKey: ['sembako-dashboard-stats'] })
      toast.success('Produk dihapus')
    },
    onError: (err) => toast.error(normalizeSupabaseError(err).message),
  })
}
