import { useState, useMemo, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { motion, AnimatePresence } from 'framer-motion'
import { 
  ArrowLeft, Building2, Plus, Sparkles, CheckCircle2, 
  Loader2, Copy, ShieldCheck, Rocket, Zap
} from 'lucide-react'
import { useAuth } from '@/lib/hooks/useAuth'
import { usePlanConfigs, useCreateInvoice, usePaymentSettings } from '@/lib/hooks/useAdminData'
import { formatIDR } from '@/lib/format'
import { toast } from 'sonner'
import { checkQuotaUsage } from '@/lib/quotaUtils'

export default function AddonPortal() {
  const navigate = useNavigate()
  const { profile, profiles, tenant, isSuperadmin } = useAuth()
  const { data: configs } = usePlanConfigs()
  const { data: banks } = usePaymentSettings()
  const createInvoice = useCreateInvoice()

  const [invoiceResult, setInvoiceResult] = useState(null)
  const [copied, setCopied] = useState(null)

  const [quota, setQuota] = useState({ usage: 0, limit: 0, canAdd: false })
  const [fetching, setFetching] = useState(true)

  // Fetch quota using centralized utility
  useEffect(() => {
    async function loadQuota() {
      if (!tenant || !profile) return
      const res = await checkQuotaUsage(tenant, profile, 'business')
      setQuota(res)
      setFetching(false)
    }
    loadQuota()
  }, [tenant, profile, profiles])

  // Get price from admin config
  const slotPrice = useMemo(() => {
    return configs?.addon_pricing?.business_slot_price || 150000
  }, [configs])

  const currentPlan = isSuperadmin ? 'business' : (tenant?.plan || 'starter')
  const totalLimit = quota.limit
  const currentUsage = quota.usage
  const hasQuota = quota.canAdd

  const activeBanks = banks?.filter(b => b.is_active && b.bank_name !== 'xendit_config') || []

  const handlePurchase = async () => {
    if (!profile?.tenant_id) return
    try {
      const { invoiceNumber } = await createInvoice.mutateAsync({
        tenantId: profile.tenant_id,
        plan: 'addon_business_slot',
        billingMonths: 1,
        amount: slotPrice,
        notes: `Pembelian 1 Slot Bisnis Tambahan (Add-on Multi-Tenant)`,
      })
      setInvoiceResult(invoiceNumber)
    } catch (_) { /* handled by mutation */ }
  }

  const copyToClipboard = (text, id) => {
    navigator.clipboard.writeText(text)
    setCopied(id)
    toast.success('Disalin!')
    setTimeout(() => setCopied(null), 2000)
  }

  if (invoiceResult) {
    return (
      <div className="min-h-screen flex items-center justify-center p-6 bg-[#06090F]">
        <motion.div
          initial={{ scale: 0.95, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          className="w-full max-w-md bg-[#0C1319] border border-white/10 rounded-[40px] p-8 shadow-2xl relative overflow-hidden"
        >
          <div className="absolute inset-0 bg-gradient-to-br from-emerald-500/5 via-transparent to-transparent opacity-50" />
          <div className="relative z-10 text-center mb-8">
            <div className="w-20 h-20 rounded-full bg-emerald-500/10 border-2 border-emerald-500/30 flex items-center justify-center mx-auto mb-6 shadow-[0_0_30px_rgba(2, 26, 2,0.2)]">
              <CheckCircle2 size={40} className="text-emerald-500" />
            </div>
            <h2 className="text-2xl font-black text-white uppercase tracking-tight">Tagihan Dibuat!</h2>
            <p className="text-[#4B6478] text-sm mt-2">Segera selesaikan pembayaran untuk menambah slot bisnis bapak.</p>
          </div>
          <div className="relative z-10 space-y-4 mb-8">
            <div className="p-4 rounded-2xl bg-black/40 border border-white/5 flex items-center justify-between">
              <div>
                <p className="text-[10px] font-black text-[#4B6478] uppercase tracking-widest mb-1">Invoice</p>
                <p className="font-mono font-bold text-emerald-400">{invoiceResult}</p>
              </div>
              <button onClick={() => copyToClipboard(invoiceResult, 'inv')} className="p-2 text-[#4B6478] hover:text-white">
                <Copy size={16} />
              </button>
            </div>
            <div className="p-5 rounded-2xl bg-emerald-500/5 border border-emerald-500/10">
              <div className="flex justify-between items-center mb-4">
                <span className="text-sm text-[#4B6478]">Total Transfer:</span>
                <span className="text-xl font-black text-white">{formatIDR(slotPrice)}</span>
              </div>
              <div className="space-y-3">
                {activeBanks.map(bank => (
                  <div key={bank.id} className="p-3 rounded-xl bg-black/20 border border-white/5 flex items-center justify-between">
                    <div>
                      <p className="text-[10px] font-bold text-[#4B6478] uppercase">{bank.bank_name}</p>
                      <p className="text-sm font-bold text-white">{bank.account_number}</p>
                    </div>
                    <button onClick={() => copyToClipboard(bank.account_number, bank.id)} className="p-2 text-[#4B6478]">
                      {copied === bank.id ? <CheckCircle2 size={14} className="text-emerald-400" /> : <Copy size={14} />}
                    </button>
                  </div>
                ))}
              </div>
            </div>
          </div>
          <button onClick={() => navigate(-1)} className="w-full py-4 text-[#4B6478] hover:text-white text-sm font-bold flex items-center justify-center gap-2">
            <ArrowLeft size={16} /> Kembali ke Dashboard
          </button>
        </motion.div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-[#06090F] pt-8 px-4 pb-20">
      <div className="max-w-2xl mx-auto">
        <button onClick={() => navigate(-1)} className="flex items-center gap-2 text-[#4B6478] hover:text-white transition-colors mb-8">
          <ArrowLeft size={18} /> Kembali
        </button>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-8 items-center mb-12">
          <div>
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-purple-500/10 border border-purple-500/20 text-purple-400 text-[10px] font-black uppercase tracking-widest mb-4">
              <Sparkles size={12} /> Multi-Tenant Add-on
            </div>
            <h1 className="text-4xl font-black text-white uppercase tracking-tighter leading-none mb-4">
              Tambah Bisnis <br /> Tanpa Batas.
            </h1>
            <p className="text-[#94A3B8] text-lg leading-relaxed">
              Kelola berbagai unit usaha bapak dalam satu akun TernakOS. Setiap bisnis terpisah, profesional, dan rapi.
            </p>
          </div>

          <div className="relative bg-[#0C1319] border border-white/10 rounded-[40px] p-8 shadow-2xl overflow-hidden">
            <div className="absolute top-0 right-0 p-4">
               <div className="px-3 py-1 rounded-full bg-white/5 border border-white/5 text-[10px] font-black text-[#4B6478] uppercase tracking-widest">
                  Status: {fetching ? '...' : `${currentUsage}/${totalLimit}`} Slot
               </div>
            </div>

            <div className="flex items-center gap-4 mb-8">
              <div className="w-14 h-14 rounded-2xl bg-purple-500/20 flex items-center justify-center text-purple-400 border border-purple-500/30">
                <Building2 size={28} />
              </div>
              <div>
                <p className="text-[10px] font-black text-[#4B6478] uppercase tracking-widest">Harga Per Slot</p>
                <p className="text-2xl font-black text-white">{formatIDR(slotPrice)}</p>
              </div>
            </div>

            <div className="space-y-4 mb-8">
              {hasQuota ? (
                <div className="p-4 rounded-2xl bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 flex gap-3 items-start">
                  <Zap size={18} className="shrink-0 mt-0.5" />
                  <p className="text-xs font-bold leading-relaxed">
                    Bapak masih punya jatah **{totalLimit - currentUsage} bisnis gratis** dari paket {currentPlan.toUpperCase()} Bapak.
                  </p>
                </div>
              ) : (
                <div className="p-4 rounded-2xl bg-amber-500/10 border border-amber-500/20 text-amber-500 flex gap-3 items-start animate-pulse">
                  <Rocket size={18} className="shrink-0 mt-0.5" />
                  <p className="text-xs font-bold leading-relaxed">
                    Jatah bisnis paket {currentPlan.toUpperCase()} bapak sudah penuh ({currentUsage}/{totalLimit}). Beli slot tambahan untuk lanjut.
                  </p>
                </div>
              )}
              <div className="flex items-center gap-3 text-sm text-[#94A3B8]">
                <CheckCircle2 size={18} className="text-emerald-400 shrink-0" />
                <span>Satu Akun, Banyak Dashboard Bisnis</span>
              </div>
              <div className="flex items-center gap-3 text-sm text-[#94A3B8]">
                <CheckCircle2 size={18} className="text-emerald-400 shrink-0" />
                <span>Data & Laporan Terpisah Tiap Bisnis</span>
              </div>
            </div>

            {hasQuota ? (
              <button
                onClick={() => navigate('/onboarding?mode=new_business')}
                className="w-full bg-emerald-500 hover:bg-emerald-600 text-white h-16 rounded-[24px] font-black uppercase text-sm tracking-widest transition-all shadow-[0_10px_30px_rgba(2, 26, 2,0.3)] flex items-center justify-center gap-3 active:scale-[0.98]"
              >
                 <Rocket size={20} /> Pakai Jatah Gratis
              </button>
            ) : (
              <button
                onClick={handlePurchase}
                disabled={createInvoice.isPending}
                className="w-full bg-purple-500 hover:bg-purple-600 text-white h-16 rounded-[24px] font-black uppercase text-sm tracking-widest transition-all shadow-[0_10px_30px_rgba(168,85,247,0.3)] flex items-center justify-center gap-3 disabled:opacity-50"
              >
                {createInvoice.isPending ? <Loader2 className="animate-spin" /> : <><Plus size={20} /> Beli Slot Sekarang</>}
              </button>
            )}
          </div>
        </div>

        {/* Benefits Grid */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <div className="p-6 rounded-3xl bg-white/[0.02] border border-white/5">
            <ShieldCheck className="text-emerald-400 mb-4" />
            <h3 className="font-bold text-white mb-2 uppercase text-sm">Keamanan Data</h3>
            <p className="text-xs text-[#4B6478] leading-relaxed">Data antar bisnis bapak dijamin terisolasi dan tidak akan bercampur satu sama lain.</p>
          </div>
          <div className="p-6 rounded-3xl bg-white/[0.02] border border-white/5">
            <Rocket className="text-amber-400 mb-4" />
            <h3 className="font-bold text-white mb-2 uppercase text-sm">Cepat & Ringan</h3>
            <p className="text-xs text-[#4B6478] leading-relaxed">Pindah dashboard antar bisnis hanya butuh 1 klik, tanpa perlu login ulang.</p>
          </div>
          <div className="p-6 rounded-3xl bg-white/[0.02] border border-white/5">
            <Zap className="text-purple-400 mb-4" />
            <h3 className="font-bold text-white mb-2 uppercase text-sm">Sistem Add-on</h3>
            <p className="text-xs text-[#4B6478] leading-relaxed">Beli sesuai kebutuhan. Tidak perlu bayar paket mahal jika bapak hanya butuh slot baru.</p>
          </div>
        </div>
      </div>
    </div>
  )
}
