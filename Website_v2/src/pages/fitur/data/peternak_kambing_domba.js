import { RefreshCw, Package, Home, ClipboardList, Milk, BarChart2 } from 'lucide-react'

export const groups = [
  {
    Icon: RefreshCw,
    title: 'Penggemukan & Breeding dalam Satu Akun',
    desc: '5 sub-tipe tersedia: Kambing Penggemukan, Kambing Breeding, Kambing Perah, Domba Penggemukan, Domba Breeding.',
    features: [
      'Penggemukan: sistem batch koloni massal (kambing & domba)',
      'Breeding: tracking individu & reproduksi (kambing & domba)',
      'Kambing Perah: produksi susu harian per ekor',
      'Switch antar tipe tanpa keluar aplikasi',
      'Data & laporan terpisah per tipe',
    ],
  },
  {
    Icon: Package,
    title: 'Batch Penggemukan: ADG, FCR & BEP',
    desc: 'Catat masuk, pantau performa, dan tutup batch saat panen tanpa kertas.',
    features: [
      'Buat batch: tanggal masuk, jumlah ekor, bobot rata-rata',
      'Kartu ternak individual dengan ADG otomatis per ekor',
      'FCR & R/C ratio per batch dihitung realtime',
      'BEP otomatis untuk mengetahui kapan balik modal',
      'Target hari dan target bobot panen per batch',
      'Catat penjualan per ekor atau massal saat batch tutup',
    ],
  },
  {
    Icon: Home,
    title: 'Denah Kandang Visual',
    desc: 'Lihat posisi ternak di kandang, performa batch terbaca sekilas.',
    features: [
      'Visualisasi layout kandang interaktif',
      'Warna per ternak berdasarkan tier ADG (hijau/kuning/merah)',
      'Mode tampilan 3D isometrik',
      'Filter tampilan per batch aktif',
      'Klik ternak → kartu detail langsung terbuka',
    ],
  },
  {
    Icon: ClipboardList,
    title: 'Breeding: Reproduksi & Kesehatan',
    desc: 'Rekam medik per ekor dan siklus reproduksi penuh untuk mode Breeding.',
    features: [
      'Kartu ternak individu: silsilah, dam/sire lineage',
      'Manajemen reproduksi: IB / kawin alam, inseminator, tanggal',
      'Status kehamilan: birahi → IB → bunting → kelahiran',
      'Pencatatan kelahiran & silsilah pedet/cempe',
      'Conception rate & calving interval otomatis',
      'Log vaksinasi & pengobatan per ekor',
      'Tugas harian + penugasan tim anak kandang',
    ],
  },
  {
    Icon: Milk,
    title: 'Kambing Perah: Produksi Susu & Inventori',
    desc: 'Catat produksi susu harian per sesi, kelola inventori, dan rekam penjualan susu.',
    features: [
      'Recording produksi susu: sesi pagi, siang, sore',
      'Yield per ekor (liter) + kadar lemak / fat% per sesi',
      'Database ternak perah dengan status laktasi per ekor',
      'Inventori produk susu segar & olahan',
      'Catat penjualan susu ke pelanggan individual',
      'Registry pelanggan susu dengan riwayat pembelian',
      'Tugas harian + penugasan tim',
    ],
  },
  {
    Icon: BarChart2,
    title: 'Laporan & Pakan',
    desc: 'Laba-rugi penggemukan & breeding otomatis, stok pakan terpantau sebelum habis.',
    features: [
      'Laporan batch closure: HPP/ekor, laba-rugi, penjualan (Penggemukan)',
      'Laporan farm breeding dengan data reproduksi',
      'Stok hijauan & konsentrat dengan alert menipis',
      'Log pemberian pakan per batch dengan supplier tracking',
      'Catatan: Laporan finansial Kambing Perah segera hadir',
    ],
  },
]

export const hero = {
  eyebrow: 'Solusi Peternak Kambing & Domba',
  headline: 'Kelola Batch Penggemukan, Breeding, dan Produksi Susu Perah dalam Satu Platform.',
  sub: 'Dari koloni penggemukan massal hingga tracking reproduksi breeding dan pencatatan susu harian, kambing, domba, dan kambing perah didukung dalam satu platform digital tanpa kertas.',
  cta: 'Mulai Kelola Kandang Kambing Domba',
}

export const beforeAfter = [
  { before: 'Catat populasi & mortalitas di whiteboard kandang', after: 'Batch digital: ADG, FCR, R/C ratio & BEP terpantau real-time' },
  { before: 'Jadwal IB dan kelahiran tidak terdokumentasi', after: 'Manajemen reproduksi: conception rate & kelahiran terekam per ekor' },
  { before: 'Produksi susu kambing dicatat di buku, sering lupa sesi', after: 'Recording susu pagi/siang/sore per ekor dengan yield & fat%' },
  { before: 'Stok konsentrat baru ketahuan habis saat kosong', after: 'Alert stok pakan otomatis sebelum kehabisan' },
  { before: 'BEP & untung rugi batch dihitung asal kira-kira', after: 'Laporan HPP & laba-rugi per batch tersedia otomatis' },
]

export const faq = [
  {
    q: 'Apa perbedaan modul Penggemukan dan Breeding di TernakOS?',
    a: 'Penggemukan (Fattening) menggunakan sistem batch koloni, kamu input populasi massal per kandang, tracking ADG, FCR, BEP, dan tutup batch saat panen. Breeding menggunakan tracking individu, di mana setiap ternak punya kartu dengan silsilah, siklus reproduksi, dan rekam medik sendiri.',
  },
  {
    q: 'Apakah kambing dan domba bisa dikelola dalam satu akun?',
    a: 'Bisa. TernakOS mendukung 5 sub-tipe: Kambing Penggemukan, Kambing Breeding, Kambing Perah, Domba Penggemukan, dan Domba Breeding. Masing-masing punya data dan laporan terpisah, tapi semua bisa diakses dari satu login.',
  },
  {
    q: 'Apakah ada modul khusus untuk kambing perah?',
    a: 'Ada. Modul Kambing Perah mendukung recording produksi susu harian per sesi (pagi, siang, sore) per ekor, tracking kadar lemak (fat%), inventori produk susu, dan pencatatan penjualan susu ke pelanggan.',
  },
  {
    q: 'Bagaimana TernakOS membantu menghitung keuntungan per batch penggemukan?',
    a: 'TernakOS merangkum semua biaya per batch: harga beli ternak masuk, biaya pakan, biaya operasional (listrik, air), biaya kesehatan, lalu dikurangi pendapatan penjualan. HPP per ekor, R/C ratio, BEP, dan laba bersih per batch langsung tersedia.',
  },
  {
    q: 'Bagaimana sistem tugas harian untuk anak kandang bekerja?',
    a: 'Owner atau manajer buat template tugas (pakan pagi, pakan sore, cek kesehatan) dan assign ke anak kandang. Setiap pekerja bisa centang tugas selesai dari HP. Riwayat penyelesaian terekam untuk evaluasi performa tim harian.',
  },
  {
    q: 'Apakah mendukung tracking IB (Inseminasi Buatan) untuk kambing?',
    a: 'Ya. Modul Breeding mendukung tracking IB maupun kawin alam, termasuk inseminator, tanggal, status kehamilan, dan pencatatan kelahiran cempe. Conception rate dan calving interval dihitung otomatis dari data yang diinput.',
  },
]
