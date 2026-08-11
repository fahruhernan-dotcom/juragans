import { useState, useEffect } from 'react'
import AboutUs from './pages/AboutUs.jsx'
import BioLinks from './pages/BioLinks.jsx'
import Navbar from './components/Navbar.jsx'
import PriceWidget from './components/PriceWidget.jsx'
import MarginCalculator from './components/MarginCalculator.jsx'
import PriceCalculator from './components/PriceCalculator.jsx'
import HorecaSampleModal from './components/HorecaSampleModal.jsx'
import AdminLoginModal from './components/AdminLoginModal.jsx'
import AdminDashboard from './pages/AdminDashboard.jsx'
import Footer from './components/Footer.jsx'
import {
  MessageCircle,
  MapPin,
  Clock,
  Download,
  X,
  Star,
  Sparkles,
  Check,
  Package,
  Heart,
  ExternalLink,
  Utensils,
  ShoppingBag,
  ShieldCheck,
  Award,
  Globe
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

// Custom Image component that handles missing image fallback gracefully
function ImageWithFallback({ src, alt, className, fallbackText, badgeText, loading }) {
  const [error, setError] = useState(false)
  const [loaded, setLoaded] = useState(false)

  if (error) {
    return (
      <div className={`${className} flex flex-col items-center justify-center bg-gradient-to-br from-brand-maroon/10 to-brand-maroon/5 border-2 border-dashed border-brand-maroon/20 text-center select-none p-6`}>
        <div className="w-14 h-14 bg-brand-maroon/10 text-brand-maroon rounded-full flex items-center justify-center mb-3">
          <Package className="w-7 h-7" />
        </div>
        <p className="text-sm font-semibold text-brand-maroon mb-1 font-sans">{fallbackText || 'Gambar Produk'}</p>
        <span className="text-[10px] tracking-wider uppercase bg-brand-gold/20 text-brand-maroon-dark px-2.5 py-0.5 rounded-full font-semibold">
          {badgeText || 'JURAGANS'}
        </span>
      </div>
    )
  }

  return (
    <img
      src={src}
      alt={alt}
      className={`${className} transition-opacity duration-500 ease-in-out ${loaded ? 'opacity-100' : 'opacity-0'}`}
      onLoad={() => setLoaded(true)}
      onError={() => setError(true)}
      loading={loading}
    />
  )
}

// Instagram Data Feed synced with auto-poster
const instagramPosts = [
  {
    id: 1,
    image: '/images/instagram/01_Katalog_Studio_Clean.jpg',
    title: 'Katalog Stand-Out Frosted Pouch',
    headline: '👑 JURAGANS BY ANAK BAWANG: Renyah Murni Tampil Stand-out di Dapurmu!',
    desc: 'Bawang merah pilihan berkualitas A++ dari Cepogo Boyolali kini hadir dalam kemasan pouch frosted ziplock yang kedap udara. Menjaga kerenyahan alami tanpa pengawet dan tanpa MSG!',
    hashtags: '#bawanggoreng #juragansbyanakbawang #anakbawang #brambanggoreng #bawangmurni',
    igUrl: 'https://www.instagram.com/juragans.anakbawang/'
  },
  {
    id: 2,
    image: '/images/instagram/02_Pairing_Bakso_Soto_Warm.png',
    title: 'Pairing Kuah Bakso & Soto',
    headline: '🍜 Makanan Favoritmu Belum Lengkap Tanpa Taburan Juragans by Anak Bawang!',
    desc: 'Mau Bakso kuah gurih atau Soto Ayam hangat, rahasia kelezatan hakiki ada pada aroma bawang gorengnya! Dibuat dari 100% bawang Sumenep/lokal pilihan.',
    hashtags: '#bakso #sotoayam #bawanggoreng #juragansbyanakbawang #kulinersolo',
    igUrl: 'https://www.instagram.com/juragans.anakbawang/'
  },
  {
    id: 3,
    image: '/images/instagram/03_Pairing_Bakso_Soto_Steaming.jpg',
    title: 'Kepercayaan Dapur Restoran & Horeca',
    headline: '🏆 Menjaga Cita Rasa Legendaris Restoran & Usaha Kulinermu!',
    desc: 'Konsistensi adalah kunci bisnis kuliner! Dengan Juragans by Anak Bawang, usaha bakso, soto, dan katering Anda dijamin selalu mendapatkan aroma wangi alami.',
    hashtags: '#supplierbawanggoreng #horeca #suplierkuliner #usahabakso #juragansbyanakbawang',
    igUrl: 'https://www.instagram.com/juragans.anakbawang/'
  },
  {
    id: 4,
    image: '/images/instagram/04_Action_NasiGoreng_Telur.jpg',
    title: 'Nasi Goreng + Telur Ceplok Bintang 5',
    headline: '🍳 Nasi Goreng + Telur Ceplok + Taburan Bawang Juragans Melimpah = Bintang 5! ⭐',
    desc: 'Siapa bilang makan enak harus mahal? Cukup piring nasi hangat, telur ceplok setengah matang, lalu taburi Juragans by Anak Bawang sampai menumpuk.',
    hashtags: '#nasigoreng #telurceplok #bawanggoreng #juragansbyanakbawang',
    igUrl: 'https://www.instagram.com/juragans.anakbawang/'
  },
  {
    id: 5,
    image: '/images/instagram/05_Pouring_Minimalist_Pink.jpg',
    title: 'Kemasan Ziplock Kedap Udara',
    headline: '✨ Kemasan Ziplock Kedap Udara: Tinggal Tuang, Tutup, Simpan!',
    desc: 'Nggak perlu repot mindahin ke toples. Kemasan frosted ziplock Juragans by Anak Bawang dirancang kedap udara untuk menjaga kerenyahan bawang bertahan hingga 3-6 bulan!',
    hashtags: '#snackaesthetic #bawanggoreng #juragansbyanakbawang #praktis #stokdapur',
    igUrl: 'https://www.instagram.com/juragans.anakbawang/'
  },
  {
    id: 6,
    image: '/images/instagram/06_Flatlay_Bahan_Wood_Rustic.jpg',
    title: '100% Bawang Merah Asli Sumenep/Boyolali',
    headline: '🧅 Rahasia Gurih Alami: Tanpa Tepung, Tanpa MSG, Tanpa Pengawet!',
    desc: 'Di dapur Juragans by Anak Bawang, kami hanya memilih bawang merah lokal segar berkualitas A++. Diproses higienis dengan penirisan minyak modern.',
    hashtags: '#bahanalami #bawanggorengmurni #juragansbyanakbawang #tanpatepung #tanpamsg',
    igUrl: 'https://www.instagram.com/juragans.anakbawang/'
  }
]

// Translations Object
const translations = {
  id: {
    brandName: "JURAGANS",
    brandSubtitle: "by Anak Bawang • ERNA Brambang Goreng",
    menu: {
      produk: "Showcase",
      katalog: "Katalog",
      instagram: "Instagram",
      about: "About Us",
      lokasi: "Lokasi",
      kontak: "Kontak"
    },
    hero: {
      badgeRating: "Rating 4.2 (13 Google Review)",
      badgeDelivery: "Delivery Available",
      headline: "Brambang Goreng Premium Asli Boyolali",
      subheadline: "Juragans by Anak Bawang (ERNA Brambang Goreng) menghadirkan bawang goreng renyah, gurih, dan aromatik dari Cepogo, Boyolali. Dibuat untuk melengkapi cita rasa masakan rumahan, restoran, katering, reseller, dan kebutuhan horeca.",
      ctaPrimary: "Pesan via WhatsApp",
      ctaSecondary: "Lihat Katalog Produk",
      quote: "Rahasia kelezatan masakan Anda. Bawang goreng premium yang renyah, gurih, dan aromatik dipercaya oleh restoran, katering, reseller, hingga Horeca."
    },
    trust: {
      tag: "Kredibilitas Kami",
      title: "Dipercaya Pelaku Usaha Kuliner",
      desc: "Juragans by Anak Bawang hadir dari pengalaman memenuhi kebutuhan bawang goreng untuk rumah makan, restoran, katering, reseller, dan pelaku usaha kuliner.",
      cardHint: "Klik untuk konsultasi",
      cards: [
        { title: "Restoran", desc: "Dipercaya untuk kebutuhan dapur usaha kuliner.", ariaLabel: "Konsultasi restoran" },
        { title: "Katering", desc: "Siap untuk pemakaian harian dan partai usaha.", ariaLabel: "Konsultasi katering" },
        { title: "Reseller", desc: "Cocok untuk toko, agen, dan penjualan ulang.", ariaLabel: "Kemitraan reseller" },
        { title: "Horeca", desc: "Konsisten untuk dapur restoran, katering, dan horeca.", ariaLabel: "Konsultasi horeca" }
      ]
    },
    showcase: {
      tag: "Kualitas Premium",
      title: "Renyah, Gurih, dan Aromatik di Setiap Taburan",
      desc: "Diproses untuk menghasilkan brambang goreng berwarna keemasan, tekstur renyah, dan aroma bawang yang kuat.",
      features: [
        { title: "Renyah & Tahan Lama", desc: "Dikeringkan optimal dengan teknologi tiris minyak modern." },
        { title: "Gurih Alami", desc: "Cita rasa manis dan gurih alami khas bawang merah asli." },
        { title: "Aroma Aromatik Kuat", desc: "Aroma wangi khas bawang goreng Cepogo yang segar." },
        { title: "Warna Keemasan Indah", desc: "Tampilan visual kuning keemasan yang bersih dan mewah." }
      ]
    },
    instagram: {
      tag: "Social Media Feed",
      title: "Galeri Instagram Juragans by Anak Bawang",
      desc: "Sajian foto produk terbaru, kreasi kuliner, dan momen kerenyahan Juragans by Anak Bawang yang sudah terbit di Instagram kami.",
      ctaFollow: "Follow @juragans.anakbawang di Instagram",
      modalTitle: "Detail Postingan Instagram",
      viewOnIg: "Lihat di Instagram",
      orderWa: "Pesan Produk Ini via WA"
    },
    usage: {
      tag: "Penggunaan",
      title: "Cocok untuk Kebutuhan Apa?",
      home: { title: "Masakan Rumahan", desc: "Sempurna untuk stok dapur rumah tangga Anda." },
      horeca: { title: "Restoran & Katering", desc: "Menjamin konsistensi kerenyahan dan wangi bawang goreng." },
      reseller: { title: "Reseller & Toko", desc: "Produk bermutu tinggi dengan kemasan menarik." },
      wholesale: { title: "Horeca & Buyer Grosir", desc: "Suplai bawang goreng berkualitas tinggi dalam volume besar." }
    },
    catalog: {
      title: "Detail Produk & Pemesanan",
      desc: "Dapatkan katalog lengkap kami yang menyajikan detail spesifikasi produk, ragam kemasan, dan kebijakan pengiriman.",
      cta: "Lihat Katalog & Detail Produk",
      status: "Detail kemasan, harga, dan pemesanan tersedia melalui katalog atau WhatsApp.",
      statusSub: "Katalog produk akan segera tersedia.",
      modalTitle: "Katalog Sedang Dipersiapkan",
      modalDesc: "Anda dapat segera menanyakan spesifikasi grosir, kemasan, atau penawaran kemitraan langsung via WhatsApp sekarang!",
      modalCta: "Hubungi WhatsApp Sekarang",
      modalBack: "Kembali ke Landing Page"
    },
    about: {
      tag: "Tentang Kami",
      title: "Juragans by Anak Bawang",
      desc1: "Juragans by Anak Bawang adalah produk bawang goreng lokal premium dari ERNA Brambang Goreng Cepogo, Boyolali.",
      highlight: "“Mengangkat cita rasa bawang goreng lokal dari kawasan Boyolali dengan karakter gurih, renyah, dan cocok untuk berbagai masakan.”",
      desc2: "Diproses dengan mempertahankan standar kebersihan dan resep keluarga pilihan.",
      stat1: "Bahan Pilihan", stat1sub: "Bawang merah berkualitas",
      stat2: "Kualitas Terjaga", stat2sub: "Resep warisan asli",
      stat3: "Diproses Higienis", stat3sub: "Standar kebersihan tinggi",
      stat4: "Dari Cepogo, Boyolali", stat4sub: "Lereng Gunung Merbabu"
    },
    location: {
      tag: "Kunjungi Store Kami",
      title: "Detail Lokasi",
      hours: "Buka mulai pukul 08.00 WIB",
      cta1: "Buka Google Maps",
      cta2: "Hubungi WhatsApp"
    },
    contact: {
      title: "Konsultasikan Kebutuhan Anda",
      desc: "Hubungi Juragans by Anak Bawang untuk pemesanan khusus, penawaran harga grosir reseller, katering, atau permintaan sampel.",
      cta: "Hubungi via WhatsApp"
    },
    footer: {
      desc: "Bawang goreng premium asal Cepogo, Boyolali. Renyah tahan lama, harum alami, siap menambah kenikmatan makanan Anda.",
      navTitle: "Menu Navigasi",
      infoTitle: "Informasi Kontak",
      copyright: "© 2026 Juragans by Anak Bawang. All rights reserved.",
      madeBy: "Dibuat oleh"
    }
  },
  en: {
    brandName: "JURAGANS",
    brandSubtitle: "by Anak Bawang • ERNA Brambang Goreng",
    menu: {
      produk: "Showcase",
      katalog: "Catalog",
      instagram: "Instagram",
      about: "About Us",
      lokasi: "Location",
      kontak: "Contact"
    },
    hero: {
      badgeRating: "★ 4.2 Rating (13 Google Reviews)",
      badgeDelivery: "Worldwide Shipping Ready",
      headline: "Premium Indonesian Fried Shallots from Boyolali",
      subheadline: "Juragans by Anak Bawang (ERNA Brambang Goreng) offers crispy, aromatic, golden fried shallots from Cepogo, Boyolali, Central Java.",
      ctaPrimary: "Order via WhatsApp",
      ctaSecondary: "View Product Catalog",
      quote: "Trusted for restaurants, catering, resellers, and horeca food businesses."
    },
    trust: {
      tag: "Our Credibility",
      title: "Trusted by Culinary Businesses",
      desc: "Juragans by Anak Bawang is built from experience in supplying fried shallots for food businesses.",
      cardHint: "Click to inquire",
      cards: [
        { title: "Restaurants", desc: "Trusted for daily food business kitchen needs.", ariaLabel: "Inquire restaurants" },
        { title: "Catering", desc: "Ready for daily use and small wholesale supply.", ariaLabel: "Inquire catering" },
        { title: "Resellers", desc: "Suitable for shops, agents, and retail networks.", ariaLabel: "Inquire resellers" },
        { title: "Horeca", desc: "Consistent for restaurants, catering, and horeca kitchens.", ariaLabel: "Inquire horeca" }
      ]
    },
    showcase: {
      tag: "Premium Quality",
      title: "Crispy, Aromatic, and Golden in Every Sprinkle",
      desc: "Carefully prepared to deliver golden color, crispy texture, and a rich shallot aroma.",
      features: [
        { title: "Crispy & Dry", desc: "Dried optimally with modern oil-spinning technology." },
        { title: "Natural Umami", desc: "Unlocking the natural sweet-savory notes of premium local shallots." },
        { title: "Rich Shallot Aroma", desc: "Fresh, deep aroma unique to Cepogo highland shallots." },
        { title: "Golden Visual Appeal", desc: "Beautiful golden-yellow finish that acts as a premium visual garnish." }
      ]
    },
    instagram: {
      tag: "Social Media Feed",
      title: "Juragans by Anak Bawang Instagram Gallery",
      desc: "Explore our latest product photography, recipe pairings, and culinary highlights published on Instagram.",
      ctaFollow: "Follow @juragans.anakbawang on Instagram",
      modalTitle: "Instagram Post Details",
      viewOnIg: "View on Instagram",
      orderWa: "Order via WhatsApp"
    },
    usage: {
      tag: "Applications",
      title: "Who is it Crafted For?",
      home: { title: "Home Cooking", desc: "Perfect addition to raise the bar for your home kitchen pantry." },
      horeca: { title: "Restaurants & Catering", desc: "Ensures uniform crunch and deep shallot fragrance." },
      reseller: { title: "Resellers & Grocery Stores", desc: "A premium shelf-ready snack and seasoning." },
      wholesale: { title: "Horeca & Wholesale", desc: "Bulk food-grade supplies tailored for corporate caterers." }
    },
    catalog: {
      title: "Product Details & Inquiry",
      desc: "Retrieve our detailed business portfolio illustrating package sizes, custom wholesale pricing, and shipping.",
      cta: "View Catalog & Product Details",
      status: "Packaging details, pricing, and order information are available via catalog or WhatsApp.",
      statusSub: "Product catalog will be available shortly.",
      modalTitle: "Catalog is Being Prepared",
      modalDesc: "You can instantly request prices, bulk shipping terms, or distributor deals directly via WhatsApp right now!",
      modalCta: "Chat with Us on WhatsApp",
      modalBack: "Back to Home"
    },
    about: {
      tag: "About Us",
      title: "Juragans by Anak Bawang",
      desc1: "Juragans by Anak Bawang is a premium local fried shallot product by ERNA Brambang Goreng from Cepogo, Boyolali.",
      highlight: "“Bringing the authentic taste of premium Central Javanese fried shallots to global culinary businesses.”",
      desc2: "Processed with strict cleanliness and high-quality controls.",
      stat1: "Selected Ingredients", stat1sub: "Quality local red shallots",
      stat2: "Maintained Quality", stat2sub: "Heritage family recipe",
      stat3: "Hygienically Processed", stat3sub: "High standards of cleanliness",
      stat4: "From Cepogo, Boyolali", stat4sub: "Volcanic highland soils"
    },
    location: {
      tag: "Visit Our Store",
      title: "Location Details",
      hours: "Open from 08:00 AM (WIB)",
      cta1: "Open Google Maps",
      cta2: "Contact on WhatsApp"
    },
    contact: {
      title: "Inquire About Wholesale or Custom Orders",
      desc: "Contact Juragans by Anak Bawang for volume discounts, distributor partnerships, or sample requests.",
      cta: "Connect on WhatsApp"
    },
    footer: {
      desc: "Premium fried shallots from Cepogo, Boyolali. Crispy, long-lasting, naturally aromatic.",
      navTitle: "Navigation",
      infoTitle: "Contact Info",
      copyright: "© 2026 Juragans by Anak Bawang. All rights reserved.",
      madeBy: "Crafted by"
    }
  }
}

function App() {
  const [lang, setLang] = useState(() => {
    const saved = localStorage.getItem('anak-bawang-lang')
    return saved === 'en' || saved === 'id' ? saved : 'id'
  })

  const [isMenuOpen, setIsMenuOpen] = useState(false)
  const [scrolled, setScrolled] = useState(false)
  const [isCatalogModalOpen, setIsCatalogModalOpen] = useState(false)
  const [isHorecaModalOpen, setIsHorecaModalOpen] = useState(false)
  const [isAdminLoginOpen, setIsAdminLoginOpen] = useState(false)
  const [isAdminLoggedIn, setIsAdminLoggedIn] = useState(false)
  const [selectedIgPost, setSelectedIgPost] = useState(null)
  const [path, setPath] = useState(window.location.pathname)

  useEffect(() => {
    const handlePopState = () => {
      setPath(window.location.pathname)
    }
    window.addEventListener('popstate', handlePopState)
    return () => window.removeEventListener('popstate', handlePopState)
  }, [])

  const navigate = (newPath) => {
    window.history.pushState({}, '', newPath)
    setPath(newPath)
    window.scrollTo({ top: 0, behavior: 'instant' })
  }

  useEffect(() => {
    if (path === '/about-us') {
      document.title = lang === 'id'
        ? 'Tentang Juragans by Anak Bawang | Rumah Produksi Brambang Goreng Premium'
        : 'About Juragans by Anak Bawang | Premium Fried Shallots Production House';
    } else if (path === '/links' || path === '/bio' || path === '/linktree') {
      document.title = 'Juragans by Anak Bawang | Official Link Bio & Catalog';
    } else {
      document.title = lang === 'id'
        ? 'Juragans by Anak Bawang | Brambang Goreng Premium Asli Boyolali'
        : 'Juragans by Anak Bawang | Premium Indonesian Fried Shallots Boyolali';
    }
  }, [path, lang])

  useEffect(() => {
    localStorage.setItem('anak-bawang-lang', lang)
  }, [lang])

  const t = translations[lang]

  useEffect(() => {
    const handleScroll = () => {
      if (window.scrollY > 20) {
        setScrolled(true)
      } else {
        setScrolled(false)
      }
    }
    window.addEventListener('scroll', handleScroll)
    return () => window.removeEventListener('scroll', handleScroll)
  }, [])

  useEffect(() => {
    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting) {
            entry.target.classList.add('reveal-visible')
            observer.unobserve(entry.target)
          }
        })
      },
      { threshold: 0.05, rootMargin: '0px 0px -40px 0px' }
    )

    const elements = document.querySelectorAll('.reveal')
    elements.forEach((el) => observer.observe(el))
    return () => elements.forEach((el) => observer.unobserve(el))
  }, [path, lang])

  const scrollToSection = (e, id) => {
    e.preventDefault()
    setIsMenuOpen(false)
    if (path !== '/') {
      window.history.pushState({}, '', '/')
      setPath('/')
      setTimeout(() => {
        const element = document.getElementById(id)
        if (element) {
          element.scrollIntoView({ behavior: 'smooth' })
        }
      }, 100)
    } else {
      const element = document.getElementById(id)
      if (element) {
        element.scrollIntoView({ behavior: 'smooth' })
      }
    }
  }

  const whatsappNumber = '6282133731213'

  const getWaLink = (key, customText) => {
    if (customText) {
      return `https://wa.me/${whatsappNumber}?text=${encodeURIComponent(customText)}`
    }
    const messages = {
      id: {
        general: "Halo Admin Juragans, saya berminat dengan Bawang Goreng Premium Boyolali dan ingin menanyakan informasi pemesanan.",
        hero: "Halo Admin Juragans, saya ingin memesan Bawang Goreng Premium Juragans dari Cepogo Boyolali. Mohon informasi varian & daftar harganya.",
        catalog: "Halo Admin Juragans, saya ingin meminta e-Katalog PDF resmi & daftar harga Bawang Goreng Juragans.",
        restaurant: "Halo Admin Juragans, saya dari usaha Restoran/Rumah Makan dan ingin berkonsultasi mengenai suplai rutin Bawang Goreng B2B.",
        catering: "Halo Admin Juragans, saya pemilik usaha Katering dan ingin menanyakan penawaran harga grosir Bawang Goreng Juragans.",
        resellerCard: "Halo Admin Juragans, saya tertarik menjadi Reseller/Mitra resmi Bawang Goreng Juragans. Mohon informasi syarat & harganya.",
        horecaCard: "Halo Admin Juragans, saya berminat memesan Bawang Goreng Juragans partai besar (Horeca/Grosir). Mohon info penawaran harganya."
      },
      en: {
        general: "Hello Juragans Admin, I am interested in Boyolali Premium Fried Shallots and would like to inquire about ordering.",
        hero: "Hello Juragans Admin, I would like to order Juragans Premium Fried Shallots from Cepogo, Boyolali. Please share the variants & price list.",
        catalog: "Hello Juragans Admin, I would like to request the official e-Catalog PDF & price list for Juragans Fried Shallots.",
        restaurant: "Hello Juragans Admin, I represent a Restaurant business and would like to inquire about B2B supply of Juragans Fried Shallots.",
        catering: "Hello Juragans Admin, I am a Catering business owner and would like to inquire about wholesale offers for Juragans Fried Shallots.",
        resellerCard: "Hello Juragans Admin, I am interested in becoming an official Reseller/Partner for Juragans Fried Shallots. Please share the terms & pricing.",
        horecaCard: "Hello Juragans Admin, I am interested in bulk wholesale orders (Horeca/Distributor). Please provide a price quotation."
      }
    }
    const text = encodeURIComponent(messages[lang][key] || messages[lang].general)
    return `https://wa.me/${whatsappNumber}?text=${text}`
  }

  const googleMapsUrl = 'https://www.google.com/maps/place/%22ANAK+BAWANG%22+Brambang+Goreng/@-7.518885,110.553934,16z/data=!4m6!3m5!1s0x2e7a6585adb0c5ed:0xf9990b17294e3e46!8m2!3d-7.5094086!4d110.5132358!16s%2Fg%2F11cltjphjt?hl=id&entry=ttu&g_ep=EgoyMDI2MDYxMC4wIKXMDSoASAFQAw%3D%3D'

  return (
    <div className={`bg-brand-cream text-brand-charcoal selection:bg-brand-maroon/20 selection:text-brand-maroon-dark font-sans relative antialiased ${
      path === '/admin' || isAdminLoggedIn ? 'h-screen overflow-hidden' : 'min-h-screen'
    }`}>

      {path === '/admin' || isAdminLoggedIn ? (
        <AdminDashboard onLogout={() => { setIsAdminLoggedIn(false); setPath('/'); }} />
      ) : path === '/about-us' ? (
        <AboutUs lang={lang} navigate={navigate} />
      ) : path === '/links' || path === '/bio' || path === '/linktree' ? (
        <BioLinks lang={lang} navigate={navigate} />
      ) : (
        <>
          <Navbar
            t={t}
            lang={lang}
            setLang={setLang}
            scrolled={scrolled}
            isMenuOpen={isMenuOpen}
            setIsMenuOpen={setIsMenuOpen}
            scrollToSection={scrollToSection}
            navigate={navigate}
            getWaLink={getWaLink}
          />

          {/* Hero Section */}
          <section
            id="hero"
            className="pt-32 pb-20 md:pt-40 md:pb-32 px-4 sm:px-6 lg:px-8 max-w-7xl mx-auto reveal"
          >
            <div className="grid md:grid-cols-12 gap-12 items-center font-sans">
              <div className="md:col-span-7 space-y-6 text-left">
                <div className="flex flex-wrap gap-3">
                  <div className="inline-flex items-center space-x-1 px-3.5 py-1.5 bg-brand-gold/25 border border-brand-gold text-brand-maroon-dark text-xs font-semibold rounded-full">
                    <Star className="w-3.5 h-3.5 fill-brand-gold text-brand-gold-dark" />
                    <span>{t.hero.badgeRating}</span>
                  </div>
                  <div className="inline-flex items-center space-x-1 px-3.5 py-1.5 bg-brand-maroon/10 border border-brand-maroon/20 text-brand-maroon-dark text-xs font-semibold rounded-full">
                    <Check className="w-3.5 h-3.5 text-brand-maroon" />
                    <span>{t.hero.badgeDelivery}</span>
                  </div>
                </div>

                <h1 className="font-sans font-semibold tracking-tight leading-[1.05] text-4xl sm:text-5xl lg:text-6xl text-brand-maroon">
                  {t.hero.headline}
                </h1>

                <p className="text-base sm:text-lg text-brand-charcoal/90 leading-relaxed font-sans max-w-xl font-normal">
                  {t.hero.subheadline}
                </p>

                <div className="pt-2 flex flex-col sm:flex-row gap-4 font-sans font-semibold">
                  <a
                    id="cta-hero-whatsapp"
                    href={getWaLink('hero')}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="inline-flex justify-center items-center space-x-3 px-8 py-4 bg-brand-maroon hover:bg-brand-maroon-dark text-white rounded-full font-semibold text-base shadow-lg shadow-brand-maroon/35 hover:shadow-xl transition-all duration-300 relative group overflow-hidden premium-button-hover active:scale-[0.98]"
                  >
                    <span className="absolute inset-0 bg-white/10 opacity-0 group-hover:opacity-100 transition-opacity duration-300"></span>
                    <MessageCircle className="w-5 h-5 fill-white text-brand-maroon" />
                    <span>{t.hero.ctaPrimary}</span>
                  </a>
                  <a
                    id="cta-hero-catalog"
                    href="#katalog"
                    onClick={(e) => scrollToSection(e, 'katalog')}
                    className="inline-flex justify-center items-center space-x-2 px-8 py-4 border-2 border-brand-gold hover:border-brand-gold-dark text-brand-maroon-dark bg-transparent hover:bg-brand-gold/10 rounded-full text-base transition-all duration-300 premium-button-hover active:scale-[0.98]"
                  >
                    <span>{t.hero.ctaSecondary}</span>
                  </a>
                </div>
              </div>

              <div className="md:col-span-5 flex justify-center relative">
                <div className="relative group w-full max-w-md">
                  <div className="absolute -inset-2 rounded-2xl bg-gradient-to-tr from-brand-gold to-brand-maroon opacity-30 blur-xl group-hover:opacity-40 transition duration-1000 group-hover:duration-200"></div>
                  <div className="relative bg-white rounded-2xl overflow-hidden shadow-2xl border-4 border-brand-gold/30 aspect-[4/3] sm:aspect-[4/3] flex items-stretch animate-float-slow">
                    <ImageWithFallback
                      src="/images/hero-fried-shallots.jpg"
                      alt="Juragans by Anak Bawang"
                      className="w-full h-full object-cover"
                      fallbackText="Juragans by Anak Bawang"
                      badgeText="by ERNA Brambang Goreng"
                      loading="eager"
                    />
                  </div>
                </div>
              </div>
            </div>
          </section>

          {/* Feature Divider */}
          <div className="bg-brand-cream-dark/50 py-12 border-y border-brand-maroon/5 reveal">
            <div className="max-w-7xl mx-auto px-4 text-center">
              <p className="text-brand-maroon font-sans font-semibold tracking-tight text-xl md:text-2xl">
                {t.hero.quote}
              </p>
            </div>
          </div>

          {/* Trust & Credibility Section */}
          <section className="py-24 bg-white border-b border-brand-maroon/5 px-4 sm:px-6 lg:px-8 reveal">
            <div className="max-w-7xl mx-auto">
              <div className="text-center max-w-3xl mx-auto mb-16 space-y-4">
                <span className="font-sans text-xs font-semibold uppercase tracking-[0.2em] text-brand-gold-dark block">
                  {t.trust.tag}
                </span>
                <h2 className="font-sans font-semibold tracking-tight text-3xl sm:text-4xl lg:text-5xl text-brand-maroon">
                  {t.trust.title}
                </h2>
                <div className="w-20 h-1 bg-brand-gold mx-auto rounded-full"></div>
                <p className="text-brand-charcoal/80 text-sm sm:text-base font-sans font-normal leading-relaxed">
                  {t.trust.desc}
                </p>
              </div>

              <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-8">
                {t.trust.cards.map((card, idx) => (
                  <a
                    key={idx}
                    href={getWaLink('general')}
                    target="_blank"
                    rel="noopener noreferrer"
                    aria-label={card.ariaLabel}
                    className="bg-brand-cream/35 border-2 border-brand-gold/30 rounded-2xl p-8 text-left premium-card-hover hover:border-brand-gold flex flex-col justify-between group cursor-pointer reveal"
                    style={{ transitionDelay: `${idx * 100}ms` }}
                  >
                    <div className="space-y-4">
                      <div className="w-14 h-14 bg-brand-maroon/10 text-brand-maroon rounded-2xl flex items-center justify-center">
                        {idx === 0 && <Utensils className="w-7 h-7" />}
                        {idx === 1 && <ShieldCheck className="w-7 h-7" />}
                        {idx === 2 && <Award className="w-7 h-7" />}
                        {idx === 3 && <Globe className="w-7 h-7" />}
                      </div>
                      <h3 className="font-sans font-semibold text-lg text-brand-maroon">{card.title}</h3>
                      <p className="text-sm text-brand-charcoal/90 leading-relaxed font-sans font-normal">{card.desc}</p>
                    </div>
                    <span className="text-[11px] font-bold text-brand-gold-dark/80 group-hover:text-brand-maroon transition-colors duration-200 mt-4 font-sans block">
                      {t.trust.cardHint} &rarr;
                    </span>
                  </a>
                ))}
              </div>
            </div>
          </section>

          {/* Real-time Market Price Widget */}
          <PriceWidget lang={lang} />

          {/* Interactive Offline Price & Savings Calculator */}
          <PriceCalculator lang={lang} getWaLink={getWaLink} />

          {/* Reseller & B2B Profit Margin Calculator */}
          <MarginCalculator lang={lang} getWaLink={getWaLink} />

          {/* Premium Product Showcase Section */}
          <section
            id="showcase"
            className="py-24 px-4 sm:px-6 lg:px-8 max-w-7xl mx-auto scroll-mt-20 font-sans reveal"
          >
            <div className="text-center max-w-3xl mx-auto mb-16 space-y-4">
              <span className="text-xs font-semibold uppercase tracking-[0.2em] text-brand-gold-dark block">
                {t.showcase.tag}
              </span>
              <h2 className="font-sans font-semibold tracking-tight text-3xl sm:text-4xl lg:text-5xl text-brand-maroon">
                {t.showcase.title}
              </h2>
              <div className="w-20 h-1 bg-brand-gold mx-auto rounded-full"></div>
              <p className="text-brand-charcoal/80 text-sm sm:text-base font-normal leading-relaxed">
                {t.showcase.desc}
              </p>
            </div>

            <div className="grid md:grid-cols-12 gap-12 items-center">
              <div className="md:col-span-5 flex justify-center reveal">
                <div className="bg-white rounded-3xl overflow-hidden border-2 border-brand-gold/50 shadow-xl w-full max-w-md aspect-[3/4] flex items-stretch group">
                  <ImageWithFallback
                    src="/images/product-250g.jpg"
                    alt="Juragans by Anak Bawang Premium Showcase"
                    className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-750"
                    fallbackText="Juragans by Anak Bawang"
                    badgeText="by ERNA Brambang Goreng"
                    loading="lazy"
                  />
                </div>
              </div>

              <div className="md:col-span-7 space-y-6">
                <div className="grid sm:grid-cols-2 gap-6 text-left">
                  {t.showcase.features.map((feature, idx) => (
                    <div
                      key={idx}
                      className="bg-white p-6 rounded-2xl border border-brand-gold/20 shadow-sm space-y-2 reveal premium-card-hover hover:border-brand-gold"
                      style={{ transitionDelay: `${idx * 150}ms` }}
                    >
                      <div className="w-10 h-10 bg-brand-maroon/10 text-brand-maroon rounded-lg flex items-center justify-center">
                        <Sparkles className="w-5 h-5" />
                      </div>
                      <h3 className="font-sans font-semibold text-lg text-brand-maroon">{feature.title}</h3>
                      <p className="text-xs sm:text-sm text-brand-charcoal/80 leading-relaxed font-normal">{feature.desc}</p>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </section>

          {/* Instagram Feed / Social Media Section */}
          <section
            id="instagram"
            className="py-24 bg-brand-cream-dark/30 px-4 sm:px-6 lg:px-8 border-y border-brand-maroon/5 scroll-mt-20 font-sans reveal"
          >
            <div className="max-w-7xl mx-auto">
              <div className="text-center max-w-3xl mx-auto mb-16 space-y-4">
                <div className="inline-flex items-center space-x-2 px-3.5 py-1.5 bg-gradient-to-r from-purple-500/10 to-pink-500/10 border border-pink-500/30 text-brand-maroon text-xs font-semibold rounded-full">
                  <InstagramIcon className="w-4 h-4 text-pink-600" />
                  <span>{t.instagram.tag}</span>
                </div>
                <h2 className="font-sans font-semibold tracking-tight text-3xl sm:text-4xl lg:text-5xl text-brand-maroon">
                  {t.instagram.title}
                </h2>
                <div className="w-20 h-1 bg-brand-gold mx-auto rounded-full"></div>
                <p className="text-brand-charcoal/80 text-sm sm:text-base font-normal leading-relaxed">
                  {t.instagram.desc}
                </p>
              </div>

              {/* Instagram Feed Grid */}
              <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-8">
                {instagramPosts.map((post) => (
                  <div
                    key={post.id}
                    onClick={() => setSelectedIgPost(post)}
                    className="bg-white border-2 border-brand-gold/30 hover:border-brand-gold rounded-2xl overflow-hidden shadow-md hover:shadow-2xl transition-all duration-300 group cursor-pointer flex flex-col justify-between"
                  >
                    <div className="relative aspect-square overflow-hidden bg-brand-cream-dark">
                      <img
                        src={post.image}
                        alt={post.title}
                        className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
                      />
                      <div className="absolute inset-0 bg-brand-maroon/40 opacity-0 group-hover:opacity-100 transition-opacity duration-300 flex items-center justify-center space-x-3 text-white">
                        <div className="w-12 h-12 bg-white/20 backdrop-blur-md rounded-full flex items-center justify-center">
                          <InstagramIcon className="w-6 h-6 text-white" />
                        </div>
                      </div>
                      <div className="absolute top-3 right-3 bg-black/60 backdrop-blur-sm text-white px-3 py-1 rounded-full text-[10px] font-semibold tracking-wide uppercase flex items-center space-x-1">
                        <Sparkles className="w-3 h-3 text-brand-gold" />
                        <span>IG Post</span>
                      </div>
                    </div>

                    <div className="p-6 space-y-3 flex-1 flex flex-col justify-between text-left">
                      <div className="space-y-2">
                        <h3 className="font-sans font-semibold text-base text-brand-maroon group-hover:text-brand-maroon-dark transition-colors line-clamp-1">
                          {post.headline}
                        </h3>
                        <p className="text-xs text-brand-charcoal/80 leading-relaxed line-clamp-2 font-normal">
                          {post.desc}
                        </p>
                      </div>

                      <div className="pt-3 border-t border-brand-maroon/10 flex items-center justify-between">
                        <span className="text-[11px] font-bold text-brand-gold-dark group-hover:text-brand-maroon transition-colors flex items-center space-x-1">
                          <span>Detail Post</span>
                          <ExternalLink className="w-3 h-3" />
                        </span>
                        <span className="text-[10px] font-semibold text-brand-maroon/70">@juragans.anakbawang</span>
                      </div>
                    </div>
                  </div>
                ))}
              </div>

              {/* Instagram Follow CTA */}
              <div className="mt-12 text-center">
                <a
                  href="https://www.instagram.com/juragans.anakbawang/"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-flex items-center space-x-3 px-8 py-3.5 bg-gradient-to-r from-purple-600 via-pink-600 to-amber-500 text-white rounded-full font-semibold text-sm shadow-lg hover:shadow-xl hover:scale-105 transition-all duration-300"
                >
                  <InstagramIcon className="w-5 h-5 text-white" />
                  <span>{t.instagram.ctaFollow}</span>
                </a>
              </div>
            </div>
          </section>

          {/* Usage / Cocok Untuk Apa Section */}
          <section className="py-24 bg-white px-4 sm:px-6 lg:px-8 font-sans reveal">
            <div className="max-w-7xl mx-auto">
              <div className="text-center max-w-3xl mx-auto mb-16 space-y-4">
                <span className="text-xs font-semibold uppercase tracking-[0.2em] text-brand-gold-dark block">
                  {t.usage.tag}
                </span>
                <h2 className="font-sans font-semibold tracking-tight text-3xl sm:text-4xl lg:text-5xl text-brand-maroon">
                  {t.usage.title}
                </h2>
                <div className="w-20 h-1 bg-brand-gold mx-auto rounded-full"></div>
              </div>

              <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-8">
                <div className="bg-brand-cream/35 border border-brand-gold/30 hover:border-brand-gold rounded-2xl p-8 shadow-sm premium-card-hover flex flex-col justify-between text-left group reveal">
                  <div className="space-y-4">
                    <div className="w-12 h-12 bg-brand-maroon/5 text-brand-maroon group-hover:bg-brand-maroon group-hover:text-white rounded-xl flex items-center justify-center transition-colors duration-300">
                      <Heart className="w-6 h-6" />
                    </div>
                    <h3 className="font-sans font-semibold text-lg text-brand-maroon">{t.usage.home.title}</h3>
                    <p className="text-sm text-brand-charcoal/80 leading-relaxed font-normal">{t.usage.home.desc}</p>
                  </div>
                </div>

                <div className="bg-brand-cream/35 border border-brand-gold/30 hover:border-brand-gold rounded-2xl p-8 shadow-sm premium-card-hover flex flex-col justify-between text-left group reveal delay-100">
                  <div className="space-y-4">
                    <div className="w-12 h-12 bg-brand-maroon/5 text-brand-maroon group-hover:bg-brand-maroon group-hover:text-white rounded-xl flex items-center justify-center transition-colors duration-300">
                      <Utensils className="w-6 h-6" />
                    </div>
                    <h3 className="font-sans font-semibold text-lg text-brand-maroon">{t.usage.horeca.title}</h3>
                    <p className="text-sm text-brand-charcoal/80 leading-relaxed font-normal">{t.usage.horeca.desc}</p>
                  </div>
                </div>

                <div className="bg-brand-cream/35 border border-brand-gold/30 hover:border-brand-gold rounded-2xl p-8 shadow-sm premium-card-hover flex flex-col justify-between text-left group reveal delay-200">
                  <div className="space-y-4">
                    <div className="w-12 h-12 bg-brand-maroon/5 text-brand-maroon group-hover:bg-brand-maroon group-hover:text-white rounded-xl flex items-center justify-center transition-colors duration-300">
                      <ShoppingBag className="w-6 h-6" />
                    </div>
                    <h3 className="font-sans font-semibold text-lg text-brand-maroon">{t.usage.reseller.title}</h3>
                    <p className="text-sm text-brand-charcoal/80 leading-relaxed font-normal">{t.usage.reseller.desc}</p>
                  </div>
                </div>

                <div className="bg-brand-cream/35 border border-brand-gold/30 hover:border-brand-gold rounded-2xl p-8 shadow-sm premium-card-hover flex flex-col justify-between text-left group reveal delay-300">
                  <div className="space-y-4">
                    <div className="w-12 h-12 bg-brand-maroon/5 text-brand-maroon group-hover:bg-brand-maroon group-hover:text-white rounded-xl flex items-center justify-center transition-colors duration-300">
                      <Globe className="w-6 h-6" />
                    </div>
                    <h3 className="font-sans font-semibold text-lg text-brand-maroon">{t.usage.wholesale.title}</h3>
                    <p className="text-sm text-brand-charcoal/80 leading-relaxed font-normal">{t.usage.wholesale.desc}</p>
                  </div>
                </div>
              </div>
            </div>
          </section>

          {/* Catalog Section */}
          <section
            id="katalog"
            className="py-20 bg-brand-cream px-4 sm:px-6 lg:px-8 scroll-mt-20 border-b border-brand-maroon/5 font-sans reveal"
          >
            <div className="max-w-4xl mx-auto bg-white border border-brand-gold rounded-3xl p-8 sm:p-12 shadow-xl relative overflow-hidden text-center space-y-6">
              <div className="absolute top-0 right-0 w-24 h-24 bg-brand-gold/10 rounded-bl-full flex items-center justify-center pointer-events-none">
                <Sparkles className="w-8 h-8 text-brand-gold/60" />
              </div>

              <div className="w-16 h-16 bg-brand-maroon/10 text-brand-maroon rounded-full flex items-center justify-center mx-auto">
                <Download className="w-8 h-8" />
              </div>

              <div className="space-y-2">
                <h2 className="font-sans font-semibold tracking-tight text-3xl text-brand-maroon">{t.catalog.title}</h2>
                <p className="text-brand-charcoal/80 text-sm sm:text-base max-w-lg mx-auto leading-relaxed font-normal">
                  {t.catalog.desc}
                </p>
              </div>

              <div className="pt-2">
                <button
                  id="cta-download-catalog"
                  onClick={() => setIsCatalogModalOpen(true)}
                  className="inline-flex items-center space-x-3 px-8 py-3.5 bg-brand-maroon hover:bg-brand-maroon-dark text-white rounded-full font-semibold text-base shadow-md shadow-brand-maroon/20 transition-all duration-300 premium-button-hover active:scale-[0.98] cursor-pointer"
                >
                  <Download className="w-5 h-5" />
                  <span>{t.catalog.cta}</span>
                </button>
                <p className="text-xs sm:text-sm text-brand-charcoal/80 mt-4 leading-relaxed font-normal">
                  {t.catalog.status}
                </p>
              </div>
            </div>
          </section>

          {/* About Us Section */}
          <section
            id="about"
            className="py-24 px-4 sm:px-6 lg:px-8 max-w-7xl mx-auto scroll-mt-20 font-sans reveal"
          >
            <div className="grid md:grid-cols-2 gap-12 items-center">
              <div className="space-y-6 text-left">
                <div className="space-y-2">
                  <span className="text-xs font-semibold uppercase tracking-[0.2em] text-brand-gold-dark block">
                    {t.about.tag}
                  </span>
                  <h2 className="font-sans font-semibold tracking-tight text-3xl sm:text-4xl lg:text-5xl text-brand-maroon">
                    {t.about.title}
                  </h2>
                  <div className="w-16 h-1 bg-brand-gold rounded-full"></div>
                </div>

                <div className="space-y-4 text-brand-charcoal/90 text-sm sm:text-base leading-relaxed font-normal">
                  <p>{t.about.desc1}</p>
                  <div className="p-5 bg-brand-maroon/5 border-l-4 border-brand-maroon rounded-r-2xl my-4">
                    <p className="font-sans font-medium italic text-brand-maroon-dark text-base">
                      {t.about.highlight}
                    </p>
                  </div>
                  <p>{t.about.desc2}</p>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4 relative">
                <div className="space-y-4">
                  <div className="bg-brand-maroon/5 rounded-2xl p-6 text-center border border-brand-maroon/10 reveal premium-card-hover">
                    <h4 className="font-sans font-semibold text-lg text-brand-maroon">{t.about.stat1}</h4>
                    <p className="text-[10px] sm:text-xs text-brand-charcoal/70 mt-1 font-normal">{t.about.stat1sub}</p>
                  </div>
                  <div className="bg-white rounded-2xl p-6 text-center shadow-md border border-brand-gold/30 reveal delay-100 premium-card-hover hover:border-brand-gold">
                    <Heart className="w-8 h-8 text-brand-maroon mx-auto mb-2" />
                    <h4 className="font-sans font-semibold text-lg text-brand-maroon">{t.about.stat2}</h4>
                    <p className="text-[10px] sm:text-xs text-brand-charcoal/60 mt-1 font-normal">{t.about.stat2sub}</p>
                  </div>
                </div>
                <div className="space-y-4 pt-8">
                  <div className="bg-white rounded-2xl p-6 text-center shadow-md border border-brand-gold/30 reveal delay-200 premium-card-hover hover:border-brand-gold">
                    <Check className="w-8 h-8 text-brand-gold mx-auto mb-2" />
                    <h4 className="font-sans font-semibold text-lg text-brand-maroon">{t.about.stat3}</h4>
                    <p className="text-[10px] sm:text-xs text-brand-charcoal/60 mt-1 font-normal">{t.about.stat3sub}</p>
                  </div>
                  <div className="bg-brand-maroon/90 text-white rounded-2xl p-6 text-center shadow-lg border border-brand-maroon-dark reveal delay-300 premium-card-hover hover:border-brand-gold">
                    <h4 className="font-sans font-semibold text-base text-brand-gold">{t.about.stat4}</h4>
                    <p className="text-[9px] sm:text-[10px] uppercase tracking-widest font-semibold opacity-80 mt-1">{t.about.stat4sub}</p>
                  </div>
                </div>
              </div>
            </div>
          </section>

          {/* Location Section */}
          <section
            id="lokasi"
            className="py-24 px-4 sm:px-6 lg:px-8 max-w-7xl mx-auto scroll-mt-20 border-t border-brand-maroon/5 font-sans reveal"
          >
            <div className="grid md:grid-cols-12 gap-12 items-stretch">
              <div className="md:col-span-7 rounded-2xl overflow-hidden shadow-lg border border-brand-gold/30 min-h-[350px]">
                <iframe
                  title="Lokasi Juragans by Anak Bawang"
                  src="https://www.google.com/maps/embed?pb=!1m18!1m12!1m3!1d3959.1388835017277!2d110.5106609!3d-7.5094033!2m3!1f0!2f0!3f0!3m2!1i1024!2i768!4f13.1!3m3!1m2!1s0x2e7a6585adb0c5ed%3A0xf9990b17294e3e46!2s%22ANAK%20BAWANG%22%20Brambang%20Goreng!5e0!3m2!1sid!2sid!4v1718375000000!5m2!1sid!2sid"
                  width="100%"
                  height="100%"
                  style={{ border: 0 }}
                  allowFullScreen=""
                  loading="lazy"
                  referrerPolicy="no-referrer-when-downgrade"
                  className="w-full h-full min-h-[350px]"
                ></iframe>
              </div>

              <div className="md:col-span-5 flex flex-col justify-between text-left space-y-6 bg-white p-8 rounded-2xl border border-brand-gold/30 shadow-md">
                <div className="space-y-4">
                  <div className="space-y-2">
                    <span className="text-xs font-semibold uppercase tracking-[0.2em] text-brand-gold-dark block">
                      {t.location.tag}
                    </span>
                    <h3 className="font-sans font-semibold tracking-tight text-3xl text-brand-maroon">{t.location.title}</h3>
                    <div className="w-16 h-1 bg-brand-gold rounded-full"></div>
                  </div>

                  <div className="space-y-3 font-normal">
                    <div className="flex items-start space-x-3 text-sm">
                      <MapPin className="w-5 h-5 text-brand-maroon shrink-0 mt-0.5" />
                      <p className="text-brand-charcoal/90 leading-relaxed">
                        RT.04/RW.01, Bendosari, Cepogo, Boyolali Regency, Central Java 57362
                      </p>
                    </div>

                    <div className="flex items-center space-x-3 text-sm">
                      <Clock className="w-5 h-5 text-brand-maroon shrink-0" />
                      <span className="inline-flex items-center px-2.5 py-0.5 bg-brand-maroon/10 text-brand-maroon text-xs font-semibold rounded-full">
                        {t.location.hours}
                      </span>
                    </div>
                  </div>
                </div>

                <div className="pt-4 flex flex-col sm:flex-row gap-3 font-semibold text-sm">
                  <a
                    id="cta-location-maps"
                    href={googleMapsUrl}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="inline-flex justify-center items-center space-x-2 px-5 py-3 bg-brand-maroon hover:bg-brand-maroon-dark text-white rounded-xl shadow-md transition-all duration-300 premium-button-hover active:scale-[0.98]"
                  >
                    <ExternalLink className="w-4 h-4" />
                    <span>{t.location.cta1}</span>
                  </a>
                  <a
                    id="cta-location-whatsapp"
                    href={getWaLink('location')}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="inline-flex justify-center items-center space-x-2 px-5 py-3 border border-brand-gold text-brand-maroon-dark hover:bg-brand-gold/10 rounded-xl transition-all duration-300 premium-button-hover active:scale-[0.98]"
                  >
                    <MessageCircle className="w-4 h-4 fill-brand-maroon-dark text-white" />
                    <span>{t.location.cta2}</span>
                  </a>
                </div>
              </div>
            </div>
          </section>

          {/* Contact CTA Section */}
          <section
            id="kontak"
            className="py-20 bg-brand-maroon text-white px-4 sm:px-6 lg:px-8 text-center font-sans reveal relative overflow-hidden"
          >
            <div className="absolute inset-0 bg-gradient-to-tr from-brand-maroon-dark to-brand-maroon opacity-90"></div>
            <div className="max-w-4xl mx-auto relative z-10 space-y-6">
              <h2 className="font-sans font-semibold tracking-tight text-3xl sm:text-4xl lg:text-5xl text-brand-gold">
                {t.contact.title}
              </h2>
              <p className="text-brand-cream/80 text-base sm:text-lg max-w-xl mx-auto leading-relaxed font-normal">
                {t.contact.desc}
              </p>
              <div className="pt-4">
                <a
                  id="cta-contact-whatsapp"
                  href={getWaLink('general')}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-flex justify-center items-center space-x-3 px-8 py-4 bg-brand-gold hover:bg-brand-gold-dark text-brand-maroon-dark rounded-full font-semibold text-base shadow-xl transition-all duration-300 premium-button-hover active:scale-[0.98]"
                >
                  <MessageCircle className="w-5 h-5 fill-brand-maroon-dark text-brand-gold" />
                  <span>{t.contact.cta}</span>
                </a>
              </div>
            </div>
          </section>
        </>
      )}

      {/* Modular Footer */}
      <Footer t={t} getWaLink={getWaLink} googleMapsUrl={googleMapsUrl} onOpenAdmin={() => setIsAdminLoginOpen(true)} />

      {/* Interactive Instagram Post Modal */}
      {selectedIgPost && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 font-sans">
          <div
            onClick={() => setSelectedIgPost(null)}
            className="absolute inset-0 bg-black/70 backdrop-blur-sm transition-opacity"
          ></div>

          <div className="bg-white border-2 border-brand-gold rounded-3xl overflow-hidden max-w-3xl w-full max-h-[90vh] overflow-y-auto md:overflow-visible relative z-10 shadow-2xl animate-scale-in text-left">
            <button
              onClick={() => setSelectedIgPost(null)}
              className="absolute top-3 right-3 text-brand-charcoal/70 bg-white/90 hover:bg-white hover:text-brand-maroon p-2 rounded-full transition-all shadow-md z-30 border border-brand-maroon/10"
              aria-label="Tutup dialog"
            >
              <X className="w-5 h-5" />
            </button>

            <div className="grid grid-cols-1 md:grid-cols-2 items-stretch min-w-0">
              <div className="w-full h-64 md:h-full aspect-square md:aspect-auto bg-brand-cream-dark relative overflow-hidden shrink-0">
                <img
                  src={selectedIgPost.image}
                  alt={selectedIgPost.title}
                  className="w-full h-full object-cover"
                />
              </div>

              <div className="p-6 sm:p-8 flex flex-col justify-between space-y-4 min-w-0 bg-white relative z-10">
                <div className="space-y-3">
                  <div className="flex items-center space-x-2 text-xs font-semibold text-brand-maroon pr-10">
                    <InstagramIcon className="w-4 h-4 text-pink-600 shrink-0" />
                    <span className="font-bold tracking-wide">@juragans.anakbawang</span>
                  </div>

                  <h3 className="font-sans font-semibold text-lg text-brand-maroon leading-snug">
                    {selectedIgPost.headline}
                  </h3>

                  <p className="text-xs text-brand-charcoal/80 leading-relaxed font-normal">
                    {selectedIgPost.desc}
                  </p>

                  <p className="text-[11px] text-brand-gold-dark font-medium leading-relaxed break-words">
                    {selectedIgPost.hashtags}
                  </p>
                </div>

                <div className="pt-4 border-t border-brand-maroon/10 flex flex-col gap-2.5 font-semibold text-xs">
                  <a
                    href={selectedIgPost.igUrl}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="w-full inline-flex justify-center items-center space-x-2 py-3 bg-gradient-to-r from-purple-600 via-pink-600 to-amber-500 text-white rounded-xl shadow-md hover:scale-[1.02] transition-all"
                  >
                    <InstagramIcon className="w-4 h-4" />
                    <span>{t.instagram.viewOnIg}</span>
                  </a>
                  <a
                    href={getWaLink('general', `Halo Juragans by Anak Bawang, saya berminat dengan varian produk di postingan Instagram ini: ${selectedIgPost.headline}`)}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="w-full inline-flex justify-center items-center space-x-2 py-2.5 border border-brand-gold text-brand-maroon-dark hover:bg-brand-gold/10 rounded-xl transition-all"
                  >
                    <MessageCircle className="w-4 h-4 fill-brand-maroon-dark text-white" />
                    <span>{t.instagram.orderWa}</span>
                  </a>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Catalog Modal */}
      {isCatalogModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 font-sans">
          <div
            onClick={() => setIsCatalogModalOpen(false)}
            className="absolute inset-0 bg-black/60 backdrop-blur-sm transition-opacity"
          ></div>

          <div className="bg-brand-cream border border-brand-gold rounded-3xl p-6 sm:p-8 max-w-md w-full relative z-10 shadow-2xl space-y-6 text-center animate-scale-in">
            <button
              onClick={() => setIsCatalogModalOpen(false)}
              className="absolute top-4 right-4 text-brand-maroon hover:bg-brand-maroon/5 p-1 rounded-full transition-colors"
              aria-label="Tutup dialog"
            >
              <X className="w-5 h-5" />
            </button>

            <div className="w-16 h-16 bg-brand-maroon/10 text-brand-maroon rounded-full flex items-center justify-center mx-auto">
              <MessageCircle className="w-8 h-8 fill-current" />
            </div>

            <div className="space-y-2">
              <h3 className="font-sans font-semibold tracking-tight text-2xl text-brand-maroon">{t.catalog.modalTitle}</h3>
              <p className="text-brand-charcoal/90 text-sm leading-relaxed font-normal">
                {t.catalog.modalDesc}
              </p>
            </div>

            <div className="pt-2 flex flex-col gap-3 font-semibold">
              <a
                id="cta-modal-whatsapp"
                href={getWaLink('catalog')}
                target="_blank"
                rel="noopener noreferrer"
                className="w-full inline-flex justify-center items-center space-x-2 py-3 bg-brand-maroon hover:bg-brand-maroon-dark text-white rounded-xl text-sm shadow-md premium-button-hover active:scale-[0.98]"
              >
                <MessageCircle className="w-4 h-4 fill-white text-brand-maroon" />
                <span>{t.catalog.modalCta}</span>
              </a>
              <button
                onClick={() => setIsCatalogModalOpen(false)}
                className="w-full py-3 border border-brand-gold text-brand-maroon-dark hover:bg-brand-gold/10 rounded-xl text-sm transition-all duration-200 premium-button-hover active:scale-[0.98]"
              >
                {t.catalog.modalBack}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Floating HORECA Sample Request CTA (Hidden on Admin Page) */}
      {!(path === '/admin' || isAdminLoggedIn) && (
        <div className="fixed bottom-24 sm:bottom-28 right-6 z-40 flex flex-col items-end space-y-2">
          <button
            onClick={() => setIsHorecaModalOpen(true)}
            className="bg-gradient-to-r from-brand-maroon to-brand-maroon-dark hover:from-brand-maroon-dark hover:to-brand-maroon text-white font-bold text-xs sm:text-sm px-5 py-3.5 rounded-full shadow-2xl border-2 border-brand-gold flex items-center space-x-2 transition-all hover:scale-105 active:scale-95 group"
          >
            <span className="w-2.5 h-2.5 rounded-full bg-brand-gold animate-ping"></span>
            <span>🎁 Sampel Gratis Restoran</span>
          </button>
        </div>
      )}

      {/* HORECA Sample Request Modal */}
      <HorecaSampleModal
        isOpen={isHorecaModalOpen}
        onClose={() => setIsHorecaModalOpen(false)}
      />

      {/* Admin Worker PIN Login Modal */}
      <AdminLoginModal
        isOpen={isAdminLoginOpen}
        onClose={() => setIsAdminLoginOpen(false)}
        onSuccess={() => setIsAdminLoggedIn(true)}
      />
    </div>
  )
}

export default App
