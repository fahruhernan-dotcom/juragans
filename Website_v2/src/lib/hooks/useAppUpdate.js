import { useState, useCallback, useEffect } from 'react'
import { useQuery } from '@tanstack/react-query'
import { toast } from 'sonner'
import { supabase } from '@/lib/supabase'
import { openBrowserUrl } from '@/lib/capacitor'
import { APP_VERSION, APP_BUILD_NUMBER, APP_VERSION_LABEL } from '@/dashboard/_shared/pages/akun_page/constants'

/**
 * useAppUpdate Hook
 * Manages checking for newer APK releases, comparing local build number against
 * the Supabase app_releases table, and opening the update modal or direct download.
 */
export function useAppUpdate() {
  const [isModalOpen, setIsModalOpen] = useState(false)
  const [isCheckingManual, setIsCheckingManual] = useState(false)

  // Fetch the latest release from Supabase
  const { data: latestRelease, isLoading, refetch } = useQuery({
    queryKey: ['app_latest_release'],
    queryFn: async () => {
      try {
        const { data, error } = await supabase
          .from('app_releases')
          .select('*')
          .order('build_number', { ascending: false })
          .limit(1)
          .maybeSingle()

        if (error) {
          // Table might not exist yet or connection error, safely fallback
          console.warn('[useAppUpdate] Supabase query error:', error.message)
          return null
        }
        return data
      } catch (err) {
        console.warn('[useAppUpdate] Release check failed:', err)
        return null
      }
    },
    staleTime: 1000 * 60 * 15, // 15 minutes
    refetchOnWindowFocus: false,
  })

  // Compare build numbers
  const hasUpdate = Boolean(
    latestRelease &&
    Number(latestRelease.build_number) > Number(APP_BUILD_NUMBER)
  )

  const isMandatory = Boolean(
    latestRelease?.is_mandatory ||
    (latestRelease?.min_supported_build && Number(APP_BUILD_NUMBER) < Number(latestRelease.min_supported_build))
  )

  // Auto-notify user on startup if a new release is available
  useEffect(() => {
    if (!latestRelease || !hasUpdate) return
    const dismissedKey = `app_update_notif_seen_${latestRelease.build_number}`
    if (sessionStorage.getItem(dismissedKey)) return

    if (isMandatory) {
      setIsModalOpen(true)
    } else {
      toast(`🚀 Versi Baru ${latestRelease.version} Tersedia!`, {
        description: 'Telah hadir fitur & perbaikan sistem terbaru.',
        duration: 9000,
        action: {
          label: 'Lihat Update',
          onClick: () => setIsModalOpen(true),
        },
      })
      sessionStorage.setItem(dismissedKey, '1')
    }
  }, [hasUpdate, latestRelease, isMandatory])

  /**
   * Manual or automatic update check trigger
   * @param {boolean} manual - If true, shows feedback toasts even when up to date
   */
  const checkForUpdate = useCallback(async (manual = false) => {
    if (manual) {
      setIsCheckingManual(true)
      const toastId = toast.loading('Memeriksa pembaruan aplikasi...')
      try {
        const { data } = await refetch()
        setIsCheckingManual(false)
        toast.dismiss(toastId)

        if (data && Number(data.build_number) > Number(APP_BUILD_NUMBER)) {
          setIsModalOpen(true)
        } else {
          toast.success(`Aplikasi sudah versi terbaru (${APP_VERSION}) 🎉`, {
            duration: 3500,
          })
        }
      } catch {
        setIsCheckingManual(false)
        toast.dismiss(toastId)
        toast.error('Gagal memeriksa pembaruan. Silakan periksa koneksi internet Anda.')
      }
    } else {
      // Automatic background check
      if (hasUpdate) {
        setIsModalOpen(true)
      }
    }
  }, [refetch, hasUpdate])

  /**
   * Open direct APK download URL
   */
  const startDownload = useCallback(async (targetUrl) => {
    const url = targetUrl || latestRelease?.apk_download_url
    if (!url) {
      toast.error('URL unduhan APK tidak ditemukan.')
      return
    }

    toast.success('Mulai mengunduh file pembaruan APK...', { duration: 4000 })
    try {
      await openBrowserUrl(url, true)
    } catch (err) {
      console.warn('[useAppUpdate] Browser open error:', err)
      window.open(url, '_system')
    }
  }, [latestRelease])

  return {
    currentVersion: APP_VERSION,
    currentBuildNumber: APP_BUILD_NUMBER,
    currentVersionLabel: APP_VERSION_LABEL,
    latestRelease,
    hasUpdate,
    isMandatory,
    isLoading: isLoading || isCheckingManual,
    isModalOpen,
    setIsModalOpen,
    checkForUpdate,
    startDownload,
  }
}
