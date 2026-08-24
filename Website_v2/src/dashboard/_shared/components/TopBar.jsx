import { useNavigate } from 'react-router-dom'
import { motion } from 'framer-motion'
import { Button } from '@/components/ui/button'
import { ArrowLeft, Search, User, Menu } from 'lucide-react'
import { useAuth } from '@/lib/hooks/useAuth'
import { resolveBusinessVertical, BUSINESS_MODELS } from '@/lib/businessModel'
import NotificationBell from './NotificationBell'
import { usePageTitle } from '@/lib/hooks/usePageTitle'
import { SyncStatusBadge } from '@/components/SyncStatusBadge'

export default function TopBar({ title, subtitle, showBack = false, rightAction, showBell = true, onMenuClick }) {
  const navigate = useNavigate()
  const { profile, tenant } = useAuth()
  const pageTitle = usePageTitle()
  const vertical = resolveBusinessVertical(profile, tenant)
  const model = BUSINESS_MODELS[vertical]
  const color = model?.color || '#10B981'

  const displayTitle = title || pageTitle
  const isBeranda = displayTitle === 'Beranda'
  const greeting = `Halo, ${profile?.full_name?.split(' ')[0] ?? 'Peternak'} 👋`

  return (
    <motion.header 
      initial={{ y: -20, opacity: 0 }}
      animate={{ y: 0, opacity: 1 }}
      transition={{ duration: 0.2 }}
      className="hidden md:flex px-5 lg:px-6 pt-10 lg:pt-4 pb-4 lg:pb-5 items-center justify-between sticky top-0 bg-white dark:bg-[#06090F] z-50 border-b border-slate-200 dark:border-white/5 min-h-[60px] lg:min-h-[64px]"
    >
      <div className="flex items-center gap-4 flex-1 min-w-0">
        {!showBack && onMenuClick && (
           <Button 
            variant="ghost" 
            size="icon" 
            onClick={onMenuClick}
            className="w-10 h-10 lg:hidden rounded-xl bg-slate-100 dark:bg-white/5 border border-slate-200 dark:border-white/10 active:scale-95 transition-transform text-slate-650 dark:text-slate-400"
          >
            <Menu size={20} className="text-[#94A3B8]" />
          </Button>
        )}
        {showBack && (
          <Button 
            variant="ghost" 
            size="icon" 
            onClick={() => navigate(-1)}
            style={{ borderColor: `${color}33`, color: color }}
            className="w-10 h-10 lg:w-9 lg:h-9 rounded-xl lg:rounded-lg bg-slate-100 dark:bg-white/5 border border-slate-250 dark:border-border active:scale-95 transition-transform"
          >
            <ArrowLeft size={20} className="lg:w-4 lg:h-4" />
          </Button>
        )}
        <div className="text-left flex-1 min-w-0">
          <h1 className="font-display text-lg lg:text-xl font-black text-slate-900 dark:text-white tracking-tight uppercase leading-none truncate">
            {isBeranda ? greeting : displayTitle}
          </h1>
          {subtitle && (
            <p className="text-[10px] lg:text-xs font-bold text-slate-500 dark:text-[#4B6478] uppercase mt-1 lg:mt-1.5 tracking-widest truncate">{subtitle}</p>
          )}
        </div>
      </div>
      
      <div className="flex items-center gap-3">
        <SyncStatusBadge />
        {rightAction}
        {showBell && <NotificationBell />}
        {!rightAction && !showBell && (
            <div className="flex items-center gap-2 lg:gap-3">
                <Button variant="ghost" size="icon" className="w-10 h-10 lg:w-9 lg:h-9 rounded-xl lg:rounded-lg bg-slate-100 dark:bg-white/5 border border-slate-200 dark:border-white/10 text-slate-500 dark:text-[#4B6478]">
                    <Search size={18} className="lg:w-4 lg:h-4" />
                </Button>
                <div 
                  style={{ background: `${color}11`, borderColor: `${color}22` }}
                  className="w-10 h-10 lg:w-9 lg:h-9 rounded-xl lg:rounded-lg border flex items-center justify-center"
                >
                    <User size={18} style={{ color: color }} className="lg:w-4 lg:h-4" />
                </div>
            </div>
        )}
      </div>
    </motion.header>
  )
}


