import React, { useState, useMemo, useEffect } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { MessageCircle, Plus, Search, X, ChevronDown, MapPin, Store, Clock } from 'lucide-react'
import { useNavigate } from 'react-router-dom'
import { useMarketListings } from '@/lib/hooks/useMarket'
import { formatDistanceToNow } from 'date-fns'
import { id as idLocale } from 'date-fns/locale/id'

import Navbar from '../components/Navbar'
import Footer from '../components/Footer'
import SEO from '../components/SEO'
import {
  Select,
  SelectContent,
  SelectGroup,
  SelectItem,
  SelectLabel,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"

// ─── Constants ────────────────────────────────────────────────────────────────

const LISTING_TYPES = [
  { value: 'all', label: 'Semua Kategori', emoji: '📋' },
  { value: 'stok_ayam', label: 'Jual Stok / Barang', emoji: '📦' },
  { value: 'penawaran_broker', label: 'Penawaran Broker', emoji: '🤝' },
  { value: 'permintaan_rpa', label: 'Permintaan / Dicari', emoji: '🔍' },
]

const COMMODITY_GROUPS = [
  {
    label: 'Unggas (Hidup & Karkas)',
    options: [
      { value: 'broiler', label: 'Ayam Broiler' },
      { value: 'kampung', label: 'Ayam Kampung' },
      { value: 'pejantan', label: 'Ayam Pejantan' },
      { value: 'layer', label: 'Ayam Layer' },
    ]
  },
  {
    label: 'Ternak & Hewan Besar',
    options: [
      { value: 'sapi', label: 'Sapi' },
      { value: 'kambing', label: 'Kambing' },
      { value: 'domba', label: 'Domba' }
    ]
  },
  {
    label: 'Sembako & Hasil Bumi',
    options: [
      { value: 'beras', label: 'Beras' },
      { value: 'minyak', label: 'Minyak Goreng' },
      { value: 'gula', label: 'Gula' },
      { value: 'tepung', label: 'Tepung' },
      { value: 'telur', label: 'Telur' },
    ]
  }
]

const TYPE_META = {
  stok_ayam: { label: 'Jual Stok', color: '#A78BFA', bg: 'rgba(124,58,237,0.12)', border: 'rgba(124,58,237,0.3)' },
  penawaran_broker: { label: 'Penawaran', color: '#021a02', bg: 'rgba(2, 26, 2,0.12)', border: 'rgba(2, 26, 2,0.3)' },
  permintaan_rpa: { label: 'Permintaan', color: '#FBBF24', bg: 'rgba(245,158,11,0.12)', border: 'rgba(245,158,11,0.3)' },
}

function normalizeWA(raw) {
  if (!raw) return ''
  const digits = raw.replace(/\D/g, '')
  if (digits.startsWith('0')) return '62' + digits.slice(1)
  if (digits.startsWith('62')) return digits
  return '62' + digits
}

function formatRp(n) {
  if (!n && n !== 0) return '—'
  return 'Rp ' + String(Math.round(Number(n))).replace(/\B(?=(\d{3})+(?!\d))/g, '.')
}

function timeAgo(dateStr) {
  if (!dateStr) return ''
  try {
    return formatDistanceToNow(new Date(dateStr), { addSuffix: true, locale: idLocale })
  } catch {
    return ''
  }
}

// ─── TypeBadge ────────────────────────────────────────────────────────────────

function TypeBadge({ type }) {
  const m = TYPE_META[type]
  if (!m) return null
  return (
    <span
      className="text-[10px] font-black uppercase tracking-widest px-2 py-0.5 rounded-full"
      style={{ color: m.color, background: m.bg, border: `1px solid ${m.border}` }}
    >
      {m.label}
    </span>
  )
}

// ─── Listing Card ─────────────────────────────────────────────────────────────

function ListingCard({ listing }) {
  async function handleContact() {
    const wa = normalizeWA(listing.contact_wa || '')
    if (!wa || wa.length < 10) {
      alert('Nomor WA tidak valid')
      return
    }
    const msg = encodeURIComponent(
      `Halo ${listing.contact_name}, saya tertarik dengan listing "${listing.title}" di TernakOS Market.`
    )
    window.open(`https://wa.me/${wa}?text=${msg}`, '_blank')
  }

  return (
    <motion.div
      layout
      initial={{ opacity: 0, y: 12 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, scale: 0.97 }}
      className="bg-[#111C24] rounded-2xl p-5 border border-white/8 hover:border-emerald-500/30 transition-all flex flex-col gap-3"
    >
      {/* Top badges */}
      <div className="flex items-center gap-1 flex-wrap">
        <TypeBadge type={listing.listing_type} />
        {listing.chicken_type && (
          <span className="text-[10px] font-semibold text-[#4B6478] bg-white/5 px-2 py-0.5 rounded-full capitalize">
            {listing.chicken_type}
          </span>
        )}
      </div>

      {/* Title */}
      <div>
        <p className="text-sm font-bold text-[#F1F5F9] leading-snug line-clamp-2">{listing.title}</p>
        {listing.location && (
          <div className="flex items-center gap-1 mt-1">
            <MapPin size={11} className="text-[#4B6478] shrink-0" />
            <p className="text-xs text-[#4B6478] truncate">{listing.location}</p>
          </div>
        )}
      </div>

      {/* Details */}
      <div className="space-y-1">
        {listing.weight_kg > 0 && (
          <div className="flex items-center justify-between text-xs">
            <span className="text-[#4B6478]">Kuantitas / Bobot Total</span>
            <span className="text-[#94A3B8] font-semibold tabular-nums">{listing.weight_kg} kg/Liter</span>
          </div>
        )}
        {listing.quantity_ekor > 0 && (
          <div className="flex items-center justify-between text-xs">
            <span className="text-[#4B6478]">Jumlah Unit/Ekor</span>
            <span className="text-[#94A3B8] font-semibold tabular-nums">
              {String(listing.quantity_ekor).replace(/\B(?=(\d{3})+(?!\d))/g, '.')} unit
            </span>
          </div>
        )}
        {listing.price_per_kg > 0 && (
          <div className="flex items-center justify-between text-xs">
            <span className="text-[#4B6478]">
              {listing.listing_type === 'permintaan_rpa' ? 'Budget Harga' : 'Harga Per Satuan'}
            </span>
            <span className="font-bold tabular-nums" style={{ color: '#021a02' }}>
              {formatRp(listing.price_per_kg)}
            </span>
          </div>
        )}
      </div>

      {/* Footer */}
      <div className="flex items-center justify-between pt-1 border-t border-white/5 mt-auto gap-2">
        <div className="min-w-0">
          <p className="text-xs text-[#F1F5F9] font-semibold truncate">
            {listing.tenants?.business_name ?? listing.contact_name ?? '—'}
          </p>
          <div className="flex items-center gap-1 mt-0.5">
            <Clock size={10} className="text-[#4B6478]" />
            <p className="text-[10px] text-[#4B6478]">{timeAgo(listing.created_at)}</p>
          </div>
        </div>
        <div className="flex items-center gap-1.5 shrink-0">
          <button
            onClick={handleContact}
            className="flex items-center gap-1.5 px-3 py-2 rounded-xl text-xs font-semibold transition-colors"
            style={{
              background: 'rgba(37,211,102,0.08)',
              border: '1px solid rgba(37,211,102,0.25)',
              color: '#25D366'
            }}
          >
            <MessageCircle size={13} />
            WA
          </button>
        </div>
      </div>
    </motion.div>
  )
}

// ─── Main Page ────────────────────────────────────────────────────────────────

export default function MarketPublic() {
  const navigate = useNavigate()

  const [typeFilter, setTypeFilter] = useState('all')
  const [chickenFilter, setChickenFilter] = useState('all')
  const [search, setSearch] = useState('')
  const [locationQuery, setLocationQuery] = useState('')

  const filters = useMemo(() => ({
    type: typeFilter !== 'all' ? typeFilter : undefined,
    chicken_type: chickenFilter !== 'all' ? chickenFilter : undefined,
    search: search.trim() || undefined,
    location: locationQuery.trim() || undefined,
  }), [typeFilter, chickenFilter, search, locationQuery])

  const { data: listings = [], isLoading } = useMarketListings(filters)

  // Scroll to top on mount
  useEffect(() => {
    window.scrollTo(0, 0)
  }, [])

  // Stats
  const totalActive = listings.length
  const stokAyam = listings.filter(l => l.listing_type === 'stok_ayam').length
  const permintaan = listings.filter(l => l.listing_type === 'permintaan_rpa').length

  const marketSchema = {
    "@context": "https://schema.org",
    "@type": "CollectionPage",
    "name": "Market TernakOS - Jual Beli Stok Ayam & Komoditas Peternakan",
    "description": "Temukan stok ayam broiler, pakan, dan komoditas peternakan lainnya. Hubungi penjual langsung via WhatsApp. Gratis pasang iklan untuk pengguna TernakOS.",
    "url": "https://ternakos.my.id/market"
  };

  return (
    <div className="bg-bg-base min-h-screen text-text-primary font-body overflow-x-hidden pt-20">
      <SEO
        title="Market TernakOS - Jual Beli Stok Ayam & Komoditas Peternakan"
        description="Temukan stok ayam broiler, pakan, dan komoditas peternakan lainnya. Hubungi penjual langsung via WhatsApp. Gratis pasang iklan untuk pengguna TernakOS."
        path="/market"
        schema={marketSchema}
      />
      <Navbar />

      <div className="p-4 md:p-6 space-y-6 max-w-6xl mx-auto pb-24">
        {/* Header */}
        <div className="flex flex-col sm:flex-row items-start justify-between gap-4 mt-6">
          <div>
            <div className="flex items-center gap-2 mb-1">
              <Store size={24} className="text-emerald-400 shrink-0" />
              <h1 className="font-display font-black text-3xl text-[#F1F5F9]">TernakOS Market</h1>
            </div>
            <p className="text-sm text-[#4B6478] leading-relaxed max-w-md mt-2">
              Platform publik yang mempertemukan peternak, broker, distributor dan buyer. Temukan stok komoditas dan penawaran terbaik hari ini tanpa perlu mendaftar.
            </p>
          </div>
          <button
            onClick={() => navigate('/register')}
            className="flex items-center gap-2 bg-emerald-500 hover:bg-emerald-600 text-white text-sm font-bold px-5 py-3 rounded-xl transition-colors shadow-[0_4px_20px_rgba(2, 26, 2,0.25)] shrink-0"
          >
            <Plus size={16} />
            Pasang Iklan Sekarang
          </button>
        </div>

        {/* Stats ticker */}
        <div className="flex items-center justify-between py-3 px-5 bg-[#111C24] rounded-2xl border border-white/8 overflow-x-auto gap-8">
          {[
            { label: 'Listing Aktif', value: totalActive, color: '#F1F5F9' },
            { label: 'Stok Tersedia', value: stokAyam, color: '#A78BFA' },
            { label: 'Dicari', value: permintaan, color: '#FBBF24' },
          ].map((s, i) => (
            <div key={i} className="flex flex-col items-center shrink-0 w-full sm:w-1/3">
              <span className="font-display font-black text-3xl" style={{ color: s.color }}>
                {s.value}
              </span>
              <span className="text-xs text-[#4B6478] font-semibold whitespace-nowrap">{s.label}</span>
            </div>
          ))}
        </div>

        {/* Filter bar */}
        <div className="space-y-4 bg-black/20 p-5 rounded-2xl border border-white/5">
          <h3 className="text-sm font-black uppercase tracking-widest text-[#4B6478]">Pencarian & Filter</h3>

          {/* Search */}
          <div className="relative">
            <Search size={16} className="absolute left-4 top-1/2 -translate-y-1/2 text-[#4B6478] pointer-events-none" />
            <input
              id="market-search"
              name="search"
              type="text"
              value={search}
              onChange={e => setSearch(e.target.value)}
              placeholder="Cari kata kunci judul..."
              className="w-full h-12 bg-[#111C24] border border-white/10 rounded-xl pl-11 pr-11 text-sm text-[#F1F5F9] placeholder:text-white/20 focus:outline-none focus:border-emerald-500/50 transition-colors"
            />
            {search && (
              <button onClick={() => setSearch('')} className="absolute right-4 top-1/2 -translate-y-1/2">
                <X size={15} className="text-[#4B6478]" />
              </button>
            )}
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {/* Type chips */}
            <div className="flex gap-2 overflow-x-auto pb-1 [&::-webkit-scrollbar]:hidden items-center">
              {LISTING_TYPES.map(t => (
                <button
                  key={t.value}
                  onClick={() => setTypeFilter(t.value)}
                  className="flex items-center gap-1.5 px-4 py-2.5 rounded-xl text-xs font-semibold whitespace-nowrap transition-all"
                  style={typeFilter === t.value
                    ? { background: '#021a02', color: '#fff', border: '1px solid #021a02' }
                    : { background: 'rgba(255,255,255,0.04)', color: '#94A3B8', border: '1px solid rgba(255,255,255,0.08)' }
                  }
                >
                  {t.emoji} {t.label}
                </button>
              ))}
            </div>

            {/* Chicken type + location */}
            <div className="flex gap-3">
              <div className="flex-1">
                <Select value={chickenFilter} onValueChange={setChickenFilter}>
                  <SelectTrigger className="w-full h-12 bg-[#111C24] border-white/10 rounded-xl text-sm text-[#F1F5F9] focus:ring-emerald-500/50">
                    <SelectValue placeholder="Semua Komoditas" />
                  </SelectTrigger>
                  <SelectContent className="bg-[#0C1319] border-white/10 text-[#F1F5F9]">
                    <SelectItem value="all">Semua Komoditas</SelectItem>
                    {COMMODITY_GROUPS.map(g => (
                      <SelectGroup key={g.label}>
                        <SelectLabel className="text-[10px] font-black uppercase tracking-widest text-[#4B6478] px-2 py-2">
                          {g.label}
                        </SelectLabel>
                        {g.options.map(c => (
                          <SelectItem key={c.value} value={c.value} className="focus:bg-emerald-500/10 focus:text-emerald-400">
                            {c.label}
                          </SelectItem>
                        ))}
                      </SelectGroup>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div className="relative flex-1">
                <MapPin size={14} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-[#4B6478] pointer-events-none" />
                <input
                  id="market-location"
                  name="location_filter"
                  type="text"
                  value={locationQuery}
                  onChange={e => setLocationQuery(e.target.value)}
                  placeholder="Filter lokasi..."
                  className="w-full bg-[#111C24] border border-white/10 rounded-xl pl-9 pr-4 py-2.5 text-sm text-[#F1F5F9] placeholder:text-white/20 focus:outline-none focus:border-emerald-500/50 transition-colors"
                />
              </div>
            </div>
          </div>
        </div>

        {/* Listing grid */}
        {isLoading ? (
          <div className="flex items-center justify-center py-20">
            <div className="w-8 h-8 rounded-full border-2 border-emerald-500/30 border-t-emerald-500 animate-spin" />
          </div>
        ) : listings.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-24 text-center bg-[#111C24] border border-white/5 rounded-2xl">
            <Store size={48} className="text-[#4B6478] mb-4" />
            <p className="text-lg font-bold text-[#F1F5F9]">Belum ada listing ditemukan</p>
            <p className="text-sm text-[#4B6478] mt-2 max-w-sm">
              Coba gunakan filter lokasi lain atau daftarkan akun untuk memposting iklan pertama Anda.
            </p>
            <button
              onClick={() => navigate('/register')}
              className="mt-6 text-sm text-emerald-400 font-bold hover:text-emerald-300 underline"
            >
              Daftar & Pasang Iklan
            </button>
          </div>
        ) : (
          <motion.div layout className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
            <AnimatePresence mode="popLayout">
              {listings.map(l => <ListingCard key={l.id} listing={l} />)}
            </AnimatePresence>
          </motion.div>
        )}
      </div>

      <Footer />
    </div>
  )
}
