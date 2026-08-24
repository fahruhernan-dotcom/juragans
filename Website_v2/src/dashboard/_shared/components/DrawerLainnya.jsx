import React from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import {
  ChevronRight,
  X,
  User,
  Users,
  Package,
  Store,
  Warehouse,
  RotateCcw,
  BarChart2,
  Shield,
} from 'lucide-react'
import { useAuth } from '@/lib/hooks/useAuth'
import { useNavigate } from 'react-router-dom'
import { getBusinessModel } from '@/lib/businessModel'
import ThemePicker from '@/components/ui/ThemePicker'
import { isSuperadmin as checkIsSuperadmin } from '@/lib/auth'
import { useBackHandler } from '@/lib/hooks/useBackHandler'

const ICON_MAP = {
  User,
  Users,
  Package,
  Store,
  Warehouse,
  RotateCcw,
  BarChart2,
  Shield,
}

export default function DrawerLainnya({ isOpen, onClose, userType }) {
  useBackHandler(isOpen, onClose)
  const { profile, profiles, isSuperadmin, switchTenant } = useAuth()
  const navigate = useNavigate()
  const model = getBusinessModel(userType, profile?.sub_type)

  const menuItems = model?.drawerMenu || []

  return (
    <AnimatePresence>
      {isOpen && (
        <>
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={onClose}
            className="fixed inset-0 bg-black/60 backdrop-blur-sm z-[5000]"
          />

          <motion.div
            initial={{ y: '100%' }}
            animate={{ y: 0 }}
            exit={{ y: '100%' }}
            transition={{ type: 'spring', stiffness: 400, damping: 40 }}
            className="fixed bottom-0 left-1/2 -translate-x-1/2 w-full max-w-[480px] bg-card border-t border-border/40 rounded-t-[32px] z-[5001] flex flex-col"
            style={{ maxHeight: 'min(90dvh, calc(100dvh - 32px))' }}
          >
            {/* Handle */}
            <div className="shrink-0 w-10 h-1.5 bg-muted/40 rounded-full mx-auto my-4" />

            {/* Scrollable content */}
            <div className="flex-1 overflow-y-auto overscroll-contain px-6 pb-6" style={{ paddingBottom: 'max(36px, calc(20px + env(safe-area-inset-bottom, 20px)))' }}>
              <div className="flex justify-between items-center mb-6">
                <div>
                  <h2 className="font-display text-lg font-bold text-foreground">Menu Navigasi</h2>
                  <p className="text-xs text-muted-foreground">{model.name || 'Virgin Master ERP'}</p>
                </div>
                <button onClick={onClose} className="p-2 bg-muted/40 hover:bg-muted rounded-full text-muted-foreground transition-colors cursor-pointer border-none">
                  <X size={18} />
                </button>
              </div>

              {/* Theme Picker */}
              <div className="mb-6 p-4 bg-muted/30 border border-border/40 rounded-2xl">
                <ThemePicker />
              </div>

              {/* Menu List */}
              <div className="space-y-2">
                {menuItems.map((item, idx) => {
                  const Icon = ICON_MAP[item.icon] || User
                  return (
                    <motion.div
                      key={idx}
                      whileTap={{ scale: 0.98 }}
                      onClick={() => {
                        navigate(item.path)
                        onClose()
                      }}
                      className="flex items-center gap-4 p-3.5 bg-background border border-border/50 rounded-2xl cursor-pointer hover:border-border transition-all group"
                    >
                      <div className="w-10 h-10 rounded-xl bg-muted flex items-center justify-center text-foreground group-hover:bg-[#0F172A] group-hover:text-white transition-colors">
                        <Icon size={18} />
                      </div>
                      <span className="flex-1 font-body text-[14px] font-semibold text-foreground">
                        {item.label}
                      </span>
                      <ChevronRight size={16} className="text-muted-foreground group-hover:translate-x-1 transition-transform" />
                    </motion.div>
                  )
                })}

                {/* Admin Panel */}
                {isSuperadmin && (
                  <motion.div
                    whileTap={{ scale: 0.98 }}
                    onClick={() => {
                      const adminProfile = profiles?.find(p => checkIsSuperadmin(p))
                      if (adminProfile) switchTenant(adminProfile.tenant_id)
                      navigate('/admin')
                      onClose()
                    }}
                    className="flex items-center gap-4 p-3.5 bg-amber-500/10 border border-amber-500/20 rounded-2xl cursor-pointer hover:border-amber-500/40 transition-all group"
                  >
                    <div className="w-10 h-10 rounded-xl bg-amber-500/20 flex items-center justify-center text-amber-500">
                      <Shield size={18} />
                    </div>
                    <div className="flex-1">
                      <span className="font-body text-[14px] font-bold text-amber-600 dark:text-amber-400">Admin Panel</span>
                      <p className="text-[10px] text-amber-600/70 dark:text-amber-400/70 mt-0.5">Platform Superadmin</p>
                    </div>
                    <ChevronRight size={16} className="text-amber-500 group-hover:translate-x-1 transition-transform" />
                  </motion.div>
                )}
              </div>
            </div>
          </motion.div>
        </>
      )}
    </AnimatePresence>
  )
}
