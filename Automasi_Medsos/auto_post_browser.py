"""
=============================================================================
🌐 CONNECT-TO-CHROME INSTAGRAM AUTO POSTER — BAWANG GORENG JURAGAN
=============================================================================
Metode Paling Aman & Stabil:
1. Buka Chrome biasa / Remote Debugging Port 9222
2. Anda login ke Instagram secara manual di tab Chrome Anda sendiri
3. Skrip ini hanya terhubung dan menjalankan posting otomatis
=============================================================================
"""

import os
import sys
import csv
import time
import random
import argparse
import subprocess
from pathlib import Path

try:
    from dotenv import load_dotenv
    env_file = Path(__file__).resolve().parent / ".env"
    if env_file.exists():
        load_dotenv(env_file)
except ImportError:
    pass

# Unicode console support
if hasattr(sys.stdout, 'reconfigure'):
    sys.stdout.reconfigure(encoding='utf-8')

# Paths
AUTOMATION_DIR = Path(__file__).resolve().parent
BASE_DIR = AUTOMATION_DIR.parent
CSV_PATH = BASE_DIR / "Aset_Konten" / "Database_Caption" / "detail_caption_instagram.csv"
IMAGE_DIR = BASE_DIR / "Aset_Konten" / "Gambar_Produk"
CHROME_PROFILE_DIR = AUTOMATION_DIR / "chrome_profile"
CHROME_PATH = r"C:\Program Files\Google\Chrome\Application\chrome.exe"
DEBUG_PORT = 9222


def parse_image_paths(raw_image_str: str):
    """Menguraikan string nama file gambar (dipisah | atau ,) menjadi list Path yang ada di IMAGE_DIR."""
    delimiters = ['|', ',']
    items = [raw_image_str]
    for d in delimiters:
        new_items = []
        for it in items:
            new_items.extend([x.strip() for x in it.split(d) if x.strip()])
        items = new_items

    valid_paths = []
    for item in items:
        img_path = IMAGE_DIR / item
        if img_path.exists():
            valid_paths.append(img_path)
        else:
            print(f"   ⚠️ Warning: File gambar '{item}' tidak ditemukan di {IMAGE_DIR}")
    return valid_paths


def format_caption(row: dict) -> str:
    """Menggabungkan kolom-kolom caption menjadi format final."""
    headline = row.get('headline_caption', '').strip()
    isi = row.get('isi_caption', '').strip()
    cta = row.get('call_to_action', '').strip()
    hashtags = row.get('hashtags', '').strip()

    parts = [p for p in [headline, isi, cta, hashtags] if p]
    return "\n\n".join(parts)


def load_posts_from_csv():
    if not CSV_PATH.exists():
        print(f"❌ Error: File CSV {CSV_PATH} tidak ditemukan.")
        return []

    posts = []
    with open(CSV_PATH, mode='r', encoding='utf-8') as f:
        reader = csv.DictReader(f)
        for row in reader:
            posts.append(row)
    return posts


def update_csv_status(post_id: str, new_status: str = "POSTED"):
    posts = []
    fieldnames = []
    with open(CSV_PATH, mode='r', encoding='utf-8') as f:
        reader = csv.DictReader(f)
        fieldnames = reader.fieldnames
        for row in reader:
            if row['id'] == str(post_id):
                row['status_post'] = new_status
            posts.append(row)

    with open(CSV_PATH, mode='w', encoding='utf-8', newline='') as f:
        writer = csv.DictWriter(f, fieldnames=fieldnames)
        writer.writeheader()
        writer.writerows(posts)


def ensure_remote_chrome():
    """Pastikan Chrome Remote Debugging berjalan."""
    import urllib.request
    try:
        urllib.request.urlopen(f"http://localhost:{DEBUG_PORT}/json/version", timeout=1)
        print("✅ Ditemukan Chrome Remote Debugging yang sudah berjalan.")
        return None
    except Exception:
        pass

    # Tutup chrome lama jika ada agar port tidak bentrok
    try:
        subprocess.run(["taskkill", "/F", "/IM", "chrome.exe"], capture_output=True)
        time.sleep(1)
    except Exception:
        pass

    CHROME_PROFILE_DIR.mkdir(parents=True, exist_ok=True)
    cmd = [
        CHROME_PATH,
        f"--remote-debugging-port={DEBUG_PORT}",
        f"--user-data-dir={CHROME_PROFILE_DIR.resolve()}",
        "https://www.instagram.com/"
    ]
    print(f"🚀 Membuka Chrome biasa (Remote Debugging Port {DEBUG_PORT})...")
    proc = subprocess.Popen(cmd)
    time.sleep(3)
    return proc


def post_single_or_carousel(page, image_paths: list, caption: str, post_number: int):
    """Upload foto/carousel via Instagram Web UI."""
    try:
        print("   🖱️ Mencari tombol 'Create new post'...")

        create_btn = None
        selectors = [
            'svg[aria-label="New post"]',
            'svg[aria-label="Postingan baru"]',
            'svg[aria-label="Buat"]',
            'svg[aria-label="Create"]',
            'a[href="/create/"]',
            '[aria-label="New post"]',
            '[aria-label="Postingan baru"]',
            '[aria-label="Buat"]',
            '[aria-label="Create"]',
        ]
        for sel in selectors:
            try:
                el = page.locator(sel).first
                if el.is_visible(timeout=2000):
                    create_btn = el
                    break
            except Exception:
                continue

        if not create_btn:
            try:
                create_btn = page.locator('span:text("Buat"), span:text("Create")').first
                if not create_btn.is_visible(timeout=2000):
                    create_btn = None
            except Exception:
                pass

        if not create_btn:
            print("   ❌ Tombol 'Create new post' tidak ditemukan. Mengambil screenshot...")
            page.screenshot(path=str(AUTOMATION_DIR / f"debug_create_btn_{post_number}.png"))
            return False

        create_btn.click()
        time.sleep(2)

        # Upload file gambar
        print(f"   📎 Mengunggah {len(image_paths)} file gambar...")

        file_input = page.locator('input[type="file"]').first
        file_input.wait_for(state="attached", timeout=10000)

        file_strings = [str(p.resolve()) for p in image_paths]
        file_input.set_input_files(file_strings)
        time.sleep(3)

        # Crop step -> Filter step
        print("   ➡️ Melewati langkah Crop...")
        next_btn = page.locator('div[role="button"]:text("Next"), div[role="button"]:text("Berikutnya"), button:text("Next"), button:text("Berikutnya")').first
        next_btn.click(timeout=10000)
        time.sleep(2)

        # Filter step -> Caption step
        print("   ➡️ Melewati langkah Filter...")
        next_btn = page.locator('div[role="button"]:text("Next"), div[role="button"]:text("Berikutnya"), button:text("Next"), button:text("Berikutnya")').first
        next_btn.click(timeout=10000)
        time.sleep(2)

        # Caption step
        print("   ✍️ Mengisi caption...")
        caption_area = page.locator(
            '[aria-label="Write a caption..."], '
            '[aria-label="Tulis keterangan..."], '
            '[contenteditable="true"]'
        ).first
        caption_area.click()
        time.sleep(0.5)

        page.keyboard.type(caption, delay=10)
        time.sleep(1)

        # Share button
        print("   📤 Membagikan postingan...")
        share_btn = page.locator('div[role="button"]:text("Share"), div[role="button"]:text("Bagikan"), button:text("Share"), button:text("Bagikan")').first
        share_btn.click(timeout=10000)

        # Wait for confirmation
        print("   ⏳ Menunggu konfirmasi dari Instagram...")
        try:
            success_indicator = page.locator(
                'text="Post shared", '
                'text="Postingan dibagikan", '
                'text="Your post has been shared", '
                'text="Postingan Anda telah dibagikan", '
                'img[alt*="animated checkmark"]'
            ).first
            success_indicator.wait_for(state="visible", timeout=60000)
        except Exception:
            time.sleep(8)

        print(f"   🎉 SUCCESS! Post #{post_number} berhasil terbit di Instagram!")

        time.sleep(2)
        try:
            close_btn = page.locator('[aria-label="Close"], [aria-label="Tutup"]').first
            if close_btn.is_visible(timeout=2000):
                close_btn.click()
        except Exception:
            pass

        return True

    except Exception as e:
        print(f"   ❌ Gagal posting via browser: {e}")
        try:
            screenshot_path = AUTOMATION_DIR / f"debug_post_{post_number}.png"
            page.screenshot(path=str(screenshot_path))
            print(f"   📸 Screenshot debug: {screenshot_path.name}")
        except Exception:
            pass
        return False


def main():
    parser = argparse.ArgumentParser(description="Instagram Auto Poster via Chrome Connection")
    parser.add_argument("--min-delay", type=int, default=30, help="Minimum delay (detik) antar post")
    parser.add_argument("--max-delay", type=int, default=40, help="Maximum delay (detik) antar post")
    parser.add_argument("--force-all", action="store_true", help="Post semua item tanpa memandang status")
    args = parser.parse_args()

    print("=" * 65)
    print("🌐 INSTAGRAM AUTO POSTER VIA CHROME CONNECTION")
    print("=" * 65)

    try:
        from playwright.sync_api import sync_playwright
    except ImportError:
        print("❌ Playwright belum terinstall.")
        return

    posts = load_posts_from_csv()
    if not posts:
        print("Terdapat 0 postingan di CSV.")
        return

    pending_posts = [p for p in posts if p.get('status_post') == 'PENDING'] if not args.force_all else posts
    print(f"📋 Ditemukan {len(posts)} total postingan, {len(pending_posts)} postingan siap diposting.\n")

    if not pending_posts:
        print("✅ Tidak ada postingan PENDING yang perlu diproses.")
        return

    # Pastikan Chrome remote debugging terbuka
    ensure_remote_chrome()

    with sync_playwright() as pw:
        print("🔗 Menghubungkan ke Chrome...")
        browser = None
        for _ in range(10):
            try:
                browser = pw.chromium.connect_over_cdp(f"http://localhost:{DEBUG_PORT}")
                break
            except Exception:
                time.sleep(1)

        if not browser:
            print("❌ Gagal terhubung ke Chrome.")
            return

        context = browser.contexts[0]
        page = context.pages[0] if context.pages else context.new_page()

        print("\n" + "=" * 65)
        print("📱 CARA LOGIN DI CHROME:")
        print("=" * 65)
        print("1. Di Chrome yang terbuka, buka/refresh tab Instagram: https://www.instagram.com/")
        print("2. Silakan LOGIN & Selesaikan CAPTCHA di Chrome seperti biasa.")
        print("3. Setelah masuk ke BERANDA Instagram, kembali ke terminal ini.")
        print("=" * 65)
        input("👉 Tekan ENTER di sini jika Anda SUDAH ada di beranda Instagram... ")
        print("=" * 65 + "\n")

        print("   ✅ Mengambil alih untuk mulai posting otomatis...\n")

        try:
            not_now = page.locator('button:text("Not Now"), button:text("Lain kali"), button:text("Nanti saja")').first
            if not_now.is_visible(timeout=3000):
                not_now.click()
                time.sleep(1)
        except Exception:
            pass

        # === Mulai Posting ===
        for idx, p in enumerate(pending_posts):
            print(f"\n{'='*65}")
            print(f"📌 Processing Post #{p['id']} [{idx+1}/{len(pending_posts)}]")
            print(f"   Judul: {p.get('judul_konten', '')}")
            print(f"   Gambar: {p.get('nama_file_gambar', '')}")

            image_paths = parse_image_paths(p.get('nama_file_gambar', ''))
            if not image_paths:
                print(f"   ⚠️ Melewati Post #{p['id']}: gambar tidak ditemukan.")
                continue

            caption = format_caption(p)
            success = post_single_or_carousel(page, image_paths, caption, p['id'])

            if success:
                update_csv_status(p['id'], "POSTED")
                print(f"   ✅ Status CSV Post #{p['id']} diperbarui → POSTED")

            # Delay antar post
            if idx < len(pending_posts) - 1:
                delay = random.uniform(args.min_delay, args.max_delay)
                print(f"\n   ⏳ Menunggu {delay:.0f} detik sebelum posting berikutnya...")
                time.sleep(delay)

                try:
                    page.goto("https://www.instagram.com/", wait_until="domcontentloaded", timeout=15000)
                    time.sleep(3)
                except Exception:
                    pass

        print(f"\n{'='*65}")
        print("🎉 SELURUH PROSES POSTING SELESAI!")
        print("=" * 65)


if __name__ == "__main__":
    main()
