import http.server
import socketserver
import json
import os
import sys
import subprocess
import threading
import csv
from datetime import datetime
from urllib.parse import parse_qs, urlparse

if hasattr(sys.stdout, 'reconfigure'):
    sys.stdout.reconfigure(encoding='utf-8')

PORT = 5000
BASE_DIR = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
CSV_PATH = os.path.join(BASE_DIR, "Aset_Konten", "Database_Caption", "detail_caption_instagram.csv")
SKU_CSV_PATH = os.path.join(BASE_DIR, "master_pricelist_sku.csv")
SHOPEE_CSV_PATH = os.path.join(BASE_DIR, "Strategi Bisnis", "kompetitor_shopee.csv")
LOCK_FILE = os.path.join(BASE_DIR, "Automasi_Medsos", "login_wait.lock")

# Global worker state
worker_state = {
    "is_running": False,
    "waiting_for_login": False,
    "active_task": None,
    "last_log": "Backend bridge server is ready.",
    "logs": ["Backend bridge server is ready."]
}

def add_log(msg):
    global worker_state
    worker_state["last_log"] = msg
    worker_state["logs"].append(msg)
    if len(worker_state["logs"]) > 50:
        worker_state["logs"].pop(0)

def run_worker_script(command, task_name):
    global worker_state
    worker_state["is_running"] = True
    worker_state["waiting_for_login"] = False
    worker_state["active_task"] = task_name
    add_log(f"🚀 Started task: {task_name}...")

    if os.path.exists(LOCK_FILE):
        try:
            os.remove(LOCK_FILE)
        except:
            pass

    try:
        env = dict(os.environ, PYTHONIOENCODING="utf-8")
        process = subprocess.Popen(
            command,
            cwd=BASE_DIR,
            stdout=subprocess.PIPE,
            stderr=subprocess.STDOUT,
            text=True,
            encoding='utf-8',
            errors='replace',
            env=env,
            shell=True
        )
        for line in process.stdout:
            line_str = line.strip()
            if line_str:
                add_log(line_str)
                print(f"[{task_name}] {line_str}")
                if "WAITING_FOR_LOGIN_CONFIRMATION" in line_str or "Tekan ENTER" in line_str:
                    worker_state["waiting_for_login"] = True

        process.wait()
        if process.returncode == 0:
            add_log(f"✅ Task '{task_name}' completed successfully!")
        else:
            add_log(f"❌ Task '{task_name}' exited with code {process.returncode}.")
    except Exception as e:
        add_log(f"❌ Error running '{task_name}': {str(e)}")
    finally:
        worker_state["is_running"] = False
        worker_state["waiting_for_login"] = False
        worker_state["active_task"] = None
        if os.path.exists(LOCK_FILE):
            try:
                os.remove(LOCK_FILE)
            except:
                pass

class BridgeRequestHandler(http.server.BaseHTTPRequestHandler):
    def _send_cors_headers(self):
        self.send_header('Access-Control-Allow-Origin', '*')
        self.send_header('Access-Control-Allow-Methods', 'GET, POST, OPTIONS')
        self.send_header('Access-Control-Allow-Headers', 'Content-Type')

    def do_OPTIONS(self):
        self.send_response(200)
        self._send_cors_headers()
        self.end_headers()

    def _respond_json(self, data, code=200):
        self.send_response(code)
        self._send_cors_headers()
        self.send_header('Content-Type', 'application/json; charset=utf-8')
        self.end_headers()
        self.wfile.write(json.dumps(data, ensure_ascii=False).encode('utf-8'))

    def do_GET(self):
        parsed = urlparse(self.path)
        path = parsed.path

        if path == "/api/status":
            self._respond_json({
                "status": "online",
                "worker": worker_state
            })
        elif path == "/api/posts":
            posts = []
            if os.path.exists(CSV_PATH):
                with open(CSV_PATH, 'r', encoding='utf-8') as f:
                    reader = csv.DictReader(f)
                    for row in reader:
                        posts.append(row)
            self._respond_json({"posts": posts})

        elif path == "/api/inventory":
            skus = []
            if os.path.exists(SKU_CSV_PATH):
                with open(SKU_CSV_PATH, 'r', encoding='utf-8') as f:
                    reader = csv.DictReader(f)
                    for row in reader:
                        skus.append(row)
            self._respond_json({"skus": skus})

        elif path == "/api/shopee-data":
            products = []
            if os.path.exists(SHOPEE_CSV_PATH):
                with open(SHOPEE_CSV_PATH, 'r', encoding='utf-8') as f:
                    reader = csv.DictReader(f)
                    for row in reader:
                        try:
                            row["harga_rp"] = int(row.get("harga_rp", 0))
                        except Exception:
                            row["harga_rp"] = 0

                        try:
                            row["berat_gram"] = int(row.get("berat_gram", 250))
                        except Exception:
                            row["berat_gram"] = 250

                        try:
                            row["harga_per_gram"] = float(row.get("harga_per_gram", 0))
                        except Exception:
                            row["harga_per_gram"] = round(row["harga_rp"] / row["berat_gram"], 2) if row["berat_gram"] > 0 else 0

                        try:
                            row["harga_per_kg"] = int(row.get("harga_per_kg", 0))
                        except Exception:
                            row["harga_per_kg"] = int(row["harga_per_gram"] * 1000)

                        products.append(row)

            prices = [p["harga_rp"] for p in products if p["harga_rp"] > 0]
            kg_prices = [p["harga_per_kg"] for p in products if p["harga_per_kg"] > 0]
            g_prices = [p["harga_per_gram"] for p in products if p["harga_per_gram"] > 0]

            stats = {
                "total_items": len(products),
                "avg_price": int(sum(prices) / len(prices)) if prices else 0,
                "min_price": min(prices) if prices else 0,
                "max_price": max(prices) if prices else 0,
                "avg_price_per_kg": int(sum(kg_prices) / len(kg_prices)) if kg_prices else 0,
                "min_price_per_kg": min(kg_prices) if kg_prices else 0,
                "max_price_per_kg": max(kg_prices) if kg_prices else 0,
                "avg_price_per_g": round(sum(g_prices) / len(g_prices), 2) if g_prices else 0,
                "min_price_per_g": min(g_prices) if g_prices else 0,
                "max_price_per_g": max(g_prices) if g_prices else 0,
            }
            self._respond_json({"products": products, "stats": stats})

        else:
            self._respond_json({"error": "Endpoint not found"}, 404)

    def do_POST(self):
        parsed = urlparse(self.path)
        path = parsed.path

        content_length = int(self.headers.get('Content-Length', 0))
        body_data = {}
        if content_length > 0:
            raw_body = self.rfile.read(content_length).decode('utf-8')
            try:
                body_data = json.loads(raw_body)
            except:
                pass

        if path == "/api/run-auto-post":
            if worker_state["is_running"]:
                self._respond_json({"error": f"Task '{worker_state['active_task']}' is already running!"}, 400)
                return
            
            cmd = "python Automasi_Medsos/auto_post_selenium.py"
            thread = threading.Thread(target=run_worker_script, args=(cmd, "Auto Post Feed/Carousel"))
            thread.daemon = True
            thread.start()

            self._respond_json({
                "message": "Auto Post Feed started in background!",
                "task": "Auto Post Feed/Carousel"
            })

        elif path == "/api/confirm-login":
            with open(LOCK_FILE, "w") as f:
                f.write("CONFIRMED")
            worker_state["waiting_for_login"] = False
            worker_state["last_log"] = "Konfirmasi Login/reCAPTCHA diterima dari Dashboard Web! Melanjutkan automasi..."
            self._respond_json({"message": "Login / reCAPTCHA confirmed successfully!"})

        elif path == "/api/run-auto-story":
            if worker_state["is_running"]:
                self._respond_json({"error": f"Task '{worker_state['active_task']}' is already running!"}, 400)
                return

            cmd = "python Automasi_Medsos/auto_story_selenium.py"
            thread = threading.Thread(target=run_worker_script, args=(cmd, "Auto Story Instagram"))
            thread.daemon = True
            thread.start()

            self._respond_json({
                "message": "Auto Story Instagram started in background!",
                "task": "Auto Story Instagram"
            })

        elif path == "/api/run-sync":
            if worker_state["is_running"]:
                self._respond_json({"error": f"Task '{worker_state['active_task']}' is already running!"}, 400)
                return

            cmd = "python run_sync.py"
            thread = threading.Thread(target=run_worker_script, args=(cmd, "Sync Google Drive Assets"))
            thread.daemon = True
            thread.start()

            self._respond_json({
                "message": "Sync Google Drive Assets started in background!",
                "task": "Sync Google Drive Assets"
            })

        elif path == "/api/scrape-shopee":
            if worker_state["is_running"]:
                self._respond_json({"error": f"Task '{worker_state['active_task']}' is already running!"}, 400)
                return

            mode = body_data.get("mode", "keyword").replace('"', '')
            keyword = body_data.get("keyword", "bawang goreng murni").replace('"', '')
            shopee_url = body_data.get("shopee_url", "").replace('"', '')
            shop_id = body_data.get("shop_id", "").replace('"', '')
            item_id = body_data.get("item_id", "").replace('"', '')
            category = body_data.get("category", "").replace('"', '')
            shop_username = body_data.get("shop_username", "").replace('"', '')
            use_apify = body_data.get("use_apify", False)

            cmd_parts = [f'python Automasi_Medsos/scrape_shopee.py --mode "{mode}" --keyword "{keyword}"']
            if shopee_url:
                cmd_parts.append(f'--url "{shopee_url}"')
            if shop_id:
                cmd_parts.append(f'--shop-id "{shop_id}"')
            if item_id:
                cmd_parts.append(f'--item-id "{item_id}"')
            if category:
                cmd_parts.append(f'--category "{category}"')
            if shop_username:
                cmd_parts.append(f'--shop-username "{shop_username}"')
            if use_apify:
                cmd_parts.append('--use-apify')

            cmd = " ".join(cmd_parts)
            task_label = f"Shopee Scraper ({mode.upper()}: {shopee_url or shop_username or keyword})"
            thread = threading.Thread(target=run_worker_script, args=(cmd, task_label))
            thread.daemon = True
            thread.start()

            self._respond_json({
                "message": f"Shopee Scraper ({mode}) dipicu di latar belakang!",
                "task": task_label
            })

        elif path == "/api/update-stock":
            # Body expected: {"sku": "JBM-250", "new_stock": 75}
            sku = body_data.get("sku")
            new_stock = body_data.get("new_stock")
            if not sku or new_stock is None:
                self._respond_json({"error": "Missing sku or new_stock"}, 400)
                return

            try:
                rows = []
                fieldnames = []
                with open(SKU_CSV_PATH, 'r', encoding='utf-8') as f:
                    reader = csv.DictReader(f)
                    fieldnames = reader.fieldnames
                    for row in reader:
                        if row["Kode_SKU"] == sku:
                            row["Stok_Awal"] = str(new_stock)
                        rows.append(row)

                with open(SKU_CSV_PATH, 'w', newline='', encoding='utf-8') as f:
                    writer = csv.DictWriter(f, fieldnames=fieldnames)
                    writer.writeheader()
                    writer.writerows(rows)

                self._respond_json({"message": f"Stok SKU {sku} berhasil diperbarui menjadi {new_stock}!"})
            except Exception as e:
                self._respond_json({"error": f"Gagal memperbarui stok: {str(e)}"}, 500)

        elif path == "/api/update-sku-price":
            # Body expected: {"sku": "JBM-250", "cogs": 34700, "promo": 64900}
            sku = body_data.get("sku")
            cogs = body_data.get("cogs")
            promo = body_data.get("promo")

            if not sku:
                self._respond_json({"error": "Missing sku"}, 400)
                return

            try:
                rows = []
                fieldnames = []
                with open(SKU_CSV_PATH, 'r', encoding='utf-8') as f:
                    reader = csv.DictReader(f)
                    fieldnames = reader.fieldnames
                    for row in reader:
                        if row["Kode_SKU"] == sku:
                            if cogs is not None:
                                row["Total_COGS_Rp"] = str(cogs)
                            if promo is not None:
                                row["Harga_Promo_Jual_Rp"] = str(promo)
                        rows.append(row)

                with open(SKU_CSV_PATH, 'w', newline='', encoding='utf-8') as f:
                    writer = csv.DictWriter(f, fieldnames=fieldnames)
                    writer.writeheader()
                    writer.writerows(rows)

                self._respond_json({"message": f"Harga/HPP SKU {sku} berhasil diperbarui!"})
            except Exception as e:
                self._respond_json({"error": f"Gagal memperbarui harga: {str(e)}"}, 500)

        elif path == "/api/add-post":
            try:
                file_exists = os.path.exists(CSV_PATH)
                fieldnames = ['id', 'nama_file_gambar', 'pilar_konten', 'judul_konten', 'headline_caption', 'isi_caption', 'call_to_action', 'hashtags', 'rekomendasi_waktu_post', 'jadwal_tayang', 'status_post']
                
                rows = []
                if file_exists:
                    with open(CSV_PATH, 'r', encoding='utf-8') as f:
                        rows = list(csv.DictReader(f))
                
                new_id = str(len(rows) + 1)
                new_row = {
                    'id': new_id,
                    'nama_file_gambar': body_data.get('nama_file_gambar', ''),
                    'pilar_konten': body_data.get('pilar_konten', 'Promosi Produk'),
                    'judul_konten': body_data.get('judul_konten', 'Judul Postingan Baru'),
                    'headline_caption': body_data.get('headline_caption', ''),
                    'isi_caption': body_data.get('isi_caption', ''),
                    'call_to_action': body_data.get('call_to_action', 'Klik link di bio!'),
                    'hashtags': body_data.get('hashtags', '#bawanggoreng #juragansanakbawang'),
                    'rekomendasi_waktu_post': body_data.get('rekomendasi_waktu_post', '12:00 WIB'),
                    'jadwal_tayang': body_data.get('jadwal_tayang', '2026-08-10 12:00'),
                    'status_post': 'PENDING'
                }

                with open(CSV_PATH, 'a', newline='', encoding='utf-8') as f:
                    writer = csv.DictWriter(f, fieldnames=fieldnames)
                    if not file_exists:
                        writer.writeheader()
                    writer.writerow(new_row)

                self._respond_json({"message": "Post successfully added to CSV schedule!", "post": new_row})
            except Exception as e:
                self._respond_json({"error": f"Failed to add post: {str(e)}"}, 500)

        elif path == "/api/sync-kompetitor":
            try:
                items = body_data.get('items', [])
                if not items:
                    self._respond_json({"error": "No items provided"}, 400)
                    return

                now_str = datetime.now().strftime("%Y-%m-%d %H:%M")
                existing_rows = []
                fieldnames = [
                    "rank", "toko", "nama_produk", "varian_berat", "harga_rp",
                    "berat_gram", "harga_per_gram", "harga_per_kg",
                    "terjual", "lokasi_toko", "rating", "link_shopee", "timestamp_scraped"
                ]

                if os.path.exists(SHOPEE_CSV_PATH):
                    with open(SHOPEE_CSV_PATH, 'r', encoding='utf-8') as f:
                        reader = csv.DictReader(f)
                        existing_rows = list(reader)

                for item in items:
                    toko = item.get("toko", "Shopee Competitor")
                    nama = item.get("nama_produk", "Produk Shopee")
                    varian = item.get("varian_berat", "250g")
                    harga = int(item.get("harga_rp", 0))
                    berat = int(item.get("berat_gram", 250))
                    price_g = float(item.get("harga_per_gram", round(harga / berat, 2) if berat > 0 else 0))
                    price_kg = int(item.get("harga_per_kg", int(price_g * 1000)))

                    new_row = {
                        "rank": str(len(existing_rows) + 1),
                        "toko": toko,
                        "nama_produk": nama,
                        "varian_berat": varian,
                        "harga_rp": str(harga),
                        "berat_gram": str(berat),
                        "harga_per_gram": str(price_g),
                        "harga_per_kg": str(price_kg),
                        "terjual": item.get("terjual", "100+ Terjual"),
                        "lokasi_toko": item.get("lokasi_toko", "Indonesia"),
                        "rating": item.get("rating", "4.9"),
                        "link_shopee": item.get("link_shopee", "https://shopee.co.id"),
                        "timestamp_scraped": now_str
                    }
                    existing_rows.append(new_row)

                # Re-assign rank
                for idx, r in enumerate(existing_rows, 1):
                    r["rank"] = str(idx)

                with open(SHOPEE_CSV_PATH, 'w', newline='', encoding='utf-8') as f:
                    writer = csv.DictWriter(f, fieldnames=fieldnames)
                    writer.writeheader()
                    writer.writerows(existing_rows)

                add_log(f"✅ Sync {len(items)} varian kompetitor Shopee ke CSV berhasil!")
                self._respond_json({"status": "success", "message": f"Successfully synced {len(items)} items to CSV!", "count": len(existing_rows)})
            except Exception as e:
                self._respond_json({"error": f"Failed to sync competitor data: {str(e)}"}, 500)

        else:
            self._respond_json({"error": "Endpoint not found"}, 404)

if __name__ == "__main__":
    socketserver.TCPServer.allow_reuse_address = True
    try:
        server = socketserver.TCPServer(("127.0.0.1", PORT), BridgeRequestHandler)
        print(f"🚀 Juragan Backend Bridge Server running on http://127.0.0.1:{PORT}")
        try:
            server.serve_forever()
        except KeyboardInterrupt:
            print("\nStopping Juragan Backend Bridge Server...")
            server.server_close()
    except (OSError, PermissionError) as e:
        err_str = str(e)
        if any(k in err_str for k in ["10048", "10013", "Address already in use", "forbidden", "Only one usage"]):
            print(f"✅ Backend Bridge Server sudah aktif berjalan di http://127.0.0.1:{PORT}!")
        else:
            raise e
