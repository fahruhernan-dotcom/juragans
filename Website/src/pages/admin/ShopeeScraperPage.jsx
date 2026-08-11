import { useState, useEffect, useCallback } from 'react'
import {
  ShoppingCart, Search, RefreshCw, ExternalLink, TrendingUp, DollarSign,
  MapPin, Store, Scale, Check, ArrowRight, Play, CheckCircle2, Lock,
  Terminal, Copy, CheckCircle
} from 'lucide-react'

const formatRp = (n) =>
  new Intl.NumberFormat('id-ID', { style: 'currency', currency: 'IDR', maximumFractionDigits: 0 }).format(n || 0)

const KEYWORD_PRESETS = [
  'bawang goreng murni',
  'bawang merah boyolali',
  'bawang goreng 1kg',
  'bawang goreng crispy',
  'bawang goreng horeca',
]

const TARGET_SHOPS = [
  { name: 'Bandung Restokoe', url: 'https://shopee.co.id/bandung.restokoe?searchKeyword=bawang%20goreng' },
  { name: 'Mbwangg', url: 'https://shopee.co.id/mbawangg?searchKeyword=bawang%20goreng' },
  { name: 'Dapur Mamah Mia', url: 'https://shopee.co.id/dapurmamahmia?searchKeyword=bawang%20goreng' },
  { name: 'Agustina Widayanti', url: 'https://shopee.co.id/agustina.widayanti?searchKeyword=bawang%20goreng' },
]

export default function ShopeeScraperPage({ workerInfo }) {
  const [keyword, setKeyword] = useState('bawang goreng murni')
  const [data, setData]       = useState({ products: [], stats: {} })
  const [loading, setLoading] = useState(false)
  const [copySuccess, setCopySuccess] = useState(false)
  
  // Scraper Mode: 'keyword' | 'direct'
  const [scrapeMode, setScrapeMode] = useState('keyword')
  const [shopeeUrl, setShopeeUrl]   = useState('')
  const [shopId, setShopId]         = useState('')
  const [itemId, setItemId]         = useState('')
  const [category, setCategory]     = useState('')
  const [shopUsername, setShopUsername] = useState('')
  const [useApify, setUseApify]     = useState(true)

  // Step-by-Step User Flow Modal State (1: Mulai, 2: Login Chrome, 3: Konfirmasi)
  const [workflowStep, setWorkflowStep] = useState(0) // 0 = Closed, 1 = Ready to Start, 2 = Waiting Login, 3 = Confirmed
  const [activeTarget, setActiveTarget] = useState('target_shops')

  const fetchShopeeData = useCallback(async () => {
    try {
      const res = await fetch('http://127.0.0.1:5000/api/shopee-data')
      if (res.ok) {
        const json = await res.json()
        setData(json)
      }
    } catch {
      /* bridge offline fallback */
    }
  }, [])

  useEffect(() => {
    const timer = setTimeout(() => { fetchShopeeData() }, 0)
    return () => clearTimeout(timer)
  }, [fetchShopeeData])

  // Automatically advance step to Step 2 if worker is waiting for login
  useEffect(() => {
    if (workerInfo?.waiting_for_login) {
      const timer = setTimeout(() => {
        setWorkflowStep((prev) => (prev === 1 ? 2 : prev))
      }, 0)
      return () => clearTimeout(timer)
    }
  }, [workerInfo?.waiting_for_login])

  const openScrapeWizard = (targetKw, forcedMode) => {
    if (forcedMode) setScrapeMode(forcedMode)
    setActiveTarget(targetKw || keyword)
    setWorkflowStep(1) // Step 1: Ready to Start
  }

  const handleStartScraperStep = async () => {
    setLoading(true)
    try {
      const res = await fetch('http://127.0.0.1:5000/api/scrape-shopee', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          mode: scrapeMode,
          keyword: activeTarget || keyword,
          shopee_url: shopeeUrl,
          shop_id: shopId,
          item_id: itemId,
          category: category,
          shop_username: shopUsername,
          use_apify: useApify,
        }),
      })
      const json = await res.json()
      if (res.ok) {
        setWorkflowStep(2) // Advance to Step 2: Login Chrome check
      } else {
        alert(`⚠️ ${json.error || 'Gagal memicu scraper.'}`)
      }
    } catch {
      alert('❌ Backend Bridge Offline. Pastikan server_bridge.py berjalan.')
    } finally {
      setLoading(false)
    }
  }

  const handleConfirmLoginStep = async () => {
    try {
      const r = await fetch('http://127.0.0.1:5000/api/confirm-login', { method: 'POST' })
      if (r.ok) {
        setWorkflowStep(3) // Step 3: Confirmed & Scraping 1-by-1
        setTimeout(() => {
          fetchShopeeData()
        }, 4000)
      }
    } catch {
      alert('❌ Gagal mengirim konfirmasi login.')
    }
  }

  const logsList = workerInfo?.logs || [workerInfo?.last_log || 'Backend bridge server is ready.']

  const copyLogsToClipboard = () => {
    const fullLogText = logsList.join('\n')
    navigator.clipboard.writeText(fullLogText).then(() => {
      setCopySuccess(true)
      setTimeout(() => setCopySuccess(false), 2500)
    }).catch(() => {
      alert('Gagal menyalin log ke clipboard.')
    })
  }

  const { products = [], stats = {} } = data

  return (
    <div className="space-y-6">

      {/* Step-by-Step User Flow Launcher Banner */}
      <div className="bg-white p-6 rounded-3xl border border-brand-gold/30 shadow-sm space-y-4">
        <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
          <div className="flex items-center gap-3.5">
            <div className="w-11 h-11 bg-brand-maroon text-brand-gold rounded-2xl flex items-center justify-center flex-shrink-0 font-black text-lg">
              1-2-3
            </div>
            <div>
              <h3 className="font-bold text-base text-gray-900">Alur Riset Shopee 3-Langkah (User Flow Presisi)</h3>
              <p className="text-xs text-gray-500 mt-0.5">
                Tombol Mulai &rarr; Buka Chrome / Selesaikan Login &rarr; Konfirmasi & Scrape 1 per 1.
              </p>
            </div>
          </div>

          <button
            onClick={() => openScrapeWizard('target_shops')}
            className="py-3 px-6 bg-brand-maroon hover:bg-brand-maroon-dark text-white font-extrabold text-xs rounded-2xl shadow-md flex items-center justify-center gap-2 transition-all active:scale-95 w-full md:w-auto"
          >
            <Play className="w-4 h-4 fill-brand-gold text-brand-maroon" />
            <span>Mulai Flow Riset Shopee Baru</span>
          </button>
        </div>

        {/* Step Indicator Visual */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-3 pt-2 border-t border-gray-100 text-xs">
          <div className="flex items-center gap-3 p-3 bg-brand-cream/40 rounded-2xl border border-brand-gold/20">
            <span className="w-7 h-7 bg-brand-maroon text-white font-black rounded-xl flex items-center justify-center flex-shrink-0">1</span>
            <div>
              <p className="font-bold text-brand-maroon">1. Tekan Tombol Mulai</p>
              <p className="text-[10px] text-gray-500">Inisiasi bot & Chrome browser.</p>
            </div>
          </div>

          <div className="flex items-center gap-3 p-3 bg-amber-50 rounded-2xl border border-amber-200">
            <span className="w-7 h-7 bg-amber-500 text-white font-black rounded-xl flex items-center justify-center flex-shrink-0">2</span>
            <div>
              <p className="font-bold text-amber-900">2. Lanjut Ke Login / CAPTCHA</p>
              <p className="text-[10px] text-amber-700">Verifikasi di jendela Chrome Shopee.</p>
            </div>
          </div>

          <div className="flex items-center gap-3 p-3 bg-emerald-50 rounded-2xl border border-emerald-200">
            <span className="w-7 h-7 bg-emerald-600 text-white font-black rounded-xl flex items-center justify-center flex-shrink-0">3</span>
            <div>
              <p className="font-bold text-emerald-900">3. Konfirmasi & Scrape 1 per 1</p>
              <p className="text-[10px] text-emerald-700">Ekstraksi harga, berat & per kg.</p>
            </div>
          </div>
        </div>
      </div>

      {/* ── INTERACTIVE WORKFLOW STEPPER MODAL ── */}
      {workflowStep > 0 && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-md animate-scale-in">
          <div className="bg-white rounded-3xl max-w-lg w-full p-6 space-y-6 border border-brand-gold/30 shadow-2xl relative">
            
            {/* Modal Header */}
            <div className="flex items-center justify-between border-b border-gray-100 pb-4">
              <div>
                <span className="text-[10px] font-extrabold uppercase tracking-widest text-brand-maroon block">
                  Interactive User Flow Wizard
                </span>
                <h3 className="font-bold text-lg text-gray-900 mt-0.5">Alur Automasi Scraper Shopee</h3>
              </div>
              <button
                onClick={() => setWorkflowStep(0)}
                className="w-8 h-8 rounded-full bg-gray-100 hover:bg-gray-200 text-gray-500 font-bold flex items-center justify-center text-sm"
              >
                ✕
              </button>
            </div>

            {/* Stepper Progress Bar */}
            <div className="flex items-center justify-between relative px-2">
              <div className="absolute left-6 right-6 top-1/2 -translate-y-1/2 h-1 bg-gray-100 z-0" />
              <div
                className="absolute left-6 top-1/2 -translate-y-1/2 h-1 bg-brand-maroon transition-all duration-500 z-0"
                style={{ width: `${((workflowStep - 1) / 2) * 85}%` }}
              />

              {[
                { num: 1, label: 'Mulai' },
                { num: 2, label: 'Login' },
                { num: 3, label: 'Scrape 1-by-1' }
              ].map(({ num, label }) => (
                <div key={num} className="relative z-10 flex flex-col items-center gap-1">
                  <div className={`w-9 h-9 rounded-2xl font-black text-xs flex items-center justify-center transition-all ${
                    workflowStep === num
                      ? 'bg-brand-maroon text-white ring-4 ring-brand-maroon/20 scale-110'
                      : workflowStep > num
                      ? 'bg-emerald-500 text-white'
                      : 'bg-gray-200 text-gray-500'
                  }`}>
                    {workflowStep > num ? <Check className="w-4 h-4" /> : num}
                  </div>
                  <span className="text-[11px] font-bold text-gray-700">{label}</span>
                </div>
              ))}
            </div>

            {/* Step 1 Content: Ready to Start */}
            {workflowStep === 1 && (
              <div className="space-y-4 py-2">
                <div className="p-4 bg-brand-cream/50 rounded-2xl border border-brand-gold/30 space-y-2">
                  <div className="flex items-center gap-2">
                    <Play className="w-4 h-4 text-brand-maroon fill-brand-maroon" />
                    <h4 className="font-bold text-sm text-brand-maroon">Langkah 1: Inisiasi Bot Shopee</h4>
                  </div>
                  <p className="text-xs text-gray-600 leading-relaxed">
                    Target riset saat ini: <strong className="text-brand-maroon font-bold">{activeTarget}</strong>.
                    Klik tombol <strong>Mulai Scrape Sekarang</strong> di bawah untuk membuka Chrome otomatis.
                  </p>
                </div>

                <div className="flex items-center justify-end gap-2 pt-2">
                  <button
                    onClick={() => setWorkflowStep(0)}
                    className="py-2.5 px-4 bg-gray-100 text-gray-600 font-bold text-xs rounded-xl hover:bg-gray-200"
                  >
                    Batal
                  </button>
                  <button
                    onClick={handleStartScraperStep}
                    disabled={loading}
                    className="py-3 px-6 bg-brand-maroon hover:bg-brand-maroon-dark text-white font-extrabold text-xs rounded-xl shadow-lg flex items-center gap-2 transition-all active:scale-95"
                  >
                    <span>{loading ? 'Memulai Bot...' : 'Mulai Scrape Sekarang'}</span>
                    <ArrowRight className="w-4 h-4" />
                  </button>
                </div>
              </div>
            )}

            {/* Step 2 Content: Login / CAPTCHA */}
            {workflowStep === 2 && (
              <div className="space-y-4 py-2">
                <div className="p-4 bg-amber-50 rounded-2xl border border-amber-300 space-y-2 animate-pulse">
                  <div className="flex items-center gap-2">
                    <Lock className="w-4 h-4 text-amber-700" />
                    <h4 className="font-bold text-sm text-amber-900">Langkah 2: Cek & Login di Jendela Chrome</h4>
                  </div>
                  <p className="text-xs text-amber-800 leading-relaxed">
                    Jendela Chrome telah terbuka di Shopee. Silakan selesaikan Login atau puzzle CAPTCHA (jika ada) di jendela Chrome tersebut.
                  </p>
                </div>

                <div className="p-3 bg-gray-50 rounded-xl text-[11px] text-gray-500 space-y-1 font-mono">
                  <p className="font-bold text-gray-700">Status Bot saat ini:</p>
                  <p className="text-amber-700">
                    {workerInfo?.last_log || 'Menunggu konfirmasi login pengguna...'}
                  </p>
                </div>

                <div className="flex items-center justify-end gap-2 pt-2">
                  <button
                    onClick={handleConfirmLoginStep}
                    className="py-3 px-6 bg-emerald-600 hover:bg-emerald-700 text-white font-extrabold text-xs rounded-xl shadow-lg flex items-center gap-2 transition-all active:scale-95 w-full justify-center"
                  >
                    <CheckCircle2 className="w-4 h-4 text-emerald-200" />
                    <span>Saya Sudah Login / Selesai CAPTCHA (Lanjut Scrape 1 per 1)</span>
                  </button>
                </div>
              </div>
            )}

            {/* Step 3 Content: Confirmed & Running */}
            {workflowStep === 3 && (
              <div className="space-y-4 py-2 text-center">
                <div className="w-14 h-14 bg-emerald-100 text-emerald-700 rounded-full flex items-center justify-center mx-auto text-2xl font-bold animate-bounce">
                  🎉
                </div>
                <div>
                  <h4 className="font-extrabold text-base text-gray-900">Langkah 3: Konfirmasi Diterima!</h4>
                  <p className="text-xs text-gray-600 mt-1 max-w-xs mx-auto">
                    Bot sedang membuka produk 1 per 1 untuk mengekstrak harga, berat gramasi, dan kalkulasi harga per kg secara presisi.
                  </p>
                </div>

                <button
                  onClick={() => {
                    setWorkflowStep(0)
                    fetchShopeeData()
                  }}
                  className="py-2.5 px-6 bg-brand-maroon text-white font-bold text-xs rounded-xl hover:bg-brand-maroon-dark"
                >
                  Tutup & Lihat Data Laporan
                </button>
              </div>
            )}

          </div>
        </div>
      )}

      {/* Target Shops Card */}
      <div className="bg-gradient-to-r from-brand-maroon-dark to-brand-maroon text-white p-6 sm:p-8 rounded-3xl shadow-xl border border-brand-gold/30 space-y-4">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <span className="text-xs font-bold text-brand-gold uppercase tracking-wider block">
              Direct Target Monitoring
            </span>
            <h2 className="text-xl font-bold text-white mt-0.5">4 Toko Pesaing Utama (Bawang Goreng)</h2>
            <p className="text-xs text-white/80 mt-1">
              Sistem memantau secara berkala harga & gramasi produk dari 4 toko kompetitor pilihan Anda.
            </p>
          </div>
          <button
            onClick={() => openScrapeWizard('target_shops')}
            disabled={loading || workerInfo?.is_running}
            className="py-3 px-6 bg-brand-gold hover:bg-brand-gold-dark text-brand-maroon-dark font-extrabold text-xs rounded-xl shadow-lg flex items-center gap-2 transition-all active:scale-95 flex-shrink-0"
          >
            <Store className="w-4 h-4 text-brand-maroon-dark" />
            <span>Mulai Scrape 4 Toko Target</span>
          </button>
        </div>

        <div className="grid grid-cols-2 md:grid-cols-4 gap-3 pt-2">
          {TARGET_SHOPS.map((shop) => (
            <a
              key={shop.name}
              href={shop.url}
              target="_blank"
              rel="noopener noreferrer"
              className="bg-white/10 hover:bg-white/20 p-3 rounded-2xl border border-white/15 transition-all text-xs space-y-1 block"
            >
              <span className="font-bold text-brand-gold block truncate">🏪 {shop.name}</span>
              <span className="text-[10px] text-white/70 flex items-center gap-1">
                <ExternalLink className="w-3 h-3" /> Cari Bawang Goreng
              </span>
            </a>
          ))}
        </div>
      </div>

      {/* Trigger & Search Card */}
      <div className="bg-white p-6 sm:p-8 rounded-3xl shadow-sm border border-brand-gold/20 space-y-6">
        
        {/* Header & Mode Switcher Tabs */}
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 border-b border-gray-100 pb-5">
          <div>
            <span className="text-xs font-bold text-brand-maroon uppercase tracking-wider block">
              Market Intelligence Scraper Engine
            </span>
            <h2 className="text-2xl font-black text-gray-900 mt-1">Riset & Ekstraksi Data Shopee</h2>
            <p className="text-sm text-gray-600 mt-1">
              Pilih mode riset berdasarkan <strong>Kata Kunci</strong> atau <strong>Target URL / ID Shopee Spesifik</strong>.
            </p>
          </div>

          <div className="flex items-center bg-gray-100 p-1.5 rounded-2xl gap-1 border border-gray-200">
            <button
              onClick={() => setScrapeMode('keyword')}
              className={`py-2 px-4 rounded-xl text-xs font-bold transition-all ${
                scrapeMode === 'keyword'
                  ? 'bg-brand-maroon text-white shadow-md'
                  : 'text-gray-600 hover:text-gray-900'
              }`}
            >
              🔍 Mode 1: Kata Kunci
            </button>
            <button
              onClick={() => setScrapeMode('direct')}
              className={`py-2 px-4 rounded-xl text-xs font-bold transition-all ${
                scrapeMode === 'direct'
                  ? 'bg-brand-maroon text-white shadow-md'
                  : 'text-gray-600 hover:text-gray-900'
              }`}
            >
              ⚡ Mode 2: Specific URL / IDs (Apify)
            </button>
          </div>
        </div>

        {/* 🔍 MODE 1: KEYWORD SEARCH */}
        {scrapeMode === 'keyword' && (
          <div className="space-y-4">
            <div className="flex items-center gap-2 overflow-x-auto pb-1">
              <span className="text-xs font-bold text-gray-400 uppercase tracking-wider flex-shrink-0 mr-1">
                Kata Kunci Populer:
              </span>
              {KEYWORD_PRESETS.map((kw) => (
                <button
                  key={kw}
                  onClick={() => {
                    setKeyword(kw)
                    openScrapeWizard(kw, 'keyword')
                  }}
                  className={`py-1.5 px-3.5 rounded-full text-xs font-bold transition-all whitespace-nowrap ${
                    keyword === kw
                      ? 'bg-brand-gold text-brand-maroon-dark shadow-sm'
                      : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
                  }`}
                >
                  🔍 {kw}
                </button>
              ))}
            </div>

            <div className="flex items-center gap-3">
              <div className="relative flex-1">
                <Search className="w-4 h-4 text-gray-400 absolute left-4 top-1/2 -translate-y-1/2" />
                <input
                  type="text"
                  value={keyword}
                  onChange={(e) => setKeyword(e.target.value)}
                  placeholder="Masukkan kata kunci produk (contoh: bawang goreng murni)..."
                  className="w-full pl-11 pr-4 py-3 rounded-xl border border-gray-300 text-sm font-semibold focus:border-brand-maroon outline-none"
                />
              </div>
              <button
                onClick={() => openScrapeWizard(keyword, 'keyword')}
                disabled={loading || workerInfo?.is_running}
                className="py-3 px-6 bg-brand-maroon hover:bg-brand-maroon-dark text-white rounded-xl text-xs font-bold shadow-md flex items-center gap-2"
              >
                <ShoppingCart className="w-4 h-4 fill-brand-gold text-brand-maroon" />
                <span>Mulai Riset Kata Kunci</span>
              </button>
            </div>
          </div>
        )}

        {/* ⚡ MODE 2: SPECIFIC SHOPEE URL OR IDs (APIFY & DIRECT SCRAPE) */}
        {scrapeMode === 'direct' && (
          <div className="space-y-4 bg-brand-cream/30 p-5 rounded-2xl border border-brand-gold/30">
            <div className="flex items-center justify-between">
              <div>
                <h4 className="font-bold text-sm text-brand-maroon flex items-center gap-2">
                  <span>Target Parameter Spesifik (Active Mode ≠ Keyword Search)</span>
                </h4>
                <p className="text-xs text-gray-500 mt-0.5">
                  Isi salah satu atau beberapa bidang target di bawah untuk ekstraksi langsung dari Shopee atau via Apify Cloud.
                </p>
              </div>

              <label className="flex items-center gap-2 bg-white px-3.5 py-2 rounded-xl border border-brand-gold/40 cursor-pointer shadow-sm">
                <input
                  type="checkbox"
                  checked={useApify}
                  onChange={(e) => setUseApify(e.target.checked)}
                  className="w-4 h-4 text-brand-maroon rounded border-gray-300 focus:ring-brand-maroon"
                />
                <span className="text-xs font-extrabold text-brand-maroon">Gunakan Apify Cloud Scraper</span>
                <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" title="Apify API Token Configured" />
              </label>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 pt-2">
              <div className="space-y-1">
                <label className="text-xs font-bold text-gray-700 block">1. Shopee URL (Link Produk / Toko)</label>
                <input
                  type="text"
                  value={shopeeUrl}
                  onChange={(e) => setShopeeUrl(e.target.value)}
                  placeholder="https://shopee.co.id/product-name-i.12345.67890"
                  className="w-full px-3.5 py-2.5 rounded-xl border border-gray-300 text-xs font-mono focus:border-brand-maroon outline-none bg-white"
                />
              </div>

              <div className="space-y-1">
                <label className="text-xs font-bold text-gray-700 block">2. Shop Username or ID</label>
                <input
                  type="text"
                  value={shopUsername}
                  onChange={(e) => setShopUsername(e.target.value)}
                  placeholder="bandung.restokoe atau 1234567"
                  className="w-full px-3.5 py-2.5 rounded-xl border border-gray-300 text-xs font-mono focus:border-brand-maroon outline-none bg-white"
                />
              </div>

              <div className="grid grid-cols-2 gap-2">
                <div className="space-y-1">
                  <label className="text-xs font-bold text-gray-700 block">3. Shop ID</label>
                  <input
                    type="text"
                    value={shopId}
                    onChange={(e) => setShopId(e.target.value)}
                    placeholder="Contoh: 1234567"
                    className="w-full px-3.5 py-2.5 rounded-xl border border-gray-300 text-xs font-mono focus:border-brand-maroon outline-none bg-white"
                  />
                </div>
                <div className="space-y-1">
                  <label className="text-xs font-bold text-gray-700 block">4. Item ID</label>
                  <input
                    type="text"
                    value={itemId}
                    onChange={(e) => setItemId(e.target.value)}
                    placeholder="Contoh: 8901234"
                    className="w-full px-3.5 py-2.5 rounded-xl border border-gray-300 text-xs font-mono focus:border-brand-maroon outline-none bg-white"
                  />
                </div>
              </div>

              <div className="space-y-1">
                <label className="text-xs font-bold text-gray-700 block">5. Category / Sektor Produk</label>
                <input
                  type="text"
                  value={category}
                  onChange={(e) => setCategory(e.target.value)}
                  placeholder="Contoh: Bawang Goreng / Makanan Ringan"
                  className="w-full px-3.5 py-2.5 rounded-xl border border-gray-300 text-xs font-semibold focus:border-brand-maroon outline-none bg-white"
                />
              </div>
            </div>

            <div className="flex items-center justify-end pt-2">
              <button
                onClick={() => openScrapeWizard(shopeeUrl || shopUsername || 'Specific Target', 'direct')}
                disabled={loading || workerInfo?.is_running}
                className="py-3 px-7 bg-brand-maroon hover:bg-brand-maroon-dark text-white rounded-xl text-xs font-extrabold shadow-lg flex items-center gap-2 transition-all active:scale-95"
              >
                <Play className="w-4 h-4 fill-brand-gold text-brand-maroon" />
                <span>Mulai Riset Target Spesifik (Apify / Direct)</span>
              </button>
            </div>
          </div>
        )}

      </div>

      {/* Market Unit Price Analysis Cards */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        {[
          {
            label: 'Rata-rata Harga Pasar / Kg',
            value: `${formatRp(stats.avg_price_per_kg || 155000)} / kg`,
            sub: 'Standar patokan 1,000 gram',
            icon: Scale,
            color: 'text-brand-maroon',
            bg: 'bg-brand-cream'
          },
          {
            label: 'Rata-rata Harga Pasar / Gram',
            value: `Rp ${(stats.avg_price_per_g || 155).toLocaleString('id-ID')} / g`,
            sub: 'Kalkulasi presisi per gram',
            icon: DollarSign,
            color: 'text-emerald-700',
            bg: 'bg-emerald-50'
          },
          {
            label: 'Rentang Harga per Kg',
            value: `${formatRp(stats.min_price_per_kg || 144000)} - ${formatRp(stats.max_price_per_kg || 196000)}`,
            sub: 'Harga per kg terendah s.d. tertinggi',
            icon: TrendingUp,
            color: 'text-purple-700',
            bg: 'bg-purple-50'
          },
          {
            label: 'Total Produk Tracked',
            value: `${stats.total_items || 0} Produk`,
            sub: 'Membuka produk 1 per 1',
            icon: ShoppingCart,
            color: 'text-blue-700',
            bg: 'bg-blue-50'
          },
        ].map(({ label, value, sub, icon: Icon, color, bg }) => (
          <div key={label} className="bg-white p-5 rounded-2xl border border-brand-gold/20 shadow-sm flex items-start space-x-3.5">
            <div className={`w-11 h-11 ${bg} ${color} rounded-xl flex items-center justify-center flex-shrink-0 mt-0.5`}>
              <Icon className="w-5 h-5" />
            </div>
            <div>
              <span className="text-[11px] font-semibold text-gray-400 block">{label}</span>
              <span className={`text-base sm:text-lg font-black ${color} leading-tight block mt-0.5`}>{value}</span>
              <span className="text-[10px] text-gray-400 block mt-1">{sub}</span>
            </div>
          </div>
        ))}
      </div>

      {/* Competitors Daily Report Table */}
      <div className="bg-white rounded-3xl shadow-sm border border-brand-gold/20 overflow-hidden">
        <div className="p-6 border-b border-gray-100 flex items-center justify-between">
          <div>
            <div className="flex items-center gap-2">
              <span className="text-xs font-bold text-brand-maroon uppercase tracking-wider block">Live Scraped Data</span>
              <span className="text-[10px] bg-brand-gold/20 text-brand-maroon-dark font-extrabold px-2 py-0.5 rounded-full">
                Gram & Kg Calculated
              </span>
            </div>
            <h3 className="font-bold text-lg text-gray-900 mt-0.5">Laporan Harga Pasar & Gramasi Kompetitor</h3>
          </div>
          <button
            onClick={fetchShopeeData}
            className="p-2 bg-gray-100 hover:bg-gray-200 text-gray-600 rounded-xl transition-colors text-xs font-bold flex items-center gap-1.5"
          >
            <RefreshCw className="w-4 h-4" />
            <span>Refresh Data</span>
          </button>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left text-sm text-gray-600">
            <thead className="bg-gray-50 text-xs font-bold uppercase text-gray-500 border-b border-gray-200">
              <tr>
                <th className="px-5 py-4">#</th>
                <th className="px-5 py-4">Toko / Keyword</th>
                <th className="px-5 py-4">Nama Produk Kompetitor</th>
                <th className="px-5 py-4 text-center">Ukuran Berat</th>
                <th className="px-5 py-4 text-right">Harga Produk</th>
                <th className="px-5 py-4 text-right">Harga / Gram</th>
                <th className="px-5 py-4 text-right bg-brand-cream/40 text-brand-maroon">Harga / Kg</th>
                <th className="px-5 py-4">Terjual</th>
                <th className="px-5 py-4 text-center">Shopee</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100 text-xs">
              {products.length === 0 && (
                <tr>
                  <td colSpan={9} className="px-6 py-10 text-center text-gray-400 text-sm">
                    Belum ada data kompetitor Shopee. Klik <strong>Mulai Flow Riset Shopee Baru</strong> untuk memunculkan laporan per gram & per kg.
                  </td>
                </tr>
              )}
              {products.map((item, i) => (
                <tr key={i} className="hover:bg-gray-50/80 transition-colors">
                  <td className="px-5 py-4 font-bold text-gray-900 font-mono">#{item.rank || i + 1}</td>
                  <td className="px-5 py-4">
                    <span className="bg-brand-cream text-brand-maroon font-bold text-xs px-2.5 py-1 rounded-full whitespace-nowrap">
                      {item.keyword || 'Target Toko'}
                    </span>
                  </td>
                  <td className="px-5 py-4 font-bold text-gray-900 max-w-[240px]">
                    <span className="line-clamp-2 leading-snug">{item.nama_produk}</span>
                    <span className="text-[10px] text-gray-400 flex items-center gap-1 mt-0.5 font-normal">
                      <MapPin className="w-3 h-3 text-red-500" />
                      {item.lokasi_toko || 'Indonesia'} • ⭐ {item.rating || '4.8'}
                    </span>
                  </td>
                  <td className="px-5 py-4 text-center">
                    <span className="font-extrabold bg-blue-50 text-blue-800 border border-blue-200 px-2.5 py-1 rounded-xl text-xs whitespace-nowrap">
                      📦 {item.berat_gram || 250}g
                    </span>
                  </td>
                  <td className="px-5 py-4 text-right font-mono font-bold text-gray-900 text-sm whitespace-nowrap">
                    {formatRp(item.harga_rp)}
                  </td>
                  <td className="px-5 py-4 text-right font-mono font-semibold text-emerald-700 whitespace-nowrap">
                    Rp {Number(item.harga_per_gram || 0).toLocaleString('id-ID')}/g
                  </td>
                  <td className="px-5 py-4 text-right font-mono font-black text-brand-maroon bg-brand-cream/20 text-sm whitespace-nowrap">
                    {formatRp(item.harga_per_kg || 0)}/kg
                  </td>
                  <td className="px-5 py-4 font-bold text-emerald-700 whitespace-nowrap">
                    {item.terjual || '0 Terjual'}
                  </td>
                  <td className="px-5 py-4 text-center">
                    <a
                      href={item.link_shopee || '#'}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="p-2 bg-brand-cream hover:bg-brand-gold/30 text-brand-maroon rounded-xl inline-flex items-center justify-center transition-colors"
                      title="Buka Produk di Shopee"
                    >
                      <ExternalLink className="w-4 h-4" />
                    </a>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* ── DEDICATED TERMINAL & ERROR LOG CONSOLE (WITH COPY BUTTON) ── */}
      <div className="bg-slate-900 text-slate-100 rounded-3xl p-6 shadow-2xl border border-slate-800 space-y-4 font-mono">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-slate-800 pb-4">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 bg-slate-800 text-brand-gold rounded-xl flex items-center justify-center">
              <Terminal className="w-5 h-5" />
            </div>
            <div>
              <h4 className="font-bold text-sm text-white flex items-center gap-2 font-sans">
                <span>Console & Error Log Viewer</span>
                {workerInfo?.is_running && (
                  <span className="w-2 h-2 rounded-full bg-emerald-400 animate-ping" />
                )}
              </h4>
              <p className="text-[11px] text-slate-400 font-sans">
                Riwayat log sistem real-time dari Server Bridge & Shopee Scraper.
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={copyLogsToClipboard}
              className={`py-2 px-4 rounded-xl text-xs font-bold flex items-center gap-2 transition-all font-sans ${
                copySuccess
                  ? 'bg-emerald-500 text-white'
                  : 'bg-brand-maroon hover:bg-brand-maroon-dark text-white shadow-md active:scale-95'
              }`}
            >
              {copySuccess ? <CheckCircle className="w-4 h-4 text-white" /> : <Copy className="w-4 h-4 text-brand-gold" />}
              <span>{copySuccess ? 'Log Berhasil Disalin! 🎉' : 'Salin Semua Log ke Clipboard'}</span>
            </button>
          </div>
        </div>

        {/* Log Viewer Scroll Window */}
        <div className="bg-slate-950/80 rounded-2xl p-4 border border-slate-800 max-h-64 overflow-y-auto space-y-1.5 text-xs">
          {logsList.map((logLine, index) => {
            const isError = logLine.includes('Error') || logLine.includes('charmap') || logLine.includes('Exception') || logLine.includes('❌') || logLine.includes('⚠️')
            return (
              <div
                key={index}
                className={`flex items-start gap-2 leading-relaxed ${
                  isError ? 'text-red-400 bg-red-950/30 p-1.5 rounded-lg border border-red-900/50 font-bold' : 'text-slate-300'
                }`}
              >
                <span className="text-slate-600 select-none flex-shrink-0 text-[10px]">
                  [{String(index + 1).padStart(2, '0')}]
                </span>
                <span className="break-all whitespace-pre-wrap">{logLine}</span>
              </div>
            )
          })}
        </div>
      </div>

    </div>
  )
}
