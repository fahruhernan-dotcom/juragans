import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { supabase } from '../../supabase'
import { toast } from 'sonner'
import { useAuth } from '../useAuth'
import { normalizeSupabaseError } from '../../supabaseErrorHandler'
import { logSupabaseError } from '@/lib/logger/supabaseLogger'
import { logError } from '@/lib/logger/errorLogger'
import { STALE_5M, getTenantId } from './sembakoCommon'

export const useSembakoStockBatches = (productId) => {
  const { tenant } = useAuth()
  return useQuery({
    queryKey: ['sembako-batches', tenant?.id, productId],
    enabled: !!productId && !!tenant?.id,
    staleTime: STALE_5M,
    queryFn: async () => {
      try {
        const { data, error } = await supabase.from('sembako_stock_batches')
          .select('*, sembako_suppliers(supplier_name)')
          .eq('tenant_id', tenant.id)
          .eq('product_id', productId)
          .eq('is_deleted', false)
          .gt('qty_sisa', 0)
          .order('created_at', { ascending: true }) // FIFO
        if (error || !data) return []
        return data
      } catch {
        return []
      }
    }
  })
}

// useSembakoAllBatches — semua batch (termasuk habis), untuk riwayat masuk
export const useSembakoAllBatches = (productId) => {
  const { tenant } = useAuth()
  return useQuery({
    queryKey: ['sembako-all-batches', tenant?.id, productId ?? 'all'],
    enabled: !!tenant?.id,
    staleTime: STALE_5M,
    queryFn: async () => {
      let q = supabase.from('sembako_stock_batches')
        .select('*, sembako_suppliers(supplier_name), sembako_products(product_name, unit)')
        .eq('tenant_id', tenant.id)
        .eq('is_deleted', false)
        .order('created_at', { ascending: false })
      if (productId) q = q.eq('product_id', productId)
      const { data, error } = await q
      if (error) throw normalizeSupabaseError(error)
      return data
    }
  })
}

// useSembakoStockOut — riwayat pengurangan stok (FIFO)
export const useSembakoStockOut = (productId) => {
  const { tenant } = useAuth()
  return useQuery({
    queryKey: ['sembako-stock-out', tenant?.id, productId ?? 'all'],
    enabled: !!tenant?.id,
    staleTime: STALE_5M,
    queryFn: async () => {
      let q = supabase.from('sembako_stock_out')
        .select('*, sembako_products(product_name, unit), sembako_stock_batches(batch_code), sembako_sales(invoice_number, customer_name)')
        .eq('tenant_id', tenant.id)
        .eq('is_deleted', false)
        .order('created_at', { ascending: false })
      if (productId) q = q.eq('product_id', productId)
      const { data, error } = await q
      if (error) throw normalizeSupabaseError(error)
      return data
    }
  })
}

export const useAdjustBatchStock = () => {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: async ({ batch_id, qty_change }) => {
      const tenant_id = await getTenantId()

      const { data: batch } = await supabase
        .from('sembako_stock_batches')
        .select('qty_sisa, product_id, buy_price')
        .eq('id', batch_id)
        .single()

      if (!batch) throw new Error('Batch tidak ditemukan')

      const newQty = (batch.qty_sisa || 0) + qty_change
      if (newQty < 0) throw new Error('Penyesuaian menyebabkan stok negatif')

      const { error: updErr } = await supabase
        .from('sembako_stock_batches')
        .update({ qty_sisa: newQty })
        .eq('id', batch_id)
      if (updErr) {
        logSupabaseError(updErr, { table: 'sembako_stock_batches', operation: 'update', component: 'useSembakoData', actionName: 'sembako.stock_batch.adjust' })
        throw updErr
      }

      // Sync product current_stock and FIFO active buy_price with active batches
      const { data: activeBatches } = await supabase
        .from('sembako_stock_batches')
        .select('qty_sisa, buy_price, purchase_date, created_at')
        .eq('product_id', batch.product_id)
        .eq('is_deleted', false)
        .gt('qty_sisa', 0)
        .order('purchase_date', { ascending: true })
        .order('created_at', { ascending: true })

      let syncedStock = 0
      if (activeBatches && activeBatches.length > 0) {
        for (const b of activeBatches) {
          syncedStock += Number(b.qty_sisa || 0)
        }
      }
      // Pure FIFO: the active unit cost is the purchase price of the oldest active batch in queue
      const fifoActiveBuyPrice = activeBatches && activeBatches.length > 0
        ? Number(activeBatches[0].buy_price)
        : Number(batch.buy_price || 0)

      const { error: prodSyncErr } = await supabase
        .from('sembako_products')
        .update({ current_stock: Math.round(syncedStock), avg_buy_price: fifoActiveBuyPrice })
        .eq('id', batch.product_id)
      if (prodSyncErr) {
        logError({
          level: 'error', source: 'supabase', component: 'useSembakoData',
          actionName: 'sembako.stock_batch.adjust.product_sync',
          error: prodSyncErr,
          metadata: { table: 'sembako_products', operation: 'update', partial: true, step: 'product_current_stock_sync', batch_id, product_id: batch.product_id },
        })
      }

      // Jika pengurangan stok, catat di sembako_stock_out
      if (qty_change < 0) {
        const { error: outErr } = await supabase
          .from('sembako_stock_out')
          .insert({
            tenant_id,
            product_id: batch.product_id,
            batch_id: batch_id,
            qty_keluar: Math.abs(qty_change),
            buy_price: batch.buy_price || 0,
          })
        if (outErr) {
          logError({
            level: 'error', source: 'supabase', component: 'useSembakoData',
            actionName: 'sembako.stock_batch.adjust.stock_out',
            error: outErr,
            metadata: { table: 'sembako_stock_out', operation: 'insert', partial: true, step: 'stock_out_insert', batch_id },
          })
          throw outErr
        }
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['sembako-batches'] })
      queryClient.invalidateQueries({ queryKey: ['sembako-all-batches'] })
      queryClient.invalidateQueries({ queryKey: ['sembako-products'] })
      queryClient.invalidateQueries({ queryKey: ['sembako-stock-out'] })
      queryClient.invalidateQueries({ queryKey: ['sembako-dashboard-stats'] })
      toast.success('Penyesuaian stok berhasil disimpan')
    },
    onError: (err) => toast.error('Gagal adjust stok: ' + normalizeSupabaseError(err).message),
  })
}

export const useAddStockBatch = () => {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: async ({ product_id, supplier_id, qty_masuk,
      buy_price, purchase_date, expiry_date, notes, batch_code }) => {
      const tenant_id = await getTenantId()
      const qtyInt = Math.round(Number(qty_masuk) || 0)
      const pDate = purchase_date || new Date().toISOString().slice(0, 10)
      const dateStr = pDate.replace(/-/g, '')
      const randStr = Math.random().toString(36).slice(2, 6).toUpperCase()
      const generatedBatchCode = batch_code || `BTC-${dateStr}-${randStr}`

      const cleanSupplierId = (supplier_id && typeof supplier_id === 'string' && supplier_id.trim() !== '' && supplier_id !== 'null' && supplier_id !== 'undefined') ? supplier_id : null

      const payload = {
        tenant_id,
        product_id,
        supplier_id: cleanSupplierId,
        batch_code: generatedBatchCode,
        qty_masuk: qtyInt,
        qty_sisa: qtyInt,
        buy_price,
        total_cost: qtyInt * Number(buy_price || 0),
        purchase_date: pDate, notes,
      }
      if (expiry_date) payload.expiry_date = expiry_date

      let { error } = await supabase.from('sembako_stock_batches')
        .insert(payload)

      if (error && (error.message?.includes('expiry_date') || error.message?.includes('qty_masuk') || error.code === 'PGRST204')) {
        // Safe fallback if Supabase DB schema is missing expiry_date or qty_masuk column
        const safePayload = {
          tenant_id, product_id, supplier_id, buy_price, purchase_date, notes,
          total_cost: qtyInt * Number(buy_price || 0)
        }
        if (!error.message?.includes('qty_masuk')) safePayload.qty_masuk = qtyInt
        if (!error.message?.includes('qty_sisa')) safePayload.qty_sisa = qtyInt
        if (!error.message?.includes('expiry_date') && expiry_date) safePayload.expiry_date = expiry_date

        const retry = await supabase.from('sembako_stock_batches').insert(safePayload)
        error = retry.error
      }

      if (error) {
        logSupabaseError(error, { table: 'sembako_stock_batches', operation: 'insert', component: 'useSembakoData', actionName: 'sembako.stock_batch.create' })
        throw error
      }

      // Automatically recalculate & sync current_stock & FIFO active buy_price on sembako_products
      const { data: batchTotals } = await supabase
        .from('sembako_stock_batches')
        .select('qty_sisa, buy_price, purchase_date, created_at')
        .eq('product_id', product_id)
        .eq('is_deleted', false)
        .gt('qty_sisa', 0)
        .order('purchase_date', { ascending: true })
        .order('created_at', { ascending: true })

      let syncedStock = 0
      if (batchTotals && batchTotals.length > 0) {
        for (const b of batchTotals) {
          syncedStock += Number(b.qty_sisa || 0)
        }
      }
      // Pure FIFO: the active unit cost is the purchase price of the oldest active batch in queue
      const fifoActiveBuyPrice = batchTotals && batchTotals.length > 0
        ? Number(batchTotals[0].buy_price)
        : Number(buy_price || 0)

      await supabase
        .from('sembako_products')
        .update({ current_stock: Math.round(syncedStock), avg_buy_price: fifoActiveBuyPrice })
        .eq('id', product_id)
    },
    onSuccess: (_, vars) => {
      queryClient.invalidateQueries({ queryKey: ['sembako-products'] })
      queryClient.invalidateQueries({ queryKey: ['sembako-batches', vars.product_id] })
      queryClient.invalidateQueries({ queryKey: ['sembako-all-batches'] })
      queryClient.invalidateQueries({ queryKey: ['sembako-suppliers'] })
      if (vars.supplier_id) {
        queryClient.invalidateQueries({ queryKey: ['sembako-supplier-invoices', vars.supplier_id] })
      }
      queryClient.invalidateQueries({ queryKey: ['sembako-dashboard-stats'] })
      toast.success('Stok berhasil ditambahkan')
    },
    onError: (err) => toast.error(normalizeSupabaseError(err).message),
  })
}
