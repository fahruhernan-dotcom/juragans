import os
import sys
from reportlab.lib.pagesizes import A4
from reportlab.lib import colors
from reportlab.lib.styles import getSampleStyleSheet, ParagraphStyle
from reportlab.platypus import SimpleDocTemplate, Paragraph, Spacer, Table, TableStyle, HRFlowable

if sys.platform == "win32":
    try:
        sys.stdout.reconfigure(encoding='utf-8')
    except Exception:
        pass

BASE_DIR = os.path.dirname(os.path.abspath(__file__))
PDF_DIR = os.path.join(BASE_DIR, "Manajemen_Pesanan", "Pricelists", "PDF")
os.makedirs(PDF_DIR, exist_ok=True)

# Active SKUs Data with Updated Prices (v5)
DATA_SOLO_RAYA = [
    # Grade S Murni
    ["Grade S Murni", "Trial Pack Murni 100g (JBM-100-TRIAL)", "100g", "Rp 22.000"],
    ["Grade S Murni", "Murni Pouch 150g (JBM-150)", "150g", "Rp 29.000"],
    ["Grade S Murni", "Murni Pouch 200g (JBM-200)", "200g", "Rp 34.500"],
    ["Grade S Murni", "⭐ HERO SKU Murni Pouch 250g (JBM-250)", "250g", "Rp 39.500"],
    ["Grade S Murni", "Murni Bal PE 1 Kg (JBM-1K)", "1000g", "Rp 156.000"],
    ["Grade S Murni", "Paket Hemat 2x250g Murni (JBM-PAKET2X250)", "500g", "Rp 78.000"],
    ["Grade S Murni", "Paket Combo 150g + 250g Murni (JBM-COMBO150-250)", "400g", "Rp 68.000"],
    ["Grade S Murni", "Paket Grosir 1 kg 2x500g (JBM-PAKETGROSIR1KG)", "1000g", "Rp 159.000"],
    ["Grade S Murni", "Suplai Restoran 2 kg Bal PE (JBM-HORECA-2KG)", "2000g", "Rp 299.000"],
    # Grade A Crispy
    ["Grade A Crispy", "Trial Pack Grade A 100g (JBA-100-TRIAL)", "100g", "Rp 19.000"],
    ["Grade A Crispy", "Grade A Pouch 150g (JBA-150)", "150g", "Rp 25.500"],
    ["Grade A Crispy", "Grade A Pouch 200g (JBA-200)", "200g", "Rp 30.500"],
    ["Grade A Crispy", "⭐ HERO SKU Grade A Pouch 250g (JBA-250)", "250g", "Rp 37.500"],
    ["Grade A Crispy", "Grade A Bal PE 1 Kg (JBA-1K)", "1000g", "Rp 136.000"],
    ["Grade A Crispy", "Paket Hemat 2x250g Grade A (JBA-PAKET2X250)", "500g", "Rp 74.500"],
    ["Grade A Crispy", "Paket Combo 150g + 250g Grade A (JBA-COMBO150-250)", "400g", "Rp 61.000"],
    ["Grade A Crispy", "Paket Grosir 1 kg 2x500g (JBA-PAKETGROSIR1KG)", "1000g", "Rp 140.000"],
    ["Grade A Crispy", "Suplai Restoran 2 kg Bal PE (JBA-HORECA-2KG)", "2000g", "Rp 262.000"],
]

DATA_PUSAT = [
    # Grade S Murni
    ["Grade S Murni", "Trial Pack Murni 100g (JBM-100-TRIAL)", "100g", "Rp 23.500"],
    ["Grade S Murni", "Murni Pouch 150g (JBM-150)", "150g", "Rp 31.000"],
    ["Grade S Murni", "Murni Pouch 200g (JBM-200)", "200g", "Rp 36.500"],
    ["Grade S Murni", "⭐ HERO SKU Murni Pouch 250g (JBM-250)", "250g", "Rp 43.500"],
    ["Grade S Murni", "Murni Bal PE 1 Kg (JBM-1K)", "1000g", "Rp 165.500"],
    ["Grade S Murni", "Paket Hemat 2x250g Murni (JBM-PAKET2X250)", "500g", "Rp 85.000"],
    ["Grade S Murni", "Paket Combo 150g + 250g Murni (JBM-COMBO150-250)", "400g", "Rp 73.500"],
    ["Grade S Murni", "Paket Grosir 1 kg 2x500g (JBM-PAKETGROSIR1KG)", "1000g", "Rp 170.500"],
    ["Grade S Murni", "Suplai Restoran 2 kg Bal PE (JBM-HORECA-2KG)", "2000g", "Rp 319.000"],
    # Grade A Crispy
    ["Grade A Crispy", "Trial Pack Grade A 100g (JBA-100-TRIAL)", "100g", "Rp 21.000"],
    ["Grade A Crispy", "Grade A Pouch 150g (JBA-150)", "150g", "Rp 28.000"],
    ["Grade A Crispy", "Grade A Pouch 200g (JBA-200)", "200g", "Rp 32.500"],
    ["Grade A Crispy", "⭐ HERO SKU Grade A Pouch 250g (JBA-250)", "250g", "Rp 39.500"],
    ["Grade A Crispy", "Grade A Bal PE 1 Kg (JBA-1K)", "1000g", "Rp 146.000"],
    ["Grade A Crispy", "Paket Hemat 2x250g Grade A (JBA-PAKET2X250)", "500g", "Rp 80.500"],
    ["Grade A Crispy", "Paket Combo 150g + 250g Grade A (JBA-COMBO150-250)", "400g", "Rp 65.000"],
    ["Grade A Crispy", "Paket Grosir 1 kg 2x500g (JBA-PAKETGROSIR1KG)", "1000g", "Rp 151.000"],
    ["Grade A Crispy", "Suplai Restoran 2 kg Bal PE (JBA-HORECA-2KG)", "2000g", "Rp 282.000"],
]

def build_pdf(filename, area_title, data_rows):
    filepath = os.path.join(PDF_DIR, filename)
    doc = SimpleDocTemplate(
        filepath,
        pagesize=A4,
        rightMargin=30,
        leftMargin=30,
        topMargin=30,
        bottomMargin=30
    )

    styles = getSampleStyleSheet()
    
    # Custom Brand Palette
    MAROON = colors.HexColor("#7A1C1C")
    GOLD = colors.HexColor("#D4AF37")
    DARK_CHARCOAL = colors.HexColor("#1E1E1E")
    CREAM = colors.HexColor("#FDFBF7")
    LIGHT_GRAY = colors.HexColor("#F5F5F5")

    title_style = ParagraphStyle(
        'DocTitle',
        parent=styles['Heading1'],
        fontName='Helvetica-Bold',
        fontSize=18,
        leading=22,
        textColor=MAROON,
        spaceAfter=2
    )

    subtitle_style = ParagraphStyle(
        'SubTitle',
        parent=styles['Normal'],
        fontName='Helvetica-Bold',
        fontSize=10,
        leading=14,
        textColor=GOLD,
        spaceAfter=10
    )

    text_style = ParagraphStyle(
        'Body',
        parent=styles['Normal'],
        fontName='Helvetica',
        fontSize=9,
        leading=12,
        textColor=DARK_CHARCOAL
    )

    bold_text_style = ParagraphStyle(
        'BodyBold',
        parent=styles['Normal'],
        fontName='Helvetica-Bold',
        fontSize=9,
        leading=12,
        textColor=DARK_CHARCOAL
    )

    elements = []

    # Header Title
    elements.append(Paragraph("👑 JURAGAN BY ANAK BAWANG", title_style))
    elements.append(Paragraph(f"PRICELIST RESMI - {area_title.upper()}", subtitle_style))
    elements.append(HRFlowable(width="100%", thickness=2, color=MAROON, spaceBefore=0, spaceAfter=8))

    # Intro info
    elements.append(Paragraph("<i>Acuan Daftar Harga Resmi Bawang Goreng Premium Boyolali. Berlaku untuk pemesanan langsung/customer.</i>", text_style))
    elements.append(Spacer(1, 10))

    # Table Header
    table_data = [
        [
            Paragraph("<b>Nama Varian Produk</b>", bold_text_style),
            Paragraph("<b>Ukuran / Berat</b>", bold_text_style),
            Paragraph("<b>Harga Customer</b>", bold_text_style),
        ]
    ]

    current_kat = ""
    for row in data_rows:
        kat, name, size, price = row
        
        # Category Section Header Row
        if kat != current_kat:
            current_kat = kat
            table_data.append([
                Paragraph(f"<b>--- {kat.upper()} ---</b>", ParagraphStyle('KatHead', parent=styles['Normal'], fontName='Helvetica-Bold', fontSize=9, textColor=colors.white)),
                "", ""
            ])

        table_data.append([
            Paragraph(name, text_style),
            Paragraph(size, text_style),
            Paragraph(f"<b>{price}</b>", ParagraphStyle('PriceBold', parent=bold_text_style, textColor=MAROON)),
        ])

    # Table Styling
    # Printable width: 595 - 60 = 535 points
    t = Table(table_data, colWidths=[315, 100, 120])
    ts = [
        ('BACKGROUND', (0, 0), (-1, 0), GOLD),
        ('TEXTCOLOR', (0, 0), (-1, 0), colors.white),
        ('ALIGN', (0, 0), (-1, -1), 'LEFT'),
        ('ALIGN', (1, 0), (-1, -1), 'CENTER'),
        ('ALIGN', (2, 0), (-1, -1), 'RIGHT'),
        ('VALIGN', (0, 0), (-1, -1), 'MIDDLE'),
        ('BOTTOMPADDING', (0, 0), (-1, -1), 6),
        ('TOPPADDING', (0, 0), (-1, -1), 6),
        ('GRID', (0, 0), (-1, -1), 0.5, colors.HexColor("#E0E0E0")),
    ]

    # Category Section spans
    row_idx = 1
    current_k = ""
    for r in data_rows:
        kat = r[0]
        if kat != current_k:
            current_k = kat
            ts.append(('SPAN', (0, row_idx), (-1, row_idx)))
            ts.append(('BACKGROUND', (0, row_idx), (-1, row_idx), MAROON))
            ts.append(('BOTTOMPADDING', (0, row_idx), (-1, row_idx), 4))
            ts.append(('TOPPADDING', (0, row_idx), (-1, row_idx), 4))
            row_idx += 1
        row_idx += 1

    t.setStyle(TableStyle(ts))
    elements.append(t)

    elements.append(Spacer(1, 15))
    elements.append(HRFlowable(width="100%", thickness=1, color=GOLD, spaceBefore=4, spaceAfter=6))
    
    footer_text = "<b>Pemesanan & Informasi Kemitraan / Reseller / Restoran:</b><br/>WhatsApp Official Admin: +62 821-3373-1213 • Cepogo, Boyolali, Jawa Tengah"
    elements.append(Paragraph(footer_text, ParagraphStyle('Foot', parent=text_style, fontSize=8, leading=11, textColor=DARK_CHARCOAL)))

    doc.build(elements)
    print(f"✅ Re-generated PDF Pricelist: {filename}")

def main():
    build_pdf("pricelist_solo_raya.pdf", "Wilayah Solo Raya (Harga Lokal)", DATA_SOLO_RAYA)
    build_pdf("pricelist_jakarta_semarang.pdf", "Wilayah Luar Kota (Harga Nasional)", DATA_PUSAT)

if __name__ == "__main__":
    main()
