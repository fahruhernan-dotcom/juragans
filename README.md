# 🧅 JURAGAN BY ANAK BAWANG — SYSTEM OPERATIONAL & AUTOMATION HUB

Sistem manajemen operasional, pencatatan pesanan & invoicing, master pricing & SKU, automasi pemasaran digital, dan website landing page/admin dashboard resmi untuk **Bawang Goreng Premium Boyolali (Grade S Murni & Grade A Crispy)**.

---

## 🗺️ Peta Struktur Folder & Dokumentasi Proyek

```text
Juragan by Anak Bawang/
├── 📜 README.md                            <-- Dokumentasi utama & Peta Struktur Folder
├── 📜 master_pricelist_sku.csv             <-- Master Database Tunggal SKU, HPP, & Harga Resmi Pusat (Single Source of Truth)
├── 📜 juragan_bawang_master_schema.sql     <-- Skema Database SQL Supabase Cloud
├── 📜 requirements.txt                     <-- Dependensi Python terpadu
├── 📜 .env                                 <-- Kredensial Environment Supabase & Server
│
├── 📂 Manajemen_Pesanan/                  <-- [MODUL UTAMA PESANAN, PACKING & INVOICING]
│   ├── 📂 Database/                       <-- Database CSV Pesanan (Real, Simulasi, & Packing Queue)
│   ├── 📂 Laporan_Gudang/                 <-- Laporan Ringkasan Packing Gudang & Analisis Stok
│   ├── 📂 Scripts/                        <-- Script Automasi Python CLI & PDF Invoice Generator
│   ├── 📂 Invoices/                       <-- [ARSIP INVOICE TERSTRUKTUR]
│   │   ├── 📁 PDF/                        <-- Seluruh File PDF Invoice Pelanggan & Tagihan Pabrik
│   │   └── 📁 Markdown/                   <-- Seluruh File Markdown (.md) Source Invoice
│   ├── 📝 SOP_PENCATATAN_PESANAN_AUTOMATIS.md <-- SOP Resmi Pencatatan Pesanan 3-Level Cost
│   └── 📜 README.md                       <-- Panduan Modul Manajemen Pesanan
│
├── 📂 Notulensi/                          <-- [MODUL REKAPITULASI & CATATAN BISNIS]
│   └── 📂 2026/08_Agustus/
│       ├── 📝 minggu_1.md                 <-- Notulensi Minggu 1 & Master Tabel Deal Pesanan
│       └── 📝 notul_bulanan.md             <-- Ringkasan Notulensi Eksekutif Bulanan
│
├── 📂 Strategi_Bisnis/                    <-- [MODUL STRATEGI HARGA & MARGIN]
│   └── 📂 01_Penetapan_Harga_dan_SKU/
│       └── 📝 master_strategi_penetapan_harga_dan_bisnis.md
│
├── 📂 Website/                            <-- [MODUL WEBSITE & DASHBOARD ADMIN]
│   ├── 📁 src/pages/admin/                <-- Dashboard Web Admin (ProductPricing, CustomerOrders, etc.)
│   └── 📁 src/components/                 <-- PriceCalculator & Header/Footer
│
├── 📂 Automasi_Medsos/                    <-- [MODUL AUTOMASI MEDSOS & SERVER]
│   └── 🐍 server_bridge.py                <-- Backend Flask/Python Bridge Service
│
├── 📂 Aset_Konten/                        <-- [MODUL MEDIA & FOTO PRODUK]
├── 📂 Marketplace_Templates/             <-- [MODUL MARKETPLACE SHOPEE & TIKTOK]
└── 📂 Dokumen_Legal/                      <-- [DOKUMEN HALAL, NIB, & P-IRT]
```

---

## 🚀 Alur Penggunaan & Shortcut Kerja (Quick Start)

### 1️⃣ Membuka Master SKU & Pricing Produk
* **File CSV**: Open [master_pricelist_sku.csv](file:///d:/Dokumen/02_Kerja_Profesional/Juragan%20by%20Anak%20Bawang/master_pricelist_sku.csv)
* **File Markdown**: Open [master_strategi_penetapan_harga_dan_bisnis.md](file:///d:/Dokumen/02_Kerja_Profesional/Juragan%20by%20Anak%20Bawang/Strategi%20Bisnis/01_Penetapan_Harga_dan_SKU/master_strategi_penetapan_harga_dan_bisnis.md)

### 2️⃣ Membuka Rekapitulasi Pesanan & Rekap Packing Gudang
* **Database Pesanan Real**: Open [daftar_pesanan_agustus_2026.csv](file:///d:/Dokumen/02_Kerja_Profesional/Juragan%20by%20Anak%20Bawang/Manajemen_Pesanan/Database/daftar_pesanan_agustus_2026.csv)
* **Rekap Packing Gudang**: Open [rekap_packing_gudang.csv](file:///d:/Dokumen/02_Kerja_Profesional/Juragan%20by%20Anak%20Bawang/Manajemen_Pesanan/Database/rekap_packing_gudang.csv)
* **Laporan Packing Markdown**: Open [rekap_packing_gudang.md](file:///d:/Dokumen/02_Kerja_Profesional/Juragan%20by%20Anak%20Bawang/Manajemen_Pesanan/Laporan_Gudang/rekap_packing_gudang.md)
* **Notulensi Minggu 1**: Open [minggu_1.md](file:///d:/Dokumen/02_Kerja_Profesional/Juragan%20by%20Anak%20Bawang/Notulensi/2026/08_Agustus/minggu_1.md#L46-L60)

### 3️⃣ Menjalankan Web Admin Dashboard (React + Vite)
```bash
cd Website
npm run dev
```
Buka browser di **`http://localhost:5173/admin`** untuk melihat dashboard manajemen produk & pesanan.

### 4️⃣ Pencatatan Pesanan Otomatis (3-Level Cost Architecture)
* **Dokumen SOP**: Open [SOP_PENCATATAN_PESANAN_AUTOMATIS.md](file:///d:/Dokumen/02_Kerja_Profesional/Juragan%20by%20Anak%20Bawang/Manajemen_Pesanan/SOP_PENCATATAN_PESANAN_AUTOMATIS.md)
* **Perintah CLI Automasi**:
  ```bash
  python Manajemen_Pesanan/catat_pesanan_cli.py --pelanggan "Nama Pelanggan" --items '[{"sku":"JBM-250","qty":2}]' --kardus --kartu-ucapan --shipping-paid-by business --shipping-cost 10000
  ```

---

## 📞 Kontak & Admin Official

* **Admin Official**: +62 821-3373-1213
* **Lokasi Produksi**: Cepogo, Kabupaten Boyolali, Jawa Tengah 57362
* **Sertifikat Halal Resmi**: ID33110018517710724
