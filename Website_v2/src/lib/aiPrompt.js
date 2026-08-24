// =============================================================
// TernakOS — AI Assistant System Prompt Builder
// Model: GLM-4.7-Flash (ZhipuAI)
// File: src/lib/aiPrompt.js
// =============================================================

// ── Intent catalog (internal, tidak di-export) ────────────────
const INTENT_CATALOG = [
  {
    name: 'CATAT_HARIAN',
    description: 'Mencatat data harian kandang: kematian, sakit, bobot rata-rata.',
    required_entities: ['farm_id', 'record_date'],
  },
  {
    name: 'CATAT_PAKAN',
    description: 'Mencatat pemakaian atau pembelian pakan untuk kandang.',
    required_entities: ['farm_id', 'feed_type', 'qty_kg', 'record_date'],
  },
  {
    name: 'CATAT_VAKSIN_OBAT',
    description: 'Mencatat pemberian vaksin atau obat ke ternak.',
    required_entities: ['farm_id', 'item_name', 'record_date'],
  },
  {
    name: 'CATAT_BELI_TERNAK',
    description: 'Mencatat pembelian bibit atau ternak baru ke kandang.',
    required_entities: ['farm_id', 'qty', 'price_per_head', 'purchase_date'],
  },
  {
    name: 'CATAT_JUAL_TERNAK',
    description: 'Mencatat penjualan atau panen ternak dari kandang.',
    required_entities: ['farm_id', 'qty', 'total_weight_kg', 'sale_date'],
  },
  {
    name: 'CATAT_PENGELUARAN',
    description: 'Mencatat pengeluaran operasional siklus kandang.',
    required_entities: ['farm_id', 'amount', 'category', 'expense_date'],
  },
  {
    name: 'TANYA_DATA',
    description: 'Menjawab pertanyaan user tentang data bisnis.',
    required_entities: ['query'],
  },
  {
    name: 'KOREKSI',
    description: 'Mengoreksi data yang baru saja dikirim.',
    required_entities: ['target_intent', 'target_id', 'field_to_correct', 'new_value'],
  },
  {
    name: 'TIDAK_DIKENALI',
    description: 'Pesan tidak relevan dengan operasi TernakOS.',
    required_entities: [],
  },
]

// ── Context snapshot — kompresi 3-tier, guard ≤6000 char ──────
function buildContextSnapshot(snapshot, userMessage = '') {
  const { farms = [], rpas = [], customers = [], suppliers = [], products = [] } = snapshot
  const msgLower = userMessage.toLowerCase()

  // Tier 1: ringkasan jumlah entitas
  const counts = [
    farms.length      ? `${farms.length} farm`     : '',
    rpas.length       ? `${rpas.length} RPA`        : '',
    customers.length  ? `${customers.length} cust`  : '',
    suppliers.length  ? `${suppliers.length} supp`  : '',
    products.length   ? `${products.length} produk` : '',
  ].filter(Boolean).join(', ')
  const tier1 = counts ? `[${counts}]` : '[belum ada entitas]'

  // Tier 2: compact ID map string
  const compactList = (arr, label, limit = Infinity) => {
    if (!arr.length) return ''
    const items = limit < Infinity ? arr.slice(0, limit) : arr
    const suffix = limit < Infinity && arr.length > limit ? ` ...(+${arr.length - limit})` : ''
    return `${label}: ${items.map(i => `${i.name}(id:${i.id})`).join(', ')}${suffix}`
  }
  const buildTier2 = (limit = Infinity) => [
    compactList(farms,     'Farms',     limit),
    compactList(rpas,      'RPAs',      limit),
    compactList(customers, 'Customers', limit),
    compactList(suppliers, 'Suppliers', limit),
    compactList(products,  'Produk',    limit),
  ].filter(Boolean).join('\n')

  // Tier 3: detail item yang namanya muncul di userMessage
  const allEntities = [
    ...farms.map(i => ({ ...i, _type: 'Farm' })),
    ...rpas.map(i => ({ ...i, _type: 'RPA' })),
    ...customers.map(i => ({ ...i, _type: 'Customer' })),
    ...suppliers.map(i => ({ ...i, _type: 'Supplier' })),
    ...products.map(i => ({ ...i, _type: 'Produk' })),
  ]
  const tier3 = allEntities
    .filter(i => i.name && msgLower.includes(i.name.toLowerCase()))
    .map(i => {
      const extra = i.sell_price ? `, harga:${i.sell_price}` : ''
      return `[Detail] ${i._type} "${i.name}" → id:${i.id}${extra}`
    })
    .join('\n')

  let tier2 = buildTier2()
  let result = [tier1, tier2, tier3].filter(Boolean).join('\n')

  if (result.length > 6000) {
    console.warn('[aiPrompt] buildContextSnapshot: snapshot melebihi 6000 char, Tier 2 dipangkas ke 10 item.')
    tier2 = buildTier2(10)
    result = [tier1, tier2, tier3].filter(Boolean).join('\n')
  }

  return result
}


/**
 * Membangun system prompt dinamis berdasarkan konteks user.
 * Dipanggil setiap kali conversation baru dimulai atau context berubah.
 *
 * @param {object} ctx
 * @param {string} ctx.userType         - 'broker' | 'peternak' | 'rpa'
 * @param {string} ctx.businessName     - Nama bisnis tenant
 * @param {string} ctx.userName         - Nama user yang sedang login
 * @param {string} ctx.contextPage      - Halaman aktif, e.g. '/broker/pembelian'
 * @param {object} ctx.snapshot         - Data ringkas untuk resolve nama
 * @param {Array}  ctx.snapshot.farms   - [{ id, name }] daftar farm/kandang
 * @param {Array}  ctx.snapshot.rpas    - [{ id, name }] daftar RPA langganan (broker)
 * @param {Array}  ctx.snapshot.customers - [{ id, name }] daftar customer
 * @param {Array}  ctx.snapshot.suppliers  - [{ id, name }] daftar supplier/peternak
 * @param {Array}  ctx.snapshot.products   - [{ id, name, sell_price }] produk RPA
 * @param {string} ctx.today            - Tanggal hari ini ISO, e.g. '2026-04-05'
 * @param {string} [ctx.vertical]       - Business vertical, e.g. 'sapi_penggemukan'
 * @param {string} [ctx.businessModel]  - Business model, e.g. 'penggemukan' | 'breeding'
 * @param {string} [ctx.userMessage]    - Pesan user untuk Tier 3 context injection
 */
export function buildSystemPrompt(ctx) {
  const {
    userType,
    businessName,
    userName,
    contextPage = '',
    snapshot = {},
    today,
    vertical = 'generic',
    businessModel: _businessModel = 'generic',
    userMessage = '',
  } = ctx

  const todayStr = today ?? new Date().toISOString().split('T')[0]

  // ── Role section ──────────────────────────────────────────
  const roleSection = {
    broker: buildBrokerSection(),
    peternak: buildPeternakSection(),
    rpa: buildRPASection(),
  }[userType] ?? ''

  // ── Vertical sub-prompt ───────────────────────────────────
  let verticalSection = ''
  if (vertical === 'sapi_penggemukan') {
    verticalSection = `
KONTEKS VERTICAL: Sapi Penggemukan
Pada CATAT_HARIAN, prioritaskan field: avg_weight_kg (bobot rata-rata sapi per ekor, kg)
dan dead_count (deplesi/kematian). Jika user menyebut bobot total tanpa rata-rata,
hitung avg_weight_kg = bobot_total / populasi_aktif. Tidak ada field reproduksi.`
  } else if (vertical === 'domba_penggemukan') {
    verticalSection = `
KONTEKS VERTICAL: Domba Penggemukan
Pada CATAT_HARIAN, prioritaskan field: avg_weight_kg (bobot rata-rata domba per ekor, kg)
dan dead_count (deplesi/kematian). Jika user menyebut bobot total tanpa rata-rata,
hitung avg_weight_kg = bobot_total / populasi_aktif. Tidak ada field reproduksi.`
  } else {
    if (vertical !== 'generic') {
      console.warn('[aiPrompt] vertical not in pilot: ' + vertical)
    }
  }

  // ── Context snapshot (compressed, ≤6000 char) ────────────
  const contextData = buildContextSnapshot(snapshot, userMessage)

  return `
Kamu adalah asisten pencatatan TernakOS untuk ${userName} (${businessName}, role: ${userType}).
Hari ini: ${todayStr}. Halaman: ${contextPage || 'dashboard'}.

TUGASMU: Ekstrak data dari pesan dan kembalikan JSON terstruktur.
Pengguna bicara bahasa Indonesia sehari-hari, tidak formal, sering singkat.
Cerdas mengisi yang bisa diinfer. Tanya jika ada data kritis yang ambigu.
Jika satu pesan mengandung lebih dari 1 transaksi, ekstrak SEMUA sebagai array intents[].
${verticalSection}
${roleSection}

DATA ENTITAS (gunakan untuk resolve nama ke ID):
${contextData || '(belum ada data entitas)'}

ATURAN TANGGAL:
- "tadi/barusan/mau" → ${todayStr}
- "kemarin/wingi" → ${offsetDate(todayStr, -1)}
- "2 hari lalu" → ${offsetDate(todayStr, -2)}
- "besok/sesuk" → ${offsetDate(todayStr, +1)}
- Tidak disebutkan → ${todayStr}

ATURAN ANGKA: "28rb"→28000, "1,5jt"→1500000, "1ton"→1000kg, "½kw"→50kg.

ATURAN KOREKSI: Jika intent KOREKSI dan target_id null,
set confidence: 0.4 dan clarification: [pertanyaan spesifik + maks 3 pilihan].

FORMAT OUTPUT — kembalikan HANYA JSON ini:
{"intents":[{"id":"1","intent":"<INTENT>","data":{...},"dependency":null,"confidence":0.95,"clarification":null}],"display_summary":"<balasan natural 1-2 kalimat, TANPA markdown>"}

CONFIDENCE: 0.9-1.0=lengkap, 0.7-0.89=ada inferensi, <0.7=wajib isi clarification.
TANYA_DATA: jika user bertanya (bukan mencatat), data={"query":"...","answer":"..."}.
TIDAK_DIKENALI: jika pesan tidak relevan sama sekali.
GAYA: DILARANG markdown bold/bullet di display_summary.
`.trim()
}


/**
 * Routes parsed AI intents based on confidence and clarification state.
 * @param {Array} parsedIntents - Array of intent objects from parsed AI response
 * @returns {Array} Array of routed results, same length as input
 */
export function routeByConfidence(parsedIntents) {
  return parsedIntents.map(intent => {
    if (intent.intent === 'TIDAK_DIKENALI') {
      return { action: 'FALLBACK', reason: 'Intent tidak dikenali' }
    }
    if (intent.confidence >= 0.85 && !intent.clarification) {
      return { action: 'STAGE', data: intent }
    }
    return { action: 'CLARIFY', question: intent.clarification }
  })
}


// =============================================================
// BROKER SECTION
// =============================================================
function buildBrokerSection() {
  return `
ROLE: BROKER AYAM — mencatat transaksi jual beli ayam hidup.

FORMAT HARGA KHUSUS BROKER:
- "20.00"/"23.00" dalam konteks harga → ×1.000 (20.00 = Rp 20.000). Harga ayam min Rp 10.000/kg.
- "20,5" → Rp 20.500. Angka 10–50 setelah kata "harga" → ribuan.
- "4t"→4000kg, "½kw"→50kg, "2,5kw"→250kg.

ATURAN PENGIRIMAN:
- Waktu muat & berangkat pakai format HH:MM (misal "14:30"), BUKAN datetime penuh.
- "Berangkat jam X" → departure_time=X, load_time=X minus 1 jam (atau sama jika tidak ada info muat).
- JANGAN taruh waktu di field notes.

DEPENDENCY: CATAT_PENGIRIMAN bergantung pada CATAT_PEMBELIAN/PENJUALAN (set dependency=id parent).


INTENT YANG DIKENALI:

1. CATAT_PEMBELIAN — user membeli ayam dari peternak/supplier
   PENTING: Di bisnis broker, Total Berat (kg) jauh LEBIH PENTING daripada jumlah ekor.
   DILARANG KERAS meminta klarifikasi soal "qty_ekor" jika "total_weight_kg" sudah diketahui.
   Jika "qty_ekor" tidak disebutkan, estimasi dari total_weight_kg / avg_weight_kg.
   Trigger: "beli", "ambil dari", "serap dari", "stok dari"
   Field data:
   {
     "supplier_name": "<nama kandang/supplier>",
     "supplier_id": "<uuid atau null>",
     "qty_ekor": <integer atau null>,
     "avg_weight_kg": <number, bobot rata-rata per ekor, default 1.85>,
     "total_weight_kg": <number atau null>,
     "price_per_kg": <integer, harga per kg>,
     "purchase_date": "<YYYY-MM-DD>",
     "notes": "<catatan tambahan atau null>"
   }

2. CATAT_PENJUALAN — user menjual ayam ke RPA/pembeli
   PENTING: Berat (kg) adalah prioritas. Jangan tanya ekor jika berat ada.
   Trigger: "jual", "kirim ke", "setor ke", "pasok ke"
   Field data:
   {
     "rpa_name": "<nama RPA/pembeli>",
     "rpa_id": "<uuid atau null>",
     "qty_ekor": <integer atau null>,
     "avg_weight_kg": <number, default 2.0>,
     "total_weight_kg": <number atau null>,
     "price_per_kg": <integer>,
     "payment_status": "<'lunas'|'belum_lunas'|'sebagian'>",
     "paid_amount": <integer, nominal yang dibayar/DP jika sebagian>,
     "due_date": "<YYYY-MM-DD, wajib jika payment_status != lunas>",
     "sale_date": "<YYYY-MM-DD>",
     "notes": "<atau null>"
   }

3. CATAT_BAYAR — mencatat pembayaran dari customer
   Trigger: "bayar", "transfer", "lunas", "cicil", "DP"
   Field data:
   {
     "payer_name": "<nama yang bayar>",
     "amount": <integer, nominal rupiah>,
     "payment_method": "<transfer|tunai|null>",
     "payment_date": "<YYYY-MM-DD>",
     "notes": "<nomor rekening / keterangan atau null>"
   }

4. CATAT_PENGIRIMAN — mencatat info pengiriman/armada
   Trigger: "kirim", "berangkat", "muat", "sopir", "truk", "armada"
   Field data:
   {
     "vehicle_plate": "<plat kendaraan atau null>",
     "vehicle_id": "<uuid atau null>",
     "driver_name": "<nama sopir atau null>",
     "driver_id": "<uuid atau null>",
     "load_time": "<HH:MM jam muat atau null>",
     "departure_time": "<HH:MM jam berangkat atau null>",
     "initial_weight_kg": <number, berat awal muatan atau null>,
     "delivery_cost": <integer, biaya pengiriman total atau 0>,
     "notes": "<rute, catatan atau null>"
   }

5. TANYA_DATA — pertanyaan tentang bisnis
   Contoh: "margin bulan ini berapa?", "siapa yang belum bayar?",
           "total pembelian minggu ini?", "pengiriman yang belum sampai ada berapa?"

6. KOREKSI — user mengoreksi data yang baru saja dikirim
   Trigger: "eh salah", "bukan", "koreksi", "maksudnya", "ralat",
            "harusnya", "maaf salah", "yang tadi salah"
   Field data:
   {
     "field_to_fix": "<nama field yang dikoreksi, e.g. 'price_per_kg'>",
     "old_value": "<nilai lama jika disebutkan, atau null>",
     "new_value": "<nilai baru yang benar>",
     "notes": "<konteks koreksi atau null>"
   }
   Contoh input: "eh salah tadi, harganya 29.500 bukan 29.000"
`
}


// =============================================================
// PETERNAK SECTION
// =============================================================
function buildPeternakSection() {
  return `
ROLE: PETERNAK
Kamu membantu mencatat data harian kandang, pakan, panen, dan pengeluaran siklus.

INTENT YANG DIKENALI:

1. CATAT_HARIAN — catatan harian kandang (mati, sakit, bobot)
   Trigger: "mati", "deplesi", "afkir", "timbang", "bobot rata"
   Field data:
   {
     "farm_name": "<nama kandang>",
     "farm_id": "<uuid atau null>",
     "record_date": "<YYYY-MM-DD>",
     "dead_count": <integer atau 0>,
     "culled_count": <integer atau 0>,
     "avg_weight_kg": <number atau null>,
     "notes": "<atau null>"
   }
   Contoh input: "hari ini mati 12 ekor di kandang A"
   Contoh input: "timbang kandang B bobot rata 1.8 kg"

2. CATAT_PAKAN — catat pemakaian atau pembelian pakan
   Trigger: "pakan", "voer", "konsentrat", "beli pakan", "pakai pakan"
   Field data:
   {
     "farm_name": "<nama kandang>",
     "farm_id": "<uuid atau null>",
     "feed_type": "<jenis pakan, e.g. 'BR1', 'konsentrat', atau string bebas>",
     "qty_kg": <number>,
     "price_per_kg": <integer atau null>,
     "record_date": "<YYYY-MM-DD>",
     "action": "<'beli'|'pakai'>",
     "notes": "<atau null>"
   }
   Contoh input: "beli pakan BR1 500kg harga 4ribu per kg"
   Contoh input: "kandang C pakai pakan 120kg hari ini"

3. CATAT_PANEN — catat hasil panen
   Trigger: "panen", "jual ayam", "panen habis", "close siklus"
   Field data:
   {
     "farm_name": "<nama kandang>",
     "farm_id": "<uuid atau null>",
     "harvest_date": "<YYYY-MM-DD>",
     "qty_ekor": <integer>,
     "total_weight_kg": <number>,
     "price_per_kg": <integer atau null>,
     "buyer_name": "<nama pembeli atau null>",
     "notes": "<atau null>"
   }
   Contoh input: "panen kandang A 4200 ekor total 8900 kg harga 31rb"

4. CATAT_PENGELUARAN — catat pengeluaran siklus
   Trigger: "beli", "bayar", "keluar uang", "biaya", "ongkos"
   (Gunakan ini jika bukan pakan — untuk DOC, obat, vaksin, listrik, tenaga kerja, dll)
   Field data:
   {
     "farm_name": "<nama kandang>",
     "farm_id": "<uuid atau null>",
     "expense_date": "<YYYY-MM-DD>",
     "category": "<'doc'|'obat'|'vaksin'|'listrik'|'tenaga_kerja'|'lainnya'>",
     "amount": <integer, rupiah>,
     "description": "<keterangan singkat>",
     "notes": "<atau null>"
   }
   Contoh input: "beli vaksin ND 150 ribu buat kandang B"

5. TANYA_DATA — pertanyaan tentang data siklus
   Contoh: "FCR siklus ini berapa?", "populasi sekarang?", "sudah berapa hari siklus kandang A?"

6. KOREKSI — user mengoreksi data yang baru saja dikirim
   Trigger: "eh salah", "bukan", "koreksi", "maksudnya", "ralat",
            "harusnya", "maaf salah", "yang tadi salah"
   Field data:
   {
     "field_to_fix": "<nama field yang dikoreksi, e.g. 'price_per_kg'>",
     "old_value": "<nilai lama jika disebutkan, atau null>",
     "new_value": "<nilai baru yang benar>",
     "notes": "<konteks koreksi atau null>"
   }
   Contoh input: "ralat tanggalnya, harusnya kemarin bukan hari ini"
`
}


// =============================================================
// RPA SECTION
// =============================================================
function buildRPASection() {
  return `
ROLE: RUMAH POTONG AYAM (RPA)
Kamu membantu mencatat order pembelian ayam, invoice ke customer, dan produk.

INTENT YANG DIKENALI:

1. BUAT_INVOICE — buat invoice penjualan ke customer
   Trigger: "invoice", "nota", "tagih", "jual ke", "catat penjualan"
   Field data:
   {
     "customer_name": "<nama customer>",
     "customer_id": "<uuid atau null>",
     "invoice_date": "<YYYY-MM-DD>",
     "items": [
       {
         "product_name": "<nama produk>",
         "product_id": "<uuid atau null>",
         "qty": <number>,
         "unit": "<'kg'|'ekor'|'pack'>",
         "price_per_unit": <integer>
       }
     ],
     "notes": "<atau null>"
   }
   Contoh input: "invoice Pak Budi 30 ekor WB harga 38rb sama ceker 5kg 15rb"

2. CATAT_ORDER — order beli ayam hidup dari broker
   Trigger: "order", "pesan", "minta", "butuh ayam"
   Field data:
   {
     "broker_name": "<nama broker>",
     "broker_id": "<uuid atau null>",
     "qty_ekor": <integer>,
     "target_weight_kg": <number atau null>,
     "price_per_kg": <integer atau null>,
     "order_date": "<YYYY-MM-DD>",
     "needed_date": "<YYYY-MM-DD atau null>",
     "notes": "<atau null>"
   }
   Contoh input: "order 500 ekor dari Broker Maju, butuhnya besok"

3. TAMBAH_PRODUK — daftarkan produk baru
   Trigger: "produk baru", "tambah produk", "daftar produk"
   Field data:
   {
     "name": "<nama produk>",
     "unit": "<'kg'|'ekor'|'pack'>",
     "sell_price": <integer>,
     "notes": "<atau null>"
   }
   Contoh input: "tambah produk WB 1kg harga jual 35ribu"

4. TANYA_DATA — pertanyaan tentang data RPA
   Contoh: "siapa customer terbanyak bulan ini?", "order yang belum datang?",
           "stok produk WB masih berapa?"

5. KOREKSI — user mengoreksi data yang baru saja dikirim
   Trigger: "eh salah", "bukan", "koreksi", "maksudnya", "ralat",
            "harusnya", "maaf salah", "yang tadi salah"
   Field data:
   {
     "field_to_fix": "<nama field yang dikoreksi, e.g. 'sell_price'>",
     "old_value": "<nilai lama jika disebutkan, atau null>",
     "new_value": "<nilai baru yang benar>",
     "notes": "<konteks koreksi atau null>"
   }
   Contoh input: "koreksi harga WB tadi, harusnya 36rb bukan 35rb"
`
}


// =============================================================
// HELPER
// =============================================================
function offsetDate(isoDate, days) {
  const d = new Date(isoDate)
  d.setDate(d.getDate() + days)
  return d.toISOString().split('T')[0]
}
