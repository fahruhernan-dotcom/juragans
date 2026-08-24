# 👑 Virgin Master Dashboard — Core Financial, POS & Inventory OS
### *Enterprise Multi-Tenant Starter Boilerplate for Retail, Wholesale, Warehousing & Distribution*

<div align="center">

![Version](https://img.shields.io/badge/version-0.9.7-emerald?style=for-the-badge)
![Template](https://img.shields.io/badge/Virgin_Template-Master_Starter-purple?style=for-the-badge)
![React](https://img.shields.io/badge/React_19-20232A?style=for-the-badge&logo=react&logoColor=61DAFB)
![Vite](https://img.shields.io/badge/Vite_6-646CFF?style=for-the-badge&logo=vite&logoColor=FFD62E)
![TailwindCSS](https://img.shields.io/badge/TailwindCSS_3.4-38B2AC?style=for-the-badge&logo=tailwind-css&logoColor=white)
![Supabase](https://img.shields.io/badge/Supabase_PostgreSQL-3ECF8E?style=for-the-badge&logo=supabase&logoColor=white)
![Capacitor](https://img.shields.io/badge/Capacitor_Android_8-119EFF?style=for-the-badge&logo=capacitor&logoColor=white)
![Dexie](https://img.shields.io/badge/Dexie_IndexedDB-Offline_First-orange?style=for-the-badge)

**Fondasi Master Boilerplate ERP, Point of Sale (POS), Manajemen Inventaris Batch FIFO Atomik, CRM Buku Besar Piutang/Hutang, dan Financial Intelligence Terpadu yang Siap Diadaptasi ke Berbagai Sektor Bisnis dalam 15 Menit.**

[Ringkasan Boilerplate](#-ringkasan-virgin-master-boilerplate) • [Pusat Kendali Bisnis](#-pusat-kendali-bisnis-srcconfigbusinessconfigjs) • [Dokumentasi Lengkap (Folder `docs/`)](#-dokumentasi-lengkap-modular-docs) • [Matriks Adaptasi Industri](#-matriks-adaptasi-lintas-industri) • [Arsitektur Sistem](#-arsitektur-sistem--teknologi) • [Peta Direktori Proyek](#-peta-direktori-proyek) • [User Flows](#-alur-kerja-pengguna-user-flows) • [Database & Backend](#-database-schema-rpc--cron) • [Offline-First & Mobile](#-offline-first--mobile-android) • [Panduan Instalasi](#-panduan-instalasi--pengembangan) • [RBAC & Keamanan](#-keamanan--matriks-hak-akses-rbac)

</div>

---

## 📖 Ringkasan Virgin Master Boilerplate

**Virgin Master Dashboard** adalah *white-label starter template* kelas enterprise yang dirancang untuk menjadi **cetak biru awal (*starter base*) bagi segala kebutuhan dashboard pengelolaan barang, keuangan, dan kasir**. 

Dengan menggunakan template ini, developer tidak perlu membangun ulang arsitektur autentikasi, sinkronisasi offline, engine stok atomik, atau setup mobile dari nol untuk setiap klien baru. Cukup lakukan konfigurasi branding dan parameter bisnis, sistem langsung siap dideploy ke produksi.

### 🌟 6 Keunggulan Utama Core Engine:
1. **Engine Stok FIFO Atomik (Anti Race-Condition)**: Pengurangan stok mengeksekusi penguncian baris (`FOR UPDATE`) di level database PostgreSQL untuk memotong batch tertua secara atomik dan akurat.
2. **Arsitektur Offline-First (Dexie.js IndexedDB)**: Kasir tetap dapat bertransaksi lancar tanpa internet, dan `SyncEngine` otomatis melakukan sinkronisasi saat online.
3. **Multi-Satuan Dinamis & Multi-Tier Pricing**: Mendukung kemasan bertingkat (*Karton ➔ Dus ➔ Bal ➔ Pak ➔ Pcs/Kg*) dan 4 tingkat harga (*Eceran, Grosir 1, Grosir 2, Khusus*).
4. **CRM Buku Besar & Penagihan WhatsApp**: Pelacakan limit kredit (*Credit Limit*), umur piutang (*AR Aging*), dan tombol tagih instan via WhatsApp.
5. **Mobile Native Ready (Capacitor 8)**: Kompilasi langsung ke Android APK/AAB (SDK 35/36) dengan fitur in-app auto-update via Supabase Storage.
6. **AI Business Intelligence**: Asisten cerdas berbasis **MAIA Router (xAI Grok & GLM)** untuk analisis data dan eksekusi transaksi otomatis.

---

## 🎛️ Pusat Kendali Bisnis: `src/config/businessConfig.js`

Seluruh perilaku sistem, terminologi, satuan, dan fitur dikontrol dari satu titik sentral di [`src/config/businessConfig.js`](file:///d:/Dokumen/02_Kerja_Profesional/Dashboard%20Virgin/src/config/businessConfig.js):

```javascript
export const BUSINESS_CONFIG = {
  activeIndustry: 'general_trading', // 'sembako' | 'pharmacy' | 'electronics' | 'building_material' | 'fashion' | 'fnb'
  
  featureFlags: {
    enableExpiryDateTracking: true,   // Pelacak expired date (Aktif untuk Apotek/Makanan, Nonaktif untuk Baju/Elektronik)
    enableMultiUnitConversion: true,  // Konversi satuan bertingkat
    enableCourierLogistics: true,     // Surat jalan kurir & upload foto POD
    enableEmployeePayroll: true,      // Penggajian staf & komisi driver
    enableCustomerCreditLimit: true,  // Plafon limit kredit piutang toko mitra
    enableAIAssistant: true,          // Asisten MAIA AI reasoning
  }
};
```

---

## 📚 Dokumentasi Lengkap (Modular Docs)

Dokumentasi teknis mendalam telah dipisahkan ke dalam 5 berkas modular di direktori [`docs/`](file:///d:/Dokumen/02_Kerja_Profesional/Dashboard%20Virgin/docs):

| Dokumen | Deskripsi & Cakupan |
| :--- | :--- |
| **[01. Arsitektur & Komponen per Halaman](file:///d:/Dokumen/02_Kerja_Profesional/Dashboard%20Virgin/docs/01_ARCHITECTURE_AND_COMPONENTS.md)** | Struktur direktori lengkap, analisis *page-by-page*, subfolder, inventarisasi komponen Radix/Tailwind, custom hooks, dan utilitas inti. |
| **[02. Panduan Alur Pengguna & User Flows](file:///d:/Dokumen/02_Kerja_Profesional/Dashboard%20Virgin/docs/02_USER_FLOWS_AND_OPERATIONS.md)** | 12 alur kerja operasional lengkap dengan diagram Mermaid: Onboarding, POS kasir, FIFO batch, piutang, logistik POD, retur, opname, hingga tutup toko. |
| **[03. Skema Database, Backend RPC & Cron](file:///d:/Dokumen/02_Kerja_Profesional/Dashboard%20Virgin/docs/03_DATABASE_SCHEMA_AND_BACKEND.md)** | Kamus data 18+ tabel PostgreSQL Supabase, fungsi RPC atomik `create_sembako_sale_transaction`, keamanan RLS multi-tenant, trigger notifikasi, dan automasi `pg_cron`. |
| **[04. Offline-First, Mobile Android & DevOps](file:///d:/Dokumen/02_Kerja_Profesional/Dashboard%20Virgin/docs/04_OFFLINE_MOBILE_AND_DEVOPS.md)** | Engine IndexedDB Dexie.js, SyncEngine worker, build Android Capacitor 8, CI/CD GitHub Actions, in-app auto-update, dan kontrak kerja sama legal. |
| **[05. Panduan Kloning Cepat (15 Menit)](file:///d:/Dokumen/02_Kerja_Profesional/Dashboard%20Virgin/docs/05_HOW_TO_CLONE_AND_CUSTOMIZE.md)** | Panduan praktis langkah-demi-langkah bagi developer untuk mengkloning dan mengkustomisasi template ini untuk klien/bisnis baru dengan 6 preset industri. |

---

## 🏢 Matriks Adaptasi Lintas Industri

Template ini telah diuji untuk dapat langsung diadaptasi ke berbagai jenis model bisnis:

| Industri / Vertikal | Satuan Default | Fitur Kunci yang Digunakan | Penyesuaian Khusus |
| :--- | :--- | :--- | :--- |
| **📦 Sembako / FMCG** | `sak`, `dus`, `bal`, `renceng`, `pcs`, `kg` | FIFO Batches, Multi-Satuan, Multi-Tier Harga, Kredit Limit Warung | Aktifkan pelacak Expired Date. |
| **💊 Apotek / Toko Obat** | `box`, `strip`, `botol`, `tablet`, `ampul` | No. Batch BPOM, Expired Alert Ketat, Supplier CRM | Aktifkan alert expired 90 hari. |
| **📱 Toko Elektronik & HP** | `unit`, `box`, `pcs` | Serial Number / IMEI, Garansi Toko, Kasir POS | Nonaktifkan expired date, catat serial di notes. |
| **🧱 Bahan Bangunan / Grosir** | `truk`, `sak`, `kubik`, `lembar`, `batang` | Surat Jalan DO Kurir, Armada Pick-up/Truk, Piutang Kontraktor | Maksimalkan modul Logistik & POD. |
| **👕 Fashion & Distro** | `lusin`, `kodi`, `pcs` | Varian Ukuran/Warna (di nama produk/SKU), Tier Reseller | Nonaktifkan expired date. |
| **🥩 F&B & Daging Grosir** | `kg`, `gram`, `pack`, `karton` | Timbangan Kiloan, Cold Storage Batch, Biaya Pengiriman | FIFO batching untuk perputaran cepat. |

---

## 🏗️ Arsitektur Sistem & Teknologi

```
┌─────────────────────────────────────────────────────────────────────────┐
│                           CLIENT LAYER (SPA & PWA)                      │
│   React 19 • Vite 6 • TailwindCSS 3.4 • Radix UI • Framer Motion        │
│   Capacitor 8 (Native Android Wrapper) • Recharts • Sonner Toast        │
└────────────────────────────────────┬────────────────────────────────────┘
                                     │
                 ┌───────────────────┴───────────────────┐
                 │                                       │
                 ▼                                       ▼
┌─────────────────────────────────┐   ┌───────────────────────────────────┐
│     OFFLINE LAYER (Dexie.js)     │   │     ONLINE API & CLOUD BACKEND    │
│  • IndexedDB Local Cache        │   │  • Supabase Client (PostgreSQL)   │
│  • Sync Queue (Push/Pull Engine)│   │  • Row-Level Security (RLS)       │
│  • Optimistic UI Updates        │   │  • Atomic SQL Functions (RPC)     │
└─────────────────────────────────┘   └─────────────────┬─────────────────┘
                                                        │
                                      ┌─────────────────┴─────────────────┐
                                      │       AI & EXTERNAL SERVICES      │
                                      │  • MAIA Router (Grok xAI / GLM)   │
                                      │  • WhatsApp API Connector         │
                                      └───────────────────────────────────┘
```

### Rincian Dependensi Utama:

| Kategori | Paket / Library | Versi | Kegunaan |
| :--- | :--- | :--- | :--- |
| **Core UI** | `react`, `react-dom` | `^19.2.4` | Core Library React terbaru |
| **Build Tool** | `vite` | `^6.4.2` | Bundler super cepat dengan Hot Module Replacement (HMR) |
| **Routing** | `react-router-dom` | `^7.13.1` | Manajemen navigasi dan rute SPA |
| **Styling** | `tailwindcss`, `postcss` | `^3.4.19` | Utility-first CSS framework |
| **Primitif UI** | `@radix-ui/*` (15+ packages) | Latest | Komponen headless accessible (Dialog, Sheet, Popover, dll.) |
| **Animasi** | `framer-motion`, `tailwindcss-animate` | `^12.36.0` | Micro-interactions dan transisi halaman halus |
| **State & Data**| `@tanstack/react-query` | `^5.90.21` | Fetching, caching, background refetching server state |
| **Backend/DB**  | `@supabase/supabase-js` | `^2.105.1` | Supabase Postgres database client & authentication |
| **Offline DB**  | `dexie`, `dexie-react-hooks` | `^4.4.4` | IndexedDB client wrapper untuk mode offline-first |
| **Mobile Runtime** | `@capacitor/core`, `@capacitor/android` | `^8.5.0` | Native Android wrapper & bridge API |
| **Form & Validasi**| `react-hook-form`, `zod`, `@hookform/resolvers` | `^7.71.2` | Validasi skema formulir berperforma tinggi |
| **Visualisasi** | `recharts`, `@number-flow/react` | `^2.15.4` | Visualisasi grafik keuangan dan animasi angka |
| **Dokumen**     | `@react-pdf/renderer`, `qrcode` | `^4.5.1` | Pembuatan faktur/laporan PDF & QR Code nota |

---

## 📁 Peta Direktori Proyek

```text
Dashboard Virgin/
├── .agents/                                # Konfigurasi skill dan aturan agent
├── .github/workflows/                      # CI/CD GitHub Actions (build-apk.yml)
├── android/                                # Native project Android Studio (Capacitor)
├── docs/                                   # Dokumentasi Teknis Terperinci
│   ├── 01_ARCHITECTURE_AND_COMPONENTS.md   # Arsitektur & Komponen per Halaman
│   ├── 02_USER_FLOWS_AND_OPERATIONS.md     # 12 Alur Pengguna End-to-End
│   ├── 03_DATABASE_SCHEMA_AND_BACKEND.md   # Skema Database, RPC, & pg_cron
│   ├── 04_OFFLINE_MOBILE_AND_DEVOPS.md     # Offline-First, Capacitor, & DevOps
│   ├── 05_HOW_TO_CLONE_AND_CUSTOMIZE.md    # Panduan Kloning 15 Menit untuk Klien Baru
│   └── templates/                          # Template Dokumen (KONTRAK_LAYANAN_TEMPLATE.md)
├── scripts/                                # Skrip build, bump version, & generator PDF
│   └── generate_contract_pdf.jsx           # Generator PDF Naskah Kontrak Layanan Dinamis
├── supabase/                               # Database Supabase Terpusat & Terstandarisasi
│   ├── README.md                           # Panduan setup database baru
│   ├── schema/
│   │   ├── 01_master_full_schema.sql       # Master Full Schema (19+ tabel, FIFO RPC, RLS)
│   │   └── 02_crons_and_automations.sql    # Automasi pg_cron
│   ├── seeds/                              # Template akun klien & seed demo
│   └── migrations/                         # Arsip riwayat patch & migrasi
├── public/                                 # Static assets (logo, icon, favicon, manifest)
├── src/
│   ├── assets/                             # Gambar, ilustrasi, font
│   ├── components/                         # Komponen global (ui/ & license/)
│   ├── config/
│   │   └── businessConfig.js               # 👑 Pusat Kendali Konfigurasi Bisnis Terpusat
│   ├── constants/                          # Konstanta tema & lookup
│   ├── dashboard/
│   │   ├── _shared/                        # AppSidebar, BottomNav, QRScannerModal, layouts/
│   │   ├── broker/sembako_broker/          # 📦 Halaman & komponen inti modul operasional
│   │   └── superadmin/                     # 🛡️ Panel superadmin & dev hub
│   ├── data/                               # Mock data & blog posts
│   ├── hooks/                              # React UI hooks
│   ├── lib/                                # Core logic, auth, format, hpp, i18n, offline, supabase
│   │   └── hooks/sembako/                  # Data fetching hooks TanStack Query
│   ├── pages/                              # Landing page & halaman publik
│   ├── App.jsx                             # Route registry & global provider
│   ├── main.jsx                            # React 19 entry point
│   └── index.css                           # Tailwind CSS & design tokens
├── capacitor.config.json                   # Konfigurasi Capacitor Android App
├── firebase-service-account.example.json   # Template kredensial Firebase Service Account
├── package.json                            # Manifest dependensi & scripts
└── vite.config.js                          # Konfigurasi bundler Vite
```

---

## 🔄 Alur Kerja Pengguna (User Flows)

Sistem mengakomodasi 12 alur kerja operasional terintegrasi:

1. **Onboarding & Setup Toko**: Pendaftaran akun, pembentukan `tenant_id`, dan pengisian data awal via checklist wizard.
2. **Master Produk & Multi-Tier Pricing**: Input barang, konversi satuan dinamis (Karton/Dus/Pcs), dan 4 level harga jual.
3. **Stock-In Batch FIFO**: Penerimaan barang dari supplier, pencatatan expired date, dan kalkulasi HPP terbobot.
4. **Kasir POS & Multi-Payment**: Transaksi kilat dengan scan barcode, bayar Cash/Transfer/Tempo/Giro, dan potong stok FIFO atomik via RPC.
5. **Penagihan Piutang Mitra**: Pemantauan batas plafon kredit (*Credit Limit*) dan pengiriman pesan tagihan WhatsApp otomatis.
6. **Logistik & Bukti Pengiriman (POD)**: Penugasan driver, cetak surat jalan, dan unggah foto serah terima barang.
7. **Retur Barang & Rekonsiliasi**: Penanganan barang rusak dengan opsi tukar barang, potong piutang, atau refund kas.
8. **Stock Opname & Koreksi Fisik**: Audit fisik barang di rak gudang dan pencatatan selisih barang hilang/rusak.
9. **Penggajian Staf (Payroll)**: Perhitungan gaji pokok, uang makan, komisi rit driver, kasbon, dan cetak slip gaji.
10. **Laporan Laba/Rugi & Tutup Toko**: Analisis P&L, umur piutang, dan penerimaan rekap malam via cron jam 20:00 WIB.
11. **Mode Offline Kasir**: Transaksi tanpa internet tersimpan di IndexedDB dan auto-sync saat koneksi pulih.
12. **Asisten AI**: Konsultasi performa bisnis dan auto-input transaksi via MAIA Router.

*(Selengkapnya di [docs/02_USER_FLOWS_AND_OPERATIONS.md](file:///d:/Dokumen/02_Kerja_Profesional/Dashboard%20Virgin/docs/02_USER_FLOWS_AND_OPERATIONS.md))*

---

## 🗄️ Database Schema, RPC & Cron

Aplikasi menggunakan Supabase PostgreSQL dengan 18+ tabel inti yang terisolasi Row-Level Security (RLS).

### Tabel Utama:
- `tenants`, `profiles`, `tenant_memberships`, `team_invitations`
- `sembako_products`, `sembako_stock_batches`, `sembako_stock_out`
- `sembako_sales`, `sembako_sale_items`, `sembako_payments`
- `sembako_customers`, `sembako_suppliers`, `sembako_supplier_payments`
- `sembako_returns`, `sembako_deliveries`, `sembako_employees`, `sembako_payroll`, `sembako_expenses`, `sembako_audit_logs`
- `device_tokens`, `notification_preferences`, `notifications`, `app_releases`

### Background Cron Jobs (`pg_cron`):
- **07:30 WIB**: Peringatan Pagi Stok Menipis & Kadaluarsa Barang.
- **12:00 WIB**: Pengingat Piutang Toko Mitra Jatuh Tempo.
- **20:00 WIB**: Rekap Penutupan Toko Malam Hari (Omzet, Kas, Piutang, Laba Kotor).
- **09:00 WIB (Tgl 21-28)**: Peringatan Tagihan Server Bulanan Developer (H-7).

*(Selengkapnya di [docs/03_DATABASE_SCHEMA_AND_BACKEND.md](file:///d:/Dokumen/02_Kerja_Profesional/Dashboard%20Virgin/docs/03_DATABASE_SCHEMA_AND_BACKEND.md))*

---

## 📱 Offline-First & Mobile Android

- **Dexie.js (IndexedDB)**: Caching katalog lokal dan penampungan antrian mutasi `sync_queue`.
- **SyncEngine**: Worker background yang memproses transaksi tertunda ke Supabase saat online.
- **Capacitor 8**: Kompilasi native Android dengan Target SDK 35, Compile SDK 36, dan `android:largeHeap="true"` untuk stabilitas di HP RAM terbatas.
- **CI/CD GitHub Actions (`build-apk.yml`)**: Otomatisasi build APK setiap push ke `main`, penamaan zip artifact dinamis (`VirginERP-APK-v0.9.7-b...zip`), dan distribusi in-app auto-update via Supabase Storage.

*(Selengkapnya di [docs/04_OFFLINE_MOBILE_AND_DEVOPS.md](file:///d:/Dokumen/02_Kerja_Profesional/Dashboard%20Virgin/docs/04_OFFLINE_MOBILE_AND_DEVOPS.md))*

---

## 🚀 Panduan Instalasi & Pengembangan

### Prasyarat:
- **Node.js**: Versi `18.20.x`, `20.x`, atau `22.x` LTS.
- **NPM**: Versi `9.x` atau lebih tinggi.
- **Supabase Project**: Database PostgreSQL aktif dengan skema termigrasi.

### Langkah Instalasi:

```bash
# 1. Pemasangan Dependensi
npm install

# 2. Konfigurasi Environment Variables
cp .env.example .env
# (Isi VITE_SUPABASE_URL & VITE_SUPABASE_ANON_KEY dengan kredensial Supabase Anda)

# 3. Setup Database Supabase
# Buka Supabase SQL Editor, lalu salin dan jalankan:
# supabase/schema/01_master_full_schema.sql

# 4. Jalankan Server Pengembangan Lokal
npm run dev
```
Akses aplikasi di browser pada alamat `http://localhost:3000` (atau port Vite yang ditentukan).

---

## 🔐 Keamanan & Matriks Hak Akses (RBAC)

| Fitur / Modul | Dev / Superadmin | Owner (Pemilik) | Admin Kasir | Staf Gudang | Supir / Kurir |
| :--- | :---: | :---: | :---: | :---: | :---: |
| **Kelola Tenant & Lisensi SaaS** | ✅ Full | ❌ | ❌ | ❌ | ❌ |
| **Dashboard Finansial & Laba/Rugi** | ✅ Full | ✅ Full | ❌ | ❌ | ❌ |
| **Penggajian Staf (Payroll)** | ✅ Full | ✅ Full | ❌ | ❌ | ❌ |
| **Transaksi Kasir & Cetak Faktur** | ✅ Full | ✅ Full | ✅ Full | ❌ | ❌ |
| **Katalog Produk & Pengaturan Harga** | ✅ Full | ✅ Full | ✅ Full | 👁️ Lihat Saja | ❌ |
| **Penerimaan Stok Batch FIFO (In)** | ✅ Full | ✅ Full | ✅ Full | ✅ Full | ❌ |
| **Stock Opname & Koreksi Fisik** | ✅ Full | ✅ Full | ✅ Full | ✅ Full | ❌ |
| **CRM Pelanggan & Limit Piutang** | ✅ Full | ✅ Full | ✅ Full | ❌ | ❌ |
| **Buku Besar Supplier & Hutang** | ✅ Full | ✅ Full | ✅ Full | ❌ | ❌ |
| **Retur Penjualan & Pembelian** | ✅ Full | ✅ Full | ✅ Full | ✅ Full | ❌ |
| **Status Pengiriman & Upload POD** | ✅ Full | ✅ Full | ✅ Full | ❌ | ✅ Update Status |
| **Akses Asisten Bisnis AI (MAIA)** | ✅ Full | ✅ Full | ✅ Full | ✅ Full | ❌ |

---

## 📋 Ringkasan Perintah (NPM Scripts)

| Perintah | Deskripsi |
| :--- | :--- |
| `npm run dev` | Menjalankan local development server Vite dengan HMR |
| `npm run build` | Melakukan kompilasi produksi bundle aplikasi ke folder `/dist` |
| `npm run lint` | Menjalankan ESLint untuk verifikasi kualitas kode |
| `npm run preview` | Menjalankan preview lokal dari hasil build `/dist` |
| `npm run bump` | Naikkan versi patch & sinkronkan metadata ke 4 berkas otomatis |
| `npm run bump minor` | Naikkan versi minor (misal v0.9.7 ➔ v0.10.0) |
| `npm run bump major` | Naikkan versi major (misal v0.10.0 ➔ v1.0.0) |
| `npm run contract:pdf` | Membuat dokumen PDF Surat Perjanjian Kerja Sama resmi |
| `npx cap sync android` | Menyalin asset web terbaru ke platform Android |
| `npx cap open android` | Membuka project Android di Android Studio |

---

## 👨‍💻 Hak Cipta & Ketentuan Layanan

- **Framework**: Virgin Master Dashboard OS
- **Lisensi**: Proprietary & Commercial Software License. Seluruh hak cipta kode sumber dilindungi undang-undang.
