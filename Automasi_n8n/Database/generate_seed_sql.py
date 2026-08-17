import os
import re
import pandas as pd
from datetime import datetime

base_dir = os.path.dirname(__file__)
csv_path = os.path.join(base_dir, "..", "Datasets", "leads_singapore_fnb_enriched.csv")
out_path = os.path.join(base_dir, "seed_50_leads_and_pitch_logs.sql")

df = pd.read_csv(csv_path)

def clean_name(raw):
    if not isinstance(raw, str): return ""
    n = raw.split("|")[0].split("@")[0].strip()
    n = re.sub(r"\s*-\s*Kandahar Street", "", n, flags=re.IGNORECASE)
    n = re.sub(r"Restaurant|Singapore|SG", "", n, flags=re.IGNORECASE).strip()
    return n if n else raw.strip()

sql_lines = [
    "-- ==============================================================================",
    "-- DIRECT SEED: 50 RESTO LEADS UNTUK DI-PITCHING OTOMATIS OLEH AI N8N",
    "-- ==============================================================================",
    "GRANT USAGE ON SCHEMA public TO anon, authenticated, service_role;",
    "GRANT ALL ON ALL TABLES IN SCHEMA public TO anon, authenticated, service_role;",
    "ALTER TABLE IF EXISTS b2b_leads DISABLE ROW LEVEL SECURITY;",
    "ALTER TABLE IF EXISTS b2b_outreach_logs DISABLE ROW LEVEL SECURITY;",
    "ALTER TABLE IF EXISTS b2b_campaigns DISABLE ROW LEVEL SECURITY;",
    "ALTER TABLE IF EXISTS b2b_samples DISABLE ROW LEVEL SECURITY;",
    ""
]

now_iso = datetime.now().strftime("%Y-%m-%d %H:%M:%S+00")

for _, row in df.iterrows():
    raw_name = str(row.get("name", "")).replace("'", "''")
    c_name = clean_name(str(row.get("name", ""))).replace("'", "''")
    place_id = str(row.get("place_id", f"temp_{c_name}")).replace("'", "''")
    cat = str(row.get("category", "Indonesian restaurant")).replace("'", "''")
    addr = str(row.get("address", "Singapore")).replace("'", "''")
    
    email_val = str(row["email"]).strip().replace("'", "''") if pd.notna(row.get("email")) and str(row.get("email")).strip() != "" else None
    email_sql = f"'{email_val}'" if email_val else "NULL"
    
    phone_val = str(row["phone"]).strip().replace("'", "''") if pd.notna(row.get("phone")) and str(row.get("phone")).strip() != "" else None
    phone_sql = f"'{phone_val}'" if phone_val else "NULL"
    
    web_val = str(row["website"]).strip().replace("'", "''") if pd.notna(row.get("website")) else None
    web_sql = f"'{web_val}'" if web_val else "NULL"
    
    maps_val = str(row["maps_url"]).strip().replace("'", "''") if pd.notna(row.get("maps_url")) else None
    maps_sql = f"'{maps_val}'" if maps_val else "NULL"
    
    insta_val = str(row["social_links/instagram"]).strip().replace("'", "''") if pd.notna(row.get("social_links/instagram")) else None
    insta_sql = f"'{insta_val}'" if insta_val else "NULL"
    
    fb_val = str(row["social_links/facebook"]).strip().replace("'", "''") if pd.notna(row.get("social_links/facebook")) else None
    fb_sql = f"'{fb_val}'" if fb_val else "NULL"
    
    rating = float(row["rating"]) if pd.notna(row.get("rating")) else 4.5
    reviews = int(row["review_count"]) if pd.notna(row.get("review_count")) else 0
    score = int(row["contactability_score"]) if pd.notna(row.get("contactability_score")) else 50
    prio = str(row.get("lead_priority", "warm")).lower()
    
    # Set status_email = 'pending' agar AI di n8n membuat pitching sendiri saat workflow dijalankan
    sql_insert_lead = f"""INSERT INTO b2b_leads (
    place_id, name, clean_name, category, country, city, address, maps_url,
    phone, email, website, instagram_url, facebook_url, rating, review_count,
    contactability_score, lead_priority, status_email, email_sent_count,
    last_contacted_at, ai_generated_subject, ai_generated_pitch, scraped_at
) VALUES (
    '{place_id}', '{raw_name}', '{c_name}', '{cat}', 'Singapore', 'Singapore', '{addr}', {maps_sql},
    {phone_sql}, {email_sql}, {web_sql}, {insta_sql}, {fb_sql}, {rating}, {reviews},
    {score}, '{prio}', 'pending', 0,
    NULL, NULL, NULL, '{now_iso}'
) ON CONFLICT (place_id) DO UPDATE SET
    email = EXCLUDED.email,
    phone = EXCLUDED.phone,
    website = EXCLUDED.website,
    status_email = 'pending',
    email_sent_count = 0,
    updated_at = NOW();
"""
    sql_lines.append(sql_insert_lead)

with open(out_path, "w", encoding="utf-8") as f:
    f.write("\n".join(sql_lines))

print(f"Generated clean pending leads SQL seed file with {len(df)} leads at: {out_path}")
