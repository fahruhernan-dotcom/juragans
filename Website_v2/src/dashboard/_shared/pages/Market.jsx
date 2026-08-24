import { useState, useMemo, useEffect } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import {
  MessageCircle, Plus, Search, X, ChevronDown, ChevronUp,
  MapPin, Package, Clock, Store, AlertCircle,
  UserPlus, Check, RefreshCw
} from 'lucide-react'
import { toast } from 'sonner'
import { supabase } from '@/lib/supabase'
import { useAuth } from '@/lib/hooks/useAuth'
import {
  useMarketListings, useMyListings, useCreateListing,
  useCloseListing, useDeleteListing
} from '@/lib/hooks/useMarket'
import {
  useConnectionStatus, useRequestConnection,
  useRespondConnection, useCancelConnection,
  useMyConnections
} from '@/lib/hooks/useBrokerConnections'
import { formatDistanceToNow } from 'date-fns'
import { id as idLocale } from 'date-fns/locale/id'
import { PhoneInput } from '@/components/ui/PhoneInput'
import { logSupabaseError } from '@/lib/logger/supabaseLogger'
import { logError } from '@/lib/logger/errorLogger'

// ─── Constants ────────────────────────────────────────────────────────────────

const LISTING_TYPES = [
  { value: 'all',               label: 'Semua',                icon: '/logo.png' },
  { value: 'stok_ayam',         label: 'Stok Ayam',            icon: '/assets/icons/models/role_peternak.png' },
  { value: 'penawaran_broker',  label: 'Penawaran Broker',      icon: '/assets/icons/models/role_broker.png' },
  { value: 'permintaan_rpa',    label: 'Permintaan RPA',        icon: '/assets/icons/models/role_rpa.png' },
]

const CHICKEN_TYPES = [
  { value: 'all',       label: 'Semua Jenis' },
  { value: 'broiler',   label: 'Broiler' },
  { value: 'kampung',   label: 'Kampung' },
  { value: 'pejantan',  label: 'Pejantan' },
  { value: 'layer',     label: 'Layer' },
]

const PAYMENT_TERMS = [
  { value: 'cash', label: 'Cash' },
  { value: 'net3', label: 'Net 3' },
  { value: 'net7', label: 'Net 7' },
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
  stok_ayam:        { label: 'Stok Peternak',    color: '#A78BFA', bg: 'rgba(124,58,237,0.12)',  border: 'rgba(124,58,237,0.3)'  },
  penawaran_broker: { label: 'Penawaran Broker',  color: '#10B981', bg: 'rgba(16, 185, 129, 0.12)', border: 'rgba(16, 185, 129, 0.3)'  },
  permintaan_rpa:   { label: 'Permintaan RPA',    color: '#FBBF24', bg: 'rgba(245,158,11,0.12)', border: 'rgba(245,158,11,0.3)'  },
}

const STATUS_META = {
  active:  { label: 'Aktif',      color: '#10B981', bg: 'rgba(16, 185, 129, 0.12)'  },
  closed:  { label: 'Ditutup',    color: '#94A3B8', bg: 'rgba(148,163,184,0.1)'  },
  expired: { label: 'Kadaluarsa', color: '#F87171', bg: 'rgba(248,113,113,0.12)' },
}

function normalizeWA(raw) {
  const digits = raw.replace(/\D/g, '')
  if (digits.startsWith('0')) return '62' + digits.slice(1)
  if (digits.startsWith('62')) return digits
  return '62' + digits
}

function formatRp(n) {
  if (!n && n !== 0) return '—'
  return 'Rp ' + Number(n).toLocaleString('id-ID')
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

// ─── Connection Button ────────────────────────────────────────────────────────

function ConnectionButton({ connection, amRequester, onRequest, onRespond, onCancel }) {
  if (!connection) {
    return (
      <button
        onClick={onRequest}
        className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg
          bg-emerald-500/10 border border-emerald-500/20
          text-emerald-400 text-xs font-display font-black
          hover:bg-emerald-500/20 transition-colors"
      >
        <UserPlus className="w-3.5 h-3.5" />
        Ajak Kerjasama
      </button>
    )
  }

  if (connection.status === 'active') {
    return (
      <span className="flex items-center gap-1 px-3 py-1.5 rounded-lg
        bg-emerald-500/10 text-emerald-400 text-xs font-display font-black">
        <Check className="w-3.5 h-3.5" />
        Mitra
      </span>
    )
  }

  if (connection.status === 'pending' && amRequester) {
    return (
      <button
        onClick={onCancel}
        className="flex items-center gap-1 px-3 py-1.5 rounded-lg
          bg-amber-500/10 border border-amber-500/20
          text-amber-400 text-xs font-display font-black
          hover:bg-red-500/10 hover:text-red-400 hover:border-red-500/20
          transition-colors group"
      >
        <Clock className="w-3.5 h-3.5 group-hover:hidden" />
        <X className="w-3.5 h-3.5 hidden group-hover:block" />
        <span className="group-hover:hidden">Menunggu</span>
        <span className="hidden group-hover:block">Batalkan</span>
      </button>
    )
  }

  if (connection.status === 'pending' && !amRequester) {
    return (
      <div className="flex gap-1">
        <button
          onClick={() => onRespond('active')}
          className="px-2.5 py-1.5 rounded-lg bg-emerald-500/10
            text-emerald-400 text-xs font-display font-black
            hover:bg-emerald-500/20 transition-colors"
        >
          Terima
        </button>
        <button
          onClick={() => onRespond('rejected')}
          className="px-2.5 py-1.5 rounded-lg bg-red-500/10
            text-red-400 text-xs font-display font-black
            hover:bg-red-500/20 transition-colors"
        >
          Tolak
        </button>
      </div>
    )
  }

  if (connection.status === 'rejected') {
    return (
      <button
        onClick={onRequest}
        className="flex items-center gap-1 px-3 py-1.5 rounded-lg
          bg-[#111C24] border border-white/10
          text-[#94A3B8] text-xs font-display font-black
          hover:border-emerald-500/30 hover:text-emerald-400
          transition-colors"
      >
        <RefreshCw className="w-3.5 h-3.5" />
        Request Ulang
      </button>
    )
  }

  if (connection.status === 'blocked') {
    return (
      <span className="px-3 py-1.5 rounded-lg bg-[#111C24]
        text-[#4B6478] text-xs font-display font-black cursor-not-allowed">
        Diblokir
      </span>
    )
  }

  return null
}

// ─── Listing Card ─────────────────────────────────────────────────────────────

function ListingCard({ listing }) {
  const { tenant } = useAuth()
  const isOwnListing = listing.tenant_id === tenant?.id

  const { data: connection } = useConnectionStatus(
    isOwnListing ? null : listing.tenant_id
  )
  const { mutate: requestConnection } = useRequestConnection()
  const { mutate: respondConnection } = useRespondConnection()
  const { mutate: cancelConnection }  = useCancelConnection()

  const amRequester = connection?.requester_tenant_id === tenant?.id

  async function handleContact() {
    supabase.from('market_listings')
      .update({ view_count: (listing.view_count || 0) + 1 })
      .eq('id', listing.id)
      .then(({ error }) => {
        if (error) {
          logSupabaseError(error, {
            table: 'market_listings',
            operation: 'update',
            component: 'Market',
            actionName: 'market.listing.increment_view',
            metadata: {
              listing_id: listing.id,
              operation: 'increment_view',
              source_component: 'Market',
            }
          })
        }
      })
      .catch((err) => {
        logError({
          level: 'error',
          source: 'frontend',
          component: 'Market',
          actionName: 'market.listing.increment_view',
          error: err,
          metadata: {
            listing_id: listing.id,
            operation: 'increment_view',
            source_component: 'Market',
          }
        })
      })

    const wa = normalizeWA(listing.contact_wa || '')
    if (!wa || wa.length < 10) {
      toast.error('Nomor WA tidak valid')
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
              {listing.quantity_ekor.toLocaleString('id-ID')} unit
            </span>
          </div>
        )}
        {listing.price_per_kg > 0 && (
          <div className="flex items-center justify-between text-xs">
            <span className="text-[#4B6478]">
              {listing.listing_type === 'permintaan_rpa' ? 'Budget Harga' : 'Harga Per Satuan'}
            </span>
            <span className="font-bold tabular-nums" style={{ color: '#10B981' }}>
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
          {!isOwnListing && (
            <ConnectionButton
              connection={connection}
              amRequester={amRequester}
              onRequest={() => requestConnection({
                targetTenantId: listing.tenant_id,
                targetType: listing.listing_type,
              })}
              onRespond={(status) => respondConnection({ connectionId: connection.id, status })}
              onCancel={() => cancelConnection(connection.id)}
            />
          )}
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

// ─── My Listing Row ───────────────────────────────────────────────────────────

function MyListingRow({ listing, onClose, onDelete }) {
  const s = STATUS_META[listing.status] ?? STATUS_META.closed
  return (
    <div className="flex items-center gap-3 py-3 border-b border-white/5 last:border-0">
      <div className="flex-1 min-w-0">
        <p className="text-sm font-semibold text-[#F1F5F9] truncate">{listing.title}</p>
        <div className="flex items-center gap-1 flex-wrap mt-0.5">
          <TypeBadge type={listing.listing_type} />
          <span
            className="text-[10px] font-semibold px-2 py-0.5 rounded-full"
            style={{ color: s.color, background: s.bg }}
          >
            {s.label}
          </span>
        </div>
      </div>
      <p className="text-xs text-[#4B6478] shrink-0 hidden sm:block">{timeAgo(listing.created_at)}</p>
      <div className="flex items-center gap-2 shrink-0">
        {listing.status === 'active' && (
          <button
            onClick={() => onClose(listing.id)}
            className="text-xs px-2.5 py-1.5 rounded-lg border border-white/10 text-[#94A3B8] hover:bg-white/5 transition-colors"
          >
            Tutup
          </button>
        )}
        <button
          onClick={() => onDelete(listing.id)}
          className="text-xs px-2.5 py-1.5 rounded-lg border border-red-500/20 text-red-400 hover:bg-red-500/10 transition-colors"
        >
          Hapus
        </button>
      </div>
    </div>
  )
}

// ─── Sheet: Pasang Iklan ──────────────────────────────────────────────────────

const FORM_DEFAULTS = {
  listing_type: '',
  title: '', chicken_type: '', quantity_ekor: '', weight_kg: '',
  price_per_kg: '', location: '', description: '',
  contact_name: '', contact_wa: '', expires_at: '',
  payment_terms: '', harvest_date: '', target_date: '',
}

function SheetPasangIklan({ isOpen, onClose, profile }) {
  const create = useCreateListing()
  const [step, setStep] = useState(1)
  const [form, setForm] = useState({ ...FORM_DEFAULTS })

  function set(k, v) { setForm(p => ({ ...p, [k]: v })) }

  function buildAutoTitle() {
    const ct = form.chicken_type || 'Ayam'
    const qty = form.quantity_ekor ? `${form.quantity_ekor} ekor` : ''
    const loc = form.location || ''
    if (form.listing_type === 'stok_ayam')
      return `Stok ${ct} siap panen${loc ? ` — ${loc}` : ''}`
    if (form.listing_type === 'penawaran_broker')
      return `Penawaran ${ct}${qty ? ` — ${qty}` : ''}${loc ? ` — ${loc}` : ''}`
    if (form.listing_type === 'permintaan_rpa')
      return `Butuh${qty ? ` ${qty}` : ''} ${ct}${loc ? ` — ${loc}` : ''}`
    return ''
  }

  function handleSelectType(type) {
    const expires = new Date()
    expires.setDate(expires.getDate() + 30)
    setForm({
      ...FORM_DEFAULTS,
      listing_type: type,
      contact_name: profile?.full_name || '',
      expires_at: expires.toISOString().split('T')[0],
    })
    setStep(2)
  }

  async function handleSubmit(e) {
    e.preventDefault()
    const waDigits = normalizeWA(form.contact_wa)
    if (!form.listing_type) { toast.error('Pilih tipe listing'); return }
    if (!form.contact_name.trim()) { toast.error('Nama kontak wajib diisi'); return }
    if (!form.contact_wa.trim() || waDigits.length < 10) {
      toast.error('Nomor WhatsApp tidak valid (min 10 digit)')
      return
    }
    const autoTitle = buildAutoTitle()
    await create.mutateAsync({
      listing_type:   form.listing_type,
      title:          form.title.trim() || autoTitle,
      chicken_type:   form.chicken_type || null,
      quantity_ekor:  form.quantity_ekor ? parseInt(form.quantity_ekor) : null,
      weight_kg:      form.weight_kg     ? parseFloat(form.weight_kg)  : null,
      price_per_kg:   form.price_per_kg  ? parseFloat(form.price_per_kg) : null,
      location:       form.location      || null,
      description:    form.description   || null,
      contact_name:   form.contact_name,
      contact_wa:     waDigits,
      status:         'active',
      expires_at:     form.expires_at    || null,
      view_count:     0,
    })
    setForm({ ...FORM_DEFAULTS })
    setStep(1)
    onClose()
  }

  function handleClose() {
    setForm({ ...FORM_DEFAULTS })
    setStep(1)
    onClose()
  }

  return (
    <AnimatePresence>
      {isOpen && (
        <>
          <motion.div
            initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
            className="fixed inset-0 bg-black/60 z-40"
            onClick={handleClose}
          />
          <motion.div
            initial={{ x: '100%' }} animate={{ x: 0 }} exit={{ x: '100%' }}
            transition={{ type: 'spring', damping: 28, stiffness: 260 }}
            className="fixed right-0 top-0 bottom-0 w-full max-w-md bg-[#0C1319] border-l border-white/10 z-50 flex flex-col"
          >
            {/* Header */}
            <div className="flex items-center justify-between px-6 py-5 border-b border-white/8">
              <div className="flex items-center gap-3">
                {step === 2 && (
                  <button onClick={() => setStep(1)} className="w-7 h-7 rounded-lg hover:bg-white/8 flex items-center justify-center">
                    <ChevronDown size={14} className="text-[#4B6478] rotate-90" />
                  </button>
                )}
                <div>
                  <h3 className="font-bold text-[#F1F5F9] text-base">Pasang Iklan</h3>
                  <p className="text-xs text-[#4B6478]">Langkah {step} dari 2</p>
                </div>
              </div>
              <button onClick={handleClose} className="w-8 h-8 rounded-lg hover:bg-white/8 flex items-center justify-center">
                <X size={16} className="text-[#4B6478]" />
              </button>
            </div>

            {/* Step indicator */}
            <div className="flex gap-1.5 px-6 pt-4">
              {[1, 2].map(n => (
                <div
                  key={n}
                  className="h-1 rounded-full flex-1 transition-all"
                  style={{ background: n <= step ? '#10B981' : 'rgba(255,255,255,0.08)' }}
                />
              ))}
            </div>

            {/* Step 1: Pilih tipe */}
            {step === 1 && (
              <div className="flex-1 overflow-y-auto px-6 py-5 space-y-3">
                <p className="text-xs font-black uppercase tracking-widest text-[#4B6478] mb-4">
                  Saya ingin...
                </p>

                {[
                  {
                    type: 'stok_ayam',
                    icon: '/assets/icons/models/role_peternak.png',
                    title: 'Jual Stok Ayam',
                    desc: 'Saya peternak — ingin jual ayam siap panen ke broker atau buyer',
                    color: '#A78BFA',
                  },
                  {
                    type: 'penawaran_broker',
                    icon: '/assets/icons/models/role_broker.png',
                    title: 'Tawarkan Ayam',
                    desc: 'Saya broker — ingin tawarkan ayam ke RPA atau buyer',
                    color: '#10B981',
                  },
                  {
                    type: 'permintaan_rpa',
                    icon: '/assets/icons/models/role_rpa.png',
                    title: 'Cari Ayam',
                    desc: 'Saya RPA/buyer — ingin cari ayam dari broker atau peternak',
                    color: '#FBBF24',
                  },
                ].map(opt => (
                  <button
                    key={opt.type}
                    onClick={() => handleSelectType(opt.type)}
                    className="w-full flex items-start gap-4 p-4 rounded-2xl border text-left transition-all hover:border-opacity-60"
                    style={{ borderColor: 'rgba(255,255,255,0.08)', background: '#111C24' }}
                    onMouseEnter={e => { e.currentTarget.style.borderColor = opt.color + '50' }}
                    onMouseLeave={e => { e.currentTarget.style.borderColor = 'rgba(255,255,255,0.08)' }}
                  >
                    <img src={opt.icon} alt="" className="w-8 h-8 object-contain" />
                    <div>
                      <p className="text-sm font-bold text-[#F1F5F9]">{opt.title}</p>
                      <p className="text-xs text-[#4B6478] mt-0.5 leading-relaxed">{opt.desc}</p>
                    </div>
                  </button>
                ))}
              </div>
            )}

            {/* Step 2: Form */}
            {step === 2 && (
              <form onSubmit={handleSubmit} className="flex-1 overflow-y-auto px-6 py-5 space-y-4">
                {/* Auto title preview */}
                <div className="bg-[#111C24] rounded-xl px-4 py-3 border border-white/5">
                  <p className="text-[10px] text-[#4B6478] uppercase tracking-widest mb-1">Preview Judul</p>
                  <p className="text-sm text-[#94A3B8] italic">
                    {form.title || buildAutoTitle() || 'Isi form untuk generate judul...'}
                  </p>
                </div>

                {/* Judul (editable) */}
                <div>
                  <label htmlFor="ml-title" className="block text-xs font-semibold text-[#4B6478] mb-1.5 uppercase tracking-wider">
                    Judul Kustom (opsional)
                  </label>
                  <input
                    id="ml-title"
                    name="title"
                    type="text"
                    value={form.title}
                    onChange={e => set('title', e.target.value)}
                    placeholder="Biarkan kosong untuk auto-generate"
                    className="w-full bg-[#111C24] border border-white/10 rounded-xl px-3 py-2.5 text-sm text-[#F1F5F9] placeholder:text-white/20 focus:outline-none focus:border-emerald-500/50 transition-colors"
                  />
                </div>

                {/* Jenis Komoditas */}
                <div>
                  <label htmlFor="ml-chicken" className="block text-xs font-semibold text-[#4B6478] mb-1.5 uppercase tracking-wider">
                    Pilih Komoditas *
                  </label>
                  <select
                    id="ml-chicken"
                    name="chicken_type"
                    value={form.chicken_type}
                    onChange={e => set('chicken_type', e.target.value)}
                    className="w-full bg-[#111C24] border border-white/10 rounded-xl px-3 py-2.5 text-sm text-[#F1F5F9] focus:outline-none focus:border-emerald-500/50"
                  >
                    <option value="">Pilih...</option>
                    {COMMODITY_GROUPS.map(g => (
                      <optgroup key={g.label} label={g.label}>
                        {g.options.map(c => <option key={c.value} value={c.value}>{c.label}</option>)}
                      </optgroup>
                    ))}
                  </select>
                </div>

                {/* Quantity */}
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label htmlFor="ml-weight" className="block text-xs font-semibold text-[#4B6478] mb-1.5 uppercase tracking-wider">
                      {form.listing_type === 'permintaan_rpa' ? 'Target Kuantitas' : 'Total Kuantitas'} (Kg/Top)
                    </label>
                    <input
                      id="ml-weight"
                      name="weight_kg"
                      type="number"
                      min="0"
                      step="0.01"
                      value={form.weight_kg}
                      onChange={e => set('weight_kg', e.target.value)}
                      placeholder="Contoh: 50.5"
                      className="w-full bg-[#111C24] border border-white/10 rounded-xl px-3 py-2.5 text-sm text-[#F1F5F9] placeholder:text-white/20 focus:outline-none focus:border-emerald-500/50 transition-colors"
                    />
                  </div>
                  <div>
                    <label htmlFor="ml-qty" className="block text-xs font-semibold text-[#4B6478] mb-1.5 uppercase tracking-wider">
                      Stok Item 
                      <span className="text-[10px] lowercase normal-case ml-1">(Ekor/Karton)</span>
                    </label>
                    <input
                      id="ml-qty"
                      name="quantity_ekor"
                      type="number"
                      min="0"
                      value={form.quantity_ekor}
                      onChange={e => set('quantity_ekor', e.target.value)}
                      placeholder="Contoh: 100"
                      className="w-full bg-[#111C24] border border-white/10 rounded-xl px-3 py-2.5 text-sm text-[#F1F5F9] placeholder:text-white/20 focus:outline-none focus:border-emerald-500/50 transition-colors"
                    />
                  </div>
                </div>

                {/* Price */}
                <div>
                  <label htmlFor="ml-price" className="block text-xs font-semibold text-[#4B6478] mb-1.5 uppercase tracking-wider">
                    {form.listing_type === 'permintaan_rpa' ? 'Budget Harga per Satuan (Rp)' : 'Harga per Satuan (Rp)'}
                  </label>
                  <input
                    id="ml-price"
                    name="price_per_kg"
                    type="number"
                    min="0"
                    value={form.price_per_kg}
                    onChange={e => set('price_per_kg', e.target.value)}
                    placeholder="Contoh: 22000"
                    className="w-full bg-[#111C24] border border-white/10 rounded-xl px-3 py-2.5 text-sm text-[#F1F5F9] placeholder:text-white/20 focus:outline-none focus:border-emerald-500/50 transition-colors"
                  />
                </div>

                {/* Location */}
                <div>
                  <label htmlFor="ml-loc" className="block text-xs font-semibold text-[#4B6478] mb-1.5 uppercase tracking-wider">
                    {form.listing_type === 'permintaan_rpa' ? 'Lokasi Pengiriman' : 'Lokasi Kandang'}
                  </label>
                  <input
                    id="ml-loc"
                    name="location"
                    type="text"
                    value={form.location}
                    onChange={e => set('location', e.target.value)}
                    placeholder="Contoh: Boyolali, Jawa Tengah"
                    className="w-full bg-[#111C24] border border-white/10 rounded-xl px-3 py-2.5 text-sm text-[#F1F5F9] placeholder:text-white/20 focus:outline-none focus:border-emerald-500/50 transition-colors"
                  />
                </div>

                {/* Syarat bayar (broker only) */}
                {form.listing_type === 'penawaran_broker' && (
                  <div>
                    <label htmlFor="ml-terms" className="block text-xs font-semibold text-[#4B6478] mb-1.5 uppercase tracking-wider">
                      Syarat Pembayaran
                    </label>
                    <select
                      id="ml-terms"
                      name="payment_terms"
                      value={form.payment_terms}
                      onChange={e => set('payment_terms', e.target.value)}
                      className="w-full bg-[#111C24] border border-white/10 rounded-xl px-3 py-2.5 text-sm text-[#F1F5F9] focus:outline-none focus:border-emerald-500/50"
                    >
                      <option value="">Pilih syarat...</option>
                      {PAYMENT_TERMS.map(t => <option key={t.value} value={t.value}>{t.label}</option>)}
                    </select>
                  </div>
                )}

                {/* Description */}
                <div>
                  <label htmlFor="ml-desc" className="block text-xs font-semibold text-[#4B6478] mb-1.5 uppercase tracking-wider">
                    Deskripsi / Catatan
                  </label>
                  <textarea
                    id="ml-desc"
                    name="description"
                    value={form.description}
                    onChange={e => set('description', e.target.value)}
                    rows={3}
                    placeholder="Info tambahan, kualitas, syarat, dll..."
                    className="w-full bg-[#111C24] border border-white/10 rounded-xl px-3 py-2.5 text-sm text-[#F1F5F9] placeholder:text-white/20 focus:outline-none focus:border-emerald-500/50 transition-colors resize-none"
                  />
                </div>

                {/* Contact */}
                <div className="space-y-3 border border-white/8 rounded-xl p-4">
                  <p className="text-xs font-black uppercase tracking-widest text-[#4B6478]">Kontak</p>
                  <div>
                    <label htmlFor="ml-contact-name" className="block text-xs text-[#4B6478] mb-1">Nama *</label>
                    <input
                      id="ml-contact-name"
                      name="contact_name"
                      type="text"
                      value={form.contact_name}
                      onChange={e => set('contact_name', e.target.value)}
                      placeholder="Nama Anda"
                      className="w-full bg-[#111C24] border border-white/10 rounded-xl px-3 py-2.5 text-sm text-[#F1F5F9] placeholder:text-white/20 focus:outline-none focus:border-emerald-500/50 transition-colors"
                    />
                  </div>
                  <div>
                    <label htmlFor="ml-wa" className="block text-xs text-[#4B6478] mb-1">No. WhatsApp *</label>
                    <PhoneInput
                      id="ml-wa"
                      name="contact_wa"
                      value={form.contact_wa}
                      onChange={e => set('contact_wa', e.target.value)}
                      placeholder="cth. 0812..."
                      className="w-full bg-[#111C24] border border-white/10 rounded-xl px-3 py-2.5 text-sm text-[#F1F5F9] placeholder:text-white/20 focus:outline-none focus:border-emerald-500/50 transition-colors"
                    />
                  </div>
                </div>

                {/* Expires at */}
                <div>
                  <label htmlFor="ml-expires" className="block text-xs font-semibold text-[#4B6478] mb-1.5 uppercase tracking-wider">
                    Berlaku Hingga
                  </label>
                  <input
                    id="ml-expires"
                    name="expires_at"
                    type="date"
                    value={form.expires_at}
                    onChange={e => set('expires_at', e.target.value)}
                    className="w-full bg-[#111C24] border border-white/10 rounded-xl px-3 py-2.5 text-sm text-[#F1F5F9] focus:outline-none focus:border-emerald-500/50 transition-colors"
                  />
                </div>
              </form>
            )}

            {/* Footer */}
            {step === 2 && (
              <div className="px-6 py-4 border-t border-white/8 flex gap-3">
                <button
                  type="button"
                  onClick={() => setStep(1)}
                  className="flex-1 py-2.5 rounded-xl border border-white/10 text-sm text-[#94A3B8] hover:bg-white/5 transition-colors"
                >
                  Kembali
                </button>
                <button
                  type="button"
                  onClick={handleSubmit}
                  disabled={create.isPending}
                  className="flex-1 py-2.5 rounded-xl bg-emerald-500 hover:bg-emerald-400 text-sm font-bold text-white transition-colors disabled:opacity-50"
                >
                  {create.isPending ? 'Mempublikasikan...' : 'Publikasikan'}
                </button>
              </div>
            )}
          </motion.div>
        </>
      )}
    </AnimatePresence>
  )
}

// ─── Main Page ────────────────────────────────────────────────────────────────

export default function Market() {
  const { profile } = useAuth()
  const [typeFilter,    setTypeFilter]    = useState('all')
  const [chickenFilter, setChickenFilter] = useState('all')
  const [search,        setSearch]        = useState('')
  const [locationQuery, setLocationQuery] = useState('')
  const [myListingsOpen, setMyListingsOpen] = useState(false)
  const [sheetOpen,     setSheetOpen]     = useState(false)

  // Debounced values — 400ms delay prevents Supabase fetch on every keystroke
  const [debouncedSearch, setDebouncedSearch] = useState('')
  const [debouncedLocation, setDebouncedLocation] = useState('')

  useEffect(() => {
    const timer = setTimeout(() => setDebouncedSearch(search), 400)
    return () => clearTimeout(timer)
  }, [search])

  useEffect(() => {
    const timer = setTimeout(() => setDebouncedLocation(locationQuery), 400)
    return () => clearTimeout(timer)
  }, [locationQuery])

  const filters = useMemo(() => ({
    type:         typeFilter !== 'all'    ? typeFilter    : undefined,
    chicken_type: chickenFilter !== 'all' ? chickenFilter : undefined,
    search:       debouncedSearch.trim()           || undefined,
    location:     debouncedLocation.trim()    || undefined,
  }), [typeFilter, chickenFilter, debouncedSearch, debouncedLocation])

  const { data: listings = [], isLoading } = useMarketListings(filters)
  const { data: myListings = [] } = useMyListings()
  const { data: connections = [] } = useMyConnections()
  const closeListing  = useCloseListing()
  const deleteListing = useDeleteListing()

  const { tenant } = useAuth()

  // Stats
  const totalActive   = listings.length
  const stokAyam      = listings.filter(l => l.listing_type === 'stok_ayam').length
  const permintaan    = listings.filter(l => l.listing_type === 'permintaan_rpa').length
  const pendingIncoming = connections.filter(c =>
    c.target_tenant_id === tenant?.id && c.status === 'pending'
  ).length

  return (
    <div className="p-4 md:p-6 pt-16 md:pt-8 space-y-5 max-w-6xl mx-auto pb-24">
      {/* Header */}
      <div className="flex flex-col sm:flex-row items-start justify-between gap-4">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <Store size={20} className="text-emerald-400 shrink-0" />
            <h1 className="font-display font-black text-xl text-[#F1F5F9]">TernakOS Market</h1>
            {pendingIncoming > 0 && (
              <span className="w-5 h-5 rounded-full bg-red-500 shrink-0

                text-white text-[10px] font-black flex items-center justify-center">
                {pendingIncoming}
              </span>
            )}
          </div>
          <p className="text-xs text-[#4B6478] leading-relaxed max-w-sm">
            Temukan stok ayam, penawaran broker, dan permintaan buyer dalam satu platform.
          </p>
        </div>
        <button
          onClick={() => setSheetOpen(true)}
          className="flex items-center gap-2 bg-emerald-500 hover:bg-emerald-400 text-white text-sm font-bold px-4 py-2.5 rounded-xl transition-colors shadow-[0_4px_20px_rgba(16, 185, 129, 0.25)] shrink-0"
        >
          <Plus size={15} />
          Pasang Iklan
        </button>
      </div>

      {/* Stats ticker */}
      <div className="flex items-center gap-8 py-3 px-5 bg-[#111C24] rounded-2xl border border-white/8 overflow-x-auto">
        {[
          { label: 'Listing Aktif',      value: totalActive,  color: '#F1F5F9' },
          { label: 'Stok Tersedia',       value: stokAyam,     color: '#A78BFA' },
          { label: 'Dicari',  value: permintaan,   color: '#FBBF24' },
        ].map((s, i) => (
          <div key={i} className="flex flex-col items-center shrink-0">
            <span className="font-display font-black text-2xl" style={{ color: s.color }}>
              {s.value}
            </span>
            <span className="text-[10px] text-[#4B6478] font-semibold whitespace-nowrap">{s.label}</span>
          </div>
        ))}
      </div>

      {/* Filter bar */}
      <div className="space-y-3">
        {/* Search */}
        <div className="relative">
          <Search size={14} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-[#4B6478] pointer-events-none" />
          <input
            id="market-search"
            name="search"
            type="text"
            value={search}
            onChange={e => setSearch(e.target.value)}
            placeholder="Cari stok, penawaran, permintaan..."
            className="w-full h-11 bg-[#111C24] border border-white/10 rounded-xl pl-9 pr-9 text-sm text-[#F1F5F9] placeholder:text-white/20 focus:outline-none focus:border-emerald-500/50 transition-colors"
          />
          {search && (
            <button onClick={() => setSearch('')} className="absolute right-3.5 top-1/2 -translate-y-1/2">
              <X size={13} className="text-[#4B6478]" />
            </button>
          )}
        </div>

        {/* Type chips */}
        <div className="flex gap-2 overflow-x-auto pb-1 [&::-webkit-scrollbar]:hidden">
          {LISTING_TYPES.map(t => (
            <button
              key={t.value}
              onClick={() => setTypeFilter(t.value)}
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-semibold whitespace-nowrap transition-all"
              style={typeFilter === t.value
                ? { background: '#10B981', color: '#fff', border: '1px solid #10B981' }
                : { background: 'rgba(255,255,255,0.04)', color: '#94A3B8', border: '1px solid rgba(255,255,255,0.08)' }
              }
            >
              <img src={t.icon} alt="" className="w-4 h-4 object-contain" />
              {t.label}
            </button>
          ))}
        </div>

        {/* Chicken type + location */}
        <div className="flex gap-3">
          <div className="relative">
            <select
              id="market-chicken"
              name="chicken_filter"
              value={chickenFilter}
              onChange={e => setChickenFilter(e.target.value)}
              className="appearance-none bg-[#111C24] border border-white/10 rounded-xl pl-3 pr-7 py-2 text-xs text-[#F1F5F9] focus:outline-none focus:border-emerald-500/50 transition-colors"
            >
              <option value="all">Semua Komoditas</option>
              {COMMODITY_GROUPS.map(g => (
                <optgroup key={g.label} label={g.label}>
                  {g.options.map(c => <option key={c.value} value={c.value}>{c.label}</option>)}
                </optgroup>
              ))}
            </select>
            <ChevronDown size={12} className="absolute right-2 top-1/2 -translate-y-1/2 text-[#4B6478] pointer-events-none" />
          </div>

          <div className="relative flex-1">
            <MapPin size={12} className="absolute left-3 top-1/2 -translate-y-1/2 text-[#4B6478] pointer-events-none" />
            <input
              id="market-location"
              name="location_filter"
              type="text"
              value={locationQuery}
              onChange={e => setLocationQuery(e.target.value)}
              placeholder="Filter lokasi..."
              className="w-full bg-[#111C24] border border-white/10 rounded-xl pl-7 pr-3 py-2 text-xs text-[#F1F5F9] placeholder:text-white/20 focus:outline-none focus:border-emerald-500/50 transition-colors"
            />
          </div>
        </div>
      </div>

      {/* Listing grid */}
      {isLoading ? (
        <div className="flex items-center justify-center py-20">
          <div className="w-8 h-8 rounded-full border-2 border-emerald-500/30 border-t-emerald-500 animate-spin" />
        </div>
      ) : listings.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-20 text-center">
          <Store size={36} className="text-[#4B6478] mb-3" />
          <p className="text-sm font-bold text-[#4B6478]">Belum ada listing</p>
          <p className="text-xs text-[#4B6478]/70 mt-1">
            {search || typeFilter !== 'all' ? 'Coba ubah filter pencarian' : 'Jadilah yang pertama pasang iklan!'}
          </p>
        </div>
      ) : (
        <motion.div layout className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          <AnimatePresence mode="popLayout">
            {listings.map(l => <ListingCard key={l.id} listing={l} />)}
          </AnimatePresence>
        </motion.div>
      )}

      {/* My Listings section */}
      <div className="border border-white/8 rounded-2xl overflow-hidden">
        <button
          onClick={() => setMyListingsOpen(p => !p)}
          className="w-full flex items-center justify-between px-5 py-4 bg-[#111C24] hover:bg-[#162230] transition-colors"
        >
          <div className="flex items-center gap-2">
            <Package size={15} className="text-emerald-400" />
            <span className="text-sm font-bold text-[#F1F5F9]">
              Listing Saya
            </span>
            <span className="text-xs text-[#4B6478] bg-white/5 px-2 py-0.5 rounded-full">
              {myListings.length}
            </span>
          </div>
          {myListingsOpen
            ? <ChevronUp size={16} className="text-[#4B6478]" />
            : <ChevronDown size={16} className="text-[#4B6478]" />}
        </button>

        <AnimatePresence>
          {myListingsOpen && (
            <motion.div
              initial={{ height: 0, opacity: 0 }}
              animate={{ height: 'auto', opacity: 1 }}
              exit={{ height: 0, opacity: 0 }}
              transition={{ duration: 0.2 }}
              className="overflow-hidden"
            >
              <div className="px-5 bg-[#0C1319]">
                {myListings.length === 0 ? (
                  <div className="flex flex-col items-center py-10 text-center">
                    <AlertCircle size={24} className="text-[#4B6478] mb-2" />
                    <p className="text-sm text-[#4B6478]">Belum ada listing.</p>
                    <button
                      onClick={() => setSheetOpen(true)}
                      className="mt-3 text-xs text-emerald-400 hover:text-emerald-300 underline"
                    >
                      Pasang iklan sekarang!
                    </button>
                  </div>
                ) : (
                  myListings.map(l => (
                    <MyListingRow
                      key={l.id}
                      listing={l}
                      onClose={id => closeListing.mutate(id)}
                      onDelete={id => deleteListing.mutate(id)}
                    />
                  ))
                )}
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>

      {/* Sheet */}
      <SheetPasangIklan
        isOpen={sheetOpen}
        onClose={() => setSheetOpen(false)}
        profile={profile}
      />
    </div>
  )
}
