import React from 'react'
import { Document, Page, Text, View, StyleSheet } from '@react-pdf/renderer'


import { formatRupiahPDF, formatDatePDF, terbilang } from '@/lib/invoice/invoiceUtils'

const C = {
  bg:       '#FFFFFF',
  text:     '#1a1a1a',
  muted:    '#666666',
  faint:    '#999999',
  light:    '#FFFBEB',   // amber tint
  border:   '#E5E7EB',
  header:   '#0C1319',
  accent:   '#F59E0B',   // amber
  accentBg: '#FFFBEB',
  warn:     '#EF4444',
  ok:       '#021a02',
}

// ── Column sets ──────────────────────────────────────────────────────────────
// showProfit=true:  Produk(30%) | Qty(13%) | Harga/kg(14%) | HPP/kg(14%) | Subtotal(15%) | Margin(14%)
// showProfit=false: Produk(40%) | Qty(15%) | Harga/kg(20%) | Subtotal(25%)

const s = StyleSheet.create({
  page: {
    fontFamily:      'Helvetica',
    fontSize:        10,
    paddingTop:      40,
    paddingBottom:   60,
    paddingLeft:     40,
    paddingRight:    40,
    backgroundColor: C.bg,
    color:           C.text,
  },

  // Header
  header: {
    flexDirection:     'row',
    justifyContent:    'space-between',
    marginBottom:      24,
    paddingBottom:     20,
    borderBottomWidth: 2,
    borderBottomColor: C.accent,
    borderBottomStyle: 'solid',
  },
  companyName:   { fontSize: 18, fontFamily: 'Helvetica-Bold', color: C.header },
  companyDetail: { fontSize: 8,  color: C.muted, marginTop: 3 },
  docTitle:      { fontSize: 22, fontFamily: 'Helvetica-Bold', color: C.accent, textAlign: 'right' },
  docRefNum:     { fontSize: 8,  color: C.muted, textAlign: 'right', marginTop: 2 },
  docNum:        { fontSize: 9,  color: C.muted, textAlign: 'right', marginTop: 2 },
  docDate:       { fontSize: 9,  color: C.muted, textAlign: 'right', marginTop: 2 },
  docDue:        { fontSize: 9,  color: '#F59E0B', textAlign: 'right', marginTop: 2 },

  // Status badge
  statusWrap:  { marginBottom: 16, flexDirection: 'row' },
  statusBadge: { paddingTop: 4, paddingBottom: 4, paddingLeft: 12, paddingRight: 12, borderRadius: 4 },
  statusText:  { fontSize: 9, fontFamily: 'Helvetica-Bold' },

  // Parties
  parties:     { flexDirection: 'row', justifyContent: 'space-between', marginBottom: 24 },
  partyBox:    { width: '45%' },
  partyLabel:  { fontSize: 8, fontFamily: 'Helvetica-Bold', color: C.accent, letterSpacing: 1, marginBottom: 6 },
  partyName:   { fontSize: 12, fontFamily: 'Helvetica-Bold', color: C.header },
  partyDetail: { fontSize: 9, color: C.muted, marginTop: 2 },

  // Table (public — no HPP)
  tableHeader: {
    flexDirection:   'row',
    backgroundColor: C.header,
    paddingTop:      8,
    paddingBottom:   8,
    paddingLeft:     10,
    paddingRight:    10,
    borderRadius:    4,
  },
  thText:   { fontSize: 8, fontFamily: 'Helvetica-Bold', color: '#FFFFFF' },
  tableRow: {
    flexDirection:     'row',
    paddingTop:        8,
    paddingBottom:     8,
    paddingLeft:       10,
    paddingRight:      10,
    borderBottomWidth: 1,
    borderBottomColor: C.border,
    borderBottomStyle: 'solid',
  },
  tableRowAlt: { backgroundColor: C.light },
  td: { fontSize: 9, color: C.text },

  // Public columns (showProfit=false)
  pColDesc:     { width: '40%' },
  pColQty:      { width: '15%', textAlign: 'right' },
  pColPrice:    { width: '20%', textAlign: 'right' },
  pColSubtotal: { width: '25%', textAlign: 'right' },

  // Profit columns (showProfit=true)
  rColDesc:     { width: '30%' },
  rColQty:      { width: '13%', textAlign: 'right' },
  rColPrice:    { width: '14%', textAlign: 'right' },
  rColHPP:      { width: '14%', textAlign: 'right' },
  rColSubtotal: { width: '15%', textAlign: 'right' },
  rColMargin:   { width: '14%', textAlign: 'right' },

  // Summary
  summarySection: { flexDirection: 'row', justifyContent: 'flex-end', marginBottom: 20 },
  summaryBox:  { width: '48%' },
  summaryRow: {
    flexDirection:     'row',
    justifyContent:    'space-between',
    paddingTop:        4,
    paddingBottom:     4,
    borderBottomWidth: 1,
    borderBottomColor: C.border,
    borderBottomStyle: 'solid',
  },
  summaryLabel: { fontSize: 9, color: C.muted },
  summaryVal:   { fontSize: 9, fontFamily: 'Helvetica-Bold', color: C.text },
  totalRow: {
    flexDirection:   'row',
    justifyContent:  'space-between',
    paddingTop:      8,
    paddingBottom:   8,
    paddingLeft:     10,
    paddingRight:    10,
    backgroundColor: C.accent,
    borderRadius:    4,
    marginTop:       4,
  },
  totalLabel: { fontSize: 11, fontFamily: 'Helvetica-Bold', color: '#FFFFFF' },
  totalVal:   { fontSize: 11, fontFamily: 'Helvetica-Bold', color: '#FFFFFF' },

  // Profit summary (showProfit only)
  profitBox: {
    marginBottom:    16,
    paddingTop:      10,
    paddingBottom:   10,
    paddingLeft:     14,
    paddingRight:    14,
    backgroundColor: 'rgba(2, 26, 2,0.06)',
    borderWidth:     1,
    borderColor:     'rgba(2, 26, 2,0.2)',
    borderStyle:     'solid',
    borderRadius:    6,
    flexDirection:   'row',
    justifyContent:  'space-between',
  },
  profitItem: { alignItems: 'center' },
  profitLabel: { fontSize: 8, color: C.muted, marginBottom: 2 },
  profitValue: { fontSize: 11, fontFamily: 'Helvetica-Bold' },

  // Terbilang
  terbilangBox: {
    marginBottom:    20,
    paddingTop:      10,
    paddingBottom:   10,
    paddingLeft:     14,
    paddingRight:    14,
    backgroundColor: C.light,
    borderRadius:    6,
    borderLeftWidth: 3,
    borderLeftColor: C.accent,
    borderLeftStyle: 'solid',
  },
  terbilangLabel: { fontSize: 8, color: C.muted, marginBottom: 3 },
  terbilangText:  { fontSize: 9, fontFamily: 'Helvetica-BoldOblique', color: C.text },

  // Payment info (if not lunas)
  paymentBox: {
    marginBottom:    20,
    paddingTop:      12,
    paddingBottom:   12,
    paddingLeft:     14,
    paddingRight:    14,
    backgroundColor: C.accentBg,
    borderWidth:     1,
    borderColor:     C.accent,
    borderStyle:     'solid',
    borderRadius:    6,
  },
  paymentLabel: { fontSize: 8, fontFamily: 'Helvetica-Bold', color: C.accent, letterSpacing: 1, marginBottom: 6 },
  paymentText:  { fontSize: 9, color: C.text, marginBottom: 3 },
  paymentNote:  { fontSize: 8, color: C.muted, marginTop: 4, fontFamily: 'Helvetica-Oblique' },

  // Payment history table in PDF
  paymentHistoryBox: {
    marginBottom:    16,
    paddingTop:      8,
    paddingBottom:   8,
    paddingLeft:     10,
    paddingRight:    10,
    backgroundColor: '#F8FAFC',
    borderWidth:     1,
    borderColor:     '#E2E8F0',
    borderStyle:     'solid',
    borderRadius:    6,
  },
  paymentHistoryHeader: {
    flexDirection:   'row',
    justifyContent:  'space-between',
    paddingBottom:   4,
    marginBottom:    4,
    borderBottomWidth: 1,
    borderBottomColor: '#CBD5E1',
    borderBottomStyle: 'solid',
  },
  paymentHistoryRow: {
    flexDirection:   'row',
    justifyContent:  'space-between',
    paddingTop:      3,
    paddingBottom:   3,
  },

  // Signature
  sigSection: { flexDirection: 'row', justifyContent: 'space-between', marginTop: 36 },
  sigBox:     { width: '40%', alignItems: 'center' },
  sigLine: {
    borderBottomWidth: 1,
    borderBottomColor: C.text,
    borderBottomStyle: 'solid',
    width:      '100%',
    marginTop:  40,
    marginBottom: 6,
  },
  sigName:  { fontSize: 9, fontFamily: 'Helvetica-Bold', textAlign: 'center' },
  sigLabel: { fontSize: 8, color: C.muted, textAlign: 'center' },

  // Footer
  footer: {
    position:    'absolute',
    bottom:      24,
    left:        40,
    right:       40,
    paddingTop:  8,
    borderTopWidth: 1,
    borderTopColor: C.border,
    borderTopStyle: 'solid',
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  footerText: { fontSize: 7, color: C.faint },
})

// ── Helpers ─────────────────────────────────────────────────────────────────

const statusColors = {
  lunas:       { bg: '#F0FDF4', border: '#021a02', text: '#021a02' },
  belum_lunas: { bg: '#FEF3C7', border: '#F59E0B', text: '#F59E0B' },
  sebagian:    { bg: '#EFF6FF', border: '#3B82F6', text: '#3B82F6' },
}

const statusLabels = {
  lunas:       'LUNAS',
  belum_lunas: 'BELUM DIBAYAR',
  sebagian:    'SEBAGIAN',
}

const customerTypeLabels = {
  toko_kecil:   'Toko Kecil',
  toko_menengah:'Toko Menengah',
  supermarket:  'Supermarket',
  restoran:     'Restoran',
  hotel:        'Hotel',
  catering:     'Catering',
  lainnya:      'Lainnya',
}

// ── Component ────────────────────────────────────────────────────────────────
// Props:
//   tenant: { business_name, phone, location }
//   invoice: { invoice_number, transaction_date, due_date, total_amount, total_cost,
//              net_profit, payment_status, paid_amount, remaining_amount, notes }
//   customer: { customer_name, customer_type, phone, address }
//   items: [{ product_name, quantity_kg, price_per_kg, cost_per_kg, subtotal }]
//   invoiceNumber: string  (PDF document number)
//   generatedBy: string
//   showProfit: boolean    (false = sembunyikan kolom HPP & profit dari customer)

function cleanCustomerNotes(notes) {
  if (!notes || typeof notes !== 'string') return ''
  return notes
    .replace(/\[Biaya Operasional:[^\]]*\]/gi, '')
    .replace(/\[Operasional:[^\]]*\]/gi, '')
    .replace(/Biaya Tambahan:[^\n]+/gi, '')
    .trim()
}

export function SembakoInvoice({
  tenant, invoice, customer, items = [], payments = [],
  invoiceNumber, generatedBy, showProfit = false,
}) {
  const totalAmount   = Number(invoice?.total_amount  || 0)
  const totalCost     = Number(invoice?.total_cost    || 0)
  const deliveryCost  = Number(invoice?.delivery_cost || 0)
  const otherCost     = Number(invoice?.other_cost    || 0)
  const netProfit     = Number(invoice?.net_profit    || (totalAmount - totalCost - deliveryCost - otherCost))
  const paidAmount    = Number(invoice?.paid_amount   || 0)
  const remaining     = Number(invoice?.remaining_amount ?? Math.max(0, totalAmount - paidAmount))
  const isLunas       = invoice?.payment_status === 'lunas'
  const sc            = statusColors[invoice?.payment_status] || statusColors.belum_lunas
  const statusLabel   = statusLabels[invoice?.payment_status] || '-'
  const marginPct     = totalAmount > 0 ? ((netProfit / totalAmount) * 100).toFixed(1) : '0.0'

  const rawPayments   = payments.length > 0 ? payments : (Array.isArray(invoice?.sembako_payments) ? invoice.sembako_payments : (Array.isArray(invoice?.payments) ? invoice.payments : []))
  const validPayments = rawPayments.filter(p => !p.is_deleted)
  const customerNotes = cleanCustomerNotes(invoice?.notes)

  return (
    <Document>
      <Page size="A4" style={s.page}>

        {/* HEADER */}
        <View style={s.header}>
          <View>
            <Text style={s.companyName}>{tenant?.business_name || 'Juragans'}</Text>
            <Text style={s.companyDetail}>{tenant?.location || '-'}</Text>
            <Text style={s.companyDetail}>Tel: {tenant?.phone || '-'}</Text>
            <Text style={s.companyDetail}>Juragans — Platform Penjualan & Inventaris Bawang Goreng</Text>
          </View>
          <View>
            <Text style={s.docTitle}>INVOICE</Text>
            <Text style={s.docRefNum}>Ref: {invoice?.invoice_number || '-'}</Text>
            <Text style={s.docNum}>{invoiceNumber}</Text>
            <Text style={s.docDate}>Tgl: {formatDatePDF(invoice?.transaction_date)}</Text>
            {invoice?.due_date && (
              <Text style={s.docDue}>Jatuh Tempo: {formatDatePDF(invoice.due_date)}</Text>
            )}
          </View>
        </View>

        {/* STATUS BADGE */}
        <View style={s.statusWrap}>
          <View style={[s.statusBadge, {
            backgroundColor: sc.bg,
            borderWidth:     1,
            borderColor:     sc.border,
            borderStyle:     'solid',
          }]}>
            <Text style={[s.statusText, { color: sc.text }]}>{statusLabel}</Text>
          </View>
        </View>

        {/* PARTIES */}
        <View style={s.parties}>
          <View style={s.partyBox}>
            <Text style={s.partyLabel}>DARI (SELLER)</Text>
            <Text style={s.partyName}>{tenant?.business_name || '-'}</Text>
            <Text style={s.partyDetail}>{tenant?.location || '-'}</Text>
            <Text style={s.partyDetail}>Tel: {tenant?.phone || '-'}</Text>
          </View>
          <View style={s.partyBox}>
            <Text style={s.partyLabel}>KEPADA (BUYER)</Text>
            <Text style={s.partyName}>{customer?.customer_name || invoice?.customer_name || '-'}</Text>
            {customer?.customer_type ? (
              <Text style={s.partyDetail}>
                {customerTypeLabels[customer.customer_type] || customer.customer_type}
              </Text>
            ) : null}
            {customer?.address ? (
              <Text style={s.partyDetail}>{customer.address}</Text>
            ) : null}
            {customer?.phone ? (
              <Text style={s.partyDetail}>Tel: {customer.phone}</Text>
            ) : null}
          </View>
        </View>

        {/* TABLE */}
        <View style={{ marginBottom: 16 }}>
          {showProfit ? (
            /* ── WITH PROFIT (internal only) ── */
            <>
              <View style={s.tableHeader}>
                <Text style={[s.thText, s.rColDesc]}>Produk</Text>
                <Text style={[s.thText, s.rColQty]}>Jumlah</Text>
                <Text style={[s.thText, s.rColPrice]}>Harga / Unit</Text>
                <Text style={[s.thText, s.rColHPP]}>HPP / Unit</Text>
                <Text style={[s.thText, s.rColSubtotal]}>Subtotal</Text>
                <Text style={[s.thText, s.rColMargin]}>Margin</Text>
              </View>
              {items.map((item, idx) => {
                const qty = Number(item.quantity || item.quantity_kg || 0)
                const price = Number(item.sell_price ?? item.price_per_unit ?? item.price_per_kg ?? item.unit_price ?? (qty > 0 && item.subtotal ? item.subtotal / qty : 0) ?? 0)
                const cost = Number(item.cogs_per_unit ?? item.cost_per_unit ?? item.cost_per_kg ?? item.cogs ?? 0)
                const itemSubtotal = Number(item.subtotal ?? Math.round(qty * price))
                const itemCost     = Math.round(qty * cost)
                const itemMargin   = itemSubtotal - itemCost
                const unit         = item.unit || 'pcs'
                return (
                  <View key={idx} style={[s.tableRow, idx % 2 === 1 ? s.tableRowAlt : {}]}>
                    <Text style={[s.td, s.rColDesc]}>{item.product_name}</Text>
                    <Text style={[s.td, s.rColQty]}>
                      {Number.isInteger(qty) ? qty : qty.toFixed(2)} {unit}
                    </Text>
                    <Text style={[s.td, s.rColPrice]}>
                      {formatRupiahPDF(price)}
                    </Text>
                    <Text style={[s.td, s.rColHPP, { color: C.muted }]}>
                      {formatRupiahPDF(cost)}
                    </Text>
                    <Text style={[s.td, s.rColSubtotal]}>
                      {formatRupiahPDF(itemSubtotal)}
                    </Text>
                    <Text style={[s.td, s.rColMargin, { color: itemMargin >= 0 ? C.ok : C.warn }]}>
                      {formatRupiahPDF(itemMargin)}
                    </Text>
                  </View>
                )
              })}
            </>
          ) : (
            /* ── PUBLIC (no HPP) ── */
            <>
              <View style={s.tableHeader}>
                <Text style={[s.thText, s.pColDesc]}>Produk</Text>
                <Text style={[s.thText, s.pColQty]}>Jumlah</Text>
                <Text style={[s.thText, s.pColPrice]}>Harga / Unit</Text>
                <Text style={[s.thText, s.pColSubtotal]}>Subtotal</Text>
              </View>
              {items.map((item, idx) => {
                const qty = Number(item.quantity || item.quantity_kg || 0)
                const price = Number(item.sell_price ?? item.price_per_unit ?? item.price_per_kg ?? item.unit_price ?? (qty > 0 && item.subtotal ? item.subtotal / qty : 0) ?? 0)
                const itemSubtotal = Number(item.subtotal ?? Math.round(qty * price))
                const unit         = item.unit || 'pcs'
                return (
                  <View key={idx} style={[s.tableRow, idx % 2 === 1 ? s.tableRowAlt : {}]}>
                    <Text style={[s.td, s.pColDesc]}>{item.product_name}</Text>
                    <Text style={[s.td, s.pColQty]}>
                      {Number.isInteger(qty) ? qty : qty.toFixed(2)} {unit}
                    </Text>
                    <Text style={[s.td, s.pColPrice]}>
                      {formatRupiahPDF(price)}
                    </Text>
                    <Text style={[s.td, s.pColSubtotal]}>
                      {formatRupiahPDF(itemSubtotal)}
                    </Text>
                  </View>
                )
              })}
            </>
          )}
        </View>

        {/* PROFIT SUMMARY (internal only) */}
        {showProfit && (
          <View style={s.profitBox}>
            <View style={s.profitItem}>
              <Text style={s.profitLabel}>TOTAL HPP</Text>
              <Text style={[s.profitValue, { color: C.warn }]}>{formatRupiahPDF(totalCost)}</Text>
            </View>
            <View style={s.profitItem}>
              <Text style={s.profitLabel}>GROSS PROFIT</Text>
              <Text style={[s.profitValue, { color: netProfit >= 0 ? C.ok : C.warn }]}>
                {formatRupiahPDF(netProfit)}
              </Text>
            </View>
            <View style={s.profitItem}>
              <Text style={s.profitLabel}>MARGIN</Text>
              <Text style={[s.profitValue, { color: netProfit >= 0 ? C.ok : C.warn }]}>
                {marginPct}%
              </Text>
            </View>
          </View>
        )}

        {/* SUMMARY & BILLING SECTION */}
        <View style={s.summarySection}>
          <View style={s.summaryBox}>
            <View style={s.summaryRow}>
              <Text style={s.summaryLabel}>Subtotal Produk</Text>
              <Text style={s.summaryVal}>{formatRupiahPDF(items.reduce((s, i) => s + Number(i.subtotal ?? (Number(i.quantity_kg || i.quantity || 0) * Number(i.price_per_kg || i.price_per_unit || 0))), 0) || totalAmount)}</Text>
            </View>
            {deliveryCost > 0 && (
              <View style={s.summaryRow}>
                <Text style={s.summaryLabel}>Ongkos Kirim</Text>
                <Text style={s.summaryVal}>+{formatRupiahPDF(deliveryCost)}</Text>
              </View>
            )}
            <View style={[s.summaryRow, { borderTopWidth: 1, borderTopColor: C.border, paddingTop: 4, marginTop: 2 }]}>
              <Text style={[s.summaryLabel, { fontFamily: 'Helvetica-Bold' }]}>Total Tagihan</Text>
              <Text style={[s.summaryVal, { fontFamily: 'Helvetica-Bold' }]}>{formatRupiahPDF(totalAmount)}</Text>
            </View>
            {paidAmount > 0 && (
              <View style={s.summaryRow}>
                <Text style={s.summaryLabel}>Sudah Dibayar</Text>
                <Text style={[s.summaryVal, { color: C.ok }]}>
                  ({formatRupiahPDF(paidAmount)})
                </Text>
              </View>
            )}
            <View style={s.totalRow}>
              <Text style={s.totalLabel}>
                {isLunas ? 'STATUS' : 'SISA TAGIHAN'}
              </Text>
              <Text style={s.totalVal}>
                {isLunas ? 'LUNAS' : formatRupiahPDF(remaining)}
              </Text>
            </View>
          </View>
        </View>

        {/* CUSTOMER NOTES (Cleaned from internal expense tags) */}
        {customerNotes ? (
          <View style={{ marginBottom: 14, padding: 8, backgroundColor: '#F8FAFC', borderRadius: 4, borderWidth: 1, borderColor: '#E2E8F0' }}>
            <Text style={{ fontSize: 8, fontFamily: 'Helvetica-Bold', color: C.muted, marginBottom: 2 }}>CATATAN NOTA:</Text>
            <Text style={{ fontSize: 8, color: C.text }}>{customerNotes}</Text>
          </View>
        ) : null}

        {/* PAYMENT HISTORY */}
        {validPayments.length > 0 && (
          <View style={s.paymentHistoryBox}>
            <View style={s.paymentHistoryHeader}>
              <Text style={{ fontSize: 8, fontFamily: 'Helvetica-Bold', color: C.header }}>
                RIWAYAT PEMBAYARAN PELANGGAN
              </Text>
              <Text style={{ fontSize: 8, fontFamily: 'Helvetica-Bold', color: C.ok }}>
                Total Diterima: {formatRupiahPDF(paidAmount)}
              </Text>
            </View>
            {validPayments.map((p, idx) => (
              <View key={idx} style={s.paymentHistoryRow}>
                <Text style={{ fontSize: 8, color: C.text }}>
                  {formatDatePDF(p.payment_date || p.created_at)} · {(p.payment_method || 'CASH').toUpperCase()}{p.notes ? ` (${p.notes})` : ''}
                </Text>
                <Text style={{ fontSize: 8, fontFamily: 'Helvetica-Bold', color: C.text }}>
                  {formatRupiahPDF(p.amount || p.amount_paid)}
                </Text>
              </View>
            ))}
          </View>
        )}

        {/* TERBILANG */}
        <View style={s.terbilangBox}>
          <Text style={s.terbilangLabel}>TERBILANG</Text>
          <Text style={s.terbilangText}>
            {terbilang(isLunas ? totalAmount : remaining)}
          </Text>
        </View>

        {/* PAYMENT INFO (jika belum lunas) */}
        {!isLunas && (
          <View style={s.paymentBox}>
            <Text style={s.paymentLabel}>INFO PEMBAYARAN</Text>
            <Text style={s.paymentText}>
              Harap transfer ke rekening atas nama:
            </Text>
            <Text style={[s.paymentText, { fontFamily: 'Helvetica-Bold' }]}>
              {tenant?.business_name || '-'}
            </Text>
            <Text style={s.paymentNote}>
              * Konfirmasi pembayaran via WhatsApp/telepon setelah transfer
            </Text>
          </View>
        )}

        {/* TANDA TANGAN */}
        <View style={s.sigSection}>
          <View style={s.sigBox}>
            <Text style={{ fontSize: 9, color: C.muted, marginBottom: 4 }}>Hormat kami,</Text>
            <View style={s.sigLine} />
            <Text style={s.sigName}>{generatedBy || tenant?.business_name || '-'}</Text>
            <Text style={s.sigLabel}>Pihak Kedai / Penjual</Text>
          </View>
          <View style={s.sigBox}>
            <Text style={{ fontSize: 9, color: C.muted, marginBottom: 4 }}>Diterima oleh,</Text>
            <View style={s.sigLine} />
            <Text style={s.sigName}>
              {customer?.customer_name || invoice?.customer_name || '________________'}
            </Text>
            <Text style={s.sigLabel}>Pihak Pembeli</Text>
          </View>
        </View>

        {/* FOOTER */}
        <View style={s.footer} fixed>
          <Text style={s.footerText}>
            {invoiceNumber} | Ref: {invoice?.invoice_number || '-'} | {formatDatePDF(new Date())} | {generatedBy || '-'}
          </Text>
          <Text style={s.footerText}>Powered by Juragans Dashboard</Text>
        </View>

      </Page>
    </Document>
  )
}
