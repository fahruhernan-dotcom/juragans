import { useQueryClient } from '@tanstack/react-query'
import { format } from 'date-fns'
import { supabase } from '../supabase'
import { safeNum } from '../format'
import { useAuth } from './useAuth'
import { getXBasePath } from '../businessModel'
import { logSupabaseError } from '@/lib/logger/supabaseLogger'

export function useUpdateDelivery() {
  const queryClient = useQueryClient()
  const { tenant, profile } = useAuth()
  
  const updateTiba = async (payload) => {
    const {
      deliveryId,
      arrivedCount,
      arrivedWeight,
      notes,
      loadTime,
      driverId,
      driverName,
      driverPhone,
      vehicleId,
      vehiclePlate,
      vehicleType,
      departureTime,
      driverWage,
      status
    } = payload

    // 1. Fetch current delivery data for calculations
    const { data: delivery, error: fetchError } = await supabase
      .from('deliveries')
      .select('initial_count, initial_weight_kg, sale_id')
      .eq('id', deliveryId)
      .single()

    if (fetchError) {
      logSupabaseError(fetchError, {
        table: 'deliveries',
        operation: 'select',
        component: 'useUpdateDelivery',
        actionName: 'broker.delivery.fetch',
      })
      throw fetchError
    }
    
    const mortality = safeNum(delivery.initial_count) - safeNum(arrivedCount)
    const shrinkage = safeNum(delivery.initial_weight_kg) - safeNum(arrivedWeight)
    
    // Construct dynamic update object to avoid wiping out existing data
    const updateData = {
      notes:             notes || null
    }

    if (status) {
      updateData.status = status
    } else {
      updateData.status = 'arrived'
    }

    // Arrival Specific Logic
    if (updateData.status === 'arrived') {
       updateData.arrived_count =     safeNum(arrivedCount)
       updateData.arrived_weight_kg = safeNum(arrivedWeight)
       updateData.mortality_count =   mortality
       updateData.arrival_time =      format(new Date(), "yyyy-MM-dd'T'HH:mm:ssxxx")
    }

    // Only update these if they were provided in payload
    if (loadTime !== undefined)      updateData.load_time = loadTime
    if (departureTime !== undefined) updateData.departure_time = departureTime
    if (driverId !== undefined)     updateData.driver_id = driverId
    if (driverName !== undefined)   updateData.driver_name = driverName
    if (driverPhone !== undefined)  updateData.driver_phone = driverPhone
    if (vehicleId !== undefined)    updateData.vehicle_id = vehicleId
    if (vehiclePlate !== undefined) updateData.vehicle_plate = vehiclePlate
    if (vehicleType !== undefined)  updateData.vehicle_type = vehicleType
    if (driverWage !== undefined)   updateData.driver_wage = driverWage
    
    // 2. Update delivery status
    console.log('[useUpdateDelivery] Sending Update to Supabase:', updateData)
    const { data: updateRes, error: updateError } = await supabase
      .from('deliveries')
      .update(updateData)
      .eq('id', deliveryId)
      .select('status, arrival_time')
    
    if (updateError) {
      console.error('[useUpdateDelivery] Supabase Update Error:', updateError)
      logSupabaseError(updateError, {
        table: 'deliveries',
        operation: 'update',
        component: 'useUpdateDelivery',
        actionName: 'broker.delivery.update',
      })
      throw updateError
    }
    console.log('[useUpdateDelivery] Supabase Update Success:', updateRes?.[0])
    
    // 3. Update Sales Revenue based on TOTAL Arrived Weight (Sum of all deliveries for this sale)
    const { data: saleData } = await supabase
      .from('sales')
      .select('price_per_kg, tenant_id, rpa_clients(rpa_name)')
      .eq('id', delivery.sale_id)
      .single()

    if (saleData) {
      // Fetch all deliveries for this sale to get the true total revenue
      const { data: allDeliveries } = await supabase
        .from('deliveries')
        .select('arrived_weight_kg, initial_weight_kg, status')
        .eq('sale_id', delivery.sale_id)
        .eq('is_deleted', false)

      const totalArrivedWeight = (allDeliveries || []).reduce((sum, d) => {
        // If it's this delivery being updated, use the new weight from payload
        if (d.id === deliveryId) return sum + safeNum(arrivedWeight)
        
        // For others, use arrived_weight if completed/arrived, else use initial_weight as fallback for "projected" revenue
        // (Though usually total_revenue is only finalized on arrival)
        const weight = (d.status === 'arrived' || d.status === 'completed') 
          ? safeNum(d.arrived_weight_kg) 
          : safeNum(d.initial_weight_kg)
        return sum + weight
      }, 0)

      const newTotalRevenue = Math.round(totalArrivedWeight * safeNum(saleData.price_per_kg))
      
      const { error: saleUpdateError } = await supabase
        .from('sales')
        .update({ total_revenue: newTotalRevenue })
        .eq('id', delivery.sale_id)

      if (saleUpdateError) {
        console.error('Error updating sale revenue:', saleUpdateError)
        // Non-fatal: delivery already updated, sale revenue sync failed.
        // Flag as partial commit so superadmin can reconcile accounting.
        logSupabaseError(saleUpdateError, {
          table: 'sales',
          operation: 'update',
          component: 'useUpdateDelivery',
          actionName: 'broker.sale.delivery_sync',
        })
      } else {
        console.log('✅ Sales total_revenue updated (Cumulative):', newTotalRevenue)
      }
    }

    // 4. Auto-create loss report if there is mortality or shrinkage
    const lossReports = []
    const pricePerKg = saleData?.price_per_kg ?? 0
    const tenantId = saleData?.tenant_id ?? tenant.id

    if (mortality > 0) {
      // Standardized weight per chicken (1.85kg) for mortality financial loss
      const estWeightLoss = mortality * 1.85
      const financialLoss = 0 

      lossReports.push({
        tenant_id:      tenantId,
        delivery_id:    deliveryId,
        sale_id:        delivery.sale_id,
        loss_type:      'mortality',
        chicken_count:  mortality,
        weight_loss_kg: estWeightLoss,
        price_per_kg:   pricePerKg,
        financial_loss: financialLoss,
        description:    `${mortality} ekor mati dalam perjalanan`,
        report_date:    format(new Date(), 'yyyy-MM-dd')
      })
    }

    if (shrinkage > 0) {
      const financialLoss = Math.round(shrinkage * safeNum(pricePerKg))
      
      lossReports.push({
        tenant_id:      tenantId,
        delivery_id:    deliveryId,
        sale_id:        delivery.sale_id,
        loss_type:      'shrinkage',
        chicken_count:  0,
        weight_loss_kg: shrinkage,
        price_per_kg:   pricePerKg,
        financial_loss: financialLoss,
        description:    `Penyusutan berat ${shrinkage.toFixed(2)} kg`,
        report_date:    format(new Date(), 'yyyy-MM-dd')
      })
    }

    if (lossReports.length > 0) {
      const { error: lossDelErr } = await supabase.from('loss_reports').delete().eq('delivery_id', deliveryId)
      if (lossDelErr) {
        // Non-fatal: old loss reports for this delivery may still exist alongside new ones.
        logSupabaseError(lossDelErr, {
          table: 'loss_reports',
          operation: 'delete',
          component: 'useUpdateDelivery',
          actionName: 'broker.loss_report.cleanup',
        })
      }
      const { error: lossError } = await supabase.from('loss_reports').insert(lossReports)
      if (lossError) {
        console.error('Error inserting loss reports:', lossError)
        logSupabaseError(lossError, {
          table: 'loss_reports',
          operation: 'insert',
          component: 'useUpdateDelivery',
          actionName: 'broker.loss_report.create',
        })
      } else {
        console.log('✅ Loss reports created:', lossReports.length)
      }
    }
    
    // 5. Create notification for Broker/Owner to audit
    if (updateData.status === 'arrived') {
      const basePath = getXBasePath(tenant, profile)
      const driverTitle = driverName || 'Sopir'
      const rpaTitle = saleData?.rpa_clients?.rpa_name || 'Buyer'
      
      const { error: notifError } = await supabase.from('notifications').insert({
        tenant_id: tenant.id,
        type: 'pengiriman_tiba',
        title: '🚚 Pengiriman Tiba',
        body: `Sopir ${driverTitle} telah sampai di ${rpaTitle}. Segera audit data timbangan.`,
        action_url: `${basePath}/pengiriman`,
        metadata: { ref_id: deliveryId },
      })
      if (notifError) {
        console.error('Notification error:', notifError)
        logSupabaseError(notifError, {
          table: 'notifications',
          operation: 'insert',
          component: 'useUpdateDelivery',
          actionName: 'broker.notification.create',
        })
      }
    }
    
    // 6. Invalidate all relevant queries
    console.log('[useUpdateDelivery] Invalidating queries...')
    await Promise.all([
      queryClient.invalidateQueries({ queryKey: ['sales'] }),
      queryClient.invalidateQueries({ queryKey: ['deliveries'] }),
      queryClient.invalidateQueries({ queryKey: ['loss-reports'] }),
      queryClient.invalidateQueries({ queryKey: ['broker-stats'] })
    ])
    
    // Force a high-priority refetch for the specific deliveries list
    await queryClient.refetchQueries({ queryKey: ['deliveries'] })
    
    return { mortality, shrinkage }
  }
  
  return { updateTiba }
}
