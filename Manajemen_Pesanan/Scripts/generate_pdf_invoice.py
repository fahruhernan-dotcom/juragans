import os
from reportlab.lib.pagesizes import letter
from reportlab.lib import colors
from reportlab.platypus import SimpleDocTemplate, Paragraph, Spacer, Table, TableStyle, HRFlowable
from reportlab.lib.styles import getSampleStyleSheet, ParagraphStyle

def create_invoice_pdf():
    pdf_filename = r"d:\Dokumen\02_Kerja_Profesional\Juragan by Anak Bawang\Manajemen_Pesanan\invoice_tagihan_pabrik_3kg.pdf"
    doc = SimpleDocTemplate(
        pdf_filename,
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
        fontSize=20,
        leading=24,
        textColor=colors.HexColor('#1E293B')
    )
    
    subtitle_style = ParagraphStyle(
        'DocSubTitle',
        parent=styles['Normal'],
        fontName='Helvetica-Bold',
        fontSize=12,
        leading=16,
        textColor=colors.HexColor('#0EA5E9')
    )
    
    normal_style = ParagraphStyle(
        'DocNormal',
        parent=styles['Normal'],
        fontName='Helvetica',
        fontSize=10,
        leading=14,
        textColor=colors.HexColor('#334155')
    )

    bold_style = ParagraphStyle(
        'DocBold',
        parent=styles['Normal'],
        fontName='Helvetica-Bold',
        fontSize=10,
        leading=14,
        textColor=colors.HexColor('#0F172A')
    )
    
    header_table_style = ParagraphStyle(
        'DocHeaderTable',
        parent=styles['Normal'],
        fontName='Helvetica-Bold',
        fontSize=10,
        leading=13,
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
    story.append(Paragraph("INVOICE TAGIHAN PENGAMBILAN STOK PABRIK", title_style))
    story.append(Spacer(1, 10))
    story.append(HRFlowable(width="100%", thickness=2, color=colors.HexColor('#0EA5E9'), spaceAfter=15))
    
    meta_data = [
        [Paragraph("<b>No. Invoice:</b> INV/PABRIK/2026/08/001", normal_style), Paragraph("<b>Tanggal:</b> 6 Agustus 2026", normal_style)],
        [Paragraph("<b>Penerbit Tagihan:</b> Pabrik Bawang Boyolali", normal_style), Paragraph("<b>Ditujukan Kepada:</b> Owner (Juragan by Anak Bawang)", normal_style)],
        [Paragraph("<b>Status Pembayaran:</b> <font color='#059669'><b>LUNAS (Dibayar Sdr. Fahru)</b></font>", normal_style), Paragraph("<b>Metode:</b> Dana Pribadi Sdr. Fahru", normal_style)]
    ]
    meta_table = Table(meta_data, colWidths=[270, 270])
    meta_table.setStyle(TableStyle([
        ('BACKGROUND', (0,0), (-1,-1), colors.HexColor('#F8FAFC')),
        ('PADDING', (0,0), (-1,-1), 8),
        ('VALIGN', (0,0), (-1,-1), 'MIDDLE'),
        ('BOX', (0,0), (-1,-1), 1, colors.HexColor('#E2E8F0')),
        ('INNERGRID', (0,0), (-1,-1), 0.5, colors.HexColor('#F1F5F9'))
    ]))
    story.append(meta_table)
    story.append(Spacer(1, 20))
    
    headers = [
        Paragraph("No", header_table_style),
        Paragraph("Deskripsi Produk / Varian", header_table_style),
        Paragraph("Kuantitas", header_table_style),
        Paragraph("Harga Satuan Pabrik", header_table_style),
        Paragraph("Subtotal Tagihan", header_table_style)
    ]
    
    table_data = [headers]
    items = [
        ("1", "<b>Bawang Goreng Grade S Murni</b><br/><font size=8 color='#64748B'>100% Bawang Merah Boyolali (Tanpa Tepung)</font>", "2 kg", "Rp 120.000 / kg", "Rp 240.000"),
        ("2", "<b>Bawang Goreng Grade A Premium</b><br/><font size=8 color='#64748B'>Crispy Renyah Gurih</font>", "1 kg", "Rp 105.000 / kg", "Rp 105.000")
    ]
    
    for no, item, qty, price, total in items:
        table_data.append([
            Paragraph(no, normal_style),
            Paragraph(item, normal_style),
            Paragraph(qty, normal_style),
            Paragraph(price, normal_style),
            Paragraph(f"<b>{total}</b>", normal_style)
        ])
        
    items_table = Table(table_data, colWidths=[35, 235, 70, 100, 100])
    items_table.setStyle(TableStyle([
        ('BACKGROUND', (0,0), (-1,0), colors.HexColor('#1E293B')),
        ('VALIGN', (0,0), (-1,-1), 'MIDDLE'),
        ('PADDING', (0,0), (-1,-1), 8),
        ('ROWBACKGROUNDS', (0,1), (-1,-1), [colors.white, colors.HexColor('#F8FAFC')]),
        ('GRID', (0,0), (-1,-1), 0.5, colors.HexColor('#CBD5E1'))
    ]))
    
    story.append(items_table)
    story.append(Spacer(1, 15))
    
    total_data = [
        [Paragraph("<b>TOTAL KUANTITAS:</b> 3,00 kg", bold_style), Paragraph("<b>TOTAL AKUMULASI TAGIHAN:</b>", right_bold_style), Paragraph("<font size=13 color='#0F766E'><b>Rp 345.000</b></font>", right_bold_style)]
    ]
    total_table = Table(TableStyle([
        ('BACKGROUND', (0,0), (-1,-1), colors.HexColor('#CCFBF1')),
        ('BOX', (0,0), (-1,-1), 1, colors.HexColor('#0D9488')),
        ('PADDING', (0,0), (-1,-1), 10),
        ('VALIGN', (0,0), (-1,-1), 'MIDDLE')
    ])) if False else total_data
    total_table = Table(total_data, colWidths=[200, 180, 160])
    total_table.setStyle(TableStyle([
        ('BACKGROUND', (0,0), (-1,-1), colors.HexColor('#CCFBF1')),
        ('BOX', (0,0), (-1,-1), 1, colors.HexColor('#0D9488')),
        ('PADDING', (0,0), (-1,-1), 10),
        ('VALIGN', (0,0), (-1,-1), 'MIDDLE')
    ]))
    story.append(total_table)
    story.append(Spacer(1, 25))
    
    story.append(Paragraph("<b>📌 Catatan Pembayaran & Operasional:</b>", bold_style))
    story.append(Spacer(1, 6))
    notes_text = """
    1. Pengambilan stok ini terdiri dari 2 kg Grade S Murni dan 1 kg Grade A Premium.<br/>
    2. Tagihan sebesar <b>Rp 345.000</b> telah <b>LUNAS TERBAYAR</b> menggunakan uang pribadi Sdr. Fahru (10 Agt 2026).<br/>
    3. Faktur ini merupakan bukti sah pelunasan HPP Modal stok awal Batch 1 bulan Agustus 2026.
    """
    story.append(Paragraph(notes_text, normal_style))
    
    doc.build(story)
    print("Factory Invoice PDF created successfully at:", pdf_filename)

if __name__ == "__main__":
    create_invoice_pdf()
