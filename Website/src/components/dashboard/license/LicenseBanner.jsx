import React, { useState, useEffect } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { AlertTriangle, X, MessageSquare, ExternalLink } from 'lucide-react'
import { useAuth } from '@/lib/hooks/useAuth'
import { calculateLicenseStatus } from '@/lib/license/licenseStatus'
import { DEVELOPER_WA, GRACE_DAYS } from '@/lib/license/licenseConstants'
import { cn } from '@/lib/utils'

export default function LicenseBanner() {
  const { tenant, profile } = useAuth()
  const [visible, setVisible] = useState(false)
  const [statusInfo, setStatusInfo] = useState(null)

  const isDev = profile?.role === 'dev'
  const expiresAt = tenant?.plan_expires_at

  useEffect(() => {
    if (isDev || !expiresAt) { setVisible(false); return }
    const dismissed = sessionStorage.getItem('license_warning_dismissed') === 'true'
    const info = calculateLicenseStatus(new Date(), expiresAt)
    setStatusInfo(info)
    if ((info.status === 'WARNING' || info.status === 'GRACE') && !dismissed) {
      setVisible(true)
    } else {
      setVisible(false)
    }
  }, [expiresAt, isDev])

  const handleDismiss = () => {
    sessionStorage.setItem('license_warning_dismissed', 'true')
    setVisible(false)
  }

  const handleContact = () => {
    const biz = tenant?.business_name || tenant?.name || 'Toko Sembako'
    const msg = encodeURIComponent(
      `Halo, lisensi server Sembako OS kami memerlukan perpanjangan untuk bisnis: ${biz}`
    )
    window.open(`https://wa.me/${DEVELOPER_WA}?text=${msg}`, '_blank')
  }

  if (!visible || !statusInfo) return null

  const isGrace = statusInfo.status === 'GRACE'
  const graceDaysLeft = GRACE_DAYS + statusInfo.daysRemaining + 1

  return (
    <AnimatePresence>
      <motion.div
        initial={{ opacity: 0, y: 50, scale: 0.95 }}
        animate={{ opacity: 1, y: 0, scale: 1 }}
        exit={{ opacity: 0, y: 30, scale: 0.95 }}
        transition={{ duration: 0.35, ease: 'easeOut' }}
        className={cn(
          'dark dark-preserve fixed z-[9999] left-4 bottom-24 lg:bottom-6 right-4 sm:right-auto sm:w-[380px]',
          'bg-[#0F172A]/95 border rounded-2xl p-4 shadow-[0_20px_50px_rgba(0,0,0,0.6)] backdrop-blur-xl select-none',
          isGrace ? 'border-red-500/40 shadow-red-950/30' : 'border-amber-500/40 shadow-amber-950/30'
        )}
      >
        <div className="flex items-start gap-3.5 relative">
          <div className={cn(
            'w-10 h-10 rounded-xl flex items-center justify-center shrink-0 border shadow-inner',
            isGrace ? 'bg-red-500/20 border-red-500/30 text-red-400' : 'bg-amber-500/20 border-amber-500/30 text-amber-400'
          )}>
            <AlertTriangle size={20} className="animate-pulse" />
          </div>

          <div className="flex-1 space-y-2 text-left pr-6">
            <div>
              <h4 className={cn(
                'text-xs font-black tracking-wide uppercase',
                isGrace ? 'text-red-400' : 'text-amber-300'
              )}>
                {isGrace ? 'Lisensi Telah Berakhir' : 'Masa Aktif Server Hampir Habis'}
              </h4>
              <p className="text-xs text-slate-200 font-medium leading-relaxed mt-1">
                {isGrace
                  ? `Lisensi telah berakhir. Server akan dikunci dalam ${graceDaysLeft} hari.`
                  : `Lisensi akan berakhir dalam ${statusInfo.daysRemaining} hari. Harap hubungi Developer.`
                }
              </p>
            </div>

            <button
              onClick={handleContact}
              className={cn(
                'h-8 text-white font-bold text-xs rounded-lg px-3 flex items-center gap-1.5 transition-all cursor-pointer shadow-md hover:scale-[1.02] active:scale-[0.98]',
                isGrace
                  ? 'bg-gradient-to-r from-red-600 to-rose-600 hover:from-red-500 hover:to-rose-500 shadow-red-900/30'
                  : 'bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-500 hover:to-teal-500 shadow-emerald-900/30'
              )}
            >
              <MessageSquare size={13} />
              <span>Hubungi Developer</span>
              <ExternalLink size={11} className="opacity-70" />
            </button>
          </div>

          <button
            onClick={handleDismiss}
            className="absolute top-0 right-0 p-1.5 text-slate-400 hover:text-white rounded-lg hover:bg-slate-800 transition-all cursor-pointer"
            title="Tutup pemberitahuan"
          >
            <X size={14} />
          </button>
        </div>
      </motion.div>
    </AnimatePresence>
  )
}

