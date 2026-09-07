import React, { useState, useMemo, useCallback, useEffect, useRef } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { Plus, X, ChevronLeft, Loader2, Search, Check, ChevronDown, ChevronUp, Truck, Bike, Package2, Car, Fuel, Coffee, Utensils, CircleParking, Package, AlertCircle, Building2, Zap } from 'lucide-react'
import { Sheet, SheetContent, SheetTitle, SheetDescription } from '@/components/ui/sheet'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { DatePicker } from '@/components/ui/DatePicker'
import { PhoneInput } from '@/components/ui/PhoneInput'
import { format } from 'date-fns'
import { toast } from 'sonner'
import { formatIDR } from '@/lib/format'
import { cn } from '@/lib/utils'
import {
  useSembakoProducts, useSembakoCustomers, useSembakoSales, useSembakoEmployees, useSembakoDeliveries,
  useCreateSembakoProduct, useUpdateSembakoProduct, useCreateSembakoSale, useCreateSembakoDelivery,
  useRecordSembakoPayment, useUpdateSembakoSale, useCreateSembakoCustomer, useCreateSembakoEmployee,
  useSembakoAllBatches, useSembakoRawMaterials, useSembakoStockCustody,
} from '@/lib/hooks/useSembakoData'
import { useMediaQuery } from '@/lib/hooks/useMediaQuery'
import { useBackHandler } from '@/lib/hooks/useBackHandler'
import SembakoInvoicePreview from '../SembakoInvoicePreview'
import {
  C,
  CustomSelect, InputRupiah, ProgressIndicator, SummaryLine,
  PAYMENT_TERMS_DAYS, PAYMENT_TERMS_LABEL,
  CUSTOMER_TYPE_OPTIONS,
  UniversalMultiUnitCalculator,
  formatFriendlyErrorMessage,
} from './sembakoSaleUtils'
import { SembakoSuccessCard } from './SembakoSuccessCard'
import { calculateBomProductHpp, matchKemasanMaterial, matchStickerFrontMaterial, matchStickerBackMaterial, matchOtherPackagingMaterial } from '@/lib/inventory/bomStockCalculator'

const PRESET_OTHER_COST_CATEGORIES = [
  { id: 'bensin', label: 'BBM / Bensin', Icon: Fuel, color: '#2563EB', bg: '#EFF6FF', border: '#BFDBFE' },
  { id: 'makan', label: 'Uang Makan / Konsumsi', Icon: Coffee, color: '#059669', bg: '#F0FDF4', border: '#BBF7D0' },
  { id: 'parkir_tol', label: 'Tol / Parkir', Icon: CircleParking, color: '#7C3AED', bg: '#F5F3FF', border: '#DDD6FE' },
  { id: 'bongkar', label: 'Bongkar Muat', Icon: Package, color: '#DB2777', bg: '#FDF2F8', border: '#FBCFE8' },
]

// ─── Design tokens ────────────────────────────────────────────────────────────
const ACCENT   = C.accent   // #0F172A
const BG       = C.bg       // #F8FAFC
const SURFACE  = C.card     // #FFFFFF
const MUTED    = C.muted    // #64748B
const TEXT     = C.text     // #0F172A
const BORDER   = C.border   // #E2E8F0
const INPUT_BG = C.input    // #F1F5F9

const inputCn = `w-full h-12 bg-[#F1F5F9] border border-[#E2E8F0] rounded-xl px-4 text-[#0F172A] text-sm font-semibold focus:border-slate-500/50 focus:outline-none focus:ring-1 focus:ring-[#0F172A]/20 transition-colors appearance-none`
const labelCn = `block text-[9px] font-black text-[#64748B] uppercase tracking-[0.15em] mb-1.5`

const getFactor = (u, prod = null) => {
  if (!u) return 1
  const sel = String(u).toLowerCase()
  if (prod?.secondary_unit && sel === String(prod.secondary_unit).toLowerCase() && Number(prod.conversion_rate) > 0) {
    return Number(prod.conversion_rate)
  }
  const matchPcs = (prod?.product_name || '').match(/\((\d+)\s*pcs\)/i) || (prod?.notes || '').match(/\((\d+)\s*pcs\)/i)
  if (matchPcs && Number(matchPcs[1]) > 0) {
    const dynamicRate = Number(matchPcs[1])
    if (sel === 'karton') return dynamicRate
    if (sel === 'dus' && dynamicRate === 36) return 36
  }
  if (sel === 'karton' || sel === 'bal besar') return 40
  if (sel === 'dus' || sel === 'box') return 20
  if (sel === 'lusin' || sel === 'renceng') return 12
  if (sel === 'bal kecil' || sel === 'pak' || sel === 'slop' || sel === 'strip') return 10
  return 1
}

// ─── Mobile Customer Search Overlay ──────────────────────────────────────────
function MobileCustomerSearch({ customers, value, onSelect, onAddNew, onClose }) {
  const [q, setQ] = useState('')
  const inputRef = useRef(null)
  useEffect(() => { setTimeout(() => inputRef.current?.focus(), 100) }, [])

  const filtered = useMemo(() => {
    if (!q) return customers
    const lq = q.toLowerCase()
    return customers.filter(c =>
      c.customer_name?.toLowerCase().includes(lq) ||
      c.customer_type?.toLowerCase().includes(lq)
    )
  }, [customers, q])

  return (
    <div className="fixed inset-0 z-[200] flex flex-col" style={{ background: BG }}>
      {/* Search bar */}
      <div className="flex items-center gap-3 px-4 pt-4 pb-3 border-b" style={{ borderColor: BORDER }}>
        <button
          onClick={onClose}
          className="w-10 h-10 rounded-full flex items-center justify-center shrink-0"
          style={{ background: 'rgba(255,255,255,0.05)', color: TEXT }}
        >
          <ChevronLeft size={20} />
        </button>
        <div className="flex-1 relative">
          <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2" style={{ color: MUTED }} />
          <input
            ref={inputRef}
            value={q}
            onChange={e => setQ(e.target.value)}
            placeholder="Cari toko / customer..."
            className={inputCn + ' pl-9'}
          />
        </div>
      </div>

      {/* Results */}
      <div className="flex-1 overflow-y-auto px-4 py-3 space-y-2">
        {onAddNew && (
          <button
            onClick={() => { onAddNew(); onClose() }}
            className="w-full flex items-center gap-3 px-4 py-3 rounded-xl font-bold text-sm transition-all"
            style={{ background: `rgba(15,23,42,0.08)`, border: `1px dashed ${ACCENT}`, color: ACCENT }}
          >
            <Plus size={16} /> Tambah Toko Baru
          </button>
        )}
        {filtered.length === 0 && (
          <div className="text-center py-10" style={{ color: MUTED, fontSize: 13 }}>Tidak ada hasil</div>
        )}
        {filtered.map(c => (
          <button
            key={c.id}
            onClick={() => { onSelect(c.id); onClose() }}
            className="w-full flex items-center justify-between px-4 py-3 rounded-xl text-left transition-all"
            style={{
              background: value === c.id ? 'rgba(15,23,42,0.08)' : SURFACE,
              border: `1px solid ${value === c.id ? ACCENT : BORDER}`,
            }}
          >
            <div>
              <p className="font-bold text-sm" style={{ color: TEXT }}>{c.customer_name}</p>
              <p className="text-[11px] mt-0.5 font-medium" style={{ color: MUTED }}>
                {c.customer_type?.toUpperCase()} · {PAYMENT_TERMS_LABEL[c.payment_terms] || c.payment_terms}
              </p>
            </div>
            {value === c.id && <Check size={16} style={{ color: ACCENT }} />}
          </button>
        ))}
      </div>
    </div>
  )
}

// ─── Quick Add Customer Card ──────────────────────────────────────────────────
function QuickAddCustomer({ form, onChange, onSave, onCancel, saving, error }) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: 6 }}
      className="rounded-2xl p-4 space-y-3"
      style={{ background: SURFACE, border: error ? '1.5px solid #EF4444' : `1px solid ${ACCENT}` }}
    >
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <span className="text-sm font-black" style={{ color: TEXT }}>Toko Baru</span>
          {error && <span className="text-[10px] font-bold text-red-500 bg-red-50 px-2 py-0.5 rounded-md border border-red-200">Wajib Diisi</span>}
        </div>
        <button onClick={onCancel} className="w-7 h-7 rounded-full flex items-center justify-center" style={{ background: 'rgba(255,255,255,0.07)', color: MUTED }}>
          <X size={14} />
        </button>
      </div>
      <div className="space-y-2.5">
        <div>
          <label className={labelCn}>Nama Toko *</label>
          <input
            autoFocus
            className={`${inputCn} ${error ? 'border-red-500 focus:border-red-500 ring-1 ring-red-500/20' : ''}`}
            value={form.customer_name}
            onChange={e => onChange({ ...form, customer_name: e.target.value })}
            onKeyDown={e => {
              if (e.key === 'Enter') {
                e.preventDefault()
                onSave()
              }
            }}
            placeholder="Contoh: Toko Berkah"
          />
          {error && <p className="text-[11px] font-bold text-red-500 mt-1 flex items-center gap-1"><AlertCircle size={12} /> {error}</p>}
        </div>
        <div className="grid grid-cols-2 gap-2">
          <div>
            <label className={labelCn}>Tipe Toko</label>
            <CustomSelect value={form.customer_type} onChange={v => onChange({ ...form, customer_type: v })} options={CUSTOMER_TYPE_OPTIONS} placeholder="Pilih Tipe" />
          </div>
          <div>
            <label className={labelCn}>Terms Bayar</label>
            <CustomSelect
              value={form.payment_terms}
              onChange={v => onChange({ ...form, payment_terms: v })}
              options={Object.entries(PAYMENT_TERMS_LABEL).map(([k, v]) => ({ value: k, label: v }))}
              placeholder="Pilih"
            />
          </div>
        </div>
        <div>
          <label className={labelCn}>No HP</label>
          <PhoneInput value={form.phone} onChange={e => onChange({ ...form, phone: e.target.value })} placeholder="0812..." />
        </div>
        <button
          onClick={onSave}
          disabled={saving}
          className="w-full h-11 rounded-xl font-black text-sm flex items-center justify-center gap-2 transition-opacity cursor-pointer"
          style={{ background: ACCENT, color: '#fff', opacity: saving ? 0.6 : 1 }}
        >
          {saving ? <Loader2 size={16} className="animate-spin" /> : <Check size={16} />}
          {saving ? 'Menyimpan Toko...' : 'Simpan Toko'}
        </button>
      </div>
    </motion.div>
  )
}

// ─── Quick Add Product Card ───────────────────────────────────────────────────
function QuickAddProduct({ form, onChange, onSave, onCancel, saving }) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: 6 }}
      className="rounded-2xl p-4 space-y-3"
      style={{ background: SURFACE, border: `1px solid ${ACCENT}` }}
    >
      <div className="flex items-center justify-between">
        <span className="text-sm font-black" style={{ color: TEXT }}>Produk Baru</span>
        <button onClick={onCancel} className="w-7 h-7 rounded-full flex items-center justify-center" style={{ background: 'rgba(255,255,255,0.07)', color: MUTED }}>
          <X size={14} />
        </button>
      </div>
      <div className="space-y-2.5">
        <div>
          <label className={labelCn}>Nama Produk *</label>
          <input className={inputCn} value={form.product_name} onChange={e => onChange({ ...form, product_name: e.target.value })} placeholder="Bawang Goreng Original 250g" />
        </div>
        <div className="grid grid-cols-2 gap-2">
          <div>
            <label className={labelCn}>Kategori</label>
            <input className={inputCn} value={form.category} onChange={e => onChange({ ...form, category: e.target.value })} placeholder="bawang goreng / toples..." />
          </div>
          <div>
            <label className={labelCn}>Satuan</label>
            <input className={inputCn} value={form.unit} onChange={e => onChange({ ...form, unit: e.target.value })} placeholder="pcs/pouch/karton" />
          </div>
        </div>
        <div>
          <label className={labelCn}>Harga Jual Standard</label>
          <InputRupiah value={form.sell_price} onChange={v => onChange({ ...form, sell_price: v })} />
        </div>
        <button
          onClick={onSave}
          disabled={saving}
          className="w-full h-11 rounded-xl font-black text-sm flex items-center justify-center gap-2 transition-opacity"
          style={{ background: ACCENT, color: '#fff', opacity: saving ? 0.6 : 1 }}
        >
          {saving ? <Loader2 size={16} className="animate-spin" /> : <Check size={16} />}
          {saving ? 'Menyimpan...' : 'Simpan Produk'}
        </button>
      </div>
    </motion.div>
  )
}

function ProductItemRow({
  item, idx, products: _products, productOptions, total: _total,
  overStock, isPouchOverstock, customPouchStock, customPouchName,
  availableStockQty, stockSourceLabel,
  onChangeItem, onRemove, onAddNew, isOnly,
  allBatches = [], packagingMaterials = [], rawMaterialsList = [],
  getEffectivePouchStock
}) {
  const [isUnitDropdownOpen, setIsUnitDropdownOpen] = useState(false)
  const [isFifoExpanded, setIsFifoExpanded] = useState(false)
  const [isPackagingExpanded, setIsPackagingExpanded] = useState(Boolean(item.useCustomPackaging || item.customPackagingName || item.customPackagingNote))
  const prod = useMemo(() => _products.find(p => p.id === item.product_id), [item.product_id, _products])
  const baseUnit = item.unit || prod?.unit || 'pcs'

  const unitOptions = useMemo(() => {
    const base = item.unit || prod?.unit || 'pcs'
    const opts = [{ value: base, label: `${base} (Satuan Utama)` }]
    const matchPcs = (prod?.product_name || '').match(/\((\d+)\s*pcs\)/i) || (prod?.notes || '').match(/\((\d+)\s*pcs\)/i)
    const dynamicRate = matchPcs ? Number(matchPcs[1]) : (prod?.conversion_rate ? Number(prod.conversion_rate) : 40)

    if (prod?.secondary_unit && Number(prod?.conversion_rate) > 0 && prod.secondary_unit !== base) {
      opts.push({
        value: prod.secondary_unit,
        label: `${prod.secondary_unit} (${prod.conversion_rate} ${base})`
      })
    } else if (base === 'pcs' || base === 'bungkus' || base === 'biji') {
      opts.push(
        { value: 'renceng', label: 'renceng (12 pcs)' },
        { value: 'lusin', label: 'lusin (12 pcs)' },
        { value: 'dus', label: `dus (${dynamicRate === 36 ? 36 : 20} pcs)` },
        { value: 'karton', label: `karton (${dynamicRate} pcs)` }
      )
    }
    return opts
  }, [prod, item.unit])

  const factor = useMemo(() => {
    const sel = item.selectedUnit || baseUnit
    return getFactor(sel, prod)
  }, [item.selectedUnit, baseUnit, prod])

  const isMultiUnitPackaging = factor > 1
  const priceMode = item.priceMode || 'per_base'

  // Input price as typed by user in current priceMode
  const inputPrice = Number(item.price_per_unit || 0)

  // Calculate equivalent price in base unit and in packaging unit
  const pricePerBase = isMultiUnitPackaging
    ? (priceMode === 'per_kemasan' ? Math.round(inputPrice / factor) : inputPrice)
    : inputPrice

  const pricePerPackaging = isMultiUnitPackaging
    ? (priceMode === 'per_kemasan' ? inputPrice : inputPrice * factor)
    : inputPrice

  // Subtotal calculation
  const subtotal = isMultiUnitPackaging
    ? (priceMode === 'per_kemasan'
        ? Math.round((Number(item.quantity) || 0) * inputPrice)
        : Math.round((Number(item.quantity) || 0) * factor * inputPrice)
      )
    : Math.round((Number(item.quantity) || 0) * inputPrice)

  // Base HPP per base unit
  const baseCogsPerBase = Number(item.cogs_per_unit || 0)
  // Display HPP matching active priceMode
  const displayHpp = isMultiUnitPackaging
    ? (priceMode === 'per_kemasan' ? baseCogsPerBase * factor : baseCogsPerBase)
    : baseCogsPerBase

  const isBelowHpp = baseCogsPerBase > 0 && pricePerBase > 0 && pricePerBase < baseCogsPerBase
  const marginPerUnit = pricePerBase > 0 && baseCogsPerBase > 0 ? pricePerBase - baseCogsPerBase : null

  const sFrontMat = prod ? matchStickerFrontMaterial(prod, rawMaterialsList) : null
  const sBackMat = prod ? matchStickerBackMaterial(prod, rawMaterialsList) : null
  const otherMat = prod ? matchOtherPackagingMaterial(prod, rawMaterialsList) : null
  const sFrontCost = Number(sFrontMat?.unit_cost || prod?.sticker_front_cost || 0)
  const sBackCost = Number(sBackMat?.unit_cost || prod?.sticker_back_cost || 0)
  const otherPkgCost = Number(otherMat?.unit_cost || prod?.other_packaging_cost || 0)
  const deltaStickers = (item.noFrontSticker ? -sFrontCost : 0) + (item.noBackSticker ? -sBackCost : 0)
  const deltaPolymailer = item.noPolymailer ? -otherPkgCost : 0
  const deltaAllSavings = deltaStickers + deltaPolymailer

  const isPolos = Boolean(item.noFrontSticker && item.noBackSticker)
  const hasCustomSticker = Boolean(item.customStickerName || Number(item.customStickerCost) > 0)
  const hasCustomPackaging = Boolean(item.useCustomPackaging || item.customPackagingId || item.customPackagingName || Number(item.customPackagingCost) > 0)
  const hasCustomNotes = Boolean(item.customPackagingNote)
  const hasSpecialRequest = Boolean(isPolos || hasCustomSticker || hasCustomPackaging || hasCustomNotes || item.noPolymailer || item.noFrontSticker || item.noBackSticker)

  const packagingSummaryLabel = useMemo(() => {
    if (!hasSpecialRequest) {
      return 'Standar Lengkap (Pouch + Stiker Depan & Belakang)'
    }
    const parts = []
    if (hasCustomPackaging) {
      parts.push(item.customPackagingName || 'Wadah Khusus')
    } else {
      parts.push('Pouch Standar')
    }
    if (isPolos) {
      parts.push('🚫 Polosan (Tanpa Stiker)')
    } else if (hasCustomSticker) {
      parts.push(`➕ ${item.customStickerName || 'Stiker Tambahan'}`)
    } else if (item.noFrontSticker) {
      parts.push('Tanpa Stiker Depan')
    } else if (item.noBackSticker) {
      parts.push('Tanpa Stiker Belakang')
    } else {
      parts.push('Stiker Standar')
    }
    if (item.noPolymailer) {
      parts.push('Tanpa Polymailer')
    }
    return parts.join(' · ')
  }, [hasSpecialRequest, hasCustomPackaging, item.customPackagingName, isPolos, hasCustomSticker, item.customStickerName, item.noFrontSticker, item.noBackSticker, item.noPolymailer])

  // Calculate local FIFO breakdown for UI suggestion
  const prodBatches = useMemo(() => {
    if (!item.product_id || !allBatches.length) return []
    return allBatches
      .filter(b => b.product_id === item.product_id && !b.is_deleted && (b.qty_sisa || 0) > 0)
      .sort((a, b) => new Date(a.created_at || a.purchase_date) - new Date(b.created_at || b.purchase_date))
  }, [item.product_id, allBatches])

  const fifoBreakdown = useMemo(() => {
    const qty = (Number(item.quantity) || 0) * factor
    if (qty <= 0 || prodBatches.length === 0) return []

    const stdKemasan = prod ? matchKemasanMaterial(prod, rawMaterialsList) : null
    const stdKemasanCost = Number(stdKemasan?.unit_cost) || 0
    let customCost = 0
    if (item.useCustomPackaging) {
      if (item.customPackagingCost !== undefined && item.customPackagingCost !== '' && Number(item.customPackagingCost) >= 0) {
        customCost = Number(item.customPackagingCost)
      } else if (item.customPackagingId) {
        const foundMat = rawMaterialsList.find(m => m.id === item.customPackagingId)
        if (foundMat) customCost = Number(foundMat.unit_cost) || 0
      }
    }
    const extraStickerCost = Number(item.customStickerCost) || 0
    const deltaPackaging = (item.useCustomPackaging ? (customCost - stdKemasanCost) : 0) + deltaStickers + deltaPolymailer + extraStickerCost

    let remaining = qty
    const breakdown = []
    
    for (const batch of prodBatches) {
      if (remaining <= 0) break
      const take = Math.min(batch.qty_sisa, remaining)
      breakdown.push({
        batch_code: batch.batch_code,
        qty: take,
        buy_price: (batch.buy_price || 0) + deltaPackaging,
        supplier_name: batch.sembako_suppliers?.supplier_name || 'Tanpa Supplier'
      })
      remaining -= take
    }
    
    if (remaining > 0) {
      const fallbackCost = prod ? (calculateBomProductHpp(prod, rawMaterialsList, item.useCustomPackaging ? { unit_cost: customCost } : null, { noFrontSticker: item.noFrontSticker, noBackSticker: item.noBackSticker, noPolymailer: item.noPolymailer }) || ((prod.avg_buy_price || 0) + deltaPackaging)) : 0
      breakdown.push({
        batch_code: 'Fallback (Stok Kurang)',
        qty: remaining,
        buy_price: fallbackCost,
        supplier_name: 'System Default'
      })
    }
    
    return breakdown
  }, [item.quantity, item.useCustomPackaging, item.customPackagingCost, item.customPackagingId, item.customStickerCost, item.noFrontSticker, item.noBackSticker, item.noPolymailer, deltaStickers, deltaPolymailer, prodBatches, prod, factor, rawMaterialsList])

  return (
    <div
      className="rounded-2xl p-4 space-y-3"
      style={{
        background: SURFACE,
        border: `1px solid ${overStock ? 'rgba(239,68,68,0.35)' : isBelowHpp ? 'rgba(239,68,68,0.35)' : BORDER}`,
        position: 'relative',
      }}
    >
      {/* Row: product selector + remove */}
      <div className="flex gap-2">
        <div className="flex-1 min-w-0">
          <label className={labelCn}>Produk</label>
          <CustomSelect
            value={item.product_id}
            placeholder="Pilih produk..."
            searchPlaceholder="Cari produk / varian / kemasan..."
            options={productOptions}
            onChange={val => onChangeItem(idx, 'product_id', val)}
            onAddNew={onAddNew}
          />
        </div>
        {!isOnly && (
          <button
            onClick={() => onRemove(idx)}
            className="self-end w-10 h-12 rounded-xl flex items-center justify-center shrink-0"
            style={{ background: 'rgba(239,68,68,0.1)', color: '#EF4444' }}
          >
            <X size={16} />
          </button>
        )}
      </div>

      {/* Full-width Stock Availability Strip */}
      {prod && (
        <div className="flex items-center justify-between px-3 py-2 rounded-xl bg-slate-50 border border-slate-200/80 text-xs">
          <span className="font-bold text-slate-600 flex items-center gap-1.5 min-w-0 truncate">
            <span>📦</span>
            <span className="truncate">Stok Fisik ({stockSourceLabel || 'Gudang'}):</span>
          </span>
          <span className={cn(
            "px-2.5 py-0.5 rounded-lg font-mono font-black text-xs shrink-0 ml-2",
            (availableStockQty !== undefined ? availableStockQty : prod.current_stock) <= 0
              ? "bg-rose-100 text-rose-700 border border-rose-200"
              : "bg-emerald-100 text-emerald-800 border border-emerald-200"
          )}>
            {availableStockQty !== undefined ? availableStockQty : prod.current_stock} {baseUnit}
          </span>
        </div>
      )}
      
      {unitOptions.length > 1 && (
        <div className="mt-2.5">
          <label className={labelCn}>Satuan Transaksi</label>
          <div className="relative">
            <button
              type="button"
              onClick={() => setIsUnitDropdownOpen(!isUnitDropdownOpen)}
              className="w-full h-12 bg-[#F1F5F9] border border-[#E2E8F0] rounded-xl px-4 flex items-center justify-between text-[#0F172A] text-sm font-semibold focus:outline-none placeholder-slate-400 cursor-pointer"
              style={{ fontFamily: 'DM Sans' }}
            >
              <span className="capitalize">{item.selectedUnit || baseUnit}</span>
              <ChevronDown size={16} className="text-slate-500" style={{ transform: isUnitDropdownOpen ? 'rotate(180deg)' : 'none', transition: 'transform 0.2s' }} />
            </button>
            {isUnitDropdownOpen && (
              <>
                <div className="fixed inset-0 z-40" onClick={() => setIsUnitDropdownOpen(false)} />
                <div className="absolute left-0 right-0 mt-1.5 bg-[#FFFFFF] border border-[#E2E8F0] rounded-xl shadow-xl z-50 overflow-hidden py-1" style={{ top: '100%' }}>
                  {unitOptions.map(opt => (
                    <button
                      key={opt.value}
                      type="button"
                      onClick={() => {
                        onChangeItem(idx, 'selectedUnit', opt.value)
                        setIsUnitDropdownOpen(false)
                      }}
                      className="w-full text-left px-4 py-3 text-sm font-semibold text-slate-700 hover:bg-slate-50 transition-colors flex items-center justify-between border-none bg-transparent cursor-pointer"
                      style={{ fontFamily: 'DM Sans' }}
                    >
                      <span>{opt.label}</span>
                      {(item.selectedUnit || baseUnit) === opt.value && (
                        <Check size={16} className="text-[#16A34A]" strokeWidth={3} />
                      )}
                    </button>
                  ))}
                </div>
              </>
            )}
          </div>
        </div>
      )}

      {/* Row: qty + price */}
      <div className="grid grid-cols-2 gap-2 mt-2.5">
        <div>
          <div className="flex items-end h-8 mb-1.5">
            <label className={labelCn} style={{ marginBottom: 0 }}>
              QTY ({item.selectedUnit || baseUnit || 'Unit'})
            </label>
          </div>
          <input
            type="text"
            inputMode="decimal"
            value={item.quantity === 0 || item.quantity === '0' ? '' : item.quantity || ''}
            onChange={e => {
              const val = e.target.value
              if (val === '' || /^[0-9]*[.,]?[0-9]*$/.test(val)) {
                onChangeItem(idx, 'quantity', val.replace(',', '.'))
              }
            }}
            className={inputCn}
            placeholder="0"
          />
          {factor > 1 && Number(item.quantity) > 0 && (
            <p className="text-[10px] font-bold text-indigo-600 mt-1 flex items-center gap-1">
              <span>📦 = {Number(item.quantity) * factor} {baseUnit}</span>
            </p>
          )}
          {isPouchOverstock ? (
            <p className="text-[10.5px] font-bold text-rose-600 mt-1 flex items-center gap-1">
              <span>⚠️</span>
              <span>Stok kemasan tidak cukup — sisa {customPouchStock} pcs</span>
            </p>
          ) : overStock ? (
            <p className="text-[10.5px] font-bold text-rose-600 mt-1 flex items-center gap-1">
              <span>⚠️</span>
              <span>
                Stok {stockSourceLabel || 'tersedia'} tidak cukup — sisa {availableStockQty !== undefined ? availableStockQty : (prod?.current_stock || 0)} {baseUnit}
              </span>
            </p>
          ) : null}
          {isBelowHpp && (
            <p className="text-[10px] font-bold text-rose-600 mt-0.5 flex items-center gap-1">
              <span>⚠️</span>
              <span>Harga di bawah HPP (Rugi Rp {formatIDR(baseCogsPerBase - pricePerBase)}/{baseUnit})</span>
            </p>
          )}
        </div>
        <div>
          <div className="flex items-end h-8 mb-1.5 justify-between">
            <label className={labelCn} style={{ marginBottom: 0 }}>
              Harga / {isMultiUnitPackaging ? (priceMode === 'per_kemasan' ? item.selectedUnit : baseUnit) : (item.selectedUnit || baseUnit)}
            </label>
          </div>

          {/* Segmented Mode Toggle for Multi-Unit Packaging */}
          {isMultiUnitPackaging && (
            <div className="flex bg-[#F1F5F9] rounded-lg p-0.5 gap-1 mb-1.5 border border-[#E2E8F0]">
              <button
                type="button"
                onClick={() => onChangeItem(idx, 'priceMode', 'per_base')}
                className={`flex-1 py-1 px-1.5 rounded-md text-[10px] font-bold transition-all border-0 cursor-pointer flex items-center justify-center gap-1 ${
                  priceMode === 'per_base'
                    ? 'bg-white text-slate-900 shadow-xs font-extrabold'
                    : 'bg-transparent text-slate-500 hover:text-slate-700'
                }`}
              >
                <span>🏷️ Per {baseUnit}</span>
              </button>
              <button
                type="button"
                onClick={() => onChangeItem(idx, 'priceMode', 'per_kemasan')}
                className={`flex-1 py-1 px-1.5 rounded-md text-[10px] font-bold transition-all border-0 cursor-pointer flex items-center justify-center gap-1 ${
                  priceMode === 'per_kemasan'
                    ? 'bg-white text-slate-900 shadow-xs font-extrabold'
                    : 'bg-transparent text-slate-500 hover:text-slate-700'
                }`}
              >
                <span className="capitalize">📦 Per {item.selectedUnit}</span>
              </button>
            </div>
          )}

          <InputRupiah
            value={item.price_per_unit}
            onChange={v => onChangeItem(idx, 'price_per_unit', v)}
            className={inputCn}
          />
          {isMultiUnitPackaging && (
            <p className="text-[10px] font-bold text-slate-500 mt-1">
              {priceMode === 'per_base'
                ? (inputPrice > 0 ? `≈ ${formatIDR(pricePerPackaging)} / ${item.selectedUnit}` : `Otomatis dihitung / ${item.selectedUnit}`)
                : (inputPrice > 0 ? `≈ ${formatIDR(pricePerBase)} / ${baseUnit}` : `Otomatis dihitung / ${baseUnit}`)}
            </p>
          )}
          {!isMultiUnitPackaging && factor > 1 && Number(item.price_per_unit) > 0 && (
            <p className="text-[10px] font-bold text-slate-500 mt-1">
              ≈ ${formatIDR(Math.round(Number(item.price_per_unit) / factor))} / ${baseUnit}
            </p>
          )}
        </div>
      </div>

      {/* Full-width suggestions and metadata section */}
      {prod && (
        <div className="space-y-3 pt-1 border-t border-[#E2E8F0] mt-1">
          {/* Price Suggestions Row */}
          <div
            onClick={() => setIsFifoExpanded(!isFifoExpanded)}
            className="flex flex-wrap gap-1.5 items-center bg-[#F8FAFC] border border-[#E2E8F0] rounded-xl p-2.5 cursor-pointer select-none active:bg-slate-50 transition-colors"
          >
            <div className="flex justify-between items-center w-full mb-1">
              <span className="text-[10px] text-slate-500 font-extrabold uppercase tracking-wider mr-1 select-none flex items-center gap-1">
                Saran Harga ({isMultiUnitPackaging ? (priceMode === 'per_kemasan' ? `Per ${item.selectedUnit}` : `Per ${baseUnit}`) : 'Standar'}):
                <ChevronDown size={10} style={{ transform: isFifoExpanded ? 'rotate(180deg)' : 'none', transition: 'transform 0.2s' }} />
              </span>
              {displayHpp > 0 && !isFifoExpanded && (
                <button
                  type="button"
                  onClick={(e) => {
                    e.stopPropagation()
                    onChangeItem(idx, 'price_per_unit', displayHpp)
                  }}
                  className="text-[10px] font-black text-rose-700 bg-rose-50 hover:bg-rose-100/80 border border-rose-300/30 rounded-lg px-2 py-0.5 outline-none transition-all active:scale-95 cursor-pointer flex items-center gap-1 select-none"
                  style={{ fontFamily: 'DM Sans' }}
                >
                  <span>HPP: {formatIDR(displayHpp)}</span>
                </button>
              )}
            </div>
            
            <div className="flex flex-wrap gap-1.5 items-center w-full">
              {/* Standard Price */}
              {(() => {
                const stdPrice = isMultiUnitPackaging
                  ? (priceMode === 'per_kemasan' ? (prod.sell_price * factor) : prod.sell_price)
                  : (prod.sell_price * factor)
                if (stdPrice > 0 && stdPrice !== Number(item.price_per_unit)) {
                  return (
                    <button
                      type="button"
                      onClick={(e) => {
                        e.stopPropagation()
                        onChangeItem(idx, 'price_per_unit', stdPrice)
                      }}
                      className="text-[10px] font-bold px-2 py-1 rounded-lg bg-slate-100 hover:bg-slate-200 text-slate-800 border border-slate-300 active:scale-95 transition-all cursor-pointer"
                    >
                      Std: {formatIDR(stdPrice)}
                    </button>
                  )
                }
                return null
              })()}
              
              {/* HPP Markups */}
              {displayHpp > 0 && isFifoExpanded && [1.00, 1.10, 1.15, 1.20].map((multiplier, mIdx) => {
                const markupPrice = Math.round(displayHpp * multiplier)
                const label = multiplier === 1.00 ? 'HPP (Modal)' : `+${Math.round((multiplier - 1) * 100)}%`
                if (markupPrice === Number(item.price_per_unit)) return null
                return (
                  <button
                    key={mIdx}
                    type="button"
                    onClick={(e) => {
                      e.stopPropagation()
                      onChangeItem(idx, 'price_per_unit', markupPrice)
                    }}
                    className={`text-[10px] font-bold px-2 py-1 rounded-lg border active:scale-95 transition-all cursor-pointer font-mono ${
                      multiplier === 1.00 
                        ? 'bg-rose-50 hover:bg-rose-100 text-rose-700 border-rose-200' 
                        : 'bg-slate-100 hover:bg-slate-200 text-slate-800 border-slate-300'
                    }`}
                  >
                    {label}: {formatIDR(markupPrice)}
                  </button>
                )
              })}
            </div>
          </div>
          
          {/* HPP Summary Row */}
          {displayHpp > 0 && isFifoExpanded && (
            <div className="flex flex-col gap-1.5">
              <div className="flex items-center justify-between text-xs px-1">
                <span className="font-bold uppercase tracking-wider text-slate-500 text-[10px]">
                  HPP Terbobot (FIFO)
                </span>
                <span className="font-black text-slate-800 font-mono text-xs">
                  {formatIDR(displayHpp)} / {isMultiUnitPackaging ? (priceMode === 'per_kemasan' ? item.selectedUnit : baseUnit) : (item.selectedUnit || item.unit || baseUnit)}
                </span>
              </div>

              {/* FIFO Breakdown Info Box */}
              {fifoBreakdown.length > 0 && (
                <div style={{ background: '#F8FAFC', border: '1px dashed #E2E8F0', borderRadius: 12, padding: '10px 12px' }}>
                  <div style={{ fontSize: 9, fontWeight: 900, textTransform: 'uppercase', color: '#64748B', letterSpacing: '0.04em', marginBottom: 4 }}>
                    Alokasi FIFO Batch:
                  </div>
                  <div className="space-y-1.5">
                    {fifoBreakdown.map((b, bIdx) => {
                      const qtyInUnit = b.qty / factor
                      const buyPriceInUnit = isMultiUnitPackaging && priceMode === 'per_kemasan'
                        ? b.buy_price * factor
                        : b.buy_price
                      const unitLabel = isMultiUnitPackaging && priceMode === 'per_kemasan'
                        ? item.selectedUnit
                        : baseUnit
                      return (
                        <div key={bIdx} className="flex justify-between items-center text-[10px] font-mono leading-tight">
                          <span className="text-[#0F172A] font-bold truncate max-w-[220px]">
                            {qtyInUnit} {item.selectedUnit || item.unit || baseUnit} @ {formatIDR(buyPriceInUnit)}/{unitLabel}
                          </span>
                          <span className="text-muted-foreground text-[9px] truncate max-w-[150px]" title={b.batch_code}>
                            ({b.batch_code.includes('Fallback') ? 'Fallback' : b.batch_code.replace('BATCH-', '')})
                          </span>
                        </div>
                      )
                    })}
                  </div>
                  
                  {/* Warning / Explanation note */}
                  {fifoBreakdown.length > 1 && !fifoBreakdown.some(b => b.batch_code.includes('Fallback')) && (
                    <div className="text-[9px] text-slate-500 font-medium mt-2 leading-normal flex items-start gap-1">
                      <span>ℹ️</span>
                      <span>Kuantitas mencakup lebih dari 1 batch karena sisa batch sebelumnya telah habis.</span>
                    </div>
                  )}
                  {fifoBreakdown.some(b => b.batch_code.includes('Fallback')) && (
                    <div className="text-[9px] text-[#B91C1C] font-bold mt-2 leading-normal flex items-start gap-1">
                      <span>⚠️</span>
                      <span>Stok batch aktif tidak mencukupi pesanan ini. Sisa menggunakan estimasi default.</span>
                    </div>
                  )}
                </div>
              )}
            </div>
          )}

          {marginPerUnit !== null && !isBelowHpp && (
            <div className="flex items-center justify-between text-xs px-1 border-t border-slate-100 pt-2">
              <span className="font-bold uppercase tracking-wider text-emerald-700 text-[10px]">Estimasi Margin Keuntungan</span>
              <span className="font-black text-emerald-700 font-mono text-xs">+{formatIDR(marginPerUnit)} / {baseUnit}</span>
            </div>
          )}

          {/* Status Kemasan & Panel Permintaan Khusus */}
          <div className="pt-2 border-t border-[#E2E8F0] mt-1">
            <button
              type="button"
              onClick={() => setIsPackagingExpanded(!isPackagingExpanded)}
              className={`w-full flex items-center justify-between py-2 px-3 rounded-xl border text-xs font-semibold transition-all cursor-pointer ${
                hasSpecialRequest
                  ? 'bg-amber-500/10 border-amber-500/30 text-amber-900 shadow-xs'
                  : 'bg-[#F8FAFC] border-[#E2E8F0] text-slate-700 hover:bg-slate-100/80'
              }`}
            >
              <div className="flex items-center gap-2 min-w-0">
                <Package size={15} className={hasSpecialRequest ? 'text-amber-600 shrink-0' : 'text-slate-400 shrink-0'} />
                <div className="flex items-center gap-1.5 min-w-0 truncate text-xs">
                  <span className="text-slate-500 font-medium">Kemasan:</span>
                  <span className={`font-bold truncate ${hasSpecialRequest ? 'text-amber-800' : 'text-slate-800'}`}>
                    {packagingSummaryLabel}
                  </span>
                </div>
              </div>
              <div className="flex items-center gap-1 shrink-0 text-[11px] font-bold text-amber-700">
                <span>{hasSpecialRequest ? '✏️ Ubah Request' : '⚙️ Permintaan Khusus'}</span>
                <ChevronDown size={14} style={{ transform: isPackagingExpanded ? 'rotate(180deg)' : 'none', transition: 'transform 0.2s' }} />
              </div>
            </button>

            {isPackagingExpanded && (
              <div className="mt-2.5 p-3.5 rounded-2xl bg-gradient-to-b from-amber-50/90 to-amber-50/40 border border-amber-200/80 space-y-3.5 animate-in fade-in duration-150">
                {/* Header Panel */}
                <div className="flex items-center justify-between pb-2 border-b border-amber-200/60">
                  <div className="flex items-center gap-1.5">
                    <span className="text-sm">⚙️</span>
                    <span className="text-xs font-black uppercase tracking-wider text-amber-950">
                      Permintaan Khusus Kemasan & Stiker
                    </span>
                  </div>
                  {hasSpecialRequest && (
                    <button
                      type="button"
                      onClick={() => {
                        onChangeItem(idx, {
                          useCustomPackaging: false,
                          customPackagingId: '',
                          customPackagingName: '',
                          customPackagingCost: 0,
                          customPackagingNote: '',
                          noFrontSticker: false,
                          noBackSticker: false,
                          noPolymailer: false,
                          customStickerName: '',
                          customStickerCost: 0
                        })
                      }}
                      className="text-[10px] font-bold text-rose-600 hover:text-rose-700 bg-rose-50 hover:bg-rose-100/80 px-2 py-0.5 rounded-lg border border-rose-200 transition-all cursor-pointer"
                    >
                      ↺ Reset ke Standar Lengkap
                    </button>
                  )}
                </div>

                {/* Section 1: Stiker Produk */}
                <div className="space-y-1.5">
                  <div className="flex items-center justify-between">
                    <label className="text-[11px] font-extrabold text-slate-700 flex items-center gap-1">
                      <span>🏷️</span> Opsi Stiker Kemasan:
                    </label>
                    <span className="text-[10px] text-muted-foreground font-medium">Bawaan: Stiker Depan & Belakang</span>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-3 gap-2">
                    {/* Option 1: Standar */}
                    <button
                      type="button"
                      onClick={() => {
                        onChangeItem(idx, {
                          noFrontSticker: false,
                          noBackSticker: false,
                          customStickerName: '',
                          customStickerCost: 0
                        })
                      }}
                      className={`p-2.5 rounded-xl border text-left transition-all cursor-pointer ${
                        !isPolos && !hasCustomSticker
                          ? 'bg-white border-amber-500 ring-2 ring-amber-500/20 shadow-xs'
                          : 'bg-white/70 border-slate-200 hover:bg-white text-slate-600'
                      }`}
                    >
                      <div className="flex items-center justify-between mb-1">
                        <span className="text-xs font-bold text-slate-800 flex items-center gap-1">
                          <span>✨</span> Standar Lengkap
                        </span>
                        {!isPolos && !hasCustomSticker && (
                          <span className="w-2 h-2 rounded-full bg-amber-500" />
                        )}
                      </div>
                      <p className="text-[10px] text-slate-500 leading-tight">
                        Stiker Depan & Belakang Juragan tertempel rapi.
                      </p>
                    </button>

                    {/* Option 2: Polosan / White-Label */}
                    <button
                      type="button"
                      onClick={() => {
                        onChangeItem(idx, {
                          noFrontSticker: true,
                          noBackSticker: true,
                          customStickerName: '',
                          customStickerCost: 0
                        })
                      }}
                      className={`p-2.5 rounded-xl border text-left transition-all cursor-pointer ${
                        isPolos
                          ? 'bg-white border-amber-600 ring-2 ring-amber-600/20 shadow-xs'
                          : 'bg-white/70 border-slate-200 hover:bg-white text-slate-600'
                      }`}
                    >
                      <div className="flex items-center justify-between mb-1">
                        <span className="text-xs font-bold text-slate-800 flex items-center gap-1">
                          <span>🚫</span> Polosan (Tanpa Stiker)
                        </span>
                        {isPolos && (
                          <span className="w-2 h-2 rounded-full bg-amber-600" />
                        )}
                      </div>
                      <p className="text-[10px] text-slate-500 leading-tight">
                        White-label untuk reseller. Tidak ditempel stiker merk.
                      </p>
                    </button>

                    {/* Option 3: Tambahan Stiker Khusus */}
                    <button
                      type="button"
                      onClick={() => {
                        onChangeItem(idx, {
                          noFrontSticker: false,
                          noBackSticker: false,
                          customStickerName: item.customStickerName || 'Stiker Toko / Custom',
                          customStickerCost: Number(item.customStickerCost) || 0
                        })
                      }}
                      className={`p-2.5 rounded-xl border text-left transition-all cursor-pointer ${
                        hasCustomSticker
                          ? 'bg-white border-amber-600 ring-2 ring-amber-600/20 shadow-xs'
                          : 'bg-white/70 border-slate-200 hover:bg-white text-slate-600'
                      }`}
                    >
                      <div className="flex items-center justify-between mb-1">
                        <span className="text-xs font-bold text-slate-800 flex items-center gap-1">
                          <span>➕</span> Tambahan Stiker Khusus
                        </span>
                        {hasCustomSticker && (
                          <span className="w-2 h-2 rounded-full bg-amber-600" />
                        )}
                      </div>
                      <p className="text-[10px] text-slate-500 leading-tight">
                        Stiker logo reseller, fragile, halal, dsb.
                      </p>
                    </button>
                  </div>

                  {/* Input Stiker Khusus jika opsi Tambahan aktif */}
                  {hasCustomSticker && (
                    <div className="p-3 rounded-xl bg-white border border-amber-300 space-y-2 mt-2">
                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                        <div>
                          <label className="text-[10px] font-bold text-slate-700 block mb-1">
                            Nama / Keterangan Stiker Tambahan:
                          </label>
                          <input
                            type="text"
                            placeholder="Misal: Stiker Reseller Toko Berkah / Logo Custom"
                            value={item.customStickerName || ''}
                            onChange={(e) => onChangeItem(idx, { customStickerName: e.target.value })}
                            className="w-full px-2.5 py-1.5 rounded-lg bg-amber-50/40 border border-amber-200 text-xs font-semibold text-slate-800 focus:outline-none focus:ring-1 focus:ring-amber-500"
                          />
                        </div>
                        <div>
                          <label className="text-[10px] font-bold text-slate-700 block mb-1">
                            Biaya Tambahan Stiker (Rp/pcs):
                          </label>
                          <InputRupiah
                            value={item.customStickerCost || 0}
                            onChange={(val) => onChangeItem(idx, { customStickerCost: val })}
                            className="w-full px-2.5 py-1.5 rounded-lg bg-amber-50/40 border border-amber-200 text-xs font-bold text-slate-800 focus:outline-none focus:ring-1 focus:ring-amber-500"
                          />
                        </div>
                      </div>
                      <p className="text-[10px] text-amber-800 font-medium">
                        💡 Tim gudang akan menyiapkan dan menempel stiker ini sesuai instruksi pada surat jalan / SPK.
                      </p>
                    </div>
                  )}
                </div>

                {/* Section 2: Wadah / Pouch */}
                <div className="space-y-1.5 pt-1">
                  <div className="flex items-center justify-between">
                    <label className="text-[11px] font-extrabold text-slate-700 flex items-center gap-1">
                      <span>🛍️</span> Pilihan Wadah / Kemasan:
                    </label>
                    <span className="text-[10px] text-muted-foreground font-medium">Bawaan: Pouch Standar Produk</span>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                    {/* Pouch Standar */}
                    <button
                      type="button"
                      onClick={() => {
                        onChangeItem(idx, {
                          useCustomPackaging: false,
                          customPackagingId: '',
                          customPackagingName: '',
                          customPackagingCost: 0
                        })
                      }}
                      className={`p-2.5 rounded-xl border text-left transition-all cursor-pointer ${
                        !hasCustomPackaging
                          ? 'bg-white border-amber-500 ring-2 ring-amber-500/20 shadow-xs'
                          : 'bg-white/70 border-slate-200 hover:bg-white text-slate-600'
                      }`}
                    >
                      <div className="flex items-center justify-between mb-1">
                        <span className="text-xs font-bold text-slate-800 flex items-center gap-1">
                          <span>📦</span> Pouch Standar Bawaan
                        </span>
                        {!hasCustomPackaging && (
                          <span className="w-2 h-2 rounded-full bg-amber-500" />
                        )}
                      </div>
                      <p className="text-[10px] text-slate-500 leading-tight">
                        Menggunakan kemasan standar produk hasil combine gudang.
                      </p>
                    </button>

                    {/* Wadah / Pouch Khusus */}
                    <button
                      type="button"
                      onClick={() => {
                        onChangeItem(idx, {
                          useCustomPackaging: true,
                          customPackagingName: item.customPackagingName || 'Toples / Wadah Khusus',
                          customPackagingCost: Number(item.customPackagingCost) || 0
                        })
                      }}
                      className={`p-2.5 rounded-xl border text-left transition-all cursor-pointer ${
                        hasCustomPackaging
                          ? 'bg-white border-amber-600 ring-2 ring-amber-600/20 shadow-xs'
                          : 'bg-white/70 border-slate-200 hover:bg-white text-slate-600'
                      }`}
                    >
                      <div className="flex items-center justify-between mb-1">
                        <span className="text-xs font-bold text-slate-800 flex items-center gap-1">
                          <span>🥫</span> Ganti Wadah Khusus (Toples / Foil)
                        </span>
                        {hasCustomPackaging && (
                          <span className="w-2 h-2 rounded-full bg-amber-600" />
                        )}
                      </div>
                      <p className="text-[10px] text-slate-500 leading-tight">
                        Pindah ke toples, standing pouch matte, atau wadah custom.
                      </p>
                    </button>
                  </div>

                  {/* Input Wadah Khusus */}
                  {hasCustomPackaging && (
                    <div className="p-3 rounded-xl bg-white border border-amber-300 space-y-2 mt-2">
                      <div className="grid grid-cols-1 sm:grid-cols-3 gap-2">
                        <div>
                          <label className="text-[10px] font-bold text-slate-700 block mb-1">
                            Pilih dari Stok Kemasan:
                          </label>
                          <Select
                            value={item.customPackagingId || 'custom'}
                            onValueChange={(val) => {
                              if (val && val !== 'custom') {
                                const selectedMat = packagingMaterials.find(m => m.id === val)
                                if (selectedMat) {
                                  onChangeItem(idx, {
                                    useCustomPackaging: true,
                                    customPackagingId: selectedMat.id,
                                    customPackagingName: selectedMat.material_name,
                                    customPackagingCost: Number(selectedMat.unit_cost) || 0
                                  })
                                }
                              } else {
                                onChangeItem(idx, {
                                  useCustomPackaging: true,
                                  customPackagingId: '',
                                  customPackagingName: item.customPackagingName || '',
                                  customPackagingCost: Number(item.customPackagingCost) || 0
                                })
                              }
                            }}
                          >
                            <SelectTrigger className="w-full h-8 px-2.5 rounded-lg bg-amber-50/40 border border-amber-200 text-xs font-semibold text-slate-800">
                              <SelectValue placeholder="-- Pilih Wadah / Custom --" />
                            </SelectTrigger>
                            <SelectContent className="z-[9999]">
                              <SelectItem value="custom">-- Input Manual / Wadah Luar --</SelectItem>
                              {packagingMaterials.map(m => {
                                const effectiveStock = getEffectivePouchStock ? getEffectivePouchStock(m.id) : m.current_stock
                                return (
                                  <SelectItem key={m.id} value={m.id}>
                                    {m.material_name} (Sisa: {effectiveStock} {m.unit || 'pcs'})
                                  </SelectItem>
                                )
                              })}
                            </SelectContent>
                          </Select>
                        </div>

                        <div>
                          <label className="text-[10px] font-bold text-slate-700 block mb-1">
                            Nama Wadah / Kustom:
                          </label>
                          <input
                            type="text"
                            placeholder="Misal: Toples 250ml / Pouch Silver"
                            value={item.customPackagingName || ''}
                            onChange={(e) => onChangeItem(idx, {
                              useCustomPackaging: true,
                              customPackagingName: e.target.value
                            })}
                            className="w-full px-2.5 py-1.5 rounded-lg bg-amber-50/40 border border-amber-200 text-xs font-semibold text-slate-800 focus:outline-none focus:ring-1 focus:ring-amber-500"
                          />
                        </div>

                        <div>
                          <label className="text-[10px] font-bold text-slate-700 block mb-1">
                            Biaya Wadah (Rp/pcs):
                          </label>
                          <InputRupiah
                            value={item.customPackagingCost || 0}
                            onChange={(val) => onChangeItem(idx, {
                              useCustomPackaging: true,
                              customPackagingCost: val
                            })}
                            className="w-full px-2.5 py-1.5 rounded-lg bg-amber-50/40 border border-amber-200 text-xs font-bold text-slate-800 focus:outline-none focus:ring-1 focus:ring-amber-500"
                          />
                        </div>
                      </div>

                      {customPouchStock !== null && (
                        <div className="text-[10.5px] text-amber-900 font-bold flex items-center gap-1 pt-1">
                          <span>📦</span>
                          <span>
                            Stok Wadah Terpilih: <strong className={customPouchStock < (Number(item.quantity) || 0) * factor ? "text-rose-600 font-black" : "text-emerald-700 font-black"}>
                              {customPouchStock} pcs tersedia
                            </strong>
                            {customPouchStock < (Number(item.quantity) || 0) * factor && (
                              <span className="text-rose-600 font-bold ml-1">(Kurang {((Number(item.quantity) || 0) * factor) - customPouchStock} pcs)</span>
                            )}
                          </span>
                        </div>
                      )}
                    </div>
                  )}
                </div>

                {/* Section 3: Catatan Khusus Packing Gudang */}
                <div className="pt-1">
                  <label className="text-[11px] font-extrabold text-slate-700 block mb-1">
                    📝 Catatan Khusus untuk Tim Packing Gudang (Opsional):
                  </label>
                  <input
                    type="text"
                    placeholder="Misal: Lakban keliling rapat, jangan cantumkan label harga, kardus tebal"
                    value={item.customPackagingNote || ''}
                    onChange={(e) => onChangeItem(idx, { customPackagingNote: e.target.value })}
                    className="w-full px-2.5 py-2 rounded-xl bg-white border border-amber-200 text-xs font-medium text-slate-800 focus:outline-none focus:ring-1 focus:ring-amber-500"
                  />
                </div>

                {/* Section 4: Live Preview Tag & Summary */}
                <div className="p-2.5 rounded-xl bg-amber-500/15 border border-amber-300/60 flex items-center justify-between gap-2 flex-wrap text-xs">
                  <div className="flex items-center gap-2 flex-wrap">
                    <span className="text-[10px] font-black uppercase text-amber-950 bg-amber-200/80 px-1.5 py-0.5 rounded">
                      Instruksi Gudang:
                    </span>
                    <span className="font-mono text-xs font-bold text-amber-950">
                      {isPolos ? '[Request: Polosan / Tanpa Stiker]' : hasCustomSticker ? `[Tambahan Stiker: ${item.customStickerName || 'Khusus'}]` : '[Kemasan: Standar Lengkap]'}
                      {hasCustomPackaging ? ` [Wadah: ${item.customPackagingName || 'Khusus'}]` : ''}
                      {item.customPackagingNote ? ` [Catatan: ${item.customPackagingNote}]` : ''}
                    </span>
                  </div>
                  {(Number(item.customPackagingCost) > 0 || Number(item.customStickerCost) > 0) && (
                    <span className="font-bold text-amber-900 text-xs">
                      Biaya Tambahan: +{formatIDR((Number(item.customPackagingCost) || 0) + (Number(item.customStickerCost) || 0))}/pcs
                    </span>
                  )}
                </div>
              </div>
            )}
          </div>
        </div>
      )}

      {/* Subtotal pill */}
      {subtotal > 0 && (
        <div className="flex items-center justify-between px-3 py-2 rounded-xl" style={{ background: isBelowHpp ? 'rgba(239,68,68,0.07)' : `rgba(15,23,42,0.06)`, border: `1px solid ${isBelowHpp ? 'rgba(239,68,68,0.2)' : BORDER}` }}>
          <span className="text-[10px] font-black uppercase tracking-widest" style={{ color: MUTED }}>Subtotal</span>
          <span className="text-sm font-black" style={{ color: isBelowHpp ? '#EF4444' : TEXT }}>{formatIDR(subtotal)}</span>
        </div>
      )}
    </div>
  )
}

// ─── Payment Method Buttons ───────────────────────────────────────────────────
const VEHICLE_TYPES = [
  { value: 'Mobil Box',  label: 'Mobil Box',  Icon: Package2 },
  { value: 'Pick Up',    label: 'Pick Up',    Icon: Truck },
  { value: 'L300',       label: 'L300',       Icon: Car },
  { value: 'Motor',      label: 'Motor',      Icon: Bike },
  { value: 'Truk',       label: 'Truk',       Icon: Truck },
]

const PAY_METHOD_CONFIG = {
  cash:     { label: 'Cash (Tunai)',     color: '#0F172A', bg: 'rgba(15,23,42,0.1)' },
  transfer: { label: 'Transfer Bank',   color: '#2563EB', bg: 'rgba(37,99,235,0.12)' },
}

function PayMethodButton({ method, selected, onClick }) {
  const cfg = PAY_METHOD_CONFIG[method]
  return (
    <button
      onClick={onClick}
      className="flex-1 py-2.5 rounded-xl font-black text-xs uppercase tracking-wide transition-all"
      style={{
        background: selected ? cfg.bg : 'transparent',
        border: `${selected ? 2 : 1}px solid ${selected ? cfg.color : BORDER}`,
        color: selected ? cfg.color : MUTED,
      }}
    >
      {cfg.label}
    </button>
  )
}

// ─── Main Component ───────────────────────────────────────────────────────────
export function SembakoCreateInvoiceSheet({ open, onOpenChange, editId }) {
  const isDesktop = useMediaQuery('(min-width: 1024px)')
  const { data: customers = [], isLoading: customersLoading } = useSembakoCustomers()
  const { data: products = [], isLoading: productsLoading } = useSembakoProducts()
  const { data: employees = [] } = useSembakoEmployees()
  const { data: allSales = [] } = useSembakoSales()
  const { data: allDeliveries = [] } = useSembakoDeliveries()
  const { data: allBatches = [] } = useSembakoAllBatches()

  const createSale     = useCreateSembakoSale()
  const updateSale     = useUpdateSembakoSale()
  const createCustomer = useCreateSembakoCustomer()
  const createProduct  = useCreateSembakoProduct()
  const updateProduct  = useUpdateSembakoProduct()
  const createDelivery = useCreateSembakoDelivery()
  const recordPayment  = useRecordSembakoPayment()
  const createEmployee = useCreateSembakoEmployee()
  const { data: rawMaterialsList = [] } = useSembakoRawMaterials()
  const { data: custodyList = [] } = useSembakoStockCustody()

  function getSavedInvoiceDraft() {
    try {
      const saved = localStorage.getItem('sembako_invoice_wizard_draft')
      if (saved) return JSON.parse(saved)
    } catch (e) {
      // ignore
    }
    return null
  }

  const [step, setStep]           = useState(() => {
    const d = getSavedInvoiceDraft()
    return (d?.step && d?.custId) ? d.step : 0
  })
  const [custId, setCustId]       = useState(() => getSavedInvoiceDraft()?.custId ?? '')
  const [custError, setCustError] = useState('')
  const [txnDate, setTxnDate]     = useState(() => getSavedInvoiceDraft()?.txnDate ?? format(new Date(), 'yyyy-MM-dd'))
  const [dueDate, setDueDate]     = useState(() => {
    const d = getSavedInvoiceDraft()?.dueDate
    if (d) return d
    const dt = new Date()
    dt.setDate(dt.getDate() + 1)
    return format(dt, 'yyyy-MM-dd')
  })
  const [items, setItems]         = useState(() => {
    const savedItems = getSavedInvoiceDraft()?.items
    if (Array.isArray(savedItems) && savedItems.length > 0) return savedItems
    return [{ product_id: '', product_name: '', unit: '', quantity: 0, price_per_unit: 0, cogs_per_unit: 0 }]
  })
  const [deliveryCost, setDeliveryCost] = useState(() => getSavedInvoiceDraft()?.deliveryCost ?? 0)
  const [otherCost, setOtherCost] = useState(() => getSavedInvoiceDraft()?.otherCost ?? 0)
  const [selectedCostChips, setSelectedCostChips] = useState(() => getSavedInvoiceDraft()?.selectedCostChips ?? [])
  const [otherCostNotes, setOtherCostNotes]       = useState(() => getSavedInvoiceDraft()?.otherCostNotes ?? '')
  const [payAmount, setPayAmount] = useState(() => getSavedInvoiceDraft()?.payAmount ?? 0)
  const [payMethod, setPayMethod] = useState(() => getSavedInvoiceDraft()?.payMethod ?? 'cash')
  const [notes, setNotes]         = useState(() => getSavedInvoiceDraft()?.notes ?? '')

  // ── Stock Source & Custody Tracking ─────────────────────────────────────────
  const [stockSource, setStockSource] = useState(() => getSavedInvoiceDraft()?.stockSource ?? 'warehouse') // 'warehouse' | 'employee'
  const [stockEmployeeId, setStockEmployeeId] = useState(() => getSavedInvoiceDraft()?.stockEmployeeId ?? '')

  // ── Packaging & Polymailer Calculation ──────────────────────────────────────
  const [packingType, setPackingType] = useState(() => getSavedInvoiceDraft()?.packingType ?? 'polymailer_hitam')
  const [customPackingQty, setCustomPackingQty] = useState(() => getSavedInvoiceDraft()?.customPackingQty ?? '')

  const totalPouchesCount = useMemo(() => {
    return items.reduce((sum, item) => {
      const qty = Number(item.quantity) || 0
      if (!item.product_id || qty <= 0) return sum
      return sum + qty
    }, 0)
  }, [items])

  const autoPolymailerQty = useMemo(() => {
    return totalPouchesCount > 0 ? Math.ceil(totalPouchesCount / 4) : 0
  }, [totalPouchesCount])

  const autoKardusQty = useMemo(() => {
    return totalPouchesCount > 0 ? Math.ceil(totalPouchesCount / 24) : 0
  }, [totalPouchesCount])

  const defaultPackingQty = useMemo(() => {
    if (packingType === 'kardus') return autoKardusQty || 1
    if (packingType === 'polymailer_hitam') return autoPolymailerQty || 1
    return 0
  }, [packingType, autoKardusQty, autoPolymailerQty])

  const effectivePackingQty = useMemo(() => {
    if (packingType === 'none') return 0
    if (customPackingQty !== '') return Math.max(0, Number(customPackingQty) || 0)
    return defaultPackingQty
  }, [packingType, customPackingQty, defaultPackingQty])

  const [showCustSearch, setShowCustSearch] = useState(false)
  const [quickAddCust, setQuickAddCust]     = useState(false)
  const [newCustForm, setNewCustForm]       = useState({ customer_name: '', customer_type: 'perseorangan', phone: '', address: '', payment_terms: 'cash' })
  const [quickAddProd, setQuickAddProd]     = useState(false)
  const [newProdForm, setNewProdForm]       = useState({ product_name: '', category: 'lainnya', unit: 'pcs', sell_price: 0 })

  const [useDelivery, setUseDelivery]           = useState(() => getSavedInvoiceDraft()?.useDelivery ?? true)
  const [deliveryMethod, setDeliveryMethod]     = useState(() => getSavedInvoiceDraft()?.deliveryMethod ?? 'ekspedisi')
  const [courierName, setCourierName]           = useState(() => getSavedInvoiceDraft()?.courierName ?? '')
  const [deliveryStatus, setDeliveryStatus]     = useState('terkirim') // 'terkirim' | 'pending'
  const [deliveryDriver, setDeliveryDriver]     = useState(() => getSavedInvoiceDraft()?.deliveryDriver ?? '')
  const [deliveryVehicle, setDeliveryVehicle]   = useState(() => getSavedInvoiceDraft()?.deliveryVehicle ?? '')
  const [deliveryPlate, setDeliveryPlate]       = useState(() => getSavedInvoiceDraft()?.deliveryPlate ?? '')
  const [deliveryArea, setDeliveryArea]         = useState(() => getSavedInvoiceDraft()?.deliveryArea ?? '')
  const [shippingBorneBy, setShippingBorneBy]   = useState(() => getSavedInvoiceDraft()?.shippingBorneBy ?? 'buyer') // 'buyer' | 'seller'
  const [sellerShippingFee, setSellerShippingFee] = useState(() => getSavedInvoiceDraft()?.sellerShippingFee ?? 0)
  const [showOtherCostSetting, setShowOtherCostSetting] = useState(false)
  const [fuelCost, setFuelCost]                 = useState(() => getSavedInvoiceDraft()?.fuelCost ?? 0)
  const [addKurir, setAddKurir]                 = useState(false)
  const [newKurirForm, setNewKurirForm]         = useState({ full_name: '', phone: '' })
  const [showVehicleDetails, setShowVehicleDetails] = useState(() => Boolean(getSavedInvoiceDraft()?.deliveryVehicle || getSavedInvoiceDraft()?.deliveryPlate))

  // Auto-prefill kendaraan & plat saat pilih sopir
  const handleSelectDriver = useCallback((driverId) => {
    setDeliveryDriver(driverId)
    if (!driverId) return
    const lastDelivery = allDeliveries
      .filter(d => d.employee_id === driverId && d.vehicle_type)
      .sort((a, b) => new Date(b.created_at) - new Date(a.created_at))[0]
    if (lastDelivery) {
      if (lastDelivery.vehicle_type) setDeliveryVehicle(lastDelivery.vehicle_type)
      if (lastDelivery.vehicle_plate) setDeliveryPlate(lastDelivery.vehicle_plate)
    }
  }, [allDeliveries])

  const handleSaveKurir = async () => {
    if (!newKurirForm.full_name.trim()) { toast.error('Nama kurir wajib diisi'); return }
    try {
      await createEmployee.mutateAsync({ full_name: newKurirForm.full_name.trim(), phone: newKurirForm.phone, role: 'sopir', status: 'aktif' })
      setAddKurir(false)
      setNewKurirForm({ full_name: '', phone: '' })
    } catch { /* handled by hook */ }
  }

  const [successData, setSuccessData] = useState(null)
  const [printData, setPrintData]     = useState(null)
  const [printMode, setPrintMode]     = useState('invoice')
  const lastPrefillKeyRef = useRef(null)
  const isSavedRef = useRef(false)
  const draftLoadedRef = useRef(false)

  const INVOICE_DRAFT_KEY = 'sembako_invoice_wizard_draft'
  const EDIT_DRAFT_KEY = editId ? `sembako_edit_draft_v2_${editId}` : null

  const clearInvoiceDraft = useCallback(() => {
    localStorage.removeItem('sembako_invoice_wizard_draft')
    localStorage.removeItem('sembako_invoice_wizard_draft_backup')
    if (EDIT_DRAFT_KEY) localStorage.removeItem(EDIT_DRAFT_KEY)
    lastPrefillKeyRef.current = null
    const tomorrow = () => { const d = new Date(); d.setDate(d.getDate() + 1); return format(d, 'yyyy-MM-dd') }
    setStep(0); setCustId(''); setCustError(''); setTxnDate(format(new Date(), 'yyyy-MM-dd')); setDueDate(tomorrow())
    setItems([{ product_id: '', product_name: '', unit: '', selectedUnit: '', priceMode: 'per_base', quantity: 0, price_per_unit: 0, cogs_per_unit: 0 }])
    setDeliveryCost(0); setShippingBorneBy('buyer'); setSellerShippingFee(0); setOtherCost(0); setSelectedCostChips([]); setOtherCostNotes(''); setNotes('')
    setPayAmount(0); setPayMethod('cash')
    setUseDelivery(false); setDeliveryDriver(''); setDeliveryVehicle(''); setDeliveryPlate(''); setDeliveryArea(''); setFuelCost(0)
    setAddKurir(false); setNewKurirForm({ full_name: '', phone: '' })
    setQuickAddCust(false); setQuickAddProd(false); setShowCustSearch(false)
    setStockSource('warehouse'); setStockEmployeeId('')
  }, [EDIT_DRAFT_KEY])

  // ── Derived data ────────────────────────────────────────────────────────────
  const customerOptions = useMemo(() =>
    customers.map(c => ({ value: c.id, label: c.customer_name })),
    [customers]
  )
  const productOptions = useMemo(() => {
    const selectedProductIds = new Set((items || []).map(it => it.product_id).filter(Boolean))

    if (stockSource === 'employee' && stockEmployeeId) {
      const empObj = employees.find(e => e.id === stockEmployeeId)
      const empLabel = empObj?.full_name ? empObj.full_name.split(' ')[0] : 'Tim'
      return products
        .map(p => {
          const empHold = custodyList.find(c => c.employee_id === stockEmployeeId && c.product_id === p.id)
          const qty = Number(empHold?.quantity) || 0
          return {
            value: p.id,
            label: `${p.product_name} (${qty} ${p.unit} di ${empLabel})`,
            stock: qty
          }
        })
        .filter(opt => opt.stock > 0 || selectedProductIds.has(opt.value))
    }

    return products
      .map(p => {
        const whHold = custodyList.find(c => (c.holder_type === 'warehouse' || !c.employee_id) && c.product_id === p.id)
        const qty = whHold ? (Number(whHold.quantity) || 0) : (Number(p.current_stock) || 0)
        return {
          value: p.id,
          label: `${p.product_name} (${qty} ${p.unit} di Gudang)`,
          stock: qty
        }
      })
      .filter(opt => opt.stock > 0 || selectedProductIds.has(opt.value))
  }, [products, stockSource, stockEmployeeId, custodyList, employees, items])
  const packagingMaterials = useMemo(() => {
    return rawMaterialsList.filter(m => {
      const cat = String(m.category || '').toLowerCase()
      const name = String(m.material_name || '').toLowerCase()
      return cat.includes('pouch') || cat.includes('toples') || cat.includes('kemasan') || cat.includes('plastik') ||
             cat.includes('alumunium') || cat.includes('foil') ||
             name.includes('pouch') || name.includes('toples') || name.includes('standing') || name.includes('zipper') ||
             name.includes('ziplock') || name.includes('alumunium') || name.includes('aluminium') || name.includes('foil') ||
             name.includes('kemasan') || name.includes('plastik')
    })
  }, [rawMaterialsList])
  const editSale = useMemo(() => {
    if (!editId) return null
    return allSales.find(s => s.id === editId) || null
  }, [allSales, editId])

  const getEffectivePouchStock = useCallback((pMatId) => {
    if (!pMatId) return 0
    const pMat = rawMaterialsList.find(m => m.id === pMatId)
    if (!pMat) return 0
    const cur = Number(pMat.current_stock) || 0
    if (!editSale) return cur

    // Check if editSale previously used this packaging
    const matNameLower = (pMat.material_name || '').toLowerCase().trim()
    const editSaleHasThisPkg = editSale.notes && editSale.notes.toLowerCase().includes(matNameLower)
    let originalPouchQty = 0

    const oldItems = editSale.sembako_sale_items || []
    for (const oldIt of oldItems) {
      const oldNotes = (oldIt.notes || '').toLowerCase()
      if (
        oldNotes.includes(matNameLower) ||
        editSaleHasThisPkg ||
        oldIt.custom_packaging_id === pMatId ||
        (oldIt.use_custom_packaging && String(oldIt.custom_packaging_name).toLowerCase().trim() === matNameLower)
      ) {
        originalPouchQty += Number(oldIt.quantity || 0)
      }
    }

    if (originalPouchQty === 0 && oldItems.length > 0) {
      for (const oldIt of oldItems) {
        const oldPName = (oldIt.product_name || '').toLowerCase()
        if (matNameLower.includes('200') && oldPName.includes('200g')) {
          originalPouchQty += Number(oldIt.quantity || 0)
        } else if (matNameLower.includes('250') && oldPName.includes('250g')) {
          originalPouchQty += Number(oldIt.quantity || 0)
        } else if (matNameLower.includes('100') && oldPName.includes('100g')) {
          originalPouchQty += Number(oldIt.quantity || 0)
        }
      }
    }

    return cur + originalPouchQty
  }, [rawMaterialsList, editSale])

  const selectedCust = customers.find(c => c.id === custId)
  const productSubtotal = items.reduce((s, i) => {
    const prod = products.find(p => p.id === i.product_id)
    const factor = getFactor(i.selectedUnit || i.unit || 'pcs', prod)
    const isMultiUnitPackaging = factor > 1
    const mode = i.priceMode || 'per_base'
    const inputPrice = Number(i.price_per_unit || 0)
    const sub = isMultiUnitPackaging
      ? (mode === 'per_kemasan' ? (Number(i.quantity) || 0) * inputPrice : (Number(i.quantity) || 0) * factor * inputPrice)
      : (Number(i.quantity) || 0) * inputPrice
    return s + Math.round(sub)
  }, 0)

  const isSellerShipping = (deliveryMethod === 'ekspedisi' || deliveryMethod === 'kurir_toko') && shippingBorneBy === 'seller'
  const effectiveCustomerDelivery = (isSellerShipping || deliveryMethod === 'pickup' || !useDelivery)
    ? 0
    : Number(deliveryCost || 0)
  const effectiveSellerShippingExpense = (isSellerShipping && useDelivery)
    ? Number(sellerShippingFee || 0)
    : 0

  const totalAmount  = productSubtotal + effectiveCustomerDelivery
  const totalCogs    = items.reduce((s, i) => {
    const prod = products.find(p => p.id === i.product_id)
    const factor = getFactor(i.selectedUnit || i.unit || 'pcs', prod)
    return s + Math.round((Number(i.quantity) || 0) * factor * (Number(i.cogs_per_unit) || 0))
  }, 0)

  // Keuntungan pengiriman kurir toko masuk sebagai keuntungan toko langsung
  const deliveryProfit = (deliveryMethod === 'kurir_toko' && useDelivery && shippingBorneBy === 'buyer')
    ? effectiveCustomerDelivery
    : 0

  const grossProfit  = (productSubtotal - totalCogs) + deliveryProfit
  const effectiveOtherCost = Number(otherCost || 0) + effectiveSellerShippingExpense
  const netProfit    = grossProfit - effectiveOtherCost
  const netMarginPct = (productSubtotal + deliveryProfit) > 0 ? Math.round((netProfit / (productSubtotal + deliveryProfit)) * 100) : 0

  // Auto-sync payAmount to full totalAmount for cash customers if not manually set to partial in create mode
  const prevTotalRef = useRef(totalAmount)
  useEffect(() => {
    if (!editId && selectedCust?.payment_terms === 'cash' && totalAmount > 0) {
      if (payAmount === 0 || payAmount === prevTotalRef.current || payAmount === productSubtotal) {
        setPayAmount(totalAmount)
      }
    }
    prevTotalRef.current = totalAmount
  }, [editId, selectedCust?.payment_terms, totalAmount, productSubtotal, payAmount])

  // ── Edit prefill ────────────────────────────────────────────────────────────
  useEffect(() => {
    if (!open) {
      setSuccessData(null)
      lastPrefillKeyRef.current = null
      return
    }
    if (!editSale) return

    const prefillKey = `${editSale.id}:${editSale.updated_at || editSale.transaction_date || ''}`
    if (lastPrefillKeyRef.current === prefillKey) return
    lastPrefillKeyRef.current = prefillKey

    setCustId(editSale.customer_id || '')
    setTxnDate(editSale.transaction_date?.slice(0, 10) || new Date().toISOString().slice(0, 10))
    setDueDate(editSale.due_date?.slice(0, 10) || '')
    setDeliveryCost(editSale.delivery_cost || 0)
    setOtherCost(editSale.other_cost || 0)
    setNotes(editSale.notes || '')

    if (editSale.delivery_cost > 0) {
      setShippingBorneBy('buyer')
    } else if (editSale.notes?.includes('Ongkir Ditanggung Penjual')) {
      setShippingBorneBy('seller')
      const matchSellerFee = editSale.notes.match(/\[Ongkir Ditanggung Penjual:\s*Rp\s*([\d.]+)\]/)
      if (matchSellerFee && matchSellerFee[1]) {
        const raw = parseInt(matchSellerFee[1].replace(/\./g, ''), 10)
        if (!isNaN(raw)) setSellerShippingFee(raw)
      }
    }

    // Parse operational cost categories & notes from editSale.notes
    if (editSale.notes) {
      const match = editSale.notes.match(/\[Biaya Operasional:[^\]]*\(([^)]+)\)\]/)
      if (match && match[1]) {
        const fullDetail = match[1]
        const parts = fullDetail.split(' - ')
        const chipsPart = parts[0] || ''
        const textPart = parts.length > 1 ? parts.slice(1).join(' - ') : (parts[0] || '')

        const detected = []
        if (/bensin|bbm|pertalite|solar/i.test(chipsPart)) detected.push('BBM / Bensin')
        if (/makan|konsumsi|snack/i.test(chipsPart)) detected.push('Uang Makan / Konsumsi')
        if (/tol|parkir/i.test(chipsPart)) detected.push('Tol / Parkir')
        if (/bongkar|kuli|muat/i.test(chipsPart)) detected.push('Bongkar Muat')

        setSelectedCostChips(detected)
        setOtherCostNotes(textPart)
      } else {
        setSelectedCostChips([])
        setOtherCostNotes('')
      }
    } else {
      setSelectedCostChips([])
      setOtherCostNotes('')
    }

    // Prefill Delivery data if exists
    const deliv = Array.isArray(editSale.sembako_deliveries) ? editSale.sembako_deliveries[0] : editSale.sembako_deliveries
    if (deliv || (editSale.delivery_cost || 0) > 0) {
      setUseDelivery(true)
      if (deliv) {
        if (deliv.status) setDeliveryStatus(deliv.status)
        if (deliv.employee_id) setDeliveryDriver(deliv.employee_id)
        if (deliv.vehicle_type) setDeliveryVehicle(deliv.vehicle_type)
        if (deliv.vehicle_plate) setDeliveryPlate(deliv.vehicle_plate)
      }
    } else {
      setUseDelivery(false)
    }

    const sourceItems = (Array.isArray(editSale.sembako_sale_items) && editSale.sembako_sale_items.length > 0)
      ? editSale.sembako_sale_items
      : (Array.isArray(editSale.items) && editSale.items.length > 0)
        ? editSale.items
        : []

    if (sourceItems.length > 0) {
      setItems(sourceItems.map(it => {
        const matchPkg = (it.product_name || '').match(/\[(\d+(?:\.\d+)?)\s*([^\]]+)\]/)
        let qty = Number(it.quantity || it.quantity_kg || 0)
        let selectedUnit = it.selectedUnit || it.unit || 'pcs'
        let price = Number(it.sell_price || it.price_per_unit || it.unit_price || 0)
        let cleanName = (it.product_name || '').replace(/\s*\[\d+[^\]]+\]/g, '').trim()
        let priceMode = it.priceMode || 'per_base'

        if (matchPkg) {
          const inputQty = Number(matchPkg[1])
          const inputUnit = matchPkg[2].trim()
          const factor = getFactor(inputUnit)
          if (factor > 1 && inputQty > 0) {
            qty = inputQty
            selectedUnit = inputUnit
            price = Number(it.sell_price || it.price_per_unit || 0)
            priceMode = 'per_base'
          }
        }

        let useCustomPackaging = Boolean(it.useCustomPackaging || it.use_custom_packaging)
        let customPackagingId = it.customPackagingId || it.custom_packaging_id || ''
        let customPackagingName = it.customPackagingName || it.custom_packaging_name || ''
        let customPackagingCost = Number(it.customPackagingCost || it.custom_packaging_cost || 0)
        let customPackagingNote = it.customPackagingNote || it.custom_packaging_note || ''

        // Check if item notes or sale notes has [Kemasan: ...] tag
        const itemPkgMatch = (it.notes && (it.notes.match(/\[Kemasan:\s*([^\]]+)\]/i) || it.notes.match(/\[Kemasan Khusus:\s*([^\]]+)\]/i))) ||
          (editSale.notes && (editSale.notes.match(/\[Kemasan:\s*([^\]]+)\]/i) || editSale.notes.match(/\[Kemasan Khusus:\s*([^\]]+)\]/i)))

        if (itemPkgMatch && itemPkgMatch[1]) {
          const rawPkgStr = itemPkgMatch[1].trim()
          const [pName, ...pNotesArr] = rawPkgStr.split(' - ')
          const cleanPName = (pName || '').trim()
          const cleanPNote = pNotesArr.join(' - ').trim()

          const foundMat = rawMaterialsList.find(m =>
            m.material_name.toLowerCase().trim() === cleanPName.toLowerCase() ||
            m.material_name.toLowerCase().includes(cleanPName.toLowerCase())
          )

          if (foundMat) {
            useCustomPackaging = true
            customPackagingId = foundMat.id
            customPackagingName = foundMat.material_name
            customPackagingCost = Number(foundMat.unit_cost) || 0
            if (cleanPNote) customPackagingNote = cleanPNote
          } else {
            useCustomPackaging = true
            customPackagingName = cleanPName
            if (cleanPNote) customPackagingNote = cleanPNote
          }
        }

        const itNotesStr = ((it.notes || '') + ' ' + (editSale.notes || '')).toLowerCase()
        const noFrontSticker = Boolean(it.no_front_sticker || itNotesStr.includes('tanpa stiker') || itNotesStr.includes('tanpa stiker depan') || itNotesStr.includes('polos') || itNotesStr.includes('polosan'))
        const noBackSticker = Boolean(it.no_back_sticker || itNotesStr.includes('tanpa stiker') || itNotesStr.includes('tanpa stiker belakang') || itNotesStr.includes('polos') || itNotesStr.includes('polosan'))
        const noPolymailer = Boolean(it.no_polymailer || itNotesStr.includes('tanpa polymailer') || itNotesStr.includes('tanpa poly') || itNotesStr.includes('polosan:'))

        const customStickerMatch = (it.notes && it.notes.match(/\[Tambahan Stiker:\s*([^\]\+]+)(?:\s*\(\+([^\)]+)\))?\]/i)) ||
          (editSale.notes && editSale.notes.match(/\[Tambahan Stiker:\s*([^\]\+]+)(?:\s*\(\+([^\)]+)\))?\]/i))
        const customStickerName = it.customStickerName || it.custom_sticker_name || (customStickerMatch ? customStickerMatch[1].trim() : '')
        const customStickerCost = Number(it.customStickerCost || it.custom_sticker_cost || 0)

        return {
          product_id: it.product_id,
          product_name: cleanName,
          unit: it.unit || 'pcs',
          selectedUnit: selectedUnit,
          priceMode: priceMode,
          quantity: qty,
          price_per_unit: price,
          cogs_per_unit: Number(it.cogs_per_unit || 0),
          useCustomPackaging,
          customPackagingId,
          customPackagingName,
          customPackagingCost,
          customPackagingNote,
          customStickerName,
          customStickerCost,
          noFrontSticker,
          noBackSticker,
          noPolymailer,
        }
      }))
      // Data lengkap — buka di step 1 (barang) supaya langsung bisa review/edit/tambah
      setStep(1)
    } else {
      // Items kosong (data lama) — buka di step 1 juga, customer sudah prefill, tinggal isi barang
      setItems([{ product_id: '', product_name: '', unit: '', selectedUnit: '', priceMode: 'per_base', quantity: 0, price_per_unit: 0, cogs_per_unit: 0, useCustomPackaging: false, customPackagingId: '', customPackagingName: '', customPackagingCost: 0, customPackagingNote: '', customStickerName: '', customStickerCost: 0, noFrontSticker: false, noBackSticker: false, noPolymailer: false }])
      setStep(1)
    }
  }, [open, editSale, rawMaterialsList])

  const handleToggleCostChip = useCallback((chipLabel) => {
    setSelectedCostChips(prev => {
      const exists = prev.includes(chipLabel)
      const next = exists ? prev.filter(c => c !== chipLabel) : [...prev, chipLabel]
      if (next.length > 0 && (!otherCostNotes || prev.join(', ') === otherCostNotes)) {
        setOtherCostNotes(next.join(', '))
      }
      return next
    })
  }, [otherCostNotes])


  // ── Handlers ────────────────────────────────────────────────────────────────
  function handleSelectCustomer(id) {
    setCustId(id)
    setCustError('')
    const c = customers.find(x => x.id === id)
    if (c?.payment_terms && PAYMENT_TERMS_DAYS[c.payment_terms]) {
      const d = new Date(txnDate)
      d.setDate(d.getDate() + PAYMENT_TERMS_DAYS[c.payment_terms])
      setDueDate(d.toISOString().slice(0, 10))
    }
  }

  async function handleSaveQuickCust() {
    const trimmedName = (newCustForm.customer_name || '').trim()
    if (!trimmedName) {
      setCustError('Nama toko wajib diisi')
      toast.error('Nama toko wajib diisi')
      return null
    }
    setCustError('')
    try {
      const payload = {
        ...newCustForm,
        customer_name: trimmedName,
      }
      const res = await createCustomer.mutateAsync(payload)
      if (res?.id) {
        handleSelectCustomer(res.id)
        setQuickAddCust(false)
        setNewCustForm({ customer_name: '', customer_type: 'perseorangan', phone: '', address: '', payment_terms: 'cash' })
        toast.success(`Toko "${trimmedName}" berhasil ditambahkan`)
        return res.id
      }
    } catch { /* handled by hook */ }
    return null
  }

  async function handleSaveQuickProd() {
    if (!newProdForm.product_name) { toast.error('Nama produk wajib diisi'); return }
    try {
      await createProduct.mutateAsync({ ...newProdForm, current_stock: 0, avg_buy_price: 0, is_active: true })
      setQuickAddProd(false)
    } catch { /* handled by hook */ }
  }

  function handleItemChange(idx, fieldOrUpdates, maybeVal) {
    setItems(prevItems => {
      const next = [...prevItems]
      const current = { ...next[idx] }
      
      let updates = {}
      if (typeof fieldOrUpdates === 'object' && fieldOrUpdates !== null) {
        updates = fieldOrUpdates
      } else {
        updates = { [fieldOrUpdates]: maybeVal }
      }

      // Apply updates
      Object.assign(current, updates)

      const prod = products.find(p => p.id === current.product_id)

      // Handle priceMode switch
      if ('priceMode' in updates) {
        const prevMode = prevItems[idx]?.priceMode || 'per_base'
        const newMode = updates.priceMode
        const factor = getFactor(current.selectedUnit || current.unit || 'pcs', prod)
        const currentPrice = Number(current.price_per_unit || 0)
        if (factor > 1) {
          if (prevMode === 'per_base' && newMode === 'per_kemasan') {
            current.price_per_unit = currentPrice * factor
          } else if (prevMode === 'per_kemasan' && newMode === 'per_base') {
            current.price_per_unit = Math.round(currentPrice / factor)
          }
        }
      }

      // Handle selectedUnit change
      if ('selectedUnit' in updates) {
        const prevUnit = prevItems[idx]?.selectedUnit || current.unit || 'pcs'
        const newUnit = updates.selectedUnit
        const prevFactor = getFactor(prevUnit, prod)
        const newFactor = getFactor(newUnit, prod)
        const mode = current.priceMode || 'per_base'
        const currentQty = Number(prevItems[idx]?.quantity || 0)
        const baseQty = currentQty * prevFactor
        const newQty = newFactor > 0 ? (baseQty / newFactor) : baseQty
        current.quantity = String(newQty)

        if (mode === 'per_kemasan') {
          const currentPrice = Number(current.price_per_unit || 0)
          const basePrice = prevFactor > 0 ? (currentPrice / prevFactor) : currentPrice
          current.price_per_unit = basePrice * newFactor
        }
      }

      // Recalculate HPP when relevant fields change
      const pId = current.product_id
      const p = products.find(x => x.id === pId)
      if (p) {
        if ('product_id' in updates) {
          current.product_name = p.product_name
          current.unit         = p.unit || 'pcs'
          current.selectedUnit = p.unit || 'pcs'
          current.priceMode    = 'per_base'
          
          let lastPrice = 0
          if (custId) {
            const lastSale = allSales.find(s => 
              s.customer_id === custId && 
              s.sembako_sale_items?.some(it => it.product_id === pId)
            )
            if (lastSale) {
              const lastItem = lastSale.sembako_sale_items.find(it => it.product_id === pId)
              lastPrice = lastItem?.price_per_unit
            }
          }
          current.price_per_unit = lastPrice || p.sell_price || 0
        } else if ('price_per_unit' in updates) {
          current.price_per_unit = Number(updates.price_per_unit) || 0
        }

        // Determine custom packaging override
        let customKemasan = null
        if (current.useCustomPackaging) {
          if (current.customPackagingCost !== undefined && current.customPackagingCost !== '' && Number(current.customPackagingCost) >= 0) {
            customKemasan = { unit_cost: Number(current.customPackagingCost) || 0 }
          } else if (current.customPackagingId) {
            const foundMat = rawMaterialsList.find(m => m.id === current.customPackagingId)
            if (foundMat) customKemasan = foundMat
          }
        }

        const sFrontMat = matchStickerFrontMaterial(p, rawMaterialsList)
        const sBackMat = matchStickerBackMaterial(p, rawMaterialsList)
        const otherMat = matchOtherPackagingMaterial(p, rawMaterialsList)
        const sFrontCost = Number(sFrontMat?.unit_cost || p?.sticker_front_cost || 0)
        const sBackCost = Number(sBackMat?.unit_cost || p?.sticker_back_cost || 0)
        const otherPkgCost = Number(otherMat?.unit_cost || p?.other_packaging_cost || 0)
        const deltaStickers = (current.noFrontSticker ? -sFrontCost : 0) + (current.noBackSticker ? -sBackCost : 0)
        const deltaPolymailer = current.noPolymailer ? -otherPkgCost : 0

        const stdKemasan = matchKemasanMaterial(p, rawMaterialsList)
        const stdKemasanCost = Number(stdKemasan?.unit_cost) || 0
        const newKemasanCost = customKemasan ? (Number(customKemasan.unit_cost) || 0) : stdKemasanCost
        const extraStickerCost = Number(current.customStickerCost) || 0
        const deltaPackaging = (current.useCustomPackaging ? (newKemasanCost - stdKemasanCost) : 0) + deltaStickers + deltaPolymailer + extraStickerCost

        const factor = getFactor(current.selectedUnit || p.unit || 'pcs', p)
        const qtyInBase = (Number(current.quantity) || 0) * factor
        const bomCost = calculateBomProductHpp(p, rawMaterialsList, customKemasan, { noFrontSticker: current.noFrontSticker, noBackSticker: current.noBackSticker, noPolymailer: current.noPolymailer })

        const prodBatches = allBatches
          .filter(b => b.product_id === pId && !b.is_deleted && (b.qty_sisa || 0) > 0)
          .sort((a, b) => new Date(a.created_at || a.purchase_date) - new Date(b.created_at || b.purchase_date))

        let remaining = qtyInBase
        let totalCost = 0
        for (const batch of prodBatches) {
          if (remaining <= 0) break
          const take = Math.min(batch.qty_sisa, remaining)
          totalCost += take * ((batch.buy_price || 0) + deltaPackaging)
          remaining -= take
        }
        if (remaining > 0) {
          totalCost += remaining * (bomCost || ((p.avg_buy_price || 0) + deltaPackaging))
        }
        const fallbackCost = bomCost || ((p.avg_buy_price || 0) + deltaPackaging)
        current.cogs_per_unit = qtyInBase > 0 ? Math.round(totalCost / qtyInBase) : fallbackCost
      }

      next[idx] = current
      return next
    })
  }

  async function handleSubmit() {
    if (!custId) {
      setStep(0)
      setCustError('Pilih atau tambahkan toko terlebih dahulu')
      toast.error('Pilih toko / customer dulu sebelum menyimpan')
      return
    }

    const validItems = items
      .filter(i => i.product_id && Number(i.quantity) > 0)
      .map(i => {
        const prod = products.find(p => p.id === i.product_id)
        const factor = getFactor(i.selectedUnit || i.unit || 'pcs', prod)
        const inputQty = Number(i.quantity)
        const inputUnit = i.selectedUnit || i.unit || 'pcs'
        const isMultiUnitPackaging = factor > 1
        const mode = i.priceMode || 'per_base'
        const baseQty = inputQty * factor
        const basePrice = (isMultiUnitPackaging && mode === 'per_kemasan')
          ? Math.round(Number(i.price_per_unit) / factor)
          : Number(i.price_per_unit)

        const packagingTag = factor > 1 ? `[${inputQty} ${inputUnit}]` : ''
        const cleanName = (i.product_name || '').replace(/\s*\[\d+[^\]]+\]/g, '').trim()
        const finalName = packagingTag ? `${cleanName} ${packagingTag}` : (cleanName || prod?.product_name || i.product_name || 'Produk')

        const customPackagingTag = i.useCustomPackaging && (i.customPackagingName || i.customPackagingNote)
          ? `[Kemasan: ${i.customPackagingName || 'Khusus'}${i.customPackagingNote ? ` - ${i.customPackagingNote}` : ''}]`
          : ''
        let stickerTag = ''
        if (i.noFrontSticker && i.noBackSticker && i.noPolymailer) {
          stickerTag = '[Polosan: Tanpa Stiker & Tanpa Polymailer]'
        } else if (i.noFrontSticker && i.noBackSticker) {
          stickerTag = '[Request: Polosan / Tanpa Stiker]'
        } else if (i.noFrontSticker) {
          stickerTag = '[Tanpa Stiker Depan]'
        } else if (i.noBackSticker) {
          stickerTag = '[Tanpa Stiker Belakang]'
        }
        const extraStickerTag = i.customStickerName
          ? `[Tambahan Stiker: ${i.customStickerName}${Number(i.customStickerCost) > 0 ? ` (+${formatIDR(i.customStickerCost)}/pcs)` : ''}]`
          : ''
        const polyTag = i.noPolymailer && !stickerTag.includes('Polymailer') ? '[Tanpa Polymailer]' : ''
        const warehouseNoteTag = (!i.useCustomPackaging && i.customPackagingNote)
          ? `[Catatan Gudang: ${i.customPackagingNote}]`
          : ''
        const baseNotes = prod?.notes || i.notes || ''
        const itemFinalNotes = [baseNotes, customPackagingTag, stickerTag, extraStickerTag, polyTag, warehouseNoteTag].filter(Boolean).join(' ')

        return {
          ...i,
          product_name: finalName,
          category: prod?.category || i.category || '',
          notes: itemFinalNotes,
          unit: i.unit || 'pcs',
          quantity: baseQty,
          price_per_unit: basePrice,
          cogs_per_unit: Number(i.cogs_per_unit),
          use_custom_packaging: Boolean(i.useCustomPackaging),
          custom_packaging_id: i.customPackagingId || null,
          custom_packaging_name: i.customPackagingName || null,
          custom_packaging_note: i.customPackagingNote || null,
          custom_sticker_name: i.customStickerName || null,
          custom_sticker_cost: Number(i.customStickerCost) || 0,
          no_front_sticker: Boolean(i.noFrontSticker),
          no_back_sticker: Boolean(i.noBackSticker),
          no_polymailer: Boolean(i.noPolymailer),
        }
      })
    if (!validItems.length) { toast.error('Tambahkan minimal 1 produk'); return }

    try {
      const custName = selectedCust?.customer_name || 'Toko Mitra'

      let finalNotes = notes.trim()
      if (otherCost > 0 && (selectedCostChips.length > 0 || otherCostNotes.trim())) {
        const detailStr = [selectedCostChips.join(', '), otherCostNotes.trim()].filter(Boolean).filter((v, i, a) => a.indexOf(v) === i).join(' - ')
        const costTag = `[Biaya Operasional: Rp ${formatIDR(otherCost)}${detailStr ? ` (${detailStr})` : ''}]`
        finalNotes = finalNotes.replace(/\[Biaya Operasional:[^\]]+\]/g, '').trim()
        finalNotes = finalNotes ? `${finalNotes}\n${costTag}` : costTag
      }

      if (useDelivery) {
        if (deliveryMethod === 'ekspedisi') {
          if (shippingBorneBy === 'seller' && sellerShippingFee > 0) {
            const shipTag = `[Ongkir Ditanggung Penjual: Rp ${formatIDR(sellerShippingFee)}]`
            finalNotes = finalNotes.replace(/\[Ongkir Ditanggung[^\]]+\]/g, '').trim()
            finalNotes = finalNotes ? `${finalNotes}\n${shipTag}` : shipTag
          } else if (shippingBorneBy === 'buyer' && effectiveCustomerDelivery > 0) {
            const shipTag = `[Ongkir Ditanggung Pembeli: Rp ${formatIDR(effectiveCustomerDelivery)}]`
            finalNotes = finalNotes.replace(/\[Ongkir Ditanggung[^\]]+\]/g, '').trim()
            finalNotes = finalNotes ? `${finalNotes}\n${shipTag}` : shipTag
          }
        } else if (deliveryMethod === 'kurir_toko') {
          if (shippingBorneBy === 'seller') {
            const shipTag = `[Kurir Toko (Free Ongkir): Beban Toko Rp ${formatIDR(sellerShippingFee)}]`
            finalNotes = finalNotes.replace(/\[Kurir Toko[^\]]+\]/g, '').trim()
            finalNotes = finalNotes ? `${finalNotes}\n${shipTag}` : shipTag
          } else if (shippingBorneBy === 'buyer' && effectiveCustomerDelivery > 0) {
            const shipTag = `[Kurir Toko (Profit Toko): Rp ${formatIDR(effectiveCustomerDelivery)}]`
            finalNotes = finalNotes.replace(/\[Kurir Toko[^\]]+\]/g, '').trim()
            finalNotes = finalNotes ? `${finalNotes}\n${shipTag}` : shipTag
          }
        }
      }

      const customPkgItems = validItems.filter(i => i.use_custom_packaging && i.custom_packaging_name)
      if (customPkgItems.length > 0) {
        const pkgNames = [...new Set(customPkgItems.map(i => i.custom_packaging_name))].join(', ')
        const pkgTag = `[Kemasan: ${pkgNames}]`
        finalNotes = finalNotes.replace(/\[Kemasan:[^\]]+\]/g, '').trim()
        finalNotes = finalNotes ? `${pkgTag}\n${finalNotes}` : pkgTag
      }

      if (editId) {
        await updateSale.mutateAsync({
          id: editId,
          updates: {
            customer_id: custId || null, customer_name: custName,
            transaction_date: txnDate, due_date: dueDate || null,
            total_amount: totalAmount, total_cogs: totalCogs,
            delivery_cost: effectiveCustomerDelivery, other_cost: effectiveOtherCost, notes: finalNotes,
            packing_details: {
              packing_type: packingType,
              material_name: packingType === 'kardus' ? 'Kardus & Safety' : 'Plastik Packing Polymailer Hitam',
              quantity: effectivePackingQty,
            }
          },
          items: validItems,
        })
        if (EDIT_DRAFT_KEY) localStorage.removeItem(EDIT_DRAFT_KEY)
        handleClose()
        return
      }

      if (stockSource === 'employee' && stockEmployeeId) {
        const emp = employees.find(e => e.id === stockEmployeeId)
        const empName = emp?.full_name || 'Tim Lapangan'
        const stockTag = `[Pengambilan Stok: Dibawa ${empName}]`
        finalNotes = finalNotes ? `${finalNotes}\n${stockTag}` : stockTag
      }

      const sale = await createSale.mutateAsync({
        customer_id: custId || null, customer_name: custName,
        transaction_date: txnDate, due_date: dueDate || null,
        items: validItems, delivery_cost: effectiveCustomerDelivery, other_cost: effectiveOtherCost, notes: finalNotes,
        stock_source: stockSource,
        employee_id: stockSource === 'employee' ? stockEmployeeId : null,
        packing_details: {
          packing_type: packingType,
          material_name: packingType === 'kardus' ? 'Kardus & Safety' : 'Plastik Packing Polymailer Hitam',
          quantity: effectivePackingQty,
        }
      })

      if (payAmount > 0 && sale?.id) {
        await recordPayment.mutateAsync({
          sale_id: sale.id, customer_id: custId || null,
          amount: payAmount, payment_date: txnDate,
          payment_method: payMethod, reference_number: null,
          notes: 'Pembayaran awal (wizard)',
        })
      }

      if (useDelivery && sale?.id) {
        const deliveryNotes = deliveryMethod === 'ekspedisi'
          ? (courierName ? `Ekspedisi: ${courierName}` : 'Ekspedisi / Cargo Luar Kota')
          : (shippingBorneBy === 'seller'
              ? `Kurir Toko (Free Ongkir - Biaya Toko ${formatIDR(sellerShippingFee)})`
              : (effectiveCustomerDelivery > 0
                  ? `Kurir Toko (Ongkir ${formatIDR(effectiveCustomerDelivery)} - Profit Toko)`
                  : 'Kurir Toko (Bebas Ongkir)'))

        await createDelivery.mutateAsync({
          sale_id: sale.id,
          employee_id: deliveryDriver || null,
          driver_name: deliveryMethod === 'ekspedisi' ? (courierName || 'Ekspedisi Eksternal') : (employees.find(e => e.id === deliveryDriver)?.full_name || 'Kurir Toko'),
          vehicle_type: deliveryMethod === 'ekspedisi' ? 'cargo' : (deliveryVehicle || 'motor'), 
          vehicle_plate: deliveryPlate ? deliveryPlate.toUpperCase() : null,
          delivery_date: txnDate,
          status: deliveryStatus || 'terkirim',
          completed_at: deliveryStatus === 'terkirim' ? new Date().toISOString() : null,
          delivery_area: deliveryArea || null,
          notes: deliveryNotes,
        })
      }

      // Sync master prices if changed (hanya jika kemasan standar, agar kemasan kustom tidak merusak harga dasar)
      for (const item of validItems) {
        const p = products.find(x => x.id === item.product_id)
        if (p && item.price_per_unit > 0 && item.price_per_unit !== p.sell_price && !item.use_custom_packaging) {
          // Update global master price
          updateProduct.mutate({ id: p.id, sell_price: item.price_per_unit })
        }
      }

      setSuccessData({
        id: sale.id, invoiceNumber: sale.invoice_number, invoice_number: sale.invoice_number,
        customerName: custName, customer_name: custName,
        customerPhone: selectedCust?.phone || null,
        revenue: totalAmount, total_amount: totalAmount,
        cogs: totalCogs, deliveryCost: effectiveCustomerDelivery, delivery_cost: effectiveCustomerDelivery,
        otherCost: effectiveOtherCost, other_cost: effectiveOtherCost,
        netProfit: netProfit,
        hasDelivery: useDelivery,
        deliveryStatus: deliveryStatus,
        driverName: employees.find(e => e.id === deliveryDriver)?.full_name,
        transaction_date: txnDate, sembako_sale_items: validItems,
        remaining_amount: totalAmount - payAmount,
      })
      isSavedRef.current = true
      clearInvoiceDraft()
    } catch (err) {
      console.error(err)
      toast.error(formatFriendlyErrorMessage(err, 'Gagal menyimpan transaksi'))
    }
  }

  const handleSaveInvoice = () => {
    if (!custId) {
      setStep(0)
      setCustError('Pilih atau tambahkan toko terlebih dahulu')
      toast.error('Pilih toko / customer dulu sebelum menyimpan')
      return
    }

    const validItems = items
      .filter(i => i.product_id && Number(i.quantity) > 0)
    if (!validItems.length) { toast.error('Tambahkan minimal 1 produk'); return }

    handleSubmit()
  }

  // ── Auto Draft Persistence ──────────────────────────────────────────────────
  useEffect(() => {
    if (!open) {
      draftLoadedRef.current = false
      return
    }

    if (open && !editId && !draftLoadedRef.current) {
      isSavedRef.current = false
      try {
        const saved = localStorage.getItem(INVOICE_DRAFT_KEY)
        if (saved) {
          const d = JSON.parse(saved)
          if (d.custId) setCustId(d.custId)
          if (d.txnDate) setTxnDate(d.txnDate)
          if (d.dueDate) setDueDate(d.dueDate)
          if (Array.isArray(d.items) && d.items.length > 0) setItems(d.items)
          if (d.deliveryCost !== undefined) setDeliveryCost(d.deliveryCost)
          if (d.deliveryMethod) setDeliveryMethod(d.deliveryMethod)
          if (d.shippingBorneBy) setShippingBorneBy(d.shippingBorneBy)
          if (d.sellerShippingFee !== undefined) setSellerShippingFee(d.sellerShippingFee)
          if (d.otherCost !== undefined) setOtherCost(d.otherCost)
          if (Array.isArray(d.selectedCostChips)) setSelectedCostChips(d.selectedCostChips)
          if (d.otherCostNotes !== undefined) setOtherCostNotes(d.otherCostNotes)
          if (d.payAmount !== undefined) setPayAmount(d.payAmount)
          if (d.payMethod) setPayMethod(d.payMethod)
          if (d.notes) setNotes(d.notes)
          if (d.useDelivery !== undefined) setUseDelivery(d.useDelivery)
          if (d.deliveryDriver) setDeliveryDriver(d.deliveryDriver)
          if (d.deliveryVehicle) setDeliveryVehicle(d.deliveryVehicle)
          if (d.deliveryPlate) setDeliveryPlate(d.deliveryPlate)
          if (d.deliveryArea) setDeliveryArea(d.deliveryArea)
          if (d.fuelCost !== undefined) setFuelCost(d.fuelCost)
          if (d.stockSource) setStockSource(d.stockSource)
          if (d.stockEmployeeId) setStockEmployeeId(d.stockEmployeeId)
          if (d.step !== undefined && d.custId) {
            setStep(d.step)
          } else {
            setStep(0)
          }
        } else {
          clearInvoiceDraft()
        }
      } catch (e) {
        console.warn('[Draft] Failed to load draft:', e)
      } finally {
        draftLoadedRef.current = true
      }
    }
    // Mode edit: coba load edit-draft yang tersimpan sebelumnya
    if (open && editId && EDIT_DRAFT_KEY) {
      try {
        const saved = localStorage.getItem(EDIT_DRAFT_KEY)
        if (saved) {
          const d = JSON.parse(saved)
          const prefillKey = `${editId}:${editSale?.updated_at || editSale?.transaction_date || ''}`
          if (d._prefillKey === prefillKey) {
            if (d.custId) setCustId(d.custId)
            if (d.txnDate) setTxnDate(d.txnDate)
            if (d.dueDate) setDueDate(d.dueDate)
            if (Array.isArray(d.items) && d.items.length > 0) setItems(d.items)
            if (d.deliveryCost !== undefined) setDeliveryCost(d.deliveryCost)
            if (d.otherCost !== undefined) setOtherCost(d.otherCost)
            if (d.payAmount !== undefined) setPayAmount(d.payAmount)
            if (d.payMethod) setPayMethod(d.payMethod)
            if (d.notes !== undefined) setNotes(d.notes)
            setStep(1)
            toast.info('Draft edit sebelumnya dipulihkan', { duration: 2500 })
          }
        }
      } catch (e) {
        console.warn('[EditDraft] Failed to load edit draft:', e)
      } finally {
        draftLoadedRef.current = true
      }
    }
  }, [open, editId, clearInvoiceDraft, EDIT_DRAFT_KEY, editSale])

  useEffect(() => {
    if (isSavedRef.current) return
    if (open && !editId && draftLoadedRef.current) {
      const hasUserData = custId || (Array.isArray(items) && items.some(i => i.product_id || Number(i.quantity) > 0)) || deliveryCost > 0 || otherCost > 0 || notes
      if (hasUserData) {
        const draftData = {
          custId, txnDate, dueDate, items, deliveryCost, otherCost,
          selectedCostChips, otherCostNotes,
          payAmount, payMethod, notes, useDelivery, deliveryMethod,
          shippingBorneBy, sellerShippingFee, deliveryDriver,
          deliveryVehicle, deliveryPlate, deliveryArea, fuelCost, step,
          stockSource, stockEmployeeId
        }
        localStorage.setItem(INVOICE_DRAFT_KEY, JSON.stringify(draftData))
      } else {
        localStorage.removeItem(INVOICE_DRAFT_KEY)
      }
    }
    // Mode edit: simpan progress edit ke localStorage per-invoice
    if (open && editId && EDIT_DRAFT_KEY && lastPrefillKeyRef.current && draftLoadedRef.current) {
      const prefillKey = lastPrefillKeyRef.current
      const editDraftData = {
        _prefillKey: prefillKey,
        custId, txnDate, dueDate, items, deliveryCost, otherCost,
        payAmount, payMethod, notes
      }
      localStorage.setItem(EDIT_DRAFT_KEY, JSON.stringify(editDraftData))
    }
  }, [open, editId, EDIT_DRAFT_KEY, custId, txnDate, dueDate, items, deliveryCost, otherCost, selectedCostChips, otherCostNotes, payAmount, payMethod, notes, useDelivery, deliveryMethod, shippingBorneBy, sellerShippingFee, deliveryDriver, deliveryVehicle, deliveryPlate, deliveryArea, fuelCost, step, stockSource, stockEmployeeId])

  const handleClose = useCallback(() => {
    if (isSavedRef.current) {
      clearInvoiceDraft()
      isSavedRef.current = false
    }
    onOpenChange(false)
  }, [onOpenChange, clearInvoiceDraft])

  const handleCancelReset = useCallback(() => {
    clearInvoiceDraft()
    toast.success('Draft penjualan telah dibersihkan')
    onOpenChange(false)
  }, [clearInvoiceDraft, onOpenChange])

  const handleSheetOpenChange = v => { if (!v) handleClose(); else onOpenChange(true) }

  // Intercept Android hardware back button when invoice sheet is open
  useBackHandler(open, handleClose)

  const STEPS = ['Pilih Toko', 'Input Produk', 'Pengiriman', 'Summary']

  const goNext = async () => {
    // 1. Validasi Step 0 (Pilih / Tambah Toko)
    if (step === 0) {
      if (quickAddCust) {
        if (newCustForm.customer_name?.trim()) {
          const newId = await handleSaveQuickCust()
          if (!newId) return
        } else {
          setCustError('Nama toko baru wajib diisi atau batalkan form untuk memilih toko')
          toast.error('Nama toko baru wajib diisi')
          return
        }
      } else if (!custId) {
        setCustError('Pilih atau tambahkan toko terlebih dahulu')
        toast.error('Pilih toko / customer dulu sebelum lanjut')
        return
      }
      setCustError('')
    }

    // Safety guard: selalu pastikan custId ada sebelum ke step > 0
    if (!custId && !quickAddCust) {
      setStep(0)
      setCustError('Pilih atau tambahkan toko terlebih dahulu')
      toast.error('Pilih toko / customer dulu sebelum lanjut')
      return
    }

    // 2. Validasi Step 1 (Input Produk)
    if (step === 1) {
      if (stockSource === 'employee' && !stockEmployeeId) {
        toast.error('Pilih staf atau tim yang membawa stok terlebih dahulu')
        return
      }

      const validItems = items
        .filter(i => i.product_id && Number(i.quantity) > 0)
        .map(i => ({ ...i, quantity: Number(i.quantity) }))
      if (validItems.length === 0) {
        toast.error('Tambahkan minimal 1 produk'); return
      }
      const zeroPriceItem = validItems.find(i => !i.price_per_unit || i.price_per_unit <= 0)
      if (zeroPriceItem) {
        toast.error('Harga jual per unit wajib diisi (tidak boleh Rp 0)'); return
      }
      // In edit mode, this sale's original qty will be restored before re-deduction,
      // so effective available = current_stock + original qty for that product in this sale
      const getEffectiveStock = (productId) => {
        if (stockSource === 'employee' && stockEmployeeId) {
          const empCustody = custodyList.find(c => c.employee_id === stockEmployeeId && c.product_id === productId)
          return Number(empCustody?.quantity) || 0
        }
        const prod = products.find(p => p.id === productId)
        if (!prod) return 0
        const originalQty = editId
          ? (editSale?.sembako_sale_items || [])
              .filter(it => it.product_id === productId)
              .reduce((s, it) => s + (it.quantity || 0), 0)
          : 0
        return (prod.current_stock || 0) + originalQty
      }

      for (const item of validItems) {
        const prod = products.find(p => p.id === item.product_id)
        if (!prod) continue
        const factor = getFactor(item.selectedUnit || item.unit || 'pcs', prod)
        const qtyInBase = Number(item.quantity) * factor

        // 1. Check custom pouch stock constraint with edit mode allocation
        if (item.useCustomPackaging && item.customPackagingId) {
          const pMat = rawMaterialsList.find(m => m.id === item.customPackagingId)
          if (pMat) {
            const pouchStock = getEffectivePouchStock(item.customPackagingId)
            if (qtyInBase > pouchStock) {
              toast.error(`Stok kemasan ${pMat.material_name} tidak cukup — tersedia ${pouchStock} pcs, diminta ${qtyInBase} pcs`)
              return
            }
          }
        }

        // 2. Check general product / employee custody stock
        const available = getEffectiveStock(item.product_id)
        if (stockSource === 'employee') {
          if (qtyInBase > available) {
            const empName = employees.find(e => e.id === stockEmployeeId)?.full_name || 'Staf'
            toast.error(`Stok ${prod.product_name} pada ${empName} tidak cukup (tersedia ${available} ${prod.unit ?? 'unit'}, diminta ${qtyInBase}). Lakukan serah terima stok di menu Gudang jika perlu menambah bawaan.`)
            return
          }
        } else {
          if (available > 0 && qtyInBase > available) {
            toast.error(`Stok ${prod.product_name} di Gudang tidak cukup — tersedia ${available} ${prod.unit ?? 'unit'}, diminta ${qtyInBase} ${prod.unit ?? 'unit'}`)
            return
          }
        }
      }
    }
    setStep(s => s + 1)
  }

  // ── Render ──────────────────────────────────────────────────────────────────
  return (
    <>
      <Sheet open={open && !successData} onOpenChange={handleSheetOpenChange}>
        <SheetContent
          side={isDesktop ? 'right' : 'bottom'}
          hideClose
          className="hide-scrollbar"
          style={{
            width: isDesktop ? '480px' : '100%',
            height: isDesktop ? '100vh' : '100dvh',
            maxHeight: isDesktop ? '100vh' : '100dvh',
            padding: 0,
            background: BG,
            border: `1px solid ${BORDER}`,
            borderRadius: 0,
            display: 'flex',
            flexDirection: 'column',
            overflow: 'hidden',
          }}
        >
          {/* Mobile fullscreen customer search — inside Portal so aria-hidden on main app doesn't block it */}
          <AnimatePresence>
            {showCustSearch && !isDesktop && (
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: 20 }}
                transition={{ duration: 0.2 }}
                style={{ position: 'fixed', inset: 0, zIndex: 5100, pointerEvents: showCustSearch ? 'auto' : 'none' }}
              >
                <MobileCustomerSearch
                  customers={customers}
                  value={custId}
                  onSelect={handleSelectCustomer}
                  onAddNew={() => { setQuickAddCust(true); setShowCustSearch(false) }}
                  onClose={() => setShowCustSearch(false)}
                />
              </motion.div>
            )}
          </AnimatePresence>

          {/* ── Header ── */}
          <div style={{ padding: isDesktop ? '20px 20px 0' : 'env(safe-area-inset-top, 16px) 20px 0', flexShrink: 0 }}>
            {!isDesktop && (
              <div className="flex justify-end mb-3">
                <button
                  onClick={handleClose}
                  className="w-10 h-10 rounded-full flex items-center justify-center"
                  style={{ background: 'rgba(255,255,255,0.05)', color: TEXT }}
                >
                  <X size={20} />
                </button>
              </div>
            )}
            <div className="flex items-center justify-between mb-1">
              <SheetTitle className="font-black text-[22px]" style={{ color: TEXT, fontFamily: 'Sora', margin: 0 }}>
                {editId ? 'Edit Transaksi' : 'Catat Penjualan'}
              </SheetTitle>
              <SheetDescription className="sr-only">Wizard untuk mencatat penjualan sembako baru.</SheetDescription>
              {isDesktop && (
                <button
                  onClick={handleClose}
                  className="w-10 h-10 rounded-full flex items-center justify-center"
                  style={{ background: 'rgba(255,255,255,0.05)', color: TEXT }}
                >
                  <X size={20} />
                </button>
              )}
            </div>
          </div>

          {/* ── Progress ── */}
          <div className="px-5">
            <ProgressIndicator currentStep={step} steps={STEPS} />
          </div>

          {/* ── Step content ── */}
          <div className="flex-1 overflow-y-auto overflow-x-hidden px-5 pb-[max(24px,calc(16px+env(safe-area-inset-bottom,16px)))]">
            <AnimatePresence mode="wait">
              <motion.div
                key={step}
                initial={{ opacity: 0, x: 20 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: -20 }}
                transition={{ duration: 0.22 }}
                className="space-y-4"
              >
                {/* ════════════════════════════════════════
                    STEP 0 — Pilih Toko
                ════════════════════════════════════════ */}
                {step === 0 && (
                  <>
                    {custError && !custId && !quickAddCust && (
                      <div className="p-3.5 rounded-2xl bg-red-500/10 border border-red-500/30 text-xs font-bold text-red-600 dark:text-red-400 flex items-center gap-2.5 animate-in fade-in duration-200">
                        <AlertCircle size={18} className="shrink-0 text-red-500" />
                        <div className="flex-1">
                          <p className="font-black text-red-600 dark:text-red-400">Toko Belum Dipilih</p>
                          <p className="text-[11px] font-medium text-red-500/90 mt-0.5">Silakan pilih toko dari daftar atau tambah toko baru untuk melanjutkan.</p>
                        </div>
                      </div>
                    )}

                    <AnimatePresence mode="wait">
                      {!quickAddCust ? (
                        <motion.div key="cust-pick" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="space-y-3">
                          <div>
                            <label className={labelCn}>Toko / Customer *</label>
                            {customersLoading ? (
                              <div className="h-12 rounded-xl animate-pulse" style={{ background: 'rgba(15,23,42,0.06)' }} />
                            ) : customers.length === 0 ? (
                              /* Auto-show Quick Add when no customers exist */
                              <div
                                className="rounded-xl px-4 py-3 text-center"
                                style={{ background: 'rgba(15,23,42,0.04)', border: `1px dashed ${BORDER}` }}
                              >
                                <p className="text-sm font-semibold mb-2" style={{ color: TEXT }}>Belum ada toko / customer</p>
                                <p className="text-xs mb-3" style={{ color: MUTED }}>Tambahkan toko pertama untuk mulai catat penjualan</p>
                                <button
                                  onClick={() => setQuickAddCust(true)}
                                  className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl font-bold text-sm transition-all"
                                  style={{ background: ACCENT, color: '#fff', border: 'none', cursor: 'pointer', boxShadow: '0 4px 14px rgba(15,23,42,0.2)' }}
                                >
                                  <Plus size={14} /> Tambah Toko Pertama
                                </button>
                              </div>
                            ) : isDesktop ? (
                              // Desktop: inline dropdown
                              <CustomSelect
                                id="invoice-customer"
                                value={custId}
                                placeholder="-- Pilih toko / customer --"
                                options={customerOptions}
                                onChange={handleSelectCustomer}
                                onAddNew={() => { setCustError(''); setQuickAddCust(true); }}
                                style={{
                                  border: custError && !custId ? '1.5px solid #EF4444' : undefined,
                                  borderRadius: '14px',
                                }}
                              />
                            ) : (
                              // Mobile: tap to open fullscreen search
                              <button
                                onClick={() => { setCustError(''); setShowCustSearch(true); }}
                                className="w-full h-12 rounded-xl px-4 flex items-center justify-between text-sm font-semibold transition-colors"
                                style={{
                                  background: INPUT_BG,
                                  border: custError && !custId ? '1.5px solid #EF4444' : `1px solid ${BORDER}`,
                                  color: custId ? TEXT : MUTED,
                                }}
                              >
                                <span>{selectedCust?.customer_name || '-- Pilih toko / customer --'}</span>
                                <Search size={16} style={{ color: MUTED }} />
                              </button>
                            )}
                          </div>

                          {/* Selected customer info */}
                          <AnimatePresence>
                            {selectedCust && (
                              <motion.div
                                initial={{ opacity: 0, y: 6 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: 4 }}
                                className="rounded-xl p-3 space-y-1.5 text-sm"
                                style={{ background: 'rgba(15,23,42,0.04)', border: `1px solid ${BORDER}` }}
                              >
                                <div className="flex justify-between">
                                  <span style={{ color: MUTED, fontWeight: 600 }}>Tipe</span>
                                  <span style={{ color: TEXT, fontWeight: 700 }}>{selectedCust.customer_type?.toUpperCase() || '-'}</span>
                                </div>
                                <div className="flex justify-between">
                                  <span style={{ color: MUTED, fontWeight: 600 }}>Terms</span>
                                  <span style={{ color: ACCENT, fontWeight: 800 }}>{PAYMENT_TERMS_LABEL[selectedCust.payment_terms] || selectedCust.payment_terms}</span>
                                </div>
                                <div className="flex justify-between">
                                  <span style={{ color: MUTED, fontWeight: 600 }}>Piutang Aktif</span>
                                  <span className="font-black" style={{ color: selectedCust.total_outstanding > 0 ? '#EF4444' : C.green }}>
                                    {formatIDR(selectedCust.total_outstanding || 0)}
                                  </span>
                                </div>
                                {selectedCust.credit_limit > 0 && (
                                  <div className="pt-2 border-t space-y-1" style={{ borderColor: BORDER }}>
                                    <div className="flex justify-between text-[10px]">
                                      <span style={{ color: MUTED, fontWeight: 800 }}>BATAS KREDIT: {formatIDR(selectedCust.credit_limit)}</span>
                                      <span style={{ color: (selectedCust.total_outstanding || 0) > selectedCust.credit_limit ? '#EF4444' : MUTED }}>
                                        {Math.round(((selectedCust.total_outstanding || 0) / selectedCust.credit_limit) * 100)}%
                                      </span>
                                    </div>
                                    <div className="h-1.5 rounded-full overflow-hidden" style={{ background: 'rgba(255,255,255,0.06)' }}>
                                      <div
                                        className="h-full rounded-full transition-all"
                                        style={{
                                          width: `${Math.min(100, ((selectedCust.total_outstanding || 0) / selectedCust.credit_limit) * 100)}%`,
                                          background: (selectedCust.total_outstanding || 0) > selectedCust.credit_limit ? '#EF4444' : ACCENT,
                                        }}
                                      />
                                    </div>
                                    {(selectedCust.total_outstanding || 0) > selectedCust.credit_limit && (
                                      <p className="text-center text-[10px] font-black" style={{ color: '#EF4444' }}>
                                        WARNING: BATAS KREDIT TERLAMPAUI!
                                      </p>
                                    )}
                                  </div>
                                )}
                              </motion.div>
                            )}
                          </AnimatePresence>
                        </motion.div>
                      ) : (
                        <motion.div key="cust-add" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}>
                          <QuickAddCustomer
                            form={newCustForm}
                            onChange={setNewCustForm}
                            onSave={handleSaveQuickCust}
                            onCancel={() => { setCustError(''); setQuickAddCust(false); }}
                            saving={createCustomer.isPending}
                            error={custError}
                          />
                        </motion.div>
                      )}
                    </AnimatePresence>

                    {/* Dates — always stacked individually */}
                    <div>
                      <label className={labelCn}>Tanggal Transaksi</label>
                      <DatePicker value={txnDate} onChange={setTxnDate} />
                    </div>
                    <div>
                      <label className={labelCn}>Jatuh Tempo</label>
                      <DatePicker value={dueDate || ''} onChange={setDueDate} />
                    </div>

                    <div className="px-4 py-3 rounded-xl" style={{ background: 'rgba(255,255,255,0.02)', border: `1px dashed ${BORDER}` }}>
                      <p className="text-[12px] leading-relaxed" style={{ color: MUTED }}>
                        <span style={{ color: ACCENT, fontWeight: 800 }}>Info:</span> Invoice number dibuat otomatis saat disimpan.
                      </p>
                    </div>
                  </>
                )}

                {/* ════════════════════════════════════════
                    STEP 1 — Input Produk
                ════════════════════════════════════════ */}
                {step === 1 && (
                  <>
                    {/* Active Store Banner */}
                    <div
                      className="rounded-2xl p-3 flex items-center justify-between transition-all"
                      style={{ background: '#F1F5F9', border: `1px solid ${BORDER}` }}
                    >
                      <div className="flex items-center gap-2.5 min-w-0">
                        <div className="w-8 h-8 rounded-xl flex items-center justify-center shrink-0 text-sm" style={{ background: '#E2E8F0' }}>
                          🏪
                        </div>
                        <div className="min-w-0">
                          <p className="text-[9px] font-black uppercase tracking-wider" style={{ color: MUTED }}>Toko / Pelanggan</p>
                          <p className="font-black text-xs truncate" style={{ color: TEXT }}>
                            {selectedCust?.customer_name || <span className="text-red-500 font-bold">⚠️ Belum dipilih</span>}
                            {selectedCust?.payment_terms && (
                              <span className="text-[10px] font-semibold text-slate-500 ml-1.5 font-sans">
                                ({PAYMENT_TERMS_LABEL[selectedCust.payment_terms] || selectedCust.payment_terms})
                              </span>
                            )}
                          </p>
                        </div>
                      </div>
                      <button
                        type="button"
                        onClick={() => setStep(0)}
                        className="text-[11px] font-bold px-2.5 py-1.5 rounded-xl transition-colors shrink-0 cursor-pointer hover:bg-slate-300"
                        style={{ background: '#E2E8F0', color: TEXT }}
                      >
                        Ganti
                      </button>
                    </div>

                    {/* ─── Sumber Pengambilan Stok (Gudang vs. Tim Lapangan) ─── */}
                    <div className="rounded-2xl p-4 space-y-3 bg-white border border-slate-200/90 shadow-xs">
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-2.5 min-w-0">
                          <div className={cn(
                            "w-9 h-9 rounded-xl flex items-center justify-center font-bold text-sm shrink-0 transition-colors",
                            stockSource === 'warehouse' 
                              ? "bg-amber-50 text-amber-700 border border-amber-200" 
                              : "bg-emerald-50 text-emerald-700 border border-emerald-200"
                          )}>
                            {stockSource === 'warehouse' ? <Building2 size={18} /> : <Truck size={18} />}
                          </div>
                          <div className="min-w-0">
                            <span className="text-[10px] font-black uppercase tracking-wider text-slate-500 block">
                              Sumber / Lokasi Stok Fisik
                            </span>
                            <p className="text-xs font-black text-slate-900 truncate">
                              {stockSource === 'warehouse' ? 'Gudang Utama (Stok Rak/Pabrik)' : 'Dibawa Tim Lapangan / Kanvas'}
                            </p>
                          </div>
                        </div>
                        <span className={cn(
                          "text-[10px] font-black px-2.5 py-1 rounded-full border shrink-0 tracking-wide",
                          stockSource === 'warehouse'
                            ? "bg-amber-50 text-amber-800 border-amber-200/80"
                            : "bg-emerald-50 text-emerald-800 border-emerald-200/80"
                        )}>
                          {stockSource === 'warehouse' ? '🏢 Gudang' : '👥 Bawaan Tim'}
                        </span>
                      </div>

                      {/* Segmented Control Buttons (Clean, High Contrast & No Overlap) */}
                      <div className="grid grid-cols-2 gap-2 p-1 bg-slate-100/90 rounded-xl border border-slate-200">
                        <button
                          type="button"
                          onClick={() => setStockSource('warehouse')}
                          className={cn(
                            "py-2.5 px-3 rounded-lg text-xs font-black transition-all flex items-center justify-center gap-2 cursor-pointer",
                            stockSource === 'warehouse'
                              ? "bg-white text-slate-950 shadow-xs border border-slate-200/90"
                              : "text-slate-600 hover:text-slate-950 hover:bg-slate-200/50 border border-transparent"
                          )}
                        >
                          <Building2 size={15} className="shrink-0 text-amber-600" />
                          <span className="truncate">Gudang Utama</span>
                        </button>
                        <button
                          type="button"
                          onClick={() => setStockSource('employee')}
                          className={cn(
                            "py-2.5 px-3 rounded-lg text-xs font-black transition-all flex items-center justify-center gap-2 cursor-pointer",
                            stockSource === 'employee'
                              ? "bg-white text-slate-950 shadow-xs border border-slate-200/90"
                              : "text-slate-600 hover:text-slate-950 hover:bg-slate-200/50 border border-transparent"
                          )}
                        >
                          <Truck size={15} className="shrink-0 text-emerald-600" />
                          <span className="truncate">Dibawa Tim / Staff</span>
                        </button>
                      </div>

                      {/* Employee selector when stockSource === 'employee' */}
                      {stockSource === 'employee' && (
                        <motion.div
                          initial={{ opacity: 0, height: 0 }}
                          animate={{ opacity: 1, height: 'auto' }}
                          exit={{ opacity: 0, height: 0 }}
                          className="pt-2 space-y-2 border-t border-slate-100"
                        >
                          <label className="text-[10px] font-black text-slate-700 uppercase tracking-wider block">
                            Pilih Staf yang Membawa Stok:
                          </label>
                          <Select
                            value={stockEmployeeId || 'none'}
                            onValueChange={(val) => setStockEmployeeId(val === 'none' ? '' : val)}
                          >
                            <SelectTrigger className="w-full h-11 bg-white border border-slate-300 rounded-xl px-3 text-slate-900 text-xs font-bold focus:outline-none focus:border-slate-800 shadow-xs">
                              <SelectValue placeholder="-- Pilih Tim / Pegawai Lapangan --" />
                            </SelectTrigger>
                            <SelectContent className="z-[9999]">
                              <SelectItem value="none">-- Pilih Tim / Pegawai Lapangan --</SelectItem>
                              {employees.map(emp => {
                                const totalHeld = custodyList
                                  .filter(c => c.employee_id === emp.id)
                                  .reduce((sum, c) => sum + (Number(c.quantity) || 0), 0)
                                return (
                                  <SelectItem key={emp.id} value={emp.id}>
                                    {emp.full_name} ({emp.role || 'Staff'}) — Membawa {totalHeld} pcs stok
                                  </SelectItem>
                                )
                              })}
                            </SelectContent>
                          </Select>
                          {!stockEmployeeId ? (
                            <p className="text-[11px] font-semibold text-amber-700 bg-amber-50 p-2 rounded-lg border border-amber-200/70 flex items-center gap-1.5">
                              <span>⚠️</span>
                              <span>Pilih staf yang membawa barang agar stok bawaannya terpotong otomatis saat nota dibuat.</span>
                            </p>
                          ) : (
                            <div className="p-2.5 rounded-xl bg-slate-50 border border-slate-200/60 text-xs">
                              <span className="text-[11px] text-slate-500 font-medium">
                                Penjualan ini akan memotong saldo stok yang dipegang oleh <strong>{employees.find(e => e.id === stockEmployeeId)?.full_name}</strong>.
                              </span>
                            </div>
                          )}
                        </motion.div>
                      )}
                    </div>

                    <div className="flex items-center justify-between">
                      <label className={labelCn}>Item Produk</label>
                      {productsLoading
                        ? <span className="text-[10px] font-bold animate-pulse" style={{ color: ACCENT }}>Memuat...</span>
                        : <span className="text-[10px] font-bold" style={{ color: MUTED }}>{items.length} Item</span>
                      }
                    </div>

                    {/* Quick-add product */}
                    <AnimatePresence>
                      {quickAddProd && (
                        <QuickAddProduct
                          form={newProdForm}
                          onChange={setNewProdForm}
                          onSave={handleSaveQuickProd}
                          onCancel={() => setQuickAddProd(false)}
                          saving={createProduct.isPending}
                        />
                      )}
                    </AnimatePresence>

                    {/* Loading skeletons */}
                    {productsLoading && (
                      <div className="space-y-3">
                        {[1, 2].map(i => (
                          <div key={i} className="h-24 rounded-2xl animate-pulse" style={{ background: 'rgba(15,23,42,0.06)' }} />
                        ))}
                      </div>
                    )}

                    {/* Product rows */}
                    <div className="space-y-3">
                      {items.map((item, idx) => {
                        const prod = products.find(p => p.id === item.product_id)
                        const originalQty = editId
                          ? (editSale?.sembako_sale_items || [])
                              .filter(it => it.product_id === item.product_id)
                              .reduce((s, it) => s + (it.quantity || 0), 0)
                          : 0
                        const factor = getFactor(item.selectedUnit || item.unit || 'pcs', prod)
                        const qtyInBase = Number(item.quantity || 0) * factor

                        let customPouchStock = null
                        let customPouchName = ''
                        if (item.useCustomPackaging) {
                          const pMat = (item.customPackagingId && rawMaterialsList.find(m => m.id === item.customPackagingId)) ||
                            (item.customPackagingName && rawMaterialsList.find(m => m.material_name.toLowerCase().trim() === item.customPackagingName.toLowerCase().trim()))
                          if (pMat) {
                            customPouchStock = getEffectivePouchStock(pMat.id)
                            customPouchName = pMat.material_name
                          }
                        }

                        // Determine available stock depending on stockSource
                        let availableStock = 0
                        let stockSourceLabel = 'Gudang'
                        if (stockSource === 'employee' && stockEmployeeId) {
                          const empHold = custodyList.find(c => c.employee_id === stockEmployeeId && c.product_id === item.product_id)
                          availableStock = (Number(empHold?.quantity) || 0) + originalQty
                          const empObj = employees.find(e => e.id === stockEmployeeId)
                          stockSourceLabel = empObj?.full_name ? empObj.full_name.split(' ')[0] : 'Staf'
                        } else {
                          const whHold = custodyList.find(c => (c.holder_type === 'warehouse' || !c.employee_id) && c.product_id === item.product_id)
                          const whQty = whHold ? (Number(whHold.quantity) || 0) : (Number(prod?.current_stock) || 0)
                          availableStock = whQty + originalQty
                        }

                        const isPouchOverstock = customPouchStock !== null && qtyInBase > customPouchStock
                        const isGeneralOverstock = prod && qtyInBase > availableStock
                        const overStock = isPouchOverstock || isGeneralOverstock

                        return (
                          <ProductItemRow
                            key={idx}
                            item={item}
                            idx={idx}
                            products={products}
                            productOptions={productOptions}
                            overStock={overStock}
                            isPouchOverstock={isPouchOverstock}
                            customPouchStock={customPouchStock}
                            customPouchName={customPouchName}
                            availableStockQty={availableStock}
                            stockSourceLabel={stockSourceLabel}
                            onChangeItem={handleItemChange}
                            onRemove={idx => setItems(items.filter((_, i) => i !== idx))}
                            onAddNew={() => setQuickAddProd(true)}
                            isOnly={items.length === 1}
                            allBatches={allBatches}
                            packagingMaterials={packagingMaterials}
                            rawMaterialsList={rawMaterialsList}
                            getEffectivePouchStock={getEffectivePouchStock}
                          />
                        )
                      })}
                    </div>

                    {/* Add item */}
                    <button
                      onClick={() => setItems([...items, { product_id: '', product_name: '', unit: '', selectedUnit: '', priceMode: 'per_base', quantity: 0, price_per_unit: 0, cogs_per_unit: 0 }])}
                      className="w-full h-12 rounded-xl flex items-center justify-center gap-2 font-bold text-sm transition-all"
                      style={{ border: `1px dashed ${BORDER}`, color: MUTED, background: 'transparent' }}
                    >
                      <Plus size={16} /> Tambah Item Lain
                    </button>

                    {/* Running total */}
                    <div className="flex items-center justify-between px-4 py-3 rounded-xl" style={{ background: '#F8FAFC' }}>
                      <span className="text-[11px] font-black uppercase tracking-widest" style={{ color: MUTED }}>Subtotal Produk</span>
                      <span className="text-base font-black" style={{ color: TEXT }}>{formatIDR(productSubtotal)}</span>
                    </div>
                  </>
                )}

                {/* ════════════════════════════════════════
                    STEP 2 — Pengiriman
                ════════════════════════════════════════ */}
                {step === 2 && (
                  <>
                    {/* Active Store Banner */}
                    <div
                      className="rounded-2xl p-3 flex items-center justify-between transition-all"
                      style={{ background: '#F1F5F9', border: `1px solid ${BORDER}` }}
                    >
                      <div className="flex items-center gap-2.5 min-w-0">
                        <div className="w-8 h-8 rounded-xl flex items-center justify-center shrink-0 text-sm" style={{ background: '#E2E8F0' }}>
                          🏪
                        </div>
                        <div className="min-w-0">
                          <p className="text-[9px] font-black uppercase tracking-wider" style={{ color: MUTED }}>Toko / Pelanggan</p>
                          <p className="font-black text-xs truncate" style={{ color: TEXT }}>
                            {selectedCust?.customer_name || <span className="text-red-500 font-bold">⚠️ Belum dipilih</span>}
                            {selectedCust?.payment_terms && (
                              <span className="text-[10px] font-semibold text-slate-500 ml-1.5 font-sans">
                                ({PAYMENT_TERMS_LABEL[selectedCust.payment_terms] || selectedCust.payment_terms})
                              </span>
                            )}
                          </p>
                        </div>
                      </div>
                      <button
                        type="button"
                        onClick={() => setStep(0)}
                        className="text-[11px] font-bold px-2.5 py-1.5 rounded-xl transition-colors shrink-0 cursor-pointer hover:bg-slate-300"
                        style={{ background: '#E2E8F0', color: TEXT }}
                      >
                        Ganti
                      </button>
                    </div>

                    {/* Metode Pengiriman: 3 Pilihan */}
                    <div className="space-y-2">
                      <label className={labelCn}>Metode Pengiriman</label>
                      <div className="grid grid-cols-1 sm:grid-cols-3 gap-2">
                        {/* Card 1: Ekspedisi / Cargo */}
                        <button
                          type="button"
                          onClick={() => { 
                            setDeliveryMethod('ekspedisi'); 
                            setUseDelivery(true); 
                            setDeliveryStatus('terkirim'); 
                          }}
                          className="p-3.5 rounded-2xl border text-left transition-all relative flex flex-col justify-between cursor-pointer"
                          style={{
                            background: (deliveryMethod === 'ekspedisi' && useDelivery) ? '#F0F9FF' : SURFACE,
                            borderColor: (deliveryMethod === 'ekspedisi' && useDelivery) ? '#0284C7' : BORDER,
                          }}
                        >
                          <div className="flex items-center justify-between mb-2">
                            <span className="text-lg">📦</span>
                            {(deliveryMethod === 'ekspedisi' && useDelivery) && <Check size={16} color="#0284C7" strokeWidth={3} />}
                          </div>
                          <div>
                            <p className="font-bold text-xs" style={{ color: (deliveryMethod === 'ekspedisi' && useDelivery) ? '#0284C7' : TEXT }}>
                              Ekspedisi / Cargo (J&T, dll)
                            </p>
                            <p className="text-[10px] mt-0.5 font-medium" style={{ color: MUTED }}>J&T, SiCepat, Indah Cargo / Luar Kota</p>
                          </div>
                        </button>

                        {/* Card 2: Kurir / Armada Toko */}
                        <button
                          type="button"
                          onClick={() => { 
                            setDeliveryMethod('kurir_toko'); 
                            setUseDelivery(true); 
                            setDeliveryStatus('terkirim'); 
                          }}
                          className="p-3.5 rounded-2xl border text-left transition-all relative flex flex-col justify-between cursor-pointer"
                          style={{
                            background: (deliveryMethod === 'kurir_toko' && useDelivery) ? '#F0FDF4' : SURFACE,
                            borderColor: (deliveryMethod === 'kurir_toko' && useDelivery) ? '#16A34A' : BORDER,
                          }}
                        >
                          <div className="flex items-center justify-between mb-2">
                            <span className="text-lg">🛵</span>
                            {(deliveryMethod === 'kurir_toko' && useDelivery) && <Check size={16} color="#16A34A" strokeWidth={3} />}
                          </div>
                          <div>
                            <p className="font-bold text-xs" style={{ color: (deliveryMethod === 'kurir_toko' && useDelivery) ? '#16A34A' : TEXT }}>
                              Kurir / Armada Toko
                            </p>
                            <p className="text-[10px] mt-0.5 font-medium" style={{ color: MUTED }}>Antar Solo Raya & Driver Toko</p>
                          </div>
                        </button>

                        {/* Card 3: Ambil Sendiri (Pickup) */}
                        <button
                          type="button"
                          onClick={() => { 
                            setDeliveryMethod('pickup'); 
                            setUseDelivery(false); 
                            setDeliveryCost(0);
                          }}
                          className="p-3.5 rounded-2xl border text-left transition-all relative flex flex-col justify-between cursor-pointer"
                          style={{
                            background: (!useDelivery || deliveryMethod === 'pickup') ? '#F8FAFC' : SURFACE,
                            borderColor: (!useDelivery || deliveryMethod === 'pickup') ? '#475569' : BORDER,
                          }}
                        >
                          <div className="flex items-center justify-between mb-2">
                            <span className="text-lg">🏪</span>
                            {(!useDelivery || deliveryMethod === 'pickup') && <Check size={16} color="#475569" strokeWidth={3} />}
                          </div>
                          <div>
                            <p className="font-bold text-xs" style={{ color: (!useDelivery || deliveryMethod === 'pickup') ? '#475569' : TEXT }}>
                              Ambil Sendiri (Pickup)
                            </p>
                            <p className="text-[10px] mt-0.5 font-medium" style={{ color: MUTED }}>Ambil di toko / cash & carry</p>
                          </div>
                        </button>
                      </div>
                    </div>

                    <AnimatePresence>
                      {deliveryMethod === 'ekspedisi' && useDelivery && (
                        <motion.div
                          initial={{ opacity: 0, height: 0 }}
                          animate={{ opacity: 1, height: 'auto' }}
                          exit={{ opacity: 0, height: 0 }}
                          className="space-y-4 overflow-hidden pt-1"
                        >
                          {/* Nama Ekspedisi / Resi */}
                          <div>
                            <label className={labelCn}>Nama Ekspedisi & No. Resi <span className="normal-case opacity-60 font-normal">(Opsional)</span></label>
                            <input
                              className={inputCn}
                              value={courierName}
                              onChange={e => setCourierName(e.target.value)}
                              placeholder="Contoh: J&T Cargo / No. Resi JNT998811..."
                            />
                          </div>

                          {/* Penanggung Ongkir Selector (Pembeli vs Penjual) */}
                          <div className="space-y-2 pt-2 border-t border-slate-200 dark:border-white/10">
                            <label className={labelCn}>Siapa yang Menanggung Ongkos Kirim?</label>
                            <div className="grid grid-cols-2 gap-2">
                              <button
                                type="button"
                                onClick={() => setShippingBorneBy('buyer')}
                                className={`p-2.5 rounded-xl border text-left transition-all cursor-pointer ${
                                  shippingBorneBy === 'buyer'
                                    ? 'bg-slate-900 dark:bg-white text-white dark:text-slate-900 border-slate-900 dark:border-white shadow-xs'
                                    : 'bg-white dark:bg-white/5 text-slate-700 dark:text-slate-300 border-slate-200 dark:border-white/10 hover:border-slate-400'
                                }`}
                              >
                                <div className="flex items-center justify-between">
                                  <span className="text-xs font-black">👤 Ditanggung Pembeli</span>
                                  {shippingBorneBy === 'buyer' && <Check size={14} strokeWidth={3} />}
                                </div>
                                <p className="text-[10px] opacity-75 mt-0.5">Ongkir masuk nota tagihan pelanggan</p>
                              </button>

                              <button
                                type="button"
                                onClick={() => setShippingBorneBy('seller')}
                                className={`p-2.5 rounded-xl border text-left transition-all cursor-pointer ${
                                  shippingBorneBy === 'seller'
                                    ? 'bg-slate-900 dark:bg-white text-white dark:text-slate-900 border-slate-900 dark:border-white shadow-xs'
                                    : 'bg-white dark:bg-white/5 text-slate-700 dark:text-slate-300 border-slate-200 dark:border-white/10 hover:border-slate-400'
                                }`}
                              >
                                <div className="flex items-center justify-between">
                                  <span className="text-xs font-black">🏪 Ditanggung Penjual</span>
                                  {shippingBorneBy === 'seller' && <Check size={14} strokeWidth={3} />}
                                </div>
                                <p className="text-[10px] opacity-75 mt-0.5">Free Ongkir pembeli, beban toko</p>
                              </button>
                            </div>
                          </div>

                          {/* Mode 1: Ongkir Ditanggung Pembeli */}
                          {shippingBorneBy === 'buyer' ? (
                            <div className="space-y-1.5 pt-1">
                              <div className="flex items-center justify-between">
                                <label className={labelCn}>Ongkos Kirim Ditagihkan ke Pelanggan</label>
                                <span className={`text-[10px] font-black px-2 py-0.5 rounded-full ${
                                  deliveryCost === 0 ? 'bg-emerald-100 dark:bg-emerald-950/60 text-emerald-800 dark:text-emerald-300' : 'bg-indigo-100 dark:bg-indigo-950/60 text-indigo-800 dark:text-indigo-300'
                                }`}>
                                  {deliveryCost === 0 ? '🎁 Bebas Ongkir' : `+${formatIDR(deliveryCost)}`}
                                </span>
                              </div>
                              <InputRupiah id="delivery-cost-input" value={deliveryCost} onChange={setDeliveryCost} />
                              
                              {/* Quick Ongkir Presets */}
                              <div className="flex flex-wrap items-center gap-1 pt-1">
                                {[0, 6000, 10000, 15000, 20000, 25000, 35000, 50000].map(amt => (
                                  <button
                                    key={amt}
                                    type="button"
                                    onClick={() => setDeliveryCost(amt)}
                                    className={`px-2 py-1 rounded-lg text-[10px] font-bold border transition-all cursor-pointer ${
                                      deliveryCost === amt
                                        ? 'bg-slate-900 dark:bg-white text-white dark:text-slate-900 border-slate-900 dark:border-white shadow-xs'
                                        : 'bg-white dark:bg-white/5 text-slate-600 dark:text-slate-300 border-slate-200 dark:border-white/10 hover:border-slate-400'
                                    }`}
                                  >
                                    {amt === 0 ? '🎁 Rp 0' : `${amt >= 1000 ? amt / 1000 + 'k' : amt}`}
                                  </button>
                                ))}
                              </div>
                              <p className="text-[10px] text-slate-500 dark:text-slate-400 mt-1 font-medium italic">
                                * Ditambahkan ke total nota tagihan pelanggan {deliveryCost > 0 ? '(diteruskan ke kurir ekspedisi, bukan keuntungan toko).' : '(Tercatat Bebas Ongkir).'}
                              </p>
                            </div>
                          ) : (
                            /* Mode 2: Ongkir Ditanggung Penjual */
                            <div className="space-y-1.5 pt-1">
                              <div className="flex items-center justify-between">
                                <label className={labelCn}>Biaya Ekspedisi yang Dibayar Toko (Beban Penjual)</label>
                                <span className="text-[10px] font-black px-2 py-0.5 rounded-full bg-amber-100 dark:bg-amber-950/60 text-amber-800 dark:text-amber-300">
                                  Beban Toko: {formatIDR(sellerShippingFee)}
                                </span>
                              </div>
                              <InputRupiah id="seller-shipping-fee-input" value={sellerShippingFee} onChange={setSellerShippingFee} />
                              
                              {/* Quick Presets */}
                              <div className="flex flex-wrap items-center gap-1 pt-1">
                                {[6000, 10000, 15000, 20000, 25000, 35000, 50000].map(amt => (
                                  <button
                                    key={amt}
                                    type="button"
                                    onClick={() => setSellerShippingFee(amt)}
                                    className={`px-2 py-1 rounded-lg text-[10px] font-bold border transition-all cursor-pointer ${
                                      sellerShippingFee === amt
                                        ? 'bg-slate-900 dark:bg-white text-white dark:text-slate-900 border-slate-900 dark:border-white shadow-xs'
                                        : 'bg-white dark:bg-white/5 text-slate-600 dark:text-slate-300 border-slate-200 dark:border-white/10 hover:border-slate-400'
                                    }`}
                                  >
                                    {amt >= 1000 ? amt / 1000 + 'k' : amt}
                                  </button>
                                ))}
                              </div>
                              <p className="text-[10px] text-emerald-700 dark:text-emerald-400 mt-1 font-medium italic">
                                * Pelanggan mendapat <strong>Bebas Ongkir (Rp 0 di nota)</strong>. Biaya ekspedisi memotong laba operasional toko.
                              </p>
                            </div>
                          )}
                        </motion.div>
                      )}

                      {deliveryMethod === 'kurir_toko' && useDelivery && (
                        <motion.div
                          initial={{ opacity: 0, height: 0 }}
                          animate={{ opacity: 1, height: 'auto' }}
                          exit={{ opacity: 0, height: 0 }}
                          className="space-y-4 overflow-hidden pt-1"
                        >
                          {/* 1. Sopir / Kurir & Area Pengiriman (Grid 2 Kolom Ringkas) */}
                          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                            <div>
                              <div className="flex items-center justify-between mb-1">
                                <label className={labelCn}>Sopir / Kurir Toko <span className="normal-case opacity-60 font-normal">(Opsional)</span></label>
                                {!addKurir && (
                                  <button
                                    type="button"
                                    onClick={() => setAddKurir(true)}
                                    className="text-[11px] font-bold text-blue-600 dark:text-blue-400 hover:underline flex items-center gap-0.5 cursor-pointer"
                                  >
                                    <Plus size={12} /> Kurir Baru
                                  </button>
                                )}
                              </div>
                              {!addKurir ? (
                                <select
                                  className={`${inputCn} cursor-pointer font-medium`}
                                  value={deliveryDriver}
                                  onChange={e => handleSelectDriver(e.target.value)}
                                >
                                  <option value="">– Belum Ditentukan (Kosongkan) –</option>
                                  {employees.filter(e => e.status === 'aktif').map(e => (
                                    <option key={e.id} value={e.id}>
                                      👤 {e.full_name} ({e.role || 'Kurir'})
                                    </option>
                                  ))}
                                </select>
                              ) : (
                                <motion.div
                                  initial={{ opacity: 0, scale: 0.95 }}
                                  animate={{ opacity: 1, scale: 1 }}
                                  className="p-3 rounded-xl border border-blue-200 dark:border-blue-900/50 bg-blue-50/50 dark:bg-blue-950/20 space-y-2"
                                >
                                  <p className="text-[10px] font-black uppercase tracking-wider text-blue-800 dark:text-blue-300">Tambah Kurir Cepat</p>
                                  <input
                                    className={inputCn}
                                    placeholder="Nama lengkap kurir *"
                                    value={newKurirForm.full_name}
                                    onChange={e => setNewKurirForm(f => ({ ...f, full_name: e.target.value }))}
                                  />
                                  <input
                                    className={inputCn}
                                    placeholder="No. HP (opsional)"
                                    value={newKurirForm.phone}
                                    onChange={e => setNewKurirForm(f => ({ ...f, phone: e.target.value }))}
                                  />
                                  <div className="flex gap-2 pt-1">
                                    <button
                                      type="button"
                                      onClick={() => { setAddKurir(false); setNewKurirForm({ full_name: '', phone: '' }) }}
                                      className="flex-1 h-8 rounded-lg text-xs font-bold border border-slate-300 dark:border-white/10 text-slate-600 dark:text-slate-300 cursor-pointer"
                                    >
                                      Batal
                                    </button>
                                    <button
                                      type="button"
                                      onClick={handleSaveKurir}
                                      disabled={createEmployee.isPending}
                                      className="flex-1 h-8 rounded-lg text-xs font-bold bg-blue-600 text-white hover:bg-blue-700 cursor-pointer"
                                    >
                                      {createEmployee.isPending ? '...' : 'Simpan'}
                                    </button>
                                  </div>
                                </motion.div>
                              )}
                            </div>

                            <div>
                              <label className={labelCn}>Area Pengiriman <span className="normal-case opacity-60 font-normal">(Opsional)</span></label>
                              <input
                                className={inputCn}
                                value={deliveryArea}
                                onChange={e => setDeliveryArea(e.target.value)}
                                placeholder="Contoh: Kec. Setiabudi (opsional)"
                              />
                            </div>
                          </div>

                          {/* 2. Siapa yang Menanggung Ongkos Kirim? (Identik dengan Ekspedisi) */}
                          <div className="space-y-2 pt-2 border-t border-slate-200 dark:border-white/10">
                            <label className={labelCn}>Siapa yang Menanggung Ongkos Kirim?</label>
                            <div className="grid grid-cols-2 gap-2">
                              <button
                                type="button"
                                onClick={() => setShippingBorneBy('buyer')}
                                className={`p-2.5 rounded-xl border text-left transition-all cursor-pointer ${
                                  shippingBorneBy === 'buyer'
                                    ? 'bg-slate-900 dark:bg-white text-white dark:text-slate-900 border-slate-900 dark:border-white shadow-xs'
                                    : 'bg-white dark:bg-white/5 text-slate-700 dark:text-slate-300 border-slate-200 dark:border-white/10 hover:border-slate-400'
                                }`}
                              >
                                <div className="flex items-center justify-between">
                                  <span className="text-xs font-black">👤 Ditanggung Pembeli</span>
                                  {shippingBorneBy === 'buyer' && <Check size={14} strokeWidth={3} />}
                                </div>
                                <p className="text-[10px] opacity-75 mt-0.5">Ongkir masuk nota tagihan pelanggan</p>
                              </button>

                              <button
                                type="button"
                                onClick={() => setShippingBorneBy('seller')}
                                className={`p-2.5 rounded-xl border text-left transition-all cursor-pointer ${
                                  shippingBorneBy === 'seller'
                                    ? 'bg-slate-900 dark:bg-white text-white dark:text-slate-900 border-slate-900 dark:border-white shadow-xs'
                                    : 'bg-white dark:bg-white/5 text-slate-700 dark:text-slate-300 border-slate-200 dark:border-white/10 hover:border-slate-400'
                                }`}
                              >
                                <div className="flex items-center justify-between">
                                  <span className="text-xs font-black">🏪 Ditanggung Penjual</span>
                                  {shippingBorneBy === 'seller' && <Check size={14} strokeWidth={3} />}
                                </div>
                                <p className="text-[10px] opacity-75 mt-0.5">Free Ongkir pembeli, beban toko</p>
                              </button>
                            </div>
                          </div>

                          {/* 3. Mode 1: Ongkir Ditanggung Pembeli */}
                          {shippingBorneBy === 'buyer' ? (
                            <div className="space-y-1.5 pt-1">
                              <div className="flex items-center justify-between">
                                <div className="flex items-center gap-1.5">
                                  <label className={labelCn}>Ongkos Kirim Ditagihkan ke Pelanggan</label>
                                  {deliveryCost > 0 && (
                                    <span className="text-[9px] font-black px-2 py-0.5 rounded-md bg-emerald-100 dark:bg-emerald-950/60 text-emerald-800 dark:text-emerald-300 border border-emerald-300/60 dark:border-emerald-700/50">
                                      💰 100% Keuntungan Toko
                                    </span>
                                  )}
                                </div>
                                <span className={`text-[10px] font-black px-2 py-0.5 rounded-full ${
                                  deliveryCost === 0 ? 'bg-emerald-100 dark:bg-emerald-950/60 text-emerald-800 dark:text-emerald-300' : 'bg-indigo-100 dark:bg-indigo-950/60 text-indigo-800 dark:text-indigo-300'
                                }`}>
                                  {deliveryCost === 0 ? '🎁 Bebas Ongkir' : `+${formatIDR(deliveryCost)}`}
                                </span>
                              </div>
                              <InputRupiah id="delivery-cost-input-kurir" value={deliveryCost} onChange={setDeliveryCost} />
                              
                              {/* Quick Ongkir Presets */}
                              <div className="flex flex-wrap items-center gap-1 pt-1">
                                {[0, 6000, 10000, 15000, 20000, 25000, 35000, 50000].map(amt => (
                                  <button
                                    key={amt}
                                    type="button"
                                    onClick={() => setDeliveryCost(amt)}
                                    className={`px-2 py-1 rounded-lg text-[10px] font-bold border transition-all cursor-pointer ${
                                      deliveryCost === amt
                                        ? 'bg-slate-900 dark:bg-white text-white dark:text-slate-900 border-slate-900 dark:border-white shadow-xs'
                                        : 'bg-white dark:bg-white/5 text-slate-600 dark:text-slate-300 border-slate-200 dark:border-white/10 hover:border-slate-400'
                                    }`}
                                  >
                                    {amt === 0 ? '🎁 Rp 0' : `${amt >= 1000 ? amt / 1000 + 'k' : amt}`}
                                  </button>
                                ))}
                              </div>
                              <p className="text-[10px] text-slate-500 dark:text-slate-400 mt-1 font-medium italic">
                                * Ditambahkan ke total nota tagihan pelanggan {deliveryCost > 0 ? '(& langsung masuk sebagai keuntungan/profit toko).' : '(Tercatat Bebas Ongkir).'}
                              </p>
                            </div>
                          ) : (
                            /* Mode 2: Ongkir Ditanggung Penjual (Free Ongkir) */
                            <div className="space-y-1.5 pt-1">
                              <div className="flex items-center justify-between">
                                <label className={labelCn}>Biaya Pengiriman Toko / BBM (Beban Penjual)</label>
                                <span className="text-[10px] font-black px-2 py-0.5 rounded-full bg-amber-100 dark:bg-amber-950/60 text-amber-800 dark:text-amber-300">
                                  Beban Toko: {formatIDR(sellerShippingFee)}
                                </span>
                              </div>
                              <InputRupiah id="seller-shipping-fee-kurir" value={sellerShippingFee} onChange={setSellerShippingFee} />
                              
                              {/* Quick Presets */}
                              <div className="flex flex-wrap items-center gap-1 pt-1">
                                {[0, 6000, 10000, 15000, 20000, 25000, 35000, 50000].map(amt => (
                                  <button
                                    key={amt}
                                    type="button"
                                    onClick={() => setSellerShippingFee(amt)}
                                    className={`px-2 py-1 rounded-lg text-[10px] font-bold border transition-all cursor-pointer ${
                                      sellerShippingFee === amt
                                        ? 'bg-slate-900 dark:bg-white text-white dark:text-slate-900 border-slate-900 dark:border-white shadow-xs'
                                        : 'bg-white dark:bg-white/5 text-slate-600 dark:text-slate-300 border-slate-200 dark:border-white/10 hover:border-slate-400'
                                    }`}
                                  >
                                    {amt === 0 ? 'Rp 0' : `${amt >= 1000 ? amt / 1000 + 'k' : amt}`}
                                  </button>
                                ))}
                              </div>
                              <p className="text-[10px] text-emerald-700 dark:text-emerald-400 mt-1 font-medium italic">
                                * Pelanggan mendapat <strong>Bebas Ongkir (Rp 0 di nota)</strong>. Biaya bensin/kurir memotong laba operasional toko.
                              </p>
                            </div>
                          )}

                          {/* 4. Collapsible Accordion Kendaraan & Plat (Opsional) */}
                          <div className="pt-2 border-t border-slate-200 dark:border-white/10">
                            <button
                              type="button"
                              onClick={() => setShowVehicleDetails(v => !v)}
                              className="flex items-center justify-between w-full py-1.5 px-3 rounded-xl bg-slate-50 dark:bg-white/5 border border-slate-200 dark:border-white/10 text-xs font-bold text-slate-700 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-white/10 transition-all cursor-pointer"
                            >
                              <span className="flex items-center gap-1.5">
                                <span>🚗</span> Rincian Kendaraan & Plat <span className="text-[10px] font-normal opacity-70">(Opsional)</span>
                                {(deliveryVehicle || deliveryPlate) && (
                                  <span className="text-[10px] bg-slate-200 dark:bg-white/10 text-slate-800 dark:text-slate-200 px-1.5 py-0.5 rounded font-mono font-bold">
                                    {[deliveryVehicle, deliveryPlate].filter(Boolean).join(' • ')}
                                  </span>
                                )}
                              </span>
                              {showVehicleDetails ? <ChevronUp size={14} /> : <ChevronDown size={14} />}
                            </button>

                            <AnimatePresence>
                              {showVehicleDetails && (
                                <motion.div
                                  initial={{ opacity: 0, height: 0 }}
                                  animate={{ opacity: 1, height: 'auto' }}
                                  exit={{ opacity: 0, height: 0 }}
                                  className="space-y-3 overflow-hidden pt-3"
                                >
                                  <div>
                                    <label className={labelCn}>Jenis Kendaraan</label>
                                    <div className="flex flex-wrap gap-2 mt-1">
                                      {VEHICLE_TYPES.map(({ value, label, Icon }) => {
                                        const active = deliveryVehicle === value
                                        return (
                                          <button
                                            key={value}
                                            type="button"
                                            onClick={() => setDeliveryVehicle(active ? '' : value)}
                                            className="flex items-center gap-1.5 px-3 h-8 rounded-xl text-xs font-bold transition-all cursor-pointer"
                                            style={{
                                              background: active ? '#0F172A' : '#FFFFFF',
                                              border: `1px solid ${active ? '#0F172A' : BORDER}`,
                                              color: active ? '#FFFFFF' : '#64748B',
                                            }}
                                          >
                                            <Icon size={13} strokeWidth={2.5} />
                                            {label}
                                          </button>
                                        )
                                      })}
                                    </div>
                                  </div>

                                  <div>
                                    <label className={labelCn}>No. Plat Kendaraan</label>
                                    <input
                                      className={inputCn}
                                      value={deliveryPlate}
                                      onChange={e => setDeliveryPlate(e.target.value.toUpperCase())}
                                      placeholder="Contoh: B 1234 XY (opsional)"
                                    />
                                  </div>
                                </motion.div>
                              )}
                            </AnimatePresence>
                          </div>
                        </motion.div>
                      )}

                      {deliveryMethod === 'pickup' && (
                        <motion.div
                          initial={{ opacity: 0, height: 0 }}
                          animate={{ opacity: 1, height: 'auto' }}
                          exit={{ opacity: 0, height: 0 }}
                          className="p-3.5 rounded-2xl bg-slate-100 dark:bg-white/5 border border-slate-200 dark:border-white/10 text-xs text-slate-700 dark:text-slate-300 flex items-center gap-3"
                        >
                          <span className="text-2xl">🏪</span>
                          <div>
                            <p className="font-bold text-slate-900 dark:text-white">Ambil Langsung di Toko / Gudang</p>
                            <p className="text-[11px] text-slate-500 dark:text-slate-400 mt-0.5">Pesanan disiapkan untuk diambil mandiri oleh pembeli (Cash & Carry). Ongkos kirim otomatis Rp 0.</p>
                          </div>
                        </motion.div>
                      )}
                    </AnimatePresence>

                    {/* ── KEMASAN & PACKING EKSPEDISI (BOM & AUTO POLYMAILER) ── */}
                    <div className="rounded-2xl p-4 space-y-3 bg-amber-50/60 dark:bg-amber-950/20 border border-amber-200/80 dark:border-amber-500/20">
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-2">
                          <span className="text-lg">📦</span>
                          <div>
                            <p className="text-xs font-black text-slate-900 dark:text-white">
                              Kemasan & Packing Ekspedisi
                            </p>
                            <p className="text-[11px] text-slate-500 dark:text-slate-400">
                              {packingType === 'kardus' 
                                ? `Kardus Master Box (Kapasitas ~24 pouch / box, Total: ${totalPouchesCount} pouch)` 
                                : packingType === 'polymailer_hitam' 
                                ? `Otomatis 1 Polymailer per 1–4 pouch (Total: ${totalPouchesCount} pouch)` 
                                : 'Pengambilan langsung tanpa kemasan pelindung'}
                            </p>
                          </div>
                        </div>
                        <span className="px-2.5 py-1 rounded-xl text-xs font-black bg-amber-500 text-slate-950 shadow-sm">
                          {effectivePackingQty} pcs {packingType === 'kardus' ? 'Kardus' : packingType === 'none' ? 'Kemasan' : 'Plastik'}
                        </span>
                      </div>

                      {/* Option chips */}
                      <div className="grid grid-cols-3 gap-2 pt-1">
                        <button
                          type="button"
                          onClick={() => { setPackingType('polymailer_hitam'); setCustomPackingQty(''); }}
                          className={`p-2.5 rounded-xl border text-left text-xs font-bold transition-all cursor-pointer ${
                            packingType === 'polymailer_hitam' && customPackingQty === ''
                              ? 'bg-slate-900 dark:bg-white text-white dark:text-slate-900 border-slate-900 dark:border-white shadow-sm'
                              : 'bg-white dark:bg-white/5 text-slate-700 dark:text-slate-300 border-slate-200 dark:border-white/10 hover:border-amber-500/40'
                          }`}
                        >
                          <p className="text-[11px] font-black">✉️ Polymailer Hitam</p>
                          <p className="text-[10px] opacity-75 mt-0.5">Auto ({autoPolymailerQty} pcs)</p>
                        </button>

                        <button
                          type="button"
                          onClick={() => { setPackingType('kardus'); setCustomPackingQty(''); }}
                          className={`p-2.5 rounded-xl border text-left text-xs font-bold transition-all cursor-pointer ${
                            packingType === 'kardus'
                              ? 'bg-slate-900 dark:bg-white text-white dark:text-slate-900 border-slate-900 dark:border-white shadow-sm'
                              : 'bg-white dark:bg-white/5 text-slate-700 dark:text-slate-300 border-slate-200 dark:border-white/10 hover:border-amber-500/40'
                          }`}
                        >
                          <p className="text-[11px] font-black">📦 Kardus Box</p>
                          <p className="text-[10px] opacity-75 mt-0.5">Auto ({autoKardusQty || 1} pcs)</p>
                        </button>

                        <button
                          type="button"
                          onClick={() => { setPackingType('none'); setCustomPackingQty('0'); }}
                          className={`p-2.5 rounded-xl border text-left text-xs font-bold transition-all cursor-pointer ${
                            packingType === 'none'
                              ? 'bg-slate-900 dark:bg-white text-white dark:text-slate-900 border-slate-900 dark:border-white shadow-sm'
                              : 'bg-white dark:bg-white/5 text-slate-700 dark:text-slate-300 border-slate-200 dark:border-white/10 hover:border-amber-500/40'
                          }`}
                        >
                          <p className="text-[11px] font-black">🚫 Tanpa Kemasan</p>
                          <p className="text-[10px] opacity-75 mt-0.5">Ambil Langsung</p>
                        </button>
                      </div>

                      {/* Custom quantity input with steppers */}
                      {packingType !== 'none' && (
                        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 pt-2 border-t border-amber-200/60 dark:border-amber-500/20 text-xs">
                          <div>
                            <span className="text-[11px] font-bold text-slate-800 dark:text-slate-200">
                              {packingType === 'kardus' ? 'Jumlah Kardus Box Digunakan:' : 'Jumlah Plastik Polymailer Digunakan:'}
                            </span>
                            <p className="text-[10px] text-slate-500 dark:text-slate-400">
                              * Otomatis memotong stok gudang saat transaksi disimpan
                            </p>
                          </div>
                          <div className="flex items-center gap-1.5 self-end sm:self-auto">
                            {customPackingQty !== '' && (
                              <button
                                type="button"
                                onClick={() => setCustomPackingQty('')}
                                className="px-2 py-1 text-[10px] font-bold rounded-lg bg-amber-100 dark:bg-amber-900/40 text-amber-800 dark:text-amber-300 border border-amber-300 dark:border-amber-700/50 hover:bg-amber-200"
                              >
                                ↺ Reset ({defaultPackingQty})
                              </button>
                            )}
                            <button
                              type="button"
                              onClick={() => {
                                const current = Number(customPackingQty !== '' ? customPackingQty : defaultPackingQty)
                                setCustomPackingQty(String(Math.max(0, current - 1)))
                              }}
                              className="w-8 h-8 rounded-lg bg-white dark:bg-white/10 border border-slate-300 dark:border-white/20 text-slate-800 dark:text-white font-black hover:bg-slate-100 flex items-center justify-center cursor-pointer active:scale-95"
                            >
                              -
                            </button>
                            <input
                              type="number"
                              min="0"
                              value={customPackingQty !== '' ? customPackingQty : defaultPackingQty}
                              onChange={e => setCustomPackingQty(e.target.value)}
                              className="w-14 text-center h-8 rounded-lg bg-white dark:bg-white/5 border border-slate-200 dark:border-white/10 text-xs font-black text-slate-900 dark:text-white"
                            />
                            <button
                              type="button"
                              onClick={() => {
                                const current = Number(customPackingQty !== '' ? customPackingQty : defaultPackingQty)
                                setCustomPackingQty(String(current + 1))
                              }}
                              className="w-8 h-8 rounded-lg bg-white dark:bg-white/10 border border-slate-300 dark:border-white/20 text-slate-800 dark:text-white font-black hover:bg-slate-100 flex items-center justify-center cursor-pointer active:scale-95"
                            >
                              +
                            </button>
                            <span className="text-[11px] font-bold text-slate-500">pcs</span>
                          </div>
                        </div>
                      )}

                      {/* Live Running Total in Step 2 */}
                      <div className="p-3.5 rounded-2xl bg-slate-50 dark:bg-white/5 border border-slate-200/80 dark:border-white/10 space-y-1.5 text-xs mt-3">
                        <div className="flex justify-between items-center text-slate-600 dark:text-slate-400">
                          <span>Subtotal Produk:</span>
                          <span className="font-bold text-slate-900 dark:text-white">{formatIDR(productSubtotal)}</span>
                        </div>
                        <div className="flex justify-between items-center text-slate-600 dark:text-slate-400">
                          <span>Ongkos Kirim Nota Pelanggan:</span>
                          <span className={`font-bold ${
                            shippingBorneBy === 'buyer' && effectiveCustomerDelivery > 0
                              ? 'text-indigo-600 dark:text-indigo-400' 
                              : 'text-emerald-600 dark:text-emerald-400'
                          }`}>
                            {shippingBorneBy === 'buyer' && effectiveCustomerDelivery > 0 
                              ? `+${formatIDR(effectiveCustomerDelivery)} (${deliveryMethod === 'kurir_toko' ? 'Kurir Toko • Profit Toko' : 'Ekspedisi • Titipan Ongkir'})` 
                              : '🎁 Bebas Ongkir (Ditanggung Penjual)'}
                          </span>
                        </div>
                        {shippingBorneBy === 'seller' && effectiveSellerShippingExpense > 0 && (
                          <div className="flex justify-between items-center text-amber-700 dark:text-amber-400 text-[11px]">
                            <span>Beban Ongkir Toko (Potong Laba):</span>
                            <span className="font-bold">-{formatIDR(effectiveSellerShippingExpense)}</span>
                          </div>
                        )}
                        <div className="flex justify-between items-center pt-1.5 border-t border-slate-200/60 dark:border-white/10 font-black text-slate-900 dark:text-white">
                          <span>Total Tagihan Sementara:</span>
                          <span className="font-mono text-sm text-sky-600 dark:text-sky-400">{formatIDR(totalAmount)}</span>
                        </div>
                      </div>
                    </div>
                  </>
                )}

                {/* ════════════════════════════════════════
                    STEP 3 — Summary & Payment (Review Only)
                ════════════════════════════════════════ */}
                {step === 3 && (
                  <>
                    {!custId && (
                      <div className="p-3.5 rounded-2xl bg-red-500/10 border border-red-500/30 text-xs text-red-600 dark:text-red-400 flex items-center justify-between">
                        <div className="flex items-center gap-2 min-w-0">
                          <AlertCircle size={18} className="shrink-0 text-red-500" />
                          <span className="font-bold">Toko belum dipilih!</span>
                        </div>
                        <button
                          type="button"
                          onClick={() => setStep(0)}
                          className="px-3 py-1.5 bg-red-600 text-white rounded-xl font-bold text-xs shrink-0 cursor-pointer"
                        >
                          Pilih Toko
                        </button>
                      </div>
                    )}

                    {/* Summary review card */}
                    <div className="rounded-2xl p-4 sm:p-5 space-y-3.5 bg-white dark:bg-white/5 border border-slate-200/90 dark:border-white/10 shadow-xs">
                      {/* Header */}
                      <div className="flex items-center justify-between pb-2.5 border-b border-slate-100 dark:border-white/10">
                        <div className="flex items-center gap-2">
                          <span className="text-base">📋</span>
                          <span className="text-xs font-black text-slate-800 dark:text-white uppercase tracking-wider">
                            Ringkasan Tagihan
                          </span>
                        </div>
                        <button
                          type="button"
                          onClick={() => setStep(2)}
                          className="inline-flex items-center gap-1 text-[11px] font-bold text-blue-600 dark:text-blue-400 hover:text-blue-700 bg-blue-50 dark:bg-blue-950/50 px-2.5 py-1 rounded-lg border border-blue-200/60 dark:border-blue-800/40 cursor-pointer transition-all active:scale-95"
                        >
                          <span>✏️ Ubah Pengiriman</span>
                        </button>
                      </div>

                      {/* Meta Pills (Customer, Qty, Packaging, Method, Stock Source) */}
                      <div className="grid grid-cols-2 gap-2 text-xs">
                        <div className="p-2.5 rounded-xl bg-slate-50 dark:bg-white/5 border border-slate-200/60 dark:border-white/5 space-y-0.5">
                          <p className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Pelanggan</p>
                          <p className="font-black text-slate-900 dark:text-white truncate">
                            {selectedCust?.customer_name || 'Pelanggan Tunai'}
                          </p>
                        </div>

                        <div className="p-2.5 rounded-xl bg-slate-50 dark:bg-white/5 border border-slate-200/60 dark:border-white/5 space-y-0.5">
                          <p className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Total Pesanan</p>
                          <p className="font-black text-slate-900 dark:text-white">
                            {items.filter(i => i.product_id).length} Item ({totalPouchesCount} pouch)
                          </p>
                        </div>

                        <div className="p-2.5 rounded-xl bg-slate-50 dark:bg-white/5 border border-slate-200/60 dark:border-white/5 space-y-0.5">
                          <p className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Sumber Stok Fisik</p>
                          <p className="font-black text-slate-900 dark:text-white truncate flex items-center gap-1.5">
                            {stockSource === 'warehouse' ? (
                              <span className="text-amber-600 dark:text-amber-400 flex items-center gap-1 truncate">
                                <Building2 size={13} className="shrink-0" /> <span className="truncate">Gudang Utama</span>
                              </span>
                            ) : (
                              <span className="text-emerald-600 dark:text-emerald-400 flex items-center gap-1 truncate">
                                <Truck size={13} className="shrink-0" /> <span className="truncate">Dibawa {employees.find(e => e.id === stockEmployeeId)?.full_name || 'Tim Lapangan'}</span>
                              </span>
                            )}
                          </p>
                        </div>

                        <div className="p-2.5 rounded-xl bg-slate-50 dark:bg-white/5 border border-slate-200/60 dark:border-white/5 space-y-0.5">
                          <p className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Kemasan Ekspedisi</p>
                          <p className="font-black text-slate-900 dark:text-white truncate">
                            {effectivePackingQty > 0 
                              ? `${effectivePackingQty}x ${packingType === 'kardus' ? 'Kardus Box' : 'Polymailer'}`
                              : 'Tanpa Kemasan'}
                          </p>
                        </div>

                        <div className="p-2.5 rounded-xl bg-slate-50 dark:bg-white/5 border border-slate-200/60 dark:border-white/5 space-y-0.5 col-span-2">
                          <p className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Metode Pengiriman</p>
                          <p className="font-black text-slate-900 dark:text-white truncate">
                            {deliveryMethod === 'ekspedisi' ? '📦 Ekspedisi / Cargo' : deliveryMethod === 'kurir_toko' ? '🛵 Kurir Toko' : '🏪 Ambil Sendiri'}
                          </p>
                        </div>
                      </div>

                      {/* Billing Line Items */}
                      <div className="pt-2 border-t border-slate-100 dark:border-white/10 space-y-2 text-xs">
                        <div className="flex justify-between items-center text-slate-600 dark:text-slate-400">
                          <span>Subtotal Produk</span>
                          <span className="font-bold text-slate-900 dark:text-white">{formatIDR(productSubtotal)}</span>
                        </div>

                        <div className="flex justify-between items-center text-slate-600 dark:text-slate-400">
                          <span>Ongkos Kirim</span>
                          {shippingBorneBy === 'buyer' && effectiveCustomerDelivery > 0 ? (
                            <span className="font-bold text-slate-900 dark:text-white">
                              +{formatIDR(effectiveCustomerDelivery)} <span className="text-[10px] font-normal text-slate-400 dark:text-slate-500">({deliveryMethod === 'kurir_toko' ? 'Kurir Toko • Profit' : 'Ditanggung Pembeli'})</span>
                            </span>
                          ) : (
                            <span className="font-black text-emerald-600 dark:text-emerald-400 bg-emerald-50 dark:bg-emerald-950/60 px-2 py-0.5 rounded-md border border-emerald-200/70 dark:border-emerald-800/40">
                              🎁 GRATIS ({shippingBorneBy === 'seller' ? 'Ditanggung Penjual' : 'Rp 0'})
                            </span>
                          )}
                        </div>
                      </div>

                      {/* Grand Total Box (High Contrast & Explicit Inline Colors) */}
                      <div 
                        className="rounded-xl p-3.5 flex justify-between items-center shadow-md transition-all"
                        style={{ 
                          background: '#0F172A', 
                          border: '1px solid #1E293B' 
                        }}
                      >
                        <div>
                          <p className="text-[10px] font-black uppercase tracking-widest" style={{ color: '#94A3B8' }}>
                            Total Tagihan Pelanggan
                          </p>
                          <p className="text-xs font-medium mt-0.5" style={{ color: '#E2E8F0' }}>
                            {effectiveCustomerDelivery === 0 ? '🎁 Termasuk Bebas Ongkir' : 'Subtotal + Ongkos Kirim'}
                          </p>
                        </div>
                        <div className="text-right">
                          <span 
                            className="text-xl font-black font-mono tracking-tight"
                            style={{ color: '#38BDF8' }}
                          >
                            {formatIDR(totalAmount)}
                          </span>
                        </div>
                      </div>

                      {/* Internal Estimasi HPP & Laba Breakdown */}
                      <div className="pt-2 border-t border-slate-100 dark:border-white/10 space-y-1 text-[11px]">
                        <div className="flex justify-between items-center text-slate-500 dark:text-slate-400 font-medium">
                          <span>ℹ️ Estimasi HPP Pokok Produk (BOM):</span>
                          <span className="font-bold text-slate-700 dark:text-slate-300">{formatIDR(totalCogs)}</span>
                        </div>
                        {shippingBorneBy === 'seller' && effectiveSellerShippingExpense > 0 && (
                          <div className="flex justify-between items-center text-amber-700 dark:text-amber-400 font-medium">
                            <span>🚚 Beban Ongkir Toko (Free Ongkir):</span>
                            <span className="font-bold">-{formatIDR(effectiveSellerShippingExpense)}</span>
                          </div>
                        )}
                        {otherCost > 0 && (
                          <div className="flex justify-between items-center text-slate-500 dark:text-slate-400 font-medium">
                            <span>⛽ Biaya Operasional Toko:</span>
                            <span className="font-bold">-{formatIDR(otherCost)}</span>
                          </div>
                        )}
                      </div>
                    </div>

                    {/* Profit preview card with Inline Biaya Operasional Setting */}
                    <div
                      className="rounded-2xl p-4 space-y-3.5"
                      style={{
                        background: netProfit >= 0 ? 'rgba(16, 185, 129,0.08)' : 'rgba(239,68,68,0.05)',
                        border: `1px solid ${netProfit >= 0 ? 'rgba(16, 185, 129,0.25)' : 'rgba(239,68,68,0.2)'}`,
                      }}
                    >
                      <div className="flex items-end justify-between">
                        <div>
                          <p className="text-[9px] font-black uppercase tracking-widest mb-1" style={{ color: netProfit >= 0 ? '#10B981' : '#EF4444' }}>
                            Estimasi Net Profit
                          </p>
                          <p className="text-2xl font-black" style={{ color: netProfit >= 0 ? '#10B981' : '#EF4444', fontFamily: 'Sora' }}>
                            {formatIDR(netProfit)}
                          </p>
                        </div>
                        <div
                          className="px-3 py-1.5 rounded-full text-xs font-black"
                          style={{ background: netProfit >= 0 ? 'rgba(16, 185, 129,0.15)' : 'rgba(239,68,68,0.15)', color: netProfit >= 0 ? '#10B981' : '#EF4444' }}
                        >
                          Net Margin {netMarginPct}%
                        </div>
                      </div>

                      <div className="grid grid-cols-2 gap-2 text-[11px] pt-1 border-t border-emerald-500/20">
                        <div>
                          <span style={{ color: MUTED }}>
                            {deliveryProfit > 0 ? 'Gross Profit (+Ongkir Kurir)' : 'Gross Profit (Subtotal - HPP)'}
                          </span>
                          <p className="font-black mt-0.5" style={{ color: grossProfit >= 0 ? '#10B981' : '#EF4444' }}>
                            {formatIDR(grossProfit)} {deliveryProfit > 0 ? (
                              <span className="text-[9px] font-bold text-emerald-600 dark:text-emerald-400">
                                (+{formatIDR(deliveryProfit)} Ongkir)
                              </span>
                            ) : totalCogs === 0 && (
                              <span className="text-[9px] font-normal text-amber-400/80">(HPP Rp 0)</span>
                            )}
                          </p>
                        </div>

                        <div>
                          <div className="flex items-center justify-between">
                            <span style={{ color: MUTED }}>
                              {shippingBorneBy === 'seller' && effectiveSellerShippingExpense > 0 ? 'Beban Ongkir & Ops Toko' : 'Biaya Operasional Toko'}
                            </span>
                            <button
                              type="button"
                              onClick={() => setShowOtherCostSetting(v => !v)}
                              className="text-[10px] font-bold text-emerald-700 dark:text-emerald-400 hover:underline cursor-pointer"
                            >
                              {showOtherCostSetting ? 'Tutup ✕' : '✏️ Atur'}
                            </button>
                          </div>
                          <p className="font-black mt-0.5" style={{ color: effectiveOtherCost > 0 ? '#EF4444' : '#64748B' }}>
                            {effectiveOtherCost > 0 ? `-${formatIDR(effectiveOtherCost)}` : 'Rp 0 (Tidak Ada)'}
                          </p>
                        </div>
                      </div>

                      {/* Interactive Biaya Operasional Settings Panel */}
                      <AnimatePresence>
                        {showOtherCostSetting && (
                          <motion.div
                            initial={{ opacity: 0, height: 0 }}
                            animate={{ opacity: 1, height: 'auto' }}
                            exit={{ opacity: 0, height: 0 }}
                            className="pt-2 border-t border-emerald-500/20 space-y-2.5 overflow-hidden"
                          >
                            <div className="flex items-center justify-between">
                              <label className="text-[11px] font-black text-slate-800 dark:text-slate-200">
                                Setting Nominal Biaya Operasional Toko
                              </label>
                              <span className="text-[10px] font-bold text-slate-500">
                                (Bensin, Parkir, Makan, Tips)
                              </span>
                            </div>

                            {/* Input Rupiah */}
                            <InputRupiah
                              id="step3-other-cost-input"
                              value={otherCost}
                              onChange={setOtherCost}
                            />

                            {/* Quick presets */}
                            <div className="flex flex-wrap items-center gap-1">
                              <button
                                type="button"
                                onClick={() => { setOtherCost(0); setSelectedCostChips([]); }}
                                className={`px-2 py-1 rounded-lg text-[10px] font-bold border transition-all cursor-pointer ${
                                  otherCost === 0
                                    ? 'bg-emerald-600 text-white border-emerald-600 shadow-xs'
                                    : 'bg-white dark:bg-white/5 text-slate-600 dark:text-slate-300 border-slate-200 dark:border-white/10 hover:border-slate-400'
                                }`}
                              >
                                Reset (Rp 0)
                              </button>
                              {[
                                { label: '+2k Parkir', val: 2000, chip: 'Tol / Parkir' },
                                { label: '+5k Bensin', val: 5000, chip: 'BBM / Bensin' },
                                { label: '+10k Makan', val: 10000, chip: 'Uang Makan / Konsumsi' },
                                { label: '+15k Ops', val: 15000, chip: 'Tips / Kuli Bongkar' },
                                { label: '+20k', val: 2000, chip: 'Biaya Lainnya' },
                                { label: '+50k', val: 50000, chip: 'Biaya Lainnya' }
                              ].map(item => (
                                <button
                                  key={item.label}
                                  type="button"
                                  onClick={() => {
                                    setOtherCost(c => Number(c || 0) + item.val)
                                    if (!selectedCostChips.includes(item.chip)) {
                                      setSelectedCostChips(prev => [...prev, item.chip])
                                    }
                                  }}
                                  className="px-2 py-1 rounded-lg text-[10px] font-bold border bg-white dark:bg-white/5 text-slate-700 dark:text-slate-300 border-slate-200 dark:border-white/10 hover:border-emerald-500 cursor-pointer active:scale-95 transition-all"
                                >
                                  {item.label}
                                </button>
                              ))}
                            </div>

                            {/* Category chips */}
                            <div className="space-y-1">
                              <p className="text-[10px] font-bold text-slate-500">Kategori Biaya Operasional:</p>
                              <div className="flex flex-wrap gap-1">
                                {['BBM / Bensin', 'Uang Makan / Konsumsi', 'Tol / Parkir', 'Tips / Kuli Bongkar', 'Biaya Lainnya'].map(chip => {
                                  const active = selectedCostChips.includes(chip)
                                  return (
                                    <button
                                      key={chip}
                                      type="button"
                                      onClick={() => {
                                        setSelectedCostChips(prev =>
                                          active ? prev.filter(c => c !== chip) : [...prev, chip]
                                        )
                                      }}
                                      className={`px-2 py-0.5 rounded-md text-[10px] font-bold border transition-all cursor-pointer ${
                                        active
                                          ? 'bg-slate-900 dark:bg-white text-white dark:text-slate-900 border-slate-900 dark:border-white'
                                          : 'bg-white dark:bg-white/5 text-slate-600 dark:text-slate-300 border-slate-200 dark:border-white/10 hover:border-slate-400'
                                      }`}
                                    >
                                      {chip}
                                    </button>
                                  )
                                })}
                              </div>
                            </div>

                            {/* Optional text notes */}
                            <input
                              type="text"
                              value={otherCostNotes}
                              onChange={e => setOtherCostNotes(e.target.value)}
                              placeholder="Catatan tambahan biaya operasional (opsional)..."
                              className="w-full h-8 px-3 rounded-lg text-xs bg-white dark:bg-white/5 border border-slate-200 dark:border-white/10 text-slate-900 dark:text-white placeholder:text-slate-400"
                            />
                          </motion.div>
                        )}
                      </AnimatePresence>
                    </div>

                    {/* Medium #5: overpayment warning (edit mode only) */}
                    {editId && editSale && (editSale.paid_amount || 0) > totalAmount && (
                      <div
                        className="flex items-start gap-2.5 px-4 py-3 rounded-xl"
                        style={{ background: '#FFFBEB', border: '1px solid #FEF3C7' }}
                      >
                        <span style={{ fontSize: '16px', flexShrink: 0, marginTop: '1px' }}>⚠️</span>
                        <div>
                          <p className="text-xs font-bold" style={{ color: '#D97706' }}>Kelebihan Bayar</p>
                          <p className="text-[11px] mt-0.5" style={{ color: MUTED }}>
                            Toko sudah bayar {formatIDR(editSale.paid_amount || 0)} tapi total baru {formatIDR(totalAmount)}.
                            Sisa kelebihan {formatIDR((editSale.paid_amount || 0) - totalAmount)} — invoice akan ditandai <strong>LUNAS</strong>.
                          </p>
                        </div>
                      </div>
                    )}

                    {/* HPP = 0 warning: profit estimate tidak akurat */}
                    {totalAmount > 0 && totalCogs === 0 && items.some(i => i.product_id) && (
                      <div
                        className="flex items-start gap-2.5 px-4 py-3 rounded-xl"
                        style={{ background: '#FFFBEB', border: '1px solid #FEF3C7' }}
                      >
                        <span style={{ fontSize: '16px', flexShrink: 0, marginTop: '1px' }}>⚠️</span>
                        <div>
                          <p className="text-xs font-bold" style={{ color: '#D97706' }}>HPP / Modal belum terhitung</p>
                          <p className="text-[11px] mt-0.5" style={{ color: MUTED }}>Estimasi profit di atas <strong>belum dikurangi modal beli</strong>. Pastikan produk sudah punya data batch/stok masuk agar HPP otomatis terisi.</p>
                        </div>
                      </div>
                    )}

                    {/* Margin warning for negative margins (RUGI) */}
                    {totalAmount > 0 && netMarginPct < 0 && (
                      <div
                        className="flex items-start gap-2.5 px-4 py-3 rounded-xl"
                        style={{ background: '#FEF2F2', border: '1px solid #FEE2E2' }}
                      >
                        <span style={{ fontSize: '16px', flexShrink: 0, marginTop: '1px' }}>🚨</span>
                        <div>
                          <p className="text-xs font-bold" style={{ color: '#DC2626' }}>PERHATIAN: Transaksi ini RUGI ({netMarginPct}%)</p>
                          <p className="text-[11px] mt-0.5" style={{ color: MUTED }}>Harga jual lebih rendah dari HPP. Periksa harga atau COGS sebelum menyimpan.</p>
                        </div>
                      </div>
                    )}

                    {/* Margin warning for thin margins (0-5%) */}
                    {totalAmount > 0 && totalCogs > 0 && netMarginPct < 5 && netMarginPct >= 0 && (
                      <div
                        className="flex items-start gap-2.5 px-4 py-3 rounded-xl"
                        style={{ background: '#FFFBEB', border: '1px solid #FEF3C7' }}
                      >
                        <span style={{ fontSize: '16px', flexShrink: 0, marginTop: '1px' }}>⚠️</span>
                        <div>
                          <p className="text-xs font-bold" style={{ color: '#D97706' }}>Margin tipis ({netMarginPct}%)</p>
                          <p className="text-[11px] mt-0.5" style={{ color: MUTED }}>Pastikan harga jual sudah benar agar keuntungan optimal</p>
                        </div>
                      </div>
                    )}

                    {/* Operational Cost Preset Chips when otherCost > 0 */}
                    <AnimatePresence>
                      {otherCost > 0 && (
                        <motion.div
                          initial={{ opacity: 0, height: 0 }}
                          animate={{ opacity: 1, height: 'auto' }}
                          exit={{ opacity: 0, height: 0 }}
                          className="space-y-2.5 bg-amber-500/10 p-3.5 rounded-2xl border border-amber-500/20 overflow-hidden"
                        >
                          <div className="flex items-center justify-between">
                            <label className="block text-[9px] font-black text-amber-800 uppercase tracking-[0.12em]">
                              Rincian Operasional Internal Sopir (Pilih Cepat):
                            </label>
                            <span className="text-[9px] font-bold text-amber-700 bg-amber-100 px-2 py-0.5 rounded-full">Internal Saja</span>
                          </div>
                          <div className="flex flex-wrap gap-1.5">
                            {PRESET_OTHER_COST_CATEGORIES.map(cat => {
                              const Icon = cat.Icon
                              const active = selectedCostChips.includes(cat.label)
                              return (
                                <button
                                  key={cat.id}
                                  type="button"
                                  onClick={() => handleToggleCostChip(cat.label)}
                                  className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-bold transition-all border cursor-pointer active:scale-95"
                                  style={{
                                    background: active ? cat.bg : '#FFFFFF',
                                    color: active ? cat.color : '#64748B',
                                    borderColor: active ? cat.border : BORDER,
                                  }}
                                >
                                  <Icon size={13} style={{ color: active ? cat.color : '#94A3B8' }} />
                                  <span>{cat.label}</span>
                                </button>
                              )
                            })}
                          </div>
                          <div>
                            <label className="block text-[9px] font-black text-amber-800 uppercase tracking-[0.12em] mb-1">
                              Catatan Pengeluaran Sopir:
                            </label>
                            <input
                              type="text"
                              value={otherCostNotes}
                              onChange={e => setOtherCostNotes(e.target.value)}
                              placeholder="Contoh: BBM 100k, Uang makan 50k, Tol 20k..."
                              className="w-full h-10 bg-white border border-amber-200 rounded-xl px-3 text-xs text-slate-900 placeholder:text-slate-400 focus:outline-none focus:border-amber-400"
                            />
                          </div>
                        </motion.div>
                      )}
                    </AnimatePresence>

                    {/* Payment section */}
                    <div
                      className="rounded-2xl p-4 space-y-3"
                      style={{ background: '#F0FDF4', border: '1px solid #BBF7D0' }}
                    >
                      <div className="flex items-center justify-between">
                        <label className={labelCn + ' text-[#16A34A] mb-0'}>Pembayaran / Pelunasan</label>
                        {selectedCust?.payment_terms === 'cash' && (
                          <span className="text-[10px] font-black uppercase tracking-wider text-emerald-800 bg-emerald-100 px-2 py-0.5 rounded-full">
                            Pelanggan Cash (Lunas)
                          </span>
                        )}
                      </div>

                      {/* Quick payment presets */}
                      <div className="flex flex-wrap gap-1.5">
                        <button
                          type="button"
                          onClick={() => setPayAmount(totalAmount)}
                          className={`px-2.5 py-1 rounded-lg text-[10.5px] font-bold border transition-all cursor-pointer ${
                            payAmount === totalAmount && totalAmount > 0
                              ? 'bg-emerald-600 text-white border-emerald-600 shadow-xs'
                              : 'bg-white text-emerald-700 border-emerald-300 hover:bg-emerald-50'
                          }`}
                        >
                          ⚡ Bayar Lunas (100% - {formatIDR(totalAmount)})
                        </button>
                        <button
                          type="button"
                          onClick={() => setPayAmount(Math.round(totalAmount * 0.5))}
                          className={`px-2.5 py-1 rounded-lg text-[10.5px] font-bold border transition-all cursor-pointer ${
                            payAmount === Math.round(totalAmount * 0.5) && totalAmount > 0
                              ? 'bg-amber-600 text-white border-amber-600 shadow-xs'
                              : 'bg-white text-amber-700 border-amber-300 hover:bg-amber-50'
                          }`}
                        >
                          50% DP ({formatIDR(Math.round(totalAmount * 0.5))})
                        </button>
                        <button
                          type="button"
                          onClick={() => setPayAmount(0)}
                          className={`px-2.5 py-1 rounded-lg text-[10.5px] font-bold border transition-all cursor-pointer ${
                            payAmount === 0
                              ? 'bg-slate-700 text-white border-slate-700 shadow-xs'
                              : 'bg-white text-slate-600 border-slate-300 hover:bg-slate-50'
                          }`}
                        >
                          Tempo / Belum Bayar (Rp 0)
                        </button>
                      </div>

                      <InputRupiah value={payAmount} onChange={setPayAmount} placeholder="Jumlah bayar..." />

                      <AnimatePresence>
                        {payAmount > 0 && (
                          <motion.div
                            initial={{ opacity: 0, height: 0 }}
                            animate={{ opacity: 1, height: 'auto' }}
                            exit={{ opacity: 0, height: 0 }}
                            className="flex gap-2 overflow-hidden"
                          >
                            {Object.keys(PAY_METHOD_CONFIG).map(m => (
                              <PayMethodButton key={m} method={m} selected={payMethod === m} onClick={() => setPayMethod(m)} />
                            ))}
                          </motion.div>
                        )}
                      </AnimatePresence>
                      <div className="flex justify-between text-[11px] pt-1 border-t border-emerald-200/60">
                        <span style={{ color: MUTED }}>Sisa Piutang</span>
                        <span className="font-black" style={{ color: totalAmount - payAmount > 0 ? '#DC2626' : '#16A34A' }}>
                          {totalAmount - payAmount <= 0 ? '✓ LUNAS (Rp 0)' : formatIDR(totalAmount - payAmount)}
                        </span>
                      </div>
                    </div>

                    {/* Notes */}
                    <div>
                      <label className={labelCn}>Catatan Invoice</label>
                      <textarea
                        rows={2}
                        value={notes}
                        onChange={e => setNotes(e.target.value)}
                        className={inputCn + ' h-20 py-3 resize-none leading-relaxed'}
                        placeholder="Contoh: Titip di satpam, barang diskon..."
                      />
                    </div>
                  </>
                )}
              </motion.div>
            </AnimatePresence>
          </div>

          {/* ── Footer ── */}
          <div
            className="flex gap-3 px-5 pt-4 border-t"
            style={{
              borderColor: BORDER,
              background: BG,
              paddingBottom: 'max(20px, env(safe-area-inset-bottom, 20px))',
            }}
          >
            {step > 0 ? (
              <button
                onClick={() => setStep(s => s - 1)}
                className="flex-1 h-12 rounded-xl flex items-center justify-center gap-2 font-bold text-sm transition-all bg-transparent hover:bg-slate-50 border border-slate-200 text-slate-700"
              >
                <ChevronLeft size={16} /> Kembali
              </button>
            ) : (
              <button
                onClick={handleCancelReset}
                className="flex-1 h-12 rounded-xl font-bold text-sm transition-all text-rose-600 hover:bg-rose-50 border border-rose-200"
                style={{ color: '#e11d48' }}
              >
                Batal & Reset
              </button>
            )}

            {step < 3 ? (
              <button
                onClick={goNext}
                className="flex-[2] h-12 rounded-xl font-black text-sm transition-all bg-[#0F172A] text-white hover:bg-slate-900 shadow-sm"
                style={{ color: '#ffffff' }}
              >
                Lanjut →
              </button>
            ) : (
              <button
                onClick={handleSaveInvoice}
                disabled={createSale.isPending || updateSale.isPending}
                className="flex-[2] h-12 rounded-xl font-black text-sm flex items-center justify-center gap-2 transition-all bg-[#0F172A] text-white hover:bg-slate-900"
                style={{
                  color: '#ffffff',
                  opacity: (createSale.isPending || updateSale.isPending) ? 0.6 : 1,
                }}
              >
                {(createSale.isPending || updateSale.isPending)
                  ? <><Loader2 size={18} className="animate-spin" /> Menyimpan...</>
                  : (editId ? 'Simpan Perubahan' : 'Simpan Invoice')
                }
              </button>
            )}
          </div>
        </SheetContent>
      </Sheet>


      <SembakoSuccessCard
        isOpen={!!successData && !printData}
        onClose={() => {
          setSuccessData(null)
          clearInvoiceDraft()
          handleClose()
        }}
        data={successData}
        onPrint={(mode) => { setPrintData(successData); setPrintMode(mode) }}
      />

      {printData && (
        <SembakoInvoicePreview
          data={printData}
          mode={printMode}
          onClose={() => setPrintData(null)}
        />
      )}
    </>
  )
}
