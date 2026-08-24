import React from 'react'
import { useNavigate, useSearchParams } from 'react-router-dom'
import { useAuth } from '@/lib/hooks/useAuth'
import BusinessModelOverlay from '../components/BusinessModelOverlay'
import LoadingScreen from '@/components/LoadingScreen'
import { logError } from '@/lib/logger/errorLogger'

const KEY_TO_PATH = {
  poultry_broker:      '/broker/broker_ayam/beranda',
  broker:              '/broker/broker_ayam/beranda',
  egg_broker:          '/broker/broker_telur/beranda',
  distributor_sembako: '/broker/distributor_sembako/beranda',
  sembako_broker:      '/broker/distributor_sembako/beranda',
  peternak:                              '/peternak/peternak_broiler/beranda',
  peternak_layer:                        '/peternak/peternak_layer/beranda',
  peternak_domba_penggemukan:            '/peternak/peternak_domba_penggemukan/beranda',
  peternak_domba_breeding:               '/peternak/peternak_domba_breeding/beranda',
  peternak_kambing_penggemukan:          '/peternak/peternak_kambing_penggemukan/beranda',
  peternak_kambing_breeding:             '/peternak/peternak_kambing_breeding/beranda',
  peternak_kambing_perah:                '/peternak/peternak_kambing_perah/beranda',
  peternak_kambing_domba_penggemukan:    '/peternak/peternak_domba_penggemukan/beranda',
  peternak_kambing_domba_breeding:       '/peternak/peternak_domba_breeding/beranda',
  peternak_sapi_penggemukan:             '/peternak/peternak_sapi_penggemukan/beranda',
  peternak_sapi_breeding:                '/peternak/peternak_sapi_breeding/beranda',
  rumah_potong_rpa:    '/rumah_potong/rpa/beranda',
  rumah_potong_rph:    '/rumah_potong/rph/beranda',
}

export default function OnboardingFlow() {
  const { user, profile, loading, refetchProfile } = useAuth()
  const navigate = useNavigate()
  const [searchParams] = useSearchParams()
  const isNewBusiness = searchParams.get('mode') === 'new_business'

  // Guard: once onComplete() takes control of navigation, suppress the
  // profile-change useEffect so it cannot overwrite the correct redirect.
  const redirectHandledRef = React.useRef(false)

  // Hooks MUST come before any early returns
  React.useEffect(() => {
    if (loading) return
    // If onComplete() already handled the redirect, do NOT re-fire this effect.
    if (redirectHandledRef.current) return

    // Original redirect logic only if NOT in new business mode
    if (!isNewBusiness && profile?.onboarded) {
      // Use KEY_TO_PATH with the tenant's business_vertical or sub_type so we
      // always resolve to the correct beranda, not a stale fallback.
      const vertical = profile.tenants?.business_vertical || profile.tenants?.sub_type
      const resolvedPath = (vertical && KEY_TO_PATH[vertical]) || KEY_TO_PATH[profile.user_type]

      if (resolvedPath) {
        navigate(resolvedPath, { replace: true })
        return
      }

      // Legacy fallback (should rarely be hit)
      if (profile.user_type === 'peternak') {
        navigate(`/peternak/${profile.tenants?.sub_type || 'peternak_broiler'}/beranda`, { replace: true })
        return
      }
      if (profile.user_type === 'rumah_potong') {
        navigate(`/rumah_potong/rpa/beranda`, { replace: true })
        return
      }
      navigate(`/broker/${profile.tenants?.sub_type || 'broker_ayam'}/beranda`, { replace: true })
    }
  }, [profile, loading, navigate, isNewBusiness])

  // Only show LoadingScreen if we are literally loading the session from Supabase.
  // If loading is false, even if profile is null (new user), we should render the overlay.
  if (loading) return <LoadingScreen />
  
  // If already onboarded and not in add-business mode, we should have been redirected by useEffect.
  // But as a fallback, show LoadingScreen while redirecting.
  if (!isNewBusiness && profile?.onboarded) return <LoadingScreen />

  return (
    <div className="min-h-screen bg-[#06090F]">
      <BusinessModelOverlay
        user={user}
        profile={profile}
        isNewBusiness={isNewBusiness}
        onComplete={async (selectedKey) => {
          if (!selectedKey) {
            // User cancelled / closed the overlay
            if (isNewBusiness) {
              // In add-business mode: go back to previous page
              navigate(-1)
            } else if (!profile?.onboarded) {
              // New user closed without completing — send back to welcome
              navigate('/welcome', { replace: true })
            }
            return
          }

          // Mark that we are handling the redirect — suppress the useEffect guard
          // so a profile refetch triggering profile?.onboarded=true does NOT
          // overwrite our KEY_TO_PATH-based navigation with a stale fallback.
          redirectHandledRef.current = true

          // FIX: Await refetch so context is up-to-date before navigate.
          // Without this, dashboard mounts with stale profile (pre-onboarding state).
          await refetchProfile()

          const path = KEY_TO_PATH[selectedKey]

          if (path) {
            if (isNewBusiness) {
              // New business: full reload ensures tenant context is refreshed
              window.location.href = path
            } else {
              navigate(path, { replace: true })
            }
          } else {
            // Fallback for unmapped keys — go to root and let RoleRedirector handle it
            logError({
              level: 'error',
              source: 'route_guard',
              component: 'OnboardingFlow',
              actionName: 'onboarding.redirect_failed',
              error: { message: `No KEY_TO_PATH mapping for vertical "${selectedKey}"`, code: 'unmapped_vertical' },
              metadata: {
                profile_id: profile?.id ?? null,
                auth_user_id: user?.id ?? null,
                tenant_id: profile?.tenant_id ?? null,
                selected_vertical: selectedKey || null,
                selected_business_model: selectedKey || null,
                is_first_time_onboarding: !profile?.onboarded || !profile?.business_model_selected,
                is_new_business: isNewBusiness,
              },
            })
            navigate('/', { replace: true })
          }
        }}
      />
    </div>
  )
}
