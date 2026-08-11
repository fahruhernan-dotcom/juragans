import os
import sys
from pathlib import Path
from google.oauth2.credentials import Credentials
from google.auth.transport.requests import Request
from google_auth_oauthlib.flow import InstalledAppFlow
from googleapiclient.discovery import build
from googleapiclient.http import MediaFileUpload

sys.stdout.reconfigure(encoding='utf-8')

AUTOMATION_DIR = Path(r"d:\Dokumen\02_Kerja_Profesional\Juragan by Anak Bawang\Automasi_Medsos")
TOKEN_PATH = AUTOMATION_DIR / "token.json"
OAUTH_PATH = AUTOMATION_DIR / "credentials.json"
SCOPES = ['https://www.googleapis.com/auth/drive.file', 'https://www.googleapis.com/auth/drive']

TARGET_PARENT_FOLDER_ID = "10-_WroPdCnRq9OiGSA3tXqSbyVRIVA5S"
BASE_PESANAN_DIR = Path(r"d:\Dokumen\02_Kerja_Profesional\Juragan by Anak Bawang\Manajemen_Pesanan")

FOLDERS_TO_UPLOAD = [
    {
        "local_path": BASE_PESANAN_DIR / "Invoice Divisi TE 8-8-26",
        "gdrive_folder_name": "Invoice Divisi TE 8/8/26"
    },
    {
        "local_path": BASE_PESANAN_DIR / "Invoice Adib Semarang 8-8-26",
        "gdrive_folder_name": "Invoice Adib Semarang 8/8/26"
    }
]

def get_service():
    creds = Credentials.from_authorized_user_file(str(TOKEN_PATH), SCOPES)
    if creds.expired and creds.refresh_token:
        creds.refresh(Request())
    return build('drive', 'v3', credentials=creds)

def get_or_create_subfolder(service, parent_id, folder_name):
    query = f"'{parent_id}' in parents and name = '{folder_name}' and mimeType = 'application/vnd.google-apps.folder' and trashed = false"
    results = service.files().list(q=query, fields="files(id, name)").execute()
    files = results.get('files', [])
    if files:
        return files[0]['id']
    else:
        print(f"📁 Membuat subfolder di GDrive: '{folder_name}'...")
        folder_metadata = {
            'name': folder_name,
            'mimeType': 'application/vnd.google-apps.folder',
            'parents': [parent_id]
        }
        folder = service.files().create(body=folder_metadata, fields='id').execute()
        return folder.get('id')

def upload_folder(service, local_dir, gdrive_folder_name):
    if not local_dir.exists():
        print(f"⚠️ Folder lokal tidak ditemukan: {local_dir}")
        return

    subfolder_id = get_or_create_subfolder(service, TARGET_PARENT_FOLDER_ID, gdrive_folder_name)
    print(f"\n📂 Uploading PDF folder: '{gdrive_folder_name}' (ID: {subfolder_id})")

    # Clean any .md files
    existing_res = service.files().list(q=f"'{subfolder_id}' in parents and trashed = false", fields="files(id, name)").execute()
    existing_files = {}
    for f in existing_res.get('files', []):
        if f['name'].endswith('.md'):
            service.files().delete(fileId=f['id']).execute()
        else:
            existing_files[f['name']] = f['id']

    # Upload PDF ONLY
    pdf_files = list(local_dir.glob("*.pdf"))
    uploaded_count = 0

    for fpath in pdf_files:
        fname = fpath.name
        if fname in existing_files:
            print(f"  🔄 Updating PDF: {fname}...")
            media = MediaFileUpload(str(fpath), mimetype="application/pdf", resumable=True)
            service.files().update(fileId=existing_files[fname], media_body=media).execute()
        else:
            print(f"  ⬆️ Uploading PDF: {fname}...")
            file_metadata = {
                'name': fname,
                'parents': [subfolder_id]
            }
            media = MediaFileUpload(str(fpath), mimetype="application/pdf", resumable=True)
            service.files().create(body=file_metadata, media_body=media, fields='id').execute()
        uploaded_count += 1

    print(f"✅ Selesai upload {uploaded_count} PDF ke '{gdrive_folder_name}'.")

def main():
    service = get_service()
    for item in FOLDERS_TO_UPLOAD:
        upload_folder(service, item["local_path"], item["gdrive_folder_name"])

    print("\n" + "=" * 65)
    print("🎉 HANYA FILE PDF YANG TERSIMPAN DI GOOGLE DRIVE!")
    print(f"🔗 URL Root Google Drive: https://drive.google.com/drive/folders/{TARGET_PARENT_FOLDER_ID}")
    print("=" * 65)

if __name__ == "__main__":
    main()
