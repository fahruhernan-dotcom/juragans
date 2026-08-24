// aiService.js — Pure functions for AI assistant logic (no React state/hooks)

export const GLM_API_URL = 'https://open.bigmodel.cn/api/paas/v4/chat/completions'

export const AGENT_STATE = {
  IDLE: 'IDLE',
  PRE_CHECKING: 'PRE_CHECKING',
  THINKING: 'THINKING',
  AWAITING_CONFIRMATION: 'AWAITING_CONFIRMATION',
  AWAITING_CLARIFICATION: 'AWAITING_CLARIFICATION',
  ERROR: 'ERROR',
}

// ponytail: In-memory intent cache (unbounded Map). Known ceiling: memory leak under long-running session without tab reload. Upgrade path: LRU cache or IndexedDB TTL.
export const intentCache = new Map()
let requestHistory = []

export const hashString = (str) => {
  let hash = 0
  for (let i = 0; i < str.length; i++) {
    hash = ((hash << 5) - hash) + str.charCodeAt(i)
    hash = hash & hash
  }
  return Math.abs(hash).toString(16)
}

// ponytail: Client-side sliding-window rate limit (20 req/min). Known ceiling: resets on page reload. Upgrade path: Redis/Supabase RPC rate limiter.
export const checkRateLimit = () => {
  const now = Date.now()
  requestHistory = requestHistory.filter(ts => now - ts < 60000)
  if (requestHistory.length >= 20) return false
  requestHistory.push(now)
  return true
}


export const fuzzyScore = (a, b) => {
  const norm = s => s.toLowerCase().replace(/\b(pak|bu|ibu|cv|ud|rpa|pt|toko|farm|kandang)\b/g, '').replace(/[^a-z0-9]/g, '').trim()
  const na = norm(a), nb = norm(b)
  if (!na || !nb) return 0
  if (na === nb) return 1.0
  if (na.includes(nb) || nb.includes(na)) return 0.85
  const shorter = na.length <= nb.length ? na : nb
  const longer = na.length <= nb.length ? nb : na
  let matches = 0
  const used = new Array(longer.length).fill(false)
  for (const ch of shorter) {
    const idx = longer.split('').findIndex((c, i) => c === ch && !used[i])
    if (idx !== -1) { matches++; used[idx] = true }
  }
  return matches / longer.length
}

export const INTENT_TABLE_MAP = {
  CATAT_PEMBELIAN: 'purchases', CATAT_PENJUALAN: 'sales', CATAT_BAYAR: 'payments',
  CATAT_PENGIRIMAN: 'deliveries', CATAT_HARIAN: 'daily_records', CATAT_PAKAN: 'feed_stocks',
  CATAT_PANEN: 'harvest_records', CATAT_PENGELUARAN: 'cycle_expenses',
  BUAT_INVOICE: 'rpa_invoices', CATAT_ORDER: 'orders', TAMBAH_PRODUK: 'rpa_products',
}

export const ENTITY_MAP = {
  CATAT_PEMBELIAN:   [{ nameField: 'supplier_name', idField: 'supplier_id', snapshotKey: 'suppliers' }],
  CATAT_PENJUALAN:   [{ nameField: 'rpa_name',      idField: 'rpa_id',      snapshotKey: 'rpas' }],
  CATAT_BAYAR:       [{ nameField: 'payer_name',    idField: 'payer_id',    snapshotKey: 'rpas' }],
  CATAT_PENGIRIMAN:  [],
  BUAT_INVOICE:      [{ nameField: 'customer_name', idField: 'customer_id', snapshotKey: 'customers' }],
  CATAT_ORDER:       [],
  TAMBAH_PRODUK:     [],
  CATAT_HARIAN:      [{ nameField: 'farm_name', idField: 'farm_id', snapshotKey: 'farms' }],
  CATAT_PAKAN:       [{ nameField: 'farm_name', idField: 'farm_id', snapshotKey: 'farms' }],
  CATAT_PANEN:       [{ nameField: 'farm_name', idField: 'farm_id', snapshotKey: 'farms' }],
  CATAT_PENGELUARAN: [{ nameField: 'farm_name', idField: 'farm_id', snapshotKey: 'farms' }],
}

export const UNDO_WINDOW_MS = 8000

export const parseAIResponse = (raw) => {
  let cleaned = (raw || '').trim()
  const match = cleaned.match(/(\{[\s\S]*\}|\[[\s\S]*\])/)
  if (match) cleaned = match[0]
  else cleaned = cleaned.replace(/```json/g, '').replace(/```/g, '').trim()
  try { return JSON.parse(cleaned) } catch (err) {
    console.error('[AI] JSON parse failed:', err)
    return { intent: 'TIDAK_DIKENALI', data: {}, confidence: 0, clarification: 'Gagal memproses respons.', display_summary: 'Error parsing.' }
  }
}

export const resolveEntities = (intent, extractedData, snapshot) => {
  const entityDefs = ENTITY_MAP[intent] ?? []
  const unresolved = []
  for (const { nameField, idField, snapshotKey } of entityDefs) {
    const extractedName = extractedData[nameField]
    if (extractedData[idField] || !extractedName) continue
    const pool = snapshot[snapshotKey] ?? []
    const candidates = pool
      .map(item => ({ id: item.id, name: item.name, score: fuzzyScore(extractedName, item.name) }))
      .filter(c => c.score >= 0.6).sort((a, b) => b.score - a.score).slice(0, 4)
    unresolved.push({ nameField, idField, extractedName, candidates })
  }
  return unresolved
}
