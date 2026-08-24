import { RefreshCw, TrendingUp, Home, ClipboardList, Users, BarChart2 } from 'lucide-react'

export const groups = [
  {
    Icon: RefreshCw,
    title: 'Multi-Batch Fattening & Breeding',
    desc: 'Kelola beberapa batch sekaligus dengan menutup batch lama dan membuka batch baru tanpa gangguan.',
    features: [
      'Buat & tutup batch dengan tanggal masuk dan target panen',
      'Dukung dua model: Penggemukan (Fattening) & Breeding',
      'Status batch: Aktif, Siap Jual',
      'Ringkasan populasi, nilai batch, FCR, & R/C ratio realtime',
      'BEP otomatis per batch untuk mengetahui kapan balik modal',
      'Multi-batch paralel dalam satu akun',
    ],
  },
  {
    Icon: TrendingUp,
    title: 'Kartu Ternak & ADG per Ekor',
    desc: 'Setiap sapi punya kartu digital mulai dari beli masuk sampai jual keluar.',
    features: [
      'Profil per ekor: ear tag, ras, bobot masuk, target bobot',
      'Log penimbangan rutin dengan ADG otomatis',
      'ADG = (Bobot Terkini − Bobot Masuk) ÷ Hari di Farm',
      'Prediksi tanggal siap jual dari tren ADG',
      'Warna tier performa: Hijau ≥ 0.8 kg, Kuning 0.5–0.8 kg, Merah < 0.5 kg',
    ],
  },
  {
    Icon: Home,
    title: 'Denah Kandang Interaktif',
    desc: 'Visualisasi posisi setiap sapi untuk melihat performa sekilas tanpa buka kartu satu-satu.',
    features: [
      'Layout kandang interaktif per batch',
      'Dot warna berdasarkan tier ADG per ekor',
      'Mode tampilan 3D isometrik',
      'Filter tampilan per batch aktif',
      'Klik sapi → buka kartu detail langsung',
    ],
  },
  {
    Icon: ClipboardList,
    title: 'Sistem Penugasan Tim Kandang',
    desc: 'Assign tugas ke anak kandang dan pantau kepatuhan tanpa harus telepon.',
    features: [
      'Template tugas harian: pakan, timbang, cek kesehatan',
      'Assign tugas ke anak kandang individual',
      'Tracking status penyelesaian per hari',
      'Konfigurasi jadwal & template tugas',
      'Riwayat kepatuhan tim per periode',
    ],
  },
  {
    Icon: Users,
    title: 'Kesehatan & Reproduksi (Breeding)',
    desc: 'Rekam medik per ekor dan siklus reproduksi penuh untuk mode Breeding.',
    features: [
      'Log vaksinasi & pengobatan per ekor (sakit, treatment, sembuh)',
      'Rekam medik individual terintegrasi',
      'Manajemen reproduksi: IB / kawin alam, inseminator, tanggal',
      'Status kehamilan: birahi → IB → bunting → kelahiran',
      'Pencatatan kelahiran & silsilah pedet (dam/sire lineage)',
      'Conception rate & calving interval otomatis',
      'Alert pemeriksaan rutin berkala',
    ],
  },
  {
    Icon: BarChart2,
    title: 'Laporan Batch, Penjualan & Keuangan',
    desc: 'Laba-rugi per batch terhitung otomatis, sehingga tidak perlu Excel lagi.',
    features: [
      'Laporan batch closure: FCR final, R/C ratio, HPP/kg, laba-rugi',
      'HPP per kg/ekor terhitung dari semua biaya masuk',
      'Catat penjualan per ekor atau per batch (bobot, harga, pembeli)',
      'Biaya operasional: pakan, obat, TK, listrik, air',
      'Stok pakan per batch dengan supplier tracking',
      'KPI harian beranda: ADG target, mortalitas, FCR, R/C ratio, BEP',
    ],
  },
]

export const hero = {
  eyebrow: 'Solusi Peternak Sapi',
  headline: 'Pantau ADG, FCR, dan BEP Sapi dari Satu Dashboard.',
  sub: 'Sistem lengkap untuk sapi penggemukan & breeding yang mencakup tracking bobot per ekor, penugasan tim anak kandang, reproduksi, hingga laporan keuangan batch otomatis.',
  cta: 'Mulai Kelola Kandang Sapi',
}

export const beforeAfter = [
  { before: 'Catat bobot sapi di buku, susah cari histori per ekor', after: 'Kartu ternak digital dengan ADG otomatis untuk prediksi panen secara real-time' },
  { before: 'Tidak tahu apakah batch sudah balik modal atau belum', after: 'BEP & R/C ratio tersedia otomatis sejak hari pertama batch' },
  { before: 'Delegasi tugas anak kandang lewat pesan WhatsApp', after: 'Penugasan digital dengan tracking penyelesaian harian' },
  { before: 'Jadwal IB dan kelahiran tidak terdokumentasi', after: 'Manajemen reproduksi: conception rate & calving interval terekam' },
  { before: 'Laporan batch dihitung manual di akhir periode', after: 'Laporan laba-rugi + FCR final + HPP/kg tersedia real-time' },
]

export const faq = [
  {
    q: 'Apa itu ADG dan bagaimana TernakOS menghitungnya?',
    a: 'ADG (Average Daily Gain) adalah rata-rata pertambahan bobot harian sapi yang menjadi kunci efisiensi di usaha fattening. TernakOS menghitung ADG otomatis: (Bobot Terkini − Bobot Masuk) ÷ Jumlah Hari di Farm. Setiap kali kamu input penimbangan baru, ADG dan prediksi tanggal panen langsung diperbarui.',
  },
  {
    q: 'Bagaimana TernakOS mengelola batch sapi penggemukan?',
    a: 'Buat batch baru dengan mengisi tanggal masuk, jumlah ekor, dan bobot rata-rata. Setelah batch aktif, kamu bisa tambah sapi individual dengan ear tag, catat penimbangan rutin, dan tutup batch ketika penjualan selesai. Laporan laba-rugi per batch langsung tersedia otomatis.',
  },
  {
    q: 'Apakah bisa kelola sapi penggemukan dan breeding sekaligus?',
    a: 'Bisa. Satu akun TernakOS mendukung dua tipe peternakan sapi: Penggemukan (fattening) dan Breeding. Penggemukan fokus pada tracking bobot, ADG, BEP, dan R/C ratio menuju target panen. Breeding memiliki modul reproduksi untuk tracking IB, kehamilan, kelahiran, dan silsilah pedet.',
  },
  {
    q: 'Apa itu fitur Denah Kandang?',
    a: 'Denah Kandang adalah visualisasi interaktif posisi setiap sapi dalam kandang. Setiap titik berwarna berdasarkan performa ADG: hijau (ADG ≥ 0.8 kg/hari), kuning (0.5–0.8 kg), merah (< 0.5 kg). Tersedia mode tampilan 3D isometrik. Klik salah satu titik untuk langsung membuka kartu detail sapi tersebut.',
  },
  {
    q: 'Bagaimana sistem penugasan tim anak kandang bekerja?',
    a: 'Owner atau manajer bisa membuat template tugas harian (pakan pagi, timbang, cek kesehatan) dan mengassign ke anak kandang. Setiap anak kandang melihat daftar tugasnya dan menandai selesai dari HP. Riwayat penyelesaian terekam otomatis.',
  },
  {
    q: 'Apa itu R/C Ratio dan BEP di peternakan sapi?',
    a: 'R/C Ratio (Revenue to Cost) mengukur efisiensi: R/C > 1 artinya usaha menguntungkan. BEP (Break Even Point) adalah titik balik modal yang menunjukkan kapan pendapatan penjualan sapi menutupi semua biaya. TernakOS menghitung keduanya otomatis per batch berdasarkan data biaya dan harga jual aktual.',
  },
]
