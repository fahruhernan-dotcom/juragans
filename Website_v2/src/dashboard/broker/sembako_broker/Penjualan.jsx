import React, { useState, useMemo, useCallback, useEffect, useRef } from 'react'
import { useLocation, useNavigate, useOutletContext, Link } from 'react-router-dom'
import { BrokerMobileHeader } from '@/dashboard/broker/_shared/components/BrokerMobileHeader'
import {
  Plus, CreditCard, CheckCircle2, AlertTriangle,
  History, Lock, FileSpreadsheet, Store, Factory,
  DollarSign, Receipt, Layers
} from 'lucide-react'
import ImportCsvModal from '@/components/ui/ImportCsvModal'
import {
  useSembakoSales,
  useSembakoReturns,
  useSembakoProducts,
  useSembakoPurchaseInvoices,
  useDeletePurchaseInvoice
} from '@/lib/hooks/useSembakoData'
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@/components/ui/alert-dialog'
import { useMediaQuery } from '@/lib/hooks/useMediaQuery'
import { formatIDR } from '@/lib/format'
import { SembakoPageHeader } from '@/dashboard/broker/sembako_broker/components/SembakoPageHeader'
import { SembakoSummaryStrip } from '@/dashboard/broker/sembako_broker/components/SembakoSummaryStrip'
import { SembakoInvoiceCard } from '@/dashboard/broker/sembako_broker/components/SembakoInvoiceCard'
import { SembakoPurchaseInvoiceCard } from '@/dashboard/broker/sembako_broker/components/SembakoPurchaseInvoiceCard'
import { SembakoPurchaseInvoicePreviewModal } from '@/dashboard/broker/sembako_broker/components/SembakoPurchaseInvoicePreview'
import { SembakoCreatePurchaseInvoiceSheet } from '@/dashboard/broker/sembako_broker/components/SembakoCreatePurchaseInvoiceSheet'
import { SembakoPayPurchaseDebtModal } from '@/dashboard/broker/sembako_broker/components/SembakoPayPurchaseDebtModal'
import { SembakoStatCard, SembakoErrorState } from '@/dashboard/broker/sembako_broker/components/SembakoUiPrimitives'
import { Button } from '@/components/ui/button'
import { SembakoSaleDetailSheet } from '@/dashboard/broker/sembako_broker/components/SembakoSaleDetailSheet'
import { SembakoCreateInvoiceSheet } from '@/dashboard/broker/sembako_broker/components/SembakoCreateInvoiceSheet'
import { C, INVOICE_FILTERS, LoadingSkeleton, EmptyBox } from '@/dashboard/broker/sembako_broker/components/sembakoSaleUtils'
import { useAuth } from '@/lib/hooks/useAuth'
import { useTransactionQuota } from '@/lib/hooks/useTransactionQuota'
import { cn } from '@/lib/utils'

const PURCHASE_FILTERS = [
  { key: 'all', label: 'Semua Faktur' },
  { key: 'paid', label: 'Lunas' },
  { key: 'tempo', label: 'Tempo / Hutang' },
  { key: 'partial', label: 'Sebagian' },
]

export default function SembakoPenjualan() {
  const isDesktop = useMediaQuery('(min-width: 1024px)')
  const { setSidebarOpen = () => window.dispatchEvent(new Event('toggleMobileSidebar')) } = useOutletContext() || {}
  const location = useLocation()
  const navigate = useNavigate()

  const [mainTab, setMainTab] = useState(() => {
    const params = new URLSearchParams(window.location.search)
    return params.get('tab') === 'pembelian' ? 'pembelian' : 'penjualan'
  })

  const [openWizard, setOpenWizard] = useState(() => {
    const params = new URLSearchParams(window.location.search)
    const act = params.get('action')
    return act === 'new' || act === 'tambah'
  })

  // Watch for ?action=new without competing with mount render
  useEffect(() => {
    const params = new URLSearchParams(location.search)
    const action = params.get('action')
    const tabParam = params.get('tab')
    if (tabParam === 'pembelian' || tabParam === 'penjualan') {
      setMainTab(tabParam)
    }
    if (action === 'new' || action === 'tambah') {
      setOpenWizard(true)
    }
  }, [location.search])

  const handleMainTabChange = (newTab) => {
    setMainTab(newTab)
    const params = new URLSearchParams(location.search)
    if (newTab === 'pembelian') {
      params.set('tab', 'pembelian')
    } else {
      params.delete('tab')
    }
    const searchStr = params.toString()
    navigate(location.pathname + (searchStr ? `?${searchStr}` : ''), { replace: true })
  }

  const handleOpenWizardChange = useCallback((isOpen) => {
    setOpenWizard(isOpen)
    if (!isOpen) {
      const params = new URLSearchParams(location.search)
      if (params.get('action')) {
        params.delete('action')
        const searchStr = params.toString()
        navigate(location.pathname + (searchStr ? `?${searchStr}` : ''), { replace: true })
      }
    }
  }, [location.search, location.pathname, navigate])

  return (
    <div style={{ background: C.bg, minHeight: '100vh', paddingBottom: 'max(140px, calc(110px + env(safe-area-inset-bottom, 24px)))' }}>
      {!isDesktop && (
        <BrokerMobileHeader
          title={mainTab === 'pembelian' ? "Pembelian Pabrik" : "Penjualan"}
          onMenuClick={() => setSidebarOpen(true)}
        />
      )}
      <div style={{ maxWidth: '1600px', margin: '0 auto', fontFamily: "'Sora', 'Inter', sans-serif" }}>
        <TabInvoice
          isDesktop={isDesktop}
          openWizard={openWizard}
          setOpenWizard={handleOpenWizardChange}
          mainTab={mainTab}
          onMainTabChange={handleMainTabChange}
        />
      </div>
    </div>
  )
}

function TabInvoice({ isDesktop, openWizard, setOpenWizard, mainTab, onMainTabChange }) {
  const navigate = useNavigate()
  const location = useLocation()
  const { tenant } = useAuth()
  const quota = useTransactionQuota(tenant, { tableName: 'sembako_sales', queryKeyPrefix: 'sembako-transaction-quota' })

  // 1. Sales Data
  const { data: sales = [], isLoading: isSalesLoading, isError: isSalesError, error: salesError, refetch: refetchSales } = useSembakoSales()
  const { data: returnsList = [] } = useSembakoReturns()
  const { data: products = [] } = useSembakoProducts()

  // 2. Purchase Data
  const { data: purchases = [], isLoading: isPurchasesLoading, isError: isPurchasesError, error: purchasesError, refetch: refetchPurchases } = useSembakoPurchaseInvoices()

  // Sales search & filter
  const [salesSearch, setSalesSearch] = useState('')
  const [salesFilter, setSalesFilter] = useState('all')
  const [salesPage, setSalesPage] = useState(0)
  const [selectedSaleId, setSelectedSaleId] = useState(() => {
    const params = new URLSearchParams(window.location.search)
    return params.get('saleId') || null
  })
  const [showDetail, setShowDetail] = useState(() => {
    const params = new URLSearchParams(window.location.search)
    return !!params.get('saleId')
  })
  const [editSaleId, setEditSaleId] = useState(null)
  const [importCsvOpen, setImportCsvOpen] = useState(false)

  // Purchase search & filter
  const [purchaseSearch, setPurchaseSearch] = useState('')
  const [purchaseFilter, setPurchaseFilter] = useState('all')
  const [purchasePage, setPurchasePage] = useState(0)
  const [openPurchaseWizard, setOpenPurchaseWizard] = useState(false)
  const [purchasePreviewData, setPurchasePreviewData] = useState(null)
  const [payDebtInvoice, setPayDebtInvoice] = useState(null)
  const [editPurchaseInvoice, setEditPurchaseInvoice] = useState(null)
  const [deletePurchaseInvoice, setDeletePurchaseInvoice] = useState(null)
  const deletePurchaseMutation = useDeletePurchaseInvoice()

  // Context preservation: sync sale detail sheet if saleId param changes
  useEffect(() => {
    const params = new URLSearchParams(location.search)
    const saleId = params.get('saleId')
    if (saleId) {
      setSelectedSaleId(saleId)
      setShowDetail(true)
    }
  }, [location.search])

  const handleDetailOpenChange = useCallback((open) => {
    setShowDetail(open)
    if (!open) {
      setSelectedSaleId(null)
      const params = new URLSearchParams(location.search)
      if (params.get('saleId')) {
        params.delete('saleId')
        const searchStr = params.toString()
        navigate(location.pathname + (searchStr ? `?${searchStr}` : ''), { replace: true })
      }
    }
  }, [location.search, location.pathname, navigate])

  const PER_PAGE = 20

  // ── Sales Statistics ──
  const salesStats = useMemo(() => {
    const now = new Date()
    const thirtyDaysAgo = new Date(now - 30 * 86400000)
    const thisMonth = sales.filter(s => new Date(s.transaction_date) > thirtyDaysAgo)
    return {
      piutang: sales.reduce((s, i) => s + (i.remaining_amount || 0), 0),
      revenue: thisMonth.reduce((s, i) => s + (i.total_amount || 0), 0),
      lunas: sales.filter(s => s.payment_status === 'lunas').length,
      overdue: sales.filter(s => s.payment_status !== 'lunas' && s.due_date && new Date(s.due_date) < now).length,
    }
  }, [sales])

  // ── Purchase Statistics ──
  const purchaseStats = useMemo(() => {
    const totalHutang = purchases.reduce((acc, p) => acc + (Number(p.remaining_debt) || 0), 0)
    const totalSpent = purchases.reduce((acc, p) => acc + (Number(p.total_amount) || 0), 0)
    const lunasCount = purchases.filter(p => p.payment_status === 'lunas').length
    const tempoCount = purchases.filter(p => p.payment_status !== 'lunas').length
    return {
      hutang: totalHutang,
      totalSpent,
      lunas: lunasCount,
      tempoCount,
    }
  }, [purchases])

  const summaryItems = useMemo(() => {
    if (mainTab === 'pembelian') {
      return [
        { label: 'Hutang Pabrik', value: purchaseStats.hutang, isCurrency: true, color: purchaseStats.hutang > 0 ? 'red' : 'green' },
        { label: 'Tagihan Lunas', value: purchaseStats.lunas, color: 'green' },
        { label: 'Total Belanja', value: purchaseStats.totalSpent, isCurrency: true, color: 'blue' },
      ]
    }
    return [
      { label: 'Piutang Aktif', value: salesStats.piutang, isCurrency: true, color: 'red' },
      { label: 'Invoice Lunas', value: salesStats.lunas, color: 'green' },
      { label: 'Lewat Jatuh Tempo', value: salesStats.overdue, color: salesStats.overdue > 0 ? 'red' : 'green' },
    ]
  }, [mainTab, salesStats, purchaseStats])

  // ── Filtered Sales ──
  const filteredSales = useMemo(() => {
    const q = salesSearch.toLowerCase()
    const list = sales.filter(s => {
      const matchesSearch =
        (s.invoice_number || '').toLowerCase().includes(q) ||
        (s.customer_name || '').toLowerCase().includes(q) ||
        (s.sembako_customers?.customer_name || '').toLowerCase().includes(q)

      if (!matchesSearch) return false
      if (salesFilter === 'all') return true
      if (salesFilter === 'paid') return s.payment_status === 'lunas'
      if (salesFilter === 'partial') return s.payment_status === 'sebagian'
      if (salesFilter === 'unpaid') return (s.remaining_amount || 0) > 0
      if (salesFilter === 'overdue') {
        return s.payment_status !== 'lunas' && s.due_date && new Date(s.due_date) < new Date()
      }
      return true
    })

    return list.sort((a, b) => {
      const timeA = new Date(a.created_at || (a.transaction_date ? `${a.transaction_date}T00:00:00.000Z` : 0)).getTime()
      const timeB = new Date(b.created_at || (b.transaction_date ? `${b.transaction_date}T00:00:00.000Z` : 0)).getTime()
      return timeB - timeA
    })
  }, [sales, salesSearch, salesFilter])

  // ── Filtered Purchases ──
  const filteredPurchases = useMemo(() => {
    const q = purchaseSearch.toLowerCase()
    const list = purchases.filter(p => {
      const matchesSearch =
        (p.invoice_number || '').toLowerCase().includes(q) ||
        (p.supplier_name || '').toLowerCase().includes(q) ||
        (p.notes || '').toLowerCase().includes(q) ||
        (p.items || []).some(it => (it.product_name || it.item_name || '').toLowerCase().includes(q))

      if (!matchesSearch) return false
      if (purchaseFilter === 'all') return true
      if (purchaseFilter === 'paid') return p.payment_status === 'lunas'
      if (purchaseFilter === 'tempo') return p.payment_status === 'tempo' || p.payment_status === 'belum_lunas'
      if (purchaseFilter === 'partial') return p.payment_status === 'sebagian'
      return true
    })

    return list.sort((a, b) => {
      const timeA = new Date(a.transaction_date || a.created_at || 0).getTime()
      const timeB = new Date(b.transaction_date || b.created_at || 0).getTime()
      return timeB - timeA
    })
  }, [purchases, purchaseSearch, purchaseFilter])

  // Pagination Sales
  const salesTotalPages = Math.ceil(filteredSales.length / PER_PAGE)
  const salesActivePage = salesPage >= salesTotalPages ? 0 : salesPage
  const pagedSales = filteredSales.slice(salesActivePage * PER_PAGE, (salesActivePage + 1) * PER_PAGE)

  // Pagination Purchases
  const purchaseTotalPages = Math.ceil(filteredPurchases.length / PER_PAGE)
  const purchaseActivePage = purchasePage >= purchaseTotalPages ? 0 : purchasePage
  const pagedPurchases = filteredPurchases.slice(purchaseActivePage * PER_PAGE, (purchaseActivePage + 1) * PER_PAGE)

  const selectedSale = useMemo(() =>
    sales.find(s => s.id === selectedSaleId),
    [sales, selectedSaleId]
  )

  const handleOpenEdit = useCallback((sale) => {
    setEditSaleId(sale.id)
    setShowDetail(false)
    setTimeout(() => {
      setOpenWizard(true)
    }, 150)
  }, [setEditSaleId, setShowDetail, setOpenWizard])

  const handleWizardClose = useCallback((open) => {
    if (!open) {
      setOpenWizard(false)
      setEditSaleId(null)
    } else {
      setOpenWizard(true)
    }
  }, [setOpenWizard, setEditSaleId])

  const handleManageDelivery = useCallback((saleId) => {
    const base = location.pathname.replace('/penjualan', '/pengiriman')
    navigate(`${base}?saleId=${saleId}`)
  }, [location.pathname, navigate])

  if (isSalesError && mainTab === 'penjualan') return (
    <div style={{ minHeight: '100vh', background: C.bg, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
      <SembakoErrorState error={salesError} onRetry={refetchSales} />
    </div>
  )

  return (
    <div>
      {/* ── Segmented Control Dual-Tab Switcher ── */}
      <div style={{ padding: isDesktop ? '20px 24px 0' : '14px 16px 0' }}>
        <div className="flex items-center gap-1.5 p-1 bg-slate-100 border border-slate-200/90 rounded-2xl w-full sm:w-fit shadow-xs">
          <button
            type="button"
            onClick={() => onMainTabChange('penjualan')}
            className={cn(
              "flex-1 sm:flex-initial px-4 py-2.5 rounded-xl text-xs font-black transition-all flex items-center justify-center gap-2 cursor-pointer",
              mainTab === 'penjualan'
                ? "bg-white text-slate-900 shadow-xs border border-slate-200/70"
                : "text-slate-600 hover:text-slate-900"
            )}
          >
            <Store size={15} className={mainTab === 'penjualan' ? "text-emerald-600" : "text-slate-400"} />
            <span>🛒 Penjualan (Nota Toko)</span>
          </button>

          <button
            type="button"
            onClick={() => onMainTabChange('pembelian')}
            className={cn(
              "flex-1 sm:flex-initial px-4 py-2.5 rounded-xl text-xs font-black transition-all flex items-center justify-center gap-2 cursor-pointer relative",
              mainTab === 'pembelian'
                ? "bg-white text-slate-900 shadow-xs border border-slate-200/70"
                : "text-slate-600 hover:text-slate-900"
            )}
          >
            <Factory size={15} className={mainTab === 'pembelian' ? "text-[#0EA5E9]" : "text-slate-400"} />
            <span>🏭 Pembelian (Tagihan Pabrik)</span>
            {purchaseStats.tempoCount > 0 && (
              <span className="w-2 h-2 rounded-full bg-rose-500 animate-pulse ml-0.5" />
            )}
          </button>
        </div>
      </div>

      {/* ── MAIN TAB: PENJUALAN ── */}
      {mainTab === 'penjualan' && (
        <div>
          <SembakoPageHeader
            title="Penjualan & Invoice"
            subtitle="Arus transaksi, piutang, dan status pengiriman"
            isDesktop={isDesktop}
            searchQuery={salesSearch}
            onSearchChange={setSalesSearch}
            searchPlaceholder="Cari invoice atau nama toko..."
            filters={INVOICE_FILTERS}
            activeFilter={salesFilter}
            onFilterChange={setSalesFilter}
            actionButton={
              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={() => setImportCsvOpen(true)}
                  className="h-10 rounded-xl px-3 text-[10px] font-bold text-foreground bg-card border border-border/60 hover:bg-muted transition-all cursor-pointer flex items-center gap-1.5"
                >
                  <FileSpreadsheet size={15} className="text-[#0F172A]" />
                  <span>Import CSV</span>
                </button>
                <button
                  type="button"
                  onClick={() => !quota.isAtLimit && setOpenWizard(true)}
                  disabled={quota.isAtLimit}
                  title={quota.isAtLimit ? 'Kuota transaksi bulan ini habis — Upgrade ke Pro' : undefined}
                  className="h-10 rounded-xl px-4 text-[10px] font-black uppercase tracking-widest text-white dark:text-tko-forest-950 dark:font-black bg-[#0F172A] dark:bg-tko-brand-500 hover:opacity-95 shadow-tko-brand disabled:opacity-40 disabled:cursor-not-allowed cursor-pointer border-none flex items-center"
                  style={quota.isAtLimit ? { background: '#6B7280' } : {}}
                >
                  {quota.isAtLimit ? <Lock size={14} className="mr-1" /> : <Plus size={15} className="mr-1" />}
                  {quota.isAtLimit ? 'Kuota Habis' : 'Catat Penjualan'}
                </button>
              </div>
            }
          />

          {!isDesktop && <SembakoSummaryStrip isDesktop={isDesktop} items={summaryItems} />}

          {isDesktop && (
            <div style={{ padding: '20px 24px 0', display: 'grid', gridTemplateColumns: 'repeat(3,1fr)', gap: '12px', marginBottom: '20px' }}>
              <SembakoStatCard icon={CreditCard} label="Piutang" value={formatIDR(salesStats.piutang)} color="red" subLabel="Sisa tagihan aktif" />
              <SembakoStatCard icon={CheckCircle2} label="Lunas" value={salesStats.lunas} color="green" subLabel="Invoice selesai" />
              <SembakoStatCard icon={AlertTriangle} label="Jatuh Tempo" value={salesStats.overdue} color={salesStats.overdue > 0 ? 'red' : 'green'} subLabel="Butuh follow-up" />
            </div>
          )}

          {/* Quota Banner — Starter only */}
          {quota.isStarter && (
            <div style={{ padding: isDesktop ? '0 24px' : '0 16px', marginBottom: '12px' }}>
              <div
                className="px-4 py-3 rounded-xl flex items-center justify-between gap-3"
                style={{
                  background: quota.isAtLimit
                    ? 'rgba(239,68,68,0.08)'
                    : quota.remaining <= 5
                      ? 'rgba(245,158,11,0.08)'
                      : 'rgba(15,23,42,0.06)',
                  border: `1px solid ${quota.isAtLimit
                    ? 'rgba(239,68,68,0.25)'
                    : quota.remaining <= 5
                      ? 'rgba(245,158,11,0.2)'
                      : 'rgba(15,23,42,0.12)'}`,
                }}
              >
                <div className="flex items-center gap-2.5 min-w-0">
                  <div
                    className="flex-shrink-0 w-6 h-6 rounded-lg flex items-center justify-center"
                    style={{ background: quota.isAtLimit ? 'rgba(239,68,68,0.15)' : 'rgba(15,23,42,0.08)' }}
                  >
                    <span className="text-[11px]">{quota.isAtLimit ? '🔒' : '📊'}</span>
                  </div>
                  <div className="min-w-0">
                    <p
                      className="text-[11px] font-bold leading-tight"
                      style={{ color: quota.isAtLimit ? '#F87171' : quota.remaining <= 5 ? '#FBBF24' : '#94A3B8' }}
                    >
                      {quota.isAtLimit
                        ? 'Kuota bulan ini habis'
                        : `${quota.used} / ${quota.limit} transaksi bulan ini`}
                    </p>
                    {quota.isAtLimit && (
                      <p className="text-[10px] mt-0.5" style={{ color: '#64748B' }}>
                        Upgrade ke Pro untuk transaksi unlimited
                      </p>
                    )}
                  </div>
                </div>
                {!quota.isAtLimit && (
                  <div className="w-20 flex-shrink-0">
                    <div className="h-1.5 rounded-full overflow-hidden" style={{ background: 'rgba(255,255,255,0.06)' }}>
                      <div
                        className="h-full rounded-full transition-all duration-500"
                        style={{
                          width: `${Math.min(100, (quota.used / quota.limit) * 100)}%`,
                          background: quota.remaining <= 5 ? '#F59E0B' : '#0F172A',
                        }}
                      />
                    </div>
                    <p className="text-[9px] text-right mt-0.5" style={{ color: '#94A3B8' }}>{quota.remaining} sisa</p>
                  </div>
                )}
                {quota.isAtLimit && (
                  <Link
                    to="/upgrade"
                    className="flex-shrink-0 text-[10px] font-black px-3 py-1.5 rounded-lg whitespace-nowrap transition-colors"
                    style={{ color: '#0F172A', border: '1px solid rgba(15,23,42,0.3)' }}
                  >
                    Upgrade
                  </Link>
                )}
              </div>
            </div>
          )}

          {/* Sales Invoices List */}
          <div style={{ padding: isDesktop ? '0 24px' : '0 16px' }}>
            {isSalesLoading ? <LoadingSkeleton /> : pagedSales.length === 0 ? (
              sales.length === 0 && salesFilter === 'all' && !salesSearch ? (
                <EmptyBox
                  icon={History}
                  text="Belum ada transaksi penjualan"
                  hint="Catat penjualan pertama Anda untuk mulai mengelola bisnis"
                  actionLabel="+ Catat Penjualan Pertama"
                  onAction={() => setOpenWizard(true)}
                />
              ) : (
                <EmptyBox icon={History} text="Belum ada invoice yang cocok dengan filter ini" />
              )
            ) : (
              <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
                {pagedSales.map(sale => (
                  <SembakoInvoiceCard
                    key={sale.id}
                    sale={sale}
                    returnsList={returnsList}
                    products={products}
                    isDesktop={isDesktop}
                    onOpenDetail={() => {
                      setSelectedSaleId(sale.id)
                      setShowDetail(true)
                    }}
                    onEdit={() => handleOpenEdit(sale)}
                    onManageDelivery={() => handleManageDelivery(sale.id)}
                  />
                ))}
              </div>
            )}
          </div>

          {salesTotalPages > 1 && (
            <div style={{ display: 'flex', justifyContent: 'center', gap: '8px', marginTop: '16px', padding: isDesktop ? '0 24px' : '0 16px' }}>
              {Array.from({ length: salesTotalPages }, (_, i) => (
                <button key={i} onClick={() => setSalesPage(i)} style={{
                  width: '32px', height: '32px', borderRadius: '8px', border: 'none', cursor: 'pointer',
                  background: salesActivePage === i ? C.accent : C.card, color: salesActivePage === i ? '#fff' : C.muted,
                  fontWeight: 700, fontSize: '12px',
                }}>{i + 1}</button>
              ))}
            </div>
          )}
        </div>
      )}

      {/* ── MAIN TAB: PEMBELIAN (TAGIHAN PABRIK) ── */}
      {mainTab === 'pembelian' && (
        <div>
          <SembakoPageHeader
            title="Pembelian & Tagihan Pabrik"
            subtitle="Faktur pembelian stok, hutang supplier, pouch, stiker, dan kemasan"
            isDesktop={isDesktop}
            searchQuery={purchaseSearch}
            onSearchChange={setPurchaseSearch}
            searchPlaceholder="Cari nomor invoice, supplier, atau barang..."
            filters={PURCHASE_FILTERS}
            activeFilter={purchaseFilter}
            onFilterChange={setPurchaseFilter}
            actionButton={
              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={() => setOpenPurchaseWizard(true)}
                  className="h-10 rounded-xl px-4 text-[10px] font-black uppercase tracking-widest text-white bg-[#0EA5E9] hover:bg-[#0284C7] shadow-md shadow-sky-500/20 cursor-pointer border-none flex items-center gap-1.5"
                >
                  <Plus size={15} />
                  <span>Catat Tagihan Pabrik</span>
                </button>
              </div>
            }
          />

          {!isDesktop && <SembakoSummaryStrip isDesktop={isDesktop} items={summaryItems} />}

          {isDesktop && (
            <div style={{ padding: '20px 24px 0', display: 'grid', gridTemplateColumns: 'repeat(3,1fr)', gap: '12px', marginBottom: '20px' }}>
              <SembakoStatCard
                icon={CreditCard}
                label="Hutang Pabrik"
                value={formatIDR(purchaseStats.hutang)}
                color={purchaseStats.hutang > 0 ? "red" : "green"}
                subLabel="Sisa tagihan tempo aktif"
              />
              <SembakoStatCard
                icon={CheckCircle2}
                label="Tagihan Lunas"
                value={purchaseStats.lunas}
                color="green"
                subLabel="Faktur pabrik selesai"
              />
              <SembakoStatCard
                icon={Factory}
                label="Total Belanja Modal"
                value={formatIDR(purchaseStats.totalSpent)}
                color="blue"
                subLabel="Akumulasi HPP pengadaan"
              />
            </div>
          )}

          {/* Purchase Invoices List */}
          <div style={{ padding: isDesktop ? '0 24px' : '0 16px' }}>
            {isPurchasesLoading ? <LoadingSkeleton /> : pagedPurchases.length === 0 ? (
              purchases.length === 0 && purchaseFilter === 'all' && !purchaseSearch ? (
                <EmptyBox
                  icon={Factory}
                  text="Belum ada transaksi pembelian pabrik"
                  hint="Catat faktur pengambilan stok dari pabrik atau pengadaan kemasan & stiker"
                  actionLabel="+ Catat Tagihan Pabrik Pertama"
                  onAction={() => setOpenPurchaseWizard(true)}
                />
              ) : (
                <EmptyBox icon={Factory} text="Belum ada faktur pembelian yang cocok dengan filter ini" />
              )
            ) : (
              <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
                {pagedPurchases.map(inv => (
                  <SembakoPurchaseInvoiceCard
                    key={inv.id || inv.invoice_number}
                    invoice={inv}
                    isDesktop={isDesktop}
                    onOpenPreview={(selected) => setPurchasePreviewData(selected)}
                    onOpenPayDebt={(selected) => setPayDebtInvoice(selected)}
                    onOpenEdit={(selected) => {
                      setEditPurchaseInvoice(selected)
                      setOpenPurchaseWizard(true)
                    }}
                    onDelete={(selected) => setDeletePurchaseInvoice(selected)}
                  />
                ))}
              </div>
            )}
          </div>

          {purchaseTotalPages > 1 && (
            <div style={{ display: 'flex', justifyContent: 'center', gap: '8px', marginTop: '16px', padding: isDesktop ? '0 24px' : '0 16px' }}>
              {Array.from({ length: purchaseTotalPages }, (_, i) => (
                <button key={i} onClick={() => setPurchasePage(i)} style={{
                  width: '32px', height: '32px', borderRadius: '8px', border: 'none', cursor: 'pointer',
                  background: purchaseActivePage === i ? '#0EA5E9' : C.card, color: purchaseActivePage === i ? '#fff' : C.muted,
                  fontWeight: 700, fontSize: '12px',
                }}>{i + 1}</button>
              ))}
            </div>
          )}
        </div>
      )}

      {/* ── Sheets & Modals ── */}
      {/* 1. Sales Wizard & Detail */}
      <SembakoCreateInvoiceSheet open={openWizard} onOpenChange={handleWizardClose} editId={editSaleId} />
      <SembakoSaleDetailSheet
        isOpen={showDetail}
        onOpenChange={handleDetailOpenChange}
        sale={selectedSale}
        onEdit={handleOpenEdit}
      />
      <ImportCsvModal
        open={importCsvOpen}
        onClose={() => setImportCsvOpen(false)}
        defaultEntity="sales"
      />

      {/* 2. Purchase Wizard, Preview, & Debt Payment */}
      <SembakoCreatePurchaseInvoiceSheet
        open={openPurchaseWizard}
        onOpenChange={(isOpen) => {
          setOpenPurchaseWizard(isOpen)
          if (!isOpen) {
            setEditPurchaseInvoice(null)
          }
        }}
        editInvoice={editPurchaseInvoice}
        onSuccessPreview={(createdInvoice) => setPurchasePreviewData(createdInvoice)}
      />

      {purchasePreviewData && (
        <SembakoPurchaseInvoicePreviewModal
          isOpen={!!purchasePreviewData}
          onClose={() => setPurchasePreviewData(null)}
          data={purchasePreviewData}
          onOpenEdit={(selected) => {
            setEditPurchaseInvoice(selected)
            setOpenPurchaseWizard(true)
          }}
        />
      )}

      {payDebtInvoice && (
        <SembakoPayPurchaseDebtModal
          isOpen={!!payDebtInvoice}
          onClose={() => setPayDebtInvoice(null)}
          invoice={payDebtInvoice}
        />
      )}

      {/* 3. Delete Purchase Invoice Confirmation Dialog */}
      {deletePurchaseInvoice && (
        <AlertDialog open={!!deletePurchaseInvoice} onOpenChange={(open) => !open && setDeletePurchaseInvoice(null)}>
          <AlertDialogContent className="rounded-2xl max-w-md">
            <AlertDialogHeader>
              <AlertDialogTitle className="text-base font-black text-slate-900 flex items-center gap-2">
                <AlertTriangle className="text-rose-600" size={18} />
                Hapus Faktur Pembelian Pabrik?
              </AlertDialogTitle>
              <AlertDialogDescription className="text-xs text-slate-600 leading-relaxed space-y-2">
                <div>
                  Anda akan menghapus faktur <strong className="text-slate-900 font-mono">{deletePurchaseInvoice.invoice_number}</strong> ({deletePurchaseInvoice.supplier_name}) dengan total tagihan <strong>{formatIDR(deletePurchaseInvoice.total_amount)}</strong>.
                </div>
                <div className="bg-rose-50 border border-rose-200 text-rose-800 p-2.5 rounded-xl font-medium text-[11px] mt-2">
                  ⚠️ <strong>Perhatian:</strong> Penghapusan ini akan otomatis melakukan <em>rollback</em> kuantitas batch stok barang/bahan baku, mutasi inventaris, dan riwayat pembayaran terkait agar angka stok tetap 100% sinkron tanpa selisih 1 milipun.
                </div>
              </AlertDialogDescription>
            </AlertDialogHeader>
            <AlertDialogFooter className="gap-2 sm:gap-0 mt-4">
              <AlertDialogCancel className="rounded-xl text-xs font-bold">
                Batal
              </AlertDialogCancel>
              <AlertDialogAction
                disabled={deletePurchaseMutation.isPending}
                onClick={async () => {
                  try {
                    await deletePurchaseMutation.mutateAsync({
                      invoice_number: deletePurchaseInvoice.invoice_number
                    })
                    setDeletePurchaseInvoice(null)
                  } catch (err) {
                    // Handled by toast in mutation
                  }
                }}
                className="bg-rose-600 hover:bg-rose-700 text-white rounded-xl text-xs font-bold gap-1.5"
              >
                {deletePurchaseMutation.isPending ? 'Menghapus & Rollback...' : 'Ya, Hapus Faktur'}
              </AlertDialogAction>
            </AlertDialogFooter>
          </AlertDialogContent>
        </AlertDialog>
      )}
    </div>
  )
}
