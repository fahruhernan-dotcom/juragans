import React from 'react';
import { motion } from 'framer-motion';
import {
  Shield, Lock, Server, Eye, CheckCircle, FileText,
  Key, Database, Globe, AlertCircle, ArrowRight
} from 'lucide-react';
import { Link } from 'react-router-dom';
import SEO from '../components/SEO';
import Navbar from '../components/Navbar';
import Footer from '../components/Footer';
import AnimatedContent from '../components/reactbits/AnimatedContent';
import ShinyText from '../components/reactbits/ShinyText';
import BlurText from '../components/reactbits/BlurText';
import Particles from '../components/reactbits/Particles';

function FadeUp({ children, delay = 0, className }) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 24 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true, margin: '-80px' }}
      transition={{ duration: 0.5, ease: 'easeOut', delay }}
      className={className}
    >
      {children}
    </motion.div>
  );
}

const PILLARS = [
  {
    Icon: Lock,
    color: 'emerald',
    title: 'Enkripsi End-to-End',
    body: 'Semua data transaksi dienkripsi menggunakan AES-256, standar yang sama digunakan perbankan internasional. Data Anda tidak pernah disimpan dalam bentuk plain text.',
  },
  {
    Icon: Database,
    color: 'blue',
    title: 'Row-Level Security',
    body: 'Setiap baris data terlindungi oleh RLS Supabase. Tenant A tidak pernah bisa membaca data Tenant B, bahkan di level query database.',
  },
  {
    Icon: Server,
    color: 'purple',
    title: 'Infrastruktur Tier-1',
    body: 'TernakOS berjalan di atas infrastruktur Supabase (PostgreSQL managed) dengan SLA 99.9% uptime, backup otomatis harian, dan failover region.',
  },
  {
    Icon: Eye,
    color: 'amber',
    title: 'Audit Trail Penuh',
    body: 'Setiap perubahan data penting direkam dengan timestamp, user ID, dan IP. Anda bisa melihat siapa yang mengubah apa dan kapan.',
  },
  {
    Icon: Key,
    color: 'rose',
    title: 'Autentikasi Berlapis',
    body: 'Login dilindungi JWT + refresh token rotation. Session expired otomatis setelah tidak aktif. Dukungan 2FA segera hadir.',
  },
  {
    Icon: Globe,
    color: 'teal',
    title: 'Tidak Ada Third-Party Tracking',
    body: 'Data Anda tidak dijual, tidak dibagi, tidak digunakan untuk iklan. TernakOS berdiri sendiri, tidak ada investor yang mendikte kebijakan data kami.',
  },
];

const COMPLIANCE = [
  { label: 'UU No. 27/2022 Perlindungan Data Pribadi', status: 'compliant' },
  { label: 'OWASP Top 10 Security Practices', status: 'compliant' },
  { label: 'ISO 27001 Alignment (Roadmap)', status: 'planned' },
  { label: 'Enkripsi TLS 1.3 untuk semua koneksi', status: 'compliant' },
  { label: 'Zero-Log Policy untuk data sensitif', status: 'compliant' },
];

export default function SecurityPage() {
  return (
    <div className="min-h-screen bg-[#06090F] text-[#F1F5F9] font-sans selection:bg-emerald-500/30 overflow-x-hidden">
      <SEO
        title="Keamanan Data - TernakOS | Perlindungan Bisnis Peternakanmu"
        description="TernakOS menggunakan enkripsi kelas bank, Row-Level Security, dan infrastruktur tier-1 untuk melindungi data transaksi dan harga pasar bisnismu."
        path="/keamanan"
      />
      <Navbar />

      <main className="w-full">

        {/* ═══ HERO ═══════════════════════════════════════════════════════ */}
        <section className="relative px-5 md:px-10 lg:px-20 pt-32 pb-20 overflow-hidden">
          <div className="absolute inset-0 pointer-events-none">
            <Particles quantity={30} color="#021a02" opacity={0.06} className="absolute inset-0" />
            <div className="absolute -top-[10%] right-[10%] w-[500px] h-[500px] rounded-full bg-emerald-500/5 blur-[120px]" />
          </div>

          <div className="relative z-10 max-w-[1280px] mx-auto text-center">
            <AnimatedContent direction="vertical" distance={20}>
              <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-emerald-500/10 border border-emerald-500/20 mb-6">
                <Shield size={14} className="text-emerald-400" />
                <ShinyText text="KEAMANAN ENTERPRISE-GRADE" speed={4} className="text-emerald-400 text-xs font-bold" />
              </div>
            </AnimatedContent>

            <BlurText
              text="Data bisnismu, terlindungi sepenuhnya."
              delay={80}
              animateBy="words"
              direction="top"
              className="font-display text-4xl md:text-6xl font-black text-white leading-tight tracking-tight mb-6 max-w-3xl mx-auto"
            />

            <AnimatedContent direction="vertical" distance={20} delay={0.2}>
              <p className="text-[#94A3B8] text-lg max-w-2xl mx-auto leading-relaxed mb-10">
                Kami membangun TernakOS dengan prinsip <em className="text-white not-italic font-semibold">security by design</em>. 
                Setiap fitur dirancang agar data transaksi dan harga pasarmu tidak pernah bocor atau disalahgunakan.
              </p>
            </AnimatedContent>

            <AnimatedContent direction="vertical" distance={20} delay={0.3}>
              <div className="flex flex-wrap items-center justify-center gap-6">
                <div className="flex items-center gap-2 text-sm text-[#94A3B8]">
                  <CheckCircle size={16} className="text-emerald-400" />
                  Enkripsi AES-256
                </div>
                <div className="flex items-center gap-2 text-sm text-[#94A3B8]">
                  <CheckCircle size={16} className="text-emerald-400" />
                  Row-Level Security
                </div>
                <div className="flex items-center gap-2 text-sm text-[#94A3B8]">
                  <CheckCircle size={16} className="text-emerald-400" />
                  Backup Harian Otomatis
                </div>
                <div className="flex items-center gap-2 text-sm text-[#94A3B8]">
                  <CheckCircle size={16} className="text-emerald-400" />
                  Zero Third-Party Data Sharing
                </div>
              </div>
            </AnimatedContent>
          </div>
        </section>

        {/* ═══ PILAR KEAMANAN ══════════════════════════════════════════════ */}
        <section className="py-24 bg-[#080D13]">
          <div className="max-w-6xl mx-auto px-6">
            <FadeUp className="text-center mb-16">
              <p className="text-[11px] font-bold uppercase tracking-widest text-emerald-400 mb-4">
                LAPISAN PERLINDUNGAN
              </p>
              <h2 className="font-display text-4xl font-bold text-white leading-tight">
                6 lapis keamanan untuk datamu.
              </h2>
            </FadeUp>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {PILLARS.map(({ Icon, color, title, body }, i) => (
                <FadeUp key={i} delay={i * 0.08}>
                  <div className={`bg-[#0C1319] rounded-2xl p-7 border border-white/8 hover:border-${color}-500/20 transition-all duration-300 h-full flex flex-col`}>
                    <div className={`w-11 h-11 rounded-xl bg-${color}-500/10 flex items-center justify-center mb-5`}>
                      <Icon size={22} className={`text-${color}-400`} />
                    </div>
                    <h3 className="font-display text-lg font-bold text-white mb-3">{title}</h3>
                    <p className="text-[#94A3B8] text-sm leading-relaxed">{body}</p>
                  </div>
                </FadeUp>
              ))}
            </div>
          </div>
        </section>

        {/* ═══ COMPLIANCE ══════════════════════════════════════════════════ */}
        <section className="py-24 bg-[#06090F]">
          <div className="max-w-3xl mx-auto px-6">
            <FadeUp className="text-center mb-12">
              <p className="text-[11px] font-bold uppercase tracking-widest text-emerald-400 mb-4">KEPATUHAN</p>
              <h2 className="font-display text-3xl font-bold text-white">Standar yang kami ikuti.</h2>
            </FadeUp>

            <div className="space-y-3">
              {COMPLIANCE.map((item, i) => (
                <FadeUp key={i} delay={i * 0.07}>
                  <div className="flex items-center justify-between p-4 rounded-xl bg-[#0C1319] border border-white/8">
                    <div className="flex items-center gap-3">
                      {item.status === 'compliant' ? (
                        <CheckCircle size={16} className="text-emerald-400 shrink-0" />
                      ) : (
                        <AlertCircle size={16} className="text-amber-400 shrink-0" />
                      )}
                      <span className="text-[#F1F5F9] text-sm font-medium">{item.label}</span>
                    </div>
                    <span className={`text-[10px] font-bold uppercase tracking-widest px-3 py-1 rounded-full ${
                      item.status === 'compliant'
                        ? 'bg-emerald-500/10 text-emerald-400'
                        : 'bg-amber-500/10 text-amber-400'
                    }`}>
                      {item.status === 'compliant' ? 'Aktif' : 'Roadmap'}
                    </span>
                  </div>
                </FadeUp>
              ))}
            </div>
          </div>
        </section>

        {/* ═══ TRANSPARANSI ════════════════════════════════════════════════ */}
        <section className="py-24 bg-[#080D13]">
          <div className="max-w-4xl mx-auto px-6">
            <FadeUp>
              <div className="bg-[#0C1319] rounded-3xl p-10 md:p-14 border border-white/8">
                <div className="flex items-start gap-5 mb-8">
                  <div className="w-12 h-12 rounded-2xl bg-emerald-500/10 flex items-center justify-center shrink-0">
                    <FileText size={24} className="text-emerald-400" />
                  </div>
                  <div>
                    <p className="text-[11px] font-bold uppercase tracking-widest text-emerald-400 mb-2">KEBIJAKAN KAMI</p>
                    <h3 className="font-display text-2xl font-bold text-white">Transparansi penuh soal data Anda.</h3>
                  </div>
                </div>
                <div className="grid md:grid-cols-2 gap-5">
                  {[
                    'Data transaksi Anda tidak pernah dibagikan ke pihak ketiga',
                    'Harga pasar yang muncul 100% berasal dari transaksi nyata user, bukan estimasi',
                    'Anda bisa meminta penghapusan data kapan saja, dengan respons dalam 72 jam',
                    'Tidak ada iklan, tidak ada profiling, tidak ada data mining untuk kepentingan komersial',
                    'Admin Anda bisa melihat log aktivitas seluruh anggota tim secara real-time',
                    'Backup data tersedia, ekspor ke Excel/CSV bisa dilakukan kapan saja dari dashboard',
                  ].map((item, i) => (
                    <div key={i} className="flex items-start gap-3">
                      <CheckCircle size={15} className="text-emerald-400 shrink-0 mt-0.5" />
                      <span className="text-[#94A3B8] text-sm leading-relaxed">{item}</span>
                    </div>
                  ))}
                </div>
              </div>
            </FadeUp>
          </div>
        </section>

        {/* ═══ CTA ════════════════════════════════════════════════════════ */}
        <section className="py-24 bg-[#06090F]">
          <div className="max-w-3xl mx-auto px-6 text-center">
            <FadeUp>
              <div className="relative rounded-3xl p-12 border border-emerald-500/20 overflow-hidden">
                <div className="absolute inset-0 bg-gradient-to-br from-emerald-500/8 via-emerald-500/3 to-transparent rounded-3xl" />
                <div className="absolute -top-16 left-1/2 -translate-x-1/2 w-64 h-32 bg-emerald-500/8 blur-3xl" />
                <div className="relative z-10">
                  <Shield size={40} className="text-emerald-400 mx-auto mb-6 opacity-80" />
                  <h2 className="font-display text-3xl font-bold text-white mb-4">
                    Siap mencoba dengan tenang?
                  </h2>
                  <p className="text-[#94A3B8] mb-8 max-w-md mx-auto">
                    Daftar gratis dan rasakan sendiri platform yang dirancang untuk keamanan data bisnismu.
                  </p>
                  <div className="flex flex-wrap justify-center gap-4">
                    <Link
                      to="/register"
                      className="inline-flex items-center gap-2 px-7 py-3.5 bg-emerald-500 hover:bg-emerald-600 text-white font-bold rounded-xl transition-all shadow-[0_4px_20px_rgba(2, 26, 2,0.3)]"
                    >
                      Mulai Gratis
                      <ArrowRight size={16} />
                    </Link>
                    <a
                      href="/#kontak"
                      className="px-7 py-3.5 border border-white/20 hover:border-white/40 text-white font-bold rounded-xl transition-colors"
                    >
                      Hubungi Tim
                    </a>
                  </div>
                </div>
              </div>
            </FadeUp>
          </div>
        </section>

      </main>

      <Footer />
    </div>
  );
}
