import { useQuery } from '@tanstack/react-query'
import { supabase } from '../supabase'
import { useAuth } from './useAuth'
import { calcNetProfit } from '../format'
import { logSupabaseError } from '@/lib/logger/supabaseLogger'

/**
 * Helper to get SQL-ready date range from period string
 */
export const getPeriodRange = (period) => {
  const now = new Date()
  const today = new Date(now.getFullYear(), now.getMonth(), now.getDate())
  
  switch (period) {
    case 'week':
    case 'lastWeek': {
      const day = today.getDay()
      const monday = new Date(today)
      monday.setDate(today.getDate() - (day === 0 ? 6 : day - 1))
      
      if (period === 'lastWeek') monday.setDate(monday.getDate() - 7)
      
      const sunday = new Date(monday)
      sunday.setDate(monday.getDate() + 6)
      sunday.setHours(23, 59, 59, 999)
      return { 
        from: monday.toISOString(), 
        to: sunday.toISOString() 
      }
    }
    case 'month': {
      const from = new Date(today.getFullYear(), today.getMonth(), 1)
      const to = new Date(today.getFullYear(), today.getMonth() + 1, 0)
      to.setHours(23, 59, 59, 999)
      return { from: from.toISOString(), to: to.toISOString() }
    }
    case 'lastMonth':
    case 'last_month': {
      const from = new Date(today.getFullYear(), today.getMonth() - 1, 1)
      const to = new Date(today.getFullYear(), today.getMonth(), 0)
      to.setHours(23, 59, 59, 999)
      return { from: from.toISOString(), to: to.toISOString() }
    }
    case 'all':
    default:
      return { 
        from: '2020-01-01T00:00:00.000Z', 
        to: new Date().toISOString() 
      }
  }
}

/**
 * Core Cash Flow Hook (Real Liquid Cash analysis)
 */
export const useCashFlow = (period = 'week') => {
  const { tenant } = useAuth()
  
  return useQuery({
    queryKey: ['cashflow-v2', tenant?.id, period],
    queryFn: async () => {
      const { from, to } = getPeriodRange(period)
      
      const [paymentsRes, purchasesRes, deliveriesRes, extrasRes, salesRes, lossRes, vehicleExpensesRes] = await Promise.all([
        // 1. CASH IN — real payments received
        supabase
          .from('payments')
          .select(`
            id, amount, payment_date, sale_id, 
            sales(id, transaction_date, total_revenue, rpa_clients(rpa_name))
          `)
          .eq('tenant_id', tenant.id)
          .eq('is_deleted', false)
          .gte('payment_date', from)
          .lte('payment_date', to)
          .order('payment_date', { ascending: false }),
        
        // 2. CASH OUT — purchases (modal beli ayam)
        supabase
          .from('purchases')
          .select(`
            total_cost, transport_cost, other_cost,
            transaction_date, farm_id, farms(farm_name)
          `)
          .eq('tenant_id', tenant.id)
          .eq('is_deleted', false)
          .gte('transaction_date', from)
          .lte('transaction_date', to),
        
        // 3. CASH OUT — delivery costs
        supabase
          .from('deliveries')
          .select('delivery_cost, departure_time, sale_id, arrived_weight_kg')
          .eq('tenant_id', tenant.id)
          .eq('is_deleted', false)
          .gte('departure_time', from)
          .lte('departure_time', to),
        
        // 4. CASH OUT — extra expenses
        supabase
          .from('extra_expenses')
          .select('amount, expense_date, category, description')
          .eq('tenant_id', tenant.id)
          .eq('is_deleted', false)
          .gte('expense_date', from)
          .lte('expense_date', to),
        
        // 5. PIUTANG — sales yang belum lunas (Fetch all pending)
        supabase
          .from('sales')
          .select(`
            id, total_revenue, paid_amount, payment_status,
            transaction_date, rpa_id, rpa_clients(rpa_name),
            purchases(total_cost, transport_cost, other_cost, farms(farm_name)),
            deliveries(delivery_cost, shrinkage_kg, arrived_weight_kg)
          `)
          .eq('tenant_id', tenant.id)
          .eq('is_deleted', false)
          .neq('payment_status', 'lunas'),
          
        // 6. LOSS REPORTS
        supabase
          .from('loss_reports')
          .select('weight_loss_kg, financial_loss, report_date, sale_id')
          .eq('tenant_id', tenant.id)
          .eq('is_deleted', false)
          .gte('report_date', from)
          .lte('report_date', to),
          
        // 7. VEHICLE EXPENSES
        supabase
          .from('vehicle_expenses')
          .select('amount, expense_date, expense_type, description')
          .eq('tenant_id', tenant.id)
          .gte('expense_date', from)
          .lte('expense_date', to)
      ])

      if (paymentsRes.error) {
        logSupabaseError(paymentsRes.error, {
          table: 'payments',
          operation: 'select',
          component: 'useCashFlow',
          actionName: 'broker.cashflow.fetch',
          tenantId: tenant.id,
          metadata: { period, scope: 'general' }
        })
        throw paymentsRes.error
      }
      if (purchasesRes.error) {
        logSupabaseError(purchasesRes.error, {
          table: 'purchases',
          operation: 'select',
          component: 'useCashFlow',
          actionName: 'broker.cashflow.fetch',
          tenantId: tenant.id,
          metadata: { period, scope: 'general' }
        })
        throw purchasesRes.error
      }
      if (deliveriesRes.error) {
        logSupabaseError(deliveriesRes.error, {
          table: 'deliveries',
          operation: 'select',
          component: 'useCashFlow',
          actionName: 'broker.cashflow.fetch',
          tenantId: tenant.id,
          metadata: { period, scope: 'general' }
        })
        throw deliveriesRes.error
      }
      if (extrasRes.error) {
        logSupabaseError(extrasRes.error, {
          table: 'extra_expenses',
          operation: 'select',
          component: 'useCashFlow',
          actionName: 'broker.cashflow.fetch',
          tenantId: tenant.id,
          metadata: { period, scope: 'general' }
        })
        throw extrasRes.error
      }
      if (salesRes.error) {
        logSupabaseError(salesRes.error, {
          table: 'sales',
          operation: 'select',
          component: 'useCashFlow',
          actionName: 'broker.cashflow.fetch',
          tenantId: tenant.id,
          metadata: { period, scope: 'general' }
        })
        throw salesRes.error
      }
      if (lossRes.error) {
        logSupabaseError(lossRes.error, {
          table: 'loss_reports',
          operation: 'select',
          component: 'useCashFlow',
          actionName: 'broker.cashflow.fetch',
          tenantId: tenant.id,
          metadata: { period, scope: 'general' }
        })
        throw lossRes.error
      }
      if (vehicleExpensesRes.error) {
        logSupabaseError(vehicleExpensesRes.error, {
          table: 'vehicle_expenses',
          operation: 'select',
          component: 'useCashFlow',
          actionName: 'broker.cashflow.fetch',
          tenantId: tenant.id,
          metadata: { period, scope: 'general' }
        })
        throw vehicleExpensesRes.error
      }

      const payments = paymentsRes.data || []
      const purchases = purchasesRes.data || []
      const deliveries = deliveriesRes.data || []
      const rawExtras = extrasRes.data || []
      const unpaidSales = salesRes.data || []
      const losses = lossRes.data || []
      
      const vehicleExpenses = vehicleExpensesRes?.data || []

      // Gabungkan extra expenses umum dengan biaya armada
      const extras = [
        ...rawExtras,
        ...vehicleExpenses.map(v => ({
            amount: v.amount,
            expense_date: v.expense_date,
            category: 'Lainnya',
            description: `Armada (${v.expense_type}): ${v.description || ''}`,
            source: 'vehicle_expenses'
        }))
      ]

      // 8. ALL SALES in period (for transaction list & total margin calc)
      const { data: sales, error: salesAllErr } = await supabase
        .from('sales')
        .select(`
          id, total_revenue, transaction_date, rpa_id, rpa_clients(rpa_name),
          quantity, total_weight_kg, price_per_kg, payment_status, delivery_cost,
          deliveries(delivery_cost, arrived_weight_kg, shrinkage_kg),
          purchases(total_cost, farms(farm_name))
        `)
        .eq('tenant_id', tenant.id)
        .eq('is_deleted', false)
        .gte('transaction_date', from)
        .lte('transaction_date', to)
      if (salesAllErr) {
        logSupabaseError(salesAllErr, {
          table: 'sales',
          operation: 'select',
          component: 'useCashFlow',
          actionName: 'broker.cashflow.fetch',
          tenantId: tenant.id,
          metadata: { period, scope: 'general_all_sales' }
        })
        throw salesAllErr
      }

      // KALKULASI
      const totalCashIn = payments.reduce((s, p) => 
        s + Number(p.amount || 0), 0)
      
      const totalModal = purchases.reduce((s, p) => 
        s + Number(p.total_cost || 0) + Number(p.transport_cost || 0) 
          + Number(p.other_cost || 0), 0)
      
      const totalDeliveryCost = deliveries.reduce((s, d) => 
        s + Number(d.delivery_cost || 0), 0)
      
      const totalExtra = extras.reduce((s, e) => 
        s + Number(e.amount || 0), 0)
      
      const totalCashOut = Number((totalModal + totalDeliveryCost + totalExtra).toFixed(2))
      
      const totalPiutang = unpaidSales.reduce((s, sale) => {
        const remaining = Number(sale.total_revenue || 0) - Number(sale.paid_amount || 0)
        return s + remaining
      }, 0)
      
      const totalLoss = losses.reduce((s, l) => 
        s + Number(l.financial_loss || 0), 0)
      
      const netCash = totalCashIn - totalCashOut
      const proyeksiNet = netCash + totalPiutang

      return {
        // Cash flow (likuiditas)
        cashIn: totalCashIn,
        cashOut: totalCashOut,
        netCash,
        
        // Breakdown cash out
        totalModal,
        totalDeliveryCost,
        totalExtra,
        
        // Piutang & proyeksi
        totalPiutang,
        proyeksiNet,
        unpaidSales,
        
        // Loss
        totalLoss,
        totalLossKg: losses.reduce((s, l) => 
          s + Number(l.weight_loss_kg || 0), 0),
        
        // Raw data untuk chart & breakdown
        payments,
        purchases,
        deliveries,
        extras,
        losses,
        sales: sales || [],
        
        // Summary for legacy compatibility
        summary: {
          totalCashIn,
          totalCashOut,
          netCash,
          totalModal,
          totalDeliveryCost,
          totalExtra,
          totalPiutang,
          proyeksiNet,
          totalKerugian: totalLoss
        }
      }
    },
    enabled: !!tenant?.id
  })
}

/**
 * Hook for Profitability Per RPA (Customer)
 */
export const useCashFlowByRPA = (period = 'month') => {
  const { tenant } = useAuth()
  
  return useQuery({
    queryKey: ['cashflow-rpa', tenant?.id, period],
    queryFn: async () => {
      const { from, to } = getPeriodRange(period)
      
      const { data: sales, error } = await supabase
        .from('sales')
        .select(`
          id, total_revenue, paid_amount, payment_status, 
          transaction_date, rpa_id, rpa_clients(rpa_name),
          purchases(total_cost, transport_cost, other_cost, farms(farm_name)),
          delivery_cost,
          deliveries(arrived_weight_kg)
        `)
        .eq('tenant_id', tenant.id)
        .eq('is_deleted', false)
        .gte('transaction_date', from)
        .lte('transaction_date', to)

      if (error) {
        logSupabaseError(error, {
          table: 'sales',
          operation: 'select',
          component: 'useCashFlow',
          actionName: 'broker.cashflow.fetch_by_rpa',
          tenantId: tenant.id,
          metadata: {
            period,
            scope: 'rpa'
          }
        })
        throw error
      }

      // Group by RPA
      const rpaMap = {}
      
      sales.forEach(sale => {
        const rpaId = sale.rpa_id
        const rpaName = sale.rpa_clients?.rpa_name || 'Tanpa Nama'
        
        if (!rpaMap[rpaId]) {
          rpaMap[rpaId] = {
            id: rpaId,
            name: rpaName,
            total_revenue: 0,
            paid_amount: 0,
            remaining: 0,
            net_profit: 0,
            total_kg: 0,
            transaction_count: 0
          }
        }
        
        const totalKg = (sale.deliveries || []).reduce((sum, d) => sum + Number(d.arrived_weight_kg || 0), 0)
        const remaining = Number(sale.total_revenue || 0) - Number(sale.paid_amount || 0)
        const profit = calcNetProfit(sale)
        
        rpaMap[rpaId].total_revenue += Number(sale.total_revenue || 0)
        rpaMap[rpaId].paid_amount += Number(sale.paid_amount || 0)
        rpaMap[rpaId].remaining += remaining
        rpaMap[rpaId].net_profit += profit
        rpaMap[rpaId].total_kg += totalKg
        rpaMap[rpaId].transaction_count += 1
      })
      
      return Object.values(rpaMap).sort((a, b) => b.net_profit - a.net_profit)
    },
    enabled: !!tenant?.id
  })
}

/**
 * Hook for Cost Breakdown Per Farm (Supplier)
 */
export const useCashFlowByFarm = (period = 'month') => {
  const { tenant } = useAuth()
  
  return useQuery({
    queryKey: ['cashflow-farm', tenant?.id, period],
    queryFn: async () => {
      const { from, to } = getPeriodRange(period)
      
      const { data: purchases, error } = await supabase
        .from('purchases')
        .select(`
          total_cost, transport_cost, other_cost, quantity,
          transaction_date, farm_id, farms(farm_name)
        `)
        .eq('tenant_id', tenant.id)
        .eq('is_deleted', false)
        .gte('transaction_date', from)
        .lte('transaction_date', to)

      if (error) {
        logSupabaseError(error, {
          table: 'purchases',
          operation: 'select',
          component: 'useCashFlow',
          actionName: 'broker.cashflow.fetch_by_farm',
          tenantId: tenant.id,
          metadata: {
            period,
            scope: 'farm'
          }
        })
        throw error
      }

      // Group by Farm
      const farmMap = {}
      
      purchases.forEach(p => {
        const farmId = p.farm_id
        const farmName = p.farms?.farm_name || 'Kandang Unknown'
        
        if (!farmMap[farmId]) {
          farmMap[farmId] = {
            id: farmId,
            name: farmName,
            total_cost: 0,
            total_ekor: 0,
            transaction_count: 0
          }
        }
        
        const subtotal = Number(p.total_cost || 0) + Number(p.transport_cost || 0) + Number(p.other_cost || 0)
        
        farmMap[farmId].total_cost += subtotal
        farmMap[farmId].total_ekor += Number(p.quantity || 0)
        farmMap[farmId].transaction_count += 1
      })
      
      return Object.values(farmMap).sort((a, b) => b.total_cost - a.total_cost)
    },
    enabled: !!tenant?.id
  })
}
