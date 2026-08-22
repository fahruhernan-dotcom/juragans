---
name: juragan-invoice-generator
description: "Use when creating, modifying, recalculating, or generating customer sales invoices (PDF and Markdown) and recording orders for Juragan by Anak Bawang. Enforces strict regional pricing (Solo Raya vs Jakarta/Semarang), mandatory interactive clarification of missing fields (including extra packaging/kardus), and 1-step CSV-driven automated logging."
category: business-operations
metadata:
  triggers: juragan invoice, buat invoice, catat pesanan juragan, generate customer invoices, harga solo, harga jkt, invoice juragan
---

# Juragan Invoice & Order Generator Skill

Skill resmi untuk memproses pencatatan pesanan, validasi data transaksi, perhitungan HPP & regional pricing, serta pembuatan invoice pelanggan (PDF & Markdown) untuk **Juragan by Anak Bawang** berbasis arsitektur **CSV-Driven (Single Source of Truth)**.

---

## 🛑 PROTOKOL TANYA-JAWAB INTERAKTIF (MANDATORY CLARIFICATION)

> ⚠️ **ATURAN MUTLAK**: Jika instruksi pesanan belum lengkap, AI Agent **DILARANG MENEBAK** dan **WAJIB BERTANYA** secara ringkas & ramah sebelum mengeksekusi script generator.

### 📋 6 Field Wajib yang Harus Terpenuhi:
| No | Field Wajib | Opsi / Contoh | Alasan Wajib |
| :-: | :--- | :--- | :--- |
| 1 | **Nama Pelanggan** | *"Mamah Didi", "Tante Dewi", "Ratukhandayu", "Dona"* | Identifikasi faktur invoice |
| 2 | **Varian & Qty** | *"10 pack Grade S 100g", "1 kg Grade A Bal PE"* | Penentuan SKU, HPP, & deskripsi produk |
| 3 | **Area Pengiriman** | `Solo Raya` (Lokal) vs `Jakarta / Semarang / Luar Kota` | **Menentukan acuan harga jual resmi** |
| 4 | **📦 Kemasan Tambahan** | **Kardus Box-M (+Rp 3.000)**, **Kartu Ucapan**, atau **Packing Standar** | **Kalkulasi biaya packing & HPP** |
| 5 | **Status Pembayaran** | `LUNAS` / `BELUM LUNAS` | Status badge & tagihan invoice |
| 6 | **Status Kirim & Ongkir** | `Terkirim` / `Menunggu Pengiriman` + Nominal Ongkir | Akumulasi total tagihan |

### 💬 Contoh Respon Klarifikasi Wajib AI:
> *"Siap! Agar invoice dan pencatatan presisi, mohon konfirmasi detail pesanan berikut:*
> 1. *Area Pengiriman: **Solo Raya** (harga lokal) atau **Jakarta/Luar Kota**?*
> 2. *Kemasan Tambahan: Apakah menggunakan **Kardus Box-M (Rp 3.000)**, **Kartu Ucapan**, atau **Packing Standar**?*
> 3. *Status Pembayaran: Sudah **Lunas** atau **Belum Lunas**?*
> 4. *Status Pengiriman & Ongkir: Sudah **Terkirim** atau **Menunggu Kirim**? Berapa nominal ongkirnya?"*

---

## 🧅 SPESIFIKASI VARIAN & LABEL RESMI

> ⚠️ **DILARANG TERTUKAR/DITAMBAH-TAMBAHKAN:**
> - **Grade S Murni**: `100% Bawang Merah Boyolali Murni (Tanpa Tepung)` — Bawang merah Boyolali murni 100% tanpa tepung.
> - **Grade A Crispy**: `Renyah Gurih Mantap (Tepung Tipis 5%)` — Bawang merah Boyolali dengan balutan tepung 5% ekstra renyah.

---

## 🏷️ ACUAN HARGA RESMI (CLEAN PRICELISTS)

### 1. Pasar Solo Raya (Lokal) — Acuan: `pricelist_solo_raya_clean.pdf`
* **Grade S Murni (Tanpa Tepung)**:
  - 100g Trial Pack : **Rp 22.000**
  - 150g Pouch      : **Rp 26.000**
  - 200g Pouch      : **Rp 34.500**
  - 250g Hero SKU   : **Rp 40.000** (atau Rp 39.500)
  - 1.000g (1 kg Bal PE): **Rp 152.000** (atau Rp 156.000)
* **Grade A Crispy (Tepung 5%)**:
  - 100g Trial Pack : **Rp 19.000**
  - 150g Pouch      : **Rp 25.000**
  - 200g Pouch      : **Rp 31.000**
  - 250g Hero SKU   : **Rp 35.000** (atau Rp 37.500)
  - 1.000g (1 kg Bal PE): **Rp 136.000** (atau Rp 125.000)

### 2. Pasar Jakarta & Semarang (Luar Kota) — Acuan: `pricelist_jakarta_semarang_clean.pdf`
* **Grade S Murni (Tanpa Tepung)**:
  - 100g Trial Pack : **Rp 23.500**
  - 150g Pouch      : **Rp 26.500** (atau Rp 31.000)
  - 200g Pouch      : **Rp 37.500** (atau Rp 36.500)
  - 250g Hero SKU   : **Rp 43.500**
  - 1.000g (1 kg Bal PE): **Rp 165.500**
* **Grade A Crispy (Tepung 5%)**:
  - 100g Trial Pack : **Rp 20.500**
  - 150g Pouch      : **Rp 26.500** (atau Rp 28.000)
  - 200g Pouch      : **Rp 31.500** (atau Rp 32.500)
  - 250g Hero SKU   : **Rp 37.500** / **Rp 39.500**
  - 1.000g (1 kg Bal PE): **Rp 146.000** (atau Rp 135.500)

---

## ⚡ ALUR EKSEKUSI 1-STEP (SUPER CEPAT & EFISIEN)

Ketika data sudah lengkap, AI **cukup menjalankan 1 perintah CLI**:

```bash
python "Manajemen_Pesanan/Scripts/generate_customer_invoices.py" --add \
  --customer "Nama Pelanggan" \
  --items "Trial Pack Murni 100g x2; Grade A 250g x1" \
  --area "Solo Raya" \
  --kardus "Ya" \
  --kartu "Tidak" \
  --status "Lunas" \
  --delivery "Terkirim" \
  --shipping 0 \
  --notes "Harga Resmi Solo Raya"
```

### Yang Otomatis Terjadi dalam 1 Detik:
1. Menghitung HPP Bawang, biaya kardus, total omset, profit netto, dan persentase margin.
2. Otomatis menambahkan baris transaksi ke `Manajemen_Pesanan/Database/daftar_pesanan_agustus_2026.csv`.
3. Otomatis men-generate file PDF & Markdown di `Manajemen_Pesanan/invoices_pelanggan/`.
4. Kode python **tetap ramping (~300 baris)** dan tidak akan pernah membengkak lagi.

---

## 🔄 MODE BULK REGENERATE (SINKRONISASI MASSAL)
Jika database CSV diedit manual lewat Excel / Text Editor, cukup jalankan:
```bash
python "Manajemen_Pesanan/Scripts/generate_customer_invoices.py"
```
Seluruh invoice pelanggan akan di-compile ulang secara dinamis membaca data CSV terbaru.
