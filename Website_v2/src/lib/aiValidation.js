// =============================================================
// TernakOS — AI Pre-Commit Business Validation
// File: src/lib/aiValidation.js
// Called BEFORE any data enters production tables.
// This is SYSTEM logic, not AI logic.
// =============================================================

/**
 * Validate business rules for an AI-extracted entry before commit.
 * Includes Phase 6: Financial State & Snapshot Engine (Accumulated Validation).
 *
 * @param {object} entry - The pending entry with intent + extracted_data
 * @param {object[]} allEntries - All current pending entries for context
 * @param {object} contextSnapshot - Real-world data (accumulated totals from DB/Staging)
 * @returns {{ valid: boolean, errors: string[], warnings: string[] }}
 */
export function validateBusinessRules(entry, allEntries = [], contextSnapshot = {}) {
  const { intent, extracted_data: data, dependency_id, _ai_id } = entry
  const errors = []
  const warnings = []

  if (!intent) {
    errors.push('Intent tidak terdeteksi')
    return { valid: false, errors, warnings }
  }

  if (!data || typeof data !== 'object') {
    errors.push('Data ekstraksi kosong')
    return { valid: false, errors, warnings }
  }

  // ── Find Parent for Cross-Validation ──────────────────────
  const parent = allEntries.find(e => 
    (dependency_id && e.id === dependency_id) || 
    (data._dependency_ai_id && (e._ai_id === data._dependency_ai_id || e.id === data._dependency_ai_id))
  )
  const parentData = parent?.extracted_data

  // ── Intent-specific validators ────────────────────────────
  const validator = VALIDATORS[intent]
  if (validator) {
    validator(data, errors, warnings, parentData, contextSnapshot)
  }

  // ── Universal rules ───────────────────────────────────────
  validateCommonRules(data, errors, warnings)

  return {
    valid: errors.length === 0,
    errors,
    warnings,
  }
}

// ── Common rules applied to all intents ─────────────────────
function validateCommonRules(data, errors, warnings) {
  // Date sanity: no dates more than 30 days in the past or 7 in the future
  // HH:MM time fields are validated separately — do NOT run them through date parsing
  const dateFields = ['purchase_date', 'sale_date', 'payment_date', 'record_date',
    'harvest_date', 'expense_date', 'invoice_date', 'order_date', 'due_date']

  for (const field of dateFields) {
    if (data[field]) {
      const d = new Date(data[field])
      if (isNaN(d.getTime())) {
        errors.push(`Tanggal "${field}" tidak valid`)
        continue
      }
      const now = new Date()
      const diffDays = (now - d) / (1000 * 60 * 60 * 24)
      if (diffDays > 30) {
        warnings.push(`Tanggal "${field}" lebih dari 30 hari lalu — yakin?`)
      }
      if (diffDays < -7) {
        warnings.push(`Tanggal "${field}" lebih dari 7 hari ke depan — yakin?`)
      }
    }
  }
}

// ── Per-intent validators ───────────────────────────────────
const VALIDATORS = {
  CATAT_PEMBELIAN: (data, errors, warnings) => {
    if (!data.qty_ekor || data.qty_ekor <= 0) {
      if (data.total_weight_kg > 0) {
        warnings.push('Jumlah ekor kosong, akan diestimasi otomatis dari berat.')
      } else {
        errors.push('Jumlah ekor atau total berat harus diisi')
      }
    }
    if (data.qty_ekor > 50000) warnings.push('Jumlah ekor sangat besar (>50.000) — yakin?')
    if (!data.price_per_kg || data.price_per_kg <= 0) errors.push('Harga per kg harus > 0')
    if (data.price_per_kg < 5000) errors.push('Harga per kg terlalu rendah (< Rp 5.000)')
    if (data.price_per_kg > 100000) warnings.push('Harga per kg sangat mahal (> Rp 100.000) — yakin?')
    if (!data.purchase_date) warnings.push('Tanggal beli tidak diisi, akan default ke hari ini')
    
    // Cost sanity
    if (data.transport_cost > 5000000) warnings.push('Ongkos angkut mencurigakan (> 5 jt) — yakin?')
  },

  CATAT_PENJUALAN: (data, errors, warnings) => {
    if (!data.qty_ekor || data.qty_ekor <= 0) {
      if (data.weight_kg > 0) {
        warnings.push('Jumlah ekor kosong, akan diestimasi otomatis dari berat.')
      } else {
        errors.push('Jumlah ekor atau total berat harus diisi')
      }
    }
    if (data.qty_ekor > 50000) warnings.push('Jumlah ekor sangat besar (>50.000) — yakin?')
    if (!data.price_per_kg || data.price_per_kg <= 0) errors.push('Harga per kg harus > 0')
    if (data.price_per_kg < 5000) errors.push('Harga per kg terlalu rendah (< Rp 5.000)')
    if (data.price_per_kg > 100000) warnings.push('Harga per kg sangat mahal (> Rp 100.000) — yakin?')
    if (!data.sale_date) warnings.push('Tanggal jual tidak diisi, akan default ke hari ini')

    // Payment Logic
    if (data.payment_status === 'sebagian' && (!data.paid_amount || data.paid_amount <= 0)) {
       errors.push('Status bayar "Sebagian" wajib mencantumkan nominal yang sudah dibayar')
    }
    if (data.payment_status !== 'lunas' && !data.due_date) {
       warnings.push('Pilih tanggal jatuh tempo untuk transaksi hutang/piutang')
    }
  },

  CATAT_BAYAR: (data, errors, warnings, parentData, snapshot) => {
    if (!data.amount || data.amount <= 0) errors.push('Nominal pembayaran harus diisi (> 0)')
    if (data.amount < 10000) warnings.push('Nominal sangat kecil (< Rp 10.000). Yakin?')
    if (data.amount > 5000000000) errors.push('Nominal terlalu besar (> 5 miliar)')
    if (!data.payer_name && !data.payer_id) warnings.push('Nama pembayar belum diisi')
    if (!data.payment_method) warnings.push('Metode bayar belum dipilih (Default: Transfer)')

    // Phase 6: Accumulated Payment Check
    const parent = parentData || snapshot?.parentContext
    const accumulated = snapshot?.accumulatedTotal || 0

    if (parent) {
      const parentTotal = Number(parent.total_revenue || (parent.qty_ekor * parent.price_per_kg) || parent.amount || 0)
      const currentTotal = accumulated + Number(data.amount || 0)
      
      if (parentTotal > 0 && currentTotal > parentTotal * 1.01) { // 1% tolerance for rounding/fees
        errors.push(`Total bayar (Rp ${currentTotal.toLocaleString()}) melebihi total tagihan (Rp ${parentTotal.toLocaleString()})!`)
      } else if (parentTotal > 0 && currentTotal > parentTotal) {
        warnings.push(`Total bayar sedikit melebihi tagihan. Pastikan angka sudah benar.`)
      }
    }
  },

  CATAT_PENGIRIMAN: (data, errors, warnings, parentData, snapshot) => {
    if (data.initial_weight_kg && data.initial_weight_kg <= 0) errors.push('Berat awal harus > 0')
    if (data.arrived_weight_kg && data.initial_weight_kg) {
      if (data.arrived_weight_kg > data.initial_weight_kg) {
        warnings.push('Berat tiba > berat awal — susut negatif?')
      }
      const shrinkPct = ((data.initial_weight_kg - data.arrived_weight_kg) / data.initial_weight_kg) * 100
      if (shrinkPct > 10) warnings.push(`Susut ${shrinkPct.toFixed(1)}% — cukup tinggi`)
    }

    // Time Rule: load_time <= departure_time (HH:MM string comparison is safe for same-day)
    if (data.load_time && data.departure_time) {
      if (data.departure_time < data.load_time) {
        errors.push('Jam berangkat tidak boleh sebelum jam muat')
      }
    }

    // Phase 6: Accumulated Delivery Check
    const parent = parentData || snapshot?.parentContext
    const accumulated = snapshot?.accumulatedTotal || 0

    if (parent) {
      const parentQty = parent.quantity || parent.qty_ekor || 0
      const currentQty = accumulated + (data.qty_ekor || 0)

      // 1. Qty Ekor Check (Hard Block)
      if (parentQty > 0 && currentQty > parentQty) {
        errors.push(`Total kirim (${currentQty} ekor) melebihi jumlah beli/jual (${parentQty} ekor)!`)
      }
      
      // 2. Date Check: departure_time is HH:MM so we only compare if it's a full date
      // (skip this check for HH:MM-only values)
    }
  },

  CATAT_HARIAN: (data, errors, warnings) => {
    if (data.dead_count !== undefined && data.dead_count < 0) errors.push('Jumlah mati tidak boleh negatif')
    if (data.culled_count !== undefined && data.culled_count < 0) errors.push('Jumlah afkir tidak boleh negatif')
    if (data.dead_count > 500) warnings.push('Deplesi >500 ekor dalam sehari — yakin?')
    if (data.avg_weight_kg && (data.avg_weight_kg < 0.1 || data.avg_weight_kg > 10)) {
      warnings.push('Bobot rata-rata di luar range normal (0.1-10 kg)')
    }
  },

  CATAT_PAKAN: (data, errors, warnings) => {
    if (!data.qty_kg || data.qty_kg <= 0) errors.push('Jumlah pakan harus > 0')
    if (data.qty_kg > 50000) warnings.push('Jumlah pakan >50 ton — yakin?')
    if (data.price_per_kg && data.price_per_kg < 1000) warnings.push('Harga pakan < Rp 1.000/kg — yakin?')
  },

  CATAT_PANEN: (data, errors, warnings) => {
    if (!data.qty_ekor || data.qty_ekor <= 0) errors.push('Jumlah ekor panen harus > 0')
    if (!data.total_weight_kg || data.total_weight_kg <= 0) errors.push('Total berat panen harus > 0')
    if (data.qty_ekor && data.total_weight_kg) {
      const avgWeight = data.total_weight_kg / data.qty_ekor
      if (avgWeight < 0.5 || avgWeight > 5) {
        warnings.push(`Bobot rata-rata ${avgWeight.toFixed(2)} kg/ekor — di luar range normal`)
      }
    }
  },

  CATAT_PENGELUARAN: (data, errors, warnings) => {
    if (!data.amount || data.amount <= 0) errors.push('Nominal pengeluaran harus > 0')
    if (data.amount > 1000000000) warnings.push('Nominal >1 miliar — yakin ini benar?')
  },

  BUAT_INVOICE: (data, errors, _warnings) => {
    if (!data.customer_name && !data.customer_id) errors.push('Customer belum ditentukan')
    if (!data.items || !Array.isArray(data.items) || data.items.length === 0) {
      errors.push('Invoice harus punya minimal 1 item')
    } else {
      data.items.forEach((item, i) => {
        if (!item.qty || item.qty <= 0) errors.push(`Item ${i + 1}: qty harus > 0`)
        if (!item.price_per_unit || item.price_per_unit <= 0) errors.push(`Item ${i + 1}: harga harus > 0`)
      })
    }
  },

  CATAT_ORDER: (data, errors, _warnings) => {
    if (!data.qty_ekor || data.qty_ekor <= 0) errors.push('Jumlah order harus > 0')
  },

  TAMBAH_PRODUK: (data, errors, _warnings) => {
    if (!data.name) errors.push('Nama produk wajib diisi')
    if (!data.sell_price || data.sell_price <= 0) errors.push('Harga jual harus > 0')
  },
}
