# 🔍 Audit Teknis Fase 3: Logika Bisnis, Custom Hooks & Offline Engine
## Subfolder: `src/lib/`

> Berkas ini menyajikan hasil audit mendalam terhadap seluruh logika komputasi, hooks data TanStack Query, arsitektur offline-first IndexedDB, sistem lisensi SaaS, serta pemetaan model bisnis di direktori `src/lib/`.

---

## 📑 Daftar Berkas yang Diaudit

```text
src/lib/
├── businessModel.js                               # Registry & metadata model bisnis
├── format.js                                      # Utilitas format mata uang & tanggal
├── supabaseClient.js                              # Client Supabase PostgreSQL
├── hooks/
│   ├── useAuth.jsx                                # Context autentikasi & session
│   ├── useNotifications.js                        # Hook data notifikasi realtime
│   ├── useTheme.js                                # Hook switch dark/light mode
│   └── sembako/
│       ├── sembakoCustomers.js                    # CRM pelanggan & limit piutang
│       ├── sembakoExpenses.js                     # Biaya operasional toko
│       ├── sembakoHpp.js                          # Perhitungan HPP FIFO atomik
│       ├── sembakoInventory.js                    # Stok opname & mutasi batch
│       ├── sembakoPayroll.js                      # Penggajian & kasbon karyawan
│       ├── sembakoProducts.js                     # Katalog & multi-tier harga
│       ├── sembakoReportUtils.js                  # Agregasi laba rugi P&L
│       ├── sembakoReturns.js                      # Retur penjualan & pembelian
│       ├── sembakoSales.js                        # Penjualan, kasir POS & piutang
│       ├── sembakoSupplierAssistant.js            # Asisten PO supplier
│       └── sembakoSuppliers.js                    # CRM supplier & hutang dagang
├── hpp/
│   └── penggemukanHppCalcs.js                     # Utilitas komputasi ternak (legacy)
├── i18n/                                          # Kamus lokalisasi id/en
├── invoice/                                       # Utilitas generator faktur & PDF
├── license/                                       # Logika proteksi & lisensi server SaaS
├── logger/                                        # Action & audit logger
├── offline/
│   ├── db.js                                      # Schema Dexie IndexedDB
│   └── syncEngine.js                              # Background sync worker
└── services/
    └── pushNotificationService.js                # Service Push Notification Capacitor
```

---

## 🔎 Temuan Logika Niche & Solusi Refactoring

### 1. `src/lib/businessModel.js`
- **Temuan**:
  - File ini memuat ratusan baris skema kategori peternakan (`peternak_broiler`, `peternak_layer`, `peternak_sapi`, `peternak_kambing`, `peternak_domba`, `rpa_buyer`, dll.) dari platform terdahulu.
- **Solusi Refactoring**:
  - Pastikan rute default sistem selalu mengarah ke model **Virgin Master ERP / Retail & Wholesale Distribution** (`broker_sembako` / `general_trading`).
  - Sediakan integrasi bersih dengan [`src/config/businessConfig.js`](file:///d:/Dokumen/02_Kerja_Profesional/Dashboard%20Virgin/src/config/businessConfig.js) agar model bisnis langsung membaca konfigurasi aktif.

---

### 2. `src/lib/hooks/sembako/`
- **Temuan**:
  - `sembakoHpp.js` & `sembakoProducts.js`: Perlu dipastikan perhitungan HPP dan konversi satuan membaca faktor konversi dinamis dari `conversion_unit` dan `conversion_ratio` (misal: 1 Dus = 40 Pcs, atau 1 Box = 10 Strip).
  - `sembakoSales.js` & `sembakoReturns.js`: Telah berhasil dibersihkan dari key lama `gopek_retur_list` menjadi `erp_retur_list`.

---

### 3. `src/lib/hpp/penggemukanHppCalcs.js`
- **Temuan**:
  - Berkas ini adalah modul kalkulasi penambahan bobot harian (ADG) dan FCR untuk penggemukan hewan ternak.
- **Solusi Refactoring**:
  - Isolasi berkas ini dan pastikan modul inventaris utama tidak lagi mengimpor utilitas ini, sehingga engine HPP murni menggunakan algoritma **FIFO (First-In, First-Out) Weighted Average Cost** untuk barang dagangan umum.

---

## 🎯 Rencana Tindakan Refactoring Fase 3
1. Validasi seluruh hooks data agar mendukung satuan fleksibel (*multi-unit*) dan multi-tier harga (*Eceran, Grosir 1, Grosir 2, Khusus*).
2. Pastikan `db.js` dan `syncEngine.js` bekerja secara robust untuk seluruh varian produk barang.
