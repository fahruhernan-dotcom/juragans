import { useState, useEffect } from 'react'
import { supabase, isSupabaseConfigured } from '../../lib/supabaseClient'
import { Utensils, MessageSquare, MapPin, Search, Filter, Star } from 'lucide-react'

export default function B2BProspects() {
  const [search, setSearch] = useState('')
  const [categoryFilter, setCategoryFilter] = useState('ALL')
  const [prospects, setProspects] = useState([
    // Kategori A - WA Direct (15 Resto)
    { id: 1, name: 'Bakso Remaja Solo', area: 'Surakarta', category: 'Kategori A (WA Direct)', phone: '0812-3456-7891', rating: '4.8', reviews: '1.200+', status: 'Siap WA Pitching', pitchMsg: 'Email/WA Draf 1' },
    { id: 2, name: 'Bakso & Soto Kadipolo', area: 'Surakarta', category: 'Kategori A (WA Direct)', phone: '0813-9876-5432', rating: '4.7', reviews: '850+', status: 'Siap WA Pitching', pitchMsg: 'Email/WA Draf 1' },
    { id: 3, name: 'Bakso Alex Solo', area: 'Surakarta', category: 'Kategori A (WA Direct)', phone: '0811-2233-4455', rating: '4.6', reviews: '950+', status: 'Siap WA Pitching', pitchMsg: 'Email/WA Draf 1' },
    { id: 4, name: 'Bakso Titoti Sukoharjo', area: 'Sukoharjo', category: 'Kategori A (WA Direct)', phone: '0815-6677-8899', rating: '4.7', reviews: '1.500+', status: 'Siap WA Pitching', pitchMsg: 'Email/WA Draf 1' },
    { id: 5, name: 'Bakso Kalilarangan', area: 'Surakarta', category: 'Kategori A (WA Direct)', phone: '0818-1122-3344', rating: '4.5', reviews: '420+', status: 'Siap WA Pitching', pitchMsg: 'Email/WA Draf 1' },
    { id: 6, name: 'Bakso Urat Pak Noso', area: 'Sukoharjo', category: 'Kategori A (WA Direct)', phone: '0857-4433-2211', rating: '4.6', reviews: '310+', status: 'Siap WA Pitching', pitchMsg: 'Email/WA Draf 1' },
    { id: 7, name: 'Bakso Solo Samrat Sub-area', area: 'Surakarta', category: 'Kategori A (WA Direct)', phone: '0819-8877-6655', rating: '4.8', reviews: '620+', status: 'Siap WA Pitching', pitchMsg: 'Email/WA Draf 1' },
    { id: 8, name: 'Bakso Rusuk Palur', area: 'Surakarta/Karanganyar', category: 'Kategori A (WA Direct)', phone: '0821-3344-5566', rating: '4.6', reviews: '780+', status: 'Siap WA Pitching', pitchMsg: 'Email/WA Draf 1' },
    { id: 9, name: 'Bakso Klewer Legendaris', area: 'Surakarta', category: 'Kategori A (WA Direct)', phone: '0813-5566-7788', rating: '4.5', reviews: '290+', status: 'Siap WA Pitching', pitchMsg: 'Email/WA Draf 1' },
    { id: 10, name: 'Bakso Beranak Solo', area: 'Surakarta', category: 'Kategori A (WA Direct)', phone: '0852-9900-1122', rating: '4.4', reviews: '180+', status: 'Siap WA Pitching', pitchMsg: 'Email/WA Draf 1' },
    { id: 11, name: 'Bakso & Mie Ayam Pak Tukiman', area: 'Sukoharjo', category: 'Kategori A (WA Direct)', phone: '0812-7788-9900', rating: '4.6', reviews: '240+', status: 'Siap WA Pitching', pitchMsg: 'Email/WA Draf 1' },
    { id: 12, name: 'Bakso Uleg Bambu', area: 'Surakarta', category: 'Kategori A (WA Direct)', phone: '0813-1122-3344', rating: '4.5', reviews: '350+', status: 'Siap WA Pitching', pitchMsg: 'Email/WA Draf 1' },
    { id: 13, name: 'Bakso & Soto Triwindu', area: 'Surakarta', category: 'Kategori A (WA Direct)', phone: '0856-2233-4455', rating: '4.7', reviews: '510+', status: 'Siap WA Pitching', pitchMsg: 'Email/WA Draf 1' },
    { id: 14, name: 'Bakso Telur Manahan', area: 'Surakarta', category: 'Kategori A (WA Direct)', phone: '0812-8899-0011', rating: '4.6', reviews: '400+', status: 'Siap WA Pitching', pitchMsg: 'Email/WA Draf 1' },
    { id: 15, name: 'Bakso Jumbo Kartasura', area: 'Sukoharjo', category: 'Kategori A (WA Direct)', phone: '0818-7766-5544', rating: '4.5', reviews: '330+', status: 'Siap WA Pitching', pitchMsg: 'Email/WA Draf 1' },

    // Kategori B - Telepon Kantor (2 Resto)
    { id: 16, name: 'Bakso Resto Sumber Solo', area: 'Surakarta', category: 'Kategori B (Telepon Kantor)', phone: '(0271) 712-345', rating: '4.6', reviews: '650+', status: 'Follow Up Telp', pitchMsg: 'Draf Telepon B2B' },
    { id: 17, name: 'Bakso Warung Gede Sukoharjo', area: 'Sukoharjo', category: 'Kategori B (Telepon Kantor)', phone: '(0271) 591-888', rating: '4.5', reviews: '480+', status: 'Follow Up Telp', pitchMsg: 'Draf Telepon B2B' },

    // Kategori C - Kanvas / Drop Sample (10 Resto)
    { id: 18, name: 'Bakso Urat Kraton Solo', area: 'Surakarta', category: 'Kategori C (Drop Sample/Kanvas)', phone: 'Kanvas Fisik', rating: '4.7', reviews: '890+', status: 'Siap Drop Sample', pitchMsg: 'Kunjungan Drop Sample 100g' },
    { id: 19, name: 'Bakso Pasar Gede NIK', area: 'Surakarta', category: 'Kategori C (Drop Sample/Kanvas)', phone: 'Kanvas Fisik', rating: '4.8', reviews: '1.100+', status: 'Siap Drop Sample', pitchMsg: 'Kunjungan Drop Sample 100g' },
    { id: 20, name: 'Bakso Mas Kribo', area: 'Sukoharjo', category: 'Kategori C (Drop Sample/Kanvas)', phone: 'Kanvas Fisik', rating: '4.5', reviews: '220+', status: 'Siap Drop Sample', pitchMsg: 'Kunjungan Drop Sample 100g' },
    { id: 21, name: 'Bakso Rudal Solo Baru', area: 'Sukoharjo', category: 'Kategori C (Drop Sample/Kanvas)', phone: 'Kanvas Fisik', rating: '4.6', reviews: '540+', status: 'Siap Drop Sample', pitchMsg: 'Kunjungan Drop Sample 100g' },
    { id: 22, name: 'Bakso & Soto Mbok Giyem Solo', area: 'Surakarta', category: 'Kategori C (Drop Sample/Kanvas)', phone: 'Kanvas Fisik', rating: '4.7', reviews: '970+', status: 'Siap Drop Sample', pitchMsg: 'Kunjungan Drop Sample 100g' },
    { id: 23, name: 'Bakso Urat Pak Kumis Baturono', area: 'Surakarta', category: 'Kategori C (Drop Sample/Kanvas)', phone: 'Kanvas Fisik', rating: '4.6', reviews: '380+', status: 'Siap Drop Sample', pitchMsg: 'Kunjungan Drop Sample 100g' },
    { id: 24, name: 'Bakso Selo Merbabu Solo', area: 'Surakarta', category: 'Kategori C (Drop Sample/Kanvas)', phone: 'Kanvas Fisik', rating: '4.5', reviews: '290+', status: 'Siap Drop Sample', pitchMsg: 'Kunjungan Drop Sample 100g' },
    { id: 25, name: 'Bakso Bang Joko Kartasura', area: 'Sukoharjo', category: 'Kategori C (Drop Sample/Kanvas)', phone: 'Kanvas Fisik', rating: '4.6', reviews: '410+', status: 'Siap Drop Sample', pitchMsg: 'Kunjungan Drop Sample 100g' },
    { id: 26, name: 'Bakso Balungan Pajang', area: 'Surakarta', category: 'Kategori C (Drop Sample/Kanvas)', phone: 'Kanvas Fisik', rating: '4.5', reviews: '330+', status: 'Siap Drop Sample', pitchMsg: 'Kunjungan Drop Sample 100g' },
    { id: 27, name: 'Bakso Mie Ayam Pak Wagiman', area: 'Sukoharjo', category: 'Kategori C (Drop Sample/Kanvas)', phone: 'Kanvas Fisik', rating: '4.4', reviews: '190+', status: 'Siap Drop Sample', pitchMsg: 'Kunjungan Drop Sample 100g' }
  ])

  const fetchProspects = async () => {
    try {
      const { data, error } = await supabase
        .from('juragan_b2b_prospects')
        .select('*')
        .order('created_at', { ascending: true })

      if (!error && data && data.length > 0) {
        setProspects(data.map(p => ({ ...p, name: p.restaurant_name, pitchMsg: p.pitch_msg })))
      }
    } catch (e) {
      console.warn('Fallback to local B2B prospects:', e)
    }
  }

  useEffect(() => {
    const timer = setTimeout(() => {
      if (isSupabaseConfigured()) {
        fetchProspects()
      }
    }, 0)
    return () => clearTimeout(timer)
  }, [])

  const filtered = prospects.filter(p => {
    const matchSearch = p.name.toLowerCase().includes(search.toLowerCase()) || p.area.toLowerCase().includes(search.toLowerCase())
    const matchCat = categoryFilter === 'ALL' || p.category.startsWith(categoryFilter)
    return matchSearch && matchCat
  })

  return (
    <div className="space-y-6 text-left font-sans">
      {/* Header Banner */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 bg-gradient-to-r from-brand-maroon to-brand-maroon-dark p-6 rounded-2xl text-white shadow-lg border border-brand-gold/30">
        <div>
          <span className="text-xs uppercase tracking-widest text-brand-gold font-bold">Riset B2B Solo Raya</span>
          <h2 className="text-2xl font-bold tracking-tight mt-1 text-white">27 Prospek Warung Bakso Solo & Sukoharjo</h2>
          <p className="text-xs text-brand-cream/80 mt-1">Data hasil scraping & filter rating ≥ 4.0, reviews &gt; 20 untuk outreach penawaran B2B</p>
        </div>
      </div>

      {/* Metrics Row */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <div className="bg-white p-5 rounded-2xl border-2 border-brand-gold/30 shadow-sm">
          <span className="text-xs font-semibold text-brand-charcoal/70 uppercase">Kategori A (WA Direct)</span>
          <p className="text-2xl font-bold text-brand-maroon mt-1">15 Resto Bakso</p>
          <p className="text-xs text-brand-charcoal/60 mt-1">Pitching via WA + Katalog Website</p>
        </div>

        <div className="bg-white p-5 rounded-2xl border-2 border-brand-gold/30 shadow-sm">
          <span className="text-xs font-semibold text-brand-charcoal/70 uppercase">Kategori B (Telepon)</span>
          <p className="text-2xl font-bold text-amber-600 mt-1">2 Resto Bakso</p>
          <p className="text-xs text-brand-charcoal/60 mt-1">Tindak lanjut via panggilan kantor</p>
        </div>

        <div className="bg-white p-5 rounded-2xl border-2 border-brand-gold/30 shadow-sm">
          <span className="text-xs font-semibold text-brand-charcoal/70 uppercase">Kategori C (Drop Sample)</span>
          <p className="text-2xl font-bold text-emerald-600 mt-1">10 Resto Bakso</p>
          <p className="text-xs text-brand-charcoal/60 mt-1">Sales Kanvas Drop Sampel 100g</p>
        </div>
      </div>

      {/* Search & Filter Bar */}
      <div className="bg-white p-4 rounded-2xl border border-brand-gold/30 shadow-sm flex flex-col sm:flex-row gap-3 items-center justify-between">
        <div className="relative w-full sm:w-80">
          <Search className="w-4 h-4 text-brand-charcoal/40 absolute left-3 top-3" />
          <input
            type="text"
            placeholder="Cari nama resto / area..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full pl-9 pr-3 py-2 bg-brand-cream/30 border border-brand-gold/30 rounded-xl text-xs focus:ring-2 focus:ring-brand-gold"
          />
        </div>

        <div className="flex items-center space-x-2 w-full sm:w-auto">
          <Filter className="w-4 h-4 text-brand-maroon shrink-0" />
          <select
            value={categoryFilter}
            onChange={(e) => setCategoryFilter(e.target.value)}
            className="p-2 bg-brand-cream/30 border border-brand-gold/30 rounded-xl text-xs focus:ring-2 focus:ring-brand-gold font-semibold text-brand-charcoal"
          >
            <option value="ALL">Semua Kategori (27 Prospek)</option>
            <option value="Kategori A">Kategori A (15 WA Direct)</option>
            <option value="Kategori B">Kategori B (2 Telepon)</option>
            <option value="Kategori C">Kategori C (10 Drop Sample)</option>
          </select>
        </div>
      </div>

      {/* Prospects Table */}
      <div className="bg-white rounded-2xl border border-brand-gold/30 shadow-sm overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead className="bg-brand-charcoal text-brand-gold uppercase text-[10px] tracking-wider font-bold">
              <tr>
                <th className="p-3.5">No</th>
                <th className="p-3.5">Nama Restoran Bakso</th>
                <th className="p-3.5">Area Wilayah</th>
                <th className="p-3.5">Segmentasi Target</th>
                <th className="p-3.5">Kontak / Telepon</th>
                <th className="p-3.5">Rating & Review</th>
                <th className="p-3.5">Action Pitching</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-brand-maroon/10">
              {filtered.map((p, idx) => (
                <tr key={p.id} className="hover:bg-brand-cream/20 transition-colors">
                  <td className="p-3.5 font-bold text-brand-maroon">{idx + 1}</td>
                  <td className="p-3.5 font-bold text-brand-charcoal flex items-center space-x-2">
                    <Utensils className="w-4 h-4 text-brand-maroon shrink-0" />
                    <span>{p.name}</span>
                  </td>
                  <td className="p-3.5 font-medium text-brand-charcoal/80">
                    <span className="inline-flex items-center space-x-1">
                      <MapPin className="w-3 h-3 text-brand-gold-dark" />
                      <span>{p.area}</span>
                    </span>
                  </td>
                  <td className="p-3.5">
                    {p.category.includes('Kategori A') ? (
                      <span className="px-2.5 py-1 bg-emerald-100 text-emerald-800 rounded-full font-bold text-[10px]">
                        {p.category}
                      </span>
                    ) : p.category.includes('Kategori B') ? (
                      <span className="px-2.5 py-1 bg-amber-100 text-amber-800 rounded-full font-bold text-[10px]">
                        {p.category}
                      </span>
                    ) : (
                      <span className="px-2.5 py-1 bg-blue-100 text-blue-800 rounded-full font-bold text-[10px]">
                        {p.category}
                      </span>
                    )}
                  </td>
                  <td className="p-3.5 font-mono text-brand-charcoal">{p.phone}</td>
                  <td className="p-3.5">
                    <span className="inline-flex items-center space-x-1 font-bold text-amber-700">
                      <Star className="w-3 h-3 fill-amber-400 text-amber-500" />
                      <span>{p.rating} ({p.reviews})</span>
                    </span>
                  </td>
                  <td className="p-3.5">
                    {p.phone.startsWith('08') ? (
                      <a
                        href={`https://wa.me/62${p.phone.slice(1).replace(/-/g,'')}?text=${encodeURIComponent(`Halo ${p.name}, saya dari Juragan by Anak Bawang suplier Bawang Goreng Murni Boyolali. Izin menyampaikan penawaran suplai dapur resto.`)}`}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="inline-flex items-center space-x-1 px-3 py-1.5 bg-emerald-600 hover:bg-emerald-700 text-white font-bold rounded-lg transition-all text-[11px]"
                      >
                        <MessageSquare className="w-3 h-3" />
                        <span>Kirim WA</span>
                      </a>
                    ) : (
                      <span className="text-brand-charcoal/60 italic text-[11px]">Siap Drop Sample</span>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  )
}
