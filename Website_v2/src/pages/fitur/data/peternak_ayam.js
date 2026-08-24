import { Home, RefreshCw, ClipboardList, TrendingUp, Users, Package } from 'lucide-react'

export const groups = [
  {
    Icon: Home,
    title: 'Multi-Kandang, Multi-Model Bisnis',
    desc: 'Setup farm sekali, kelola semua kandang dari satu dashboard, mendukung model mandiri maupun kemitraan.',
    features: [
      'Dukung Mandiri & Kemitraan (CP, Japfa, dll) dalam satu akun',
      'Setup detail INTI perusahaan + harga kontrak kemitraan',
      'Limit kandang per plan (Starter: 1, Pro: 2, Business: unlimited)',
      'Dukung Broiler & Petelur Layer (segera hadir) dalam satu akun',
      'Farm settings: kapasitas kandang, model bisnis, target FCR',
    ],
  },
  {
    Icon: RefreshCw,
    title: 'Tracking Siklus dari Chick In sampai Panen',
    desc: null,
    features: [
      'Mulai siklus: input DOC, tanggal chick-in, target panen',
      'Catat biaya DOC otomatis (mandiri) atau via INTI (kemitraan)',
      'Estimasi harvest date otomatis berdasarkan bobot target',
      'Status siklus: Growing → Ready → Panen → Selesai',
      'Multi-siklus paralel per kandang',
      'Standar bobot Cobb500 sebagai benchmark harian',
    ],
  },
  {
    Icon: ClipboardList,
    title: 'Input Harian < 2 Menit + Vaksinasi',
    desc: null,
    features: [
      'Catat mortalitas harian per kandang',
      'Catat pakan terpakai (kg) dengan debit stok otomatis',
      'Sample berat rata-rata (gram) vs standar Cobb500',
      'FCR estimasi realtime setiap hari',
      'Alert jika belum input hari ini',
      'Jadwal vaksinasi standar: ND+IB, Gumboro, booster, dll',
      'Log vaksinasi: jenis, dosis, tanggal, pelaksana',
      'Timeline histori per siklus',
    ],
  },
  {
    Icon: TrendingUp,
    title: 'Analitik Performa Kandang',
    desc: null,
    features: [
      'FCR Final = total pakan ÷ total bobot panen (per siklus)',
      'IP Score otomatis per siklus selesai',
      'Benchmark otomatis: Sangat Baik / Baik / Perlu Evaluasi',
      'Grafik bobot & pakan per hari vs standar Cobb500',
      'Breakdown biaya lengkap per siklus (DOC, pakan, obat, TK)',
      'HPP per kg terhitung otomatis',
      'Laporan siklus: FCR final, IP Score, HPP/kg, laba-rugi',
    ],
  },
  {
    Icon: Users,
    title: 'Anak Kandang, Tugas & Penggajian',
    desc: null,
    features: [
      'Database anak kandang per farm dengan penugasan harian',
      'Tugas harian digital: assign, tracking penyelesaian',
      'Sistem gaji: Flat + Bonus panen otomatis',
      'Bonus otomatis jika FCR < target (konfigurasi sendiri)',
      'Catat pembayaran gaji & bonus per worker',
      'Riwayat pembayaran per anak kandang',
    ],
  },
  {
    Icon: Package,
    title: 'Manajemen Stok Pakan',
    desc: null,
    features: [
      'Stok per jenis pakan: Starter, Grower, Finisher',
      'Status visual: Aman / Cukup / Menipis',
      'Catat pembelian pakan dari supplier (tambah stok)',
      'Debit stok otomatis dari input harian',
      'Alert stok < 100 kg ke HP pengelola',
      'Integrasi ke laporan biaya siklus',
    ],
  },
]

export const hero = {
  eyebrow: 'Solusi Peternak Ayam Broiler',
  headline: 'Cetak Indeks Performa (IP) Tertinggi dengan Manajemen Kandang Berbasis Data.',
  sub: 'Catat FCR, mortalitas, dan vaksinasi harian untuk melihat perhitungan otomatis. Bandingkan performa antar siklus kandang.\n\n*Ayam Layer (Petelur) sedang dikembangkan dan tersedia segera.*',
  cta: 'Mulai Kelola Kandang Ayam',
}

export const beforeAfter = [
  { before: 'Catat kematian ayam di kertas, mudah hilang', after: 'Recording harian digital, tersimpan otomatis per siklus di cloud' },
  { before: 'Hitung FCR manual pakai kalkulator, sering meleset', after: 'FCR & IP Score terhitung otomatis setiap hari dari data aktual' },
  { before: 'Jadwal vaksinasi lupa atau terlewat', after: 'Jadwal vaksinasi standar Cobb dengan alert otomatis ke HP pengelola' },
  { before: 'Tidak bisa bandingkan performa antar siklus', after: 'Laporan siklus + grafik tren bobot vs standar Cobb500' },
  { before: 'Tidak tahu profit sebelum panen selesai', after: 'Estimasi laba-rugi + HPP/kg tersedia real-time sepanjang siklus' },
]

export const faq = [
  {
    q: 'Apa itu FCR dan kenapa penting untuk peternak ayam broiler?',
    a: 'FCR (Feed Conversion Ratio) adalah rasio kg pakan yang dibutuhkan untuk menghasilkan 1 kg bobot ayam. FCR 1,6 artinya butuh 1,6 kg pakan untuk 1 kg ayam. Semakin rendah FCR, semakin efisien dan menguntungkan. TernakOS menghitung FCR otomatis setiap hari.',
  },
  {
    q: 'Apa itu Indeks Performa (IP) kandang ayam?',
    a: 'IP (Indeks Performa) adalah angka gabungan yang mencerminkan efisiensi produksi satu siklus kandang: IP = (Survival Rate × Bobot Rata-rata × 100) ÷ (FCR × Umur Panen). IP > 300 dianggap sangat baik. TernakOS menghitung IP otomatis setiap siklus selesai.',
  },
  {
    q: 'Bisakah pantau lebih dari satu kandang?',
    a: 'Bisa. Tambahkan kandang sesuai limit paket (Starter: 1, Pro: 2, Business: unlimited). Setiap kandang punya recording harian dan analisis siklus sendiri yang bisa dibandingkan satu sama lain.',
  },
  {
    q: 'Apakah TernakOS mendukung sistem kemitraan (CP, Japfa, dll)?',
    a: 'Ya. TernakOS mendukung model bisnis mandiri maupun mitra penuh. Untuk pola mitra, kamu bisa input nama INTI, harga kontrak, dan sistem deducting sapronak otomatis.',
  },
  {
    q: 'Bagaimana cara menghitung keuntungan peternak broiler per siklus?',
    a: 'TernakOS menghitung profit bersih per siklus: Pendapatan Panen − Biaya DOC − Biaya Pakan − Biaya Obat/Vaksin − Biaya Tenaga Kerja − Biaya Lainnya. Semua tersedia real-time tanpa harus tunggu siklus selesai.',
  },
  {
    q: 'Apakah bisa catat vaksinasi dan penggunaan obat per siklus?',
    a: 'Ya. Modul vaksinasi memungkinkan kamu catat jenis vaksin, dosis, tanggal, dan tenaga pelaksana. Data ini terintegrasi ke laporan biaya siklus dan bisa jadi referensi untuk siklus berikutnya.',
  },
  {
    q: 'Apakah ada fitur recording harian untuk peternak?',
    a: 'Ada. Input harian bisa diselesaikan kurang dari 2 menit: mortalitas, pakan terpakai, sampel bobot rata-rata. Sistem otomatis menghitung FCR harian dan menampilkan grafik tren bobot vs pakan.',
  },
  {
    q: 'Kapan fitur Ayam Layer (Petelur) tersedia?',
    a: 'Fitur peternak ayam layer (petelur) sedang dalam pengembangan, termasuk recording produksi telur harian, HDP (Hen Day Production), dan laporan produksi. Subscriber Pro akan mendapat akses otomatis saat fitur live.',
  },
]
