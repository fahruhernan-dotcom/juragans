import React, { useState, useRef, useEffect } from 'react'
import SEO from '@/components/SEO'
import { motion, AnimatePresence } from 'framer-motion'
import { Check, ArrowRight, X, MessageCircle, Bot, LayoutDashboard, ShieldCheck, Lock } from 'lucide-react'
import { Link, useParams, useNavigate, useLocation } from 'react-router-dom'
import Navbar from '@/components/Navbar'
import Footer from '@/components/Footer'
import Particles from '@/components/reactbits/Particles'
import { useMediaQuery } from '@/lib/hooks/useMediaQuery'

import FadeUp    from './components/FadeUp'
import GroupCard from './components/GroupCard'
import FAQItem   from './components/FAQItem'

import {
  ROLES, SUBS, SHARED, FAQ_COMMON,
  GROUPS, HERO_CONTENT, BEFORE_AFTER, FAQ_ROLE,
} from './data'

export default function FiturPage() {
  const { role: paramRole, sub: paramSub } = useParams()
  const navigate  = useNavigate()
  const location  = useLocation()
  const tabBarRef = useRef(null)
  const [isSticky, setIsSticky] = useState(false)
  const isDesktop = useMediaQuery('(min-width: 1024px)')

  const isRPA      = location.pathname === '/fitur/rpa'
  const selectedRole = isRPA ? 'rpa' : (paramRole ?? 'broker')
  const selectedSub  = paramSub?.replace(/-/g, '_') ?? 'ayam'

  const handleRoleChange = (role) => {
    if (role === 'rpa') { navigate('/fitur/rpa'); return }
    const defaults = { broker: 'ayam', peternak: 'ayam' }
    navigate(`/fitur/${role}/${defaults[role]}`)
  }

  const handleSubChange = (subId) => {
    navigate(`/fitur/${selectedRole}/${subId.replace(/_/g, '-')}`)
  }

  useEffect(() => {
    const el = tabBarRef.current
    if (!el) return
    const observer = new IntersectionObserver(
      ([entry]) => setIsSticky(!entry.isIntersecting),
      { threshold: 0, rootMargin: '-1px 0px 0px 0px' },
    )
    observer.observe(el)
    return () => observer.disconnect()
  }, [])

  const contentKey  = selectedRole === 'rpa' ? 'rpa' : `${selectedRole}_${selectedSub}`
  const groups      = GROUPS[contentKey] ?? []
  const cols        = groups.length <= 4 ? 'md:grid-cols-2' : 'md:grid-cols-2 lg:grid-cols-3'
  const hero        = HERO_CONTENT[contentKey] ?? HERO_CONTENT.broker_ayam
  const beforeAfter = BEFORE_AFTER[contentKey] ?? []
  const faqItems    = [...FAQ_COMMON, ...(FAQ_ROLE[contentKey] ?? [])].slice(0, 4)
  const isSembako   = contentKey === 'broker_sembako'

  const seoPath = selectedRole === 'rpa'
    ? '/fitur/rpa'
    : selectedRole === 'broker' && selectedSub === 'ayam'
      ? '/fitur'
      : `/fitur/${selectedRole}/${selectedSub.replace(/_/g, '-')}`

  const schema = {
    '@context': 'https://schema.org',
    '@graph': [
      {
        '@type': 'SoftwareApplication',
        name: 'TernakOS',
        operatingSystem: 'Web, Android, iOS',
        applicationCategory: 'BusinessApplication',
        featureList: hero.sub,
      },
      {
        '@type': 'FAQPage',
        mainEntity: faqItems.map(item => ({
          '@type': 'Question',
          name: item.q,
          acceptedAnswer: { '@type': 'Answer', text: item.a },
        })),
      },
    ],
  }

  return (
    <div className="fitur-page min-h-screen bg-[#06090F] text-[#F1F5F9] overflow-x-hidden">
      <SEO
        title={`${hero.eyebrow} - Fitur TernakOS | Platform Peternakan Digital #1 Indonesia`}
        description={`${hero.sub} Setup kurang dari 15 menit, berjalan di HP Android, tanpa instalasi apapun.`}
        path={seoPath}
        schema={schema}
      />
      <Navbar />

      <main>

        {/* ── Hero ── */}
        <section className="relative pt-32 pb-20 px-5 overflow-hidden">
          <div className="absolute top-0 left-1/2 -translate-x-1/2 w-[700px] h-72 bg-emerald-500/8 blur-3xl pointer-events-none" />
          {isSembako && (
            <div className="absolute top-8 right-0 w-[400px] h-48 bg-amber-500/6 blur-3xl pointer-events-none" />
          )}
          <div className="absolute inset-0 z-0 pointer-events-none">
            <Particles
              particleColors={isSembako ? ['#F59E0B', '#FBBF24', '#D97706'] : ['#021a02', '#021a02', '#021a02']}
              particleCount={typeof window !== 'undefined' && window.innerWidth < 768 ? 20 : 40}
              speed={0.3}
              particleBaseSize={1.2}
            />
          </div>

          <div className="relative z-10 max-w-4xl mx-auto">
            <AnimatePresence mode="wait">
              <motion.div
                key={contentKey + '_hero'}
                initial={{ opacity: 0, y: 18 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -10 }}
                transition={{ duration: 0.3 }}
                className="text-center"
              >
                <p className={`text-[11px] font-bold uppercase tracking-widest mb-5 ${isSembako ? 'text-amber-400' : 'text-emerald-400'}`}>
                  {hero.eyebrow}
                </p>
                <h1 className={`font-['Sora'] ${isDesktop ? 'text-4xl md:text-5xl lg:text-6xl' : 'text-3xl'} font-black text-white ${isDesktop ? 'leading-[1.1]' : 'leading-[1.2]'} tracking-tight mb-6 max-w-3xl mx-auto`}>
                  {hero.headline}
                </h1>
                <p className={`${isDesktop ? 'text-lg' : 'text-base'} text-[#94A3B8] max-w-2xl mx-auto leading-relaxed`}>
                  {hero.sub}
                </p>
                <div className="mt-10 flex flex-wrap items-center justify-center gap-6 text-xs text-[#4B6478] font-medium">
                  {['Mulai gratis sekarang', 'Setup < 15 menit', 'Tanpa instalasi software', 'Berjalan di HP Android'].map(t => (
                    <span key={t} className="flex items-center gap-1.5">
                      <span className="h-1.5 w-1.5 rounded-full bg-emerald-400 inline-block" />
                      {t}
                    </span>
                  ))}
                </div>
              </motion.div>
            </AnimatePresence>
          </div>
        </section>

        {/* ── Sticky sentinel ── */}
        <div ref={tabBarRef} />

        {/* ── Tab bar ── */}
        <div className={`sticky top-0 z-30 transition-all duration-200 ${isSticky ? 'bg-[#06090F]/95 backdrop-blur-md border-b border-white/8 shadow-lg' : 'bg-[#06090F]'}`}>
          <div className="max-w-5xl mx-auto px-4 pt-3 pb-2 flex flex-col items-center gap-2">

            <div className="inline-flex bg-[#111C24] border border-white/8 rounded-full p-1 gap-1 relative">
              {ROLES.map(role => (
                <button
                  key={role.id}
                  type="button"
                  onClick={() => handleRoleChange(role.id)}
                  className={`relative z-10 px-5 md:px-7 py-2 rounded-full text-[11px] md:text-xs font-bold uppercase tracking-wider transition-colors duration-200 cursor-pointer border-none ${selectedRole === role.id ? 'text-emerald-400' : 'text-white/40 hover:text-white/70'}`}
                >
                  {selectedRole === role.id && (
                    <motion.span
                      layoutId="tab-bg"
                      className="absolute inset-0 rounded-full bg-emerald-500/10 border border-emerald-500/40"
                      transition={{ type: 'spring', stiffness: 400, damping: 35 }}
                    />
                  )}
                  <div className="relative flex items-center gap-2">
                    <img src={role.icon} alt={role.label} className="w-5 h-5 object-cover rounded-md" />
                    <span>{role.label}</span>
                  </div>
                </button>
              ))}
            </div>

            {(SUBS[selectedRole]?.length ?? 0) > 0 && (
              <div className="flex items-center gap-1.5">
                {SUBS[selectedRole].map(sub => (
                  <button
                    key={sub.id}
                    type="button"
                    disabled={sub.disabled}
                    onClick={() => !sub.disabled && handleSubChange(sub.id)}
                    className={`flex items-center gap-1 px-3.5 py-1 rounded-full text-[11px] font-semibold border transition-colors duration-150 ${
                      sub.disabled
                        ? 'opacity-40 cursor-not-allowed border-white/8 text-white/40'
                        : selectedSub === sub.id
                          ? 'border-white/20 bg-white/[0.08] text-white cursor-pointer'
                          : 'border-transparent text-white/50 hover:text-white/70 cursor-pointer'
                    }`}
                  >
                    {sub.label}
                    {sub.disabled && <span className="text-[9px] font-bold text-amber-400/80 uppercase ml-0.5">Segera</span>}
                  </button>
                ))}
              </div>
            )}
          </div>
        </div>

        {/* ── Feature cards ── */}
        <section className="py-16 px-5">
          <div className="max-w-6xl mx-auto">
            <AnimatePresence mode="wait">
              <motion.div
                key={contentKey}
                initial={{ opacity: 0, y: 12 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -8 }}
                transition={{ duration: 0.22 }}
                className={`grid grid-cols-1 ${cols} gap-5`}
              >
                {groups.map((g, i) => (
                  <GroupCard
                    key={`${contentKey}-${i}`}
                    Icon={g.Icon}
                    title={g.title}
                    desc={g.desc}
                    features={g.features}
                    delay={i * 0.05}
                  />
                ))}
              </motion.div>
            </AnimatePresence>
          </div>
        </section>

        {/* ── Before / After ── */}
        <section className="py-20 px-5 bg-[#080D13]">
          <div className="max-w-4xl mx-auto">
            <FadeUp className="text-center mb-12">
              <p className={`text-[11px] font-bold uppercase tracking-widest mb-4 ${isSembako ? 'text-amber-400' : 'text-emerald-400'}`}>
                PERBANDINGAN
              </p>
              <h2 className="font-['Sora'] text-3xl font-bold text-white">Sebelum & Sesudah TernakOS</h2>
              <p className="text-[#4B6478] text-sm mt-3 max-w-lg mx-auto">
                Ini bukan janji, melainkan kenyataan yang kamu rasakan di hari pertama pakai.
              </p>
            </FadeUp>

            <AnimatePresence mode="wait">
              <motion.div
                key={contentKey + '_ba'}
                initial={{ opacity: 0, y: 16 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0 }}
                transition={{ duration: 0.25 }}
              >
                <div className="grid grid-cols-2 gap-3 mb-3">
                  <div className="flex items-center gap-2 px-5 py-3 rounded-xl bg-red-500/8 border border-red-500/15">
                    <X size={14} className="text-red-400 shrink-0" />
                    <span className="text-xs font-black uppercase tracking-widest text-red-400">Cara Lama</span>
                  </div>
                  <div className={`flex items-center gap-2 px-5 py-3 rounded-xl border ${isSembako ? 'bg-amber-500/8 border-amber-500/15' : 'bg-emerald-500/8 border-emerald-500/15'}`}>
                    <Check size={14} className={`shrink-0 ${isSembako ? 'text-amber-400' : 'text-emerald-400'}`} />
                    <span className={`text-xs font-black uppercase tracking-widest ${isSembako ? 'text-amber-400' : 'text-emerald-400'}`}>Dengan TernakOS</span>
                  </div>
                </div>
                <div className="space-y-2">
                  {beforeAfter.map((row, i) => (
                    <FadeUp key={i} delay={i * 0.06}>
                      <div className="grid grid-cols-2 gap-3">
                        <div className="flex items-start gap-3 px-5 py-4 rounded-xl bg-[#111C24] border border-white/5">
                          <span className="text-red-400/60 text-xs font-bold mt-0.5 shrink-0">✗</span>
                          <p className="text-sm text-[#94A3B8] leading-snug">{row.before}</p>
                        </div>
                        <div className={`flex items-start gap-3 px-5 py-4 rounded-xl border ${isSembako ? 'bg-amber-500/5 border-amber-500/10' : 'bg-emerald-500/5 border-emerald-500/10'}`}>
                          <span className={`text-xs font-bold mt-0.5 shrink-0 ${isSembako ? 'text-amber-400' : 'text-emerald-400'}`}>✓</span>
                          <p className="text-sm text-white leading-snug font-medium">{row.after}</p>
                        </div>
                      </div>
                    </FadeUp>
                  ))}
                </div>
              </motion.div>
            </AnimatePresence>
          </div>
        </section>

        {/* ── Shared features ── */}
        <section className="py-20 px-5 bg-[#06090F]">
          <div className="max-w-5xl mx-auto">
            <FadeUp className="text-center mb-12">
              <p className="text-[11px] font-bold uppercase tracking-widest text-[#021a02] dark:text-emerald-400 mb-4">SEMUA ROLE</p>
              <h2 className="font-['Sora'] text-3xl font-bold text-white">Tersedia untuk Semua Role</h2>
            </FadeUp>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5">
              {SHARED.map((s, i) => {
                const Icon = {
                  Bot,
                  LayoutDashboard,
                  ShieldCheck,
                  Lock
                }[s.Icon] || Bot

                return (
                  <FadeUp key={i} delay={i * 0.08}>
                    <div className="bg-[#111C24] rounded-2xl p-6 border border-white/8 hover:border-emerald-500/20 transition-all duration-300 h-full group">
                      <div className="w-12 h-12 rounded-xl bg-emerald-500/10 flex items-center justify-center mb-5 border border-emerald-500/20 group-hover:border-emerald-500/40 transition-all">
                        <Icon size={24} className="text-emerald-500" />
                      </div>
                      <h3 className="font-['Sora'] font-bold text-white text-sm mb-2">{s.title}</h3>
                      <p className="text-xs text-[#4B6478] leading-relaxed">{s.desc}</p>
                    </div>
                  </FadeUp>
                )
              })}
            </div>
          </div>
        </section>

        {/* ── FAQ ── */}
        <section className="py-20 px-5 bg-[#080D13]">
          <div className="max-w-2xl mx-auto">
            <FadeUp className="text-center mb-12">
              <p className={`text-[11px] font-bold uppercase tracking-widest mb-4 ${isSembako ? 'text-amber-400' : 'text-emerald-400'}`}>FAQ</p>
              <h2 className="font-['Sora'] text-3xl font-bold text-white">Pertanyaan yang Sering Ditanya</h2>
            </FadeUp>
            <AnimatePresence mode="wait">
              <motion.div
                key={contentKey + '_faq'}
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                transition={{ duration: 0.2 }}
                className="space-y-2"
              >
                {faqItems.map((item, i) => (
                  <FadeUp key={i} delay={i * 0.04}>
                    <FAQItem q={item.q} a={item.a} isSembako={isSembako} />
                  </FadeUp>
                ))}
              </motion.div>
            </AnimatePresence>
            <FadeUp className="text-center mt-8">
              <Link
                to="/faq"
                className={`inline-flex items-center gap-2 text-sm font-semibold transition-colors ${isSembako ? 'text-amber-400 hover:text-amber-300' : 'text-emerald-400 hover:text-emerald-300'}`}
              >
                Lihat semua 200+ FAQ
                <ArrowRight size={15} />
              </Link>
            </FadeUp>
          </div>
        </section>

        {/* ── CTA ── */}
        <section className="py-24 px-5">
          <div className="max-w-3xl mx-auto">
            <FadeUp>
              <div className="relative rounded-3xl p-12 md:p-16 text-center border border-emerald-500/20 overflow-hidden">
                <div className="absolute inset-0 bg-gradient-to-br from-emerald-500/10 via-emerald-500/5 to-transparent pointer-events-none rounded-3xl" />
                <div className="absolute -top-16 left-1/2 -translate-x-1/2 w-64 h-32 bg-emerald-500/10 blur-3xl pointer-events-none" />
                {isSembako && <div className="absolute bottom-0 right-0 w-48 h-24 bg-amber-500/8 blur-2xl pointer-events-none" />}

                <div className="relative z-10">
                  <AnimatePresence mode="wait">
                    <motion.div
                      key={contentKey + '_cta'}
                      initial={{ opacity: 0, y: 10 }}
                      animate={{ opacity: 1, y: 0 }}
                      exit={{ opacity: 0, y: -6 }}
                      transition={{ duration: 0.25 }}
                    >
                      <p className={`text-[11px] font-bold uppercase tracking-widest mb-4 ${isSembako ? 'text-amber-400' : 'text-emerald-400'}`}>
                        {hero.eyebrow}
                      </p>
                      <h2 className="font-['Sora'] text-3xl md:text-4xl font-bold text-white mb-4">
                        Siap coba semua fitur ini?
                      </h2>
                      <p className="text-[#94A3B8] text-base mb-10">
                        Gratis selamanya, tanpa kartu kredit, tanpa instalasi.
                      </p>
                      <div className="flex flex-col sm:flex-row items-center justify-center gap-4">
                        <Link
                          to="/register"
                          className="inline-flex items-center gap-2 px-8 py-4 bg-emerald-500 hover:bg-emerald-400 text-white font-bold rounded-xl transition-all shadow-[0_4px_20px_rgba(2, 26, 2,0.3)] hover:shadow-[0_4px_28px_rgba(2, 26, 2,0.45)] whitespace-nowrap"
                        >
                          {hero.cta}
                          <ArrowRight size={18} />
                        </Link>
                        <a
                          href="https://wa.me/6281234567890"
                          target="_blank"
                          rel="noopener noreferrer"
                          className="inline-flex items-center gap-2 px-8 py-4 bg-white/5 hover:bg-white/10 text-white font-semibold rounded-xl border border-white/10 hover:border-white/20 transition-all whitespace-nowrap"
                        >
                          <MessageCircle size={16} />
                          Hubungi via WhatsApp
                        </a>
                      </div>
                    </motion.div>
                  </AnimatePresence>
                </div>
              </div>
            </FadeUp>
          </div>
        </section>

      </main>

      <Footer />
    </div>
  )
}
