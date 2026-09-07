import React, { useState, useEffect, useMemo } from 'react'
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetDescription,
} from '@/components/ui/sheet'
import {
  useCreateSembakoRawMaterial,
  useUpdateSembakoRawMaterial,
  useSembakoSuppliers,
  useCreateSembakoSupplier
} from '@/lib/hooks/useSembakoData'
import { formatRupiah, formatIDR } from '@/lib/format'
import { CustomSelect } from './sembakoSaleUtils'
import {
  Select,
  SelectTrigger,
  SelectValue,
  SelectContent,
  SelectItem,
} from '@/components/ui/select'
import { Package, Calculator, Store, CheckCircle2, Building2, Plus, X, Scissors, Sparkles, Phone, MapPin } from 'lucide-react'
import { toast } from 'sonner'

export function SembakoBahanBakuSheet({ open, onOpenChange, onClose, initialData = null, editItem = null, targetType = 'bahan_baku' }) {
  const activeItem = initialData || editItem
  const handleClose = () => {
    if (onClose) onClose()
    if (onOpenChange) onOpenChange(false)
  }

  const { data: suppliers = [] } = useSembakoSuppliers()
  const createMutation = useCreateSembakoRawMaterial()
  const updateMutation = useUpdateSembakoRawMaterial()
  const createSupplierMutation = useCreateSembakoSupplier()

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

  // Quick Add Supplier state
  const [showAddSupplierModal, setShowAddSupplierModal] = useState(false)
  const [newSupplierName, setNewSupplierName] = useState('')
  const [newSupplierPhone, setNewSupplierPhone] = useState('')
  const [newSupplierAddress, setNewSupplierAddress] = useState('')

  // Sticker calculation state
  const isSticker = useMemo(() => {
    const cat = String(category || '').toLowerCase()
    const nm = String(name || '').toLowerCase()
    return cat.includes('sticker') || cat.includes('stiker') || cat.includes('label') ||
           nm.includes('sticker') || nm.includes('stiker') || nm.includes('label') || nm.includes('cutting')
  }, [category, name])

  const [isStickerMode, setIsStickerMode] = useState(false)
  const [sheetCount, setSheetCount] = useState('')
  const [cuttingPerSheet, setCuttingPerSheet] = useState('12')
  const [printPricePerSheet, setPrintPricePerSheet] = useState('6500')
  const [includeCutting, setIncludeCutting] = useState(true)
  const [cuttingFeePerSheet, setCuttingFeePerSheet] = useState('6500')

  // Track which field user typed last for bi-directional auto math
  const [lastEdited, setLastEdited] = useState('unitCost')

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
      setLastEdited('unitCost')
      setShowAddSupplierModal(false)

      const stickerDetected = String(activeItem.category || '').toLowerCase().includes('sticker') ||
                              String(activeItem.material_name || '').toLowerCase().includes('cutting') ||
                              String(activeItem.material_name || '').toLowerCase().includes('stiker')
      setIsStickerMode(stickerDetected)
      setPrintPricePerSheet('6500')
      setIncludeCutting(true)
      setCuttingFeePerSheet('6500')
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
      setLastEdited('unitCost')
      setShowAddSupplierModal(false)
      setIsStickerMode(false)
      setSheetCount('')
      setCuttingPerSheet('12')
      setPrintPricePerSheet('6500')
      setIncludeCutting(true)
      setCuttingFeePerSheet('6500')
    }
  }, [activeItem, open, isBahanBakuMode])

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
      setQty(String(nTotalPcs))
    }
    if (nTotalNota > 0) {
      setTotalSpent(String(nTotalNota))
    }
    if (hppPcs > 0) {
      setUnitCost(String(hppPcs))
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

  // Dynamic math calculator: adjusting Qty keeps unitCost fixed
  const handleQtyChange = (val) => {
    const rawVal = val.replace(/[^0-9.]/g, '')
    setQty(rawVal)
    const nQty = parseFloat(rawVal) || 0
    const nUnit = parseFloat(unitCost) || 0
    if (nQty > 0 && nUnit > 0) {
      setTotalSpent(String(Math.round(nUnit * nQty)))
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
        category: isBahanBakuMode ? 'petani' : 'percetakan',
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

  const costPerSheet = (parseFloat(printPricePerSheet) || 0) + (includeCutting ? (parseFloat(cuttingFeePerSheet) || 0) : 0)

  const handleSubmit = async (e) => {
    e.preventDefault()
    if (!name.trim()) {
      toast.error(`Nama ${isBahanBakuMode ? 'bahan baku' : 'kemasan'} wajib diisi`)
      return
    }

    const calculatedNotes = isStickerMode && sheetCount
      ? `${notes ? notes + ' | ' : ''}Cetak ${sheetCount} lbr A3+ @ Rp ${formatThousands(printPricePerSheet)} ${includeCutting ? `+ Cutting Rp ${formatThousands(cuttingFeePerSheet)}/lbr (${cuttingPerSheet} pcs/lbr)` : `(${cuttingPerSheet} pcs/lbr)`} | HPP Rp ${formatThousands(unitCost)}/pcs`
      : notes

    const payload = {
      material_name: name.trim(),
      category: category,
      unit: unit,
      current_stock: qty ? parseFloat(qty) : 0,
      total_spent: totalSpent ? parseFloat(totalSpent) : 0,
      unit_cost: unitCost ? parseFloat(unitCost) : 0,
      min_stock_alert: minStockAlert ? parseFloat(minStockAlert) : 0,
      supplier_name: supplierName.trim() || null,
      notes: calculatedNotes || null,
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
    <Sheet
      open={open}
      onOpenChange={(val) => {
        if (!val) handleClose()
        if (onOpenChange) onOpenChange(val)
      }}
    >
      <SheetContent side="right" className="w-full sm:max-w-lg bg-white text-slate-900 border-l border-slate-200 p-0 flex flex-col shadow-2xl">
        <SheetHeader className="p-5 border-b border-slate-100 bg-slate-50/80 pr-12">
          <div className="flex items-center gap-2.5">
            <div className="w-9 h-9 rounded-xl bg-amber-100 text-amber-800 flex items-center justify-center font-bold border border-amber-200">
              <Package size={18} />
            </div>
            <div>
              <SheetTitle className="text-base font-bold text-slate-900 font-['Sora']">
                {activeItem 
                  ? `Edit / Adjust ${isBahanBakuMode ? 'Bahan Baku Mentah' : 'Kemasan & Packaging'}` 
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
              onChange={(e) => {
                const val = e.target.value
                setName(val)
                if (val.toLowerCase().includes('stiker') || val.toLowerCase().includes('sticker') || val.toLowerCase().includes('cutting') || val.toLowerCase().includes('label')) {
                  setIsStickerMode(true)
                }
              }}
              className="w-full px-3.5 py-2.5 rounded-xl bg-slate-50 border border-slate-200 text-slate-900 placeholder-slate-400 text-xs font-semibold focus:bg-white focus:border-amber-500 focus:outline-none transition"
            />
          </div>

          {/* Kategori & Satuan */}
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="text-[10px] font-black text-slate-600 uppercase tracking-wider mb-1 block">Kategori</label>
              {isBahanBakuMode ? (
                <Select value={category} onValueChange={setCategory}>
                  <SelectTrigger className="h-10 bg-slate-50 border-slate-200 text-xs font-semibold text-slate-900">
                    <SelectValue placeholder="Pilih Kategori" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="bawang_mentah">🧅 Bawang Merah Mentah / Curah</SelectItem>
                    <SelectItem value="bawang_putih">🧄 Bawang Putih Mentah</SelectItem>
                    <SelectItem value="minyak_goreng">🛢️ Minyak Goreng Curah / Jerigen</SelectItem>
                    <SelectItem value="tepung_bumbu">🌾 Tepung & Bumbu Penyedap</SelectItem>
                    <SelectItem value="bahan_lain">📦 Bahan Baku Mentah Lainnya</SelectItem>
                  </SelectContent>
                </Select>
              ) : (
                <Select
                  value={category}
                  onValueChange={(val) => {
                    setCategory(val)
                    if (val === 'sticker_depan' || val === 'sticker_belakang') {
                      setIsStickerMode(true)
                      setUnit('pcs')
                    }
                  }}
                >
                  <SelectTrigger className="h-10 bg-slate-50 border-slate-200 text-xs font-semibold text-slate-900">
                    <SelectValue placeholder="Pilih Kategori" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="pouch">🛍️ Standing Pouch Ziplock</SelectItem>
                    <SelectItem value="toples">🫙 Toples PET Plastik</SelectItem>
                    <SelectItem value="sticker_depan">🏷️ Stiker Label Depan (Cutting A3+)</SelectItem>
                    <SelectItem value="sticker_belakang">🏷️ Stiker Label Belakang (Halal/Gizi)</SelectItem>
                    <SelectItem value="kardus">📦 Kardus Master Box / Dus Karton</SelectItem>
                    <SelectItem value="polymailer">✉️ Plastik Polymailer Ekspedisi</SelectItem>
                    <SelectItem value="bubblewrap_safety">🛡️ Bubblewrap / Lakban Fragile</SelectItem>
                    <SelectItem value="kemasan_lain">📦 Kemasan Lainnya</SelectItem>
                  </SelectContent>
                </Select>
              )}
            </div>
            <div>
              <label className="text-[10px] font-black text-slate-600 uppercase tracking-wider mb-1 block">Satuan Stok</label>
              {isBahanBakuMode ? (
                <Select value={unit} onValueChange={setUnit}>
                  <SelectTrigger className="h-10 bg-slate-50 border-slate-200 text-xs font-semibold text-slate-900">
                    <SelectValue placeholder="Pilih Satuan" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="kg">kg (kilogram)</SelectItem>
                    <SelectItem value="karung">karung</SelectItem>
                    <SelectItem value="liter">liter</SelectItem>
                    <SelectItem value="sak">sak</SelectItem>
                    <SelectItem value="ton">ton</SelectItem>
                    <SelectItem value="gram">gram</SelectItem>
                  </SelectContent>
                </Select>
              ) : (
                <Select value={unit} onValueChange={setUnit}>
                  <SelectTrigger className="h-10 bg-slate-50 border-slate-200 text-xs font-semibold text-slate-900">
                    <SelectValue placeholder="Pilih Satuan" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="pcs">pcs (buah / label stiker)</SelectItem>
                    <SelectItem value="lembar">lembar</SelectItem>
                    <SelectItem value="roll">roll</SelectItem>
                    <SelectItem value="pack">pack (isi pack)</SelectItem>
                    <SelectItem value="dus">dus / karton</SelectItem>
                    <SelectItem value="box">box</SelectItem>
                  </SelectContent>
                </Select>
              )}
            </div>
          </div>

          {/* Mode Switcher for Stickers / Labels */}
          {isSticker && (
            <div className="p-3.5 rounded-2xl bg-gradient-to-r from-amber-500/[0.08] to-orange-500/[0.08] border border-amber-300/80 space-y-2.5">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-1.5 font-black text-xs text-amber-900">
                  <Scissors size={14} className="text-amber-600" />
                  <span>Kalkulator Cetak Stiker per Lembar (A3+ / Sheet)</span>
                </div>
                <button
                  type="button"
                  onClick={() => setIsStickerMode(!isStickerMode)}
                  className={`text-[10px] font-bold px-2.5 py-1 rounded-lg border transition cursor-pointer ${
                    isStickerMode
                      ? 'bg-amber-500 text-white border-amber-600 shadow-xs'
                      : 'bg-white text-slate-600 border-slate-200 hover:bg-amber-50'
                  }`}
                >
                  {isStickerMode ? '✓ Mode Lembar Aktif' : '+ Aktifkan Hitung Lembar'}
                </button>
              </div>

              {isStickerMode && (
                <div className="space-y-3 pt-1">
                  <div className="grid grid-cols-2 gap-2.5">
                    <div>
                      <label className="text-[10px] font-bold text-slate-700 uppercase tracking-wider mb-1 block">
                        Jumlah Lembar A3+ Dicetak <span className="text-rose-500">*</span>
                      </label>
                      <div className="relative">
                        <input
                          type="text"
                          inputMode="numeric"
                          placeholder="Misal: 50"
                          value={sheetCount}
                          onChange={(e) => handleSheetCountChange(e.target.value)}
                          className="w-full px-3 py-2 rounded-xl bg-white border border-amber-300 text-slate-900 text-xs font-bold focus:border-amber-500 focus:outline-none"
                        />
                        <span className="absolute right-2.5 top-1/2 -translate-y-1/2 text-[10px] font-bold text-amber-700">
                          lembar
                        </span>
                      </div>
                    </div>

                    <div>
                      <label className="text-[10px] font-bold text-slate-700 uppercase tracking-wider mb-1 block">
                        Isi Cutting per Lembar <span className="text-rose-500">*</span>
                      </label>
                      <div className="relative">
                        <input
                          type="text"
                          inputMode="numeric"
                          placeholder="12"
                          value={cuttingPerSheet}
                          onChange={(e) => handleCuttingPerSheetChange(e.target.value)}
                          className="w-full px-3 py-2 rounded-xl bg-white border border-amber-300 text-slate-900 text-xs font-bold focus:border-amber-500 focus:outline-none"
                        />
                        <span className="absolute right-2.5 top-1/2 -translate-y-1/2 text-[10px] font-bold text-amber-700">
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
                            : 'bg-white text-slate-600 border-slate-200 hover:border-amber-400'
                        }`}
                      >
                        {cut} pcs/lbr
                      </button>
                    ))}
                  </div>

                  {/* Rincian Biaya: Cetak Dasar + Biaya Cutting */}
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5 pt-1">
                    <div>
                      <label className="text-[10px] font-bold text-slate-700 uppercase tracking-wider mb-1 block">
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
                          className="w-full pl-9 pr-3 py-2 rounded-xl bg-white border border-amber-300 text-slate-900 text-xs font-bold focus:border-amber-500 focus:outline-none"
                        />
                      </div>
                    </div>

                    <div>
                      <div className="flex items-center justify-between mb-1">
                        <label className="text-[10px] font-bold text-slate-700 uppercase tracking-wider block">
                          ✂️ Biaya Jasa Cutting
                        </label>
                        <label className="flex items-center gap-1 cursor-pointer">
                          <input
                            type="checkbox"
                            checked={includeCutting}
                            onChange={(e) => handleIncludeCuttingToggle(e.target.checked)}
                            className="rounded border-amber-400 text-amber-600 focus:ring-amber-500"
                          />
                          <span className="text-[9.5px] font-bold text-amber-700 select-none">
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
                              ? 'bg-white border-amber-300 text-slate-900 focus:border-amber-500'
                              : 'bg-slate-100 border-slate-200 text-slate-400 cursor-not-allowed'
                          }`}
                        />
                      </div>
                    </div>
                  </div>

                  {/* Summary Box */}
                  <div className="p-2.5 rounded-xl bg-amber-500/10 border border-amber-500/25 text-[11px] space-y-1">
                    <div className="flex justify-between font-medium text-slate-600">
                      <span>Biaya per Lembar A3+:</span>
                      <span className="font-bold text-slate-900">
                        Rp {formatThousands(printPricePerSheet || 6500)} (Cetak) {includeCutting ? `+ Rp ${formatThousands(cuttingFeePerSheet || 6500)} (Cutting) = Rp ${formatThousands(costPerSheet)}/lbr` : `= Rp ${formatThousands(printPricePerSheet)}/lbr`}
                      </span>
                    </div>
                    <div className="flex justify-between font-medium text-slate-600">
                      <span>Hasil Fisik Masuk:</span>
                      <span className="font-bold text-emerald-600">
                        {sheetCount || 0} Lembar × {cuttingPerSheet} pcs = {(Number(qty) || 0).toLocaleString('id-ID')} pcs stiker
                      </span>
                    </div>
                    <div className="flex justify-between font-bold text-amber-900 pt-1 border-t border-amber-300/60">
                      <span>HPP per Pcs:</span>
                      <span className="text-amber-600 text-xs font-black">
                        {formatIDR(Number(unitCost))} / pcs
                      </span>
                    </div>
                  </div>
                </div>
              )}
            </div>
          )}

          {/* Bi-directional Auto Calculator Box */}
          <div className="p-4 rounded-2xl bg-amber-50/80 border border-amber-200/90 space-y-3 shadow-sm">
            <div className="flex items-center justify-between">
              <span className="text-xs font-bold text-amber-900 flex items-center gap-1.5 font-['Sora']">
                <Calculator size={14} className="text-amber-600" /> Auto Kalkulator HPP Satuan
              </span>
              <span className="text-[10px] text-emerald-700 bg-emerald-100 px-2 py-0.5 rounded-full font-mono font-bold">
                🔒 HPP Terkunci Paten
              </span>
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="text-[10px] font-bold text-slate-700 mb-1 block">
                  Stok Tersedia / Opname ({unit})
                </label>
                <input
                  type="text"
                  inputMode="decimal"
                  placeholder={isBahanBakuMode ? 'Misal: 50 (kg)' : 'Misal: 50 (pcs)'}
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

          {/* Peringatan Stok Menipis */}
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

          {/* Hubungkan ke Database Suplier (Petani / Pengepul / Percetakan) */}
          <div className="p-3.5 rounded-2xl bg-amber-500/[0.05] border border-amber-500/25 space-y-3">
            <div className="flex items-center justify-between">
              <label className="text-[10px] font-black text-slate-800 uppercase tracking-wider flex items-center gap-1.5">
                <Store size={13} className="text-amber-600" />
                {isBahanBakuMode ? 'Supplier Petani / Pengepul' : 'Supplier Percetakan / Vendor'}
              </label>
              <div className="flex items-center gap-2">
                {suppliers.length > 0 && (
                  <span className="text-[10px] font-bold text-amber-700 bg-amber-100/90 px-2 py-0.5 rounded-full">
                    {suppliers.length} Suplier Terdaftar
                  </span>
                )}
                <button
                  type="button"
                  onClick={() => {
                    setNewSupplierName(supplierName || '')
                    setShowAddSupplierModal(true)
                  }}
                  className="text-[10px] font-bold text-amber-700 hover:text-amber-800 flex items-center gap-1 bg-amber-100 px-2 py-0.5 rounded-lg border border-amber-300 hover:bg-amber-200 transition cursor-pointer"
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
                searchPlaceholder={isBahanBakuMode ? 'Cari nama petani / pengepul...' : 'Cari nama percetakan / vendor...'}
                onAddNew={() => {
                  setNewSupplierName(supplierName || '')
                  setShowAddSupplierModal(true)
                }}
              />
            </div>

            {/* Quick Add Supplier inline form when triggered */}
            {showAddSupplierModal && (
              <div className="p-3 rounded-xl bg-amber-50/90 border border-amber-300 space-y-2.5">
                <div className="flex items-center justify-between">
                  <span className="text-[11px] font-black text-amber-900 flex items-center gap-1">
                    <Building2 size={13} className="text-amber-600" /> Daftarkan Suplier Baru ke Database
                  </span>
                  <button
                    type="button"
                    onClick={() => setShowAddSupplierModal(false)}
                    className="text-slate-400 hover:text-slate-600 cursor-pointer"
                  >
                    <X size={14} />
                  </button>
                </div>
                <div className="space-y-2">
                  <div>
                    <label className="text-[9.5px] font-bold text-slate-600 block mb-0.5">
                      Nama Suplier / Vendor / Percetakan *
                    </label>
                    <input
                      type="text"
                      autoFocus
                      placeholder={isBahanBakuMode ? 'Misal: Petani Bawang Cepogo' : 'Misal: Percetakan Jaya Solo'}
                      value={newSupplierName}
                      onChange={(e) => setNewSupplierName(e.target.value)}
                      className="w-full px-3 py-1.5 rounded-lg bg-white border border-amber-300 text-slate-900 text-xs font-semibold focus:outline-none"
                    />
                  </div>
                  <div className="grid grid-cols-2 gap-2">
                    <div>
                      <label className="text-[9.5px] font-bold text-slate-600 block mb-0.5">
                        No HP / WA
                      </label>
                      <input
                        type="text"
                        placeholder="0812..."
                        value={newSupplierPhone}
                        onChange={(e) => setNewSupplierPhone(e.target.value)}
                        className="w-full px-3 py-1.5 rounded-lg bg-white border border-amber-300 text-slate-900 text-xs focus:outline-none"
                      />
                    </div>
                    <div>
                      <label className="text-[9.5px] font-bold text-slate-600 block mb-0.5">
                        Kota / Alamat
                      </label>
                      <input
                        type="text"
                        placeholder="Boyolali / Solo"
                        value={newSupplierAddress}
                        onChange={(e) => setNewSupplierAddress(e.target.value)}
                        className="w-full px-3 py-1.5 rounded-lg bg-white border border-amber-300 text-slate-900 text-xs focus:outline-none"
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

            {/* Quick Chip Preset / Suplier Pilihan */}
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
                      : 'bg-white hover:bg-amber-50 text-slate-700 border-amber-200/80'
                  }`}
                >
                  {s.supplier_name}
                </button>
              ))}
              {suppliers.length === 0 &&
                (isBahanBakuMode
                  ? ['Petani Boyolali', 'Pengepul Pasar Legi', 'Petani Brebes']
                  : ['Percetakan Solo Jaya', 'Pabrik Kemasan Toples', 'Vendor Plastik & Dus']
                ).map((preset) => (
                  <button
                    key={preset}
                    type="button"
                    onClick={() => setSupplierName(preset)}
                    className={`text-[10px] px-2 py-0.5 rounded-lg border font-semibold transition cursor-pointer ${
                      supplierName === preset
                        ? 'bg-amber-500 text-white border-amber-600'
                        : 'bg-white hover:bg-amber-50 text-slate-700 border-slate-200'
                    }`}
                  >
                    +{preset}
                  </button>
                ))}
            </div>

            {/* Status Terhubung ke Database */}
            {suppliers.find((s) => s.supplier_name?.toLowerCase() === supplierName.trim().toLowerCase()) ? (
              <div className="flex items-center gap-1.5 p-2 rounded-xl bg-emerald-50 border border-emerald-200/80 text-[10.5px] text-emerald-800 font-medium">
                <CheckCircle2 size={13} className="text-emerald-600 shrink-0" />
                <span>
                  Terhubung ke Suplier Database: <strong>{supplierName}</strong>
                </span>
              </div>
            ) : supplierName ? (
              <div className="flex items-center gap-1.5 px-2 py-0.5 text-[10px] text-amber-800 italic">
                <span>ℹ️ Suplier baru (akan tersimpan pada data bahan ini)</span>
              </div>
            ) : null}
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
