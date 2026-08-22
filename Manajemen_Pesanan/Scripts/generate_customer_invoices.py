#!/usr/bin/env python3
"""
Dynamic Invoice & Order Generator - Juragan by Anak Bawang
==========================================================
Single Source of Truth: Manajemen_Pesanan/Database/daftar_pesanan_agustus_2026.csv
Generates PDF and Markdown invoices dynamically from CSV.
Supports 1-step CLI order entry with automatic HPP, regional pricing, and packaging calculations.
"""

import os
import sys
import csv
import re
import argparse
from datetime import datetime

# ReportLab Imports
from reportlab.lib.pagesizes import letter
from reportlab.lib import colors
from reportlab.platypus import SimpleDocTemplate, Paragraph, Spacer, Table, TableStyle, HRFlowable
from reportlab.lib.styles import getSampleStyleSheet, ParagraphStyle

# Ensure UTF-8 output on Windows
if sys.platform == "win32":
    sys.stdout.reconfigure(encoding="utf-8")

SCRIPT_DIR = os.path.dirname(os.path.abspath(__file__))
BASE_DIR = os.path.abspath(os.path.join(SCRIPT_DIR, ".."))
DB_CSV_PATH = os.path.join(BASE_DIR, "Database", "daftar_pesanan_agustus_2026.csv")
OUTPUT_INVOICE_DIR = os.path.join(BASE_DIR, "invoices_pelanggan")

os.makedirs(OUTPUT_INVOICE_DIR, exist_ok=True)

# ─── MASTER PRICING & SKU MATRIX (Acuan Resmi: Clean PDF) ────────────────────
SKU_CATALOG = {
    # Grade S Murni (100% Bawang Merah Boyolali Murni - Tanpa Tepung)
    "murni_100":  {"name": "Trial Pack Murni 100g", "variant": "Grade S Murni", "size": "100g", "weight": 0.10, "solo": 22000, "luar": 23500, "hpp": 15400},
    "murni_150":  {"name": "Murni Pouch 150g", "variant": "Grade S Murni", "size": "150g", "weight": 0.15, "solo": 29000, "luar": 31000, "hpp": 21700},
    "murni_200":  {"name": "Murni Pouch 200g", "variant": "Grade S Murni", "size": "200g", "weight": 0.20, "solo": 34500, "luar": 36500, "hpp": 28200},
    "murni_250":  {"name": "[HERO SKU] Murni Pouch 250g", "variant": "Grade S Murni", "size": "250g", "weight": 0.25, "solo": 39500, "luar": 43500, "hpp": 34700},
    "murni_1000": {"name": "Murni Bal PE 1 Kg", "variant": "Grade S Murni", "size": "1000g", "weight": 1.00, "solo": 156000, "luar": 165500, "hpp": 127200},
    
    # Grade A Crispy (Renyah Gurih Mantap - Tepung Tipis 5%)
    "grade_a_100":  {"name": "Trial Pack Grade A 100g", "variant": "Grade A Crispy", "size": "100g", "weight": 0.10, "solo": 19000, "luar": 21000, "hpp": 13900},
    "grade_a_150":  {"name": "Grade A Pouch 150g", "variant": "Grade A Crispy", "size": "150g", "weight": 0.15, "solo": 25500, "luar": 28000, "hpp": 19450},
    "grade_a_200":  {"name": "Grade A Pouch 200g", "variant": "Grade A Crispy", "size": "200g", "weight": 0.20, "solo": 30500, "luar": 32500, "hpp": 25100},
    "grade_a_250":  {"name": "[HERO SKU] Grade A Pouch 250g", "variant": "Grade A Crispy", "size": "250g", "weight": 0.25, "solo": 37500, "luar": 39500, "hpp": 30950},
    "grade_a_1000": {"name": "Grade A Bal PE 1 Kg", "variant": "Grade A Crispy", "size": "1000g", "weight": 1.00, "solo": 136000, "luar": 146000, "hpp": 112200},
}

KARDUS_COST = 3000

# ─── HELPER FUNCTIONS ─────────────────────────────────────────────────────────
def clean_currency(val_str):
    if not val_str:
        return 0
    cleaned = re.sub(r"[^\d]", "", str(val_str))
    return int(cleaned) if cleaned else 0

def format_currency(num):
    return f"Rp {num:,}".replace(",", ".")

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
    elif n < 1000000000:
        return number_to_terbilang(n // 1000000) + " Juta " + number_to_terbilang(n % 1000000)
    return str(n)

def format_date_id(date_str):
    months = ["", "Januari", "Februari", "Maret", "April", "Mei", "Juni", 
              "Juli", "Agustus", "September", "Oktober", "November", "Desember"]
    try:
        dt = datetime.strptime(date_str, "%Y-%m-%d")
        return f"{dt.day} {months[dt.month]} {dt.year}"
    except Exception:
        return date_str

def make_slug(name, inv_no=""):
    slug = re.sub(r"[^a-zA-Z0-9]+", "_", name.lower()).strip("_")
    # Handling specific duplicates
    if name.lower() == "zaki" and "011" in inv_no:
        return "zaki"
    if name.lower() == "mamah didi" and "015" in inv_no:
        return "mamah_didi_2"
    return slug

def parse_items_summary(items_str, area, total_product_price=0):
    """
    Parses items summary string into structured list of items.
    Example: 'Trial Pack Murni 100g x10; Trial Pack Grade A 100g x1'
    """
    is_solo = "solo" in area.lower()
    raw_parts = [p.strip() for p in items_str.split(";") if p.strip()]
    items = []
    
    for part in raw_parts:
        # Match pattern: <Product Name> x<Qty>
        m = re.search(r"^(.*?)\s*[xX](\d+)$", part)
        if m:
            p_name = m.group(1).strip()
            qty = int(m.group(2))
        else:
            p_name = part
            qty = 1
            
        # Match SKU Key
        matched_sku = None
        for key, meta in SKU_CATALOG.items():
            # Check match by name or keywords
            if meta["name"].lower() in p_name.lower() or p_name.lower() in meta["name"].lower():
                matched_sku = meta
                break
                
        if not matched_sku:
            # Fallback heuristic
            is_grade_s = "murni" in p_name.lower() or "grade s" in p_name.lower()
            if "100" in p_name:
                matched_sku = SKU_CATALOG["murni_100"] if is_grade_s else SKU_CATALOG["grade_a_100"]
            elif "150" in p_name:
                matched_sku = SKU_CATALOG["murni_150"] if is_grade_s else SKU_CATALOG["grade_a_150"]
            elif "200" in p_name:
                matched_sku = SKU_CATALOG["murni_200"] if is_grade_s else SKU_CATALOG["grade_a_200"]
            elif "250" in p_name:
                matched_sku = SKU_CATALOG["murni_250"] if is_grade_s else SKU_CATALOG["grade_a_250"]
            elif "1 kg" in p_name.lower() or "1kg" in p_name.lower() or "1000" in p_name:
                matched_sku = SKU_CATALOG["murni_1000"] if is_grade_s else SKU_CATALOG["grade_a_1000"]
            else:
                matched_sku = SKU_CATALOG["murni_250"] if is_grade_s else SKU_CATALOG["grade_a_250"]

        price_per_pack = matched_sku["solo"] if is_solo else matched_sku["luar"]
        subtotal = price_per_pack * qty
        weight_kg = matched_sku["weight"] * qty
        
        items.append({
            "variant": matched_sku["variant"],
            "size": matched_sku["size"],
            "packs": qty,
            "weight_kg": weight_kg,
            "price_per_pack": price_per_pack,
            "subtotal": subtotal,
            "hpp_per_pack": matched_sku["hpp"],
            "total_hpp": matched_sku["hpp"] * qty
        })
        
    # Adjust price per pack if total_product_price is explicitly given for single item
    if len(items) == 1 and total_product_price > 0:
        items[0]["subtotal"] = total_product_price
        items[0]["price_per_pack"] = total_product_price // items[0]["packs"]

    return items

# ─── LOAD ORDERS FROM CSV ─────────────────────────────────────────────────────
def load_orders_from_csv(csv_path):
    if not os.path.exists(csv_path):
        print(f"Error: Database CSV not found at {csv_path}")
        return []
        
    orders = []
    with open(csv_path, mode="r", encoding="utf-8") as f:
        reader = csv.DictReader(f)
        for idx, row in enumerate(reader, 1):
            inv_no = row.get("Invoice_Number", "").strip()
            if not inv_no:
                continue
                
            customer = row.get("Nama_Pelanggan", "").strip()
            date_raw = row.get("Tanggal", "").strip()
            date_fmt = format_date_id(date_raw)
            area = row.get("Area", "Solo Raya").strip()
            items_str = row.get("Items_Summary", "").strip()
            
            omset_bruto = clean_currency(row.get("Omset_Bruto_Rp", "0"))
            omset_bersih = clean_currency(row.get("Omset_Bersih_Rp", "0"))
            
            # Shipping calculation: difference between gross revenue & items subtotal (if applicable)
            notes = row.get("Catatan", "").strip()
            shipping_fee = 0
            if "ongkir" in notes.lower() and "10.000" in notes:
                shipping_fee = 10000
            elif "ongkir" in notes.lower() and "10000" in notes:
                shipping_fee = 10000
            
            total_product_price = omset_bersih - shipping_fee if omset_bersih > shipping_fee else omset_bersih
            parsed_items = parse_items_summary(items_str, area, total_product_price)
            
            status_bayar_raw = row.get("Status_Bayar", "").lower()
            payment_status = "Lunas" if "lunas" in status_bayar_raw and "belum" not in status_bayar_raw else "Belum Lunas"
            
            status_kirim_raw = row.get("Status_Kirim", "").lower()
            delivery_status = "Terkirim" if "terkirim" in status_kirim_raw or "kirim" in status_kirim_raw else "Menunggu Pengiriman"
            
            kardus_val = row.get("Kardus", "Ya").strip()
            kartu_val = row.get("Kartu_Ucapan", "Tidak").strip()
            
            file_slug = make_slug(customer, inv_no)
            
            order_dict = {
                "no": idx,
                "inv_no": inv_no,
                "date": date_raw,
                "date_fmt": date_fmt,
                "customer": customer,
                "area": area,
                "items": parsed_items,
                "total_product_price": total_product_price,
                "shipping_fee": shipping_fee,
                "grand_total": total_product_price + shipping_fee,
                "payment_status": payment_status,
                "delivery_status": delivery_status,
                "kardus": kardus_val,
                "kartu_ucapan": kartu_val,
                "notes": notes if notes != "-" else f"Area: {area} | Kemasan Kardus: {kardus_val}",
                "file_slug": file_slug
            }
            
            # Compatibility properties for single-item
            if len(parsed_items) == 1:
                order_dict["variant"] = parsed_items[0]["variant"]
                order_dict["size"] = parsed_items[0]["size"]
                order_dict["packs"] = parsed_items[0]["packs"]
                order_dict["weight_kg"] = parsed_items[0]["weight_kg"]
                order_dict["price_per_pack"] = parsed_items[0]["price_per_pack"]
                order_dict["total_price"] = parsed_items[0]["subtotal"]
                
            orders.append(order_dict)
            
    return orders

# ─── GENERATE MARKDOWN INVOICE ────────────────────────────────────────────────
def generate_markdown(order, output_dir):
    filename = f"invoice_{order['file_slug']}_agustus_2026.md"
    filepath = os.path.join(output_dir, filename)
    
    is_lunas = order['payment_status'] == "Lunas"
    status_badge = "✅ **LUNAS**" if is_lunas else "⏳ **BELUM LUNAS (Menunggu Pelunasan)**"
    status_kirim_badge = "🚚 **Terkirim**" if order['delivery_status'] == "Terkirim" else "📦 **Menunggu Pengiriman**"
    
    items_rows = []
    subtotal_produk = sum(item['subtotal'] for item in order['items'])
    for idx, item in enumerate(order['items'], 1):
        sub_desc = "100% Bawang Merah Boyolali Murni - Tanpa Tepung" if "Murni" in item['variant'] else "Renyah Gurih Mantap (Tepung Tipis 5%)"
        items_rows.append(f"| {idx} | **Bawang Goreng {item['variant']}**<br/>*({sub_desc})* | {item['size']} | {item['packs']} pack | {item['weight_kg']:.2f} kg | Rp {item['price_per_pack']:,} | Rp {item['subtotal']:,} |")
        
    total_size = " + ".join(item['size'] for item in order['items'])
    total_packs = sum(item['packs'] for item in order['items'])
    total_weight = sum(item['weight_kg'] for item in order['items'])
        
    shipping_fee = order.get('shipping_fee', 0)
    ongkir_idx = len(items_rows) + 1
    if shipping_fee > 0:
        items_rows.append(f"| {ongkir_idx} | **Ongkos Kirim Ekspedisi**<br/>*(Tarif Flat Pengiriman)* | — | 1 paket | — | Rp {shipping_fee:,} | Rp {shipping_fee:,} |")
    else:
        items_rows.append(f"| {ongkir_idx} | **Ongkos Kirim Ekspedisi**<br/>*(Bebas Ongkir / Regional Solo Raya)* | — | 1 paket | — | Rp 0 | Rp 0 |")
        
    grand_total = subtotal_produk + shipping_fee
    items_table_str = "\n".join(items_rows)
    terbilang_str = number_to_terbilang(grand_total) + " Rupiah"
    
    kardus_info = f"📦 Kardus Box-M ({order.get('kardus', 'Ya')})"
    kartu_info = f"💌 Kartu Ucapan ({order.get('kartu_ucapan', 'Tidak')})"
    
    content = f"""# 🧾 INVOICE PENJUALAN PELANGGAN - JURAGAN BY ANAK BAWANG

**Nomor Invoice**: `{order['inv_no']}`  
**Tanggal Transaksi**: {order['date_fmt']}  
**Penerbit Invoice**: **Juragan by Anak Bawang** (Produsen Bawang Goreng Boyolali Murni)  
**Ditujukan Kepada**: **{order['customer']}**  
**Status Pembayaran**: {status_badge}  
**Status Pengiriman**: {status_kirim_badge}  

---

### 📦 Detail Item Pesanan

| No | Deskripsi Produk / Layanan | Kemasan | Jumlah Pack | Total Berat (Kg) | Harga Satuan (Rp) | Subtotal (Rp) |
| :---: | :--- | :---: | :---: | :---: | :---: | :---: |
{items_table_str}
| **TOTAL** | **Akumulasi Tagihan** | **{total_size}** | **{total_packs} pack** | **{total_weight:.2f} kg** | — | **Rp {grand_total:,}** |

---

### 💰 Ringkasan Tagihan

* **Subtotal Produk**: `Rp {subtotal_produk:,}`
* **Ongkos Kirim**: `Rp {shipping_fee:,}`
* **Total Tagihan**: **`Rp {grand_total:,}`**
* **Terbilang**: *({terbilang_str})*
* **Status Pembayaran**: {status_badge}
* **Kemasan Tambahan**: {kardus_info} | {kartu_info}

---

### 📝 Catatan & Alamat Pengiriman:
1. **Catatan Transaksi**: {order['notes']}
2. **Metode Pembayaran**: Transfer Bank / Cash / E-Wallet.
3. Terima kasih telah berbelanja produk **Juragan by Anak Bawang**! Kebersihan, kerenyahan, dan kemurnian rasa adalah prioritas utama kami.
"""
    with open(filepath, "w", encoding="utf-8") as f:
        f.write(content)
    return filepath

# ─── GENERATE PDF INVOICE ─────────────────────────────────────────────────────
def generate_pdf(order, output_dir):
    filename = f"invoice_{order['file_slug']}_agustus_2026.pdf"
    filepath = os.path.join(output_dir, filename)
    
    doc = SimpleDocTemplate(
        filepath,
        pagesize=letter,
        leftMargin=36,
        rightMargin=36,
        topMargin=36,
        bottomMargin=36
    )
    
    styles = getSampleStyleSheet()
    normal_style = styles["Normal"]
    normal_style.fontSize = 8.5
    normal_style.leading = 11
    
    elements = []
    
    # 1. HEADER
    brand_p = Paragraph("<font size=16 color='#0F172A'><b>JURAGAN BY ANAK BAWANG</b></font><br/><font size=8.5 color='#475569'>Produsen Bawang Goreng Asli Boyolali Berkualitas Premium</font>", normal_style)
    inv_title_p = Paragraph("<font size=16 color='#1E293B'><b>INVOICE</b></font><br/><font size=8.5 color='#64748B'>Faktur Penjualan Resmi</font>", ParagraphStyle('RAlign', parent=normal_style, alignment=2))
    
    header_table = Table([[brand_p, inv_title_p]], colWidths=[320, 220])
    header_table.setStyle(TableStyle([
        ('VALIGN', (0,0), (-1,-1), 'TOP'),
        ('LEFTPADDING', (0,0), (-1,-1), 0),
        ('RIGHTPADDING', (0,0), (-1,-1), 0),
    ]))
    elements.append(header_table)
    elements.append(Spacer(1, 10))
    elements.append(HRFlowable(width="100%", thickness=1.5, color=colors.HexColor("#0F172A"), spaceAfter=12))
    
    # 2. METADATA
    is_lunas = order['payment_status'] == "Lunas"
    status_badge = "<font color='#16A34A'><b>LUNAS</b></font>" if is_lunas else "<font color='#DC2626'><b>BELUM LUNAS</b></font>"
    status_kirim_badge = "<font color='#2563EB'><b>Terkirim</b></font>" if order['delivery_status'] == "Terkirim" else "<font color='#D97706'><b>Menunggu Pengiriman</b></font>"
    
    left_meta = Paragraph(f"""
    <b>DITUJUKAN KEPADA:</b><br/>
    <font size=11 color='#0F172A'><b>{order['customer']}</b></font><br/>
    <font color='#64748B'>Pelanggan Setia Juragan by Anak Bawang</font><br/>
    <font color='#64748B'>Area: {order.get('area', 'Solo Raya')}</font>
    """, normal_style)
    
    right_meta = Paragraph(f"""
    <b>DETAIL FAKTUR:</b><br/>
    <b>No. Invoice:</b> <font color='#0F172A'>{order['inv_no']}</font><br/>
    <b>Tanggal:</b> {order['date_fmt']}<br/>
    <b>Status Bayar:</b> {status_badge}<br/>
    <b>Status Kirim:</b> {status_kirim_badge}
    """, ParagraphStyle('RMeta', parent=normal_style, alignment=0))
    
    meta_table = Table([[left_meta, right_meta]], colWidths=[300, 240])
    meta_table.setStyle(TableStyle([
        ('VALIGN', (0,0), (-1,-1), 'TOP'),
        ('BACKGROUND', (0,0), (-1,-1), colors.HexColor("#F8FAFC")),
        ('BOX', (0,0), (-1,-1), 0.5, colors.HexColor("#E2E8F0")),
        ('TOPPADDING', (0,0), (-1,-1), 8),
        ('BOTTOMPADDING', (0,0), (-1,-1), 8),
        ('LEFTPADDING', (0,0), (-1,-1), 10),
        ('RIGHTPADDING', (0,0), (-1,-1), 10),
    ]))
    elements.append(meta_table)
    elements.append(Spacer(1, 14))
    
    # 3. ITEMS TABLE
    headers = [
        Paragraph("<b>No</b>", ParagraphStyle('TH', parent=normal_style, alignment=1, textColor=colors.white)),
        Paragraph("<b>Deskripsi Produk / Layanan</b>", ParagraphStyle('TH', parent=normal_style, alignment=0, textColor=colors.white)),
        Paragraph("<b>Kemasan</b>", ParagraphStyle('TH', parent=normal_style, alignment=1, textColor=colors.white)),
        Paragraph("<b>Jumlah</b>", ParagraphStyle('TH', parent=normal_style, alignment=1, textColor=colors.white)),
        Paragraph("<b>Harga Satuan</b>", ParagraphStyle('TH', parent=normal_style, alignment=2, textColor=colors.white)),
        Paragraph("<b>Subtotal</b>", ParagraphStyle('TH', parent=normal_style, alignment=2, textColor=colors.white))
    ]
    
    table_data = [headers]
    subtotal_produk = sum(item['subtotal'] for item in order['items'])
    
    for idx, item in enumerate(order['items'], 1):
        sub_lbl = "100% Bawang Merah Boyolali Murni (Tanpa Tepung)" if "Murni" in item['variant'] else "Renyah Gurih Mantap (Tepung Tipis 5%)"
        item_desc = f"<b>Bawang Goreng {item['variant']}</b><br/><font size=7.5 color='#64748B'>{sub_lbl}</font>"
        price_str = format_currency(item['price_per_pack'])
        subtotal_str = format_currency(item['subtotal'])
        table_data.append([
            Paragraph(str(idx), normal_style),
            Paragraph(item_desc, normal_style),
            Paragraph(item['size'], normal_style),
            Paragraph(f"{item['packs']} pack ({item['weight_kg']:.2f} kg)", normal_style),
            Paragraph(price_str, normal_style),
            Paragraph(subtotal_str, normal_style)
        ])
        
    shipping_fee = order.get('shipping_fee', 0)
    grand_total = subtotal_produk + shipping_fee
    shipping_str = format_currency(shipping_fee) if shipping_fee > 0 else "Rp 0"
    grand_total_str = format_currency(grand_total)
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
    
    item_table = Table(table_data, colWidths=[24, 230, 56, 80, 75, 75])
    item_table.setStyle(TableStyle([
        ('BACKGROUND', (0,0), (-1,0), colors.HexColor("#0F172A")),
        ('ALIGN', (0,0), (0,-1), 'CENTER'),
        ('ALIGN', (2,0), (3,-1), 'CENTER'),
        ('ALIGN', (4,0), (-1,-1), 'RIGHT'),
        ('VALIGN', (0,0), (-1,-1), 'MIDDLE'),
        ('GRID', (0,0), (-1,-1), 0.5, colors.HexColor("#CBD5E1")),
        ('ROWBACKGROUNDS', (0,1), (-1,-1), [colors.white, colors.HexColor("#F8FAFC")]),
        ('TOPPADDING', (0,0), (-1,-1), 5),
        ('BOTTOMPADDING', (0,0), (-1,-1), 5),
    ]))
    elements.append(item_table)
    elements.append(Spacer(1, 10))
    
    # 4. SUMMARY & TOTAL
    terbilang_str = number_to_terbilang(grand_total) + " Rupiah"
    
    summary_data = [
        [Paragraph("<b>Subtotal Produk:</b>", normal_style), Paragraph(format_currency(subtotal_produk), normal_style)],
        [Paragraph("<b>Ongkos Kirim:</b>", normal_style), Paragraph(shipping_str, normal_style)],
        [Paragraph("<font size=10 color='#0F172A'><b>TOTAL TAGIHAN:</b></font>", normal_style), Paragraph(f"<font size=10 color='#0F172A'><b>{grand_total_str}</b></font>", normal_style)]
    ]
    summary_table = Table(summary_data, colWidths=[110, 80])
    summary_table.setStyle(TableStyle([
        ('ALIGN', (0,0), (0,-1), 'RIGHT'),
        ('ALIGN', (1,0), (1,-1), 'RIGHT'),
        ('VALIGN', (0,0), (-1,-1), 'MIDDLE'),
        ('LINEABOVE', (0,2), (1,2), 1, colors.HexColor("#0F172A")),
        ('TOPPADDING', (0,0), (-1,-1), 3),
        ('BOTTOMPADDING', (0,0), (-1,-1), 3),
    ]))
    
    terbilang_p = Paragraph(f"<b>Terbilang:</b><br/><i>#{terbilang_str}#</i><br/><br/><b>Kemasan:</b> Kardus ({order.get('kardus', 'Ya')}) | Kartu Ucapan ({order.get('kartu_ucapan', 'Tidak')})", normal_style)
    
    bot_table = Table([[terbilang_p, summary_table]], colWidths=[330, 210])
    bot_table.setStyle(TableStyle([
        ('VALIGN', (0,0), (-1,-1), 'TOP'),
        ('BACKGROUND', (0,0), (0,0), colors.HexColor("#F1F5F9")),
        ('BOX', (0,0), (0,0), 0.5, colors.HexColor("#CBD5E1")),
        ('TOPPADDING', (0,0), (-1,-1), 6),
        ('BOTTOMPADDING', (0,0), (-1,-1), 6),
        ('LEFTPADDING', (0,0), (-1,-1), 8),
        ('RIGHTPADDING', (0,0), (-1,-1), 8),
    ]))
    elements.append(bot_table)
    elements.append(Spacer(1, 14))
    
    # 5. PAYMENT & FOOTER
    payment_info = Paragraph(f"""
    <b>INFORMASI PEMBAYARAN:</b><br/>
    • Pembayaran dapat ditransfer ke rekening resmi operasional <b>Juragan by Anak Bawang</b>.<br/>
    • Catatan: {order['notes']}<br/>
    • <i>Terima kasih atas kepercayaan Anda memesan Bawang Goreng Asli Boyolali!</i>
    """, normal_style)
    elements.append(payment_info)
    
    doc.build(elements)
    return filepath

# ─── 1-STEP CLI ADD ORDER FUNCTION ───────────────────────────────────────────
def add_order_cli(args):
    """
    Appends a new order row to CSV and generates PDF/Markdown invoices in 1 step.
    """
    orders = load_orders_from_csv(DB_CSV_PATH)
    next_no = len(orders) + 1
    today_str = datetime.now().strftime("%Y-%m-%d")
    year_month = datetime.now().strftime("%Y/%m")
    inv_no = f"INV/{year_month}/{next_no:03d}"
    
    customer = args.customer
    area = args.area or "Solo Raya"
    items_str = args.items
    shipping_fee = args.shipping
    payment_status = "lunas" if args.status.lower() == "lunas" else "belum_lunas"
    delivery_status = "terkirim" if args.delivery.lower() == "terkirim" else "menunggu_pengiriman"
    kardus = args.kardus or "Ya"
    kartu = args.kartu or "Tidak"
    notes = args.notes or f"Harga Resmi {area}"
    
    parsed_items = parse_items_summary(items_str, area)
    total_product_price = sum(item["subtotal"] for item in parsed_items)
    total_hpp_bawang = sum(item["total_hpp"] for item in parsed_items)
    total_weight = sum(item["weight_kg"] for item in parsed_items)
    
    omset_bruto = total_product_price + shipping_fee
    omset_bersih = omset_bruto
    biaya_kardus = KARDUS_COST if kardus.lower() == "ya" else 0
    hpp_total = total_hpp_bawang + biaya_kardus
    profit_netto = omset_bersih - hpp_total
    margin_pct = (profit_netto / omset_bersih * 100) if omset_bersih > 0 else 0
    
    new_csv_row = [
        today_str,
        inv_no,
        customer,
        area,
        "WHATSAPP",
        items_str,
        f"{total_weight:.2f}",
        format_currency(omset_bruto),
        "Rp 0",
        format_currency(omset_bersih),
        format_currency(total_hpp_bawang),
        "Rp 0",
        "Rp 0",
        format_currency(biaya_kardus),
        "Rp 0",
        "Rp 0",
        format_currency(hpp_total),
        format_currency(profit_netto),
        f"{margin_pct:.1f}%",
        payment_status,
        delivery_status,
        "1",
        kardus,
        kartu,
        notes
    ]
    
    with open(DB_CSV_PATH, mode="a", encoding="utf-8", newline="") as f:
        writer = csv.writer(f)
        writer.writerow(new_csv_row)
        
    print(f"\n[OK] Berhasil mencatat transaksi baru ke CSV: {inv_no} ({customer})")
    
    # Reload & generate invoice
    all_orders = load_orders_from_csv(DB_CSV_PATH)
    latest_order = all_orders[-1]
    md_file = generate_markdown(latest_order, OUTPUT_INVOICE_DIR)
    pdf_file = generate_pdf(latest_order, OUTPUT_INVOICE_DIR)
    
    print(f"[OK] PDF Invoice: {pdf_file}")
    print(f"[OK] MD Invoice : {md_file}")
    print(f"💰 Omset: {format_currency(omset_bersih)} | Profit Netto: {format_currency(profit_netto)} (Margin: {margin_pct:.1f}%)\n")

# ─── MAIN EXECUTION ───────────────────────────────────────────────────────────
def main():
    parser = argparse.ArgumentParser(description="Juragan Dynamic Invoice & Order Generator")
    parser.add_argument("--add", action="store_true", help="Add new order to CSV and generate invoice in 1-step")
    parser.add_argument("--customer", type=str, help="Nama Pelanggan")
    parser.add_argument("--items", type=str, help="Summary item pesanan (contoh: 'Trial Pack Murni 100g x2; Grade A 250g x1')")
    parser.add_argument("--area", type=str, default="Solo Raya", help="Area pengiriman: 'Solo Raya' atau 'Jakarta / Jabodetabek'")
    parser.add_argument("--kardus", type=str, default="Ya", help="Kemasan kardus: 'Ya' atau 'Tidak'")
    parser.add_argument("--kartu", type=str, default="Tidak", help="Kartu ucapan: 'Ya' atau 'Tidak'")
    parser.add_argument("--status", type=str, default="Lunas", help="Status bayar: 'Lunas' atau 'Belum Lunas'")
    parser.add_argument("--delivery", type=str, default="Terkirim", help="Status kirim: 'Terkirim' atau 'Menunggu Pengiriman'")
    parser.add_argument("--shipping", type=int, default=0, help="Nominal ongkos kirim (Rp)")
    parser.add_argument("--notes", type=str, default="", help="Catatan transaksi")
    parser.add_argument("--inv", type=str, help="Generate invoice spesifik berdasarkan nomor invoice (contoh: INV/2026/08/018)")
    parser.add_argument("--latest", action="store_true", help="Hanya generate transaksi terakhir di CSV")
    
    args = parser.parse_args()
    
    if args.add:
        if not args.customer or not args.items:
            print("Error: Argumen --customer dan --items wajib diisi saat menggunakan --add!")
            sys.exit(1)
        add_order_cli(args)
        return
        
    orders = load_orders_from_csv(DB_CSV_PATH)
    if not orders:
        print("Tidak ada pesanan yang ditemukan di CSV.")
        return
        
    if args.inv:
        matched = [o for o in orders if o["inv_no"].lower() == args.inv.lower()]
        if not matched:
            print(f"Invoice dengan nomor {args.inv} tidak ditemukan.")
            return
        orders = matched
    elif args.latest:
        orders = [orders[-1]]
        
    print(f"Generating {len(orders)} customer invoices from CSV: {DB_CSV_PATH}")
    for order in orders:
        generate_markdown(order, OUTPUT_INVOICE_DIR)
        pdf_path = generate_pdf(order, OUTPUT_INVOICE_DIR)
        print(f"[OK] Generated Invoice: {os.path.basename(pdf_path)} ({order['customer']})")
        
    print("\nAll customer invoices generated successfully from CSV!\n")

if __name__ == "__main__":
    main()
