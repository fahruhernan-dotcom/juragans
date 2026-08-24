import React, { useEffect } from 'react';
import { Link } from 'react-router-dom';
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
} from 'lucide-react';
import InstagramIcon from '../components/InstagramIcon';

export default function BioLinks() {
  const whatsappNumber = '6282133731213';
  const googleMapsUrl = 'https://www.google.com/maps/place/%22ANAK+BAWANG%22+Brambang+Goreng/@-7.518885,110.553934,16z/data=!4m6!3m5!1s0x2e7a6585adb0c5ed:0xf9990b17294e3e46!8m2!3d-7.5094086!4d110.5132358!16s%2Fg%2F11cltjphjt?hl=id&entry=ttu&g_ep=EgoyMDI2MDYxMC4wIKXMDSoASAFQAw%3D%3D';

  useEffect(() => {
    document.title = 'Juragans by Anak Bawang | Official Link Bio & Catalog';
  }, []);

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
      icon: Sparkles,
      highlight: false
    },
    {
      id: 'catalog-pdf',
      title: '📋 Minta Price List & e-Katalog PDF Resmi',
      subtitle: 'Daftar harga grosir reseller, agen, & spesifikasi kemasan',
      url: `https://wa.me/${whatsappNumber}?text=${encodeURIComponent("Halo Admin Juragans, saya ingin meminta e-Katalog PDF resmi & daftar harga Bawang Goreng Juragans.")}`,
      bgColor: 'bg-white hover:bg-brand-cream-dark/50 border-2 border-brand-gold/40',
      textColor: 'text-brand-charcoal',
      badge: 'PDF Ready',
      icon: FileText,
      highlight: false
    },
    {
      id: 'instagram-profile',
      title: '📸 Follow Instagram @juragans.anakbawang',
      subtitle: 'Tips kuliner, video renyah, & promo diskon bulanan',
      url: 'https://www.instagram.com/juragans.anakbawang/',
      bgColor: 'bg-gradient-to-r from-purple-600 via-pink-600 to-amber-500',
      textColor: 'text-white',
      badge: '1.5k+ Followers',
      icon: InstagramIcon,
      highlight: false
    },
    {
      id: 'google-maps',
      title: '📍 Lokasi Rumah Produksi (Google Maps)',
      subtitle: 'Cepogo, Boyolali, Jawa Tengah 57362',
      url: googleMapsUrl,
      bgColor: 'bg-white hover:bg-brand-cream-dark/50 border-2 border-brand-gold/40',
      textColor: 'text-brand-charcoal',
      badge: '⭐ 4.2 Rating',
      icon: MapPin,
      highlight: false
    }
  ];

  return (
    <div className="min-h-screen bg-gradient-to-b from-brand-cream via-brand-cream-dark/40 to-brand-cream text-brand-charcoal px-4 py-8 sm:py-12 font-sans flex flex-col items-center justify-between">
      {/* Container */}
      <div className="w-full max-w-lg mx-auto flex flex-col items-center space-y-6">
        {/* Navigation Bar back to Landing Page */}
        <div className="w-full flex justify-between items-center pb-2">
          <Link
            to="/"
            className="inline-flex items-center space-x-2 text-xs font-bold text-brand-maroon hover:text-brand-maroon-dark uppercase tracking-wider transition-colors"
          >
            <ArrowLeft className="w-4 h-4" />
            <span>Website Utama</span>
          </Link>
          <Link
            to="/about-us"
            className="text-xs font-semibold text-brand-charcoal/70 hover:text-brand-maroon transition-colors"
          >
            Tentang Kami
          </Link>
        </div>

        {/* Profile Card Header */}
        <div className="flex flex-col items-center text-center space-y-3 pt-2">
          <div className="relative group">
            <div className="w-24 h-24 sm:w-28 sm:h-28 rounded-full overflow-hidden border-4 border-brand-gold shadow-xl p-1 bg-white">
              <img
                src="/images/hero-fried-shallots.jpg"
                alt="Juragans by Anak Bawang Profile"
                className="w-full h-full object-cover rounded-full group-hover:scale-105 transition-transform duration-300"
              />
            </div>
            <span className="absolute bottom-1 right-1 bg-emerald-500 text-white p-1 rounded-full border-2 border-white shadow">
              <CheckCircle className="w-3.5 h-3.5 fill-white text-emerald-500" />
            </span>
          </div>

          <div className="space-y-1">
            <h1 className="font-serif font-bold text-2xl sm:text-3xl text-brand-maroon tracking-tight">
              JURAGANS
            </h1>
            <p className="text-xs font-semibold uppercase tracking-widest text-brand-gold-dark font-sans">
              by Anak Bawang • ERNA Brambang Goreng
            </p>
          </div>

          <p className="text-xs sm:text-sm text-brand-charcoal/80 max-w-sm leading-relaxed">
            👑 Bawang Merah Goreng Renyah Murni Asli Boyolali. Gurih alami tanpa pengawet & tanpa tepung.
          </p>

          {/* Social Proof Tags */}
          <div className="flex flex-wrap justify-center gap-2 pt-1">
            <span className="inline-flex items-center space-x-1 px-3 py-1 bg-white/80 border border-brand-gold/40 rounded-full text-[11px] font-semibold text-brand-maroon-dark shadow-sm">
              <Star className="w-3 h-3 fill-amber-400 text-amber-500" />
              <span>4.2 (13 Google Reviews)</span>
            </span>
            <span className="inline-flex items-center space-x-1 px-3 py-1 bg-white/80 border border-brand-gold/40 rounded-full text-[11px] font-semibold text-emerald-700 shadow-sm">
              <ShieldCheck className="w-3 h-3 text-emerald-600" />
              <span>100% Halal & Higienis</span>
            </span>
          </div>
        </div>

        {/* Links List */}
        <div className="w-full space-y-3.5 pt-2">
          {links.map((link) => {
            const IconComponent = link.icon;
            return (
              <a
                key={link.id}
                href={link.url}
                target="_blank"
                rel="noopener noreferrer"
                className={`w-full block p-4 sm:p-4.5 rounded-2xl shadow-md transition-all duration-300 hover:scale-[1.02] active:scale-[0.99] relative group ${link.bgColor} ${link.textColor}`}
              >
                <div className="flex items-center justify-between">
                  <div className="flex items-center space-x-3.5">
                    <div className={`p-2.5 rounded-xl ${link.highlight ? 'bg-white/20' : 'bg-brand-maroon/10 text-brand-maroon'} shrink-0`}>
                      <IconComponent className="w-5 h-5" />
                    </div>
                    <div className="text-left">
                      <h2 className="text-sm font-bold leading-tight group-hover:underline">
                        {link.title}
                      </h2>
                      <p className={`text-[11px] mt-0.5 ${link.textColor === 'text-white' ? 'text-white/80' : 'text-brand-charcoal/70'}`}>
                        {link.subtitle}
                      </p>
                    </div>
                  </div>

                  <div className="flex flex-col items-end space-y-1 shrink-0 ml-2">
                    {link.badge && (
                      <span className="text-[9px] font-extrabold uppercase px-2 py-0.5 bg-brand-gold text-brand-maroon-dark rounded-full shadow-sm">
                        {link.badge}
                      </span>
                    )}
                    <ExternalLink className="w-3.5 h-3.5 opacity-60 group-hover:opacity-100 transition-opacity" />
                  </div>
                </div>
              </a>
            );
          })}
        </div>

        {/* Website Direct Button */}
        <div className="w-full pt-2">
          <Link
            to="/"
            className="w-full py-3.5 bg-brand-cream border-2 border-brand-maroon/20 hover:border-brand-maroon text-brand-maroon rounded-2xl font-bold text-xs flex items-center justify-center space-x-2 transition-all shadow-sm"
          >
            <Globe className="w-4 h-4" />
            <span>Kunjungi Website Resmi & Kalkulator Harga</span>
          </Link>
        </div>
      </div>

      {/* Footer Branding */}
      <div className="text-center pt-10 text-[11px] text-brand-charcoal/60 space-y-1">
        <p className="font-semibold text-brand-maroon">© 2026 Juragans by Anak Bawang</p>
        <p>Rumah Produksi Brambang Goreng • Cepogo, Boyolali, Jawa Tengah</p>
      </div>
    </div>
  );
}
