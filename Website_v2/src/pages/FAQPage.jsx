import React, { useState, useRef } from 'react'
import { Link } from 'react-router-dom'
import { motion } from 'framer-motion'
import { ChevronDown, Search, X, ChevronLeft } from 'lucide-react'
import SEO from '../components/SEO'
import { useMediaQuery } from '@/lib/hooks/useMediaQuery'
import { FAQ_DATA, FAQ_CATEGORIES } from '../lib/faqData'
import Footer from '../components/Footer'

// ── FAQ Accordion Item — pakai <details>/<summary> agar jawaban selalu ada di DOM ──
// Kritis untuk SSG: answer text harus ada di HTML output, bukan hanya setelah JS klik.
// Googlebot smartphone membaca SSG HTML sebelum hydration.
function FAQItem({ item, accentColor = 'emerald' }) {
  const iconColor = accentColor === 'amber' ? 'text-amber-400' : 'text-emerald-400'
  const borderColor = accentColor === 'amber'
    ? 'border-amber-500/20 hover:border-amber-500/40'
    : 'border-emerald-500/10 hover:border-emerald-500/25'

  return (
    <details
      className={`group border rounded-xl transition-colors duration-200 overflow-hidden ${borderColor} bg-transparent open:border-white/10 open:bg-white/[0.03]`}
    >
      {/* Question — selalu tampil */}
      <summary className="flex items-start justify-between gap-4 px-5 py-4 cursor-pointer list-none select-none">
        <span className="text-sm font-semibold text-[#CBD5E1] leading-snug group-hover:text-white transition-colors">
          {item.q}
        </span>
        <ChevronDown
          size={16}
          className={`shrink-0 mt-0.5 transition-transform duration-200 ${iconColor} group-open:rotate-180`}
        />
      </summary>

      {/*
        Answer — SELALU ADA di DOM (tidak pakai open && ...).
        CSS mengatur visibilitas via max-height transition.
        Kritis untuk SSG/crawler: Googlebot membaca HTML sebelum JS hydration.
      */}
      <div className="px-5 pb-4 text-sm text-[#64748B] leading-relaxed">
        {item.a}
        {item.link && (
          <Link
            to={item.link}
            className={`ml-2 text-xs font-semibold ${accentColor === 'amber' ? 'text-amber-400 hover:text-amber-300' : 'text-emerald-400 hover:text-emerald-300'} transition-colors`}
          >
            Pelajari lebih →
          </Link>
        )}
      </div>
    </details>
  )
}

// ── Category accent map ────────────────────────────────────────────────────────
const ACCENT = {
  umum: 'emerald',
  broker_ayam: 'emerald',
  broker_telur: 'amber',
  sembako: 'amber',
  peternak_ayam: 'emerald',
  peternak_ruminansia: 'emerald',
  teknis: 'emerald',
}

// ── Supported Businesses Data — sumber kebenaran vertikal TernakOS ─────────────
// status: 'didukung' | 'pengembangan' | 'kustomisasi'
const SUPPORTED_BUSINESSES = [
  {
    icon: '🐄',
    name: 'Peternak Sapi Potong (Fattening)',
    detail: 'Batch penggemukan, ADG, FCR, R/C ratio, BEP, kartu ternak per ekor, denah kandang, laporan laba-rugi.',
    status: 'didukung',
  },
  {
    icon: '🐄',
    name: 'Peternak Sapi Breeding',
    detail: 'Database herd, IB/kawin alam, tracking kehamilan, pencatatan kelahiran pedet, conception rate, calving interval.',
    status: 'didukung',
  },
  {
    icon: '🐄',
    name: 'Peternak Sapi Perah',
    detail: 'Recording produksi susu, manajemen laktasi, inventori produk susu. Dalam pengembangan aktif.',
    status: 'pengembangan',
  },
  {
    icon: '🐑',
    name: 'Peternak Domba Potong (Fattening)',
    detail: 'Batch fattening, kartu ternak individual, ADG, FCR, estimasi bobot panen, laporan laba-rugi per batch.',
    status: 'didukung',
  },
  {
    icon: '🐑',
    name: 'Peternak Domba Breeding',
    detail: 'Manajemen reproduksi domba, tracking kehamilan, pencatatan kelahiran, dan KPI reproduksi herd.',
    status: 'didukung',
  },
  {
    icon: '🐐',
    name: 'Peternak Kambing Potong (Fattening)',
    detail: 'Batch fattening, kartu ternak, ADG, FCR, estimasi bobot panen Idul Adha, laporan batch.',
    status: 'didukung',
  },
  {
    icon: '🐐',
    name: 'Peternak Kambing Breeding',
    detail: 'Tracking IB/kawin alam, status kehamilan, kelahiran cempe, conception rate, calving interval.',
    status: 'didukung',
  },
  {
    icon: '🥛',
    name: 'Peternak Kambing Perah',
    detail: 'Recording susu 3 sesi/hari, yield & fat%, inventori produk susu, penjualan ke pelanggan.',
    status: 'didukung',
  },
  {
    icon: '🐔',
    name: 'Peternak Ayam Broiler',
    detail: 'Siklus DOC → panen, recording harian, FCR, IP Score, kemitraan INTI-Plasma, laporan per siklus.',
    status: 'didukung',
  },
  {
    icon: '🤝',
    name: 'Broker / Pengepul Ayam',
    detail: 'Beli dari peternak, jual ke RPA/pasar, manajemen hutang-piutang, pengiriman, dan laporan margin.',
    status: 'didukung',
  },
  {
    icon: '🥚',
    name: 'Broker / Pedagang Telur',
    detail: 'POS telur berbasis grade (A/B/C), stok per grade, piutang pelanggan, laporan penjualan.',
    status: 'didukung',
  },
  {
    icon: '🏪',
    name: 'Agen / Distributor Sembako',
    detail: 'Manajemen stok FIFO multi-item (beras, minyak, gula), laporan penjualan, analisis margin.',
    status: 'didukung',
  },
  {
    icon: '🔪',
    name: 'Rumah Potong Ayam (RPA)',
    detail: 'Order dari broker, stok bahan baku, hutang ke supplier, distribusi produk jadi ke pelanggan.',
    status: 'didukung',
  },
  {
    icon: '🐔',
    name: 'Peternak Ayam Layer / Petelur',
    detail: 'Modul layer terintegrasi dengan ekosistem broker telur. Konfigurasi tersedia untuk profil layer.',
    status: 'kustomisasi',
  },
]

// ── Curated FAQ Schema — 15 pertanyaan utama untuk JSON-LD FAQPage ───────────────
// Rules: (1) max ~15 item, (2) semua Q&A ini ada di accordion halaman /faq,
// (3) tidak ada undefined/null, (4) JSON.stringify otomatis escape.
// Catatan: FAQ rich results deprecated Google 7 Mei 2026. Schema ini untuk
// AI structured content understanding (Google AI Overview, Perplexity, dll),
// bukan untuk rich snippet visual di search results.
const CURATED_FAQ_SCHEMA = [
  {
    '@type': 'Question',
    name: 'Apakah TernakOS hanya untuk ayam?',
    acceptedAnswer: { '@type': 'Answer', text: 'Tidak. TernakOS mendukung berbagai jenis usaha peternakan dan perdagangan ternak di Indonesia, tidak terbatas pada ayam. Platform ini digunakan oleh peternak sapi potong, sapi perah (dalam pengembangan), domba, kambing potong, kambing breeding, kambing perah, peternak broiler, broker ayam, broker telur, agen sembako, dan rumah potong ayam (RPA). Setiap vertikal memiliki modul dan fitur yang disesuaikan dengan kebutuhan spesifiknya.' },
  },
  {
    '@type': 'Question',
    name: 'Jenis peternakan apa saja yang didukung TernakOS?',
    acceptedAnswer: { '@type': 'Answer', text: 'TernakOS mendukung enam kategori bisnis peternakan: (1) Peternak Unggas (broiler mandiri dan mitra sistem kemitraan INTI-Plasma). (2) Peternak Sapi (fattening/penggemukan dan breeding/pembibitan). (3) Peternak Domba (fattening dan breeding). (4) Peternak Kambing (fattening, breeding, dan perah/susu). (5) Broker & Trader (broker ayam, broker telur, dan agen sembako/distributor). (6) Industri Hilir (rumah potong ayam/RPA). Modul sapi perah sedang dalam pengembangan aktif.' },
  },
  {
    '@type': 'Question',
    name: 'Apakah TernakOS bisa untuk peternak sapi?',
    acceptedAnswer: { '@type': 'Answer', text: 'Ya, TernakOS sepenuhnya mendukung peternak sapi. Tersedia dua modul sapi: (1) Sapi Fattening (Penggemukan) untuk kelola batch sapi masuk, catat pertumbuhan harian, hitung ADG, FCR, R/C ratio, BEP, denah kandang per pen, kartu ternak digital per ekor, dan laporan laba-rugi per batch. (2) Sapi Breeding (Pembibitan) untuk manajemen database herd, IB atau kawin alam, tracking kehamilan, pencatatan kelahiran pedet, dan laporan conception rate serta calving interval.' },
  },
  {
    '@type': 'Question',
    name: 'Apakah TernakOS bisa untuk peternak domba dan kambing?',
    acceptedAnswer: { '@type': 'Answer', text: 'Ya. TernakOS mendukung penuh peternak domba potong, kambing potong, kambing breeding, dan kambing perah. Untuk domba dan kambing potong/fattening: manajemen batch, kartu ternak individual, ADG, FCR, estimasi bobot panen, denah kandang, dan laporan laba-rugi. Untuk kambing breeding: tracking IB, kawin alam, kehamilan, kelahiran cempe, dan KPI reproduksi. Untuk kambing perah: recording susu per sesi (pagi/siang/sore), inventori produk susu, dan manajemen pelanggan.' },
  },
  {
    '@type': 'Question',
    name: 'Apa perbedaan antara peran peternak, broker, dan RPA di TernakOS?',
    acceptedAnswer: { '@type': 'Answer', text: 'Di TernakOS, tiga peran ini memiliki fungsi berbeda: (1) Peternak untuk mengelola kandang/farm, mencatat produksi, pakan, kesehatan ternak, dan performa per siklus/batch. (2) Broker untuk mengelola rantai distribusi: beli dari peternak, jual ke RPA atau pasar, catat hutang/piutang, dan kelola pengiriman. (3) RPA (Rumah Potong Ayam) untuk mengelola order masuk dari broker/pelanggan, stok bahan baku, hutang ke supplier, dan distribusi produk jadi. Satu akun bisa memiliki kombinasi beberapa tipe bisnis sekaligus.' },
  },
  {
    '@type': 'Question',
    name: 'Apakah TernakOS bisa digunakan di HP?',
    acceptedAnswer: { '@type': 'Answer', text: 'TernakOS adalah Progressive Web App (PWA) yang berjalan langsung di browser Chrome, Safari, atau Firefox tanpa perlu download dari Play Store atau App Store. Kamu bisa tambahkan ke home screen HP untuk pengalaman seperti aplikasi native.' },
  },
  {
    '@type': 'Question',
    name: 'Apakah TernakOS bisa untuk bisnis selain peternakan, seperti perdagangan telur atau sembako?',
    acceptedAnswer: { '@type': 'Answer', text: 'Ya. TernakOS bukan hanya untuk kandang, karena platform ini juga mencakup rantai pasok terkait peternakan: (1) Broker Telur (POS berbasis grade A/B/C, manajemen stok per grade, dan pencatatan piutang pelanggan). (2) Agen/Distributor Sembako (manajemen stok FIFO multi-item seperti beras, minyak, gula, laporan penjualan, dan analisis margin). Kedua modul ini berdiri sendiri, sehingga bisa digunakan tanpa harus punya kandang.' },
  },
  {
    '@type': 'Question',
    name: 'Apa itu TernakOS?',
    acceptedAnswer: { '@type': 'Answer', text: 'TernakOS adalah platform manajemen bisnis peternakan Indonesia berbasis cloud. Dirancang untuk semua jenis peternakan: broker ayam, peternak broiler, peternak sapi potong dan perah, peternak domba dan kambing, agen sembako, broker telur, dan rumah potong ayam (RPA). Semua bisa mengelola transaksi, stok, piutang, dan laporan keuangan dari HP tanpa instalasi software.' },
  },
  {
    '@type': 'Question',
    name: 'Apakah ada versi gratis TernakOS?',
    acceptedAnswer: { '@type': 'Answer', text: 'Ada. Kamu bisa menggunakan paket Starter secara gratis selamanya tanpa kartu kredit. Untuk fitur lebih lengkap, tersedia trial 14 hari untuk paket Pro dan Business.' },
  },
  {
    '@type': 'Question',
    name: 'Apakah data bisnis saya aman di TernakOS?',
    acceptedAnswer: { '@type': 'Answer', text: 'Ya. TernakOS menggunakan Row Level Security (RLS) PostgreSQL (standar keamanan bank) yang memastikan data bisnis kamu tidak bisa diakses oleh pengguna lain meskipun berada di platform yang sama. Setiap bisnis terisolasi penuh.' },
  },
  {
    '@type': 'Question',
    name: 'Apakah TernakOS bisa dipakai untuk lebih dari satu jenis bisnis dalam satu akun?',
    acceptedAnswer: { '@type': 'Answer', text: 'Bisa. Satu akun login bisa terhubung ke beberapa bisnis sekaligus, misalnya kamu punya kandang broiler sekaligus usaha broker ayam. Tinggal switch bisnis dari dashboard utama tanpa perlu login ulang.' },
  },
  {
    '@type': 'Question',
    name: 'Apakah TernakOS mendukung manajemen batch sapi potong penggemukan (fattening)?',
    acceptedAnswer: { '@type': 'Answer', text: 'Ya. TernakOS menyediakan modul batch fattening untuk sapi potong: buat batch baru (chick-in sapi), catat pertumbuhan harian, pantau ADG dan FCR per batch, catat penjualan ekor per ekor atau per batch, dan tutup batch dengan laporan laba-rugi final.' },
  },
  {
    '@type': 'Question',
    name: 'Apakah TernakOS mendukung peternak kambing potong dan domba potong?',
    acceptedAnswer: { '@type': 'Answer', text: 'Ya. TernakOS menyediakan modul terpisah untuk kambing potong (fattening dan breeding) dan domba potong (fattening dan breeding). Fitur-fiturnya serupa dengan sapi: batch management, kartu ternak individual, ADG, FCR, R/C ratio, dan laporan laba-rugi.' },
  },
  {
    '@type': 'Question',
    name: 'Bagaimana cara mengelola batch domba menjelang Idul Adha di TernakOS?',
    acceptedAnswer: { '@type': 'Answer', text: 'Buat batch fattening domba dengan target tanggal panen sebelum Idul Adha. Pantau ADG harian untuk memastikan domba mencapai bobot target (minimal 25 kg). TernakOS menampilkan estimasi bobot panen berdasarkan tren ADG saat ini.' },
  },
  {
    '@type': 'Question',
    name: 'Apakah TernakOS mendukung peternak kambing perah (susu)?',
    acceptedAnswer: { '@type': 'Answer', text: 'Ya. TernakOS memiliki modul kambing perah dengan fitur: database kambing per status laktasi, recording produksi susu harian tiga sesi (pagi, siang, sore), tracking yield per ekor dan fat%, inventori produk susu, dan penjualan susu ke pelanggan.' },
  },
]

// ── Main Page ─────────────────────────────────────────────────────────────────
export default function FAQPage() {
  const [query, setQuery] = useState('')
  const [activeCategory, setActiveCategory] = useState(null)
  const isDesktop = useMediaQuery('(min-width: 1024px)')
  const sectionRefs = useRef({})

  const faqSchema = {
    '@context': 'https://schema.org',
    '@type': 'FAQPage',
    mainEntity: CURATED_FAQ_SCHEMA,
  }

  // Filtered results across all categories
  const trimmed = query.trim().toLowerCase()
  const filtered = trimmed
    ? FAQ_CATEGORIES.flatMap(cat => {
      const items = (FAQ_DATA[cat.id] || []).filter(
        item =>
          item.q.toLowerCase().includes(trimmed) ||
          item.a.toLowerCase().includes(trimmed)
      )
      return items.length ? [{ ...cat, items }] : []
    })
    : FAQ_CATEGORIES.map(cat => ({ ...cat, items: FAQ_DATA[cat.id] || [] }))

  const totalVisible = filtered.reduce((n, c) => n + c.items.length, 0)

  function scrollTo(id) {
    setActiveCategory(id)
    const el = sectionRefs.current[id]
    if (el) {
      const y = el.getBoundingClientRect().top + window.scrollY - 100
      window.scrollTo({ top: y, behavior: 'smooth' })
    }
  }

  return (
    <div className="min-h-screen bg-[#06090F] text-[#F1F5F9] font-sans selection:bg-emerald-500/30 overflow-x-hidden">
      <SEO
        title="FAQ TernakOS: Sapi, Domba, Kambing, Broiler, Broker & RPA | Semua yang Perlu Anda Tahu"
        description="TernakOS mendukung peternak sapi, domba, kambing, broiler, broker ayam, broker telur, agen sembako, dan RPA. Temukan jawaban lengkap tentang fitur, keamanan, dan harga di halaman FAQ."
        path="/faq"
        schema={faqSchema}
      />

      {/* ── Header ── */}
      <header className="border-b border-white/5 bg-[#0C1319]/60 backdrop-blur-xl sticky top-0 z-50">
        <div className="max-w-5xl mx-auto px-6 h-16 flex items-center justify-between">
          <Link to="/" className="flex items-center gap-2.5 group">
            <img src="/favicon.svg" alt="TernakOS" className="w-8 h-8 rounded-lg group-hover:scale-105 transition-transform" />
            <span className="font-display font-black text-lg tracking-tight">TernakOS</span>
          </Link>
          <Link
            to="/"
            className="flex items-center gap-1.5 text-sm font-semibold text-[#64748B] hover:text-white transition-colors"
          >
            <ChevronLeft size={15} />
            Beranda
          </Link>
        </div>
      </header>

      {/* ── Hero ── */}
      <section className="pt-32 md:pt-24 pb-12 px-6 border-b border-white/5 relative overflow-hidden">
        <div className="absolute inset-0 bg-gradient-to-b from-emerald-500/5 to-transparent pointer-events-none" />
        <div className="max-w-3xl mx-auto relative z-10 text-center">
          <motion.div
            initial={{ opacity: 0, y: 18 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.45 }}
          >
            <p className="text-[11px] font-bold uppercase tracking-widest text-emerald-400 mb-4">
              Pusat Bantuan & FAQ
            </p>
            <h1 className={`font-display ${isDesktop ? 'text-4xl md:text-5xl' : 'text-3xl'} font-black tracking-tight ${isDesktop ? 'leading-none' : 'leading-[1.2]'} mb-4`}>
              Pertanyaan yang <span className="text-emerald-400">Sering Ditanya</span>
            </h1>
            <p className="text-[#4B6478] text-base md:text-lg max-w-xl mx-auto leading-relaxed mb-8">
              {totalVisible} pertanyaan tersedia untuk menemukan jawaban seputar fitur, keamanan, harga, dan cara kerja TernakOS.
            </p>

            {/* Search */}
            <div className="relative max-w-lg mx-auto">
              <Search size={16} className="absolute left-4 top-1/2 -translate-y-1/2 text-[#4B6478] pointer-events-none" />
              <input
                type="search"
                value={query}
                onChange={e => setQuery(e.target.value)}
                placeholder="Cari pertanyaan... (misal: FIFO, FCR, RLS)"
                className="w-full pl-11 pr-10 py-3 rounded-xl bg-white/5 border border-white/10 text-sm text-white placeholder-[#4B6478] focus:outline-none focus:border-emerald-500/50 focus:bg-white/[0.07] transition-all"
              />
              {query && (
                <button
                  onClick={() => setQuery('')}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-[#4B6478] hover:text-white transition-colors"
                >
                  <X size={15} />
                </button>
              )}
            </div>
          </motion.div>
        </div>
      </section>

      {/* ── Supported Businesses Summary — kritis untuk AI/crawler, tidak tersembunyi di accordion ── */}
      {!trimmed && (
        <section className="border-b border-white/5 bg-white/[0.015]">
          <div className="max-w-5xl mx-auto px-6 py-10">
            <motion.div
              initial={{ opacity: 0, y: 14 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.4, delay: 0.1 }}
            >
              <h2 className="text-base font-bold text-white mb-1">
                Jenis Peternakan dan Bisnis yang Didukung TernakOS
              </h2>
              <p className="text-sm text-[#4B6478] mb-6">
                TernakOS bukan hanya untuk ayam. Platform ini dirancang untuk seluruh rantai bisnis peternakan Indonesia.
              </p>

              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
                {SUPPORTED_BUSINESSES.map((biz, i) => (
                  <div
                    key={i}
                    className="flex items-start gap-3 p-3.5 rounded-xl border border-white/5 bg-white/[0.02] hover:border-white/10 transition-colors"
                  >
                    <span className="text-lg shrink-0 mt-0.5">{biz.icon}</span>
                    <div className="min-w-0">
                      <p className="text-sm font-semibold text-[#CBD5E1] leading-snug">{biz.name}</p>
                      <p className="text-xs text-[#4B6478] mt-0.5 leading-relaxed">{biz.detail}</p>
                      <span className={`inline-block mt-1.5 text-[10px] font-bold uppercase tracking-wider px-2 py-0.5 rounded-full ${
                        biz.status === 'didukung'
                          ? 'bg-emerald-500/15 text-emerald-400'
                          : biz.status === 'pengembangan'
                          ? 'bg-amber-500/15 text-amber-400'
                          : 'bg-blue-500/15 text-blue-400'
                      }`}>
                        {biz.status === 'didukung' ? '✓ Didukung'
                          : biz.status === 'pengembangan' ? '⏳ Dalam Pengembangan'
                          : '⚙ Bisa Dikustomisasi'}
                      </span>
                    </div>
                  </div>
                ))}
              </div>

              <p className="text-xs text-[#4B6478] mt-5">
                Lihat detail fitur per vertikal di halaman{' '}
                <Link to="/fitur" className="text-emerald-400 hover:text-emerald-300 transition-colors">Fitur →</Link>
              </p>
            </motion.div>
          </div>
        </section>
      )}

      {/* ── Category Nav Pills ── */}
      {!trimmed && (
        <nav className="sticky top-16 z-40 bg-[#06090F]/90 backdrop-blur-xl border-b border-white/5">
          <div className="max-w-5xl mx-auto px-6 py-3 flex gap-2 overflow-x-auto scrollbar-none">
            {FAQ_CATEGORIES.map(cat => (
              <button
                key={cat.id}
                onClick={() => scrollTo(cat.id)}
                className={`shrink-0 flex items-center gap-1.5 px-3.5 py-1.5 rounded-full text-xs font-semibold border transition-all ${activeCategory === cat.id
                    ? 'border-emerald-500/50 bg-emerald-500/10 text-emerald-300'
                    : 'border-white/10 bg-white/[0.03] text-[#64748B] hover:text-white hover:border-white/20'
                  }`}
              >
                <img src={cat.icon} alt="" className="w-4 h-4 object-contain" />
                <span>{cat.label}</span>
                <span className="text-[10px] opacity-60">({cat.count})</span>
              </button>
            ))}
          </div>
        </nav>
      )}

      {/* ── Content ── */}
      <main className="max-w-3xl mx-auto px-6 py-12 space-y-16">

        {/* Search result header */}
        {trimmed && (
          <div className="text-sm text-[#4B6478]">
            <span className="text-white font-semibold">{totalVisible}</span> hasil untuk{' '}
            <span className="text-emerald-400">"{query}"</span>
          </div>
        )}

        {totalVisible === 0 && (
          <div className="text-center py-20 text-[#4B6478]">
            <p className="text-4xl mb-4">🔍</p>
            <p className="font-semibold text-white mb-2">Tidak ada hasil ditemukan</p>
            <p className="text-sm">Coba kata kunci lain, atau{' '}
              <a
                href="https://wa.me/6281234567890"
                target="_blank"
                rel="noopener noreferrer"
                className="text-emerald-400 hover:text-emerald-300 transition-colors"
              >
                tanya langsung via WhatsApp
              </a>.
            </p>
          </div>
        )}

        {filtered.map(cat => (
          <section
            key={cat.id}
            ref={el => { sectionRefs.current[cat.id] = el }}
            id={`faq-${cat.id}`}
          >
            {/* Category heading */}
            <div className="flex items-center gap-3 mb-6">
              <img src={cat.icon} alt="" className="w-8 h-8 object-contain" />
              <div>
                <h2 className="font-display text-lg font-bold text-white leading-none">
                  {cat.label}
                </h2>
                <p className="text-xs text-[#4B6478] mt-0.5">{cat.items.length} pertanyaan</p>
              </div>
            </div>

            <div className="space-y-2">
              {cat.items.map((item, i) => (
                <FAQItem key={i} item={item} accentColor={ACCENT[cat.id]} />
              ))}
            </div>
          </section>
        ))}

        {/* CTA bottom */}
        {!trimmed && (
          <div className="text-center border-t border-white/5 pt-14">
            <p className="text-[#4B6478] text-sm mb-4">
              Tidak menemukan jawaban yang kamu cari?
            </p>
            <div className="flex flex-col sm:flex-row items-center justify-center gap-3">
              <a
                href="https://wa.me/6281234567890"
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center gap-2 px-6 py-3 bg-emerald-500 hover:bg-emerald-400 text-white text-sm font-bold rounded-xl transition-all shadow-[0_4px_20px_rgba(2, 26, 2,0.25)]"
              >
                💬 Hubungi Support via WhatsApp
              </a>
              <Link
                to="/register"
                className="inline-flex items-center gap-2 px-6 py-3 bg-white/5 hover:bg-white/10 text-white text-sm font-semibold rounded-xl border border-white/10 hover:border-white/20 transition-all"
              >
                Mulai Sekarang →
              </Link>
            </div>
          </div>
        )}
      </main>

      <Footer />
    </div>
  )
}
