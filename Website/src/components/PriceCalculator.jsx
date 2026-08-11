import { useState } from 'react'
import { ArrowRight, ShieldCheck, Sparkles, PhoneCall } from 'lucide-react'

const skuData = {
  murni: {
    name: "Grade S Murni (100% Bawang Merah Boyolali)",
    tag: "Tanpa Tepung • 100% Asli Boyolali",
    badge: "PREMIUM MURNI",
    items: [
      { sku: "JBM-100-TRIAL", weight: "100g (Trial Pack)", tiktok: 29900, priceSolo: 21600, priceLuar: 23500, grosir: 18000, cogs: 15400 },
      { sku: "JBM-150", weight: "150g (Pouch Frosted)", tiktok: 42900, priceSolo: 26000, priceLuar: 26500, grosir: 25000, cogs: 21700 },
      { sku: "JBM-200", weight: "200g (Pouch Standar)", tiktok: 52900, priceSolo: 34500, priceLuar: 37500, grosir: 32000, cogs: 28200 },
      { sku: "JBM-250", weight: "250g (Hero Best Seller)", tiktok: 64900, priceSolo: 40000, priceLuar: 43500, grosir: 39500, cogs: 34700, isHero: true },
      { sku: "JBM-1K", weight: "1 Kg (Bal Bulk PE)", tiktok: 179000, priceSolo: 152000, priceLuar: 165500, grosir: 135000, cogs: 127200 }
    ]
  },
  crispy: {
    name: "Grade A Premium Crispy (Renyah Gurih)",
    tag: "Tepung Tipis Krispi Tahan Lama",
    badge: "FAVORIT RESTORAN",
    items: [
      { sku: "JBA-100-TRIAL", weight: "100g (Trial Pack)", tiktok: 24900, priceSolo: 18900, priceLuar: 20500, grosir: 15000, cogs: 13900 },
      { sku: "JBA-150", weight: "150g (Pouch Frosted)", tiktok: 34900, priceSolo: 25000, priceLuar: 26500, grosir: 21000, cogs: 19450 },
      { sku: "JBA-200", weight: "200g (Pouch Standar)", tiktok: 42000, priceSolo: 31000, priceLuar: 31500, grosir: 26000, cogs: 25100 },
      { sku: "JBA-250", weight: "250g (Hero Best Seller)", tiktok: 49900, priceSolo: 35000, priceLuar: 37500, grosir: 32500, cogs: 30950, isHero: true },
      { sku: "JBA-1K", weight: "1 Kg (Bal Bulk PE)", tiktok: 149000, priceSolo: 125000, priceLuar: 135500, grosir: 116000, cogs: 112200 }
    ]
  }
}

export default function PriceCalculator({ getWaLink }) {
  const [activeCategory, setActiveCategory] = useState('murni')
  const [region, setRegion] = useState('solo')
  const [selectedSkuIndex, setSelectedSkuIndex] = useState(3) // Default JBM-250 (Hero)
  const [qty, setQty] = useState(1)

  const currentCategory = skuData[activeCategory]
  const currentItem = currentCategory.items[selectedSkuIndex] || currentCategory.items[0]

  const formatRp = (num) => new Intl.NumberFormat('id-ID', { style: 'currency', currency: 'IDR', maximumFractionDigits: 0 }).format(num)

  const offlinePrice = region === 'solo' ? currentItem.priceSolo : currentItem.priceLuar
  const totalOffline = offlinePrice * qty
  const totalTiktok = currentItem.tiktok * qty
  const totalSavings = totalTiktok - totalOffline

  const waText = `Halo Admin Juragan, saya mau order via Offline Direct (${currentItem.weight} - Wilayah: ${region === 'solo' ? 'Solo Raya' : 'Luar Kota'}) sebanyak ${qty} pcs.`
  const waUrl = getWaLink ? getWaLink('general', waText) : `https://wa.me/6282133731213?text=${encodeURIComponent(waText)}`

  return (
    <section id="katalog-harga" className="py-24 bg-white px-4 sm:px-6 lg:px-8 border-b border-brand-maroon/5 font-sans reveal">
      <div className="max-w-7xl mx-auto">
        <div className="text-center max-w-3xl mx-auto mb-16 space-y-4">
          <span className="text-xs font-semibold uppercase tracking-[0.2em] text-brand-gold-dark block">
            Pilihan Spesial Konsumen Direct
          </span>
          <h2 className="font-sans font-semibold tracking-tight text-3xl sm:text-4xl lg:text-5xl text-brand-maroon">
            Katalog & Kalkulator Hemat Harga Offline
          </h2>
          <div className="w-20 h-1 bg-brand-gold mx-auto rounded-full"></div>
          <p className="text-brand-charcoal/80 text-sm sm:text-base font-normal leading-relaxed">
            Tanpa potongan biaya admin platform online! Dapatkan harga eceran & grosir **jauh lebih murah** langsung dari rumah produksi Juragan by Anak Bawang.
          </p>
        </div>

        {/* Toggles: Category & Region */}
        <div className="flex flex-col sm:flex-row justify-center items-center gap-4 mb-10">
          {/* Category Tabs */}
          <div className="bg-brand-cream border-2 border-brand-gold/30 p-1.5 rounded-full inline-flex max-w-xs w-full">
            <button
              onClick={() => { setActiveCategory('murni'); setSelectedSkuIndex(3); }}
              className={`flex-1 py-3 px-4 rounded-full text-xs font-semibold transition-all duration-300 ${
                activeCategory === 'murni'
                  ? 'bg-brand-maroon text-white shadow-md'
                  : 'text-brand-charcoal hover:text-brand-maroon'
              }`}
            >
              🧅 Grade S Murni
            </button>
            <button
              onClick={() => { setActiveCategory('crispy'); setSelectedSkuIndex(3); }}
              className={`flex-1 py-3 px-4 rounded-full text-xs font-semibold transition-all duration-300 ${
                activeCategory === 'crispy'
                  ? 'bg-brand-maroon text-white shadow-md'
                  : 'text-brand-charcoal hover:text-brand-maroon'
              }`}
            >
              🧄 Grade A Crispy
            </button>
          </div>

          {/* Region Tabs */}
          <div className="bg-brand-cream border-2 border-brand-gold/30 p-1.5 rounded-full inline-flex max-w-xs w-full">
            <button
              onClick={() => setRegion('solo')}
              className={`flex-1 py-3 px-4 rounded-full text-xs font-semibold transition-all duration-300 ${
                region === 'solo'
                  ? 'bg-brand-maroon text-white shadow-md'
                  : 'text-brand-charcoal hover:text-brand-maroon'
              }`}
            >
              📍 Solo Raya (Lokal)
            </button>
            <button
              onClick={() => setRegion('luar_kota')}
              className={`flex-1 py-3 px-4 rounded-full text-xs font-semibold transition-all duration-300 ${
                region === 'luar_kota'
                  ? 'bg-brand-maroon text-white shadow-md'
                  : 'text-brand-charcoal hover:text-brand-maroon'
              }`}
            >
              🏙️ Luar Kota
            </button>
          </div>
        </div>

        {/* Interactive Pricing Card Grid */}
        <div className="grid lg:grid-cols-12 gap-8 items-start">
          {/* SKU List */}
          <div className="lg:col-span-7 space-y-3">
            <div className="flex items-center justify-between px-2 mb-2">
              <span className="text-xs font-bold text-brand-gold-dark uppercase tracking-wider">Pilih Kemasan Produk:</span>
              <span className="text-xs text-brand-maroon font-semibold">{currentCategory.tag}</span>
            </div>

            {currentCategory.items.map((item, idx) => {
              const itemOfflinePrice = region === 'solo' ? item.priceSolo : item.priceLuar
              return (
                <div
                  key={item.sku}
                  onClick={() => setSelectedSkuIndex(idx)}
                  className={`p-4 sm:p-5 rounded-2xl border-2 transition-all duration-300 cursor-pointer flex items-center justify-between ${
                    selectedSkuIndex === idx
                      ? 'border-brand-maroon bg-brand-cream/60 shadow-lg scale-[1.01]'
                      : 'border-brand-gold/30 bg-white hover:border-brand-gold hover:bg-brand-cream/20'
                  }`}
                >
                  <div className="space-y-1">
                    <div className="flex items-center space-x-2">
                      <span className="font-bold text-brand-maroon text-sm sm:text-base">{item.weight}</span>
                      {item.isHero && (
                        <span className="bg-brand-gold text-brand-maroon-dark text-[10px] font-bold px-2 py-0.5 rounded-full flex items-center space-x-1">
                          <Sparkles className="w-3 h-3" />
                          <span>HERO SKU</span>
                        </span>
                      )}
                    </div>
                    <p className="text-xs text-brand-charcoal/70">
                      Harga TikTok Shop: <span className="line-through text-red-500">{formatRp(item.tiktok)}</span>
                    </p>
                  </div>

                  <div className="text-right">
                    <span className="text-base sm:text-lg font-extrabold text-brand-maroon block">
                      {formatRp(itemOfflinePrice)}
                    </span>
                    <span className="text-[11px] font-semibold text-emerald-700 bg-emerald-100 px-2 py-0.5 rounded-full inline-block mt-0.5">
                      Grosir: {formatRp(item.grosir)}
                    </span>
                  </div>
                </div>
              )
            })}
          </div>

          {/* Savings Calculator Summary Box */}
          <div className="lg:col-span-5 bg-gradient-to-br from-brand-maroon to-brand-maroon-dark text-white rounded-3xl p-6 sm:p-8 shadow-2xl space-y-6 relative overflow-hidden">
            <div className="absolute top-0 right-0 -mr-8 -mt-8 w-32 h-32 bg-brand-gold/20 rounded-full blur-2xl pointer-events-none"></div>

            <div className="flex items-center justify-between border-b border-white/20 pb-4">
              <div>
                <span className="text-[11px] font-semibold tracking-widest text-brand-gold uppercase block">Detail Pilihan Anda</span>
                <h3 className="font-bold text-xl text-white mt-0.5">{currentItem.weight}</h3>
              </div>
              <span className="bg-brand-gold/20 text-brand-gold border border-brand-gold/40 text-[10px] font-bold px-3 py-1 rounded-full uppercase">
                {currentCategory.badge}
              </span>
            </div>

            {/* Qty Selector */}
            <div className="space-y-2">
              <label className="text-xs font-semibold text-white/80 block">Jumlah Pembelian (Pcs):</label>
              <div className="flex items-center space-x-3 bg-white/10 p-1.5 rounded-xl border border-white/20">
                <button
                  onClick={() => setQty(Math.max(1, qty - 1))}
                  className="w-10 h-10 bg-white/20 hover:bg-white/30 rounded-lg text-white font-bold text-lg flex items-center justify-center transition-colors"
                >
                  -
                </button>
                <input
                  type="number"
                  min="1"
                  value={qty}
                  onChange={(e) => setQty(Math.max(1, parseInt(e.target.value) || 1))}
                  className="w-full text-center bg-transparent font-bold text-xl text-white outline-none"
                />
                <button
                  onClick={() => setQty(qty + 1)}
                  className="w-10 h-10 bg-white/20 hover:bg-white/30 rounded-lg text-white font-bold text-lg flex items-center justify-center transition-colors"
                >
                  +
                </button>
              </div>
            </div>

            {/* Price Comparison Box */}
            <div className="bg-white/10 backdrop-blur-md rounded-2xl p-5 border border-white/15 space-y-3">
              <div className="flex justify-between items-center text-sm">
                <span className="text-white/80">Harga TikTok Shop ({qty}x):</span>
                <span className="line-through text-red-300 font-semibold">{formatRp(totalTiktok)}</span>
              </div>
              <div className="flex justify-between items-center text-sm">
                <span className="text-white/80">Harga Direct Offline ({qty}x):</span>
                <span className="text-white font-bold text-base">{formatRp(totalOffline)}</span>
              </div>
              <div className="border-t border-white/20 pt-3 flex justify-between items-center text-base font-extrabold text-brand-gold">
                <span>Anda Hemat Langsung:</span>
                <span className="bg-brand-gold text-brand-maroon-dark px-3 py-1 rounded-full text-sm font-extrabold shadow-sm">
                  {formatRp(totalSavings)}
                </span>
              </div>
            </div>

            {/* CTA Order Button */}
            <a
              href={waUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="w-full py-4 bg-brand-gold hover:bg-brand-gold-dark text-brand-maroon-dark rounded-2xl font-bold text-base shadow-xl flex items-center justify-center space-x-3 transition-all duration-300 hover:scale-[1.02] active:scale-[0.98]"
            >
              <PhoneCall className="w-5 h-5 text-brand-maroon-dark" />
              <span>Pesan via WhatsApp Langsung</span>
              <ArrowRight className="w-5 h-5" />
            </a>

            <p className="text-[11px] text-white/70 text-center flex items-center justify-center space-x-1">
              <ShieldCheck className="w-4 h-4 text-emerald-400" />
              <span>Bebas Biaya Admin • Sertifikat Halal ID33110018517710724</span>
            </p>
          </div>
        </div>
      </div>
    </section>
  )
}
