import React, { useState } from 'react'
import {
  Printer, X, Factory, User, Calendar, CreditCard,
  CheckCircle2, Clock, AlertCircle, Phone, MapPin,
  Building2, Receipt, Share2, Copy, Check, FileText, Edit3
} from 'lucide-react'
import { formatIDR, formatDate } from '@/lib/format'
import { Button } from '@/components/ui/button'
import { cn } from '@/lib/utils'
import { terbilang } from '@/lib/invoice/invoiceUtils'
import { toast } from 'sonner'

/**
 * SembakoPurchaseInvoicePaper
 * High-fidelity printable paper component matching invoice_tagihan_pabrik_3kg.pdf
 */
export function SembakoPurchaseInvoicePaper({ data }) {
  if (!data) return null

  const companyName = data.tenant_name || data.tenant?.business_name || 'Juragan by Anak Bawang'
  const supplierName = data.supplier_name || 'Pabrik Bawang Boyolali'
  const supplierPhone = data.supplier_phone || '-'
  const supplierAddress = data.supplier_address || ''
  const invoiceNo = data.invoice_number || 'INV/PABRIK/2026/08/001'
  const txnDate = data.transaction_date || new Date().toISOString()
  const dueDate = data.due_date || null
  const paymentStatus = data.payment_status || 'lunas'
  const isLunas = paymentStatus === 'lunas'
  const isTempo = paymentStatus === 'tempo' || paymentStatus === 'belum_lunas'
  const paymentMethod = data.payment_method || 'Dana Pribadi Owner (Sdr. Fahru)'
  const recipient = data.recipient || 'Owner (Juragan by Anak Bawang)'

  const items = Array.isArray(data.items) ? data.items : []
  const totalAmount = Number(data.total_amount || 0)
  const paidAmount = Number(data.paid_amount || (isLunas ? totalAmount : 0))
  const remainingDebt = Number(data.remaining_debt ?? Math.max(0, totalAmount - paidAmount))

  // Calculate total quantity by unit (e.g. 3,00 kg or pcs)
  let kgSum = 0
  let pcsSum = 0
  let otherSum = 0
  let primaryUnit = 'kg'

  items.forEach(item => {
    const q = Number(item.quantity || 0)
    const u = (item.unit || '').toLowerCase()
    if (u === 'kg') kgSum += q
    else if (u === 'pcs' || u === 'lembar' || u === 'pack') pcsSum += q
    else otherSum += q
  })

  let totalQtyFormatted = '0'
  if (kgSum > 0 && pcsSum === 0) {
    totalQtyFormatted = `${kgSum.toLocaleString('id-ID', { minimumFractionDigits: 2, maximumFractionDigits: 2 })} kg`
  } else if (pcsSum > 0 && kgSum === 0) {
    totalQtyFormatted = `${pcsSum.toLocaleString('id-ID')} pcs`
  } else if (kgSum > 0 && pcsSum > 0) {
    totalQtyFormatted = `${kgSum.toLocaleString('id-ID', { minimumFractionDigits: 2, maximumFractionDigits: 2 })} kg + ${pcsSum.toLocaleString('id-ID')} pcs`
  } else {
    totalQtyFormatted = `${Number(data.total_quantity || 0).toLocaleString('id-ID')} item`
  }

  // Parse notes into numbered bullet points
  const rawNotes = (data.notes || '').trim()
  let noteLines = []
  if (rawNotes) {
    noteLines = rawNotes
      .split('\n')
      .map(line => line.trim())
      .filter(line => line.length > 0)
  }

  // Fallback default operational notes if empty
  if (noteLines.length === 0) {
    const itemSummary = items.map(i => `${i.quantity} ${i.unit || 'kg'} ${i.product_name || i.item_name}`).join(' dan ')
    noteLines = [
      `Pengambilan stok ini terdiri dari ${itemSummary || 'pengadaan barang pabrik'}.`,
      isLunas
        ? `Tagihan sebesar ${formatIDR(totalAmount)} telah LUNAS TERBAYAR menggunakan ${paymentMethod}.`
        : `Tagihan sebesar ${formatIDR(totalAmount)} berstatus TEMPO dengan sisa hutang ${formatIDR(remainingDebt)}${dueDate ? ` (Jatuh tempo: ${formatDate(dueDate)})` : ''}.`,
      `Faktur ini merupakan bukti sah pencatatan HPP Modal stok masuk sistem inventaris FIFO.`
    ]
  }

  return (
    <div
      className={cn(
        "bg-white text-slate-900 w-full max-w-[800px] mx-auto p-6 sm:p-10 md:p-12 flex flex-col font-sans rounded-2xl text-left border border-slate-200/90 shadow-2xl relative",
        "print:shadow-none print:max-w-full print:p-0 print:border-none print:rounded-none print:min-h-0 print:text-black"
      )}
      style={{ pageBreakInside: 'avoid' }}
    >
      {/* ── 1. Top Header (Brand & Document Title) ── */}
      <div className="pb-3">
        <p className="text-xs sm:text-sm font-black uppercase tracking-widest text-[#0EA5E9] mb-1">
          {companyName.toUpperCase()}
        </p>
        <h1 className="text-xl sm:text-2xl md:text-[26px] font-black text-[#1E293B] tracking-tight leading-tight uppercase">
          INVOICE TAGIHAN PENGAMBILAN STOK PABRIK
        </h1>
      </div>

      {/* Horizontal Divider 2px #0EA5E9 */}
      <div className="w-full h-0.5 bg-[#0EA5E9] mb-5" />

      {/* ── 2. Metadata Grid (2 Columns, Card Border) ── */}
      <div className="rounded-xl border border-slate-200 bg-[#F8FAFC] p-4 sm:p-5 mb-6 text-xs text-slate-700 grid grid-cols-1 sm:grid-cols-2 gap-y-2.5 gap-x-6">
        {/* Left Column */}
        <div className="space-y-2">
          <div className="flex items-baseline gap-1.5">
            <span className="font-bold text-slate-900 shrink-0">No. Invoice:</span>
            <span className="font-mono font-bold text-slate-800">{invoiceNo}</span>
          </div>
          <div className="flex items-baseline gap-1.5">
            <span className="font-bold text-slate-900 shrink-0">Penerbit Tagihan:</span>
            <span className="font-semibold text-slate-800">{supplierName}</span>
          </div>
          <div className="flex items-baseline gap-1.5">
            <span className="font-bold text-slate-900 shrink-0">Status Pembayaran:</span>
            {isLunas ? (
              <span className="font-black text-[#059669]">
                LUNAS ({paymentMethod})
              </span>
            ) : isTempo ? (
              <span className="font-black text-[#DC2626]">
                TEMPO / HUTANG {dueDate ? `(Jth: ${formatDate(dueDate)})` : ''}
              </span>
            ) : (
              <span className="font-black text-[#2563EB]">
                SEBAGIAN (Sisa {formatIDR(remainingDebt)})
              </span>
            )}
          </div>
        </div>

        {/* Right Column */}
        <div className="space-y-2">
          <div className="flex items-baseline gap-1.5">
            <span className="font-bold text-slate-900 shrink-0">Tanggal:</span>
            <span className="font-medium text-slate-800">{formatDate(txnDate)}</span>
          </div>
          <div className="flex items-baseline gap-1.5">
            <span className="font-bold text-slate-900 shrink-0">Ditujukan Kepada:</span>
            <span className="font-medium text-slate-800">{recipient}</span>
          </div>
          <div className="flex items-baseline gap-1.5">
            <span className="font-bold text-slate-900 shrink-0">Metode:</span>
            <span className="font-medium text-slate-800">{paymentMethod}</span>
          </div>
        </div>
      </div>

      {/* ── 3. Product Items Table ── */}
      <div className="mb-4 overflow-hidden rounded-xl border border-slate-200 shadow-xs">
        <table className="w-full border-collapse text-left text-xs">
          <thead>
            <tr style={{ backgroundColor: '#0F172A', color: '#FFFFFF' }}>
              <th className="py-3 px-3.5 text-center font-black uppercase tracking-wider text-[11px] w-12" style={{ color: '#FFFFFF' }}>
                No
              </th>
              <th className="py-3 px-3 font-black uppercase tracking-wider text-[11px]" style={{ color: '#FFFFFF' }}>
                Deskripsi Produk / Varian
              </th>
              <th className="py-3 px-3 text-center font-black uppercase tracking-wider text-[11px] w-28" style={{ color: '#FFFFFF' }}>
                Kuantitas
              </th>
              <th className="py-3 px-3 text-right font-black uppercase tracking-wider text-[11px] w-36" style={{ color: '#FFFFFF' }}>
                Harga Satuan Pabrik
              </th>
              <th className="py-3 px-3.5 text-right font-black uppercase tracking-wider text-[11px] w-36" style={{ color: '#FFFFFF' }}>
                Subtotal Tagihan
              </th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100">
            {items.length > 0 ? (
              items.map((item, idx) => {
                const qty = Number(item.quantity || 0)
                const unit = item.unit || 'kg'
                const price = Number(item.unit_price || 0)
                const subtotal = Number(item.subtotal || (qty * price))
                const rawName = item.product_name || item.item_name || 'Barang Pabrik'
                const cat = item.category || ''

                return (
                  <tr
                    key={idx}
                    className={cn(
                      "transition-colors",
                      idx % 2 === 0 ? "bg-white" : "bg-[#F8FAFC]"
                    )}
                  >
                    <td className="py-3 px-3.5 text-center font-bold text-slate-500">
                      {idx + 1}
                    </td>
                    <td className="py-3 px-3 text-slate-900">
                      <p className="font-bold text-slate-900 leading-snug">{rawName}</p>
                      {item.notes && (
                        <p className="text-[10px] text-slate-500 mt-0.5">{item.notes}</p>
                      )}
                      {cat && (
                        <span className="inline-block mt-0.5 text-[9px] font-bold uppercase tracking-wider text-slate-400">
                          {cat.replace(/_/g, ' ')}
                        </span>
                      )}
                    </td>
                    <td className="py-3 px-3 text-center font-bold text-slate-800 whitespace-nowrap">
                      {qty.toLocaleString('id-ID')} {unit}
                    </td>
                    <td className="py-3 px-3 text-right font-medium text-slate-700 whitespace-nowrap">
                      {formatIDR(price)} / {unit}
                    </td>
                    <td className="py-3 px-3.5 text-right font-black text-slate-900 whitespace-nowrap">
                      {formatIDR(subtotal)}
                    </td>
                  </tr>
                )
              })
            ) : (
              <tr>
                <td colSpan={5} className="py-6 text-center text-slate-400">
                  Tidak ada rincian item
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>

      {/* ── 4. Total Accumulation Cyan Highlight Bar ── */}
      <div className="w-full bg-[#E0F2FE] border border-[#BAE6FD] rounded-xl px-4 py-3 mb-6 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-2 shadow-xs">
        <div className="flex items-center gap-2">
          <span className="font-black text-[11px] sm:text-xs tracking-wider text-slate-800 uppercase">
            TOTAL KUANTITAS:
          </span>
          <span className="font-mono font-black text-xs sm:text-sm text-slate-900">
            {totalQtyFormatted}
          </span>
        </div>
        <div className="flex items-center gap-2 sm:text-right">
          <span className="font-black text-[11px] sm:text-xs tracking-wider text-slate-800 uppercase">
            TOTAL AKUMULASI TAGIHAN:
          </span>
          <span className="font-mono font-black text-sm sm:text-base md:text-lg text-[#0F766E] shrink-0">
            {formatIDR(totalAmount)}
          </span>
        </div>
      </div>

      {/* ── 5. Catatan Pembayaran & Operasional ── */}
      <div className="text-xs text-slate-700 space-y-2 mb-4">
        <h3 className="font-black text-slate-900 flex items-center gap-1.5 text-xs">
          <span>■</span> Catatan Pembayaran & Operasional:
        </h3>
        <div className="space-y-1.5 pl-4 leading-relaxed">
          {noteLines.map((line, idx) => {
            // If already has "1. ", "2. ", show directly, otherwise prepend index
            const isNumbered = /^\d+[\.\)]\s*/.test(line)
            return (
              <p key={idx} className="text-slate-700">
                {isNumbered ? line : `${idx + 1}. ${line}`}
              </p>
            )
          })}
        </div>
      </div>

      {/* ── Footer Timestamp & Verification ── */}
      <div className="mt-8 pt-4 border-t border-slate-200 text-[10px] text-slate-600 flex flex-col sm:flex-row justify-between items-center gap-2 print:text-black">
        <p>Dicetak via Platform Juragan by Anak Bawang — Sistem Inventaris FIFO</p>
        <p className="font-mono">{invoiceNo} • {new Date().toLocaleString('id-ID')}</p>
      </div>
    </div>
  )
}

/**
 * SembakoPurchaseInvoicePreviewModal
 * Fullscreen / modal wrapper with action buttons (Print, Download, Share, Close)
 */
export function SembakoPurchaseInvoicePreviewModal({ isOpen, onClose, data, onOpenEdit }) {
  const [copied, setCopied] = useState(false)

  if (!isOpen || !data) return null

  const handlePrint = () => {
    window.print()
  }

  const handleCopy = () => {
    const items = Array.isArray(data.items) ? data.items : []
    const itemLines = items.map((it, idx) => `${idx + 1}. ${it.product_name || it.item_name}: ${it.quantity} ${it.unit} @ ${formatIDR(it.unit_price)} = ${formatIDR(it.subtotal)}`).join('\n')
    const text = `*FAKTUR TAGIHAN PABRIK*\nNo: ${data.invoice_number}\nSupplier: ${data.supplier_name}\nTanggal: ${formatDate(data.transaction_date)}\nStatus: ${data.payment_status?.toUpperCase()}\nMetode: ${data.payment_method}\n\n*RINCIAN ITEM:*\n${itemLines}\n\n*TOTAL TAGIHAN:* ${formatIDR(data.total_amount)}\n\nCatatan:\n${data.notes || '-'}`

    navigator.clipboard.writeText(text)
    setCopied(true)
    toast.success('Rincian faktur disalin ke clipboard!')
    setTimeout(() => setCopied(false), 2000)
  }

  const handleShareWhatsApp = () => {
    const items = Array.isArray(data.items) ? data.items : []
    const itemLines = items.map((it, idx) => `${idx + 1}. ${it.product_name || it.item_name}: ${it.quantity} ${it.unit} = ${formatIDR(it.subtotal)}`).join('%0A')
    const msg = `*FAKTUR PEMBELIAN PABRIK*%0ANo: ${encodeURIComponent(data.invoice_number)}%0ASupplier: ${encodeURIComponent(data.supplier_name)}%0ATanggal: ${encodeURIComponent(formatDate(data.transaction_date))}%0AStatus: ${encodeURIComponent(data.payment_status?.toUpperCase())}%0ATotal: ${encodeURIComponent(formatIDR(data.total_amount))}%0A%0A*Item:*%0A${itemLines}`
    window.open(`https://wa.me/?text=${msg}`, '_blank')
  }

  return (
    <div className="fixed inset-0 z-[9999] bg-slate-950/85 backdrop-blur-md flex flex-col items-center justify-start p-0 sm:p-4 md:p-6 overflow-y-auto print:p-0 print:bg-white print:relative print:z-0">
      {/* ── Toolbar (Hidden on Print) ── */}
      <div className="sticky top-0 z-50 w-full max-w-[800px] bg-slate-900 border-b sm:border border-slate-700/80 sm:rounded-2xl px-3 sm:px-4 py-2.5 sm:py-3 mb-3 flex flex-wrap items-center justify-between gap-2 shadow-2xl shrink-0 print:hidden text-white">
        <div className="flex items-center gap-2">
          <div className="w-7 h-7 rounded-lg bg-[#0EA5E9]/20 flex items-center justify-center text-[#0EA5E9]">
            <Factory size={16} />
          </div>
          <div>
            <h2 className="text-xs sm:text-sm font-black text-white leading-tight">
              Faktur Tagihan Pabrik
            </h2>
            <p className="text-[10px] text-slate-400 font-mono">
              {data.invoice_number}
            </p>
          </div>
        </div>

        <div className="flex items-center gap-1.5">
          {onOpenEdit && (
            <Button
              size="sm"
              onClick={() => {
                onClose()
                onOpenEdit(data)
              }}
              className="h-8 px-2.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-200 hover:text-white text-xs font-bold gap-1.5 border border-slate-700 cursor-pointer"
              title="Edit faktur ini"
            >
              <Edit3 size={13} className="text-sky-400" />
              <span className="hidden sm:inline">Edit</span>
            </Button>
          )}

          <Button
            size="sm"
            onClick={handleCopy}
            className="h-8 px-2.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs font-bold gap-1.5 border border-slate-700"
          >
            {copied ? <Check size={13} className="text-emerald-400" /> : <Copy size={13} />}
            <span className="hidden sm:inline">Salin</span>
          </Button>

          <Button
            size="sm"
            onClick={handleShareWhatsApp}
            className="h-8 px-2.5 rounded-lg bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-bold gap-1.5 shadow-sm"
          >
            <Share2 size={13} />
            <span className="hidden sm:inline">WhatsApp</span>
          </Button>

          <Button
            size="sm"
            onClick={handlePrint}
            className="h-8 px-3 rounded-lg bg-[#0EA5E9] hover:bg-[#0284C7] text-white text-xs font-black gap-1.5 shadow-md shadow-sky-500/20"
          >
            <Printer size={14} />
            <span>Cetak</span>
          </Button>

          <button
            onClick={onClose}
            className="w-8 h-8 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-400 hover:text-white flex items-center justify-center transition-colors ml-1 cursor-pointer"
            aria-label="Tutup"
          >
            <X size={16} />
          </button>
        </div>
      </div>

      {/* ── Paper Document Canvas ── */}
      <div className="w-full max-w-[800px] pb-24 sm:pb-12 print:pb-0 flex justify-center">
        <SembakoPurchaseInvoicePaper data={data} />
      </div>
    </div>
  )
}
