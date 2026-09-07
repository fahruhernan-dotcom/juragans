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
        const [prodRes, batchRes, rawRes, custodyRes] = await Promise.all([
          supabase.from('sembako_products')
            .select('*')
            .eq('tenant_id', tenant.id)
            .eq('is_deleted', false)
            .order('product_name'),
          supabase.from('sembako_stock_batches')
            .select('product_id, qty_sisa, qty_masuk, buy_price, purchase_date, created_at')
            .eq('tenant_id', tenant.id)
            .eq('is_deleted', false)
            .gt('qty_sisa', 0)
            .order('purchase_date', { ascending: true })
            .order('created_at', { ascending: true }),
          supabase.from('sembako_raw_materials')
            .select('*')
            .eq('tenant_id', tenant.id)
            .eq('is_deleted', false),
          supabase.from('sembako_stock_custody')
            .select('product_id, quantity, holder_type, employee_id')
            .eq('tenant_id', tenant.id)
        ])

        if (prodRes.error) {
          logSupabaseError(prodRes.error, { table: 'sembako_products', operation: 'select', component: 'useSembakoProducts' })
          return []
        }
        const products = prodRes.data || []
        const batches = batchRes.data || []
        const rawMaterials = rawRes.data || []
        const custodies = custodyRes.data || []

        const batchStockMap = {}
        const fifoActivePriceMap = {} // FIFO: Oldest active batch price (queue head to be consumed next)
        const fifoAssetValueMap = {}  // FIFO: Exact sum of remaining lot values (qty_sisa * buy_price)
        batches.forEach(b => {
          const qty = Number(b.qty_sisa) || 0
          const price = Number(b.buy_price) || 0
          batchStockMap[b.product_id] = (batchStockMap[b.product_id] || 0) + qty
          fifoAssetValueMap[b.product_id] = (fifoAssetValueMap[b.product_id] || 0) + (qty * price)

          // First batch encountered is oldest active lot due to ASC order
          if (fifoActivePriceMap[b.product_id] === undefined && qty > 0) {
            fifoActivePriceMap[b.product_id] = price
          }
        })

        const custodyStockMap = {}
        custodies.forEach(c => {
          custodyStockMap[c.product_id] = (custodyStockMap[c.product_id] || 0) + (Number(c.quantity) || 0)
        })

        const syncedProducts = products.map(p => {
          const hasBatches = batchStockMap[p.id] !== undefined
          const batchSum = batchStockMap[p.id] || 0
          const hasCustody = custodyStockMap[p.id] !== undefined
          const custodySum = custodyStockMap[p.id] || 0

          // Calculate live capacity from Bill of Materials (BOM)
          const bomData = calculateBomProductStock(p, rawMaterials)

          // STOK FISIK PRODUK JADI:
          // 1. Batch produk jadi jika ada
          // 2. Custody fisik (Gudang/Tim) jika ada
          // 3. current_stock di tabel sembako_products
          const realStock = hasBatches
            ? batchSum
            : (hasCustody ? custodySum : Number(p.current_stock || 0))

          // Pure FIFO active unit cost: uses oldest active lot price if batches exist
          const fifoActiveBuyPrice = fifoActivePriceMap[p.id] !== undefined
            ? fifoActivePriceMap[p.id]
            : (Number(p.avg_buy_price) || 0)

          const realAvgBuyPrice = fifoActiveBuyPrice
          const fifoAssetVal = fifoAssetValueMap[p.id] !== undefined
            ? fifoAssetValueMap[p.id]
            : (realStock * realAvgBuyPrice)

          return {
            ...p,
            current_stock: realStock,
            avg_buy_price: realAvgBuyPrice,
            fifo_asset_value: fifoAssetVal,
            bom_stock: bomData.totalStock,
            bom_bottleneck: bomData.bottleneck,
            bom_components: bomData.components,
          }
        })

        return syncedProducts
      } catch (e) {
        logError(e, { component: 'useSembakoProducts' })
        return []
      }
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
