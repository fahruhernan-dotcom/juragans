import { useEffect, useRef } from 'react'
import { useLocation, useNavigate } from 'react-router-dom'
import { App as CapacitorApp } from '@capacitor/app'
import { toast } from 'sonner'
import { dismissTopmostModal, hasActiveModal } from './useBackHandler'

/**
 * Root hook to handle Android hardware back button and navigation gestures via Capacitor.
 *
 * Priority flow:
 * 1. Close open modal/sheet/drawer/sidebar if any exists (LIFO stack).
 * 2. Navigate back to previous screen (navigate(-1) or fallback to /beranda).
 * 3. If on root screen (/beranda, /, /login), require double-tap within 2s to exit app.
 */
export function useCapacitorBackNavigation() {
  const location = useLocation()
  const navigate = useNavigate()
  const lastBackPressTimeRef = useRef(0)

  // Keep latest location and navigate in refs to avoid re-binding listener on every navigation
  const locationRef = useRef(location)
  const navigateRef = useRef(navigate)

  useEffect(() => {
    locationRef.current = location
  }, [location])

  useEffect(() => {
    navigateRef.current = navigate
  }, [navigate])

  useEffect(() => {
    let removeListener = null

    const setupListener = async () => {
      try {
        const handler = await CapacitorApp.addListener('backButton', (data) => {
          // ── Prioritas 1: Tutup Modal / Sheet / Drawer jika ada yang aktif ──
          if (hasActiveModal()) {
            const closed = dismissTopmostModal()
            if (closed) return
          }

          const currentPath = locationRef.current.pathname.toLowerCase()

          // Cek apakah saat ini berada di halaman utama (Root / Home / Login)
          const isRootPage =
            currentPath === '/' ||
            currentPath === '/beranda' ||
            currentPath.endsWith('/beranda') ||
            currentPath === '/login'

          // ── Prioritas 2: Navigasi Mundur (Jika berada di sub-halaman) ──
          if (!isRootPage) {
            // Cek apakah ada history navigation
            if (window.history.length > 1) {
              navigateRef.current(-1)
            } else {
              navigateRef.current('/beranda')
            }
            return
          }

          // ── Prioritas 3: Double Tap to Exit (Jika di halaman utama) ──
          const now = Date.now()
          if (now - lastBackPressTimeRef.current < 2000) {
            // Pengguna menekan tombol back 2x dalam 2 detik
            CapacitorApp.exitApp()
          } else {
            lastBackPressTimeRef.current = now
            toast.info('Tekan sekali lagi untuk keluar aplikasi', {
              duration: 2000,
              id: 'capacitor-back-exit-toast',
            })
          }
        })

        removeListener = () => {
          if (handler?.remove) {
            handler.remove()
          }
        }
      } catch (err) {
        console.warn('[useCapacitorBackNavigation] Listener setup warning:', err)
      }
    }

    setupListener()

    return () => {
      if (removeListener) {
        removeListener()
      }
    }
  }, [])
}
