# 🧅 JURAGAN BY ANAK BAWANG — SYSTEM OPERATIONAL & AUTOMATION HUB

Sistem manajemen operasional, pencatatan pesanan & invoicing, master pricing & SKU multi-wilayah, automasi pemasaran B2B/Medsos, serta website landing page/admin dashboard resmi untuk **Bawang Goreng Premium Boyolali (Grade S Murni & Grade A Crispy)**.

---

## 🗺️ Peta Struktur Folder & Modul Proyek

```text
Juragan by Anak Bawang/
├── 📜 README.md                            <-- Dokumentasi utama & Peta Sistem Proyek
├── 📜 master_pricelist_sku.csv             <-- Master Database Tunggal SKU, HPP, & Harga Resmi (Single Source of Truth)
├── 📜 juragan_bawang_master_schema.sql     <-- Skema Database SQL Supabase Cloud (Sales, Items, Inventory)
├── 📜 juragan_bawang_migration_v2.sql      <-- Realtime & Warehouse Packing Migration
├── 📜 requirements.txt                     <-- Dependensi Python terpadu
├── 📜 .env                                 <-- Kredensial Environment Supabase, AI, & Server
│
├── 📂 .agents/                             <-- [AGENT SKILLS & SOP AI]
│   └── 📂 skills/juragan-invoice-generator/ <-- Skill Resmi Pembuatan Invoice & Pricing Regional
│
├── 📂 Manajemen_Pesanan/                  <-- [MODUL UTAMA PESANAN, PACKING & INVOICING]
│   ├── 📂 Database/                       <-- Database CSV Pesanan (Real & Packing Queue)
│   ├── 📂 Laporan_Gudang/                 <-- Rekap Packing Gudang & Analisis Stok
│   ├── 📂 Scripts/                        <-- Generator Invoice PDF/MD & Script CLI Transaksi
│   │   ├── 🐍 generate_customer_invoices.py <-- Generator Invoice Pelanggan (PDF & Markdown)
│   │   └── 🐍 catat_pesanan_cli.py        <-- CLI Pencatatan Transaksi 3-Level Cost
│   ├── 📂 Pricelists/PDF/                 <-- Master Pricelist Resmi Multi-Wilayah (Clean PDF)
│   │   ├── 📄 pricelist_solo_raya_clean.pdf        <-- Harga Pasar Solo Raya (Lokal)
│   │   └── 📄 pricelist_jakarta_semarang_clean.pdf <-- Harga Pasar Jakarta & Luar Kota
│   ├── 📂 invoices_pelanggan/             <-- Output Seluruh Invoice PDF & Markdown Pelanggan
│   ├── 📝 SOP_PENCATATAN_PESANAN_AUTOMATIS.md <-- SOP Resmi Pencatatan Pesanan 3-Level Cost
│   └── 📜 README.md                       <-- Panduan Modul Manajemen Pesanan
│
├── 📂 Automasi_n8n/                       <-- [MODUL B2B COLD OUTREACH ENGINE]
│   ├── 📂 Workflows/                      <-- Workflow n8n (Apify Scraper, AI Cold Email Memory, WhatsApp)
│   ├── 📂 Database/                       <-- Skema Database Leads & Email Queue Supabase
│   ├── 📝 system_prompt_b2b_outreach.md   <-- System Prompt AI Copywriter Penawaran Restoran B2B
│   └── 📜 README.md                       <-- Panduan Automasi n8n & Supabase
│
├── 📂 Automasi_Medsos/                    <-- [MODUL AUTOMASI MEDSOS & SERVER]
│   ├── 🐍 auto_post_instagram.py          <-- Automasi Konten Instagram
│   └── 🐍 server_bridge.py                <-- Backend Flask/Python Bridge Service
│
├── 📂 Scraping_Data/                      <-- [MODUL RISET PASAR & KOMPETITOR]
│   └── 📂 output_data/                    <-- Hasil Scraping Tokopedia, Shopee, & Bapanas
│
├── 📂 Notulensi/                          <-- [MODUL REKAPITULASI & CATATAN BISNIS]
│   └── 📂 2026/08_Agustus/
│       ├── 📝 minggu_1.md                 <-- Notulensi Minggu 1 & Master Tabel Deal Pesanan
│       └── 📝 notul_bulanan.md            <-- Ringkasan Notulensi Eksekutif Bulanan
│
├── 📂 Strategi_Bisnis/                    <-- [MODUL STRATEGI HARGA & MARGIN]
│   └── 📂 01_Penetapan_Harga_dan_SKU/
│       └── 📝 master_strategi_penetapan_harga_dan_bisnis.md
│
├── 📂 Website_v2/                         <-- [SINGLE APP: LANDING PAGE + ADMIN ERP]
│   ├── 📁 src/landing/                    <-- Company Profile Publik (LandingPage, AboutUs, BioLinks)
│   ├── 📁 src/dashboard/                  <-- Admin ERP Dashboard (POS, Batch FIFO, Laporan, Gudang)
│   └── 📁 src/pages/                      <-- Auth Module (Login, Register, Forgot Password)
│
├── 📂 Aset_Konten/                        <-- [MODUL MEDIA & FOTO PRODUK]
├── 📂 Marketplace_Templates/             <-- [MODUL MASS UPLOAD SHOPEE & TIKTOK]
└── 📂 Dokumen_Legal/                      <-- [DOKUMEN HALAL, NIB, & SURAT PERJANJIAN KERJA]
```

---

## 🧅 Spesifikasi Produk & Standar Varian

> ⚠️ **STANDAR RESMI DESKRIPSI PRODUK:**
> - **Grade S Murni**: `100% Bawang Merah Boyolali Murni (Tanpa Tepung)` — Bawang merah asli Boyolali murni 100% tanpa campuran tepung apa pun.
> - **Grade A Crispy**: `Renyah Gurih Mantap (Tepung Tipis 5%)` — Bawang merah Boyolali dengan balutan tepung 5% untuk kerenyahan ekstra gurih.

---

## 🚀 Alur Penggunaan & Shortcut Kerja (Quick Start)

### 1️⃣ Pembuatan & Pembaruan Invoice Pelanggan (AI Skill)
Gunakan skill terintegrasi **`juragan-invoice-generator`** langsung via prompt percakapan:
* **Script Engine**: [generate_customer_invoices.py](file:///d:/Dokumen/02_Kerja_Profesional/Juragan%20by%20Anak%20Bawang/Manajemen_Pesanan/Scripts/generate_customer_invoices.py)
* **Output Invoice PDF & Markdown**: [invoices_pelanggan/](file:///d:/Dokumen/02_Kerja_Profesional/Juragan%20by%20Anak%20Bawang/Manajemen_Pesanan/invoices_pelanggan/)
* **Contoh Command Manual**:
  ```bash
  python "Manajemen_Pesanan/Scripts/generate_customer_invoices.py"
  ```

### 2️⃣ Membuka Master SKU & Pricing Multi-Wilayah
* **File CSV Master**: [master_pricelist_sku.csv](file:///d:/Dokumen/02_Kerja_Profesional/Juragan%20by%20Anak%20Bawang/master_pricelist_sku.csv)
* **Pricelist Solo Raya (Clean PDF)**: [pricelist_solo_raya_clean.pdf](file:///d:/Dokumen/02_Kerja_Profesional/Juragan%20by%20Anak%20Bawang/Manajemen_Pesanan/Pricelists/PDF/pricelist_solo_raya_clean.pdf)
* **Pricelist Jakarta/Semarang (Clean PDF)**: [pricelist_jakarta_semarang_clean.pdf](file:///d:/Dokumen/02_Kerja_Profesional/Juragan%20by%20Anak%20Bawang/Manajemen_Pesanan/Pricelists/PDF/pricelist_jakarta_semarang_clean.pdf)

### 3️⃣ Membuka Rekapitulasi Pesanan & Rekap Packing Gudang
* **Database Pesanan Real**: [daftar_pesanan_agustus_2026.csv](file:///d:/Dokumen/02_Kerja_Profesional/Juragan%20by%20Anak%20Bawang/Manajemen_Pesanan/Database/daftar_pesanan_agustus_2026.csv)
* **Rekap Packing Gudang**: [rekap_packing_gudang.csv](file:///d:/Dokumen/02_Kerja_Profesional/Juragan%20by%20Anak%20Bawang/Manajemen_Pesanan/Database/rekap_packing_gudang.csv)
* **Laporan Packing Markdown**: [rekap_packing_gudang.md](file:///d:/Dokumen/02_Kerja_Profesional/Juragan%20by%20Anak%20Bawang/Manajemen_Pesanan/Laporan_Gudang/rekap_packing_gudang.md)

### 4️⃣ Menjalankan Web Admin Dashboard (React + Vite)
```bash
cd Website
npm run dev
```
Buka browser di **`http://localhost:5173/admin`** untuk melihat dashboard manajemen produk & pesanan.

---

## 📞 Kontak & Legalitas Resmi

* **Admin Official**: +62 821-3373-1213
* **Lokasi Produksi**: Cepogo, Kabupaten Boyolali, Jawa Tengah 57362
* **Sertifikat Halal Resmi**: ID33110018517710724
* **NIB & Izin Edar**: Terdaftar resmi di sistem OSS BKPM
