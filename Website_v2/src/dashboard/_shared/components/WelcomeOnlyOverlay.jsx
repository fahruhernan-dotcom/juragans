import React, { useState, useEffect } from 'react'
import { motion } from 'framer-motion'
import { ChevronRight, Users } from 'lucide-react'
import { useAuth } from '@/lib/hooks/useAuth'

const CARD_BG = '#0C1319'
const MUTED = '#64748B'
const TEXT = '#F1F5F9'

const ROLE_INFO = {
  manajer:      { label: 'Manajer',        desc: 'Kamu punya akses penuh operasional — kelola transaksi, pantau performa tim, dan lihat laporan bisnis.' },
  staff:        { label: 'Staff',           desc: 'Kamu bisa input data harian dan menyelesaikan tugas operasional yang diberikan manajer.' },
  sales:        { label: 'Sales',           desc: 'Kamu bertanggung jawab atas transaksi penjualan dan hubungan dengan pelanggan.' },
  sopir:        { label: 'Sopir / Driver',  desc: 'Kamu bisa melihat jadwal pengiriman dan memperbarui status perjalanan.' },
  supir:        { label: 'Supir / Driver',  desc: 'Kamu bisa melihat jadwal pengiriman dan memperbarui status perjalanan.' },
  kurir:        { label: 'Kurir',           desc: 'Kamu bisa melihat jadwal pengiriman dan memperbarui status pengantaran.' },
  anak_kandang: { label: 'Anak Kandang',    desc: 'Kamu bisa mengisi input harian kandang dan menyelesaikan tugas yang diberikan penanggung jawab.' },
  gudang:       { label: 'Staff Gudang',    desc: 'Kamu bertanggung jawab atas stok dan inventori gudang.' },
  admin:        { label: 'Admin',           desc: 'Kamu punya akses penuh operasional dan keuangan.' },
  view_only:    { label: 'Viewer',          desc: 'Kamu punya akses terbatas untuk melihat laporan dan statistik bisnis.' },
}

function useIsDesktop() {
  const [isDesktop, setIsDesktop] = useState(false)
  useEffect(() => {
    const update = () => setIsDesktop(window.innerWidth >= 768)
    update()
    window.addEventListener('resize', update)
    return () => window.removeEventListener('resize', update)
  }, [])
  return isDesktop
}

export default function WelcomeOnlyOverlay({ accent, accentDim }) {
  const { profile, tenant } = useAuth()
  const isDesktop = useIsDesktop()
  const [visible, setVisible] = useState(false)

  const storageKey = `welcome_${tenant?.id}`

  useEffect(() => {
    if (!tenant?.id) return
    if (profile?.role === 'owner') return
    try { setVisible(!localStorage.getItem(storageKey)) } catch { /* ok */ }
  }, [tenant?.id, profile?.role, storageKey])

  if (!visible) return null
  if (!profile?.role || profile.role === 'owner') return null

  const info = ROLE_INFO[profile.role] || { label: profile.role, desc: 'Selamat datang di TernakOS. Hubungi owner jika butuh bantuan.' }
  const businessName = tenant?.business_name || 'bisnis ini'

  const dismiss = () => {
    try { localStorage.setItem(storageKey, 'done') } catch { /* ok */ }
    setVisible(false)
  }

  const content = (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
      <div style={{ width: 60, height: 60, borderRadius: 18, background: accentDim, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
        <Users size={28} color={accent} />
      </div>
      <div>
        <h2 style={{ fontFamily: 'DM Sans, sans-serif', fontWeight: 800, fontSize: isDesktop ? 21 : 19, color: TEXT, margin: 0, lineHeight: 1.3 }}>
          Halo! Kamu bergabung sebagai <span style={{ color: accent }}>{info.label}</span>
        </h2>
        <p style={{ fontSize: 14, color: '#94A3B8', margin: '10px 0 0', lineHeight: 1.7 }}>
          {info.desc}
        </p>
      </div>
      <div style={{ background: 'rgba(255,255,255,0.04)', border: '1px solid rgba(255,255,255,0.08)', borderRadius: 10, padding: '10px 14px' }}>
        <span style={{ fontSize: 12, color: MUTED, fontWeight: 600 }}>Bergabung di: </span>
        <span style={{ fontSize: 12, color: TEXT, fontWeight: 700 }}>{businessName}</span>
      </div>
    </div>
  )

  if (isDesktop) {
    return (
      <div style={{ position: 'fixed', inset: 0, zIndex: 9999, display: 'flex', alignItems: 'center', justifyContent: 'center', background: 'rgba(0,0,0,0.75)', backdropFilter: 'blur(6px)' }}>
        <motion.div
          initial={{ opacity: 0, scale: 0.95 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ duration: 0.24, ease: 'easeOut' }}
          style={{ width: '100%', maxWidth: 440, background: CARD_BG, borderRadius: 24, border: '1px solid rgba(255,255,255,0.08)', overflow: 'hidden', boxShadow: '0 32px 80px rgba(0,0,0,0.6)', padding: '36px 32px' }}
        >
          {content}
          <div style={{ paddingTop: 28, display: 'flex', justifyContent: 'flex-end' }}>
            <button onClick={dismiss} style={{ display: 'flex', alignItems: 'center', gap: 8, background: accent, border: 'none', borderRadius: 12, padding: '11px 22px', color: '#fff', fontSize: 14, fontWeight: 800, cursor: 'pointer', boxShadow: `0 4px 16px ${accent}40` }}>
              Oke, mengerti <ChevronRight size={15} />
            </button>
          </div>
        </motion.div>
      </div>
    )
  }

  return (
    <div style={{ position: 'fixed', inset: 0, zIndex: 9999, display: 'flex', alignItems: 'flex-end', background: 'rgba(0,0,0,0.84)', backdropFilter: 'blur(4px)' }}>
      <motion.div
        initial={{ y: '100%' }}
        animate={{ y: 0 }}
        transition={{ duration: 0.32, ease: [0.32, 0.72, 0, 1] }}
        style={{ width: '100%', maxHeight: '80vh', background: CARD_BG, borderRadius: '24px 24px 0 0', border: '1px solid rgba(255,255,255,0.08)', borderBottom: 'none', display: 'flex', flexDirection: 'column', padding: '16px 20px 0', boxShadow: '0 -16px 48px rgba(0,0,0,0.5)' }}
      >
        <div style={{ width: 32, height: 4, borderRadius: 2, background: 'rgba(255,255,255,0.15)', margin: '0 auto 18px', flexShrink: 0 }} />
        <div style={{ flex: 1, overflowY: 'auto', paddingBottom: 8 }}>{content}</div>
        <div style={{ paddingTop: 16, paddingBottom: 'max(20px, env(safe-area-inset-bottom))', flexShrink: 0, borderTop: '1px solid rgba(255,255,255,0.06)' }}>
          <button onClick={dismiss} style={{ width: '100%', background: accent, border: 'none', borderRadius: 14, padding: '15px 0', color: '#fff', fontSize: 15, fontWeight: 800, cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8, boxShadow: `0 4px 20px ${accent}44` }}>
            Oke, mengerti <ChevronRight size={16} />
          </button>
        </div>
      </motion.div>
    </div>
  )
}
