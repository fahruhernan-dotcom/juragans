# PANDUAN ADAPTASI SCRIPT WRITER — GOOGLE FLOW (VEO)
**Pelengkap dari:** `Panduan_Script_Writer_Video_Ads.md`
**Fungsi:** menyesuaikan script dua-kolom (visual/audio/teks) menjadi prompt siap generate di Google Flow

> ⚡ **Aturan Setelan Agen Google Flow Terbaru:**
> - **Model Omni Flash**: Durasi maksimal **10 detik** per klip/footage.
> - **Model Veo**: Durasi maksimal **8 detik** (pilihan 4s, 6s, atau 8s) per klip.
> - **Jumlah Footage (`x1`, `x2`, `x3`, `x4`)**: Pilih berapa variasi klip yang digenerate sekaligus dalam 1 kali prompt untuk mempermudah pemilihan footage terbaik.

---

## 1. PERBEDAAN UTAMA: SCRIPT LIVE-ACTION vs SCRIPT UNTUK FLOW

| Aspek | Script produksi biasa (syuting) | Script untuk Google Flow |
|---|---|---|
| Bahasa naskah | Bahasa Indonesia (untuk talent/kru) | **Bahasa Inggris** (Flow/Veo/Omni lebih stabil dengan prompt Inggris) |
| Durasi per unit | Bebas, ditentukan storyboard | **Omni Flash:** Max 10s \| **Veo:** Max 8s (4/6/8s) |
| Jumlah Footage | Single shot per take | Bisa set **x1, x2, x3, atau x4** variasi sekali generate |
| Audio | Direkam terpisah (VO, SFX, musik) | Bisa **digenerate otomatis** (ambience, SFX) — VO brand tetap direplace di editing |
| Kontinuitas antar scene | Dikontrol lewat shot list & sutradara | Dikontrol lewat **reference image** (maks. 3 gambar) dan fitur **Extend** |
| Kontrol kamera | Diarahkan langsung ke DOP/kameramen | Harus **dideskripsikan sebagai instruksi tertulis** dalam prompt |
| Revisi | Reshoot | Re-generate dengan opsi `x2/x4` atau ubah 1 variabel per iterasi |

---

## 2. STRUKTUR PROMPT FLOW YANG DIREKOMENDASIKAN

Berdasarkan praktik yang terbukti stabil, satu prompt Flow sebaiknya berisi elemen berikut, idealnya **100–150 kata** (3–6 kalimat) — jangan terlalu pendek (hasil generik) atau terlalu panjang (model bingung/elemen terpotong):

1. **Subject** — siapa/apa yang jadi fokus (produk, mangkuk, pouch, dll)
2. **Context** — di mana settingnya (studio gelap, meja kayu, dll)
3. **Action** — apa yang terjadi/bergerak dalam frame
4. **Style** — aestetik visual (cinematic, realistic, food commercial, dll)
5. **Camera movement** — SATU gerakan kamera saja, ditulis sebagai **kalimat terpisah** (bukan disisipkan di tengah kalimat lain)
6. **Composition & lens** — wide shot / close-up / shallow depth of field, dll
7. **Lighting & mood** — warm golden light, dark moody background, dll
8. **Sound (opsional)** — ambience/SFX yang diinginkan, atau tulis `no dialogue` kalau audio akan direplace total di editing

**Contoh kerangka kalimat:**
```
[Subject + Context]. [Action, dijelaskan detail]. [Camera movement — kalimat terpisah]. 
[Composition/lens]. [Style]. [Lighting/mood]. [Sound, opsional].
```

### Aturan kamera (penting)
- **Satu gerakan kamera per prompt.** Jangan gabung "dolly in lalu pan kanan lalu zoom out" dalam satu klip — model gampang bingung dan hasilnya kacau.
- Tulis instruksi kamera sebagai **kalimat berdiri sendiri**: `"The camera slowly pushes in."` — bukan disisipkan di tengah deskripsi subjek.
- Istilah kamera yang dikenali baik oleh Veo: *dolly shot, tracking shot, crane shot, aerial view, slow pan, orbit shot, handheld tracking, POV shot, static/locked-off shot.*
- Untuk gerakan produk/talent (bukan kamera): pakai istilah seperti *natural movement, slow and deliberate movement, graceful movement* — konsisten dengan mood brand.

---

## 3. MENGONVERSI SCRIPT DUA-KOLOM MENJADI PROMPT FLOW

Ambil satu baris dari tabel script (waktu, visual, audio, teks overlay) di panduan utama, lalu ubah jadi prompt Flow dengan urutan berikut:

**Langkah konversi:**
1. Ambil kolom **Visual** → jadi bagian Subject + Context + Action
2. Tentukan **satu** gerakan kamera yang paling mewakili maksud scene tersebut
3. Tambahkan Style, Composition, Lighting sesuai brand guideline (lihat referensi visual/warna brand)
4. Kolom **Audio/VO** di script dua-kolom **TIDAK dimasukkan ke prompt visual** — VO tetap ditulis terpisah dan direkam/di-layer di tahap editing (lihat Bagian 4)
5. Sesuaikan durasi ke pilihan terdekat yang valid: **4, 6, atau 8 detik**

**Contoh konversi:**

> Script dua-kolom (dari panduan utama):
> *Visual:* "Steam Reveal — kamera hampir diam, asap naik pelan, lalu push-in ke logo"
> *Waktu:* 0–3s dari total video 10s

> Jadi prompt Flow (dipecah ke 2 klip karena melebihi 8 detik):

**Klip 1 (durasi 6 detik):**
```
Extreme close-up on a black ceramic bowl filled with golden crispy fried shallots. 
Wisps of aromatic steam rise slowly and curl upward, backlit by warm golden light. 
The camera holds nearly static with only a faint breathing motion. Shallow depth of 
field, dark moody background, premium food photography lighting, warm amber and gold 
tones, cinematic style. No dialogue, ambient steam sound only.
```

**Klip 2 (durasi 6 detik, disambung via Extend atau reference image dari frame akhir Klip 1):**
```
Continuing from the steaming bowl of fried shallots, the camera slowly pushes in and 
tilts up. The "JURAGAN" gold logo comes into soft focus above, with the stand-up 
pouch package visible and blurred in the background. Shallow depth of field, dark 
moody background, warm cinematic lighting, calm and deliberate pacing. No dialogue.
```

---

## 4. AUDIO: BEDA PERLAKUAN DI FLOW vs DI EDITING FINAL

Veo/Flow **bisa generate audio sendiri** (ambience, SFX, bahkan dialog dengan tanda kutip), tapi ada catatan penting:

- **Ambience/SFX otomatis** (steam, sizzle, suara lingkungan) → boleh dipakai langsung dari hasil Flow kalau cocok, cukup untuk rough cut
- **Dialog/VO presisi untuk brand** → **jangan andalkan** audio bawaan Flow, karena **lip-sync tidak dijamin akurat**. Tetap rekam VO terpisah (pakai naskah dari panduan utama Bagian 5) lalu di-layer di software edit
- Kalau ingin VO Flow hanya untuk keperluan timing/vibe saat review awal, bisa tulis dialog dalam tanda kutip di prompt, contoh: `A warm voice says, "Dari dapur Boyolali..."` — tapi anggap ini placeholder, bukan hasil final

**Rekomendasi workflow audio:**
1. Generate visual dulu dari Flow tanpa terlalu bergantung pada audio bawaan
2. Ambil ambience/SFX yang bagus dari hasil Flow kalau ada (opsional)
3. Rekam VO final terpisah dengan talent asli (Bahasa Indonesia, sesuai naskah)
4. Gabungkan di software edit: visual Flow + VO asli + musik + SFX tambahan

---

## 5. KONSISTENSI ANTAR SCENE (Reference Image & Extend)

Karena satu produk/karakter perlu tampil konsisten di beberapa klip:

- **Reference image (maks. 3 gambar):** upload gambar produk (seperti hero shot bawang goreng ini) di setiap generate baru supaya warna, bentuk mangkuk, dan pouch tetap konsisten
- **Extend:** dipakai kalau mau melanjutkan gerakan dari akhir klip sebelumnya secara mulus (misalnya klip 1 berakhir di posisi kamera tertentu, klip 2 melanjutkan dari situ)
- **First & Last Frame technique:** kalau butuh transisi terkontrol antara dua visual spesifik (misal dari mangkuk ke pouch), siapkan dua gambar (starting frame & ending frame) dan biarkan Flow mengisi gerakan di antaranya

---

## 6. CHECKLIST KHUSUS SEBELUM GENERATE DI FLOW

- [ ] Durasi disesuaikan dengan model: **10 detik (Omni Flash)** atau **4/6/8 detik (Veo)**
- [ ] Opsi jumlah footage (`x1`, `x2`, `x3`, atau `x4`) sudah dipilih sesuai kebutuhan variasi angle
- [ ] Prompt ditulis dalam Bahasa Inggris, 100–150 kata
- [ ] Hanya **satu** gerakan kamera per prompt, ditulis sebagai kalimat terpisah
- [ ] Reference image sudah disiapkan (maks. 3) untuk konsistensi produk/brand
- [ ] Kalau video final butuh >8-10 detik, sudah direncanakan pakai Extend atau digabung di editing
- [ ] Audio bawaan Flow diperlakukan sebagai referensi/rough cut, VO final tetap direkam terpisah
- [ ] Satu variabel diubah per iterasi kalau hasil generate perlu direvisi (jangan ubah kamera + lighting + subjek sekaligus)

---

## 7. TEMPLATE PROMPT FLOW (siap isi ulang)

```
DURASI       : (4 / 6 / 8 detik)
REFERENCE IMG: (nama file / deskripsi gambar referensi)
LANJUTAN DARI: (nama klip sebelumnya jika pakai Extend, atau "klip baru")

PROMPT:
[Subject + Context]. [Action detail]. [Camera movement — kalimat terpisah]. 
[Composition/lens]. [Style]. [Lighting/mood]. [Sound/ambience atau "no dialogue"].
```

---

*File ini dipakai bersamaan dengan `Panduan_Script_Writer_Video_Ads.md` — script dua-kolom dibuat dulu di sana untuk menentukan pesan & alur cerita, baru dikonversi ke prompt Flow memakai panduan ini.*
