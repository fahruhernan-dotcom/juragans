-- ==============================================================================
-- GOPEK / SEMBAKO OS - FULL RETUR, REFUND & FINANCIAL AUDIT DATABASE MIGRATION SCRIPT
-- Script ini memperbarui skema database Supabase agar mendukung pencatatan retur,
-- saldo deposit toko / overpay, pengembalian uang (refund), dan audit laba bersih.
-- 
-- Cara Eksekusi:
-- 1. Buka Supabase Dashboard -> SQL Editor
-- 2. Paste seluruh isi script ini
-- 3. Klik tombol "Run"
-- ==============================================================================

-- 1. PASTIKAN EXTENSION UUID TERSEDIA
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- 2. TAMBAHKAN KOLOM AUDIT FINANSIAL PADA TABEL sembako_sales (JIKA BELUM ADA)
ALTER TABLE sembako_sales ADD COLUMN IF NOT EXISTS subtotal NUMERIC(15,2) DEFAULT 0;
ALTER TABLE sembako_sales ADD COLUMN IF NOT EXISTS total_cogs NUMERIC(15,2) DEFAULT 0;
ALTER TABLE sembako_sales ADD COLUMN IF NOT EXISTS delivery_cost NUMERIC(15,2) DEFAULT 0;
ALTER TABLE sembako_sales ADD COLUMN IF NOT EXISTS other_cost NUMERIC(15,2) DEFAULT 0;
ALTER TABLE sembako_sales ADD COLUMN IF NOT EXISTS net_profit NUMERIC(15,2) DEFAULT 0;
ALTER TABLE sembako_sales ADD COLUMN IF NOT EXISTS overpay_amount NUMERIC(15,2) DEFAULT 0;
ALTER TABLE sembako_sales ADD COLUMN IF NOT EXISTS is_overpaid BOOLEAN DEFAULT false;

-- 3. PERBAIKI SCHEMA TABEL sembako_payments (PEMBAYARAN & REFUND DANA)
ALTER TABLE sembako_payments ADD COLUMN IF NOT EXISTS payment_method TEXT DEFAULT 'cash';
ALTER TABLE sembako_payments ADD COLUMN IF NOT EXISTS notes TEXT;
ALTER TABLE sembako_payments ADD COLUMN IF NOT EXISTS reference_number TEXT;
ALTER TABLE sembako_payments ADD COLUMN IF NOT EXISTS is_deleted BOOLEAN DEFAULT false;

-- 4. PERBAIKI SCHEMA TABEL sembako_returns (RETUR BARANG TOKO)
ALTER TABLE sembako_returns ADD COLUMN IF NOT EXISTS party_name TEXT DEFAULT '';
ALTER TABLE sembako_returns ADD COLUMN IF NOT EXISTS sale_id UUID;
ALTER TABLE sembako_returns ADD COLUMN IF NOT EXISTS customer_id UUID;
ALTER TABLE sembako_returns ADD COLUMN IF NOT EXISTS product_id UUID;
ALTER TABLE sembako_returns ADD COLUMN IF NOT EXISTS unit_price NUMERIC(15,2) DEFAULT 0;
ALTER TABLE sembako_returns ADD COLUMN IF NOT EXISTS total_amount NUMERIC(15,2) DEFAULT 0;
ALTER TABLE sembako_returns ADD COLUMN IF NOT EXISTS cogs_per_unit NUMERIC(15,2) DEFAULT 0;
ALTER TABLE sembako_returns ADD COLUMN IF NOT EXISTS is_deleted BOOLEAN DEFAULT false;

-- 5. TAMBAHKAN FOREIGN KEY RELATIONSHIP (SUPABASE REST EMBEDDING)
DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM pg_constraint WHERE conname = 'fk_sembako_returns_sale'
    ) THEN
        ALTER TABLE sembako_returns 
        ADD CONSTRAINT fk_sembako_returns_sale 
        FOREIGN KEY (sale_id) REFERENCES sembako_sales(id) ON DELETE SET NULL;
    END IF;
END $$;

-- 6. FUNCTION & TRIGGER: REKALKULASI OTOMATIS FINANSIAL PENJUALAN & REFUND
CREATE OR REPLACE FUNCTION fn_sync_sembako_sale_financials(p_sale_id UUID)
RETURNS VOID AS $$
DECLARE
    v_items_subtotal NUMERIC(15,2) := 0;
    v_returns_total NUMERIC(15,2) := 0;
    v_returns_cogs NUMERIC(15,2) := 0;
    v_raw_payments NUMERIC(15,2) := 0;
    v_refund_payments NUMERIC(15,2) := 0;
    v_delivery_cost NUMERIC(15,2) := 0;
    v_other_cost NUMERIC(15,2) := 0;
    v_total_cogs NUMERIC(15,2) := 0;
    
    v_net_sale_total NUMERIC(15,2) := 0;
    v_raw_paid NUMERIC(15,2) := 0;
    v_effective_paid NUMERIC(15,2) := 0;
    v_effective_cogs NUMERIC(15,2) := 0;
    v_gross_profit NUMERIC(15,2) := 0;
    v_net_profit NUMERIC(15,2) := 0;
    v_remaining NUMERIC(15,2) := 0;
    v_overpay NUMERIC(15,2) := 0;
    v_is_overpaid BOOLEAN := false;
    v_status TEXT := 'belum_lunas';
BEGIN
    IF p_sale_id IS NULL THEN RETURN; END IF;

    -- A. Hitung Subtotal Barang
    SELECT COALESCE(SUM(quantity * price_per_unit), 0)
    INTO v_items_subtotal
    FROM sembako_sale_items
    WHERE sale_id = p_sale_id;

    -- B. Hitung Total Retur & Retur COGS
    SELECT 
        COALESCE(SUM(total_amount), 0),
        COALESCE(SUM(quantity * COALESCE(cogs_per_unit, 0)), 0)
    INTO v_returns_total, v_returns_cogs
    FROM sembako_returns
    WHERE sale_id = p_sale_id AND is_deleted = false;

    -- C. Ambil Biaya Operasional & COGS Awal
    SELECT 
        COALESCE(delivery_cost, 0),
        COALESCE(other_cost, 0),
        COALESCE(total_cogs, 0)
    INTO v_delivery_cost, v_other_cost, v_total_cogs
    FROM sembako_sales
    WHERE id = p_sale_id;

    -- D. Hitung Pembayaran Diterima & Refund Dikembalikan
    SELECT 
        COALESCE(SUM(CASE WHEN amount > 0 THEN amount ELSE 0 END), 0),
        COALESCE(SUM(CASE WHEN amount < 0 OR payment_method = 'pengembalian_tunai_retur' THEN ABS(amount) ELSE 0 END), 0)
    INTO v_raw_payments, v_refund_payments
    FROM sembako_payments
    WHERE sale_id = p_sale_id AND is_deleted = false;

    -- E. Kalkulasi Net Finansial
    v_net_sale_total := GREATEST(0, v_items_subtotal - v_returns_total + v_other_cost);
    v_raw_paid := GREATEST(0, v_raw_payments - v_refund_payments);
    
    IF v_raw_paid > v_net_sale_total THEN
        v_is_overpaid := true;
        v_overpay := v_raw_paid - v_net_sale_total;
        v_effective_paid := v_net_sale_total;
        v_remaining := 0;
        v_status := 'lunas';
    ELSE
        v_is_overpaid := false;
        v_overpay := 0;
        v_effective_paid := v_raw_paid;
        v_remaining := v_net_sale_total - v_effective_paid;
        IF v_remaining <= 0 AND v_net_sale_total > 0 THEN
            v_status := 'lunas';
        ELSIF v_effective_paid > 0 THEN
            v_status := 'sebagian';
        ELSE
            v_status := 'belum_lunas';
        END IF;
    END IF;

    -- F. Hitung Laba Bersih (Net Profit)
    v_effective_cogs := GREATEST(0, v_total_cogs - v_returns_cogs);
    v_gross_profit := GREATEST(0, (v_items_subtotal - v_returns_total) - v_effective_cogs);
    v_net_profit := GREATEST(0, v_gross_profit - (v_delivery_cost + v_other_cost));

    -- G. Update Hasil Kalkulasi Presisi ke sembako_sales
    UPDATE sembako_sales
    SET 
        subtotal = v_items_subtotal,
        total_amount = v_net_sale_total,
        paid_amount = v_effective_paid,
        remaining_amount = v_remaining,
        overpay_amount = v_overpay,
        is_overpaid = v_is_overpaid,
        payment_status = v_status,
        net_profit = v_net_profit,
        updated_at = NOW()
    WHERE id = p_sale_id;
END;
$$ LANGUAGE plpgsql;

-- 7. VIEW RINGKASAN AUDIT FINANSIAL PENJUALAN & RETUR
CREATE OR REPLACE VIEW v_sembako_sale_financial_summary AS
SELECT 
    s.id AS sale_id,
    s.tenant_id,
    s.invoice_number,
    s.customer_id,
    c.customer_name,
    s.transaction_date,
    COALESCE(s.subtotal, s.total_amount, 0) AS initial_subtotal,
    COALESCE(r.total_return_amount, 0) AS total_return_amount,
    s.delivery_cost AS delivery_cost_seller_expense,
    s.other_cost,
    s.total_amount AS net_invoice_amount,
    COALESCE(p.raw_paid_amount, 0) AS raw_payments_received,
    COALESCE(p.refund_amount, 0) AS total_refund_returned,
    s.paid_amount AS net_paid_amount,
    s.remaining_amount AS remaining_debt,
    s.overpay_amount AS deposit_overpay_amount,
    s.is_overpaid,
    s.payment_status,
    s.total_cogs AS initial_cogs,
    COALESCE(r.total_return_cogs, 0) AS total_return_cogs,
    GREATEST(0, s.total_cogs - COALESCE(r.total_return_cogs, 0)) AS effective_cogs,
    s.net_profit AS net_profit_amount
FROM sembako_sales s
LEFT JOIN sembako_customers c ON c.id = s.customer_id
LEFT JOIN (
    SELECT 
        sale_id,
        SUM(total_amount) AS total_return_amount,
        SUM(quantity * COALESCE(cogs_per_unit, 0)) AS total_return_cogs
    FROM sembako_returns
    WHERE is_deleted = false AND sale_id IS NOT NULL
    GROUP BY sale_id
) r ON r.sale_id = s.id
LEFT JOIN (
    SELECT 
        sale_id,
        SUM(CASE WHEN amount > 0 THEN amount ELSE 0 END) AS raw_paid_amount,
        SUM(CASE WHEN amount < 0 OR payment_method = 'pengembalian_tunai_retur' THEN ABS(amount) ELSE 0 END) AS refund_amount
    FROM sembako_payments
    WHERE is_deleted = false AND sale_id IS NOT NULL
    GROUP BY sale_id
) p ON p.sale_id = s.id
WHERE s.is_deleted = false;

-- 8. INDEX UNTUK PERFORMA TINGGI AUDIT & QUERY
CREATE INDEX IF NOT EXISTS idx_sembako_returns_sale_id ON sembako_returns(sale_id) WHERE is_deleted = false;
CREATE INDEX IF NOT EXISTS idx_sembako_payments_sale_id ON sembako_payments(sale_id) WHERE is_deleted = false;
CREATE INDEX IF NOT EXISTS idx_sembako_sales_customer_id ON sembako_sales(customer_id) WHERE is_deleted = false;

-- 9. HAK AKSES RLS POLICIES (AUTHENTICATED USERS)
ALTER TABLE sembako_payments ENABLE ROW LEVEL SECURITY;
ALTER TABLE sembako_returns ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "All authenticated sembako_payments" ON sembako_payments;
CREATE POLICY "All authenticated sembako_payments" ON sembako_payments
    FOR ALL TO authenticated USING (true) WITH CHECK (true);

DROP POLICY IF EXISTS "All authenticated sembako_returns" ON sembako_returns;
CREATE POLICY "All authenticated sembako_returns" ON sembako_returns
    FOR ALL TO authenticated USING (true) WITH CHECK (true);

-- Selesai. Script Siap Digunakan!
