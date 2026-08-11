import os
import sys
from pathlib import Path

sys.stdout.reconfigure(encoding='utf-8')

from google.oauth2.credentials import Credentials
from google.auth.transport.requests import Request
from google_auth_oauthlib.flow import InstalledAppFlow
from googleapiclient.discovery import build
from googleapiclient.http import MediaFileUpload

AUTOMATION_DIR = Path(r"d:\Dokumen\02_Kerja_Profesional\Juragan by Anak Bawang\Automasi_Medsos")
TOKEN_PATH = AUTOMATION_DIR / "token.json"
OAUTH_PATH = AUTOMATION_DIR / "credentials.json"
SCOPES = ['https://www.googleapis.com/auth/drive.file', 'https://www.googleapis.com/auth/drive']

TARGET_PARENT_FOLDER_ID = "10-_WroPdCnRq9OiGSA3tXqSbyVRIVA5S"
LOCAL_INVOICE_DIR = Path(r"d:\Dokumen\02_Kerja_Profesional\Juragan by Anak Bawang\Manajemen_Pesanan\Invoice Divisi TE 8-8-26")

def get_service():
    creds = None
    if TOKEN_PATH.exists():
        try:
            creds = Credentials.from_authorized_user_file(str(TOKEN_PATH), SCOPES)
        except Exception as e:
            print(f"Error loading token: {e}")
            creds = None
            
    if creds and creds.expired and creds.refresh_token:
        try:
            creds.refresh(Request())
        except Exception as e:
            print(f"Refresh failed: {e}. Re-authenticating...")
            creds = None
            
    if not creds or not creds.valid:
        if OAUTH_PATH.exists():
            print("Initiating OAuth Flow in browser...")
            flow = InstalledAppFlow.from_client_secrets_file(str(OAUTH_PATH), SCOPES)
            creds = flow.run_local_server(port=0)
            with open(TOKEN_PATH, 'w') as token:
                token.write(creds.to_json())
        else:
            raise Exception("No valid credentials.json found.")
            
    return build('drive', 'v3', credentials=creds)

def get_or_create_subfolder(service, parent_id, folder_name):
    query = f"'{parent_id}' in parents and name = '{folder_name}' and mimeType = 'application/vnd.google-apps.folder' and trashed = false"
    results = service.files().list(q=query, fields="files(id, name)").execute()
    files = results.get('files', [])
    if files:
        return files[0]['id']
    else:
        print(f"Membuat folder baru di GDrive: '{folder_name}'...")
        folder_metadata = {
            'name': folder_name,
            'mimeType': 'application/vnd.google-apps.folder',
            'parents': [parent_id]
        }
        folder = service.files().create(body=folder_metadata, fields='id').execute()
        return folder.get('id')

def upload_files():
    service = get_service()
    subfolder_name = "Invoice Divisi TE 8/8/26"
    subfolder_id = get_or_create_subfolder(service, TARGET_PARENT_FOLDER_ID, subfolder_name)
    
    print(f"GDrive Folder ID: {subfolder_id}")
    
    files = list(LOCAL_INVOICE_DIR.glob("*.*"))
    uploaded_count = 0
    
    query = f"'{subfolder_id}' in parents and trashed = false"
    existing_res = service.files().list(q=query, fields="files(id, name)").execute()
    existing_files = {f['name']: f['id'] for f in existing_res.get('files', [])}
    
    for fpath in files:
        fname = fpath.name
        mime = "application/pdf" if fname.endswith(".pdf") else "text/markdown"
        
        if fname in existing_files:
            print(f"Updating: {fname}...")
            media = MediaFileUpload(str(fpath), mimetype=mime, resumable=True)
            service.files().update(fileId=existing_files[fname], media_body=media).execute()
        else:
            print(f"Uploading: {fname}...")
            file_metadata = {
                'name': fname,
                'parents': [subfolder_id]
            }
            media = MediaFileUpload(str(fpath), mimetype=mime, resumable=True)
            service.files().create(body=file_metadata, media_body=media, fields='id').execute()
        uploaded_count += 1
        
    print(f"\nBerhasil mengunggah {uploaded_count} file ke Google Drive!")
    print(f"URL Folder Invoice: https://drive.google.com/drive/folders/{subfolder_id}")

if __name__ == "__main__":
    upload_files()
