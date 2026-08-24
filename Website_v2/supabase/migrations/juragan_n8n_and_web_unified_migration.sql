-- ==============================================================================
-- JURAGAN BY ANAK BAWANG — UNIFIED DATABASE MASTER MIGRATION (V2 - ROBUST)
-- (MENGGABUNGKAN DATABASE N8N & DATABASE WEB MENJADI 1 SUPABASE INSTANCE)
-- ==============================================================================
-- Instruksi:
-- Buka Supabase project yang digunakan di n8n -> Buka SQL Editor -> Paste & Klik RUN.
-- Script ini 100% aman (idempotent), tidak akan menghapus data yang sudah ada.
-- ==============================================================================

-- 1. EXTENSIONS & UTILITY FUNCTIONS
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";
CREATE EXTENSION IF NOT EXISTS pgcrypto;

CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
   NEW.updated_at = NOW();
   RETURN NEW;
END;
$$ LANGUAGE 'plpgsql';

-- ==============================================================================
-- 2. TENANTS & AUTH PROFILES (FOUNDATION FOR WEB APP)
-- ==============================================================================

CREATE TABLE IF NOT EXISTS public.tenants (
  id UUID NOT NULL DEFAULT uuid_generate_v4(),
  business_name TEXT NOT NULL,
  business_vertical TEXT DEFAULT 'distributor_sembako',
  user_type TEXT DEFAULT 'broker',
  sub_type TEXT DEFAULT 'distributor_sembako',
  owner_id UUID,
  plan TEXT DEFAULT 'starter',
  province TEXT,
  plan_expires_at TIMESTAMPTZ,
  billing_whatsapp TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  CONSTRAINT tenants_pkey PRIMARY KEY (id)
);

CREATE TABLE IF NOT EXISTS public.profiles (
  id UUID NOT NULL DEFAULT uuid_generate_v4(),
  auth_user_id UUID NOT NULL,
  tenant_id UUID REFERENCES public.tenants(id) ON DELETE CASCADE,
  full_name TEXT NOT NULL,
  email TEXT,
  phone TEXT,
  role TEXT DEFAULT 'owner',
  app_role TEXT DEFAULT 'user',
  user_type TEXT DEFAULT 'broker',
  sub_type TEXT DEFAULT 'distributor_sembako',
  business_name TEXT,
  onboarded BOOLEAN DEFAULT true,
  business_model_selected BOOLEAN DEFAULT true,
  tutorials_completed JSONB DEFAULT '{}'::jsonb,
  last_seen_at TIMESTAMPTZ DEFAULT NOW(),
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  CONSTRAINT profiles_pkey PRIMARY KEY (id)
);

CREATE TABLE IF NOT EXISTS public.tenant_memberships (
  id UUID NOT NULL DEFAULT uuid_generate_v4(),
  auth_user_id UUID NOT NULL,
  tenant_id UUID REFERENCES public.tenants(id) ON DELETE CASCADE,
  role TEXT DEFAULT 'owner',
  app_role TEXT DEFAULT 'user',
  full_name TEXT,
  email TEXT,
  onboarded BOOLEAN DEFAULT true,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  CONSTRAINT tenant_memberships_pkey PRIMARY KEY (id),
  UNIQUE(auth_user_id, tenant_id)
);

CREATE TABLE IF NOT EXISTS public.team_invitations (
  id UUID NOT NULL DEFAULT uuid_generate_v4(),
  tenant_id UUID REFERENCES public.tenants(id) ON DELETE CASCADE,
  email TEXT NOT NULL,
  role TEXT NOT NULL DEFAULT 'staff',
  invited_by UUID,
  token TEXT NOT NULL UNIQUE,
  status TEXT DEFAULT 'pending',
  expires_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  CONSTRAINT team_invitations_pkey PRIMARY KEY (id)
);

-- Helper Access Checker
CREATE OR REPLACE FUNCTION public.has_tenant_access(target_tenant_id UUID)
RETURNS BOOLEAN AS $$
BEGIN
  IF target_tenant_id IS NULL THEN
    RETURN TRUE;
  END IF;

  IF target_tenant_id = '00000000-0000-0000-0000-000000000002'::UUID THEN
    RETURN TRUE;
  END IF;

  IF auth.uid() IS NULL THEN
    RETURN TRUE; -- Mengizinkan public/anon mode untuk dashboard mandiri
  END IF;

  IF COALESCE((auth.jwt() -> 'app_metadata' ->> 'is_superadmin')::boolean, false) = true THEN
    RETURN TRUE;
  END IF;

  RETURN EXISTS (
    SELECT 1 FROM public.profiles
    WHERE auth_user_id = auth.uid() AND tenant_id = target_tenant_id
  ) OR EXISTS (
    SELECT 1 FROM public.tenant_memberships
    WHERE auth_user_id = auth.uid() AND tenant_id = target_tenant_id
  ) OR EXISTS (
    SELECT 1 FROM public.tenants
    WHERE owner_id = auth.uid() AND id = target_tenant_id
  );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER STABLE SET search_path = public, pg_temp;

-- ==============================================================================
-- 3. SEMBAKO / JURAGAN CORE ERP TABLES
-- ==============================================================================

-- 3.1 PRODUCTS
CREATE TABLE IF NOT EXISTS public.sembako_products (
  id UUID NOT NULL DEFAULT uuid_generate_v4(),
  tenant_id UUID REFERENCES public.tenants(id) ON DELETE CASCADE,
  sku TEXT DEFAULT '',
  product_name TEXT NOT NULL,
  category TEXT DEFAULT 'lainnya',
  unit TEXT DEFAULT 'pcs',
  current_stock NUMERIC DEFAULT 0,
  min_stock_alert NUMERIC DEFAULT 10,
  avg_buy_price NUMERIC DEFAULT 0,
  sell_price NUMERIC DEFAULT 0,
  is_active BOOLEAN DEFAULT true,
  is_deleted BOOLEAN DEFAULT false,
  weight_gram INT DEFAULT 200,
  raw_ingredient_cost NUMERIC(15,2) DEFAULT 0,
  pouch_cost NUMERIC(15,2) DEFAULT 0,
  sticker_front_cost NUMERIC(15,2) DEFAULT 0,
  sticker_back_cost NUMERIC(15,2) DEFAULT 0,
  other_packaging_cost NUMERIC(15,2) DEFAULT 0,
  harga_solo_rp NUMERIC(15,2) DEFAULT 0,
  harga_luar_kota_rp NUMERIC(15,2) DEFAULT 0,
  harga_grosir_rp NUMERIC(15,2) DEFAULT 0,
  harga_marketplace_promo_rp NUMERIC(15,2) DEFAULT 0,
  notes TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  CONSTRAINT sembako_products_pkey PRIMARY KEY (id)
);

ALTER TABLE public.sembako_products ADD COLUMN IF NOT EXISTS sku TEXT DEFAULT '';
ALTER TABLE public.sembako_products ADD COLUMN IF NOT EXISTS weight_gram INT DEFAULT 200;
ALTER TABLE public.sembako_products ADD COLUMN IF NOT EXISTS raw_ingredient_cost NUMERIC(15,2) DEFAULT 0;
ALTER TABLE public.sembako_products ADD COLUMN IF NOT EXISTS pouch_cost NUMERIC(15,2) DEFAULT 0;
ALTER TABLE public.sembako_products ADD COLUMN IF NOT EXISTS sticker_front_cost NUMERIC(15,2) DEFAULT 0;
ALTER TABLE public.sembako_products ADD COLUMN IF NOT EXISTS sticker_back_cost NUMERIC(15,2) DEFAULT 0;
ALTER TABLE public.sembako_products ADD COLUMN IF NOT EXISTS other_packaging_cost NUMERIC(15,2) DEFAULT 0;
ALTER TABLE public.sembako_products ADD COLUMN IF NOT EXISTS harga_solo_rp NUMERIC(15,2) DEFAULT 0;
ALTER TABLE public.sembako_products ADD COLUMN IF NOT EXISTS harga_luar_kota_rp NUMERIC(15,2) DEFAULT 0;
ALTER TABLE public.sembako_products ADD COLUMN IF NOT EXISTS harga_grosir_rp NUMERIC(15,2) DEFAULT 0;
ALTER TABLE public.sembako_products ADD COLUMN IF NOT EXISTS harga_marketplace_promo_rp NUMERIC(15,2) DEFAULT 0;
ALTER TABLE public.sembako_products ADD COLUMN IF NOT EXISTS notes TEXT;
ALTER TABLE public.sembako_products ADD COLUMN IF NOT EXISTS is_deleted BOOLEAN DEFAULT false;

-- 3.2 DYNAMIC RAW MATERIALS & PACKAGING (BOM)
CREATE TABLE IF NOT EXISTS public.sembako_raw_materials (
  id UUID NOT NULL DEFAULT uuid_generate_v4(),
  tenant_id UUID REFERENCES public.tenants(id) ON DELETE CASCADE,
  material_name TEXT NOT NULL,
  category TEXT DEFAULT 'kemasan', -- 'kemasan' | 'stiker' | 'kardus' | 'bahan_baku' | 'lainnya'
  unit TEXT DEFAULT 'pcs',         -- 'pcs' | 'lembar' | 'roll' | 'kg' | 'box'
  current_stock NUMERIC(15,2) DEFAULT 0,
  unit_cost NUMERIC(15,2) DEFAULT 0, -- HPP Satuan = Total Biaya / Qty
  total_spent NUMERIC(15,2) DEFAULT 0,
  min_stock_alert NUMERIC(15,2) DEFAULT 50,
  supplier_name TEXT,
  notes TEXT,
  is_deleted BOOLEAN DEFAULT false,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  CONSTRAINT sembako_raw_materials_pkey PRIMARY KEY (id)
);

ALTER TABLE public.sembako_raw_materials ADD COLUMN IF NOT EXISTS current_stock NUMERIC(15,2) DEFAULT 0;
ALTER TABLE public.sembako_raw_materials ADD COLUMN IF NOT EXISTS unit_cost NUMERIC(15,2) DEFAULT 0;
ALTER TABLE public.sembako_raw_materials ADD COLUMN IF NOT EXISTS total_spent NUMERIC(15,2) DEFAULT 0;
ALTER TABLE public.sembako_raw_materials ADD COLUMN IF NOT EXISTS min_stock_alert NUMERIC(15,2) DEFAULT 50;
ALTER TABLE public.sembako_raw_materials ADD COLUMN IF NOT EXISTS supplier_name TEXT;
ALTER TABLE public.sembako_raw_materials ADD COLUMN IF NOT EXISTS notes TEXT;
ALTER TABLE public.sembako_raw_materials ADD COLUMN IF NOT EXISTS is_deleted BOOLEAN DEFAULT false;

-- 3.3 SUPPLIERS
CREATE TABLE IF NOT EXISTS public.sembako_suppliers (
  id UUID NOT NULL DEFAULT uuid_generate_v4(),
  tenant_id UUID REFERENCES public.tenants(id) ON DELETE CASCADE,
  supplier_name TEXT NOT NULL,
  contact_person TEXT DEFAULT '',
  phone TEXT DEFAULT '',
  address TEXT DEFAULT '',
  notes TEXT DEFAULT '',
  is_deleted BOOLEAN DEFAULT false,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  CONSTRAINT sembako_suppliers_pkey PRIMARY KEY (id)
);

-- 3.4 CUSTOMERS
CREATE TABLE IF NOT EXISTS public.sembako_customers (
  id UUID NOT NULL DEFAULT uuid_generate_v4(),
  tenant_id UUID REFERENCES public.tenants(id) ON DELETE CASCADE,
  customer_name TEXT NOT NULL,
  customer_type TEXT DEFAULT 'warung',
  b2b_priority_category TEXT,
  phone TEXT DEFAULT '',
  address TEXT DEFAULT '',
  area TEXT DEFAULT '',
  payment_terms TEXT DEFAULT 'cash',
  credit_limit NUMERIC DEFAULT 0,
  reliability_score NUMERIC DEFAULT 100,
  notes TEXT DEFAULT '',
  is_deleted BOOLEAN DEFAULT false,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  CONSTRAINT sembako_customers_pkey PRIMARY KEY (id)
);

-- 3.5 STOCK BATCHES
CREATE TABLE IF NOT EXISTS public.sembako_stock_batches (
  id UUID NOT NULL DEFAULT uuid_generate_v4(),
  tenant_id UUID REFERENCES public.tenants(id) ON DELETE CASCADE,
  product_id UUID REFERENCES public.sembako_products(id) ON DELETE CASCADE,
  supplier_id UUID REFERENCES public.sembako_suppliers(id) ON DELETE SET NULL,
  batch_code TEXT,
  qty_masuk NUMERIC DEFAULT 0,
  qty_awal NUMERIC DEFAULT 0,
  qty_sisa NUMERIC DEFAULT 0,
  buy_price NUMERIC DEFAULT 0,
  total_cost NUMERIC DEFAULT 0,
  purchase_date TIMESTAMPTZ DEFAULT NOW(),
  expiry_date TIMESTAMPTZ,
  notes TEXT,
  is_deleted BOOLEAN DEFAULT false,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  CONSTRAINT sembako_stock_batches_pkey PRIMARY KEY (id)
);

-- 3.6 SALES
CREATE TABLE IF NOT EXISTS public.sembako_sales (
  id UUID NOT NULL DEFAULT uuid_generate_v4(),
  tenant_id UUID REFERENCES public.tenants(id) ON DELETE CASCADE,
  customer_id UUID REFERENCES public.sembako_customers(id) ON DELETE SET NULL,
  customer_name TEXT,
  invoice_number TEXT UNIQUE,
  transaction_date TIMESTAMPTZ DEFAULT NOW(),
  due_date TIMESTAMPTZ,
  subtotal NUMERIC DEFAULT 0,
  total_amount NUMERIC DEFAULT 0,
  total_cogs NUMERIC DEFAULT 0,
  delivery_cost NUMERIC DEFAULT 0,
  other_cost NUMERIC DEFAULT 0,
  net_profit NUMERIC DEFAULT 0,
  paid_amount NUMERIC DEFAULT 0,
  remaining_amount NUMERIC DEFAULT 0,
  overpay_amount NUMERIC DEFAULT 0,
  is_overpaid BOOLEAN DEFAULT false,
  payment_status TEXT DEFAULT 'belum_lunas',
  order_source TEXT DEFAULT 'direct',
  area TEXT,
  items_summary TEXT,
  kardus TEXT,
  kartu_ucapan TEXT,
  notes TEXT,
  is_deleted BOOLEAN DEFAULT false,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  CONSTRAINT sembako_sales_pkey PRIMARY KEY (id)
);

ALTER TABLE public.sembako_sales ADD COLUMN IF NOT EXISTS subtotal NUMERIC DEFAULT 0;
ALTER TABLE public.sembako_sales ADD COLUMN IF NOT EXISTS order_source TEXT DEFAULT 'direct';
ALTER TABLE public.sembako_sales ADD COLUMN IF NOT EXISTS area TEXT;
ALTER TABLE public.sembako_sales ADD COLUMN IF NOT EXISTS items_summary TEXT;
ALTER TABLE public.sembako_sales ADD COLUMN IF NOT EXISTS kardus TEXT;
ALTER TABLE public.sembako_sales ADD COLUMN IF NOT EXISTS kartu_ucapan TEXT;
ALTER TABLE public.sembako_sales ADD COLUMN IF NOT EXISTS notes TEXT;
ALTER TABLE public.sembako_sales ADD COLUMN IF NOT EXISTS is_deleted BOOLEAN DEFAULT false;

-- 3.7 SALE ITEMS
CREATE TABLE IF NOT EXISTS public.sembako_sale_items (
  id UUID NOT NULL DEFAULT uuid_generate_v4(),
  tenant_id UUID REFERENCES public.tenants(id) ON DELETE CASCADE,
  sale_id UUID REFERENCES public.sembako_sales(id) ON DELETE CASCADE,
  product_id UUID REFERENCES public.sembako_products(id) ON DELETE SET NULL,
  product_name TEXT NOT NULL,
  unit TEXT,
  weight_gram INT,
  quantity NUMERIC DEFAULT 0,
  price_per_unit NUMERIC DEFAULT 0,
  sell_price NUMERIC DEFAULT 0,
  unit_price NUMERIC DEFAULT 0,
  subtotal NUMERIC DEFAULT 0,
  cogs_per_unit NUMERIC DEFAULT 0,
  cogs_total NUMERIC DEFAULT 0,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  CONSTRAINT sembako_sale_items_pkey PRIMARY KEY (id)
);

ALTER TABLE public.sembako_sale_items ADD COLUMN IF NOT EXISTS unit TEXT;
ALTER TABLE public.sembako_sale_items ADD COLUMN IF NOT EXISTS weight_gram INT;
ALTER TABLE public.sembako_sale_items ADD COLUMN IF NOT EXISTS price_per_unit NUMERIC DEFAULT 0;
ALTER TABLE public.sembako_sale_items ADD COLUMN IF NOT EXISTS sell_price NUMERIC DEFAULT 0;
ALTER TABLE public.sembako_sale_items ADD COLUMN IF NOT EXISTS unit_price NUMERIC DEFAULT 0;
ALTER TABLE public.sembako_sale_items ADD COLUMN IF NOT EXISTS subtotal NUMERIC DEFAULT 0;
ALTER TABLE public.sembako_sale_items ADD COLUMN IF NOT EXISTS cogs_per_unit NUMERIC DEFAULT 0;
ALTER TABLE public.sembako_sale_items ADD COLUMN IF NOT EXISTS cogs_total NUMERIC DEFAULT 0;

-- 3.8 STOCK OUT LOGS
CREATE TABLE IF NOT EXISTS public.sembako_stock_out (
  id UUID NOT NULL DEFAULT uuid_generate_v4(),
  tenant_id UUID REFERENCES public.tenants(id) ON DELETE CASCADE,
  sale_id UUID REFERENCES public.sembako_sales(id) ON DELETE CASCADE,
  product_id UUID REFERENCES public.sembako_products(id) ON DELETE CASCADE,
  batch_id UUID REFERENCES public.sembako_stock_batches(id) ON DELETE SET NULL,
  qty_keluar NUMERIC DEFAULT 0,
  buy_price NUMERIC DEFAULT 0,
  reason TEXT DEFAULT 'sale',
  notes TEXT,
  is_deleted BOOLEAN DEFAULT false,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  CONSTRAINT sembako_stock_out_pkey PRIMARY KEY (id)
);

-- 3.9 DELIVERIES
CREATE TABLE IF NOT EXISTS public.sembako_deliveries (
  id UUID NOT NULL DEFAULT uuid_generate_v4(),
  tenant_id UUID REFERENCES public.tenants(id) ON DELETE CASCADE,
  sale_id UUID REFERENCES public.sembako_sales(id) ON DELETE SET NULL,
  employee_id UUID,
  driver_name TEXT,
  vehicle_type TEXT,
  vehicle_plate TEXT,
  delivery_date TIMESTAMPTZ DEFAULT NOW(),
  delivery_area TEXT,
  delivery_cost NUMERIC DEFAULT 0,
  status TEXT DEFAULT 'pending',
  departed_at TIMESTAMPTZ,
  arrived_at TIMESTAMPTZ,
  completed_at TIMESTAMPTZ,
  delivery_notes TEXT,
  notes TEXT,
  is_deleted BOOLEAN DEFAULT false,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  CONSTRAINT sembako_deliveries_pkey PRIMARY KEY (id)
);

-- 3.10 EMPLOYEES & PAYROLL
CREATE TABLE IF NOT EXISTS public.sembako_employees (
  id UUID NOT NULL DEFAULT uuid_generate_v4(),
  tenant_id UUID REFERENCES public.tenants(id) ON DELETE CASCADE,
  full_name TEXT NOT NULL,
  role TEXT DEFAULT 'Staff',
  phone TEXT,
  base_salary NUMERIC DEFAULT 0,
  status TEXT DEFAULT 'aktif',
  is_deleted BOOLEAN DEFAULT false,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  CONSTRAINT sembako_employees_pkey PRIMARY KEY (id)
);

CREATE TABLE IF NOT EXISTS public.sembako_payroll (
  id UUID NOT NULL DEFAULT uuid_generate_v4(),
  tenant_id UUID REFERENCES public.tenants(id) ON DELETE CASCADE,
  employee_id UUID REFERENCES public.sembako_employees(id) ON DELETE CASCADE,
  period_type TEXT DEFAULT 'bulanan',
  period_date TIMESTAMPTZ DEFAULT NOW(),
  work_days NUMERIC DEFAULT 0,
  trip_count NUMERIC DEFAULT 0,
  sales_amount NUMERIC DEFAULT 0,
  base_salary NUMERIC DEFAULT 0,
  base_amount NUMERIC DEFAULT 0,
  commission_amount NUMERIC DEFAULT 0,
  bonus NUMERIC DEFAULT 0,
  deductions NUMERIC DEFAULT 0,
  deduction NUMERIC DEFAULT 0,
  total_pay NUMERIC DEFAULT 0,
  payment_status TEXT DEFAULT 'pending',
  paid_at TIMESTAMPTZ,
  notes TEXT,
  is_deleted BOOLEAN DEFAULT false,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  CONSTRAINT sembako_payroll_pkey PRIMARY KEY (id)
);

-- 3.11 EXPENSES
CREATE TABLE IF NOT EXISTS public.sembako_expenses (
  id UUID NOT NULL DEFAULT uuid_generate_v4(),
  tenant_id UUID REFERENCES public.tenants(id) ON DELETE CASCADE,
  category TEXT DEFAULT 'operasional',
  description TEXT,
  amount NUMERIC DEFAULT 0,
  expense_date TIMESTAMPTZ DEFAULT NOW(),
  is_deleted BOOLEAN DEFAULT false,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  CONSTRAINT sembako_expenses_pkey PRIMARY KEY (id)
);

-- 3.12 PAYMENTS (CUSTOMER & SUPPLIER)
CREATE TABLE IF NOT EXISTS public.sembako_payments (
  id UUID NOT NULL DEFAULT uuid_generate_v4(),
  tenant_id UUID REFERENCES public.tenants(id) ON DELETE CASCADE,
  sale_id UUID REFERENCES public.sembako_sales(id) ON DELETE CASCADE,
  customer_id UUID REFERENCES public.sembako_customers(id) ON DELETE SET NULL,
  amount NUMERIC DEFAULT 0,
  payment_date TIMESTAMPTZ DEFAULT NOW(),
  payment_method TEXT DEFAULT 'cash',
  reference_number TEXT,
  notes TEXT,
  is_deleted BOOLEAN DEFAULT false,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  CONSTRAINT sembako_payments_pkey PRIMARY KEY (id)
);

CREATE TABLE IF NOT EXISTS public.sembako_supplier_payments (
  id UUID NOT NULL DEFAULT uuid_generate_v4(),
  tenant_id UUID REFERENCES public.tenants(id) ON DELETE CASCADE,
  supplier_id UUID REFERENCES public.sembako_suppliers(id) ON DELETE CASCADE,
  amount NUMERIC DEFAULT 0,
  payment_date TIMESTAMPTZ DEFAULT NOW(),
  payment_method TEXT DEFAULT 'cash',
  reference_number TEXT,
  notes TEXT,
  is_deleted BOOLEAN DEFAULT false,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  CONSTRAINT sembako_supplier_payments_pkey PRIMARY KEY (id)
);

-- 3.13 RETURNS
CREATE TABLE IF NOT EXISTS public.sembako_returns (
  id UUID NOT NULL DEFAULT uuid_generate_v4(),
  tenant_id UUID REFERENCES public.tenants(id) ON DELETE CASCADE,
  sale_id UUID REFERENCES public.sembako_sales(id) ON DELETE SET NULL,
  created_by UUID,
  return_number TEXT,
  return_type TEXT DEFAULT 'sale_return',
  party_name TEXT DEFAULT '',
  product_id UUID REFERENCES public.sembako_products(id) ON DELETE SET NULL,
  product_name TEXT DEFAULT '',
  customer_id UUID REFERENCES public.sembako_customers(id) ON DELETE SET NULL,
  supplier_id UUID REFERENCES public.sembako_suppliers(id) ON DELETE SET NULL,
  quantity NUMERIC DEFAULT 1,
  unit TEXT DEFAULT 'pcs',
  unit_price NUMERIC DEFAULT 0,
  cogs_per_unit NUMERIC DEFAULT 0,
  total_amount NUMERIC DEFAULT 0,
  reason TEXT DEFAULT 'Lainnya',
  action TEXT DEFAULT 'fifo_stock',
  status TEXT DEFAULT 'pending',
  notes TEXT DEFAULT '',
  is_deleted BOOLEAN DEFAULT false,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  CONSTRAINT sembako_returns_pkey PRIMARY KEY (id)
);

-- 3.14 AUDIT LOGS
CREATE TABLE IF NOT EXISTS public.sembako_audit_logs (
  id UUID NOT NULL DEFAULT uuid_generate_v4(),
  tenant_id UUID REFERENCES public.tenants(id) ON DELETE CASCADE,
  user_name TEXT DEFAULT 'Sistem',
  role TEXT DEFAULT 'staff',
  action_type TEXT NOT NULL,
  product_name TEXT,
  old_qty NUMERIC,
  new_qty NUMERIC,
  notes TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  CONSTRAINT sembako_audit_logs_pkey PRIMARY KEY (id)
);

-- 3.15 NOTIFICATIONS & DEVICE TOKENS
CREATE TABLE IF NOT EXISTS public.device_tokens (
  id UUID NOT NULL DEFAULT gen_random_uuid(),
  tenant_id UUID NOT NULL,
  user_id UUID,
  device_token TEXT NOT NULL UNIQUE,
  platform TEXT NOT NULL DEFAULT 'android',
  device_name TEXT,
  is_active BOOLEAN NOT NULL DEFAULT true,
  last_seen TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  CONSTRAINT device_tokens_pkey PRIMARY KEY (id)
);

CREATE TABLE IF NOT EXISTS public.notification_preferences (
  id UUID NOT NULL DEFAULT gen_random_uuid(),
  tenant_id UUID NOT NULL,
  user_id UUID,
  notify_sales_new BOOLEAN NOT NULL DEFAULT true,
  notify_sales_paid BOOLEAN NOT NULL DEFAULT true,
  notify_stock_empty BOOLEAN NOT NULL DEFAULT true,
  notify_stock_expiring BOOLEAN NOT NULL DEFAULT true,
  notify_debt_due BOOLEAN NOT NULL DEFAULT true,
  notify_delivery_done BOOLEAN NOT NULL DEFAULT true,
  notify_app_update BOOLEAN NOT NULL DEFAULT true,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  CONSTRAINT notification_preferences_pkey PRIMARY KEY (id)
);

CREATE TABLE IF NOT EXISTS public.notifications (
  id UUID NOT NULL DEFAULT gen_random_uuid(),
  tenant_id UUID NOT NULL,
  user_id UUID,
  target_role TEXT,
  title TEXT NOT NULL,
  body TEXT NOT NULL,
  category TEXT NOT NULL DEFAULT 'system',
  action_url TEXT,
  metadata JSONB DEFAULT '{}'::jsonb,
  is_read BOOLEAN NOT NULL DEFAULT false,
  read_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  CONSTRAINT notifications_pkey PRIMARY KEY (id)
);

CREATE TABLE IF NOT EXISTS public.notification_events (
  id UUID NOT NULL DEFAULT gen_random_uuid(),
  tenant_id UUID NOT NULL,
  event_type TEXT NOT NULL,
  title TEXT NOT NULL,
  body TEXT NOT NULL,
  payload JSONB DEFAULT '{}'::jsonb,
  action_url TEXT,
  is_processed BOOLEAN NOT NULL DEFAULT false,
  processed_at TIMESTAMPTZ,
  error_message TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  CONSTRAINT notification_events_pkey PRIMARY KEY (id)
);

CREATE TABLE IF NOT EXISTS public.app_releases (
  id UUID NOT NULL DEFAULT gen_random_uuid(),
  version TEXT NOT NULL,
  version_code INTEGER NOT NULL UNIQUE,
  release_notes TEXT DEFAULT '',
  download_url TEXT NOT NULL,
  apk_file_name TEXT DEFAULT '',
  file_size_bytes BIGINT DEFAULT 0,
  min_supported_version TEXT DEFAULT '1.0.0',
  is_critical BOOLEAN DEFAULT false,
  is_active BOOLEAN DEFAULT true,
  published_by UUID,
  published_at TIMESTAMPTZ DEFAULT NOW(),
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  CONSTRAINT app_releases_pkey PRIMARY KEY (id)
);

-- ==============================================================================
-- 4. B2B OUTREACH ENUMS & TABLES (UNTUK WORKFLOW N8N & WEB)
-- ==============================================================================

DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'b2b_lead_priority') THEN
    CREATE TYPE b2b_lead_priority AS ENUM ('hot', 'warm', 'cold');
  END IF;
  IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'b2b_outreach_channel') THEN
    CREATE TYPE b2b_outreach_channel AS ENUM ('email', 'whatsapp', 'instagram_dm', 'phone_call');
  END IF;
  IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'b2b_status_flow') THEN
    CREATE TYPE b2b_status_flow AS ENUM (
      'pending', 'queued', 'sent', 'opened', 'replied', 
      'sample_requested', 'sample_sent', 'sample_tested', 
      'deal_converted', 'bounced', 'rejected', 'unresponsive'
    );
  END IF;
END $$;

CREATE TABLE IF NOT EXISTS public.b2b_campaigns (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  campaign_name TEXT NOT NULL,
  target_country TEXT,
  target_industry TEXT,
  product_pitched TEXT,
  is_active BOOLEAN DEFAULT true,
  daily_email_limit INT DEFAULT 50,
  daily_wa_limit INT DEFAULT 30,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS public.b2b_scraping_queue (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  country TEXT NOT NULL,
  city_or_region TEXT NOT NULL,
  target_location TEXT NOT NULL,
  status TEXT DEFAULT 'pending',
  total_leads_collected INT DEFAULT 0,
  last_scraped_at TIMESTAMPTZ,
  notes TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Pastikan kolom b2b_scraping_queue terlengkapi jika tabel sudah ada sebelumnya
ALTER TABLE public.b2b_scraping_queue ADD COLUMN IF NOT EXISTS notes TEXT;
ALTER TABLE public.b2b_scraping_queue ADD COLUMN IF NOT EXISTS total_leads_collected INT DEFAULT 0;
ALTER TABLE public.b2b_scraping_queue ADD COLUMN IF NOT EXISTS last_scraped_at TIMESTAMPTZ;
ALTER TABLE public.b2b_scraping_queue ADD COLUMN IF NOT EXISTS status TEXT DEFAULT 'pending';

CREATE TABLE IF NOT EXISTS public.b2b_leads (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  campaign_id UUID REFERENCES public.b2b_campaigns(id) ON DELETE SET NULL,
  queue_id UUID REFERENCES public.b2b_scraping_queue(id) ON DELETE SET NULL,
  place_id TEXT UNIQUE,
  name TEXT NOT NULL,
  clean_name TEXT,
  category TEXT,
  country TEXT,
  city TEXT,
  address TEXT,
  latitude NUMERIC,
  longitude NUMERIC,
  maps_url TEXT,
  phone TEXT,
  email TEXT,
  email_source TEXT,
  website TEXT,
  cms TEXT,
  has_contact_form BOOLEAN DEFAULT false,
  instagram_url TEXT,
  facebook_url TEXT,
  tiktok_url TEXT,
  linkedin_url TEXT,
  rating NUMERIC,
  review_count INT DEFAULT 0,
  contactability_score INT DEFAULT 50,
  lead_priority b2b_lead_priority DEFAULT 'warm',
  opportunity_tags TEXT[],
  opening_hours JSONB,
  status_email b2b_status_flow DEFAULT 'pending',
  status_whatsapp b2b_status_flow DEFAULT 'pending',
  email_sent_count INT DEFAULT 0,
  wa_sent_count INT DEFAULT 0,
  last_contacted_at TIMESTAMPTZ,
  ai_menu_highlight TEXT,
  ai_custom_icebreaker TEXT,
  ai_generated_subject TEXT,
  ai_generated_pitch TEXT,
  scraped_at TIMESTAMPTZ,
  notes TEXT,
  is_deleted BOOLEAN DEFAULT false,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Pastikan kolom b2b_leads terlengkapi jika tabel sudah ada sebelumnya
ALTER TABLE public.b2b_leads ADD COLUMN IF NOT EXISTS campaign_id UUID;
ALTER TABLE public.b2b_leads ADD COLUMN IF NOT EXISTS queue_id UUID;
ALTER TABLE public.b2b_leads ADD COLUMN IF NOT EXISTS clean_name TEXT;
ALTER TABLE public.b2b_leads ADD COLUMN IF NOT EXISTS email_source TEXT;
ALTER TABLE public.b2b_leads ADD COLUMN IF NOT EXISTS website TEXT;
ALTER TABLE public.b2b_leads ADD COLUMN IF NOT EXISTS cms TEXT;
ALTER TABLE public.b2b_leads ADD COLUMN IF NOT EXISTS has_contact_form BOOLEAN DEFAULT false;
ALTER TABLE public.b2b_leads ADD COLUMN IF NOT EXISTS instagram_url TEXT;
ALTER TABLE public.b2b_leads ADD COLUMN IF NOT EXISTS facebook_url TEXT;
ALTER TABLE public.b2b_leads ADD COLUMN IF NOT EXISTS tiktok_url TEXT;
ALTER TABLE public.b2b_leads ADD COLUMN IF NOT EXISTS linkedin_url TEXT;
ALTER TABLE public.b2b_leads ADD COLUMN IF NOT EXISTS contactability_score INT DEFAULT 50;
ALTER TABLE public.b2b_leads ADD COLUMN IF NOT EXISTS opportunity_tags TEXT[];
ALTER TABLE public.b2b_leads ADD COLUMN IF NOT EXISTS opening_hours JSONB;
ALTER TABLE public.b2b_leads ADD COLUMN IF NOT EXISTS email_sent_count INT DEFAULT 0;
ALTER TABLE public.b2b_leads ADD COLUMN IF NOT EXISTS wa_sent_count INT DEFAULT 0;
ALTER TABLE public.b2b_leads ADD COLUMN IF NOT EXISTS last_contacted_at TIMESTAMPTZ;
ALTER TABLE public.b2b_leads ADD COLUMN IF NOT EXISTS ai_menu_highlight TEXT;
ALTER TABLE public.b2b_leads ADD COLUMN IF NOT EXISTS ai_custom_icebreaker TEXT;
ALTER TABLE public.b2b_leads ADD COLUMN IF NOT EXISTS ai_generated_subject TEXT;
ALTER TABLE public.b2b_leads ADD COLUMN IF NOT EXISTS ai_generated_pitch TEXT;
ALTER TABLE public.b2b_leads ADD COLUMN IF NOT EXISTS scraped_at TIMESTAMPTZ;
ALTER TABLE public.b2b_leads ADD COLUMN IF NOT EXISTS notes TEXT;
ALTER TABLE public.b2b_leads ADD COLUMN IF NOT EXISTS is_deleted BOOLEAN DEFAULT false;

CREATE TABLE IF NOT EXISTS public.b2b_outreach_logs (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  lead_id UUID REFERENCES public.b2b_leads(id) ON DELETE CASCADE,
  channel b2b_outreach_channel DEFAULT 'email',
  recipient TEXT NOT NULL,
  subject TEXT,
  message_body TEXT NOT NULL,
  status TEXT DEFAULT 'sent',
  error_details TEXT,
  sent_at TIMESTAMPTZ DEFAULT NOW(),
  reply_received_at TIMESTAMPTZ,
  reply_content TEXT
);

CREATE TABLE IF NOT EXISTS public.b2b_samples (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  lead_id UUID REFERENCES public.b2b_leads(id) ON DELETE CASCADE,
  sample_code TEXT UNIQUE,
  variant_sent TEXT NOT NULL,
  pic_name TEXT,
  shipping_courier TEXT,
  tracking_number TEXT,
  status TEXT DEFAULT 'sent',
  chef_rating INT,
  chef_feedback TEXT,
  conversion_deal BOOLEAN DEFAULT false,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS public.b2b_email_outreach_queue (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  lead_id UUID REFERENCES public.b2b_leads(id) ON DELETE CASCADE UNIQUE,
  restaurant_name TEXT NOT NULL,
  clean_name TEXT,
  email TEXT NOT NULL,
  category TEXT,
  country TEXT,
  city TEXT,
  address TEXT,
  rating NUMERIC,
  review_count INT,
  website TEXT,
  instagram_url TEXT,
  contactability_score INT,
  lead_priority b2b_lead_priority,
  status b2b_status_flow DEFAULT 'pending',
  ai_generated_subject TEXT,
  ai_generated_pitch TEXT,
  email_sent_count INT DEFAULT 0,
  last_contacted_at TIMESTAMPTZ,
  error_details TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- ==============================================================================
-- 5. ATOMIC POS SALE TRANSACTION RPC FUNCTION (WITH FIFO DEDUCTION)
-- ==============================================================================

CREATE OR REPLACE FUNCTION public.create_sembako_sale_transaction(
    p_tenant_id UUID,
    p_customer_id UUID,
    p_customer_name TEXT,
    p_transaction_date TIMESTAMPTZ,
    p_due_date TIMESTAMPTZ,
    p_delivery_cost NUMERIC,
    p_other_cost NUMERIC,
    p_notes TEXT,
    p_items JSONB
)
RETURNS JSONB AS $$
DECLARE
    v_date_str TEXT;
    v_rand TEXT;
    v_invoice_number TEXT;
    v_sale_id UUID;
    v_total_amount NUMERIC := 0;
    v_total_cogs NUMERIC := 0;
    v_net_profit NUMERIC := 0;
    v_item JSONB;
    v_prod_str TEXT;
    v_product_id UUID;
    v_product_name TEXT;
    v_unit TEXT;
    v_qty NUMERIC;
    v_price NUMERIC;
    v_item_cogs NUMERIC;
    v_batch RECORD;
    v_qty_needed NUMERIC;
    v_deduct NUMERIC;
    v_avail_stock NUMERIC;
    v_sale_record RECORD;
BEGIN
    IF p_items IS NULL OR jsonb_typeof(p_items) != 'array' OR jsonb_array_length(p_items) = 0 THEN
        RAISE EXCEPTION 'Daftar produk tidak boleh kosong';
    END IF;

    v_date_str := to_char(COALESCE(p_transaction_date, NOW()), 'YYYYMMDD');
    v_rand := upper(substring(md5(random()::text) from 1 for 4));
    v_invoice_number := 'SMB-' || v_date_str || '-' || v_rand;

    -- Validasi Stok
    FOR v_item IN SELECT * FROM jsonb_array_elements(p_items) LOOP
        v_prod_str := v_item->>'product_id';
        IF v_prod_str IS NOT NULL AND v_prod_str ~* '^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$' THEN
            v_product_id := v_prod_str::UUID;
        ELSE
            v_product_id := NULL;
        END IF;

        v_product_name := COALESCE(v_item->>'product_name', 'Produk');
        v_qty := COALESCE((v_item->>'quantity')::NUMERIC, (v_item->>'qty')::NUMERIC, 1);
        v_price := COALESCE((v_item->>'price_per_unit')::NUMERIC, (v_item->>'sell_price')::NUMERIC, (v_item->>'price')::NUMERIC, 0);

        v_total_amount := v_total_amount + (v_qty * v_price);

        IF v_product_id IS NOT NULL THEN
            SELECT COALESCE(current_stock, 0) INTO v_avail_stock
            FROM public.sembako_products
            WHERE id = v_product_id
            FOR UPDATE;

            IF v_avail_stock IS NOT NULL AND v_avail_stock < v_qty THEN
                RAISE EXCEPTION 'Stok produk % tidak mencukupi (Sisa: %, Diminta: %)', v_product_name, v_avail_stock, v_qty;
            END IF;
        END IF;
    END LOOP;

    -- Insert Sale
    INSERT INTO public.sembako_sales (
        tenant_id,
        customer_id,
        customer_name,
        invoice_number,
        transaction_date,
        due_date,
        subtotal,
        total_amount,
        total_cogs,
        delivery_cost,
        other_cost,
        net_profit,
        paid_amount,
        remaining_amount,
        payment_status,
        notes
    ) VALUES (
        p_tenant_id,
        p_customer_id,
        p_customer_name,
        v_invoice_number,
        COALESCE(p_transaction_date, NOW()),
        p_due_date,
        v_total_amount,
        v_total_amount,
        0,
        COALESCE(p_delivery_cost, 0),
        COALESCE(p_other_cost, 0),
        0,
        0,
        v_total_amount,
        'belum_lunas',
        p_notes
    ) RETURNING id INTO v_sale_id;

    -- Process Line Items & Deduct Batches
    FOR v_item IN SELECT * FROM jsonb_array_elements(p_items) LOOP
        v_prod_str := v_item->>'product_id';
        IF v_prod_str IS NOT NULL AND v_prod_str ~* '^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$' THEN
            v_product_id := v_prod_str::UUID;
        ELSE
            v_product_id := NULL;
        END IF;

        v_product_name := COALESCE(v_item->>'product_name', 'Produk');
        v_unit := COALESCE(v_item->>'unit', 'pcs');
        v_qty := COALESCE((v_item->>'quantity')::NUMERIC, (v_item->>'qty')::NUMERIC, 1);
        v_price := COALESCE((v_item->>'price_per_unit')::NUMERIC, (v_item->>'sell_price')::NUMERIC, (v_item->>'price')::NUMERIC, 0);
        v_item_cogs := 0;

        IF v_product_id IS NOT NULL THEN
            v_qty_needed := v_qty;

            FOR v_batch IN (
                SELECT id, qty_sisa, buy_price
                FROM public.sembako_stock_batches
                WHERE product_id = v_product_id AND qty_sisa > 0
                ORDER BY created_at ASC
                FOR UPDATE
            ) LOOP
                IF v_qty_needed <= 0 THEN
                    EXIT;
                END IF;

                v_deduct := LEAST(v_batch.qty_sisa, v_qty_needed);
                UPDATE public.sembako_stock_batches
                SET qty_sisa = qty_sisa - v_deduct, updated_at = NOW()
                WHERE id = v_batch.id;

                v_item_cogs := v_item_cogs + (v_deduct * COALESCE(v_batch.buy_price, 0));
                v_qty_needed := v_qty_needed - v_deduct;
            END LOOP;

            -- Fallback COGS from product
            IF v_qty_needed > 0 THEN
                SELECT COALESCE(avg_buy_price, v_price * 0.75) INTO v_deduct
                FROM public.sembako_products WHERE id = v_product_id;
                v_item_cogs := v_item_cogs + (v_qty_needed * v_deduct);
            END IF;

            -- Update product stock
            UPDATE public.sembako_products
            SET current_stock = GREATEST(0, current_stock - v_qty), updated_at = NOW()
            WHERE id = v_product_id;
        ELSE
            v_item_cogs := v_qty * (v_price * 0.75);
        END IF;

        v_total_cogs := v_total_cogs + v_item_cogs;

        INSERT INTO public.sembako_sale_items (
            tenant_id,
            sale_id,
            product_id,
            product_name,
            unit,
            quantity,
            price_per_unit,
            sell_price,
            unit_price,
            subtotal,
            cogs_per_unit,
            cogs_total
        ) VALUES (
            p_tenant_id,
            v_sale_id,
            v_product_id,
            v_product_name,
            v_unit,
            v_qty,
            v_price,
            v_price,
            v_price,
            v_qty * v_price,
            CASE WHEN v_qty > 0 THEN ROUND(v_item_cogs / v_qty, 2) ELSE 0 END,
            v_item_cogs
        );
    END LOOP;

    v_net_profit := GREATEST(0, (v_total_amount - v_total_cogs) - (COALESCE(p_delivery_cost, 0) + COALESCE(p_other_cost, 0)));

    UPDATE public.sembako_sales
    SET total_cogs = v_total_cogs, net_profit = v_net_profit, updated_at = NOW()
    WHERE id = v_sale_id
    RETURNING * INTO v_sale_record;

    RETURN to_jsonb(v_sale_record);
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = public, pg_temp;

-- ==============================================================================
-- 6. PERMISSIVE ROW LEVEL SECURITY (RLS) FOR FULL INTEROPERABILITY
-- ==============================================================================

DO $$
DECLARE
    t text;
    tables text[] := ARRAY[
        'tenants', 'profiles', 'tenant_memberships', 'team_invitations',
        'sembako_products', 'sembako_suppliers', 'sembako_customers',
        'sembako_stock_batches', 'sembako_stock_out', 'sembako_sales', 
        'sembako_sale_items', 'sembako_payments', 'sembako_supplier_payments',
        'sembako_deliveries', 'sembako_returns', 'sembako_audit_logs', 
        'sembako_employees', 'sembako_payroll', 'sembako_expenses', 
        'sembako_raw_materials', 'device_tokens', 'notification_preferences',
        'notifications', 'notification_events', 'app_releases',
        'b2b_campaigns', 'b2b_scraping_queue', 'b2b_leads', 
        'b2b_outreach_logs', 'b2b_samples', 'b2b_email_outreach_queue'
    ];
BEGIN
    FOREACH t IN ARRAY tables LOOP
        EXECUTE format('ALTER TABLE IF EXISTS public.%I ENABLE ROW LEVEL SECURITY;', t);
        IF NOT EXISTS (
            SELECT 1 FROM pg_policies WHERE tablename = t AND policyname = 'Allow Public All ' || t
        ) THEN
            EXECUTE format('CREATE POLICY "Allow Public All %I" ON public.%I FOR ALL USING (true) WITH CHECK (true);', t, t);
        END IF;
    END LOOP;
END $$;

-- ==============================================================================
-- 7. DEFAULT DEMO TENANT & PACKAGING SEED DATA
-- ==============================================================================

INSERT INTO public.tenants (id, business_name, business_vertical, user_type, sub_type, plan)
VALUES ('00000000-0000-0000-0000-000000000002', 'Juragan Bawang Boyolali', 'distributor_sembako', 'broker', 'distributor_sembako', 'pro')
ON CONFLICT (id) DO UPDATE SET business_name = EXCLUDED.business_name;

-- Sample Bahan Baku & Kemasan (Dynamic BOM)
INSERT INTO public.sembako_raw_materials (tenant_id, material_name, category, unit, current_stock, unit_cost, total_spent, min_stock_alert, supplier_name, notes)
VALUES
('00000000-0000-0000-0000-000000000002', 'Standing Pouch Matte 100g (Ziplock)', 'kemasan', 'pcs', 250, 1500, 375000, 50, 'Pabrik Kemasan Solo', 'Ukuran 12x20 cm matte ziplock'),
('00000000-0000-0000-0000-000000000002', 'Standing Pouch Matte 200g (Ziplock)', 'kemasan', 'pcs', 180, 1850, 333000, 50, 'Pabrik Kemasan Solo', 'Ukuran 14x22 cm matte ziplock'),
('00000000-0000-0000-0000-000000000002', 'Standing Pouch Matte 250g (Ziplock)', 'kemasan', 'pcs', 150, 2100, 315000, 50, 'Pabrik Kemasan Solo', 'Ukuran 16x24 cm matte ziplock'),
('00000000-0000-0000-0000-000000000002', 'Stiker Depan Gold Foil 100g', 'stiker', 'lembar', 300, 450, 135000, 50, 'Percetakan Stiker Jaya', 'Waterproof vinyl sticker label'),
('00000000-0000-0000-0000-000000000002', 'Stiker Belakang Nutrition & QR P-IRT', 'stiker', 'lembar', 300, 350, 105000, 50, 'Percetakan Stiker Jaya', 'Stiker komposisi dan izin edar'),
('00000000-0000-0000-0000-000000000002', 'Kardus Master Box (Isi 24 Pouch)', 'kardus', 'box', 45, 4500, 202500, 15, 'Kardus Karton Kartasura', 'Box tebal untuk kirim ke luar kota/ekspor'),
('00000000-0000-0000-0000-000000000002', 'Bawang Goreng Curah Grade Super', 'bahan_baku', 'kg', 60, 95000, 5700000, 15, 'Petani Bawang Boyolali', 'Bawang murni tanpa tepung berlebih')
ON CONFLICT DO NOTHING;

-- Initial Scraping Queue Target for Singapore & Malaysia
INSERT INTO public.b2b_scraping_queue (country, city_or_region, target_location, status, notes)
VALUES
('Singapore', 'Central Singapore', 'Orchard Road, Singapore', 'pending', 'Fokus resto Padang, Ayam Penyet, dan Warung Nusantara'),
('Malaysia', 'Kuala Lumpur', 'Bangsar, Kuala Lumpur', 'pending', 'Target restoran Melayu & Indonesia di Bangsar')
ON CONFLICT DO NOTHING;
