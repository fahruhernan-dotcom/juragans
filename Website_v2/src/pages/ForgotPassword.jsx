import React, { useState } from 'react'
import { Link } from 'react-router-dom'
import { motion } from 'framer-motion'
import { supabase } from '@/lib/supabase'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Mail, ArrowLeft, Loader2, CheckCircle2, AlertCircle, ShieldAlert } from 'lucide-react'
import Particles from '@/components/reactbits/Particles'
import { useAntiSpam } from '@/lib/hooks/useAntiSpam'
import { logError } from '@/lib/logger/errorLogger'
import { isCapacitor } from '@/lib/capacitor'

export default function ForgotPassword() {
  const [email, setEmail] = useState('')
  const [isLoading, setIsLoading] = useState(false)
  const [sent, setSent] = useState(false)
  const [error, setError] = useState('')

  const {
    cooldown, isLocked, lockoutRemaining,
    gate, onSubmitted, HoneypotField, isBlocked
  } = useAntiSpam('forgot-pw', {
    cooldownSeconds: 60,
    maxAttempts: 3,
    lockoutMinutes: 15
  })

  const handleSubmit = async (e) => {
    e.preventDefault()
    if (!email.trim()) return

    // Anti-spam gate
    const check = gate()
    if (!check.allowed) {
      setError(check.reason)
      return
    }

    setIsLoading(true)
    setError('')

    const cleanEmail = email.trim().toLowerCase()
    const targetEmail = cleanEmail.includes('@') ? cleanEmail : `${cleanEmail}@sembako.id`

    try {
      const { error } = await supabase.auth.resetPasswordForEmail(targetEmail, {
        redirectTo: window.location.origin + '/reset-password'
      })

      if (error) throw error
      setEmail(targetEmail)
      setSent(true)
      onSubmitted() // start cooldown + record attempt
    } catch (err) {
      logError({
        level: 'error',
        source: 'auth',
        component: 'ForgotPassword',
        actionName: 'auth.password.reset_request',
        error: err,
        metadata: {
          email_length: targetEmail?.length,
        }
      });
      if (err.message?.includes('rate limit')) {
        setError('Terlalu banyak percobaan reset password. Coba lagi dalam beberapa menit.')
      } else if (err.message?.includes('SMTP') || err.message?.includes('email provider')) {
        setError('Layanan email belum dikonfigurasi di Supabase SMTP. Hubungi Developer Superadmin.')
      } else {
        setError(err.message || 'Gagal mengirim email reset. Coba lagi.')
      }
    } finally {
      setIsLoading(false)
    }
  }

  const formatTime = (s) => {
    const m = Math.floor(s / 60)
    const sec = s % 60
    return m > 0 ? `${m}m ${sec}s` : `${sec}s`
  }

  return (
    <div className="flex items-center justify-center min-h-screen bg-[#06090F] px-5 py-10 relative overflow-hidden">
      <Particles
        quantity={25}
        color="#021a02"
        opacity={0.08}
        className="absolute inset-0 pointer-events-none"
      />

      {/* Glow */}
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
        <Link to={isCapacitor() ? "/login" : "/"} className="flex items-center justify-center gap-2 mb-10 group">
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
          {!sent ? (
            <>
              {/* Icon */}
              <div className="w-12 h-12 bg-emerald-500/10 border border-emerald-500/20 rounded-xl flex items-center justify-center mx-auto mb-5">
                <Mail size={22} className="text-emerald-500" />
              </div>

              <h1 className="text-xl font-bold font-display text-[#F1F5F9] text-center mb-1.5 tracking-tight">
                Lupa Password?
              </h1>
              <p className="text-[13px] text-[#4B6478] text-center mb-7 leading-relaxed font-medium">
                Masukkan email akunmu dan kami akan mengirimkan link untuk mereset password.
              </p>

              {/* Lockout Warning */}
              {isLocked && (
                <div style={{
                  padding: '12px 14px',
                  background: 'rgba(251,191,36,0.08)',
                  border: '1px solid rgba(251,191,36,0.20)',
                  borderRadius: '10px',
                  fontSize: '13px',
                  color: '#FBBF24',
                  display: 'flex',
                  gap: '8px',
                  alignItems: 'center',
                  marginBottom: '16px'
                }}>
                  <ShieldAlert size={16} className="shrink-0" />
                  <span>
                    Terlalu banyak percobaan. Coba lagi dalam <strong>{formatTime(lockoutRemaining)}</strong>
                  </span>
                </div>
              )}

              <form onSubmit={handleSubmit} className="space-y-4">
                {/* Honeypot — invisible to humans, traps bots */}
                <HoneypotField />

                <div className="space-y-1.5">
                  <Label htmlFor="email" style={{
                    fontSize: '13px', fontWeight: 500,
                    marginLeft: '4px', display: 'block'
                  }} className="text-[#94A3B8]">
                    Email
                  </Label>
                  <Input
                    id="email"
                    type="email"
                    placeholder="contoh@email.com"
                    value={email}
                    onChange={e => setEmail(e.target.value)}
                    disabled={isLocked}
                    style={{
                      borderRadius: '10px',
                      padding: '10px 14px',
                      fontSize: '15px',
                      height: '42px',
                      width: '100%'
                    }}
                    className="bg-[#111C24] border border-white/10 text-[#F1F5F9] focus:border-emerald-500/50 focus:ring-1 focus:ring-emerald-500/20"
                  />
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
                  disabled={isLoading || !email.trim() || isBlocked}
                  style={{
                    width: '100%',
                    height: '44px',
                    border: 'none',
                    borderRadius: '10px',
                    color: 'white',
                    fontFamily: 'Sora',
                    fontSize: '14px',
                    fontWeight: 700,
                    opacity: (!email.trim() || isBlocked) ? 0.5 : 1,
                    marginTop: '4px'
                  }}
                  className="bg-emerald-500 hover:bg-emerald-600 transition-colors shadow-[0_4px_20px_rgba(12,61,12,0.2)] dark:shadow-[0_4px_20px_rgba(140,184,140,0.15)]"
                >
                  {isLoading ? (
                    <><Loader2 size={16} className="animate-spin mr-2" /> Mengirim...</>
                  ) : cooldown > 0 ? (
                    `Tunggu ${cooldown}s`
                  ) : 'Kirim Link Reset'}
                </Button>
              </form>
            </>
          ) : (
            /* SUCCESS STATE */
            <div className="text-center py-4">
              <div className="w-14 h-14 bg-emerald-500/10 border border-emerald-500/20 rounded-full flex items-center justify-center mx-auto mb-5">
                <CheckCircle2 size={28} className="text-emerald-500" />
              </div>

              <h2 className="text-lg font-bold font-display text-[#F1F5F9] mb-2 tracking-tight">
                Email Terkirim!
              </h2>
              <p className="text-[13px] text-[#4B6478] leading-relaxed font-medium mb-2">
                Kami sudah mengirim link reset password ke:
              </p>
              <p className="text-sm text-emerald-500 font-semibold mb-6">{email}</p>
              <p className="text-[12px] text-[#4B6478] leading-relaxed">
                Cek folder <span className="text-[#94A3B8] font-medium">Inbox</span> atau <span className="text-[#94A3B8] font-medium">Spam</span> kamu. Link akan kadaluarsa dalam 1 jam.
              </p>

              <Button
                type="button"
                onClick={() => { setSent(false); setEmail('') }}
                disabled={cooldown > 0}
                variant="outline"
                style={{
                  width: '100%',
                  height: '40px',
                  marginTop: '20px',
                  opacity: cooldown > 0 ? 0.5 : 1
                }}
                className="bg-transparent border border-white/10 text-[#94A3B8] hover:bg-white/5 transition-colors font-semibold text-[13px]"
              >
                {cooldown > 0 ? `Kirim Ulang (${cooldown}s)` : 'Kirim Ulang'}
              </Button>
            </div>
          )}

          {/* Back to Login */}
          <Link
            to="/login"
            className="flex items-center justify-center gap-2 mt-6 text-[13px] text-[#4B6478] hover:text-[#94A3B8] transition-colors font-medium"
          >
            <ArrowLeft size={14} />
            Kembali ke halaman Login
          </Link>
        </div>
      </motion.div>
    </div>
  )
}
