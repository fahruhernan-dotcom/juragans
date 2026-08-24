import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { 
  MessageCircle, 
  Check, 
  Package, 
  ShieldCheck, 
  Flame, 
  Users,
  ArrowLeft
} from 'lucide-react';
import Navbar from '../components/Navbar';
import Footer from '../components/Footer';
import ImageWithFallback from '../components/ImageWithFallback';
import { translations } from '../data/translations';

const aboutTranslations = {
  id: {
    backToHome: "Kembali ke Beranda",
    hero: {
      tag: "Tentang Kami",
      title: "Dibuat dari Cepogo, Boyolali",
      desc: "JURAGANS by Anak Bawang (ERNA Brambang Goreng) menghadirkan brambang goreng premium yang renyah, gurih, dan aromatik untuk rumah tangga, restoran, katering, reseller, dan pelaku usaha kuliner.",
      ctaPrimary: "Konsultasi via WhatsApp",
      ctaSecondary: "Lihat Proses Produksi",
      badge: "Cepogo, Boyolali",
      imageAlt: "Rumah produksi JURAGANS by Anak Bawang di Cepogo Boyolali",
      imageFallback: "Foto rumah produksi akan ditambahkan"
    },
    story: {
      title: "Berawal dari Produk Lokal Boyolali",
      desc: "JURAGANS by Anak Bawang lahir dari pengalaman memproduksi bawang goreng untuk kebutuhan rumah tangga dan pelaku usaha kuliner. Kami menjaga kualitas bahan, proses pengolahan, dan pengemasan agar menghasilkan brambang goreng yang renyah, gurih, aromatik, dan siap digunakan untuk berbagai masakan."
    },
    gallery: {
      title: "Rumah Produksi & Proses Kami",
      desc: "Dokumentasi visual area kerja, proses pengolahan tradisional yang higienis, dan pengemasan produk kami.",
      items: {
        factoryFront: {
          title: "Tampak Depan Rumah Produksi",
          desc: "Fasilitas rumah produksi JURAGANS by Anak Bawang di Cepogo, Boyolali."
        },
        productionArea: {
          title: "Area Kerja Produksi",
          desc: "Tempat pembersihan, pengupasan, dan perajangan bawang merah lokal pilihan."
        },
        fryingProcess: {
          title: "Proses Penggorengan",
          desc: "Tahap penggorengan menggunakan minyak berkualitas secara presisi untuk hasil renyah keemasan."
        },
        sortingProcess: {
          title: "Proses Sortir Kualitas",
          desc: "Pemilahan kualitas bawang goreng setelah matang untuk menyaring hasil gorengan terbaik."
        },
        packingProcess: {
          title: "Proses Pengemasan",
          desc: "Pengemasan higienis yang kedap udara untuk menjaga kerenyahan dan aroma bawang tahan lama."
        },
        teamProduction: {
          title: "Tim Produksi Kami",
          desc: "Tenaga kerja lokal terampil yang berdedikasi menjaga kualitas warisan rasa."
        }
      },
      placeholderText: "Foto rumah produksi akan ditambahkan"
    },
    process: {
      title: "Proses yang Menjaga Kualitas",
      cards: [
        {
          title: "Bahan Dipilih",
          desc: "Menggunakan bawang merah pilihan untuk menjaga rasa dan aroma."
        },
        {
          title: "Diproses Higienis",
          desc: "Proses produksi dilakukan dengan memperhatikan kebersihan dan konsistensi."
        },
        {
          title: "Digoreng Hingga Keemasan",
          desc: "Dibuat untuk menghasilkan warna keemasan, aroma kuat, dan tekstur renyah."
        },
        {
          title: "Dikemas Rapi",
          desc: "Produk dikemas agar tetap praktis digunakan untuk rumah tangga maupun usaha kuliner."
        }
      ]
    },
    business: {
      title: "Siap untuk Kebutuhan Usaha Kuliner",
      desc: "Produk kami telah digunakan untuk kebutuhan dapur usaha kuliner seperti rumah makan, restoran, katering, reseller, dan pembelian partai usaha. Kami memahami pentingnya konsistensi rasa, aroma, dan kerenyahan untuk pemakaian harian."
    },
    cta: {
      title: "Diskusikan Kebutuhan Bawang Goreng Anda",
      desc: "Dapatkan penawaran harga kemitraan, grosir volume besar, atau diskon khusus reseller langsung dari rumah produksi kami.",
      button: "Konsultasi via WhatsApp"
    }
  },
  en: {
    backToHome: "Back to Homepage",
    hero: {
      tag: "About Us",
      title: "Crafted in Cepogo, Boyolali",
      desc: "JURAGANS by Anak Bawang (ERNA Brambang Goreng) produces premium Indonesian fried shallots that are crispy, savory, and aromatic for households, restaurants, catering, resellers, and food businesses.",
      ctaPrimary: "Inquire via WhatsApp",
      ctaSecondary: "View Production Process",
      badge: "Cepogo, Boyolali",
      imageAlt: "JURAGANS by Anak Bawang production house in Cepogo Boyolali",
      imageFallback: "Production house photo will be added"
    },
    story: {
      title: "Rooted in Local Food Production from Boyolali",
      desc: "JURAGANS by Anak Bawang is built from experience in producing fried shallots for home use and culinary businesses. We focus on ingredient quality, careful processing, and proper packaging to deliver crispy, aromatic, and ready-to-use fried shallots for various dishes."
    },
    gallery: {
      title: "Our Production House & Process",
      desc: "Visual documentation of our clean workspace, traditional frying process, and final packaging.",
      items: {
        factoryFront: {
          title: "Production House Front",
          desc: "JURAGANS by Anak Bawang production house building in Cepogo, Boyolali."
        },
        productionArea: {
          title: "Production Workspace Area",
          desc: "Dedicated area for cleaning, peeling, and slicing our handpicked local shallots."
        },
        fryingProcess: {
          title: "Frying Stage",
          desc: "Careful precision frying using high-grade cooking oil for golden crispness."
        },
        sortingProcess: {
          title: "Quality Sorting Stage",
          desc: "Post-frying inspection to select only premium-grade golden flakes."
        },
        packingProcess: {
          title: "Packaging Stage",
          desc: "Airtight sealing to locks in crispiness and preserve natural shallot aroma."
        },
        teamProduction: {
          title: "Production Team",
          desc: "Skilled local workers dedicated to preserving our quality heritage recipe."
        }
      },
      placeholderText: "Production house photo will be added"
    },
    process: {
      title: "Process That Guarantees Quality",
      cards: [
        {
          title: "Selected Ingredients",
          desc: "Using selected shallots to maintain taste and aroma."
        },
        {
          title: "Hygienic Processing",
          desc: "Prepared with attention to cleanliness and consistency."
        },
        {
          title: "Fried Until Golden",
          desc: "Made to deliver golden color, rich aroma, and crispy texture."
        },
        {
          title: "Properly Packed",
          desc: "Packed for practical use by households and food businesses."
        }
      ]
    },
    business: {
      title: "Ready for Food Business Needs",
      desc: "Our products are suitable for food business kitchens such as restaurants, catering, resellers, and small wholesale buyers. We understand the importance of consistent taste, aroma, and crispiness for daily use."
    },
    cta: {
      title: "Discuss Your Fried Shallots Needs",
      desc: "Get partnership quotes, high-volume contract wholesale prices, or reseller discount structures directly from our production house.",
      button: "Inquire via WhatsApp"
    }
  }
};

export default function AboutUs() {
  const [lang, setLang] = useState(() => {
    const saved = localStorage.getItem('anak-bawang-lang');
    return saved === 'en' || saved === 'id' ? saved : 'id';
  });

  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const [scrolled, setScrolled] = useState(false);

  useEffect(() => {
    localStorage.setItem('anak-bawang-lang', lang);
    document.title = lang === 'id'
      ? 'Tentang Juragans by Anak Bawang | Rumah Produksi Brambang Goreng Premium'
      : 'About Juragans by Anak Bawang | Premium Fried Shallots Production House';
  }, [lang]);

  useEffect(() => {
    const handleScroll = () => {
      setScrolled(window.scrollY > 20);
    };
    window.addEventListener('scroll', handleScroll);
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  const t = aboutTranslations[lang];
  const tNav = translations[lang];

  const whatsappNumber = '6282133731213';
  const getWaLink = (key, customText) => {
    if (customText) {
      return `https://wa.me/${whatsappNumber}?text=${encodeURIComponent(customText)}`;
    }
    const waMessage = lang === 'id'
      ? "Halo Admin Juragans, saya berminat mengetahui informasi produksi & pemesanan Bawang Goreng Premium Juragans dari Cepogo Boyolali."
      : "Hello Juragans Admin, I would like to inquire about production & ordering details for Juragans Boyolali Premium Fried Shallots.";
    return `https://wa.me/${whatsappNumber}?text=${encodeURIComponent(waMessage)}`;
  };

  const googleMapsUrl = 'https://www.google.com/maps/place/%22ANAK+BAWANG%22+Brambang+Goreng/@-7.518885,110.553934,16z/data=!4m6!3m5!1s0x2e7a6585adb0c5ed:0xf9990b17294e3e46!8m2!3d-7.5094086!4d110.5132358!16s%2Fg%2F11cltjphjt?hl=id&entry=ttu&g_ep=EgoyMDI2MDYxMC4wIKXMDSoASAFQAw%3D%3D';

  // Scroll reveal animation observer
  useEffect(() => {
    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting) {
            entry.target.classList.add('reveal-visible');
            observer.unobserve(entry.target);
          }
        });
      },
      { threshold: 0.05, rootMargin: '0px 0px -40px 0px' }
    );

    const elements = document.querySelectorAll('.reveal');
    elements.forEach((el) => observer.observe(el));
    return () => elements.forEach((el) => observer.unobserve(el));
  }, [lang]);

  const icons = [
    <Check className="w-6 h-6" key="0" />,
    <ShieldCheck className="w-6 h-6" key="1" />,
    <Flame className="w-6 h-6" key="2" />,
    <Package className="w-6 h-6" key="3" />
  ];

  return (
    <div className="bg-brand-cream text-brand-charcoal min-h-screen font-sans">
      <Navbar
        t={tNav}
        lang={lang}
        setLang={setLang}
        scrolled={scrolled}
        isMenuOpen={isMenuOpen}
        setIsMenuOpen={setIsMenuOpen}
        scrollToSection={() => {}}
        getWaLink={getWaLink}
      />

      <div className="pt-32 pb-16">
        {/* Back Link */}
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 mb-6">
          <Link
            to="/"
            className="inline-flex items-center space-x-2 text-xs font-bold text-brand-maroon hover:text-brand-maroon-dark uppercase tracking-wider transition-colors"
          >
            <ArrowLeft className="w-4 h-4" />
            <span>{t.backToHome}</span>
          </Link>
        </div>

        {/* Hero Section */}
        <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 mb-16 pt-2 reveal">
          <div className="grid md:grid-cols-2 gap-12 items-center">
            <div className="space-y-6 text-left">
              <span className="text-xs font-semibold uppercase tracking-[0.2em] text-brand-gold-dark block font-sans">
                {t.hero.tag}
              </span>
              <h1 className="font-sans font-bold tracking-tight text-3xl sm:text-4xl lg:text-5xl text-brand-maroon max-w-[520px]">
                {t.hero.title}
              </h1>
              <p className="text-brand-charcoal/80 text-sm sm:text-base leading-relaxed font-normal max-w-[620px] font-sans">
                {t.hero.desc}
              </p>
              
              <div className="flex flex-wrap gap-4 pt-2">
                <a 
                  id="hero-about-whatsapp"
                  href={getWaLink('hero')}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-flex justify-center items-center space-x-2 px-6 py-3.5 bg-brand-gold hover:bg-brand-gold-dark text-brand-maroon-dark rounded-full font-semibold text-sm sm:text-base shadow-md hover:shadow-lg transition-all duration-300 premium-button-hover active:scale-[0.98] cursor-pointer"
                >
                  <MessageCircle className="w-5 h-5 fill-current" />
                  <span>{t.hero.ctaPrimary}</span>
                </a>
                <button 
                  onClick={(e) => {
                    e.preventDefault();
                    document.getElementById('proses-produksi')?.scrollIntoView({ behavior: 'smooth' });
                  }}
                  className="inline-flex justify-center items-center px-6 py-3.5 border border-brand-maroon/20 hover:border-brand-maroon text-brand-maroon hover:bg-brand-maroon/5 rounded-full font-semibold text-sm sm:text-base transition-all duration-300 active:scale-[0.98] cursor-pointer"
                >
                  <span>{t.hero.ctaSecondary}</span>
                </button>
              </div>
            </div>

            <div className="relative aspect-[4/3] w-full rounded-3xl overflow-hidden shadow-lg border border-brand-gold/45 bg-white flex items-stretch animate-float-slow">
              <ImageWithFallback 
                src="/images/hero-fried-shallots.jpg" 
                alt={t.hero.imageAlt}
                className="w-full h-full object-cover"
                fallbackText={t.hero.imageFallback}
                badgeText="JURAGANS"
                loading="eager"
              />
              <div className="absolute top-4 left-4 bg-brand-gold text-brand-maroon-dark text-[10px] sm:text-xs font-bold px-3 py-1.5 rounded-full shadow-md tracking-wider uppercase">
                {t.hero.badge}
              </div>
            </div>
          </div>
        </section>

        {/* Story & Grid Section */}
        <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 mb-24 reveal">
          <div className="grid md:grid-cols-2 gap-12 items-center">
            <div className="space-y-6 text-left">
              <h2 className="font-sans font-semibold tracking-tight text-2xl sm:text-3xl text-brand-maroon">
                {t.story.title}
              </h2>
              <div className="w-16 h-1 bg-brand-gold rounded-full"></div>
              <p className="text-brand-charcoal/90 text-sm sm:text-base leading-relaxed font-normal">
                {t.story.desc}
              </p>
            </div>
            
            <div className="bg-brand-maroon/5 border-l-4 border-brand-maroon rounded-r-2xl p-6 md:p-8 space-y-4">
              <h3 className="font-sans font-semibold text-lg text-brand-maroon-dark">Boyolali Premium Fried Shallots</h3>
              <p className="text-xs sm:text-sm text-brand-charcoal/80 leading-relaxed font-normal">
                Cepogo, Boyolali is situated on the volcanic slopes of Mount Merbabu. This highland agricultural zone produces high-grade red shallots that are crispier, have lower moisture profiles, and hold deep aromatic tones ideal for long-shelf fried shallots.
              </p>
            </div>
          </div>
        </section>

        {/* Process Section */}
        <section id="proses-produksi" className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 mb-24 scroll-mt-28 reveal">
          <div className="text-center space-y-12">
            <div className="max-w-3xl mx-auto space-y-4">
              <h2 className="font-sans font-semibold tracking-tight text-3xl text-brand-maroon">
                {t.process.title}
              </h2>
              <div className="w-20 h-1 bg-brand-gold mx-auto rounded-full"></div>
            </div>

            <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-8 text-left">
              {t.process.cards.map((card, idx) => (
                <div 
                  key={idx} 
                  className="bg-white border border-brand-gold/20 p-6 rounded-2xl shadow-sm space-y-4 reveal premium-card-hover"
                  style={{ transitionDelay: `${idx * 100}ms` }}
                >
                  <div className="w-12 h-12 bg-brand-maroon/10 text-brand-maroon rounded-xl flex items-center justify-center">
                    {icons[idx]}
                  </div>
                  <h3 className="font-sans font-semibold text-lg text-brand-maroon">{card.title}</h3>
                  <p className="text-xs sm:text-sm text-brand-charcoal/80 leading-relaxed font-normal">{card.desc}</p>
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* Trust & Business Supply Section */}
        <section className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 mb-24 reveal">
          <div className="bg-white border border-brand-gold rounded-3xl p-8 sm:p-12 shadow-md text-center space-y-6 premium-card-hover">
            <div className="w-12 h-12 bg-brand-maroon/10 text-brand-maroon rounded-full flex items-center justify-center mx-auto">
              <Users className="w-6 h-6" />
            </div>
            <h2 className="font-sans font-semibold tracking-tight text-2xl sm:text-3xl text-brand-maroon">
              {t.business.title}
            </h2>
            <div className="w-16 h-0.5 bg-brand-gold mx-auto rounded-full"></div>
            <p className="text-brand-charcoal/80 text-sm sm:text-base leading-relaxed font-normal max-w-2xl mx-auto">
              {t.business.desc}
            </p>
          </div>
        </section>

        {/* CTA Section */}
        <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 reveal">
          <div className="bg-gradient-to-br from-brand-maroon to-brand-maroon-dark text-white rounded-3xl p-8 sm:p-12 text-center shadow-xl space-y-6 relative overflow-hidden">
            <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[600px] h-[600px] bg-white/5 rounded-full pointer-events-none"></div>

            <div className="space-y-2 relative z-10">
              <h2 className="font-sans font-semibold tracking-tight text-3xl text-brand-gold">{t.cta.title}</h2>
              <p className="text-brand-cream/80 text-sm max-w-lg mx-auto leading-relaxed font-normal">
                {t.cta.desc}
              </p>
            </div>

            <div className="pt-2 relative z-10">
              <a 
                id="cta-about-whatsapp"
                href={getWaLink('general')}
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex justify-center items-center space-x-3 px-8 py-4 bg-brand-gold hover:bg-brand-gold-dark text-brand-maroon-dark rounded-full font-semibold text-base shadow-lg transition-all duration-300 premium-button-hover active:scale-[0.98] cursor-pointer"
              >
                <MessageCircle className="w-5 h-5 fill-current" />
                <span>{t.cta.button}</span>
              </a>
            </div>
          </div>
        </section>
      </div>

      <Footer t={tNav} getWaLink={getWaLink} googleMapsUrl={googleMapsUrl} />
    </div>
  );
}
