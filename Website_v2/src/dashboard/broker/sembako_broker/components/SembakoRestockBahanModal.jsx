import React, { useState, useEffect, useMemo } from 'react'
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter
} from '@/components/ui/dialog'
import { useRestockSembakoRawMaterial, useSembakoSuppliers, useCreateSembakoSupplier } from '@/lib/hooks/useSembakoData'
import { recordAuditLog } from '@/lib/hooks/useSembakoAudit'
import { recordInventoryMutation } from '@/lib/hooks/sembako/sembakoMutations'
import { useAuth } from '@/lib/hooks/useAuth'
import { formatRupiah, formatIDR } from '@/lib/format'
import { CustomSelect } from './sembakoSaleUtils'
import { PackagePlus, Calculator, ArrowRight, Store, FileText, CheckCircle2, X, Plus, Scissors, Layers, Sparkles, Building2, Phone, MapPin } from 'lucide-react'
import { toast } from 'sonner'

export function SembakoRestockBahanModal({ open, onOpenChange, material, onClose }) {
  const { profile } = useAuth()
  const restockMutation = useRestockSembakoRawMaterial()
  const { data: suppliers = [] } = useSembakoSuppliers()
  const createSupplierMutation = useCreateSembakoSupplier()

  const [addQty, setAddQty] = useState('')
  const [buyPricePerUnit, setBuyPricePerUnit] = useState('')
  const [totalSpent, setTotalSpent] = useState('')
  const [lastEdited, setLastEdited] = useState('unit')
  const [supplierName, setSupplierName] = useState('')
  const [notes, setNotes] = useState('')

  // Quick Add Supplier state
  const [showAddSupplierModal, setShowAddSupplierModal] = useState(false)
  const [newSupplierName, setNewSupplierName] = useState('')
  const [newSupplierPhone, setNewSupplierPhone] = useState('')
  const [newSupplierAddress, setNewSupplierAddress] = useState('')

  // Sticker calculation state
  const isSticker = useMemo(() => {
    const cat = String(material?.category || '').toLowerCase()
    const nm = String(material?.material_name || '').toLowerCase()
    return cat.includes('sticker') || cat.includes('stiker') || cat.includes('label') ||
           nm.includes('sticker') || nm.includes('stiker') || nm.includes('label') || nm.includes('cutting')
  }, [material])

  const [isStickerMode, setIsStickerMode] = useState(false)
  const [sheetCount, setSheetCount] = useState('')
  const [cuttingPerSheet, setCuttingPerSheet] = useState('12')
  const [printPricePerSheet, setPrintPricePerSheet] = useState('6500')
  const [includeCutting, setIncludeCutting] = useState(true)
  const [cuttingFeePerSheet, setCuttingFeePerSheet] = useState('6500')

  useEffect(() => {
    if (material && open) {
      setAddQty('')
      setBuyPricePerUnit(material.unit_cost ? String(Math.round(material.unit_cost)) : '')
      setTotalSpent('')
      setLastEdited('unit')
      setSupplierName(material.supplier_name || '')
      setNotes('')
      setShowAddSupplierModal(false)

      const stickerDetected = String(material?.category || '').toLowerCase().includes('sticker') ||
                              String(material?.category || '').toLowerCase().includes('stiker') ||
                              String(material?.material_name || '').toLowerCase().includes('cutting') ||
                              String(material?.material_name || '').toLowerCase().includes('stiker') ||
                              String(material?.material_name || '').toLowerCase().includes('label')
      setIsStickerMode(stickerDetected)
      setSheetCount('')
      setCuttingPerSheet('12')
      setPrintPricePerSheet('6500')
      setIncludeCutting(true)
      setCuttingFeePerSheet('6500')
    }
  }, [material, open])

  const handleClose = () => {
    if (onClose) onClose()
    if (onOpenChange) onOpenChange(false)
  }

  // Format number with Indonesian thousand separators (e.g. 130000 -> 130.000)
  const formatThousands = (val) => {
    if (!val && val !== 0) return ''
    const num = Number(val)
    return isNaN(num) ? '' : num.toLocaleString('id-ID')
  }

  // Recalculate sticker math based on latest parameters
  const recalculateStickerMath = ({
    sheets = sheetCount,
    cuts = cuttingPerSheet,
    printPrice = printPricePerSheet,
    cuttingFee = cuttingFeePerSheet,
    withCutting = includeCutting
  }) => {
    const nSheets = parseFloat(sheets) || 0
    const nCuts = parseFloat(cuts) || 12
    const nPrint = parseFloat(printPrice) || 0
    const nCutFee = withCutting ? (parseFloat(cuttingFee) || 0) : 0
    const costPerSheet = nPrint + nCutFee

    const nTotalPcs = Math.round(nSheets * nCuts)
    const nTotalNota = Math.round(nSheets * costPerSheet)
    const hppPcs = nCuts > 0 ? Math.round(costPerSheet / nCuts) : 0

    if (nTotalPcs > 0) {
      setAddQty(String(nTotalPcs))
    }
    if (nTotalNota > 0) {
      setTotalSpent(String(nTotalNota))
    }
    if (hppPcs > 0) {
      setBuyPricePerUnit(String(hppPcs))
    }
  }

  // Sticker event handlers
  const handleSheetCountChange = (val) => {
    const rawVal = val.replace(/[^0-9.]/g, '')
    setSheetCount(rawVal)
    recalculateStickerMath({ sheets: rawVal })
  }

  const handleCuttingPerSheetChange = (val) => {
    const rawVal = val.replace(/\D/g, '')
    setCuttingPerSheet(rawVal)
    recalculateStickerMath({ cuts: rawVal })
  }

  const handlePrintPriceChange = (val) => {
    const rawVal = val.replace(/\D/g, '')
    setPrintPricePerSheet(rawVal)
    recalculateStickerMath({ printPrice: rawVal })
  }

  const handleCuttingFeeChange = (val) => {
    const rawVal = val.replace(/\D/g, '')
    setCuttingFeePerSheet(rawVal)
    recalculateStickerMath({ cuttingFee: rawVal })
  }

  const handleIncludeCuttingToggle = (checked) => {
    setIncludeCutting(checked)
    recalculateStickerMath({ withCutting: checked })
  }

  // Dual-mode live sync: Unit Price <-> Total Spent
  const handleAddQtyChange = (val) => {
    const rawVal = val.replace(/[^0-9.]/g, '')
    setAddQty(rawVal)
    const nQty = parseFloat(rawVal) || 0
    if (nQty > 0) {
      if (lastEdited === 'total' && totalSpent) {
        const nTotal = parseFloat(totalSpent) || 0
        setBuyPricePerUnit(String(Math.round(nTotal / nQty)))
      } else if (buyPricePerUnit) {
        const nUnit = parseFloat(buyPricePerUnit) || 0
        setTotalSpent(String(Math.round(nUnit * nQty)))
      }
    }
  }

  const handleBuyPriceChange = (val) => {
    const rawVal = val.replace(/\D/g, '')
    setBuyPricePerUnit(rawVal)
    setLastEdited('unit')
    const nUnit = parseFloat(rawVal) || 0
    const nQty = parseFloat(addQty) || 0
    if (nQty > 0) {
      setTotalSpent(String(Math.round(nUnit * nQty)))
    }
  }

  const handleTotalSpentChange = (val) => {
    const rawVal = val.replace(/\D/g, '')
    setTotalSpent(rawVal)
    setLastEdited('total')
    const nTotal = parseFloat(rawVal) || 0
    const nQty = parseFloat(addQty) || 0
    if (nQty > 0) {
      setBuyPricePerUnit(String(Math.round(nTotal / nQty)))
    }
  }

  // Quick save new supplier
  const handleQuickAddSupplier = async (e) => {
    if (e) e.preventDefault()
    if (!newSupplierName.trim()) {
      toast.error('Nama Supplier / Percetakan wajib diisi')
      return
    }
    try {
      await createSupplierMutation.mutateAsync({
        supplier_name: newSupplierName.trim(),
        phone: newSupplierPhone.trim() || null,
        address: newSupplierAddress.trim() || null,
        category: isSticker ? 'percetakan' : 'vendor',
      })
      setSupplierName(newSupplierName.trim())
      setShowAddSupplierModal(false)
      setNewSupplierName('')
      setNewSupplierPhone('')
      setNewSupplierAddress('')
      toast.success(`Suplier "${newSupplierName.trim()}" berhasil disimpan & dipilih!`)
    } catch (err) {
      // toast error handled by mutation
    }
  }

  // Live Math Calculations
  const nAddQty = parseFloat(addQty) || 0
  const nPrevStock = parseFloat(material?.current_stock) || 0
  const nPrevUnitCost = parseFloat(material?.unit_cost) || 0
  const nBuyPrice = parseFloat(buyPricePerUnit) || 0
  const nBatchSpent = parseFloat(totalSpent) > 0 ? parseFloat(totalSpent) : (nAddQty * nBuyPrice)

  const newStock = nPrevStock + nAddQty
  const totalInventoryValue = (nPrevStock * nPrevUnitCost) + nBatchSpent
  const newUnitCost = newStock > 0 ? Math.round(totalInventoryValue / newStock) : (nBuyPrice || nPrevUnitCost)

  const costPerSheet = (parseFloat(printPricePerSheet) || 0) + (includeCutting ? (parseFloat(cuttingFeePerSheet) || 0) : 0)

  const handleSubmit = async (e) => {
    e.preventDefault()
    if (!material?.id) return
    if (nAddQty <= 0) {
      toast.error('Masukkan jumlah barang masuk (> 0)')
      return
    }

    const calculatedNotes = isStickerMode && sheetCount
      ? `${notes ? notes + ' | ' : ''}Cetak ${sheetCount} lbr A3+ @ Rp ${formatThousands(printPricePerSheet)} ${includeCutting ? `+ Cutting Rp ${formatThousands(cuttingFeePerSheet)}/lbr (${cuttingPerSheet} pcs/lbr)` : `(${cuttingPerSheet} pcs/lbr)`} | HPP Rp ${formatThousands(buyPricePerUnit)}/pcs`
      : notes

    try {
      await restockMutation.mutateAsync({
        id: material.id,
        material_name: material.material_name,
        prevStock: nPrevStock,
        prevUnitCost: nPrevUnitCost,
        prevTotalSpent: parseFloat(material.total_spent) || 0,
        addQty: nAddQty,
        buyPricePerUnit: nBuyPrice,
        batchTotalSpent: nBatchSpent,
        supplier_name: supplierName,
        notes: calculatedNotes
      })

      // 1. Record persistent inventory mutation in database
      recordInventoryMutation({
        material_id: material.id,
        material_name: material.material_name,
        material_category: material.category,
        mutation_type: 'IN',
        action_type: 'RESTOCK',
        quantity: nAddQty,
        unit: unitLabel,
        unit_cost: nBuyPrice,
        total_cost: nBatchSpent,
        prev_stock: nPrevStock,
        new_stock: newStock,
        ref_type: 'purchase',
        party_name: supplierName || material.supplier_name || 'Supplier Mandiri',
        notes: calculatedNotes || '',
        created_by: profile?.full_name || profile?.email || 'Admin',
      }).catch(() => {})

      // 2. Record transaction to audit logs / purchase history
      recordAuditLog({
        action_type: 'RESTOCK_BAHAN',
        product_name: material.material_name,
        old_value: `${nPrevStock} ${unitLabel} @ ${formatRupiah(nPrevUnitCost)}`,
        new_value: `+${nAddQty} ${unitLabel} @ ${formatRupiah(nBuyPrice)} (Total ${formatRupiah(nBatchSpent)}) | Stok Baru: ${newStock} ${unitLabel} @ ${formatRupiah(newUnitCost)}`,
        notes: JSON.stringify({
          supplier_name: supplierName || material.supplier_name || 'Supplier Mandiri',
          qty_added: nAddQty,
          unit: unitLabel,
          unit_cost: nBuyPrice,
          total_spent: nBatchSpent,
          prev_stock: nPrevStock,
          new_stock: newStock,
          sticker_sheets: isStickerMode ? sheetCount : null,
          cutting_per_sheet: isStickerMode ? cuttingPerSheet : null,
          print_price_per_sheet: isStickerMode ? printPricePerSheet : null,
          cutting_fee_per_sheet: isStickerMode && includeCutting ? cuttingFeePerSheet : null,
          notes: calculatedNotes || '',
          date: new Date().toISOString()
        }),
        profile,
      })

      handleClose()
    } catch {
      // handled in mutation
    }
  }

  if (!material) return null

  const unitLabel = material.unit || 'pcs'

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="w-full max-w-lg bg-white dark:bg-[#0E1726] text-slate-900 dark:text-slate-100 rounded-3xl border border-slate-200 dark:border-white/10 p-0 overflow-hidden shadow-2xl max-h-[92vh] flex flex-col">
        <DialogHeader className="p-5 bg-amber-50/70 dark:bg-amber-950/20 border-b border-amber-200/50 dark:border-amber-500/20 shrink-0 pr-12">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-2xl bg-amber-500 text-white flex items-center justify-center font-bold shadow-md shrink-0">
              <PackagePlus size={20} />
            </div>
            <div>
              <DialogTitle className="text-base font-black text-slate-900 dark:text-white font-['Sora']">
                Tambah Stok: {material.material_name}
              </DialogTitle>
              <DialogDescription className="text-xs text-slate-500 dark:text-slate-400 font-medium">
                Kategori: <span className="font-bold uppercase text-amber-700 dark:text-amber-400">{material.category || 'Kemasan'}</span> · Stok Sekarang: <span className="font-bold text-slate-900 dark:text-white">{nPrevStock} {unitLabel}</span> · HPP: <span className="font-bold text-amber-600 dark:text-amber-400">{formatIDR(nPrevUnitCost)}</span>
              </DialogDescription>
            </div>
          </div>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="flex-1 overflow-y-auto p-5 space-y-4 text-xs">
          {/* Mode Switcher for Stickers / Labels */}
          {isSticker && (
            <div className="p-3.5 rounded-2xl bg-gradient-to-r from-amber-500/[0.08] to-orange-500/[0.08] border border-amber-300/80 dark:border-amber-500/30 space-y-2.5">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-1.5 font-black text-xs text-amber-900 dark:text-amber-200">
                  <Scissors size={14} className="text-amber-600" />
                  <span>Kalkulator Cetak Stiker per Lembar (A3+ / Sheet)</span>
                </div>
                <button
                  type="button"
                  onClick={() => setIsStickerMode(!isStickerMode)}
                  className={`text-[10px] font-bold px-2.5 py-1 rounded-lg border transition cursor-pointer ${
                    isStickerMode
                      ? 'bg-amber-500 text-white border-amber-600 shadow-xs'
                      : 'bg-white dark:bg-white/10 text-slate-600 dark:text-slate-300 border-slate-200 hover:bg-amber-50'
                  }`}
                >
                  {isStickerMode ? '✓ Mode Lembar Aktif' : '+ Aktifkan Hitung Lembar'}
                </button>
              </div>

              {isStickerMode && (
                <div className="space-y-3 pt-1">
                  <div className="grid grid-cols-2 gap-2.5">
                    <div>
                      <label className="text-[10px] font-bold text-slate-700 dark:text-slate-200 uppercase tracking-wider mb-1 block">
                        Jumlah Lembar A3+ Dicetak <span className="text-rose-500">*</span>
                      </label>
                      <div className="relative">
                        <input
                          type="text"
                          inputMode="numeric"
                          placeholder="Misal: 50"
                          value={sheetCount}
                          onChange={(e) => handleSheetCountChange(e.target.value)}
                          className="w-full px-3 py-2 rounded-xl bg-white dark:bg-white/10 border border-amber-300 dark:border-white/20 text-slate-900 dark:text-white text-xs font-bold focus:border-amber-500 focus:outline-none"
                        />
                        <span className="absolute right-2.5 top-1/2 -translate-y-1/2 text-[10px] font-bold text-amber-700 dark:text-amber-400">
                          lembar
                        </span>
                      </div>
                    </div>

                    <div>
                      <label className="text-[10px] font-bold text-slate-700 dark:text-slate-200 uppercase tracking-wider mb-1 block">
                        Isi Cutting per Lembar <span className="text-rose-500">*</span>
                      </label>
                      <div className="relative">
                        <input
                          type="text"
                          inputMode="numeric"
                          placeholder="12"
                          value={cuttingPerSheet}
                          onChange={(e) => handleCuttingPerSheetChange(e.target.value)}
                          className="w-full px-3 py-2 rounded-xl bg-white dark:bg-white/10 border border-amber-300 dark:border-white/20 text-slate-900 dark:text-white text-xs font-bold focus:border-amber-500 focus:outline-none"
                        />
                        <span className="absolute right-2.5 top-1/2 -translate-y-1/2 text-[10px] font-bold text-amber-700 dark:text-amber-400">
                          pcs / lbr
                        </span>
                      </div>
                    </div>
                  </div>

                  {/* Preset Cutting Chips */}
                  <div className="flex items-center gap-1.5 flex-wrap">
                    <span className="text-[10px] font-medium text-slate-500">Preset Cutting:</span>
                    {[12, 15, 20, 24, 30].map((cut) => (
                      <button
                        key={cut}
                        type="button"
                        onClick={() => handleCuttingPerSheetChange(String(cut))}
                        className={`px-2 py-0.5 rounded-md text-[10px] font-bold border transition cursor-pointer ${
                          cuttingPerSheet === String(cut)
                            ? 'bg-amber-500 text-white border-amber-600 shadow-xs'
                            : 'bg-white dark:bg-white/10 text-slate-600 dark:text-slate-300 border-slate-200 hover:border-amber-400'
                        }`}
                      >
                        {cut} pcs/lbr
                      </button>
                    ))}
                  </div>

                  {/* Rincian Biaya: Cetak Dasar + Biaya Cutting */}
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5 pt-1">
                    <div>
                      <label className="text-[10px] font-bold text-slate-700 dark:text-slate-200 uppercase tracking-wider mb-1 block">
                        🖨️ Biaya Cetak per Lembar A3+
                      </label>
                      <div className="relative">
                        <span className="absolute left-3 top-1/2 -translate-y-1/2 text-xs font-bold text-slate-400">Rp</span>
                        <input
                          type="text"
                          inputMode="numeric"
                          placeholder="6.500"
                          value={formatThousands(printPricePerSheet)}
                          onChange={(e) => handlePrintPriceChange(e.target.value)}
                          className="w-full pl-9 pr-3 py-2 rounded-xl bg-white dark:bg-white/10 border border-amber-300 dark:border-white/20 text-slate-900 dark:text-white text-xs font-bold focus:border-amber-500 focus:outline-none"
                        />
                      </div>
                    </div>

                    <div>
                      <div className="flex items-center justify-between mb-1">
                        <label className="text-[10px] font-bold text-slate-700 dark:text-slate-200 uppercase tracking-wider block">
                          ✂️ Biaya Jasa Cutting
                        </label>
                        <label className="flex items-center gap-1 cursor-pointer">
                          <input
                            type="checkbox"
                            checked={includeCutting}
                            onChange={(e) => handleIncludeCuttingToggle(e.target.checked)}
                            className="rounded border-amber-400 text-amber-600 focus:ring-amber-500"
                          />
                          <span className="text-[9.5px] font-bold text-amber-700 dark:text-amber-400 select-none">
                            +Cutting (+6.500)
                          </span>
                        </label>
                      </div>
                      <div className="relative">
                        <span className="absolute left-3 top-1/2 -translate-y-1/2 text-xs font-bold text-slate-400">Rp</span>
                        <input
                          type="text"
                          inputMode="numeric"
                          placeholder="6.500"
                          disabled={!includeCutting}
                          value={formatThousands(cuttingFeePerSheet)}
                          onChange={(e) => handleCuttingFeeChange(e.target.value)}
                          className={`w-full pl-9 pr-3 py-2 rounded-xl border text-xs font-bold focus:outline-none ${
                            includeCutting
                              ? 'bg-white dark:bg-white/10 border-amber-300 dark:border-white/20 text-slate-900 dark:text-white focus:border-amber-500'
                              : 'bg-slate-100 dark:bg-white/5 border-slate-200 text-slate-400 cursor-not-allowed'
                          }`}
                        />
                      </div>
                    </div>
                  </div>

                  {/* Summary Box */}
                  <div className="p-2.5 rounded-xl bg-amber-500/10 border border-amber-500/25 text-[11px] space-y-1">
                    <div className="flex justify-between font-medium text-slate-600 dark:text-slate-300">
                      <span>Biaya per Lembar A3+:</span>
                      <span className="font-bold text-slate-900 dark:text-white">
                        Rp {formatThousands(printPricePerSheet || 6500)} (Cetak) {includeCutting ? `+ Rp ${formatThousands(cuttingFeePerSheet || 6500)} (Cutting) = Rp ${formatThousands(costPerSheet)}/lbr` : `= Rp ${formatThousands(printPricePerSheet)}/lbr`}
                      </span>
                    </div>
                    <div className="flex justify-between font-medium text-slate-600 dark:text-slate-300">
                      <span>Hasil Fisik Masuk:</span>
                      <span className="font-bold text-emerald-600 dark:text-emerald-400">
                        {sheetCount || 0} Lembar × {cuttingPerSheet} pcs = {nAddQty.toLocaleString('id-ID')} pcs stiker
                      </span>
                    </div>
                    <div className="flex justify-between font-bold text-amber-900 dark:text-amber-200 pt-1 border-t border-amber-300/60 dark:border-amber-500/30">
                      <span>HPP per Pcs:</span>
                      <span className="text-amber-600 dark:text-amber-400 text-xs font-black">
                        {formatIDR(Number(buyPricePerUnit))} / pcs
                      </span>
                    </div>
                  </div>
                </div>
              )}
            </div>
          )}

          {/* Input Jumlah Masuk & Harga Beli Saat Ini */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
            <div>
              <label className="text-[10.5px] font-black text-slate-600 dark:text-slate-300 uppercase tracking-wider mb-1.5 block">
                Jumlah Masuk Baru (+{unitLabel}) <span className="text-rose-500">*</span>
              </label>
              <input
                type="text"
                inputMode="decimal"
                required
                autoFocus
                placeholder="Misal: 100"
                value={addQty}
                onChange={(e) => handleAddQtyChange(e.target.value)}
                className="w-full px-3.5 py-2.5 rounded-xl bg-slate-50 dark:bg-white/5 border border-slate-200 dark:border-white/10 text-slate-900 dark:text-white text-sm font-bold focus:bg-white focus:border-amber-500 focus:outline-none transition"
              />
              {/* Quick Qty Chips */}
              <div className="flex items-center gap-1 mt-1.5 flex-wrap">
                {[50, 100, 250, 500, 1000].map((q) => (
                  <button
                    key={q}
                    type="button"
                    onClick={() => handleAddQtyChange(String(q))}
                    className="px-2 py-0.5 rounded-lg bg-slate-100 dark:bg-white/5 hover:bg-amber-500/10 hover:text-amber-600 text-[10px] font-bold text-slate-600 dark:text-slate-400 border border-slate-200 dark:border-white/10 transition cursor-pointer"
                  >
                    +{q.toLocaleString('id-ID')}
                  </button>
                ))}
              </div>
            </div>

            <div>
              <label className="text-[10.5px] font-black text-slate-600 dark:text-slate-300 uppercase tracking-wider mb-1.5 block">
                Harga Beli Satuan (Rp/{unitLabel})
              </label>
              <div className="relative">
                <span className="absolute left-3.5 top-1/2 -translate-y-1/2 text-xs font-black text-slate-400 dark:text-slate-500 select-none">
                  Rp
                </span>
                <input
                  type="text"
                  inputMode="numeric"
                  placeholder={`Misal: ${formatThousands(nPrevUnitCost || 1200)}`}
                  value={formatThousands(buyPricePerUnit)}
                  onChange={(e) => handleBuyPriceChange(e.target.value)}
                  className="w-full pl-10 pr-3.5 py-2.5 rounded-xl bg-slate-50 dark:bg-white/5 border border-slate-200 dark:border-white/10 text-slate-900 dark:text-white text-sm font-bold focus:bg-white focus:border-amber-500 focus:outline-none transition"
                />
              </div>
              <p className="text-[10px] text-slate-400 mt-1">
                {buyPricePerUnit ? `${formatIDR(Number(buyPricePerUnit))} per ${unitLabel}` : 'Bisa kosong jika isi Total Belanja'}
              </p>
            </div>
          </div>

          {/* Total Pembelian Nota */}
          <div>
            <label className="text-[10.5px] font-black text-slate-600 dark:text-slate-300 uppercase tracking-wider mb-1.5 flex items-center justify-between">
              <span>Total Belanja / Nilai Nota (Rp)</span>
              <span className="text-[10px] text-amber-600 dark:text-amber-400 font-medium">Auto Sync dengan Harga Satuan</span>
            </label>
            <div className="relative">
              <span className="absolute left-3.5 top-1/2 -translate-y-1/2 text-xs font-black text-slate-400 dark:text-slate-500 select-none">
                Rp
              </span>
              <input
                type="text"
                inputMode="numeric"
                placeholder="Misal: 130.000"
                value={formatThousands(totalSpent)}
                onChange={(e) => handleTotalSpentChange(e.target.value)}
                className="w-full pl-10 pr-3.5 py-2.5 rounded-xl bg-slate-50 dark:bg-white/5 border border-slate-200 dark:border-white/10 text-slate-900 dark:text-white text-sm font-black focus:bg-white focus:border-amber-500 focus:outline-none transition"
              />
            </div>
            {totalSpent && (
              <p className="text-[10.5px] font-bold text-amber-600 dark:text-amber-400 mt-1">
                Total Nota: {formatIDR(Number(totalSpent))}
              </p>
            )}
          </div>

          {/* Live Preview Card */}
          {nAddQty > 0 && (
            <div className="p-3.5 rounded-2xl bg-amber-500/[0.08] border border-amber-500/25 space-y-2 text-xs">
              <div className="flex items-center justify-between text-amber-800 dark:text-amber-300 font-bold text-[11px]">
                <div className="flex items-center gap-1.5">
                  <Calculator size={13} />
                  <span>Simulasi Restok & Lot Batch (FIFO):</span>
                </div>
                <span className="bg-amber-500/20 text-amber-900 dark:text-amber-200 text-[9.5px] font-black px-2 py-0.5 rounded-full uppercase tracking-wider">
                  Metode FIFO
                </span>
              </div>
              <div className="grid grid-cols-2 gap-2 text-[11px] pt-1">
                <div className="p-2.5 rounded-xl bg-white dark:bg-white/5 border border-amber-500/20">
                  <p className="text-muted-foreground text-[10px]">Stok Fisik Total:</p>
                  <div className="flex items-center gap-1.5 font-black text-slate-900 dark:text-white mt-0.5">
                    <span>{nPrevStock}</span>
                    <ArrowRight size={12} className="text-amber-600" />
                    <span className="text-emerald-600 dark:text-emerald-400 font-extrabold">{newStock} {unitLabel}</span>
                  </div>
                </div>
                <div className="p-2.5 rounded-xl bg-white dark:bg-white/5 border border-amber-500/20">
                  <p className="text-muted-foreground text-[10px]">Harga Lot Masuk Ini:</p>
                  <div className="flex items-center gap-1.5 font-black text-slate-900 dark:text-white mt-0.5">
                    <span className="text-amber-600 dark:text-amber-400 font-extrabold">{formatIDR(nBuyPrice)}</span>
                    <span className="text-[10px] text-muted-foreground font-normal">/{unitLabel}</span>
                  </div>
                </div>
              </div>
              {nPrevStock > 0 && (
                <div className="bg-amber-500/10 border border-amber-500/20 p-2 rounded-xl text-[10px] text-amber-800 dark:text-amber-300 flex items-start gap-1.5">
                  <span className="shrink-0 font-bold">⚡ Alur FIFO:</span>
                  <span>
                    Stok lama <strong>{nPrevStock} {unitLabel} @ {formatIDR(nPrevUnitCost)}</strong> akan dipotong lebih dulu saat pengemasan/penjualan sebelum memakai lot baru ini (@ {formatIDR(nBuyPrice)}).
                  </span>
                </div>
              )}
            </div>
          )}

          {/* Supplier & Catatan */}
          <div className="space-y-2.5 pt-1">
            <div className="p-3.5 rounded-2xl bg-amber-500/[0.05] border border-amber-500/20 space-y-3">
              <div className="flex items-center justify-between">
                <label className="text-[10px] font-bold text-slate-700 dark:text-slate-200 uppercase tracking-wider flex items-center gap-1.5">
                  <Store size={12} className="text-amber-600 dark:text-amber-400" />
                  Supplier Percetakan / Vendor
                </label>
                <div className="flex items-center gap-2">
                  {suppliers.length > 0 && (
                    <span className="text-[10px] font-bold text-amber-700 dark:text-amber-300 bg-amber-100/80 dark:bg-amber-900/30 px-2 py-0.5 rounded-full">
                      {suppliers.length} Terdaftar
                    </span>
                  )}
                  <button
                    type="button"
                    onClick={() => {
                      setNewSupplierName(supplierName || '')
                      setShowAddSupplierModal(true)
                    }}
                    className="text-[10px] font-bold text-amber-700 hover:text-amber-800 dark:text-amber-300 flex items-center gap-1 bg-amber-100/90 dark:bg-amber-900/40 px-2 py-0.5 rounded-lg border border-amber-300/80 hover:bg-amber-200 transition cursor-pointer"
                  >
                    <Plus size={11} /> Tambah Suplier Baru
                  </button>
                </div>
              </div>

              {/* Searchable CustomSelect for Suppliers */}
              <div>
                <CustomSelect
                  value={supplierName}
                  onChange={(val) => setSupplierName(val)}
                  options={suppliers.map((s) => ({
                    value: s.supplier_name,
                    label: s.supplier_name + (s.phone ? ` (${s.phone})` : ''),
                    sublabel: s.address || ''
                  }))}
                  placeholder="-- Pilih / Cari Suplier Terdaftar --"
                  searchPlaceholder="Ketik nama suplier / percetakan / vendor..."
                  onAddNew={() => {
                    setNewSupplierName(supplierName || '')
                    setShowAddSupplierModal(true)
                  }}
                />
              </div>

              {/* Quick Add Supplier inline form when triggered */}
              {showAddSupplierModal && (
                <div className="p-3 rounded-xl bg-amber-50/90 dark:bg-amber-950/40 border border-amber-300 dark:border-amber-500/40 space-y-2.5">
                  <div className="flex items-center justify-between">
                    <span className="text-[11px] font-black text-amber-900 dark:text-amber-200 flex items-center gap-1">
                      <Building2 size={13} className="text-amber-600" /> Daftarkan Suplier Baru ke Database
                    </span>
                    <button
                      type="button"
                      onClick={() => setShowAddSupplierModal(false)}
                      className="text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 cursor-pointer"
                    >
                      <X size={14} />
                    </button>
                  </div>
                  <div className="space-y-2">
                    <div>
                      <label className="text-[9.5px] font-bold text-slate-600 dark:text-slate-300 block mb-0.5">
                        Nama Suplier / Vendor / Percetakan *
                      </label>
                      <input
                        type="text"
                        autoFocus
                        placeholder="Misal: Percetakan Jaya Solo"
                        value={newSupplierName}
                        onChange={(e) => setNewSupplierName(e.target.value)}
                        className="w-full px-3 py-1.5 rounded-lg bg-white dark:bg-white/10 border border-amber-300 text-slate-900 dark:text-white text-xs font-semibold focus:outline-none"
                      />
                    </div>
                    <div className="grid grid-cols-2 gap-2">
                      <div>
                        <label className="text-[9.5px] font-bold text-slate-600 dark:text-slate-300 block mb-0.5">
                          No HP / WA
                        </label>
                        <input
                          type="text"
                          placeholder="0812..."
                          value={newSupplierPhone}
                          onChange={(e) => setNewSupplierPhone(e.target.value)}
                          className="w-full px-3 py-1.5 rounded-lg bg-white dark:bg-white/10 border border-amber-300 text-slate-900 dark:text-white text-xs focus:outline-none"
                        />
                      </div>
                      <div>
                        <label className="text-[9.5px] font-bold text-slate-600 dark:text-slate-300 block mb-0.5">
                          Kota / Alamat
                        </label>
                        <input
                          type="text"
                          placeholder="Solo / Boyolali"
                          value={newSupplierAddress}
                          onChange={(e) => setNewSupplierAddress(e.target.value)}
                          className="w-full px-3 py-1.5 rounded-lg bg-white dark:bg-white/10 border border-amber-300 text-slate-900 dark:text-white text-xs focus:outline-none"
                        />
                      </div>
                    </div>
                    <div className="flex items-center justify-end gap-2 pt-1">
                      <button
                        type="button"
                        onClick={() => setShowAddSupplierModal(false)}
                        className="px-2.5 py-1 rounded-lg text-xs font-bold text-slate-600 hover:bg-slate-200/60 transition cursor-pointer"
                      >
                        Batal
                      </button>
                      <button
                        type="button"
                        onClick={handleQuickAddSupplier}
                        disabled={createSupplierMutation.isPending || !newSupplierName.trim()}
                        className="px-3 py-1 rounded-lg bg-amber-500 hover:bg-amber-600 text-white text-xs font-bold shadow-xs transition cursor-pointer disabled:opacity-50"
                      >
                        {createSupplierMutation.isPending ? 'Menyimpan...' : 'Simpan & Pilih Suplier'}
                      </button>
                    </div>
                  </div>
                </div>
              )}

              {/* Chips Suplier Teratas */}
              <div className="flex items-center gap-1.5 flex-wrap pt-0.5">
                <span className="text-[10px] text-slate-500 font-medium">Pilihan Cepat:</span>
                {suppliers.slice(0, 4).map((s) => (
                  <button
                    key={s.id}
                    type="button"
                    onClick={() => setSupplierName(s.supplier_name)}
                    className={`text-[10px] px-2 py-0.5 rounded-lg border font-semibold transition cursor-pointer ${
                      supplierName === s.supplier_name
                        ? 'bg-amber-500 text-white border-amber-600 shadow-xs'
                        : 'bg-white dark:bg-white/5 text-slate-700 dark:text-slate-300 border-slate-200 dark:border-white/10 hover:border-amber-400'
                    }`}
                  >
                    {s.supplier_name}
                  </button>
                ))}
              </div>

              {/* Status Terhubung */}
              {suppliers.find((s) => s.supplier_name?.toLowerCase() === supplierName.trim().toLowerCase()) && (
                <div className="flex items-center gap-1.5 p-2 rounded-xl bg-emerald-50 dark:bg-emerald-950/20 border border-emerald-200/70 text-[10px] text-emerald-800 dark:text-emerald-300 font-medium">
                  <CheckCircle2 size={12} className="text-emerald-600 shrink-0" />
                  <span>Terhubung ke suplier terdaftar: <strong>{supplierName}</strong></span>
                </div>
              )}
            </div>

            <div>
              <label className="text-[10px] font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider mb-1 flex items-center gap-1">
                <FileText size={11} /> Catatan Nota / Batch (Opsional)
              </label>
              <input
                type="text"
                placeholder="Misal: Cetak 50 lbr A3+ / Nota No. 082"
                value={notes}
                onChange={(e) => setNotes(e.target.value)}
                className="w-full px-3 py-2 rounded-xl bg-slate-50 dark:bg-white/5 border border-slate-200 dark:border-white/10 text-slate-900 dark:text-white text-xs focus:bg-white focus:border-amber-500 focus:outline-none"
              />
            </div>
          </div>

          <DialogFooter className="pt-3 pb-1 border-t border-slate-100 dark:border-white/10 flex items-center justify-end gap-2 shrink-0 bg-white/95 dark:bg-[#0E1726]/95 backdrop-blur-sm sticky bottom-0 z-10 -mx-5 -mb-5 px-5 py-3">
            <button
              type="button"
              onClick={handleClose}
              className="px-4 py-2.5 rounded-xl border border-slate-200 dark:border-white/10 bg-white dark:bg-white/5 hover:bg-slate-50 dark:hover:bg-white/10 text-slate-700 dark:text-slate-200 font-bold text-xs cursor-pointer transition"
            >
              Batal
            </button>
            <button
              type="submit"
              disabled={restockMutation.isPending || nAddQty <= 0}
              className="flex items-center gap-2 px-5 py-2.5 rounded-xl bg-amber-500 hover:bg-amber-600 disabled:opacity-50 text-white font-bold text-xs shadow-md active:scale-95 transition cursor-pointer"
            >
              <CheckCircle2 size={14} />
              <span>{restockMutation.isPending ? 'Menyimpan...' : 'Simpan Tambah Stok'}</span>
            </button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  )
}
