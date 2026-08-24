// MobileBeranda.jsx — Layout Beranda Mobile
import { useState, useMemo } from 'react'
import { useParams, useOutletContext } from 'react-router-dom'
import { motion, AnimatePresence } from 'framer-motion'
import {
  Package, Receipt, Warehouse, Wallet,
  Plus, AlertTriangle, ChevronRight, ShoppingCart, ChevronDown, ChevronUp
} from 'lucide-react'
import { formatIDR } from '@/lib/format'
import { format } from 'date-fns'
import SmartInsight from '@/dashboard/_shared/components/SmartInsight'
import { BrokerMobileHeader } from '@/dashboard/broker/_shared/components/BrokerMobileHeader'
import { C } from '../sembakoSaleUtils'
import { InvoiceRow } from './BerandaUtils'
import { SalesAndCashChart } from './BerandaCharts'
import { AgendaSection } from './BerandaAgenda'
import { CollectionReminders } from './CollectionReminders'
import { SembakoOnboardingChecklist } from '../SembakoOnboardingChecklist'
import { useSembakoProducts, useSembakoAllBatches, useSembakoCustomers, useSembakoSales } from '@/lib/hooks/useSembakoData'
import { useAuth } from '@/lib/hooks/useAuth'
import { canViewProfit } from '@/lib/auth/business-roles'

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

function OnboardingWrapper({ setStokOpen }) {
  const { data: products = [] } = useSembakoProducts()
  const { data: batches = [] } = useSembakoAllBatches()
  const { data: customers = [] } = useSembakoCustomers()
  const { data: sales = [] } = useSembakoSales()

  return (
    <SembakoOnboardingChecklist
      productsCount={products.length}
      batchesCount={batches.length}
      customersCount={customers.length}
      salesCount={sales.length}
      onStokOpen={() => setStokOpen(true)}
    />
  )
}

export function MobileBeranda({
  stats, sales, products = [], deliveries, navigate, tenant, insight,
  chartPeriod, setChartPeriod, weeklyChartData, monthlyChartData,
  cashSummary, unrealizedProfitSnapshot,
  selectedDate, setSelectedDate, currentMonth, setCurrentMonth,
  agendaFilter, setAgendaFilter, setStokOpen, salesLoading, onCatatPenjualanOpen,
  layout,
}) {
  const { brokerType } = useParams()
  const brokerBase = `/broker/${brokerType}`
  const { setSidebarOpen = () => window.dispatchEvent(new Event('toggleMobileSidebar')) } = useOutletContext() || {}
  const { profile } = useAuth()
  const showProfit = canViewProfit(profile)

  const [showTodayDetail, setShowTodayDetail] = useState(false)
  const [showInventoryDetail, setShowInventoryDetail] = useState(false)
  const [showFinanceDetail, setShowFinanceDetail] = useState(false)

  const todayStr = useMemo(() => format(new Date(), 'yyyy-MM-dd'), [])

  const todaySales = useMemo(() => sales.filter(s => {
    if (!s) return false
    const txnDateStr = s.transaction_date?.slice(0, 10)
    if (txnDateStr === todayStr) return true
    if (s.created_at) {
      try {
        const d = new Date(s.created_at)
        if (!isNaN(d.getTime()) && format(d, 'yyyy-MM-dd') === todayStr) return true
      } catch (e) {
        // ignore
      }
    }
    return false
  }), [sales, todayStr])
  const todayOmzet = useMemo(() => todaySales.reduce((sum, s) => sum + Number(s.total_amount || 0), 0), [todaySales])
  const todayProfit = useMemo(() => todaySales.reduce((sum, s) => sum + Number(s.net_profit || 0), 0), [todaySales])
  const todayCash = useMemo(() => todaySales.reduce((sum, s) => sum + Number(s.paid_amount || 0), 0), [todaySales])
  const todayPiutang = useMemo(() => todaySales.reduce((sum, s) => sum + Number(s.remaining_amount || 0), 0), [todaySales])
  const cashPct = useMemo(() => todayOmzet > 0 ? (todayCash / todayOmzet) * 100 : 0, [todayCash, todayOmzet])
  const piutangPct = useMemo(() => todayOmzet > 0 ? (todayPiutang / todayOmzet) * 100 : 0, [todayPiutang, todayOmzet])

  const topProducts = useMemo(() => {
    return [...products]
      .sort((a, b) => (b.current_stock * b.avg_buy_price) - (a.current_stock * a.avg_buy_price))
      .slice(0, 5)
  }, [products])

  const recentSales = useMemo(() => sales.slice(0, 3), [sales])
  const lowStock = stats?.stok?.lowStock || []
  const totalExp = (stats?.pengeluaran?.totalExpenseThisMonth || 0) +
                   (stats?.pengeluaran?.totalPayrollThisMonth || 0) +
                   (stats?.pengeluaran?.totalSupplierPaymentThisMonth || 0) +
                   (stats?.pengeluaran?.totalDeliveryCostThisMonth || 0) +
                   (stats?.pengeluaran?.totalOtherCostThisMonth || 0) +
                   (stats?.pengeluaran?.totalCogsThisMonth || 0)

  return (
    <>
      <BrokerMobileHeader
        showGreeting
        businessLabel={tenant?.business_name || 'DASHBOARD INVENTARIS'}
        onMenuClick={() => setSidebarOpen(true)}
      />

      <div style={{ padding: '12px 16px max(140px, calc(110px + env(safe-area-inset-bottom, 24px)))', display: 'flex', flexDirection: 'column', gap: '16px' }}>

        {insight && (
          <div style={{ marginTop: '-4px' }}>
            <SmartInsight insight={insight} />
          </div>
        )}

        <OnboardingWrapper setStokOpen={setStokOpen} />

        {/* Card UANG SAAT INI (Expandable) */}
        {(() => {
          const currentCashTotal = cashSummary?.liquidCash ?? (cashSummary?.cashBalance ?? 0)
          const cashInHand = cashSummary?.cashInHand ?? 0
          const bankBalance = cashSummary?.bankBalance ?? 0
          const totalMethods = Math.max(0, cashInHand) + Math.max(0, bankBalance)
          const cashMethodPct = totalMethods > 0 ? (Math.max(0, cashInHand) / totalMethods) * 100 : 0
          const transferMethodPct = totalMethods > 0 ? (Math.max(0, bankBalance) / totalMethods) * 100 : 0

          const todayCashTunai = cashSummary?.todayCashMethod ?? 0
          const todayCashTransfer = cashSummary?.todayTransferMethod ?? 0
          const todayPaymentsReceived = cashSummary?.todayTotalPayment ?? todayCash

          return (
            <motion.div
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              style={{
                background: MC.card,
                borderRadius: '20px',
                padding: '18px',
                border: `1px solid ${MC.border}`,
                boxShadow: '0 4px 20px rgba(0,0,0,0.04)',
              }}
            >
              {/* Header Card (Collapsed View) */}
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', gap: 12 }}>
                <div style={{ minWidth: 0, flex: 1 }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 6, marginBottom: 4 }}>
                    <span style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', width: 20, height: 20, borderRadius: 6, background: 'rgba(16, 185, 129, 0.12)', color: MC.green }}>
                      <Wallet size={12} />
                    </span>
                    <p style={{ fontSize: '10px', color: MC.muted, fontWeight: 800, letterSpacing: '0.08em', textTransform: 'uppercase' }}>
                      UANG SAAT INI
                    </p>
                  </div>

                  <div style={{ display: 'flex', alignItems: 'baseline', gap: 8, flexWrap: 'wrap' }}>
                    <span style={{ fontSize: '24px', fontWeight: 800, color: MC.text, fontFamily: "'Sora', 'Inter', sans-serif", letterSpacing: '-0.02em' }}>
                      {formatIDR(currentCashTotal)}
                    </span>
                  </div>

                  {/* Sub-summary pill */}
                  <div style={{ display: 'flex', alignItems: 'center', gap: 6, marginTop: 6, flexWrap: 'wrap' }}>
                    <span style={{ fontSize: '10px', color: MC.green, fontWeight: 700, background: 'rgba(22, 163, 74, 0.08)', border: '1px solid rgba(22, 163, 74, 0.16)', padding: '2px 8px', borderRadius: 6 }}>
                      Hari Ini: Profit {formatIDR(todayProfit)}
                    </span>
                    <span style={{ fontSize: '10px', color: MC.amber, fontWeight: 700, background: 'rgba(217, 119, 6, 0.08)', border: '1px solid rgba(217, 119, 6, 0.16)', padding: '2px 8px', borderRadius: 6 }}>
                      Masuk {formatIDR(todayPaymentsReceived)}
                    </span>
                  </div>
                </div>

                <button
                  onClick={() => setShowTodayDetail(!showTodayDetail)}
                  style={{
                    background: showTodayDetail ? 'var(--brand-500)' : 'var(--bg-subtle)',
                    border: showTodayDetail ? 'none' : '1px solid var(--border-soft)',
                    borderRadius: '10px',
                    padding: '8px 12px',
                    fontSize: '11px',
                    fontWeight: 800,
                    color: showTodayDetail ? '#FFFFFF' : 'var(--text-primary)',
                    cursor: 'pointer',
                    display: 'flex',
                    alignItems: 'center',
                    gap: '4px',
                    flexShrink: 0,
                  }}
                  className="active:scale-95 transition-all shadow-sm"
                >
                  {showTodayDetail ? 'Tutup' : 'Rincian'}
                  {showTodayDetail ? <ChevronUp size={13} /> : <ChevronDown size={13} />}
                </button>
              </div>

              {/* Accordion Detail */}
              <AnimatePresence>
                {showTodayDetail && (
                  <motion.div
                    initial={{ height: 0, opacity: 0 }}
                    animate={{ height: 'auto', opacity: 1 }}
                    exit={{ height: 0, opacity: 0 }}
                    transition={{ duration: 0.22, ease: 'easeInOut' }}
                    style={{ overflow: 'hidden' }}
                  >
                    <div style={{ marginTop: '16px', borderTop: `1px solid ${MC.border}`, paddingTop: '16px', display: 'flex', flexDirection: 'column', gap: '16px' }}>
                      
                      {/* 1. Saldo Uang Kas vs Bank */}
                      <div style={{ background: 'var(--bg-subtle)', borderRadius: '14px', padding: '12px 14px', border: `1px solid ${MC.border}` }}>
                        <p style={{ fontSize: '10px', fontWeight: 800, color: MC.muted, letterSpacing: '0.05em', textTransform: 'uppercase', marginBottom: '10px' }}>
                          💵 Posisi Saldo Kas & Bank
                        </p>
                        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '10px', marginBottom: '10px' }}>
                          <div style={{ background: MC.card, borderRadius: '10px', padding: '10px', border: `1px solid ${MC.border}` }}>
                            <div style={{ display: 'flex', alignItems: 'center', gap: 6, marginBottom: 2 }}>
                              <span style={{ width: 8, height: 8, borderRadius: '50%', background: '#10B981' }} />
                              <span style={{ fontSize: '10px', color: MC.muted, fontWeight: 700 }}>Kas Tunai (Cash)</span>
                            </div>
                            <p style={{ fontSize: '14px', fontWeight: 800, color: MC.text, fontFamily: 'Sora' }}>
                              {formatIDR(cashInHand)}
                            </p>
                          </div>
                          <div style={{ background: MC.card, borderRadius: '10px', padding: '10px', border: `1px solid ${MC.border}` }}>
                            <div style={{ display: 'flex', alignItems: 'center', gap: 6, marginBottom: 2 }}>
                              <span style={{ width: 8, height: 8, borderRadius: '50%', background: '#3B82F6' }} />
                              <span style={{ fontSize: '10px', color: MC.muted, fontWeight: 700 }}>Rekening Bank</span>
                            </div>
                            <p style={{ fontSize: '14px', fontWeight: 800, color: MC.text, fontFamily: 'Sora' }}>
                              {formatIDR(bankBalance)}
                            </p>
                          </div>
                        </div>
                        {/* Visual proportion bar */}
                        <div style={{ background: 'rgba(15,23,42,0.1)', height: '6px', borderRadius: '3px', overflow: 'hidden', display: 'flex' }}>
                          <div style={{ width: `${cashMethodPct}%`, background: '#10B981', height: '100%', transition: 'width 0.3s' }} />
                          <div style={{ width: `${transferMethodPct}%`, background: '#3B82F6', height: '100%', transition: 'width 0.3s' }} />
                        </div>
                        <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '9px', color: MC.muted, marginTop: '4px', fontWeight: 600 }}>
                          <span>{cashMethodPct.toFixed(0)}% Tunai</span>
                          <span>{transferMethodPct.toFixed(0)}% Transfer</span>
                        </div>
                      </div>

                      {/* 2. Rincian Kinerja Penjualan Hari Ini */}
                      <div style={{ background: 'var(--bg-subtle)', borderRadius: '14px', padding: '12px 14px', border: `1px solid ${MC.border}` }}>
                        <p style={{ fontSize: '10px', fontWeight: 800, color: MC.muted, letterSpacing: '0.05em', textTransform: 'uppercase', marginBottom: '10px' }}>
                          📊 Kinerja Penjualan Hari Ini
                        </p>
                        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '8px', marginBottom: '10px' }}>
                          <div>
                            <span style={{ fontSize: '10px', color: MC.muted, fontWeight: 600 }}>Omzet Penjualan</span>
                            <p style={{ fontSize: '13px', fontWeight: 800, color: MC.text, fontFamily: 'Sora' }}>{formatIDR(todayOmzet)}</p>
                          </div>
                          <div>
                            <span style={{ fontSize: '10px', color: MC.muted, fontWeight: 600 }}>Profit Bersih Hari Ini</span>
                            <p style={{ fontSize: '13px', fontWeight: 800, color: MC.green, fontFamily: 'Sora' }}>{formatIDR(todayProfit)}</p>
                          </div>
                        </div>
                        <div style={{ borderTop: `1px solid ${MC.border}`, paddingTop: '8px', display: 'flex', flexDirection: 'column', gap: '4px' }}>
                          <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '11px' }}>
                            <span style={{ color: MC.muted }}>Uang Masuk Hari Ini:</span>
                            <strong style={{ color: MC.amber }}>{formatIDR(todayPaymentsReceived)}</strong>
                          </div>
                          <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '10px', color: MC.muted, paddingLeft: '8px' }}>
                            <span>• Tunai: {formatIDR(todayCashTunai)}</span>
                            <span>• Transfer: {formatIDR(todayCashTransfer)}</span>
                          </div>
                          <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '11px', marginTop: '4px' }}>
                            <span style={{ color: MC.muted }}>Piutang Baru Hari Ini:</span>
                            <strong style={{ color: MC.red }}>{formatIDR(todayPiutang)}</strong>
                          </div>
                        </div>
                      </div>

                      {/* 3. Daftar Transaksi Hari Ini */}
                      <div>
                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '8px' }}>
                          <p style={{ fontSize: '10px', color: MC.muted, fontWeight: 800, letterSpacing: '0.05em', textTransform: 'uppercase' }}>
                            🧾 Transaksi Penjualan Hari Ini ({todaySales.length})
                          </p>
                          {todaySales.length > 0 && (
                            <button
                              onClick={() => navigate(`${brokerBase}/penjualan`)}
                              style={{ fontSize: '10px', color: MC.accent, fontWeight: 700, background: 'none', border: 'none', cursor: 'pointer' }}
                            >
                              Lihat Semua →
                            </button>
                          )}
                        </div>
                        {todaySales.length === 0 ? (
                          <div style={{ padding: '14px', textAlign: 'center', background: 'var(--bg-subtle)', borderRadius: '12px', border: `1px dashed ${MC.border}` }}>
                            <p style={{ fontSize: '11px', color: MC.muted, fontWeight: 600 }}>
                              Belum ada transaksi penjualan dicatat hari ini.
                            </p>
                          </div>
                        ) : (
                          <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
                            {todaySales.map(s => (
                              <div
                                key={s.id}
                                onClick={() => navigate(`${brokerBase}/penjualan?saleId=${s.id}`)}
                                style={{
                                  background: MC.card,
                                  borderRadius: '12px',
                                  padding: '10px 12px',
                                  display: 'flex',
                                  justifyContent: 'space-between',
                                  alignItems: 'center',
                                  cursor: 'pointer',
                                  border: `1px solid ${MC.border}`,
                                }}
                                className="hover:border-slate-300 dark:hover:border-white/20 active:scale-[0.99] transition-all"
                              >
                                <div style={{ minWidth: 0, flex: 1 }}>
                                  <p style={{ fontSize: '12px', fontWeight: 700, color: MC.text, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                                    {s.sembako_customers?.customer_name || s.customer_name || 'Pelanggan Umum'}
                                  </p>
                                  <p style={{ fontSize: '10px', color: MC.muted }}>{s.invoice_number}</p>
                                </div>
                                <div style={{ textAlign: 'right', flexShrink: 0 }}>
                                  <p style={{ fontSize: '12px', fontWeight: 700, color: MC.text, fontFamily: 'Sora' }}>
                                    {formatIDR(s.total_amount)}
                                  </p>
                                  <span style={{
                                    fontSize: '8px',
                                    fontWeight: 900,
                                    padding: '2px 6px',
                                    borderRadius: '4px',
                                    background: s.payment_status === 'lunas' ? 'rgba(22, 163, 74, 0.08)' : 'rgba(220, 38, 38, 0.08)',
                                    color: s.payment_status === 'lunas' ? MC.green : MC.red,
                                    border: s.payment_status === 'lunas' ? '1px solid rgba(22, 163, 74, 0.15)' : '1px solid rgba(220, 38, 38, 0.15)',
                                  }}>
                                    {s.payment_status?.toUpperCase()}
                                  </span>
                                </div>
                              </div>
                            ))}
                          </div>
                        )}
                      </div>

                    </div>
                  </motion.div>
                )}
              </AnimatePresence>
            </motion.div>
          )
        })()}

        {lowStock.length > 0 && (
          <motion.div
            initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }}
            style={{
              background: 'rgba(15,23,42,0.06)', border: `1px solid ${MC.border}`,
              borderRadius: '14px', padding: '14px',
            }}
          >
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '10px' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                <AlertTriangle size={14} color={MC.amber} />
                <span style={{ fontSize: '10px', fontWeight: 800, color: MC.amber, letterSpacing: '0.1em' }}>STOK MENIPIS</span>
                <span style={{ background: 'rgba(15,23,42,0.1)', color: MC.amber, fontSize: '9px', fontWeight: 700, padding: '1px 6px', borderRadius: '5px' }}>{lowStock.length}</span>
              </div>
              <button
                onClick={() => navigate(`${brokerBase}/gudang`)}
                style={{ background: 'transparent', border: 'none', cursor: 'pointer', color: 'var(--brand-500)', fontSize: '11px', fontWeight: 700, padding: 0 }}
              >
                Lihat semua
              </button>
            </div>
            {lowStock.slice(0, 3).map(p => (
              <div key={p.id} style={{
                display: 'flex', alignItems: 'center', justifyContent: 'space-between',
                background: MC.card, borderRadius: '9px', padding: '9px 11px', marginBottom: '6px',
                gap: '8px', border: `1px solid ${MC.border}`,
                boxShadow: '0 1px 2px rgba(0,0,0,0.02)',
              }}>
                <div style={{ minWidth: 0, flex: 1 }}>
                  <p style={{ fontSize: '12px', fontWeight: 700, color: MC.text, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{p.product_name}</p>
                  <p style={{ fontSize: '10px', color: MC.muted, marginTop: '1px' }}>
                    Sisa {p.current_stock} {p.unit || ''} · Min {p.min_stock_alert}
                  </p>
                </div>
                <button
                  onClick={() => navigate(`${brokerBase}/gudang?action=tambah&product=${p.id}`)}
                  style={{
                    background: 'var(--bg-subtle)', border: '1px solid var(--border-soft)',
                    color: 'var(--text-primary)', borderRadius: '7px', padding: '6px 12px',
                    fontSize: '11px', fontWeight: 700, cursor: 'pointer', whiteSpace: 'nowrap',
                    minHeight: '32px'
                  }}
                  className="hover:bg-slate-200 dark:hover:bg-white/10 active:scale-95 transition-all"
                >
                  Tambah
                </button>
              </div>
            ))}
          </motion.div>
        )}

        <CollectionReminders
          sales={sales}
          navigate={navigate}
          brokerBase={brokerBase}
          maxItems={3}
          isMobile={true}
        />

        {/* Quick Actions Grid */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
          <div style={{ display: 'flex', gap: '8px' }}>
            <button
              onClick={onCatatPenjualanOpen}
              style={{
                flex: 1, height: '48px', borderRadius: '12px',
                border: 'none', cursor: 'pointer',
                display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '8px',
                fontSize: '13px',
                WebkitTapHighlightColor: 'transparent',
              }}
              className="bg-[#0F172A] hover:bg-slate-900 text-white dark:bg-tko-brand-500 dark:hover:bg-tko-brand-600 dark:text-tko-forest-950 dark:font-black shadow-tko-brand active:scale-95 transition-all"
            >
              <Plus size={16} /> Catat Jual
            </button>
            <button
              onClick={() => setStokOpen(true)}
              style={{
                flex: 1, height: '48px', borderRadius: '12px',
                cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '8px',
                fontWeight: 700, fontSize: '13px',
                WebkitTapHighlightColor: 'transparent',
              }}
              className="bg-white border border-slate-200 text-slate-800 hover:bg-slate-50 dark:bg-tko-bg-surface dark:border-tko-border-soft dark:text-tko-text-primary dark:hover:bg-tko-bg-subtle shadow-tko-sm active:scale-95 transition-all"
            >
              <Package size={16} /> Tambah Stok
            </button>
          </div>
          <div style={{ display: 'flex', gap: '8px' }}>
            <button
              onClick={() => navigate(`${brokerBase}/produk?action=new`)}
              style={{
                flex: 1, height: '44px', borderRadius: '10px',
                cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '6px',
                fontWeight: 700, fontSize: '11px',
                WebkitTapHighlightColor: 'transparent',
              }}
              className="bg-white border border-slate-200 text-slate-800 hover:bg-slate-50 dark:bg-tko-bg-surface dark:border-tko-border-soft dark:text-tko-text-primary dark:hover:bg-tko-bg-subtle shadow-tko-xs active:scale-95 transition-all"
            >
              <Plus size={12} className="text-slate-600 dark:text-tko-text-muted" /> Produk
            </button>
            <button
              onClick={() => navigate(`${brokerBase}/toko-supplier?action=new`)}
              style={{
                flex: 1, height: '44px', borderRadius: '10px',
                cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '6px',
                fontWeight: 700, fontSize: '11px',
                WebkitTapHighlightColor: 'transparent',
              }}
              className="bg-white border border-slate-200 text-slate-800 hover:bg-slate-50 dark:bg-tko-bg-surface dark:border-tko-border-soft dark:text-tko-text-primary dark:hover:bg-tko-bg-subtle shadow-tko-xs active:scale-95 transition-all"
            >
              <Plus size={12} className="text-slate-600 dark:text-tko-text-muted" /> Toko
            </button>
            {showProfit && (
              <button
                onClick={() => navigate(`${brokerBase}/laporan`)}
                style={{
                  flex: 1, height: '44px', borderRadius: '10px',
                  cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '6px',
                  fontWeight: 700, fontSize: '11px',
                  WebkitTapHighlightColor: 'transparent',
                }}
                className="bg-white border border-slate-200 text-slate-800 hover:bg-slate-50 dark:bg-tko-bg-surface dark:border-tko-border-soft dark:text-tko-text-primary dark:hover:bg-tko-bg-subtle shadow-tko-xs active:scale-95 transition-all"
              >
                <Receipt size={12} className="text-slate-600 dark:text-tko-text-muted" /> Laporan
              </button>
            )}
          </div>
        </div>

        {/* Inventory Snapshot Card */}
        <motion.div
          initial={{ opacity: 0, y: 8 }}
          animate={{ opacity: 1, y: 0 }}
          style={{
            background: MC.card,
            borderRadius: '16px',
            padding: '14px',
            border: `1px solid ${MC.border}`,
            boxShadow: '0 1px 3px rgba(0,0,0,0.05)',
          }}
        >
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
            <div style={{ display: 'flex', gap: '10px', alignItems: 'center' }}>
              <div style={{
                width: '32px', height: '32px', borderRadius: '9px',
                background: MC.input,
                display: 'flex', alignItems: 'center', justifyContent: 'center',
                border: `1px solid ${MC.border}`,
              }}>
                <Warehouse size={16} color="#475569" />
              </div>
              <div>
                <p style={{ fontSize: '9px', color: MC.muted, fontWeight: 700, letterSpacing: '0.05em', textTransform: 'uppercase', marginBottom: '2px' }}>
                  NILAI STOK GUDANG
                </p>
                <p style={{ fontSize: '16px', fontWeight: 800, color: MC.text, fontFamily: "'Sora', 'Inter', sans-serif", lineHeight: 1.1 }}>
                  {formatIDR(stats?.stok?.nilaiStok || 0)}
                </p>
                <p style={{ fontSize: '9px', color: MC.muted, marginTop: '2px' }}>
                  {stats?.stok?.totalProduk || 0} jenis produk aktif
                </p>
              </div>
            </div>
            <button
              onClick={() => setShowInventoryDetail(!showInventoryDetail)}
              style={{
                background: 'var(--bg-subtle)',
                border: '1px solid var(--border-soft)',
                borderRadius: '8px',
                padding: '6px 10px',
                fontSize: '11px',
                fontWeight: 700,
                color: 'var(--text-primary)',
                cursor: 'pointer',
                display: 'flex',
                alignItems: 'center',
                gap: '4px',
              }}
              className="hover:bg-slate-200 dark:hover:bg-white/10 active:scale-95 transition-all shadow-tko-xs"
            >
              {showInventoryDetail ? 'Tutup' : 'Detail'}
              {showInventoryDetail ? <ChevronUp size={12} /> : <ChevronDown size={12} />}
            </button>
          </div>

          <AnimatePresence>
            {showInventoryDetail && (
              <motion.div
                initial={{ height: 0, opacity: 0 }}
                animate={{ height: 'auto', opacity: 1 }}
                exit={{ height: 0, opacity: 0 }}
                style={{ overflow: 'hidden', marginTop: '12px', borderTop: `1px solid ${MC.border}`, paddingTop: '12px' }}
              >
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '8px' }}>
                  <p style={{ fontSize: '10px', color: MC.muted, fontWeight: 700, letterSpacing: '0.05em' }}>
                    TOP 5 PRODUK TERBANYAK
                  </p>
                  <button
                    onClick={() => navigate(`${brokerBase}/gudang`)}
                    style={{ background: 'transparent', border: 'none', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '3px', color: 'var(--brand-500)', fontSize: '11px', fontWeight: 600 }}
                  >
                    Gudang <ChevronRight size={11} />
                  </button>
                </div>
                {topProducts.length === 0 ? (
                  <p style={{ fontSize: '11px', color: MC.muted, fontStyle: 'italic', textAlign: 'center', padding: '12px 0' }}>
                    Belum ada produk terdaftar.
                  </p>
                ) : (
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
                    {topProducts.map(p => (
                      <div
                        key={p.id}
                        onClick={() => navigate(`${brokerBase}/gudang?product=${p.id}`)}
                        style={{
                          background: MC.card,
                          borderRadius: '10px',
                          padding: '10px 12px',
                          display: 'flex',
                          justifyContent: 'space-between',
                          alignItems: 'center',
                          cursor: 'pointer',
                          border: `1px solid ${MC.border}`,
                          boxShadow: '0 1px 2px rgba(0,0,0,0.02)',
                        }}
                      >
                        <div style={{ minWidth: 0, flex: 1 }}>
                          <p style={{ fontSize: '12px', fontWeight: 700, color: MC.text, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{p.product_name}</p>
                          <p style={{ fontSize: '10px', color: MC.muted, marginTop: '2px' }}>Stok: {p.current_stock} {p.unit || ''}</p>
                        </div>
                        <div style={{ textAlign: 'right', flexShrink: 0 }}>
                          <p style={{ fontSize: '12px', fontWeight: 700, color: MC.text }}>
                            {formatIDR(p.current_stock * p.avg_buy_price)}
                          </p>
                          {p.current_stock <= p.min_stock_alert && p.min_stock_alert > 0 && (
                            <span style={{ fontSize: '8px', fontWeight: 800, color: MC.red, textTransform: 'uppercase' }}>Tipis</span>
                          )}
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </motion.div>
            )}
          </AnimatePresence>
        </motion.div>

        {/* Finance Snapshot Card */}
        <motion.div
          initial={{ opacity: 0, y: 8 }}
          animate={{ opacity: 1, y: 0 }}
          style={{
            background: MC.card,
            borderRadius: '16px',
            padding: '14px',
            border: `1px solid ${MC.border}`,
            boxShadow: '0 1px 3px rgba(0,0,0,0.05)',
          }}
        >
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
            <div style={{ display: 'flex', gap: '10px', alignItems: 'center' }}>
              <div style={{
                width: '32px', height: '32px', borderRadius: '9px',
                background: MC.input,
                display: 'flex', alignItems: 'center', justifyContent: 'center',
                border: `1px solid ${MC.border}`,
              }}>
                <Wallet size={16} color="#475569" />
              </div>
              <div>
                <p style={{ fontSize: '9px', color: MC.muted, fontWeight: 700, letterSpacing: '0.05em', textTransform: 'uppercase', marginBottom: '2px' }}>
                  PIUTANG TOKO & OUTSTANDING
                </p>
                <p style={{ fontSize: '16px', fontWeight: 800, color: MC.text, fontFamily: "'Sora', 'Inter', sans-serif", lineHeight: 1.1 }}>
                  {formatIDR(stats?.penjualan?.totalOutstanding || 0)}
                </p>
                <p style={{ fontSize: '9px', color: MC.muted, marginTop: '2px' }}>
                  {showProfit ? `Pengeluaran bulan ini: ${formatIDR(totalExp)}` : 'Akses Operasional Kasir'}
                </p>
              </div>
            </div>
            {showProfit && (
              <button
                onClick={() => setShowFinanceDetail(!showFinanceDetail)}
                style={{
                  background: 'var(--bg-subtle)',
                  border: '1px solid var(--border-soft)',
                  borderRadius: '8px',
                  padding: '6px 10px',
                  fontSize: '11px',
                  fontWeight: 700,
                  color: 'var(--text-primary)',
                  cursor: 'pointer',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '4px',
                }}
                className="hover:bg-slate-200 dark:hover:bg-white/10 active:scale-95 transition-all shadow-tko-xs"
              >
                {showFinanceDetail ? 'Tutup' : 'Detail'}
                {showFinanceDetail ? <ChevronUp size={12} /> : <ChevronDown size={12} />}
              </button>
            )}
          </div>

          <AnimatePresence>
            {showFinanceDetail && (
              <motion.div
                initial={{ height: 0, opacity: 0 }}
                animate={{ height: 'auto', opacity: 1 }}
                exit={{ height: 0, opacity: 0 }}
                style={{ overflow: 'hidden', marginTop: '12px', borderTop: `1px solid ${MC.border}`, paddingTop: '12px' }}
              >
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '8px' }}>
                  <p style={{ fontSize: '10px', color: MC.muted, fontWeight: 700, letterSpacing: '0.05em' }}>
                    DESKRIPSI KEUANGAN BULAN INI
                  </p>
                  <button
                    onClick={() => navigate(`${brokerBase}/laporan`)}
                    style={{ background: 'transparent', border: 'none', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '3px', color: 'var(--brand-500)', fontSize: '11px', fontWeight: 600 }}
                  >
                    Laporan <ChevronRight size={11} />
                  </button>
                </div>
                
                <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', background: MC.card, border: `1px solid ${MC.border}`, borderRadius: '10px', padding: '10px 12px', boxShadow: '0 1px 2px rgba(0,0,0,0.02)' }}>
                    <div>
                      <p style={{ fontSize: '11px', color: MC.muted }}>Penjualan Kotor (Gross Profit)</p>
                      <p style={{ fontSize: '13px', fontWeight: 700, color: MC.text, marginTop: '2px' }}>{formatIDR(stats?.penjualan?.grossProfitThisMonth || 0)}</p>
                    </div>
                  </div>

                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', background: MC.card, border: `1px solid ${MC.border}`, borderRadius: '10px', padding: '10px 12px', boxShadow: '0 1px 2px rgba(0,0,0,0.02)' }}>
                    <div>
                      <p style={{ fontSize: '11px', color: MC.muted }}>Operasional (Expenses)</p>
                      <p style={{ fontSize: '13px', fontWeight: 700, color: MC.text, marginTop: '2px' }}>{formatIDR(stats?.pengeluaran?.totalExpenseThisMonth || 0)}</p>
                    </div>
                  </div>

                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', background: MC.card, border: `1px solid ${MC.border}`, borderRadius: '10px', padding: '10px 12px', boxShadow: '0 1px 2px rgba(0,0,0,0.02)' }}>
                    <div>
                      <p style={{ fontSize: '11px', color: MC.muted }}>Bayar Supplier (Stok)</p>
                      <p style={{ fontSize: '13px', fontWeight: 700, color: MC.text, marginTop: '2px' }}>{formatIDR(stats?.pengeluaran?.totalSupplierPaymentThisMonth || 0)}</p>
                    </div>
                  </div>

                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', background: MC.card, border: `1px solid ${MC.border}`, borderRadius: '10px', padding: '10px 12px', boxShadow: '0 1px 2px rgba(0,0,0,0.02)' }}>
                    <div>
                      <p style={{ fontSize: '11px', color: MC.muted }}>Modal Barang Terkirim (COGS)</p>
                      <p style={{ fontSize: '13px', fontWeight: 700, color: MC.text, marginTop: '2px' }}>{formatIDR(stats?.pengeluaran?.totalCogsThisMonth || 0)}</p>
                    </div>
                  </div>

                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', background: MC.card, border: `1px solid ${MC.border}`, borderRadius: '10px', padding: '10px 12px', boxShadow: '0 1px 2px rgba(0,0,0,0.02)' }}>
                    <div>
                      <p style={{ fontSize: '11px', color: MC.muted }}>Transport & Pengiriman</p>
                      <p style={{ fontSize: '13px', fontWeight: 700, color: MC.text, marginTop: '2px' }}>{formatIDR((stats?.pengeluaran?.totalDeliveryCostThisMonth || 0) + (stats?.pengeluaran?.totalOtherCostThisMonth || 0))}</p>
                    </div>
                  </div>

                  <div 
                    onClick={() => navigate(`${brokerBase}/pegawai`)}
                    style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', background: MC.card, border: `1px solid ${MC.border}`, borderRadius: '10px', padding: '10px 12px', cursor: 'pointer', boxShadow: '0 1px 2px rgba(0,0,0,0.02)' }}
                  >
                    <div>
                      <p style={{ fontSize: '11px', color: MC.muted }}>Gaji Pegawai (Payroll) ↗</p>
                      <p style={{ fontSize: '13px', fontWeight: 700, color: MC.text, marginTop: '2px' }}>{formatIDR(stats?.pengeluaran?.totalPayrollThisMonth || 0)}</p>
                    </div>
                    <span style={{ fontSize: '10px', color: MC.accent, fontWeight: 700 }}>Kelola Pegawai</span>
                  </div>

                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', background: 'rgba(22,163,74,0.06)', border: `1px solid rgba(22,163,74,0.15)`, borderRadius: '10px', padding: '10px 12px' }}>
                    <div>
                      <p style={{ fontSize: '11px', color: MC.green, fontWeight: 700 }}>Profit Bersih (Net Profit)</p>
                      <p style={{ fontSize: '15px', fontWeight: 900, color: MC.green, marginTop: '2px' }}>{formatIDR(stats?.penjualan?.netProfitThisMonth || 0)}</p>
                    </div>
                  </div>
                </div>
              </motion.div>
            )}
          </AnimatePresence>
        </motion.div>

        {/* Agenda Section */}
        <div>
          <AgendaSection
            sales={sales}
            deliveries={deliveries}
            selectedDate={selectedDate}
            setSelectedDate={setSelectedDate}
            currentMonth={currentMonth}
            setCurrentMonth={setCurrentMonth}
            agendaFilter={agendaFilter}
            setAgendaFilter={setAgendaFilter}
            isMobile={true}
          />
        </div>

        {/* Sales Performance Chart + Cash Summary (Khusus Owner) */}
        {showProfit && (
          <SalesAndCashChart
            weeklyData={weeklyChartData}
            monthlyData={monthlyChartData}
            chartPeriod={chartPeriod}
            setChartPeriod={setChartPeriod}
            isDesktop={false}
            unrealizedProfitSnapshot={unrealizedProfitSnapshot}
            cashSummary={cashSummary}
            stats={stats}
            layout={layout}
          />
        )}

        {/* Invoice Terbaru (Sliced to max 3 on mobile) */}
        <div style={{
          background: MC.card, borderRadius: '16px',
          padding: '14px', border: `1px solid ${MC.border}`,
          boxShadow: '0 1px 3px rgba(0,0,0,0.05)',
        }}>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '12px' }}>
            <span style={{ fontSize: '11px', fontWeight: 800, color: MC.accent, letterSpacing: '0.1em' }}>
              INVOICE TERBARU
            </span>
            <button
              onClick={() => navigate(`${brokerBase}/penjualan`)}
              style={{ background: 'transparent', border: 'none', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '3px', color: 'var(--text-muted)', fontSize: '11px', fontWeight: 600 }}
              className="hover:text-tko-text-primary transition-colors"
            >
              Lihat semua <ChevronRight size={11} />
            </button>
          </div>
          {salesLoading ? (
            <p style={{ color: MC.muted, fontSize: '13px', textAlign: 'center', padding: '20px 0' }}>Memuat...</p>
          ) : recentSales.length === 0 ? (
            <div style={{ textAlign: 'center', padding: '24px 0', color: MC.muted }}>
              <ShoppingCart size={24} color={MC.muted} style={{ margin: '0 auto 8px' }} />
              <p style={{ fontSize: '12px' }}>Belum ada invoice</p>
            </div>
          ) : (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '7px' }}>
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

      </div>
    </>
  )
}
