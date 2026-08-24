import React, { useState, useEffect, useRef } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { NavLink, useLocation, useNavigate } from 'react-router-dom'
import {
  Home,
  ArrowLeftRight,
  Warehouse,
  BarChart2,
  ChevronsUpDown,
  User,
  Users,
  LogOut,
  Bell,
  Check,
  Plus,
  RotateCcw,
  Shield,
  Package,
  Store,
  MessageSquareText,
  Wrench,
  Building2,
} from 'lucide-react'
import {
  Sidebar,
  SidebarContent,
  SidebarFooter,
  SidebarGroup,
  SidebarGroupContent,
  SidebarGroupLabel,
  SidebarHeader,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
  SidebarSeparator,
} from '@/components/ui/sidebar'
import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetHeader,
  SheetTitle,
} from "@/components/ui/sheet"
import { BUSINESS_MODELS, getXBasePath } from '@/lib/businessModel'
import { useAuth, getBrokerBasePath } from '@/lib/hooks/useAuth'
import { WA_URL } from '@/lib/constants/contact'
import { getSubscriptionStatus } from '@/lib/subscriptionUtils'
import { isSuperadmin as checkIsSuperadmin, isOwner, isStaff } from '@/lib/auth'
import { isDevUser, isOwnerUser, isAdminUser } from '@/lib/auth/business-roles'
import { checkQuotaUsage } from '@/lib/quotaUtils'
import { useSembakoReturns } from '@/lib/hooks/useSembakoData'
import { toast } from 'sonner'
import { useQueryClient } from '@tanstack/react-query'
import { logError } from '@/lib/logger/errorLogger'
import { ScrollArea } from "@/components/ui/scroll-area"
import { usePlanConfigs } from '@/lib/hooks/useAdminData'
import { useTheme } from '@/lib/hooks/useTheme'
import { useMediaQuery } from '@/lib/hooks/useMediaQuery'
import { useBackHandler } from '@/lib/hooks/useBackHandler'

export default function AppSidebar({ open, onClose }) {
  useBackHandler(open, onClose)
  const { user, profile, profiles, tenant, ownerTenant, isSuperadmin, switchTenant, logout } = useAuth()
  const location = useLocation()
  const navigate = useNavigate()
  const queryClient = useQueryClient()
  const isDesktop = useMediaQuery('(min-width: 1024px)')

  // Quota calculation for business limit
  const { data: planConfigs = [] } = usePlanConfigs()
  const [quota, setQuota] = useState({ canAdd: false, current: 0, max: 0, plan: 'starter' })

  // Custom User Dropdown State
  const [dropdownOpen, setDropdownOpen] = useState(false)
  const userDropdownRef = useRef(null)

  // Custom Tenant Dropdown State
  const [tenantDropdownOpen, setTenantDropdownOpen] = useState(false)
  const tenantDropdownRef = useRef(null)

  useEffect(() => {
    async function calculateQuota() {
      const q = await checkQuotaUsage(ownerTenant || tenant, profiles || (profile ? [profile] : []), planConfigs)
      setQuota(q)
    }
    calculateQuota()
  }, [ownerTenant, profile, profiles, tenant, planConfigs])

  const userInitials = profile?.full_name?.split(' ').map(n => n[0]).join('').toUpperCase().slice(0, 2) || 'U'
  const { accentColor } = useTheme()

  // Sembako returs badge
  const { data: sembakoReturnsList = [] } = useSembakoReturns()
  const pendingRetursCount = sembakoReturnsList.filter(r => r.status === 'pending').length

  const brokerBase = getBrokerBasePath(tenant)
  const color = accentColor || '#0F172A'

  const berandaPath = `${brokerBase}/beranda`
  const akunPath = `${brokerBase}/akun`

  const handleGoToAdmin = () => {
    if (isSuperadmin) {
      navigate('/admin')
      return
    }
    const adminProfile = profiles?.find(p => checkIsSuperadmin(p))
    if (adminProfile) {
      switchTenant(adminProfile.tenant_id)
      navigate('/admin')
    }
  }

  // ─── Universal Navigation Configuration ──────────────────────────────
  const navMain = [
    {
      label: 'MENU UTAMA',
      items: [
        { title: 'Beranda', url: berandaPath, icon: Home },
        { title: 'Penjualan (POS)', url: `${brokerBase}/penjualan`, icon: ArrowLeftRight, dataTutorial: 'sembako-penjualan' },
        { title: 'Toko & Supplier', url: `${brokerBase}/toko-supplier`, icon: Store, dataTutorial: 'sembako-toko' },
        { title: 'Gudang & Stok', url: `${brokerBase}/gudang`, icon: Warehouse, dataTutorial: 'sembako-gudang' },
        { title: 'Retur Produk', url: `${brokerBase}/retur`, icon: RotateCcw, badge: pendingRetursCount > 0 ? String(pendingRetursCount) : null },
        { title: 'Produk & Harga', url: `${brokerBase}/produk`, icon: Package, roles: ['owner', 'staff', 'dev', 'admin', 'manajer', 'sales', 'kasir', 'gudang'] },
      ]
    },
    {
      label: 'LAPORAN & MANAJEMEN',
      items: [
        { title: 'B2B Leads (Export)', url: `${brokerBase}/b2b-outreach`, icon: MessageSquareText, roles: ['owner', 'dev', 'admin', 'manajer', 'sales'] },
        { title: 'Laporan Bisnis', url: `${brokerBase}/laporan`, icon: BarChart2, roles: ['owner', 'dev', 'admin', 'manajer'], dataTutorial: 'sembako-laporan' },
        { title: 'Tim & Karyawan', url: `${brokerBase}/tim`, icon: Users, roles: ['owner', 'dev', 'admin', 'manajer'] },
        { title: 'Kelola Akun & Dev', url: `${brokerBase}/kelola-akun`, icon: Wrench, roles: ['dev'], isDevItem: true },
      ]
    }
  ]

  const filteredNavMain = navMain.map(group => ({
    ...group,
    items: group.items.filter(item => {
      if (!item.roles) return true
      return item.roles.includes(profile?.role) || isSuperadmin || isDevUser(profile) || isOwnerUser(profile)
    })
  })).filter(group => group.items.length > 0)

  useEffect(() => {
    if (!dropdownOpen) return
    function handleClickOutside(e) {
      if (userDropdownRef.current && !userDropdownRef.current.contains(e.target)) {
        setDropdownOpen(false)
      }
    }
    document.addEventListener('mousedown', handleClickOutside)
    return () => document.removeEventListener('mousedown', handleClickOutside)
  }, [dropdownOpen])

  useEffect(() => {
    if (!tenantDropdownOpen) return
    function handleClickOutside(e) {
      if (tenantDropdownRef.current && !tenantDropdownRef.current.contains(e.target)) {
        setTenantDropdownOpen(false)
      }
    }
    document.addEventListener('mousedown', handleClickOutside)
    return () => document.removeEventListener('mousedown', handleClickOutside)
  }, [tenantDropdownOpen])

  const handleLogout = async () => {
    try {
      await logout()
      toast.success('Berhasil keluar')
      queryClient.clear()
      navigate('/login')
    } catch (err) {
      logError(err)
      toast.error('Gagal keluar, silakan coba lagi')
    }
  }

  const sub = getSubscriptionStatus(tenant)

  const sidebarContent = (
    <>
      <SidebarHeader className="p-3 border-b border-border/40 flex-shrink-0">
        <div className="relative" ref={tenantDropdownRef}>
          <button
            onClick={() => setTenantDropdownOpen(prev => !prev)}
            className="w-full flex items-center justify-between gap-2.5 p-2 rounded-xl bg-slate-100/80 dark:bg-white/[0.04] border border-border/60 hover:bg-slate-200/80 dark:hover:bg-white/[0.08] transition-all select-none cursor-pointer"
          >
            <div className="flex items-center gap-2.5 min-w-0">
              <div className="w-8 h-8 rounded-lg bg-[#0F172A] flex items-center justify-center flex-shrink-0 text-white font-bold text-xs shadow-sm">
                <Store size={16} />
              </div>
              <div className="text-left min-w-0 flex-1">
                <p className="font-['Sora'] text-[13px] font-bold text-foreground truncate leading-tight">
                  {tenant?.business_name || tenant?.name || 'Virgin Master ERP'}
                </p>
                <p className="text-[10px] text-muted-foreground font-medium truncate mt-0.5">
                  {tenant?.city || 'Distributor & Retail'}
                </p>
              </div>
            </div>
            <ChevronsUpDown size={14} className="text-muted-foreground shrink-0" />
          </button>

          {/* Tenant Dropdown */}
          <AnimatePresence>
            {tenantDropdownOpen && (
              <motion.div
                initial={{ opacity: 0, y: -8, scale: 0.96 }}
                animate={{ opacity: 1, y: 0, scale: 1 }}
                exit={{ opacity: 0, y: -8, scale: 0.96 }}
                transition={{ duration: 0.15, ease: 'easeOut' }}
                className="absolute top-full left-0 right-0 mt-1.5 bg-card border border-border rounded-xl shadow-xl z-50 overflow-hidden select-none"
              >
                <div className="p-2 border-b border-border/40">
                  <p className="text-[10px] font-bold text-muted-foreground uppercase tracking-wider px-2 py-1">
                    Bisnis Terdaftar
                  </p>
                  <ScrollArea className="max-h-48">
                    {(profiles || []).map((p) => {
                      const t = p.tenants || p.tenant
                      const isCurrent = t?.id === tenant?.id
                      return (
                        <button
                          key={p.id}
                          onClick={() => {
                            if (!isCurrent) switchTenant(t?.id)
                            setTenantDropdownOpen(false)
                          }}
                          className={`w-full flex items-center justify-between p-2 rounded-lg text-xs font-semibold transition-colors text-left ${
                            isCurrent
                              ? 'bg-[#0F172A] text-white'
                              : 'hover:bg-muted text-foreground'
                          }`}
                        >
                          <div className="min-w-0 flex-1 pr-2">
                            <p className="truncate font-bold">{t?.business_name || t?.name || 'Toko'}</p>
                            <p className={`text-[10px] truncate ${isCurrent ? 'text-slate-300' : 'text-muted-foreground'}`}>
                              {p.role || 'Staff'} · {t?.city || 'Retail'}
                            </p>
                          </div>
                          {isCurrent && <Check size={14} className="shrink-0" />}
                        </button>
                      )
                    })}
                  </ScrollArea>
                </div>

                <div className="p-1">
                  <button
                    onClick={() => {
                      navigate('/onboarding?mode=new_business')
                      setTenantDropdownOpen(false)
                    }}
                    className="w-full flex items-center gap-2 px-3 py-2 rounded-lg text-xs font-bold text-[#0F172A] dark:text-slate-200 hover:bg-muted transition-colors cursor-pointer"
                  >
                    <Plus size={14} />
                    <span>Daftarkan Usaha Baru</span>
                  </button>
                </div>
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      </SidebarHeader>

      <SidebarContent className="p-2 select-none overflow-y-auto">
        {filteredNavMain.map((group) => (
          <SidebarGroup key={group.label} className="mb-2">
            <SidebarGroupLabel className="text-[10px] font-bold tracking-[0.15em] text-muted-foreground px-2 mb-1 cursor-default uppercase">
              {group.label}
            </SidebarGroupLabel>
            <SidebarGroupContent>
              <SidebarMenu>
                {group.items.map((item) => {
                  const isActive = location.pathname === item.url || location.pathname.startsWith(item.url + '?')
                  const Icon = item.icon
                  return (
                    <SidebarMenuItem key={item.title}>
                      <SidebarMenuButton
                        asChild
                        isActive={isActive}
                        className={`rounded-xl mb-0.5 transition-all select-none cursor-pointer ${
                          isActive
                            ? 'bg-[#0F172A] text-white font-bold shadow-sm'
                            : 'hover:bg-muted text-muted-foreground hover:text-foreground font-medium'
                        }`}
                      >
                        <NavLink
                          to={item.url}
                          onClick={() => onClose?.()}
                          data-tutorial={item.dataTutorial}
                          className="flex items-center gap-3 w-full py-2 px-2.5"
                        >
                          <Icon
                            size={18}
                            className={`shrink-0 ${isActive ? 'text-white' : 'text-muted-foreground'}`}
                            strokeWidth={isActive ? 2.5 : 2}
                          />
                          <span className="font-body text-[13px] flex-1 truncate">
                            {item.title}
                          </span>
                          {item.badge && (
                            <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-amber-500 text-white shrink-0">
                              {item.badge}
                            </span>
                          )}
                        </NavLink>
                      </SidebarMenuButton>
                    </SidebarMenuItem>
                  )
                })}
              </SidebarMenu>
            </SidebarGroupContent>
          </SidebarGroup>
        ))}

        {/* ── LAINNYA ── */}
        <SidebarGroup className="mt-2">
          <SidebarGroupLabel className="text-[10px] font-bold tracking-[0.15em] text-muted-foreground px-2 mb-1 cursor-default uppercase">
            LAINNYA
          </SidebarGroupLabel>
          <SidebarGroupContent>
            <SidebarMenu>
              <SidebarMenuItem>
                <SidebarMenuButton
                  asChild
                  isActive={location.pathname === akunPath}
                  className={`rounded-xl mb-0.5 transition-all select-none cursor-pointer ${
                    location.pathname === akunPath
                      ? 'bg-[#0F172A] text-white font-bold shadow-sm'
                      : 'hover:bg-muted text-muted-foreground hover:text-foreground font-medium'
                  }`}
                >
                  <NavLink to={akunPath} onClick={() => onClose?.()} className="flex items-center gap-3 w-full py-2 px-2.5">
                    <User size={18} className="shrink-0" />
                    <span className="font-body text-[13px] flex-1 truncate">Akun & Profil</span>
                  </NavLink>
                </SidebarMenuButton>
              </SidebarMenuItem>

              {isSuperadmin && (
                <SidebarMenuItem>
                  <SidebarMenuButton
                    asChild
                    isActive={location.pathname.startsWith('/admin')}
                    className="rounded-xl mb-0.5 bg-amber-500/10 text-amber-600 dark:text-amber-400 hover:bg-amber-500/20 transition-colors font-bold"
                  >
                    <NavLink to="/admin" onClick={() => onClose?.()} className="flex items-center gap-3 w-full py-2 px-2.5">
                      <Shield size={18} className="shrink-0 text-amber-500" />
                      <span className="font-body text-[13px] flex-1 truncate">Admin Panel</span>
                    </NavLink>
                  </SidebarMenuButton>
                </SidebarMenuItem>
              )}
            </SidebarMenu>
          </SidebarGroupContent>
        </SidebarGroup>
      </SidebarContent>

      <SidebarFooter className="p-2 pb-[max(20px,calc(12px+env(safe-area-inset-bottom,12px)))] flex-shrink-0 mt-auto border-t border-border/40">
        {/* Status Server */}
        <div className="mx-1 px-3 py-2.5 rounded-xl border border-border/60 bg-card mb-2">
          <div className="flex items-center justify-between gap-2">
            <div>
              <p className="text-[9px] font-bold text-muted-foreground uppercase tracking-wider m-0">
                {isSuperadmin ? 'Status Platform' : 'Status Server'}
              </p>
              <p className="font-['Sora'] text-[12px] font-extrabold mt-0.5 text-foreground">
                {isSuperadmin ? 'SUPERADMIN' : sub.isGrace ? 'MASA TENGGANG' : 'AKTIF'}
              </p>
            </div>
            <span className={`text-[10px] font-extrabold rounded-md px-2 py-0.5 border uppercase tracking-wider ${
              isSuperadmin || isDevUser(profile)
                ? 'bg-emerald-500/15 text-emerald-600 dark:text-emerald-400 border-emerald-500/30'
                : sub.isGrace || sub.isWarning
                ? 'bg-amber-500/15 text-amber-600 border-amber-500/30'
                : 'bg-slate-100 dark:bg-white/10 text-foreground border-border'
            }`}>
              {isSuperadmin || isDevUser(profile) ? 'DEV' : sub.daysLeft ? `${sub.daysLeft} Hari` : 'Aktif'}
            </span>
          </div>

          {!isSuperadmin && !isDevUser(profile) && (
            <div className="mt-2">
              <a
                href={`${WA_URL}?text=${encodeURIComponent('Halo Developer, saya ingin memperpanjang masa aktif server ERP saya.')}`}
                target="_blank"
                rel="noopener noreferrer"
                className="w-full py-1.5 px-2.5 bg-[#0F172A] hover:bg-slate-900 text-white rounded-lg text-[11px] font-bold cursor-pointer flex items-center justify-center gap-1.5 no-underline transition-all"
              >
                <MessageSquareText size={13} />
                <span>Perpanjang Server</span>
              </a>
            </div>
          )}
        </div>

        {/* User Account Trigger */}
        <div className="relative" ref={userDropdownRef}>
          <AnimatePresence>
            {dropdownOpen && (
              <motion.div
                initial={{ opacity: 0, y: -8, scale: 0.96 }}
                animate={{ opacity: 1, y: 0, scale: 1 }}
                exit={{ opacity: 0, y: -8, scale: 0.96 }}
                transition={{ duration: 0.15, ease: 'easeOut' }}
                className="absolute bottom-full left-0 right-0 mb-2 bg-card border border-border rounded-xl shadow-xl z-50 overflow-hidden select-none"
              >
                <div className="flex items-center gap-2.5 px-3 py-3 border-b border-border/40">
                  <div className="w-8 h-8 rounded-full bg-[#0F172A] text-white flex items-center justify-center font-bold text-xs uppercase shrink-0">
                    {userInitials}
                  </div>
                  <div className="flex-1 min-w-0 text-left">
                    <p className="text-xs font-bold text-foreground truncate leading-tight">
                      {profile?.full_name || 'User'}
                    </p>
                    <p className="text-[10px] text-muted-foreground truncate">{user?.email}</p>
                  </div>
                </div>

                <div className="p-1">
                  <button
                    onClick={() => { navigate(akunPath); setDropdownOpen(false) }}
                    className="w-full flex items-center gap-2.5 px-3 py-2 text-xs font-semibold text-foreground hover:bg-muted rounded-lg transition-colors text-left"
                  >
                    <User size={14} />
                    <span>Profil Akun</span>
                  </button>
                  <button
                    onClick={() => { navigate('/onboarding?mode=new_business'); setDropdownOpen(false) }}
                    className="w-full flex items-center gap-2.5 px-3 py-2 text-xs font-semibold text-foreground hover:bg-muted rounded-lg transition-colors text-left"
                  >
                    <Building2 size={14} />
                    <span>Kelola Bisnis</span>
                  </button>
                  <button
                    onClick={() => { handleLogout(); setDropdownOpen(false) }}
                    className="w-full flex items-center gap-2.5 px-3 py-2 text-xs font-bold text-red-600 hover:bg-red-50 dark:hover:bg-red-950/30 rounded-lg transition-colors text-left"
                  >
                    <LogOut size={14} />
                    <span>Keluar</span>
                  </button>
                </div>
              </motion.div>
            )}
          </AnimatePresence>

          <button
            onClick={() => setDropdownOpen(prev => !prev)}
            className="w-full flex items-center gap-2.5 p-2 rounded-xl hover:bg-muted transition-colors select-none cursor-pointer border-none bg-transparent"
          >
            <div className="w-8 h-8 rounded-full bg-[#0F172A] text-white flex items-center justify-center font-bold text-xs uppercase shrink-0">
              {userInitials}
            </div>
            <div className="flex-1 min-w-0 text-left">
              <p className="text-xs font-bold text-foreground truncate leading-tight">
                {profile?.full_name || 'User'}
              </p>
              <p className="text-[10px] text-muted-foreground truncate mt-0.5">
                {user?.email}
              </p>
            </div>
            <ChevronsUpDown size={14} className="text-muted-foreground shrink-0" />
          </button>
        </div>
      </SidebarFooter>
    </>
  )

  if (!isDesktop) {
    return (
      <Sheet open={open} onOpenChange={(val) => !val && onClose?.()}>
        <SheetContent side="left" hideClose className="p-0 border-r border-border w-[285px] max-w-[85vw] flex flex-col h-full overflow-hidden" style={{ background: 'var(--bg-1-val)' }}>
          <SheetHeader className="sr-only">
            <SheetTitle>Navigasi Sidebar</SheetTitle>
            <SheetDescription>Menu navigasi utama aplikasi Virgin Dashboard ERP.</SheetDescription>
          </SheetHeader>
          <Sidebar collapsible="none" className="border-none bg-transparent select-none cursor-default flex flex-col h-full w-full overflow-hidden">
            {sidebarContent}
          </Sidebar>
        </SheetContent>
      </Sheet>
    )
  }

  return (
    <Sidebar collapsible="offcanvas" className="select-none cursor-default border-r border-border" style={{ background: 'var(--bg-1-val)' }}>
      {sidebarContent}
    </Sidebar>
  )
}
