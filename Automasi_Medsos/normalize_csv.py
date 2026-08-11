import csv, re

CSV_PATH = r'd:\Dokumen\02_Kerja_Profesional\Juragan by Anak Bawang\Strategi Bisnis\kompetitor_shopee.csv'

FIELDNAMES = [
    'rank','toko','nama_produk','varian_berat','harga_rp','berat_gram',
    'harga_per_gram','harga_per_kg','terjual','lokasi_toko','rating',
    'link_shopee','timestamp_scraped'
]

def extract_weight(text):
    """Ekstrak berat dalam gram dari teks, return (gram_int, label_str)"""
    m = re.search(r'(\d+(?:[.,]\d+)?)\s*(kg|g|gr|gram)', str(text), re.I)
    if not m:
        return None, None
    val = float(m.group(1).replace(',', '.'))
    unit = m.group(2).lower()
    grams = int(val * 1000) if 'kg' in unit else int(val)
    label = f"{grams} Gram"
    return grams, label

def normalize_row(row):
    """Normalisasi 1 baris CSV"""
    # Validasi harga
    try:
        harga = int(float(row.get('harga_rp', 0)))
        assert harga > 0
    except:
        return None  # skip baris corrupt

    nama = row.get('nama_produk', '').strip()
    varian_raw = row.get('varian_berat', '').strip()

    # Jika varian_berat == nama_produk atau terlalu panjang → ekstrak dari nama
    if varian_raw == nama or len(varian_raw) > 40:
        berat_g, varian = extract_weight(nama)
        if not varian:
            varian = varian_raw
    else:
        # Normalize format: "200gr" → "200 Gram", "1000 Gram (1 Kg)" → "1000 Gram"
        berat_g, varian = extract_weight(varian_raw)
        if not varian:
            varian = varian_raw

    # Validasi berat_gram
    try:
        berat = int(float(row.get('berat_gram', 0)))
        assert berat > 0
    except:
        berat = berat_g or 250

    # Hitung ulang harga_per_gram & harga_per_kg
    harga_per_gram = round(harga / berat, 2) if berat > 0 else 0
    harga_per_kg = round(harga / berat * 1000) if berat > 0 else 0

    return {
        'rank': row.get('rank', ''),
        'toko': row.get('toko', '').strip(),
        'nama_produk': nama,
        'varian_berat': varian,
        'harga_rp': str(harga),
        'berat_gram': str(berat),
        'harga_per_gram': str(harga_per_gram),
        'harga_per_kg': str(harga_per_kg),
        'terjual': row.get('terjual', '-').strip(),
        'lokasi_toko': row.get('lokasi_toko', '-').strip(),
        'rating': row.get('rating', '-').strip(),
        'link_shopee': row.get('link_shopee', '').strip(),
        'timestamp_scraped': row.get('timestamp_scraped', '').strip(),
    }

# Baca CSV
rows_raw = []
with open(CSV_PATH, 'r', encoding='utf-8') as f:
    rows_raw = list(csv.DictReader(f))

# Normalize & filter baris corrupt
rows = []
skipped = 0
for row in rows_raw:
    normalized = normalize_row(row)
    if normalized:
        rows.append(normalized)
    else:
        skipped += 1
        print(f"  SKIP corrupt: {str(row)[:80]}")

# Re-ranking
for i, r in enumerate(rows, 1):
    r['rank'] = str(i)

# Tulis kembali
with open(CSV_PATH, 'w', newline='', encoding='utf-8') as f:
    w = csv.DictWriter(f, fieldnames=FIELDNAMES)
    w.writeheader()
    w.writerows(rows)

# Tampilkan hasil
print("\n=== HASIL NORMALIZE ===")
print(f"{'No':>3} | {'Toko':<20} | {'Nama Produk':<40} | {'Varian':<12} | {'Harga':>9} | {'Rp/kg':>9}")
print("-" * 105)
for r in rows:
    print(f"{r['rank']:>3} | {r['toko']:<20} | {r['nama_produk'][:40]:<40} | {r['varian_berat']:<12} | {int(r['harga_rp']):>9,} | {int(r['harga_per_kg']):>9,}")

print(f"\nTotal: {len(rows)} baris valid, {skipped} baris corrupt di-skip")
