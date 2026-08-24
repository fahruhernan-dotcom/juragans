/**
 * HargaPasarPublic.jsx
 * Route: /harga-pasar (PUBLIC - no auth required)
 *
 * Halaman publik monitoring harga ayam & komoditas.
 * Dirancang untuk:
 *  1. SEO - konten ter-render penuh, bisa dibaca Google Bot
 *  2. Lead magnet - pengunjung tanpa akun tetap bisa akses
 *  3. Unique selling point: data REAL dari transaksi nyata broker, bukan hanya scraper
 *
 * Data sources:
 *   - market_prices: scraper Chickin.id (farm_gate_price)
 *   - RPC get_province_price_trends: real transaction averages (all brokers)
 */

import React, { useMemo, useState, useEffect } from 'react'
import { motion } from 'framer-motion'
import { useParams, useNavigate, Link } from 'react-router-dom'
import {
  TrendingUp, TrendingDown, Minus,
  Clock, BarChart3, Info, MapPin,
  ChevronRight, ShieldCheck, Zap, Check, ChevronsUpDown,
  Search, Database, Users, Activity, Layers, ArrowRight
} from 'lucide-react'
import {
  Popover, PopoverContent, PopoverTrigger
} from '@/components/ui/popover'
import {
  Command, CommandEmpty, CommandGroup, CommandInput, CommandItem, CommandList
} from '@/components/ui/command'
import { PROVINCES } from '@/lib/constants/regions'
import {
  AreaChart, Area, XAxis, YAxis, CartesianGrid,
  Tooltip, ResponsiveContainer
} from 'recharts'
import { useQuery } from '@tanstack/react-query'
import { supabase } from '@/lib/supabase'
import { formatIDR, formatDate, safeNum } from '@/lib/format'
import { Card, CardContent } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Skeleton } from '@/components/ui/skeleton'
import { cn } from '@/lib/utils'
import Navbar from '@/components/Navbar'
import Footer from '@/components/Footer'
import SEO from '@/components/SEO'
import { format, subDays, startOfWeek, startOfMonth } from 'date-fns'
import Particles from '@/components/reactbits/Particles'

// ─── Constants ───────────────────────────────────────────────────────────────
const WIB_OFFSET = 7 * 60 * 60 * 1000
const TODAY = new Date(Date.now() + WIB_OFFSET).toISOString().split('T')[0]

// ─── Helpers ─────────────────────────────────────────────────────────────────
// eslint-disable-next-line no-unused-vars -- row normalizer for harga pasar data; not yet wired to current fetch path
function normaliseRow(row) {
  return {
    ...row,
    avg_buy_price: safeNum(row.avg_buy_price) || safeNum(row.farm_gate_price) || 0,
    avg_sell_price: safeNum(row.avg_sell_price) || safeNum(row.buyer_price) || 0,
    broker_margin: safeNum(row.broker_margin) || 0,
  }
}

const ID_MONTHS_SHORT = ['Jan','Feb','Mar','Apr','Mei','Jun','Jul','Agu','Sep','Okt','Nov','Des']

function formatShortDate(dateStr) {
  const d = new Date(dateStr + 'T00:00:00')
  return String(d.getDate()).padStart(2, '0') + ' ' + ID_MONTHS_SHORT[d.getMonth()]
}

function provinceToSlug(name) {
  return name.toLowerCase().replace(/\s+/g, '-')
}

function slugToProvince(slug) {
  if (!slug) return null
  return PROVINCES.find(p => provinceToSlug(p) === slug.toLowerCase()) || null
}

const REGION_GROUPS = {
  "Sumatera": ["Aceh", "Sumatera Utara", "Sumatera Barat", "Riau", "Kepulauan Riau", "Jambi", "Sumatera Selatan", "Kepulauan Bangka Belitung", "Bengkulu", "Lampung"],
  "Jawa": ["DKI Jakarta", "Jawa Barat", "Banten", "Jawa Tengah", "DI Yogyakarta", "Jawa Timur"],
  "Bali & Nusa": ["Bali", "Nusa Tenggara Barat", "Nusa Tenggara Timur"],
  "Kalimantan": ["Kalimantan Barat", "Kalimantan Tengah", "Kalimantan Selatan", "Kalimantan Timur", "Kalimantan Utara"],
  "Sulawesi": ["Sulawesi Utara", "Sulawesi Tengah", "Sulawesi Selatan", "Sulawesi Tenggara", "Gorontalo", "Sulawesi Barat"],
  "Maluku & Papua": ["Maluku", "Maluku Utara", "Papua", "Papua Barat", "Papua Tengah", "Papua Pegunungan", "Papua Selatan", "Papua Barat Daya"]
}

// ─── Sub-components ──────────────────────────────────────────────────────────

function StatCard({ label, value, sub, trend, isLoading, highlight }) {
  const Icon = trend === 'up' ? TrendingUp : trend === 'down' ? TrendingDown : Minus
  const trendColor =
    trend === 'up' ? 'text-emerald-400' :
      trend === 'down' ? 'text-red-400' : 'text-tx-3'

  return (
    <Card className={cn(
      "border-white/5 transition-all duration-300",
      highlight ? "bg-emerald-500/5 border-emerald-500/20" : "bg-[#0C1319]"
    )}>
      <CardContent className="p-5">
        {isLoading ? (
          <>
            <Skeleton className="h-3 w-20 mb-3 bg-white/5" />
            <Skeleton className="h-7 w-32 mb-2 bg-white/5" />
            <Skeleton className="h-3 w-16 bg-white/5" />
          </>
        ) : (
          <>
            <p className="text-[10px] text-tx-3 font-black uppercase tracking-[0.2em] mb-2">{label}</p>
            <p className={cn("text-2xl font-black tracking-tight tabular-nums", highlight ? "text-emerald-400" : "text-tx-1")}>{value}</p>
            <div className={cn('flex items-center gap-1.5 mt-1.5 text-[10px] font-bold uppercase tracking-wider', trendColor)}>
              <Icon size={11} />
              <span>{sub}</span>
            </div>
          </>
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

function BrokerTrendTooltip({ active, payload }) {
  if (!active || !payload?.length) return null
  const d = payload[0].payload
  const buyVal = d['Harga Beli']
  const sellVal = d['Harga Jual']
  return (
    <div className="bg-bg-1 border border-border-subtle p-4 rounded-2xl shadow-2xl min-w-[200px] backdrop-blur-xl">
      <p className="text-[10px] font-black text-tx-3 uppercase tracking-[0.2em] mb-3">
        {d.date ? formatShortDate(d.date) : ''}
      </p>
      <div className="space-y-2.5">
        <div className="flex justify-between items-center gap-4">
          <span className="text-[11px] text-tx-2 font-bold">Harga Beli</span>
          <span className="text-sm font-black tabular-nums text-emerald-600 dark:text-brand-500">
            {buyVal ? formatIDR(buyVal) : '—'}
          </span>
        </div>
        <div className="flex justify-between items-center gap-4">
          <span className="text-[11px] text-tx-2 font-bold">Harga Jual</span>
          <span className="text-sm font-black tabular-nums text-indigo-600 dark:text-indigo-400">
            {sellVal ? formatIDR(sellVal) : '—'}
          </span>
        </div>
      </div>
    </div>
  )
}

function LegendDot({ color, label, dashed }) {
  return (
    <div className="flex items-center gap-2">
      {dashed
        ? <div className="w-4 h-0 border-t-2 border-dashed" style={{ borderColor: color }} />
        : <div className="w-2 h-2 rounded-full" style={{ background: color }} />}
      <span className="text-[9px] font-black text-tx-3 uppercase tracking-wider">{label}</span>
    </div>
  )
}

// ─── Main Component ───────────────────────────────────────────────────────────

export default function HargaPasarPublic() {
  const { province: provinceSlug } = useParams()
  const navigate = useNavigate()
  const [open, setOpen] = useState(false)
  const [hybridPeriod, setHybridPeriod] = useState('weekly')
  const [isMounted, setIsMounted] = useState(false)
  useEffect(() => setIsMounted(true), [])
  const currentProvince = useMemo(() => slugToProvince(provinceSlug), [provinceSlug])

  const todayFmt = (() => { const d = new Date(); return `${d.getDate()} ${['Januari','Februari','Maret','April','Mei','Juni','Juli','Agustus','September','Oktober','November','Desember'][d.getMonth()]} ${d.getFullYear()}` })()
  const seoTitle = currentProvince
    ? `Harga Ayam Broiler Hidup Hari Ini di ${currentProvince} (Update ${todayFmt}) | TernakOS`
    : `Harga Ayam Broiler Hidup Hari Ini (Update Harian Real Data) | TernakOS`
  const seoDesc = currentProvince
    ? `Harga ayam broiler hidup hari ini di ${currentProvince} per ${todayFmt}. Data dari transaksi nyata broker + referensi Chickin.id. Update otomatis setiap hari.`
    : `Harga ayam broiler hidup hari ini per ${todayFmt}. Data dari transaksi nyata broker aktif seluruh Indonesia. Bandingkan harga kandang vs pasar per provinsi.`
  const seoPath = currentProvince
    ? `/harga-pasar/${provinceToSlug(currentProvince)}`
    : '/harga-pasar'

  // ── Market Prices (Scraper – for stat cards & history table) ─────────────
  const { data: result, isLoading } = useQuery({
    queryKey: ['public-market-prices', currentProvince],
    queryFn: async () => {
      const fetchNational = async () => {
        const { data, error } = await supabase
          .from('market_prices')
          .select('price_date, farm_gate_price, buyer_price')
          .eq('is_deleted', false)
          .not('source', 'ilike', 'arboge_%')
          .gte('price_date', format(subDays(new Date(), 45), 'yyyy-MM-dd'))
          .order('price_date', { ascending: false })
        if (error) throw error
        const grouped = (data || []).reduce((acc, row) => {
          const date = row.price_date
          if (!acc[date]) acc[date] = { price_date: date, farm_gate_sum: 0, buyer_sum: 0, count: 0 }
          acc[date].farm_gate_sum += (row.farm_gate_price || 0)
          acc[date].buyer_sum += (row.buyer_price || 0)
          acc[date].count += 1
          return acc
        }, {})
        return Object.values(grouped).map(g => ({
          ...g,
          region: 'Nasional',
          source: 'Aggregated',
          avg_buy_price: Math.round(g.farm_gate_sum / g.count),
          avg_sell_price: Math.round(g.buyer_sum / g.count),
          broker_margin: Math.round((g.buyer_sum - g.farm_gate_sum) / g.count)
        }))
      }

      if (!currentProvince) return { data: await fetchNational(), isFallback: false }

      const { data: regData, error } = await supabase
        .from('market_prices')
        .select('price_date, farm_gate_price, buyer_price, region, source')
        .eq('is_deleted', false)
        .not('source', 'ilike', 'arboge_%')
        .ilike('region', currentProvince)
        .gte('price_date', format(subDays(new Date(), 45), 'yyyy-MM-dd'))
        .order('price_date', { ascending: false })
      if (error) throw error

      if (!regData || regData.length === 0) return { data: await fetchNational(), isFallback: true }

      return {
        data: regData.map(r => ({
          ...r,
          avg_buy_price: r.farm_gate_price,
          avg_sell_price: r.buyer_price,
          broker_margin: (r.buyer_price || 0) - (r.farm_gate_price || 0)
        })),
        isFallback: false
      }
    },
    staleTime: 60 * 1000,
    refetchInterval: 60 * 1000,
  })

  // ── Arboge.com Reference & Realization Prices (Merged Source) ──────────
  const { data: arbogeMap } = useQuery({
    queryKey: ['public-arboge-prices', currentProvince],
    queryFn: async () => {
      let q = supabase
        .from('market_prices')
        .select('price_date, farm_gate_price, region, source')
        .eq('is_deleted', false)
        .in('source', ['arboge_referensi', 'arboge_realisasi'])
        .gte('price_date', format(subDays(new Date(), 45), 'yyyy-MM-dd'))
        .order('price_date', { ascending: false })
      if (currentProvince) q = q.ilike('region', currentProvince)
      const { data } = await q
      
      return (data || []).reduce((acc, r) => {
        // Priority: Realisasi > Referensi
        const existing = acc[r.price_date]
        if (!existing || r.source === 'arboge_realisasi') {
          acc[r.price_date] = r
        }
        return acc
      }, {})
    },
    staleTime: 60 * 1000,
  })

  // ── Platform Real-Transaction Hybrid Chart Data (RPC) ────────────────────
  const { hybridStartDate, hybridEndDate } = useMemo(() => {
    const now = new Date()
    let start, end
    if (hybridPeriod === 'weekly') {
      start = startOfWeek(now, { weekStartsOn: 1 })
      end = now
    } else {
      start = startOfMonth(now)
      end = now
    }
    return {
      hybridStartDate: format(start, 'yyyy-MM-dd'),
      hybridEndDate: format(end, 'yyyy-MM-dd'),
    }
  }, [hybridPeriod])

  const targetProvince = currentProvince || '%' // Use '%' for National aggregated data

  const fetchStartDate = useMemo(() => format(subDays(new Date(), 45), 'yyyy-MM-dd'), [])
  const fetchEndDate = useMemo(() => format(new Date(), 'yyyy-MM-dd'), [])

  const { data: platformRpc } = useQuery({
    queryKey: ['public-platform-rpc', targetProvince],
    queryFn: async () => {
      const { data } = await supabase.rpc('get_province_price_trends', {
        p_province: targetProvince,
        p_start_date: fetchStartDate,
        p_end_date: fetchEndDate,
      })
      return (data || []).reduce((acc, r) => { acc[r.price_date] = r; return acc }, {})
    },
    staleTime: 60 * 1000
  })

  const rawPrices = result?.data ?? []
  const isFallback = result?.isFallback ?? false

  const fullUnifiedData = useMemo(() => {
    const rawMap = new Map()
    for (const row of rawPrices) if (!rawMap.has(row.price_date)) rawMap.set(row.price_date, row)

    const dates = new Set([
      ...rawMap.keys(),
      ...Object.keys(platformRpc || {})
    ])

    return [...dates].sort().map(dStr => {
      const s = rawMap.get(dStr)
      const p = platformRpc?.[dStr]

      const chickin = s?.avg_buy_price || null
      const arboge = arbogeMap?.[dStr]?.farm_gate_price || null
      const pBeli = p?.avg_buy ? Math.round(p.avg_buy) : null
      const pJual = p?.avg_sell ? Math.round(p.avg_sell) : null

      const finalBeli = pBeli || chickin || 0
      const finalJual = pJual || s?.avg_sell_price || (chickin ? chickin + 2500 : 0)

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
        broker_margin: finalJual && finalBeli ? (finalJual - finalBeli) : 0,
        region: s?.region || targetProvince
      }
    })
  }, [rawPrices, platformRpc, targetProvince, arbogeMap])

  const hybridChartData = useMemo(() => {
    return fullUnifiedData.filter(d => d.date >= hybridStartDate && d.date <= hybridEndDate)
  }, [fullUnifiedData, hybridStartDate, hybridEndDate])

  const dedupedPrices = useMemo(() => [...fullUnifiedData].reverse(), [fullUnifiedData])

  // ── Activity / Social Proof (Using RPC to bypass RLS) ──────────────────────
  const { data: activityMap } = useQuery({
    queryKey: ['broker-activity-public'],
    queryFn: async () => {
      const { data, error } = await supabase.rpc('get_public_market_stats')
      if (error) {
        console.error('[SocialProof] RPC Error:', error.message)
        return {}
      }
      return data || {}
    },
    staleTime: 1000 * 60 * 30, // 30 minutes cache
  })

  const totalPlatformTx = useMemo(() => Object.values(activityMap || {}).reduce((a, b) => a + b, 0), [activityMap])
  const activeProvinces = useMemo(() => Object.keys(activityMap || {}).length, [activityMap])

  // ── Derived data ─────────────────────────────────────────────────────────
  const todayFmtId = useMemo(() => { const d = new Date(); return `${d.getDate()} ${['Januari','Februari','Maret','April','Mei','Juni','Juli','Agustus','September','Oktober','November','Desember'][d.getMonth()]} ${d.getFullYear()}` }, [])
  const latestRow = dedupedPrices[0] ?? null
  const prevRow = dedupedPrices[1] ?? null
  const buyTrend = useMemo(() => {
    if (!latestRow || !prevRow) return { dir: 'flat', diff: 0 }
    const diff = latestRow.avg_buy_price - prevRow.avg_buy_price
    return { dir: diff > 0 ? 'up' : diff < 0 ? 'down' : 'flat', diff }
  }, [latestRow, prevRow])
  const sellTrend = useMemo(() => {
    if (!latestRow || !prevRow) return { dir: 'flat', diff: 0 }
    const diff = latestRow.avg_sell_price - prevRow.avg_sell_price
    return { dir: diff > 0 ? 'up' : diff < 0 ? 'down' : 'flat', diff }
  }, [latestRow, prevRow])
  const marginTrend = useMemo(() => {
    if (!latestRow || !prevRow) return { dir: 'flat', diff: 0 }
    const diff = latestRow.broker_margin - prevRow.broker_margin
    return { dir: diff > 0 ? 'up' : diff < 0 ? 'down' : 'flat', diff }
  }, [latestRow, prevRow])
  const avgMargin7d = useMemo(() => {
    const recent = dedupedPrices.slice(0, 7).filter(r => r.broker_margin > 0)
    if (!recent.length) return 0
    return Math.round(recent.reduce((s, r) => s + r.broker_margin, 0) / recent.length)
  }, [dedupedPrices])

  // ── JSON-LD Structured Data (Seo) ────────────────────────────────────
  const jsonLd = useMemo(() => {
    const buyPriceStr = latestRow?.avg_buy_price ? `Rp ${latestRow.avg_buy_price.toLocaleString('id-ID')}/kg` : 'belum tersedia'
    const sellPriceStr = latestRow?.avg_sell_price ? `Rp ${latestRow.avg_sell_price.toLocaleString('id-ID')}/kg` : 'belum tersedia'
    const provinceLabel = currentProvince || 'Seluruh Indonesia'

    return {
      '@context': 'https://schema.org',
      '@graph': [
        {
          '@type': 'Organization',
          '@id': 'https://ternakos.my.id/#organization',
          'name': 'TernakOS',
          'url': 'https://ternakos.my.id',
          'logo': {
            '@type': 'ImageObject',
            'url': 'https://ternakos.my.id/logo.png',
            'width': '512',
            'height': '512'
          },
          'sameAs': [
            'https://instagram.com/ternakos.id',
            'https://tiktok.com/@ternakos'
          ]
        },
        {
          '@type': 'SoftwareApplication',
          'name': 'TernakOS',
          'operatingSystem': 'Web, Android, iOS',
          'applicationCategory': 'BusinessApplication',
          'aggregateRating': {
            '@type': 'AggregateRating',
            'ratingValue': '4.9',
            'reviewCount': '124'
          },
          'offers': {
            '@type': 'Offer',
            'price': '0',
            'priceCurrency': 'IDR'
          }
        },
        {
          '@type': 'BreadcrumbList',
          itemListElement: [
            { '@type': 'ListItem', position: 1, name: 'Beranda', item: 'https://ternakos.my.id' },
            { '@type': 'ListItem', position: 2, name: 'Harga Pasar', item: 'https://ternakos.my.id/harga-pasar' },
            ...(currentProvince ? [{ '@type': 'ListItem', position: 3, name: currentProvince, item: `https://ternakos.my.id/harga-pasar/${provinceToSlug(currentProvince)}` }] : [])
          ]
        },
        {
          '@type': 'Dataset',
          'name': `Harga Ayam Broiler Hidup Harian (${provinceLabel})`,
          'description': `Data harga ayam broiler hidup per kg untuk wilayah ${provinceLabel}. Mencakup harga beli di kandang dan harga jual ke pasar/RPA. Diperbarui setiap hari dari transaksi nyata broker aktif di platform TernakOS.`,
          'url': currentProvince
            ? `https://ternakos.my.id/harga-pasar/${provinceToSlug(currentProvince)}`
            : 'https://ternakos.my.id/harga-pasar',
          'keywords': [
            'harga ayam broiler hidup hari ini',
            'harga ayam broiler',
            'harga kandang ayam broiler',
            `harga ayam broiler ${provinceLabel.toLowerCase()}`,
            'harga jual ayam broiler',
            'harga pasar ayam hari ini',
          ],
          'temporalCoverage': `2024-01-01/${new Date().toISOString().split('T')[0]}`,
          'dateModified': new Date().toISOString(),
          'creator': { '@id': 'https://ternakos.my.id/#organization' },
          'variableMeasured': [
            { '@type': 'PropertyValue', name: 'Harga Beli Kandang', unitText: 'IDR/kg' },
            { '@type': 'PropertyValue', name: 'Harga Jual Pasar', unitText: 'IDR/kg' },
            { '@type': 'PropertyValue', name: 'Margin Broker', unitText: 'IDR/kg' },
          ]
        },
        {
          '@type': 'FAQPage',
          'mainEntity': [
            {
              '@type': 'Question',
              'name': 'Berapa harga ayam broiler hidup hari ini?',
              'acceptedAnswer': {
                '@type': 'Answer',
                'text': `Harga ayam broiler hidup hari ini per ${todayFmtId} adalah ${buyPriceStr} di tingkat kandang dan ${sellPriceStr} di tingkat pasar. Data ini diperbarui setiap hari dari rata-rata transaksi nyata broker aktif di platform TernakOS untuk wilayah ${provinceLabel}.`
              }
            },
            {
              '@type': 'Question',
              'name': 'Apa perbedaan harga kandang dan harga pasar ayam broiler?',
              'acceptedAnswer': {
                '@type': 'Answer',
                'text': 'Harga kandang (farm gate price) adalah harga saat broker membeli ayam langsung dari peternak. Harga pasar adalah harga saat broker menjual ke RPA atau pasar. Selisihnya disebut margin broker, biasanya berkisar Rp 1.500–3.000/kg tergantung jarak dan kondisi pasar.'
              }
            }
          ]
        }
      ]
    }
  }, [currentProvince, latestRow])
  const tableRows = useMemo(() => dedupedPrices.slice(0, 10), [dedupedPrices])

  // ─── Render ────────────────────────────────────────────────────────────────
  return (
    <div className="bg-bg-base text-tx-1 min-h-screen font-body relative overflow-hidden">
      <SEO
        title={seoTitle}
        description={seoDesc}
        path={seoPath}
        schema={jsonLd}
      />

      {/* Global Background Elements */}
      <div
        className="fixed inset-0 pointer-events-none z-0"
        style={{
          backgroundImage: `linear-gradient(rgba(255,255,255,0.02) 1px, transparent 1px), linear-gradient(90deg, rgba(255,255,255,0.02) 1px, transparent 1px)`,
          backgroundSize: '40px 40px',
          WebkitMaskImage: 'radial-gradient(ellipse 80% 50% at center top, black 30%, transparent 80%)',
          maskImage: 'radial-gradient(ellipse 80% 50% at center top, black 30%, transparent 80%)'
        }}
      />
      {isMounted && (
        <div style={{ position: 'fixed', inset: 0, zIndex: 0, pointerEvents: 'none' }}>
          <Particles
            particleColors={['#021a02', '#021a02', '#021a02']}
            particleCount={window.innerWidth < 768 ? 25 : 50}
            speed={0.2}
            particleBaseSize={1.4}
          />
        </div>
      )}
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ duration: 1.2 }}
        className="fixed top-[-120px] left-1/2 -translate-x-1/2 w-[400px] h-[400px] bg-[radial-gradient(circle,rgba(2, 26, 2,0.18),transparent_70%)] animate-glow-breathe z-0 pointer-events-none md:w-[800px] md:h-[800px]"
      />

      <Navbar />
      <div className="h-16 md:h-20" />

      <main className="max-w-6xl mx-auto px-4 py-12 md:py-20 space-y-20 md:space-y-28 relative z-10">

        {/* ── HERO ── */}
        <motion.section initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.4 }} className="space-y-6">
          <div className="flex flex-wrap items-center gap-3">
            <div className="flex items-center gap-2 px-3 py-1.5 rounded-full bg-emerald-500/10 border border-emerald-500/20">
              <div className="flex h-1.5 w-1.5 rounded-full bg-emerald-400">
                <div className="h-1.5 w-1.5 rounded-full bg-emerald-400 animate-ping" />
              </div>
              <span className="text-[10px] text-emerald-400 font-black uppercase tracking-widest">Update Harian Otomatis</span>
            </div>
            {activeProvinces > 0 && (
              <div className="flex items-center gap-2 px-3 py-1.5 rounded-full bg-white/5 border border-white/10">
                <Activity size={10} className="text-tx-3" />
                <span className="text-[10px] text-tx-3 font-black uppercase tracking-widest">{activeProvinces} Provinsi Aktif Minggu Ini</span>
              </div>
            )}
            {totalPlatformTx > 0 && (
              <div className="flex items-center gap-2 px-3 py-1.5 rounded-full bg-white/5 border border-white/10">
                <Database size={10} className="text-tx-3" />
                <span className="text-[10px] text-tx-3 font-black uppercase tracking-widest">{totalPlatformTx}+ Transaksi 7 Hari</span>
              </div>
            )}
          </div>

          <div>
            <div className="flex items-center gap-3 mb-6 group cursor-default">
              <div className="relative shrink-0">
                <div className="absolute inset-0 rounded-[12px] bg-emerald-500/20 blur-md opacity-60 group-hover:opacity-100 transition-opacity duration-300 pointer-events-none" />
                <img
                  src="/logo.png"
                  alt="TernakOS"
                  style={{ width: 44, height: 44, borderRadius: 12, objectFit: 'cover', display: 'block', border: '1px solid rgba(255,255,255,0.07)' }}
                  className="group-hover:scale-105 transition-transform duration-200 relative z-10"
                />
              </div>
              <span className="font-['Sora'] font-black text-2xl text-tx-1 tracking-tight leading-none">
                Ternak<span className="text-emerald-500">OS</span>
              </span>
            </div>
            <h1 className="text-3xl md:text-5xl lg:text-6xl font-black text-tx-1 leading-[1.1] tracking-tight uppercase max-w-3xl">
              Harga Ayam Broiler Hidup{currentProvince ? ` di ${currentProvince}` : ''}{' '}
              <span className="text-emerald-500">Hari Ini</span>
            </h1>
            <p className="text-tx-2 text-sm md:text-base font-medium max-w-2xl leading-relaxed mt-4" suppressHydrationWarning>
              {currentProvince
                ? `Update ${todayFmtId}. Data harga ayam broiler hidup hari ini untuk wilayah ${currentProvince} dari transaksi nyata broker + referensi Chickin.id.`
                : `Update ${todayFmtId}. Harga ayam broiler hidup hari ini nasional berdasarkan rata-rata transaksi nyata broker aktif di seluruh Indonesia.`}
            </p>
          </div>

          {/* Province Selector - Moved Up for UX */}
          <div className="space-y-3 pb-2">
            <p className="text-[10px] font-black text-emerald-400 uppercase tracking-widest pl-1">📍 Pilih Wilayah Anda:</p>
            <div className="flex flex-col md:flex-row md:items-center gap-4 p-1.5 rounded-2xl bg-bg-2 border border-border-subtle backdrop-blur-sm w-full">
              <div className="flex flex-wrap items-center gap-1.5 p-1">
                <Button
                  variant="ghost" size="sm"
                  onClick={() => navigate('/harga-pasar')}
                  className={cn(
                    "rounded-xl text-[10px] font-black uppercase tracking-widest px-4 h-9 transition-all",
                    !currentProvince ? "bg-emerald-500 text-white shadow-lg shadow-emerald-500/20" : "text-tx-3 hover:bg-bg-3/50"
                  )}
                >
                  Nasional
                </Button>
                {['Jawa Barat', 'Jawa Tengah', 'Jawa Timur', 'Sumatera Selatan', 'Lampung'].map(p => (
                  <Button
                    key={p} variant="ghost" size="sm"
                    onClick={() => navigate(`/harga-pasar/${provinceToSlug(p)}`)}
                    className={cn(
                      "rounded-xl text-[10px] font-black uppercase tracking-widest px-4 h-9 transition-all",
                      currentProvince === p ? "bg-emerald-500 text-white shadow-lg shadow-emerald-500/20" : "text-tx-3 hover:bg-bg-3/50"
                    )}
                  >
                    {p}
                  </Button>
                ))}
              </div>
              <div className="hidden md:block w-px h-6 bg-white/10 mx-1" />
              <div className="flex-1 flex items-center gap-3 px-3 min-w-[240px]">
                <div className="flex items-center gap-2 text-[10px] text-tx-3 font-black uppercase tracking-widest">
                  <Search size={14} />
                  <span>Cari Wilayah</span>
                </div>
                <Popover open={open} onOpenChange={setOpen}>
                  <PopoverTrigger asChild>
                    <Button
                      variant="outline" role="combobox" aria-expanded={open}
                      className="flex-1 justify-between h-9 bg-white/5 border-white/10 rounded-xl text-[10px] font-black uppercase tracking-widest text-tx-1 hover:bg-white/10 transition-all px-4"
                    >
                      {currentProvince ? currentProvince : "Pilih dari 38 Provinsi..."}
                      <ChevronsUpDown className="ml-2 h-3 w-3 shrink-0 opacity-50" />
                    </Button>
                  </PopoverTrigger>
                  <PopoverContent className="w-[300px] p-0 bg-bg-1 border border-border-subtle shadow-2xl">
                    <Command className="bg-transparent">
                      <CommandInput placeholder="Ketik nama provinsi..." className="h-11 text-xs" />
                      <CommandList className="max-h-[350px]">
                        <CommandEmpty className="py-6 text-center text-xs text-tx-3">Provinsi tidak ditemukan.</CommandEmpty>
                        <CommandGroup heading="Akses Cepat" className="px-2 text-[9px] font-black uppercase tracking-widest text-tx-3 opacity-50">
                          <CommandItem onSelect={() => { navigate('/harga-pasar'); setOpen(false) }} className="flex items-center gap-2 rounded-lg cursor-pointer text-[10px] font-bold uppercase py-2.5 hover:bg-bg-2">
                            <MapPin size={12} className="text-emerald-500" /> Seluruh Indonesia
                          </CommandItem>
                        </CommandGroup>
                        {Object.entries(REGION_GROUPS).map(([group, provinces]) => (
                          <CommandGroup key={group} heading={group} className="px-2 mt-2 text-[9px] font-black uppercase tracking-widest text-tx-3">
                            {provinces.map((p) => (
                              <CommandItem
                                key={p} value={p}
                                onSelect={() => { navigate(`/harga-pasar/${provinceToSlug(p)}`); setOpen(false) }}
                                className="flex items-center justify-between rounded-lg cursor-pointer text-[10px] font-bold uppercase py-2.5 hover:bg-emerald-500/10 group"
                              >
                                <div className="flex items-center gap-2">
                                  <MapPin size={12} className={cn("transition-colors", currentProvince === p ? "text-emerald-500" : "text-tx-3 group-hover:text-emerald-500")} />
                                  <span className={cn(currentProvince === p ? "text-emerald-500" : "text-tx-1")}>{p}</span>
                                  {activityMap?.[p] && <span className="flex h-1.5 w-1.5 rounded-full bg-emerald-400 animate-pulse ml-0.5" />}
                                </div>
                                <div className="flex items-center gap-2">
                                  {activityMap?.[p] && <span className="text-[8px] text-emerald-500/70 font-black">🔥 {activityMap[p]} TRX</span>}
                                  {currentProvince === p && <Check className="h-3 w-3 text-emerald-500" />}
                                </div>
                              </CommandItem>
                            ))}
                          </CommandGroup>
                        ))}
                      </CommandList>
                    </Command>
                  </PopoverContent>
                </Popover>
              </div>
            </div>
          </div>

          {latestRow && (
            <div className="flex flex-wrap items-center gap-4 text-xs text-tx-3">
              <div className="flex items-center gap-2">
                <Clock size={12} />
                <span>Update: {formatDate(latestRow.price_date)}</span>
              </div>
              <div className="flex items-center gap-2">
                <MapPin size={12} className={isFallback ? "text-amber-400" : "text-emerald-500"} />
                <span className={cn("font-bold", isFallback ? "text-amber-400" : "text-tx-1")}>
                  {currentProvince || 'Seluruh Indonesia (Rata-rata)'}
                </span>
              </div>
              {activityMap?.[currentProvince] && (
                <div className="flex items-center gap-1.5 px-2 py-0.5 rounded-md bg-emerald-500/10 border border-emerald-500/20 text-[10px] text-emerald-400 font-black uppercase tracking-wider animate-pulse">
                  🔥 Aktif Minggu Ini
                </div>
              )}
            </div>
          )}

          {isFallback && currentProvince && (
            <motion.div initial={{ opacity: 0, x: -10 }} animate={{ opacity: 1, x: 0 }} className="p-3 rounded-xl bg-amber-500/5 border border-amber-500/10 max-w-xl">
              <p className="text-[11px] text-amber-400/80 leading-relaxed font-medium">
                <span className="font-extrabold text-amber-400 mr-1">INFO:</span>
                Data spesifik <span className="text-amber-400 font-bold">{currentProvince}</span> belum tersedia.
                Menampilkan <span className="font-bold">Rata-rata Nasional</span> sebagai acuan.
              </p>
            </motion.div>
          )}
        </motion.section>

        {/* ── KPI STAT CARDS ── */}
        <motion.section initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.4, delay: 0.1 }} className="grid grid-cols-2 md:grid-cols-4 gap-4">
          <StatCard
            label="Harga Beli (Kandang)"
            value={isLoading ? '—' : formatIDR(latestRow?.avg_buy_price)}
            sub={buyTrend.dir === 'flat' ? 'Stabil' : `${buyTrend.dir === 'up' ? '+' : ''}${formatIDR(buyTrend.diff)} dari kemarin`}
            trend={buyTrend.dir} isLoading={isLoading}
          />
          <StatCard
            label="Harga Jual (Pasar)"
            value={isLoading ? '—' : formatIDR(latestRow?.avg_sell_price)}
            sub={sellTrend.dir === 'flat' ? 'Stabil' : `${sellTrend.dir === 'up' ? '+' : ''}${formatIDR(sellTrend.diff)} dari kemarin`}
            trend={sellTrend.dir} isLoading={isLoading}
          />
          <StatCard
            label="Margin Broker (Hari Ini)"
            value={isLoading ? '—' : formatIDR(latestRow?.broker_margin)}
            sub={marginTrend.dir === 'flat' ? 'Stabil dari kemarin' : `${marginTrend.dir === 'up' ? '+' : ''}${formatIDR(marginTrend.diff)} dari kemarin`}
            trend={marginTrend.dir} isLoading={isLoading}
          />
          <StatCard
            label="Rata-rata Margin 7 Hari"
            value={isLoading ? '—' : formatIDR(avgMargin7d)}
            sub="7 hari terakhir"
            trend="flat" isLoading={isLoading} highlight
          />
        </motion.section>

        {/* ── HYBRID CHART: Real Platform Data vs Chickin.id ── */}
        <motion.section initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.4, delay: 0.15 }}>
          <Card className="bg-bg-1 border border-border-subtle rounded-[28px] relative overflow-hidden">
            <div className="absolute top-0 right-0 w-[400px] h-[400px] bg-[radial-gradient(circle,rgba(2, 26, 2,0.04)_0%,transparent_70%)] pointer-events-none" />
            <CardContent className="p-6 md:p-8">
              {/* Header */}
              <div className="flex flex-col gap-4 mb-8 relative z-10">
                <div className="flex flex-wrap justify-between items-start gap-3">
                  <div>
                    <div className="flex items-center gap-2 mb-1">
                      <div className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" />
                      <p className="text-[10px] font-black text-emerald-400 uppercase tracking-[0.2em]">Data Real Platform + Referensi Pasar</p>
                    </div>
                    <h2 className="text-xl md:text-2xl font-black text-tx-1 tracking-tight">Hybrid Market Intelligence</h2>
                    <p className="text-[11px] text-tx-3 mt-1 max-w-md">
                      Dibanding platform lain, kami punya data transaksi nyata broker, bukan sekadar scraping.
                    </p>
                  </div>
                  <div className="flex bg-bg-2/80 p-1 rounded-xl border border-border-subtle shrink-0">
                    <button
                      onClick={() => setHybridPeriod('weekly')}
                      className={cn("px-4 py-1.5 text-[9px] font-black uppercase tracking-widest rounded-lg transition-all",
                        hybridPeriod === 'weekly' ? "bg-emerald-500 text-white shadow-lg shadow-emerald-500/20" : "text-tx-3 hover:text-[#94A3B8]"
                      )}
                    >Mingguan</button>
                    <button
                      onClick={() => setHybridPeriod('monthly')}
                      className={cn("px-4 py-1.5 text-[9px] font-black uppercase tracking-widest rounded-lg transition-all ml-0.5",
                        hybridPeriod === 'monthly' ? "bg-emerald-500 text-white shadow-lg shadow-emerald-500/20" : "text-tx-3 hover:text-[#94A3B8]"
                      )}
                    >Bulanan</button>
                  </div>
                </div>
                <div className="flex flex-wrap items-center gap-4">
                  <LegendDot color="#F59E0B" label="Chickin.id (Ref)" dashed />
                  <LegendDot color="#F97316" label="Arboge.com (Ref)" dashed />
                  <LegendDot color="var(--brand-500)" label="Beli Nyata (TernakOS)" />
                  <LegendDot color="#818CF8" label="Jual Nyata (TernakOS)" />
                  <span className="ml-auto text-[9px] font-black text-tx-3 uppercase tracking-widest">
                    {currentProvince || 'Jawa Tengah'} · {hybridPeriod === 'weekly' ? 'Minggu Ini' : 'Bulan Ini'}
                  </span>
                </div>
              </div>

              {/* Chart */}
              <div className="h-[260px] w-full relative z-10">
                {hybridChartData.length === 0 ? (
                  <div className="h-full flex flex-col items-center justify-center gap-3 text-center">
                    <div className="w-12 h-12 rounded-2xl bg-emerald-500/10 flex items-center justify-center">
                      <BarChart3 size={20} className="text-emerald-400/50" />
                    </div>
                    <p className="text-sm font-bold text-tx-3">Data platform belum tersedia untuk periode ini</p>
                    <p className="text-[11px] text-tx-3/70">Semakin banyak broker bergabung, semakin akurat datanya.</p>
                  </div>
                ) : (
                  <ResponsiveContainer width="100%" height="100%">
                    <AreaChart data={hybridChartData}>
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
                      <XAxis dataKey="displayDate" axisLine={false} tickLine={false} tick={{ fill: 'var(--text-muted-val)', fontSize: 10, fontWeight: 800 }} dy={10} interval={hybridPeriod === 'monthly' ? 4 : 0} />
                      <YAxis hide domain={['dataMin - 3000', 'dataMax + 2000']} />
                      <Tooltip content={<HybridTooltip />} />
                      <Area type="monotone" dataKey="chickin" stroke="#F59E0B" strokeWidth={2} strokeDasharray="5 4" fill="transparent" connectNulls dot={false} />
                      <Area type="monotone" dataKey="arboge" stroke="#F97316" strokeWidth={2} strokeDasharray="3 3" fill="transparent" connectNulls dot={false} />
                      <Area type="monotone" dataKey="platformJual" stroke="#818CF8" strokeWidth={2} fillOpacity={1} fill="url(#gradSell)" connectNulls activeDot={{ r: 5, stroke: 'var(--bg-1-val)', strokeWidth: 2, fill: '#818CF8' }} />
                      <Area type="monotone" dataKey="platformBeli" stroke="var(--brand-500)" strokeWidth={3} fillOpacity={1} fill="url(#gradBuy)" connectNulls activeDot={{ r: 6, stroke: 'var(--bg-1-val)', strokeWidth: 2, fill: 'var(--brand-500)' }} />
                    </AreaChart>
                  </ResponsiveContainer>
                )}
              </div>

              {/* Data Source Note */}
              <div className="mt-6 pt-4 border-t border-border-subtle flex flex-wrap items-center gap-2">
                <ShieldCheck size={12} className="text-emerald-400" />
                <p className="text-[10px] text-tx-3 font-medium">
                  <span className="text-emerald-400 font-black">Garis hijau & ungu</span> = transaksi nyata broker TernakOS.{' '}
                  <span className="text-amber-400 font-black">Kuning</span> = referensi Chickin.id.{' '}
                  <span className="text-orange-400 font-black">Oranye</span> = realisasi Arboge.com.
                </p>
              </div>
            </CardContent>
          </Card>
        </motion.section>

        {/* ── TREN JUAL BELI PLATFORM ── */}
        <motion.section initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.4, delay: 0.2 }}>
          <Card className="bg-bg-1 border border-border-subtle rounded-[28px]">
            <CardContent className="p-6 md:p-8">
              <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-6">
                <div>
                  <p className="text-[10px] font-black text-tx-3 uppercase tracking-[0.2em] mb-1">Analisis Margin Platform</p>
                  <h2 className="text-xl font-black text-tx-1">Tren Jual Beli Broker</h2>
                  <div className="flex items-center gap-4 mt-3">
                    <LegendDot color="var(--brand-500)" label="Harga Beli (Kandang)" />
                    <LegendDot color="#6366F1" label="Harga Jual (Pasar/RPA)" />
                  </div>
                </div>
                <div className="flex items-center gap-2 shrink-0">
                  <div className="flex bg-bg-2/80 p-1 rounded-xl border border-white/5">
                    <button
                      onClick={() => setHybridPeriod('weekly')}
                      className={cn("px-4 py-1.5 text-[9px] font-black uppercase tracking-widest rounded-lg transition-all",
                        hybridPeriod === 'weekly' ? "bg-emerald-500 text-white shadow-lg shadow-emerald-500/20" : "text-tx-3 hover:text-[#94A3B8]"
                      )}
                    >Mingguan</button>
                    <button
                      onClick={() => setHybridPeriod('monthly')}
                      className={cn("px-4 py-1.5 text-[9px] font-black uppercase tracking-widest rounded-lg transition-all ml-0.5",
                        hybridPeriod === 'monthly' ? "bg-emerald-500 text-white shadow-lg shadow-emerald-500/20" : "text-tx-3 hover:text-[#94A3B8]"
                      )}
                    >Bulanan</button>
                  </div>
                  <Badge className="text-[10px] border-emerald-500/20 bg-emerald-500/5 text-emerald-400 font-black uppercase hidden sm:flex">
                    {latestRow?.region ?? 'Nasional'}
                  </Badge>
                </div>
              </div>
              {isLoading ? (
                <Skeleton className="h-56 w-full bg-white/5 rounded-lg" />
              ) : (
                <ResponsiveContainer width="100%" height={220}>
                  <AreaChart data={dedupedPrices
                    .filter(r => r.price_date >= hybridStartDate && r.price_date <= hybridEndDate)
                    .reverse().map(r => ({
                      date: r.price_date,
                      'Harga Beli': r.avg_buy_price,
                      'Harga Jual': r.avg_sell_price,
                    }))} margin={{ top: 4, right: 4, bottom: 0, left: 8 }}>
                    <defs>
                      <linearGradient id="gradB2" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="5%" stopColor="var(--brand-500)" stopOpacity={0.25} />
                        <stop offset="95%" stopColor="var(--brand-500)" stopOpacity={0} />
                      </linearGradient>
                      <linearGradient id="gradS2" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="5%" stopColor="#6366F1" stopOpacity={0.25} />
                        <stop offset="95%" stopColor="#6366F1" stopOpacity={0} />
                      </linearGradient>
                    </defs>
                    <CartesianGrid strokeDasharray="3 3" stroke="#ffffff08" />
                    <XAxis dataKey="date" tickFormatter={formatShortDate} tick={{ fill: 'var(--text-muted-val)', fontSize: 10 }} axisLine={false} tickLine={false} interval={hybridPeriod === 'monthly' ? 4 : 0} />
                    <YAxis tickFormatter={v => `${(v / 1000).toFixed(0)}k`} tick={{ fill: 'var(--text-muted-val)', fontSize: 10 }} axisLine={false} tickLine={false} width={38} />
                    <Tooltip content={<BrokerTrendTooltip />} />
                    <Area type="monotone" dataKey="Harga Beli" stroke="var(--brand-500)" strokeWidth={2} fill="url(#gradB2)" dot={false} activeDot={{ r: 4, fill: 'var(--brand-500)' }} />
                    <Area type="monotone" dataKey="Harga Jual" stroke="#6366F1" strokeWidth={2} fill="url(#gradS2)" dot={false} activeDot={{ r: 4, fill: '#6366F1' }} />
                  </AreaChart>
                </ResponsiveContainer>
              )}
            </CardContent>
          </Card>
        </motion.section>

        {/* ── HISTORY TABLE ── */}
        <motion.section initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.4, delay: 0.3 }}>
          <Card className="bg-bg-1 border border-border-subtle rounded-[28px]">
            <CardContent className="p-6 md:p-8">
              <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-8">
                <div>
                  <h2 className="text-xl font-black text-tx-1 uppercase tracking-tight">Riwayat Harga Terbaru</h2>
                  <p className="text-[10px] text-tx-3 mt-1 uppercase tracking-widest font-bold">10 Data Terakhir</p>
                </div>
                <div className="flex h-8 px-3 items-center rounded-lg bg-emerald-500/10 border border-emerald-500/20 text-[10px] font-black text-emerald-400 uppercase tracking-widest">
                  🔴 Live Database
                </div>
              </div>
              {isLoading ? (
                <div className="space-y-2">
                  {Array.from({ length: 5 }).map((_, i) => <Skeleton key={i} className="h-10 w-full bg-border-subtle/50 rounded" />)}
                </div>
              ) : (
                <div className="overflow-x-auto">
                  <span className="text-xs md:text-sm font-semibold text-tx-1" suppressHydrationWarning>
                    {TODAY}
                  </span>
                  <table className="w-full text-sm min-w-[480px]">
                    <thead>
                      <tr className="border-b border-border-subtle text-[10px] text-tx-3 font-black uppercase tracking-widest">
                        <th className="text-left pb-3">Tanggal</th>
                        <th className="text-left pb-3">Wilayah</th>
                        <th className="text-right pb-3">Harga Beli</th>
                        <th className="text-right pb-3">Harga Jual</th>
                        <th className="text-right pb-3">Margin</th>
                      </tr>
                    </thead>
                    <tbody>
                      {tableRows.map((row, i) => (
                        <tr key={row.price_date} className="border-b border-border-subtle last:border-0 hover:bg-white/[0.02] dark:hover:bg-white/[0.01] transition-colors">
                          <td className="py-3 text-tx-1 font-bold">
                            <div className="flex items-center gap-2">
                              {i === 0 && <span className="inline-block h-1.5 w-1.5 rounded-full bg-emerald-400 shrink-0" />}
                              {formatShortDate(row.price_date)}
                              {row.price_date === TODAY && <span className="text-[9px] text-emerald-600 dark:text-brand-500 font-black uppercase">Hari ini</span>}
                            </div>
                          </td>
                          <td className="py-3 text-tx-2 text-xs font-medium capitalize">{row.region ?? 'Nasional'}</td>
                          <td className="py-3 text-right text-tx-1 tabular-nums font-bold">{formatIDR(row.avg_buy_price)}</td>
                          <td className="py-3 text-right text-tx-1 tabular-nums font-bold">{formatIDR(row.avg_sell_price)}</td>
                          <td className="py-3 text-right tabular-nums">
                            <span className={cn("font-black text-sm", row.broker_margin > 0 ? "text-emerald-600 dark:text-brand-500" : "text-tx-3")}>
                              {row.broker_margin > 0 ? '+' : ''}{formatIDR(row.broker_margin)}
                            </span>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
            </CardContent>
          </Card>
        </motion.section>

        {/* ── USP: WHY OUR DATA IS DIFFERENT ── */}
        <motion.section initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.4, delay: 0.35 }}>
          <div className="text-center mb-10">
            <p className="text-[10px] font-black text-emerald-400 uppercase tracking-[0.2em] mb-2">Keunggulan Data</p>
            <h2 className="text-2xl md:text-3xl font-black text-tx-1 uppercase tracking-tight">Mengapa Data Kami Berbeda?</h2>
            <p className="text-sm text-tx-3 mt-2 max-w-lg mx-auto">
              Bukan sekedar scraper. TernakOS mengumpulkan data transaksi nyata dari broker aktif di seluruh Indonesia.
            </p>
          </div>
          <div className="grid md:grid-cols-3 gap-6">
            {[
              {
                icon: <Database size={20} className="text-emerald-400" />,
                title: 'Data Transaksi Nyata',
                body: 'Harga beli dan jual pada chart berasal dari transaksi nyata broker yang menggunakan platform ini, bukan estimasi atau perhitungan manual. Setiap transaksi masuk to rata-rata provinsi secara real-time.',
                badge: 'Eksklusif'
              },
              {
                icon: <Activity size={20} className="text-emerald-400" />,
                title: 'Perbandingan Multi-Sumber',
                body: 'Kami bandingkan harga scraper Chickin.id vs rata-rata transaksi broker platform. Ini membantu Anda tahu apakah posisi beli Anda sudah kompetitif atau belum sebelum eksekusi transaksi.',
                badge: 'Unik'
              },
              {
                icon: <Layers size={20} className="text-emerald-400" />,
                title: 'Agregasi Per Provinsi',
                body: 'Data difilter berdasarkan provinsi kandang penjual dan provinsi RPA pembeli. Semakin banyak broker bergabung dari satu provinsi, semakin representatif data yang tersedia.',
                badge: 'Akurat'
              },
            ].map(({ icon, title, body, badge }) => (
              <Card key={title} className="bg-bg-1 border border-border-subtle hover:border-emerald-500/20 transition-all duration-300 group rounded-[20px] shadow-sm">
                <CardContent className="p-6 space-y-4">
                  <div className="flex items-start justify-between">
                    <div className="p-2.5 rounded-xl bg-emerald-500/10 text-emerald-400 group-hover:bg-emerald-500/20 group-hover:scale-105 transition-all duration-300">
                      {icon}
                    </div>
                    <span className="text-[9px] font-black text-emerald-400 bg-emerald-500/10 border border-emerald-500/20 px-2 py-0.5 rounded-full uppercase tracking-widest">{badge}</span>
                  </div>
                  <h3 className="text-base font-black text-tx-1 uppercase tracking-tight">{title}</h3>
                  <p className="text-sm text-tx-3 leading-relaxed font-medium">{body}</p>
                </CardContent>
              </Card>
            ))}
          </div>
        </motion.section>

        {/* ── HOW IT WORKS: DATA FLOW ── */}
        <motion.section initial={{ opacity: 0, y: 16 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true }} transition={{ duration: 0.4, delay: 0.2 }}>
          <div className="bg-emerald-500/5 border border-emerald-500/10 rounded-[32px] p-8 md:p-12 relative overflow-hidden">
            <div className="absolute top-0 right-0 w-32 h-32 bg-emerald-500/10 blur-[80px] pointer-events-none" />

            <div className="text-center mb-12">
              <p className="text-[10px] font-black text-emerald-400 uppercase tracking-[0.2em] mb-2">Proses Data</p>
              <h2 className="text-2xl md:text-3xl font-black text-tx-1 uppercase tracking-tight">Bagaimana Kami Mendapatkan Harga?</h2>
            </div>

            <div className="grid md:grid-cols-3 gap-8 relative">
              {[
                {
                  step: '01',
                  title: 'Broker Input Transaksi',
                  desc: 'Broker aktif mencatat pembelian dari kandang dan penjualan ke RPA secara real-time di platform TernakOS.'
                },
                {
                  step: '02',
                  title: 'Agregasi Anonim',
                  desc: 'Sistem merata-ratakan harga per provinsi secara otomatis. Identitas broker tetap terjaga 100% anonym.'
                },
                {
                  step: '03',
                  title: 'Visualisasi Tren',
                  desc: 'Hasil agregasi ditampilkan pada grafik hibrida sebagai referensi harga beli dan jual nyata di pasar.'
                }
              ].map((s, i) => (
                <div key={i} className="relative z-10 text-center space-y-4">
                  <div className="w-12 h-12 rounded-2xl bg-[#0C1319] border border-white/10 flex items-center justify-center mx-auto text-emerald-400 font-black text-lg shadow-xl">
                    {s.step}
                  </div>
                  <h3 className="text-sm font-black text-tx-1 uppercase tracking-tight">{s.title}</h3>
                  <p className="text-xs text-tx-3 leading-relaxed max-w-[200px] mx-auto font-medium">{s.desc}</p>
                </div>
              ))}
            </div>
          </div>
        </motion.section>

        {/* ── COMPARISON TABLE ── */}
        <motion.section initial={{ opacity: 0, y: 16 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true }} transition={{ duration: 0.4, delay: 0.3 }}>
          <div className="text-center mb-10">
            <p className="text-[10px] font-black text-emerald-400 uppercase tracking-[0.2em] mb-2">Transparansi</p>
            <h2 className="text-2xl md:text-3xl font-black text-tx-1 uppercase tracking-tight">Perbandingan Data</h2>
            <span className="text-[10px] md:text-xs font-medium text-tx-3 ml-2" suppressHydrationWarning>
              Update: {todayFmt}
            </span>
          </div>
          <Card className="bg-bg-1 border border-border-subtle overflow-hidden rounded-[24px]">
            <CardContent className="p-0">
              <div className="overflow-x-auto">
                <table className="w-full text-sm">
                  <thead>
                    <tr className="bg-bg-2/50 text-[10px] text-tx-3 font-black uppercase tracking-widest border-b border-border-subtle">
                      <th className="px-6 py-4 text-left">Fitur Data Pasar</th>
                      <th className="px-6 py-4 text-center bg-emerald-500/10 text-emerald-400">TernakOS</th>
                      <th className="px-6 py-4 text-center">Chickin.id</th>
                      <th className="px-6 py-4 text-center">Portal Lain</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-border-subtle/50">
                    {[
                      { f: 'Berdasar Transaksi Nyata', t: true, c: false, p: false },
                      { f: 'Harga Beli (Farm Gate)', t: true, c: true, p: true },
                      { f: 'Harga Jual (Pasar/RPA)', t: true, c: false, p: false },
                      { f: 'Update Otomatis Harian', t: true, c: true, p: false },
                      { f: 'Analisis Margin Broker', t: true, c: false, p: false },
                      { f: 'Privasi Data Terjamin', t: true, c: true, p: true },
                    ].map((row, i) => (
                      <tr key={i} className="hover:bg-bg-2/30 transition-colors">
                        <td className="px-6 py-4 font-medium text-tx-1/80">{row.f}</td>
                        <td className="px-6 py-4 text-center bg-emerald-500/5">
                          {row.t ? <Check className="mx-auto text-emerald-400" size={18} /> : <div className="mx-auto w-4 h-0.5 bg-border-strong dark:bg-white/10 rounded" />}
                        </td>
                        <td className="px-6 py-4 text-center">
                          {row.c ? <Check className="mx-auto text-tx-3" size={16} /> : <div className="mx-auto w-4 h-0.5 bg-border-strong dark:bg-white/10 rounded" />}
                        </td>
                        <td className="px-6 py-4 text-center">
                          {row.p ? <Check className="mx-auto text-tx-3" size={16} /> : <div className="mx-auto w-4 h-0.5 bg-border-strong dark:bg-white/10 rounded" />}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </CardContent>
          </Card>
        </motion.section>

        {/* ── CTA ── */}
        <motion.section initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.4, delay: 0.4 }}>
          <Card className="bg-bg-1 border border-border-subtle overflow-hidden relative group hover:border-emerald-500/30 transition-all duration-500 rounded-[28px] shadow-sm">
            <div className="absolute inset-0 bg-gradient-to-br from-emerald-500/10 via-transparent to-indigo-500/5 pointer-events-none opacity-50 group-hover:opacity-100 transition-opacity" />
            <div className="absolute top-0 right-0 w-[400px] h-[400px] bg-[radial-gradient(circle,rgba(2, 26, 2,0.07)_0%,transparent_70%)] pointer-events-none" />
            <CardContent className="p-8 md:p-12 relative">
              <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-8 md:gap-12">
                <div className="space-y-4 max-w-2xl">
                  <div className="flex items-center gap-2">
                    <div className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" />
                    <span className="text-[10px] text-emerald-400 font-black uppercase tracking-widest">Bergabung & Berkontribusi</span>
                  </div>
                  <h2 className="text-2xl md:text-4xl font-black text-tx-1 leading-tight uppercase tracking-tight">
                    Kontribusikan data Anda,<br className="hidden md:block" />
                    <span className="text-emerald-500">dapatkan insight lebih akurat</span>
                  </h2>
                  <p className="text-sm md:text-base text-tx-2 leading-relaxed font-medium">
                    Setiap broker yang bergabung memperkaya data rata-rata provinsi.
                    Semakin banyak broker aktif, semakin akurat harga pasar yang ditampilkan untuk kepentingan semua pelaku bisnis ayam broiler.
                  </p>
                  <div className="flex flex-wrap gap-4 pt-2">
                    {[
                      'Catat transaksi beli & jual',
                      'Pantau piutang RPA otomatis',
                      'Lihat tren harga per provinsi',
                      'Bandingkan vs harga pasar',
                    ].map(f => (
                      <div key={f} className="flex items-center gap-2 text-[11px] text-tx-3 font-medium">
                        <Check size={12} className="text-emerald-400" />
                        {f}
                      </div>
                    ))}
                  </div>
                </div>
                <div className="flex flex-col sm:flex-row lg:flex-col gap-4 shrink-0">
                  <Button
                    className="h-14 px-8 bg-emerald-500 hover:bg-emerald-600 text-white text-[13px] font-black uppercase tracking-widest rounded-2xl shadow-xl shadow-emerald-500/20 active:scale-95 transition-all"
                    asChild
                  >
                    <Link to="/register">
                      Mulai Gratis <ArrowRight size={16} className="ml-2" />
                    </Link>
                  </Button>
                  <Button
                    variant="outline"
                    className="h-14 px-8 border border-border-subtle dark:border-white/10 bg-bg-2 dark:bg-white/5 text-tx-1 hover:bg-bg-3 dark:hover:bg-white/10 hover:border-border-strong dark:hover:border-white/20 text-[13px] font-black uppercase tracking-widest rounded-2xl active:scale-95 transition-all"
                    asChild
                  >
                    <a href="https://wa.me/628123456789?text=Halo%2C%20saya%20tertarik%20coba%20TernakOS" target="_blank" rel="noopener noreferrer">
                      Hubungi via WA
                    </a>
                  </Button>
                </div>
              </div>
            </CardContent>
          </Card>
        </motion.section>

      </main>

      <Footer />
    </div>
  )
}
