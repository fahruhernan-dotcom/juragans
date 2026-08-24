import { useEffect, useState, useRef } from 'react'
import { useNavigate, Link } from 'react-router-dom'
import { supabase } from '@/lib/supabase'
import { getBrokerBasePath, getPeternakBasePath } from '@/lib/hooks/useAuth'
import { toast } from 'sonner'
import { motion } from 'framer-motion'
import { AlertTriangle, RotateCcw, LogIn } from 'lucide-react'
import { logError } from '@/lib/logger/errorLogger'
import { logSupabaseError } from '@/lib/logger/supabaseLogger'

export default function AuthCallback() {
  const navigate = useNavigate()
  const [authError, setAuthError] = useState(null)
  const [phase, setPhase] = useState('processing') // 'processing' | 'preparing' | 'error'
  const [mounted, setMounted] = useState(false)
  const hasProcessedRef = useRef(false)

  useEffect(() => {
    // Defer state update to next tick to avoid react-hooks/set-state-in-effect warning
    Promise.resolve().then(() => {
      setMounted(true)
    })

    if (hasProcessedRef.current) return
    hasProcessedRef.current = true

    let cancelled = false

    async function handleCallback() {
      try {
        // Parse error from hash fragment (e.g. #error=access_denied&error_code=otp_expired&...)
        const hash = window.location.hash
        if (hash) {
          const params = new URLSearchParams(hash.replace('#', ''))
          const errorCode = params.get('error_code')
          const errorDesc = params.get('error_description')

          if (errorCode || params.get('error')) {
            const friendlyMessages = {
              'otp_expired': 'Link konfirmasi email sudah kadaluarsa. Silakan minta link baru.',
              'access_denied': 'Akses ditolak. Silakan coba login ulang.',
              'invalid_request': 'Permintaan tidak valid. Silakan coba lagi.',
            }

            const codeOnly = errorCode || params.get('error')
            logError({
              level: 'warning',
              source: 'auth',
              component: 'AuthCallback',
              actionName: 'auth.callback_error',
              error: { code: codeOnly, message: friendlyMessages[errorCode] || errorDesc?.replace(/\+/g, ' ') || 'callback_error' },
              metadata: { error_code: codeOnly },
            })

            if (!cancelled) {
              setPhase('error')
              setAuthError({
                code: codeOnly,
                message: friendlyMessages[errorCode] || errorDesc?.replace(/\+/g, ' ') || 'Terjadi kesalahan saat verifikasi email.',
              })
            }
            return
          }
        }

        // normal flow: get session and redirect
        const { data: { session } } = await supabase.auth.getSession()
        if (!session?.user) {
          logError({
            level: 'warning',
            source: 'auth',
            component: 'AuthCallback',
            actionName: 'auth.callback_no_session',
            error: { message: 'No session after callback', code: 'no_session' },
            metadata: {},
          })
          if (!cancelled) {
            setPhase('error')
            setAuthError({
              code: 'no_session',
              message: 'Sesi tidak ditemukan. Silakan login ulang.',
            })
          }
          return
        }

        if (cancelled) return
        setPhase('preparing')

        const { data: profiles, error: profilesErr } = await supabase
          .from('profiles')
          .select('*, tenants(sub_type, business_vertical)')
          .eq('auth_user_id', session.user.id)
        if (profilesErr) {
          logSupabaseError(profilesErr, {
            table: 'profiles',
            operation: 'select',
            component: 'AuthCallback',
            actionName: 'auth.callback_fetch_profiles',
          })
        }

        if (cancelled) return

        if (!profiles || profiles.length === 0) {
          navigate('/welcome', {
            replace: true,
            state: { fullName: session.user.user_metadata?.full_name || '' },
          })
          return
        }

        if (session.user?.app_metadata?.is_superadmin === true) {
          navigate('/admin', { replace: true })
          toast.success('Selamat datang kembali, Admin!')
          return
        }

        const profile = profiles.find(p => p.onboarded) || profiles[0]

        if (profile?.tenant_id) {
          try { localStorage.setItem('ternakos_active_tenant_id', profile.tenant_id) } catch { /* ok */ }
        }

        if (!profile.onboarded) {
          navigate('/welcome', {
            replace: true,
            state: { fullName: profile.full_name || session.user.user_metadata?.full_name || '' },
          })
          return
        }

        if (profile.user_type === 'peternak') {
          navigate(getPeternakBasePath(profile.tenants, profile) + '/beranda', { replace: true })
          toast.success('Selamat datang kembali!')
          return
        }

        if (profile.user_type === 'rumah_potong') {
          navigate(getPeternakBasePath(profile.tenants, profile) + '/beranda', { replace: true })
          toast.success('Selamat datang kembali!')
          return
        }

        navigate(getBrokerBasePath(profile.tenants, profile) + '/beranda', { replace: true })
        toast.success('Selamat datang kembali!')
      } catch (err) {
        logError({
          level: 'error',
          source: 'auth',
          component: 'AuthCallback',
          actionName: 'auth.callback_unexpected',
          error: err,
          metadata: {},
        })
        if (!cancelled) {
          setPhase('error')
          setAuthError({
            code: 'callback_failure',
            message: 'Tidak bisa memproses login. Periksa koneksi dan coba lagi.',
          })
        }
      }
    }

    handleCallback()

    return () => {
      cancelled = true
    }
  }, [navigate])

  // Return static loading shell on first client render and SSR
  if (!mounted) {
    return (
      <div style={{
        minHeight: '100vh',
        background: '#06090F',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        padding: 24,
      }}>
        <div style={{ textAlign: 'center', maxWidth: 360 }}>
          <div style={{
            width: 56,
            height: 56,
            margin: '0 auto 20px',
            borderRadius: 16,
            border: '2px solid rgba(34,197,94,0.25)',
            borderTopColor: '#22C55E',
            animation: 'authcb-spin 0.8s linear infinite',
          }} />
          <style>{`@keyframes authcb-spin { to { transform: rotate(360deg); } }`}</style>
          <h1 style={{
            fontFamily: 'Sora, sans-serif',
            fontSize: 18,
            fontWeight: 800,
            color: '#F1F5F9',
            margin: 0,
            marginBottom: 8,
          }}>
            Memproses login…
          </h1>
          <p style={{
            fontSize: 13,
            color: '#94A3B8',
            margin: 0,
          }}>
            Mohon tunggu sebentar…
          </p>
        </div>
      </div>
    )
  }

  // Show error UI for expired/invalid links
  if (authError) {
    return (
      <div className="min-h-screen bg-[#06090F] flex items-center justify-center px-6">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5 }}
          className="w-full max-w-md text-center"
        >
          {/* Error Icon */}
          <div className="mx-auto w-20 h-20 rounded-3xl bg-red-500/10 border border-red-500/20 flex items-center justify-center mb-8">
            <AlertTriangle size={36} className="text-red-500" />
          </div>

          {/* Error Title */}
          <h1 className="font-display text-2xl font-black text-white uppercase tracking-tight mb-3">
            Link Tidak Valid
          </h1>

          {/* Error Message */}
          <p className="text-[#94A3B8] font-medium text-sm leading-relaxed mb-8 max-w-sm mx-auto">
            {authError.message}
          </p>

          {/* Error Code Badge */}
          <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-red-500/5 border border-red-500/10 mb-10">
            <span className="text-[10px] font-black text-red-400 uppercase tracking-widest">
              Error: {authError.code}
            </span>
          </div>

          {/* Action Buttons */}
          <div className="space-y-3">
            {authError.code === 'otp_expired' && (
              <Link 
                to="/forgot-password" 
                className="flex items-center justify-center gap-3 w-full h-14 bg-[#22C55E] hover:bg-[#16A34A] text-white font-black text-[11px] uppercase tracking-[0.2em] rounded-2xl transition-all active:scale-95"
              >
                <RotateCcw size={16} strokeWidth={2.5} />
                Minta Link Baru
              </Link>
            )}

            <Link 
              to="/login" 
              className="flex items-center justify-center gap-3 w-full h-14 bg-white/5 hover:bg-white/10 border border-white/10 text-white font-black text-[11px] uppercase tracking-[0.2em] rounded-2xl transition-all active:scale-95"
            >
              <LogIn size={16} strokeWidth={2.5} />
              Kembali ke Login
            </Link>
          </div>

          {/* Footer */}
          <p className="text-[10px] text-[#4B6478] font-bold uppercase tracking-widest mt-12">
            TernakOS • Verifikasi Email
          </p>
        </motion.div>
      </div>
    )
  }

  // Default processing/preparing UI — explicit visible state so the page never
  // appears blank even if LoadingScreen / framer-motion path breaks.
  const message = phase === 'preparing' ? 'Menyiapkan akun…' : 'Memproses login…'
  return (
    <div style={{
      minHeight: '100vh',
      background: '#06090F',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      padding: 24,
    }}>
      <div style={{ textAlign: 'center', maxWidth: 360 }}>
        <div style={{
          width: 56,
          height: 56,
          margin: '0 auto 20px',
          borderRadius: 16,
          border: '2px solid rgba(34,197,94,0.25)',
          borderTopColor: '#22C55E',
          animation: 'authcb-spin 0.8s linear infinite',
        }} />
        <style>{`@keyframes authcb-spin { to { transform: rotate(360deg); } }`}</style>
        <h1 style={{
          fontFamily: 'Sora, sans-serif',
          fontSize: 18,
          fontWeight: 800,
          color: '#F1F5F9',
          margin: 0,
          marginBottom: 8,
        }}>
          {message}
        </h1>
        <p style={{
          fontSize: 13,
          color: '#94A3B8',
          margin: 0,
        }}>
          Mohon tunggu sebentar…
        </p>
      </div>
    </div>
  )
}
