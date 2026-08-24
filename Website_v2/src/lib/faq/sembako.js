export const sembako = [
  {
    q: 'Bagaimana sistem FIFO (First In First Out) bekerja di TernakOS untuk agen sembako?',
    a: 'FIFO di TernakOS bekerja per batch produk. Saat ada penjualan, sistem otomatis mendebet stok dari batch yang masuk paling awal. Ini memastikan barang yang masuk pertama keluar pertama, mencegah stok expired mengendap di gudang.',
    link: '/fitur',
  },
  {
    q: 'Bisakah mengelola stok telur, beras, minyak goreng, dan sembako lainnya dalam satu dashboard?',
    a: 'Bisa. TernakOS mendukung multi-item sembako tanpa batas. Setiap produk memiliki profil lengkap: satuan (kg, sak, karton, liter), harga beli, harga jual, stok real-time, dan riwayat mutasi.',
    link: '/fitur',
  },
  {
    q: 'Bagaimana cara input stok masuk per batch dari supplier di TernakOS?',
    a: 'Buka menu Gudang → Tambah Stok → pilih produk → input batch baru: jumlah, harga beli per unit, dan tanggal masuk. Sistem otomatis membuat batch baru yang akan dikelola dengan metode FIFO.',
    link: '/fitur',
  },
  {
    q: 'Apakah stok sembako otomatis berkurang saat ada penjualan yang dicatat?',
    a: 'Ya. Setiap kali transaksi penjualan berhasil dicatat, stok produk yang terjual otomatis berkurang sesuai FIFO. Kamu tidak perlu update stok manual setelah setiap penjualan.',
    link: '/fitur',
  },
  {
    q: 'Bagaimana cara melihat produk sembako yang paling laris dalam satu bulan?',
    a: 'Menu Laporan menampilkan analitik penjualan per produk: total terjual, revenue, HPP, dan profit bersih. Kamu bisa sort berdasarkan volume atau nilai penjualan untuk identifikasi produk terlaris.',
    link: '/fitur',
  },
  {
    q: 'Apakah TernakOS mendukung multi-satuan untuk produk sembako (misalnya jual per kg tapi beli per sak)?',
    a: 'Ya. Setiap produk bisa memiliki satuan utama dan satuan sekunder dengan konversi otomatis. Contoh: beli per sak (50 kg), jual per kg — TernakOS menghitung konversinya otomatis.',
    link: '/fitur',
  },
  {
    q: 'Bagaimana cara mencatat faktur pembelian dari supplier sembako yang berisi banyak item sekaligus?',
    a: 'Fitur multi-item entry di menu Gudang memungkinkan kamu input puluhan item dalam satu faktur pembelian. Tidak perlu buat entri terpisah per produk.',
    link: '/fitur',
  },
  {
    q: 'Apakah ada alert stok minimum untuk produk sembako agar tidak kehabisan barang?',
    a: 'Ya. TernakOS menampilkan status stok per produk: Aman (hijau), Cukup (kuning), atau Menipis (merah + notifikasi). Kamu bisa set threshold minimum per produk sesuai kebutuhan.',
    link: '/fitur',
  },
  {
    q: 'Bagaimana cara menghitung HPP (Harga Pokok Penjualan) produk sembako dengan metode FIFO?',
    a: 'TernakOS menghitung HPP FIFO otomatis saat ada penjualan. HPP menggunakan harga dari batch pertama yang masuk. Jika batch pertama habis, sistem lanjut ke batch berikutnya secara otomatis.',
    link: '/fitur',
  },
  {
    q: 'Apakah TernakOS mendukung sistem harga grosir dan eceran yang berbeda untuk produk sembako?',
    a: 'Ya. Setiap produk bisa memiliki harga jual berbeda per tipe pelanggan. Fitur dual-pricing memungkinkan harga retail (eceran) dan harga partai (grosir) dikelola terpisah.',
    link: '/fitur',
  },
  {
    q: 'Bagaimana cara mencatat penjualan sembako dengan sistem tempo atau kredit ke toko mitra?',
    a: 'Pilih payment terms "Tempo" saat input penjualan dan isi tanggal jatuh tempo. Transaksi otomatis masuk ke dashboard piutang. Saat toko bayar, catat pembayaran dan saldo piutang update real-time.',
    link: '/fitur',
  },
  {
    q: 'Apakah TernakOS bisa mengelola piutang dari banyak toko atau agen sekaligus?',
    a: 'Bisa. Dashboard piutang menampilkan total outstanding per pelanggan, riwayat pembayaran, dan limit kredit. Kamu bisa monitor semua toko mitra dalam satu tampilan tanpa Excel.',
    link: '/fitur',
  },
  {
    q: 'Bagaimana cara menangani barang rusak atau expired di gudang sembako?',
    a: 'TernakOS memiliki fitur penyesuaian stok (stock adjustment) untuk mencatat pengurangan stok akibat barang rusak atau expired. Data ini tercatat di riwayat mutasi stok untuk keperluan audit.',
    link: '/fitur',
  },
  {
    q: 'Apakah TernakOS mendukung pengiriman sembako ke beberapa toko dalam satu hari?',
    a: 'Ya. Setiap penjualan bisa dilengkapi data pengiriman: sopir, kendaraan, dan status (dikirim/tiba). Kamu bisa catat multiple pengiriman per hari ke toko berbeda.',
    link: '/fitur',
  },
  {
    q: 'Bagaimana cara menghitung profit bersih agen sembako per bulan di TernakOS?',
    a: 'Menu Laporan menampilkan profit bersih: Total Pendapatan − HPP (FIFO) − Biaya Operasional − Biaya Gaji. Filter per periode bulan untuk melihat profit bulanan dengan detail breakdown.',
    link: '/fitur',
  },
  {
    q: 'Apakah ada fitur untuk mencatat retur barang dari pelanggan di TernakOS?',
    a: 'Saat ini retur dapat dicatat melalui penyesuaian stok manual dan penghapusan atau edit transaksi penjualan terkait. Fitur retur formal dengan alur kerja terstruktur ada dalam roadmap kami.',
  },
  {
    q: 'Bagaimana TernakOS membantu agen sembako mencegah selisih stok antara fisik dan sistem?',
    a: 'TernakOS menyediakan fitur Stok Opname untuk rekonsiliasi stok. Kamu input stok fisik hasil hitung ulang dan sistem menampilkan selisih per produk yang perlu disesuaikan.',
    link: '/fitur',
  },
  {
    q: 'Apakah bisa mencatat gaji atau komisi karyawan pengiriman sembako di TernakOS?',
    a: 'Ya. Modul Pegawai memungkinkan pencatatan data karyawan, gaji, dan payroll. Kamu bisa catat pembayaran gaji bulanan dan komisi per pengiriman.',
    link: '/fitur',
  },
  {
    q: 'Apakah TernakOS mendukung manajemen supplier bahan sembako dari berbagai daerah?',
    a: 'Ya. Database supplier mencatat nama, kontak, lokasi, dan riwayat pembelian per supplier. Kamu bisa lihat histori harga per supplier untuk negosiasi yang lebih baik.',
    link: '/fitur',
  },
  {
    q: 'Bagaimana cara melihat laporan penjualan sembako per periode untuk keperluan pajak?',
    a: 'Menu Laporan menampilkan ringkasan penjualan per periode dengan total omzet, HPP, dan profit bersih. Data ini bisa dijadikan dasar pelaporan pajak sederhana.',
    link: '/fitur',
  },
  {
    q: 'Apakah TernakOS bisa digunakan untuk toko sembako yang memiliki beberapa cabang?',
    a: 'Paket Business mendukung multi-pengguna dan konsolidasi laporan. Setiap cabang bisa dioperasikan oleh tim berbeda dengan akses yang dikontrol dari satu akun owner.',
    link: '/harga',
  },
  {
    q: 'Bagaimana cara input harga jual yang berbeda untuk pelanggan yang berbeda?',
    a: 'Kamu bisa set harga jual saat membuat invoice penjualan. Sistem dual-pricing mendukung harga retail dan grosir sebagai default, dan harga bisa dioverride per transaksi sesuai negosiasi.',
    link: '/fitur',
  },
  {
    q: 'Apakah TernakOS mendukung transaksi sembako dengan pembayaran tunai dan transfer bank?',
    a: 'Ya. Setiap transaksi bisa dicatat dengan metode pembayaran: tunai, transfer bank, atau tempo (piutang). Untuk transaksi tempo, kamu bisa catat pembayaran saat pelanggan melunasi.',
    link: '/fitur',
  },
  {
    q: 'Bagaimana cara mengetahui margin keuntungan per produk sembako di TernakOS?',
    a: 'Laporan profitabilitas per produk menampilkan harga jual rata-rata, HPP FIFO, dan margin persen per produk. Identifikasi produk mana yang paling menguntungkan dan mana yang perlu direview harganya.',
    link: '/fitur',
  },
  {
    q: 'Apakah TernakOS bisa dipakai untuk distributor sembako yang melayani ratusan toko?',
    a: 'Bisa. Database pelanggan tidak ada batas jumlah. Paket Business mendukung operasi skala besar dengan tim banyak dan laporan konsolidasi semua toko dalam satu dashboard.',
    link: '/harga',
  },
  {
    q: 'Apakah ada notifikasi ketika stok produk sembako tertentu hampir habis?',
    a: 'Ya. TernakOS menampilkan indikator visual (merah/kuning/hijau) per produk berdasarkan level stok. Notifikasi in-app dikirim saat stok masuk kategori "Menipis".',
    link: '/fitur',
  },
  {
    q: 'Bagaimana cara mengelola produk sembako yang memiliki tanggal kadaluarsa?',
    a: 'Setiap batch stok masuk memiliki tanggal pembelian. Dengan metode FIFO, batch tertua otomatis dijual lebih dulu sehingga risiko expired berkurang. Fitur tracking tanggal expired eksplisit ada dalam roadmap.',
    link: '/fitur',
  },
  {
    q: 'Apakah TernakOS mendukung POS (Point of Sale) untuk kasir toko sembako?',
    a: 'Ya. Fitur POS di TernakOS dirancang untuk transaksi kasir yang cepat: pilih produk, input jumlah, dan checkout. Invoice otomatis dibuat dan stok langsung berkurang.',
    link: '/fitur',
  },
  {
    q: 'Bagaimana cara melihat histori pembelian dari supplier sembako tertentu?',
    a: 'Di menu Toko Supplier, pilih supplier yang ingin dilihat. Sistem menampilkan seluruh riwayat pembelian dari supplier tersebut: tanggal, produk, jumlah, harga, dan total nilai.',
    link: '/fitur',
  },
  {
    q: 'Bagaimana cara melacak pengiriman sembako yang sedang dalam perjalanan?',
    a: 'Status pengiriman bisa diupdate oleh sopir langsung dari dashboard sopir mereka. Kamu bisa pantau status: disiapkan, dikirim, atau sudah tiba di toko tujuan.',
    link: '/fitur',
  },
  {
    q: 'Apakah TernakOS bisa menghasilkan invoice atau faktur penjualan sembako yang profesional?',
    a: 'Ya. Setiap penjualan otomatis menghasilkan invoice bernomor urut dengan detail lengkap: tanggal, produk, jumlah, harga, dan total. Invoice bisa dikirim via WhatsApp ke pelanggan.',
    link: '/fitur',
  },
  {
    q: 'Bagaimana cara memastikan akurasi stok sembako setelah banyak transaksi?',
    a: 'Lakukan Stok Opname secara berkala melalui menu fitur. Hitung stok fisik, input ke sistem, dan TernakOS akan menampilkan selisih yang perlu disesuaikan beserta nilai kerugiannya.',
    link: '/fitur',
  },
  {
    q: 'Apakah TernakOS mendukung berbagai metode pembayaran gaji karyawan toko sembako?',
    a: 'Ya. Modul Pegawai mendukung pencatatan gaji dengan metode: gaji bulanan flat, bonus per pengiriman, atau persentase dari omzet. Riwayat pembayaran per karyawan tersimpan lengkap.',
    link: '/fitur',
  },
  {
    q: 'Bagaimana cara menghubungi supplier sembako langsung dari TernakOS?',
    a: 'Setiap profil supplier menyimpan nomor WhatsApp. Klik tombol WA di profil supplier untuk langsung membuka chat WhatsApp dengan supplier tersebut.',
    link: '/fitur',
  },
  {
    q: 'Bagaimana cara menganalisis tren penjualan sembako untuk perencanaan pembelian stok?',
    a: 'Laporan penjualan per periode membantu kamu melihat tren: produk apa yang meningkat penjualannya, kapan peak season, dan berapa rata-rata volume per bulan. Data ini jadi dasar planning pembelian stok.',
    link: '/fitur',
  },
  {
    q: 'Bagaimana cara menangani pembayaran piutang sembako yang datang sebagian-sebagian?',
    a: 'Setiap kali toko mitra bayar sebagian, catat di menu pembayaran dengan jumlah yang dibayar. Sistem otomatis update saldo piutang dan menampilkan status "Sebagian" hingga lunas penuh.',
    link: '/fitur',
  },
  {
    q: 'Apakah TernakOS mendukung stok konsinyasi untuk produk sembako?',
    a: 'Fitur konsinyasi khusus belum tersedia, namun kamu bisa mengelola stok konsinyasi secara manual dengan memanfaatkan catatan di profil supplier dan penyesuaian stok.',
  },
  {
    q: 'Apakah TernakOS bisa diintegrasikan dengan sistem timbangan digital untuk produk curah?',
    a: 'Saat ini input berat dilakukan manual. Integrasi timbangan digital untuk produk curah ada dalam roadmap pengembangan TernakOS.',
  },
  {
    q: 'Bagaimana cara mencatat diskon atau potongan harga untuk pelanggan setia sembako?',
    a: 'Diskon bisa dicatat sebagai penyesuaian harga saat membuat invoice penjualan. Field catatan tersedia untuk mendokumentasikan alasan diskon.',
  },
]
