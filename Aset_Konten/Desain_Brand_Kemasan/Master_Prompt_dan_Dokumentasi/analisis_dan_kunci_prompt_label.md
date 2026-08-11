# 🏷️ Analisis & Kunci Prompt Label Kemasan — Bawang Goreng Juragan

Dokumen ini berisi analisis mengenai inkonsistensi prompt desain kemasan dan mendokumentasikan spesifikasi label yang telah **dikunci (locked)** untuk menjaga konsistensi visual di seluruh visualisasi AI (mockup) ke depan.

---

## 🔍 Perbandingan Label & Analisis Inkonsistensi

| Elemen | Image 2 (Referensi Awal, Background Hitam) | Image 1 (Lineup, Background Kayu) |
| :--- | :--- | :--- |
| **Bentuk Label** | Kotak/persegi dengan sudut membulat | Oval/perisai (*shield shape*) |
| **Elemen Atas** | Tulisan "JURAGAN" langsung | Crest/mahkota kecil di atas "JURAGAN" |
| **Subtext** | "BAWANG GORENG" + "Premium Fried Shallots" (italic) | "Bawang Goreng" + badge pita emas kecil "Premium" |
| **Fitur Khas** | 4 checkmark dalam grid 2x2: *Crispy, Premium Quality, No Preservatives, Indonesian Shallots* | Ikon ilustrasi bawang merah belah dua di bawah teks (checklist hilang) |
| **Border** | Garis tipis emas persegi | Border oval/shield emas |

### Akar Masalah:
Pada prompt ke-3 dan seterusnya (versi lineup jar & pouch), terdapat perubahan deskripsi label menjadi *"small decorative crest icon"* dan *"illustrated icon of a halved red shallot bulb"*. Padahal, referensi asli yang disetujui (Image 2) menggunakan **checklist 2x2**, bukan crest atau ikon bawang merah belah. Modifikasi ini menyebabkan AI membuat desain baru setiap kali proses pembuatan visual dilakukan.

---

## 🔒 Prompt Label yang Dikunci (Locked Label Prompt)

Gunakan blok teks di bawah ini **persis** di setiap pembuatan prompt visual AI ke depannya untuk menjamin konsistensi desain label:

```text
Label design (must be identical and consistent across all packaging, exactly 
as follows — do not add extra icons or change the layout): a cream ivory 
rectangular label with rounded corners and a thin gold border frame, centered 
on the pouch. At the top, "JURAGAN" in large bold gold serif lettering, with 
a thin decorative horizontal divider line beneath it. Below that, "BAWANG 
GORENG" in bold dark brown serif text, followed by "Premium Fried Shallots" 
in smaller italic dark brown subtext. Below the subtext, a 2x2 grid of four 
small gold checkmarks with black text labels: "Crispy", "Premium Quality", 
"No Preservatives", "Indonesian Shallots". No other icons, crests, or 
illustrations on the label — keep it clean and minimal exactly as described.
```

---

## 📌 Catatan Implementasi:
Dengan mengunci bagian deskripsi label ini, visualisasi pada latar belakang apa pun (baik background hitam, kayu rustic, maupun jenis kemasan lain seperti jar atau pouch) akan selalu menghasilkan label yang identik dengan versi Image 2 yang disukai.
