import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { supabase } from '../../supabase'
import { toast } from 'sonner'
import { useAuth } from '../useAuth'
import { normalizeSupabaseError } from '../../supabaseErrorHandler'
import { logSupabaseError } from '@/lib/logger/supabaseLogger'
import { STALE_5M, sanitizeDBPayload, getTenantId } from './sembakoCommon'

export const useSembakoDeliveries = () => {
  const { tenant } = useAuth()
  return useQuery({
    queryKey: ['sembako-deliveries', tenant?.id],
    enabled: !!tenant?.id,
    staleTime: STALE_5M,
    queryFn: async () => {
      try {
        const { data, error } = await supabase.from('sembako_deliveries')
          .select(`*, sembako_sales(id, invoice_number, total_amount, payment_status, transaction_date, customer_name, sembako_customers(id, customer_name, phone, address), sembako_sale_items(id, product_name, quantity, unit))`)
          .eq('tenant_id', tenant.id)
          .eq('is_deleted', false)
          .order('created_at', { ascending: false })
        if (error) { console.warn('[useSembakoDeliveries]', error.message); return [] }
        return data || []
      } catch (e) { console.warn('[useSembakoDeliveries]', e); return [] }
    }
  })
}

export const useSembakoSalesPendingDelivery = () => {
  const { tenant } = useAuth()
  return useQuery({
    queryKey: ['sembako-sales-pending-delivery', tenant?.id],
    enabled: !!tenant?.id,
    staleTime: STALE_5M,
    queryFn: async () => {
      try {
        const { data, error } = await supabase.from('sembako_sales')
          .select(`id, invoice_number, transaction_date, total_amount, payment_status, customer_name, sembako_customers(id, customer_name, address, phone), sembako_sale_items(id, product_name, quantity, unit), sembako_deliveries(id, status, is_deleted)`)
          .eq('tenant_id', tenant.id)
          .eq('is_deleted', false)
          .order('transaction_date', { ascending: false })
        if (error || !data) return []
        return (data || []).filter(sale => {
          const activeDeliveries = (sale.sembako_deliveries || []).filter(d => !d.is_deleted)
          return activeDeliveries.length === 0
        })
      } catch {
        return []
      }
    }
  })
}

export const useCreateSembakoDelivery = () => {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: async (payload) => {
      const tenant_id = await getTenantId()
      const cleanPayload = sanitizeDBPayload({ ...payload, tenant_id }, 'sembako_deliveries')
      const { error } = await supabase.from('sembako_deliveries')
        .insert(cleanPayload)
      if (error) {
        logSupabaseError(error, { table: 'sembako_deliveries', operation: 'insert', component: 'useSembakoData', actionName: 'sembako.delivery.create' })
        throw error
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['sembako-deliveries'] })
      queryClient.invalidateQueries({ queryKey: ['sembako-sales-pending-delivery'] })
      queryClient.invalidateQueries({ queryKey: ['sembako-sales'] })
      toast.success('Trip berhasil dicatat')
    },
    onError: (err) => toast.error(normalizeSupabaseError(err).message),
  })
}

export const useCompleteSembakoDelivery = () => {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: async (deliveryId) => {
      const { error } = await supabase
        .from('sembako_deliveries')
        .update({ status: 'delivered', completed_at: new Date().toISOString() })
        .eq('id', deliveryId)
      if (error) {
        logSupabaseError(error, { table: 'sembako_deliveries', operation: 'update', component: 'useSembakoData', actionName: 'sembako.delivery.complete' })
        throw error
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['sembako-deliveries'] })
      queryClient.invalidateQueries({ queryKey: ['sembako-sales-pending-delivery'] })
      queryClient.invalidateQueries({ queryKey: ['sembako-sales'] })
      toast.success('Pengiriman selesai')
    },
    onError: (err) => toast.error(normalizeSupabaseError(err).message),
  })
}

export const useCompleteDeliveryWithCost = () => {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: async ({ saleId, deliveryId, extraCost = 0, costNotes = '', driverName = 'Langsung' }) => {
      const now = new Date().toISOString()
      const numericExtraCost = Math.max(0, Number(extraCost) || 0)

      // 1. Update or create delivery record
      if (deliveryId) {
        const { error: delErr } = await supabase
          .from('sembako_deliveries')
          .update({
            status: 'delivered',
            completed_at: now,
            notes: costNotes ? `Biaya Tambahan: ${costNotes}` : 'Pengiriman selesai',
          })
          .eq('id', deliveryId)
        if (delErr) {
          logSupabaseError(delErr, { table: 'sembako_deliveries', operation: 'update', component: 'useSembakoData', actionName: 'sembako.delivery.completeWithCost' })
          throw delErr
        }
      } else if (saleId) {
        const tenant_id = await getTenantId()
        const cleanPayload = sanitizeDBPayload({
          sale_id: saleId,
          driver_name: driverName || 'Langsung',
          vehicle_type: 'Langsung',
          vehicle_plate: '-',
          delivery_date: now.slice(0, 10),
          status: 'delivered',
          completed_at: now,
          notes: costNotes ? `Biaya Tambahan: ${costNotes}` : 'Pengiriman selesai',
          tenant_id,
        }, 'sembako_deliveries')
        const { error: insErr } = await supabase
          .from('sembako_deliveries')
          .insert(cleanPayload)
        if (insErr) {
          logSupabaseError(insErr, { table: 'sembako_deliveries', operation: 'insert', component: 'useSembakoData', actionName: 'sembako.delivery.completeWithCost' })
          throw insErr
        }
      }

      // 2. If there are extra operational costs, update the sale record
      if (saleId && numericExtraCost > 0) {
        const { data: currentSale, error: saleFetchErr } = await supabase
          .from('sembako_sales')
          .select('other_cost, notes, total_amount, total_cogs, delivery_cost')
          .eq('id', saleId)
          .single()

        if (!saleFetchErr && currentSale) {
          const currentOther = Number(currentSale.other_cost) || 0
          const updatedOtherCost = currentOther + numericExtraCost
          const currentNotes = currentSale.notes || ''
          const costInfo = `[Biaya Operasional: Rp ${numericExtraCost.toLocaleString('id-ID')}${costNotes ? ` (${costNotes})` : ''}]`
          const updatedNotes = currentNotes ? `${currentNotes}\n${costInfo}` : costInfo

          const totalAmount = Number(currentSale.total_amount) || 0
          const totalCogs = Number(currentSale.total_cogs) || 0
          const deliveryCost = Number(currentSale.delivery_cost) || 0
          const updatedNetProfit = Math.max(0, totalAmount - totalCogs - deliveryCost - updatedOtherCost)

          const { error: updateSaleErr } = await supabase
            .from('sembako_sales')
            .update({
              other_cost: updatedOtherCost,
              notes: updatedNotes,
              net_profit: updatedNetProfit,
            })
            .eq('id', saleId)

          if (updateSaleErr) {
            logSupabaseError(updateSaleErr, { table: 'sembako_sales', operation: 'update', component: 'useSembakoData', actionName: 'sembako.delivery.updateSaleCost' })
          }
        }
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['sembako-deliveries'] })
      queryClient.invalidateQueries({ queryKey: ['sembako-sales-pending-delivery'] })
      queryClient.invalidateQueries({ queryKey: ['sembako-sales'] })
      queryClient.invalidateQueries({ queryKey: ['sembako-reports'] })
      queryClient.invalidateQueries({ queryKey: ['sembako-cashflow'] })
      toast.success('Pesanan berhasil ditandai TERKIRIM')
    },
    onError: (err) => toast.error(normalizeSupabaseError(err).message),
  })
}

export const useStartSembakoDelivery = () => {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: async (deliveryId) => {
      const { error } = await supabase
        .from('sembako_deliveries')
        .update({ status: 'on_route', departed_at: new Date().toISOString() })
        .eq('id', deliveryId)
      if (error) {
        logSupabaseError(error, { table: 'sembako_deliveries', operation: 'update', component: 'useSembakoData', actionName: 'sembako.delivery.start' })
        throw error
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['sembako-deliveries'] })
      queryClient.invalidateQueries({ queryKey: ['sembako-sales-pending-delivery'] })
      queryClient.invalidateQueries({ queryKey: ['sembako-sales'] })
      toast.success('Pengiriman berangkat')
    },
    onError: (err) => toast.error(normalizeSupabaseError(err).message),
  })
}

export const useArriveSembakoDelivery = () => {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: async (deliveryId) => {
      const { error } = await supabase
        .from('sembako_deliveries')
        .update({ status: 'arrived', arrived_at: new Date().toISOString() })
        .eq('id', deliveryId)
      if (error) {
        logSupabaseError(error, { table: 'sembako_deliveries', operation: 'update', component: 'useSembakoData', actionName: 'sembako.delivery.arrive' })
        throw error
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['sembako-deliveries'] })
      toast.success('Kedatangan dicatat')
    },
    onError: (err) => toast.error(normalizeSupabaseError(err).message),
  })
}

export const useUpdateSembakoDeliveryTimestamps = () => {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: async ({ id, departed_at, arrived_at, completed_at }) => {
      const updates = {}
      if (departed_at !== undefined) updates.departed_at = departed_at
      if (arrived_at !== undefined) updates.arrived_at = arrived_at
      if (completed_at !== undefined) updates.completed_at = completed_at
      const { error } = await supabase
        .from('sembako_deliveries')
        .update(updates)
        .eq('id', id)
      if (error) {
        logSupabaseError(error, { table: 'sembako_deliveries', operation: 'update', component: 'useSembakoData', actionName: 'sembako.delivery.update_timestamps' })
        throw error
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['sembako-deliveries'] })
      toast.success('Waktu pengiriman berhasil diperbarui')
    },
    onError: (err) => toast.error(normalizeSupabaseError(err).message),
  })
}
