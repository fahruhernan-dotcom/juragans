export const peternak_ayam = [
  {
    q: 'Apa itu kalkulator FCR di TernakOS dan bagaimana cara menggunakannya?',
    a: 'FCR (Feed Conversion Ratio) mengukur efisiensi pakan: berapa kg pakan dibutuhkan untuk menghasilkan 1 kg bobot ayam. Di TernakOS, FCR dihitung otomatis setiap kali kamu input data harian (pakan terpakai + bobot sample). Semakin rendah FCR, semakin efisien dan menguntungkan kandang kamu.',
    link: '/fitur',
  },
  {
    q: 'Bagaimana cara menghitung Indeks Performa (IP) kandang ayam broiler secara otomatis di TernakOS?',
    a: 'IP dihitung otomatis saat siklus selesai: IP = (Survival Rate × Bobot Rata-rata × 100) ÷ (FCR × Umur Panen). TernakOS menampilkan IP dengan benchmark: >400 Sangat Baik, 300-400 Baik, <300 Perlu Evaluasi.',
    link: '/fitur',
  },
  {
    q: 'Bagaimana cara mencatat kematian harian atau mortalitas ayam broiler di TernakOS?',
    a: 'Buka Input Harian → pilih siklus aktif → isi form: tanggal, jumlah mati hari ini, pakan terpakai (kg), dan bobot sample (gram). Data mortalitas kumulatif terupdate otomatis di dashboard siklus.',
    link: '/fitur',
  },
  {
    q: 'Apakah TernakOS mendukung pencatatan vaksinasi ayam broiler per siklus?',
    a: 'Ya. Modul Vaksinasi memungkinkan pencatatan: jenis vaksin, tanggal, dosis, dan tenaga pelaksana berdasarkan jadwal standar Cobb500 (ND+IB, Gumboro, booster). Data ini terintegrasi ke laporan biaya siklus.',
    link: '/fitur',
  },
  {
    q: 'Bagaimana cara menghitung HPP per kg ayam broiler saat panen di TernakOS?',
    a: 'HPP per kg = (Biaya DOC + Biaya Pakan + Biaya Obat/Vaksin + Biaya TK + Biaya Lainnya) ÷ Total Bobot Panen. TernakOS menghitung ini otomatis dari semua biaya yang dicatat selama siklus.',
    link: '/fitur',
  },
  {
    q: 'Apakah TernakOS mendukung peternak yang bekerja sama dengan perusahaan INTI (kemitraan)?',
    a: 'Ya. TernakOS mendukung model bisnis kemitraan penuh, mitra pakan, dan mitra sapronak. Kamu bisa input nama INTI (CP Prima, Japfa, Charoen Pokphand, dll), harga kontrak, dan sistem deducting sapronak otomatis saat catat panen.',
    link: '/fitur',
  },
  {
    q: 'Bagaimana cara mengelola stok pakan ayam (starter, grower, finisher) di TernakOS?',
    a: 'Menu Pakan menampilkan stok per jenis pakan: Starter, Grower, Finisher, Konsentrat, Jagung, Dedak. Status stok: Aman (≥500 kg), Cukup (100-499 kg), Menipis (<100 kg). Catat pembelian dan pemakaian dari sini.',
    link: '/fitur',
  },
  {
    q: 'Apakah ada notifikasi otomatis saat stok pakan ayam hampir habis?',
    a: 'Ya. Saat stok pakan turun di bawah 100 kg untuk jenis tertentu, TernakOS menampilkan notifikasi in-app dan indikator merah di dashboard. Berguna agar tidak kehabisan pakan di tengah siklus.',
    link: '/fitur',
  },
  {
    q: 'Apakah TernakOS bisa dipakai untuk peternak ayam layer (petelur) juga?',
    a: 'Dashboard peternak layer sedang dalam pengembangan. Saat ini peternak ayam petelur bisa mendaftar di waiting list untuk mendapat akses pertama ketika fitur tersedia.',
    link: '/harga',
  },
  {
    q: 'Bagaimana cara mencatat panen ayam broiler dan menghitung total pendapatan panen di TernakOS?',
    a: 'Buka siklus aktif → Tutup Siklus → isi data panen: tanggal, jumlah ekor panen, total bobot, harga per kg, dan tipe pembeli (broker/RPA/pasar). TernakOS langsung menghitung pendapatan bersih dan profit siklus.',
    link: '/fitur',
  },
  {
    q: 'Bagaimana cara mendaftarkan anak kandang (pekerja) dan mencatat gaji mereka di TernakOS?',
    a: 'Menu Tim → Tambah Anggota → undang via kode 6 digit dengan role "Pekerja". Untuk penggajian, menu Anak Kandang mendukung sistem gaji: flat bulanan, bonus panen, atau kombinasi keduanya (bonus otomatis jika FCR di bawah target).',
    link: '/fitur',
  },
  {
    q: 'Apakah ada template input harian peternak ayam yang mudah digunakan dari HP?',
    a: 'Ya. Form input harian didesain untuk diselesaikan dalam 2 menit dari HP: isi mortalitas, pakan terpakai, dan bobot sample. Sistem otomatis menghitung FCR hari itu dan update grafik.',
    link: '/fitur',
  },
  {
    q: 'Bagaimana cara menghitung break-even point (BEP) peternak broiler dengan TernakOS?',
    a: 'BEP per kg = Total Biaya Siklus ÷ Total Bobot Panen. TernakOS menampilkan ini di laporan siklus. Bandingkan BEP dengan harga pasar terkini dari menu Harga Pasar untuk keputusan jual yang tepat.',
    link: '/fitur',
  },
  {
    q: 'Apakah TernakOS bisa dipakai untuk peternak mandiri yang tidak bermitra dengan perusahaan?',
    a: 'Sangat cocok. Model bisnis "Mandiri Murni" dan "Mandiri Semi" tersedia penuh di TernakOS. Kamu catat semua biaya sendiri dan menentukan harga jual berdasarkan harga pasar terkini.',
    link: '/fitur',
  },
  {
    q: 'Bagaimana cara membandingkan hasil panen siklus ini dengan siklus sebelumnya?',
    a: 'Menu Laporan Siklus menampilkan semua siklus selesai dengan KPI masing-masing: FCR, IP, survival rate, HPP per kg, dan profit bersih. Kamu bisa bandingkan performa antar siklus untuk evaluasi.',
    link: '/fitur',
  },
  {
    q: 'Apakah bisa memantau lebih dari satu kandang sekaligus di dashboard peternak TernakOS?',
    a: 'Bisa. Halaman beranda peternak menampilkan semua kandang aktif dalam bentuk kartu. Setiap kartu menampilkan ringkasan: umur ayam hari ini, FCR terkini, stok pakan, dan status siklus.',
    link: '/fitur',
  },
  {
    q: 'Bagaimana cara menghitung estimasi keuntungan peternak broiler sebelum panen selesai?',
    a: 'TernakOS menghitung estimasi profit real-time: (Estimasi Bobot Panen × Harga Jual Target) − Total Biaya Siklus Berjalan. Kamu bisa pantau apakah target keuntungan tercapai sebelum hari H panen.',
    link: '/fitur',
  },
  {
    q: 'Apakah TernakOS bisa dipakai untuk monitoring kandang ayam dari jarak jauh?',
    a: 'Ya. Karena TernakOS berbasis cloud, kamu bisa pantau semua dashboard dari mana saja: rumah, perjalanan, atau dari kota lain. Anak kandang input data dari lokasi kandang, kamu pantau dari mana saja.',
    link: '/fitur',
  },
  {
    q: 'Bagaimana cara mengundang manajer kandang untuk bisa akses TernakOS tanpa melihat data keuangan?',
    a: 'Undang via kode 6 digit dengan role "Manajer" (peternak). Manajer bisa input harian, buka/tutup siklus, catat vaksinasi, dan lihat laporan performa. Tetapi tidak bisa akses data keuangan sensitif dan tidak bisa undang anggota baru.',
    link: '/fitur',
  },
  {
    q: 'Apakah TernakOS bisa mendeteksi apakah FCR kandang saya sudah optimal atau perlu perbaikan?',
    a: 'Ya. TernakOS memberikan benchmark FCR: <1,5 (Sangat Baik), 1,5-1,7 (Baik), 1,7-1,9 (Cukup), >1,9 (Perlu Evaluasi). Benchmark IP juga tersedia untuk evaluasi menyeluruh performa siklus.',
    link: '/fitur',
  },
  {
    q: 'Apakah ada fitur untuk peternak menjual langsung ke broker via TernakOS?',
    a: 'Ya. TernakOS Market memungkinkan peternak listing stok ayam siap panen. Broker yang melihat listing bisa langsung menghubungi via WhatsApp untuk negosiasi harga.',
    link: '/fitur',
  },
]
