import csv, re

BASE = r'd:\Dokumen\02_Kerja_Profesional\Juragan by Anak Bawang\Scraping_Data'

def clean_price(p):
    if not p: return 0
    return int(re.sub(r'[^\d]', '', str(p)) or '0')

def detect_gram(text):
    text = text.lower()
    for pat, fn in [
        (r'(\d+)\s*kg',    lambda m: int(m.group(1)) * 1000),
        (r'(\d+)\s*gram',  lambda m: int(m.group(1))),
        (r'(\d+)\s*gr\b',  lambda m: int(m.group(1))),
        (r'(\d+)\s*g\b',   lambda m: int(m.group(1))),
    ]:
        m = re.search(pat, text)
        if m:
            g = fn(m)
            if 50 <= g <= 3000:
                return g
    return 0

with open(BASE + r'\dataset_tokopedia-search-scraper_2026-08-01_00-33-11-746.csv', encoding='utf-8', errors='replace') as f:
    for row in csv.DictReader(f):
        title = row.get('title', '')
        price = clean_price(row.get('price_number','') or row.get('price',''))
        rating = row.get('rating','')
        sold = row.get('sold_count','')
        shop = row.get('shop_name','')
        city = row.get('shop_city') or row.get('badge_title','')
        gram = detect_gram(title)
        if gram > 0 and price > 0:
            ppg = price / gram
            if 75 <= ppg <= 350:
                print(f'[{gram}g] Rp {price:,} (@{ppg:.0f}/g) | {sold} | Rat:{rating} | {shop} ({city}) -> {title[:55]}')
