export const broker_telur = [
  {
    q: 'Apa itu modul Broker Telur di TernakOS dan siapa yang cocok menggunakannya?',
    a: 'Modul Broker Telur TernakOS dirancang untuk pedagang dan distributor telur: dari pedagang pasar tradisional hingga grosir skala besar. Fitur utamanya mencakup stok per grade (A/B/C/BS), POS kasir cepat, FIFO otomatis, piutang tempo, dan laporan profitabilitas per grade.',
    link: '/fitur',
  },
  {
    q: 'Bagaimana cara mencatat stok telur masuk per grade (A, B, C, BS) di TernakOS?',
    a: 'Buka menu Gudang → Tambah Stok Telur → pilih grade → input batch: jumlah krat/pcs, harga beli per unit, dan tanggal masuk. Setiap grade dikelola sebagai item terpisah dengan FIFO masing-masing.',
    link: '/fitur',
  },
  {
    q: 'Apakah TernakOS mendukung FIFO untuk stok telur dari banyak supplier sekaligus?',
    a: 'Ya. Setiap batch stok telur masuk dengan informasi supplier dan tanggal. Saat ada penjualan, sistem otomatis mendebet dari batch tertua (FIFO) per grade untuk meminimalkan risiko telur expired tidak terjual.',
    link: '/fitur',
  },
  {
    q: 'Bagaimana cara input penjualan telur eceran vs partai di TernakOS?',
    a: 'Gunakan fitur POS untuk penjualan eceran cepat (pilih grade, qty, langsung checkout). Untuk penjualan partai ke toko/agen, buat invoice dengan detail pelanggan, grade, jumlah, dan payment terms (lunas atau tempo).',
    link: '/fitur',
  },
  {
    q: 'Apakah ada fitur POS kasir untuk penjualan telur cepat di TernakOS?',
    a: 'Ya. Fitur POS broker telur didesain untuk transaksi kasir yang cepat: pilih grade, input jumlah, dan checkout dalam hitungan detik. Stok langsung berkurang dan nota penjualan dibuat otomatis.',
    link: '/fitur',
  },
  {
    q: 'Bagaimana TernakOS menghitung HPP telur dengan metode FIFO?',
    a: 'HPP FIFO dihitung otomatis saat ada penjualan: sistem menggunakan harga beli dari batch yang masuk paling awal. Jika batch pertama habis, sistem lanjut ke batch berikutnya secara otomatis. HPP tampil di detail transaksi dan laporan profit per grade.',
    link: '/fitur',
  },
  {
    q: 'Apakah bisa menetapkan harga jual berbeda per grade telur di TernakOS?',
    a: 'Ya. Setiap grade telur memiliki profil harga jual tersendiri: harga eceran dan harga partai bisa berbeda. Harga juga bisa dioverride per transaksi jika ada negosiasi khusus dengan pembeli.',
    link: '/fitur',
  },
  {
    q: 'Bagaimana cara mencatat stok telur rusak atau pecah agar tidak mempengaruhi laporan?',
    a: 'Gunakan fitur penyesuaian stok (stock adjustment) di menu Gudang. Pilih kategori "Rusak/Pecah", input jumlah yang rusak per grade, dan simpan. Data kerugian tercatat di riwayat mutasi stok untuk keperluan audit.',
    link: '/fitur',
  },
  {
    q: 'Apakah TernakOS mendukung piutang tempo dari toko mitra pembeli telur?',
    a: 'Ya. Saat input penjualan, pilih payment terms "Tempo" dan isi tanggal jatuh tempo. Transaksi masuk ke dashboard piutang. Catat pembayaran masuk kapan saja dan saldo piutang update real-time.',
    link: '/fitur',
  },
  {
    q: 'Bagaimana cara memantau piutang telur yang jatuh tempo dari banyak pelanggan?',
    a: 'Dashboard piutang menampilkan total outstanding per pelanggan, status (belum jatuh tempo / jatuh tempo / lewat jatuh tempo), dan histori pembayaran. Notifikasi in-app dikirim saat piutang mendekati tanggal jatuh tempo.',
    link: '/fitur',
  },
  {
    q: 'Apakah ada notifikasi otomatis saat stok telur per grade hampir habis?',
    a: 'Ya. TernakOS menampilkan indikator stok per grade: Aman (hijau), Cukup (kuning), Menipis (merah). Notifikasi in-app dikirim saat stok grade tertentu masuk zona menipis agar kamu bisa segera order ke supplier.',
    link: '/fitur',
  },
  {
    q: 'Bagaimana cara mencatat pembelian telur dari banyak supplier peternak sekaligus?',
    a: 'Database supplier broker telur menyimpan profil lengkap tiap peternak/pengepul: nama, kontak WA, dan histori transaksi. Saat input stok masuk, pilih supplier dari daftar dan sistem merekam riwayat pembelian per supplier.',
    link: '/fitur',
  },
  {
    q: 'Apakah TernakOS bisa mencetak nota atau invoice penjualan telur ke pelanggan?',
    a: 'Ya. Setiap penjualan menghasilkan invoice bernomor urut dengan detail lengkap: grade, jumlah, harga per unit, dan total. Invoice bisa langsung dikirim ke pelanggan via WhatsApp dari dalam aplikasi.',
    link: '/fitur',
  },
  {
    q: 'Bagaimana cara melihat margin keuntungan per grade telur di TernakOS?',
    a: 'Laporan profitabilitas per grade menampilkan: harga jual rata-rata, HPP FIFO, margin per unit, dan total profit per periode. Kamu bisa identifikasi grade mana yang paling menguntungkan dan mana yang perlu review harga jual.',
    link: '/fitur',
  },
  {
    q: 'Apakah TernakOS cocok untuk pedagang telur skala pasar tradisional maupun grosir?',
    a: 'Ya. Paket Starter cocok untuk pedagang pasar skala kecil (1 gudang, POS dasar). Paket Pro dan Business mendukung operasi grosir skala lebih besar dengan multi-pengguna, laporan lanjutan, dan manajemen piutang komprehensif.',
    link: '/harga',
  },
  {
    q: 'Bagaimana cara menghitung profit bersih broker telur per bulan di TernakOS?',
    a: 'Menu Laporan menampilkan profit bersih per periode: Total Pendapatan − HPP FIFO − Biaya Operasional. Filter per bulan untuk melihat tren profitabilitas, breakdown per grade, dan perbandingan bulan ke bulan.',
    link: '/fitur',
  },
  {
    q: 'Apakah ada laporan tren harga telur per grade per periode di TernakOS?',
    a: 'Laporan stok dan penjualan menampilkan histori harga beli per grade dari berbagai supplier dan periode. Kamu bisa analisis tren harga untuk menentukan waktu terbaik beli stok dalam jumlah besar.',
    link: '/fitur',
  },
  {
    q: 'Apa perbedaan modul Broker Telur dengan modul Agen Sembako di TernakOS?',
    a: 'Modul Broker Telur dioptimalkan untuk telur: manajemen grade (A/B/C/BS), satuan krat/pcs, dan tren harga per grade. Modul Agen Sembako lebih generik untuk multi-item (beras, minyak, tepung, dll) dengan manajemen kategori dan satuan yang lebih fleksibel.',
    link: '/fitur',
  },
  {
    q: 'Bagaimana cara tracking supplier telur terpercaya berdasarkan histori kualitas?',
    a: 'Setiap profil supplier menyimpan histori transaksi lengkap: tanggal, grade, jumlah, harga, dan catatan kualitas. Kamu bisa review supplier mana yang konsisten kirim grade A berkualitas dan mana yang sering ada complaint.',
    link: '/fitur',
  },
  {
    q: 'Apakah TernakOS mendukung pengiriman telur ke banyak toko dalam satu hari?',
    a: 'Ya. Setiap penjualan bisa dilengkapi data pengiriman: sopir, kendaraan, dan status (disiapkan/dikirim/tiba). Sopir bisa update status pengiriman dari HP mereka. Kamu bisa pantau semua pengiriman aktif dalam satu tampilan.',
    link: '/fitur',
  },
]
