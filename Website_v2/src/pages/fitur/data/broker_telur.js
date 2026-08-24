import { ShoppingCart, Package, UserCheck, FileText, BarChart2 } from 'lucide-react'

export const groups = [
  {
    Icon: ShoppingCart,
    title: 'POS Telur yang Cepat & Akurat',
    desc: 'Catat penjualan langsung dari grid produk untuk mengelola cart, customer, payment status, dan invoice selesai dalam hitungan detik.',
    features: [
      'Grid produk dengan stok realtime, cukup klik untuk tambah ke cart',
      'Toggle payment: Lunas (cash) atau Piutang/TOP (kredit)',
      'Invoice number otomatis per transaksi',
      'Kalkulasi total + HPP + margin otomatis',
      'Konfirmasi sukses dengan nomor invoice',
    ],
  },
  {
    Icon: Package,
    title: 'Inventori Multi-Grade & HPP Otomatis',
    desc: null,
    features: [
      'Kelola banyak grade/produk: Grade A, Gajah, TB, Lokal, dll',
      'Stok butir realtime dengan indikator warna (merah jika menipis)',
      'HPP per butir dihitung otomatis dari harga beli + packaging',
      'Margin % per grade dengan badge warna (hijau/kuning/merah)',
      'Alert minimum stok sebelum kehabisan',
      'Log mutasi stok: masuk, keluar, penyesuaian',
    ],
  },
  {
    Icon: UserCheck,
    title: 'Database Pelanggan & Supplier',
    desc: null,
    features: [
      'Database pelanggan: nama, HP, lokasi, total belanja',
      'Database supplier dengan riwayat pembelian',
      'Filter pelanggan yang punya piutang aktif',
      'Total spending per pelanggan terakumulasi otomatis',
      'WhatsApp langsung dari kartu pelanggan/supplier',
    ],
  },
  {
    Icon: FileText,
    title: 'Riwayat Transaksi & Invoice',
    desc: null,
    features: [
      'Riwayat semua transaksi dengan search & filter status',
      'Filter: Lunas / Sebagian / Belum Lunas',
      'Detail invoice: breakdown item, harga, subtotal',
      'Catat pembayaran partial per invoice',
      'Cetak/unduh invoice PDF',
    ],
  },
  {
    Icon: BarChart2,
    title: 'Dashboard & Ringkasan Bisnis',
    desc: null,
    features: [
      'KPI harian: total stok, transaksi, pelanggan aktif, omzet',
      'Ringkasan inventori top 5 grade dengan stok visual',
      'Akses cepat ke POS, Supplier, Pelanggan, Transaksi',
    ],
  },
]

export const hero = {
  eyebrow: 'Solusi Broker Telur',
  headline: 'Pantau Harga Telur Harian dan Margin Per Transaksi Secara Real-time.',
  sub: 'Tidak ada lagi selisih hitungan. Semua tercatat otomatis dari kandang sampai pembeli.',
  cta: 'Coba Manajemen Broker Telur',
}

export const beforeAfter = [
  { before: 'Input penjualan satu-satu di buku, sering salah hitung', after: 'POS grid produk untuk klik, pilih customer, dan checkout selesai' },
  { before: 'HPP & margin dihitung manual pakai kalkulator', after: 'HPP & margin % otomatis terhitung per grade per transaksi' },
  { before: 'Piutang pelanggan diingat sendiri, sering lupa', after: 'Dashboard piutang per pelanggan realtime dengan filter' },
  { before: 'Stok baru ketahuan habis saat kehabisan', after: 'Alert minimum stok otomatis sebelum kehabisan' },
]

export const faq = [
  {
    q: 'Bagaimana cara kirim nota ke WhatsApp pembeli?',
    a: 'Setelah transaksi selesai, klik tombol "Kirim Nota" untuk membuka WhatsApp secara otomatis dengan nota yang sudah diformat rapi.',
  },
  {
    q: 'Bisakah pantau harga telur harian di dashboard?',
    a: 'Ya. Dashboard menampilkan harga pasar telur terkini yang diperbarui setiap hari, bisa dipakai sebagai referensi saat negosiasi harga dengan peternak atau pembeli.',
  },
  {
    q: 'Apa itu HPP telur dan bagaimana TernakOS menghitungnya?',
    a: 'HPP (Harga Pokok Penjualan) adalah total biaya untuk menghasilkan atau mendapatkan satu butir telur, termasuk biaya beli dari peternak dan biaya packaging. TernakOS menghitung HPP per butir otomatis saat kamu input stok masuk.',
  },
  {
    q: 'Bisakah kelola beberapa grade telur sekaligus?',
    a: 'Bisa. TernakOS mendukung multi-grade: Hero, Standard, dan Salted. Stok, HPP, dan harga jual masing-masing grade dikelola terpisah.',
  },
  {
    q: 'Bagaimana cara tracking piutang pelanggan telur?',
    a: 'Setiap transaksi dengan status "Piutang" otomatis masuk ke dashboard piutang per customer. Kamu bisa catat pembayaran kapan saja dan saldo sisa piutang terupdate real-time.',
  },
]
