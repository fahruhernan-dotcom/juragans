import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { supabase } from '../../supabase'
import { useAuth } from '../useAuth'
import { STALE_5M, getTenantId, sanitizeDBPayload } from './sembakoCommon'

/**
 * Record a raw material or packaging mutation entry into sembako_inventory_mutations
 */
export async function recordInventoryMutation(mutationPayload) {
  try {
    const tenant_id = mutationPayload.tenant_id || (await getTenantId())
    if (!tenant_id) return null

    const mutationType = mutationPayload.mutation_type || 'IN' // 'IN' | 'OUT' | 'ADJUST'
    const qty = Number(mutationPayload.quantity) || 0
    const qtySisa = mutationPayload.qty_sisa !== undefined ? Number(mutationPayload.qty_sisa) : (mutationType === 'IN' ? qty : 0)

    const payload = {
      tenant_id,
      material_id: mutationPayload.material_id || null,
      material_name: mutationPayload.material_name || '-',
      material_category: mutationPayload.material_category || null,
      mutation_type: mutationType,
      action_type: mutationPayload.action_type || 'RESTOCK', // 'INITIAL' | 'RESTOCK' | 'SALE' | 'OPNAME' | 'RETURN'
      quantity: qty,
      qty_sisa: qtySisa,
      unit: mutationPayload.unit || 'pcs',
      unit_cost: Number(mutationPayload.unit_cost) || 0,
      total_cost: Number(mutationPayload.total_cost) || (qty * Number(mutationPayload.unit_cost || 0)),
      prev_stock: Number(mutationPayload.prev_stock) || 0,
      new_stock: Number(mutationPayload.new_stock) || 0,
      ref_type: mutationPayload.ref_type || null,
      ref_id: mutationPayload.ref_id ? String(mutationPayload.ref_id) : null,
      ref_number: mutationPayload.ref_number || null,
      party_name: mutationPayload.party_name || null,
      notes: mutationPayload.notes || '',
      created_by: mutationPayload.created_by || 'Sistem',
      created_at: mutationPayload.created_at || new Date().toISOString(),
    }

    const cleanPayload = sanitizeDBPayload(payload, 'sembako_inventory_mutations')
    const { data, error } = await supabase
      .from('sembako_inventory_mutations')
      .insert(cleanPayload)
      .select()
      .single()

    if (error) {
      console.warn('[recordInventoryMutation] Supabase insert warning (table might need migration):', error.message)
      return null
    }
    return data
  } catch (err) {
    console.warn('[recordInventoryMutation] Error:', err)
    return null
  }
}

/**
 * Deduct Raw Material / Packaging using First-In, First-Out (FIFO) logic
 * Consumes the oldest IN mutation batches first and records an OUT mutation.
 * 
 * @param {object} params
 * @param {string} params.tenant_id
 * @param {string} params.material_id
 * @param {string} params.material_name
 * @param {string} params.material_category
 * @param {number} params.qtyToDeduct
 * @param {string} params.unit
 * @param {number} params.fallbackUnitCost
 * @param {string} params.ref_type
 * @param {string} params.ref_id
 * @param {string} params.ref_number
 * @param {string} params.party_name
 * @param {string} params.notes
 * @returns {Promise<{ totalCost: number, unitCostAvg: number, consumedBatches: Array }>}
 */
export async function deductRawMaterialFifo({
  tenant_id,
  material_id,
  material_name,
  material_category,
  qtyToDeduct = 0,
  unit = 'pcs',
  fallbackUnitCost = 0,
  ref_type = 'SALE',
  ref_id = null,
  ref_number = null,
  party_name = null,
  notes = ''
}) {
  const needed = Number(qtyToDeduct) || 0
  if (needed <= 0 || !tenant_id) {
    return { totalCost: 0, unitCostAvg: 0, consumedBatches: [] }
  }

  try {
    // 1. Query all active IN mutations for this material ordered by created_at ASC (Oldest First)
    let query = supabase
      .from('sembako_inventory_mutations')
      .select('*')
      .eq('tenant_id', tenant_id)
      .eq('mutation_type', 'IN')

    if (material_id) {
      query = query.eq('material_id', material_id)
    } else if (material_name) {
      query = query.eq('material_name', material_name)
    }

    const { data: batches, error } = await query.order('created_at', { ascending: true })
    if (error) {
      console.warn('[deductRawMaterialFifo] Batch query error:', error.message)
    }

    let remainingNeeded = needed
    let totalCostAccum = 0
    const consumedBatches = []

    // 2. Iterate through available FIFO batches
    if (batches && batches.length > 0) {
      for (const batch of batches) {
        if (remainingNeeded <= 0) break

        const batchSisa = batch.qty_sisa !== undefined && batch.qty_sisa !== null 
          ? Number(batch.qty_sisa) 
          : Number(batch.quantity || 0)

        if (batchSisa <= 0) continue

        const deductFromThis = Math.min(batchSisa, remainingNeeded)
        const batchCost = Number(batch.unit_cost) || fallbackUnitCost
        const costForThis = deductFromThis * batchCost

        totalCostAccum += costForThis
        remainingNeeded -= deductFromThis

        const newSisa = Math.max(0, batchSisa - deductFromThis)
        consumedBatches.push({
          batch_id: batch.id,
          deducted: deductFromThis,
          unit_cost: batchCost,
          total_cost: costForThis,
          remaining_in_batch: newSisa,
          batch_created_at: batch.created_at
        })

        // Update batch remaining in DB
        try {
          await supabase
            .from('sembako_inventory_mutations')
            .update({ qty_sisa: newSisa })
            .eq('id', batch.id)
        } catch (e) {
          console.warn('[deductRawMaterialFifo] Update batch sisa exception:', e)
        }
      }
    }

    // 3. If remainingNeeded > 0 (e.g. stock exceeded or no historical batch recorded), use fallbackCost
    if (remainingNeeded > 0) {
      const fallbackTotal = remainingNeeded * fallbackUnitCost
      totalCostAccum += fallbackTotal
      consumedBatches.push({
        batch_id: 'FALLBACK_UNTRACKED',
        deducted: remainingNeeded,
        unit_cost: fallbackUnitCost,
        total_cost: fallbackTotal,
        remaining_in_batch: 0,
        batch_created_at: new Date().toISOString()
      })
    }

    const unitCostAvg = needed > 0 ? Math.round(totalCostAccum / needed) : fallbackUnitCost

    // 4. Record OUT mutation for full auditability
    await recordInventoryMutation({
      tenant_id,
      material_id,
      material_name,
      material_category,
      mutation_type: 'OUT',
      action_type: 'SALE',
      quantity: needed,
      qty_sisa: 0,
      unit,
      unit_cost: unitCostAvg,
      total_cost: totalCostAccum,
      ref_type,
      ref_id,
      ref_number,
      party_name,
      notes: notes || `Penggunaan FIFO: ${consumedBatches.length} lot batch terpangkas`,
      created_at: new Date().toISOString()
    })

    return {
      totalCost: totalCostAccum,
      unitCostAvg,
      consumedBatches
    }
  } catch (err) {
    console.warn('[deductRawMaterialFifo] Execution error:', err)
    return {
      totalCost: needed * fallbackUnitCost,
      unitCostAvg: fallbackUnitCost,
      consumedBatches: []
    }
  }
}

/**
 * Get Oldest Active FIFO Cost for a given raw material or packaging
 */
export async function getOldestActiveFifoCost(tenant_id, materialId, materialName, fallbackCost = 0) {
  if (!tenant_id) return fallbackCost
  try {
    let query = supabase
      .from('sembako_inventory_mutations')
      .select('unit_cost, qty_sisa, quantity, created_at')
      .eq('tenant_id', tenant_id)
      .eq('mutation_type', 'IN')

    if (materialId) {
      query = query.eq('material_id', materialId)
    } else if (materialName) {
      query = query.eq('material_name', materialName)
    }

    const { data: batches } = await query.order('created_at', { ascending: true })
    if (batches && batches.length > 0) {
      const activeBatch = batches.find(b => {
        const sisa = b.qty_sisa !== undefined && b.qty_sisa !== null ? Number(b.qty_sisa) : Number(b.quantity)
        return sisa > 0
      })
      if (activeBatch && Number(activeBatch.unit_cost) > 0) {
        return Number(activeBatch.unit_cost)
      }
    }
    return fallbackCost
  } catch (e) {
    return fallbackCost
  }
}

/**
 * Hook to retrieve mutations for a specific raw material or packaging
 */
export const useSembakoMaterialMutations = (materialId, materialName) => {
  const { tenant } = useAuth()
  return useQuery({
    queryKey: ['sembako-inventory-mutations', tenant?.id, materialId, materialName],
    enabled: !!tenant?.id && (!!materialId || !!materialName),
    staleTime: STALE_5M,
    queryFn: async () => {
      try {
        let query = supabase
          .from('sembako_inventory_mutations')
          .select('*')
          .eq('tenant_id', tenant.id)

        if (materialId) {
          query = query.eq('material_id', materialId)
        } else if (materialName) {
          query = query.eq('material_name', materialName)
        }

        const { data, error } = await query.order('created_at', { ascending: false })
        if (error) {
          console.warn('[useSembakoMaterialMutations] Table might not exist yet:', error.message)
          return []
        }
        return data || []
      } catch (e) {
        console.warn('[useSembakoMaterialMutations] Query exception:', e)
        return []
      }
    }
  })
}

/**
 * Hook to retrieve active FIFO batches (IN with qty_sisa > 0)
 */
export const useSembakoActiveFifoBatches = (materialId, materialName) => {
  const { tenant } = useAuth()
  return useQuery({
    queryKey: ['sembako-active-fifo-batches', tenant?.id, materialId, materialName],
    enabled: !!tenant?.id && (!!materialId || !!materialName),
    staleTime: STALE_5M,
    queryFn: async () => {
      try {
        let query = supabase
          .from('sembako_inventory_mutations')
          .select('*')
          .eq('tenant_id', tenant.id)
          .eq('mutation_type', 'IN')

        if (materialId) {
          query = query.eq('material_id', materialId)
        } else if (materialName) {
          query = query.eq('material_name', materialName)
        }

        const { data, error } = await query.order('created_at', { ascending: true })
        if (error) return []
        return (data || []).filter(b => {
          const sisa = b.qty_sisa !== undefined && b.qty_sisa !== null ? Number(b.qty_sisa) : Number(b.quantity)
          return sisa > 0
        })
      } catch (e) {
        return []
      }
    }
  })
}
