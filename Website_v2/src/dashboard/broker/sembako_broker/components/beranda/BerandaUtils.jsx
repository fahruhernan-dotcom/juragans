// BerandaUtils.js — shared constants, helpers, dan shared mini-components
// Tidak ada React state — import-safe dari semua komponen beranda

import { formatIDR } from '@/lib/format'
import { C } from '../sembakoSaleUtils'

// ── Date formatter ─────────────────────────────────────────────────────────────
export function fmtDate(d) {
  if (!d) return '-'
  try { return new Date(d).toLocaleDateString('id-ID', { day: '2-digit', month: 'short' }) }
  catch { return '-' }
}

// ── Payment status styles ──────────────────────────────────────────────────────
export const STATUS_STYLE = {
  lunas:       { bg: 'rgba(16, 185, 129, 0.1)',  color: '#34D399', label: 'Lunas',       border: 'rgba(16, 185, 129, 0.2)' },
  sebagian:    { bg: 'rgba(245, 158, 11, 0.1)',  color: '#FBBF24', label: 'Sebagian',    border: 'rgba(245, 158, 11, 0.2)' },
  belum_lunas: { bg: 'rgba(239, 68, 68, 0.1)',   color: '#F87171', label: 'Belum Lunas', border: 'rgba(239, 68, 68, 0.2)' },
}

// ── Skeleton ───────────────────────────────────────────────────────────────────
export function Skel({ h = '60px', w = '100%', r = '14px' }) {
  return (
    <div className="animate-pulse" style={{ background: '#E2E8F0', borderRadius: r, height: h, width: w }} />
  )
}

export function BerandaSkeleton({ isDesktop }) {
  if (isDesktop) {
    return (
      <div style={{ padding: '28px 32px', display: 'flex', flexDirection: 'column', gap: '20px' }}>
        <Skel h="22px" w="160px" r="8px" />
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: '12px' }}>
          {[...Array(4)].map((_, i) => <Skel key={i} h="88px" r="18px" />)}
        </div>
        <div style={{ display: 'grid', gridTemplateColumns: '2fr 1fr', gap: '16px' }}>
          <Skel h="260px" r="20px" />
          <Skel h="260px" r="20px" />
        </div>
        <Skel h="200px" r="20px" />
      </div>
    )
  }
  return (
    <div>
      <div style={{ background: '#F8FAFC', height: '60px', borderBottom: '1px solid rgba(15,23,42,0.06)' }} />
      <div style={{ padding: '16px', display: 'flex', flexDirection: 'column', gap: '12px' }}>
        <Skel h="20px" w="55%" r="8px" />
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '10px' }}>
          {[...Array(4)].map((_, i) => <Skel key={i} h="72px" r="14px" />)}
        </div>
        <Skel h="180px" r="20px" />
        {[...Array(3)].map((_, i) => <Skel key={i} h="78px" r="16px" />)}
      </div>
    </div>
  )
}

// ── KPI Card ───────────────────────────────────────────────────────────────────
import { Card } from '@/components/ui/card'
import { motion } from 'framer-motion'

const MC = {
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

export function KPICard({ icon: Icon, label, value, sub, accentColor = MC.accent, urgent, badge, trend }) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 8 }}
      animate={{ opacity: 1, y: 0 }}
      whileHover={{ y: -2 }}
      transition={{ type: 'spring', stiffness: 400, damping: 25 }}
      style={{ display: 'flex', flex: 1, cursor: 'default' }}
    >
      <Card
        style={{
          background: MC.card,
          borderRadius: '16px',
          padding: '14px 16px',
          border: `1px solid ${MC.border}`,
          display: 'flex',
          flexDirection: 'column',
          justifyContent: 'flex-start',
          gap: '8px',
          position: 'relative',
          overflow: 'hidden',
          boxShadow: '0 1px 3px rgba(0,0,0,0.05), 0 1px 2px rgba(0,0,0,0.03)',
          fontFamily: "'Sora', 'Inter', sans-serif",
          width: '100%',
          transition: 'border-color 0.2s ease',
        }}
      >
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: '8px' }}>
          <p style={{
            fontSize: '11px', color: MC.muted, fontWeight: 700,
            letterSpacing: '0.04em', textTransform: 'uppercase',
            lineHeight: 1.3,
            fontFamily: "'Sora', 'Inter', sans-serif"
          }}>{label}</p>
          <div style={{
            width: '36px', height: '36px', borderRadius: '11px', flexShrink: 0,
            background: MC.input,
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            border: `1px solid ${MC.border}`,
          }}>
            <Icon size={18} color="#475569" />
          </div>
        </div>

        <div>
          <p style={{
            fontSize: '22px', fontWeight: 800, color: MC.text,
            lineHeight: 1.2, fontFamily: "'Sora', 'Inter', sans-serif",
            overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap',
            letterSpacing: '-0.02em',
          }}>{value}</p>
          {sub && (
            <p style={{
              fontSize: '10px', color: urgent ? MC.red : MC.muted, marginTop: '3px', lineHeight: 1.4,
              fontWeight: 650, display: '-webkit-box', WebkitLineClamp: 2, WebkitBoxOrient: 'vertical', overflow: 'hidden',
              fontFamily: "'Sora', 'Inter', sans-serif"
            }}>{sub}</p>
          )}
        </div>

        {(trend != null || !!badge) && (
          <div style={{ paddingTop: '8px', borderTop: `1px solid ${MC.border}60`, marginTop: 'auto' }}>
            <span style={{
              display: 'inline-flex', alignItems: 'center', gap: '4px',
              background: MC.input,
              color: trend != null ? (trend >= 0 ? MC.green : MC.red) : MC.amber,
              fontSize: '10px', fontWeight: 800, padding: '3px 8px',
              borderRadius: '6px', letterSpacing: '0.02em', whiteSpace: 'nowrap',
              border: `1px solid ${MC.border}`,
              fontFamily: "'Sora', 'Inter', sans-serif"
            }}>
              {trend != null
                ? `${trend >= 0 ? '↑' : '↓'} ${Math.abs(trend).toFixed(0)}% bln lalu`
                : badge}
            </span>
          </div>
        )}
      </Card>
    </motion.div>
  )
}

// ── Invoice Row ────────────────────────────────────────────────────────────────
export function InvoiceRow({ sale, onClick }) {
  const st = STATUS_STYLE[sale.payment_status] || STATUS_STYLE.belum_lunas
  const name = sale.sembako_customers?.customer_name || sale.customer_name || '-'
  return (
    <div
      onClick={onClick}
      style={{
        background: MC.card, borderRadius: '12px', padding: '10px 12px',
        display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: '10px',
        cursor: onClick ? 'pointer' : 'default',
        border: `1px solid ${MC.border}`,
        boxShadow: '0 1px 2px rgba(0,0,0,0.03)',
      }}
    >
      <div style={{ minWidth: 0, flex: 1 }}>
        <p style={{ fontSize: '13px', fontWeight: 700, color: MC.text, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{name}</p>
        <p style={{ fontSize: '11px', color: MC.muted, marginTop: '1px' }}>{fmtDate(sale.transaction_date)}</p>
      </div>
      <div style={{ textAlign: 'right', flexShrink: 0 }}>
        <p style={{ fontSize: '13px', fontWeight: 700, color: MC.text }}>{formatIDR(sale.total_amount)}</p>
        <span style={{
          display: 'inline-block', marginTop: '2px',
          background: st.bg, color: st.color,
          fontSize: '9px', fontWeight: 900, padding: '1px 5px', borderRadius: '4px',
          border: st.border ? `1px solid ${st.border}` : 'none',
        }}>{st.label}</span>
      </div>
    </div>
  )
}

// ── QuickStat Row ──────────────────────────────────────────────────────────────
export function QuickStatRow({ label, value }) {
  return (
    <div style={{
      display: 'flex', alignItems: 'center', justifyContent: 'space-between',
      padding: '8px 12px', background: MC.input, borderRadius: '10px',
      border: `1px solid ${MC.border}`,
    }}>
      <span style={{ fontSize: '12px', color: MC.muted, fontWeight: 650 }}>{label}</span>
      <span style={{ fontSize: '13px', fontWeight: 800, color: MC.text }}>{value}</span>
    </div>
  )
}

// ── Chart Tooltip (Sales Performance Chart) ──────────────────────────────────
export function ChartTooltip({ active, payload }) {
  if (!active || !payload?.length) return null
  const d = payload[0].payload
  const cashIn = d.cashIn || 0
  const cashOut = d.cashOut || 0
  const netFlow = cashIn - cashOut
  const grossProfit = d.grossProfit || 0
  const netProfit = d.netProfit || 0

  // Lists
  const dayPayments = d.dayPayments || []
  const daySupplierPayments = d.daySupplierPayments || []
  const dayExpenses = d.dayExpenses || []
  const dayPayroll = d.dayPayroll || []

  return (
    <div style={{
      background: MC.card, border: `1px solid ${MC.border}`, borderRadius: '14px',
      padding: '12px 14px', minWidth: '250px', maxWidth: '300px', boxShadow: '0 4px 12px rgba(0,0,0,0.08)',
      color: MC.text,
      fontFamily: "'Sora', 'Inter', sans-serif"
    }}>
      <p style={{ fontSize: '10px', color: MC.muted, fontWeight: 700, marginBottom: '10px', letterSpacing: '0.05em' }}>{d.fullDate}</p>

      {/* ── PROFIT (AKRUAL) ── */}
      <div style={{ marginBottom: '12px' }}>
        <p style={{ fontSize: '9px', color: MC.muted, fontWeight: 700, letterSpacing: '0.08em', marginBottom: '5px' }}>PROFIT (AKRUAL)</p>
        
        {/* Gross Profit */}
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '3px' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '5px' }}>
            <span style={{ width: '8px', height: '8px', borderRadius: '50%', background: '#10B981', display: 'inline-block' }} />
            <span style={{ fontSize: '10px', color: MC.muted, fontWeight: 600 }}>Gross Profit</span>
          </div>
          <span style={{ fontSize: '12px', fontWeight: 800, color: '#10B981' }}>{formatIDR(grossProfit)}</span>
        </div>

        {/* Net Profit */}
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '3px' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '5px' }}>
            <span style={{ width: '8px', height: '8px', borderRadius: '50%', background: '#0F172A', display: 'inline-block' }} />
            <span style={{ fontSize: '10px', color: MC.muted, fontWeight: 600 }}>Net Profit</span>
          </div>
          <span style={{ fontSize: '12px', fontWeight: 800, color: '#0F172A' }}>{formatIDR(netProfit)}</span>
        </div>
      </div>

      {/* ── ARUS KAS (RIIL) ── */}
      <div style={{ marginBottom: '12px', borderTop: `1px solid ${MC.border}`, paddingTop: '8px' }}>
        <p style={{ fontSize: '9px', color: MC.muted, fontWeight: 700, letterSpacing: '0.08em', marginBottom: '5px' }}>ARUS KAS (RIIL)</p>
        
        {/* Uang Masuk */}
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '4px' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '5px' }}>
            <span style={{ width: '8px', height: '8px', borderRadius: '50%', background: '#16A34A', display: 'inline-block' }} />
            <span style={{ fontSize: '10px', color: MC.muted, fontWeight: 600 }}>Uang Masuk</span>
          </div>
          <span style={{ fontSize: '12px', fontWeight: 800, color: '#16A34A' }}>{formatIDR(cashIn)}</span>
        </div>
        
        {dayPayments.length > 0 && (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '3px', paddingLeft: '13px', marginBottom: '8px' }}>
            {dayPayments.slice(0, 2).map((p, i) => (
              <div key={p.id || i} style={{ display: 'flex', justifyContent: 'space-between', fontSize: '8px', color: MC.text }}>
                <span style={{ overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', maxWidth: '140px' }}>
                  {p.customerName}
                </span>
                <span style={{ fontWeight: 600 }}>{formatIDR(p.amount)}</span>
              </div>
            ))}
            {dayPayments.length > 2 && (
              <p style={{ fontSize: '8px', color: MC.muted, fontStyle: 'italic' }}>+{dayPayments.length - 2} pembayaran lainnya</p>
            )}
          </div>
        )}

        {/* Uang Keluar */}
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '4px' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '5px' }}>
            <span style={{ width: '8px', height: '8px', borderRadius: '50%', background: '#DC2626', display: 'inline-block' }} />
            <span style={{ fontSize: '10px', color: MC.muted, fontWeight: 600 }}>Uang Keluar</span>
          </div>
          <span style={{ fontSize: '12px', fontWeight: 800, color: '#DC2626' }}>{formatIDR(cashOut)}</span>
        </div>

        {cashOut > 0 && (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '4px', paddingLeft: '13px', marginTop: '6px' }}>
            {/* Supplier / Stok Purchases */}
            {d.cashOutPurchases > 0 && (
              <div>
                <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '9px', color: MC.text, fontWeight: 700 }}>
                  <span>Bayar Supplier</span>
                  <span>{formatIDR(d.cashOutPurchases)}</span>
                </div>
                {daySupplierPayments.slice(0, 1).map((sp, i) => (
                  <div key={sp.id || i} style={{ display: 'flex', justifyContent: 'space-between', fontSize: '8px', color: MC.muted, paddingLeft: '10px' }}>
                    <span>{sp.label}</span>
                    <span>{formatIDR(sp.amount)}</span>
                  </div>
                ))}
              </div>
            )}

            {/* Expenses */}
            {d.cashOutExpenses > 0 && (
              <div>
                <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '9px', color: MC.text, fontWeight: 700 }}>
                  <span>Biaya Operasional</span>
                  <span>{formatIDR(d.cashOutExpenses)}</span>
                </div>
                {dayExpenses.slice(0, 1).map((ex, i) => (
                  <div key={ex.id || i} style={{ display: 'flex', justifyContent: 'space-between', fontSize: '8px', color: MC.muted, paddingLeft: '10px' }}>
                    <span style={{ overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', maxWidth: '130px' }}>{ex.label}</span>
                    <span>{formatIDR(ex.amount)}</span>
                  </div>
                ))}
              </div>
            )}

            {/* Payroll */}
            {d.cashOutPayroll > 0 && (
              <div>
                <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '9px', color: MC.text, fontWeight: 700 }}>
                  <span>Gaji Karyawan</span>
                  <span>{formatIDR(d.cashOutPayroll)}</span>
                </div>
                {dayPayroll.slice(0, 1).map((pr, i) => (
                  <div key={pr.id || i} style={{ display: 'flex', justifyContent: 'space-between', fontSize: '8px', color: MC.muted, paddingLeft: '10px' }}>
                    <span>{pr.label}</span>
                    <span>{formatIDR(pr.amount)}</span>
                  </div>
                ))}
              </div>
            )}

            {/* COGS / Modal Barang */}
            {d.cashOutCogs > 0 && (
              <div>
                <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '9px', color: MC.text, fontWeight: 700 }}>
                  <span>Modal Barang (COGS)</span>
                  <span>{formatIDR(d.cashOutCogs)}</span>
                </div>
              </div>
            )}

            {/* Delivery Cost */}
            {d.cashOutDelivery > 0 && (
              <div>
                <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '9px', color: MC.text, fontWeight: 700 }}>
                  <span>Biaya Kirim & Lainnya</span>
                  <span>{formatIDR(d.cashOutDelivery)}</span>
                </div>
              </div>
            )}
          </div>
        )}
      </div>

      {/* Net Surplus / Deficit */}
      <div style={{
        borderTop: `1px solid ${MC.border}`,
        paddingTop: '8px',
        marginTop: '8px',
        display: 'flex',
        justifyContent: 'space-between',
        alignItems: 'center',
        fontSize: '10px'
      }}>
        <span style={{ fontWeight: 700, color: MC.muted }}>Selisih Kas</span>
        <span style={{
          fontWeight: 900,
          color: netFlow >= 0 ? '#16A34A' : '#DC2626',
          background: netFlow >= 0 ? 'rgba(22,163,74,0.06)' : 'rgba(220,38,38,0.06)',
          padding: '2px 6px',
          borderRadius: '5px',
          border: netFlow >= 0 ? '1px solid rgba(22,163,74,0.12)' : '1px solid rgba(220,38,38,0.12)'
        }}>
          {netFlow >= 0 ? '+' : ''}{formatIDR(netFlow)}
        </span>
      </div>
    </div>
  )
}

// ── Stock Chart Tooltip ────────────────────────────────────────────────────────
export function StockChartTooltip({ active, payload, label }) {
  if (!active || !payload?.length) return null
  const d = payload[0]?.payload || {}
  const stok = d.stok || 0
  const ads = Number(d.ads) || 0
  const doi = d.doi
  const statusLabel = d.statusLabel || 'Aman'
  const color = d.color || '#16A34A'
  const modalTertahan = d.modalTertahan || 0
  const potensiOmzet = d.potensiOmzet || 0
  const recSupplierName = d.recSupplierName
  const recStatusText = d.recStatusText
  const reorderQty = d.reorderQty || 0
  const unit = d.unit || 'unit'

  return (
    <div style={{
      background: MC.card, border: `1px solid ${MC.border}`, borderRadius: '12px',
      padding: '12px 14px', minWidth: '220px', boxShadow: '0 4px 12px rgba(0,0,0,0.08)',
      fontFamily: "'Sora', 'Inter', sans-serif"
    }}>
      <p style={{ fontSize: '12px', fontWeight: 800, color: MC.text, marginBottom: '6px' }}>{d.fullName || label}</p>
      <div style={{ display: 'flex', flexDirection: 'column', gap: '4px' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', gap: '12px', fontSize: '11px' }}>
          <span style={{ color: MC.muted }}>Stok Fisik</span>
          <span style={{ color: MC.text, fontWeight: 700 }}>{stok} {unit}</span>
        </div>
        <div style={{ display: 'flex', justifyContent: 'space-between', gap: '12px', fontSize: '11px' }}>
          <span style={{ color: MC.muted }}>Status</span>
          <span style={{ color: color, fontWeight: 800 }}>{statusLabel}</span>
        </div>
        <div style={{ display: 'flex', justifyContent: 'space-between', gap: '12px', fontSize: '11px' }}>
          <span style={{ color: MC.muted }}>Estimasi Habis</span>
          <span style={{ color: color, fontWeight: 700 }}>
            {doi === 999 ? '∞ Aman (Tidak Bergerak)' : `${doi.toFixed(1)} hari lagi`}
          </span>
        </div>
        <div style={{ display: 'flex', justifyContent: 'space-between', gap: '12px', fontSize: '11px' }}>
          <span style={{ color: MC.muted }}>Kecepatan Keluar</span>
          <span style={{ color: MC.text, fontWeight: 600 }}>{ads.toFixed(1)} {unit}/hari</span>
        </div>

        <div style={{ borderTop: `1px solid ${MC.border}`, paddingTop: '6px', marginTop: '4px', display: 'flex', flexDirection: 'column', gap: '3px' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', gap: '12px', fontSize: '11px' }}>
            <span style={{ color: MC.muted }}>Modal Tertahan</span>
            <span style={{ color: MC.text, fontWeight: 700 }}>{formatIDR(modalTertahan)}</span>
          </div>
          <div style={{ display: 'flex', justifyContent: 'space-between', gap: '12px', fontSize: '11px' }}>
            <span style={{ color: MC.muted }}>Potensi Omzet</span>
            <span style={{ color: MC.green, fontWeight: 700 }}>{formatIDR(potensiOmzet)}</span>
          </div>
        </div>

        {reorderQty > 0 && recSupplierName && (
          <div style={{ borderTop: '1px solid rgba(15,23,42,0.12)', paddingTop: '6px', marginTop: '4px', background: 'rgba(15,23,42,0.05)', borderRadius: '6px', padding: '6px 8px' }}>
            <p style={{ fontSize: '9px', fontWeight: 800, color: '#475569', textTransform: 'uppercase', marginBottom: '2px' }}>💡 REKOMENDASI PEMBELIAN</p>
            <p style={{ fontSize: '10px', color: '#1e293b', lineHeight: '1.3', fontWeight: 500 }}>
              Pesan <strong style={{ color: '#0F172A' }}>±{reorderQty} {unit}</strong> ke <strong style={{ color: '#0F172A' }}>{recSupplierName}</strong> ({recStatusText})
            </p>
          </div>
        )}
      </div>
    </div>
  )
}
