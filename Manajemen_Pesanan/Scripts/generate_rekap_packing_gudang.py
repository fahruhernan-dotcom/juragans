#!/usr/bin/env python3
"""
JURAGAN BY ANAK BAWANG — REKAP PACKING GUDANG GENERATOR
Script otomatis membuat & memperbarui rekap packing gudang (CSV & Markdown)
agar tim gudang tahu secara instan berapa pack per ukuran kemasan yang harus disiapkan.
"""

import os
import sys

if sys.platform == "win32":
    try:
        sys.stdout.reconfigure(encoding='utf-8')
    except Exception:
        pass
import csv
import re
from datetime import datetime

BASE_DIR = os.path.dirname(os.path.dirname(os.path.dirname(os.path.abspath(__file__))))
PESANAN_DIR = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
DATABASE_DIR = os.path.join(PESANAN_DIR, "Database")
LAPORAN_DIR = os.path.join(PESANAN_DIR, "Laporan_Gudang")

CSV_PESANAN_OPS = os.path.join(DATABASE_DIR, "daftar_pesanan_agustus_2026.csv")
OUT_CSV_OPS = os.path.join(DATABASE_DIR, "rekap_packing_gudang.csv")
OUT_MD_OPS = os.path.join(LAPORAN_DIR, "rekap_packing_gudang.md")

def parse_items(varian, ukuran, qty_str, items_summary, catatan):
    """
    Ekstrak rincian varian & qty pack dari baris CSV.
    """
    items = []
    
    # 1. Jika ada Items_Summary (Format CLI baru)
    if items_summary and ("x" in items_summary or "×" in items_summary or "Pouch" in items_summary):
        parts = items_summary.split(";")
        for part in parts:
            part = part.strip()
            if not part:
                continue
            # Regex match nama varian & qty
            m = re.search(r"(.+?)\s*[x×]\s*(\d+)", part)
            if m:
                name = m.group(1).strip()
                q = int(m.group(2))
                
                # Deduce SKU & size
                var_name = "Grade S Murni" if ("Murni" in name or "JBM" in name) else "Grade A Crispy"
                size = "250g"
                if "100g" in name or "100" in name: size = "100g"
                elif "150g" in name or "150" in name: size = "150g"
                elif "200g" in name or "200" in name: size = "200g"
                elif "250g" in name or "250" in name: size = "250g"
                elif "500g" in name or "500" in name: size = "500g"
                elif "1kg" in name.lower() or "1 kg" in name.lower() or "1k" in name.lower(): size = "1000g"
                
                items.append({
                    'varian': var_name,
                    'ukuran': size,
                    'qty': q,
                    'label': f"{var_name} {size}"
                })
            else:
                items.append({
                    'varian': varian or "Grade S Murni",
                    'ukuran': ukuran or "250g",
                    'qty': int(qty_str) if (qty_str and qty_str.isdigit()) else 1,
                    'label': f"{varian or 'Grade S Murni'} {ukuran or '250g'}"
                })
    else:
        # 2. Format Tabel Master Baku
        v = varian.strip() if varian else "Grade S Murni"
        u = ukuran.strip() if ukuran else "250g"
        try:
            q = int(qty_str)
        except Exception:
            q = 1
        
        items.append({
            'varian': v,
            'ukuran': u,
            'qty': q,
            'label': f"{v} {u}"
        })
        
    return items

def generate_rekap_packing():
    source_file = CSV_PESANAN_OPS
    if not os.path.exists(source_file):
        print(f"⚠️ File database pesanan {source_file} tidak ditemukan.")
        return

    orders_pending = []
    summary_per_sku = {}

    with open(source_file, mode='r', encoding='utf-8') as f:
        reader = csv.DictReader(f)
        for row in reader:
            pemesan = row.get('Nama_Pemesan') or row.get('Nama_Pelanggan') or ""
            if not pemesan or pemesan.strip().upper() == "TOTAL":
                continue

            status_kirim = row.get('Status_Pengiriman') or row.get('Status_Kirim') or ""
            # Filter hanya pesanan yang MENUNGGU PENGIRIMAN (Siap Kirim Gudang)
            if "terkirim" in status_kirim.lower() and "menunggu" not in status_kirim.lower():
                continue

            tanggal = row.get('Tanggal_Pesanan') or row.get('Tanggal') or datetime.now().strftime("%Y-%m-%d")
            varian = row.get('Varian_Bawang') or ""
            ukuran = row.get('Ukuran_Kemasan') or ""
            qty_str = row.get('Jumlah_Pack') or "1"
            berat_kg = row.get('Total_Berat_Kg') or row.get('Berat_Kg') or "0"
            items_summary = row.get('Items_Summary') or ""
            catatan = row.get('Catatan') or ""
            area = row.get('Area') or ""
            kardus = row.get('Kardus') or "Ya"
            kartu = row.get('Kartu_Ucapan') or "Tidak"

            parsed_items = parse_items(varian, ukuran, qty_str, items_summary, catatan)

            item_desc_list = []
            for it in parsed_items:
                lbl = it['label']
                q = it['qty']
                item_desc_list.append(f"{lbl} ({q} pack)")

                # Summary per SKU
                if lbl not in summary_per_sku:
                    summary_per_sku[lbl] = {
                        'varian': it['varian'],
                        'ukuran': it['ukuran'],
                        'total_pack': 0
                    }
                summary_per_sku[lbl]['total_pack'] += q

            orders_pending.append({
                'tanggal': tanggal,
                'pemesan': pemesan,
                'area': area,
                'item_desc': "; ".join(item_desc_list),
                'berat_kg': berat_kg,
                'kardus': kardus,
                'kartu': kartu,
                'catatan': catatan
            })

    # Tulis CSV Rekap Packing Gudang
    headers_csv = [
        "Kategori_Laporan", "Varian_Produk", "Ukuran_Kemasan", "Jumlah_Pack_Dibutuhkan",
        "Nama_Pemesan", "Area_Pengiriman", "Rincian_Item_Paket", "Berat_Paket_Kg", "Packing_Kardus", "Kartu_Ucapan", "Catatan"
    ]

    today_str = datetime.now().strftime("%Y-%m-%d %H:%M")

    for target_csv in [OUT_CSV_OPS]:
        os.makedirs(os.path.dirname(target_csv), exist_ok=True)
        with open(target_csv, mode='w', newline='', encoding='utf-8') as f:
            writer = csv.writer(f)
            writer.writerow(headers_csv)

            # 1. Baris Summary per Ukuran
            writer.writerow(["=== SUMMARY TOTAL DIBUTUHKAN GUDANG (BARANG SIAP PACKING) ===", "", "", "", "", "", "", "", "", "", ""])
            total_all_packs = 0
            for lbl, data in sorted(summary_per_sku.items()):
                writer.writerow([
                    "RINGKASAN_STOK_PACKING",
                    data['varian'],
                    data['ukuran'],
                    data['total_pack'],
                    "-", "-", "-", "-", "-", "-", f"Siapkan {data['total_pack']} pack {lbl}"
                ])
                total_all_packs += data['total_pack']

            writer.writerow(["TOTAL_KESELURUHAN", "SEMUA VARIAN", "ALL SIZES", total_all_packs, "-", "-", "-", "-", "-", "-", "Total Pouch Harus Dipacking"])
            writer.writerow([]) # Baris kosong pemisah

            # 2. Baris Rincian per Pengiriman Customer
            writer.writerow(["=== DAFTAR DETAIL PENGIRIMAN PER CUSTOMER (SHIPMENT PACKING QUEUE) ===", "", "", "", "", "", "", "", "", "", ""])
            for idx, ord_data in enumerate(orders_pending, 1):
                writer.writerow([
                    f"ANTREAN_KIRIM #{idx}",
                    "-",
                    "-",
                    "-",
                    ord_data['pemesan'],
                    ord_data['area'],
                    ord_data['item_desc'],
                    ord_data['berat_kg'],
                    ord_data['kardus'],
                    ord_data['kartu'],
                    ord_data['catatan']
                ])

    # Generate Laporan Markdown Gudang
    with open(OUT_MD_OPS, mode='w', encoding='utf-8') as fmd:
        fmd.write(f"# 📦 REKAPITULASI PACKING GUDANG — JURAGAN BY ANAK BAWANG\n\n")
        fmd.write(f"*Update Otomatis: {today_str}*\n\n")
        fmd.write(f"---\n\n")
        fmd.write(f"## 📊 1. TOTAL PACK DIBUTUHKAN PER UKURAN (BAWANG SIAP PACKING)\n\n")
        fmd.write(f"| Varian Produk | Ukuran Kemasan | 📦 Total Pack Harus Disiapkan | Status Penyiapan Stok |\n")
        fmd.write(f"| :--- | :---: | :---: | :--- |\n")
        
        tot_p = 0
        for lbl, data in sorted(summary_per_sku.items()):
            fmd.write(f"| **{data['varian']}** | **{data['ukuran']}** | **{data['total_pack']} pack** | Siapkan {data['total_pack']} pouch ziplock |\n")
            tot_p += data['total_pack']
            
        fmd.write(f"| **TOTAL KESELURUHAN** | **ALL SIZES** | **{tot_p} pack** | 🔥 **Total Pouch Siap Paket** |\n\n")
        fmd.write(f"---\n\n")
        fmd.write(f"## 🚚 2. DAFTAR ANTREAN PENGIRIMAN CUSTOMER (SHIPMENT QUEUE)\n\n")
        fmd.write(f"| No | Nama Pemesan | Area | Detail Item Pesanan | Berat (Kg) | Kardus | Kartu Ucapan | Catatan |\n")
        fmd.write(f"| :-: | :--- | :--- | :--- | :---: | :---: | :---: | :--- |\n")
        
        for idx, o in enumerate(orders_pending, 1):
            fmd.write(f"| {idx} | **{o['pemesan']}** | {o['area']} | {o['item_desc']} | {o['berat_kg']} kg | {o['kardus']} | {o['kartu']} | {o['catatan']} |\n")

    print(f"✅ [SUCCESS] Rekap packing gudang berhasil diperbarui di:")
    print(f"   • {OUT_CSV_OPS}")
    print(f"   • {OUT_MD_OPS}")

if __name__ == "__main__":
    generate_rekap_packing()
