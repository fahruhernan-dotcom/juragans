-- ==============================================================================
-- GOPEK / SEMBAKO OS - FIX SEMBAKO PAYROLL TABLE COLUMNS
-- Script ini memperbarui skema tabel sembako_payroll di Supabase agar sesuai
-- dengan kebutuhan data gaji pegawai di Frontend.
-- 
-- Cara Eksekusi:
-- 1. Buka Supabase Dashboard -> SQL Editor
-- 2. Paste seluruh isi script ini
-- 3. Klik tombol "Run"
-- ==============================================================================

-- 1. PERBAIKI SCHEMA TABEL sembako_payroll
ALTER TABLE IF EXISTS sembako_payroll
  ADD COLUMN IF NOT EXISTS period_type TEXT DEFAULT 'bulanan',
  ADD COLUMN IF NOT EXISTS work_days NUMERIC(5,2) DEFAULT 0,
  ADD COLUMN IF NOT EXISTS trip_count NUMERIC(5,2) DEFAULT 0,
  ADD COLUMN IF NOT EXISTS sales_amount NUMERIC(15,2) DEFAULT 0,
  ADD COLUMN IF NOT EXISTS base_amount NUMERIC(15,2) DEFAULT 0,
  ADD COLUMN IF NOT EXISTS commission_amount NUMERIC(15,2) DEFAULT 0,
  ADD COLUMN IF NOT EXISTS deduction NUMERIC(15,2) DEFAULT 0;

-- 2. REFRESH SCHEMA CACHE
NOTIFY pgrst, 'reload schema';
