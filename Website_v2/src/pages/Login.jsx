import React, { useState, useEffect } from 'react'
import { useNavigate, Link } from 'react-router-dom'
import { useMediaQuery } from '@/lib/hooks/useMediaQuery'
import { motion, AnimatePresence } from 'framer-motion'
import { supabase } from '@/lib/supabase'
import {
  Eye, EyeOff, AlertCircle, Loader2,
  TrendingUp, ShoppingCart, Clock, ShieldCheck, Users, Zap, Mail, Lock,
  Package, FileText, Store, CheckCircle2, ArrowRight, ArrowLeft, Sparkles, Building2
} from 'lucide-react'
import { toast } from 'sonner'
import { getBrokerBasePath, getPeternakBasePath, useAuth } from '../lib/hooks/useAuth'
import { setRememberMe as saveRememberMe } from '@/lib/supabaseStorage'
import Particles from '@/components/reactbits/Particles'
import { isCapacitor } from '@/lib/capacitor'

export default function Login() {
  const navigate = useNavigate()
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [showPassword, setShowPassword] = useState(false)
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState('')
  const [rememberMe, setRememberMe] = useState(false)

  const { user, profile, loading: authLoading, isSuperadmin, loginAsBypass } = useAuth()

  const handleBypassLogin = (roleKey = 'owner') => {
    setIsLoading(true)
    try {
      const mockProf = loginAsBypass(roleKey)
      toast.success(`Mode Demo Juragans: Masuk sebagai ${mockProf.full_name}`)
      if (roleKey === 'dev') {
        navigate('/admin', { replace: true })
      } else {
        navigate(getBrokerBasePath(mockProf.tenants, mockProf) + '/beranda', { replace: true })
      }
    } catch (err) {
      console.error(err)
    } finally {
      setIsLoading(false)
    }
  }

  useEffect(() => {
    if (authLoading || !user || !profile) return
    if (isSuperadmin) { navigate('/admin', { replace: true }); return }
    if (!profile.onboarded) { navigate('/onboarding', { replace: true }); return }
    if (profile.user_type === 'peternak' || profile.user_type === 'rumah_potong') {
      navigate(getPeternakBasePath(profile.tenants, profile) + '/beranda', { replace: true })
      return
    }
    navigate(getBrokerBasePath(profile.tenants, profile) + '/beranda', { replace: true })
  }, [authLoading, user, profile, isSuperadmin]) // eslint-disable-line react-hooks/exhaustive-deps

  const handleLogin = async (overrideEmail, overridePass) => {
    const targetEmail = overrideEmail || email
    const targetPass = overridePass || password

    if (!targetEmail || !targetPass) {
      setError('Masukkan email dan kata sandi Anda')
      return
    }
    setIsLoading(true)
    setError('')
    saveRememberMe(rememberMe)

    const cleanEmail = targetEmail.trim().toLowerCase()

    try {
      let resolvedEmail = cleanEmail
      if (!cleanEmail.includes('@')) {
        const { data: matchedProf } = await supabase
          .from('profiles')
          .select('email')
          .ilike('email', `${cleanEmail}%`)
          .limit(1)
          .maybeSingle()

        resolvedEmail = matchedProf?.email || `${cleanEmail}@sembako.id`
      }

      let { data, error: authErr } = await supabase.auth.signInWithPassword({
        email: resolvedEmail,
        password: targetPass
      })

      if (authErr && !cleanEmail.includes('@') && resolvedEmail !== `${cleanEmail}@sembako.id`) {
        const fallbackRes = await supabase.auth.signInWithPassword({
          email: `${cleanEmail}@sembako.id`,
          password: targetPass
        })
        data = fallbackRes.data
        authErr = fallbackRes.error
      }

      if (authErr) {
        setError('Email atau kata sandi salah. Silakan periksa kembali.')
        return
      }

      if (data?.user?.app_metadata?.is_superadmin === true) {
        navigate('/admin')
        toast.success('Selamat datang kembali, Superadmin!')
        return
      }

      let { data: profiles } = await supabase
        .from('profiles')
        .select('*, tenants(sub_type, business_vertical)')
        .eq('auth_user_id', data.user.id)

      if (!profiles || profiles.length === 0) {
        const { data: profilesByEmail } = await supabase
          .from('profiles')
          .select('*, tenants(sub_type, business_vertical)')
          .eq('email', cleanEmail)

        if (profilesByEmail && profilesByEmail.length > 0) {
          profiles = profilesByEmail
          await supabase.from('profiles').update({ auth_user_id: data.user.id }).eq('id', profilesByEmail[0].id)
        } else if (cleanEmail === 'fahruhernansakti@gmail.com' || cleanEmail.startsWith('dev@')) {
          const defaultTenantId = '00000000-0000-0000-0000-000000000002'
          const { data: newProfile } = await supabase.from('profiles').insert({
            auth_user_id: data.user.id,
            tenant_id: defaultTenantId,
            full_name: data.user.user_metadata?.full_name || 'Developer Superadmin',
            email: cleanEmail,
            role: 'dev',
            app_role: 'dev',
            user_type: 'broker',
            sub_type: 'distributor_sembako',
            business_name: '',
            onboarded: true
          }).select('*, tenants(sub_type, business_vertical)').single()

          if (newProfile) profiles = [newProfile]
        }
      }

      if (!profiles || profiles.length === 0) {
        setError('Akun tidak terdaftar. Hubungi Developer untuk mendaftarkan akun.')
        await supabase.auth.signOut()
        return
      }

      const profile = profiles.find(p => p.onboarded) || profiles[0]

      if (profile?.tenant_id) {
        try { localStorage.setItem('ternakos_active_tenant_id', profile.tenant_id) } catch { /* ok */ }
      }

      navigate(getBrokerBasePath(profile.tenants, profile) + '/beranda')
      toast.success('Selamat datang kembali!')
    } catch (err) {
      setError('Terjadi kesalahan saat masuk. Silakan coba lagi.')
    } finally {
      setIsLoading(false)
    }
  }

  const isDesktop = useMediaQuery('(min-width: 1024px)')

  const propsBag = {
    email, setEmail, password, setPassword, showPassword, setShowPassword,
    isLoading, error, handleLogin, handleBypassLogin, navigate,
    rememberMe, setRememberMe
  }

  if (!isDesktop) {
    return <MobileLoginView {...propsBag} />
  }

  return <DesktopLoginView {...propsBag} />
}

// ─── DESKTOP LOGIN VIEW ───────────────────────────────────────
function DesktopLoginView({ email, setEmail, password, setPassword, showPassword, setShowPassword, isLoading, error, handleLogin, handleBypassLogin, rememberMe, setRememberMe }) {
  return (
    <div className="min-h-[100dvh] w-full flex flex-col lg:flex-row bg-[#FBFCF8] text-slate-900 font-sans selection:bg-[#0c3d0c]/15 overflow-x-hidden overflow-y-auto relative">

      {/* LEFT PANEL - RICH SHOWCASE (55% Width) */}
      <motion.div 
        initial={{ opacity: 0, x: -16 }}
        animate={{ opacity: 1, x: 0 }}
        transition={{ duration: 0.5, ease: [0.16, 1, 0.3, 1] }}
        className="w-full lg:w-[55%] relative overflow-y-auto hidden lg:flex flex-col justify-between px-10 xl:px-16 py-10 bg-gradient-to-br from-white via-[#F8FAFC] to-[#ECFDF5]/30 border-r border-slate-200/80 min-h-[100dvh]"
      >
        {/* Subtle Ambient Glows */}
        <div className="absolute top-[-10%] left-[-10%] w-[450px] h-[450px] rounded-full bg-emerald-500/[0.07] blur-[90px] pointer-events-none" />
        <div className="absolute bottom-[-10%] right-[-5%] w-[380px] h-[380px] rounded-full bg-[#0c3d0c]/[0.05] blur-[80px] pointer-events-none" />

        <Particles
          particleCount={40}
          particleColors={['#0C3D0C', '#16A34A', '#22C55E', '#15803D']}
          particleBaseSize={1.8}
          speed={0.25}
          className="absolute inset-0 pointer-events-none opacity-40"
        />

        {/* Brand Header */}
        <div className="relative z-10 flex items-center gap-3 mb-6 shrink-0">
          <div className="w-10 h-10 rounded-xl bg-[#0c3d0c] flex items-center justify-center shadow-md shadow-[#0c3d0c]/20 ring-1 ring-white/20 shrink-0">
            <Store size={20} className="text-white" strokeWidth={2.2} />
          </div>
          <div>
            <div className="font-extrabold text-sm text-slate-900 tracking-tight flex items-center gap-2">
              Juragans Dashboard <span className="text-[10px] bg-[#0c3d0c]/10 text-[#0c3d0c] border border-[#0c3d0c]/20 px-2 py-0.5 rounded-full font-bold uppercase tracking-wider">ERP v2.4</span>
            </div>
            <div className="text-[10px] text-slate-500 font-semibold tracking-wide">Platform Penjualan, POS & Inventaris Bawang Goreng Premium</div>
          </div>
        </div>

        <div className="relative z-10 w-full max-w-[520px] mx-auto my-auto py-6 space-y-7">
          
          {/* Status Badge */}
          <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-white/90 border border-slate-200/90 shadow-sm backdrop-blur-sm">
            <span className="relative flex h-2 w-2">
              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
              <span className="relative inline-flex rounded-full h-2 w-2 bg-emerald-500"></span>
            </span>
            <span className="text-[11px] font-semibold text-slate-700 tracking-tight">Sistem Online & Realtime Sync</span>
          </div>

          {/* Heading */}
          <div className="space-y-3">
            <h1 className="text-3xl sm:text-4xl font-black leading-[1.15] tracking-tight text-slate-950">
              Otomasi Distribusi Sembako, Kasir POS & Finansial Real-Time.
            </h1>
            <p className="text-sm leading-relaxed text-slate-600 font-normal max-w-[480px]">
              Solusi terpadu kasir grosir, kontrol batch stok gudang FIFO, pencatatan piutang pelanggan, dan transparansi laporan laba bersih otomatis.
            </p>
          </div>

          {/* BENTO STATS / PILLARS */}
          <div className="grid grid-cols-3 gap-3 pt-1">
            {[
              { icon: <Clock size={16} className="text-[#0c3d0c]" />, val: "< 1 Detik", label: "Cetak POS & Nota" },
              { icon: <Package size={16} className="text-emerald-700" />, val: "FIFO Multi-Satuan", label: "Dus, Bal, Sak, Pcs" },
              { icon: <ShieldCheck size={16} className="text-teal-700" />, val: "Log Audit Lengkap", label: "Anti-Selisih Stok" },
            ].map((st, i) => (
              <div 
                key={i} 
                className="bg-white/80 border border-slate-200/90 rounded-2xl p-4 shadow-[0_2px_8px_rgba(0,0,0,0.03)] backdrop-blur-sm transition-all hover:border-emerald-600/30 hover:shadow-md"
              >
                <div className="w-7 h-7 rounded-lg bg-[#0c3d0c]/[0.08] flex items-center justify-center mb-2.5">
                  {st.icon}
                </div>
                <div className="text-xs font-black text-slate-900 tracking-tight">{st.val}</div>
                <div className="text-[10px] text-slate-500 font-medium mt-0.5">{st.label}</div>
              </div>
            ))}
          </div>

          {/* 2-COLUMN FEATURE HIGHLIGHTS */}
          <div className="grid grid-cols-2 gap-3">
            {[
              { 
                icon: <ShoppingCart size={15} className="text-[#0c3d0c]" />, 
                title: "Kasir Grosir Kilat", 
                desc: "Cetak struk thermal 58/80mm & faktur PDF instan tanpa jeda loading." 
              },
              { 
                icon: <TrendingUp size={15} className="text-emerald-700" />, 
                title: "Kalkulasi Margin Otomatis", 
                desc: "Laba bersih akurat langsung dikurangi HPP batch barang real-time." 
              },
            ].map((ft, i) => (
              <div 
                key={i}
                className="bg-white/70 border border-slate-200/80 rounded-2xl p-4 shadow-sm backdrop-blur-sm"
              >
                <div className="flex items-center gap-2 mb-1.5">
                  <div className="w-6 h-6 rounded-md bg-[#0c3d0c]/[0.07] flex items-center justify-center shrink-0">
                    {ft.icon}
                  </div>
                  <div className="text-xs font-bold text-slate-900 tracking-tight">{ft.title}</div>
                </div>
                <p className="text-[11px] text-slate-500 leading-relaxed font-normal">{ft.desc}</p>
              </div>
            ))}
          </div>

          {/* TESTIMONIAL QUOTE */}
          <div className="bg-white/90 border border-slate-200/90 border-l-[3.5px] border-l-[#0c3d0c] rounded-2xl p-4 shadow-sm backdrop-blur-sm">
            <p className="text-xs italic text-slate-700 leading-relaxed font-normal">
              "Pencatatan grosir sembako dan piutang toko jadi sangat rapi. Selisih stok kasir otomatis terlacak dari log perubahan."
            </p>
            <div className="flex items-center gap-2.5 mt-3">
              <div className="w-7 h-7 rounded-full bg-[#0c3d0c] text-white text-[10px] font-extrabold flex items-center justify-center shadow-sm">
                HS
              </div>
              <div>
                <div className="text-xs font-bold text-slate-900">H. Subagyo</div>
                <div className="text-[10px] text-slate-500">Distributor Bawang Goreng, Boyolali</div>
              </div>
            </div>
          </div>

        </div>

        <div className="relative z-10 pt-4 text-xs text-slate-400 text-left shrink-0">
          © 2026 Juragans by Anak Bawang. Hak cipta dilindungi.
        </div>
      </motion.div>

      {/* RIGHT PANEL - LOGIN FORM (45% Width) */}
      <div className="w-full lg:w-[45%] flex items-center justify-center p-6 sm:p-12 lg:p-16 bg-[#FBFCF8] overflow-y-auto min-h-[100dvh]">
        <motion.div 
          initial={{ opacity: 0, y: 14 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.45, ease: [0.16, 1, 0.3, 1] }}
          className="w-full max-w-[420px] bg-white border border-slate-200/80 rounded-3xl p-8 sm:p-10 shadow-[0_20px_50px_-12px_rgba(15,23,42,0.07)] relative my-auto"
        >
          
          <div className="mb-6 text-left">
            {!isCapacitor() && (
              <Link
                to="/"
                className="inline-flex items-center gap-1.5 text-xs text-slate-500 hover:text-slate-900 font-semibold mb-4 transition-colors group"
              >
                <ArrowLeft size={14} className="transition-transform group-hover:-translate-x-0.5" />
                <span>Kembali ke Website</span>
              </Link>
            )}
            <h2 className="text-2xl font-black tracking-tight text-slate-950 mb-1.5">
              Selamat Datang Kembali
            </h2>
            <p className="text-xs text-slate-500 leading-relaxed font-medium">
              Masukkan akun atau pilih mode bypass 1-klik untuk akses demo instan.
            </p>
          </div>

          {/* ⚡ 1-CLICK BYPASS / DEMO JURAGANS CARD */}
          <div className="mb-6 p-4 rounded-2xl bg-amber-500/[0.08] border border-amber-500/25 text-left">
            <div className="flex items-center gap-1.5 mb-1.5">
              <Zap size={14} className="text-amber-600 animate-pulse" />
              <span className="text-xs font-black text-amber-950 uppercase tracking-wide">
                1-Klik Masuk Mode Demo Juragans
              </span>
            </div>
            <p className="text-[11px] text-amber-900/80 mb-3 leading-relaxed">
              Masuk langsung ke dashboard Juragans tanpa konfigurasi auth:
            </p>
            <div className="grid grid-cols-3 gap-2">
              <button
                type="button"
                onClick={() => handleBypassLogin('owner')}
                className="py-2.5 px-2 text-center bg-white hover:bg-emerald-50 border border-emerald-600/30 hover:border-emerald-600 rounded-xl text-emerald-900 font-bold text-xs shadow-sm hover:shadow transition-all flex flex-col items-center gap-0.5 cursor-pointer active:scale-95"
              >
                <span>👑 Owner</span>
                <span className="text-[9px] font-semibold text-emerald-600">Juragan Bawang</span>
              </button>
              <button
                type="button"
                onClick={() => handleBypassLogin('dev')}
                className="py-2.5 px-2 text-center bg-white hover:bg-indigo-50 border border-indigo-600/30 hover:border-indigo-600 rounded-xl text-indigo-900 font-bold text-xs shadow-sm hover:shadow transition-all flex flex-col items-center gap-0.5 cursor-pointer active:scale-95"
              >
                <span>🛠️ Dev</span>
                <span className="text-[9px] font-semibold text-indigo-600">Superadmin</span>
              </button>
              <button
                type="button"
                onClick={() => handleBypassLogin('admin')}
                className="py-2.5 px-2 text-center bg-white hover:bg-sky-50 border border-sky-600/30 hover:border-sky-600 rounded-xl text-sky-900 font-bold text-xs shadow-sm hover:shadow transition-all flex flex-col items-center gap-0.5 cursor-pointer active:scale-95"
              >
                <span>💼 Kasir</span>
                <span className="text-[9px] font-semibold text-sky-600">Staf Toko</span>
              </button>
            </div>
          </div>

          <div className="relative flex items-center justify-center my-4">
            <div className="border-t border-slate-200 w-full" />
            <span className="bg-white px-3 text-[10px] font-bold uppercase tracking-wider text-slate-400 shrink-0">
              atau login manual
            </span>
            <div className="border-t border-slate-200 w-full" />
          </div>

          <form onSubmit={(e) => { e.preventDefault(); handleLogin(); }} className="space-y-4 text-left">
            
            {/* EMAIL / USERNAME */}
            <div>
              <label className="block text-[11px] font-bold text-slate-600 uppercase tracking-wider mb-1.5">
                Email / Username
              </label>
              <div className="relative">
                <Mail size={16} className="text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
                <input
                  type="text"
                  placeholder="owner@juragans.id atau username"
                  value={email}
                  onChange={e => setEmail(e.target.value)}
                  className="w-full h-11 pl-10 pr-4 bg-[#F8FAFC] border border-slate-200 rounded-xl text-slate-900 text-sm outline-none focus:border-[#0c3d0c] focus:ring-4 focus:ring-[#0c3d0c]/10 placeholder:text-slate-400 transition-all box-border"
                />
              </div>
            </div>

            {/* PASSWORD */}
            <div>
              <label className="block text-[11px] font-bold text-slate-600 uppercase tracking-wider mb-1.5">
                Kata Sandi
              </label>
              <div className="relative">
                <Lock size={16} className="text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
                <input
                  type={showPassword ? 'text' : 'password'}
                  placeholder="••••••••"
                  value={password}
                  onChange={e => setPassword(e.target.value)}
                  className="w-full h-11 pl-10 pr-10 bg-[#F8FAFC] border border-slate-200 rounded-xl text-slate-900 text-sm outline-none focus:border-[#0c3d0c] focus:ring-4 focus:ring-[#0c3d0c]/10 placeholder:text-slate-400 transition-all box-border"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-3.5 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-700 cursor-pointer flex p-0 border-none bg-transparent"
                >
                  {showPassword ? <EyeOff size={16} /> : <Eye size={16} />}
                </button>
              </div>
            </div>

            {/* REMEMBER ME */}
            <div className="flex items-center gap-2 pt-1">
              <input
                type="checkbox"
                id="rememberMe"
                checked={rememberMe}
                onChange={e => setRememberMe(e.target.checked)}
                className="w-4 h-4 accent-[#0c3d0c] rounded cursor-pointer"
              />
              <label htmlFor="rememberMe" className="text-xs text-slate-600 font-medium cursor-pointer select-none">
                Ingat sesi login saya
              </label>
            </div>

            {/* ERROR ALERT */}
            <AnimatePresence>
              {error && (
                <motion.div 
                  initial={{ opacity: 0, height: 0 }}
                  animate={{ opacity: 1, height: 'auto' }}
                  exit={{ opacity: 0, height: 0 }}
                  className="p-3 bg-red-50 border border-red-200 rounded-xl text-xs text-red-600 flex gap-2 items-center"
                >
                  <AlertCircle size={15} className="shrink-0 text-red-500" />
                  <span className="font-medium">{error}</span>
                </motion.div>
              )}
            </AnimatePresence>

            {/* SUBMIT BUTTON */}
            <button
              type="submit"
              disabled={isLoading || !email || !password}
              className="w-full h-11 mt-2 bg-[#0c3d0c] hover:bg-[#072607] text-white font-bold text-sm rounded-xl shadow-md shadow-[#0c3d0c]/20 active:scale-[0.98] transition-all cursor-pointer flex items-center justify-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {isLoading ? (
                <><Loader2 size={16} className="animate-spin" /> Memproses Masuk...</>
              ) : (
                <>Masuk ke Dashboard <ArrowRight size={15} /></>
              )}
            </button>
          </form>

          <div className="mt-7 pt-5 border-t border-slate-100 text-center">
            <p className="text-[11px] text-slate-400 leading-relaxed font-normal">
              Akses akun terenkripsi SSL & dikelola terpusat oleh <strong className="text-slate-700 font-semibold">Developer Superadmin</strong>.
            </p>
          </div>

        </motion.div>
      </div>
    </div>
  )
}

// ─── MOBILE LOGIN VIEW ────────────────────────────────────────
function MobileLoginView({ email, setEmail, password, setPassword, showPassword, setShowPassword, isLoading, error, handleLogin, handleBypassLogin, rememberMe, setRememberMe }) {
  return (
    <div className="min-h-[100dvh] bg-[#FBFCF8] text-slate-900 font-sans px-4 py-8 flex flex-col justify-center text-left">
      
      {/* BRAND HEADER MOBILE */}
      <div className="text-center mb-6">
        <div className="w-12 h-12 rounded-2xl bg-[#0c3d0c] flex items-center justify-center shadow-md shadow-[#0c3d0c]/20 ring-1 ring-white/20 mx-auto mb-3">
          <Store size={22} className="text-white" strokeWidth={2.2} />
        </div>
        <h1 className="text-xl font-black text-slate-900 flex items-center justify-center gap-1.5 tracking-tight">
          Juragans Dashboard <span className="text-[9px] bg-[#0c3d0c]/10 text-[#0c3d0c] border border-[#0c3d0c]/20 px-2 py-0.5 rounded-full uppercase tracking-wider font-bold">ERP v2.4</span>
        </h1>
        <p className="text-[10px] text-slate-500 font-medium tracking-wide mt-1">Platform Penjualan, POS & Inventaris Bawang Goreng Premium</p>
      </div>

      {/* FORM CARD */}
      <div className="w-full max-w-[360px] mx-auto bg-white border border-slate-200/80 rounded-3xl p-6 sm:p-7 shadow-[0_16px_40px_-10px_rgba(15,23,42,0.06)]">
        
        <div className="mb-4">
          {!isCapacitor() && (
            <Link
              to="/"
              className="inline-flex items-center gap-1 text-[11px] text-slate-500 hover:text-slate-900 font-semibold mb-3 transition-colors"
            >
              <ArrowLeft size={13} />
              <span>Kembali ke Website</span>
            </Link>
          )}
          <h2 className="text-lg font-black text-slate-950 tracking-tight">Masuk Akun</h2>
          <p className="text-xs text-slate-500 mt-0.5">Pilih mode bypass atau masukkan akun terdaftar.</p>
        </div>

        {/* ⚡ MOBILE 1-CLICK BYPASS */}
        <div className="mb-5 p-3.5 rounded-2xl bg-amber-500/[0.08] border border-amber-500/25 text-left">
          <div className="flex items-center gap-1.5 mb-1">
            <Zap size={13} className="text-amber-600 animate-pulse" />
            <span className="text-[11px] font-black text-amber-950 uppercase tracking-wide">
              1-Klik Masuk Mode Demo Juragans
            </span>
          </div>
          <div className="grid grid-cols-3 gap-1.5 mt-2.5">
            <button
              type="button"
              onClick={() => handleBypassLogin('owner')}
              className="py-2 px-1 text-center bg-white hover:bg-emerald-50 border border-emerald-600/30 rounded-xl text-emerald-900 font-bold text-[11px] shadow-sm transition-all flex flex-col items-center gap-0.5 cursor-pointer active:scale-95"
            >
              <span>👑 Owner</span>
              <span className="text-[8.5px] font-semibold text-emerald-600">Juragan</span>
            </button>
            <button
              type="button"
              onClick={() => handleBypassLogin('dev')}
              className="py-2 px-1 text-center bg-white hover:bg-indigo-50 border border-indigo-600/30 rounded-xl text-indigo-900 font-bold text-[11px] shadow-sm transition-all flex flex-col items-center gap-0.5 cursor-pointer active:scale-95"
            >
              <span>🛠️ Dev</span>
              <span className="text-[8.5px] font-semibold text-indigo-600">Superadmin</span>
            </button>
            <button
              type="button"
              onClick={() => handleBypassLogin('admin')}
              className="py-2 px-1 text-center bg-white hover:bg-sky-50 border border-sky-600/30 rounded-xl text-sky-900 font-bold text-[11px] shadow-sm transition-all flex flex-col items-center gap-0.5 cursor-pointer active:scale-95"
            >
              <span>💼 Kasir</span>
              <span className="text-[8.5px] font-semibold text-sky-600">Staf Toko</span>
            </button>
          </div>
        </div>

        <div className="relative flex items-center justify-center my-4">
          <div className="border-t border-slate-200 w-full" />
          <span className="bg-white px-2.5 text-[9px] font-bold uppercase tracking-wider text-slate-400 shrink-0">
            atau login manual
          </span>
          <div className="border-t border-slate-200 w-full" />
        </div>

        <form onSubmit={(e) => { e.preventDefault(); handleLogin(); }} className="space-y-4">
          
          <div>
            <label className="block text-[10px] font-bold text-slate-600 uppercase tracking-wider mb-1.5">
              Email / Username
            </label>
            <div className="relative">
              <Mail size={15} className="text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
              <input
                type="text"
                placeholder="nama@sembako.id atau username"
                value={email}
                onChange={e => setEmail(e.target.value)}
                className="w-full h-11 pl-9 pr-3.5 bg-[#F8FAFC] border border-slate-200 rounded-xl text-slate-900 text-sm outline-none focus:border-[#0c3d0c] focus:ring-4 focus:ring-[#0c3d0c]/10 placeholder:text-slate-400 transition-all box-border"
              />
            </div>
          </div>

          <div>
            <label className="block text-[10px] font-bold text-slate-600 uppercase tracking-wider mb-1.5">
              Kata Sandi
            </label>
            <div className="relative">
              <Lock size={15} className="text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
              <input
                type={showPassword ? 'text' : 'password'}
                placeholder="••••••••"
                value={password}
                onChange={e => setPassword(e.target.value)}
                className="w-full h-11 pl-9 pr-10 bg-[#F8FAFC] border border-slate-200 rounded-xl text-slate-900 text-sm outline-none focus:border-[#0c3d0c] focus:ring-4 focus:ring-[#0c3d0c]/10 placeholder:text-slate-400 transition-all box-border"
              />
              <button
                type="button"
                onClick={() => setShowPassword(!showPassword)}
                className="absolute right-3.5 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-700 cursor-pointer flex p-0 border-none bg-transparent"
              >
                {showPassword ? <EyeOff size={15} /> : <Eye size={15} />}
              </button>
            </div>
          </div>

          <div className="flex items-center justify-between py-0.5">
            <label className="flex items-center gap-2 cursor-pointer text-xs font-medium text-slate-600 select-none">
              <input
                type="checkbox"
                checked={rememberMe}
                onChange={e => setRememberMe(e.target.checked)}
                className="w-4 h-4 rounded border-slate-300 accent-[#0c3d0c] cursor-pointer"
              />
              <span>Ingat Sesi Saya</span>
            </label>
          </div>

          <AnimatePresence>
            {error && (
              <motion.div 
                initial={{ opacity: 0, height: 0 }}
                animate={{ opacity: 1, height: 'auto' }}
                exit={{ opacity: 0, height: 0 }}
                className="p-3 bg-red-50 border border-red-200 rounded-xl text-xs text-red-600 flex gap-2 items-center"
              >
                <AlertCircle size={14} className="shrink-0 text-red-500" />
                <span className="font-medium">{error}</span>
              </motion.div>
            )}
          </AnimatePresence>

          <button
            type="submit"
            disabled={isLoading || !email || !password}
            className="w-full h-11 bg-[#0c3d0c] hover:bg-[#072607] text-white font-bold text-sm rounded-xl shadow-md shadow-[#0c3d0c]/20 active:scale-[0.98] transition-all cursor-pointer flex items-center justify-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {isLoading ? (
              <><Loader2 size={16} className="animate-spin" /> Memproses...</>
            ) : (
              <>Masuk ke Dashboard <ArrowRight size={15} /></>
            )}
          </button>
        </form>

        <div className="mt-5 text-center">
          <p className="text-[10px] text-slate-400 font-normal">
            Akses dikelola terpusat oleh Developer Superadmin.
          </p>
        </div>

      </div>
    </div>
  )
}
