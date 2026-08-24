import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { supabase } from '../../supabase'
import { toast } from 'sonner'
import { useAuth } from '../useAuth'
import { normalizeSupabaseError } from '../../supabaseErrorHandler'
import { logSupabaseError } from '@/lib/logger/supabaseLogger'
import { STALE_5M, sanitizeDBPayload, getTenantId } from './sembakoCommon'

export const useSembakoRawMaterials = () => {
  const { tenant } = useAuth()
  return useQuery({
    queryKey: ['sembako-raw-materials', tenant?.id],
    enabled: !!tenant?.id,
    staleTime: STALE_5M,
    queryFn: async () => {
      try {
        const { data, error } = await supabase
          .from('sembako_raw_materials')
          .select('*')
          .eq('tenant_id', tenant.id)
          .eq('is_deleted', false)
          .order('category')
          .order('material_name')

        if (error) {
          console.warn('[useSembakoRawMaterials]', error.message)
          return []
        }
        return data || []
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
      return data
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['sembako-raw-materials'] })
      toast.success('Bahan baku / kemasan berhasil ditambahkan')
    },
    onError: (err) => toast.error(normalizeSupabaseError(err).message),
  })
}

export const useUpdateSembakoRawMaterial = () => {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: async ({ id, ...updates }) => {
      // Re-calculate unit_cost if values changed
      if (updates.total_spent !== undefined && updates.current_stock !== undefined && Number(updates.current_stock) > 0) {
        updates.unit_cost = Math.round(Number(updates.total_spent) / Number(updates.current_stock))
      }
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
      toast.success('Bahan baku / kemasan dihapus')
    },
    onError: (err) => toast.error(normalizeSupabaseError(err).message),
  })
}
