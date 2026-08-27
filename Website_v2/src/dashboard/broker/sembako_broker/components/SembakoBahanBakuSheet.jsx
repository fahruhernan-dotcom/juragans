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
import { formatRupiah, formatIDR } from '@/lib/format'
import { Package, Calculator } from 'lucide-react'
import { toast } from 'sonner'

export function SembakoBahanBakuSheet({ open, onOpenChange, onClose, initialData = null, editItem = null, targetType = 'bahan_baku' }) {
  const activeItem = initialData || editItem
  const handleClose = () => {
    if (onClose) onClose()
    if (onOpenChange) onOpenChange(false)
  }

  const createMutation = useCreateSembakoRawMaterial()
  const updateMutation = useUpdateSembakoRawMaterial()

  // Determine if item is Bahan Baku or Kemasan
  const isBahanBakuMode = targetType === 'bahan_baku' || (activeItem && ['bawang_mentah', 'bawang_curah', 'bawang_putih', 'minyak_goreng', 'tepung_bumbu', 'bahan_baku', 'bahan_lain'].includes(activeItem.category))

  const [name, setName] = useState('')
  const [category, setCategory] = useState(isBahanBakuMode ? 'bawang_mentah' : 'pouch')
  const [unit, setUnit] = useState(isBahanBakuMode ? 'kg' : 'pcs')
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
      setCategory(activeItem.category || activeItem.material_type || (isBahanBakuMode ? 'bawang_mentah' : 'pouch'))
      setUnit(activeItem.unit || (isBahanBakuMode ? 'kg' : 'pcs'))
      setQty(String(activeItem.current_stock || ''))
      setTotalSpent(String(activeItem.total_spent || ''))
      setUnitCost(String(activeItem.unit_cost || ''))
      setMinStockAlert(String(activeItem.min_stock_alert || '50'))
      setSupplierName(activeItem.supplier_name || '')
      setNotes(activeItem.notes || '')
    } else {
      setName('')
      setCategory(isBahanBakuMode ? 'bawang_mentah' : 'pouch')
      setUnit(isBahanBakuMode ? 'kg' : 'pcs')
      setQty('')
      setTotalSpent('')
      setUnitCost('')
      setMinStockAlert(isBahanBakuMode ? '20' : '50')
      setSupplierName('')
      setNotes('')
      setLastEdited('totalSpent')
    }
  }, [activeItem, open, isBahanBakuMode])

  // Format number with Indonesian thousand separators (e.g. 130000 -> 130.000)
  const formatThousands = (val) => {
    if (!val && val !== 0) return ''
    const num = Number(val)
    return isNaN(num) ? '' : num.toLocaleString('id-ID')
  }

  // Bi-directional dynamic math calculator
  const handleQtyChange = (val) => {
    const rawVal = val.replace(/[^0-9.]/g, '')
    setQty(rawVal)
    const nQty = parseFloat(rawVal) || 0
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
    const rawVal = val.replace(/\D/g, '')
    setTotalSpent(rawVal)
    setLastEdited('totalSpent')
    const nTotal = parseFloat(rawVal) || 0
    const nQty = parseFloat(qty) || 0
    if (nQty > 0 && nTotal >= 0) {
      setUnitCost(String(Math.round(nTotal / nQty)))
    }
  }

  const handleUnitCostChange = (val) => {
    const rawVal = val.replace(/\D/g, '')
    setUnitCost(rawVal)
    setLastEdited('unitCost')
    const nUnit = parseFloat(rawVal) || 0
    const nQty = parseFloat(qty) || 0
    if (nQty > 0 && nUnit >= 0) {
      setTotalSpent(String(Math.round(nUnit * nQty)))
    }
  }

  const handleSubmit = async (e) => {
    e.preventDefault()
    if (!name.trim()) {
      toast.error(`Nama ${isBahanBakuMode ? 'bahan baku' : 'kemasan'} wajib diisi`)
      return
    }

    const payload = {
      material_name: name.trim(),
      category: category,
      unit: unit,
      current_stock: qty ? parseFloat(qty) : 0,
      total_spent: totalSpent ? parseFloat(totalSpent) : 0,
      unit_cost: unitCost ? parseFloat(unitCost) : 0,
      min_stock_alert: minStockAlert ? parseFloat(minStockAlert) : 0,
      supplier_name: supplierName.trim() || null,
      notes: notes.trim() || null,
    }

    try {
      if (activeItem?.id) {
        await updateMutation.mutateAsync({ id: activeItem.id, ...payload })
      } else {
        await createMutation.mutateAsync(payload)
      }
      handleClose()
    } catch {
      // handled by mutation
    }
  }

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
              <SheetTitle className="text-base font-bold text-slate-900 font-['Sora']">
                {editItem 
                  ? `Edit ${isBahanBakuMode ? 'Bahan Baku Mentah' : 'Kemasan & Packaging'}` 
                  : `Tambah ${isBahanBakuMode ? 'Bahan Baku Mentah (Petani)' : 'Kemasan & Packaging (Vendor)'}`
                }
              </SheetTitle>
              <SheetDescription className="text-xs text-slate-500">
                {isBahanBakuMode
                  ? 'Catat pembelian komoditas mentah (Bawang Merah Boyolali, Bawang Putih, Minyak, Tepung) dari Petani/Pengepul.'
                  : 'Catat pembelian pouch ziplock, stiker label, kardus, atau polymailer dari Percetakan/Vendor Kemasan.'
                }
              </SheetDescription>
            </div>
          </div>
        </SheetHeader>

        <form onSubmit={handleSubmit} className="flex-1 overflow-y-auto p-5 space-y-4 text-xs">
          {/* Nama Bahan */}
          <div>
            <label className="text-[10px] font-black text-slate-600 uppercase tracking-wider mb-1 block">
              {isBahanBakuMode ? 'Nama Bahan Baku Mentah' : 'Nama Kemasan & Packaging'} <span className="text-rose-500">*</span>
            </label>
            <input
              type="text"
              required
              placeholder={isBahanBakuMode ? 'Contoh: Bawang Merah Basah Super Cepogo / Minyak Goreng Curah' : 'Contoh: Pouch Standing Zipper Matte 250g / Stiker Depan Gold'}
              value={name}
              onChange={(e) => setName(e.target.value)}
              className="w-full px-3.5 py-2.5 rounded-xl bg-slate-50 border border-slate-200 text-slate-900 placeholder-slate-400 text-xs font-semibold focus:bg-white focus:border-amber-500 focus:outline-none transition"
            />
          </div>

          {/* Kategori & Satuan */}
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="text-[10px] font-black text-slate-600 uppercase tracking-wider mb-1 block">Kategori</label>
              {isBahanBakuMode ? (
                <select
                  value={category}
                  onChange={(e) => setCategory(e.target.value)}
                  className="w-full px-3 py-2.5 rounded-xl bg-slate-50 border border-slate-200 text-slate-900 text-xs font-semibold focus:bg-white focus:border-amber-500"
                >
                  <option value="bawang_mentah">🧅 Bawang Merah Mentah / Curah</option>
                  <option value="bawang_putih">🧄 Bawang Putih Mentah</option>
                  <option value="minyak_goreng">🛢️ Minyak Goreng Curah / Jerigen</option>
                  <option value="tepung_bumbu">🌾 Tepung & Bumbu Penyedap</option>
                  <option value="bahan_lain">📦 Bahan Baku Mentah Lainnya</option>
                </select>
              ) : (
                <select
                  value={category}
                  onChange={(e) => setCategory(e.target.value)}
                  className="w-full px-3 py-2.5 rounded-xl bg-slate-50 border border-slate-200 text-slate-900 text-xs font-semibold focus:bg-white focus:border-amber-500"
                >
                  <option value="pouch">🛍️ Standing Pouch Ziplock</option>
                  <option value="toples">🫙 Toples PET Plastik</option>
                  <option value="sticker_depan">🏷️ Stiker Label Depan</option>
                  <option value="sticker_belakang">🏷️ Stiker Label Belakang (Halal/Gizi)</option>
                  <option value="kardus">📦 Kardus Master Box / Dus Karton</option>
                  <option value="polymailer">✉️ Plastik Polymailer Ekspedisi</option>
                  <option value="bubblewrap_safety">🛡️ Bubblewrap / Lakban Fragile</option>
                  <option value="kemasan_lain">📦 Kemasan Lainnya</option>
                </select>
              )}
            </div>
            <div>
              <label className="text-[10px] font-black text-slate-600 uppercase tracking-wider mb-1 block">Satuan</label>
              {isBahanBakuMode ? (
                <select
                  value={unit}
                  onChange={(e) => setUnit(e.target.value)}
                  className="w-full px-3 py-2.5 rounded-xl bg-slate-50 border border-slate-200 text-slate-900 text-xs font-semibold focus:bg-white focus:border-amber-500"
                >
                  <option value="kg">kg (kilogram)</option>
                  <option value="karung">karung</option>
                  <option value="liter">liter</option>
                  <option value="sak">sak</option>
                  <option value="ton">ton</option>
                  <option value="gram">gram</option>
                </select>
              ) : (
                <select
                  value={unit}
                  onChange={(e) => setUnit(e.target.value)}
                  className="w-full px-3 py-2.5 rounded-xl bg-slate-50 border border-slate-200 text-slate-900 text-xs font-semibold focus:bg-white focus:border-amber-500"
                >
                  <option value="pcs">pcs (buah / lembar)</option>
                  <option value="lembar">lembar</option>
                  <option value="roll">roll</option>
                  <option value="pack">pack (isi pack)</option>
                  <option value="dus">dus / karton</option>
                  <option value="box">box</option>
                </select>
              )}
            </div>
          </div>

          {/* Bi-directional Auto Calculator Box */}
          <div className="p-4 rounded-2xl bg-amber-50/80 border border-amber-200/90 space-y-3 shadow-sm">
            <div className="flex items-center justify-between">
              <span className="text-xs font-bold text-amber-900 flex items-center gap-1.5 font-['Sora']">
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
                  type="text"
                  inputMode="decimal"
                  placeholder={isBahanBakuMode ? 'Misal: 50 (kg)' : 'Misal: 500 (pcs)'}
                  value={qty}
                  onChange={(e) => handleQtyChange(e.target.value)}
                  className="w-full px-3 py-2 rounded-xl bg-white border border-amber-200 text-slate-900 text-xs font-bold focus:outline-none focus:border-amber-500"
                />
              </div>
              <div>
                <label className="text-[10px] font-bold text-slate-600 mb-1 block">
                  Total Bayar / Nota Suplier (Rp)
                </label>
                <div className="relative">
                  <span className="absolute left-2.5 top-1/2 -translate-y-1/2 text-xs font-black text-slate-400 select-none">
                    Rp
                  </span>
                  <input
                    type="text"
                    inputMode="numeric"
                    placeholder="Misal: 1.500.000"
                    value={formatThousands(totalSpent)}
                    onChange={(e) => handleTotalSpentChange(e.target.value)}
                    className="w-full pl-8 pr-2.5 py-2 rounded-xl bg-white border border-amber-200 text-slate-900 text-xs font-bold focus:outline-none focus:border-amber-500"
                  />
                </div>
              </div>
            </div>

            {/* Hasil HPP Satuan */}
            <div className="pt-2.5 border-t border-amber-200/70 flex items-center justify-between">
              <div>
                <span className="text-xs text-slate-700 font-semibold block">HPP Beli per {unit}:</span>
                {unitCost && (
                  <span className="text-[10.5px] font-bold text-amber-700">
                    {formatIDR(Number(unitCost))} / {unit}
                  </span>
                )}
              </div>
              <div className="flex items-center gap-1.5">
                <div className="relative">
                  <span className="absolute left-2.5 top-1/2 -translate-y-1/2 text-[11px] font-black text-amber-600 select-none">
                    Rp
                  </span>
                  <input
                    type="text"
                    inputMode="numeric"
                    placeholder="0"
                    value={formatThousands(unitCost)}
                    onChange={(e) => handleUnitCostChange(e.target.value)}
                    className="w-32 pl-8 pr-2.5 py-1.5 text-right rounded-lg bg-white border border-amber-300 text-amber-900 font-black text-xs focus:outline-none focus:border-amber-500"
                  />
                </div>
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
                Peringatan Stok Menipis ({unit})
              </label>
              <input
                type="text"
                inputMode="decimal"
                value={minStockAlert}
                onChange={(e) => setMinStockAlert(e.target.value)}
                className="w-full px-3 py-2.5 rounded-xl bg-slate-50 border border-slate-200 text-slate-900 text-xs font-semibold focus:bg-white focus:border-amber-500 focus:outline-none"
              />
            </div>
            <div>
              <label className="text-[10px] font-black text-slate-600 uppercase tracking-wider mb-1 block">
                {isBahanBakuMode ? 'Supplier Petani / Pengepul' : 'Supplier Percetakan / Vendor'}
              </label>
              <input
                type="text"
                placeholder={isBahanBakuMode ? 'Misal: Petani Pak Slamet Cepogo' : 'Misal: Percetakan Solo Jaya'}
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
              placeholder={isBahanBakuMode ? 'Contoh: Bawang merah basah super lereng Merapi Boyolali' : 'Contoh: Pouch matte ziplock tebal 100 micron'}
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-slate-900 text-xs focus:bg-white focus:border-amber-500 focus:outline-none resize-none"
            />
          </div>

          <div className="pt-2">
            <button
              type="submit"
              disabled={isSaving}
              className="w-full py-3 rounded-xl bg-[#0F172A] hover:bg-slate-900 text-white font-bold text-xs flex items-center justify-center gap-2 shadow-lg shadow-slate-950/10 cursor-pointer disabled:opacity-50 transition"
            >
              {isSaving ? 'Menyimpan...' : (activeItem ? 'Simpan Perubahan' : (isBahanBakuMode ? 'Tambah Bahan Baku Mentah' : 'Tambah Kemasan & Packaging'))}
            </button>
          </div>
        </form>
      </SheetContent>
    </Sheet>
  )
}

export default SembakoBahanBakuSheet
