import React, { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { Menu, RefreshCw } from 'lucide-react'
import { useQueryClient } from '@tanstack/react-query'
import { toast } from 'sonner'
import { useAuth, getBrokerBasePath } from '@/lib/hooks/useAuth'
import { useTheme } from '@/lib/hooks/useTheme'
import NotificationBell from '@/dashboard/_shared/components/NotificationBell'

function getGreeting() {
  const h = new Date().getHours()
  if (h < 11) return 'pagi'
  if (h < 15) return 'siang'
  if (h < 19) return 'sore'
  return 'malam'
}

export function BrokerMobileHeader({
  title,
  onMenuClick,
  onProfileClick,
  rightElement,
  profilePath,
  showGreeting,
  businessLabel,
}) {
  const { profile, tenant } = useAuth()
  const { accentColor } = useTheme()
  const navigate = useNavigate()
  const [isRefreshing, setIsRefreshing] = useState(false)
  const queryClient = useQueryClient()

  const initial = profile?.full_name ? profile.full_name.charAt(0).toUpperCase() : 'B'
  const firstName = profile?.full_name?.split(' ')[0] ?? 'Broker'
  const color = accentColor || '#3B82F6'

  const handleProfileClick = () => {
    if (onProfileClick) {
      onProfileClick()
    } else {
      const brokerBase = getBrokerBasePath(tenant)
      navigate(profilePath || `${brokerBase}/akun`)
    }
  }

  const handleMenuClick = onMenuClick || (() => {
    window.dispatchEvent(new CustomEvent('open-mobile-sidebar'))
  })

  const handleRefresh = async () => {
    setIsRefreshing(true)
    try {
      await queryClient.invalidateQueries()
      await queryClient.refetchQueries()
      toast.success('Data berhasil diperbarui!')
    } catch {
      // ignore
    } finally {
      setTimeout(() => setIsRefreshing(false), 500)
    }
  }

  const rightButtons = rightElement || (
    <>
      <button
        onClick={handleRefresh}
        title="Refresh Data"
        className="w-10 h-10 rounded-xl bg-white/5 border border-white/10 flex items-center justify-center text-[#94A3B8] hover:text-white active:scale-95 transition-transform"
      >
        <RefreshCw size={18} className={isRefreshing ? 'animate-spin text-orange-500' : ''} />
      </button>
      <NotificationBell />
      <button
        onClick={handleProfileClick}
        style={{ background: color }}
        className="w-10 h-10 rounded-full text-white border border-white/20 flex items-center justify-center cursor-pointer font-bold text-[14px] shadow-lg active:scale-95 transition-transform"
      >
        {initial}
      </button>
    </>
  )

  if (showGreeting) {
    return (
      <header className="relative overflow-hidden lg:hidden bg-background border-b border-border/40">
        <div
          className="absolute inset-0 opacity-15 dark:opacity-25 pointer-events-none"
          style={{ background: `radial-gradient(circle at 15% 15%, ${color} 0%, transparent 80%)` }}
        />

        <div className="relative px-5 pt-[calc(env(safe-area-inset-top,24px)+16px)] pb-5 flex items-center justify-between">
          <div>
            {businessLabel && (
              <p className="text-[10px] font-black uppercase tracking-[0.2em] mb-1" style={{ color: `${color}cc` }}>
                {businessLabel}
              </p>
            )}
            <h1 className="font-['Sora'] font-black text-[22px] text-foreground tracking-tight leading-tight" suppressHydrationWarning>
              Selamat {getGreeting()},{' '}
              <span style={{ color }}>{firstName}</span> 👋
            </h1>
          </div>
          <div className="flex items-center gap-2">{rightButtons}</div>
        </div>
      </header>
    )
  }

  return (
    <header className="px-5 pt-[calc(env(safe-area-inset-top,24px)+12px)] pb-4 flex items-center justify-between sticky top-0 bg-[#06090F] z-50 border-b border-white/5 min-h-[calc(64px+env(safe-area-inset-top,24px))] lg:hidden">
      <div className="flex items-center gap-4 flex-1 min-w-0">
        <button
          onClick={handleMenuClick}
          className="w-10 h-10 rounded-xl bg-white/5 border border-white/10 flex items-center justify-center text-[#94A3B8] active:scale-95 transition-transform"
        >
          <Menu size={20} />
        </button>
        <h1 className="text-[17px] font-bold text-white tracking-tight truncate">
          {title}
        </h1>
      </div>
      <div className="flex items-center gap-3">{rightButtons}</div>
    </header>
  )
}
