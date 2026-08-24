export const ROLES = [
  { id: 'broker',   label: 'Broker',   icon: '/assets/icons/models/role_broker.png' },
  { id: 'peternak', label: 'Peternak', icon: '/assets/icons/models/role_peternak.png' },
  { id: 'rpa',      label: 'RPA',      icon: '/assets/icons/models/role_rpa.png' },
]

export const SUBS = {
  broker: [
    { id: 'ayam',    label: 'Broker Ayam',           disabled: false },
    { id: 'telur',   label: 'Broker Telur',           disabled: false },
    { id: 'sembako', label: 'Distributor Sembako',    disabled: false },
  ],
  peternak: [
    { id: 'ayam',          label: 'Ayam Broiler & Layer',               disabled: false },
    { id: 'sapi_potong',   label: 'Sapi Potong (Fattening & Breeding)', disabled: false },
    { id: 'sapi_perah',    label: 'Sapi Perah',                         disabled: true  },
    { id: 'kambing_domba', label: 'Kambing & Domba',                    disabled: false },
  ],
  rpa: [],
}

export const SHARED = [
  {
    Icon: 'Bot',
    title: 'TernakBot AI Assistant',
    desc: 'Tanya langsung: "Batch mana ADG-nya tertinggal?" atau "Ringkas performa bulan ini" untuk membuat AI merangkum data bisnis kamu dalam hitungan detik.',
  },
  {
    Icon: 'LayoutDashboard',
    title: 'Dashboard Analisis Real-time',
    desc: 'Beranda interaktif per farm: ringkasan batch aktif, performa keuangan, dan metrik kunci yang diperbarui otomatis tanpa reload.',
  },
  {
    Icon: 'ShieldCheck',
    title: 'RBAC 4 Level Role (Pro+)',
    desc: 'Owner, Manajer, Staff, dan View Only (tersedia di plan Pro ke atas). Undang anggota tim dengan kode 6 digit. Plan Starter dibatasi untuk Owner saja.',
  },
  {
    Icon: 'Lock',
    title: 'Keamanan Data Bank-Grade',
    desc: 'Row Level Security (RLS) PostgreSQL memastikan data bisnis kamu tidak bisa diakses pengguna lain. Backup otomatis real-time di cloud.',
  },
]

export const FAQ_COMMON = [
  {
    q: 'Apakah TernakOS gratis?',
    a: 'TernakOS menyediakan paket Starter gratis selamanya. Untuk fitur yang lebih lengkap, kamu bisa mencoba trial paket Pro atau Business secara gratis tanpa kartu kredit.',
  },
  {
    q: 'Berapa lama setup awal TernakOS?',
    a: 'Rata-rata kurang dari 15 menit. Daftar, pilih tipe bisnis, undang anggota tim, dan langsung bisa pakai. Tidak perlu instalasi software apapun.',
  },
  {
    q: 'Apakah bisa dipakai di HP Android biasa?',
    a: 'Ya. TernakOS adalah aplikasi berbasis web yang dioptimasi untuk mobile. Berjalan lancar di HP Android dengan browser Chrome, tanpa perlu download apapun dari Play Store.',
  },
  {
    q: 'Apakah bisa dipakai saat sinyal susah di kandang?',
    a: 'TernakOS menggunakan sistem prefetching dan caching lokal. Data yang sudah dimuat tetap bisa diakses meski koneksi terputus sementara. Sinkronisasi otomatis saat koneksi kembali.',
  },
  {
    q: 'Apakah data saya aman dari kompetitor?',
    a: 'Setiap akun memiliki isolasi data penuh menggunakan Row Level Security (RLS) di PostgreSQL. Data bisnis kamu tidak bisa diakses oleh pengguna lain meskipun menggunakan platform yang sama.',
  },
  {
    q: 'Bisakah satu orang punya lebih dari satu bisnis di TernakOS?',
    a: 'Bisa. Satu akun login bisa terhubung ke beberapa bisnis sekaligus, misalnya kamu punya kandang broiler sekaligus usaha broker ayam. Tinggal switch bisnis dari dashboard.',
  },
  {
    q: 'Apakah ada fitur undang karyawan atau tim?',
    a: 'Ada. Mulai dari plan Pro, Owner bisa undang anggota tim via kode 6 digit. Setiap anggota dapat role berbeda: Staff, View Only, Sopir, dengan batasan akses yang sesuai jabatannya. Pada plan Starter, akses dibatasi untuk Owner saja (mandiri).',
  },
  {
    q: 'Apakah TernakOS bisa dipakai di laptop atau komputer?',
    a: 'Bisa. TernakOS berjalan di semua browser modern (Chrome, Firefox, Safari, Edge) di HP maupun laptop tanpa instalasi apapun.',
  },
  {
    q: 'Bagaimana cara backup data di TernakOS?',
    a: 'Data tersimpan otomatis di cloud (Supabase PostgreSQL) dengan replikasi real-time. Tidak perlu backup manual karena data kamu aman meski HP hilang atau rusak.',
  },
  {
    q: 'Apakah ada notifikasi otomatis?',
    a: 'Ya. TernakOS mengirim notifikasi in-app untuk: piutang jatuh tempo, stok pakan menipis, pengiriman tiba, dan masa berlangganan hampir habis. Tidak perlu cek manual setiap hari.',
  },
]
