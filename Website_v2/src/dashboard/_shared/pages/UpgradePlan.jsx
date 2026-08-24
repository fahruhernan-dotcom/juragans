import { useState, useEffect } from 'react'
import { useNavigate, useSearchParams } from 'react-router-dom'
import { motion, AnimatePresence } from 'framer-motion'
import {
  Check, ArrowLeft, Zap, Crown, Loader2, CheckCircle2, XCircle, AlertCircle,
  Truck, Users, FileText, TrendingUp, Calculator, Warehouse,
  Receipt, BarChart3, ShieldCheck, Headphones, Infinity as InfinityIcon,
  ChevronDown, ChevronUp, Star, Building2, Clock,
} from 'lucide-react'
import { cn } from '@/lib/utils'
import { openBrowserUrl } from '@/lib/capacitor'
import { useAuth } from '@/lib/hooks/useAuth'
import { useMediaQuery } from '@/lib/hooks/useMediaQuery'
import { usePricingConfig, useCreateInvoice, useActivateTrial, usePlanConfigs, useHasPendingInvoice, useCancelPendingInvoice } from '@/lib/hooks/useAdminData'
import { supabase } from '@/lib/supabase'
import { formatIDR } from '@/lib/format'
import { getSubscriptionStatus } from '@/lib/subscriptionUtils'
import { FALLBACK_TRANSACTION_QUOTA } from '@/lib/constants/planGating'
import { format, addMonths } from 'date-fns'
import { id as localeId } from 'date-fns/locale/id'
import { enUS as localeEn } from 'date-fns/locale/en-US'
import { toast } from 'sonner'
import { useLanguage } from '@/lib/i18n/useLanguage'
import { logError } from '@/lib/logger/errorLogger'
import { logSupabaseError } from '@/lib/logger/supabaseLogger'

// ─── Billing options ─────────────────────────────────────────────────────────

const BILLING_OPTIONS = [
  { months: 1,  label: '1 Bln',   discount: 0   },
  { months: 3,  label: '3 Bln',   discount: 5   },
  { months: 6,  label: '6 Bln',   discount: 10  },
  { months: 12, label: '1 Tahun', discount: 20  },
]

// ─── Role-specific feature matrix ────────────────────────────────────────────

const ROLE_FEATURES = {
  broker: {
    label: 'Broker Ayam',
    labelKey: 'role_broker_ayam_display',
    pro: [
      { key: 'feat_broker_pro_unlimited', icon: <InfinityIcon size={13} />, text: 'Transaksi tidak terbatas (vs {{STARTER_QUOTA}}/bln)' },
      { key: 'feat_broker_pro_fleet', icon: <Truck size={13} />,    text: 'Armada hingga 5 kendaraan & sopir' },
      { key: 'feat_broker_pro_cashflow', icon: <TrendingUp size={13} />, text: 'Cash Flow & laporan keuangan' },
      { key: 'feat_broker_pro_team', icon: <Users size={13} />,    text: 'Tim hingga 3 anggota' },
      { key: 'feat_broker_pro_invoice', icon: <FileText size={13} />, text: 'Generate invoice & PDF profesional' },
      { key: 'feat_broker_pro_simulator', icon: <Calculator size={13} />, text: 'Simulator keuntungan' },
    ],
    business: [
      { key: 'feat_broker_biz_all_pro', icon: <InfinityIcon size={13} />, text: 'Semua fitur Pro' },
      { key: 'feat_broker_biz_unlimited_team', icon: <Users size={13} />,    text: 'Tim tidak terbatas' },
      { key: 'feat_broker_biz_unlimited_fleet', icon: <Truck size={13} />,    text: 'Armada tidak terbatas' },
      { key: 'feat_broker_biz_advanced_reports', icon: <BarChart3 size={13} />, text: 'Laporan & analitik lanjutan' },
      { key: 'feat_broker_biz_api', icon: <ShieldCheck size={13} />, text: 'Akses API & integrasi' },
      { key: 'feat_broker_biz_manager', icon: <Headphones size={13} />, text: 'Dedicated account manager' },
    ],
  },
  peternak: {
    label: 'Peternak',
    labelKey: 'role_peternak_display',
    pro: [
      { key: 'feat_peternak_pro_barns', icon: <Warehouse size={13} />, text: 'Hingga 3 kandang' },
      { key: 'feat_peternak_pro_fcr', icon: <TrendingUp size={13} />, text: 'Laporan profit & FCR otomatis' },
      { key: 'feat_peternak_pro_export', icon: <FileText size={13} />, text: 'Export PDF & cetak laporan' },
      { key: 'feat_peternak_pro_history', icon: <Receipt size={13} />,  text: 'Riwayat siklus panen lengkap' },
      { key: 'feat_peternak_pro_analytics', icon: <BarChart3 size={13} />, text: 'Analitik performa kandang' },
      { key: 'feat_peternak_pro_support', icon: <Headphones size={13} />, text: 'Support prioritas WhatsApp' },
    ],
    business: [
      { key: 'feat_peternak_biz_all_pro', icon: <InfinityIcon size={13} />, text: 'Semua fitur Pro' },
      { key: 'feat_peternak_biz_unlimited_barns', icon: <Warehouse size={13} />, text: 'Kandang tidak terbatas' },
      { key: 'feat_peternak_biz_multiuser', icon: <Users size={13} />,    text: 'Multi-user manajemen kandang' },
      { key: 'feat_peternak_biz_api', icon: <ShieldCheck size={13} />, text: 'Akses API data produksi' },
      { key: 'feat_peternak_biz_enterprise_dashboard', icon: <BarChart3 size={13} />, text: 'Dashboard analitik enterprise' },
      { key: 'feat_peternak_biz_manager', icon: <Headphones size={13} />, text: 'Dedicated account manager' },
    ],
  },
  rpa: {
    label: 'Rumah Potong Ayam',
    labelKey: 'role_rpa_display',
    pro: [
      { key: 'feat_rpa_pro_unlimited', icon: <InfinityIcon size={13} />, text: 'Order & transaksi tidak terbatas' },
      { key: 'feat_rpa_pro_receivables', icon: <Receipt size={13} />,  text: 'Manajemen piutang toko' },
      { key: 'feat_rpa_pro_invoice', icon: <FileText size={13} />, text: 'Invoice PDF profesional' },
      { key: 'feat_rpa_pro_sales', icon: <BarChart3 size={13} />, text: 'Laporan penjualan & omzet' },
      { key: 'feat_rpa_pro_team', icon: <Users size={13} />,    text: 'Tim hingga 3 anggota' },
      { key: 'feat_rpa_pro_support', icon: <Headphones size={13} />, text: 'Support prioritas WhatsApp' },
    ],
    business: [
      { key: 'feat_rpa_biz_all_pro', icon: <InfinityIcon size={13} />, text: 'Semua fitur Pro' },
      { key: 'feat_rpa_biz_multilocation', icon: <Warehouse size={13} />, text: 'Multi-lokasi / multi-outlet' },
      { key: 'feat_rpa_biz_unlimited_team', icon: <Users size={13} />,    text: 'Tim tidak terbatas' },
      { key: 'feat_rpa_biz_api', icon: <ShieldCheck size={13} />, text: 'Akses API & integrasi ERP' },
      { key: 'feat_rpa_biz_enterprise_dashboard', icon: <BarChart3 size={13} />, text: 'Dashboard analitik enterprise' },
      { key: 'feat_rpa_biz_manager', icon: <Headphones size={13} />, text: 'Dedicated account manager' },
    ],
  },
  egg_broker: {
    label: 'Broker Telur',
    labelKey: 'role_egg_broker_display',
    pro: [
      { key: 'feat_egg_broker_pro_unlimited', icon: <InfinityIcon size={13} />, text: 'Penjualan & stok tidak terbatas' },
      { key: 'feat_egg_broker_pro_cogs', icon: <BarChart3 size={13} />, text: 'Laporan omzet & HPP otomatis' },
      { key: 'feat_egg_broker_pro_invoice', icon: <FileText size={13} />, text: 'Invoice PDF profesional' },
      { key: 'feat_egg_broker_pro_receivables', icon: <Receipt size={13} />,  text: 'Manajemen piutang pelanggan' },
      { key: 'feat_egg_broker_pro_team', icon: <Users size={13} />,    text: 'Tim hingga 3 anggota' },
      { key: 'feat_egg_broker_pro_support', icon: <Headphones size={13} />, text: 'Support prioritas WhatsApp' },
    ],
    business: [
      { key: 'feat_egg_broker_biz_all_pro', icon: <InfinityIcon size={13} />, text: 'Semua fitur Pro' },
      { key: 'feat_egg_broker_biz_multilocation', icon: <Warehouse size={13} />, text: 'Multi-gudang / multi-lokasi' },
      { key: 'feat_egg_broker_biz_unlimited_team', icon: <Users size={13} />,    text: 'Tim tidak terbatas' },
      { key: 'feat_egg_broker_biz_api', icon: <ShieldCheck size={13} />, text: 'Akses API & integrasi' },
      { key: 'feat_egg_broker_biz_enterprise_dashboard', icon: <BarChart3 size={13} />, text: 'Dashboard analitik enterprise' },
      { key: 'feat_egg_broker_biz_manager', icon: <Headphones size={13} />, text: 'Dedicated account manager' },
    ],
  },
  sembako_broker: {
    label: 'Distributor Sembako',
    labelKey: 'role_sembako_broker_display',
    pro: [
      { key: 'feat_sembako_pro_unlimited', icon: <InfinityIcon size={13} />, text: 'Produk & transaksi tidak terbatas' },
      { key: 'feat_sembako_pro_fifo', icon: <BarChart3 size={13} />, text: 'FIFO stok & laporan COGS' },
      { key: 'feat_sembako_pro_invoice', icon: <FileText size={13} />, text: 'Invoice & surat jalan PDF' },
      { key: 'feat_sembako_pro_payroll', icon: <Receipt size={13} />,  text: 'Penggajian karyawan' },
      { key: 'feat_sembako_pro_team', icon: <Users size={13} />,    text: 'Tim hingga 3 anggota' },
      { key: 'feat_sembako_pro_support', icon: <Headphones size={13} />, text: 'Support prioritas WhatsApp' },
    ],
    business: [
      { key: 'feat_sembako_biz_all_pro', icon: <InfinityIcon size={13} />, text: 'Semua fitur Pro' },
      { key: 'feat_sembako_biz_multilocation', icon: <Warehouse size={13} />, text: 'Multi-gudang / multi-outlet' },
      { key: 'feat_sembako_biz_unlimited_team', icon: <Users size={13} />,    text: 'Tim tidak terbatas' },
      { key: 'feat_sembako_biz_api', icon: <ShieldCheck size={13} />, text: 'Akses API & integrasi ERP' },
      { key: 'feat_sembako_biz_enterprise_dashboard', icon: <BarChart3 size={13} />, text: 'Dashboard analitik enterprise' },
      { key: 'feat_sembako_biz_manager', icon: <Headphones size={13} />, text: 'Dedicated account manager' },
    ],
  },
}

// ─── Plan config ──────────────────────────────────────────────────────────────

const PLAN_META = {
  pro: {
    label:       'Pro',
    tagline:     'Untuk bisnis yang berkembang',
    icon:        <Zap size={20} />,
    color:       '#34D399',
    colorMid:    'rgba(52, 211, 153, 0.2)',
    colorLow:    'rgba(52, 211, 153, 0.05)',
    colorBorder: 'rgba(52, 211, 153, 0.3)',
    glow:        '0 0 40px rgba(52, 211, 153, 0.15)',
    badge:       null,
  },
  business: {
    label:       'Business',
    tagline:     'Untuk operasi skala besar',
    icon:        <Crown size={20} />,
    color:       '#F59E0B',
    colorMid:    'rgba(245, 158, 11, 0.2)',
    colorLow:    'rgba(245, 158, 11, 0.05)',
    colorBorder: 'rgba(245, 158, 11, 0.3)',
    glow:        '0 0 40px rgba(245, 158, 11, 0.15)',
    badge:       'Populer',
  },
}

// ─── Helpers ──────────────────────────────────────────────────────────────────

// Map tenant.business_vertical → pricing_plans.role key
const VERTICAL_TO_PRICING_ROLE = {
  poultry_broker:                    'broker',
  egg_broker:                        'egg_broker',
  peternak:                          'peternak',
  peternak_ayam_broiler:             'peternak_ayam_broiler',
  peternak_ayam_layer:               'peternak_ayam_layer',
  peternak_sapi_penggemukan:         'peternak_sapi_potong_fattening',
  peternak_sapi_potong_fattening:    'peternak_sapi_potong_fattening',
  peternak_sapi_potong_breeding:     'peternak_sapi_potong_breeding',
  peternak_sapi_perah:               'peternak_sapi_perah',
  peternak_kambing_penggemukan:      'peternak_kambing_potong_fattening',
  peternak_kambing_potong_fattening: 'peternak_kambing_potong_fattening',
  peternak_kambing_potong_breeding:  'peternak_kambing_potong_breeding',
  peternak_kambing_perah:            'peternak_kambing_perah',
  peternak_domba_penggemukan:        'peternak_domba_potong_fattening',
  peternak_domba_potong_fattening:   'peternak_domba_potong_fattening',
  peternak_domba_potong_breeding:    'peternak_domba_potong_breeding',
  rumah_potong:                      'rpa',
  sembako_broker:                    'sembako_broker',
  distributor_sembako:               'sembako_broker',
}

function getPricingRole(tenant) {
  return VERTICAL_TO_PRICING_ROLE[tenant?.business_vertical] || 'broker'
}

function getRoleFeatures(pricingRole, starterQuota = FALLBACK_TRANSACTION_QUOTA, t) {
  const featureKey = ROLE_FEATURES[pricingRole]
    ? pricingRole
    : pricingRole?.startsWith('peternak_') ? 'peternak' : 'broker'
  const base = ROLE_FEATURES[featureKey]

  const mapFeature = (f) => {
    let text = t ? t(f.key, f.text) : f.text
    if (typeof text === 'string' && text.includes('{{STARTER_QUOTA}}')) {
      text = text.replace('{{STARTER_QUOTA}}', starterQuota)
    }
    return { ...f, text }
  }

  return {
    ...base,
    label: t ? t(base.labelKey, base.label) : base.label,
    pro: base.pro.map(mapFeature),
    business: base.business.map(mapFeature),
  }
}

// ─── Sub-components ───────────────────────────────────────────────────────────

function PlanCard({ planKey, meta, price, isSelected, onSelect, features, _billingMonths, discount }) {
  const { t, tPlan } = useLanguage()
  const monthlyDisplay = price ? formatIDR(Math.round(price * (1 - discount / 100))) : '—'
  const originalMonthly = price ? formatIDR(price) : null
  const tagline = planKey === 'pro' ? t('plan_pro_tagline', meta.tagline) : t('plan_business_tagline', meta.tagline)
  const badge = meta.badge ? t('plan_popular_badge', meta.badge) : null

  return (
    <motion.button
      whileTap={{ scale: 0.97 }}
      onClick={() => onSelect(planKey)}
      className="relative w-full text-left rounded-2xl p-4 sm:p-5 transition-all duration-200 focus:outline-none"
      style={{
        background: isSelected ? (planKey === 'pro' ? 'rgba(16, 185, 129, 0.05)' : 'rgba(245, 158, 11, 0.05)') : '#0C1319',
        border: `1.5px solid ${isSelected ? (planKey === 'pro' ? 'rgba(16, 185, 129, 0.3)' : 'rgba(245, 158, 11, 0.3)') : 'rgba(255,255,255,0.08)'}`,
        boxShadow: isSelected ? meta.glow : 'none',
      }}
    >
      {/* Badge */}
      {badge && (
        <div
          className="absolute -top-2.5 left-1/2 -translate-x-1/2 flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[10px] font-black uppercase tracking-widest"
          style={{ background: meta.color, color: '#000' }}
        >
          <Star size={8} fill="currentColor" /> {badge}
        </div>
      )}

      {/* Selected checkmark */}
      {isSelected && (
        <div
          className="absolute top-3 right-3 w-5 h-5 rounded-full flex items-center justify-center animate-in zoom-in-50 duration-300"
          style={{ background: meta.color }}
        >
          <Check size={11} color="#000" strokeWidth={3} />
        </div>
      )}

      {/* Plan header */}
      <div className="flex items-center gap-2 mb-2" style={{ color: planKey === 'pro' ? '#A7F3D0' : '#FDE68A' }}>
        {meta.icon}
        <span className={cn("font-display font-black text-base", planKey === 'pro' ? "text-emerald-300" : "text-amber-300")}>{tPlan(planKey)}</span>
      </div>

      {/* Price */}
      <div className="mb-1">
        <div className="flex items-baseline gap-1.5">
          <span className={cn("font-display font-black text-xl", planKey === 'pro' ? "text-emerald-300" : "text-amber-300")}>
            {monthlyDisplay}
          </span>
          <span className="text-[11px] text-slate-400">{t('billing_per_month', '/bln')}</span>
        </div>
        {discount > 0 && originalMonthly && (
          <div className="text-[10px] text-slate-500 line-through mt-0.5">{originalMonthly}{t('billing_per_month', '/bln')}</div>
        )}
      </div>

      <p className="text-[11px] text-slate-400">{tagline}</p>

      {/* Features mini-list (3 items) */}
      <div className="mt-3 space-y-1.5">
        {features.slice(0, 3).map((f, i) => (
          <div key={i} className="flex items-center gap-2">
            <div style={{ color: planKey === 'pro' ? '#34D399' : '#F59E0B', flexShrink: 0 }}>{f.icon}</div>
            <span className="text-[11px] text-slate-300 leading-tight">{f.text}</span>
          </div>
        ))}
        {features.length > 3 && (
          <div className="text-[10px] font-semibold mt-1" style={{ color: planKey === 'pro' ? '#34D399' : '#F59E0B' }}>
            {t('upgrade_more_features', '+{count} fitur lainnya ↓').replace('{count}', features.length - 3)}
          </div>
        )}
      </div>
    </motion.button>
  )
}

function FeatureSection({ planKey, meta, features, billingMonths, basePrice, discount, isExpanded, onToggle }) {
  const { t, tPlan } = useLanguage()
  const _total = basePrice ? Math.round(basePrice * billingMonths * (1 - discount / 100)) : 0

  return (
    <div
      className="rounded-2xl overflow-hidden"
      style={{ border: `1px solid ${planKey === 'pro' ? 'rgba(16, 185, 129, 0.2)' : 'rgba(245, 158, 11, 0.2)'}`, background: planKey === 'pro' ? 'rgba(16, 185, 129, 0.03)' : 'rgba(245, 158, 11, 0.03)' }}
    >
      <button
        onClick={onToggle}
        className="w-full flex items-center justify-between px-4 py-3 text-left"
      >
        <div className="flex items-center gap-2">
          <div style={{ color: planKey === 'pro' ? '#6EE7B7' : '#FCD34D' }}>{meta.icon}</div>
          <span className={cn("font-display font-bold text-sm", planKey === 'pro' ? "text-emerald-300" : "text-amber-300")}>
            {t('upgrade_all_features_of', 'Semua fitur {label}').replace('{label}', tPlan(planKey))}
          </span>
        </div>
        <div style={{ color: planKey === 'pro' ? '#6EE7B7' : '#FCD34D' }}>
          {isExpanded ? <ChevronUp size={15} /> : <ChevronDown size={15} />}
        </div>
      </button>

      <AnimatePresence>
        {isExpanded && (
          <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: 'auto', opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            transition={{ duration: 0.2 }}
            className="overflow-hidden"
          >
            <div className="px-4 pb-4 space-y-2.5">
              {features.map((f, i) => (
                <div key={i} className="flex items-start gap-3">
                  <div
                    className="w-5 h-5 rounded-full flex items-center justify-center flex-shrink-0 mt-0.5"
                    style={{ background: planKey === 'pro' ? 'rgba(16, 185, 129, 0.15)' : 'rgba(245, 158, 11, 0.15)', color: planKey === 'pro' ? '#34D399' : '#F59E0B' }}
                  >
                    {f.icon}
                  </div>
                  <span className="text-[12px] text-slate-300 leading-snug">{f.text}</span>
                </div>
              ))}
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  )
}

function BillingSelector({ value, onChange, selectedPlan, allowedMonths = null }) {
  const { t } = useLanguage()
  return (
    <div className="grid grid-cols-4 gap-2">
      {BILLING_OPTIONS.map((opt) => {
        const isSelected = value === opt.months
        const isAllowed = !allowedMonths || allowedMonths.includes(opt.months)

        return (
          <motion.button
            key={opt.months}
            whileTap={isAllowed ? { scale: 0.95 } : {}}
            onClick={() => isAllowed && onChange(opt.months)}
            disabled={!isAllowed}
            className={cn(
              "relative flex flex-col items-center justify-center py-3 rounded-xl text-center transition-all border font-display font-bold text-[11px] sm:text-xs leading-tight focus:outline-none focus:ring-1",
              isSelected
                ? selectedPlan === 'pro'
                  ? "bg-emerald-500/10 border-emerald-400/40 text-emerald-300 focus:ring-emerald-400"
                  : "bg-amber-500/10 border-amber-500/40 text-amber-300 focus:ring-amber-400"
                : isAllowed
                  ? "bg-[#0F1720] border-white/10 text-slate-300 hover:bg-[#121A22] hover:text-white focus:ring-white/20"
                  : "bg-[#0A0E12] border-white/5 text-slate-600 cursor-not-allowed opacity-30"
            )}
          >
            {opt.discount > 0 && (
              <div
                className={cn(
                  "absolute -top-2 left-1/2 -translate-x-1/2 px-1.5 py-0.5 rounded-full text-[9px] font-black bg-emerald-500 text-white"
                )}
              >
                -{opt.discount}%
              </div>
            )}
            <span>
              {opt.months === 12
                ? t('billing_1_year', '1 Tahun')
                : t('billing_months_count', `${opt.months} Bln`).replace('{months}', opt.months)}
            </span>
          </motion.button>
        )
      })}
    </div>
  )
}


// ─── Main Component ───────────────────────────────────────────────────────────

const PAYMENT_STATUS_META = {
  finish: {
    icon: <CheckCircle2 size={18} />,
    title: 'Pembayaran diterima!',
    body: 'Plan kamu sedang diaktifkan. Refresh halaman dalam 1–2 menit.',
    color: '#34D399',
    bg: 'rgba(52, 211, 153, 0.05)',
    border: 'rgba(52, 211, 153, 0.2)',
  },
  unfinish: {
    icon: <AlertCircle size={18} />,
    title: 'Pembayaran belum selesai',
    body: 'Kamu menutup halaman pembayaran sebelum selesai. Klik tombol upgrade untuk melanjutkan.',
    color: '#F59E0B',
    bg: 'rgba(245,158,11,0.05)',
    border: 'rgba(245,158,11,0.2)',
  },
  error: {
    icon: <XCircle size={18} />,
    title: 'Pembayaran gagal',
    body: 'Terjadi kesalahan saat memproses pembayaran. Coba lagi atau hubungi admin.',
    color: '#EF4444',
    bg: 'rgba(239,68,68,0.05)',
    border: 'rgba(239,68,68,0.2)',
  },
}

function mapRpcErrorMessage(message, defaultMsg = 'Gagal memproses.') {
  if (!message) return defaultMsg
  if (message.includes('ACCESS_DENIED')) {
    return 'Kamu belum punya akses ke bisnis ini.'
  }
  if (message.includes('DISCOUNT_NOT_FOUND')) {
    return 'Kode diskon tidak ditemukan.'
  }
  if (message.includes('DISCOUNT_INACTIVE')) {
    return 'Kode diskon tidak aktif.'
  }
  if (message.includes('DISCOUNT_EXPIRED')) {
    return 'Kode diskon sudah kedaluwarsa.'
  }
  if (message.includes('DISCOUNT_USAGE_LIMIT')) {
    return 'Kuota kode diskon sudah habis.'
  }
  if (message.includes('DISCOUNT_PLAN_NOT_ALLOWED')) {
    return 'Kode diskon tidak berlaku untuk paket ini.'
  }
  if (message.includes('DISCOUNT_ROLE_NOT_ALLOWED')) {
    return 'Kode diskon tidak berlaku untuk jenis bisnis ini.'
  }
  if (message.includes('DISCOUNT_BILLING_MONTHS_NOT_ALLOWED')) {
    return 'Kode diskon tidak berlaku untuk durasi langganan ini.'
  }
  return message
}

export default function UpgradePlan() {
  const navigate = useNavigate()
  const [searchParams] = useSearchParams()
  const { profile, tenant, refetchProfile } = useAuth()
  const { data: pricing } = usePricingConfig()
  const createInvoice  = useCreateInvoice()
  const activateTrial  = useActivateTrial()
  const { data: planConfigs = {} } = usePlanConfigs()
  const { data: pendingInvoice } = useHasPendingInvoice(profile?.tenant_id)
  const cancelPendingInvoice = useCancelPendingInvoice()
  const { lang, t, tPlan } = useLanguage()

  // Resolve active role using profile.role or profile.app_role as fallback.
  // Backend RPC remains source of truth for authorization.
  const activeRole = (profile?.role || profile?.app_role || '').toLowerCase()
  const isBillingCapable = ['owner', 'admin', 'manajer', 'manager'].includes(activeRole)

  const [cancelInvoiceData, setCancelInvoiceData] = useState(null)

  const [selectedPlan, setSelectedPlan] = useState(() => {
    const p = searchParams.get('plan')
    return (p === 'business' || p === 'pro') ? p : 'pro'
  })
  const [billingMonths, setBillingMonths] = useState(1)
  const [expandedFeature, setExpandedFeature] = useState('pro')
  const [redirecting, setRedirecting] = useState(false)

  const [promoInput, setPromoInput] = useState('')
  const [appliedPromo, setAppliedPromo] = useState('')
  const [promoError, setPromoError] = useState('')
  const [isValidatingPromo, setIsValidatingPromo] = useState(false)

  const [previewResult, setPreviewResult] = useState(null)
  const [isLoadingPreview, setIsLoadingPreview] = useState(false)

  const pricingRole  = getPricingRole(tenant)
  const starterQuota = planConfigs?.transaction_quota?.starter ?? FALLBACK_TRANSACTION_QUOTA
  const roleFeatures = getRoleFeatures(pricingRole, starterQuota, t)

  const sub       = getSubscriptionStatus(tenant)
  const isRenewal = sub.status === 'active' && tenant?.plan === selectedPlan

  const basePrice  = pricing?.[pricingRole]?.[selectedPlan]?.price || 0
  const discount   = BILLING_OPTIONS.find(o => o.months === billingMonths)?.discount || 0

  useEffect(() => {
    const htmlEl = document.documentElement
    const hasDark = htmlEl.classList.contains('dark')
    if (!hasDark) {
      htmlEl.classList.add('dark')
    }
    return () => {
      if (!hasDark) {
        htmlEl.classList.remove('dark')
      }
    }
  }, [])

  useEffect(() => {
    let active = true
    if (!profile?.tenant_id || !selectedPlan) return

    async function fetchPreview() {
      setIsLoadingPreview(true)
      try {
        const { data, error } = await supabase.rpc('preview_subscription_checkout', {
          p_tenant_id: profile.tenant_id,
          p_plan: selectedPlan,
          p_billing_months: billingMonths,
          p_discount_code: appliedPromo || null,
        })

        if (!active) return

        if (error) {
          console.error('Failed to preview checkout:', error)
          logSupabaseError(error, {
            operation: 'rpc',
            component: 'UpgradePlan',
            actionName: 'checkout.preview.rpc_error',
            tenantId: profile?.tenant_id,
          })
          const msg = mapRpcErrorMessage(error.message, t('upgrade_toast_midtrans_failed', 'Gagal memproses perhitungan harga.'))
          setPreviewResult(null)
          if (appliedPromo) {
            setAppliedPromo('')
            setPromoError(msg)
            toast.error(msg)
          }
        } else {
          setPreviewResult(data)
          if (data?.discount_applies_to_billing_months && data.discount_applies_to_billing_months.length > 0) {
            const allowed = data.discount_applies_to_billing_months
            if (!allowed.includes(billingMonths)) {
              setBillingMonths(allowed[0])
            }
          }
        }
      } catch (_err) {
        if (!active) return
        logError({
          error: _err,
          message: 'Exception in fetchPreview subscription checkout',
          component: 'UpgradePlan',
          actionName: 'checkout.preview.catch',
          metadata: {
            tenantId: profile?.tenant_id,
            plan: selectedPlan,
            billingMonths,
            appliedPromo,
          }
        })
        setPreviewResult(null)
      } finally {
        if (active) setIsLoadingPreview(false)
      }
    }

    fetchPreview()
    return () => {
      active = false
    }
  }, [profile?.tenant_id, selectedPlan, billingMonths, appliedPromo, t])

  const handleApplyPromo = async (e) => {
    e.preventDefault()
    const code = promoInput.trim().toUpperCase()
    if (!code) return

    setIsValidatingPromo(true)
    setPromoError('')

    try {
      const { error } = await supabase.rpc('preview_subscription_checkout', {
        p_tenant_id: profile.tenant_id,
        p_plan: selectedPlan,
        p_billing_months: billingMonths,
        p_discount_code: code,
      })

      if (error) {
        logSupabaseError(error, {
          operation: 'rpc',
          component: 'UpgradePlan',
          actionName: 'promo.apply.rpc_error',
          tenantId: profile?.tenant_id,
          metadata: { code }
        })
        const msg = mapRpcErrorMessage(error.message, 'Gagal memproses kode diskon.')
        setPromoError(msg)
        toast.error(msg)
      } else {
        setAppliedPromo(code)
        setPromoInput(code)
        toast.success('Kode diskon berhasil diterapkan!')
      }
    } catch (err) {
      logError({
        error: err,
        message: 'Exception in handleApplyPromo',
        component: 'UpgradePlan',
        actionName: 'promo.apply.catch',
        metadata: {
          tenantId: profile?.tenant_id,
          code,
        }
      })
      setPromoError(err.message || 'Error')
    } finally {
      setIsValidatingPromo(false)
    }
  }

  const handleRemovePromo = () => {
    setAppliedPromo('')
    setPromoInput('')
    setPromoError('')
    toast.info('Kode diskon dihapus.')
  }

  const handleCancelPendingInvoice = () => {
    if (!pendingInvoice) return
    setCancelInvoiceData(pendingInvoice)
  }

  const confirmCancelPendingInvoice = async () => {
    if (!cancelInvoiceData || cancelPendingInvoice.isPending) return
    try {
      const res = await cancelPendingInvoice.mutateAsync({
        invoiceId: cancelInvoiceData.id,
        tenantId: profile?.tenant_id
      })

      if (res?.ok) {
        toast.success(t('upgrade_toast_invoice_cancelled_success', 'Invoice pending berhasil dibatalkan.'))
        refetchProfile()
        setCancelInvoiceData(null)
      } else {
        const errType = res?.error
        let errorMsg = t('upgrade_toast_invoice_cancel_failed', 'Invoice tidak dapat dibatalkan.')
        if (errType === 'UNAUTHORIZED') {
          errorMsg = t('upgrade_toast_invoice_cancel_unauthorized', 'Kamu tidak punya akses untuk membatalkan invoice ini.')
        } else if (errType === 'INVOICE_NOT_FOUND') {
          errorMsg = t('upgrade_toast_invoice_cancel_not_found', 'Invoice tidak ditemukan.')
        } else if (errType === 'INVOICE_NOT_PENDING') {
          errorMsg = t('upgrade_toast_invoice_cancel_not_pending', 'Invoice sudah tidak pending.')
          refetchProfile()
        } else if (errType === 'INVOICE_ALREADY_PAID_OR_PROCESSING') {
          errorMsg = t('upgrade_toast_invoice_cancel_already_paid', 'Invoice sudah diproses pembayaran, tidak bisa dibatalkan.')
          refetchProfile()
        }
        logError({
          level: 'error',
          source: 'frontend',
          component: 'UpgradePlan',
          actionName: 'user.invoice.cancel.failed_response',
          error: new Error(`Cancel pending invoice failed with status: ${errType}`),
          metadata: {
            invoiceId: cancelInvoiceData?.id,
            tenantId: profile?.tenant_id,
            response: res,
          }
        })
        toast.error(errorMsg)
        setCancelInvoiceData(null)
      }
    } catch (err) {
      logError({
        error: err,
        message: 'Exception in confirmCancelPendingInvoice',
        component: 'UpgradePlan',
        actionName: 'user.invoice.cancel.catch',
        metadata: {
          invoiceId: cancelInvoiceData?.id,
          tenantId: profile?.tenant_id,
        }
      })
      toast.error(err?.message || t('upgrade_toast_invoice_cancel_failed', 'Gagal membatalkan invoice. Hubungi admin.'))
      setCancelInvoiceData(null)
    }
  }

  const displayOriginalAmount = previewResult?.original_amount ?? (basePrice * billingMonths)
  const displayDurationDiscount = previewResult?.duration_discount_amount ?? Math.round(basePrice * billingMonths * (discount / 100))
  const displayPromoDiscount = previewResult?.discount_amount ?? 0
  const displayFinalAmount = previewResult?.final_amount ?? (basePrice * billingMonths - displayDurationDiscount)

  const activeLocale  = lang === 'en' ? localeEn : localeId
  const renewalBase   = isRenewal && sub.expiresAt > new Date() ? sub.expiresAt : new Date()
  const newExpiry     = addMonths(renewalBase, billingMonths)
  const newExpiryStr  = format(newExpiry, 'd MMM yyyy', { locale: activeLocale })

  const isDesktop       = useMediaQuery('(min-width: 1024px)')
  const currentPlanMeta = PLAN_META[selectedPlan]
  const trialUsed       = !!tenant?.trial_ends_at
  const canTrial        = sub.plan === 'starter' && !trialUsed
  const trialDays       = selectedPlan === 'business'
    ? (planConfigs?.trial_config?.business ?? 7)
    : (planConfigs?.trial_config?.pro ?? 7)

  const getPaymentTranslation = (status) => {
    if (status === 'finish') {
      return {
        title: t('payment_success_title', 'Pembayaran diterima!'),
        body: t('payment_success_body', 'Plan kamu sedang diaktifkan. Refresh halaman dalam 1–2 menit.'),
      }
    }
    if (status === 'unfinish') {
      return {
        title: t('payment_pending_title', 'Pembayaran belum selesai'),
        body: t('payment_pending_body', 'Kamu menutup halaman pembayaran sebelum selesai. Klik tombol upgrade untuk melanjutkan.'),
      }
    }
    if (status === 'error') {
      return {
        title: t('payment_failed_title', 'Pembayaran gagal'),
        body: t('payment_failed_body', 'Terjadi kesalahan saat memproses pembayaran. Coba lagi atau hubungi admin.'),
      }
    }
    return null
  }

  const paymentStatus   = searchParams.get('payment') // 'finish' | 'unfinish' | 'error' | null
  const paymentMeta     = PAYMENT_STATUS_META[paymentStatus] ?? null
  const paymentTrans    = getPaymentTranslation(paymentStatus)

  const paymentBanner = paymentMeta && paymentTrans && (
    <motion.div
      initial={{ opacity: 0, y: -8 }}
      animate={{ opacity: 1, y: 0 }}
      className="flex items-start gap-3 p-4 rounded-2xl mb-6"
      style={{ background: paymentMeta.bg, border: `1px solid ${paymentMeta.border}` }}
    >
      <span style={{ color: paymentMeta.color, flexShrink: 0, marginTop: 1 }}>{paymentMeta.icon}</span>
      <div>
        <p className="font-display font-black text-[13px] text-white leading-tight mb-0.5">{paymentTrans.title}</p>
        <p className="text-[12px] text-slate-300">{paymentTrans.body}</p>
      </div>
    </motion.div>
  )

  const handleSubmit = async () => {
    if (!profile?.tenant_id) return
    if (pendingInvoice) {
      // Don't block silently — the banner UI below already shows the cancel option
      toast.warning(t('upgrade_toast_pending_invoice', 'Batalkan invoice lama terlebih dahulu untuk melanjutkan.'))
      return
    }
    try {
      const { invoiceId } = await createInvoice.mutateAsync({
        tenantId:     profile.tenant_id,
        plan:         selectedPlan,
        billingMonths,
        amount:       displayFinalAmount,
        discount_code: appliedPromo || null,
        notes:        `${isRenewal ? t('upgrade_renew', 'Perpanjang') : t('upgrade_to', 'Upgrade ke')} ${tPlan(selectedPlan)} — ${billingMonths} bulan`,
      })
      setRedirecting(true)
      const { data: fnData, error: fnError } = await supabase.functions.invoke('midtrans-create-transaction', {
        body: { invoice_id: invoiceId },
      })
      if (fnError || !fnData?.redirect_url) {
        const is422 = fnError && (fnError.status === 422 || (fnError.context && fnError.context.status === 422) || fnError.message?.includes('422'))

        logError({
          error: fnError || new Error('Missing redirect_url from midtrans function'),
          message: is422 ? 'Midtrans transaction failed with status 422' : 'Failed to create midtrans transaction',
          component: 'UpgradePlan',
          actionName: is422 ? 'billing.midtrans_create_transaction.failed' : 'checkout.submit.midtrans_error',
          metadata: {
            invoice_id: invoiceId,
            tenant_id: profile?.tenant_id,
            plan: selectedPlan,
            amount: displayFinalAmount,
            status: 'pending',
            provider_status: null
          }
        })

        if (is422) {
          toast.error('Pembayaran tidak dapat diproses. Sistem akan membatasi minimum pembayaran Rp5.000. Silakan coba ulang.')
        } else {
          toast.error(t('upgrade_toast_midtrans_failed', 'Gagal menghubungi payment gateway. Silakan coba lagi atau hubungi admin.'))
        }
        setRedirecting(false)
        return
      }
      // On Capacitor (Android), opens in Chrome Custom Tab so Midtrans Snap works correctly.
      // On web, falls back to window.location.assign (same-tab redirect).
      openBrowserUrl(fnData.redirect_url)
    } catch (err) {
      logError({
        error: err,
        message: 'Exception in handleSubmit checkout',
        component: 'UpgradePlan',
        actionName: 'checkout.submit.catch',
        metadata: {
          tenantId: profile?.tenant_id,
          plan: selectedPlan,
          billingMonths,
          amount: displayFinalAmount,
          discount_code: appliedPromo || null,
        }
      })
      setRedirecting(false)
    }
  }

  // ── Shared UI blocks (used in both layouts) ────────────────────────────────

  const planCards = (
    <div className="grid grid-cols-2 gap-3">
      {Object.entries(PLAN_META).map(([key, meta]) => (
        <PlanCard
          key={key} planKey={key} meta={meta}
          price={pricing?.[pricingRole]?.[key]?.price}
          isSelected={selectedPlan === key}
          onSelect={setSelectedPlan}
          features={roleFeatures[key]}
          billingMonths={billingMonths}
          discount={discount}
        />
      ))}
    </div>
  )

  const trialBlock = canTrial ? (
    <motion.div initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }}
      className="rounded-2xl overflow-hidden border border-indigo-500/25"
    >
      <div style={{ background: 'linear-gradient(135deg, rgba(99,102,241,0.1), rgba(168,85,247,0.06))' }}
        className="p-4 flex items-center gap-4"
      >
        <div className="w-10 h-10 rounded-xl flex items-center justify-center flex-shrink-0 bg-indigo-500/20">
          <Zap size={18} className="text-indigo-400" />
        </div>
        <div className="flex-1 min-w-0">
          <p className="font-display font-black text-sm text-white leading-tight">
            {t('upgrade_trial_title', 'Coba {plan} {days} Hari — Gratis')
              .replace('{plan}', tPlan(selectedPlan))
              .replace('{days}', trialDays)}
          </p>
          <p className="text-[11px] text-slate-400 mt-0.5">{t('upgrade_trial_subtitle', 'Tidak perlu kartu kredit. Batalkan kapan saja.')}</p>
        </div>
        <motion.button
          whileTap={{ scale: 0.96 }}
          onClick={() => {
            if (!profile?.tenant_id) {
              toast.error(t('onboarding_error_invalid_config', 'Tenant ID tidak ditemukan.'))
              return
            }
            activateTrial.mutate(
              { tenantId: profile.tenant_id, plan: selectedPlan, days: trialDays },
              {
                onSuccess: () => {
                  navigate('/billing')
                }
              }
            )
          }}
          disabled={activateTrial.isPending}
          className="flex-shrink-0 flex items-center gap-1.5 px-4 py-2 rounded-xl font-display font-black text-[12px] disabled:opacity-60 bg-indigo-600 hover:bg-indigo-500 text-white transition-all focus:outline-none focus:ring-1 focus:ring-indigo-400"
        >
          {activateTrial.isPending ? <Loader2 size={13} className="animate-spin" /> : t('upgrade_try_free', 'Coba Gratis')}
        </motion.button>
      </div>
    </motion.div>
  ) : trialUsed && sub.status !== 'trial' ? (
    <p className="text-[11px] text-slate-500 text-center">{t('upgrade_trial_used', 'Trial sudah pernah digunakan.')}</p>
  ) : null

  const featureSections = (
    <div className="space-y-2.5">
      {Object.entries(PLAN_META).map(([key, meta]) => (
        <FeatureSection
          key={key} planKey={key} meta={meta}
          features={roleFeatures[key]}
          billingMonths={billingMonths}
          basePrice={pricing?.[pricingRole]?.[key]?.price || 0}
          discount={discount}
          isExpanded={expandedFeature === key}
          onToggle={() => setExpandedFeature(v => v === key ? null : key)}
        />
      ))}
    </div>
  )

  const priceSummary = (
    <motion.div layout className="rounded-2xl overflow-hidden"
      style={{ background: '#0C1319', border: `1px solid ${selectedPlan === 'pro' ? 'rgba(16, 185, 129, 0.25)' : 'rgba(245, 158, 11, 0.25)'}` }}
    >
      {/* ── Pending Invoice Banner ── */}
      {pendingInvoice && (
        <div className="px-4 pt-4 pb-0">
          <motion.div
            initial={{ opacity: 0, y: -6 }}
            animate={{ opacity: 1, y: 0 }}
            className="flex items-start gap-3 p-3 rounded-xl mb-0"
            style={{ background: 'rgba(245,158,11,0.07)', border: '1px solid rgba(245,158,11,0.25)' }}
          >
            <AlertCircle size={15} className="text-amber-400 shrink-0 mt-0.5" />
            <div className="flex-1 min-w-0">
              <p className="text-[12px] font-bold text-amber-300 leading-tight">
                Ada invoice pending #{pendingInvoice.invoice_number}
              </p>
              <p className="text-[11px] text-amber-400/70 mt-0.5">
                {formatIDR(pendingInvoice.amount)} · {isBillingCapable ? 'Batalkan untuk buat invoice baru' : 'Hubungi admin untuk membatalkannya'}
              </p>
            </div>
            {isBillingCapable && (
              <button
                type="button"
                onClick={handleCancelPendingInvoice}
                disabled={cancelPendingInvoice.isPending}
                className="shrink-0 flex items-center gap-1 px-3 py-1.5 rounded-lg text-[11px] font-black text-red-400 border border-red-500/25 bg-red-500/10 hover:bg-red-500/20 transition-all disabled:opacity-50 focus:outline-none"
              >
                {cancelPendingInvoice.isPending
                  ? <Loader2 size={11} className="animate-spin" />
                  : 'Batalkan'}
              </button>
            )}
          </motion.div>
        </div>
      )}
      <div className="p-4 space-y-2.5">
        <div className="flex items-center justify-between text-[13px]">
          <span className="text-slate-300">{t('Plan', 'Plan')}</span>
          <span className="font-semibold" style={{ color: selectedPlan === 'pro' ? '#6EE7B7' : '#FCD34D' }}>{tPlan(selectedPlan)}</span>
        </div>
        <div className="flex items-center justify-between text-[13px]">
          <span className="text-slate-300">{t('upgrade_price_per_month', 'Harga/bulan')}</span>
          <span className="text-slate-100 font-semibold">{basePrice ? formatIDR(basePrice) : '—'}</span>
        </div>
        <div className="flex items-center justify-between text-[13px]">
          <span className="text-slate-300">{t('upgrade_normal_price', 'Harga normal')}</span>
          <span className="text-slate-100 font-semibold">{displayOriginalAmount ? formatIDR(displayOriginalAmount) : '—'}</span>
        </div>
        <div className="flex items-center justify-between text-[13px]">
          <span className="text-slate-300">{t('upgrade_duration', 'Durasi')}</span>
          <span className="text-slate-100 font-semibold">
            {billingMonths === 12
              ? t('billing_1_year', '1 Tahun')
              : t('billing_months_count', `${billingMonths} Bln`).replace('{months}', billingMonths)}
          </span>
        </div>
        {displayDurationDiscount > 0 && (
          <div className="flex items-center justify-between text-[13px]">
            <span className="text-emerald-400 font-semibold">{t('upgrade_discount_percent', 'Diskon {discount}%').replace('{discount}', discount)}</span>
            <span className="text-emerald-400 font-semibold">-{formatIDR(displayDurationDiscount)}</span>
          </div>
        )}
        {displayPromoDiscount > 0 && (
          <div className="flex items-center justify-between text-[13px]">
            <span className="text-emerald-400 font-semibold">{t('promo_discount', 'Diskon Kode')} ({appliedPromo})</span>
            <span className="text-emerald-400 font-semibold">-{formatIDR(displayPromoDiscount)}</span>
          </div>
        )}
        <div className="flex items-center justify-between text-[12px]">
          <span className="text-slate-300">{t('upgrade_active_until', 'Aktif hingga')}</span>
          <span className="font-bold" style={{ color: selectedPlan === 'pro' ? '#6EE7B7' : '#FCD34D' }}>{newExpiryStr}</span>
        </div>
      </div>

      {/* Input Kode Diskon */}
      <div className="px-4 pb-4 border-t border-white/[0.04] pt-4 bg-[#0F1720]/40">
        <div className="flex flex-col gap-1.5">
          <label className="text-[10px] font-black text-slate-300 uppercase tracking-widest">
            {t('promo_code_label', 'Kode Diskon')}
          </label>
          <div className="flex gap-2">
            <input
              type="text"
              value={promoInput}
              onChange={(e) => {
                setPromoInput(e.target.value)
                setPromoError('')
              }}
              disabled={isValidatingPromo || redirecting}
              placeholder={t('promo_code_placeholder', 'CONTOH: PROMO10')}
              className="flex-1 bg-[#0B1118] border border-white/10 rounded-xl px-3 py-2 text-xs font-display font-semibold uppercase tracking-wider text-slate-100 placeholder:text-slate-500 focus:outline-none focus:border-emerald-500/50 transition-colors"
            />
            {appliedPromo ? (
              <button
                type="button"
                onClick={handleRemovePromo}
                disabled={redirecting}
                className="px-4 py-2 bg-red-500/10 hover:bg-red-500/20 text-red-400 font-display font-bold text-xs rounded-xl border border-red-500/20 transition-all focus:outline-none"
              >
                {t('remove_promo', 'Hapus')}
              </button>
            ) : (
              <button
                type="button"
                onClick={handleApplyPromo}
                disabled={!promoInput.trim() || isValidatingPromo || redirecting}
                className={cn(
                  "px-4 py-2 font-display font-bold text-xs rounded-xl transition-all focus:outline-none",
                  !promoInput.trim() || isValidatingPromo || redirecting
                    ? "bg-white/5 text-slate-500 border border-white/10"
                    : "bg-emerald-600 hover:bg-emerald-500 text-white"
                )}
              >
                {isValidatingPromo ? <Loader2 size={12} className="animate-spin" /> : t('apply_promo', 'Terapkan')}
              </button>
            )}
          </div>
          {promoError && (
            <p className="text-[10px] text-red-400 font-semibold mt-0.5">{promoError}</p>
          )}
          {appliedPromo && !promoError && (
            <p className="text-[10px] text-emerald-400 font-semibold mt-0.5 flex items-center gap-1 leading-snug">
              <CheckCircle2 size={11} className="text-emerald-400 shrink-0" />
              <span>
                {displayFinalAmount === 5000
                  ? 'Voucher berhasil diterapkan. Kamu cukup membayar Rp5.000 untuk aktivasi paket.'
                  : t('promo_code_applied', 'Kode diskon berhasil diterapkan!')}
              </span>
            </p>
          )}
          <p className="text-[10px] text-slate-400 mt-1">
            Pembayaran minimum setelah voucher adalah Rp5.000.
          </p>
        </div>
      </div>

      <div className="px-4 py-3 flex items-center justify-between bg-white/[0.02] border-t border-white/[0.06]">
        <span className="font-display font-black text-base text-slate-100">{t('upgrade_total_pay', 'Total Bayar')}</span>
        <motion.span key={displayFinalAmount} initial={{ scale: 1.1, opacity: 0.6 }} animate={{ scale: 1, opacity: 1 }}
          className={cn("font-display font-black text-xl", selectedPlan === 'pro' ? "text-emerald-300" : "text-amber-300")}
        >
          {displayFinalAmount ? formatIDR(displayFinalAmount) : '—'}
        </motion.span>
      </div>
    </motion.div>
  )

  const ctaButton = (
    <motion.button
      whileTap={{ scale: 0.98 }}
      onClick={handleSubmit}
      disabled={createInvoice.isPending || redirecting || !basePrice || isLoadingPreview}
      className={cn(
        "w-full py-4 rounded-2xl font-display font-black text-[15px] transition-all disabled:opacity-60 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-offset-[#06090F]",
        selectedPlan === 'pro'
          ? "bg-emerald-600 hover:bg-emerald-500 text-white shadow-[0_4px_28px_rgba(16,185,129,0.2)] focus:ring-emerald-500"
          : "bg-amber-600 hover:bg-amber-500 text-white shadow-[0_4px_28px_rgba(15,23,42,0.25)] focus:ring-amber-500"
      )}
    >
      {redirecting ? (
        <span className="flex items-center justify-center gap-2">
          <Loader2 size={16} className="animate-spin" /> {t('upgrade_redirecting_payment', 'Mengarahkan ke pembayaran...')}
        </span>
      ) : createInvoice.isPending ? (
        <span className="flex items-center justify-center gap-2">
          <Loader2 size={16} className="animate-spin" /> {t('auth_processing', 'Memproses...')}
        </span>
      ) : (
        <span className="flex items-center justify-center gap-2">
          {currentPlanMeta.icon}
          {isRenewal ? t('upgrade_renew', 'Perpanjang') : t('upgrade_to', 'Upgrade ke')} {tPlan(selectedPlan)}
          <span className="opacity-60">·</span>
          {displayFinalAmount ? formatIDR(displayFinalAmount) : '—'}
        </span>
      )}
    </motion.button>
  )

  const addonLink = (
    <button onClick={() => navigate('/dashboard/addons')}
      className="w-full flex items-center justify-between p-3.5 rounded-xl bg-purple-500/5 border border-purple-500/10 hover:bg-purple-500/10 hover:border-purple-500/20 transition-all active:scale-[0.99] focus:outline-none focus:ring-1 focus:ring-purple-400"
    >
      <div className="flex items-center gap-2">
        <Building2 size={14} className="text-purple-400" />
        <span className="text-[12px] text-slate-300">{t('upgrade_need_more_biz_slots', 'Butuh slot bisnis tambahan?')}</span>
      </div>
      <span className="text-[11px] font-bold text-purple-400">{t('upgrade_start_from_idr', 'Mulai Rp 150rb →')}</span>
    </button>
  )

  const heroBadges = (
    <div className="flex items-center gap-2 mb-3 flex-wrap animate-in fade-in duration-500">
      <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-[10px] font-black uppercase tracking-widest bg-emerald-500/10 border border-emerald-400/25 text-slate-300">
        {t('upgrade_active_plan', 'Plan aktif:')}&nbsp;
        <span className="text-emerald-300 font-extrabold">{tPlan(sub.label?.toLowerCase() || 'starter')}</span>
      </div>
      {sub.status === 'trial' && (
        <div className="inline-flex items-center gap-1 px-3 py-1 rounded-full text-[10px] font-black bg-indigo-500/10 border border-indigo-500/20 text-indigo-300">
          <Clock size={9} /> {t('upgrade_trial_active', 'Trial aktif')}
        </div>
      )}
    </div>
  )

  const billingSelector = (
    <div>
      <div className="flex items-center justify-between mb-2">
        <p className="text-[11px] font-bold text-slate-400 uppercase tracking-widest">{t('upgrade_sub_duration', 'Durasi Berlangganan')}</p>
        {discount > 0 && (
          <span className="text-[11px] font-black text-emerald-400">
            {t('upgrade_save_percent', 'Hemat {discount}% ✓').replace('{discount}', discount)}
          </span>
        )}
      </div>
      <BillingSelector
        value={billingMonths}
        onChange={setBillingMonths}
        selectedPlan={selectedPlan}
        allowedMonths={previewResult?.discount_applies_to_billing_months}
      />
    </div>
  )

  // ── Main screen ─────────────────────────────────────────────────────────────

  const ambientGlow = (
    <div className="pointer-events-none fixed inset-0 transition-all duration-700"
      style={{
        background: selectedPlan === 'pro'
          ? 'radial-gradient(ellipse 60% 40% at 50% -10%, rgba(16, 185, 129,0.06) 0%, transparent 70%)'
          : 'radial-gradient(ellipse 60% 40% at 50% -10%, rgba(245,158,11,0.08) 0%, transparent 70%)',
      }}
    />
  )

  // ── Desktop: two-column layout ────────────────────────────────────────────



  // ── Mobile: single-column with sticky CTA ────────────────────────────────

  // ── Desktop: two-column layout ────────────────────────────────────────────

  if (isDesktop) {
    return (
      <div className="min-h-screen" style={{ background: '#06090F' }}>
        {ambientGlow}
        <div className="relative max-w-5xl mx-auto px-8 pt-8 pb-12">

          {/* Top bar */}
          <div className="flex items-center justify-between mb-8">
            <div className="flex items-center gap-3">
              <button onClick={() => navigate(-1)}
                className="flex items-center gap-2 text-[13px] font-semibold text-slate-300 hover:text-white bg-white/5 hover:bg-white/10 px-4 py-2 rounded-xl border border-white/10 hover:border-white/20 transition-all active:scale-[0.98] focus:outline-none focus:ring-1 focus:ring-white/20"
              >
                <ArrowLeft size={14} /> {t('common.back', 'Kembali')}
              </button>
              <button onClick={() => navigate('/dashboard')}
                className="flex items-center gap-2 text-[13px] font-semibold text-emerald-300 hover:text-emerald-200 bg-emerald-500/5 hover:bg-emerald-500/10 px-4 py-2 rounded-xl border border-emerald-400/30 transition-all active:scale-[0.98] focus:outline-none focus:ring-1 focus:ring-emerald-400"
              >
                <Building2 size={14} /> {t('Dashboard', 'Dashboard')}
              </button>
            </div>
            {heroBadges}
          </div>

          {/* Hero heading */}
          <div className="mb-8">
            <h1 className="font-display font-black text-4xl text-slate-100 leading-tight mb-2">
              {isRenewal ? t('upgrade_renew_plan_title', 'Perpanjang Plan') : t('upgrade_upgrade_plan_title', 'Upgrade Plan')}
            </h1>
            <p className="text-[14px] text-[#8EA3B7]">
              {t('upgrade_hero_desc', '{vertical} · Pilih plan & durasi, harga berubah otomatis').replace('{vertical}', roleFeatures.label)}
            </p>
          </div>

          {paymentBanner}

          {/* Two-column grid */}
          <div className="grid grid-cols-[1fr_360px] gap-8 items-start">

            {/* Left — plan selection */}
            <div className="space-y-6">
              {billingSelector}
              {planCards}
              {trialBlock}
              {featureSections}
              {addonLink}
            </div>

            {/* Right — sticky order panel */}
            <div className="sticky top-8 space-y-4">
              <div>
                <p className="text-[11px] font-bold text-slate-400 uppercase tracking-widest mb-3">{t('upgrade_order_summary', 'Ringkasan Pesanan')}</p>
                {priceSummary}
              </div>
              <div>
                {ctaButton}
                <p className="text-center text-[10px] text-slate-500 mt-2">
                  {t('upgrade_secure_payment_footer', 'Pembayaran aman via Midtrans · Aktif hingga {date}').replace('{date}', newExpiryStr)}
                </p>
              </div>
            </div>
          </div>
        </div>
        {/* Cancellation Confirmation Dialog */}
        {cancelInvoiceData && (
          <div className="fixed inset-0 z-[9999] flex items-center justify-center p-4 bg-black/75 backdrop-blur-sm animate-in fade-in duration-200">
            <div className="w-full max-w-md bg-[#0C1319] border border-white/10 rounded-2xl p-6 shadow-2xl flex flex-col gap-4 animate-in zoom-in-95 duration-200">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl bg-red-500/10 text-red-500 flex items-center justify-center shrink-0">
                  <AlertCircle size={20} />
                </div>
                <h3 className="font-display font-black text-base text-slate-100">
                  Batalkan invoice pending?
                </h3>
              </div>
              
              <div className="text-[13px] text-slate-300 leading-relaxed flex flex-col gap-3">
                <p>
                  Invoice ini akan dibatalkan di TernakOS agar kamu bisa membuat invoice baru. Jika kamu masih memiliki link pembayaran Midtrans lama, jangan lanjutkan pembayaran dari link tersebut setelah invoice dibatalkan.
                </p>
                <div className="p-3 rounded-xl bg-amber-500/10 border border-amber-500/20 text-xs text-amber-400 font-semibold">
                  Invoice dibatalkan di TernakOS. Jika sudah melakukan pembayaran, jangan batalkan dan hubungi admin.
                </div>
              </div>

              <div className="flex gap-3 mt-2">
                <button
                  type="button"
                  onClick={() => setCancelInvoiceData(null)}
                  className="flex-1 py-2.5 bg-transparent border border-white/10 text-slate-300 rounded-xl font-semibold text-xs transition-colors hover:bg-white/5"
                >
                  Kembali
                </button>
                <button
                  type="button"
                  onClick={confirmCancelPendingInvoice}
                  disabled={cancelPendingInvoice.isPending}
                  className="flex-[1.5] py-2.5 bg-red-600 hover:bg-red-500 disabled:opacity-50 text-white rounded-xl font-black text-xs transition-all flex items-center justify-center gap-1.5 shadow-lg shadow-red-600/25"
                >
                  {cancelPendingInvoice.isPending ? (
                    <Loader2 size={13} className="animate-spin" />
                  ) : (
                    'Batalkan Invoice'
                  )}
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    )
  }

  // ── Mobile: single-column with sticky CTA ────────────────────────────────

  return (
    <div className="min-h-screen" style={{ background: '#06090F' }}>
      {ambientGlow}
      <div className="relative max-w-lg mx-auto px-4 pt-6 pb-36">

        <div className="flex items-center gap-3 mb-6">
          <button onClick={() => navigate(-1)}
            className="flex items-center gap-2 text-[13px] font-semibold text-slate-300 hover:text-white bg-white/5 hover:bg-white/10 px-4 py-2 rounded-xl border border-white/10 hover:border-white/20 transition-all active:scale-[0.98] focus:outline-none focus:ring-1 focus:ring-white/20"
          >
            <ArrowLeft size={14} /> {t('common.back', 'Kembali')}
          </button>
          <button onClick={() => navigate('/dashboard')}
            className="flex items-center gap-2 text-[13px] font-semibold text-emerald-300 hover:text-emerald-200 bg-emerald-500/5 hover:bg-emerald-500/10 px-4 py-2 rounded-xl border border-emerald-400/30 transition-all active:scale-[0.98] focus:outline-none focus:ring-1 focus:ring-emerald-400"
          >
            <Building2 size={14} /> {t('Dashboard', 'Dashboard')}
          </button>
        </div>

        <div className="mb-6">
          {heroBadges}
          <h1 className="font-display font-black text-[26px] text-slate-100 leading-tight mb-1">
            {isRenewal ? t('upgrade_renew_plan_title', 'Perpanjang Plan') : t('upgrade_upgrade_plan_title', 'Upgrade Plan')}
          </h1>
          <p className="text-[13px] text-[#8EA3B7]">
            {t('upgrade_hero_desc', '{vertical} · Pilih plan & durasi, harga berubah otomatis').replace('{vertical}', roleFeatures.label)}
          </p>
        </div>

        {paymentBanner}

        <div className="space-y-5">
          {billingSelector}
          {planCards}
          {trialBlock}
          {featureSections}
          {priceSummary}
          {addonLink}
        </div>
      </div>

      {/* Sticky CTA — mobile only */}
      <div className="fixed bottom-0 left-0 right-0 p-4"
        style={{ background: 'linear-gradient(to top, #06090F 65%, transparent)', backdropFilter: 'blur(12px)' }}
      >
        <div className="max-w-lg mx-auto">
          {ctaButton}
          <p className="text-center text-[10px] text-slate-500 mt-2">
            {t('upgrade_secure_payment_footer', 'Pembayaran aman via Midtrans · Aktif hingga {date}').replace('{date}', newExpiryStr)}
          </p>
        </div>
      </div>

      {/* Cancellation Confirmation Dialog */}
      {cancelInvoiceData && (
        <div className="fixed inset-0 z-[9999] flex items-center justify-center p-4 bg-black/75 backdrop-blur-sm animate-in fade-in duration-200">
          <div className="w-full max-w-md bg-[#0C1319] border border-white/10 rounded-2xl p-6 shadow-2xl flex flex-col gap-4 animate-in zoom-in-95 duration-200">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-red-500/10 text-red-500 flex items-center justify-center shrink-0">
                <AlertCircle size={20} />
              </div>
              <h3 className="font-display font-black text-base text-slate-100">
                Batalkan invoice pending?
              </h3>
            </div>
            
            <div className="text-[13px] text-slate-300 leading-relaxed flex flex-col gap-3">
              <p>
                Invoice ini akan dibatalkan di TernakOS agar kamu bisa membuat invoice baru. Jika kamu masih memiliki link pembayaran Midtrans lama, jangan lanjutkan pembayaran dari link tersebut setelah invoice dibatalkan.
              </p>
              <div className="p-3 rounded-xl bg-amber-500/10 border border-amber-500/20 text-xs text-amber-400 font-semibold">
                Invoice dibatalkan di TernakOS. Jika sudah melakukan pembayaran, jangan batalkan dan hubungi admin.
              </div>
            </div>

            <div className="flex gap-3 mt-2">
              <button
                type="button"
                onClick={() => setCancelInvoiceData(null)}
                className="flex-1 py-2.5 bg-transparent border border-white/10 text-slate-300 rounded-xl font-semibold text-xs transition-colors hover:bg-white/5"
              >
                Kembali
              </button>
              <button
                type="button"
                onClick={confirmCancelPendingInvoice}
                disabled={cancelPendingInvoice.isPending}
                className="flex-[1.5] py-2.5 bg-red-600 hover:bg-red-500 disabled:opacity-50 text-white rounded-xl font-black text-xs transition-all flex items-center justify-center gap-1.5 shadow-lg shadow-red-600/25"
              >
                {cancelPendingInvoice.isPending ? (
                  <Loader2 size={13} className="animate-spin" />
                ) : (
                  'Batalkan Invoice'
                )}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}

