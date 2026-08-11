// =============================================================
// TernakOS — AI Confirm Card (_shared, Phase 2+)
// Lifted from broker/ai/AIConfirmCard — extended for all verticals.
// 3-step flow: (1) resolve entities, (2) review/edit, (3) confirm
// Supports: vertical-aware fields, role-aware modes, undo countdown.
// =============================================================

import React, { useState, useEffect, useRef } from 'react'
import { motion } from 'framer-motion'
import {
  ShoppingCart, TrendingUp, Wallet, Truck,
  AlertTriangle, MessageCircle, Check, X, Loader2,
  Search, Plus, Pencil, AlertCircle, Lock,
  Activity, Package, Shield,
} from 'lucide-react'
import { format } from 'date-fns'

// =============================================================
// INTENT CONFIG — single source of truth for all verticals
// =============================================================
const INTENT_CONFIG = {
  // ── Broker (Poultry) ───────────────────────────────────────
  CATAT_PEMBELIAN:   { label: 'Pembelian Ayam',    Icon: ShoppingCart, color: 'emerald', fields: [] },
  CATAT_PENJUALAN:   { label: 'Penjualan Ayam',    Icon: TrendingUp,   color: 'blue',    fields: [] },
  CATAT_BAYAR:       { label: 'Pencatatan Bayar',   Icon: Wallet,       color: 'amber',   fields: [] },
  CATAT_PENGIRIMAN:  { label: 'Info Pengiriman',    Icon: Truck,        color: 'purple',  fields: [] },
  BUAT_INVOICE:      { label: 'Invoice Baru',       Icon: ShoppingCart, color: 'blue',    fields: [] },
  CATAT_ORDER:       { label: 'Order Baru',         Icon: Truck,        color: 'emerald', fields: [] },
  TAMBAH_PRODUK:     { label: 'Produk Baru',        Icon: ShoppingCart, color: 'amber',   fields: [] },

  // ── Peternak ───────────────────────────────────────────────
  CATAT_HARIAN:      {
    label: 'Catatan Harian', Icon: Activity, color: 'purple',
    fields: ['record_date', 'farm_name', 'avg_weight_kg', 'dead_count', 'culled_count', 'notes'],
  },
  CATAT_PAKAN:       {
    label: 'Catatan Pakan', Icon: Package, color: 'amber',
    fields: ['record_date', 'farm_name', 'feed_type', 'qty_kg', 'price_per_kg', 'action', 'notes'],
  },
  CATAT_PANEN:       {
    label: 'Catatan Panen', Icon: TrendingUp, color: 'emerald',
    fields: ['harvest_date', 'farm_name', 'qty_ekor', 'total_weight_kg', 'price_per_kg', 'buyer_name', 'notes'],
  },
  CATAT_VAKSIN_OBAT: {
    label: 'Vaksin / Obat', Icon: Shield, color: 'blue',
    fields: ['record_date', 'farm_name', 'medicine_name', 'qty', 'unit', 'notes'],
  },
  CATAT_BELI_TERNAK: {
    label: 'Beli Ternak', Icon: ShoppingCart, color: 'emerald',
    fields: ['purchase_date', 'supplier_name', 'qty_ekor', 'avg_weight_kg', 'total_harga', 'notes'],
  },
  CATAT_JUAL_TERNAK: {
    label: 'Jual Ternak', Icon: TrendingUp, color: 'blue',
    fields: ['sale_date', 'customer_name', 'qty_ekor', 'avg_weight_kg', 'total_harga', 'notes'],
  },
  CATAT_PENGELUARAN: {
    label: 'Pengeluaran', Icon: Wallet, color: 'red',
    fields: ['expense_date', 'farm_name', 'category', 'amount', 'description', 'notes'],
  },
  TANYA_DATA:        { label: 'Pertanyaan Data',    Icon: Search,       color: 'purple',  fields: ['query'] },
  KOREKSI:           {
    label: 'Koreksi Data', Icon: Pencil, color: 'amber',
    fields: ['target_intent', 'target_id', 'field_to_correct', 'new_value'],
  },
  TIDAK_DIKENALI:    { label: 'Tidak Dikenali',     Icon: AlertCircle,  color: 'red',     fields: [] },
}

const FIELD_LABELS = {
  // ── Broker fields ──────────────────────────────────────────
  supplier_name: 'Kandang (Supplier)',
  rpa_name: 'RPA / MK (Buyer)',
  qty_ekor: 'Jumlah (Ekor)',
  price_per_kg: 'Harga (Rp/kg)',
  weight_kg: 'Total Berat (kg)',
  total_weight_kg: 'Total Berat (kg)',
  purchase_date: 'Tanggal Transaksi',
  sale_date: 'Tanggal Jual',
  payment_date: 'Tgl Bayar',
  payer_name: 'Yang Bayar',
  amount: 'Nominal',
  payment_method: 'Metode Bayar',
  driver_name: 'Sopir',
  vehicle_plate: 'Kendaraan Armada',
  departure_time: 'Jam Berangkat',
  departed_at: 'Jam Berangkat',
  arrived_at: 'Jam Tiba',
  initial_weight_kg: 'Berat Awal',
  arrived_weight_kg: 'Berat Tiba',
  farm_name: 'Kandang',
  record_date: 'Tanggal',
  dead_count: 'Jumlah Mati',
  culled_count: 'Afkir',
  avg_weight_kg: 'Bobot Rata²',
  feed_type: 'Jenis Pakan',
  qty_kg: 'Jumlah (kg)',
  harvest_date: 'Tgl Panen',
  buyer_name: 'Pembeli',
  category: 'Kategori',
  description: 'Keterangan',
  customer_name: 'Customer',
  invoice_date: 'Tgl Invoice',
  items: 'Item',
  broker_name: 'Broker',
  order_date: 'Tgl Order',
  needed_date: 'Dibutuhkan',
  target_weight_kg: 'Target Berat',
  name: 'Nama',
  unit: 'Satuan',
  sell_price: 'Harga Jual',
  notes: 'Catatan Tambahan',
  expense_date: 'Tgl Pengeluaran',
  transport_cost: 'Ongkos Angkut',
  other_cost: 'Biaya Lain',
  delivery_cost: 'Total Biaya Pengiriman',
  payment_status: 'Status Bayar',
  paid_amount: 'Sudah Dibayar',
  due_date: 'Jatuh Tempo',
  load_time: 'Jam Muat',
  // ── Peternak fields (new) ──────────────────────────────────
  medicine_name: 'Nama Obat/Vitamin',
  source: 'Sumber/Toko',
  target_intent: 'Jenis Data yang Dikoreksi',
  target_id: 'ID Data Target',
  field_to_correct: 'Field yang Salah',
  new_value: 'Nilai Baru',
  qty: 'Jumlah',
  total_harga: 'Total Harga',
  deplesi_persen: 'Deplesi (%)',
  kandang_id: 'Kandang',
  action: 'Aksi',
  jumlah: 'Jumlah (Rp)',
  keterangan: 'Keterangan',
  kategori: 'Kategori',
  query: 'Pertanyaan',
  answer: 'Jawaban',
}

const FIELD_OPTIONS = {
  payment_status: [
    { value: 'belum_lunas', label: 'BELUM LUNAS' },
    { value: 'sebagian', label: 'SEBAGIAN' },
    { value: 'lunas', label: 'LUNAS' },
  ],
  payment_method: [
    { value: 'transfer', label: 'TRANSFER BANK' },
    { value: 'cash', label: 'TUNAI (CASH)' },
    { value: 'giro', label: 'GIRO / CEK' },
    { value: 'qris', label: 'QRIS' },
  ],
  action: [
    { value: 'beli', label: 'BELI' },
    { value: 'pakai', label: 'PAKAI' },
  ],
  category: [
    { value: 'doc', label: 'DOC' },
    { value: 'obat', label: 'OBAT' },
    { value: 'vaksin', label: 'VAKSIN' },
    { value: 'listrik', label: 'LISTRIK' },
    { value: 'tenaga_kerja', label: 'TENAGA KERJA' },
    { value: 'lainnya', label: 'LAINNYA' },
  ],
}

const NUMBER_FIELDS = new Set([
  'qty_ekor', 'price_per_kg', 'weight_kg', 'total_weight_kg', 'amount',
  'initial_weight_kg', 'arrived_weight_kg', 'dead_count', 'culled_count',
  'avg_weight_kg', 'qty_kg', 'sell_price', 'target_weight_kg',
  'transport_cost', 'other_cost', 'delivery_cost', 'paid_amount',
  'qty', 'total_harga', 'jumlah',
])

const DATE_FIELDS = new Set([
  'purchase_date', 'sale_date', 'payment_date', 'record_date', 'harvest_date',
  'invoice_date', 'order_date', 'expense_date', 'needed_date', 'due_date',
])

const TIME_FIELDS = new Set([
  'load_time', 'departure_time', 'departed_at', 'arrived_at',
])

const READONLY_FIELDS = new Set(['items'])

// =============================================================
// CORE_BY_INTENT — ordered field keys per intent
// =============================================================
const CORE_BY_INTENT = {
  CATAT_PEMBELIAN:   ['supplier_name', 'farm_name', 'purchase_date', 'qty_ekor', 'avg_weight_kg', 'total_weight_kg', 'price_per_kg', 'notes'],
  CATAT_PENJUALAN:   ['rpa_name', 'sale_date', 'qty_ekor', 'avg_weight_kg', 'total_weight_kg', 'price_per_kg', 'payment_status', 'paid_amount', 'due_date', 'notes'],
  CATAT_PENGIRIMAN:  ['vehicle_plate', 'driver_name', 'load_time', 'departure_time', 'initial_weight_kg', 'delivery_cost', 'notes'],
  CATAT_HARIAN:      ['record_date', 'farm_name', 'avg_weight_kg', 'dead_count', 'culled_count', 'notes'],
  CATAT_PAKAN:       ['record_date', 'farm_name', 'feed_type', 'qty_kg', 'price_per_kg', 'action', 'notes'],
  CATAT_PANEN:       ['harvest_date', 'farm_name', 'qty_ekor', 'total_weight_kg', 'price_per_kg', 'buyer_name', 'notes'],
  CATAT_VAKSIN_OBAT: ['record_date', 'farm_name', 'medicine_name', 'qty', 'unit', 'notes'],
  CATAT_BELI_TERNAK: ['purchase_date', 'supplier_name', 'qty_ekor', 'avg_weight_kg', 'total_harga', 'notes'],
  CATAT_JUAL_TERNAK: ['sale_date', 'customer_name', 'qty_ekor', 'avg_weight_kg', 'total_harga', 'notes'],
  CATAT_PENGELUARAN: ['expense_date', 'farm_name', 'category', 'amount', 'description', 'notes'],
  TANYA_DATA:        ['query'],
  KOREKSI:           ['target_intent', 'target_id', 'field_to_correct', 'new_value'],
  TIDAK_DIKENALI:    [],
}

// =============================================================
// HELPERS
// =============================================================
function formatValue(key, value) {
  if (value === null || value === undefined) {
    if (DATE_FIELDS.has(key)) return <span className="text-amber-500 font-bold italic">Tgl Belum Set</span>
    if (TIME_FIELDS.has(key)) return <span className="text-amber-500 font-bold italic">Jam Belum Set</span>
    if (NUMBER_FIELDS.has(key)) return <span className="text-emerald-500/70 font-bold text-right">0</span>
    return <span className="text-white/30 italic font-medium">Belum diisi</span>
  }
  if (key === 'payment_status') {
    const statusMap = {
      lunas: <span className="text-emerald-400 font-black tracking-tighter">LUNAS</span>,
      belum_lunas: <span className="text-red-400 font-black tracking-tighter">BELUM LUNAS</span>,
      sebagian: <span className="text-amber-400 font-black tracking-tighter">SEBAGIAN</span>,
    }
    return statusMap[value] || <span className="uppercase font-bold text-white/70">{String(value).replace('_', ' ')}</span>
  }
  if (key === 'payment_method') {
    const methodMap = { transfer: 'Transfer', cash: 'Tunai', giro: 'Giro / Cek', qris: 'QRIS' }
    return <span className="text-white font-bold">{methodMap[value] || value}</span>
  }
  if (TIME_FIELDS.has(key)) return String(value).slice(0, 5)
  if (/price|amount|cost|sell_price|revenue|paid_amount|delivery_cost|total_harga|jumlah/.test(key) && typeof value === 'number') return `Rp ${value.toLocaleString('id-ID')}`
  if (/qty_ekor|count/.test(key) && typeof value === 'number') return `${value.toLocaleString('id-ID')} ekor`
  if (/weight|qty_kg/.test(key) && typeof value === 'number') return `${value.toLocaleString('id-ID')} kg`
  if (DATE_FIELDS.has(key) && (typeof value === 'string' || value instanceof Date)) {
    try { const d = new Date(value); if (!isNaN(d.getTime())) return format(d, 'dd MMM yyyy') } catch { /* ignore invalid date */ }
  }
  if (Array.isArray(value)) return `${value.length} item`
  return String(value)
}

const colorMap = {
  emerald: { bg: 'bg-emerald-500/10', border: 'border-emerald-500/20', text: 'text-emerald-400' },
  blue:    { bg: 'bg-blue-500/10',    border: 'border-blue-500/20',    text: 'text-blue-400' },
  amber:   { bg: 'bg-amber-500/10',   border: 'border-amber-500/20',   text: 'text-amber-400' },
  purple:  { bg: 'bg-purple-500/10',  border: 'border-purple-500/20',  text: 'text-purple-400' },
  red:     { bg: 'bg-red-500/10',     border: 'border-red-500/20',     text: 'text-red-400' },
}

// Controls which fields are visible based on vertical
function getVisibleFields(intentName, allKeys, vertical) {
  if (intentName === 'CATAT_HARIAN') {
    if (vertical === 'sapi_penggemukan' || vertical === 'domba_penggemukan') {
      return allKeys.filter(k => k !== 'deplesi_persen')
    }
    if (vertical === 'broiler') {
      return allKeys.filter(k => k !== 'avg_weight_kg')
    }
  }
  return allKeys
}

// 1-line summary for ABK mode
function getAbkSummary(intent, data = {}) {
  const rp = v => (v != null && v !== '') ? `Rp${Number(v).toLocaleString('id-ID')}` : null
  const kg = v => (v != null && v !== '') ? `${v} kg` : null
  switch (intent) {
    case 'CATAT_HARIAN':
      return [data.farm_name, kg(data.avg_weight_kg), data.dead_count != null ? `mati: ${data.dead_count}` : null].filter(Boolean).join(' · ') || '—'
    case 'CATAT_PAKAN':
      return [data.feed_type, kg(data.qty_kg), data.farm_name].filter(Boolean).join(' · ') || '—'
    case 'CATAT_VAKSIN_OBAT':
      return [data.medicine_name, data.qty != null ? `${data.qty}${data.unit || ''}` : null, data.farm_name].filter(Boolean).join(' · ') || '—'
    case 'CATAT_BELI_TERNAK':
      return [data.qty_ekor != null ? `${data.qty_ekor} ekor` : null, kg(data.avg_weight_kg), rp(data.total_harga)].filter(Boolean).join(' · ') || '—'
    case 'CATAT_JUAL_TERNAK':
      return [data.qty_ekor != null ? `${data.qty_ekor} ekor` : null, rp(data.total_harga)].filter(Boolean).join(' · ') || '—'
    case 'CATAT_PENGELUARAN':
      return [data.category || data.kategori, rp(data.amount || data.jumlah)].filter(Boolean).join(' · ') || '—'
    case 'KOREKSI':
      return `Koreksi ${(data.target_intent || '').replace('CATAT_', '') || '?'} — ${data.field_to_correct || '?'}`
    default:
      return intent.replace(/^CATAT_/, '').replace(/_/g, ' ')
  }
}

// =============================================================
// InlineEditField — tap to edit, with dirty indicator
// =============================================================
function InlineEditField({ fieldKey, value, isDirty, onEdit, options }) {
  const [editing, setEditing] = useState(false)
  const [tempValue, setTempValue] = useState('')
  const isNumber = NUMBER_FIELDS.has(fieldKey)
  const isDate = DATE_FIELDS.has(fieldKey)
  const isTime = TIME_FIELDS.has(fieldKey)
  const isCurrency = /price|amount|cost|sell_price|revenue|paid_amount|delivery_cost|total_harga|jumlah/.test(fieldKey)
  const isReadonly = READONLY_FIELDS.has(fieldKey)
  const normalizedValue = options && value ? String(value).toLowerCase() : value

  if (isReadonly) {
    return <span className="text-[12px] font-bold text-[#F1F5F9] text-right truncate">{formatValue(fieldKey, value)}</span>
  }

  const formatInput = (val) => {
    if (!isCurrency || !val) return val
    const num = String(val).replace(/\D/g, '')
    return num ? Number(num).toLocaleString('id-ID') : ''
  }

  const handleSave = (valOverride) => {
    let rawValue = valOverride !== undefined ? valOverride : tempValue
    let finalValue = rawValue
    if (isNumber) {
      const clean = String(rawValue).replace(/\D/g, '')
      finalValue = clean ? Number(clean) : null
    }
    onEdit(fieldKey, finalValue)
    setEditing(false)
  }

  if (!editing) {
    return (
      <button
        onClick={() => {
          setEditing(true)
          const raw = value ?? ''
          if (isDate) setTempValue(typeof raw === 'string' ? raw.slice(0, 10) : '')
          else if (isTime) setTempValue(typeof raw === 'string' ? raw.slice(0, 5) : '')
          else if (isCurrency) setTempValue(formatInput(raw))
          else setTempValue(raw)
        }}
        className="group flex items-center gap-1.5 text-right ml-auto min-w-[60px] justify-end"
      >
        <span className={`text-[12px] font-bold text-right truncate ${isDirty ? 'text-amber-300' : 'text-[#F1F5F9]'}`}>
          {formatValue(fieldKey, value) || <span className="text-[#4B6478] italic opacity-50">Ketik...</span>}
        </span>
        <Pencil size={10} className="text-[#4B6478] opacity-0 group-hover:opacity-100 transition-opacity shrink-0" />
        {isDirty && <span className="w-1.5 h-1.5 rounded-full bg-amber-400 shrink-0" />}
      </button>
    )
  }

  if (options) {
    return (
      <select
        autoFocus
        value={normalizedValue || ''}
        onBlur={() => setEditing(false)}
        onChange={(e) => { handleSave(e.target.value); setEditing(false) }}
        className="bg-[#111C24] border border-emerald-500/60 rounded-lg px-2 py-1 text-[11px] font-black text-emerald-400 focus:outline-none uppercase tracking-tighter cursor-pointer hover:bg-emerald-500/5 transition-colors"
      >
        <option value="" disabled>Pilih...</option>
        {options.map(opt => (
          <option key={opt.value} value={opt.value}>{opt.label}</option>
        ))}
      </select>
    )
  }

  return (
    <div className="flex items-center gap-1.5 ml-auto w-full max-w-[140px]">
      <div className="relative flex items-center w-full">
        {isCurrency && (
          <span className="absolute left-2 text-[10px] font-black text-emerald-500/60 pointer-events-none">Rp</span>
        )}
        <input
          autoFocus
          type={isDate ? 'date' : isTime ? 'time' : 'text'}
          value={tempValue}
          placeholder="Ketik..."
          onChange={(e) => {
            const val = e.target.value
            if (isCurrency) setTempValue(formatInput(val))
            else setTempValue(val)
          }}
          onKeyDown={(e) => {
            if (e.key === 'Enter') handleSave()
            if (e.key === 'Escape') setEditing(false)
          }}
          onBlur={() => handleSave()}
          className={`bg-[#0C1319] border border-emerald-500/60 rounded-lg py-1 text-[12px] font-bold text-white focus:outline-none text-right transition-all shadow-[0_0_10px_rgba(2, 26, 2,0.1)] ${isCurrency ? 'pl-7 pr-2 w-full' : 'px-2 w-full'}`}
        />
      </div>
    </div>
  )
}

// =============================================================
// ResolveStep
// =============================================================
function ResolveStep({ entity, totalSteps, currentStep, onResolveEntity }) {
  return (
    <div className="space-y-3">
      {totalSteps > 1 && (
        <p className="text-[9px] font-bold text-[#4B6478]/60 uppercase tracking-widest">
          Langkah {currentStep} dari {totalSteps}
        </p>
      )}
      <div className="flex items-center gap-2.5">
        <div className="w-8 h-8 rounded-xl bg-blue-500/10 border border-blue-500/20 flex items-center justify-center">
          <Search size={15} className="text-blue-400" />
        </div>
        <div>
          <p className="text-[12px] font-black text-white tracking-tight">
            Cari &ldquo;{entity.extractedName}&rdquo;
          </p>
          <p className="text-[10px] font-medium text-[#4B6478] mt-0.5">
            {FIELD_LABELS[entity.nameField] || entity.nameField} — pilih yang sesuai:
          </p>
        </div>
      </div>
      {entity.candidates.length > 0 && (
        <div className="space-y-1.5">
          {entity.candidates.map((candidate) => (
            <button key={candidate.id} type="button"
              onClick={() => onResolveEntity(entity.idField, candidate.id, candidate.name, false)}
              className="w-full flex items-center justify-between gap-2 bg-[#111C24] border border-white/5 hover:border-emerald-500/40 rounded-xl px-3.5 py-2.5 transition-all group active:scale-[0.98]"
            >
              <span className="text-[12px] font-bold text-[#F1F5F9] text-left truncate">{candidate.name}</span>
              <div className="flex items-center gap-2 shrink-0">
                <span className="text-[10px] font-bold text-[#4B6478] tabular-nums">{Math.round(candidate.score * 100)}%</span>
                <span className="text-[10px] font-black text-emerald-400 uppercase tracking-widest opacity-0 group-hover:opacity-100 transition-opacity">Pilih</span>
              </div>
            </button>
          ))}
        </div>
      )}
      <div className="pt-1">
        {entity.candidates.length === 0 && (
          <p className="text-[10px] font-medium text-amber-400/80 mb-1.5">Tidak ditemukan kecocokan.</p>
        )}
        <button type="button"
          onClick={() => onResolveEntity(entity.idField, null, entity.extractedName, true)}
          className="w-full flex items-center justify-center gap-1.5 h-9 rounded-xl bg-white/[0.03] border border-dashed border-white/10 hover:border-emerald-500/30 hover:bg-emerald-500/5 text-[11px] font-bold text-[#94A3B8] hover:text-emerald-400 transition-all"
        >
          <Plus size={13} /> Buat baru: &ldquo;{entity.extractedName}&rdquo;
        </button>
      </div>
    </div>
  )
}

// =============================================================
// Main: AIConfirmCard
// =============================================================
export default function AIConfirmCard({
  pendingEntry,
  queuePosition = 1,
  queueTotal = 1,
  onConfirm,
  onReject,
  onEdit,
  isLoading,
  unresolvedEntities = [],
  onResolveEntity,
  isLocked = false,
  parentIntent = null,
  // ── New props ─────────────────────────────────────────────
  vertical = 'generic',
  userRole = 'owner',
  onCommit,           // optional: enables 8s countdown before commit
}) {
  // Hooks must be declared before any early return
  const [step, setStep] = useState(unresolvedEntities.length > 0 ? 'resolve' : 'confirm')
  const [pendingCommit, setPendingCommit] = useState(false)
  const timerRef = useRef(null)
  const progressRef = useRef(null)

  useEffect(() => {
    if (unresolvedEntities.length === 0) setStep('confirm')
  }, [unresolvedEntities])

  // Cleanup timer on unmount
  useEffect(() => {
    return () => { if (timerRef.current) clearTimeout(timerRef.current) }
  }, [])

  // Animate progress bar when pendingCommit toggles
  useEffect(() => {
    const el = progressRef.current
    if (!el) return
    if (pendingCommit) {
      el.style.transition = 'none'
      el.style.width = '100%'
      requestAnimationFrame(() => {
        requestAnimationFrame(() => {
          el.style.transition = 'width 8000ms linear'
          el.style.width = '0%'
        })
      })
    } else {
      el.style.transition = 'none'
      el.style.width = '100%'
    }
  }, [pendingCommit])

  // ── Dynamic field options from snapshot — must be before early return ──────
  const dynamicFieldOptions = React.useMemo(() => {
    const snapshot = pendingEntry?._context?.snapshot || {}
    const farmOpts = (snapshot.farms || []).map(f => ({ value: f.name, label: f.name }))
    const rpaOpts  = (snapshot.rpas  || []).map(r => ({ value: r.name, label: r.name }))
    const vehOpts  = (snapshot.vehicles || []).map(v => ({ value: v.name, label: `${v.name}${v.type ? ` · ${v.type}` : ''}` }))
    const drvOpts  = (snapshot.drivers  || []).map(d => ({ value: d.name, label: `${d.name}${d.phone ? ` · ${d.phone}` : ''}` }))
    return {
      ...FIELD_OPTIONS,
      supplier_name: farmOpts,
      farm_name:     farmOpts,
      rpa_name:      rpaOpts,
      vehicle_plate: vehOpts,
      driver_name:   drvOpts,
    }
  }, [pendingEntry])

  if (!pendingEntry) return null

  const config = INTENT_CONFIG[pendingEntry.intent] || { label: pendingEntry.intent, Icon: ShoppingCart, color: 'emerald', fields: [] }
  const { label, Icon, color } = config
  const c = colorMap[color] || colorMap.emerald
  const confidence = pendingEntry.confidence ?? 1
  const isLowConfidence = confidence < 0.8
  const validation = pendingEntry._validation
  const hasDirtyFields = Object.keys(pendingEntry._dirty || {}).length > 0

  const handleConfirmClick = () => {
    if (onCommit) {
      setPendingCommit(true)
      timerRef.current = setTimeout(() => {
        setPendingCommit(false)
        onCommit(pendingEntry.id)
      }, 8000)
    } else {
      onConfirm(pendingEntry.id)
    }
  }

  const handleCancelCommit = () => {
    if (timerRef.current) clearTimeout(timerRef.current)
    timerRef.current = null
    setPendingCommit(false)
  }

  // ── Field visibility ──────────────────────────────────────
  const coreKeys = CORE_BY_INTENT[pendingEntry.intent] || config.fields || []
  const extractedKeys = Object.keys(pendingEntry.extracted_data || {})
  const rawKeys = Array.from(new Set([...coreKeys, ...extractedKeys]))
    .filter(key =>
      !key.endsWith('_id') &&
      !key.endsWith('_is_new') &&
      !key.endsWith('_new_name') &&
      key !== 'id' &&
      FIELD_LABELS[key]
    )
  const allKeys = getVisibleFields(pendingEntry.intent, rawKeys, vertical)

  const dataEntries = allKeys.map(key => [key, (pendingEntry.extracted_data || {})[key]])

  // =============================================================
  // ABK MODE — simplified 1-line summary
  // =============================================================
  if (userRole === 'abk') {
    const summary = getAbkSummary(pendingEntry.intent, pendingEntry.extracted_data || {})
    return (
      <motion.div
        initial={{ opacity: 0, y: 8, scale: 0.97 }}
        animate={{ opacity: 1, y: 0, scale: 1 }}
        exit={{ opacity: 0, y: 8, scale: 0.97 }}
        transition={{ duration: 0.25, ease: 'easeOut' }}
        className="bg-[#111C24] rounded-2xl p-4 space-y-3 border border-white/8"
      >
        <div className="flex items-center gap-2.5">
          <div className={`w-8 h-8 rounded-xl ${c.bg} ${c.border} border flex items-center justify-center shrink-0`}>
            <Icon size={15} className={c.text} />
          </div>
          <div className="flex-1 min-w-0">
            <p className={`text-[11px] font-black uppercase tracking-widest ${c.text}`}>{label}</p>
            <p className="text-[13px] font-bold text-white truncate mt-0.5">{summary}</p>
          </div>
        </div>

        {isLowConfidence && (
          <div className="flex items-center gap-2 bg-amber-500/5 border border-amber-500/15 rounded-xl px-3 py-2">
            <AlertTriangle size={13} className="text-amber-400 shrink-0" />
            <p className="text-[10px] font-bold text-amber-300/90">AI kurang yakin — owner perlu verifikasi</p>
          </div>
        )}

        {pendingCommit ? (
          <div className="space-y-2">
            <div className="h-1.5 bg-emerald-500/20 rounded-full overflow-hidden">
              <div ref={progressRef} className="h-full bg-emerald-500 rounded-full" style={{ width: '100%' }} />
            </div>
            <div className="flex items-center justify-between">
              <p className="text-[11px] font-bold text-emerald-400">Menyimpan...</p>
              <button type="button" onClick={handleCancelCommit}
                className="text-[11px] font-black text-red-400 hover:text-red-300 uppercase tracking-widest transition-colors"
              >
                Batalkan
              </button>
            </div>
          </div>
        ) : (
          <div className="space-y-2">
            <button type="button"
              disabled={isLoading || isLocked}
              onClick={handleConfirmClick}
              className="w-full flex items-center justify-center gap-2 h-11 rounded-xl bg-emerald-500 hover:bg-emerald-400 disabled:opacity-50 text-[13px] font-black text-black transition-all active:scale-[0.98]"
            >
              {isLoading ? <Loader2 size={16} className="animate-spin" /> : <><Check size={16} /> Konfirmasi</>}
            </button>
            <button type="button" onClick={onReject} disabled={isLoading}
              className="w-full text-[11px] font-bold text-[#4B6478] hover:text-red-400 transition-colors py-1"
            >
              Batal
            </button>
          </div>
        )}
      </motion.div>
    )
  }

  // =============================================================
  // VIEW_ONLY MODE — read-only field grid, no action buttons
  // =============================================================
  if (userRole === 'view_only') {
    return (
      <motion.div
        initial={{ opacity: 0, y: 8, scale: 0.97 }}
        animate={{ opacity: 1, y: 0, scale: 1 }}
        exit={{ opacity: 0, y: 8, scale: 0.97 }}
        transition={{ duration: 0.25, ease: 'easeOut' }}
        className="bg-[#111C24] rounded-2xl p-4 space-y-3 border border-white/8 opacity-75"
      >
        <div className="flex items-center gap-2.5">
          <div className={`w-8 h-8 rounded-xl ${c.bg} ${c.border} border flex items-center justify-center`}>
            <Icon size={15} className={c.text} />
          </div>
          <span className={`text-[12px] font-black uppercase tracking-widest ${c.text}`}>{label}</span>
        </div>
        {dataEntries.length > 0 && (
          <div className="space-y-1.5 bg-white/[0.02] rounded-xl p-3">
            {dataEntries.map(([key, val]) => {
              const formatted = formatValue(key, val)
              if (!formatted) return null
              return (
                <div key={key} className="flex items-baseline justify-between gap-3">
                  <span className="text-[11px] font-bold text-[#4B6478] uppercase tracking-wider shrink-0">
                    {FIELD_LABELS[key] || key.replace(/_/g, ' ')}
                  </span>
                  <span className="text-[12px] font-bold text-[#F1F5F9] text-right truncate">
                    {formatted}
                  </span>
                </div>
              )
            })}
          </div>
        )}
        <p className="text-[10px] font-bold text-[#4B6478] text-center uppercase tracking-widest">Mode Lihat Saja</p>
      </motion.div>
    )
  }

  // =============================================================
  // FULL MODE — owner / manajer (existing behavior + countdown)
  // =============================================================
  return (
    <motion.div
      initial={{ opacity: 0, y: 8, scale: 0.97 }}
      animate={{ opacity: 1, y: 0, scale: 1 }}
      exit={{ opacity: 0, y: 8, scale: 0.97 }}
      transition={{ duration: 0.25, ease: 'easeOut' }}
      className={`bg-[#111C24] rounded-2xl p-4 space-y-3 relative overflow-hidden ${
        isLocked ? 'grayscale-[0.5] opacity-80 border-white/5' :
        validation && !validation.valid ? 'border border-red-500/30' :
        isLowConfidence ? 'border border-amber-500/30' :
        hasDirtyFields ? 'border border-amber-500/20' :
        'border border-white/8'
      }`}
    >
      {/* Locked Overlay */}
      {isLocked && (
        <div className="absolute inset-0 bg-[#0C1319]/40 backdrop-blur-[1px] flex flex-col items-center justify-center z-10 p-6 text-center">
          <div className="w-10 h-10 rounded-full bg-white/5 border border-white/10 flex items-center justify-center mb-2">
            <Lock size={18} className="text-[#4B6478]" />
          </div>
          <p className="text-[11px] font-bold text-[#F1F5F9]">Transaksi Terkunci</p>
          <p className="text-[10px] text-[#4B6478] mt-1">
            Selesaikan konfirmasi <span className="text-emerald-400">{parentIntent?.replace('CATAT_', '') || 'transaksi utama'}</span> terlebih dahulu.
          </p>
        </div>
      )}

      {/* Queue indicator */}
      <div className="space-y-2">
        {queueTotal > 1 && (
          <div className="flex items-center justify-between">
            <p className="text-[9px] font-black text-[#4B6478] uppercase tracking-widest">
              Transaksi {queuePosition} dari {queueTotal}
            </p>
            {hasDirtyFields && (
              <span className="text-[9px] font-black text-amber-400 uppercase tracking-widest flex items-center gap-1">
                <Pencil size={9} /> Diedit
              </span>
            )}
          </div>
        )}
        {pendingEntry._clarification && (
          <div className="p-2.5 rounded-xl bg-orange-500/10 border border-orange-500/20 flex gap-2.5 animate-in fade-in slide-in-from-top-2 duration-300">
            <MessageCircle size={14} className="text-orange-400 shrink-0 mt-0.5" />
            <p className="text-[11px] font-bold text-orange-200/90 leading-tight">
              {pendingEntry._clarification}
            </p>
          </div>
        )}
      </div>

      {/* STEP: RESOLVE */}
      {step === 'resolve' && unresolvedEntities.length > 0 && (
        <ResolveStep
          entity={unresolvedEntities[0]}
          totalSteps={unresolvedEntities.length}
          currentStep={1}
          onResolveEntity={onResolveEntity}
        />
      )}

      {/* STEP: CONFIRM */}
      {step === 'confirm' && (
        <>
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2.5">
              <div className={`w-8 h-8 rounded-xl ${c.bg} ${c.border} border flex items-center justify-center`}>
                <Icon size={15} className={c.text} />
              </div>
              <span className={`text-[12px] font-black uppercase tracking-widest ${c.text}`}>{label}</span>
            </div>
            {pendingEntry._context?.parentContext && (
              <div className="px-2 py-0.5 rounded-full bg-white/5 border border-white/10 flex items-center gap-1.5 animate-in fade-in slide-in-from-right-2 duration-500">
                <span className="w-1 h-1 rounded-full bg-cyan-400 shadow-[0_0_5px_rgba(34,211,238,0.5)]" />
                <span className="text-[10px] font-bold text-cyan-200/80 uppercase">
                  {pendingEntry.intent === 'CATAT_PENGIRIMAN' ? (
                    `Sisa: ${(pendingEntry._context.parentContext.quantity || pendingEntry._context.parentContext.qty_ekor) - pendingEntry._context.accumulatedTotal} ekor`
                  ) : pendingEntry.intent === 'CATAT_BAYAR' ? (
                    `Sisa: Rp ${((pendingEntry._context.parentContext.total_revenue || 0) - pendingEntry._context.accumulatedTotal).toLocaleString()}`
                  ) : null}
                </span>
              </div>
            )}
          </div>

          {/* Data grid */}
          {dataEntries.length > 0 && (
            <div className="space-y-1.5 bg-white/[0.02] rounded-xl p-3">
              {dataEntries.map(([key, val]) => {
                const formatted = formatValue(key, val)
                if (!formatted) return null
                const isDirty = !!(pendingEntry._dirty || {})[key]
                return (
                  <div key={key} className="flex items-baseline justify-between gap-3">
                    <span className="text-[11px] font-bold text-[#4B6478] uppercase tracking-wider shrink-0">
                      {FIELD_LABELS[key] || key.replace(/_/g, ' ')}
                    </span>
                    <InlineEditField
                      fieldKey={key}
                      value={val}
                      isDirty={isDirty}
                      onEdit={(field, newVal) => onEdit?.(pendingEntry.id, field, newVal)}
                      options={dynamicFieldOptions[key]}
                    />
                  </div>
                )
              })}
            </div>
          )}

          {/* Validation errors */}
          {validation && !validation.valid && (
            <div className="flex items-start gap-2 bg-red-500/5 border border-red-500/15 rounded-xl px-3 py-2.5">
              <AlertCircle size={14} className="text-red-400 mt-0.5 shrink-0" />
              <div className="space-y-0.5">
                {validation.errors.map((e, i) => (
                  <p key={i} className="text-[11px] font-bold text-red-300/90">{e}</p>
                ))}
              </div>
            </div>
          )}

          {/* Validation warnings */}
          {validation?.warnings?.length > 0 && (
            <div className="flex items-start gap-2 bg-amber-500/5 border border-amber-500/15 rounded-xl px-3 py-2.5">
              <AlertTriangle size={14} className="text-amber-400 mt-0.5 shrink-0" />
              <div className="space-y-0.5">
                {validation.warnings.map((w, i) => (
                  <p key={i} className="text-[11px] font-bold text-amber-300/90">{w}</p>
                ))}
              </div>
            </div>
          )}

          {/* Low confidence */}
          {isLowConfidence && (
            <div className="flex items-start gap-2 bg-amber-500/5 border border-amber-500/15 rounded-xl px-3 py-2.5">
              <AlertTriangle size={14} className="text-amber-400 mt-0.5 shrink-0" />
              <p className="text-[11px] font-bold text-amber-300/90">
                AI kurang yakin ({Math.round(confidence * 100)}%) — cek datanya
              </p>
            </div>
          )}

          {/* Anomaly warnings */}
          {pendingEntry._anomalies?.length > 0 && (
            <div className="flex flex-col gap-1.5">
              {pendingEntry._anomalies.map((a, i) => (
                <div key={i} className={`flex items-start gap-2 rounded-xl px-3 py-2.5 border ${
                  a.severity === 'critical' ? 'bg-red-500/10 border-red-500/30' : 'bg-amber-500/5 border-amber-500/15'
                }`}>
                  <AlertTriangle size={14} className={a.severity === 'critical' ? 'text-red-400 mt-0.5 shrink-0' : 'text-amber-400 mt-0.5 shrink-0'} />
                  <div className="space-y-0.5">
                    <p className={`text-[11px] font-black uppercase tracking-widest ${a.severity === 'critical' ? 'text-red-400' : 'text-amber-400'}`}>
                      DETEKSI ANOMALI: {a.field?.replace(/_/g, ' ')}
                    </p>
                    <p className={`text-[11px] font-bold ${a.severity === 'critical' ? 'text-red-300/90' : 'text-amber-300/90'}`}>
                      {a.reason}
                    </p>
                  </div>
                </div>
              ))}
            </div>
          )}

          {/* Undo countdown bar */}
          {pendingCommit && (
            <div className="space-y-2">
              <div className="h-1 bg-emerald-500/20 rounded-full overflow-hidden">
                <div ref={progressRef} className="h-full bg-emerald-500 rounded-full" style={{ width: '100%' }} />
              </div>
              <div className="flex items-center justify-between">
                <p className="text-[11px] font-bold text-emerald-400">Menyimpan dalam 8 detik...</p>
                <button type="button" onClick={handleCancelCommit}
                  className="text-[11px] font-black text-red-400 hover:text-red-300 uppercase tracking-widest transition-colors"
                >
                  Batalkan
                </button>
              </div>
            </div>
          )}

          {/* Actions */}
          {!pendingCommit && (
            <div className="flex items-center gap-2 pt-1">
              <button type="button" onClick={onReject} disabled={isLoading}
                className="flex-1 h-9 rounded-xl bg-white/[0.03] border border-white/5 text-red-400 hover:bg-red-500/10 hover:border-red-500/20 transition-all text-[11px] font-black uppercase tracking-widest flex items-center justify-center gap-1.5 disabled:opacity-40"
              >
                <X size={13} /> Batal
              </button>
              <button type="button"
                disabled={isLoading || isLocked || (validation && !validation.valid)}
                onClick={handleConfirmClick}
                className="flex-1 flex items-center justify-center gap-1.5 h-10 rounded-xl bg-emerald-500 hover:bg-emerald-400 disabled:opacity-50 disabled:hover:bg-emerald-500 text-[12px] font-black text-black transition-all active:scale-[0.98]"
              >
                {isLoading ? <Loader2 size={15} className="animate-spin" /> : <><Check size={15} /> Simpan</>}
              </button>
            </div>
          )}
        </>
      )}
    </motion.div>
  )
}
