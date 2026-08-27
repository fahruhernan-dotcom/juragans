/**
 * ==============================================================================
 * 👑 JURAGANS DASHBOARD — CENTRALIZED BUSINESS CONFIGURATION
 * ==============================================================================
 * Berkas ini adalah PUSAT KENDALI TUNGGAL untuk menyesuaikan seluruh identitas,
 * terminologi industri, mata uang, kategori barang, satuan dinamis, tier harga,
 * serta menyalakan/mematikan fitur (feature toggles) untuk platform Juragans.
 * ==============================================================================
 */

export const BUSINESS_CONFIG = {
  // ── 1. IDENTITAS APLIKASI & BRANDING ──────────────────────────────────────
  appInfo: {
    appName: 'Juragans Dashboard',
    brandName: 'Juragans by Anak Bawang',
    shortName: 'Juragans',
    tagline: 'Sistem Pencatatan, Inventaris & Penjualan Bawang Goreng Premium',
    companyName: 'Juragans by Anak Bawang',
    logoUrl: '/favicon.svg',
    contactWhatsApp: '6285876401509',
    supportEmail: 'juragans.anakbawang@gmail.com',
  },

  // ── 2. LOKALISASI & MATA UANG ──────────────────────────────────────────────
  localization: {
    currencySymbol: 'Rp',
    currencyCode: 'IDR',
    locale: 'id-ID',
    timeZone: 'Asia/Jakarta',
    dateFormat: 'dd MMMM yyyy',
  },

  // ── 3. INDUSTRI AKTIF & TOGGLE FITUR MODULAR ──────────────────────────────
  // Pilihan industri: 'general_trading' | 'sembako' | 'pharmacy' | 'electronics' | 'building_material' | 'fashion' | 'fnb'
  activeIndustry: 'sembako',

  featureFlags: {
    // Aktifkan pelacakan tanggal kadaluarsa (wajib untuk Makanan/Farmasi)
    enableExpiryDateTracking: true,
    // Aktifkan konversi multi-satuan bertingkat (misal: 1 Dus = 40 Pcs)
    enableMultiUnitConversion: true,
    // Aktifkan penugasan kurir & Proof of Delivery (POD)
    enableCourierLogistics: false,
    // Aktifkan modul penggajian & komisi karyawan
    enableEmployeePayroll: false,
    // Aktifkan batasan limit kredit pelanggan (Credit Limit B2B)
    enableCustomerCreditLimit: true,
    // Aktifkan asisten kecerdasan buatan (MAIA AI Router)
    enableAIAssistant: false,
    // Aktifkan notifikasi jatuh tempo otomatis via WhatsApp & In-App
    enableAutomatedReminders: false,
  },

  // ── 4. TINGKAT HARGA JUAL (MULTI-TIER PRICING) ────────────────────────────
  priceTiers: [
    { key: 'retail', label: 'Harga Eceran (Umum)', default: true },
    { key: 'wholesale_1', label: 'Harga Grosir 1 (Warung/Toko)' },
    { key: 'wholesale_2', label: 'Harga Grosir 2 (Agen Besar)' },
    { key: 'special', label: 'Harga Langganan Khusus' },
  ],

  // ── 5. PRESET INDUSTRI SIAP PAKAI (DAPAT DIPILIH) ─────────────────────────
  presets: {
    // A. DISTRIBUTOR UMUM / GROSIR
    general_trading: {
      categories: [
        'Kebutuhan Pokok',
        'Makanan & Minuman',
        'Bumbu & Dapur',
        'Perlengkapan Rumah',
        'Produk Kemasan',
        'Lainnya',
      ],
      units: ['dus', 'karton', 'bal', 'pak', 'lusin', 'pcs', 'kg', 'liter', 'unit'],
    },

    // B. FMCG & SEMBAKO
    sembako: {
      categories: [
        'Beras & Pangan',
        'Minyak & Lemak',
        'Gula & Pemanis',
        'Tepung & Gandum',
        'Bumbu & Rempah',
        'Mie & Pasta',
        'Makanan & Camilan',
        'Minuman Kemasan',
        'Lainnya',
      ],
      units: ['sak', 'karton', 'dus', 'bal', 'renceng', 'pak', 'kg', 'liter', 'pcs'],
    },

    // C. APOTEK & FARMASI
    pharmacy: {
      categories: [
        'Obat Bebas (OTC)',
        'Obat Keras (Resep)',
        'Suplemen & Vitamin',
        'Alat Kesehatan',
        'Perawatan Luka',
        'Produk Ibu & Anak',
        'Lainnya',
      ],
      units: ['box', 'botol', 'strip', 'blister', 'tablet', 'kapsul', 'ampul', 'tube', 'pcs'],
    },

    // D. ELEKTRONIK & GADGET
    electronics: {
      categories: [
        'Smartphone & Tablet',
        'Laptop & PC',
        'Aksesoris & Kabel',
        'Audio & Speaker',
        'Smart Home',
        'Sparepart',
        'Lainnya',
      ],
      units: ['unit', 'box', 'set', 'pack', 'pcs'],
    },

    // E. TOKO BANGUNAN & MATERIAL
    building_material: {
      categories: [
        'Semen & Pasir',
        'Besi & Baja',
        'Batu & Bata',
        'Cat & Pelapis',
        'Pipa & Sanitari',
        'Kayu & Papan',
        'Alat Pertukangan',
        'Lainnya',
      ],
      units: ['truk', 'kubik', 'sak', 'batang', 'lembar', 'kaleng', 'dus', 'meter', 'pcs', 'kg'],
    },

    // F. FASHION & GARMEN
    fashion: {
      categories: [
        'Kaos & T-Shirt',
        'Kemeja & Blouse',
        'Celana & Jeans',
        'Jaket & Outerwear',
        'Hijab & Busana Muslim',
        'Sepatu & Sandal',
        'Aksesoris',
        'Lainnya',
      ],
      units: ['kodi', 'lusin', 'pack', 'set', 'pasang', 'pcs'],
    },

    // G. F&B & DAGING GROSIR
    fnb: {
      categories: [
        'Daging Sapi & Ayam',
        'Seafood & Ikan',
        'Sayur & Buah Segar',
        'Bahan Olahan Beku (Frozen)',
        'Susu & Dairy',
        'Minyak & Bumbu Masak',
        'Lainnya',
      ],
      units: ['karton', 'pack', 'bal', 'tray', 'kg', 'gram', 'liter', 'pcs'],
    },
  },
};

/**
 * Helper Utility: Mengambil kategori aktif berdasarkan activeIndustry
 */
export const getActiveCategories = () => {
  const industry = BUSINESS_CONFIG.activeIndustry;
  return BUSINESS_CONFIG.presets[industry]?.categories || BUSINESS_CONFIG.presets.general_trading.categories;
};

/**
 * Helper Utility: Mengambil satuan aktif berdasarkan activeIndustry
 */
export const getActiveUnits = () => {
  const industry = BUSINESS_CONFIG.activeIndustry;
  return BUSINESS_CONFIG.presets[industry]?.units || BUSINESS_CONFIG.presets.general_trading.units;
};
