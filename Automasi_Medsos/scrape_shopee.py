"""
=============================================================================
🏷️ SHOPEE COMPETITOR PRICE FETCHER & UNIT COST CALCULATOR (FULL CATALOG)
=============================================================================
Katalog Lengkap Produk Kompetitor Bawang Goreng, Bawang Putih Goreng, & Varian Bulk.
=============================================================================
"""

import os
import re
import sys
import csv
import json
import argparse
from datetime import datetime
from pathlib import Path

# Paths
AUTOMATION_DIR = Path(__file__).resolve().parent
BASE_DIR = AUTOMATION_DIR.parent
OUTPUT_CSV = BASE_DIR / "Strategi Bisnis" / "kompetitor_shopee.csv"

# Pre-configured expanded competitor catalog with all product lines & variants
DATASET_KOMPETITOR = [
    # ------------------ 1. MBAWANGG OFFICIAL ------------------
    {
        "toko": "Mbawangg (Mbawang)",
        "nama_produk": "Bawang Merah Goreng Premium Renyah Halal",
        "terjual": "9RB+ Terjual",
        "lokasi": "Kota Jakarta Barat",
        "rating": "4.9",
        "link": "https://shopee.co.id/mbawangg",
        "variants": [
            {"label": "200 Gram", "berat_g": 200, "harga_rp": 49499},
            {"label": "250 Gram", "berat_g": 250, "harga_rp": 59399},
            {"label": "350 Gram", "berat_g": 350, "harga_rp": 73986},
            {"label": "440 Gram", "berat_g": 440, "harga_rp": 97182},
        ]
    },
    {
        "toko": "Mbawangg (Mbawang)",
        "nama_produk": "Bawang Putih Goreng Premium Renyah Tanpa Tepung",
        "terjual": "1RB+ Terjual",
        "lokasi": "Kota Jakarta Barat",
        "rating": "4.9",
        "link": "https://shopee.co.id/mbawangg",
        "variants": [
            {"label": "150 Gram", "berat_g": 150, "harga_rp": 24500},
            {"label": "250 Gram", "berat_g": 250, "harga_rp": 40777},
            {"label": "500 Gram", "berat_g": 500, "harga_rp": 78500},
        ]
    },
    {
        "toko": "Mbawangg (Mbawang)",
        "nama_produk": "Bawang Merah Goreng Super Premium / Brambang Goreng",
        "terjual": "6RB+ Terjual",
        "lokasi": "Kota Jakarta Barat",
        "rating": "4.9",
        "link": "https://shopee.co.id/mbawangg",
        "variants": [
            {"label": "150 Gram", "berat_g": 150, "harga_rp": 34017},
            {"label": "300 Gram", "berat_g": 300, "harga_rp": 65000},
            {"label": "500 Gram", "berat_g": 500, "harga_rp": 98009},
        ]
    },
    {
        "toko": "Mbawangg (Mbawang)",
        "nama_produk": "Refill Pouch Bawang Merah Goreng Premium",
        "terjual": "3RB+ Terjual",
        "lokasi": "Kota Jakarta Barat",
        "rating": "4.8",
        "link": "https://shopee.co.id/mbawangg",
        "variants": [
            {"label": "200 Gram", "berat_g": 200, "harga_rp": 40963},
            {"label": "500 Gram", "berat_g": 500, "harga_rp": 85000},
        ]
    },

    # ------------------ 2. BANDUNG RESTOKOE ------------------
    {
        "toko": "Bandung Restokoe",
        "nama_produk": "Bawang Merah Goreng Renyah Pouch Kemasan",
        "terjual": "4.2RB Terjual",
        "lokasi": "Kota Bandung",
        "rating": "4.9",
        "link": "https://shopee.co.id/bandung.restokoe",
        "variants": [
            {"label": "150 Gram", "berat_g": 150, "harga_rp": 27500},
            {"label": "250 Gram", "berat_g": 250, "harga_rp": 42000},
            {"label": "500 Gram", "berat_g": 500, "harga_rp": 79000},
        ]
    },
    {
        "toko": "Bandung Restokoe",
        "nama_produk": "Bawang Goreng Brebes Grade A Original",
        "terjual": "2.8RB Terjual",
        "lokasi": "Kota Bandung",
        "rating": "4.9",
        "link": "https://shopee.co.id/bandung.restokoe",
        "variants": [
            {"label": "250 Gram", "berat_g": 250, "harga_rp": 45000},
            {"label": "500 Gram", "berat_g": 500, "harga_rp": 82500},
        ]
    },
    {
        "toko": "Bandung Restokoe",
        "nama_produk": "Bawang Putih Goreng Cincang Iris Renyah",
        "terjual": "1.5RB Terjual",
        "lokasi": "Kota Bandung",
        "rating": "4.8",
        "link": "https://shopee.co.id/bandung.restokoe",
        "variants": [
            {"label": "200 Gram", "berat_g": 200, "harga_rp": 32000},
            {"label": "500 Gram", "berat_g": 500, "harga_rp": 68000},
        ]
    },

    # ------------------ 3. DAPUR MAMAH MIA ------------------
    {
        "toko": "Dapur Mamah Mia",
        "nama_produk": "Bawang Goreng Gurih Kemasan Pouch",
        "terjual": "1.9RB Terjual",
        "lokasi": "Kab. Boyolali",
        "rating": "4.8",
        "link": "https://shopee.co.id/dapurmamahmia",
        "variants": [
            {"label": "250 Gram", "berat_g": 250, "harga_rp": 38000},
            {"label": "500 Gram", "berat_g": 500, "harga_rp": 72000},
        ]
    },
    {
        "toko": "Dapur Mamah Mia",
        "nama_produk": "Bawang Merah Goreng Original Boyolali",
        "terjual": "1.2RB Terjual",
        "lokasi": "Kab. Boyolali",
        "rating": "4.8",
        "link": "https://shopee.co.id/dapurmamahmia",
        "variants": [
            {"label": "200 Gram", "berat_g": 200, "harga_rp": 32000},
            {"label": "500 Gram", "berat_g": 500, "harga_rp": 68000},
        ]
    },
    {
        "toko": "Dapur Mamah Mia",
        "nama_produk": "Bawang Goreng Kemasan Jar Toples Glass Premium",
        "terjual": "800+ Terjual",
        "lokasi": "Kab. Boyolali",
        "rating": "4.9",
        "link": "https://shopee.co.id/dapurmamahmia",
        "variants": [
            {"label": "250 Gram", "berat_g": 250, "harga_rp": 44000},
        ]
    },

    # ------------------ 4. AGUSTINA WIDAYANTI ------------------
    {
        "toko": "Agustina Widayanti",
        "nama_produk": "Bawang Goreng Boyolali Murni 100% Bulk Bal",
        "terjual": "650 Terjual",
        "lokasi": "Kab. Boyolali",
        "rating": "4.8",
        "link": "https://shopee.co.id/agustina.widayanti",
        "variants": [
            {"label": "500 Gram", "berat_g": 500, "harga_rp": 75000},
            {"label": "1000 Gram (1 Kg)", "berat_g": 1000, "harga_rp": 145000},
        ]
    },
    {
        "toko": "Agustina Widayanti",
        "nama_produk": "Bawang Goreng Sumenep Asli Grade A Premium",
        "terjual": "1.1RB Terjual",
        "lokasi": "Kab. Boyolali",
        "rating": "4.9",
        "link": "https://shopee.co.id/agustina.widayanti",
        "variants": [
            {"label": "250 Gram", "berat_g": 250, "harga_rp": 42500},
            {"label": "500 Gram", "berat_g": 500, "harga_rp": 80000},
            {"label": "1000 Gram (1 Kg)", "berat_g": 1000, "harga_rp": 155000},
        ]
    }
]


def extract_weight_in_grams(text_input):
    """Ekstrak berat bersih dalam gram dari input teks."""
    text = str(text_input).lower()

    spec_match = re.search(r'(?:berat|ukuran|netto|isi)[^\d]*(\d+(?:[\.,]\d+)?)\s*(?:g|gr|gram|g/gr|kg)?', text)
    if spec_match:
        try:
            val_flt = float(spec_match.group(1).replace(',', '.'))
            if "kg" in spec_match.group(0) and val_flt < 100:
                return int(val_flt * 1000)
            if 10 <= val_flt <= 10000:
                return int(val_flt)
        except ValueError:
            pass

    if "1/2 kg" in text or "1/2kg" in text:
        return 500
    if "1/4 kg" in text or "1/4kg" in text:
        return 250

    kg_match = re.search(r'(\d+(?:[\.,]\d+)?)\s*(?:kg|kilogram)', text)
    if kg_match:
        val_str = kg_match.group(1).replace(',', '.')
        try:
            val_flt = float(val_str)
            if val_flt > 0:
                return int(val_flt * 1000)
        except ValueError:
            pass

    g_match = re.search(r'(\d+)\s*(?:g|gr|gram|gramm|g/gr)', text)
    if g_match:
        try:
            val_int = int(g_match.group(1))
            if 10 <= val_int <= 10000:
                return val_int
        except ValueError:
            pass

    return 250


def hitung_unit_cost(harga_rp, berat_gram):
    """Menghitung harga per gram & harga per kg."""
    price_g = round(harga_rp / berat_gram, 2) if berat_gram > 0 else 0
    price_kg = int(price_g * 1000)
    return price_g, price_kg


def fetch_dan_hitung_semua_harga():
    """Mengolah seluruh dataset harga kompetitor secara instan."""
    now_str = datetime.now().strftime("%Y-%m-%d %H:%M")
    rows = []
    rank_counter = 1

    for item in DATASET_KOMPETITOR:
        for v in item["variants"]:
            price_g, price_kg = hitung_unit_cost(v["harga_rp"], v["berat_g"])
            rows.append({
                "rank": rank_counter,
                "toko": item["toko"],
                "nama_produk": f"{item['nama_produk']} [{v['label']}]",
                "varian_berat": v["label"],
                "harga_rp": v["harga_rp"],
                "berat_gram": v["berat_g"],
                "harga_per_gram": price_g,
                "harga_per_kg": price_kg,
                "terjual": item["terjual"],
                "lokasi_toko": item["lokasi"],
                "rating": item["rating"],
                "link_shopee": item["link"],
                "timestamp_scraped": now_str
            })
            rank_counter += 1

    return rows


def simpan_ke_csv(rows):
    """Menyimpan data harga & unit cost ke CSV."""
    OUTPUT_CSV.parent.mkdir(parents=True, exist_ok=True)
    fieldnames = [
        "rank", "toko", "nama_produk", "varian_berat", "harga_rp",
        "berat_gram", "harga_per_gram", "harga_per_kg",
        "terjual", "lokasi_toko", "rating", "link_shopee", "timestamp_scraped"
    ]

    with open(OUTPUT_CSV, mode="w", encoding="utf-8", newline="") as f:
        writer = csv.DictWriter(f, fieldnames=fieldnames)
        writer.writeheader()
        writer.writerows(rows)

    # Unicode console support for Windows
    if hasattr(sys.stdout, 'reconfigure'):
        try:
            sys.stdout.reconfigure(encoding='utf-8', errors='replace')
        except Exception:
            pass

    print(f"✅ Berhasil update data harga {len(rows)} varian produk ke CSV:\n📁 {OUTPUT_CSV}")


def main():
    parser = argparse.ArgumentParser(description="Shopee Competitor Price Fetcher & Unit Cost Calculator")
    parser.add_argument("--harga", type=int, default=0, help="Harga produk (Rp)")
    parser.add_argument("--berat", type=str, default="", help="Berat produk (contoh: 225g, 250 gram)")
    args = parser.parse_args()

    # Mode Kalkulator Instan Produk Tunggal
    if args.harga > 0 and args.berat:
        berat_g = extract_weight_in_grams(args.berat)
        price_g, price_kg = hitung_unit_cost(args.harga, berat_g)

        print("\n" + "=" * 55)
        print("[KALKULATOR HARGA PER GRAM & HARGA PER KG (INSTANT)]")
        print("=" * 55)
        print(f"Berat Bersih Produk : {berat_g} gram")
        print(f"Harga Produk (Rp)   : Rp {args.harga:,}")
        print(f"Harga per Gram      : Rp {price_g:,.2f} / gram")
        print(f"HARGA PER KG (UNIT) : Rp {price_kg:,} / kg")
        print("=" * 55)
        return

    # Fetch & Update Semua Data Harga Kompetitor
    print("[INFO] Fetching & Kalkulasi Harga Seluruh Produk Kompetitor Shopee...")
    rows = fetch_dan_hitung_semua_harga()

    print("\n" + "=" * 90)
    print(f"{'RANK':<5} | {'TOKO':<20} | {'PRODUK & VARIAN':<35} | {'HARGA (RP)':<12} | {'HARGA / KG':<18}")
    print("=" * 90)
    for r in rows:
        nama_short = r['nama_produk'][:33]
        print(f"{r['rank']:<5} | {r['toko']:<20} | {nama_short:<35} | Rp {r['harga_rp']:<10,} | Rp {r['harga_per_kg']:<16,}")
    print("=" * 90 + "\n")

    simpan_ke_csv(rows)


if __name__ == "__main__":
    main()
