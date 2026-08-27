import React, { useState } from 'react'
import { motion, AnimatePresence } from 'framer-motion' // eslint-disable-line no-unused-vars
import { ChevronDown, Check, Plus } from 'lucide-react'
import { Skeleton } from '@/components/ui/skeleton'
import { formatIDR } from '@/lib/format'

// ── Palette ──────────────────────────────────────────────────────────────────
export const C = {
  bg: 'var(--bg-page)',
  card: 'var(--bg-surface)',
  input: 'var(--bg-subtle)',
  accent: 'var(--brand-500)',
  amber: '#D97706',
  green: '#16A34A',
  red: '#DC2626',
  text: 'var(--text-primary)',
  muted: 'var(--text-muted)',
  border: 'var(--border-soft)',
  borderAm: 'var(--border-muted)',
}

// ── Constants ─────────────────────────────────────────────────────────────────
export const PAYMENT_TERMS_DAYS = { cash: 0, net3: 3, net7: 7, net14: 14, net30: 30 }
export const PAYMENT_TERMS_LABEL = { cash: 'Cash', net3: 'NET 3', net7: 'NET 7', net14: 'NET 14', net30: 'NET 30' }

export const CUSTOMER_TYPES = [
  'perseorangan', 'warung', 'toko_retail', 'supermarket', 'restoran', 'catering', 'grosir', 'semi_grosir', 'sales_keliling', 'lainnya'
]
export const CUSTOMER_TYPE_OPTIONS = CUSTOMER_TYPES.map(t => ({ value: t, label: t.replace(/_/g, ' ').toUpperCase() }))
export const PAYMENT_METHOD_OPTIONS = [
  { value: 'cash', label: 'CASH (TUNAI)' },
  { value: 'transfer', label: 'TRANSFER BANK' },
]
export const INVOICE_FILTERS = [
  { id: 'all', label: 'Semua Invoice' },
  { id: 'unpaid', label: 'Punya Piutang' },
  { id: 'paid', label: 'Sudah Lunas' },
  { id: 'partial', label: 'Bayar Sebagian' },
  { id: 'overdue', label: 'Jatuh Tempo' },
]

// ── Style objects ─────────────────────────────────────────────────────────────
export const sInput = {
  background: C.input, border: `1px solid ${C.border}`, borderRadius: '10px',
  padding: '10px 12px', color: C.text, fontSize: '16px', fontWeight: 600,
  outline: 'none', width: '100%', appearance: 'none', WebkitAppearance: 'none',
  minHeight: '44px',
}

export const sBtn = (primary) => ({
  background: primary ? 'var(--brand-500)' : 'transparent',
  border: primary ? 'none' : '1px solid var(--border-soft)',
  color: primary ? 'var(--bg-page)' : 'var(--text-primary)',
  borderRadius: '10px',
  padding: '10px 18px', fontWeight: 700, fontSize: '13px', cursor: 'pointer',
})

export const sLabel = { fontSize: '11px', color: C.muted, fontWeight: 700, letterSpacing: '0.06em', marginBottom: '4px' }

// ── Utility functions ─────────────────────────────────────────────────────────

/**
 * Build a wa.me link from a raw phone number.
 * Handles Indonesian prefix: 08xxx → 628xxx, +62xxx → 62xxx.
 * @param {string} phone  Raw phone (may contain dashes, spaces, +)
 * @param {string} [encodedText]  Already-encodeURIComponent'd message
 * @returns {string|null}  Full wa.me URL or null if phone is empty
 */
export function toWaLink(phone, encodedText) {
  if (!phone) {
    return encodedText ? `https://api.whatsapp.com/send?text=${encodedText}` : null
  }
  const phoneStr = String(phone)
  const digits = phoneStr.replace(/[^0-9]/g, '')
  if (!digits) {
    return encodedText ? `https://api.whatsapp.com/send?text=${encodedText}` : null
  }
  const normalized = digits.startsWith('0') ? '62' + digits.slice(1) : digits
  const base = `https://api.whatsapp.com/send?phone=${normalized}`
  return encodedText ? `${base}&text=${encodedText}` : base
}

export function fmtDate(d, createdAt) {
  if (!d && !createdAt) return '-'
  try {
    const mainDate = new Date(d || createdAt)
    const dateStr = mainDate.toLocaleDateString('id-ID', { day: '2-digit', month: 'short', year: 'numeric' })
    const timeSource = createdAt ? new Date(createdAt) : (String(d).includes('T') || String(d).includes(':') ? mainDate : null)
    if (timeSource && !isNaN(timeSource.getTime())) {
      const timeStr = timeSource.toLocaleTimeString('id-ID', { hour: '2-digit', minute: '2-digit', hour12: false }).replace('.', ':')
      return `${dateStr} · ${timeStr}`
    }
    return dateStr
  } catch {
    return '-'
  }
}

export function generateWAMessage(sale, tenant) {
  const items = Array.isArray(sale.sembako_sale_items) ? sale.sembako_sale_items : (sale.items || [])
  const itemList = items.map(it => `- ${it.product_name || it.name} (${it.quantity || it.quantity_kg} ${it.unit || 'pcs'})`).join('\n')
  const status = sale.payment_status === 'lunas' ? '[LUNAS]' : '[BELUM LUNAS]'

  const text = `*NOTA PENJUALAN*\n` +
    `--------------------------\n` +
    `No: ${sale.invoice_number || sale.invoiceNumber || '-'}\n` +
    `Toko: ${sale.sembako_customers?.customer_name || sale.customer_name || sale.customerName || '-'}\n` +
    `Tanggal: ${new Date(sale.transaction_date || new Date()).toLocaleDateString('id-ID')}\n\n` +
    `*Detail Barang:*\n${itemList}\n\n` +
    `*Total: ${formatIDR(sale.total_amount || sale.revenue)}*\n` +
    `Status: ${status}\n` +
    ((sale.remaining_amount > 0 || sale.payment_status !== 'lunas') ? `Sisa Tagihan: ${formatIDR(sale.remaining_amount || (sale.total_amount || sale.revenue))}\n` : '') +
    `--------------------------\n` +
    `Terima kasih telah berbelanja di *${tenant?.business_name || 'Toko Kami'}*`

  return encodeURIComponent(text)
}

// ── UI Primitives ─────────────────────────────────────────────────────────────
export function CustomSelect({ value, onChange, options, placeholder, onAddNew, id, style }) {
  const [open, setOpen] = useState(false)
  const selected = options.find(o => o.value === value)

  return (
    <div style={{ position: 'relative', width: '100%', ...style }}>
      <div
        id={id}
        onClick={() => setOpen(!open)}
        style={{
          ...sInput,
          cursor: 'pointer',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          border: open ? `1px solid ${C.accent}` : `1px solid ${C.border}`,
          transition: 'all 0.2s'
        }}
      >
        <span style={{ color: value ? C.text : C.muted, fontSize: '14px' }}>
          {selected ? selected.label : placeholder}
        </span>
        <ChevronDown size={16} color={C.muted} style={{ transform: open ? 'rotate(180deg)' : 'none', transition: 'transform 0.2s' }} />
      </div>
      <AnimatePresence>
        {open && (
          <>
            <div
              style={{ position: 'fixed', inset: 0, zIndex: 5050 }}
              onClick={() => setOpen(false)}
            />
            <motion.div
              initial={{ opacity: 0, y: -8, scale: 0.95 }}
              animate={{ opacity: 1, y: 0, scale: 1 }}
              exit={{ opacity: 0, y: -8, scale: 0.95 }}
              style={{
                position: 'absolute', top: '100%', left: 0, right: 0, marginTop: '8px',
                background: C.card, border: `1px solid ${C.border}`, borderRadius: '14px',
                zIndex: 5060, overflow: 'hidden', boxShadow: '0 10px 30px rgba(15,23,42,0.08)',
                backdropFilter: 'blur(10px)',
              }}
            >
              <div style={{ maxHeight: '240px', overflowY: 'auto' }}>
                {options.length === 0 && !onAddNew && (
                  <div style={{ padding: '16px', textAlign: 'center', color: C.muted, fontSize: '13px' }}>
                    Tidak ada pilihan
                  </div>
                )}
                {options.map(opt => (
                  <div
                    key={opt.value}
                    onClick={() => { onChange(opt.value); setOpen(false) }}
                    style={{
                      padding: '12px 16px', fontSize: '14px', color: value === opt.value ? C.accent : C.text,
                      background: value === opt.value ? 'rgba(15,23,42,0.05)' : 'transparent',
                      cursor: 'pointer', transition: 'all 0.2s',
                      display: 'flex', alignItems: 'center', justifyContent: 'space-between'
                    }}
                  >
                    <span>{opt.label}</span>
                    {value === opt.value && <Check size={14} color={C.accent} />}
                  </div>
                ))}
              </div>
              {onAddNew && (
                <div
                  onClick={() => { onAddNew(); setOpen(false) }}
                  style={{
                    padding: '12px 16px', fontSize: '14px', color: C.accent,
                    fontWeight: 700, borderTop: `1px solid ${C.border}`,
                    cursor: 'pointer', background: '#F1F5F9',
                    display: 'flex', alignItems: 'center', gap: '8px'
                  }}
                >
                  <Plus size={14} /> Tambah Baru
                </div>
              )}
            </motion.div>
          </>
        )}
      </AnimatePresence>
    </div>
  )
}

export function InputRupiah({ value, onChange, placeholder, style, className, disabled }) {
  const display = value ? Number(value).toLocaleString('id-ID') : ''
  const mergedStyle = className ? style : { ...sInput, ...style }
  return (
    <input className={className} style={{ ...mergedStyle, opacity: disabled ? 0.5 : 1 }} placeholder={placeholder || 'Rp 0'}
      value={display ? `Rp ${display}` : ''}
      disabled={disabled}
      onChange={e => {
        const raw = e.target.value.replace(/[^0-9]/g, '')
        onChange(raw ? parseInt(raw) : 0)
      }} />
  )
}

export function ProgressIndicator({ currentStep, steps }) {
  return (
    <div style={{ display: 'flex', alignItems: 'flex-start', gap: 0, padding: '16px 0', marginBottom: '20px', borderTop: `1px solid ${C.border}` }}>
      {steps.map((label, i) => {
        const done = i < currentStep
        const active = i === currentStep
        return (
          <React.Fragment key={i}>
            <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', minWidth: 0, flex: 1 }}>
              <div style={{
                width: 24, height: 24, borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0,
                background: done ? C.green : active ? 'rgba(2, 26, 2,0.15)' : 'rgba(255,255,255,0.05)',
                border: done ? 'none' : active ? `2px solid ${C.green}` : `2px solid ${C.border}`,
              }}>
                {done
                  ? <Check size={12} color="white" strokeWidth={3} />
                  : <span style={{ fontSize: 10, fontWeight: 700, color: active ? C.green : C.muted }}>{i + 1}</span>
                }
              </div>
              <span style={{
                fontSize: 9, color: done ? C.green : active ? C.green : C.muted,
                textAlign: 'center', marginTop: 4, fontWeight: 600,
                width: '100%', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap',
                display: 'block',
              }}>{label}</span>
            </div>
            {i < steps.length - 1 && (
              <div style={{ flex: 1, height: 2, marginTop: 11, background: i < currentStep ? C.green : C.border }} />
            )}
          </React.Fragment>
        )
      })}
    </div>
  )
}

export function LoadingSkeleton() {
  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
      {[1, 2, 3].map(i => (
        <Skeleton key={i} style={{ height: '140px', width: '100%', borderRadius: '20px', background: 'rgba(255,255,255,0.05)' }} />
      ))}
    </div>
  )
}

export function EmptyBox({ icon: Icon, text, hint, actionLabel, onAction }) {
  const EmptyIcon = Icon
  return (
    <div style={{ padding: '60px 20px', textAlign: 'center', background: 'rgba(255,255,255,0.02)', borderRadius: '24px', border: `1px dashed ${C.border}` }}>
      <EmptyIcon size={40} color={C.muted} style={{ margin: '0 auto 16px', opacity: 0.4 }} />
      <p style={{ color: C.muted, fontSize: '14px', fontWeight: 600 }}>{text}</p>
      {hint && (
        <p style={{ color: C.muted, fontSize: '12px', fontWeight: 500, marginTop: '6px', opacity: 0.7, lineHeight: 1.5 }}>{hint}</p>
      )}
      {actionLabel && onAction && (
        <button
          onClick={onAction}
          style={{
            marginTop: '16px',
            display: 'inline-flex', alignItems: 'center', gap: '6px',
            padding: '10px 22px', borderRadius: '12px',
            background: C.accent, color: '#fff',
            fontSize: '13px', fontWeight: 700, fontFamily: 'DM Sans',
            border: 'none', cursor: 'pointer',
            boxShadow: '0 4px 14px rgba(15,23,42,0.25)',
            transition: 'opacity 0.2s',
          }}
          onMouseEnter={e => e.currentTarget.style.opacity = '0.85'}
          onMouseLeave={e => e.currentTarget.style.opacity = '1'}
        >
          {actionLabel}
        </button>
      )}
    </div>
  )
}

export function DetailRow({ label, value, color = C.text, bold, highlight }) {
  return (
    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '4px 0' }}>
      <span style={{ fontSize: '11px', color: C.muted, fontWeight: 700, textTransform: 'uppercase' }}>{label}</span>
      <span style={{
        fontSize: highlight ? '16px' : '13px',
        fontWeight: bold || highlight ? 900 : 600,
        color: color,
        fontFamily: highlight ? 'DM Sans' : 'inherit'
      }}>{value}</span>
    </div>
  )
}

export function SummaryLine({ label, value, bold, color = C.text }) {
  return (
    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '4px 0' }}>
      <span style={{ fontSize: '12px', color: C.muted }}>{label}</span>
      <span style={{ fontSize: '13px', fontWeight: bold ? 800 : 500, color: color }}>{value}</span>
    </div>
  )
}

export function calculateSaleFinancials(sale, returnsList = [], products = []) {
  if (!sale) return { grandTotal: 0, paidAmount: 0, remainingAmount: 0, overpayAmount: 0, isOverpaid: false, itemsSubtotal: 0, totalReturnAmount: 0, netMarginPct: 0, profit: 0, grossProfit: 0, effectiveCogs: 0, items: [], saleReturns: [] }

  const items = Array.isArray(sale.sembako_sale_items) ? sale.sembako_sale_items : []
  const directReturns = Array.isArray(sale?.sembako_returns) ? sale.sembako_returns.filter(r => !r.is_deleted) : []
  const hookedReturns = sale.id ? returnsList.filter(r => r && !r.is_deleted && (r.sale_id === sale.id || String(r.sale_id) === String(sale.id))) : []
  const invoiceReturns = sale.invoice_number ? returnsList.filter(r => r && !r.is_deleted && r.invoice_number && String(r.invoice_number).trim() === String(sale.invoice_number).trim()) : []
  const saleReturns = directReturns.length > 0 ? directReturns : (hookedReturns.length > 0 ? hookedReturns : invoiceReturns)

  const getItemPrice = (r) => {
    if (Number(r.unit_price) > 0) return Number(r.unit_price)
    const matchItem = items.find(i => i.product_id === r.product_id || i.product_name === r.product_name)
    if (matchItem) return Number(matchItem.price_per_unit || matchItem.sell_price || matchItem.unit_price || 0)
    const matchProd = products.find(p => p.id === r.product_id || p.product_name === r.product_name)
    return Number(matchProd?.sell_price || 0)
  }

  const getItemCogs = (r) => {
    const matchItem = items.find(i => i.product_id === r.product_id || i.product_name === r.product_name)
    if (matchItem && Number(matchItem.cogs_per_unit) > 0) return Number(matchItem.cogs_per_unit)
    const matchProd = products.find(p => p.id === r.product_id || p.product_name === r.product_name)
    return Number(matchProd?.avg_buy_price || 0)
  }

  const getReturnAmount = (r) => {
    const amt = Number(r.total_amount || r.amount || 0)
    if (amt > 0) return amt
    return Math.round(Number(r.quantity || 0) * getItemPrice(r))
  }

  const totalReturnAmount = saleReturns.reduce((sum, r) => sum + getReturnAmount(r), 0)
  const totalReturnCogs = saleReturns.reduce((sum, r) => sum + Math.round(Number(r.quantity || 0) * getItemCogs(r)), 0)

  const cogsFromItems = items.reduce((s, i) => s + Math.round((i.quantity || 0) * (i.cogs_per_unit || 0)), 0)
  const cogsFromProducts = items.reduce((s, i) => {
    if (!i.product_id) return s
    const prod = products.find(p => p.id === i.product_id)
    return s + Math.round((i.quantity || 0) * (prod?.avg_buy_price || 0))
  }, 0)
  const totalCogs = Number(sale.total_cogs) || cogsFromItems || cogsFromProducts
  const cogsIsEstimate = !Number(sale.total_cogs) && !cogsFromItems && cogsFromProducts > 0
  const effectiveCogs = Math.max(0, totalCogs - totalReturnCogs)

  const itemsSubtotalFromItems = items.length > 0
    ? items.reduce((s, i) => {
        const p = Number(i.sell_price || i.price_per_unit || i.unit_price || (i.quantity > 0 && i.subtotal ? i.subtotal / i.quantity : 0) || 0)
        return s + Math.round((Number(i.quantity) || 0) * p)
      }, 0)
    : 0
  // itemsSubtotal for display only (gross sebelum retur)
  // sale.subtotal dari hook = initialSubtotal (gross), aman dipakai
  const itemsSubtotal = itemsSubtotalFromItems || Number(sale.subtotal) || 0
  const deliveryCost = Number(sale.delivery_cost) || 0
  const otherCost = Number(sale.other_cost) || 0

  // ponytail: items dari DB JOIN selalu akurat — pakai untuk grandTotal jika ada.
  // sale.total_amount bisa corrupted jika DB di-update salah; items tidak bisa circular.
  // Jika items kosong, percaya sale.total_amount dari hook (hook juga pakai items saat pertama load).
  const grandTotal = itemsSubtotalFromItems > 0
    ? Math.max(0, itemsSubtotalFromItems + deliveryCost - totalReturnAmount)
    : Math.max(0, Number(sale.total_amount) || 0)

  const payments = Array.isArray(sale.sembako_payments) ? sale.sembako_payments.filter(p => !p.is_deleted) : []
  // ponytail: hanya hitung uang MASUK (positif, bukan refund). Refund ditrack di refundPaymentsAmount.
  const paidFromPayments = payments
    .filter(p => Number(p.amount || p.amount_paid || 0) > 0 && p.payment_method !== 'pengembalian_tunai_retur')
    .reduce((s, p) => s + (Number(p.amount || p.amount_paid) || 0), 0)
  // Hitung refund yang sudah dikembalikan ke toko
  const refundPaymentsAmount = payments
    .filter(p => p.payment_method === 'pengembalian_tunai_retur' || Number(p.amount || p.amount_paid || 0) < 0)
    .reduce((s, p) => s + Math.abs(Number(p.amount || p.amount_paid || 0)), 0)
  // raw_paid bersih: positif payments dikurangi yang sudah direfund
  const netPaidFromPayments = Math.max(0, paidFromPayments - refundPaymentsAmount)
  const rawPaidAmount = Math.max(Number(sale.raw_paid_amount || sale.paid_amount || 0), netPaidFromPayments)

  const isOverpaid = (saleReturns.length > 0 || sale.is_overpaid) && rawPaidAmount > grandTotal
  const overpayAmount = isOverpaid ? (rawPaidAmount - grandTotal) : (sale.overpay_amount || 0)
  const paidAmount = Math.min(grandTotal, rawPaidAmount)
  const remainingAmount = isOverpaid ? 0 : Math.max(0, grandTotal - paidAmount)

  const totalExpenses = otherCost
  const grossProfit = Math.max(0, (itemsSubtotal - totalReturnAmount) - effectiveCogs)
  const profit = Math.max(0, grossProfit - totalExpenses)
  const netMarginPct = grandTotal > 0 ? Math.round((profit / grandTotal) * 100) : 0



  return {
    items,
    saleReturns,
    totalReturnAmount,
    totalReturnCogs,
    itemsSubtotal,
    deliveryCost,
    otherCost,
    totalExpenses,
    grandTotal,
    grossPaidAmount: paidFromPayments,  // uang masuk bruto (belum dikurangi refund) — untuk display 'Total Uang Diterima'
    rawPaidAmount,                       // net bersih (setelah refund) — untuk hitung overpay
    paidAmount,
    remainingAmount,
    isOverpaid,
    overpayAmount,
    effectiveCogs,
    cogsIsEstimate,
    grossProfit,
    profit,
    netMarginPct,
    refundPaymentsAmount,
  }
}

// ── Universal Multi-Unit Packaging Calculator Helper ─────────────────────────────
export function UniversalMultiUnitCalculator({ onApply, targetUnit = 'pcs', style, unitRatios }) {
  const [isOpen, setIsOpen] = useState(false)
  const [karton, setKarton] = useState('')
  const [dus, setDus] = useState('')
  const [pak, setPak] = useState('')
  const [lusin, setLusin] = useState('')

  // Default universal packaging conversion factors:
  // Karton / Box Besar: default 40x
  // Dus / Box Sedang: default 20x
  // Lusin / Renceng: default 12x
  // Pak / Slop / Strip: default 10x
  const ratioKarton = unitRatios?.karton || 40
  const ratioDus = unitRatios?.dus || 20
  const ratioLusin = unitRatios?.lusin || 12
  const ratioPak = unitRatios?.pak || 10

  const totalUnits = (Number(karton) || 0) * ratioKarton +
                     (Number(dus) || 0) * ratioDus +
                     (Number(lusin) || 0) * ratioLusin +
                     (Number(pak) || 0) * ratioPak

  const handleApply = () => {
    onApply(totalUnits)
  }

  const handleClear = () => {
    setKarton('')
    setDus('')
    setPak('')
    setLusin('')
  }

  return (
    <div style={{
      border: '1px solid var(--border-soft)',
      borderRadius: '12px',
      background: 'rgba(15, 23, 42, 0.04)',
      padding: '10px 12px',
      marginTop: '8px',
      boxSizing: 'border-box',
      width: '100%',
      ...style
    }}>
      <button
        type="button"
        onClick={() => setIsOpen(!isOpen)}
        style={{
          background: 'transparent',
          border: 'none',
          cursor: 'pointer',
          width: '100%',
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          color: '#0F172A',
          fontFamily: 'DM Sans',
          fontSize: '12px',
          fontWeight: 700,
          padding: 0,
          outline: 'none'
        }}
      >
        <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
          <span>📦</span>
          <span>Kalkulator Satuan Kemasan Bertingkat ({targetUnit})</span>
        </div>
        <ChevronDown size={14} style={{ transform: isOpen ? 'rotate(180deg)' : 'none', transition: 'transform 0.2s', color: '#0F172A' }} />
      </button>

      {isOpen && (
        <div style={{ marginTop: '10px', display: 'flex', flexDirection: 'column', gap: '8px' }}>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '8px' }}>
            <div>
              <label style={{ display: 'block', fontSize: '10px', color: 'var(--text-muted)', marginBottom: '4px', fontWeight: 700 }}>
                Karton / Bal ({ratioKarton} {targetUnit})
              </label>
              <input
                type="text"
                inputMode="numeric"
                value={karton}
                onChange={e => setKarton(e.target.value.replace(/\D/g, ''))}
                placeholder="0"
                style={{
                  width: '100%',
                  height: '32px',
                  background: 'var(--bg-subtle)',
                  border: '1px solid var(--border-soft)',
                  borderRadius: '8px',
                  padding: '0 8px',
                  fontSize: '12px',
                  color: 'var(--text-primary)',
                  fontWeight: 600,
                  outline: 'none',
                  boxSizing: 'border-box'
                }}
              />
            </div>
            <div>
              <label style={{ display: 'block', fontSize: '10px', color: 'var(--text-muted)', marginBottom: '4px', fontWeight: 700 }}>
                Dus / Box ({ratioDus} {targetUnit})
              </label>
              <input
                type="text"
                inputMode="numeric"
                value={dus}
                onChange={e => setDus(e.target.value.replace(/\D/g, ''))}
                placeholder="0"
                style={{
                  width: '100%',
                  height: '32px',
                  background: 'var(--bg-subtle)',
                  border: '1px solid var(--border-soft)',
                  borderRadius: '8px',
                  padding: '0 8px',
                  fontSize: '12px',
                  color: 'var(--text-primary)',
                  fontWeight: 600,
                  outline: 'none',
                  boxSizing: 'border-box'
                }}
              />
            </div>
            <div>
              <label style={{ display: 'block', fontSize: '10px', color: 'var(--text-muted)', marginBottom: '4px', fontWeight: 700 }}>
                Lusin / Renceng ({ratioLusin} {targetUnit})
              </label>
              <input
                type="text"
                inputMode="numeric"
                value={lusin}
                onChange={e => setLusin(e.target.value.replace(/\D/g, ''))}
                placeholder="0"
                style={{
                  width: '100%',
                  height: '32px',
                  background: 'var(--bg-subtle)',
                  border: '1px solid var(--border-soft)',
                  borderRadius: '8px',
                  padding: '0 8px',
                  fontSize: '12px',
                  color: 'var(--text-primary)',
                  fontWeight: 600,
                  outline: 'none',
                  boxSizing: 'border-box'
                }}
              />
            </div>
            <div>
              <label style={{ display: 'block', fontSize: '10px', color: 'var(--text-muted)', marginBottom: '4px', fontWeight: 700 }}>
                Pak / Slop / Strip ({ratioPak} {targetUnit})
              </label>
              <input
                type="text"
                inputMode="numeric"
                value={pak}
                onChange={e => setPak(e.target.value.replace(/\D/g, ''))}
                placeholder="0"
                style={{
                  width: '100%',
                  height: '32px',
                  background: 'var(--bg-subtle)',
                  border: '1px solid var(--border-soft)',
                  borderRadius: '8px',
                  padding: '0 8px',
                  fontSize: '12px',
                  color: 'var(--text-primary)',
                  fontWeight: 600,
                  outline: 'none',
                  boxSizing: 'border-box'
                }}
              />
            </div>
          </div>

          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', borderTop: '1px solid var(--border-soft)', paddingTop: '8px', marginTop: '4px' }}>
            <div style={{ fontSize: '11px', fontWeight: 700, color: 'var(--text-primary)' }}>
              Total: <span style={{ color: '#D97706', fontSize: '13px', fontFamily: 'Sora', fontWeight: 800 }}>{totalUnits}</span> {targetUnit}
            </div>
            <div style={{ display: 'flex', gap: '6px' }}>
              <button
                type="button"
                onClick={handleClear}
                style={{
                  background: 'transparent',
                  border: '1px solid var(--border-soft)',
                  borderRadius: '6px',
                  padding: '4px 10px',
                  fontSize: '10px',
                  fontWeight: 700,
                  color: 'var(--text-muted)',
                  cursor: 'pointer',
                  outline: 'none'
                }}
              >
                Reset
              </button>
              <button
                type="button"
                onClick={handleApply}
                disabled={totalUnits <= 0}
                style={{
                  background: '#0F172A',
                  border: 'none',
                  borderRadius: '6px',
                  padding: '4px 10px',
                  fontSize: '10px',
                  fontWeight: 700,
                  color: 'white',
                  cursor: totalUnits > 0 ? 'pointer' : 'not-allowed',
                  opacity: totalUnits > 0 ? 1 : 0.5,
                  outline: 'none'
                }}
              >
                Terapkan
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}

// Backward compatibility aliases
export const RokokUnitCalculator = UniversalMultiUnitCalculator

export function formatUniversalPackaging(quantity, baseUnit = 'pcs') {
  const q = Number(quantity)
  if (isNaN(q) || q <= 0) return ''

  const parts = []
  let rem = q

  const kartons = Math.floor(rem / 40)
  rem %= 40

  const duses = Math.floor(rem / 20)
  rem %= 20

  const paks = Math.floor(rem / 10)
  rem %= 10

  if (kartons > 0) parts.push(`${kartons} Karton`)
  if (duses > 0) parts.push(`${duses} Dus`)
  if (paks > 0) parts.push(`${paks} Pak`)
  if (rem > 0) parts.push(`${rem} ${baseUnit}`)

  return parts.length > 0 ? `(${parts.join(' + ')})` : ''
}

export const formatRokokPackaging = formatUniversalPackaging

/**
 * Format raw Supabase/PostgreSQL/JavaScript errors into friendly actionable Indonesian messages.
 * @param {Error|string|object} err
 * @param {string} fallback
 * @returns {string}
 */
export function formatFriendlyErrorMessage(err, fallback = 'Gagal menyimpan transaksi') {
  if (!err) return fallback
  const msg = typeof err === 'string' ? err : (err.message || err.details || '')
  const low = msg.toLowerCase()

  // Foreign key / Missing customer relation
  if (low.includes('violates foreign key constraint') && (low.includes('customer_id') || low.includes('sembako_sales_customer_id_fkey'))) {
    return 'Toko atau Pelanggan yang dipilih tidak valid atau belum terdaftar. Silakan pilih kembali toko pada Langkah 1.'
  }
  // Foreign key on products or batches
  if (low.includes('violates foreign key constraint') && low.includes('product_id')) {
    return 'Salah satu produk yang dipilih tidak ditemukan dalam database. Silakan pilih ulang produk.'
  }
  if (low.includes('violates foreign key constraint')) {
    return 'Terdapat relasi data yang tidak cocok (toko/produk). Silakan periksa kembali data sebelum menyimpan.'
  }

  // Stock deficit
  if (low.includes('stok') && low.includes('tidak cukup')) {
    return msg
  }

  // Duplicate constraint
  if (low.includes('duplicate key') || low.includes('unique constraint') || low.includes('23505')) {
    return 'Nomor transaksi/invoice ini sudah terdaftar. Silakan coba simpan kembali untuk membuat nomor invoice baru.'
  }

  // Row level security / permissions
  if (low.includes('row-level security') || low.includes('permission denied') || low.includes('42501') || low.includes('pgrst301')) {
    return 'Sesi login Anda telah berakhir atau hak akses tidak mencukupi. Silakan refresh halaman dan login ulang.'
  }

  // Network / fetch errors
  if (low.includes('failed to fetch') || low.includes('network') || low.includes('offline') || low.includes('timeout')) {
    return 'Koneksi internet bermasalah. Periksa jaringan Anda dan coba beberapa saat lagi.'
  }

  // If already a clean human-readable message without SQL keywords
  if (msg && !msg.includes('violates') && !msg.includes('constraint') && !msg.includes('syntax') && !msg.includes('relation') && !msg.includes('null value in column') && !msg.includes('table "')) {
    return msg
  }

  return fallback
}
