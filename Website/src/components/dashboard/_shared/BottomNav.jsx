import React, { useState } from 'react'
import { useLocation, useNavigate } from 'react-router-dom'
import {
  Home,
  ArrowLeftRight,
  Building2,
  User,
  Users,
  MoreHorizontal,
  RefreshCw,
  ClipboardList,
  ShoppingCart,
  CreditCard,
  Package,
  Truck,
  Wallet,
  Car,
  BarChart2,
  Calculator,
  Shield,
  Plus,
  LayoutGrid,
  Store,
  Syringe,
  Tag,
  Heart,
  Menu,
  Wheat,
  Receipt,
  Boxes,
  Scale,
  HeartPulse,
  FileText,
  Sparkles,
  PackagePlus,
  QrCode,
} from 'lucide-react'
import { motion, AnimatePresence } from 'framer-motion'
import { useAuth, getBrokerBasePath } from '@/lib/hooks/useAuth'
import { getBusinessModel, BUSINESS_MODELS, resolveBusinessVertical } from '@/lib/businessModel'
import { isSuperadmin, isOwner, isStaff, isViewOnly } from '@/lib/auth'
import { useTheme } from '@/lib/hooks/useTheme'
import { useLanguage } from '@/lib/i18n/useLanguage'
import DrawerLainnya from './DrawerLainnya'
import QRScannerModal from './QRScannerModal'

const ICON_MAP = {
  Home, ArrowLeftRight, Building2, User, Users, MoreHorizontal,
  RefreshCw, ClipboardList, ShoppingCart, CreditCard, Package,
  Truck, Wallet, Car, BarChart2, Calculator, Shield, LayoutGrid, Store,
  Syringe, Tag, Heart, Menu, Wheat
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
          height: 44, // Fitts's Law touch target
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

// ── Center FAB ─────────────────────────────────────────────────────────────────
function CenterFAB({ color, onClick }) {
  return (
    // Outer spacer — same flex:1 so FAB slot takes same width as a tab
    <div style={{ flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center', position: 'relative' }}>
      <motion.button
        onClick={onClick}
        whileTap={{ scale: 0.92 }}
        whileHover={{ scale: 1.05 }}
        style={{
          position: 'absolute',
          bottom: 12,
          width: 54,
          height: 54,
          borderRadius: 20,
          background: color,
          border: '1px solid rgba(255,255,255,0.15)',
          cursor: 'pointer',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          boxShadow: `0 12px 24px ${color}40, 0 4px 10px rgba(0,0,0,0.3)`,
          WebkitTapHighlightColor: 'transparent',
          zIndex: 50,
        }}
      >
        <div style={{
          position: 'absolute',
          inset: -6,
          borderRadius: 30,
          background: 'transparent',
        }} />
        <Plus size={28} color="white" strokeWidth={3} />
      </motion.button>
    </div>
  )
}

// ── Peternak Dock Tab (icon-only, matching Broker style) ─────────────────────
function PeternakNavItem({ tab, active, color, onClick }) {
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
        background: 'none', border: 'none', cursor: 'pointer',
        padding: '4px 4px',
        display: 'flex', alignItems: 'center', justifyContent: 'center',
        WebkitTapHighlightColor: 'transparent',
      }}
    >
      <motion.div
        animate={active ? { backgroundColor: `${color}22` } : { backgroundColor: 'transparent' }}
        transition={{ type: 'spring', stiffness: 400, damping: 30 }}
        style={{
          display: 'flex', alignItems: 'center', justifyContent: 'center',
          borderRadius: 12,
          width: 44, height: 44, // Fitts's Law touch target size
        }}
      >
        <Icon size={20} color={active ? color : 'var(--text-muted-val)'} strokeWidth={active ? 2.5 : 2} />
      </motion.div>
    </motion.button>
  )
}


// ── Broker Dock Tab (icon-only, no text) ─────────────────────────────────────
function BrokerNavItem({ tab, active, color, onClick }) {
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
        background: 'none', border: 'none', cursor: 'pointer',
        padding: '4px 4px',
        display: 'flex', alignItems: 'center', justifyContent: 'center',
        WebkitTapHighlightColor: 'transparent',
      }}
    >
      <motion.div
        animate={active ? { backgroundColor: `${color}22` } : { backgroundColor: 'transparent' }}
        transition={{ type: 'spring', stiffness: 400, damping: 30 }}
        style={{
          display: 'flex', alignItems: 'center', justifyContent: 'center',
          borderRadius: 12,
          width: 44, height: 44, // Fitts's Law touch target standardized to 44px
        }}
      >
        <Icon size={20} color={active ? color : 'var(--text-muted-val)'} strokeWidth={active ? 2.5 : 2} />
      </motion.div>
    </motion.button>
  )
}

// ── Sembako Speed Dial FAB ────────────────────────────────────────────────────
function SpeedDial({ color, open, onToggle, items }) {
  const { t } = useLanguage()
  return (
    <>
      {/* Speed dial container */}
      <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', padding: '4px 6px', position: 'relative', zIndex: 3500 }}>
        {/* Action items */}
        <AnimatePresence>
          {open && (
            <div style={{
              position: 'absolute',
              bottom: 'calc(100% + 10px)',
              left: '50%',
              transform: 'translateX(-50%)',
              display: 'flex',
              flexDirection: 'column',
              gap: '8px',
              alignItems: 'center',
              zIndex: 3500,
            }}>
              {items.map((item, i) => (
                <motion.button
                  key={item.label}
                  initial={{ opacity: 0, y: 12, scale: 0.85 }}
                  animate={{ opacity: 1, y: 0, scale: 1 }}
                  exit={{ opacity: 0, y: 8, scale: 0.9 }}
                  transition={{ duration: 0.18, delay: i * 0.04, ease: [0.25, 0.46, 0.45, 0.94] }}
                  onClick={item.onClick}
                  whileTap={{ scale: 0.93 }}
                  style={{
                    display: 'flex', alignItems: 'center', gap: '10px',
                    padding: '10px 14px 10px 12px',
                    borderRadius: '14px',
                    background: 'var(--bg-surface)',
                    border: '1px solid var(--border-soft)',
                    cursor: 'pointer',
                    WebkitTapHighlightColor: 'transparent',
                    whiteSpace: 'nowrap',
                    boxShadow: 'var(--shadow-tko-sm)',
                    minWidth: '160px',
                  }}
                >
                  <div style={{
                    width: 28, height: 28, borderRadius: '9px',
                    background: `${color}12`,
                    border: `1px solid ${color}25`,
                    display: 'flex', alignItems: 'center', justifyContent: 'center',
                    flexShrink: 0,
                  }}>
                    <item.icon size={14} color={color} strokeWidth={2.5} />
                  </div>
                  <span style={{ fontSize: '13px', fontWeight: 800, color: 'var(--text-primary)', letterSpacing: '-0.01em' }}>
                    {t(item.label, item.label)}
                  </span>
                </motion.button>
              ))}
            </div>
          )}
        </AnimatePresence>

        {/* FAB button */}
        <motion.button
          onClick={onToggle}
          whileTap={{ scale: 0.90 }}
          whileHover={{ scale: 1.05 }}
          animate={{ rotate: open ? 45 : 0 }}
          transition={{ duration: 0.2 }}
          style={{
            width: 44, height: 44, borderRadius: 14,
            background: color,
            border: 'none', cursor: 'pointer',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            boxShadow: open ? `0 6px 24px ${color}80` : `0 4px 16px ${color}60`,
            WebkitTapHighlightColor: 'transparent',
          }}
        >
          <Plus size={22} color="white" strokeWidth={2.5} />
        </motion.button>
      </div>
    </>
  )
}

// Keep backward-compat alias
const SembakoSpeedDial = SpeedDial

// ── Peternak Speed Dial (green-themed, variable width content-aware) ──────────
function PeternakSpeedDial({ color, open, onToggle, items }) {
  const { t } = useLanguage()
  return (
    <>
      {/* Speed dial container */}
      <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', padding: '4px 6px', position: 'relative', zIndex: 3500 }}>
        {/* Action items */}
        <AnimatePresence>
          {open && (
            <div style={{
              position: 'absolute',
              bottom: 'calc(100% + 10px)',
              left: '50%',
              transform: 'translateX(-50%)',
              display: 'flex',
              flexDirection: 'column',
              gap: '8px',
              alignItems: 'center',
              zIndex: 3500,
            }}>
              {items.map((item, i) => (
                <motion.button
                  key={item.label}
                  initial={{ opacity: 0, y: 12, scale: 0.85 }}
                  animate={{ opacity: 1, y: 0, scale: 1 }}
                  exit={{ opacity: 0, y: 8, scale: 0.9 }}
                  transition={{ duration: 0.18, delay: i * 0.04, ease: [0.25, 0.46, 0.45, 0.94] }}
                  onClick={item.onClick}
                  whileTap={{ scale: 0.93 }}
                  className="inline-flex items-center gap-3 min-h-[56px] px-5 py-2.5 rounded-2xl bg-white dark:bg-[#0A0F16]/95 border border-slate-200 dark:border-emerald-500/30 cursor-pointer shadow-md dark:shadow-xl w-auto max-w-[240px] whitespace-nowrap text-slate-800 dark:text-slate-100"
                >
                  <div style={{
                    width: 36,
                    height: 36,
                    borderRadius: '12px',
                    background: `${color}18`,
                    border: `1px solid ${color}30`,
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    flexShrink: 0,
                  }}>
                    <item.icon size={16} color={color} strokeWidth={2.5} />
                  </div>
                  <span className="text-[13px] font-extrabold text-slate-800 dark:text-[#F1F5F9] tracking-tight">
                    {t(item.label, item.label)}
                  </span>
                </motion.button>
              ))}
            </div>
          )}
        </AnimatePresence>

        {/* FAB button */}
        <motion.button
          onClick={onToggle}
          whileTap={{ scale: 0.90 }}
          whileHover={{ scale: 1.05 }}
          animate={{ rotate: open ? 45 : 0 }}
          transition={{ duration: 0.2 }}
          style={{
            width: 44, height: 44, borderRadius: 14,
            background: color,
            border: 'none', cursor: 'pointer',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            boxShadow: open ? `0 6px 24px ${color}80` : `0 4px 16px ${color}60`,
            WebkitTapHighlightColor: 'transparent',
          }}
        >
          <Plus size={22} color="white" strokeWidth={2.5} />
        </motion.button>
      </div>
    </>
  )
}

// ── Helper: is this Peternak Domba Fattening? ────────────────────────────────
function isPeternakDombaFattening(profile, tenant, vertical) {
  try {
    if (vertical === 'peternak_domba_penggemukan') return true
    const subType = profile?.sub_type || tenant?.sub_type || ''
    const businessVertical = profile?.business_vertical || tenant?.business_vertical || ''
    const keywords = ['peternak_domba_penggemukan', 'peternak_kambing_domba_penggemukan', 'domba_penggemukan']
    return keywords.some(k => subType === k || businessVertical === k)
  } catch {
    return false
  }
}

// ── Peternak Dock FAB ─────────────────────────────────────────────────────────
function PeternakCenterFAB({ color, onClick }) {
  return (
    <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', padding: '4px 6px' }}>
      <motion.button
        onClick={onClick}
        whileTap={{ scale: 0.90 }}
        whileHover={{ scale: 1.05 }}
        style={{
          width: 44, height: 44, borderRadius: 14,
          background: color,
          border: 'none', cursor: 'pointer',
          display: 'flex', alignItems: 'center', justifyContent: 'center',
          boxShadow: `0 4px 16px ${color}60`,
          WebkitTapHighlightColor: 'transparent',
        }}
      >
        <Plus size={22} color="white" strokeWidth={2.5} />
      </motion.button>
    </div>
  )
}

// ── Root component ─────────────────────────────────────────────────────────────
export default function BottomNav() {
  const { profile, profiles, tenant, switchTenant } = useAuth()
  const location = useLocation()
  const navigate = useNavigate()
  const [drawerOpen, setDrawerOpen] = useState(false)
  const [fabMenuOpen, setFabMenuOpen] = useState(false)
  const [peternakFabMenuOpen, setPeternakFabMenuOpen] = useState(false)
  const [scanQrOpen, setScanQrOpen] = useState(false)
  const { accentColor } = useTheme()

  // Centralized Business Vertical Resolution (SCALABLE ARCHITECTURE)
  const vertical = resolveBusinessVertical(profile, tenant)
  const model = BUSINESS_MODELS[vertical] || getBusinessModel(profile?.user_type, profile?.sub_type)
  
  // BRANDING: Theme implementation
  const isSembako = vertical === 'distributor_sembako' || vertical === 'sembako_broker'
  const isDombaFattening = isPeternakDombaFattening(profile, tenant, vertical)
  const color = (isSembako ? '#EA580C' : (accentColor || model?.color || '#10B981'))

  // Domba Fattening green tokens (override when speed dial is used)
  const DOMBA_GREEN = '#22C55E'
  const dombaColor = isDombaFattening ? DOMBA_GREEN : color

  // Detect peternak per-farm context (Level 2)
  // URL structure: /peternak/:peternakType/kandang/:farmId/...
  const farmMatch    = location.pathname.match(/^\/peternak\/[^/]+\/kandang\/([^/]+)/)
  const currentFarmId = farmMatch?.[1] ?? null
  const isPeternakFarm = !!currentFarmId

  const peternakBase = `/peternak/${profile?.sub_type || 'peternak_broiler'}`
  
  // Override tabs & fabPath when inside a per-farm route
  let allTabs = []
  if (isPeternakFarm) {
    allTabs = [
        { path: `${peternakBase}/kandang/${currentFarmId}/beranda`,  icon: 'Home',           label: 'Kandang'  },
        { path: `${peternakBase}/kandang/${currentFarmId}/siklus`,   icon: 'RefreshCw',      label: 'Siklus'   },
        { path: `${peternakBase}/vaksinasi`,                         icon: 'Syringe',        label: 'Vaksin'   },
        { path: `${peternakBase}/beranda`,                           icon: 'MoreHorizontal', label: 'Overview' },
    ]
  } else {
    // Dynamically adjust paths for Broker (poultry_broker, egg_broker, etc that use base broker layout)
    const isUserBroker = profile?.user_type === 'broker';
    const brokerBase = getBrokerBasePath(tenant);

    allTabs = (model.bottomNav || []).map(tab => {
        // If the path already has a vertical segment (e.g. /broker/distributor_sembako/...), use it as is
        if (tab.path.startsWith('/broker/') && tab.path.split('/').length > 3) {
          return tab;
        }

        if (isUserBroker && tab.path.startsWith('/broker/') && !tab.path.startsWith(brokerBase)) {
           return { ...tab, path: tab.path.replace('/broker/', brokerBase + '/') }
        }
        return tab;
    })
  }

  const brokerBase = getBrokerBasePath(tenant)

  let fabPath = null
  if (isPeternakFarm) {
    fabPath = `${peternakBase}/kandang/${currentFarmId}/input`
  } else if (model.fabPath) {
    fabPath = model.fabPath
    if (profile?.user_type === 'broker' && fabPath.startsWith('/broker/') && !fabPath.startsWith(brokerBase)) {
      fabPath = fabPath.replace('/broker/', brokerBase + '/')
    }
  }

  const sembakoSpeedItems = isSembako ? [
    { label: 'Transaksi Baru',     icon: Receipt, onClick: () => { setFabMenuOpen(false); navigate(`${brokerBase}/penjualan?action=new`) } },
    { label: 'Tambah Toko',        icon: Store,   onClick: () => { setFabMenuOpen(false); navigate(`${brokerBase}/toko-supplier?action=new`) } },
    { label: 'Tambah Stok',        icon: Boxes,   onClick: () => { setFabMenuOpen(false); navigate(`${brokerBase}/gudang?action=add-stock`) } },
    { label: 'Tambah Produk',      icon: Package, onClick: () => { setFabMenuOpen(false); navigate(`${brokerBase}/produk?action=new`) } },
    { label: 'Tambah Pengeluaran', icon: Wallet,  onClick: () => { setFabMenuOpen(false); navigate(`${brokerBase}/laporan`) } },
  ] : null

  // ── Domba Fattening Speed Dial items ─────────────────────────────────────────
  const DOMBA_BASE = '/peternak/peternak_domba_penggemukan'
  const dombaSpeedItems = isDombaFattening ? [
    { label: 'Scan QR',         icon: QrCode,      onClick: () => { setPeternakFabMenuOpen(false); setScanQrOpen(true) } },
    { label: 'Log Pakan',       icon: Wheat,       onClick: () => { setPeternakFabMenuOpen(false); navigate(`${DOMBA_BASE}/stok-pakan`) } },
    { label: 'Batch Baru',      icon: PackagePlus, onClick: () => { setPeternakFabMenuOpen(false); navigate(`${DOMBA_BASE}/batch`) } },
    { label: 'Catatan Harian',  icon: FileText,    onClick: () => { setPeternakFabMenuOpen(false); navigate(`${DOMBA_BASE}/daily_task`) } },
    { label: 'Bersih Kandang',  icon: Sparkles,    onClick: () => { setPeternakFabMenuOpen(false); navigate(`${DOMBA_BASE}/daily_task`) } },
    { label: 'Timbang Ternak',  icon: Scale,       onClick: () => { setPeternakFabMenuOpen(false); navigate(`${DOMBA_BASE}/ternak`) } },
    { label: 'Catat Kesehatan', icon: HeartPulse,  onClick: () => { setPeternakFabMenuOpen(false); navigate(`${DOMBA_BASE}/kesehatan`) } },
  ] : null

  // Role-based filtering — use model.category (already resolved) rather than profile.user_type
  // which may be 'superadmin' when an admin browses a peternak dashboard
  const isPeternakUser = false
  const isBrokerUser = true
  const useFloatingDock = true
  const pp = null

  // Hide FAB for peternak roles that can't input
  if (isPeternakUser && pp && !pp.showFab) {
    if (isPeternakFarm) fabPath = null
    else if (model.fabPath?.includes('/peternak/')) fabPath = null
  }

  // Domba speed dial is also permission-gated: suppress for view_only
  const showDombaSpeedDial = isDombaFattening && (!pp || pp.showFab)

  const tabs = allTabs.filter(tab => {
    if (isSuperadmin(profile)) return true

    // ── Peternak vertical ─────────────────────────────────────────────────
    if (isPeternakUser && pp) {
      // Farm-level tabs
      if (isPeternakFarm) {
        if (tab.label === 'Siklus'   && !pp.canViewSiklus)   return false
        if (tab.label === 'Overview' && !pp.canViewBeranda)  return false
        return true
      }
      // Global peternak tabs
      if (tab.label === 'Siklus'  && !pp.canViewSiklus)   return false
      if (tab.label === 'Profil'  && !pp.canViewAkun)     return false
      return true
    }

    if (profile?.user_type !== 'broker') return true

    // ── Broker vertical ───────────────────────────────────────────────────
    if (isOwner(profile) || isSuperadmin(profile)) return true
    if (isStaff(profile)) {
      if (isSembako) {
        return ['Beranda', 'Jual', 'Toko', 'Kirim'].includes(tab.label)
      }
      return ['Beranda', 'Transaksi', 'RPA', 'Akun'].includes(tab.label)
    }
    if (isViewOnly(profile)) {
      if (isSembako) {
        return ['Beranda', 'Laporan'].includes(tab.label)
      }
      return ['Beranda', 'Transaksi', 'Akun'].includes(tab.label)
    }
    if (profile?.role === 'sopir' || profile?.role === 'supir') {
      return false
    }
    return true
  })


  const finalTabs = tabs

  // Split into left half + right half for FAB layout
  // showDombaSpeedDial always reserves a center speed-dial slot, regardless of fabPath
  const hasFab = !!fabPath || showDombaSpeedDial
  const mid    = Math.ceil(finalTabs.length / 2)
  const leftTabs  = hasFab ? finalTabs.slice(0, mid)  : finalTabs
  const rightTabs = hasFab ? finalTabs.slice(mid)      : []

  const handleTabClick = (tab) => {
    if (tab.slug === 'menu' || tab.label === 'Menu') {
      window.dispatchEvent(new Event('toggleMobileSidebar'))
    } else if (tab.path === '/lainnya') {
      setDrawerOpen(true)
    } else if (tab.label === 'Admin') {
      const adminProfile = profiles?.find(p => isSuperadmin(p))
      if (adminProfile) {
        switchTenant(adminProfile.tenant_id)
        navigate('/admin')
      }
    } else {
      navigate(tab.path)
    }
  }

  const renderTab = (tab) => {
    const active   = location.pathname === tab.path || location.pathname.startsWith(tab.path + '/')
    const tabColor = tab.label === 'Admin' ? '#F59E0B' : color
    
    if (isPeternakUser) {
      return (
        <PeternakNavItem
          key={tab.path}
          tab={tab}
          active={active}
          color={tabColor}
          onClick={() => handleTabClick(tab)}
        />
      )
    }

    if (isBrokerUser) {
      return (
        <BrokerNavItem
          key={tab.path}
          tab={tab}
          active={active}
          color={tabColor}
          onClick={() => handleTabClick(tab)}
        />
      )
    }

    return (
      <NavItem
        key={tab.path}
        tab={tab}
        active={active}
        color={tabColor}
        onClick={() => handleTabClick(tab)}
      />
    )
  }

  return (
    <>
      {/* Sembako FAB backdrop */}
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

      {/* Domba Fattening FAB backdrop */}
      <AnimatePresence>
        {peternakFabMenuOpen && showDombaSpeedDial && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.15 }}
            onClick={() => setPeternakFabMenuOpen(false)}
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
        className={useFloatingDock 
          ? "fixed bottom-[max(16px,calc(12px+env(safe-area-inset-bottom,12px)))] left-1/2 -translate-x-1/2 w-fit max-w-[calc(100vw-32px)] h-auto bg-white dark:bg-[#0A0F16] border border-slate-200 dark:border-white/15 rounded-[22px] shadow-xl flex flex-row items-center gap-0.5 z-[3500] p-1.5 overflow-visible"
          : "fixed bottom-0 left-1/2 -translate-x-1/2 w-full max-w-[480px] h-auto bg-white dark:bg-[#0A0F16] border-t border-slate-200 dark:border-white/10 flex items-stretch z-[3500] pb-[max(12px,env(safe-area-inset-bottom,12px))] overflow-visible"
        }
      >
        {useFloatingDock ? (
          hasFab || showDombaSpeedDial ? (
            <>
              {leftTabs.map(renderTab)}
              {isSembako ? (
                <SembakoSpeedDial
                  color={color}
                  open={fabMenuOpen}
                  onToggle={() => setFabMenuOpen(v => !v)}
                  items={sembakoSpeedItems}
                />
              ) : showDombaSpeedDial ? (
                <PeternakSpeedDial
                  color={dombaColor}
                  open={peternakFabMenuOpen}
                  onToggle={() => setPeternakFabMenuOpen(v => !v)}
                  items={dombaSpeedItems}
                />
              ) : (
                <PeternakCenterFAB color={color} onClick={() => navigate(fabPath)} />
              )}
              {rightTabs.map(renderTab)}
            </>
          ) : (
            finalTabs.map(renderTab)
          )
        ) : (
          hasFab ? (
            <>
              {leftTabs.map(renderTab)}
              <CenterFAB color={color} onClick={() => navigate(fabPath)} />
              {rightTabs.map(renderTab)}
            </>
          ) : (
            finalTabs.map(renderTab)
          )
        )}
      </nav>

      <DrawerLainnya
        isOpen={drawerOpen}
        onClose={() => setDrawerOpen(false)}
        userType={profile?.user_type}
      />
      {scanQrOpen && (
        <QRScannerModal
          onClose={() => setScanQrOpen(false)}
          onScanSuccess={(animalId) => {
            setScanQrOpen(false)
            navigate(`/scan?animalId=${animalId}`)
          }}
        />
      )}
    </>
  )
}
