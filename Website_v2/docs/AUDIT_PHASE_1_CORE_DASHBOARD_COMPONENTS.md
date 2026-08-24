# 🔍 Audit Teknis Fase 1: Komponen Dashboard Inti & Operasional
## Subfolder: `src/dashboard/broker/sembako_broker/`

> Berkas ini menyajikan hasil audit mendalam terhadap seluruh file di dalam `src/dashboard/broker/sembako_broker/` dan subfolder `components/`, mendokumentasikan temuan logika spesifik industri rokok (*cigarette-niche assumptions*), serta solusi refactoring menjadi sistem **Multi-Unit & ERP Universal**.

---

## 📑 Daftar Berkas yang Diaudit

```text
src/dashboard/broker/sembako_broker/
├── Beranda.jsx                                    # Halaman ringkasan eksekutif
├── DevAdminHubPage.jsx                            # Hub superadmin & kontrol sistem
├── Gudang.jsx                                     # Manajemen stok & batch FIFO
├── KelolaAkunPage.jsx                             # Pengaturan profil toko
├── Laporan.jsx                                    # Laporan laba-rugi & keuangan
├── Pegawai.jsx                                    # Manajemen staf & payroll
├── Penjualan.jsx                                  # Kasir POS & daftar faktur
├── Produk.jsx                                     # Master katalog produk
├── Retur.jsx                                      # Penanganan retur barang
├── SembakoInvoicePreview.jsx                      # Generator faktur cetak & thermal
├── TimManajemenPage.jsx                           # Manajemen hak akses tim
├── TokoSupplier.jsx                               # CRM pelanggan & supplier
├── TokoSupplierDetail.jsx                         # Buku besar mitra
└── components/
    ├── DeliveryCompletionModal.jsx                # Upload POD & rincian jalan
    ├── FinancialReportPdfModal.jsx                # Ekspor PDF laporan keuangan
    ├── SembakoAuditLogView.jsx                    # Tampilan riwayat aktivitas
    ├── SembakoCreateInvoiceSheet.jsx              # Form kasir POS pembuatan faktur
    ├── SembakoInvoiceCard.jsx                     # Kartu daftar transaksi
    ├── SembakoOnboardingChecklist.jsx             # Wizard onboarding toko baru
    ├── SembakoPageHeader.jsx                      # Header halaman standar
    ├── SembakoPaymentSheet.jsx                    # Input pembayaran piutang/kas
    ├── SembakoRecycleBin.jsx                      # Tempat sampah & restore data
    ├── SembakoSaleDetailSheet.jsx                 # Detail rincian faktur penjualan
    ├── sembakoSaleUtils.jsx                       # Utilitas kalkulasi & multi-unit
    ├── SembakoSuccessCard.jsx                     # Konfirmasi transaksi berhasil
    ├── SembakoSummaryStrip.jsx                    # Ringkasan KPI bar
    ├── SembakoTambahStokSheet.jsx                 # Form penerimaan stok batch (Stock-In)
    ├── SembakoUiPrimitives.jsx                    # Primitif UI atomik
    └── beranda/
        ├── BerandaAgenda.jsx                      # Widget tugas & jadwal
        ├── BerandaChart.jsx                       # Grafik tren penjualan
        ├── BerandaUtils.js                        # Utilitas agregasi beranda
        ├── CollectionReminderCard.jsx             # Pengingat piutang
        ├── dashboardLayouts.js                    # Konfigurasi tata letak
        ├── DesktopBeranda.jsx                     # Tampilan desktop beranda
        └── MobileBeranda.jsx                      # Tampilan mobile beranda
```

---

## 🔎 Temuan Logika Niche Rokok & Solusi Refactoring

### 1. `components/sembakoSaleUtils.jsx`
- **Temuan**:
  - `RokokUnitCalculator`: Komponen popup kalkulator yang mengasumsikan rasio kemasan rokok statis:
    - 1 Bal Besar = 200 Slop
    - 1 Bal Kecil = 100 Slop
    - 1 Slop = 10 Pack
    - 1 Pack = 1 Pcs
  - `formatRokokPackaging(quantity)`: Memformat angka hanya ke dalam unit `bal` dan `slop`.
- **Solusi Refactoring**:
  - Ubah menjadi **`UniversalMultiUnitCalculator`**: Mendukung input dinamis tingkat kemasan (*Tingkat 1: Karton/Dus, Tingkat 2: Box/Pak/Slop, Tingkat 3: Pcs/Biji/Tablet*) dengan rasio konversi yang dapat dikonfigurasi per produk atau menggunakan preset umum.
  - Ubah menjadi **`formatUniversalPackaging(quantity, baseUnit, packUnit)`**: Menghasilkan string kemasan yang adaptif untuk segala industri (misal: *5 Karton 12 Pcs* atau *10 Dus 4 Pak*).

---

### 2. `components/SembakoCreateInvoiceSheet.jsx` & `SembakoSaleDetailSheet.jsx`
- **Temuan**:
  - Opsi biaya operasional supir mendefinisikan chip: `{ id: 'rokok', label: 'Rokok Sopir', Icon: Cigarette }`.
  - Deteksi pengeluaran supir menggunakan regex: `/bensin|rokok|makan|tol|parkir/i`.
- **Solusi Refactoring**:
  - Ganti chip biaya menjadi universal:
    - `bbm`: BBM / Bensin (`Fuel` / `Car`)
    - `konsumsi`: Uang Makan & Konsumsi Supir (`Utensils` / `Coffee`)
    - `tol_parkir`: Tol & Parkir (`Ticket` / `CircleDollarSign`)
    - `bongkar`: Biaya Bongkar Muat (`PackageOpen` / `Truck`)
    - `lainnya`: Operasional Lainnya (`MoreHorizontal`)
  - Deteksi regex diperbarui menjadi: `/bensin|bbm|makan|konsumsi|tol|parkir|bongkar|operasional/i`.

---

### 3. `components/SembakoTambahStokSheet.jsx`
- **Temuan**:
  - Komentar dan pemanggilan tombol kalkulator merujuk pada `RokokUnitCalculator`.
- **Solusi Refactoring**:
  - Ganti pemanggilan menjadi `UniversalMultiUnitCalculator` dengan label netral: *"Kalkulator Konversi Satuan Kemasan"*.

---

### 4. `Produk.jsx`
- **Temuan**:
  - Label input: `label="Nama Produk Rokok *"`
  - Subtitle halaman: `Katalog & Harga Rokok`
- **Solusi Refactoring**:
  - Ganti menjadi: `label="Nama Produk *"`
  - Ganti menjadi: `Katalog & Harga Produk`

---

### 5. `TokoSupplier.jsx` & `TokoSupplierDetail.jsx`
- **Temuan**:
  - Subtitle: `Relasi agen, toko & pabrik rokok`
  - Placeholder: `Contoh: Supplier rokok gudang barat...`
- **Solusi Refactoring**:
  - Ganti menjadi: `Relasi agen, toko & supplier mitra`
  - Ganti menjadi: `Contoh: Supplier gudang pusat...`

---

### 6. `Pegawai.jsx` & `FinancialReportPdfModal.jsx`
- **Temuan**:
  - Deskripsi accessibility: `gudang rokok`
  - Fallback nama bisnis di PDF: `Distributor Sembako & Rokok`
- **Solusi Refactoring**:
  - Ganti menjadi: `gudang produk`
  - Ganti menjadi: `Laporan Finansial & Inventaris`

---

### 7. `components/beranda/DesktopBeranda.jsx` & `MobileBeranda.jsx`
- **Temuan**:
  - Teks header statis: `DASHBOARD DISTRIBUTOR ROKOK`
- **Solusi Refactoring**:
  - Ganti menjadi dinamis: `{tenant?.business_name?.toUpperCase() || 'DASHBOARD INVENTARIS & BISNIS'}`

---

## 🎯 Rencana Tindakan Refactoring Fase 1
1. Refaktor `sembakoSaleUtils.jsx` untuk mengganti kalkulator kemasan rokok dengan kalkulator multi-unit universal.
2. Refaktor `SembakoCreateInvoiceSheet.jsx`, `SembakoSaleDetailSheet.jsx`, dan `DeliveryCompletionModal.jsx` untuk menetralkan kategori biaya operasional.
3. Refaktor `Produk.jsx`, `TokoSupplier.jsx`, `Pegawai.jsx`, dan komponen beranda untuk menghapus seluruh istilah rokok.
