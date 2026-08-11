import sys, csv, re
sys.stdout.reconfigure(encoding='utf-8')

def clean_price(p):
    if not p: return 0
    return int(re.sub(r'[^\d]', '', str(p)) or '0')

BASE = r'd:\Dokumen\02_Kerja_Profesional\Juragan by Anak Bawang\Scraping_Data'

print('=== SHOPEE Jul30 ===')
with open(BASE + r'\dataset_shopee-scraper_2026-07-30_07-05-42-701.csv', encoding='utf-8', errors='replace') as f:
    for i, row in enumerate(csv.DictReader(f)):
        loc = row.get('location', '')
        price = clean_price(row.get('price', 0))
        orig = clean_price(row.get('original_price', 0))
        rating = row.get('rating', '')
        name = row.get('name', '')[:65]
        print(f'  {i+1:2}. [{loc:12}] Rp{price:>8,} (coret:{orig:>8,}) Rat:{rating} | {name}')

print()
print('=== SHOPEE Aug01 ===')
with open(BASE + r'\dataset_shopee-scraper_2026-08-01_00-27-20-800.csv', encoding='utf-8', errors='replace') as f:
    for i, row in enumerate(csv.DictReader(f)):
        loc = row.get('location', '')
        price = clean_price(row.get('price', 0))
        orig = clean_price(row.get('original_price', 0))
        rating = row.get('rating', '')
        disc = row.get('discount_pct', '')
        name = row.get('name', '')[:65]
        print(f'  {i+1:2}. [{loc:12}] Rp{price:>8,} (coret:{orig:>8,}) Disc:{disc:>4} Rat:{rating} | {name}')

print()
print('=== TOKOPEDIA ===')
with open(BASE + r'\dataset_tokopedia-search-scraper_2026-08-01_00-33-11-746.csv', encoding='utf-8', errors='replace') as f:
    reader = csv.DictReader(f)
    for i, row in enumerate(reader):
        price_raw = row.get('price', '')
        price = clean_price(price_raw)
        orig = clean_price(row.get('original_price', 0))
        rating = row.get('rating', '')
        disc = row.get('discount_percentage', '0')
        city = row.get('shop_city') or row.get('badge_title', '')
        url = row.get('product_url', '')
        name = url.split('/')[-2].replace('-', ' ')[:65] if url else ''
        print(f'  {i+1:3}. [{city:15}] Rp{price:>8,} Disc:{disc:>4}% Rat:{rating} | {name}')
        if i >= 49: break
