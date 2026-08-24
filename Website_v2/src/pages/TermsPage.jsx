import React from 'react';
import { Link } from 'react-router-dom';
import { motion } from 'framer-motion';
import { ChevronLeft } from 'lucide-react';
import SEO from '../components/SEO';

export default function TermsPage() {
  return (
    <div className="min-h-screen bg-[#06090F] text-[#F1F5F9] font-sans selection:bg-emerald-500/30">
      <SEO
        title="Syarat & Ketentuan Penggunaan TernakOS | Platform SaaS Peternakan"
        description="Baca syarat dan ketentuan penggunaan platform TernakOS. Ketentuan layanan, privasi, pembayaran, dan hak pengguna platform manajemen bisnis peternakan Indonesia."
        path="/terms"
        type="article"
      />
      {/* Navbar Area */}
      <header className="border-b border-white/5 bg-[#0C1319]/50 backdrop-blur-xl sticky top-0 z-50">
        <div className="max-w-4xl mx-auto px-6 h-20 flex items-center justify-between">
          <Link to="/" className="flex items-center gap-2.5 group">
            <img
              src="/logo.png"
              alt="TernakOS"
              className="w-9 h-9 rounded-xl object-cover shadow-lg shadow-emerald-500/20 group-hover:scale-105 transition-transform"
            />
            <span className="font-display font-black text-xl tracking-tight">TernakOS</span>
          </Link>
          <Link to="/login" className="flex items-center gap-2 text-sm font-semibold text-emerald-400 hover:text-emerald-300 transition-colors">
            <ChevronLeft size={16} />
            Kembali ke Login
          </Link>
        </div>
      </header>

      {/* Hero Section */}
      <section className="py-16 md:py-24 border-b border-white/5 relative overflow-hidden">
        <div className="absolute inset-0 bg-gradient-to-b from-emerald-500/5 to-transparent pointer-events-none" />
        <div className="max-w-4xl mx-auto px-6 relative z-10">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5 }}
          >
            <h1 className="font-display text-4xl md:text-5xl font-black mb-6 tracking-tight leading-none">
              Syarat & <span className="text-emerald-500">Ketentuan</span>
            </h1>
            <p className="text-[#4B6478] text-lg max-w-2xl leading-relaxed">
              Terakhir diperbarui: 1 Juni 2026 • Versi 2.1
            </p>
            <p className="text-[#4B6478] text-sm mt-2 leading-relaxed">
              Harap baca dokumen ini dengan seksama sebelum mendaftar atau menggunakan layanan TernakOS. Dengan mengakses platform ini, Anda menyatakan telah membaca, memahami, dan terikat secara hukum oleh ketentuan berikut.
            </p>
          </motion.div>
        </div>
      </section>

      {/* Content Area */}
      <main className="py-16 md:py-24 max-w-4xl mx-auto px-6">
        <div className="space-y-14">

          {/* 01 */}
          <TermSection number="01" title="Definisi & Ruang Lingkup">
            <p>Dalam Syarat & Ketentuan ini, istilah berikut memiliki arti sebagai berikut:</p>
            <ul className="list-none space-y-3 mt-4">
              <DefItem term="&quot;TernakOS&quot; / &quot;Kami&quot;">Platform Software-as-a-Service (SaaS) yang dioperasikan dan disediakan oleh tim TernakOS Indonesia untuk sektor peternakan.</DefItem>
              <DefItem term="&quot;Pengguna&quot; / &quot;Anda&quot;">Setiap individu atau entitas bisnis yang mendaftar, mengakses, atau menggunakan layanan TernakOS, termasuk namun tidak terbatas pada Broker Ayam, Broker Telur, Peternak, dan Rumah Potong Ayam (RPA).</DefItem>
              <DefItem term="&quot;Akun&quot;">Profil unik yang dibuat Pengguna untuk mengakses fitur platform TernakOS.</DefItem>
              <DefItem term="&quot;Tenant&quot;">Satu unit bisnis yang terdaftar dalam platform, yang dapat memiliki satu atau lebih Pengguna di bawahnya.</DefItem>
              <DefItem term="&quot;Data Bisnis&quot;">Seluruh data operasional yang dimasukkan Pengguna ke dalam platform, termasuk data transaksi, inventaris, dan data rekanan.</DefItem>
              <DefItem term="&quot;Layanan&quot;">Seluruh fitur, fungsi, dan konten yang tersedia melalui platform TernakOS, termasuk dashboard, laporan otomatis, dan sistem manajemen.</DefItem>
              <DefItem term="&quot;Paket Berlangganan&quot;">Tier layanan berbayar (Pro atau Business) yang memberikan akses ke fitur premium sesuai paket yang dipilih.</DefItem>
            </ul>
            <p className="mt-4">Ketentuan ini berlaku untuk seluruh layanan TernakOS yang diakses melalui aplikasi web maupun antarmuka lainnya yang kami sediakan.</p>
          </TermSection>

          {/* 02 */}
          <TermSection number="02" title="Penerimaan Ketentuan">
            <p>
              Dengan mendaftar, masuk, atau menggunakan platform TernakOS, baik melalui email/password maupun melalui Akun Google (Google Sign-In), Anda secara tegas menyetujui Syarat & Ketentuan ini serta Kebijakan Privasi kami yang berlaku secara bersamaan.
            </p>
            <p className="mt-4">
              Jika Anda menggunakan platform atas nama entitas bisnis atau perusahaan, Anda menyatakan bahwa Anda memiliki kewenangan hukum untuk mengikat entitas tersebut pada ketentuan ini.
            </p>
            <p className="mt-4">
              Jika Anda <strong className="text-white">tidak menyetujui</strong> ketentuan ini, Anda tidak diperkenankan untuk mendaftar atau menggunakan layanan TernakOS.
            </p>
          </TermSection>

          {/* 03 */}
          <TermSection number="03" title="Deskripsi Layanan & Produk">
            <p>
              TernakOS adalah platform digital berbasis web Software-as-a-Service (SaaS) yang dirancang khusus untuk mempermudah pencatatan operasional usaha dan manajemen peternakan di Indonesia.
            </p>
            <p className="mt-4">
              Platform kami membantu Pengguna mengelola data operasional penting yang mencakup:
            </p>
            <ul className="mt-4 space-y-2">
              <BulletItem>Manajemen data ternak (domba, kambing, sapi, dll.) dan siklus kandang.</BulletItem>
              <BulletItem>Pencatatan persediaan pakan, sisa pakan, dan efisiensi konsumsi pakan.</BulletItem>
              <BulletItem>Pelacakan berat badan harian dan pencapaian Average Daily Gain (ADG).</BulletItem>
              <BulletItem>Pencatatan pengeluaran harian dan biaya operasional.</BulletItem>
              <BulletItem>Manajemen tugas harian petugas kandang (daily tasks).</BulletItem>
              <BulletItem>Pencatatan penjualan ternak dan komoditas, serta laporan profitabilitas otomatis.</BulletItem>
              <BulletItem>Manajemen hak akses tim dan pembagian tugas staff/anak kandang.</BulletItem>
              <BulletItem>Dashboard visualisasi bisnis terpadu untuk monitoring kondisi peternakan.</BulletItem>
            </ul>
            <p className="mt-4 font-semibold text-emerald-400">
              Pernyataan Penting: TernakOS merupakan produk layanan digital murni berbasis langganan (subscription). Kami menyediakan akses elektronik ke aplikasi web, dan TIDAK menjual atau mengirimkan komoditas fisik/barang fisik melalui logistik kurir.
            </p>
          </TermSection>

          {/* 04 */}
          <TermSection number="04" title="Pendaftaran Akun & Keamanan">
            <p>Untuk menggunakan layanan TernakOS, Anda wajib membuat akun dan masuk (login) menggunakan alamat email aktif yang sah. Pengguna bertanggung jawab atas:</p>
            <ul className="mt-4 space-y-2">
              <BulletItem>Keakuratan, kelengkapan, dan kebenaran data bisnis serta informasi akun yang diisikan ke dalam sistem.</BulletItem>
              <BulletItem>Kerahasiaan kata sandi, kode akses sekali pakai (OTP), dan seluruh kredensial akun Anda.</BulletItem>
              <BulletItem>Seluruh aktivitas yang terjadi di bawah akun Anda, baik yang Anda lakukan sendiri maupun pihak ketiga yang mengakses akun Anda.</BulletItem>
              <BulletItem>Segera melaporkan jika mendapati aktivitas mencurigakan atau akses tidak sah melalui email <a href="mailto:support@ternakos.id" className="text-emerald-400 hover:underline">support@ternakos.id</a>.</BulletItem>
            </ul>
            <p className="mt-4">Pembuatan akun menggunakan informasi palsu atau menyamar sebagai bisnis lain merupakan pelanggaran berat yang dapat menyebabkan penangguhan akun secara permanen.</p>
          </TermSection>

          {/* 05 */}
          <TermSection number="05" title="Autentikasi Pihak Ketiga (Google Sign-In)">
            <p>
              TernakOS menawarkan opsi masuk menggunakan Akun Google melalui layanan OAuth 2.0 milik Google LLC. Dengan memilih opsi ini, Anda memahami dan menyetujui hal-hal berikut:
            </p>
            <ul className="mt-4 space-y-3">
              <BulletItem>
                <strong className="text-white">Data yang diterima dari Google:</strong> Kami hanya menerima data dasar profil Google Anda, yaitu nama lengkap, alamat email, dan foto profil (jika tersedia). Kami tidak meminta dan tidak mengakses Google Drive, Gmail, Kalender, Kontak, atau layanan Google lainnya.
              </BulletItem>
              <BulletItem>
                <strong className="text-white">Tujuan penggunaan:</strong> Data dari Google digunakan semata-mata untuk membuat dan mengidentifikasi akun TernakOS Anda. Tidak ada data Google yang digunakan untuk iklan, analitik pihak ketiga, atau tujuan lain di luar autentikasi.
              </BulletItem>
              <BulletItem>
                <strong className="text-white">Pencabutan akses:</strong> Anda dapat mencabut akses TernakOS dari akun Google Anda kapan saja melalui pengaturan keamanan Google di <span className="text-emerald-400">myaccount.google.com/permissions</span>. Pencabutan ini tidak menghapus data bisnis yang sudah tersimpan di TernakOS.
              </BulletItem>
              <BulletItem>
                <strong className="text-white">Tidak ada transfer ke pihak ketiga:</strong> Data yang diterima dari Google tidak dibagikan, dijual, atau ditransfer ke pihak ketiga manapun.
              </BulletItem>
            </ul>
            <p className="mt-4">
              Penggunaan layanan Google tunduk pada <span className="text-[#94A3B8]">Kebijakan Privasi dan Persyaratan Layanan Google</span>. TernakOS tidak bertanggung jawab atas kebijakan atau praktik Google yang berada di luar kendali kami.
            </p>
          </TermSection>

          {/* 06 */}
          <TermSection number="06" title="Ketentuan Penggunaan yang Dapat Diterima">
            <p>Anda setuju untuk hanya menggunakan TernakOS untuk tujuan yang sah dan sesuai hukum yang berlaku di Republik Indonesia. Secara khusus, Anda <strong className="text-white">DILARANG</strong> untuk:</p>
            <ul className="mt-4 space-y-2">
              <BulletItem>Menggunakan platform untuk kegiatan ilegal, penipuan, atau yang merugikan pihak lain.</BulletItem>
              <BulletItem>Mencoba mengakses data Pengguna lain, melakukan reverse engineering, atau mengeksploitasi celah keamanan sistem.</BulletItem>
              <BulletItem>Mengunggah, menyebarkan, atau menyimpan konten berbahaya seperti malware, virus, atau kode berbahaya lainnya.</BulletItem>
              <BulletItem>Melakukan scraping, crawling, atau pengambilan data otomatis dari platform tanpa izin tertulis.</BulletItem>
              <BulletItem>Menggunakan platform untuk tujuan kompetitif tanpa izin, termasuk membangun produk atau layanan yang bersaing langsung dengan TernakOS menggunakan data atau fitur kami.</BulletItem>
              <BulletItem>Melebihi batas penggunaan wajar yang dapat mengganggu kinerja layanan bagi Pengguna lain (abuse of service).</BulletItem>
              <BulletItem>Mengalihkan atau menjual kembali akses platform kepada pihak ketiga tanpa persetujuan tertulis dari TernakOS.</BulletItem>
            </ul>
            <p className="mt-4">Pelanggaran terhadap ketentuan ini memberikan TernakOS hak untuk menangguhkan atau menghentikan akun Anda secara permanen tanpa kewajiban pengembalian dana.</p>
          </TermSection>

          {/* 07 */}
          <TermSection number="07" title="Paket Layanan & Skema Langganan">
            <p>TernakOS menawarkan skema akses layanan dengan ketentuan sebagai berikut:</p>
            <div className="mt-6 grid md:grid-cols-3 gap-4">
              <PlanCard name="Starter" color="text-[#94A3B8]" border="border-white/10">
                <p>Gratis selamanya untuk fitur dasar dengan batasan kapasitas minimal (misalnya kapasitas 1 kandang). Tanpa biaya pembayaran.</p>
              </PlanCard>
              <PlanCard name="Pro" color="text-emerald-400" border="border-emerald-500/30">
                <p>Berbayar, membuka fitur operasional lengkap hingga kapasitas menengah. Tersedia opsi pembayaran berkala.</p>
              </PlanCard>
              <PlanCard name="Business" color="text-amber-400" border="border-amber-500/30">
                <p>Berbayar, membuka seluruh kapasitas data dan fitur tanpa batas kandang. Diperuntukkan bisnis skala menengah/besar.</p>
              </PlanCard>
            </div>
            <ul className="mt-6 space-y-3">
              <BulletItem><strong className="text-white">Uji Coba Gratis:</strong> Pengguna dapat mendaftar dan menggunakan akun gratis (Starter) untuk mencoba operasional dasar sebelum melakukan upgrade.</BulletItem>
              <BulletItem><strong className="text-white">Upgrade Berbayar:</strong> Pengguna dapat meningkatkan status akun menjadi Pro atau Business kapan saja melalui halaman upgrade/subscription di dalam aplikasi untuk memperoleh fitur yang lebih lengkap.</BulletItem>
              <BulletItem><strong className="text-white">Masa Langganan:</strong> Fitur berbayar yang aktif disesuaikan dengan jenis paket layanan yang dipilih dan durasi berlangganan aktif yang diajukan oleh pengguna saat checkout.</BulletItem>
            </ul>
          </TermSection>

          {/* 08 */}
          <TermSection number="08" title="Alur Pemesanan & Pembayaran (Midtrans)">
            <p>Proses pemesanan layanan berlangganan TernakOS dan pembayarannya mengikuti langkah-langkah berikut:</p>
            <ol className="mt-4 space-y-3 list-none pl-0">
              <li className="flex gap-4">
                <span className="text-emerald-500 font-black font-display w-6 shrink-0">1.</span>
                <span className="text-[#94A3B8]">Pengguna mengakses website resmi TernakOS di <a href="https://ternakos.my.id" target="_blank" rel="noreferrer" className="text-emerald-400 hover:underline">https://ternakos.my.id</a>.</span>
              </li>
              <li className="flex gap-4">
                <span className="text-emerald-500 font-black font-display w-6 shrink-0">2.</span>
                <span className="text-[#94A3B8]">Pengguna melakukan pendaftaran akun baru atau login menggunakan alamat email yang sah.</span>
              </li>
              <li className="flex gap-4">
                <span className="text-emerald-500 font-black font-display w-6 shrink-0">3.</span>
                <span className="text-[#94A3B8]">Pengguna melengkapi data usaha awal atau memilih profil usaha yang ingin dikelola di dashboard aplikasi.</span>
              </li>
              <li className="flex gap-4">
                <span className="text-emerald-500 font-black font-display w-6 shrink-0">4.</span>
                <span className="text-[#94A3B8]">Pengguna menavigasi ke halaman upgrade/subscription, lalu memilih paket berlangganan (Pro/Business) serta jangka waktu tagihan yang diinginkan.</span>
              </li>
              <li className="flex gap-4">
                <span className="text-emerald-500 font-black font-display w-6 shrink-0">5.</span>
                <span className="text-[#94A3B8]">Sistem menampilkan ringkasan checkout yang berisi nama paket, durasi langganan, harga paket, potongan voucher (bila ada), dan total tagihan akhir yang harus dibayarkan.</span>
              </li>
              <li className="flex gap-4">
                <span className="text-emerald-500 font-black font-display w-6 shrink-0">6.</span>
                <span className="text-[#94A3B8]">Pengguna menekan tombol untuk melanjutkan checkout, lalu sistem TernakOS otomatis menerbitkan invoice tagihan dengan status awal <code>pending</code>.</span>
              </li>
              <li className="flex gap-4">
                <span className="text-emerald-500 font-black font-display w-6 shrink-0">7.</span>
                <span className="text-[#94A3B8]">Pengguna diarahkan ke antarmuka gerbang pembayaran aman Midtrans Snap.</span>
              </li>
              <li className="flex gap-4">
                <span className="text-emerald-500 font-black font-display w-6 shrink-0">8.</span>
                <span className="text-[#94A3B8]">Pengguna memilih metode pembayaran yang tersedia di Midtrans (seperti QRIS, Virtual Account bank, atau E-Wallet).</span>
              </li>
              <li className="flex gap-4">
                <span className="text-emerald-500 font-black font-display w-6 shrink-0">9.</span>
                <span className="text-[#94A3B8]">Pengguna menyelesaikan pembayaran melalui channel pembayaran yang dipilih sesuai jumlah persis tagihan akhir.</span>
              </li>
              <li className="flex gap-4">
                <span className="text-emerald-500 font-black font-display w-6 shrink-0">10.</span>
                <span className="text-[#94A3B8]">Midtrans secara otomatis mengirimkan notifikasi pembayaran (webhook) ke sistem backend TernakOS.</span>
              </li>
              <li className="flex gap-4">
                <span className="text-emerald-500 font-black font-display w-6 shrink-0">11.</span>
                <span className="text-[#94A3B8]">Sistem TernakOS memverifikasi notifikasi pembayaran dari Midtrans dengan memvalidasi order ID, status transaksi, nominal bayar, dan keaslian signature key.</span>
              </li>
              <li className="flex gap-4">
                <span className="text-emerald-500 font-black font-display w-6 shrink-0">12.</span>
                <span className="text-[#94A3B8]">Apabila verifikasi sukses, status invoice diperbarui menjadi <code>paid</code>/<code>success</code>, dan paket berlangganan akun Pengguna otomatis aktif atau diperpanjang. Pengguna kini dapat kembali ke aplikasi untuk mengakses fitur premium.</span>
              </li>
              <li className="flex gap-4">
                <span className="text-emerald-500 font-black font-display w-6 shrink-0">13.</span>
                <span className="text-[#94A3B8]">Apabila transaksi pending, gagal, kedaluwarsa, atau dibatalkan, status invoice disesuaikan dengan kondisi transaksi dan Pengguna dapat mencoba melakukan checkout ulang untuk memicu pembayaran baru.</span>
              </li>
            </ol>
          </TermSection>

          {/* 09 */}
          <TermSection number="09" title="Pengiriman Digital & Ketentuan Pembayaran">
            <p><strong className="text-white">Metode Pengiriman Layanan:</strong> Mengingat TernakOS adalah produk perangkat lunak digital berbasis cloud (SaaS), maka seluruh pengiriman akses layanan dilakukan secara elektronik langsung ke akun Anda. Tidak ada pengiriman barang secara fisik melalui kurir atau kargo. Layanan premium langsung aktif setelah pembayaran dikonfirmasi oleh sistem.</p>
            <p className="mt-4"><strong className="text-white">Ketentuan Transaksi Pembayaran:</strong></p>
            <ul className="mt-2 space-y-2">
              <BulletItem>Seluruh pembayaran langganan diproses dengan aman melalui Midtrans atau channel resmi yang kami tunjuk.</BulletItem>
              <BulletItem>Opsi channel pembayaran yang aktif bergantung pada konfigurasi aktif akun Midtrans TernakOS.</BulletItem>
              <BulletItem>Pengguna berkewajiban melakukan transfer dana sesuai dengan nominal tagihan yang tertera di checkout. Aktivasi otomatis bergantung sepenuhnya pada kecocokan data verifikasi pembayaran.</BulletItem>
            </ul>
          </TermSection>

          {/* 10 */}
          <TermSection number="10" title="Kebijakan Pembatalan & Pengembalian Dana (Refund)">
            <p><strong className="text-white">Pembatalan Berlangganan:</strong> Pengguna dapat membatalkan atau berhenti memperpanjang langganan berbayar mereka kapan saja. Hak akses fitur premium akan tetap berlaku hingga periode akhir berlangganan berjalan yang telah dilunasi selesai. Tidak ada pengenaan denda pembatalan.</p>
            <p className="mt-4"><strong className="text-white">Kebijakan Pengembalian Dana (Refund):</strong></p>
            <ul className="mt-2 space-y-2">
              <BulletItem>Semua transaksi pembayaran paket berlangganan digital yang telah sukses diproses bersifat final dan tidak dapat dikembalikan (non-refundable) setelah akses fitur premium aktif, kecuali jika terdapat kekeliruan sistematis (seperti transaksi ganda/duplicate charge) atau gangguan teknis fatal berkepanjangan pada aplikasi yang terverifikasi secara resmi oleh tim pengembang kami.</BulletItem>
              <BulletItem>Pengguna dapat mengajukan peninjauan kasus pembayaran ganda ke email bantuan resmi TernakOS. Kami meninjau dan memproses pengembalian dana secara case-by-case.</BulletItem>
            </ul>
          </TermSection>

          {/* 11 */}
          <TermSection number="11" title="Kepemilikan Data & Hak Kekayaan Intelektual">
            <p><strong className="text-white">Data Bisnis Anda:</strong> Seluruh Data Bisnis yang Anda masukkan ke dalam platform adalah milik Anda sepenuhnya. TernakOS tidak mengklaim hak kepemilikan atas data tersebut. Kami hanya berperan sebagai penyedia infrastruktur dan pengolah data atas instruksi Anda.</p>
            <p className="mt-4"><strong className="text-white">Lisensi Terbatas:</strong> Dengan menggunakan layanan kami, Anda memberikan TernakOS lisensi terbatas, non-eksklusif, dan dapat dicabut untuk memproses Data Bisnis Anda semata-mata dalam rangka menyediakan layanan yang Anda minta.</p>
            <p className="mt-4"><strong className="text-white">Hak TernakOS:</strong> Seluruh elemen platform TernakOS, termasuk namun tidak terbatas pada kode sumber, desain antarmuka, algoritma, merek, dan logo, adalah milik eksklusif TernakOS Indonesia dan dilindungi oleh hukum hak cipta dan hak kekayaan intelektual Republik Indonesia. Anda tidak diperkenankan menyalin, memodifikasi, mendistribusikan, atau menggunakan elemen tersebut tanpa izin tertulis.</p>
            <p className="mt-4"><strong className="text-white">Data Agregat Anonim:</strong> TernakOS dapat menggunakan data yang dianonimkan dan diagregasikan (tanpa informasi yang dapat mengidentifikasi bisnis atau individu Anda) untuk keperluan peningkatan layanan, pengembangan fitur, dan referensi harga pasar komoditas peternakan Indonesia.</p>
          </TermSection>

          {/* 12 */}
          <TermSection number="12" title="Batasan Tanggung Jawab">
            <p>Sejauh yang diizinkan oleh hukum yang berlaku di Republik Indonesia:</p>
            <ul className="mt-4 space-y-3">
              <BulletItem><strong className="text-white">Tidak Ada Jaminan:</strong> Layanan TernakOS disediakan "sebagaimana adanya" (<em>as-is</em>) dan "sebagaimana tersedia" (<em>as-available</em>). Kami tidak memberikan jaminan bahwa layanan akan bebas dari gangguan, kesalahan, atau kehilangan data.</BulletItem>
              <BulletItem><strong className="text-white">Keputusan Bisnis:</strong> TernakOS tidak bertanggung jawab atas kerugian finansial atau keputusan bisnis yang diambil berdasarkan data, laporan, atau analitik yang ditampilkan dalam platform. Pengguna disarankan melakukan validasi mandiri untuk transaksi bernilai signifikan.</BulletItem>
              <BulletItem><strong className="text-white">Batas Ganti Rugi:</strong> Dalam hal apapun, total tanggung jawab kumulatif TernakOS kepada Anda tidak akan melebihi jumlah yang Anda bayarkan kepada kami dalam 3 bulan terakhir sebelum klaim timbul.</BulletItem>
              <BulletItem><strong className="text-white">Kerugian Tidak Langsung:</strong> TernakOS tidak bertanggung jawab atas kehilangan laba, kehilangan data, kerusakan reputasi, atau kerugian tidak langsung lainnya, bahkan jika TernakOS telah diberitahu kemungkinan terjadinya kerugian tersebut.</BulletItem>
            </ul>
          </TermSection>

          {/* 13 */}
          <TermSection number="13" title="Ketersediaan Layanan & Gangguan Sistem">
            <p><strong className="text-white">Komitmen Ketersediaan Layanan:</strong> Kami berupaya semaksimal mungkin untuk menjaga keandalan dan ketersediaan aplikasi TernakOS. Namun, akses dapat terganggu sewaktu-waktu karena aktivitas pemeliharaan terjadwal (scheduled maintenance) atau pembaruan sistem berkala.</p>
            <p className="mt-4"><strong className="text-white">Batasan Tanggung Jawab Sistem:</strong> Kami tidak bertanggung jawab atas kegagalan akses sistem atau keterlambatan proses yang disebabkan oleh faktor eksternal di luar kendali wajar kami, seperti gangguan pada jaringan internet nasional, gangguan server cloud pihak ketiga (Supabase/Google Cloud), kegagalan integrasi payment gateway Midtrans, atau peristiwa keadaan kahar (force majeure) lainnya.</p>
          </TermSection>

          {/* 14 */}
          <TermSection number="14" title="Tanggung Jawab Data Pengguna & Keamanan Pembayaran">
            <p><strong className="text-white">Tanggung Jawab Input Data:</strong> Pengguna memegang kendali dan tanggung jawab penuh terhadap kebenaran serta legalitas seluruh data bisnis operasional yang dimasukkan ke dalam aplikasi.</p>
            <p className="mt-4"><strong className="text-white">Penyimpanan Data Bisnis:</strong> Kami memproses dan menyimpan data bisnis Anda semata-mata untuk menjalankan seluruh fitur aplikasi, menjaga riwayat siklus kandang, serta menampilkan laporan analitis usaha Anda.</p>
            <p className="mt-4 font-semibold text-emerald-400">
              Keamanan Pembayaran: Demi alasan keamanan data, Anda dilarang keras menginput informasi sensitif perbankan seperti nomor kartu kredit, PIN, atau kredensial perbankan lainnya di dalam form isian data TernakOS. Seluruh pemrosesan pembayaran dan input data finansial kartu kredit/debit ditangani secara aman oleh sistem gerbang pembayaran eksternal Midtrans yang telah tersertifikasi standar keamanan tinggi (PCI-DSS).
            </p>
          </TermSection>

          {/* 15 */}
          <TermSection number="15" title="Perubahan Layanan & Ketentuan">
            <p>
              TernakOS berhak mengubah Syarat & Ketentuan ini sewaktu-waktu. Untuk perubahan yang bersifat material (seperti perubahan harga, pembatasan fitur, atau kebijakan data), kami akan memberikan pemberitahuan melalui:
            </p>
            <ul className="mt-4 space-y-2">
              <BulletItem>Email ke alamat yang terdaftar di akun Anda, minimal 7 hari sebelum berlaku.</BulletItem>
              <BulletItem>Notifikasi dalam platform saat Anda login.</BulletItem>
            </ul>
            <p className="mt-4">
              Penggunaan layanan yang berlanjut setelah tanggal efektif perubahan merupakan persetujuan Anda terhadap versi terbaru. Jika Anda tidak menyetujui perubahan, Anda berhak untuk menghentikan langganan sebelum perubahan berlaku.
            </p>
          </TermSection>

          {/* 16 */}
          <TermSection number="16" title="Hukum yang Berlaku & Penyelesaian Sengketa">
            <p>
              Syarat & Ketentuan ini tunduk pada dan ditafsirkan berdasarkan hukum Republik Indonesia. Setiap sengketa yang timbul dari atau sehubungan dengan ketentuan ini akan diselesaikan secara bertahap sebagai berikut:
            </p>
            <ol className="mt-4 space-y-3 list-none">
              <li className="flex gap-4">
                <span className="text-emerald-500 font-black font-display w-6 shrink-0">1.</span>
                <span className="text-[#94A3B8]"><strong className="text-white">Musyawarah:</strong> Para pihak berupaya menyelesaikan sengketa melalui musyawarah mufakat dalam jangka waktu 30 hari sejak sengketa timbul.</span>
              </li>
              <li className="flex gap-4">
                <span className="text-emerald-500 font-black font-display w-6 shrink-0">2.</span>
                <span className="text-[#94A3B8]"><strong className="text-white">Mediasi:</strong> Jika musyawarah gagal, para pihak dapat menempuh jalur mediasi melalui lembaga mediasi yang disepakati bersama.</span>
              </li>
              <li className="flex gap-4">
                <span className="text-emerald-500 font-black font-display w-6 shrink-0">3.</span>
                <span className="text-[#94A3B8]"><strong className="text-white">Pengadilan:</strong> Jika mediasi tidak menghasilkan penyelesaian, sengketa akan diselesaikan melalui Pengadilan Negeri yang berwenang sesuai domisili hukum TernakOS Indonesia.</span>
              </li>
            </ol>
          </TermSection>

          {/* 17 */}
          <TermSection number="17" title="Privasi & Perlindungan Data Pribadi">
            <p>
              Pengumpulan, penggunaan, dan perlindungan data pribadi Anda diatur secara terpisah dan terperinci dalam <Link to="/privacy" className="text-emerald-400 hover:underline font-semibold">Kebijakan Privasi TernakOS</Link>, yang merupakan satu kesatuan tidak terpisahkan dari Syarat & Ketentuan ini.
            </p>
            <p className="mt-4">
              Kami beroperasi sesuai dengan Undang-Undang Perlindungan Data Pribadi Republik Indonesia (UU No. 27 Tahun 2022) dan peraturan pelaksanaannya. Dengan menggunakan layanan kami, Anda memberikan persetujuan yang sah untuk pemrosesan data pribadi sebagaimana diuraikan dalam Kebijakan Privasi.
            </p>
          </TermSection>

          {/* 18 */}
          <TermSection number="18" title="Ketentuan Lain-Lain">
            <ul className="space-y-3">
              <BulletItem><strong className="text-white">Keterpisahan:</strong> Jika suatu ketentuan dalam dokumen ini dinyatakan tidak sah atau tidak dapat dilaksanakan oleh pengadilan yang berwenang, ketentuan tersebut akan diubah seminimal mungkin untuk membuatnya dapat dilaksanakan, dan ketentuan lainnya tetap berlaku penuh.</BulletItem>
              <BulletItem><strong className="text-white">Tidak Ada Pengabaian:</strong> Kegagalan TernakOS untuk menegakkan suatu hak atau ketentuan tidak akan dianggap sebagai pengabaian hak tersebut.</BulletItem>
              <BulletItem><strong className="text-white">Keseluruhan Perjanjian:</strong> Dokumen ini, bersama dengan Kebijakan Privasi, merupakan keseluruhan perjanjian antara Anda dan TernakOS mengenai penggunaan layanan dan menggantikan semua perjanjian sebelumnya.</BulletItem>
              <BulletItem><strong className="text-white">Bahasa:</strong> Dokumen ini disusun dalam Bahasa Indonesia. Jika terdapat versi terjemahan, versi Bahasa Indonesia yang berlaku dan mengikat secara hukum.</BulletItem>
            </ul>
          </TermSection>

          {/* 19 */}
          <TermSection number="19" title="Hubungi Kami">
            <p>Untuk pertanyaan, keluhan, atau permintaan terkait Syarat & Ketentuan ini, silakan hubungi kami melalui:</p>
            <div className="mt-6 p-6 rounded-2xl bg-emerald-500/5 border border-emerald-500/10 flex flex-col md:flex-row items-center justify-between gap-4">
              <div>
                <p className="text-white font-bold">TernakOS Indonesia</p>
                <p className="text-[#94A3B8] text-sm mt-1">Tim Legal & Support</p>
                <p className="text-[#94A3B8] text-sm mt-1">Jam Kerja: Senin–Jumat, 08.00–17.00 WIB</p>
              </div>
              <a
                href="mailto:support@ternakos.id"
                className="px-6 py-3 bg-[#021a02] hover:bg-[#021a02] text-white font-bold rounded-xl transition-all shadow-lg shadow-emerald-500/20 whitespace-nowrap"
              >
                support@ternakos.id
              </a>
            </div>
          </TermSection>

        </div>
      </main>

      {/* Footer */}
      <footer className="py-12 border-t border-white/5 text-center text-[#4B6478] text-sm">
        <p>© 2026 TernakOS Indonesia. All rights reserved.</p>
        <p className="mt-2">
          <Link to="/privacy" className="text-emerald-500/70 hover:text-emerald-400 transition-colors">Kebijakan Privasi</Link>
          {' · '}
          <a href="mailto:support@ternakos.id" className="text-emerald-500/70 hover:text-emerald-400 transition-colors">Hubungi Kami</a>
        </p>
      </footer>
    </div>
  );
}

function TermSection({ number, title, children }) {
  return (
    <section className="space-y-4">
      <h2 className="text-2xl font-bold text-white flex items-center gap-3">
        <span className="text-emerald-500 font-display">{number}.</span> {title}
      </h2>
      <div className="text-[#94A3B8] leading-relaxed space-y-3 pl-0 md:pl-9">
        {children}
      </div>
    </section>
  );
}

function BulletItem({ children }) {
  return (
    <li className="flex items-start gap-3">
      <div className="w-1.5 h-1.5 rounded-full bg-emerald-500 mt-2 shrink-0" />
      <span>{children}</span>
    </li>
  );
}

function DefItem({ term, children }) {
  return (
    <li className="flex items-start gap-3">
      <div className="w-1.5 h-1.5 rounded-full bg-emerald-500 mt-2 shrink-0" />
      <span><strong className="text-white">{term}:</strong> {children}</span>
    </li>
  );
}

function PlanCard({ name, color, border, children }) {
  return (
    <div className={`p-5 rounded-2xl bg-white/[0.02] border ${border}`}>
      <h4 className={`font-black text-lg mb-2 ${color}`}>{name}</h4>
      <div className="text-[#94A3B8] text-sm leading-relaxed">{children}</div>
    </div>
  );
}
