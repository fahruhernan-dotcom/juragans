import { useQuery } from '@tanstack/react-query'
import { useAuth } from './useAuth'
import { supabase } from '../supabase'
import { calcNetProfit, calcRemainingAmount } from '@/lib/format'

export function useDashboardStats(tenantId) {
  const { tenant } = useAuth()
  const vertical = tenant?.business_vertical

  return useQuery({
    queryKey: ['dashboard-stats', tenantId],
    queryFn: async () => {
      if (!tenantId) return null
      
      const isBroker = ['broker', 'poultry_broker', 'egg_broker'].includes(vertical)
      if (!isBroker) return null

      const today = new Date().toISOString().split('T')[0]
      const sevenDaysAgo = new Date(Date.now() - 6*24*60*60*1000)
                           .toISOString().split('T')[0]

      const [salesRes, farmsRes, alertsRes] = await Promise.all([
        supabase.from('sales')
          .select(`
            id, total_revenue, paid_amount, payment_status,
            price_per_kg, delivery_cost, transaction_date,
            due_date, created_at, quantity, rpa_id,
            purchases(id, total_cost, transport_cost, other_cost),
            deliveries(shrinkage_kg),
            rpa_clients(rpa_name)
          `)
          .eq('tenant_id', tenantId)
          .eq('is_deleted', false)
          .order('transaction_date', { ascending: false }),
        
        supabase.from('farms')
          .select('id')
          .eq('tenant_id', tenantId)
          .eq('status', 'ready')
          .eq('is_deleted', false),

        supabase.from('drivers')
          .select('id, full_name, sim_expires_at')
          .eq('tenant_id', tenantId)
          .eq('is_deleted', false)
          .lte('sim_expires_at', new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString().split('T')[0])
          .order('sim_expires_at', { ascending: true })
      ])

      const sales = salesRes.data || []
      const readyFarmsCount = farmsRes.data?.length || 0
      const expiringSIMs = alertsRes.data || []

      // 1. PROFIT MINGGU INI
      const weeklySales = sales.filter(s => s.transaction_date >= sevenDaysAgo && s.transaction_date <= today)
      const weeklyProfit = weeklySales.reduce((sum, s) => sum + calcNetProfit(s), 0)
      const weeklyBuyCount = [...new Set(weeklySales.map(s => s.purchases?.id).filter(Boolean))].length

      // 2. TOTAL PIUTANG
      const unpaidSales = sales.filter(s => ['belum_lunas', 'sebagian'].includes(s.payment_status))
      const totalPiutang = unpaidSales.reduce((sum, s) => sum + calcRemainingAmount(s), 0)

      // 3. AKTIVITAS HARI INI
      const todaySales = sales.filter(s => s.transaction_date === today)
      const recentFeed = todaySales.map(s => ({
        ...s,
        rpa_name: s.rpa_clients?.rpa_name || 'RPA Umum',
        profit: calcNetProfit(s),
        type: 'JUAL'
      }))

      // 4. GRAFIK PROFIT 7 HARI
      const days = []
      for (let i = 6; i >= 0; i--) {
        const date = new Date(Date.now() - i*24*60*60*1000)
        const dateStr = date.toISOString().split('T')[0]
        const dayNames = ['Min','Sen','Sel','Rab','Kam','Jum','Sab']
        
        const daySales = sales.filter(s => s.transaction_date === dateStr)
        const dayProfit = daySales.reduce((sum, s) => sum + calcNetProfit(s), 0)
        
        days.push({ 
          name: dayNames[date.getDay()], 
          profit: dayProfit, 
          date: dateStr 
        })
      }

      // 5. RPA DEBTORS (needed for Beranda return shape)
      const rpaDebts = unpaidSales.reduce((acc, s) => {
        const rpaId = s.rpa_id || s.rpa_clients?.id || 'unknown'
        const rpaName = s.rpa_clients?.rpa_name || 'RPA Umum'
        if (!acc[rpaId]) acc[rpaId] = { id: rpaId, rpa_name: rpaName, total_outstanding: 0 }
        acc[rpaId].total_outstanding += calcRemainingAmount(s)
        return acc
      }, {})
      const rpaWithDebt = Object.values(rpaDebts)
        .sort((a, b) => b.total_outstanding - a.total_outstanding)
        .slice(0, 6)

      return {
        weeklyProfit,
        weeklySalesCount: weeklySales.length,
        weeklyBuyCount,
        totalPiutang,
        rpaCount: Object.keys(rpaDebts).length,
        rpaWithDebt,
        readyFarmsCount,
        recentFeed,
        weeklyData: days,
        armadaAlerts: { expiringSIMs },
        overdueCount: unpaidSales.filter(s => s.due_date && s.due_date <= today).length
      }
    },
    enabled: !!tenantId
  })
}
