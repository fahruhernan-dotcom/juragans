import React, { useState } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { Check, ChevronDown, Star, X as XIcon } from 'lucide-react'
import { Link } from 'react-router-dom'
import { WA_URL } from '@/lib/constants/contact'
import { fmtIDR, ENTERPRISE_FEATURES } from '../data/pricingData'

export function FadeUp({ children, delay = 0, className }) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true, margin: '-60px' }}
      transition={{ duration: 0.45, ease: 'easeOut', delay }}
      className={className}
    >
      {children}
    </motion.div>
  )
}

export function FeatureItem({ text, isExtra = false }) {
  return (
    <li className="flex items-start gap-2">
      {isExtra
        ? <Star size={13} className="text-emerald-400 shrink-0 mt-0.5 fill-emerald-400/30" />
        : <Check size={13} className="text-emerald-400 shrink-0 mt-0.5" />
      }
      <span className={`text-sm leading-snug ${isExtra ? 'text-white/80' : 'text-[#94A3B8]'}`}>{text}</span>
    </li>
  )
}

export function SocialAvatars({ count }) {
  const colors = ['bg-emerald-500', 'bg-purple-500', 'bg-blue-500', 'bg-amber-500', 'bg-pink-500']
  const initials = ['A', 'B', 'D', 'R', 'S']
  return (
    <div className="flex items-center gap-2">
      <div className="flex -space-x-2">
        {colors.map((c, i) => (
          <div key={i} className={`w-6 h-6 rounded-full ${c} border-2 border-[#0C1319] flex items-center justify-center text-[9px] font-bold text-white shrink-0`}>
            {initials[i]}
          </div>
        ))}
      </div>
      <span className="text-xs text-[#94A3B8]">
        <span className="text-white font-semibold">{count}</span> bisnis pilih Business
      </span>
    </div>
  )
}

export function AccordionItem({ q, a }) {
  const [open, setOpen] = useState(false)
  return (
    <div className="border-b border-white/8">
      <button
        type="button"
        onClick={() => setOpen(v => !v)}
        className="w-full flex items-center justify-between py-5 text-left gap-4 bg-transparent border-none cursor-pointer"
      >
        <span className="text-sm font-semibold text-white">{q}</span>
        <motion.span animate={{ rotate: open ? 180 : 0 }} transition={{ duration: 0.2 }} className="shrink-0">
          <ChevronDown size={16} className="text-[#4B6478]" />
        </motion.span>
      </button>
      <AnimatePresence initial={false}>
        {open && (
          <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: 'auto', opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            transition={{ duration: 0.22 }}
            style={{ overflow: 'hidden' }}
          >
            <p className="text-sm text-[#94A3B8] leading-relaxed pb-5">{a}</p>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  )
}

export function StarterCard({ data, isLoggedIn }) {
  return (
    <div className="group relative bg-[linear-gradient(135deg,rgba(255,255,255,0.04),rgba(255,255,255,0.01))] rounded-2xl p-8 border border-white/8 flex flex-col h-full transition-all duration-300 hover:border-white/20">
      <div className="relative z-10 mb-6">
        <p className="text-[10px] font-bold uppercase tracking-widest text-[#4B6478] mb-3">STARTER</p>
        <div className="flex items-baseline gap-1 mb-1">
          <span className="font-['Sora'] text-3xl font-black text-white">Gratis</span>
        </div>
        <p className="text-xs text-[#4B6478] mt-1">Gratis selamanya untuk operasional dasar</p>
      </div>

      <ul className="relative z-10 space-y-3 flex-1 mb-8">
        {data.starterFeatures.map((f, i) => (
          <li key={i} className="flex items-start gap-3">
            <Check size={14} className="text-emerald-400 shrink-0 mt-0.5" />
            <span className="text-[13px] text-[#94A3B8] leading-snug">{f}</span>
          </li>
        ))}
        {data.starterMissing.map((f, i) => (
          <li key={`x-${i}`} className="flex items-start gap-3">
            <XIcon size={14} className="text-[#4B6478] shrink-0 mt-0.5" />
            <span className="text-[13px] text-[#4B6478] leading-snug line-through">{f}</span>
          </li>
        ))}
      </ul>

      <Link
        to={isLoggedIn ? "/" : "/register"}
        className="relative z-10 block text-center py-3 rounded-xl border border-white/10 text-[#64748B] text-sm font-bold hover:border-white/30 hover:text-white transition-all"
      >
        Mulai Gratis
      </Link>
    </div>
  )
}

export function ProCard({ data, billing, annualDiscount, isLoggedIn }) {
  const price = billing === 'yearly' ? data.proYearly : data.proPrice
  const yearlyTotal = data.proYearly * 12
  const discountPct = annualDiscount?.discount_percent || 20

  return (
    <div className="group relative bg-[linear-gradient(135deg,rgba(255,255,255,0.05),rgba(255,255,255,0.01))] rounded-2xl p-8 border border-white/8 flex flex-col h-full transition-all duration-300 hover:border-emerald-500/30 hover:shadow-[0_20px_45px_rgba(0,0,0,0.3)]">
      <div className="absolute inset-0 bg-gradient-to-br from-emerald-500/0 via-emerald-500/0 to-emerald-500/0 group-hover:from-emerald-500/5 group-hover:to-transparent transition-all duration-500 rounded-2xl" />
      <div className="relative z-10 mb-6">
        <p className="text-[10px] font-bold uppercase tracking-widest text-[#4B6478] mb-3">PRO</p>
        <div className="flex items-end gap-2 mb-1">
          <span className="text-sm text-[#4B6478] line-through">{fmtIDR(data.proStrike)}</span>
          <span className="text-[10px] bg-emerald-500/15 text-emerald-400 font-bold px-2 py-0.5 rounded-full">
            HEMAT {Math.round((1 - data.proPrice / data.proStrike) * 100)}%
          </span>
        </div>
        <div className="flex items-end gap-1">
          <span className="font-['Sora'] text-3xl font-black text-white">{fmtIDR(price)}</span>
          <span className="text-sm text-[#4B6478] mb-1">/bln</span>
        </div>
        {billing === 'yearly' && (
          <p className="text-xs text-[#4B6478] mt-1">
            {fmtIDR(yearlyTotal)}/tahun · hemat {discountPct}%
          </p>
        )}
      </div>

      <ul className="relative z-10 space-y-3 mb-5 flex-1">
        {data.proFeatures.map((f, i) => <FeatureItem key={i} text={f} />)}
      </ul>

      {data.addOnNote && (
        <div className="relative z-10 bg-amber-500/10 border border-amber-500/20 rounded-xl p-3 mb-5 text-[11px] text-amber-400 leading-relaxed font-medium">
          💡 Punya lebih dari 1 jenis ternak aktif? Tambahkan +Rp&nbsp;99.000/bln per jenis. Maks 2 add-on, lebih dari itu otomatis lebih hemat upgrade ke Business.
        </div>
      )}

      <Link
        to={isLoggedIn ? "/upgrade?plan=pro" : "/register"}
        onClick={() => {
          if (!isLoggedIn) {
            sessionStorage.setItem('intended_trial_plan', 'pro')
          }
        }}
        className="relative z-10 block text-center py-3 rounded-xl border border-emerald-500/40 text-emerald-400 text-sm font-bold hover:bg-emerald-500/10 transition-colors"
      >
        Mulai {data.trialDays || 14} Hari Gratis
      </Link>
    </div>
  )
}

export function BusinessCard({ data, billing, annualDiscount, isLoggedIn }) {
  const price = billing === 'yearly' ? data.bizYearly : data.bizPrice
  const yearlyTotal = data.bizYearly * 12
  const yearlySaving = (data.bizPrice - data.bizYearly) * 12
  const discountPct = annualDiscount?.discount_percent || 20

  return (
    <div className="relative">
      <div className="absolute -top-4 left-1/2 -translate-x-1/2 z-10 whitespace-nowrap">
        <span className="bg-emerald-500 text-white text-[10px] font-black uppercase tracking-widest px-4 py-1.5 rounded-full shadow-[0_4px_16px_rgba(2, 26, 2,0.4)]">
          ⚡ PALING POPULER
        </span>
      </div>

      <div
        className="group relative bg-[#0C1319] rounded-2xl p-8 border-2 border-emerald-500/60 flex flex-col h-full transition-all duration-300 hover:border-emerald-500 hover:shadow-[0_24px_60px_rgba(2, 26, 2,0.25)]"
        style={{ boxShadow: '0 0 40px rgba(2, 26, 2,0.15)' }}
      >
        <div className="absolute inset-0 bg-gradient-to-br from-emerald-500/5 via-transparent to-transparent pointer-events-none rounded-2xl" />

        <div className="relative z-10 mb-6">
          <p className="text-[10px] font-bold uppercase tracking-widest text-emerald-400 mb-3">BUSINESS</p>
          <div className="flex items-end gap-2 mb-1">
            <span className="text-sm text-[#4B6478] line-through">{fmtIDR(data.bizStrike)}</span>
            <span className="text-[10px] bg-emerald-500/15 text-emerald-400 font-bold px-2 py-0.5 rounded-full">
              HEMAT {Math.round((1 - data.bizPrice / data.bizStrike) * 100)}%
            </span>
          </div>
          <div className="flex items-end gap-1">
            <span className="font-['Sora'] text-3xl font-black text-white">{fmtIDR(price)}</span>
            <span className="text-sm text-[#4B6478] mb-1">/bln</span>
          </div>
          {billing === 'yearly' && (
            <p className="text-xs text-[#4B6478] mt-1">
              {fmtIDR(yearlyTotal)}/tahun · hemat {discountPct}%
            </p>
          )}
          {billing === 'yearly' && (
            <div className="mt-4 bg-amber-500/10 border border-amber-500/20 rounded-xl px-3 py-2">
              <p className="text-[11px] text-amber-400 font-bold">
                💡 Hemat {fmtIDR(yearlySaving)} vs bayar bulanan
              </p>
            </div>
          )}
        </div>

        <div className="relative z-10 mb-6">
          <SocialAvatars count={data.socialProof} />
        </div>

        <ul className="relative z-10 space-y-3 mb-2 flex-1">
          {data.proFeatures.map((f, i) => <FeatureItem key={i} text={f} />)}
          <li className="pt-2 border-t border-white/8" />
          {data.bizExtras.map((f, i) => <FeatureItem key={i} text={f} isExtra />)}
        </ul>

        <div className="relative z-10 mt-8">
          <Link
            to={isLoggedIn ? "/upgrade?plan=business" : "/register"}
            onClick={() => {
              if (!isLoggedIn) {
                sessionStorage.setItem('intended_trial_plan', 'business')
              }
            }}
            className="block text-center py-3.5 rounded-xl bg-emerald-500 hover:bg-emerald-400 text-white text-sm font-bold transition-all shadow-[0_4px_20px_rgba(2, 26, 2,0.3)] hover:shadow-[0_4px_28px_rgba(2, 26, 2,0.45)] hover:-translate-y-0.5 active:translate-y-0"
          >
            Mulai {data.trialDays || 14} Hari Gratis
          </Link>
          <p className="text-center text-[11px] text-[#4B6478] mt-3 font-medium">Tidak perlu kartu kredit</p>
        </div>
      </div>
    </div>
  )
}

export function EnterpriseCard() {
  return (
    <div className="group relative bg-[linear-gradient(135deg,rgba(255,255,255,0.04),rgba(255,255,255,0.01))] rounded-2xl p-8 border border-white/8 flex flex-col h-full transition-all duration-300 hover:border-white/20">
      <div className="relative z-10 mb-6">
        <p className="text-[10px] font-bold uppercase tracking-widest text-[#4B6478] mb-3">ENTERPRISE</p>
        <div className="flex items-baseline gap-1 mb-1">
          <span className="font-['Sora'] text-3xl font-black text-white">Custom</span>
        </div>
        <p className="text-xs text-[#4B6478] mt-1">Harga disesuaikan kebutuhan bisnis</p>
      </div>

      <ul className="relative z-10 space-y-3 mb-8 flex-1">
        {ENTERPRISE_FEATURES.map((f, i) => <FeatureItem key={i} text={f} />)}
      </ul>

      <a
        href={WA_URL}
        target="_blank"
        rel="noopener noreferrer"
        className="relative z-10 block text-center py-3 rounded-xl border border-white/10 text-white text-sm font-bold hover:border-white/30 hover:bg-white/5 transition-all"
      >
        Hubungi Kami
      </a>
    </div>
  )
}
