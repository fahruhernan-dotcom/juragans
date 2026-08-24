import React from 'react';
import { motion } from 'framer-motion';
import {
  Eye, Target, CheckCircle, ArrowRight, Heart, Rocket, Calendar,
  Handshake, Bird, Factory, FileX, BarChart2, TrendingDown, Wrench, Check,
  Leaf, Package,
} from 'lucide-react';
import { Link } from 'react-router-dom';
import SEO from '../components/SEO';
import Navbar from '../components/Navbar';
import Footer from '../components/Footer';
import SplineScene from '../components/SplineScene';
import BlurText from '../components/reactbits/BlurText';
import AnimatedContent from '../components/reactbits/AnimatedContent';
import Particles from '../components/reactbits/Particles';
import CountUp from '../components/reactbits/CountUp';
import { useMediaQuery } from '@/lib/hooks/useMediaQuery';
import { usePlatformStats } from '@/lib/hooks/usePlatformStats';


// ─── Animation helper ─────────────────────────────────────────────────────────

function FadeUp({ children, delay = 0, className }) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 24 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true, margin: '-80px' }}
      transition={{ duration: 0.5, ease: 'easeOut', delay }}
      className={className}
    >
      {children}
    </motion.div>
  );
}

// ─── Page ─────────────────────────────────────────────────────────────────────

export default function AboutUs() {
  const isDesktop = useMediaQuery('(min-width: 1024px)');
  const { stats, loading } = usePlatformStats();

  const DASH = '\u2014'; // em dash untuk loading state

  return (
    <div className="min-h-screen bg-bg-base text-text-primary font-sans selection:bg-emerald-500/30 overflow-x-hidden">
      <SEO
        title="Tentang Kami - TernakOS | Platform Agribisnis: Peternak, Broker, RPA & Sembako"
        description="TernakOS adalah platform manajemen agribisnis Indonesia yang mendukung peternak broiler, domba, kambing & sapi, broker ayam, broker telur, distributor sembako, dan RPA. Dibangun oleh peternak, untuk seluruh rantai pasok."
        path="/tentang-kami"
      />
      <Navbar />

      <main className="w-full">

        {/* ══════════════════════════════════════════════
            SECTION HERO — LOCKED: DO NOT MODIFY
        ══════════════════════════════════════════════ */}
        <section
          className="relative px-5 md:px-10 lg:px-20 pt-32 pb-16 md:h-[750px] lg:h-[800px] flex items-center overflow-hidden bg-bg-base"
          style={{ background: 'var(--bg-base-val, #06090F)' }}
        >
          {/* Background Effects */}
          <div className="absolute inset-0 pointer-events-none">
            <Particles
              quantity={40}
              color="#021a02"
              opacity={0.1}
              className="absolute inset-0"
            />

            {/* Spotlight Effect */}
            <div className="absolute -top-[10%] -left-[10%] w-[120%] h-[120%] pointer-events-none opacity-20">
              <svg
                viewBox="0 0 1000 1000"
                fill="none"
                xmlns="http://www.w3.org/2000/svg"
                className="w-full h-full"
              >
                <circle cx="200" cy="200" r="400" fill="url(#hero-spotlight)" />
                <defs>
                  <radialGradient
                    id="hero-spotlight"
                    cx="0"
                    cy="0"
                    r="1"
                    gradientUnits="userSpaceOnUse"
                    gradientTransform="translate(200 200) rotate(90) scale(400)"
                  >
                    <stop stopColor="#021a02" />
                    <stop offset="1" stopColor="#021a02" stopOpacity="0" />
                  </radialGradient>
                </defs>
              </svg>
            </div>
          </div>

          <div className="relative z-10 max-w-[1280px] mx-auto w-full flex items-center pointer-events-none">
            {/* Kolom kiri — teks */}
            <div className={`relative w-full md:w-1/2 ${isDesktop ? 'py-24' : 'py-10'} pointer-events-auto`}>
              {/* Overlay KIRI */}
              <div
                className="absolute left-[-100vw] right-0 inset-y-0 pointer-events-none"
                style={{
                  background: 'linear-gradient(to right, var(--bg-base-val, #06090F) 60%, transparent 100%)',
                  zIndex: 1
                }}
              />
              <div className="relative z-10 space-y-8 max-w-xl mx-auto md:mx-0">
                <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-[#f0fdf4] dark:bg-emerald-950/20 border border-slate-200 dark:border-white/10 text-emerald-800 dark:text-emerald-300 text-sm font-bold">
                  <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 shrink-0" />
                  <span>Dibangun oleh peternak, untuk seluruh rantai pasok</span>
                </div>

                <div className="space-y-4">
                  <BlurText
                    text="Kami tahu bisnis peternakan karena kami bagian dari industri ini."
                    delay={100}
                    animateBy="words"
                    direction="top"
                    className={`font-display ${isDesktop ? 'text-5xl lg:text-6xl' : 'text-3xl'} font-black text-text-primary ${isDesktop ? 'leading-[1.1]' : 'leading-[1.2]'} tracking-tight`}
                  />
                </div>

                <AnimatedContent distance={20} duration={0.6}>
                  <p className="text-text-secondary text-base lg:text-lg max-w-xl leading-relaxed">
                    TernakOS lahir dari frustrasi nyata di lapangan, dibangun dengan teknologi terkini, untuk industri yang sudah waktunya bertransformasi.
                  </p>

                  <div className="pt-8 flex flex-wrap gap-4">
                    <Link
                      to="/register"
                      className="px-8 py-4 bg-emerald-600 hover:bg-emerald-500 text-white font-bold rounded-2xl transition-all shadow-lg shadow-emerald-500/20"
                    >
                      Mulai Gratis Sekarang
                    </Link>
                    <a
                      href="#cerita"
                      className="px-8 py-4 bg-bg-3/40 hover:bg-bg-3/70 text-text-primary font-bold rounded-2xl transition-all border border-border-default"
                    >
                      Pelajari Lebih Lanjut
                    </a>
                  </div>
                </AnimatedContent>
              </div>
            </div>
          </div>

          {/* Kolom kanan — Spline FULLSCREEN */}
          <div className="absolute right-0 top-0 hidden md:block w-1/2 h-full" style={{ background: 'transparent' }}>
            <SplineScene
              scene="https://prod.spline.design/kZDDjO5HuC9GJUM2/scene.splinecode"
              className="w-full h-full"
              style={{ width: '100%', height: '100%', background: 'transparent' }}
            />
          </div>
        </section>

        {/* ══════════════════════════════════════════════
            SECTION: STATS BAR
        ══════════════════════════════════════════════ */}
        <section className="bg-bg-1 border-y border-border-subtle py-12">
          <div className="max-w-5xl mx-auto px-6">
            <div className="grid grid-cols-2 md:grid-cols-4 gap-8">
              {[
                {
                  value: loading ? DASH : stats.active_users_text,
                  label: 'Pengguna Aktif',
                  isLive: !loading,
                },
                {
                  value: loading ? DASH : stats.total_transactions_text,
                  label: 'Aktivitas Transaksi',
                  isLive: !loading,
                },
                {
                  value: loading ? DASH : stats.transaction_volume_text,
                  label: 'Volume Penjualan',
                  isLive: !loading,
                },
                {
                  value: '10+',
                  label: 'Model Bisnis Aktif',
                  isLive: false,
                },
              ].map((stat, i) => (
                <FadeUp key={i} delay={i * 0.1} className={`text-center ${i < 3 ? 'md:border-r border-border-subtle' : ''}`}>
                  <div className="font-display text-3xl font-black text-text-primary mb-1">
                    {stat.value}
                  </div>
                  <div className="flex items-center justify-center gap-1.5 text-[11px] uppercase tracking-widest text-text-muted mt-1">
                    {stat.isLive && (
                      <span className="w-[5px] h-[5px] rounded-full bg-emerald-400 animate-pulse inline-block" title="Data real-time" />
                    )}
                    {stat.label}
                  </div>
                </FadeUp>
              ))}
            </div>
          </div>
        </section>

        {/* ══════════════════════════════════════════════
            SECTION: SUDAH BISA DIPAKAI
        ══════════════════════════════════════════════ */}
        <section className="py-20 bg-bg-base">
          <div className="max-w-6xl mx-auto px-6">

            <FadeUp className="text-center mb-12">
              <p className="text-[11px] font-bold uppercase tracking-widest text-emerald-800 dark:text-emerald-300 mb-5">
                SUDAH BISA DIPAKAI
              </p>
              <h2 className="font-display text-4xl font-bold text-text-primary leading-tight mb-3">
                Semua vertikal ini sudah live hari ini.
              </h2>
              <p className="text-text-secondary text-sm">Tidak ada yang masih "coming soon" di bagian ini.</p>
            </FadeUp>

            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
              {[
                {
                  badge: 'PETERNAK',
                  title: 'Broiler / Ayam Pedaging',
                  desc: 'FCR, deplesi, siklus & biaya produksi per kg.',
                  badgeCls: 'bg-[#f0fdf4] dark:bg-emerald-950/20 text-emerald-800 dark:text-emerald-300',
                  borderCls: 'hover:border-emerald-500/25',
                  dotCls: 'bg-emerald-500',
                },
                {
                  badge: 'PETERNAK',
                  title: 'Fattening Domba, Kambing & Sapi',
                  desc: 'ADG, FCR, mortalitas & laba per ekor per batch.',
                  badgeCls: 'bg-[#f0fdf4] dark:bg-emerald-950/20 text-emerald-800 dark:text-emerald-300',
                  borderCls: 'hover:border-emerald-500/25',
                  dotCls: 'bg-emerald-500',
                },
                {
                  badge: 'PETERNAK',
                  title: 'Breeding Domba, Kambing & Sapi',
                  desc: 'Kelola induk, reproduksi & penjualan bibit.',
                  badgeCls: 'bg-[#f0fdf4] dark:bg-emerald-950/20 text-emerald-800 dark:text-emerald-300',
                  borderCls: 'hover:border-emerald-500/25',
                  dotCls: 'bg-emerald-500',
                },
                {
                  badge: 'BROKER',
                  title: 'Broker Ayam',
                  desc: 'Margin, piutang RPA & susut pengiriman real-time.',
                  badgeCls: 'bg-blue-50 dark:bg-blue-950/20 text-blue-800 dark:text-blue-300',
                  borderCls: 'hover:border-blue-500/25',
                  dotCls: 'bg-blue-500',
                },
                {
                  badge: 'BROKER',
                  title: 'Broker Telur',
                  desc: 'Stok tray, POS penjualan & piutang agen.',
                  badgeCls: 'bg-violet-50 dark:bg-violet-950/20 text-violet-800 dark:text-violet-300',
                  borderCls: 'hover:border-violet-500/25',
                  dotCls: 'bg-violet-500',
                },
                {
                  badge: 'DISTRIBUTOR',
                  title: 'Distributor Sembako',
                  desc: 'Stok multi-produk, invoice, piutang & payroll.',
                  badgeCls: 'bg-orange-50 dark:bg-orange-950/20 text-orange-800 dark:text-orange-300',
                  borderCls: 'hover:border-orange-500/25',
                  dotCls: 'bg-orange-500',
                },
                {
                  badge: 'RUMAH POTONG',
                  title: 'RPA Ayam',
                  desc: 'Order, hutang ke broker & laporan margin produk.',
                  badgeCls: 'bg-amber-50 dark:bg-amber-950/20 text-amber-800 dark:text-amber-300',
                  borderCls: 'hover:border-amber-500/25',
                  dotCls: 'bg-amber-500',
                },
              ].map(({ badge, title, desc, badgeCls, borderCls, dotCls }, i) => (
                <FadeUp key={i} delay={i * 0.06}>
                  <div className={`bg-bg-1 border border-border-subtle ${borderCls} rounded-2xl p-5 transition-all duration-300 h-full flex flex-col gap-3`}>
                    <div className="flex items-center justify-between">
                      <span className={`text-[10px] font-bold uppercase tracking-widest px-2.5 py-1 rounded-full ${badgeCls} border border-slate-200 dark:border-white/10`}>{badge}</span>
                      <span className="flex items-center gap-1.5 text-[10px] text-text-muted">
                        <span className={`w-[5px] h-[5px] rounded-full ${dotCls} animate-pulse`} />
                        Live
                      </span>
                    </div>
                    <h3 className="font-display text-[15px] font-bold text-text-primary leading-snug">{title}</h3>
                    <p className="text-[13px] text-text-secondary leading-relaxed mt-auto">{desc}</p>
                  </div>
                </FadeUp>
              ))}
            </div>

          </div>
        </section>

        {/* ══════════════════════════════════════════════
            SECTION: DIBANGUN UNTUK SIAPA
        ══════════════════════════════════════════════ */}
        <section className="py-24 bg-bg-base">
          <div className="max-w-6xl mx-auto px-6">

            <FadeUp className="text-center mb-16">
              <p className="text-[11px] font-bold uppercase tracking-widest text-emerald-800 dark:text-emerald-300 mb-5">
                UNTUK SIAPA
              </p>
              <h2 className="font-display text-4xl font-bold text-text-primary leading-tight">
                Dibangun untuk pelaku industri nyata.
              </h2>
            </FadeUp>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {[
                {
                  Icon: Bird,
                  iconCls: 'text-emerald-500 dark:text-emerald-400',
                  iconBg: 'bg-emerald-500/10',
                  badge: 'PETERNAK UNGGAS',
                  badgeCls: 'bg-[#f0fdf4] dark:bg-emerald-950/20 text-emerald-800 dark:text-emerald-300',
                  hoverBorder: 'hover:border-emerald-500/30',
                  title: 'Peternak Unggas',
                  pain: 'Pantau FCR, deplesi, dan siklus, serta catat panen per kg dari HP.',
                  features: [
                    'FCR & IP Score otomatis tiap input harian',
                    'Estimasi panen dari data pertumbuhan nyata',
                    'Breakdown biaya produksi per kg per siklus',
                  ],
                },
                {
                  Icon: Leaf,
                  iconCls: 'text-green-500 dark:text-green-400',
                  iconBg: 'bg-green-500/10',
                  badge: 'PETERNAK RUMINANSIA',
                  badgeCls: 'bg-[#f0fdf4] dark:bg-emerald-950/20 text-emerald-800 dark:text-emerald-300',
                  hoverBorder: 'hover:border-green-500/30',
                  title: 'Domba / Kambing / Sapi',
                  pain: 'Kelola batch fattening atau program breeding, dengan metrik ADG dan laba per ekor tersaji otomatis.',
                  features: [
                    'ADG & FCR per batch dengan alert abnormal',
                    'Tracking kesehatan & vaksinasi per ekor',
                    'Laporan batch: beli → panen → laba bersih',
                  ],
                },
                {
                  Icon: Handshake,
                  iconCls: 'text-blue-500 dark:text-blue-400',
                  iconBg: 'bg-blue-500/10',
                  badge: 'BROKER',
                  badgeCls: 'bg-blue-50 dark:bg-blue-950/20 text-blue-800 dark:text-blue-300',
                  hoverBorder: 'hover:border-blue-500/30',
                  title: 'Broker Ayam & Telur',
                  pain: 'Beli dari kandang, jual ke RPA, dengan margin dan piutang terpantau real-time.',
                  features: [
                    'Piutang RPA dengan alert jatuh tempo otomatis',
                    'Margin per transaksi & susut pengiriman',
                    'Stok tray telur & POS penjualan',
                  ],
                },
                {
                  Icon: Package,
                  iconCls: 'text-orange-500 dark:text-orange-400',
                  iconBg: 'bg-orange-500/10',
                  badge: 'DISTRIBUTOR',
                  badgeCls: 'bg-orange-50 dark:bg-orange-950/20 text-orange-800 dark:text-orange-300',
                  hoverBorder: 'hover:border-orange-500/30',
                  title: 'Distributor Sembako',
                  pain: 'Distribusi ke puluhan toko, dengan stok, invoice, piutang, dan gaji pegawai dalam satu layar.',
                  features: [
                    'Stok multi-produk dengan notifikasi habis',
                    'Invoice & piutang pelanggan dengan due date',
                    'Payroll pegawai & laporan pengiriman harian',
                  ],
                },
                {
                  Icon: Factory,
                  iconCls: 'text-amber-500 dark:text-amber-400',
                  iconBg: 'bg-amber-500/10',
                  badge: 'RUMAH POTONG',
                  badgeCls: 'bg-amber-50 dark:bg-amber-950/20 text-amber-800 dark:text-amber-300',
                  hoverBorder: 'hover:border-amber-500/30',
                  title: 'RPA Ayam',
                  pain: 'Beli dari broker, potong, distribusi, dengan hutang dan margin terpantau dari kedua sisi.',
                  features: [
                    'Hutang ke broker tercatat transparan kedua pihak',
                    'Order management & tracking distribusi produk',
                    'Laporan margin per produk & customer',
                  ],
                },
              ].map(({ Icon, iconCls, iconBg, badge, badgeCls, hoverBorder, title, pain, features }, i) => (
                <FadeUp key={i} delay={i * 0.1}>
                  <div className={`group relative bg-bg-1/40 dark:bg-white/[0.02] border border-border-subtle dark:border-white/8 ${hoverBorder} transition-all duration-300 h-full flex flex-col shadow-card hover:shadow-[0_20px_45px_rgba(2,26,2,0.12)] rounded-3xl p-8`}>
                    <div className="absolute inset-0 bg-gradient-to-br from-emerald-500/0 via-emerald-500/0 to-emerald-500/0 group-hover:from-emerald-500/5 group-hover:to-transparent transition-all duration-500 rounded-3xl" />
                    <div className={`relative z-10 w-12 h-12 rounded-2xl ${iconBg} flex items-center justify-center mb-6 shrink-0 group-hover:scale-110 transition-transform duration-300`}>
                      <Icon size={24} className={iconCls} />
                    </div>
                    <span className={`relative z-10 inline-block text-[10px] font-bold uppercase tracking-widest px-3 py-1 rounded-full mb-4 self-start ${badgeCls} border border-slate-200 dark:border-white/10`}>
                      {badge}
                    </span>
                    <h3 className="relative z-10 font-['Sora'] text-xl font-bold text-text-primary mb-3 tracking-tight">{title}</h3>
                    <p className="relative z-10 text-text-secondary text-sm leading-relaxed mb-6 font-medium">{pain}</p>
                    <ul className="relative z-10 space-y-3 mt-auto">
                      {features.map((f, j) => (
                        <li key={j} className="flex items-start gap-3 text-[13px] text-text-secondary">
                          <Check size={14} className="text-emerald-400 shrink-0 mt-0.5" />
                          {f}
                        </li>
                      ))}
                    </ul>
                  </div>
                </FadeUp>
              ))}
            </div>
          </div>
        </section>

        {/* ══════════════════════════════════════════════
            SECTION: ASAL USUL
        ══════════════════════════════════════════════ */}
        <section id="cerita" className="py-24 bg-bg-base">
          <div className="max-w-6xl mx-auto px-6">
            <div className="grid md:grid-cols-5 gap-12 md:gap-16 items-start">

              {/* KIRI — Narasi */}
              <div className="md:col-span-3">
                <FadeUp>
                  <p className="text-[11px] font-bold uppercase tracking-widest text-emerald-800 dark:text-emerald-300 mb-5">
                    ASAL USUL
                  </p>
                  <h2 className="font-display text-4xl font-bold text-text-primary leading-tight mb-8">
                    Dibangun dari kandang, bukan dari ruang rapat.
                  </h2>
                </FadeUp>

                <div className="space-y-5 mb-10">
                  {[
                    'TernakOS lahir dari masalah yang sangat nyata di lapangan: banyak peternak rakyat bekerja keras setiap hari, tetapi belum benar-benar tahu berapa biaya produksi sebenarnya.',
                    'Bukan karena mereka tidak mampu. Tapi karena selama ini sistemnya memang tidak pernah dibuat mudah.',
                    'Biaya pakan mungkin tercatat, tapi biaya tenaga, obat, listrik, air, transport, penyusutan kandang, kematian, susut bobot, dan waktu kerja keluarga sering terlewat. Akhirnya harga jual lebih sering mengikuti pasar, bukan dihitung dari HPP yang utuh.',
                    'Di banyak kasus, ternak dianggap seperti tabungan: beli bibit, pelihara, lalu jual saat butuh uang. Padahal di balik itu, ada biaya pemeliharaan yang diam-diam menggerus margin.',
                    'Ketika peternak tidak memegang angka pasti, posisi tawar ikut melemah. Pembeli yang punya hitungan lebih rapi bisa menentukan harga dengan lebih percaya diri, sementara peternak sulit membuktikan berapa sebenarnya batas aman harga jual mereka.',
                    'TernakOS dibangun untuk membantu peternak melihat angka yang selama ini tersembunyi: HPP per ekor, BEP jual, biaya operasional, margin bersih, dan performa kandang. Karena digitalisasi bukan sekadar memindahkan catatan kertas ke layar HP, tapi membuat peternak punya kendali atas angka bisnisnya sendiri.',
                  ].map((p, i) => (
                    <FadeUp key={i} delay={0.1 + i * 0.08}>
                      <p className="text-text-secondary leading-relaxed">{p}</p>
                    </FadeUp>
                  ))}
                </div>

                <div className="space-y-4">
                  {[
                    { Icon: FileX, text: 'HPP tidak lengkap karena banyak biaya tersembunyi' },
                    { Icon: BarChart2, text: 'Harga jual mengikuti pasar tanpa tahu batas aman' },
                    { Icon: TrendingDown, text: 'Margin terasa untung, padahal biaya pemeliharaan belum dihitung penuh' },
                  ].map(({ Icon, text }, i) => (
                    <FadeUp key={i} delay={0.4 + i * 0.08}>
                      <div className="flex items-center gap-3">
                        <Icon size={16} className="text-emerald-600 dark:text-emerald-400 shrink-0" />
                        <span className="text-text-secondary text-sm">{text}</span>
                      </div>
                    </FadeUp>
                  ))}
                </div>
              </div>

              {/* KANAN — Quote card */}
              <FadeUp delay={0.25} className="md:col-span-2">
                <div className="relative">
                  <div className="absolute inset-0 bg-emerald-500/3 rounded-3xl blur-xl pointer-events-none" />
                  <div className="relative bg-bg-1 rounded-3xl p-8 border border-border-subtle shadow-card">
                    <p
                      className="font-display text-8xl text-emerald-500/15 leading-none select-none mb-2"
                      aria-hidden="true"
                    >
                      "
                    </p>
                    <p className="font-display text-lg font-medium text-text-primary leading-relaxed">
                      Satu kesalahan pencatatan bisa mengubah untung menjadi rugi. Tapi satu sistem yang tepat bisa membantu peternak melihat bisnisnya dengan lebih jernih.
                    </p>
                    <p className="text-sm text-text-muted mt-4">— Fahrurosadi, Founder TernakOS</p>
                  </div>
                </div>
              </FadeUp>

            </div>
          </div>
        </section>

        {/* ══════════════════════════════════════════════
            SECTION FOUNDER — LOCKED: DO NOT MODIFY
        ══════════════════════════════════════════════ */}
        <section className="py-24 bg-bg-base w-full">
          <div className="max-w-5xl mx-auto px-6">
            <div className="flex flex-col md:flex-row gap-10 md:gap-16 items-start">
              {/* KOLOM KIRI — FOTO */}
              <motion.div
                initial={{ opacity: 0, x: -20 }}
                whileInView={{ opacity: 1, x: 0 }}
                viewport={{ once: true }}
                className="w-full md:w-[40%]"
              >
                <div className="relative overflow-hidden rounded-2xl min-h-[280px] md:min-h-[420px] bg-gradient-to-br from-bg-1 to-bg-base border border-border-subtle group shadow-card">
                  <img
                    src="/founder.jpg"
                    alt="Founder TernakOS"
                    className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-105"
                    style={{ position: 'absolute', top: 0, left: 0 }}
                    onError={(e) => {
                      e.target.style.display = 'none';
                      const placeholder = e.target.parentElement.querySelector('.founder-placeholder');
                      if (placeholder) placeholder.style.display = 'flex';
                    }}
                  />
                  <div className="founder-placeholder hidden absolute inset-0 flex items-center justify-center bg-gradient-to-br from-bg-1 to-bg-base">
                    <span className="font-display text-6xl font-black text-emerald-600 dark:text-emerald-400">FH</span>
                  </div>

                  {/* Overlay gradient bawah */}
                  <div className="absolute bottom-0 left-0 right-0 h-32 bg-gradient-to-t from-bg-base to-transparent pointer-events-none" />

                  {/* Floating badge */}
                  <div className="absolute bottom-5 left-5 bg-bg-1/90 border border-border-subtle rounded-xl px-4 py-2 backdrop-blur-sm shadow-xl">
                    <div className="text-emerald-600 dark:text-emerald-400 text-xs font-bold leading-tight">Peternak & Developer</div>
                    <div className="text-text-muted text-[10px] mt-0.5">Surakarta, Jawa Tengah</div>
                  </div>
                </div>
              </motion.div>

              {/* KOLOM KANAN — INFO */}
              <motion.div
                initial={{ opacity: 0, x: 20 }}
                whileInView={{ opacity: 1, x: 0 }}
                viewport={{ once: true }}
                className="w-full md:w-[60%] md:pl-10 pt-8 md:pt-0"
              >
                <div className="inline-block text-[9px] font-bold tracking-widest uppercase text-emerald-800 dark:text-emerald-300 bg-[#f0fdf4] dark:bg-emerald-950/20 border border-slate-200 dark:border-white/10 rounded-full px-3 py-1 mb-4">
                  FOUNDER & CEO
                </div>

                <h3 className="font-display text-3xl font-bold text-text-primary tracking-tight mb-1">
                  Fahrurosadi Hernan Sakti
                </h3>

                <p className="text-emerald-800 dark:text-emerald-300 text-sm font-semibold mb-5">
                  Founder & CEO · TernakOS
                </p>

                <div className="flex flex-wrap gap-2 mb-6">
                  {[
                    { text: 'Peternak Aktif', type: 'emerald' },
                    { text: 'Full-Stack Developer', type: 'emerald' },
                    { text: 'Automation Engineer', type: 'emerald' },
                    { text: 'Lulusan Peternakan UNS', type: 'grey' }
                  ].map((tag, i) => (
                    <span
                      key={i}
                      className={`text-[10px] font-medium rounded-md px-3 py-1.5 border ${tag.type === 'emerald'
                        ? 'bg-[#f0fdf4] dark:bg-emerald-950/20 border border-slate-200 dark:border-white/10 text-emerald-800 dark:text-emerald-300'
                        : 'bg-bg-2 border border-slate-200 dark:border-white/10 text-text-secondary'
                        }`}
                    >
                      {tag.text}
                    </span>
                  ))}
                </div>

                <div className="border-l-2 border-emerald-500/40 pl-4 mb-6">
                  <p className="italic text-text-muted text-sm leading-relaxed">
                    "Saya membangun TernakOS karena saya ada di industri ini, bukan sekadar mengamatinya dari luar. Dari kandang ke kode, semua berasal dari pengalaman nyata."
                  </p>
                </div>

                <div className="flex items-center gap-2 text-[10px] text-text-muted">
                  <div className="w-1.5 h-1.5 rounded-full bg-emerald-500 opacity-60" />
                  Surakarta, Jawa Tengah (Jantung industri peternakan Indonesia)
                </div>
              </motion.div>
            </div>
          </div>
        </section>

        {/* ══════════════════════════════════════════════
            SECTION: VISI & MISI
        ══════════════════════════════════════════════ */}
        <section className="py-24 bg-bg-base">
          <div className="max-w-6xl mx-auto px-6">

            <FadeUp className="text-center mb-16">
              <p className="text-[11px] font-bold uppercase tracking-widest text-emerald-800 dark:text-emerald-300 mb-5">
                ARAH KAMI
              </p>
              <h2 className="font-display text-4xl font-bold text-text-primary leading-tight">
                Visi &amp; Misi
              </h2>
            </FadeUp>

            <div className="grid md:grid-cols-2 gap-6">
              <FadeUp delay={0.1}>
                <div className="bg-bg-1 rounded-3xl p-8 border border-border-subtle border-l-2 border-l-emerald-500 h-full flex flex-col shadow-card">
                  <div className="w-10 h-10 rounded-xl bg-emerald-500/10 flex items-center justify-center mb-5 shrink-0">
                    <Eye size={20} className="text-emerald-600 dark:text-emerald-400" />
                  </div>
                  <h3 className="font-display text-xl font-bold text-text-primary mb-4">Visi</h3>
                  <p className="text-text-secondary leading-relaxed">
                    Menjadi ekosistem digital peternakan terpercaya di Indonesia, sebagai tempat setiap peternak, broker, dan mitra bisnis terhubung, bertumbuh, dan bersaing secara adil berdasarkan data yang nyata.
                  </p>
                </div>
              </FadeUp>

              <FadeUp delay={0.2}>
                <div className="bg-bg-1 rounded-3xl p-8 border border-border-subtle h-full flex flex-col shadow-card">
                  <div className="w-10 h-10 rounded-xl bg-emerald-500/10 flex items-center justify-center mb-5 shrink-0">
                    <Target size={20} className="text-emerald-600 dark:text-emerald-400" />
                  </div>
                  <h3 className="font-display text-xl font-bold text-text-primary mb-4">Misi</h3>
                  <ul className="space-y-4">
                    {[
                      'Mendigitalisasi seluruh rantai bisnis peternakan dalam satu platform yang mudah digunakan siapapun',
                      'Mewujudkan transparansi harga pasar dari transaksi nyata, bukan spekulasi atau monopoli',
                      'Membangun fondasi data agar setiap pelaku usaha bisa mengambil keputusan berdasarkan fakta',
                    ].map((item, i) => (
                      <li key={i} className="flex items-start gap-3">
                        <CheckCircle size={16} className="text-emerald-600 dark:text-emerald-400 shrink-0 mt-0.5" />
                        <span className="text-text-secondary text-sm leading-relaxed">{item}</span>
                      </li>
                    ))}
                  </ul>
                </div>
              </FadeUp>
            </div>
          </div>
        </section>

        {/* ══════════════════════════════════════════════
            SECTION: NILAI YANG KAMI PEGANG
        ══════════════════════════════════════════════ */}
        <section className="py-24 bg-bg-base">
          <div className="max-w-4xl mx-auto px-6">

            <FadeUp className="text-center mb-4">
              <p className="text-[11px] font-bold uppercase tracking-widest text-emerald-800 dark:text-emerald-300 mb-5">
                NILAI YANG KAMI PEGANG
              </p>
              <h2 className="font-display text-4xl font-bold text-text-primary leading-tight">
                Prinsip yang membentuk produk kami.
              </h2>
            </FadeUp>

            <div>
              {[
                { num: '01', Icon: Eye, title: 'Transparansi', body: 'Kami bangun fitur yang membuat semua angka terlihat jelas, seperti HPP, BEP, margin, dan biaya operasional terbuka di depan mata, bukan tersembunyi di balik rumus Excel.' },
                { num: '02', Icon: Wrench, title: 'Pragmatisme', body: 'Setiap fitur lahir dari kebutuhan nyata di lapangan. Kami tidak membangun sesuatu karena terdengar keren, melainkan karena ada peternak atau broker yang butuh itu hari ini.' },
                { num: '03', Icon: Heart, title: 'Keberpihakan', body: 'Berpihak pada peternak kecil dan broker independen, mereka yang selama ini tidak punya akses ke tools yang layak, tapi menanggung risiko bisnis yang sama besarnya.' },
              ].map(({ num, Icon, title, body }, i) => (
                <FadeUp key={i} delay={i * 0.08}>
                  <div className={`flex items-start gap-6 md:gap-10 py-10 ${i < 2 ? 'border-b border-border-subtle' : ''}`}>
                    <span
                      className="font-display text-6xl md:text-7xl font-black text-text-primary/5 leading-none shrink-0 select-none w-16 text-right"
                      aria-hidden="true"
                    >
                      {num}
                    </span>
                    <div className="flex items-start gap-4 flex-1">
                      <div className="bg-emerald-500/10 rounded-xl p-2 shrink-0 mt-0.5">
                        <Icon size={24} className="text-emerald-600 dark:text-emerald-400" />
                      </div>
                      <div>
                        <h3 className="font-display text-xl font-bold text-text-primary mb-2">{title}</h3>
                        <p className="text-text-secondary leading-relaxed">{body}</p>
                      </div>
                    </div>
                  </div>
                </FadeUp>
              ))}
            </div>
          </div>
        </section>

        {/* ══════════════════════════════════════════════
            SECTION: KEJUJURAN CALLOUT
        ══════════════════════════════════════════════ */}
        <section className="py-24 bg-bg-base">
          <div className="max-w-4xl mx-auto px-6">
            <FadeUp>
              <div className="bg-bg-1 rounded-3xl p-12 md:p-16 border border-border-subtle text-center shadow-card">
                <p className="text-[11px] font-bold uppercase tracking-widest text-emerald-800 dark:text-emerald-300 mb-6">
                  KEJUJURAN KAMI
                </p>
                <h2 className="font-display text-4xl md:text-5xl font-bold text-text-primary leading-tight mb-12">
                  Kami percaya pada kejujuran, termasuk tentang diri kami sendiri.
                </h2>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-5 text-left">
                  {[
                    'Harga pasar kami 100% dari transaksi nyata user, bukan scraping atau estimasi',
                    'Produk berkembang dari feedback nyata di lapangan, di mana setiap fitur diuji peternak dan broker aktif sebelum rilis',
                    'Dibangun solo oleh founder yang juga peternak, bukan tim besar dengan asumsi teoritis',
                    'Bootstrap & independent, tanpa investor yang mendikte arah produk kami',
                  ].map((item, i) => (
                    <div key={i} className="flex items-start gap-3">
                      <CheckCircle size={16} className="text-emerald-600 dark:text-emerald-400 shrink-0 mt-0.5" />
                      <p className="text-text-secondary text-sm leading-relaxed">{item}</p>
                    </div>
                  ))}
                </div>
              </div>
            </FadeUp>
          </div>
        </section>

        {/* ══════════════════════════════════════════════
            SECTION: ROADMAP
        ══════════════════════════════════════════════ */}
        <section className="py-24 bg-bg-base">
          <div className="max-w-5xl mx-auto px-6">

            <FadeUp className="text-center mb-20">
              <p className="text-[11px] font-bold uppercase tracking-widest text-emerald-800 dark:text-emerald-300 mb-5">
                ROADMAP
              </p>
              <h2 className="font-display text-4xl font-bold text-text-primary leading-tight">
                Roadmap Pengembangan
              </h2>
            </FadeUp>

            <div className="space-y-0 relative border-l-2 border-border-subtle ml-4 md:ml-0">
              {[
                {
                  time: '2026 Q1',
                  status: 'selesai',
                  title: 'Broker Dashboard',
                  desc: 'Landing page, auth, transaksi, RPA & piutang, pengiriman, cash flow, armada, simulator, harga pasar, tim & akses',
                },
                {
                  time: '2026 Q2',
                  status: 'selesai',
                  title: 'Peternak Dashboard',
                  desc: 'Manajemen siklus budidaya, pencatatan harian, stok pakan, vaksinasi, tim & akses. Mendukung: Broiler, Domba/Kambing/Sapi Penggemukan & Breeding.',
                },
                {
                  time: '2026 Q3',
                  status: 'selesai',
                  title: 'RPA & Sembako Dashboard',
                  desc: 'RPA Ayam: order, hutang ke broker, distribusi & laporan margin. Distributor Sembako: penjualan, stok, pengiriman, payroll & laporan.',
                },
                {
                  time: '2026 Q4',
                  status: 'planned',
                  title: 'TernakBot AI',
                  desc: 'Analisis profit otomatis, deteksi anomali budidaya, prediksi panen berbasis data historis, ringkasan laporan bisnis mingguan.',
                },
                {
                  time: '2027',
                  status: 'planned',
                  title: 'TernakOS Market & Mobile App',
                  desc: 'Marketplace antar pelaku usaha yang mempertemukan peternak, broker, dan buyer dalam satu ekosistem, ditambah aplikasi Android native untuk akses lebih cepat langsung dari kandang.',
                },
              ].map((item, i) => (
                <FadeUp key={i} delay={i * 0.1}>
                  <div className="relative pl-12 pb-14 last:pb-0">
                    <div className={`absolute -left-[9px] top-1 w-4 h-4 rounded-full border-2 z-10 ${item.status === 'selesai' ? 'bg-emerald-500 border-emerald-500' :
                        item.status === 'ongoing' ? 'bg-[#F59E0B] border-[#F59E0B] animate-pulse' :
                          'bg-bg-2 border-slate-200 dark:border-white/10'
                      }`} />

                    <div className={`bg-bg-1 border rounded-3xl p-8 transition-all duration-300 shadow-card ${item.status === 'selesai' ? 'border-emerald-500/20' :
                        item.status === 'ongoing' ? 'border-amber-500/20' :
                          'border-border-subtle'
                      }`}>
                      <div className="flex flex-wrap items-center justify-between gap-4 mb-3">
                        <div className="flex items-center gap-3">
                          <span className={`text-[10px] font-bold px-3 py-1 rounded-full ${item.status === 'selesai' ? 'bg-[#f0fdf4] dark:bg-emerald-950/20 border border-slate-200 dark:border-white/10 text-emerald-800 dark:text-emerald-300' :
                              item.status === 'ongoing' ? 'bg-amber-50 dark:bg-amber-950/20 border border-slate-200 dark:border-white/10 text-amber-800 dark:text-amber-300' :
                                'bg-bg-2 border border-slate-200 dark:border-white/10 text-text-muted'
                            }`}>{item.time}</span>
                          <h4 className="font-display text-xl font-bold text-text-primary uppercase tracking-tight">{item.title}</h4>
                        </div>
                        <div>
                          {item.status === 'selesai' && (
                            <span className="flex items-center gap-1.5 text-[10px] font-bold text-emerald-800 dark:text-emerald-300 bg-[#f0fdf4] dark:bg-emerald-950/20 border border-slate-200 dark:border-white/10 px-3 py-1 rounded-full uppercase tracking-widest">
                              <CheckCircle size={10} /> Rilis
                            </span>
                          )}
                          {item.status === 'ongoing' && (
                            <span className="flex items-center gap-1.5 text-[10px] font-bold text-amber-800 dark:text-amber-300 bg-amber-50 dark:bg-amber-950/20 border border-slate-200 dark:border-white/10 px-3 py-1 rounded-full uppercase tracking-widest animate-pulse">
                              <Calendar size={10} /> In Progress
                            </span>
                          )}
                          {item.status === 'planned' && (
                            <span className="flex items-center gap-1.5 text-[10px] font-bold text-text-muted bg-bg-2 border border-slate-200 dark:border-white/10 px-3 py-1 rounded-full uppercase tracking-widest">
                              <Rocket size={10} /> Planned
                            </span>
                          )}
                        </div>
                      </div>
                      <p className="text-text-secondary text-sm leading-relaxed">{item.desc}</p>
                    </div>
                  </div>
                </FadeUp>
              ))}
            </div>
          </div>
        </section>

        {/* ══════════════════════════════════════════════
            SECTION: CTA BOTTOM
        ══════════════════════════════════════════════ */}
        <section className="py-24 bg-bg-base">
          <div className="max-w-4xl mx-auto px-6">
            <FadeUp>
              <div className="relative rounded-3xl p-12 md:p-16 text-center border border-emerald-500/20 overflow-hidden shadow-card">
                {/* Gradient background */}
                <div className="absolute inset-0 bg-gradient-to-br from-emerald-500/10 via-emerald-500/5 to-transparent pointer-events-none rounded-3xl" />
                {/* Glow */}
                <div className="absolute -top-20 left-1/2 -translate-x-1/2 w-80 h-40 bg-emerald-500/10 blur-3xl pointer-events-none" />

                <div className="relative z-10">
                  <h2 className="font-display text-4xl font-bold text-text-primary leading-tight mb-4">
                    Siap bergabung dengan ekosistem<br />peternakan modern?
                  </h2>
                  <p className="text-text-secondary text-lg mb-10">
                    Daftar dan mulai gratis selamanya. Tanpa perlu kartu kredit.
                  </p>

                  <div className="flex flex-wrap items-center justify-center gap-4">
                    <Link
                      to="/register"
                      className="inline-flex items-center gap-2 px-8 py-4 bg-emerald-500 hover:bg-emerald-400 text-white font-bold rounded-xl transition-all shadow-[0_4px_20px_rgba(2, 26, 2,0.3)] hover:shadow-[0_4px_28px_rgba(2, 26, 2,0.45)]"
                    >
                      Mulai Coba Sekarang
                      <ArrowRight size={18} />
                    </Link>
                    <a
                      href="/#fitur"
                      className="px-8 py-4 border border-border-default hover:border-border-strong text-text-primary font-bold rounded-xl transition-colors"
                    >
                      Lihat Fitur
                    </a>
                    <a
                      href="https://wa.me/6281358925505?text=Halo%2C%20saya%20ingin%20tahu%20lebih%20lanjut%20tentang%20TernakOS"
                      target="_blank"
                      rel="noopener noreferrer"
                      className="px-8 py-4 border border-emerald-500/30 hover:border-emerald-500/60 text-emerald-600 dark:text-emerald-400 font-bold rounded-xl transition-colors"
                    >
                      Tanya via WhatsApp
                    </a>
                  </div>
                </div>
              </div>
            </FadeUp>
          </div>
        </section>

      </main>

      <Footer />
    </div>
  );
}
