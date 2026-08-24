import { ShoppingCart, Package, Users, Truck, BarChart2 } from 'lucide-react'

export const groups = [
  {
    Icon: ShoppingCart,
    title: 'Invoice & POS Grosir Digital',
    desc: 'Buat invoice penjualan multi-item dalam hitungan detik dengan dukungan satuan ganda, dual harga, dan sistem tempo.',
    features: [
      'Multi-item per invoice: Sak, Ball, Karton, Pcs, Kg, dll',
      'Dual-pricing otomatis: Harga Retail vs Harga Partai',
      'Sistem payment: Cash atau Tempo (Piutang)',
      'Invoice number otomatis + PDF invoice (Pro)',
      'Kuota bulanan di Starter, unlimited di Pro',
    ],
  },
  {
    Icon: Package,
    title: 'Inventori, Batch & Gudang',
    desc: null,
    features: [
      'Manajemen produk dengan dual satuan & konversi otomatis',
      'Margin % per produk dengan badge warna (hijau/kuning/merah)',
      'Batch tracking: kode batch, supplier, tanggal masuk, sisa stok',
      'Riwayat mutasi stok: penerimaan, penjualan, penyesuaian',
      'Alert minimum stok ke HP pengelola',
      'Multi-gudang & transfer stok antar lokasi (Business)',
    ],
  },
  {
    Icon: Users,
    title: 'Toko, Supplier & Piutang',
    desc: null,
    features: [
      'Database toko/pelanggan: warung, retail, supermarket, grosir',
      'Database supplier dengan tracking hutang pembelian',
      'Piutang toko realtime dengan partial payment',
      'Filter "hanya yang punya piutang aktif"',
      'Riwayat invoice & pembayaran per toko/supplier',
    ],
  },
  {
    Icon: Truck,
    title: 'Pengiriman & Logistik',
    desc: null,
    features: [
      'Delivery order dari invoice penjualan pending',
      'Assign sopir & kendaraan per pengiriman',
      'Status real-time: Pending → Jalan → Tiba → Selesai',
      'Timeline pengiriman dengan tanggal mulai & selesai',
      'Catatan bukti pengiriman',
    ],
  },
  {
    Icon: BarChart2,
    title: 'Laporan, Pegawai & Payroll (Pro)',
    desc: null,
    features: [
      'Laporan laba-rugi: revenue, COGS, gross & net profit',
      'Breakdown pengeluaran: sewa, listrik, BBM, packaging',
      'Analitik Pareto untuk produk & customer paling menguntungkan',
      'Export laporan PDF & Excel (Business)',
      'Manajemen pegawai + gaji & payroll bulanan',
    ],
  },
]

export const hero = {
  eyebrow: 'Solusi Agen Sembako',
  headline: 'Stok Bocor? Pantau Keluar Masuk Barang Secara Akurat dengan Sistem FIFO.',
  sub: 'Kelola ribuan item sembako (seperti beras, minyak, telur) dalam satu invoice tanpa salah hitung.',
  cta: 'Coba Manajemen Stok Sembako',
}

export const beforeAfter = [
  { before: 'Invoice ditulis tangan, sering ada item kelewat', after: 'Invoice digital multi-item selesai dalam 30 detik' },
  { before: 'Stok dicatat manual, sering selisih saat opname', after: 'Batch tracking otomatis untuk mencatat setiap masuk & keluar' },
  { before: 'Piutang toko tidak terpantau, sering dispute', after: 'Dashboard piutang per toko dengan riwayat pembayaran' },
  { before: 'Laporan laba-rugi dihitung di Excel akhir bulan', after: 'Laporan P&L + analitik produk terlaris tersedia realtime' },
]

export const faq = [
  {
    q: 'Apa itu sistem FIFO dan kenapa penting untuk toko sembako?',
    a: 'FIFO (First In First Out) artinya barang yang masuk lebih dulu harus keluar lebih dulu. Ini mencegah barang mengendap dan expired. TernakOS mengelola FIFO per batch otomatis, sehingga kamu tidak perlu mengurutkannya manual.',
  },
  {
    q: 'Apakah sistem FIFO bisa untuk ratusan item berbeda?',
    a: 'Ya. Sistem batch tracking kami dirancang untuk mengelola ribuan SKU dengan metode FIFO otomatis per item. Cocok untuk distributor besar dengan ratusan jenis barang sekaligus.',
  },
  {
    q: 'Bisakah input faktur dari supplier sekaligus banyak item?',
    a: 'Bisa. Fitur multi-item entry memungkinkan kamu input puluhan item sembako dalam satu faktur pembelian tanpa perlu buat invoice terpisah per item.',
  },
  {
    q: 'Bagaimana cara menghitung HPP sembako secara akurat?',
    a: 'TernakOS menghitung HPP menggunakan metode FIFO atau rata-rata tertimbang per batch. Saat terjadi penjualan, sistem otomatis mendebet stok dari batch tertua dan menghitung HPP yang tepat.',
  },
  {
    q: 'Apakah bisa kelola piutang toko/agen yang belum bayar?',
    a: 'Ya. Setiap penjualan dengan sistem tempo otomatis masuk ke dashboard piutang. Kamu bisa monitor batas kredit per toko, rekap pencairan bon, dan catat pelunasan digital.',
  },
  {
    q: 'Bisakah TernakOS dipakai untuk distributor sembako berskala besar?',
    a: 'Bisa. Paket Business mendukung unlimited pengguna, multi-gudang dengan transfer stok antar lokasi, dan laporan HPP otomatis. Cocok untuk distributor sembako yang punya banyak gudang dan jaringan toko mitra.',
  },
]
