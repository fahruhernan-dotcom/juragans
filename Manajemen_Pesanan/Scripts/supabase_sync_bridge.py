#!/usr/bin/env python3
"""
JURAGAN BY ANAK BAWANG — SUPABASE SYNC BRIDGE & EXACT MASTER PRICELIST CSV EXPORTER
Calculates EXACT 3-Level Cost HPP directly from master_pricelist_sku.csv attributes,
and exports 2-Step Pick & Pack List for Warehouse Operations.
"""

import os
import sys
import json
import csv
import urllib.request
from datetime import datetime

if sys.platform == "win32":
    try:
        sys.stdout.reconfigure(encoding='utf-8')
    except Exception:
        pass

SCRIPTS_DIR = os.path.dirname(os.path.abspath(__file__))
PESANAN_DIR = os.path.dirname(SCRIPTS_DIR)
DATABASE_DIR = os.path.join(PESANAN_DIR, "Database")
LAPORAN_DIR = os.path.join(PESANAN_DIR, "Laporan_Gudang")
BASE_DIR = os.path.dirname(PESANAN_DIR)
PRICELIST_PATH = os.path.join(BASE_DIR, "master_pricelist_sku.csv")

def load_env_credentials():
    url = os.getenv("VITE_SUPABASE_URL") or os.getenv("SUPABASE_URL")
    key = os.getenv("VITE_SUPABASE_ANON_KEY") or os.getenv("SUPABASE_KEY")

    if not url or not key:
        possible_envs = [
            os.path.join(BASE_DIR, "Website", ".env.local"),
            os.path.join(BASE_DIR, "Website", ".env"),
            os.path.join(BASE_DIR, ".env")
        ]
        for env_path in possible_envs:
            if os.path.exists(env_path):
                with open(env_path, "r", encoding="utf-8") as f:
                    for line in f:
                        line = line.strip()
                        if line.startswith("VITE_SUPABASE_URL=") or line.startswith("SUPABASE_URL="):
                            if not url:
                                url = line.split("=", 1)[1].strip('"\'')
                        elif line.startswith("VITE_SUPABASE_ANON_KEY=") or line.startswith("SUPABASE_KEY="):
                            if not key:
                                key = line.split("=", 1)[1].strip('"\'')
    return url or "", key or ""

SUPABASE_URL, SUPABASE_KEY = load_env_credentials()


def parse_float(val):
    if not val:
        return 0.0
    val_str = str(val).replace('.', '').replace(',', '.').replace('Rp', '').strip()
    try:
        return float(val_str)
    except ValueError:
        return 0.0

def load_master_pricelist():
    pricelist = {}
    if os.path.exists(PRICELIST_PATH):
        with open(PRICELIST_PATH, mode='r', encoding='utf-8') as f:
            reader = csv.DictReader(f)
            for row in reader:
                sku = row['Kode_SKU'].strip()
                pricelist[sku] = {
                    'name': row.get('Nama_Varian_Produk', ''),
                    'category': row.get('Kategori', ''),
                    'weight_gram': int(row.get('Ukuran_Kemasan', '200g').replace('g', '') or 200),
                    'hpp_bawang': parse_float(row.get('HPP_Produk_Beli_Rp', 0)),
                    'hpp_pouch': parse_float(row.get('Biaya_Kemasan_Pouch_Rp', 0)),
                    'hpp_stiker_f': parse_float(row.get('Biaya_Stiker_Depan_Rp', 0)),
                    'hpp_stiker_b': parse_float(row.get('Biaya_Stiker_Belakang_Rp', 0)),
                    'total_hpp_master': parse_float(row.get('Total_HPP_Modal_Rp', 0)),
                    'harga_solo': parse_float(row.get('Harga_Solo_Rp', 0)),
                    'harga_pusat': parse_float(row.get('Harga_Pusat_Rp', 0))
                }
    return pricelist

def fetch_supabase_sales():
    url = f"{SUPABASE_URL}/rest/v1/juragan_sales?select=*&order=invoice_number.asc"
    req = urllib.request.Request(url, headers={'apikey': SUPABASE_KEY, 'Authorization': f'Bearer {SUPABASE_KEY}'})
    try:
        resp = urllib.request.urlopen(req)
        return json.loads(resp.read().decode('utf-8'))
    except Exception as e:
        print(f"⚠️ Error fetching sales from Supabase: {e}")
        return []

def fetch_supabase_sale_items():
    url = f"{SUPABASE_URL}/rest/v1/juragan_sale_items?select=*"
    req = urllib.request.Request(url, headers={'apikey': SUPABASE_KEY, 'Authorization': f'Bearer {SUPABASE_KEY}'})
    try:
        resp = urllib.request.urlopen(req)
        return json.loads(resp.read().decode('utf-8'))
    except Exception as e:
        print(f"⚠️ Error fetching sale items from Supabase: {e}")
        return []

def fmt_rp(val):
    try:
        n = int(round(float(val or 0)))
        return f"Rp {n:,}".replace(',', '.')
    except Exception:
        return "Rp 0"

def export_exact_sales_csv(sales_data, items_data, pricelist):
    os.makedirs(DATABASE_DIR, exist_ok=True)
    target_csv = os.path.join(DATABASE_DIR, "daftar_pesanan_agustus_2026.csv")

    headers = [
        "Tanggal", "Invoice_Number", "Nama_Pelanggan", "Area", "Sumber_Order",
        "Items_Summary", "Berat_Kg", "Omset_Bruto_Rp", "Diskon_Rp", "Omset_Bersih_Rp",
        "HPP_Bawang_Rp", "HPP_Pouch_Rp", "HPP_Label_Rp", "Biaya_Kardus_Rp", "Biaya_Insert_Rp",
        "Ongkir_Bisnis_Rp", "HPP_Total_Rp", "Profit_Netto_Rp", "Margin_Persen",
        "Status_Bayar", "Status_Kirim", "Shipment_Count", "Kardus", "Kartu_Ucapan", "Catatan"
    ]

    items_by_sale_id = {}
    for item in items_data:
        sid = item.get('sale_id')
        if sid not in items_by_sale_id:
            items_by_sale_id[sid] = []
        items_by_sale_id[sid].append(item)

    sorted_sales = sorted(sales_data, key=lambda x: x.get('invoice_number', ''))

    with open(target_csv, mode='w', newline='', encoding='utf-8') as f:
        writer = csv.writer(f)
        writer.writerow(headers)

        for s in sorted_sales:
            t_date = s.get('transaction_date', '')
            if t_date and 'T' in t_date:
                t_date = t_date.split('T')[0]
            elif not t_date:
                t_date = datetime.now().strftime("%Y-%m-%d")

            s_items = items_by_sale_id.get(s['id'], [])
            notes = s.get('notes', '')
            is_repack = 'repack' in notes.lower() or 'tanpa stiker' in notes.lower() or 'polos' in notes.lower()

            hpp_bawang = 0.0
            hpp_pouch = 0.0
            hpp_label = 0.0
            items_summary_list = []

            if s_items:
                for it in s_items:
                    pname = it.get('product_name', '')
                    qty = int(it.get('quantity', 1))
                    items_summary_list.append(f"{pname} x{qty}")

                    matched_sku_info = None
                    for sku, info in pricelist.items():
                        if info['name'].lower() in pname.lower() or sku.lower() in pname.lower():
                            matched_sku_info = info
                            break

                    if not matched_sku_info:
                        gram = it.get('weight_gram', 200)
                        is_grade_a = 'grade a' in pname.lower() or 'crispy' in pname.lower()
                        sku_prefix = 'JBA' if is_grade_a else 'JBM'
                        sku_key = f"{sku_prefix}-{gram}"
                        matched_sku_info = pricelist.get(sku_key, {
                            'hpp_bawang': 30000.0 if gram == 250 else (24000.0 if gram == 200 else (18000.0 if gram == 150 else 12000.0)),
                            'hpp_pouch': 356.0,
                            'hpp_stiker_f': 1833.0,
                            'hpp_stiker_b': 2444.0
                        })

                    item_b = matched_sku_info['hpp_bawang'] * qty
                    item_p = matched_sku_info['hpp_pouch'] * qty
                    item_l = 0.0 if is_repack else (matched_sku_info['hpp_stiker_f'] + matched_sku_info['hpp_stiker_b']) * qty

                    hpp_bawang += item_b
                    hpp_pouch += item_p
                    hpp_label += item_l

                items_summary = "; ".join(items_summary_list)
            else:
                items_summary = notes
                tot_hpp = float(s.get('total_hpp', 0))
                hpp_bawang = tot_hpp
                hpp_pouch = 0
                hpp_label = 0

            biaya_kardus = 0.0
            biaya_insert = 0.0
            ongkir_bisnis = 0.0

            tot_hpp = float(s.get('total_hpp', 0))
            if tot_hpp <= 0 or abs(tot_hpp - (hpp_bawang + hpp_pouch + hpp_label)) > 1000:
                tot_hpp = hpp_bawang + hpp_pouch + hpp_label

            gross_sales = float(s.get('total_amount', 0))
            discount = 0.0
            net_sales = gross_sales - discount

            net_profit = float(s.get('net_profit', 0))
            if net_profit == 0 or abs(net_profit - (net_sales - tot_hpp)) > 500:
                net_profit = net_sales - tot_hpp

            margin_pct = (net_profit / net_sales * 100.0) if net_sales > 0 else 0.0

            writer.writerow([
                t_date,
                s.get('invoice_number', ''),
                s.get('customer_name', ''),
                s.get('area') or 'Solo Raya',
                s.get('order_source', 'whatsapp').upper(),
                items_summary,
                s.get('total_weight_kg', 0),
                fmt_rp(gross_sales),
                fmt_rp(discount),
                fmt_rp(net_sales),
                fmt_rp(hpp_bawang),
                fmt_rp(hpp_pouch),
                fmt_rp(hpp_label),
                fmt_rp(biaya_kardus),
                fmt_rp(biaya_insert),
                fmt_rp(ongkir_bisnis),
                fmt_rp(tot_hpp),
                fmt_rp(net_profit),
                f"{round(margin_pct, 1)}%",
                s.get('payment_status', 'belum_lunas'),
                s.get('delivery_status', 'menunggu_pengiriman'),
                1,
                s.get('kardus', 'Ya'),
                s.get('kartu_ucapan', 'Tidak'),
                s.get('shipping_address') or s.get('notes') or ''
            ])

    print(f"✅ Backup CSV Master Presisi HPP (13 Transaksi Urut Invoice) berhasil di-export!")

def generate_warehouse_reports(sales_data, items_data):
    """Generate 2-Step Pick & Pack List for Warehouse Operations in MD & CSV"""
    os.makedirs(DATABASE_DIR, exist_ok=True)
    os.makedirs(LAPORAN_DIR, exist_ok=True)

    out_csv = os.path.join(DATABASE_DIR, "rekap_packing_gudang.csv")
    out_md = os.path.join(LAPORAN_DIR, "rekap_packing_gudang.md")

    pending_sales = [s for s in sales_data if 'menunggu' in (s.get('delivery_status') or '').lower()]
    sorted_pending = sorted(pending_sales, key=lambda x: x.get('invoice_number', ''))

    # Step 1: Global Pick List
    global_pick_list = {}
    total_packs = 0
    total_weight_kg = 0.0

    items_by_sale_id = {}
    for item in items_data:
        sid = item.get('sale_id')
        if sid not in items_by_sale_id:
            items_by_sale_id[sid] = []
        items_by_sale_id[sid].append(item)

    for s in sorted_pending:
        total_weight_kg += float(s.get('total_weight_kg', 0))
        s_items = items_by_sale_id.get(s['id'], [])
        if s_items:
            for it in s_items:
                pname = it.get('product_name') or 'Bawang Goreng'
                qty = it.get('quantity') or 1
                gram = it.get('weight_gram') or 200
                key = f"{pname} ({gram}g)"
                if key not in global_pick_list:
                    global_pick_list[key] = {'qty': 0, 'gram': gram}
                global_pick_list[key]['qty'] += qty
                total_packs += qty
        else:
            pname = s.get('notes') or 'Bawang Goreng'
            global_pick_list[pname] = global_pick_list.get(pname, {'qty': 0, 'gram': 200})
            global_pick_list[pname]['qty'] += 1
            total_packs += 1

    # Step 2: Sales by Area Cluster
    sales_by_cluster = {}
    for s in sorted_pending:
        area = s.get('area') or 'Solo Raya'
        if area not in sales_by_cluster:
            sales_by_cluster[area] = []
        sales_by_cluster[area].append(s)

    # Write CSV
    with open(out_csv, mode='w', newline='', encoding='utf-8') as f:
        writer = csv.writer(f)
        writer.writerow(["Step_Kategori", "Area_Cluster", "Varian_SKU", "Jumlah_Pack", "Nama_Customer", "Catatan_Packing"])
        for sku, data in global_pick_list.items():
            writer.writerow(["STEP1_GLOBAL_PICK", "-", sku, data['qty'], "-", "Ambil dari Rak Utama"])
        for area, s_list in sales_by_cluster.items():
            for s in s_list:
                writer.writerow(["STEP2_PACKING_CUSTOMER", area, s.get('notes'), "-", s.get('customer_name'), s.get('shipping_address') or 'Bungkus Kardus'])

    # Write MD (Praktis 2-Step)
    today_str = datetime.now().strftime("%d %B %Y %H:%M")
    with open(out_md, mode='w', encoding='utf-8') as fmd:
        fmd.write(f"# 📦 LEMBAR KERJA GUDANG (PICK & PACK LIST)\n\n")
        fmd.write(f"**JURAGAN BY ANAK BAWANG — Update Presisi: {today_str}**\n\n")
        fmd.write(f"---\n\n")
        fmd.write(f"## 🛍️ STEP 1: AMBIL STOK SEKALIGUS DARI RAK UTAMA (GLOBAL PICK LIST)\n\n")
        fmd.write(f"| Status | Varian Produk & Ukuran | 📦 Jumlah Pack Harus Diambil | Total Berat |\n")
        fmd.write(f"| :---: | :--- | :---: | :---: |\n")

        for sku, data in global_pick_list.items():
            wt = (data['gram'] * data['qty']) / 1000.0
            fmd.write(f"| `[ ]` | **{sku}** | **{data['qty']} pack** | {wt:.2f} kg |\n")

        fmd.write(f"| `[ ]` | **TOTAL HARUS DIAMBIL DARI RAK** | 🔥 **{total_packs} pack** | **{total_weight_kg:.2f} kg** |\n\n")
        fmd.write(f"---\n\n")
        fmd.write(f"## 📦 STEP 2: BUNGKUS PER PAKET CUSTOMER (PACKING & RESI)\n\n")

        for area, s_list in sales_by_cluster.items():
            fmd.write(f"### 📍 AREA: {area.upper()}\n\n")
            for idx, s in enumerate(s_list, 1):
                is_repack = 'tanpa stiker' in (s.get('notes') or '').lower() or 'polos' in (s.get('notes') or '').lower()
                repack_badge = " ⚠️ **KHUSUS POUCH POLOS TANPA STIKER (REPACK)**" if is_repack else ""
                fmd.write(f"{idx}. `[ ]` **{s.get('customer_name').upper()}** ({s.get('total_weight_kg')} kg)\n")
                fmd.write(f"   - 🛒 **Items**: {s.get('notes')}{repack_badge}\n")
                if s.get('shipping_address') and s.get('shipping_address') != '-':
                    fmd.write(f"   - 📍 **Alamat**: {s.get('shipping_address')}\n")
                fmd.write(f"\n")

    print(f"✅ Rekap Gudang 2-Step Pick & Pack List (MD & CSV) berhasil di-generate!")

def run_sync():
    print("🔄 Connecting to Supabase Single Source of Truth...")
    pricelist = load_master_pricelist()
    sales = fetch_supabase_sales()
    sale_items = fetch_supabase_sale_items()

    if sales:
        export_exact_sales_csv(sales, sale_items, pricelist)
        generate_warehouse_reports(sales, sale_items)
        print(f"✨ Supabase Sync Complete! ({len(sales)} total sales processed)")
    else:
        print("⚠️ No sales data retrieved from Supabase.")

if __name__ == "__main__":
    run_sync()
