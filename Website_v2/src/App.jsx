import React, { useEffect, Suspense } from 'react'
import { Routes, Route, Navigate, useLocation, useNavigate } from 'react-router-dom'
import { QueryClientProvider } from '@tanstack/react-query'
import { Toaster } from 'sonner'
import { queryClient } from './lib/queryClient'
import { TooltipProvider } from './components/ui/tooltip'
import { AuthProvider, useAuth } from './lib/hooks/useAuth'
import { LanguageProvider } from './lib/i18n/LanguageProvider'
import LoadingScreen from './components/LoadingScreen'
import ErrorBoundary from './components/ErrorBoundary'
import { SidebarProvider } from '@/components/ui/sidebar'
import AppSidebar from './dashboard/_shared/components/AppSidebar'
import DesktopSidebarLayout from './dashboard/_shared/layouts/DesktopSidebarLayout'
import BottomNav from './dashboard/_shared/components/BottomNav'
import SuperadminLayout from './dashboard/_shared/layouts/SuperadminLayout'
import { useMediaQuery } from './lib/hooks/useMediaQuery'
import { useForceDarkMode } from './lib/hooks/useForceDarkMode'
import { getSubscriptionStatus } from './lib/subscriptionUtils'
import LockedServerPage from './pages/LockedServerPage'
import LicenseBanner from './components/license/LicenseBanner'
import { initPushNotifications } from './lib/services/pushNotificationService'
import { useCapacitorBackNavigation } from './lib/hooks/useCapacitorBackNavigation'

const SuperadminDashboard = React.lazy(() => import('./dashboard/superadmin/SuperadminDashboardPage'))

// Landing & Company Profile pages
const LandingPage  = React.lazy(() => import('./landing/LandingPage'))
const AboutUsPage  = React.lazy(() => import('./landing/pages/AboutUs'))
const BioLinksPage = React.lazy(() => import('./landing/pages/BioLinks'))

// Auth pages — kecil, tetap static (tidak ada manfaat lazy)
import Login from './pages/Login'
import Register from './pages/Register'
import ForgotPassword from './pages/ForgotPassword'
import ResetPassword from './pages/ResetPassword'

// ─── Module Importers dengan Background Prefetching ─────────────────────────────
const pageImporters = {
  beranda:          () => import('./dashboard/broker/sembako_broker/Beranda'),
  penjualan:        () => import('./dashboard/broker/sembako_broker/Penjualan'),
  produk:           () => import('./dashboard/broker/sembako_broker/Produk'),
  gudang:           () => import('./dashboard/broker/sembako_broker/Gudang'),
  tokoSupplier:     () => import('./dashboard/broker/sembako_broker/TokoSupplier'),
  tokoSupplierDetail: () => import('./dashboard/broker/sembako_broker/TokoSupplierDetail'),
  retur:            () => import('./dashboard/broker/sembako_broker/Retur'),
  laporan:          () => import('./dashboard/broker/sembako_broker/Laporan'),
  tim:              () => import('./dashboard/broker/sembako_broker/TimManajemenPage'),
  akun:             () => import('./dashboard/_shared/pages/Akun'),
  kelolaAkun:       () => import('./dashboard/broker/sembako_broker/DevAdminHubPage'),
  b2bOutreach:      () => import('./dashboard/broker/sembako_broker/B2BLeadsOutreachPage'),
}

// Prefetch modul halaman secara bertahap (staggered) di background saat sistem benar-benar idle
export function prefetchAppModules() {
  if (typeof window === 'undefined') return
  const importFns = Object.values(pageImporters)
  let idx = 0

  const prefetchNext = () => {
    if (idx >= importFns.length) return
    const fn = importFns[idx++]
    try {
      fn()
    } catch {
      /* silent cache preload fallback */
    }
    // Stagger loading each module by 800ms to preserve mobile memory and CPU
    if ('requestIdleCallback' in window) {
      window.requestIdleCallback(prefetchNext, { timeout: 2000 })
    } else {
      setTimeout(prefetchNext, 800)
    }
  }

  // Mulai prefetch 3 detik setelah dashboard utama stabil dimuat
  setTimeout(() => {
    if ('requestIdleCallback' in window) {
      window.requestIdleCallback(prefetchNext, { timeout: 4000 })
    } else {
      setTimeout(prefetchNext, 1200)
    }
  }, 3000)
}

const SembakoBeranda          = React.lazy(pageImporters.beranda)
const SembakoPenjualan        = React.lazy(pageImporters.penjualan)
const SembakoProduk           = React.lazy(pageImporters.produk)
const SembakoGudang           = React.lazy(pageImporters.gudang)
const SembakoTokoSupplier     = React.lazy(pageImporters.tokoSupplier)
const SembakoTokoSupplierDetail = React.lazy(pageImporters.tokoSupplierDetail)
const SembakoRetur            = React.lazy(pageImporters.retur)
const SembakoLaporan          = React.lazy(pageImporters.laporan)
const SembakoTimManajemenPage = React.lazy(pageImporters.tim)
const SembakoAkun             = React.lazy(pageImporters.akun)
const SembakoDevAdminHub      = React.lazy(pageImporters.kelolaAkun)
const SembakoB2BLeadsOutreach = React.lazy(pageImporters.b2bOutreach)

// ─── Fase 2: Single source of truth untuk semua route ───────────────────────
// Format: [slug, element]
// Setiap entry otomatis generate 2 route: /slug DAN /broker/:type/slug
// Tambah halaman baru = tambah 1 baris di sini
const SEMBAKO_ROUTES = [
  ['beranda',                 <SembakoBeranda />],
  ['penjualan',               <SembakoPenjualan />],
  ['pos',                     <SembakoPenjualan />],
  ['produk',                  <SembakoProduk />],
  ['inventori',               <SembakoProduk />],
  ['gudang',                  <SembakoGudang />],
  ['toko-supplier',           <SembakoTokoSupplier />],
  ['toko-supplier/:type/:id', <SembakoTokoSupplierDetail />],
  ['retur',                   <SembakoRetur />],
  ['laporan',                 <SembakoLaporan />],
  ['b2b-outreach',            <SembakoB2BLeadsOutreach />],
  ['b2b-leads',               <SembakoB2BLeadsOutreach />],
  ['tim',                     <SembakoTimManajemenPage />],
  ['pegawai',                 <SembakoTimManajemenPage />],
  ['karyawan',                <SembakoTimManajemenPage />],
  ['akun',                    <SembakoAkun />],
  ['kelola-akun',             <SembakoDevAdminHub />],
  ['dev-admin',               <SembakoDevAdminHub />],
]

// Scroll to top on route change
const ScrollToTop = () => {
  const { pathname } = useLocation()
  useEffect(() => { window.scrollTo(0, 0) }, [pathname])
  return null
}

import { isDevUser } from '@/lib/auth/business-roles'

function ProtectedRoute({ children }) {
  const { loading, user, tenant, profile } = useAuth()
  if (loading) return <LoadingScreen />
  if (!user) return <Navigate to="/login" replace />

  const sub = getSubscriptionStatus(tenant)
  const isLocked = sub.isLocked || sub.status === 'expired'
  // Logic Dev: Akun dev tidak boleh pernah terkunci sama sekali
  const isDev = profile?.role === 'dev' || profile?.app_role === 'dev' || isDevUser(profile)

  if (isLocked && !isDev) {
    return <LockedServerPage />
  }

  return children
}

function SembakoLayout({ children }) {
  useForceDarkMode(true)
  const isDesktop = useMediaQuery('(min-width: 1024px)')
  const [sidebarOpen, setSidebarOpen] = React.useState(false)

  React.useEffect(() => {
    prefetchAppModules()
    const openHandler = () => setSidebarOpen(true)
    const toggleHandler = () => setSidebarOpen(prev => !prev)
    window.addEventListener('open-mobile-sidebar', openHandler)
    window.addEventListener('toggleMobileSidebar', toggleHandler)
    return () => {
      window.removeEventListener('open-mobile-sidebar', openHandler)
      window.removeEventListener('toggleMobileSidebar', toggleHandler)
    }
  }, [])

  if (isDesktop) {
    return (
      <DesktopSidebarLayout>
        {children}
        <LicenseBanner />
      </DesktopSidebarLayout>
    )
  }

  return (
    <div className="bg-background min-h-screen w-full max-w-3xl mx-auto relative pb-[120px] shadow-2xl overflow-x-hidden">
      <SidebarProvider className="!min-h-0 !h-0 !w-0 !p-0 hidden">
        <AppSidebar open={sidebarOpen} onClose={() => setSidebarOpen(false)} />
      </SidebarProvider>
      {children}
      <BottomNav />
      <LicenseBanner />
    </div>
  )
}

function AppContentLayout() {
  const location = useLocation()
  const navigate = useNavigate()
  const { user, tenant } = useAuth()

  // Global Android Back Button & Navigation Gesture Manager
  useCapacitorBackNavigation()

  useEffect(() => {
    if (!user?.id || !tenant?.id) return

    // Tunda 1.5 detik agar inisialisasi awal dashboard & Supabase query selesai terlebih dahulu
    const timer = setTimeout(() => {
      initPushNotifications({
        tenantId: tenant.id,
        userId: user.id,
        onNavigate: (route) => navigate(route),
      }).catch((err) => {
        console.warn('[App] Push notification init warning (handled):', err)
      })
    }, 1500)

    return () => clearTimeout(timer)
  }, [user?.id, tenant?.id, navigate])

  return (
    <ErrorBoundary>
      <Suspense fallback={<LoadingScreen />}>
        <Routes>
          {/* ── Public Landing & Company Profile Routes ── */}
          <Route path="/" element={<LandingPage />} />
          <Route path="/about-us" element={<AboutUsPage />} />
          <Route path="/links" element={<BioLinksPage />} />
          <Route path="/bio" element={<BioLinksPage />} />
          <Route path="/linktree" element={<BioLinksPage />} />

          {/* ── Public Auth Routes ── */}
          <Route path="/login" element={<Login />} />
          <Route path="/register" element={<Register />} />
          <Route path="/forgot-password" element={<ForgotPassword />} />
          <Route path="/reset-password" element={<ResetPassword />} />

          {/* ── Protected Superadmin Routes ── */}
          <Route
            path="/admin/*"
            element={
              <ProtectedRoute>
                <SuperadminLayout />
              </ProtectedRoute>
            }
          >
            <Route path="dashboard" element={<SuperadminDashboard />} />
            <Route path="*" element={<Navigate to="/admin/dashboard" replace />} />
          </Route>

          {/* ── Protected Dashboard / Juragan ERP Routes ── */}
          <Route
            path="/*"
            element={
              <ProtectedRoute>
                <SembakoLayout>
                  <Routes>
                    <Route path="/beranda" element={<SembakoBeranda />} />

                    {/* Fase 2: Generate route langsung + broker-prefix dari satu array */}
                    {SEMBAKO_ROUTES.flatMap(([slug, element]) => [
                      <Route key={slug}        path={`/${slug}`}                     element={element} />,
                      <Route key={`b-${slug}`} path={`/broker/:brokerType/${slug}`}  element={element} />,
                    ])}

                    <Route path="*" element={<Navigate to="/beranda" replace />} />
                  </Routes>
                </SembakoLayout>
              </ProtectedRoute>
            }
          />
        </Routes>
      </Suspense>
    </ErrorBoundary>
  )
}

export default function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <LanguageProvider>
        <AuthProvider>
          <TooltipProvider>
            <ScrollToTop />
            <AppContentLayout />
          </TooltipProvider>

          <Toaster
            theme="dark"
            position="top-center"
            richColors
            expand={false}
            duration={3000}
            toastOptions={{
              style: {
                background: '#111C24',
                border: '1px solid rgba(255,255,255,0.10)',
                color: '#F1F5F9',
                fontFamily: 'DM Sans',
                fontSize: '14px',
                borderRadius: '12px',
                padding: '14px 16px',
                boxShadow: '0 8px 32px rgba(0,0,0,0.4)',
              },
            }}
          />
        </AuthProvider>
      </LanguageProvider>
    </QueryClientProvider>
  )
}

