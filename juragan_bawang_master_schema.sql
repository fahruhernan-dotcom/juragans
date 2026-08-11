-- ==============================================================================
-- JURAGAN BY ANAK BAWANG — FULL MASTER DATABASE MIGRATION SCRIPT (VERSION 1.0)
-- Salin dan jalankan seluruh script ini di Supabase SQL Editor Project Baru Anda:
-- (Supabase Dashboard -> SQL Editor -> New Query -> Run)
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
-- 2. CREATE CORE TABLES
-- ==============================================================================

-- 2.1 JURAGAN PRODUCTS (SKU MASTER & PRICING)
CREATE TABLE IF NOT EXISTS juragan_products (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    sku TEXT UNIQUE NOT NULL,
    product_name TEXT NOT NULL,
    category TEXT DEFAULT 'Grade S Murni', -- 'Grade S Murni' | 'Grade A Crispy' | 'Horeca'
    unit TEXT DEFAULT 'pouch', -- 'pouch' | 'bal' | 'kg'
    weight_gram INT DEFAULT 200,
    hpp_per_unit NUMERIC(15,2) DEFAULT 0,
    harga_pusat_rp NUMERIC(15,2) DEFAULT 0,              -- Harga Resmi Jakarta & Semarang (Pusat)
    harga_solo_rp NUMERIC(15,2) DEFAULT 0,               -- Harga Resmi Solo Raya (Lokal)
    harga_marketplace_promo_rp NUMERIC(15,2) DEFAULT 0, -- Harga Promo TikTok Shop & Shopee
    harga_system_coret_rp NUMERIC(15,2) DEFAULT 0,      -- Harga System Coret Marketplace
    harga_grosir_offline_rp NUMERIC(15,2) DEFAULT 0,    -- Harga Grosir / Horeca Offline
    current_stock_pack INT DEFAULT 0,
    min_stock_alert INT DEFAULT 10,
    is_active BOOLEAN DEFAULT true,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- 2.2 JURAGAN SUPPLIERS (PABRIK BAWANG BOYOLALI)
CREATE TABLE IF NOT EXISTS juragan_suppliers (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    supplier_name TEXT NOT NULL DEFAULT 'Pabrik Bawang Merah Boyolali',
    contact_person TEXT DEFAULT 'Owner Pabrik',
    phone TEXT DEFAULT '0821-3385-9391',
    address TEXT DEFAULT 'Cepogo, Boyolali, Jawa Tengah',
    notes TEXT DEFAULT 'Suplier utama bawang merah Boyolali murni 100%',
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- 2.3 JURAGAN STOCK BATCHES (PENGAMBILAN STOK PABRIK)
CREATE TABLE IF NOT EXISTS juragan_stock_batches (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    batch_code TEXT UNIQUE NOT NULL,
    supplier_id UUID REFERENCES juragan_suppliers(id) ON DELETE SET NULL,
    variant_name TEXT NOT NULL, -- 'Grade S Murni' | 'Grade A Crispy'
    weight_kg NUMERIC(15,2) NOT NULL DEFAULT 0,
    remaining_weight_kg NUMERIC(15,2) NOT NULL DEFAULT 0,
    hpp_per_kg NUMERIC(15,2) NOT NULL DEFAULT 0,
    total_cost NUMERIC(15,2) NOT NULL DEFAULT 0,
    purchase_date TIMESTAMPTZ DEFAULT NOW(),
    payment_status TEXT DEFAULT 'pending', -- 'pending' | 'lunas'
    notes TEXT,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- 2.4 JURAGAN CUSTOMERS & B2B PROSPECTS
CREATE TABLE IF NOT EXISTS juragan_customers (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    customer_name TEXT NOT NULL,
    customer_category TEXT DEFAULT 'ritel', -- 'ritel' | 'rumah_tangga' | 'b2b_bakso' | 'horeca'
    b2b_priority_category TEXT, -- 'Kategori A (WA Direct)' | 'Kategori B (Telepon)' | 'Kategori C (Kanvas/Drop Sample)'
    phone TEXT DEFAULT '',
    address TEXT DEFAULT '',
    area TEXT DEFAULT 'Solo Raya', -- 'Surakarta' | 'Sukoharjo' | 'Semarang' | 'Jabodetabek'
    notes TEXT DEFAULT '',
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- 2.5 JURAGAN SALES & ORDERS
CREATE TABLE IF NOT EXISTS juragan_sales (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    invoice_number TEXT UNIQUE NOT NULL,
    customer_id UUID REFERENCES juragan_customers(id) ON DELETE SET NULL,
    customer_name TEXT NOT NULL,
    order_source TEXT DEFAULT 'whatsapp', -- 'whatsapp' | 'shopee' | 'tiktok' | 'offline_kanvas'
    transaction_date TIMESTAMPTZ DEFAULT NOW(),
    total_weight_kg NUMERIC(15,2) DEFAULT 0,
    total_amount NUMERIC(15,2) DEFAULT 0,
    total_hpp NUMERIC(15,2) DEFAULT 0,
    net_profit NUMERIC(15,2) DEFAULT 0,
    payment_status TEXT DEFAULT 'belum_lunas', -- 'lunas' | 'belum_lunas' | 'tbd'
    delivery_status TEXT DEFAULT 'pending', -- 'terkirim' | 'menunggu_pengiriman' | 'batal'
    shipping_address TEXT DEFAULT '',
    notes TEXT,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- 2.6 JURAGAN SALE ITEMS
CREATE TABLE IF NOT EXISTS juragan_sale_items (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    sale_id UUID REFERENCES juragan_sales(id) ON DELETE CASCADE,
    product_id UUID REFERENCES juragan_products(id) ON DELETE SET NULL,
    product_name TEXT NOT NULL,
    weight_gram INT DEFAULT 200,
    quantity INT DEFAULT 1,
    unit_price NUMERIC(15,2) DEFAULT 0,
    subtotal NUMERIC(15,2) DEFAULT 0,
    cogs_per_unit NUMERIC(15,2) DEFAULT 0,
    cogs_total NUMERIC(15,2) DEFAULT 0,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 2.7 JURAGAN BIAYA OPERASIONAL (EXPENSES)
CREATE TABLE IF NOT EXISTS juragan_expenses (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    category TEXT DEFAULT 'stiker', -- 'stiker' | 'packing' | 'bensin' | 'ekspedisi' | 'lainnya'
    description TEXT NOT NULL,
    amount NUMERIC(15,2) NOT NULL DEFAULT 0,
    paid_by TEXT DEFAULT 'Didi', -- 'Owner' | 'Didi' | 'Reyhan'
    expense_date TIMESTAMPTZ DEFAULT NOW(),
    notes TEXT,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 2.8 JURAGAN PAYROLL & SETORAN TIM
CREATE TABLE IF NOT EXISTS juragan_payroll (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    team_member TEXT NOT NULL, -- 'Didi' | 'Reyhan'
    transaction_type TEXT DEFAULT 'setoran', -- 'setoran' | 'klaim_stiker' | 'komisi' | 'gaji'
    amount NUMERIC(15,2) NOT NULL DEFAULT 0,
    period_date TIMESTAMPTZ DEFAULT NOW(),
    notes TEXT,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 2.9 JURAGAN AUDIT LOGS
CREATE TABLE IF NOT EXISTS juragan_audit_logs (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_name TEXT DEFAULT 'Owner',
    action_type TEXT NOT NULL,
    module TEXT DEFAULT 'Inventory',
    description TEXT,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 2.10 JURAGAN B2B PROSPECTS (27 RESTO BAKSO SOLO RAYA)
CREATE TABLE IF NOT EXISTS juragan_b2b_prospects (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    restaurant_name TEXT NOT NULL,
    area TEXT DEFAULT 'Surakarta',
    category TEXT NOT NULL, -- 'Kategori A (WA Direct)' | 'Kategori B (Telepon)' | 'Kategori C (Drop Sample/Kanvas)'
    phone TEXT DEFAULT '',
    rating TEXT DEFAULT '4.5',
    reviews TEXT DEFAULT '100+',
    status TEXT DEFAULT 'Siap Outreach',
    pitch_msg TEXT DEFAULT 'Email/WA Draf 1',
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 2.11 JURAGAN DOCUMENTS REGISTRY
CREATE TABLE IF NOT EXISTS juragan_documents (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    doc_number TEXT UNIQUE NOT NULL,
    title TEXT NOT NULL,
    category TEXT NOT NULL, -- 'legal' | 'invoice_customer' | 'invoice_pabrik' | 'pricing' | 'notulensi'
    category_label TEXT NOT NULL,
    party TEXT NOT NULL,
    doc_date DATE DEFAULT CURRENT_DATE,
    status TEXT NOT NULL,
    status_type TEXT DEFAULT 'info', -- 'success' | 'warning' | 'purple' | 'info'
    amount NUMERIC(15,2),
    file_path TEXT NOT NULL,
    details TEXT,
    tags TEXT[],
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- ==============================================================================
-- 3. ROW LEVEL SECURITY (RLS) POLICIES
-- ==============================================================================
ALTER TABLE juragan_products ENABLE ROW LEVEL SECURITY;
ALTER TABLE juragan_suppliers ENABLE ROW LEVEL SECURITY;
ALTER TABLE juragan_stock_batches ENABLE ROW LEVEL SECURITY;
ALTER TABLE juragan_customers ENABLE ROW LEVEL SECURITY;
ALTER TABLE juragan_sales ENABLE ROW LEVEL SECURITY;
ALTER TABLE juragan_sale_items ENABLE ROW LEVEL SECURITY;
ALTER TABLE juragan_expenses ENABLE ROW LEVEL SECURITY;
ALTER TABLE juragan_payroll ENABLE ROW LEVEL SECURITY;
ALTER TABLE juragan_audit_logs ENABLE ROW LEVEL SECURITY;
ALTER TABLE juragan_b2b_prospects ENABLE ROW LEVEL SECURITY;
ALTER TABLE juragan_documents ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Allow Public Access juragan_products" ON juragan_products;
CREATE POLICY "Allow Public Access juragan_products" ON juragan_products FOR ALL USING (true) WITH CHECK (true);

DROP POLICY IF EXISTS "Allow Public Access juragan_suppliers" ON juragan_suppliers;
CREATE POLICY "Allow Public Access juragan_suppliers" ON juragan_suppliers FOR ALL USING (true) WITH CHECK (true);

DROP POLICY IF EXISTS "Allow Public Access juragan_stock_batches" ON juragan_stock_batches;
CREATE POLICY "Allow Public Access juragan_stock_batches" ON juragan_stock_batches FOR ALL USING (true) WITH CHECK (true);

DROP POLICY IF EXISTS "Allow Public Access juragan_customers" ON juragan_customers;
CREATE POLICY "Allow Public Access juragan_customers" ON juragan_customers FOR ALL USING (true) WITH CHECK (true);

DROP POLICY IF EXISTS "Allow Public Access juragan_sales" ON juragan_sales;
CREATE POLICY "Allow Public Access juragan_sales" ON juragan_sales FOR ALL USING (true) WITH CHECK (true);

DROP POLICY IF EXISTS "Allow Public Access juragan_sale_items" ON juragan_sale_items;
CREATE POLICY "Allow Public Access juragan_sale_items" ON juragan_sale_items FOR ALL USING (true) WITH CHECK (true);

DROP POLICY IF EXISTS "Allow Public Access juragan_expenses" ON juragan_expenses;
CREATE POLICY "Allow Public Access juragan_expenses" ON juragan_expenses FOR ALL USING (true) WITH CHECK (true);

DROP POLICY IF EXISTS "Allow Public Access juragan_payroll" ON juragan_payroll;
CREATE POLICY "Allow Public Access juragan_payroll" ON juragan_payroll FOR ALL USING (true) WITH CHECK (true);

DROP POLICY IF EXISTS "Allow Public Access juragan_audit_logs" ON juragan_audit_logs;
CREATE POLICY "Allow Public Access juragan_audit_logs" ON juragan_audit_logs FOR ALL USING (true) WITH CHECK (true);

DROP POLICY IF EXISTS "Allow Public Access juragan_b2b_prospects" ON juragan_b2b_prospects;
CREATE POLICY "Allow Public Access juragan_b2b_prospects" ON juragan_b2b_prospects FOR ALL USING (true) WITH CHECK (true);

DROP POLICY IF EXISTS "Allow Public Access juragan_documents" ON juragan_documents;
CREATE POLICY "Allow Public Access juragan_documents" ON juragan_documents FOR ALL USING (true) WITH CHECK (true);

-- ==============================================================================
-- 4. SEED INITIAL DATA (JURAGAN BAWANG MASTER DATA)
-- ==============================================================================

-- 4.1 Master Products & SKUs
INSERT INTO juragan_products (sku, product_name, category, unit, weight_gram, hpp_per_unit, harga_pusat_rp, harga_solo_rp, harga_marketplace_promo_rp, harga_system_coret_rp, harga_grosir_offline_rp, current_stock_pack)
VALUES 
('JBM-100-TRIAL', 'Trial Pack Murni 100g', 'Grade S Murni', 'pouch', 100, 15400, 23500, 21600, 29900, 39900, 18000, 20),
('JBM-150', 'Murni Pouch 150g', 'Grade S Murni', 'pouch', 150, 21700, 26500, 26000, 42900, 59000, 25000, 15),
('JBM-200', 'Murni Pouch 200g', 'Grade S Murni', 'pouch', 200, 28200, 37500, 34500, 52900, 74900, 32000, 10),
('JBM-250', '[HERO SKU] Murni Pouch 250g', 'Grade S Murni', 'pouch', 250, 34700, 43500, 40000, 64900, 89500, 39500, 10),
('JBM-500', 'Murni Pouch 500g', 'Grade S Murni', 'pouch', 500, 66200, 80500, 76500, 109000, 145000, 74000, 5),
('JBM-1K', 'Murni Bal PE 1 Kg', 'Grade S Murni', 'bal', 1000, 127200, 165500, 152000, 179000, 239000, 135000, 2),
('JBM-PAKET2X250', '[PAKET HEMAT BUNDLING] Bawang Murni 250g isi 2 Pouch', 'Grade S Murni', 'pouch', 500, 69400, 87000, 80000, 129000, 179000, 79000, 10),
('JBM-COMBO150-250', '[PAKET COMBO RUMAHAN] Bawang Murni Paket 150g + 250g', 'Grade S Murni', 'pouch', 400, 56400, 70000, 64500, 105000, 148500, 64500, 10),
('JBM-PAKETGROSIR1KG', '[PAKET SUPER GROSIR] Bawang Murni 1 kg (2x 500g)', 'Grade S Murni', 'pouch', 1000, 132400, 161000, 148000, 215000, 289000, 148000, 5),
('JBM-HORECA-2KG', '[SUPLAI RESTORAN & KULINER] Bawang Murni 2 kg Bal PE', 'Grade S Murni', 'bal', 2000, 247200, 331000, 304000, 349000, 478000, 270000, 2),
('JBA-100-TRIAL', 'Trial Pack Grade A 100g', 'Grade A Crispy', 'pouch', 100, 13900, 20500, 18900, 24900, 34900, 15000, 20),
('JBA-150', 'Grade A Pouch 150g', 'Grade A Crispy', 'pouch', 150, 19450, 26500, 25000, 34900, 49900, 21000, 15),
('JBA-200', 'Grade A Pouch 200g', 'Grade A Crispy', 'pouch', 200, 25100, 31500, 31000, 42000, 59900, 26000, 10),
('JBA-250', '[HERO SKU] Grade A Pouch 250g', 'Grade A Crispy', 'pouch', 250, 30950, 37500, 35000, 49900, 69900, 32500, 10),
('JBA-500', 'Grade A Pouch 500g', 'Grade A Crispy', 'pouch', 500, 58700, 70500, 67500, 84900, 119000, 61000, 5),
('JBA-1K', 'Grade A Bal PE 1 Kg', 'Grade A Crispy', 'bal', 1000, 112200, 135500, 125000, 149000, 199000, 116000, 2),
('JBA-PAKET2X250', '[PAKET HEMAT BUNDLING] Bawang Grade A 250g isi 2 Pouch', 'Grade A Crispy', 'pouch', 500, 61900, 75000, 70000, 98900, 139900, 65000, 10),
('JBA-COMBO150-250', '[PAKET COMBO RUMAHAN] Bawang Grade A Paket 150g + 250g', 'Grade A Crispy', 'pouch', 400, 50400, 64000, 59000, 82900, 119800, 53500, 10),
('JBA-PAKETGROSIR1KG', '[PAKET SUPER GROSIR] Bawang Grade A 1 kg (2x 500g)', 'Grade A Crispy', 'pouch', 1000, 117400, 141000, 130000, 168000, 238000, 122000, 5),
('JBA-HORECA-2KG', '[SUPLAI RESTORAN & KULINER] Bawang Grade A 2 kg Bal PE', 'Grade A Crispy', 'bal', 2000, 217200, 271000, 250000, 289000, 399000, 232000, 2)
ON CONFLICT (sku) DO NOTHING;

-- 4.2 Master Supplier
INSERT INTO juragan_suppliers (id, supplier_name, contact_person, phone, address, notes)
VALUES (
    '11111111-1111-1111-1111-111111111111',
    'Pabrik Bawang Merah Boyolali',
    'Owner Pabrik',
    '0821-3385-9391',
    'Cepogo, Boyolali, Jawa Tengah',
    'Suplier utama varian Grade S Murni (Rp 120rb/kg) & Grade A (Rp 105rb/kg)'
) ON CONFLICT (id) DO NOTHING;

-- 4.3 Initial Stock Batches
INSERT INTO juragan_stock_batches (batch_code, supplier_id, variant_name, weight_kg, remaining_weight_kg, hpp_per_kg, total_cost, payment_status, notes)
VALUES 
('BATCH-202608-01', '11111111-1111-1111-1111-111111111111', 'Grade S Murni', 2.00, 1.75, 120000, 240000, 'lunas', 'Pengambilan awal 2 kg Grade S Murni (LUNAS Rp 240k dibayar Sdr. Fahru)'),
('BATCH-202608-02', '11111111-1111-1111-1111-111111111111', 'Grade A Crispy', 1.00, 1.00, 105000, 105000, 'lunas', 'Pengambilan awal 1 kg Grade A Crispy (LUNAS Rp 105k dibayar Sdr. Fahru)'),
('BATCH-202608-03', '11111111-1111-1111-1111-111111111111', 'Grade S Murni', 4.00, 4.00, 105000, 420000, 'pending', 'Pengambilan Batch 2: 4 kg Grade S Murni (Harga Beli Pabrik Rp 105k/kg)'),
('BATCH-202608-04', '11111111-1111-1111-1111-111111111111', 'Grade A Crispy', 3.00, 3.00, 105000, 315000, 'pending', 'Pengambilan Batch 2: 3 kg Grade A Crispy dari Pabrik Boyolali')
ON CONFLICT (batch_code) DO NOTHING;

-- 4.4 Operational Expenses & Payroll Records
INSERT INTO juragan_expenses (category, description, amount, paid_by, notes)
VALUES 
('stiker', 'Pengadaan Cetak Stiker Label Kemasan Pouch', 127000, 'Didi', 'Stiker kemasan pouch Sampurna Printshop'),
('kemasan', 'Pembelian Paket Kemasan Pouch Sdr. Fahru', 35675, 'Fahru', 'Faktur pembelian kemasan pouch Sdr. Fahru'),
('stok_pabrik', 'Pelunasan Tagihan Stok Pabrik Boyolali (Batch 1 - 3kg)', 345000, 'Fahru', 'Pelunasan piutang Batch 1 menggunakan uang pribadi Sdr. Fahru'),
('operasional', 'Pengeluaran Kas Operasional Tunai Didi', 20000, 'Didi', 'Pengeluaran kas operasional Didi')
ON CONFLICT DO NOTHING;

INSERT INTO juragan_payroll (team_member, transaction_type, amount, notes)
VALUES 
('Didi', 'setoran', 20000, 'Setoran tunai/transfer operasional dari Didi'),
('Didi', 'klaim_stiker', 127000, 'Klaim biaya stiker kemasan yang dibayarkan Didi'),
('Fahru', 'talangan_stok', 345000, 'Talangan dana pribadi pelunasan tagihan pabrik Batch 1 (3kg)'),
('Reyhan', 'komisi', 0, 'Komisi penjualan ritel Jabodetabek & Semarang')
ON CONFLICT DO NOTHING;

-- 4.5 Seed Sales Orders (Master Transaksi Agustus 2026)
INSERT INTO juragan_sales (invoice_number, customer_name, order_source, total_weight_kg, total_amount, total_hpp, net_profit, payment_status, delivery_status, notes)
VALUES 
('INV/2026/08/001', 'Adip', 'whatsapp', 0.25, 43500, 34700, 8800, 'lunas', 'terkirim', '1 pack Grade S Murni (250g) - Semarang Kost Bulusan'),
('INV/2026/08/002', 'Renny', 'whatsapp', 0.40, 75000, 54780, 20220, 'belum_lunas', 'menunggu_pengiriman', '2 pack Grade S Murni (200g @ Rp 37.500)'),
('INV/2026/08/003', 'Anggi', 'whatsapp', 1.00, 165500, 136950, 28550, 'belum_lunas', 'menunggu_pengiriman', '5 pack Grade S Murni (200g = 1kg Deal)'),
('INV/2026/08/004', 'Hendry', 'whatsapp', 0.80, 150000, 109560, 40440, 'belum_lunas', 'menunggu_pengiriman', '4 pack Grade S Murni (200g @ Rp 37.500)'),
('INV/2026/08/005', 'Amal', 'whatsapp', 0.50, 87000, 69400, 17600, 'belum_lunas', 'menunggu_pengiriman', '2 pack Grade S Murni (250g @ Rp 43.500)'),
('INV/2026/08/006', 'Widi', 'whatsapp', 0.60, 106000, 85560, 20440, 'belum_lunas', 'menunggu_pengiriman', '4 pack Grade S Murni (150g @ Rp 26.500)'),
('INV/2026/08/007', 'Bukit', 'whatsapp', 0.50, 87000, 69400, 17600, 'belum_lunas', 'menunggu_pengiriman', '2 pack Grade S Murni (250g @ Rp 43.500)'),
('INV/2026/08/008', 'Didi', 'whatsapp', 2.00, 271000, 214900, 56100, 'belum_lunas', 'menunggu_pengiriman', 'Grade A Crispy 100g (20 pack dipecah kemasan pouch saja, tanpa stiker)'),
('INV/2026/08/009', 'Ares', 'whatsapp', 0.25, 40000, 34700, 5300, 'belum_lunas', 'menunggu_pengiriman', '1 pack Grade S Murni (250g @ Rp 40.000 Solo Raya)'),
('INV/2026/08/010', 'Zaki', 'whatsapp', 0.10, 21600, 15400, 6200, 'belum_lunas', 'menunggu_pengiriman', '1 pack Grade S Murni (100g @ Rp 21.600 Solo Raya)'),
('INV/2026/08/011', 'Zaki', 'whatsapp', 0.10, 18900, 13900, 5000, 'belum_lunas', 'menunggu_pengiriman', '1 pack Grade A Crispy (100g @ Rp 18.900 Solo Raya)')
ON CONFLICT (invoice_number) DO NOTHING;

-- 4.6 Seed B2B Prospects (27 Resto Bakso Solo Raya)
INSERT INTO juragan_b2b_prospects (restaurant_name, area, category, phone, rating, reviews, status, pitch_msg)
VALUES 
('Bakso Remaja Solo', 'Surakarta', 'Kategori A (WA Direct)', '0812-3456-7891', '4.8', '1.200+', 'Siap WA Pitching', 'Email/WA Draf 1'),
('Bakso & Soto Kadipolo', 'Surakarta', 'Kategori A (WA Direct)', '0813-9876-5432', '4.7', '850+', 'Siap WA Pitching', 'Email/WA Draf 1'),
('Bakso Alex Solo', 'Surakarta', 'Kategori A (WA Direct)', '0811-2233-4455', '4.6', '950+', 'Siap WA Pitching', 'Email/WA Draf 1'),
('Bakso Titoti Sukoharjo', 'Sukoharjo', 'Kategori A (WA Direct)', '0815-6677-8899', '4.7', '1.500+', 'Siap WA Pitching', 'Email/WA Draf 1'),
('Bakso Kalilarangan', 'Surakarta', 'Kategori A (WA Direct)', '0818-1122-3344', '4.5', '420+', 'Siap WA Pitching', 'Email/WA Draf 1'),
('Bakso Urat Pak Noso', 'Sukoharjo', 'Kategori A (WA Direct)', '0857-4433-2211', '4.6', '310+', 'Siap WA Pitching', 'Email/WA Draf 1'),
('Bakso Solo Samrat Sub-area', 'Surakarta', 'Kategori A (WA Direct)', '0819-8877-6655', '4.8', '620+', 'Siap WA Pitching', 'Email/WA Draf 1'),
('Bakso Rusuk Palur', 'Surakarta/Karanganyar', 'Kategori A (WA Direct)', '0821-3344-5566', '4.6', '780+', 'Siap WA Pitching', 'Email/WA Draf 1'),
('Bakso Klewer Legendaris', 'Surakarta', 'Kategori A (WA Direct)', '0813-5566-7788', '4.5', '290+', 'Siap WA Pitching', 'Email/WA Draf 1'),
('Bakso Beranak Solo', 'Surakarta', 'Kategori A (WA Direct)', '0852-9900-1122', '4.4', '180+', 'Siap WA Pitching', 'Email/WA Draf 1'),
('Bakso & Mie Ayam Pak Tukiman', 'Sukoharjo', 'Kategori A (WA Direct)', '0812-7788-9900', '4.6', '240+', 'Siap WA Pitching', 'Email/WA Draf 1'),
('Bakso Uleg Bambu', 'Surakarta', 'Kategori A (WA Direct)', '0813-1122-3344', '4.5', '350+', 'Siap WA Pitching', 'Email/WA Draf 1'),
('Bakso & Soto Triwindu', 'Surakarta', 'Kategori A (WA Direct)', '0856-2233-4455', '4.7', '510+', 'Siap WA Pitching', 'Email/WA Draf 1'),
('Bakso Telur Manahan', 'Surakarta', 'Kategori A (WA Direct)', '0812-8899-0011', '4.6', '400+', 'Siap WA Pitching', 'Email/WA Draf 1'),
('Bakso Jumbo Kartasura', 'Sukoharjo', 'Kategori A (WA Direct)', '0818-7766-5544', '4.5', '330+', 'Siap WA Pitching', 'Email/WA Draf 1'),
('Bakso Resto Sumber Solo', 'Surakarta', 'Kategori B (Telepon Kantor)', '(0271) 712-345', '4.6', '650+', 'Follow Up Telp', 'Draf Telepon B2B'),
('Bakso Warung Gede Sukoharjo', 'Sukoharjo', 'Kategori B (Telepon Kantor)', '(0271) 591-888', '4.5', '480+', 'Follow Up Telp', 'Draf Telepon B2B'),
('Bakso Urat Kraton Solo', 'Surakarta', 'Kategori C (Drop Sample/Kanvas)', 'Kanvas Fisik', '4.7', '890+', 'Siap Drop Sample', 'Kunjungan Drop Sample 100g'),
('Bakso Pasar Gede NIK', 'Surakarta', 'Kategori C (Drop Sample/Kanvas)', 'Kanvas Fisik', '4.8', '1.100+', 'Siap Drop Sample', 'Kunjungan Drop Sample 100g'),
('Bakso Mas Kribo', 'Sukoharjo', 'Kategori C (Drop Sample/Kanvas)', 'Kanvas Fisik', '4.5', '220+', 'Siap Drop Sample', 'Kunjungan Drop Sample 100g'),
('Bakso Rudal Solo Baru', 'Sukoharjo', 'Kategori C (Drop Sample/Kanvas)', 'Kanvas Fisik', '4.6', '540+', 'Siap Drop Sample', 'Kunjungan Drop Sample 100g'),
('Bakso & Soto Mbok Giyem Solo', 'Surakarta', 'Kategori C (Drop Sample/Kanvas)', 'Kanvas Fisik', '4.7', '970+', 'Siap Drop Sample', 'Kunjungan Drop Sample 100g'),
('Bakso Urat Pak Kumis Baturono', 'Surakarta', 'Kategori C (Drop Sample/Kanvas)', 'Kanvas Fisik', '4.6', '380+', 'Siap Drop Sample', 'Kunjungan Drop Sample 100g'),
('Bakso Selo Merbabu Solo', 'Surakarta', 'Kategori C (Drop Sample/Kanvas)', 'Kanvas Fisik', '4.5', '290+', 'Siap Drop Sample', 'Kunjungan Drop Sample 100g'),
('Bakso Bang Joko Kartasura', 'Sukoharjo', 'Kategori C (Drop Sample/Kanvas)', 'Kanvas Fisik', '4.6', '410+', 'Siap Drop Sample', 'Kunjungan Drop Sample 100g'),
('Bakso Balungan Pajang', 'Surakarta', 'Kategori C (Drop Sample/Kanvas)', 'Kanvas Fisik', '4.5', '330+', 'Siap Drop Sample', 'Kunjungan Drop Sample 100g'),
('Bakso Mie Ayam Pak Wagiman', 'Sukoharjo', 'Kategori C (Drop Sample/Kanvas)', 'Kanvas Fisik', '4.4', '190+', 'Siap Drop Sample', 'Kunjungan Drop Sample 100g')
ON CONFLICT DO NOTHING;

-- 4.7 Seed Documents Registry
INSERT INTO juragan_documents (doc_number, title, category, category_label, party, doc_date, status, status_type, amount, file_path, details, tags)
VALUES 
('SPK/JAB/2026/08/001', 'Surat Perjanjian Kerja Sdr. Reyhan', 'legal', 'Legal & SPK Tim', 'Sdr. Reyhan (Marketing & Sales Specialist)', '2026-08-08', 'Kontrak Aktif', 'success', NULL, 'Dokumen_Legal/Surat_Perjanjian_Kerja_Reyhan.md', 'SPK Resmi Pemasaran Ritel (Jabodetabek & Semarang), B2B Outreach, Proteksi Suplier/HPP, Aset IP, Denda Rp 50 Juta, & Non-Compete Clause 5 Tahun.', ARRAY['SPK', 'Reyhan', 'Marketing', 'Non-Compete', 'NDA']),
('SPK/JAB/2026/08/002', 'Surat Perjanjian Kerja Sdr. Didi', 'legal', 'Legal & SPK Tim', 'Sdr. Didi (E-Commerce & Repackaging Specialist)', '2026-08-08', 'Kontrak Aktif', 'success', NULL, 'Dokumen_Legal/Surat_Perjanjian_Kerja_Didi.md', 'SPK Resmi Repackaging, Penimbangan Presisi, Stiker Sampurna, Penyerahan Nota/Kas Offline, Proteksi HPP, Aset IP, Denda Rp 50 Juta, & Non-Compete Clause 5 Tahun.', ARRAY['SPK', 'Didi', 'Repackaging', 'E-Commerce', 'Non-Compete']),
('JOB/OWNER/2026/08/001', 'Jobdesk & Portofolio Operasional Owner (Founder)', 'legal', 'Legal & SPK Tim', 'Owner / Founder (CEO & Lead System Architect)', '2026-08-08', 'Dokumen Master Owner', 'purple', NULL, 'Dokumen_Legal/Jobdesk_dan_Portofolio_Owner.md', 'Masterwork Portofolio 7 Sektor: Permodalan Awal, QRIS Resmi, Supabase Cloud, React Admin Dashboard, Bot Python IG/TikTok, Generator PDF, & Sistem Legalitas Usaha.', ARRAY['Owner', 'Founder', 'CEO', 'Master', 'Portofolio']),
('HALAL-ID33110018517710724', 'Sertifikat Halal Resmi Ernawati', 'legal', 'Legal & SPK Tim', 'BPJPH Kementerian Agama RI', '2024-07-24', 'Resmi Terbit (Kemenag)', 'success', NULL, 'Dokumen_Legal/Sertifikat Halal Ernawati.pdf', 'Sertifikasi Halal Resmi Produk Bawang Goreng Boyolali ID33110018517710724.', ARRAY['Halal', 'Kemenag', 'BPJPH', 'Sertifikat', 'Legalitas']),
('NIB-OSS-202607-001', 'Nomor Induk Berusaha (NIB Usaha)', 'legal', 'Legal & SPK Tim', 'Kementerian Investasi / BKPM OSS RI', '2026-07-15', 'Resmi Terbit (OSS)', 'success', NULL, 'Dokumen_Legal/NIB TERBIT ANAK BAWANG.pdf', 'Izin Usaha Operasional & Komersial Resmi Anak Bawang Boyolali.', ARRAY['NIB', 'OSS', 'BKPM', 'Perizinan', 'Izin Usaha']),
('INV/2026/08/001', 'Invoice Tagihan Pelanggan — Adip Semarang', 'invoice_customer', 'Invoice Pelanggan', 'Adip (Kost Bulusan, Tembalang, Semarang)', '2026-08-05', 'Lunas', 'success', 43500, 'Manajemen_Pesanan/invoices_pelanggan/invoice_adip_agustus_2026.pdf', '1 Pack Grade S Murni 250g @ Rp 43.500 (Terbayar Lunas - Terkirim).', ARRAY['Invoice', 'Adip', 'Semarang', 'Grade S', 'Lunas']),
('INV/PABRIK/2026/08/001', 'Invoice Tagihan Pabrik Boyolali — Batch 1 (3 kg)', 'invoice_pabrik', 'Invoice Pabrik & Ops', 'Pabrik Bawang Merah Boyolali (Cepogo)', '2026-08-01', 'Lunas Terbayar', 'success', 345000, 'Manajemen_Pesanan/invoice_tagihan_pabrik_3kg.pdf', 'Pengambilan 2 kg Grade S (Rp 240k) + 1 kg Grade A (Rp 105k) = Rp 345.000 (Lunas Dibayar Sdr. Fahru ✅).', ARRAY['Pabrik', 'Boyolali', 'Batch 1', 'Lunas']),
('INV/PABRIK/2026/08/002', 'Invoice Tagihan Pabrik Boyolali — Batch 2 (7 kg)', 'invoice_pabrik', 'Invoice Pabrik & Ops', 'Pabrik Bawang Merah Boyolali (Cepogo)', '2026-08-09', 'Pending Pabrik', 'info', 735000, 'Manajemen_Pesanan/invoice_tagihan_pabrik_batch2_7kg.pdf', 'Pengambilan Batch 2 sebanyak 7 kg (4 kg Grade S Murni @ Rp 105k + 3 kg Grade A Crispy TBD @ Rp 105k) = Rp 735.000.', ARRAY['Pabrik', 'Boyolali', 'Batch 2', '7 kg', 'Pending']),
('INV/OPS-DIDI/2026/08/001', 'Nota Operasional Didi — Stiker Sampurna & JNE', 'invoice_pabrik', 'Invoice Pabrik & Ops', 'Sampurna Printshop & JNE (Reimburse Didi)', '2026-08-02', 'Lunas Reimburse', 'success', 147500, 'Manajemen_Pesanan/invoice_operasional_didi_stiker.pdf', 'Cetak Stiker Sampurna Printshop No. 05498 (Rp 127.500) + Ongkir JNE (Rp 20.000) = Rp 147.500.', ARRAY['Operasional', 'Stiker', 'Sampurna', 'JNE', 'Reimburse']),
('INV/KMS-FAHRU/2026/08/001', 'Faktur Pembelian Kemasan Pouch — Sdr. Fahru', 'invoice_pabrik', 'Invoice Pabrik & Ops', 'Supplier Kemasan Pouch Sdr. Fahru', '2026-08-03', 'Lunas Fahru', 'success', 35675, 'Manajemen_Pesanan/invoice_pembelian_kemasan_fahru.pdf', 'Pembelian paket kantong standing pouch kemasan bawang = Rp 35.675.', ARRAY['Kemasan', 'Pouch', 'Fahru', 'Procurement', 'Owner'])
ON CONFLICT (doc_number) DO NOTHING;

-- 5. RELOAD SCHEMA CACHE
NOTIFY pgrst, 'reload schema';

SELECT 'Database Master Juragan by Anak Bawang Siap 100%! Seluruh tabel & data seed telah diselaraskan.' AS status;
