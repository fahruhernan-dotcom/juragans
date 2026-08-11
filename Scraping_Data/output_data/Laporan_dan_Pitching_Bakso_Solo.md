# Laporan Analisis Data & Draf Pitching Bawang Goreng - Bakso Solo Raya

Dokumen ini berisi hasil analisis data scraping rumah makan bakso di wilayah Solo Raya beserta draf pitching penawaran bawang goreng (Juragan Bawang) untuk berbagai media komunikasi (WhatsApp, Email/DM Instagram, dan Kunjungan Langsung).

## 1. Ringkasan Pemfilteran Data

- **Sumber Data:** `dataset_crawler-google-places_2026-07-17_11-33-51-787.xlsx`
- **Total Data Awal:** 53 rumah makan bakso
- **Kriteria Pemfilteran:**
  - Wilayah: Solo Raya (Surakarta & Sukoharjo)
  - Jumlah Review (Reviews Count): > 20 orang
  - Rating/Bintang (Total Score): Min. 4.0
- **Total Hasil Pemfilteran:** **27 rumah makan bakso** yang memenuhi syarat.

---

## 2. Klasifikasi Data Rumah Makan Bakso Solo Raya

### Kategori A: Memiliki Kontak WhatsApp (Prioritas Utama Hubungi via WA)

*Disarankan menghubungi via WhatsApp karena memiliki tingkat respon tertinggi.*

| No | Nama Rumah Makan                                 | Rating | Reviews | Kota           | Alamat                          | No. Telp/WA      |                                                                            Google Maps                                                                            |
| :-: | :----------------------------------------------- | :----: | :-----: | :------------- | :------------------------------ | :--------------- | :----------------------------------------------------------------------------------------------------------------------------------------------------------------: |
| 1 | **BAKSO TITOTI SOLO**                      |  4.5  |  5,328  | Kota Surakarta | Jl. Honggowongso No.97          | `081326268668` |                     [Maps](<https://www.google.com/maps/search/?api=1&query=BAKSO%20TITOTI%20SOLO&query_place_id=ChIJee_N_3wWei4RSrr78-br-74>)                     |
| 2 | **Bakso Alex Mangkunegaran**               |  4.5  |  4,398  | Kota Surakarta | Jl. Yosodipuro No.12B           | `081567800004` |                  [Maps](<https://www.google.com/maps/search/?api=1&query=Bakso%20Alex%20Mangkunegaran&query_place_id=ChIJxQXzYogWei4R6ZUP91F0z10>)                  |
| 3 | **Bakso Kadipolo**                         |  4.4  |  3,494  | Kota Surakarta | Jl. Ronggowarsito No.163        | `08156750005`  |                        [Maps](<https://www.google.com/maps/search/?api=1&query=Bakso%20Kadipolo&query_place_id=ChIJdfgeAIcWei4RMsO7mYQp5ro>)                        |
| 4 | **Bakso Mblenger Manahan**                 |  4.4  |  2,002  | Kota Surakarta | Jl. MT Haryono No.38            | `089505306754` |                   [Maps](<https://www.google.com/maps/search/?api=1&query=Bakso%20Mblenger%20Manahan&query_place_id=ChIJ3dYD5SUUei4REApwmE23chQ>)                   |
| 5 | **Bakso Urat Lor Patung Kuda Manahan**     |  4.5  |  1,613  | Kota Surakarta | Jl. Banyuanyar Selatan          | `085713777084` |          [Maps](<https://www.google.com/maps/search/?api=1&query=Bakso%20Urat%20Lor%20Patung%20Kuda%20Manahan&query_place_id=ChIJtVIL0RwUei4RLSfy5zS9nyc>)          |
| 6 | **Bakso dan mie ayam sriwaru pak karimin** |  4.5  |  1,465  | Kota Surakarta | Jl. Kawung Jl. Premulung        | `081226211222` |       [Maps](<https://www.google.com/maps/search/?api=1&query=Bakso%20dan%20mie%20ayam%20sriwaru%20pak%20karimin&query_place_id=ChIJVah7mDMUei4RBv0L6iD6v8U>)       |
| 7 | **Mie Ayam Adik Dewi KUA Laweyan**         |  4.3  |  1,437  | Kota Surakarta | Jl. Agus Salim No.60            | `082136264011` |            [Maps](<https://www.google.com/maps/search/?api=1&query=Mie%20Ayam%20Adik%20Dewi%20KUA%20Laweyan&query_place_id=ChIJZVbMGjMUei4Ria5pIWiNnrA>)            |
| 8 | **Bakso Pak Min Lapangan Sriwaru**         |  4.5  |  1,111  | Kota Surakarta | Jl. Madubronto No.26            | `081226152153` |             [Maps](<https://www.google.com/maps/search/?api=1&query=Bakso%20Pak%20Min%20Lapangan%20Sriwaru&query_place_id=ChIJU5gTSYcVei4RwiRHTYVjS7M>)             |
| 9 | **Bakso & Mie Ayam Oshin Laris**           |  4.6  |  1,100  | Kota Surakarta | Jl. Imam Bonjol No.63           | `08995350298`  |            [Maps](<https://www.google.com/maps/search/?api=1&query=Bakso%20%26%20Mie%20Ayam%20Oshin%20Laris&query_place_id=ChIJe-4NjmEWei4R0BXFP-ePCIM>)            |
| 10 | **Bakso Urat Pak Klowor**                  |  4.3  |   337   | Kota Surakarta | Jl. Doktor Moewardi No.52       | `081229537037` |                  [Maps](<https://www.google.com/maps/search/?api=1&query=Bakso%20Urat%20Pak%20Klowor&query_place_id=ChIJUVXFJSgUei4RMLeX33siPMg>)                  |
| 11 | **Bakso Pak Ruk Balapan**                  |  4.8  |   277   | Kota Surakarta | Jl. Walter Monginsidi No.189    | `082322029692` |                  [Maps](<https://www.google.com/maps/search/?api=1&query=Bakso%20Pak%20Ruk%20Balapan&query_place_id=ChIJ09UNgw4Xei4RZlMp035vfP0>)                  |
| 12 | **Bakso urat lor patung kuda cab. tipes**  |  4.7  |   89   | Kota Surakarta | Jl. Bhayangkara                 | `082326751575` |       [Maps](<https://www.google.com/maps/search/?api=1&query=Bakso%20urat%20lor%20patung%20kuda%20cab.%20tipes&query_place_id=ChIJMdt4vOcXei4RuW_GfA5ZPzY>)       |
| 13 | **Bakso Urat Pak Saino**                   |  4.3  |   59   | Kota Surakarta | Jl. Yosodipuro No.73            | `0822363030`   |                   [Maps](<https://www.google.com/maps/search/?api=1&query=Bakso%20Urat%20Pak%20Saino&query_place_id=ChIJO_bVcQAXei4Rc_ksGaqdJds>)                   |
| 14 | **Bakso Urat Legend Pak Sakir**            |  4.8  |   37   | Kota Surakarta | Jl. Yosodipuro No.144           | `085777070000` |              [Maps](<https://www.google.com/maps/search/?api=1&query=Bakso%20Urat%20Legend%20Pak%20Sakir&query_place_id=ChIJqxGkKgIXei4RdBuOZrkH9tM>)              |
| 15 | **Bakso Urat Prawit Nusukan Solo**         |  4.5  |   29   | Kota Surakarta | Jl. Kapten Piere Tendean No.207 | `088232068462` | [Maps](<https://www.google.com/maps/search/?api=1&query=Bakso%20Urat%20Prawit%20Nusukan%20Solo%20(Urat%20-%20Halus%20)&query_place_id=ChIJ67JOOLsWei4RN5ABlpNztL8>) |

### Kategori B: Memiliki Kontak Telepon Rumah/Kantor (Telepon Kabelsaran

*Dapat dihubungi melalui panggilan suara reguler untuk menanyakan nomor WhatsApp penanggung jawab dapur / manajer pembelian.*

| No | Nama Rumah Makan                           | Rating | Reviews | Kota           | Alamat                   | No. Telp       |                                                                  Google Maps                                                                  |
| :-: | :----------------------------------------- | :----: | :-----: | :------------- | :----------------------- | :------------- | :--------------------------------------------------------------------------------------------------------------------------------------------: |
| 16 | **Bakso Kalilarangan 2**             |  4.5  |  1,007  | Kota Surakarta | Jl. Yos Sudarso No.129   | `0271652980` |          [Maps](<https://www.google.com/maps/search/?api=1&query=Bakso%20Kalilarangan%202&query_place_id=ChIJAb4iMG4Wei4R4e1wVoIw-0E>)          |
| 17 | **Bakso Urat Daging Sapi Pak Saino** |  4.4  |   164   | Kota Surakarta | Jl. Slamet Riyadi No.306 | `0271852655` | [Maps](<https://www.google.com/maps/search/?api=1&query=Bakso%20Urat%20Daging%20Sapi%20Pak%20Saino&query_place_id=ChIJseHp6YAWei4RM5JBPXjxmhs>) |

### Kategori C: Populer Namun Belum Ada Kontak Langsung di File

*Dapat ditindaklanjuti dengan mencari akun media sosial mereka (Instagram/Facebook) atau melakukan kunjungan fisik langsung (sales kanvas).*

| No | Nama Rumah Makan                                    | Rating | Reviews | Kota           | Alamat                         |                                                                          Google Maps                                                                          |
| :-: | :-------------------------------------------------- | :----: | :-----: | :------------- | :----------------------------- | :-----------------------------------------------------------------------------------------------------------------------------------------------------------: |
| 18 | **Bakso Remaja**                              |  4.4  |  3,388  | Kota Surakarta | Jl. Kartopuran No.8            |                      [Maps](<https://www.google.com/maps/search/?api=1&query=Bakso%20Remaja&query_place_id=ChIJb1MkX3sWei4RDmF6WhogSpk>)                      |
| 19 | **Mie Ayam Pilist**                           |  4.5  |  3,281  | Kota Surakarta | Jl. Wirotamtomo No.16          |                    [Maps](<https://www.google.com/maps/search/?api=1&query=Mie%20Ayam%20Pilist&query_place_id=ChIJ5WvjnGoXei4RH0Eh6A-Tj2k>)                    |
| 20 | **Bakso Pak RUK**                             |  4.5  |  2,770  | Kota Surakarta | Jl. Jamsaren No.20             |                     [Maps](<https://www.google.com/maps/search/?api=1&query=Bakso%20Pak%20RUK&query_place_id=ChIJU7lQT3EWei4RlonhuJbTH04>)                     |
| 21 | **Bakso Urat " Pak Samiyo "**                 |  4.5  |  1,730  | Kab. Sukoharjo | Jl. Slamet Riyadi No.324       |          [Maps](<https://www.google.com/maps/search/?api=1&query=Bakso%20Urat%20%22%20Pak%20Samiyo%20%22&query_place_id=ChIJqc1_KFIUei4R02gsEHbpVFM>)          |
| 22 | **Bakso Urat Lor Patung Kuda**                |  4.6  |  1,365  | Kota Surakarta | Jl. Dr. Setiabudi No.91        |            [Maps](<https://www.google.com/maps/search/?api=1&query=Bakso%20Urat%20Lor%20Patung%20Kuda&query_place_id=ChIJV-87YJkWei4R3UNyiGJVeqc>)            |
| 23 | **Bakso Urat Jafar**                          |  4.6  |   116   | Kota Surakarta | Jl. Brigjen Sudiarto No.16     |                   [Maps](<https://www.google.com/maps/search/?api=1&query=Bakso%20Urat%20Jafar&query_place_id=ChIJSXGiZxoXei4RSKNWa8FvVnQ>)                   |
| 24 | **Mie ayam bakso bento solo**                 |  4.7  |   93   | Kota Surakarta | Jl. Sambeng No.48              |             [Maps](<https://www.google.com/maps/search/?api=1&query=Mie%20ayam%20bakso%20bento%20solo&query_place_id=ChIJpzMbjwcXei4R9ERtFzTGeJU>)             |
| 25 | **Mie Ayam & Bakso Sono Karto Kadung Tresno** |  5.0  |   82   | Kota Surakarta | Jl. Kebangkitan Nasional No.23 | [Maps](<https://www.google.com/maps/search/?api=1&query=Mie%20Ayam%20%26%20Bakso%20Sono%20Karto%20Kadung%20Tresno&query_place_id=ChIJi1XUVQUXei4RpBA_ZHWdDaA>) |
| 26 | **Bakso Pak Jafar**                           |  4.8  |   43   | Kota Surakarta | Jl. Dewi Sartika No.35-41      |                    [Maps](<https://www.google.com/maps/search/?api=1&query=Bakso%20Pak%20Jafar&query_place_id=ChIJr0BVbRoXei4Ra25adQGfXdw>)                    |
| 27 | **Bakso Urat " Pak MEYEK "**                  |  4.4  |   36   | Kota Surakarta | CRJW+8JX                       |          [Maps](<https://www.google.com/maps/search/?api=1&query=Bakso%20Urat%20%22%20Pak%20MEYEK%20%22&query_place_id=ChIJY1NTqVcWei4RuLWtTAQJd9s>)          |

---

## 3. Draf Pitching Penawaran Bawang Goreng (Struktur Formula B2B)

### 📧 Draf A: Email B2B Pitching (Pilihan User)

*Gunakan template email ini untuk mengirimkan penawaran formal kepada pemilik restoran, manajer operasional, atau tim purchasing.*

```text
Halo [Nama Penerima / Manager Nama Resto],

Saya memperhatikan ulasan pelanggan [Nama Resto] di Google Maps yang sangat menyukai kelezatan kuah bakso Anda, sejalan dengan reputasi bisnis Anda yang terus berkembang di Solo.

Rumah makan bakso yang sedang berkembang pesat umumnya menghadapi tantangan yang sama: menjaga konsistensi kerenyahan dan aroma bawang goreng tabur, akibat fluktuasi pasokan bawang merah segar maupun kualitas campuran yang tidak stabil.

Dapur produksi kami, Juragan Bawang, memproduksi bawang goreng 100% murni tanpa campuran tepung, membantu tim dapur menjaga aroma kuah tetap konsisten sekaligus menekan pemborosan bahan baku sisa (layu/berminyak).

Setiap kebutuhan dapur berbeda — karena itu, kami terbuka untuk menyesuaikan spesifikasi sesuai standar mutu spesifik [Nama Resto], mulai dari jenis bawang (Sumenep/Karet/Brebes), ketebalan irisan, tingkat kerenyahan, hingga volume dan jadwal pengiriman rutin. Kami akan sesuaikan formulasi dengan karakter rasa kuah Anda, bukan sebaliknya.

Sebagai langkah awal, kami siap mengirimkan sampel gratis agar tim dapur Bapak/Ibu dapat langsung menguji kecocokan rasa dan kualitasnya.

Salam hangat,

[Nama Anda]
B2B Partnership – Juragan Bawang (Anak Bawang)
[Link Website / Portfolio / Kontak WA]
```

### 💬 Draf B: WhatsApp B2B Pitching (Mengikuti Formula WhatsApp B2B)

*Gunakan pesan singkat ini untuk menghubungi kontak WhatsApp. Format ini ringkas, meminta izin secara sopan, menonjolkan problem-solving, dan memiliki CTA yang sangat ringan.*

```text
Selamat pagi/siang Pak/Bu [Nama Penerima / Penanggung Jawab Resto].

Perkenalkan saya [Nama Anda] dari Juragan Bawang. Saya mendapatkan kontak Bapak/Ibu dari data Google Maps bisnis kuliner Solo.

Saat ini kami sedang membantu beberapa rumah makan bakso premium di Solo Raya untuk menjaga konsistensi keharuman kuah bakso sekaligus menekan food cost bahan baku taburan. 

Melihat reputasi luar biasa [Nama Resto] dengan ribuan ulasan pelanggan, kami yakin solusi suplai bawang goreng murni kami—yang kualitasnya bisa disesuaikan dengan kebutuhan spesifik dapur Anda—sangat relevan membantu tim dapur mempertahankan cita rasa legendaris Anda.

Jika berkenan, kami siap mengirimkan sejumlah sampel gratis untuk dicoba langsung oleh tim dapur Bapak/Ibu guna menguji kecocokan rasa dan kualitasnya.

Terima kasih atas waktunya.
```

---

### 🤝 Draf C: Pitching Kunjungan Langsung (Sales Kanvas / Drop Sample)

*Skrip tatap muka saat Anda mendatangi outlet langsung untuk menemui kepala dapur atau manajer operasional.*

```text
"Selamat siang Pak/Bu, saya [Nama Anda] dari Juragan Bawang. Kami adalah produsen spesialis bawang goreng murni untuk kebutuhan restoran bakso. 

Kami ingin menitipkan sampel gratis untuk dicoba oleh tim dapur di sini. Bawang kami 100% murni, aromanya kuat dan renyah tahan lama untuk kuah bakso panas, serta harganya bersahabat langsung dari dapur produksi kami. 

Kami juga sangat terbuka untuk menyesuaikan kualitas produk—baik jenis bawang Sumenep/Brebes, ketebalan irisan, maupun kemurniannya—sesuai dengan standar spesifik dapur di sini.

Boleh saya titipkan sampel ini kepada penanggung jawab outlet atau kepala dapur di sini? Ini kartu nama saya, terima kasih banyak atas waktunya."
```

## 4. Rekomendasi Alur Tindak Lanjut

1. **Tahap 1: Hubungi Kontak WhatsApp (Kategori A)**
   Kirimkan draf WhatsApp (Draf A) ke 15 nomor ponsel terdaftar. Lakukan pengiriman bertahap (misal 5 chat per hari) agar pesan tetap personal dan Anda dapat membalas tanggapan mereka secara fokus.
2. **Tahap 2: Hubungi Melalui Instagram/Social Media**
   Untuk warung bakso dengan akun media sosial aktif (misal `@baksoalex` & `@bakso.prawit`), lakukan perkenalan melalui Direct Message menggunakan Draf B yang sedikit diringkas.
3. **Tahap 3: Tindak Lanjut Panggilan Telepon (Kategori B)**
   Telepon nomor kantor **Bakso Kalilarangan 2** dan **Bakso Urat Daging Sapi Pak Saino** di waktu senggang. Tanyakan apakah Anda boleh mengirim sampel penawaran dan mintalah kontak penanggung jawab pembelian/kepala dapur.
4. **Tahap 4: Kunjungan Fisik Langsung (Kategori C)**
   Datangi warung bakso besar yang belum memiliki nomor telepon langsung di file (seperti *Bakso Remaja*, *Mie Ayam Pilist*, *Bakso Pak RUK*, *Bakso Urat Lor Patung Kuda*) dengan membawa tester fisik. Hubungan tatap muka biasanya menghasilkan tingkat konversi kerja sama yang sangat tinggi di sektor kuliner tradisional.
