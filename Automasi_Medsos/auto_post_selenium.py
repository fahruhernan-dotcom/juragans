"""
=============================================================================
🚗 UNDETECTED CHROMEDRIVER INSTAGRAM AUTO POSTER
=============================================================================
Menggunakan `undetected-chromedriver` untuk melewati proteksi bot Instagram
dan mengunggah foto / carousel secara otomatis.
=============================================================================
"""

import os
import sys
import csv
import time
import random
import argparse
from pathlib import Path

# Unicode console support
if hasattr(sys.stdout, 'reconfigure'):
    sys.stdout.reconfigure(encoding='utf-8')

# Paths
AUTOMATION_DIR = Path(__file__).resolve().parent
BASE_DIR = AUTOMATION_DIR.parent
CSV_PATH = BASE_DIR / "Aset_Konten" / "Database_Caption" / "detail_caption_instagram.csv"
IMAGE_DIR = BASE_DIR / "Aset_Konten" / "Gambar_Produk"
CHROME_PROFILE_DIR = AUTOMATION_DIR / "chrome_profile"


def parse_image_paths(raw_image_str: str):
    """Menguraikan string nama file gambar (dipisah | atau ,) menjadi list Path yang ada di IMAGE_DIR."""
    delimiters = ['|', ',']
    items = [raw_image_str]
    for d in delimiters:
        new_items = []
        for it in items:
            new_items.extend([x.strip() for x in it.strip().split(d) if x.strip()])
        items = new_items

    valid_paths = []
    for item in items:
        img_path = IMAGE_DIR / item
        if img_path.exists():
            valid_paths.append(img_path.resolve())
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


def post_with_selenium(driver, image_paths: list, caption: str, post_number: int):
    from selenium.webdriver.common.by import By
    from selenium.webdriver.support.ui import WebDriverWait
    from selenium.webdriver.support import expected_conditions as EC
    from selenium.webdriver.common.keys import Keys

    try:
        print("   🖱️ Mencari tombol 'Create new post'...")

        # Find Create button
        create_btn = None
        selectors = [
            '//*[@aria-label="New post"]',
            '//*[@aria-label="Postingan baru"]',
            '//*[@aria-label="Buat"]',
            '//*[@aria-label="Create"]',
            '//*[local-name()="svg" and (@aria-label="New post" or @aria-label="Postingan baru" or @aria-label="Buat" or @aria-label="Create")]/ancestor::*[self::a or self::div or self::button]',
            '//a[contains(@href, "create")]',
            '//span[text()="Buat" or text()="Create"]',
        ]
        for sel in selectors:
            try:
                elems = driver.find_elements(By.XPATH, sel)
                for el in elems:
                    if el.is_displayed():
                        create_btn = el
                        break
                if create_btn:
                    break
            except Exception:
                continue

        if not create_btn:
            print("   ❌ Tombol 'Create new post' tidak ditemukan.")
            driver.save_screenshot(str(AUTOMATION_DIR / f"debug_create_btn_{post_number}.png"))
            return False

        try:
            create_btn.click()
        except Exception:
            driver.execute_script("arguments[0].click();", create_btn)
        time.sleep(2)

        # Cek apakah ada menu dropdown "Post" / "Postingan"
        try:
            post_menu_items = driver.find_elements(By.XPATH, '//span[text()="Post" or text()="Postingan"]')
            for pmi in post_menu_items:
                if pmi.is_displayed():
                    try:
                        pmi.click()
                    except Exception:
                        driver.execute_script("arguments[0].click();", pmi)
                    time.sleep(1)
                    break
        except Exception:
            pass

        # Upload file gambar
        print(f"   📎 Mengunggah {len(image_paths)} file gambar...")

        file_input = None
        for _ in range(3):
            try:
                inputs = driver.find_elements(By.XPATH, '//input[@type="file"]')
                if inputs:
                    file_input = inputs[0]
                    break
                # Coba klik "Select from computer" / "Pilih dari komputer" jika ada modal
                select_btns = driver.find_elements(By.XPATH, '//button[text()="Select from computer" or text()="Pilih dari komputer"]')
                if select_btns and select_btns[0].is_displayed():
                    pass # file input should be present behind button
            except Exception:
                pass
            time.sleep(1)

        if not file_input:
            file_input = WebDriverWait(driver, 10).until(
                EC.presence_of_element_located((By.XPATH, '//input[@type="file"]'))
            )

        # Multiple files separated by newline in Selenium
        file_string = "\n".join([str(p) for p in image_paths])
        try:
            file_input.send_keys(file_string)
        except Exception:
            # Retry getting fresh element reference
            file_input = driver.find_element(By.XPATH, '//input[@type="file"]')
            file_input.send_keys(file_string)

        time.sleep(3)

        # Next button (Crop -> Filter)
        print("   ➡️ Melewati langkah Crop...")
        next_btn = WebDriverWait(driver, 15).until(
            EC.element_to_be_clickable((By.XPATH, '//*[(self::div or self::button) and (text()="Next" or text()="Berikutnya" or text()="Selanjutnya")]'))
        )
        try:
            next_btn.click()
        except Exception:
            driver.execute_script("arguments[0].click();", next_btn)
        time.sleep(2)

        # Next button (Filter -> Caption)
        print("   ➡️ Melewati langkah Filter...")
        next_btn = WebDriverWait(driver, 15).until(
            EC.element_to_be_clickable((By.XPATH, '//*[(self::div or self::button) and (text()="Next" or text()="Berikutnya" or text()="Selanjutnya")]'))
        )
        try:
            next_btn.click()
        except Exception:
            driver.execute_script("arguments[0].click();", next_btn)
        time.sleep(2)

        # Caption
        print("   ✍️ Mengisi caption...")
        caption_area = WebDriverWait(driver, 15).until(
            EC.presence_of_element_located((By.XPATH, '//*[@aria-label="Write a caption..." or @aria-label="Tulis keterangan..." or @contenteditable="true"]'))
        )
        caption_area.click()
        time.sleep(0.5)

        # Gunakan pyperclip (Copy + Paste CTRL+V) untuk mendukung emoji dan multiline text
        import pyperclip
        pyperclip.copy(caption)
        caption_area.send_keys(Keys.CONTROL, 'v')
        time.sleep(1)

        # Share button
        print("   📤 Membagikan postingan...")
        share_btn = WebDriverWait(driver, 15).until(
            EC.element_to_be_clickable((By.XPATH, '//*[(self::div or self::button) and (text()="Share" or text()="Bagikan")]'))
        )
        share_btn.click()

        # Wait for confirmation
        print("   ⏳ Menunggu konfirmasi dari Instagram...")
        time.sleep(10)

        # Tutup dialog "Post shared" ("Selesai" / "Done" / X) jika ada
        try:
            close_btns = driver.find_elements(By.XPATH, '//*[text()="Selesai" or text()="Done" or @aria-label="Close" or @aria-label="Tutup"] | //*[local-name()="svg" and (@aria-label="Close" or @aria-label="Tutup")]/ancestor::button')
            for cb in close_btns:
                if cb.is_displayed():
                    cb.click()
                    time.sleep(1)
                    break
        except Exception:
            pass

        print(f"   🎉 SUCCESS! Post #{post_number} berhasil terbit di Instagram!")
        return True

    except Exception as e:
        print(f"   ❌ Gagal posting: {e}")
        try:
            driver.save_screenshot(str(AUTOMATION_DIR / f"debug_post_{post_number}.png"))
            print(f"   📸 Screenshot debug tersimpan: debug_post_{post_number}.png")
        except Exception:
            pass
        return False


def get_chrome_version():
    """Mendapatkan versi major Google Chrome yang terinstall di Windows."""
    import subprocess
    import re
    try:
        cmd = r'reg query "HKEY_CURRENT_USER\Software\Google\Chrome\BLBeacon" /v version'
        output = subprocess.check_output(cmd, shell=True, text=True)
        match = re.search(r'version\s+REG_SZ\s+(\d+)', output)
        if match:
            return int(match.group(1))
    except Exception:
        pass
    try:
        cmd = r'reg query "HKEY_LOCAL_MACHINE\SOFTWARE\WOW6432Node\Microsoft\Windows\CurrentVersion\Uninstall\Google Chrome" /v DisplayVersion'
        output = subprocess.check_output(cmd, shell=True, text=True)
        match = re.search(r'DisplayVersion\s+REG_SZ\s+(\d+)', output)
        if match:
            return int(match.group(1))
    except Exception:
        pass
    return None

def main():
    parser = argparse.ArgumentParser(description="Undetected ChromeDriver Instagram Auto Poster")
    parser.add_argument("--min-delay", type=int, default=30, help="Minimum delay (detik) antar post")
    parser.add_argument("--max-delay", type=int, default=40, help="Maximum delay (detik) antar post")
    parser.add_argument("--force-all", action="store_true", help="Post semua item tanpa memandang status")
    args = parser.parse_args()

    print("=" * 65)
    print("🚗 UNDETECTED CHROMEDRIVER INSTAGRAM AUTO POSTER")
    print("=" * 65)

    try:
        import undetected_chromedriver as uc
    except ImportError:
        print("❌ undetected-chromedriver belum terinstall. Jalankan `pip install undetected-chromedriver`.")
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

    chrome_ver = get_chrome_version()
    if chrome_ver:
        print(f"🔍 Terdeteksi Google Chrome versi {chrome_ver}.")
    else:
        print("🔍 Tidak bisa mendeteksi versi Chrome otomatis, menggunakan default.")

    print("🚀 Menginisialisasi Undetected ChromeDriver...")
    options = uc.ChromeOptions()
    CHROME_PROFILE_DIR.mkdir(parents=True, exist_ok=True)
    options.add_argument(f"--user-data-dir={CHROME_PROFILE_DIR.resolve()}")

    try:
        if chrome_ver:
            driver = uc.Chrome(options=options, version_main=chrome_ver, use_subprocess=True)
        else:
            driver = uc.Chrome(options=options, use_subprocess=True)
    except Exception as e:
        print(f"⚠️ Gagal dengan version_main={chrome_ver}, mencoba tanpa parameter versi... ({e})")
        driver = uc.Chrome(options=options, use_subprocess=True)
    driver.set_window_size(1280, 800)

    print("🔗 Membuka Instagram...")
    driver.get("https://www.instagram.com/")

    print("\n" + "=" * 65)
    print("📱 PANDUAN LOGIN / CAPTCHA (CHROMEDRIVER):")
    print("=" * 65)
    print("1. Jendela Chrome yang dikontrol ChromeDriver telah terbuka.")
    print("2. Silakan LOGIN & Selesaikan CAPTCHA di Chrome tersebut.")
    print("3. reCAPTCHA akan MUNCUL & BISA DIKLIK NORMAL (tidak blank).")
    print("4. Klik tombol 'Konfirmasi Login Selesai' di Dashboard Web ATAU tekan ENTER di sini.")
    print("=" * 65)
    print("[STATUS: WAITING_FOR_LOGIN_CONFIRMATION]")

    lock_file = AUTOMATION_DIR / "login_wait.lock"
    if lock_file.exists():
        try:
            lock_file.unlink()
        except Exception:
            pass

    # Wait for either lock_file created by Web API or Enter key
    import select
    import msvcrt

    while True:
        if lock_file.exists():
            print("✅ Konfirmasi login diterima dari Web Dashboard!")
            try:
                lock_file.unlink()
            except Exception:
                pass
            break

        if msvcrt.kbhit():
            key = msvcrt.getch()
            if key in [b'\r', b'\n']:
                print("✅ Konfirmasi login diterima dari Terminal!")
                break

        time.sleep(0.5)

    print("=" * 65 + "\n")

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
        success = post_with_selenium(driver, image_paths, caption, p['id'])

        if success:
            update_csv_status(p['id'], "POSTED")
            print(f"   ✅ Status CSV Post #{p['id']} diperbarui → POSTED")

        if idx < len(pending_posts) - 1:
            delay = random.uniform(args.min_delay, args.max_delay)
            print(f"\n   ⏳ Menunggu {delay:.0f} detik sebelum posting berikutnya...")
            time.sleep(delay)
            driver.get("https://www.instagram.com/")
            time.sleep(3)

    print(f"\n{'='*65}")
    print("🎉 SELURUH PROSES POSTING SELESAI!")
    print("=" * 65)
    driver.quit()


if __name__ == "__main__":
    main()
