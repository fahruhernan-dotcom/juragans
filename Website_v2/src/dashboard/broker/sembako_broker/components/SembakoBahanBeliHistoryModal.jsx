import React, { useState, useMemo } from 'react'
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter
} from '@/components/ui/dialog'
import { useSembakoAuditLogs } from '@/lib/hooks/useSembakoAudit'
import { useSembakoSales } from '@/lib/hooks/sembako/sembakoSales'
import { useSembakoProducts, useSembakoRawMaterials } from '@/lib/hooks/useSembakoData'
import { useSembakoMaterialMutations } from '@/lib/hooks/sembako/sembakoMutations'
import { formatIDR, formatDate } from '@/lib/format'
import {
  extractProductGrammage,
  matchBawangMaterial,
  matchKemasanMaterial,
  matchStickerFrontMaterial,
  matchStickerBackMaterial
} from '@/lib/inventory/bomStockCalculator'
import {
  History,
  Search,
  Calendar,
  Store,
  User,
  PackageCheck,
  ShoppingBag,
  SlidersHorizontal,
  Lock,
  ArrowDownLeft,
  ArrowUpRight,
  Sparkles,
  Layers
} from 'lucide-react'

export function SembakoBahanBeliHistoryModal({ open, onOpenChange, material, onClose }) {
  const { data: logs = [], isLoading: isLogsLoading } = useSembakoAuditLogs()
  const { data: sales = [], isLoading: isSalesLoading } = useSembakoSales()
  const { data: products = [] } = useSembakoProducts()
  const { data: allRawMaterials = [] } = useSembakoRawMaterials()

  const matName = (material?.material_name || '').toLowerCase().trim()
  const matId = material?.id
  const unit = material?.unit || 'pcs'

  const { data: dbMutations = [], isLoading: isDbMutationsLoading } = useSembakoMaterialMutations(matId, material?.material_name)

  const [activeTab, setActiveTab] = useState('all') // 'all' | 'restock' | 'sales' | 'adjust'
  const [search, setSearch] = useState('')

  const handleClose = () => {
    if (onClose) onClose()
    if (onOpenChange) onOpenChange(false)
  }

  // 0. Format direct database mutations (from sembako_inventory_mutations)
  const formattedDbMutations = useMemo(() => {
    if (!dbMutations || dbMutations.length === 0) return []
    return dbMutations.map((m) => {
      const isOut = m.mutation_type === 'OUT'
      const isAdjust = m.mutation_type === 'ADJUST'
      const isInitial = m.action_type === 'INITIAL'

      let title = `Restok Bahan (${m.party_name || 'Supplier Mandiri'})`
      if (isInitial) title = `Saldo Awal Terdaftar (${m.party_name || 'Supplier Mandiri'})`
      else if (isOut) title = `Penjualan ${m.ref_number ? `#${m.ref_number}` : ''}`
      else if (isAdjust) title = `Penyesuaian Fisik (Opname)`

      return {
        id: `db-${m.id}`,
        type: isOut ? 'OUT' : isAdjust ? (Number(m.quantity) >= 0 ? 'ADJUST_PLUS' : 'ADJUST_MINUS') : 'IN',
        category: isOut ? 'sales' : isAdjust ? 'adjust' : 'restock',
        timestamp: m.created_at,
        title,
        supplier_name: m.party_name || 'Supplier Mandiri',
        customer_name: m.party_name || 'Pelanggan',
        invoice_number: m.ref_number || '',
        product_name: m.notes || m.material_name,
        user_name: m.created_by || 'Admin',
        qty: Math.abs(Number(m.quantity) || 0),
        unit: m.unit || unit,
        unit_cost: Number(m.unit_cost) || Number(material?.unit_cost) || 0,
        total_spent: Number(m.total_cost) || (Math.abs(Number(m.quantity) || 0) * Number(m.unit_cost || material?.unit_cost || 0)),
        prev_stock: m.prev_stock,
        new_stock: m.new_stock,
        notes: m.notes || '',
      }
    })
  }, [dbMutations, material, unit])

  // 1. Parse Sales / Usage (KELUAR) - matching BOM components, custom packaging, and secondary packing
  const salesUsageHistory = useMemo(() => {
    if (!material) return []
    const results = []

    const matCat = (material.category || '').toLowerCase()
    const isPouchMat = matCat === 'pouch' || matCat === 'toples' || matCat === 'kemasan' || matName.includes('pouch') || matName.includes('toples')
    const isBawangMat = matCat === 'bahan_baku' || matCat === 'bawang_mentah' || matCat === 'bawang_curah' || matName.includes('bawang')
    const isStickerFrontMat = matCat === 'sticker_depan' || matName.includes('stiker depan') || matName.includes('label depan')
    const isStickerBackMat = matCat === 'sticker_belakang' || matName.includes('stiker belakang') || matName.includes('label belakang')
    const isPolymailerMat = matCat === 'polymailer' || matName.includes('polymailer') || matName.includes('plastik packing')
    const isKardusMat = matCat === 'kardus' || matName.includes('kardus') || matName.includes('box')

    sales.forEach((sale) => {
      const saleItems = Array.isArray(sale.sembako_sale_items) && sale.sembako_sale_items.length > 0
        ? sale.sembako_sale_items
        : (sale.items || [])
      const totalSalePcs = saleItems.reduce((s, i) => s + (Number(i.quantity) || 0), 0)

      // 1A. Match each product sale item
      saleItems.forEach((it) => {
        const itemQty = Number(it.quantity) || 0
        if (itemQty <= 0) return

        const itNameLower = (it.product_name || '').toLowerCase()
        const isBundling = (it.category === 'Paket Bundling & Combo') || itNameLower.includes('paket') || itNameLower.includes('bundling')

        let multiplier = 1
        if (isBundling) {
          if (itNameLower.includes('trio') || itNameLower.includes('3x100')) multiplier = 3
          else if (itNameLower.includes('duo') || itNameLower.includes('2x200')) multiplier = 2
          else if (itNameLower.includes('reseller') || itNameLower.includes('10')) multiplier = 10
        }

        // Check custom packaging override
        const isMatchCustomId = it.custom_packaging_id && it.custom_packaging_id === matId
        const isMatchCustomName = it.custom_packaging_name && it.custom_packaging_name.toLowerCase().trim() === matName
        const isMatchCustomNotes = it.notes && it.notes.toLowerCase().includes(matName)
        const isCustomUsed = it.use_custom_packaging && (isMatchCustomId || isMatchCustomName || isMatchCustomNotes)

        if (isCustomUsed) {
          results.push({
            id: `sale-custom-${sale.id}-${it.id || Math.random()}`,
            type: 'OUT',
            category: 'sales',
            isCustom: true,
            timestamp: sale.transaction_date || sale.created_at,
            invoice_number: sale.invoice_number || 'Faktur Tanpa No',
            customer_name: sale.customer_name || 'Pelanggan',
            product_name: it.product_name,
            qty: itemQty * multiplier,
            unit: unit,
            custom_packaging_name: it.custom_packaging_name || material.material_name,
            custom_packaging_cost: Number(it.custom_packaging_cost) || Number(material.unit_cost) || 0,
            custom_packaging_note: it.custom_packaging_note || '',
            notes: it.notes || '',
            user_name: sale.created_by_name || 'Kasir',
          })
          return
        }

        // Match Standard Kemasan (Pouch / Toples)
        if (isPouchMat && !it.use_custom_packaging) {
          const matchedKemasan = matchKemasanMaterial(it, allRawMaterials.length > 0 ? allRawMaterials : [material])
          if (matchedKemasan && (matchedKemasan.id === matId || matchedKemasan.material_name?.toLowerCase().trim() === matName)) {
            results.push({
              id: `sale-pouch-${sale.id}-${it.id || Math.random()}`,
              type: 'OUT',
              category: 'sales',
              isCustom: false,
              timestamp: sale.transaction_date || sale.created_at,
              invoice_number: sale.invoice_number || 'Faktur Tanpa No',
              customer_name: sale.customer_name || 'Pelanggan',
              product_name: it.product_name,
              qty: itemQty * multiplier,
              unit: unit,
              custom_packaging_name: material.material_name,
              custom_packaging_cost: Number(material.unit_cost) || 0,
              custom_packaging_note: '',
              notes: `Pemakaian kemasan pouch ${it.product_name}`,
              user_name: sale.created_by_name || 'Kasir',
            })
          }
        }

        // Match Bawang Curah / Mentah
        if (isBawangMat) {
          const matchedBawang = matchBawangMaterial(it, allRawMaterials.length > 0 ? allRawMaterials : [material])
          if (matchedBawang && (matchedBawang.id === matId || matchedBawang.material_name?.toLowerCase().trim() === matName)) {
            const gramPerPcs = extractProductGrammage(it.product_name, it.notes)
            const isKg = (unit || '').toLowerCase() === 'kg'
            const deductAmt = isKg ? (itemQty * multiplier * gramPerPcs / 1000) : (itemQty * multiplier * gramPerPcs)

            results.push({
              id: `sale-bawang-${sale.id}-${it.id || Math.random()}`,
              type: 'OUT',
              category: 'sales',
              isCustom: false,
              timestamp: sale.transaction_date || sale.created_at,
              invoice_number: sale.invoice_number || 'Faktur Tanpa No',
              customer_name: sale.customer_name || 'Pelanggan',
              product_name: it.product_name,
              qty: deductAmt,
              unit: unit,
              custom_packaging_name: material.material_name,
              custom_packaging_cost: Number(material.unit_cost) || 0,
              custom_packaging_note: '',
              notes: `Bahan baku ${it.product_name} (${deductAmt} ${unit})`,
              user_name: sale.created_by_name || 'Kasir',
            })
          }
        }

        // Match Stiker Depan
        if (isStickerFrontMat) {
          const matchedSticker = matchStickerFrontMaterial(it, allRawMaterials.length > 0 ? allRawMaterials : [material])
          if (matchedSticker && (matchedSticker.id === matId || matchedSticker.material_name?.toLowerCase().trim() === matName)) {
            results.push({
              id: `sale-sf-${sale.id}-${it.id || Math.random()}`,
              type: 'OUT',
              category: 'sales',
              isCustom: false,
              timestamp: sale.transaction_date || sale.created_at,
              invoice_number: sale.invoice_number || 'Faktur Tanpa No',
              customer_name: sale.customer_name || 'Pelanggan',
              product_name: it.product_name,
              qty: itemQty * multiplier,
              unit: unit,
              custom_packaging_name: material.material_name,
              custom_packaging_cost: Number(material.unit_cost) || 0,
              custom_packaging_note: '',
              notes: `Stiker Depan ${it.product_name}`,
              user_name: sale.created_by_name || 'Kasir',
            })
          }
        }

        // Match Stiker Belakang
        if (isStickerBackMat) {
          const matchedSticker = matchStickerBackMaterial(it, allRawMaterials.length > 0 ? allRawMaterials : [material])
          if (matchedSticker && (matchedSticker.id === matId || matchedSticker.material_name?.toLowerCase().trim() === matName)) {
            results.push({
              id: `sale-sb-${sale.id}-${it.id || Math.random()}`,
              type: 'OUT',
              category: 'sales',
              isCustom: false,
              timestamp: sale.transaction_date || sale.created_at,
              invoice_number: sale.invoice_number || 'Faktur Tanpa No',
              customer_name: sale.customer_name || 'Pelanggan',
              product_name: it.product_name,
              qty: itemQty * multiplier,
              unit: unit,
              custom_packaging_name: material.material_name,
              custom_packaging_cost: Number(material.unit_cost) || 0,
              custom_packaging_note: '',
              notes: `Stiker Belakang ${it.product_name}`,
              user_name: sale.created_by_name || 'Kasir',
            })
          }
        }
      })

      // 1B. Secondary packing (Polymailer / Kardus)
      if (totalSalePcs > 0) {
        const packType = sale.packing_details?.packing_type
        const packQty = Number(sale.packing_details?.quantity) || 0

        if (isPolymailerMat && (packType === 'polymailer' || (!packType && packType !== 'none' && packType !== 'kardus'))) {
          const used = packQty > 0 ? packQty : Math.ceil(totalSalePcs / 4)
          if (used > 0) {
            results.push({
              id: `polymailer-${sale.id}`,
              type: 'OUT',
              category: 'sales',
              isCustom: false,
              timestamp: sale.transaction_date || sale.created_at,
              invoice_number: sale.invoice_number || 'Faktur Tanpa No',
              customer_name: sale.customer_name || 'Pelanggan',
              product_name: `Kemasan Polymailer (${totalSalePcs} pcs barang)`,
              qty: used,
              unit: unit,
              custom_packaging_name: material.material_name,
              custom_packaging_cost: Number(material.unit_cost) || 0,
              custom_packaging_note: '',
              notes: `Pengemasan paket pengiriman #${sale.invoice_number || 'Sale'}`,
              user_name: sale.created_by_name || 'Admin',
            })
          }
        } else if (isKardusMat && packType === 'kardus') {
          const used = packQty > 0 ? packQty : Math.ceil(totalSalePcs / 12)
          if (used > 0) {
            results.push({
              id: `kardus-${sale.id}`,
              type: 'OUT',
              category: 'sales',
              isCustom: false,
              timestamp: sale.transaction_date || sale.created_at,
              invoice_number: sale.invoice_number || 'Faktur Tanpa No',
              customer_name: sale.customer_name || 'Pelanggan',
              product_name: `Kemasan Kardus Box (${totalSalePcs} pcs barang)`,
              qty: used,
              unit: unit,
              custom_packaging_name: material.material_name,
              custom_packaging_cost: Number(material.unit_cost) || 0,
              custom_packaging_note: '',
              notes: `Pengemasan kardus box #${sale.invoice_number || 'Sale'}`,
              user_name: sale.created_by_name || 'Admin',
            })
          }
        }
      }
    })

    return results
  }, [sales, material, matName, matId, unit, allRawMaterials])

  // 2. Parse Restock History (MASUK) - including accurate initial registered stock
  const restockHistory = useMemo(() => {
    const rawLogs = logs
      .filter((l) => {
        if (l.action_type !== 'RESTOCK_BAHAN') return false
        if (material?.material_name && l.product_name !== material.material_name) return false
        return true
      })
      .map((l) => {
        let meta = {}
        try {
          if (l.notes && l.notes.startsWith('{')) {
            meta = JSON.parse(l.notes)
          }
        } catch {
          // ignore
        }

        const dateStr = l.timestamp || l.created_at
        return {
          id: `restock-${l.id}`,
          type: 'IN', // MASUK
          category: 'restock',
          timestamp: dateStr,
          title: `Restok Bahan (${meta.supplier_name || 'Supplier Mandiri'})`,
          supplier_name: meta.supplier_name || 'Supplier Mandiri',
          user_name: l.user_name || 'Admin',
          qty: Number(meta.qty_added) || 0,
          unit: meta.unit || unit,
          unit_cost: Number(meta.unit_cost) || Number(material?.unit_cost) || 0,
          total_spent: Number(meta.total_spent) || (Number(meta.qty_added || 0) * Number(meta.unit_cost || material?.unit_cost || 0)),
          prev_stock: meta.prev_stock,
          new_stock: meta.new_stock,
          notes: meta.notes || (l.notes && !l.notes.startsWith('{') ? l.notes : ''),
        }
      })

    // If there are no logs for restock, calculate accurate Initial Stock (Initial = current_stock + total_keluar or total_spent/unit_cost)
    if (material) {
      const totalKeluarPcs = salesUsageHistory.reduce((s, u) => s + (Number(u.qty) || 0), 0)
      const spentQty = (Number(material.total_spent) > 0 && Number(material.unit_cost) > 0)
        ? Math.round(Number(material.total_spent) / Number(material.unit_cost))
        : 0

      const calculatedInitialQty = Math.max(
        Number(material.current_stock || 0) + totalKeluarPcs,
        spentQty,
        Number(material.initial_stock || 0),
        Number(material.current_stock || 0)
      )

      const totalLoggedQty = rawLogs.reduce((s, r) => s + (Number(r.qty) || 0), 0)

      if (calculatedInitialQty > 0 && totalLoggedQty === 0) {
        rawLogs.push({
          id: `initial-${material.id}`,
          type: 'IN',
          category: 'restock',
          timestamp: material.created_at || new Date().toISOString(),
          title: `Saldo Awal Terdaftar (${material.supplier_name || 'Supplier Mandiri'})`,
          supplier_name: material.supplier_name || 'Supplier Mandiri',
          user_name: 'Pendaftaran Item',
          qty: calculatedInitialQty,
          unit: unit,
          unit_cost: Number(material.unit_cost) || 0,
          total_spent: Number(material.total_spent) || (calculatedInitialQty * (Number(material.unit_cost) || 0)),
          prev_stock: 0,
          new_stock: calculatedInitialQty,
          notes: 'Stok Terdaftar Pertama Kali / Saldo Awal Gudang',
        })
      }
    }

    return rawLogs.sort((a, b) => new Date(b.timestamp) - new Date(a.timestamp))
  }, [logs, material, unit, salesUsageHistory])

  // 3. Parse Stock Adjustments / Opname (PENYESUAIAN)
  const adjustHistory = useMemo(() => {
    return logs
      .filter((l) => {
        const isAdjustType = l.action_type === 'ADJUST_BAHAN' || l.action_type === 'OPNAME_BAHAN' || l.action_type === 'ADJUST_STOCK'
        if (!isAdjustType) return false
        if (material?.material_name && l.product_name !== material.material_name) return false
        return true
      })
      .map((l) => {
        let meta = {}
        try {
          if (l.notes && l.notes.startsWith('{')) {
            meta = JSON.parse(l.notes)
          }
        } catch {
          // ignore
        }

        const dateStr = l.timestamp || l.created_at
        const delta = meta.delta_qty !== undefined
          ? Number(meta.delta_qty)
          : (meta.new_stock !== undefined && meta.prev_stock !== undefined ? (Number(meta.new_stock) - Number(meta.prev_stock)) : 0)

        return {
          id: `adjust-${l.id}`,
          type: delta >= 0 ? 'ADJUST_PLUS' : 'ADJUST_MINUS',
          category: 'adjust',
          timestamp: dateStr,
          title: 'Penyesuaian Fisik (Opname)',
          user_name: l.user_name || 'Admin',
          qty: delta,
          unit: unit,
          prev_stock: meta.prev_stock,
          new_stock: meta.new_stock,
          notes: meta.notes || meta.reason || (l.notes && !l.notes.startsWith('{') ? l.notes : ''),
        }
      })
  }, [logs, material, unit])

  // 4. Combined and Unified Mutation Stream
  const allMutations = useMemo(() => {
    if (formattedDbMutations.length > 0) {
      return formattedDbMutations
    }
    const list = [...restockHistory, ...salesUsageHistory, ...adjustHistory]
    return list.sort((a, b) => new Date(b.timestamp) - new Date(a.timestamp))
  }, [formattedDbMutations, restockHistory, salesUsageHistory, adjustHistory])

  // Filtered list based on active tab and search
  const displayedMutations = useMemo(() => {
    return allMutations.filter((item) => {
      // Tab filter
      if (activeTab === 'restock' && item.category !== 'restock' && item.type !== 'IN') return false
      if (activeTab === 'sales' && item.category !== 'sales' && item.type !== 'OUT') return false
      if (activeTab === 'adjust' && item.category !== 'adjust' && !item.type.startsWith('ADJUST')) return false

      // Search filter
      if (!search || !search.trim()) return true
      const q = search.toLowerCase().trim()
      return (
        (item.supplier_name && item.supplier_name.toLowerCase().includes(q)) ||
        (item.invoice_number && item.invoice_number.toLowerCase().includes(q)) ||
        (item.customer_name && item.customer_name.toLowerCase().includes(q)) ||
        (item.product_name && item.product_name.toLowerCase().includes(q)) ||
        (item.custom_packaging_note && item.custom_packaging_note.toLowerCase().includes(q)) ||
        (item.notes && item.notes.toLowerCase().includes(q)) ||
        (item.user_name && item.user_name.toLowerCase().includes(q)) ||
        (item.title && item.title.toLowerCase().includes(q))
      )
    })
  }, [allMutations, activeTab, search])

  // Summary Metrics
  const stats = useMemo(() => {
    if (formattedDbMutations.length > 0) {
      const inList = formattedDbMutations.filter((m) => m.type === 'IN')
      const outList = formattedDbMutations.filter((m) => m.type === 'OUT')
      const adjustList = formattedDbMutations.filter((m) => m.category === 'adjust')

      const totalMasukQty = inList.reduce((acc, h) => acc + (Number(h.qty) || 0), 0)
      const totalMasukRp = inList.reduce((acc, h) => acc + (Number(h.total_spent) || 0), 0)
      const totalKeluarQty = outList.reduce((acc, h) => acc + (Number(h.qty) || 0), 0)
      const totalKeluarRp = totalKeluarQty * (Number(material?.unit_cost) || 0)

      return {
        totalMasukQty,
        totalMasukRp,
        totalKeluarQty,
        totalKeluarRp,
        restockCount: inList.length,
        salesCount: outList.length,
        adjustCount: adjustList.length
      }
    }

    const totalMasukQty = restockHistory.reduce((acc, h) => acc + (Number(h.qty) || 0), 0)
    const totalMasukRp = restockHistory.reduce((acc, h) => acc + (Number(h.total_spent) || 0), 0)
    const totalKeluarQty = salesUsageHistory.reduce((acc, h) => acc + (Number(h.qty) || 0), 0)
    const totalKeluarRp = totalKeluarQty * (Number(material?.unit_cost) || 0)
    const restockCount = restockHistory.length
    const salesCount = salesUsageHistory.length
    const adjustCount = adjustHistory.length

    return {
      totalMasukQty,
      totalMasukRp,
      totalKeluarQty,
      totalKeluarRp,
      restockCount,
      salesCount,
      adjustCount
    }
  }, [formattedDbMutations, restockHistory, salesUsageHistory, adjustHistory, material])

  const titleText = material
    ? `Riwayat Mutasi: ${material.material_name}`
    : 'Rekap Riwayat Mutasi Stok Bahan Baku & Kemasan'

  const isLoading = isLogsLoading || isSalesLoading

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="w-full max-w-3xl bg-white dark:bg-[#0E1726] text-slate-900 dark:text-slate-100 rounded-3xl border border-slate-200 dark:border-white/10 p-0 overflow-hidden shadow-2xl max-h-[92vh] flex flex-col">
        {/* Header */}
        <DialogHeader className="p-5 bg-amber-50/70 dark:bg-amber-950/20 border-b border-amber-200/50 dark:border-amber-500/20 flex-shrink-0">
          <div className="flex items-center gap-3 pr-10">
            <div className="w-10 h-10 rounded-2xl bg-amber-500 text-white flex items-center justify-center font-bold shadow-md shrink-0">
              <History size={20} />
            </div>
            <div className="min-w-0 flex-1">
              <DialogTitle className="text-base font-black text-slate-900 dark:text-white font-['Sora'] truncate">
                {titleText}
              </DialogTitle>
              <DialogDescription className="text-xs text-slate-500 dark:text-slate-400 font-medium mt-0.5">
                {material ? (
                  <>
                    Stok Fisik Tersedia: <span className="font-bold text-foreground">{material.current_stock} {unit}</span> · HPP Satuan: <span className="font-bold text-amber-600 dark:text-amber-400">{formatIDR(material.unit_cost)}/{unit}</span>
                  </>
                ) : (
                  'Catatan lengkap mutasi masuk (restok) dan mutasi keluar (penjualan/produksi).'
                )}
              </DialogDescription>
            </div>
          </div>

          {/* 4 Summary Cards: Masuk, Keluar, Stok Sisa, HPP */}
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5 mt-4">
            {/* Total Masuk */}
            <div className="p-3 rounded-2xl bg-emerald-500/10 border border-emerald-500/20">
              <div className="flex items-center justify-between text-[10px] font-bold uppercase text-emerald-800 dark:text-emerald-300 tracking-wider">
                <span>Total Masuk</span>
                <ArrowDownLeft size={13} className="text-emerald-600" />
              </div>
              <p className="text-base font-black text-emerald-700 dark:text-emerald-400 mt-0.5">
                +{stats.totalMasukQty} <span className="text-xs font-semibold">{unit}</span>
              </p>
              <p className="text-[10px] text-emerald-800/70 dark:text-emerald-400/70 font-medium">
                {stats.restockCount}x restok ({formatIDR(stats.totalMasukRp)})
              </p>
            </div>

            {/* Total Keluar */}
            <div className="p-3 rounded-2xl bg-rose-500/10 border border-rose-500/20">
              <div className="flex items-center justify-between text-[10px] font-bold uppercase text-rose-800 dark:text-rose-300 tracking-wider">
                <span>Total Keluar</span>
                <ArrowUpRight size={13} className="text-rose-600" />
              </div>
              <p className="text-base font-black text-rose-700 dark:text-rose-400 mt-0.5">
                -{stats.totalKeluarQty} <span className="text-xs font-semibold">{unit}</span>
              </p>
              <p className="text-[10px] text-rose-800/70 dark:text-rose-400/70 font-medium">
                {stats.salesCount}x pesanan penjualan
              </p>
            </div>

            {/* Sisa Stok */}
            <div className="p-3 rounded-2xl bg-amber-500/10 border border-amber-500/20">
              <div className="flex items-center justify-between text-[10px] font-bold uppercase text-amber-800 dark:text-amber-300 tracking-wider">
                <span>Sisa Stok Fisik</span>
                <Layers size={13} className="text-amber-600" />
              </div>
              <p className="text-base font-black text-amber-800 dark:text-amber-300 mt-0.5">
                {material?.current_stock ?? 0} <span className="text-xs font-semibold">{unit}</span>
              </p>
              <p className="text-[10px] text-amber-800/70 dark:text-amber-300/70 font-medium">
                Aset: {formatIDR((Number(material?.current_stock) || 0) * (Number(material?.unit_cost) || 0))}
              </p>
            </div>

            {/* HPP Beli Satuan (FIFO) */}
            <div className="p-3 rounded-2xl bg-slate-100 dark:bg-white/5 border border-slate-200 dark:border-white/10">
              <p className="text-[10px] font-bold uppercase text-slate-500 tracking-wider">HPP Beli (FIFO)</p>
              <p className="text-base font-black text-slate-900 dark:text-white mt-0.5">
                {formatIDR(material?.unit_cost || 0)}
              </p>
              <p className="text-[10px] text-muted-foreground truncate">
                {material?.supplier_name ? `Supplier: ${material.supplier_name}` : 'Supplier Mandiri'}
              </p>
            </div>
          </div>

          {/* Tab Filter Switcher */}
          <div className="flex items-center gap-1.5 mt-3 overflow-x-auto scrollbar-hide">
            <button
              onClick={() => setActiveTab('all')}
              className={`py-1.5 px-3 rounded-xl text-xs font-bold transition-all cursor-pointer whitespace-nowrap ${
                activeTab === 'all'
                  ? 'bg-amber-500 text-slate-950 shadow-sm'
                  : 'bg-white/80 dark:bg-white/5 text-muted-foreground hover:text-foreground'
              }`}
            >
              Semua Mutasi ({allMutations.length})
            </button>
            <button
              onClick={() => setActiveTab('restock')}
              className={`py-1.5 px-3 rounded-xl text-xs font-bold transition-all cursor-pointer whitespace-nowrap flex items-center gap-1 ${
                activeTab === 'restock'
                  ? 'bg-emerald-600 text-white shadow-sm'
                  : 'bg-white/80 dark:bg-white/5 text-muted-foreground hover:text-foreground'
              }`}
            >
              <PackageCheck size={13} />
              <span>Masuk / Restok ({stats.restockCount})</span>
            </button>
            <button
              onClick={() => setActiveTab('sales')}
              className={`py-1.5 px-3 rounded-xl text-xs font-bold transition-all cursor-pointer whitespace-nowrap flex items-center gap-1 ${
                activeTab === 'sales'
                  ? 'bg-rose-600 text-white shadow-sm'
                  : 'bg-white/80 dark:bg-white/5 text-muted-foreground hover:text-foreground'
              }`}
            >
              <ShoppingBag size={13} />
              <span>Keluar / Penjualan ({stats.salesCount})</span>
            </button>
            {stats.adjustCount > 0 && (
              <button
                onClick={() => setActiveTab('adjust')}
                className={`py-1.5 px-3 rounded-xl text-xs font-bold transition-all cursor-pointer whitespace-nowrap flex items-center gap-1 ${
                  activeTab === 'adjust'
                    ? 'bg-blue-600 text-white shadow-sm'
                    : 'bg-white/80 dark:bg-white/5 text-muted-foreground hover:text-foreground'
                }`}
              >
                <SlidersHorizontal size={13} />
                <span>Opname ({stats.adjustCount})</span>
              </button>
            )}
          </div>
        </DialogHeader>

        {/* Search Bar */}
        <div className="px-5 py-2.5 border-b border-slate-100 dark:border-white/5 bg-slate-50/50 dark:bg-white/[0.02] flex items-center gap-2 flex-shrink-0">
          <div className="relative flex-1">
            <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
            <input
              type="text"
              placeholder="Cari berdasarkan nama supplier, nomor faktur, nama pembeli, atau catatan khusus..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="w-full pl-9 pr-3.5 py-2 rounded-xl bg-white dark:bg-white/5 border border-slate-200 dark:border-white/10 text-xs text-slate-900 dark:text-white placeholder-slate-400 focus:outline-none focus:border-amber-500"
            />
          </div>
        </div>

        {/* Mutation Stream List */}
        <div className="flex-1 overflow-y-auto p-5 space-y-3">
          {isLoading ? (
            <div className="py-12 text-center text-xs text-slate-400">
              Memuat data riwayat mutasi...
            </div>
          ) : displayedMutations.length === 0 ? (
            <div className="py-12 text-center space-y-2">
              <div className="w-12 h-12 rounded-2xl bg-slate-100 dark:bg-white/5 flex items-center justify-center mx-auto text-slate-400">
                <History size={24} />
              </div>
              <p className="text-xs font-bold text-slate-700 dark:text-slate-300">Belum Ada Riwayat Mutasi</p>
              <p className="text-[11px] text-slate-400 max-w-sm mx-auto">
                Riwayat akan otomatis bertambah ketika Anda melakukan <strong>+ Restok Bahan</strong> atau membuat <strong>Penjualan</strong> yang memakai bahan/kemasan ini.
              </p>
            </div>
          ) : (
            <div className="space-y-2.5">
              {displayedMutations.map((item) => {
                const isRestock = item.category === 'restock' || item.type === 'IN'
                const isSales = item.category === 'sales' || item.type === 'OUT'
                const isAdjust = item.category === 'adjust' || item.type.startsWith('ADJUST')

                return (
                  <div
                    key={item.id}
                    className={`p-3.5 rounded-2xl border transition-all flex flex-col sm:flex-row sm:items-center justify-between gap-3 text-xs ${
                      isRestock
                        ? 'bg-emerald-50/40 dark:bg-emerald-950/10 border-emerald-500/20 hover:border-emerald-500/40'
                        : isSales
                          ? 'bg-rose-50/40 dark:bg-rose-950/10 border-rose-500/20 hover:border-rose-500/40'
                          : 'bg-blue-50/40 dark:bg-blue-950/10 border-blue-500/20 hover:border-blue-500/40'
                    }`}
                  >
                    {/* Left Column: Date, Badge, Parties & Product details */}
                    <div className="space-y-1.5 min-w-0 flex-1">
                      <div className="flex items-center gap-2 flex-wrap">
                        <span className="flex items-center gap-1 font-bold text-slate-900 dark:text-white text-xs">
                          <Calendar size={12} className="text-slate-400" />
                          {formatDate(item.timestamp)}
                        </span>

                        {isRestock && (
                          <span className="px-2 py-0.5 rounded-md text-[10.5px] font-black bg-emerald-500/20 text-emerald-800 dark:text-emerald-300 border border-emerald-500/30 flex items-center gap-1">
                            <ArrowDownLeft size={11} /> +{item.qty} {item.unit} (MASUK)
                          </span>
                        )}

                        {isSales && (
                          <span className="px-2 py-0.5 rounded-md text-[10.5px] font-black bg-rose-500/20 text-rose-800 dark:text-rose-300 border border-rose-500/30 flex items-center gap-1">
                            <ArrowUpRight size={11} /> -{item.qty} {item.unit} (KELUAR)
                          </span>
                        )}

                        {isAdjust && (
                          <span className="px-2 py-0.5 rounded-md text-[10.5px] font-black bg-blue-500/20 text-blue-800 dark:text-blue-300 border border-blue-500/30 flex items-center gap-1">
                            <SlidersHorizontal size={11} /> {item.qty >= 0 ? `+${item.qty}` : item.qty} {item.unit} (OPNAME)
                          </span>
                        )}

                        {item.isCustom && (
                          <span className="px-1.5 py-0.5 rounded text-[9.5px] font-bold bg-amber-500/20 text-amber-900 dark:text-amber-300 border border-amber-500/30 flex items-center gap-1">
                            <Sparkles size={10} /> Kustom Pouch
                          </span>
                        )}
                      </div>

                      {/* Details row */}
                      {isRestock && (
                        <div className="flex items-center gap-3 text-[11px] text-muted-foreground flex-wrap">
                          <span className="flex items-center gap-1 font-medium">
                            <Store size={11} className="text-slate-400" />
                            {item.supplier_name}
                          </span>
                          <span className="flex items-center gap-1 font-medium">
                            <User size={11} className="text-slate-400" />
                            {item.user_name}
                          </span>
                        </div>
                      )}

                      {isSales && (
                        <div className="flex items-center gap-2.5 text-[11px] text-foreground flex-wrap font-medium">
                          <span className="font-mono font-bold text-slate-700 dark:text-slate-300">{item.invoice_number}</span>
                          <span>•</span>
                          <span className="font-bold">{item.customer_name}</span>
                          <span>•</span>
                          <span className="text-muted-foreground">{item.product_name}</span>
                        </div>
                      )}

                      {isAdjust && (
                        <div className="flex items-center gap-2 text-[11px] text-muted-foreground">
                          <User size={11} className="text-slate-400" />
                          <span>Pencatat: {item.user_name}</span>
                          {item.prev_stock !== undefined && (
                            <span>(Stok Sebelum: {item.prev_stock} → Sesudah: {item.new_stock})</span>
                          )}
                        </div>
                      )}

                      {/* Internal Notes / Custom Packaging Notes */}
                      {item.custom_packaging_note && (
                        <div className="p-2 rounded-xl bg-amber-500/10 border border-amber-500/20 text-[11px] text-amber-900 dark:text-amber-300 space-y-0.5">
                          <div className="flex items-center gap-1 font-bold">
                            <Lock size={10} /> Catatan Internal Kemasan:
                          </div>
                          <p className="italic">"{item.custom_packaging_note}"</p>
                        </div>
                      )}

                      {item.notes && !item.custom_packaging_note && (
                        <p className="text-[10.5px] text-slate-500 dark:text-slate-400 italic">
                          "{item.notes}"
                        </p>
                      )}
                    </div>

                    {/* Right Column: Pricing & Financial Value */}
                    <div className="sm:text-right border-t sm:border-t-0 pt-2 sm:pt-0 border-slate-200 dark:border-white/5 flex sm:flex-col justify-between sm:justify-center items-center sm:items-end gap-1 shrink-0">
                      {isRestock && (
                        <>
                          <div>
                            <p className="text-[10px] text-muted-foreground">Harga Beli Satuan:</p>
                            <p className="font-extrabold text-xs text-slate-900 dark:text-white">
                              {formatIDR(item.unit_cost)} <span className="text-[10px] font-normal text-muted-foreground">/{item.unit}</span>
                            </p>
                          </div>
                          <div>
                            <p className="text-[10px] text-muted-foreground">Total Nota:</p>
                            <p className="font-black text-xs text-emerald-600 dark:text-emerald-400">
                              {formatIDR(item.total_spent)}
                            </p>
                          </div>
                        </>
                      )}

                      {isSales && (
                        <>
                          <div>
                            <p className="text-[10px] text-muted-foreground">Biaya HPP Kemasan:</p>
                            <p className="font-extrabold text-xs text-slate-900 dark:text-white">
                              {formatIDR(item.custom_packaging_cost || material?.unit_cost || 0)} <span className="text-[10px] font-normal text-muted-foreground">/{item.unit}</span>
                            </p>
                          </div>
                          <div>
                            <p className="text-[10px] text-muted-foreground">Nilai Terpakai:</p>
                            <p className="font-black text-xs text-rose-600 dark:text-rose-400">
                              {formatIDR(item.qty * (item.custom_packaging_cost || Number(material?.unit_cost) || 0))}
                            </p>
                          </div>
                        </>
                      )}

                      {isAdjust && (
                        <div>
                          <p className="text-[10px] text-muted-foreground">Status Koreksi:</p>
                          <p className="font-extrabold text-xs text-blue-600 dark:text-blue-400">
                            Opname Fisik
                          </p>
                        </div>
                      )}
                    </div>
                  </div>
                )
              })}
            </div>
          )}
        </div>

        {/* Footer */}
        <DialogFooter className="p-4 bg-slate-50 dark:bg-white/[0.02] border-t border-slate-100 dark:border-white/5 flex items-center justify-between flex-shrink-0">
          <span className="text-[11px] text-muted-foreground">
            Menampilkan <strong>{displayedMutations.length}</strong> dari <strong>{allMutations.length}</strong> riwayat mutasi
          </span>
          <button
            type="button"
            onClick={handleClose}
            className="px-5 py-2 rounded-xl bg-slate-900 dark:bg-white hover:bg-slate-800 dark:hover:bg-slate-100 text-white dark:text-slate-900 font-bold text-xs cursor-pointer transition shadow-sm"
          >
            Tutup
          </button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
