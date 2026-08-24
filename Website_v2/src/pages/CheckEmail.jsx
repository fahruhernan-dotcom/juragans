import React, { useState, useEffect } from 'react'
import { useLocation, Link } from 'react-router-dom'
import { motion } from 'framer-motion'
import { Mail, RefreshCw, ArrowLeft, CheckCircle2, Clock, Shield } from 'lucide-react'
import { supabase } from '@/lib/supabase'
import { Button } from '@/components/ui/button'
import { toast } from 'sonner'

export default function CheckEmail() {
  const location = useLocation()
  const email = location.state?.email || ''

  const [canResend, setCanResend] = useState(false)
  const [countdown, setCountdown] = useState(60)
  const [resending, setResending] = useState(false)

  // Start countdown on mount
  useEffect(() => {
    if (countdown <= 0) {
      setCanResend(true)
      return
    }
    const timer = setTimeout(() => setCountdown(c => c - 1), 1000)
    return () => clearTimeout(timer)
  }, [countdown])

  const handleResend = async () => {
    if (!canResend || resending) return
    setResending(true)
    try {
      const { error } = await supabase.auth.resend({
        type: 'signup',
        email,
      })
      if (error) throw error
      toast.success('Email konfirmasi dikirim ulang!')
      setCanResend(false)
      setCountdown(60)
    } catch (err) {
      toast.error('Gagal kirim ulang: ' + err.message)
    } finally {
      setResending(false)
    }
  }

  const steps = [
    { icon: Mail, label: 'Buka email kamu', desc: 'Cari email dari TernakOS' },
    { icon: CheckCircle2, label: 'Klik tombol konfirmasi', desc: 'Tombol "Konfirmasi Email" di dalam email' },
    { icon: Shield, label: 'Mulai setup bisnis', desc: 'Kamu akan diarahkan otomatis' },
  ]

  return (
    <div className="min-h-screen bg-[#06090F] flex flex-col items-center justify-center px-4 py-12">
      {/* Glow background */}
      <div
        className="pointer-events-none fixed inset-0 z-0"
        style={{
          background: 'radial-gradient(ellipse 60% 40% at 50% 20%, rgba(124,58,237,0.12) 0%, transparent 70%)',
        }}
      />

      <motion.div
        initial={{ opacity: 0, y: 24 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5 }}
        className="relative z-10 w-full max-w-md"
      >
        {/* Mail icon with pulse animation */}
        <div className="flex justify-center mb-8">
          <div className="relative">
            <motion.div
              animate={{ scale: [1, 1.08, 1] }}
              transition={{ duration: 2.4, repeat: Infinity, ease: 'easeInOut' }}
              className="w-20 h-20 rounded-full flex items-center justify-center"
              style={{ background: 'rgba(124,58,237,0.15)', border: '1.5px solid rgba(124,58,237,0.35)' }}
            >
              <Mail className="w-9 h-9 text-violet-400" />
            </motion.div>
            {/* Outer ring pulse */}
            <motion.div
              animate={{ scale: [1, 1.3], opacity: [0.4, 0] }}
              transition={{ duration: 2.4, repeat: Infinity, ease: 'easeOut' }}
              className="absolute inset-0 rounded-full"
              style={{ background: 'rgba(124,58,237,0.15)' }}
            />
          </div>
        </div>

        {/* Heading */}
        <h1 className="text-2xl font-bold text-white text-center mb-2">
          Cek email kamu!
        </h1>
        <p className="text-white/50 text-center text-sm mb-6">
          Kami mengirim link konfirmasi ke
        </p>

        {/* Email badge */}
        {email && (
          <div
            className="mx-auto mb-8 px-4 py-2.5 rounded-xl text-center text-sm font-medium text-violet-300 w-fit"
            style={{ background: 'rgba(124,58,237,0.12)', border: '1px solid rgba(124,58,237,0.25)' }}
          >
            {email}
          </div>
        )}

        {/* Steps */}
        <div
          className="rounded-2xl p-5 mb-6 space-y-4"
          style={{ background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.07)' }}
        >
          {steps.map((step, i) => (
            <div key={i} className="flex items-start gap-3">
              <div
                className="w-8 h-8 rounded-full flex items-center justify-center shrink-0 mt-0.5"
                style={{ background: 'rgba(124,58,237,0.15)' }}
              >
                <step.icon className="w-4 h-4 text-violet-400" />
              </div>
              <div>
                <p className="text-white text-sm font-medium">{step.label}</p>
                <p className="text-white/40 text-xs mt-0.5">{step.desc}</p>
              </div>
            </div>
          ))}
        </div>

        {/* Resend section */}
        <div className="text-center mb-4">
          <p className="text-white/40 text-sm mb-3">Tidak menerima email?</p>
          <Button
            onClick={handleResend}
            disabled={!canResend || resending}
            variant="outline"
            className="w-full border-white/10 bg-white/5 text-white hover:bg-white/10 disabled:opacity-40"
          >
            {resending ? (
              <>
                <RefreshCw className="w-4 h-4 mr-2 animate-spin" />
                Mengirim...
              </>
            ) : canResend ? (
              <>
                <RefreshCw className="w-4 h-4 mr-2" />
                Kirim ulang email
              </>
            ) : (
              <>
                <Clock className="w-4 h-4 mr-2" />
                Kirim ulang dalam {countdown}s
              </>
            )}
          </Button>
        </div>

        {/* Spam note */}
        <p className="text-white/30 text-xs text-center mb-6">
          Cek folder <span className="text-white/50">Spam</span> atau{' '}
          <span className="text-white/50">Promosi</span> jika tidak muncul di inbox.
        </p>

        {/* Back to login */}
        <Link
          to="/login"
          className="flex items-center justify-center gap-2 text-white/40 text-sm hover:text-white/70 transition-colors"
        >
          <ArrowLeft className="w-4 h-4" />
          Kembali ke Login
        </Link>
      </motion.div>
    </div>
  )
}
