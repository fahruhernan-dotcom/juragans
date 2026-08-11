# 🏆 JOB DESCRIPTION & PORTOFOLIO OPERASIONAL OWNER (FOUNDER)
**JURAGAN BY ANAK BAWANG**

**Nomor Dokumen Master**: `JOB/OWNER/2026/08/001-REV`  
**Kedudukan / Jabatan**: **Founder, Chief Executive Officer (CEO) & Lead System Architect**  
**Lokasi Operasional**: Cepogo, Kabupaten Boyolali, Jawa Tengah  
**Sertifikat Halal Resmi**: `ID33110018517710724` (BPJPH Kemenag RI)  

---

## 📌 Ringkasan Eksekutif Peran Founder & Owner
Sebagai Pendiri (*Founder*) dan Pemilik Usaha (*Owner*), seluruh wewenang permodalan, keputusan harga master, perancangan arsitektur teknologi, pengembangan automasi, legalitas resmi, dan kepemilikan aset intelektual **Juragan by Anak Bawang** berada 100% di bawah kendali tunggal **Owner**.

Dokumen ini mencatat secara menyeluruh seluruh portofolio kerja, milestone sejarah pengembangan bisnis, inovasi teknis, serta tugas operasional yang telah dieksekusi oleh Owner secara mandiri.

---

## 🏛️ Rincian Portofolio & Pekerjaan Komprehensif Owner

### 1. 💼 Permodalan Usaha & Manajemen Pasokan Stok Pabrik (Founder & CEO)
* **Penyedia Modal Usaha Utama (*Initial Capital Burn*)**: Membiayai penuh alokasi dana pengeluaran awal (Bakar Duit Rp 528.175) untuk menopang bahan baku 3 kg stok awal pabrik (Rp 345.000), cetak stiker branding Sampurna Printshop (Rp 127.500), kemasan standing pouch Fahru (Rp 35.675), dan logistik pengiriman sampel.
* **Manajemen Pasokan Pabrik Boyolali**: Pengelola tunggal hubungan bisnis dan penanggung jawab pengangkatan stok murni dari **Pabrik Bawang Merah Boyolali di Cepogo** dengan skema HPP dasar:
  - **Grade S Murni 100%**: Rp 120.000 / kg
  - **Grade A Crispy**: Rp 105.000 / kg
* **Fasilitas Sarana Operasional**: Menyediakan fasilitas sarana kerja utama berupa timbangan digital presisi resmi untuk kegiatan *repackaging* tim.

---

### 2. 🏦 Pengawasan Keuangan Pusat, QRIS Resmi, & Master Pricing (CFO)
* **Kepemilikan QRIS & Rekening Resmi**: Pemegang tunggal pendaftaran QRIS Pembayaran Resmi atas nama Owner, rekening penampungan bank, serta otoritas penarikan saldo toko e-commerce.
* **Master Penetapan Harga (*Single Source of Truth*)**: Merumuskan dan memformulasikan matriks 20 SKU produk resmi (`master_pricelist_sku.csv`):
  - **Skema Harga Resmi Solo Raya (Lokal)**: Penyesuaian margin wilayah lokal (+Rp 500 per unit).
  - **Skema Harga Resmi Pusat (Jakarta & Semarang)**: Penyesuaian margin pasar luar kota.
  - **Skema Marketplace Promo & Harga Coret**: Perhitungan margin e-commerce Shopee/TikTok Shop dengan potongan biaya admin.
  - **Skema Grosir & Horeca Offline**: Penetapan harga paket bal 1 kg/2 kg untuk restoran & pengusaha kuliner.
* **Pembukuan Keuangan & Profitability**: Mengkalkulasi HPP presisi (bawang + pouch + stiker depan/belakang), melacak profit net (contoh: *Minggu 1 Agustus 2026 meraih Omset Rp 712.000, Total HPP Rp 560.086, dan Profit Net Rp 151.914 dengan margin 21,34%*).

---

### 3. 💻 Pembangunan Sistem Teknologi & Dashboard Admin Web (CTO & System Architect)
* **Master Database Cloud Supabase**: Merancang, membangun, dan mengeksekusi skema database PostgreSQL Supabase Cloud (`juragan_bawang_master_schema.sql`) dengan 9 tabel terisolasi (`juragan_products`, `juragan_suppliers`, `juragan_stock_batches`, `juragan_customers`, `juragan_sales`, `juragan_sale_items`, `juragan_expenses`, `juragan_payroll`, `juragan_audit_logs`) dilengkapi RLS Policies.
* **Pengembangan Dashboard Admin Web (React + Vite)**: Membangun 6 modul aplikasi admin modern berbasis web di `Website/src/pages/admin/`:
  1. `ProductPricing.jsx`: Pengelolaan SKU master, HPP dasar, dan skema opsi harga A & B.
  2. `InventoryManagement.jsx`: Pemantauan sisa stok gudang & tagihan pengambilan pabrik Boyolali.
  3. `SalesOrders.jsx`: Pendataan transaksi pesanan terkonfirmasi & pemantauan status kirim.
  4. `B2BProspects.jsx`: Database 27 Resto Bakso Solo Raya prioritas dengan integrasi tombol direct WhatsApp.
  5. `ExpensesPayroll.jsx`: Pembukuan biaya operasional & klaim setoran tim.
  6. `InvoicePrinter.jsx`: Generator cetak invoice PDF/Nota resmi pelanggan & pabrik.
* **Penyempurnaan UI/UX Admin**: Memasang utilitas `no-scrollbar` tanpa scrollbar tebal, penataan sidebar `w-64` responsif, dan memastikan verifikasi build `npm run build` sukses 100%.
* **Alat Bantu Visual 3D**: Membangun aplikasi visual 3D simulator pengemasan kardus (`3d_packing_simulator.html`).

---

### 4. 🤖 Automasi Medsos, Scraping Competitor, & Cloud Sync (Data Intelligence Lead)
* **Saluran Resmi IG & TikTok**: Membangun, mengonfigurasi, dan mengelola saluran media sosial resmi **Instagram & TikTok** (*Juragan Bawang*) sebagai sarana branding visual, penetrasi pasar digital, dan saluran penjualan.
* **Backend Bridge Service**: Membangun server bridge Flask/Python (`server_bridge.py`) dengan penanganan `WinError 10013` & `10048` agar server port 5000 tahan banting di latar belakang.
* **Bot Automasi Posting Medsos**: Membuat bot automasi posting konten & story Instagram berbasis Selenium & Browser Script (`auto_post_instagram.py`, `auto_story_selenium.py`, `auto_post_browser.py`).
* **Scraping & Competitor Intelligence**: Membangun script scraping data kompetitor Shopee & Tokopedia (`Scraping_Data/tokped_analysis.py`, `tokped_logical_filter.py`, `analyze_competitors.py`) memproses ribuan dataset produk untuk analisis harga pasar.
* **Automasi Cloud Sync Playwright**: Membangun script otomatisasi pengunggahan dokumen PDF & invoice ke Google Drive via Playwright (`auto_gdrive_sync.py`, `gdrive_playwright_upload.py`).
* **Shopee Sync Bookmarklet**: Membuat tools `bookmarklet_shopee_sync.js` untuk penyelarasan data toko Shopee.

---

### 5. 📄 Generator PDF Invoicing & Dokumentasi Profesional (Documentation Lead)
* **Generator PDF Invoicing Python ReportLab**: Membangun script generator invoice PDF otomatis (`generate_customer_invoices.py`, `generate_te_pln_invoices.py`, `generate_adib_invoice.py`, `generate_pdf_pricelists.py`).
* **Dokumentasi Invoicing Riil**: Memproduksi berkas invoice resmi untuk pelanggan institusi & ritel (Divisi TE PLN, Mas Adib Semarang, Sdr. Didi, Sdr. Fahru, dan Tagihan Pabrik Boyolali).

---

### 6. 📦 Sourcing Kemasan, Brand Identity, & Market Validation (CMO & Procurement)
* **Validasi Pasar Ritel & Keunggulan Produk**: Memelopori riset pasar Jabodetabek & Semarang yang membuktikan keunggulan utama produk: fisik **Bawang Goreng Murni utuh (tidak remuk)** dibanding kompetitor pasar.
* **Riset Lead B2B Solo Raya**: Memfilter 53 data rumah makan bakso menjadi **27 prospek prioritas unggulan** (Rating ≥ 4.0, Reviews > 20) beserta 3 formulasi draf pitching khusus (Email, WA, Drop Sample).
* **Sourcing Kemasan Pouch**: Melakukan pencarian (*sourcing*), kalkulasi HPP kemasan, dan pembelian kemasan standing pouch dari supplier (pembelian dari supplier Sdr. Fahru).
* **Brand Identity & Copywriting**: Merumuskan deskripsi produk toko Shopee, prompt AI visual branding label kemasan, dan pedoman gaya komunikasi brand (*brand voice*).

---

### 7. ⚖️ Legalitas Resmi, Perjanjian Kerja Tim, & Supervisi (Legal & HR Lead)
* **Pengurusan Legalitas Usaha**: Mengurus dan memegang Sertifikat Halal Resmi Kemenag (`ID33110018517710724`) dan Perizinan NIB OSS.
* **Penyusunan Sistem SPK Legal & Proteksi Hukum**: Menyusun Surat Perjanjian Kerja (SPK) legal untuk Sdr. Reyhan (*Marketing & Sales*) dan Sdr. Didi (*E-Commerce & Repackaging*), yang dilengkapi:
  - **Rahasia Dagang (NDA)** berdasarkan UU No. 30 Tahun 2000.
  - **Klausa Proteksi Rahasia Suplier Pabrik & Modal HPP Dasar**.
  - **Hak Kepemilikan Aset Intelektual (IP Rights)** 100% milik Owner.
  - **Prosedur Serah-Terima Aset (Exit Protocol 3x24 Jam)**.
  - **Evaluasi Kinerja Berkala (KPI)**.
  - **Denda Sanksi Finansial Pelanggaran Rp 50.000.000,-**.
  - **Klausa Larangan Bersaing (*Non-Compete Clause*) 5 Tahun Berturut-turut**.
* **Supervisi & Audit Kinerja Tim**: Menilai, membimbing, dan mengaudit kinerja operasional tim secara berkala.

---

## 🏆 Ringkasan Status Aset & Wewenang Khusus Owner

| Bidang Aset | Status Kepemilikan & Wewenang |
| :--- | :--- |
| **Kredensial & Akses Keuangan** | **100% Hak Milik Tunggal Owner** (QRIS, Bank, & Penarikan Saldo Toko) |
| **Saluran Medsos & Branding** | **100% Hak Milik Tunggal Owner** (Akun Resmi Instagram & TikTok Juragan Bawang) |
| **Hak Cipta Technology Stack** | **100% Hak Milik Intelektual Owner** (Website Admin, Database Supabase, Script Bot, Invoice Generator) |
| **Master Pricing & HPP** | **100% Kendali Owner** (`master_pricelist_sku.csv` & `juragan_bawang_master_schema.sql`) |
| **Hubungan Suplier Pabrik** | **100% Kendali Owner** (Pabrik Bawang Merah Boyolali di Cepogo) |
| **Legalitas & Sertifikasi** | **100% Terdaftar atas Nama Owner** (Sertifikat Halal Kemenag & NIB OSS) |
