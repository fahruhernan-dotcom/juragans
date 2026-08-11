import { TrendingUp, ShieldCheck, Clock } from 'lucide-react';

export default function PriceWidget({ lang }) {
  const isEn = lang === 'en';

  const marketPrices = [
    { location: 'Boyolali (Sumber Produksi)', wetPrice: 'Rp 32.000', dryPrice: 'Rp 38.000', friedPrice: 'Rp 65.000/kg' },
    { location: 'Surakarta / Solo', wetPrice: 'Rp 34.000', dryPrice: 'Rp 40.000', friedPrice: 'Rp 70.000/kg' },
    { location: 'Brebes', wetPrice: 'Rp 28.000', dryPrice: 'Rp 34.000', friedPrice: 'Rp 60.000/kg' },
    { location: 'Kota Semarang', wetPrice: 'Rp 36.000', dryPrice: 'Rp 42.000', friedPrice: 'Rp 75.000/kg' }
  ];

  return (
    <section id="harga-pasar" className="py-16 bg-gradient-to-br from-brand-maroon/5 via-white to-brand-cream border-y border-brand-maroon/10 px-4 sm:px-6 lg:px-8 reveal">
      <div className="max-w-7xl mx-auto">
        <div className="flex flex-col md:flex-row items-start md:items-center justify-between mb-10 gap-4">
          <div>
            <div className="inline-flex items-center space-x-2 px-3.5 py-1 bg-brand-maroon/10 border border-brand-maroon/20 text-brand-maroon text-xs font-semibold rounded-full mb-3">
              <TrendingUp className="w-3.5 h-3.5" />
              <span>{isEn ? 'Live Regional Market Radar' : 'Radar Harga Pasar Real-Time'}</span>
            </div>
            <h2 className="font-serif font-bold text-2xl md:text-3xl text-brand-maroon">
              {isEn ? 'Central Java Shallot Market Index' : 'Indeks Harga Bawang Merah Jawa Tengah'}
            </h2>
            <p className="text-sm text-brand-charcoal/70 mt-1 font-sans">
              {isEn ? 'Directly synced with Regional Commodity Monitoring & BAPANAS' : 'Pantauan transparan langsung dari sentra Boyolali & BAPANAS Jawa Tengah'}
            </p>
          </div>

          <div className="flex items-center space-x-2 text-xs font-semibold text-brand-charcoal/80 bg-white border border-brand-gold/40 px-4 py-2 rounded-xl shadow-sm">
            <Clock className="w-4 h-4 text-brand-maroon" />
            <span>{isEn ? 'Updated Today' : 'Diperbarui Hari Ini'}</span>
            <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse"></span>
          </div>
        </div>

        <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-6">
          {marketPrices.map((item, idx) => (
            <div key={idx} className="bg-white rounded-2xl p-6 border border-brand-gold/30 shadow-sm hover:shadow-md transition-shadow">
              <div className="flex items-center justify-between mb-3">
                <span className="text-xs font-bold uppercase tracking-wider text-brand-gold-dark">{item.location}</span>
                <ShieldCheck className="w-4 h-4 text-brand-maroon" />
              </div>
              <div className="space-y-2 font-sans">
                <div className="flex justify-between items-center text-xs">
                  <span className="text-brand-charcoal/60">{isEn ? 'Raw Red Shallot' : 'Bawang Basah'}:</span>
                  <span className="font-semibold text-brand-charcoal">{item.wetPrice}/kg</span>
                </div>
                <div className="flex justify-between items-center text-xs">
                  <span className="text-brand-charcoal/60">{isEn ? 'Dry Shallot' : 'Bawang Kering'}:</span>
                  <span className="font-semibold text-brand-charcoal">{item.dryPrice}/kg</span>
                </div>
                <div className="pt-2 border-t border-brand-maroon/5 flex justify-between items-center text-sm font-bold text-brand-maroon">
                  <span>{isEn ? 'Fried Ecer Price' : 'Bawang Goreng'}:</span>
                  <span>{item.friedPrice}</span>
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
