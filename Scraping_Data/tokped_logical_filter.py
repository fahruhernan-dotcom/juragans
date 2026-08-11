import sys, csv, re
sys.stdout.reconfigure(encoding='utf-8')

BASE = r'd:\Dokumen\02_Kerja_Profesional\Juragan by Anak Bawang\Scraping_Data'

# ============================================================
# LOGIKA HARGA MINIMUM BAWANG GORENG PREMIUM:
# - Bawang mentah: ~Rp 20.000-30.000/kg
# - Yield goreng: 1kg goreng butuh 2.5-3kg mentah (kehilangan air 65-70%)
# - Jadi HPP bahan baku saja: 2.5kg × Rp 20.000 = Rp 50.000/kg minimum
# - Dengan packaging + operasional: minimum wajar = Rp 80.000/kg = Rp 80/gram
# - Maximum premium: Rp 250/gram (= Rp 250.000/kg, masuk akal untuk premium)
# ============================================================

MIN_PER_GRAM = 75   # Rp/gram — batas bawah logis bawang goreng asli
MAX_PER_GRAM = 280  # Rp/gram — batas atas masuk akal (premium murni)
MIN_RATING   = 4.4  # Rating minimum untuk dianggap terpercaya

def clean_price(p):
    if not p: return 0
    cleaned = re.sub(r'[^\d]', '', str(p))
    return int(cleaned) if cleaned else 0

def detect_gram(text):
    text = text.lower()
    for pat, fn in [
        (r'(\d+)\s*kg',   lambda m: int(m.group(1)) * 1000),
        (r'(\d+)\s*gram', lambda m: int(m.group(1))),
        (r'(\d+)\s*gr\b', lambda m: int(m.group(1))),
        (r'(\d+)\s*g\b',  lambda m: int(m.group(1))),
    ]:
        m = re.search(pat, text)
        if m:
            g = fn(m)
            if 50 <= g <= 5000:
                return g
    return 0

# ============================================================
# BACA DAN FILTER TOKOPEDIA
# ============================================================
print('='*100)
print('TOKOPEDIA — BAWANG GORENG MURNI — FILTER LOGIS (Rp75-280/gram, Rating ≥ 4.4)')
print('='*100)

valid = []
invalid = []

with open(BASE + r'\dataset_tokopedia-search-scraper_2026-08-01_00-33-11-746.csv',
          encoding='utf-8', errors='replace') as f:
    for row in csv.DictReader(f):
        url    = row.get('product_url', '')
        slug   = url.split('/')[-2].replace('-', ' ') if url else ''
        city   = row.get('shop_city') or row.get('badge_title', '')
        disc   = row.get('discount_percentage', '0')
        rating = float(row.get('rating') or 0)

        p_num = clean_price(row.get('price_number', ''))
        p_raw = clean_price(row.get('price', ''))
        price = p_num if p_num > 0 else p_raw

        gram  = detect_gram(slug)
        ppg   = price / gram if gram > 0 else 0

        entry = {
            'slug': slug[:65], 'city': city, 'price': price,
            'gram': gram, 'ppg': ppg, 'rating': rating, 'disc': disc
        }

        if gram == 0:
            invalid.append({**entry, 'reason': 'Gramasi tidak terdeteksi'})
        elif rating < MIN_RATING:
            invalid.append({**entry, 'reason': f'Rating {rating} < {MIN_RATING}'})
        elif ppg < MIN_PER_GRAM:
            invalid.append({**entry, 'reason': f'Rp{ppg:.0f}/g terlalu murah (min {MIN_PER_GRAM})'})
        elif ppg > MAX_PER_GRAM:
            invalid.append({**entry, 'reason': f'Rp{ppg:.0f}/g terlalu mahal (max {MAX_PER_GRAM})'})
        else:
            valid.append(entry)

print(f'\n✅ LOLOS FILTER: {len(valid)} produk')
print(f'❌ DIBUANG: {len(invalid)} produk\n')

# Kelompokkan per gramasi
from collections import defaultdict
by_gram = defaultdict(list)
for d in valid:
    g = d['gram']
    for cat in [100, 150, 200, 250, 300, 500, 1000, 2000]:
        if abs(g - cat) <= cat * 0.15:
            by_gram[cat].append(d)
            break

print('─'*100)
print(f'{"No":>3} | {"Gramasi":>8} | {"Harga":>10} | {"Rp/gram":>8} | {"Rating":>6} | {"Kota":>18} | Produk')
print('─'*100)

n = 1
for gram in sorted(by_gram.keys()):
    items = sorted(by_gram[gram], key=lambda x: x['price'])
    prices = [i['price'] for i in items]
    ppgs   = [i['ppg']   for i in items]
    print(f'\n  📦 [{gram}g] — {len(items)} produk valid | Harga: Rp{min(prices):,} – Rp{max(prices):,} | Median: Rp{sorted(prices)[len(prices)//2]:,}')
    for d in items:
        print(f'{n:>3} | {d["gram"]:>7}g | Rp{d["price"]:>8,} | {d["ppg"]:>6.0f}/g | {d["rating"]:>6} | {d["city"]:>18} | {d["slug"]}')
        n += 1

print('\n' + '='*100)
print('❌ DIBUANG (sample alasan):')
for d in invalid[:20]:
    print(f'   {d["reason"]:50} | Rp{d["price"]:>8,} | {d["gram"]}g | {d["slug"][:50]}')

# ============================================================
# KESIMPULAN BENCHMARK
# ============================================================
print('\n' + '='*100)
print('📊 BENCHMARK HARGA PASAR TOKOPEDIA (SETELAH FILTER LOGIS)')
print('='*100)
for gram in sorted(by_gram.keys()):
    items = sorted(by_gram[gram], key=lambda x: x['price'])
    prices = [i['price'] for i in items]
    n_items = len(prices)
    if n_items == 0: continue
    p_median = sorted(prices)[n_items//2]
    p_q1     = sorted(prices)[n_items//4]
    p_q3     = sorted(prices)[3*n_items//4]
    ppg_avg  = sum(i['ppg'] for i in items) / n_items
    print(f'  [{gram:>5}g] {n_items:>2} produk | Q1: Rp{p_q1:>8,} | Median: Rp{p_median:>8,} | Q3: Rp{p_q3:>8,} | Avg Rp/g: {ppg_avg:.0f}')
