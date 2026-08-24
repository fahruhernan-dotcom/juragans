/**
 * ScanRedirect — /scan?animalId=<uuid>
 *
 * Entry point when QR name tag is scanned by any scanner app (not just TernakOS).
 * - If not logged in → redirect to /login?next=/scan?animalId=<uuid>
 * - If logged in → redirect to the correct peternak ternak page
 *   based on the user's sub_type, passing ?batch=all&animalId=<uuid>
 *
 * This page is intentionally minimal — no Supabase query, no animal validation.
 * Validation happens in PenggemukanTernak.jsx after navigation.
 */
import { useEffect } from 'react'
import { useNavigate, useLocation } from 'react-router-dom'
import { useAuth } from '@/lib/hooks/useAuth'
import LoadingScreen from '@/components/LoadingScreen'

// UUID v4 strict check — same pattern as QRScannerModal
const UUID_REGEX = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i

export default function ScanRedirect() {
  const { user, profile, loading } = useAuth()
  const navigate = useNavigate()
  const location = useLocation()

  useEffect(() => {
    if (loading) return

    const params = new URLSearchParams(location.search)
    const animalId = params.get('animalId')

    // Invalid or missing animalId → go home
    if (!animalId || !UUID_REGEX.test(animalId)) {
      navigate('/', { replace: true })
      return
    }

    // Not logged in → redirect to login, preserve scan URL so user returns after auth
    if (!user || !profile) {
      const returnTo = encodeURIComponent(`/scan?animalId=${animalId}`)
      navigate(`/login?next=${returnTo}`, { replace: true })
      return
    }

    // Logged in — build destination based on user's sub_type
    const subType = profile.sub_type

    // Only peternak types with a /ternak page are valid scan targets
    const TERNAK_SUB_TYPES = new Set([
      'peternak_domba_penggemukan',
      'peternak_kambing_penggemukan',
      'peternak_sapi_penggemukan',
      'peternak_domba_breeding',
      'peternak_kambing_breeding',
      'peternak_sapi_breeding',
      'peternak_kambing_perah',
    ])

    if (!TERNAK_SUB_TYPES.has(subType)) {
      // User type doesn't have an animal detail page — go to their beranda
      navigate(`/peternak/${subType}/beranda`, { replace: true })
      return
    }

    // Navigate to ternak page — PenggemukanTernak.jsx will open the detail sheet
    navigate(
      `/peternak/${subType}/ternak?batch=all&animalId=${animalId}`,
      { replace: true }
    )
  }, [loading, user, profile, location.search, navigate])

  // Show loading screen while auth resolves
  return <LoadingScreen />
}
