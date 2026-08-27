import React from 'react'
import {
  Printer, X, Store, User, Calendar, CreditCard,
  CheckCircle2, Clock, AlertCircle, Phone, MapPin,
  Building2, Receipt, Truck, ArrowDownRight, ShieldCheck,
  Loader2
} from 'lucide-react'
import { formatIDR, formatDate } from '@/lib/format'
import { Button } from '@/components/ui/button'
import { cn } from '@/lib/utils'
import { terbilang } from '@/lib/invoice/invoiceUtils'

/**
 * Clean internal operational tags from customer-facing notes
 */
export function cleanCustomerNotes(notes) {
  if (!notes || typeof notes !== 'string') return ''
  return notes
    .replace(/\[Biaya Operasional:[^\]]*\]/gi, '')
    .replace(/\[Operasional:[^\]]*\]/gi, '')
    .replace(/Biaya Tambahan:[^\n]+/gi, '')
    .trim()
}

/**
 * SembakoInvoicePaper
 * Pure printable & responsive invoice paper component with premium aesthetics
 */
export function SembakoInvoicePaper({ data, mode = 'invoice' }) {
  if (!data) return null

  const isDelivery = mode === 'delivery'
  const companyName = data.tenant?.business_name || 'Gudang Juragans'
  const companyPhone = data.tenant?.phone || '-'
  const customerName = data.customerName || data.customer_name || 'Pelanggan Umum'
  const customerType = data.customerType || data.customer_type || 'perseorangan'
  const customerPhone = data.customerPhone || data.customer_phone || '-'
  const customerAddress = data.customerAddress || data.customer_address || ''

  const deliveryCost = Number(data.delivery_cost || data.deliveryCost || 0)
  const totalAmount = Number(data.total_amount || data.revenue || 0)
  const paidAmount = Number(data.paid_amount || data.payAmount || 0)
  const remainingAmount = Number(data.remaining_amount ?? Math.max(0, totalAmount - paidAmount))

  const paymentStatus = data.payment_status || (remainingAmount === 0 ? 'lunas' : paidAmount > 0 ? 'sebagian' : 'belum_lunas')
  const isLunas = paymentStatus === 'lunas'

  const rawItems = data.items || data.sembako_sale_items || []
  const items = Array.isArray(rawItems) ? rawItems : []
  const payments = Array.isArray(data.sembako_payments) ? data.sembako_payments : (Array.isArray(data.payments) ? data.payments : [])
  const validPayments = payments.filter(p => !p.is_deleted)

  const invoiceNo = data.invoiceNumber || data.invoice_number || 'SMB-2026-PREVIEW'
  const txnDate = data.transactionDate || data.transaction_date || new Date().toISOString()
  const dueDate = data.dueDate || data.due_date

  // Calculate items subtotal
  const calculatedItemsSubtotal = items.reduce((s, i) => {
    const qty = Number(i.quantity || i.quantity_kg || 0)
    const price = Number(i.sell_price ?? i.price_per_unit ?? i.price_per_kg ?? i.unit_price ?? 0)
    return s + (Number(i.subtotal) || (qty * price))
  }, 0)

  const itemsSubtotal = calculatedItemsSubtotal > 0
    ? calculatedItemsSubtotal
    : (deliveryCost > 0 && totalAmount > deliveryCost ? (totalAmount - deliveryCost) : totalAmount)

  const customerNotes = cleanCustomerNotes(data.notes)
  const terbilangText = terbilang(isLunas ? totalAmount : remainingAmount)

  return (
    <div className={cn(
      "bg-white text-slate-900 w-full max-w-[800px] mx-auto p-5 sm:p-8 md:p-10 flex flex-col font-sans rounded-2xl text-left border border-slate-200/90 shadow-2xl relative",
      "print:shadow-none print:max-w-full print:p-0 print:border-none print:rounded-none print:min-h-0"
    )} style={{ pageBreakInside: 'avoid' }}>
      
      {/* ── Top Header: Brand & Invoice Meta ── */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 pb-5 border-b-2 border-slate-800/90">
        {/* Left: Brand Identity */}
        <div className="flex items-start gap-3">
          <div className="w-11 h-11 sm:w-12 sm:h-12 rounded-xl bg-gradient-to-br from-slate-900 to-indigo-950 flex items-center justify-center text-white shadow-md shrink-0">
            {isDelivery ? <Truck size={22} className="text-amber-400" /> : <Store size={22} className="text-emerald-400" />}
          </div>
          <div className="space-y-0.5">
            <div className="flex items-center gap-2">
              <h1 className="text-lg sm:text-xl font-black text-slate-900 tracking-tight leading-tight">
                {companyName}
              </h1>
              <span className="hidden sm:inline-flex items-center gap-1 text-[10px] font-bold px-2 py-0.5 rounded-full bg-emerald-50 text-emerald-700 border border-emerald-200/70">
                <ShieldCheck size={11} /> Terverifikasi
              </span>
            </div>
            <p className="text-xs text-slate-600 font-medium flex items-center gap-1.5">
              <Phone size={12} className="text-slate-400" /> {companyPhone}
            </p>
            <p className="text-[11px] text-slate-400 font-medium">
              Platform Penjualan & Manajemen Bisnis Juragans
            </p>
          </div>
        </div>

        {/* Right: Invoice Type & Number */}
        <div className="sm:text-right w-full sm:w-auto bg-slate-50 sm:bg-transparent p-3 sm:p-0 rounded-xl border sm:border-0 border-slate-100">
          <div
            className="inline-flex items-center px-2.5 py-1 rounded-md text-[11px] font-black tracking-wider uppercase mb-1 shadow-sm"
            style={{ backgroundColor: '#0F172A', color: '#FFFFFF' }}
          >
            <span style={{ color: '#FFFFFF' }}>{isDelivery ? 'SURAT JALAN' : 'INVOICE RESMI'}</span>
          </div>
          <p className="text-xs font-mono font-bold text-slate-900 flex sm:justify-end items-center gap-1">
            <span className="text-slate-500 font-normal">No:</span> {invoiceNo}
          </p>
          <p className="text-[11px] text-slate-600 font-medium flex sm:justify-end items-center gap-1">
            <Calendar size={12} className="text-slate-400" /> {formatDate(txnDate)}
          </p>
          {dueDate && !isDelivery && (
            <p className="text-[11px] text-amber-700 font-bold flex sm:justify-end items-center gap-1 mt-0.5">
              <Clock size={12} className="text-amber-600" /> Jth Tempo: {formatDate(dueDate)}
            </p>
          )}
        </div>
      </div>

      {/* ── Status Banner ── */}
      {!isDelivery && (
        <div className="mt-4 mb-5">
          {paymentStatus === 'lunas' ? (
            <div className="flex items-center justify-between px-3.5 py-2 rounded-xl bg-emerald-50/90 border border-emerald-200 text-emerald-800">
              <div className="flex items-center gap-2">
                <CheckCircle2 size={16} className="text-emerald-600 shrink-0" />
                <span className="text-xs font-bold tracking-wide uppercase">FAKTUR LUNAS (PAID)</span>
              </div>
              <span className="text-[11px] font-semibold text-emerald-700">Pembayaran telah lunas</span>
            </div>
          ) : paymentStatus === 'sebagian' ? (
            <div className="flex items-center justify-between px-3.5 py-2 rounded-xl bg-blue-50/90 border border-blue-200 text-blue-800">
              <div className="flex items-center gap-2">
                <Clock size={16} className="text-blue-600 shrink-0" />
                <span className="text-xs font-bold tracking-wide uppercase">SEBAGIAN DIBAYAR (PARTIAL)</span>
              </div>
              <span className="text-[11px] font-semibold text-blue-700">Sisa {formatIDR(remainingAmount)}</span>
            </div>
          ) : (
            <div className="flex items-center justify-between px-3.5 py-2 rounded-xl bg-amber-50/90 border border-amber-200 text-amber-900">
              <div className="flex items-center gap-2">
                <AlertCircle size={16} className="text-amber-600 shrink-0" />
                <span className="text-xs font-bold tracking-wide uppercase">BELUM LUNAS (UNPAID)</span>
              </div>
              <span className="text-[11px] font-semibold text-amber-800">Menunggu Pelunasan</span>
            </div>
          )}
        </div>
      )}

      {/* ── Parties Info Card (Seller & Buyer) ── */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 sm:gap-4 mb-5">
        {/* Seller Info */}
        <div className="bg-slate-50/90 rounded-xl p-3.5 border border-slate-200/80 space-y-1">
          <div className="flex items-center gap-1.5 text-[10px] font-bold text-slate-500 uppercase tracking-wider">
            <Building2 size={12} className="text-slate-400" /> Diterbitkan Oleh (Seller)
          </div>
          <p className="text-sm font-black text-slate-900 leading-snug">{companyName}</p>
          <p className="text-xs text-slate-600 flex items-center gap-1">
            <Phone size={11} className="text-slate-400" /> {companyPhone}
          </p>
        </div>

        {/* Buyer Info */}
        <div className="bg-slate-50/90 rounded-xl p-3.5 border border-slate-200/80 space-y-1">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-1.5 text-[10px] font-bold text-slate-500 uppercase tracking-wider">
              <User size={12} className="text-slate-400" /> Ditujukan Kepada (Buyer)
            </div>
            {customerType && (
              <span className="text-[10px] font-extrabold uppercase px-2 py-0.5 rounded bg-indigo-100 text-indigo-800">
                {customerType}
              </span>
            )}
          </div>
          <p className="text-sm font-black text-slate-900 leading-snug">{customerName}</p>
          <div className="flex flex-wrap gap-x-3 text-xs text-slate-600">
            {customerPhone && customerPhone !== '-' && (
              <span className="flex items-center gap-1"><Phone size={11} className="text-slate-400" /> {customerPhone}</span>
            )}
            {customerAddress && (
              <span className="flex items-center gap-1"><MapPin size={11} className="text-slate-400" /> {customerAddress}</span>
            )}
          </div>
        </div>
      </div>

      {/* ── Product Items Table ── */}
      <div className="mb-5 overflow-hidden rounded-xl border border-slate-200 shadow-sm">
        <table className="w-full border-collapse text-left text-xs">
          <thead>
            <tr className="font-bold" style={{ backgroundColor: '#0F172A', color: '#FFFFFF' }}>
              <th className="py-2.5 px-3.5 text-left uppercase tracking-wider text-[11px]" style={{ color: '#FFFFFF' }}>Item Produk</th>
              <th className="py-2.5 px-3 text-center uppercase tracking-wider text-[11px]" style={{ color: '#FFFFFF' }}>Jumlah</th>
              {!isDelivery && (
                <th className="py-2.5 px-3 text-right uppercase tracking-wider text-[11px]" style={{ color: '#FFFFFF' }}>Harga Satuan</th>
              )}
              {!isDelivery && (
                <th className="py-2.5 px-3.5 text-right uppercase tracking-wider text-[11px]" style={{ color: '#FFFFFF' }}>Subtotal</th>
              )}
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100">
            {items.length > 0 ? (
              items.map((item, idx) => {
                const qty = Number(item.quantity || item.quantity_kg || 0)
                const price = Number(item.sell_price ?? item.price_per_unit ?? item.price_per_kg ?? item.unit_price ?? (qty > 0 && item.subtotal ? item.subtotal / qty : 0) ?? 0)
                const subtotal = Number(item.subtotal ?? Math.round(qty * price))
                const unit = item.unit || 'pcs'
                const rawName = item.product_name || '—'
                const matchPkg = rawName.match(/\[(\d+(?:\.\d+)?\s*[^\]]+)\]/)
                const pkgTag = matchPkg ? matchPkg[1] : null
                const cleanProdName = rawName.replace(/\s*\[\d+[^\]]+\]/g, '').trim()

                return (
                  <tr key={idx} className={cn("hover:bg-slate-50/80 transition-colors", idx % 2 === 0 ? "bg-white" : "bg-slate-50/40")}>
                    <td className="py-2.5 px-3.5 font-bold text-slate-900">
                      <div className="flex items-center gap-1.5 flex-wrap">
                        <span>{cleanProdName}</span>
                        {pkgTag && (
                          <span className="text-[10px] font-extrabold px-1.5 py-0.5 rounded bg-indigo-50 text-indigo-700 border border-indigo-200/60 uppercase">
                            {pkgTag}
                          </span>
                        )}
                      </div>
                    </td>
                    <td className="py-2.5 px-3 text-center font-medium text-slate-700">
                      <span className="font-bold text-slate-900">{qty}</span> <span className="text-slate-500 text-[11px]">{unit}</span>
                    </td>
                    {!isDelivery && (
                      <td className="py-2.5 px-3 text-right font-medium text-slate-700">{formatIDR(price)}</td>
                    )}
                    {!isDelivery && (
                      <td className="py-2.5 px-3.5 text-right font-black text-slate-900">{formatIDR(subtotal)}</td>
                    )}
                  </tr>
                )
              })
            ) : (
              <tr>
                <td colSpan={isDelivery ? 2 : 4} className="py-6 text-center text-slate-400 font-medium">
                  Tidak ada item produk
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>

      {/* ── Summary & Grand Total Block ── */}
      {!isDelivery && (
        <div className="flex flex-col sm:flex-row justify-between items-start gap-4 mb-5">
          {/* Left: Customer Notes */}
          <div className="w-full sm:flex-1 space-y-2">
            {customerNotes ? (
              <div className="bg-slate-50 rounded-xl p-3 border border-slate-200/80">
                <p className="text-[10px] font-bold text-slate-500 uppercase tracking-wider">Catatan Nota:</p>
                <p className="text-xs text-slate-700 font-medium mt-0.5 whitespace-pre-wrap">{customerNotes}</p>
              </div>
            ) : null}
          </div>

          {/* Right: Customer Bill Breakdown */}
          <div className="w-full sm:w-[340px] bg-slate-50/90 rounded-xl p-3.5 border border-slate-200 space-y-2">
            <div className="flex justify-between items-center text-xs text-slate-600">
              <span>Subtotal Produk</span>
              <span className="font-bold text-slate-900">{formatIDR(itemsSubtotal)}</span>
            </div>
            {deliveryCost > 0 && (
              <div className="flex justify-between items-center text-xs text-slate-600">
                <span>Ongkos Kirim</span>
                <span className="font-semibold text-slate-800">+{formatIDR(deliveryCost)}</span>
              </div>
            )}
            <div className="flex justify-between items-center text-xs pt-1.5 border-t border-slate-200">
              <span className="font-bold text-slate-800">Total Tagihan</span>
              <span className="font-black text-slate-900 text-sm">{formatIDR(totalAmount)}</span>
            </div>
            {paidAmount > 0 && (
              <div className="flex justify-between items-center text-xs text-emerald-700 font-semibold">
                <span>Sudah Dibayar</span>
                <span className="font-bold">-{formatIDR(paidAmount)}</span>
              </div>
            )}

            {/* High-Contrast Grand Total / Sisa Tagihan Box (Crystal Clear White Text on Dark Container) */}
            <div className="mt-2 pt-2 border-t border-slate-200">
              <div
                className="rounded-xl p-3.5 flex justify-between items-center shadow-lg transition-all"
                style={{
                  backgroundColor: isLunas ? '#047857' : '#0F172A',
                  color: '#FFFFFF',
                }}
              >
                <div>
                  <p
                    className="text-[10px] font-extrabold uppercase tracking-wider"
                    style={{ color: isLunas ? '#A7F3D0' : '#94A3B8' }}
                  >
                    {isLunas ? 'STATUS TAGIHAN' : 'SISA PEMBAYARAN'}
                  </p>
                  <p
                    className="text-xs font-black"
                    style={{ color: '#FFFFFF' }}
                  >
                    {isLunas ? 'LUNAS SEPENUHNYA' : 'SISA TAGIHAN'}
                  </p>
                </div>
                <div className="text-right">
                  <span
                    className="text-base sm:text-lg font-black tracking-tight font-mono"
                    style={{ color: '#FFFFFF' }}
                  >
                    {formatIDR(isLunas ? totalAmount : remainingAmount)}
                  </span>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* ── Terbilang Box ── */}
      {!isDelivery && (
        <div className="mb-5 bg-indigo-50/60 rounded-xl p-3 border-l-4 border-indigo-600 space-y-0.5">
          <p className="text-[10px] font-bold text-indigo-700 uppercase tracking-wider">
            TERBILANG ({isLunas ? 'TOTAL' : 'SISA TAGIHAN'})
          </p>
          <p className="text-xs font-bold italic text-slate-800 capitalize leading-relaxed">
            "{terbilangText || 'Nol rupiah'}"
          </p>
        </div>
      )}

      {/* ── Payment History (Riwayat Pembayaran Pelanggan) ── */}
      {!isDelivery && (validPayments.length > 0 || paidAmount > 0) && (
        <div className="mb-5 bg-slate-50 rounded-xl p-3.5 border border-slate-200 space-y-2">
          <div className="flex justify-between items-center border-b border-slate-200 pb-1.5">
            <p className="text-[10px] font-bold text-slate-700 uppercase tracking-wider flex items-center gap-1.5">
              <CreditCard size={13} className="text-slate-600" /> Riwayat Pembayaran Pelanggan
            </p>
            <p className="text-xs font-black text-emerald-700">
              Total Diterima: {formatIDR(paidAmount)}
            </p>
          </div>
          <div className="space-y-1.5">
            {validPayments.length > 0 ? (
              validPayments.map((p, pIdx) => (
                <div key={pIdx} className="flex justify-between items-center text-xs py-1.5 px-2.5 rounded-lg bg-white border border-slate-200/80 shadow-sm">
                  <span className="text-slate-700 font-medium flex items-center gap-2">
                    <span className="w-2 h-2 rounded-full bg-emerald-500 shrink-0" />
                    <span>{formatDate(p.payment_date || p.created_at)}</span>
                    <span className="text-slate-300">•</span>
                    <span className="font-bold uppercase text-slate-900 px-1.5 py-0.5 rounded bg-slate-100 text-[10px]">{p.payment_method || 'CASH'}</span>
                    {p.notes && <span className="text-slate-500 italic text-[11px]">({p.notes})</span>}
                  </span>
                  <span className="font-black text-slate-900 font-mono">{formatIDR(p.amount || p.amount_paid)}</span>
                </div>
              ))
            ) : (
              <div className="flex justify-between items-center text-xs py-1.5 px-2.5 rounded-lg bg-white border border-slate-200/80 shadow-sm">
                <span className="text-slate-700 font-medium flex items-center gap-2">
                  <span className="w-2 h-2 rounded-full bg-emerald-500 shrink-0" />
                  <span>{formatDate(txnDate)}</span>
                  <span className="text-slate-300">•</span>
                  <span className="font-bold uppercase text-slate-900 px-1.5 py-0.5 rounded bg-slate-100 text-[10px]">PEMBAYARAN SAAT TRANSAKSI</span>
                </span>
                <span className="font-black text-slate-900 font-mono">{formatIDR(paidAmount)}</span>
              </div>
            )}
          </div>
        </div>
      )}

      {/* ── Surat Jalan Delivery Notes ── */}
      {isDelivery && customerNotes && (
        <div className="mb-5 bg-slate-50 rounded-xl p-3 border border-slate-200/80">
          <p className="text-[10px] font-bold text-slate-500 uppercase tracking-wider">Catatan Pengiriman:</p>
          <p className="text-xs text-slate-700 font-medium mt-0.5 whitespace-pre-wrap">{customerNotes}</p>
        </div>
      )}

      {/* ── Signatures ── */}
      <div className="mt-4 pt-4 border-t border-slate-200 grid grid-cols-2 gap-8 text-center">
        <div className="space-y-10">
          <p className="text-xs font-semibold text-slate-500">Hormat Kami (Penjual),</p>
          <div>
            <div className="w-36 h-[1px] bg-slate-400 mx-auto mb-1" />
            <p className="text-xs font-bold text-slate-900">{companyName}</p>
            <p className="text-[10px] text-slate-400">Pihak Toko / Distributor</p>
          </div>
        </div>
        <div className="space-y-10">
          <p className="text-xs font-semibold text-slate-500">Diterima Oleh (Pembeli),</p>
          <div>
            <div className="w-36 h-[1px] bg-slate-400 mx-auto mb-1" />
            <p className="text-xs font-bold text-slate-900">{customerName}</p>
            <p className="text-[10px] text-slate-400">Pihak Pelanggan</p>
          </div>
        </div>
      </div>

      {/* ── Footer ── */}
      <div className="mt-6 pt-3 border-t border-slate-100 text-center">
        <p className="text-[10px] text-slate-400 font-medium">
          Faktur Sah Dicetak Otomatis oleh Sistem POS • Ref: {invoiceNo} • {formatDate(txnDate)}
        </p>
      </div>

    </div>
  )
}

/**
 * SembakoThermalReceipt
 * Ultra-crisp 58mm / 80mm POS Thermal Receipt Component
 * Designed for Bluetooth Thermal Printers & Quick Mobile Receipts
 */
export function SembakoThermalReceipt({ data }) {
  if (!data) return null

  const companyName = data.tenant?.business_name || 'Gudang Juragans'
  const companyPhone = data.tenant?.phone || '-'
  const companyAddress = data.tenant?.location || ''
  const customerName = data.customerName || data.customer_name || 'Pelanggan Umum'
  const customerPhone = data.customerPhone || data.customer_phone || '-'

  const deliveryCost = Number(data.delivery_cost || data.deliveryCost || 0)
  const otherCost = Number(data.other_cost || data.otherCost || 0)
  const totalAmount = Number(data.total_amount || data.revenue || 0)
  const paidAmount = Number(data.paid_amount || data.payAmount || 0)
  const remainingAmount = Number(data.remaining_amount ?? Math.max(0, totalAmount - paidAmount))

  const paymentStatus = data.payment_status || (remainingAmount === 0 ? 'lunas' : paidAmount > 0 ? 'sebagian' : 'belum_lunas')
  const isLunas = paymentStatus === 'lunas'

  const rawItems = data.items || data.sembako_sale_items || []
  const items = Array.isArray(rawItems) ? rawItems : []

  const invoiceNo = data.invoiceNumber || data.invoice_number || 'SMB-POS'
  const txnDate = data.transactionDate || data.transaction_date || new Date().toISOString()
  const customerNotes = cleanCustomerNotes(data.notes)

  return (
    <div className={cn(
      "bg-white text-slate-900 w-full max-w-[360px] mx-auto p-4 sm:p-5 flex flex-col font-mono text-left rounded-xl border border-slate-300 shadow-xl relative",
      "print:shadow-none print:max-w-full print:p-0 print:border-none print:rounded-none"
    )} style={{ pageBreakInside: 'avoid', fontSize: '11px', lineHeight: '1.4' }}>
      
      {/* ── Header ── */}
      <div className="text-center pb-3 border-b border-dashed border-slate-400">
        <h2 className="text-sm font-black tracking-tight uppercase text-slate-900">{companyName}</h2>
        {companyAddress && <p className="text-[10px] text-slate-600 mt-0.5">{companyAddress}</p>}
        {companyPhone && companyPhone !== '-' && <p className="text-[10px] text-slate-600">Telp: {companyPhone}</p>}
      </div>

      {/* ── Metadata ── */}
      <div className="py-2.5 border-b border-dashed border-slate-400 text-[10px] space-y-1">
        <div className="flex justify-between">
          <span className="text-slate-500">No. Struk:</span>
          <span className="font-bold text-slate-900">{invoiceNo}</span>
        </div>
        <div className="flex justify-between">
          <span className="text-slate-500">Tanggal:</span>
          <span className="text-slate-900">{formatDate(txnDate, true)}</span>
        </div>
        <div className="flex justify-between">
          <span className="text-slate-500">Pelanggan:</span>
          <span className="font-bold text-slate-900">{customerName}</span>
        </div>
        {customerPhone && customerPhone !== '-' && (
          <div className="flex justify-between">
            <span className="text-slate-500">Kontak:</span>
            <span className="text-slate-900">{customerPhone}</span>
          </div>
        )}
      </div>

      {/* ── Items ── */}
      <div className="py-2.5 border-b border-dashed border-slate-400 space-y-2">
        {items.map((item, idx) => {
          const qty = Number(item.quantity || item.quantity_kg || 0)
          const price = Number(item.sell_price ?? item.price_per_unit ?? item.price_per_kg ?? item.unit_price ?? (qty > 0 && item.subtotal ? item.subtotal / qty : 0) ?? 0)
          const subtotal = Number(item.subtotal ?? Math.round(qty * price))
          const unit = item.unit || 'pcs'
          const rawName = item.product_name || 'Item'
          const cleanName = rawName.replace(/\s*\[\d+[^\]]+\]/g, '').trim()

          return (
            <div key={idx} className="space-y-0.5">
              <div className="font-bold text-slate-900 truncate">{cleanName}</div>
              <div className="flex justify-between text-slate-600 text-[10px]">
                <span>{qty} {unit} x {formatIDR(price)}</span>
                <span className="font-bold text-slate-900">{formatIDR(subtotal)}</span>
              </div>
            </div>
          )
        })}
      </div>

      {/* ── Total Breakdown ── */}
      <div className="py-2.5 border-b border-dashed border-slate-400 space-y-1 text-[11px]">
        {deliveryCost > 0 && (
          <div className="flex justify-between text-slate-600">
            <span>Ongkos Kirim:</span>
            <span>+{formatIDR(deliveryCost)}</span>
          </div>
        )}
        {otherCost > 0 && (
          <div className="flex justify-between text-slate-600">
            <span>Biaya Lain:</span>
            <span>+{formatIDR(otherCost)}</span>
          </div>
        )}
        <div className="flex justify-between font-black text-xs pt-1 text-slate-900">
          <span>TOTAL:</span>
          <span>{formatIDR(totalAmount)}</span>
        </div>
        <div className="flex justify-between text-slate-700">
          <span>Bayar:</span>
          <span>{formatIDR(paidAmount)}</span>
        </div>
        <div className="flex justify-between font-bold text-slate-900 pt-0.5">
          <span>{isLunas ? 'KEMBALI / SISA:' : 'SISA TAGIHAN:'}</span>
          <span>{formatIDR(remainingAmount)}</span>
        </div>
      </div>

      {/* ── Status Badge ── */}
      <div className="py-2.5 text-center border-b border-dashed border-slate-400">
        <div className={cn(
          "inline-block px-3 py-1 rounded font-black text-[11px] tracking-wider uppercase",
          isLunas ? "bg-slate-900 text-white" : "bg-slate-200 text-slate-900"
        )}>
          STATUS: {isLunas ? 'LUNAS (PAID)' : 'BELUM LUNAS / TEMPO'}
        </div>
      </div>

      {/* ── Notes ── */}
      {customerNotes && (
        <div className="py-2 text-[10px] text-slate-600 border-b border-dashed border-slate-400">
          <span className="font-bold">Ket: </span>{customerNotes}
        </div>
      )}

      {/* ── Footer ── */}
      <div className="pt-3 text-center text-[9px] text-slate-500 space-y-0.5">
        <p className="font-bold text-slate-700">TERIMA KASIH ATAS KUNJUNGAN ANDA</p>
        <p>Barang yang sudah dibeli tidak dapat ditukar kecuali perjanjian</p>
        <p className="text-[8px] text-slate-400 pt-1">Dicetak melalui Juragans Dashboard</p>
      </div>

    </div>
  )
}

/**
 * SembakoInvoicePreview
 * Printable Modal Wrapper with High Z-Index, Format Switcher (A4 vs Thermal POS),
 * Universal PDF Download & Direct WhatsApp Share
 */
export default function SembakoInvoicePreview({ data, mode = 'invoice', onClose }) {
  const [viewFormat, setViewFormat] = React.useState('a4') // 'a4' | 'thermal'
  const [isExporting, setIsExporting] = React.useState(false)

  if (!data) return null

  const isDelivery = mode === 'delivery'
  const invNo = data.invoiceNumber || data.invoice_number || 'Faktur'

  const handlePrint = () => {
    window.print()
  }

  const handleShareWA = () => {
    try {
      import('@/lib/invoice/pdfExportHelper').then(({ shareInvoiceViaWhatsApp }) => {
        shareInvoiceViaWhatsApp(data)
      })
    } catch (e) {
      console.error('Error sharing WA:', e)
    }
  }

  const handleDownloadPDF = async () => {
    try {
      setIsExporting(true)
      const { exportInvoicePDF } = await import('@/lib/invoice/pdfExportHelper')
      const { SembakoInvoice } = await import('@/components/invoice/templates/SembakoInvoice')
      const { toast } = await import('sonner')

      const rawItems = data.items || data.sembako_sale_items || []
      const normalizedItems = rawItems.map(item => {
        const qty = Number(item.quantity || item.quantity_kg || item.qty || 0)
        const price = Number(item.price_per_unit ?? item.sell_price ?? item.unit_price ?? item.price ?? item.price_per_kg ?? (qty > 0 && item.subtotal ? item.subtotal / qty : 0) ?? 0)
        const cost = Number(item.cogs_per_unit ?? item.cost_per_unit ?? item.cost_per_kg ?? item.cogs ?? 0)
        const subtotal = Number(item.subtotal ?? Math.round(qty * price))
        return {
          product_name: item.product_name || item.sembako_products?.product_name || 'Produk',
          quantity: qty,
          quantity_kg: qty,
          unit: item.unit || item.sembako_products?.unit || 'pcs',
          price_per_unit: price,
          sell_price: price,
          price_per_kg: price,
          cost_per_unit: cost,
          cost_per_kg: cost,
          subtotal: subtotal
        }
      })

      const totalAmount = Number(data.total_amount || data.revenue || 0)
      const paidAmount = Number(data.paid_amount || data.payAmount || 0)
      const remainingAmount = Number(data.remaining_amount ?? Math.max(0, totalAmount - paidAmount))
      const paymentStatus = data.payment_status || (remainingAmount === 0 ? 'lunas' : paidAmount > 0 ? 'sebagian' : 'belum_lunas')
      const payments = Array.isArray(data.sembako_payments) ? data.sembako_payments : (Array.isArray(data.payments) ? data.payments : [])

      const doc = (
        <SembakoInvoice
          tenant={data.tenant || { business_name: 'Juragans', phone: '-' }}
          invoice={{
            invoice_number: invNo,
            transaction_date: data.transactionDate || data.transaction_date || new Date().toISOString(),
            due_date: data.dueDate || data.due_date,
            total_amount: totalAmount,
            paid_amount: paidAmount,
            remaining_amount: remainingAmount,
            delivery_cost: Number(data.delivery_cost || data.deliveryCost || 0),
            other_cost: Number(data.other_cost || data.otherCost || 0),
            payment_status: paymentStatus,
            notes: data.notes || '',
            sembako_payments: payments,
          }}
          customer={{
            customer_name: data.customerName || data.customer_name || 'Customer',
            customer_type: data.customerType || data.customer_type || 'perseorangan',
            phone: data.customerPhone || data.customer_phone || '-',
            address: data.customerAddress || data.customer_address || '',
          }}
          items={normalizedItems}
          payments={payments}
          invoiceNumber={invNo}
          generatedBy={data.generatedBy || 'Admin Juragans'}
          showProfit={data.showProfit ?? false}
        />
      )

      toast.info('Menyiapkan file PDF...')
      const res = await exportInvoicePDF(doc, `Invoice_${invNo}.pdf`, { invoiceNumber: invNo })
      if (res.success) {
        toast.success('Faktur berhasil disiapkan!')
      }
    } catch (err) {
      console.error('Download PDF error:', err)
      const { toast } = await import('sonner')
      toast.error('Gagal membuat PDF. Silakan coba lagi.')
    } finally {
      setIsExporting(false)
    }
  }

  return (
    <div className="fixed inset-0 z-[9999] bg-slate-950/85 backdrop-blur-md flex flex-col items-center justify-start p-0 sm:p-4 md:p-6 overflow-y-auto print:p-0 print:bg-white print:relative print:z-0">
      
      {/* ── Top Floating Action Bar ── */}
      <div
        className="sticky top-0 z-50 w-full max-w-[800px] border-b sm:border sm:rounded-2xl px-3 sm:px-4 py-2.5 sm:py-3 mb-3 flex flex-wrap items-center justify-between gap-2 shadow-2xl shrink-0 print:hidden"
        style={{ background: '#0F172A', borderColor: '#1E293B', color: '#FFFFFF' }}
      >
        <div className="flex items-center gap-2">
          <div className="w-8 h-8 rounded-lg bg-emerald-500/20 text-emerald-400 flex items-center justify-center font-bold shrink-0">
            <Receipt size={18} />
          </div>
          <div>
            <h3 className="text-xs sm:text-sm font-black leading-tight" style={{ color: '#FFFFFF' }}>
              Preview {isDelivery ? 'Surat Jalan' : (viewFormat === 'thermal' ? 'Struk Kasir 58/80mm' : 'Faktur Penjualan')}
            </h3>
            <p className="text-[10px] font-mono font-bold" style={{ color: '#94A3B8' }}>
              {invNo}
            </p>
          </div>
        </div>

        {/* Format Selector Toggle */}
        {!isDelivery && (
          <div className="flex items-center bg-slate-800 p-0.5 rounded-lg border border-slate-700 text-[10px] font-bold">
            <button
              onClick={() => setViewFormat('a4')}
              className={cn(
                "px-2.5 py-1 rounded-md transition-all font-bold",
                viewFormat === 'a4' ? "bg-amber-500 text-slate-950 font-black shadow" : "text-slate-300 hover:text-white"
              )}
            >
              Faktur A4
            </button>
            <button
              onClick={() => setViewFormat('thermal')}
              className={cn(
                "px-2.5 py-1 rounded-md transition-all font-bold",
                viewFormat === 'thermal' ? "bg-amber-500 text-slate-950 font-black shadow" : "text-slate-300 hover:text-white"
              )}
            >
              Struk Thermal
            </button>
          </div>
        )}

        {/* Actions */}
        <div className="flex items-center gap-1.5 sm:gap-2 ml-auto">
          {/* WhatsApp Share */}
          <Button
            onClick={handleShareWA}
            size="sm"
            className="bg-emerald-600 hover:bg-emerald-500 text-white font-bold gap-1 shadow-md text-[11px] h-8 px-2.5 sm:px-3 rounded-xl border-none active:scale-95 transition-all"
            title="Kirim ke WhatsApp"
          >
            <Phone size={13} /> <span className="hidden sm:inline">WhatsApp</span>
          </Button>

          {/* Download PDF */}
          <Button
            onClick={handleDownloadPDF}
            disabled={isExporting}
            size="sm"
            className="bg-amber-500 hover:bg-amber-400 text-slate-950 font-black gap-1 shadow-md text-[11px] h-8 px-2.5 sm:px-3 rounded-xl border-none active:scale-95 transition-all"
            title="Download PDF"
          >
            {isExporting ? <Loader2 size={13} className="animate-spin" /> : <Truck size={13} className="hidden" />}
            <span>{isExporting ? 'Proses...' : 'PDF'}</span>
          </Button>

          {/* Print Button */}
          <Button
            onClick={handlePrint}
            size="sm"
            className="border font-bold gap-1 text-[11px] h-8 px-2.5 sm:px-3 rounded-xl active:scale-95 transition-all shadow-sm flex items-center justify-center cursor-pointer"
            style={{ color: '#F8FAFC', backgroundColor: '#1E293B', borderColor: '#334155' }}
            title="Cetak Faktur"
          >
            <Printer size={13} color="#F8FAFC" /> <span className="hidden sm:inline">Cetak</span>
          </Button>

          {/* Close */}
          <Button
            onClick={onClose}
            size="sm"
            className="border h-8 w-8 p-0 rounded-xl active:scale-95 transition-all ml-1 shadow-sm flex items-center justify-center cursor-pointer"
            style={{ color: '#F8FAFC', backgroundColor: '#1E293B', borderColor: '#334155' }}
            title="Tutup"
          >
            <X size={16} color="#F8FAFC" />
          </Button>
        </div>
      </div>

      {/* ── Paper Container (with safe area bottom padding to prevent bottom nav overlap) ── */}
      <div className="w-full max-w-[800px] pb-36 sm:pb-12 print:pb-0 flex justify-center">
        {viewFormat === 'thermal' && !isDelivery ? (
          <SembakoThermalReceipt data={data} />
        ) : (
          <SembakoInvoicePaper data={data} mode={mode} />
        )}
      </div>
    </div>
  )
}

