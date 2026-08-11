import React, { useState, useEffect, useRef } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { NavLink, useLocation, useNavigate } from 'react-router-dom'
import {
  Home,
  ArrowLeftRight,
  Building2,
  Warehouse,
  Truck,
  Wallet,
  Car,
  BarChart2,
  Calculator,
  ChevronsUpDown,
  ChevronDown,
  User,
  Users,
  Users2,
  LogOut,
  Bell,
  Check,
  Plus,
  Lock,
  RotateCcw,
  Sparkles,
  Shield,
  ShieldAlert,
  ArrowRight,
  CreditCard,
  ShoppingCart,
  Package,
  Store,
  Syringe,
  RefreshCw,
  ClipboardList,
  FileText,
  LayoutGrid,
  Tag,
  Heart,
  X,
  Settings2,
  Brain,
  Zap,
  Bot,
  TrendingUp,
  MessageSquareText,
  Wrench,
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
  SidebarProvider,
} from '@/components/ui/sidebar'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'
import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetHeader,
  SheetTitle,
} from "@/components/ui/sheet"
import { resolveBusinessVertical, BUSINESS_MODELS, getXBasePath } from '@/lib/businessModel'
import { useAuth, getBrokerBasePath } from '@/lib/hooks/useAuth'
import { WA_URL } from '@/lib/constants/contact'
import { getSubscriptionStatus } from '@/lib/subscriptionUtils'
import { supabase } from '@/lib/supabase'
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
  const [isAddingBusiness, setIsAddingBusiness] = useState(false)
  const [dropdownOpen, setDropdownOpen] = useState(false)
  const [mobileSwitcherOpen, setMobileSwitcherOpen] = useState(false)
  const [tenantMenuOpen, setTenantMenuOpen] = useState(false)
  const [expandedFarms, setExpandedFarms] = useState({})
  const [isSwitching, setIsSwitching] = useState(false)
  // Start UTAMA collapsed when already on a per-farm route so kandang sections get focus
  const [utamaCollapsed, setUtamaCollapsed] = useState(
    () => /^\/peternak\/[^/]+\/kandang\//.test(location.pathname)
  )
  const userDropdownRef = useRef(null)

  // Get dynamic trial configuration from admin settings
  const { data: planConfigs } = usePlanConfigs()
  const trialConfig = planConfigs?.trial_config || { duration: 14 }
  const trialDurationDays = Number(trialConfig.duration) || 14

  const handleStartProTrial = async () => {
    try {
      const trialEnd = new Date(Date.now() + trialDurationDays * 24 * 60 * 60 * 1000).toISOString()
      const { error } = await supabase
        .from('tenants')
        .update({
          plan: 'pro',
          trial_ends_at: trialEnd,
          kandang_limit: 2
        })
        .eq('id', tenant?.id)

      if (error) throw error
      toast.success('🎉 Trial PRO ' + trialDurationDays + ' Hari dimulai!')
      setTimeout(() => window.location.reload(), 500)
    } catch (err) {
      toast.error('Gagal: ' + err.message)
    }
  }

  const isDesktop = useMediaQuery('(min-width: 1024px)')

  // Farms for peternak multi-kandang sidebar
  const peternakFarms = []

  const toggleFarm = (farmId) =>
    setExpandedFarms(prev => ({ ...prev, [farmId]: !prev[farmId] }))

  // Auto-expand the farm section matching the current URL
  // URL structure: /peternak/:peternakType/kandang/:farmId/...
  useEffect(() => {
    const match = location.pathname.match(/^\/peternak\/[^/]+\/kandang\/([^/]+)/)
    if (match) {
      const activeFarmId = match[1]
      setExpandedFarms(prev => prev[activeFarmId] ? prev : { ...prev, [activeFarmId]: true })
      // Collapse UTAMA when entering a farm route
      setUtamaCollapsed(true)
    } else if (/^\/peternak\//.test(location.pathname)) {
      // Expand UTAMA when navigating to a global peternak page (not farm-level)
      setUtamaCollapsed(false)
    }
  }, [location.pathname])

  // ── Multi-Tenant Quota Check ──
  const [quota, setQuota] = useState({ usage: 0, limit: 0, canAdd: false })
  useEffect(() => {
    async function loadQuota() {
      if (!ownerTenant || !profile) return
      const res = await checkQuotaUsage(ownerTenant, profile, 'business')
      setQuota(res)
    }
    loadQuota()
  }, [ownerTenant, profile, profiles])

  const canAddBusiness = isSuperadmin || quota.canAdd

  const [activeProfileId, setActiveProfileId] = useState(null)

  useEffect(() => {
    if (profile && !activeProfileId) {
      setActiveProfileId(profile.id)
    }
  }, [profile])

  // const profile = profiles.find(p => p.id === activeProfileId) || authProfile
  // const tenant = profile?.tenants || authTenant

  const userInitials = profile?.full_name?.split(' ').map(n => n[0]).join('').toUpperCase().slice(0, 2) || 'U'

  const { accentColor } = useTheme()

  const vertical = resolveBusinessVertical(profile, tenant)
  const model = BUSINESS_MODELS[vertical]
  const isPoultry = vertical === 'poultry_broker'
  const isEgg = vertical === 'egg_broker'
  const isPeternak = model?.category === 'peternak'   // true for ALL peternak verticals
  const isBroiler = vertical === 'peternak'
  const isDombaPenggemukan = vertical === 'peternak_domba_penggemukan'
  const isDombaBreeding = vertical === 'peternak_domba_breeding'
  const isKambingPenggemukan = vertical === 'peternak_kambing_penggemukan'
  const isKambingBreeding = vertical === 'peternak_kambing_breeding'
  const _isFatteningPremium = isDombaPenggemukan || isKambingPenggemukan
  const isSapiPenggemukan = vertical === 'peternak_sapi_penggemukan'
  const isSapiBreeding = vertical === 'peternak_sapi_breeding'
  const isRPA = vertical === 'rumah_potong_rpa' || model?.category === 'rumah_potong'
  const isSembako = ['distributor_sembako', 'sembako_broker'].includes(vertical)

  // Sembako returs
  const { data: sembakoReturnsList = [] } = useSembakoReturns()
  const pendingRetursCount = isSembako ? sembakoReturnsList.filter(r => r.status === 'pending').length : 0
  const pp = null


  const brokerBase = getBrokerBasePath(tenant)
  const peternakBase = getXBasePath(tenant, profile)

  const color = accentColor || (isSembako ? '#EA580C' : isEgg ? '#7C3AED' : isRPA ? '#F59E0B' : '#10B981')

  const getBerandaPath = (v, t = tenant) => {
    const bBase = getBrokerBasePath(t)
    return `${bBase}/beranda`
  }

  const getAkunPath = (v, t = tenant) => {
    const bBase = getBrokerBasePath(t)
    return `${bBase}/akun`
  }

  const berandaPath = getBerandaPath(vertical)
  const akunPath = getAkunPath(vertical)

  const getVerticalInfo = (v) => {
    let modelKey = v;
    if (v === 'poultry_broker') modelKey = 'broker';
    if (v === 'egg_broker') modelKey = 'broker_telur';
    if (v === 'peternak') modelKey = 'ayam';
    if (v === 'peternak_domba_penggemukan') modelKey = 'domba_penggemukan';
    if (v === 'peternak_domba_breeding') modelKey = 'domba_breeding';
    if (v === 'peternak_kambing_penggemukan') modelKey = 'kambing_penggemukan';
    if (v === 'peternak_kambing_breeding') modelKey = 'kambing_breeding';
    if (v === 'sembako_broker') modelKey = 'distributor_sembako';
    if (v === 'rpa') modelKey = 'rumah_potong_rpa';

    const m = BUSINESS_MODELS[modelKey] || BUSINESS_MODELS[v];
    if (m) {
      return { icon: m.icon || '🏢', label: m.name || m.label || 'Bisnis' };
    }

    return { icon: '🏢', label: 'Bisnis' }
  }

  const activeVerticalInfo = getVerticalInfo(vertical)

  const handleGoToAdmin = () => {
    // isSuperadmin is already verified from useAuth() — navigate directly.
    // The button is only rendered when isSuperadmin === true, so no extra check needed.
    if (isSuperadmin) {
      navigate('/admin')
      return
    }
    // Fallback: try to find a matching superadmin profile and switch tenant
    const adminProfile = profiles?.find(p => checkIsSuperadmin(p))
    if (adminProfile) {
      switchTenant(adminProfile.tenant_id)
      navigate('/admin')
    }
  }

  const navMain = [
    // ── UTAMA ──────────────────────────────────────────────
    {
      label: 'UTAMA',
      items: [
        { title: 'Beranda', url: berandaPath, icon: Home },

        // Broker Ayam
        ...(isPoultry ? [
          { title: 'Transaksi', url: `${brokerBase}/transaksi`, icon: ArrowLeftRight, dataTutorial: 'broker-transaksi' },
          { title: 'RPA & Piutang', url: `${brokerBase}/rpa`, icon: Building2, roles: ['owner', 'staff'] },
          { title: 'Kandang', url: `${brokerBase}/kandang`, icon: Warehouse, roles: ['owner', 'staff'], dataTutorial: 'broker-kandang' },
          { title: 'Tim & Akses', url: `${brokerBase}/tim`, icon: Users, roles: ['owner'] },
        ] : []),

        // Broker Telur
        ...(isEgg ? [
          { title: 'POS / Jual', url: `${brokerBase}/pos`, icon: ArrowLeftRight, dataTutorial: 'egg-pos' },
          { title: 'Inventori & HPP', url: `${brokerBase}/inventori`, icon: Warehouse, roles: ['owner', 'staff'], dataTutorial: 'egg-inventori' },
          { title: 'Supplier Telur', url: `${brokerBase}/suppliers`, icon: Building2, roles: ['owner', 'staff'], dataTutorial: 'egg-supplier' },
          { title: 'Pelanggan Telur', url: `${brokerBase}/customers`, icon: User, roles: ['owner', 'staff'] },
          { title: 'Riwayat Transaksi', url: `${brokerBase}/transaksi`, icon: BarChart2, roles: ['owner', 'staff'] },
        ] : []),

        // Peternak Broiler — global links
        ...(isBroiler ? [
          { title: 'Semua Siklus', url: `${peternakBase}/siklus`, icon: RefreshCw, show: pp?.canViewSiklus ?? true },
          { title: 'Anak Kandang', url: `${peternakBase}/anak-kandang`, icon: Users, show: pp?.canViewAnakKandang ?? true },
        ].filter(item => item.show !== false) : []),

        // Domba Penggemukan
        ...(isDombaPenggemukan ? [
          { title: 'Batch Aktif', url: `${peternakBase}/batch`, icon: RefreshCw, show: pp?.canViewSiklus ?? true, dataTutorial: 'peternak-siklus' },
          { title: 'Data Ternak', url: `${peternakBase}/ternak`, icon: Tag },
          { title: 'Penjualan', url: `${peternakBase}/penjualan`, icon: ShoppingCart, show: pp?.canViewPenjualan ?? true },
          { title: 'Denah Kandang', url: `${peternakBase}/kandang-view`, icon: LayoutGrid, dataTutorial: 'peternak-kandang' },
        ] : []),

        // Domba Breeding
        ...(isDombaBreeding ? [
          { title: 'Data Ternak', url: `${peternakBase}/ternak`, icon: Tag },
          { title: 'Reproduksi', url: `${peternakBase}/reproduksi`, icon: Heart },
        ] : []),

        // Kambing Penggemukan
        ...(isKambingPenggemukan ? [
          { title: 'Batch Aktif', url: `${peternakBase}/batch`, icon: RefreshCw, show: pp?.canViewSiklus ?? true, dataTutorial: 'peternak-siklus' },
          { title: 'Data Ternak', url: `${peternakBase}/ternak`, icon: Tag },
          { title: 'Penjualan', url: `${peternakBase}/penjualan`, icon: ShoppingCart, show: pp?.canViewPenjualan ?? true },
          { title: 'Denah Kandang', url: `${peternakBase}/kandang-view`, icon: LayoutGrid, dataTutorial: 'peternak-kandang' },
        ] : []),

        // Kambing Breeding
        ...(isKambingBreeding ? [
          { title: 'Data Ternak', url: `${peternakBase}/ternak`, icon: Tag },
          { title: 'Reproduksi', url: `${peternakBase}/reproduksi`, icon: Heart },
        ] : []),

        ...(isSapiPenggemukan || isSapiBreeding ? [
          { title: 'Sapi Aktif', url: `${peternakBase}/batch`, icon: RefreshCw, show: isSapiPenggemukan, dataTutorial: 'peternak-siklus' },
          { title: 'Data Ternak', url: `${peternakBase}/ternak`, icon: Tag },
          { title: 'Penjualan', url: `${peternakBase}/penjualan`, icon: ShoppingCart, show: isSapiPenggemukan && (pp?.canViewPenjualan ?? true) },
          { title: 'Denah Kandang', url: `${peternakBase}/kandang-view`, icon: LayoutGrid, show: isSapiPenggemukan, dataTutorial: 'peternak-kandang' },
          { title: 'Reproduksi', url: `${peternakBase}/reproduksi`, icon: Heart, show: isSapiBreeding, dataTutorial: 'peternak-siklus' },
        ].filter(item => item.show !== false) : []),

        // RPA
        // Rumah Potong
        ...(isRPA ? [
          ...(profile?.sub_type?.startsWith('rpa') ? [
            { title: 'Order', url: '/rumah_potong/rpa/order', icon: ArrowLeftRight, dataTutorial: 'rpa-order' },
            { title: 'Hutang', url: '/rumah_potong/rpa/hutang', icon: Wallet },
            { title: 'Distribusi', url: '/rumah_potong/rpa/distribusi', icon: Truck, dataTutorial: 'rpa-distribusi' },
            { title: 'Laporan', url: '/rumah_potong/rpa/laporan', icon: BarChart2, roles: ['owner'], planRequired: 'pro', dataTutorial: 'rpa-laporan' },
          ] : [
            /* RPH placeholder items if any */
            { title: 'Dashboard', url: '/rumah_potong/rph/beranda', icon: Home },
          ])
        ] : []),

        // Sembako Broker
        ...(isSembako ? [
          { title: 'Penjualan', url: `${brokerBase}/penjualan`, icon: ArrowLeftRight, dataTutorial: 'sembako-penjualan' },
          { title: 'Toko & Supplier', url: `${brokerBase}/toko-supplier`, icon: Store, dataTutorial: 'sembako-toko' },
          { title: 'Gudang', url: `${brokerBase}/gudang`, icon: Warehouse, dataTutorial: 'sembako-gudang' },
          { title: 'Retur Produk', url: `${brokerBase}/retur`, icon: RotateCcw, badge: pendingRetursCount > 0 ? String(pendingRetursCount) : null },
          { title: 'Inventori & HPP', url: `${brokerBase}/produk`, icon: Package, roles: ['owner', 'staff'] },
        ] : []),
      ]
    },

    // ── TUGAS ──────────────────────────────────────────────
    ...(isPeternak ? [{
      label: 'TUGAS',
      items: [
        // Non-broiler peternak doesn't have a dedicated "Input Harian" nav item
        // (broiler has it inside the per-farm collapsible). Tugas Harian is the
        // closest daily-tracking entry-point for fattening/breeding/dairy users,
        // so use it as the spotlight target for the `peternak-input` step.
        { title: 'Tugas Harian', url: `${peternakBase}/daily_task`, icon: ClipboardList, dataTutorial: !isBroiler ? 'peternak-input' : undefined },
        ...((isSapiPenggemukan || isSapiBreeding || isDombaPenggemukan || isDombaBreeding || isKambingPenggemukan || isKambingBreeding || isBroiler) ? [
          { title: 'Penugasan', url: `${peternakBase}/task_assign`, icon: Users2, roles: ['owner', 'manajer'] },
          { title: 'Pengaturan Tugas', url: `${peternakBase}/task_settings`, icon: Settings2, roles: ['owner', 'manajer'] },
        ] : []),
      ]
    }] : []),

    // ── MANAJEMEN TIM ─────────────────────────────────────
    ...(isPeternak ? [{
      label: 'MANAJEMEN',
      items: [
        { title: 'Tim & Anak Kandang', url: `${peternakBase}/tim`, icon: Users, roles: ['owner', 'manajer'] },
      ]
    }] : []),

    // ── OPERASIONAL ───────────────────────────────────────
    ...((isPeternak && !isPoultry && !isEgg) ? [{
      label: 'OPERASIONAL',
      items: [
        { title: isBroiler ? 'Program Vaksin' : 'Kesehatan', url: `${peternakBase}/${isBroiler ? 'vaksinasi' : 'kesehatan'}`, icon: Syringe, show: isBroiler ? (pp?.canViewVaksinasi ?? true) : true },
        { title: 'Stok Pakan', url: `${peternakBase}/pakan`, icon: Warehouse, show: isBroiler ? (pp?.canViewPakan ?? true) : true },
        { title: isBroiler ? 'Laporan Siklus' : 'Laporan', url: `${peternakBase}/laporan`, icon: FileText, show: pp?.canViewLaporan ?? true, dataTutorial: 'peternak-laporan' },
        // Listrik & Air — hanya untuk peternak yang punya data batch (penggemukan)
        ...((isDombaPenggemukan || isKambingPenggemukan || isSapiPenggemukan || isSapiBreeding) ? [
          { title: 'Listrik & Air', url: `${peternakBase}/listrik-air`, icon: Zap, roles: ['owner', 'manajer'] },
        ] : []),
      ].filter(item => item.show !== false)
    }] : []),

    // ── OPERASIONAL — Sembako ───────────────────────────────
    ...(isSembako && !isAdminUser(profile) ? [{
      label: 'LAPORAN & MANAJEMEN',
      items: [
        { title: 'Laporan Bisnis', url: `${brokerBase}/laporan`, icon: BarChart2, roles: ['owner', 'dev'], planRequired: 'pro', dataTutorial: 'sembako-laporan' },
        { title: 'Tim & Karyawan', url: `${brokerBase}/tim`, icon: Users, roles: ['owner', 'dev'] },
      ]
    }] : []),



    // ── OPERASIONAL (broker only) ───────────────────────────
    ...(isPoultry ? [{
      label: 'OPERASIONAL',
      items: [
        { title: 'Pengiriman', url: `${brokerBase}/pengiriman`, icon: Truck, roles: ['owner', 'staff'], dataTutorial: 'broker-pengiriman' },
        { title: 'Cash Flow', url: `${brokerBase}/cashflow`, icon: Wallet, roles: ['owner'], planRequired: 'pro' },
        { title: 'Armada', url: `${brokerBase}/armada`, icon: Car, roles: ['owner'] },
        { title: 'Simulator', url: `${brokerBase}/simulator`, icon: Calculator, roles: ['owner'], planRequired: 'pro' },
      ]
    }] : []),

    ...(isEgg ? [{
      label: 'OPERASIONAL',
      items: [
        { title: 'Cash Flow', url: `${brokerBase}/cashflow`, icon: Wallet, roles: ['owner'] },
      ]
    }] : []),

    // ── INTELIGENSI AI ────────────────────────────────────
    ...(isPeternak ? [{
      label: 'INTELIGENSI AI',
      items: [
        { title: 'Tanya AI Assistant', url: `${peternakBase}/ai-chat`, icon: MessageSquareText, badge: 'DEV', locked: true },
        { title: 'Analisis Performa', url: `${peternakBase}/ai-analysis`, icon: Brain, badge: 'DEV', locked: true },
        { title: 'Prediksi Hasil', url: `${peternakBase}/ai-prediction`, icon: TrendingUp, badge: 'DEV', locked: true },
      ]
    }] : []),
  ]

  const filteredNavMain = navMain.map(group => ({
    ...group,
    items: group.items.filter(item => {
      if (!item.roles) return true // default accessible to all roles
      return item.roles.includes(profile?.role) || isSuperadmin
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

  const handleLogout = async () => {
    try {
      if (logout) {
        await logout()
      } else {
        localStorage.removeItem('sembako_active_role')
        localStorage.removeItem('ternakos_active_tenant_id')
        await supabase.auth.signOut({ scope: 'local' })
      }
      toast.success('Berhasil keluar')
    } catch (err) {
      // ignore
    } finally {
      navigate('/login', { replace: true })
    }
  }

  // Subscription status — single source of truth
  const getStatusColor = (status) => {
    switch (status) {
      case 'active': return { color: '#34D399', bg: 'rgba(52, 211, 153, 0.1)', border: 'rgba(52, 211, 153, 0.2)' }
      case 'trial': return { color: '#F59E0B', bg: 'rgba(245,158,11,0.12)', border: 'rgba(245,158,11,0.25)' }
      case 'expired': return { color: '#F87171', bg: 'rgba(248,113,113,0.12)', border: 'rgba(248,113,113,0.25)' }
      default: return { color: '#64748B', bg: 'rgba(100,116,139,0.10)', border: 'rgba(100,116,139,0.20)' }
    }
  }

  // ── Subscription: use active working TENANT for feature gating within the dashboard ──
  // Staff invited to a Pro tenant should get Pro features while working INSIDE that tenant.
  // ownerTenant is only used for quota (how many businesses you can create yourself).
  const sub = getSubscriptionStatus(tenant)
  const isAccountActive = true
  const canStartTrial = false
  // Plan-tier gating (Fully Unlocked)
  const planTier = 'business'
  const isPro = true
  const isBusiness = true

  const sidebarContent = (
    <>
      <SidebarHeader style={{ padding: '16px 16px 8px' }}>
        {/* Clean Logo & Brand Header */}
        <div
          className="flex items-center gap-3 px-3 py-3 select-none bg-slate-50 dark:bg-[#121A23] border border-slate-200 dark:border-white/[0.08] rounded-xl shadow-sm cursor-pointer"
          onClick={() => navigate(berandaPath)}
        >
          <div className="relative w-8 h-8 flex-shrink-0 flex items-center justify-center">
            <img
              src="/logo.png"
              alt="Broker Dashboard Icon"
              className="w-8 h-8 rounded-lg object-contain"
              onError={(e) => {
                e.currentTarget.style.display = 'none';
                if (e.currentTarget.nextElementSibling) {
                  e.currentTarget.nextElementSibling.style.display = 'flex';
                }
              }}
            />
            <div className="w-8 h-8 rounded-lg bg-orange-500/15 border border-orange-500/30 text-orange-500 items-center justify-center font-bold text-xs flex-shrink-0 hidden">
              BD
            </div>
          </div>
          <div className="flex-1 overflow-hidden">
            <p className="font-display font-extrabold text-[14px] text-slate-900 dark:text-slate-100 leading-none">
              Broker Dashboard
            </p>
            <p className="text-[11px] text-slate-500 dark:text-slate-400 mt-1 font-medium">
              Distributor Rokok
            </p>
          </div>
        </div>

        {/* Mode Switcher Banner untuk Dev/Superadmin */}
        {isDevUser(profile) && (
          <div className="px-3 pt-2 pb-1">
            <button
              onClick={() => navigate('/admin/dashboard')}
              className="w-full py-2.5 px-3.5 bg-[#EA580C]/10 hover:bg-[#EA580C]/20 border border-[#EA580C]/30 text-[#EA580C] hover:text-orange-300 rounded-xl text-[11px] font-extrabold flex items-center justify-center gap-2 shadow-sm transition-all active:scale-[0.98] cursor-pointer group"
            >
              <ShieldAlert size={14} className="text-[#EA580C] shrink-0" />
              <span className="truncate">Switch ke Admin Pusat</span>
              <ArrowRight size={12} className="ml-auto opacity-70 group-hover:translate-x-0.5 transition-transform" />
            </button>
          </div>
        )}
      </SidebarHeader>

      <SidebarContent className="px-2 py-2">
        {filteredNavMain.map((group) => {
          const isUtama = group.label === 'UTAMA'
          // Only make UTAMA collapsible for peternak (they have per-farm sections to focus on)
          const collapsible = isUtama && isBroiler && peternakFarms.length > 0
          const collapsed = collapsible && utamaCollapsed
          return (
            <SidebarGroup key={group.label}>
              {collapsible ? (
                <button
                  onClick={() => setUtamaCollapsed(v => !v)}
                  className="w-full flex items-center justify-between px-2 mb-1 bg-transparent border-none cursor-pointer select-none group"
                >
                  <span className="text-[10px] font-bold tracking-[0.15em] text-slate-400 group-hover:text-slate-600 dark:group-hover:text-slate-300 transition-colors">
                    {group.label}
                  </span>
                  <ChevronDown
                    size={12}
                    className="text-slate-400 group-hover:text-slate-600 dark:group-hover:text-slate-300 transition-all duration-200"
                    style={{ transform: collapsed ? 'rotate(-90deg)' : 'rotate(0deg)' }}
                  />
                </button>
              ) : (
                <SidebarGroupLabel className="text-[10px] font-bold tracking-[0.15em] text-slate-400 px-2 mb-1 select-none cursor-default">
                  {group.label}
                </SidebarGroupLabel>
              )}
              {!collapsed && (
                <SidebarGroupContent>
                  <SidebarMenu>
                    {group.items.map((item) => {
                      const isActive = location.pathname === item.url
                      const isPlanLocked = !isSuperadmin && (
                        (item.planRequired === 'pro' && !isPro) ||
                        (item.planRequired === 'business' && !isBusiness)
                      )
                      const isLocked = item.locked || (!isSuperadmin && (!isAccountActive || isPlanLocked))
                      const lockTooltip = isPlanLocked
                        ? `${item.title} — Upgrade ke ${item.planRequired === 'business' ? 'Business' : 'Pro'}`
                        : `${item.title} (Segera Hadir)`
                      return (
                        <SidebarMenuItem key={item.title}>
                          <SidebarMenuButton
                            asChild={!isLocked}
                            isActive={isActive}
                            tooltip={isLocked ? lockTooltip : item.title}
                            className={`rounded-xl mb-0.5 transition-all duration-200 select-none ${isLocked
                                ? 'opacity-50 cursor-not-allowed'
                                : isActive
                                  ? 'bg-opacity-10 cursor-pointer'
                                  : 'hover:bg-slate-100 dark:hover:bg-white/[0.04] text-slate-600 dark:text-slate-300 hover:text-slate-900 dark:hover:text-white cursor-pointer'
                              }`}
                            style={isActive && !isLocked ? {
                              background: `${color}18`,
                              border: `1px solid ${color}33`,
                              color: color
                            } : {}}
                          >
                            {isLocked ? (
                              <div className="flex items-center gap-3 w-full px-2 py-1.5">
                                <item.icon
                                  size={18}
                                  className="text-slate-500"
                                  strokeWidth={2}
                                />
                                <span className="font-body text-[14px] flex-1 font-medium text-slate-500">
                                  {item.title}
                                </span>
                                {item.badge ? (
                                  <span className="text-[9px] font-black uppercase tracking-wide px-1.5 py-0.5 rounded-md bg-blue-500/10 text-blue-500 border border-blue-500/20">
                                    {item.badge}
                                  </span>
                                ) : isPlanLocked ? (
                                  <span className="text-[9px] font-black uppercase tracking-wide px-1.5 py-0.5 rounded-md bg-emerald-500/10 text-emerald-500/60 border border-emerald-500/15">
                                    PRO
                                  </span>
                                ) : (
                                  <Lock size={12} className="text-slate-500" />
                                )}
                              </div>
                            ) : (
                              <NavLink to={item.url} data-tutorial={item.dataTutorial} className="flex items-center gap-3 w-full group">
                                <item.icon
                                  size={18}
                                  style={isActive ? { color: color } : {}}
                                  className={!isActive ? 'text-slate-500 dark:text-slate-400 group-hover:text-slate-700 dark:group-hover:text-slate-200 transition-colors' : ''}
                                  strokeWidth={isActive ? 2.5 : 2}
                                />
                                <span className={`font-body text-[14px] flex-1 ${isActive ? 'font-semibold text-white' : 'font-medium text-slate-600 dark:text-slate-300 group-hover:text-slate-900 dark:group-hover:text-white transition-colors'}`} style={isActive ? { color: color } : {}}>
                                  {item.title}
                                </span>
                                {item.isDevItem ? (
                                  <span className="text-[9px] font-black uppercase tracking-wider bg-[#EA580C]/20 text-[#EA580C] border border-[#EA580C]/40 rounded-md px-1.5 py-0.5 shrink-0 animate-pulse shadow-sm">
                                    DEV
                                  </span>
                                ) : item.badge && (
                                  <span className="text-[9px] font-black bg-amber-500/15 text-amber-500 border border-amber-500/25 rounded-[4px] px-1.5 py-0.5 animate-pulse">
                                    {item.badge}
                                  </span>
                                )}
                              </NavLink>
                            )}
                          </SidebarMenuButton>
                        </SidebarMenuItem>
                      )
                    })}
                  </SidebarMenu>
                </SidebarGroupContent>
              )}
            </SidebarGroup>
          )
        })}

        {/* ── Peternak: per-farm collapsible sections ── */}
        {isBroiler && (
          <>
            <SidebarSeparator className="my-1" />

            {/* Empty State CTA */}
            {peternakFarms.length === 0 && (
              <div className="px-3 py-4">
                <div className="bg-purple-500/5 border border-dashed border-purple-500/20 rounded-2xl p-4 text-center">
                  <div className="w-9 h-9 rounded-xl bg-purple-500/10 flex items-center justify-center mx-auto mb-3">
                    <Plus size={18} className="text-purple-400" />
                  </div>
                  <p className="text-[11px] font-bold text-slate-300 mb-1">Belum Ada Kandang</p>
                  <p className="text-[10px] text-[#4B6478] mb-4 leading-relaxed">
                    Mulai kelola operasional dengan menambah kandang pertama.
                  </p>
                  <button
                    data-tutorial="peternak-kandang"
                    onClick={() => navigate(`${peternakBase}/beranda`)}
                    className="w-full py-2 bg-purple-600 hover:bg-purple-500 text-white text-[11px] font-bold rounded-xl shadow-lg shadow-purple-900/20 transition-all border-none cursor-pointer"
                  >
                    ＋ Tambah Kandang
                  </button>
                </div>
              </div>
            )}

            {peternakFarms.map((farm) => {
              const isOpen = expandedFarms[farm.id] ?? false
              const farmBase = `${peternakBase}/kandang/${farm.id}`
              const isOnFarm = location.pathname.startsWith(farmBase)
              const LIVESTOCK = { ayam_broiler: '🐔', ayam_petelur: '🥚', domba: '🐑', kambing: '🐐', sapi: '🐄' }
              const emoji = LIVESTOCK[farm.livestock_type] ?? '🏚'

              const farmColor = accentColor || '#7C3AED'
              return (
                <SidebarGroup key={farm.id} className="py-0.5">
                  {/* Farm header — click to expand */}
                  <button
                    onClick={() => toggleFarm(farm.id)}
                    style={isOnFarm ? {
                      background: `${farmColor}18`,
                      border: `1px solid ${farmColor}33`,
                    } : {}}
                    className={`w-full flex items-center gap-2.5 px-3 py-2 rounded-xl mb-0.5 transition-colors text-left cursor-pointer border-none ${isOnFarm ? '' : 'bg-transparent hover:bg-slate-100 dark:hover:bg-white/[0.03]'
                      }`}
                  >
                    <span className="text-base flex-shrink-0">{emoji}</span>
                    <span
                      className="font-['Sora'] text-[13px] font-bold flex-1 truncate text-slate-700 dark:text-slate-200"
                      style={{ color: isOnFarm ? farmColor : undefined }}
                    >
                      {farm.farm_name}
                    </span>
                    <ChevronDown
                      size={13}
                      className={`text-muted-foreground transition-transform flex-shrink-0 ${isOpen ? 'rotate-180' : ''}`}
                    />
                  </button>

                  {/* Collapsible farm sub-items */}
                  {isOpen && (
                    <SidebarGroupContent>
                      <SidebarMenu className="pl-2">
                        {[
                          { title: 'Dashboard', url: `${farmBase}/beranda`, icon: Home, show: true },
                          { title: 'Siklus', url: `${farmBase}/siklus`, icon: RefreshCw, show: pp?.canViewSiklus ?? true, dataTutorial: 'peternak-siklus' },
                          { title: 'Input Harian', url: `${farmBase}/input`, icon: ClipboardList, show: pp?.canInputHarian ?? true, dataTutorial: 'peternak-input' },
                          { title: 'Laporan', url: `${peternakBase}/laporan`, icon: FileText, show: pp?.canViewLaporan ?? true, dataTutorial: 'peternak-laporan' },
                          { title: 'Pakan', url: `${farmBase}/pakan`, icon: Warehouse, show: pp?.canViewPakan ?? true },
                          { title: 'Vaksinasi', url: `${peternakBase}/vaksinasi`, icon: Syringe, show: pp?.canViewVaksinasi ?? true },
                        ].filter(item => item.show !== false).map((item) => {
                          const isActive = location.pathname === item.url || location.pathname.startsWith(item.url + '?')
                          return (
                            <SidebarMenuItem key={item.title}>
                              <SidebarMenuButton
                                asChild
                                isActive={isActive}
                                className={`rounded-xl mb-0.5 transition-all select-none cursor-pointer ${isActive ? '' : 'hover:bg-slate-100 dark:hover:bg-white/[0.03] text-slate-600 dark:text-slate-300 hover:text-slate-900 dark:hover:text-white'
                                  }`}
                                style={isActive ? {
                                  background: `${farmColor}18`,
                                  border: `1px solid ${farmColor}33`,
                                } : {}}
                              >
                                <NavLink to={item.url} data-tutorial={item.dataTutorial} className="flex items-center gap-3 w-full">
                                  <item.icon
                                    size={16}
                                    style={{ color: isActive ? farmColor : undefined }}
                                    className={isActive ? '' : 'text-muted-foreground'}
                                    strokeWidth={isActive ? 2.5 : 2}
                                  />
                                  <span
                                    className={`font-body text-[13px] flex-1 ${isActive ? 'font-semibold' : 'font-medium'}`}
                                    style={{ color: isActive ? farmColor : undefined }}
                                  >
                                    {item.title}
                                  </span>
                                </NavLink>
                              </SidebarMenuButton>
                            </SidebarMenuItem>
                          )
                        })}
                      </SidebarMenu>
                    </SidebarGroupContent>
                  )}
                </SidebarGroup>
              )
            })}

            {/* ── Kandang limit + Add button ── */}
            {(() => {
              const kandangLimit = tenant?.kandang_limit ?? 1
              const currentCount = peternakFarms.reduce((s, f) => s + (f.kandang_count || 1), 0)
              const canAddKandang = currentCount < kandangLimit
              const limitLabel = kandangLimit >= 99 ? '∞' : String(kandangLimit)
              return (
                <div className="px-3 pt-1 pb-2">
                  <button
                    data-tutorial="peternak-kandang"
                    onClick={() => canAddKandang && navigate(`${peternakBase}/beranda`)}
                    disabled={!canAddKandang}
                    className={`w-full flex items-center justify-between gap-2 px-3 py-2 rounded-xl text-[13px] font-semibold border transition-colors ${canAddKandang
                        ? 'border-emerald-500/30 text-emerald-600 dark:text-emerald-400 hover:bg-emerald-500/10 cursor-pointer bg-transparent'
                        : 'border-slate-200 dark:border-white/10 text-muted-foreground cursor-not-allowed bg-transparent opacity-60'
                      }`}
                    title={!canAddKandang ? `Batas kandang plan kamu ${limitLabel} — upgrade untuk tambah lebih` : 'Tambah kandang baru'}
                  >
                    <span className="flex items-center gap-1.5">
                      {canAddKandang ? <Plus size={13} /> : <Lock size={13} />}
                      Tambah Kandang
                    </span>
                    <span className="text-[11px] font-bold opacity-70">{currentCount}/{limitLabel}</span>
                  </button>
                </div>
              )
            })()}

          </>
        )}

        {/* ── LAINNYA ── */}
        <SidebarGroup className="mt-2">
          <SidebarGroupLabel className="text-[10px] font-bold tracking-[0.15em] text-slate-400 px-2 mb-1 select-none cursor-default">
            LAINNYA
          </SidebarGroupLabel>
          <SidebarGroupContent>
            <SidebarMenu>
              {(isPoultry || isPeternak) && (
                <SidebarMenuItem>
                  <SidebarMenuButton
                    asChild
                    isActive={location.pathname === '/dashboard/harga-pasar'}
                    className="rounded-xl mb-0.5 hover:bg-slate-100 dark:hover:bg-white/[0.03]"
                    style={location.pathname === '/dashboard/harga-pasar' ? { background: `${color}18`, border: `1px solid ${color}33`, color: color } : {}}
                  >
                    <NavLink to="/dashboard/harga-pasar" className="flex items-center gap-3 w-full">
                      <BarChart2 size={18} style={location.pathname === '/dashboard/harga-pasar' ? { color: color } : {}} className={location.pathname === '/dashboard/harga-pasar' ? '' : 'text-muted-foreground'} />
                      <span className={`font-body text-[14px] ${location.pathname === '/dashboard/harga-pasar' ? 'font-semibold' : 'font-medium'}`} style={location.pathname === '/dashboard/harga-pasar' ? { color: color } : {}}>Harga Pasar</span>
                    </NavLink>
                  </SidebarMenuButton>
                </SidebarMenuItem>
              )}
              {!isSembako && (
                <SidebarMenuItem>
                  <SidebarMenuButton
                    asChild
                    isActive={location.pathname === akunPath}
                    className="rounded-xl mb-0.5 hover:bg-slate-100 dark:hover:bg-white/[0.03]"
                    style={location.pathname === akunPath ? { background: `${color}18`, border: `1px solid ${color}33`, color: color } : {}}
                  >
                    <NavLink to={akunPath} className="flex items-center gap-3 w-full">
                      <User size={18} style={location.pathname === akunPath ? { color: color } : {}} className={location.pathname === akunPath ? '' : 'text-muted-foreground'} />
                      <span className={`font-body text-[14px] ${location.pathname === akunPath ? 'font-semibold' : 'font-medium'}`} style={location.pathname === akunPath ? { color: color } : {}}>Akun & Profil</span>
                    </NavLink>
                  </SidebarMenuButton>
                </SidebarMenuItem>
              )}
              {isSuperadmin && (
                <SidebarMenuItem>
                  <SidebarMenuButton
                    asChild
                    isActive={location.pathname.startsWith('/admin')}
                    className="rounded-xl mb-0.5 hover:bg-slate-100 dark:hover:bg-white/[0.03]"
                    style={location.pathname.startsWith('/admin') ? { background: 'rgba(245, 158, 11, 0.1)', border: '1px solid rgba(245, 158, 11, 0.25)', color: '#F59E0B' } : {}}
                  >
                    <NavLink to="/admin" className="flex items-center gap-3 w-full">
                      <Shield size={18} style={location.pathname.startsWith('/admin') ? { color: '#F59E0B' } : {}} className={location.pathname.startsWith('/admin') ? '' : 'text-amber-500 group-hover:text-amber-400 transition-colors'} />
                      <span className={`font-body text-[14px] ${location.pathname.startsWith('/admin') ? 'font-semibold text-white' : 'font-medium text-amber-500/90 group-hover:text-amber-400 transition-colors'}`} style={location.pathname.startsWith('/admin') ? { color: '#F59E0B' } : {}}>Admin Panel</span>
                    </NavLink>
                  </SidebarMenuButton>
                </SidebarMenuItem>
              )}
            </SidebarMenu>
          </SidebarGroupContent>
        </SidebarGroup>

        {/* ── Quick Actions (fills bottom space if superadmin) ── */}
        {isSuperadmin && (
          <div className="mt-auto px-1 pb-2 space-y-0.5">
            <SidebarSeparator className="mb-2 mt-3" />
            <button
              onClick={handleGoToAdmin}
              className="w-full flex items-center gap-2.5 px-3 py-2 rounded-xl text-amber-650 dark:text-amber-400 hover:bg-amber-500/5 dark:hover:bg-amber-500/10 transition-colors border-none cursor-pointer bg-transparent text-left"
            >
              <Shield size={14} className="shrink-0" />
              <span className="text-[13px] font-bold">Admin Panel</span>
            </button>
          </div>
        )}

      </SidebarContent>

      <SidebarFooter className="p-2 pb-6">
        <SidebarSeparator className="mb-2" />
        <div
          onClick={isSuperadmin ? handleGoToAdmin : undefined}
          className={`select-none mx-1 px-3.5 py-3 rounded-xl border transition-all ${isSuperadmin
              ? 'bg-amber-500/5 dark:bg-amber-500/3 border-amber-500/25 dark:border-amber-500/15 hover:bg-amber-500/10 hover:border-amber-500/35 cursor-pointer'
              : 'bg-orange-500/5 dark:bg-orange-500/10 border-orange-500/20'
            }`}
        >
          <div className="flex items-center justify-between gap-2">
            <div>
              <p className="text-[10px] font-bold text-slate-500 dark:text-[#6B8CAA] uppercase tracking-[0.8px] m-0">
                {isSuperadmin ? 'Status Akun' : 'Masa Aktif Server'}
              </p>
              <p className={`font-['Sora'] text-[13px] font-extrabold mt-0.5 flex items-center gap-1 ${
                isSuperadmin
                  ? 'text-amber-650 dark:text-amber-500'
                  : sub.isGrace || sub.isWarning
                  ? 'text-amber-500 dark:text-amber-400'
                  : 'text-orange-500 dark:text-orange-400'
                }`}>
                {isSuperadmin ? (
                  <><Shield size={14} className="text-amber-550 dark:text-amber-500" /> PLATFORM ADMIN</>
                ) : sub.isGrace ? (
                  'MASA TENGGANG'
                ) : (
                  'AKTIF'
                )}
              </p>
              {sub.expiresAt && (
                <p className="text-[9px] font-semibold text-slate-400 dark:text-slate-500 m-0 mt-0.5">
                  s.d. {sub.expiresAt.toLocaleDateString('id-ID', { day: 'numeric', month: 'short', year: 'numeric' })}
                </p>
              )}
            </div>

            {/* Status badge */}
            <div className="flex flex-col items-end gap-0.5">
              {isDevUser(profile) || isSuperadmin ? (
                <span className="text-[10px] font-extrabold rounded-md px-2 py-0.5 border uppercase tracking-wider bg-emerald-500/15 text-emerald-600 dark:text-emerald-400 border-emerald-500/30">
                  {sub.daysLeft && sub.daysLeft < 90000 ? `DEV (${sub.daysLeft} Hari)` : 'DEV UNLIMITED'}
                </span>
              ) : (
                <span className={`text-[10px] font-extrabold rounded-md px-2.5 py-0.5 border uppercase tracking-wider ${
                  sub.isGrace || sub.isWarning
                    ? 'bg-amber-500/15 text-amber-500 border-amber-500/30'
                    : 'bg-orange-500/15 text-orange-500 dark:text-orange-400 border-orange-500/30'
                }`}>
                  {sub.daysLeft ? `${sub.daysLeft} Hari Lagi` : 'Aktif'}
                </span>
              )}
            </div>
          </div>

          {/* WhatsApp Button Perpanjang Server - hanya untuk non-Dev/non-Superadmin */}
          {(!isSuperadmin && !isDevUser(profile)) && (
            <div className="mt-2.5">
              <a
                href={`${WA_URL}?text=${encodeURIComponent('Halo Admin, saya ingin memperpanjang masa aktif server Broker Dashboard saya.')}`}
                target="_blank"
                rel="noopener noreferrer"
                className="w-full py-2.5 px-3 bg-[#EA580C] hover:bg-[#C2410C] text-white border border-orange-400/30 rounded-xl text-[12px] font-extrabold font-['Sora'] cursor-pointer flex items-center justify-center gap-2 shadow-md shadow-orange-950/40 transition-all no-underline"
              >
                <MessageSquareText size={14} />
                Perpanjang Masa Aktif
              </a>
            </div>
          )}
        </div>

        {/* ── Custom user dropdown ── */}
        <div className="relative" ref={userDropdownRef}>
          <AnimatePresence>
            {dropdownOpen && (
              <motion.div
                initial={{ opacity: 0, y: -8, scale: 0.96 }}
                animate={{ opacity: 1, y: 0, scale: 1 }}
                exit={{ opacity: 0, y: -8, scale: 0.96 }}
                transition={{ duration: 0.15, ease: 'easeOut' }}
                className="absolute bottom-full left-0 right-0 mb-2 bg-white dark:bg-[#121A23] border border-slate-200 dark:border-white/[0.08] rounded-2xl overflow-hidden shadow-xl dark:shadow-black/40 z-50 select-none cursor-default"
              >
                {/* User info header */}
                <div className="flex items-center gap-3 px-4 py-3.5 border-b border-slate-200 dark:border-white/8">
                  <div className="w-9 h-9 rounded-full bg-emerald-500/15 border-2 border-emerald-500/25 flex items-center justify-center font-display font-extrabold text-[12px] text-emerald-600 dark:text-emerald-400 flex-shrink-0 uppercase">
                    {userInitials}
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-[13px] font-semibold text-slate-900 dark:text-[#F1F5F9] truncate leading-tight">
                      {profile?.full_name || 'User'}
                    </p>
                    <p className="text-[11px] text-slate-500 dark:text-[#4B6478] truncate">{user?.email}</p>
                  </div>
                  {(profile?.role || isSuperadmin) && (
                    <span className={`text-[9px] font-bold uppercase tracking-widest px-2 py-0.5 rounded-full shrink-0 ${isSuperadmin ? 'bg-amber-500/10 text-amber-600 dark:text-amber-500' :
                        isOwner(profile) ? 'bg-[#10B981]/10 text-[#10B981]' :
                          isStaff(profile) ? 'bg-blue-500/10 text-blue-500 dark:text-blue-400' :
                            'bg-slate-100 dark:bg-white/5 text-slate-500 dark:text-[#4B6478]'
                      }`}>
                      {isSuperadmin ? 'SUPERADMIN' : profile?.role?.replace('_', ' ')}
                    </span>
                  )}
                </div>

                {/* Menu items */}
                <div className="py-1.5">
                  {[
                    { icon: User, label: 'Profil Akun', onClick: () => { navigate(akunPath); setDropdownOpen(false) } },
                    { icon: Building2, label: 'Kelola Bisnis', onClick: () => { navigate('/onboarding?mode=new_business'); setDropdownOpen(false) } },
                    { icon: Bell, label: 'Notifikasi', onClick: () => { navigate(akunPath + '#notif'); setDropdownOpen(false) } },
                  ].map(({ icon: Icon, label, onClick }) => (
                    <button
                      key={label}
                      onClick={onClick}
                      className="w-full flex items-center gap-3 px-4 py-2.5 text-sm text-slate-600 dark:text-[#94A3B8] hover:text-slate-900 dark:hover:text-white hover:bg-slate-100 dark:hover:bg-white/5 cursor-pointer transition-colors border-none bg-transparent text-left"
                    >
                      <Icon size={16} className="shrink-0" />
                      <span>{label}</span>
                    </button>
                  ))}

                  {isSuperadmin && (
                    <>
                      <div className="h-px bg-slate-200 dark:bg-white/8 mx-2 my-1" />
                      <button
                        onClick={() => { handleGoToAdmin(); setDropdownOpen(false) }}
                        className="w-full flex items-center gap-3 px-4 py-2.5 text-sm text-amber-600 dark:text-amber-400 hover:bg-amber-500/5 dark:hover:bg-amber-500/10 cursor-pointer transition-colors border-none bg-transparent text-left font-bold"
                      >
                        <Shield size={16} className="shrink-0" />
                        <span>Admin Panel</span>
                      </button>
                    </>
                  )}

                  <div className="h-px bg-slate-200 dark:bg-white/8 mx-2 my-1" />

                  <button
                    onClick={() => { handleLogout(); setDropdownOpen(false) }}
                    className="w-full flex items-center gap-3 px-4 py-2.5 text-sm text-red-600 dark:text-red-400 hover:bg-red-50 dark:hover:bg-red-500/10 cursor-pointer transition-colors border-none bg-transparent text-left font-bold"
                  >
                    <LogOut size={16} className="shrink-0" />
                    <span>Keluar</span>
                  </button>
                </div>
              </motion.div>
            )}
          </AnimatePresence>

          {/* Trigger button */}
          <button
            onClick={() => setDropdownOpen(prev => !prev)}
            className="w-full flex items-center gap-2.5 rounded-xl hover:bg-slate-100 dark:hover:bg-white/[0.03] transition-colors px-3 py-2.5 select-none cursor-pointer border-none bg-transparent"
          >
            <div className="w-8 h-8 rounded-full bg-emerald-500/15 border-2 border-emerald-500/25 flex items-center justify-center font-display font-extrabold text-[12px] text-emerald-600 dark:text-emerald-400 flex-shrink-0 uppercase">
              {userInitials}
            </div>
            <div className="flex-1 min-w-0 text-left">
              <p className="text-[13px] font-semibold text-slate-900 dark:text-slate-100 truncate leading-tight">
                {profile?.full_name || 'User'}
              </p>
              <p className="text-[11px] text-muted-foreground truncate mt-0.5">
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
        <SheetContent side="left" className="p-0 border-r border-slate-200 dark:border-white/[0.08] w-[280px] flex flex-col overflow-hidden animate-in fade-in duration-200" style={{ background: 'var(--bg-1-val)' }}>
          <SheetHeader className="sr-only">
            <SheetTitle>Navigasi Sidebar</SheetTitle>
            <SheetDescription>Menu navigasi utama aplikasi TernakOS.</SheetDescription>
          </SheetHeader>
          <Sidebar collapsible="none" className="border-none bg-transparent select-none cursor-default" style={{ width: '100%', height: '100%' }}>
            <div style={{ paddingBottom: '32px', height: '100%', overflowY: 'auto', overscrollBehavior: 'contain' }}>
              {sidebarContent}
            </div>
          </Sidebar>
        </SheetContent>
      </Sheet>
    )
  }

  return (
    <Sidebar collapsible="offcanvas" className="select-none cursor-default border-r border-slate-200 dark:border-white/[0.08]" style={{ background: 'var(--bg-1-val)' }}>
      {sidebarContent}
    </Sidebar>
  )
}
