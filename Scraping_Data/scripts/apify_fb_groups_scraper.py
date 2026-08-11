"""
=============================================================================
🕷️ APIFY FACEBOOK GROUPS SCRAPER — JURAGANS BY ANAK BAWANG
=============================================================================
Skrip ini menggunakan Apify Actor `apify/facebook-groups-scraper` untuk:
1. Scraping postingan & informasi dari 3 Grup Facebook Target:
   - https://web.facebook.com/groups/4703268329726449
   - https://web.facebook.com/groups/1823856604654121
   - https://web.facebook.com/groups/404302279971716
2. Mengambil data postingan, teks, tanggal, & link penjual.
3. Menyimpan hasil ke file CSV: `Scraping/hasil_apify_fb_groups.csv` & JSON.
=============================================================================
"""

import os
import sys
import json
import csv
from pathlib import Path
from apify_client import ApifyClient

# Fix Windows Console UTF-8 Encoding
if sys.platform == "win32":
    try:
        sys.stdout.reconfigure(encoding='utf-8')
    except Exception:
        pass

BASE_DIR = Path(__file__).resolve().parent
ENV_FILE = BASE_DIR / ".env"
OUTPUT_CSV = BASE_DIR / "hasil_apify_fb_groups.csv"
OUTPUT_JSON = BASE_DIR / "hasil_apify_fb_groups.json"

TARGET_URLS = [
    "https://web.facebook.com/groups/4703268329726449",
    "https://web.facebook.com/groups/1823856604654121",
    "https://web.facebook.com/groups/404302279971716"
]

def load_apify_token():
    try:
        from dotenv import load_dotenv
        load_dotenv(ENV_FILE)
    except ImportError:
        pass
    token = os.getenv("APIFY_TOKEN")
    if not token and ENV_FILE.exists():
        with open(ENV_FILE, "r", encoding="utf-8") as f:
            for line in f:
                if line.startswith("APIFY_TOKEN="):
                    token = line.strip().split("=", 1)[1]
                    break
    return token

def convert_json_to_csv():
    if not OUTPUT_JSON.exists():
        print(f"❌ File {OUTPUT_JSON.name} tidak ditemukan.")
        return
        
    with open(OUTPUT_JSON, "r", encoding="utf-8") as f:
        dataset_items = json.load(f)
        
    if not dataset_items:
        print("⚠️ Dataset kosong.")
        return

    flattened_rows = []
    fieldnames = [
        "group_title",
        "post_id",
        "post_time",
        "user_name",
        "user_id",
        "user_profile_url",
        "text",
        "ocr_text",
        "price",
        "likes_count",
        "comments_count",
        "shares_count",
        "is_video",
        "post_url",
        "image_urls",
        "group_url"
    ]
    
    for item in dataset_items:
        shared = item.get("sharedPost") if isinstance(item.get("sharedPost"), dict) else {}
        user = item.get("user") if isinstance(item.get("user"), dict) else {}
        if not user:
            user = shared.get("user") if isinstance(shared.get("user"), dict) else {}
        if not user:
            user = shared.get("pageName") if isinstance(shared.get("pageName"), dict) else {}
            
        user_name = user.get("name", "")
        user_id = user.get("id", "")
        user_profile = user.get("profileUrl") or (f"https://www.facebook.com/{user_id}" if user_id else "")
        
        text = item.get("text") or shared.get("text") or ""
        
        # Attachments & OCR
        att_list = item.get("attachments") or shared.get("media") or []
        image_urls = []
        ocr_texts = []
        if isinstance(att_list, list):
            for a in att_list:
                if isinstance(a, dict):
                    img_url = a.get("thumbnail") or (a.get("photo_image") or a.get("image") or {}).get("uri") or a.get("url")
                    if img_url and img_url not in image_urls:
                        image_urls.append(img_url)
                    ocr = a.get("ocrText")
                    if ocr and ocr != "No photo description available." and ocr not in ocr_texts:
                        ocr_texts.append(ocr)
                        
        row = {
            "group_title": item.get("groupTitle", ""),
            "post_id": item.get("legacyId") or item.get("id", ""),
            "post_time": item.get("time", ""),
            "user_name": user_name,
            "user_id": user_id,
            "user_profile_url": user_profile,
            "text": text,
            "ocr_text": " | ".join(ocr_texts),
            "price": item.get("price", ""),
            "likes_count": item.get("likesCount", 0),
            "comments_count": item.get("commentsCount", 0),
            "shares_count": item.get("sharesCount", 0),
            "is_video": item.get("isVideo", False),
            "post_url": item.get("url", ""),
            "image_urls": " | ".join(image_urls),
            "group_url": item.get("facebookUrl") or item.get("inputUrl", "")
        }
        flattened_rows.append(row)
    
    with open(OUTPUT_CSV, "w", newline="", encoding="utf-8-sig") as f:
        writer = csv.DictWriter(f, fieldnames=fieldnames, extrasaction='ignore')
        writer.writeheader()
        writer.writerows(flattened_rows)
        
    print(f"🎉 [SUCCESS] Berhasil mengekspor {len(flattened_rows)} item postingan ke CSV terstruktur!")
    print(f"📊 File CSV tersimpan di: {OUTPUT_CSV.name}")

def run_apify_scraper(apify_token: str, results_limit: int = 20):
    print("=" * 70)
    print("🕷️ MEMULAI APIFY FACEBOOK GROUPS SCRAPER")
    print("=" * 70)
    print(f"[+] Menghubungkan ke API Apify (Token: {apify_token[:6]}...)...")
    
    client = ApifyClient(apify_token)
    
    run_input = {
        "captionText": False,
        "resultsLimit": results_limit,
        "startUrls": [{"url": url} for url in TARGET_URLS]
    }
    
    print("[+] Menjalankan Actor 'apify/facebook-groups-scraper' di Apify Cloud...")
    print(f"[*] Target Grup Facebook:\n  - " + "\n  - ".join(TARGET_URLS))
    
    try:
        run = client.actor("apify/facebook-groups-scraper").call(run_input=run_input)
        
        dataset_id = run.get("defaultDatasetId") if isinstance(run, dict) else getattr(run, "default_dataset_id", None)
        run_id = run.get("id") if isinstance(run, dict) else getattr(run, "id", None)
        
        print(f"[SUCCESS] Run Selesai! Run ID: {run_id}")
        print(f"[+] Mengambil data dataset hasil scraping (Dataset ID: {dataset_id})...")
        
        dataset_items = list(client.dataset(dataset_id).iterate_items())
        print(f"[🎉 HASIL] Berhasil mendapatkan {len(dataset_items)} item data postingan!")
        
        # Simpan JSON
        with open(OUTPUT_JSON, "w", encoding="utf-8") as f:
            json.dump(dataset_items, f, indent=2, ensure_ascii=False)
        print(f"[SAVED] File JSON tersimpan di: {OUTPUT_JSON.name}")
        
        # Simpan CSV dengan dynamic fieldnames
        convert_json_to_csv()
            
        return dataset_items
        
    except Exception as e:
        print(f"❌ Error saat menjalankan Apify Actor: {e}")
        return []

def main():
    token = load_apify_token()
    if not token:
        token = input("👉 Tempelkan APIFY_TOKEN Anda: ").strip()
        
    if not token:
        print("❌ APIFY_TOKEN tidak boleh kosong.")
        return
        
    if OUTPUT_JSON.exists():
        print("📝 File JSON hasil scraping sebelumnya sudah ada. Mengonversi ke CSV...")
        convert_json_to_csv()
    else:
        run_apify_scraper(token)

if __name__ == "__main__":
    main()
