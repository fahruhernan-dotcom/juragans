import { useQuery } from '@tanstack/react-query'
import { supabase } from '@/lib/supabase'
import { format, parseISO, eachDayOfInterval } from 'date-fns'
import { id as idLocale } from 'date-fns/locale/id'

/**
 * useMarketTrends
 *
 * Returns chart data with 3 data lines:
 *   - chickin   : farm_gate_price from Chickin.id scraper (market_prices table)
 *   - buyPrice  : avg purchase price across ALL brokers in province (RPC)
 *   - sellPrice : avg sell price across ALL brokers in province (RPC)
 *
 * Uses Supabase RPC (SECURITY DEFINER) to bypass RLS for cross-tenant aggregation.
 * Province is determined by: purchases → farms.province / sales → rpa_clients.province
 */
export function useMarketTrends(province = 'Jawa Tengah', startDate, endDate) {
  const isAll = province === 'Seluruh Indonesia'
  const normalizedRegion = isAll ? '%' : province

  return useQuery({
    queryKey: ['market-trends', normalizedRegion, startDate, endDate],
    queryFn: async () => {
      if (!startDate || !endDate) return []

      // ── 1. Chickin.id Scraper Reference ───────────────────────────────────
      // Still from market_prices (public, no tenant filtering needed)
      let scraperQ = supabase
        .from('market_prices')
        .select('price_date, farm_gate_price, price_delta')
        .eq('source', 'auto_scraper')
        .gte('price_date', startDate)
        .lte('price_date', endDate)
        .order('price_date', { ascending: true })
      if (!isAll) scraperQ = scraperQ.ilike('region', `%${normalizedRegion}%`)
      const { data: scraperData, error: scraperErr } = await scraperQ
      if (scraperErr) console.error('[useMarketTrends] scraper:', scraperErr.message)

      // ── 2. Platform-wide Buy/Sell Average (via RPC — bypasses RLS) ────────
      // Aggregates ALL brokers' purchases filtered by farms.province
      // and ALL brokers' sales filtered by rpa_clients.province
      const { data: rpcData, error: rpcErr } = await supabase.rpc(
        'get_province_price_trends',
        { p_province: normalizedRegion, p_start_date: startDate, p_end_date: endDate }
      )
      if (rpcErr) console.error('[useMarketTrends] rpc:', rpcErr.message)

      // ── Build lookup maps ─────────────────────────────────────────────────
      const scraperByDate = (scraperData || []).reduce((acc, r) => {
        acc[r.price_date] = r
        return acc
      }, {})
      const rpcByDate = (rpcData || []).reduce((acc, r) => {
        acc[r.price_date] = r
        return acc
      }, {})

      // ── Build chart array ─────────────────────────────────────────────────
      const interval = eachDayOfInterval({ start: parseISO(startDate), end: parseISO(endDate) })
      const todayStr = format(new Date(), 'yyyy-MM-dd')
      const isWeekly = interval.length <= 7

      return interval.map(d => {
        const dStr    = format(d, 'yyyy-MM-dd')
        const scraper = scraperByDate[dStr]
        const rpc     = rpcByDate[dStr]

        const chickin   = scraper?.farm_gate_price || null
        const buyPrice  = rpc?.avg_buy  ? Math.round(rpc.avg_buy)  : null
        const sellPrice = rpc?.avg_sell ? Math.round(rpc.avg_sell) : null

        // Positive spread = buying cheaper than Chickin reference (good for broker)
        const spread    = (buyPrice && chickin) ? chickin - buyPrice : null
        // Gross margin per kg across the platform
        const margin    = (buyPrice && sellPrice) ? sellPrice - buyPrice : null

        return {
          date:        dStr,
          displayDate: isWeekly
            ? format(d, 'EEE', { locale: idLocale }) // Sen, Sel, Rab…
            : format(d, 'd MMM'),                    // 7 Apr, 8 Apr…
          chickin,
          buyPrice,
          sellPrice,
          spread,
          margin,
          delta:    scraper?.price_delta || 0,
          isFuture: dStr > todayStr
        }
      })
    },
    enabled: !!province && !!startDate && !!endDate,
    staleTime: 1000 * 60 * 15
  })
}
