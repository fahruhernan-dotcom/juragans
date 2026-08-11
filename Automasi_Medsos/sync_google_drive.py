"""
=============================================================================
BAWANG GORENG JURAGAN — GOOGLE DRIVE AUTO-UPLOAD & DEDUPLICATION MODULE
=============================================================================
Skrip ini mengunggah (AUTO-UPLOAD) seluruh aset media sosial dari folder lokal
'Konten' ke Google Drive Folder dengan MENJAGA STRUKTUR SUBFOLDER & DEDUPLIKASI:

📁 Target Root GDrive: https://drive.google.com/drive/folders/18pLNfIbRsiA_3kKdrnuTc3SUvoF-WsHd
  ├── 📁 Konten Gambar/  (Seluruh foto & grafik)
  ├── 📁 Konten Vidio/   (Seluruh video reels & promo)
  └── 📁 Database & Log/ (File CSV caption & log posting)
=============================================================================
"""

import os
import sys
import argparse
import logging
from pathlib import Path
from dotenv import load_dotenv

# Unicode console support
sys.stdout.reconfigure(encoding='utf-8')

# Setup Logging
logging.basicConfig(
    level=logging.INFO,
    format='%(asctime)s [%(levelname)s] %(message)s',
    handlers=[logging.StreamHandler(sys.stdout)]
)

load_dotenv()

DEFAULT_FOLDER_ID = os.getenv("GDRIVE_FOLDER_ID", "18pLNfIbRsiA_3kKdrnuTc3SUvoF-WsHd")
SERVICE_ACCOUNT_FILE = os.getenv("GDRIVE_SERVICE_ACCOUNT_FILE", "service_account.json")
OAUTH_CREDENTIALS_FILE = os.getenv("GDRIVE_OAUTH_CREDENTIALS_FILE", "credentials.json")
TOKEN_FILE = "token.json"

BASE_DIR = Path(__file__).resolve().parent.parent  # Root workspace
AUTOMATION_DIR = Path(__file__).resolve().parent  # Folder Automasi_Medsos/
KONTEN_GAMBAR_DIR = BASE_DIR / "Aset_Konten" / "Gambar_Produk"
KONTEN_VIDIO_DIR = BASE_DIR / "Aset_Konten" / "Video_Promo"
CAPTION_CSV = BASE_DIR / "Aset_Konten" / "Database_Caption" / "detail_caption_instagram.csv"

SCOPES = ['https://www.googleapis.com/auth/drive.file', 'https://www.googleapis.com/auth/drive']

def print_banner():
    print("=" * 75)
    print(" 🚀 JURAGAN BAWANG — GOOGLE DRIVE STRUCTURED & CLEAN AUTO-UPLOAD 🚀")
    print("=" * 75)
    print(f"📁 Target Root GDrive     : {DEFAULT_FOLDER_ID}")
    print(f"🔗 Public URL GDrive       : https://drive.google.com/drive/folders/{DEFAULT_FOLDER_ID}")
    print(f"📂 Subfolder lokal         : 'Konten Gambar', 'Konten Vidio', 'Database'")
    print("=" * 75)

def get_gdrive_service():
    """Menginisialisasi layanan Google Drive API v3."""
    creds = None
    service_acc_path = AUTOMATION_DIR / SERVICE_ACCOUNT_FILE
    oauth_path = AUTOMATION_DIR / OAUTH_CREDENTIALS_FILE
    token_path = AUTOMATION_DIR / TOKEN_FILE

    if token_path.exists():
        try:
            from google.oauth2.credentials import Credentials
            creds = Credentials.from_authorized_user_file(str(token_path), SCOPES)
        except Exception as e:
            logging.warning(f"Token expired/invalid: {e}")

    if not creds or not creds.valid:
        if creds and creds.expired and creds.refresh_token:
            try:
                from google.auth.transport.requests import Request
                creds.refresh(Request())
            except Exception:
                creds = None

        if not creds and oauth_path.exists():
            try:
                from google_auth_oauthlib.flow import InstalledAppFlow
                flow = InstalledAppFlow.from_client_secrets_file(str(oauth_path), SCOPES)
                creds = flow.run_local_server(port=0)
                with open(token_path, 'w') as token:
                    token.write(creds.to_json())
            except Exception as e:
                logging.error(f"Gagal login OAuth: {e}")

    if not creds and service_acc_path.exists():
        try:
            from google.oauth2 import service_account
            creds = service_account.Credentials.from_service_account_file(
                str(service_acc_path), scopes=SCOPES
            )
        except Exception as e:
            logging.error(f"Gagal Service Account: {e}")

    if creds:
        try:
            from googleapiclient.discovery import build
            return build('drive', 'v3', credentials=creds)
        except Exception as e:
            logging.error(f"Gagal inisialisasi Drive Service: {e}")
            return None
    return None

def get_or_create_gdrive_subfolder(service, parent_id, folder_name):
    """Mencari atau membuat subfolder di dalam folder Google Drive."""
    try:
        query = f"'{parent_id}' in parents and name = '{folder_name}' and mimeType = 'application/vnd.google-apps.folder' and trashed = false"
        results = service.files().list(q=query, fields="files(id, name)").execute()
        files = results.get('files', [])

        if files:
            return files[0]['id']
        else:
            logging.info(f"📁 Membuat subfolder baru di GDrive: '{folder_name}'...")
            folder_metadata = {
                'name': folder_name,
                'mimeType': 'application/vnd.google-apps.folder',
                'parents': [parent_id]
            }
            folder = service.files().create(body=folder_metadata, fields='id').execute()
            return folder.get('id')
    except Exception as e:
        logging.error(f"Gagal mengelola subfolder '{folder_name}': {e}")
        return parent_id

def clean_duplicates_in_subfolders(service, subfolder_map):
    """Mengecek dan menghapus file duplikat di setiap subfolder GDrive."""
    logging.info("🧹 Mengecek dan membersihkan file duplikat di Google Drive...")
    deleted_count = 0
    for folder_name, folder_id in subfolder_map.items():
        try:
            query = f"'{folder_id}' in parents and trashed = false and mimeType != 'application/vnd.google-apps.folder'"
            results = service.files().list(q=query, fields="files(id, name, createdTime)").execute()
            files = results.get('files', [])

            seen = {}
            for f in files:
                name = f['name']
                file_id = f['id']
                if name in seen:
                    logging.info(f"  🗑️  Menghapus file duplikat: '{name}' di {folder_name}...")
                    service.files().delete(fileId=file_id).execute()
                    deleted_count += 1
                else:
                    seen[name] = file_id
        except Exception as e:
            logging.error(f"Error saat cek duplikat di {folder_name}: {e}")
    
    if deleted_count > 0:
        logging.info(f"✅ Berhasil menghapus {deleted_count} file duplikat.")
    else:
        logging.info("✨ Tidak ditemukan file duplikat.")

def list_files_in_gdrive_folder(service, folder_id):
    """Mendapatkan daftar file dalam subfolder tertentu."""
    try:
        query = f"'{folder_id}' in parents and trashed = false"
        results = service.files().list(
            q=query,
            fields="nextPageToken, files(id, name, mimeType)",
            pageSize=1000
        ).execute()
        return {f['name']: f['id'] for f in results.get('files', []) if f['mimeType'] != 'application/vnd.google-apps.folder'}
    except Exception as e:
        logging.error(f"Gagal membaca isi subfolder {folder_id}: {e}")
        return {}

def upload_folder_contents(service, local_dir, gdrive_folder_id, file_patterns):
    """Mengunggah file dari lokal ke subfolder spesifik di Google Drive."""
    if not local_dir.exists():
        return 0, 0

    from googleapiclient.http import MediaFileUpload

    existing_gdrive_files = list_files_in_gdrive_folder(service, gdrive_folder_id)
    
    local_files = []
    for pattern in file_patterns:
        local_files.extend(local_dir.glob(pattern))

    uploaded = 0
    skipped = 0

    for file_path in local_files:
        filename = file_path.name

        if filename in existing_gdrive_files:
            if filename.endswith('.csv'):
                logging.info(f"  🔄 [UPDATING] '{filename}' di GDrive...")
                try:
                    media = MediaFileUpload(str(file_path), mimetype='text/csv', resumable=True)
                    service.files().update(
                        fileId=existing_gdrive_files[filename],
                        media_body=media
                    ).execute()
                    logging.info(f"  ✅ [BERHASIL UPDATE] '{filename}' diperbarui di GDrive!")
                    uploaded += 1
                except Exception as e:
                    logging.error(f"  ❌ Gagal update '{filename}': {e}")
                continue
            else:
                logging.info(f"  ⏩ [SKIP] '{filename}' sudah ada di GDrive.")
                skipped += 1
                continue

        logging.info(f"  ⬆️  [UPLOADING] '{filename}'...")
        try:
            file_metadata = {
                'name': filename,
                'parents': [gdrive_folder_id]
            }
            media = MediaFileUpload(str(file_path), resumable=True)
            uploaded_file = service.files().create(
                body=file_metadata,
                media_body=media,
                fields='id'
            ).execute()
            logging.info(f"  ✅ [BERHASIL] '{filename}' terunggah!")
            uploaded += 1
        except Exception as e:
            logging.error(f"  ❌ Gagal upload '{filename}': {e}")

    return uploaded, skipped

def clean_root_loose_files(service, root_folder_id, target_subfolders):
    """Memindahkan file liar yang terunggah di root GDrive ke subfolder yang sesuai."""
    try:
        query = f"'{root_folder_id}' in parents and trashed = false and mimeType != 'application/vnd.google-apps.folder'"
        results = service.files().list(q=query, fields="files(id, name)").execute()
        files = results.get('files', [])

        if not files:
            return

        logging.info("🧹 Memindahkan file root GDrive ke dalam subfolder...")
        for f in files:
            file_id = f['id']
            filename = f['name']

            target_subfolder_id = None
            if filename.lower().endswith(('.jpg', '.jpeg', '.png', '.webp')):
                target_subfolder_id = target_subfolders.get('Konten Gambar')
            elif filename.lower().endswith(('.mp4', '.mov', '.mkv')):
                target_subfolder_id = target_subfolders.get('Konten Vidio')
            elif filename.lower().endswith('.csv'):
                target_subfolder_id = target_subfolders.get('Database & Log')

            if target_subfolder_id:
                service.files().update(
                    fileId=file_id,
                    addParents=target_subfolder_id,
                    removeParents=root_folder_id,
                    fields='id, parents'
                ).execute()
    except Exception as e:
        logging.error(f"Gagal merapikan root folder: {e}")

def auto_upload_structured(root_folder_id=DEFAULT_FOLDER_ID):
    """Menjalankan Auto-Upload terstruktur sesuai hierarki folder lokal."""
    service = get_gdrive_service()
    if not service:
        logging.error("❌ Auto-Upload dibatalkan karena kredensial Google Drive belum dikonfiltrasi.")
        return

    logging.info("🔍 Menyiapkan struktur subfolder di Google Drive...")
    
    subfolder_gambar_id = get_or_create_gdrive_subfolder(service, root_folder_id, "Konten Gambar")
    subfolder_vidio_id = get_or_create_gdrive_subfolder(service, root_folder_id, "Konten Vidio")
    subfolder_db_id = get_or_create_gdrive_subfolder(service, root_folder_id, "Database & Log")

    subfolder_map = {
        'Konten Gambar': subfolder_gambar_id,
        'Konten Vidio': subfolder_vidio_id,
        'Database & Log': subfolder_db_id
    }

    clean_root_loose_files(service, root_folder_id, subfolder_map)
    clean_duplicates_in_subfolders(service, subfolder_map)

    print("\n--- 📷 SINKRONISASI SUBFOLDER: Konten Gambar ---")
    up_img, skip_img = upload_folder_contents(
        service, KONTEN_GAMBAR_DIR, subfolder_gambar_id, ['*.jpg', '*.jpeg', '*.png', '*.webp']
    )

    print("\n--- 🎥 SINKRONISASI SUBFOLDER: Konten Vidio ---")
    up_vid, skip_vid = upload_folder_contents(
        service, KONTEN_VIDIO_DIR, subfolder_vidio_id, ['*.mp4', '*.mov', '*.mkv']
    )

    print("\n--- 📊 SINKRONISASI SUBFOLDER: Database & Log ---")
    up_db = 0
    skip_db = 0
    if CAPTION_CSV.exists():
        u1, s1 = upload_folder_contents(
            service, CAPTION_CSV.parent, subfolder_db_id, ['detail_caption_instagram.csv']
        )
        up_db += u1
        skip_db += s1

    DATABASE_DIR = BASE_DIR / "Manajemen_Pesanan" / "Database"

    pesanan_csv = DATABASE_DIR / "daftar_pesanan_agustus_2026.csv"
    if pesanan_csv.exists():
        u2, s2 = upload_folder_contents(
            service, DATABASE_DIR, subfolder_db_id, ['daftar_pesanan_agustus_2026.csv']
        )
        up_db += u2
        skip_db += s2

    simulasi_csv = DATABASE_DIR / "daftar_pesanan_simulasi_agustus_2026.csv"
    if simulasi_csv.exists():
        u3, s3 = upload_folder_contents(
            service, DATABASE_DIR, subfolder_db_id, ['daftar_pesanan_simulasi_agustus_2026.csv']
        )
        up_db += u3
        skip_db += s3

    packing_gudang_csv = DATABASE_DIR / "rekap_packing_gudang.csv"
    if packing_gudang_csv.exists():
        u4, s4 = upload_folder_contents(
            service, DATABASE_DIR, subfolder_db_id, ['rekap_packing_gudang.csv']
        )
        up_db += u4
        skip_db += s4

    print("\n" + "=" * 70)
    print("🎉 RINGKASAN AUTO-UPLOAD TERSTRUKTUR GOOGLE DRIVE:")
    print(f"   • Konten Gambar : {up_img} terunggah, {skip_img} tersimpan di GDrive/Konten Gambar")
    print(f"   • Konten Vidio  : {up_vid} terunggah, {skip_vid} tersimpan di GDrive/Konten Vidio")
    print(f"   • Database/Log  : {up_db} terunggah, {skip_db} tersimpan di GDrive/Database & Log")
    print("=" * 70)

def main():
    print_banner()
    auto_upload_structured(DEFAULT_FOLDER_ID)

if __name__ == "__main__":
    main()
