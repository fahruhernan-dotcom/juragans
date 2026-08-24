import React, { useState, useMemo, useEffect } from 'react'
import SEO from '../../components/SEO'
import { motion, AnimatePresence } from 'framer-motion'
import { ArrowRight, Shield, Users, Star, Zap } from 'lucide-react'
import { Link } from 'react-router-dom'
import Navbar from '../../components/Navbar'
import Footer from '../../components/Footer'
import { usePricingConfig, usePlanConfigs } from '@/lib/hooks/useAdminData'
import { useMediaQuery } from '@/lib/hooks/useMediaQuery'
import { useAuth } from '@/lib/hooks/useAuth'
import { getSubscriptionStatus } from '@/lib/subscriptionUtils'
import { usePlatformStats, formatCompactNumber } from '@/lib/hooks/usePlatformStats'
import Particles from '../../components/reactbits/Particles'
import { WA_URL } from '@/lib/constants/contact'

import { ROLES, SUBS, FAQ_LIST, PRICING_DATA } from './data/pricingData'
import { FadeUp, AccordionItem, StarterCard, ProCard, BusinessCard, EnterpriseCard } from './components/PricingCards'
import CompareTable from './components/CompareTable'

export default function HargaPage() {
  const [selectedRole, setSelectedRole] = useState('broker')
  const [selectedSub, setSelectedSub] = useState('ayam')
  const [billing, setBilling] = useState('monthly')
  const isDesktop = useMediaQuery('(min-width: 1024px)')

  // Guard: delay auth-aware UI until after hydration to prevent SSG mismatch (#418)
  const [isMounted, setIsMounted] = useState(false)
  useEffect(() => { setIsMounted(true) }, [])

  const { user, tenant } = useAuth()
  const subStatus = tenant ? getSubscriptionStatus(tenant) : null
  const isLoggedIn = isMounted && !!user
  const isStarter = isMounted && subStatus?.plan === 'starter'

  const { data: dbPricing } = usePricingConfig()
  const { data: dbConfigs } = usePlanConfigs()
  const { stats: platformStats, loading: statsLoading } = usePlatformStats()

  const dynamicPricingData = useMemo(() => {
    const newData = JSON.parse(JSON.stringify(PRICING_DATA))
    const trialDays = dbConfigs?.trial_config?.pro || 14
    const discountPct = dbConfigs?.annual_discount?.discount_percent || 20

    const verticalMap = {
      broker_ayam: 'broker_ayam',
      broker_telur: 'broker_telur',
      broker_distributor: 'broker_distributor',
      broker_sembako: 'broker_sembako',
      peternak_ayam_broiler: 'peternak_ayam_broiler',
      peternak_ayam_layer: 'peternak_ayam_layer',
      peternak_sapi_potong_fattening: 'peternak_sapi_potong_fattening',
      peternak_sapi_potong_breeding: 'peternak_sapi_potong_breeding',
      peternak_sapi_perah: 'peternak_sapi_perah',
      peternak_kambing_potong_fattening: 'peternak_kambing_potong_fattening',
      peternak_kambing_potong_breeding: 'peternak_kambing_potong_breeding',
      peternak_kambing_perah: 'peternak_kambing_perah',
      peternak_domba_potong_fattening: 'peternak_domba_potong_fattening',
      peternak_domba_potong_breeding: 'peternak_domba_potong_breeding',
      rpa_buyer: 'rpa_buyer',
      rpa_rph: 'rpa_rph',
    }

    for (const key of Object.keys(newData)) {
      const dbRole = key.split('_')[0]
      const verticalKey = verticalMap[key]
      newData[key].trialDays = trialDays
      const dp = dbPricing?.[verticalKey] || dbPricing?.[key] || dbPricing?.[dbRole]
      if (dp) {
        if (dp.pro) {
          newData[key].proPrice = dp.pro.price
          newData[key].proStrike = dp.pro.originalPrice
          newData[key].proYearly = Math.round(dp.pro.price * (1 - discountPct / 100))
        }
        if (dp.business) {
          newData[key].bizPrice = dp.business.price
          newData[key].bizStrike = dp.business.originalPrice
          newData[key].bizYearly = Math.round(dp.business.price * (1 - discountPct / 100))
        }
      }
    }
    return newData
  }, [dbPricing, dbConfigs])

  const handleRoleChange = (role) => {
    setSelectedRole(role)
    const defaults = { broker: 'ayam', peternak: 'ayam_broiler', rpa: 'buyer' }
    setSelectedSub(defaults[role])
  }

  const contentKey = `${selectedRole}_${selectedSub}`
  const data = dynamicPricingData[contentKey] || PRICING_DATA[contentKey] || PRICING_DATA['broker_ayam']
  const annualDiscount = dbConfigs?.annual_discount || { discount_percent: 20, badge_text: 'Hemat 2 bln!' }

  const softwareSchema = {
    '@context': 'https://schema.org',
    '@type': 'SoftwareApplication',
    name: 'TernakOS',
    operatingSystem: 'Web, Android, iOS',
    applicationCategory: 'BusinessApplication',
    offers: {
      '@type': 'AggregateOffer',
      priceCurrency: 'IDR',
      lowPrice: '0',
      highPrice: '1499000',
      offerCount: '4',
    },
  }

  return (
    <div className="min-h-screen bg-[#06090F] text-[#F1F5F9] overflow-x-hidden">
      <SEO
        title="Daftar Harga Paket TernakOS | Sapi, Domba, Kambing, Broiler & Broker"
        description="Paket harga fleksibel untuk semua jenis peternakan: sapi potong, domba, kambing, broiler, broker ayam, broker telur, distributor, dan RPA. Coba gratis 14 hari. Tidak perlu kartu kredit."
        path="/harga"
        schema={softwareSchema}
      />
      <Navbar />

      {/* Grid background */}
      <div
        className="fixed inset-0 pointer-events-none z-0"
        style={{
          backgroundImage: `linear-gradient(rgba(255,255,255,0.02) 1px, transparent 1px), linear-gradient(90deg, rgba(255,255,255,0.02) 1px, transparent 1px)`,
          backgroundSize: '40px 40px',
          WebkitMaskImage: 'radial-gradient(ellipse 80% 50% at center top, black 30%, transparent 80%)',
          maskImage: 'radial-gradient(ellipse 80% 50% at center top, black 30%, transparent 80%)',
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

      <main className="relative z-10">

        {/* ── HEADER ── */}
        <section className="relative pt-32 pb-16 px-5 text-center">
          <div className="relative z-10 max-w-2xl mx-auto">
            <motion.p
              initial={{ opacity: 0, y: 12 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.4 }}
              className="text-[11px] font-bold uppercase tracking-widest text-[#021a02] dark:text-emerald-400 mb-6"
            >
              HARGA TRANSPARAN
            </motion.p>
            <motion.div
              initial={{ opacity: 0, y: 12 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.4 }}
              className="flex items-center justify-center gap-3 mb-8"
            >
              <div className="relative shrink-0">
                <div className="absolute inset-0 rounded-[10px] bg-emerald-500/20 blur-md opacity-60 pointer-events-none" />
                <img
                  src="/logo.png"
                  alt="TernakOS"
                  style={{ width: 40, height: 40, borderRadius: 10, objectFit: 'cover', display: 'block', border: '1px solid rgba(255,255,255,0.07)' }}
                  className="relative z-10"
                />
              </div>
              <span className="font-display font-black text-xl text-white tracking-tight uppercase">TernakOS</span>
            </motion.div>
            <motion.h1
              initial={{ opacity: 0, y: 16 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.45, delay: 0.05 }}
              className={`font-['Sora'] ${isDesktop ? 'text-4xl md:text-5xl lg:text-6xl' : 'text-3xl'} font-normal text-white ${isDesktop ? 'leading-tight' : 'leading-[1.2]'} mb-4`}
            >
              Coba gratis {data.trialDays || 14} hari.
              <br />
              Tanpa kartu kredit.
            </motion.h1>
            <motion.p
              initial={{ opacity: 0, y: 12 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.4, delay: 0.1 }}
              className="text-[#94A3B8] text-lg"
            >
              Pilih plan sesuai bisnismu.{
                !statsLoading && platformStats.active_businesses > 0
                  ? ` Lebih dari ${formatCompactNumber(platformStats.active_businesses)} bisnis aktif di TernakOS.`
                  : ' Bergabunglah bersama peternak & broker aktif di TernakOS.'
              }
            </motion.p>
          </div>
        </section>

        {/* ── LOGIN AWARENESS BANNER ── */}
        {isLoggedIn && isStarter && (
          <div className="max-w-2xl mx-auto mb-8 px-5">
            <motion.div
              initial={{ opacity: 0, y: -10 }}
              animate={{ opacity: 1, y: 0 }}
              className="relative overflow-hidden rounded-2xl border border-emerald-500/20 bg-gradient-to-r from-emerald-500/10 via-emerald-500/5 to-transparent p-4 md:p-5"
            >
              <div className="flex items-start gap-3">
                <div className="shrink-0 w-9 h-9 rounded-xl bg-emerald-500/15 flex items-center justify-center">
                  <Zap size={18} className="text-emerald-400" />
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-bold text-white mb-0.5">Kamu pakai Starter (Gratis)</p>
                  <p className="text-xs text-[#94A3B8] leading-relaxed">
                    Upgrade ke Pro untuk membuka fitur lengkap, dengan trial {data?.trialDays || 14} hari gratis, tanpa kartu kredit.
                  </p>
                </div>
              </div>
            </motion.div>
          </div>
        )}

        {/* ── BILLING TOGGLE ── */}
        <div className="flex justify-center mb-8 px-5">
          <div className="inline-flex items-center bg-[#111C24] border border-white/8 rounded-full p-1 gap-1">
            {['monthly', 'yearly'].map(b => (
              <button
                key={b}
                type="button"
                onClick={() => setBilling(b)}
                className={`relative px-5 py-2 rounded-full text-xs font-bold transition-colors duration-200 cursor-pointer border-none ${billing === b ? 'text-white' : 'text-white/40 hover:text-white/70'}`}
              >
                {billing === b && (
                  <motion.span
                    layoutId="billing-bg"
                    className="absolute inset-0 rounded-full bg-white/10"
                    transition={{ type: 'spring', stiffness: 400, damping: 35 }}
                  />
                )}
                <span className="relative">
                  {b === 'monthly' ? 'Bulanan' : 'Tahunan'}
                </span>
                {b === 'yearly' && billing === 'yearly' && (
                  <span className="relative ml-2 bg-amber-500/20 text-amber-400 text-[10px] font-bold px-2 py-0.5 rounded-full">
                    {annualDiscount.badge_text}
                  </span>
                )}
                {b === 'yearly' && billing !== 'yearly' && (
                  <span className="relative ml-2 bg-amber-500/15 text-amber-400 text-[10px] font-bold px-2 py-0.5 rounded-full animate-pulse">
                    {annualDiscount.badge_text}
                  </span>
                )}
              </button>
            ))}
          </div>
        </div>

        {/* ── ROLE & SUB SELECTOR ── */}
        <div className="flex flex-col items-center gap-3 mb-10 px-4">
          <div className="flex bg-[#111C24] border border-white/8 rounded-full p-1 gap-1 relative z-20">
            {ROLES.map(role => (
              <button
                key={role.id}
                type="button"
                onClick={() => handleRoleChange(role.id)}
                className={`relative px-6 md:px-8 py-2.5 rounded-full text-[11px] font-bold uppercase tracking-widest transition-all duration-300 cursor-pointer border-none flex items-center gap-2.5 ${selectedRole === role.id ? 'text-emerald-400' : 'text-white/40 hover:text-white/60'}`}
              >
                {selectedRole === role.id && (
                  <motion.span
                    layoutId="harga-tab-bg"
                    className="absolute inset-0 rounded-full bg-emerald-500/10 border border-emerald-500/30"
                    transition={{ type: 'spring', stiffness: 400, damping: 35 }}
                  />
                )}
                <img src={role.icon} alt={role.label} className="w-5 h-5 object-cover rounded-md" />
                <span className="relative z-10">{role.label}</span>
              </button>
            ))}
          </div>

          <AnimatePresence mode="wait">
            {SUBS[selectedRole] && SUBS[selectedRole].length > 0 && (
              <motion.div
                key={selectedRole}
                initial={{ opacity: 0, y: -4 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -4 }}
                transition={{ duration: 0.2 }}
                className="w-full max-w-2xl px-4"
              >
                <div
                  className="w-full overflow-x-auto scrollbar-hide snap-x snap-mandatory pb-4 px-8"
                  style={{
                    WebkitMaskImage: 'linear-gradient(to right, transparent, black 15%, black 85%, transparent)',
                    maskImage: 'linear-gradient(to right, transparent, black 15%, black 85%, transparent)',
                  }}
                >
                  <div className="flex items-center gap-2 min-w-max mx-auto w-fit">
                    {SUBS[selectedRole].map(sub => (
                      <button
                        key={sub.id}
                        type="button"
                        disabled={sub.disabled}
                        onClick={() => !sub.disabled && setSelectedSub(sub.id)}
                        className={`flex items-center gap-1.5 px-4 py-1.5 rounded-full text-xs font-semibold border transition-colors duration-150 snap-center shrink-0 ${
                          sub.disabled
                            ? 'opacity-40 cursor-not-allowed border-white/8 text-white/40'
                            : selectedSub === sub.id
                              ? 'border-emerald-500/30 bg-emerald-500/10 text-emerald-400 cursor-pointer'
                              : 'border-transparent text-white/50 hover:text-white/70 cursor-pointer'
                        }`}
                      >
                        {sub.label}
                        {sub.disabled && (
                          <span className="text-[9px] font-bold text-amber-400/80 uppercase ml-0.5">Segera</span>
                        )}
                      </button>
                    ))}
                  </div>
                </div>
              </motion.div>
            )}
          </AnimatePresence>
        </div>

        {/* ── PRICING CARDS ── */}
        <section className="px-4 md:px-8 pb-6">
          <div className="max-w-7xl mx-auto">
            <AnimatePresence mode="wait">
              <motion.div
                key={contentKey}
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -8 }}
                transition={{ duration: 0.2 }}
              >
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 items-start pt-6">
                  <StarterCard data={data} isLoggedIn={isLoggedIn} />
                  <ProCard data={data} billing={billing} annualDiscount={annualDiscount} isLoggedIn={isLoggedIn} />
                  <div className="lg:relative lg:z-10 lg:scale-[1.03]">
                    <BusinessCard data={data} billing={billing} annualDiscount={annualDiscount} isLoggedIn={isLoggedIn} />
                  </div>
                  <EnterpriseCard />
                </div>
              </motion.div>
            </AnimatePresence>

            <p className="text-center text-xs text-[#4B6478] mt-8">
              Paket Pro & Business include: Trial {data.trialDays || 14} hari gratis · Tidak perlu kartu kredit · Cancel kapan saja
            </p>
          </div>
        </section>

        {/* ── COMPARISON TABLE ── */}
        <CompareTable role={selectedRole} />

        {/* ── FAQ ── */}
        <section className="py-24 px-5 bg-[#080D13]">
          <div className="max-w-2xl mx-auto">
            <FadeUp className="text-center mb-12">
              <p className="text-[11px] font-bold uppercase tracking-widest text-[#021a02] dark:text-emerald-400 mb-4">FAQ</p>
              <h2 className="font-['Sora'] text-3xl font-bold text-white">Pertanyaan Umum</h2>
            </FadeUp>
            <FadeUp delay={0.1}>
              <div className="divide-y-0">
                {FAQ_LIST.map((item, i) => (
                  <AccordionItem key={i} q={item.q} a={item.a} />
                ))}
              </div>
            </FadeUp>
          </div>
        </section>

        {/* ── CTA FINAL ── */}
        <section className="py-16 md:py-24 px-5">
          <div className="max-w-2xl mx-auto">
            <FadeUp>
              <div className="relative rounded-2xl md:rounded-3xl p-6 md:p-12 text-center border border-emerald-500/20 overflow-hidden">
                <div className="absolute inset-0 bg-gradient-to-br from-emerald-500/10 via-emerald-500/5 to-transparent pointer-events-none rounded-3xl" />
                <div className="absolute -top-12 left-1/2 -translate-x-1/2 w-48 h-24 bg-emerald-500/10 blur-3xl pointer-events-none" />

                <div className="relative z-10">
                  <h2 className="font-['Sora'] text-2xl md:text-3xl font-bold text-white mb-3">Masih ragu?</h2>
                  <p className="text-[#94A3B8] text-sm md:text-base mb-6 md:mb-8">
                    Coba trial gratis {data.trialDays || 14} hari untuk paket Pro & Business. Tidak perlu kartu kredit, tidak ada komitmen.
                  </p>

                  <div className="flex flex-col sm:flex-row items-center justify-center gap-3 mb-6">
                    <Link
                      to="/register"
                      className="inline-flex items-center gap-2 px-8 py-3.5 bg-emerald-500 hover:bg-emerald-400 text-white font-bold rounded-xl transition-all shadow-[0_4px_20px_rgba(2, 26, 2,0.3)] hover:shadow-[0_4px_28px_rgba(2, 26, 2,0.45)] hover:-translate-y-0.5 active:translate-y-0"
                    >
                      Mulai Sekarang
                      <ArrowRight size={16} />
                    </Link>
                    <a
                      href={WA_URL}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="text-sm text-[#4B6478] hover:text-white transition-colors"
                    >
                      Tanya dulu via WhatsApp →
                    </a>
                  </div>

                  <div className="flex flex-wrap items-center justify-center gap-4 md:gap-6 pt-4 border-t border-white/5">
                    <div className="flex items-center gap-1.5">
                      <Shield size={14} className="text-emerald-500" />
                      <span className="text-[11px] text-[#4B6478] font-semibold">Garansi 30 Hari</span>
                    </div>
                    <div className="flex items-center gap-1.5">
                      <Users size={14} className="text-emerald-500" />
                      <span className="text-[11px] text-[#4B6478] font-semibold">
                        {statsLoading ? 'Bisnis Aktif' : `${formatCompactNumber(platformStats.active_businesses)}+ Bisnis Aktif`}
                      </span>
                    </div>
                    <div className="flex items-center gap-1.5">
                      <Star size={14} className="text-emerald-500 fill-emerald-500/30" />
                      <span className="text-[11px] text-[#4B6478] font-semibold">Cancel Kapan Saja</span>
                    </div>
                  </div>
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
