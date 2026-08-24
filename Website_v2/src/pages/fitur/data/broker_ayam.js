import { ArrowLeftRight, Home, Truck, Users, BarChart2, Calculator } from 'lucide-react'

export const groups = [
  {
    Icon: ArrowLeftRight,
    title: 'Catat Beli & Jual dalam Hitungan Detik',
    desc: 'Wizard 3 langkah mulai dari beli kandang sampai audit transaksi & kirim nota ke WhatsApp.',
    features: [
      'Catat pembelian dari kandang (harga, bobot, ekor)',
      'Catat penjualan ke RPA/pasar/langsung',
      'Kalkulasi margin & susut otomatis per transaksi',
      'Audit sheet lengkap: detail beli, kirim, & histori bayar',
      'Kirim nota digital ke WhatsApp pembeli satu klik',
      'Riwayat transaksi dengan filter status & periode',
    ],
  },
  {
    Icon: Home,
    title: 'Pantau Semua Kandang dari Satu Tempat',
    desc: null,
    features: [
      'Database kandang mitra (stok, bobot, status)',
      'Status: GROWING, READY, EMPTY dengan filter cepat',
      'Rating kualitas kandang 1–5 bintang',
      'Estimasi tanggal harvest per kandang',
      'Riwayat transaksi per kandang mitra',
    ],
  },
  {
    Icon: Truck,
    title: 'Tracking Pengiriman & Loss Report',
    desc: null,
    features: [
      'Catat detail pengiriman (kendaraan, sopir, muatan)',
      'Update bobot & ekor tiba vs bobot kirim (susut)',
      'Timbangan digital (Business plan)',
      'Loss report mortalitas & susut berat per pengiriman',
      'Revenue diupdate otomatis dari bobot tiba aktual',
      'PDF Surat Jalan pengiriman (Pro)',
      'Dashboard khusus Sopir (akses mobile)',
    ],
  },
  {
    Icon: Users,
    title: 'Kelola Piutang RPA Tanpa Dispute',
    desc: null,
    features: [
      'Database RPA/buyer dengan reliability score',
      'Tracking piutang per RPA realtime',
      'Payment terms: Cash, NET 3/7/14/30',
      'Catat pembayaran partial & tandai lunas massal',
      'Alert piutang jatuh tempo',
      'WhatsApp link langsung ke nomor RPA',
    ],
  },
  {
    Icon: Calculator,
    title: 'Simulator & Cash Flow Otomatis',
    desc: null,
    features: [
      'Simulator: hitung BEP, ROI%, dan margin/kg sebelum deal',
      'Integrasikan harga pasar hari ini ke simulasi',
      'Dashboard cash flow bulanan (modal, transport, kerugian)',
      'Grafik Revenue vs Biaya per hari/minggu/bulan',
      'Breakdown per RPA & per kandang sumber',
      'Export laporan PDF & Excel (Business)',
    ],
  },
  {
    Icon: Truck,
    title: 'Armada, Pengeluaran & Tim',
    desc: null,
    features: [
      'Database kendaraan + SIM expiry alert',
      'Database sopir + upah per trip',
      'Catat pengeluaran armada: BBM, servis, pajak, sewa',
      'Multi-role: Owner, Manajer, Staff, Sopir, View Only',
      'Undang anggota via kode 6 digit (Pro: maks 3, Business: unlimited)',
    ],
  },
]

export const hero = {
  eyebrow: 'Solusi Broker Ayam',
  headline: 'Kelola Ratusan Ton Ayam Tanpa Pusing Selisih Timbangan.',
  sub: 'Dari catat pembelian kandang sampai kirim nota ke WhatsApp pembeli, semuanya dalam 3 langkah. Hemat 2 jam/hari pencatatan.',
  cta: 'Mulai Kelola Transaksi Broker',
}

export const beforeAfter = [
  { before: 'Catat timbangan di buku, sering hilang atau salah', after: 'Input digital, tersimpan otomatis di cloud' },
  { before: 'Hitung margin manual pakai kalkulator', after: 'Margin terhitung otomatis per transaksi' },
  { before: 'Kirim nota lewat foto buku ke WhatsApp', after: 'Nota digital dikirim otomatis ke WhatsApp pembeli' },
  { before: 'Tidak tahu siapa yang belum bayar tempo', after: 'Dashboard piutang real-time dengan alert jatuh tempo' },
]

export const faq = [
  {
    q: 'Apa itu aplikasi broker ayam dan apa bedanya dengan catatan biasa?',
    a: 'Aplikasi broker ayam adalah sistem digital untuk mencatat pembelian dari kandang, penjualan ke RPA/pasar, pengiriman, dan piutang dalam satu platform. Berbeda dengan buku atau Excel, data otomatis terhitung, sehingga margin, susut timbangan, dan saldo piutang selalu akurat tanpa hitung manual.',
  },
  {
    q: 'Bagaimana cara menghitung margin keuntungan broker ayam secara otomatis?',
    a: 'TernakOS menghitung margin otomatis: Margin = Harga Jual per kg × Bobot Tiba − (Modal Beli + Biaya Kirim + Biaya Lain). Bobot yang dipakai adalah bobot tiba aktual, bukan estimasi, sehingga susut timbangan sudah diperhitungkan.',
  },
  {
    q: 'Bisakah satu akun untuk beberapa kandang mitra?',
    a: 'Bisa. Kamu bisa mengelola database kandang mitra tanpa batas dalam satu akun broker. Setiap kandang punya riwayat transaksi, rating kualitas, dan estimasi stok sendiri.',
  },
  {
    q: 'Bagaimana cara kirim nota ke WhatsApp pembeli?',
    a: 'Setelah transaksi selesai, klik tombol "Kirim Nota" untuk membuka WhatsApp secara otomatis dengan nota yang sudah diformat rapi. Pembeli langsung terima detail transaksi tanpa kamu perlu ketik ulang.',
  },
  {
    q: 'Bagaimana cara melacak piutang broker ayam yang belum dibayar?',
    a: 'Dashboard RPA menampilkan total piutang per pembeli secara real-time. Kamu bisa lihat detail per transaksi, catat pembayaran partial, dan sistem akan menghitung sisa hutang otomatis.',
  },
  {
    q: 'Apakah loss report mortalitas ayam bisa dibuat otomatis?',
    a: 'Ya. Ketika mencatat kedatangan pengiriman, input ekor tiba vs ekor kirim. Sistem otomatis membuat loss report mortalitas dan menghitung estimasi kerugian finansialnya.',
  },
]
