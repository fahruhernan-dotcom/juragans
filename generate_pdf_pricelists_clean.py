import os
import sys
from generate_pdf_pricelists import DATA_SOLO_RAYA, DATA_PUSAT, build_pdf

def filter_packages(data):
    # Filter out any rows that represent packages/combos
    return [row for row in data if "Paket" not in row[1] and "Combo" not in row[1]]

def main():
    clean_solo_raya = filter_packages(DATA_SOLO_RAYA)
    clean_pusat = filter_packages(DATA_PUSAT)
    
    # Generate clean PDFs without packages
    build_pdf("pricelist_solo_raya_clean.pdf", "Wilayah Solo Raya (Harga Lokal - Tanpa Paket)", clean_solo_raya)
    build_pdf("pricelist_jakarta_semarang_clean.pdf", "Wilayah Luar Kota (Harga Nasional - Tanpa Paket)", clean_pusat)

if __name__ == "__main__":
    main()
