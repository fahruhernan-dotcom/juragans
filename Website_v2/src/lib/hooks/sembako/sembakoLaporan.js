import { useQuery } from '@tanstack/react-query'
import { supabase } from '../../supabase'
import { useAuth } from '../useAuth'
import { normalizeSupabaseError } from '../../supabaseErrorHandler'
import { STALE_5M } from './sembakoCommon'
import { processSaleRow } from './sembakoSales'
import * as reportUtils from './sembakoReportUtils'

export const useSembakoDashboardStats = () => {
  const { tenant } = useAuth()
  return useQuery({
    queryKey: ['sembako-dashboard-stats', tenant?.id],
    enabled: !!tenant?.id,
    staleTime: STALE_5M,
    queryFn: async () => {
      try {
        const [productsRes, salesRes, expensesRes, payrollRes, returnsRes, batchesRes, supplierPaymentsRes] =
          await Promise.all([
            supabase.from('sembako_products')
              .select('id, product_name, current_stock, avg_buy_price, sell_price, min_stock_alert')
              .eq('tenant_id', tenant.id)
              .eq('is_deleted', false).eq('is_active', true),
            supabase.from('sembako_sales')
              .select('*, sembako_sale_items(*), sembako_payments(*)')
              .eq('tenant_id', tenant.id)
              .eq('is_deleted', false),
            supabase.from('sembako_expenses')
              .select('amount, expense_date, category')
              .eq('tenant_id', tenant.id)
              .eq('is_deleted', false),
            supabase.from('sembako_payroll')
              .select('total_pay, period_date, payment_status')
              .eq('tenant_id', tenant.id)
              .eq('is_deleted', false),
            supabase.from('sembako_returns')
              .select('*')
              .eq('tenant_id', tenant.id)
              .eq('is_deleted', false),
            supabase.from('sembako_stock_batches')
              .select('product_id, qty_sisa, buy_price')
              .eq('tenant_id', tenant.id)
              .eq('is_deleted', false)
              .gt('qty_sisa', 0),
            supabase.from('sembako_supplier_payments')
              .select('amount, payment_date')
              .eq('tenant_id', tenant.id)
              .eq('is_deleted', false),
          ])

        if (productsRes.error) console.error('Sembako Stats (Products):', productsRes.error)
        if (salesRes.error) console.error('Sembako Stats (Sales):', salesRes.error)
        if (expensesRes.error) console.error('Sembako Stats (Expenses):', expensesRes.error)
        if (payrollRes.error) console.error('Sembako Stats (Payroll):', payrollRes.error)
        if (supplierPaymentsRes.error) console.error('Sembako Stats (Supplier Payments):', supplierPaymentsRes.error)

        const products = productsRes.data || []
        const rawSales = salesRes.data || []
        const expenses = expensesRes.data || []
        const payroll = payrollRes.data || []
        const returnsList = returnsRes.data || []
        const activeBatches = batchesRes.data || []
        const supplierPayments = supplierPaymentsRes.data || []

        const sales = rawSales.map(sale => processSaleRow(sale, returnsList))

        const now = new Date()
        const thirtyDaysAgo = new Date(now - 30 * 24 * 60 * 60 * 1000)

        const expenseThisMonth = expenses
          .filter(e => new Date(e.expense_date) > thirtyDaysAgo)
          .reduce((s, e) => s + (Number(e.amount) || 0), 0)
        const payrollThisMonth = payroll
          .filter(p => new Date(p.period_date) > thirtyDaysAgo)
          .reduce((s, p) => s + (Number(p.total_pay) || 0), 0)
        const supplierPaymentThisMonth = supplierPayments
          .filter(sp => new Date(sp.payment_date) > thirtyDaysAgo)
          .reduce((s, sp) => s + (Number(sp.amount) || 0), 0)

        const salesThisMonth = sales.filter(s => new Date(s.transaction_date) > thirtyDaysAgo)

        const revenueThisMonth = salesThisMonth.reduce((s, i) => s + (Number(i.total_amount) || 0), 0)
        const saleNetProfitThisMonth = salesThisMonth.reduce((s, i) => s + (Number(i.net_profit) || 0), 0)
        const netProfitThisMonth = saleNetProfitThisMonth - expenseThisMonth - payrollThisMonth
        const grossProfitThisMonth = salesThisMonth.reduce((s, i) => s + (Number(i.gross_profit) || 0), 0)

        const deliveryCostThisMonth = salesThisMonth.reduce((s, i) => s + (Number(i.delivery_cost) || 0), 0)
        const otherCostThisMonth = salesThisMonth.reduce((s, i) => s + (Number(i.other_cost) || 0), 0)
        const cogsThisMonth = salesThisMonth.reduce((s, i) => s + (Number(i.total_cogs) || 0), 0)

        return {
          stok: {
            totalProduk: products.length,
            lowStock: products.filter(p =>
              p.min_stock_alert > 0 && p.current_stock <= p.min_stock_alert
            ),
            // Combine batch-based and non-batch product valuations (Bug #9 fix)
            nilaiStok: (() => {
              const batchProductIds = new Set(activeBatches.map(b => b.product_id))
              const batchValue = activeBatches.reduce((s, b) => s + (Number(b.qty_sisa || 0) * Number(b.buy_price || 0)), 0)
              const nonBatchValue = products.reduce((s, p) => {
                if (batchProductIds.has(p.id)) return s
                return s + (Number(p.current_stock || 0) * Number(p.avg_buy_price || 0))
              }, 0)
              return batchValue + nonBatchValue
            })(),
          },
          penjualan: {
            totalRevenue: sales.reduce((s, i) => s + (Number(i.total_amount) || 0), 0),
            revenueThisMonth,
            netProfitThisMonth,
            grossProfitThisMonth,
            totalOutstanding: sales.reduce((s, i) => s + (Number(i.remaining_amount) || 0), 0),
            overdueCount: sales.filter(s =>
              s.payment_status !== 'lunas' && s.due_date && new Date(s.due_date) < now
            ).length,
          },
          pengeluaran: {
            totalExpenseThisMonth: expenseThisMonth,
            totalPayrollThisMonth: payrollThisMonth,
            totalSupplierPaymentThisMonth: supplierPaymentThisMonth,
            totalDeliveryCostThisMonth: deliveryCostThisMonth,
            totalOtherCostThisMonth: otherCostThisMonth,
            totalCogsThisMonth: cogsThisMonth,
          },
        }
      } catch (err) {
        console.warn('[useSembakoDashboardStats] Error:', err)
        return {
          stok: { totalProduk: 0, lowStock: [], nilaiStok: 0 },
          penjualan: { totalRevenue: 0, revenueThisMonth: 0, netProfitThisMonth: 0, grossProfitThisMonth: 0, totalOutstanding: 0, overdueCount: 0 },
          pengeluaran: {
            totalExpenseThisMonth: 0,
            totalPayrollThisMonth: 0,
            totalSupplierPaymentThisMonth: 0,
            totalDeliveryCostThisMonth: 0,
            totalOtherCostThisMonth: 0,
            totalCogsThisMonth: 0,
          }
        }
      }
    }
  })
}

export const useSembakoLaporan = (startDate, endDate) => {
  const { tenant } = useAuth()
  return useQuery({
    queryKey: ['sembako-laporan', tenant?.id, startDate, endDate],
    enabled: !!startDate && !!endDate && !!tenant?.id,
    staleTime: STALE_5M,
    queryFn: async () => {
      try {
        const startDay = startDate?.slice(0, 10)
        const endDay = endDate?.slice(0, 10)
        const startFilter = `${startDay}T00:00:00.000Z`
        const endFilter = `${endDay}T23:59:59.999Z`

        const [
          salesRes,
          expensesRes,
          payrollRes,
          batchesRes,
          supplierPaymentsRes,
          returnsRes,
          allPaymentsRes,
          allSupplierPaymentsRes,
          allExpensesRes,
          allPayrollRes,
          allSalesRes,
          allSuppliersRes,
          allProductsRes
        ] = await Promise.all([
          // Period Sales
          supabase.from('sembako_sales')
            .select('*, sembako_sale_items(*), sembako_payments(*), sembako_customers(customer_name, customer_type)')
            .eq('tenant_id', tenant.id)
            .eq('is_deleted', false)
            .gte('transaction_date', startDay)
            .lte('transaction_date', endFilter),
          // Period Expenses
          supabase.from('sembako_expenses')
            .select('*').eq('tenant_id', tenant.id).eq('is_deleted', false)
            .gte('expense_date', startDay).lte('expense_date', endFilter),
          // Period Payroll
          supabase.from('sembako_payroll')
            .select('*, sembako_employees(full_name, role)')
            .eq('tenant_id', tenant.id)
            .eq('is_deleted', false)
            .gte('period_date', startDay).lte('period_date', endFilter),
          // All Stock Batches (active & historical)
          supabase.from('sembako_stock_batches')
            .select('*, sembako_suppliers(supplier_name)')
            .eq('tenant_id', tenant.id)
            .eq('is_deleted', false),
          // Period Supplier Payments
          supabase.from('sembako_supplier_payments')
            .select('*, sembako_suppliers(supplier_name)')
            .eq('tenant_id', tenant.id)
            .eq('is_deleted', false)
            .gte('payment_date', startDay)
            .lte('payment_date', endFilter),
          // All Returns
          supabase.from('sembako_returns')
            .select('*')
            .eq('tenant_id', tenant.id)
            .eq('is_deleted', false),
          // All Payments (historical + period)
          supabase.from('sembako_payments')
            .select('amount, payment_method, payment_date, sale_id, created_at')
            .eq('tenant_id', tenant.id)
            .eq('is_deleted', false),
          // All Supplier Payments (historical + period)
          supabase.from('sembako_supplier_payments')
            .select('amount, payment_method, payment_date, supplier_id, created_at')
            .eq('tenant_id', tenant.id)
            .eq('is_deleted', false),
          // All Expenses (historical + period)
          supabase.from('sembako_expenses')
            .select('amount, category, expense_date, created_at')
            .eq('tenant_id', tenant.id)
            .eq('is_deleted', false),
          // All Payroll (historical + period)
          supabase.from('sembako_payroll')
            .select('total_pay, payment_status, period_date, created_at')
            .eq('tenant_id', tenant.id)
            .eq('is_deleted', false),
          // All Sales (for accounts receivable & historical cash)
          supabase.from('sembako_sales')
            .select('id, total_amount, paid_amount, payment_method, payment_status, transaction_date, remaining_amount, is_deleted, created_at')
            .eq('tenant_id', tenant.id)
            .eq('is_deleted', false),
          // All Suppliers for ID to Name mapping
          supabase.from('sembako_suppliers')
            .select('id, supplier_name')
            .eq('tenant_id', tenant.id)
            .eq('is_deleted', false),
          // All Products (for non-batch stock valuation)
          supabase.from('sembako_products')
            .select('id, product_name, current_stock, avg_buy_price')
            .eq('tenant_id', tenant.id)
            .eq('is_deleted', false)
            .eq('is_active', true),
        ])

        if (salesRes.error) console.error('Sembako Report (Sales):', salesRes.error)
        if (expensesRes.error) console.error('Sembako Report (Expenses):', expensesRes.error)
        if (payrollRes.error) console.error('Sembako Report (Payroll):', payrollRes.error)
        if (batchesRes.error) console.error('Sembako Report (Batches):', batchesRes.error)
        if (supplierPaymentsRes.error) console.error('Sembako Report (Supplier Payments):', supplierPaymentsRes.error)
        if (returnsRes.error) console.error('Sembako Report (Returns):', returnsRes.error)

        const returnsList = returnsRes.data || []
        // Process returns on raw sales
        const sales = (salesRes.data || []).map(sale => processSaleRow(sale, returnsList))
        const expenses = expensesRes.data || []
        const payroll = payrollRes.data || []
        const supplierMap = (allSuppliersRes?.data || []).reduce((acc, s) => {
          if (s.id) acc[s.id] = s.supplier_name
          return acc
        }, {})

        const supplierPayments = (supplierPaymentsRes.data || []).map(sp => ({
          ...sp,
          supplier_name: sp.supplier_name || sp.sembako_suppliers?.supplier_name || supplierMap[sp.supplier_id] || 'Supplier'
        }))

        const batches = (batchesRes.data || []).map(b => ({
          ...b,
          supplier_name: b.supplier_name || b.sembako_suppliers?.supplier_name || supplierMap[b.supplier_id] || 'Supplier'
        }))

        const allPayments = allPaymentsRes.data || []
        const allSupplierPayments = allSupplierPaymentsRes.data || []
        const allExpenses = allExpensesRes.data || []
        const allPayroll = allPayrollRes.data || []
        const allSales = allSalesRes.data || []
        const allProducts = allProductsRes?.data || []

        const pl = reportUtils.calculatePL(sales, expenses, payroll, batches, supplierPayments, startDay, endDay)
        const cf = reportUtils.calculateCashFlow(sales, allPayments, allSupplierPayments, allExpenses, allPayroll, startDay, endDay, allSales)
        const wc = reportUtils.calculateWorkingCapital(allSales, batches, allSupplierPayments, allProducts)
        const rp = reportUtils.calculateRealizedProfit(sales, pl.totalExpenses, pl.totalPayroll)

        const byProduct = {}
        sales.forEach(sale => {
          ;(sale.sembako_sale_items || []).forEach(item => {
            const key = item.product_name || 'Lainnya'
            if (!byProduct[key]) byProduct[key] = { revenue: 0, cogs: 0, qty: 0, unit: item.unit }
            const qty = Number(item.quantity) || 0
            const sellPrice = Number(item.sell_price) || 0
            const cogsPerUnit = Number(item.cogs_per_unit) || 0
            byProduct[key].revenue += (Number(item.subtotal) > 0 ? Number(item.subtotal) : Math.round(qty * sellPrice))
            byProduct[key].cogs    += (Number(item.cogs_total) > 0 ? Number(item.cogs_total) : Math.round(qty * cogsPerUnit))
            byProduct[key].qty     += qty
          })

          // Deduct returns for this sale from product totals
          const saleReturns = (returnsList || []).filter(r => {
            if (!r || r.is_deleted) return false
            if (sale.id && (r.sale_id === sale.id || String(r.sale_id) === String(sale.id))) return true
            if (sale.invoice_number && r.invoice_number && String(r.invoice_number).trim() === String(sale.invoice_number).trim()) return true
            return false
          })

          saleReturns.forEach(r => {
            const key = r.product_name || 'Lainnya'
            if (!byProduct[key]) byProduct[key] = { revenue: 0, cogs: 0, qty: 0, unit: r.unit || 'pcs' }
            const qty = Number(r.quantity) || 0
            const price = Number(r.unit_price) || 0
            const refundAmt = Number(r.total_amount) || (qty * price)

            // Find matching item to get cogs
            const matchItem = (sale.sembako_sale_items || []).find(i => i.product_id === r.product_id || i.product_name === r.product_name)
            const cogsPerUnit = Number(r.cogs_per_unit || matchItem?.cogs_per_unit || (matchItem ? matchItem.price_per_unit * 0.75 : 80000))
            const retCogs = qty * cogsPerUnit

            byProduct[key].revenue -= refundAmt
            byProduct[key].cogs    -= retCogs
            byProduct[key].qty     -= qty
          })
        })

        const byCustomer = {}
        sales.forEach(sale => {
          const key = sale.customer_name || 'Umum'
          if (!byCustomer[key]) byCustomer[key] = { revenue: 0, profit: 0, count: 0, type: sale.sembako_customers?.customer_type }
          byCustomer[key].revenue += Number(sale.total_amount) || 0
          byCustomer[key].profit += Number(sale.net_profit) || 0
          byCustomer[key].count++
        })

        const expenseByCategory = {}
        expenses.forEach(e => {
          const cat = e.category || 'lainnya'
          if (!expenseByCategory[cat]) expenseByCategory[cat] = 0
          expenseByCategory[cat] += Number(e.amount) || 0
        })

        if (pl.unpaidSupplierPeriod > 0) {
          expenseByCategory['Hutang Supplier Baru'] = pl.unpaidSupplierPeriod
        }

        return {
          summary: {
            ...pl,
            ...cf,
            ...wc,
            ...rp,
          },
          byProduct,
          byCustomer,
          expenseByCategory,
          sales,
          expenses,
          payroll,
          supplierPayments,
          batches,
        }
      } catch (err) {
        throw normalizeSupabaseError(err)
      }
    }
  })
}

export const useSembakoExpenses = () => {
  const { tenant } = useAuth()
  return useQuery({
    queryKey: ['sembako-expenses', tenant?.id],
    enabled: !!tenant?.id,
    staleTime: STALE_5M,
    queryFn: async () => {
      const { data, error } = await supabase
        .from('sembako_expenses')
        .select('*')
        .eq('tenant_id', tenant.id)
        .eq('is_deleted', false)
        .order('expense_date', { ascending: true })
      if (error) throw normalizeSupabaseError(error)
      return data || []
    }
  })
}

export const useSembakoPayroll = () => {
  const { tenant } = useAuth()
  return useQuery({
    queryKey: ['sembako-payroll', tenant?.id],
    enabled: !!tenant?.id,
    staleTime: STALE_5M,
    queryFn: async () => {
      const { data, error } = await supabase
        .from('sembako_payroll')
        .select('*')
        .eq('tenant_id', tenant.id)
        .eq('is_deleted', false)
        .order('period_date', { ascending: true })
      if (error) throw normalizeSupabaseError(error)
      return data || []
    }
  })
}

