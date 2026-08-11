import { MessageCircle, Menu, X } from 'lucide-react';

function InstagramIcon({ className = "w-5 h-5" }) {
  return (
    <svg className={className} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <rect x="2" y="2" width="20" height="20" rx="5" ry="5"></rect>
      <path d="M16 11.37A4 4 0 1 1 12.63 8 4 4 0 0 1 16 11.37z"></path>
      <line x1="17.5" y1="6.5" x2="17.51" y2="6.5"></line>
    </svg>
  );
}

function LanguageToggle({ lang, setLang }) {
  return (
    <div className="flex items-center bg-brand-cream-dark border border-brand-maroon/20 rounded-full p-0.5 text-[10px] font-sans">
      <button
        onClick={() => setLang('id')}
        className={`px-2.5 py-0.5 rounded-full font-semibold transition-all duration-200 ${lang === 'id' ? 'bg-brand-maroon text-white shadow-sm' : 'text-brand-charcoal/60 hover:text-brand-maroon'}`}
      >
        ID
      </button>
      <button
        onClick={() => setLang('en')}
        className={`px-2.5 py-0.5 rounded-full font-semibold transition-all duration-200 ${lang === 'en' ? 'bg-brand-maroon text-white shadow-sm' : 'text-brand-charcoal/60 hover:text-brand-maroon'}`}
      >
        EN
      </button>
    </div>
  );
}

export default function Navbar({ t, lang, setLang, scrolled, isMenuOpen, setIsMenuOpen, scrollToSection, navigate, getWaLink }) {
  return (
    <header
      id="navbar"
      className={`fixed top-0 left-0 right-0 z-50 transition-all duration-300 ${
        scrolled
          ? 'bg-brand-cream/90 backdrop-blur-md shadow-md border-b border-brand-maroon/10 py-3'
          : 'bg-transparent py-5'
      }`}
    >
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between">
          <div className="flex flex-col">
            <a
              href="#"
              onClick={(e) => scrollToSection(e, 'hero')}
              className="font-serif text-2xl font-bold tracking-tight text-brand-maroon hover:text-brand-maroon-dark transition-colors duration-200"
            >
              {t.brandName}
            </a>
            <span className="text-[9px] uppercase tracking-widest text-brand-gold-dark font-semibold font-sans">
              {t.brandSubtitle}
            </span>
          </div>

          <nav className="hidden md:flex space-x-8 text-sm font-semibold tracking-wide uppercase items-center font-sans">
            <a
              href="#showcase"
              onClick={(e) => scrollToSection(e, 'showcase')}
              className="text-brand-charcoal/80 hover:text-brand-maroon hover:translate-y-[-1px] transition-all duration-200"
            >
              {t.menu.produk}
            </a>
            <a
              href="#harga-pasar"
              onClick={(e) => scrollToSection(e, 'harga-pasar')}
              className="text-brand-charcoal/80 hover:text-brand-maroon hover:translate-y-[-1px] transition-all duration-200"
            >
              Harga Pasar
            </a>
            <a
              href="#instagram"
              onClick={(e) => scrollToSection(e, 'instagram')}
              className="text-brand-charcoal/80 hover:text-brand-maroon hover:translate-y-[-1px] transition-all duration-200 flex items-center space-x-1"
            >
              <InstagramIcon className="w-3.5 h-3.5 text-brand-maroon" />
              <span>{t.menu.instagram}</span>
            </a>
            <a
              href="#katalog"
              onClick={(e) => scrollToSection(e, 'katalog')}
              className="text-brand-charcoal/80 hover:text-brand-maroon hover:translate-y-[-1px] transition-all duration-200"
            >
              {t.menu.katalog}
            </a>
            <a
              href="/about-us"
              onClick={(e) => {
                e.preventDefault();
                navigate('/about-us');
              }}
              className="text-brand-charcoal/80 hover:text-brand-maroon hover:translate-y-[-1px] transition-all duration-200"
            >
              {t.menu.about}
            </a>
            <a
              href="#lokasi"
              onClick={(e) => scrollToSection(e, 'lokasi')}
              className="text-brand-charcoal/80 hover:text-brand-maroon hover:translate-y-[-1px] transition-all duration-200"
            >
              {t.menu.lokasi}
            </a>
            <a
              href="#kontak"
              onClick={(e) => scrollToSection(e, 'kontak')}
              className="text-brand-charcoal/80 hover:text-brand-maroon hover:translate-y-[-1px] transition-all duration-200"
            >
              {t.menu.kontak}
            </a>
          </nav>

          <div className="hidden md:flex items-center space-x-4">
            <LanguageToggle lang={lang} setLang={setLang} />
            <a
              id="cta-nav-whatsapp"
              href={getWaLink('general')}
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center space-x-2 px-5 py-2 bg-brand-maroon hover:bg-brand-maroon-dark text-white rounded-full font-semibold shadow-md shadow-brand-maroon/20 hover:shadow-lg transition-all duration-300 text-sm group font-sans"
            >
              <MessageCircle className="w-4 h-4 fill-white text-brand-maroon group-hover:scale-110 transition-transform duration-200" />
              <span>WhatsApp</span>
            </a>
          </div>

          <div className="flex items-center space-x-2 md:hidden">
            <LanguageToggle lang={lang} setLang={setLang} />
            <button
              onClick={() => setIsMenuOpen(!isMenuOpen)}
              className="text-brand-maroon p-1.5 hover:bg-brand-maroon/5 rounded-full transition-colors focus:outline-none"
              aria-label={isMenuOpen ? "Tutup menu" : "Buka menu"}
            >
              {isMenuOpen ? <X className="w-6 h-6" /> : <Menu className="w-6 h-6" />}
            </button>
          </div>
        </div>
      </div>

      <div
        className={`md:hidden absolute top-full left-0 right-0 bg-brand-cream border-b border-brand-maroon/10 shadow-lg transition-all duration-300 ease-in-out origin-top ${
          isMenuOpen ? 'scale-y-100 opacity-100 visible' : 'scale-y-0 opacity-0 invisible h-0'
        }`}
      >
        <div className="px-4 pt-3 pb-6 space-y-3 font-semibold text-center uppercase tracking-wider text-sm flex flex-col font-sans">
          <a
            href="#showcase"
            onClick={(e) => scrollToSection(e, 'showcase')}
            className="py-2.5 border-b border-brand-maroon/5 text-brand-charcoal/80 hover:text-brand-maroon hover:bg-brand-maroon/5 rounded-lg transition-all"
          >
            {t.menu.produk}
          </a>
          <a
            href="#harga-pasar"
            onClick={(e) => scrollToSection(e, 'harga-pasar')}
            className="py-2.5 border-b border-brand-maroon/5 text-brand-charcoal/80 hover:text-brand-maroon hover:bg-brand-maroon/5 rounded-lg transition-all"
          >
            Harga Pasar
          </a>
          <a
            href="#instagram"
            onClick={(e) => scrollToSection(e, 'instagram')}
            className="py-2.5 border-b border-brand-maroon/5 text-brand-charcoal/80 hover:text-brand-maroon hover:bg-brand-maroon/5 rounded-lg transition-all flex items-center justify-center space-x-2"
          >
            <InstagramIcon className="w-4 h-4 text-brand-maroon" />
            <span>{t.menu.instagram}</span>
          </a>
          <a
            href="#katalog"
            onClick={(e) => scrollToSection(e, 'katalog')}
            className="py-2.5 border-b border-brand-maroon/5 text-brand-charcoal/80 hover:text-brand-maroon hover:bg-brand-maroon/5 rounded-lg transition-all"
          >
            {t.menu.katalog}
          </a>
          <a
            href="/about-us"
            onClick={(e) => {
              e.preventDefault();
              navigate('/about-us');
            }}
            className="py-2.5 border-b border-brand-maroon/5 text-brand-charcoal/80 hover:text-brand-maroon hover:bg-brand-maroon/5 rounded-lg transition-all"
          >
            {t.menu.about}
          </a>
          <a
            href="#lokasi"
            onClick={(e) => scrollToSection(e, 'lokasi')}
            className="py-2.5 border-b border-brand-maroon/5 text-brand-charcoal/80 hover:text-brand-maroon hover:bg-brand-maroon/5 rounded-lg transition-all"
          >
            {t.menu.lokasi}
          </a>
          <a
            href="#kontak"
            onClick={(e) => scrollToSection(e, 'kontak')}
            className="py-2.5 border-b border-brand-maroon/5 text-brand-charcoal/80 hover:text-brand-maroon hover:bg-brand-maroon/5 rounded-lg transition-all"
          >
            {t.menu.kontak}
          </a>
          <div className="pt-2">
            <a
              href={getWaLink('general')}
              target="_blank"
              rel="noopener noreferrer"
              className="w-full inline-flex justify-center items-center space-x-2 py-3 bg-brand-maroon hover:bg-brand-maroon-dark text-white rounded-full font-semibold shadow-md shadow-brand-maroon/20 hover:shadow-lg transition-all duration-300"
            >
              <MessageCircle className="w-5 h-5 fill-white text-brand-maroon" />
              <span>WhatsApp</span>
            </a>
          </div>
        </div>
      </div>
    </header>
  );
}
