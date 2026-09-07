import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { supabase } from '../../supabase'
import { toast } from 'sonner'
import { useAuth } from '../useAuth'
import { normalizeSupabaseError } from '../../supabaseErrorHandler'
import { logSupabaseError } from '@/lib/logger/supabaseLogger'
import { STALE_5M, sanitizeDBPayload, getTenantId } from './sembakoCommon'
import { recordAuditLog } from '@/lib/hooks/useSembakoAudit'
import { recordInventoryMutation } from './sembakoMutations'

export const useSembakoRawMaterials = () => {
  const { tenant } = useAuth()
  return useQuery({
    queryKey: ['sembako-raw-materials', tenant?.id],
    enabled: !!tenant?.id,
    staleTime: STALE_5M,
    queryFn: async () => {
      try {
        const [rawRes, mutRes] = await Promise.all([
          supabase
            .from('sembako_raw_materials')
            .select('*')
            .eq('tenant_id', tenant.id)
            .eq('is_deleted', false)
            .order('category')
            .order('material_name'),
          supabase
            .from('sembako_inventory_mutations')
            .select('material_id, material_name, unit_cost, quantity, created_at')
            .eq('tenant_id', tenant.id)
            .eq('mutation_type', 'IN')
            .gt('quantity', 0)
            .order('created_at', { ascending: true })
        ])

        if (rawRes.error) {
          logSupabaseError(rawRes.error, { table: 'sembako_raw_materials', operation: 'select', component: 'useSembakoRawMaterials' })
          return []
        }
        if (mutRes.error) {
          logSupabaseError(mutRes.error, { table: 'sembako_inventory_mutations', operation: 'select', component: 'useSembakoRawMaterials' })
        }

        const rawList = rawRes.data || []
        const activeLots = mutRes.data || []

        // Map oldest active lot per material (pure FIFO queue head)
        const fifoActiveCostMap = {}
        const fifoAssetValueMap = {}
        activeLots.forEach(lot => {
          const sisa = Number(lot.quantity || 0)
          const cost = Number(lot.unit_cost || 0)
          const idKey = lot.material_id
          const nameKey = lot.material_name

          if (idKey) fifoAssetValueMap[idKey] = (fifoAssetValueMap[idKey] || 0) + (sisa * cost)
          if (nameKey) fifoAssetValueMap[nameKey] = (fifoAssetValueMap[nameKey] || 0) + (sisa * cost)

          // First lot encountered is oldest active lot (FIFO queue head)
          if (idKey && fifoActiveCostMap[idKey] === undefined && sisa > 0 && cost > 0) {
            fifoActiveCostMap[idKey] = cost
          }
          if (nameKey && fifoActiveCostMap[nameKey] === undefined && sisa > 0 && cost > 0) {
            fifoActiveCostMap[nameKey] = cost
          }
        })

        return rawList.map(m => {
          const fifoCost = fifoActiveCostMap[m.id] ?? fifoActiveCostMap[m.material_name] ?? Number(m.unit_cost || 0)
          const fifoAsset = fifoAssetValueMap[m.id] ?? fifoAssetValueMap[m.material_name] ?? (Number(m.current_stock || 0) * fifoCost)

          return {
            ...m,
            active_fifo_cost: fifoCost,
            unit_cost: fifoCost, // Active FIFO acquisition cost
            fifo_asset_value: fifoAsset,
          }
        })
      } catch (e) {
        console.warn('[useSembakoRawMaterials]', e)
        return []
      }
    }
  })
}

export const useCreateSembakoRawMaterial = () => {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: async (payload) => {
      const tenant_id = await getTenantId()

      // Calculate unit_cost if total_spent and qty provided
      let unitCost = Number(payload.unit_cost) || 0
      const currentStock = Number(payload.current_stock) || 0
      const totalSpent = Number(payload.total_spent) || 0

      if (totalSpent > 0 && currentStock > 0 && (!unitCost || unitCost === 0)) {
        unitCost = Math.round(totalSpent / currentStock)
      } else if (unitCost > 0 && currentStock > 0 && (!totalSpent || totalSpent === 0)) {
        payload.total_spent = unitCost * currentStock
      }

      const cleanPayload = sanitizeDBPayload(
        { ...payload, unit_cost: unitCost, tenant_id },
        'sembako_raw_materials'
      )

      const { data, error } = await supabase
        .from('sembako_raw_materials')
        .insert(cleanPayload)
        .select()
        .single()

      if (error) {
        logSupabaseError(error, {
          table: 'sembako_raw_materials',
          operation: 'insert',
          component: 'useSembakoRawMaterials',
          actionName: 'raw_material.create'
        })
        throw error
      }

      // Record Initial Stock in Audit Logs if stock > 0
      if (currentStock > 0) {
        try {
          await recordAuditLog({
            action_type: 'RESTOCK_BAHAN',
            product_name: payload.material_name,
            old_value: '0',
            new_value: `${currentStock} ${payload.unit || 'pcs'}`,
            notes: JSON.stringify({
              qty_added: currentStock,
              unit: payload.unit || 'pcs',
              unit_cost: unitCost,
              total_spent: payload.total_spent || (unitCost * currentStock),
              supplier_name: payload.supplier_name || 'Supplier Mandiri',
              prev_stock: 0,
              new_stock: currentStock,
              notes: 'Stok terdaftar saat pendaftaran item'
            }),
            tenant_id
          })
        } catch (e) {
          console.warn('[useCreateSembakoRawMaterial] Audit log warning:', e)
        }
      }

      // Auto-register supplier to sembako_suppliers if not already present
      if (payload.supplier_name && payload.supplier_name.trim()) {
        const sName = payload.supplier_name.trim()
        try {
          const { data: existing } = await supabase
            .from('sembako_suppliers')
            .select('id')
            .eq('tenant_id', tenant_id)
            .eq('is_deleted', false)
            .ilike('supplier_name', sName)
            .limit(1)

          if (!existing || existing.length === 0) {
            const { error: insErr } = await supabase.from('sembako_suppliers').insert({
              tenant_id,
              supplier_name: sName,
              notes: `Suplier terdaftar otomatis dari ${payload.category === 'bahan_baku' ? 'Bahan Baku' : 'Kemasan'}`
            })
            if (insErr) console.warn('[useCreateSembakoRawMaterial] Auto-register supplier warning:', insErr.message)
            queryClient.invalidateQueries({ queryKey: ['sembako-suppliers'] })
          }
        } catch (suppErr) {
          console.warn('[useCreateSembakoRawMaterial] Supplier check warning:', suppErr.message)
        }
      }

      return data
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['sembako-raw-materials'] })
      queryClient.invalidateQueries({ queryKey: ['sembako-products'] })
      queryClient.invalidateQueries({ queryKey: ['sembako-dashboard-stats'] })
      queryClient.invalidateQueries({ queryKey: ['sembako-suppliers'] })
      queryClient.invalidateQueries({ queryKey: ['sembako-supplier-invoices'] })
      queryClient.invalidateQueries({ queryKey: ['sembako-audit-logs'] })
      queryClient.invalidateQueries({ queryKey: ['sembako-inventory-mutations'] })
      toast.success('Bahan baku / kemasan berhasil ditambahkan')
    },
    onError: (err) => toast.error(normalizeSupabaseError(err).message),
  })
}

export const useUpdateSembakoRawMaterial = () => {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: async ({ id, ...updates }) => {
      const cleanUpdates = sanitizeDBPayload(updates, 'sembako_raw_materials')
      const { error } = await supabase
        .from('sembako_raw_materials')
        .update(cleanUpdates)
        .eq('id', id)

      if (error) {
        logSupabaseError(error, {
          table: 'sembako_raw_materials',
          operation: 'update',
          component: 'useSembakoRawMaterials',
          actionName: 'raw_material.update'
        })
        throw error
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['sembako-raw-materials'] })
      queryClient.invalidateQueries({ queryKey: ['sembako-products'] })
      queryClient.invalidateQueries({ queryKey: ['sembako-dashboard-stats'] })
      queryClient.invalidateQueries({ queryKey: ['sembako-suppliers'] })
      queryClient.invalidateQueries({ queryKey: ['sembako-supplier-invoices'] })
      queryClient.invalidateQueries({ queryKey: ['sembako-audit-logs'] })
      toast.success('Bahan baku / kemasan berhasil diperbarui')
    },
    onError: (err) => toast.error(normalizeSupabaseError(err).message),
  })
}

export const useDeleteSembakoRawMaterial = () => {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: async (id) => {
      const { error } = await supabase
        .from('sembako_raw_materials')
        .update({ is_deleted: true })
        .eq('id', id)

      if (error) {
        logSupabaseError(error, {
          table: 'sembako_raw_materials',
          operation: 'delete',
          component: 'useSembakoRawMaterials',
          actionName: 'raw_material.delete'
        })
        throw error
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['sembako-raw-materials'] })
      queryClient.invalidateQueries({ queryKey: ['sembako-products'] })
      queryClient.invalidateQueries({ queryKey: ['sembako-dashboard-stats'] })
      queryClient.invalidateQueries({ queryKey: ['sembako-suppliers'] })
      queryClient.invalidateQueries({ queryKey: ['sembako-supplier-invoices'] })
      toast.success('Bahan baku / kemasan dihapus')
    },
    onError: (err) => toast.error(normalizeSupabaseError(err).message),
  })
}

export const useRestockSembakoRawMaterial = () => {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: async ({
      id,
      material_name,
      prevStock = 0,
      prevUnitCost = 0,
      prevTotalSpent = 0,
      addQty = 0,
      buyPricePerUnit = 0,
      batchTotalSpent = 0,
      supplier_name,
      notes
    }) => {
      const nAddQty = Number(addQty) || 0
      const nPrevStock = Number(prevStock) || 0
      const nPrevUnitCost = Number(prevUnitCost) || 0
      const nBuyPrice = Number(buyPricePerUnit) || 0
      const nBatchSpent = Number(batchTotalSpent) > 0 ? Number(batchTotalSpent) : (nAddQty * nBuyPrice)

      const newStock = nPrevStock + nAddQty
      // In FIFO costing: unit_cost holds latest purchase cost as active price benchmark
      const newUnitCost = nBuyPrice > 0 ? nBuyPrice : (nPrevStock > 0 ? nPrevUnitCost : nBuyPrice)
      const newTotalSpent = (Number(prevTotalSpent) || 0) + nBatchSpent

      const updatePayload = {
        current_stock: newStock,
        unit_cost: newUnitCost,
        total_spent: newTotalSpent,
      }

      if (supplier_name && supplier_name.trim()) {
        updatePayload.supplier_name = supplier_name.trim()
      }
      if (notes && notes.trim()) {
        updatePayload.notes = notes.trim()
      }

      const cleanUpdates = sanitizeDBPayload(updatePayload, 'sembako_raw_materials')
      const { data, error } = await supabase
        .from('sembako_raw_materials')
        .update(cleanUpdates)
        .eq('id', id)
        .select()
        .single()

      if (error) {
        logSupabaseError(error, {
          table: 'sembako_raw_materials',
          operation: 'update',
          component: 'useSembakoRawMaterials',
          actionName: 'raw_material.restock'
        })
        throw error
      }

      const tenant_id = await getTenantId()

      // Record incoming FIFO batch lot
      try {
        await recordInventoryMutation({
          tenant_id,
          material_id: id,
          material_name: material_name || data?.material_name || '-',
          material_category: data?.category || null,
          mutation_type: 'IN',
          action_type: 'RESTOCK',
          quantity: nAddQty,
          unit: data?.unit || 'pcs',
          unit_cost: nBuyPrice,
          total_cost: nBatchSpent,
          prev_stock: nPrevStock,
          new_stock: newStock,
          party_name: supplier_name?.trim() || null,
          notes: notes?.trim() || 'Restok Bahan Baku / Kemasan (Lot Masuk FIFO)',
          created_at: new Date().toISOString()
        })
      } catch (mutErr) {
        console.warn('[useRestockSembakoRawMaterial] Mutation log warning:', mutErr)
      }

      // Record audit log
      try {
        await recordAuditLog({
          tenant_id,
          entity_type: 'raw_material',
          entity_id: id,
          action: 'RESTOCK_FIFO',
          actor_name: 'Owner',
          details: {
            material_name: material_name || data?.material_name,
            addQty: nAddQty,
            buyPricePerUnit: nBuyPrice,
            batchTotalSpent: nBatchSpent,
            prevStock: nPrevStock,
            newStock,
            unitCost: nBuyPrice,
            supplier_name
          }
        })
      } catch (auditErr) {
        console.warn('[useRestockSembakoRawMaterial] Audit log warning:', auditErr.message)
      }

      // Auto-register supplier to sembako_suppliers if not already present
      if (supplier_name && supplier_name.trim()) {
        const sName = supplier_name.trim()
        try {
          const { data: existing } = await supabase
            .from('sembako_suppliers')
            .select('id')
            .eq('tenant_id', tenant_id)
            .eq('is_deleted', false)
            .ilike('supplier_name', sName)
            .limit(1)

          if (!existing || existing.length === 0) {
            const { error: insErr } = await supabase.from('sembako_suppliers').insert({
              tenant_id,
              supplier_name: sName,
              notes: 'Suplier terdaftar otomatis dari Riwayat Restok Bahan Baku'
            })
            if (insErr) console.warn('[useRestockSembakoRawMaterial] Auto-register supplier warning:', insErr.message)
            queryClient.invalidateQueries({ queryKey: ['sembako-suppliers'] })
          }
        } catch (suppErr) {
          console.warn('[useRestockSembakoRawMaterial] Supplier check warning:', suppErr.message)
        }
      }

      return data || { material_name, addQty: nAddQty, newStock, newUnitCost }
    },
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: ['sembako-raw-materials'] })
      queryClient.invalidateQueries({ queryKey: ['sembako-products'] })
      queryClient.invalidateQueries({ queryKey: ['sembako-dashboard-stats'] })
      queryClient.invalidateQueries({ queryKey: ['sembako-suppliers'] })
      queryClient.invalidateQueries({ queryKey: ['sembako-supplier-invoices'] })
      queryClient.invalidateQueries({ queryKey: ['sembako-audit-logs'] })
      queryClient.invalidateQueries({ queryKey: ['sembako-inventory-mutations'] })
      toast.success(`Stok ${data?.material_name || 'bahan'} berhasil ditambah!`)
    },
    onError: (err) => toast.error(normalizeSupabaseError(err).message),
  })
}

export const useResetAllSembakoStocks = () => {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: async () => {
      const tenant_id = await getTenantId()

      // 1. Reset all raw materials current_stock & total_spent to 0
      const { data: rawList, error: errFetchRaw } = await supabase
        .from('sembako_raw_materials')
        .select('id')
        .eq('tenant_id', tenant_id)
        .eq('is_deleted', false)

      if (errFetchRaw) {
        console.error('[useResetAllSembakoStocks] Gagal fetch raw materials:', errFetchRaw.message)
        throw normalizeSupabaseError(errFetchRaw)
      }

      if (rawList && rawList.length > 0) {
        const rawIds = rawList.map(r => r.id)
        const { error: errRaw } = await supabase
          .from('sembako_raw_materials')
          .update({ current_stock: 0, total_spent: 0 })
          .in('id', rawIds)
        if (errRaw) throw normalizeSupabaseError(errRaw)
      }

      // 2. Reset all products current_stock & avg_buy_price to 0
      const { data: prodList, error: errFetchProd } = await supabase
        .from('sembako_products')
        .select('id')
        .eq('tenant_id', tenant_id)
        .eq('is_deleted', false)

      if (errFetchProd) {
        console.error('[useResetAllSembakoStocks] Gagal fetch products:', errFetchProd.message)
        throw normalizeSupabaseError(errFetchProd)
      }

      if (prodList && prodList.length > 0) {
        const prodIds = prodList.map(p => p.id)
        const { error: errProd } = await supabase
          .from('sembako_products')
          .update({ current_stock: 0, avg_buy_price: 0 })
          .in('id', prodIds)
        if (errProd) throw normalizeSupabaseError(errProd)
      }

      // 3. Clear all finished batches
      const { error: errBatches } = await supabase
        .from('sembako_stock_batches')
        .delete()
        .eq('tenant_id', tenant_id)

      if (errBatches) {
        console.error('[useResetAllSembakoStocks] Gagal hapus batches:', errBatches.message)
        throw normalizeSupabaseError(errBatches)
      }

      // 4. Clear audit logs for RESTOCK_BAHAN
      const { error: errAudit } = await supabase
        .from('sembako_audit_logs')
        .delete()
        .eq('tenant_id', tenant_id)

      if (errAudit) {
        console.error('[useResetAllSembakoStocks] Gagal hapus audit logs:', errAudit.message)
        throw normalizeSupabaseError(errAudit)
      }

      // 5. Clear inventory mutations
      try {
        const { error: errMut } = await supabase
          .from('sembako_inventory_mutations')
          .delete()
          .eq('tenant_id', tenant_id)
        if (errMut) console.warn('[useResetAllSembakoStocks] Clear mutations warning:', errMut.message)
      } catch (mutErr) {
        console.warn('[useResetAllSembakoStocks] Mutation delete optional fallback:', mutErr.message)
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['sembako-raw-materials'] })
      queryClient.invalidateQueries({ queryKey: ['sembako-products'] })
      queryClient.invalidateQueries({ queryKey: ['sembako-all-batches'] })
      queryClient.invalidateQueries({ queryKey: ['sembako-dashboard-stats'] })
      queryClient.invalidateQueries({ queryKey: ['sembako-suppliers'] })
      queryClient.invalidateQueries({ queryKey: ['sembako-supplier-invoices'] })
      queryClient.invalidateQueries({ queryKey: ['sembako-audit-logs'] })
      queryClient.invalidateQueries({ queryKey: ['sembako-inventory-mutations'] })
      toast.success('Semua stok bahan & produk berhasil di-reset ke 0!')
    },
    onError: (err) => toast.error('Gagal reset stok: ' + normalizeSupabaseError(err).message),
  })
}

