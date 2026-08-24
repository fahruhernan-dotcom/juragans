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
    if (nQty > 0 && nTotal >= 0) {
      setUnitCost(String(Math.round(nTotal / nQty)))
    }
  }

  const handleUnitCostChange = (val) => {
    setUnitCost(val)
    setLastEdited('unitCost')
    const nUnit = parseFloat(val) || 0
    const nQty = parseFloat(qty) || 0
    if (nQty > 0 && nUnit >= 0) {
      setTotalSpent(String(Math.round(nUnit * nQty)))
    }
  }

  const handleSubmit = async (e) => {
    e.preventDefault()
    if (!name.trim()) {
      toast.error('Nama bahan / kemasan wajib diisi')
      return
    }

    const payload = {
      material_name: name.trim(),
      category: category,
      unit: unit,
      current_stock: parseFloat(qty) || 0,
      total_spent: parseFloat(totalSpent) || 0,
      unit_cost: parseFloat(unitCost) || 0,
      min_stock_alert: parseFloat(minStockAlert) || 50,
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
      <SheetContent side="right" className="w-full sm:max-w-lg bg-white text-slate-900 border-l border-slate-200 p-0 flex flex-col shadow-2xl">
        <SheetHeader className="p-5 border-b border-slate-100 bg-slate-50/80">
          <div className="flex items-center gap-2.5">
            <div className="w-9 h-9 rounded-xl bg-amber-100 text-amber-800 flex items-center justify-center font-bold border border-amber-200">
              <Package size={18} />
            </div>
            <div>
              <SheetTitle className="text-base font-bold text-slate-900">
                {editItem ? 'Edit Bahan / Kemasan' : 'Tambah Bahan & Kemasan Baru'}
              </SheetTitle>
              <SheetDescription className="text-xs text-slate-500">
                Catat pembelian pouch, stiker, kardus, atau bahan baku dengan auto-kalkulator HPP.
              </SheetDescription>
            </div>
          </div>
        </SheetHeader>

        <form onSubmit={handleSubmit} className="flex-1 overflow-y-auto p-5 space-y-4 text-xs">
          {/* Nama Bahan */}
          <div>
            <label className="text-[10px] font-black text-slate-600 uppercase tracking-wider mb-1 block">
              Nama Bahan / Kemasan <span className="text-rose-500">*</span>
            </label>
            <input
              type="text"
              required
              placeholder="Contoh: Pouch Standing Zipper 250g / Stiker Depan"
              value={name}
              onChange={(e) => setName(e.target.value)}
              className="w-full px-3.5 py-2.5 rounded-xl bg-slate-50 border border-slate-200 text-slate-900 placeholder-slate-400 text-xs focus:bg-white focus:border-amber-500 focus:outline-none transition"
            />
          </div>

          {/* Kategori & Satuan */}
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="text-[10px] font-black text-slate-600 uppercase tracking-wider mb-1 block">Kategori</label>
              <select
                value={category}
                onChange={(e) => setCategory(e.target.value)}
                className="w-full px-3 py-2.5 rounded-xl bg-slate-50 border border-slate-200 text-slate-900 text-xs font-semibold focus:bg-white focus:border-amber-500"
              >
                <option value="kemasan">Pouch & Plastik</option>
                <option value="stiker">Stiker & Label</option>
                <option value="kardus">Kardus & Box</option>
                <option value="bahan_baku">Bahan Baku (Bawang/Minyak)</option>
                <option value="lainnya">Lain-lain</option>
              </select>
            </div>
            <div>
              <label className="text-[10px] font-black text-slate-600 uppercase tracking-wider mb-1 block">Satuan</label>
              <select
                value={unit}
                onChange={(e) => setUnit(e.target.value)}
                className="w-full px-3 py-2.5 rounded-xl bg-slate-50 border border-slate-200 text-slate-900 text-xs font-semibold focus:bg-white focus:border-amber-500"
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
          <div className="p-4 rounded-2xl bg-amber-50/80 border border-amber-200/90 space-y-3 shadow-sm">
            <div className="flex items-center justify-between">
              <span className="text-xs font-bold text-amber-900 flex items-center gap-1.5">
                <Calculator size={14} className="text-amber-600" /> Auto Kalkulator HPP Satuan
              </span>
              <span className="text-[10px] text-amber-800 font-mono font-semibold">
                HPP = Total Bayar ÷ Qty
              </span>
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="text-[10px] font-bold text-slate-600 mb-1 block">
                  Jumlah Pembelian ({unit})
                </label>
                <input
                  type="number"
                  min="0"
                  step="any"
                  placeholder="Misal: 100"
                  value={qty}
                  onChange={(e) => handleQtyChange(e.target.value)}
                  className="w-full px-3 py-2 rounded-xl bg-white border border-amber-200 text-slate-900 text-xs font-bold focus:outline-none focus:border-amber-500"
                />
              </div>
              <div>
                <label className="text-[10px] font-bold text-slate-600 mb-1 block">
                  Total Bayar / Nota (Rp)
                </label>
                <input
                  type="number"
                  min="0"
                  placeholder="Misal: 85000"
                  value={totalSpent}
                  onChange={(e) => handleTotalSpentChange(e.target.value)}
                  className="w-full px-3 py-2 rounded-xl bg-white border border-amber-200 text-slate-900 text-xs font-bold focus:outline-none focus:border-amber-500"
                />
              </div>
            </div>

            {/* Hasil HPP Satuan */}
            <div className="pt-2.5 border-t border-amber-200/70 flex items-center justify-between">
              <span className="text-xs text-slate-700 font-semibold">HPP Beli per {unit}:</span>
              <div className="flex items-center gap-1.5">
                <input
                  type="number"
                  min="0"
                  placeholder="Rp per unit"
                  value={unitCost}
                  onChange={(e) => handleUnitCostChange(e.target.value)}
                  className="w-28 px-2.5 py-1 text-right rounded-lg bg-white border border-amber-300 text-amber-900 font-black text-xs focus:outline-none focus:border-amber-500"
                />
                <span className="text-xs text-amber-900 font-bold">
                  / {unit}
                </span>
              </div>
            </div>
          </div>

          {/* Minimum Stock Alert & Supplier */}
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="text-[10px] font-black text-slate-600 uppercase tracking-wider mb-1 block">
                Peringatan Stok Menipis
              </label>
              <input
                type="number"
                min="0"
                value={minStockAlert}
                onChange={(e) => setMinStockAlert(e.target.value)}
                className="w-full px-3 py-2.5 rounded-xl bg-slate-50 border border-slate-200 text-slate-900 text-xs focus:bg-white focus:border-amber-500 focus:outline-none"
              />
            </div>
            <div>
              <label className="text-[10px] font-black text-slate-600 uppercase tracking-wider mb-1 block">
                Supplier / Percetakan
              </label>
              <input
                type="text"
                placeholder="Misal: Percetakan Solo Jaya"
                value={supplierName}
                onChange={(e) => setSupplierName(e.target.value)}
                className="w-full px-3 py-2.5 rounded-xl bg-slate-50 border border-slate-200 text-slate-900 text-xs focus:bg-white focus:border-amber-500 focus:outline-none"
              />
            </div>
          </div>

          {/* Catatan */}
          <div>
            <label className="text-[10px] font-black text-slate-600 uppercase tracking-wider mb-1 block">Catatan / Spesifikasi</label>
            <textarea
              rows={2}
              placeholder="Contoh: Bahan pouch matte ziplock tebal 100 micron"
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-slate-900 text-xs focus:bg-white focus:border-amber-500 focus:outline-none resize-none"
            />
          </div>
        </form>

        <div className="p-4 border-t border-slate-100 bg-slate-50 flex items-center justify-end gap-2.5">
          <button
            type="button"
            onClick={handleClose}
            className="px-4 py-2 rounded-xl text-xs font-semibold text-slate-600 hover:bg-slate-100 transition"
          >
            Batal
          </button>
          <button
            type="button"
            onClick={handleSubmit}
            disabled={isSaving}
            className="px-5 py-2 rounded-xl text-xs font-bold bg-amber-500 hover:bg-amber-400 text-slate-950 shadow-sm transition disabled:opacity-50"
          >
            {isSaving ? 'Menyimpan...' : activeItem ? 'Simpan Perubahan' : 'Tambahkan Bahan'}
          </button>
        </div>
      </SheetContent>
    </Sheet>
  )
}

export default SembakoBahanBakuSheet
