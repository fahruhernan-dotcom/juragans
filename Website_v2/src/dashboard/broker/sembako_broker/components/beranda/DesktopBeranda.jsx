// DesktopBeranda.jsx — Layout Beranda Desktop (Fluid & Responsive)
import { useMemo } from 'react'
import { useParams } from 'react-router-dom'
import {
  CreditCard, TrendingUp, Package, Receipt,
  Plus, AlertTriangle, ChevronRight,
} from 'lucide-react'
import { canViewProfit } from '@/lib/auth/business-roles'
import { formatIDR } from '@/lib/format'
import SmartInsight from '@/dashboard/_shared/components/SmartInsight'
import { C } from '../sembakoSaleUtils'
import { KPICard, InvoiceRow, QuickStatRow } from './BerandaUtils'
import { SalesAndCashChart, StockTrendChart } from './BerandaCharts'
import { AgendaSection } from './BerandaAgenda'
import { CollectionReminders } from './CollectionReminders'
import { Button } from '@/components/ui/button'

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

export function DesktopBeranda({
  profile, products = [], stats, sales, employees, navigate, name, salesLoading,
  insight, kpiTrends, chartPeriod, setChartPeriod, weeklyChartData, monthlyChartData,
  cashSummary, unrealizedProfitSnapshot,
  deliveries, selectedDate, setSelectedDate, currentMonth, setCurrentMonth,
  agendaFilter, setAgendaFilter, setStokOpen,
  batches = [], suppliers = [], onCatatPenjualanOpen,
  layout,
}) {
  const { brokerType } = useParams()
  const brokerBase = `/broker/${brokerType}`
  const now = new Date()
  const thirtyDaysAgo = new Date(now - 30 * 24 * 60 * 60 * 1000)
  const recentSales = useMemo(() => sales.slice(0, 5), [sales])
  const invoiceThisMonth = sales.filter(s => new Date(s.transaction_date) > thirtyDaysAgo).length
  const activeEmployees  = employees.filter(e => e.status === 'aktif').length
  const lowStock  = stats?.stok?.lowStock || []
  const overdue   = stats?.penjualan?.overdueCount || 0
  const totalExp  = (stats?.pengeluaran?.totalExpenseThisMonth || 0) +
                    (stats?.pengeluaran?.totalPayrollThisMonth || 0) +
                    (stats?.pengeluaran?.totalSupplierPaymentThisMonth || 0) +
                    (stats?.pengeluaran?.totalDeliveryCostThisMonth || 0) +
                    (stats?.pengeluaran?.totalOtherCostThisMonth || 0) +
                    (stats?.pengeluaran?.totalCogsThisMonth || 0)
  const showProfit = canViewProfit(profile)

  return (
    <div className="w-full max-w-[1600px] mx-auto px-4 sm:px-6 lg:px-8 py-6 space-y-6" style={{ color: MC.text, fontFamily: "'Sora', 'Inter', sans-serif" }}>
      {/* ── Header Bar ── */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 pb-2 border-b border-slate-200">
        <div className="space-y-1">
          <h1 className="text-2xl sm:text-3xl font-extrabold tracking-tight text-slate-900 font-sans">
            Selamat datang, {name}
          </h1>
          <p className="text-xs font-bold tracking-widest text-slate-500 uppercase">
            {profile?.tenants?.business_name?.toUpperCase() || profile?.business_name?.toUpperCase() || 'JURAGANS BY ANAK BAWANG'}
          </p>
          <SmartInsight insight={insight} className="mt-2" />
        </div>

        <div className="flex flex-wrap items-center gap-3 shrink-0">
          <button
            onClick={() => navigate(`${brokerBase}/gudang?action=add-stock`)}
            className="flex items-center gap-2 px-4 h-10 rounded-xl font-bold text-xs border border-slate-200 bg-white text-slate-800 hover:bg-slate-50 cursor-pointer shadow-tko-sm active:scale-95 dark:bg-tko-bg-surface dark:border-tko-border-soft dark:text-tko-text-primary dark:hover:bg-tko-bg-subtle"
          >
            <Package size={16} />
            <span>Tambah Stok</span>
          </button>

          <button
            onClick={onCatatPenjualanOpen}
            className="flex items-center gap-2 px-5 h-10 rounded-xl font-bold text-xs bg-[#0F172A] hover:bg-slate-900 text-white cursor-pointer shadow-tko-brand active:scale-95 border-none dark:bg-tko-brand-500 dark:hover:bg-tko-brand-600 dark:text-tko-forest-950 dark:font-black"
          >
            <Plus size={16} />
            <span>Catat Penjualan</span>
          </button>
        </div>
      </div>

      {/* ── Top 4 KPI Cards ── */}
      <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-4">
        <KPICard 
          icon={CreditCard}  
          label="Piutang Toko"       
          value={formatIDR(stats?.penjualan?.totalOutstanding || 0)} 
          sub={overdue > 0 ? `${overdue} jatuh tempo` : 'Semua lancar'} 
          urgent={(stats?.penjualan?.totalOutstanding||0)>0} 
          trend={kpiTrends?.piutangTrend} 
          accentColor={MC.red}
        />
        <KPICard 
          icon={TrendingUp}  
          label="Revenue Bulan Ini"  
          value={formatIDR(stats?.penjualan?.revenueThisMonth || 0)}  
          sub={showProfit ? `Net profit (after ops): ${formatIDR(stats?.penjualan?.netProfitThisMonth || 0)}` : 'Akses Admin (Profit Disembunyikan)'} 
          trend={kpiTrends?.txTrend} 
          accentColor={MC.green}
        />
        <KPICard 
          icon={Package}     
          label="Nilai Stok Gudang"  
          value={formatIDR(stats?.stok?.nilaiStok || 0)}              
          sub={`${stats?.stok?.totalProduk || 0} jenis produk`} 
          accentColor={MC.amber} 
          badge={lowStock.length > 0 ? `${lowStock.length} menipis` : null} 
        />
        <KPICard 
          icon={Receipt}     
          label="Pengeluaran Bulan Ini" 
          value={showProfit ? formatIDR(totalExp) : '***'} 
          sub="Gaji, supplier, operasional & transportasi" 
          accentColor={MC.red} 
        />
      </div>

      {/* ── Main Layout: Left Column (2/3) + Right Column Agenda (1/3) ── */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 items-start">

        {/* LEFT COLUMN */}
        <div className="lg:col-span-2 space-y-6 min-w-0">
          {showProfit && (
            <>
              <SalesAndCashChart 
                weeklyData={weeklyChartData} 
                monthlyData={monthlyChartData} 
                chartPeriod={chartPeriod} 
                setChartPeriod={setChartPeriod} 
                isDesktop={true}
                unrealizedProfitSnapshot={unrealizedProfitSnapshot}
                cashSummary={cashSummary}
                stats={stats}
                layout={layout}
              />
            </>
          )}

          {/* Grafik Stok Gudang */}
          <StockTrendChart products={products} sales={sales} batches={batches} suppliers={suppliers} isDesktop={true} />

          {lowStock.length > 0 && (
            <div className="bg-[#0F172A]/5 border border-[#0F172A]/20 rounded-2xl p-4 sm:p-5 space-y-3">
              <div className="flex items-center gap-2">
                <AlertTriangle size={16} className="text-[#0F172A] shrink-0" />
                <span className="text-xs font-black tracking-widest text-[#0F172A] uppercase">STOK MENIPIS</span>
                <span className="bg-[#0F172A]/20 text-amber-400 text-[10px] font-bold px-2 py-0.5 rounded-full">{lowStock.length}</span>
              </div>
              <div className="space-y-2">
                {lowStock.map(p => (
                  <div key={p.id} className="flex items-center justify-between gap-3 bg-card border border-border/50 rounded-xl p-3">
                    <div className="min-w-0 flex-1">
                      <p className="text-sm font-bold text-foreground truncate">{p.product_name}</p>
                      <p className="text-xs text-muted-foreground mt-0.5">Sisa: <span className="font-semibold text-amber-400">{p.current_stock} {p.unit || ''}</span> · Min: {p.min_stock_alert}</p>
                    </div>
                    <button 
                      onClick={() => navigate(`${brokerBase}/gudang?action=tambah&product=${p.id}`)}
                      className="bg-[#0F172A]/10 border border-[#0F172A]/30 text-[#0F172A] hover:bg-slate-900/20 rounded-lg px-3 py-1.5 text-xs font-bold cursor-pointer transition-all shrink-0"
                    >
                      Tambah Stok
                    </button>
                  </div>
                ))}
              </div>
            </div>
          )}

          <CollectionReminders sales={sales} navigate={navigate} brokerBase={brokerBase} />

          {/* Invoice Terbaru & Ringkasan */}
          <div className="grid grid-cols-1 md:grid-cols-5 gap-4">
            {/* Invoice Terbaru */}
            <div className="md:col-span-3 bg-card rounded-2xl p-4 sm:p-5 border border-border/60 shadow-sm flex flex-col justify-between">
              <div className="flex items-center justify-between gap-2 mb-4">
                <span className="text-xs font-black tracking-widest text-[#0F172A] uppercase">INVOICE TERBARU</span>
                <button 
                  onClick={() => navigate(`${brokerBase}/penjualan`)}
                  className="flex items-center gap-1 text-xs font-bold text-muted-foreground hover:text-foreground transition-colors cursor-pointer"
                >
                  <span>Lihat semua</span>
                  <ChevronRight size={14} />
                </button>
              </div>
              {salesLoading ? (
                <p className="text-muted-foreground text-xs text-center py-6">Memuat data invoice...</p>
              ) : recentSales.length === 0 ? (
                <div className="text-center py-8 text-muted-foreground text-xs space-y-2">
                  <Package size={28} className="mx-auto text-muted-foreground/60" />
                  <p>Belum ada invoice transaksi</p>
                </div>
              ) : (
                <div className="space-y-2">
                  {recentSales.map(s => (
                    <InvoiceRow
                      key={s.id}
                      sale={s}
                      onClick={() => navigate(`${brokerBase}/penjualan?saleId=${s.id}`)}
                    />
                  ))}
                </div>
              )}
            </div>

            {/* Quick Stat Summary */}
            <div className="md:col-span-2 bg-card rounded-2xl p-4 sm:p-5 border border-border/60 shadow-sm flex flex-col justify-between gap-3">
              <span className="text-xs font-black tracking-widest text-[#0F172A] uppercase mb-1">RINGKASAN</span>
              <div className="space-y-2">
                <QuickStatRow label="Produk Aktif"       value={stats?.stok?.totalProduk || 0} />
                <QuickStatRow label="Pegawai Aktif"       value={activeEmployees} />
                <QuickStatRow label="Invoice Bulan Ini"   value={invoiceThisMonth} />
                <QuickStatRow label="Total Piutang"       value={formatIDR(stats?.penjualan?.totalOutstanding || 0)} />
                <QuickStatRow label="Invoice Jatuh Tempo" value={overdue > 0 ? <span className="text-rose-500 font-bold">{overdue}</span> : '0'} />
              </div>
            </div>
          </div>
        </div>

        {/* RIGHT COLUMN — Agenda & Kalender */}
        <div className="lg:col-span-1 min-w-0">
          <AgendaSection
            sales={sales}
            deliveries={deliveries}
            selectedDate={selectedDate}
            setSelectedDate={setSelectedDate}
            currentMonth={currentMonth}
            setCurrentMonth={setCurrentMonth}
            agendaFilter={agendaFilter}
            setAgendaFilter={setAgendaFilter}
            isMobile={false}
          />
        </div>

      </div>
    </div>
  )
}
