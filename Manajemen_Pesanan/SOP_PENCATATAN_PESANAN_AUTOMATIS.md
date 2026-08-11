# SOP Standard Operating Procedure: Pencatatan Pesanan & Perhitungan Cost Component 3-Level

Dokumen SOP ini adalah panduan standar resmi bagi **AI Agent** dan **Tim Operasional Juragan by Anak Bawang** dalam memproses, menghitung HPP, dan mencatat transaksi penjualan.

---

## 📌 PRINSIP UTAMA PENCATATAN AI AGENT

> ⚠️ **ATURAN MUTLAK MASTER-DRIVEN COSTING & INTERACTIVE CLARIFICATION:**
> 1. **AI Agent DILARANG KERAS menebak, mengarang, atau memasukkan harga nominal komponen secara manual.**
> 2. Seluruh harga HPP Bawang, Pouch, Stiker, Kardus, dan Kartu Ucapan **WAJIB ditarik otomatis dari Master Database** (`juragan_products` / `master_pricelist_sku.csv` / `Packaging Master`).
> 3. **PROTOKOL TANYA-JAWAB INTERAKTIF**: Jika pengguna memberikan perintah yang **belum melengkapi Field Wajib**, AI Agent **WAJIB bertanya secara singkat & ramah** untuk mengonfirmasi sebelum mengeksekusi pencatatan database.

---

## 📋 DAFTAR FIELD WAJIB & SMART DEFAULTS

### 🔴 Field Wajib (Mandatory Fields — Harus Jelas / Ditanyakan AI Agent):
| No | Nama Field | Deskripsi & Contoh | Alasan Wajib |
| :-: | :--- | :--- | :--- |
| 1 | **Nama Pelanggan** | *Contoh: "Farhan", "Pak Didi", "Bu Renny"* | Identifikasi invoice & alamat pengiriman customer |
| 2 | **Varian SKU & Jumlah (Qty)** | *Contoh: "2 pack Murni 250g", "20 pack Crispy 100g"* | Penentuan HPP Bawang, Pouch, & Stiker dari Master DB |
| 3 | **Area Pengiriman** | *Choices: "Solo Raya", "Semarang", "Jakarta / Jabodetabek"* | **Menentukan Acuan Harga Jual** (Harga Solo vs Harga Pusat/Nasional) |
| 4 | **Status Pembayaran** | *Choices: "LUNAS" / "BELUM LUNAS"* | Laporan arus kas & piutang dagang |
| 5 | **Status Pengiriman** | *Choices: "MENUNGGU PENGIRIMAN" / "TERKIRIM"* | Pengelompokan Rekap Packing Gudang & resi |

---

### 🟢 Smart Defaults (Nilai Standar Otomatis — Tidak Wajib Ditanyakan):
| Nama Field | Nilai Standar Default | Kapan Diubah? |
| :--- | :---: | :--- |
| **Sumber Order** | `WHATSAPP` | Kecuali disebutkan "Shopee", "TikTok", "Kanvas Offline" |
| **Kardus Packing** | `Ya` (Rp 3.000 / BOX-M) | Otomatis aktif sesuai standar keamanan packing premium |
| **Kartu Ucapan** | `Tidak` | Diaktifkan (`Ya`) jika pemesan minta ucapan/gift card |
| **Penanggung Ongkir** | `customer` | Diubah ke `business` jika ada promo promo free ongkir usaha |
| **Catatan Khusus** | `-` | Diisi jika ada instruksi khusus (misal: *"Repack Polos Tanpa Stiker"*) |

---

## 💬 PROTOKOL TANYA-JAWAB INTERAKTIF (AI AGENT CLARIFICATION PROTOCOL)

Jika informasi dari pengguna belum memenuhi 5 Field Wajib di atas, AI Agent akan mengajukan **maksimal 2-3 pertanyaan ringkas & to-the-point**.

### 💡 Contoh Skenario 1: Pengguna Mengirimkan Perintah Kurang Lengkap
> **User**: *"Tolong catat pesanan baru: 2 pack Murni 250g"*  
>  
> **AI Agent**:  
> *"Siap Pak! Agar pencatatan di Supabase DB & Rekap Gudang akurat, boleh minta konfirmasi 3 detail berikut?*  
> 1. **Nama Pembeli**: siapa nama pelanggannya, Pak?  
> 2. **Area Pengiriman**: Solo Raya, Semarang, atau Jakarta?  
> 3. **Status Bayar**: Sudah **Lunas** atau **Belum Lunas**?"*  
>  
> **User**: *"Buat Pak Rahmat di Jakarta, sudah Lunas ya"*  
>  
> **AI Agent**: *(Langsung mengeksekusi pencatatan ke Supabase DB & menyajikan Laporan Tree-View)* ✅

---

## 🏗️ ARSITEKTUR 3-LEVEL COST HIERARCHY

Setiap transaksi penjualan dihitung berdasarkan hirarki 3 level berikut:

```text
ORDER
│
├── 1. ITEM LEVEL (Dikalikan dengan Quantity Item: Qty Pack / Unit)
│   ├── PRODUCT_COST   : HPP Bahan Bawang Goreng per SKU
│   ├── PACKAGING_COST : HPP Kemasan Standing Pouch / Bal PE
│   └── LABEL_COST     : HPP Stiker Depan + Stiker Belakang (0 jika Repack Polos)
│
├── 2. SHIPMENT LEVEL (Dikalikan dengan Jumlah Shipment / Pengiriman, BUKAN Qty Item)
│   ├── OUTER_PACKAGING_COST : HPP Kardus Luar Packing (BOX-S / BOX-M / BOX-L)
│   ├── INSERT_COST          : HPP Material Tambahan (Kartu Ucapan / Bubble Wrap)
│   └── SHIPPING_COST        : Ongkir Usaha (HANYA jika shipping_paid_by = business)
│
└── 3. ORDER LEVEL (Finansial Penjualan)
    ├── GROSS_SALES : Total Harga Jual Bruto
    ├── DISCOUNT    : Potongan Harga / Diskon (DIPISAHKAN dari HPP)
    ├── NET_SALES   : Gross Sales - Discount
    ├── OTHER_COST  : Biaya Custom / Tambahan Khusus
    └── PROFIT      : Net Sales - TOTAL_COST
```

---

## 📐 RUMUS PERHITUNGAN AKUNTANSI & MULTIPLIER

### 1. Multiplier Rules
- **Item Level Cost**: $\text{Biaya Komponen Item} \times \text{Quantity Item}$
- **Shipment Level Cost**: $\text{Biaya Komponen Shipment} \times \text{Jumlah Shipment}$

> **Contoh**: Jika pelanggan memesan 2 pack 250g dalam **1 Shipment**:
> - Pouch & Stiker = dikali **2** (Item Level)
> - Kardus & Kartu Ucapan & Ongkir = dikali **1** (Shipment Level)

### 2. Formulasi Omset & Laba Kotor
$$\text{NET\_SALES} = \text{GROSS\_SALES} - \text{DISCOUNT}$$

$$\text{TOTAL\_COST} = \sum \text{ITEM\_COSTS} + \sum \text{SHIPMENT\_COSTS} + \text{OTHER\_COST}$$

$$\text{GROSS\_PROFIT} = \text{NET\_SALES} - \text{TOTAL\_COST}$$

---

## 🗂️ MATRIKS ATURAN KEMASAN & LABEL RIIL (PRODUCT & SHIPMENT RULES)

| Ukuran SKU | Kemasan Utama | Stiker Depan | Stiker Belakang | Kardus Packing | Catatan Operasional Riil |
| :--- | :---: | :---: | :---: | :---: | :--- |
| **100g (Trial)** | 1 Pouch / pack | 1 Pcs / pack | 1 Pcs / pack | **STANDAR DEFAULT** | Menjaga produk tidak penyet saat pengiriman |
| **150g & 200g** | 1 Pouch / pack | 1 Pcs / pack | 1 Pcs / pack | **STANDAR DEFAULT** | Menjaga produk tidak penyet saat pengiriman |
| **250g (Hero SKU)** | 1 Pouch / pack | 1 Pcs / pack | 1 Pcs / pack | **STANDAR DEFAULT** | Menjaga produk tidak penyet saat pengiriman |
| **1 kg (Bal PE / Bulk)** | 1 Plastik Bal PE | **0 (Hemat Label)** | 1 Pcs / pack | **STANDAR DEFAULT** | **Otomatis 1x Kardus per Shipment** (muat s/d 3 kg) |

---

## 🤖 ALUR KERJA AUTOMASI AI AGENT

Ketika pengguna memberikan perintah pencatatan pesanan:

1. **Evaluasi Field Wajib**: AI Agent memeriksa apakah 5 Field Wajib (`Nama Pelanggan`, `SKU & Qty`, `Area`, `Status Bayar`, `Status Kirim`) sudah terpenuhi.
2. **Klarifikasi Interaktif** *(jika belum lengkap)*: Bertanya 1-3 pertanyaan singkat ke pengguna.
3. **Lookup Master Data**: Mengambil HPP Bawang, Kemasan Pouch, Stiker, dan Kardus dari Database Master (`master_pricelist_sku.csv` / Supabase `juragan_products`).
4. **Kalkulasi 3-Level HPP**: Menghitung Item Cost, Shipment Cost, Net Sales, & Gross Profit.
5. **Eksekusi Supabase Cloud DB**: Meng-insert data ke `juragan_sales` & `juragan_sale_items`.
6. **Trigger Realtime & Backup**:
   - ⚡ Dashboard Web & Rekap Gudang Real-Time ter-update instan via Supabase.
   - 📊 CSV Backup `daftar_pesanan_agustus_2026.csv` & `rekap_packing_gudang.md` ter-update.
   - ☁️ Google Drive auto-sync ter-trigger.

---

## 🌳 FORMAT BALASAN LAPORAN TREE-VIEW AI AGENT

```text
✅ PESANAN BERHASIL DICATAT & DISINKRONKAN!

Customer : [Nama Pelanggan]
Area     : [Area Pengiriman]
Status   : [Lunas / Belum Lunas] | [Terkirim / Menunggu Pengiriman]

ITEM LEVEL (HPP Master Driven)
├── [SKU Name] × [Qty]
│   ├── HPP Bawang      : Rp xx.xxx
│   ├── Pouch Kemasan   : Rp x.xxx
│   ├── Stiker Depan    : Rp x.xxx
│   └── Stiker Belakang : Rp x.xxx

SHIPMENT LEVEL (1 Shipment)
├── Kardus Luar Packing : Rp x.xxx (BOX-M)
├── Kartu Ucapan        : Rp x.xxx
└── Ongkir (Ditanggung) : Rp xx.xxx

FINANSIAL TRANSAKSI
├── Gross Sales         : Rp xx.xxx
├── Diskon              : Rp x.xxx
├── Net Sales           : Rp xx.xxx
├── TOTAL HPP PESANAN   : Rp xx.xxx
└── LABA KOTOR PESANAN  : Rp xx.xxx (Margin xx.x%)

BERKAS & DATABASE:
✓ Supabase Cloud DB juragan_sales & juragan_sale_items updated (REAL-TIME LIVE ⚡)
✓ Master Stock SKU [SKU Code] berkurang [Qty] Pack
✓ File Backup CSV daftar_pesanan_agustus_2026.csv updated
```
