import React, { useState, useRef, useEffect } from 'react'
import { createPortal } from 'react-dom'
import { useNavigate } from 'react-router-dom'
import { motion, AnimatePresence } from 'framer-motion'
import {
  Bell,
  X,
  Trash2,
  AlertCircle,
  Truck,
  Package,
  TrendingUp,
  Clock,
  ShoppingBag,
  Check,
  HeartPulse,
  Skull,
  FileWarning,
} from 'lucide-react'
import { useNotifications } from '@/lib/hooks/useNotifications'
import { formatRelative } from '@/lib/format'

// ─── Type → icon/color map ────────────────────────────────────────────────────

const TYPE_CONFIG = {
  piutang_jatuh_tempo: {
    Icon: AlertCircle,
    bg: 'rgba(248,113,113,0.12)',
    color: '#F87171',
  },
  pengiriman_tiba: {
    Icon: Truck,
    bg: 'rgba(16, 185, 129, 0.15)',
    color: '#10B981',
  },
  stok_pakan_menipis: {
    Icon: Package,
    bg: 'rgba(245,158,11,0.12)',
    color: '#F59E0B',
  },
  harga_pasar_update: {
    Icon: TrendingUp,
    bg: 'rgba(96,165,250,0.12)',
    color: '#60A5FA',
  },
  subscription_expires: {
    Icon: Clock,
    bg: 'rgba(245,158,11,0.12)',
    color: '#F59E0B',
  },
  order_masuk: {
    Icon: ShoppingBag,
    bg: 'rgba(167,139,250,0.12)',
    color: '#A78BFA',
  },
  laporan_kesehatan: {
    Icon: HeartPulse,
    bg: 'rgba(251,113,133,0.12)',
    color: '#FB7185',
  },
  laporan_kematian: {
    Icon: Skull,
    bg: 'rgba(148,163,184,0.12)',
    color: '#94A3B8',
  },
  laporan_insiden: {
    Icon: FileWarning,
    bg: 'rgba(251,191,36,0.12)',
    color: '#FBBF24',
  },
  tugas_terlambat: {
    Icon: Clock,
    bg: 'rgba(251,113,133,0.12)',
    color: '#FB7185',
  },
  kandang_siap_panen: {
    Icon: TrendingUp,
    bg: 'rgba(16, 185, 129, 0.15)',
    color: '#10B981',
  },
}

const DEFAULT_CONFIG = {
  Icon: Bell,
  bg: 'rgba(148,163,184,0.12)',
  color: '#94A3B8',
}

function NotifIcon({ type }) {
  const cfg = TYPE_CONFIG[type] ?? DEFAULT_CONFIG
  const { Icon } = cfg
  return (
    <div
      style={{
        width: 36,
        height: 36,
        borderRadius: 10,
        background: cfg.bg,
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        flexShrink: 0,
      }}
    >
      <Icon size={16} color={cfg.color} />
    </div>
  )
}

// ─── NotificationBell ─────────────────────────────────────────────────────────

export default function NotificationBell() {
  const navigate = useNavigate()
  const { notifications, unreadCount, markAsRead, markAllAsRead, deleteNotif } =
    useNotifications()
  const [isOpen, setIsOpen] = useState(false)
  const panelRef = useRef(null)
  const buttonRef = useRef(null)

  // Close on outside click
  useEffect(() => {
    const handler = (e) => {
      if (
        panelRef.current &&
        !panelRef.current.contains(e.target) &&
        buttonRef.current &&
        !buttonRef.current.contains(e.target)
      ) {
        setIsOpen(false)
      }
    }
    document.addEventListener('mousedown', handler)
    document.addEventListener('touchstart', handler)
    return () => {
      document.removeEventListener('mousedown', handler)
      document.removeEventListener('touchstart', handler)
    }
  }, [])

  const handleItemClick = async (notif) => {
    await markAsRead(notif.id)
    if (notif.action_url) {
      navigate(notif.action_url, { state: { metadata: notif.metadata } })
    }
    setIsOpen(false)
  }

  const displayCount = unreadCount > 9 ? '9+' : unreadCount

  // Compute panel position from button rect so portal can be positioned absolutely
  const [panelStyle, setPanelStyle] = useState({})
  useEffect(() => {
    if (isOpen && buttonRef.current) {
      const rect = buttonRef.current.getBoundingClientRect()
      const panelWidth = Math.min(380, window.innerWidth - 32)
      let right = window.innerWidth - rect.right
      if (right + panelWidth > window.innerWidth - 16) right = 16
      setPanelStyle({
        position: 'fixed',
        top: rect.bottom + 8,
        right,
        width: panelWidth,
      })
    }
  }, [isOpen])

  return (
    <div style={{ position: 'relative' }}>
      {/* ── Trigger Button ── */}
      <motion.button
        ref={buttonRef}
        whileTap={{ scale: 0.92 }}
        onClick={(e) => {
          e.preventDefault();
          e.stopPropagation();
          setIsOpen((p) => !p);
        }}
        style={{
          width: 40,
          height: 40,
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          borderRadius: 12,
          border: '1px solid rgba(255,255,255,0.1)',
          background: 'rgba(255,255,255,0.05)',
          cursor: 'pointer',
          color: '#94A3B8',
          position: 'relative',
          transition: 'background 0.15s',
        }}
        onMouseEnter={(e) => (e.currentTarget.style.background = 'rgba(255,255,255,0.04)')}
        onMouseLeave={(e) => (e.currentTarget.style.background = 'transparent')}
      >
        <Bell size={15} />
        <AnimatePresence>
          {unreadCount > 0 && (
            <motion.div
              key="badge"
              initial={{ scale: 0 }}
              animate={{ scale: 1 }}
              exit={{ scale: 0 }}
              transition={{ type: 'spring', stiffness: 600, damping: 30 }}
              style={{
                position: 'absolute',
                top: -4,
                right: -4,
                minWidth: 16,
                height: 16,
                padding: '0 3px',
                borderRadius: 99,
                background: '#EF4444',
                border: '1.5px solid #06090F',
                fontSize: 10,
                fontWeight: 700,
                color: '#fff',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                lineHeight: 1,
              }}
            >
              {displayCount}
            </motion.div>
          )}
        </AnimatePresence>
      </motion.button>

      {/* ── Dropdown Panel (portal — escapes backdrop-filter stacking context) ── */}
      {createPortal(
        <AnimatePresence>
          {isOpen && (
            <motion.div
              ref={panelRef}
              initial={{ opacity: 0, y: -8, scale: 0.96 }}
              animate={{ opacity: 1, y: 0, scale: 1 }}
              exit={{ opacity: 0, y: -8, scale: 0.96 }}
              transition={{ duration: 0.15, ease: 'easeOut' }}
              style={{
                ...panelStyle,
                background: '#161A20',
                border: '1px solid rgba(255,255,255,0.06)',
                borderRadius: 16,
                boxShadow: '0 12px 40px rgba(0,0,0,0.5)',
                zIndex: 9999,
                maxHeight: 480,
                display: 'flex',
                flexDirection: 'column',
                overflow: 'hidden',
              }}
            >
            {/* Header */}
            <div
              style={{
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'space-between',
                padding: '12px 16px',
                borderBottom: '1px solid rgba(255,255,255,0.04)',
                flexShrink: 0,
              }}
            >
              <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                <span
                  style={{
                    fontFamily: 'Sora',
                    fontSize: 14,
                    fontWeight: 700,
                    color: '#F1F5F9',
                  }}
                >
                  Notifikasi
                </span>
                {unreadCount > 0 && (
                  <span
                    style={{
                      fontSize: 11,
                      fontWeight: 700,
                      color: '#94A3B8',
                      background: 'rgba(148,163,184,0.10)',
                      borderRadius: 99,
                      padding: '1px 7px',
                    }}
                  >
                    {unreadCount} baru
                  </span>
                )}
              </div>
              <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                {unreadCount > 0 && (
                  <button
                    onClick={markAllAsRead}
                    style={{
                      fontSize: 11,
                      fontWeight: 600,
                      color: '#64748B',
                      background: 'transparent',
                      border: 'none',
                      cursor: 'pointer',
                      padding: '2px 6px',
                      borderRadius: 6,
                      display: 'flex',
                      alignItems: 'center',
                      gap: 4,
                      transition: 'color 0.15s',
                    }}
                    onMouseEnter={(e) => (e.currentTarget.style.color = '#94A3B8')}
                    onMouseLeave={(e) => (e.currentTarget.style.color = '#64748B')}
                  >
                    <Check size={11} />
                    Tandai semua
                  </button>
                )}
                <button
                  onClick={() => setIsOpen(false)}
                  style={{
                    background: 'transparent',
                    border: 'none',
                    cursor: 'pointer',
                    color: '#4B6478',
                    display: 'flex',
                    padding: 2,
                    borderRadius: 6,
                    transition: 'color 0.15s',
                  }}
                  onMouseEnter={(e) => (e.currentTarget.style.color = '#94A3B8')}
                  onMouseLeave={(e) => (e.currentTarget.style.color = '#4B6478')}
                >
                  <X size={15} />
                </button>
              </div>
            </div>

            {/* Body */}
            <div style={{ flex: 1, overflowY: 'auto' }}>
              {notifications.length === 0 ? (
                <div
                  style={{
                    display: 'flex',
                    flexDirection: 'column',
                    alignItems: 'center',
                    justifyContent: 'center',
                    padding: '48px 24px',
                    gap: 10,
                  }}
                >
                  <Bell size={28} color="#1E2D3A" />
                  <p
                    style={{
                      fontSize: 13,
                      color: '#4B6478',
                      textAlign: 'center',
                    }}
                  >
                    Belum ada notifikasi
                  </p>
                </div>
              ) : (
                notifications.map((notif) => (
                  <div
                    key={notif.id}
                    onClick={() => handleItemClick(notif)}
                    style={{
                      display: 'flex',
                      gap: 12,
                      padding: '12px 16px',
                      borderBottom: '1px solid rgba(255,255,255,0.04)',
                      cursor: 'pointer',
                      transition: 'background 0.15s',
                      background: notif.is_read
                        ? 'transparent'
                        : 'rgba(148,163,184,0.04)',
                      borderLeft: notif.is_read
                        ? '2px solid transparent'
                        : '2px solid rgba(148,163,184,0.25)',
                      alignItems: 'flex-start',
                      position: 'relative',
                    }}
                    onMouseEnter={(e) => {
                      e.currentTarget.style.background = 'rgba(255,255,255,0.03)'
                    }}
                    onMouseLeave={(e) => {
                      e.currentTarget.style.background = notif.is_read
                        ? 'transparent'
                        : 'rgba(148,163,184,0.04)'
                    }}
                  >
                    <NotifIcon type={notif.type} />

                    <div style={{ flex: 1, minWidth: 0 }}>
                      <div
                        style={{
                          display: 'flex',
                          alignItems: 'flex-start',
                          justifyContent: 'space-between',
                          gap: 8,
                          marginBottom: 2,
                        }}
                      >
                        <span
                          style={{
                            fontSize: 13,
                            fontWeight: notif.is_read ? 500 : 700,
                            color: '#F1F5F9',
                            lineHeight: 1.3,
                            flex: 1,
                            minWidth: 0,
                          }}
                        >
                          {notif.title}
                        </span>
                        <div
                          style={{
                            display: 'flex',
                            alignItems: 'center',
                            gap: 6,
                            flexShrink: 0,
                          }}
                        >
                          <span
                            style={{
                              fontSize: 10,
                              color: '#4B6478',
                              whiteSpace: 'nowrap',
                            }}
                          >
                            {formatRelative(notif.created_at)}
                          </span>
                          <button
                            onClick={(e) => {
                              e.stopPropagation()
                              deleteNotif(notif.id)
                            }}
                            style={{
                              background: 'transparent',
                              border: 'none',
                              cursor: 'pointer',
                              color: '#1E2D3A',
                              display: 'flex',
                              padding: 2,
                              borderRadius: 5,
                              transition: 'color 0.15s',
                            }}
                            onMouseEnter={(e) => {
                              e.currentTarget.style.color = '#F87171'
                            }}
                            onMouseLeave={(e) => {
                              e.currentTarget.style.color = '#1E2D3A'
                            }}
                          >
                            <Trash2 size={12} />
                          </button>
                        </div>
                      </div>
                      <p
                        style={{
                          fontSize: 12,
                          color: '#4B6478',
                          lineHeight: 1.4,
                          margin: 0,
                          overflow: 'hidden',
                          display: '-webkit-box',
                          WebkitLineClamp: 2,
                          WebkitBoxOrient: 'vertical',
                        }}
                      >
                        {notif.body}
                      </p>
                    </div>
                  </div>
                ))
              )}
            </div>

            {/* Footer */}
            <div
              style={{
                padding: '8px 16px',
                borderTop: '1px solid rgba(255,255,255,0.04)',
                textAlign: 'center',
                flexShrink: 0,
              }}
            >
              <span
                style={{
                  fontSize: 11,
                  color: '#4B6478',
                }}
              >
                {notifications.length} notifikasi tersimpan
              </span>
            </div>
          </motion.div>
        )}
      </AnimatePresence>,
      document.body
    )}
    </div>
  )
}
