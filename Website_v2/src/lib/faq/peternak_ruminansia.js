export const peternak_ruminansia = [
  // ── Sapi Fattening ────────────────────────────────────────────
  {
    q: 'Apakah TernakOS mendukung manajemen batch sapi potong penggemukan (fattening)?',
    a: 'Ya. TernakOS menyediakan modul batch fattening untuk sapi potong: buat batch baru (chick-in sapi), catat pertumbuhan harian, pantau ADG dan FCR per batch, catat penjualan ekor per ekor atau per batch, dan tutup batch dengan laporan laba-rugi final.',
    link: '/fitur',
  },
  {
    q: 'Bagaimana cara menghitung ADG (Average Daily Gain) sapi secara otomatis di TernakOS?',
    a: 'ADG dihitung otomatis dari data penimbangan berkala yang kamu input per ekor. TernakOS membandingkan bobot masuk dengan bobot terkini dibagi jumlah hari, lalu menampilkan ADG per ekor dan rata-rata per batch.',
    link: '/fitur',
  },
  {
    q: 'Apa itu FCR untuk sapi potong dan bagaimana TernakOS menghitungnya per batch?',
    a: 'FCR sapi = Total Pakan Terpakai (kg) ÷ Total Kenaikan Bobot (kg). TernakOS menghitung FCR per batch secara real-time dari data pakan harian dan penimbangan. Semakin rendah FCR, semakin efisien konversi pakan menjadi daging.',
    link: '/fitur',
  },
  {
    q: 'Bagaimana cara menghitung R/C ratio dan BEP per batch sapi fattening di TernakOS?',
    a: 'R/C ratio = Total Revenue ÷ Total Cost per batch. BEP per kg = Total Biaya Batch ÷ Total Kenaikan Bobot. Keduanya dihitung otomatis dari data biaya dan penjualan yang kamu catat, dan tampil di laporan penutupan batch.',
    link: '/fitur',
  },
  {
    q: 'Apakah ada kartu ternak digital individual per ekor sapi di TernakOS?',
    a: 'Ada. Setiap ekor sapi memiliki kartu ternak digital lengkap: ear tag, tanggal masuk, bobot masuk, riwayat penimbangan, grafik ADG, dan histori kesehatan. Kamu bisa lacak performa tiap ekor secara individual.',
    link: '/fitur',
  },
  {
    q: 'Bagaimana cara mencatat riwayat kesehatan, treatment, dan obat per ekor sapi?',
    a: 'Di kartu ternak individual, buka tab Kesehatan. Catat: tanggal sakit, gejala, diagnosis, treatment/obat yang diberikan, dan biaya. Log kesehatan per ekor tersimpan dan terintegrasi ke total biaya batch.',
    link: '/fitur',
  },
  {
    q: 'Bagaimana cara menutup batch sapi dan melihat laporan laba-rugi finalnya?',
    a: 'Buka batch aktif → Tutup Batch → input data penjualan: tanggal, jumlah ekor terjual, bobot, harga per kg/ekor, dan pembeli. TernakOS otomatis menghitung total pendapatan, total biaya, HPP/kg, laba-rugi, FCR final, dan R/C ratio.',
    link: '/fitur',
  },
  {
    q: 'Apakah ada visualisasi denah kandang untuk distribusi ternak sapi per kandang?',
    a: 'Ya. Denah kandang interaktif menampilkan distribusi sapi per pen/kandang dengan dot warna berdasarkan tier ADG — hijau (ADG bagus), kuning (sedang), merah (perlu perhatian). Membantu identifikasi ekor yang butuh intervensi.',
    link: '/fitur',
  },

  // ── Sapi Breeding ─────────────────────────────────────────────
  {
    q: 'Apakah TernakOS mendukung peternak sapi breeding (pembibitan)?',
    a: 'Ya. Modul sapi breeding mencakup: database herd dengan silsilah dam/sire, manajemen reproduksi (IB/kawin alam), tracking status kehamilan, pencatatan kelahiran pedet, conception rate, dan calving interval otomatis.',
    link: '/fitur',
  },
  {
    q: 'Bagaimana cara mencatat IB (Inseminasi Buatan) dan status kehamilan sapi betina?',
    a: 'Di kartu ternak betina, buka tab Reproduksi → Tambah Event IB. Input tanggal IB, nama inseminator, dan semen yang digunakan. Setelah 3 bulan, update status: Bunting (konfirmasi kehamilan) atau Tidak Bunting (perlu IB ulang).',
    link: '/fitur',
  },
  {
    q: 'Apa itu conception rate dan calving interval, dan bagaimana TernakOS menghitungnya?',
    a: 'Conception Rate = (Jumlah Bunting ÷ Jumlah IB) × 100%. Calving Interval = rata-rata jarak antar kelahiran per induk. TernakOS menghitung keduanya otomatis dari riwayat IB dan kelahiran yang kamu catat, sebagai KPI produktivitas herd.',
    link: '/fitur',
  },
  {
    q: 'Bagaimana cara mencatat kelahiran pedet beserta data silsilah dam/sire di TernakOS?',
    a: 'Dari kartu induk yang bunting, buka tab Reproduksi → Catat Kelahiran. Input tanggal lahir, jumlah pedet, bobot lahir, dan jenis kelamin. Pedet otomatis terdaftar sebagai ternak baru dengan silsilah dam/sire yang terhubung.',
    link: '/fitur',
  },
  {
    q: 'Apakah ada laporan performa farm breeding sapi di TernakOS?',
    a: 'Ada. Laporan farm breeding menampilkan: conception rate herd, calving interval rata-rata, jumlah kelahiran per periode, sex ratio pedet, dan efisiensi reproduksi keseluruhan. Data ini membantu evaluasi produktivitas herd secara berkala.',
    link: '/fitur',
  },

  // ── Kambing & Domba ───────────────────────────────────────────
  {
    q: 'Apakah TernakOS mendukung peternak kambing potong dan domba potong?',
    a: 'Ya. TernakOS menyediakan modul terpisah untuk kambing potong (fattening dan breeding) dan domba potong (fattening dan breeding). Fitur-fiturnya serupa dengan sapi: batch management, kartu ternak individual, ADG, FCR, R/C ratio, dan laporan laba-rugi.',
    link: '/fitur',
  },
  {
    q: 'Apakah modul kambing fattening dan domba fattening sama dengan sapi fattening?',
    a: 'Secara fungsional sangat mirip — batch lifecycle, kartu ternak individual, ADG, FCR, denah kandang, stok pakan, penjualan per ekor atau massal, dan laporan batch. Perbedaan utama ada di satuan target bobot dan referensi standar yang disesuaikan per spesies.',
    link: '/fitur',
  },
  {
    q: 'Bagaimana cara mengelola batch domba menjelang Idul Adha di TernakOS?',
    a: 'Buat batch fattening domba dengan target tanggal panen sebelum Idul Adha. Pantau ADG harian untuk memastikan domba mencapai bobot target (minimal 25 kg). TernakOS menampilkan estimasi bobot panen berdasarkan tren ADG saat ini.',
    link: '/fitur',
  },
  {
    q: 'Apakah TernakOS mendukung peternak kambing breeding (pembibitan)?',
    a: 'Ya. Modul kambing breeding mencakup: kartu ternak individu dengan silsilah, pencatatan IB atau kawin alam, tracking status kehamilan, pencatatan kelahiran cempe, conception rate, dan calving interval otomatis.',
    link: '/fitur',
  },
  {
    q: 'Bagaimana pencatatan reproduksi kambing breeding (IB dan kawin alam) di TernakOS?',
    a: 'Di kartu ternak betina → tab Reproduksi → Tambah Event. Pilih tipe: IB (input inseminator dan semen) atau Kawin Alam (input pejantan dari database herd). Update status kehamilan setelah pemeriksaan dan catat kelahiran saat tiba.',
    link: '/fitur',
  },
  {
    q: 'Apakah bisa mengelola kandang kambing dan domba sekaligus dalam satu akun?',
    a: 'Bisa. Satu akun TernakOS bisa memiliki batch kambing fattening, kambing breeding, domba fattening, dan domba breeding secara bersamaan. Setiap batch terpisah dengan laporan mandiri, tapi bisa dipantau dari dashboard utama.',
    link: '/fitur',
  },
  {
    q: 'Berapa batas jumlah ternak aktif per paket di TernakOS untuk ruminansia?',
    a: 'Kuota jumlah ternak aktif per paket dikonfigurasi secara dinamis di admin TernakOS dan bisa berubah. Untuk informasi kuota terkini, cek halaman harga atau hubungi tim support kami.',
    link: '/harga',
  },

  // ── Kambing Perah ─────────────────────────────────────────────
  {
    q: 'Apakah TernakOS mendukung peternak kambing perah (susu)?',
    a: 'Ya. TernakOS memiliki modul kambing perah dengan fitur: database kambing per status laktasi, recording produksi susu harian tiga sesi (pagi, siang, sore), tracking yield per ekor dan fat%, inventori produk susu, dan penjualan susu ke pelanggan.',
    link: '/fitur',
  },
  {
    q: 'Bagaimana cara mencatat produksi susu kambing per sesi harian (pagi, siang, sore)?',
    a: 'Buka menu Produksi → pilih tanggal → input data tiap sesi: jumlah kambing yang diperah, yield total (liter), dan fat% jika tersedia. TernakOS merangkum total produksi harian dan menampilkan tren per ekor.',
    link: '/fitur',
  },
  {
    q: 'Apa yang dimaksud dengan fat% dan yield liter di modul kambing perah TernakOS?',
    a: 'Yield liter adalah volume susu yang berhasil diproduksi per sesi pemerahan. Fat% (kadar lemak susu) adalah indikator kualitas — kambing perah berkualitas biasanya memiliki fat% antara 3-5%. Keduanya bisa dicatat per sesi di TernakOS.',
    link: '/fitur',
  },
  {
    q: 'Apakah ada manajemen inventori produk susu kambing di TernakOS?',
    a: 'Ya. Modul inventori mencatat stok produk susu: susu segar, susu pasteurisasi, keju, yoghurt, atau produk olahan lainnya. Setiap produksi dicatat masuk ke stok dan setiap penjualan mengurangi stok otomatis.',
    link: '/fitur',
  },
  {
    q: 'Apakah TernakOS mendukung penjualan susu kambing langsung ke pelanggan individual?',
    a: 'Ya. Menu Penjualan kambing perah mencatat transaksi susu ke pelanggan individual dengan database customer. Kamu bisa lihat histori pembelian per pelanggan, pelanggan mana yang paling loyal, dan total omzet penjualan susu.',
    link: '/fitur',
  },
  {
    q: 'Apakah laporan finansial kambing perah sudah tersedia di TernakOS?',
    a: 'Laporan finansial lengkap untuk kambing perah sedang dalam pengembangan dan akan segera tersedia. Saat ini fitur produksi, inventori, dan penjualan sudah berjalan. Hubungi tim kami untuk mendapat notifikasi saat laporan finansial live.',
    link: '/fitur',
  },

  // ── Umum Ruminansia ───────────────────────────────────────────
  {
    q: 'Apakah TernakOS mendukung peternak sapi perah?',
    a: 'Modul peternak sapi perah sedang dalam pengembangan. Kamu bisa mendaftar di waiting list untuk mendapat akses pertama ketika fitur tersedia.',
    link: '/harga',
  },
  {
    q: 'Bagaimana cara mengundang anak kandang ruminansia ke TernakOS dan membagi tugas harian?',
    a: 'Menu Tim → Generate Kode → bagikan kode 6 digit ke anak kandang. Setelah bergabung, Owner bisa assign tugas harian dari menu Tugas per kandang/batch. Anak kandang lihat dan update status tugas dari HP mereka.',
    link: '/fitur',
  },
  {
    q: 'Apakah kuota jumlah ternak aktif di TernakOS bisa berubah-ubah?',
    a: 'Ya. Kuota jumlah ternak aktif dikonfigurasi secara dinamis oleh admin TernakOS dan bisa disesuaikan. Ini berarti kuota bisa berbeda antar pengguna atau berubah seiring upgrade paket. Cek halaman harga untuk info terkini.',
    link: '/harga',
  },
  {
    q: 'Apa perbedaan fitur peternak broiler dengan peternak sapi/kambing/domba di TernakOS?',
    a: 'Peternak broiler fokus pada siklus kandang (DOC → panen), FCR, IP Score, dan vaksinasi jadwal Cobb500. Peternak ruminansia fokus pada kartu ternak individual (ADG, kesehatan per ekor), manajemen reproduksi (breeding), R/C ratio, BEP, dan batch lifecycle yang lebih panjang.',
    link: '/fitur',
  },
]
