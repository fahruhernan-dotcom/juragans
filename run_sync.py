import sys
import subprocess
from pathlib import Path

if sys.platform == "win32":
    try:
        sys.stdout.reconfigure(encoding='utf-8')
    except Exception:
        pass

base_dir = Path(__file__).resolve().parent

# Step 1: Export Supabase DB (Single Source of Truth) to local CSVs
bridge_script = base_dir / "Manajemen_Pesanan" / "Scripts" / "supabase_sync_bridge.py"
if bridge_script.exists():
    print("[Step 1/2] Syncing Supabase DB to local CSV files...")
    subprocess.run([sys.executable, str(bridge_script)])
else:
    print(f"Warning: Sync bridge script not found at {bridge_script}")

# Step 2: Sync local files to Google Drive
target_script = base_dir / "Automasi_Medsos" / "sync_google_drive.py"
if target_script.exists():
    print("\n[Step 2/2] Uploading CSVs & Reports to Google Drive...")
    cmd = [sys.executable, str(target_script)] + sys.argv[1:]
    subprocess.run(cmd)
else:
    print(f"Error: Skrip utama tidak ditemukan di {target_script}")
