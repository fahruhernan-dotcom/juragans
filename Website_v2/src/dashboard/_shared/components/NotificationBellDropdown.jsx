import React, { useState, useRef, useEffect } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import {
  Bell,
  CheckCheck,
  Package,
  Wallet,
  AlertTriangle,
  Truck,
  Info,
  ChevronRight,
  Sparkles,
} from 'lucide-react'
import { useNavigate } from 'react-router-dom'
import { useNotifications } from '@/lib/hooks/useNotifications'
import { formatDistanceToNow } from 'date-fns'
import { id } from 'date-fns/locale'

const TYPE_CONFIG = {
  NEW_SALE: {
    icon: Package,
    color: '#10B981',
    bg: 'rgba(16, 185, 129, 0.12)',
    border: 'rgba(16, 185, 129, 0.25)',
  },
  PAYMENT_RECEIVED: {
    icon: Wallet,
    color: '#059669',
    bg: 'rgba(5, 150, 105, 0.12)',
    border: 'rgba(5, 150, 105, 0.25)',
  },
  LOW_STOCK: {
    icon: AlertTriangle,
    color: '#F59E0B',
    bg: 'rgba(245, 158, 11, 0.12)',
    border: 'rgba(245, 158, 11, 0.25)',
  },
  SALE_STATUS_CHANGED: {
    icon: Sparkles,
    color: '#3B82F6',
    bg: 'rgba(59, 130, 246, 0.12)',
    border: 'rgba(59, 130, 246, 0.25)',
  },
  DELIVERY_REMINDER: {
    icon: Truck,
    color: '#8B5CF6',
    bg: 'rgba(139, 92, 246, 0.12)',
    border: 'rgba(139, 92, 246, 0.25)',
  },
  SYSTEM_ALERT: {
    icon: Info,
    color: '#6366F1',
    bg: 'rgba(99, 102, 241, 0.12)',
    border: 'rgba(99, 102, 241, 0.25)',
  },
}

export function NotificationBellDropdown({ isMobile = false }) {
  const [isOpen, setIsOpen] = useState(false)
  const dropdownRef = useRef(null)
  const navigate = useNavigate()
  const { notifications, unreadCount, markAsRead, markAllAsRead } = useNotifications()

  // Close dropdown saat klik di luar
  useEffect(() => {
    function handleClickOutside(event) {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target)) {
        setIsOpen(false)
      }
    }
    if (isOpen) {
      document.addEventListener('mousedown', handleClickOutside)
    }
    return () => document.removeEventListener('mousedown', handleClickOutside)
  }, [isOpen])

  const handleItemClick = (notif) => {
    if (!notif.is_read) {
      markAsRead(notif.id)
    }
    setIsOpen(false)

    const route = notif?.data?.route || notif?.data?.url || notif?.action_url
    if (route) {
      navigate(route, { state: { metadata: notif.metadata || notif.data } })
    }
  }

  return (
    <div className="relative inline-block" ref={dropdownRef}>
      {/* Bell Trigger Button */}
      <button
        type="button"
        onClick={() => setIsOpen(prev => !prev)}
        aria-label="Notifikasi"
        className="relative w-9 h-9 rounded-xl flex items-center justify-center bg-slate-100 dark:bg-white/[0.06] hover:bg-slate-200 dark:hover:bg-white/[0.1] border border-slate-200 dark:border-white/[0.08] text-slate-700 dark:text-slate-200 transition-all active:scale-95 cursor-pointer shadow-sm"
      >
        <Bell size={17} className={unreadCount > 0 ? 'text-amber-500 animate-bounce' : ''} />
        {unreadCount > 0 && (
          <span className="absolute -top-1 -right-1 min-w-[18px] h-[18px] px-1 rounded-full bg-red-500 text-white text-[10px] font-black flex items-center justify-center shadow-md shadow-red-500/40 border-2 border-white dark:border-[#0F172A] animate-pulse">
            {unreadCount > 9 ? '9+' : unreadCount}
          </span>
        )}
      </button>

      {/* Dropdown Popover */}
      <AnimatePresence>
        {isOpen && (
          <motion.div
            initial={{ opacity: 0, y: 8, scale: 0.95 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 8, scale: 0.95 }}
            transition={{ duration: 0.16, ease: 'easeOut' }}
            className={`absolute ${isMobile ? 'right-0' : 'right-0'} mt-2 w-[340px] max-w-[calc(100vw-32px)] bg-white dark:bg-[#121A23] border border-slate-200 dark:border-white/[0.1] rounded-2xl shadow-2xl z-[5100] overflow-hidden`}
            style={{ maxHeight: '480px', display: 'flex', flexDirection: 'column' }}
          >
            {/* Header Dropdown */}
            <div className="px-4 py-3 border-b border-slate-100 dark:border-white/[0.08] flex items-center justify-between bg-slate-50/60 dark:bg-white/[0.02]">
              <div className="flex items-center gap-2">
                <span className="font-display font-extrabold text-[14px] text-slate-900 dark:text-white">
                  Notifikasi
                </span>
                {unreadCount > 0 && (
                  <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-amber-500/15 text-amber-600 dark:text-amber-400 border border-amber-500/30">
                    {unreadCount} Baru
                  </span>
                )}
              </div>

              {unreadCount > 0 && (
                <button
                  type="button"
                  onClick={() => markAllAsRead()}
                  className="text-[11px] font-bold text-slate-500 dark:text-slate-400 hover:text-emerald-600 dark:hover:text-emerald-400 flex items-center gap-1 transition-colors cursor-pointer bg-transparent border-none p-0"
                >
                  <CheckCheck size={13} />
                  <span>Tandai Semua Dibaca</span>
                </button>
              )}
            </div>

            {/* List Notifikasi */}
            <div className="flex-1 overflow-y-auto divide-y divide-slate-100 dark:divide-white/[0.04]">
              {notifications.length === 0 ? (
                <div className="py-10 px-4 text-center">
                  <div className="w-12 h-12 rounded-2xl bg-slate-100 dark:bg-white/[0.04] flex items-center justify-center mx-auto mb-3 text-slate-400">
                    <Bell size={22} className="opacity-40" />
                  </div>
                  <p className="text-[13px] font-bold text-slate-700 dark:text-slate-300">Belum Ada Notifikasi</p>
                  <p className="text-[11px] text-slate-400 mt-1">Notifikasi pesanan, pembayaran, & stok akan muncul di sini.</p>
                </div>
              ) : (
                notifications.map((n) => {
                  const conf = TYPE_CONFIG[n.type] || TYPE_CONFIG.SYSTEM_ALERT
                  const Icon = conf.icon
                  const relativeTime = n.created_at
                    ? formatDistanceToNow(new Date(n.created_at), { addSuffix: true, locale: id })
                    : ''

                  return (
                    <div
                      key={n.id}
                      onClick={() => handleItemClick(n)}
                      className={`p-3.5 flex items-start gap-3 cursor-pointer transition-all hover:bg-slate-50 dark:hover:bg-white/[0.03] ${
                        !n.is_read ? 'bg-amber-500/[0.04] dark:bg-amber-500/[0.06]' : ''
                      }`}
                    >
                      {/* Icon */}
                      <div
                        className="w-9 h-9 rounded-xl flex items-center justify-center shrink-0 mt-0.5 border"
                        style={{ background: conf.bg, borderColor: conf.border, color: conf.color }}
                      >
                        <Icon size={16} strokeWidth={2.2} />
                      </div>

                      {/* Content */}
                      <div className="flex-1 min-w-0 text-left">
                        <div className="flex items-center justify-between gap-1 mb-0.5">
                          <p className={`text-[12px] truncate leading-snug ${!n.is_read ? 'font-bold text-slate-900 dark:text-white' : 'font-medium text-slate-700 dark:text-slate-300'}`}>
                            {n.title}
                          </p>
                          {!n.is_read && (
                            <span className="w-2 h-2 rounded-full bg-amber-500 shrink-0" />
                          )}
                        </div>
                        <p className="text-[11px] text-slate-500 dark:text-slate-400 line-clamp-2 leading-relaxed">
                          {n.body}
                        </p>
                        <p className="text-[9px] text-slate-400 dark:text-slate-500 mt-1 font-medium">
                          {relativeTime}
                        </p>
                      </div>

                      {/* Chevron */}
                      <ChevronRight size={14} className="text-slate-300 dark:text-slate-600 self-center shrink-0" />
                    </div>
                  )
                })
              )}
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  )
}
export default NotificationBellDropdown
