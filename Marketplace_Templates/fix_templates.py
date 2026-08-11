import sys, openpyxl, os

sys.stdout.reconfigure(encoding='utf-8')
folder = os.path.dirname(os.path.abspath(__file__))

category_val = 'Bahan Makanan & Peralatan Memasak Pokok/Bumbu, Rempah & Bumbu'
brand_val = 'ANAK BAWANG (7281216625536829189)'
# Image links (10 exact hosted links provided by user, formatted with clean &width= parameters)
img_1 = 'https://p16-oec-sg.ibyteimg.com/tos-alisg-i-aphluv4xwc-sg/8667f913426f43e681dc277948e3d2cb~tplv-aphluv4xwc-origin-jpeg.jpeg?dr=15568&t=555f072d&ps=933b5bde&shp=5563f2fb&shcp=9cd7d13a&idc=my&from=1432613627&width=1152&height=928'
img_2 = 'https://p16-oec-sg.ibyteimg.com/tos-alisg-i-aphluv4xwc-sg/b9202d8d528746c3a430015e72ef7d75~tplv-aphluv4xwc-origin-jpeg.jpeg?dr=15568&t=555f072d&ps=933b5bde&shp=5563f2fb&shcp=9cd7d13a&idc=my&from=1432613627&width=706&height=883'
img_3 = 'https://p16-oec-sg.ibyteimg.com/tos-alisg-i-aphluv4xwc-sg/a5fec290d4a04fd58acfe069bb36a81c~tplv-aphluv4xwc-origin-jpeg.jpeg?dr=15568&t=555f072d&ps=933b5bde&shp=5563f2fb&shcp=9cd7d13a&idc=my&from=1432613627&width=827&height=1024'
img_4 = 'https://p16-oec-sg.ibyteimg.com/tos-alisg-i-aphluv4xwc-sg/9c0e9cd800ee4e0ab58d15e3607db3cc~tplv-aphluv4xwc-origin-jpeg.jpeg?dr=15568&t=555f072d&ps=933b5bde&shp=5563f2fb&shcp=9cd7d13a&idc=my&from=1432613627&width=472&height=591'
img_5 = 'https://p16-oec-sg.ibyteimg.com/tos-alisg-i-aphluv4xwc-sg/7d3af246c7f743e88af232ee8e59149b~tplv-aphluv4xwc-origin-jpeg.jpeg?dr=15568&t=555f072d&ps=933b5bde&shp=5563f2fb&shcp=9cd7d13a&idc=my&from=1432613627&width=928&height=1152'
img_6 = 'https://p16-oec-sg.ibyteimg.com/tos-alisg-i-aphluv4xwc-sg/9f2da7af5d284e60b4137423cc5466e3~tplv-aphluv4xwc-origin-jpeg.jpeg?dr=15568&t=555f072d&ps=933b5bde&shp=5563f2fb&shcp=9cd7d13a&idc=my&from=1432613627&width=1152&height=928'
img_7 = 'https://p16-oec-sg.ibyteimg.com/tos-alisg-i-aphluv4xwc-sg/15de8a93de9242f4aa872839a4c85cca~tplv-aphluv4xwc-origin-jpeg.jpeg?dr=15568&t=555f072d&ps=933b5bde&shp=5563f2fb&shcp=9cd7d13a&idc=my&from=1432613627&width=896&height=1152'
img_8 = 'https://p16-oec-sg.ibyteimg.com/tos-alisg-i-aphluv4xwc-sg/70468aa36b4b424e8b72de189d5debb1~tplv-aphluv4xwc-origin-jpeg.jpeg?dr=15568&t=555f072d&ps=933b5bde&shp=5563f2fb&shcp=9cd7d13a&idc=my&from=1432613627&width=1024&height=1024'
img_9 = 'https://p16-oec-sg.ibyteimg.com/tos-alisg-i-aphluv4xwc-sg/b66237c51200416fa57a3f2339d5123f~tplv-aphluv4xwc-origin-jpeg.jpeg?dr=15568&t=555f072d&ps=933b5bde&shp=5563f2fb&shcp=9cd7d13a&idc=my&from=1432613627&width=1152&height=928'

img_halal = 'https://p16-oec-sg.ibyteimg.com/tos-alisg-i-aphluv4xwc-sg/682673caccfe4566a6ac05c7ab50dc5e~tplv-aphluv4xwc-origin-jpeg.jpeg?dr=15568&t=555f072d&ps=933b5bde&shp=5563f2fb&shcp=9cd7d13a&idc=my&from=1432613627&width=662&height=925'
img_bpom = 'https://p16-oec-sg.ibyteimg.com/tos-alisg-i-aphluv4xwc-sg/e89ee9c936ed074f66f02ec1b26facd3.jpg~tplv-aphluv4xwc-origin-jpeg.jpeg?dr=15568&t=555f072d&ps=933b5bde&shp=2c1af732&shcp=f6476455&idc=my&from=739964722'
img_sni = 'https://p16-oec-sg.ibyteimg.com/tos-alisg-i-aphluv4xwc-sg/9ba19556a6e4ebdcf082d98bef3b60d3.jpg~tplv-aphluv4xwc-origin-jpeg.jpeg?dr=15568&t=555f072d&ps=933b5bde&shp=2c1af732&shcp=f6476455&idc=my&from=739964722'

desc_murni = '''🌿 HALAL CERTIFIED | ID33110018517710724 | P-IRT : 2093309010181-28

🔥 BAWANG MERAH GORENG MURNI BOYOLALI — JURAGAN BY ANAK BAWANG 🔥
100% Bawang Merah Utuh Pilihan, Tanpa Tepung, Renyah Kriuk & Bebas Minyak Berlebih!

Dibuat dari 100% Bawang Merah Pilihan khas Boyolali kualitas Super Premium yang digoreng sempurna dan diproses dengan teknologi PENIRIS MINYAK (Spinner) — menghasilkan tekstur kriuk krispi, aroma harum wangi alami, tanpa rasa pahit, dan renyah lebih tahan lama!

🌟 KEUNGGULAN JURAGAN BY ANAK BAWANG (MURNI 100%):
✅ 100% Bawang Merah Asli Boyolali (Bentuk Utuh, Tanpa Tepung)
✅ Renyah & Kriuk Maksimal (Diproses Peniris Minyak Otomatis)
✅ Rasa Gurih Alami & Aroma Harum Tajam khas Boyolali
✅ Tanpa Pengawet | Tanpa Pewarna Buatan | Tanpa MSG Tambahan
✅ Bersertifikat HALAL Resmi Kemenag & Terdaftar PIRT Dinkes
✅ Kemasan Ziplock Premium — Kedap Udara & Praktis

🍲 COCOK UNTUK: Soto, Bakso, Gulai, Sup, Nasi Goreng, Mie & Lauk Harian!

📦 PILIHAN UKURAN:
🔹 100 Gram — Ukuran Coba / Bekal Praktis
🔹 150 Gram — Kemasan Ritel Hemat
🔹 250 Gram — Hemat Keluarga (PALING TERLARIS! ⭐)
🔹 500 Gram — Stok Dapur / Semi-Grosir (Lebih Hemat!)
🔹 1 Kg   — Grosir Resto, Catering & Stok Bulanan (Super Hemat!)

💡 SARAN PENYIMPANAN:
Simpan di tempat sejuk & kering. Tutup rapat Ziplock setelah dibuka. Tahan hingga 3-6 bulan.

🚚 PENGIRIMAN & GARANSI TOKO:
• Packing Super Aman — Free Bubble Wrap & Kardus Tebal
• Pesanan sebelum Jam 14.00 WIB dikirim hari yang sama
• GARANSI 100% GANTI BARU jika produk rusak (wajib sertakan video unboxing tanpa jeda)

⚠️ PENTING: Volume bawang bisa tampak berkurang karena goncangan pengiriman. BERAT BERSIH SELALU SESUAI TIMBANGAN. Gunakan Kurir Instan/Sameday untuk kondisi terbaik.

#bawanggoreng #bawanggorengmurni #bawanggorengboyolali #bawanggorenghalal #bawangmerahgoreng #juraganbyanakbawang #bawangrenyah #laukpraktis'''

desc_a = '''🌿 HALAL CERTIFIED | ID33110018517710724 | P-IRT : 2093309010181-28

🔥 BAWANG GORENG PREMIUM GRADE A BOYOLALI — JURAGAN BY ANAK BAWANG 🔥
Irisan Pilihan + Tepung Tipis 5% Crispy, Gurih Alami, Harum Wangi & Bebas Minyak Berlebih!

Dibuat dari Bawang Merah Pilihan khas Boyolali dengan racikan tepung tipis 5% krispi yang diproses menggunakan teknologi PENIRIS MINYAK (Spinner) — menghasilkan tekstur super kriuk krispi, gurih pas, tanpa rasa pahit, dan tahan apek!

🌟 KEUNGGULAN JURAGAN BY ANAK BAWANG (GRADE A CRISPY):
✅ Irisan Bawang Merah Pilihan Boyolali dengan Tepung Tipis 5% Crispy
✅ Renyah & Kriuk Ekstra Tahan Lama (Diproses Peniris Minyak Otomatis)
✅ Rasa Gurih Pas & Aroma Harum Khas — Pilihan Ekonomis Berkualitas
✅ Tanpa Pengawet | Tanpa Pewarna Buatan
✅ Bersertifikat HALAL Resmi Kemenag & Terdaftar PIRT Dinkes
✅ Kemasan Ziplock Premium — Kedap Udara & Praktis

🍲 COCOK UNTUK: Soto, Bakso, Gulai, Sup, Nasi Goreng, Mie & Lauk Harian!

📦 PILIHAN UKURAN:
🔹 100 Gram — Ukuran Coba / Bekal Praktis
🔹 150 Gram — Kemasan Ritel Hemat
🔹 250 Gram — Hemat Keluarga (PALING TERLARIS! ⭐)
🔹 500 Gram — Stok Dapur / Semi-Grosir (Lebih Hemat!)
🔹 1 Kg   — Grosir Resto, Catering & Stok Bulanan (Super Hemat!)

💡 SARAN PENYIMPANAN:
Simpan di tempat sejuk & kering. Tutup rapat Ziplock setelah dibuka. Tahan hingga 3-6 bulan.

🚚 PENGIRIMAN & GARANSI TOKO:
• Packing Super Aman — Free Bubble Wrap & Kardus Tebal
• Pesanan sebelum Jam 14.00 WIB dikirim hari yang sama
• GARANSI 100% GANTI BARU jika produk rusak (wajib sertakan video unboxing tanpa jeda)

⚠️ PENTING: Volume bawang bisa tampak berkurang karena goncangan pengiriman. BERAT BERSIH SELALU SESUAI TIMBANGAN. Gunakan Kurir Instan/Sameday untuk kondisi terbaik.

#bawanggoreng #bawanggorenggradea #bawanggorengboyolali #bawanggorenghalal #bawangmerahgoreng #juraganbyanakbawang #bawangrenyah #laukpraktis'''

# Format tuple: (Nama Produk, Varian, Option, Berat_g, Harga_System_Coret, SKU, Deskripsi, Harga_Promo_Jual)
items_murni = [
    ('Bawang Merah Goreng Murni Boyolali Asli Tanpa Tepung - Juragan by Anak Bawang', 'Ukuran Berat', '150 Gram', 200, 59000, 'JBM-150', desc_murni, 42900),
    ('Bawang Merah Goreng Murni Boyolali Asli Tanpa Tepung - Juragan by Anak Bawang', 'Ukuran Berat', '250 Gram', 300, 89500, 'JBM-250', desc_murni, 64900),
    ('Bawang Merah Goreng Murni Boyolali Asli Tanpa Tepung - Juragan by Anak Bawang', 'Ukuran Berat', '500 Gram', 600, 145000, 'JBM-500', desc_murni, 109000),
    ('Bawang Merah Goreng Murni Boyolali Asli Tanpa Tepung - Juragan by Anak Bawang', 'Ukuran Berat', '1 Kg', 1100, 239000, 'JBM-1K', desc_murni, 179000),
    ('[PAKET HEMAT BUNDLING] Bawang Merah Goreng Murni 250g isi 2 Pouch - Juragan by Anak Bawang', 'Paket Hemat', 'Isi 2 Pouch (500g Total)', 600, 179000, 'JBM-PAKET2X250', desc_murni + '\n\n📦 Benefit Paket: Lebih Hemat untuk Stok Dapur Rumah Tangga! Isi 2 Pouch @250g.', 129000),
    ('[PAKET COMBO RUMAHAN] Bawang Merah Goreng Murni Paket 150g + 250g - Juragan by Anak Bawang', 'Paket Combo', 'Combo 150g + 250g (400g Total)', 500, 148500, 'JBM-COMBO150-250', desc_murni + '\n\n📦 Benefit Paket: Kombinasi Pas Kemasan Praktis 150g & Kemasan Sedang 250g.', 105000),
    ('[PAKET SUPER GROSIR KULINER] Bawang Merah Goreng Murni 1 kg (2 Pouch @500g) - Juragan by Anak Bawang', 'Paket Grosir', 'Paket 1 kg (2x 500g)', 1150, 289000, 'JBM-PAKETGROSIR1KG', desc_murni + '\n\n📦 Benefit Paket: Pilihan Utama Pemilik Warung Makan, Soto, Bakso & Catering.', 215000),
    ('[TRIAL PACK LIVE] Bawang Merah Goreng Murni Boyolali 100g - Juragan by Anak Bawang', 'Ukuran Berat', '100 Gram', 140, 39900, 'JBM-100-TRIAL', desc_murni + '\n\n📦 Benefit Paket: Coba Kemasan Praktis 100g 100% Bawang Murni!', 29900),
    ('[SUPLAI RESTORAN & KULINER] Bawang Merah Goreng Murni Boyolali 2 kg Bal PE - Juragan by Anak Bawang', 'Ukuran Berat', '2 Kg (Bal PE)', 2200, 478000, 'JBM-HORECA-2KG', desc_murni + '\n\n📦 Benefit Paket: Hemat Maksimal untuk Restoran, Rumah Makan, & Katering. Bal PE 2 kg.', 349000)
]

items_a = [
    ('Bawang Goreng Halal Premium Grade A Boyolali - Juragan by Anak Bawang', 'Ukuran Berat', '150 Gram', 200, 49900, 'JBA-150', desc_a, 34900),
    ('Bawang Goreng Halal Premium Grade A Boyolali - Juragan by Anak Bawang', 'Ukuran Berat', '250 Gram', 300, 69900, 'JBA-250', desc_a, 49900),
    ('Bawang Goreng Halal Premium Grade A Boyolali - Juragan by Anak Bawang', 'Ukuran Berat', '500 Gram', 600, 119000, 'JBA-500', desc_a, 84900),
    ('Bawang Goreng Halal Premium Grade A Boyolali - Juragan by Anak Bawang', 'Ukuran Berat', '1 Kg', 1100, 199000, 'JBA-1K', desc_a, 149000),
    ('[PAKET HEMAT BUNDLING] Bawang Goreng Halal Premium Grade A 250g isi 2 Pouch - Juragan by Anak Bawang', 'Paket Hemat', 'Isi 2 Pouch (500g Total)', 600, 139900, 'JBA-PAKET2X250', desc_a + '\n\n📦 Benefit Paket: Lebih Hemat untuk Stok Dapur Rumah Tangga! Isi 2 Pouch @250g.', 98900),
    ('[PAKET COMBO RUMAHAN] Bawang Goreng Halal Premium Grade A Paket 150g + 250g - Juragan by Anak Bawang', 'Paket Combo', 'Combo 150g + 250g (400g Total)', 500, 119800, 'JBA-COMBO150-250', desc_a + '\n\n📦 Benefit Paket: Kombinasi Pas Kemasan Praktis 150g & Kemasan Sedang 250g.', 82900),
    ('[PAKET SUPER GROSIR KULINER] Bawang Goreng Halal Premium Grade A 1 kg (2 Pouch @500g) - Juragan by Anak Bawang', 'Paket Grosir', 'Paket 1 kg (2x 500g)', 1150, 238000, 'JBA-PAKETGROSIR1KG', desc_a + '\n\n📦 Benefit Paket: Pilihan Utama Pemilik Warung Makan, Soto, Bakso & Catering.', 168000),
    ('[TRIAL PACK LIVE] Bawang Goreng Halal Premium Grade A Boyolali 100g - Juragan by Anak Bawang', 'Ukuran Berat', '100 Gram', 140, 34900, 'JBA-100-TRIAL', desc_a + '\n\n📦 Benefit Paket: Coba Dulu! Kemasan Mini 100g Tepung 5% Crispy.', 24900),
    ('[SUPLAI RESTORAN & KULINER] Bawang Goreng Halal Premium Grade A Boyolali 2 kg Bal PE - Juragan by Anak Bawang', 'Ukuran Berat', '2 Kg (Bal PE)', 2200, 399000, 'JBA-HORECA-2KG', desc_a + '\n\n📦 Benefit Paket: Hemat Maksimal untuk Rumah Makan, Bakso, Soto & Katering. Bal PE 2 kg.', 289000)
]

def overwrite_template(file_name, items):
    path = os.path.join(folder, file_name)
    wb = openpyxl.load_workbook(path)
    ws = wb['Template']
    
    for idx, item in enumerate(items):
        r = 6 + idx
        prod_name, var_theme, var_option, weight_g, price_coret, sku, desc, price_promo = item
        
        for col in range(1, 48):
            ws.cell(row=r, column=col, value=None)
            
        ws.cell(row=r, column=1, value=category_val)
        ws.cell(row=r, column=2, value=brand_val)
        ws.cell(row=r, column=3, value=prod_name)
        ws.cell(row=r, column=4, value=desc)
        
        # Gambar Galeri Produk (Col 5-13) - 9 Gambar Lengkap
        ws.cell(row=r, column=5, value=img_1)  # Gambar utama -> Foto Studio Pouch
        ws.cell(row=r, column=6, value=img_2)  # Gambar 2 -> Foto Dua Pouch Marmer
        ws.cell(row=r, column=7, value=img_3)  # Gambar 3 -> Kemasan Depan Belakang
        ws.cell(row=r, column=8, value=img_4)  # Gambar 4 -> Saran Penyajian Bakso Soto
        ws.cell(row=r, column=9, value=img_5)  # Gambar 5 -> Saran Penyajian Nasi Goreng
        ws.cell(row=r, column=10, value=img_6) # Gambar 6 -> Flatlay Bahan
        ws.cell(row=r, column=11, value=img_7) # Gambar 7 -> Detail Label PIRT Halal
        ws.cell(row=r, column=12, value=img_8) # Gambar 8 -> Foto Tambahan 8
        ws.cell(row=r, column=13, value=img_9) # Gambar 9 -> Foto Tambahan 9
        
        # Varian
        ws.cell(row=r, column=14, value=var_theme)
        ws.cell(row=r, column=15, value=var_option)
        ws.cell(row=r, column=16, value=img_1)  # Gambar varian utama -> Foto Studio Pouch
        
        ws.cell(row=r, column=19, value=weight_g)
        ws.cell(row=r, column=20, value=15)
        ws.cell(row=r, column=21, value=10)
        ws.cell(row=r, column=22, value=8)
        ws.cell(row=r, column=23, value='Default')
        ws.cell(row=r, column=24, value=price_coret)
        ws.cell(row=r, column=26, value=50)
        ws.cell(row=r, column=27, value=sku)
        ws.cell(row=r, column=28, value=1)
        ws.cell(row=r, column=29, value=None)   # Clear size chart URL (makanan tidak butuh size chart)
        
        # Sertifikat Legalitas (Col 45-47)
        ws.cell(row=r, column=45, value=img_halal)
        ws.cell(row=r, column=46, value=img_bpom)
        ws.cell(row=r, column=47, value=img_sni)
        
    wb.save(path)
    print(f'Successfully updated {file_name}!')

def create_discount_file():
    path = os.path.join(folder, 'Product_Discount_Shopee_TikTok.xlsx')
    wb = openpyxl.Workbook()
    ws = wb.active
    ws.title = 'Discount'
    
    headers = ['Kode SKU', 'Nama Produk', 'Harga Normal / System (Rp)', 'Harga Promo / Jual (Rp)', 'Diskon (%)']
    ws.append(headers)
    
    all_items = items_murni + items_a
    for item in all_items:
        prod_name, var_theme, var_option, weight_g, price_coret, sku, desc, price_promo = item
        disc_pct = round((price_coret - price_promo) / price_coret * 100, 1)
        ws.append([sku, prod_name + f' ({var_option})', price_coret, price_promo, disc_pct])
        
    wb.save(path)
    print('Successfully created Product_Discount_Shopee_TikTok.xlsx!')

overwrite_template('Template_Mass_Upload_Grade_Murni.xlsx', items_murni)
overwrite_template('Template_Mass_Upload_Grade_A.xlsx', items_a)
create_discount_file()
