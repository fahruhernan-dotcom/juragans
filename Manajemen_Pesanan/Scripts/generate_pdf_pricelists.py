import os
from reportlab.lib.pagesizes import letter
from reportlab.lib import colors
from reportlab.platypus import SimpleDocTemplate, Paragraph, Spacer, Table, TableStyle, HRFlowable
from reportlab.lib.styles import getSampleStyleSheet, ParagraphStyle

def generate_pdf(filename, region_title, subtitle_text, grade_s_data, grade_a_data, bundling_data, theme_color):
    doc = SimpleDocTemplate(
        filename,
        pagesize=letter,
        rightMargin=36,
        leftMargin=36,
        topMargin=36,
        bottomMargin=36
    )
    
    styles = getSampleStyleSheet()
    
    title_style = ParagraphStyle(
        'DocTitle',
        parent=styles['Heading1'],
        fontName='Helvetica-Bold',
        fontSize=18,
        leading=22,
        textColor=colors.HexColor('#6B1110')
    )
    
    subtitle_style = ParagraphStyle(
        'DocSubTitle',
        parent=styles['Normal'],
        fontName='Helvetica-Bold',
        fontSize=11,
        leading=14,
        textColor=theme_color
    )

    section_heading = ParagraphStyle(
        'SecHead',
        parent=styles['Heading2'],
        fontName='Helvetica-Bold',
        fontSize=12,
        leading=16,
        textColor=colors.HexColor('#1E293B')
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

    story = []
    
    story.append(Paragraph("JURAGAN BY ANAK BAWANG", title_style))
    story.append(Spacer(1, 2))
    story.append(Paragraph(f"DAFTAR HARGA RESMI CUSTOMER — {region_title.upper()}", subtitle_style))
    story.append(Spacer(1, 4))
    story.append(Paragraph("<i>Bawang Merah Goreng Premium Boyolali • Sertifikat Halal: ID33110018517710724</i>", normal_style))
    story.append(Spacer(1, 8))
    story.append(HRFlowable(width="100%", thickness=2, color=theme_color, spaceAfter=12))
    
    # Grade S Section
    story.append(Paragraph("🧅 <b>1. Grade S Murni</b> (100% Bawang Merah Boyolali - Tanpa Tepung)", section_heading))
    story.append(Spacer(1, 6))
    
    s_headers = [Paragraph("Ukuran Kemasan", header_table_style), Paragraph("Jenis Kemasan", header_table_style), Paragraph("Harga Customer", header_table_style), Paragraph("Keterangan", header_table_style)]
    s_table_data = [s_headers]
    for uk, kms, hrga, ket in grade_s_data:
        s_table_data.append([
            Paragraph(f"<b>{uk}</b>", bold_style),
            Paragraph(kms, normal_style),
            Paragraph(f"<b>{hrga}</b>", bold_style),
            Paragraph(ket, normal_style)
        ])
    
    t_s = Table(s_table_data, colWidths=[120, 150, 110, 160])
    t_s.setStyle(TableStyle([
        ('BACKGROUND', (0,0), (-1,0), theme_color),
        ('VALIGN', (0,0), (-1,-1), 'MIDDLE'),
        ('PADDING', (0,0), (-1,-1), 5),
        ('ROWBACKGROUNDS', (0,1), (-1,-1), [colors.white, colors.HexColor('#F8FAFC')]),
        ('GRID', (0,0), (-1,-1), 0.5, colors.HexColor('#CBD5E1'))
    ]))
    story.append(t_s)
    story.append(Spacer(1, 12))

    # Grade A Section
    story.append(Paragraph("🧄 <b>2. Grade A Premium Crispy</b> (Renyah Gurih - Tepung Tipis 5%)", section_heading))
    story.append(Spacer(1, 6))
    
    a_headers = [Paragraph("Ukuran Kemasan", header_table_style), Paragraph("Jenis Kemasan", header_table_style), Paragraph("Harga Customer", header_table_style), Paragraph("Keterangan", header_table_style)]
    a_table_data = [a_headers]
    for uk, kms, hrga, ket in grade_a_data:
        a_table_data.append([
            Paragraph(f"<b>{uk}</b>", bold_style),
            Paragraph(kms, normal_style),
            Paragraph(f"<b>{hrga}</b>", bold_style),
            Paragraph(ket, normal_style)
        ])
    
    t_a = Table(a_table_data, colWidths=[120, 150, 110, 160])
    t_a.setStyle(TableStyle([
        ('BACKGROUND', (0,0), (-1,0), colors.HexColor('#334155')),
        ('VALIGN', (0,0), (-1,-1), 'MIDDLE'),
        ('PADDING', (0,0), (-1,-1), 5),
        ('ROWBACKGROUNDS', (0,1), (-1,-1), [colors.white, colors.HexColor('#F8FAFC')]),
        ('GRID', (0,0), (-1,-1), 0.5, colors.HexColor('#CBD5E1'))
    ]))
    story.append(t_a)
    story.append(Spacer(1, 12))

    # Bundling Section
    story.append(Paragraph("📦 <b>3. Paket Hemat Bundling & Horeca</b>", section_heading))
    story.append(Spacer(1, 6))
    
    b_headers = [Paragraph("Nama Paket Bundling", header_table_style), Paragraph("Varian", header_table_style), Paragraph("Isi Paket", header_table_style), Paragraph("Harga Paket", header_table_style)]
    b_table_data = [b_headers]
    for nama_p, var_p, isi_p, hrga_p in bundling_data:
        b_table_data.append([
            Paragraph(f"<b>{nama_p}</b>", bold_style),
            Paragraph(var_p, normal_style),
            Paragraph(isi_p, normal_style),
            Paragraph(f"<b>{hrga_p}</b>", bold_style)
        ])
    
    t_b = Table(b_table_data, colWidths=[160, 110, 140, 130])
    t_b.setStyle(TableStyle([
        ('BACKGROUND', (0,0), (-1,0), colors.HexColor('#0F766E')),
        ('VALIGN', (0,0), (-1,-1), 'MIDDLE'),
        ('PADDING', (0,0), (-1,-1), 5),
        ('ROWBACKGROUNDS', (0,1), (-1,-1), [colors.white, colors.HexColor('#F0FDF4')]),
        ('GRID', (0,0), (-1,-1), 0.5, colors.HexColor('#99F6E4'))
    ]))
    story.append(t_b)
    story.append(Spacer(1, 14))

    # Footnote
    footer_text = """
    <b>Informasi & Pemesanan:</b><br/>
    📞 WhatsApp Official: <b>+62 821-3373-1213</b> | 📍 Lokasi Produksi: Cepogo, Boyolali, Jawa Tengah<br/>
    <i>*Melayani Pengiriman Ekspedisi Hemat ke Seluruh Indonesia (COD / Transfer Bank / QRIS).</i>
    """
    footer_table = Table([[Paragraph(footer_text, normal_style)]], colWidths=[540])
    footer_table.setStyle(TableStyle([
        ('BACKGROUND', (0,0), (-1,-1), colors.HexColor('#FEF3C7')),
        ('BOX', (0,0), (-1,-1), 1, colors.HexColor('#F59E0B')),
        ('PADDING', (0,0), (-1,-1), 8),
        ('VALIGN', (0,0), (-1,-1), 'MIDDLE')
    ]))
    story.append(footer_table)
    
    doc.build(story)
    print(f"PDF successfully generated: {filename}")

def main():
    base_dir = r"d:\Dokumen\02_Kerja_Profesional\Juragan by Anak Bawang\Manajemen_Pesanan"
    root_dir = r"d:\Dokumen\02_Kerja_Profesional\Juragan by Anak Bawang"
    
def main():
    base_dir = r"d:\Dokumen\02_Kerja_Profesional\Juragan by Anak Bawang\Manajemen_Pesanan"
    root_dir = r"d:\Dokumen\02_Kerja_Profesional\Juragan by Anak Bawang"
    
def main():
    base_dir = r"d:\Dokumen\02_Kerja_Profesional\Juragan by Anak Bawang\Manajemen_Pesanan"
    root_dir = r"d:\Dokumen\02_Kerja_Profesional\Juragan by Anak Bawang"
    
    # Data Solo Raya (Lokal)
    solo_s = [
        ("100 Gram", "Pouch Ziplock", "Rp 21.600", "Trial Pack / Tester Pack"),
        ("150 Gram", "Pouch Ziplock", "Rp 26.000", "Kemasan Hemat Rumahan"),
        ("200 Gram", "Pouch Ziplock", "Rp 34.500", "Kemasan Sedang Rumahan"),
        ("250 Gram", "Pouch Ziplock", "Rp 40.000", "🔥 BEST SELLER HERO SKU"),
        ("1.000 Gram (1 kg)", "Kemasan Bal PE", "Rp 152.000", "📦 Grosir PE Bal (Tanpa Pouch/Stiker)")
    ]
    solo_a = [
        ("100 Gram", "Pouch Ziplock", "Rp 18.900", "Trial Pack / Tester Pack"),
        ("150 Gram", "Pouch Ziplock", "Rp 25.000", "Kemasan Ekonomis"),
        ("200 Gram", "Pouch Ziplock", "Rp 31.000", "Kemasan Sedang Rumahan"),
        ("250 Gram", "Pouch Ziplock", "Rp 35.000", "🔥 BEST SELLER HERO SKU"),
        ("1.000 Gram (1 kg)", "Kemasan Bal PE", "Rp 125.000", "📦 Grosir PE Bal (Tanpa Pouch/Stiker)")
    ]
    solo_b = [
        ("Paket Hemat Bundling", "Grade S Murni", "2 Pouch @ 250g (500g)", "Rp 78.000"),
        ("Paket Combo Rumahan", "Grade S Murni", "Pouch 150g + 250g (400g)", "Rp 64.500"),
        ("Paket Super Grosir", "Grade S Murni", "2 Pouch @ 500g (1 kg)", "Rp 148.000"),
        ("Paket Suplai Horeca", "Grade S Murni", "Bal PE Grosir 2 kg", "Rp 304.000"),
        ("Paket Hemat Bundling", "Grade A Crispy", "2 Pouch @ 250g (500g)", "Rp 70.000"),
        ("Paket Combo Rumahan", "Grade A Crispy", "Pouch 150g + 250g (400g)", "Rp 59.000"),
        ("Paket Super Grosir", "Grade A Crispy", "2 Pouch @ 500g (1 kg)", "Rp 130.000"),
        ("Paket Suplai Horeca", "Grade A Crispy", "Bal PE Grosir 2 kg", "Rp 250.000")
    ]

    # Data Jakarta & Semarang (Pusat)
    jkt_s = [
        ("100 Gram", "Pouch Ziplock", "Rp 23.500", "Trial Pack / Tester Pack"),
        ("150 Gram", "Pouch Ziplock", "Rp 26.500", "Kemasan Hemat Rumahan"),
        ("200 Gram", "Pouch Ziplock", "Rp 37.500", "Kemasan Sedang Rumahan"),
        ("250 Gram", "Pouch Ziplock", "Rp 43.500", "🔥 BEST SELLER HERO SKU"),
        ("1.000 Gram (1 kg)", "Kemasan Bal PE", "Rp 165.500", "📦 Grosir PE Bal (Tanpa Pouch/Stiker)")
    ]
    jkt_a = [
        ("100 Gram", "Pouch Ziplock", "Rp 20.500", "Trial Pack / Tester Pack"),
        ("150 Gram", "Pouch Ziplock", "Rp 26.500", "Kemasan Ekonomis"),
        ("200 Gram", "Pouch Ziplock", "Rp 31.500", "Kemasan Sedang Rumahan"),
        ("250 Gram", "Pouch Ziplock", "Rp 37.500", "🔥 BEST SELLER HERO SKU"),
        ("1.000 Gram (1 kg)", "Kemasan Bal PE", "Rp 135.500", "📦 Grosir PE Bal (Tanpa Pouch/Stiker)")
    ]
    jkt_b = [
        ("Paket Hemat Bundling", "Grade S Murni", "2 Pouch @ 250g (500g)", "Rp 87.000"),
        ("Paket Combo Rumahan", "Grade S Murni", "Pouch 150g + 250g (400g)", "Rp 70.000"),
        ("Paket Super Grosir", "Grade S Murni", "2 Pouch @ 500g (1 kg)", "Rp 161.000"),
        ("Paket Suplai Horeca", "Grade S Murni", "Bal PE Grosir 2 kg", "Rp 331.000"),
        ("Paket Hemat Bundling", "Grade A Crispy", "2 Pouch @ 250g (500g)", "Rp 75.000"),
        ("Paket Combo Rumahan", "Grade A Crispy", "Pouch 150g + 250g (400g)", "Rp 64.000"),
        ("Paket Super Grosir", "Grade A Crispy", "2 Pouch @ 500g (1 kg)", "Rp 141.000"),
        ("Paket Suplai Horeca", "Grade A Crispy", "Bal PE Grosir 2 kg", "Rp 271.000")
    ]

    pdf_out_dir = os.path.join(base_dir, "Pricelists", "PDF")
    os.makedirs(pdf_out_dir, exist_ok=True)
    
    file_solo_sub = os.path.join(pdf_out_dir, "pricelist_solo_raya.pdf")
    file_jkt_sub = os.path.join(pdf_out_dir, "pricelist_jakarta_semarang.pdf")
    
    file_solo_root = os.path.join(root_dir, "pricelist_solo_raya.pdf")
    file_jkt_root = os.path.join(root_dir, "pricelist_jakarta_semarang.pdf")

    # Generate PDFs in subfolder and root
    generate_pdf(file_solo_sub, "Wilayah Pasar Solo Raya (Lokal)", "Harga Ekonomis Wilayah Surakarta, Boyolali, Sukoharjo & Sekitarnya", solo_s, solo_a, solo_b, colors.HexColor('#D97706'))
    generate_pdf(file_jkt_sub, "Wilayah Pasar Jakarta & Semarang", "Harga Standar Wilayah Perkotaan Jakarta, Semarang & Sekitarnya", jkt_s, jkt_a, jkt_b, colors.HexColor('#0284C7'))

    generate_pdf(file_solo_root, "Wilayah Pasar Solo Raya (Lokal)", "Harga Ekonomis Wilayah Surakarta, Boyolali, Sukoharjo & Sekitarnya", solo_s, solo_a, solo_b, colors.HexColor('#D97706'))
    generate_pdf(file_jkt_root, "Wilayah Pasar Jakarta & Semarang", "Harga Standar Wilayah Perkotaan Jakarta, Semarang & Sekitarnya", jkt_s, jkt_a, jkt_b, colors.HexColor('#0284C7'))

if __name__ == "__main__":
    main()
