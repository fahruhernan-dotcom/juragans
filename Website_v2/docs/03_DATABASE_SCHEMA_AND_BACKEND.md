# 🗄️ Database Schema, Backend RPC & Automasi Cron
## Virgin Master Dashboard — Core Financial, POS & Inventory OS

> Dokumen ini menyajikan arsitektur lengkap backend PostgreSQL Supabase, kamus data seluruh tabel (18+ tabel), fungsi RPC atomik, kebijakan keamanan Row-Level Security (RLS), trigger realtime, serta otomatisasi penjadwalan `pg_cron`.

---

## 📑 Daftar Isi
1. [Arsitektur Database & Multi-Tenancy](#1-arsitektur-database--multi-tenancy)
2. [Kamus Data Tabel Inti (Data Dictionary)](#2-kamus-data-tabel-inti-data-dictionary)
3. [Keamanan Row-Level Security (RLS) & Helper `has_tenant_access`](#3-keamanan-row-level-security-rls--helper-has_tenant_access)
4. [Fungsi Atomik RPC: `create_sembako_sale_transaction`](#4-fungsi-atomik-rpc-create_sembako_sale_transaction)
5. [Infrastruktur Notifikasi & Device Tokens (FCM)](#5-infrastruktur-notifikasi--device-tokens-fcm)
6. [Penjadwalan Otomatis Background (`pg_cron`)](#6-penjadwalan-otomatis-background-pg_cron)
7. [Panduan Urutan Eksekusi Skrip Migrasi SQL](#7-panduan-urutan-eksekusi-skrip-migrasi-sql)

---

## 1. Arsitektur Database & Multi-Tenancy

Sistem menggunakan **PostgreSQL 15+** yang di-host pada cloud database Supabase dengan pola **Shared Database, Shared Schema, Row-Level Tenant Isolation**:

```
                       ┌─────────────────────────────────────┐
                       │          auth.users (JWT)           │
                       └──────────────────┬──────────────────┘
                                          │ 1:1
                                          ▼
                       ┌─────────────────────────────────────┐
                       │          public.profiles            │
                       └──────────────────┬──────────────────┘
                                          │ N:1
                                          ▼
                       ┌─────────────────────────────────────┐
                       │          public.tenants             │
                       │ (UUID, business_name, plan, status) │
                       └──────────────────┬──────────────────┘
                                          │ (tenant_id)
        ┌───────────────────┬─────────────┼─────────────┬───────────────────┐
        ▼                   ▼             ▼             ▼                   ▼
┌──────────────┐    ┌──────────────┐┌───────────┐ ┌──────────────┐   ┌──────────────┐
│sembako_      │    │sembako_      ││sembako_   │ │sembako_      │   │sembako_      │
│products      │    │stock_batches ││sales      │ │customers     │   │suppliers     │
└───────┬──────┘    └───────┬──────┘└─────┬─────┘ └──────────────┘   └──────────────┘
        │                   │             │
        └─────────────┬─────┴─────────────┘
                      ▼
        ┌──────────────────────────┐
        │    sembako_stock_out     │
        │ (Atomic FIFO Deductions) │
        └──────────────────────────┘
```

- Setiap entitas bisnis memiliki `tenant_id` bertipe `UUID`.
- Akses data dibatasi ketat melalui PostgreSQL **Row-Level Security (RLS)** sehingga tidak ada data yang bocor antar penyewa (*zero cross-tenant data leakage*).

---

## 2. Kamus Data Tabel Inti (Data Dictionary)

### 2.1 Modul Tenant & Pengguna

#### Tabel: `tenants`
Menyimpan identitas organisasi distributor/grosir.
| Kolom | Tipe Data | Keterangan |
| :--- | :--- | :--- |
| `id` | `UUID (PK)` | Identifier unik tenant (`uuid_generate_v4()`). |
| `business_name` | `TEXT` | Nama resmi usaha/distributor (contoh: *Toko Makmur Sejahtera*). |
| `business_vertical` | `TEXT` | Default: `'distributor_sembako'`. |
| `user_type` | `TEXT` | Default: `'broker'`. |
| `owner_id` | `UUID` | ID pengguna pemilik akun utama. |
| `plan` | `TEXT` | Paket langganan: `'starter'`, `'pro'`, `'enterprise'`. |
| `province` | `TEXT` | Provinsi operasional bisnis. |
| `created_at` | `TIMESTAMPTZ` | Waktu pendaftaran organisasi. |

#### Tabel: `profiles`
Profil pengguna yang terhubung ke Supabase Auth (`auth.users`).
| Kolom | Tipe Data | Keterangan |
| :--- | :--- | :--- |
| `id` | `UUID (PK)` | ID profil pengguna. |
| `auth_user_id` | `UUID` | Relasi ke `auth.users.id`. |
| `tenant_id` | `UUID (FK)` | Relasi ke `tenants.id` (ON DELETE CASCADE). |
| `full_name` | `TEXT` | Nama lengkap staf/pemilik. |
| `email` | `TEXT` | Alamat email login. |
| `phone` | `TEXT` | Nomor WhatsApp pengguna. |
| `role` | `TEXT` | Role hak akses: `'dev'`, `'owner'`, `'admin'`, `'staff'`, `'gudang'`, `'driver'`. |
| `onboarded` | `BOOLEAN` | Status penyelesaian checklist orientasi awal. |

#### Tabel: `tenant_memberships` & `team_invitations`
Mengelola kolaborasi multi-user dalam 1 tenant dan pengiriman undangan tim via email token.

---

### 2.2 Modul Katalog & Pergudangan

#### Tabel: `sembako_products`
Master katalog barang sembako.
| Kolom | Tipe Data | Keterangan |
| :--- | :--- | :--- |
| `id` | `UUID (PK)` | ID unik produk. |
| `tenant_id` | `UUID (FK)` | Relasi tenant. |
| `sku` | `TEXT` | Kode SKU / Barcode produk. |
| `product_name` | `TEXT` | Nama komoditas/barang. |
| `category` | `TEXT` | Kategori (`makanan`, `minuman`, `sembako`, `farmasi`, `material`, `lainnya`). |
| `unit` | `TEXT` | Satuan utama basis stok (`karton`, `dus`, `bal`, `pak`, `kg`, `pcs`). |
| `current_stock` | `NUMERIC(15,2)` | Sisa stok fisik saat ini di gudang. |
| `min_stock_alert` | `NUMERIC(15,2)` | Batas minimal untuk memicu peringatan stok tipis. |
| `avg_buy_price` | `NUMERIC(15,2)` | Harga beli modal rata-rata terbobot (Weighted Average COGS). |
| `sell_price` | `NUMERIC(15,2)` | Harga jual eceran standar. |
| `is_active` | `BOOLEAN` | Status aktif katalog (default: `true`). |
| `is_deleted` | `BOOLEAN` | Soft-delete flag (default: `false`). |

#### Tabel: `sembako_stock_batches`
Pelacakan inventaris berbasis batch FIFO untuk menjaga akurasi HPP & tanggal kadaluarsa.
| Kolom | Tipe Data | Keterangan |
| :--- | :--- | :--- |
| `id` | `UUID (PK)` | ID unik batch stok masuk. |
| `tenant_id` | `UUID (FK)` | Relasi tenant. |
| `product_id` | `UUID (FK)` | Relasi ke `sembako_products.id`. |
| `supplier_id` | `UUID (FK)` | Relasi ke `sembako_suppliers.id`. |
| `batch_code` | `TEXT` | Nomor batch / kode faktur pembelian supplier. |
| `qty_awal` | `NUMERIC(15,2)` | Jumlah kuantitas awal saat barang diterima. |
| `qty_sisa` | `NUMERIC(15,2)` | Sisa fisik barang pada batch ini yang belum terjual. |
| `buy_price` | `NUMERIC(15,2)` | Harga beli per unit pada batch ini. |
| `total_cost` | `NUMERIC(15,2)` | Total modal pengadaan batch (`qty_awal * buy_price`). |
| `purchase_date` | `TIMESTAMPTZ` | Tanggal penerimaan barang. |
| `expiry_date` | `TIMESTAMPTZ` | Tanggal kadaluarsa (*Expired Date*). |

#### Tabel: `sembako_stock_out`
Catatan mutasi setiap unit barang yang keluar dari gudang (audit log pengurangan stok).
| Kolom | Tipe Data | Keterangan |
| :--- | :--- | :--- |
| `id` | `UUID (PK)` | ID catatan stok keluar. |
| `sale_id` | `UUID (FK)` | Relasi ke faktur penjualan (jika karena transaksi jual). |
| `product_id` | `UUID (FK)` | Relasi produk. |
| `batch_id` | `UUID (FK)` | Relasi batch stok spesifik yang dipotong. |
| `qty_keluar` | `NUMERIC(15,2)` | Jumlah unit yang dikeluarkan. |
| `buy_price` | `NUMERIC(15,2)` | Harga modal batch yang dipotong (untuk real COGS). |
| `reason` | `TEXT` | Alasan keluar: `'sale'`, `'opname_loss'`, `'damaged'`, `'expired'`. |

---

### 2.3 Modul Penjualan, Kasir & Piutang

#### Tabel: `sembako_sales`
Master faktur penjualan dan status pembayaran.
| Kolom | Tipe Data | Keterangan |
| :--- | :--- | :--- |
| `id` | `UUID (PK)` | ID faktur penjualan. |
| `tenant_id` | `UUID (FK)` | Relasi tenant. |
| `customer_id` | `UUID (FK)` | Relasi ke `sembako_customers.id` (bisa NULL untuk walk-in). |
| `customer_name` | `TEXT` | Nama pelanggan / toko mitra. |
| `invoice_number` | `TEXT` | Nomor seri faktur resmi (contoh: `SMB-20260814-A1B2`). |
| `transaction_date` | `TIMESTAMPTZ` | Tanggal & waktu transaksi. |
| `due_date` | `TIMESTAMPTZ` | Batas tanggal jatuh tempo pembayaran (jika tempo/piutang). |
| `total_amount` | `NUMERIC(15,2)` | Total nilai kotor belanja pelanggan. |
| `total_cogs` | `NUMERIC(15,2)` | Total HPP aktual faktur dari pemotongan batch FIFO. |
| `delivery_cost` | `NUMERIC(15,2)` | Biaya pengiriman / ongkir yang dibebankan. |
| `other_cost` | `NUMERIC(15,2)` | Biaya lain-lain / packing. |
| `net_profit` | `NUMERIC(15,2)` | **Laba Bersih Faktur** (`total_amount - total_cogs - delivery_cost`). |
| `paid_amount` | `NUMERIC(15,2)` | Total uang yang telah dibayarkan pelanggan (Cash + DP + Cicilan). |
| `remaining_amount` | `NUMERIC(15,2)` | **Sisa Piutang** (`total_amount - paid_amount`). |
| `payment_status` | `TEXT` | Status pelunasan: `'lunas'`, `'belum_lunas'`, `'sebagian'`. |

#### Tabel: `sembako_sale_items`
Rincian item barang di dalam faktur penjualan.
| Kolom | Tipe Data | Keterangan |
| :--- | :--- | :--- |
| `id` | `UUID (PK)` | ID rincian item. |
| `sale_id` | `UUID (FK)` | Relasi ke `sembako_sales.id`. |
| `product_id` | `UUID (FK)` | Relasi produk. |
| `product_name` | `TEXT` | Snapshot nama produk saat transaksi. |
| `unit` | `TEXT` | Satuan yang dijual (`dus`, `sak`, `pcs`). |
| `quantity` | `NUMERIC(15,2)` | Jumlah yang dibeli. |
| `price_per_unit` | `NUMERIC(15,2)` | Harga jual per unit yang disepakati. |
| `subtotal` | `NUMERIC(15,2)` | Total harga item (`quantity * price_per_unit`). |
| `cogs_per_unit` | `NUMERIC(15,2)` | Rata-rata HPP modal unit dari batch yang terpotong. |
| `cogs_total` | `NUMERIC(15,2)` | Total modal item (`quantity * cogs_per_unit`). |

#### Tabel: `sembako_payments`
Catatan riwayat cicilan atau pelunasan faktur piutang pelanggan.
| Kolom | Tipe Data | Keterangan |
| :--- | :--- | :--- |
| `id` | `UUID (PK)` | ID pembayaran. |
| `sale_id` | `UUID (FK)` | Relasi faktur penjualan yang dicicil. |
| `customer_id` | `UUID (FK)` | Relasi toko pelanggan. |
| `amount` | `NUMERIC(15,2)` | Nominal cicilan uang yang disetor. |
| `payment_date` | `TIMESTAMPTZ` | Waktu setoran diterima kasir. |
| `payment_method` | `TEXT` | Metode bayar: `'cash'`, `'transfer'`, `'giro'`. |
| `reference_number` | `TEXT` | Nomor bukti transfer / nomor warkat giro. |

---

### 2.4 Modul Mitra CRM (Customer & Supplier)

#### Tabel: `sembako_customers`
Data pelanggan toko kelontong, warung mitra, dan agen.
| Kolom | Tipe Data | Keterangan |
| :--- | :--- | :--- |
| `id` | `UUID (PK)` | ID pelanggan. |
| `tenant_id` | `UUID (FK)` | Relasi tenant. |
| `customer_name` | `TEXT` | Nama toko / nama pemilik (contoh: *Warung Bu Siti*). |
| `customer_type` | `TEXT` | Tipe: `'warung'`, `'agen'`, `'grosir'`, `'retail'`. |
| `phone` | `TEXT` | Nomor WhatsApp untuk kirim nota & reminder tagihan. |
| `address` | `TEXT` | Alamat pengiriman barang. |
| `area` | `TEXT` | Wilayah rute kurir (contoh: *Rute Wilayah Utara, Rute Wilayah Selatan*). |
| `payment_terms` | `TEXT` | Kebiasaan bayar: `'cash'`, `'tempo_7_hari'`, `'tempo_14_hari'`, `'tempo_30_hari'`. |
| `credit_limit` | `NUMERIC(15,2)` | Batas maksimal total plafon piutang yang diizinkan. |
| `reliability_score` | `NUMERIC(15,2)` | Skor kelancaran pembayaran (0 - 100). |

#### Tabel: `sembako_suppliers` & `sembako_supplier_payments`
Direktori pemasok/principal, katalog harga beli, dan pencatatan riwayat pelunasan hutang dagang distributor.

---

### 2.5 Modul Logistik, Retur, SDM & Beban

- **`sembako_deliveries`**: Penugasan kurir, nama supir, plat nomor kendaraan, biaya operasional jalan, status pengiriman (`pending`, `in_transit`, `delivered`), dan foto bukti serah terima (POD).
- **`sembako_returns`**: Data klaim pengembalian barang cacat/expired dari pelanggan atau ke supplier, serta metode penyelesaiannya (*tukar stok, potong piutang, refund tunai*).
- **`sembako_employees` & `sembako_payroll`**: Master staf toko, rincian gaji pokok, tunjangan kehadiran, insentif rit driver, potongan kasbon, dan slip gaji.
- **`sembako_expenses`**: Beban pengeluaran operasional toko (listrik, bensin, sewa ruko, ATK, pemeliharaan armada) untuk perhitungan laba bersih di laporan P&L.
- **`sembako_audit_logs`**: Log rekaman audit setiap mutasi kuantitas stok atau perubahan konfigurasi penting.

---

## 3. Keamanan Row-Level Security (RLS) & Helper `has_tenant_access`

Seluruh tabel database diisolasi menggunakan fungsi helper PostgreSQL berekstensi `SECURITY DEFINER`:

```sql
CREATE OR REPLACE FUNCTION public.has_tenant_access(target_tenant_id UUID)
RETURNS BOOLEAN AS $$
BEGIN
  -- 1. Izinkan demo tenant fallback jika mode demo
  IF target_tenant_id = '00000000-0000-0000-0000-000000000002'::UUID THEN
    RETURN TRUE;
  END IF;

  -- 2. Tolak jika user tidak terautentikasi
  IF auth.uid() IS NULL THEN
    RETURN FALSE;
  END IF;

  -- 3. Izinkan jika user adalah Superadmin / Developer
  IF COALESCE((auth.jwt() -> 'app_metadata' ->> 'is_superadmin')::boolean, false) = true THEN
    RETURN TRUE;
  END IF;

  -- 4. Verifikasi kepemilikan tenant di profiles atau tenant_memberships
  RETURN EXISTS (
    SELECT 1 FROM public.profiles
    WHERE auth_user_id = auth.uid() AND tenant_id = target_tenant_id
  ) OR EXISTS (
    SELECT 1 FROM public.tenant_memberships
    WHERE auth_user_id = auth.uid() AND tenant_id = target_tenant_id
  ) OR EXISTS (
    SELECT 1 FROM public.tenants
    WHERE owner_id = auth.uid() AND id = target_tenant_id
  );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER STABLE SET search_path = public, pg_temp;
```

Semua operasi `SELECT`, `INSERT`, `UPDATE`, dan `DELETE` diatur oleh kebijakan seragam:
```sql
CREATE POLICY "Tenant Isolation Policy for sembako_products" ON sembako_products 
FOR ALL USING (has_tenant_access(tenant_id)) WITH CHECK (has_tenant_access(tenant_id));
```

---

## 4. Fungsi Atomik RPC: `create_sembako_sale_transaction`

Untuk mencegah *race condition*, selisih stok, dan *overselling* saat beberapa kasir bertransaksi bersamaan, pembuatan faktur penjualan dieksekusi secara atomik di level database:

```sql
CREATE OR REPLACE FUNCTION public.create_sembako_sale_transaction(
    p_tenant_id UUID,
    p_customer_id UUID,
    p_customer_name TEXT,
    p_transaction_date TIMESTAMPTZ,
    p_due_date TIMESTAMPTZ,
    p_delivery_cost NUMERIC,
    p_other_cost NUMERIC,
    p_notes TEXT,
    p_items JSONB
)
RETURNS JSONB AS $$
...
```

### Mekanisme Eksekusi:
1. **Verifikasi Hak Akses Tenant**: Memeriksa apakah `auth.uid()` memiliki izin pada `p_tenant_id`.
2. **Kunci Baris Batch (`FOR UPDATE`)**: Mengunci baris `sembako_stock_batches` yang memiliki sisa stok (`qty_sisa > 0`) pada produk bersangkutan agar tidak dapat dimodifikasi oleh transaksi paralel lain hingga transaksi ini selesai.
3. **Iterasi Pemotongan FIFO**: Memotong stok dari batch dengan tanggal kadaluarsa/pembelian tertua lebih dahulu.
4. **Kalkulasi HPP Bersih Real-Time**: Mengakumulasi modal riil unit dari masing-masing batch yang terpotong ke `total_cogs` dan menghitung laba bersih `net_profit`.
5. **Pencatatan Atomik**: Menyimpan faktur ke `sembako_sales`, rincian ke `sembako_sale_items`, pemotongan ke `sembako_stock_out`, serta memperbarui `current_stock` master produk dalam **1 transaksi ACID tunggal**.

---

## 5. Infrastruktur Notifikasi & Device Tokens (FCM)

Sistem dilengkapi skema pengiriman notifikasi terpusat untuk lonceng in-app dan Firebase Cloud Messaging (FCM) pada aplikasi Android:

```text
public.device_tokens            ➔ Menyimpan FCM token perangkat Android aktif per user
public.notification_preferences ➔ Preferensi toggle notifikasi (low stock, piutang, digest)
public.notifications            ➔ Riwayat notifikasi in-app untuk icon lonceng (🔔)
public.notification_events      ➔ Antrian outbox pengiriman event asynchronous
public.app_releases             ➔ Pencatatan rilis APK baru & auto-update trigger
```

Trigger `tr_notify_on_new_app_release` secara otomatis membroadcast notifikasi pembaharuan ke seluruh pengguna aktif saat developer merilis APK versi baru ke Supabase Storage.

---

## 6. Penjadwalan Otomatis Background (`pg_cron`)

Empat *cron jobs* berjalan secara otomatis di level server database PostgreSQL:

| Jadwal (WIB) | Fungsi Cron SQL | Sasaran Role | Fungsi & Konten Pesan |
| :--- | :--- | :--- | :--- |
| **07:30 WIB** *(00:30 UTC)* | `cron_send_morning_stock_alert()` | Gudang & Owner | **Peringatan Pagi Stok & Expired**: Memberitahu produk yang menipis di bawah safety stock dan batch barang yang mendekati kadaluarsa. |
| **12:00 WIB** *(05:00 UTC)* | `cron_send_customer_receivables_reminder()` | Owner & Admin | **Pengingat Piutang Jatuh Tempo**: Daftar toko mitra yang tagihannya jatuh tempo H-1, Hari H, dan menunggak (overdue). |
| **20:00 WIB** *(13:00 UTC)* | `cron_send_daily_closing_digest()` | Owner | **Rekap Penutupan Toko Malam**: Ringkasan total transaksi, omzet hari ini, penerimaan kas tunai, saldo piutang baru, dan estimasi laba kotor harian. |
| **09:00 WIB** *(Tgl 21-28)* | `cron_send_server_billing_reminder()` | Owner | **Pengingat Iuran Server (H-7 s/d Hari H)**: Countdown peringatan perpanjangan lisensi server bulanan sebelum jatuh tempo tgl 28. Otomatis dilewati jika sudah lunas. |

---

## 7. Panduan Urutan Eksekusi Skrip Migrasi SQL

Jika melakukan inisialisasi atau setup database Supabase baru dari awal, proses kini disederhanakan melalui folder [`supabase/`](file:///d:/Dokumen/02_Kerja_Profesional/Dashboard%20Virgin/supabase):

1. **`supabase/schema/01_master_full_schema.sql`** *(Wajib — Master Schema lengkap: Seluruh tabel, fungsi RPC atomik FIFO `create_sembako_sale_transaction`, RLS policies, indexes, & seed akun bawaan).*
2. **`supabase/schema/02_crons_and_automations.sql`** *(Opsional / Pro Tier — Seluruh penjadwalan `pg_cron`: Notifikasi stok pagi, piutang siang, rekap tutup toko malam, & iuran server).*
3. **`supabase/seeds/register_user_template.sql`** *(Template pendaftaran user owner / tenant toko baru).*

> Detail panduan setup dan arsip riwayat patch migrasi dapat dilihat di [`supabase/README.md`](file:///d:/Dokumen/02_Kerja_Profesional/Dashboard%20Virgin/supabase/README.md).
