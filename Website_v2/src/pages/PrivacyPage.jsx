import React from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import {
  ChevronLeft,
  Shield,
  Lock,
  FileText,
  Users,
  Scale,
  MessageCircle,
  AlertTriangle,
  ArrowLeft,
  Home,
  Globe,
  Clock,
  Eye,
  Database,
  Key
} from 'lucide-react';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import SEO from '../components/SEO';

export default function PrivacyPage() {
  const navigate = useNavigate();

  return (
    <div className="min-h-screen bg-[#06090F] text-[#F1F5F9] font-sans selection:bg-emerald-500/30">
      <SEO
        title="Kebijakan Privasi TernakOS | Perlindungan Data & Privasi Pengguna"
        description="Kebijakan privasi TernakOS sesuai UU PDP No. 27/2022. Informasi lengkap tentang pengumpulan, penggunaan, dan perlindungan data bisnis peternakan Anda."
        path="/privacy"
        type="article"
      />
      {/* Navbar Area */}
      <header className="border-b border-white/5 bg-[#0C1319]/50 backdrop-blur-xl sticky top-0 z-50">
        <div className="max-w-5xl mx-auto px-6 h-20 flex items-center justify-between">
          <Link to="/" className="flex items-center gap-2.5 group">
            <div className="w-9 h-9 rounded-xl bg-emerald-500/10 flex items-center justify-center p-1.5 border border-emerald-500/20 shadow-lg shadow-emerald-500/10 group-hover:border-emerald-500/40 transition-all">
              <img src="/logo.png" alt="TernakOS" className="w-full h-full object-contain" />
            </div>
            <span className="font-['Sora'] font-black text-xl text-white tracking-tight leading-none">
              Ternak<span className="text-emerald-500">OS</span>
            </span>
          </Link>
          <button
            onClick={() => navigate(-1)}
            className="flex items-center gap-2 text-sm font-semibold text-[#94A3B8] hover:text-emerald-400 transition-colors"
          >
            <ChevronLeft size={16} />
            Kembali
          </button>
        </div>
      </header>

      {/* Hero Section */}
      <section className="py-16 md:py-20 border-b border-white/5 relative overflow-hidden">
        <div className="absolute inset-0 bg-gradient-to-b from-emerald-500/5 to-transparent pointer-events-none" />
        <div className="max-w-5xl mx-auto px-6 relative z-10 text-center">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5 }}
          >
            <h1 className="font-display text-4xl md:text-5xl font-black mb-6 tracking-tight leading-none text-white">
              Kebijakan <span className="text-emerald-500">Privasi</span>
            </h1>
            <p className="text-[#4B6478] text-lg max-w-2xl mx-auto leading-relaxed">
              Privasi Anda adalah prioritas kami. Kami berkomitmen melindungi data bisnis Anda sesuai Undang-Undang Perlindungan Data Pribadi Republik Indonesia (UU No. 27 Tahun 2022).
            </p>
            <p className="text-[#4B6478] text-sm mt-4 font-medium uppercase tracking-widest">
              Terakhir Diperbarui: 3 April 2026 • Versi 2.0
            </p>
          </motion.div>
        </div>
      </section>

      {/* Content Area */}
      <main className="py-12 md:py-20 max-w-5xl mx-auto px-6">
        <Tabs defaultValue="umum" className="w-full">
          <div className="flex justify-center mb-12">
            <TabsList className="bg-[#0C1319] border border-white/10 p-1 rounded-2xl h-auto flex flex-wrap justify-center gap-1">
              <TabsTrigger
                value="umum"
                className="px-8 py-3 rounded-xl data-[state=active]:bg-[#021a02] data-[state=active]:text-white text-[#94A3B8] font-bold text-sm transition-all"
              >
                UMUM
              </TabsTrigger>
              <TabsTrigger
                value="broker"
                className="px-8 py-3 rounded-xl data-[state=active]:bg-[#021a02] data-[state=active]:text-white text-[#94A3B8] font-bold text-sm transition-all"
              >
                BROKER
              </TabsTrigger>
              <TabsTrigger
                value="peternak"
                className="px-8 py-3 rounded-xl data-[state=active]:bg-[#021a02] data-[state=active]:text-white text-[#94A3B8] font-bold text-sm transition-all"
              >
                PETERNAK
              </TabsTrigger>
              <TabsTrigger
                value="rpa"
                className="px-8 py-3 rounded-xl data-[state=active]:bg-[#021a02] data-[state=active]:text-white text-[#94A3B8] font-bold text-sm transition-all"
              >
                RPA
              </TabsTrigger>
            </TabsList>
          </div>

          <div className="bg-[#0C1319] border border-white/8 rounded-3xl p-8 md:p-12 shadow-2xl">

            {/* ─── TAB UMUM ─── */}
            <TabsContent value="umum" className="mt-0 focus-visible:outline-none">
              <div className="space-y-12 animate-in fade-in slide-in-from-bottom-4 duration-500">

                {/* 01 - Identitas Pengendali Data */}
                <PolicySection number="01" title="Identitas Pengendali Data Pribadi" icon={<Shield className="text-emerald-500" size={24} />}>
                  <p className="text-[#94A3B8] leading-relaxed">
                    Pengendali data pribadi dalam kebijakan ini adalah <strong className="text-white">TernakOS Indonesia</strong>, platform SaaS untuk manajemen bisnis peternakan yang beroperasi di wilayah Republik Indonesia.
                  </p>
                  <div className="mt-4 p-4 rounded-xl bg-white/[0.03] border border-white/5 text-sm text-[#94A3B8] space-y-1">
                    <p><strong className="text-white">Nama Platform:</strong> TernakOS</p>
                    <p><strong className="text-white">Kontak:</strong> <a href="mailto:support@ternakos.id" className="text-emerald-400 hover:underline">support@ternakos.id</a></p>
                    <p><strong className="text-white">Ruang Lingkup:</strong> Kebijakan ini berlaku bagi seluruh Pengguna platform TernakOS, termasuk Broker Ayam, Broker Telur, Peternak, dan RPA.</p>
                  </div>
                </PolicySection>

                {/* 02 - Data yang Dikumpulkan */}
                <PolicySection number="02" title="Data yang Kami Kumpulkan" icon={<FileText className="text-emerald-500" size={24} />}>
                  <p className="text-[#94A3B8] leading-relaxed mb-4">Kami mengumpulkan data berikut dalam rangka menyediakan layanan:</p>
                  <ul className="space-y-5">
                    <DataItem title="Informasi Akun & Identitas">
                      Nama lengkap, alamat email, dan nomor telepon yang Anda berikan saat mendaftar. Jika Anda mendaftar menggunakan Google Sign-In, kami menerima nama, alamat email, dan foto profil dari akun Google Anda.
                    </DataItem>
                    <DataItem title="Data Autentikasi Google (OAuth 2.0)">
                      Saat Anda memilih masuk dengan Google, kami menerima dari Google LLC: nama tampilan, alamat email, ID pengguna Google (untuk identifikasi unik), dan URL foto profil. <strong className="text-white">Kami tidak menerima kata sandi Google Anda, tidak mengakses Gmail, Drive, Kalender, Kontak, atau layanan Google lainnya.</strong> Cakupan OAuth yang kami minta terbatas pada <code className="text-emerald-400 text-xs bg-emerald-500/10 px-1.5 py-0.5 rounded">openid email profile</code> saja.
                    </DataItem>
                    <DataItem title="Data Bisnis Operasional">
                      Data yang Anda masukkan secara aktif ke dalam platform sesuai peran bisnis Anda: transaksi jual-beli, data inventaris, data kandang, data rekanan (broker/peternak/RPA), data pengiriman dan armada.
                    </DataItem>
                    <DataItem title="Data Teknis & Penggunaan">
                      Alamat IP, jenis perangkat dan browser, log aktivitas aplikasi (halaman yang dikunjungi, waktu sesi), dan data error untuk keperluan keamanan, debugging, dan peningkatan performa platform.
                    </DataItem>
                    <DataItem title="Data Pembayaran">
                      Informasi pembayaran berlangganan: nominal, tanggal, metode (transfer bank), dan bukti transfer yang Anda unggah. <strong className="text-white">Kami tidak menyimpan data kartu kredit atau rekening bank Anda secara langsung.</strong>
                    </DataItem>
                  </ul>
                </PolicySection>

                {/* 03 - Google Sign-In */}
                <PolicySection number="03" title="Autentikasi Google Sign-In" icon={<Key className="text-emerald-500" size={24} />}>
                  <p className="text-[#94A3B8] leading-relaxed mb-4">
                    TernakOS mengintegrasikan Google Sign-In sebagai metode masuk opsional menggunakan protokol OAuth 2.0 standar industri. Berikut penjelasan lengkap bagaimana kami menangani data dari Google:
                  </p>
                  <div className="grid md:grid-cols-2 gap-4 mb-6">
                    <div className="p-5 rounded-2xl bg-white/[0.02] border border-white/5">
                      <h4 className="text-white font-bold mb-2 text-sm">Data yang KAMI TERIMA</h4>
                      <ul className="text-[#94A3B8] text-sm space-y-1.5">
                        <li className="flex items-center gap-2"><span className="text-emerald-500">✓</span> Nama lengkap</li>
                        <li className="flex items-center gap-2"><span className="text-emerald-500">✓</span> Alamat email Google</li>
                        <li className="flex items-center gap-2"><span className="text-emerald-500">✓</span> ID pengguna Google</li>
                        <li className="flex items-center gap-2"><span className="text-emerald-500">✓</span> URL foto profil</li>
                      </ul>
                    </div>
                    <div className="p-5 rounded-2xl bg-white/[0.02] border border-white/5">
                      <h4 className="text-white font-bold mb-2 text-sm">Data yang TIDAK KAMI AKSES</h4>
                      <ul className="text-[#94A3B8] text-sm space-y-1.5">
                        <li className="flex items-center gap-2"><span className="text-red-400">✗</span> Kata sandi Google</li>
                        <li className="flex items-center gap-2"><span className="text-red-400">✗</span> Gmail / email Anda</li>
                        <li className="flex items-center gap-2"><span className="text-red-400">✗</span> Google Drive / Docs</li>
                        <li className="flex items-center gap-2"><span className="text-red-400">✗</span> Kontak / Kalender</li>
                      </ul>
                    </div>
                  </div>
                  <ul className="space-y-3">
                    <PrivBullet><strong className="text-white">Tujuan penggunaan:</strong> Data Google digunakan semata-mata untuk membuat dan mengidentifikasi akun TernakOS Anda. Tidak digunakan untuk iklan, profiling, atau dibagikan ke pihak ketiga.</PrivBullet>
                    <PrivBullet><strong className="text-white">Pencabutan akses:</strong> Anda dapat mencabut izin TernakOS kapan saja di <span className="text-emerald-400 font-mono text-sm">myaccount.google.com/permissions</span>. Setelah dicabut, Anda masih bisa masuk menggunakan email dan kata sandi TernakOS jika sudah diatur sebelumnya.</PrivBullet>
                    <PrivBullet><strong className="text-white">Tidak ada transfer data Google ke pihak ketiga</strong> manapun untuk tujuan apapun.</PrivBullet>
                  </ul>
                </PolicySection>

                {/* 04 - Dasar Hukum Pemrosesan */}
                <PolicySection number="04" title="Dasar Hukum Pemrosesan Data" icon={<Scale className="text-emerald-500" size={24} />}>
                  <p className="text-[#94A3B8] leading-relaxed mb-4">
                    Berdasarkan UU No. 27 Tahun 2022 tentang Pelindungan Data Pribadi, kami memproses data Anda berdasarkan dasar hukum berikut:
                  </p>
                  <ul className="space-y-4">
                    <PrivBullet><strong className="text-white">Persetujuan (Pasal 20 UU PDP):</strong> Saat Anda mendaftar dan menyetujui kebijakan ini, Anda memberikan persetujuan yang sah, eksplisit, dan dapat dicabut untuk pemrosesan data pribadi Anda.</PrivBullet>
                    <PrivBullet><strong className="text-white">Pelaksanaan Perjanjian:</strong> Pemrosesan data diperlukan untuk memenuhi kewajiban kontraktual kami dalam menyediakan layanan TernakOS yang Anda minta.</PrivBullet>
                    <PrivBullet><strong className="text-white">Kepentingan Sah:</strong> Pemrosesan data teknis (log, IP) untuk tujuan keamanan sistem dan pencegahan penipuan berdasarkan kepentingan sah yang sah.</PrivBullet>
                    <PrivBullet><strong className="text-white">Kewajiban Hukum:</strong> Dalam kasus tertentu, kami mungkin diwajibkan oleh hukum untuk memproses atau menyimpan data tertentu (misalnya untuk keperluan perpajakan).</PrivBullet>
                  </ul>
                </PolicySection>

                {/* 05 - Penggunaan Data */}
                <PolicySection number="05" title="Bagaimana Kami Menggunakan Data Anda" icon={<Shield className="text-emerald-500" size={24} />}>
                  <p className="text-[#94A3B8] leading-relaxed mb-4">Kami menggunakan data Anda hanya untuk tujuan-tujuan berikut:</p>
                  <ul className="space-y-2 mb-6">
                    <PrivBullet>Autentikasi pengguna dan keamanan akses akun.</PrivBullet>
                    <PrivBullet>Penyediaan fitur platform: laporan keuangan, margin, cash flow, dan analitik.</PrivBullet>
                    <PrivBullet>Pengiriman notifikasi transaksi penting dan pembaruan sistem.</PrivBullet>
                    <PrivBullet>Pemrosesan pembayaran berlangganan dan verifikasi bukti transfer.</PrivBullet>
                    <PrivBullet>Peningkatan performa dan fitur platform berdasarkan pola penggunaan anonim.</PrivBullet>
                    <PrivBullet>Respons terhadap pertanyaan dan permintaan dukungan Pengguna.</PrivBullet>
                    <PrivBullet>Kepatuhan terhadap kewajiban hukum yang berlaku.</PrivBullet>
                  </ul>
                  <div className="p-4 rounded-xl bg-emerald-500/5 border border-emerald-500/10">
                    <p className="text-emerald-400 font-bold text-sm">
                      KOMITMEN KAMI: Kami TIDAK menjual, menyewakan, atau menukar data bisnis atau data pribadi Anda kepada pihak ketiga manapun untuk tujuan iklan, data mining, atau keperluan komersial lainnya.
                    </p>
                  </div>
                </PolicySection>

                {/* 06 - Keamanan Data */}
                <PolicySection number="06" title="Keamanan Data" icon={<Lock className="text-emerald-500" size={24} />}>
                  <div className="grid md:grid-cols-2 gap-6 mb-6">
                    <div className="p-6 rounded-2xl bg-white/[0.02] border border-white/5">
                      <h4 className="text-white font-bold mb-3 flex items-center gap-2">
                        <Shield size={18} className="text-emerald-500" /> Enkripsi & Infrastruktur
                      </h4>
                      <p className="text-[#94A3B8] text-sm leading-relaxed">
                        Data disimpan di infrastruktur Supabase yang dihosting di AWS/GCP dengan enkripsi SSL/TLS saat transit dan <em>Encrypted at Rest</em> menggunakan AES-256.
                      </p>
                    </div>
                    <div className="p-6 rounded-2xl bg-white/[0.02] border border-white/5">
                      <h4 className="text-white font-bold mb-3 flex items-center gap-2">
                        <Lock size={18} className="text-emerald-500" /> Row Level Security (RLS)
                      </h4>
                      <p className="text-[#94A3B8] text-sm leading-relaxed">
                        Kebijakan RLS di level database memastikan data Bisnis A tidak dapat diakses oleh Bisnis B, meskipun berada di infrastruktur yang sama.
                      </p>
                    </div>
                    <div className="p-6 rounded-2xl bg-white/[0.02] border border-white/5">
                      <h4 className="text-white font-bold mb-3 flex items-center gap-2">
                        <Database size={18} className="text-emerald-500" /> Backup Otomatis
                      </h4>
                      <p className="text-[#94A3B8] text-sm leading-relaxed">
                        Backup data dilakukan secara otomatis setiap hari untuk menjamin ketersediaan dan pemulihan data apabila terjadi insiden.
                      </p>
                    </div>
                    <div className="p-6 rounded-2xl bg-white/[0.02] border border-white/5">
                      <h4 className="text-white font-bold mb-3 flex items-center gap-2">
                        <Eye size={18} className="text-emerald-500" /> Akses Terbatas
                      </h4>
                      <p className="text-[#94A3B8] text-sm leading-relaxed">
                        Akses ke data produksi oleh tim internal TernakOS dibatasi secara ketat dengan prinsip <em>least privilege</em> dan audit log.
                      </p>
                    </div>
                  </div>
                  <p className="text-[#94A3B8] text-sm">
                    Meskipun kami menerapkan langkah keamanan terbaik, tidak ada sistem yang 100% aman. Jika Anda mencurigai adanya pelanggaran keamanan pada akun Anda, segera hubungi <a href="mailto:support@ternakos.id" className="text-emerald-400 hover:underline">support@ternakos.id</a>.
                  </p>
                </PolicySection>

                {/* 07 - Cookies */}
                <PolicySection number="07" title="Cookies & Teknologi Pelacakan" icon={<Globe className="text-emerald-500" size={24} />}>
                  <p className="text-[#94A3B8] leading-relaxed mb-4">
                    TernakOS menggunakan cookies dan teknologi penyimpanan lokal yang diperlukan untuk fungsi dasar platform:
                  </p>
                  <div className="space-y-4">
                    <div className="p-4 rounded-xl bg-white/[0.02] border border-white/5">
                      <p className="text-white font-bold text-sm mb-1">Cookies Esensial (Wajib)</p>
                      <p className="text-[#94A3B8] text-sm">Token sesi autentikasi (disimpan di <em>localStorage</em> / cookie terenkripsi) yang diperlukan agar Anda tetap masuk ke platform. Tanpa ini, platform tidak dapat berfungsi.</p>
                    </div>
                    <div className="p-4 rounded-xl bg-white/[0.02] border border-white/5">
                      <p className="text-white font-bold text-sm mb-1">Cookies Fungsional</p>
                      <p className="text-[#94A3B8] text-sm">Preferensi tampilan dan pengaturan platform yang Anda simpan (misalnya tema, bahasa, tampilan tabel). Membantu pengalaman yang lebih personal.</p>
                    </div>
                    <div className="p-4 rounded-xl bg-white/[0.02] border border-white/5">
                      <p className="text-white font-bold text-sm mb-1">Tidak Ada Cookies Iklan / Pelacakan Pihak Ketiga</p>
                      <p className="text-[#94A3B8] text-sm">TernakOS tidak menggunakan cookies dari jaringan iklan, platform media sosial, atau alat analitik pihak ketiga yang bersifat invasif. Kami tidak melacak aktivitas Anda di luar platform TernakOS.</p>
                    </div>
                  </div>
                </PolicySection>

                {/* 08 - Transfer Data Internasional */}
                <PolicySection number="08" title="Transfer Data Internasional" icon={<Globe className="text-emerald-500" size={24} />}>
                  <p className="text-[#94A3B8] leading-relaxed">
                    Platform TernakOS menggunakan infrastruktur <strong className="text-white">Supabase</strong>, yang menyimpan data di server Amazon Web Services (AWS) dan/atau Google Cloud Platform (GCP) yang berlokasi di luar Indonesia (umumnya di Asia Tenggara atau Amerika Serikat). Ini berarti data Anda dapat diproses dan disimpan di luar wilayah Republik Indonesia.
                  </p>
                  <p className="text-[#94A3B8] leading-relaxed mt-4">
                    Kami memastikan transfer data internasional ini dilakukan dengan perlindungan yang memadai, termasuk:
                  </p>
                  <ul className="mt-3 space-y-2">
                    <PrivBullet>Supabase menerapkan standar keamanan SOC 2 Type II dan enkripsi tingkat enterprise.</PrivBullet>
                    <PrivBullet>Data tidak dibagikan ke pihak lain selain yang diperlukan untuk operasional infrastruktur.</PrivBullet>
                    <PrivBullet>Kontrak pemrosesan data (<em>Data Processing Agreement</em>) dengan Supabase menjamin kepatuhan terhadap standar privasi internasional.</PrivBullet>
                  </ul>
                  <p className="text-[#94A3B8] leading-relaxed mt-4">
                    Dengan menggunakan layanan TernakOS, Anda menyetujui transfer data ke luar Indonesia sesuai ketentuan ini.
                  </p>
                </PolicySection>

                {/* 09 - Layanan Pihak Ketiga */}
                <PolicySection number="09" title="Layanan Pihak Ketiga yang Kami Gunakan" icon={<Database className="text-emerald-500" size={24} />}>
                  <p className="text-[#94A3B8] leading-relaxed mb-4">TernakOS menggunakan layanan pihak ketiga terpercaya berikut untuk mengoperasikan platform:</p>
                  <div className="space-y-3">
                    <ThirdPartyItem name="Supabase" purpose="Database, autentikasi, dan penyimpanan file. Data pengguna dan bisnis disimpan di infrastruktur Supabase." />
                    <ThirdPartyItem name="Google LLC (OAuth)" purpose="Layanan autentikasi opsional (Google Sign-In). Kami hanya menerima data profil dasar seperti yang dijelaskan di Bagian 03." />
                    <ThirdPartyItem name="Vercel / VPS Provider" purpose="Hosting aplikasi web TernakOS." />
                  </div>
                  <p className="text-[#94A3B8] text-sm mt-4">
                    Setiap layanan pihak ketiga tunduk pada kebijakan privasi mereka sendiri. TernakOS tidak bertanggung jawab atas praktik privasi pihak ketiga tersebut, namun kami memilih mitra yang memiliki standar keamanan tinggi.
                  </p>
                </PolicySection>

                {/* 10 - Hak Pengguna */}
                <PolicySection number="10" title="Hak-Hak Anda sebagai Subjek Data" icon={<Users className="text-emerald-500" size={24} />}>
                  <p className="text-[#94A3B8] mb-4">Sesuai UU No. 27 Tahun 2022 tentang Pelindungan Data Pribadi, Anda memiliki hak-hak berikut atas data pribadi Anda:</p>
                  <div className="grid md:grid-cols-2 gap-4">
                    {[
                      { hak: 'Hak Akses', desc: 'Meminta konfirmasi apakah data Anda diproses dan mendapatkan salinan data yang kami simpan.' },
                      { hak: 'Hak Koreksi', desc: 'Meminta koreksi atas data yang tidak akurat atau tidak lengkap.' },
                      { hak: 'Hak Hapus', desc: 'Meminta penghapusan data pribadi Anda (right to erasure), dengan pengecualian kewajiban hukum tertentu.' },
                      { hak: 'Hak Portabilitas', desc: 'Meminta ekspor data Anda dalam format yang dapat dibaca mesin (CSV/JSON).' },
                      { hak: 'Hak Keberatan', desc: 'Keberatan atas pemrosesan data untuk tujuan tertentu, termasuk penarikan persetujuan.' },
                      { hak: 'Hak Pembatasan', desc: 'Meminta pembatasan pemrosesan data dalam situasi tertentu.' },
                    ].map(item => (
                      <div key={item.hak} className="p-4 rounded-xl bg-white/[0.03] border border-white/5">
                        <p className="text-emerald-400 font-bold text-sm mb-1">{item.hak}</p>
                        <p className="text-[#94A3B8] text-sm">{item.desc}</p>
                      </div>
                    ))}
                  </div>
                  <p className="text-[#94A3B8] text-sm mt-6">
                    Untuk menggunakan hak-hak di atas, kirimkan permintaan tertulis ke <a href="mailto:support@ternakos.id" className="text-emerald-400 hover:underline">support@ternakos.id</a>. Kami akan merespons dalam 14 hari kerja. Beberapa permintaan mungkin memerlukan verifikasi identitas Anda.
                  </p>
                </PolicySection>

                {/* 11 - Retensi Data */}
                <PolicySection number="11" title="Retensi & Penghapusan Data" icon={<Clock className="text-emerald-500" size={24} />}>
                  <p className="text-[#94A3B8] leading-relaxed mb-4">Kami menyimpan data Anda selama diperlukan untuk tujuan yang telah dinyatakan, dengan ketentuan berikut:</p>
                  <div className="space-y-3">
                    <RetentionItem label="Data Akun Aktif" period="Selama akun aktif">
                      Data profil dan autentikasi disimpan selama Anda memiliki akun aktif di TernakOS.
                    </RetentionItem>
                    <RetentionItem label="Pasca Penonaktifan Akun" period="90 hari tenggang">
                      Setelah akun dinonaktifkan atau langganan berakhir, data disimpan selama 90 hari masa tenggang sebelum dihapus permanen, kecuali Anda meminta penghapusan lebih awal.
                    </RetentionItem>
                    <RetentionItem label="Data Transaksi & Keuangan" period="Minimal 5 tahun">
                      Data transaksi bisnis disimpan minimal 5 tahun setelah akun aktif terakhir untuk kepatuhan perpajakan dan audit, sebagaimana diwajibkan hukum Indonesia.
                    </RetentionItem>
                    <RetentionItem label="Data Agregat Anonim" period="Tidak terbatas">
                      Data yang telah dianonimkan sepenuhnya (tidak dapat mengidentifikasi individu atau bisnis) dapat disimpan tanpa batas waktu untuk keperluan pengembangan layanan.
                    </RetentionItem>
                    <RetentionItem label="Data Recycle Bin" period="30 hari">
                      Data yang dihapus Pengguna ke Recycle Bin dalam platform akan dihapus permanen setelah 30 hari.
                    </RetentionItem>
                  </div>
                </PolicySection>

                {/* 12 - Perubahan Kebijakan */}
                <PolicySection number="12" title="Perubahan Kebijakan Privasi" icon={<Scale className="text-emerald-500" size={24} />}>
                  <p className="text-[#94A3B8] leading-relaxed">
                    Kami dapat memperbarui Kebijakan Privasi ini sesuai perkembangan hukum, teknologi, atau praktik bisnis kami. Untuk perubahan yang material, kami akan memberikan pemberitahuan melalui email ke alamat terdaftar minimal <strong className="text-white">7 hari kalender</strong> sebelum perubahan berlaku, serta melalui notifikasi dalam platform. Tanggal pembaruan terakhir selalu dicantumkan di bagian atas dokumen ini.
                  </p>
                  <p className="text-[#94A3B8] leading-relaxed mt-4">
                    Penggunaan layanan yang berlanjut setelah tanggal efektif perubahan merupakan persetujuan Anda terhadap versi terbaru Kebijakan Privasi. Versi lama dapat Anda minta melalui email ke tim kami.
                  </p>
                </PolicySection>

                {/* 13 - Hubungi */}
                <PolicySection number="13" title="Hubungi Kami" icon={<MessageCircle className="text-emerald-500" size={24} />}>
                  <div className="flex flex-col md:flex-row items-center justify-between p-6 rounded-2xl bg-emerald-500/5 border border-emerald-500/10 gap-6 text-center md:text-left">
                    <div>
                      <h4 className="text-emerald-500 font-bold mb-1">Pertanyaan seputar privasi data Anda?</h4>
                      <p className="text-[#94A3B8] text-sm">Kirimkan permintaan akses, koreksi, atau penghapusan data melalui email kami.</p>
                      <p className="text-[#94A3B8] text-sm mt-1">Respons dalam <strong className="text-white">14 hari kerja</strong>.</p>
                    </div>
                    <a href="mailto:support@ternakos.id" className="px-6 py-3 bg-[#021a02] hover:bg-[#021a02] text-white font-bold rounded-xl transition-all shadow-lg shadow-emerald-500/20 whitespace-nowrap">
                      support@ternakos.id
                    </a>
                  </div>
                </PolicySection>

              </div>
            </TabsContent>

            {/* ─── TAB BROKER ─── */}
            <TabsContent value="broker" className="mt-0 focus-visible:outline-none">
              <div className="space-y-12 animate-in fade-in slide-in-from-bottom-4 duration-500">

                <PolicySection number="01" title="Data Bisnis yang Kami Kumpulkan (Broker)">
                  <ul className="space-y-4">
                    <li className="flex items-start gap-4">
                      <div className="w-1.5 h-1.5 rounded-full bg-emerald-500 mt-2 shrink-0" />
                      <div>
                        <strong className="text-[#F1F5F9]">Transaksi Beli & Jual:</strong>
                        <p className="text-[#94A3B8] text-sm mt-0.5">Detail transaksi termasuk volume (kg/ekor), harga per unit, tanggal, dan pihak rekanan (peternak/RPA).</p>
                      </div>
                    </li>
                    <li className="flex items-start gap-4">
                      <div className="w-1.5 h-1.5 rounded-full bg-emerald-500 mt-2 shrink-0" />
                      <div>
                        <strong className="text-[#F1F5F9]">Data Operasional Biaya:</strong>
                        <p className="text-[#94A3B8] text-sm mt-0.5">Biaya operasional, retur, dan pengeluaran lainnya yang diinput untuk perhitungan profit.</p>
                      </div>
                    </li>
                    <li className="flex items-start gap-4">
                      <div className="w-1.5 h-1.5 rounded-full bg-emerald-500 mt-2 shrink-0" />
                      <div>
                        <strong className="text-[#F1F5F9]">Data Kandang Rekanan:</strong>
                        <p className="text-[#94A3B8] text-sm mt-0.5">Nama dan lokasi kandang peternak yang terhubung, riwayat transaksi bersama, dan skor performa.</p>
                      </div>
                    </li>
                    <li className="flex items-start gap-4">
                      <div className="w-1.5 h-1.5 rounded-full bg-emerald-500 mt-2 shrink-0" />
                      <div>
                        <strong className="text-[#F1F5F9]">Data Pengiriman & Armada:</strong>
                        <p className="text-[#94A3B8] text-sm mt-0.5">Kendaraan, pengemudi, rute pengiriman, dan status delivery.</p>
                      </div>
                    </li>
                    <li className="flex items-start gap-4">
                      <div className="w-1.5 h-1.5 rounded-full bg-emerald-500 mt-2 shrink-0" />
                      <div>
                        <strong className="text-[#F1F5F9]">Piutang RPA:</strong>
                        <p className="text-[#94A3B8] text-sm mt-0.5">Data saldo piutang, tanggal jatuh tempo, dan riwayat pembayaran dari RPA.</p>
                      </div>
                    </li>
                  </ul>
                </PolicySection>

                <div className="p-8 rounded-3xl bg-emerald-500/10 border-2 border-emerald-500/30 relative overflow-hidden group hover:border-emerald-500/50 transition-all">
                  <div className="absolute top-0 right-0 p-4 opacity-20 transform translate-x-4 -translate-y-4 group-hover:translate-x-2 group-hover:-translate-y-2 transition-transform">
                    <AlertTriangle size={80} className="text-emerald-500" />
                  </div>
                  <div className="relative z-10">
                    <div className="inline-flex items-center gap-2 px-3 py-1 bg-emerald-500/20 text-emerald-400 text-[10px] font-black uppercase tracking-widest rounded-full mb-4">
                      PERSETUJUAN KHUSUS
                    </div>
                    <h3 className="text-white text-2xl font-black mb-4 tracking-tight">
                      Kontribusi Data Harga Pasar
                    </h3>
                    <p className="text-emerald-100/80 mb-6 leading-relaxed">
                      Dengan menggunakan TernakOS sebagai Broker, Anda menyetujui hal-hal berikut mengenai kontribusi data harga pasar:
                    </p>
                    <ul className="space-y-4 text-emerald-100/90 font-medium">
                      <li className="flex items-start gap-3">
                        <div className="w-5 h-5 rounded-full bg-emerald-500/20 flex items-center justify-center text-emerald-400 mt-0.5 shrink-0">✓</div>
                        <span>Data harga transaksi (harga beli & jual per kg/ekor) akan dikontribusikan secara <strong className="text-white">ANONIM</strong> ke sistem Referensi Harga Pasar TernakOS.</span>
                      </li>
                      <li className="flex items-start gap-3">
                        <div className="w-5 h-5 rounded-full bg-emerald-500/20 flex items-center justify-center text-emerald-400 mt-0.5 shrink-0">✓</div>
                        <span>Data yang dibagikan ke sistem referensi hanya mencakup: harga per satuan, wilayah umum (kota/kabupaten), dan tanggal transaksi.</span>
                      </li>
                      <li className="flex items-start gap-3">
                        <div className="w-5 h-5 rounded-full bg-emerald-500/20 flex items-center justify-center text-emerald-400 mt-0.5 shrink-0">✓</div>
                        <strong className="text-white">TIDAK ADA</strong> nama bisnis, nama kandang, nama rekanan, total nilai transaksi, atau informasi identifikasi lainnya yang dibagikan.
                      </li>
                      <li className="flex items-start gap-3">
                        <div className="w-5 h-5 rounded-full bg-emerald-500/20 flex items-center justify-center text-emerald-400 mt-0.5 shrink-0">✓</div>
                        <span>Tujuan program ini adalah membangun referensi harga yang transparan dan akurat untuk ekosistem peternakan Indonesia.</span>
                      </li>
                    </ul>
                    <p className="mt-6 text-emerald-200/60 text-sm italic">
                      Persetujuan ini dapat dicabut dengan menghubungi support@ternakos.id. Data historis yang sudah berkontribusi dalam bentuk agregat anonim tidak dapat ditarik kembali karena sudah tidak dapat dikaitkan kembali ke identitas Anda.
                    </p>
                  </div>
                </div>

                <PolicySection number="03" title="Penggunaan Data Broker">
                  <p className="text-[#94A3B8] leading-relaxed">
                    Data bisnis Broker digunakan semata-mata untuk:
                  </p>
                  <ul className="mt-3 space-y-2">
                    <PrivBullet>Kalkulasi profit, margin, dan cash flow otomatis per periode.</PrivBullet>
                    <PrivBullet>Pelacakan dan notifikasi piutang RPA yang mendekati atau melewati jatuh tempo.</PrivBullet>
                    <PrivBullet>Analisis performa per kandang mitra untuk keputusan pembelian yang lebih baik.</PrivBullet>
                    <PrivBullet>Manajemen armada pengiriman dan monitoring status delivery.</PrivBullet>
                    <PrivBullet>Kontribusi data harga anonim ke sistem referensi pasar (sesuai persetujuan di atas).</PrivBullet>
                  </ul>
                </PolicySection>

                <PolicySection number="04" title="Retensi Data Broker">
                  <p className="text-[#94A3B8] leading-relaxed">
                    Data transaksi Broker disimpan minimal selama akun aktif ditambah <strong className="text-white">5 tahun</strong> setelah akun tidak aktif, untuk memenuhi kewajiban pelaporan pajak dan kebutuhan audit akuntansi bisnis Anda. Data di Recycle Bin akan dihapus otomatis setelah <strong className="text-white">30 hari</strong>.
                  </p>
                </PolicySection>

                <PolicySection number="05" title="Hubungi Kami">
                  <div className="p-6 rounded-2xl bg-emerald-500/5 border border-emerald-500/10 flex flex-col md:flex-row items-center justify-between gap-4">
                    <p className="text-[#94A3B8] text-sm">Pertanyaan tentang data bisnis Anda sebagai Broker?</p>
                    <a href="mailto:support@ternakos.id" className="px-6 py-3 bg-[#021a02] hover:bg-[#021a02] text-white font-bold rounded-xl transition-all shadow-lg shadow-emerald-500/20 whitespace-nowrap text-sm">
                      support@ternakos.id
                    </a>
                  </div>
                </PolicySection>

              </div>
            </TabsContent>

            {/* ─── TAB PETERNAK ─── */}
            <TabsContent value="peternak" className="mt-0 focus-visible:outline-none">
              <div className="space-y-12 animate-in fade-in slide-in-from-bottom-4 duration-500">

                <PolicySection number="01" title="Data Bisnis yang Kami Kumpulkan (Peternak)">
                  <ul className="space-y-4">
                    <li className="flex items-start gap-4">
                      <div className="w-1.5 h-1.5 rounded-full bg-emerald-500 mt-2 shrink-0" />
                      <div>
                        <strong className="text-[#F1F5F9]">Data Kandang:</strong>
                        <p className="text-[#94A3B8] text-sm mt-0.5">Nama kandang, kapasitas, lokasi detail, dan jenis ayam yang dibudidayakan.</p>
                      </div>
                    </li>
                    <li className="flex items-start gap-4">
                      <div className="w-1.5 h-1.5 rounded-full bg-emerald-500 mt-2 shrink-0" />
                      <div>
                        <strong className="text-[#F1F5F9]">Data Siklus Budidaya:</strong>
                        <p className="text-[#94A3B8] text-sm mt-0.5">Tanggal DOC masuk, pencatatan deplesi dan mortalitas harian, FCR, dan estimasi berat panen.</p>
                      </div>
                    </li>
                    <li className="flex items-start gap-4">
                      <div className="w-1.5 h-1.5 rounded-full bg-emerald-500 mt-2 shrink-0" />
                      <div>
                        <strong className="text-[#F1F5F9]">Listing Stok:</strong>
                        <p className="text-[#94A3B8] text-sm mt-0.5">Estimasi populasi siap panen dan harga penawaran yang Anda tayangkan untuk broker.</p>
                      </div>
                    </li>
                  </ul>
                </PolicySection>

                <PolicySection number="02" title="Kontrol Visibilitas Data Anda">
                  <p className="text-[#94A3B8] leading-relaxed mb-4">
                    Peternak memiliki kontrol penuh atas data yang terlihat oleh pihak lain:
                  </p>
                  <div className="space-y-4">
                    <div className="p-5 rounded-2xl bg-emerald-500/5 border border-emerald-500/15">
                      <p className="text-emerald-400 font-bold text-sm mb-2">Listing Stok (Terbatas pada Broker Terhubung)</p>
                      <p className="text-[#94A3B8] text-sm leading-relaxed">
                        Hanya broker yang Anda setujui koneksinya yang dapat melihat stok tersedia. Broker yang tidak terhubung tidak dapat menemukan atau melihat data kandang Anda.
                      </p>
                    </div>
                    <div className="p-5 rounded-2xl bg-white/[0.02] border border-white/5">
                      <p className="text-white font-bold text-sm mb-2">Data Budidaya Harian (Privat)</p>
                      <p className="text-[#94A3B8] text-sm leading-relaxed">
                        Data FCR, mortalitas harian, dan detail siklus budidaya <strong className="text-white">TIDAK dibagikan</strong> ke broker manapun tanpa izin tambahan dari Anda.
                      </p>
                    </div>
                    <div className="p-5 rounded-2xl bg-white/[0.02] border border-white/5">
                      <p className="text-white font-bold text-sm mb-2">Kontrol Koneksi</p>
                      <p className="text-[#94A3B8] text-sm leading-relaxed">
                        Anda dapat memutus koneksi dengan broker kapan saja melalui pengaturan platform. Setelah koneksi diputus, broker tidak lagi dapat mengakses listing stok Anda.
                      </p>
                    </div>
                  </div>
                </PolicySection>

                <PolicySection number="03" title="Koneksi dengan Broker">
                  <p className="text-[#94A3B8] leading-relaxed">
                    Setiap permintaan koneksi dari broker harus Anda setujui secara eksplisit. Setelah terhubung, broker hanya melihat informasi yang relevan untuk keperluan transaksi panen: estimasi stok, harga penawaran, dan data kontak dasar. Detail budidaya harian tetap privat milik Anda.
                  </p>
                  <p className="text-[#94A3B8] leading-relaxed mt-4">
                    Data historis transaksi yang sudah terjadi antara Anda dan broker tertentu tetap tersimpan sebagai bukti transaksi yang sah meskipun koneksi diputus.
                  </p>
                </PolicySection>

                <PolicySection number="04" title="Retensi Data Peternak">
                  <p className="text-[#94A3B8] leading-relaxed">
                    Data kandang dan siklus budidaya disimpan selama akun aktif. Setelah akun dinonaktifkan, data disimpan selama 90 hari masa tenggang. Data transaksi yang sudah diverifikasi disimpan minimal 5 tahun untuk keperluan perpajakan.
                  </p>
                </PolicySection>

                <PolicySection number="05" title="Hubungi Kami">
                  <div className="p-6 rounded-2xl bg-emerald-500/5 border border-emerald-500/10 flex flex-col md:flex-row items-center justify-between gap-4">
                    <p className="text-[#94A3B8] text-sm">Pertanyaan tentang kontrol data kandang Anda?</p>
                    <a href="mailto:support@ternakos.id" className="px-6 py-3 bg-[#021a02] hover:bg-[#021a02] text-white font-bold rounded-xl transition-all shadow-lg shadow-emerald-500/20 whitespace-nowrap text-sm">
                      support@ternakos.id
                    </a>
                  </div>
                </PolicySection>

              </div>
            </TabsContent>

            {/* ─── TAB RPA ─── */}
            <TabsContent value="rpa" className="mt-0 focus-visible:outline-none">
              <div className="space-y-12 animate-in fade-in slide-in-from-bottom-4 duration-500">

                <PolicySection number="01" title="Data Bisnis yang Kami Kumpulkan (RPA)">
                  <ul className="space-y-4">
                    <li className="flex items-start gap-4">
                      <div className="w-1.5 h-1.5 rounded-full bg-emerald-500 mt-2 shrink-0" />
                      <div>
                        <strong className="text-[#F1F5F9]">Riwayat Pembelian:</strong>
                        <p className="text-[#94A3B8] text-sm mt-0.5">Volume, harga per unit, tanggal pembelian, dan identitas broker penyedia.</p>
                      </div>
                    </li>
                    <li className="flex items-start gap-4">
                      <div className="w-1.5 h-1.5 rounded-full bg-emerald-500 mt-2 shrink-0" />
                      <div>
                        <strong className="text-[#F1F5F9]">Data Hutang & Piutang:</strong>
                        <p className="text-[#94A3B8] text-sm mt-0.5">Riwayat pembayaran, termin, dan saldo piutang usaha yang dihitung dari transaksi dengan broker.</p>
                      </div>
                    </li>
                    <li className="flex items-start gap-4">
                      <div className="w-1.5 h-1.5 rounded-full bg-emerald-500 mt-2 shrink-0" />
                      <div>
                        <strong className="text-[#F1F5F9]">Profil Operasional:</strong>
                        <p className="text-[#94A3B8] text-sm mt-0.5">Lokasi operasional, syarat pembayaran yang disepakati, dan riwayat ketepatan pembayaran.</p>
                      </div>
                    </li>
                  </ul>
                </PolicySection>

                <PolicySection number="02" title="Data Hutang & Bukti Transaksi">
                  <p className="text-[#94A3B8] mb-4 leading-relaxed">
                    Saldo piutang RPA dikalkulasi berdasarkan data transaksi yang sama-sama dimasukkan dan diverifikasi oleh Broker. RPA dapat melihat riwayat transaksi pembelian sebagai bukti yang sah dan permanen.
                  </p>
                  <div className="p-4 rounded-xl bg-orange-500/5 border border-orange-500/10">
                    <p className="text-orange-400 text-sm font-medium">
                      Data transaksi yang sudah diverifikasi kedua belah pihak tersimpan sebagai bukti hukum permanen yang dapat digunakan untuk keperluan audit akuntansi, penyelesaian sengketa, atau pelaporan pajak.
                    </p>
                  </div>
                </PolicySection>

                <PolicySection number="03" title="Visibilitas Data RPA ke Broker">
                  <p className="text-[#94A3B8] leading-relaxed mb-4">
                    Informasi RPA berikut mungkin terlihat oleh broker yang sedang atau pernah bertransaksi dengan Anda, semata-mata untuk kelancaran operasional:
                  </p>
                  <ul className="space-y-2">
                    <PrivBullet>Nama RPA dan lokasi operasional umum.</PrivBullet>
                    <PrivBullet>Syarat pembayaran (payment terms) yang berlaku.</PrivBullet>
                    <PrivBullet>Skor keandalan pembayaran (reliability score) berdasarkan riwayat ketepatan pembayaran.</PrivBullet>
                  </ul>
                  <p className="text-[#94A3B8] leading-relaxed mt-4">
                    Informasi keuangan internal RPA (seperti total omzet atau detail rekening) tidak pernah dibagikan kepada broker atau pihak manapun.
                  </p>
                </PolicySection>

                <PolicySection number="04" title="Retensi Data RPA">
                  <p className="text-[#94A3B8] leading-relaxed">
                    Data pembelian dan piutang RPA disimpan minimal <strong className="text-white">5 tahun</strong> setelah akun aktif terakhir untuk memenuhi kewajiban perpajakan dan audit. Data ini merupakan bukti transaksi hukum yang sah sesuai regulasi akuntansi Indonesia.
                  </p>
                </PolicySection>

                <PolicySection number="05" title="Hubungi Kami">
                  <div className="p-6 rounded-2xl bg-emerald-500/5 border border-emerald-500/10 flex flex-col md:flex-row items-center justify-between gap-4">
                    <p className="text-[#94A3B8] text-sm">Pertanyaan tentang data transaksi atau piutang Anda sebagai RPA?</p>
                    <a href="mailto:support@ternakos.id" className="px-6 py-3 bg-[#021a02] hover:bg-[#021a02] text-white font-bold rounded-xl transition-all shadow-lg shadow-emerald-500/20 whitespace-nowrap text-sm">
                      support@ternakos.id
                    </a>
                  </div>
                </PolicySection>

              </div>
            </TabsContent>

          </div>
        </Tabs>

        {/* Consent Footer */}
        <div className="mt-16 text-center space-y-8">
          <p className="text-[#4B6478] text-sm max-w-xl mx-auto leading-relaxed">
            Dengan mendaftar dan menggunakan platform TernakOS, Anda menyatakan telah membaca, memahami, dan menyetujui seluruh ketentuan dalam Kebijakan Privasi ini serta{' '}
            <Link to="/terms" className="text-emerald-400 hover:underline">Syarat & Ketentuan</Link> kami.
          </p>
          <div className="flex flex-col sm:flex-row items-center justify-center gap-4">
            <button
              onClick={() => navigate('/login')}
              className="w-full sm:w-auto px-10 py-4 bg-white/5 hover:bg-white/10 text-white font-bold rounded-2xl border border-white/10 transition-all flex items-center justify-center gap-2"
            >
              <ArrowLeft size={18} /> Kembali ke Login
            </button>
            <button
              onClick={() => navigate('/')}
              className="w-full sm:w-auto px-10 py-4 bg-emerald-500 hover:bg-emerald-600 text-white font-bold rounded-2xl shadow-xl shadow-emerald-500/20 transition-all flex items-center justify-center gap-2"
            >
              <Home size={18} /> Beranda
            </button>
          </div>
        </div>
      </main>

      {/* Footer */}
      <footer className="py-12 border-t border-white/5 text-center text-[#4B6478] text-sm">
        <p>© 2026 TernakOS Indonesia. Kepercayaan Anda, Keamanan Kami.</p>
        <p className="mt-2">
          <Link to="/terms" className="text-emerald-500/70 hover:text-emerald-400 transition-colors">Syarat & Ketentuan</Link>
          {' · '}
          <a href="mailto:support@ternakos.id" className="text-emerald-500/70 hover:text-emerald-400 transition-colors">Hubungi Kami</a>
        </p>
      </footer>
    </div>
  );
}

function PolicySection({ number, title, children, icon }) {
  return (
    <section className="space-y-6">
      <div className="flex items-center gap-4">
        {icon ? (
          <div className="w-12 h-12 rounded-xl bg-emerald-500/10 flex items-center justify-center">
            {icon}
          </div>
        ) : (
          <div className="w-10 h-10 rounded-lg bg-emerald-500/10 flex items-center justify-center text-emerald-500 font-display font-black">
            {number}
          </div>
        )}
        <h2 className="text-2xl font-black text-white tracking-tight">{title}</h2>
      </div>
      <div className="pl-0 md:pl-16">
        {children}
      </div>
    </section>
  );
}

function PrivBullet({ children }) {
  return (
    <li className="flex items-start gap-3 text-[#94A3B8]">
      <div className="w-1.5 h-1.5 rounded-full bg-emerald-500 mt-2 shrink-0" />
      <span>{children}</span>
    </li>
  );
}

function DataItem({ title, children }) {
  return (
    <li className="flex items-start gap-4">
      <div className="w-1.5 h-1.5 rounded-full bg-emerald-500 mt-2 shrink-0" />
      <div>
        <strong className="text-[#F1F5F9]">{title}:</strong>
        <p className="text-[#94A3B8] text-sm mt-0.5 leading-relaxed">{children}</p>
      </div>
    </li>
  );
}

function ThirdPartyItem({ name, purpose }) {
  return (
    <div className="p-4 rounded-xl bg-white/[0.02] border border-white/5 flex gap-4">
      <div className="w-1.5 h-1.5 rounded-full bg-emerald-500 mt-1.5 shrink-0" />
      <div>
        <strong className="text-white text-sm">{name}</strong>
        <p className="text-[#94A3B8] text-sm mt-0.5">{purpose}</p>
      </div>
    </div>
  );
}

function RetentionItem({ label, period, children }) {
  return (
    <div className="p-4 rounded-xl bg-white/[0.02] border border-white/5 flex gap-4">
      <div className="w-1.5 h-1.5 rounded-full bg-emerald-500 mt-1.5 shrink-0" />
      <div className="flex-1">
        <div className="flex flex-wrap items-center justify-between gap-2 mb-1">
          <strong className="text-white text-sm">{label}</strong>
          <span className="text-xs text-emerald-400 font-bold bg-emerald-500/10 px-2 py-0.5 rounded-full">{period}</span>
        </div>
        <p className="text-[#94A3B8] text-sm">{children}</p>
      </div>
    </div>
  );
}
