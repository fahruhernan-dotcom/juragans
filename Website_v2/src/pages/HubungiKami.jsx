import React, { useState } from 'react';
import { motion } from 'framer-motion';
import { 
  MessageCircle, Mail, Clock, MapPin, Send, 
  ChevronRight, Phone, MessageSquare, ShieldCheck
} from 'lucide-react';
import SEO from '../components/SEO';
import Navbar from '../components/Navbar';
import Footer from '../components/Footer';
import Particles from '../components/reactbits/Particles';
import ShinyText from '../components/reactbits/ShinyText';
import { WA_URL as WA_URL_FALLBACK, CONTACT_EMAIL as EMAIL_FALLBACK, BUSINESS_HOURS as HOURS_FALLBACK } from '@/lib/constants/contact';
import { useSiteConfig } from '@/lib/hooks/useSiteConfig';

// ─── Animation helper ─────────────────────────────────────────────────────────

function FadeUp({ children, delay = 0, className }) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true, margin: '-40px' }}
      transition={{ duration: 0.5, ease: 'easeOut', delay }}
      className={className}
    >
      {children}
    </motion.div>
  );
}

// ─── Page ─────────────────────────────────────────────────────────────────────

export default function HubungiKami() {
  const [form, setForm] = useState({ name: '', email: '', message: '' });
  const { data: cfg = {} } = useSiteConfig();

  const WA_URL = cfg.wa_url || WA_URL_FALLBACK;
  const CONTACT_EMAIL = cfg.contact_email || EMAIL_FALLBACK;
  const BUSINESS_HOURS = cfg.business_hours || HOURS_FALLBACK;

  const handleSubmit = (e) => {
    e.preventDefault();
    const waMsg = encodeURIComponent(
      `Halo TernakOS,\n\nNama: ${form.name}\nEmail: ${form.email}\n\nPesan: ${form.message}`
    );
    window.open(`${WA_URL}?text=${waMsg}`, '_blank');
  };

  return (
    <div className="min-h-screen bg-[#06090F] text-[#F1F5F9] font-sans selection:bg-emerald-500/30 overflow-x-hidden">
      <SEO
        title="Hubungi Kami - TernakOS | Konsultasi Peternakan Digital"
        description="Hubungi tim TernakOS via WhatsApp atau email. Kami siap membantu peternak, broker, dan agen sembako Indonesia dengan respons cepat kurang dari 30 menit."
        path="/hubungi-kami"
      />
      <Navbar />

      <main className="pt-20">
        {/* HERO SECTION */}
        <section className="relative py-24 px-6 overflow-hidden">
          <div className="absolute inset-0 pointer-events-none">
            <Particles
              quantity={30}
              color="#021a02"
              opacity={0.1}
              className="absolute inset-0"
            />
            <div className="absolute top-0 left-1/2 -translate-x-1/2 w-full h-full bg-[radial-gradient(circle_at_50%_0%,rgba(2, 26, 2,0.05)_0%,transparent_70%)]" />
          </div>

          <div className="max-w-4xl mx-auto text-center relative z-10">
            <FadeUp>
              <div className="inline-block px-4 py-1.5 rounded-full bg-[#021a02]/10 border border-[#021a02]/20 mb-6">
                <ShinyText
                  text="👋 Kami siap membantu Anda"
                  disabled={false}
                  speed={3}
                  className="text-[#021a02] text-xs font-bold leading-none"
                />
              </div>
              <h1 className="font-display text-4xl md:text-6xl font-black text-white leading-tight tracking-tight mb-6">
                Ada yang bisa kami <span className="text-emerald-500">bantu?</span>
              </h1>
              <p className="text-[#94A3B8] text-lg max-w-2xl mx-auto leading-relaxed">
                Punya pertanyaan tentang fitur, harga, atau ingin demo khusus untuk bisnis Anda? Tim kami siap menjawab setiap pertanyaan Anda.
              </p>
            </FadeUp>
          </div>
        </section>

        {/* CONTACT CARDS GRID */}
        <section className="pb-24 px-6">
          <div className="max-w-6xl mx-auto grid grid-cols-1 md:grid-cols-3 gap-6">
            
            {/* WhatsApp Card */}
            <FadeUp delay={0.1}>
              <a 
                href={WA_URL}
                target="_blank"
                rel="noopener noreferrer"
                className="group bg-[#0C1319] p-8 rounded-3xl border border-white/8 hover:border-emerald-500/30 transition-all duration-300 flex flex-col items-center text-center h-full"
              >
                <div className="w-14 h-14 rounded-2xl bg-emerald-500/10 flex items-center justify-center mb-6 group-hover:scale-110 transition-transform">
                  <MessageCircle size={28} className="text-emerald-400" />
                </div>
                <h3 className="text-xl font-bold text-white mb-2">WhatsApp Admin</h3>
                <p className="text-[#4B6478] text-sm mb-6">Respon cepat untuk pertanyaan teknis & aktivasi akun.</p>
                <div className="mt-auto flex items-center gap-2 text-emerald-400 font-bold text-sm">
                  Hubungi Sekarang <ChevronRight size={16} />
                </div>
              </a>
            </FadeUp>

            {/* Email Card */}
            <FadeUp delay={0.15}>
              <div className="bg-[#0C1319] p-8 rounded-3xl border border-white/8 flex flex-col items-center text-center h-full">
                <div className="w-14 h-14 rounded-2xl bg-blue-500/10 flex items-center justify-center mb-6">
                  <Mail size={28} className="text-blue-400" />
                </div>
                <h3 className="text-xl font-bold text-white mb-2">Email Support</h3>
                <p className="text-[#4B6478] text-sm mb-4">Untuk kerjasama resmi atau laporan kendala sistem.</p>
                <p className="text-[#F1F5F9] font-medium text-sm mt-auto">{CONTACT_EMAIL}</p>
              </div>
            </FadeUp>

            {/* Hours Card */}
            <FadeUp delay={0.2}>
              <div className="bg-[#0C1319] p-8 rounded-3xl border border-white/8 flex flex-col items-center text-center h-full">
                <div className="w-14 h-14 rounded-2xl bg-amber-500/10 flex items-center justify-center mb-6">
                  <Clock size={28} className="text-amber-400" />
                </div>
                <h3 className="text-xl font-bold text-white mb-2">Jam Operasional</h3>
                <p className="text-[#4B6478] text-sm mb-4">Tim kami standby untuk membantu Anda di jam berikut.</p>
                <p className="text-[#F1F5F9] font-medium text-sm mt-auto">{BUSINESS_HOURS}</p>
              </div>
            </FadeUp>

          </div>
        </section>

        {/* COMBINED FORM & INFO SECTION */}
        <section className="pb-32 px-6">
          <div className="max-w-6xl mx-auto bg-[#0C1319] rounded-[32px] border border-white/8 overflow-hidden">
            <div className="grid grid-cols-1 lg:grid-cols-2">
              
              {/* LEFT: Info & Branding */}
              <div className="p-10 md:p-16 lg:bg-white/2 flex flex-col">
                <div className="mb-12">
                  <h2 className="text-3xl font-black text-white mb-6">Eskalasi Bisnis<br/>Anda Dimulai<br/>di Sini.</h2>
                  <p className="text-[#94A3B8] leading-relaxed">
                    Jangan biarkan sistem manual menghambat pertumbuhan bisnis Anda. Konsultasikan kebutuhan automasi Anda sekarang.
                  </p>
                </div>

                <div className="space-y-6">
                  <div className="flex items-center gap-4">
                    <div className="w-10 h-10 rounded-xl bg-emerald-500/10 flex items-center justify-center shrink-0">
                      <ShieldCheck size={20} className="text-emerald-400" />
                    </div>
                    <div>
                      <h4 className="text-white font-bold text-sm">Privasi Terjamin</h4>
                      <p className="text-[#4B6478] text-xs mt-0.5">Data Anda aman bersama kami.</p>
                    </div>
                  </div>
                  <div className="flex items-center gap-4">
                    <div className="w-10 h-10 rounded-xl bg-purple-500/10 flex items-center justify-center shrink-0">
                      <MessageSquare size={20} className="text-purple-400" />
                    </div>
                    <div>
                      <h4 className="text-white font-bold text-sm">Fast Response</h4>
                      <p className="text-[#4B6478] text-xs mt-0.5">Rata-rata balas kurang dari 30 menit.</p>
                    </div>
                  </div>
                </div>

                <div className="mt-auto pt-16">
                   <div className="flex items-center gap-2 text-xs text-[#4B6478]">
                      <MapPin size={12} />
                      Surakarta, Jawa Tengah, Indonesia
                   </div>
                </div>
              </div>

              {/* RIGHT: Contact Form */}
              <div className="p-10 md:p-16 border-t lg:border-t-0 lg:border-l border-white/8">
                <form onSubmit={handleSubmit} className="space-y-6">
                  <div className="space-y-2">
                    <label className="text-[11px] font-bold uppercase tracking-widest text-[#4B6478] ml-1">Nama Lengkap</label>
                    <input 
                      required
                      type="text" 
                      placeholder="Masukkan nama Anda..."
                      value={form.name}
                      onChange={e => setForm({...form, name: e.target.value})}
                      className="w-full bg-white/4 border border-white/10 rounded-2xl px-5 py-4 text-white focus:outline-none focus:border-emerald-500/50 transition-colors"
                    />
                  </div>
                  <div className="space-y-2">
                    <label className="text-[11px] font-bold uppercase tracking-widest text-[#4B6478] ml-1">Email Aktif</label>
                    <input 
                      required
                      type="email" 
                      placeholder="email@perusahaan.com"
                      value={form.email}
                      onChange={e => setForm({...form, email: e.target.value})}
                      className="w-full bg-white/4 border border-white/10 rounded-2xl px-5 py-4 text-white focus:outline-none focus:border-emerald-500/50 transition-colors"
                    />
                  </div>
                  <div className="space-y-2">
                    <label className="text-[11px] font-bold uppercase tracking-widest text-[#4B6478] ml-1">Kebutuhan / Pesan</label>
                    <textarea 
                      required
                      rows={4}
                      placeholder="Ceritakan kendala atau kebutuhan sistem Anda..."
                      value={form.message}
                      onChange={e => setForm({...form, message: e.target.value})}
                      className="w-full bg-white/4 border border-white/10 rounded-2xl px-5 py-4 text-white focus:outline-none focus:border-emerald-500/50 transition-colors resize-none"
                    ></textarea>
                  </div>

                  <button 
                    type="submit"
                    className="w-full bg-emerald-500 hover:bg-emerald-600 text-white font-bold py-5 rounded-2xl transition-all shadow-lg shadow-emerald-500/20 flex items-center justify-center gap-3 group"
                  >
                    Kirim via WhatsApp
                    <Send size={18} className="group-hover:translate-x-1 group-hover:-translate-y-1 transition-transform" />
                  </button>
                  <p className="text-center text-[10px] text-[#4B6478]">
                    Tombol ini akan otomatis membuka aplikasi WhatsApp Anda.
                  </p>
                </form>
              </div>

            </div>
          </div>
        </section>

      </main>

      <Footer />
    </div>
  );
}
