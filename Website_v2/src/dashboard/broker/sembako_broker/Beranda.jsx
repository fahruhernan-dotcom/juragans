import { useState, useMemo } from 'react'
import { useNavigate } from 'react-router-dom'
import { AnimatePresence } from 'framer-motion'
import { useAuth } from '@/lib/hooks/useAuth'
import { useMediaQuery, useResponsiveLayout } from '@/lib/hooks/useMediaQuery'
import {
  useSembakoDashboardStats,
  useSembakoSales,
  useSembakoEmployees,
  useSembakoDeliveries,
  useSembakoProducts,
  useSembakoSuppliers,
  useSembakoAllBatches,
  useSembakoExpenses,
  useSembakoPayroll,
  useSembakoAllSupplierPayments
} from '@/lib/hooks/useSembakoData'
import {
  startOfWeek, startOfMonth, subMonths, addDays, format,
} from 'date-fns'
import { id as idLocale } from 'date-fns/locale/id'
import { C } from './components/sembakoSaleUtils'
import { SembakoTambahStokSheet } from './components/SembakoTambahStokSheet'
import { SembakoCreateInvoiceSheet } from './components/SembakoCreateInvoiceSheet'
import { SembakoErrorState } from '@/dashboard/broker/sembako_broker/components/SembakoUiPrimitives'
 
import { BerandaSkeleton } from './components/beranda/BerandaUtils'
import { DesktopBeranda } from './components/beranda/DesktopBeranda'
import { MobileBeranda } from './components/beranda/MobileBeranda'

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

export default function SembakoBeranda() {
  const navigate    = useNavigate()
  const { profile, tenant, profiles, switchTenant } = useAuth()
  const isDesktop  = useMediaQuery('(min-width: 1024px)')
  const layout     = useResponsiveLayout()
 
  const { data: stats, isLoading: statsLoading, isError: isStatsError, error: statsError, refetch: refetchStats } = useSembakoDashboardStats()
  const { data: sales = [],      isLoading: salesLoading } = useSembakoSales()
  const { data: employees = [] }                           = useSembakoEmployees()
  const { data: deliveries = [] }                          = useSembakoDeliveries()
  const { data: products = [] }                            = useSembakoProducts()
  const { data: suppliers = [] }                           = useSembakoSuppliers()
  const { data: batches = [] }                             = useSembakoAllBatches()
  const { data: expenses = [] }                            = useSembakoExpenses()
  const { data: payroll = [] }                             = useSembakoPayroll()
  const { data: supplierPayments = [] }                    = useSembakoAllSupplierPayments()

  // Chart + insight state
  const [chartPeriod,   setChartPeriod]   = useState('weekly')
  const [selectedDate,  setSelectedDate]  = useState(new Date())
  const [currentMonth,  setCurrentMonth]  = useState(new Date())
  const [agendaFilter,  setAgendaFilter]  = useState('Semua')
  const [stokOpen,      setStokOpen]      = useState(false)
  const [saleWizardOpen, setSaleWizardOpen] = useState(false)

  const name = profile?.full_name?.split(' ')[0] || 'Pengguna'

  // Build chart data — Sales chart (invoice-date) + Cash summary (payment-date)
  const { weeklyChartData, monthlyChartData, insight, kpiTrends, cashSummary, unrealizedProfitSnapshot } = useMemo(() => {
    const today = new Date()
    today.setHours(0, 0, 0, 0)

    const mondayStart = startOfWeek(today, { weekStartsOn: 1 })
    const monthStart  = startOfMonth(today)
    const m1Start     = startOfMonth(subMonths(today, 1))

    // ── Cash Flow + Profit Chart Data ──
    const buildData = (start, end) => {
      const days = []
      let curr = new Date(start)
      while (curr <= end) {
        const dStr = format(curr, 'yyyy-MM-dd')
        const isFuture = curr > today
        const isWeekly = (end - start) / 86400000 < 8

        // 0. Accrual Sales & Profits (Invoice-date based)
        const daySales = isFuture ? [] : sales.filter(s => s.transaction_date?.slice(0, 10) === dStr)
        const grossProfit = isFuture ? 0 : daySales.reduce((s, sale) => {
          // Use gross_profit from processSaleRow directly (subtotal - cogs) instead of reconstructing from net+ops
          return s + (Number(sale.gross_profit) || (Number(sale.subtotal || 0) - Number(sale.total_cogs || 0)))
        }, 0)
        const netProfit = isFuture ? 0 : daySales.reduce((s, sale) => {
          return s + (Number(sale.net_profit) || 0)
        }, 0)

        // 1. Customer Payments (Cash In) — exclude non-cash retur markers
        const dayPayments = []
        if (!isFuture) {
          sales.forEach(s => {
            const customerName = s.sembako_customers?.customer_name || s.customer_name || 'Umum'
            ;(s.sembako_payments || []).forEach(p => {
              if (!p.is_deleted && p.payment_date?.slice(0, 10) === dStr && p.payment_method !== 'potong_piutang_retur') {
                dayPayments.push({
                  id: p.id,
                  customerName,
                  amount: Number(p.amount || p.amount_paid || 0)
                })
              }
            })
          })
        }
        const cashIn = dayPayments.reduce((sum, p) => sum + p.amount, 0)

        // 2. Supplier Payments (Cash Out — purchases)
        const daySupplierPayments = isFuture ? [] : supplierPayments.filter(p => {
          return !p.is_deleted && p.payment_date?.slice(0, 10) === dStr
        }).map(p => {
          const supp = suppliers.find(s => s.id === p.supplier_id)
          return {
            id: p.id,
            label: supp ? supp.supplier_name : 'Supplier',
            amount: Number(p.amount || 0)
          }
        })
        const cashOutPurchases = daySupplierPayments.reduce((sum, p) => sum + p.amount, 0)

        // 3. Operational Expenses (Cash Out — expenses)
        const dayExpenses = isFuture ? [] : expenses.filter(e => {
          return !e.is_deleted && e.expense_date?.slice(0, 10) === dStr
        }).map(e => ({
          id: e.id,
          label: e.description || e.category || 'Biaya Ops',
          amount: Number(e.amount || 0)
        }))
        const cashOutExpenses = dayExpenses.reduce((sum, e) => sum + e.amount, 0)

        // 4. Payroll Paid (Cash Out — payroll)
        const dayPayroll = isFuture ? [] : payroll.filter(p => {
          if (p.is_deleted || p.payment_status !== 'paid') return false
          const payDate = (p.paid_at || p.period_date || p.created_at)?.slice(0, 10)
          return payDate === dStr
        }).map(p => {
          const emp = employees.find(e => e.id === p.employee_id)
          return {
            id: p.id,
            label: `Gaji ${emp ? emp.full_name : 'Pegawai'}`,
            amount: Number(p.total_pay || 0)
          }
        })
        const cashOutPayroll = dayPayroll.reduce((sum, p) => sum + p.amount, 0)
        const cashOutCogs = isFuture ? 0 : daySales.reduce((sum, s) => sum + (Number(s.total_cogs) || 0), 0)
        const cashOutDelivery = isFuture ? 0 : daySales.reduce((sum, s) => sum + (Number(s.delivery_cost) || 0) + (Number(s.other_cost) || 0), 0)

        // Arus Kas Keluar Riil: Pembelian stok supplier + Pengeluaran ops + Gaji + Ongkir internal
        const cashOut = cashOutPurchases + cashOutExpenses + cashOutPayroll + cashOutDelivery

        days.push({
          name: isWeekly
            ? format(curr, 'EEE', { locale: idLocale })
            : format(curr, 'd'),
          fullDate: format(curr, 'EEEE, d MMMM yyyy', { locale: idLocale }),
          grossProfit,
          netProfit,
          cashIn,
          cashOut,
          cashOutPurchases,
          cashOutExpenses,
          cashOutPayroll,
          cashOutCogs,
          cashOutDelivery,
          dayPayments,
          daySupplierPayments,
          dayExpenses,
          dayPayroll
        })
        curr = addDays(curr, 1)
      }
      return days
    }

    const weeklyChartData  = buildData(mondayStart, addDays(mondayStart, 6))
    const monthlyChartData = buildData(monthStart, today)

    // ── Cash Summary (payment-date based, computed once for current state) ──
    const INITIAL_CAPITAL = 0

    // Cash In: all payments ever received (including negative refund payments to get net cash inflow)
    let totalCashIn = 0
    let totalCashMethod = 0
    let totalTransferMethod = 0
    let todayCashMethod = 0
    let todayTransferMethod = 0
    const todayStrKey = format(today, 'yyyy-MM-dd')

    sales.forEach(s => {
      const pmts = (s.sembako_payments || []).filter(p => !p.is_deleted)
      pmts.forEach(p => {
        const amt = Number(p.amount || p.amount_paid || 0)
        totalCashIn += amt
        const method = String(p.payment_method || '').toLowerCase()
        let isToday = (p.payment_date && p.payment_date.startsWith(todayStrKey)) || (s.transaction_date && s.transaction_date.startsWith(todayStrKey))
        if (!isToday && (s.created_at || p.created_at)) {
          try {
            const sc = s.created_at ? format(new Date(s.created_at), 'yyyy-MM-dd') : null
            const pc = p.created_at ? format(new Date(p.created_at), 'yyyy-MM-dd') : null
            if (sc === todayStrKey || pc === todayStrKey) isToday = true
          } catch (e) {
            // ignore
          }
        }

        if (method === 'transfer') {
          totalTransferMethod += amt
          if (isToday) todayTransferMethod += amt
        } else {
          totalCashMethod += amt
          if (isToday) todayCashMethod += amt
        }
      })
    })

    // Cash Out (Riil): Pembelian Supplier + Beban Operasional + Gaji Pegawai + Ongkir/Biaya Kirim
    // Catatan: COGS/HPP adalah beban akuntansi persediaan dan bukan kas keluar terpisah (kas keluar terjadi saat beli ke supplier).
    
    // 1. Pembayaran ke Supplier (Tunai vs Transfer)
    let totalSupplierPaidTunai = 0
    let totalSupplierPaidTransfer = 0
    let todaySupplierPaidTunai = 0
    let todaySupplierPaidTransfer = 0

    if (supplierPayments && supplierPayments.length > 0) {
      supplierPayments.filter(sp => !sp.is_deleted).forEach(sp => {
        const amt = Number(sp.amount || 0)
        const method = String(sp.payment_method || 'cash').toLowerCase()
        const isSpToday = (sp.payment_date && sp.payment_date.startsWith(todayStrKey)) ||
                          (sp.created_at && format(new Date(sp.created_at), 'yyyy-MM-dd') === todayStrKey)
        if (method === 'transfer') {
          totalSupplierPaidTransfer += amt
          if (isSpToday) todaySupplierPaidTransfer += amt
        } else {
          totalSupplierPaidTunai += amt
          if (isSpToday) todaySupplierPaidTunai += amt
        }
      })
    } else {
      const totalPaid = suppliers.reduce((sum, s) => sum + (Number(s.total_paid_value) || 0), 0)
      totalSupplierPaidTunai = totalPaid
    }

    // 2. Pengeluaran Operasional (Tunai vs Transfer)
    let totalExpensesTunai = 0
    let totalExpensesTransfer = 0
    expenses.forEach(e => {
      const amt = Number(e.amount || 0)
      const method = String(e.payment_method || 'cash').toLowerCase()
      if (method === 'transfer') {
        totalExpensesTransfer += amt
      } else {
        totalExpensesTunai += amt
      }
    })

    // 3. Gaji Pegawai (Tunai vs Transfer)
    let totalPayrollTunai = 0
    let totalPayrollTransfer = 0
    payroll.filter(p => !p.is_deleted && p.payment_status === 'paid').forEach(p => {
      const amt = Number(p.total_pay || 0)
      const method = String(p.payment_method || 'cash').toLowerCase()
      if (method === 'transfer') {
        totalPayrollTransfer += amt
      } else {
        totalPayrollTunai += amt
      }
    })

    // 4. Biaya Pengiriman & Operasional Internal Penjualan (Kas Tunai)
    const totalCashOutDelivery = sales.reduce((sum, s) => sum + (Number(s.delivery_cost) || 0) + (Number(s.other_cost) || 0), 0)
    const totalCashOutCogs = sales.reduce((sum, s) => sum + (Number(s.total_cogs) || 0), 0)

    // Agregat Pengeluaran per Jalur Kas
    const totalCashOutTunai = totalSupplierPaidTunai + totalExpensesTunai + totalPayrollTunai + totalCashOutDelivery
    const totalCashOutTransfer = totalSupplierPaidTransfer + totalExpensesTransfer + totalPayrollTransfer
    const totalCashOut = totalCashOutTunai + totalCashOutTransfer

    const totalCashOutPurchases = totalSupplierPaidTunai + totalSupplierPaidTransfer
    const totalCashOutExpenses = totalExpensesTunai + totalExpensesTransfer
    const totalCashOutPayroll = totalPayrollTunai + totalPayrollTransfer

    const cashBalance = INITIAL_CAPITAL + totalCashIn - totalCashOut

    // Posisi Saldo Kas Fisik vs Rekening Bank Riil
    const netCashInHand = Math.max(0, INITIAL_CAPITAL + totalCashMethod - totalCashOutTunai)
    const netBankBalance = Math.max(0, totalTransferMethod - totalCashOutTransfer)
    const totalLiquidCash = netCashInHand + netBankBalance

    // Realized & Unrealized Profit: computed per sale as clean integers with no rounding discrepancies
    let totalRealizedProfit = 0
    let totalUnrealizedProfit = 0

    sales.forEach(s => {
      const net = Number(s.net_profit) || 0
      const total = Number(s.total_amount) || 0
      const paid = Number(s.paid_amount) || 0
      let realized = 0
      if (total > 0) {
        const ratio = Math.max(0, Math.min(1, paid / total))
        realized = Math.round(net * ratio)
      } else {
        realized = net
      }
      const unrealized = net - realized
      totalRealizedProfit += realized
      totalUnrealizedProfit += unrealized
    })

    const cashSummary = {
      totalCashIn,
      totalCashOutPurchases,
      totalCashOutExpenses,
      totalCashOutPayroll,
      totalCashOutCogs,
      totalCashOutDelivery,
      totalCashOut,
      cashBalance,
      liquidCash: totalLiquidCash,
      cashInHand: netCashInHand,
      bankBalance: netBankBalance,
      todayCashMethod,
      todayTransferMethod,
      todayTotalPayment: todayCashMethod + todayTransferMethod,
      realizedProfit: totalRealizedProfit,
    }

    // ── Unrealized Profit Snapshot ──
    const unrealizedProfitSnapshot = totalUnrealizedProfit

    // ── Smart insight: W0 vs W1 (net profit based on invoice date — stable) ──
    const w0Start = addDays(today, -6)
    const w1End   = addDays(w0Start, -1)
    const w1Start = addDays(w1End, -6)
    const getNetProfit = (from, to) => sales
      .filter(s => { const d = new Date(s.transaction_date); return d >= from && d <= to })
      .reduce((sum, s) => sum + (Number(s.net_profit) || 0), 0)

    const w0 = getNetProfit(w0Start, today)
    const w1 = getNetProfit(w1Start, w1End)
    let insight = null
    if (w1 !== 0) {
      const diff = ((w0 - w1) / Math.abs(w1)) * 100
      insight = {
        type: diff >= 0 ? 'up' : 'down',
        value: Math.abs(diff).toFixed(0),
        text: diff >= 0
          ? `↑ Profit naik +${Math.abs(diff).toFixed(0)}% dibanding minggu lalu`
          : `↓ Profit turun ${Math.abs(diff).toFixed(0)}% dibanding minggu lalu`,
      }
    }

    // KPI trends: this month vs last month
    const m0Sales = sales.filter(s => new Date(s.transaction_date) >= monthStart && new Date(s.transaction_date) <= today)
    const m1Sales = sales.filter(s => { const d = new Date(s.transaction_date); return d >= m1Start && d < monthStart })
    const m0Outstanding = m0Sales.filter(s => s.payment_status !== 'lunas').reduce((s, i) => s + (i.remaining_amount || 0), 0)
    const m1Outstanding = m1Sales.filter(s => s.payment_status !== 'lunas').reduce((s, i) => s + (i.remaining_amount || 0), 0)
    const piutangTrend = m1Outstanding !== 0 ? ((m0Outstanding - m1Outstanding) / m1Outstanding) * 100 : null
    const txTrend = m1Sales.length !== 0 ? ((m0Sales.length - m1Sales.length) / m1Sales.length) * 100 : null

    return { weeklyChartData, monthlyChartData, insight, kpiTrends: { piutangTrend, txTrend }, cashSummary, unrealizedProfitSnapshot }
  }, [sales, batches, expenses, payroll, suppliers, supplierPayments, employees])

  if (statsLoading && !!tenant?.id) {
    return (
      <div style={{ background: MC.bg, minHeight: '100vh' }}>
        <BerandaSkeleton isDesktop={isDesktop} />
      </div>
    )
  }

  if (isStatsError) return <div style={{ minHeight: '100vh', background: MC.bg }}><SembakoErrorState error={statsError} onRetry={refetchStats} /></div>

  const sharedProps = {
    profile, stats, sales, employees, deliveries, products, navigate, name, salesLoading,
    insight, kpiTrends, chartPeriod, setChartPeriod,
    weeklyChartData, monthlyChartData, cashSummary, unrealizedProfitSnapshot,
    selectedDate, setSelectedDate,
    currentMonth, setCurrentMonth,
    agendaFilter, setAgendaFilter,
    setStokOpen,
    batches,
    suppliers,
    onCatatPenjualanOpen: () => setSaleWizardOpen(true),
    layout,
  }

  return (
    <div style={{ background: MC.bg, minHeight: '100vh', color: MC.text }}>
      {isDesktop ? (
        <DesktopBeranda {...sharedProps} />
      ) : (
        <MobileBeranda {...sharedProps} profile={profile} tenant={tenant} profiles={profiles} switchTenant={switchTenant} />
      )}

      <AnimatePresence>
        {stokOpen && (
          <SembakoTambahStokSheet
            onClose={() => setStokOpen(false)}
            products={products}
            suppliers={suppliers}
          />
        )}
      </AnimatePresence>

      <SembakoCreateInvoiceSheet
        open={saleWizardOpen}
        onOpenChange={setSaleWizardOpen}
      />
    </div>
  )
}
