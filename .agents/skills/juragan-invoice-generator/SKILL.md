---
name: juragan-invoice-generator
description: "Use when creating, modifying, recalculating, or generating sales invoices (PDF and Markdown) and recording customer orders for Juragan by Anak Bawang. Enforces strict regional pricing (Solo Raya vs Jakarta/Semarang), mandatory interactive clarification of missing fields, and exact product descriptions."
category: business-operations
metadata:
  triggers: juragan invoice, buat invoice, catat pesanan juragan, generate customer invoices, harga solo, harga jkt, invoice juragan
---

# Juragan Invoice & Order Generator Skill

Skill resmi untuk memproses pencatatan pesanan, validasi data transaksi, perhitungan HPP & regional pricing, serta pembuatan invoice pelanggan (PDF & Markdown) untuk **Juragan by Anak Bawang**.

---

## 🛑 PROTOKOL TANYA-JAWAB INTERAKTIF (MANDATORY CLARIFICATION)

> ⚠️ **ATURAN MUTLAK**: Jika pengguna memberikan instruksi pesanan yang **belum melengkapi 5 Field Wajib**, AI Agent **DILARANG MENEBAK** dan **WAJIB BERTANYA** secara ringkas & ramah sebelum mengeksekusi script generator.

### 📋 5 Field Wajib:
| No | Field | Opsi / Contoh | Alasan Wajib |
| :-: | :--- | :--- | :--- |
| 1 | **Nama Pelanggan** | *"Mamah Didi", "Tante Dewi", "Ratukhandayu"* | Identifikasi faktur invoice & alamat kirim |
| 2 | **Varian & Qty** | *"10 pack Grade S 100g", "2 pack Grade A 250g"* | Penentuan SKU, HPP, & deskripsi produk |
| 3 | **Area Pengiriman** | `Solo Raya` vs `Jakarta / Semarang / Luar Kota` | **Menentukan acuan harga jual resmi** |
| 4 | **Status Bayar** | `LUNAS` / `BELUM LUNAS` | Status badge & tagihan invoice |
| 5 | **Status Kirim** | `TERKIRIM` / `MENUNGGU PENGIRIMAN` | Status tracking operasional |
| 6 | **Ongkir** | `Rp 0` (Bebas ongkir Solo) / Nominal ongkir luar kota | Total akumulasi tagihan akhir |

### 💬 Contoh Respon Klarifikasi Singkat:
> *"Siap! Agar invoice dan pencatatan presisi, mohon konfirmasi 2 detail berikut:*
> 1. *Area pengiriman: **Solo Raya** (harga lokal) atau **Jakarta/Luar Kota**?*
> 2. *Status pembayaran: Sudah **Lunas** atau **Belum Lunas**?*
> 3. *Apakah ada ongkos kirim tambahan yang ingin dicantumkan di invoice?"*

---

## 🧅 SPESIFIKASI VARIAN & LABEL RESMI

> ⚠️ **DILARANG TERTUKAR/DITAMBAH-TAMBAHKAN:**
> - **Grade S Murni**: `100% Bawang Merah Boyolali Murni (Tanpa Tepung)` — Bawang merah Boyolali murni 100% tanpa tepung.
> - **Grade A Crispy**: `Renyah Gurih Mantap (Tepung Tipis 5%)` — Bawang merah Boyolali dengan balutan tepung 5% ekstra renyah.

---

## 🏷️ ACUAN HARGA RESMI (CLEAN PRICELISTS)

Sumber acuan tabel harga lengkap tersimpan pada [pricing_matrix.md](references/pricing_matrix.md).

### 1. Pasar Solo Raya (Lokal) — Acuan: `pricelist_solo_raya_clean.pdf`
* **Grade S Murni (Tanpa Tepung)**:
  - 100g Trial Pack : **Rp 22.000**
  - 150g Pouch      : **Rp 29.000** (atau Rp 26.000)
  - 200g Pouch      : **Rp 34.500**
  - 250g Hero SKU   : **Rp 39.500** (atau Rp 40.000)
  - 1.000g (1 kg Bal PE): **Rp 156.000** (atau Rp 152.000)
* **Grade A Crispy (Tepung 5%)**:
  - 100g Trial Pack : **Rp 19.000**
  - 150g Pouch      : **Rp 25.500** (atau Rp 25.000)
  - 200g Pouch      : **Rp 30.500** (atau Rp 31.000)
  - 250g Hero SKU   : **Rp 37.500** (atau Rp 35.000)
  - 1.000g (1 kg Bal PE): **Rp 136.000** (atau Rp 125.000)

### 2. Pasar Jakarta & Semarang (Luar Kota) — Acuan: `pricelist_jakarta_semarang_clean.pdf`
* **Grade S Murni (Tanpa Tepung)**:
  - 100g Trial Pack : **Rp 23.500**
  - 150g Pouch      : **Rp 31.000** (atau Rp 26.500)
  - 200g Pouch      : **Rp 36.500** (atau Rp 37.500)
  - 250g Hero SKU   : **Rp 43.500**
  - 1.000g (1 kg Bal PE): **Rp 165.500**
* **Grade A Crispy (Tepung 5%)**:
  - 100g Trial Pack : **Rp 20.500**
  - 150g Pouch      : **Rp 28.000** (atau Rp 26.500)
  - 200g Pouch      : **Rp 32.500** (atau Rp 31.500)
  - 250g Hero SKU   : **Rp 37.500** / **Rp 39.500**
  - 1.000g (1 kg Bal PE): **Rp 146.000** (atau Rp 135.500)

---

## 📂 BERKAS & DIREKTORI KERJA

* **Generator Script**: `Manajemen_Pesanan/Scripts/generate_customer_invoices.py`
* **Database CSV**: `Manajemen_Pesanan/Database/daftar_pesanan_agustus_2026.csv`
* **Output Invoices (PDF & MD)**: `Manajemen_Pesanan/invoices_pelanggan/`
  - Pola berkas: `invoice_<slug>_agustus_2026.pdf` dan `invoice_<slug>_agustus_2026.md`

---

## 🔄 ALUR EKSEKUSI PEMBUATAN INVOICE BARU

1. **Pastikan 5 Field Wajib Lengkap** (Lakukan tanya-jawab jika belum lengkap).
2. **Tentukan Nomor Invoice Baru** (Cek urutan terakhir, contoh `INV/2026/08/018`).
3. **Tambahkan Entri Pesanan ke `generate_customer_invoices.py`**:
   ```python
   # Single item order:
   {
       "no": 17,
       "inv_no": "INV/2026/08/018",
       "date": "2026-08-22",
       "date_fmt": "22 Agustus 2026",
       "customer": "Nama Pelanggan",
       "variant": "Grade A Crispy", # Atau "Grade S Murni"
       "size": "250g",
       "packs": 2,
       "weight_kg": 0.50,
       "price_per_pack": 37500,
       "total_price": 75000,
       "shipping_fee": 10000,
       "payment_status": "Lunas",
       "delivery_status": "Terkirim",
       "notes": "Harga Resmi Jakarta (2 pack @ Rp 37.500 + Ongkir Rp 10.000)",
       "file_slug": "nama_pelanggan"
   }
   ```
   *Catatan: Gunakan key `"items"` jika pesanan terdiri dari beberapa varian/ukuran berbeda.*

4. **Tambahkan Baris Transaksi ke CSV `daftar_pesanan_agustus_2026.csv`**:
   Cantumkan tanggal, invoice, nama, area, ringkasan item, berat, omset bruto/bersih, HPP bawang, biaya kardus (Rp 3.000), HPP total, profit netto, margin %, status bayar & kirim.

5. **Eksekusi Generator Script**:
   ```bash
   python "Manajemen_Pesanan/Scripts/generate_customer_invoices.py"
   ```

6. **Laporkan ke Pengguna**:
   Sajikan ringkasan rincian item, shipment, omset, HPP, laba kotor, serta tautan berkas PDF dan Markdown yang telah dibuat.
