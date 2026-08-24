export const teknis = [
  {
    q: 'Apakah data saya tersimpan di cloud dan aman dari kehilangan?',
    a: 'Ya. Semua data TernakOS disimpan di Supabase Cloud (PostgreSQL) dengan replikasi real-time. Data tidak pernah tersimpan hanya di HP kamu — meski HP hilang atau rusak, semua data tetap aman dan bisa diakses dari perangkat lain.',
  },
  {
    q: 'Apa itu Row Level Security (RLS) yang digunakan TernakOS?',
    a: 'Row Level Security adalah fitur keamanan database PostgreSQL yang memastikan setiap pengguna hanya bisa melihat data miliknya sendiri. Di TernakOS, ini berarti data bisnis kamu tidak bisa bocor ke akun pengguna lain meskipun menggunakan server yang sama.',
  },
  {
    q: 'Apakah TernakOS bisa diakses tanpa internet (offline mode)?',
    a: 'TernakOS menggunakan sistem caching lokal dan prefetching — data yang sudah dimuat sebelumnya tetap bisa dilihat saat koneksi terputus sementara. Namun untuk input data baru atau sinkronisasi, koneksi internet tetap diperlukan.',
  },
  {
    q: 'Bagaimana jika saya lupa password akun TernakOS?',
    a: 'Klik "Lupa Password" di halaman login. Masukkan email yang terdaftar dan TernakOS akan mengirim link reset password. Klik link tersebut dan buat password baru dalam waktu kurang dari 5 menit.',
    link: '/login',
  },
  {
    q: 'Apakah ada biaya bulanan atau sekali bayar untuk TernakOS?',
    a: 'TernakOS menggunakan model berlangganan bulanan (atau tahunan dengan diskon). Tidak ada biaya setup atau biaya tersembunyi. Paket Starter tersedia gratis selamanya.',
    link: '/harga',
  },
  {
    q: 'Apakah TernakOS bisa diakses dari laptop dan komputer desktop?',
    a: 'Bisa. TernakOS berjalan di semua browser modern: Chrome, Firefox, Safari, Edge — baik di HP maupun laptop/komputer desktop. Tampilan otomatis menyesuaikan ukuran layar (responsive design).',
  },
  {
    q: 'Bagaimana cara backup data di TernakOS secara manual?',
    a: 'Karena data disimpan otomatis di cloud, backup manual tidak diperlukan. Supabase melakukan snapshot database secara berkala. Untuk export data, gunakan fitur laporan yang tersedia di masing-masing modul.',
  },
  {
    q: 'Apakah TernakOS memiliki enkripsi data saat transmisi?',
    a: 'Ya. Semua koneksi antara browser dan server TernakOS menggunakan HTTPS dengan enkripsi TLS. Data yang dikirim tidak bisa disadap dalam perjalanan.',
  },
  {
    q: 'Berapa banyak pengguna yang bisa diundang dalam satu akun bisnis TernakOS?',
    a: 'Starter: hanya 1 pengguna (owner saja, tidak bisa undang anggota tim). Pro: hingga 3 anggota tim selain owner. Business: unlimited anggota tim. Cek halaman harga untuk detail terbaru.',
    link: '/harga',
  },
  {
    q: 'Apakah ada fitur audit trail untuk melihat siapa yang mengubah data di TernakOS?',
    a: 'TernakOS menyimpan log perubahan data. Admin/Owner bisa melihat riwayat aktivitas tim dari menu yang tersedia. Fitur audit trail lengkap tersedia di paket Business.',
    link: '/harga',
  },
  {
    q: 'Bagaimana cara menambah atau mengupgrade paket berlangganan TernakOS?',
    a: 'Buka menu Akun → Langganan. Pilih paket yang diinginkan dan ikuti instruksi pembayaran. Upgrade aktif segera setelah pembayaran dikonfirmasi. Fitur tambahan langsung bisa digunakan.',
    link: '/harga',
  },
  {
    q: 'Apakah TernakOS mendukung pembayaran langganan via transfer bank?',
    a: 'Ya. TernakOS mendukung pembayaran via transfer bank. Instruksi rekening tujuan tersedia setelah kamu memilih paket di halaman langganan.',
    link: '/harga',
  },
  {
    q: 'Apa yang terjadi dengan data saya jika masa trial TernakOS berakhir?',
    a: 'Untuk paket Pro dan Business, setelah masa trial 14 hari berakhir, akun masuk mode read-only — kamu masih bisa melihat data yang sudah ada tetapi tidak bisa input data baru. Upgrade ke paket berbayar kapan saja untuk melanjutkan.',
    link: '/harga',
  },
  {
    q: 'Apakah bisa membatalkan berlangganan TernakOS kapan saja?',
    a: 'Ya. Tidak ada kontrak jangka panjang. Kamu bisa batalkan langganan kapan saja dari menu Akun. Akses tetap aktif hingga akhir periode yang sudah dibayar.',
  },
  {
    q: 'Bagaimana cara mengganti email atau nomor HP yang terdaftar di TernakOS?',
    a: 'Buka menu Akun → Pengaturan Profil. Di sini kamu bisa update email, nomor HP, dan informasi bisnis lainnya. Perubahan email memerlukan verifikasi ke email baru.',
  },
  {
    q: 'Apakah TernakOS punya fitur 2FA (Two-Factor Authentication) untuk keamanan login?',
    a: 'Fitur 2FA sedang dalam roadmap keamanan TernakOS. Saat ini keamanan dibantu oleh sistem email verification saat daftar dan reset password yang aman.',
  },
  {
    q: 'Berapa lama data transaksi tersimpan di TernakOS?',
    a: 'Data tersimpan selama akun aktif tanpa batas waktu. Tidak ada penghapusan data otomatis. Bahkan jika berlangganan berakhir, data tetap bisa diakses dalam mode read-only.',
  },
  {
    q: 'Apakah TernakOS bisa diakses dari beberapa perangkat sekaligus?',
    a: 'Ya. Satu akun bisa diakses dari HP, tablet, dan laptop secara bersamaan. Tidak ada batasan jumlah perangkat per akun.',
  },
  {
    q: 'Bagaimana cara menghapus akun TernakOS secara permanen?',
    a: 'Untuk menghapus akun, hubungi tim support TernakOS via WhatsApp atau email. Tim kami akan memproses penghapusan data sesuai kebijakan privasi yang berlaku.',
  },
  {
    q: 'Apakah TernakOS GDPR compliant atau mengikuti regulasi perlindungan data Indonesia?',
    a: 'TernakOS mengikuti prinsip-prinsip perlindungan data pribadi sesuai regulasi Indonesia (UU PDP). Data pribadi pengguna hanya digunakan untuk keperluan operasional platform.',
  },
  {
    q: 'Apakah TernakOS memiliki SLA (Service Level Agreement) uptime server?',
    a: 'TernakOS menggunakan infrastruktur Supabase yang memiliki uptime tinggi dengan monitoring 24/7. Detail SLA tersedia untuk paket Business.',
    link: '/harga',
  },
  {
    q: 'Bagaimana cara menghubungi support TernakOS jika ada bug atau error?',
    a: 'Hubungi tim TernakOS via WhatsApp yang tersedia di halaman utama atau melalui email support. Laporkan bug dengan screenshot dan deskripsi langkah reproduksi untuk penanganan lebih cepat.',
  },
  {
    q: 'Apakah TernakOS melakukan update atau pembaruan fitur secara berkala?',
    a: 'Ya. TernakOS dirilis pembaruan fitur secara reguler. Update berjalan otomatis di background — tidak perlu download apapun. Pengguna akan dinotifikasi tentang fitur baru melalui notifikasi in-app.',
  },
  {
    q: 'Apakah karyawan yang diundang bisa dihapus akses-nya dari TernakOS?',
    a: 'Ya. Owner bisa mencabut akses anggota tim kapan saja dari menu Tim. Setelah dicabut, anggota tersebut tidak bisa lagi login ke bisnis tersebut.',
    link: '/fitur',
  },
  {
    q: 'Bagaimana cara membuat kode undangan untuk karyawan baru di TernakOS?',
    a: 'Menu Tim → Generate Kode. Sistem membuat kode 6 karakter unik yang berlaku 7 hari. Bagikan kode ini ke karyawan baru dan mereka daftar menggunakan kode tersebut — otomatis terhubung ke bisnis kamu dengan role yang sudah ditentukan.',
    link: '/fitur',
  },
  {
    q: 'Apakah role pengguna di TernakOS bisa diubah setelah mereka bergabung?',
    a: 'Ya. Owner bisa mengubah role anggota tim kapan saja dari menu Tim. Perubahan berlaku segera setelah disimpan.',
    link: '/fitur',
  },
  {
    q: 'Apakah ada limit jumlah transaksi per bulan di TernakOS?',
    a: 'Tidak ada limit transaksi di semua paket TernakOS. Kamu bisa catat transaksi sebanyak yang dibutuhkan tanpa khawatir kena batasan.',
    link: '/harga',
  },
  {
    q: 'Bagaimana TernakOS menangani error atau kegagalan saat input data?',
    a: 'TernakOS memiliki validasi data berlapis: validasi di form (real-time) dan validasi di server (sebelum data disimpan ke database). Jika ada error, pesan yang jelas ditampilkan agar kamu bisa memperbaiki input.',
  },
  {
    q: 'Apakah TernakOS bisa diintegrasikan dengan sistem ERP atau akuntansi yang sudah ada?',
    a: 'Integrasi langsung dengan ERP/akuntansi pihak ketiga belum tersedia. Export data dari TernakOS bisa diimport manual ke sistem lain. API untuk integrasi ada dalam roadmap paket Business.',
    link: '/harga',
  },
  {
    q: 'Bagaimana cara memindahkan data dari Excel atau catatan manual ke TernakOS?',
    a: 'Saat ini import data dari Excel belum tersedia. Kamu bisa mulai fresh dari TernakOS untuk data baru, atau gunakan fitur backfill untuk memasukkan data historis penting secara manual.',
  },
  {
    q: 'Apakah TernakOS mendukung multiple bahasa selain Bahasa Indonesia?',
    a: 'TernakOS saat ini tersedia dalam Bahasa Indonesia. Dukungan bahasa Inggris ada dalam roadmap untuk mendukung pengguna internasional.',
  },
  {
    q: 'Bagaimana cara reset data bisnis jika ingin mulai dari awal di TernakOS?',
    a: 'Untuk reset data bisnis, hubungi tim support TernakOS. Tim akan membantu proses penghapusan data bisnis tertentu sesuai kebutuhan kamu.',
  },
  {
    q: 'Apakah TernakOS menggunakan teknologi yang terbukti untuk keamanan data?',
    a: 'Ya. TernakOS dibangun di atas Supabase (PostgreSQL) — infrastruktur database yang sama yang digunakan oleh ribuan perusahaan teknologi global. Row Level Security (RLS) adalah standar keamanan enterprise.',
  },
  {
    q: 'Bagaimana cara melihat riwayat aktivitas login ke akun TernakOS?',
    a: 'Riwayat login tersedia di menu Akun → Keamanan. Kamu bisa lihat kapan dan dari perangkat mana terakhir kali akun diakses.',
  },
  {
    q: 'Apakah ada diskon untuk berlangganan TernakOS tahunan?',
    a: 'Ya. Berlangganan tahunan mendapat diskon dibanding bayar bulanan. Cek halaman harga untuk detail promo dan perbandingan harga.',
    link: '/harga',
  },
  {
    q: 'Bagaimana cara mendapatkan invoice pembayaran berlangganan TernakOS untuk keperluan pembukuan?',
    a: 'Invoice pembayaran tersedia di menu Akun → Riwayat Tagihan. Kamu bisa download atau cetak invoice untuk keperluan reimbursement atau pembukuan bisnis.',
  },
  {
    q: 'Apakah TernakOS mendukung notifikasi push di HP Android?',
    a: 'TernakOS mendukung notifikasi in-app yang muncul saat kamu membuka aplikasi. Notifikasi push native untuk browser sedang dalam pengembangan.',
  },
  {
    q: 'Berapa lama waktu yang dibutuhkan untuk menguasai semua fitur TernakOS?',
    a: 'Fitur dasar (catat transaksi, lihat dashboard) bisa dikuasai dalam 30 menit pertama. Fitur lanjutan seperti analitik dan multi-kandang biasanya dikuasai dalam 1-2 minggu penggunaan aktif.',
  },
  {
    q: 'Apakah TernakOS menyediakan panduan atau tutorial untuk pengguna baru?',
    a: 'Ya. Onboarding wizard memandu kamu langkah demi langkah saat pertama kali daftar. Panduan singkat tersedia di setiap fitur utama. Tim support juga siap membantu via WhatsApp.',
  },
  {
    q: 'Apakah ada fitur Recycle Bin untuk memulihkan data yang tidak sengaja dihapus?',
    a: 'Ada. TernakOS menggunakan sistem soft-delete — data yang dihapus tidak benar-benar hilang. Fitur Recycle Bin di menu Akun memungkinkan kamu melihat dan memulihkan data: transaksi, kandang, RPA, dan pengiriman.',
    link: '/fitur',
  },
  {
    q: 'Bagaimana cara switch atau ganti bisnis aktif di TernakOS jika punya beberapa bisnis?',
    a: 'Di pojok kiri bawah (mobile) atau sidebar (desktop), ada Business Switcher yang menampilkan semua bisnis kamu. Klik nama bisnis yang ingin diaktifkan untuk pindah konteks. Data langsung berganti ke bisnis yang dipilih.',
  },
  {
    q: 'Bagaimana cara menghubungkan akun TernakOS dengan nomor WhatsApp bisnis?',
    a: 'Nomor WhatsApp disimpan di profil bisnis kamu. Fitur kirim nota dan notifikasi WA menggunakan nomor yang tersimpan ini secara otomatis saat kamu klik tombol WA.',
  },
  {
    q: 'Apakah TernakOS mendukung dark mode atau tema tampilan yang berbeda?',
    a: 'TernakOS hadir dalam tampilan dark mode modern yang konsisten di semua halaman. Selain itu, tersedia ThemePicker dengan 8 pilihan warna aksen yang bisa dikustomisasi sesuai preferensi.',
  },
  {
    q: 'Apakah transaksi yang diinput oleh staf bisa diverifikasi atau diapprove oleh owner?',
    a: 'Saat ini tidak ada fitur approval workflow. Semua transaksi yang diinput staf langsung tersimpan. Owner bisa melihat semua aktivitas tim di riwayat transaksi dan audit log.',
  },
  {
    q: 'Bagaimana cara memastikan karyawan tidak bisa melihat data gaji atau keuangan sensitif?',
    a: 'Role Staff tidak memiliki akses ke menu Cash Flow, laporan keuangan, dan data gaji. Role View Only hanya bisa lihat data operasional. Owner yang mengontrol siapa mendapat akses apa.',
    link: '/fitur',
  },
  {
    q: 'Apa perbedaan paket Starter, Pro, dan Business di TernakOS?',
    a: 'Starter: gratis selamanya, 1 kandang aktif, hanya owner (tidak bisa undang tim). Pro: berbayar, 2 kandang, hingga 3 anggota tim, analitik lanjutan. Business: unlimited kandang, unlimited tim, TernakBot AI, export laporan, dan priority support.',
    link: '/harga',
  },
  {
    q: 'Apakah TernakOS cocok untuk koperasi peternak yang melayani banyak anggota?',
    a: 'Paket Business mendukung skenario ini. Koperasi bisa onboard dengan akun owner dan undang anggota peternak sebagai tim. Setiap anggota bisa input data kandang masing-masing dalam satu ekosistem bisnis.',
    link: '/harga',
  },
  {
    q: 'Bagaimana cara memperbarui informasi nama bisnis dan alamat di TernakOS?',
    a: 'Buka menu Akun → Profil Bisnis. Edit nama bisnis, alamat, area operasi, dan informasi lainnya lalu simpan. Perubahan berlaku segera.',
  },
  {
    q: 'Apakah TernakOS pernah mengalami downtime atau gangguan layanan?',
    a: 'Seperti semua platform cloud, sesekali ada maintenance terjadwal yang biasanya dilakukan di luar jam sibuk (malam hari). Status layanan TernakOS dipantau secara real-time.',
  },
  {
    q: 'Bagaimana cara migrasi data dari TernakOS ke platform lain jika suatu saat ingin pindah?',
    a: 'TernakOS menghormati kepemilikan data kamu. Fitur export data tersedia. Untuk kebutuhan migrasi penuh, tim support akan membantu prosesnya.',
  },
  {
    q: 'Apakah TernakOS menggunakan AI atau machine learning untuk analisis bisnis?',
    a: 'Ya. TernakBot AI Assistant tersedia eksklusif di paket Business — unlimited sesi, Analisis Performa, Prediksi Hasil, dan AI Audit Log. Kamu bisa tanya langsung: "Siapa pembeli yang paling sering nunggak?" atau "Bagaimana tren margin bulan ini?" dan TernakBot menjawab berdasarkan data bisnismu.',
    link: '/fitur',
  },
  {
    q: 'Bagaimana cara mengaktifkan kembali akun TernakOS yang sudah tidak aktif?',
    a: 'Login dengan akun lama kamu di ternakos.com. Jika masa langganan sudah habis, pilih paket baru di menu Akun → Langganan dan lakukan pembayaran. Akses penuh kembali aktif segera.',
    link: '/login',
  },
  {
    q: 'Apakah TernakOS mendukung pencatatan data dalam mata uang selain Rupiah?',
    a: 'Saat ini TernakOS menggunakan Rupiah (IDR) sebagai satu-satunya mata uang. Dukungan multi-currency untuk transaksi ekspor-impor ada dalam roadmap jangka panjang.',
  },
]
