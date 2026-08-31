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

    const payload = {
      tenant_id,
      material_id: mutationPayload.material_id || null,
      material_name: mutationPayload.material_name || '-',
      material_category: mutationPayload.material_category || null,
      mutation_type: mutationPayload.mutation_type || 'IN', // 'IN' | 'OUT' | 'ADJUST'
      action_type: mutationPayload.action_type || 'RESTOCK', // 'INITIAL' | 'RESTOCK' | 'SALE' | 'OPNAME' | 'RETURN'
      quantity: Number(mutationPayload.quantity) || 0,
      unit: mutationPayload.unit || 'pcs',
      unit_cost: Number(mutationPayload.unit_cost) || 0,
      total_cost: Number(mutationPayload.total_cost) || (Number(mutationPayload.quantity || 0) * Number(mutationPayload.unit_cost || 0)),
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
