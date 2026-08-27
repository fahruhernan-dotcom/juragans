import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { supabase } from '../../supabase'
import { toast } from 'sonner'
import { useAuth } from '../useAuth'
import { normalizeSupabaseError } from '../../supabaseErrorHandler'
import { logSupabaseError } from '@/lib/logger/supabaseLogger'
import { logError } from '@/lib/logger/errorLogger'
import { formatIDR } from '@/lib/format'
import { STALE_5M, sanitizeDBPayload, getTenantId } from './sembakoCommon'
import { recordAuditLog } from '@/lib/hooks/useSembakoAudit'
import {
  extractProductGrammage,
  matchBawangMaterial,
  matchKemasanMaterial,
  matchStickerFrontMaterial,
  matchStickerBackMaterial,
  calculateBomProductStock
} from '@/lib/inventory/bomStockCalculator'

export function processSaleRow(sale, returnsData = [], itemsBySaleId = {}) {
  const itemsFromRel = Array.isArray(sale.sembako_sale_items) && sale.sembako_sale_items.length > 0 ? sale.sembako_sale_items : null
  const itemsFromDirect = itemsBySaleId[sale.id] && itemsBySaleId[sale.id].length > 0 ? itemsBySaleId[sale.id] : null
  const itemsRaw = itemsFromRel || itemsFromDirect || []
  const items = itemsRaw.map(it => {
    const resolvedPrice = Number(it.sell_price || it.price_per_unit || it.unit_price || it.price_per_kg || (Number(it.quantity) > 0 && it.subtotal ? Number(it.subtotal) / Number(it.quantity) : 0) || 0)
    return {
      ...it,
      price_per_unit: resolvedPrice,
      sell_price: resolvedPrice
    }
  })

  const saleReturns = (returnsData || []).filter(r => {
    if (!r || r.is_deleted) return false
    if (sale.id && (r.sale_id === sale.id || String(r.sale_id) === String(sale.id))) return true
    if (sale.invoice_number && r.invoice_number && String(r.invoice_number).trim() === String(sale.invoice_number).trim()) return true
    return false
  })

  const totalReturnAmount = saleReturns.reduce((sum, r) => {
    const amt = Number(r.total_amount || r.amount || 0)
    if (amt > 0) return sum + amt
    const matchItem = items.find(i => i.product_id === r.product_id || i.product_name === r.product_name)
    const price = Number(r.unit_price || matchItem?.price_per_unit || 0)
    return sum + (Number(r.quantity || 0) * price)
  }, 0)

  const payments = Array.isArray(sale.sembako_payments) ? sale.sembako_payments.filter(p => !p.is_deleted) : []
  const paidFromPayments = payments
    .filter(p => Number(p.amount || p.amount_paid || 0) > 0 && p.payment_method !== 'pengembalian_tunai_retur')
    .reduce((s, p) => s + (Number(p.amount || p.amount_paid) || 0), 0)
  const refundFromPayments = payments
    .filter(p => p.payment_method === 'pengembalian_tunai_retur' || Number(p.amount || p.amount_paid || 0) < 0)
    .reduce((s, p) => s + Math.abs(Number(p.amount || p.amount_paid || 0)), 0)
  const itemsSubtotal = items.reduce((s, i) => s + Math.round((i.quantity || 0) * (i.price_per_unit || 0)), 0)
  const deliveryCost = Number(sale.delivery_cost) || 0
  const otherCost = Number(sale.other_cost) || 0

  const initialSubtotal = itemsSubtotal > 0
    ? itemsSubtotal
    : (Number(sale.subtotal) > 0 ? Number(sale.subtotal) : Number(sale.total_amount) + totalReturnAmount)

  const total_amount = Math.max(0, initialSubtotal - totalReturnAmount)

  const netPaidFromPayments = Math.max(0, paidFromPayments - refundFromPayments)
  const raw_paid = Math.max(Number(sale.paid_amount || 0), netPaidFromPayments)
  const is_overpaid = raw_paid > total_amount
  const overpay_amount = is_overpaid ? (raw_paid - total_amount) : 0
  const paid_amount = Math.min(total_amount, raw_paid)
  const remaining_amount = Math.max(0, total_amount - paid_amount)
  const payment_status = remaining_amount <= 0 && total_amount > 0 ? 'lunas' : paid_amount > 0 ? 'sebagian' : (sale.payment_status || 'belum_lunas')

  const cogsFromItems = items.reduce((s, i) => s + Math.round((i.quantity || 0) * (i.cogs_per_unit || 0)), 0)
  const fallbackCogs = items.reduce((s, i) => s + Math.round((i.quantity || 0) * (Number(i.cogs_per_unit || i.buy_price || 0) || (i.price_per_unit * 0.75))), 0)
  const totalCogs = Number(sale.total_cogs) || cogsFromItems || fallbackCogs || Math.round(itemsSubtotal * 0.75)
  const returnCogs = saleReturns.reduce((s, r) => {
    const matchItem = items.find(i => i.product_id === r.product_id || i.product_name === r.product_name)
    const cogs = Number(r.cogs_per_unit || matchItem?.cogs_per_unit || (matchItem ? matchItem.price_per_unit * 0.75 : 80000))
    return s + Math.round((Number(r.quantity) || 0) * cogs)
  }, 0)
  const effectiveCogs = Math.max(0, totalCogs - returnCogs)
  // gross_profit = Revenue (after returns) - COGS (after returns) — valid metric, not an estimate
  const grossProfit = Math.max(0, (itemsSubtotal - totalReturnAmount) - effectiveCogs)
  const totalExpenses = deliveryCost + otherCost
  const computedNetProfit = Math.max(0, grossProfit - totalExpenses)
  // Fallback: use DB net_profit if > 0 and no returns, otherwise compute from transaction data
  const net_profit = (totalReturnAmount > 0)
    ? computedNetProfit
    : ((Number(sale.net_profit) > 0) ? Number(sale.net_profit) : computedNetProfit)

  return {
    ...sale,
    items,
    sembako_sale_items: items,
    subtotal: initialSubtotal,
    delivery_cost: deliveryCost,
    other_cost: otherCost,
    total_cogs: effectiveCogs,
    net_profit,
    gross_profit: grossProfit,   // Revenue - COGS (pre-ops deduction)
    total_amount,
    paid_amount,
    raw_paid_amount: raw_paid,
    is_overpaid,
    overpay_amount,
    remaining_amount,
    payment_status,
    customer_name: sale.customer_name || sale.sembako_customers?.customer_name || 'Pelanggan',
  }
}

export const useSembakoSales = () => {
  const { tenant } = useAuth()
  return useQuery({
    queryKey: ['sembako-sales', tenant?.id],
    enabled: !!tenant?.id,
    staleTime: STALE_5M,
    queryFn: async () => {
      try {
        const { data, error } = await supabase.from('sembako_sales')
          .select('*, sembako_customers(customer_name, customer_type, phone), sembako_sale_items(*), sembako_deliveries(id, status), sembako_payments(*)')
          .eq('tenant_id', tenant.id)
          .eq('is_deleted', false)
          .order('transaction_date', { ascending: false })
          .order('created_at', { ascending: false })
        if (error) { console.warn('[useSembakoSales]', error.message); return [] }

        const saleIds = (data || []).map(s => s.id)
        const itemsBySaleId = {}
        if (saleIds.length > 0) {
          const { data: directItems } = await supabase
            .from('sembako_sale_items')
            .select('*')
            .in('sale_id', saleIds)
          if (directItems) {
            directItems.forEach(it => {
               if (!itemsBySaleId[it.sale_id]) itemsBySaleId[it.sale_id] = []
               itemsBySaleId[it.sale_id].push(it)
            })
          }
        }

        const { data: dbReturns } = await supabase
          .from('sembako_returns')
          .select('*')
          .eq('tenant_id', tenant.id)
          .eq('is_deleted', false)

        let localReturns = []
        try {
          const saved = localStorage.getItem('erp_retur_list')
          if (saved) localReturns = JSON.parse(saved)
        } catch (e) { }

        // Deduplicate returns by ID to prevent double subtraction of synced records
        const returnsMap = {}
        const returnsData = []
        if (dbReturns) {
          dbReturns.forEach(r => {
            if (r.id) {
              returnsMap[r.id] = r
              returnsData.push(r)
            }
          })
        }
        localReturns.forEach(r => {
          if (r.id) {
            if (!returnsMap[r.id]) {
              returnsMap[r.id] = r
              returnsData.push(r)
            }
          } else {
            returnsData.push(r)
          }
        })

        const sortedSales = [...(data || [])].sort((a, b) => {
          const timeA = new Date(a.created_at || (a.transaction_date ? `${a.transaction_date}T00:00:00.000Z` : 0)).getTime()
          const timeB = new Date(b.created_at || (b.transaction_date ? `${b.transaction_date}T00:00:00.000Z` : 0)).getTime()
          return timeB - timeA
        })

        return sortedSales.map(sale => processSaleRow(sale, returnsData, itemsBySaleId))
      } catch (e) { console.warn('[useSembakoSales]', e); return [] }
    }
  })
}

// ── Helper to deduct BOM & Packaging materials from sembako_raw_materials ──────
async function deductRawMaterialsAndPackaging({ tenant_id, items, packing_details, invoice_number }) {
  if (!tenant_id || !Array.isArray(items) || items.length === 0) return

  try {
    const { data: rawMaterials, error } = await supabase
      .from('sembako_raw_materials')
      .select('*')
      .eq('tenant_id', tenant_id)
      .eq('is_deleted', false)

    if (error || !rawMaterials || rawMaterials.length === 0) return

    // Enrich items with category/notes from master products if missing
    const { data: prods } = await supabase
      .from('sembako_products')
      .select('id, category, notes, product_name')
      .eq('tenant_id', tenant_id)

    const prodMap = Object.fromEntries((prods || []).map(p => [p.id, p]))
    const enrichedItems = items.map(it => {
      const p = it.product_id ? prodMap[it.product_id] : null
      return {
        ...it,
        category: it.category || p?.category || '',
        notes: it.notes || p?.notes || '',
        product_name: it.product_name || p?.product_name || ''
      }
    })

    const materialDeductions = {} // { material_id: { material, deductQty, reason } }

    // 1. Deduct Product-specific BOM (Pouch, Stiker Depan, Stiker Belakang, Bawang Curah)
    for (const item of enrichedItems) {
      const itemQty = Number(item.quantity) || 0
      if (itemQty <= 0) continue

      const nameLower = (item.product_name || '').toLowerCase()
      const isBundling = (item.category === 'Paket Bundling & Combo') || nameLower.includes('paket') || nameLower.includes('bundling')

      let multiplier = 1
      let gramPerPcs = extractProductGrammage(item.product_name, item.notes)

      if (isBundling) {
        if (nameLower.includes('trio') || nameLower.includes('3x100')) {
          multiplier = 3
          gramPerPcs = 300
        } else if (nameLower.includes('duo') || nameLower.includes('2x200')) {
          multiplier = 2
          gramPerPcs = 400
        } else if (nameLower.includes('reseller') || nameLower.includes('10')) {
          multiplier = 10
          gramPerPcs = 2500
        } else if (nameLower.includes('resto') || nameLower.includes('2 kg') || nameLower.includes('2kg')) {
          multiplier = 1
          gramPerPcs = 2000
        }
      }

      // Match Pouch / Toples
      const matchedPouch = matchKemasanMaterial(item, rawMaterials)
      if (matchedPouch) {
        const totalPouchDeduct = itemQty * multiplier
        materialDeductions[matchedPouch.id] = {
          material: matchedPouch,
          deductQty: (materialDeductions[matchedPouch.id]?.deductQty || 0) + totalPouchDeduct,
          reason: `Kemasan ${item.product_name}`
        }
      }

      // Match Stiker Depan
      const stickerDepan = matchStickerFrontMaterial(item, rawMaterials)
      if (stickerDepan) {
        const totalStickerDeduct = itemQty * multiplier
        materialDeductions[stickerDepan.id] = {
          material: stickerDepan,
          deductQty: (materialDeductions[stickerDepan.id]?.deductQty || 0) + totalStickerDeduct,
          reason: `Stiker Depan ${item.product_name}`
        }
      }

      // Match Stiker Belakang
      const stickerBelakang = matchStickerBackMaterial(item, rawMaterials)
      if (stickerBelakang) {
        const totalStickerDeduct = itemQty * multiplier
        materialDeductions[stickerBelakang.id] = {
          material: stickerBelakang,
          deductQty: (materialDeductions[stickerBelakang.id]?.deductQty || 0) + totalStickerDeduct,
          reason: `Stiker Belakang ${item.product_name}`
        }
      }

      // Match Bawang Curah sesuai Grade & Gramatur
      const bawangCurah = matchBawangMaterial(item, rawMaterials)
      if (bawangCurah) {
        const isKg = (bawangCurah.unit || '').toLowerCase() === 'kg'
        const deductAmt = isKg ? (itemQty * gramPerPcs / 1000) : (itemQty * gramPerPcs)

        materialDeductions[bawangCurah.id] = {
          material: bawangCurah,
          deductQty: (materialDeductions[bawangCurah.id]?.deductQty || 0) + deductAmt,
          reason: `Bawang curah ${item.product_name}`
        }
      }
    }

    // 2. Deduct Transaction Secondary Packing (Polymailer per 1-4 pouch / Kardus)
    const polymailerQty = packing_details?.quantity !== undefined
      ? Number(packing_details.quantity)
      : Math.ceil(items.reduce((s, i) => s + (Number(i.quantity) || 0), 0) / 4)

    if (polymailerQty > 0 && packing_details?.packing_type !== 'none') {
      const isKardus = packing_details?.packing_type === 'kardus'
      const packingMat = isKardus
        ? (rawMaterials.find(r => (r.category || '').toLowerCase() === 'kardus' || (r.material_name || '').toLowerCase().includes('kardus') || (r.material_name || '').toLowerCase().includes('box')) || rawMaterials.find(r => (r.category || '').toLowerCase() === 'kardus'))
        : (rawMaterials.find(r => (r.category || '').toLowerCase() === 'polymailer' || (r.material_name || '').toLowerCase().includes('polymailer') || (r.material_name || '').toLowerCase().includes('plastik')) || rawMaterials.find(r => (r.category || '').toLowerCase() === 'polymailer'))

      if (packingMat) {
        materialDeductions[packingMat.id] = {
          material: packingMat,
          deductQty: (materialDeductions[packingMat.id]?.deductQty || 0) + polymailerQty,
          reason: `Kemasan ${isKardus ? 'Kardus Box' : 'Polymailer'} #${invoice_number || 'Sale'}`
        }
      }
    }

    // 3. Perform database updates on sembako_raw_materials
    for (const [matId, entry] of Object.entries(materialDeductions)) {
      const currentStock = Number(entry.material.current_stock) || 0
      const newStock = Math.max(0, currentStock - entry.deductQty)

      await supabase
        .from('sembako_raw_materials')
        .update({ current_stock: newStock })
        .eq('id', matId)

      try {
        recordAuditLog({
          action_type: 'BOM_DEDUCT',
          product_name: entry.material.material_name,
          old_value: `${currentStock} ${entry.material.unit}`,
          new_value: `${newStock} ${entry.material.unit} (-${entry.deductQty} ${entry.material.unit})`,
          notes: `Pemakaian bahan untuk penjualan #${invoice_number || 'Sale'} (${entry.reason})`,
          tenant_id
        })
      } catch (logErr) {
        console.warn('[deductRawMaterialsAndPackaging] Log warning:', logErr)
      }
    }

    // 4. Auto sync finished goods products stock from updated raw materials
    const { data: updatedRaw } = await supabase
      .from('sembako_raw_materials')
      .select('*')
      .eq('tenant_id', tenant_id)
      .eq('is_deleted', false)

    if (updatedRaw && prods) {
      for (const prod of prods) {
        const bomRes = calculateBomProductStock(prod, updatedRaw)
        if (bomRes && bomRes.totalStock !== undefined) {
          await supabase
            .from('sembako_products')
            .update({ current_stock: bomRes.totalStock })
            .eq('id', prod.id)
        }
      }
    }
  } catch (err) {
    console.warn('[deductRawMaterialsAndPackaging] Non-blocking error:', err)
  }
}

// ── Helper to restore BOM & Packaging materials on sale deletion ───────────────
async function restoreRawMaterialsAndPackaging({ tenant_id, sale_id }) {
  if (!tenant_id || !sale_id) return
  try {
    const { data: saleItems } = await supabase
      .from('sembako_sale_items')
      .select('*')
      .eq('sale_id', sale_id)

    if (!saleItems || saleItems.length === 0) return

    const { data: rawMaterials } = await supabase
      .from('sembako_raw_materials')
      .select('*')
      .eq('tenant_id', tenant_id)
      .eq('is_deleted', false)

    if (!rawMaterials || rawMaterials.length === 0) return

    const { data: prods } = await supabase
      .from('sembako_products')
      .select('id, category, notes, product_name')
      .eq('tenant_id', tenant_id)

    const prodMap = Object.fromEntries((prods || []).map(p => [p.id, p]))
    const enrichedItems = saleItems.map(item => ({
      ...item,
      category: item.category || (item.product_id ? prodMap[item.product_id]?.category : ''),
      notes: item.notes || (item.product_id ? prodMap[item.product_id]?.notes : '')
    }))

    for (const item of enrichedItems) {
      const itemQty = Number(item.quantity) || 0
      if (itemQty <= 0) continue

      const nameLower = (item.product_name || '').toLowerCase()
      const isBundling = (item.category === 'Paket Bundling & Combo') || nameLower.includes('paket') || nameLower.includes('bundling')

      let multiplier = 1
      let gramPerPcs = extractProductGrammage(item.product_name, item.notes)

      if (isBundling) {
        if (nameLower.includes('trio') || nameLower.includes('3x100')) {
          multiplier = 3
          gramPerPcs = 300
        } else if (nameLower.includes('duo') || nameLower.includes('2x200')) {
          multiplier = 2
          gramPerPcs = 400
        } else if (nameLower.includes('reseller') || nameLower.includes('10')) {
          multiplier = 10
          gramPerPcs = 2500
        } else if (nameLower.includes('resto') || nameLower.includes('2 kg') || nameLower.includes('2kg')) {
          multiplier = 1
          gramPerPcs = 2000
        }
      }

      // Restore Pouch
      const matchedPouch = matchKemasanMaterial(item, rawMaterials)
      if (matchedPouch) {
        const cur = Number(matchedPouch.current_stock) || 0
        await supabase.from('sembako_raw_materials').update({ current_stock: cur + (itemQty * multiplier) }).eq('id', matchedPouch.id)
      }

      // Restore Stiker Depan
      const stickerDepan = matchStickerFrontMaterial(item, rawMaterials)
      if (stickerDepan) {
        const cur = Number(stickerDepan.current_stock) || 0
        await supabase.from('sembako_raw_materials').update({ current_stock: cur + (itemQty * multiplier) }).eq('id', stickerDepan.id)
      }

      // Restore Stiker Belakang
      const stickerBelakang = matchStickerBackMaterial(item, rawMaterials)
      if (stickerBelakang) {
        const cur = Number(stickerBelakang.current_stock) || 0
        await supabase.from('sembako_raw_materials').update({ current_stock: cur + (itemQty * multiplier) }).eq('id', stickerBelakang.id)
      }

      // Restore Bawang Curah
      const bawangCurah = matchBawangMaterial(item, rawMaterials)
      if (bawangCurah) {
        const isKg = (bawangCurah.unit || '').toLowerCase() === 'kg'
        const addAmt = isKg ? (itemQty * gramPerPcs / 1000) : (itemQty * gramPerPcs)
        const cur = Number(bawangCurah.current_stock) || 0
        await supabase.from('sembako_raw_materials').update({ current_stock: cur + addAmt }).eq('id', bawangCurah.id)
      }
    }

    // Restore secondary packing (polymailer / kardus)
    const polymailerQty = Math.ceil(saleItems.reduce((s, i) => s + (Number(i.quantity) || 0), 0) / 4)
    if (polymailerQty > 0) {
      const packingMat = rawMaterials.find(r => (r.category || '').toLowerCase() === 'polymailer' || (r.material_name || '').toLowerCase().includes('polymailer') || (r.material_name || '').toLowerCase().includes('plastik'))
      if (packingMat) {
        const cur = Number(packingMat.current_stock) || 0
        await supabase.from('sembako_raw_materials').update({ current_stock: cur + polymailerQty }).eq('id', packingMat.id)
      }
    }

    // Auto sync finished goods products stock from restored raw materials
    const { data: updatedRaw } = await supabase
      .from('sembako_raw_materials')
      .select('*')
      .eq('tenant_id', tenant_id)
      .eq('is_deleted', false)

    if (updatedRaw && prods) {
      for (const prod of prods) {
        const bomRes = calculateBomProductStock(prod, updatedRaw)
        if (bomRes && bomRes.totalStock !== undefined) {
          await supabase
            .from('sembako_products')
            .update({ current_stock: bomRes.totalStock })
            .eq('id', prod.id)
        }
      }
    }
  } catch (e) {
    console.warn('[restoreRawMaterialsAndPackaging]', e)
  }
}


export const useCreateSembakoSale = () => {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: async ({ customer_id, customer_name, transaction_date,
      due_date, items, delivery_cost, other_cost, notes, packing_details }) => {
      const tenant_id = await getTenantId()

      // ── ATOMIC SUPABASE RPC TRANSACTION (Primary) ──────────────────────────
      try {
        const { data: rpcData, error: rpcError } = await supabase.rpc('create_sembako_sale_transaction', {
          p_tenant_id: tenant_id,
          p_customer_id: customer_id || null,
          p_customer_name: customer_name || 'Umum',
          p_transaction_date: transaction_date || new Date().toISOString(),
          p_due_date: due_date || null,
          p_delivery_cost: Number(delivery_cost) || 0,
          p_other_cost: Number(other_cost) || 0,
          p_notes: notes || '',
          p_items: items
        })

        if (!rpcError && rpcData?.id) {
          // Deduct linked BOM and polymailer packing materials
          await deductRawMaterialsAndPackaging({
            tenant_id,
            items,
            packing_details,
            invoice_number: rpcData.invoice_number
          })
          return rpcData
        }
        if (rpcError) {
          console.warn('[useCreateSembakoSale] RPC error:', rpcError)
          // Jika fungsi belum dibuat di DB (42883 / PGRST202), biarkan fallback client berjalan
          if (rpcError.code === '42883' || rpcError.code === 'PGRST202') {
            // fallback to client
          } else {
            // Lempar pesan error dari RPC langsung ke UI (misal: stok habis, akses ditolak, dll)
            throw new Error(rpcError.message || 'Gagal memproses transaksi penjualan')
          }
        }
      } catch (rpcErr) {
        if (rpcErr.message && !rpcErr.message.includes('create_sembako_sale_transaction')) {
          throw rpcErr
        }
        // Fallback to client preflight if RPC is not deployed yet
      }

      // ── FALLBACK CLIENT PREFLIGHT ──────────────────────────────────────────
      const dateStr = new Date().toISOString().slice(0, 10).replace(/-/g, '')
      const rand = Array.from(crypto.getRandomValues(new Uint8Array(3)))
        .map(b => b.toString(16).padStart(2, '0')).join('').toUpperCase().slice(0, 4)
      const invoice_number = `SMB-${dateStr}-${rand}`

      const itemFifoCogs = {}
      const itemBatchCache = {}

      for (const item of items) {
        if (!item.product_id) continue
        const { data: batches } = await supabase
          .from('sembako_stock_batches')
          .select('id, qty_sisa, buy_price')
          .eq('product_id', item.product_id)
          .eq('is_deleted', false)
          .gt('qty_sisa', 0)
          .order('created_at', { ascending: true })

        const available = (batches || []).reduce((s, b) => s + (b.qty_sisa || 0), 0)
        if (item.quantity > available) {
          throw new Error(`Stok ${item.product_name || 'produk'} tidak cukup — tersedia ${available} ${item.unit || 'unit'}, diminta ${item.quantity}`)
        }

        let remaining = item.quantity
        let totalCost = 0
        for (const batch of (batches || [])) {
          if (remaining <= 0) break
          const take = Math.min(batch.qty_sisa, remaining)
          totalCost += take * (batch.buy_price || 0)
          remaining -= take
        }
        itemFifoCogs[item.product_id] = item.quantity > 0 ? Math.round(totalCost / item.quantity) : 0
        itemBatchCache[item.product_id] = batches || []
      }

      const total_amount = items.reduce((s, i) => s + Math.round(i.quantity * i.price_per_unit), 0)
      const total_cogs = items.reduce((s, i) => s + Math.round(i.quantity * (i.product_id ? (itemFifoCogs[i.product_id] ?? i.cogs_per_unit ?? 0) : (i.cogs_per_unit || 0))), 0)

      // Compute net_profit at insert time so DB always has an accurate value
      const net_profit_insert = Math.max(0, total_amount - total_cogs - (delivery_cost || 0) - (other_cost || 0))

      const { data: sale, error: saleErr } = await supabase
        .from('sembako_sales').insert({
          tenant_id, customer_id, customer_name, invoice_number,
          transaction_date, due_date,
          total_amount, total_cogs,
          net_profit: net_profit_insert,
          delivery_cost: delivery_cost || 0,
          other_cost: other_cost || 0,
          payment_status: 'belum_lunas',
          paid_amount: 0,
          notes,
        }).select().single()
      if (saleErr) {
        logSupabaseError(saleErr, { table: 'sembako_sales', operation: 'insert', component: 'useSembakoData', actionName: 'sembako.sale.create' })
        throw normalizeSupabaseError(saleErr)
      }

      const itemsToInsert = items.map(item => {
        const p = item.price_per_unit || item.sell_price || item.unit_price || 0
        const c = item.product_id ? (itemFifoCogs[item.product_id] ?? item.cogs_per_unit ?? 0) : (item.cogs_per_unit || 0)
        const qty = item.quantity || 0
        return {
          sale_id: sale.id,
          product_id: item.product_id || null,
          product_name: item.product_name,
          unit: item.unit,
          quantity: qty,
          sell_price: p,                         // only valid column (no price_per_unit in DB)
          subtotal: Math.round(qty * p),
          cogs_per_unit: c,
          cogs_total: Math.round(qty * c),
        }
      })
      let { error: itemErr } = await supabase.from('sembako_sale_items').insert(itemsToInsert)
      if (itemErr) {
        logError({
          level: 'error', source: 'supabase', component: 'useSembakoData',
          actionName: 'sembako.sale.create.items',
          error: itemErr,
          metadata: { table: 'sembako_sale_items', operation: 'insert', partial: true, step: 'sale_items_insert', sale_id: sale.id },
        })
        throw normalizeSupabaseError(itemErr)
      }

      try {
        for (const item of items) {
          if (!item.product_id) continue
          let qtyToDeduct = item.quantity
          const batches = itemBatchCache[item.product_id] || []
          for (const batch of batches) {
            if (qtyToDeduct <= 0) break
            const deduct = Math.min(batch.qty_sisa, qtyToDeduct)
            const { error: batchErr } = await supabase.from('sembako_stock_batches').update({ qty_sisa: batch.qty_sisa - deduct }).eq('id', batch.id)
            if (batchErr) {
              logError({
                level: 'error', source: 'supabase', component: 'useSembakoData',
                actionName: 'sembako.sale.create.stock_deduct',
                error: batchErr,
                metadata: { table: 'sembako_stock_batches', operation: 'update', partial: true, step: 'stock_batches_deduct', sale_id: sale.id, batch_id: batch.id },
              })
              throw batchErr
            }
            const { error: outErr } = await supabase.from('sembako_stock_out').insert({
              tenant_id, product_id: item.product_id, batch_id: batch.id, sale_id: sale.id, qty_keluar: deduct, buy_price: batch.buy_price || 0,
            })
            if (outErr) {
              logError({
                level: 'error', source: 'supabase', component: 'useSembakoData',
                actionName: 'sembako.sale.create.stock_out',
                error: outErr,
                metadata: { table: 'sembako_stock_out', operation: 'insert', partial: true, step: 'stock_out_insert', sale_id: sale.id, batch_id: batch.id },
              })
              throw outErr
            }
            qtyToDeduct -= deduct
          }
          // Sync current_stock in sembako_products
          const { data: bTotals } = await supabase
            .from('sembako_stock_batches')
            .select('qty_sisa')
            .eq('product_id', item.product_id)
            .gt('qty_sisa', 0)
          const newCurrent = (bTotals || []).reduce((s, b) => s + (b.qty_sisa || 0), 0)
          await supabase.from('sembako_products').update({ current_stock: newCurrent }).eq('id', item.product_id)
        }

        // Deduct linked BOM and polymailer packing materials
        await deductRawMaterialsAndPackaging({
          tenant_id,
          items,
          packing_details,
          invoice_number: sale.invoice_number
        })
      } catch (deductErr) {
        await supabase.from('sembako_sale_items').delete().eq('sale_id', sale.id)
        await supabase.from('sembako_sales').delete().eq('id', sale.id)
        throw deductErr
      }
      return sale
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['sembako-sales'] })
      queryClient.invalidateQueries({ queryKey: ['sembako-products'] })
      queryClient.invalidateQueries({ queryKey: ['sembako-customers'] })
      queryClient.invalidateQueries({ queryKey: ['sembako-customer-invoices'] })
      queryClient.invalidateQueries({ queryKey: ['sembako-dashboard-stats'] })
      queryClient.invalidateQueries({ queryKey: ['sembako-raw-materials'] })
      queryClient.invalidateQueries({ queryKey: ['sembako-audit-logs'] })
      toast.success('Invoice berhasil dibuat')
    },
    onError: (err) => toast.error(normalizeSupabaseError(err).message),
  })
}

export const useUpdateSembakoSale = () => {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: async ({ id, updates, items }) => {
      const tenant_id = await getTenantId()

      if (updates.total_amount !== undefined) {
        const { data: sale } = await supabase
          .from('sembako_sales')
          .select('paid_amount')
          .eq('id', id)
          .single()

        if (sale) {
          const paidAmount = sale.paid_amount || 0
          const newTotal = updates.total_amount
          const newRemaining = Math.max(0, newTotal - paidAmount)
          const newStatus =
            paidAmount <= 0 ? 'belum_lunas'
              : paidAmount >= newTotal ? 'lunas'
                : 'sebagian'

          if (paidAmount > newTotal) {
            updates = { ...updates, _overpaid: paidAmount - newTotal }
          }

          updates = { ...updates, remaining_amount: newRemaining, payment_status: newStatus }
        }
      }

      if (items && items.length > 0) {
        // Restore old BOM raw materials first
        await restoreRawMaterialsAndPackaging({ tenant_id, sale_id: id })

        const { data: oldStockOuts } = await supabase
          .from('sembako_stock_out')
          .select('batch_id, qty_keluar, product_id, buy_price')
          .eq('sale_id', id)

        if (oldStockOuts && oldStockOuts.length > 0) {
          for (const rec of oldStockOuts) {
            const { data: batch } = await supabase
              .from('sembako_stock_batches')
              .select('qty_sisa')
              .eq('id', rec.batch_id)
              .single()
            if (batch) {
              await supabase.from('sembako_stock_batches')
                .update({ qty_sisa: (batch.qty_sisa || 0) + rec.qty_keluar })
                .eq('id', rec.batch_id)
            }
          }
          await supabase.from('sembako_stock_out').delete().eq('sale_id', id)
        }

        const editFifoCogs = {}
        const editBatchCache = {}
        try {
          for (const item of items) {
            if (!item.product_id) continue
            const { data: batches } = await supabase
              .from('sembako_stock_batches')
              .select('id, qty_sisa, buy_price')
              .eq('product_id', item.product_id)
              .eq('is_deleted', false)
              .gt('qty_sisa', 0)
              .order('created_at', { ascending: true })
            const available = (batches || []).reduce((s, b) => s + (b.qty_sisa || 0), 0)
            if (item.quantity > available) {
              throw new Error(
                `Stok ${item.product_name || 'produk'} tidak cukup — tersedia ${available} ${item.unit || 'unit'}, diminta ${item.quantity}`
              )
            }
            let remaining = item.quantity
            let totalCost = 0
            for (const b of (batches || [])) {
              if (remaining <= 0) break
              const take = Math.min(b.qty_sisa, remaining)
              totalCost += take * (b.buy_price || 0)
              remaining -= take
            }
            editFifoCogs[item.product_id] = item.quantity > 0 ? Math.round(totalCost / item.quantity) : 0
            editBatchCache[item.product_id] = batches || []
          }
        } catch (preflightErr) {
          for (const rec of (oldStockOuts || [])) {
            const { data: batch } = await supabase
              .from('sembako_stock_batches')
              .select('qty_sisa')
              .eq('id', rec.batch_id)
              .single()
            if (batch) {
              await supabase.from('sembako_stock_batches')
                .update({ qty_sisa: Math.max(0, (batch.qty_sisa || 0) - rec.qty_keluar) })
                .eq('id', rec.batch_id)
            }
            await supabase.from('sembako_stock_out').insert({
              tenant_id,
              product_id: rec.product_id,
              batch_id: rec.batch_id,
              sale_id: id,
              qty_keluar: rec.qty_keluar,
              buy_price: rec.buy_price || 0,
            })
          }
          throw preflightErr
        }

        const editTotalCogs = items.reduce((s, i) =>
          s + Math.round(i.quantity * (i.product_id
            ? (editFifoCogs[i.product_id] ?? i.cogs_per_unit ?? 0)
            : (i.cogs_per_unit || 0)
          )), 0)
        updates = { ...updates, total_cogs: editTotalCogs }

        await supabase.from('sembako_sale_items').delete().eq('sale_id', id)

        const itemsToInsert = items.map(item => {
          const p = item.price_per_unit || item.sell_price || item.unit_price || 0
          const c = item.product_id ? (editFifoCogs[item.product_id] ?? item.cogs_per_unit ?? 0) : (item.cogs_per_unit || 0)
          const qty = item.quantity || 0
          return {
            sale_id: id,
            product_id: item.product_id || null,
            product_name: item.product_name,
            unit: item.unit,
            quantity: qty,
            sell_price: p,                       // only valid column (no price_per_unit in DB)
            subtotal: Math.round(qty * p),
            cogs_per_unit: c,
            cogs_total: Math.round(qty * c),
          }
        })
        let { error: itemErr } = await supabase.from('sembako_sale_items').insert(itemsToInsert)
        if (itemErr) {
          logError({
            level: 'error', source: 'supabase', component: 'useSembakoData',
            actionName: 'sembako.sale.update.items_replace',
            error: itemErr,
            metadata: { table: 'sembako_sale_items', operation: 'insert', partial: true, step: 'sale_items_reinsert', sale_id: id },
          })
          throw itemErr
        }

        for (const item of items) {
          if (!item.product_id) continue
          let qtyToDeduct = item.quantity
          const batches = editBatchCache[item.product_id] || []

          for (const batch of batches) {
            if (qtyToDeduct <= 0) break
            const deduct = Math.min(batch.qty_sisa, qtyToDeduct)
            await supabase.from('sembako_stock_batches')
              .update({ qty_sisa: batch.qty_sisa - deduct })
              .eq('id', batch.id)
            await supabase.from('sembako_stock_out').insert({
              tenant_id,
              product_id: item.product_id,
              batch_id: batch.id,
              sale_id: id,
              qty_keluar: deduct,
              buy_price: batch.buy_price || 0,
            })
            qtyToDeduct -= deduct
          }
        }

        // Deduct new BOM raw materials and packaging
        await deductRawMaterialsAndPackaging({
          tenant_id,
          items,
          packing_details: updates.packing_details,
          invoice_number: updates.invoice_number
        })
      }

      const { _overpaid, ...cleanUpdates } = updates
      const { error } = await supabase.from('sembako_sales').update(cleanUpdates).eq('id', id)
      if (error) {
        logError({
          level: 'error', source: 'supabase', component: 'useSembakoData',
          actionName: 'sembako.sale.update.header',
          error,
          metadata: { table: 'sembako_sales', operation: 'update', partial: items && items.length > 0, step: 'sale_header_update', sale_id: id },
        })
        throw error
      }
      return { _overpaid, invoice_number: updates.invoice_number }
    },
    onSuccess: (result) => {
      queryClient.invalidateQueries({ queryKey: ['sembako-sales'] })
      queryClient.invalidateQueries({ queryKey: ['sembako-products'] })
      queryClient.invalidateQueries({ queryKey: ['sembako-customers'] })
      queryClient.invalidateQueries({ queryKey: ['sembako-customer-invoices'] })
      queryClient.invalidateQueries({ queryKey: ['sembako-customer-payments'] })
      queryClient.invalidateQueries({ queryKey: ['sembako-dashboard-stats'] })
      queryClient.invalidateQueries({ queryKey: ['sembako-all-batches'] })
      queryClient.invalidateQueries({ queryKey: ['sembako-stock-out'] })
      queryClient.invalidateQueries({ queryKey: ['sembako-raw-materials'] })
      queryClient.invalidateQueries({ queryKey: ['sembako-audit-logs'] })

      recordAuditLog({
        action_type: 'EDIT_TRANSAKSI',
        product_name: 'Penjualan / Invoice',
        old_value: 'Invoice lama',
        new_value: 'Invoice diperbarui',
        notes: `Penyesuaian/edit data transaksi invoice oleh owner`,
      })

      if (result?._overpaid) {
        const fmt = new Intl.NumberFormat('id-ID', { style: 'currency', currency: 'IDR', maximumFractionDigits: 0 })
        toast.warning(`Transaksi diperbarui — kelebihan bayar ${fmt.format(result._overpaid)} dicatat sebagai LUNAS`)
      } else {
        toast.success('Transaksi berhasil diperbarui')
      }
    },
    onError: (err) => toast.error(normalizeSupabaseError(err).message),
  })
}

export const useDeleteSembakoSale = () => {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: async (id) => {
      const { data: stockOuts } = await supabase
        .from('sembako_stock_out')
        .select('batch_id, qty_keluar')
        .eq('sale_id', id)

      if (stockOuts && stockOuts.length > 0) {
        for (const record of stockOuts) {
          const { data: batch } = await supabase
            .from('sembako_stock_batches')
            .select('qty_sisa')
            .eq('id', record.batch_id)
            .single()

          if (batch) {
            await supabase
              .from('sembako_stock_batches')
              .update({ qty_sisa: (batch.qty_sisa || 0) + record.qty_keluar })
              .eq('id', record.batch_id)
          }
        }
        await supabase.from('sembako_stock_out').delete().eq('sale_id', id)
      }

      const { error } = await supabase.from('sembako_sales')
        .update({ is_deleted: true })
        .eq('id', id)
      if (error) {
        logSupabaseError(error, { table: 'sembako_sales', operation: 'update', component: 'useSembakoData', actionName: 'sembako.sale.delete' })
        throw error
      }

      const { error: payDelErr } = await supabase.from('sembako_payments')
        .delete()
        .eq('sale_id', id)
      if (payDelErr) {
        logError({
          level: 'error', source: 'supabase', component: 'useSembakoData',
          actionName: 'sembako.sale.delete.payments_cleanup',
          error: payDelErr,
          metadata: { table: 'sembako_payments', operation: 'delete', partial: true, step: 'payments_delete', sale_id: id },
        })
      }

      try {
        const { data: saleData } = await supabase.from('sembako_sales').select('invoice_number').eq('id', id).single()
        const invNum = saleData?.invoice_number

        if (id) {
          await supabase.from('sembako_returns').update({ is_deleted: true }).eq('sale_id', id)
        }
        if (invNum) {
          await supabase.from('sembako_returns').update({ is_deleted: true }).eq('invoice_number', invNum)
        }

        const saved = localStorage.getItem('erp_retur_list')
        if (saved) {
          const list = JSON.parse(saved)
          const filtered = list.filter(r => r.sale_id !== id && String(r.sale_id) !== String(id) && (!invNum || r.invoice_number !== invNum))
          localStorage.setItem('erp_retur_list', JSON.stringify(filtered))
        }
      } catch (e) {
        console.warn('[useDeleteSembakoSale] retur cleanup warning:', e)
      }

      // Restore BOM & Packaging raw materials
      const tenant_id = await getTenantId()
      await restoreRawMaterialsAndPackaging({ tenant_id, sale_id: id })

      const { error: itemsDelErr } = await supabase.from('sembako_sale_items')
        .delete()
        .eq('sale_id', id)
      if (itemsDelErr) {
        logError({
          level: 'error', source: 'supabase', component: 'useSembakoData',
          actionName: 'sembako.sale.delete.items_cleanup',
          error: itemsDelErr,
          metadata: { table: 'sembako_sale_items', operation: 'delete', partial: true, step: 'sale_items_delete', sale_id: id },
        })
      }

      const { error: delivDelErr } = await supabase.from('sembako_deliveries')
        .delete()
        .eq('sale_id', id)
      if (delivDelErr) {
        logError({
          level: 'error', source: 'supabase', component: 'useSembakoData',
          actionName: 'sembako.sale.delete.deliveries_cleanup',
          error: delivDelErr,
          metadata: { table: 'sembako_deliveries', operation: 'delete', partial: true, step: 'deliveries_delete', sale_id: id },
        })
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['sembako-sales'] })
      queryClient.invalidateQueries({ queryKey: ['sembako-products'] })
      queryClient.invalidateQueries({ queryKey: ['sembako-raw-materials'] })
      queryClient.invalidateQueries({ queryKey: ['sembako-dashboard-stats'] })
      queryClient.invalidateQueries({ queryKey: ['sembako-all-batches'] })
      queryClient.invalidateQueries({ queryKey: ['sembako-customers'] })
      queryClient.invalidateQueries({ queryKey: ['sembako-customer-payments'] })
      queryClient.invalidateQueries({ queryKey: ['sembako-customer-invoices'] })
      queryClient.invalidateQueries({ queryKey: ['sembako-audit-logs'] })
      toast.success('Transaksi dihapus & Stok dikembalikan')
    },
    onError: (err) => toast.error(normalizeSupabaseError(err).message),
  })
}

export const useRecordSembakoPayment = () => {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: async ({ sale_id, customer_id, amount,
      payment_date, payment_method, reference_number, notes }) => {
      const tenant_id = await getTenantId()
      const cleanPayload = sanitizeDBPayload({
        tenant_id,
        sale_id: sale_id || null,
        customer_id: customer_id || null,
        amount: Number(amount) || 0,
        payment_date: payment_date || new Date().toISOString().slice(0, 10),
        payment_method: payment_method || 'cash',
        reference_number: reference_number || null,
        notes: notes || null,
      }, 'sembako_payments')
      const { error: payErr } = await supabase.from('sembako_payments').insert(cleanPayload)
      if (payErr) {
        logSupabaseError(payErr, { table: 'sembako_payments', operation: 'insert', component: 'useSembakoData', actionName: 'sembako.payment.create' })
        throw payErr
      }
      const { data: sale } = await supabase.from('sembako_sales').select('total_amount, paid_amount, remaining_amount').eq('id', sale_id).single()
      
      // Fetch returns to calculate net tagihan (total_amount minus returns)
      const { data: returnsData } = await supabase
        .from('sembako_returns')
        .select('total_amount')
        .eq('sale_id', sale_id)
        .eq('is_deleted', false)
        
      const totalReturnAmt = (returnsData || []).reduce((s, r) => s + Number(r.total_amount || 0), 0)
      const totAmt = Number(sale?.total_amount || 0)
      const netTotal = Math.max(0, totAmt - totalReturnAmt)
      
      const rawPaid = (Number(sale?.paid_amount) || 0) + (Number(amount) || 0)
      const newPaid = Math.min(netTotal, rawPaid)
      const newRemaining = Math.max(0, netTotal - newPaid)
      const newStatus = newRemaining <= 0 ? 'lunas' : (newPaid > 0 ? 'sebagian' : 'belum_lunas')
      
      const { error: saleSyncErr } = await supabase.from('sembako_sales').update({ 
        paid_amount: newPaid, 
        remaining_amount: newRemaining, 
        payment_status: newStatus 
      }).eq('id', sale_id)
      if (saleSyncErr) {
        logError({
          level: 'error', source: 'supabase', component: 'useSembakoData',
          actionName: 'sembako.payment.create.sale_sync',
          error: saleSyncErr,
          metadata: { table: 'sembako_sales', operation: 'update', partial: true, step: 'sale_paid_amount_sync', sale_id },
        })
      }

    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['sembako-sales'] })
      queryClient.invalidateQueries({ queryKey: ['sembako-customers'] })
      queryClient.invalidateQueries({ queryKey: ['sembako-customer-invoices'] })
      queryClient.invalidateQueries({ queryKey: ['sembako-dashboard-stats'] })
      toast.success('Pembayaran berhasil dicatat')
    },
    onError: (err) => toast.error(normalizeSupabaseError(err).message),
  })
}

export const useRefundSembakoSaleOverpay = () => {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: async ({ saleId, refundAmount, notes }) => {
      const tenant_id = await getTenantId()
      const refundVal = Math.abs(Number(refundAmount) || 0)
      if (!refundVal) return

      const { data: sale, error: fetchErr } = await supabase
        .from('sembako_sales')
        .select('id, customer_id, paid_amount, total_amount')
        .eq('id', saleId)
        .single()
      if (fetchErr) throw fetchErr

      const cleanPayload = sanitizeDBPayload({
        tenant_id,
        sale_id: saleId,
        customer_id: sale?.customer_id || null,
        amount: -refundVal,
        payment_date: new Date().toISOString().slice(0, 10),
        payment_method: 'pengembalian_tunai_retur',
        reference_number: `REFUND-${Date.now().toString().slice(-6)}`,
        notes: notes || 'Pengembalian uang tunai retur ke toko',
      }, 'sembako_payments')

      const { error: payErr } = await supabase.from('sembako_payments').insert(cleanPayload)
      if (payErr) {
        logSupabaseError(payErr, { table: 'sembako_payments', operation: 'insert', component: 'useSembakoData', actionName: 'sembako.refund.create' })
        throw payErr
      }

      const { data: returnsData } = await supabase
        .from('sembako_returns')
        .select('total_amount')
        .eq('sale_id', saleId)
        .eq('is_deleted', false)

      const totalReturnAmt = (returnsData || []).reduce((s, r) => s + Number(r.total_amount || 0), 0)
      const grossTotal = Number(sale?.total_amount || 0)
      const netTotal = Math.max(0, grossTotal - totalReturnAmt)

      const currentPaid = Number(sale?.paid_amount || 0)
      const newPaid = Math.max(0, currentPaid - refundVal)
      const newRemaining = Math.max(0, netTotal - newPaid)
      const newStatus = newRemaining <= 0 ? 'lunas' : (newPaid > 0 ? 'sebagian' : 'belum_lunas')

      const { error: saleSyncErr } = await supabase
        .from('sembako_sales')
        .update({ paid_amount: newPaid, remaining_amount: newRemaining, payment_status: newStatus })
        .eq('id', saleId)

      if (saleSyncErr) throw saleSyncErr
    },
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: ['sembako-sales'] })
      queryClient.invalidateQueries({ queryKey: ['sembako-returns'] })
      queryClient.invalidateQueries({ queryKey: ['sembako-customers'] })
      queryClient.invalidateQueries({ queryKey: ['sembako-customer-invoices'] })
      queryClient.invalidateQueries({ queryKey: ['sembako-dashboard-stats'] })
      queryClient.invalidateQueries({ queryKey: ['sembako-laporan'] })
      toast.success(`Pengembalian uang Rp ${formatIDR(variables.refundAmount)} berhasil dicatat & disimpan!`)
    },
    onError: (err) => toast.error(normalizeSupabaseError(err).message),
  })
}
