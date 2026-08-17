# 🧅 Automasi n8n B2B Outreach — Juragan by Anak Bawang

Pusat integrasi automasi end-to-end: **Scraping (Apify)** ➔ **Database Ingestion (Supabase)** ➔ **Memory-Driven AI Cold Outreach (Gmail & WhatsApp)** untuk penetrasi pasar restoran Indonesia di kawasan ASEAN (Singapura, Malaysia, Brunei, dst).

---

## 🗺️ Peta Berkas & Panduan Perencanaan

```text
Automasi_n8n/
├── 📜 01_WORKFLOW_APIFY_SCRAPER_PLAN.md          <-- [MD 1] Rencana Teknis Workflow 1 (Apify Scraper per 5 Hari)
├── 📜 02_WORKFLOW_AI_OUTREACH_MEMORY_PLAN.md     <-- [MD 2] Rencana Teknis Workflow 2 (Memory AI Outreach)
├── 📜 README.md                                  <-- Panduan operasional & kredensial
├── 📜 system_prompt_b2b_outreach.md              <-- Master Prompt AI (Boyolali Grade S & A, Halal Certified)
│
├── 📂 Workflows/                                 <-- [BLUEPRINT WORKFLOW N8N]
│   ├── 📄 01_apify_google_maps_scraper_supabase.json  <-- Workflow 1: Apify Scraper ➔ Supabase Upsert
│   ├── 📄 02_ai_cold_email_memory_outreach.json       <-- Workflow 2: Memory-Driven AI Cold Email Pitching
│   └── 📄 03_b2b_whatsapp_outreach.json               <-- Workflow 3: Direct WhatsApp Outreach (+65)
│
├── 📂 Database/                                  <-- [DATABASE & SCRIPT SEEDING]
│   ├── 🗄️ juragan_b2b_outreach_leads_schema.sql  <-- Skema SQL Standalone B2B Leads & Logs
│   └── 🐍 import_b2b_leads_to_supabase.py        <-- Script 1-Klik Seeding CSV ke Supabase
│
└── 📂 Datasets/                                  <-- [DATASET HASIL SCRAPING]
    ├── 📊 leads_singapore_fnb_enriched.csv       <-- 50 Data Resto SG Terverifikasi (Email, Phone, Rating)
    └── 📊 leads_singapore_google_places_raw.csv  <-- 455 Data Mentah Google Maps Scraper
```

---

## 🚀 Ringkasan Cara Kerja 2 Workflow Utama

### 🤖 Workflow 1: Apify Lead Scraper & Database Ingestion
* **Trigger:** Otomatis setiap 5 hari sekali (`0 2 */5 * *`).
* **Actor:** `berkaydev/google-maps-email-scraper-business-leads` (Akun `Fahru3`).
* **Target Multi-Country (ASEAN):** Menggunakan variabel dinamis string negara (Default: `Singapore`, siap diekspansi ke `Malaysia`, `Brunei`, dll).
* **Fungsi:** Mengambil data Google Maps, memperkaya kontak email/telepon/sosmed, membersihkan format nama resto, dan melakukan *UPSERT* ke tabel `b2b_leads` di Supabase.

### 🧠 Workflow 2: Memory-Driven AI Cold Outreach Engine
* **Trigger:** Otomatis setiap hari kerja (Senin–Jumat pukul `09:30 SGT`).
* **Target Filter:** Menarik 15 antrian lead dari Supabase yang **memiliki email** dan berstatus **`pending`**.
* **Memory & AI Agent:** Menyuntikkan profil restoran + riwayat log penawaran sebelumnya (*Interaction Memory*) ke prompt AI untuk membuat subjek & isi email yang 100% personal dan anti-repetisi.
* **Dispatcher:** Mengirim email via Gmail/SMTP, mengupdate status lead di Supabase menjadi `sent`, mencatat log di `b2b_outreach_logs`, dan menerapkan jeda acak 3–5 menit anti-spam.
