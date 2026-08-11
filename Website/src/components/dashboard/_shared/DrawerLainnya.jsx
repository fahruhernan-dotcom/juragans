import React from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import {
  ChevronRight,
  X,
  Truck,
  Wallet,
  BarChart2,
  BarChart3,
  Car,
  Calculator,
  User,
  Users,
  Package,
  RefreshCw,
  ClipboardList,
  ShoppingCart,
  CreditCard,
  History,
  Store,
  LayoutGrid,
  Shield,
} from 'lucide-react'
import { useAuth } from '@/lib/hooks/useAuth'
import { useNavigate } from 'react-router-dom'
import { getBusinessModel } from '@/lib/businessModel'
import ThemePicker from '@/components/ui/ThemePicker'
import { isSuperadmin as checkIsSuperadmin, isOwner, isStaff, isViewOnly } from '@/lib/auth'
import { useBackHandler } from '@/lib/hooks/useBackHandler'

const ICON_MAP = {
  Truck, Wallet, BarChart2, BarChart3, Car, Calculator, User, Users,
  Package, RefreshCw, ClipboardList, ShoppingCart, CreditCard, History, Store, LayoutGrid, Shield,
}

export default function DrawerLainnya({ isOpen, onClose, userType }) {
  useBackHandler(isOpen, onClose)
  const { profile, tenant, profiles, isSuperadmin, switchTenant } = useAuth()
  const navigate = useNavigate()
  const model = getBusinessModel(userType, profile?.sub_type)

  const filteredMenu = (model?.drawerMenu || []).filter(item => {
    // Global restriction for Harga Pasar
    if (item.label === 'Harga Pasar') {
      return (tenant?.sub_type === 'broker_ayam' || tenant?.business_vertical === 'poultry_broker')
    }

    // Peternak role filtering
    if (userType === 'peternak') {
      if (item.label === 'Tim & Akses') return isOwner(profile) || isSuperadmin
      if (item.label === 'Stok & Pakan') return !isViewOnly(profile)
      return true
    }

    if (userType !== 'broker') return true // only apply to broker
    
    if (isOwner(profile) || isSuperadmin) return true
    if (isStaff(profile)) {
      if (profile?.sub_type?.includes('sembako') || tenant?.business_vertical === 'distributor_sembako') {
        return ['Dashboard', 'Manajemen Produk', 'Riwayat Penjualan', 'Gudang & Stok', 'Manajemen Pegawai', 'Laporan Bisnis', 'Akun & Profil'].includes(item.label)
      }
      return ['Pengiriman & Loss', 'Harga Pasar', 'Akun & Profil'].includes(item.label)
    }
    if (isViewOnly(profile)) {
      if (profile?.sub_type?.includes('sembako') || tenant?.business_vertical === 'distributor_sembako') {
        return ['Dashboard', 'Laporan Bisnis', 'Akun & Profil'].includes(item.label)
      }
      return ['Harga Pasar', 'Akun & Profil'].includes(item.label)
    }
    if (profile?.role === 'sopir' || profile?.role === 'supir') {
      return item.label === 'Akun & Profil'
    }
    return true
  })

  return (
    <AnimatePresence>
      {isOpen && (
        <>
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={onClose}
            className="fixed inset-0 bg-black/60 backdrop-blur-sm z-[1000]"
          />

          <motion.div
            initial={{ y: '100%' }}
            animate={{ y: 0 }}
            exit={{ y: '100%' }}
            transition={{ type: 'spring', stiffness: 400, damping: 40 }}
            className="fixed bottom-0 left-1/2 -translate-x-1/2 w-full max-w-[480px] bg-bg-1 border-t border-border/10 rounded-t-[32px] z-[1001] flex flex-col"
            style={{ maxHeight: '90dvh' }}
          >
            {/* Handle — non-scrollable */}
            <div className="shrink-0 w-10 h-1.5 bg-muted/20 rounded-full mx-auto my-4" />

            {/* Scrollable content */}
            <div className="flex-1 overflow-y-auto overscroll-contain px-6 pb-6" style={{ paddingBottom: 'max(2rem, calc(1.5rem + env(safe-area-inset-bottom, 16px)))' }}>
              <div className="flex justify-between items-center mb-8">
                <div>
                  <h2 className="font-display text-lg font-bold">Layanan Lainnya</h2>
                  <p className="text-xs text-muted-foreground">Eksplorasi fitur {model.label}</p>
                </div>
                <button onClick={onClose} className="p-2 bg-muted/5 rounded-full text-muted-foreground">
                  <X size={20} />
                </button>
              </div>

              {/* Theme Picker */}
              <div className="mb-6 p-4 bg-background/50 border border-border/5 rounded-2xl">
                <ThemePicker />
              </div>

              {/* Menu List */}
              <div className="space-y-2">
                {filteredMenu.map((item, idx) => {
                  const Icon = ICON_MAP[item.icon] || User
                  return (
                    <motion.div
                      key={idx}
                      whileTap={{ scale: 0.98 }}
                      onClick={() => {
                        navigate(item.path)
                        onClose()
                      }}
                      className="flex items-center gap-4 p-4 bg-background/50 border border-border/5 rounded-2xl cursor-pointer hover:border-primary/20 transition-all group"
                    >
                      <div className="w-10 h-10 rounded-xl bg-muted/5 flex items-center justify-center text-muted-foreground group-hover:bg-primary/10 group-hover:text-primary transition-colors">
                        <Icon size={20} />
                      </div>
                      <span className="flex-1 font-body text-[15px] font-medium text-foreground/90">
                        {item.label}
                      </span>
                      <ChevronRight size={16} className="text-muted-foreground/40 group-hover:translate-x-1 transition-transform" />
                    </motion.div>
                  )
                })}

                {/* Admin Panel — superadmin only */}
                {isSuperadmin && (
                  <motion.div
                    whileTap={{ scale: 0.98 }}
                    onClick={() => {
                      const adminProfile = profiles?.find(p => checkIsSuperadmin(p))
                      if (adminProfile) switchTenant(adminProfile.tenant_id)
                      navigate('/admin')
                      onClose()
                    }}
                    className="flex items-center gap-4 p-4 bg-amber-500/5 border border-amber-500/10 rounded-2xl cursor-pointer hover:border-amber-500/30 transition-all group"
                  >
                    <div className="w-10 h-10 rounded-xl bg-amber-500/10 flex items-center justify-center text-amber-400">
                      <Shield size={20} />
                    </div>
                    <div className="flex-1">
                      <span className="font-body text-[15px] font-medium text-amber-300">Admin Panel</span>
                      <p className="text-[11px] text-amber-400/50 mt-0.5">Superadmin access</p>
                    </div>
                    <ChevronRight size={16} className="text-amber-400/40 group-hover:translate-x-1 transition-transform" />
                  </motion.div>
                )}
              </div>
            </div>{/* end scrollable */}
          </motion.div>
        </>
      )}
    </AnimatePresence>
  )
}
