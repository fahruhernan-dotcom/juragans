// ─── Roles & Subs ─────────────────────────────────────────────────────────────

export const ROLES = [
  { id: 'broker', label: 'Broker', icon: '/assets/icons/models/role_broker.png' },
  { id: 'peternak', label: 'Peternak', icon: '/assets/icons/models/role_peternak.png' },
  { id: 'rpa', label: 'RPA', icon: '/assets/icons/models/role_rpa.png' },
]

export const SUBS = {
  broker: [
    { id: 'ayam', label: 'Broker Ayam', disabled: false },
    { id: 'telur', label: 'Broker Telur', disabled: false },
    { id: 'distributor', label: 'Distributor Daging', disabled: false },
    { id: 'sembako', label: 'Distributor Sembako', disabled: false },
  ],
  peternak: [
    { id: 'ayam_broiler', label: 'Ayam Broiler', disabled: false },
    { id: 'ayam_layer', label: 'Ayam Layer', disabled: true },
    { id: 'sapi_potong_fattening', label: 'Sapi Potong (Fattening)', disabled: false },
    { id: 'sapi_potong_breeding', label: 'Sapi Potong (Breeding)', disabled: false },
    { id: 'sapi_perah', label: 'Sapi Perah', disabled: true },
    { id: 'kambing_potong_fattening', label: 'Kambing Potong (Fattening)', disabled: false },
    { id: 'kambing_potong_breeding', label: 'Kambing Potong (Breeding)', disabled: false },
    { id: 'kambing_perah', label: 'Kambing Perah', disabled: false },
    { id: 'domba_potong_fattening', label: 'Domba Potong (Fattening)', disabled: false },
    { id: 'domba_potong_breeding', label: 'Domba Potong (Breeding)', disabled: false },
  ],
  rpa: [
    { id: 'buyer', label: 'Rumah Potong Ayam (RPA)', disabled: false },
    { id: 'rph', label: 'Rumah Potong Hewan (RPH)', disabled: false },
  ],
}

// ─── FAQ ──────────────────────────────────────────────────────────────────────

export const FAQ_LIST = [
  {
    q: 'Apakah ada kontrak jangka panjang?',
    a: 'Tidak. Kamu bisa cancel kapan saja. Tidak ada biaya tambahan atau penalti pembatalan.',
  },
  {
    q: 'Bagaimana cara pembayaran?',
    a: 'Transfer bank manual. Admin akan konfirmasi dalam 1×24 jam kerja setelah bukti transfer diterima.',
  },
  {
    q: 'Apakah data saya aman?',
    a: 'Ya. Data disimpan di Supabase (PostgreSQL) dengan enkripsi end-to-end dan backup otomatis setiap hari. Data bisnis kamu tidak pernah dijual ke pihak manapun.',
  },
  {
    q: 'Apa yang terjadi setelah trial berakhir?',
    a: 'Kamu akan diminta memilih plan. Data tidak dihapus selama 30 hari setelah masa trial berakhir, sehingga kamu punya waktu untuk memutuskan.',
  },
  {
    q: 'Bisakah saya upgrade atau downgrade plan?',
    a: 'Bisa. Hubungi admin via WhatsApp untuk proses upgrade/downgrade. Penyesuaian harga dihitung secara prorata.',
  },
  {
    q: 'Apa bedanya Pro dan Business?',
    a: 'Pro sudah cukup untuk 1 bisnis berkembang: unlimited transaksi, tim hingga 3 orang, laporan lengkap, dan Cash Flow. Business untuk yang sudah scaling: multi-gudang, TernakBot AI unlimited + Prediksi Hasil, tim tidak terbatas, dan AI Audit Log.',
  },
  {
    q: 'Apa yang terjadi jika kuota Starter habis?',
    a: 'Transaksi/entri ke-31 akan diblokir otomatis sampai bulan berikutnya atau sampai upgrade ke Pro. Data yang sudah masuk tetap aman dan bisa dilihat.',
  },
  {
    q: 'Apakah trial Pro/Business perlu kartu kredit?',
    a: 'Tidak. Trial 14 hari gratis tanpa kartu kredit dan tanpa komitmen. Setelah 14 hari otomatis turun ke Starter jika tidak bayar.',
  },
  {
    q: 'Apakah harga berbeda untuk setiap tipe bisnis?',
    a: 'Ya, harga Pro disesuaikan dengan kompleksitas fitur: Peternak Rp 499rb/bln, RPA Rp 699rb/bln, Broker & Distributor Rp 999rb/bln.',
  },
  {
    q: 'Apakah TernakBot AI tersedia di Starter?',
    a: 'TernakBot AI tersedia eksklusif di plan Business dengan unlimited sesi, Analisis Performa, Prediksi Hasil, dan AI Audit Log. Starter dan Pro belum mendapatkan akses TernakBot.',
  },
]

export const ENTERPRISE_FEATURES = [
  'Semua fitur Business',
  'Onboarding dedicated',
  'SLA & support prioritas 24/7',
  'Integrasi custom (API)',
  'Multi-tenant management',
  'Kontrak fleksibel',
]

// ─── Helpers ──────────────────────────────────────────────────────────────────

export function fmtIDR(n) {
  // Manual formatting avoids Node.js vs browser ICU differences (React #418 hydration mismatch)
  return 'Rp ' + String(Math.round(n)).replace(/\B(?=(\d{3})+(?!\d))/g, '.')
}

// ─── Base pricing templates ────────────────────────────────────────────────────

const _brokerBase = {
  proPrice: 999000,
  proYearly: 799000,
  proStrike: 1499000,
  bizPrice: 1499000,
  bizYearly: 1199000,
  bizStrike: 2499000,
  starterFeatures: [
    'Input transaksi harian (kuota bulanan)',
    'Laporan harian dasar',
    'Manajemen 1 armada/sopir',
    'Harga pasar realtime',
  ],
  starterMissing: [
    'RPA & piutang management',
    'Cash Flow & Laporan Keuangan',
    'Export laporan PDF/Excel',
    'Undang anggota tim',
    'TernakBot AI (Business only)',
  ],
}

const _peternakBase = {
  proPrice: 499000,
  proYearly: 399000,
  proStrike: 749000,
  bizPrice: 999000,
  bizYearly: 799000,
  bizStrike: 1499000,
  addOnNote: true,
  starterFeatures: [
    '1 kandang / batch aktif',
    'Input harian unlimited',
    'Pencatatan tugas harian mandiri',
    'Laporan dasar',
  ],
  starterMissing: [
    'Kandang / batch ke-2 dan seterusnya',
    'Jumlah ternak melebihi kuota starter',
    'Export laporan PDF/Excel',
    'Undang anggota tim',
    'Penugasan tim & anak kandang',
  ],
}

const _rpaBase = {
  proPrice: 699000,
  proYearly: 559000,
  proStrike: 999000,
  bizPrice: 1499000,
  bizYearly: 1199000,
  bizStrike: 2499000,
  starterFeatures: [
    'Input operasional harian (kuota bulanan)',
    'Kelola 1 unit RPA/RPH',
    'Tracking hutang ke broker',
    'Harga pasar realtime',
  ],
  starterMissing: [
    'Laporan Margin Keuntungan',
    'PDF Surat Jalan distribusi',
    'Export laporan PDF/Excel',
    'Undang anggota tim',
    'TernakBot AI (Business only)',
  ],
}

// ─── Pricing data per vertical ────────────────────────────────────────────────

export const PRICING_DATA = {
  broker_ayam: {
    ..._brokerBase,
    socialProof: '280+',
    starterFeatures: [
      'Transaksi beli & jual (kuota bulanan)',
      'Kandang mitra, pengiriman & loss report',
      'RPA database & piutang realtime',
      '1 kendaraan & 1 sopir',
      'Harga pasar realtime',
    ],
    starterMissing: [
      'Dashboard Cash Flow bulanan',
      'Simulator BEP & estimasi keuntungan',
      'Export laporan PDF/Excel',
      'Undang anggota tim',
    ],
    proFeatures: [
      'Transaksi beli & jual unlimited',
      'Kandang mitra, pengiriman & loss report unlimited',
      'RPA & piutang management lengkap',
      'Dashboard Cash Flow bulanan + grafik breakdown',
      'Simulator: BEP, ROI%, margin/kg per deal',
      'Armada kendaraan & sopir unlimited',
      'Pengeluaran armada: BBM, servis, pajak',
      'PDF Surat Jalan pengiriman',
      'Tim maks 3 anggota',
      'Harga pasar & trend realtime',
      'Support via WhatsApp',
    ],
    bizExtras: [
      'Export Cash Flow PDF & Excel',
      'Timbangan digital terintegrasi',
      'TernakBot AI Business (Unlimited + Prediksi Hasil)',
      'AI Audit Log aktivitas tim',
      'Tim unlimited',
      'Priority support',
    ],
  },
  broker_telur: {
    ..._brokerBase,
    socialProof: '90+',
    starterFeatures: [
      'POS penjualan telur (tanpa batas)',
      'Inventori multi-grade: Grade A, Gajah, TB, Lokal',
      'HPP & margin % per grade otomatis',
      'Database pelanggan & supplier',
      'Riwayat transaksi & piutang',
    ],
    starterMissing: [
      'Undang anggota tim',
    ],
    proFeatures: [
      'Semua fitur Starter (tanpa batas)',
      'Inventori multi-grade unlimited',
      'Database pelanggan & supplier unlimited',
      'Tracking piutang & partial payment',
      'Cetak invoice PDF',
      'Tim maks 3 anggota',
      'Support via WhatsApp',
    ],
    bizExtras: [
      'TernakBot AI Business (Unlimited + Prediksi Hasil)',
      'AI Audit Log aktivitas tim',
      'Tim unlimited',
      'Priority support',
    ],
  },
  peternak_ayam_broiler: {
    ..._peternakBase,
    socialProof: '120+',
    starterMissing: [
      'Kandang ke-2 dan seterusnya',
      'Export laporan PDF/Excel',
      'Undang anggota tim',
      'Penugasan tim & anak kandang',
    ],
    proFeatures: [
      '2 kandang broiler aktif',
      'Siklus lengkap: chick-in → panen (status Growing/Ready/Panen)',
      'Input harian: mortalitas, pakan, bobot, untuk melihat FCR realtime',
      'Standar Cobb500 sebagai benchmark bobot harian',
      'Jadwal vaksinasi: ND+IB, Gumboro, booster, serta log per dosis',
      'Laporan siklus: FCR final, IP Score, HPP/kg, laba-rugi',
      'Stok pakan: Starter/Grower/Finisher + alert menipis',
      'Tugas harian + penugasan anak kandang',
      'Sistem gaji & bonus anak kandang (bonus jika FCR < target)',
      'Support via WhatsApp',
    ],
    bizExtras: [
      'Kandang unlimited',
      'TernakBot AI Business (Unlimited + Prediksi Hasil)',
      'Export laporan PDF/Excel',
      'AI Audit Log aktivitas tim',
      'Tim unlimited',
      'Priority support',
    ],
  },
  peternak_ayam_layer: {
    ..._peternakBase,
    socialProof: '80+',
    proFeatures: [
      'Fitur peternak layer (petelur) sedang dikembangkan',
      'Tugas harian tersedia sekarang',
      'Akan hadir: recording produksi telur harian, HDP tracking, laporan layer',
      'Subscriber Pro mendapat akses otomatis saat fitur live',
      'Support via WhatsApp',
    ],
    bizExtras: [
      'Kandang unlimited',
      'TernakBot AI Business (Unlimited + Prediksi Hasil)',
      'Export laporan PDF/Excel',
      'AI Audit Log aktivitas tim',
      'Tim unlimited',
      'Priority support',
    ],
  },
  peternak_sapi_potong_fattening: {
    ..._peternakBase,
    socialProof: '25+',
    proFeatures: [
      '2 batch fattening aktif',
      'Kartu ternak individual: ear tag, ADG otomatis, prediksi panen',
      'Denah kandang interaktif (dot warna per tier ADG)',
      'FCR, R/C ratio & BEP per batch dihitung realtime',
      'Kesehatan: log sakit, treatment, mortality per ekor',
      'Stok pakan dengan supplier tracking',
      'Catat penjualan per ekor atau per batch',
      'Laporan batch: FCR final, HPP/kg, laba-rugi',
      'Tugas harian + penugasan tim anak kandang',
      'Support via WhatsApp',
    ],
    bizExtras: [
      'Batch/kandang unlimited',
      'TernakBot AI Business (Unlimited + Prediksi Hasil)',
      'Export laporan PDF/Excel',
      'AI Audit Log aktivitas tim',
      'Tim unlimited',
      'Priority support',
    ],
  },

  peternak_sapi_potong_breeding: {
    ..._peternakBase,
    socialProof: '15+',
    proFeatures: [
      '2 batch breeding aktif',
      'Kartu ternak individu dengan silsilah dam/sire',
      'Manajemen reproduksi: IB/kawin alam, inseminator, status kehamilan',
      'Pencatatan kelahiran & silsilah pedet',
      'Conception rate & calving interval otomatis',
      'Kesehatan per ekor: vaksinasi, treatment, log medis',
      'Stok pakan & log pemberian per batch',
      'Laporan farm breeding',
      'Tugas harian + penugasan tim',
      'Support via WhatsApp',
    ],
    bizExtras: [
      'Batch/kandang unlimited',
      'TernakBot AI Business (Unlimited + Prediksi Hasil)',
      'Export laporan PDF/Excel',
      'AI Audit Log aktivitas tim',
      'Tim unlimited',
      'Priority support',
    ],
  },

  peternak_sapi_perah: {
    ..._peternakBase,
    socialProof: '20+',
    proFeatures: [
      'Fitur Sapi Perah sedang dikembangkan',
      'Tersedia segera untuk subscriber Pro',
      'Support via WhatsApp',
    ],
    bizExtras: [
      'Kandang unlimited',
      'TernakBot AI Business (Unlimited + Prediksi Hasil)',
      'Export laporan PDF/Excel',
      'AI Audit Log aktivitas tim',
      'Tim unlimited',
      'Priority support',
    ],
  },

  peternak_kambing_potong_fattening: {
    ..._peternakBase,
    socialProof: '45+',
    proFeatures: [
      '2 batch fattening aktif',
      'Kartu ternak individual: ear tag, ADG otomatis, prediksi panen',
      'Denah kandang interaktif (dot warna per tier ADG)',
      'FCR, R/C ratio & BEP per batch dihitung realtime',
      'Kesehatan: log sakit, treatment, mortality',
      'Stok pakan (hijauan & konsentrat) + alert menipis',
      'Catat penjualan per ekor atau massal',
      'Laporan batch: FCR final, HPP/ekor, laba-rugi',
      'Tugas harian + penugasan tim',
      'Support via WhatsApp',
    ],
    bizExtras: [
      'Batch/kandang unlimited',
      'TernakBot AI Business (Unlimited + Prediksi Hasil)',
      'Export laporan PDF/Excel',
      'AI Audit Log aktivitas tim',
      'Tim unlimited',
      'Priority support',
    ],
  },

  peternak_kambing_potong_breeding: {
    ..._peternakBase,
    socialProof: '20+',
    proFeatures: [
      '2 batch breeding aktif',
      'Kartu ternak individu dengan silsilah',
      'Manajemen reproduksi: IB/kawin alam, status kehamilan, kelahiran cempe',
      'Conception rate & calving interval otomatis',
      'Kesehatan per ekor: vaksinasi, treatment',
      'Laporan farm breeding',
      'Tugas harian + penugasan tim',
      'Support via WhatsApp',
    ],
    bizExtras: [
      'Batch/kandang unlimited',
      'TernakBot AI Business (Unlimited + Prediksi Hasil)',
      'Export laporan PDF/Excel',
      'AI Audit Log aktivitas tim',
      'Tim unlimited',
      'Priority support',
    ],
  },

  peternak_kambing_perah: {
    ..._peternakBase,
    socialProof: '10+',
    proFeatures: [
      '2 kelompok ternak perah aktif',
      'Database kambing perah dengan status laktasi per ekor',
      'Recording produksi susu: sesi pagi, siang, sore per ekor',
      'Yield (liter) + kadar lemak / fat% per sesi',
      'Inventori produk susu segar & olahan',
      'Catat penjualan susu ke pelanggan individual',
      'Tugas harian + penugasan tim',
      'Catatan: Laporan finansial segera hadir',
      'Support via WhatsApp',
    ],
    bizExtras: [
      'Kelompok ternak unlimited',
      'TernakBot AI Business (Unlimited + Prediksi Hasil)',
      'Export laporan PDF/Excel',
      'AI Audit Log aktivitas tim',
      'Tim unlimited',
      'Priority support',
    ],
  },

  peternak_domba_potong_fattening: {
    ..._peternakBase,
    socialProof: '50+',
    proFeatures: [
      '2 batch fattening aktif',
      'Kartu ternak individual: ear tag, ADG otomatis, prediksi panen',
      'Denah kandang interaktif (dot warna per tier ADG)',
      'FCR, R/C ratio & BEP per batch dihitung realtime',
      'Kesehatan: log sakit, treatment, mortality',
      'Stok pakan (hijauan & konsentrat) + alert menipis',
      'Catat penjualan per ekor atau massal',
      'Laporan batch: FCR final, HPP/ekor, laba-rugi',
      'Tugas harian + penugasan tim',
      'Support via WhatsApp',
    ],
    bizExtras: [
      'Batch/kandang unlimited',
      'TernakBot AI Business (Unlimited + Prediksi Hasil)',
      'Export laporan PDF/Excel',
      'AI Audit Log aktivitas tim',
      'Tim unlimited',
      'Priority support',
    ],
  },

  peternak_domba_potong_breeding: {
    ..._peternakBase,
    socialProof: '25+',
    proFeatures: [
      '2 batch breeding aktif',
      'Kartu ternak individu dengan silsilah',
      'Manajemen reproduksi: IB/kawin alam, status kehamilan, kelahiran cempe',
      'Conception rate & calving interval otomatis',
      'Kesehatan per ekor: vaksinasi, treatment',
      'Laporan farm breeding',
      'Tugas harian + penugasan tim',
      'Support via WhatsApp',
    ],
    bizExtras: [
      'Batch/kandang unlimited',
      'TernakBot AI Business (Unlimited + Prediksi Hasil)',
      'Export laporan PDF/Excel',
      'AI Audit Log aktivitas tim',
      'Tim unlimited',
      'Priority support',
    ],
  },

  rpa_buyer: {
    ..._rpaBase,
    socialProof: '60+',
    proFeatures: [
      'Order ke broker unlimited',
      'Tracking hutang & pembayaran',
      'Laporan Margin Keuntungan per produk',
      'PDF Surat Jalan distribusi',
      'Top customer analytics',
      'TernakOS Market access',
      'Tim maks 3 anggota',
      'Support via WhatsApp',
    ],
    bizExtras: [
      'TernakBot AI Business (Unlimited + Prediksi Hasil)',
      'AI Audit Log aktivitas tim',
      'Tim unlimited',
      'Priority support',
    ],
  },
  rpa_rph: {
    ..._rpaBase,
    socialProof: '25+',
    proFeatures: [
      'Manajemen order RPH unlimited',
      'Tracking hutang ke supplier ternak',
      'Laporan margin karkas/hidup',
      'PDF Surat Jalan distribusi',
      'Analytics pelanggan jagal',
      'TernakOS Market access',
      'Tim maks 3 anggota',
      'Support via WhatsApp',
    ],
    bizExtras: [
      'TernakBot AI Business (Unlimited + Prediksi Hasil)',
      'AI Audit Log aktivitas tim',
      'Tim unlimited',
      'Priority support',
    ],
  },
  broker_distributor: {
    ..._brokerBase,
    socialProof: '30+',
    starterFeatures: [
      'Transaksi beli & jual (kuota bulanan)',
      'Kandang mitra, pengiriman & loss report',
      'RPA database & piutang realtime',
      '1 kendaraan & 1 sopir',
      'Harga pasar realtime',
    ],
    starterMissing: [
      'Dashboard Cash Flow bulanan',
      'Simulator BEP & estimasi keuntungan',
      'Export laporan PDF/Excel',
      'Undang anggota tim',
    ],
    proFeatures: [
      'Transaksi beli & jual unlimited',
      'Kandang mitra, pengiriman & loss report unlimited',
      'RPA & piutang management lengkap',
      'Dashboard Cash Flow bulanan + grafik breakdown',
      'Simulator: BEP, ROI%, margin/kg per deal',
      'Armada kendaraan & sopir unlimited',
      'Pengeluaran armada: BBM, servis, pajak',
      'PDF Surat Jalan pengiriman',
      'Tim maks 3 anggota',
      'Harga pasar & trend realtime',
      'Support via WhatsApp',
    ],
    bizExtras: [
      'Export Cash Flow PDF & Excel',
      'Timbangan digital terintegrasi',
      'TernakBot AI Business (Unlimited + Prediksi Hasil)',
      'AI Audit Log aktivitas tim',
      'Tim unlimited',
      'Priority support',
    ],
  },
  broker_sembako: {
    ..._brokerBase,
    socialProof: '120+',
    starterFeatures: [
      'Invoice penjualan (kuota bulanan)',
      'Inventori & batch tracking dengan HPP',
      'Manajemen gudang & riwayat mutasi stok',
      'Database toko & supplier',
      'Pengiriman & logistik dasar',
    ],
    starterMissing: [
      'Laporan laba-rugi & analitik',
      'PDF Invoice ke pelanggan',
      'Manajemen pegawai & payroll',
      'Undang anggota tim',
      'Multi-gudang (Business)',
    ],
    proFeatures: [
      'Invoice penjualan unlimited',
      'PDF Invoice ke pelanggan',
      'Inventori, batch tracking & gudang unlimited',
      'Database toko & supplier unlimited',
      'Pengiriman dengan assign sopir',
      'Laporan laba-rugi, COGS & analitik Pareto',
      'Manajemen pegawai + gaji & payroll',
      'Tim maks 3 anggota',
      'Support via WhatsApp',
    ],
    bizExtras: [
      'Multi-gudang & transfer stok antar lokasi',
      'Export laporan PDF & Excel',
      'TernakBot AI Business (Unlimited + Prediksi Hasil)',
      'AI Audit Log aktivitas tim',
      'Tim unlimited',
      'Priority support',
    ],
  },
}

// ─── Comparison table rows (per role) ────────────────────────────────────────

export const COMPARE_ROWS = {
  broker: [
    { label: 'Transaksi',           starter: 'Terbatas',     pro: 'Unlimited',  biz: 'Unlimited' },
    { label: 'Armada & Sopir',      starter: '1 unit',     pro: 'Unlimited',  biz: 'Unlimited' },
    { label: 'Undang Tim',          starter: null,         pro: '3 orang',    biz: 'Unlimited' },
    { label: 'Cash Flow',           starter: null,         pro: true,         biz: true },
    { label: 'Simulator Margin',    starter: null,         pro: true,         biz: true },
    { label: 'PDF Surat Jalan',     starter: null,         pro: true,         biz: true },
    { label: 'Export PDF/Excel',    starter: null,         pro: null,         biz: true },
    { label: 'Timbangan Digital',   starter: null,         pro: null,         biz: true },
    { label: 'TernakBot AI',        starter: null,         pro: null,         biz: 'Unlimited' },
    { label: 'AI Prediksi',         starter: null,         pro: null,         biz: true },
    { label: 'AI Audit Log',        starter: null,         pro: null,         biz: true },
  ],
  peternak: [
    { label: 'Kandang Aktif',       starter: '1',          pro: '2',          biz: 'Unlimited' },
    { label: 'Jumlah Ternak (Ruminansia)', starter: 'Ada limit', pro: 'Limit lebih besar', biz: 'Unlimited' },
    { label: 'Input Harian',        starter: 'Unlimited',  pro: 'Unlimited',  biz: 'Unlimited' },
    { label: 'Tugas Harian',        starter: true,         pro: true,         biz: true },
    { label: 'Anggota Tim',         starter: 'Owner saja', pro: '3 orang',    biz: 'Unlimited' },
    { label: 'Export Laporan',      starter: null,         pro: true,         biz: true },
    { label: 'TernakBot AI',        starter: null,         pro: null,         biz: 'Unlimited' },
    { label: 'AI Prediksi',         starter: null,         pro: null,         biz: true },
    { label: 'AI Audit Log',        starter: null,         pro: null,         biz: true },
  ],
  rpa: [
    { label: 'Transaksi/Order',  starter: 'Terbatas',  pro: 'Unlimited', biz: 'Unlimited' },
    { label: 'Anggota Tim',      starter: '—',       pro: '3 orang',   biz: 'Unlimited' },
    { label: 'Laporan Margin',   starter: null,      pro: true,        biz: true },
    { label: 'PDF Surat Jalan',  starter: null,      pro: true,        biz: true },
    { label: 'TernakBot AI',        starter: null,         pro: null,         biz: 'Unlimited' },
    { label: 'AI Prediksi',      starter: null,      pro: null,        biz: true },
    { label: 'AI Audit Log',     starter: null,      pro: null,        biz: true },
  ],
}
