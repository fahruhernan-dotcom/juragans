// =============================================================
// TernakOS — AI Transaction Inserter (v2)
// File: src/lib/aiTransactionInserter.js
// All 11 intents covered. Pre-commit validation integrated.
// =============================================================

import { supabase } from './supabase'
import { validateBusinessRules } from './aiValidation'

/**
 * Insert business data into production tables.
 * Validates first, then inserts. Returns { data, validation } or throws.
 */
export async function insertBusinessData(entry, tenant, profile) {
  const { intent, target_table, extracted_data } = entry
  if (!target_table) return null

  const data = extracted_data || {}
  const tenantId = tenant.id
  const profileId = profile.id

  // ── PRE-COMMIT VALIDATION ─────────────────────────────────
  const validation = validateBusinessRules(entry)
  if (!validation.valid) {
    const err = new Error('Validation failed: ' + validation.errors.join('; '))
    err.validation = validation
    throw err
  }

  try {
    switch (intent) {

      // ═══════════════════════════════════════════════════════
      // BROKER
      // ═══════════════════════════════════════════════════════

      case 'CATAT_PEMBELIAN': {
        let farm_id = data.supplier_id
        if (data.supplier_id_is_new && data.supplier_id_new_name) {
          const { data: farm, error } = await supabase
            .from('farms')
            .insert({ tenant_id: tenantId, farm_name: data.supplier_id_new_name })
            .select('id').single()
          if (!error && farm) farm_id = farm.id
        }

        const avgWeight = data.avg_weight_kg || 1.85
        const totalWeight = data.total_weight_kg || ((data.qty_ekor || 0) * avgWeight)
        const totalCost = totalWeight * (data.price_per_kg || 0)

        const { data: inserted, error } = await supabase.from(target_table).insert({
          tenant_id: tenantId,
          farm_id: farm_id,
          quantity: data.qty_ekor || Math.round(totalWeight / avgWeight),
          avg_weight_kg: avgWeight,
          total_weight_kg: totalWeight,
          price_per_kg: data.price_per_kg,
          total_cost: totalCost,
          transaction_date: data.purchase_date || new Date().toISOString(),
          transport_cost: 0,
          other_cost: 0,
          notes: data.notes || null,
        }).select().single()
        if (error) throw error
        return inserted
      }

      case 'CATAT_PENJUALAN': {
        let rpa_id = data.rpa_id
        if (data.rpa_id_is_new && data.rpa_id_new_name) {
          const { data: client, error } = await supabase
            .from('rpa_clients')
            .insert({ tenant_id: tenantId, rpa_name: data.rpa_id_new_name })
            .select('id').single()
          if (!error && client) rpa_id = client.id
        }

        const avgWeight = data.avg_weight_kg || 2.0
        const totalWeight = data.total_weight_kg || ((data.qty_ekor || 0) * avgWeight)
        const totalRevenue = totalWeight * (data.price_per_kg || 0)

        const { data: inserted, error } = await supabase.from(target_table).insert({
          tenant_id: tenantId,
          rpa_id: rpa_id,
          quantity: data.qty_ekor || Math.round(totalWeight / avgWeight),
          avg_weight_kg: avgWeight,
          total_weight_kg: totalWeight,
          price_per_kg: data.price_per_kg,
          total_revenue: totalRevenue,
          transaction_date: data.sale_date || new Date().toISOString(),
          payment_status: data.payment_status || 'belum_lunas',
          paid_amount: data.paid_amount || 0,
          due_date: data.due_date || null,
          notes: data.notes || null,
        }).select().single()
        if (error) throw error
        return inserted
      }

      case 'CATAT_BAYAR': {
        let payer_id = data.payer_id
        if (data.payer_id_is_new && data.payer_id_new_name) {
          // Payment is typically from an existing RPA client
          const { data: client, error } = await supabase
            .from('rpa_clients')
            .insert({ tenant_id: tenantId, rpa_name: data.payer_id_new_name })
            .select('id').single()
          if (!error && client) payer_id = client.id
        }

        const { data: inserted, error } = await supabase.from(target_table).insert({
          tenant_id: tenantId,
          rpa_id: payer_id || null,
          amount: data.amount,
          payment_method: data.payment_method || 'transfer',
          payment_date: data.payment_date || new Date().toISOString(),
          notes: data.notes || null,
          created_by: profileId,
        }).select().single()
        if (error) throw error
        return inserted
      }

      case 'CATAT_PENGIRIMAN': {
        // vehicle/driver: prefer resolved IDs, fall back to manual text
        let vehicle_id = data.vehicle_id || null
        let driver_id = data.driver_id || null
        if (data.vehicle_id_is_new && data.vehicle_plate) {
          const { data: veh } = await supabase.from('vehicles').insert({
            tenant_id: tenantId, vehicle_plate: data.vehicle_plate,
            vehicle_type: 'truk', ownership: 'lainnya', status: 'aktif',
          }).select('id').single()
          if (veh) vehicle_id = veh.id
        }
        if (data.driver_id_is_new && data.driver_name) {
          const { data: drv } = await supabase.from('drivers').insert({
            tenant_id: tenantId, full_name: data.driver_name, status: 'aktif',
          }).select('id').single()
          if (drv) driver_id = drv.id
        }

        const { data: inserted, error } = await supabase.from(target_table).insert({
          tenant_id: tenantId,
          vehicle_id: vehicle_id,
          vehicle_plate: data.vehicle_plate || null,
          driver_id: driver_id,
          driver_name: data.driver_name || null,
          load_time: data.load_time || null,
          departure_time: data.departure_time || null,
          initial_weight_kg: data.initial_weight_kg || null,
          delivery_cost: data.delivery_cost || 0,
          status: 'preparing',
          notes: data.notes || null,
        }).select().single()
        if (error) throw error
        return inserted
      }

      // ═══════════════════════════════════════════════════════
      // PETERNAK
      // ═══════════════════════════════════════════════════════

      case 'CATAT_HARIAN': {
        let farm_id = data.farm_id
        if (data.farm_id_is_new && data.farm_id_new_name) {
          const { data: farm, error } = await supabase
            .from('peternak_farms')
            .insert({ tenant_id: tenantId, farm_name: data.farm_id_new_name })
            .select('id').single()
          if (!error && farm) farm_id = farm.id
        }

        const { data: inserted, error } = await supabase.from(target_table).insert({
          tenant_id: tenantId,
          farm_id: farm_id,
          record_date: data.record_date || new Date().toISOString().split('T')[0],
          dead_count: data.dead_count || 0,
          culled_count: data.culled_count || 0,
          avg_weight_kg: data.avg_weight_kg || null,
          notes: data.notes || null,
        }).select().single()
        if (error) throw error
        return inserted
      }

      case 'CATAT_PAKAN': {
        let farm_id = data.farm_id
        if (data.farm_id_is_new && data.farm_id_new_name) {
          const { data: farm, error } = await supabase
            .from('peternak_farms')
            .insert({ tenant_id: tenantId, farm_name: data.farm_id_new_name })
            .select('id').single()
          if (!error && farm) farm_id = farm.id
        }

        const { data: inserted, error } = await supabase.from(target_table).insert({
          tenant_id: tenantId,
          farm_id: farm_id,
          feed_type: data.feed_type || null,
          qty_kg: data.qty_kg,
          price_per_kg: data.price_per_kg || null,
          record_date: data.record_date || new Date().toISOString().split('T')[0],
          action: data.action || 'pakai',
          notes: data.notes || null,
        }).select().single()
        if (error) throw error
        return inserted
      }

      case 'CATAT_PANEN': {
        let farm_id = data.farm_id
        if (data.farm_id_is_new && data.farm_id_new_name) {
          const { data: farm, error } = await supabase
            .from('peternak_farms')
            .insert({ tenant_id: tenantId, farm_name: data.farm_id_new_name })
            .select('id').single()
          if (!error && farm) farm_id = farm.id
        }

        const { data: inserted, error } = await supabase.from(target_table).insert({
          tenant_id: tenantId,
          farm_id: farm_id,
          harvest_date: data.harvest_date || new Date().toISOString().split('T')[0],
          qty_ekor: data.qty_ekor,
          total_weight_kg: data.total_weight_kg,
          price_per_kg: data.price_per_kg || null,
          buyer_name: data.buyer_name || null,
          notes: data.notes || null,
        }).select().single()
        if (error) throw error
        return inserted
      }

      case 'CATAT_PENGELUARAN': {
        let farm_id = data.farm_id
        if (data.farm_id_is_new && data.farm_id_new_name) {
          const { data: farm, error } = await supabase
            .from('peternak_farms')
            .insert({ tenant_id: tenantId, farm_name: data.farm_id_new_name })
            .select('id').single()
          if (!error && farm) farm_id = farm.id
        }

        const { data: inserted, error } = await supabase.from(target_table).insert({
          tenant_id: tenantId,
          farm_id: farm_id,
          expense_date: data.expense_date || new Date().toISOString().split('T')[0],
          category: data.category || 'lainnya',
          amount: data.amount,
          description: data.description || null,
          notes: data.notes || null,
        }).select().single()
        if (error) throw error
        return inserted
      }

      // ═══════════════════════════════════════════════════════
      // RPA
      // ═══════════════════════════════════════════════════════

      case 'BUAT_INVOICE': {
        let customer_id = data.customer_id
        if (data.customer_id_is_new && data.customer_id_new_name) {
          const { data: customer, error } = await supabase
            .from('rpa_customers')
            .insert({ tenant_id: tenantId, customer_name: data.customer_id_new_name })
            .select('id').single()
          if (!error && customer) customer_id = customer.id
        }

        // Calculate total from items
        const items = data.items || []
        const totalAmount = items.reduce((sum, item) =>
          sum + ((item.qty || 0) * (item.price_per_unit || 0)), 0)

        const { data: inserted, error } = await supabase.from(target_table).insert({
          tenant_id: tenantId,
          customer_id: customer_id,
          invoice_date: data.invoice_date || new Date().toISOString().split('T')[0],
          items: items,
          total_amount: totalAmount,
          status: 'draft',
          notes: data.notes || null,
          created_by: profileId,
        }).select().single()
        if (error) throw error
        return inserted
      }

      case 'CATAT_ORDER': {
        const { data: inserted, error } = await supabase.from(target_table).insert({
          tenant_id: tenantId,
          broker_name: data.broker_name || null,
          broker_id: data.broker_id || null,
          qty_ekor: data.qty_ekor,
          target_weight_kg: data.target_weight_kg || null,
          price_per_kg: data.price_per_kg || null,
          order_date: data.order_date || new Date().toISOString().split('T')[0],
          needed_date: data.needed_date || null,
          status: 'pending',
          notes: data.notes || null,
          created_by: profileId,
        }).select().single()
        if (error) throw error
        return inserted
      }

      case 'TAMBAH_PRODUK': {
        const { data: inserted, error } = await supabase.from(target_table).insert({
          tenant_id: tenantId,
          product_name: data.name,
          unit: data.unit || 'kg',
          sell_price: data.sell_price,
          notes: data.notes || null,
        }).select().single()
        if (error) throw error
        return inserted
      }

      default:
        console.warn('[AI Inserter] No handler for intent:', intent)
        return null
    }
  } catch (err) {
    console.error('[AI Inserter] Error inserting to', target_table, err)
    throw err
  }
}
