"""
Script Import Data Leads Google Maps ke Database Supabase / PostgreSQL Standalone
Brand: Juragan by Anak Bawang
Target: Restoran & Bisnis Kuliner Indonesia di Singapore
"""

import os
import re
import json
import pandas as pd
import requests
from datetime import datetime

CSV_PATH = os.path.join(os.path.dirname(__file__), "..", "Datasets", "leads_singapore_fnb_enriched.csv")

SUPABASE_URL = os.getenv("SUPABASE_URL", "https://rezbfduwtpiyclvjqrlj.supabase.co")
ANON_KEY = os.getenv("SUPABASE_ANON_KEY", "YOUR_SUPABASE_ANON_KEY")

def clean_restaurant_name(raw_name: str) -> str:
    """Bersihkan nama restoran dari slogan, karakter khusus, atau embel-embel."""
    if not isinstance(raw_name, str):
        return ""
    name = raw_name.split("|")[0].split("@")[0].strip()
    name = re.sub(r"\s*-\s*Kandahar Street", "", name, flags=re.IGNORECASE)
    name = re.sub(r"Restaurant|Singapore|SG", "", name, flags=re.IGNORECASE).strip()
    return name if name else raw_name.strip()

def main():
    print(f"[INFO] Membaca dataset dari: {CSV_PATH}")
    if not os.path.exists(CSV_PATH):
        print(f"[ERROR] File tidak ditemukan: {CSV_PATH}")
        return

    df = pd.read_csv(CSV_PATH)
    print(f"[INFO] Ditemukan {len(df)} data prospek restoran.")

    headers = {
        "apikey": ANON_KEY,
        "Authorization": f"Bearer {ANON_KEY}",
        "Content-Type": "application/json",
        "Prefer": "resolution=merge-duplicates"
    }

    leads_payload = []
    now_iso = datetime.utcnow().isoformat() + "Z"

    for _, row in df.iterrows():
        raw_name = str(row.get("name", ""))
        c_name = clean_restaurant_name(raw_name)
        
        email = str(row["email"]).strip() if pd.notna(row.get("email")) and str(row.get("email")).strip() != "" else None
        phone = str(row["phone"]).strip() if pd.notna(row.get("phone")) and str(row.get("phone")).strip() != "" else None
        rating_val = float(row["rating"]) if pd.notna(row.get("rating")) else 4.5
        addr_val = str(row.get("address", "Singapore"))

        has_email = email is not None

        subject = f"Suplai Bawang Goreng Boyolali Grade S & Grade A untuk {c_name} Singapore" if has_email else None
        pitch = (
            f"Halo Manajemen & Head Chef {c_name},\n\n"
            f"Kami dari Juragan by Anak Bawang, produsen langsung Bawang Goreng Asli Boyolali (Cepogo, Jawa Tengah).\n"
            f"Melihat reputasi istimewa {c_name} di Google ({rating_val}★), kami ingin menawarkan pasokan rutin bawang goreng berkualitas premium langsung dari sentra produksi (tanpa perantara):\n"
            f"1. Grade S Murni: 100% Bawang Boyolali murni (0% tepung) untuk aroma autentik masakan Nusantara.\n"
            f"2. Grade A Crispy: Kerenyahan tahan lama (~5% tepung) untuk porsi dining volume tinggi.\n"
            f"3. Sertifikasi: Halal Resmi ID33110018517710724.\n\n"
            f"Bolehkah kami mengirimkan 1 Box Tester Sampel (1kg) gratis langsung ke dapur {c_name} di {addr_val}?\n\n"
            f"Salam hangat,\nFahru Hernan — Juragan by Anak Bawang (+62 821-3373-1213)"
        ) if has_email else None

        tags = []
        if pd.notna(row.get("opportunity_tags/0")): tags.append(str(row["opportunity_tags/0"]))
        if pd.notna(row.get("opportunity_tags/1")): tags.append(str(row["opportunity_tags/1"]))

        item = {
            "place_id": str(row.get("place_id", f"temp_{c_name.replace(' ', '_')}")),
            "name": raw_name,
            "clean_name": c_name,
            "category": str(row.get("category", "Indonesian restaurant")),
            "country": "Singapore",
            "city": "Singapore",
            "address": addr_val,
            "latitude": float(row["latitude"]) if pd.notna(row.get("latitude")) else None,
            "longitude": float(row["longitude"]) if pd.notna(row.get("longitude")) else None,
            "maps_url": str(row.get("maps_url", "")) if pd.notna(row.get("maps_url")) else None,
            "phone": phone,
            "email": email,
            "email_source": str(row.get("email_source", "")) if pd.notna(row.get("email_source")) else None,
            "website": str(row.get("website", "")) if pd.notna(row.get("website")) else None,
            "cms": str(row.get("cms", "")) if pd.notna(row.get("cms")) else None,
            "has_contact_form": bool(row.get("has_contact_form") == "true" or row.get("has_contact_form") is True),
            "instagram_url": str(row.get("social_links/instagram", "")) if pd.notna(row.get("social_links/instagram")) else None,
            "facebook_url": str(row.get("social_links/facebook", "")) if pd.notna(row.get("social_links/facebook")) else None,
            "tiktok_url": str(row.get("social_links/tiktok", "")) if pd.notna(row.get("social_links/tiktok")) else None,
            "linkedin_url": str(row.get("social_links/linkedin", "")) if pd.notna(row.get("social_links/linkedin")) else None,
            "rating": rating_val,
            "review_count": int(row["review_count"]) if pd.notna(row.get("review_count")) else 0,
            "contactability_score": int(row["contactability_score"]) if pd.notna(row.get("contactability_score")) else 50,
            "lead_priority": str(row.get("lead_priority", "warm")).lower(),
            "opportunity_tags": tags,
            "status_email": "sent" if has_email else "pending",
            "email_sent_count": 1 if has_email else 0,
            "last_contacted_at": now_iso if has_email else None,
            "ai_generated_subject": subject,
            "ai_generated_pitch": pitch,
            "scraped_at": str(row.get("scraped_at", now_iso))
        }
        leads_payload.append(item)

    # Kirim batch insert ke Supabase
    url_leads = f"{SUPABASE_URL}/rest/v1/b2b_leads"
    r = requests.post(url_leads, headers=headers, json=leads_payload)
    
    if r.status_code in (200, 201):
        print(f"[SUCCESS] {len(leads_payload)} prospek berhasil dimasukkan ke tabel 'b2b_leads'!")
    else:
        print(f"[ERROR] Error inserting leads ({r.status_code}): {r.text}")
        return

    # Ambil lead_id dari data yang baru dimasukkan untuk mengisi b2b_outreach_logs
    r_get = requests.get(f"{SUPABASE_URL}/rest/v1/b2b_leads?select=id,clean_name,email,ai_generated_subject,ai_generated_pitch&status_email=eq.sent", headers=headers)
    if r_get.status_code == 200:
        sent_leads = r_get.json()
        logs_payload = []
        for lead in sent_leads:
            if lead.get("email"):
                logs_payload.append({
                    "lead_id": lead["id"],
                    "channel": "email",
                    "recipient": lead["email"],
                    "subject": lead.get("ai_generated_subject") or "Penawaran Bawang Goreng Boyolali",
                    "message_body": lead.get("ai_generated_pitch") or "Penawaran resmi Juragan by Anak Bawang",
                    "status": "sent",
                    "sent_at": now_iso
                })
        
        if logs_payload:
            r_log = requests.post(f"{SUPABASE_URL}/rest/v1/b2b_outreach_logs", headers=headers, json=logs_payload)
            if r_log.status_code in (200, 201):
                print(f"[SUCCESS] {len(logs_payload)} log email pitching berhasil dicatat di tabel 'b2b_outreach_logs'!")

if __name__ == "__main__":
    main()
