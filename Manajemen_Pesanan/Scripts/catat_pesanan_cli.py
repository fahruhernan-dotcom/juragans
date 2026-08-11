#!/usr/bin/env python3
"""
JURAGAN BY ANAK BAWANG — AUTOMATED ORDER RECORDING CLI (3-LEVEL COST ARCHITECTURE)
Automated order logging script following SOP_PENCATATAN_PESANAN_AUTOMATIS.md.

Calculates:
- Item Level Costs (Product + Pouch + Stickers) * Item Qty
- Shipment Level Costs (Outer Box + Gift Card + Bubble Wrap + Business Shipping) * Shipment Count
- Order Level Financials (Gross Sales, Discount, Net Sales, Total HPP, Gross Profit)
"""

import sys
import os
import json
import csv
import argparse
from datetime import datetime

SCRIPTS_DIR = os.path.dirname(os.path.abspath(__file__))
if SCRIPTS_DIR not in sys.path:
    sys.path.insert(0, SCRIPTS_DIR)

# Windows Console Unicode Safety
if sys.platform == "win32":
    try:
        sys.stdout.reconfigure(encoding='utf-8')
    except Exception:
        pass

# Master Packaging Tariff (Read from Master / Backup Defaults)
PACKAGING_MASTER = {
    'BOX-M': 3000.0,
    'CARD-GIFT': 1500.0,
    'BUBBLE-WRAP': 1000.0
}

BASE_DIR = os.path.dirname(os.path.dirname(os.path.dirname(os.path.abspath(__file__))))
PESANAN_DIR = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
DATABASE_DIR = os.path.join(PESANAN_DIR, "Database")
PRICELIST_PATH = os.path.join(BASE_DIR, "master_pricelist_sku.csv")

def parse_float(val):
    if not val:
        return 0.0
    val_str = str(val).replace('.', '').replace(',', '.').replace('Rp', '').strip()
    try:
        return float(val_str)
    except ValueError:
        return 0.0

def load_pricelist_master():
    pricelist = {}
    if os.path.exists(PRICELIST_PATH):
        with open(PRICELIST_PATH, mode='r', encoding='utf-8') as f:
            reader = csv.DictReader(f)
            for row in reader:
                sku = row['Kode_SKU'].strip()
                pricelist[sku] = {
                    'name': row.get('Nama_Varian_Produk', ''),
                    'category': row.get('Kategori', ''),
                    'weight_gram': int(row.get('Ukuran_Kemasan', '200g').replace('g', '').replace('g', '') or 200),
                    'hpp_bawang': parse_float(row.get('HPP_Produk_Beli_Rp', 0)),
                    'hpp_pouch': parse_float(row.get('Biaya_Kemasan_Pouch_Rp', 0)),
                    'hpp_stiker_f': parse_float(row.get('Biaya_Stiker_Depan_Rp', 0)),
                    'hpp_stiker_b': parse_float(row.get('Biaya_Stiker_Belakang_Rp', 0)),
                    'harga_solo': parse_float(row.get('Harga_Solo_Rp', 0)),
                    'harga_pusat': parse_float(row.get('Harga_Luar_Kota_Rp', row.get('Harga_Pusat_Rp', 0))),
                    'total_hpp_master': parse_float(row.get('Total_HPP_Modal_Rp', 0))
                }
    return pricelist

def calculate_order(args, master_skus):
    items_data = []
    if isinstance(args.items, str):
        try:
            items_raw = json.loads(args.items)
        except Exception:
            import ast
            items_raw = ast.literal_eval(args.items)
    else:
        items_raw = args.items

    total_product_cost = 0.0
    total_packaging_cost = 0.0
    total_label_cost = 0.0
    total_weight_kg = 0.0
    calculated_gross_sales = 0.0

    for item in items_raw:
        sku = item['sku'].strip()
        qty = int(item.get('qty', 1))
        unit_price = parse_float(item.get('harga_satuan', 0))

        master_info = master_skus.get(sku, {
            'name': f"Custom SKU {sku}",
            'weight_gram': 200,
            'hpp_bawang': 28000.0,
            'hpp_pouch': 356.0,
            'hpp_stiker_f': 1833.0,
            'hpp_stiker_b': 2444.0,
            'harga_solo': 34500.0,
            'harga_pusat': 37500.0
        })

        if unit_price <= 0:
            unit_price = master_info['harga_solo'] if 'solo' in args.area.lower() else master_info['harga_pusat']

        # Repack & 1kg Bal Label Rules
        is_repack = args.repack or 'repack' in args.notes.lower() or 'polos' in args.notes.lower()

        is_bulk_bal = '1k' in sku.lower() or '2kg' in sku.lower() or 'horeca' in sku.lower() or master_info['weight_gram'] >= 1000

        # Bulk 1kg Bal PE has no front sticker (stiker_f = 0 to save label cost)
        stiker_f_unit = 0.0 if (is_repack or is_bulk_bal) else master_info['hpp_stiker_f']
        stiker_b_unit = 0.0 if is_repack else master_info['hpp_stiker_b']

        item_product_cost = master_info['hpp_bawang'] * qty
        item_pouch_cost = master_info['hpp_pouch'] * qty
        item_label_cost = (stiker_f_unit + stiker_b_unit) * qty
        item_total_hpp = item_product_cost + item_pouch_cost + item_label_cost
        subtotal_sales = unit_price * qty

        total_product_cost += item_product_cost
        total_packaging_cost += item_pouch_cost
        total_label_cost += item_label_cost
        total_weight_kg += (master_info['weight_gram'] * qty) / 1000.0
        calculated_gross_sales += subtotal_sales

        items_data.append({
            'sku': sku,
            'name': master_info['name'],
            'qty': qty,
            'unit_price': unit_price,
            'subtotal': subtotal_sales,
            'hpp_bawang': item_product_cost,
            'hpp_pouch': item_pouch_cost,
            'hpp_label': item_label_cost,
            'total_hpp_item': item_total_hpp,
            'pouch_count': qty,
            'stiker_f_count': 0 if (is_repack or is_bulk_bal) else qty,
            'stiker_b_count': 0 if is_repack else qty
        })

    # Shipment Level Calculations (Standard Default: Kardus is Always True for Shipped Orders)
    is_kardus = not args.tanpa_kardus

    shipment_count = max(1, int(args.shipment_count))
    outer_box_cost = (PACKAGING_MASTER['BOX-M'] if is_kardus else 0.0) * shipment_count
    gift_card_cost = (PACKAGING_MASTER['CARD-GIFT'] if args.kartu_ucapan else 0.0) * shipment_count
    bubble_wrap_cost = (PACKAGING_MASTER['BUBBLE-WRAP'] if args.bubble_wrap else 0.0) * shipment_count
    
    shipping_paid_by = args.shipping_paid_by.lower().strip()
    actual_shipping_cost = parse_float(args.shipping_cost)
    business_shipping_cost = actual_shipping_cost if shipping_paid_by == 'business' else 0.0

    total_shipment_cost = outer_box_cost + gift_card_cost + bubble_wrap_cost + business_shipping_cost

    # Order Level Financials
    gross_sales = parse_float(args.harga_total) if parse_float(args.harga_total) > 0 else calculated_gross_sales
    discount = parse_float(args.discount)
    net_sales = gross_sales - discount
    other_cost = parse_float(args.other_cost)

    total_hpp_order = total_product_cost + total_packaging_cost + total_label_cost + total_shipment_cost + other_cost
    gross_profit = net_sales - total_hpp_order
    margin_percent = (gross_profit / net_sales * 100.0) if net_sales > 0 else 0.0

    return {
        'customer_name': args.pelanggan,
        'area': args.area,
        'order_source': args.order_source,
        'payment_status': args.payment_status,
        'delivery_status': args.delivery_status,
        'notes': args.notes,
        'items': items_data,
        'shipment_count': shipment_count,
        'total_weight_kg': round(total_weight_kg, 2),
        'financials': {
            'gross_sales': gross_sales,
            'discount': discount,
            'net_sales': net_sales,
            'product_cost': total_product_cost,
            'packaging_cost': total_packaging_cost,
            'label_cost': total_label_cost,
            'outer_box_cost': outer_box_cost,
            'insert_cost': gift_card_cost + bubble_wrap_cost,
            'shipping_cost_business': business_shipping_cost,
            'shipping_paid_by': shipping_paid_by,
            'other_cost': other_cost,
            'total_shipment_cost': total_shipment_cost,
            'total_hpp_order': round(total_hpp_order, 2),
            'gross_profit': round(gross_profit, 2),
            'margin_percent': round(margin_percent, 1)
        }
    }

def fmt_rp(val):
    try:
        n = int(round(float(val or 0)))
        return f"Rp {n:,}".replace(',', '.')
    except Exception:
        return "Rp 0"

def get_next_invoice_number(file_path):
    year_month = datetime.now().strftime("%Y/%m")
    prefix = f"INV/{year_month}/"
    max_num = 0
    if os.path.exists(file_path):
        try:
            with open(file_path, mode='r', encoding='utf-8') as f:
                reader = csv.DictReader(f)
                for row in reader:
                    inv = row.get('Invoice_Number', '')
                    if inv.startswith(prefix):
                        try:
                            num = int(inv.replace(prefix, ''))
                            if num > max_num:
                                max_num = num
                        except ValueError:
                            pass
        except Exception:
            pass
    return f"{prefix}{max_num + 1:03d}"

def parse_items_summary(summary):
    items = []
    if not summary:
        return items
    parts = summary.split('; ')
    for part in parts:
        part = part.strip()
        if ' x' in part:
            name, qty_str = part.rsplit(' x', 1)
            try:
                qty = int(qty_str)
            except ValueError:
                qty = 1
            items.append({'name': name.strip(), 'qty': qty})
        elif ' × ' in part:
            name, qty_str = part.rsplit(' × ', 1)
            if ' Pouch' in qty_str:
                qty_str = qty_str.replace(' Pouch', '')
            try:
                qty = int(qty_str)
            except ValueError:
                qty = 1
            items.append({'name': name.strip(), 'qty': qty})
        else:
            items.append({'name': part, 'qty': 1})
    return items

def generate_local_warehouse_reports(csv_path):
    print("📦 Regenerating warehouse reports locally...")
    rekap_csv_path = os.path.join(DATABASE_DIR, "rekap_packing_gudang.csv")
    rekap_md_path = os.path.join(PESANAN_DIR, "Laporan_Gudang", "rekap_packing_gudang.md")
    
    os.makedirs(os.path.dirname(rekap_md_path), exist_ok=True)

    pending_sales = []
    if os.path.exists(csv_path):
        with open(csv_path, mode='r', encoding='utf-8') as f:
            reader = csv.DictReader(f)
            for row in reader:
                status_kirim = row.get('Status_Kirim', '').lower().strip()
                if 'menunggu' in status_kirim or 'pending' in status_kirim:
                    pending_sales.append(row)
                    
    global_pick_list = {}
    total_packs = 0
    total_weight_kg = 0.0

    for s in pending_sales:
        weight_kg = parse_float(s.get('Berat_Kg', 0))
        total_weight_kg += weight_kg
        
        items_summary = s.get('Items_Summary', '')
        parsed_items = parse_items_summary(items_summary)
        
        for it in parsed_items:
            pname = it['name']
            qty = it['qty']
            
            gram = 200
            pname_lower = pname.lower()
            if '250g' in pname_lower:
                gram = 250
            elif '200g' in pname_lower:
                gram = 200
            elif '150g' in pname_lower:
                gram = 150
            elif '100g' in pname_lower:
                gram = 100
            elif '1 kg' in pname_lower or '1kg' in pname_lower:
                gram = 1000
            elif '2 kg' in pname_lower or '2kg' in pname_lower:
                gram = 2000
                
            key = f"{pname} ({gram}g)"
            if key not in global_pick_list:
                global_pick_list[key] = {'qty': 0, 'gram': gram}
            global_pick_list[key]['qty'] += qty
            total_packs += qty

    sales_by_cluster = {}
    for s in pending_sales:
        area = s.get('Area') or 'Solo Raya'
        if area not in sales_by_cluster:
            sales_by_cluster[area] = []
        sales_by_cluster[area].append(s)

    with open(rekap_csv_path, mode='w', newline='', encoding='utf-8') as f:
        writer = csv.writer(f)
        writer.writerow(["Step_Kategori", "Area_Cluster", "Varian_SKU", "Jumlah_Pack", "Nama_Customer", "Catatan_Packing"])
        for sku, data in global_pick_list.items():
            writer.writerow(["STEP1_GLOBAL_PICK", "-", sku, data['qty'], "-", "Ambil dari Rak Utama"])
        for area, s_list in sales_by_cluster.items():
            for s in s_list:
                writer.writerow(["STEP2_PACKING_CUSTOMER", area, s.get('Items_Summary'), "-", s.get('Nama_Pelanggan'), s.get('Catatan') or 'Bungkus Kardus'])

    today_str = datetime.now().strftime("%d %B %Y %H:%M")
    with open(rekap_md_path, mode='w', encoding='utf-8') as fmd:
        fmd.write(f"# 📦 LEMBAR KERJA GUDANG (PICK & PACK LIST)\n\n")
        fmd.write(f"**JURAGAN BY ANAK BAWANG — Update Presisi: {today_str}**\n\n")
        fmd.write(f"---\n\n")
        fmd.write(f"## 🛍️ STEP 1: AMBIL STOK SEKALIGUS DARI RAK UTAMA (GLOBAL PICK LIST)\n\n")
        fmd.write(f"| Status | Varian Produk & Ukuran | 📦 Jumlah Pack Harus Diambil | Total Berat |\n")
        fmd.write(f"| :---: | :--- | :---: | :---: |\n")

        for sku, data in sorted(global_pick_list.items()):
            wt = (data['gram'] * data['qty']) / 1000.0
            fmd.write(f"| `[ ]` | **{sku}** | **{data['qty']} pack** | {wt:.2f} kg |\n")

        fmd.write(f"| `[ ]` | **TOTAL HARUS DIAMBIL DARI RAK** | 🔥 **{total_packs} pack** | **{total_weight_kg:.2f} kg** |\n\n")
        fmd.write(f"---\n\n")
        fmd.write(f"## 📦 STEP 2: BUNGKUS PER PAKET CUSTOMER (PACKING & RESI)\n\n")

        for area in sorted(sales_by_cluster.keys()):
            s_list = sales_by_cluster[area]
            fmd.write(f"### 📍 AREA: {area.upper()}\n\n")
            for idx, s in enumerate(s_list, 1):
                notes = s.get('Catatan') or ''
                is_repack = 'tanpa stiker' in notes.lower() or 'polos' in notes.lower() or 'repack' in notes.lower()
                repack_badge = " ⚠️ **KHUSUS POUCH POLOS TANPA STIKER (REPACK)**" if is_repack else ""
                fmd.write(f"{idx}. `[ ]` **{s.get('Nama_Pelanggan').upper()}** ({s.get('Berat_Kg')} kg)\n")
                fmd.write(f"   - 🛒 **Items**: {s.get('Items_Summary')}{repack_badge}\n")
                if notes and notes != '-':
                    fmd.write(f"   - 📍 **Catatan**: {notes}\n")
                fmd.write(f"\n")

    print(f"✅ Rekap Gudang 2-Step Pick & Pack List (MD & CSV) berhasil di-generate secara lokal!")

def update_csv_file(file_path, order_result):
    os.makedirs(os.path.dirname(file_path), exist_ok=True)
    file_exists = os.path.exists(file_path)
    
    fin = order_result['financials']
    items_summary = "; ".join([f"{it['name']} x{it['qty']}" for it in order_result['items']])
    today_str = datetime.now().strftime("%Y-%m-%d")

    # Duplicate Order Check
    if file_exists and not getattr(order_result['args'], 'force_duplicate', False):
        try:
            with open(file_path, mode='r', encoding='utf-8') as f_read:
                reader = csv.DictReader(f_read)
                for row in reader:
                    if (row.get('Tanggal') == today_str and 
                        row.get('Nama_Pelanggan', '').strip().lower() == order_result['customer_name'].strip().lower() and 
                        row.get('Items_Summary') == items_summary):
                        print(f"⚠️ [IDEMPOTENCY NOTICE] Order untuk '{order_result['customer_name']}' hari ini dengan item '{items_summary}' sudah tercatat sebelumnya. Melewati duplikasi (gunakan --force-duplicate untuk memaksa).")
                        return None
        except Exception:
            pass
            
    inv_num = get_next_invoice_number(file_path)
    
    headers = [
        "Tanggal", "Invoice_Number", "Nama_Pelanggan", "Area", "Sumber_Order",
        "Items_Summary", "Berat_Kg", "Omset_Bruto_Rp", "Diskon_Rp", "Omset_Bersih_Rp",
        "HPP_Bawang_Rp", "HPP_Pouch_Rp", "HPP_Label_Rp", "Biaya_Kardus_Rp", "Biaya_Insert_Rp",
        "Ongkir_Bisnis_Rp", "HPP_Total_Rp", "Profit_Netto_Rp", "Margin_Persen",
        "Status_Bayar", "Status_Kirim", "Shipment_Count", "Kardus", "Kartu_Ucapan", "Catatan"
    ]
    
    with open(file_path, mode='a', newline='', encoding='utf-8') as f:
        writer = csv.writer(f)
        if not file_exists:
            writer.writerow(headers)
            
        writer.writerow([
            today_str,
            inv_num,
            order_result['customer_name'],
            order_result['area'],
            order_result['order_source'].upper(),
            items_summary,
            order_result['total_weight_kg'],
            fmt_rp(fin['gross_sales']),
            fmt_rp(fin['discount']),
            fmt_rp(fin['net_sales']),
            fmt_rp(fin['product_cost']),
            fmt_rp(fin['packaging_cost']),
            fmt_rp(fin['label_cost']),
            fmt_rp(fin['outer_box_cost']),
            fmt_rp(fin['insert_cost']),
            fmt_rp(fin['shipping_cost_business']),
            fmt_rp(fin['total_hpp_order']),
            fmt_rp(fin['gross_profit']),
            f"{fin['margin_percent']}%",
            order_result['payment_status'],
            order_result['delivery_status'],
            order_result['shipment_count'],
            "Ya" if fin['outer_box_cost'] > 0 else "Tidak",
            "Ya" if fin['insert_cost'] > 0 else "Tidak",
            order_result['notes']
        ])
    return inv_num

def print_tree_report(result, inv_num=None):
    fin = result['financials']
    print("\n" + "="*70)
    print("✅ PESANAN BERHASIL DICATAT SECARA LOKAL!")
    print("="*70)
    if inv_num:
        print(f"Invoice   : {inv_num}")
    print(f"Pelanggan : {result['customer_name']}")
    print(f"Area      : {result['area']}")
    print(f"Sumber    : {result['order_source'].upper()}")
    print(f"Status    : {result['payment_status'].upper()} | {result['delivery_status'].upper()}")
    print("-" * 70)
    
    print("ITEM LEVEL (Atribut Produk - HPP Master Driven)")
    for idx, it in enumerate(result['items'], 1):
        print(f"├── Item #{idx}: {it['name']} × {it['qty']} Pouch")
        print(f"│   ├── Harga Jual (Selling Price) : Rp {it['unit_price']:,.0f}")
        print(f"│   ├── HPP Bawang (Master DB)    : Rp {it['hpp_bawang']:,.0f}")
        print(f"│   ├── HPP Pouch (Master DB)     : Rp {it['hpp_pouch']:,.0f}")
        print(f"│   └── HPP Label (Master DB)     : Rp {it['hpp_label']:,.0f}")
    
    print(f"\nSHIPMENT LEVEL ({result['shipment_count']} Shipment)")
    print(f"├── Kardus Luar (BOX-M)  : Rp {fin['outer_box_cost']:,.0f}")
    print(f"├── Material Inserts     : Rp {fin['insert_cost']:,.0f}")
    print(f"└── Ongkir (Paid: {fin['shipping_paid_by']}) : Rp {fin['shipping_cost_business']:,.0f}")

    print("\nORDER LEVEL (Finansial & Margin)")
    print(f"├── Omset Bruto (Gross)  : Rp {fin['gross_sales']:,.0f}")
    print(f"├── Diskon               : Rp {fin['discount']:,.0f}")
    print(f"├── Omset Bersih (Net)   : Rp {fin['net_sales']:,.0f}")
    print(f"├── TOTAL HPP PESANAN    : Rp {fin['total_hpp_order']:,.0f}")
    print(f"└── LABA KOTOR PESANAN   : Rp {fin['gross_profit']:,.0f} (Margin {fin['margin_percent']}%)")
    print("="*70)

def main():
    parser = argparse.ArgumentParser(description="Automated Order Recorder - Juragan by Anak Bawang")
    parser.add_argument("--pelanggan", required=True, help="Nama Pelanggan")
    parser.add_argument("--area", default="Solo Raya", help="Area Pengiriman")
    parser.add_argument("--order-source", default="whatsapp", help="Sumber Order (whatsapp, shopee, tiktok, offline)")
    parser.add_argument("--items", required=True, help="JSON list items: '[{\"sku\":\"JBM-250\",\"qty\":2,\"harga_satuan\":40000}]'")
    parser.add_argument("--shipment-count", type=int, default=1, help="Jumlah Pengiriman / Shipment")
    parser.add_argument("--tanpa-kardus", action="store_true", help="Nonaktifkan Kardus Packing")
    parser.add_argument("--kartu-ucapan", action="store_true", help="Gunakan Kartu Ucapan")
    parser.add_argument("--bubble-wrap", action="store_true", help="Gunakan Bubble Wrap")
    parser.add_argument("--shipping-paid-by", default="customer", choices=["customer", "business", "none"], help="Penanggung Ongkir")
    parser.add_argument("--shipping-cost", default="0", help="Nominal Ongkir Real")
    parser.add_argument("--harga-total", default="0", help="Override Nominal Omset Gross Total")
    parser.add_argument("--discount", default="0", help="Nominal Diskon / Potongan")
    parser.add_argument("--other-cost", default="0", help="Biaya Custom Tambahan")
    parser.add_argument("--repack", action="store_true", help="Polos tanpa stiker")
    parser.add_argument("--payment-status", default="lunas", help="lunas | belum_lunas")
    parser.add_argument("--delivery-status", default="terkirim", help="terkirim | menunggu_pengiriman")
    parser.add_argument("--simulasi", action="store_true", help="Simulasi test order")
    parser.add_argument("--notes", default="", help="Catatan Opsional")
    parser.add_argument("--force-duplicate", action="store_true", help="Paksa duplikasi data")

    args = parser.parse_args()
    
    master_skus = load_pricelist_master()
    result = calculate_order(args, master_skus)
    result['args'] = args
    
    inv_num = None
    if not args.simulasi:
        csv_filename = "daftar_pesanan_agustus_2026.csv"
        target_csv = os.path.join(DATABASE_DIR, csv_filename)
        inv_num = update_csv_file(target_csv, result)
        if inv_num:
            generate_local_warehouse_reports(target_csv)
            print("✓ Local reports generated successfully.")
    else:
        print("🔍 [SIMULASI] Order tidak dicatat ke file lokal.")

    # Print output report
    print_tree_report(result, inv_num)

if __name__ == "__main__":
    main()

