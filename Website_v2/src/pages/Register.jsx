import React, { useState, useEffect } from 'react'
import { useNavigate, Link } from 'react-router-dom'
import { motion } from 'framer-motion'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import * as z from 'zod'
import { supabase } from '@/lib/supabase'
import { getOAuthRedirectUrl } from '@/lib/capacitor'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Separator } from '@/components/ui/separator'
import {
  Eye, EyeOff, AlertCircle, Loader2,
  TrendingUp, Truck, BarChart2, Clock, ShieldAlert
} from 'lucide-react'
import { toast } from 'sonner'
import { getBrokerBasePath } from '../lib/hooks/useAuth'
import { useAntiSpam } from '@/lib/hooks/useAntiSpam'
import { useMediaQuery } from '@/lib/hooks/useMediaQuery'
import { usePlatformStats } from '@/lib/hooks/usePlatformStats'
import { logError } from '@/lib/logger/errorLogger'
import { useLanguage } from '@/lib/i18n/useLanguage'

// Components
import MobileRegister from './MobileRegister'
import BlurText from '@/components/reactbits/BlurText'
import AnimatedContent from '@/components/reactbits/AnimatedContent'
import Particles from '@/components/reactbits/Particles'

const registerSchema = z.object({
  fullName: z.string()
    .min(2, 'Nama lengkap minimal 2 karakter')
    .max(100, 'Nama terlalu panjang')
    .trim(),
  email: z.string()
    .email('Format email tidak valid. Gunakan contoh@email.com')
    .toLowerCase()
    .trim(),
  password: z.string()
    .min(8, 'Password minimal 8 karakter agar akunmu aman')
    .max(100, 'Password terlalu panjang'),
  confirmPassword: z.string(),
  agreedToTerms: z.literal(true, {
    errorMap: () => ({ message: 'Kamu harus menyetujui syarat & ketentuan untuk melanjutkan.' }),
  }),
  inviteCode: z.string().optional(),
  mode: z.enum(['mandiri', 'invite']).default('mandiri'),
}).refine((data) => data.password === data.confirmPassword, {
  message: 'Konfirmasi password tidak cocok dengan password di atas',
  path: ['confirmPassword'],
}).superRefine((data, ctx) => {
  if (data.mode === 'invite') {
    const code = data.inviteCode?.trim() || ''
    if (!code || code.length !== 6) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        message: 'Kode undangan harus terdiri dari 6 karakter',
        path: ['inviteCode'],
      });
    }
  }
})

const GoogleIcon = () => (
  <svg width="18" height="18" viewBox="0 0 18 18" className="mr-2">
    <path fill="#4285F4" d="M17.64 9.2c0-.637-.057-1.251-.164-1.84H9v3.481h4.844c-.209 1.125-.843 2.078-1.796 2.717v2.259h2.908c1.702-1.567 2.684-3.874 2.684-6.617z" />
    <path fill="#34A853" d="M9 18c2.43 0 4.467-.806 5.956-2.18l-2.908-2.259c-.806.54-1.837.86-3.048.86-2.344 0-4.328-1.584-5.036-3.711H.957v2.332A8.997 8.997 0 0 0 9 18z" />
    <path fill="#FBBC05" d="M3.964 10.71a5.41 5.41 0 0 1 0-3.42V4.958H.957a8.993 8.993 0 0 0 0 8.084l3.007-2.332z" />
    <path fill="#EA4335" d="M9 3.58c1.321 0 2.508.454 3.44 1.345l2.582-2.58C13.463.891 11.426 0 9 0A8.997 8.997 0 0 0 .957 4.958L3.964 7.29C4.672 5.163 6.656 3.58 9 3.58z" />
  </svg>
)

const waitForProfile = async (authUserId, maxRetries = 8, interval = 600) => {
  for (let i = 0; i < maxRetries; i++) {
    const { data } = await supabase
      .from('profiles')
      .select('*, tenants(*)')
      .eq('auth_user_id', authUserId)
      .maybeSingle()
    if (data) return data
    await new Promise(resolve => setTimeout(resolve, interval * (i + 1)))
  }
  return null
}

export default function Register() {
  const navigate = useNavigate()
  const { t } = useLanguage()
  const [showPassword, setShowPassword] = useState(false)
  const [isLoading, setIsLoading] = useState(false)
  const [googleLoading, setGoogleLoading] = useState(false)
  const [authError, setAuthError] = useState('')
  const [mode, setMode] = useState('mandiri')
  const { stats: platformStats, loading: statsLoading } = usePlatformStats()

  const {
    cooldown, isLocked, lockoutRemaining,
    gate, onSubmitted, HoneypotField, isBlocked
  } = useAntiSpam('signup', {
    cooldownSeconds: 30, maxAttempts: 3, lockoutMinutes: 15
  })

  const {
    register, handleSubmit, setValue,
    formState: { errors },
  } = useForm({
    resolver: zodResolver(registerSchema),
    defaultValues: {
      fullName: '', inviteCode: '', email: '', password: '',
      confirmPassword: '', agreedToTerms: false, mode: 'mandiri'
    },
  })

  useEffect(() => {
    setValue('mode', mode)
  }, [mode, setValue])

  const handleGoogleSignIn = async () => {
    setGoogleLoading(true)
    try {
      const { error } = await supabase.auth.signInWithOAuth({
        provider: 'google',
        options: { redirectTo: getOAuthRedirectUrl() }
      })
      if (error) throw error
    } catch (err) {
      logError({
        level: 'error',
        source: 'auth',
        component: 'Register',
        actionName: 'register.oauth_google',
        error: err,
        metadata: { method: 'google' },
      })
      toast.error('Gagal masuk dengan Google. Coba lagi.')
    } finally {
      setGoogleLoading(false)
    }
  }

  const handleInviteRegister = async (data) => {
    setIsLoading(true)
    setAuthError('')
    try {
      const { data: inviteRows, error: inviteError } = await supabase
        .rpc('get_invitation_by_token', { p_token: data.inviteCode.toUpperCase().trim() })
      const invite = inviteRows?.[0] ?? null
      if (inviteError || !invite || invite.status !== 'pending') {
        logError({
          level: 'warning',
          source: 'auth',
          component: 'Register',
          actionName: 'register.invite_invalid',
          error: inviteError || { message: 'Invitation not found or not pending', code: invite?.status || 'no_invite' },
          metadata: { method: 'invite_code' },
        })
        toast.error('Kode undangan tidak valid atau sudah kadaluarsa')
        return
      }
      if (invite.expires_at && new Date(invite.expires_at) < new Date()) {
        logError({
          level: 'warning',
          source: 'auth',
          component: 'Register',
          actionName: 'register.invite_expired',
          error: { message: 'Invitation expired', code: 'invite_expired' },
          metadata: { method: 'invite_code' },
        })
        toast.error('Kode undangan sudah kadaluarsa')
        return
      }
      const businessName = invite.tenant_business_name ?? 'Tim'
      const { data: signUpData, error: signUpError } = await supabase.auth.signUp({
        email: data.email,
        password: data.password,
        options: {
          data: {
            full_name: data.fullName,
            invite_token: data.inviteCode.toUpperCase().trim()
          }
        }
      })
      if (signUpError) throw signUpError
      toast.success('Berhasil bergabung ke ' + businessName)
      const profile = await waitForProfile(signUpData.user.id)
      if (!profile) {
        logError({
          level: 'error',
          source: 'auth',
          component: 'Register',
          actionName: 'register.wait_profile_timeout',
          error: { message: 'Profile not created within timeout window after invite signup', code: 'profile_timeout' },
          metadata: { method: 'invite' },
        })
        toast.error('Gagal memuat profil. Silakan login manual.')
        return
      }
      await supabase.auth.refreshSession()
      navigate(getBrokerBasePath(profile.tenants) + '/beranda')
    } catch (err) {
      logError({
        level: 'error',
        source: 'auth',
        component: 'Register',
        actionName: 'register.invite_submit',
        error: err,
        metadata: { method: 'invite' },
      })
      setAuthError(err.message)
    } finally {
      setIsLoading(false)
    }
  }

  const onSubmit = async (formData) => {
    const check = gate()
    if (!check.allowed) {
      setAuthError(check.reason)
      return
    }
    if (mode === 'invite') return handleInviteRegister(formData)
    setIsLoading(true)
    setAuthError('')
    try {
      const { error } = await supabase.auth.signUp({
        email: formData.email.trim(),
        password: formData.password,
        options: { data: { full_name: formData.fullName } }
      })
      if (error) throw error
      onSubmitted()
      navigate('/check-email', { state: { email: formData.email.trim() } })
      toast.success('Akun dibuat! Cek email kamu.')
    } catch (err) {
      logError({
        level: 'error',
        source: 'auth',
        component: 'Register',
        actionName: 'register.submit',
        error: err,
        metadata: { method: 'email' },
      })
      setAuthError(err.message)
    } finally {
      setIsLoading(false)
    }
  }

  const isDesktop = useMediaQuery('(min-width: 1024px)')
  const propsBag = {
    mode, setMode, showPassword, setShowPassword, isLoading, googleLoading,
    authError, cooldown, isLocked, lockoutRemaining, isBlocked, register, handleSubmit,
    setValue, errors, onSubmit, handleGoogleSignIn, navigate, HoneypotField
  }

  if (!isDesktop) return <MobileRegister {...propsBag} />

  return (
    <div className="flex min-h-screen bg-[#06090F] overflow-x-hidden font-body">
      {/* LEFT PANEL - BRANDING (Desktop only) */}
      <motion.div
        initial={{ opacity: 0, x: -20 }}
        animate={{ opacity: 1, x: 0 }}
        transition={{ duration: 0.5, delay: 0.1 }}
        className="dark-preserve hidden md:flex md:w-[45%] relative border-r border-white/5 flex-col justify-center gap-12 p-10 overflow-hidden"
        style={{ background: 'linear-gradient(135deg, #0C1319 0%, #060D12 50%, #0A1A12 100%)' }}
      >
        <div style={{ position: 'absolute', bottom: -100, right: -100, width: 400, height: 400, borderRadius: '50%', background: 'radial-gradient(circle, rgba(16, 185, 129, 0.12) 0%, transparent 70%)', pointerEvents: 'none' }} />
        <div style={{
          position: 'absolute', inset: 0,
          backgroundImage: `linear-gradient(rgba(16, 185, 129, 0.03) 1px, transparent 1px), linear-gradient(90deg, rgba(16, 185, 129, 0.03) 1px, transparent 1px)`,
          backgroundSize: '40px 40px', pointerEvents: 'none'
        }} />

        <Particles quantity={30} color="#10B981" opacity={0.15} className="absolute inset-0 pointer-events-none" />

        <Link to="/" className="absolute top-8 left-12 flex items-center gap-[10px] z-50 hover:opacity-80 transition-opacity">
          <img src="/logo.png" alt="TernakOS" style={{ width: 36, height: 36, borderRadius: '10px', objectFit: 'cover' }} />
          <span style={{ fontFamily: 'Sora', fontSize: '20px', fontWeight: 800, color: '#F1F5F9', letterSpacing: '-0.3px' }}>TernakOS</span>
        </Link>

        <div className="flex flex-col gap-8 relative z-10 pt-20">
          <div className="space-y-4">
            <BlurText text="Digitalisasi bisnis ternak lebih cepat, lebih rapi." delay={100} animateBy="words" direction="top" className="font-display text-3xl md:text-4xl font-black text-[#F1F5F9] leading-tight tracking-tight" />
            <AnimatedContent distance={20} duration={0.6}>
              <p className="text-[#4B6478] text-sm md:text-base leading-relaxed max-w-[340px]">Bergabung dengan ratusan broker dan peternak yang sudah meninggalkan catatan manual.</p>
            </AnimatedContent>
          </div>

          <AnimatedContent stagger delay={0.4} staggerDelay={0.15} distance={15}>
            <div className="flex gap-3 mt-8">
              {[
                {
                  val: statsLoading ? '—' : platformStats.active_users_text,
                  label: 'Pengguna Aktif',
                  sub: 'broker & peternak'
                },
                {
                  val: statsLoading ? '—' : platformStats.total_transactions_text,
                  label: 'Aktivitas Transaksi',
                  sub: '& terus bertambah'
                },
                {
                  val: statsLoading ? '—' : platformStats.transaction_volume_text,
                  label: 'Volume Penjualan',
                  sub: 'dari transaksi nyata'
                }
              ].map((stat, i) => (
                <div key={i} className="bg-[#0C1319]/80 border border-white/8 rounded-xl p-3 flex-1 transition-all hover:border-white/12">
                  <div className="font-display text-lg font-bold text-emerald-500">{stat.val}</div>
                  <div className="text-[#F1F5F9] text-[10px] font-semibold mt-0.5">{stat.label}</div>
                  <div className="text-[#4B6478] text-[9px]">{stat.sub}</div>
                </div>
              ))}
            </div>
          </AnimatedContent>

          <AnimatedContent stagger delay={0.6} staggerDelay={0.1} distance={10}>
            <div className="mt-8 space-y-0">
              {[{ icon: <TrendingUp />, title: "Profit & Cash Flow Real-time", desc: "Margin bersih otomatis terhitung." }, { icon: <Truck />, title: "Tracking Pengiriman & Loss", desc: "Pantau mortalitas dan susut berat." }, { icon: <BarChart2 />, title: "Harga Pasar Transparan", desc: "Data harga dari transaksi nyata." }, { icon: <Clock />, title: "Piutang & Jatuh Tempo", desc: "Pantau semua piutang RPA otomatis." }].map((item, i, arr) => (
                <div key={i} className={`flex gap-3 items-start py-2.5 ${i !== arr.length - 1 ? 'border-b border-white/5' : ''}`}>
                  <div className="w-7 h-7 bg-emerald-500/10 border border-emerald-500/20 rounded-lg flex items-center justify-center flex-shrink-0">{React.cloneElement(item.icon, { size: 14, className: "text-emerald-500" })}</div>
                  <div>
                    <h4 className="text-[#F1F5F9] text-[13px] font-semibold tracking-tight">{item.title}</h4>
                    <p className="text-[#4B6478] text-[11px] mt-0.5 leading-relaxed font-medium">{item.desc}</p>
                  </div>
                </div>
              ))}
            </div>
          </AnimatedContent>

          <AnimatedContent delay={0.8} distance={20}>
            <div className="mt-8">
              <div className="bg-[#0C1319]/80 border-l-2 border-emerald-500 rounded-xl p-4">
                <p className="text-[#94A3B8] text-xs italic leading-relaxed">"Proses pendaftaran sangat mudah. Dalam hitungan menit, saya sudah bisa input transaksi pertama saya."</p>
                <div className="flex gap-2 items-center mt-3">
                  <div className="w-6 h-6 rounded-full bg-emerald-500 flex items-center justify-center text-[10px] font-bold text-[#06090F]">AS</div>
                  <div><p className="text-[#F1F5F9] text-xs font-semibold">Andi Saputra</p><p className="text-[#4B6478] text-[10px]">Peternak Ayam, Magelang</p></div>
                </div>
              </div>
            </div>
          </AnimatedContent>
        </div>
      </motion.div>

      {/* RIGHT PANEL - FORM */}
      <div className="flex-1 flex items-center justify-center px-5 py-8 md:p-8 min-h-screen overflow-y-auto">
        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.4, ease: [0.25, 0.46, 0.45, 0.94] }} className="w-full max-w-[400px] py-10">
          <h1 className="font-display text-2xl font-black text-white mb-2">{t('auth_register_title', 'Buat akun baru')}</h1>
          <p className="text-[#4B6478] text-sm mb-8">{t('auth_register_desc', 'Gratis selamanya, tanpa kartu kredit.')}</p>

          <Button type="button" variant="outline" onClick={handleGoogleSignIn} className="w-full h-11 border-white/10 bg-transparent text-white font-semibold rounded-xl hover:bg-white/5 transition-colors mb-6">
            <GoogleIcon /> {t('auth_register_google', 'Daftar dengan Google')}
          </Button>

          <div className="flex items-center gap-3 my-6">
            <Separator className="flex-1 bg-white/5" /><span className="text-[11px] text-[#4B6478] font-bold uppercase tracking-widest">{t('auth_or', 'atau')}</span><Separator className="flex-1 bg-white/5" />
          </div>

          <div className="flex p-1 bg-white/5 rounded-xl border border-white/10 mb-6">
            {['mandiri', 'invite'].map(m => (
              <button key={m} onClick={() => setMode(m)} className={`flex-1 py-2 text-[13px] font-semibold transition-all rounded-lg ${mode === m ? 'bg-emerald-500 text-white shadow-lg' : 'text-[#94A3B8] hover:text-white'}`}>{m === 'mandiri' ? t('auth_register_mandiri', 'Daftar Mandiri') : t('auth_register_invite', 'Pakai Undangan')}</button>
            )) }
          </div>

          {isLocked && (
            <div className="p-3 bg-amber-400/10 border border-amber-400/20 rounded-xl flex items-center gap-2 text-[13px] text-amber-400 mb-4 font-medium"><ShieldAlert size={16} />Terlalu banyak percobaan. Coba lagi dalam <strong>{Math.ceil(lockoutRemaining / 60)}m</strong></div>
          )}

          <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
            <HoneypotField />
            <div className="space-y-1.5">
              <Label className="text-[#94A3B8] text-xs font-semibold ml-1">{t('auth_fullname_label', 'NAMA LENGKAP')}</Label>
              <Input placeholder={t('auth_fullname_placeholder', 'Budi Santoso')} {...register('fullName')} className="bg-[#111C24] border-white/10 text-white h-11 rounded-xl" />
              {errors.fullName && <p className="text-xs text-red-500">{errors.fullName.message}</p>}
            </div>
            {mode === 'invite' && (
              <div className="space-y-1.5">
                <Label className="text-[#94A3B8] text-xs font-semibold ml-1">{t('auth_invite_code_label', 'KODE UNDANGAN')}</Label>
                <Input placeholder="CODE12" maxLength={6} {...register('inviteCode')} onChange={e => setValue('inviteCode', e.target.value.toUpperCase())} className="bg-[#111C24] border-white/10 text-white h-11 rounded-xl text-center font-bold tracking-[0.3em]" />
                {errors.inviteCode && <p className="text-xs text-red-500">{errors.inviteCode.message}</p>}
              </div>
            )}
            <div className="space-y-1.5">
              <Label className="text-[#94A3B8] text-xs font-semibold ml-1">{t('auth_email_label_upper', 'EMAIL')}</Label>
              <Input type="email" placeholder={t('auth_email_placeholder_full', 'email@contoh.com')} {...register('email')} className="bg-[#111C24] border-white/10 text-white h-11 rounded-xl" />
              {errors.email && <p className="text-xs text-red-500">{errors.email.message}</p>}
            </div>
            <div className="grid grid-cols-2 gap-3">
               <div className="space-y-1.5">
                <Label className="text-[#94A3B8] text-xs font-semibold ml-1">{t('auth_password_label_upper', 'PASSWORD')}</Label>
                <Input type={showPassword ? 'text' : 'password'} placeholder={t('auth_password_placeholder', '••••••••')} {...register('password')} className="bg-[#111C24] border-white/10 text-white h-11 rounded-xl" />
              </div>
              <div className="space-y-1.5">
                <Label className="text-[#94A3B8] text-xs font-semibold ml-1">{t('auth_confirm_password_label', 'KONFIRMASI')}</Label>
                <div className="relative">
                  <Input type={showPassword ? 'text' : 'password'} placeholder={t('auth_password_placeholder', '••••••••')} {...register('confirmPassword')} className="bg-[#111C24] border-white/10 text-white h-11 rounded-xl" />
                  <button type="button" onClick={() => setShowPassword(!showPassword)} className="absolute right-3 top-1/2 -translate-y-1/2 text-[#4B6478]">{showPassword ? <EyeOff size={16} /> : <Eye size={16} />}</button>
                </div>
              </div>
            </div>
            <div className="flex items-start gap-2 pt-2">
              <input type="checkbox" {...register('agreedToTerms')} className="mt-1 accent-emerald-500" />
              <p className="text-xs text-[#4B6478] leading-relaxed">{t('auth_register_terms_prefix', 'Saya menyetujui ')}<Link to="/terms" className="text-emerald-400">{t('auth_terms', 'S&K')}</Link>{t('auth_register_terms_mid', ' dan ')}<Link to="/privacy" className="text-emerald-400">{t('auth_privacy', 'Kebijakan Privasi')}</Link>{t('auth_register_terms_suffix', ' TernakOS.')}</p>
            </div>
            {errors.agreedToTerms && <p className="text-xs text-red-500">{errors.agreedToTerms.message}</p>}
            {authError && <div className="p-3 bg-red-500/10 border border-red-500/20 rounded-xl text-[13px] text-red-400 flex items-center gap-2"><AlertCircle size={14} />{authError}</div>}
            <Button type="submit" disabled={isLoading || isBlocked} className="w-full bg-emerald-500 hover:bg-emerald-600 text-white font-bold h-11 rounded-xl shadow-[0_4px_20px_rgba(12,61,12,0.2)] dark:shadow-[0_4px_20px_rgba(140,184,140,0.15)] mt-4">
              {isLoading ? t('auth_processing', 'Memproses...') : cooldown > 0 ? `Tunggu ${cooldown}s` : (mode === 'mandiri' ? t('auth_register_button', 'Daftar Gratis →') : t('auth_join_team_button', 'Bergabung Tim'))}
            </Button>
          </form>
          <p className="text-center text-sm text-[#4B6478] mt-8">{t('auth_already_have_account', 'Sudah punya akun? ')}<Link to="/login" className="text-emerald-400 font-semibold">{t('auth_login_now', 'Masuk Sekarang')}</Link></p>
        </motion.div>
      </div>
    </div>
  )
}
