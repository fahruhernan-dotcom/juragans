import os
import csv
from reportlab.lib.pagesizes import letter
from reportlab.lib import colors
from reportlab.platypus import SimpleDocTemplate, Paragraph, Spacer, Table, TableStyle, HRFlowable
from reportlab.lib.styles import getSampleStyleSheet, ParagraphStyle

def number_to_terbilang(n):
    units = ["", "Satu", "Dua", "Tiga", "Empat", "Lima", "Enam", "Tujuh", "Delapan", "Sembilan", "Sepuluh", "Sebelas"]
    if n < 12:
        return units[n]
    elif n < 20:
        return number_to_terbilang(n - 10) + " Belas"
    elif n < 100:
        return number_to_terbilang(n // 10) + " Puluh " + units[n % 10]
    elif n < 200:
        return "Seratus " + number_to_terbilang(n - 100)
    elif n < 1000:
        return number_to_terbilang(n // 100) + " Ratus " + number_to_terbilang(n % 100)
    elif n < 2000:
        return "Seribu " + number_to_terbilang(n - 1000)
    elif n < 1000000:
        return number_to_terbilang(n // 1000) + " Ribu " + number_to_terbilang(n % 1000)
    return str(n)

orders = [
    {
        "no": 1,
        "inv_no": "INV/2026/08/001",
        "date": "2026-08-05",
        "date_fmt": "5 Agustus 2026",
        "customer": "Adip",
        "variant": "Grade S Murni",
        "size": "250g",
        "packs": 1,
        "weight_kg": 0.25,
        "price_per_pack": 43500,
        "total_price": 43500,
        "payment_status": "Lunas",
        "delivery_status": "Terkirim",
        "notes": "Rumah Kost Eksklusif Bulusan, Jl. Bulusan Selatan Raya No.9a, Tembalang, Semarang (Kamar 9)",
        "file_slug": "adip"
    },
    {
        "no": 2,
        "inv_no": "INV/2026/08/002",
        "date": "2026-08-07",
        "date_fmt": "7 Agustus 2026",
        "customer": "Renny",
        "variant": "Grade S Murni",
        "size": "200g",
        "packs": 2,
        "weight_kg": 0.40,
        "price_per_pack": 37500,
        "total_price": 75000,
        "payment_status": "Belum Lunas",
        "delivery_status": "Menunggu Pengiriman",
        "notes": "Harga Resmi Grade S 200g Jakarta/Semarang (2 pack @ Rp 37.500)",
        "file_slug": "renny"
    },
    {
        "no": 3,
        "inv_no": "INV/2026/08/003",
        "date": "2026-08-07",
        "date_fmt": "7 Agustus 2026",
        "customer": "Anggi",
        "variant": "Grade S Murni",
        "size": "200g",
        "packs": 5,
        "weight_kg": 1.00,
        "price_per_pack": 33100,
        "total_price": 165500,
        "payment_status": "Belum Lunas",
        "delivery_status": "Menunggu Pengiriman",
        "notes": "Harga Resmi Paket 1kg Grade S Jakarta/Semarang (5 pack 200g = Rp 165.500)",
        "file_slug": "anggi"
    },
    {
        "no": 4,
        "inv_no": "INV/2026/08/004",
        "date": "2026-08-07",
        "date_fmt": "7 Agustus 2026",
        "customer": "Hendry",
        "variant": "Grade S Murni",
        "size": "200g",
        "packs": 4,
        "weight_kg": 0.80,
        "price_per_pack": 37500,
        "total_price": 150000,
        "payment_status": "Belum Lunas",
        "delivery_status": "Menunggu Pengiriman",
        "notes": "Harga Resmi Grade S 200g Jakarta/Semarang (4 pack @ Rp 37.500)",
        "file_slug": "hendry"
    },
    {
        "no": 5,
        "inv_no": "INV/2026/08/005",
        "date": "2026-08-07",
        "date_fmt": "7 Agustus 2026",
        "customer": "Amal",
        "variant": "Grade S Murni",
        "size": "250g",
        "packs": 2,
        "weight_kg": 0.50,
        "price_per_pack": 43500,
        "total_price": 87000,
        "payment_status": "Belum Lunas",
        "delivery_status": "Menunggu Pengiriman",
        "notes": "Harga Resmi Grade S 250g Jakarta/Semarang (2 pack @ Rp 43.500)",
        "file_slug": "amal"
    },
    {
        "no": 6,
        "inv_no": "INV/2026/08/006",
        "date": "2026-08-07",
        "date_fmt": "7 Agustus 2026",
        "customer": "Widi",
        "variant": "Grade S Murni",
        "size": "150g",
        "packs": 4,
        "weight_kg": 0.60,
        "price_per_pack": 26500,
        "total_price": 106000,
        "payment_status": "Belum Lunas",
        "delivery_status": "Menunggu Pengiriman",
        "notes": "Harga Resmi Grade S 150g Jakarta/Semarang (4 pack @ Rp 26.500)",
        "file_slug": "widi"
    },
    {
        "no": 7,
        "inv_no": "INV/2026/08/007",
        "date": "2026-08-07",
        "date_fmt": "7 Agustus 2026",
        "customer": "Bukit",
        "variant": "Grade S Murni",
        "size": "250g",
        "packs": 2,
        "weight_kg": 0.50,
        "price_per_pack": 43500,
        "total_price": 87000,
        "payment_status": "Belum Lunas",
        "delivery_status": "Menunggu Pengiriman",
        "notes": "Harga Resmi Grade S 250g Jakarta/Semarang (2 pack @ Rp 43.500)",
        "file_slug": "bukit"
    },
    {
        "no": 8,
        "inv_no": "INV/2026/08/008",
        "date": "2026-08-08",
        "date_fmt": "8 Agustus 2026",
        "customer": "Didi",
        "variant": "Grade A Crispy",
        "size": "1000g",
        "packs": 2,
        "weight_kg": 2.00,
        "price_per_pack": 136000,
        "total_price": 272000,
        "payment_status": "Belum Lunas",
        "delivery_status": "Menunggu Pengiriman",
        "notes": "Harga Resmi Pricelist Solo Raya (Grade A Bal PE 1kg × 2 pack @ Rp 136.000)",
        "file_slug": "didi"
    },
    {
        "no": 9,
        "inv_no": "INV/2026/08/012",
        "date": "2026-08-10",
        "date_fmt": "10 Agustus 2026",
        "customer": "Farhan",
        "variant": "Grade S Murni",
        "size": "250g",
        "packs": 4,
        "weight_kg": 1.00,
        "price_per_pack": 43500,
        "total_price": 174000,
        "payment_status": "Belum Lunas",
        "delivery_status": "Menunggu Pengiriman",
        "notes": "Harga Resmi Grade S 250g Jakarta/Semarang (4 pack @ Rp 43.500)",
        "file_slug": "farhan"
    },
    {
        "no": 10,
        "inv_no": "INV/2026/08/013",
        "date": "2026-08-10",
        "date_fmt": "10 Agustus 2026",
        "customer": "Yatmo",
        "variant": "Grade S Murni",
        "size": "250g",
        "packs": 2,
        "weight_kg": 0.50,
        "price_per_pack": 43500,
        "total_price": 87000,
        "payment_status": "Belum Lunas",
        "delivery_status": "Menunggu Pengiriman",
        "notes": "Harga Resmi Grade S 250g Jakarta/Semarang (2 pack @ Rp 43.500)",
        "file_slug": "yatmo"
    },
    {
        "no": 11,
        "inv_no": "INV/2026/08/009",
        "date": "2026-08-10",
        "date_fmt": "10 Agustus 2026",
        "customer": "Ares",
        "variant": "Grade S Murni",
        "size": "250g",
        "packs": 1,
        "weight_kg": 0.25,
        "price_per_pack": 40000,
        "total_price": 40000,
        "shipping_fee": 0,
        "payment_status": "Lunas",
        "delivery_status": "Terkirim",
        "notes": "Harga Resmi Regional Solo Raya (1 pack 250g @ Rp 40.000)",
        "file_slug": "ares"
    },
    {
        "no": 12,
        "inv_no": "INV/2026/08/010",
        "date": "2026-08-07",
        "date_fmt": "7 Agustus 2026",
        "customer": "Zaki",
        "items": [
            {
                "variant": "Grade S Murni",
                "size": "100g",
                "packs": 1,
                "weight_kg": 0.10,
                "price_per_pack": 21600,
                "subtotal": 21600
            },
            {
                "variant": "Grade A Crispy",
                "size": "100g",
                "packs": 1,
                "weight_kg": 0.10,
                "price_per_pack": 18900,
                "subtotal": 18900
            }
        ],
        "shipping_fee": 0,
        "payment_status": "Lunas",
        "delivery_status": "Terkirim",
        "notes": "Trial Pack Grade S Murni (100g) & Grade A Crispy (100g) Solo Raya",
        "file_slug": "zaki"
    },
    {
        "no": 13,
        "inv_no": "INV/2026/08/014",
        "date": "2026-08-12",
        "date_fmt": "12 Agustus 2026",
        "customer": "Mamah Didi",
        "variant": "Grade S Murni",
        "size": "100g",
        "packs": 7,
        "weight_kg": 0.70,
        "price_per_pack": 22000,
        "total_price": 154000,
        "shipping_fee": 0,
        "payment_status": "Belum Lunas",
        "delivery_status": "Menunggu Pengiriman",
        "notes": "Harga Resmi Regional Solo Raya (7 pack 100g Grade S Murni @ Rp 22.000)",
        "file_slug": "mamah_didi"
    },
    {
        "no": 14,
        "inv_no": "INV/2026/08/015",
        "date": "2026-08-22",
        "date_fmt": "22 Agustus 2026",
        "customer": "Mamah Didi",
        "items": [
            {
                "variant": "Grade S Murni",
                "size": "100g",
                "packs": 10,
                "weight_kg": 1.00,
                "price_per_pack": 22000,
                "subtotal": 220000
            },
            {
                "variant": "Grade A Crispy",
                "size": "100g",
                "packs": 1,
                "weight_kg": 0.10,
                "price_per_pack": 19000,
                "subtotal": 19000
            }
        ],
        "shipping_fee": 0,
        "payment_status": "Lunas",
        "delivery_status": "Terkirim",
        "notes": "Harga Resmi Pricelist Solo Raya (10 pack 100g Grade S Murni @ Rp 22.000 & 1 pack 100g Grade A @ Rp 19.000)",
        "file_slug": "mamah_didi_2"
    },
    {
        "no": 15,
        "inv_no": "INV/2026/08/016",
        "date": "2026-08-22",
        "date_fmt": "22 Agustus 2026",
        "customer": "Tante Dewi",
        "variant": "Grade S Murni",
        "size": "100g",
        "packs": 2,
        "weight_kg": 0.20,
        "price_per_pack": 22000,
        "total_price": 44000,
        "shipping_fee": 0,
        "payment_status": "Lunas",
        "delivery_status": "Terkirim",
        "notes": "Harga Resmi Pricelist Solo Raya (2 pack 100g Grade S Murni @ Rp 22.000)",
        "file_slug": "tante_dewi"
    },
    {
        "no": 16,
        "inv_no": "INV/2026/08/017",
        "date": "2026-08-22",
        "date_fmt": "22 Agustus 2026",
        "customer": "Ratukhandayu",
        "variant": "Grade A Crispy",
        "size": "250g",
        "packs": 2,
        "weight_kg": 0.50,
        "price_per_pack": 37500,
        "total_price": 75000,
        "shipping_fee": 10000,
        "payment_status": "Lunas",
        "delivery_status": "Terkirim",
        "notes": "Harga Resmi Grade A 250g Jakarta (2 pack @ Rp 37.500 + Ongkir Ekspedisi Flat Rp 10.000)",
        "file_slug": "ratukhandayu"
    },
    {
        "no": 17,
        "inv_no": "INV/2026/08/018",
        "date": "2026-08-22",
        "date_fmt": "22 Agustus 2026",
        "customer": "Dona",
        "variant": "Grade A Crispy",
        "size": "1000g",
        "packs": 1,
        "weight_kg": 1.00,
        "price_per_pack": 136000,
        "total_price": 136000,
        "shipping_fee": 0,
        "payment_status": "Lunas",
        "delivery_status": "Terkirim",
        "notes": "Harga Resmi Solo Raya (1 pack 1000g Bal PE Grade A Crispy @ Rp 136.000)",
        "file_slug": "dona"
    }
]

def generate_markdown(order, output_dir):
    filename = f"invoice_{order['file_slug']}_agustus_2026.md"
    filepath = os.path.join(output_dir, filename)
    
    is_lunas = order['payment_status'] == "Lunas"
    status_badge = "✅ **LUNAS**" if is_lunas else "⏳ **BELUM LUNAS (Menunggu Pelunasan)**"
    
    items_rows = []
    if 'items' in order:
        subtotal_produk = sum(item['subtotal'] for item in order['items'])
        for idx, item in enumerate(order['items'], 1):
            sub_desc = "100% Bawang Merah Boyolali Murni - Tanpa Tepung" if "Murni" in item['variant'] else "Renyah Gurih Mantap (Tepung Tipis 5%)"
            items_rows.append(f"| {idx} | **Bawang Goreng {item['variant']}**<br/>*({sub_desc})* | {item['size']} | {item['packs']} pack | {item['weight_kg']:.2f} kg | Rp {item['price_per_pack']:,} | Rp {item['subtotal']:,} |")
        total_size = " + ".join(item['size'] for item in order['items'])
        total_packs = sum(item['packs'] for item in order['items'])
        total_weight = sum(item['weight_kg'] for item in order['items'])
    else:
        subtotal_produk = order['total_price']
        sub_desc = "100% Bawang Merah Boyolali Murni - Tanpa Tepung" if "Murni" in order.get('variant', '') else "Renyah Gurih Mantap (Tepung Tipis 5%)"
        items_rows.append(f"| 1 | **Bawang Goreng {order.get('variant', 'Grade S Murni')}**<br/>*({sub_desc})* | {order['size']} | {order['packs']} pack | {order['weight_kg']:.2f} kg | Rp {order['price_per_pack']:,} | Rp {subtotal_produk:,} |")
        total_size = order['size']
        total_packs = order['packs']
        total_weight = order['weight_kg']
        
    shipping_fee = order.get('shipping_fee', 0)
    ongkir_idx = len(items_rows) + 1
    if shipping_fee > 0:
        items_rows.append(f"| {ongkir_idx} | **Ongkos Kirim Ekspedisi**<br/>*(Tarif Flat Pengiriman)* | — | 1 paket | — | Rp {shipping_fee:,} | Rp {shipping_fee:,} |")
    else:
        items_rows.append(f"| {ongkir_idx} | **Ongkos Kirim Ekspedisi**<br/>*(Bebas Ongkir / Regional Solo Raya)* | — | 1 paket | — | Rp 0 | Rp 0 |")
    
    grand_total = subtotal_produk + shipping_fee
    terbilang = number_to_terbilang(grand_total).strip() + " Rupiah"
    
    table_items_content = "\n".join(items_rows)
    
    content = f"""# 🧾 INVOICE PENJUALAN PELANGGAN - JURAGAN BY ANAK BAWANG

**Nomor Invoice**: `{order['inv_no']}`  
**Tanggal Transaksi**: {order['date_fmt']}  
**Penerbit Invoice**: **Juragan by Anak Bawang** (Produsen Bawang Goreng Boyolali Murni)  
**Ditujukan Kepada**: **{order['customer']}**  
**Status Pembayaran**: {status_badge}  
**Status Pengiriman**: 🚚 **{order['delivery_status']}**  

---

### 📦 Detail Item Pesanan

| No | Deskripsi Produk / Layanan | Kemasan | Jumlah Pack | Total Berat (Kg) | Harga Satuan (Rp) | Subtotal (Rp) |
| :---: | :--- | :---: | :---: | :---: | :---: | :---: |
{table_items_content}
| **TOTAL** | **Akumulasi Tagihan** | **{total_size}** | **{total_packs} pack** | **{total_weight:.2f} kg** | — | **Rp {grand_total:,}** |

---

### 💰 Ringkasan Tagihan

* **Subtotal Produk**: `Rp {subtotal_produk:,}`
* **Ongkos Kirim**: `Rp {shipping_fee:,}`
* **Total Tagihan**: **`Rp {grand_total:,}`**
* **Terbilang**: *({terbilang})*
* **Status Pembayaran**: {status_badge}

---

### 📝 Catatan & Alamat Pengiriman:
1. **Catatan Transaksi**: {order['notes']}
2. **Metode Pembayaran**: Transfer Bank / Cash / E-Wallet.
3. Terima kasih telah berbelanja produk **Juragan by Anak Bawang**! Kebersihan, kerenyahan, dan kemurnian rasa adalah prioritas utama kami.
"""

    with open(filepath, "w", encoding="utf-8") as f:
        f.write(content)
    return filepath

def generate_pdf(order, output_dir):
    filename = f"invoice_{order['file_slug']}_agustus_2026.pdf"
    filepath = os.path.join(output_dir, filename)
    
    doc = SimpleDocTemplate(
        filepath,
        pagesize=letter,
        rightMargin=36,
        leftMargin=36,
        topMargin=36,
        bottomMargin=36
    )
    
    styles = getSampleStyleSheet()
    
    is_lunas = order['payment_status'] == "Lunas"
    primary_color = colors.HexColor('#701A1E') # Maroon
    accent_color = colors.HexColor('#D97706') # Gold
    status_bg = colors.HexColor('#DCFCE7') if is_lunas else colors.HexColor('#FEF3C7')
    status_border = colors.HexColor('#16A34A') if is_lunas else colors.HexColor('#D97706')
    status_text_color = colors.HexColor('#15803D') if is_lunas else colors.HexColor('#B45309')
    
    title_style = ParagraphStyle(
        'DocTitle',
        parent=styles['Heading1'],
        fontName='Helvetica-Bold',
        fontSize=18,
        leading=22,
        textColor=colors.HexColor('#1E293B')
    )
    
    subtitle_style = ParagraphStyle(
        'DocSubTitle',
        parent=styles['Normal'],
        fontName='Helvetica-Bold',
        fontSize=11,
        leading=14,
        textColor=primary_color
    )
    
    normal_style = ParagraphStyle(
        'DocNormal',
        parent=styles['Normal'],
        fontName='Helvetica',
        fontSize=9,
        leading=13,
        textColor=colors.HexColor('#334155')
    )

    bold_style = ParagraphStyle(
        'DocBold',
        parent=styles['Normal'],
        fontName='Helvetica-Bold',
        fontSize=9,
        leading=13,
        textColor=colors.HexColor('#0F172A')
    )
    
    header_table_style = ParagraphStyle(
        'DocHeaderTable',
        parent=styles['Normal'],
        fontName='Helvetica-Bold',
        fontSize=9,
        leading=12,
        textColor=colors.white
    )
    
    right_bold_style = ParagraphStyle(
        'DocRightBold',
        parent=bold_style,
        alignment=2
    )

    story = []
    
    story.append(Paragraph("JURAGAN BY ANAK BAWANG", subtitle_style))
    story.append(Spacer(1, 4))
    story.append(Paragraph(f"INVOICE PENJUALAN PELANGGAN ({order['customer'].upper()})", title_style))
    story.append(Spacer(1, 8))
    story.append(HRFlowable(width="100%", thickness=2, color=primary_color, spaceAfter=12))
    
    status_str = f"<font color='{status_text_color.hexval()}'><b>{'LUNAS ✅' if is_lunas else 'MENUNGGU PELUNASAN ⏳'}</b></font>"
    
    meta_data = [
        [Paragraph(f"<b>No. Invoice:</b> {order['inv_no']}", normal_style), Paragraph(f"<b>Tanggal Transaksi:</b> {order['date_fmt']}", normal_style)],
        [Paragraph(f"<b>Nama Pelanggan:</b> {order['customer']}", normal_style), Paragraph("<b>Penjual:</b> Juragan by Anak Bawang", normal_style)],
        [Paragraph(f"<b>Status Pembayaran:</b> {status_str}", normal_style), Paragraph(f"<b>Status Pengiriman:</b> {order['delivery_status']}", normal_style)]
    ]
    meta_table = Table(meta_data, colWidths=[270, 270])
    meta_table.setStyle(TableStyle([
        ('BACKGROUND', (0,0), (-1,-1), colors.HexColor('#F8FAFC')),
        ('PADDING', (0,0), (-1,-1), 6),
        ('VALIGN', (0,0), (-1,-1), 'MIDDLE'),
        ('BOX', (0,0), (-1,-1), 1, colors.HexColor('#E2E8F0')),
        ('INNERGRID', (0,0), (-1,-1), 0.5, colors.HexColor('#F1F5F9'))
    ]))
    story.append(meta_table)
    story.append(Spacer(1, 15))
    
    headers = [
        Paragraph("No", header_table_style),
        Paragraph("Deskripsi Produk / Layanan", header_table_style),
        Paragraph("Kemasan", header_table_style),
        Paragraph("Jumlah Pack", header_table_style),
        Paragraph("Harga Satuan", header_table_style),
        Paragraph("Subtotal (Rp)", header_table_style)
    ]
    
    table_data = [headers]
    if 'items' in order:
        subtotal_produk = sum(item['subtotal'] for item in order['items'])
        for idx, item in enumerate(order['items'], 1):
            sub_lbl = "100% Bawang Merah Boyolali Murni" if "Murni" in item['variant'] else "Renyah Gurih Mantap (Tepung 5%)"
            item_desc = f"<b>Bawang Goreng {item['variant']}</b><br/><font size=7.5 color='#64748B'>{sub_lbl}</font>"
            price_str = f"Rp {item['price_per_pack']:,}".replace(',', '.')
            subtotal_str = f"Rp {item['subtotal']:,}".replace(',', '.')
            table_data.append([
                Paragraph(str(idx), normal_style),
                Paragraph(item_desc, normal_style),
                Paragraph(item['size'], normal_style),
                Paragraph(f"{item['packs']} pack ({item['weight_kg']:.2f} kg)", normal_style),
                Paragraph(price_str, normal_style),
                Paragraph(subtotal_str, normal_style)
            ])
    else:
        subtotal_produk = order['total_price']
        sub_lbl = "100% Bawang Merah Boyolali Murni (Tanpa Tepung)" if "Murni" in order.get('variant', '') else "Renyah Gurih (Tepung 5%)"
        item_desc = f"<b>Bawang Goreng {order['variant']}</b><br/><font size=7.5 color='#64748B'>{sub_lbl}</font>"
        price_str = f"Rp {order['price_per_pack']:,}".replace(',', '.')
        subtotal_str = f"Rp {subtotal_produk:,}".replace(',', '.')
        table_data.append([
            Paragraph("1", normal_style),
            Paragraph(item_desc, normal_style),
            Paragraph(order['size'], normal_style),
            Paragraph(f"{order['packs']} pack ({order['weight_kg']:.2f} kg)", normal_style),
            Paragraph(price_str, normal_style),
            Paragraph(subtotal_str, normal_style)
        ])
        
    shipping_fee = order.get('shipping_fee', 0)
    grand_total = subtotal_produk + shipping_fee
    shipping_str = f"Rp {shipping_fee:,}".replace(',', '.') if shipping_fee > 0 else "Rp 0"
    grand_total_str = f"Rp {grand_total:,}".replace(',', '.')
    ongkir_label = "<b>Ongkos Kirim Ekspedisi</b><br/><font size=7.5 color='#64748B'>Tarif Flat Pengiriman</font>" if shipping_fee > 0 else "<b>Ongkos Kirim Ekspedisi</b><br/><font size=7.5 color='#64748B'>Bebas Ongkir / Regional Solo Raya</font>"
    
    ongkir_idx = str(len(table_data))
    table_data.append([
        Paragraph(ongkir_idx, normal_style),
        Paragraph(ongkir_label, normal_style),
        Paragraph("—", normal_style),
        Paragraph("1 paket", normal_style),
        Paragraph(shipping_str, normal_style),
        Paragraph(shipping_str, normal_style)
    ])
        
    items_table = Table(table_data, colWidths=[25, 215, 60, 90, 75, 75])
    items_table.setStyle(TableStyle([
        ('BACKGROUND', (0,0), (-1,0), primary_color),
        ('VALIGN', (0,0), (-1,-1), 'MIDDLE'),
        ('PADDING', (0,0), (-1,-1), 7),
        ('ROWBACKGROUNDS', (0,1), (-1,-1), [colors.white, colors.HexColor('#F8FAFC')]),
        ('GRID', (0,0), (-1,-1), 0.5, colors.HexColor('#CBD5E1'))
    ]))
    
    story.append(items_table)
    story.append(Spacer(1, 15))
    
    terbilang_str = number_to_terbilang(grand_total).strip() + " Rupiah"
    
    total_data = [
        [Paragraph(f"<b>STATUS:</b> {order['payment_status'].upper()}", bold_style), Paragraph("<b>TOTAL TAGIHAN:</b>", right_bold_style), Paragraph(f"<font size=12 color='{primary_color.hexval()}'><b>{grand_total_str}</b></font>", right_bold_style)]
    ]
    total_table = Table(total_data, colWidths=[180, 180, 180])
    total_table.setStyle(TableStyle([
        ('BACKGROUND', (0,0), (-1,-1), status_bg),
        ('BOX', (0,0), (-1,-1), 1, status_border),
        ('PADDING', (0,0), (-1,-1), 10),
        ('VALIGN', (0,0), (-1,-1), 'MIDDLE')
    ]))
    story.append(total_table)
    story.append(Spacer(1, 8))
    
    terbilang_para = Paragraph(f"<font size=8.5 color='#475569'><b>Terbilang:</b> <i>{terbilang_str}</i></font>", normal_style)
    story.append(terbilang_para)
    story.append(Spacer(1, 15))
    
    story.append(Paragraph("<b>📌 Catatan & Informasi Tambahan:</b>", bold_style))
    story.append(Spacer(1, 4))
    notes_text = f"""
    1. <b>Catatan Khusus:</b> {order['notes']}<br/>
    2. <b>Metode Pembayaran:</b> Transfer Bank / Cash / E-Wallet.<br/>
    3. Terima kasih telah memilih <b>Juragan by Anak Bawang</b>! Kebersihan, kerenyahan, dan rasa murni bawang Boyolali adalah garansi utama kami.
    """
    story.append(Paragraph(notes_text, normal_style))
    
    doc.build(story)
    return filepath

def main():
    base_dir = r"d:\Dokumen\02_Kerja_Profesional\Juragan by Anak Bawang\Manajemen_Pesanan"
    out_dir = os.path.join(base_dir, "invoices_pelanggan")
    os.makedirs(out_dir, exist_ok=True)
    
    print(f"Generating customer invoices in: {out_dir}")
    
    md_files = []
    pdf_files = []
    
    for order in orders:
        md_p = generate_markdown(order, out_dir)
        pdf_p = generate_pdf(order, out_dir)
        md_files.append(md_p)
        pdf_files.append(pdf_p)
        
        print(f"[OK] Generated Invoice for {order['customer']}: {os.path.basename(pdf_p)}")
        
    print("\nAll customer invoices generated successfully!")

if __name__ == "__main__":
    main()


