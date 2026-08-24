-- ==============================================================================
-- MIGRATION: License System - Tambah kolom ke tabel tenants
-- Jalankan di Supabase Dashboard → SQL Editor
-- ==============================================================================

-- 1. Tambah kolom plan_expires_at (tanggal expired lisensi)
ALTER TABLE tenants
  ADD COLUMN IF NOT EXISTS plan_expires_at TIMESTAMPTZ DEFAULT NULL;

-- 2. Tambah kolom license_activated_at (tanggal aktivasi / perpanjangan terakhir)
ALTER TABLE tenants
  ADD COLUMN IF NOT EXISTS license_activated_at TIMESTAMPTZ DEFAULT NOW();

-- 3. Set nilai awal plan_expires_at untuk tenant yang sudah ada
--    (999 hari dari sekarang = mode dev/unlimited)
UPDATE tenants
SET 
  plan_expires_at = NOW() + INTERVAL '999 days',
  license_activated_at = NOW()
WHERE plan_expires_at IS NULL;

-- 4. Pastikan RLS tenants mengizinkan update dari authenticated user
--    (tambahkan policy jika belum ada)
ALTER TABLE tenants ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Allow authenticated update tenants" ON tenants;
CREATE POLICY "Allow authenticated update tenants"
  ON tenants FOR UPDATE
  TO authenticated
  USING (true)
  WITH CHECK (true);

DROP POLICY IF EXISTS "Allow authenticated read tenants" ON tenants;
CREATE POLICY "Allow authenticated read tenants"
  ON tenants FOR SELECT
  TO authenticated
  USING (true);

-- 5. Verifikasi
SELECT 
  id,
  business_name,
  plan_expires_at,
  license_activated_at
FROM tenants
LIMIT 5;
