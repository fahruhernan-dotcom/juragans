import { format } from 'date-fns'

/**
 * 1. Laba Rugi (Accrual P&L)
 */
export function calculatePL(sales, expenses, payroll, batches, supplierPayments, startDate, endDate) {
  const totalGrossRevenue = sales.reduce((s, i) => s + (Number(i.subtotal) || 0), 0)
  const totalReturns = sales.reduce((s, i) => s + (Number(i.totalReturnAmount) || 0), 0)
  const totalRevenue = sales.reduce((s, i) => s + (Number(i.total_amount) || 0), 0)
  const totalCOGS = sales.reduce((s, i) => s + (Number(i.total_cogs) || 0), 0)
  const totalDeliveryCost = sales.reduce((s, i) => s + (Number(i.delivery_cost) || 0), 0)
  const totalOtherCost = sales.reduce((s, i) => s + (Number(i.other_cost) || 0), 0)
  const totalExpenses = expenses.reduce((s, e) => s + (Number(e.amount) || 0), 0)
  const totalPayroll = payroll.reduce((s, p) => s + (Number(p.total_pay) || 0), 0)

  const grossProfit = totalRevenue - totalCOGS
  const netProfit = grossProfit - totalDeliveryCost - totalOtherCost - totalExpenses - totalPayroll

  const grossMarginPct = totalRevenue > 0 ? Number((grossProfit / totalRevenue * 100).toFixed(1)) : 0
  const netMarginPct = totalRevenue > 0 ? Number((netProfit / totalRevenue * 100).toFixed(1)) : 0

  // Hutang Supplier Baru yang Terbentuk di Periode Ini (Belanja Stok - Pembayaran Supplier)
  const stockPurchasePeriod = batches
    .filter(b => {
      const date = b.purchase_date?.slice(0, 10)
      return date >= startDate && date <= endDate
    })
    .reduce((s, b) => {
      return s + (Number(b.total_cost) > 0 ? Number(b.total_cost) : (Number(b.qty_masuk || 0) * Number(b.buy_price || 0)))
    }, 0)

  const supplierPaymentPeriod = supplierPayments.reduce((s, sp) => s + (Number(sp.amount) || 0), 0)
  const unpaidSupplierPeriod = Math.max(0, stockPurchasePeriod - supplierPaymentPeriod)

  return {
    totalGrossRevenue,
    totalReturns,
    totalRevenue,
    totalCOGS,
    totalDeliveryCost,
    totalOtherCost,
    totalExpenses,
    totalPayroll,
    grossProfit,
    netProfit,
    grossMarginPct,
    netMarginPct,
    unpaidSupplierPeriod, // Untuk diagram lingkaran (Breakdown Pengeluaran)
  }
}

/**
 * 2. Arus Kas (Cash Flow)
 * Menyertakan Opening Balance, Cash In/Out period berjalan, dan Ending Balance.
 * Dipisah berdasarkan Tunai (Cash On Hand) vs Bank (Bank Balance).
 */
export function calculateCashFlow(
  sales,
  allPayments,
  allSupplierPayments,
  allExpenses,
  allPayroll,
  startDate,
  endDate,
  allSales = []
) {
  const startDay = startDate?.slice(0, 10)
  const endDay = endDate?.slice(0, 10)

  // Track payment IDs or sale IDs that have payments in sembako_payments
  const paymentSaleIds = new Set()
  ;(allPayments || []).forEach(p => {
    if (p.sale_id) paymentSaleIds.add(String(p.sale_id))
  })

  // --- 1. HISTORICAL AGGREGATES (Sebelum startDate) ---
  let cashInBeforeTunai = 0
  let cashInBeforeTransfer = 0

  // 1a. From payments before start date
  ;(allPayments || []).forEach(p => {
    if (p.is_deleted) return
    const payDate = (p.payment_date || p.created_at)?.slice(0, 10)
    if (payDate && payDate < startDay) {
      const amt = Number(p.amount) || 0
      if (p.payment_method === 'transfer') {
        cashInBeforeTransfer += amt
      } else {
        cashInBeforeTunai += amt
      }
    }
  })

  // 1b. From historical sales without separate payment records
  ;(allSales || []).forEach(s => {
    if (s.is_deleted) return
    const sDate = (s.transaction_date || s.created_at)?.slice(0, 10)
    if (sDate && sDate < startDay && !paymentSaleIds.has(String(s.id))) {
      const paid = Number(s.paid_amount || s.raw_paid_amount || 0)
      if (paid > 0) {
        if (s.payment_method === 'transfer') {
          cashInBeforeTransfer += paid
        } else {
          cashInBeforeTunai += paid
        }
      }
    }
  })

  // 1c. Supplier payments before start date
  let supplierOutBeforeTunai = 0
  let supplierOutBeforeTransfer = 0
  ;(allSupplierPayments || []).forEach(sp => {
    if (sp.is_deleted) return
    const payDate = (sp.payment_date || sp.created_at)?.slice(0, 10)
    if (payDate && payDate < startDay) {
      const amt = Number(sp.amount) || 0
      if (sp.payment_method === 'transfer') {
        supplierOutBeforeTransfer += amt
      } else {
        supplierOutBeforeTunai += amt
      }
    }
  })

  // 1d. Expenses & Payroll before start date (Tunai)
  const expensesBefore = (allExpenses || []).filter(e => {
    if (e.is_deleted) return false
    const date = (e.expense_date || e.created_at)?.slice(0, 10)
    return date && date < startDay
  })
  const payrollBefore = (allPayroll || []).filter(p => {
    if (p.is_deleted) return false
    const date = (p.period_date || p.created_at)?.slice(0, 10)
    return date && date < startDay && p.payment_status === 'paid'
  })

  const expensesOutBeforeTunai = expensesBefore.reduce((s, e) => s + (Number(e.amount) || 0), 0)
  const payrollOutBeforeTunai = payrollBefore.reduce((s, p) => s + (Number(p.total_pay) || 0), 0)

  // Total Opening Cash & Bank
  const openingCashOnHand = Math.max(0, cashInBeforeTunai - supplierOutBeforeTunai - expensesOutBeforeTunai - payrollOutBeforeTunai)
  const openingBankBalance = Math.max(0, cashInBeforeTransfer - supplierOutBeforeTransfer)

  // --- 2. PERIOD AGGREGATES (Antara startDate dan endDate) ---
  let cashInPeriodTunai = 0
  let cashInPeriodTransfer = 0
  const periodPaymentSaleIds = new Set()

  // 2a. Dari tabel sembako_payments
  ;(allPayments || []).forEach(p => {
    if (p.is_deleted) return
    const payDate = (p.payment_date || p.created_at)?.slice(0, 10)
    if (payDate && payDate >= startDay && payDate <= endDay) {
      const amt = Number(p.amount) || 0
      if (p.sale_id) periodPaymentSaleIds.add(String(p.sale_id))
      if (p.payment_method === 'transfer') {
        cashInPeriodTransfer += amt
      } else {
        cashInPeriodTunai += amt
      }
    }
  })

  // 2b. Dari transaksi penjualan periode ini yang belum tercatat di sembako_payments (direct sale POS)
  ;(sales || []).forEach(sale => {
    if (!periodPaymentSaleIds.has(String(sale.id))) {
      const paid = Number(sale.paid_amount || sale.raw_paid_amount || 0)
      if (paid > 0) {
        if (sale.payment_method === 'transfer') {
          cashInPeriodTransfer += paid
        } else {
          cashInPeriodTunai += paid
        }
      }
    }
  })

  // Pengeluaran (Cash Out) Periode Berjalan
  // Filter supplier payments in period
  const supplierPaymentsPeriod = (allSupplierPayments || []).filter(sp => {
    if (sp.is_deleted) return false
    const payDate = (sp.payment_date || sp.created_at)?.slice(0, 10)
    return payDate && payDate >= startDay && payDate <= endDay
  })

  const supplierOutPeriodTunai = supplierPaymentsPeriod
    .filter(sp => (sp.payment_method || 'cash') === 'cash')
    .reduce((s, sp) => s + (Number(sp.amount) || 0), 0)

  const supplierOutPeriodTransfer = supplierPaymentsPeriod
    .filter(sp => sp.payment_method === 'transfer')
    .reduce((s, sp) => s + (Number(sp.amount) || 0), 0)

  // Gaji Karyawan (Dibayar)
  const payrollPeriod = (allPayroll || []).filter(p => {
    if (p.is_deleted) return false
    const date = (p.period_date || p.created_at)?.slice(0, 10)
    return date && date >= startDay && date <= endDay
  })
  const payrollPaidPeriod = payrollPeriod.filter(p => p.payment_status === 'paid')
  const payrollOutPeriodTunai = payrollPaidPeriod.reduce((s, p) => s + (Number(p.total_pay) || 0), 0)

  // Prive (Owner Draw) vs Operasional Biasa
  const expensesPeriod = (allExpenses || []).filter(e => {
    if (e.is_deleted) return false
    const date = (e.expense_date || e.created_at)?.slice(0, 10)
    return date && date >= startDay && date <= endDay
  })
  const priveExpenses = expensesPeriod.filter(e => e.category === 'prive' || e.category === 'tarikan_pemilik')
  const regularExpenses = expensesPeriod.filter(e => e.category !== 'prive' && e.category !== 'tarikan_pemilik')

  const priveOutPeriodTunai = priveExpenses.reduce((s, e) => s + (Number(e.amount) || 0), 0)
  const regularExpensesOutPeriodTunai = regularExpenses.reduce((s, e) => s + (Number(e.amount) || 0), 0)

  // Biaya Kirim / Pengiriman Armada dari transaksi penjualan (diasumsikan Tunai)
  const deliveryOutPeriodTunai = (sales || []).reduce((s, i) => s + (Number(i.delivery_cost) || 0), 0)

  // Net Cash Flow Period
  const cashInTotal = cashInPeriodTunai + cashInPeriodTransfer
  const cashOutTotal =
    supplierOutPeriodTunai +
    supplierOutPeriodTransfer +
    payrollOutPeriodTunai +
    priveOutPeriodTunai +
    regularExpensesOutPeriodTunai +
    deliveryOutPeriodTunai

  const netCashFlowPeriod = cashInTotal - cashOutTotal

  // Ending Cash Balances
  const endingCashOnHand = Math.max(0, openingCashOnHand + (cashInPeriodTunai - supplierOutPeriodTunai - payrollOutPeriodTunai - priveOutPeriodTunai - regularExpensesOutPeriodTunai - deliveryOutPeriodTunai))
  const endingBankBalance = Math.max(0, openingBankBalance + (cashInPeriodTransfer - supplierOutPeriodTransfer))

  return {
    openingCashOnHand,
    openingBankBalance,
    startingCashOnHand: openingCashOnHand,
    startingBankBalance: openingBankBalance,
    cashTunaiAwal: openingCashOnHand,
    cashBankAwal: openingBankBalance,

    cashInPeriodTunai,
    cashInPeriodTransfer,
    cashInPeriod: cashInTotal,

    supplierOutPeriodTunai,
    supplierOutPeriodTransfer,
    cashOutPurchases: supplierOutPeriodTunai + supplierOutPeriodTransfer,

    payrollOutPeriodTunai,
    cashOutPayroll: payrollOutPeriodTunai,

    priveOutPeriodTunai,
    regularExpensesOutPeriodTunai,
    deliveryOutPeriodTunai,

    cashOutOpex: regularExpensesOutPeriodTunai,
    cashOutPeriod: cashOutTotal,
    netCashFlowPeriod,

    endingCashOnHand,
    endingBankBalance,
    cashTunaiAkhir: endingCashOnHand,
    cashBankAkhir: endingBankBalance,
  }
}

/**
 * 3. Modal Beredar / Aset Lancar & Hutang Supplier (Liabilitas)
 */
export function calculateWorkingCapital(allSales, allBatches, allSupplierPayments) {
  // Piutang Dagang (Aset Lancar - Seluruh Tagihan Belum Terbayar dari Dulu s/d Sekarang)
  const outstandingReceivable = allSales.reduce((s, sale) => s + (Number(sale.remaining_amount) || 0), 0)

  // Persediaan Barang (Aset Lancar - Nilai Stok Gudang Aktif saat ini)
  const activeBatches = allBatches.filter(b => Number(b.qty_sisa) > 0)
  const stockValue = activeBatches.reduce((s, b) => {
    return s + (Number(b.qty_sisa || 0) * Number(b.buy_price || 0))
  }, 0)

  // Hutang Dagang Supplier (Liabilitas - Seluruh Hutang ke Supplier dari Dulu s/d Sekarang)
  const totalPurchased = allBatches.reduce((s, b) => {
    return s + (Number(b.total_cost) > 0 ? Number(b.total_cost) : (Number(b.qty_masuk || 0) * Number(b.buy_price || 0)))
  }, 0)
  const totalSupplierPaid = allSupplierPayments.reduce((s, p) => s + (Number(p.amount) || 0), 0)
  const outstandingPayable = Math.max(0, totalPurchased - totalSupplierPaid)

  return {
    outstandingReceivable,
    stockValue,
    outstandingPayable,
  }
}

/**
 * 4. Estimasi Laba Terkonversi Kas (Cash Margin Estimate)
 * Menghitung porsi keuntungan akrual yang sudah benar-benar dicairkan ke uang kas,
 * dikurangi pengeluaran tunai period tersebut.
 */
export function calculateRealizedProfit(sales, totalExpenses, totalPayroll) {
  let realizedGrossProfit = 0
  sales.forEach(s => {
    const net = Number(s.net_profit) || 0
    const total = Number(s.total_amount) || 0
    const paid = Number(s.paid_amount) || 0
    if (total > 0) {
      const ratio = Math.max(0, Math.min(1, paid / total))
      realizedGrossProfit += Math.round(net * ratio)
    } else {
      realizedGrossProfit += net
    }
  })

  // Laba bersih terkonversi kas estimasi
  const cashMarginEstimate = Math.max(0, realizedGrossProfit - totalExpenses - totalPayroll)

  return {
    cashMarginEstimate,
  }
}
