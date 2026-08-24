# 🔍 Audit Teknis Fase 4: Halaman Publik, Landing Page & Showcase Marketing
## Subfolder: `src/pages/`

> Berkas ini menyajikan hasil audit mendalam terhadap seluruh halaman publik, landing page promosi, halaman legalitas, harga, dan fitur di direktori `src/pages/`.

---

## 📑 Daftar Berkas yang Diaudit

```text
src/pages/
├── LandingPage.jsx                                # Landing page utama
├── AboutUs.jsx                                    # Tentang platform & visi misi
├── FAQPage.jsx                                    # Tanya jawab seputar sistem
├── HubungiKami.jsx                                # Kontak CS & sales
├── TermsPage.jsx                                  # Syarat & ketentuan layanan
├── PrivacyPage.jsx                                # Kebijakan privasi data
├── SecurityPage.jsx                               # Keamanan cloud & enkripsi
├── Login.jsx                                      # Halaman autentikasi
├── Register.jsx                                   # Pendaftaran akun baru
├── ForgotPassword.jsx                             # Reset kata sandi
├── LockedServerPage.jsx                           # Halaman blokir server jatuh tempo
├── WelcomeOnboard.jsx                             # Setup wizard awal
├── MarketPublic.jsx                               # Marketplace publik
├── HargaPasarPublic.jsx                           # Info harga pasar publik
├── fitur/                                         # Direktori showcase fitur
│   ├── index.jsx
│   ├── components/
│   └── data/
└── harga/                                         # Direktori paket harga & tier SaaS
    ├── index.jsx
    ├── components/
    └── data/
```

---

## 🔎 Temuan Logika Niche & Solusi Refactoring

### 1. `src/pages/LandingPage.jsx` & `AboutUs.jsx`
- **Temuan**:
  - Landing page dan About Us memuat narasi dan kata kunci promosi peternakan (TernakOS, peternak sapi, broiler, domba, kambing, kandang, FCR, ADG).
- **Solusi Refactoring**:
  - Transformasi narasi menjadi **Virgin Master Dashboard ERP**:
    - Tagline: *"Sistem Operasi Kasir POS, Manajemen Inventaris Batch FIFO Atomik & Financial Intelligence Terpadu"*.
    - Nilai Tambah: *"Mendukung segala jenis bisnis perdagangan ritel, grosir, apotek, bahan bangunan, elektronik, fashion, dan sembako"*.

---

### 2. `src/pages/FAQPage.jsx`, `TermsPage.jsx`, `PrivacyPage.jsx`
- **Temuan**:
  - Memuat referensi entitas peternakan dan nama brand lama.
- **Solusi Refactoring**:
  - Netralkan FAQ dan Syarat Ketentuan menjadi platform SaaS ERP & Inventory Management universal.

---

### 3. `src/pages/MarketPublic.jsx` & `HargaPasarPublic.jsx`
- **Temuan**:
  - Menampilkan harga ayam broiler dan pasar ternak.
- **Solusi Refactoring**:
  - Sesuaikan menjadi halaman katalog harga komoditas grosir/pasar umum, atau berikan kontrol modular via `BUSINESS_CONFIG.featureFlags` agar dapat diaktifkan/dinonaktifkan sesuai kebutuhan industri klien.

---

### 4. `src/pages/harga/` & `src/pages/fitur/`
- **Temuan**:
  - Menampilkan perbandingan paket harga dan modul peternakan.
- **Solusi Refactoring**:
  - Sesuaikan menjadi paket harga SaaS ERP standar:
    - **Paket Starter**: 1 Toko, Kasir POS, Multi-Satuan, Offline-First.
    - **Paket Pro (Grosir)**: Multi-Gudang, FIFO Batch, Piutang Toko Mitra, Logistik Kurir.
    - **Paket Enterprise**: Multi-Cabang, Penggajian Payroll, Laporan Laba Rugi Realtime, Asisten Bisnis AI.

---

## 🎯 Rencana Tindakan Refactoring Fase 4
1. Selaraskan seluruh halaman publik dan landing page agar merefleksikan identitas **Virgin Master Dashboard ERP**.
2. Pastikan teks legalitas (Terms & Privacy) sepenuhnya kompatibel untuk lisensi software enterprise komersial.
