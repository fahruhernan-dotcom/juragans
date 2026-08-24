# 🔍 Audit Teknis Fase 2: Layout Bersama, Navigasi & Modul Admin
## Subfolder: `src/dashboard/_shared/` & `src/dashboard/superadmin/`

> Berkas ini menyajikan hasil audit mendalam terhadap layout bersama, navigasi sidebar, panel superadmin, halaman akun, dan komponen bersama di `src/dashboard/_shared/` dan `src/dashboard/superadmin/`.

---

## 📑 Daftar Berkas yang Diaudit

```text
src/dashboard/_shared/
├── components/
│   ├── AppSidebar.jsx                             # Sidebar navigasi desktop
│   ├── BottomNav.jsx                              # Navigasi bawah mobile
│   ├── BusinessNameWarningBanner.jsx              # Banner peringatan nama bisnis
│   ├── NotificationBell.jsx                       # Notifikasi & lonceng popover
│   ├── QRScannerModal.jsx                         # Scanner barcode/QR
│   ├── forms/                                     # Input form reusable
│   ├── onboarding/                                # Dialog onboarding
│   ├── transactions/                              # Komponen transaksi
│   └── wizard/                                    # Setup wizard
├── layouts/
│   ├── DashboardLayout.jsx                        # Layout wrapper utama
│   └── SembakoDashboardLayout.jsx                 # Layout wrapper operasional
├── pages/
│   ├── akun_page/
│   │   ├── AkunPage.jsx                           # Profil & konfigurasi akun
│   │   └── components/
│   │       ├── EditProfileModal.jsx
│   │       ├── NotificationPreferencesCard.jsx
│   │       └── TenantLicenseCard.jsx
│   └── tim/
│       └── Tim.jsx                                # Manajemen staf & undang anggota
└── superadmin/
    └── SuperadminDashboardPage.jsx                # Developer hub & reset database
```

---

## 🔎 Temuan Logika Niche & Solusi Refactoring

### 1. `src/dashboard/_shared/components/AppSidebar.jsx`
- **Temuan**:
  - Line 522 memuat label hardcoded: `Distributor Rokok` pada header profil bisnis.
- **Solusi Refactoring**:
  - Ganti menjadi dinamis: `{tenant?.business_name || 'Virgin Master ERP'}` atau membaca `BUSINESS_CONFIG.appInfo.appName`.

---

### 2. `src/dashboard/_shared/components/BusinessNameWarningBanner.jsx`
- **Temuan**:
  - Terdapat sisa percabangan routing untuk `model?.category === 'peternak'` (`/peternak/...`) dan `model?.category === 'rumah_potong'` (`/rumah_potong/...`).
- **Solusi Refactoring**:
  - Sederhanakan fungsi `getAkunPath()` langsung mengarah ke `/broker/sembako_broker/akun` atau `/akun` secara universal.

---

### 3. `src/dashboard/_shared/pages/tim/Tim.jsx`
- **Temuan**:
  - Form peran (*role*) dan deskripsi hak akses perlu dipastikan 100% selaras dengan model operasional multi-peran retail & grosir:
    - **Owner**: Akses penuh finansial, laba rugi, dan manajemen sistem.
    - **Admin Kasir**: Penjualan, kasir POS, katalog produk, CRM pelanggan.
    - **Staf Gudang**: Penerimaan stok batch (FIFO), stok opname, dan retur barang.
    - **Supir / Kurir**: Status pengiriman dan upload bukti pengiriman (POD).

---

### 4. `src/dashboard/superadmin/SuperadminDashboardPage.jsx`
- **Temuan**:
  - Sudah dinetralkan ke kata kunci `"RESET DATABASE"`, namun perlu dipastikan seluruh tombol pembersihan cache dan log sistem beroperasi secara netral.

---

## 🎯 Rencana Tindakan Refactoring Fase 2
1. Refaktor `AppSidebar.jsx` untuk memastikan label bisnis sepenuhnya dinamis.
2. Sederhanakan `BusinessNameWarningBanner.jsx` agar bersih dari routing vertikal peternakan/rumah potong.
3. Sinkronkan seluruh layout dengan `businessConfig.js`.
