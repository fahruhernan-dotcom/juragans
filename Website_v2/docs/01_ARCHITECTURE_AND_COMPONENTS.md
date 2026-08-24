# 🏛️ Arsitektur Sistem & Direktori Komponen (Page-by-Page)
## Virgin Master Dashboard — Core Financial, POS & Inventory OS

> Dokumen ini menyajikan pemetaan komprehensif seluruh arsitektur kode sumber, modul per halaman (*page-by-page breakdown*), hierarki subfolder, pustaka UI primitif, custom hooks, dan state management pada platform Virgin Master Dashboard.

---

## 📑 Daftar Isi
1. [Struktur Folder & Peta Arsitektur Proyek](#1-struktur-folder--peta-arsitektur-proyek)
2. [Modul Halaman Publik & Autentikasi (`src/pages/`)](#2-modul-halaman-publik--autentikasi-srcpages)
3. [Modul Inti Dashboard Sembako (`src/dashboard/broker/sembako_broker/`)](#3-modul-inti-dashboard-sembako-srcdashboardbrokersembako_broker)
4. [Modul Bersama & Layout (`src/dashboard/_shared/`)](#4-modul-bersama--layout-srcdashboard_shared)
5. [Modul Superadmin & Dev Hub (`src/dashboard/superadmin/`)](#5-modul-superadmin--dev-hub-srcdashboardsuperadmin)
6. [Komponen Primitif & Global UI (`src/components/`)](#6-komponen-primitif--global-ui-srccomponents)
7. [Custom Hooks & State Management (`src/lib/hooks/`)](#7-custom-hooks--state-management-srclibhooks)
8. [Core Engine, AI & Utility Services (`src/lib/`)](#8-core-engine-ai--utility-services-srclib)

---

## 1. Struktur Folder & Peta Arsitektur Proyek

Aplikasi dirancang menggunakan pola **Modular Single Page Application (SPA)** berbasis React 19 dan Vite 6, dengan pemisahan tugas (*separation of concerns*) yang terstruktur:

```text
Dashboard Virgin/
├── .agents/                                # Konfigurasi agent & aturan linter AI
├── .github/workflows/                      # Automasi CI/CD GitHub Actions (build-apk.yml)
├── android/                                # Native Project Android Studio (Capacitor 8)
├── docs/                                   # Dokumentasi Teknis & Panduan Operasional
│   ├── 01_ARCHITECTURE_AND_COMPONENTS.md   # [File Ini] Arsitektur & Komponen per Halaman
│   ├── 02_USER_FLOWS_AND_OPERATIONS.md     # 12 Alur Kerja Pengguna End-to-End
│   ├── 03_DATABASE_SCHEMA_AND_BACKEND.md   # Skema Database, RLS, RPC, & pg_cron
│   └── 04_OFFLINE_MOBILE_AND_DEVOPS.md     # Offline-First, Capacitor, & DevOps
├── public/                                 # Static Assets (Favicon, Logo, PWA Manifest)
├── src/
│   ├── assets/                             # Ilustrasi, ikon kustom, gambar statis
│   ├── components/                         # Komponen UI global (Radix, Dialog, Sheet, Sidebar)
│   │   ├── license/                        # Banner lisensi & status subscription
│   │   └── ui/                             # Primitif UI (Button, Input, Table, Dropdown, dll.)
│   ├── constants/                          # Konstanta tema, warna, dan mapping lookup
│   ├── dashboard/                          # Halaman & Tampilan Dashboard Bisnis
│   │   ├── _shared/                        # Layout, Sidebar, BottomNav, Scanner Modal
│   │   ├── broker/sembako_broker/          # 📦 MODUL UTAMA DISTRIBUTOR SEMBAKO
│   │   └── superadmin/                     # 🛡️ PANEL SAAS SUPERADMIN
│   ├── data/                               # Mock data, blog posts, dan lookup statis
│   ├── hooks/                              # React hooks pembantu (viewport, media queries)
│   ├── lib/                                # Core Business Logic, Database Client, & Services
│   │   ├── aiPrompt.js                     # Prompt engineering & context builder MAIA AI
│   │   ├── aiService.js                    # HTTP client provider Grok xAI / GLM ZhipuAI
│   │   ├── aiTransactionInserter.js        # Parser aksi transaksi otomatis berbasis AI
│   │   ├── auth/                           # Role definitions, permission guards, RBAC
│   │   ├── format.js                       # Formatter Rupiah, tanggal lokal, nomor WhatsApp
│   │   ├── hooks/                          # Custom data fetching hooks (TanStack Query v5)
│   │   │   └── sembako/                    # Domain-specific hooks (Sales, Products, Batches, dll.)
│   │   ├── hpp/                            # Engine kalkulasi Harga Pokok Penjualan FIFO
│   │   ├── i18n/                           # Provider multibahasa (ID & EN)
│   │   ├── invoice/                        # Generator nota thermal ESC-POS & PDF faktur
│   │   ├── offline/                        # Offline-First Engine (Dexie.js IndexedDB & Sync)
│   │   ├── queryClient.js                  # Konfigurasi query client TanStack
│   │   ├── subscriptionUtils.js            # Engine verifikasi masa aktif lisensi
│   │   └── supabase.js                     # Singleton Supabase Client connection
│   ├── pages/                              # Halaman Publik & Landing Pages
│   │   ├── fitur/                          # Halaman showcase fitur per sub-sektor
│   │   └── harga/                          # Halaman komparasi paket harga SaaS
│   ├── App.jsx                             # Master Route Registry & Global Providers
│   ├── main.jsx                            # React 19 Root Initializer
│   └── index.css                           # Global Tailwind Styles & Design Tokens
├── capacitor.config.json                   # Konfigurasi Native Capacitor Android
├── firebase-service-account.example.json   # Template kredensial Firebase Service Account
├── scripts/generate_contract_pdf.jsx       # Generator PDF Surat Perjanjian Kerja Sama
├── docs/templates/                         # Naskah Legal Kontrak Kerjasama SaaS
├── supabase/                               # Database Supabase Terpusat & Terstandarisasi
├── package.json                            # Dependensi proyek & NPM Scripts
└── vite.config.js                          # Konfigurasi Bundler Vite & Code Splitting
```

---

## 2. Modul Halaman Publik & Autentikasi (`src/pages/`)

Halaman-halaman publik dapat diakses tanpa perlu login, berfungsi sebagai portal pemasaran, harga pasar terbuka, dan gerbang autentikasi.

| Berkas Halaman | URL Rute | Komponen / Dependensi Utama | Fungsi & Fitur Utama |
| :--- | :--- | :--- | :--- |
| **`LandingPage.jsx`** | `/` | `Framer Motion`, `Lucide React`, `Navbar`, `Footer` | Halaman pendaratan utama. Menampilkan *value proposition*, preview dashboard interaktif, perbandingan keunggulan sistem dibanding software konvensional, testimoni pedagang, dan CTA registrasi. |
| **`Login.jsx`** | `/login` | `useAuth`, `sonner`, `Card`, `Input`, `Button` | Gerbang masuk sistem. Dilengkapi verifikasi kata sandi Supabase Auth, proteksi rate-limiting/anti-spam, fitur *Remember Me*, *role redirection*, dan *Emergency Error Trap* jika terjadi kendala runtime. |
| **`Register.jsx`** & **`MobileRegister.jsx`** | `/register` | `useAuth`, `Select`, `Input`, `Label` | Pendaftaran akun distributor baru. Mengumpulkan nama pemilik, nama usaha/toko, provinsi operasional, dan otomatis menginisialisasi `tenant_id` terisolasi di database. |
| **`ForgotPassword.jsx`** | `/forgot-password` | `supabase.auth.resetPasswordForEmail` | Formulir permintaan link reset password yang dikirimkan langsung ke email terdaftar. |
| **`ResetPassword.jsx`** | `/reset-password` | `supabase.auth.updateUser` | Formulir penggantian kata sandi baru pasca menekan link konfirmasi email dari Supabase. |
| **`HargaPasarPublic.jsx`** | `/harga-pasar` | `recharts`, `Badge`, `Card`, `Table` | Dashboard indeks harga rata-rata komoditas pangan dan sembako (Beras, Minyak Goreng, Telur, Gula Pasir, Cabai, Bawang Merah/Putih) yang diperbarui secara berkala. |
| **`MarketPublic.jsx`** | `/market` | `Card`, `SearchInput`, `FilterTabs` | Papan listing penawaran (*supply*) dan permintaan (*demand*) pasokan sembako skala besar antar distributor dan grosir di Indonesia. |
| **`LockedServerPage.jsx`** | `/locked-server` | `Card`, `Button`, `WhatsApp Direct Link` | Tampilan keamanan jika masa aktif langganan bulanan tenant telah habis (melewati tanggal jatuh tempo + masa tenggang 7 hari). Memberikan nomor rekening developer dan tombol WhatsApp konfirmasi perpanjangan. |
| **`AboutUs.jsx`** | `/tentang-kami` | Static Content Layout | Informasi visi, misi, dan latar belakang platform TernakOS / GPK. |
| **`FAQPage.jsx`** | `/faq` | `Accordion`, `SearchInput`, `faqData.js` | Halaman tanya jawab komprehensif mengenai operasional toko, lisensi, migrasi data, dan keamanan. |
| **`PrivacyPage.jsx`** | `/privacy` | Legal Typography Layout | Pernyataan perlindungan data pribadi dan komitmen kerahasiaan data pembukuan toko. |
| **`TermsPage.jsx`** | `/terms` | Legal Typography Layout | Syarat dan ketentuan penggunaan platform SaaS GPK. |
| **`SecurityPage.jsx`** | `/security` | Infografis Keamanan | Penjelasan enkripsi database, isolasi Row-Level Security, dan standar proteksi data. |
| **`HubungiKami.jsx`** | `/hubungi-kami` | Form Input, WhatsApp Link | Saluran komunikasi langsung ke tim customer support dan sales GPK. |
| **`src/pages/fitur/*`** | `/fitur` | `GroupCard.jsx`, `FAQItem.jsx`, `FadeUp.jsx` | Katalog penjelasan fitur modular untuk broker sembako, telur, ayam, dan peternakan. |
| **`src/pages/harga/*`** | `/harga` | `PricingCards.jsx`, `CompareTable.jsx` | Matriks komparasi harga paket Starter, Pro, dan Enterprise beserta batas kuota transaksi. |

---

## 3. Modul Inti Dashboard Sembako (`src/dashboard/broker/sembako_broker/`)

Modul ini adalah pusat operasional distributor sembako, mencakup penjualan, pergudangan, keuangan, pengiriman, dan asisten AI.

```
src/dashboard/broker/sembako_broker/
├── Beranda.jsx                     # Dashboard utama & ringkasan operasional
├── Penjualan.jsx                   # Point of Sale (POS) & manajemen faktur penjualan
├── Produk.jsx                      # Katalog produk, barcode, dan konversi multi-satuan
├── Gudang.jsx                      # Manajemen batch FIFO, stock in, dan stock opname
├── TokoSupplier.jsx                # Direktori CRM pelanggan warung & supplier
├── TokoSupplierDetail.jsx          # Buku besar transaksi & histori piutang/hutang
├── Retur.jsx                       # Retur penjualan & pembelian barang rusak/expired
├── Laporan.jsx                     # Laporan Laba/Rugi, valuasi stok, aging piutang, arus kas
├── Pegawai.jsx                     # Penggajian (payroll) staf & penugasan armada driver
├── KelolaAkunPage.jsx              # Pengaturan profil toko, cabang, dan printer kasir
├── DevAdminHubPage.jsx             # Diagnostic center developer & simulasi akun
├── SembakoInvoicePreview.jsx       # Modal pratinjau faktur resmi & cetak thermal ESC-POS
├── TimManajemenPage.jsx            # Undangan tim & pengaturan hak akses staf
└── components/                     # Sub-komponen spesifik modul sembako
    ├── DeliveryCompletionModal.jsx # Modal upload bukti serah terima barang (POD)
    ├── FinancialReportPdfModal.jsx # Generator dokumen PDF laporan keuangan resmi
    ├── SembakoAuditLogView.jsx     # Tampilan riwayat aktivitas & mutasi data
    ├── SembakoCreateInvoiceSheet.jsx # Bottom sheet kasir POS input pesanan cepat
    ├── SembakoInvoiceCard.jsx      # Kartu ringkasan faktur penjualan
    ├── SembakoOnboardingChecklist.jsx # Wizard panduan setup data pertama kali
    ├── SembakoPageHeader.jsx       # Header standar judul halaman & quick action
    ├── SembakoPaymentSheet.jsx     # Formulir penerimaan cicilan/pelunasan piutang
    ├── SembakoRecycleBin.jsx       # Tempat pemulihan data produk terhapus
    ├── SembakoSaleDetailSheet.jsx  # Rincian detail produk & status pengiriman faktur
    ├── SembakoSuccessCard.jsx      # Dialog sukses pasca transaksi dengan shortcut cetak
    ├── SembakoSummaryStrip.jsx     # Strip metrik ringkas atas halaman
    ├── SembakoTambahStokSheet.jsx  # Formulir penerimaan stok batch baru dari supplier
    ├── SembakoUiPrimitives.jsx     # Primitif UI pembantu (badge status, chip satuan)
    ├── sembakoSaleUtils.jsx        # Helper kalkulasi diskon, PPN, dan kembalian
    └── beranda/                    # Sub-komponen khusus halaman Beranda:
        ├── BerandaAgenda.jsx       # Jadwal pengiriman & tagihan jatuh tempo hari ini
        ├── BerandaCharts.jsx       # Grafik tren omzet harian & komparasi laba kotor
        ├── BerandaUtils.jsx        # Formatting agregasi metrik penjualan
        ├── CollectionReminders.jsx # Widget pengingat piutang prioritas nagih
        ├── DesktopBeranda.jsx      # Tata letak Beranda optimal untuk layar PC/Laptop
        ├── MobileBeranda.jsx       # Tata letak Beranda ergonomis untuk smartphone
        └── dashboardLayoutConfig.js# Konfigurasi widget kartu yang dapat disesuaikan
```

### Rincian Fungsional Halaman Inti Sembako:

### 1. `Beranda.jsx` (Operational Intelligence Hub)
- **Komponen Utama**: `SembakoSummaryStrip`, `BerandaCharts`, `CollectionReminders`, `BerandaAgenda`, `SembakoOnboardingChecklist`.
- **Fungsi & Logika**:
  - Menghitung KPI berjalan: Total Omzet Hari Ini, Laba Kotor (Gross Profit), Total Piutang Aktif, dan Hutang Jatuh Tempo.
  - Menampilkan *Safety Stock Warning* untuk produk yang stok fisiknya di bawah ambang batas minimum (`min_stock_alert`).
  - Menampilkan *Piutang Overdue Monitor* untuk memprioritaskan penagihan ke toko yang telat bayar.
  - Memisahkan render secara adaptif melalui `DesktopBeranda` dan `MobileBeranda` untuk performa maksimal di Android.

### 2. `Penjualan.jsx` (Point of Sale & Faktur Penjualan)
- **Komponen Utama**: `SembakoCreateInvoiceSheet`, `SembakoInvoiceCard`, `SembakoSaleDetailSheet`, `SembakoPaymentSheet`, `QRScannerModal`, `SembakoInvoicePreview`.
- **Fungsi & Logika**:
  - Pencarian kilat katalog via nama, SKU, atau kamera barcode scanner.
  - Fitur **Multi-Satuan Dinamis**: Mendukung penjualan satuan turunan (contoh: jual 5 bungkus dari stok 1 kardus isi 40 bungkus).
  - Pilihan **Tier Harga**: Harga Eceran, Grosir 1, Grosir 2, dan Langganan Khusus.
  - Pilihan **Metode Pembayaran**: Tunai (hitung kembalian otomatis), Transfer Bank, Piutang/Tempo (input jatuh tempo & DP), dan Titipan Giro.
  - Integrasi RPC `create_sembako_sale_transaction` untuk pengurangan stok FIFO atomik.
  - Cetak struk thermal 58mm/80mm Bluetooth dan tombol *Share to WhatsApp* dengan draf pesan siap kirim.

### 3. `Produk.jsx` (Katalog & Manajemen Stok)
- **Komponen Utama**: `SembakoTambahStokSheet`, `SembakoRecycleBin`, `SembakoUiPrimitives`.
- **Fungsi & Logika**:
  - CRUD master barang: SKU/Barcode, Kategori, Satuan Utama, Satuan Turunan, Harga Modal Beli Rata-rata (`avg_buy_price`), dan Harga Jual.
  - Penetapan batas peringatan stok tipis (*Reorder Point*).
  - Mode **Stock Opname**: Audit stok fisik vs stok sistem dengan riwayat catatan alasan penyesuaian (barang rusak, tumpah, hilang, salah hitung).
  - **Recycle Bin**: Pemulihan produk yang tidak sengaja terhapus tanpa merusak integritas relasi faktur historis (*soft delete*).

### 4. `Gudang.jsx` (Manajemen Batch FIFO & Kadaluarsa)
- **Fungsi & Logika**:
  - Pelacakan batch individual stok masuk (`sembako_stock_batches`): Nomor Batch, Tanggal Beli, Tanggal Kadaluarsa (*Expiry Date*), Qty Masuk, dan Qty Sisa.
  - Peringatan dini kadaluarsa barang (*30/60/90 days expiry alert*).
  - Log audit pergerakan keluar-masuk stok (`sembako_stock_out`).

### 5. `TokoSupplier.jsx` & `TokoSupplierDetail.jsx` (CRM Toko & Supplier)
- **Fungsi & Logika**:
  - **Toko Mitra (Warung / Pengecer)**: Manajemen plafon kredit (*Credit Limit*), riwayat seluruh faktur, pembayaran cicilan, dan total sisa piutang berjalan. Tombol penagihan WhatsApp instan.
  - **Pemasok (Supplier)**: Manajemen Purchase Order, catatan hutang dagang, dan katalog harga beli per distributor.

### 6. `Retur.jsx` (Retur Penjualan & Pembelian)
- **Fungsi & Logika**:
  - Input pengembalian barang dari pelanggan atau pengembalian ke supplier.
  - Opsi penyelesaian: *Tukar Barang Baru (FIFO Restock)*, *Potong Saldo Piutang/Hutang*, atau *Pengembalian Uang Tunai (Cash Refund)*.
  - Status audit berkala: `draft` ➔ `diajukan` ➔ `diterima_gudang` ➔ `disetujui` ➔ `selesai`.

### 7. `Laporan.jsx` (Keuangan, Akuntansi & Analytics)
- **Komponen Utama**: `FinancialReportPdfModal`, `Recharts`.
- **Fungsi & Logika**:
  - **Laporan Laba Rugi Komprehensif (P&L)**: Omzet Penjualan Bersih dikurangi HPP Batch Aktual, Biaya Pengiriman, dan Beban Operasional Usaha (`sembako_expenses`).
  - **Laporan Umur Piutang (AR Aging Schedule)**: Klasifikasi tagihan Current (belum jatuh tempo), 1-15 hari, 16-30 hari, 31-60 hari, dan >60 hari (resiko macet).
  - **Valuasi Nilai Stok Gudang**: Total aset uang persediaan berdasarkan harga beli batch.
  - Ekspor dokumen ke format PDF resmi dan spreadsheet CSV.

### 8. `Pegawai.jsx` (SDM, Kurir & Payroll)
- **Fungsi & Logika**:
  - Direktori staf toko: Kasir, Admin, Petugas Gudang, dan Supir/Driver.
  - Kalkulasi gaji otomatis: Gaji Pokok + Uang Makan + Komisi Rit Pengiriman Kurir + Bonus - Potongan Kasbon = Total Gaji Bersih.
  - Cetak slip gaji karyawan.

---

## 4. Modul Bersama & Layout (`src/dashboard/_shared/`)

Modul ini menyediakan kerangka layout responsif, navigasi mobile, dialog pemindai, dan pengaturan akun.

```text
src/dashboard/_shared/
├── components/
│   ├── AppSidebar.jsx              # Navigasi sidebar desktop dengan badge status
│   ├── BottomNav.jsx               # Navigasi bawah jempol ergonomis untuk Android
│   ├── BrokerMobileHeader.jsx      # Top bar mobile dengan ikon lonceng notifikasi & profil
│   ├── MobilePrimitives.jsx        # Primitif sentuh (touch feedback, pull-to-refresh container)
│   └── QRScannerModal.jsx          # Pemindai barcode/QR berbasis kamera Web & Capacitor
├── layouts/
│   ├── DesktopSidebarLayout.jsx    # Shell layout desktop (Sidebar + Header + Content)
│   └── SuperadminLayout.jsx        # Shell layout khusus modul Superadmin
└── pages/
    ├── akun_page/
    │   ├── AkunPage.jsx            # Profil tenant, ganti sandi, preferensi bahasa
    │   └── constants.js            # APP_VERSION, APP_BUILD_NUMBER, & metadata rilis
    ├── billing/
    │   ├── BillingPortal.jsx       # Riwayat invoice langganan server & status lisensi
    │   └── UpgradePlan.jsx         # Pilihan upgrade paket fitur SaaS
    └── tim/
        ├── ManajemenPage.jsx       # Manajemen hak akses dan daftar anggota tim
        └── Tim.jsx                 # Formulir undang staf via email/token link
```

---

## 5. Modul Superadmin & Dev Hub (`src/dashboard/superadmin/`)

Panel kontrol tingkat tinggi yang hanya dapat diakses oleh akun developer atau pemilik platform:

- **`SuperadminDashboardPage.jsx`**:
  - Pemantauan seluruh tenant terdaftar di database Supabase.
  - Aktivasi, perpanjangan, dan penangguhan (*suspend*) lisensi tenant.
  - Metrik agregat: Total transaksi lintas platform, penggunaan kuota AI, dan status database.
- **`DevAdminHubPage.jsx`**:
  - *Emergency Control Center*: Reset data demo ke kondisi awal (`seed_demo_accounts.sql`).
  - Simulator Role Switcher: Berpindah peran seketika antara Owner, Admin, Kasir, Gudang, dan Driver untuk pengujian UI.
  - Log Inspector: Melihat rekaman error runtime dan log panggilan API secara real-time.

---

## 6. Komponen Primitif & Global UI (`src/components/`)

Komponen UI dibangun di atas **Radix UI Primitives** dengan sentuhan styling modern Tailwind CSS:

```text
src/components/
├── license/
│   └── LicenseWarningBanner.jsx    # Banner peringatan H-7 masa aktif lisensi habis
├── ui/
│   ├── alert-dialog.jsx            # Modal konfirmasi destruktif (contoh: hapus produk)
│   ├── avatar.jsx                  # Avatar pengguna dengan fallback inisial nama
│   ├── badge.jsx                   # Label status (Lunas, Belum Lunas, Expired, dll.)
│   ├── button.jsx                  # Tombol dengan varian (default, destructive, outline, ghost)
│   ├── card.jsx                    # Container kartu dengan header, content, dan footer
│   ├── checkbox.jsx                # Kotak centang checkbox accessible
│   ├── dialog.jsx                  # Modal pop-up formulir interaktif
│   ├── dropdown-menu.jsx           # Menu aksi titik tiga (Edit, Hapus, Detail)
│   ├── input.jsx                   # Field input teks & angka dengan focus ring
│   ├── label.jsx                   # Label formulir terhubung ke id input
│   ├── popover.jsx                 # Floating popover untuk filter tanggal & tooltip
│   ├── progress.jsx                # Bar kemajuan kuota transaksi & proses sync
│   ├── scroll-area.jsx             # Container scrollbar custom yang mulus
│   ├── select.jsx                  # Dropdown pilihan kategori/pelanggan searchable
│   ├── separator.jsx               # Garis pemisah horizontal/vertikal
│   ├── sheet.jsx                   # Slide-over panel dari samping atau bawah layar
│   ├── switch.jsx                  # Toggle switch on/off (contoh: aktifkan PPN)
│   ├── table.jsx                   # Tabel data responsif dengan striped row
│   ├── tabs.jsx                    # Tab navigasi sub-menu (contoh: Tab Penjualan vs Piutang)
│   └── tooltip.jsx                 # Keterangan tooltip bantuan saat hover ikon
├── ErrorBoundary.jsx               # Penangkap crash runtime tak terduga dengan tombol reload
└── LoadingScreen.jsx               # Layar animasi loading dengan transisi mulus
```

---

## 7. Custom Hooks & State Management (`src/lib/hooks/`)

Seluruh komunikasi data server dikelola menggunakan **TanStack Query v5**, memastikan caching cerdas, deduplikasi request, dan optimasi performa:

```text
src/lib/hooks/
├── useAuth.jsx                     # Context Provider Supabase Authentication & Sesi User
├── useAppUpdate.js                 # Detektor versi baru APK dari tabel app_releases
├── useNotifications.jsx            # Listener notifikasi in-app realtime & counter lonceng
├── useTheme.js                     # Pengatur tema gelap (dark mode) dan terang (light mode)
├── useAIQuota.js                   # Pelacak sisa kuota prompt asisten AI tenant
├── useDelayedData.js               # Debounce hook untuk pencarian katalog instan
├── useMediaQuery.js                # Deteksi breakpoint layar (isMobile, isTablet, isDesktop)
├── useCapacitorBackNavigation.js   # Penanganan tombol fisik 'Back' di Android
└── sembako/                        # DOMAIN DATA HOOKS:
    ├── sembakoCommon.js            # Base query keys, tenant extractor, & stale time policy
    ├── sembakoSales.js             # useSembakoSales, useCreateSembakoSale, useUpdateSalePayment
    ├── sembakoProducts.js          # useSembakoProducts, useCreateProduct, useUpdateProduct
    ├── sembakoBatches.js           # useSembakoBatches, useAddStockBatch, useAdjustStockOpname
    ├── sembakoCustomers.js         # useSembakoCustomers, useCreateCustomer, useCustomerLedger
    ├── sembakoSuppliers.js         # useSembakoSuppliers, useCreateSupplier, useSupplierPayable
    ├── sembakoReturns.js           # useSembakoReturns, useCreateReturn, useApproveReturn
    ├── sembakoDeliveries.js        # useSembakoDeliveries, useAssignDriver, useCompletePOD
    ├── sembakoEmployees.js         # useSembakoEmployees, useCreateEmployee, usePayrollRun
    ├── sembakoLaporan.js           # useSembakoLaporan, useProfitLossData, useAgingReceivables
    ├── sembakoAudit.js             # useSembakoAuditLogs, useRecordAuditAction
    └── sembakoReportUtils.js       # Agregator kalkulasi laba kotor & ringkasan omzet
```

---

## 8. Core Engine, AI & Utility Services (`src/lib/`)

Pusat utilitas murni tanpa dependensi UI:

- **`aiService.js` & `aiPrompt.js`**:
  - Menghubungkan aplikasi ke endpoint **MAIA AI Router** dengan model prioritas **xAI Grok Fast Reasoning** dan fallback **GLM ZhipuAI**.
  - Menginjeksi konteks bisnis tenant (stok kritis, piutang macet, rekap penjualan hari ini) ke dalam prompt sistem secara dinamis.
- **`aiTransactionInserter.js`**:
  - Mengubah instruksi bahasa alami dari percakapan AI menjadi payload transaksi valid (contoh: *"Catat penjualan 5 sak beras ke Warung Berkah lunas cash"* ➔ mengeksekusi mutasi penjualan otomatis).
- **`offline/db.js` & `offline/syncEngine.js`**:
  - Mengelola database browser lokal **Dexie.js (IndexedDB)**.
  - Menyimpan transaksi di tabel `sync_queue` saat tidak ada koneksi internet dan otomatis mem-push ke Supabase saat online.
- **`format.js`**:
  - `formatRupiah(number)` ➔ Format mata uang standar Indonesia (*Rp 1.500.000*).
  - `formatTanggal(date)` ➔ Format tanggal Bahasa Indonesia (*14 Agustus 2026*).
  - `formatWhatsAppNumber(phone)` ➔ Normalisasi nomor HP ke format internasional (*628...*).
- **`invoice/pdfExportHelper.js` & `invoiceUtils.js`**:
  - Generator struktur dokumen PDF faktur penjualan dan surat jalan logistik.
  - Driver pencetakan ESC-POS thermal printer Bluetooth.
- **`subscriptionUtils.js`**:
  - Kalkulator sisa hari masa aktif langganan dan validator fitur per paket lisensi (*Starter, Pro, Enterprise*).
