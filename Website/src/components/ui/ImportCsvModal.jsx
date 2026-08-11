import React, { useState, useMemo } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { FileSpreadsheet, Upload, Download, Check, AlertCircle, X, ArrowRight, Table, HelpCircle } from 'lucide-react'
import { supabase } from '@/lib/supabase'
import { toast } from 'sonner'
import { useQueryClient } from '@tanstack/react-query'
import { useAuth } from '@/lib/hooks/useAuth'
import { sanitizeDBPayload } from '@/lib/hooks/sembako/sembakoCommon'
import { useBackHandler } from '@/lib/hooks/useBackHandler'

// ── Robust CSV Parser Helper ──────────────────────────────────────────────────
export function parseCSV(text) {
  const lines = []
  let currentRow = []
  let currentVal = ''
  let insideQuote = false

  for (let i = 0; i < text.length; i++) {
    const char = text[i]
    const nextChar = text[i + 1]

    if (char === '"') {
      if (insideQuote && nextChar === '"') {
        currentVal += '"'
        i++
      } else {
        insideQuote = !insideQuote
      }
    } else if ((char === ',' || char === ';') && !insideQuote) {
      currentRow.push(currentVal.trim())
      currentVal = ''
    } else if ((char === '\r' || char === '\n') && !insideQuote) {
      if (char === '\r' && nextChar === '\n') i++
      currentRow.push(currentVal.trim())
      if (currentRow.some(c => c !== '')) lines.push(currentRow)
      currentRow = []
      currentVal = ''
    } else {
      currentVal += char
    }
  }

  if (currentVal !== '' || currentRow.length > 0) {
    currentRow.push(currentVal.trim())
    if (currentRow.some(c => c !== '')) lines.push(currentRow)
  }

  return lines
}

// ── Entity Configurations ─────────────────────────────────────────────────────
const ENTITIES = {
  products: {
    label: 'Produk & Stok (Barang)',
    table: 'sembako_products',
    fields: [
      { key: 'product_name', label: 'Nama Produk', required: true, aliases: ['nama', 'nama_produk', 'produk', 'item', 'name'] },
      { key: 'category', label: 'Kategori', required: false, aliases: ['kategori', 'category'], default: 'Umum' },
      { key: 'sell_price', label: 'Harga Jual (Rp)', required: true, aliases: ['harga_jual', 'harga', 'jual', 'sell_price', 'price'], isNumber: true },
      { key: 'avg_buy_price', label: 'Harga Beli / HPP (Rp)', required: false, aliases: ['harga_beli', 'hpp', 'beli', 'buy_price', 'cogs'], isNumber: true, default: 0 },
      { key: 'current_stock', label: 'Stok Awal', required: false, aliases: ['stok', 'stok_awal', 'qty', 'current_stock', 'stock'], isNumber: true, default: 0 },
      { key: 'unit', label: 'Satuan', required: false, aliases: ['satuan', 'unit'], default: 'pcs' },
      { key: 'min_stock_alert', label: 'Min Stok Alert', required: false, aliases: ['min_stok', 'alert_stok', 'min_stock_alert'], isNumber: true, default: 5 },
    ],
    sampleRow: ['Minyak Goreng Kita 1L', 'Sembako', '16500', '14000', '50', 'pouch', '10'],
    queryKeys: ['sembako-products', 'sembako-dashboard-stats'],
  },
  customers: {
    label: 'Toko & Pelanggan',
    table: 'sembako_customers',
    fields: [
      { key: 'customer_name', label: 'Nama Toko / Pelanggan', required: true, aliases: ['nama_toko', 'nama', 'pelanggan', 'toko', 'customer_name', 'customer'] },
      { key: 'owner_name', label: 'Nama Pemilik', required: false, aliases: ['pemilik', 'owner', 'nama_pemilik', 'owner_name'] },
      { key: 'phone', label: 'No. Telepon / WA', required: false, aliases: ['telepon', 'phone', 'hp', 'no_wa', 'wa'] },
      { key: 'address', label: 'Alamat Toko', required: false, aliases: ['alamat', 'address', 'lokasi'] },
      { key: 'customer_type', label: 'Tipe (grosir/eceran/agen)', required: false, aliases: ['tipe', 'type', 'customer_type'], default: 'grosir' },
      { key: 'credit_limit', label: 'Limit Piutang (Rp)', required: false, aliases: ['limit_piutang', 'limit', 'credit_limit'], isNumber: true, default: 0 },
    ],
    sampleRow: ['Toko Barokah Jaya', 'Hj. Siti', '081234567890', 'Jl. Merdeka No. 12', 'grosir', '5000000'],
    queryKeys: ['sembako-customers', 'sembako-toko-supplier'],
  },
  suppliers: {
    label: 'Supplier / Vendor',
    table: 'sembako_suppliers',
    fields: [
      { key: 'supplier_name', label: 'Nama Supplier', required: true, aliases: ['nama_supplier', 'nama', 'supplier', 'vendor', 'supplier_name'] },
      { key: 'contact_person', label: 'Kontak Sales / PIC', required: false, aliases: ['kontak', 'pic', 'contact_person', 'sales'] },
      { key: 'phone', label: 'No. Telepon / WA', required: false, aliases: ['telepon', 'phone', 'hp', 'no_wa', 'wa'] },
      { key: 'address', label: 'Alamat Supplier', required: false, aliases: ['alamat', 'address'] },
    ],
    sampleRow: ['PT Indofood Sukses', 'Budi Sales', '081987654321', 'Kawasan Industri Blok C'],
    queryKeys: ['sembako-suppliers', 'sembako-toko-supplier'],
  },
  sales: {
    label: 'Riwayat Transaksi Penjualan',
    table: 'sembako_sales',
    fields: [
      { key: 'invoice_number', label: 'No. Invoice / Nota', required: true, aliases: ['invoice', 'no_invoice', 'nota', 'no_nota', 'invoice_number'] },
      { key: 'transaction_date', label: 'Tanggal Transaksi (YYYY-MM-DD)', required: false, aliases: ['tanggal', 'tgl', 'transaction_date', 'date'] },
      { key: 'customer_name', label: 'Nama Toko / Pelanggan', required: true, aliases: ['nama_toko', 'toko', 'pelanggan', 'customer', 'customer_name'] },
      { key: 'product_name', label: 'Nama Produk', required: true, aliases: ['nama_produk', 'produk', 'item', 'product_name'] },
      { key: 'quantity', label: 'Jumlah Qty', required: true, aliases: ['qty', 'jumlah', 'quantity', 'banyak'], isNumber: true },
      { key: 'sell_price', label: 'Harga Jual (Rp)', required: true, aliases: ['harga', 'harga_jual', 'price', 'sell_price'], isNumber: true },
      { key: 'paid_amount', label: 'Total Dibayar (Rp)', required: false, aliases: ['dibayar', 'bayar', 'paid', 'paid_amount'], isNumber: true },
      { key: 'notes', label: 'Catatan', required: false, aliases: ['catatan', 'notes', 'keterangan'] },
    ],
    sampleRow: ['INV-2026-001', '2026-08-01', 'Toko Barokah Jaya', 'Minyak Goreng Kita 1L', '10', '16500', '165000', 'Penjualan Lunas'],
    queryKeys: ['sembako-sales', 'sembako-customers', 'sembako-dashboard-stats', 'sembako-customer-invoices'],
  },
  purchases: {
    label: 'Riwayat Pembelian Stok / Batch',
    table: 'sembako_stock_batches',
    fields: [
      { key: 'batch_number', label: 'No. Batch / Nota Beli', required: true, aliases: ['batch', 'no_batch', 'nota_beli', 'batch_number'] },
      { key: 'purchase_date', label: 'Tanggal Beli (YYYY-MM-DD)', required: false, aliases: ['tanggal', 'tgl', 'purchase_date', 'date'] },
      { key: 'supplier_name', label: 'Nama Supplier', required: false, aliases: ['supplier', 'nama_supplier', 'vendor', 'supplier_name'] },
      { key: 'product_name', label: 'Nama Produk', required: true, aliases: ['nama_produk', 'produk', 'item', 'product_name'] },
      { key: 'qty_masuk', label: 'Qty Stok Masuk', required: true, aliases: ['qty', 'stok_masuk', 'qty_masuk', 'quantity'], isNumber: true },
      { key: 'buy_price', label: 'Harga Beli HPP (Rp)', required: true, aliases: ['harga_beli', 'hpp', 'buy_price', 'price'], isNumber: true },
      { key: 'notes', label: 'Catatan', required: false, aliases: ['catatan', 'notes', 'keterangan'] },
    ],
    sampleRow: ['BATCH-2026-001', '2026-08-01', 'PT Indofood Sukses', 'Minyak Goreng Kita 1L', '100', '14000', 'Restock Bulanan'],
    queryKeys: ['sembako-all-batches', 'sembako-products', 'sembako-suppliers', 'sembako-dashboard-stats'],
  },
}

export function downloadCsvTemplate(entityType) {
  const config = ENTITIES[entityType]
  if (!config) return

  const headers = config.fields.map(f => f.key)
  const csvContent = 'data:text/csv;charset=utf-8,' + [headers.join(','), config.sampleRow.join(',')].join('\n')
  const encodedUri = encodeURI(csvContent)
  const link = document.createElement('a')
  link.setAttribute('href', encodedUri)
  link.setAttribute('download', `template_import_${entityType}.csv`)
  document.body.appendChild(link)
  link.click()
  document.body.removeChild(link)
}

export default function ImportCsvModal({ open, onClose, defaultEntity = 'products' }) {
  useBackHandler(open, onClose)
  const { tenant } = useAuth()
  const queryClient = useQueryClient()

  const [entityType, setEntityType] = useState(defaultEntity)
  const [step, setStep] = useState(1) // 1: Upload, 2: Mapping & Preview, 3: Success
  const [file, setFile] = useState(null)
  const [parsedRows, setParsedRows] = useState([])
  const [csvHeaders, setCsvHeaders] = useState([])
  const [fieldMapping, setFieldMapping] = useState({})
  const [uploading, setUploading] = useState(false)
  const [importSummary, setImportSummary] = useState({ total: 0, inserted: 0 })

  const config = ENTITIES[entityType]

  // ── Auto-detect field mapping ─────────────────────────────────────────────
  const autoMapHeaders = (headers, fields) => {
    const mapping = {}
    fields.forEach(field => {
      const match = headers.find(h => {
        const cleanH = h.toLowerCase().replace(/[^a-z0-9_]/g, '')
        return field.aliases.some(alias => cleanH.includes(alias))
      })
      if (match) mapping[field.key] = match
    })
    return mapping
  }

  const handleFileUpload = (e) => {
    const uploadedFile = e.target.files?.[0]
    if (!uploadedFile) return

    setFile(uploadedFile)
    const reader = new FileReader()
    reader.onload = (evt) => {
      const text = evt.target?.result
      if (typeof text !== 'string') return

      const rows = parseCSV(text)
      if (rows.length < 2) {
        toast.error('File CSV kosong atau format tidak sesuai (minimal header & 1 baris data)')
        return
      }

      const headers = rows[0]
      const dataRows = rows.slice(1)

      setCsvHeaders(headers)
      setParsedRows(dataRows)

      const detectedMapping = autoMapHeaders(headers, config.fields)
      setFieldMapping(detectedMapping)
      setStep(2)
    }
    reader.readAsText(uploadedFile)
  }

  // ── Map raw row to DB payload ─────────────────────────────────────────────
  const preparePayloads = useMemo(() => {
    if (step < 2) return []

    return parsedRows.map((row) => {
      const obj = {}
      config.fields.forEach(field => {
        const csvHeader = fieldMapping[field.key]
        const colIdx = csvHeaders.indexOf(csvHeader)
        let val = colIdx !== -1 ? row[colIdx] : undefined

        if (val === undefined || val === '') {
          val = field.default !== undefined ? field.default : null
        }

        if (field.isNumber && val !== null) {
          const num = Number(String(val).replace(/[^0-9.-]/g, ''))
          val = isNaN(num) ? (field.default || 0) : num
        }

        obj[field.key] = val
      })
      return obj
    })
  }, [parsedRows, fieldMapping, csvHeaders, config, step])

  const invalidCount = useMemo(() => {
    return preparePayloads.filter(p => {
      const reqField = config.fields.find(f => f.required)
      return reqField && (!p[reqField.key] || String(p[reqField.key]).trim() === '')
    }).length
  }, [preparePayloads, config])

  // ── Submit logic with support for sales & purchases ───────────────────────
  const handleImportSubmit = async () => {
    if (!tenant?.id) return toast.error('ID Bisnis tidak ditemukan')

    const validPayloads = preparePayloads.filter(p => {
      const reqField = config.fields.find(f => f.required)
      return reqField && p[reqField.key] && String(p[reqField.key]).trim() !== ''
    })

    if (validPayloads.length === 0) {
      return toast.error('Tidak ada data valid yang bisa di-import')
    }

    setUploading(true)
    const toastId = toast.loading(`Meng-import ${validPayloads.length} data ${config.label}...`)

    try {
      let insertedCount = 0

      // ── ENTITY: SALES (Penjualan / Invoice & Item Penjualan) ──────────────
      if (entityType === 'sales') {
        // Fetch existing customers & products for matching
        const [custRes, prodRes] = await Promise.all([
          supabase.from('sembako_customers').select('id, customer_name').eq('tenant_id', tenant.id),
          supabase.from('sembako_products').select('id, product_name, unit, avg_buy_price').eq('tenant_id', tenant.id)
        ])

        const customerMap = {}
        const productMap = {}
        ;(custRes.data || []).forEach(c => { customerMap[c.customer_name.toLowerCase().trim()] = c.id })
        ;(prodRes.data || []).forEach(p => { productMap[p.product_name.toLowerCase().trim()] = p })

        // Group rows by invoice_number
        const invoiceGroups = {}
        validPayloads.forEach(row => {
          const invNum = String(row.invoice_number || `INV-${Date.now()}`).trim()
          if (!invoiceGroups[invNum]) invoiceGroups[invNum] = []
          invoiceGroups[invNum].push(row)
        })

        for (const [invNum, items] of Object.entries(invoiceGroups)) {
          const firstRow = items[0]
          const custName = String(firstRow.customer_name || 'Pelanggan General').trim()
          
          // Match or create Customer
          let customerId = customerMap[custName.toLowerCase()]
          if (!customerId) {
            const { data: newCust } = await supabase
              .from('sembako_customers')
              .insert(sanitizeDBPayload({ tenant_id: tenant.id, customer_name: custName }, 'sembako_customers'))
              .select('id').single()
            if (newCust) {
              customerId = newCust.id
              customerMap[custName.toLowerCase()] = customerId
            }
          }

          // Calculate totals
          const totalAmount = items.reduce((s, it) => s + (Number(it.quantity || 0) * Number(it.sell_price || 0)), 0)
          const totalCogs = items.reduce((s, it) => {
            const p = productMap[String(it.product_name || '').toLowerCase().trim()]
            const cogs = Number(p?.avg_buy_price || 0)
            return s + (Number(it.quantity || 0) * cogs)
          }, 0)

          const rawPaid = firstRow.paid_amount !== undefined && firstRow.paid_amount !== null
            ? Number(firstRow.paid_amount)
            : totalAmount
          const paidAmount = Math.min(totalAmount, Math.max(0, rawPaid))
          const remainingAmount = Math.max(0, totalAmount - paidAmount)
          const paymentStatus = remainingAmount <= 0 ? 'lunas' : (paidAmount > 0 ? 'sebagian' : 'belum_lunas')
          const txDate = firstRow.transaction_date || new Date().toISOString().slice(0, 10)

          // Insert Sale Header (Opsi A: Historical record, no immediate FIFO deduct)
          const salePayload = sanitizeDBPayload({
            tenant_id: tenant.id,
            invoice_number: invNum,
            customer_id: customerId,
            customer_name: custName,
            transaction_date: txDate,
            total_amount: totalAmount,
            total_cogs: totalCogs,
            net_profit: Math.max(0, totalAmount - totalCogs),
            paid_amount: paidAmount,
            remaining_amount: remainingAmount,
            payment_status: paymentStatus,
            notes: firstRow.notes || 'Import riwayat CSV',
          }, 'sembako_sales')

          const { data: saleData, error: saleErr } = await supabase.from('sembako_sales').insert(salePayload).select('id').single()
          if (saleErr) throw saleErr

          // Insert Sale Items
          const saleItemsToInsert = items.map(it => {
            const prod = productMap[String(it.product_name || '').toLowerCase().trim()]
            const qty = Number(it.quantity || 0)
            const price = Number(it.sell_price || 0)
            const cogs = Number(prod?.avg_buy_price || 0)
            return sanitizeDBPayload({
              sale_id: saleData.id,
              product_id: prod?.id || null,
              product_name: String(it.product_name || 'Produk').trim(),
              unit: prod?.unit || 'pcs',
              quantity: qty,
              sell_price: price,
              subtotal: qty * price,
              cogs_per_unit: cogs,
              cogs_total: qty * cogs,
            }, 'sembako_sale_items')
          })

          await supabase.from('sembako_sale_items').insert(saleItemsToInsert)
          insertedCount += items.length
        }
      } 
      // ── ENTITY: PURCHASES (Pembelian Stok / Stock Batches) ──────────────────
      else if (entityType === 'purchases') {
        const [suppRes, prodRes] = await Promise.all([
          supabase.from('sembako_suppliers').select('id, supplier_name').eq('tenant_id', tenant.id),
          supabase.from('sembako_products').select('id, product_name, current_stock, avg_buy_price').eq('tenant_id', tenant.id)
        ])

        const supplierMap = {}
        const productMap = {}
        ;(suppRes.data || []).forEach(s => { supplierMap[s.supplier_name.toLowerCase().trim()] = s.id })
        ;(prodRes.data || []).forEach(p => { productMap[p.product_name.toLowerCase().trim()] = p })

        const batchInserts = []
        for (const row of validPayloads) {
          const prodName = String(row.product_name || '').trim()
          const prod = productMap[prodName.toLowerCase()]
          const suppName = String(row.supplier_name || '').trim()
          const suppId = supplierMap[suppName.toLowerCase()] || null

          const qty = Number(row.qty_masuk || 0)
          const buyPrice = Number(row.buy_price || 0)

          batchInserts.push(sanitizeDBPayload({
            tenant_id: tenant.id,
            supplier_id: suppId,
            product_id: prod?.id || null,
            batch_number: String(row.batch_number || `BATCH-${Date.now()}`).trim(),
            purchase_date: row.purchase_date || new Date().toISOString().slice(0, 10),
            qty_masuk: qty,
            qty_sisa: qty,
            buy_price: buyPrice,
            total_cost: qty * buyPrice,
            notes: row.notes || 'Import riwayat pembelian CSV',
          }, 'sembako_stock_batches'))
        }

        if (batchInserts.length > 0) {
          const { error } = await supabase.from('sembako_stock_batches').insert(batchInserts)
          if (error) throw error
          insertedCount = batchInserts.length
        }
      } 
      // ── DEFAULT ENTITIES (PRODUCTS, CUSTOMERS, SUPPLIERS) ─────────────────
      else {
        const finalPayloads = validPayloads.map(p =>
          sanitizeDBPayload({ ...p, tenant_id: tenant.id }, config.table)
        )

        const BATCH_SIZE = 50
        for (let i = 0; i < finalPayloads.length; i += BATCH_SIZE) {
          const batch = finalPayloads.slice(i, i + BATCH_SIZE)
          const { data: insertedData, error } = await supabase
            .from(config.table)
            .insert(batch)
            .select('id, product_name, current_stock, avg_buy_price')

          if (error) throw error
          insertedCount += batch.length

          if (entityType === 'products' && insertedData) {
            const batchInserts = insertedData
              .filter(p => (Number(p.current_stock) || 0) > 0)
              .map(p => ({
                tenant_id: tenant.id,
                product_id: p.id,
                batch_number: `INIT-${Date.now()}-${Math.random().toString(36).slice(2, 5)}`,
                qty_masuk: Number(p.current_stock),
                qty_sisa: Number(p.current_stock),
                buy_price: Number(p.avg_buy_price || 0),
                total_cost: Number(p.current_stock) * Number(p.avg_buy_price || 0),
                purchase_date: new Date().toISOString().slice(0, 10),
                notes: 'Stok awal import CSV'
              }))

            if (batchInserts.length > 0) {
              await supabase.from('sembako_stock_batches').insert(batchInserts)
            }
          }
        }
      }

      config.queryKeys.forEach(key => queryClient.invalidateQueries({ queryKey: [key] }))
      toast.success(`Berhasil meng-import ${insertedCount} data ${config.label}!`, { id: toastId })

      setImportSummary({ total: validPayloads.length, inserted: insertedCount })
      setStep(3)
    } catch (err) {
      toast.error('Gagal import CSV: ' + err.message, { id: toastId })
    } finally {
      setUploading(false)
    }
  }

  const handleReset = () => {
    setStep(1)
    setFile(null)
    setParsedRows([])
    setCsvHeaders([])
    setFieldMapping({})
  }

  if (!open) return null

  return (
    <AnimatePresence>
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        className="fixed inset-0 z-50 bg-black/80 backdrop-blur-sm flex items-center justify-center p-4"
        onClick={onClose}
      >
        <motion.div
          initial={{ scale: 0.95, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          exit={{ scale: 0.95, opacity: 0 }}
          className="bg-card border border-border/80 rounded-2xl w-full max-w-3xl overflow-hidden shadow-2xl flex flex-col max-h-[90vh]"
          onClick={e => e.stopPropagation()}
        >
          {/* Header */}
          <div className="flex items-center justify-between px-6 py-4 border-b border-border/60 bg-muted/20">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-amber-500/15 border border-amber-500/30 flex items-center justify-center text-amber-500">
                <FileSpreadsheet size={20} />
              </div>
              <div>
                <h3 className="font-display font-extrabold text-lg text-foreground m-0">
                  Import Data (.CSV / Google Sheets)
                </h3>
                <p className="text-xs text-muted-foreground m-0 mt-0.5">
                  Migrasi produk, toko, supplier, & riwayat transaksi dengan mudah
                </p>
              </div>
            </div>
            <button
              onClick={onClose}
              className="w-8 h-8 rounded-lg bg-muted hover:bg-muted/80 flex items-center justify-center text-muted-foreground hover:text-foreground transition-colors border-0 cursor-pointer"
            >
              <X size={16} />
            </button>
          </div>

          {/* Body */}
          <div className="p-6 overflow-y-auto flex-1">
            {/* Step 1: Select Entity & Upload File */}
            {step === 1 && (
              <div className="space-y-6">
                <div>
                  <label className="block text-xs font-bold uppercase tracking-wider text-muted-foreground mb-2">
                    1. Pilih Jenis Data Yang Ingin Di-Import
                  </label>
                  <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
                    {Object.entries(ENTITIES).map(([key, item]) => (
                      <button
                        key={key}
                        onClick={() => setEntityType(key)}
                        className={`p-3.5 rounded-xl border text-left flex flex-col justify-between transition-all cursor-pointer ${
                          entityType === key
                            ? 'bg-amber-500/10 border-amber-500/40 text-amber-500 font-bold'
                            : 'bg-muted/30 border-border hover:bg-muted/50 text-foreground'
                        }`}
                      >
                        <span className="text-xs font-semibold">{item.label}</span>
                      </button>
                    ))}
                  </div>
                </div>

                {/* Upload Zone */}
                <div>
                  <label className="block text-xs font-bold uppercase tracking-wider text-muted-foreground mb-2">
                    2. Upload File CSV (.csv)
                  </label>
                  <div className="border-2 border-dashed border-border/80 hover:border-amber-500/50 rounded-2xl p-8 text-center bg-muted/10 hover:bg-amber-500/5 transition-all relative group cursor-pointer">
                    <input
                      type="file"
                      accept=".csv,text/csv"
                      onChange={handleFileUpload}
                      className="absolute inset-0 w-full h-full opacity-0 cursor-pointer z-10"
                    />
                    <div className="w-12 h-12 rounded-2xl bg-amber-500/10 text-amber-500 flex items-center justify-center mx-auto mb-3 group-hover:scale-110 transition-transform">
                      <Upload size={24} />
                    </div>
                    <p className="font-bold text-sm text-foreground mb-1">
                      Klik atau Seret File .CSV Ke Sini
                    </p>
                    <p className="text-xs text-muted-foreground mb-4">
                      Mendukung file ekspor dari Google Sheets atau Microsoft Excel (.csv)
                    </p>
                    <button
                      type="button"
                      onClick={(e) => { e.stopPropagation(); downloadCsvTemplate(entityType) }}
                      className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-lg bg-muted border border-border text-xs font-bold text-foreground hover:bg-muted/80 transition-colors relative z-20 cursor-pointer"
                    >
                      <Download size={13} className="text-amber-500" />
                      <span>Download Contoh Template {config.label} (.CSV)</span>
                    </button>
                  </div>
                </div>

                <div className="bg-amber-500/5 border border-amber-500/20 rounded-xl p-4 text-xs text-amber-600 dark:text-amber-400 space-y-1">
                  <p className="font-bold flex items-center gap-1.5">
                    <HelpCircle size={14} /> Panduan Migrasi dari Google Sheets / Excel:
                  </p>
                  <ol className="list-decimal list-inside space-y-1 text-muted-foreground pl-1">
                    <li>Buka spreadsheet Google Sheets / Excel Anda.</li>
                    <li>Pilih menu <strong>File → Download → Comma Separated Values (.csv)</strong>.</li>
                    <li>Upload file .csv tersebut pada kotak di atas.</li>
                  </ol>
                </div>
              </div>
            )}

            {/* Step 2: Column Mapping & Preview */}
            {step === 2 && (
              <div className="space-y-6">
                <div className="flex items-center justify-between bg-muted/30 p-3 rounded-xl border border-border">
                  <div className="flex items-center gap-2">
                    <Table size={16} className="text-amber-500" />
                    <span className="text-xs font-bold text-foreground">File: {file?.name}</span>
                    <span className="text-xs text-muted-foreground">({parsedRows.length} baris terbaca)</span>
                  </div>
                  <button
                    onClick={handleReset}
                    className="text-xs text-amber-500 font-bold hover:underline bg-transparent border-0 cursor-pointer"
                  >
                    Ganti File
                  </button>
                </div>

                {/* Mapping Controls */}
                <div>
                  <h4 className="text-xs font-bold uppercase tracking-wider text-muted-foreground mb-3">
                    Pemetaan Kolom (Column Mapping)
                  </h4>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                    {config.fields.map(field => (
                      <div key={field.key} className="bg-muted/20 p-2.5 rounded-xl border border-border flex items-center justify-between gap-2">
                        <div>
                          <p className="text-xs font-bold text-foreground m-0">
                            {field.label} {field.required && <span className="text-red-500">*</span>}
                          </p>
                          <p className="text-[10px] text-muted-foreground m-0">Kolom database: {field.key}</p>
                        </div>
                        <select
                          value={fieldMapping[field.key] || ''}
                          onChange={(e) => setFieldMapping(prev => ({ ...prev, [field.key]: e.target.value }))}
                          className="bg-card border border-border rounded-lg text-xs px-2.5 py-1 text-foreground focus:outline-none focus:border-amber-500"
                        >
                          <option value="">-- Pilih Kolom CSV --</option>
                          {csvHeaders.map(h => (
                            <option key={h} value={h}>{h}</option>
                          ))}
                        </select>
                      </div>
                    ))}
                  </div>
                </div>

                {/* Table Preview */}
                <div>
                  <div className="flex items-center justify-between mb-2">
                    <h4 className="text-xs font-bold uppercase tracking-wider text-muted-foreground m-0">
                      Preview Data (5 Baris Pertama)
                    </h4>
                    {invalidCount > 0 && (
                      <span className="text-xs font-bold text-red-500 bg-red-500/10 px-2 py-0.5 rounded-md border border-red-500/20">
                        ⚠️ {invalidCount} baris tidak valid (akan dilewati)
                      </span>
                    )}
                  </div>
                  <div className="border border-border rounded-xl overflow-x-auto">
                    <table className="w-full text-left text-xs border-collapse">
                      <thead>
                        <tr className="bg-muted/50 border-b border-border text-muted-foreground">
                          {config.fields.map(f => (
                            <th key={f.key} className="p-2.5 font-bold">{f.label}</th>
                          ))}
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-border/60">
                        {preparePayloads.slice(0, 5).map((row, idx) => (
                          <tr key={idx} className="hover:bg-muted/20">
                            {config.fields.map(f => (
                              <td key={f.key} className="p-2.5 text-foreground">
                                {row[f.key] !== null && row[f.key] !== undefined ? String(row[f.key]) : <span className="text-muted-foreground opacity-50">-</span>}
                              </td>
                            ))}
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </div>
              </div>
            )}

            {/* Step 3: Success Screen */}
            {step === 3 && (
              <div className="text-center py-8 space-y-4">
                <div className="w-16 h-16 rounded-full bg-emerald-500/15 text-emerald-500 flex items-center justify-center mx-auto border-2 border-emerald-500/30">
                  <Check size={32} />
                </div>
                <div>
                  <h3 className="font-display font-extrabold text-xl text-foreground mb-1">
                    Migrasi Import Berhasil!
                  </h3>
                  <p className="text-sm text-muted-foreground max-w-sm mx-auto">
                    Sebanyak <strong className="text-foreground">{importSummary.inserted}</strong> data {config.label} telah sukses dimasukkan ke dalam database.
                  </p>
                </div>
                <button
                  onClick={onClose}
                  className="px-6 py-2.5 rounded-xl bg-amber-600 hover:bg-amber-500 text-white font-bold text-xs shadow-lg shadow-amber-600/20 transition-all cursor-pointer border-0"
                >
                  Selesai
                </button>
              </div>
            )}
          </div>

          {/* Footer Actions */}
          {step === 2 && (
            <div className="flex items-center justify-between px-6 py-4 border-t border-border/60 bg-muted/20">
              <button
                onClick={handleReset}
                className="px-4 py-2 rounded-xl bg-muted text-muted-foreground font-bold text-xs hover:bg-muted/80 transition-colors border-0 cursor-pointer"
              >
                Kembali
              </button>
              <button
                onClick={handleImportSubmit}
                disabled={uploading}
                className="inline-flex items-center gap-2 px-6 py-2.5 rounded-xl bg-amber-600 hover:bg-amber-500 text-white font-bold text-xs shadow-lg shadow-amber-600/20 transition-all cursor-pointer border-0 disabled:opacity-50"
              >
                <span>{uploading ? 'Meng-import...' : `Proses Import ${preparePayloads.length} Data`}</span>
                <ArrowRight size={14} />
              </button>
            </div>
          )}
        </motion.div>
      </motion.div>
    </AnimatePresence>
  )
}
