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
  ArrowUpRight
} from 'lucide-react'
import {
  useB2BLeads,
  useB2BScrapingQueue,
  useCreateB2BLead,
  useUpdateB2BLead,
  useDeleteB2BLead,
  useCreateScrapingQueueItem
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

  const createLeadMut = useCreateB2BLead()
  const updateLeadMut = useUpdateB2BLead()
  const deleteLeadMut = useDeleteB2BLead()
  const createQueueMut = useCreateScrapingQueueItem()

  const [activeTab, setActiveTab] = useState('leads') // 'leads' | 'queue' | 'sample_calculator'
  const [search, setSearch] = useState('')
  const [statusFilter, setStatusFilter] = useState('all') // 'all' | 'pending' | 'sent' | 'replied'
  const [cityFilter, setCityFilter] = useState('all')

  // Modals
  const [leadModalOpen, setLeadModalOpen] = useState(false)
  const [editingLead, setEditingLead] = useState(null)
  const [viewLeadDetails, setViewLeadDetails] = useState(null)
  const [queueModalOpen, setQueueModalOpen] = useState(false)

  // Form Lead State
  const [formName, setFormName] = useState('')
  const [formCleanName, setFormCleanName] = useState('')
  const [formCategory, setFormCategory] = useState('Indonesian restaurant')
  const [formCountry, setFormCountry] = useState('Singapore')
  const [formCity, setFormCity] = useState('Singapore')
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
  const [qCountry, setQCountry] = useState('Singapore')
  const [qNotes, setQNotes] = useState('')

  // Sample Pack Calculator State
  const [sampleHpp, setSampleHpp] = useState(15000) // HPP 100g sample pack
  const [sampleCourier, setSampleCourier] = useState(45000) // Ongkir kirim sample ke SG
  const [targetConversionRate, setTargetConversionRate] = useState(20) // 20% order batch 10kg
  const [trialBatchKg, setTrialBatchKg] = useState(10) // 10kg trial
  const [trialWholesalePrice, setTrialWholesalePrice] = useState(135000) // Rp 135.000 / kg
  const [trialHppKg, setTrialHppKg] = useState(112000) // Rp 112.000 / kg

  const cities = useMemo(() => {
    const set = new Set(leads.map(l => l.city).filter(Boolean))
    return ['all', ...Array.from(set)]
  }, [leads])

  const filteredLeads = useMemo(() => {
    return leads.filter(l => {
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
  }, [leads, statusFilter, cityFilter, search])

  const stats = useMemo(() => {
    const total = leads.length
    const hot = leads.filter(l => l.lead_priority === 'hot').length
    const sent = leads.filter(l => l.status_email === 'sent').length
    const replied = leads.filter(l => l.status_email === 'replied').length
    const hasEmail = leads.filter(l => l.email && l.email.includes('@')).length
    return { total, hot, sent, replied, hasEmail }
  }, [leads])

  const summaryItems = [
    { label: 'Total Prospek Resto', value: stats.total, color: 'amber' },
    { label: 'Hot Leads (Prioritas)', value: stats.hot, color: 'green', subLabel: 'Kategori Restoran Utama' },
    { label: 'Outreach Terkirim', value: `${stats.sent} email`, color: 'blue', subLabel: `${stats.hasEmail} kontak valid` },
    { label: 'Respon / Balasan', value: stats.replied, color: 'purple', subLabel: 'Tindak lanjut negosiasi' },
  ]

  const openAddLead = () => {
    setEditingLead(null)
    setFormName('')
    setFormCleanName('')
    setFormCategory('Indonesian restaurant')
    setFormCountry('Singapore')
    setFormCity('Singapore')
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
    setFormCountry(l.country || 'Singapore')
    setFormCity(l.city || 'Singapore')
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
      // handled
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
    <div className="min-h-screen bg-[#0B1120] text-slate-100 pb-[max(140px,calc(110px+env(safe-area-inset-bottom,24px)))] text-left">
      <div className="mx-auto max-w-7xl px-4 sm:px-6 pt-4">
        {/* Header */}
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 pb-4 border-b border-white/10">
          <div>
            <div className="flex items-center gap-2 mb-1">
              <span className="px-2.5 py-0.5 rounded-full text-[10px] font-bold tracking-wider uppercase bg-amber-500/20 text-amber-300 border border-amber-500/30">
                B2B Export Engine
              </span>
              <span className="text-xs text-slate-400">n8n + AI Agent + Supabase</span>
            </div>
            <h1 className="text-2xl font-black font-['Sora'] text-white">
              B2B Leads & Cold Outreach
            </h1>
            <p className="text-xs text-slate-400 mt-0.5">
              Kelola prospek restoran Indonesia di Singapura & Malaysia, pantau status AI pitch email, dan jadwalkan antrean scraping.
            </p>
          </div>

          {/* Action Buttons */}
          <div className="flex items-center gap-2">
            <button
              onClick={() => refetch()}
              className="p-2.5 rounded-xl bg-white/5 hover:bg-white/10 border border-white/10 text-slate-300 transition"
              title="Refresh Data"
            >
              <RefreshCw size={16} />
            </button>
            <button
              onClick={() => setQueueModalOpen(true)}
              className="flex items-center gap-1.5 px-3.5 h-10 rounded-xl text-xs font-bold bg-slate-800 hover:bg-slate-700 text-slate-200 border border-white/10 transition"
            >
              <Bot size={15} className="text-amber-400" />
              <span>Antrean Scraping</span>
            </button>
            <button
              onClick={openAddLead}
              className="flex items-center gap-2 px-4 h-10 rounded-xl text-xs font-bold bg-amber-500 hover:bg-amber-400 text-slate-950 shadow-lg shadow-amber-500/20 transition active:scale-95"
            >
              <Plus size={16} />
              <span>Tambah Prospek</span>
            </button>
          </div>
        </div>

        {/* Summary Strip */}
        <div className="py-4">
          <SembakoSummaryStrip items={summaryItems} />
        </div>

        {/* Tab Navigation */}
        <div className="flex items-center gap-2 border-b border-white/10 pb-3 mb-4">
          <button
            onClick={() => setActiveTab('leads')}
            className={`flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-bold transition ${
              activeTab === 'leads'
                ? 'bg-amber-500 text-slate-950'
                : 'text-slate-400 hover:bg-white/5'
            }`}
          >
            <Users size={15} />
            <span>Daftar Prospek Restoran ({leads.length})</span>
          </button>
          <button
            onClick={() => setActiveTab('queue')}
            className={`flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-bold transition ${
              activeTab === 'queue'
                ? 'bg-amber-500 text-slate-950'
                : 'text-slate-400 hover:bg-white/5'
            }`}
          >
            <Bot size={15} />
            <span>Antrean Auto-Scraper ({queue.length})</span>
          </button>
          <button
            onClick={() => setActiveTab('sample_calculator')}
            className={`flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-bold transition ${
              activeTab === 'sample_calculator'
                ? 'bg-amber-500 text-slate-950'
                : 'text-slate-400 hover:bg-white/5'
            }`}
          >
            <Sparkles size={15} />
            <span>Kalkulator ROI Sample Pack</span>
          </button>
        </div>

        {/* ── TAB 1: LEADS DIRECTORY ── */}
        {activeTab === 'leads' && (
          <div className="space-y-4">
            {/* Filter & Search Bar */}
            <div className="flex flex-col sm:flex-row gap-3 items-center justify-between bg-slate-900/60 p-3 rounded-2xl border border-white/10">
              <div className="relative w-full sm:w-72">
                <Search size={15} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-500" />
                <input
                  type="text"
                  placeholder="Cari resto, PIC, atau email..."
                  value={search}
                  onChange={(e) => setSearch(e.target.value)}
                  className="w-full pl-9 pr-3 py-2 bg-slate-950/80 border border-white/10 rounded-xl text-xs text-white placeholder-slate-500 focus:outline-none focus:border-amber-400"
                />
              </div>

              <div className="flex items-center gap-2 w-full sm:w-auto overflow-x-auto">
                <select
                  value={statusFilter}
                  onChange={(e) => setStatusFilter(e.target.value)}
                  className="px-3 py-2 bg-slate-950/80 border border-white/10 rounded-xl text-xs text-slate-300 focus:outline-none focus:border-amber-400"
                >
                  <option value="all">Semua Status Email</option>
                  <option value="pending">Pending (Belum Dikirim)</option>
                  <option value="sent">Sent (Terkirim)</option>
                  <option value="replied">Replied (Dibalas)</option>
                </select>

                <select
                  value={cityFilter}
                  onChange={(e) => setCityFilter(e.target.value)}
                  className="px-3 py-2 bg-slate-950/80 border border-white/10 rounded-xl text-xs text-slate-300 focus:outline-none focus:border-amber-400"
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
              <div className="p-12 text-center text-xs text-slate-500">Memuat data prospek...</div>
            ) : filteredLeads.length === 0 ? (
              <div className="p-12 text-center bg-slate-900/40 border border-white/10 rounded-2xl">
                <Users size={36} className="mx-auto mb-2 text-slate-600" />
                <p className="text-sm font-bold text-slate-300">Belum ada prospek B2B</p>
                <p className="text-xs text-slate-500 mt-1">Tambahkan prospek secara manual atau jalankan workflow n8n scraper.</p>
              </div>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3.5">
                {filteredLeads.map((lead) => {
                  const isSent = lead.status_email === 'sent'
                  const isReplied = lead.status_email === 'replied'
                  const isHot = lead.lead_priority === 'hot'

                  return (
                    <motion.div
                      key={lead.id}
                      layout
                      className="bg-slate-900/70 border border-white/10 hover:border-amber-500/40 rounded-2xl p-4 flex flex-col justify-between transition-all"
                    >
                      <div>
                        {/* Badges */}
                        <div className="flex items-center justify-between gap-2 mb-2">
                          <span className={`px-2 py-0.5 rounded-md text-[10px] font-bold ${
                            isHot ? 'bg-rose-500/20 text-rose-300 border border-rose-500/30' : 'bg-blue-500/20 text-blue-300'
                          }`}>
                            {lead.lead_priority?.toUpperCase() || 'WARM'} LEAD
                          </span>
                          <span className={`px-2 py-0.5 rounded-md text-[10px] font-bold flex items-center gap-1 ${
                            isReplied ? 'bg-purple-500/20 text-purple-300 border border-purple-500/30' :
                            isSent ? 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/30' :
                            'bg-amber-500/20 text-amber-300'
                          }`}>
                            {isReplied ? <CheckCircle2 size={10} /> : isSent ? <Send size={10} /> : <Clock size={10} />}
                            {lead.status_email?.toUpperCase()}
                          </span>
                        </div>

                        {/* Title */}
                        <h3 className="font-bold text-sm text-white line-clamp-1">
                          {lead.clean_name || lead.name}
                        </h3>
                        <p className="text-[11px] text-slate-400 mb-2">
                          {lead.category || 'Indonesian restaurant'} · {lead.city || 'Singapore'}
                        </p>

                        {/* Details */}
                        <div className="space-y-1 text-[11px] text-slate-300 mb-3">
                          {lead.email ? (
                            <div className="flex items-center gap-1.5 text-amber-300 truncate">
                              <Mail size={12} className="shrink-0" />
                              <span className="truncate">{lead.email}</span>
                            </div>
                          ) : (
                            <div className="flex items-center gap-1.5 text-slate-500">
                              <Mail size={12} className="shrink-0" />
                              <span>Email belum tersedia</span>
                            </div>
                          )}

                          {lead.address && (
                            <div className="flex items-start gap-1.5 text-slate-400 line-clamp-2">
                              <MapPin size={12} className="shrink-0 mt-0.5" />
                              <span>{lead.address}</span>
                            </div>
                          )}

                          {lead.rating && (
                            <div className="flex items-center gap-1 text-amber-400 font-semibold pt-1">
                              <Star size={12} className="fill-amber-400" />
                              <span>{lead.rating}</span>
                              <span className="text-slate-500 font-normal">({lead.review_count || 0} reviews)</span>
                            </div>
                          )}
                        </div>
                      </div>

                      {/* Footer Actions */}
                      <div className="pt-3 border-t border-white/10 flex items-center justify-between">
                        <div className="flex items-center gap-2">
                          {lead.website && (
                            <a
                              href={lead.website.startsWith('http') ? lead.website : `https://${lead.website}`}
                              target="_blank"
                              rel="noreferrer"
                              className="p-1.5 rounded-lg bg-white/5 hover:bg-white/10 text-slate-300"
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
                              className="p-1.5 rounded-lg bg-white/5 hover:bg-white/10 text-slate-300"
                              title="Buka Google Maps"
                            >
                              <ExternalLink size={13} />
                            </a>
                          )}
                        </div>

                        <div className="flex items-center gap-1.5">
                          <button
                            onClick={() => openEditLead(lead)}
                            className="px-2.5 py-1 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs font-semibold flex items-center gap-1"
                          >
                            <Edit3 size={11} />
                            <span>Edit</span>
                          </button>
                          <button
                            onClick={() => handleDeleteLead(lead.id, lead.name)}
                            className="p-1.5 rounded-lg bg-rose-500/10 hover:bg-rose-500/20 text-rose-400"
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
            <div className="bg-slate-900/60 p-4 rounded-2xl border border-white/10 flex items-center justify-between">
              <div>
                <h3 className="font-bold text-sm text-white">Antrean Scraping Google Maps</h3>
                <p className="text-xs text-slate-400">
                  Workflow n8n akan mengecek antrean berstatus <code>pending</code> setiap 5 hari sekali secara otomatis.
                </p>
              </div>
              <button
                onClick={() => setQueueModalOpen(true)}
                className="px-4 py-2 rounded-xl bg-amber-500 hover:bg-amber-400 text-slate-950 text-xs font-bold flex items-center gap-1.5 shadow-lg shadow-amber-500/20"
              >
                <Plus size={14} />
                <span>Tambah Antrean Wilayah</span>
              </button>
            </div>

            <div className="bg-slate-900/70 rounded-2xl border border-white/10 overflow-hidden">
              <table className="w-full text-xs text-left text-slate-300">
                <thead className="bg-slate-950/80 text-slate-400 border-b border-white/10 uppercase text-[10px] font-bold">
                  <tr>
                    <th className="p-3.5">Target Lokasi / Query</th>
                    <th className="p-3.5">Negara</th>
                    <th className="p-3.5">Status</th>
                    <th className="p-3.5">Catatan</th>
                    <th className="p-3.5">Dibuat</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-white/5">
                  {queue.length === 0 ? (
                    <tr>
                      <td colSpan={5} className="p-8 text-center text-slate-500">
                        Belum ada antrean scraping. Tambahkan lokasi target baru seperti "Tanjong Pagar, Singapore" atau "Kuala Lumpur".
                      </td>
                    </tr>
                  ) : (
                    queue.map((q) => (
                      <tr key={q.id} className="hover:bg-white/[0.02]">
                        <td className="p-3.5 font-bold text-white">{q.target_location}</td>
                        <td className="p-3.5">{q.country}</td>
                        <td className="p-3.5">
                          <span className={`px-2 py-0.5 rounded-full font-bold text-[10px] ${
                            q.status === 'completed' ? 'bg-emerald-500/20 text-emerald-300' :
                            q.status === 'in_progress' ? 'bg-blue-500/20 text-blue-300' :
                            'bg-amber-500/20 text-amber-300'
                          }`}>
                            {q.status?.toUpperCase()}
                          </span>
                        </td>
                        <td className="p-3.5 text-slate-400">{q.notes || '-'}</td>
                        <td className="p-3.5 text-slate-500">
                          {q.created_at ? new Date(q.created_at).toLocaleDateString('id-ID') : '-'}
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {/* ── TAB 3: SAMPLE ROI CALCULATOR ── */}
        {activeTab === 'sample_calculator' && (
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 bg-slate-900/60 p-6 rounded-3xl border border-white/10">
            <div className="lg:col-span-2 space-y-5">
              <div>
                <h3 className="text-base font-bold text-white flex items-center gap-2">
                  <Sparkles size={18} className="text-amber-400" />
                  Kalkulator Konversi Sample Pack Chef B2B (Export)
                </h3>
                <p className="text-xs text-slate-400 mt-1">
                  Hitung estimasi pengembalian modal (ROI) dari strategi memberikan <strong>Complimentary Chef Tasting Sample Pack</strong> langsung ke alamat dapur resto di Singapura/Malaysia.
                </p>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div className="p-4 rounded-2xl bg-slate-950/80 border border-white/10 space-y-3">
                  <label className="text-xs font-bold text-amber-400 block">
                    1. Biaya Sample Pack per Restoran
                  </label>
                  <div>
                    <span className="text-[11px] text-slate-400 block mb-1">HPP Sample Pack (100g Pouch):</span>
                    <input
                      type="number"
                      value={sampleHpp}
                      onChange={(e) => setSampleHpp(Number(e.target.value))}
                      className="w-full px-3 py-2 bg-slate-900 border border-white/10 rounded-xl text-xs text-white"
                    />
                  </div>
                  <div>
                    <span className="text-[11px] text-slate-400 block mb-1">Ongkir / Delivery ke Dapur SG:</span>
                    <input
                      type="number"
                      value={sampleCourier}
                      onChange={(e) => setSampleCourier(Number(e.target.value))}
                      className="w-full px-3 py-2 bg-slate-900 border border-white/10 rounded-xl text-xs text-white"
                    />
                  </div>
                  <p className="text-[11px] text-slate-400 pt-1 border-t border-white/10">
                    Total Biaya / Sample: <strong className="text-white">{formatIDR(sampleUnitCostTotal)}</strong>
                  </p>
                </div>

                <div className="p-4 rounded-2xl bg-slate-950/80 border border-white/10 space-y-3">
                  <label className="text-xs font-bold text-emerald-400 block">
                    2. Potensi Order Trial Batch (Low-MOQ)
                  </label>
                  <div>
                    <span className="text-[11px] text-slate-400 block mb-1">Volume Trial Batch (Kg):</span>
                    <input
                      type="number"
                      value={trialBatchKg}
                      onChange={(e) => setTrialBatchKg(Number(e.target.value))}
                      className="w-full px-3 py-2 bg-slate-900 border border-white/10 rounded-xl text-xs text-white"
                    />
                  </div>
                  <div>
                    <span className="text-[11px] text-slate-400 block mb-1">Harga Jual Grosir per Kg (Rp):</span>
                    <input
                      type="number"
                      value={trialWholesalePrice}
                      onChange={(e) => setTrialWholesalePrice(Number(e.target.value))}
                      className="w-full px-3 py-2 bg-slate-900 border border-white/10 rounded-xl text-xs text-white"
                    />
                  </div>
                  <div>
                    <span className="text-[11px] text-slate-400 block mb-1">HPP Produksi per Kg (Rp):</span>
                    <input
                      type="number"
                      value={trialHppKg}
                      onChange={(e) => setTrialHppKg(Number(e.target.value))}
                      className="w-full px-3 py-2 bg-slate-900 border border-white/10 rounded-xl text-xs text-white"
                    />
                  </div>
                </div>
              </div>
            </div>

            {/* Output ROI Card */}
            <div className="p-5 rounded-2xl bg-gradient-to-b from-amber-500/10 to-slate-900 border border-amber-500/20 flex flex-col justify-between">
              <div>
                <span className="text-[11px] font-bold uppercase tracking-wider text-amber-400">
                  Simulasi 10 Resto Diberi Sample
                </span>
                <div className="mt-3 space-y-2 text-xs">
                  <div className="flex justify-between text-slate-300">
                    <span>Biaya 10 Sample Kit:</span>
                    <span className="text-rose-400 font-bold">-{formatIDR(10 * sampleUnitCostTotal)}</span>
                  </div>
                  <div className="flex justify-between text-slate-300">
                    <span>Estimasi Resto Order ({targetConversionRate}%):</span>
                    <span className="text-emerald-400 font-bold">{Math.round(10 * (targetConversionRate / 100))} Resto</span>
                  </div>
                  <div className="flex justify-between text-slate-300">
                    <span>Laba Bersih Trial Batch:</span>
                    <span className="text-emerald-400 font-bold">+{formatIDR(Math.round(10 * (targetConversionRate / 100)) * trialBatchProfit)}</span>
                  </div>
                </div>
              </div>

              <div className="pt-4 border-t border-amber-500/20 mt-4">
                <span className="text-[11px] text-slate-400 block mb-0.5">Estimasi Net Profit Kampanye:</span>
                <span className={`text-xl font-black font-['Sora'] ${expectedProfitPer10Samples >= 0 ? 'text-amber-400' : 'text-rose-400'}`}>
                  {formatIDR(expectedProfitPer10Samples)}
                </span>
                <p className="text-[10px] text-slate-400 mt-1">
                  *Belum termasuk potensi repeat order bulanan reguler setelah resep resto cocok.
                </p>
              </div>
            </div>
          </div>
        )}
      </div>

      {/* ── MODAL TAMBAH/EDIT PROSPEK B2B ── */}
      <Sheet open={leadModalOpen} onOpenChange={setLeadModalOpen}>
        <SheetContent side="right" className="w-full sm:max-w-lg bg-[#0F172A] text-slate-100 border-l border-white/10 p-0 flex flex-col">
          <SheetHeader className="p-5 border-b border-white/10 bg-slate-900/60">
            <SheetTitle className="text-lg font-bold text-white">
              {editingLead ? 'Edit Prospek B2B' : 'Tambah Prospek Restoran Baru'}
            </SheetTitle>
            <SheetDescription className="text-xs text-slate-400">
              Data prospek untuk outreach penawaran bawang goreng Boyolali.
            </SheetDescription>
          </SheetHeader>

          <form onSubmit={handleSaveLead} className="flex-1 overflow-y-auto p-5 space-y-4 text-xs">
            <div>
              <label className="font-bold text-slate-300 mb-1 block">Nama Restoran / Usaha *</label>
              <input
                type="text"
                required
                placeholder="Contoh: Chopstix & Rice Suntec City"
                value={formName}
                onChange={(e) => setFormName(e.target.value)}
                className="w-full px-3 py-2 bg-slate-900 border border-white/10 rounded-xl text-white focus:outline-none focus:border-amber-400 text-xs"
              />
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="font-bold text-slate-300 mb-1 block">Kategori Menu</label>
                <input
                  type="text"
                  placeholder="Padang / Penyet / Catering"
                  value={formCategory}
                  onChange={(e) => setFormCategory(e.target.value)}
                  className="w-full px-3 py-2 bg-slate-900 border border-white/10 rounded-xl text-white text-xs"
                />
              </div>
              <div>
                <label className="font-bold text-slate-300 mb-1 block">Kota / Wilayah</label>
                <input
                  type="text"
                  placeholder="Singapore / KL"
                  value={formCity}
                  onChange={(e) => setFormCity(e.target.value)}
                  className="w-full px-3 py-2 bg-slate-900 border border-white/10 rounded-xl text-white text-xs"
                />
              </div>
            </div>

            <div>
              <label className="font-bold text-slate-300 mb-1 block">Alamat Dapur / Outlet</label>
              <textarea
                rows={2}
                placeholder="Alamat fisik untuk pengiriman tester pack"
                value={formAddress}
                onChange={(e) => setFormAddress(e.target.value)}
                className="w-full px-3 py-2 bg-slate-900 border border-white/10 rounded-xl text-white text-xs resize-none"
              />
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="font-bold text-slate-300 mb-1 block">Email PIC / Kitchen</label>
                <input
                  type="email"
                  placeholder="chef@restaurant.sg"
                  value={formEmail}
                  onChange={(e) => setFormEmail(e.target.value)}
                  className="w-full px-3 py-2 bg-slate-900 border border-white/10 rounded-xl text-white text-xs"
                />
              </div>
              <div>
                <label className="font-bold text-slate-300 mb-1 block">No. Telp / WhatsApp</label>
                <input
                  type="text"
                  placeholder="+65 9123 4567"
                  value={formPhone}
                  onChange={(e) => setFormPhone(e.target.value)}
                  className="w-full px-3 py-2 bg-slate-900 border border-white/10 rounded-xl text-white text-xs"
                />
              </div>
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="font-bold text-slate-300 mb-1 block">Prioritas Lead</label>
                <select
                  value={formPriority}
                  onChange={(e) => setFormPriority(e.target.value)}
                  className="w-full px-3 py-2 bg-slate-900 border border-white/10 rounded-xl text-white text-xs"
                >
                  <option value="hot">Hot (Sangat Potensial)</option>
                  <option value="warm">Warm (Menengah)</option>
                  <option value="cold">Cold (Biasa)</option>
                </select>
              </div>
              <div>
                <label className="font-bold text-slate-300 mb-1 block">Status Outreach Email</label>
                <select
                  value={formStatusEmail}
                  onChange={(e) => setFormStatusEmail(e.target.value)}
                  className="w-full px-3 py-2 bg-slate-900 border border-white/10 rounded-xl text-white text-xs"
                >
                  <option value="pending">Pending</option>
                  <option value="sent">Sent (Terkirim)</option>
                  <option value="replied">Replied (Dibalas)</option>
                </select>
              </div>
            </div>

            <div>
              <label className="font-bold text-slate-300 mb-1 block">Website / Instagram URL</label>
              <input
                type="text"
                placeholder="https://instagram.com/resto"
                value={formWebsite}
                onChange={(e) => setFormWebsite(e.target.value)}
                className="w-full px-3 py-2 bg-slate-900 border border-white/10 rounded-xl text-white text-xs"
              />
            </div>

            <div>
              <label className="font-bold text-slate-300 mb-1 block">Catatan Tambahan</label>
              <textarea
                rows={2}
                placeholder="Menu andalan, preferensi kemasan bal atau pouch, dll"
                value={formNotes}
                onChange={(e) => setFormNotes(e.target.value)}
                className="w-full px-3 py-2 bg-slate-900 border border-white/10 rounded-xl text-white text-xs resize-none"
              />
            </div>
          </form>

          <div className="p-4 border-t border-white/10 bg-slate-900/60 flex items-center justify-end gap-2.5">
            <button
              type="button"
              onClick={() => setLeadModalOpen(false)}
              className="px-4 py-2 rounded-xl text-xs font-semibold text-slate-300 hover:bg-white/5"
            >
              Batal
            </button>
            <button
              type="button"
              onClick={handleSaveLead}
              className="px-5 py-2 rounded-xl text-xs font-bold bg-amber-500 hover:bg-amber-400 text-slate-950 shadow-lg shadow-amber-500/20"
            >
              {editingLead ? 'Simpan Perubahan' : 'Tambahkan Prospek'}
            </button>
          </div>
        </SheetContent>
      </Sheet>

      {/* ── MODAL TAMBAH ANTREAN SCRAPING ── */}
      <Sheet open={queueModalOpen} onOpenChange={setQueueModalOpen}>
        <SheetContent side="right" className="w-full sm:max-w-md bg-[#0F172A] text-slate-100 border-l border-white/10 p-0 flex flex-col">
          <SheetHeader className="p-5 border-b border-white/10 bg-slate-900/60">
            <SheetTitle className="text-lg font-bold text-white">
              Tambah Target Lokasi Scraping
            </SheetTitle>
            <SheetDescription className="text-xs text-slate-400">
              Antrean ini akan dijalankan otomatis oleh bot n8n Apify Google Maps Scraper.
            </SheetDescription>
          </SheetHeader>

          <form onSubmit={handleCreateQueue} className="flex-1 p-5 space-y-4 text-xs">
            <div>
              <label className="font-bold text-slate-300 mb-1 block">
                Target Lokasi / Area <span className="text-rose-400">*</span>
              </label>
              <input
                type="text"
                required
                placeholder="Contoh: Orchard Road, Singapore / Bangsar, Kuala Lumpur"
                value={qLocation}
                onChange={(e) => setQLocation(e.target.value)}
                className="w-full px-3 py-2.5 bg-slate-900 border border-white/10 rounded-xl text-white text-xs focus:outline-none focus:border-amber-400"
              />
            </div>

            <div>
              <label className="font-bold text-slate-300 mb-1 block">Negara</label>
              <select
                value={qCountry}
                onChange={(e) => setQCountry(e.target.value)}
                className="w-full px-3 py-2.5 bg-slate-900 border border-white/10 rounded-xl text-white text-xs"
              >
                <option value="Singapore">Singapore</option>
                <option value="Malaysia">Malaysia</option>
                <option value="Brunei">Brunei</option>
                <option value="Australia">Australia</option>
                <option value="Indonesia">Indonesia</option>
              </select>
            </div>

            <div>
              <label className="font-bold text-slate-300 mb-1 block">Catatan</label>
              <textarea
                rows={3}
                placeholder="Fokus pada resto Padang, Ayam Penyet, atau Warung Nusantara"
                value={qNotes}
                onChange={(e) => setQNotes(e.target.value)}
                className="w-full px-3 py-2 bg-slate-900 border border-white/10 rounded-xl text-white text-xs resize-none"
              />
            </div>
          </form>

          <div className="p-4 border-t border-white/10 bg-slate-900/60 flex items-center justify-end gap-2.5">
            <button
              type="button"
              onClick={() => setQueueModalOpen(false)}
              className="px-4 py-2 rounded-xl text-xs font-semibold text-slate-300 hover:bg-white/5"
            >
              Batal
            </button>
            <button
              type="button"
              onClick={handleCreateQueue}
              className="px-5 py-2 rounded-xl text-xs font-bold bg-amber-500 hover:bg-amber-400 text-slate-950"
            >
              Daftarkan ke Antrean
            </button>
          </div>
        </SheetContent>
      </Sheet>
    </div>
  )
}
