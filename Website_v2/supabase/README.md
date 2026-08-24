# 🗄️ Supabase Database Architecture & Quick Setup Guide

Panduan resmi pengaturan database **Virgin Dashboard (Master Financial, POS & Inventory OS)**.

---

## ⚡ Setup Cepat Database Baru (3 Langkah)

Jika Anda baru saja meng-clone project ini atau membuat proyek Supabase baru untuk klien, ikuti langkah berikut:

### 1. Buat Proyek di Supabase
1. Buka [Supabase Dashboard](https://supabase.com/dashboard) dan buat project baru.
2. Catat **Project URL** dan **Anon Key** dari menu `Project Settings -> API`.
3. Masukkan ke file `.env` di root project:
   ```env
   VITE_SUPABASE_URL=https://<project-ref>.supabase.co
   VITE_SUPABASE_ANON_KEY=eyJhbGciOiJIUzI1Ni...
   ```

### 2. Eksekusi Master Schema
1. Buka **SQL Editor** di Supabase Dashboard (`https://supabase.com/dashboard/project/<project-ref>/sql/new`).
2. Buka file [`supabase/schema/01_master_full_schema.sql`](file:///d:/Dokumen/02_Kerja_Profesional/Dashboard%20Virgin/supabase/schema/01_master_full_schema.sql).
3. Salin seluruh isinya, tempel ke SQL Editor, lalu klik **Run** (atau `Ctrl + Enter`).
   > File ini otomatis membuat:
   > - Seluruh 19+ tabel inti (Tenants, Profiles, Produk, Pelanggan, Supplier, Penjualan, Pembayaran, Batch FIFO, Deliveries, Payroll, Pengeluaran, Retur, Notifikasi, App Releases).
   > - Trigger otomatis `updated_at`.
   > - Prosedur atomik FIFO `create_sembako_sale_transaction`.
   > - Row Level Security (RLS) policies isolasi multi-tenant yang ketat.
   > - Akun demo bawaan (`dev@sembako.id`, `owner@sembako.id`, `admin@sembako.id`).

### 3. Buat Akun Owner Toko / Klien Baru
1. Buka file [`supabase/seeds/register_user_template.sql`](file:///d:/Dokumen/02_Kerja_Profesional/Dashboard%20Virgin/supabase/seeds/register_user_template.sql).
2. Ubah variabel sesuai data klien:
   ```sql
   v_email := 'owner@namatoko.com';
   v_password := 'PasswordKuat123!';
   v_full_name := 'Nama Pemilik';
   v_business_name := 'Toko Berkah Makmur';
   v_role := 'owner';
   ```
3. Tempel dan jalankan di SQL Editor.

---

## 📁 Struktur Direktori `supabase/`

```text
supabase/
├── README.md                          # 📖 Panduan ini
├── schema/
│   ├── 01_master_full_schema.sql      # ⭐ Master schema lengkap (wajib untuk inisialisasi awal)
│   └── 02_crons_and_automations.sql   # ⏰ Skrip pg_cron untuk notifikasi stok, tagihan server, & rekap closing
├── seeds/
│   ├── register_user_template.sql     # 👤 Template pembuatan user & tenant baru
│   ├── seed_demo_accounts.sql         # 🧪 Data seed akun demo untuk pengujian
│   ├── set_dev_account.sql            # 🛠️ Script konfigurasi akun level developer superadmin
│   └── set_owner_kirekplastik.sql     # 📦 Contoh konfigurasi spesifik tenant klien
└── migrations/                        # 🗄️ Arsip patch & migrasi bertahap (riwayat perubahan)
```

---

## ⏰ Otomatisasi Server (Opsional - `02_crons_and_automations.sql`)

Jika proyek Supabase Anda mendukung ekstensi `pg_cron` (tier Pro atau self-hosted):
Jalankan file [`supabase/schema/02_crons_and_automations.sql`](file:///d:/Dokumen/02_Kerja_Profesional/Dashboard%20Virgin/supabase/schema/02_crons_and_automations.sql) untuk mengaktifkan:
- Peringatan stok minimum & barang expired pukul 07:30 WIB.
- Tagihan server bulanan tanggal 21–28 pukul 09:00 WIB.
- Pengingat piutang nota jatuh tempo pukul 12:00 WIB.
- Rekap penutupan transaksi harian (*daily closing digest*) pukul 20:00 WIB.
