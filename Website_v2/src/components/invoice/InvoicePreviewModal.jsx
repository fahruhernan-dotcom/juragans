import React, { useState } from 'react'
import {
  Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription
} from '@/components/ui/dialog'
import { Button } from '@/components/ui/button'
import { Download, Printer, Loader2, Phone, Copy, Check, FileText, Receipt, Share2 } from 'lucide-react'
import { useAuth } from '@/lib/hooks/useAuth'
import { generateInvoiceNumber } from '@/lib/invoice/invoiceUtils'
import { SembakoInvoice } from './templates/SembakoInvoice'
import { SembakoInvoicePaper, SembakoThermalReceipt } from '@/dashboard/broker/sembako_broker/SembakoInvoicePreview'
import { exportInvoicePDF, shareInvoiceViaWhatsApp, copyInvoiceToClipboard } from '@/lib/invoice/pdfExportHelper'
import { toast } from 'sonner'
import { cn } from '@/lib/utils'

export default function InvoicePreviewModal({ type = 'sembako_sale', data, isOpen, onClose }) {
  const { tenant } = useAuth()
  const [viewFormat, setViewFormat] = useState('a4') // 'a4' | 'thermal'
  const [isExporting, setIsExporting] = useState(false)
  const [copied, setCopied] = useState(false)

  if (!isOpen || !data) return null

  // Normalize data for both paper preview & PDF generation
  const inv = data.invoice || data.sale || data
  const cust = data.customer || inv?.sembako_customers || inv?.customer || {}
  const rawItems = data.items || inv?.sembako_sale_items || inv?.items || []

  const invNo = inv?.invoice_number || data.invoiceNumber || generateInvoiceNumber('sembako_sale')
  const txnDate = inv?.transaction_date || data.transactionDate || new Date().toISOString()
  const dueDate = inv?.due_date || data.dueDate || null

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

  const totalAmount = Number(inv?.total_amount || data.revenue || data.total_amount || 0)
  const paidAmount = Number(inv?.paid_amount || data.paid_amount || 0)
  const remainingAmount = Number(inv?.remaining_amount ?? Math.max(0, totalAmount - paidAmount))
  const paymentStatus = inv?.payment_status || data.payment_status || (remainingAmount === 0 ? 'lunas' : paidAmount > 0 ? 'sebagian' : 'belum_lunas')
  const payments = inv?.sembako_payments || data.payments || data.sembako_payments || []

  const isPurchase = type === 'sembako_purchase' || type === 'sembako_restock' || Boolean(data.isPurchase)
  const isDelivery = type === 'sembako_delivery'

  const paperData = {
    tenant: data.tenant || tenant || { business_name: 'Juragans', phone: '-' },
    invoice_number: invNo,
    transaction_date: txnDate,
    due_date: dueDate,
    customer_name: cust?.customer_name || inv?.customer_name || data.customerName || (isPurchase ? 'Vendor Supplier' : 'Customer'),
    customer_type: cust?.customer_type || (isPurchase ? 'Supplier / Vendor Mitra' : 'perseorangan'),
    customer_phone: cust?.phone || data.customerPhone || '-',
    customer_address: cust?.address || data.customerAddress || '',
    total_amount: totalAmount,
    paid_amount: paidAmount,
    remaining_amount: remainingAmount,
    delivery_cost: Number(inv?.delivery_cost || data.delivery_cost || data.deliveryCost || 0),
    other_cost: Number(inv?.other_cost || data.other_cost || data.otherCost || 0),
    payment_status: paymentStatus,
    items: normalizedItems,
    payments: payments,
    sembako_payments: payments,
    notes: inv?.notes || data.notes || '',
    sembako_deliveries: inv?.sembako_deliveries || data.sembako_deliveries || [],
    isPurchase,
  }

  const pdfDoc = (
    <SembakoInvoice
      tenant={paperData.tenant}
      invoice={{
        invoice_number: invNo,
        transaction_date: txnDate,
        due_date: dueDate,
        total_amount: totalAmount,
        paid_amount: paidAmount,
        remaining_amount: remainingAmount,
        delivery_cost: paperData.delivery_cost,
        other_cost: paperData.other_cost,
        payment_status: paymentStatus,
        notes: paperData.notes,
        sembako_payments: payments,
      }}
      customer={{
        customer_name: paperData.customer_name,
        customer_type: paperData.customer_type,
        phone: paperData.customer_phone,
        address: paperData.customer_address,
      }}
      items={normalizedItems}
      payments={payments}
      invoiceNumber={invNo}
      generatedBy={data.generatedBy || 'Admin Juragans'}
      showProfit={data.showProfit ?? false}
    />
  )

  const fileName = `Invoice_${invNo}.pdf`

  const handleDownloadPDF = async () => {
    if (isExporting) return
    setIsExporting(true)
    const toastId = toast.loading('Membuat dokumen PDF invoice...')
    try {
      const res = await exportInvoicePDF(pdfDoc, fileName, {
        invoiceNumber: invNo,
        customerName: paperData.customer_name,
      })

      if (res.method === 'native_share') {
        toast.success('Faktur PDF siap dibuka / disimpan!', { id: toastId })
      } else if (res.method === 'web_download') {
        toast.success('Invoice PDF berhasil diunduh!', { id: toastId })
      } else {
        toast.success('Invoice siap dibagikan!', { id: toastId })
      }
    } catch (err) {
      console.error('[InvoicePreviewModal] Download PDF failed:', err)
      toast.error('Gagal mengunduh PDF. Silakan coba cetak atau bagikan teks.', { id: toastId })
    } finally {
      setIsExporting(false)
    }
  }

  const handleShareWhatsApp = () => {
    try {
      shareInvoiceViaWhatsApp(paperData)
      toast.success('Membuka WhatsApp...')
    } catch (err) {
      console.error('[InvoicePreviewModal] WhatsApp share failed:', err)
      toast.error('Gagal membuka WhatsApp')
    }
  }

  const handleCopyText = async () => {
    const ok = await copyInvoiceToClipboard(paperData)
    if (ok) {
      setCopied(true)
      toast.success('Rincian faktur disalin ke clipboard!')
      setTimeout(() => setCopied(false), 2500)
    } else {
      toast.error('Gagal menyalin teks')
    }
  }

  return (
    <Dialog open={isOpen} onOpenChange={(open) => { if (!open) onClose() }}>
      <DialogContent
        className="bg-[#0C1319] border border-white/[0.08] p-0 flex flex-col overflow-hidden max-w-[850px] w-[95vw] h-[92dvh] rounded-[20px]"
      >
        {/* Header */}
        <DialogHeader className="flex-row items-center justify-between px-4 sm:px-6 pt-4 sm:pt-5 pb-3 sm:pb-4 border-b border-white/[0.08] shrink-0">
          <div>
            <DialogTitle className="font-display font-bold text-base sm:text-lg text-white leading-none">
              Invoice Penjualan Sembako
            </DialogTitle>
            <DialogDescription className="text-[10px] sm:text-[11px] text-[#4B6478] mt-1 font-mono">
              {invNo}
            </DialogDescription>
          </div>

          {/* View Format Selector Tabs */}
          <div className="flex items-center bg-white/5 p-1 rounded-xl border border-white/10 text-xs font-bold mr-6 sm:mr-8">
            <button
              onClick={() => setViewFormat('a4')}
              className={cn(
                "flex items-center gap-1.5 px-3 py-1.5 rounded-lg transition-all text-[11px]",
                viewFormat === 'a4'
                  ? "bg-amber-500 text-slate-950 font-black shadow-sm"
                  : "text-slate-400 hover:text-white"
              )}
            >
              <FileText size={13} />
              <span className="hidden sm:inline">Faktur</span> A4
            </button>
            <button
              onClick={() => setViewFormat('thermal')}
              className={cn(
                "flex items-center gap-1.5 px-3 py-1.5 rounded-lg transition-all text-[11px]",
                viewFormat === 'thermal'
                  ? "bg-amber-500 text-slate-950 font-black shadow-sm"
                  : "text-slate-400 hover:text-white"
              )}
            >
              <Receipt size={13} />
              <span className="hidden sm:inline">Struk</span> 58/80mm
            </button>
          </div>
        </DialogHeader>

        {/* Paper Preview Container (100% Reliable HTML Rendering) */}
        <div className="flex-1 overflow-y-auto p-2 sm:p-4 bg-slate-950/80 flex justify-center items-start print:bg-white print:p-0">
          <div className="w-full max-w-[800px] shadow-2xl rounded-lg overflow-hidden flex justify-center">
            {viewFormat === 'thermal' ? (
              <SembakoThermalReceipt data={paperData} />
            ) : (
              <SembakoInvoicePaper data={paperData} mode={isPurchase ? 'purchase' : (isDelivery ? 'delivery' : 'invoice')} />
            )}
          </div>
        </div>

        {/* Action Bar (Mobile-friendly & Ergonomic) */}
        <div className="shrink-0 p-3 sm:px-6 sm:py-4 border-t border-white/[0.08] bg-[#0A0F14] flex flex-wrap sm:flex-nowrap items-center justify-between gap-2 sm:gap-3">
          
          {/* Secondary Actions: Print & Copy */}
          <div className="flex items-center gap-2 w-full sm:w-auto">
            <Button
              variant="outline"
              onClick={() => window.print()}
              className="flex-1 sm:flex-none h-10 sm:h-11 border-white/10 bg-white/[0.03] text-[#94A3B8] font-bold text-[10px] sm:text-xs uppercase tracking-wider rounded-xl hover:bg-white/[0.06] hover:text-white active:scale-95 transition-all"
            >
              <Printer size={14} className="mr-1.5" />
              Print
            </Button>

            <Button
              variant="outline"
              onClick={handleCopyText}
              className="flex-1 sm:flex-none h-10 sm:h-11 border-white/10 bg-white/[0.03] text-[#94A3B8] font-bold text-[10px] sm:text-xs uppercase tracking-wider rounded-xl hover:bg-white/[0.06] hover:text-white active:scale-95 transition-all"
              title="Salin Rincian Faktur"
            >
              {copied ? <Check size={14} className="mr-1.5 text-emerald-400" /> : <Copy size={14} className="mr-1.5" />}
              {copied ? 'Tersalin' : 'Salin Teks'}
            </Button>
          </div>

          {/* Primary Actions: WhatsApp & Download PDF */}
          <div className="flex items-center gap-2 w-full sm:w-auto sm:ml-auto">
            <Button
              onClick={handleShareWhatsApp}
              className="flex-1 sm:flex-none h-10 sm:h-11 bg-emerald-600 hover:bg-emerald-500 text-white font-bold text-[10px] sm:text-xs uppercase tracking-wider rounded-xl shadow-[0_4px_16px_rgba(16,185,129,0.2)] active:scale-95 transition-all"
            >
              <Phone size={14} className="mr-1.5" />
              WhatsApp
            </Button>

            {/* Universal PDF Download / Native Share */}
            <Button
              onClick={handleDownloadPDF}
              disabled={isExporting}
              className="flex-1 sm:flex-none h-10 sm:h-11 bg-amber-500 hover:bg-amber-400 text-slate-950 font-black text-[10px] sm:text-xs uppercase tracking-wider rounded-xl shadow-[0_4px_16px_rgba(245,158,11,0.25)] active:scale-95 transition-all disabled:opacity-60"
            >
              {isExporting ? (
                <Loader2 size={14} className="animate-spin mr-1.5" />
              ) : (
                <Download size={14} className="mr-1.5" />
              )}
              {isExporting ? 'Memproses...' : 'Download PDF'}
            </Button>
          </div>

        </div>
      </DialogContent>
    </Dialog>
  )
}
