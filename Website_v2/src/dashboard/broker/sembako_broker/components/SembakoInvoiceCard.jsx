import React, { useState } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { cn } from '@/lib/utils'
import { formatIDR, formatIDRShort } from '@/lib/format'
import { BrokerBaseCard } from '@/dashboard/_shared/components/transactions/BrokerBaseCard'
import { ChevronDown, User, Package } from 'lucide-react'
import { useCreateSembakoDelivery } from '@/lib/hooks/useSembakoData'
import { C, sBtn, sInput, sLabel, fmtDate, calculateSaleFinancials, CustomSelect } from '@/dashboard/broker/sembako_broker/components/sembakoSaleUtils'
import { Sheet, SheetContent, SheetHeader, SheetTitle, SheetDescription } from '@/components/ui/sheet'
import { DatePicker } from '@/components/ui/DatePicker'
import { Loader2 } from 'lucide-react'
import { DeliveryCompletionModal } from './DeliveryCompletionModal'


function getDeliveryBadge(deliveries) {
  if (!deliveries || deliveries.length === 0) {
    return { label: 'Belum Dikirim', color: '#94A3B8', bg: 'rgba(148,163,184,0.08)', border: 'rgba(148,163,184,0.15)', icon: '📦' }
  }
  const allDelivered = deliveries.every(d => d.status === 'delivered')
  const anyInTransit = deliveries.some(d => d.status === 'in_transit')
  const anyDelivered = deliveries.some(d => d.status === 'delivered')

  if (allDelivered) {
    return { label: 'Terkirim', color: '#34D399', bg: 'rgba(16, 185, 129, 0.08)', border: 'rgba(16, 185, 129, 0.20)', icon: '✓' }
  }
  if (anyInTransit || anyDelivered) {
    return { label: 'Di Jalan', color: '#FBBF24', bg: 'rgba(251,191,36,0.08)', border: 'rgba(251,191,36,0.15)', icon: '🚚' }
  }
  return { label: 'Siap Kirim', color: '#93C5FD', bg: 'rgba(96,165,250,0.08)', border: 'rgba(96,165,250,0.15)', icon: '📦' }
}

function fmtDateLocal(value, createdAt) {
  if (!value && !createdAt) return '-'
  try {
    const mainDate = new Date(value || createdAt)
    const dateStr = mainDate.toLocaleDateString('id-ID', { day: '2-digit', month: 'short', year: 'numeric' })
    const timeSource = createdAt ? new Date(createdAt) : (String(value).includes('T') || String(value).includes(':') ? mainDate : null)
    if (timeSource && !isNaN(timeSource.getTime())) {
      const timeStr = timeSource.toLocaleTimeString('id-ID', { hour: '2-digit', minute: '2-digit', hour12: false }).replace('.', ':')
      return `${dateStr} · ${timeStr}`
    }
    return dateStr
  } catch {
    return '-'
  }
}

// ── Mini delivery row (mobile expand panel) ───────────────────────────────────
function MiniDeliveryRow({ delivery, onStart, onComplete, onNavigate }) {
  const statusMeta = {
    pending:   { label: 'Disiapkan', color: '#94A3B8', bg: 'rgba(148,163,184,0.1)' },
    on_route:  { label: 'Di Jalan',  color: '#60A5FA', bg: 'rgba(59,130,246,0.1)', pulse: true },
    delivered: { label: 'Selesai',   color: '#34D399', bg: 'rgba(16, 185, 129, 0.1)' },
  }
  const meta = statusMeta[delivery.status] || statusMeta.pending
  const emp = delivery.sembako_employees
  const driverName = emp?.full_name || delivery.driver_name
  const vehicleName = [delivery.vehicle_type, delivery.vehicle_plate].filter(v => v && v !== '-').join(' ')
  const isDirect = !driverName && !vehicleName

  return (
    <div
      onClick={e => { e.stopPropagation(); onNavigate?.(delivery.id) }}
      style={{
        background: 'var(--bg-surface)',
        borderRadius: '12px',
        border: '1px solid var(--border-soft)',
        padding: '10px 12px',
        display: 'flex',
        flexDirection: 'column',
        gap: '6px',
        cursor: 'pointer',
        WebkitTapHighlightColor: 'transparent',
      }}
    >
      {/* Row 1: status + date */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <span style={{
          fontSize: '9px', fontWeight: 900, letterSpacing: '0.1em', textTransform: 'uppercase',
          padding: '2px 7px', borderRadius: '6px',
          background: meta.bg, color: meta.color,
          display: 'inline-flex', alignItems: 'center', gap: '4px',
        }}>
          {meta.pulse && (
            <span className="relative flex h-1.5 w-1.5">
              <span className="animate-ping absolute inline-flex h-full w-full rounded-full opacity-75" style={{ background: meta.color }} />
              <span className="relative inline-flex rounded-full h-1.5 w-1.5" style={{ background: meta.color }} />
            </span>
          )}
          {meta.label}
        </span>
        <span style={{ fontSize: '10px', color: 'var(--text-muted)', fontWeight: 700 }}>{fmtDate(delivery.delivery_date)}</span>
      </div>

      {/* Row 2: driver + vehicle */}
      <div style={{ display: 'flex', gap: '12px' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '4px', flex: 1, minWidth: 0 }}>
          <User size={10} color="var(--text-muted)" style={{ flexShrink: 0 }} />
          <span style={{ fontSize: '11px', color: 'var(--text-muted)', fontWeight: 700, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
            {isDirect ? 'Diambil Sendiri' : (driverName || '—')}
          </span>
        </div>
        <div style={{ display: 'flex', alignItems: 'center', gap: '4px', flexShrink: 0 }}>
          <Truck size={10} color="var(--text-muted)" style={{ flexShrink: 0 }} />
          <span style={{ fontSize: '11px', color: 'var(--text-muted)', fontWeight: 700 }}>
            {isDirect ? 'Ambil di Toko' : (vehicleName || '—')}
          </span>
        </div>
      </div>

      {/* Action button */}
      {delivery.status === 'pending' && (
        <button
          onClick={() => onStart(delivery.id)}
          style={{ ...sBtn(false), padding: '7px', fontSize: '11px', width: '100%', marginTop: '2px', color: '#60A5FA', borderColor: 'rgba(59,130,246,0.3)' }}
        >
          <Truck size={12} style={{ display: 'inline', marginRight: '4px' }} />
          Mulai Perjalanan
        </button>
      )}
      {delivery.status === 'on_route' && (
        <button
          onClick={() => onComplete(delivery.id)}
          style={{ ...sBtn(true), padding: '7px', fontSize: '11px', width: '100%', marginTop: '2px', background: '#10B981' }}
        >
          ✓ Selesaikan
        </button>
      )}
    </div>
  )
}


// ── Tambah Trip Sheet ────────────────────────────────────────────────────────
export function TambahTripSheet({ open, onClose, prefillSale, employees = [] }) {
  const createDelivery = useCreateSembakoDelivery()
  const [driverId, setDriverId] = useState('')
  const [vehicleType, setVehicleType] = useState('Mobil Box')
  const [vehiclePlate, setVehiclePlate] = useState('')
  const [deliveryDate, setDeliveryDate] = useState(new Date().toISOString().slice(0, 10))
  const [notes, setNotes] = useState('')

  // Filter employees to only show drivers/sopir/kurir if available, otherwise show all
  const driverOptions = React.useMemo(() => {
    const list = employees.filter(e => !e.is_deleted && e.is_active !== false)
    return [
      { value: '', label: 'Kirim Langsung (Tanpa Driver)' },
      ...list.map(e => ({ value: e.id, label: e.full_name }))
    ]
  }, [employees])

  const handleClose = React.useCallback((v) => {
    if (!v) {
      createDelivery.reset()
      onClose()
    }
  }, [onClose, createDelivery])

  async function handleSubmit() {
    if (!prefillSale) return
    const selectedEmp = employees.find(e => e.id === driverId)
    const driverName = selectedEmp ? selectedEmp.full_name : 'Langsung'

    try {
      await createDelivery.mutateAsync({
        sale_id: prefillSale.id,
        employee_id: driverId || null,
        driver_name: driverName,
        vehicle_type: vehicleType,
        vehicle_plate: vehiclePlate || '-',
        delivery_date: deliveryDate,
        status: 'pending',
        notes: notes || `Pengiriman nota ${prefillSale.invoice_number || prefillSale.id}`,
      })
      
      // Reset form
      setDriverId('')
      setVehicleType('Mobil Box')
      setVehiclePlate('')
      setNotes('')
      onClose()
    } catch (err) {
      // toast shown by hook
    }
  }

  return (
    <Sheet open={open} onOpenChange={handleClose}>
      <SheetContent side="right" style={{ background: C.bg, borderLeft: `1px solid ${C.border}`, width: '100%', maxWidth: '420px', padding: '24px', overflowY: 'auto' }}>
        <SheetHeader>
          <SheetTitle style={{ color: C.text, fontWeight: 900 }}>Buat Pengiriman</SheetTitle>
          <SheetDescription className="sr-only">Form untuk menjadwalkan pengiriman barang nota sembako.</SheetDescription>
        </SheetHeader>

        {prefillSale && (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '14px', marginTop: '20px', paddingBottom: 'max(40px, calc(20px + env(safe-area-inset-bottom, 20px)))' }}>
            <div style={{ background: C.card, borderRadius: '10px', padding: '12px', border: `1px solid ${C.border}` }}>
              <p style={{ fontSize: '12px', fontWeight: 700, color: C.text }}>{prefillSale.invoice_number}</p>
              <p style={{ fontSize: '11px', color: C.muted }}>{prefillSale.sembako_customers?.customer_name || prefillSale.customer_name || 'Umum'}</p>
              <p style={{ fontSize: '11px', color: C.accent, fontWeight: 800 }}>Tujuan: {prefillSale.sembako_customers?.address || 'Kirim Langsung'}</p>
            </div>

            <div>
              <p style={sLabel}>DRIVER / SOPIR</p>
              <CustomSelect
                value={driverId}
                onChange={setDriverId}
                options={driverOptions}
                placeholder="Pilih driver"
              />
            </div>

            <div>
              <p style={sLabel}>KENDARAAN</p>
              <CustomSelect
                value={vehicleType}
                onChange={setVehicleType}
                options={[
                  { value: 'Mobil Box', label: 'Mobil Box' },
                  { value: 'Mobil Pickup', label: 'Mobil Pickup' },
                  { value: 'Motor', label: 'Motor / Kurir' },
                  { value: 'Truk', label: 'Truk' },
                  { value: 'Langsung', label: 'Diambil Sendiri (Langsung)' },
                ]}
                placeholder="Pilih kendaraan"
              />
            </div>

            <div>
              <p style={sLabel}>PLAT NOMOR</p>
              <input
                style={sInput}
                value={vehiclePlate}
                onChange={e => setVehiclePlate(e.target.value)}
                placeholder="Contoh: B 1234 CD (Opsional)"
              />
            </div>

            <div>
              <p style={sLabel}>TANGGAL KIRIM</p>
              <DatePicker value={deliveryDate} onChange={setDeliveryDate} placeholder="Pilih tanggal" />
            </div>

            <div>
              <p style={sLabel}>CATATAN TRIP</p>
              <textarea
                style={{ ...sInput, height: '70px', resize: 'none', paddingTop: '8px' }}
                value={notes}
                onChange={e => setNotes(e.target.value)}
                placeholder="Petunjuk jalan, cuaca, dll (Opsional)"
              />
            </div>

            <button
              onClick={handleSubmit}
              disabled={createDelivery.isPending}
              style={{
                ...sBtn(true),
                width: '100%', padding: '14px',
                marginTop: '10px'
              }}
            >
              {createDelivery.isPending ? (
                <span style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '8px' }}>
                  <Loader2 size={16} className="animate-spin" />
                  Menjadwalkan...
                </span>
              ) : (
                'Jadwalkan Pengiriman'
              )}
            </button>
          </div>
        )}
      </SheetContent>
    </Sheet>
  )
}


// ── Sale items panel (shown in mobile expand) ─────────────────────────────────
function SaleItemsPanel({ sale, onOpenDetail, onEdit }) {
  const items = Array.isArray(sale.sembako_sale_items) ? sale.sembako_sale_items : []

  return (
    <div style={{
      background: 'var(--bg-subtle)',
      borderRadius: '16px',
      border: '1px solid var(--border-soft)',
      padding: '12px 14px 14px',
    }}>
      {/* Section header */}
      <p style={{
        fontSize: '9px', fontWeight: 900, letterSpacing: '0.18em', textTransform: 'uppercase',
        color: 'var(--text-muted)', marginBottom: '6px', display: 'flex', alignItems: 'center', gap: '5px',
      }}>
        <Package size={11} color="var(--text-muted)" />
        {`Item (${items.length})`}
      </p>

      {/* Invoice number */}
      {sale.invoice_number && (
        <p style={{
          fontSize: '10px', fontWeight: 700, color: 'var(--text-muted)',
          fontFamily: 'monospace', letterSpacing: '0.05em',
          marginBottom: '10px', opacity: 0.7,
        }}>
          {sale.invoice_number}
        </p>
      )}

      {/* Items list */}
      {items.length === 0 ? (
        <div style={{ display: 'flex', alignItems: 'center', gap: '6px', padding: '8px 0', marginBottom: '10px' }}>
          <Package size={13} color={C.muted} />
          <p style={{ fontSize: '12px', color: C.muted, margin: 0, fontWeight: 600 }}>Belum ada item</p>
        </div>
      ) : (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '1px', marginBottom: '10px' }}>
          {items.map((it, i) => {
            const qty = it.quantity ?? 0
            const price = Number(it.sell_price ?? it.price_per_unit ?? it.unit_price ?? 0)
            const subtotal = it.subtotal ?? Math.round(qty * price)
            const rawName = it.product_name || it.sembako_products?.product_name || '—'
            const matchPkg = rawName.match(/\[(\d+(?:\.\d+)?\s*[^\]]+)\]/)
            const pkgTag = matchPkg ? matchPkg[1] : null
            const cleanProdName = rawName.replace(/\s*\[\d+[^\]]+\]/g, '').trim()

            return (
              <div key={it.id ?? i} style={{
                display: 'flex', alignItems: 'center', justifyContent: 'space-between',
                padding: '7px 2px',
                borderBottom: i < items.length - 1 ? '1px solid var(--border-soft)' : 'none',
              }}>
                {/* Nama produk */}
                <div style={{ flex: 1, minWidth: 0, paddingRight: '8px' }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '6px', flexWrap: 'wrap' }}>
                    <p style={{ fontSize: '12px', fontWeight: 700, color: 'var(--text-primary)', margin: 0, overflow: 'hidden', textOverflow: 'ellipsis' }}>
                      {cleanProdName}
                    </p>
                    {pkgTag && (
                      <span style={{ fontSize: '9px', fontWeight: 800, padding: '1px 5px', borderRadius: '4px', background: '#EEF2FF', color: '#4F46E5', textTransform: 'uppercase' }}>
                        {pkgTag}
                      </span>
                    )}
                  </div>
                  <p style={{ fontSize: '10px', color: 'var(--text-muted)', margin: 0, fontWeight: 600 }}>
                    {qty} {it.unit || 'unit'} × {formatIDR(price)}
                  </p>
                </div>
                {/* Subtotal */}
                <p style={{ fontSize: '12px', fontWeight: 800, color: 'var(--text-primary)', margin: 0, tabularNums: 'tabular-nums', whiteSpace: 'nowrap' }}>
                  {formatIDR(subtotal)}
                </p>
              </div>
            )
          })}
        </div>
      )}

      {/* Action buttons */}
      <div style={{ display: 'flex', gap: '8px' }}>
        <button
          onClick={e => { e.stopPropagation(); onEdit?.(sale) }}
          style={{ ...sBtn(false), flex: 1, padding: '10px', fontSize: '12px', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '4px' }}
        >
          ✏️ Edit Nota
        </button>
        <button
          onClick={e => { e.stopPropagation(); onOpenDetail?.() }}
          style={{ ...sBtn(false), flex: 1, padding: '10px', fontSize: '12px' }}
        >
          Detail Invoice
        </button>
      </div>
    </div>
  )
}

// ── Main card component ───────────────────────────────────────────────────────
export function SembakoInvoiceCard({ sale, onOpenDetail, onEdit, onManageDelivery, isDesktop, returnsList = [], products = [] }) {
  const [expanded, setExpanded] = useState(false)
  const [deliveryConfirmModal, setDeliveryConfirmModal] = useState(false)

  const customerName = sale.sembako_customers?.customer_name || sale.customer_name || 'Umum'
  const items = Array.isArray(sale.sembako_sale_items) ? sale.sembako_sale_items : []
  const deliveries = Array.isArray(sale.sembako_deliveries) ? sale.sembako_deliveries : []
  const noItems = items.length === 0  // data belum termuat / sale lama

  // Gunakan fungsi kalkulasi yang sama dengan detail sheet
  const fin = calculateSaleFinancials(sale, returnsList, products)
  const totalAmount    = fin.grandTotal
  const rawPaidAmount  = fin.rawPaidAmount
  const isOverpaid     = fin.isOverpaid
  const overpayAmount  = fin.overpayAmount
  const paidAmount     = fin.paidAmount
  const remainingAmount = fin.remainingAmount
  const hasDebt = remainingAmount > 0
  const isLunas   = sale.payment_status === 'lunas'   || (totalAmount > 0 && remainingAmount <= 0)
  const isSebagian = sale.payment_status === 'sebagian' || (paidAmount > 0 && remainingAmount > 0)
  // Gunakan fin.profit sebagai source of truth dinamis untuk net profit
  const netProfit = fin.profit

  const initialCustomer = customerName.charAt(0).toUpperCase()

  const topItem = items[0]
  const totalQty = items.reduce((sum, i) => sum + (Number(i.quantity) || 0), 0)
  const cardReturns = Array.isArray(sale.sembako_returns) ? sale.sembako_returns.filter(r => !r.is_deleted) : []
  const totalReturnQty = cardReturns.reduce((sum, r) => sum + (Number(r.quantity) || 0), 0)
  const netQty = Math.max(0, totalQty - totalReturnQty)
  const itemUnit = topItem?.unit || 'unit'

  const deliveryBadge = getDeliveryBadge(deliveries)
  const allDelivered = deliveries.length > 0 && deliveries.every(d => d.status === 'delivered')

  const handleCompleteDelivery = (e) => {
    e?.stopPropagation()
    setDeliveryConfirmModal(true)
  }

  const fmt = isDesktop ? formatIDR : formatIDRShort
  const valSize = isDesktop ? 'text-[18px]' : 'text-[13px]'

  // ── Avatar color by payment state ──
  const avatarCn = isLunas
    ? 'bg-emerald-500/10 border-emerald-500/40 text-emerald-400'
    : hasDebt
      ? 'bg-red-500/10 border-red-500/40 text-red-500'
      : 'bg-[#0F172A]/10 border-[#0F172A]/40 text-amber-400'

  const paymentLabel = isLunas ? 'LUNAS' : isSebagian ? 'SEBAGIAN' : 'BELUM LUNAS'

  // ── DESKTOP header ──
  const desktopHeader = (
    <>
      <div className="flex items-center gap-3 flex-1 min-w-0">
        <div className={cn('w-[34px] h-[34px] rounded-xl flex items-center justify-center font-black text-lg border-2', avatarCn)}>
          {initialCustomer}
        </div>
        <div className="flex-1 min-w-0">
          <h3 className="font-display font-bold text-sm text-[#F1F5F9] leading-none uppercase tracking-tight truncate">
            {customerName}
          </h3>
          <p className="text-xs font-medium text-[#94A3B8] mt-1.5 tabular-nums truncate">
            {sale.invoice_number || '-'} · {fmtDateLocal(sale.transaction_date, sale.created_at)}
            {sale.due_date ? ` · Tempo: ${fmtDateLocal(sale.due_date)}` : ''}
          </p>
        </div>
      </div>
      <div className="flex items-center gap-3">
        <span style={{
          display: 'inline-flex', alignItems: 'center',
          padding: '2px 8px', borderRadius: '99px',
          background: isLunas ? 'rgba(16, 185, 129, 0.1)' : isSebagian ? 'rgba(251,191,36,0.1)' : 'rgba(239,68,68,0.1)',
          color: isLunas ? '#34D399' : isSebagian ? '#FBBF24' : '#F87171',
          fontSize: '8px', fontWeight: 900, letterSpacing: '0.1em', textTransform: 'uppercase',
        }}>
          {paymentLabel}
        </span>
        <span style={{ display: 'inline-flex', alignItems: 'center', gap: '5px', fontSize: '10px', fontWeight: 900, padding: '3px 12px', borderRadius: '99px', background: deliveryBadge.bg, border: `1px solid ${deliveryBadge.border}`, color: deliveryBadge.color, textTransform: 'uppercase' }}>
          {deliveryBadge.icon && <span style={{ opacity: 0.7 }}>{deliveryBadge.icon}</span>}
          {deliveryBadge.label}
        </span>
      </div>
    </>
  )

  // ── MOBILE header — 2-row layout ──
  const mobileHeader = (
    <div className="flex flex-col gap-2 w-full">
      {/* Row 1: avatar + name + payment badge */}
      <div className="flex items-center gap-2 min-w-0">
        <div className={cn('w-9 h-9 rounded-xl flex items-center justify-center font-black text-base border-2 shrink-0', avatarCn)}>
          {initialCustomer}
        </div>
        <h3 className="font-sans font-extrabold text-[14px] text-foreground leading-none uppercase tracking-tight flex-1 min-w-0 truncate">
          {customerName}
        </h3>
        <span style={{
          display: 'inline-flex', alignItems: 'center', flexShrink: 0,
          padding: '3px 8px', borderRadius: '99px',
          background: isLunas ? 'rgba(16, 185, 129, 0.1)' : isSebagian ? 'rgba(251,191,36,0.1)' : 'rgba(239,68,68,0.1)',
          color: isLunas ? '#10B981' : isSebagian ? '#D97706' : '#EF4444',
          fontSize: '9px', fontWeight: 900, letterSpacing: '0.05em', textTransform: 'uppercase',
        }}>
          {isLunas ? 'LUNAS' : isSebagian ? 'SEBAGIAN' : 'BELUM LUNAS'}
        </span>
        {/* Expand chevron */}
        <motion.div
          animate={{ rotate: expanded ? 180 : 0 }}
          transition={{ duration: 0.2 }}
          className="shrink-0 text-muted-foreground"
        >
          <ChevronDown size={18} />
        </motion.div>
      </div>
      {/* Row 2: invoice info + delivery badge */}
      <div className="flex items-center justify-between pl-11">
        <p className="text-[11px] font-semibold text-muted-foreground tracking-wide tabular-nums truncate">
          {fmtDateLocal(sale.transaction_date, sale.created_at)}
        </p>
        <span style={{ display: 'inline-flex', alignItems: 'center', gap: '3px', fontSize: '9px', fontWeight: 900, padding: '2px 8px', borderRadius: '99px', background: deliveryBadge.bg, border: `1px solid ${deliveryBadge.border}`, color: deliveryBadge.color, textTransform: 'uppercase', whiteSpace: 'nowrap' }}>
          {deliveryBadge.icon && <span style={{ opacity: 0.7 }}>{deliveryBadge.icon}</span>}
          {deliveryBadge.label}
        </span>
      </div>
    </div>
  )

  // ── Footer (desktop only) ──
  const footer = isDesktop ? (
    <>
      <div className="text-left">
        {isOverpaid && overpayAmount > 0 ? (
          <div className="space-y-1">
            <p className="text-[10px] uppercase font-bold text-[#34D399] tracking-widest leading-none">BALIKIN / DEPOSIT TOKO</p>
            <p className={cn('font-display font-bold text-[#34D399] leading-none mt-1 tabular-nums', valSize)}>
              {fmt(overpayAmount)}
            </p>
          </div>
        ) : isLunas ? (
          <div className="space-y-1">
            <p className="text-[10px] uppercase font-bold text-[#34D399] tracking-widest leading-none">ESTIMASI NET PROFIT</p>
            <p className={cn('font-display font-bold text-[#34D399] leading-none mt-1 tabular-nums', valSize)}>
              {fmt(netProfit)}
            </p>
          </div>
        ) : (
          <div className="space-y-1">
            <div className="flex items-center gap-2">
              <p className="text-[10px] uppercase font-bold text-[#F87171] tracking-widest leading-none">SISA PIUTANG</p>
              {!allDelivered && (
                <button
                  onClick={(e) => { e.stopPropagation(); onManageDelivery?.() }}
                  className="bg-sky-500/20 hover:bg-sky-500/30 text-sky-400 text-[8px] font-black px-1.5 py-0.5 rounded uppercase tracking-tighter active:scale-90 transition-all"
                >
                  Kirim
                </button>
              )}
            </div>
            <p className={cn('font-display font-bold text-[#F87171] tabular-nums leading-none mt-1', valSize)}>
              {fmt(remainingAmount)}
            </p>
          </div>
        )}
      </div>

      <div className="text-right">
        <p className="text-[10px] font-black uppercase tracking-widest leading-none text-[#94A3B8]">TOTAL TAGIHAN</p>
        <p className={cn('font-display font-bold tabular-nums leading-none mt-1.5 text-[#F1F5F9]', valSize)}>
          {fmt(totalAmount)}
        </p>
      </div>
    </>
  ) : undefined

  // ── DESKTOP body — 3 columns ──
  const desktopBody = (
    <div className="grid grid-cols-[1fr_1fr_1.6fr] gap-4">
      {/* Kolom 1: ITEM */}
      <div className="space-y-2 text-left border-r border-white/[0.08] pr-4 min-w-0">
        <p className="text-[10px] font-black text-[#94A3B8] uppercase tracking-widest">Item</p>
        <p className="font-display text-[22px] font-bold text-[#F1F5F9] tabular-nums leading-none">
          {noItems ? '—' : items.length} <span className="text-xs font-normal text-[#94A3B8] ml-0.5">jenis</span>
        </p>
        <div className="space-y-1">
          {topItem && (
            <p className="text-[11px] font-medium text-[#94A3B8] truncate">{topItem.product_name}</p>
          )}
          {noItems
            ? <p className="text-[11px] font-medium text-[#FBBF24]">Buka nota untuk detail</p>
            : <p className="text-[11px] font-medium text-[#94A3B8]">
                Total {netQty} {itemUnit} {totalReturnQty > 0 ? `(-${totalReturnQty} retur)` : ''}
              </p>
          }
        </div>
      </div>

      {/* Kolom 2: TAGIHAN */}
      <div className="space-y-2 text-left border-r border-white/[0.08] pr-4 min-w-0">
        <p className="text-[10px] font-black text-[#94A3B8] uppercase tracking-widest">Tagihan</p>
        <p className="font-display text-[22px] font-bold text-[#F1F5F9] tabular-nums leading-none">
          {fmt(totalAmount)}
        </p>
        <p className="text-[11px] font-medium text-[#94A3B8]">
          Dibayar: <span className="text-[#34D399] font-bold">{fmt(paidAmount)}</span>
        </p>
        {isOverpaid && overpayAmount > 0 ? (
          <p className="text-[11px] font-medium text-[#34D399]">
            Balikin Toko: <span className="font-extrabold">{fmt(overpayAmount)}</span>
          </p>
        ) : (
          <p className="text-[11px] font-medium text-[#94A3B8]">
            Sisa: <span className={cn('font-bold', hasDebt ? 'text-[#F87171]' : 'text-[#34D399]')}>{fmt(remainingAmount)}</span>
          </p>
        )}
      </div>

      {/* Kolom 3: PENGIRIMAN */}
      <div className="space-y-3 text-left min-w-0">
        <p className="text-[10px] font-black text-[#94A3B8] uppercase tracking-widest">Pengiriman</p>
        <div className="grid grid-cols-1 gap-y-3">
          <div className="space-y-1">
            <p className="text-[10px] font-bold text-[#94A3B8] uppercase leading-none">Status Kirim</p>
            <p className="text-[13px] font-black leading-none" style={{ color: deliveryBadge.color }}>
              {deliveryBadge.label}
            </p>
          </div>
          <div className="space-y-1">
            <p className="text-[10px] font-bold text-[#94A3B8] leading-none">Total Trip</p>
            <p className="text-[13px] font-semibold text-[#F1F5F9] tabular-nums leading-none">
              {deliveries.length > 0 ? deliveries.length : '—'}
            </p>
          </div>
          {!allDelivered && (
            <>
              <div className="border-t border-white/5 my-1" />
              <button
                type="button"
                onClick={handleCompleteDelivery}
                className="rounded-xl border border-emerald-500/30 bg-emerald-500/10 px-3 py-2 text-[10px] font-black uppercase tracking-widest text-emerald-400 transition-all hover:bg-emerald-500/20 active:scale-95 w-full text-center flex items-center justify-center gap-1.5"
              >
                ✓ Selesaikan Pengiriman
              </button>
            </>
          )}
        </div>
      </div>
    </div>
  )

  // ── MOBILE body — 2-row compact strip ──
  const mobileBody = (
    <div className="space-y-2.5">
      {/* Row 1: item count + total amount */}
      <div className="flex items-baseline justify-between gap-2 border-b border-slate-100 dark:border-white/5 pb-2">
        <div className="flex items-baseline gap-1 flex-1 min-w-0">
          <span className="text-[14px] font-black text-foreground tabular-nums leading-none">{noItems ? '—' : items.length}</span>
          <span className="text-[11px] font-bold text-muted-foreground leading-none">jenis</span>
          <span className="text-[11px] text-muted-foreground leading-none mx-0.5">·</span>
          <span className="text-[14px] font-black text-foreground tabular-nums leading-none">{noItems ? '—' : netQty}</span>
          <span className="text-[11px] font-bold text-muted-foreground leading-none">
            {itemUnit}{totalReturnQty > 0 ? ` (-${totalReturnQty})` : ''}
          </span>
        </div>
        <span className="font-sans text-[16px] font-black text-foreground tabular-nums leading-none shrink-0">
          {expanded ? formatIDR(totalAmount) : formatIDRShort(totalAmount)}
        </span>
      </div>

      {/* Row 2: top product + payment summary */}
      <div className="flex items-center justify-between gap-2">
        <span className="text-[12px] font-semibold text-muted-foreground truncate flex-1">
          {topItem?.product_name || '—'}
        </span>
        {isOverpaid && overpayAmount > 0 ? (
          <span className="text-[12px] font-black text-emerald-500 shrink-0">
            Balikin {expanded ? formatIDR(overpayAmount) : formatIDRShort(overpayAmount)}
          </span>
        ) : isLunas ? (
          <span className="text-[12px] font-black text-emerald-500 shrink-0">✓ Lunas</span>
        ) : (
          <span className="text-[12px] font-black text-red-500 tabular-nums shrink-0">
            Sisa {expanded ? formatIDR(remainingAmount) : formatIDRShort(remainingAmount)}
          </span>
        )}
      </div>
    </div>
  )

  const handleCardClick = isDesktop
    ? onOpenDetail
    : () => setExpanded(v => !v)

  return (
    <>
      <BrokerBaseCard
        onClick={handleCardClick}
        isLoss={false}
        header={isDesktop ? desktopHeader : mobileHeader}
        footer={footer}
        isDesktop={isDesktop}
      >
        {isDesktop ? desktopBody : (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
            {mobileBody}

            <AnimatePresence>
              {!isDesktop && expanded && (
                <motion.div
                  initial={{ opacity: 0, height: 0 }}
                  animate={{ opacity: 1, height: 'auto' }}
                  exit={{ opacity: 0, height: 0 }}
                  transition={{ duration: 0.25, ease: [0.25, 0.46, 0.45, 0.94] }}
                  style={{ overflow: 'hidden' }}
                >
                  <div style={{ borderTop: '1px solid var(--border-soft)', paddingTop: '12px', marginTop: '4px' }}>
                    <SaleItemsPanel sale={sale} onOpenDetail={onOpenDetail} onEdit={onEdit} />
                  </div>
                </motion.div>
              )}
            </AnimatePresence>
          </div>
        )}
      </BrokerBaseCard>

      <DeliveryCompletionModal
        isOpen={deliveryConfirmModal}
        onClose={() => setDeliveryConfirmModal(false)}
        sale={sale}
        delivery={deliveries.find(d => d.status !== 'delivered') || deliveries[0]}
      />
    </>
  )
}
