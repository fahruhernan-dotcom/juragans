import { MessageCircle, MapPin } from 'lucide-react';

export default function Footer({ t, getWaLink, googleMapsUrl, onOpenAdmin }) {
  return (
    <footer className="bg-brand-charcoal text-brand-cream/80 pt-16 pb-12 px-4 sm:px-6 lg:px-8 border-t border-brand-maroon/20 font-sans">
      <div className="max-w-7xl mx-auto grid md:grid-cols-12 gap-10">
        <div className="md:col-span-5 space-y-4">
          <h4 className="font-serif text-2xl font-bold text-white tracking-tight">
            {t.brandName}
          </h4>
          <p className="text-xs uppercase tracking-widest text-brand-gold font-semibold">
            {t.brandSubtitle}
          </p>
          <p className="text-sm leading-relaxed text-brand-cream/70 max-w-sm">
            {t.footer.desc}
          </p>
          <div className="pt-2 flex items-center space-x-3">
            <span className="text-xs font-semibold px-3 py-1 bg-emerald-950 border border-emerald-500/40 text-emerald-300 rounded-full">
              Sertifikat Halal Ready
            </span>
            <span className="text-xs font-semibold px-3 py-1 bg-brand-gold/20 border border-brand-gold/40 text-brand-gold-light rounded-full">
              NIB Terbit Resmi
            </span>
          </div>
        </div>

        <div className="md:col-span-3 space-y-4">
          <h5 className="font-semibold text-white text-sm uppercase tracking-wider">
            {t.footer.navTitle}
          </h5>
          <ul className="space-y-2 text-sm">
            <li><a href="#showcase" className="hover:text-brand-gold transition-colors">{t.menu.produk}</a></li>
            <li><a href="#harga-pasar" className="hover:text-brand-gold transition-colors">Radar Harga Pasar</a></li>
            <li><a href="#katalog" className="hover:text-brand-gold transition-colors">{t.menu.katalog}</a></li>
            <li><a href="/about-us" className="hover:text-brand-gold transition-colors">{t.menu.about}</a></li>
            <li><a href="#lokasi" className="hover:text-brand-gold transition-colors">{t.menu.lokasi}</a></li>
          </ul>
        </div>

        <div className="md:col-span-4 space-y-4">
          <h5 className="font-semibold text-white text-sm uppercase tracking-wider">
            {t.footer.infoTitle}
          </h5>
          <div className="space-y-3 text-sm">
            <a
              href={googleMapsUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="flex items-start space-x-2 hover:text-brand-gold transition-colors"
            >
              <MapPin className="w-5 h-5 text-brand-gold shrink-0 mt-0.5" />
              <span>Cepogo, Kabupaten Boyolali, Jawa Tengah 57362</span>
            </a>
            <a
              href={getWaLink('general')}
              target="_blank"
              rel="noopener noreferrer"
              className="flex items-center space-x-2 hover:text-brand-gold transition-colors"
            >
              <MessageCircle className="w-5 h-5 text-emerald-400 shrink-0" />
              <span>+62 821-3373-1213 (Customer Service / Admin Official Juragans)</span>
            </a>
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto mt-12 pt-8 border-t border-white/10 flex flex-col sm:flex-row items-center justify-between text-xs text-brand-cream/50 space-y-4 sm:space-y-0">
        <p>{t.footer.copyright}</p>
        <div className="flex items-center space-x-4">
          <p>ERNA Brambang Goreng • Boyolali, Jawa Tengah</p>
          {onOpenAdmin && (
            <button
              onClick={onOpenAdmin}
              className="text-[10px] font-semibold text-brand-cream/60 hover:text-brand-gold underline px-2 py-1 bg-white/5 hover:bg-white/10 rounded-lg transition-colors cursor-pointer"
            >
              🔒 Admin Command Center
            </button>
          )}
        </div>
      </div>
    </footer>
  );
}
