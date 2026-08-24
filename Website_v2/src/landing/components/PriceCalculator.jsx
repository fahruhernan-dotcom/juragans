import React, { useState } from 'react';
import { ArrowRight, ShieldCheck, Sparkles, PhoneCall } from 'lucide-react';

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
};

export default function PriceCalculator({ getWaLink }) {
  const [activeCategory, setActiveCategory] = useState('murni');
  const [region, setRegion] = useState('solo');
  const [selectedSkuIndex, setSelectedSkuIndex] = useState(3); // Default JBM-250 (Hero)
  const [qty, setQty] = useState(1);

  const currentCategory = skuData[activeCategory];
  const currentItem = currentCategory.items[selectedSkuIndex] || currentCategory.items[0];

  const formatRp = (num) => new Intl.NumberFormat('id-ID', { style: 'currency', currency: 'IDR', maximumFractionDigits: 0 }).format(num);

  const offlinePrice = region === 'solo' ? currentItem.priceSolo : currentItem.priceLuar;
  const totalOffline = offlinePrice * qty;
  const totalTiktok = currentItem.tiktok * qty;
  const totalSavings = totalTiktok - totalOffline;

  const waText = `Halo Admin Juragan, saya mau order via Offline Direct (${currentItem.weight} - Wilayah: ${region === 'solo' ? 'Solo Raya' : 'Luar Kota'}) sebanyak ${qty} pcs.`;
  const waUrl = getWaLink ? getWaLink('general', waText) : `https://wa.me/6282133731213?text=${encodeURIComponent(waText)}`;

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
            Dapatkan harga jauh lebih hemat dengan order langsung ke rumah produksi tanpa biaya potongan marketplace.
          </p>
        </div>

        <div className="grid lg:grid-cols-12 gap-8 items-start">
          {/* Controls & Selection */}
          <div className="lg:col-span-7 space-y-6 bg-brand-cream/30 p-6 sm:p-8 rounded-3xl border border-brand-gold/30">
            {/* Category Tab */}
            <div>
              <label className="block text-xs font-bold text-brand-maroon uppercase tracking-wider mb-2">
                1. Pilih Kategori Kualitas:
              </label>
              <div className="grid grid-cols-2 gap-3">
                <button
                  onClick={() => { setActiveCategory('murni'); setSelectedSkuIndex(3); }}
                  className={`p-4 rounded-2xl border text-left transition-all ${
                    activeCategory === 'murni'
                      ? 'bg-brand-maroon text-white border-brand-maroon shadow-md'
                      : 'bg-white text-brand-charcoal border-brand-gold/40 hover:border-brand-maroon/50'
                  }`}
                >
                  <span className="text-xs font-bold block opacity-80 uppercase tracking-wider">GRADE S</span>
                  <span className="font-bold text-sm sm:text-base block">100% Bawang Murni</span>
                  <span className={`text-[11px] block mt-1 ${activeCategory === 'murni' ? 'text-brand-gold-light' : 'text-brand-charcoal/60'}`}>
                    Tanpa Tepung & Tanpa MSG
                  </span>
                </button>

                <button
                  onClick={() => { setActiveCategory('crispy'); setSelectedSkuIndex(3); }}
                  className={`p-4 rounded-2xl border text-left transition-all ${
                    activeCategory === 'crispy'
                      ? 'bg-brand-maroon text-white border-brand-maroon shadow-md'
                      : 'bg-white text-brand-charcoal border-brand-gold/40 hover:border-brand-maroon/50'
                  }`}
                >
                  <span className="text-xs font-bold block opacity-80 uppercase tracking-wider">GRADE A</span>
                  <span className="font-bold text-sm sm:text-base block">Premium Crispy</span>
                  <span className={`text-[11px] block mt-1 ${activeCategory === 'crispy' ? 'text-brand-gold-light' : 'text-brand-charcoal/60'}`}>
                    Renyah Gurih Tahan Lama
                  </span>
                </button>
              </div>
            </div>

            {/* SKU Variant Selection */}
            <div>
              <label className="block text-xs font-bold text-brand-maroon uppercase tracking-wider mb-2">
                2. Pilih Ukuran Kemasan:
              </label>
              <div className="grid grid-cols-2 sm:grid-cols-3 gap-2.5">
                {currentCategory.items.map((item, idx) => (
                  <button
                    key={item.sku}
                    onClick={() => setSelectedSkuIndex(idx)}
                    className={`p-3 rounded-xl border text-left transition-all relative ${
                      selectedSkuIndex === idx
                        ? 'bg-white border-brand-maroon ring-2 ring-brand-maroon/20 shadow-sm'
                        : 'bg-white/60 border-brand-gold/30 hover:bg-white'
                    }`}
                  >
                    {item.isHero && (
                      <span className="absolute -top-2 -right-1 bg-amber-500 text-white text-[9px] font-extrabold px-1.5 py-0.5 rounded-full uppercase shadow">
                        Best Seller
                      </span>
                    )}
                    <span className="text-xs font-bold text-brand-charcoal block">{item.weight}</span>
                    <span className="text-[11px] font-semibold text-brand-maroon mt-0.5 block">
                      {formatRp(region === 'solo' ? item.priceSolo : item.priceLuar)}
                    </span>
                  </button>
                ))}
              </div>
            </div>

            {/* Region Selection */}
            <div>
              <label className="block text-xs font-bold text-brand-maroon uppercase tracking-wider mb-2">
                3. Lokasi Pengiriman:
              </label>
              <div className="grid grid-cols-2 gap-3">
                <button
                  onClick={() => setRegion('solo')}
                  className={`py-2.5 px-4 rounded-xl border text-xs font-bold transition-all ${
                    region === 'solo'
                      ? 'bg-brand-maroon text-white border-brand-maroon shadow-sm'
                      : 'bg-white text-brand-charcoal/70 border-brand-gold/40'
                  }`}
                >
                  📍 Solo Raya (Boyolali, Solo, Klaten, dll)
                </button>
                <button
                  onClick={() => setRegion('luar')}
                  className={`py-2.5 px-4 rounded-xl border text-xs font-bold transition-all ${
                    region === 'luar'
                      ? 'bg-brand-maroon text-white border-brand-maroon shadow-sm'
                      : 'bg-white text-brand-charcoal/70 border-brand-gold/40'
                  }`}
                >
                  🚚 Luar Solo Raya (Jawa & Luar Pulau)
                </button>
              </div>
            </div>

            {/* Quantity */}
            <div>
              <div className="flex justify-between items-center mb-2">
                <label className="text-xs font-bold text-brand-maroon uppercase tracking-wider">
                  4. Jumlah Pesanan:
                </label>
                <span className="text-xs font-bold text-brand-maroon">{qty} pcs</span>
              </div>
              <div className="flex items-center space-x-3">
                <button
                  onClick={() => setQty(Math.max(1, qty - 1))}
                  className="w-10 h-10 rounded-xl bg-white border border-brand-gold/40 text-brand-charcoal font-bold hover:bg-brand-cream transition-colors text-lg"
                >
                  -
                </button>
                <input
                  type="number"
                  min="1"
                  max="100"
                  value={qty}
                  onChange={(e) => setQty(Math.max(1, parseInt(e.target.value) || 1))}
                  className="w-20 text-center py-2 bg-white border border-brand-gold/40 rounded-xl font-bold text-sm text-brand-charcoal"
                />
                <button
                  onClick={() => setQty(qty + 1)}
                  className="w-10 h-10 rounded-xl bg-white border border-brand-gold/40 text-brand-charcoal font-bold hover:bg-brand-cream transition-colors text-lg"
                >
                  +
                </button>
                <span className="text-xs text-brand-charcoal/60">kemasan</span>
              </div>
            </div>
          </div>

          {/* Price Summary Card */}
          <div className="lg:col-span-5 bg-gradient-to-br from-brand-maroon via-brand-maroon-dark to-black text-white p-8 rounded-3xl shadow-2xl border-2 border-brand-gold/40 space-y-6">
            <div className="flex items-center justify-between pb-4 border-b border-white/10">
              <div>
                <span className="text-[10px] font-extrabold uppercase tracking-widest text-brand-gold">Rincian Estimasi Hemat</span>
                <h3 className="font-bold text-lg text-white mt-0.5">{currentItem.weight}</h3>
              </div>
              <span className="text-xs px-2.5 py-1 bg-brand-gold/20 text-brand-gold rounded-full font-bold">
                {currentCategory.badge}
              </span>
            </div>

            <div className="space-y-3 font-sans text-sm">
              <div className="flex justify-between text-white/70">
                <span>Harga Marketplace (Online):</span>
                <span className="line-through">{formatRp(totalTiktok)}</span>
              </div>

              <div className="flex justify-between text-white font-bold text-base">
                <span>Harga Direct Offline ({qty} pcs):</span>
                <span className="text-brand-gold text-lg">{formatRp(totalOffline)}</span>
              </div>

              <div className="p-4 bg-emerald-950/60 border border-emerald-500/40 rounded-2xl flex items-center justify-between">
                <div className="flex items-center space-x-2">
                  <Sparkles className="w-5 h-5 text-emerald-400" />
                  <span className="text-xs text-emerald-200 font-semibold">Total Penghematan:</span>
                </div>
                <span className="font-extrabold text-emerald-400 text-base">{formatRp(totalSavings)}</span>
              </div>
            </div>

            <div className="pt-2 space-y-3">
              <a
                href={waUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="w-full py-4 bg-brand-gold hover:bg-brand-gold-dark text-brand-maroon-dark rounded-2xl font-bold text-sm shadow-xl flex items-center justify-center space-x-2 transition-all duration-300 hover:scale-[1.02] active:scale-[0.98]"
              >
                <PhoneCall className="w-4 h-4" />
                <span>Pesan Direct via WhatsApp</span>
              </a>

              <p className="text-[11px] text-white/60 text-center flex items-center justify-center space-x-1">
                <ShieldCheck className="w-3.5 h-3.5 text-brand-gold" />
                <span>Bebas biaya admin marketplace • Fresh baru goreng</span>
              </p>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
