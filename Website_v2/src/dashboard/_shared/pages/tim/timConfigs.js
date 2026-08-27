/**
 * timConfigs.js
 * Role definition and permission configuration for Juragans Dashboard
 */

export const BROKER_SEMBAKO_TIM_CONFIG = {
  accent: '#0F172A',
  accentHover: '#1E293B',
  accentRgb: '15, 23, 42',

  roleBadgeMap: {
    dev:       { label: 'Developer',     class: 'bg-purple-500/10 text-purple-600 dark:text-purple-400 border-purple-500/20' },
    owner:     { label: 'Owner',         class: 'bg-[#0F172A]/10 text-[#0F172A] dark:text-slate-200 border-[#0F172A]/20' },
    manajer:   { label: 'Manajer',       class: 'bg-indigo-500/10 text-indigo-600 dark:text-indigo-400 border-indigo-500/20' },
    admin:     { label: 'Admin',         class: 'bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border-emerald-500/20' },
    sales:     { label: 'Sales / Kasir', class: 'bg-blue-500/10 text-blue-600 dark:text-blue-400 border-blue-500/20' },
    kasir:     { label: 'Kasir POS',     class: 'bg-blue-500/10 text-blue-600 dark:text-blue-400 border-blue-500/20' },
    gudang:    { label: 'Gudang & Stok', class: 'bg-amber-500/10 text-amber-600 dark:text-amber-400 border-amber-500/20' },
    kurir:     { label: 'Kurir / Logistik', class: 'bg-teal-500/10 text-teal-600 dark:text-teal-400 border-teal-500/20' },
    finance:   { label: 'Keuangan',      class: 'bg-rose-500/10 text-rose-600 dark:text-rose-400 border-rose-500/20' },
    view_only: { label: 'Lihat Saja',    class: 'bg-gray-500/10 text-gray-600 dark:text-gray-400 border-gray-500/20' },
    lainnya:   { label: 'Lainnya',       class: 'bg-gray-500/10 text-gray-500 border-gray-500/20' },
  },

  inviteRoles: [
    { value: 'admin',     label: 'Admin',            desc: 'Akses penuh ke operasional POS, keuangan, dan laporan.' },
    { value: 'manajer',   label: 'Manajer',          desc: 'Akses supervisi penjualan, gudang, dan staf operasional.' },
    { value: 'sales',     label: 'Sales / Kasir',    desc: 'Mengelola transaksi penjualan, kasir POS, dan toko.' },
    { value: 'gudang',    label: 'Gudang & Stok',    desc: 'Mengelola stok masuk/keluar, retur, dan opname inventori.' },
    { value: 'kurir',     label: 'Kurir / Logistik', desc: 'Akses pengiriman pesanan dan status serah terima barang.' },
    { value: 'finance',   label: 'Keuangan',         desc: 'Akses pencatatan pembayaran, piutang, dan arus kas.' },
    { value: 'view_only', label: 'Lihat Saja',       desc: 'Akses analitik dan laporan tanpa wewenang mengubah data.' },
  ],
  defaultInviteRole: 'admin',

  cardBg: '#FFFFFF',
  cardRadius: '18px',
  inputBg: '#F8FAFC',
  inviteCodeTitle: 'Kode Undangan Tim ERP',
}

// Aliases for universal compatibility
export const UNIVERSAL_ERP_TIM_CONFIG = BROKER_SEMBAKO_TIM_CONFIG
export const PETERNAK_TIM_CONFIG = BROKER_SEMBAKO_TIM_CONFIG
export const BROKER_POULTRY_TIM_CONFIG = BROKER_SEMBAKO_TIM_CONFIG
export const BROKER_TELUR_TIM_CONFIG = BROKER_SEMBAKO_TIM_CONFIG
export const RPA_TIM_CONFIG = BROKER_SEMBAKO_TIM_CONFIG
