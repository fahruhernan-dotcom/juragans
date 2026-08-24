import React, { useState, useMemo } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import {
  TrendingUp, TrendingDown, Clock, Zap,
  BarChart3, ShieldCheck, ExternalLink, Globe,
  PieChart, Activity, MapPin, Check, ChevronsUpDown,
  RefreshCw, Search, Database, Users, Layers, ArrowRight, Minus
} from 'lucide-react'
import {
  AreaChart, Area, XAxis, YAxis, CartesianGrid,
  Tooltip as RechartsTooltip, ResponsiveContainer
} from 'recharts'
import { format, startOfWeek, startOfMonth, subDays } from 'date-fns'
import { supabase } from '@/lib/supabase'
import { useAuth } from '@/lib/hooks/useAuth'
import { isSuperadmin } from '@/lib/auth'
import { isOwner, isStaff } from '@/lib/auth/business-roles'
import { formatIDR, formatDate, safeNum } from '@/lib/format'
import { Button } from '@/components/ui/button'
import { Card, CardContent } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Skeleton } from '@/components/ui/skeleton'
import { ScrollArea, ScrollBar } from '@/components/ui/scroll-area'
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover'
import { Command, CommandInput, CommandList, CommandEmpty, CommandGroup, CommandItem } from '@/components/ui/command'
import { useQuery } from '@tanstack/react-query'
import { cn } from '@/lib/utils'
import { PROVINCES } from '@/lib/constants/regions'

// ─── Constants ───────────────────────────────────────────────────────────────
const WIB_OFFSET = 7 * 60 * 60 * 1000

// Arboge stores generic region names (e.g. "Sumatera" not "Sumatera Utara").
// This maps each province to the arboge region key stored in DB.
const PROVINCE_TO_ARBOGE_REGION = {
  'DKI Jakarta': 'Jakarta',
  'Banten': 'Banten',
  'Jawa Barat': 'Jawa Barat',
  'Jawa Tengah': 'Jawa Tengah',
  'DI Yogyakarta': 'Jawa Tengah',
  'Jawa Timur': 'Jawa Timur',
  'Bali': 'Bali',
  'Nusa Tenggara Barat': 'NTB',
  'Nusa Tenggara Timur': 'NTT',
  'Lampung': 'Lampung',
  // Sumatera provinces → generic "Sumatera"
  'Aceh': 'Sumatera',
  'Sumatera Utara': 'Sumatera',
  'Sumatera Barat': 'Sumatera',
  'Riau': 'Sumatera',
  'Kepulauan Riau': 'Sumatera',
  'Jambi': 'Sumatera',
  'Sumatera Selatan': 'Sumatera',
  'Kepulauan Bangka Belitung': 'Sumatera',
  'Bengkulu': 'Sumatera',
  // Kalimantan provinces → generic "Kalimantan"
  'Kalimantan Barat': 'Kalimantan',
  'Kalimantan Tengah': 'Kalimantan',
  'Kalimantan Selatan': 'Kalimantan',
  'Kalimantan Timur': 'Kalimantan',
  'Kalimantan Utara': 'Kalimantan',
  // Sulawesi provinces → generic "Sulawesi"
  'Sulawesi Utara': 'Sulawesi',
  'Sulawesi Tengah': 'Sulawesi',
  'Sulawesi Selatan': 'Sulawesi',
  'Sulawesi Tenggara': 'Sulawesi',
  'Gorontalo': 'Sulawesi',
  'Sulawesi Barat': 'Sulawesi',
}
const TODAY_STR = new Date(Date.now() + WIB_OFFSET).toISOString().split('T')[0]

const REGION_GROUPS = {
  "Sumatera": ["Aceh", "Sumatera Utara", "Sumatera Barat", "Riau", "Kepulauan Riau", "Jambi", "Sumatera Selatan", "Kepulauan Bangka Belitung", "Bengkulu", "Lampung"],
  "Jawa": ["DKI Jakarta", "Jawa Barat", "Banten", "Jawa Tengah", "DI Yogyakarta", "Jawa Timur"],
  "Bali & Nusa": ["Bali", "Nusa Tenggara Barat", "Nusa Tenggara Timur"],
  "Kalimantan": ["Kalimantan Barat", "Kalimantan Tengah", "Kalimantan Selatan", "Kalimantan Timur", "Kalimantan Utara"],
  "Sulawesi": ["Sulawesi Utara", "Sulawesi Tengah", "Sulawesi Selatan", "Sulawesi Tenggara", "Gorontalo", "Sulawesi Barat"],
  "Maluku & Papua": ["Maluku", "Maluku Utara", "Papua", "Papua Barat", "Papua Tengah", "Papua Pegunungan", "Papua Selatan", "Papua Barat Daya"]
}

const fadeUp = {
  hidden: { opacity: 0, y: 16 },
  visible: { opacity: 1, y: 0, transition: { duration: 0.4, ease: [0.25, 0.46, 0.45, 0.94] } }
}
const stagger = {
  hidden: {},
  visible: { transition: { staggerChildren: 0.07 } }
}

function _normaliseRow(row) {
  return {
    ...row,
    avg_buy_price:  safeNum(row.avg_buy_price)  || safeNum(row.farm_gate_price)  || 0,
    avg_sell_price: safeNum(row.avg_sell_price) || safeNum(row.buyer_price)       || 0,
    broker_margin:  safeNum(row.broker_margin)  || 0,
  }
}

function formatShortDate(dateStr) {
  const d = new Date(dateStr + 'T00:00:00')
  return d.toLocaleDateString('id-ID', { day: '2-digit', month: 'short' })
}

export default function MarketPriceDashboard() {
  const { profile, tenant } = useAuth()
  const _canWrite = isOwner(profile) || isStaff(profile) || isSuperadmin(profile)

  // Province is sourced from tenant account, with manual override on this page
  const [selectedProvince, setSelectedProvince] = useState(
    tenant?.province || 'Jawa Tengah'
  )
  const [trendPeriod, setTrendPeriod] = useState('monthly')

  // ── 1. Scraper Prices (Chickin.id) ──
  const { data: scrapResult, isLoading: scraperLoading } = useQuery({
    queryKey: ['dashboard-market-prices', selectedProvince],
    queryFn: async () => {
      const isAll = selectedProvince === 'Seluruh Indonesia'
      let q = supabase
        .from('market_prices')
        .select('price_date, farm_gate_price, buyer_price, region, source')
        .eq('is_deleted', false)
        .not('source', 'ilike', 'arboge_%')
        .gte('price_date', format(subDays(new Date(), 45), 'yyyy-MM-dd'))
        .order('price_date', { ascending: false })
      
      if (!isAll) q = q.ilike('region', selectedProvince)
      const { data, error } = await q
      if (error) throw error
      
      // Filter out invalid zero or ultra-low prices
      return (data || [])
        .filter(r => (r.farm_gate_price > 1000) || (r.buyer_price > 1000))
        .map(r => ({
          ...r,
          avg_buy_price: r.farm_gate_price,
          avg_sell_price: r.buyer_price,
          broker_margin: (r.buyer_price || 0) - (r.farm_gate_price || 0)
        }))
    },
    staleTime: 60 * 1000,
  })

  // ── 2. Arboge Reference & Realization ──
  const { data: arbogeMap } = useQuery({
    queryKey: ['dashboard-arboge-prices', selectedProvince],
    queryFn: async () => {
      const isAll = selectedProvince === 'Seluruh Indonesia'
      // Arboge uses generic region names — map province to arboge region key
      const arbogeRegion = PROVINCE_TO_ARBOGE_REGION[selectedProvince] || selectedProvince
      let q = supabase
        .from('market_prices')
        .select('price_date, farm_gate_price, region, source')
        .eq('is_deleted', false)
        .in('source', ['arboge_referensi', 'arboge_realisasi'])
        .gte('price_date', format(subDays(new Date(), 45), 'yyyy-MM-dd'))
        .order('price_date', { ascending: false })
      if (!isAll) q = q.ilike('region', arbogeRegion)
      const { data } = await q

      return (data || [])
        .filter(r => r.farm_gate_price > 1000) // Ignore invalid data
        .reduce((acc, r) => {
          const existing = acc[r.price_date]
          if (!existing || r.source === 'arboge_realisasi') acc[r.price_date] = r
          return acc
        }, {})
    },
    staleTime: 60 * 1000,
  })

  // ── 3. Platform Real-Transaction Hybrid Data (RPC) ──
  const { trendStartDate, trendEndDate, trendLabel } = useMemo(() => {
    const now = new Date()
    let start, end
    if (trendPeriod === 'weekly') {
      start = startOfWeek(now, { weekStartsOn: 1 })
      end = now
    } else {
      start = startOfMonth(now)
      end = now
    }
    return {
      trendStartDate: format(start, 'yyyy-MM-dd'),
      trendEndDate: format(end, 'yyyy-MM-dd'),
      trendLabel: trendPeriod === 'weekly' ? 'Minggu Ini' : 'Bulan Ini'
    }
  }, [trendPeriod])

  const { data: platformRpc, isLoading: rpcLoading } = useQuery({
    queryKey: ['dashboard-platform-rpc', selectedProvince],
    queryFn: async () => {
      const target = selectedProvince === 'Seluruh Indonesia' ? '%' : selectedProvince
      const { data } = await supabase.rpc('get_province_price_trends', {
        p_province: target,
        p_start_date: format(subDays(new Date(), 45), 'yyyy-MM-dd'),
        p_end_date: format(new Date(), 'yyyy-MM-dd'),
      })
      return (data || []).reduce((acc, r) => { acc[r.price_date] = r; return acc }, {})
    },
    staleTime: 60 * 1000
  })

  // ── Activity Stats (🔥 Indicators) ──
  const { data: activityMap } = useQuery({
    queryKey: ['dashboard-market-stats'],
    queryFn: async () => {
      const { data } = await supabase.rpc('get_public_market_stats')
      return data || {}
    },
    staleTime: 1000 * 60 * 15,
  })

  // ── Unified Data Merging ──
  const unifiedData = useMemo(() => {
    const rawMap = new Map()
    for (const row of (scrapResult || [])) if (!rawMap.has(row.price_date)) rawMap.set(row.price_date, row)

    const dates = new Set([
      ...rawMap.keys(),
      ...Object.keys(platformRpc || {}),
      ...Object.keys(arbogeMap || {}),
    ])
    return [...dates].sort().map(dStr => {
      const s = rawMap.get(dStr)
      const p = platformRpc?.[dStr]

      // Validation: only accept values > 1000 as valid market prices
      const chickin = (s?.avg_buy_price > 1000) ? s.avg_buy_price : null
      const arboge = (arbogeMap?.[dStr]?.farm_gate_price > 1000) ? arbogeMap[dStr].farm_gate_price : null
      const pBeli = (p?.avg_buy > 1000) ? Math.round(p.avg_buy) : null
      const pJual = (p?.avg_sell > 1000) ? Math.round(p.avg_sell) : null

      // For the summary table, we can pick the best available price
      const finalBeli = pBeli || chickin || 0
      const finalJual = pJual || s?.avg_sell_price || (chickin ? (chickin + 2000) : 0)

      return {
        date: dStr,
        price_date: dStr,
        displayDate: formatShortDate(dStr),
        chickin,
        arboge,
        platformBeli: pBeli,
        platformJual: pJual,

        avg_buy_price: finalBeli,
        avg_sell_price: finalJual,
        broker_margin: (finalJual > 0 && finalBeli > 0) ? (finalJual - finalBeli) : 0,
        source: p ? 'transaction' : (s?.source || 'auto_scraper')
      }
    }).filter(d => d.chickin || d.arboge || d.platformBeli || d.platformJual) // Remove empty dates junk
  }, [scrapResult, platformRpc, arbogeMap])

  const trendData = useMemo(() => {
    return unifiedData.filter(d => d.date >= trendStartDate && d.date <= trendEndDate)
  }, [unifiedData, trendStartDate, trendEndDate])

  const dedupedPrices = useMemo(() => [...unifiedData].reverse(), [unifiedData])
  const latestRow = dedupedPrices[0] ?? null

  const _avgMargin7d = useMemo(() => {
    const recent = dedupedPrices.slice(0, 7).filter(r => r.broker_margin > 0)
    if (!recent.length) return 0
    return Math.round(recent.reduce((s, r) => s + r.broker_margin, 0) / recent.length)
  }, [dedupedPrices])

  const _latestDelta = trendData?.[trendData.length - 1]?.delta ?? 0

  return (
    <div className="bg-bg-base text-tx-1 min-h-screen pb-28 relative overflow-hidden">
      {/* BG Glow */}
      <div className="absolute top-0 right-0 w-[600px] h-[600px] bg-emerald-500/4 rounded-full blur-[140px] pointer-events-none" />
      <div className="absolute bottom-0 left-0 w-[400px] h-[400px] bg-indigo-500/3 rounded-full blur-[120px] pointer-events-none" />

      {/* ── HEADER ──────────────────────────────────────────────────────── */}
      <motion.section
        variants={stagger} initial="hidden" animate="visible"
        className="px-6 pt-10 pb-6 relative z-10"
      >
        <motion.div variants={fadeUp} className="flex flex-col md:flex-row md:items-center justify-between gap-6">
          <div>
            <div className="flex items-center gap-2 mb-2">
              <div className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />
              <span className="text-[10px] font-black text-emerald-400 uppercase tracking-[0.2em]">Live Market Intelligence</span>
            </div>
            <h1 className="text-3xl font-display font-black text-tx-1 tracking-tight uppercase leading-none">
              Harga Pasar
            </h1>
            <p className="text-sm text-tx-3 font-medium mt-1.5 max-w-md">
              Data harga harian broiler berdasarkan scraper + transaksi nyata platform.
            </p>
          </div>

          <div className="flex items-center gap-3 flex-wrap">
            <ProvinceSelector 
              selected={selectedProvince} 
              onSelect={setSelectedProvince} 
              activityMap={activityMap}
            />

            <div className="bg-bg-2 border border-border-subtle rounded-xl px-4 py-2.5 flex items-center gap-2.5">
              <Clock size={13} className="text-tx-3" />
              <span className="text-xs font-bold text-tx-2">
                {latestRow ? formatDate(latestRow.price_date) : 'Belum ada data'}
              </span>
            </div>
          </div>
        </motion.div>
      </motion.section>

      {/* ── MAIN CONTENT ────────────────────────────────────────────────── */}
      <section className="px-6 grid grid-cols-1 lg:grid-cols-3 gap-6 relative z-10">
        <div className="lg:col-span-2 space-y-6">
          <motion.div variants={fadeUp} initial="hidden" animate="visible">
            <Card className="p-6 md:p-8 bg-bg-1 border border-border-subtle rounded-[28px] relative overflow-hidden">
              <div className="absolute top-0 right-0 w-[400px] h-[400px] bg-[radial-gradient(circle,rgba(2, 26, 2,0.04)_0%,transparent_70%)] pointer-events-none" />

              <div className="flex flex-col gap-4 mb-8 relative z-10">
                <div className="flex flex-wrap justify-between items-start gap-3">                  <div>
                    <div className="flex items-center gap-2 mb-1">
                      <div className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" />
                      <p className="text-[10px] font-black text-emerald-400 uppercase tracking-[0.2em]">Data Real Platform + Referensi Pasar</p>
                    </div>
                    <h2 className="text-xl md:text-2xl font-black text-white tracking-tight">Hybrid Market Insight</h2>
                  </div>
                  <div className="flex bg-bg-2/80 p-1 rounded-xl border border-border-subtle shrink-0">
                    <button
                      onClick={() => setTrendPeriod('weekly')}
                      className={cn("px-4 py-1.5 text-[9px] font-black uppercase tracking-widest rounded-lg transition-all",
                        trendPeriod === 'weekly' ? "bg-emerald-500 text-white shadow-lg shadow-emerald-500/20" : "text-tx-3 hover:text-tx-2"
                      )}
                    >Mingguan</button>
                    <button
                      onClick={() => setTrendPeriod('monthly')}
                      className={cn("px-4 py-1.5 text-[9px] font-black uppercase tracking-widest rounded-lg transition-all ml-0.5",
                        trendPeriod === 'monthly' ? "bg-emerald-500 text-white shadow-lg shadow-emerald-500/20" : "text-tx-3 hover:text-tx-2"
                      )}
                    >Bulanan</button>
                  </div>
                </div>
                <div className="flex flex-wrap items-center gap-4">
                  <LegendItem color="#F59E0B" label="Chickin.id (Ref)" dashed />
                  <LegendItem color="#F97316" label="Arboge.com (Ref)" dashed />
                  <LegendItem color="var(--brand-500)" label="Beli (TernakOS)" />
                  <LegendItem color="#818CF8" label="Jual (TernakOS)" />
                  <span className="ml-auto text-[9px] font-black text-tx-3 uppercase tracking-widest bg-bg-2 px-2 py-0.5 rounded-lg border border-border-subtle">
                    {selectedProvince} · {trendLabel}
                  </span>
                </div>
              </div>

              <div className="h-[260px] w-full relative z-10">
                {rpcLoading ? (
                  <div className="h-full flex items-center justify-center">
                    <div className="w-8 h-8 rounded-full border-2 border-emerald-500/30 border-t-emerald-500 animate-spin" />
                  </div>
                ) : (
                  <ResponsiveContainer width="100%" height="100%">
                    <AreaChart data={trendData}>
                      <defs>
                        <linearGradient id="gradBuy" x1="0" y1="0" x2="0" y2="1">
                          <stop offset="5%" stopColor="var(--brand-500)" stopOpacity={0.15} />
                          <stop offset="95%" stopColor="var(--brand-500)" stopOpacity={0} />
                        </linearGradient>
                        <linearGradient id="gradSell" x1="0" y1="0" x2="0" y2="1">
                          <stop offset="5%" stopColor="#818CF8" stopOpacity={0.1} />
                          <stop offset="95%" stopColor="#818CF8" stopOpacity={0} />
                        </linearGradient>
                      </defs>
                      <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="var(--border-sub-val)" />
                      <XAxis dataKey="displayDate" axisLine={false} tickLine={false} tick={{ fill: 'var(--text-muted-val)', fontSize: 10, fontWeight: 800 }} dy={10} interval={trendPeriod === 'monthly' ? 4 : 0} />
                      <YAxis hide domain={['dataMin - 3000', 'dataMax + 2000']} />
                      <RechartsTooltip content={<HybridTooltip />} />
                      <Area type="monotone" dataKey="chickin" stroke="#F59E0B" strokeWidth={2} strokeDasharray="5 4" fill="transparent" connectNulls dot={false} />
                      <Area type="monotone" dataKey="arboge" stroke="#F97316" strokeWidth={2} strokeDasharray="3 3" fill="transparent" connectNulls dot={false} />
                      <Area type="monotone" dataKey="platformJual" stroke="#818CF8" strokeWidth={2} fillOpacity={1} fill="url(#gradSell)" connectNulls activeDot={{ r: 5, stroke: 'var(--bg-1-val)', strokeWidth: 2, fill: '#818CF8' }} />
                      <Area type="monotone" dataKey="platformBeli" stroke="var(--brand-500)" strokeWidth={3} fillOpacity={1} fill="url(#gradBuy)" connectNulls activeDot={{ r: 6, stroke: 'var(--bg-1-val)', strokeWidth: 2, fill: 'var(--brand-500)' }} />
                    </AreaChart>
                  </ResponsiveContainer>
                )}
              </div>
            </Card>
          </motion.div>

          <motion.div variants={fadeUp} initial="hidden" animate="visible">
            <div className="flex items-center justify-between px-1 mb-3">
              <h3 className="text-[11px] font-black text-tx-3 uppercase tracking-[0.2em]">Riwayat Update</h3>
              <span className="text-[10px] font-bold text-tx-3">{dedupedPrices.length} records</span>
            </div>
            <Card className="bg-bg-1 border border-border-subtle rounded-[24px] overflow-hidden">
              <ScrollArea className="w-full">
                <table className="w-full text-left border-collapse">
                  <thead>
                    <tr className="border-b border-border-subtle bg-bg-2/20">
                      <th className="p-4 text-[10px] font-black text-tx-3 uppercase tracking-widest">Tanggal</th>
                      <th className="p-4 text-[10px] font-black text-tx-3 uppercase text-right">Beli (Kandang)</th>
                      <th className="p-4 text-[10px] font-black text-tx-3 uppercase text-right">Jual (RPA/Pasar)</th>
                      <th className="p-4 text-[10px] font-black text-tx-3 uppercase text-right">Margin</th>
                      <th className="p-4 text-[10px] font-black text-tx-3 uppercase text-center">Sumber</th>
                    </tr>
                  </thead>
                  <tbody>
                    {scraperLoading ? (
                      Array(6).fill(0).map((_, i) => (
                        <tr key={i}><td colSpan={5} className="p-4"><Skeleton className="h-4 w-full bg-border-subtle/50" /></td></tr>
                      ))
                    ) : !dedupedPrices.length ? (
                      <tr><td colSpan={5} className="p-8 text-center text-tx-3 text-sm font-bold">Belum ada data untuk {selectedProvince}</td></tr>
                    ) : dedupedPrices.slice(0, 14).map((p, i) => (
                      <tr key={i} className={cn("border-b border-border-subtle transition-colors", p.price_date === TODAY_STR ? "bg-emerald-500/5" : "hover:bg-bg-2/40")}>
                        <td className="p-4 text-xs font-bold text-tx-1 flex items-center gap-2">
                          {p.price_date === TODAY_STR && <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 inline-block" />}
                          {formatDate(p.price_date, 'dd MMM yyyy')}
                        </td>
                        <td className="p-4 text-xs font-bold text-tx-2 text-right tabular-nums">{formatIDR(p.avg_buy_price).replace('Rp ', '')}</td>
                        <td className="p-4 text-xs font-black text-tx-1 text-right tabular-nums">{formatIDR(p.avg_sell_price).replace('Rp ', '')}</td>
                        <td className="p-4 text-xs font-black text-emerald-600 dark:text-brand-500 text-right tabular-nums">{formatIDR(p.broker_margin).replace('Rp ', '')}</td>
                        <td className="p-4 text-center"><SourceBadge source={p.source} /></td>
                      </tr>
                    ))}
                  </tbody>
                </table>
                <ScrollBar orientation="horizontal" />
              </ScrollArea>
            </Card>
          </motion.div>
        </div>

        <div className="space-y-6">
          <motion.div variants={fadeUp} initial="hidden" animate="visible">
            <Card className="bg-bg-1 border border-border-subtle rounded-[28px] overflow-hidden relative">
              <div className="absolute inset-0 bg-[radial-gradient(circle_at_top_right,rgba(2, 26, 2,0.05),transparent_60%)] pointer-events-none" />
              <CardContent className="p-6 relative z-10">
                <div className="flex items-center gap-2 mb-4">
                  <div className="w-8 h-8 rounded-xl bg-emerald-500/10 flex items-center justify-center text-emerald-400">
                    <ShieldCheck size={15} />
                  </div>
                  <div>
                    <p className="text-[9px] font-black text-emerald-400 uppercase tracking-[0.2em]">Metodologi Data</p>
                    <h3 className="text-sm font-black text-tx-1">Hybrid Intelligence</h3>
                  </div>
                </div>
                <div className="space-y-4">
                  <SourceInfoRow color="#F59E0B" label="Chickin.id" desc="Scraper harian farm gate price" badge="Auto" badgeColor="text-amber-400 bg-amber-500/10" dotted />
                  <SourceInfoRow color="#F97316" label="Arboge.com" desc="Referensi harga broker regional" badge="Reference" badgeColor="text-orange-400 bg-orange-500/10" dotted />
                  <SourceInfoRow 
                    isHybrid
                    label="Transaksi Platform" 
                    desc="Rata-rata transaksi broker TernakOS" 
                    badge="Verified" 
                    badgeColor="text-emerald-400 bg-emerald-500/10" 
                  />
                </div>
                <div className="mt-5 pt-4 border-t border-border-subtle">
                  <p className="text-[10px] text-tx-3 font-medium leading-relaxed">
                    ⚠️ Data bersifat <span className="text-tx-1 font-bold">read-only</span>. Digunakan sebagai acuan posisi beli dan jual broker di pasar regional.
                  </p>
                </div>
              </CardContent>
            </Card>
          </motion.div>

          <motion.div variants={fadeUp} initial="hidden" animate="visible">
            <h3 className="text-[11px] font-black text-tx-3 uppercase tracking-[0.2em] px-1 mb-3">Wawasan Komoditas</h3>
            <div className="space-y-3">
              {[
                { title: 'TernakOS vs Chickin', desc: 'Kami fokus pada data transaksi nyata broker.', icon: Activity },
                { title: 'Positioning Harga', desc: 'Bandingkan posisi beli Anda vs referensi pasar.', icon: ShieldCheck },
              ].map((item, i) => (
                <Card key={i} className="bg-bg-2 border border-border-subtle rounded-2xl group cursor-default">
                  <CardContent className="p-4 flex gap-4">
                    <div className="w-9 h-9 rounded-xl bg-bg-3 flex items-center justify-center shrink-0 group-hover:bg-emerald-500/10 group-hover:text-emerald-400 transition-colors text-tx-3">
                      <item.icon size={17} />
                    </div>
                    <div>
                      <h4 className="text-[12px] font-black text-tx-1 uppercase tracking-tight">{item.title}</h4>
                      <p className="text-[11px] text-tx-3 font-medium leading-relaxed mt-0.5">{item.desc}</p>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          </motion.div>
        </div>
      </section>
    </div>
  )
}

// ─── Sub-Components ──────────────────────────────────────────────────────────

function ProvinceSelector({ selected, onSelect, activityMap }) {
  const [open, setOpen] = useState(false)
  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger asChild>
        <Button
          variant="outline"
          className="h-10 bg-bg-2 border-border-subtle font-black rounded-xl flex justify-between items-center px-4 gap-3 uppercase tracking-widest hover:bg-bg-3 transition-all text-[10px] min-w-[200px]"
        >
          <div className="flex items-center gap-2">
            <MapPin size={13} className="text-emerald-400 shrink-0" />
            <span className="truncate">{selected}</span>
          </div>
          <ChevronsUpDown size={13} className="opacity-50 shrink-0" />
        </Button>
      </PopoverTrigger>
      <PopoverContent className="w-[300px] p-0 bg-bg-1 border-border-subtle shadow-2xl">
        <Command className="bg-transparent">
          <CommandInput placeholder="Cari provinsi..." className="h-11 font-bold" />
          <CommandList className="max-h-[350px]">
            <CommandEmpty className="py-4 text-center text-[10px] font-black uppercase opacity-50">Tidak ditemukan.</CommandEmpty>
            <CommandGroup heading="Akses Cepat" className="px-2 text-[9px] font-black uppercase tracking-widest text-tx-3 opacity-50">
              <CommandItem onSelect={() => { onSelect('Seluruh Indonesia'); setOpen(false) }} className="flex items-center gap-2 rounded-lg cursor-pointer text-[10px] font-bold uppercase py-2.5">
                <MapPin size={12} className="text-emerald-500" /> Seluruh Indonesia
              </CommandItem>
            </CommandGroup>
            {Object.entries(REGION_GROUPS).map(([group, provinces]) => (
              <CommandGroup key={group} heading={group} className="px-2 mt-2 text-[9px] font-black uppercase tracking-widest text-tx-3">
                {provinces.map((p) => (
                  <CommandItem
                    key={p} value={p}
                    onSelect={() => { onSelect(p); setOpen(false) }}
                    className="flex items-center justify-between rounded-lg cursor-pointer text-[10px] font-bold uppercase py-2.5 hover:bg-emerald-500/10 group"
                  >
                    <div className="flex items-center gap-2">
                      <MapPin size={12} className={cn("transition-colors", selected === p ? "text-emerald-500" : "text-tx-3 group-hover:text-emerald-500")} />
                      <span className={cn(selected === p ? "text-emerald-500" : "text-tx-1")}>{p}</span>
                    </div>
                    {activityMap?.[p] && <span className="text-[8px] text-emerald-500/70 font-black">🔥 {activityMap[p]} TRX</span>}
                  </CommandItem>
                ))}
              </CommandGroup>
            ))}
          </CommandList>
        </Command>
      </PopoverContent>
    </Popover>
  )
}

function StatCard({ label, value, diff, sub, icon: Icon, isLoading, highlight, spreadPositive }) {
  return (
    <Card className={cn("border-border-subtle rounded-[20px] transition-all", highlight ? "bg-bg-1 border-emerald-500/20 shadow-[0_0_30px_rgba(2, 26, 2,0.05)]" : "bg-bg-1/60")}>
      <CardContent className="p-4 md:p-5">
        {isLoading ? (
          <div className="space-y-2"><Skeleton className="h-3 w-16 bg-bg-2" /><Skeleton className="h-8 w-24 bg-bg-2" /></div>
        ) : (
          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <span className="text-[10px] font-black text-tx-3 uppercase tracking-widest leading-tight">{label}</span>
              <Icon size={13} className={cn(highlight || spreadPositive ? 'text-emerald-400' : 'text-tx-3')} />
            </div>
            <div>
              <span className={cn("text-2xl font-black tabular-nums tracking-tight block", highlight || spreadPositive ? 'text-emerald-400' : 'text-tx-1')}>
                {value ? formatIDR(value).replace('Rp ', '') : '—'}
              </span>
              {diff !== undefined && (
                <span className={cn("text-[9px] font-black flex items-center gap-0.5 uppercase mt-0.5", diff > 0 ? 'text-emerald-400' : diff < 0 ? 'text-rose-400' : 'text-tx-3')}>
                  {diff > 0 ? '▲' : diff < 0 ? '▼' : '●'} {Math.abs(diff).toLocaleString('id-ID')}
                </span>
              )}
              {sub && <span className={cn("text-[10px] font-bold mt-0.5 block", spreadPositive ? 'text-emerald-500/70' : 'text-tx-3')}>{sub}</span>}
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  )
}

function HybridTooltip({ active, payload }) {
  if (!active || !payload?.length) return null
  const d = payload[0].payload
  const spread = (d.platformBeli && d.chickin) ? d.chickin - d.platformBeli : null
  const margin = (d.platformBeli && d.platformJual) ? d.platformJual - d.platformBeli : null
  return (
    <div className="bg-bg-1 border border-border-subtle p-4 rounded-2xl shadow-2xl min-w-[200px] backdrop-blur-xl">
      <p className="text-[10px] font-black text-tx-3 uppercase tracking-[0.2em] mb-3">{d.displayDate}</p>
      <div className="space-y-2.5">
        {[
          { label: 'Chickin.id (Ref)', val: d.chickin, color: 'text-amber-500 font-bold' },
          { label: 'Arboge.com (Ref)', val: d.arboge, color: 'text-orange-500 font-bold' },
          { label: 'Beli (TernakOS)', val: d.platformBeli, color: 'text-emerald-600 dark:text-brand-500 font-black' },
          { label: 'Jual (TernakOS)', val: d.platformJual, color: 'text-indigo-600 dark:text-indigo-400 font-black' },
        ].map(({ label, val, color }) => (
          <div key={label} className="flex justify-between items-center gap-4">
            <span className="text-[11px] text-tx-2 font-bold">{label}</span>
            <span className={cn("text-sm font-black tabular-nums", val ? color : 'text-tx-3')}>
              {val ? formatIDR(val) : '—'}
            </span>
          </div>
        ))}
      </div>
      {(spread != null || margin != null) && (
        <div className="mt-3 pt-3 border-t border-border-subtle space-y-1.5">
          {spread != null && (
            <div className="flex justify-between items-center">
              <span className="text-[9px] font-black text-tx-3 uppercase tracking-wider">Efisiensi Beli</span>
              <span className={cn('text-xs font-black tabular-nums', spread >= 0 ? 'text-emerald-600 dark:text-brand-500' : 'text-rose-600 dark:text-rose-400')}>
                {spread > 0 ? '+' : ''}{formatIDR(spread)}
              </span>
            </div>
          )}
          {margin != null && (
            <div className="flex justify-between items-center">
              <span className="text-[9px] font-black text-tx-3 uppercase tracking-wider">Margin/kg</span>
              <span className={cn('text-xs font-black tabular-nums', margin >= 0 ? 'text-emerald-600 dark:text-brand-500' : 'text-rose-600 dark:text-rose-400')}>
                {margin > 0 ? '+' : ''}{formatIDR(margin)}
              </span>
            </div>
          )}
        </div>
      )}
    </div>
  )
}

function SourceBadge({ source }) {
  const map = {
    auto_scraper: { label: 'Scraped', color: 'text-sky-400 bg-sky-500/10' },
    transaction: { label: 'Verified', color: 'text-emerald-400 bg-emerald-500/10' },
    arboge_referensi: { label: 'Arboge Ref', color: 'text-amber-400 bg-amber-500/10' },
    arboge_realisasi: { label: 'Arboge Real', color: 'text-orange-400 bg-orange-500/10' },
  }
  const s = map[source] || { label: source || '—', color: 'text-tx-3 bg-bg-2' }
  return <span className={cn('text-[9px] font-black uppercase tracking-tighter px-2 py-0.5 rounded-lg', s.color)}>{s.label}</span>
}

function LegendItem({ color, label, dashed = false }) {
  return (
    <div className="hidden md:flex items-center gap-2">
      {dashed
        ? <div className="w-4 h-0 border-t-2 border-dashed" style={{ borderColor: color }} />
        : <div className="w-2 h-2 rounded-full" style={{ background: color }} />}
      <span className="text-[9px] font-black text-tx-3 uppercase tracking-wider">{label}</span>
    </div>
  )
}

function SourceInfoRow({ color, label, desc, badge, badgeColor, dotted, isHybrid }) {
  return (
    <div className="flex items-start gap-3">
      {isHybrid ? (
         <div className="flex gap-1 mt-2 shrink-0">
           <div className="w-2 h-2 rounded-full" style={{ background: 'var(--brand-500)' }} title="Beli" />
           <div className="w-2 h-2 rounded-full" style={{ background: '#818CF8' }} title="Jual" />
         </div>
      ) : (
        <div 
          className={cn("shrink-0 mt-1.5", dotted ? "w-3 h-0 border-t-2 border-dashed" : "w-2 h-2 rounded-full")} 
          style={{ borderColor: color, background: dotted ? 'transparent' : color }} 
        />
      )}
      <div className="flex-1 min-w-0">
        <div className="flex items-center gap-2 mb-0.5">
          <span className="text-[11px] font-black text-tx-1 uppercase tracking-tight">{label}</span>
          <span className={cn('text-[8px] font-black uppercase tracking-widest px-1.5 py-0.5 rounded', badgeColor)}>{badge}</span>
        </div>
        <p className="text-[10px] text-tx-3 font-medium leading-relaxed">{desc}</p>
      </div>
    </div>
  )
}
