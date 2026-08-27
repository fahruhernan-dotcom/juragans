/**
 * planGating.js
 * Feature gating & plan limit definitions for
 * Juragans Dashboard (Pencatatan, Inventaris & Penjualan Bawang Goreng)
 */

export const FALLBACK_TRANSACTION_QUOTA = 100

// ─── Universal ERP & Sembako Plan Configuration ──────────────────────────────
export const SEMBAKO_BROKER_PLAN_CONFIG = {
  vertical: 'distributor_sembako',
  accentColor: '#0F172A',

  starter: {
    penjualan: { allowed: true, quotaPerMonth: null },
    penjualanPdf: true,
    tim: { allowed: true, maxMembers: null },
    pegawai: true,
    laporan: true,
    multiGudang: true,
  },
  pro: {
    penjualan: { allowed: true, quotaPerMonth: null },
    penjualanPdf: true,
    tim: { allowed: true, maxMembers: null },
    pegawai: true,
    laporan: true,
    multiGudang: true,
  },
  business: {
    penjualan: { allowed: true, quotaPerMonth: null },
    penjualanPdf: true,
    tim: { allowed: true, maxMembers: null },
    pegawai: true,
    laporan: true,
    multiGudang: true,
  },
}

export const UNIVERSAL_ERP_PLAN_CONFIG = SEMBAKO_BROKER_PLAN_CONFIG
export const POULTRY_BROKER_PLAN_CONFIG = SEMBAKO_BROKER_PLAN_CONFIG
export const RPA_PLAN_CONFIG = SEMBAKO_BROKER_PLAN_CONFIG
export const RPH_PLAN_CONFIG = SEMBAKO_BROKER_PLAN_CONFIG

// ─── AI Plan Config ───────────────────────────────────────────────────────────
export const AI_PLAN_CONFIG = {
  starter: {
    chat_sessions_per_month: 15,
    features: {
      chat_assistant:    true,
      drafting:          true,
      analisis_performa: false,
      prediksi_hasil:    false,
      ai_audit_logs:     false,
    },
  },
  pro: {
    chat_sessions_per_month: 500,
    features: {
      chat_assistant:    true,
      drafting:          true,
      analisis_performa: true,
      prediksi_hasil:    false,
      ai_audit_logs:     false,
    },
  },
  business: {
    chat_sessions_per_month: Infinity,
    features: {
      chat_assistant:    true,
      drafting:          true,
      analisis_performa: true,
      prediksi_hasil:    true,
      ai_audit_logs:     true,
    },
  },
}

export const PLAN_LABELS = {
  starter:  { name: 'Starter',  badge: null,    color: 'gray' },
  pro:      { name: 'Pro',      badge: 'PRO',   color: 'amber' },
  business: { name: 'Business', badge: 'BIZ',   color: 'emerald' },
}

export const UPGRADE_MESSAGES = {
  analisis_performa: 'Analisis performa bisnis, perputaran stok inventaris, dan margin laba tersedia di plan Pro.',
  prediksi_hasil:    'Prediksi tren omzet penjualan dan rekomendasi restock otomatis tersedia di plan Business.',
  ai_audit_logs:     'Riwayat audit aksi AI dan pencatatan staf lengkap tersedia di plan Business.',
  chat_exceeded:     'Kuota asisten AI bulan ini telah habis. Upgrade ke Pro untuk 500 sesi/bulan.',
}
