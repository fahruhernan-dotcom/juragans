import sys, csv, re
sys.stdout.reconfigure(encoding='utf-8')

BASE = r'd:\Dokumen\02_Kerja_Profesional\Juragan by Anak Bawang\Scraping_Data'

# ============================================================
# LOGIKA HARGA MINIMUM BAWANG GORENG:
# - 1kg goreng butuh 2.5-3kg bawang mentah (yield 35-40%)
# - Harga bawang mentah pasar: Rp 20.000-30.000/kg
# - HPP bahan saja: 2.5 x Rp 22.000 = Rp 55.000/kg goreng
# - Ditambah packaging + operasional: min logis = Rp 75/gram
# - Rp 28.000/kg = Rp 28/gram → IMPOSSIBLE, pasti data error / bawang mentah
# ============================================================
MIN_PPG, MAX_PPG = 75, 280
MIN_RATING       = 4.4

def clean_price(p):
    if not p: return 0
    return int(re.sub(r'[^\d]', '', str(p)) or '0')

def parse_sold(s):
    if not s: return 0
    s = s.lower().replace('+','').replace(' terjual','').strip()
    try:
        if 'rb' in s: return int(float(s.replace('rb','').strip()) * 1000)
        if 'jt' in s: return int(float(s.replace('jt','').strip()) * 1000000)
        return int(s.replace('.','').replace(',',''))
    except: return 0

def detect_gram(text):
    text = text.lower()
    for pat, fn in [
        (r'(\d+)\s*kg',    lambda m: int(m.group(1)) * 1000),
        (r'(\d+)\s*gram',  lambda m: int(m.group(1))),
        (r'(\d+)\s*gr\b',  lambda m: int(m.group(1))),
    ]:
        m = re.search(pat, text)
        if m:
            g = fn(m)
            if 50 <= g <= 3000:
                return g
    return 0

rows_valid, rows_invalid = [], []

with open(BASE + r'\dataset_tokopedia-search-scraper_2026-08-01_00-33-11-746.csv',
          encoding='utf-8', errors='replace') as f:
    for row in csv.DictReader(f):
        title    = row.get('title', '')
        price    = clean_price(row.get('price_number','') or row.get('price',''))
        rating   = float(row.get('rating') or 0)
        sold_raw = row.get('sold_count', '')
        sold     = parse_sold(sold_raw)
        city     = row.get('shop_city') or row.get('badge_title', '')
        shop     = row.get('shop_name', '')
        tier     = row.get('shop_tier', '')
        gram     = detect_gram(title)
        ppg      = price / gram if gram > 0 else 0

        entry = dict(title=title, price=price, rating=rating, sold=sold,
                     sold_raw=sold_raw, city=city, shop=shop, tier=tier,
                     gram=gram, ppg=ppg)

        if   gram == 0:         reason = 'Gramasi tidak terdeteksi di judul'
        elif rating < MIN_RATING: reason = f'Rating {rating} < {MIN_RATING}'
        elif ppg < MIN_PPG:     reason = f'Rp{ppg:.0f}/gram MUSTAHIL — bawang goreng min Rp{MIN_PPG}/gram'
        elif ppg > MAX_PPG:     reason = f'Rp{ppg:.0f}/gram terlalu mahal (>Rp{MAX_PPG})'
        else:                   reason = ''

        (rows_invalid if reason else rows_valid).append(
            {**entry, 'reason': reason} if reason else entry
        )

print(f'TOTAL: {len(rows_valid)+len(rows_invalid)} | VALID: {len(rows_valid)} | DIBUANG: {len(rows_invalid)}')
print()

from collections import defaultdict
by_gram = defaultdict(list)
for d in rows_valid:
    g = d['gram']
    for cat in [100, 150, 200, 250, 300, 500, 1000, 2000]:
        if abs(g - cat) <= cat * 0.15:
            by_gram[cat].append(d)
            break

W = 115
print('=' * W)
print('TOKOPEDIA — VALID (Gramasi Terdeteksi + Rating >= 4.4 + Harga Logis Rp75-280/gram)')
print('=' * W)
print(f'  {"#":>2} | {"GRAM":>6} | {"HARGA":>10} | {"Rp/g":>5} | {"RAT":>4} | {"TERJUAL":>9} | {"TIER":>4} | {"KOTA":>16} | JUDUL')
print('-' * W)

n = 1
for gram in sorted(by_gram.keys()):
    items = sorted(by_gram[gram], key=lambda x: (-x['sold'], x['price']))
    prices = [i['price'] for i in items]
    ppgs   = [i['ppg']   for i in items]
    p_med  = sorted(prices)[len(prices)//2]
    print(f'\n  [{gram}g] — {len(items)} produk valid | Kisaran: Rp{min(prices):,}–Rp{max(prices):,} | Median: Rp{p_med:,} | Avg Rp/g: {sum(ppgs)/len(ppgs):.0f}')
    for d in items:
        s = f'{d["sold"]:,}' if d['sold'] > 0 else d['sold_raw'] or '–'
        print(f'  {n:>2} | {d["gram"]:>5}g | Rp{d["price"]:>8,} | {d["ppg"]:>4.0f} | {d["rating"]:>4} | {s:>9} | {d["tier"]:>4} | {d["city"]:>16} | {d["title"][:50]}')
        n += 1

print()
print('=' * W)
print('BENCHMARK RINGKAS:')
print('-' * W)
for gram in sorted(by_gram.keys()):
    items  = by_gram[gram]
    prices = sorted(i['price'] for i in items)
    if not prices: continue
    q1 = prices[len(prices)//4]
    q2 = prices[len(prices)//2]
    q3 = prices[3*len(prices)//4]
    ppg_avg = sum(i['ppg'] for i in items) / len(items)
    print(f'  [{gram:>5}g]  {len(items):>2} produk | Q1: Rp{q1:>8,} | Median: Rp{q2:>8,} | Q3: Rp{q3:>8,} | Avg Rp/gram: {ppg_avg:.0f}')

print()
print('=' * W)
print('DIBUANG — ALASAN:')
print('-' * W)
for d in rows_invalid:
    print(f'  ❌  {d["reason"][:58]:<58} | Rp{d["price"]:>8,} | {d["gram"]}g | {d["title"][:42]}')
