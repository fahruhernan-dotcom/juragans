import { useState, useEffect } from 'react'
import { supabase, isSupabaseConfigured } from '../../lib/supabaseClient'
import { 
  Utensils, MessageSquare, Mail, MapPin, Search, Filter, 
  Star, ExternalLink, RefreshCw, Send, CheckCircle2, 
  Clock, AlertCircle, PackageCheck, Globe, PhoneCall
} from 'lucide-react'

export default function B2BProspects() {
  const [activeMarket, setActiveMarket] = useState('singapore') // 'singapore' | 'solo_raya'
  const [search, setSearch] = useState('')
  const [priorityFilter, setPriorityFilter] = useState('ALL')
  const [statusFilter, setStatusFilter] = useState('ALL')
  const [channelFilter, setChannelFilter] = useState('ALL')
  const [loading, setLoading] = useState(false)
  const [selectedLead, setSelectedLead] = useState(null)
  
  // SG Leads State
  const [sgLeads, setSgLeads] = useState([])
  
  // Solo Raya Leads State
  const [soloLeads, setSoloLeads] = useState([])

  // Fetch Singapore Leads from Supabase
  const fetchSgLeads = async () => {
    setLoading(true)
    try {
      if (isSupabaseConfigured()) {
        const { data, error } = await supabase
          .from('b2b_leads')
          .select('*')
          .order('lead_priority', { ascending: true })
          .order('review_count', { ascending: false })

        if (!error && data) {
          setSgLeads(data)
        } else {
          setSgLeads([])
        }

        // Also fetch local solo prospects if table exists
        const { data: localData } = await supabase
          .from('juragan_b2b_prospects')
          .select('*')
          .order('created_at', { ascending: false })
        
        if (localData && localData.length > 0) {
          setSoloLeads(localData.map(p => ({
            id: p.id,
            name: p.restaurant_name,
            area: p.area || 'Solo Raya',
            category: p.category || 'Kategori A (WA Direct)',
            phone: p.phone || 'Kanvas Fisik',
            rating: p.rating || '4.5',
            reviews: p.reviews_count || '100+',
            status: p.status || 'Siap WA Pitching'
          })))
        } else {
          setSoloLeads([])
        }
      }
    } catch (err) {
      console.warn('Error fetching B2B leads from Supabase:', err)
      setSgLeads([])
      setSoloLeads([])
    } finally {
      setLoading(false)
    }
  }

  // Update Status in Supabase
  const handleUpdateStatus = async (leadId, field, newStatus) => {
    try {
      if (isSupabaseConfigured()) {
        const updatePayload = { [field]: newStatus, updated_at: new Date().toISOString() }
        if (field === 'status_email' && newStatus === 'sent') {
          updatePayload.last_contacted_at = new Date().toISOString()
        }
        await supabase.from('b2b_leads').update(updatePayload).eq('id', leadId)
      }
      setSgLeads(prev => prev.map(item => item.id === leadId ? { ...item, [field]: newStatus } : item))
    } catch (e) {
      console.error('Update status error:', e)
    }
  }

  useEffect(() => {
    fetchSgLeads()

    // Realtime Supabase Subscription (when n8n updates status, dashboard syncs instantly)
    let channel
    if (isSupabaseConfigured()) {
      channel = supabase
        .channel('public:b2b_leads')
        .on('postgres_changes', { event: '*', schema: 'public', table: 'b2b_leads' }, payload => {
          if (payload.eventType === 'UPDATE') {
            setSgLeads(prev => prev.map(l => l.id === payload.new.id ? payload.new : l))
          } else if (payload.eventType === 'INSERT') {
            setSgLeads(prev => [payload.new, ...prev])
          }
        })
        .subscribe()
    }

    return () => {
      if (channel) supabase.removeChannel(channel)
    }
  }, [])

  // Filtered Singapore Leads
  const filteredSgLeads = sgLeads.filter(lead => {
    const term = search.toLowerCase()
    const matchSearch = (lead.clean_name || lead.name || '').toLowerCase().includes(term) ||
                        (lead.address || '').toLowerCase().includes(term) ||
                        (lead.email || '').toLowerCase().includes(term) ||
                        (lead.phone || '').toLowerCase().includes(term)

    const matchPriority = priorityFilter === 'ALL' || lead.lead_priority === priorityFilter
    const matchStatus = statusFilter === 'ALL' || lead.status_email === statusFilter || lead.status_whatsapp === statusFilter
    const matchChannel = channelFilter === 'ALL' || 
                         (channelFilter === 'email' && lead.email) ||
                         (channelFilter === 'phone' && lead.phone)

    return matchSearch && matchPriority && matchStatus && matchChannel
  })

  // Summary Metrics for Singapore F&B
  const totalLeads = sgLeads.length
  const hotLeads = sgLeads.filter(l => l.lead_priority === 'hot').length
  const hasEmail = sgLeads.filter(l => l.email).length
  const emailSent = sgLeads.filter(l => l.status_email === 'sent').length
  const sampleSent = sgLeads.filter(l => l.status_email === 'sample_sent' || l.status_whatsapp === 'sample_sent').length

  return (
    <div className="space-y-6 text-left font-sans">
      {/* Header Banner */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 bg-gradient-to-r from-stone-900 via-amber-950 to-stone-900 p-6 rounded-3xl text-white shadow-xl border border-amber-500/20">
        <div>
          <div className="flex items-center space-x-2">
            <span className="px-2.5 py-0.5 bg-amber-500/20 text-amber-300 font-bold uppercase text-[10px] tracking-wider rounded-full border border-amber-500/30">
              B2B Outreach Engine
            </span>
            <span className="text-stone-400 text-xs">• Juragan by Anak Bawang</span>
          </div>
          <h2 className="text-2xl font-extrabold tracking-tight mt-1 text-white">
            Pusat Prospek & Automasi Outreach Restoran B2B
          </h2>
          <p className="text-xs text-stone-300 mt-1 max-w-2xl">
            Monitoring prospek restoran Indonesia di Singapore & Solo Raya yang terintegrasi langsung dengan otomasi AI & n8n Scheduler.
          </p>
        </div>

        {/* Market Switcher Tabs */}
        <div className="flex bg-stone-800/80 p-1.5 rounded-2xl border border-stone-700">
          <button
            onClick={() => setActiveMarket('singapore')}
            className={`px-4 py-2 rounded-xl text-xs font-bold transition-all flex items-center space-x-2 ${
              activeMarket === 'singapore' 
                ? 'bg-amber-500 text-stone-950 shadow-md' 
                : 'text-stone-300 hover:text-white'
            }`}
          >
            <span>🇸🇬 Singapore F&B</span>
            <span className="px-1.5 py-0.2 bg-black/20 rounded-full text-[10px]">{sgLeads.length}</span>
          </button>
          <button
            onClick={() => setActiveMarket('solo_raya')}
            className={`px-4 py-2 rounded-xl text-xs font-bold transition-all flex items-center space-x-2 ${
              activeMarket === 'solo_raya' 
                ? 'bg-amber-500 text-stone-950 shadow-md' 
                : 'text-stone-300 hover:text-white'
            }`}
          >
            <span>🇮🇩 Solo Raya</span>
            <span className="px-1.5 py-0.2 bg-black/20 rounded-full text-[10px]">{soloLeads.length}</span>
          </button>
        </div>
      </div>

      {activeMarket === 'singapore' ? (
        <>
          {/* SG Metrics Cards */}
          <div className="grid grid-cols-2 sm:grid-cols-5 gap-3.5">
            <div className="bg-white p-4 rounded-2xl border border-stone-200 shadow-sm">
              <span className="text-[11px] font-semibold text-stone-500 uppercase tracking-wide">Total Leads SG</span>
              <p className="text-2xl font-black text-stone-900 mt-0.5">{totalLeads}</p>
              <p className="text-[10px] text-stone-400 mt-0.5">Scraped Google Maps</p>
            </div>

            <div className="bg-white p-4 rounded-2xl border border-amber-200/80 bg-amber-50/30 shadow-sm">
              <span className="text-[11px] font-semibold text-amber-800 uppercase tracking-wide">🔥 Hot Priority</span>
              <p className="text-2xl font-black text-amber-700 mt-0.5">{hotLeads}</p>
              <p className="text-[10px] text-amber-600 mt-0.5">Rating & Review Tinggi</p>
            </div>

            <div className="bg-white p-4 rounded-2xl border border-blue-200/80 bg-blue-50/30 shadow-sm">
              <span className="text-[11px] font-semibold text-blue-800 uppercase tracking-wide">✉️ Verified Email</span>
              <p className="text-2xl font-black text-blue-700 mt-0.5">{hasEmail}</p>
              <p className="text-[10px] text-blue-600 mt-0.5">Siap n8n Cold Email</p>
            </div>

            <div className="bg-white p-4 rounded-2xl border border-emerald-200/80 bg-emerald-50/30 shadow-sm">
              <span className="text-[11px] font-semibold text-emerald-800 uppercase tracking-wide">📤 Email Terkirim</span>
              <p className="text-2xl font-black text-emerald-700 mt-0.5">{emailSent}</p>
              <p className="text-[10px] text-emerald-600 mt-0.5">Live via n8n Scheduler</p>
            </div>

            <div className="bg-white p-4 rounded-2xl border border-purple-200/80 bg-purple-50/30 shadow-sm">
              <span className="text-[11px] font-semibold text-purple-800 uppercase tracking-wide">📦 Tester Terkirim</span>
              <p className="text-2xl font-black text-purple-700 mt-0.5">{sampleSent}</p>
              <p className="text-[10px] text-purple-600 mt-0.5">1kg Sample Box ke SG</p>
            </div>
          </div>

          {/* Search, Filter & Refresh Bar */}
          <div className="bg-white p-4 rounded-2xl border border-stone-200 shadow-sm flex flex-col md:flex-row gap-3 items-center justify-between">
            <div className="relative w-full md:w-80">
              <Search className="w-4 h-4 text-stone-400 absolute left-3.5 top-3" />
              <input
                type="text"
                placeholder="Cari resto, alamat, email, telepon..."
                value={search}
                onChange={e => setSearch(e.target.value)}
                className="w-full pl-10 pr-3.5 py-2.5 bg-stone-50 border border-stone-200 rounded-xl text-xs focus:ring-2 focus:ring-amber-500 font-medium"
              />
            </div>

            <div className="flex flex-wrap items-center gap-2 w-full md:w-auto">
              <select
                value={priorityFilter}
                onChange={e => setPriorityFilter(e.target.value)}
                className="px-3 py-2 bg-stone-50 border border-stone-200 rounded-xl text-xs font-semibold text-stone-700 focus:ring-2 focus:ring-amber-500"
              >
                <option value="ALL">Semua Prioritas</option>
                <option value="hot">🔥 Hot Priority</option>
                <option value="warm">⚡ Warm Priority</option>
                <option value="cold">❄️ Cold Priority</option>
              </select>

              <select
                value={statusFilter}
                onChange={e => setStatusFilter(e.target.value)}
                className="px-3 py-2 bg-stone-50 border border-stone-200 rounded-xl text-xs font-semibold text-stone-700 focus:ring-2 focus:ring-amber-500"
              >
                <option value="ALL">Semua Status Outreach</option>
                <option value="pending">⏳ Pending (Belum Kirim)</option>
                <option value="sent">📤 Sent (Terkirim)</option>
                <option value="replied">💬 Replied (Membalas)</option>
                <option value="sample_sent">📦 Sample Tester Sent</option>
              </select>

              <select
                value={channelFilter}
                onChange={e => setChannelFilter(e.target.value)}
                className="px-3 py-2 bg-stone-50 border border-stone-200 rounded-xl text-xs font-semibold text-stone-700 focus:ring-2 focus:ring-amber-500"
              >
                <option value="ALL">Semua Channel</option>
                <option value="email">✉️ Ada Email</option>
                <option value="phone">📱 Ada Telepon (+65)</option>
              </select>

              <button
                onClick={fetchSgLeads}
                disabled={loading}
                className="px-3.5 py-2 bg-stone-900 hover:bg-stone-800 text-white rounded-xl text-xs font-bold flex items-center space-x-1.5 transition-all shadow-sm"
              >
                <RefreshCw className={`w-3.5 h-3.5 ${loading ? 'animate-spin' : ''}`} />
                <span>Sync Supabase</span>
              </button>
            </div>
          </div>

          {/* SG Prospects Table */}
          <div className="bg-white rounded-2xl border border-stone-200 shadow-sm overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs">
                <thead className="bg-stone-900 text-amber-400 uppercase text-[10px] tracking-wider font-bold">
                  <tr>
                    <th className="p-3.5">Restoran / Brand</th>
                    <th className="p-3.5">Lokasi di Singapore</th>
                    <th className="p-3.5">Rating & Review</th>
                    <th className="p-3.5">Email & Kontak</th>
                    <th className="p-3.5">Status n8n Email</th>
                    <th className="p-3.5">Status WhatsApp</th>
                    <th className="p-3.5 text-right">Aksi Outreach</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-stone-100">
                  {filteredSgLeads.length > 0 ? (
                    filteredSgLeads.map((lead, idx) => (
                      <tr key={lead.id || idx} className="hover:bg-amber-50/40 transition-colors">
                        {/* Name & Priority */}
                        <td className="p-3.5">
                          <div className="flex items-start space-x-2">
                            <Utensils className="w-4 h-4 text-amber-700 shrink-0 mt-0.5" />
                            <div>
                              <p className="font-bold text-stone-900 flex items-center space-x-1.5">
                                <span>{lead.clean_name || lead.name}</span>
                                {lead.lead_priority === 'hot' && (
                                  <span className="px-1.5 py-0.2 bg-red-100 text-red-700 rounded-md text-[9px] font-black uppercase">
                                    Hot
                                  </span>
                                )}
                              </p>
                              <p className="text-[10px] text-stone-400">{lead.category}</p>
                            </div>
                          </div>
                        </td>

                        {/* Location */}
                        <td className="p-3.5 max-w-[200px]">
                          <span className="text-[11px] text-stone-600 line-clamp-2" title={lead.address}>
                            {lead.address}
                          </span>
                        </td>

                        {/* Rating */}
                        <td className="p-3.5">
                          <span className="inline-flex items-center space-x-1 font-bold text-amber-700 bg-amber-50 px-2 py-0.5 rounded-lg border border-amber-200/60">
                            <Star className="w-3 h-3 fill-amber-400 text-amber-500" />
                            <span>{lead.rating || '-'} ({lead.review_count || 0})</span>
                          </span>
                        </td>

                        {/* Contacts */}
                        <td className="p-3.5 font-mono text-[11px]">
                          {lead.email ? (
                            <p className="text-blue-700 font-semibold truncate max-w-[170px]" title={lead.email}>
                              ✉️ {lead.email}
                            </p>
                          ) : (
                            <p className="text-stone-400 italic text-[10px]">No direct email</p>
                          )}
                          {lead.phone && (
                            <p className="text-stone-700 mt-0.5">📞 {lead.phone}</p>
                          )}
                        </td>

                        {/* Status Email */}
                        <td className="p-3.5">
                          {lead.status_email === 'sent' ? (
                            <span className="inline-flex items-center space-x-1 px-2.5 py-1 bg-emerald-100 text-emerald-800 rounded-full font-bold text-[10px]">
                              <CheckCircle2 className="w-3 h-3" />
                              <span>Terkirim (n8n)</span>
                            </span>
                          ) : lead.status_email === 'replied' ? (
                            <span className="inline-flex items-center space-x-1 px-2.5 py-1 bg-purple-100 text-purple-800 rounded-full font-bold text-[10px]">
                              <MessageSquare className="w-3 h-3" />
                              <span>Membalas</span>
                            </span>
                          ) : (
                            <span className="inline-flex items-center space-x-1 px-2.5 py-1 bg-stone-100 text-stone-600 rounded-full font-semibold text-[10px]">
                              <Clock className="w-3 h-3" />
                              <span>Pending</span>
                            </span>
                          )}
                        </td>

                        {/* Status WhatsApp */}
                        <td className="p-3.5">
                          {lead.status_whatsapp === 'sent' ? (
                            <span className="px-2 py-0.5 bg-emerald-50 text-emerald-700 font-bold rounded-md text-[10px]">
                              WA Sent
                            </span>
                          ) : (
                            <span className="px-2 py-0.5 bg-stone-100 text-stone-500 rounded-md text-[10px]">
                              Ready
                            </span>
                          )}
                        </td>

                        {/* Action Buttons */}
                        <td className="p-3.5 text-right">
                          <div className="inline-flex items-center space-x-1.5">
                            {lead.phone && (
                              <a
                                href={`https://wa.me/${lead.phone.replace(/[^0-9]/g, '')}?text=${encodeURIComponent(
                                  `Halo tim ${lead.clean_name || lead.name}, salam kenal saya Fahru dari Juragan by Anak Bawang (produsen Bawang Goreng Asli Boyolali, Grade S Murni & Grade A Crispy Halal ID33110018517710724). Boleh kami kirimkan 1 box tester gratis ke dapur ${lead.clean_name || lead.name} di Singapore?`
                                )}`}
                                target="_blank"
                                rel="noopener noreferrer"
                                className="p-1.5 bg-emerald-600 hover:bg-emerald-700 text-white rounded-lg transition-all shadow-sm"
                                title="Kirim WhatsApp Direct"
                              >
                                <MessageSquare className="w-3.5 h-3.5" />
                              </a>
                            )}

                            {lead.email && (
                              <a
                                href={`mailto:${lead.email}?subject=${encodeURIComponent(`Shallot Supply for ${lead.clean_name || lead.name}`)}`}
                                className="p-1.5 bg-blue-600 hover:bg-blue-700 text-white rounded-lg transition-all shadow-sm"
                                title="Buka Email Client"
                              >
                                <Mail className="w-3.5 h-3.5" />
                              </a>
                            )}

                            {lead.website && (
                              <a
                                href={lead.website}
                                target="_blank"
                                rel="noopener noreferrer"
                                className="p-1.5 bg-stone-100 hover:bg-stone-200 text-stone-700 rounded-lg transition-all"
                                title="Kunjungi Website"
                              >
                                <Globe className="w-3.5 h-3.5" />
                              </a>
                            )}
                          </div>
                        </td>
                      </tr>
                    ))
                  ) : (
                    <tr>
                      <td colSpan={7} className="p-8 text-center text-stone-500">
                        {loading ? (
                          <div className="flex items-center justify-center space-x-2">
                            <RefreshCw className="w-4 h-4 animate-spin text-amber-600" />
                            <span>Memuat data prospek dari Supabase...</span>
                          </div>
                        ) : (
                          <div>
                            <AlertCircle className="w-6 h-6 text-stone-400 mx-auto mb-2" />
                            <p className="font-semibold text-stone-700">Belum ada data leads Singapore di database</p>
                            <p className="text-xs text-stone-400 mt-1">Jalankan script <code>python import_b2b_leads_to_supabase.py</code> untuk mengimpor data.</p>
                          </div>
                        )}
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          </div>
        </>
      ) : (
        /* Solo Raya Leads Table */
        <div className="bg-white rounded-2xl border border-stone-200 shadow-sm overflow-hidden">
          <div className="p-4 bg-stone-50 border-b border-stone-200 flex justify-between items-center">
            <span className="font-bold text-stone-800 text-xs uppercase tracking-wider">Prospek Warung Bakso & Resto Lokal Solo Raya</span>
            <span className="text-stone-500 text-xs font-semibold">{soloLeads.length} Resto</span>
          </div>
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="bg-stone-900 text-amber-400 uppercase text-[10px] tracking-wider font-bold">
                <tr>
                  <th className="p-3.5">No</th>
                  <th className="p-3.5">Nama Restoran</th>
                  <th className="p-3.5">Area</th>
                  <th className="p-3.5">Kategori</th>
                  <th className="p-3.5">Kontak</th>
                  <th className="p-3.5">Rating & Review</th>
                  <th className="p-3.5">Aksi</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-stone-100">
                {soloLeads.map((p, idx) => (
                  <tr key={p.id} className="hover:bg-amber-50/30 transition-colors">
                    <td className="p-3.5 font-bold text-amber-800">{idx + 1}</td>
                    <td className="p-3.5 font-bold text-stone-800">{p.name}</td>
                    <td className="p-3.5 font-medium text-stone-600">{p.area}</td>
                    <td className="p-3.5">
                      <span className="px-2.5 py-1 bg-amber-100 text-amber-800 rounded-full font-bold text-[10px]">
                        {p.category}
                      </span>
                    </td>
                    <td className="p-3.5 font-mono text-stone-700">{p.phone}</td>
                    <td className="p-3.5">
                      <span className="inline-flex items-center space-x-1 font-bold text-amber-700">
                        <Star className="w-3 h-3 fill-amber-400 text-amber-500" />
                        <span>{p.rating} ({p.reviews})</span>
                      </span>
                    </td>
                    <td className="p-3.5">
                      {p.phone.startsWith('08') ? (
                        <a
                          href={`https://wa.me/62${p.phone.slice(1).replace(/-/g,'')}?text=${encodeURIComponent(`Halo ${p.name}, saya dari Juragan by Anak Bawang produsen Bawang Goreng Murni Boyolali. Izin menyampaikan penawaran suplai dapur resto.`)}`}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="inline-flex items-center space-x-1 px-3 py-1.5 bg-emerald-600 hover:bg-emerald-700 text-white font-bold rounded-lg transition-all text-[11px]"
                        >
                          <MessageSquare className="w-3 h-3" />
                          <span>Kirim WA</span>
                        </a>
                      ) : (
                        <span className="text-stone-400 italic text-[11px]">Siap Drop Sample</span>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  )
}
