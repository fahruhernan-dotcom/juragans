-- ==============================================================================
-- JURAGAN BY ANAK BAWANG — MIGRATION V2: REALTIME & WAREHOUSE PACKING SYSTEM
-- Run this in Supabase SQL Editor: Dashboard -> SQL Editor -> New Query -> Run
-- ==============================================================================

-- 1. ADD MISSING COLUMNS TO juragan_sales
ALTER TABLE juragan_sales ADD COLUMN IF NOT EXISTS area TEXT DEFAULT 'Solo Raya';
ALTER TABLE juragan_sales ADD COLUMN IF NOT EXISTS items_summary TEXT;
ALTER TABLE juragan_sales ADD COLUMN IF NOT EXISTS kardus TEXT DEFAULT 'Ya';
ALTER TABLE juragan_sales ADD COLUMN IF NOT EXISTS kartu_ucapan TEXT DEFAULT 'Tidak';

-- 2. UPDATE EXISTING ORDERS AREA & ITEMS SUMMARY
UPDATE juragan_sales SET area = 'Semarang' WHERE customer_name ILIKE '%Adip%';
UPDATE juragan_sales SET area = 'Solo Raya' WHERE area IS NULL OR area = '';

-- 3. ENABLE SUPABASE REALTIME PUBLICATION
DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM pg_publication_tables 
        WHERE pubname = 'supabase_realtime' AND tablename = 'juragan_sales'
    ) THEN
        ALTER PUBLICATION supabase_realtime ADD TABLE juragan_sales;
    END IF;
    
    IF NOT EXISTS (
        SELECT 1 FROM pg_publication_tables 
        WHERE pubname = 'supabase_realtime' AND tablename = 'juragan_sale_items'
    ) THEN
        ALTER PUBLICATION supabase_realtime ADD TABLE juragan_sale_items;
    END IF;
END $$;

-- 4. CREATE OR REPLACE VIEW: v_rekap_packing_gudang
-- Groups by Tanggal Kirim, Area, Product Name, and Weight
CREATE OR REPLACE VIEW v_rekap_packing_gudang AS
SELECT 
    DATE(s.transaction_date) AS tanggal_kirim,
    COALESCE(s.area, 'Solo Raya') AS area,
    COALESCE(i.product_name, s.notes) AS nama_produk,
    COALESCE(i.weight_gram, 200) AS weight_gram,
    SUM(COALESCE(i.quantity, 1)) AS total_pack,
    COUNT(DISTINCT s.id) AS jumlah_pesanan
FROM juragan_sales s
LEFT JOIN juragan_sale_items i ON s.id = i.sale_id
WHERE s.delivery_status ILIKE '%menunggu%' OR s.delivery_status ILIKE '%pending%'
GROUP BY DATE(s.transaction_date), COALESCE(s.area, 'Solo Raya'), COALESCE(i.product_name, s.notes), COALESCE(i.weight_gram, 200);

-- Grant select access on view
GRANT SELECT ON v_rekap_packing_gudang TO anon, authenticated, service_role;

SELECT 'Migration V2 Completed Successfully!' AS status;
