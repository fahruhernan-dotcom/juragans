import { useState, useEffect } from 'react'
import { supabase, isSupabaseConfigured } from '../../lib/supabaseClient'
import { Package, RefreshCw, Printer, Download, Copy, Check, MapPin, AlertCircle, CheckSquare } from 'lucide-react'

export default function WarehousePackingView() {
  const [sales, setSales] = useState([])
  const [saleItems, setSaleItems] = useState([])
  const [loading, setLoading] = useState(true)
  const [copied, setCopied] = useState(false)
  const [errorMsg, setErrorMsg] = useState('')

  const fetchWarehouseData = async () => {
    setLoading(true)
    setErrorMsg('')
    try {
      if (!isSupabaseConfigured()) {
        throw new Error('Supabase belum dikonfigurasi di .env')
      }

      // Fetch pending sales
      const { data: salesData, error: salesErr } = await supabase
        .from('juragan_sales')
        .select('*')
        .order('invoice_number', { ascending: true })

      if (salesErr) throw salesErr

      const pendingSales = (salesData || []).filter(s => 
        s.delivery_status && s.delivery_status.toLowerCase().includes('menunggu')
      )
      setSales(pendingSales)

      // Fetch sale items
      const saleIds = pendingSales.map(s => s.id)
      if (saleIds.length > 0) {
        const { data: itemsData, error: itemsErr } = await supabase
          .from('juragan_sale_items')
          .select('*')
          .in('sale_id', saleIds)

        if (itemsErr) throw itemsErr
        setSaleItems(itemsData || [])
      } else {
        setSaleItems([])
      }
    } catch (err) {
      console.error('Error fetching warehouse packing data:', err)
      setErrorMsg(err.message || 'Gagal mengambil data dari Supabase')
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    const timer = setTimeout(() => {
      fetchWarehouseData()
    }, 0)

    let channel
    if (isSupabaseConfigured()) {
      channel = supabase
        .channel('warehouse_packing_live')
        .on('postgres_changes', { event: '*', schema: 'public', table: 'juragan_sales' }, () => {
          fetchWarehouseData()
        })
        .on('postgres_changes', { event: '*', schema: 'public', table: 'juragan_sale_items' }, () => {
          fetchWarehouseData()
        })
        .subscribe()
    }

    return () => {
      clearTimeout(timer)
      if (channel) {
        supabase.removeChannel(channel)
      }
    }
  }, [])

  // 1. STEP 1: Global Pick List (Total per SKU across all pending orders)
  const globalPickList = {}
  let totalPacksCount = 0
  let totalWeightKgCount = 0

  sales.forEach(sale => {
    totalWeightKgCount += parseFloat(sale.total_weight_kg) || 0
    const items = saleItems.filter(item => item.sale_id === sale.id)

    if (items.length > 0) {
      items.forEach(it => {
        const pname = it.product_name || 'Bawang Goreng'
        const qty = it.quantity || 1
        const gram = it.weight_gram || 200
        const key = `${pname} (${gram}g)`
        if (!globalPickList[key]) {
          globalPickList[key] = { name: pname, gram, qty: 0 }
        }
        globalPickList[key].qty += qty
        totalPacksCount += qty
      })
    } else {
      const notesName = sale.notes || 'Bawang Goreng'
      if (!globalPickList[notesName]) {
        globalPickList[notesName] = { name: notesName, gram: 200, qty: 0 }
      }
      globalPickList[notesName].qty += 1
      totalPacksCount += 1
    }
  })

  // 2. STEP 2: Group Sales by Area Cluster (Solo Raya, Semarang, Jakarta / Jabodetabek)
  const salesByCluster = {}
  sales.forEach(sale => {
    const area = sale.area || 'Solo Raya'
    if (!salesByCluster[area]) {
      salesByCluster[area] = []
    }
    salesByCluster[area].push(sale)
  })

  // WhatsApp 2-Step Pick & Pack Text Generator
  const generateWaText = () => {
    const todayStr = new Date().toLocaleDateString('id-ID', { day: 'numeric', month: 'long', year: 'numeric' })

    let text = `====================================================\n`
    text += `📦 *LEMBAR KERJA GUDANG (PICK & PACK LIST)*\n`
    text += `*Juragan by Anak Bawang — ${todayStr}*\n`
    text += `====================================================\n\n`

    text += `🔥 *STEP 1: AMBIL STOK DARI RAK UTAMA (GLOBAL PICK LIST)*\n`
    text += `----------------------------------------------------\n`
    Object.entries(globalPickList).forEach(([skuKey, data]) => {
      const totWeight = (data.gram * data.qty) / 1000.0
      text += `[ ] *${skuKey}*: ${data.qty} Pouch (${totWeight.toFixed(2)} kg)\n`
    })
    text += `----------------------------------------------------\n`
    text += `*TOTAL HARUS DIAMBIL*: *${totalPacksCount} Pouch (${totalWeightKgCount.toFixed(2)} kg)*\n\n`

    text += `====================================================\n`
    text += `📦 *STEP 2: BUNGKUS PER PAKET CUSTOMER (PACKING & RESI)*\n`
    text += `====================================================\n\n`

    Object.keys(salesByCluster).forEach(clusterName => {
      text += `📍 *AREA: ${clusterName.toUpperCase()}*\n`
      text += `----------------------------------------------------\n`
      salesByCluster[clusterName].forEach((s, idx) => {
        const isSpecialRepack = s.notes && s.notes.toLowerCase().includes('tanpa stiker')
        text += `${idx + 1}. [ ] *${s.customer_name.toUpperCase()}* — ${s.total_weight_kg} kg\n`
        text += `   • Items: ${s.notes}\n`
        if (isSpecialRepack) {
          text += `   • ⚠️ *PERHATIAN: POUCH POLOS TANPA STIKER (REPACK)*\n`
        }
        if (s.shipping_address && s.shipping_address !== '-') {
          text += `   • Alamat: ${s.shipping_address}\n`
        }
        text += `\n`
      })
      text += `\n`
    })

    text += `Segera proses bungkusan dan tempel resi. Terima kasih tim gudang! 🙏`
    return text
  }

  const handleCopyWa = () => {
    const text = generateWaText()
    navigator.clipboard.writeText(text)
    setCopied(true)
    setTimeout(() => setCopied(false), 2500)
  }

  const handleExportCSV = () => {
    let csvContent = 'data:text/csv;charset=utf-8,'
    csvContent += 'Kategori_Step,Area_Cluster,Varian_SKU,Jumlah_Pack,Nama_Customer,Berat_Kg,Instruksi_Khusus\n'

    // Step 1 Pick List
    Object.entries(globalPickList).forEach(([skuKey, data]) => {
      csvContent += `STEP1_GLOBAL_PICK,-,"${skuKey}",${data.qty},-,-,Ambil dari Rak Utama\n`
    })

    // Step 2 Pack List
    Object.keys(salesByCluster).forEach(cluster => {
      salesByCluster[cluster].forEach(s => {
        csvContent += `STEP2_PACKING_CUSTOMER,${cluster},"${s.notes.replace(/"/g, '""')}",-,${s.customer_name},${s.total_weight_kg},"${(s.shipping_address || '').replace(/"/g, '""')}"\n`
      })
    })

    const encodedUri = encodeURI(csvContent)
    const link = document.createElement('a')
    link.setAttribute('href', encodedUri)
    link.setAttribute('download', `pick_and_pack_gudang_${new Date().toISOString().slice(0, 10)}.csv`)
    document.body.appendChild(link)
    link.click()
    document.body.removeChild(link)
  }

  return (
    <div className="space-y-6 text-left font-sans print:p-0">
      {/* Top Bar Controls */}
      <div className="print:hidden space-y-6">
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 bg-gradient-to-r from-brand-maroon to-brand-maroon-dark p-6 rounded-2xl text-white shadow-lg border border-brand-gold/30">
          <div>
            <div className="flex items-center space-x-2">
              <span className="text-xs uppercase tracking-widest text-brand-gold font-bold">Gudang Operasional</span>
              <span className="px-2 py-0.5 text-[10px] bg-emerald-500 text-white font-bold rounded-full animate-pulse">
                REAL-TIME PICK & PACK ⚡
              </span>
            </div>
            <h2 className="text-2xl font-bold tracking-tight mt-1 text-white">Lembar Kerja Gudang (2-Step Picking)</h2>
            <p className="text-xs text-brand-cream/80 mt-1">Sistem 2-Step: Ambil stok global dari rak terlebih dahulu ➔ lalu bungkusi per customer</p>
          </div>

          <div className="flex flex-wrap items-center gap-2">
            <button
              onClick={handleCopyWa}
              className="inline-flex items-center space-x-1.5 px-4 py-2 bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs rounded-xl shadow transition-all cursor-pointer active:scale-95"
            >
              {copied ? <Check className="w-4 h-4 text-brand-gold" /> : <Copy className="w-4 h-4" />}
              <span>{copied ? 'Teks WA Tersalin!' : 'Salin Teks WA'}</span>
            </button>

            <button
              onClick={handleExportCSV}
              className="inline-flex items-center space-x-1.5 px-3.5 py-2 bg-white/10 hover:bg-white/20 text-white font-bold text-xs rounded-xl border border-white/20 shadow transition-all cursor-pointer"
            >
              <Download className="w-4 h-4 text-brand-gold" />
              <span>Export CSV</span>
            </button>

            <button
              onClick={() => window.print()}
              className="inline-flex items-center space-x-1.5 px-3.5 py-2 bg-brand-gold hover:bg-brand-gold-dark text-brand-maroon-dark font-bold text-xs rounded-xl shadow transition-all cursor-pointer"
            >
              <Printer className="w-4 h-4" />
              <span>Cetak Form Gudang</span>
            </button>

            <button
              onClick={fetchWarehouseData}
              className="p-2 text-white hover:bg-white/10 rounded-xl transition-colors cursor-pointer"
              title="Refresh Data"
            >
              <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} />
            </button>
          </div>
        </div>

        {errorMsg && (
          <div className="p-4 bg-rose-50 border border-rose-200 text-rose-800 rounded-xl text-xs flex items-center space-x-2">
            <AlertCircle className="w-4 h-4 shrink-0 text-rose-600" />
            <span>{errorMsg}</span>
          </div>
        )}
      </div>

      {/* PRINTABLE & MAIN WORKSHEET */}
      <div className="space-y-8 bg-white p-6 rounded-2xl border border-brand-gold/30 shadow-sm print:border-none print:p-0">
        
        {/* Printable Header */}
        <div className="border-b-2 border-brand-charcoal pb-4 text-left">
          <div className="flex justify-between items-start">
            <div>
              <h1 className="text-2xl font-black text-brand-maroon uppercase tracking-tight">
                📦 LEMBAR KERJA GUDANG (PICK & PACK LIST)
              </h1>
              <p className="text-xs text-brand-charcoal/80 font-bold mt-1">
                JURAGAN BY ANAK BAWANG • Tanggal: {new Date().toLocaleDateString('id-ID', { day: 'numeric', month: 'long', year: 'numeric' })}
              </p>
            </div>
            <div className="text-right">
              <span className="text-xs font-bold bg-brand-charcoal text-brand-gold px-3 py-1 rounded-lg">
                TOTAL: {totalPacksCount} POUCH ({totalWeightKgCount.toFixed(2)} KG)
              </span>
            </div>
          </div>
        </div>

        {/* STEP 1: GLOBAL PICK LIST FROM SHELF */}
        <div className="space-y-3">
          <div className="bg-brand-maroon text-white px-4 py-3 rounded-xl flex justify-between items-center">
            <h3 className="font-black text-sm uppercase tracking-wider flex items-center space-x-2">
              <CheckSquare className="w-5 h-5 text-brand-gold" />
              <span>STEP 1: AMBIL STOK SEKALIGUS DARI RAK/DUS UTAMA (GLOBAL PICK LIST)</span>
            </h3>
            <span className="text-xs text-brand-gold font-bold">Instruksi: Ambil total pouch di bawah ini dulu</span>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
            {Object.entries(globalPickList).map(([skuKey, data]) => {
              const weightKg = (data.gram * data.qty) / 1000.0
              return (
                <div key={skuKey} className="border-2 border-brand-gold/40 bg-brand-cream/30 p-4 rounded-xl flex items-center justify-between hover:bg-brand-cream/50 transition-colors">
                  <div className="flex items-center space-x-3">
                    <input type="checkbox" className="w-5 h-5 accent-brand-maroon rounded cursor-pointer" />
                    <div>
                      <h4 className="font-extrabold text-sm text-brand-charcoal">{skuKey}</h4>
                      <p className="text-[11px] text-brand-charcoal/70 font-medium">Volume: {weightKg.toFixed(2)} kg</p>
                    </div>
                  </div>
                  <div className="text-right">
                    <span className="text-2xl font-black text-brand-maroon font-mono">{data.qty}</span>
                    <span className="text-xs font-bold text-brand-charcoal/70 ml-1">pack</span>
                  </div>
                </div>
              )
            })}
          </div>
        </div>

        {/* STEP 2: CUSTOMER PACK LIST BY AREA CLUSTER */}
        <div className="space-y-4 pt-4 border-t-2 border-brand-maroon/20">
          <div className="bg-brand-charcoal text-brand-gold px-4 py-3 rounded-xl flex justify-between items-center">
            <h3 className="font-black text-sm uppercase tracking-wider flex items-center space-x-2">
              <Package className="w-5 h-5 text-brand-gold" />
              <span>STEP 2: BUNGKUS PER PAKET CUSTOMER (PACKING & RESI)</span>
            </h3>
            <span className="text-xs text-white font-bold">Instruksi: Masukkan item ke kardus & tempel resi</span>
          </div>

          {Object.keys(salesByCluster).length === 0 ? (
            <div className="p-8 text-center bg-gray-50 rounded-xl text-gray-400 italic text-xs">
              Tidak ada antrean pesanan yang menunggu packing saat ini.
            </div>
          ) : (
            <div className="space-y-6">
              {Object.entries(salesByCluster).map(([clusterName, clusterSales]) => (
                <div key={clusterName} className="border border-brand-gold/40 rounded-xl overflow-hidden shadow-sm">
                  {/* Cluster Area Header */}
                  <div className="bg-brand-cream/70 border-b border-brand-gold/30 p-3 flex justify-between items-center">
                    <div className="flex items-center space-x-2 font-black text-xs text-brand-maroon uppercase">
                      <MapPin className="w-4 h-4 text-brand-gold" />
                      <span>AREA: {clusterName}</span>
                    </div>
                    <span className="text-xs font-bold text-brand-charcoal font-mono bg-white px-2.5 py-0.5 rounded-md border border-brand-gold/20">
                      {clusterSales.length} Customer ({clusterSales.reduce((sum, s) => sum + (parseFloat(s.total_weight_kg) || 0), 0).toFixed(2)} kg)
                    </span>
                  </div>

                  {/* Customer Item List */}
                  <div className="divide-y divide-brand-maroon/10">
                    {clusterSales.map((s, idx) => {
                      const isSpecialRepack = s.notes && (s.notes.toLowerCase().includes('tanpa stiker') || s.notes.toLowerCase().includes('polos'))
                      return (
                        <div key={s.id} className="p-4 hover:bg-brand-cream/10 transition-colors flex items-start justify-between gap-4">
                          <div className="flex items-start space-x-3">
                            <input type="checkbox" className="w-5 h-5 accent-brand-maroon rounded cursor-pointer mt-0.5" />
                            <div>
                              <div className="flex items-center space-x-2">
                                <span className="font-extrabold text-sm text-brand-charcoal uppercase">{idx + 1}. {s.customer_name}</span>
                                <span className="font-mono text-xs font-bold text-brand-maroon bg-brand-gold/20 px-2 py-0.5 rounded">
                                  {s.total_weight_kg} kg
                                </span>
                                {isSpecialRepack && (
                                  <span className="bg-rose-600 text-white px-2.5 py-0.5 rounded-full text-[10px] font-black uppercase tracking-wider animate-pulse">
                                    ⚠️ POUCH POLOS TANPA STIKER (REPACK)
                                  </span>
                                )}
                              </div>

                              <p className="text-xs font-bold text-brand-maroon-dark mt-1">
                                🛒 Items: {s.notes}
                              </p>

                              {s.shipping_address && s.shipping_address !== '-' && (
                                <p className="text-[11px] text-brand-charcoal/70 mt-1 italic">
                                  📍 Alamat: {s.shipping_address}
                                </p>
                              )}
                            </div>
                          </div>

                          <div className="text-right shrink-0">
                            <span className="text-[11px] font-bold text-emerald-700 bg-emerald-50 px-2.5 py-1 rounded-lg border border-emerald-200 block">
                              + Kardus Packing
                            </span>
                          </div>
                        </div>
                      )
                    })}
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Print Footer */}
        <div className="hidden print:block text-right pt-6 text-[10px] text-brand-charcoal/60 border-t border-brand-charcoal/20">
          Dicetak dari Lembar Kerja Gudang Juragan by Anak Bawang • System 2-Step Pick & Pack
        </div>
      </div>
    </div>
  )
}
