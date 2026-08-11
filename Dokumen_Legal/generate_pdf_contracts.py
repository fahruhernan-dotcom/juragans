import os
import re
from reportlab.lib.pagesizes import letter, A4
from reportlab.lib import colors
from reportlab.platypus import (
    SimpleDocTemplate, Paragraph, Spacer, Table, TableStyle, PageBreak, KeepTogether, HRFlowable
)
from reportlab.lib.styles import getSampleStyleSheet, ParagraphStyle
from reportlab.lib.units import cm
from reportlab.pdfgen import canvas

class NumberedCanvas(canvas.Canvas):
    def __init__(self, *args, **kwargs):
        super().__init__(*args, **kwargs)
        self._saved_page_states = []

    def showPage(self):
        self._saved_page_states.append(dict(self.__dict__))
        self._startPage()

    def save(self):
        num_pages = len(self._saved_page_states)
        for state in self._saved_page_states:
            self.__dict__.update(state)
            self.draw_page_decorations(num_pages)
            super().showPage()
        super().save()

    def draw_page_decorations(self, page_count):
        self.saveState()
        self.setFont("Helvetica-Bold", 8)
        self.setFillColor(colors.HexColor("#7A1C1C"))
        
        # Header text
        self.drawString(2 * cm, 28.3 * cm, "JURAGAN BY ANAK BAWANG")
        self.setFont("Helvetica", 8)
        self.setFillColor(colors.HexColor("#666666"))
        self.drawRightString(19 * cm, 28.3 * cm, "DOKUMEN RESMI PERJANJIAN KERJA & USALAN LEGAL")
        
        # Header line
        self.setStrokeColor(colors.HexColor("#D4AF37"))
        self.setLineWidth(1)
        self.line(2 * cm, 28.1 * cm, 19 * cm, 28.1 * cm)
        
        # Footer line
        self.line(2 * cm, 1.8 * cm, 19 * cm, 1.8 * cm)
        
        # Footer text
        self.setFont("Helvetica-Oblique", 8)
        self.setFillColor(colors.HexColor("#777777"))
        self.drawString(2 * cm, 1.3 * cm, "Dokumen Rahasia & Mengikat Hukum — Juragan by Anak Bawang Boyolali")
        page_text = f"Halaman {self._pageNumber} dari {page_count}"
        self.drawRightString(19 * cm, 1.3 * cm, page_text)
        self.restoreState()

def parse_markdown_to_pdf_flowables(md_filepath):
    if not os.path.exists(md_filepath):
        print(f"Error: File not found {md_filepath}")
        return []

    with open(md_filepath, 'r', encoding='utf-8') as f:
        lines = f.readlines()

    styles = getSampleStyleSheet()
    
    # Custom styles
    title_style = ParagraphStyle(
        'ContractTitle',
        parent=styles['Heading1'],
        fontName='Helvetica-Bold',
        fontSize=16,
        leading=20,
        textColor=colors.HexColor('#7A1C1C'),
        alignment=1, # Center
        spaceAfter=4
    )
    
    doc_num_style = ParagraphStyle(
        'DocNum',
        parent=styles['Normal'],
        fontName='Helvetica-Bold',
        fontSize=10,
        leading=14,
        textColor=colors.HexColor('#333333'),
        alignment=1,
        spaceAfter=12
    )

    h2_style = ParagraphStyle(
        'ContractH2',
        parent=styles['Heading2'],
        fontName='Helvetica-Bold',
        fontSize=11,
        leading=15,
        textColor=colors.HexColor('#7A1C1C'),
        spaceBefore=10,
        spaceAfter=6,
        keepWithNext=True
    )
    
    body_style = ParagraphStyle(
        'ContractBody',
        parent=styles['Normal'],
        fontName='Helvetica',
        fontSize=9.5,
        leading=14,
        textColor=colors.HexColor('#222222'),
        spaceAfter=6,
        alignment=4 # Justified
    )
    
    bullet_style = ParagraphStyle(
        'ContractBullet',
        parent=styles['Normal'],
        fontName='Helvetica',
        fontSize=9.5,
        leading=13.5,
        leftIndent=15,
        textColor=colors.HexColor('#222222'),
        spaceAfter=3
    )
    
    sig_text_style = ParagraphStyle(
        'SigText',
        parent=styles['Normal'],
        fontName='Helvetica',
        fontSize=9.5,
        leading=13,
        alignment=1
    )

    story = []
    story.append(Spacer(1, 0.5 * cm))

    in_table = False
    table_lines = []

    for line in lines:
        raw_line = line
        line = line.strip()
        
        if not line:
            if in_table and table_lines:
                # render table
                story.append(build_table_from_md(table_lines, styles))
                story.append(Spacer(1, 6))
                in_table = False
                table_lines = []
            continue

        if line.startswith('|') and line.endswith('|'):
            in_table = True
            table_lines.append(line)
            continue
        elif in_table:
            story.append(build_table_from_md(table_lines, styles))
            story.append(Spacer(1, 6))
            in_table = False
            table_lines = []

        if line.startswith('# '):
            text = line[2:].replace('**', '').replace('📄 ', '').replace('🏆 ', '').strip()
            story.append(Paragraph(text, title_style))
            story.append(HRFlowable(width="100%", thickness=1.5, color=colors.HexColor("#D4AF37"), spaceAfter=8))
        elif line.startswith('## '):
            text = line[3:].replace('**', '').strip()
            story.append(Paragraph(text, h2_style))
        elif line.startswith('### '):
            text = line[4:].replace('**', '').strip()
            story.append(Paragraph(text, h2_style))
        elif line.startswith('**Nomor Dokumen**') or line.startswith('**Dokumen Resmi**'):
            clean = line.replace('`', '').replace('**', '')
            story.append(Paragraph(clean, doc_num_style))
        elif line.startswith('---'):
            story.append(HRFlowable(width="100%", thickness=0.5, color=colors.HexColor("#CCCCCC"), spaceBefore=6, spaceAfter=6))
        elif line.startswith('- ') or line.startswith('* '):
            clean = line[2:].strip()
            clean_html = format_md_to_html(clean)
            story.append(Paragraph(f"• {clean_html}", bullet_style))
        elif re.match(r'^\d+\.\s', line):
            clean_html = format_md_to_html(line)
            story.append(Paragraph(clean_html, bullet_style))
        else:
            clean_html = format_md_to_html(line)
            story.append(Paragraph(clean_html, body_style))

    if in_table and table_lines:
        story.append(build_table_from_md(table_lines, styles))
        story.append(Spacer(1, 6))

    return story

def format_md_to_html(text):
    # Replace markdown bold/italic/code to reportlab XML HTML
    text = re.sub(r'\*\*(.*?)\*\*', r'<b>\1</b>', text)
    text = re.sub(r'\*(.*?)\*', r'<i>\1</i>', text)
    text = re.sub(r'`(.*?)`', r'<font face="Courier"><b>\1</b></font>', text)
    return text

def build_table_from_md(table_lines, styles):
    data = []
    cell_style = ParagraphStyle(
        'TableCell',
        parent=styles['Normal'],
        fontName='Helvetica',
        fontSize=8.5,
        leading=11,
        textColor=colors.HexColor('#222222')
    )
    cell_header_style = ParagraphStyle(
        'TableHead',
        parent=styles['Normal'],
        fontName='Helvetica-Bold',
        fontSize=8.5,
        leading=11,
        textColor=colors.white
    )

    for i, row in enumerate(table_lines):
        # skip separator line | :--- | :---: |
        if '---' in row:
            continue
        cols = [c.strip() for c in row.split('|')[1:-1]]
        row_data = []
        for c in cols:
            c_html = format_md_to_html(c)
            # handle breaks
            c_html = c_html.replace('<br>', '<br/>')
            st = cell_header_style if i == 0 else cell_style
            row_data.append(Paragraph(c_html, st))
        if row_data:
            data.append(row_data)

    if not data:
        return Spacer(1, 1)

    t = Table(data, colWidths=None)
    ts = [
        ('BACKGROUND', (0,0), (-1,0), colors.HexColor('#7A1C1C')),
        ('TEXTCOLOR', (0,0), (-1,0), colors.white),
        ('ALIGN', (0,0), (-1,-1), 'LEFT'),
        ('VALIGN', (0,0), (-1,-1), 'MIDDLE'),
        ('BOTTOMPADDING', (0,0), (-1,-1), 6),
        ('TOPPADDING', (0,0), (-1,-1), 6),
        ('LEFTPADDING', (0,0), (-1,-1), 6),
        ('RIGHTPADDING', (0,0), (-1,-1), 6),
        ('GRID', (0,0), (-1,-1), 0.5, colors.HexColor('#DDDDDD')),
        ('ROWBACKGROUNDS', (0,1), (-1,-1), [colors.white, colors.HexColor('#F9F9F9')])
    ]
    t.setStyle(TableStyle(ts))
    return t

def generate_pdf_for_file(md_path, pdf_path):
    print(f"Generating PDF from: {md_path} -> {pdf_path}")
    story = parse_markdown_to_pdf_flowables(md_path)
    if not story:
        print(f"Failed to generate story for {md_path}")
        return

    doc = SimpleDocTemplate(
        pdf_path,
        pagesize=A4,
        leftMargin=2*cm,
        rightMargin=2*cm,
        topMargin=2.5*cm,
        bottomMargin=2.2*cm
    )
    doc.build(story, canvasmaker=NumberedCanvas)
    print(f"Successfully generated PDF: {pdf_path}")

def main():
    base_dir = "d:/Dokumen/02_Kerja_Profesional/Juragan by Anak Bawang/Dokumen_Legal"
    files = [
        ("Surat_Perjanjian_Kerja_Reyhan.md", "Surat_Perjanjian_Kerja_Reyhan.pdf"),
        ("Surat_Perjanjian_Kerja_Didi.md", "Surat_Perjanjian_Kerja_Didi.pdf"),
        ("Jobdesk_dan_Portofolio_Owner.md", "Jobdesk_dan_Portofolio_Owner.pdf"),
    ]

    for md_name, pdf_name in files:
        md_p = os.path.join(base_dir, md_name)
        pdf_p = os.path.join(base_dir, pdf_name)
        generate_pdf_for_file(md_p, pdf_p)

if __name__ == '__main__':
    main()
