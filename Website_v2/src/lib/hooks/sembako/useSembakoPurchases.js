import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { supabase } from '../../supabase'
import { toast } from 'sonner'
import { useAuth } from '../useAuth'
import { normalizeSupabaseError } from '../../supabaseErrorHandler'
import { logSupabaseError } from '@/lib/logger/supabaseLogger'
import { STALE_1M, STALE_5M, getTenantId, sanitizeDBPayload } from './sembakoCommon'

/**
 * useSembakoPurchaseInvoices
 * Fetches and synchronizes all factory & supplier purchase invoices
 * Merges audit logs (structured multi-item invoices), stock batches, and supplier payments
 */
export const useSembakoPurchaseInvoices = () => {
  const { tenant } = useAuth()

  return useQuery({
    queryKey: ['sembako-purchase-invoices', tenant?.id],
    enabled: !!tenant?.id,
    staleTime: STALE_1M,
    queryFn: async () => {
      try {
        // 1. Fetch structured purchase invoice audit logs
        const { data: auditLogs, error: logErr } = await supabase
          .from('sembako_audit_logs')
          .select('*')
          .eq('tenant_id', tenant.id)
          .eq('action_type', 'PURCHASE_INVOICE_CREATED')
          .order('created_at', { ascending: false })

        if (logErr) console.warn('[useSembakoPurchaseInvoices] audit log error:', logErr.message)

        // 2. Fetch all supplier payments for matching reference_number
        const { data: allPayments, error: payErr } = await supabase
          .from('sembako_supplier_payments')
          .select('*')
          .eq('tenant_id', tenant.id)
          .eq('is_deleted', false)

        if (payErr) console.warn('[useSembakoPurchaseInvoices] payments error:', payErr.message)

        // Map payments by reference_number / invoice_number
        const paymentsByInv = (allPayments || []).reduce((acc, p) => {
          const ref = (p.reference_number || '').trim().toLowerCase()
          if (ref) {
            acc[ref] = (acc[ref] || 0) + (Number(p.amount) || 0)
          }
          return acc
        }, {})

        // 3. Fetch SKU stock batches to detect any batches not in audit logs
        const { data: stockBatches } = await supabase
          .from('sembako_stock_batches')
          .select('*, sembako_suppliers(supplier_name, phone, address), sembako_products(product_name, unit)')
          .eq('tenant_id', tenant.id)
          .eq('is_deleted', false)
          .order('purchase_date', { ascending: false })

        const structuredInvoices = []
        const registeredInvoiceCodes = new Set()

        // Parse audit logs
        ;(auditLogs || []).forEach(l => {
          try {
            if (!l.notes) return
            let meta = {}
            if (typeof l.notes === 'string' && l.notes.startsWith('{')) {
              meta = JSON.parse(l.notes)
            } else if (typeof l.notes === 'object') {
              meta = l.notes
            }

            if (!meta.invoice_number) return

            const invKey = meta.invoice_number.trim().toLowerCase()
            registeredInvoiceCodes.add(invKey)

            const totalAmount = Number(meta.total_amount || 0)
            const recordedPaid = Number(meta.paid_amount || 0)
            const directPayments = paymentsByInv[invKey] || 0
            const totalPaid = Math.max(recordedPaid, directPayments)
            const remainingDebt = Math.max(0, totalAmount - totalPaid)
            const paymentStatus = remainingDebt === 0 ? 'lunas' : (totalPaid > 0 ? 'sebagian' : (meta.payment_status || 'tempo'))

            structuredInvoices.push({
              id: l.id,
              invoice_number: meta.invoice_number,
              supplier_id: meta.supplier_id || null,
              supplier_name: meta.supplier_name || l.product_name || 'Pabrik Bawang',
              transaction_date: meta.transaction_date || (l.created_at ? l.created_at.slice(0, 10) : new Date().toISOString().slice(0, 10)),
              due_date: meta.due_date || null,
              payment_status: paymentStatus,
              payment_method: meta.payment_method || 'Kas Operasional Juragan',
              items: Array.isArray(meta.items) ? meta.items : [],
              total_quantity: Number(meta.total_quantity || 0),
              total_amount: totalAmount,
              paid_amount: totalPaid,
              remaining_debt: remainingDebt,
              notes: meta.notes || '',
              created_at: l.created_at || l.timestamp,
              is_from_audit: true,
            })
          } catch (e) {
            console.warn('[useSembakoPurchaseInvoices] JSON parse error:', e)
          }
        })

        // Group legacy stock batches not covered by audit logs
        const legacyBatchGroups = (stockBatches || []).reduce((acc, b) => {
          const invKey = (b.batch_code || b.id).trim().toLowerCase()
          if (registeredInvoiceCodes.has(invKey)) return acc // already included in structured invoices

          if (!acc[invKey]) {
            acc[invKey] = {
              id: b.id,
              invoice_number: b.batch_code || `INV/BATCH/${b.id.slice(0, 8).toUpperCase()}`,
              supplier_id: b.supplier_id,
              supplier_name: b.sembako_suppliers?.supplier_name || 'Supplier Mitra',
              transaction_date: b.purchase_date ? b.purchase_date.slice(0, 10) : b.created_at.slice(0, 10),
              due_date: null,
              payment_status: 'lunas',
              payment_method: 'Transfer Bank / Kas',
              items: [],
              total_quantity: 0,
              total_amount: 0,
              paid_amount: 0,
              remaining_debt: 0,
              notes: b.notes || '',
              created_at: b.created_at,
              is_from_audit: false,
            }
          }

          const qty = Number(b.qty_masuk || 0)
          const price = Number(b.buy_price || 0)
          const subtotal = Number(b.total_cost || 0) || (qty * price)

          acc[invKey].items.push({
            type: 'sku',
            item_id: b.product_id,
            product_name: b.sembako_products?.product_name || 'Bawang Goreng Jadi',
            category: 'bawang_sku',
            quantity: qty,
            unit: b.sembako_products?.unit || 'kg',
            unit_price: price,
            subtotal: subtotal,
            notes: b.notes || ''
          })

          acc[invKey].total_quantity += qty
          acc[invKey].total_amount += subtotal
          acc[invKey].paid_amount += subtotal
          return acc
        }, {})

        const allInvoices = [
          ...structuredInvoices,
          ...Object.values(legacyBatchGroups)
        ].sort((a, b) => new Date(b.transaction_date || b.created_at) - new Date(a.transaction_date || a.created_at))

        return allInvoices
      } catch (err) {
        console.error('[useSembakoPurchaseInvoices] failed:', err)
        return []
      }
    }
  })
}

/**
 * Helper to invalidate all purchase and stock related queries
 */
export const invalidatePurchaseQueries = (queryClient) => {
  queryClient.invalidateQueries({ queryKey: ['sembako-purchase-invoices'] })
  queryClient.invalidateQueries({ queryKey: ['sembako-batches'] })
  queryClient.invalidateQueries({ queryKey: ['sembako-all-batches'] })
  queryClient.invalidateQueries({ queryKey: ['sembako-products'] })
  queryClient.invalidateQueries({ queryKey: ['sembako-raw-materials'] })
  queryClient.invalidateQueries({ queryKey: ['sembako-suppliers'] })
  queryClient.invalidateQueries({ queryKey: ['sembako-supplier-payments'] })
  queryClient.invalidateQueries({ queryKey: ['sembako-supplier-invoices'] })
  queryClient.invalidateQueries({ queryKey: ['sembako-dashboard-stats'] })
  queryClient.invalidateQueries({ queryKey: ['sembako-audit-logs'] })
  queryClient.invalidateQueries({ queryKey: ['sembako-material-mutations'] })
}

/**
 * Atomically rolls back all stock batches, material mutations, payments, and audit logs
 * associated with a specific purchase invoice number.
 */
export const rollbackPurchaseInvoice = async (invoiceNumber, tenantId) => {
  if (!invoiceNumber || !tenantId) return

  const cleanInv = String(invoiceNumber).trim()
  const revertedMaterialIds = new Set()
  const affectedProductIds = new Set()

  // 1. PRIMARY SOURCE OF TRUTH: Find previous PURCHASE_INVOICE_CREATED audit log to extract original items
  const { data: purchaseLogs } = await supabase
    .from('sembako_audit_logs')
    .select('id, notes')
    .eq('tenant_id', tenantId)
    .eq('action_type', 'PURCHASE_INVOICE_CREATED')

  const matchingPurchaseLog = (purchaseLogs || []).find(l => {
    try {
      const parsed = typeof l.notes === 'string' ? JSON.parse(l.notes) : l.notes
      return parsed?.invoice_number === cleanInv
    } catch {
      return typeof l.notes === 'string' && l.notes.includes(cleanInv)
    }
  })

  if (matchingPurchaseLog) {
    try {
      const meta = typeof matchingPurchaseLog.notes === 'string'
        ? JSON.parse(matchingPurchaseLog.notes)
        : matchingPurchaseLog.notes

      const oldItems = Array.isArray(meta?.items) ? meta.items : []

      for (const oldIt of oldItems) {
        const qty = Number(oldIt.quantity) || 0
        const subtotal = Number(oldIt.subtotal) || (qty * (Number(oldIt.unit_price) || 0))
        if (qty <= 0) continue

        // If it was a Raw Material / Packaging / Curah / Polymailer / Sticker
        if (oldIt.type === 'raw_material' || oldIt.category !== 'bawang_sku') {
          let targetMat = null
          if (oldIt.item_id && oldIt.item_id !== '__custom__') {
            const { data: m } = await supabase
              .from('sembako_raw_materials')
              .select('id, current_stock, total_spent')
              .eq('id', oldIt.item_id)
              .maybeSingle()
            targetMat = m
          }

          // Fallback by name if item_id was custom or not found
          if (!targetMat && oldIt.product_name) {
            const { data: mByName } = await supabase
              .from('sembako_raw_materials')
              .select('id, current_stock, total_spent')
              .eq('tenant_id', tenantId)
              .ilike('material_name', oldIt.product_name.trim())
              .maybeSingle()
            targetMat = mByName
          }

          if (targetMat) {
            revertedMaterialIds.add(targetMat.id)
            const revertedStock = Math.max(0, Number(targetMat.current_stock || 0) - qty)
            const revertedSpent = Math.max(0, Number(targetMat.total_spent || 0) - subtotal)
            const { error: revertErr } = await supabase
              .from('sembako_raw_materials')
              .update({
                current_stock: revertedStock,
                total_spent: revertedSpent,
                updated_at: new Date().toISOString()
              })
              .eq('id', targetMat.id)

            if (revertErr) {
              console.error('[rollbackPurchaseInvoice] Gagal revert stok bahan (primary):', {
                error: revertErr.message, material_id: targetMat.id, revertedStock
              })
            }
          }
        } else if (oldIt.type === 'sku' && oldIt.item_id) {
          affectedProductIds.add(oldIt.item_id)
        }
      }
    } catch (e) {
      console.warn('[rollbackPurchaseInvoice] parse purchase log error:', e)
    }
  }

  // 2. SECONDARY SOURCE OF TRUTH: Rollback via sembako_inventory_mutations
  const { data: mutations } = await supabase
    .from('sembako_inventory_mutations')
    .select('id, material_id, quantity, total_cost')
    .eq('tenant_id', tenantId)
    .eq('ref_number', cleanInv)
    .eq('mutation_type', 'IN')

  if (mutations && mutations.length > 0) {
    for (const m of mutations) {
      if (m.material_id && !revertedMaterialIds.has(m.material_id)) {
        revertedMaterialIds.add(m.material_id)
        const { data: mat } = await supabase
          .from('sembako_raw_materials')
          .select('current_stock, total_spent')
          .eq('id', m.material_id)
          .maybeSingle()

        if (mat) {
          const revertedStock = Math.max(0, Number(mat.current_stock || 0) - Number(m.quantity || 0))
          const revertedSpent = Math.max(0, Number(mat.total_spent || 0) - Number(m.total_cost || 0))
          const { error: revertErr2 } = await supabase
            .from('sembako_raw_materials')
            .update({
              current_stock: revertedStock,
              total_spent: revertedSpent,
              updated_at: new Date().toISOString()
            })
            .eq('id', m.material_id)

          if (revertErr2) {
            console.error('[rollbackPurchaseInvoice] Gagal revert stok bahan (mutations):', {
              error: revertErr2.message, material_id: m.material_id
            })
          }
        }
      }
    }

    const { error: delMutErr } = await supabase
      .from('sembako_inventory_mutations')
      .delete()
      .in('id', mutations.map(m => m.id))

    if (delMutErr) {
      console.error('[rollbackPurchaseInvoice] Gagal hapus mutations:', delMutErr.message)
    }
  }

  // 3. Rollback sembako_stock_batches created for this invoice (safe individual PostgREST queries)
  const batchIdsToDelete = new Set()

  // 3A. Match notes with invoice number
  const { data: batchesByNotes } = await supabase
    .from('sembako_stock_batches')
    .select('id, product_id')
    .eq('tenant_id', tenantId)
    .ilike('notes', `%${cleanInv}%`)

  ;(batchesByNotes || []).forEach(b => {
    if (b.product_id) affectedProductIds.add(b.product_id)
    batchIdsToDelete.add(b.id)
  })

  // 3B. Match exact batch_code
  const { data: batchesByExactCode } = await supabase
    .from('sembako_stock_batches')
    .select('id, product_id')
    .eq('tenant_id', tenantId)
    .eq('batch_code', cleanInv)

  ;(batchesByExactCode || []).forEach(b => {
    if (b.product_id) affectedProductIds.add(b.product_id)
    batchIdsToDelete.add(b.id)
  })

  // 3C. Match batch_code with prefix (e.g. cleanInv-1, cleanInv-2)
  const { data: batchesByPrefix } = await supabase
    .from('sembako_stock_batches')
    .select('id, product_id')
    .eq('tenant_id', tenantId)
    .ilike('batch_code', `${cleanInv}-%`)

  ;(batchesByPrefix || []).forEach(b => {
    if (b.product_id) affectedProductIds.add(b.product_id)
    batchIdsToDelete.add(b.id)
  })

  if (batchIdsToDelete.size > 0) {
    const { error: delBatchErr } = await supabase
      .from('sembako_stock_batches')
      .delete()
      .in('id', Array.from(batchIdsToDelete))

    if (delBatchErr) {
      console.error('[rollbackPurchaseInvoice] Gagal hapus stock batches:', delBatchErr.message)
    }
  }

  // Recalculate each affected product stock & FIFO active cost from remaining active batches
  for (const prodId of affectedProductIds) {
    const { data: remainingBatches } = await supabase
      .from('sembako_stock_batches')
      .select('qty_sisa, buy_price, purchase_date')
      .eq('product_id', prodId)
      .eq('is_deleted', false)
      .gt('qty_sisa', 0)
      .order('purchase_date', { ascending: true })

    let syncedStock = 0
    let fifoCost = 0
    if (remainingBatches && remainingBatches.length > 0) {
      fifoCost = Number(remainingBatches[0].buy_price) || 0
      for (const rb of remainingBatches) {
        syncedStock += Number(rb.qty_sisa || 0)
      }
    }
    const { error: prodUpdateErr } = await supabase
      .from('sembako_products')
      .update({ current_stock: Math.max(0, Math.round(syncedStock)), avg_buy_price: fifoCost })
      .eq('id', prodId)

    if (prodUpdateErr) {
      console.error('[rollbackPurchaseInvoice] Gagal update stok produk:', {
        error: prodUpdateErr.message, prodId, syncedStock
      })
    }
  }

  // 4. Delete RESTOCK_BAHAN audit logs referencing this invoice
  const { data: restockLogs } = await supabase
    .from('sembako_audit_logs')
    .select('id, notes')
    .eq('tenant_id', tenantId)
    .eq('action_type', 'RESTOCK_BAHAN')

  const restockIdsToDelete = (restockLogs || [])
    .filter(l => typeof l.notes === 'string' && l.notes.includes(cleanInv))
    .map(l => l.id)

  if (restockIdsToDelete.length > 0) {
    const { error: delRestockErr } = await supabase
      .from('sembako_audit_logs')
      .delete()
      .in('id', restockIdsToDelete)

    if (delRestockErr) {
      console.error('[rollbackPurchaseInvoice] Gagal hapus RESTOCK_BAHAN logs:', delRestockErr.message)
    }
  }

  // 5. Delete supplier payments for this invoice
  const { error: delPayErr } = await supabase
    .from('sembako_supplier_payments')
    .delete()
    .eq('tenant_id', tenantId)
    .eq('reference_number', cleanInv)

  if (delPayErr) {
    console.error('[rollbackPurchaseInvoice] Gagal hapus supplier payments:', delPayErr.message)
  }

  // 6. Delete master PURCHASE_INVOICE_CREATED audit log(s)
  const purchaseLogIdsToDelete = (purchaseLogs || [])
    .filter(l => typeof l.notes === 'string' && l.notes.includes(cleanInv))
    .map(l => l.id)

  if (purchaseLogIdsToDelete.length > 0) {
    const { error: delAuditErr } = await supabase
      .from('sembako_audit_logs')
      .delete()
      .in('id', purchaseLogIdsToDelete)

    if (delAuditErr) {
      console.error('[rollbackPurchaseInvoice] Gagal hapus master audit log:', delAuditErr.message)
    }
  }
}

/**
 * Shared executor to write a purchase invoice, stock batches, raw materials, payment, and audit log.
 */
export const executePurchaseInvoiceRecord = async (payload, tenant_id) => {
  const {
    supplier_id: rawSupplierId,
    supplier_name,
    supplier_phone = '',
    supplier_address = '',
    invoice_number,
    transaction_date = new Date().toISOString().slice(0, 10),
    due_date = null,
    payment_status = 'lunas',
    payment_method = 'Kas Operasional Juragan',
    paid_amount = 0,
    items = [],
    total_quantity = 0,
    total_amount = 0,
    notes = '',
  } = payload

  if (!invoice_number) throw new Error('Nomor invoice harus diisi!')
  if (!items || items.length === 0) throw new Error('Daftar item pembelian tidak boleh kosong!')

  // 1. Resolve Supplier ID
  let finalSupplierId = rawSupplierId
  if (!finalSupplierId && supplier_name) {
    const { data: existingSup } = await supabase
      .from('sembako_suppliers')
      .select('id')
      .eq('tenant_id', tenant_id)
      .ilike('supplier_name', supplier_name.trim())
      .eq('is_deleted', false)
      .maybeSingle()

    if (existingSup) {
      finalSupplierId = existingSup.id
    } else {
      const { data: newSup, error: createSupErr } = await supabase
        .from('sembako_suppliers')
        .insert({
          tenant_id,
          supplier_name: supplier_name.trim(),
          phone: supplier_phone,
          address: supplier_address,
          notes: `Didaftarkan otomatis dari Faktur ${invoice_number}`,
        })
        .select('id')
        .single()

      if (createSupErr) {
        logSupabaseError(createSupErr, { table: 'sembako_suppliers', operation: 'insert' })
        throw createSupErr
      }
      finalSupplierId = newSup.id
    }
  }

  // 2. Process each line item
  for (let i = 0; i < items.length; i++) {
    const item = items[i]
    const itemType = item.type || 'sku'
    const qty = Number(item.quantity || 0)
    const price = Number(item.unit_price || 0)
    const subtotal = Number(item.subtotal || (qty * price))

    if (qty <= 0) continue

    // 2A. Product SKU (Produk Jadi Bawang) -> sembako_stock_batches
    if (itemType === 'sku' && item.item_id) {
      const batchCode = items.length > 1 ? `${invoice_number}-${i + 1}` : invoice_number
      const batchPayload = {
        tenant_id,
        product_id: item.item_id,
        supplier_id: finalSupplierId,
        batch_code: batchCode,
        qty_masuk: qty,
        qty_sisa: qty,
        buy_price: price,
        total_cost: subtotal,
        purchase_date: transaction_date,
        notes: `[Faktur: ${invoice_number}] ${item.notes || ''}`.trim(),
      }

      const { error: batchErr } = await supabase
        .from('sembako_stock_batches')
        .insert(batchPayload)

      if (batchErr) {
        logSupabaseError(batchErr, { table: 'sembako_stock_batches', operation: 'insert' })
        throw batchErr
      }

      // Recalculate and update sembako_products current_stock and FIFO active cost
      const { data: activeBatches } = await supabase
        .from('sembako_stock_batches')
        .select('qty_sisa, buy_price, created_at, purchase_date')
        .eq('product_id', item.item_id)
        .eq('is_deleted', false)
        .gt('qty_sisa', 0)
        .order('purchase_date', { ascending: true }) // Oldest first (FIFO)

      let syncedStock = 0
      let fifoActiveCost = price
      if (activeBatches && activeBatches.length > 0) {
        fifoActiveCost = Number(activeBatches[0].buy_price) || price
        for (const b of activeBatches) {
          syncedStock += Number(b.qty_sisa || 0)
        }
      }

      const { error: prodUpdateErr } = await supabase
        .from('sembako_products')
        .update({ current_stock: Math.round(syncedStock), avg_buy_price: fifoActiveCost })
        .eq('id', item.item_id)

      if (prodUpdateErr) {
        logSupabaseError(prodUpdateErr, { table: 'sembako_products', operation: 'update' })
        console.error('[executePurchaseInvoiceRecord] Gagal update stok produk SKU:', {
          error: prodUpdateErr.message, product_id: item.item_id
        })
        // Non-fatal: batch sudah diinsert, stok akan sync ulang saat query berikutnya
      }
    }

    // 2B. Raw Materials & Packaging (Pouch, Sticker Front/Back, Bawang Curah, Kardus, Polymailer)
    else if (itemType === 'raw_material') {
      let resolvedMatId = item.item_id && item.item_id !== '__custom__' ? item.item_id : null
      let rawMat = null

      if (resolvedMatId) {
        const { data, error: fetchMatErr } = await supabase
          .from('sembako_raw_materials')
          .select('*')
          .eq('id', resolvedMatId)
          .maybeSingle()

        if (fetchMatErr) {
          logSupabaseError(fetchMatErr, { table: 'sembako_raw_materials', operation: 'select' })
          console.error('[executePurchaseInvoiceRecord] Gagal fetch raw material by ID:', {
            error: fetchMatErr.message, resolvedMatId
          })
          throw new Error(`Gagal membaca data bahan: ${fetchMatErr.message}`)
        }
        rawMat = data
      }

      if (!rawMat && item.product_name) {
        // Try finding existing by name
        const { data: byName } = await supabase
          .from('sembako_raw_materials')
          .select('*')
          .eq('tenant_id', tenant_id)
          .ilike('material_name', item.product_name.trim())
          .eq('is_deleted', false)
          .maybeSingle()

        if (byName) {
          rawMat = byName
          resolvedMatId = byName.id
        } else {
          // Auto-insert new material into sembako_raw_materials
          const { data: createdMat, error: insertMatErr } = await supabase
            .from('sembako_raw_materials')
            .insert({
              tenant_id,
              material_name: item.product_name.trim(),
              category: item.category || 'polymailer',
              unit: item.unit || 'pcs',
              current_stock: 0,
              unit_cost: price,
              total_spent: 0,
              supplier_name: supplier_name || 'Vendor Packaging',
              notes: `Didaftarkan otomatis dari Faktur ${invoice_number}`
            })
            .select('*')
            .single()

          if (insertMatErr) {
            logSupabaseError(insertMatErr, { table: 'sembako_raw_materials', operation: 'insert' })
            console.error('[executePurchaseInvoiceRecord] Gagal auto-insert bahan baru:', insertMatErr.message)
            throw new Error(`Gagal mendaftarkan bahan baru: ${insertMatErr.message}`)
          }
          if (createdMat) {
            rawMat = createdMat
            resolvedMatId = createdMat.id
          }
        }
      }

      if (rawMat && resolvedMatId) {
        const oldStock = Number(rawMat.current_stock || 0)
        const newStock = oldStock + qty
        const newTotalSpent = Number(rawMat.total_spent || 0) + subtotal

        // In FIFO: Determine active lot cost
        let activeFifoCost = price
        if (oldStock > 0) {
          const { data: olderLots, error: olderLotsErr } = await supabase
            .from('sembako_inventory_mutations')
            .select('unit_cost, quantity')
            .eq('material_id', resolvedMatId)
            .eq('mutation_type', 'IN')
            .gt('quantity', 0)
            .order('created_at', { ascending: true })
            .limit(1)

          if (olderLotsErr) {
            logSupabaseError(olderLotsErr, { table: 'sembako_inventory_mutations', operation: 'select', component: 'useSembakoPurchases' })
          }

          if (olderLots && olderLots.length > 0 && Number(olderLots[0].unit_cost) > 0) {
            activeFifoCost = Number(olderLots[0].unit_cost)
          } else if (Number(rawMat.unit_cost) > 0) {
            activeFifoCost = Number(rawMat.unit_cost)
          }
        }

        const { error: matUpdateErr } = await supabase
          .from('sembako_raw_materials')
          .update({
            current_stock: newStock,
            unit_cost: activeFifoCost,
            total_spent: newTotalSpent,
            supplier_name: supplier_name || rawMat.supplier_name,
            updated_at: new Date().toISOString()
          })
          .eq('id', resolvedMatId)

        if (matUpdateErr) {
          logSupabaseError(matUpdateErr, { table: 'sembako_raw_materials', operation: 'update' })
          throw new Error(`[executePurchaseInvoiceRecord] Gagal update stok bahan: ${matUpdateErr.message}`)
        }

        // Log mutation in sembako_inventory_mutations
        const mutPayload = {
          tenant_id,
          material_id: resolvedMatId,
          material_name: item.product_name || rawMat.material_name,
          material_category: rawMat.category || item.category,
          mutation_type: 'IN',
          action_type: 'RESTOCK',
          quantity: qty,
          unit: item.unit || rawMat.unit,
          unit_cost: price,
          total_cost: subtotal,
          prev_stock: oldStock,
          new_stock: newStock,
          ref_type: 'purchase',
          ref_number: invoice_number,
          party_name: supplier_name,
          notes: item.notes || `Pembelian ${invoice_number} (Lot FIFO Masuk)`,
          created_by: 'Sistem',
          created_at: transaction_date ? `${transaction_date}T00:00:00.000Z` : new Date().toISOString(),
        }

        const { error: mutErr } = await supabase
          .from('sembako_inventory_mutations')
          .insert(mutPayload)

        if (mutErr) {
          logSupabaseError(mutErr, { table: 'sembako_inventory_mutations', operation: 'insert' })
          console.error('[executePurchaseInvoiceRecord] mutation insert error:', mutErr)
        }

        // Also record RESTOCK_BAHAN audit log for consistency
        const { error: restockAuditErr } = await supabase
          .from('sembako_audit_logs')
          .insert({
            tenant_id,
            action_type: 'RESTOCK_BAHAN',
            product_name: item.product_name || rawMat.material_name,
            notes: JSON.stringify({
              qty_added: qty,
              unit: item.unit || rawMat.unit,
              unit_cost: price,
              total_spent: subtotal,
              supplier_name: supplier_name,
              notes: `Faktur ${invoice_number}: ${item.notes || ''}`.trim(),
              invoice_number: invoice_number,
            }),
            created_at: transaction_date ? `${transaction_date}T00:00:00.000Z` : new Date().toISOString(),
          })

        if (restockAuditErr) {
          logSupabaseError(restockAuditErr, { table: 'sembako_audit_logs', operation: 'insert' })
          console.warn('[executePurchaseInvoiceRecord] Gagal insert RESTOCK_BAHAN audit log (non-fatal):', restockAuditErr.message)
        }
      }
    }
  }

  // 3. Record Payment if paid_amount > 0 or status === 'lunas'
  const actualPaid = payment_status === 'lunas' ? total_amount : Number(paid_amount || 0)
  if (actualPaid > 0 && finalSupplierId) {
    const payPayload = {
      tenant_id,
      supplier_id: finalSupplierId,
      amount: actualPaid,
      payment_date: transaction_date ? `${transaction_date}T00:00:00.000Z` : new Date().toISOString(),
      payment_method: payment_method || 'Kas Operasional Juragan',
      reference_number: invoice_number,
      notes: `Pelunasan Faktur ${invoice_number} via ${payment_method}`.trim(),
    }

    const { error: payErr } = await supabase
      .from('sembako_supplier_payments')
      .insert(payPayload)

    if (payErr) {
      logSupabaseError(payErr, { table: 'sembako_supplier_payments', operation: 'insert' })
      console.warn('[useCreatePurchaseInvoice] Payment insert warning:', payErr.message)
    }
  }

  // 4. Record Master Purchase Audit Log
  const remainingDebt = Math.max(0, total_amount - actualPaid)
  const auditPayload = {
    tenant_id,
    action_type: 'PURCHASE_INVOICE_CREATED',
    product_name: supplier_name || 'Pabrik Bawang',
    notes: JSON.stringify({
      invoice_number,
      supplier_id: finalSupplierId,
      supplier_name,
      transaction_date,
      due_date,
      payment_status: remainingDebt === 0 ? 'lunas' : (actualPaid > 0 ? 'sebagian' : 'tempo'),
      payment_method,
      items,
      total_quantity,
      total_amount,
      paid_amount: actualPaid,
      remaining_debt: remainingDebt,
      notes,
      created_at: new Date().toISOString(),
    }),
    created_at: transaction_date ? `${transaction_date}T00:00:00.000Z` : new Date().toISOString(),
  }

  const { error: auditErr } = await supabase
    .from('sembako_audit_logs')
    .insert(auditPayload)

  if (auditErr) {
    logSupabaseError(auditErr, { table: 'sembako_audit_logs', operation: 'insert' })
    console.error('[executePurchaseInvoiceRecord] Gagal catat master audit log:', auditErr.message)
    throw new Error(`Gagal mencatat audit log faktur: ${auditErr.message}`)
  }

  return {
    invoice_number,
    supplier_id: finalSupplierId,
    supplier_name,
    transaction_date,
    due_date,
    payment_status: remainingDebt === 0 ? 'lunas' : (actualPaid > 0 ? 'sebagian' : 'tempo'),
    payment_method,
    items,
    total_quantity,
    total_amount,
    paid_amount: actualPaid,
    remaining_debt: remainingDebt,
    notes,
  }
}

/**
 * useCreatePurchaseInvoice
 * Atomically records multi-item purchase invoice
 */
export const useCreatePurchaseInvoice = () => {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: async (payload) => {
      const tenant_id = await getTenantId()
      return await executePurchaseInvoiceRecord(payload, tenant_id)
    },
    onSuccess: (data) => {
      invalidatePurchaseQueries(queryClient)
      toast.success(`Faktur Pembelian ${data.invoice_number} berhasil diterbitkan & stok tersinkronisasi!`)
    },
    onError: (err) => {
      toast.error('Gagal mencatat faktur pembelian: ' + normalizeSupabaseError(err).message)
    }
  })
}

/**
 * useUpdatePurchaseInvoice
 * Atomically rolls back previous stock/payments and re-applies updated purchase invoice data
 */
export const useUpdatePurchaseInvoice = () => {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: async ({ oldInvoiceNumber, ...payload }) => {
      const tenant_id = await getTenantId()
      const targetOldNumber = oldInvoiceNumber || payload.invoice_number

      if (targetOldNumber) {
        await rollbackPurchaseInvoice(targetOldNumber, tenant_id)
      }

      return await executePurchaseInvoiceRecord(payload, tenant_id)
    },
    onSuccess: (data) => {
      invalidatePurchaseQueries(queryClient)
      toast.success(`Faktur Pembelian ${data.invoice_number} berhasil diperbarui & stok tersinkronisasi!`)
    },
    onError: (err) => {
      toast.error('Gagal memperbarui faktur pembelian: ' + normalizeSupabaseError(err).message)
    }
  })
}

/**
 * useDeletePurchaseInvoice
 * Atomically rolls back and removes a purchase invoice and all associated stock/payment records
 */
export const useDeletePurchaseInvoice = () => {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: async ({ invoice_number }) => {
      const tenant_id = await getTenantId()
      if (!invoice_number) throw new Error('Nomor faktur tidak valid!')

      await rollbackPurchaseInvoice(invoice_number, tenant_id)
      return { invoice_number }
    },
    onSuccess: (data) => {
      invalidatePurchaseQueries(queryClient)
      toast.success(`Faktur Pembelian ${data.invoice_number} berhasil dibatalkan & stok dikembalikan!`)
    },
    onError: (err) => {
      toast.error('Gagal menghapus faktur pembelian: ' + normalizeSupabaseError(err).message)
    }
  })
}

/**
 * usePayPurchaseInvoice
 * Records subsequent debt repayment for tempo/partial purchase invoices
 */
export const usePayPurchaseInvoice = () => {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: async ({ invoice_number, supplier_id, amount, payment_date, payment_method, notes }) => {
      const tenant_id = await getTenantId()
      if (!supplier_id) throw new Error('Supplier ID tidak valid!')
      if (!amount || amount <= 0) throw new Error('Nominal pembayaran harus lebih dari Rp 0!')

      const payPayload = {
        tenant_id,
        supplier_id,
        amount: Number(amount),
        payment_date: payment_date ? `${payment_date}T00:00:00.000Z` : new Date().toISOString(),
        payment_method: payment_method || 'Transfer Bank',
        reference_number: invoice_number,
        notes: `Pelunasan Hutang Faktur ${invoice_number}. ${notes || ''}`.trim(),
      }

      const { error } = await supabase
        .from('sembako_supplier_payments')
        .insert(payPayload)

      if (error) {
        logSupabaseError(error, { table: 'sembako_supplier_payments', operation: 'insert' })
        throw error
      }
    },
    onSuccess: (_, vars) => {
      queryClient.invalidateQueries({ queryKey: ['sembako-purchase-invoices'] })
      queryClient.invalidateQueries({ queryKey: ['sembako-supplier-payments'] })
      queryClient.invalidateQueries({ queryKey: ['sembako-suppliers'] })
      queryClient.invalidateQueries({ queryKey: ['sembako-dashboard-stats'] })
      toast.success(`Pembayaran hutang untuk Faktur ${vars.invoice_number} berhasil dicatat!`)
    },
    onError: (err) => {
      toast.error('Gagal mencatat pembayaran: ' + normalizeSupabaseError(err).message)
    }
  })
}
