# 🤖 Automasi Medsos & Auto Poster — Bawang Goreng Juragan

Dokumen ini berisi perancangan **Metode Utama Automasi Instagram**, Panduan Penggunaan, Arsitektur Sistem, dan Sinkronisasi Google Drive.

---

## 🌟 1. METODE UTAMA: Auto Poster Undetected ChromeDriver (`auto_post_selenium.py`)

Skrip **`auto_post_selenium.py`** adalah metode **UTAMA dan Paling Direkomendasikan** untuk memposting foto produk single maupun **Carousel 3–4 Slide** secara otomatis ke Instagram.

### 🔥 Keunggulan Metode Utama:
1. **Anti-Bot Detection & No Blank reCAPTCHA:** Menggunakan `undetected-chromedriver` yang secara otomatis menghapus flag otomatisasi (`navigator.webdriver`), sehingga reCAPTCHA dapat dibuka & diselesaikan dengan normal.
2. **Dukungan Carousel Multi-Gambar:** Mengunggah album/carousel (3–4 slide) secara sempurna tanpa dibatasi oleh API seluler.
3. **Copywriting Emoji Full Support:** Menggunakan teknik *Clipboard Copy-Paste* (`pyperclip`), terbebas dari kendala karakter non-BMP (bebas error emoji).
4. **Sesi Tersimpan (Persistens):** Login hanya perlu dilakukan **1 kali di awal**. Sesi disimpan di folder `chrome_profile/`, sehingga eksekusi berikutnya berjalan otomatis 100%.
5. **Auto-Update Database CSV:** Otomatis mengubah status postingan di `detail_caption_instagram.csv` dari `PENDING` menjadi `POSTED`.

---

## 🚀 2. Cara Menggunakan (Quick Start)

### A. Install Dependensi (Sekali saja)
Buka terminal PowerShell di folder proyek, lalu jalankan:
```powershell
pip install -r Automasi_Medsos/requirements.txt
```

### B. Jalankan Auto Poster (Metode Utama)
```powershell
python Automasi_Medsos/auto_post_selenium.py
```

### 📋 Alur Kerja Penggunaan:
1. Jendela Google Chrome akan terbuka menuju Instagram.
2. **Login & selesaikan verifikasi/CAPTCHA** (jika belum login).
3. Setelah masuk beranda Instagram, **tekan `ENTER`** di terminal.
4. Skrip akan langsung mengunggah foto/carousel, menulis caption ber-emoji, dan menerbitkan postingan satu per satu secara otomatis! 🎉

---

## 📁 3. Struktur Berkas Dalam `Automasi_Medsos`

```text
Automasi_Medsos/
├── README.md                      <-- Dokumen Panduan Utama
├── auto_post_selenium.py          <-- ⭐️ METODE UTAMA (Undetected ChromeDriver)
├── auto_post_browser.py           <-- (Metode Alternatif - Playwright)
├── auto_post_instagram.py         <-- (Metode Alternatif - Instagrapi API)
├── sync_google_drive.py           <-- Modul Sinkronisasi Google Drive
├── requirements.txt               <-- Dependensi Library Python
├── chrome_profile/                <-- Folder Sesi Browser Tersimpan
├── .env                           <-- Konfigurasi Kredensial lokal
└── cookies.txt                    <-- File Cookie cadangan
```

---

## ☁️ 4. Google Drive Auto-Sync (`sync_google_drive.py`)

Modul ini menyinkronkan seluruh aset gambar dan caption secara otomatis dengan Google Drive Folder:
`https://drive.google.com/drive/folders/18pLNfIbRsiA_3kKdrnuTc3SUvoF-WsHd`

### Perintah Penggunaan:
- **Cek Status & Konfigurasi:**
  ```powershell
  python Automasi_Medsos/sync_google_drive.py --mode info
  ```
- **Unduh Aset dari Google Drive Publik:**
  ```powershell
  python Automasi_Medsos/sync_google_drive.py --mode download
  ```
- **Sinkronisasi 2 Arah (Upload & Download):**
  ```powershell
  python Automasi_Medsos/sync_google_drive.py --mode auto
  ```

---

## 🛠️ 5. Troubleshooting Common Issues

| Kendala | Penyebab | Solusi |
| :--- | :--- | :--- |
| `ChromeDriver only supports characters in BMP` | Emoji diketik karakter demi karakter di Selenium | Sudah diatasi di `auto_post_selenium.py` dengan metode `pyperclip` Copy-Paste. |
| `SessionNotCreatedException` (Chrome v150 vs v151) | Versi driver tidak cocok dengan versi browser | Skrip `auto_post_selenium.py` secara otomatis mendeteksi versi Chrome yang terinstall (`get_chrome_version()`). |
| Blank Screen saat reCAPTCHA | Browser terdeteksi sebagai bot | Gunakan `auto_post_selenium.py` (`undetected-chromedriver`), jangan pakai browser bot standar. |
