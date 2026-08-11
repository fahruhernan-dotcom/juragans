import os
import sys
from generate_pdf_pricelists import DATA_SOLO_RAYA, DATA_PUSAT, build_pdf

def filter_bundling(data):
    # Keep only the rows representing packages/bundling
    return [row for row in data if "Paket" in row[1] or "Combo" in row[1]]

def main():
    bundling_solo_raya = filter_bundling(DATA_SOLO_RAYA)
    bundling_pusat = filter_bundling(DATA_PUSAT)
    
    # Generate bundling-only PDFs
    build_pdf("pricelist_solo_raya_bundling.pdf", "Wilayah Solo Raya (Harga Lokal - Khusus Paket Bundling)", bundling_solo_raya)
    build_pdf("pricelist_jakarta_semarang_bundling.pdf", "Wilayah Luar Kota (Harga Nasional - Khusus Paket Bundling)", bundling_pusat)

if __name__ == "__main__":
    main()
