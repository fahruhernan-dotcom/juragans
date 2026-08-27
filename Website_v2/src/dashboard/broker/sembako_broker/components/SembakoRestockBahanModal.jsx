import React, { useState, useEffect } from 'react'
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter
} from '@/components/ui/dialog'
import { useRestockSembakoRawMaterial } from '@/lib/hooks/useSembakoData'
import { recordAuditLog } from '@/lib/hooks/useSembakoAudit'
import { useAuth } from '@/lib/hooks/useAuth'
import { formatRupiah, formatIDR } from '@/lib/format'
import { PackagePlus, Calculator, ArrowRight, Store, FileText, CheckCircle2, X } from 'lucide-react'
import { toast } from 'sonner'

export function SembakoRestockBahanModal({ open, onOpenChange, material, onClose }) {
  const { profile } = useAuth()
  const restockMutation = useRestockSembakoRawMaterial()

  const [addQty, setAddQty] = useState('')
  const [buyPricePerUnit, setBuyPricePerUnit] = useState('')
  const [totalSpent, setTotalSpent] = useState('')
  const [lastEdited, setLastEdited] = useState('unit')
  const [supplierName, setSupplierName] = useState('')
  const [notes, setNotes] = useState('')

  useEffect(() => {
    if (material && open) {
      setAddQty('')
      setBuyPricePerUnit(material.unit_cost ? String(Math.round(material.unit_cost)) : '')
      setTotalSpent('')
      setLastEdited('unit')
      setSupplierName(material.supplier_name || '')
      setNotes('')
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

  // Live Math Calculations
  const nAddQty = parseFloat(addQty) || 0
  const nPrevStock = parseFloat(material?.current_stock) || 0
  const nPrevUnitCost = parseFloat(material?.unit_cost) || 0
  const nBuyPrice = parseFloat(buyPricePerUnit) || 0
  const nBatchSpent = parseFloat(totalSpent) > 0 ? parseFloat(totalSpent) : (nAddQty * nBuyPrice)

  const newStock = nPrevStock + nAddQty
  const totalInventoryValue = (nPrevStock * nPrevUnitCost) + nBatchSpent
  const newUnitCost = newStock > 0 ? Math.round(totalInventoryValue / newStock) : (nBuyPrice || nPrevUnitCost)

  const handleSubmit = async (e) => {
    e.preventDefault()
    if (!material?.id) return
    if (nAddQty <= 0) {
      toast.error('Masukkan jumlah barang masuk (> 0)')
      return
    }

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
        notes: notes
      })

      // Record transaction to audit logs / purchase history
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
          notes: notes || '',
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
      <DialogContent className="w-full max-w-lg bg-white dark:bg-[#0E1726] text-slate-900 dark:text-slate-100 rounded-3xl border border-slate-200 dark:border-white/10 p-0 overflow-hidden shadow-2xl">
        <DialogHeader className="p-5 bg-amber-50/70 dark:bg-amber-950/20 border-b border-amber-200/50 dark:border-amber-500/20">
          <div className="flex items-center justify-between gap-4">
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

            <button
              type="button"
              onClick={handleClose}
              className="w-8 h-8 rounded-full bg-slate-200/70 dark:bg-white/10 hover:bg-slate-300 dark:hover:bg-white/20 text-slate-600 dark:text-slate-200 flex items-center justify-center transition cursor-pointer shrink-0 z-30"
              title="Tutup"
            >
              <X size={16} />
            </button>
          </div>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="p-5 space-y-4 text-xs">
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
              <div className="flex items-center gap-1.5 text-amber-800 dark:text-amber-300 font-bold text-[11px]">
                <Calculator size={13} />
                <span>Simulasi Perubahan Stok & HPP:</span>
              </div>
              <div className="grid grid-cols-2 gap-2 text-[11px] pt-1">
                <div className="p-2.5 rounded-xl bg-white dark:bg-white/5 border border-amber-500/20">
                  <p className="text-muted-foreground text-[10px]">Stok Total Nanti:</p>
                  <div className="flex items-center gap-1.5 font-black text-slate-900 dark:text-white mt-0.5">
                    <span>{nPrevStock}</span>
                    <ArrowRight size={12} className="text-amber-600" />
                    <span className="text-emerald-600 dark:text-emerald-400 font-extrabold">{newStock} {unitLabel}</span>
                  </div>
                </div>
                <div className="p-2.5 rounded-xl bg-white dark:bg-white/5 border border-amber-500/20">
                  <p className="text-muted-foreground text-[10px]">HPP Rata-rata Baru:</p>
                  <div className="flex items-center gap-1.5 font-black text-slate-900 dark:text-white mt-0.5">
                    <span>{formatIDR(nPrevUnitCost)}</span>
                    <ArrowRight size={12} className="text-amber-600" />
                    <span className="text-amber-600 dark:text-amber-400 font-extrabold">{formatIDR(newUnitCost)}</span>
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* Supplier & Catatan (Optional) */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-1">
            <div>
              <label className="text-[10px] font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider mb-1 flex items-center gap-1">
                <Store size={11} /> Supplier / Sumber
              </label>
              <input
                type="text"
                placeholder="Misal: Shopee / Toko Kemasan"
                value={supplierName}
                onChange={(e) => setSupplierName(e.target.value)}
                className="w-full px-3 py-2 rounded-xl bg-slate-50 dark:bg-white/5 border border-slate-200 dark:border-white/10 text-slate-900 dark:text-white text-xs focus:bg-white focus:border-amber-500 focus:outline-none"
              />
            </div>
            <div>
              <label className="text-[10px] font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider mb-1 flex items-center gap-1">
                <FileText size={11} /> Catatan Nota / Batch
              </label>
              <input
                type="text"
                placeholder="Misal: Restok Mingguan #4"
                value={notes}
                onChange={(e) => setNotes(e.target.value)}
                className="w-full px-3 py-2 rounded-xl bg-slate-50 dark:bg-white/5 border border-slate-200 dark:border-white/10 text-slate-900 dark:text-white text-xs focus:bg-white focus:border-amber-500 focus:outline-none"
              />
            </div>
          </div>

          <DialogFooter className="pt-3 border-t border-slate-100 dark:border-white/10 flex items-center justify-end gap-2">
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
