# 🚀 Panduan Kloning & Kustomisasi Cepat (How-To-Clone in 15 Minutes)
## Virgin Master Dashboard — Core Financial, POS & Inventory OS

> Dokumen ini adalah panduan operasional praktis bagi developer untuk mengkloning dan mengkustomisasi **Virgin Master Dashboard Boilerplate** ini untuk klien, industri, atau model bisnis baru hanya dalam waktu 15 menit dengan memanfaatkan **Centralized Business Configuration (`src/config/businessConfig.js`)**.

---

## 📑 Alur Kustomisasi 15 Menit

1. [Pusat Kendali Bisnis: `src/config/businessConfig.js`](#1-pusat-kendali-bisnis-srcconfigbusinessconfigjs)
2. [6 Preset Industri Siap-Pakai](#2-6-preset-industri-siap-pakai)
3. [Langkah 1: Kloning & Penyesuaian Identitas (3 Menit)](#langkah-1-kloning--penyesuaian-identitas-3-menit)
4. [Langkah 2: Setup Database Supabase & Akun Owner (4 Menit)](#langkah-2-setup-database-supabase--akun-owner-4-menit)
5. [Langkah 3: Konfigurasi Environment Variables (2 Menit)](#langkah-3-konfigurasi-environment-variables-2-menit)
6. [Langkah 4: Deploy Web Dashboard (Vercel / Cloudflare) (2 Menit)](#langkah-4-deploy-web-dashboard-vercel--cloudflare-2-menit)
7. [Langkah 5: Kompilasi APK Android Klien (3 Menit)](#langkah-5-kompilasi-apk-android-klien-3-menit)
8. [Langkah 6: Terbitkan PDF Surat Kontrak Resmi](#langkah-6-terbitkan-pdf-surat-kontrak-resmi)

---

## 1. Pusat Kendali Bisnis: `src/config/businessConfig.js`

Semua penyesuaian bisnis, mulai dari nama toko, brand, mata uang, daftar satuan barang, kategori, hingga opsi menyalakan/mematikan fitur tertentu (*feature toggles*) dikontrol dari satu berkas: [`src/config/businessConfig.js`](file:///d:/Dokumen/02_Kerja_Profesional/Dashboard%20Virgin/src/config/businessConfig.js).

```javascript
import { BUSINESS_CONFIG } from '@/config/businessConfig';

// Cukup ubah 1 baris ini untuk mengubah seluruh perilaku sistem:
BUSINESS_CONFIG.activeIndustry = 'pharmacy'; // 'general_trading' | 'sembako' | 'pharmacy' | 'electronics' | 'building_material' | 'fashion' | 'fnb'
```

### Feature Flags yang Dapat Diatur:
```javascript
featureFlags: {
  enableExpiryDateTracking: true,   // Wajib untuk Apotek & Makanan, nonaktifkan untuk Elektronik/Baju
  enableMultiUnitConversion: true,  // Aktifkan jika ada satuan bertingkat (Dus -> Pak -> Pcs)
  enableCourierLogistics: true,     // Modul penugasan supir & upload foto bukti serah terima (POD)
  enableEmployeePayroll: true,      // Modul hitung gaji pokok, uang makan, & kasbon
  enableCustomerCreditLimit: true,  // Batasan plafon piutang B2B per warung/pelanggan
  enableAIAssistant: true,          // Asisten bisnis cerdas MAIA Router (xAI Grok & GLM)
}
```

---

## 2. 6 Preset Industri Siap-Pakai

| Vertikal Bisnis | `activeIndustry` | Satuan Default | Fitur Kunci |
| :--- | :--- | :--- | :--- |
| **📦 Sembako & FMCG** | `'sembako'` | `sak`, `dus`, `bal`, `renceng`, `slop`, `pak`, `kg`, `liter`, `pcs` | FIFO Batch, Multi-Satuan, Kredit Limit Toko Mitra |
| **💊 Apotek & Farmasi** | `'pharmacy'` | `box`, `botol`, `strip`, `blister`, `tablet`, `kapsul`, `ampul`, `tube`, `pcs` | No. Batch BPOM, Expired Alert Ketat 90 Hari, Supplier CRM |
| **📱 Elektronik & Gadget** | `'electronics'` | `unit`, `box`, `set`, `pack`, `pcs` | Nonaktifkan Expired, Catat IMEI/Serial di Notes Batch |
| **🧱 Bahan Bangunan** | `'building_material'` | `truk`, `kubik`, `sak`, `batang`, `lembar`, `kaleng`, `dus`, `meter`, `pcs`, `kg` | Surat Jalan DO Kurir, Biaya Operasional Armada Truk |
| **👕 Fashion & Distro** | `'fashion'` | `kodi`, `lusin`, `pack`, `set`, `pasang`, `pcs` | Varian Ukuran/Warna di SKU, Tier Harga Grosir/Reseller |
| **🥩 F&B & Cold Storage** | `'fnb'` | `karton`, `pack`, `bal`, `tray`, `kg`, `gram`, `liter`, `pcs` | Timbangan Kiloan/Gram, Cold Storage FIFO |

---

## Langkah 1: Kloning & Penyesuaian Identitas (3 Menit)

### 1.1 Duplikasi Proyek
```bash
cp -r "Dashboard Virgin" "Dashboard-NamaKlien"
cd "Dashboard-NamaKlien"
```

### 1.2 Sesuaikan `src/config/businessConfig.js`
Ubah informasi nama toko dan industri klien Anda:
```javascript
appInfo: {
  appName: 'Nama Toko ERP',
  brandName: 'Brand Klien',
  companyName: 'PT Nama Usaha Klien',
  contactWhatsApp: '628xxxxxxxxxx',
}
```

### 1.3 Sesuaikan `package.json` & `capacitor.config.json`
- `package.json`: Ubah `"name": "dashboard-namaklien-app"`.
- `capacitor.config.json`: Ubah `"appId": "com.namaklien.pos"` dan `"appName": "NamaToko App"`.
- `index.html`: Ubah tag `<title>` dan meta tags sesuai nama toko klien.

---

## Langkah 2: Setup Database Supabase & Akun Owner (4 Menit)

1. Buat proyek baru di [Supabase Console](https://supabase.com).
2. Buka menu **SQL Editor**.
3. Jalankan skrip database master inti:
   - Salin dan jalankan [`supabase/schema/01_master_full_schema.sql`](file:///d:/Dokumen/02_Kerja_Profesional/Dashboard%20Virgin/supabase/schema/01_master_full_schema.sql) (otomatis membuat seluruh tabel, fungsi RPC FIFO, dan RLS policies).
   - *(Opsional jika mendukung pg_cron)*: Jalankan [`supabase/schema/02_crons_and_automations.sql`](file:///d:/Dokumen/02_Kerja_Profesional/Dashboard%20Virgin/supabase/schema/02_crons_and_automations.sql) untuk pengingat otomatis.
4. Buka [`supabase/seeds/register_user_template.sql`](file:///d:/Dokumen/02_Kerja_Profesional/Dashboard%20Virgin/supabase/seeds/register_user_template.sql), isi variabel email, nama pemilik, dan nama toko klien, lalu eksekusi di SQL Editor:
   ```sql
   v_email := 'owner@tokoklien.com';
   v_password := 'PasswordRahasia123!';
   v_full_name := 'Bapak Nama Klien';
   v_role := 'owner';
   v_business_name := 'Toko Makmur Jaya';
   ```

---

## Langkah 3: Konfigurasi Environment Variables (2 Menit)

Salin `.env.example` ke `.env` dan isi kredensial Supabase proyek baru:

```env
# URL & Anon Key dari Supabase Project Settings -> API
VITE_SUPABASE_URL=https://xxxxxxxxxxxxxxxxxxxx.supabase.co
VITE_SUPABASE_ANON_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ...

# AI Assistant (MAIA Router)
VITE_MAIA_API_KEY=maia_sk_live_xxxxxxxxxxxxxxxxxxxxxxxxxxxx
VITE_AI_MODEL=xai/grok-4-1-fast-reasoning-latest

# WhatsApp CS / Notifikasi Toko Klien (Format: 628xxxxxxxxxx)
VITE_WHATSAPP_NUMBER=6281234567890
```

---

## Langkah 4: Deploy Web Dashboard (Vercel / Cloudflare) (2 Menit)

```bash
# Deploy langsung menggunakan Vercel CLI
vercel --prod
```
Dashboard web langsung live di domain `https://namaklien-dashboard.vercel.app`!

---

## Langkah 5: Kompilasi APK Android Klien (3 Menit)

```bash
# 1. Build bundle web produksi
npm run build

# 2. Sinkronkan asset ke platform Android
npx cap sync android

# 3. Kompilasi APK Release (Windows PowerShell)
cd android
.\gradlew.bat assembleRelease
cd ..
```
File APK siap instal tersedia di:  
`android/app/build/outputs/apk/release/app-release-unsigned.apk`

---

## Langkah 6: Terbitkan PDF Surat Kontrak Resmi

Untuk membuat surat perjanjian kerja sama resmi bermeterai bagi klien:

1. Buka [`generate_contract_pdf.jsx`](file:///d:/Dokumen/02_Kerja_Profesional/Dashboard%20Virgin/generate_contract_pdf.jsx).
2. Tentukan data kontrak (Nama Klien, Nama Toko, Biaya Bulanan, Rekening).
3. Jalankan perintah pembuatan PDF:
```bash
npm run contract:pdf
```
File PDF resmi siap tanda tangan bermeterai akan terbit: `KONTRAK_LAYANAN_TEMPLATE.pdf`.

---

🎉 **Selesai!** Dalam 15 menit, Anda telah memiliki sistem ERP, kasir POS, inventaris gudang, aplikasi Android, dan kontrak kerja sama legal yang terisolasi dan siap dipakai untuk klien baru.
