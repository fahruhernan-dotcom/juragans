import os
import csv
from reportlab.lib.pagesizes import letter
from reportlab.lib import colors
from reportlab.platypus import SimpleDocTemplate, Paragraph, Spacer, Table, TableStyle, HRFlowable
from reportlab.lib.styles import getSampleStyleSheet, ParagraphStyle

BASE_DIR = os.path.dirname(os.path.dirname(os.path.dirname(os.path.abspath(__file__))))
PESANAN_DIR = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
CSV_PATH = os.path.join(PESANAN_DIR, "Database", "daftar_pesanan_agustus_2026.csv")
PDF_PATH = os.path.join(PESANAN_DIR, "Laporan_Gudang", "laporan_analisis_stok_agustus_2026.pdf")

def create_report_pdf():
    os.makedirs(os.path.dirname(PDF_PATH), exist_ok=True)
    doc = SimpleDocTemplate(
        PDF_PATH,
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
        fontSize=16,
        leading=20,
        textColor=colors.HexColor('#1E293B')
    )
    
    h2_style = ParagraphStyle(
        'DocH2',
        parent=styles['Heading2'],
        fontName='Helvetica-Bold',
        fontSize=11,
        leading=15,
        textColor=colors.HexColor('#0284C7'),
        spaceBefore=10,
        spaceAfter=6
    )
    
    normal_style = ParagraphStyle(
        'DocNormal',
        parent=styles['Normal'],
        fontName='Helvetica',
        fontSize=8.5,
        leading=12,
        textColor=colors.HexColor('#334155')
    )

    bold_style = ParagraphStyle(
        'DocBold',
        parent=styles['Normal'],
        fontName='Helvetica-Bold',
        fontSize=8.5,
        leading=12,
        textColor=colors.HexColor('#0F172A')
    )
    
    header_table_style = ParagraphStyle(
        'DocHeaderTable',
        parent=styles['Normal'],
        fontName='Helvetica-Bold',
        fontSize=8.5,
        leading=11,
        textColor=colors.white
    )

    story = []
    
    story.append(Paragraph("LAPORAN PENDATAAN PESANAN & ANALISIS STOK — AGUSTUS 2026", title_style))
    story.append(Spacer(1, 4))
    story.append(Paragraph("Juragan by Anak Bawang — Per 10 Agustus 2026", bold_style))
    story.append(Spacer(1, 6))
    story.append(HRFlowable(width="100%", thickness=2, color=colors.HexColor('#0284C7'), spaceAfter=10))
    
    # Section 1
    story.append(Paragraph("1. Pendataan Pesanan Ritel & Rumah Tangga", h2_style))
    
    story.append(Paragraph("<b>🚚 A. Pesanan Terkirim (Semarang):</b>", bold_style))
    story.append(Paragraph("• <b>Penerima:</b> Adip (Kamar 9) — Rumah Kost Eksklusif Bulusan, Jl. Bulusan Selatan Raya No.9a, Tembalang, Semarang<br/>• <b>Item:</b> 1 pack x 250g Grade S Murni (0,25 kg) | <b>Harga:</b> Rp 43.500 | <b>Status:</b> TERKIRIM ✅ (5 Agustus 2026)", normal_style))
    story.append(Spacer(1, 8))
    
    story.append(Paragraph("<b>📦 B. Daftar Pesanan Masuk Baru (Belum Terkirim):</b>", bold_style))
    story.append(Spacer(1, 4))
    
    headers = [
        Paragraph("No", header_table_style),
        Paragraph("Nama Pemesan", header_table_style),
        Paragraph("Varian", header_table_style),
        Paragraph("Kemasan", header_table_style),
        Paragraph("Qty", header_table_style),
        Paragraph("Total (Kg)", header_table_style),
        Paragraph("Harga Satuan", header_table_style),
        Paragraph("Status", header_table_style)
    ]
    
    table_data = [headers]
    orders = [
        ("1", "Renny", "Grade S Murni", "200g", "2 pack", "0,40 kg", "Rp 37.500", "Menunggu Kirim"),
        ("2", "Anggi", "Grade S Murni", "200g", "5 pack", "1,00 kg", "Rp 33.100", "Menunggu Kirim"),
        ("3", "Hendry", "Grade S Murni", "200g", "4 pack", "0,80 kg", "Rp 37.500", "Menunggu Kirim"),
        ("4", "Amal", "Grade S Murni", "250g", "2 pack", "0,50 kg", "Rp 43.500", "Menunggu Kirim"),
        ("5", "Widi", "Grade S Murni", "150g", "4 pack", "0,60 kg", "Rp 26.500", "Menunggu Kirim"),
        ("6", "Bukit", "Grade S Murni", "250g", "2 pack", "0,50 kg", "Rp 43.500", "Menunggu Kirim"),
        ("7", "Didi", "Grade A Crispy", "100g", "20 pack", "2,00 kg", "Rp 13.550", "Menunggu Kirim"),
        ("8", "Ares", "Grade S Murni", "250g", "1 pack", "0,25 kg", "Rp 40.000", "Menunggu Kirim"),
        ("9", "Zaki", "Grade S Murni", "100g", "1 pack", "0,10 kg", "Rp 21.600", "Menunggu Kirim"),
        ("10", "Zaki", "Grade A Crispy", "100g", "1 pack", "0,10 kg", "Rp 18.900", "Menunggu Kirim"),
        ("11", "Farhan", "Grade S Murni", "250g", "4 pack", "1,00 kg", "Rp 43.500", "Menunggu Kirim"),
        ("12", "Yatmo", "Grade S Murni", "250g", "2 pack", "0,50 kg", "Rp 43.500", "Menunggu Kirim"),
    ]
    
    for no, name, var, pkg, qty, kg, price, status in orders:
        table_data.append([
            Paragraph(no, normal_style),
            Paragraph(f"<b>{name}</b>", normal_style),
            Paragraph(var, normal_style),
            Paragraph(pkg, normal_style),
            Paragraph(qty, normal_style),
            Paragraph(kg, normal_style),
            Paragraph(price, normal_style),
            Paragraph(status, normal_style)
        ])
        
    table_data.append([
        Paragraph("<b>TOTAL</b>", bold_style),
        Paragraph("<b>12 Pemesan</b>", bold_style),
        Paragraph("—", normal_style),
        Paragraph("—", normal_style),
        Paragraph("<b>48 pack</b>", bold_style),
        Paragraph("<b>7,75 kg</b>", bold_style),
        Paragraph("—", bold_style),
        Paragraph("—", normal_style)
    ])
    
    orders_table = Table(table_data, colWidths=[20, 75, 90, 55, 45, 55, 75, 95])
    orders_table.setStyle(TableStyle([
        ('BACKGROUND', (0,0), (-1,0), colors.HexColor('#0F172A')),
        ('VALIGN', (0,0), (-1,-1), 'MIDDLE'),
        ('PADDING', (0,0), (-1,-1), 4),
        ('ROWBACKGROUNDS', (0,1), (-1,-2), [colors.white, colors.HexColor('#F8FAFC')]),
        ('BACKGROUND', (0,-1), (-1,-1), colors.HexColor('#E2E8F0')),
        ('GRID', (0,0), (-1,-1), 0.5, colors.HexColor('#CBD5E1'))
    ]))
    story.append(orders_table)
    story.append(Spacer(1, 10))
    
    # Section 2
    story.append(Paragraph("2. Rekapitulasi & Analisis Kebutuhan Stok", h2_style))
    
    stock_headers = [
        Paragraph("Varian Bawang", header_table_style),
        Paragraph("Stok Awal", header_table_style),
        Paragraph("Terkirim", header_table_style),
        Paragraph("Sisa Stok Fisik", header_table_style),
        Paragraph("Kebutuhan Order Baru", header_table_style),
        Paragraph("Status Defisit Net", header_table_style)
    ]
    stock_data = [
        stock_headers,
        [Paragraph("<b>Grade S (Murni)</b>", normal_style), Paragraph("2,00 kg", normal_style), Paragraph("0,25 kg", normal_style), Paragraph("<b>1,75 kg</b>", normal_style), Paragraph("5,65 kg", normal_style), Paragraph("<font color='#DC2626'><b>Defisit 3,90 kg</b></font>", normal_style)],
        [Paragraph("<b>Grade A (Crispy)</b>", normal_style), Paragraph("1,00 kg", normal_style), Paragraph("0 kg", normal_style), Paragraph("<b>1,00 kg</b>", normal_style), Paragraph("2,10 kg", normal_style), Paragraph("<font color='#DC2626'><b>Defisit 1,10 kg</b></font>", normal_style)]
    ]
    
    stock_table = Table(stock_data, colWidths=[105, 60, 55, 80, 105, 105])
    stock_table.setStyle(TableStyle([
        ('BACKGROUND', (0,0), (-1,0), colors.HexColor('#0369A1')),
        ('VALIGN', (0,0), (-1,-1), 'MIDDLE'),
        ('PADDING', (0,0), (-1,-1), 5),
        ('ROWBACKGROUNDS', (0,1), (-1,-1), [colors.white, colors.HexColor('#F8FAFC')]),
        ('GRID', (0,0), (-1,-1), 0.5, colors.HexColor('#CBD5E1'))
    ]))
    story.append(stock_table)
    story.append(Spacer(1, 10))
    
    # Section 3
    story.append(Paragraph("3. Rekomendasi Pemesanan ke Supplier (Pabrik)", h2_style))
    action_text = """
    1. <b>Grade S Murni:</b> Pas kebutuhan tambahan murni adalah <b>3,90 kg</b>. Direkomendasikan memesan <b>4,5 kg – 5,0 kg</b> (Modal Rp 540.000 – Rp 600.000) untuk buffer cadangan stok.<br/>
    2. <b>Grade A Crispy:</b> Pas kebutuhan tambahan murni adalah <b>1,10 kg</b>. Direkomendasikan memesan <b>1,5 kg – 2,0 kg</b> (Modal Rp 157.500 – Rp 210.000) untuk buffer cadangan stok.<br/>
    3. <b>Total Pasokan Suplier Baru:</b> Minimal murni <b>5,00 kg</b> (Rekomendasi Aman: <b>6,0 kg – 7,0 kg</b> total gabungan).
    """
    story.append(Paragraph(action_text, normal_style))
    
    doc.build(story)
    print("Report PDF created successfully at:", PDF_PATH)

if __name__ == "__main__":
    create_report_pdf()
