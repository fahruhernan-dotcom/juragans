import React, { useState } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { AlertTriangle, Building2, X } from 'lucide-react'
import { useNavigate } from 'react-router-dom'
import { useAuth } from '@/lib/hooks/useAuth'
import { getBrokerBasePath } from '@/lib/hooks/useAuth'
import { resolveBusinessVertical, BUSINESS_MODELS } from '@/lib/businessModel'

/**
 * BusinessNameWarningBanner
 * Ditampilkan di semua dashboard ketika tenant masih memakai nama default
 * ("Bisnis Saya" atau kosong). User harus isi nama bisnis sebelum bisa
 * melakukan transaksi.
 *
 * Letakan di atas konten utama di setiap layout.
 */
export function BusinessNameWarningBanner() {
  const { tenant, profile } = useAuth()
  const navigate = useNavigate()
  const [dismissed, setDismissed] = useState(false)

  const rawName = tenant?.business_name || ''
  const isDefaultName =
    !rawName ||
    rawName.toLowerCase().trim() === 'bisnis saya' ||
    rawName.toLowerCase().trim() === 'my business' ||
    rawName.trim().length < 3

  // Don't show if name is already set, or user dismissed, or still loading
  if (!isDefaultName || dismissed || !tenant) return null

  const vertical = resolveBusinessVertical(profile, tenant)
  const model = BUSINESS_MODELS[vertical]
  const getAkunPath = () => {
    if (model?.category === 'peternak') {
      return `/peternak/${tenant?.sub_type || 'peternak_broiler'}/akun`
    }
    if (model?.category === 'rumah_potong') {
      const rpType = tenant?.sub_type?.startsWith('rpa') ? 'rpa' : 'rph'
      return `/rumah_potong/${rpType}/akun`
    }
    return `${getBrokerBasePath(tenant)}/akun`
  }

  return (
    <AnimatePresence>
      <motion.div
        key="business-name-warning-banner"
        initial={{ opacity: 0, y: -12, height: 0 }}
        animate={{ opacity: 1, y: 0, height: 'auto' }}
        exit={{ opacity: 0, y: -12, height: 0 }}
        transition={{ duration: 0.3, ease: 'easeOut' }}
        className="overflow-hidden"
      >
        <div className="mx-4 md:mx-5 mb-3 relative flex items-start gap-3 p-4 rounded-2xl border border-amber-500/25 bg-amber-500/5 backdrop-blur-sm">
          {/* Glow */}
          <div className="absolute inset-0 rounded-2xl bg-amber-500/[0.03] pointer-events-none" />

          {/* Icon */}
          <div className="w-8 h-8 rounded-xl bg-amber-500/15 border border-amber-500/20 flex items-center justify-center shrink-0 mt-0.5">
            <AlertTriangle size={15} className="text-amber-400" />
          </div>

          {/* Text */}
          <div className="flex-1 min-w-0 relative z-10">
            <p className="text-[10px] font-black text-amber-400 uppercase tracking-[0.2em] mb-0.5">
              Nama Bisnis Belum Diisi
            </p>
            <p className="text-sm font-bold text-[#F1F5F9] leading-snug">
              Bisnis kamu masih menggunakan nama default.{' '}
              <span className="text-amber-400">Lengkapi nama bisnis</span> agar transaksi dapat tercatat dengan benar.
            </p>

            <div className="flex items-center gap-2 mt-2.5">
              <button
                onClick={() => navigate(getAkunPath())}
                className="px-3 py-1.5 rounded-xl bg-amber-500 text-[#0C1319] text-[10px] font-black uppercase tracking-widest hover:bg-amber-400 active:scale-95 transition-all shadow-md shadow-amber-500/20"
              >
                <Building2 size={10} className="inline mr-1 -mt-0.5" />
                Isi Nama Bisnis
              </button>
              <button
                onClick={() => setDismissed(true)}
                className="px-3 py-1.5 rounded-xl border border-white/10 text-[10px] font-black uppercase tracking-widest text-[#4B6478] hover:text-white hover:border-white/20 active:scale-95 transition-all"
              >
                Nanti Saja
              </button>
            </div>
          </div>

          {/* Close button */}
          <button
            onClick={() => setDismissed(true)}
            className="shrink-0 w-6 h-6 rounded-lg bg-white/5 hover:bg-white/10 flex items-center justify-center text-[#4B6478] hover:text-white transition-all relative z-10"
          >
            <X size={11} />
          </button>
        </div>
      </motion.div>
    </AnimatePresence>
  )
}
