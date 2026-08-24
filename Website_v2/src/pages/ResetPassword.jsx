import React, { useState, useEffect } from 'react'
import { useNavigate, Link } from 'react-router-dom'
import { supabase } from '@/lib/supabase'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Lock, Eye, EyeOff, Loader2, CheckCircle2, AlertCircle, ArrowLeft } from 'lucide-react'
import { motion } from 'framer-motion'
import { toast } from 'sonner'
import Particles from '@/components/reactbits/Particles'
import { logError } from '@/lib/logger/errorLogger'

export default function ResetPassword() {
  const navigate = useNavigate()
  const [password, setPassword] = useState('')
  const [confirmPassword, setConfirmPassword] = useState('')
  const [showPassword, setShowPassword] = useState(false)
  const [isLoading, setIsLoading] = useState(false)
  const [success, setSuccess] = useState(false)
  const [error, setError] = useState('')
  const [sessionReady, setSessionReady] = useState(false)
  const [sessionError, setSessionError] = useState(false)

  // Supabase akan otomatis menangkap token dari URL hash saat redirect
  useEffect(() => {
    const { data: { subscription } } = supabase.auth.onAuthStateChange((event) => {
      if (event === 'PASSWORD_RECOVERY') {
        setSessionReady(true)
      }
    })

    // Juga cek apakah sudah ada session aktif (kalau user sudah login)
    supabase.auth.getSession().then(({ data: { session } }) => {
      if (session) {
        setSessionReady(true)
      } else {
        // Tunggu sebentar untuk event PASSWORD_RECOVERY
        setTimeout(() => {
          setSessionReady(prev => {
            if (!prev) setSessionError(true)
            return prev
          })
        }, 3000)
      }
    })

    return () => subscription.unsubscribe()
  }, [])

  const handleSubmit = async (e) => {
    e.preventDefault()

    if (password.length < 8) {
      setError('Password minimal 8 karakter')
      return
    }

    if (password !== confirmPassword) {
      setError('Konfirmasi password tidak cocok')
      return
    }

    setIsLoading(true)
    setError('')

    try {
      const { error } = await supabase.auth.updateUser({
        password: password
      })

      if (error) throw error

      setSuccess(true)
      toast.success('Password berhasil diubah!')

      // Redirect ke login setelah 3 detik
      setTimeout(() => {
        navigate('/login', { replace: true })
      }, 3000)
    } catch (err) {
      logError({
        level: 'error',
        source: 'auth',
        component: 'ResetPassword',
        actionName: 'auth.password.reset_submit',
        error: err,
        metadata: {}
      });
      if (err.message?.includes('same password')) {
        setError('Password baru tidak boleh sama dengan password lama.')
      } else {
        setError(err.message || 'Gagal mengubah password. Coba lagi.')
      }
    } finally {
      setIsLoading(false)
    }
  }

  // Password strength indicator
  const getStrength = () => {
    if (!password) return { level: 0, label: '', color: '' }
    if (password.length < 8) return { level: 1, label: 'Lemah', color: '#F87171' }
    const hasUpper = /[A-Z]/.test(password)
    const hasNumber = /[0-9]/.test(password)
    const hasSpecial = /[^A-Za-z0-9]/.test(password)
    const score = [hasUpper, hasNumber, hasSpecial, password.length >= 12].filter(Boolean).length
    if (score <= 1) return { level: 2, label: 'Sedang', color: '#FBBF24' }
    if (score <= 2) return { level: 3, label: 'Kuat', color: '#021a02' }
    return { level: 4, label: 'Sangat Kuat', color: '#021a02' }
  }

  const strength = getStrength()

  return (
    <div className="flex items-center justify-center min-h-screen bg-[#06090F] px-5 py-10 relative overflow-hidden">
      <Particles
        quantity={25}
        color="#021a02"
        opacity={0.08}
        className="absolute inset-0 pointer-events-none"
      />

      <div style={{
        position: 'absolute',
        top: '20%', left: '50%',
        transform: 'translateX(-50%)',
        width: 500, height: 500,
        borderRadius: '50%',
        background: 'radial-gradient(circle, rgba(2, 26, 2,0.06) 0%, transparent 70%)',
        pointerEvents: 'none'
      }} />

      <motion.div
        initial={{ opacity: 0, y: 24 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.45, ease: [0.25, 0.46, 0.45, 0.94] }}
        className="w-full max-w-[420px] relative z-10"
      >
        {/* Logo */}
        <Link to="/" className="flex items-center justify-center gap-2 mb-10 group">
          <img
            src="/logo.png"
            alt="TernakOS"
            style={{ width: 32, height: 32, borderRadius: '9px', objectFit: 'cover' }}
            className="group-hover:scale-105 transition-transform"
          />
          <span style={{
            fontFamily: 'Sora', fontSize: '19px', fontWeight: 800,
            letterSpacing: '-0.3px'
          }} className="text-[#F1F5F9]">
            TernakOS
          </span>
        </Link>

        <div className="bg-[#0C1319] border border-white/8 rounded-2xl p-8">
          {sessionError && !sessionReady ? (
            /* INVALID / EXPIRED LINK */
            <div className="text-center py-4">
              <div className="w-14 h-14 bg-red-500/10 border border-red-500/20 rounded-full flex items-center justify-center mx-auto mb-5">
                <AlertCircle size={28} className="text-red-400" />
              </div>
              <h2 className="text-lg font-bold font-display text-[#F1F5F9] mb-2 tracking-tight">
                Link Tidak Valid
              </h2>
              <p className="text-[13px] text-[#4B6478] leading-relaxed font-medium mb-6">
                Link reset password sudah kadaluarsa atau tidak valid. Silakan minta link baru.
              </p>
              <Button
                onClick={() => navigate('/forgot-password')}
                style={{
                  width: '100%', height: '44px',
                  border: 'none', borderRadius: '10px',
                  color: 'white', fontFamily: 'Sora', fontSize: '14px', fontWeight: 700,
                }}
                className="bg-emerald-500 hover:bg-emerald-600 transition-colors shadow-[0_4px_20px_rgba(12,61,12,0.2)] dark:shadow-[0_4px_20px_rgba(140,184,140,0.15)]"
              >
                Minta Link Baru
              </Button>
            </div>
          ) : success ? (
            /* SUCCESS STATE */
            <div className="text-center py-4">
              <div className="w-14 h-14 bg-emerald-500/10 border border-emerald-500/20 rounded-full flex items-center justify-center mx-auto mb-5">
                <CheckCircle2 size={28} className="text-emerald-500" />
              </div>
              <h2 className="text-lg font-bold font-display text-[#F1F5F9] mb-2 tracking-tight">
                Password Diubah!
              </h2>
              <p className="text-[13px] text-[#4B6478] leading-relaxed font-medium">
                Password berhasil diperbarui. Kamu akan diarahkan ke halaman login...
              </p>
              <div className="mt-5">
                <Loader2 size={20} className="animate-spin text-[#021a02] mx-auto" />
              </div>
            </div>
          ) : (
            /* FORM */
            <>
              <div className="w-12 h-12 bg-emerald-500/10 border border-emerald-500/20 rounded-xl flex items-center justify-center mx-auto mb-5">
                <Lock size={22} className="text-emerald-500" />
              </div>

              <h1 className="text-xl font-bold font-display text-[#F1F5F9] text-center mb-1.5 tracking-tight">
                Buat Password Baru
              </h1>
              <p className="text-[13px] text-[#4B6478] text-center mb-7 leading-relaxed font-medium">
                Masukkan password baru untuk akunmu. Minimal 8 karakter.
              </p>

              {!sessionReady && (
                <div className="flex items-center justify-center gap-2 mb-6 text-[13px] text-[#4B6478]">
                  <Loader2 size={14} className="animate-spin" />
                  Memverifikasi link...
                </div>
              )}

              <form onSubmit={handleSubmit} className="space-y-4">
                {/* New Password */}
                <div className="space-y-1.5">
                  <Label htmlFor="password" style={{
                    fontSize: '13px', fontWeight: 500,
                    marginLeft: '4px', display: 'block'
                  }} className="text-[#94A3B8]">
                    Password Baru
                  </Label>
                  <div className="relative">
                    <Input
                      id="password"
                      type={showPassword ? 'text' : 'password'}
                      placeholder="Minimal 8 karakter"
                      value={password}
                      onChange={e => setPassword(e.target.value)}
                      disabled={!sessionReady}
                    style={{
                      borderRadius: '10px',
                      padding: '10px 44px 10px 14px',
                      fontSize: '15px',
                      height: '42px',
                      width: '100%'
                    }}
                    className="bg-[#111C24] border border-white/10 text-[#F1F5F9] focus:border-emerald-500/50 focus:ring-1 focus:ring-emerald-500/20"
                    />
                    <button
                      type="button"
                      onClick={() => setShowPassword(!showPassword)}
                    style={{
                        position: 'absolute', right: '14px', top: '50%',
                        transform: 'translateY(-50%)', background: 'none',
                        border: 'none', cursor: 'pointer',
                        display: 'flex', alignItems: 'center', padding: 0
                      }}
                      className="text-[#4B6478]"
                    >
                      {showPassword ? <EyeOff size={16} /> : <Eye size={16} />}
                    </button>
                  </div>

                  {/* Strength Bar */}
                  {password && (
                    <div className="flex items-center gap-2 mt-2 px-1">
                      <div className="flex gap-1 flex-1">
                        {[1, 2, 3, 4].map(i => (
                          <div
                            key={i}
                            style={{
                              height: '3px',
                              flex: 1,
                              borderRadius: '2px',
                              background: i <= strength.level ? strength.color : 'rgba(120,120,120,0.15)',
                              transition: 'background 0.3s'
                            }}
                          />
                        ))}
                      </div>
                      <span style={{ fontSize: '11px', color: strength.color, fontWeight: 600 }}>
                        {strength.label}
                      </span>
                    </div>
                  )}
                </div>

                {/* Confirm Password */}
                <div className="space-y-1.5">
                  <Label htmlFor="confirmPassword" style={{
                    fontSize: '13px', fontWeight: 500,
                    marginLeft: '4px', display: 'block'
                  }} className="text-[#94A3B8]">
                    Konfirmasi Password
                  </Label>
                  <Input
                    id="confirmPassword"
                    type={showPassword ? 'text' : 'password'}
                    placeholder="Ketik ulang password baru"
                    value={confirmPassword}
                    onChange={e => setConfirmPassword(e.target.value)}
                    disabled={!sessionReady}
                    style={{
                      borderRadius: '10px',
                      padding: '10px 14px',
                      fontSize: '15px',
                      height: '42px',
                      width: '100%'
                    }}
                    className={`bg-[#111C24] border ${confirmPassword && confirmPassword !== password ? 'border-red-400/50' : 'border-white/10'} text-[#F1F5F9] focus:border-emerald-500/50 focus:ring-1 focus:ring-emerald-500/20`}
                  />
                  {confirmPassword && confirmPassword !== password && (
                    <p className="text-xs text-red-400 mt-1 ml-1">Password tidak cocok</p>
                  )}
                </div>

                {error && (
                  <div style={{
                    padding: '10px 14px',
                    background: 'rgba(248,113,113,0.08)',
                    border: '1px solid rgba(248,113,113,0.20)',
                    borderRadius: '10px',
                    fontSize: '13px',
                    color: '#F87171',
                    display: 'flex',
                    gap: '8px',
                    alignItems: 'center'
                  }}>
                    <AlertCircle size={14} className="shrink-0" />
                    {error}
                  </div>
                )}

                <Button
                  type="submit"
                  disabled={isLoading || !sessionReady || !password || !confirmPassword}
                  style={{
                    width: '100%',
                    height: '44px',
                    border: 'none',
                    borderRadius: '10px',
                    color: 'white',
                    fontFamily: 'Sora',
                    fontSize: '14px',
                    fontWeight: 700,
                    opacity: (!password || !confirmPassword || !sessionReady) ? 0.5 : 1,
                    marginTop: '4px'
                  }}
                  className="bg-emerald-500 hover:bg-emerald-600 transition-colors shadow-[0_4px_20px_rgba(12,61,12,0.2)] dark:shadow-[0_4px_20px_rgba(140,184,140,0.15)]"
                >
                  {isLoading ? (
                    <><Loader2 size={16} className="animate-spin mr-2" /> Menyimpan...</>
                  ) : 'Simpan Password Baru'}
                </Button>
              </form>
            </>
          )}

          {!success && (
            <Link
              to="/login"
              className="flex items-center justify-center gap-2 mt-6 text-[13px] text-[#4B6478] hover:text-[#94A3B8] transition-colors font-medium"
            >
              <ArrowLeft size={14} />
              Kembali ke halaman Login
            </Link>
          )}
        </div>
      </motion.div>
    </div>
  )
}
