/**
 * BUSINESS CATEGORIES
 * Clean Universal Commerce & ERP Models
 */
export const BUSINESS_CATEGORIES = [
  {
    key: 'broker',
    label: 'Distributor & Perdagangan',
    icon: '/assets/icons/models/distributor_sembako.png',
    description: 'Sistem POS Kasir, Multi-Gudang, Piutang & Manajemen Inventaris FIFO.',
  },
  {
    key: 'retail',
    label: 'Retail & Toko Modern',
    icon: '/assets/icons/models/distributor_sembako.png',
    description: 'Manajemen kasir cepat, barcode scanner, dan laporan laba rugi realtime.',
  },
]

export const ANIMAL_GROUPS = []

const createNav = (category, subType, items) =>
  items.map((item) => ({
    ...item,
    path: `/${category}/${subType}/${item.slug}`,
  }))

const UNIVERSAL_SEMBAKO_NAV = createNav('broker', 'distributor_sembako', [
  { slug: 'beranda',      icon: 'Home',           label: 'Home'   },
  { slug: 'penjualan',    icon: 'ShoppingCart',   label: 'Jual'      },
  { slug: 'gudang',       icon: 'Package',        label: 'Gudang'    },
  { slug: 'toko-supplier',icon: 'Store',          label: 'Toko'      },
])

const UNIVERSAL_DRAWER_MENU = [
  { path: '/broker/distributor_sembako/produk',        icon: 'Package',  label: 'Produk & Stok' },
  { path: '/broker/distributor_sembako/toko-supplier', icon: 'Store',    label: 'Toko & Supplier'  },
  { path: '/broker/distributor_sembako/gudang',        icon: 'Warehouse',label: 'Stok & Gudang'    },
  { path: '/broker/distributor_sembako/retur',         icon: 'RotateCcw',label: 'Retur Produk'     },
  { path: '/broker/distributor_sembako/karyawan',      icon: 'Users',    label: 'Karyawan'         },
  { path: '/broker/distributor_sembako/laporan',       icon: 'BarChart2',label: 'Laporan'          },
  { path: '/broker/distributor_sembako/akun',          icon: 'User',     label: 'Akun & Profil'    },
]

export const BUSINESS_MODELS = {
  distributor_sembako: {
    key: 'distributor_sembako',
    category: 'broker',
    name: 'Virgin Master ERP & POS',
    label: 'Distributor & Grosir',
    categoryLabel: 'Perdagangan',
    icon: '/assets/icons/models/distributor_sembako.png',
    description: 'Sistem POS Kasir, Multi-Gudang, Piutang Pelanggan, dan Inventaris FIFO.',
    color: '#0F172A',
    themeColor: 'slate',
    user_type: 'broker',
    sub_type: 'distributor_sembako',
    comingSoon: false,
    bottomNav: UNIVERSAL_SEMBAKO_NAV,
    drawerMenu: UNIVERSAL_DRAWER_MENU,
    fabPath: '/broker/distributor_sembako/penjualan?action=new',
  },
  general_trading: {
    key: 'general_trading',
    category: 'broker',
    name: 'General Trading & Retail',
    label: 'General Trading',
    categoryLabel: 'Perdagangan',
    icon: '/assets/icons/models/distributor_sembako.png',
    description: 'Distribusi barang komersial umum dan retail multi-satuan.',
    color: '#0F172A',
    themeColor: 'slate',
    user_type: 'broker',
    sub_type: 'distributor_sembako',
    comingSoon: false,
    bottomNav: UNIVERSAL_SEMBAKO_NAV,
    drawerMenu: UNIVERSAL_DRAWER_MENU,
    fabPath: '/broker/distributor_sembako/penjualan?action=new',
  },
}

export const VERTICAL_ALIASES = {
  'distributor_sembako': 'distributor_sembako',
  'sembako_broker':      'distributor_sembako',
  'general_trading':     'general_trading',
  'retail_pos':          'distributor_sembako',
  'fmcg_distributor':    'distributor_sembako',
}

export const getXBasePath = (tenant, profile) => {
  return '/broker/distributor_sembako'
}

export function getBusinessModel(userType, subType) {
  const profile = { user_type: userType, sub_type: subType }
  const vertical = resolveBusinessVertical(profile, null)
  return BUSINESS_MODELS[vertical] || BUSINESS_MODELS.distributor_sembako
}

export const SUB_TYPE_TO_VERTICAL = VERTICAL_ALIASES

export function resolveBusinessVertical(profile, tenant) {
  const directVertical = tenant?.business_vertical || profile?.business_vertical
  if (directVertical && BUSINESS_MODELS[directVertical]) return directVertical
  if (directVertical && VERTICAL_ALIASES[directVertical]) return VERTICAL_ALIASES[directVertical]

  const subType = tenant?.sub_type || profile?.sub_type
  if (subType && VERTICAL_ALIASES[subType]) return VERTICAL_ALIASES[subType]

  return 'distributor_sembako'
}
