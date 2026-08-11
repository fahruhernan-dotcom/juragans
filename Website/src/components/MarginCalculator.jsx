import { useState } from 'react';
import { Calculator, MessageCircle } from 'lucide-react';

export default function MarginCalculator({ lang, getWaLink }) {
  const isEn = lang === 'en';

  const [qty, setQty] = useState(10); // in kg
  const buyPricePerKg = 60000; // Harga Grosir Juragans
  const sellPricePerKg = 75000; // Harga Jual Pasar Ecer

  const totalCost = qty * buyPricePerKg;
  const totalRevenue = qty * sellPricePerKg;
  const netProfit = totalRevenue - totalCost;
  const marginPercent = ((netProfit / totalRevenue) * 100).toFixed(1);

  return (
    <section className="py-20 bg-brand-cream border-b border-brand-maroon/10 px-4 sm:px-6 lg:px-8 reveal font-sans">
      <div className="max-w-5xl mx-auto bg-white rounded-3xl p-8 md:p-12 border-2 border-brand-gold/40 shadow-xl">
        <div className="grid md:grid-cols-12 gap-8 items-center">
          <div className="md:col-span-6 space-y-4">
            <div className="inline-flex items-center space-x-2 px-3.5 py-1 bg-brand-gold/20 text-brand-maroon-dark text-xs font-semibold rounded-full">
              <Calculator className="w-3.5 h-3.5" />
              <span>{isEn ? 'B2B & Reseller Profit Calculator' : 'Kalkulator Potensi Profit Reseller & Mitra'}</span>
            </div>
            <h3 className="font-serif font-bold text-2xl md:text-3xl text-brand-maroon">
              {isEn ? 'Estimate Your Profit Margin' : 'Hitung Estimasi Keuntungan Anda'}
            </h3>
            <p className="text-sm text-brand-charcoal/80 leading-relaxed">
              {isEn
                ? 'Juragans by Anak Bawang provides competitive wholesale rates for restaurants, caterers, and resellers.'
                : 'Juragans by Anak Bawang memberikan penawaran harga grosir khusus yang sangat menguntungkan untuk stok warung, rumah makan, maupun re-seller.'}
            </p>

            <div className="space-y-3 pt-2">
              <label className="block text-xs font-bold text-brand-charcoal/80 uppercase">
                {isEn ? 'Order Quantity (Kg)' : 'Jumlah Pesanan (Kg)'}: <span className="text-brand-maroon font-bold text-sm">{qty} Kg</span>
              </label>
              <input
                type="range"
                min="5"
                max="100"
                step="5"
                value={qty}
                onChange={(e) => setQty(Number(e.target.value))}
                className="w-full accent-brand-maroon cursor-pointer h-2 bg-brand-cream-dark rounded-lg"
              />
              <div className="flex justify-between text-[11px] text-brand-charcoal/60 font-semibold">
                <span>5 Kg (Min Grosir)</span>
                <span>50 Kg</span>
                <span>100 Kg (Partai Besar)</span>
              </div>
            </div>
          </div>

          <div className="md:col-span-6 bg-brand-cream/50 rounded-2xl p-6 border border-brand-maroon/10 space-y-4">
            <div className="grid grid-cols-2 gap-4 text-center">
              <div className="bg-white p-4 rounded-xl border border-brand-gold/30">
                <span className="text-[11px] font-bold text-brand-charcoal/60 uppercase block">{isEn ? 'Est. Total Revenue' : 'Est. Penjualan'}</span>
                <span className="font-bold text-lg text-brand-charcoal">Rp {totalRevenue.toLocaleString('id-ID')}</span>
              </div>
              <div className="bg-white p-4 rounded-xl border border-brand-gold/30">
                <span className="text-[11px] font-bold text-brand-charcoal/60 uppercase block">{isEn ? 'Est. Net Profit' : 'Est. Keuntungan'}</span>
                <span className="font-bold text-lg text-emerald-600">Rp {netProfit.toLocaleString('id-ID')}</span>
              </div>
            </div>

            <div className="bg-brand-maroon text-white p-4 rounded-xl flex items-center justify-between">
              <div>
                <span className="text-xs opacity-80 block">{isEn ? 'Profit Margin Percentage' : 'Persentase Margin Keuntungan'}</span>
                <span className="font-bold text-2xl">{marginPercent}%</span>
              </div>
              <a
                href={getWaLink('resellerCard', `Halo Juragans by Anak Bawang, saya ingin menanyakan syarat reseller grosir untuk pesanan ${qty} kg.`)}
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center space-x-2 px-4 py-2 bg-brand-gold hover:bg-brand-gold-dark text-brand-maroon-dark rounded-lg font-bold text-xs transition-colors"
              >
                <MessageCircle className="w-4 h-4" />
                <span>{isEn ? 'Claim Wholesale Price' : 'Klaim Harga Grosir'}</span>
              </a>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
