import { useState, useEffect } from 'react'
import { supabase, isSupabaseConfigured } from '../../lib/supabaseClient'
import { 
  Plus, RefreshCw, Trash2, AlertCircle, Sparkles, Search, ChevronDown, ChevronUp
} from 'lucide-react'

const fmt = (n) => new Intl.NumberFormat('id-ID', { maximumFractionDigits: 0 }).format(Math.round(Number(n) || 0))
const fmtDate = (dStr) => {
  if (!dStr) return '-'
  const d = new Date(dStr)
  return d.toLocaleDateString('id-ID', { day: 'numeric', month: 'short', year: 'numeric' })
}

export default function InventoryManagement() {
  const [activeTab, setActiveTab] = useState(0)
  const [products, setProducts] = useState([])
  const [batches, setBatches] = useState([])
  const [auditLogs, setAuditLogs] = useState([])
  const [searchQuery, setSearchQuery] = useState('')
  const [expandedProduct, setExpandedProduct] = useState(null)
  
  const [loading, setLoading] = useState(true)
  const [isAddModalOpen, setIsAddModalOpen] = useState(false)
  const [toastMsg, setToastMsg] = useState('')
  const [errorMsg, setErrorMsg] = useState('')

  const [newBatch, setNewBatch] = useState({
    variant_name: 'Grade S Murni',
    weight_kg: '',
    hpp_per_kg: '120000',
    notes: ''
  })

  const showToast = (msg) => {
    setToastMsg(msg)
    setTimeout(() => setToastMsg(''), 3000)
  }

  const fetchData = async () => {
    setLoading(true)
    setErrorMsg('')
    try {
      if (!isSupabaseConfigured()) {
        throw new Error('Supabase client is not configured.')
      }

      // 1. Fetch Products
      const { data: prodData, error: prodErr } = await supabase
        .from('juragan_products')
        .select('*')
        .eq('is_active', true)
        .order('sku', { ascending: true })
      if (prodErr) throw prodErr
      setProducts(prodData || [])

      // 2. Fetch Batches
      const { data: batchData, error: batchErr } = await supabase
        .from('juragan_stock_batches')
        .select('*')
        .order('created_at', { ascending: false })
      if (batchErr) throw batchErr
      setBatches(batchData || [])

      // 3. Fetch Audit Logs
      const { data: logsData, error: logsErr } = await supabase
        .from('juragan_audit_logs')
        .select('*')
        .order('created_at', { ascending: false })
        .limit(30)
      if (!logsErr && logsData) {
        setAuditLogs(logsData)
      }
    } catch (e) {
      console.error(e)
      setErrorMsg(e.message || 'Gagal memuat data inventori')
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    const timer = setTimeout(() => {
      fetchData()
    }, 0)
    return () => clearTimeout(timer)
  }, [])

  const handleAddBatch = async (e) => {
    e.preventDefault()
    const weight = parseFloat(newBatch.weight_kg) || 0
    const hpp = parseFloat(newBatch.hpp_per_kg) || 0
    if (weight <= 0) return

    const code = `BATCH-${new Date().toISOString().slice(0,7).replace('-','')}-${Math.floor(100 + Math.random() * 900)}`
    const payload = {
      batch_code: code,
      supplier_id: '11111111-1111-1111-1111-111111111111',
      variant_name: newBatch.variant_name,
      weight_kg: weight,
      remaining_weight_kg: weight,
      hpp_per_kg: hpp,
      total_cost: weight * hpp,
      purchase_date: new Date().toISOString(),
      payment_status: 'pending',
      notes: newBatch.notes || 'Pengambilan stok baru dari pabrik Boyolali'
    }

    try {
      const { error } = await supabase.from('juragan_stock_batches').insert([payload])
      if (error) throw error

      // Record audit log
      await supabase.from('juragan_audit_logs').insert([{
        user_name: 'Owner',
        action_type: 'MASUK',
        module: 'Inventory',
        description: `Ambil stok pabrik baru ${code} (${weight} kg) - Varian: ${newBatch.variant_name}`
      }])

      showToast(`✅ Batch stok ${code} berhasil didaftarkan!`)
      setIsAddModalOpen(false)
      setNewBatch({ variant_name: 'Grade S Murni', weight_kg: '', hpp_per_kg: '120000', notes: '' })
      fetchData()
    } catch (err) {
      alert(`Gagal menambah batch: ${err.message}`)
    }
  }

  const handleDeleteBatch = async (id, code) => {
    if (!window.confirm(`Hapus batch stok ${code}?`)) return
    try {
      const { error } = await supabase.from('juragan_stock_batches').delete().eq('id', id)
      if (error) throw error

      await supabase.from('juragan_audit_logs').insert([{
        user_name: 'Owner',
        action_type: 'HAPUS',
        module: 'Inventory',
        description: `Menghapus batch stok ${code}`
      }])

      showToast(`🗑️ Batch ${code} berhasil dihapus`)
      fetchData()
    } catch (err) {
      alert(`Gagal menghapus batch: ${err.message}`)
    }
  }

  const toggleBatchPayment = async (id, currentStatus) => {
    const nextStatus = currentStatus === 'lunas' ? 'pending' : 'lunas'
    try {
      const { error } = await supabase
        .from('juragan_stock_batches')
        .update({ payment_status: nextStatus })
        .eq('id', id)
      if (error) throw error

      showToast(`💰 Status bayar batch diperbarui ke ${nextStatus.toUpperCase()}`)
      fetchData()
    } catch (err) {
      alert(`Gagal mengubah status bayar: ${err.message}`)
    }
  }

  const updateProductStock = async (id, sku, currentPacks) => {
    const newValStr = window.prompt(`Masukkan sisa stok pack baru untuk ${sku}:`, currentPacks)
    if (newValStr === null) return
    const newVal = parseInt(newValStr)
    if (isNaN(newVal) || newVal < 0) return

    try {
      const { error } = await supabase
        .from('juragan_products')
        .update({ current_stock_pack: newVal })
        .eq('id', id)
      if (error) throw error

      await supabase.from('juragan_audit_logs').insert([{
        user_name: 'Owner',
        action_type: 'ADJUST',
        module: 'Inventory',
        description: `Penyesuaian stok pack ${sku}: ${currentPacks} -> ${newVal} pack`
      }])

      showToast(`⚖️ Stok pack ${sku} disesuaikan ke ${newVal}`)
      fetchData()
    } catch (err) {
      alert(`Gagal update stok: ${err.message}`)
    }
  }

  // Derived metrics
  const totalStockValuation = products.reduce((sum, p) => sum + (p.current_stock_pack * p.hpp_per_unit), 0)
  const lowStockCount = products.filter(p => p.current_stock_pack <= p.min_stock_alert).length
  const totalDebtFactory = batches
    .filter(b => b.payment_status === 'pending')
    .reduce((sum, b) => sum + (parseFloat(b.total_cost) || 0), 0)

  const filteredProducts = products.filter(p => 
    p.sku.toLowerCase().includes(searchQuery.toLowerCase()) || 
    p.product_name.toLowerCase().includes(searchQuery.toLowerCase())
  )

  const tabsList = [
    'Stok Saat Ini (Pack)',
    'Batch Pabrik (Kg)',
    'Log Perubahan'
  ]

  return (
    <div className="space-y-6 text-left font-sans">
      {/* Toast Notification */}
      {toastMsg && (
        <div className="fixed top-5 right-5 z-50 bg-brand-charcoal text-brand-gold px-5 py-3 rounded-2xl shadow-2xl border border-brand-gold/40 text-xs font-bold flex items-center space-x-2 animate-bounce">
          <Sparkles className="w-4 h-4 text-brand-gold" />
          <span>{toastMsg}</span>
        </div>
      )}

      {/* Header Banner */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 bg-gradient-to-r from-brand-maroon via-brand-maroon-dark to-brand-maroon p-6 rounded-2xl text-white shadow-xl border border-brand-gold/30">
        <div>
          <span className="text-xs uppercase tracking-widest text-brand-gold font-bold">Stok & Gudang Pabrik</span>
          <h2 className="text-2xl font-black tracking-tight mt-1 text-white">Gudang & Batch Stok Pabrik</h2>
          <p className="text-xs text-brand-cream/80 mt-1">Pemantauan stok pouch siap jual dan status pelunasan pembelian bawang mentah ke pabrik Boyolali</p>
        </div>
        <button
          onClick={() => setIsAddModalOpen(true)}
          className="inline-flex items-center space-x-2 px-5 py-3 bg-brand-gold hover:bg-brand-gold-dark text-brand-maroon-dark font-black text-xs rounded-xl shadow-lg transition-all active:scale-95 cursor-pointer border-none"
        >
          <Plus className="w-4 h-4" />
          <span>Ambil Stok Pabrik Baru</span>
        </button>
      </div>

      {errorMsg && (
        <div className="p-4 bg-rose-50 border border-rose-200 text-rose-800 rounded-xl text-xs flex items-center space-x-2">
          <AlertCircle className="w-4 h-4 shrink-0 text-rose-600" />
          <span>{errorMsg}</span>
        </div>
      )}

      {/* Stats Summary Strip (Gopek Style) */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <div className="bg-white p-5 rounded-2xl border-2 border-brand-gold/30 shadow-sm">
          <span className="text-[10px] font-bold text-brand-charcoal/60 uppercase tracking-wider">Nilai Aset Stok Gudang</span>
          <p className="text-2xl font-black text-brand-maroon mt-1">Rp {totalStockValuation.toLocaleString('id-ID')}</p>
          <p className="text-xs text-brand-charcoal/50 mt-1">Nilai total berdasarkan HPP per unit</p>
        </div>

        <div className="bg-white p-5 rounded-2xl border-2 border-brand-gold/30 shadow-sm">
          <span className="text-[10px] font-bold text-brand-charcoal/60 uppercase tracking-wider">Tagihan Pabrik (Pending)</span>
          <p className="text-2xl font-black text-amber-600 mt-1">Rp {totalDebtFactory.toLocaleString('id-ID')}</p>
          <p className="text-xs text-amber-700/80 font-bold mt-1">Modal pabrik belum dibayar</p>
        </div>

        <div className="bg-white p-5 rounded-2xl border-2 border-brand-gold/30 shadow-sm">
          <span className="text-[10px] font-bold text-brand-charcoal/60 uppercase tracking-wider">Stok SKU Menipis</span>
          <p className={`text-2xl font-black mt-1 ${lowStockCount > 0 ? 'text-rose-600 animate-pulse' : 'text-emerald-600'}`}>
            {lowStockCount > 0 ? `${lowStockCount} SKU` : 'Stok Aman ✅'}
          </p>
          <p className="text-xs text-brand-charcoal/50 mt-1">Di bawah batas alert minimum stok</p>
        </div>
      </div>

      {/* Tabs Menu */}
      <div className="flex gap-2 border-b border-brand-gold/20 overflow-x-auto scrollbar-hide">
        {tabsList.map((tab, i) => (
          <button
            key={tab}
            onClick={() => setActiveTab(i)}
            className={`py-2.5 px-4 font-bold text-xs border-b-2 transition-all cursor-pointer whitespace-nowrap outline-none ${
              activeTab === i
                ? 'border-brand-maroon text-brand-maroon font-black'
                : 'border-transparent text-gray-500 hover:text-brand-maroon'
            }`}
          >
            {tab}
          </button>
        ))}
      </div>

      {/* Tab Contents */}
      <div className="bg-white rounded-2xl border border-brand-gold/20 shadow-sm overflow-hidden p-6">
        {loading ? (
          <div className="py-12 text-center text-xs text-gray-400 flex items-center justify-center gap-2">
            <RefreshCw className="w-4 h-4 animate-spin text-brand-maroon" />
            <span>Memuat data...</span>
          </div>
        ) : (
          <>
            {/* TAB 0: STOK SAAT INI (PACK) */}
            {activeTab === 0 && (
              <div className="space-y-4">
                <div className="relative w-full">
                  <Search size={15} className="absolute left-3 top-3 text-gray-400" />
                  <input
                    type="text"
                    value={searchQuery}
                    onChange={e => setSearchQuery(e.target.value)}
                    placeholder="Cari produk / SKU..."
                    className="w-full pl-9 pr-4 py-2 bg-brand-cream/10 border border-brand-gold/30 rounded-xl text-xs focus:ring-2 focus:ring-brand-gold focus:outline-none font-semibold text-brand-charcoal"
                  />
                </div>

                <div className="space-y-3">
                  {filteredProducts.map(p => {
                    const isOpen = expandedProduct === p.id
                    const isLow = p.current_stock_pack <= p.min_stock_alert
                    return (
                      <div key={p.id} className={`border rounded-xl transition-all ${isLow ? 'bg-rose-50/50 border-rose-200' : 'bg-white border-brand-gold/20 hover:border-brand-gold/40'}`}>
                        <button
                          onClick={() => setExpandedProduct(isOpen ? null : p.id)}
                          className="w-full flex items-center justify-between p-4 cursor-pointer text-left bg-transparent border-none outline-none"
                        >
                          <div className="space-y-1">
                            <div className="flex items-center gap-2">
                              <span className="font-mono font-bold text-xs text-brand-maroon">{p.sku}</span>
                              <span className="font-extrabold text-sm text-brand-charcoal">{p.product_name}</span>
                              {isLow && <span className="px-2 py-0.5 text-[9px] bg-rose-100 text-rose-800 rounded-full font-bold">Stok Menipis</span>}
                            </div>
                            <div className="text-xs text-gray-500">
                              Kategori: {p.category} | HPP: Rp {fmt(p.hpp_per_unit)} / unit
                            </div>
                          </div>
                          <div className="flex items-center gap-4">
                            <span className={`text-sm font-black ${isLow ? 'text-rose-600' : 'text-brand-maroon-dark'}`}>
                              {p.current_stock_pack} pouch
                            </span>
                            {isOpen ? <ChevronUp size={16} /> : <ChevronDown size={16} />}
                          </div>
                        </button>

                        {isOpen && (
                          <div className="px-4 pb-4 pt-2 border-t border-brand-gold/10 space-y-3">
                            <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 text-xs">
                              <div className="bg-brand-cream/20 p-2.5 rounded-lg border border-brand-gold/10">
                                <span className="text-[10px] text-gray-400 uppercase font-bold block">Harga Solo</span>
                                <span className="font-mono font-bold text-brand-charcoal">Rp {fmt(p.harga_solo_rp)}</span>
                              </div>
                              <div className="bg-brand-cream/20 p-2.5 rounded-lg border border-brand-gold/10">
                                <span className="text-[10px] text-gray-400 uppercase font-bold block">Harga Pusat</span>
                                <span className="font-mono font-bold text-brand-charcoal">Rp {fmt(p.harga_pusat_rp)}</span>
                              </div>
                              <div className="bg-brand-cream/20 p-2.5 rounded-lg border border-brand-gold/10">
                                <span className="text-[10px] text-gray-400 uppercase font-bold block">Harga Marketplace</span>
                                <span className="font-mono font-bold text-brand-charcoal">Rp {fmt(p.harga_marketplace_promo_rp)}</span>
                              </div>
                              <div className="bg-brand-cream/20 p-2.5 rounded-lg border border-brand-gold/10">
                                <span className="text-[10px] text-gray-400 uppercase font-bold block">Harga Grosir/B2B</span>
                                <span className="font-mono font-bold text-brand-charcoal">Rp {fmt(p.harga_grosir_offline_rp)}</span>
                              </div>
                            </div>

                            <div className="flex gap-2">
                              <button
                                onClick={() => updateProductStock(p.id, p.sku, p.current_stock_pack)}
                                className="px-4 py-2 bg-brand-maroon hover:bg-brand-maroon-dark text-white rounded-lg text-xs font-bold transition-all border-none cursor-pointer"
                              >
                                Penyesuaian Stok Pouch
                              </button>
                            </div>
                          </div>
                        )}
                      </div>
                    )
                  })}
                </div>
              </div>
            )}

            {/* TAB 1: BATCH PENGAMBILAN PABRIK (KG) */}
            {activeTab === 1 && (
              <div className="overflow-x-auto">
                <table className="w-full text-left text-xs">
                  <thead className="bg-brand-charcoal text-brand-gold uppercase text-[10px] tracking-wider font-bold">
                    <tr>
                      <th className="p-3.5">Kode Batch</th>
                      <th className="p-3.5">Varian Bawang</th>
                      <th className="p-3.5">Berat Awal</th>
                      <th className="p-3.5">Sisa Stok</th>
                      <th className="p-3.5">HPP Pabrik / Kg</th>
                      <th className="p-3.5">Total Tagihan</th>
                      <th className="p-3.5">Status Pembayaran</th>
                      <th className="p-3.5">Catatan</th>
                      <th className="p-3.5 text-center">Aksi</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-brand-maroon/10">
                    {batches.map(b => (
                      <tr key={b.id} className="hover:bg-brand-cream/10 transition-colors">
                        <td className="p-3.5 font-bold font-mono text-brand-maroon">{b.batch_code}</td>
                        <td className="p-3.5 font-bold text-brand-charcoal">{b.variant_name}</td>
                        <td className="p-3.5 font-medium">{b.weight_kg} kg</td>
                        <td className="p-3.5 font-black text-brand-maroon-dark">{b.remaining_weight_kg} kg</td>
                        <td className="p-3.5 font-mono">Rp {fmt(b.hpp_per_kg)}</td>
                        <td className="p-3.5 font-bold text-brand-charcoal font-mono">Rp {fmt(b.total_cost)}</td>
                        <td className="p-3.5">
                          <button
                            onClick={() => toggleBatchPayment(b.id, b.payment_status)}
                            className="cursor-pointer transition-transform active:scale-95 border-none bg-transparent"
                            title="Klik untuk ubah status pembayaran"
                          >
                            {b.payment_status === 'lunas' ? (
                              <span className="px-2.5 py-1 bg-emerald-100 text-emerald-800 rounded-full font-bold text-[10px] inline-flex items-center space-x-1 border border-emerald-300">
                                <span>LUNAS ✅</span>
                              </span>
                            ) : (
                              <span className="px-2.5 py-1 bg-amber-100 text-amber-800 rounded-full font-bold text-[10px] inline-flex items-center space-x-1 border border-amber-300">
                                <span>PENDING ⏳</span>
                              </span>
                            )}
                          </button>
                        </td>
                        <td className="p-3.5 text-gray-500 max-w-xs">{b.notes}</td>
                        <td className="p-3.5 text-center">
                          <button
                            onClick={() => handleDeleteBatch(b.id, b.batch_code)}
                            className="p-1.5 text-rose-500 hover:bg-rose-50 rounded-lg transition-colors cursor-pointer border-none bg-transparent"
                            title="Hapus batch"
                          >
                            <Trash2 className="w-4 h-4" />
                          </button>
                        </td>
                      </tr>
                    ))}
                    {batches.length === 0 && (
                      <tr>
                        <td colSpan={9} className="p-10 text-center text-gray-400 italic">Belum ada batch stok dari pabrik.</td>
                      </tr>
                    )}
                  </tbody>
                </table>
              </div>
            )}

            {/* TAB 2: LOG PERUBAHAN */}
            {activeTab === 2 && (
              <div className="space-y-3 font-mono text-xs max-h-[500px] overflow-y-auto pr-2">
                {auditLogs.length === 0 ? (
                  <div className="py-12 text-center text-gray-400 italic">Belum ada catatan log perubahan.</div>
                ) : (
                  auditLogs.map(log => (
                    <div key={log.id} className="p-3.5 rounded-xl border border-brand-gold/15 bg-brand-cream/5 flex justify-between items-start gap-4">
                      <div className="space-y-1">
                        <div className="flex items-center gap-2">
                          <span className={`px-2 py-0.5 rounded text-[9px] font-black uppercase ${
                            log.action_type === 'MASUK' ? 'bg-emerald-100 text-emerald-800' :
                            log.action_type === 'ADJUST' ? 'bg-amber-100 text-amber-800' : 'bg-rose-100 text-rose-800'
                          }`}>
                            {log.action_type}
                          </span>
                          <span className="font-bold text-brand-charcoal">Module: {log.module || 'Gudang'}</span>
                        </div>
                        <p className="text-brand-charcoal/80 leading-relaxed text-[11px]">{log.description}</p>
                      </div>
                      <div className="text-right shrink-0 text-[10px] text-gray-400">
                        <span>{fmtDate(log.created_at)}</span>
                      </div>
                    </div>
                  ))
                )}
              </div>
            )}
          </>
        )}
      </div>

      {/* Add Batch Modal */}
      {isAddModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm">
          <div className="bg-white rounded-2xl border-2 border-brand-gold p-6 max-w-md w-full shadow-2xl space-y-4 text-left">
            <div className="border-b border-brand-maroon/10 pb-3 flex justify-between items-center">
              <h3 className="font-black text-lg text-brand-maroon">Ambil Stok Pabrik Baru</h3>
              <button onClick={() => setIsAddModalOpen(false)} className="text-gray-400 hover:text-gray-600 cursor-pointer border-none bg-transparent">
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleAddBatch} className="space-y-3.5 text-xs">
              <div>
                <label className="font-extrabold text-brand-charcoal block mb-1">Varian Bawang</label>
                <select
                  value={newBatch.variant_name}
                  onChange={(e) => {
                    const val = e.target.value
                    setNewBatch({
                      ...newBatch,
                      variant_name: val,
                      hpp_per_kg: val.includes('Grade S') ? '120000' : '105000'
                    })
                  }}
                  className="w-full p-2.5 border border-brand-gold/40 rounded-xl focus:ring-2 focus:ring-brand-gold font-bold text-brand-maroon focus:outline-none"
                >
                  <option value="Grade S Murni">Grade S Murni (100% Tanpa Tepung)</option>
                  <option value="Grade A Crispy">Grade A Crispy (Renyah Gurih)</option>
                </select>
              </div>

              <div>
                <label className="font-extrabold text-brand-charcoal block mb-1">Berat Pengambilan (Kg) *</label>
                <input
                  type="number"
                  step="0.1"
                  required
                  placeholder="Contoh: 5.0"
                  value={newBatch.weight_kg}
                  onChange={(e) => setNewBatch({ ...newBatch, weight_kg: e.target.value })}
                  className="w-full p-2.5 border border-brand-gold/40 rounded-xl focus:ring-2 focus:ring-brand-gold font-mono font-bold focus:outline-none"
                />
              </div>

              <div>
                <label className="font-extrabold text-brand-charcoal block mb-1">Harga Beli Pabrik per Kg (Rp)</label>
                <input
                  type="number"
                  required
                  value={newBatch.hpp_per_kg}
                  onChange={(e) => setNewBatch({ ...newBatch, hpp_per_kg: e.target.value })}
                  className="w-full p-2.5 border border-brand-gold/40 rounded-xl focus:ring-2 focus:ring-brand-gold font-mono font-bold focus:outline-none"
                />
              </div>

              <div>
                <label className="font-extrabold text-brand-charcoal block mb-1">Catatan</label>
                <input
                  type="text"
                  placeholder="Misal: Pengambilan batch 4 oleh Sdr. Fahru"
                  value={newBatch.notes}
                  onChange={(e) => setNewBatch({ ...newBatch, notes: e.target.value })}
                  className="w-full p-2.5 border border-brand-gold/40 rounded-xl focus:ring-2 focus:ring-brand-gold focus:outline-none"
                />
              </div>

              <div className="pt-3 flex space-x-2">
                <button
                  type="submit"
                  className="flex-1 py-3 bg-brand-maroon text-white font-black rounded-xl shadow-lg hover:bg-brand-maroon-dark transition-all cursor-pointer border-none text-xs"
                >
                  Daftarkan Batch Stok
                </button>
                <button
                  type="button"
                  onClick={() => setIsAddModalOpen(false)}
                  className="px-4 py-3 border border-brand-maroon/20 text-brand-charcoal font-bold rounded-xl hover:bg-brand-cream cursor-pointer text-xs"
                >
                  Batal
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  )
}

function X({ className }) {
  return (
    <svg className={className} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2">
      <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
    </svg>
  )
}
