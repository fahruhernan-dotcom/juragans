/**
 * TernakOS Static Blog Data
 * ─────────────────────────────────────────────────
 * Schema per artikel:
 *   slug          — URL-friendly identifier
 *   title         — Judul artikel (H1)
 *   metaTitle     — Title tag SEO (max 60 char)
 *   metaDescription — Meta description (max 155 char)
 *   category      — 'peternak' | 'broker' | 'sembako' | 'umum'
 *   tags          — array string
 *   publishedAt   — "YYYY-MM-DD"
 *   readTime      — estimasi menit baca
 *   excerpt       — 2-3 kalimat untuk card
 *   image         — path gambar (optional, null jika tidak ada)
 *   content       — HTML string lengkap artikel
 *   relatedSlugs  — max 2 slug artikel terkait
 *
 * Untuk menambah artikel baru, cukup tambahkan object
 * baru ke array ini — tidak perlu ubah komponen apapun.
 */

export const blogPosts = [
  {
    slug: 'cara-hitung-fcr-ayam-broiler',
    title: 'Cara Menghitung FCR Ayam Broiler dengan Benar (Rumus + Contoh Nyata)',
    metaTitle: 'Cara Hitung FCR Ayam Broiler: Rumus & Contoh',
    metaDescription: 'Pelajari cara menghitung FCR ayam broiler yang benar dengan rumus lengkap, contoh nyata 1 siklus kandang, dan tips praktis menurunkan FCR Anda.',
    category: 'peternak',
    tags: ['FCR', 'ayam broiler', 'peternak mandiri', 'manajemen kandang'],
    publishedAt: '2026-04-13',
    readTime: 7,
    excerpt: 'FCR (Feed Conversion Ratio) adalah angka paling penting yang harus dipantau setiap peternak broiler. Artikel ini menjelaskan rumus, standar ideal, dan cara praktis menurunkan FCR kandang Anda.',
    image: '/blog-fcr-ayam-broiler.jpg',
    relatedSlugs: ['cara-hitung-indeks-performa-ayam-broiler', 'cara-hitung-keuntungan-peternak-ayam-broiler'],
    content: `
<h2>Apa Itu FCR dan Kenapa Sangat Penting?</h2>
<p>FCR atau <strong>Feed Conversion Ratio</strong> adalah ukuran efisiensi pakan — berapa kilogram pakan yang dibutuhkan untuk menghasilkan satu kilogram bobot hidup ayam. Sederhananya: <strong>FCR 1,7 artinya 1,7 kg pakan menghasilkan 1 kg berat ayam</strong>.</p>
<p>Ini adalah angka paling strategis dalam bisnis peternakan broiler. Bedanya FCR 1,6 versus 1,8 dalam satu siklus 10.000 ekor bisa berarti selisih biaya pakan <strong>jutaan rupiah</strong>. Pakan menyumbang 70–75% dari total biaya produksi, sehingga efisiensi pakan = efisiensi bisnis Anda secara langsung.</p>

<h2>Rumus FCR Ayam Broiler</h2>
<p>Rumus dasar FCR sangat sederhana:</p>
<blockquote>
  <strong>FCR = Total Pakan yang Dikonsumsi (kg) ÷ Total Bobot Panen (kg)</strong>
</blockquote>
<p><em>Catatan: Bobot panen dihitung dari bobot hidup, bukan bobot karkas.</em></p>

<h2>Contoh Perhitungan Nyata 1 Siklus Kandang</h2>
<p>Anggap Anda memiliki kandang dengan data berikut:</p>
<ul>
  <li>Jumlah DOC masuk: <strong>5.000 ekor</strong></li>
  <li>Mortalitas selama siklus: 75 ekor (1,5%)</li>
  <li>Jumlah ayam panen: 4.925 ekor</li>
  <li>Berat rata-rata panen (umur 32 hari): 1,85 kg/ekor</li>
  <li>Total bobot panen: 4.925 × 1,85 = <strong>9.111,25 kg</strong></li>
  <li>Total pakan terpakai seluruh siklus: <strong>15.489 kg</strong></li>
</ul>
<p><strong>Perhitungan FCR:</strong></p>
<blockquote>FCR = 15.489 ÷ 9.111,25 = <strong>1,70</strong></blockquote>
<p>Artinya, kandang Anda butuh 1,70 kg pakan untuk menghasilkan 1 kg berat ayam hidup. Hasil yang cukup baik untuk broiler komersial.</p>

<h2>Standar FCR Ideal Ayam Broiler Berdasarkan Umur</h2>
<p>FCR ideal bervariasi berdasarkan umur panen. Berikut panduan umum untuk strain broiler modern (Cobb, Ross, Lohmann):</p>
<table>
  <thead><tr><th>Umur Panen</th><th>FCR Ideal</th><th>Keterangan</th></tr></thead>
  <tbody>
    <tr><td>28 hari</td><td>1,40 – 1,50</td><td>Panen awal, efisiensi tinggi</td></tr>
    <tr><td>30 hari</td><td>1,50 – 1,60</td><td>Target panen optimal</td></tr>
    <tr><td>32 hari</td><td>1,60 – 1,72</td><td>Paling umum di lapangan</td></tr>
    <tr><td>35 hari</td><td>1,70 – 1,85</td><td>Panen lebih berat, FCR naik wajar</td></tr>
    <tr><td>&gt;35 hari</td><td>&gt;1,85</td><td>Efisiensi menurun, pantau ketat</td></tr>
  </tbody>
</table>

<h2>Faktor-Faktor yang Mempengaruhi FCR Kandang Anda</h2>

<h3>1. Kualitas dan Konsistensi Pakan</h3>
<p>Pakan berkualitas rendah atau yang tidak sesuai fase pertumbuhan (starter, grower, finisher) akan memaksa ayam makan lebih banyak tapi tidak efisien dikonversi menjadi daging. Pastikan transisi pakan dilakukan pada umur yang tepat: starter (0–10 hari), grower (11–21 hari), finisher (22 hari–panen).</p>

<h3>2. Ventilasi dan Kualitas Udara Kandang</h3>
<p>Heat stress (stres panas) adalah pembunuh FCR paling sering diabaikan. Ketika suhu kandang di atas 30°C, ayam mengurangi konsumsi pakan tapi metabolisme tetap berjalan. FCR bisa naik 0,1–0,2 poin hanya karena ventilasi yang buruk.</p>

<h3>3. Kepadatan Kandang (Density)</h3>
<p>Standar kepadatan broiler adalah 8–10 ekor/m² untuk sistem open house dan 10–14 ekor/m² untuk closed house. Kepadatan berlebih meningkatkan kompetisi pakan, stres, dan mortalitas — semuanya memperburuk FCR.</p>

<h3>4. Kesehatan Ayam dan Manajemen Penyakit</h3>
<p>Ayam yang sakit makan lebih banyak namun pertumbuhannya stagnan. Program vaksinasi yang tepat dan biosekuriti ketat adalah investasi untuk menjaga FCR di angka ideal.</p>

<h3>5. Kualitas Air Minum</h3>
<p>Air minum yang terkontaminasi atau pH tidak sesuai (ideal pH 6,5–7,5) mempengaruhi nafsu makan dan penyerapan nutrisi. Cek kualitas air minimal setiap awal siklus.</p>

<h2>5 Tips Praktis Menurunkan FCR dengan Pencatatan Harian</h2>
<ol>
  <li><strong>Timbang konsumsi pakan setiap hari</strong> — jangan estimasi. Selisih 50 kg pakan per hari yang tidak tercatat akan merusak perhitungan FCR akhir siklus.</li>
  <li><strong>Timbang sampel ayam 3x seminggu</strong> — minimal 50 ekor per kandang. Ini membantu deteksi dini jika pertumbuhan melambat.</li>
  <li><strong>Catat mortalitas harian dengan penyebab</strong> — pola kematian yang berulang pada hari yang sama atau bagian kandang yang sama adalah indikasi masalah teknis.</li>
  <li><strong>Bandingkan FCR mingguan dengan target</strong> — jangan tunggu panen untuk tahu FCR. Intervensi lebih awal = dampak lebih besar.</li>
  <li><strong>Analisis FCR per batch, bukan per tahun</strong> — perbandingkan FCR antar siklus untuk mengidentifikasi pola musiman atau perubahan supplier pakan.</li>
</ol>

<h2>Kenapa Banyak Peternak Tidak Tahu FCR Kandang Sendiri?</h2>
<p>Realita lapangan: sebagian besar peternak mandiri tidak memiliki sistem pencatatan yang memadai. Pakan dicatat di buku tulis, bobot ayam diperkirakan, dan FCR baru dihitung setelah panen — sering kali tidak akurat karena data yang hilang atau tidak konsisten. Akibatnya, masalah pada FCR baru terdeteksi terlambat dan tidak bisa diintervensi lagi.</p>
<p>Solusinya adalah sistem pencatatan digital yang memudahkan input data harian langsung dari kandang, menghitung FCR secara otomatis, dan menampilkan alert jika FCR mulai menyimpang dari target.</p>

<div class="blog-cta">
  <p>📊 <strong>Hitung FCR kandang Anda secara otomatis, pantau perkembangan tiap hari, dan dapatkan alert sebelum terlambat.</strong></p>
  <a href="/register">→ Coba TernakOS Gratis Sekarang</a>
</div>
`,
  },

  {
    slug: 'cara-hitung-indeks-performa-ayam-broiler',
    title: 'Indeks Performa (IP) Ayam Broiler: Rumus, Standar, dan Cara Meningkatkannya',
    metaTitle: 'Indeks Performa Ayam Broiler: Rumus & Standar IP',
    metaDescription: 'Pahami Indeks Performa (IP) ayam broiler secara lengkap: rumus, klasifikasi nilai IP, dan 5 cara konkret meningkatkan performa kandang Anda.',
    category: 'peternak',
    tags: ['indeks performa', 'IP broiler', 'performa kandang', 'FCR', 'peternak mandiri'],
    publishedAt: '2026-04-13',
    readTime: 6,
    excerpt: 'Indeks Performa (IP) adalah satu angka yang merangkum seluruh performa kandang broiler Anda: bobot, kecepatan tumbuh, mortalitas, dan FCR. Pelajari cara menghitung dan meningkatkannya.',
    image: '/blog-indeks-performa-ayam.jpg',
    relatedSlugs: ['cara-hitung-fcr-ayam-broiler', 'cara-mengurangi-angka-kematian-ayam-broiler'],
    content: `
<h2>Apa Itu Indeks Performa (IP) Ayam Broiler?</h2>
<p>Indeks Performa (IP) — atau sering disebut <em>Performance Index</em> atau <em>Production Efficiency Factor (PEF)</em> — adalah satu angka tunggal yang merangkum keseluruhan efisiensi produksi kandang broiler Anda dalam satu siklus. Berbeda dengan FCR yang hanya mengukur efisiensi pakan, IP menggabungkan empat variabel sekaligus: bobot rata-rata panen, livability (tingkat hidup), FCR, dan umur panen.</p>
<p>Inilah mengapa IP digunakan secara luas oleh integrator, kemitraan, dan peternak profesional sebagai acuan evaluasi performa. Nilai IP tinggi = kandang efisien = keuntungan lebih besar.</p>

<h2>Rumus Indeks Performa (IP) Ayam Broiler</h2>
<blockquote>
  <strong>IP = (Bobot Rata-rata Panen × Livability) ÷ (FCR × Umur Panen × 100)</strong>
</blockquote>
<p>Di mana:</p>
<ul>
  <li><strong>Bobot rata-rata</strong> = bobot hidup rata-rata ayam saat panen (gram, bukan kg)</li>
  <li><strong>Livability (%)</strong> = persentase ayam yang hidup sampai panen = (Jumlah Panen ÷ Jumlah DOC Masuk) × 100</li>
  <li><strong>FCR</strong> = Feed Conversion Ratio (dari pencatatan pakan ÷ bobot panen)</li>
  <li><strong>Umur panen</strong> = hari ke berapa ayam dipanen</li>
</ul>

<h2>Contoh Perhitungan IP Nyata</h2>
<p>Ambil data dari kandang yang sama seperti contoh artikel FCR:</p>
<ul>
  <li>Bobot rata-rata panen: 1.850 gram</li>
  <li>DOC masuk: 5.000 ekor, panen 4.925 ekor → Livability = 98,5%</li>
  <li>FCR: 1,70</li>
  <li>Umur panen: 32 hari</li>
</ul>
<blockquote>
  IP = (1.850 × 98,5) ÷ (1,70 × 32 × 100)<br />
  IP = 182.225 ÷ 5.440<br />
  <strong>IP = 335</strong>
</blockquote>

<h2>Klasifikasi Nilai IP: Jelek, Cukup, Baik, Sangat Baik</h2>
<table>
  <thead><tr><th>Nilai IP</th><th>Klasifikasi</th><th>Catatan</th></tr></thead>
  <tbody>
    <tr><td>&lt; 300</td><td>❌ Jelek</td><td>Ada masalah serius di kandang (FCR tinggi, mortalitas tinggi, atau bobot rendah)</td></tr>
    <tr><td>300 – 325</td><td>⚠️ Cukup</td><td>Di bawah rata-rata; perlu identifikasi titik lemah</td></tr>
    <tr><td>325 – 375</td><td>✅ Baik</td><td>Performa normal kandang komersial yang dikelola dengan baik</td></tr>
    <tr><td>&gt; 375</td><td>🏆 Sangat Baik</td><td>Performa top — biasanya dicapai closed house dengan manajemen ketat</td></tr>
  </tbody>
</table>
<p>IP 335 dari contoh di atas masuk kategori <strong>Baik</strong> — sudah layak profit, tapi masih ada ruang untuk perbaikan.</p>

<h2>Cara Meningkatkan IP Kandang Broiler Anda</h2>

<h3>1. Tekan FCR dengan Manajemen Pakan yang Ketat</h3>
<p>FCR adalah komponen IP yang paling bisa diintervensi langsung. Pastikan pemberian pakan tidak terbuang sia-sia: tinggi tempat pakan disesuaikan umur ayam, transisi program pakan dilakukan tepat waktu, dan tidak ada sisa pakan basah yang tercecer.</p>

<h3>2. Jaga Livability di Atas 97%</h3>
<p>Setiap ekor yang mati mengurangi angka livability dan menurunkan IP langsung. Program brooding yang tepat di 7 hari pertama adalah kuncinya — 60–70% mortalitas terjadi di fase brooding. Pastikan suhu brooding konsisten (32–34°C di hari 1), tanpa draft angin, dan air bersih tersedia sejak DOC masuk.</p>

<h3>3. Optimalkan Bobot Panen dengan Panen Bertahap</h3>
<p>Jangan tunggu semua ayam seragam untuk dipanen. Lakukan panen bertahap: panen dulu ayam dengan bobot target, sisakan yang lebih kecil untuk tumbuh lebih lanjut. Ini meningkatkan bobot rata-rata dan mengurangi kepadatan kandang di akhir siklus.</p>

<h3>4. Percepat Umur Panen dengan Nutrisi Optimal</h3>
<p>Umur panen yang lebih pendek dengan bobot yang sama artinya IP lebih tinggi. Pakan finisher berkualitas tinggi (protein 19–20%, energi 3.100 kcal/kg) di 7–10 hari terakhir sangat berpengaruh pada kecepatan penambahan bobot.</p>

<h3>5. Pantau IP setiap Mingguan, Bukan Hanya di Akhir Siklus</h3>
<p>IP bisa diproyeksikan mingguan menggunakan data yang sudah ada. Jika IP proyeksi minggu ke-3 sudah di bawah target, masih ada waktu untuk intervensi — tambah pakan, perbaiki ventilasi, atau hubungi petugas kesehatan hewan.</p>

<h2>Hubungan Antara IP dan Keuntungan Peternak</h2>
<p>Riset di lapangan menunjukkan bahwa peningkatan IP sebesar 50 poin (misalnya dari 300 ke 350) dalam kandang 5.000 ekor dapat menghasilkan tambahan pendapatan bersih <strong>Rp 3–7 juta per siklus</strong>, tergantung harga jual dan biaya produksi lokal. Dalam setahun dengan 5–6 siklus, selisih ini bisa mencapai <strong>Rp 15–42 juta</strong> — hanya dari perbaikan manajemen, tanpa tambahan modal.</p>

<div class="blog-cta">
  <p>📈 <strong>Pantau IP kandang Anda secara real-time dengan TernakOS. Input data harian, lihat proyeksi IP, dan dapatkan rekomendasi perbaikan otomatis.</strong></p>
  <a href="/register">→ Coba TernakOS Gratis Sekarang</a>
</div>
`,
  },

  {
    slug: 'cara-mengurangi-angka-kematian-ayam-broiler',
    title: '7 Cara Efektif Mengurangi Angka Kematian (Mortality) Ayam Broiler',
    metaTitle: '7 Cara Kurangi Kematian Ayam Broiler yang Terbukti',
    metaDescription: 'Angka kematian ayam broiler tinggi? Pelajari 7 langkah konkret berdasarkan praktik lapangan untuk menekan mortalitas dan meningkatkan profitabilitas kandang.',
    category: 'peternak',
    tags: ['mortalitas ayam', 'kematian ayam broiler', 'penyakit broiler', 'biosekuriti kandang'],
    publishedAt: '2026-04-13',
    readTime: 8,
    excerpt: 'Angka kematian ayam broiler yang tinggi bukan hanya masalah kemanusiaan — ini langsung menghantam profitabilitas kandang. Artikel ini membahas 7 langkah konkret yang bisa diterapkan hari ini.',
    image: '/blog-mortality-ayam-broiler.jpg',
    relatedSlugs: ['cara-hitung-indeks-performa-ayam-broiler', 'tips-manajemen-kandang-ayam-broiler-pemula'],
    content: `
<h2>Berapa Angka Mortality Normal Ayam Broiler?</h2>
<p>Mortality atau angka kematian adalah persentase ayam yang mati selama satu siklus produksi. Pada kandang yang dikelola dengan baik, angka kematian normal broiler adalah <strong>2–4% per siklus</strong> (sekitar 30–35 hari). Bergantung pada sistem kandang:</p>
<ul>
  <li><strong>Open house</strong>: Toleransi mortality 3–5%</li>
  <li><strong>Closed house modern</strong>: Target mortality &lt;2%</li>
</ul>
<p>Jika mortality Anda secara konsisten di atas 5%, itu sinyal ada masalah sistemik yang perlu ditangani segera — bukan sekadar "nasib".</p>

<h2>Penyebab Utama Kematian Ayam Broiler</h2>

<h3>1. Manajemen Brooding yang Buruk (7 Hari Pertama)</h3>
<p>Statistik menunjukkan 60–70% kematian dalam satu siklus terjadi di 7 hari pertama. DOC (Day Old Chick) sangat rentan terhadap suhu tidak menentu, draft angin, dan dehidrasi. Suhu brooding yang tidak konsisten — terlalu panas atau terlalu dingin — adalah pembunuh utama di fase ini.</p>

<h3>2. Penyakit Pernapasan dan Infeksi Bakteri</h3>
<p>Newcastle Disease (ND), Infectious Bronchitis (IB), dan infeksi <em>E. coli</em> menyumbang mortalitas terbesar di luar fase brooding. Umumnya dipicu oleh biosekuriti yang lemah, vaksinasi yang tidak tepat, atau kualitas DOC yang buruk dari hatchery.</p>

<h3>3. Heat Stress (Stres Panas)</h3>
<p>Di Indonesia dengan iklim tropis, heat stress adalah ancaman nyata, terutama di musim kemarau. Ayam broiler mulai mengalami heat stress pada suhu &gt;30°C, dengan gejala nafas ngos-ngosan, napsu makan turun, dan akhirnya kematian mendadak pada minggu ke-4 dan 5.</p>

<h3>4. Kualitas Air Minum yang Buruk</h3>
<p>Air yang terkontaminasi bakteri atau mengandung mineral berlebih menyebabkan diare, dehidrasi, dan melemahkan sistem imun ayam secara keseluruhan.</p>

<h2>7 Langkah Konkret Mengurangi Mortality Broiler</h2>

<h3>Langkah 1: Validasi Kualitas DOC Sebelum Chick-in</h3>
<p>Kematian akibat DOC berkualitas buruk tidak bisa dicegah setelah ayam masuk kandang. Evaluasi DOC dari hatchery: berat DOC harus 38–42 gram, kaki basah berarti dehidrasi, pusar tidak menutup sempurna berarti ada infeksi bakteri. Jika ada tanda meragukan, reklamasi sebelum diterima.</p>

<h3>Langkah 2: Setting Brooding yang Presisi</h3>
<p>Suhu brooding (bukan suhu kandang secara umum) harus mencapai 32–34°C tepat di area populasi di Hari 1. Gunakan termometer digtal, bukan perasa. Turunkan suhu secara bertahap 1°C setiap 2–3 hari. Tanda ayam nyaman: tersebar merata di bawah cakupan pemanas, bukan bergerombol (kedinginan) atau menghindari pemanas (kepanasan).</p>

<h3>Langkah 3: Program Vaksinasi yang Tepat Waktu</h3>
<p>Jadwal vaksinasi dasar yang umum digunakan di lapangan:</p>
<ul>
  <li>Hari 1–4: Vaksin ND (Newcastle Disease) via tetes mata/air minum</li>
  <li>Hari 10–14: Vaksin Gumboro via air minum</li>
  <li>Hari 18–21: Vaksin ND booster</li>
</ul>
<p>Pastikan ayam tidak stres sebelum vaksinasi (jangan saat panas terik) dan air minum bersih tanpa klorin minimal 2 jam sebelum vaksinasi via air minum.</p>

<h3>Langkah 4: Biosekuriti Ketat — Tidak Ada Kompromi</h3>
<p>Biosekuriti adalah penghalang fisik antara patogen dan kandang Anda. Minimum yang harus ada: desinfektan di pintu masuk, pakaian kandang terpisah, larangan pengunjung tanpa izin, dan desinfeksi kendaraan yang masuk area kandang. Satu celah biosekuriti bisa memusnahkan satu siklus penuh.</p>

<h3>Langkah 5: Manajemen Ventilasi Aktif</h3>
<p>Ventilasi yang buruk mengakumulasi amonia dari kotoran, yang merusak saluran pernapasan ayam dan membuka jalan infeksi. Kadar amonia aman di bawah 25 ppm — jika Anda masuk kandang dan mata pedih, itu sudah di atas batas aman. Buka tirai atau tambah exhaust fan terutama di siang hari dan malam panas.</p>

<h3>Langkah 6: Cepat Pisahkan Ayam Sakit</h3>
<p>Tanda-tanda ayam sakit: berdiri terpisah dari kelompok, kepala menunduk, bulu kusam, nafas berat atau berbunyi. Isolasi segera ke kandang karantina — satu ayam sakit yang tidak diisolasi bisa menginfeksi ratusan ekor sebelum Anda menyadarinya.</p>

<h3>Langkah 7: Catat dan Analisis Pola Kematian Setiap Hari</h3>
<p>Ini adalah langkah yang paling sering dilewati tapi paling krusial untuk perbaikan jangka panjang. Catat setiap kematian: tanggal, perkiraan umur ayam, gejala yang terlihat, dan lokasi di kandang. Pola yang sama di hari dan lokasi yang sama biasanya menunjukkan masalah teknis yang bisa diperbaiki, seperti nipple air minum mampet di sudut tertentu atau lubang ventilasi yang tertutup material.</p>

<h2>Pentingnya Recording Harian untuk Deteksi Dini</h2>
<p>Deteksi dini adalah satu-satunya cara untuk mengintervensi masalah sebelum menjadi bencana. Dengan pencatatan harian yang konsisten, Anda bisa melihat tren: jika mortality hari ini 0,1% padahal biasanya 0,03%, itu sinyal untuk langsung cek kondisi kandang, air minum, dan pakan.</p>

<div class="blog-cta">
  <p>📋 <strong>Catat mortality harian, pantau tren, dan dapatkan alert otomatis saat angka mortalitas melampaui batas normal — semuanya ada di TernakOS.</strong></p>
  <a href="/register">→ Coba TernakOS Gratis Sekarang</a>
</div>
`,
  },

  {
    slug: 'tips-manajemen-kandang-ayam-broiler-pemula',
    title: 'Panduan Manajemen Kandang Ayam Broiler untuk Peternak Pemula',
    metaTitle: 'Panduan Manajemen Kandang Ayam Broiler Pemula',
    metaDescription: 'Panduan lengkap manajemen kandang ayam broiler untuk peternak pemula: persiapan chick-in, brooding, pakan, vaksinasi, dan pencatatan harian.',
    category: 'peternak',
    tags: ['manajemen kandang', 'ayam broiler pemula', 'chick-in', 'brooding', 'peternak baru'],
    publishedAt: '2026-04-12',
    readTime: 9,
    excerpt: 'Baru memulai usaha ternak ayam broiler? Panduan ini memandu Anda langkah demi langkah — dari persiapan kandang sebelum DOC masuk hingga pencatatan harian yang wajib dilakukan setiap hari.',
    image: '/blog-manajemen-kandang-pemula.jpg',
    relatedSlugs: ['cara-hitung-fcr-ayam-broiler', 'cara-mengurangi-angka-kematian-ayam-broiler'],
    content: `
<h2>Mengapa Manajemen Kandang Itu Segalanya?</h2>
<p>Di bisnis broiler, Anda tidak bisa "untung-untungan". Dengan margin yang tipis (sering kali 3–8% dari nilai penjualan), satu kesalahan manajemen yang seharusnya bisa dicegah bisa mengubah siklus yang seharusnya untung menjadi rugi. Peternak pemula yang paling sukses bukan yang punya kandang terbesar — tapi yang paling disiplin dalam manajemen sehari-hari.</p>

<h2>Tahap 1: Persiapan Kandang Sebelum Chick-in (7–10 Hari Sebelum DOC Masuk)</h2>

<h3>Bersih Total dan Desinfeksi</h3>
<p>Setelah panen sebelumnya, kandang harus dibersihkan total: semua litter (sekam) lama dibuang, lantai dan dinding dicuci dengan air bertekanan, lalu didesinfeksi dengan desinfektan berbasis fenol atau quaternary ammonium. Biarkan kandang "istirahat" minimal 5–7 hari (periode kosong) sebelum litter baru masuk.</p>

<h3>Litter (Alas Kandang)</h3>
<p>Pasang litter baru — umumnya sekam padi dengan ketebalan 7–10 cm untuk open house, atau 5–7 cm untuk closed house. Litter berfungsi menyerap kotoran, menjaga kehangatan, dan mengurangi kontak ayam dengan feses. Litter yang basah dan menggumpal adalah sumber penyakit utama.</p>

<h3>Setting Pemanas (Brooder)</h3>
<p>Pasang brooder gas atau infra-red minimal 24 jam sebelum DOC masuk agar suhu di area brooding sudah stabil di 32–34°C saat ayam tiba. Jangan menunggu DOC datang baru menyalakan pemanas — suhu ruangan butuh waktu untuk stabil.</p>

<h3>Persiapan Air Minum</h3>
<p>Isi semua tempat minum dengan air bersih dan tambahkan gula merah atau glukosa (2 sendok makan per liter air) untuk memberi energi cepat bagi DOC yang baru tiba setelah perjalanan stres dari hatchery. Sediakan juga vitamin dan elektrolit di air minum hari pertama.</p>

<h2>Tahap 2: Manajemen Brooding (Hari 1–14)</h2>
<p>Fase brooding adalah fase paling kritis. Kesalahan di sini tidak bisa diperbaiki di fase selanjutnya. Fokus utama:</p>

<h3>Suhu Brooding yang Konsisten</h3>
<table>
  <thead><tr><th>Umur (Hari)</th><th>Suhu Target (°C)</th></tr></thead>
  <tbody>
    <tr><td>1–3</td><td>33–34</td></tr>
    <tr><td>4–7</td><td>31–33</td></tr>
    <tr><td>8–14</td><td>29–31</td></tr>
    <tr><td>15–21</td><td>27–29</td></tr>
    <tr><td>22+</td><td>24–27 (ambient)</td></tr>
  </tbody>
</table>

<h3>Luas Brooding dan Kepadatan Awal</h3>
<p>Pada 7 hari pertama, batasi pergerakan DOC di area brooding menggunakan sekat (chick guard), sekitar 40–50 cm dari brooder. Perlebar sekat setiap 2–3 hari seiring pertumbuhan ayam. Kepadatan awal ideal: 40–50 ekor/m² di area brooding.</p>

<h2>Tahap 3: Jadwal Pemberian Pakan dan Air Minum</h2>

<h3>Program Pakan berdasarkan Fase</h3>
<ul>
  <li><strong>Starter (0–10 hari)</strong>: Protein 22–23%, energi 3.000 kcal/kg. Berikan ad libitum (tidak dibatasi).</li>
  <li><strong>Grower (11–21 hari)</strong>: Protein 20–21%, energi 3.050 kcal/kg. Masih ad libitum.</li>
  <li><strong>Finisher (22 hari – panen)</strong>: Protein 18–19%, energi 3.100 kcal/kg. Ad libitum, tapi pantau FCR ketat.</li>
</ul>

<h3>Air Minum</h3>
<p>Ayam minum 2x lebih banyak dari yang mereka makan (rasio air:pakan = 2:1). Pastikan nipple atau tempat minum selalu terisi dan berfungsi. Cek setiap pagi dan sore — satu nipple mampet di pojok kandang bisa menyebabkan ayam di area tersebut dehidrasi tanpa Anda tahu.</p>

<h2>Tahap 4: Jadwal Vaksinasi dan Biosekuriti Dasar</h2>
<p>Program vaksinasi standar untuk broiler komersial (konsultasikan dengan dokter hewan atau PPL setempat untuk penyesuaian kondisi lokal):</p>
<ul>
  <li><strong>Hari 3–5</strong>: Vaksinasi ND (Newcastle Disease) via tetes mata</li>
  <li><strong>Hari 10–12</strong>: Vaksinasi Gumboro via air minum</li>
  <li><strong>Hari 18–21</strong>: Vaksinasi ND ulangan via air minum</li>
</ul>

<h2>Tahap 5: Pencatatan Harian yang Wajib Dilakukan</h2>
<p>Ini yang membedakan peternak yang tahu kondisi kandangnya dari yang hanya menebak. Minimal catat setiap hari:</p>
<ul>
  <li>🐔 Jumlah kematian dan penyebab yang terlihat</li>
  <li>🌡️ Suhu kandang pagi dan sore</li>
  <li>🍚 Total pakan terpakai hari ini (per karung)</li>
  <li>🌊 Kondisi air minum (normal, sedikit, ada masalah)</li>
  <li>📝 Catatan khusus (gejala tidak normal, kunjungan dokter hewan, dll)</li>
</ul>
<p>Data-data ini adalah aset bisnis Anda. Peternak yang mencatat dengan benar dapat mengevaluasi setiap siklus, membandingkan performa, dan terus meningkatkan hasilnya.</p>

<div class="blog-cta">
  <p>📱 <strong>Mulai kelola kandang Anda dengan aplikasi khusus peternak Indonesia. Input data harian dalam 2 menit, lihat laporan FCR dan IP secara otomatis.</strong></p>
  <a href="/register">→ Mulai Kelola Kandang dengan TernakOS</a>
</div>
`,
  },

  {
    slug: 'cara-hitung-keuntungan-peternak-ayam-broiler',
    title: 'Cara Menghitung Keuntungan Peternak Ayam Broiler Per Siklus (Rumus Lengkap)',
    metaTitle: 'Cara Hitung Keuntungan Peternak Ayam Broiler',
    metaDescription: 'Pelajari cara menghitung profit bersih peternak ayam broiler per siklus dengan rumus lengkap, contoh nyata 1.000 ekor, dan analisis break even point kandang.',
    category: 'peternak',
    tags: ['keuntungan peternak', 'profit broiler', 'biaya produksi ayam', 'break even point', 'analisis usaha ternak'],
    publishedAt: '2026-04-11',
    readTime: 8,
    excerpt: 'Banyak peternak tidak tahu apakah kandangnya benar-benar untung atau rugi per siklus. Artikel ini membahas seluruh komponen biaya, cara hitung pendapatan, dan rumus profit bersih dengan contoh nyata.',
    image: '/blog-hitung-keuntungan-peternak.png',
    relatedSlugs: ['cara-hitung-fcr-ayam-broiler', 'cara-hitung-indeks-performa-ayam-broiler'],
    content: `
<h2>Kenapa Banyak Peternak Tidak Tahu Untung atau Rugi?</h2>
<p>Ini bukan soal tidak mau menghitung — ini soal sistem yang tidak ada. Sebagian besar peternak mandiri di Indonesia masih mencatat pengeluaran di buku tulis, beberapa bahkan hanya mengandalkan ingatan. Akibatnya, kalkulasi akhir sering tidak akurat karena biaya kecil yang terlupa, pakan yang tidak dicatat detail, atau biaya tenaga kerja yang tidak dianggap sebagai "biaya".</p>
<p>Padahal, dalam bisnis dengan margin setipis broiler, <strong>akurasi perhitungan adalah segalanya</strong>. Anda tidak bisa meningkatkan apa yang tidak Anda ukur.</p>

<h2>Komponen Biaya Produksi Ayam Broiler</h2>
<p>Ada dua kategori biaya: biaya langsung (variable cost) dan biaya tidak langsung (fixed cost).</p>

<h3>Biaya Variabel (per siklus)</h3>
<ul>
  <li><strong>DOC (Day Old Chick)</strong>: Biasanya 50–65% dari harga jual DOC. Ini komponen biaya terbesar kedua setelah pakan.</li>
  <li><strong>Pakan</strong>: Komponen terbesar, 65–70% dari total biaya. Harga bervariasi per wilayah dan kemitraan.</li>
  <li><strong>Obat, vaksin, vitamin</strong>: Biasanya 2–5% dari total biaya. Jangan dipangkas — investasi di sini mencegah kerugian besar dari wabah penyakit.</li>
  <li><strong>Sekam dan bahan litter</strong>: Sekitar 1–2% dari total biaya.</li>
  <li><strong>Bahan bakar (LPG/gas untuk brooding)</strong>: Tergantung musim dan ukuran kandang.</li>
  <li><strong>Listrik</strong>: Terutama untuk closed house dengan exhaust fan.</li>
  <li><strong>Tenaga kerja harian</strong>: Sering dilupakan oleh peternak yang mengerjakan sendiri. Hitung dengan upah minimum regional sebagai acuan.</li>
</ul>

<h3>Biaya Tetap (diamortisasi per siklus)</h3>
<ul>
  <li>Penyusutan kandang dan peralatan (biasanya 10–20 tahun)</li>
  <li>Biaya sewa lahan (jika tidak milik sendiri)</li>
  <li>Biaya asuransi atau cicilan modal (jika ada)</li>
</ul>

<h2>Contoh Nyata Perhitungan 1.000 Ekor Broiler</h2>
<p><em>Catatan: Harga di bawah ini adalah ilustrasi — harga aktual bervariasi signifikan per wilayah dan waktu. Gunakan harga pasar lokal Anda untuk kalkulasi akurat.</em></p>

<h3>Asumsi Data:</h3>
<ul>
  <li>Populasi DOC masuk: 1.000 ekor</li>
  <li>Mortalitas: 2,5% → panen 975 ekor</li>
  <li>Umur panen: 32 hari</li>
  <li>Bobot rata-rata panen: 1,85 kg/ekor</li>
  <li>Total bobot panen: 975 × 1,85 = <strong>1.803,75 kg</strong></li>
  <li>FCR: 1,70 → Total pakan: 1.803,75 × 1,70 = <strong>3.066,4 kg pakan</strong></li>
</ul>

<h3>Rincian Biaya (Contoh):</h3>
<table>
  <thead><tr><th>Komponen Biaya</th><th>Satuan</th><th>Jumlah</th><th>Total (Rp)</th></tr></thead>
  <tbody>
    <tr><td>DOC 1.000 ekor</td><td>Rp 7.500/ekor</td><td>1.000</td><td>7.500.000</td></tr>
    <tr><td>Pakan 3.066 kg</td><td>Rp 8.200/kg</td><td>3.066</td><td>25.141.200</td></tr>
    <tr><td>Obat & Vaksin</td><td>Rp 1.000/ekor</td><td>1.000</td><td>1.000.000</td></tr>
    <tr><td>Sekam & Litter</td><td>Lump sum</td><td>—</td><td>350.000</td></tr>
    <tr><td>Gas LPG Brooding</td><td>Lump sum</td><td>—</td><td>400.000</td></tr>
    <tr><td>Tenaga Kerja (32 hari × Rp 50rb)</td><td>—</td><td>—</td><td>1.600.000</td></tr>
    <tr><td>Penyusutan Kandang</td><td>Per siklus</td><td>—</td><td>500.000</td></tr>
    <tr><td colspan="3"><strong>TOTAL BIAYA PRODUKSI</strong></td><td><strong>Rp 36.491.200</strong></td></tr>
  </tbody>
</table>

<h3>Pendapatan:</h3>
<ul>
  <li>Harga jual live bird: Rp 21.500/kg</li>
  <li>Total pendapatan: 1.803,75 kg × Rp 21.500 = <strong>Rp 38.780.625</strong></li>
</ul>

<h3>Profit Bersih:</h3>
<blockquote>
  <strong>Profit = Pendapatan − Total Biaya</strong><br />
  Profit = Rp 38.780.625 − Rp 36.491.200 = <strong>Rp 2.289.425</strong>
</blockquote>
<p>Margin bersih: sekitar <strong>5,9%</strong>. Di sinilah pentingnya efisiensi — kenaikan harga pakan Rp 200/kg saja bisa menggerus profit Rp 613.280 (26% dari profit total).</p>

<h2>Analisis Break Even Point (BEP)</h2>
<p>Break even point adalah harga jual minimum agar Anda tidak rugi:</p>
<blockquote>
  <strong>BEP Harga = Total Biaya ÷ Total Bobot Panen</strong><br />
  BEP = Rp 36.491.200 ÷ 1.803,75 kg = <strong>Rp 20.232/kg</strong>
</blockquote>
<p>Artinya, selama harga jual live bird di atas Rp 20.232/kg, kandang Anda masih untung. Jika harga pasar turun di bawah angka ini, Anda rugi — dan harus mengetahui ini sebelum memutuskan menjual atau menahan.</p>

<h2>Cara Meningkatkan Profit Per Siklus</h2>
<p>Dari formula di atas, ada tiga lever yang bisa diputar:</p>
<ol>
  <li><strong>Tekan biaya pakan</strong> dengan menurunkan FCR (lihat artikel FCR kami)</li>
  <li><strong>Tingkatkan bobot rata-rata panen</strong> melalui management nutrisi yang lebih baik</li>
  <li><strong>Kurangi mortality</strong> untuk memaksimalkan jumlah ayam yang bisa dijual</li>
</ol>

<div class="blog-cta">
  <p>💰 <strong>Hitung profit per siklus secara otomatis, pantau biaya real-time, dan dapatkan laporan keuangan kandang tanpa Excel — langsung dari TernakOS.</strong></p>
  <a href="/register">→ Hitung Profit Kandang Anda dengan TernakOS</a>
</div>
`,
  },

  {
    slug: 'cara-hitung-adg-sapi-potong-fattening',
    title: 'Cara Menghitung ADG Sapi Potong Fattening: Rumus, Standar & Tips Praktis',
    metaTitle: 'Cara Hitung ADG Sapi Potong Fattening: Rumus & Standar',
    metaDescription: 'Pelajari cara menghitung Average Daily Gain (ADG) sapi potong fattening dengan benar. Rumus lengkap, standar ADG ideal, dan tips meningkatkan pertambahan bobot harian.',
    category: 'peternak',
    tags: ['ADG', 'sapi potong', 'fattening', 'pertambahan bobot harian', 'manajemen sapi'],
    publishedAt: '2026-05-01',
    readTime: 7,
    excerpt: 'ADG (Average Daily Gain) adalah metrik paling penting dalam usaha penggemukan sapi potong. Artikel ini menjelaskan rumus, standar ideal ADG, dan strategi praktis untuk meningkatkan pertambahan bobot harian sapi Anda.',
    image: null,
    relatedSlugs: ['cara-mengelola-batch-fattening-kambing-domba', 'cara-hitung-fcr-ayam-broiler'],
    content: `
<h2>Apa Itu ADG dan Mengapa Sangat Penting?</h2>
<p>ADG atau <strong>Average Daily Gain</strong> (Pertambahan Bobot Badan Harian / PBBH) adalah ukuran seberapa banyak bobot yang ditambahkan seekor sapi per hari selama periode penggemukan (fattening). Ini adalah angka paling strategis dalam bisnis sapi potong fattening.</p>
<p>Sederhana saja: jika ADG Anda 0,8 kg/hari padahal target 1,0 kg/hari, maka dalam 90 hari periode fattening Anda kehilangan potensi bobot <strong>18 kg per ekor</strong>. Dengan harga sapi Rp 60.000/kg, itu Rp 1,08 juta per ekor yang terbuang — bisa puluhan juta untuk kandang dengan 50+ ekor.</p>

<h2>Rumus ADG Sapi Potong</h2>
<blockquote>
  <strong>ADG = (Bobot Akhir − Bobot Awal) ÷ Jumlah Hari Penggemukan</strong>
</blockquote>
<p><em>Satuan: kg/hari atau gram/hari</em></p>

<h2>Contoh Perhitungan Nyata</h2>
<p>Sapi masuk dengan bobot 250 kg, setelah 90 hari fattening bobot mencapai 370 kg:</p>
<blockquote>
  ADG = (370 − 250) ÷ 90 = 120 ÷ 90 = <strong>1,33 kg/hari</strong>
</blockquote>
<p>Hasil yang sangat baik untuk sapi lokal (PO, Simmental cross, atau Limousin cross).</p>

<h2>Standar ADG Ideal Berdasarkan Breed Sapi</h2>
<table>
  <thead><tr><th>Breed / Jenis Sapi</th><th>ADG Target</th><th>Keterangan</th></tr></thead>
  <tbody>
    <tr><td>Sapi PO (Peranakan Ongole)</td><td>0,6 – 0,9 kg/hari</td><td>Sapi lokal standar, adaptasi baik</td></tr>
    <tr><td>Simmental Cross</td><td>0,9 – 1,2 kg/hari</td><td>Pertumbuhan lebih cepat, butuh pakan berkualitas</td></tr>
    <tr><td>Limousin Cross</td><td>1,0 – 1,4 kg/hari</td><td>Produksi daging tinggi, responsif terhadap pakan</td></tr>
    <tr><td>Brahman Cross</td><td>0,8 – 1,1 kg/hari</td><td>Tahan panas, efisien di iklim tropis</td></tr>
  </tbody>
</table>

<h2>Faktor yang Mempengaruhi ADG Sapi Fattening</h2>

<h3>1. Kualitas dan Formulasi Pakan (Konsentrat + Hijauan)</h3>
<p>Pakan adalah faktor nomor satu. Rasio konsentrat:hijauan yang optimal untuk sapi fattening adalah 60:40 hingga 70:30. Konsentrat harus mengandung protein kasar (PK) minimal 14-16% dan TDN (Total Digestible Nutrients) minimal 70%. Kekurangan energi adalah penyebab paling umum ADG rendah.</p>

<h3>2. Bobot Masuk (Initial Weight)</h3>
<p>Sapi dengan bobot awal 200-300 kg umumnya menunjukkan ADG lebih tinggi dibanding sapi yang sudah terlalu berat (>400 kg). Ini karena sapi yang lebih muda dan lebih ringan memiliki kapasitas pertumbuhan kompensasi yang lebih besar.</p>

<h3>3. Kesehatan dan Stres</h3>
<p>Sapi yang baru masuk kandang butuh 7-14 hari adaptasi (acclimatization period). Selama periode ini ADG bisa rendah atau bahkan negatif — ini normal. Stres karena transportasi, perubahan pakan, atau penyakit subklinis bisa menekan ADG 20-40%.</p>

<h3>4. Manajemen Kandang dan Kepadatan</h3>
<p>Kepadatan standar untuk sapi fattening adalah 2,5-4 m² per ekor. Terlalu padat meningkatkan kompetisi pakan dan stres panas, yang langsung menekan ADG.</p>

<h2>5 Cara Meningkatkan ADG Sapi Fattening</h2>
<ol>
  <li><strong>Timbang secara konsisten</strong> — Minimal setiap 14 hari sekali dengan timbangan digital. Jangan estimasi visual; selisih 10 kg dalam catatan bisa membuat perhitungan ADG dan break even point menjadi tidak akurat.</li>
  <li><strong>Optimalkan formulasi konsentrat</strong> — Konsultasikan dengan nutrisionis atau gunakan formulasi konsentrat yang sudah terbukti untuk breed dan berat sapi Anda.</li>
  <li><strong>Berikan hijauan berkualitas</strong> — Rumput gajah, kolonjono, atau jerami fermentasi (amoniasi) sebagai sumber serat. Kualitas hijauan berpengaruh signifikan terhadap kesehatan rumen.</li>
  <li><strong>Monitor kesehatan rumen</strong> — Bloat (kembung) dan acidosis adalah musuh ADG. Pastikan transisi pakan dilakukan bertahap, dan selalu sediakan garam mineral ad libitum.</li>
  <li><strong>Catat dan analisis per batch</strong> — Bandingkan ADG setiap batch untuk mengidentifikasi pola: breed mana yang lebih responsif, supplier pakan mana yang menghasilkan ADG lebih baik.</li>
</ol>

<h2>Mengapa Banyak Peternak Sapi Tidak Tahu ADG Kandang Mereka?</h2>
<p>Sama seperti peternak broiler yang tidak tahu FCR, sebagian besar peternak sapi di Indonesia tidak menimbang sapi secara konsisten. Alasannya: timbangan sapi mahal, proses penimbangan sulit, dan tidak ada sistem pencatatan yang mudah digunakan di lapangan.</p>
<p>Akibatnya, keputusan jual-beli masih berbasis perkiraan — dan sapi sering dijual di bawah potensi optimalnya, atau ditahan terlalu lama sehingga biaya pakan menggerus margin.</p>

<div class="blog-cta">
  <p>🐄 <strong>Catat bobot sapi per batch, pantau ADG otomatis, dan tahu kapan waktu optimal jual — semuanya tersedia di TernakOS untuk peternak sapi potong.</strong></p>
  <a href="/register">→ Coba TernakOS Gratis untuk Peternak Sapi</a>
</div>
`,
  },

  {
    slug: 'cara-mengelola-batch-fattening-kambing-domba',
    title: 'Panduan Manajemen Batch Fattening Kambing & Domba untuk Peternak Pemula',
    metaTitle: 'Manajemen Batch Fattening Kambing & Domba: Panduan Lengkap',
    metaDescription: 'Panduan lengkap manajemen batch fattening kambing dan domba: target ADG, formula pakan, penimbangan berkala, dan cara menghitung break even point usaha ruminansia kecil.',
    category: 'peternak',
    tags: ['kambing potong', 'domba fattening', 'ADG kambing', 'manajemen batch', 'ruminansia kecil'],
    publishedAt: '2026-05-02',
    readTime: 8,
    excerpt: 'Usaha fattening kambing dan domba semakin populer karena modal awal lebih terjangkau dan siklus lebih pendek dibanding sapi. Panduan ini membahas cara kelola batch fattening kambing/domba dari masuk kandang hingga siap jual.',
    image: null,
    relatedSlugs: ['cara-hitung-adg-sapi-potong-fattening', 'cara-hitung-keuntungan-peternak-ayam-broiler'],
    content: `
<h2>Kenapa Fattening Kambing & Domba Makin Menarik?</h2>
<p>Dalam 5 tahun terakhir, usaha penggemukan (fattening) kambing dan domba di Indonesia mengalami pertumbuhan signifikan. Alasannya jelas:</p>
<ul>
  <li><strong>Modal awal lebih terjangkau</strong> — Harga bakalan kambing/domba Rp 1–3 juta per ekor vs sapi Rp 8–20 juta</li>
  <li><strong>Siklus lebih pendek</strong> — Fattening 60–90 hari vs sapi 3–6 bulan</li>
  <li><strong>Permintaan stabil</strong> — Konsumsi daging kambing/domba tumbuh, terutama menjelang Idul Adha, Idul Fitri, dan acara aqiqah</li>
  <li><strong>Risiko lebih terdiversifikasi</strong> — Dengan 20-30 ekor per batch, risiko kerugian per ekor tidak sebesar sapi</li>
</ul>

<h2>Konsep Dasar: Apa Itu Batch Fattening?</h2>
<p>Batch fattening adalah sistem penggemukan di mana sekelompok kambing/domba dimasukkan ke kandang pada waktu yang sama, dibesarkan bersama, dan dijual dalam satu periode tertentu. Berbeda dengan sistem continuous (masuk-keluar bergantian), batch memudahkan manajemen pakan, kesehatan, dan perhitungan break even per kelompok.</p>

<h2>Standar ADG Kambing & Domba Fattening</h2>
<table>
  <thead><tr><th>Jenis Ternak</th><th>ADG Target</th><th>Catatan</th></tr></thead>
  <tbody>
    <tr><td>Kambing PE (Peranakan Etawa)</td><td>80 – 120 gram/hari</td><td>Lebih lambat, nilai jual tinggi</td></tr>
    <tr><td>Kambing Kacang</td><td>60 – 90 gram/hari</td><td>Lokal, tahan kondisi ekstrem</td></tr>
    <tr><td>Kambing Boer Cross</td><td>150 – 200 gram/hari</td><td>ADG tertinggi, responsif pakan berkualitas</td></tr>
    <tr><td>Domba Lokal (Ekor Tipis)</td><td>70 – 100 gram/hari</td><td>Paling umum di Jawa Barat & Jawa Tengah</td></tr>
    <tr><td>Domba Garut</td><td>80 – 120 gram/hari</td><td>Nilai jual premium, diminati untuk qurban</td></tr>
    <tr><td>Domba Merino Cross</td><td>120 – 180 gram/hari</td><td>Pertumbuhan cepat, cocok untuk fattening intensif</td></tr>
  </tbody>
</table>

<h2>Tahapan Manajemen Batch Fattening (60–90 Hari)</h2>

<h3>Minggu 1–2: Adaptasi (Acclimatization)</h3>
<p>Ini fase paling kritis yang sering diabaikan. Kambing/domba baru masuk mengalami stres transportasi dan perubahan lingkungan. Yang harus dilakukan:</p>
<ul>
  <li>Berikan air bersih + elektrolit selama 24 jam pertama</li>
  <li>Mulai dengan hijauan saja (rumput + legum), belum berikan konsentrat penuh</li>
  <li>Observasi napsu makan, konsistensi feses, dan tanda penyakit</li>
  <li>Lakukan vaksinasi dan obat cacing (antelmintik) di hari ke-3 hingga ke-5</li>
  <li>Timbang bobot awal (bobot masuk) sebagai baseline ADG</li>
</ul>
<p>ADG di fase ini bisa rendah atau bahkan negatif — ini normal selama tidak ada gejala penyakit.</p>

<h3>Minggu 3–8: Penggemukan Intensif (Growing Phase)</h3>
<p>Ini fase utama pertumbuhan. Porsi konsentrat ditingkatkan secara bertahap hingga 40–60% dari total asupan bahan kering:</p>
<ul>
  <li><strong>Hijauan</strong>: Rumput gajah, kolonjono, atau jerami fermentasi — 2–3 kg/ekor/hari (segar)</li>
  <li><strong>Konsentrat</strong>: Dedak padi, bungkil kedelai, jagung giling + mineral — 0,3–0,5 kg/ekor/hari</li>
  <li><strong>Timbang setiap 14 hari</strong> untuk monitor ADG aktual vs target</li>
</ul>

<h3>Minggu 9–12: Finishng & Penentuan Waktu Jual</h3>
<p>Bobot penjualan optimal untuk kambing/domba fattening:</p>
<ul>
  <li>Kambing potong reguler: 25–35 kg bobot hidup</li>
  <li>Domba qurban: minimal 23–25 kg bobot hidup (usia minimal 1 tahun)</li>
  <li>Kambing aqiqah: 20–28 kg bobot hidup</li>
</ul>
<p>Jangan tahan terlalu lama setelah target bobot tercapai — pertumbuhan melambat setelah bobot optimal, biaya pakan terus berjalan, dan margin mengecil.</p>

<h2>Cara Hitung Break Even Point per Batch</h2>
<p>Contoh untuk batch 20 ekor kambing kacang, 75 hari fattening:</p>
<table>
  <thead><tr><th>Komponen Biaya</th><th>Total (Rp)</th></tr></thead>
  <tbody>
    <tr><td>Bakalan 20 ekor × Rp 1.500.000</td><td>30.000.000</td></tr>
    <tr><td>Pakan 75 hari × 20 ekor × Rp 8.000/hari</td><td>12.000.000</td></tr>
    <tr><td>Obat, vaksin, mineral</td><td>800.000</td></tr>
    <tr><td>Tenaga kerja & operasional</td><td>1.500.000</td></tr>
    <tr><td><strong>Total Biaya</strong></td><td><strong>44.300.000</strong></td></tr>
  </tbody>
</table>
<p>Dengan ADG 80 gram/hari, bobot bertambah 6 kg per ekor. Bakalan rata-rata 15 kg → panen 21 kg:</p>
<blockquote>
  <strong>BEP = Rp 44.300.000 ÷ (20 ekor × 21 kg) = Rp 105.476/kg bobot hidup</strong>
</blockquote>
<p>Jika harga pasar kambing Rp 130.000–150.000/kg, margin per batch sekitar <strong>Rp 10–18 juta</strong>.</p>

<h2>Pentingnya Pencatatan Batch yang Terstruktur</h2>
<p>Tanpa pencatatan yang baik, Anda tidak akan tahu:</p>
<ul>
  <li>Batch mana yang paling menguntungkan (dan mengapa)</li>
  <li>Breed atau supplier bakalan mana yang menghasilkan ADG terbaik</li>
  <li>Apakah biaya pakan per batch masih dalam batas wajar</li>
  <li>Kapan waktu optimal untuk menjual berdasarkan ADG aktual</li>
</ul>

<div class="blog-cta">
  <p>🐐 <strong>Kelola batch fattening kambing & domba Anda dengan sistem pencatatan digital — pantau ADG, biaya pakan, dan profit per batch secara real-time di TernakOS.</strong></p>
  <a href="/register">→ Coba TernakOS Gratis untuk Peternak Kambing & Domba</a>
</div>
`,
  },
];

/**
 * Helper functions
 */

/** Ambil semua artikel, diurutkan dari terbaru */
export function getAllPosts() {
  return [...blogPosts].sort((a, b) => new Date(b.publishedAt) - new Date(a.publishedAt));
}

/** Ambil artikel berdasarkan slug */
export function getPostBySlug(slug) {
  return blogPosts.find(p => p.slug === slug) ?? null;
}

/** Ambil artikel terkait berdasarkan daftar slug */
export function getRelatedPosts(slugs = []) {
  return slugs.map(s => getPostBySlug(s)).filter(Boolean);
}

/** Ambil semua kategori unik */
export function getCategories() {
  const cats = [...new Set(blogPosts.map(p => p.category))];
  return cats;
}

/** Format tanggal ke Bahasa Indonesia */
export function formatDate(dateStr) {
  return new Date(dateStr).toLocaleDateString('id-ID', {
    day: 'numeric', month: 'long', year: 'numeric',
  });
}
