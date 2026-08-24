// ProfitChart.jsx + StockTrendChart.jsx — chart components
import React, { useMemo, useState } from 'react'
import {
  AreaChart, Area, BarChart, Bar, Cell, LabelList,
  XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer,
} from 'recharts'
import { formatIDR } from '@/lib/format'
import { C } from '../sembakoSaleUtils'
import { ChartTooltip, StockChartTooltip } from './BerandaUtils'
import { getSupplierRecommendation } from '@/lib/hooks/sembako/sembakoSupplierAssistant'
import { ChartContainer } from '@/components/ui/chart'
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

const chartConfig = {
  stok: {
    label: "Stok Fisik",
  },
}

const salesChartConfig = {
  cashIn: {
    label: "Uang Masuk",
    color: "#16A34A",
  },
  cashOut: {
    label: "Uang Keluar",
    color: "#DC2626",
  },
  grossProfit: {
    label: "Gross Profit",
    color: "#10B981",
  },
  netProfit: {
    label: "Net Profit",
    color: "#0F172A",
  },
}

// ── Legend Dot ───────────────────────────────────────────────────────────────
function LegendDot({ color, label }) {
  return (
    <span style={{ display: 'flex', alignItems: 'center', gap: '5px' }}>
      <span style={{ width: '10px', height: '10px', borderRadius: '50%', background: color, flexShrink: 0, display: 'inline-block' }} />
      <span style={{ fontSize: '10px', fontWeight: 800, color: MC.text }}>{label}</span>
    </span>
  )
}

// ── Sales Performance Chart ──────────────────────────────────────────────────
// ── Sales & Cash Flow Assistant Chart ────────────────────────────────────────
export function SalesAndCashChart({ 
  weeklyData, 
  monthlyData, 
  chartPeriod, 
  setChartPeriod, 
  isDesktop, 
  unrealizedProfitSnapshot = 0,
  cashSummary = {},
  stats,
  layout
}) {
  const [hoveredChart, setHoveredChart] = useState(null)
  const data = chartPeriod === 'weekly' ? weeklyData : monthlyData
  const totalGrossProfit = data.reduce((s, d) => s + (d.grossProfit || 0), 0)
  const totalNetProfit = data.reduce((s, d) => s + (d.netProfit || 0), 0)

  const {
    totalCashIn = 0,
    totalCashOut = 0,
    totalCashOutPurchases = 0,
    totalCashOutExpenses = 0,
    totalCashOutPayroll = 0,
    totalCashOutCogs = 0,
    totalCashOutDelivery = 0,
    cashBalance = 0,
    realizedProfit = 0,
  } = cashSummary

  const kpiBoxStyle = {
    display: 'flex',
    flexDirection: 'column',
    justifyContent: 'flex-start',
    padding: '12px 14px',
    background: '#F8FAFC',
    border: `1px solid ${MC.border}`,
    borderRadius: '12px',
    fontFamily: "'Sora', 'Inter', sans-serif",
    position: 'relative',
    overflow: 'hidden',
    boxShadow: '0 1px 2px rgba(0,0,0,0.02)',
  }
  const kpiLabelStyle = { fontSize: '10px', color: MC.muted, fontWeight: 700, letterSpacing: '0.02em', fontFamily: "'Sora', 'Inter', sans-serif" }
  const kpiValueStyle = { fontSize: '16px', fontWeight: 800, color: MC.text, fontFamily: "'Sora', 'Inter', sans-serif", marginTop: '3px', lineHeight: '1.2' }

  const chartHeightPx = layout?.chartHeight ? `${layout.chartHeight}px` : (isDesktop ? '140px' : '110px')

  return (
    <div style={{
      background: MC.card, borderRadius: '18px', padding: '16px',
      border: `1px solid ${MC.border}`, width: '100%', marginBottom: '20px',
      fontFamily: "'Sora', 'Inter', sans-serif",
      boxShadow: '0 1px 3px rgba(0,0,0,0.05)',
    }}>
      {/* ── Header ── */}
      <div style={{ display: 'flex', flexDirection: isDesktop ? 'row' : 'column', alignItems: isDesktop ? 'center' : 'stretch', justifyContent: 'space-between', gap: '12px', borderBottom: `1px solid ${MC.border}`, paddingBottom: '12px', marginBottom: '16px' }}>
        <div>
          <span style={{ fontSize: '11px', fontWeight: 800, color: MC.accent, letterSpacing: '0.1em' }}>KINERJA PENJUALAN & ALUR KAS</span>
          <p style={{ fontSize: '11px', color: MC.muted, marginTop: '2px' }}>Ringkasan akrual penjualan (Invoice) & arus kas riil (Pembayaran)</p>
        </div>

        {/* Period Switcher */}
        <div style={{
          display: 'flex', background: '#F1F5F9', borderRadius: '10px',
          padding: '3px', border: `1px solid ${MC.border}`, alignSelf: isDesktop ? 'auto' : 'flex-start'
        }}>
          {[['weekly', 'Minggu'], ['monthly', 'Bulan']].map(([key, label]) => (
            <Button
              key={key}
              onClick={() => setChartPeriod(key)}
              variant={chartPeriod === key ? 'default' : 'ghost'}
              size="sm"
              className="px-3 h-7 text-[10px] font-bold rounded-lg transition-all border-none"
              style={{
                background: chartPeriod === key ? MC.accent : 'transparent',
                color: chartPeriod === key ? '#fff' : MC.muted,
              }}
            >
              {label}
            </Button>
          ))}
        </div>
      </div>

      {/* ── KPI Grid ── */}
      <div style={{ display: 'flex', flexDirection: 'column', gap: '16px', marginBottom: '18px' }}>
        
        {/* Kolom Penjualan */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
          <span style={{ fontSize: '10px', fontWeight: 800, color: MC.muted, letterSpacing: '0.08em' }}>📊 PENJUALAN (AKRUAL)</span>
          <div style={{ display: 'grid', gridTemplateColumns: isDesktop ? '1fr 1fr 1fr' : '1fr', gap: '10px' }}>
            <div style={kpiBoxStyle}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                <span style={{ width: '6px', height: '6px', borderRadius: '50%', background: MC.green, flexShrink: 0 }} />
                <span style={kpiLabelStyle}>Gross Profit</span>
              </div>
              <span style={kpiValueStyle}>{formatIDR(totalGrossProfit)}</span>
            </div>
            <div style={kpiBoxStyle}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                <span style={{ width: '6px', height: '6px', borderRadius: '50%', background: MC.amber, flexShrink: 0 }} />
                <span style={kpiLabelStyle}>Net Profit</span>
              </div>
              <span style={kpiValueStyle}>{formatIDR(totalNetProfit)}</span>
            </div>
            <div style={kpiBoxStyle}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                <span style={{ width: '6px', height: '6px', borderRadius: '50%', background: MC.red, flexShrink: 0 }} />
                <span style={kpiLabelStyle}>Belum Terealisasi (Piutang)</span>
              </div>
              <span style={kpiValueStyle}>{formatIDR(unrealizedProfitSnapshot)}</span>
            </div>
          </div>
        </div>

        {/* Kolom Arus Kas */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
          <span style={{ fontSize: '10px', fontWeight: 800, color: MC.muted, letterSpacing: '0.08em' }}>💸 ARUS KAS (RIIL)</span>
          <div style={{ display: 'grid', gridTemplateColumns: isDesktop ? '1fr 1fr 1fr 1fr' : '1fr 1fr', gap: '10px' }}>
            <div style={kpiBoxStyle}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                <span style={{ width: '6px', height: '6px', borderRadius: '50%', background: MC.green, flexShrink: 0 }} />
                <span style={kpiLabelStyle}>Kas Masuk</span>
              </div>
              <span style={kpiValueStyle}>{formatIDR(totalCashIn)}</span>
            </div>
            <div style={kpiBoxStyle}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                <span style={{ width: '6px', height: '6px', borderRadius: '50%', background: MC.red, flexShrink: 0 }} />
                <span style={kpiLabelStyle}>Kas Keluar</span>
              </div>
              <span style={kpiValueStyle}>{formatIDR(totalCashOut)}</span>
              {(totalCashOutPurchases > 0 || totalCashOutExpenses > 0 || totalCashOutPayroll > 0 || totalCashOutDelivery > 0) && (
                <div style={{ display: 'flex', gap: '4px', marginTop: '6px', flexWrap: 'wrap', fontSize: '8px', color: MC.muted, fontFamily: "'Sora', 'Inter', sans-serif" }}>
                  {totalCashOutPurchases > 0 && <span style={{ background: '#F1F5F9', padding: '2px 5px', borderRadius: '4px', border: `1px solid ${MC.border}` }}>Stok {formatIDR(totalCashOutPurchases)}</span>}
                  {totalCashOutExpenses > 0 && <span style={{ background: '#F1F5F9', padding: '2px 5px', borderRadius: '4px', border: `1px solid ${MC.border}` }}>Ops {formatIDR(totalCashOutExpenses)}</span>}
                  {totalCashOutPayroll > 0 && <span style={{ background: '#F1F5F9', padding: '2px 5px', borderRadius: '4px', border: `1px solid ${MC.border}` }}>Gaji {formatIDR(totalCashOutPayroll)}</span>}
                  {totalCashOutDelivery > 0 && <span style={{ background: '#F1F5F9', padding: '2px 5px', borderRadius: '4px', border: `1px solid ${MC.border}` }}>Kirim {formatIDR(totalCashOutDelivery)}</span>}
                </div>
              )}
            </div>
            <div style={kpiBoxStyle}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                <span style={{ width: '6px', height: '6px', borderRadius: '50%', background: cashBalance >= 0 ? MC.green : MC.red, flexShrink: 0 }} />
                <span style={kpiLabelStyle}>Saldo Kas</span>
              </div>
              <span style={kpiValueStyle}>{formatIDR(cashBalance)}</span>
            </div>
            <div style={kpiBoxStyle}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                <span style={{ width: '6px', height: '6px', borderRadius: '50%', background: MC.amber, flexShrink: 0 }} />
                <span style={kpiLabelStyle}>Profit Direalisasi</span>
              </div>
              <span style={kpiValueStyle}>{formatIDR(realizedProfit)}</span>
            </div>
          </div>
        </div>
      </div>

      {/* ── CHART 1: ARUS KAS (RIIL) ── */}
      <div 
        onMouseEnter={() => setHoveredChart('cash')}
        onMouseLeave={() => setHoveredChart(null)}
        style={{ marginBottom: '20px', position: 'relative', zIndex: hoveredChart === 'cash' ? 10 : 1 }}
      >
        <div style={{ display: 'flex', flexDirection: isDesktop ? 'row' : 'column', justifyContent: 'space-between', alignItems: isDesktop ? 'center' : 'flex-start', gap: '8px', marginBottom: '8px' }}>
          <span style={{ fontSize: '10px', fontWeight: 800, color: MC.muted, letterSpacing: '0.05em' }}>💸 GRAFIK ARUS KAS (KAS MASUK vs KAS KELUAR)</span>
          <div style={{ display: 'flex', gap: '10px', flexWrap: 'wrap' }}>
            <LegendDot color="#16A34A" label="Uang Masuk" />
            <LegendDot color="#DC2626" label="Uang Keluar" />
          </div>
        </div>
        <div style={{ width: '100%', height: chartHeightPx }}>
          <ChartContainer config={salesChartConfig} style={{ width: '100%', height: '100%', aspectRatio: 'auto' }}>
            <AreaChart data={data} margin={{ top: 8, right: 8, left: 0, bottom: 0 }}>
              <defs>
                <linearGradient id="colorCashIn" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="#16A34A" stopOpacity={0.08}/>
                  <stop offset="95%" stopColor="#16A34A" stopOpacity={0}/>
                </linearGradient>
                <linearGradient id="colorCashOut" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="#DC2626" stopOpacity={0.08}/>
                  <stop offset="95%" stopColor="#DC2626" stopOpacity={0}/>
                </linearGradient>
              </defs>
              <CartesianGrid strokeDasharray="3 3" stroke="#F1F5F9" vertical={false} />
              <XAxis
                dataKey="name"
                stroke={MC.muted}
                fontSize={10}
                tickLine={false}
                axisLine={false}
                tickMargin={8}
                minTickGap={16}
              />
              <YAxis
                stroke={MC.muted}
                fontSize={10}
                tickLine={false}
                axisLine={false}
                tickFormatter={v => v >= 1000000 ? (v/1000000).toFixed(1)+'jt' : v >= 1000 ? (v/1000).toFixed(0)+'rb' : v}
              />
              <Tooltip content={<ChartTooltip />} cursor={{ stroke: '#E2E8F0', strokeWidth: 1 }} wrapperStyle={{ zIndex: 1000 }} />
              <Area
                type="monotone"
                dataKey="cashIn"
                name="Uang Masuk"
                stroke="#16A34A"
                strokeWidth={2.5}
                fill="url(#colorCashIn)"
                isAnimationActive={false}
                activeDot={{ r: 5, fill: '#16A34A', stroke: MC.card, strokeWidth: 2 }}
              />
              <Area
                type="monotone"
                dataKey="cashOut"
                name="Uang Keluar"
                stroke="#DC2626"
                strokeWidth={2.5}
                fill="url(#colorCashOut)"
                isAnimationActive={false}
                activeDot={{ r: 5, fill: '#DC2626', stroke: MC.card, strokeWidth: 2 }}
              />
            </AreaChart>
          </ChartContainer>
        </div>
      </div>

      <div style={{ height: '1px', background: MC.border, margin: '16px 0' }} />

      {/* ── CHART 2: KINERJA PROFIT (AKRUAL) ── */}
      <div
        onMouseEnter={() => setHoveredChart('profit')}
        onMouseLeave={() => setHoveredChart(null)}
        style={{ position: 'relative', zIndex: hoveredChart === 'profit' ? 10 : 1 }}
      >
        <div style={{ display: 'flex', flexDirection: isDesktop ? 'row' : 'column', justifyContent: 'space-between', alignItems: isDesktop ? 'center' : 'flex-start', gap: '8px', marginBottom: '8px' }}>
          <span style={{ fontSize: '10px', fontWeight: 800, color: MC.muted, letterSpacing: '0.05em' }}>📊 GRAFIK PROFITABILITAS (GROSS vs NET PROFIT)</span>
          <div style={{ display: 'flex', gap: '10px', flexWrap: 'wrap' }}>
            <LegendDot color="#10B981" label="Gross Profit" />
            <LegendDot color="#0F172A" label="Net Profit" />
          </div>
        </div>
        <div style={{ width: '100%', height: chartHeightPx }}>
          <ChartContainer config={salesChartConfig} style={{ width: '100%', height: '100%', aspectRatio: 'auto' }}>
            <AreaChart data={data} margin={{ top: 8, right: 8, left: 0, bottom: 0 }}>
              <defs>
                <linearGradient id="colorGrossProfit" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="#10B981" stopOpacity={0.06}/>
                  <stop offset="95%" stopColor="#10B981" stopOpacity={0}/>
                </linearGradient>
                <linearGradient id="colorNetProfit" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="#0F172A" stopOpacity={0.06}/>
                  <stop offset="95%" stopColor="#0F172A" stopOpacity={0}/>
                </linearGradient>
              </defs>
              <CartesianGrid strokeDasharray="3 3" stroke="#F1F5F9" vertical={false} />
              <XAxis
                dataKey="name"
                stroke={MC.muted}
                fontSize={10}
                tickLine={false}
                axisLine={false}
                tickMargin={8}
                minTickGap={16}
              />
              <YAxis
                stroke={MC.muted}
                fontSize={10}
                tickLine={false}
                axisLine={false}
                tickFormatter={v => v >= 1000000 ? (v/1000000).toFixed(1)+'jt' : v >= 1000 ? (v/1000).toFixed(0)+'rb' : v}
              />
              <Tooltip content={<ChartTooltip />} cursor={{ stroke: '#E2E8F0', strokeWidth: 1 }} wrapperStyle={{ zIndex: 1000 }} />
              <Area
                type="monotone"
                dataKey="grossProfit"
                name="Gross Profit"
                stroke="#10B981"
                strokeWidth={1.5}
                strokeDasharray="5 3"
                fill="url(#colorGrossProfit)"
                isAnimationActive={false}
                activeDot={{ r: 4, fill: '#10B981', stroke: MC.card, strokeWidth: 2 }}
              />
              <Area
                type="monotone"
                dataKey="netProfit"
                name="Net Profit"
                stroke="#0F172A"
                strokeWidth={2}
                fill="url(#colorNetProfit)"
                isAnimationActive={false}
                activeDot={{ r: 5, fill: '#0F172A', stroke: MC.card, strokeWidth: 2 }}
              />
            </AreaChart>
          </ChartContainer>
        </div>
      </div>
    </div>
  )
}

// ── Stock Trend Chart ────────────────────────────────────────────────────────
export function StockTrendChart({ products = [], sales = [], batches = [], suppliers = [], isDesktop = true }) {
  const [filter, setFilter] = useState('semua') // 'semua', 'kritis_menipis', 'overstock'

  // Calculate 30-day product sales velocity
  const productSalesQty = useMemo(() => {
    const now = new Date()
    const sales30Days = sales.filter(s => {
      if (s.is_deleted) return false
      const date = new Date(s.transaction_date || s.created_at)
      const diff = Math.ceil(Math.abs(now - date) / (1000 * 60 * 60 * 24))
      return diff <= 30
    })

    const qtyMap = {}
    sales30Days.forEach(s => {
      const items = s.items || s.sembako_sale_items || []
      items.forEach(it => {
        const pId = it.product_id
        const qty = Number(it.quantity) || 0
        if (pId) {
          qtyMap[pId] = (qtyMap[pId] || 0) + qty
        }
      })
    })
    return qtyMap
  }, [sales])

  // Calculate health stats for each product
  const calculatedProducts = useMemo(() => {
    return products.map(p => {
      const pId = p.id
      const totalSold30d = productSalesQty[pId] || 0
      const ads = totalSold30d / 30
      const stock = p.current_stock || 0
      const modal = p.avg_buy_price || 0
      const sellPrice = p.sell_price || 0
      const modalTertahan = stock * modal
      const potensiOmzet = stock * sellPrice

      let doi = 999
      if (ads > 0) {
        doi = stock / ads
      } else if (stock === 0) {
        doi = 0
      }

      let status = 'aman'
      let statusLabel = 'Aman'
      let color = '#10B981' // Green

      if (stock === 0 && ads > 0) {
        status = 'kritis'
        statusLabel = 'Kritis'
        color = '#EF4444' // Red
      } else if (doi <= 2) {
        status = 'kritis'
        statusLabel = 'Kritis'
        color = '#EF4444' // Red
      } else if (doi <= 7) {
        status = 'menipis'
        statusLabel = 'Menipis'
        color = '#F59E0B' // Yellow/Orange
      } else if (doi > 30) {
        status = 'overstock'
        statusLabel = 'Overstock'
        color = '#06B6D4' // Teal/Cyan
      }

      return {
        ...p,
        totalSold30d,
        ads,
        doi,
        modalTertahan,
        potensiOmzet,
        status,
        statusLabel,
        color
      }
    })
  }, [products, productSalesQty])

  // Sort by status weight (Critical > Thin > Overstock > Safe), then by locked capital desc
  const sortedProducts = useMemo(() => {
    const statusWeight = {
      kritis: 4,
      menipis: 3,
      overstock: 2,
      aman: 1
    }

    return [...calculatedProducts].sort((a, b) => {
      const weightA = statusWeight[a.status] || 0
      const weightB = statusWeight[b.status] || 0
      if (weightA !== weightB) {
        return weightB - weightA
      }
      return b.modalTertahan - a.modalTertahan
    })
  }, [calculatedProducts])

  // Apply quick filter
  const filteredProducts = useMemo(() => {
    if (filter === 'semua') {
      return sortedProducts.slice(0, 7)
    }
    if (filter === 'kritis_menipis') {
      return sortedProducts.filter(p => p.status === 'kritis' || p.status === 'menipis').slice(0, 7)
    }
    if (filter === 'overstock') {
      return sortedProducts.filter(p => p.status === 'overstock').slice(0, 7)
    }
    return sortedProducts.slice(0, 7)
  }, [sortedProducts, filter])

  // Map to chart payload
  const stockChartData = useMemo(() => {
    return filteredProducts.map(p => {
      const rec = getSupplierRecommendation(p.id, batches, suppliers)
      return {
        name: p.product_name?.length > 12 ? p.product_name.slice(0, 10) + '..' : p.product_name,
        fullName: p.product_name,
        stok: p.current_stock || 0,
        ads: p.ads,
        doi: p.doi,
        statusLabel: p.statusLabel,
        status: p.status,
        color: p.color,
        modalTertahan: p.modalTertahan,
        potensiOmzet: p.potensiOmzet,
        id: p.id,
        unit: p.unit || 'unit',
        recSupplierName: rec?.supplierName || null,
        recStatusText: rec?.statusText || null,
        reorderQty: p.status === 'kritis' || p.status === 'menipis'
          ? Math.max(0, Math.ceil(p.ads * 30 - p.current_stock))
          : 0
      }
    })
  }, [filteredProducts, batches, suppliers])

  if (products.length === 0) return null

  const filterBtnSt = (active) => ({
    padding: '4px 10px',
    borderRadius: '7px',
    border: 'none',
    cursor: 'pointer',
    fontSize: '10px',
    fontWeight: 800,
    background: active ? MC.accent : 'transparent',
    color: active ? '#fff' : MC.muted,
    transition: 'all 0.15s',
  })

  const chartHeight = Math.min(isDesktop ? 300 : 240, Math.max(90, stockChartData.length * (isDesktop ? 44 : 38) + 15))
  
  const colorMap = {
    kritis: MC.red,
    menipis: MC.amber,
    aman: MC.green,
    overstock: '#0891B2'
  }

  return (
    <div style={{ background: MC.card, borderRadius: '20px', padding: isDesktop ? '20px' : '16px', border: `1px solid ${MC.border}`, marginBottom: '20px', boxShadow: '0 1px 3px rgba(0,0,0,0.05)' }}>
      {/* Header & Filter Row */}
      <div style={{ display: 'flex', flexDirection: isDesktop ? 'row' : 'column', alignItems: isDesktop ? 'flex-start' : 'stretch', justifyContent: 'space-between', gap: '12px', marginBottom: '14px' }}>
        <div>
          <span style={{ fontSize: '11px', fontWeight: 800, color: MC.accent, letterSpacing: '0.1em' }}>INVENTORY HEALTH ASSISTANT</span>
          <p style={{ fontSize: '11px', color: MC.muted, marginTop: '2px' }}>Analisis tingkat risiko kehabisan stok & dana tertahan</p>
        </div>

        {/* Filter Switcher */}
        <div style={{
          display: 'flex', background: '#F1F5F9', borderRadius: '10px',
          padding: '3px', border: `1px solid ${MC.border}`, alignSelf: isDesktop ? 'auto' : 'flex-start'
        }}>
          <Button
            onClick={() => setFilter('semua')}
            variant={filter === 'semua' ? 'default' : 'ghost'}
            size="sm"
            className="px-2.5 h-6 text-[10px] font-bold rounded-lg transition-all border-none"
            style={{
              background: filter === 'semua' ? MC.accent : 'transparent',
              color: filter === 'semua' ? '#fff' : MC.muted,
            }}
          >
            Semua
          </Button>
          <Button
            onClick={() => setFilter('kritis_menipis')}
            variant={filter === 'kritis_menipis' ? 'default' : 'ghost'}
            size="sm"
            className="px-2.5 h-6 text-[10px] font-bold rounded-lg transition-all border-none"
            style={{
              background: filter === 'kritis_menipis' ? MC.accent : 'transparent',
              color: filter === 'kritis_menipis' ? '#fff' : MC.muted,
            }}
          >
            Kritis/Menipis
          </Button>
          <Button
            onClick={() => setFilter('overstock')}
            variant={filter === 'overstock' ? 'default' : 'ghost'}
            size="sm"
            className="px-2.5 h-6 text-[10px] font-bold rounded-lg transition-all border-none"
            style={{
              background: filter === 'overstock' ? MC.accent : 'transparent',
              color: filter === 'overstock' ? '#fff' : MC.muted,
            }}
          >
            Overstock
          </Button>
        </div>
      </div>

      {/* Legend Row */}
      <div style={{ display: 'flex', gap: '10px', flexWrap: 'wrap', marginBottom: '16px', justifyContent: 'flex-start' }}>
        <LegendDot color={MC.red} label="Kritis (≤ 2 hari)" />
        <LegendDot color={MC.amber} label="Menipis (≤ 7 hari)" />
        <LegendDot color={MC.green} label="Aman" />
        <LegendDot color="#0891B2" label="Overstock (> 30 hari)" />
      </div>

      {stockChartData.length === 0 ? (
        <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '150px', color: MC.muted, fontSize: '12px', fontStyle: 'italic' }}>
          Tidak ada produk yang sesuai dengan filter ini.
        </div>
      ) : (
        <div style={{ width: '100%', height: `${chartHeight}px` }}>
          <ChartContainer config={chartConfig} style={{ width: '100%', height: '100%', aspectRatio: 'auto' }}>
            <BarChart
              data={stockChartData}
              layout="vertical"
              margin={{ top: 5, right: 45, left: 0, bottom: 5 }}
            >
              <CartesianGrid horizontal={false} stroke="#F1F5F9" />
              <YAxis dataKey="name" type="category" tickLine={false} tickMargin={10} axisLine={false} hide />
              <XAxis dataKey="stok" type="number" hide />
              <Tooltip content={<StockChartTooltip />} cursor={{ fill: 'rgba(0,0,0,0.02)' }} />
              <Bar dataKey="stok" radius={6} barSize={isDesktop ? 22 : 18} isAnimationActive={false}>
                {stockChartData.map((entry, index) => (
                  <Cell key={`cell-${index}`} fill={colorMap[entry.status] || entry.color} />
                ))}
                <LabelList
                  dataKey="name"
                  position="insideLeft"
                  offset={10}
                  style={{
                    fill: '#FFFFFF',
                    fontWeight: 800,
                    fontSize: '11px',
                    fontFamily: "'Sora', 'Inter', sans-serif"
                  }}
                />
                <LabelList
                  dataKey="stok"
                  position="right"
                  offset={8}
                  style={{
                    fill: MC.text,
                    fontWeight: 800,
                    fontSize: '11px',
                    fontFamily: "'Sora', 'Inter', sans-serif"
                  }}
                  formatter={(val, entry) => {
                    const item = stockChartData.find(d => d.stok === val);
                    const unit = item?.unit || 'pcs';
                    return `${val} ${unit}`;
                  }}
                />
              </Bar>
            </BarChart>
          </ChartContainer>
        </div>
      )}
    </div>
  )
}
