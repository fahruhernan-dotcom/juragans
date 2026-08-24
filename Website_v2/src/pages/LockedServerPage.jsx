import React from 'react'
import { ShieldAlert, LogOut, MessageSquare, Lock, Building2, Calendar, CreditCard, ExternalLink } from 'lucide-react'
import { useAuth } from '@/lib/hooks/useAuth'
import { WA_URL } from '@/lib/constants/contact'
import { getSubscriptionStatus, getExpiryLabel } from '@/lib/subscriptionUtils'

export default function LockedServerPage() {
  const { logout, tenant, profile } = useAuth()

  const subStatus = getSubscriptionStatus(tenant)
  const businessName = tenant?.business_name || tenant?.name || profile?.business_name || 'Toko Sembako'

  const handleContactDev = () => {
    const message = encodeURIComponent(
      `Halo, saya ingin mengaktifkan kembali lisensi server Sembako OS untuk bisnis: ${businessName}`
    )
    window.open(`${WA_URL}?text=${message}`, '_blank')
  }

  // Extract day or date
  let cycleText = 'Setiap Tanggal 28'
  if (tenant?.plan_expires_at) {
    try {
      const d = new Date(tenant.plan_expires_at)
      cycleText = `Tanggal ${d.getDate()} (${d.toLocaleDateString('id-ID', { month: 'long', year: 'numeric' })})`
    } catch {
      /* fallback */
    }
  }

  return (
    <div className="dark dark-preserve min-h-screen w-full bg-[#080C14] text-slate-100 flex items-center justify-center p-4 sm:p-6 relative overflow-hidden font-sans select-none">
      {/* Background Decorative Glow Effects */}
      <div className="absolute top-1/4 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[500px] h-[500px] bg-red-600/15 rounded-full blur-[120px] pointer-events-none" />
      <div className="absolute bottom-10 right-10 w-[350px] h-[350px] bg-amber-500/10 rounded-full blur-[100px] pointer-events-none" />
      <div className="absolute top-10 left-10 w-[300px] h-[300px] bg-blue-600/10 rounded-full blur-[100px] pointer-events-none" />

      {/* Subtle Background Grid */}
      <div 
        className="absolute inset-0 bg-[linear-gradient(to_right,#ffffff05_1px,transparent_1px),linear-gradient(to_bottom,#ffffff05_1px,transparent_1px)] bg-[size:32px_32px] pointer-events-none" 
      />

      {/* Main Locked Card */}
      <div className="w-full max-w-lg bg-[#0F172A]/90 backdrop-blur-xl border border-red-500/30 rounded-3xl p-6 sm:p-8 shadow-[0_25px_70px_-15px_rgba(239,68,68,0.25)] relative z-10 space-y-6">
        
        {/* Top Header Badge & Lock Icon */}
        <div className="flex flex-col items-center text-center space-y-4">
          <div className="relative">
            <div className="w-20 h-20 rounded-2xl bg-gradient-to-br from-red-500/20 to-amber-500/10 border border-red-500/30 flex items-center justify-center shadow-xl shadow-red-950/50">
              <ShieldAlert className="w-10 h-10 text-red-500 animate-pulse" />
            </div>
            <div className="absolute -bottom-1 -right-1 bg-red-600 text-white p-1.5 rounded-full border-2 border-[#0F172A] shadow-md">
              <Lock className="w-3.5 h-3.5" />
            </div>
          </div>

          <div className="space-y-2">
            <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold bg-red-500/10 text-red-400 border border-red-500/25">
              <span className="w-2 h-2 rounded-full bg-red-500 animate-ping" />
              Akses Server Nonaktif
            </div>
            
            <h1 className="text-2xl sm:text-3xl font-extrabold text-white tracking-tight">
              Masa Aktif Server Berakhir
            </h1>
            
            <p className="text-sm text-slate-300 leading-relaxed max-w-md mx-auto font-medium">
              Akses ke sistem &amp; dashboard <span className="text-amber-400 font-bold">{businessName}</span> telah dinonaktifkan sementara karena masa aktif lisensi bulanan telah selesai.
            </p>
          </div>
        </div>

        {/* Subscription Info Panel */}
        <div className="bg-slate-950/70 border border-slate-800/80 rounded-2xl p-4 sm:p-5 space-y-3">
          <div className="flex items-center justify-between text-xs sm:text-sm pb-2 border-b border-slate-800/80">
            <span className="text-slate-400 font-medium flex items-center gap-2">
              <Building2 className="w-4 h-4 text-slate-500" />
              Nama Bisnis / Toko
            </span>
            <span className="text-slate-100 font-bold truncate max-w-[200px] text-right">
              {businessName}
            </span>
          </div>

          <div className="flex items-center justify-between text-xs sm:text-sm pb-2 border-b border-slate-800/80">
            <span className="text-slate-400 font-medium flex items-center gap-2">
              <CreditCard className="w-4 h-4 text-slate-500" />
              Tipe Layanan
            </span>
            <span className="text-slate-100 font-bold uppercase text-[11px] px-2.5 py-0.5 rounded-md bg-slate-800 border border-slate-700 text-amber-300">
              {subStatus.plan ? `Langganan ${subStatus.plan}` : 'Langganan Bulanan'} Sembako OS
            </span>
          </div>

          {subStatus.licenseActivatedAt && (
            <div className="flex items-center justify-between text-xs sm:text-sm pb-2 border-b border-slate-800/80">
              <span className="text-slate-400 font-medium flex items-center gap-2">
                <Calendar className="w-4 h-4 text-slate-500" />
                Tanggal Aktif
              </span>
              <span className="text-slate-200 font-semibold">
                {subStatus.licenseActivatedAt.toLocaleDateString('id-ID', { day: '2-digit', month: 'long', year: 'numeric' })}
              </span>
            </div>
          )}

          {subStatus.expiresAt && (
            <div className="flex items-center justify-between text-xs sm:text-sm pb-2 border-b border-slate-800/80">
              <span className="text-slate-400 font-medium flex items-center gap-2">
                <Calendar className="w-4 h-4 text-slate-500" />
                Tanggal Expired
              </span>
              <span className="text-amber-400 font-bold">
                {subStatus.expiresAt.toLocaleDateString('id-ID', { day: '2-digit', month: 'long', year: 'numeric' })}
              </span>
            </div>
          )}

          {subStatus.graceExpiresAt && (
            <div className="flex items-center justify-between text-xs sm:text-sm pb-2 border-b border-slate-800/80">
              <span className="text-slate-400 font-medium flex items-center gap-2">
                <Calendar className="w-4 h-4 text-slate-500" />
                Masa Tenggang (Grace)
              </span>
              <span className="text-rose-400 font-semibold">
                Sampai {subStatus.graceExpiresAt.toLocaleDateString('id-ID', { day: '2-digit', month: 'long', year: 'numeric' })}
              </span>
            </div>
          )}

          <div className="flex items-center justify-between text-xs sm:text-sm pt-0.5">
            <span className="text-slate-400 font-medium flex items-center gap-2">
              <Lock className="w-4 h-4 text-slate-500" />
              Status Akses
            </span>
            <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-xs font-bold bg-red-500/20 text-red-400 border border-red-500/30">
              Terkunci 🔒 (Masa Tenggang Selesai)
            </span>
          </div>
        </div>

        {/* Action Buttons */}
        <div className="space-y-3 pt-1">
          <button
            onClick={handleContactDev}
            className="w-full h-12 bg-gradient-to-r from-emerald-500 via-emerald-600 to-teal-600 hover:from-emerald-400 hover:to-teal-500 text-white font-bold text-sm rounded-xl shadow-lg shadow-emerald-900/40 transition-all transform hover:scale-[1.01] active:scale-[0.99] cursor-pointer flex items-center justify-center gap-2.5"
          >
            <MessageSquare className="w-4 h-4 fill-white/20 text-white" />
            <span>Hubungi Developer via WhatsApp</span>
            <ExternalLink className="w-3.5 h-3.5 opacity-70" />
          </button>

          <button
            onClick={logout}
            className="w-full h-11 bg-slate-800/80 hover:bg-slate-700/80 border border-slate-700/80 text-slate-200 hover:text-white font-semibold text-sm rounded-xl transition-all transform hover:scale-[1.01] active:scale-[0.99] cursor-pointer flex items-center justify-center gap-2"
          >
            <LogOut className="w-4 h-4 text-slate-400" />
            <span>Keluar / Ganti Akun</span>
          </button>
        </div>

        {/* Footer Note */}
        <div className="text-center pt-2 border-t border-slate-800/80">
          <p className="text-xs text-slate-400 leading-relaxed font-medium">
            Untuk mengaktifkan kembali server dan membuka akses data, silakan hubungi tim Developer.
          </p>
        </div>

      </div>
    </div>
  )
}

