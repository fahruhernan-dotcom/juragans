"""
=============================================================================
🤖 AUTOMATED INSTAGRAM SCHEDULED POSTER — BAWANG GORENG JURAGAN
=============================================================================
Skrip ini membaca file `Aset_Konten/Database_Caption/detail_caption_instagram.csv`
dan memposting gambar dari `Aset_Konten/Gambar_Produk` secara OTOMATIS.
=============================================================================
"""

import os
import sys
import time
import csv
import random
import argparse
import getpass
import uuid
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
SESSION_FILE = AUTOMATION_DIR / "session.json"

def challenge_code_handler(username, choice):
    """Callback untuk menangani kode verifikasi OTP (SMS / Email)."""
    print("\n" + "=" * 65)
    print("⚠️ TANTANGAN KEAMANAN INSTAGRAM (CHALLENGE / OTP)")
    print("=" * 65)
    if choice == 0:
        print(f"📩 Instagram mengirimkan kode verifikasi via SMS ke nomor HP akun '{username}'.")
    elif choice == 1:
        print(f"📩 Instagram mengirimkan kode verifikasi via EMAIL akun '{username}'.")
    else:
        print(f"📩 Instagram meminta kode verifikasi OTP untuk akun '{username}'.")
    
    code = input("👉 Masukkan 6-digit kode verifikasi yang Anda terima: ").strip()
    return code

import urllib.parse

def set_full_cookies(cl, raw_cookie_str: str):
    """Memuat cookie dari format string document.cookie, tabel DevTools tab-separated, atau sessionid."""
    cookies = {}

    lines = [l for l in raw_cookie_str.strip().splitlines() if l.strip()]
    
    # 1. Parsing jika berbentuk tabel paste dari DevTools Application > Cookies
    if len(lines) > 1 or "\t" in raw_cookie_str:
        for line in lines:
            parts = line.split("\t")
            if len(parts) >= 2:
                k = parts[0].strip()
                v = parts[1].strip()
                if k and v:
                    cookies[k] = v
    # 2. Parsing jika berbentuk document.cookie (key=val; key=val)
    elif ";" in raw_cookie_str or "=" in raw_cookie_str:
        for item in raw_cookie_str.split(";"):
            if "=" in item:
                k, v = item.strip().split("=", 1)
                cookies[k.strip()] = v.strip()

    raw_session = cookies.get("sessionid", raw_cookie_str.strip())
    sessionid = urllib.parse.unquote(raw_session)

    # Extrak ds_user_id dari sessionid jika tidak ada di cookies
    ds_user_id = cookies.get("ds_user_id")
    if not ds_user_id:
        ds_user_id = sessionid.split(":")[0].split("%3A")[0]

    # Susun cookie dictionary lengkap
    cookie_dict = {
        "sessionid": sessionid,
        "ds_user_id": str(ds_user_id),
    }

    if "csrftoken" in cookies:
        cookie_dict["csrftoken"] = cookies["csrftoken"]
    else:
        cookie_dict["csrftoken"] = uuid.uuid4().hex

    if "mid" in cookies:
        cookie_dict["mid"] = cookies["mid"]
    if "ig_did" in cookies:
        cookie_dict["ig_did"] = cookies["ig_did"]
    if "rur" in cookies:
        cookie_dict["rur"] = cookies["rur"]

    # Injeksi cookie awal ke instagrapi private cookiejar
    for k, v in cookie_dict.items():
        cl.private.cookies.set(k, str(v), domain=".instagram.com", path="/")

    # Perform base login_by_sessionid using instagrapi's mobile client headers
    try:
        cl.login_by_sessionid(sessionid)
    except Exception as e:
        print(f"⚠️ Warning login_by_sessionid: {e}, melanjutkan dengan penyetelan cookie manual...")

    # Re-inject all extra cookies untuk memastikan tidak ada cookie wajib yang hilang
    for k, v in cookie_dict.items():
        cl.private.cookies.set(k, str(v), domain=".instagram.com", path="/")

    return cl

def _try_login_with_retry(cl, username, password, max_attempts=2):
    """Coba login dengan retry dan panduan otorisasi perangkat baru."""
    from instagrapi import Client

    for attempt in range(1, max_attempts + 1):
        try:
            if attempt > 1:
                print(f"\n🔄 Mencoba login kembali (Percobaan #{attempt})...")
            cl.login(username, password)
            cl.dump_settings(SESSION_FILE)
            print("✅ LOGIN BERHASIL! Sesi telah disimpan ke `session.json`.\n")
            return cl
        except Exception as e:
            err_msg = str(e)
            print(f"\n⚠️ Login gagal: {err_msg}")

            if attempt < max_attempts:
                print("\n" + "=" * 65)
                print("📱 INSTAGRAM MEMERLUKAN OTORISASI PERANGKAT BARU")
                print("=" * 65)
                print("Langkah-langkah:")
                print("1. Buka aplikasi Instagram di HP Anda.")
                print("2. Masuk ke: Pengaturan > Keamanan > Aktivitas Login.")
                print("3. Cari login dari perangkat tidak dikenal (Samsung/Android).")
                print("4. Klik 'Ini Saya' / 'It Was Me' untuk mengotorisasi.")
                print("")
                print("Alternatif: Jika ada notifikasi pop-up 'Apakah ini Anda?'")
                print("           di aplikasi Instagram, klik 'Ya' / 'Yes'.")
                print("=" * 65)
                input("👉 Setelah Anda otorisasi, TEKAN ENTER DI SINI untuk retry... ")
            else:
                print("❌ Login gagal setelah semua percobaan.")
                return None
    return None

def get_client_interactive(sessionid_arg: str = None, username_arg: str = None, password_arg: str = None):
    """Fungsi login Instagram interaktif — prioritas: session.json > .env > input manual."""
    try:
        from instagrapi import Client
    except ImportError:
        print("❌ Error: Package `instagrapi` belum terinstall. Jalankan `pip install instagrapi`.")
        return None

    cl = Client()
    cl.challenge_code_handler = challenge_code_handler

    # 1. Coba muat sesi lokal yang tersimpan jika ada
    if SESSION_FILE.exists():
        try:
            print("💾 Ditemukan file sesi lokal (session.json). Mencoba verifikasi sesi...")
            cl.load_settings(SESSION_FILE)
            cl.get_timeline_feed()  # tes koneksi sesi
            print("✅ BERHASIL LOGIN menggunakan sesi tersimpan (session.json)!\n")
            return cl
        except Exception as e:
            print(f"⚠️ Sesi tersimpan sudah kedaluwarsa ({e}). Menghapus sesi lama...\n")
            try:
                os.remove(SESSION_FILE)
            except OSError:
                pass

    # 2. Login via Username & Password (dari .env / CLI / environment)
    env_user = username_arg or os.environ.get("INSTAGRAM_USERNAME")
    env_pass = password_arg or os.environ.get("INSTAGRAM_PASSWORD")

    if env_user and env_pass and env_user not in ("ISI_USERNAME_ANDA_DISINI", "juragan_bawang_username"):
        print(f"🔑 Mencoba login otomatis dengan kredensial (.env / CLI): {env_user}...")
        result = _try_login_with_retry(cl, env_user, env_pass)
        if result:
            return result
        print("⚠️ Login via .env gagal. Beralih ke input manual...\n")

    # 3. Jika tidak ada kredensial di .env, minta input manual
    print("=" * 65)
    print("🔐 LOGIN INSTAGRAM — Masukkan Username & Password")
    print("=" * 65)
    print("⚠️ PENTING: Login Username & Password diperlukan agar Instagram")
    print("   mengizinkan upload foto & carousel. Cookie browser TIDAK bisa")
    print("   digunakan untuk upload media via API seluler Instagram.")
    print("=" * 65)
    print("💡 TIP: Isi file `.env` di folder Automasi_Medsos agar login otomatis.")
    print("=" * 65)

    username = input("👤 Username Instagram: ").strip()
    password = getpass.getpass("🔑 Password Instagram: ")

    if not username or not password:
        print("❌ Username dan Password tidak boleh kosong.")
        return None

    print("\n🔄 Sedang mencoba login ke Instagram...")
    result = _try_login_with_retry(cl, username, password)
    return result

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
            print(f"⚠️ Warning: File gambar '{item}' tidak ditemukan di {IMAGE_DIR}")
    return valid_paths

def format_caption(row: dict) -> str:
    """Menggabungkan kolom-kolom caption menjadi format final."""
    headline = row.get('headline_caption', '').strip()
    isi = row.get('isi_caption', '').strip()
    cta = row.get('call_to_action', '').strip()
    hashtags = row.get('hashtags', '').strip()

    parts = [p for p in [headline, isi, cta, hashtags] if p]
    return "\n\n".join(parts)

def prepare_image_for_instagram(image_path: Path) -> Path:
    """Mengonversi gambar (PNG/RGBA/WEBP) ke format RGB JPEG standar Instagram."""
    try:
        from PIL import Image
        img = Image.open(image_path)
        
        # Konversi transparansi / palette ke RGB
        if img.mode in ("RGBA", "P", "LA"):
            background = Image.new("RGB", img.size, (255, 255, 255))
            if img.mode == "P":
                img = img.convert("RGBA")
            background.paste(img, mask=img.split()[-1] if img.mode == "RGBA" else None)
            img = background
        elif img.mode != "RGB":
            img = img.convert("RGB")

        temp_dir = AUTOMATION_DIR / "temp_images"
        temp_dir.mkdir(exist_ok=True)
        converted_path = temp_dir / f"prep_{image_path.stem}.jpg"
        img.save(converted_path, "JPEG", quality=95)
        return converted_path
    except Exception as e:
        print(f"⚠️ Warning konversi gambar {image_path.name}: {e}")
        return image_path

def cleanup_temp_images():
    temp_dir = AUTOMATION_DIR / "temp_images"
    if temp_dir.exists():
        for f in temp_dir.glob("*"):
            try:
                f.unlink()
            except OSError:
                pass

def post_via_instagrapi_client(cl, image_paths: list, caption: str, max_retries: int = 3):
    if not image_paths:
        print("❌ Error: Tidak ada file gambar yang valid.")
        return False, False

    # Pra-proses semua gambar slide ke RGB JPEG
    prepared_paths = [prepare_image_for_instagram(p) for p in image_paths]

    for attempt in range(1, max_retries + 1):
        if attempt > 1:
            print(f"🔄 Mencoba ulang unggahan (Percobaan #{attempt}/{max_retries})...")
            time.sleep(5)

        if len(prepared_paths) == 1:
            img_path = prepared_paths[0]
            print(f"📤 Uploading Single Photo: {img_path.name}...")
            try:
                media = cl.photo_upload(path=str(img_path), caption=caption)
                print(f"🎉 SUCCESS! Foto {img_path.name} terbit di Instagram! (ID: {media.pk})")
                cleanup_temp_images()
                return True, False
            except Exception as e:
                err_str = str(e)
                print(f"❌ Gagal upload foto {img_path.name} (Percobaan #{attempt}): {err_str}")
                is_login_req = "login_required" in err_str or "403" in err_str
                if is_login_req or attempt == max_retries:
                    cleanup_temp_images()
                    return False, is_login_req
        else:
            print(f"📸 Uploading Carousel ({len(prepared_paths)} slide): {[p.name for p in prepared_paths]}...")
            try:
                paths_str = [str(p) for p in prepared_paths]
                media = cl.album_upload(paths=paths_str, caption=caption)
                print(f"🎉 SUCCESS! Carousel {len(prepared_paths)} gambar terbit di Instagram! (ID: {media.pk})")
                cleanup_temp_images()
                return True, False
            except Exception as e:
                err_str = str(e)
                print(f"❌ Gagal upload Carousel album (Percobaan #{attempt}): {err_str}")
                is_login_req = "login_required" in err_str or "403" in err_str
                if is_login_req or attempt == max_retries:
                    cleanup_temp_images()
                    return False, is_login_req

    cleanup_temp_images()
    return False, False

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

def main():
    parser = argparse.ArgumentParser(description="Automated Instagram Scheduled Poster")
    parser.add_argument("--username", type=str, help="Username Instagram")
    parser.add_argument("--password", type=str, help="Password Instagram")
    parser.add_argument("--sessionid", type=str, help="Cookie sessionid Instagram")
    parser.add_argument("--min-delay", type=int, default=30, help="Minimum delay (detik) antar post")
    parser.add_argument("--max-delay", type=int, default=40, help="Maximum delay (detik) antar post")
    parser.add_argument("--force-all", action="store_true", help="Post semua item tanpa memandang status PENDING/POSTED")
    args = parser.parse_args()

    print("=" * 65)
    print("🤖 AUTOMATED INSTAGRAM SCHEDULED POSTER — JURAGAN BY ANAK BAWANG")
    print("=" * 65)

    cl = get_client_interactive(args.sessionid, args.username, args.password)
    if not cl:
        print("❌ Aborting: Login gagal.")
        return

    posts = load_posts_from_csv()
    if not posts:
        print("Terdapat 0 postingan di CSV.")
        return

    pending_posts = [p for p in posts if p.get('status_post') == 'PENDING'] if not args.force_all else posts
    print(f"📋 Ditemukan {len(posts)} total postingan, {len(pending_posts)} postingan siap diposting.\n")

    for idx, p in enumerate(pending_posts):
        print(f"\n📌 Processing Post #{p['id']} [{idx+1}/{len(pending_posts)}]")
        print(f"   Judul: {p.get('judul_konten', '')}")
        print(f"   Gambar: {p.get('nama_file_gambar', '')}")

        image_paths = parse_image_paths(p.get('nama_file_gambar', ''))
        if not image_paths:
            print(f"⚠️ Melewati Post #{p['id']} karena gambar tidak ditemukan.")
            continue

        caption = format_caption(p)
        success, is_login_req = post_via_instagrapi_client(cl, image_paths, caption)

        if is_login_req:
            print("\n❌ POSTING DIHENTIKAN: Instagram menolak autentikasi (`login_required`).")
            print("👉 Sesi cookie kurang lengkap atau diblokir saat melakukan upload foto.")
            print("👉 Silakan hapus file `session.json` lalu jalankan ulang dengan Cookie String lengkap.")
            if SESSION_FILE.exists():
                try:
                    os.remove(SESSION_FILE)
                except OSError:
                    pass
            break

        if success:
            update_csv_status(p['id'], "POSTED")
            print(f"✅ Status CSV untuk Post #{p['id']} diperbarui menjadi POSTED.")

        # Delay jika masih ada post berikutnya
        if idx < len(pending_posts) - 1:
            delay = random.uniform(args.min_delay, args.max_delay)
            print(f"\n⏳ Menunggu {delay:.1f} detik sebelum posting berikutnya (jeda anti-bot)...")
            time.sleep(delay)

    print("\n🎉 SELURUH PROSES POSTING SELESAI!")

if __name__ == "__main__":
    main()
