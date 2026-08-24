import React, { useState } from 'react'
import { useLocation, useNavigate } from 'react-router-dom'
import {
  Home,
  ArrowLeftRight,
  User,
  Package,
  Store,
  Warehouse,
  Receipt,
  Boxes,
  RotateCcw,
  Plus,
} from 'lucide-react'
import { motion, AnimatePresence } from 'framer-motion'
import { useAuth, getBrokerBasePath } from '@/lib/hooks/useAuth'
import { useTheme } from '@/lib/hooks/useTheme'
import { useLanguage } from '@/lib/i18n/useLanguage'
import DrawerLainnya from './DrawerLainnya'

const ICON_MAP = {
  Home,
  ArrowLeftRight,
  Warehouse,
  Package,
  Store,
  User,
}

// ── Single tab button ──────────────────────────────────────────────────────────
function NavItem({ tab, active, color, onClick }) {
  const Icon = ICON_MAP[tab.icon] || Home
  const { t } = useLanguage()
  const labelText = t(tab.label, tab.label)

  return (
    <motion.button
      onClick={onClick}
      whileTap={{ scale: 0.88 }}
      aria-label={labelText}
      title={labelText}
      style={{
        flex: 1,
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        background: 'transparent',
        border: 'none',
        cursor: 'pointer',
        padding: '8px 2px',
        minWidth: 0,
        WebkitTapHighlightColor: 'transparent',
      }}
    >
      <motion.div
        animate={active ? { backgroundColor: `${color}22` } : { backgroundColor: 'transparent' }}
        transition={{ type: 'spring', stiffness: 400, damping: 30 }}
        style={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          borderRadius: 12,
          width: 44,
          height: 44,
        }}
      >
        <Icon
          size={20}
          color={active ? color : 'var(--text-muted-val)'}
          strokeWidth={active ? 2.5 : 1.8}
          style={{ transition: 'color 0.2s ease' }}
        />
      </motion.div>
    </motion.button>
  )
}

// ── Sembako Universal Speed Dial ──────────────────────────────────────────────
function UniversalSpeedDial({ color, open, onToggle, items }) {
  return (
    <div style={{ position: 'relative', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
      <AnimatePresence>
        {open && (
          <motion.div
            initial={{ opacity: 0, scale: 0.8, y: 12 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.8, y: 12 }}
            transition={{ type: 'spring', stiffness: 400, damping: 28 }}
            style={{
              position: 'absolute',
              bottom: 60,
              left: '50%',
              transform: 'translateX(-50%)',
              zIndex: 3500,
              background: '#0F172A',
              border: '1px solid rgba(255,255,255,0.12)',
              borderRadius: 20,
              padding: '8px',
              display: 'flex',
              flexDirection: 'column',
              gap: 4,
              minWidth: 190,
              boxShadow: '0 20px 40px rgba(0,0,0,0.4)',
            }}
          >
            <div style={{ padding: '4px 8px 6px', borderBottom: '1px solid rgba(255,255,255,0.08)', marginBottom: 2 }}>
              <span style={{ fontSize: 10, fontWeight: 800, color: 'rgba(255,255,255,0.5)', letterSpacing: '0.08em', textTransform: 'uppercase' }}>
                Aksi Cepat
              </span>
            </div>
            {items.map((it, idx) => {
              const Icon = it.icon
              return (
                <motion.button
                  key={it.label}
                  initial={{ opacity: 0, x: -6 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: idx * 0.035 }}
                  onClick={it.onClick}
                  whileTap={{ scale: 0.95 }}
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    gap: 10,
                    padding: '8px 10px',
                    borderRadius: 12,
                    background: 'transparent',
                    border: 'none',
                    color: '#F8FAFC',
                    fontSize: 12,
                    fontWeight: 600,
                    cursor: 'pointer',
                    textAlign: 'left',
                    width: '100%',
                  }}
                  onMouseEnter={e => { e.currentTarget.style.background = 'rgba(255,255,255,0.08)' }}
                  onMouseLeave={e => { e.currentTarget.style.background = 'transparent' }}
                >
                  <span style={{
                    width: 28, height: 28, borderRadius: 8,
                    background: 'rgba(255,255,255,0.1)',
                    display: 'flex', alignItems: 'center', justifyContent: 'center',
                    flexShrink: 0,
                  }}>
                    <Icon size={15} color="#F8FAFC" />
                  </span>
                  <span>{it.label}</span>
                </motion.button>
              )
            })}
          </motion.div>
        )}
      </AnimatePresence>

      <motion.button
        onClick={onToggle}
        whileTap={{ scale: 0.88 }}
        style={{
          width: 44,
          height: 44,
          borderRadius: 14,
          background: color,
          border: 'none',
          cursor: 'pointer',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          boxShadow: `0 4px 14px ${color}55`,
          flexShrink: 0,
        }}
      >
        <motion.div
          animate={{ rotate: open ? 45 : 0 }}
          transition={{ type: 'spring', stiffness: 400, damping: 25 }}
        >
          <Plus size={22} color="white" strokeWidth={2.5} />
        </motion.div>
      </motion.button>
    </div>
  )
}

// ── Root component ─────────────────────────────────────────────────────────────
export default function BottomNav() {
  const { profile, tenant } = useAuth()
  const location = useLocation()
  const navigate = useNavigate()
  const [drawerOpen, setDrawerOpen] = useState(false)
  const [fabMenuOpen, setFabMenuOpen] = useState(false)
  const { accentColor } = useTheme()

  const brokerBase = getBrokerBasePath(tenant)
  const color = accentColor || '#0F172A'

  const allTabs = [
    { path: `${brokerBase}/beranda`,       icon: 'Home',           label: 'Home'    },
    { path: `${brokerBase}/penjualan`,     icon: 'ArrowLeftRight', label: 'Jual'    },
    { path: `${brokerBase}/gudang`,        icon: 'Warehouse',      label: 'Gudang'  },
    { path: `${brokerBase}/toko-supplier`, icon: 'Store',          label: 'Toko'    },
  ]

  const sembakoSpeedItems = [
    { label: 'Transaksi Baru', icon: Receipt,   onClick: () => { setFabMenuOpen(false); navigate(`${brokerBase}/penjualan?action=new`) } },
    { label: 'Tambah Toko',    icon: Store,     onClick: () => { setFabMenuOpen(false); navigate(`${brokerBase}/toko-supplier?action=new`) } },
    { label: 'Tambah Stok',    icon: Boxes,     onClick: () => { setFabMenuOpen(false); navigate(`${brokerBase}/gudang?action=add-stock`) } },
    { label: 'Tambah Produk',  icon: Package,   onClick: () => { setFabMenuOpen(false); navigate(`${brokerBase}/produk?action=new`) } },
    { label: 'Retur Barang',   icon: RotateCcw, onClick: () => { setFabMenuOpen(false); navigate(`${brokerBase}/retur?action=new`) } },
  ]

  const leftTabs = allTabs.slice(0, 2)
  const rightTabs = allTabs.slice(2)

  const handleTabClick = (tab) => {
    navigate(tab.path)
  }

  const renderTab = (tab) => {
    const active = location.pathname === tab.path || location.pathname.startsWith(tab.path + '/')
    return (
      <NavItem
        key={tab.path}
        tab={tab}
        active={active}
        color={color}
        onClick={() => handleTabClick(tab)}
      />
    )
  }

  return (
    <>
      <AnimatePresence>
        {fabMenuOpen && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.15 }}
            onClick={() => setFabMenuOpen(false)}
            style={{
              position: 'fixed', inset: 0, zIndex: 3490,
              background: 'rgba(0,0,0,0.55)',
              backdropFilter: 'blur(4px)',
              WebkitBackdropFilter: 'blur(4px)',
            }}
          />
        )}
      </AnimatePresence>

      <nav
        className="fixed bottom-[max(16px,calc(12px+env(safe-area-inset-bottom,12px)))] left-1/2 -translate-x-1/2 w-fit max-w-[calc(100vw-32px)] h-auto bg-white dark:bg-[#0A0F16] border border-slate-200 dark:border-white/15 rounded-[22px] shadow-xl flex flex-row items-center gap-0.5 z-[3500] p-1.5 overflow-visible"
      >
        {leftTabs.map(renderTab)}
        <UniversalSpeedDial
          color={color}
          open={fabMenuOpen}
          onToggle={() => setFabMenuOpen(v => !v)}
          items={sembakoSpeedItems}
        />
        {rightTabs.map(renderTab)}
      </nav>

      <DrawerLainnya
        isOpen={drawerOpen}
        onClose={() => setDrawerOpen(false)}
        userType={profile?.user_type}
      />
    </>
  )
}
