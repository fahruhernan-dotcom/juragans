import React, { useState, useEffect } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { AlertTriangle, X, MessageSquare } from 'lucide-react'
import { useAuth } from '@/lib/hooks/useAuth'
import { calculateLicenseStatus } from '@/lib/license/licenseUtils'
import { WA_URL } from '@/lib/constants/contact'

export default function LicenseWarningBanner() {
  const { tenant, profile } = useAuth()
  const [visible, setVisible] = useState(false)
  const [licenseInfo, setLicenseInfo] = useState({
    status: 'ACTIVE',
    daysRemaining: 99999
  })

  const isDev = profile?.role === 'dev'
  const expiresAt = tenant?.plan_expires_at

  useEffect(() => {
    if (isDev || !expiresAt) {
      setVisible(false)
      return
    }

    const dismissed = sessionStorage.getItem('license_warning_dismissed') === 'true'
    const today = new Date()
    const statusInfo = calculateLicenseStatus(today, expiresAt)
    setLicenseInfo(statusInfo)

    // Tampilkan jika status WARNING atau GRACE dan belum ditutup di sesi ini
    if ((statusInfo.status === 'WARNING' || statusInfo.status === 'GRACE') && !dismissed) {
      setVisible(true)
    } else {
      setVisible(false)
    }
  }, [expiresAt, isDev])

  const handleDismiss = () => {
    sessionStorage.setItem('license_warning_dismissed', 'true')
    setVisible(false)
  }

  const handleContactDev = () => {
    const businessName = tenant?.business_name || tenant?.name || 'Toko Sembako'
    const message = encodeURIComponent(`Halo, lisensi server Sembako OS kami memerlukan bantuan aktivasi/perpanjangan untuk bisnis: ${businessName}`)
    window.open(`${WA_URL}?text=${message}`, '_blank')
  }

  if (!visible) return null

  const isGrace = licenseInfo.status === 'GRACE'
  const graceDaysLeft = 3 + licenseInfo.daysRemaining + 1

  return (
    <AnimatePresence>
      <motion.div
        initial={{ opacity: 0, y: 50, scale: 0.95 }}
        animate={{ opacity: 1, y: 0, scale: 1 }}
        exit={{ opacity: 0, y: 30, scale: 0.95 }}
        transition={{ duration: 0.4, ease: 'easeOut' }}
        className={cn(
          "fixed z-[9999] left-4 bottom-24 lg:bottom-6 right-4 sm:right-auto sm:w-[350px] bg-[#140E08] border rounded-2xl p-4 shadow-[0_20px_50px_rgba(0,0,0,0.5)] backdrop-blur-md",
          isGrace ? "border-red-500/30 shadow-red-950/20" : "border-amber-500/30"
        )}
      >
        <div className="flex items-start gap-3 relative">
          
          {/* Icon */}
          <div className={cn(
            "w-10 h-10 rounded-xl flex items-center justify-center shrink-0 border",
            isGrace 
              ? "bg-red-500/10 border-red-500/20 text-red-500" 
              : "bg-amber-500/10 border-amber-500/20 text-amber-500"
          )}>
            <AlertTriangle size={20} className="animate-pulse" />
          </div>

          {/* Text Content */}
          <div className="flex-1 space-y-2 text-left pr-6 font-sans">
            <div>
              <h4 className={cn(
                "text-xs font-black tracking-tight uppercase",
                isGrace ? "text-red-500" : "text-white"
              )}>
                {isGrace ? 'Lisensi Telah Berakhir' : 'Masa Aktif Server Hampir Habis'}
              </h4>
              <p className="text-[11px] text-[#C4B5A5] font-semibold leading-relaxed mt-1">
                {isGrace 
                  ? `Lisensi telah berakhir. Server akan dikunci dalam ${graceDaysLeft} hari.` 
                  : `Lisensi server Anda akan segera berakhir dalam ${licenseInfo.daysRemaining} hari. Harap hubungi Developer untuk memperpanjang masa aktif.`
                }
              </p>
            </div>

            {/* Action Button */}
            <button
              onClick={handleContactDev}
              className={cn(
                "h-8 bg-gradient-to-r text-white font-bold text-[10px] rounded-lg px-3 flex items-center gap-1.5 transition-all cursor-pointer active:scale-98",
                isGrace 
                  ? "from-red-600 to-rose-600 hover:from-red-500 hover:to-rose-500 shadow-md shadow-red-950/40" 
                  : "from-amber-600 to-orange-600 hover:from-amber-500 hover:to-orange-500"
              )}
            >
              <MessageSquare size={12} />
              <span>Hubungi Developer</span>
            </button>
          </div>

          {/* Close Button */}
          <button
            onClick={handleDismiss}
            className="absolute top-0 right-0 p-1 text-slate-400 hover:text-white rounded-lg hover:bg-white/5 transition-all cursor-pointer"
          >
            <X size={14} />
          </button>

        </div>
      </motion.div>
    </AnimatePresence>
  )
}

// Helper to make sure className styling works without importing extra files if not needed
import { cn } from '@/lib/utils'
