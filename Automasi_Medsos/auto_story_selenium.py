import os
import sys
import time
import subprocess
import undetected_chromedriver as uc
from selenium.webdriver.common.by import By
from selenium.webdriver.support.ui import WebDriverWait
from selenium.webdriver.support import expected_conditions as EC
from selenium.webdriver.common.keys import Keys
import pyperclip

BASE_DIR = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
PROFILE_PATH = os.path.join(BASE_DIR, "Automasi_Medsos", "chrome_profile")

def get_chrome_version():
    try:
        cmd = r'reg query "HKEY_CURRENT_USER\Software\Google\Chrome\BLBeacon" /v version'
        output = subprocess.check_output(cmd, shell=True).decode('utf-8')
        version_str = output.strip().split()[-1]
        major_version = int(version_str.split('.')[0])
        print(f"🔍 Terdeteksi Google Chrome versi {major_version} ({version_str}).")
        return major_version
    except Exception as e:
        print(f"⚠️ Gagal mendeteksi versi Chrome via Registry: {e}. Menggunakan versi 150.")
        return 150

def run_auto_story():
    print("=================================================================")
    print("📱 AUTOMATION ENGINE: INSTAGRAM AUTO STORY PUBLISHER")
    print("=================================================================")
    
    os.makedirs(PROFILE_PATH, exist_ok=True)
    chrome_ver = get_chrome_version()

    options = uc.ChromeOptions()
    options.add_argument(f"--user-data-dir={PROFILE_PATH}")
    options.add_argument("--no-first-run")
    options.add_argument("--no-service-autorun")
    options.add_argument("--password-store=basic")
    options.add_argument("--disable-notifications")

    driver = uc.Chrome(options=options, version_main=chrome_ver)
    driver.maximize_window()

    try:
        print("🔗 Membuka Instagram...")
        driver.get("https://www.instagram.com/")
        time.sleep(5)

        # Look for Story button or Create button
        print("🖱️ Membuka pembuat Story Instagram...")
        
        # Check if story create button or file input is visible
        story_images = [
            os.path.join(BASE_DIR, "Aset_Konten", "01_foto_utama_produk_pouch_studio.jpg"),
            os.path.join(BASE_DIR, "Aset_Konten", "07_foto_detail_label_pirt_halal.jpg"),
            os.path.join(BASE_DIR, "Aset_Konten", "04_foto_saran_penyajian_bakso_soto.png")
        ]

        valid_image = None
        for img in story_images:
            if os.path.exists(img):
                valid_image = img
                break

        if not valid_image:
            print("❌ Tidak ada file gambar story yang valid di Aset_Konten.")
            return

        print(f"📎 Memilih gambar story: {os.path.basename(valid_image)}")

        # Click Create / Plus button
        try:
            create_btn = WebDriverWait(driver, 10).until(
                EC.element_to_be_clickable((By.XPATH, "//span[text()='Create' or text()='Buat']"))
            )
            create_btn.click()
            time.sleep(2)
        except:
            print("⚠️ Tombol Buat tidak ditemukan, mencoba akses direct upload...")

        # File input for upload
        file_input = WebDriverWait(driver, 10).until(
            EC.presence_of_element_located((By.XPATH, "//input[@type='file']"))
        )
        file_input.send_keys(valid_image)
        time.sleep(4)

        # Click Next -> Share
        for step in ["Next", "Selanjutnya", "Share", "Bagikan"]:
            try:
                btn = driver.find_element(By.XPATH, f"//div[text()='{step}' or text()='{step.capitalize()}']")
                btn.click()
                print(f"➡️ Menekan tombol '{step}'...")
                time.sleep(3)
            except:
                pass

        print("🎉 SUCCESS! Story berhasil terbit di Instagram!")
        time.sleep(5)

    except Exception as e:
        print(f"❌ Error saat mempublikasikan Story: {e}")
    finally:
        driver.quit()

if __name__ == "__main__":
    run_auto_story()
