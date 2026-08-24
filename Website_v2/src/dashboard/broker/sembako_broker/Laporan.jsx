import React, { useState, useMemo } from 'react'
import { useOutletContext, Link } from 'react-router-dom'
import { BrokerMobileHeader } from '@/dashboard/broker/_shared/components/BrokerMobileHeader'
import { motion } from 'framer-motion'
import {
  TrendingUp, TrendingDown, DollarSign, Receipt,
  ChevronDown, ChevronUp, Calendar, Lock, BarChart3, Printer, FileText,
  Package, ShoppingBag, ArrowUpRight, ArrowDownRight, Layers
} from 'lucide-react'
import FinancialReportPdfModal from '@/dashboard/broker/sembako_broker/components/FinancialReportPdfModal'
import { SembakoAuditLogView } from '@/dashboard/broker/sembako_broker/components/SembakoAuditLogView'
import { useAuth } from '@/lib/hooks/useAuth'
import { getSubscriptionStatus } from '@/lib/subscriptionUtils'
import { canViewProfit } from '@/lib/auth/business-roles'
import {
  PieChart, Pie, Cell, ResponsiveContainer, Tooltip,
} from 'recharts'
import { useSembakoLaporan } from '@/lib/hooks/useSembakoData'
import { useMediaQuery } from '@/lib/hooks/useMediaQuery'
import { formatIDR } from '@/lib/format'
import { DatePicker } from '@/components/ui/DatePicker'
import { C, fmtDate, CustomSelect } from '@/dashboard/broker/sembako_broker/components/sembakoSaleUtils'
import { SembakoErrorState } from '@/dashboard/broker/sembako_broker/components/SembakoUiPrimitives'
import { cn } from '@/lib/utils'

const PIE_COLORS = ['#0F172A', '#F59E0B', '#10B981', '#3B82F6', '#8B5CF6', '#EC4899', '#F97316']
const CATEGORY_LABEL = {
  sewa_gudang: 'Sewa Gudang', listrik_air: 'Listrik & Air', bbm: 'BBM',
  perawatan: 'Perawatan', packaging: 'Packaging', administrasi: 'Administrasi', lainnya: 'Lainnya',
}
const STATUS_STYLE = {
  lunas: { bg: 'rgba(16,185,129,0.12)', color: '#10B981', label: 'Lunas' },
  sebagian: { bg: 'rgba(245,158,11,0.12)', color: '#F59E0B', label: 'Sebagian' },
  belum_lunas: { bg: 'rgba(239,68,68,0.12)', color: '#EF4444', label: 'Belum Lunas' },
}

// ── MAIN ────────────────────────────────────────────────────────────────────
export default function SembakoLaporan() {
  const isDesktop = useMediaQuery('(min-width: 1024px)')
  const { setSidebarOpen = () => window.dispatchEvent(new Event('toggleMobileSidebar')) } = useOutletContext() || {}
  const { tenant, profile } = useAuth()
  const sub = getSubscriptionStatus(tenant)
  const isStarter = sub.status !== 'active' && sub.status !== 'trial'
  const isAllowed = canViewProfit(profile)

  const now = new Date()

  // Default ke bulan berjalan agar first load cepat dan relevan
  const bulanStart = new Date(now.getFullYear(), now.getMonth(), 1).toISOString().slice(0, 10)
  const bulanEnd = new Date(now.getFullYear(), now.getMonth() + 1, 0).toISOString().slice(0, 10)

  const [startDate, setStartDate] = useState(bulanStart)
  const [endDate, setEndDate] = useState(bulanEnd)
  const [preset, setPreset] = useState('bulan_ini')
  const [activeMainTab, setActiveMainTab] = useState('keuangan') // 'keuangan' | 'audit'
  const [pdfModal, setPdfModal] = useState({ open: false, type: 'business_result' })

  const { data, isLoading, isFetching, isError, error, refetch } = useSembakoLaporan(startDate, endDate)

  // ── Role Access Wall — Khusus Owner & Dev ──────────────────────────────────
  if (!isAllowed) {
    return (
      <div style={{ background: C.bg, minHeight: '100vh' }}>
        {!isDesktop && <BrokerMobileHeader title="Laporan Bisnis" onMenuClick={() => setSidebarOpen(true)} />}
        <div className="flex flex-col items-center justify-center min-h-[80vh] px-6 text-center gap-6">
          <div className="w-16 h-16 rounded-2xl flex items-center justify-center bg-amber-500/10 border border-amber-500/20 text-amber-500">
            <Lock size={28} />
          </div>
          <div>
            <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full mb-3 bg-amber-500/10 border border-amber-500/20 text-amber-400">
              <BarChart3 size={11} />
              <span className="text-[10px] font-black uppercase tracking-widest">Khusus Owner</span>
            </div>
            <h2 className="font-display font-black text-xl text-white mb-2">Akses Terbatas</h2>
            <p className="text-sm max-w-xs leading-relaxed text-slate-400">
              Laporan Keuangan & Analisis Laba Bisnis hanya dapat diakses oleh akun <span className="text-white font-bold">Pemilik Toko (Owner)</span>.
            </p>
          </div>
        </div>
      </div>
    )
  }

  // ── Upgrade wall ─────────────────────────────────────────────────────────
  if (isStarter) {
    return (
      <div style={{ background: C.bg, minHeight: '100vh' }}>
        {!isDesktop && <BrokerMobileHeader title="Laporan" onMenuClick={() => setSidebarOpen(true)} />}
        <div className="flex flex-col items-center justify-center min-h-[80vh] px-6 text-center gap-6">
          <div className="w-16 h-16 rounded-2xl flex items-center justify-center"
            style={{ background: 'rgba(15,23,42,0.12)', border: '1px solid rgba(15,23,42,0.25)' }}>
            <Lock size={28} style={{ color: '#0F172A' }} />
          </div>
          <div>
            <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full mb-3"
              style={{ background: 'rgba(15,23,42,0.1)', border: '1px solid rgba(15,23,42,0.2)' }}>
              <BarChart3 size={11} style={{ color: '#0F172A' }} />
              <span className="text-[10px] font-black uppercase tracking-widest" style={{ color: '#0F172A' }}>Fitur Pro</span>
            </div>
            <h2 className="font-display font-black text-xl text-white mb-2">Laporan Keuangan</h2>
            <p className="text-sm max-w-xs leading-relaxed" style={{ color: '#64748B' }}>
              Akses laporan P&L, analitik pengeluaran, dan breakdown omzet tersedia di plan{' '}
              <span className="text-white font-bold">Pro</span> dan <span className="text-white font-bold">Business</span>.
            </p>
          </div>
          <Link
            to="/upgrade"
            className="inline-flex items-center gap-2 px-6 py-3 rounded-xl font-black text-sm text-white transition-colors"
            style={{ background: '#0F172A', boxShadow: '0 4px 20px rgba(15,23,42,0.3)' }}
          >
            Lihat Paket Pro →
          </Link>
        </div>
      </div>
    )
  }

  const handlePresetChange = (val) => {
    setPreset(val)
    const t = new Date()
    if (val === 'hari_ini') {
      const d = t.toISOString().slice(0, 10)
      setStartDate(d)
      setEndDate(d)
    } else if (val === 'minggu_ini') {
      const d = new Date(t)
      const day = d.getDay()
      const diff = d.getDate() - day + (day === 0 ? -6 : 1) // Monday
      const start = new Date(d.setDate(diff))
      const end = new Date(start)
      end.setDate(start.getDate() + 6)
      setStartDate(start.toISOString().slice(0, 10))
      setEndDate(end.toISOString().slice(0, 10))
    } else if (val === 'bulan_ini') {
      const start = new Date(t.getFullYear(), t.getMonth(), 1)
      const end = new Date(t.getFullYear(), t.getMonth() + 1, 0)
      setStartDate(start.toISOString().slice(0, 10))
      setEndDate(end.toISOString().slice(0, 10))
    } else if (val === 'bulan_lalu') {
      // 1st of previous month to last of previous month
      const start = new Date(t.getFullYear(), t.getMonth() - 1, 1)
      const end = new Date(t.getFullYear(), t.getMonth(), 0)
      setStartDate(start.toISOString().slice(0, 10))
      setEndDate(end.toISOString().slice(0, 10))
    } else if (val === '3_bulan_terakhir') {
      // 1st of 2 months ago to last day of this month
      const start = new Date(t.getFullYear(), t.getMonth() - 2, 1)
      const end = new Date(t.getFullYear(), t.getMonth() + 1, 0)
      setStartDate(start.toISOString().slice(0, 10))
      setEndDate(end.toISOString().slice(0, 10))
    } else if (val === 'keseluruhan') {
      const start = tenant?.created_at ? new Date(tenant.created_at).toISOString().slice(0, 10) : '2024-01-01'
      const end = t.toISOString().slice(0, 10)
      setStartDate(start)
      setEndDate(end)
    }
  }

  const s = data?.summary || {}

  return (
    <div className="bg-background min-h-screen text-foreground pb-48 sm:pb-24 text-left">
      {!isDesktop && <BrokerMobileHeader title="Laporan & Audit" onMenuClick={() => setSidebarOpen(true)} />}
      
      <div className="mx-auto max-w-7xl px-3.5 sm:px-6 pt-3 sm:pt-6">

        {/* ── Segmented Main Tab Switch (Keuangan vs Audit) ── */}
        <div className="flex items-center gap-1.5 p-1 bg-muted rounded-2xl border border-border/60 w-fit mb-5 shadow-sm">
          <button
            type="button"
            onClick={() => setActiveMainTab('keuangan')}
            className={cn(
              "px-4 py-2 rounded-xl text-xs font-black uppercase tracking-wider transition-all cursor-pointer select-none",
              activeMainTab === 'keuangan'
                ? "bg-[#0F172A] text-white dark:bg-tko-brand-500 dark:text-tko-forest-950 shadow-sm"
                : "text-muted-foreground hover:text-foreground"
            )}
          >
            📊 Laporan Keuangan
          </button>
          <button
            type="button"
            onClick={() => setActiveMainTab('audit')}
            className={cn(
              "px-4 py-2 rounded-xl text-xs font-black uppercase tracking-wider transition-all cursor-pointer select-none flex items-center gap-1.5",
              activeMainTab === 'audit'
                ? "bg-[#0F172A] text-white dark:bg-tko-brand-500 dark:text-tko-forest-950 shadow-sm"
                : "text-muted-foreground hover:text-foreground"
            )}
          >
            🛡️ Log & Audit Aktivitas
          </button>
        </div>

        {activeMainTab === 'audit' ? (
          <div className="pt-2">
            <div className="mb-6">
              <h1 className="text-2xl font-bold text-foreground tracking-tight">
                Log Audit & Jejak Aktivitas
              </h1>
              <p className="text-xs text-muted-foreground mt-0.5">
                Pengawasan internal: Riwayat penghapusan mitra, perubahan profil, penyesuaian stok & transaksi
              </p>
            </div>
            <SembakoAuditLogView />
          </div>
        ) : (
          <>
            {/* ── Top Header & Filter Controls ── */}
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-3 sm:gap-4 mb-5 sm:mb-6">
              <div>
                <h1 className="hidden md:block text-2xl font-bold text-foreground tracking-tight">
                  Laporan Keuangan & Hasil Bisnis
                </h1>
                <p className="hidden md:block text-xs text-muted-foreground mt-0.5">
                  Analisis performa omzet, HPP, margin & likuiditas kas toko
                </p>
              </div>

              <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-2.5 w-full md:w-auto">
                {/* Preset Selector */}
                <div className="w-full sm:w-44">
                  <CustomSelect
                    value={preset}
                    onChange={handlePresetChange}
                    options={[
                      { value: 'hari_ini', label: 'Hari Ini' },
                      { value: 'minggu_ini', label: 'Minggu Ini' },
                      { value: 'bulan_ini', label: 'Bulan Ini' },
                      { value: 'bulan_lalu', label: 'Bulan Kemarin' },
                      { value: '3_bulan_terakhir', label: '3 Bulan Terakhir' },
                      { value: 'keseluruhan', label: 'Keseluruhan' },
                      { value: 'custom', label: 'Kustom Tanggal' }
                    ]}
                    placeholder="Pilih Rentang"
                  />
                </div>

                {/* Custom Date Pickers */}
                {preset === 'custom' && (
                  <div className="grid grid-cols-2 sm:flex items-center gap-2">
                    <DatePicker id="start-date" value={startDate} onChange={val => setStartDate(val)} placeholder="Mulai" />
                    <DatePicker id="end-date" value={endDate} onChange={val => setEndDate(val)} placeholder="Sampai" />
                  </div>
                )}

                {/* PDF Report Export Buttons */}
                <div className="grid grid-cols-2 sm:flex items-center gap-2 shrink-0">
                  <button
                    type="button"
                    onClick={() => setPdfModal({ open: true, type: 'business_result' })}
                    disabled={!data}
                    className="flex items-center justify-center gap-1.5 px-3 h-10 rounded-xl font-bold text-xs bg-slate-900 hover:bg-slate-800 text-white transition-all cursor-pointer shadow-md shadow-slate-900/10 active:scale-95 disabled:opacity-50 border-0"
                  >
                    <Printer size={13} />
                    <span className="truncate">PDF Hasil Bisnis</span>
                  </button>
                  <button
                    type="button"
                    onClick={() => setPdfModal({ open: true, type: 'cashflow' })}
                    disabled={!data}
                    className="flex items-center justify-center gap-1.5 px-3 h-10 rounded-xl font-bold text-xs bg-card border border-border/70 hover:bg-muted text-foreground transition-all cursor-pointer disabled:opacity-50"
                  >
                    <FileText size={13} className="text-slate-500" />
                    <span className="truncate">PDF Arus Kas</span>
                  </button>
                </div>
              </div>
            </div>

        {isLoading ? <LoadingSkeleton /> : isError ? (
          <SembakoErrorState error={error} onRetry={refetch} />
        ) : !data ? (
          <p style={{ color: C.muted, textAlign: 'center', padding: '60px 0' }}>Pilih rentang tanggal untuk melihat laporan</p>
        ) : (
          <div style={{ position: 'relative' }}>
            {/* Overlay saat ganti periode / refetch */}
            {isFetching && !isLoading && (
              <div style={{ position: 'absolute', inset: 0, zIndex: 10, background: 'rgba(6,9,15,0.55)', borderRadius: 16, display: 'flex', alignItems: 'center', justifyContent: 'center', backdropFilter: 'blur(2px)' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 10, background: '#F8FAFC', border: '1px solid rgba(15,23,42,0.12)', borderRadius: 12, padding: '10px 20px' }}>
                  <div style={{ width: 16, height: 16, borderRadius: '50%', border: '2px solid rgba(15,23,42,0.2)', borderTopColor: '#0F172A', animation: 'spin 0.7s linear infinite' }} />
                  <span style={{ fontFamily: 'DM Sans', fontSize: 13, color: '#0F172A', fontWeight: 600 }}>Memuat data...</span>
                </div>
              </div>
            )}
            <style>{`@keyframes spin{to{transform:rotate(360deg)}}`}</style>
            <>
              {/* SECTION A — KPI Summary Cards */}
              <div className="grid grid-cols-2 lg:grid-cols-4 gap-2.5 sm:gap-3 mb-5 sm:mb-6">
                <KPICard icon={DollarSign} label="Revenue (Akrual)" value={formatIDR(s.totalRevenue)} color={C.accent} />
                <KPICard
                  icon={s.netProfit >= 0 ? TrendingUp : TrendingDown}
                  label="Net Profit (Akrual)"
                  value={formatIDR(s.netProfit)}
                  badge={`${s.netMarginPct}%`}
                  color={s.netProfit >= 0 ? C.green : C.red}
                />
                <KPICard
                  icon={s.netCashFlowPeriod >= 0 ? TrendingUp : TrendingDown}
                  label="Arus Kas Bersih"
                  value={formatIDR(s.netCashFlowPeriod)}
                  color={s.netCashFlowPeriod >= 0 ? C.green : C.red}
                  subtitle="Kas Masuk - Keluar"
                />
                <KPICard
                  icon={TrendingUp}
                  label="Laba Cair (Est)"
                  value={formatIDR(s.cashMarginEstimate)}
                  color={C.green}
                  subtitle="Proporsi laba tertagih"
                />
              </div>

              {/* SECTION B — Laba Rugi & Modal Beredar */}
              <div className="grid grid-cols-1 lg:grid-cols-[1.2fr_0.8fr] gap-4 mb-5 sm:mb-6">
                <WaterfallPL summary={s} />
                <WorkingCapitalCard summary={s} />
              </div>

              {/* SECTION C — Laporan Arus Kas Rincian */}
              <CashFlowStatement summary={s} />

              {/* SECTION D — 2 Columns (Margin Produk & Top Toko) */}
              <div className="grid grid-cols-1 lg:grid-cols-[3fr_2fr] gap-4 mt-5 sm:mt-6">
                <ProductMarginTable byProduct={data.byProduct} />
                <TopCustomers byCustomer={data.byCustomer} />
              </div>

              {/* SECTION E — Expense Pie */}
              <ExpensePie expenseByCategory={data.expenseByCategory} summary={s} isDesktop={isDesktop} />

              {/* SECTION F — Invoice Table (Collapsible) */}
              <InvoiceCollapsible sales={data.sales} />
            </>
          </div>
        )}
        </>
        )}
      </div>

      <FinancialReportPdfModal
        open={pdfModal.open}
        onClose={() => setPdfModal(prev => ({ ...prev, open: false }))}
        reportType={pdfModal.type}
        data={data}
        startDate={startDate}
        endDate={endDate}
      />
    </div>
  )
}

// ═══════════════════════════════════════════════════════════════════════════
// KPI Card
// ═══════════════════════════════════════════════════════════════════════════
function KPICard({ icon: Icon, label, value, badge, color, subtitle }) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 8 }}
      animate={{ opacity: 1, y: 0 }}
      className="bg-card rounded-2xl p-3 sm:p-4 border border-border flex flex-col justify-between overflow-hidden relative shadow-sm"
      style={{ borderLeft: `3px solid ${color}` }}
    >
      <div className="flex items-center justify-between gap-1.5 mb-2">
        <div className="w-7 h-7 sm:w-8 sm:h-8 rounded-lg flex items-center justify-center shrink-0" style={{ background: `${color}18` }}>
          <Icon size={14} color={color} />
        </div>
        {badge && (
          <span
            className="text-[10px] sm:text-[11px] font-extrabold px-2 py-0.5 rounded-md shrink-0"
            style={{ background: `${color}18`, color }}
          >
            {badge}
          </span>
        )}
      </div>
      <div>
        <p className="text-[9px] sm:text-[10px] text-muted-foreground font-bold tracking-wider uppercase truncate">
          {label}
        </p>
        <p className="text-[14px] sm:text-base md:text-lg font-black text-foreground font-mono tracking-tight leading-tight mt-0.5 truncate whitespace-nowrap">
          {value}
        </p>
        {subtitle && (
          <p className="text-[8px] sm:text-[9px] text-muted-foreground mt-1 truncate">
            {subtitle}
          </p>
        )}
      </div>
    </motion.div>
  )
}

// ═══════════════════════════════════════════════════════════════════════════
// Waterfall P&L (Adaptive Mobile Stacking + Desktop Grid)
// ═══════════════════════════════════════════════════════════════════════════
function WaterfallPL({ summary: s }) {
  const isMobile = useMediaQuery('(max-width: 639px)')
  const maxVal = Math.max(s.totalGrossRevenue || s.totalRevenue, 1)
  const rows = [
    { label: 'Penjualan Kotor (Gross)', value: s.totalGrossRevenue || s.totalRevenue, type: 'positive' },
    { label: 'Retur Penjualan (Returns)', value: -Math.abs(s.totalReturns || 0), type: 'negative' },
    { label: 'Revenue Bersih', value: s.totalRevenue, type: 'subtotal' },
    { label: 'HPP (COGS)', value: -s.totalCOGS, type: 'negative' },
    { label: 'Gross Profit', value: s.grossProfit, type: 'subtotal' },
    { label: 'Biaya Kirim', value: -s.totalDeliveryCost, type: 'negative' },
    { label: 'Biaya Lain', value: -s.totalOtherCost, type: 'negative' },
    { label: 'Operasional', value: -s.totalExpenses, type: 'negative' },
    { label: 'Gaji Pegawai', value: -s.totalPayroll, type: 'negative' },
    { label: 'NET PROFIT', value: s.netProfit, type: 'total' },
  ]

  return (
    <div className="bg-card rounded-2xl p-4 sm:p-5 border border-border shadow-sm">
      <p className="text-[11px] font-black text-amber-500 tracking-wider uppercase mb-3 sm:mb-4">
        LABA RUGI (WATERFALL P&L)
      </p>
      <div className="flex flex-col gap-2 sm:gap-1.5">
        {rows.map((row, i) => {
          const absVal = Math.abs(row.value)
          const barPct = maxVal > 0 ? Math.min((absVal / maxVal) * 100, 100) : 0
          const isNeg = row.type === 'negative'
          const isTot = row.type === 'total' || row.type === 'subtotal'
          const barColor = isNeg ? '#EF4444' : row.value >= 0 ? '#10B981' : '#EF4444'

          if (isMobile) {
            // ── Mobile Stacked Layout (Never clips bar or wraps awkwardly) ──
            return (
              <div
                key={i}
                className={cn(
                  "py-1.5 space-y-1",
                  isTot ? "border-t border-border pt-2.5 font-bold" : ""
                )}
              >
                <div className="flex items-center justify-between text-xs gap-2">
                  <span className={cn("text-[11px] truncate", isTot ? "text-foreground font-black" : "text-muted-foreground font-medium")}>
                    {isNeg ? '−' : row.type === 'positive' ? '+' : '='} {row.label}
                  </span>
                  <span className={cn(
                    "text-xs font-mono font-bold shrink-0 whitespace-nowrap",
                    isNeg ? "text-red-500" : row.value >= 0 ? (isTot ? "text-emerald-500 font-black text-sm" : "text-emerald-500") : "text-red-500"
                  )}>
                    {isNeg ? `- ${formatIDR(absVal)}` : formatIDR(absVal)}
                  </span>
                </div>
                <div className="h-1.5 bg-muted/40 rounded-full overflow-hidden w-full">
                  <div
                    className="h-full rounded-full transition-all duration-500"
                    style={{ width: `${barPct}%`, backgroundColor: barColor, opacity: isTot ? 1 : 0.8 }}
                  />
                </div>
              </div>
            )
          }

          // ── Desktop Inline Grid Layout ──
          return (
            <div
              key={i}
              className={cn(
                "grid grid-cols-[140px_1fr_120px] items-center gap-3 py-1",
                isTot ? "border-t border-border pt-2 font-bold" : ""
              )}
            >
              <span className={cn("text-xs truncate", isTot ? "text-foreground font-black" : "text-muted-foreground font-medium")}>
                {isNeg ? '−' : row.type === 'positive' ? '+' : '='} {row.label}
              </span>
              <div className="h-2 bg-muted/40 rounded-full overflow-hidden">
                <div
                  className="h-full rounded-full transition-all duration-500"
                  style={{ width: `${barPct}%`, backgroundColor: barColor, opacity: isTot ? 1 : 0.8 }}
                />
              </div>
              <span className={cn(
                "text-xs font-mono font-bold text-right shrink-0 whitespace-nowrap",
                isNeg ? "text-red-500" : row.value >= 0 ? (isTot ? "text-emerald-500 font-black text-sm" : "text-emerald-500") : "text-red-500"
              )}>
                {isNeg ? `- ${formatIDR(absVal)}` : formatIDR(absVal)}
              </span>
            </div>
          )
        })}
      </div>
    </div>
  )
}

// ═══════════════════════════════════════════════════════════════════════════
// Product Margin Table (Law of UX: Mobile Card List + Desktop Table)
// ═══════════════════════════════════════════════════════════════════════════
function ProductMarginTable({ byProduct }) {
  const isMobile = useMediaQuery('(max-width: 639px)')

  const products = useMemo(() => {
    return Object.entries(byProduct).map(([name, d]) => {
      const profit = d.revenue - d.cogs
      const margin = d.revenue > 0 ? (profit / d.revenue * 100) : 0
      return { name, ...d, profit, margin }
    }).sort((a, b) => b.margin - a.margin)
  }, [byProduct])

  const totals = useMemo(() => products.reduce((t, p) => ({
    revenue: t.revenue + p.revenue, cogs: t.cogs + p.cogs, profit: t.profit + p.profit, qty: t.qty + p.qty,
  }), { revenue: 0, cogs: 0, profit: 0, qty: 0 }), [products])
  const totalMargin = totals.revenue > 0 ? (totals.profit / totals.revenue * 100) : 0

  function getMarginBadgeClass(m) {
    if (m >= 20) return "bg-emerald-50 text-emerald-700 border-emerald-200/80 dark:bg-emerald-500/10 dark:text-emerald-400 dark:border-emerald-500/20"
    if (m >= 10) return "bg-amber-50 text-amber-700 border-amber-200/80 dark:bg-amber-500/10 dark:text-amber-400 dark:border-amber-500/20"
    return "bg-red-50 text-red-700 border-red-200/80 dark:bg-red-500/10 dark:text-red-400 dark:border-red-500/20"
  }

  return (
    <div className="bg-card rounded-2xl p-4 sm:p-5 border border-border shadow-sm">
      <div className="flex items-center justify-between mb-3 sm:mb-4">
        <p className="text-[11px] font-black text-amber-500 tracking-wider uppercase">
          MARGIN PER PRODUK
        </p>
        <span className="text-[10px] text-muted-foreground font-semibold">
          {products.length} Item
        </span>
      </div>

      {isMobile ? (
        // ── Mobile View: Law of UX Chunked Product Cards (No horizontal split numbers) ──
        <div className="space-y-2.5">
          {products.map((p, i) => {
            const rawName = p.name || 'Produk'
            const matchPkg = rawName.match(/\[(\d+(?:\.\d+)?\s*[^\]]+)\]/)
            const pkgTag = matchPkg ? matchPkg[1] : null
            const cleanName = rawName.replace(/\s*\[\d+[^\]]+\]/g, '').trim()

            return (
              <div
                key={i}
                className="bg-muted/30 hover:bg-muted/50 rounded-xl p-3 border border-border/80 space-y-2 transition-colors"
              >
                {/* Header: Name + Qty + Margin Pill */}
                <div className="flex items-start justify-between gap-2">
                  <div className="min-w-0 flex-1">
                    <div className="flex items-center gap-1.5 flex-wrap">
                      <span className="text-xs font-bold text-foreground leading-snug">
                        {cleanName}
                      </span>
                      {pkgTag && (
                        <span className="text-[9px] font-extrabold px-1.5 py-0.2 rounded bg-indigo-50 text-indigo-700 border border-indigo-200/60 uppercase">
                          {pkgTag}
                        </span>
                      )}
                    </div>
                    <p className="text-[10px] text-muted-foreground mt-0.5">
                      Jumlah: <strong className="text-foreground">{p.qty}</strong> {p.unit}
                    </p>
                  </div>
                  <span className={cn("text-[10px] font-black px-2 py-0.5 rounded-md border shrink-0 font-mono", getMarginBadgeClass(p.margin))}>
                    {p.margin.toFixed(1)}%
                  </span>
                </div>

                {/* 3-Column Financial Grid (Never breaks 'Rp' and numbers) */}
                <div className="grid grid-cols-3 gap-1.5 pt-1.5 border-t border-border/60 text-center">
                  <div className="bg-background/80 rounded-lg p-1.5 border border-border/40">
                    <p className="text-[8px] text-muted-foreground font-bold uppercase tracking-wider">Omzet</p>
                    <p className="text-[11px] font-bold text-foreground font-mono truncate whitespace-nowrap mt-0.5">
                      {formatIDR(p.revenue)}
                    </p>
                  </div>
                  <div className="bg-background/80 rounded-lg p-1.5 border border-border/40">
                    <p className="text-[8px] text-muted-foreground font-bold uppercase tracking-wider">Modal (HPP)</p>
                    <p className="text-[11px] font-medium text-slate-500 font-mono truncate whitespace-nowrap mt-0.5">
                      {formatIDR(p.cogs)}
                    </p>
                  </div>
                  <div className="bg-background/80 rounded-lg p-1.5 border border-border/40">
                    <p className="text-[8px] text-muted-foreground font-bold uppercase tracking-wider">Laba</p>
                    <p className={cn(
                      "text-[11px] font-black font-mono truncate whitespace-nowrap mt-0.5",
                      p.profit >= 0 ? "text-emerald-600 dark:text-emerald-400" : "text-red-500"
                    )}>
                      {formatIDR(p.profit)}
                    </p>
                  </div>
                </div>
              </div>
            )
          })}

          {/* Mobile Total Summary Card (Theme Adaptive & High Contrast) */}
          {products.length > 0 && (
            <div className="bg-slate-100 dark:bg-slate-800/90 rounded-xl p-3.5 border border-slate-300/80 dark:border-slate-700 shadow-sm space-y-2 mt-3">
              <div className="flex items-center justify-between">
                <span className="text-[10px] font-black uppercase tracking-wider text-slate-700 dark:text-slate-200">
                  TOTAL KESELURUHAN ({totals.qty} Item)
                </span>
                <span className="text-[10px] font-black px-2 py-0.5 rounded bg-emerald-100 text-emerald-800 dark:bg-emerald-950/60 dark:text-emerald-300 border border-emerald-300 dark:border-emerald-700 font-mono">
                  {totalMargin.toFixed(1)}% Rata-rata
                </span>
              </div>
              <div className="grid grid-cols-3 gap-1.5 pt-1 text-center">
                <div className="bg-white dark:bg-slate-900/80 rounded-lg p-1.5 border border-slate-200 dark:border-slate-700/80 shadow-xs">
                  <p className="text-[8px] text-slate-500 dark:text-slate-400 font-bold uppercase">Total Omzet</p>
                  <p className="text-[11px] font-black text-slate-900 dark:text-white font-mono truncate whitespace-nowrap mt-0.5">
                    {formatIDR(totals.revenue)}
                  </p>
                </div>
                <div className="bg-white dark:bg-slate-900/80 rounded-lg p-1.5 border border-slate-200 dark:border-slate-700/80 shadow-xs">
                  <p className="text-[8px] text-slate-500 dark:text-slate-400 font-bold uppercase">Total HPP</p>
                  <p className="text-[11px] font-medium text-slate-600 dark:text-slate-300 font-mono truncate whitespace-nowrap mt-0.5">
                    {formatIDR(totals.cogs)}
                  </p>
                </div>
                <div className="bg-white dark:bg-slate-900/80 rounded-lg p-1.5 border border-slate-200 dark:border-slate-700/80 shadow-xs">
                  <p className="text-[8px] text-emerald-600 dark:text-emerald-400 font-bold uppercase">Total Laba</p>
                  <p className="text-[11px] font-black text-emerald-600 dark:text-emerald-400 font-mono truncate whitespace-nowrap mt-0.5">
                    {formatIDR(totals.profit)}
                  </p>
                </div>
              </div>
            </div>
          )}

          {products.length === 0 && (
            <p className="text-muted-foreground text-xs text-center py-6">Tidak ada data produk</p>
          )}
        </div>
      ) : (
        // ── Desktop Table View (Spacious) ──
        <div className="overflow-x-auto">
          <table className="w-full border-collapse text-xs">
            <thead>
              <tr className="border-b border-border text-muted-foreground text-[10px] font-bold uppercase tracking-wider">
                <th className="text-left py-2 px-2">Produk</th>
                <th className="text-center py-2 px-2">Qty</th>
                <th className="text-right py-2 px-2">Revenue</th>
                <th className="text-right py-2 px-2">HPP</th>
                <th className="text-right py-2 px-2">Profit</th>
                <th className="text-right py-2 px-2">Margin</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-border/40">
              {products.map((p, i) => (
                <tr key={i} className="hover:bg-muted/30 transition-colors">
                  <td className="py-2.5 px-2 font-semibold text-foreground">{p.name}</td>
                  <td className="py-2.5 px-2 text-center text-muted-foreground whitespace-nowrap">{p.qty} {p.unit}</td>
                  <td className="py-2.5 px-2 text-right text-foreground font-mono font-medium whitespace-nowrap">{formatIDR(p.revenue)}</td>
                  <td className="py-2.5 px-2 text-right text-muted-foreground font-mono whitespace-nowrap">{formatIDR(p.cogs)}</td>
                  <td className={cn("py-2.5 px-2 text-right font-mono font-bold whitespace-nowrap", p.profit >= 0 ? "text-emerald-500" : "text-red-500")}>
                    {formatIDR(p.profit)}
                  </td>
                  <td className="py-2.5 px-2 text-right">
                    <span className={cn("text-[10px] font-bold px-2 py-0.5 rounded-md border font-mono", getMarginBadgeClass(p.margin))}>
                      {p.margin.toFixed(1)}%
                    </span>
                  </td>
                </tr>
              ))}
              {/* Footer Total */}
              <tr className="border-t-2 border-border font-bold bg-muted/20">
                <td className="py-3 px-2 text-foreground font-black">TOTAL</td>
                <td className="py-3 px-2 text-center text-foreground">{totals.qty}</td>
                <td className="py-3 px-2 text-right text-foreground font-mono font-black">{formatIDR(totals.revenue)}</td>
                <td className="py-3 px-2 text-right text-muted-foreground font-mono">{formatIDR(totals.cogs)}</td>
                <td className={cn("py-3 px-2 text-right font-mono font-black", totals.profit >= 0 ? "text-emerald-500" : "text-red-500")}>
                  {formatIDR(totals.profit)}
                </td>
                <td className="py-3 px-2 text-right">
                  <span className={cn("text-[10px] font-black px-2 py-0.5 rounded-md border font-mono", getMarginBadgeClass(totalMargin))}>
                    {totalMargin.toFixed(1)}%
                  </span>
                </td>
              </tr>
            </tbody>
          </table>
          {products.length === 0 && (
            <p className="text-muted-foreground text-xs text-center py-6">Tidak ada data produk</p>
          )}
        </div>
      )}
    </div>
  )
}

// ═══════════════════════════════════════════════════════════════════════════
// Top Customers Ranking
// ═══════════════════════════════════════════════════════════════════════════
function TopCustomers({ byCustomer }) {
  const customers = useMemo(() =>
    Object.entries(byCustomer).map(([name, d]) => ({ name, ...d }))
      .sort((a, b) => b.revenue - a.revenue).slice(0, 10)
    , [byCustomer])

  return (
    <div className="bg-card rounded-2xl p-4 sm:p-5 border border-border shadow-sm">
      <div className="flex items-center justify-between mb-3 sm:mb-4">
        <p className="text-[11px] font-black text-amber-500 tracking-wider uppercase">
          TOP TOKO / PELANGGAN
        </p>
        <span className="text-[10px] text-muted-foreground font-semibold">
          10 Terbesar
        </span>
      </div>
      <div className="flex flex-col gap-2">
        {customers.map((c, i) => (
          <div
            key={i}
            className="flex items-center justify-between p-2.5 bg-muted/40 rounded-xl border border-border/50 gap-2"
          >
            <div className="flex items-center gap-2.5 min-w-0 flex-1">
              <span className={cn(
                "w-6 h-6 rounded-lg text-[10px] font-black flex items-center justify-center shrink-0",
                i === 0 ? "bg-amber-500/20 text-amber-600 border border-amber-500/30" :
                i === 1 ? "bg-slate-300/30 text-slate-700 dark:text-slate-200 border border-slate-300/40" :
                i === 2 ? "bg-amber-700/15 text-amber-800 dark:text-amber-400 border border-amber-700/25" :
                "bg-muted text-muted-foreground"
              )}>
                {i + 1}
              </span>
              <span className="text-xs font-bold text-foreground truncate">
                {c.name}
              </span>
            </div>
            <div className="text-right shrink-0">
              <p className="text-xs font-bold text-foreground font-mono whitespace-nowrap">
                {formatIDR(c.revenue)}
              </p>
              <p className="text-[9px] text-muted-foreground">
                {c.count} invoice
              </p>
            </div>
          </div>
        ))}
        {customers.length === 0 && (
          <p className="text-muted-foreground text-xs text-center py-6">Tidak ada data transaksi</p>
        )}
      </div>
    </div>
  )
}

// ═══════════════════════════════════════════════════════════════════════════
// Expense Pie Chart
// ═══════════════════════════════════════════════════════════════════════════
function ExpensePie({ expenseByCategory, summary: s, isDesktop }) {
  const pieData = useMemo(() => {
    const entries = [
      { name: 'HPP (COGS)', value: s.totalCOGS },
      { name: 'Biaya Kirim', value: s.totalDeliveryCost },
      { name: 'Gaji Pegawai', value: s.totalPayroll },
      ...Object.entries(expenseByCategory).map(([cat, val]) => ({
        name: CATEGORY_LABEL[cat] || cat, value: val,
      })),
    ].filter(d => d.value > 0)
    return entries
  }, [expenseByCategory, s])

  if (pieData.length === 0) return null

  return (
    <div className="bg-card rounded-2xl p-4 sm:p-5 border border-border shadow-sm mt-5 sm:mt-6">
      <p className="text-[11px] font-black text-amber-500 tracking-wider uppercase mb-3 sm:mb-4">
        BREAKDOWN PENGELUARAN BISNIS
      </p>
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4 sm:gap-6 items-center">
        <div className="h-[200px] sm:h-[230px] w-full overflow-hidden flex items-center justify-center">
          <ResponsiveContainer width="100%" height="100%">
            <PieChart>
              <Pie
                data={pieData}
                dataKey="value"
                nameKey="name"
                cx="50%"
                cy="50%"
                outerRadius={isDesktop ? 85 : 75}
                innerRadius={isDesktop ? 45 : 38}
                paddingAngle={2}
                strokeWidth={0}
              >
                {pieData.map((_, i) => <Cell key={i} fill={PIE_COLORS[i % PIE_COLORS.length]} />)}
              </Pie>
              <Tooltip
                contentStyle={{ background: '#0F172A', border: '1px solid rgba(255,255,255,0.1)', borderRadius: '10px', fontSize: '11px', color: '#FFFFFF' }}
                itemStyle={{ color: '#FFFFFF' }}
                formatter={(val) => [formatIDR(val), 'Jumlah']}
              />
            </PieChart>
          </ResponsiveContainer>
        </div>
        <div className="flex flex-col gap-2">
          {pieData.map((d, i) => {
            const total = pieData.reduce((s, x) => s + x.value, 0)
            const pct = total > 0 ? (d.value / total * 100).toFixed(1) : 0
            return (
              <div key={i} className="flex items-center gap-2 text-xs py-1 border-b border-border/30 last:border-0">
                <div className="w-2.5 h-2.5 rounded-sm shrink-0" style={{ backgroundColor: PIE_COLORS[i % PIE_COLORS.length] }} />
                <span className="text-muted-foreground flex-1 truncate text-[11px]">{d.name}</span>
                <span className="text-foreground font-bold font-mono text-[11px] shrink-0 whitespace-nowrap">{formatIDR(d.value)}</span>
                <span className="text-muted-foreground font-semibold text-[10px] w-10 text-right shrink-0 font-mono">{pct}%</span>
              </div>
            )
          })}
        </div>
      </div>
    </div>
  )
}

// ═══════════════════════════════════════════════════════════════════════════
// Collapsible Invoice Table
// ═══════════════════════════════════════════════════════════════════════════
function InvoiceCollapsible({ sales }) {
  const [open, setOpen] = useState(false)
  const [filterStatus, setFilterStatus] = useState('')
  const isMobile = useMediaQuery('(max-width: 639px)')
  const filtered = filterStatus ? sales.filter(s => s.payment_status === filterStatus) : sales

  return (
    <div className="bg-card rounded-2xl p-4 sm:p-5 border border-border shadow-sm mt-5 sm:mt-6">
      <button
        onClick={() => setOpen(v => !v)}
        className="flex items-center justify-between w-full bg-transparent border-0 cursor-pointer p-0 select-none text-left"
      >
        <span className="text-[11px] font-black text-amber-500 tracking-wider uppercase">
          SEMUA INVOICE PERIODE INI ({sales.length})
        </span>
        {open ? <ChevronUp size={16} className="text-muted-foreground" /> : <ChevronDown size={16} className="text-muted-foreground" />}
      </button>

      {open && (
        <div className="mt-3.5 space-y-3">
          <div className="w-full sm:w-44">
            <CustomSelect
              value={filterStatus}
              onChange={setFilterStatus}
              options={[
                { value: '', label: 'Semua Status' },
                { value: 'lunas', label: 'Lunas' },
                { value: 'sebagian', label: 'Sebagian' },
                { value: 'belum_lunas', label: 'Belum Lunas' },
              ]}
              placeholder="Semua Status"
            />
          </div>

          {isMobile ? (
            // ── Mobile Card List for Invoices ──
            <div className="space-y-2">
              {filtered.map(s => {
                const st = STATUS_STYLE[s.payment_status] || STATUS_STYLE.belum_lunas
                return (
                  <div key={s.id} className="bg-muted/40 rounded-xl p-3 border border-border/60 space-y-1.5">
                    <div className="flex justify-between items-start gap-2">
                      <div>
                        <p className="text-xs font-bold text-foreground font-mono">{s.invoice_number}</p>
                        <p className="text-[11px] text-muted-foreground">{s.customer_name || 'Pelanggan'}</p>
                      </div>
                      <span className="text-[9px] font-extrabold px-2 py-0.5 rounded-md shrink-0" style={{ background: st.bg, color: st.color }}>
                        {st.label}
                      </span>
                    </div>
                    <div className="flex justify-between items-center text-xs pt-1 border-t border-border/40 font-mono">
                      <span className="text-[10px] text-muted-foreground">{fmtDate(s.transaction_date)}</span>
                      <div className="text-right">
                        <span className="text-xs font-bold text-foreground">{formatIDR(s.total_amount)}</span>
                        <span className={cn("text-[10px] ml-1.5 font-bold", s.net_profit >= 0 ? "text-emerald-500" : "text-red-500")}>
                          (Laba: {formatIDR(s.net_profit)})
                        </span>
                      </div>
                    </div>
                  </div>
                )
              })}
              {filtered.length === 0 && <p className="text-muted-foreground text-xs text-center py-4">Tidak ada invoice</p>}
            </div>
          ) : (
            // ── Desktop Table for Invoices ──
            <div className="overflow-x-auto">
              <table className="w-full border-collapse text-xs">
                <thead>
                  <tr className="border-b border-border text-[10px] font-bold text-muted-foreground uppercase tracking-wider">
                    <th className="text-left py-2 px-2">No Invoice</th>
                    <th className="text-left py-2 px-2">Toko</th>
                    <th className="text-center py-2 px-2">Tanggal</th>
                    <th className="text-right py-2 px-2">Total</th>
                    <th className="text-right py-2 px-2">HPP</th>
                    <th className="text-right py-2 px-2">Profit</th>
                    <th className="text-right py-2 px-2">Status</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-border/40">
                  {filtered.map(s => {
                    const st = STATUS_STYLE[s.payment_status] || STATUS_STYLE.belum_lunas
                    return (
                      <tr key={s.id} className="hover:bg-muted/30 transition-colors">
                        <td className="py-2.5 px-2 font-mono font-bold text-foreground">{s.invoice_number}</td>
                        <td className="py-2.5 px-2 text-muted-foreground">{s.customer_name || '-'}</td>
                        <td className="py-2.5 px-2 text-center text-muted-foreground whitespace-nowrap">{fmtDate(s.transaction_date)}</td>
                        <td className="py-2.5 px-2 text-right font-mono font-bold text-foreground whitespace-nowrap">{formatIDR(s.total_amount)}</td>
                        <td className="py-2.5 px-2 text-right font-mono text-muted-foreground whitespace-nowrap">{formatIDR(s.total_cogs)}</td>
                        <td className={cn("py-2.5 px-2 text-right font-mono font-bold whitespace-nowrap", s.net_profit >= 0 ? "text-emerald-500" : "text-red-500")}>
                          {formatIDR(s.net_profit)}
                        </td>
                        <td className="py-2.5 px-2 text-right">
                          <span className="text-[9px] font-bold px-2 py-0.5 rounded-md" style={{ background: st.bg, color: st.color }}>
                            {st.label}
                          </span>
                        </td>
                      </tr>
                    )
                  })}
                </tbody>
              </table>
              {filtered.length === 0 && <p className="text-muted-foreground text-xs text-center py-4">Tidak ada invoice</p>}
            </div>
          )}
        </div>
      )}
    </div>
  )
}

// ── Skeleton ─────────────────────────────────────────────────────────────────
function LoadingSkeleton() {
  return (
    <div className="space-y-4">
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
        {[1, 2, 3, 4].map(i => <div key={i} className="bg-card rounded-2xl h-24 border border-border animate-pulse" />)}
      </div>
      <div className="bg-card rounded-2xl h-64 border border-border animate-pulse" />
    </div>
  )
}

// ═══════════════════════════════════════════════════════════════════════════
// Working Capital Card (Modal Beredar / Aset Lancar)
// ═══════════════════════════════════════════════════════════════════════════
function WorkingCapitalCard({ summary: s }) {
  const cashOnHand = s.endingCashOnHand || 0
  const bankBalance = s.endingBankBalance || 0
  const stockValue = s.stockValue || 0
  const receivables = s.outstandingReceivable || 0
  const payables = s.outstandingPayable || 0
  const totalAssets = cashOnHand + bankBalance + stockValue + receivables
  const netWorkingCapital = totalAssets - payables

  return (
    <div className="bg-card rounded-2xl p-4 sm:p-5 border border-border shadow-sm flex flex-col justify-between h-full">
      <div>
        <p className="text-[11px] font-black text-amber-500 tracking-wider uppercase mb-3 sm:mb-4">
          LIKUIDITAS & MODAL BEREDAR
        </p>
        
        <div className="flex flex-col gap-2.5 text-xs">
          <div className="flex justify-between items-center gap-2">
            <div className="flex items-center gap-2 min-w-0">
              <span className="text-sm">💵</span>
              <div className="truncate">
                <p className="text-foreground font-bold truncate">Cash On Hand</p>
                <p className="text-[9px] text-muted-foreground truncate">Uang kasir/tangan</p>
              </div>
            </div>
            <span className="font-mono font-bold text-foreground shrink-0 whitespace-nowrap">{formatIDR(cashOnHand)}</span>
          </div>

          <div className="flex justify-between items-center gap-2">
            <div className="flex items-center gap-2 min-w-0">
              <span className="text-sm">🏦</span>
              <div className="truncate">
                <p className="text-foreground font-bold truncate">Bank Balance</p>
                <p className="text-[9px] text-muted-foreground truncate">Rekening bank tercatat</p>
              </div>
            </div>
            <span className="font-mono font-bold text-foreground shrink-0 whitespace-nowrap">{formatIDR(bankBalance)}</span>
          </div>

          <div className="flex justify-between items-center gap-2">
            <div className="flex items-center gap-2 min-w-0">
              <span className="text-sm">📦</span>
              <div className="truncate">
                <p className="text-foreground font-bold truncate">Persediaan Gudang</p>
                <p className="text-[9px] text-muted-foreground truncate">Modal barang fisik</p>
              </div>
            </div>
            <span className="font-mono font-bold text-foreground shrink-0 whitespace-nowrap">{formatIDR(stockValue)}</span>
          </div>

          <div className="flex justify-between items-center gap-2">
            <div className="flex items-center gap-2 min-w-0">
              <span className="text-sm">🧾</span>
              <div className="truncate">
                <p className="text-foreground font-bold truncate">Piutang Dagang</p>
                <p className="text-[9px] text-muted-foreground truncate">Tagihan belum lunas toko</p>
              </div>
            </div>
            <span className="font-mono font-bold text-foreground shrink-0 whitespace-nowrap">{formatIDR(receivables)}</span>
          </div>

          <div className="h-px bg-border my-1" />

          <div className="flex justify-between items-center text-xs">
            <span className="font-black text-foreground">TOTAL ASET LANCAR</span>
            <span className="font-mono font-black text-foreground shrink-0 whitespace-nowrap">{formatIDR(totalAssets)}</span>
          </div>

          <div className="flex justify-between items-center gap-2 text-xs">
            <div className="flex items-center gap-2 min-w-0">
              <span className="text-sm">🤝</span>
              <div className="truncate">
                <p className="text-red-500 font-bold truncate">Hutang Dagang</p>
                <p className="text-[9px] text-muted-foreground truncate">Kewajiban supplier</p>
              </div>
            </div>
            <span className="font-mono font-bold text-red-500 shrink-0 whitespace-nowrap">{formatIDR(payables)}</span>
          </div>
        </div>
      </div>

      <div className="mt-4 pt-3 border-t border-border/80">
        <div className="bg-emerald-500/10 dark:bg-emerald-500/15 border border-emerald-500/30 rounded-xl p-3 flex justify-between items-center">
          <div>
            <p className="text-[9px] font-black uppercase tracking-wider text-emerald-600 dark:text-emerald-400">
              MODAL KERJA BERSIH (NET)
            </p>
            <p className="text-[10px] text-muted-foreground font-medium">Aset Lancar − Hutang</p>
          </div>
          <span className="text-sm sm:text-base font-black text-emerald-600 dark:text-emerald-400 font-mono shrink-0 whitespace-nowrap">
            {formatIDR(netWorkingCapital)}
          </span>
        </div>
      </div>
    </div>
  )
}

// ═══════════════════════════════════════════════════════════════════════════
// Detailed Cash Flow Statement (Arus Kas Terperinci)
// ═══════════════════════════════════════════════════════════════════════════
function CashFlowStatement({ summary: s }) {
  const openingCash = s.openingCashOnHand + s.openingBankBalance
  const cashIn = s.cashInPeriodTunai + s.cashInPeriodTransfer
  
  const supplierOut = s.supplierOutPeriodTunai + s.supplierOutPeriodTransfer
  const payrollOut = s.payrollOutPeriodTunai
  const opsOut = s.regularExpensesOutPeriodTunai
  const priveOut = s.priveOutPeriodTunai
  const deliveryOut = s.deliveryOutPeriodTunai || 0
  const totalOut = supplierOut + payrollOut + opsOut + priveOut + deliveryOut
  
  const endingCash = s.endingCashOnHand + s.endingBankBalance

  return (
    <div className="bg-card rounded-2xl p-4 sm:p-5 border border-border shadow-sm mt-5 sm:mt-6">
      <p className="text-[11px] font-black text-amber-500 tracking-wider uppercase mb-3 sm:mb-4">
        LAPORAN ARUS KAS (CASH FLOW STATEMENT)
      </p>

      {/* Warning Limitation */}
      <div className="bg-muted/40 border border-border/80 rounded-xl p-2.5 mb-3.5 text-[10px] text-muted-foreground leading-relaxed">
        <strong>💡 Catatan Sistem:</strong> Saldo Kas Awal dihitung berdasarkan catatan riwayat transaksi sistem aplikasi.
      </div>

      <div className="flex flex-col gap-2 text-xs">
        {/* Opening Balance */}
        <div className="flex justify-between items-center py-1.5 border-b border-dashed border-border">
          <span className="font-bold text-foreground text-xs">SALDO KAS AWAL</span>
          <span className="font-mono font-black text-foreground text-xs shrink-0 whitespace-nowrap">{formatIDR(openingCash)}</span>
        </div>
        <div className="flex gap-3 pl-2.5 text-[10px] text-muted-foreground -mt-1 mb-1">
          <span>Tunai: <strong className="text-foreground">{formatIDR(s.openingCashOnHand)}</strong></span>
          <span>Bank: <strong className="text-foreground">{formatIDR(s.openingBankBalance)}</strong></span>
        </div>

        {/* Cash In */}
        <div className="flex justify-between items-center py-1 text-emerald-600 dark:text-emerald-400">
          <span className="font-bold text-xs">+ Penerimaan Pembayaran (Cash In)</span>
          <span className="font-mono font-black text-xs shrink-0 whitespace-nowrap">{formatIDR(cashIn)}</span>
        </div>
        <div className="flex gap-3 pl-2.5 text-[10px] text-muted-foreground -mt-1 mb-1.5">
          <span>Tunai: <strong className="text-foreground">{formatIDR(s.cashInPeriodTunai)}</strong></span>
          <span>Bank: <strong className="text-foreground">{formatIDR(s.cashInPeriodTransfer)}</strong></span>
        </div>

        {/* Cash Out Flow */}
        <div className="flex flex-col gap-1.5 pl-2.5 border-l-2 border-border my-1">
          {/* Supplier */}
          <div className="flex justify-between items-center text-xs gap-2">
            <span className="text-muted-foreground truncate">− Pembelian Stok & Bayar Supplier</span>
            <span className="font-mono font-bold text-red-500 shrink-0 whitespace-nowrap">{formatIDR(supplierOut)}</span>
          </div>
          <div className="flex gap-3 pl-2 text-[9px] text-muted-foreground -mt-0.5 mb-1">
            <span>Tunai: {formatIDR(s.supplierOutPeriodTunai)}</span>
            <span>Bank: {formatIDR(s.supplierOutPeriodTransfer)}</span>
          </div>

          {/* Gaji */}
          {payrollOut > 0 && (
            <div className="flex justify-between items-center text-xs gap-2">
              <span className="text-muted-foreground truncate">− Gaji Pegawai Terbayar (Tunai)</span>
              <span className="font-mono font-bold text-red-500 shrink-0 whitespace-nowrap">{formatIDR(payrollOut)}</span>
            </div>
          )}

          {/* Biaya Kirim */}
          {deliveryOut > 0 && (
            <div className="flex justify-between items-center text-xs gap-2">
              <span className="text-muted-foreground truncate">− Biaya Pengiriman & Armada (Tunai)</span>
              <span className="font-mono font-bold text-red-500 shrink-0 whitespace-nowrap">{formatIDR(deliveryOut)}</span>
            </div>
          )}

          {/* Operasional */}
          {opsOut > 0 && (
            <div className="flex justify-between items-center text-xs gap-2">
              <span className="text-muted-foreground truncate">− Biaya Operasional Toko (Tunai)</span>
              <span className="font-mono font-bold text-red-500 shrink-0 whitespace-nowrap">{formatIDR(opsOut)}</span>
            </div>
          )}

          {/* Prive */}
          {priveOut > 0 && (
            <div className="flex justify-between items-center text-xs gap-2">
              <span className="text-muted-foreground truncate">− Penarikan Pemilik (Prive)</span>
              <span className="font-mono font-bold text-red-500 shrink-0 whitespace-nowrap">{formatIDR(priveOut)}</span>
            </div>
          )}
        </div>

        {/* Total Cash Out Summary */}
        <div className="flex justify-between items-center py-1.5 border-t border-border mt-1 text-red-500">
          <span className="font-bold text-xs">= Total Pengeluaran Kas (Cash Out)</span>
          <span className="font-mono font-black text-xs shrink-0 whitespace-nowrap">− {formatIDR(totalOut)}</span>
        </div>

        {/* Ending Balance Box */}
        <div className="mt-2 pt-2 border-t-2 border-border">
          <div className="flex justify-between items-center bg-muted/40 rounded-xl p-3 border border-border">
            <div>
              <p className="text-[10px] font-black uppercase text-foreground tracking-wider">SALDO KAS AKHIR</p>
              <p className="text-[9px] text-muted-foreground mt-0.5">
                Tunai: {formatIDR(s.endingCashOnHand)} • Bank: {formatIDR(s.endingBankBalance)}
              </p>
            </div>
            <span className="text-sm sm:text-base font-black text-emerald-600 dark:text-emerald-400 font-mono shrink-0 whitespace-nowrap">
              {formatIDR(endingCash)}
            </span>
          </div>
        </div>
      </div>
    </div>
  )
}
