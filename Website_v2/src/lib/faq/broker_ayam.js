export const broker_ayam = [
  {
    q: 'Bagaimana cara mencatat timbangan ayam saat beli dari kandang di TernakOS?',
    a: 'Buka menu Transaksi → Catat Transaksi → pilih mode "Beli Dulu". Input kandang asal, harga per kg, bobot kirim, dan jumlah ekor. Semua tersimpan otomatis dan langsung masuk ke kalkulasi modal.',
    link: '/fitur',
  },
  {
    q: 'Bagaimana cara mencatat penjualan ayam ke RPA atau pembeli lainnya di TernakOS?',
    a: 'Pilih mode "Jual Dulu" atau catat penjualan dari transaksi yang sudah ada. Input nama pembeli (RPA/pedagang), harga jual per kg, bobot, dan metode pembayaran. Margin otomatis dihitung dari selisih harga beli dan jual.',
    link: '/fitur',
  },
  {
    q: 'Bagaimana cara mengelola piutang dari pembeli ayam yang bayar tempo di TernakOS?',
    a: 'Saat input penjualan, pilih metode bayar "Tempo" dan isi tanggal jatuh tempo. Transaksi masuk ke dashboard piutang dengan status "Belum Lunas". Saat pembayaran masuk, catat di menu pembayaran dan saldo piutang update otomatis.',
    link: '/fitur',
  },
  {
    q: 'Apakah TernakOS bisa menghitung susut berat (mortality loss) selama pengiriman ayam?',
    a: 'Ya. Saat mencatat pengiriman, input bobot kirim dari kandang dan bobot tiba di pembeli. TernakOS otomatis menghitung susut berat (kg dan %) serta estimasi kerugian dari mortalitas. Data ini masuk ke laporan Cash Flow.',
    link: '/fitur',
  },
  {
    q: 'Bagaimana cara melacak posisi dan status pengiriman ayam dari kandang ke pembeli?',
    a: 'Setiap pengiriman memiliki alur status: Disiapkan → Dalam Perjalanan → Tiba. Sopir bisa update status dari HP mereka langsung. Kamu bisa pantau semua pengiriman aktif dari dashboard.',
    link: '/fitur',
  },
  {
    q: 'Apakah TernakOS bisa dipakai untuk broker yang membeli dari banyak kandang berbeda dalam satu hari?',
    a: 'Bisa. Tidak ada batasan jumlah transaksi per hari. Setiap pembelian dari kandang berbeda dicatat terpisah, dan sistem otomatis merangkum total modal beli, stok gabungan, dan estimasi margin keseluruhan.',
    link: '/fitur',
  },
  {
    q: 'Bagaimana TernakOS menghitung margin per kg untuk setiap transaksi broker ayam?',
    a: 'Margin per kg = Harga Jual − HPP per kg. HPP per kg dihitung dari total modal (harga beli + transport + extra cost) dibagi bobot tiba. TernakOS menampilkan margin per kg dan margin total di setiap detail transaksi.',
    link: '/fitur',
  },
  {
    q: 'Apakah ada fitur untuk mencatat hutang broker ke kandang mitra yang belum dibayar?',
    a: 'Ya. Dashboard hutang broker menampilkan total outstanding ke semua kandang mitra, breakdown per kandang, dan riwayat pembayaran. Kamu bisa catat pelunasan parsial atau penuh kapan saja.',
    link: '/fitur',
  },
  {
    q: 'Bagaimana cara membuat laporan cash flow mingguan atau bulanan untuk broker ayam di TernakOS?',
    a: 'Menu Cash Flow menampilkan ringkasan per periode: total pemasukan, pengeluaran, dan net profit. Pilih filter tanggal untuk melihat data mingguan, bulanan, atau rentang tanggal custom.',
    link: '/fitur',
  },
  {
    q: 'Apakah TernakOS mendukung broker yang menggunakan sistem "beli dulu, jual belakangan" (floating stock)?',
    a: 'Ya. Mode "Beli Dulu" memungkinkan kamu catat pembelian dari kandang tanpa harus langsung ada pembeli. Stok tersimpan di sistem dan bisa dihubungkan ke penjualan kapan saja.',
    link: '/fitur',
  },
  {
    q: 'Apakah ada fitur rating kualitas kandang mitra untuk broker ayam?',
    a: 'Ada. Setiap kandang bisa diberi rating 1–5 bintang berdasarkan kualitas pengiriman terakhir (bobot, kesehatan, ketepatan waktu). Ini membantu kamu prioritaskan kandang mitra terbaik.',
    link: '/fitur',
  },
  {
    q: 'Bisakah sopir pengiriman ayam mengupdate status kiriman dari HP-nya sendiri?',
    a: 'Bisa. Sopir mendapat akses khusus dengan role "Sopir" via kode undangan. Dari dashboard sopir, mereka bisa lihat daftar pengiriman yang di-assign dan update status tanpa bisa akses data keuangan.',
    link: '/fitur',
  },
  {
    q: 'Bagaimana cara mengelola banyak kandang mitra sekaligus dalam satu akun broker?',
    a: 'Menu Kandang menampilkan database semua kandang mitra kamu: stok tersedia, bobot rata-rata, status (siap/growing/aktif), dan riwayat transaksi per kandang. Filter dan cari kandang dengan cepat.',
    link: '/fitur',
  },
  {
    q: 'Apakah TernakOS bisa menghitung biaya transport per kg untuk broker ayam?',
    a: 'Ya. Saat input pengiriman, masukkan biaya kirim total. TernakOS otomatis menghitung biaya transport per kg berdasarkan bobot yang dikirim dan memperhitungkannya dalam kalkulasi margin akhir.',
    link: '/fitur',
  },
  {
    q: 'Bagaimana cara mencetak atau mengexport laporan transaksi broker ayam?',
    a: 'Laporan transaksi bisa dilihat dengan filter tanggal fleksibel di menu Transaksi dan Cash Flow. Export laporan ke format digital tersedia dan fitur cetak PDF sedang dalam pengembangan.',
    link: '/fitur',
  },
  {
    q: 'Apakah ada fitur untuk mencatat biaya operasional tambahan broker seperti bahan bakar atau tol?',
    a: 'Ada. Menu Cash Flow memiliki fitur "Catat Biaya Tambahan" (extra_expenses) untuk mencatat pengeluaran di luar transaksi utama: bahan bakar, tol, pakan cadangan, biaya kandang, dan lainnya.',
    link: '/fitur',
  },
  {
    q: 'Bagaimana cara menghitung net profit broker ayam per bulan di TernakOS?',
    a: 'Net Profit = Total Pendapatan Penjualan − Modal Beli − Biaya Pengiriman − Loss Mortalitas − Biaya Extra. TernakOS merangkum ini otomatis di Cash Flow dengan filter periode bulanan.',
    link: '/fitur',
  },
  {
    q: 'Apakah TernakOS mendukung pembayaran partial atau cicilan dari pembeli ayam?',
    a: 'Ya. Setiap transaksi bisa dicatat dengan status: Lunas, Belum Lunas, atau Sebagian. Untuk pembayaran partial, kamu catat setiap kali ada pembayaran masuk dan sistem update saldo piutang otomatis.',
    link: '/fitur',
  },
  {
    q: 'Apakah data transaksi broker ayam di TernakOS bisa dilihat oleh staf atau karyawan?',
    a: 'Tergantung role yang kamu berikan. Role Staff bisa lihat dan input transaksi operasional tetapi tidak bisa akses Cash Flow dan data keuangan sensitif. Role View Only hanya bisa lihat tanpa bisa edit apapun.',
    link: '/fitur',
  },
  {
    q: 'Bagaimana cara melaporkan loss atau kerugian akibat ayam mati selama pengiriman ke laporan keuangan?',
    a: 'Loss report mortalitas dibuat otomatis saat kamu input data kedatangan pengiriman. Estimasi kerugian (ekor mati × harga per kg × bobot rata-rata) otomatis masuk ke total kerugian di Cash Flow.',
    link: '/fitur',
  },
  {
    q: 'Apakah TernakOS punya fitur simulator keuntungan untuk broker ayam sebelum deal?',
    a: 'Ya. Menu Simulator memungkinkan kamu input harga beli kandang, estimasi bobot, biaya kirim, dan target harga jual — sistem langsung menampilkan estimasi margin per kg dan total profit. Berguna sebelum negosiasi harga.',
    link: '/fitur',
  },
  {
    q: 'Bisakah broker ayam melihat histori harga timbangan semua kandang mitra sebelumnya?',
    a: 'Bisa. Setiap kandang mitra memiliki riwayat transaksi lengkap. Kamu bisa lihat histori harga beli, bobot, dan tanggal transaksi dari kandang tersebut untuk referensi negosiasi.',
    link: '/fitur',
  },
  {
    q: 'Apakah TernakOS mendukung transaksi ayam broiler, ayam kampung, dan bebek dalam satu platform?',
    a: 'Ya. TernakOS tidak membatasi jenis unggas. Kamu bisa input chicken_type sesuai jenis yang diperdagangkan. Satu akun broker bisa mencatat transaksi berbagai jenis unggas sekaligus.',
  },
  {
    q: 'Bagaimana cara memantau reliability atau reputasi pembeli RPA di TernakOS?',
    a: 'Setiap RPA/pembeli memiliki reliability score yang dihitung berdasarkan riwayat pembayaran (tepat waktu vs telat) dan total outstanding. Score ini membantu kamu memutuskan apakah akan perpanjang kredit ke pembeli tersebut.',
    link: '/fitur',
  },
  {
    q: 'Apakah ada alert otomatis saat piutang broker ayam jatuh tempo?',
    a: 'Ya. Sistem notifikasi TernakOS mengirim alert in-app ketika ada piutang yang mendekati atau melewati tanggal jatuh tempo. Tidak perlu ingat manual tanggal-tanggal jatuh tempo pembeli.',
    link: '/fitur',
  },
  {
    q: 'Bagaimana cara mencatat pengiriman ayam dengan dua kendaraan berbeda untuk satu transaksi penjualan?',
    a: 'Setiap pengiriman dicatat terpisah dengan kendaraan dan sopir masing-masing. Untuk satu penjualan yang dikirim dua kendaraan, buat dua entri pengiriman yang terhubung ke penjualan yang sama.',
  },
  {
    q: 'Apakah TernakOS bisa dipakai untuk broker ayam yang beroperasi di beberapa kota sekaligus?',
    a: 'Bisa. Satu akun broker bisa mencatat kandang mitra dan pembeli dari berbagai lokasi. Filter dan laporan bisa disesuaikan per wilayah melalui catatan di profil kandang dan RPA.',
  },
  {
    q: 'Bagaimana cara mendaftarkan kandang baru sebagai mitra broker di TernakOS?',
    a: 'Buka menu Kandang → Tambah Kandang. Isi nama kandang, pemilik, nomor HP, lokasi, dan kapasitas. Kandang langsung bisa dipilih saat mencatat transaksi berikutnya.',
    link: '/fitur',
  },
  {
    q: 'Bagaimana cara melihat tren margin broker ayam dalam 3 bulan terakhir?',
    a: 'Menu Cash Flow dengan filter "Keseluruhan" atau pilih range tanggal 3 bulan menampilkan grafik tren net profit harian. Kamu bisa langsung lihat tren naik turun margin per periode.',
    link: '/fitur',
  },
  {
    q: 'Bagaimana cara menangani transaksi yang dibatalkan setelah dicatat di TernakOS?',
    a: 'TernakOS menggunakan sistem soft-delete — data tidak benar-benar dihapus. Kamu bisa hapus transaksi dari tampilan aktif, dan data tetap bisa dipulihkan dari menu Recycle Bin di Akun jika diperlukan.',
    link: '/fitur',
  },
  {
    q: 'Bisakah broker ayam melihat estimasi stok ayam siap panen dari semua kandang mitra sekaligus?',
    a: 'Bisa. Menu Kandang menampilkan status tiap kandang: ready (siap panen), growing (masih tumbuh), atau empty (kosong). Kamu bisa lihat estimasi bobot dan jumlah ekor tersedia dari seluruh kandang mitra.',
    link: '/fitur',
  },
  {
    q: 'Bagaimana cara broker ayam di TernakOS membedakan pendapatan dari berbagai tipe pembeli (RPA, pasar, langsung)?',
    a: 'Setiap transaksi penjualan memiliki field buyer_type: RPA, Pedagang Pasar, Restoran, Pengepul, Supermarket, atau Lainnya. Laporan Cash Flow bisa difilter per tipe pembeli untuk analisis profitabilitas.',
    link: '/fitur',
  },
  {
    q: 'Apakah TernakOS bisa menghitung HPP (Harga Pokok Penjualan) per kg untuk broker ayam?',
    a: 'Ya. HPP per kg = (Total Modal Beli + Biaya Transport + Biaya Lain) ÷ Bobot Tiba. TernakOS menghitung ini otomatis per transaksi dan menampilkannya di detail transaksi dan laporan Cash Flow.',
    link: '/fitur',
  },
  {
    q: 'Apakah TernakOS mendukung integrasi dengan timbangan digital di kandang?',
    a: 'Saat ini input bobot dilakukan manual. Integrasi dengan timbangan digital IoT ada di roadmap pengembangan TernakOS untuk paket Business.',
  },
  {
    q: 'Apakah ada fitur manajemen kontrak harga antara broker dan kandang mitra?',
    a: 'Saat ini harga dicatat per transaksi. Fitur kontrak harga jangka panjang dengan kandang mitra ada dalam roadmap pengembangan kami.',
  },
  {
    q: 'Apakah TernakOS mendukung harga beli ayam per ekor selain per kilogram?',
    a: 'Sistem kalkulasi utama TernakOS menggunakan harga per kg (standar industri broiler Indonesia). Untuk kebutuhan pencatatan per ekor, kamu bisa manfaatkan field notes atau gunakan konversi bobot rata-rata.',
  },
  {
    q: 'Apakah TernakOS punya fitur untuk mencatat pembelian ayam yang dibayar dengan giro atau cek?',
    a: 'Saat mencatat pembayaran, pilih metode: cash, transfer bank, atau giro. Field referensi nomor giro/cek tersedia untuk keperluan audit dan rekonsiliasi.',
    link: '/fitur',
  },
  {
    q: 'Apakah TernakOS mendukung pencatatan data dalam mata uang selain Rupiah?',
    a: 'Saat ini TernakOS menggunakan Rupiah (IDR) sebagai satu-satunya mata uang.',
  },
  {
    q: 'Bagaimana cara mengetahui tren margin broker ayam dalam 3 bulan terakhir?',
    a: 'Menu Cash Flow dengan filter "Keseluruhan" atau pilih range tanggal 3 bulan menampilkan grafik tren net profit harian. Kamu bisa langsung lihat tren naik turun margin per periode.',
    link: '/fitur',
  },
  {
    q: 'Apakah ada fitur untuk mencatat biaya operasional tambahan broker seperti bahan bakar atau tol?',
    a: 'Ada. Menu Cash Flow memiliki fitur "Catat Biaya Tambahan" (extra_expenses) untuk mencatat pengeluaran di luar transaksi utama: bahan bakar, tol, pakan cadangan, biaya kandang, dan lainnya.',
    link: '/fitur',
  },
]
