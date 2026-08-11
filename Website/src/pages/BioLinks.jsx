import {
  MessageCircle,
  ShoppingBag,
  Globe,
  MapPin,
  FileText,
  Star,
  ShieldCheck,
  CheckCircle,
  ExternalLink,
  Sparkles,
  ArrowLeft
} from 'lucide-react'

// Custom Instagram Icon SVG
function InstagramIcon({ className = "w-5 h-5" }) {
  return (
    <svg className={className} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <rect x="2" y="2" width="20" height="20" rx="5" ry="5"></rect>
      <path d="M16 11.37A4 4 0 1 1 12.63 8 4 4 0 0 1 16 11.37z"></path>
      <line x1="17.5" y1="6.5" x2="17.51" y2="6.5"></line>
    </svg>
  )
}

export default function BioLinks({ navigate }) {
  const whatsappNumber = '6282133731213'
  const googleMapsUrl = 'https://www.google.com/maps/place/%22ANAK+BAWANG%22+Brambang+Goreng/@-7.518885,110.553934,16z/data=!4m6!3m5!1s0x2e7a6585adb0c5ed:0xf9990b17294e3e46!8m2!3d-7.5094086!4d110.5132358!16s%2Fg%2F11cltjphjt?hl=id&entry=ttu&g_ep=EgoyMDI2MDYxMC4wIKXMDSoASAFQAw%3D%3D'

  const links = [
    {
      id: 'tiktok-shop',
      title: '🎵 Beli di TikTok Shop Official',
      subtitle: 'Varian 100% Murni & Grade A Premium (Pouch 150g - 1kg)',
      url: 'https://vt.tiktok.com/juragans.anakbawang/',
      bgColor: 'bg-gradient-to-r from-slate-900 via-neutral-900 to-black',
      textColor: 'text-white',
      badge: 'Bisa COD & Free Ongkir',
      icon: ShoppingBag,
      highlight: true
    },
    {
      id: 'whatsapp-order',
      title: '💬 Chat Order WhatsApp (Respon Cepat)',
      subtitle: 'Tanya stok, varian 150g/250g/1kg, & pengiriman instan',
      url: `https://wa.me/${whatsappNumber}?text=${encodeURIComponent("Halo Admin Juragans, saya ingin memesan Bawang Goreng Premium Juragans via Link Bio. Mohon info varian & harganya.")}`,
      bgColor: 'bg-emerald-700 hover:bg-emerald-800',
      textColor: 'text-white',
      badge: 'Order Langsung',
      icon: MessageCircle,
      highlight: true
    },
    {
      id: 'b2b-sample',
      title: '🍲 Klaim Sampel Gratis Restoran & Rumah Makan',
      subtitle: 'Khusus pemilik usaha Bakso, Soto, & Katering (B2B Supplier)',
      url: `https://wa.me/${whatsappNumber}?text=${encodeURIComponent("Halo Admin Juragans, saya pemilik usaha kuliner dan ingin meminta Sampel Gratis Bawang Goreng Juragans untuk tes dapur.")}`,
      bgColor: 'bg-brand-maroon hover:bg-brand-maroon-dark',
      textColor: 'text-white',
      badge: 'Khusus Pemilik Usaha',
      icon: FileText,
      highlight: false
    },
    {
      id: 'website',
      title: '🌐 Kunjungi Website Resmi Juragans',
      subtitle: 'Lihat galeri produk, sertifikasi halal/PIRT, & tentang kami',
      url: '/',
      isInternal: true,
      bgColor: 'bg-white hover:bg-brand-cream',
      textColor: 'text-brand-maroon',
      borderColor: 'border-2 border-brand-gold',
      badge: 'Landing Page',
      icon: Globe,
      highlight: false
    },
    {
      id: 'location',
      title: '📍 Petunjuk Lokasi Toko (Google Maps)',
      subtitle: 'Bendosari, Cepogo, Boyolali, Jawa Tengah',
      url: googleMapsUrl,
      bgColor: 'bg-white hover:bg-brand-cream',
      textColor: 'text-brand-charcoal',
      borderColor: 'border border-brand-maroon/20',
      badge: 'Google Review 4.2 ★',
      icon: MapPin,
      highlight: false
    }
  ]

  return (
    <div className="min-h-screen bg-gradient-to-b from-brand-cream via-brand-cream-dark to-brand-cream text-brand-charcoal font-sans px-4 py-8 flex flex-col items-center justify-between antialiased">
      
      {/* Back to Home Button */}
      <div className="w-full max-w-md flex justify-between items-center mb-6">
        <button
          onClick={() => navigate('/')}
          className="inline-flex items-center space-x-1.5 text-xs font-semibold text-brand-maroon hover:text-brand-maroon-dark bg-white/80 backdrop-blur-sm px-3.5 py-1.5 rounded-full border border-brand-maroon/15 shadow-sm transition-all"
        >
          <ArrowLeft className="w-4 h-4" />
          <span>Ke Website Utama</span>
        </button>

        <span className="text-[10px] uppercase font-bold tracking-widest bg-brand-gold/30 text-brand-maroon-dark px-2.5 py-1 rounded-full border border-brand-gold/50">
          Official Link Bio
        </span>
      </div>

      {/* Main Container Card */}
      <div className="w-full max-w-md space-y-6 text-center">

        {/* Profile Branding Header */}
        <div className="space-y-4 flex flex-col items-center">
          <div className="relative group">
            <div className="absolute -inset-1 rounded-full bg-gradient-to-tr from-brand-gold to-brand-maroon blur-md opacity-75 group-hover:opacity-100 transition duration-500"></div>
            <div className="relative w-24 h-24 rounded-full overflow-hidden border-4 border-white shadow-xl bg-white flex items-center justify-center p-1">
              <img
                src="/images/hero-fried-shallots.jpg"
                alt="Juragans by Anak Bawang"
                className="w-full h-full object-cover rounded-full"
                onError={(e) => {
                  e.target.onerror = null;
                  e.target.src = '/images/product-250g.jpg';
                }}
              />
            </div>
            <div className="absolute -bottom-1 -right-1 bg-brand-maroon text-brand-gold p-1.5 rounded-full border-2 border-white shadow-md">
              <Sparkles className="w-4 h-4" />
            </div>
          </div>

          <div className="space-y-1">
            <h1 className="font-sans font-bold text-2xl tracking-tight text-brand-maroon flex items-center justify-center gap-1.5">
              <span>Juragans</span>
              <CheckCircle className="w-5 h-5 text-brand-gold fill-brand-maroon" />
            </h1>
            <p className="text-xs uppercase tracking-widest font-semibold text-brand-gold-dark">
              by Anak Bawang • ERNA Brambang Goreng
            </p>
            <p className="text-xs text-brand-charcoal/80 max-w-xs mx-auto leading-relaxed pt-1 font-normal">
              👑 Bawang Goreng Premium Asli Cepogo, Boyolali • Renyah, Gurih, & Aromatik Murni 100%
            </p>
          </div>

          {/* Legalities Badges */}
          <div className="flex flex-wrap justify-center gap-2 pt-1">
            <span className="inline-flex items-center space-x-1 px-2.5 py-0.5 bg-emerald-100 border border-emerald-300 text-emerald-800 text-[10px] font-semibold rounded-full">
              <ShieldCheck className="w-3 h-3 text-emerald-600" />
              <span>HALAL Resmi</span>
            </span>
            <span className="inline-flex items-center space-x-1 px-2.5 py-0.5 bg-amber-100 border border-amber-300 text-amber-900 text-[10px] font-semibold rounded-full">
              <ShieldCheck className="w-3 h-3 text-amber-600" />
              <span>P-IRT Verified</span>
            </span>
            <span className="inline-flex items-center space-x-1 px-2.5 py-0.5 bg-brand-maroon/10 border border-brand-maroon/20 text-brand-maroon text-[10px] font-semibold rounded-full">
              <Star className="w-3 h-3 fill-brand-gold text-brand-gold-dark" />
              <span>Rating 4.2 Google</span>
            </span>
          </div>
        </div>

        {/* Links List */}
        <div className="space-y-3.5 pt-2">
          {links.map((link) => {
            const Icon = link.icon
            return (
              <a
                key={link.id}
                href={link.url}
                onClick={(e) => {
                  if (link.isInternal) {
                    e.preventDefault()
                    navigate(link.url)
                  }
                }}
                target={link.isInternal ? '_self' : '_blank'}
                rel={link.isInternal ? '' : 'noopener noreferrer'}
                className={`relative group w-full flex items-center justify-between p-4 rounded-2xl shadow-md transition-all duration-300 transform hover:-translate-y-1 hover:shadow-xl active:scale-[0.98] ${link.bgColor} ${link.textColor} ${link.borderColor || ''}`}
              >
                <div className="flex items-center space-x-3.5 text-left">
                  <div className="w-10 h-10 rounded-xl bg-black/10 backdrop-blur-sm flex items-center justify-center shrink-0">
                    <Icon className="w-5 h-5" />
                  </div>
                  <div className="space-y-0.5">
                    <h2 className="font-sans font-bold text-sm leading-tight flex items-center gap-1.5">
                      <span>{link.title}</span>
                    </h2>
                    <p className="text-[11px] opacity-90 font-normal leading-snug">
                      {link.subtitle}
                    </p>
                  </div>
                </div>

                <div className="shrink-0 pl-2">
                  <ExternalLink className="w-4 h-4 opacity-70 group-hover:opacity-100 transition-opacity" />
                </div>
              </a>
            )
          })}
        </div>

        {/* Social Icons Footer Row */}
        <div className="pt-6 border-t border-brand-maroon/10 flex items-center justify-center space-x-6">
          <a
            href="https://www.instagram.com/juragans.anakbawang/"
            target="_blank"
            rel="noopener noreferrer"
            className="w-10 h-10 rounded-full bg-white border border-pink-200 text-pink-600 shadow-sm flex items-center justify-center hover:scale-110 hover:shadow-md transition-all"
            aria-label="Instagram Juragans by Anak Bawang"
          >
            <InstagramIcon className="w-5 h-5" />
          </a>
          <a
            href={`https://wa.me/${whatsappNumber}`}
            target="_blank"
            rel="noopener noreferrer"
            className="w-10 h-10 rounded-full bg-white border border-emerald-200 text-emerald-600 shadow-sm flex items-center justify-center hover:scale-110 hover:shadow-md transition-all"
            aria-label="WhatsApp Juragans by Anak Bawang"
          >
            <MessageCircle className="w-5 h-5 fill-current" />
          </a>
          <a
            href={googleMapsUrl}
            target="_blank"
            rel="noopener noreferrer"
            className="w-10 h-10 rounded-full bg-white border border-amber-200 text-amber-700 shadow-sm flex items-center justify-center hover:scale-110 hover:shadow-md transition-all"
            aria-label="Google Maps Juragans by Anak Bawang"
          >
            <MapPin className="w-5 h-5" />
          </a>
        </div>
      </div>

      {/* Sub Footer */}
      <footer className="mt-8 text-center text-[11px] text-brand-charcoal/60 font-sans space-y-1">
        <p>© 2026 Juragans by Anak Bawang (ERNA Brambang Goreng)</p>
        <p className="text-[10px] text-brand-gold-dark font-medium">Cepogo, Boyolali • Central Java, Indonesia</p>
      </footer>
    </div>
  )
}
