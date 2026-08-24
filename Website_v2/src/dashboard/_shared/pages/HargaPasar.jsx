import React, { useState, useEffect, useMemo } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { 
  TrendingUp, TrendingDown, Clock, Info, 
  Zap, Calendar, ChevronDown, ChevronUp,
  Save, AlertCircle, BarChart3, History
} from 'lucide-react'
import { 
  AreaChart, Area, XAxis, YAxis, CartesianGrid, 
  Tooltip, ResponsiveContainer, Legend 
} from 'recharts'
import { supabase } from '@/lib/supabase'
import { useAuth } from '@/lib/hooks/useAuth'
import { useMediaQuery } from '@/lib/hooks/useMediaQuery'
import { formatIDR, formatDate, safeNum } from '@/lib/format'
import { Button } from '@/components/ui/button'
import { Card, CardContent } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Skeleton } from '@/components/ui/skeleton'
import { ScrollArea, ScrollBar } from '@/components/ui/scroll-area'
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from '@/components/ui/collapsible'
import { toast } from 'sonner'
import { useQuery, useQueryClient } from '@tanstack/react-query'
import { cn } from '@/lib/utils'
import { 
  Tooltip as UITooltip, 
  TooltipContent, 
  TooltipProvider, 
  TooltipTrigger 
} from '@/components/ui/tooltip'
import { PROVINCES } from '@/lib/constants/regions'
import {
  Popover, PopoverContent, PopoverTrigger
} from '@/components/ui/popover'
import {
  Command, CommandEmpty, CommandGroup,
  CommandInput, CommandItem, CommandSeparator, CommandList
} from '@/components/ui/command'
import { Check, ChevronsUpDown } from 'lucide-react'
import { logSupabaseError } from '@/lib/logger/supabaseLogger'
import { logError } from '@/lib/logger/errorLogger'

export default function HargaPasar() {
  const { profile, tenant } = useAuth()
  const _isViewOnly = profile?.role === 'view_only'
  const canWrite = profile?.role === 'owner' || profile?.role === 'staff'
  const isDesktop = useMediaQuery('(min-width: 1024px)')
  const [isManualOpen, setIsManualOpen] = useState(false)
  const queryClient = useQueryClient()

  // Today date WIB
  const today = new Date(new Date().getTime() + (7 * 60 * 60 * 1000)).toISOString().split('T')[0]

  // Fetch Market Prices (14 days)
  const { data: prices, isLoading } = useQuery({
    queryKey: ['market-prices'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('market_prices')
        .select('*')
        .or('is_deleted.eq.false,is_deleted.is.null')
        .neq('source', 'arboge_scraper')
        .order('price_date', { ascending: false })
        .order('region', { ascending: false })
        .order('source', { ascending: false })
        .limit(50)
      if (error) throw error
      
      // Clean data: map scraper data to avg_buy_price/avg_sell_price if null, and safe cast to numbers
      const cleanedData = (data || []).map(row => ({
        ...row,
        avg_buy_price: safeNum(row.avg_buy_price) || safeNum(row.farm_gate_price),
        avg_sell_price: safeNum(row.avg_sell_price) || safeNum(row.buyer_price)
      }))

      // Filter out buggy records where Jual < Beli (suspicious data)
      return cleanedData.filter(x => x.avg_sell_price >= x.avg_buy_price)
    }
  })

  // Realtime Subscription
  useEffect(() => {
    const channel = supabase
      .channel('market-prices-live')
      .on('postgres_changes', {
        event: '*',
        schema: 'public',
        table: 'market_prices'
      }, () => {
        queryClient.invalidateQueries({ queryKey: ['market-prices'] })
        toast.info('📊 Harga pasar baru tersedia', {
            icon: '💡'
        })
      })
      .subscribe()
    
    return () => supabase.removeChannel(channel)
  }, [queryClient])

  // LIVE Data from today's transactions
  const { data: liveData } = useQuery({
    queryKey: ['live-market-price', tenant?.id, today],
    queryFn: async () => {
      const { data: sales } = await supabase.from('sales')
        .select('price_per_kg')
        .eq('tenant_id', tenant.id)
        .eq('transaction_date', today)
        .eq('is_deleted', false)
        .gt('price_per_kg', 0)
      
      const { data: purchases } = await supabase.from('purchases')
        .select('price_per_kg')
        .eq('tenant_id', tenant.id)
        .eq('transaction_date', today)
        .eq('is_deleted', false)
        .gt('price_per_kg', 0)

      const MIN_REALISTIC_PRICE = 15000
      const s = (sales || []).filter(x => Number(x.price_per_kg) >= MIN_REALISTIC_PRICE)
      const p = (purchases || []).filter(x => Number(x.price_per_kg) >= MIN_REALISTIC_PRICE)

      const avgSell = s.length > 0 ? s.reduce((acc, x) => acc + (Number(x.price_per_kg) || 0), 0) / s.length : 0
      const avgBuy = p.length > 0 ? p.reduce((acc, x) => acc + (Number(x.price_per_kg) || 0), 0) / p.length : 0

      return {
        avg_sell_price: avgSell,
        avg_buy_price: avgBuy,
        transaction_count: s.length + p.length
      }
    },
    enabled: !!tenant?.id
  })

  // Arboge.com reference & realization prices (merged reference line)
  const { data: arbogeData } = useQuery({
    queryKey: ['arboge-dashboard-prices'],
    queryFn: async () => {
      const { data } = await supabase
        .from('market_prices')
        .select('price_date, farm_gate_price, source')
        .eq('is_deleted', false)
        .in('source', ['arboge_referensi', 'arboge_realisasi'])
        .order('price_date', { ascending: false })
        .limit(60) // Fetch more to cover overlaps
      
      return (data || []).reduce((acc, r) => {
        // Source priority: realisasi > referensi
        // If we already added a referensi but find a realisasi for the same date, overwrite it.
        const existing = acc[r.price_date]
        if (!existing || r.source === 'arboge_realisasi') {
          acc[r.price_date] = r.farm_gate_price
        }
        return acc
      }, {})
    },
    staleTime: 60 * 1000,
  })

  const todayPrice = useMemo(() => {
    // Priority 1: Live transactions today (filtered by is_deleted=false)
    if (liveData && liveData.transaction_count > 0) {
        return {
            price_date: today,
            avg_buy_price: liveData.avg_buy_price,
            avg_sell_price: liveData.avg_sell_price,
            transaction_count: liveData.transaction_count
        }
    }
    
    // Priority 2: Market prices table (usually manual inputs or global stats)
    const marketRecord = prices?.find(p => p.price_date === today)
    if (marketRecord) return marketRecord

    // Fallback: If live data exists but transaction_count is 0, show null today (will show as "-" in UI)
    if (liveData && liveData.transaction_count === 0) {
        return null
    }

    return null
  }, [liveData, prices, today])

  const yesterdayPrice = useMemo(() => {
    return prices?.find(p => p.price_date < today) || null
  }, [prices, today])

  const buyDiff = todayPrice && yesterdayPrice ? todayPrice.avg_buy_price - yesterdayPrice.avg_buy_price : 0
  const sellDiff = todayPrice && yesterdayPrice ? todayPrice.avg_sell_price - yesterdayPrice.avg_sell_price : 0
  
  const margin = todayPrice ? todayPrice.avg_sell_price - todayPrice.avg_buy_price : 0

  const chartData = useMemo(() => {
    if (!prices || prices.length === 0) return []
    // Filter to last 14 unique dates, then sort ascending for chart
    const uniqueDates = Array.from(new Set(prices.map(p => p.price_date)))
        .sort()
        .slice(-14)
    
    return uniqueDates.map(date => {
        // Find best source for this date (priority: manual > auto_scraper > transaction)
        const datePrices = prices.filter(p => p.price_date === date)
        const p = datePrices[0] // Already sorted by source DESC in query
        return {
            date: formatDate(date, 'dd MMM'),
            beli: p.avg_buy_price,
            jual: p.avg_sell_price,
            margin: p.avg_sell_price - p.avg_buy_price,
            arboge: arbogeData?.[date] || null
        }
    })
  }, [prices, arbogeData])

  return (
    <TooltipProvider>
      <motion.div 
        initial={{ opacity: 0, y: 12 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.3, ease: [0.25, 0.46, 0.45, 0.94] }}
        className={cn("bg-[#06090F] min-h-screen pb-24", isDesktop && "pb-10")}
    >
      {/* TopBar */}
      {!isDesktop && (
        <header className="px-5 pt-8 pb-4 border-b border-white/5 sticky top-0 bg-[#06090F]/80 backdrop-blur-md z-30 flex justify-between items-center">
            <div>
                <h1 className="font-display text-xl font-black text-white tracking-tight leading-none uppercase">Harga Pasar</h1>
                <p className="text-[11px] font-bold text-[#4B6478] uppercase mt-1">Broiler {todayPrice?.region || 'Nasional'}</p>
            </div>
            <div className="flex items-center gap-2 px-3 py-1.5 bg-emerald-500/10 rounded-full border border-emerald-500/20">
                <div className="w-2 h-2 bg-emerald-500 rounded-full animate-pulse" />
                <span className="text-[10px] font-black text-emerald-400 uppercase tracking-widest">Live</span>
            </div>
        </header>
      )}

      {/* Main Content */}
      <div className="space-y-6">
        
        {/* HARGA HARI INI */}
        <section className="px-5 pt-4">
            {isLoading ? (
                <Skeleton className="h-48 w-full rounded-[20px] bg-secondary/10" />
            ) : todayPrice ? (
                <Card className="bg-gradient-to-br from-[#0C1319] to-[#111C24] border-emerald-500/20 rounded-[24px] p-5 shadow-2xl relative overflow-hidden group">
                     {/* Decorative background pulse */}
                    <div className="absolute -top-24 -right-24 w-48 h-48 bg-emerald-500/5 blur-[60px] rounded-full group-hover:bg-emerald-500/10 transition-colors duration-700" />
                    
                    <div className="flex justify-between items-center mb-6 relative z-10">
                        <div className="flex flex-col gap-1">
                            <span className="text-[11px] font-black text-[#4B6478] uppercase tracking-[0.2em]">Harga Broiler Hari Ini</span>
                            <div className="flex items-center gap-2">
                                <span className="text-[11px] font-bold text-white/40">{formatDate(todayPrice.price_date)} • {todayPrice.region}</span>
                                {todayPrice.source === 'auto_scraper' ? (
                                    <UITooltip>
                                        <TooltipTrigger asChild>
                                            <Badge variant="outline" className="bg-white/5 border-white/10 text-[#4B6478] text-[9px] font-black px-1.5 py-0 rounded-md h-4 flex items-center gap-1 cursor-help">
                                                CHICKIN
                                                <Info size={10} />
                                            </Badge>
                                        </TooltipTrigger>
                                        <TooltipContent side="right" className="bg-[#111C24] border-white/10 text-[10px] font-bold text-white/60">
                                            Referensi harga dari chickin.id
                                        </TooltipContent>
                                    </UITooltip>
                                ) : todayPrice.source === 'arboge_scraper' ? (
                                    <UITooltip>
                                        <TooltipTrigger asChild>
                                            <Badge variant="outline" className="bg-orange-500/10 border-orange-500/20 text-orange-400 text-[9px] font-black px-1.5 py-0 rounded-md h-4 flex items-center gap-1 cursor-help">
                                                ARBOGE
                                                <Info size={10} />
                                            </Badge>
                                        </TooltipTrigger>
                                        <TooltipContent side="right" className="bg-[#111C24] border-orange-500/20 text-[10px] font-bold text-orange-400">
                                            Realisasi harga dari arboge.com
                                        </TooltipContent>
                                    </UITooltip>
                                ) : todayPrice.source === 'manual' ? (
                                    <UITooltip>
                                        <TooltipTrigger asChild>
                                            <Badge variant="outline" className="bg-emerald-500/10 border-emerald-500/20 text-emerald-400 text-[9px] font-black px-1.5 py-0 rounded-md h-4 flex items-center gap-1 cursor-help">
                                                MANUAL
                                            </Badge>
                                        </TooltipTrigger>
                                        <TooltipContent side="right" className="bg-[#111C24] border-emerald-500/20 text-[10px] font-bold text-emerald-400">
                                            Diinput oleh broker
                                        </TooltipContent>
                                    </UITooltip>
                                ) : null}
                            </div>
                        </div>
                    </div>

                    <div className="grid grid-cols-2 gap-4 relative z-10">
                        <div className="space-y-1">
                            <Label className="text-[10px] font-black text-[#4B6478] uppercase tracking-widest">Harga Beli</Label>
                            <div className="flex flex-col">
                                <span className="font-display text-[26px] font-black text-white leading-none tracking-tighter">
                                    {todayPrice.source === 'auto_scraper' && '~'}
                                    {todayPrice.avg_buy_price > 0 ? formatIDR(todayPrice.avg_buy_price) : '-'}
                                </span>
                                <ChangeIndicator diff={buyDiff} />
                            </div>
                        </div>

                        <div className="space-y-1 text-right">
                            <Label className="text-[10px] font-black text-[#4B6478] uppercase tracking-widest">Harga Jual</Label>
                            <div className="flex flex-col items-end">
                                <span className="font-display text-[26px] font-black text-emerald-400 leading-none tracking-tighter">
                                    {(todayPrice.source === 'auto_scraper' || todayPrice.source === 'arboge_scraper') && '~'}
                                    {todayPrice.avg_sell_price > 0 ? formatIDR(todayPrice.avg_sell_price) : '-'}
                                </span>
                                <ChangeIndicator diff={sellDiff} />
                            </div>
                        </div>
                    </div>

                    <div className="mt-8 pt-5 border-t border-white/5 flex flex-col gap-1 relative z-10">
                         <p className={cn(
                            "font-display text-[16px] font-bold tracking-tight",
                            margin > 2000 ? "text-emerald-400" : margin >= 1000 ? "text-amber-500" : "text-red-400"
                         )}>
                            Margin Rata-rata: {margin !== 0 ? `${formatIDR(margin)}/kg` : '-'}
                         </p>
                         {todayPrice.source === 'auto_scraper' ? (
                            <p className="text-[11px] font-bold text-[#4B6478]">estimasi +Rp 2.500 margin dari chickin.id</p>
                         ) : todayPrice.source === 'arboge_scraper' ? (
                            <p className="text-[11px] font-bold text-[#4B6478]">estimasi +Rp 2.500 margin (realisasi arboge.com)</p>
                         ) : (
                            <p className="text-[11px] font-bold text-[#4B6478]">dari {todayPrice.transaction_count} transaksi hari ini</p>
                         )}
                    </div>
                </Card>
            ) : (
                <EmptyStateSmall icon={History} title="Belum ada data hari ini" desc="Harga akan diperbarui otomatis saat ada transaksi." />
            )}
        </section>

        {/* INPUT HARGA MANUAL */}
        {canWrite && (
          <section className="px-5">
              <Collapsible open={isManualOpen} onOpenChange={setIsManualOpen} className="bg-[#111C24] border border-white/5 rounded-2xl overflow-hidden">
                  <CollapsibleTrigger asChild>
                      <button className="w-full flex items-center justify-between p-4 hover:bg-secondary/5 transition-colors">
                          <div className="flex items-center gap-2.5">
                              <Zap size={16} className="text-amber-500" />
                              <span className="text-[11px] font-black text-white/60 uppercase tracking_widest">Update Harga Manual</span>
                          </div>
                          {isManualOpen ? <ChevronUp size={14} className="text-white/20" /> : <ChevronDown size={14} className="text-white/20" />}
                      </button>
                  </CollapsibleTrigger>
                  <CollapsibleContent className="p-4 pt-0">
                      <ManualPriceForm 
                        tenant={tenant}
                        onSuccess={() => {
                          setIsManualOpen(false)
                          queryClient.invalidateQueries({ queryKey: ['market-prices'] })
                        }} 
                      />
                  </CollapsibleContent>
              </Collapsible>
          </section>
        )}

        {/* GRAFIK 14 HARI */}
        <section className="px-5 space-y-4">
            <h3 className="text-[11px] font-black text-[#4B6478] uppercase tracking-[0.2em] px-1">Trend 14 Hari Terakhir</h3>
            <div className="h-[220px] w-full bg-[#111C24]/50 rounded-[28px] border border-white/5 p-4 pt-8">
                <ResponsiveContainer width="100%" height="100%">
                    <AreaChart data={chartData} margin={{ top: 0, right: 0, left: -20, bottom: 0 }}>
                        <defs>
                            <linearGradient id="colorBeli" x1="0" y1="0" x2="0" y2="1">
                                <stop offset="5%" stopColor="#4B6478" stopOpacity={0.1}/>
                                <stop offset="95%" stopColor="#4B6478" stopOpacity={0}/>
                            </linearGradient>
                            <linearGradient id="colorJual" x1="0" y1="0" x2="0" y2="1">
                                <stop offset="5%" stopColor="#10B981" stopOpacity={0.1}/>
                                <stop offset="95%" stopColor="#10B981" stopOpacity={0}/>
                            </linearGradient>
                        </defs>
                        <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.03)" vertical={false} />
                        <XAxis 
                            dataKey="date" 
                            axisLine={false} 
                            tickLine={false} 
                            tick={{ fontSize: 9, fill: '#4B6478', fontWeight: 800 }} 
                            dy={10}
                        />
                        <YAxis 
                            axisLine={false} 
                            tickLine={false} 
                            tick={{ fontSize: 9, fill: '#4B6478', fontWeight: 800 }}
                            domain={['dataMin - 1000', 'dataMax + 1000']}
                        />
                        <Tooltip content={<CustomTooltip />} cursor={{ stroke: 'rgba(255,255,255,0.1)', strokeWidth: 1 }} />
                        <Area 
                            type="monotone" dataKey="beli" 
                            stroke="#4B6478" strokeWidth={2} 
                            fillOpacity={1} fill="url(#colorBeli)" 
                        />
                        <Area 
                            type="monotone" dataKey="jual" 
                            stroke="#10B981" strokeWidth={2} 
                            fillOpacity={1} fill="url(#colorJual)" 
                        />
                        <Area 
                            type="monotone" dataKey="arboge"
                            stroke="#F97316" strokeWidth={2} strokeDasharray="4 4"
                            fill="transparent" connectNulls dot={false}
                        />
                    </AreaChart>
                </ResponsiveContainer>
                <div className="flex justify-center gap-6 mt-2 flex-wrap">
                    <LegendItem color="#4B6478" label="Beli" />
                    <LegendItem color="#10B981" label="Jual" />
                    <LegendItem color="#F97316" label="Arboge (Ref)" dashed />
                </div>
            </div>
        </section>

        {/* TABEL 7 HARI */}
        <section className="px-5 pb-10">
            <h3 className="text-[11px] font-black text-[#4B6478] uppercase tracking-[0.2em] px-1 mb-4">Riwayat Harga</h3>
            <div className="bg-[#111C24] border border-white/5 rounded-2xl overflow-hidden shadow-xl">
                <ScrollArea className="w-full">
                    <table className="w-full border-collapse">
                        <thead>
                            <tr className="border-b border-white/5 bg-secondary/5">
                                <th className="text-left py-3 px-4 text-[9px] font-black text-[#4B6478] uppercase tracking-widest">Tanggal</th>
                                <th className="text-right py-3 px-4 text-[9px] font-black text-[#4B6478] uppercase tracking-widest">Beli</th>
                                <th className="text-right py-3 px-4 text-[9px] font-black text-[#4B6478] uppercase tracking-widest">Jual</th>
                                <th className="text-right py-3 px-4 text-[9px] font-black text-[#4B6478] uppercase tracking-widest">Margin</th>
                                <th className="text-right py-3 px-4 text-[9px] font-black text-[#4B6478] uppercase tracking-widest">Tx</th>
                            </tr>
                        </thead>
                        <tbody>
                            {isLoading ? (
                                Array(5).fill(0).map((_, i) => (
                                    <tr key={i} className="border-b border-white/5">
                                        <td colSpan={5} className="p-4"><Skeleton className="h-4 w-full bg-secondary/10" /></td>
                                    </tr>
                                ))
                            ) : prices?.map((p, i) => {
                                const m = p.avg_sell_price - p.avg_buy_price
                                const isToday = i === 0
                                return (
                                    <tr key={p.id} className={cn(
                                        "border-b border-white/5 transition-colors hover:bg-secondary/5",
                                        isToday && "bg-emerald-500/[0.04]"
                                    )}>
                                        <td className="py-3 px-4 text-[11px] font-bold text-slate-300">{formatDate(p.price_date, 'dd/MM/yy')}</td>
                                        <td className="py-3 px-4 text-right text-[11px] font-bold text-[#94A3B8] tabular-nums">{formatIDR(safeNum(p.avg_buy_price)).replace('Rp ', '')}</td>
                                        <td className="py-3 px-4 text-right text-[11px] font-black text-white tabular-nums">{formatIDR(safeNum(p.avg_sell_price)).replace('Rp ', '')}</td>
                                        <td className={cn(
                                            "py-3 px-4 text-right text-[11px] font-bold tabular-nums",
                                            m > 2000 ? "text-emerald-400" : m >= 1000 ? "text-amber-500" : "text-red-400"
                                        )}>
                                            {formatIDR(safeNum(m)).replace('Rp ', '')}
                                        </td>
                                        <td className="py-3 px-4 text-right text-[10px] font-black text-[#4B6478]">
                                            {isToday ? (liveData?.transaction_count ?? p.transaction_count) : p.transaction_count}
                                        </td>
                                    </tr>
                                )
                            })}
                        </tbody>
                    </table>
                    <ScrollBar orientation="horizontal" />
                </ScrollArea>
            </div>
        </section>

      </div>
    </motion.div>
    </TooltipProvider>
  )
}

function ChangeIndicator({ diff }) {
    if (diff === 0) return <span className="text-[10px] font-bold text-[#4B6478] leading-none mt-1">Stabil</span>
    return (
        <span className={cn(
            "text-[10px] font-black leading-none mt-1 flex items-center gap-0.5",
            diff > 0 ? "text-[#10B981]" : "text-[#F87171]"
        )}>
            {diff > 0 ? '▲' : '▼'}{safeNum(Math.abs(diff)).toLocaleString('id-ID')}
        </span>
    )
}

function LegendItem({ color, label, dashed }) {
    return (
        <div className="flex items-center gap-2">
            {dashed
              ? <div className="w-4 h-0 border-t-2 border-dashed" style={{ borderColor: color }} />
              : <div className="w-2 h-2 rounded-full" style={{ background: color }} />}
            <span className="text-[9px] font-black text-[#4B6478] uppercase tracking-widest">{label}</span>
        </div>
    )
}

function CustomTooltip({ active, payload }) {
    if (active && payload && payload.length) {
        const data = payload[0].payload
        const beli = payload.find(p => p.dataKey === 'beli')?.value
        const jual = payload.find(p => p.dataKey === 'jual')?.value
        const arboge = payload.find(p => p.dataKey === 'arboge')?.value
        const margin = jual && beli ? jual - beli : 0
        return (
            <div className="bg-[#111C24] border border-white/10 rounded-xl p-3 shadow-2xl space-y-2 min-w-[140px]">
                <p className="text-[10px] font-black text-[#4B6478] uppercase tracking-widest border-b border-white/5 pb-1.5 mb-1.5">{data.date}</p>
                <div className="space-y-1">
                    <div className="flex justify-between items-center gap-4">
                        <span className="text-[9px] font-black text-[#4B6478] uppercase tracking-widest">Beli</span>
                        <span className="text-[11px] font-bold text-[#F1F5F9] tabular-nums">{safeNum(beli).toLocaleString('id-ID')}</span>
                    </div>
                    <div className="flex justify-between items-center gap-4">
                        <span className="text-[9px] font-black text-emerald-400 uppercase tracking-widest">Jual</span>
                        <span className="text-[11px] font-bold text-white tabular-nums">{safeNum(jual).toLocaleString('id-ID')}</span>
                    </div>
                    {arboge && (
                      <div className="flex justify-between items-center gap-4">
                          <span className="text-[9px] font-black text-orange-400 uppercase tracking-widest">Arboge</span>
                          <span className="text-[11px] font-bold text-orange-400 tabular-nums">{safeNum(arboge).toLocaleString('id-ID')}</span>
                      </div>
                    )}
                    <div className="flex justify-between items-center gap-4 pt-1.5 mt-1.5 border-t border-white/5">
                        <span className="text-[9px] font-black text-amber-500 uppercase tracking-widest">Margin</span>
                        <span className="text-[11px] font-black text-amber-500 tabular-nums">{safeNum(margin).toLocaleString('id-ID')}</span>
                    </div>
                </div>
            </div>
        )
    }
    return null
}

function ManualPriceForm({ tenant, onSuccess }) {
    const [loading, setLoading] = useState(false)
    const [formData, setFormData] = useState({ beli: '', jual: '' })
    const [region, setRegion] = useState(tenant?.area_operasi || '')
    const [openRegion, setRegionOpen] = useState(false)
    
    const handleSave = async (e) => {
        e.preventDefault()
        if (!formData.beli || !formData.jual) return toast.error('Harap isi harga beli dan jual')
        if (!region) return toast.error('Harap pilih wilayah/provinsi')
        
        setLoading(true)
        let logged = false
        try {
            const todayString = new Date().toISOString().split('T')[0]
            const { error } = await supabase
                .from('market_prices')
                .upsert({
                    price_date: todayString,
                    chicken_type: 'broiler',
                    region: region,
                    avg_buy_price: Number(formData.beli),
                    avg_sell_price: Number(formData.jual),
                    farm_gate_price: Number(formData.beli),
                    buyer_price: Number(formData.jual),
                    source: 'manual',
                    is_deleted: false
                }, { onConflict: 'price_date, chicken_type, region' })
            
            if (error) {
                logSupabaseError(error, {
                    table: 'market_prices',
                    operation: 'upsert',
                    component: 'HargaPasar',
                    actionName: 'market.price.upsert',
                    metadata: {
                        region,
                        price_date: todayString,
                        chicken_type: 'broiler',
                        source: 'manual',
                        operation: 'upsert',
                    }
                })
                logged = true
                throw error
            }
            toast.success('Harga pasar diperbarui!')
            onSuccess()
        } catch (err) {
            if (!logged) {
                logError({
                    level: 'error',
                    source: 'frontend',
                    component: 'HargaPasar',
                    actionName: 'market.price.upsert',
                    error: err,
                    metadata: {
                        region,
                        price_date: new Date().toISOString().split('T')[0],
                        chicken_type: 'broiler',
                        source: 'manual',
                        operation: 'upsert',
                    }
                })
            }
            toast.error(err.message)
        } finally {
            setLoading(false)
        }
    }

    return (
        <form onSubmit={handleSave} className="space-y-4 pt-4">
            {/* Wilayah Selection */}
            <div className="space-y-1.5">
                <Label className="text-[10px] font-black text-[#4B6478] uppercase tracking-widest">Wilayah / Provinsi</Label>
                <Popover open={openRegion} onOpenChange={setRegionOpen}>
                    <PopoverTrigger asChild>
                        <Button
                            variant="outline"
                            role="combobox"
                            aria-expanded={openRegion}
                            className="w-full justify-between bg-black/20 border-white/5 h-10 font-bold"
                        >
                            {region
                                ? PROVINCES.find((p) => p.value === region)?.label
                                : "Pilih wilayah..."}
                            <ChevronsUpDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
                        </Button>
                    </PopoverTrigger>
                    <PopoverContent className="w-full p-0 bg-[#0C1319] border-white/10" align="start">
                        <Command className="bg-transparent">
                            <CommandInput placeholder="Cari provinsi..." className="h-9" />
                            <CommandList>
                                <CommandEmpty>Provinsi tidak ditemukan.</CommandEmpty>
                                <CommandGroup>
                                    {PROVINCES.map((p) => (
                                        <CommandItem
                                            key={p.value}
                                            value={p.value}
                                            onSelect={(currentValue) => {
                                                setRegion(currentValue)
                                                setRegionOpen(false)
                                            }}
                                            className="text-white hover:bg-white/5"
                                        >
                                            <Check
                                                className={cn(
                                                    "mr-2 h-4 w-4",
                                                    region === p.value ? "opacity-100" : "opacity-0"
                                                )}
                                            />
                                            {p.label}
                                        </CommandItem>
                                    ))}
                                </CommandGroup>
                            </CommandList>
                        </Command>
                    </PopoverContent>
                </Popover>
            </div>

            <div className="grid grid-cols-2 gap-3">
                <div className="space-y-1.5">
                    <Label className="text-[10px] font-black text-[#4B6478] uppercase tracking-widest">Harga Beli</Label>
                    <Input 
                        type="number" placeholder="Rp/kg"
                        value={formData.beli} 
                        onChange={e => setFormData({...formData, beli: e.target.value})}
                        className="bg-black/20 border-white/5 h-10 font-bold"
                    />
                </div>
                <div className="space-y-1.5">
                    <Label className="text-[10px] font-black text-[#4B6478] uppercase tracking-widest">Harga Jual</Label>
                    <Input 
                        type="number" placeholder="Rp/kg"
                        value={formData.jual} 
                        onChange={e => setFormData({...formData, jual: e.target.value})}
                        className="bg-black/20 border-white/5 h-10 font-bold"
                    />
                </div>
            </div>
            <Button type="submit" disabled={loading} className="w-full h-11 bg-emerald-500 hover:bg-emerald-600 text-white font-black uppercase text-xs tracking-widest rounded-xl border-none">
                {loading ? 'Menyimpan...' : 'Simpan Update'}
            </Button>
        </form>
    )
}

function EmptyStateSmall({ icon: Icon, title, desc }) {
    return (
        <div className="h-48 border border-dashed border-white/10 rounded-[24px] flex flex-col items-center justify-center p-6 text-center bg-secondary/5">
            <div className="w-10 h-10 rounded-full bg-secondary/10 flex items-center justify-center mb-3">
                <Icon size={18} className="text-[#4B6478]" />
            </div>
            <h4 className="text-[13px] font-black text-white/60 mb-1 uppercase tracking-tight">{title}</h4>
            <p className="text-[11px] font-bold text-[#4B6478] max-w-[200px] leading-relaxed">{desc}</p>
        </div>
    )
}
