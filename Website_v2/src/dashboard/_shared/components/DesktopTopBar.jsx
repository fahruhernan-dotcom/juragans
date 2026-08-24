import React, { useState, useEffect } from 'react'
import { SidebarTrigger } from '@/components/ui/sidebar'
import { ChevronRight, Sun, Moon } from 'lucide-react'
import NotificationBell from './NotificationBell'
import { useAuth } from '@/lib/hooks/useAuth'
import { resolveBusinessVertical, BUSINESS_MODELS } from '@/lib/businessModel'
import { usePageTitle } from '@/lib/hooks/usePageTitle'

function DesktopTopBar() {
  const pageTitle = usePageTitle()
  const { profile, tenant } = useAuth()

  const [theme, setTheme] = useState(() => {
    try {
      if (typeof window !== 'undefined') {
        return localStorage.getItem('theme_mode') || localStorage.getItem('ternakos_theme_mode') || 'light'
      }
    } catch {
      // ignore
    }
    return 'light'
  })

  useEffect(() => {
    if (theme === 'dark') {
      document.documentElement.classList.add('dark')
    } else {
      document.documentElement.classList.remove('dark')
    }
  }, [theme])

  useEffect(() => {
    const handler = () => {
      try {
        setTheme(localStorage.getItem('theme_mode') || localStorage.getItem('ternakos_theme_mode') || 'light')
      } catch {
        // ignore
      }
    }
    window.addEventListener('theme-mode-changed', handler)
    window.addEventListener('ternakos-theme-mode-changed', handler)
    return () => {
      window.removeEventListener('theme-mode-changed', handler)
      window.removeEventListener('ternakos-theme-mode-changed', handler)
    }
  }, [])

  const toggleTheme = () => {
    const nextTheme = theme === 'light' ? 'dark' : 'light'
    setTheme(nextTheme)
    try {
      localStorage.setItem('theme_mode', nextTheme)
      window.dispatchEvent(new CustomEvent('theme-mode-changed'))
    } catch {
      // ignore
    }
  }

  const vertical = resolveBusinessVertical(profile, tenant)
  const model = BUSINESS_MODELS[vertical]

  return (
    <header className="flex items-center gap-4 px-8 h-[60px] border-b border-border bg-background sticky top-0 z-50">
      <SidebarTrigger className="w-8 h-8 rounded-lg border border-border text-muted-foreground hover:bg-slate-100 dark:hover:bg-secondary/10 transition-colors" />
      
      <div className="w-px h-6 bg-border mx-1" />
      
      <nav className="flex items-center gap-2 text-[13px] font-medium font-body">
        <span className="text-muted-foreground uppercase tracking-wider text-[10px] font-bold">
          {model?.categoryLabel || 'ERP & POS'}
        </span>
        <ChevronRight size={14} className="text-muted-foreground/50" />
        <span className="text-foreground font-bold tracking-tight">{pageTitle}</span>
      </nav>
      
      <div className="flex-1" />
      
      <div className="flex items-center gap-3">
        <button
          onClick={toggleTheme}
          title={theme === 'dark' ? 'Aktifkan mode terang' : 'Aktifkan mode gelap'}
          className="w-8 h-8 rounded-lg border border-border text-muted-foreground hover:bg-slate-100 dark:hover:bg-secondary/10 flex items-center justify-center transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#0F172A]/40 cursor-pointer"
        >
          {theme === 'light' ? <Moon size={16} /> : <Sun size={16} />}
        </button>
        
        <NotificationBell />
      </div>
    </header>
  )
}

export default DesktopTopBar
