import React, { useState, useEffect } from 'react'
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetDescription,
} from '@/components/ui/sheet'
import {
  useCreateSembakoRawMaterial,
  useUpdateSembakoRawMaterial
} from '@/lib/hooks/useSembakoData'
import { formatRupiah } from '@/lib/format'
import { Package, Calculator, Tag, Store, AlertCircle } from 'lucide-react'
import { toast } from 'sonner'

export function SembakoBahanBakuSheet({ open, onOpenChange, onClose, initialData = null, editItem = null }) {
  const activeItem = initialData || editItem
  const handleClose = () => {
    if (onClose) onClose()
    if (onOpenChange) onOpenChange(false)
  }

  const createMutation = useCreateSembakoRawMaterial()
  const updateMutation = useUpdateSembakoRawMaterial()

  const [name, setName] = useState('')
  const [category, setCategory] = useState('kemasan')
  const [unit, setUnit] = useState('pcs')
  const [qty, setQty] = useState('')
  const [totalSpent, setTotalSpent] = useState('')
  const [unitCost, setUnitCost] = useState('')
  const [minStockAlert, setMinStockAlert] = useState('50')
  const [supplierName, setSupplierName] = useState('')
  const [notes, setNotes] = useState('')

  // Track which field user typed last for bi-directional auto math
  const [lastEdited, setLastEdited] = useState('totalSpent')

  useEffect(() => {
    if (activeItem) {
      setName(activeItem.material_name || '')
      setCategory(activeItem.category || activeItem.material_type || 'kemasan')
      setUnit(activeItem.unit || 'pcs')
      setQty(String(activeItem.current_stock || ''))
      setTotalSpent(String(activeItem.total_spent || ''))
      setUnitCost(String(activeItem.unit_cost || ''))
      setMinStockAlert(String(activeItem.min_stock_alert || '50'))
      setSupplierName(activeItem.supplier_name || '')
      setNotes(activeItem.notes || '')
    } else {
      setName('')
      setCategory('kemasan')
      setUnit('pcs')
      setQty('')
      setTotalSpent('')
      setUnitCost('')
      setMinStockAlert('50')
      setSupplierName('')
      setNotes('')
      setLastEdited('totalSpent')
    }
  }, [activeItem, open])

  // Bi-directional dynamic math calculator
  const handleQtyChange = (val) => {
    setQty(val)
    const nQty = parseFloat(val) || 0
    if (nQty > 0) {
      if (lastEdited === 'totalSpent' && totalSpent) {
        const nTotal = parseFloat(totalSpent) || 0
        setUnitCost(String(Math.round(nTotal / nQty)))
      } else if (lastEdited === 'unitCost' && unitCost) {
        const nUnit = parseFloat(unitCost) || 0
        setTotalSpent(String(Math.round(nUnit * nQty)))
      }
    }
  }

  const handleTotalSpentChange = (val) => {
    setTotalSpent(val)
    setLastEdited('totalSpent')
    const nTotal = parseFloat(val) || 0
    const nQty = parseFloat(qty) || 0
    if (nTotal > 0 && nQty > 0) {
      setUnitCost(String(Math.round(nTotal / nQty)))
    }
  }

  const handleUnitCostChange = (val) => {
    setUnitCost(val)
    setLastEdited('unitCost')
    const nUnit = parseFloat(val) || 0
    const nQty = parseFloat(qty) || 0
    if (nUnit > 0 && nQty > 0) {
      setTotalSpent(String(Math.round(nUnit * nQty)))
    }
  }

  const handleSubmit = async (e) => {
    e.preventDefault()
    if (!name.trim()) {
      toast.error('Nama bahan/kemasan wajib diisi')
      return
    }

    const payload = {
      material_name: name.trim(),
      category,
      unit,
      current_stock: parseFloat(qty) || 0,
      total_spent: parseFloat(totalSpent) || 0,
      unit_cost: parseFloat(unitCost) || 0,
      min_stock_alert: parseFloat(minStockAlert) || 10,
      supplier_name: supplierName.trim() || null,
      notes: notes.trim() || null
    }

    try {
      if (activeItem?.id) {
        await updateMutation.mutateAsync({ id: activeItem.id, ...payload })
      } else {
        await createMutation.mutateAsync(payload)
      }
      handleClose()
    } catch (err) {
      // handled by mutation
    }
  }

  const calculatedHpp = parseFloat(unitCost) || 0
  const isSaving = createMutation.isPending || updateMutation.isPending

  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent side="right" className="w-full sm:max-w-lg bg-[#0F172A] text-slate-100 border-l border-white/10 p-0 flex flex-col">
        <SheetHeader className="p-5 border-b border-white/10 bg-slate-900/60">
          <div className="flex items-center gap-2.5">
            <div className="w-9 h-9 rounded-xl bg-amber-500/20 text-amber-400 flex items-center justify-center font-bold">
              <Package size={18} />
            </div>
            <div>
              <SheetTitle className="text-lg font-bold text-white">
                {editItem ? 'Edit Bahan / Kemasan' : 'Tambah Bahan & Kemasan Baru'}
              </SheetTitle>
              <SheetDescription className="text-xs text-slate-400">
                Catat pembelian pouch, stiker, kardus, atau bahan baku dengan auto-kalkulator HPP.
              </SheetDescription>
            </div>
          </div>
        </SheetHeader>

        <form onSubmit={handleSubmit} className="flex-1 overflow-y-auto p-5 space-y-4">
          {/* Nama Bahan */}
          <div>
            <label className="text-xs font-semibold text-slate-300 mb-1.5 block">
              Nama Bahan / Kemasan <span className="text-rose-400">*</span>
            </label>
            <input
              type="text"
              required
              placeholder="Contoh: Pouch Standing Zipper 250g / Stiker Depan"
              value={name}
              onChange={(e) => setName(e.target.value)}
              className="w-full px-3.5 py-2.5 rounded-xl bg-white/[0.05] border border-white/10 text-white placeholder-slate-500 text-sm focus:outline-none focus:border-amber-400 transition"
            />
          </div>

          {/* Kategori & Satuan */}
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="text-xs font-semibold text-slate-300 mb-1.5 block">Kategori</label>
              <select
                value={category}
                onChange={(e) => setCategory(e.target.value)}
                className="w-full px-3 py-2.5 rounded-xl bg-[#1E293B] border border-white/10 text-white text-sm focus:outline-none focus:border-amber-400"
              >
                <option value="kemasan">Pouch & Plastik</option>
                <option value="stiker">Stiker & Label</option>
                <option value="kardus">Kardus & Box</option>
                <option value="bahan_baku">Bahan Baku (Bawang/Minyak)</option>
                <option value="lainnya">Lain-lain</option>
              </select>
            </div>
            <div>
              <label className="text-xs font-semibold text-slate-300 mb-1.5 block">Satuan</label>
              <select
                value={unit}
                onChange={(e) => setUnit(e.target.value)}
                className="w-full px-3 py-2.5 rounded-xl bg-[#1E293B] border border-white/10 text-white text-sm focus:outline-none focus:border-amber-400"
              >
                <option value="pcs">pcs (buah)</option>
                <option value="lembar">lembar</option>
                <option value="roll">roll</option>
                <option value="kg">kg (kilogram)</option>
                <option value="box">box</option>
              </select>
            </div>
          </div>

          {/* Bi-directional Auto Calculator Box */}
          <div className="p-4 rounded-2xl bg-amber-500/10 border border-amber-500/20 space-y-3">
            <div className="flex items-center justify-between">
              <span className="text-xs font-bold text-amber-400 flex items-center gap-1.5">
                <Calculator size={14} /> Auto Kalkulator HPP Satuan
              </span>
              <span className="text-[11px] text-slate-400 font-mono">
                HPP = Total Bayar ÷ Qty
              </span>
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="text-[11px] font-medium text-slate-300 mb-1 block">
                  Jumlah Pembelian ({unit})
                </label>
                <input
                  type="number"
                  min="0"
                  step="any"
                  placeholder="Misal: 100"
                  value={qty}
                  onChange={(e) => handleQtyChange(e.target.value)}
                  className="w-full px-3 py-2 rounded-lg bg-slate-900/80 border border-white/10 text-white text-sm focus:outline-none focus:border-amber-400"
                />
              </div>
              <div>
                <label className="text-[11px] font-medium text-slate-300 mb-1 block">
                  Total Bayar / Nota (Rp)
                </label>
                <input
                  type="number"
                  min="0"
                  placeholder="Misal: 85000"
                  value={totalSpent}
                  onChange={(e) => handleTotalSpentChange(e.target.value)}
                  className="w-full px-3 py-2 rounded-lg bg-slate-900/80 border border-white/10 text-white text-sm focus:outline-none focus:border-amber-400"
                />
              </div>
            </div>

            {/* Hasil HPP Satuan */}
            <div className="pt-2 border-t border-amber-500/20 flex items-center justify-between">
              <span className="text-xs text-slate-300 font-medium">HPP Beli per {unit}:</span>
              <div className="flex items-center gap-2">
                <input
                  type="number"
                  min="0"
                  placeholder="Rp per unit"
                  value={unitCost}
                  onChange={(e) => handleUnitCostChange(e.target.value)}
                  className="w-28 px-2.5 py-1 text-right rounded-md bg-slate-900 border border-amber-400/40 text-amber-300 font-bold text-sm focus:outline-none"
                />
                <span className="text-xs text-amber-400 font-semibold">
                  / {unit}
                </span>
              </div>
            </div>
          </div>

          {/* Minimum Stock Alert & Supplier */}
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="text-xs font-semibold text-slate-300 mb-1.5 block">
                Peringatan Stok Menipis
              </label>
              <input
                type="number"
                min="0"
                value={minStockAlert}
                onChange={(e) => setMinStockAlert(e.target.value)}
                className="w-full px-3 py-2 rounded-xl bg-white/[0.05] border border-white/10 text-white text-sm focus:outline-none focus:border-amber-400"
              />
            </div>
            <div>
              <label className="text-xs font-semibold text-slate-300 mb-1.5 block">
                Supplier / Percetakan
              </label>
              <input
                type="text"
                placeholder="Misal: Percetakan Solo Jaya"
                value={supplierName}
                onChange={(e) => setSupplierName(e.target.value)}
                className="w-full px-3 py-2 rounded-xl bg-white/[0.05] border border-white/10 text-white text-sm focus:outline-none focus:border-amber-400"
              />
            </div>
          </div>

          {/* Catatan */}
          <div>
            <label className="text-xs font-semibold text-slate-300 mb-1.5 block">Catatan / Spesifikasi</label>
            <textarea
              rows={2}
              placeholder="Contoh: Bahan pouch matte ziplock tebal 100 micron"
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              className="w-full px-3 py-2 rounded-xl bg-white/[0.05] border border-white/10 text-white text-sm focus:outline-none focus:border-amber-400 resize-none"
            />
          </div>
        </form>

        <div className="p-4 border-t border-white/10 bg-slate-900/60 flex items-center justify-end gap-2.5">
          <button
            type="button"
            onClick={handleClose}
            className="px-4 py-2 rounded-xl text-xs font-semibold text-slate-300 hover:bg-white/5 transition"
          >
            Batal
          </button>
          <button
            type="button"
            onClick={handleSubmit}
            disabled={isSaving}
            className="px-5 py-2 rounded-xl text-xs font-bold bg-amber-500 hover:bg-amber-400 text-slate-950 shadow-lg shadow-amber-500/20 transition disabled:opacity-50"
          >
            {isSaving ? 'Menyimpan...' : activeItem ? 'Simpan Perubahan' : 'Tambahkan Bahan'}
          </button>
        </div>
      </SheetContent>
    </Sheet>
  )
}

export default SembakoBahanBakuSheet
