import React, { useState, useMemo } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import {
  Users,
  Search,
  Plus,
  Mail,
  Phone,
  MapPin,
  Star,
  Globe,
  ExternalLink,
  Send,
  CheckCircle2,
  Clock,
  AlertCircle,
  Filter,
  Trash2,
  Edit3,
  Bot,
  RefreshCw,
  Sparkles,
  Layers,
  ArrowUpRight,
  Calculator,
  Store,
  ChevronRight,
  TrendingUp,
  Building2,
  Sliders,
  Power,
  Zap,
  ShieldCheck,
  Radio,
  Play,
  Loader2,
  X
} from 'lucide-react'
import {
  useB2BLeads,
  useB2BScrapingQueue,
  useCreateB2BLead,
  useUpdateB2BLead,
  useDeleteB2BLead,
  useCreateScrapingQueueItem,
  useB2BSettings,
  useUpdateB2BSettings
} from '@/lib/hooks/useSembakoData'
import { SembakoPageHeader } from '@/dashboard/broker/sembako_broker/components/SembakoPageHeader'
import { SembakoSummaryStrip } from '@/dashboard/broker/sembako_broker/components/SembakoSummaryStrip'
import { useMediaQuery } from '@/lib/hooks/useMediaQuery'
import { Sheet, SheetContent, SheetHeader, SheetTitle, SheetDescription } from '@/components/ui/sheet'
import { toast } from 'sonner'
import { formatIDR } from '@/lib/format'

export default function B2BLeadsOutreachPage() {
  const isDesktop = useMediaQuery('(min-width: 1024px)')
  const { data: leads = [], isLoading, refetch } = useB2BLeads()
  const { data: queue = [], refetch: refetchQueue } = useB2BScrapingQueue()
  const { data: settings, refetch: refetchSettings } = useB2BSettings()

  const createLeadMut = useCreateB2BLead()
  const updateLeadMut = useUpdateB2BLead()
  const deleteLeadMut = useDeleteB2BLead()
  const createQueueMut = useCreateScrapingQueueItem()
  const updateSettingsMut = useUpdateB2BSettings()

  const [activeTab, setActiveTab] = useState('leads') // 'leads' | 'queue' | 'sample_calculator'
  const [search, setSearch] = useState('')
  const [statusFilter, setStatusFilter] = useState('all') // 'all' | 'pending' | 'sent' | 'replied'
  const [cityFilter, setCityFilter] = useState('all')
  const [countryTabFilter, setCountryTabFilter] = useState('all') // 'all' | 'Indonesia' | 'Singapore'

  // Webhook State
  const [isTriggeringWebhook, setIsTriggeringWebhook] = useState(false)
  const [webhookMode, setWebhookMode] = useState('prod') // 'prod' | 'test'

  // Modals
  const [leadModalOpen, setLeadModalOpen] = useState(false)
  const [editingLead, setEditingLead] = useState(null)
  const [queueModalOpen, setQueueModalOpen] = useState(false)
  const [selectedLeadForPitch, setSelectedLeadForPitch] = useState(null)

  // Form Lead State
  const [formName, setFormName] = useState('')
  const [formCleanName, setFormCleanName] = useState('')
  const [formCategory, setFormCategory] = useState('Indonesian restaurant')
  const [formCountry, setFormCountry] = useState('Indonesia')
  const [formCity, setFormCity] = useState('Surakarta')
  const [formAddress, setFormAddress] = useState('')
  const [formEmail, setFormEmail] = useState('')
  const [formPhone, setFormPhone] = useState('')
  const [formWebsite, setFormWebsite] = useState('')
  const [formRating, setFormRating] = useState('4.5')
  const [formReviewCount, setFormReviewCount] = useState('50')
  const [formPriority, setFormPriority] = useState('hot')
  const [formStatusEmail, setFormStatusEmail] = useState('pending')
  const [formNotes, setFormNotes] = useState('')

  // Queue Form State
  const [qLocation, setQLocation] = useState('')
  const [qCountry, setQCountry] = useState('Indonesia')
  const [qNotes, setQNotes] = useState('')

  // Sample Pack Calculator State
  const [sampleHpp, setSampleHpp] = useState(15000) // HPP 100g sample pack
  const [sampleCourier, setSampleCourier] = useState(12000) // Ongkir lokal Solo/Jateng
  const [targetConversionRate, setTargetConversionRate] = useState(25) // 25% order batch
  const [trialBatchKg, setTrialBatchKg] = useState(10) // 10kg trial
  const [trialWholesalePrice, setTrialWholesalePrice] = useState(135000) // Rp 135.000 / kg
  const [trialHppKg, setTrialHppKg] = useState(112000) // Rp 112.000 / kg

  // Current active settings with safe fallbacks
  const currentCountry = settings?.active_target_country || 'Indonesia'
  const currentRegion = settings?.active_target_region || 'Solo Raya'
  const isEngineActive = settings?.is_auto_outreach_active !== false
  const currentLimit = settings?.daily_email_limit || 10
  const isSampleOffered = settings?.offer_tasting_sample !== false

  const handleUpdateSetting = async (field, val) => {
    try {
      await updateSettingsMut.mutateAsync({ [field]: val })
    } catch (e) {
      // handled
    }
  }

  // Trigger n8n Webhook
  const handleTriggerN8nWebhook = async () => {
    const prodUrl = import.meta.env.VITE_N8N_WEBHOOK_PROD_URL || 'https://n8n-2ccbyak1l3x6.jkt2.sumopod.my.id/webhook/ed8c6de6-78a5-4fdc-bc07-698f6c03a9f3'
    const testUrl = import.meta.env.VITE_N8N_WEBHOOK_TEST_URL || 'https://n8n-2ccbyak1l3x6.jkt2.sumopod.my.id/webhook-test/ed8c6de6-78a5-4fdc-bc07-698f6c03a9f3'
    const targetUrl = webhookMode === 'test' ? testUrl : prodUrl

    setIsTriggeringWebhook(true)
    try {
      const response = await fetch(targetUrl, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          country: currentCountry,
          region: currentRegion,
          action: 'trigger_outreach_and_scrape',
          source: 'Juragan Web Dashboard',
          timestamp: new Date().toISOString()
        })
      })

      if (response.ok) {
        toast.success(`⚡ Bot n8n (${webhookMode.toUpperCase()}) berhasil dipicu! Memproses antrean...`)
        setTimeout(() => {
          refetch()
          refetchQueue()
        }, 3000)
      } else {
        toast.error(`Webhook n8n merespons status ${response.status}. Pastikan workflow aktif.`)
      }
    } catch (err) {
      toast.error(`Gagal memanggil webhook n8n: ${err.message}`)
    } finally {
      setIsTriggeringWebhook(false)
    }
  }

  const cities = useMemo(() => {
    const set = new Set(leads.map(l => l.city).filter(Boolean))
    return ['all', ...Array.from(set)]
  }, [leads])

  const filteredLeads = useMemo(() => {
    return leads.filter(l => {
      if (countryTabFilter !== 'all' && l.country?.toLowerCase() !== countryTabFilter.toLowerCase()) return false
      if (statusFilter !== 'all' && l.status_email !== statusFilter) return false
      if (cityFilter !== 'all' && l.city !== cityFilter) return false
      if (search) {
        const q = search.toLowerCase()
        const matchName = l.name?.toLowerCase().includes(q) || l.clean_name?.toLowerCase().includes(q)
        const matchEmail = l.email?.toLowerCase().includes(q)
        const matchAddr = l.address?.toLowerCase().includes(q)
        if (!matchName && !matchEmail && !matchAddr) return false
      }
      return true
    })
  }, [leads, countryTabFilter, statusFilter, cityFilter, search])

  const stats = useMemo(() => {
    const total = leads.length
    const indoTotal = leads.filter(l => (l.country || '').toLowerCase() === 'indonesia').length
    const sgTotal = leads.filter(l => (l.country || '').toLowerCase() === 'singapore').length
    const hot = leads.filter(l => l.lead_priority === 'hot').length
    const sent = leads.filter(l => l.status_email === 'sent').length
    const replied = leads.filter(l => l.status_email === 'replied').length
    const hasEmail = leads.filter(l => l.email && l.email.includes('@')).length
    return { total, indoTotal, sgTotal, hot, sent, replied, hasEmail }
  }, [leads])

  const summaryItems = [
    { label: 'Total Prospek Kuliner', value: stats.total, color: 'amber', subLabel: `${stats.indoTotal} Indo · ${stats.sgTotal} SG` },
    { label: 'Hot Leads Prioritas', value: stats.hot, color: 'red', subLabel: 'Kategori Restoran Utama' },
    { label: 'Outreach Terkirim', value: `${stats.sent} email`, color: 'green', subLabel: `${stats.hasEmail} kontak valid` },
    { label: 'Respon / Balasan', value: stats.replied, color: 'default', subLabel: 'Tindak lanjut negosiasi' },
  ]

  const openAddLead = () => {
    setEditingLead(null)
    setFormName('')
    setFormCleanName('')
    setFormCategory('Indonesian restaurant')
    setFormCountry(currentCountry === 'Singapore' ? 'Singapore' : 'Indonesia')
    setFormCity(currentCountry === 'Singapore' ? 'Singapore' : 'Surakarta')
    setFormAddress('')
    setFormEmail('')
    setFormPhone('')
    setFormWebsite('')
    setFormRating('4.5')
    setFormReviewCount('50')
    setFormPriority('hot')
    setFormStatusEmail('pending')
    setFormNotes('')
    setLeadModalOpen(true)
  }

  const openEditLead = (l) => {
    setEditingLead(l)
    setFormName(l.name || '')
    setFormCleanName(l.clean_name || '')
    setFormCategory(l.category || 'Indonesian restaurant')
    setFormCountry(l.country || 'Indonesia')
    setFormCity(l.city || 'Surakarta')
    setFormAddress(l.address || '')
    setFormEmail(l.email || '')
    setFormPhone(l.phone || '')
    setFormWebsite(l.website || '')
    setFormRating(String(l.rating || '4.5'))
    setFormReviewCount(String(l.review_count || '0'))
    setFormPriority(l.lead_priority || 'warm')
    setFormStatusEmail(l.status_email || 'pending')
    setFormNotes(l.notes || '')
    setLeadModalOpen(true)
  }

  const handleSaveLead = async (e) => {
    e.preventDefault()
    if (!formName.trim()) {
      toast.error('Nama bisnis/restoran wajib diisi')
      return
    }

    const payload = {
      name: formName.trim(),
      clean_name: formCleanName.trim() || formName.trim(),
      category: formCategory,
      country: formCountry,
      city: formCity,
      address: formAddress.trim() || null,
      email: formEmail.trim().toLowerCase() || null,
      phone: formPhone.trim() || null,
      website: formWebsite.trim() || null,
      rating: parseFloat(formRating) || 4.5,
      review_count: parseInt(formReviewCount, 10) || 0,
      lead_priority: formPriority,
      status_email: formStatusEmail,
      notes: formNotes.trim() || null,
      email_source: editingLead ? editingLead.email_source : 'manual_input'
    }

    try {
      if (editingLead?.id) {
        await updateLeadMut.mutateAsync({ id: editingLead.id, ...payload })
      } else {
        await createLeadMut.mutateAsync(payload)
      }
      setLeadModalOpen(false)
    } catch (err) {
      // handled by mutation
    }
  }

  const handleDeleteLead = async (id, name) => {
    if (window.confirm(`Hapus prospek "${name}"?`)) {
      await deleteLeadMut.mutateAsync(id)
    }
  }

  const handleCreateQueue = async (e) => {
    e.preventDefault()
    if (!qLocation.trim()) {
      toast.error('Lokasi target scraping wajib diisi')
      return
    }
    await createQueueMut.mutateAsync({
      target_location: qLocation.trim(),
      country: qCountry,
      city_or_region: qLocation.trim(),
      status: 'pending',
      notes: qNotes.trim() || null
    })
    setQLocation('')
    setQNotes('')
    setQueueModalOpen(false)
  }

  // Sample Pack ROI Math Logic
  const sampleUnitCostTotal = Number(sampleHpp) + Number(sampleCourier)
  const trialBatchRevenue = Number(trialBatchKg) * Number(trialWholesalePrice)
  const trialBatchProfit = Number(trialBatchKg) * (Number(trialWholesalePrice) - Number(trialHppKg))
  const expectedProfitPer10Samples = (10 * (targetConversionRate / 100) * trialBatchProfit) - (10 * sampleUnitCostTotal)

  return (
    <div className="min-h-screen bg-[#F8FAFC] text-slate-900 pb-[max(140px,calc(110px+env(safe-area-inset-bottom,24px)))] text-left">
      {/* Header Standard Juragan */}
      <SembakoPageHeader
        title="B2B Leads & Outreach Engine"
        subtitle="Kelola prospek restoran kuliner (Solo Raya, Domestik & Ekspor), kontrol sakelar bot n8n, dan picu webhook otomatis."
        isDesktop={isDesktop}
        searchQuery={search}
        onSearchChange={setSearch}
        searchPlaceholder="Cari resto, menu, alamat, email..."
        actionButton={
          <div className="flex items-center gap-2">
            <button
              onClick={() => { refetch(); refetchQueue(); refetchSettings(); }}
              className="p-2 rounded-xl bg-white hover:bg-slate-50 border border-slate-200 text-slate-600 shadow-sm transition"
              title="Refresh Data"
            >
              <RefreshCw size={15} />
            </button>

            {/* Direct Trigger n8n Button */}
            <button
              onClick={handleTriggerN8nWebhook}
              disabled={isTriggeringWebhook}
              className="flex items-center gap-1.5 px-3.5 h-9 rounded-xl text-xs font-bold bg-purple-600 hover:bg-purple-500 text-white shadow-sm transition active:scale-95 disabled:opacity-50"
              title="Picu Webhook n8n Langsung"
            >
              {isTriggeringWebhook ? (
                <>
                  <Loader2 size={14} className="animate-spin" />
                  <span>Memproses...</span>
                </>
              ) : (
                <>
                  <Zap size={14} className="fill-amber-300 text-amber-300" />
                  <span>Picu n8n</span>
                </>
              )}
            </button>

            <button
              onClick={() => setQueueModalOpen(true)}
              className="flex items-center gap-1.5 px-3 h-9 rounded-xl text-xs font-bold bg-white hover:bg-slate-50 border border-slate-200 text-slate-700 shadow-sm transition"
            >
              <Bot size={14} className="text-amber-500" />
              <span className="hidden sm:inline">Antrean Scraper</span>
            </button>
            <button
              onClick={openAddLead}
              className="flex items-center gap-1.5 px-4 h-9 rounded-xl text-xs font-bold bg-amber-500 hover:bg-amber-400 text-slate-950 shadow-sm transition active:scale-95"
            >
              <Plus size={15} />
              <span>Tambah Prospek</span>
            </button>
          </div>
        }
      />

      <div className="mx-auto max-w-7xl px-4 sm:px-6">
        {/* KPI Strip */}
        <SembakoSummaryStrip items={summaryItems} />

        {/* 🎛️ SAKELAR KONTROL OUTREACH ENGINE n8n (Live Control Card with Webhook) */}
        <div className="bg-white border border-slate-200/90 rounded-2xl p-4 shadow-sm mb-5">
          <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4">
            {/* Engine Status & Title */}
            <div className="flex items-start gap-3">
              <div className={`p-2.5 rounded-xl border ${
                isEngineActive 
                  ? 'bg-emerald-50 text-emerald-700 border-emerald-200' 
                  : 'bg-slate-100 text-slate-500 border-slate-200'
              }`}>
                <Sliders size={18} />
              </div>
              <div>
                <div className="flex items-center gap-2 flex-wrap">
                  <h3 className="font-bold text-sm text-slate-900">Sakelar Kontrol Engine Outreach n8n</h3>
                  <span className={`px-2 py-0.5 rounded-full text-[10px] font-bold border ${
                    isEngineActive
                      ? 'bg-emerald-50 text-emerald-700 border-emerald-200 flex items-center gap-1'
                      : 'bg-slate-100 text-slate-600 border-slate-200'
                  }`}>
                    {isEngineActive ? <><span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse"></span> Engine Aktif</> : '⏸️ Engine Dijeda'}
                  </span>
                </div>
                <p className="text-xs text-slate-500 mt-0.5">
                  Pengaturan ini tersinkronisasi ke n8n. Klik <strong>Picu Bot n8n</strong> untuk menjalankan webhook sekarang juga.
                </p>
              </div>
            </div>

            {/* Quick Switch Actions & Trigger */}
            <div className="flex items-center gap-2.5 flex-wrap">
              {/* Target Country Switcher */}
              <div className="flex items-center bg-slate-50 p-1 rounded-xl border border-slate-200 text-xs">
                <span className="px-2 text-slate-500 font-semibold text-[11px]">Target:</span>
                <button
                  onClick={() => handleUpdateSetting('active_target_country', 'Indonesia')}
                  className={`px-3 py-1.5 rounded-lg font-bold transition ${
                    currentCountry === 'Indonesia'
                      ? 'bg-amber-500 text-slate-950 shadow-sm'
                      : 'text-slate-600 hover:text-slate-900'
                  }`}
                >
                  🇮🇩 Indonesia (Solo Raya)
                </button>
                <button
                  onClick={() => handleUpdateSetting('active_target_country', 'Singapore')}
                  className={`px-3 py-1.5 rounded-lg font-bold transition ${
                    currentCountry === 'Singapore'
                      ? 'bg-amber-500 text-slate-950 shadow-sm'
                      : 'text-slate-600 hover:text-slate-900'
                  }`}
                >
                  🇸🇬 Singapore
                </button>
                <button
                  onClick={() => handleUpdateSetting('active_target_country', 'All')}
                  className={`px-2.5 py-1.5 rounded-lg font-bold transition ${
                    currentCountry === 'All'
                      ? 'bg-slate-900 text-white shadow-sm'
                      : 'text-slate-600 hover:text-slate-900'
                  }`}
                >
                  Semua
                </button>
              </div>

              {/* Webhook Mode Switcher (Prod vs Test) */}
              <div className="flex items-center bg-slate-50 p-1 rounded-xl border border-slate-200 text-[11px]">
                <button
                  onClick={() => setWebhookMode('prod')}
                  className={`px-2.5 py-1 rounded-lg font-bold transition ${
                    webhookMode === 'prod' ? 'bg-purple-600 text-white shadow-sm' : 'text-slate-600 hover:text-slate-900'
                  }`}
                >
                  Prod URL
                </button>
                <button
                  onClick={() => setWebhookMode('test')}
                  className={`px-2.5 py-1 rounded-lg font-bold transition ${
                    webhookMode === 'test' ? 'bg-amber-500 text-slate-950 shadow-sm' : 'text-slate-600 hover:text-slate-900'
                  }`}
                >
                  Test URL
                </button>
              </div>

              {/* Execute Webhook Button */}
              <button
                onClick={handleTriggerN8nWebhook}
                disabled={isTriggeringWebhook}
                className="px-4 py-2 rounded-xl text-xs font-bold bg-gradient-to-r from-purple-600 to-indigo-600 hover:from-purple-500 hover:to-indigo-500 text-white flex items-center gap-1.5 shadow-sm transition active:scale-95 disabled:opacity-50"
              >
                {isTriggeringWebhook ? (
                  <>
                    <Loader2 size={13} className="animate-spin" />
                    <span>Memicu Webhook...</span>
                  </>
                ) : (
                  <>
                    <Play size={13} className="fill-white" />
                    <span>Jalankan Bot Sekarang</span>
                  </>
                )}
              </button>

              {/* Main Engine On/Off Button */}
              <button
                onClick={() => handleUpdateSetting('is_auto_outreach_active', !isEngineActive)}
                className={`px-3 py-2 rounded-xl text-xs font-bold flex items-center gap-1.5 transition shadow-sm ${
                  isEngineActive
                    ? 'bg-rose-50 text-rose-700 hover:bg-rose-100 border border-rose-200'
                    : 'bg-emerald-600 text-white hover:bg-emerald-500'
                }`}
              >
                <Power size={13} />
                <span>{isEngineActive ? 'Jeda' : 'Aktifkan'}</span>
              </button>
            </div>
          </div>

          {/* Quick Context Summary Pill */}
          <div className="mt-3 pt-3 border-t border-slate-100 flex items-center justify-between text-[11px] text-slate-600 flex-wrap gap-2">
            <div className="flex items-center gap-2">
              <span className="font-semibold text-slate-700">Fokus Wilayah Aktif:</span>
              <span className="px-2 py-0.5 rounded-md bg-amber-50 text-amber-800 border border-amber-200 font-bold">
                {currentCountry === 'Indonesia' ? '📍 Solo Raya, Jogja, & Domestik' : currentCountry === 'Singapore' ? '📍 Singapore & ASEAN' : '📍 Global'}
              </span>
              <span className="text-slate-400">|</span>
              <span className="flex items-center gap-1">
                <ShieldCheck size={13} className="text-emerald-600" />
                <span>Batas Kuota: <strong>{currentLimit} email/hari</strong></span>
              </span>
            </div>
            <span className="text-slate-400 font-mono text-[10px] truncate max-w-xs">
              Webhook: {webhookMode === 'prod' ? 'jkt2.sumopod.my.id/webhook/...' : 'jkt2.sumopod.my.id/webhook-test/...'}
            </span>
          </div>
        </div>

        {/* Sub-Tab Switcher */}
        <div className="flex items-center justify-between border-b border-slate-200 pb-3 mb-5 px-1 flex-wrap gap-3">
          <div className="flex items-center gap-2 overflow-x-auto">
            <button
              onClick={() => setActiveTab('leads')}
              className={`flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-bold transition shadow-sm ${
                activeTab === 'leads'
                  ? 'bg-slate-900 text-white'
                  : 'bg-white border border-slate-200 text-slate-600 hover:bg-slate-50 hover:text-slate-900'
              }`}
            >
              <Users size={14} />
              <span>Daftar Prospek Restoran ({leads.length})</span>
            </button>
            <button
              onClick={() => setActiveTab('queue')}
              className={`flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-bold transition shadow-sm ${
                activeTab === 'queue'
                  ? 'bg-slate-900 text-white'
                  : 'bg-white border border-slate-200 text-slate-600 hover:bg-slate-50 hover:text-slate-900'
              }`}
            >
              <Bot size={14} className={activeTab === 'queue' ? 'text-amber-400' : 'text-amber-500'} />
              <span>Antrean Auto-Scraper ({queue.length})</span>
            </button>
            <button
              onClick={() => setActiveTab('sample_calculator')}
              className={`flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-bold transition shadow-sm ${
                activeTab === 'sample_calculator'
                  ? 'bg-slate-900 text-white'
                  : 'bg-white border border-slate-200 text-slate-600 hover:bg-slate-50 hover:text-slate-900'
              }`}
            >
              <Sparkles size={14} className={activeTab === 'sample_calculator' ? 'text-amber-400' : 'text-purple-500'} />
              <span>Kalkulator ROI Sample Pack</span>
            </button>
          </div>

          {/* Quick Tab Country Filter Pill */}
          {activeTab === 'leads' && (
            <div className="flex items-center bg-white border border-slate-200 rounded-xl p-1 text-xs shadow-sm">
              <button
                onClick={() => setCountryTabFilter('all')}
                className={`px-2.5 py-1 rounded-lg font-semibold transition ${
                  countryTabFilter === 'all' ? 'bg-slate-900 text-white' : 'text-slate-600 hover:text-slate-900'
                }`}
              >
                Semua ({leads.length})
              </button>
              <button
                onClick={() => setCountryTabFilter('indonesia')}
                className={`px-2.5 py-1 rounded-lg font-semibold transition ${
                  countryTabFilter === 'indonesia' ? 'bg-amber-500 text-slate-950 font-bold' : 'text-slate-600 hover:text-slate-900'
                }`}
              >
                🇮🇩 Indonesia ({stats.indoTotal})
              </button>
              <button
                onClick={() => setCountryTabFilter('singapore')}
                className={`px-2.5 py-1 rounded-lg font-semibold transition ${
                  countryTabFilter === 'singapore' ? 'bg-amber-500 text-slate-950 font-bold' : 'text-slate-600 hover:text-slate-900'
                }`}
              >
                🇸🇬 Singapore ({stats.sgTotal})
              </button>
            </div>
          )}
        </div>

        {/* ── TAB 1: LEADS DIRECTORY ── */}
        {activeTab === 'leads' && (
          <div className="space-y-4">
            {/* Filter Bar */}
            <div className="flex flex-col sm:flex-row gap-3 items-center justify-between bg-white p-3 rounded-2xl border border-slate-200/80 shadow-sm">
              <div className="relative w-full sm:w-80">
                <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
                <input
                  type="text"
                  placeholder="Cari nama resto, menu, atau email..."
                  value={search}
                  onChange={(e) => setSearch(e.target.value)}
                  className="w-full pl-9 pr-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs text-slate-900 placeholder-slate-400 focus:outline-none focus:border-amber-500 focus:bg-white transition"
                />
              </div>

              <div className="flex items-center gap-2 w-full sm:w-auto overflow-x-auto">
                <select
                  value={statusFilter}
                  onChange={(e) => setStatusFilter(e.target.value)}
                  className="px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs text-slate-700 font-medium focus:outline-none focus:border-amber-500 focus:bg-white"
                >
                  <option value="all">Semua Status Email</option>
                  <option value="pending">Pending (Belum Dikirim)</option>
                  <option value="sent">Sent (Terkirim)</option>
                  <option value="replied">Replied (Dibalas)</option>
                </select>

                <select
                  value={cityFilter}
                  onChange={(e) => setCityFilter(e.target.value)}
                  className="px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs text-slate-700 font-medium focus:outline-none focus:border-amber-500 focus:bg-white"
                >
                  <option value="all">Semua Wilayah</option>
                  {cities.filter(c => c !== 'all').map(c => (
                    <option key={c} value={c}>{c}</option>
                  ))}
                </select>
              </div>
            </div>

            {/* Leads Cards Grid */}
            {isLoading ? (
              <div className="p-16 text-center text-xs text-slate-400 font-medium">Memuat data prospek B2B...</div>
            ) : filteredLeads.length === 0 ? (
              <div className="p-16 text-center bg-white border border-slate-200 rounded-2xl shadow-sm">
                <Building2 size={40} className="mx-auto mb-2 text-slate-300" />
                <p className="text-sm font-bold text-slate-800">Belum Ada Prospek Restoran</p>
                <p className="text-xs text-slate-500 mt-1 max-w-md mx-auto">
                  Tambahkan prospek secara manual atau jalankan bot n8n untuk men-scrape otomatis dari Google Maps.
                </p>
                <div className="mt-4 flex items-center justify-center gap-2">
                  <button
                    onClick={openAddLead}
                    className="px-4 py-2 rounded-xl text-xs font-bold bg-amber-500 text-slate-950 inline-flex items-center gap-1.5 shadow-sm"
                  >
                    <Plus size={14} /> Tambah Prospek Manual
                  </button>
                  <button
                    onClick={handleTriggerN8nWebhook}
                    disabled={isTriggeringWebhook}
                    className="px-4 py-2 rounded-xl text-xs font-bold bg-purple-600 text-white inline-flex items-center gap-1.5 shadow-sm"
                  >
                    <Zap size={14} /> Picu n8n Sekarang
                  </button>
                </div>
              </div>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {filteredLeads.map((lead) => {
                  const isSent = lead.status_email === 'sent'
                  const isReplied = lead.status_email === 'replied'
                  const isHot = lead.lead_priority === 'hot'
                  const isCold = lead.lead_priority === 'cold'
                  const isIndo = (lead.country || '').toLowerCase() === 'indonesia'

                  return (
                    <motion.div
                      key={lead.id}
                      layout
                      className="bg-white border border-slate-200/90 hover:border-amber-400 hover:shadow-md rounded-2xl p-4 flex flex-col justify-between transition-all shadow-sm"
                    >
                      <div>
                        {/* Header Badges */}
                        <div className="flex items-center justify-between gap-2 mb-2.5">
                          <div className="flex items-center gap-1.5">
                            <span className="px-2 py-0.5 rounded-md text-[10px] font-bold bg-slate-100 text-slate-700 border border-slate-200">
                              {isIndo ? '🇮🇩 ID' : '🇸🇬 SG'}
                            </span>
                            <span className={`px-2 py-0.5 rounded-md text-[10px] font-bold border ${
                              isHot ? 'bg-rose-50 text-rose-700 border-rose-200' :
                              isCold ? 'bg-slate-100 text-slate-600 border-slate-200' :
                              'bg-blue-50 text-blue-700 border-blue-200'
                            }`}>
                              {lead.lead_priority?.toUpperCase() || 'WARM'}
                            </span>
                          </div>
                          <span className={`px-2 py-0.5 rounded-md text-[10px] font-bold flex items-center gap-1 border ${
                            isReplied ? 'bg-purple-50 text-purple-700 border-purple-200' :
                            isSent ? 'bg-emerald-50 text-emerald-700 border-emerald-200' :
                            'bg-amber-50 text-amber-700 border-amber-200'
                          }`}>
                            {isReplied ? <CheckCircle2 size={10} /> : isSent ? <Send size={10} /> : <Clock size={10} />}
                            {lead.status_email?.toUpperCase() || 'PENDING'}
                          </span>
                        </div>

                        {/* Title & Category */}
                        <h3 className="font-bold text-sm text-slate-900 line-clamp-1">
                          {lead.clean_name || lead.name}
                        </h3>
                        <p className="text-[11px] text-slate-500 font-medium mb-3">
                          {lead.category || 'Indonesian restaurant'} · <span className="text-slate-700 font-semibold">{lead.city || (isIndo ? 'Surakarta' : 'Singapore')}</span>
                        </p>

                        {/* Details */}
                        <div className="space-y-1.5 text-xs text-slate-600 mb-3 bg-slate-50/80 p-2.5 rounded-xl border border-slate-100">
                          {lead.email ? (
                            <div className="flex items-center gap-2 text-slate-900 font-medium truncate">
                              <Mail size={13} className="shrink-0 text-amber-600" />
                              <span className="truncate">{lead.email}</span>
                            </div>
                          ) : (
                            <div className="flex items-center gap-2 text-slate-400 italic">
                              <Mail size={13} className="shrink-0 text-slate-400" />
                              <span>Email belum tersedia</span>
                            </div>
                          )}

                          {lead.address && (
                            <div className="flex items-start gap-2 text-slate-600 line-clamp-2">
                              <MapPin size={13} className="shrink-0 mt-0.5 text-slate-400" />
                              <span>{lead.address}</span>
                            </div>
                          )}

                          {lead.rating && (
                            <div className="flex items-center gap-1.5 text-amber-600 font-bold pt-0.5">
                              <Star size={12} className="fill-amber-500 text-amber-500" />
                              <span>{lead.rating}</span>
                              <span className="text-slate-400 font-normal text-[11px]">({lead.review_count || 0} reviews)</span>
                            </div>
                          )}
                        </div>
                      </div>

                      {/* Footer Actions */}
                      <div className="pt-3 border-t border-slate-100 flex items-center justify-between">
                        <div className="flex items-center gap-1.5">
                          {lead.website && (
                            <a
                              href={lead.website.startsWith('http') ? lead.website : `https://${lead.website}`}
                              target="_blank"
                              rel="noreferrer"
                              className="p-1.5 rounded-lg bg-slate-100 hover:bg-slate-200 text-slate-600 transition"
                              title="Buka Website"
                            >
                              <Globe size={13} />
                            </a>
                          )}
                          {lead.maps_url && (
                            <a
                              href={lead.maps_url}
                              target="_blank"
                              rel="noreferrer"
                              className="p-1.5 rounded-lg bg-slate-100 hover:bg-slate-200 text-slate-600 transition"
                              title="Buka Google Maps"
                            >
                              <ExternalLink size={13} />
                            </a>
                          )}
                        </div>

                        <div className="flex items-center gap-1.5">
                          <button
                            onClick={() => setSelectedLeadForPitch(lead)}
                            className="px-2.5 py-1.5 rounded-lg bg-amber-50 hover:bg-amber-100 text-amber-800 text-xs font-bold flex items-center gap-1 border border-amber-200 transition"
                            title="Lihat AI Pitch & Copy"
                          >
                            <Bot size={12} className="text-amber-600" />
                            <span>AI Pitch</span>
                          </button>
                          <button
                            onClick={() => openEditLead(lead)}
                            className="px-2.5 py-1.5 rounded-lg bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-semibold flex items-center gap-1 transition"
                          >
                            <Edit3 size={11} />
                            <span>Edit</span>
                          </button>
                          <button
                            onClick={() => handleDeleteLead(lead.id, lead.name)}
                            className="p-1.5 rounded-lg bg-rose-50 hover:bg-rose-100 text-rose-600 transition"
                            title="Hapus"
                          >
                            <Trash2 size={13} />
                          </button>
                        </div>
                      </div>
                    </motion.div>
                  )
                })}
              </div>
            )}
          </div>
        )}

        {/* ── TAB 2: SCRAPING QUEUE ── */}
        {activeTab === 'queue' && (
          <div className="space-y-4">
            <div className="bg-white p-4 rounded-2xl border border-slate-200 shadow-sm flex flex-col sm:flex-row sm:items-center justify-between gap-3">
              <div>
                <h3 className="font-bold text-sm text-slate-900">Antrean Scraping Google Maps Resto</h3>
                <p className="text-xs text-slate-500 mt-0.5">
                  Workflow bot n8n akan mengecek antrean berstatus <span className="font-bold text-amber-600">pending</span> secara berkala dan menyimpan leads langsung ke database.
                </p>
              </div>
              <div className="flex items-center gap-2">
                <button
                  onClick={handleTriggerN8nWebhook}
                  disabled={isTriggeringWebhook}
                  className="px-3.5 py-2 rounded-xl bg-purple-600 hover:bg-purple-500 text-white text-xs font-bold flex items-center gap-1.5 shadow-sm shrink-0"
                >
                  <Zap size={14} />
                  <span>Jalankan Scraper Sekarang</span>
                </button>
                <button
                  onClick={() => setQueueModalOpen(true)}
                  className="px-4 py-2 rounded-xl bg-amber-500 hover:bg-amber-400 text-slate-950 text-xs font-bold flex items-center gap-1.5 shadow-sm shrink-0"
                >
                  <Plus size={14} />
                  <span>Tambah Antrean Wilayah</span>
                </button>
              </div>
            </div>

            <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden">
              <table className="w-full text-xs text-left text-slate-700">
                <thead className="bg-slate-50 text-slate-600 border-b border-slate-200 uppercase text-[10px] font-bold">
                  <tr>
                    <th className="p-3.5">Target Lokasi / Wilayah</th>
                    <th className="p-3.5">Negara</th>
                    <th className="p-3.5">Status</th>
                    <th className="p-3.5">Leads Ditemukan</th>
                    <th className="p-3.5">Catatan</th>
                    <th className="p-3.5">Dibuat</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {queue.length === 0 ? (
                    <tr>
                      <td colSpan={6} className="p-8 text-center text-slate-400">Belum ada antrean wilayah. Tambahkan antrean target baru.</td>
                    </tr>
                  ) : (
                    queue.map((q) => (
                      <tr key={q.id} className="hover:bg-slate-50/70 transition">
                        <td className="p-3.5 font-bold text-slate-900">{q.target_location}</td>
                        <td className="p-3.5 text-slate-600 font-medium">{q.country}</td>
                        <td className="p-3.5">
                          <span className={`px-2 py-0.5 rounded-md text-[10px] font-bold border ${
                            q.status === 'completed' ? 'bg-emerald-50 text-emerald-700 border-emerald-200' :
                            q.status === 'in_progress' ? 'bg-blue-50 text-blue-700 border-blue-200' :
                            'bg-amber-50 text-amber-700 border-amber-200'
                          }`}>
                            {q.status?.toUpperCase() || 'PENDING'}
                          </span>
                        </td>
                        <td className="p-3.5 font-bold text-slate-900">{q.total_leads_collected || 0} resto</td>
                        <td className="p-3.5 text-slate-500 max-w-xs truncate">{q.notes || '—'}</td>
                        <td className="p-3.5 text-slate-400 font-mono text-[11px]">{new Date(q.created_at).toLocaleDateString('id-ID')}</td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {/* ── TAB 3: SAMPLE PACK CALCULATOR ── */}
        {activeTab === 'sample_calculator' && (
          <div className="bg-white border border-slate-200 rounded-2xl p-6 shadow-sm space-y-6">
            <div className="border-b border-slate-100 pb-4">
              <h3 className="text-base font-bold text-slate-900 flex items-center gap-2">
                <Sparkles size={16} className="text-amber-500" />
                <span>Simulasi ROI Pengiriman Chef Tasting Sample Pack (Domestik Solo/Jawa vs Ekspor)</span>
              </h3>
              <p className="text-xs text-slate-500 mt-1">
                Hitung estimasi modal kirim sample tester pack 100g gratis vs potensi keuntungan repeat order batch 10kg dari restoran mitra.
              </p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
              {/* Input Parameters */}
              <div className="space-y-4 bg-slate-50 p-4 rounded-2xl border border-slate-200">
                <h4 className="font-bold text-xs text-slate-700 uppercase tracking-wider">Parameter Biaya Sample</h4>
                <div>
                  <label className="text-[11px] font-bold text-slate-600 block mb-1">HPP Sample Pack (100g + Pouch + Stiker)</label>
                  <input
                    type="number"
                    value={sampleHpp}
                    onChange={(e) => setSampleHpp(e.target.value)}
                    className="w-full px-3 py-2 bg-white border border-slate-200 rounded-xl text-xs font-bold text-slate-900"
                  />
                </div>
                <div>
                  <label className="text-[11px] font-bold text-slate-600 block mb-1">Ongkir Kurir (Lokal / Paxel)</label>
                  <input
                    type="number"
                    value={sampleCourier}
                    onChange={(e) => setSampleCourier(e.target.value)}
                    className="w-full px-3 py-2 bg-white border border-slate-200 rounded-xl text-xs font-bold text-slate-900"
                  />
                </div>
                <div>
                  <label className="text-[11px] font-bold text-slate-600 block mb-1">Target Closing / Konversi (%)</label>
                  <input
                    type="number"
                    value={targetConversionRate}
                    onChange={(e) => setTargetConversionRate(e.target.value)}
                    className="w-full px-3 py-2 bg-white border border-slate-200 rounded-xl text-xs font-bold text-slate-900"
                  />
                </div>
              </div>

              {/* Repeat Order Potential */}
              <div className="space-y-4 bg-slate-50 p-4 rounded-2xl border border-slate-200">
                <h4 className="font-bold text-xs text-slate-700 uppercase tracking-wider">Potensi Repeat Order Resto</h4>
                <div>
                  <label className="text-[11px] font-bold text-slate-600 block mb-1">Ukuran Batch Trial Pertama (Kg)</label>
                  <input
                    type="number"
                    value={trialBatchKg}
                    onChange={(e) => setTrialBatchKg(e.target.value)}
                    className="w-full px-3 py-2 bg-white border border-slate-200 rounded-xl text-xs font-bold text-slate-900"
                  />
                </div>
                <div>
                  <label className="text-[11px] font-bold text-slate-600 block mb-1">Harga Jual Grosir / Kg</label>
                  <input
                    type="number"
                    value={trialWholesalePrice}
                    onChange={(e) => setTrialWholesalePrice(e.target.value)}
                    className="w-full px-3 py-2 bg-white border border-slate-200 rounded-xl text-xs font-bold text-slate-900"
                  />
                </div>
                <div>
                  <label className="text-[11px] font-bold text-slate-600 block mb-1">HPP Produksi / Kg</label>
                  <input
                    type="number"
                    value={trialHppKg}
                    onChange={(e) => setTrialHppKg(e.target.value)}
                    className="w-full px-3 py-2 bg-white border border-slate-200 rounded-xl text-xs font-bold text-slate-900"
                  />
                </div>
              </div>

              {/* Simulation Result Card */}
              <div className="bg-gradient-to-br from-amber-50 to-orange-50 border border-amber-200/80 rounded-2xl p-5 flex flex-col justify-between shadow-sm">
                <div>
                  <span className="px-2.5 py-1 rounded-lg text-[10px] font-black uppercase tracking-wider bg-amber-200/60 text-amber-900 border border-amber-300">
                    Proyeksi Tiap 10 Sample Dikirim
                  </span>
                  <div className="mt-4 space-y-2">
                    <div className="flex justify-between text-xs text-slate-600">
                      <span>Total Modal 10 Sample:</span>
                      <span className="font-bold text-slate-900">{formatIDR(10 * sampleUnitCostTotal)}</span>
                    </div>
                    <div className="flex justify-between text-xs text-slate-600">
                      <span>Resto Jadi Pesan ({targetConversionRate}%):</span>
                      <span className="font-bold text-emerald-700">{Math.round(10 * (targetConversionRate / 100))} Resto</span>
                    </div>
                    <div className="flex justify-between text-xs text-slate-600">
                      <span>Laba Kotor Order Masuk:</span>
                      <span className="font-bold text-emerald-700">{formatIDR(10 * (targetConversionRate / 100) * trialBatchProfit)}</span>
                    </div>
                  </div>
                </div>

                <div className="pt-4 border-t border-amber-200/60 mt-4">
                  <p className="text-[11px] font-bold text-slate-600">Estimasi Laba Bersih:</p>
                  <p className="text-2xl font-black text-emerald-700 tracking-tight">
                    {formatIDR(expectedProfitPer10Samples)}
                  </p>
                </div>
              </div>
            </div>
          </div>
        )}
      </div>

      {/* ── SHEET: TAMBAH / EDIT PROSPEK ── */}
      <Sheet open={leadModalOpen} onOpenChange={setLeadModalOpen}>
        <SheetContent side="right" className="w-full sm:max-w-lg bg-white border-l border-slate-200 text-slate-900 p-0 flex flex-col shadow-2xl">
          <SheetHeader className="p-5 border-b border-slate-100 bg-slate-50/80">
            <div className="flex items-center justify-between">
              <div>
                <SheetTitle className="text-base font-bold text-slate-900">
                  {editingLead ? 'Edit Data Prospek Restoran' : 'Tambah Prospek Restoran Baru'}
                </SheetTitle>
                <SheetDescription className="text-xs text-slate-500">
                  Masukkan detail restoran untuk ditargetkan dalam cold email / sample tasting pack.
                </SheetDescription>
              </div>
            </div>
          </SheetHeader>

          <form onSubmit={handleSaveLead} className="p-5 space-y-3.5 flex-1 overflow-y-auto text-xs">
            <div>
              <label className="text-[10px] font-black text-slate-600 uppercase tracking-wider mb-1 block">
                Nama Restoran / Usaha <span className="text-rose-500">*</span>
              </label>
              <input
                type="text"
                required
                placeholder="Contoh: Soto Segeer Boyolali Hj. Amanah"
                value={formName}
                onChange={(e) => setFormName(e.target.value)}
                className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-slate-900 text-xs placeholder:text-slate-400 focus:bg-white focus:border-amber-500 focus:outline-none transition"
              />
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="text-[10px] font-black text-slate-600 uppercase tracking-wider mb-1 block">Kategori Resto</label>
                <input
                  type="text"
                  placeholder="Warung Soto / Resto Padang"
                  value={formCategory}
                  onChange={(e) => setFormCategory(e.target.value)}
                  className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-slate-900 text-xs focus:bg-white focus:border-amber-500 focus:outline-none"
                />
              </div>
              <div>
                <label className="text-[10px] font-black text-slate-600 uppercase tracking-wider mb-1 block">Kota / Wilayah</label>
                <input
                  type="text"
                  placeholder="Surakarta / Solo Baru / Boyolali"
                  value={formCity}
                  onChange={(e) => setFormCity(e.target.value)}
                  className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-slate-900 text-xs focus:bg-white focus:border-amber-500 focus:outline-none"
                />
              </div>
            </div>

            <div>
              <label className="text-[10px] font-black text-slate-600 uppercase tracking-wider mb-1 block">Alamat Outlet / Dapur</label>
              <textarea
                rows={2}
                placeholder="Alamat fisik restoran untuk kirim sample pack tester"
                value={formAddress}
                onChange={(e) => setFormAddress(e.target.value)}
                className="w-full px-3.5 py-2 bg-slate-50 border border-slate-200 rounded-xl text-slate-900 text-xs resize-none focus:bg-white focus:border-amber-500 focus:outline-none"
              />
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="text-[10px] font-black text-slate-600 uppercase tracking-wider mb-1 block">Email PIC / Kitchen</label>
                <input
                  type="email"
                  placeholder="chef@restaurant.com"
                  value={formEmail}
                  onChange={(e) => setFormEmail(e.target.value)}
                  className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-slate-900 text-xs focus:bg-white focus:border-amber-500 focus:outline-none"
                />
              </div>
              <div>
                <label className="text-[10px] font-black text-slate-600 uppercase tracking-wider mb-1 block">No. Telp / WhatsApp</label>
                <input
                  type="text"
                  placeholder="+62 812-3456-7890"
                  value={formPhone}
                  onChange={(e) => setFormPhone(e.target.value)}
                  className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-slate-900 text-xs focus:bg-white focus:border-amber-500 focus:outline-none"
                />
              </div>
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="text-[10px] font-black text-slate-600 uppercase tracking-wider mb-1 block">Prioritas Lead</label>
                <select
                  value={formPriority}
                  onChange={(e) => setFormPriority(e.target.value)}
                  className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-slate-900 text-xs font-semibold focus:bg-white focus:border-amber-500"
                >
                  <option value="hot">🔥 Hot Lead (Prioritas)</option>
                  <option value="warm">⚡ Warm Lead</option>
                  <option value="cold">❄️ Cold Lead</option>
                </select>
              </div>
              <div>
                <label className="text-[10px] font-black text-slate-600 uppercase tracking-wider mb-1 block">Status Email</label>
                <select
                  value={formStatusEmail}
                  onChange={(e) => setFormStatusEmail(e.target.value)}
                  className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-slate-900 text-xs font-semibold focus:bg-white focus:border-amber-500"
                >
                  <option value="pending">Pending (Belum Dikirim)</option>
                  <option value="sent">Sent (Terkirim)</option>
                  <option value="replied">Replied (Dibalas)</option>
                </select>
              </div>
            </div>

            <div>
              <label className="text-[10px] font-black text-slate-600 uppercase tracking-wider mb-1 block">Website / Instagram URL</label>
              <input
                type="text"
                placeholder="https://instagram.com/resto"
                value={formWebsite}
                onChange={(e) => setFormWebsite(e.target.value)}
                className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-slate-900 text-xs focus:bg-white focus:border-amber-500 focus:outline-none"
              />
            </div>

            <div>
              <label className="text-[10px] font-black text-slate-600 uppercase tracking-wider mb-1 block">Catatan Tambahan</label>
              <textarea
                rows={2}
                placeholder="Preferensi kemasan pouch/bal, menu andalan, kontak manager..."
                value={formNotes}
                onChange={(e) => setFormNotes(e.target.value)}
                className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-slate-900 text-xs resize-none focus:bg-white focus:border-amber-500 focus:outline-none"
              />
            </div>

            <div className="pt-4 border-t border-slate-100 flex items-center justify-end gap-2.5">
              <button
                type="button"
                onClick={() => setLeadModalOpen(false)}
                className="px-4 py-2 rounded-xl text-xs font-semibold text-slate-600 hover:bg-slate-100 transition"
              >
                Batal
              </button>
              <button
                type="submit"
                disabled={createLeadMut.isPending || updateLeadMut.isPending}
                className="px-5 py-2 rounded-xl text-xs font-bold bg-amber-500 hover:bg-amber-400 text-slate-950 shadow-sm transition"
              >
                {editingLead ? 'Perbarui Prospek' : 'Tambahkan Prospek'}
              </button>
            </div>
          </form>
        </SheetContent>
      </Sheet>

      {/* ── SHEET: TAMBAH ANTREAN SCRAPER ── */}
      <Sheet open={queueModalOpen} onOpenChange={setQueueModalOpen}>
        <SheetContent side="right" className="w-full sm:max-w-md bg-white border-l border-slate-200 text-slate-900 p-0 flex flex-col shadow-2xl">
          <SheetHeader className="p-5 border-b border-slate-100 bg-slate-50/80">
            <SheetTitle className="text-base font-bold text-slate-900">Daftarkan Target Scraper Baru</SheetTitle>
            <SheetDescription className="text-xs text-slate-500">
              Bot n8n akan mengecek antrean ini dan men-scrape kontak restoran kuliner secara otomatis.
            </SheetDescription>
          </SheetHeader>

          <form onSubmit={handleCreateQueue} className="p-5 space-y-4 flex-1 overflow-y-auto text-xs">
            <div>
              <label className="text-[10px] font-black text-slate-600 uppercase tracking-wider mb-1 block">
                Target Wilayah / Kota <span className="text-rose-500">*</span>
              </label>
              <input
                type="text"
                required
                placeholder="Contoh: Surakarta Kota / Solo Baru / Sleman"
                value={qLocation}
                onChange={(e) => setQLocation(e.target.value)}
                className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-slate-900 text-xs focus:bg-white focus:border-amber-500 focus:outline-none"
              />
            </div>

            <div>
              <label className="text-[10px] font-black text-slate-600 uppercase tracking-wider mb-1 block">Negara</label>
              <select
                value={qCountry}
                onChange={(e) => setQCountry(e.target.value)}
                className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-slate-900 text-xs font-semibold focus:bg-white focus:border-amber-500"
              >
                <option value="Indonesia">Indonesia (Solo Raya & Domestik)</option>
                <option value="Singapore">Singapore</option>
                <option value="Malaysia">Malaysia</option>
                <option value="Brunei">Brunei</option>
                <option value="Australia">Australia</option>
              </select>
            </div>

            <div>
              <label className="text-[10px] font-black text-slate-600 uppercase tracking-wider mb-1 block">Catatan Instruksi</label>
              <textarea
                rows={3}
                placeholder="Fokus pada Warung Soto, Resto Padang, Bebek Goreng, Bakso, atau Katering"
                value={qNotes}
                onChange={(e) => setQNotes(e.target.value)}
                className="w-full px-3.5 py-2 bg-slate-50 border border-slate-200 rounded-xl text-slate-900 text-xs resize-none focus:bg-white focus:border-amber-500 focus:outline-none"
              />
            </div>

            <div className="pt-4 border-t border-slate-100 flex items-center justify-end gap-2.5">
              <button
                type="button"
                onClick={() => setQueueModalOpen(false)}
                className="px-4 py-2 rounded-xl text-xs font-semibold text-slate-600 hover:bg-slate-100 transition"
              >
                Batal
              </button>
              <button
                type="submit"
                className="px-5 py-2 rounded-xl text-xs font-bold bg-amber-500 hover:bg-amber-400 text-slate-950 shadow-sm transition"
              >
                Daftarkan ke Antrean
              </button>
            </div>
          </form>
        </SheetContent>
      </Sheet>

      {/* ── SHEET: PREVIEW AI PITCH & OUTREACH ── */}
      <Sheet open={!!selectedLeadForPitch} onOpenChange={(open) => !open && setSelectedLeadForPitch(null)}>
        <SheetContent side="right" className="w-full sm:max-w-xl bg-white border-l border-slate-200 text-slate-900 p-0 flex flex-col shadow-2xl">
          <SheetHeader className="p-5 border-b border-slate-100 bg-slate-50/80">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2.5">
                <div className="p-2 rounded-xl bg-amber-100 text-amber-800 border border-amber-200">
                  <Bot size={18} />
                </div>
                <div>
                  <SheetTitle className="text-base font-bold text-slate-900">
                    {selectedLeadForPitch?.clean_name || selectedLeadForPitch?.name}
                  </SheetTitle>
                  <p className="text-xs text-slate-500 font-medium">
                    {selectedLeadForPitch?.category} · {selectedLeadForPitch?.city || 'Surakarta'}, {selectedLeadForPitch?.country || 'Indonesia'}
                  </p>
                </div>
              </div>
              <span className={`px-2.5 py-1 rounded-lg text-xs font-bold border ${
                selectedLeadForPitch?.status_email === 'sent'
                  ? 'bg-emerald-50 text-emerald-700 border-emerald-200'
                  : 'bg-amber-50 text-amber-700 border-amber-200'
              }`}>
                {selectedLeadForPitch?.status_email?.toUpperCase() || 'PENDING'}
              </span>
            </div>
          </SheetHeader>

          <div className="p-5 flex-1 overflow-y-auto space-y-4 text-xs">
            {/* Target Contact Details */}
            <div className="p-3.5 rounded-xl bg-slate-50 border border-slate-200 space-y-2">
              <div className="flex items-center justify-between">
                <span className="font-semibold text-slate-600">Email Target:</span>
                <span className="text-slate-900 font-bold font-mono">{selectedLeadForPitch?.email || 'Belum ada email'}</span>
              </div>
              {selectedLeadForPitch?.phone && (
                <div className="flex items-center justify-between">
                  <span className="font-semibold text-slate-600">Nomor Telepon / WA:</span>
                  <span className="text-slate-800 font-medium">{selectedLeadForPitch.phone}</span>
                </div>
              )}
              {selectedLeadForPitch?.address && (
                <div className="flex items-start justify-between gap-2">
                  <span className="font-semibold text-slate-600 shrink-0">Alamat Outlet / Dapur:</span>
                  <span className="text-slate-700 text-right">{selectedLeadForPitch.address}</span>
                </div>
              )}
            </div>

            {/* AI Custom Icebreaker / Menu Highlight */}
            {(selectedLeadForPitch?.ai_custom_icebreaker || selectedLeadForPitch?.ai_menu_highlight) && (
              <div className="p-3.5 rounded-xl bg-purple-50 border border-purple-200 space-y-1.5">
                <div className="flex items-center gap-1.5 text-purple-800 font-bold">
                  <Sparkles size={13} />
                  <span>AI Personalization & Menu Insights</span>
                </div>
                {selectedLeadForPitch?.ai_menu_highlight && (
                  <p className="text-slate-700">
                    <span className="text-purple-700 font-semibold">Menu Highlight: </span>
                    {selectedLeadForPitch.ai_menu_highlight}
                  </p>
                )}
                {selectedLeadForPitch?.ai_custom_icebreaker && (
                  <p className="text-slate-700">
                    <span className="text-purple-700 font-semibold">Icebreaker: </span>
                    {selectedLeadForPitch.ai_custom_icebreaker}
                  </p>
                )}
              </div>
            )}

            {/* AI Generated Pitch Subject */}
            <div>
              <label className="text-[10px] font-black text-slate-600 uppercase tracking-wider block mb-1">
                Subject Email (AI Generated):
              </label>
              <div className="p-3 rounded-xl bg-amber-50/70 border border-amber-200 text-amber-950 font-semibold select-all">
                {selectedLeadForPitch?.ai_generated_subject || selectedLeadForPitch?.pitch_subject || `Sample Gratis Bawang Goreng Asli Boyolali untuk Dapur ${selectedLeadForPitch?.clean_name || 'Resto'}`}
              </div>
            </div>

            {/* AI Generated Pitch Body */}
            <div>
              <label className="text-[10px] font-black text-slate-600 uppercase tracking-wider block mb-1">
                Isi Body Email (AI Generated Pitch):
              </label>
              <div className="p-4 rounded-xl bg-slate-50 border border-slate-200 text-slate-800 leading-relaxed font-sans whitespace-pre-wrap select-all shadow-inner">
                {selectedLeadForPitch?.ai_generated_pitch || selectedLeadForPitch?.pitch_email || `Halo Chef & Pengelola Dapur ${selectedLeadForPitch?.clean_name || 'Resto'},

Salam hangat dari kami di Juragan by Anak Bawang (Cepogo, Boyolali).

Kami memproduksi Bawang Goreng Grade Super kualitas premium langsung dari sentra Boyolali (aroma wangi khas tanah vulkanik, renyah tahan lama, 0% pengawet, dan sudah bersertifikat Halal resmi).

Untuk mendukung kualitas hidangan di ${selectedLeadForPitch?.clean_name || 'Resto Anda'}, apakah kami boleh mengirimkan 1 Box Sample Tester Gratis (100g Tasting Pack) langsung ke alamat dapur Anda di ${selectedLeadForPitch?.address || selectedLeadForPitch?.city || 'Solo'} untuk diuji langsung oleh Head Chef?

Tanpa komitmen apapun, cukup dicoba rasa dan kerenyahannya.

Salam kuliner,
Rey — Head of B2B Partnerships
Juragan by Anak Bawang (Boyolali)
Sertifikat Halal: ID33110018517710724`}
              </div>
            </div>

            {/* Outreach Metadata */}
            <div className="flex items-center justify-between text-[11px] text-slate-500 pt-2 border-t border-slate-100">
              <span>Status Email: <strong className="text-slate-800 uppercase">{selectedLeadForPitch?.status_email || 'pending'}</strong></span>
              <span>Negara / Wilayah: <strong className="text-slate-800">{selectedLeadForPitch?.country || 'Indonesia'} ({selectedLeadForPitch?.city || 'Surakarta'})</strong></span>
            </div>
          </div>

          <div className="p-4 border-t border-slate-100 bg-slate-50 flex items-center justify-between">
            <button
              type="button"
              onClick={() => setSelectedLeadForPitch(null)}
              className="px-4 py-2 rounded-xl text-xs font-semibold text-slate-600 hover:bg-slate-100 transition"
            >
              Tutup
            </button>

            {selectedLeadForPitch?.email && (
              <a
                href={`mailto:${selectedLeadForPitch.email}?subject=${encodeURIComponent(selectedLeadForPitch?.ai_generated_subject || `Sample Tester Bawang Goreng Boyolali untuk ${selectedLeadForPitch?.clean_name}`)}&body=${encodeURIComponent(selectedLeadForPitch?.ai_generated_pitch || '')}`}
                className="px-5 py-2 rounded-xl text-xs font-bold bg-amber-500 hover:bg-amber-400 text-slate-950 flex items-center gap-1.5 shadow-sm transition"
              >
                <Send size={13} />
                <span>Kirim via Email Client</span>
              </a>
            )}
          </div>
        </SheetContent>
      </Sheet>
    </div>
  )
}
