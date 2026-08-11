import React, { useState } from 'react'
import { PDFDownloadLink } from '@/lib/pdfFallback.jsx'
import {
  Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription
} from '@/components/ui/dialog'
import { Button } from '@/components/ui/button'
import { Download, Printer, Save, Loader2, CheckCircle2 } from 'lucide-react'
import { toast } from 'sonner'
import { useAuth } from '@/lib/hooks/useAuth'
import { SembakoInvoice } from './templates/SembakoInvoice'
import { SembakoInvoicePaper } from '@/dashboard/broker/sembako_broker/SembakoInvoicePreview'
import { useSaveInvoice } from '@/lib/invoice/useInvoice'
import { generateInvoiceNumber } from '@/lib/invoice/invoiceUtils'

export default function InvoicePreviewModal({ type = 'sembako_sale', data, isOpen, onClose }) {
  const [invoiceNumber] = useState(() => generateInvoiceNumber('sembako_sale'))
  const [saved, setSaved] = useState(false)

  const { tenant } = useAuth()
  const { mutate: saveInvoice, isPending: isSaving } = useSaveInvoice()

  if (!isOpen || !data) return null

  // Normalize data for both paper preview & PDF generation
  const inv = data.invoice || data.sale || data
  const cust = data.customer || inv?.sembako_customers || inv?.customer || {}
  const rawItems = data.items || inv?.sembako_sale_items || inv?.items || []

  const invNo = inv?.invoice_number || data.invoiceNumber || invoiceNumber
  const txnDate = inv?.transaction_date || data.transactionDate || new Date().toISOString()
  const dueDate = inv?.due_date || data.dueDate || null

  const normalizedItems = rawItems.map(item => ({
    product_name: item.product_name || 'Produk',
    quantity: Number(item.quantity || item.quantity_kg || 0),
    unit: item.unit || 'pcs',
    price_per_unit: Number(item.price_per_unit || item.sell_price || item.price_per_kg || 0),
    subtotal: Number(item.subtotal ?? (Number(item.quantity || 0) * Number(item.price_per_unit || item.sell_price || 0)))
  }))

  const totalAmount = Number(inv?.total_amount || data.revenue || data.total_amount || 0)
  const paidAmount = Number(inv?.paid_amount || data.paid_amount || 0)
  const remainingAmount = Number(inv?.remaining_amount ?? Math.max(0, totalAmount - paidAmount))
  const paymentStatus = inv?.payment_status || data.payment_status || (remainingAmount === 0 ? 'lunas' : paidAmount > 0 ? 'sebagian' : 'belum_lunas')

  const paperData = {
    tenant: data.tenant || tenant || { business_name: 'GPK', phone: '-' },
    invoice_number: invNo,
    transaction_date: txnDate,
    due_date: dueDate,
    customer_name: cust?.customer_name || inv?.customer_name || data.customerName || 'Customer',
    customer_type: cust?.customer_type || 'warung',
    customer_phone: cust?.phone || data.customerPhone || '-',
    customer_address: cust?.address || data.customerAddress || '',
    total_amount: totalAmount,
    paid_amount: paidAmount,
    remaining_amount: remainingAmount,
    payment_status: paymentStatus,
    items: normalizedItems,
    notes: inv?.notes || data.notes || '',
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
        payment_status: paymentStatus,
        notes: paperData.notes,
      }}
      customer={{
        customer_name: paperData.customer_name,
        customer_type: paperData.customer_type,
        phone: paperData.customer_phone,
        address: paperData.customer_address,
      }}
      items={normalizedItems}
      invoiceNumber={invNo}
      generatedBy={data.generatedBy || 'Admin GPK'}
      showProfit={data.showProfit ?? false}
    />
  )

  const fileName = `Invoice_${invNo}.pdf`

  const handleSave = () => {
    saveInvoice(
      {
        invoice_type: 'sembako_sale',
        reference_id: inv?.id || null,
        recipient_name: paperData.customer_name,
        total_amount: totalAmount,
        metadata: {
          invoice_number: invNo,
          generated_by: data.generatedBy || 'Admin GPK',
        },
      },
      {
        onSuccess: () => {
          setSaved(true)
          toast.success('Invoice tersimpan ke riwayat')
        },
        onError: (err) => {
          toast.error('Gagal simpan: ' + err.message)
        },
      }
    )
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
        </DialogHeader>

        {/* Paper Preview Container (100% Reliable HTML Rendering) */}
        <div className="flex-1 overflow-y-auto p-2 sm:p-4 bg-slate-950/80 flex justify-center items-start print:bg-white print:p-0">
          <div className="w-full max-w-[800px] shadow-2xl rounded-lg overflow-hidden bg-white">
            <SembakoInvoicePaper data={paperData} mode="invoice" />
          </div>
        </div>

        {/* Action Bar */}
        <div className="shrink-0 p-4 sm:px-6 sm:py-4 border-t border-white/[0.08] flex flex-wrap sm:flex-nowrap items-center gap-2 sm:gap-3">
          {/* Simpan ke riwayat */}
          <Button
            variant="outline"
            onClick={handleSave}
            disabled={isSaving || saved}
            className="flex-1 sm:flex-none h-11 border-white/10 bg-white/[0.03] text-[#94A3B8] font-semibold text-[10px] sm:text-xs uppercase tracking-widest rounded-xl hover:bg-white/[0.06] disabled:opacity-50"
          >
            {isSaving ? (
              <Loader2 size={14} className="animate-spin mr-1 sm:mr-2" />
            ) : saved ? (
              <CheckCircle2 size={14} className="text-emerald-400 mr-1 sm:mr-2" />
            ) : (
              <Save size={14} className="mr-1 sm:mr-2" />
            )}
            {saved ? 'Tersimpan' : 'Simpan'}
          </Button>

          {/* Print */}
          <Button
            variant="outline"
            onClick={() => window.print()}
            className="flex-1 sm:flex-none h-11 border-white/10 bg-white/[0.03] text-[#94A3B8] font-semibold text-[10px] sm:text-xs uppercase tracking-widest rounded-xl hover:bg-white/[0.06]"
          >
            <Printer size={14} className="mr-1 sm:mr-2" />
            Print
          </Button>

          {/* Download PDF */}
          <PDFDownloadLink document={pdfDoc} fileName={fileName} className="w-full sm:w-auto sm:ml-auto">
            {({ loading }) => (
              <Button
                disabled={loading}
                className="w-full h-11 bg-amber-500 hover:bg-amber-600 text-slate-950 font-black text-[10px] sm:text-xs uppercase tracking-widest rounded-xl shadow-[0_4px_16px_rgba(245,158,11,0.25)] active:scale-95 transition-transform disabled:opacity-60"
              >
                {loading ? (
                  <Loader2 size={14} className="animate-spin mr-1 sm:mr-2" />
                ) : (
                  <Download size={14} className="mr-1 sm:mr-2" />
                )}
                {loading ? 'Memproses...' : 'Download PDF'}
              </Button>
            )}
          </PDFDownloadLink>
        </div>
      </DialogContent>
    </Dialog>
  )
}
