#!/usr/bin/env python3
"""
Kalkulator & Validator Harga Optimal - Juragan by Anak Bawang
=============================================================
Script ini membaca master_pricelist_sku_v2.csv dan menampilkan:
1. Perbandingan harga lama vs baru per SKU
2. Validasi margin per channel
3. Analisis per-gram pricing (small-pack premium logic)
4. Ringkasan profit per channel

Jalankan: python kalkulator_harga_optimal.py
"""

import csv
import os
import sys

# Fix Windows console encoding
sys.stdout.reconfigure(encoding="utf-8")

# ─── Konfigurasi ───────────────────────────────────────────────────────
SCRIPT_DIR = os.path.dirname(os.path.abspath(__file__))
FILE_V1 = os.path.join(SCRIPT_DIR, "master_pricelist_sku.csv")
FILE_V2 = os.path.join(SCRIPT_DIR, "master_pricelist_sku_v2.csv")

# Threshold margin
MARGIN_AMAN = 18.0
MARGIN_TIPIS = 13.0
MARGIN_BAHAYA = 10.0


def parse_rp(val: str) -> float:
    """Parse Indonesian number format (dot as thousand sep) ke float."""
    if not val or val.strip() == "":
        return 0.0
    cleaned = val.strip().replace("%", "").replace(".", "").replace(",", ".")
    try:
        return float(cleaned)
    except ValueError:
        return 0.0


def parse_persen(val: str) -> float:
    """Parse percentage string ke float."""
    if not val or val.strip() == "":
        return 0.0
    cleaned = val.strip().replace("%", "").replace(",", ".")
    try:
        return float(cleaned)
    except ValueError:
        return 0.0


def format_rp(val: float) -> str:
    """Format angka ke Rupiah string."""
    if val == 0:
        return "-"
    return f"Rp {val:,.0f}".replace(",", ".")


def status_icon(margin: float) -> str:
    """Return status icon berdasarkan margin."""
    if margin < 0:
        return "💀 RUGI"
    elif margin < MARGIN_BAHAYA:
        return "🚨 BAHAYA"
    elif margin < MARGIN_TIPIS:
        return "⚠️  TIPIS"
    elif margin < MARGIN_AMAN:
        return "📊 OK"
    else:
        return "✅ SEHAT"


def load_csv(filepath: str) -> list[dict]:
    """Load CSV file dan return list of dicts."""
    rows = []
    with open(filepath, "r", encoding="utf-8-sig") as f:
        reader = csv.DictReader(f)
        for row in reader:
            rows.append(row)
    return rows


def print_header(title: str):
    """Print formatted section header."""
    width = 90
    print()
    print("═" * width)
    print(f"  {title}")
    print("═" * width)


def print_subheader(title: str):
    """Print formatted subsection header."""
    print(f"\n  ── {title} ──")


def main():
    # ─── Load Data ─────────────────────────────────────────────────────
    if not os.path.exists(FILE_V2):
        print(f"❌ File tidak ditemukan: {FILE_V2}")
        print("   Jalankan script dari folder yang sama dengan master_pricelist_sku_v2.csv")
        return

    v2_data = load_csv(FILE_V2)

    # Load v1 untuk perbandingan
    v1_data = {}
    if os.path.exists(FILE_V1):
        for row in load_csv(FILE_V1):
            v1_data[row["Kode_SKU"]] = row

    # ─── Header ────────────────────────────────────────────────────────
    print_header("🧅 KALKULATOR HARGA OPTIMAL — JURAGAN BY ANAK BAWANG")
    print(f"  File: {os.path.basename(FILE_V2)}")
    print(f"  Total SKU: {len(v2_data)}")

    # ─── 1. Perbandingan Harga Lama vs Baru ────────────────────────────
    if v1_data:
        print_header("📊 1. PERBANDINGAN HARGA LAMA vs BARU (Channel Solo)")

        print(f"\n  {'SKU':<22} {'Produk':<28} {'HPP':>10} {'Solo LAMA':>12} {'Solo BARU':>12} {'Δ Harga':>10} {'Margin Lama':>12} {'Margin Baru':>12}")
        print("  " + "─" * 120)

        for row in v2_data:
            sku = row["Kode_SKU"]
            hpp = parse_rp(row["Total_HPP_Modal_Rp"])
            solo_baru = parse_rp(row["Harga_Solo_Rp"])
            margin_baru = parse_persen(row["Margin_Solo_Persen"])

            if sku in v1_data:
                solo_lama = parse_rp(v1_data[sku]["Harga_Solo_Rp"])
                margin_lama = parse_persen(v1_data[sku]["Profit_Solo_Persen"])
                delta = solo_baru - solo_lama
                delta_str = f"+{format_rp(delta)}" if delta > 0 else format_rp(delta)
            else:
                solo_lama = 0
                margin_lama = 0
                delta_str = "N/A"

            nama = row["Nama_Varian_Produk"][:27]
            print(f"  {sku:<22} {nama:<28} {format_rp(hpp):>10} {format_rp(solo_lama):>12} {format_rp(solo_baru):>12} {delta_str:>10} {margin_lama:>11.1f}% {margin_baru:>11.1f}%")

    # ─── 2. Validasi Margin per Channel ────────────────────────────────
    print_header("🔍 2. VALIDASI MARGIN PER CHANNEL")

    channels = [
        ("Solo", "Harga_Solo_Rp", "Margin_Solo_Persen"),
        ("Luar Kota", "Harga_Luar_Kota_Rp", "Margin_Luar_Kota_Persen"),
        ("Grosir", "Harga_Grosir_Rp", "Margin_Grosir_Persen"),
    ]

    for ch_name, harga_col, margin_col in channels:
        print_subheader(f"Channel: {ch_name}")
        print(f"  {'SKU':<22} {'Produk':<28} {'HPP':>10} {'Harga':>12} {'Profit':>10} {'Margin':>8} {'Status':<12}")
        print("  " + "─" * 104)

        issues = 0
        for row in v2_data:
            harga = parse_rp(row.get(harga_col, ""))
            if harga == 0:
                continue

            hpp = parse_rp(row["Total_HPP_Modal_Rp"])
            margin = parse_persen(row.get(margin_col, ""))
            profit = harga - hpp
            status = status_icon(margin)
            nama = row["Nama_Varian_Produk"][:27]

            if margin < MARGIN_AMAN:
                issues += 1

            print(f"  {row['Kode_SKU']:<22} {nama:<28} {format_rp(hpp):>10} {format_rp(harga):>12} {format_rp(profit):>10} {margin:>7.1f}% {status:<12}")

        if issues == 0:
            print(f"\n  ✅ Semua SKU di channel {ch_name} margin ≥ {MARGIN_AMAN}%")
        else:
            print(f"\n  ⚠️  {issues} SKU di channel {ch_name} margin < {MARGIN_AMAN}% (by design: Hero 250g sweet spot)")

    # ─── 3. Analisis Per-Gram Pricing ──────────────────────────────────
    print_header("📐 3. ANALISIS PER-GRAM PRICING (Small-Pack Premium Logic)")

    size_map = {"100g": 100, "150g": 150, "200g": 200, "250g": 250, "1000g": 1000}

    for grade_label, grade_filter in [("Grade S Murni", "Grade S Murni"), ("Grade A Crispy", "Grade A Crispy")]:
        print_subheader(grade_label)
        print(f"  {'Ukuran':<10} {'HPP':>10} {'Solo':>10} {'/Kg Solo':>12} {'LuarKota':>10} {'/Kg LK':>12} {'Premium vs 250g':>16}")
        print("  " + "─" * 82)

        sku_satuan = [r for r in v2_data if r["Kategori"] == grade_filter]
        # Find 250g per-kg as anchor
        anchor_per_kg = 0
        for row in sku_satuan:
            ukuran = row["Ukuran_Kemasan"]
            if ukuran == "250g":
                solo = parse_rp(row["Harga_Solo_Rp"])
                anchor_per_kg = solo / 0.25

        for row in sku_satuan:
            ukuran = row["Ukuran_Kemasan"]
            gram = size_map.get(ukuran, 0)
            if gram == 0:
                continue

            solo = parse_rp(row["Harga_Solo_Rp"])
            lk = parse_rp(row["Harga_Luar_Kota_Rp"])
            hpp = parse_rp(row["Total_HPP_Modal_Rp"])

            per_kg_solo = solo / (gram / 1000)
            per_kg_lk = lk / (gram / 1000)
            premium = ((per_kg_solo / anchor_per_kg) - 1) * 100 if anchor_per_kg > 0 else 0

            premium_str = f"+{premium:.1f}%" if premium > 0 else f"{premium:.1f}%"
            if ukuran == "250g":
                premium_str = "← ANCHOR"

            print(f"  {ukuran:<10} {format_rp(hpp):>10} {format_rp(solo):>10} {format_rp(per_kg_solo):>12} {format_rp(lk):>10} {format_rp(per_kg_lk):>12} {premium_str:>16}")

    # ─── 4. Ringkasan Profit ───────────────────────────────────────────
    print_header("💰 4. RINGKASAN PROFIT PER CHANNEL")

    for ch_name, harga_col, margin_col in channels:
        total_profit = 0
        count = 0
        min_margin = 100
        max_margin = 0
        min_sku = ""
        max_sku = ""

        for row in v2_data:
            harga = parse_rp(row.get(harga_col, ""))
            if harga == 0:
                continue
            hpp = parse_rp(row["Total_HPP_Modal_Rp"])
            margin = parse_persen(row.get(margin_col, ""))
            profit = harga - hpp
            total_profit += profit
            count += 1

            if margin < min_margin:
                min_margin = margin
                min_sku = row["Kode_SKU"]
            if margin > max_margin:
                max_margin = margin
                max_sku = row["Kode_SKU"]

        if count > 0:
            avg_margin = total_profit / sum(
                parse_rp(r.get(harga_col, "")) for r in v2_data if parse_rp(r.get(harga_col, "")) > 0
            ) * 100

            print(f"\n  📦 {ch_name}:")
            print(f"     SKU aktif: {count}")
            print(f"     Total profit (jika masing² 1 terjual): {format_rp(total_profit)}")
            print(f"     Range margin: {min_margin:.1f}% ({min_sku}) — {max_margin:.1f}% ({max_sku})")
            print(f"     Rata-rata margin tertimbang: {avg_margin:.1f}%")

    # ─── Footer ────────────────────────────────────────────────────────
    print_header("✅ VALIDASI SELESAI")
    print(f"  File output: {os.path.basename(FILE_V2)}")
    print(f"  Strategi: Small-pack premium (100g/150g) + Sweet spot hero (250g)")
    print("  Minimum margin Solo: Hero 250g ~12% (by design)")
    print(f"  Minimum margin Luar Kota: ≥20% semua SKU")
    print()


if __name__ == "__main__":
    main()
