import React, { useState, useMemo } from 'react'
import { Truck, Store, FileText, CreditCard, Smartphone, ArrowRightLeft, Pencil, Trash2, CheckCircle2, Loader2, AlertCircle } from 'lucide-react'
import { useMediaQuery } from '@/lib/hooks/useMediaQuery'
import { Sheet, SheetContent, SheetHeader, SheetTitle, SheetDescription } from '@/components/ui/sheet'
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@/components/ui/alert-dialog'
import { Badge } from '@/components/ui/badge'
import { cn } from '@/lib/utils'
import { toast } from 'sonner'
import { formatIDR } from '@/lib/format'
import { useAuth } from '@/lib/hooks/useAuth'
import { isSuperadmin } from '@/lib/auth'
import {
  useDeleteSembakoSale,
  useCreateSembakoReturn,
  useVoidSembakoReturnsBySale,
  useSembakoProducts,
  useSembakoReturns,
  useRefundSembakoSaleOverpay,
} from '@/lib/hooks/useSembakoData'
import InvoicePreviewModal from '@/components/invoice/InvoicePreviewModal'
import { C, sBtn, sLabel, DetailRow, fmtDate, generateWAMessage, toWaLink, InputRupiah, CustomSelect, calculateSaleFinancials, formatUniversalPackaging } from './sembakoSaleUtils'
import { SembakoPaymentSheet } from './SembakoPaymentSheet'
import { DeliveryCompletionModal } from './DeliveryCompletionModal'
import { useBackHandler } from '@/lib/hooks/useBackHandler'

export function SembakoSaleDetailSheet({ isOpen, onOpenChange, sale, onEdit }) {
  useBackHandler(isOpen, () => onOpenChange(false))
  const isDesktop = useMediaQuery('(min-width: 1024px)')
  const { tenant, profile } = useAuth()
  const deleteSale = useDeleteSembakoSale()
  const createReturn = useCreateSembakoReturn()
  const voidReturnsMut = useVoidSembakoReturnsBySale()
  const refundOverpay = useRefundSembakoSaleOverpay()
  const { data: products = [] } = useSembakoProducts()
  const { data: returnsList = [] } = useSembakoReturns()

  const sortedPayments = useMemo(() => {
    if (!sale) return []
    const rawPayments = Array.isArray(sale.sembako_payments) ? sale.sembako_payments.filter(p => !p.is_deleted) : []
    return [...rawPayments].sort((a, b) => new Date(a.payment_date) - new Date(b.payment_date))
  }, [sale])

  const costDetails = useMemo(() => {
    if (!sale) return null
    const otherCost = Number(sale.other_cost) || 0
    const deliveryCost = Number(sale.delivery_cost) || 0
    const fuelCost = Number(sale.fuel_cost || sale.sembako_deliveries?.[0]?.fuel_cost || 0)
    if (otherCost <= 0 && deliveryCost <= 0 && fuelCost <= 0) return null

    const notesList = [
      sale.notes,
      ...(Array.isArray(sale.sembako_deliveries) ? sale.sembako_deliveries.map(d => d.notes) : [])
    ].filter(Boolean).join(' ')

    const OPEX_LOOKUP = [
      { id: 'bensin', match: fuelCost > 0 || /bensin|bbm|pertalite|solar/i.test(notesList), label: 'BBM / Bensin', icon: '⛽', color: '#2563EB', bg: '#EFF6FF', border: '#BFDBFE' },
      { id: 'makan', match: /makan|konsumsi|snack/i.test(notesList), label: 'Uang Makan / Konsumsi', icon: '🍽️', color: '#059669', bg: '#F0FDF4', border: '#BBF7D0' },
      { id: 'parkir_tol', match: /parkir|tol/i.test(notesList), label: 'Tol / Parkir', icon: '🅿️', color: '#7C3AED', bg: '#F5F3FF', border: '#DDD6FE' },
      { id: 'bongkar', match: /bongkar|kuli|muat/i.test(notesList), label: 'Bongkar Muat', icon: '📦', color: '#DB2777', bg: '#FDF2F8', border: '#FBCFE8' },
    ]
    const detectedCategories = OPEX_LOOKUP.filter(c => c.match)

    let extractedCostNotes = ''
    const costMatch = notesList.match(/\[Biaya Operasional:[^\]]*\(([^)]+)\)\]/) || notesList.match(/Biaya Tambahan:\s*([^,\n]+(?:,[^,\n]+)*)/)
    if (costMatch && costMatch[1]) {
      extractedCostNotes = costMatch[1].trim()
    } else if (sale.notes && !sale.notes.includes('[Biaya Operasional:')) {
      if (otherCost > 0 && /bensin|bbm|makan|konsumsi|tol|parkir|bongkar|biaya/i.test(sale.notes)) {
        extractedCostNotes = sale.notes.trim()
      }
    }

    return {
      otherCost,
      deliveryCost,
      fuelCost,
      detectedCategories,
      costNotes: extractedCostNotes,
      rawNotes: sale.notes || ''
    }
  }, [sale])

  const [payTarget, setPayTarget] = useState(null)
  const [invoiceModal, setInvoiceModal] = useState({ open: false, type: null })
  const [confirmDelete, setConfirmDelete] = useState(false)
  const [confirmReturn, setConfirmReturn] = useState(false)
  const [confirmCancelReturn, setConfirmCancelReturn] = useState(false)
  const [deliveryConfirmModal, setDeliveryConfirmModal] = useState(false)
  const [isRefunding, setIsRefunding] = useState(false)
  const [refundDialogOpen, setRefundDialogOpen] = useState(false)
  const [refundInputAmount, setRefundInputAmount] = useState(0)
  const [refundMethod, setRefundMethod] = useState('cash')
  const [returnDialogOpen, setReturnDialogOpen] = useState(false)
  const [returnFormItems, setReturnFormItems] = useState([])
  const [isSubmittingReturn, setIsSubmittingReturn] = useState(false)

  if (!sale) return null

  const fin = calculateSaleFinancials(sale, returnsList, products)
  const items = fin.items
  const deliveries = Array.isArray(sale.sembako_deliveries) ? sale.sembako_deliveries : []
  const isDelivered = deliveries.length > 0 && deliveries.every(d => d.status === 'delivered')

  const saleReturns = fin.saleReturns
  const totalReturnAmount = fin.totalReturnAmount
  const totalReturnCogs = fin.totalReturnCogs
  const effectiveCogs = fin.effectiveCogs
  const itemsSubtotal = fin.itemsSubtotal
  const deliveryCost = fin.deliveryCost
  const otherCost = fin.otherCost
  const grandTotal = fin.grandTotal
  const rawPaidAmount = fin.rawPaidAmount
  const paidAmount = fin.paidAmount
  const remainingAmount = fin.remainingAmount
  const isOverpaid = fin.isOverpaid
  const overpayAmount = fin.overpayAmount
  const grossProfit = fin.grossProfit
  const profit = fin.profit
  const netMarginPct = fin.netMarginPct
  const isOwner = profile?.role === 'owner' || isSuperadmin(profile)

  const getDueDateStatus = () => {
    if (remainingAmount <= 0) return null
    if (!sale.due_date) return null
    const now = new Date()
    now.setHours(0, 0, 0, 0)
    const due = new Date(sale.due_date)
    due.setHours(0, 0, 0, 0)
    const diffTime = due - now
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24))
    
    if (diffDays < 0) {
      return { text: `Telat ${Math.abs(diffDays)} Hari`, isOverdue: true }
    } else if (diffDays === 0) {
      return { text: `Jatuh Tempo Hari Ini`, isToday: true }
    } else {
      return { text: `Jatuh tempo dalam ${diffDays} hari`, isPending: true }
    }
  }
  const dueDateStatus = getDueDateStatus()


  const openRefundDialog = () => {
    setRefundInputAmount(overpayAmount)
    setRefundMethod('cash')
    setRefundDialogOpen(true)
  }

  const handleProcessRefund = async () => {
    if (!sale || refundInputAmount <= 0) return
    if (refundInputAmount > overpayAmount) {
      return toast.error(`Nominal melebihi saldo deposit toko (${formatIDR(overpayAmount)})`)
    }
    try {
      setIsRefunding(true)
      await refundOverpay.mutateAsync({
        saleId: sale.id,
        refundAmount: refundInputAmount,
        notes: `Pengembalian (${refundMethod.toUpperCase()}) retur toko (${sale.customer_name || 'Toko'}) Rp ${refundInputAmount}`,
      })
      setRefundDialogOpen(false)
    } catch (e) {
      // handled by toast
    } finally {
      setIsRefunding(false)
    }
  }





  const openReturnDialog = () => {
    if (!items || items.length === 0) {
      return toast.error('Tidak ada item pada nota ini untuk diretur.')
    }

    const initialForm = items.map(it => {
      const itemPrice = Number(it.sell_price || it.price_per_unit || it.unit_price || it.price_per_kg || (Number(it.quantity) > 0 && it.subtotal ? Number(it.subtotal) / Number(it.quantity) : 0) || 0)
      const existingReturs = saleReturns.filter(r => r.product_id === it.product_id || r.product_name === it.product_name)
      const alreadyReturned = existingReturs.reduce((s, r) => s + Number(r.quantity || 0), 0)
      const maxQty = Math.max(0, Number(it.quantity || 0) - alreadyReturned)

      return {
        product_id: it.product_id,
        product_name: it.product_name,
        unit: it.unit || 'pcs',
        unit_price: itemPrice,
        max_qty: maxQty,
        return_qty: 0,
        reason: 'Kemasan Rusak / Cacat',
      }
    })

    setReturnFormItems(initialForm)
    setReturnDialogOpen(true)
  }

  const updateReturnFormItem = (idx, field, value) => {
    setReturnFormItems(prev => {
      const copy = [...prev]
      copy[idx] = { ...copy[idx], [field]: value }
      return copy
    })
  }

  const handleProcessReturn = async () => {
    const activeReturns = returnFormItems.filter(i => Number(i.return_qty) > 0)
    if (activeReturns.length === 0) {
      return toast.error('Silakan isi jumlah barang (qty > 0) yang ingin diretur.')
    }

    for (const it of activeReturns) {
      if (Number(it.return_qty) > it.max_qty) {
        return toast.error(`Jumlah retur ${it.product_name} (${it.return_qty}) melebihi sisa barang (${it.max_qty}).`)
      }
    }

    try {
      setIsSubmittingReturn(true)
      for (const it of activeReturns) {
        const qty = Number(it.return_qty)
        const total = Math.round(qty * it.unit_price)

        await createReturn.mutateAsync({
          return_type: 'sale_return',
          sale_id: sale.id,
          invoice_number: sale.invoice_number,
          customer_id: sale.customer_id,
          party_name: sale.sembako_customers?.customer_name || sale.customer_name || 'Pelanggan',
          product_id: it.product_id,
          product_name: it.product_name,
          quantity: qty,
          unit: it.unit,
          unit_price: it.unit_price,
          total_amount: total,
          reason: it.reason || 'Retur Nota Penjualan',
          action: 'fifo_stock',
          status: 'completed',
          financial_action: 'none',   // jangan auto-potong piutang — user handle refund via dialog
          notes: `Retur ${qty} ${it.unit} ${it.product_name} dari Nota ${sale.invoice_number || sale.id}`
        })
      }

      toast.success('Retur barang berhasil dicatat & disesuaikan ke nota!')
      setReturnDialogOpen(false)
    } catch (err) {
      console.error('[handleProcessReturn error]', err)
      toast.error('Gagal memproses retur barang.')
    } finally {
      setIsSubmittingReturn(false)
    }
  }

  const handleCancelReturn = async () => {
    try {
      await voidReturnsMut.mutateAsync({
        saleId: sale.id,
        invoiceNumber: sale.invoice_number
      })
      setConfirmCancelReturn(false)
    } catch (e) {
      console.error('[handleCancelReturn error]', e)
    }
  }

  const handleDelete = async () => {
    try {
      await deleteSale.mutateAsync(sale.id)
      toast.success('Transaksi dihapus')
      setConfirmDelete(false)
      onOpenChange(false)
    } catch { /* error handled by hook */ }
  }



  return (
    <>
      <Sheet open={isOpen} onOpenChange={onOpenChange}>
        <SheetContent side="right" style={{ background: C.bg, borderLeft: `1px solid ${C.border}`, width: '100%', maxWidth: '480px', display: 'flex', flexDirection: 'column', padding: 0 }}>
          <SheetHeader style={{ padding: '24px', borderBottom: `1px solid ${C.border}`, textAlign: 'left' }}>
            <SheetDescription className="sr-only">Detail rincian transaksi penjualan sembako</SheetDescription>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
              <div>
                <SheetTitle style={{ color: C.text, fontWeight: 900, fontSize: '20px', fontFamily: 'DM Sans' }}>Detail Penjualan</SheetTitle>
                <p style={{ fontSize: '11px', color: C.muted, marginTop: '4px' }}>{sale.invoice_number} - {fmtDate(sale.transaction_date)}</p>
                {dueDateStatus && (
                  <span style={{
                    display: 'inline-block',
                    fontSize: '10px',
                    fontWeight: 800,
                    marginTop: '6px',
                    padding: '3px 8px',
                    borderRadius: '6px',
                    background: dueDateStatus.isOverdue ? '#FEF2F2' : dueDateStatus.isToday ? '#FFFBEB' : '#F0F9FF',
                    border: `1px solid ${dueDateStatus.isOverdue ? '#FCA5A5' : dueDateStatus.isToday ? '#FDE68A' : '#BAE6FD'}`,
                    color: dueDateStatus.isOverdue ? '#DC2626' : dueDateStatus.isToday ? '#D97706' : '#0284C7'
                  }}>
                    ⏳ {dueDateStatus.text}
                  </span>
                )}
              </div>
              <Badge className={cn(
                "rounded-full px-3 py-1 border-none font-black text-[10px] uppercase tracking-wider pointer-events-none shadow-none",
                sale.payment_status === 'lunas' ? 'bg-emerald-55 border-emerald-200 text-emerald-700' :
                sale.payment_status === 'sebagian' ? 'bg-amber-50 border-amber-200 text-amber-700' :
                'bg-rose-50 border-rose-200 text-rose-700'
              )}>
                {sale.payment_status === 'lunas' ? 'LUNAS' : sale.payment_status === 'sebagian' ? 'SEBAGIAN' : 'BELUM LUNAS'}
              </Badge>
            </div>
          </SheetHeader>

          <div style={{ flex: 1, overflowY: 'auto', padding: '24px', display: 'flex', flexDirection: 'column', gap: '24px' }}>
            {/* Section: Customer Info */}
            <div style={{ background: 'var(--bg-page)', borderRadius: '16px', padding: '16px', border: `1px solid ${C.border}` }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                <div style={{ width: 44, height: 44, borderRadius: '12px', background: 'var(--bg-subtle)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                  <Store size={20} color={C.accent} />
                </div>
                <div>
                  <p style={{ fontSize: '15px', fontWeight: 800, color: C.text }}>{sale.sembako_customers?.customer_name || sale.customer_name || 'Umum'}</p>
                  <p style={{ fontSize: '12px', color: C.muted }}>{sale.sembako_customers?.phone || '-'}</p>
                </div>
              </div>
            </div>

            {/* Section: Items Table */}
            <div>
              <p style={sLabel}>DAFTAR BARANG</p>
              <div style={{ marginTop: '12px', background: 'var(--bg-page)', borderRadius: '16px', border: `1px solid ${C.border}`, overflow: 'hidden' }}>
                <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '13px' }}>
                  <thead style={{ background: 'var(--bg-subtle)' }}>
                    <tr>
                      <th style={{ textAlign: 'left', padding: '12px', color: C.muted, fontWeight: 800, textTransform: 'uppercase', fontSize: '10px' }}>Produk</th>
                      <th style={{ textAlign: 'right', padding: '12px', color: C.muted, fontWeight: 800, textTransform: 'uppercase', fontSize: '10px' }}>Qty</th>
                      <th style={{ textAlign: 'right', padding: '12px', color: C.muted, fontWeight: 800, textTransform: 'uppercase', fontSize: '10px' }}>Harga</th>
                    </tr>
                  </thead>
                  <tbody>
                    {items.map((it, idx) => {
                      const itemPrice = Number(it.sell_price || it.price_per_unit || it.unit_price || it.price_per_kg || (Number(it.quantity) > 0 && it.subtotal ? Number(it.subtotal) / Number(it.quantity) : 0) || 0)
                      const itemReturs = saleReturns.filter(r => r.product_id === it.product_id || r.product_name === it.product_name)
                      const returQty = itemReturs.reduce((s, r) => s + Number(r.quantity || 0), 0)
                      const netQty = Math.max(0, Number(it.quantity || 0) - returQty)

                      const rawName = it.product_name || '—'
                      const matchPkg = rawName.match(/\[(\d+(?:\.\d+)?\s*[^\]]+)\]/)
                      const pkgTag = matchPkg ? matchPkg[1] : null
                      const cleanProdName = rawName.replace(/\s*\[\d+[^\]]+\]/g, '').trim()

                      return (
                        <tr key={idx} style={{ borderTop: `1px solid ${C.border}` }}>
                          <td style={{ padding: '12px', color: C.text, fontWeight: 600 }}>
                            <div style={{ display: 'flex', alignItems: 'center', gap: '6px', flexWrap: 'wrap' }}>
                              <span>{cleanProdName}</span>
                              {pkgTag && (
                                <span style={{ fontSize: '10px', fontWeight: 800, padding: '1.5px 6px', borderRadius: '6px', background: '#EEF2FF', color: '#4F46E5', textTransform: 'uppercase' }}>
                                  {pkgTag}
                                </span>
                              )}
                            </div>
                            {returQty > 0 && (
                              <span style={{ fontSize: '10px', color: '#DC2626', display: 'block', fontWeight: 700, marginTop: '2px' }}>
                                🔄 Ada Retur: -{returQty} {it.unit || 'unit'}
                              </span>
                            )}
                            {isOwner && (
                              <span style={{ fontSize: '10px', color: C.muted, display: 'block', fontWeight: 550, marginTop: '2.5px' }}>
                                Modal: {formatIDR(it.cogs_per_unit)} · Laba: <span style={{ color: (itemPrice - it.cogs_per_unit) >= 0 ? '#10B981' : '#EF4444', fontWeight: 700 }}>{formatIDR(itemPrice - it.cogs_per_unit)}</span> ({itemPrice > 0 ? Math.round(((itemPrice - it.cogs_per_unit) / itemPrice) * 100) : 0}%)
                              </span>
                            )}
                          </td>
                          <td style={{ padding: '12px', textAlign: 'right', color: C.text }}>
                            <span style={{ fontWeight: returQty > 0 ? 800 : 600, color: returQty > 0 ? '#16A34A' : C.text }}>
                              {netQty} {it.unit || 'unit'}
                            </span>

                            {returQty > 0 && (
                              <span style={{ fontSize: '10px', color: C.muted, display: 'block', textDecoration: 'line-through' }}>
                                Awal: {it.quantity} {it.unit || 'unit'}
                              </span>
                            )}
                          </td>
                          <td style={{ padding: '12px', textAlign: 'right', color: C.text, fontWeight: 700 }}>
                            {formatIDR(netQty * itemPrice)}
                            <span style={{ fontSize: '10px', color: C.muted, display: 'block', fontWeight: 500 }}>
                              @{formatIDR(itemPrice)}
                            </span>
                            {isOwner && (
                              <span style={{ fontSize: '10px', color: '#10B981', display: 'block', fontWeight: 700, marginTop: '2.5px' }}>
                                Laba: {formatIDR(netQty * (itemPrice - it.cogs_per_unit))}
                              </span>
                            )}
                          </td>
                        </tr>
                      )
                    })}
                  </tbody>
                </table>
              </div>
            </div>

            {/* Section: Riwayat / Rincian Retur Barang */}
            {saleReturns.length > 0 && (
              <div style={{ background: '#FEF2F2', border: '1px solid #FEE2E2', borderRadius: '16px', padding: '16px' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '12px' }}>
                  <p style={{ ...sLabel, color: '#DC2626' }}>🔄 RINCIAN RETUR BARANG ({saleReturns.length})</p>
                  <span style={{ fontSize: '11px', fontWeight: 900, color: '#B91C1C' }}>
                    Total Retur: {formatIDR(totalReturnAmount)}
                  </span>
                </div>
                <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                  {saleReturns.map((ret, rIdx) => (
                    <div key={ret.id || rIdx} style={{ background: 'var(--bg-surface)', border: '1px solid var(--border-soft)', borderRadius: '12px', padding: '10px 12px' }}>
                      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                        <span style={{ fontSize: '13px', fontWeight: 800, color: 'var(--text-primary)' }}>{ret.product_name}</span>
                        <span style={{ fontSize: '13px', fontWeight: 800, color: '#DC2626' }}>-{ret.quantity} {ret.unit}</span>
                      </div>
                      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginTop: '4px', fontSize: '11px', color: 'var(--text-muted)' }}>
                        <span>Alasan: {ret.reason || 'Klaim Retur'}</span>
                        <span style={{ color: '#D97706', fontWeight: 700 }}>{formatIDR(Number(ret.total_amount || ret.amount || 0) || Math.round(Number(ret.quantity || 0) * Number(ret.unit_price || 0)))}</span>
                      </div>
                      <div style={{ fontSize: '10px', color: 'var(--text-muted)', marginTop: '3px' }}>
                        Status: <strong style={{ color: ret.status === 'completed' ? '#16A34A' : '#D97706' }}>{ret.status === 'completed' ? 'Selesai (Stok Diterima)' : 'Diproses (Pending Validasi Gudang)'}</strong>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Section: Financials & Cost Breakdown */}
            <div style={{ background: 'var(--bg-page)', borderRadius: '16px', padding: '16px', border: `1px solid ${C.border}` }}>
              <p style={{ ...sLabel, marginBottom: '10px' }}>RINCIAN KEUANGAN & BIAYA</p>
              <DetailRow label="Subtotal Barang" value={formatIDR(itemsSubtotal)} bold />
              {totalReturnAmount > 0 && (
                <DetailRow label="Potongan Retur Barang" value={`-${formatIDR(totalReturnAmount)}`} color={C.red} bold />
              )}
              {deliveryCost > 0 && (
                <DetailRow label="Biaya Kirim (Tanggungan Seller)" value={formatIDR(deliveryCost)} color="var(--text-muted)" />
              )}
              {otherCost > 0 && (
                <DetailRow label="Biaya Operasional Lainnya" value={formatIDR(otherCost)} color="var(--text-muted)" />
              )}

              {/* Rincian Operasional & Kategori Pengeluaran (BBM, Makan, Tol, Bongkar) */}
              {costDetails && (costDetails.otherCost > 0 || costDetails.detectedCategories.length > 0 || costDetails.fuelCost > 0) && (
                <div style={{ background: 'var(--bg-surface)', border: `1px solid ${C.border}`, borderRadius: '12px', padding: '12px 14px', margin: '8px 0' }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '8px' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                      <span style={{ fontSize: '13px' }}>🛠️</span>
                      <p style={{ fontSize: '11px', fontWeight: 800, color: C.text, textTransform: 'uppercase', letterSpacing: '0.04em', margin: 0 }}>
                        Rincian Biaya Operasional
                      </p>
                    </div>
                    {costDetails.otherCost > 0 && (
                      <span style={{ fontSize: '11px', fontWeight: 800, color: '#D97706', fontFamily: 'Sora' }}>
                        {formatIDR(costDetails.otherCost)}
                      </span>
                    )}
                  </div>

                  {/* Badges / Chips Kategori yang dicentang */}
                  {costDetails.detectedCategories.length > 0 && (
                    <div style={{ display: 'flex', flexWrap: 'wrap', gap: '6px', marginBottom: '8px' }}>
                      {costDetails.detectedCategories.map((cat, cIdx) => (
                        <span
                          key={cIdx}
                          style={{
                            display: 'inline-flex',
                            alignItems: 'center',
                            gap: '4px',
                            padding: '4px 9px',
                            borderRadius: '8px',
                            fontSize: '11px',
                            fontWeight: 700,
                            background: cat.bg,
                            color: cat.color,
                            border: `1px solid ${cat.border}`,
                          }}
                        >
                          <span>{cat.icon}</span>
                          <span>{cat.label}</span>
                        </span>
                      ))}
                    </div>
                  )}

                  {/* Keterangan / Notes Rincian */}
                  {costDetails.costNotes ? (
                    <div style={{ background: 'rgba(15,23,42,0.03)', borderRadius: '8px', padding: '6px 10px', marginTop: '4px' }}>
                      <p style={{ fontSize: '11px', color: C.text, margin: 0, fontWeight: 500 }}>
                        <span style={{ color: C.muted, fontWeight: 700 }}>Rincian:</span> "{costDetails.costNotes}"
                      </p>
                    </div>
                  ) : costDetails.rawNotes && costDetails.rawNotes.includes('Biaya') ? (
                    <div style={{ background: 'rgba(15,23,42,0.03)', borderRadius: '8px', padding: '6px 10px', marginTop: '4px' }}>
                      <p style={{ fontSize: '11px', color: C.text, margin: 0, fontWeight: 500 }}>
                        <span style={{ color: C.muted, fontWeight: 700 }}>Keterangan:</span> "{costDetails.rawNotes}"
                      </p>
                    </div>
                  ) : null}

                  {/* Internal Fuel Cost if present */}
                  {costDetails.fuelCost > 0 && (
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginTop: '8px', paddingTop: '6px', borderTop: `1px dashed ${C.border}`, fontSize: '11px', color: C.muted }}>
                      <span>⛽ Biaya BBM Internal Armada:</span>
                      <strong style={{ color: C.text, fontWeight: 800 }}>{formatIDR(costDetails.fuelCost)}</strong>
                    </div>
                  )}
                </div>
              )}

              {/* Rincian Armada & Pengiriman jika ada */}
              {deliveries.length > 0 && (
                <div style={{ background: 'var(--bg-surface)', border: `1px solid ${C.border}`, borderRadius: '12px', padding: '10px 12px', margin: '8px 0' }}>
                  <p style={{ fontSize: '10px', fontWeight: 800, color: C.muted, textTransform: 'uppercase', marginBottom: '6px', margin: 0 }}>
                    🚚 Rincian Logistik Pengiriman:
                  </p>
                  {deliveries.map((d, dIdx) => (
                    <div key={d.id || dIdx} style={{ fontSize: '11px', color: C.text, display: 'flex', flexDirection: 'column', gap: '3px', marginTop: '6px' }}>
                      <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                        <span style={{ color: C.muted }}>Kurir / Sopir:</span>
                        <strong style={{ color: C.text }}>{d.driver_name || d.employees?.full_name || 'Kurir Toko'}</strong>
                      </div>
                      {(d.vehicle_type || d.vehicle_plate) && (
                        <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                          <span style={{ color: C.muted }}>Kendaraan & Plat:</span>
                          <span>{[d.vehicle_type, d.vehicle_plate].filter(Boolean).join(' - ')}</span>
                        </div>
                      )}
                      <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                        <span style={{ color: C.muted }}>Status Pengiriman:</span>
                        <strong style={{ color: d.status === 'delivered' ? '#16A34A' : '#D97706', textTransform: 'capitalize' }}>
                          {d.status === 'delivered' ? '✓ Terkirim' : d.status || 'Disiapkan'}
                        </strong>
                      </div>
                      {d.notes && d.notes.includes('Biaya') && (
                        <div style={{ fontSize: '10px', color: C.muted, marginTop: '2px', fontStyle: 'italic' }}>
                          Info: {d.notes}
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              )}

              <div style={{ height: 1, background: C.border, margin: '12px 0' }} />
              <DetailRow label={totalReturnAmount > 0 ? "Total Tagihan (Nota Bersih)" : "Total Tagihan"} value={formatIDR(grandTotal)} highlight />
              
              {(fin.grossPaidAmount > 0 || rawPaidAmount > 0) && (
                <DetailRow label="Total Uang Toko Diterima" value={formatIDR(fin.grossPaidAmount || rawPaidAmount)} color={C.green} />
              )}
              {fin.refundPaymentsAmount > 0 && (
                <DetailRow label="Pengembalian Uang Ke Toko (Refund)" value={`-${formatIDR(fin.refundPaymentsAmount)}`} color="#34D399" bold />
              )}
              <DetailRow label="Sudah Dibayar (Bersih)" value={formatIDR(paidAmount)} color={C.green} bold />
              <DetailRow label="Sisa Piutang" value={formatIDR(remainingAmount)} color={remainingAmount > 0 ? C.red : C.green} bold />
              {isOverpaid && (
                <DetailRow label="Sisa Saldo Deposit Toko (Overpay)" value={formatIDR(overpayAmount)} color="#34D399" bold />
              )}

              {/* Warning Alert Banner for Overpaid / Return Cashback */}
              {isOverpaid && (
                <div style={{ marginTop: '12px', background: '#F0FDF4', border: '1px solid #BBF7D0', borderRadius: '12px', padding: '12px' }}>
                  <div style={{ display: 'flex', alignItems: 'flex-start', gap: '10px' }}>
                    <AlertCircle size={18} style={{ color: '#16A34A', flexShrink: 0, marginTop: '2px' }} />
                    <div style={{ flex: 1 }}>
                      <p style={{ fontSize: '11px', fontWeight: 900, color: '#16A34A', margin: 0, textTransform: 'uppercase', letterSpacing: '0.05em' }}>
                        💵 WAJIB KEMBALIKAN UANG KE TOKO: {formatIDR(overpayAmount)}
                      </p>
                      <p style={{ fontSize: '11px', color: '#15803D', margin: '4px 0 0 0', lineHeight: '1.4' }}>
                        Akibat retur barang, total pembayaran yang telah diterima (<strong>{formatIDR(rawPaidAmount)}</strong>) melebihi tagihan bersih (<strong>{formatIDR(grandTotal)}</strong>).<br/>
                        Jika uang sudah diserahkan/ditransfer ke toko, klik tombol di bawah untuk menyelesaikannya.
                      </p>
                      <button
                        type="button"
                        disabled={isRefunding}
                        onClick={openRefundDialog}
                        className="bg-[#0F172A] hover:bg-slate-900 text-white dark:bg-tko-brand-500 dark:hover:bg-tko-brand-600 dark:text-tko-forest-950 dark:font-black shadow-tko-brand active:scale-95 transition-all w-full flex items-center justify-center gap-1.5 text-xs py-2.5 px-3 rounded-lg mt-2 text-center uppercase font-bold tracking-wider"
                      >
                        {isRefunding ? <Loader2 size={14} className="animate-spin" /> : `✓ Atur / Tandai Pengembalian Uang (${formatIDR(overpayAmount)})`}
                      </button>
                    </div>
                  </div>
                </div>
              )}
            </div>

            {/* Section: Riwayat Pembayaran */}
            <div style={{ background: 'var(--bg-page)', borderRadius: '16px', padding: '16px', border: `1px solid ${C.border}` }}>
              <p style={sLabel}>HISTORI PEMBAYARAN ({sortedPayments.length})</p>
              {sortedPayments.length === 0 ? (
                <p style={{ fontSize: '11px', color: C.muted, fontStyle: 'italic', marginTop: '8px' }}>
                  Belum ada catatan pembayaran.
                </p>
              ) : (
                <div style={{ display: 'flex', flexDirection: 'column', gap: '8px', marginTop: '10px' }}>
                  {sortedPayments.map((p, pIdx) => {
                    const isRefund = p.payment_method === 'pengembalian_tunai_retur' || Number(p.amount) < 0
                    return (
                      <div
                        key={p.id || pIdx}
                        style={{
                          background: 'var(--bg-surface)',
                          border: `1px solid ${C.border}`,
                          borderRadius: '12px',
                          padding: '10px 12px',
                          display: 'flex',
                          justifyContent: 'space-between',
                          alignItems: 'center',
                          boxShadow: '0 1px 2px rgba(0,0,0,0.02)'
                        }}
                      >
                        <div style={{ flex: 1, minWidth: 0, paddingRight: '8px' }}>
                          <div style={{ display: 'flex', gap: '6px', alignItems: 'center', flexWrap: 'wrap' }}>
                            <span style={{
                              fontSize: '9px',
                              fontWeight: 800,
                              padding: '1.5px 5px',
                              borderRadius: '4px',
                              background: isRefund ? '#FEF2F2' : p.payment_method === 'transfer' ? '#EFF6FF' : '#F3F4F6',
                              color: isRefund ? '#DC2626' : p.payment_method === 'transfer' ? '#2563EB' : '#4B5563',
                              border: `1px solid ${isRefund ? '#FCA5A5' : p.payment_method === 'transfer' ? '#BFDBFE' : '#E5E7EB'}`,
                              textTransform: 'uppercase'
                            }}>
                              {isRefund ? 'Refund' : p.payment_method || 'cash'}
                            </span>
                            <span style={{ fontSize: '11px', color: C.muted }}>{fmtDate(p.payment_date)}</span>
                          </div>
                          {p.notes && (
                            <p style={{ fontSize: '10px', color: C.muted, marginTop: '4px', fontStyle: 'italic', wordBreak: 'break-word' }}>
                              "{p.notes}"
                            </p>
                          )}
                          {p.reference_number && (
                            <p style={{ fontSize: '9px', color: 'var(--text-muted)', marginTop: '2px', fontFamily: 'monospace', wordBreak: 'break-all' }}>
                              Ref: {p.reference_number}
                            </p>
                          )}
                        </div>
                        <div style={{ textAlign: 'right' }}>
                          <span style={{
                            fontSize: '13px',
                            fontWeight: 800,
                            color: isRefund ? '#DC2626' : 'var(--text-primary)'
                          }}>
                            {isRefund ? '-' : ''}{formatIDR(Math.abs(p.amount))}
                          </span>
                        </div>
                      </div>
                    )
                  })}
                </div>
              )}
            </div>

            {/* Section: Profit Analysis (Owner Only) */}
            {isOwner && (
              <div style={{ background: 'var(--bg-page)', borderRadius: '16px', padding: '16px', border: `1px solid var(--border-soft)` }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '8px' }}>
                  <p style={{ ...sLabel, color: C.green, margin: 0 }}>ANALISIS LABA (INTERNAL)</p>
                  <div style={{ display: 'flex', gap: '6px', alignItems: 'center' }}>
                    <span style={{
                      fontSize: '9px',
                      fontWeight: 800,
                      padding: '2px 6px',
                      borderRadius: '5px',
                      textTransform: 'uppercase',
                      background: netMarginPct < 0 ? '#FEE2E2' : netMarginPct <= 10 ? '#FEF3C7' : '#D1FAE5',
                      color: netMarginPct < 0 ? '#DC2626' : netMarginPct <= 10 ? '#D97706' : '#059669',
                      border: `1px solid ${netMarginPct < 0 ? '#FCA5A5' : netMarginPct <= 10 ? '#FDE68A' : '#A7F3D0'}`,
                    }}>
                      {netMarginPct < 0 ? '🚨 RUGI' : netMarginPct <= 10 ? '⚠️ TIPIS' : '✓ SEHAT'}
                    </span>
                    <span style={{ fontSize: '10px', fontWeight: 900, color: profit >= 0 ? C.green : C.red }}>
                      Net Margin {netMarginPct}%
                    </span>
                  </div>
                </div>
                {profit < 0 && (
                  <div style={{ marginTop: '12px', padding: '10px 12px', background: '#FEF2F2', border: '1px solid #FEE2E2', borderRadius: '10px', fontSize: '11px', color: '#DC2626', display: 'flex', gap: '6px', alignItems: 'center' }}>
                    <span>🚨</span>
                    <span><strong>Perhatian:</strong> Transaksi ini rugi karena modal beli lebih besar dibanding harga jual.</span>
                  </div>
                )}
                <div style={{ marginTop: '8px' }}>
                  <DetailRow label="Total Tagihan" value={formatIDR(grandTotal)} />
                  <DetailRow
                    label={totalReturnAmount > 0 ? 'Total COGS / Modal (Bersih)' : fin.cogsIsEstimate ? 'Total COGS / Modal (estimasi batch)' : 'Total COGS / Modal'}
                    value={formatIDR(effectiveCogs)}
                    color={fin.cogsIsEstimate ? '#F59E0B' : undefined}
                  />
                  <DetailRow label="Gross Profit" value={formatIDR(grossProfit)} color={C.green} />
                  {fin.totalExpenses > 0 && (
                    <DetailRow label="Dikurangi Biaya Operasional" value={`-${formatIDR(fin.totalExpenses)}`} color={C.red} />
                  )}
                  <DetailRow label="Estimasi Net Profit" value={formatIDR(profit)} color={profit >= 0 ? C.green : C.red} bold highlight />
                </div>
              </div>
            )}

            {/* Section: Delivery Status */}
            {!isOwner && (
              <div style={{ background: '#F0F9FF', borderRadius: '16px', padding: '16px', border: `1px solid #BAE6FD` }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                  <p style={{ ...sLabel, color: '#60A5FA' }}>PENGIRIMAN</p>
                  <span style={{
                    fontSize: '10px', fontWeight: 900, textTransform: 'uppercase', padding: '3px 10px', borderRadius: '99px',
                    background: isDelivered ? '#F0FDF4' : deliveries.length > 0 ? '#FFFBEB' : '#F1F5F9',
                    color: isDelivered ? '#16A34A' : deliveries.length > 0 ? '#D97706' : '#64748B'
                  }}>
                    {isDelivered ? '✓ TERKIRIM' : deliveries.length > 0 ? 'DI JALAN' : 'BELUM DIKIRIM'}
                  </span>
                </div>

                {deliveries.length > 0 && (
                  <div style={{ marginTop: '12px', display: 'flex', flexDirection: 'column', gap: '8px' }}>
                    {deliveries.map((d, i) => (
                      <div key={d.id || i} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', fontSize: '12px', background: 'var(--bg-surface)', padding: '10px 12px', borderRadius: '10px', border: '1px solid var(--border-soft)' }}>
                        <div style={{ display: 'flex', gap: '8px', alignItems: 'center' }}>
                          <Truck size={14} color="#0284C7" />
                          <span style={{ color: C.text, fontWeight: 700 }}>{[d.vehicle_type, d.vehicle_plate].filter(Boolean).join(' ') || 'Pengiriman'}</span>
                        </div>
                        <span style={{ fontSize: '11px', fontWeight: 800, color: d.status === 'delivered' ? '#16A34A' : '#D97706' }}>
                          {d.status === 'delivered' ? '✓ Terkirim' : d.status === 'on_route' ? 'Di Jalan' : 'Disiapkan'}
                        </span>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            )}

            {sale.notes && (
              <div>
                <p style={sLabel}>CATATAN</p>
                <p style={{ fontSize: '13px', color: C.muted, fontStyle: 'italic', background: 'var(--bg-page)', padding: '12px', borderRadius: '12px', border: `1px solid ${C.border}`, marginTop: '8px' }}>
                  "{sale.notes}"
                </p>
              </div>
            )}
          </div>

          <div style={{
            padding: isDesktop ? '20px 24px' : '16px 20px calc(12px + env(safe-area-inset-bottom, 12px))',
            borderTop: `1px solid ${C.border}`,
            background: C.bg,
            display: 'flex',
            flexDirection: 'column',
            gap: '12px'
          }}>
            {!isDelivered ? (
              <button
                onClick={() => setDeliveryConfirmModal(true)}
                style={{
                  ...sBtn(true),
                  background: '#10B981',
                  borderColor: '#10B981',
                  color: '#06090F',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  gap: '8px',
                  padding: '14px',
                  fontWeight: 900,
                  fontSize: '14px',
                  cursor: 'pointer',
                }}
              >
                <CheckCircle2 size={18} />
                Pesanan Terkirim
              </button>
            ) : (
              <div style={{
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                gap: '6px',
                padding: '12px',
                background: 'rgba(16,185,129,0.1)',
                borderRadius: '12px',
                border: '1px solid rgba(16,185,129,0.2)',
                color: '#34D399',
                fontSize: '13px',
                fontWeight: 800,
              }}>
                <CheckCircle2 size={18} /> Pesanan Terkirim
              </div>
            )}

            <div style={{ display: 'grid', gridTemplateColumns: (isOverpaid && overpayAmount > 0) || remainingAmount > 0 ? '1fr 1fr' : '1fr', gap: '12px' }}>
              <button
                onClick={() => setInvoiceModal({ open: true, type: 'sale' })}
                style={{ ...sBtn(false), display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '8px', padding: '14px' }}
              >
                <FileText size={16} /> Invoice
              </button>
              {isOverpaid && overpayAmount > 0 ? (
                <button
                  disabled={isRefunding}
                  onClick={openRefundDialog}
                  style={{
                    ...sBtn(true),
                    background: '#10B981',
                    borderColor: '#10B981',
                    color: '#022C22',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    gap: '8px',
                    padding: '14px',
                    fontWeight: 900
                  }}
                >
                  {isRefunding ? <Loader2 size={16} className="animate-spin" /> : <CheckCircle2 size={16} />}
                  Konfirmasi Refund
                </button>
              ) : remainingAmount > 0 ? (
                <button
                  onClick={() => setPayTarget(sale)}
                  style={{ ...sBtn(true), display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '8px', padding: '14px' }}
                >
                  <CreditCard size={16} /> Bayar
                </button>
              ) : null}
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px' }}>
              <a
                href={toWaLink(sale.sembako_customers?.phone || '', generateWAMessage(sale, tenant)) || '#'}
                target="_blank"
                rel="noopener noreferrer"
                className="flex items-center justify-center gap-2 border border-[#25D366] text-[#25D366] rounded-xl hover:bg-[#25D366]/5 active:scale-95 transition-all text-xs font-bold"
                style={{ height: '48px', textDecoration: 'none' }}
              >
                <Smartphone size={16} /> Kirim WA
              </a>
              {saleReturns.length > 0 ? (
                <button
                  onClick={() => setConfirmCancelReturn(true)}
                  style={{ ...sBtn(false), display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '8px', padding: '14px', borderColor: '#F87171', color: '#F87171', background: 'rgba(248,113,113,0.08)' }}
                >
                  <ArrowRightLeft size={16} /> Batalkan Retur
                </button>
              ) : (
                <button
                  onClick={openReturnDialog}
                  style={{ ...sBtn(false), display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '8px', padding: '14px', borderColor: C.amber, color: C.amber }}
                >
                  <ArrowRightLeft size={16} /> Retur Barang
                </button>
              )}
            </div>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px' }}>
              <button
                onClick={() => onEdit(sale)}
                style={{ ...sBtn(false), display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '8px', padding: '14px' }}
              >
                <Pencil size={16} /> Edit
              </button>
              <button
                onClick={() => setConfirmDelete(true)}
                style={{ ...sBtn(false), color: C.red, border: `1px solid rgba(239,68,68,0.2)`, background: 'rgba(239,68,68,0.05)', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '8px', padding: '14px' }}
              >
                <Trash2 size={16} /> Hapus
              </button>
            </div>
          </div>
        </SheetContent>
      </Sheet>

      <AlertDialog open={refundDialogOpen} onOpenChange={setRefundDialogOpen}>
        <AlertDialogContent className="bg-[#0C1319] border border-white/10 rounded-2xl max-w-md p-6">
          <AlertDialogHeader>
            <AlertDialogTitle className="text-emerald-400 font-black text-lg uppercase tracking-wide flex items-center gap-2">
              💵 Pengembalian Uang Retur / Overpay
            </AlertDialogTitle>
            <AlertDialogDescription className="text-[#94A3B8] text-xs">
              Atur nominal pengembalian uang tunai/transfer ke Toko <strong>{sale?.customer_name}</strong>.
            </AlertDialogDescription>
          </AlertDialogHeader>

          <div className="space-y-4 my-3">
            <div className="bg-emerald-500/10 border border-emerald-500/20 rounded-xl p-3">
              <p className="text-[10px] font-bold text-emerald-400 uppercase tracking-widest">Saldo Deposit / Overpay Maksimal</p>
              <p className="text-lg font-black text-emerald-400">{formatIDR(overpayAmount)}</p>
            </div>

            <div>
              <label className="text-[11px] font-bold text-[#FCD34D] uppercase tracking-wider block mb-1">
                NOMINAL DIKEMBALIKAN SAAT INI
              </label>
              <InputRupiah
                value={refundInputAmount}
                onChange={(v) => setRefundInputAmount(v)}
                placeholder={`Maks ${formatIDR(overpayAmount)}`}
              />
              <p className="text-[10px] text-[#94A3B8] mt-1">
                *Bisa dicicil pengembaliannya (maksimal {formatIDR(overpayAmount)}).
              </p>
            </div>

            <div>
              <label className="text-[11px] font-bold text-[#FCD34D] uppercase tracking-wider block mb-1">
                METODE PENGEMBALIAN
              </label>
              <CustomSelect
                value={refundMethod}
                onChange={setRefundMethod}
                options={[
                  { value: 'cash', label: 'CASH / TUNAI' },
                  { value: 'transfer', label: 'TRANSFER BANK' },
                ]}
              />
            </div>
          </div>

          <AlertDialogFooter className="gap-2">
            <AlertDialogCancel className="bg-[#121B22] text-[#94A3B8] border-white/10 hover:bg-white/10 rounded-xl">
              Batal
            </AlertDialogCancel>
            <AlertDialogAction
              disabled={isRefunding || refundInputAmount <= 0 || refundInputAmount > overpayAmount}
              onClick={handleProcessRefund}
              className="bg-emerald-500 text-slate-950 font-black hover:bg-emerald-400 rounded-xl"
            >
              {isRefunding ? <Loader2 size={16} className="animate-spin" /> : `Kembalikan ${formatIDR(refundInputAmount)}`}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      <AlertDialog open={returnDialogOpen} onOpenChange={setReturnDialogOpen}>
        <AlertDialogContent className="bg-[#0C1319] border border-white/10 rounded-2xl max-w-lg p-6 max-h-[90vh] overflow-y-auto">
          <AlertDialogHeader>
            <AlertDialogTitle className="text-amber-400 font-black text-lg uppercase tracking-wide flex items-center gap-2">
              <ArrowRightLeft size={20} /> Konfirmasi & Input Retur Barang
            </AlertDialogTitle>
            <AlertDialogDescription className="text-[#94A3B8] text-xs font-medium">
              Pilih barang dan jumlah (qty) yang dikembalikan oleh toko untuk Nota <span className="font-bold text-white">{sale?.invoice_number}</span>. Stok barang akan otomatis dikembalikan ke gudang.
            </AlertDialogDescription>
          </AlertDialogHeader>

          <div className="space-y-4 my-4">
            {returnFormItems.map((item, idx) => {
              const currentReturVal = Number(item.return_qty || 0) * item.unit_price
              return (
                <div key={idx} className="p-3.5 bg-white/[0.03] border border-white/10 rounded-xl space-y-3">
                  <div className="flex justify-between items-start">
                    <div>
                      <p className="text-sm font-bold text-white">{item.product_name}</p>
                      <p className="text-[11px] text-[#94A3B8]">
                        Harga: <span className="font-semibold text-white">{formatIDR(item.unit_price)}</span> / {item.unit}
                      </p>
                    </div>
                    <Badge variant="outline" className="border-[#0F172A]/30 text-amber-400 text-[10px] font-bold">
                      Maks Retur: {item.max_qty} {item.unit}
                    </Badge>
                  </div>

                  {item.max_qty > 0 ? (
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-1">
                      <div>
                        <label className="text-[10px] font-bold text-[#94A3B8] uppercase block mb-1">
                          JUMLAH RETUR ({item.unit.toUpperCase()})
                        </label>
                        <input
                          type="number"
                          min="0"
                          max={item.max_qty}
                          value={item.return_qty}
                          onChange={(e) => {
                            const val = Math.min(item.max_qty, Math.max(0, parseInt(e.target.value) || 0))
                            updateReturnFormItem(idx, 'return_qty', val)
                          }}
                          className="w-full bg-[#121B22] border border-white/10 rounded-lg px-3 py-2 text-white font-bold text-sm focus:outline-none focus:border-slate-500"
                          placeholder="0"
                        />
                      </div>
                      <div>
                        <label className="text-[10px] font-bold text-[#94A3B8] uppercase block mb-1">
                          ALASAN RETUR
                        </label>
                        <CustomSelect
                          value={item.reason}
                          onChange={(val) => updateReturnFormItem(idx, 'reason', val)}
                          options={[
                            { value: 'Kemasan Rusak / Cacat', label: 'Kemasan Rusak / Cacat Fisik' },
                            { value: 'Kadaluwarsa / Expired', label: 'Kadaluwarsa / Expired' },
                            { value: 'Salah Kirim Barang', label: 'Salah Kirim Varian / Barang' },
                            { value: 'Kualitas Tidak Sesuai Standar', label: 'Kualitas Tidak Sesuai / Rusak' },
                            { value: 'Toko Minta Dikembalikan', label: 'Permintaan Toko / Pelanggan' },
                            { value: 'Lainnya', label: 'Alasan Lainnya' },
                          ]}
                        />
                      </div>
                    </div>
                  ) : (
                    <p className="text-xs text-red-400 italic">Seluruh barang ini sudah diretur sebelumnya.</p>
                  )}

                  {Number(item.return_qty) > 0 && (
                    <div className="flex justify-between items-center text-xs pt-1 border-t border-white/5">
                      <span className="text-[#94A3B8]">Nilai Potongan Retur:</span>
                      <span className="font-extrabold text-amber-400">{formatIDR(currentReturVal)}</span>
                    </div>
                  )}
                </div>
              )
            })}

            <div className="p-3 bg-[#0F172A]/10 border border-[#0F172A]/20 rounded-xl flex justify-between items-center text-sm">
              <span className="text-amber-200 font-bold">TOTAL ESTIMASI POTONGAN:</span>
              <span className="text-amber-400 font-black text-base">
                {formatIDR(
                  returnFormItems.reduce((s, i) => s + (Number(i.return_qty || 0) * i.unit_price), 0)
                )}
              </span>
            </div>
          </div>

          <AlertDialogFooter className="gap-2">
            <AlertDialogCancel className="bg-white/5 text-[#94A3B8] border-white/10 hover:bg-white/10 rounded-xl">
              Batal
            </AlertDialogCancel>
            <AlertDialogAction
              disabled={isSubmittingReturn || !returnFormItems.some(i => Number(i.return_qty) > 0)}
              onClick={handleProcessReturn}
              className="bg-[#0F172A] text-slate-950 font-black hover:bg-amber-400 rounded-xl"
            >
              {isSubmittingReturn ? <Loader2 size={16} className="animate-spin" /> : 'Konfirmasi & Simpan Retur'}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      <AlertDialog open={confirmCancelReturn} onOpenChange={setConfirmCancelReturn}>
        <AlertDialogContent className="bg-[#0C1319] border border-white/10 rounded-2xl max-w-md p-6">
          <AlertDialogHeader>
            <AlertDialogTitle className="text-red-400 font-black text-lg uppercase tracking-wide flex items-center gap-2">
              ⚠️ Batalkan Retur & Refund Barang?
            </AlertDialogTitle>
            <AlertDialogDescription className="text-[#94A3B8] text-xs">
              Membatalkan retur pada Nota <strong className="text-white">{sale?.invoice_number}</strong> akan menghapus potongan retur barang dan mengembalikan nilai tagihan nota ke semula.
            </AlertDialogDescription>
          </AlertDialogHeader>

          <div className="bg-red-500/10 border border-red-500/20 rounded-xl p-3 my-3 space-y-1">
            <p className="text-[10px] font-bold text-red-400 uppercase tracking-widest">Retur Terpasang Saat Ini:</p>
            <p className="text-sm font-extrabold text-white">
              {saleReturns.reduce((s, r) => s + Number(r.quantity || 0), 0)} unit items · Potongan {formatIDR(saleReturns.reduce((s, r) => s + Number(r.total_amount || 0), 0))}
            </p>
          </div>

          <AlertDialogFooter className="gap-2">
            <AlertDialogCancel className="bg-[#121B22] text-[#94A3B8] border-white/10 hover:bg-white/10 rounded-xl">
              Batal
            </AlertDialogCancel>
            <AlertDialogAction
              disabled={voidReturnsMut.isPending}
              onClick={handleCancelReturn}
              className="bg-red-500 text-white font-black hover:bg-red-600 rounded-xl"
            >
              {voidReturnsMut.isPending ? <Loader2 size={16} className="animate-spin" /> : 'Ya, Batalkan Retur'}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      <AlertDialog open={confirmDelete} onOpenChange={setConfirmDelete}>
        <AlertDialogContent className="bg-[#0C1319] border border-white/10 rounded-2xl max-w-sm">
          <AlertDialogHeader>
            <AlertDialogTitle className="text-red-500 font-black text-base uppercase tracking-wide">
              Hapus Transaksi?
            </AlertDialogTitle>
            <AlertDialogDescription className="text-[#4B6478] text-sm font-medium">
              Transaksi ini akan dihapus secara permanen. Tindakan ini tidak dapat dibatalkan.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter className="gap-2 mt-2">
            <AlertDialogCancel className="flex-1 h-11 bg-white/5 border-white/10 text-white font-black uppercase text-xs tracking-wider hover:bg-white/10">
              Batal
            </AlertDialogCancel>
            <AlertDialogAction
              onClick={handleDelete}
              className="flex-1 h-11 bg-red-500 hover:bg-red-600 text-white font-black uppercase text-xs tracking-wider border-none"
            >
              Hapus
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      <SembakoPaymentSheet sale={payTarget} onClose={() => setPayTarget(null)} />
      
      <DeliveryCompletionModal
        isOpen={deliveryConfirmModal}
        onClose={() => setDeliveryConfirmModal(false)}
        sale={sale}
        delivery={deliveries.find(d => d.status !== 'delivered') || deliveries[0]}
      />

      {sale && invoiceModal.open && (
        <InvoicePreviewModal
          type={invoiceModal.type === 'sale' ? 'sembako_sale' : invoiceModal.type}
          isOpen={invoiceModal.open}
          onClose={() => setInvoiceModal({ open: false, type: null })}
          data={{
            tenant:      { business_name: tenant?.business_name, phone: tenant?.phone, location: tenant?.location },
            invoice:     sale,
            customer:    sale.sembako_customers,
            items: items.map(it => {
              const qty = Number(it.quantity || it.quantity_kg || 0)
              const price = Number(it.sell_price ?? it.price_per_unit ?? it.unit_price ?? it.price_per_kg ?? (qty > 0 && it.subtotal ? it.subtotal / qty : 0) ?? 0)
              const cost = Number(it.cogs_per_unit ?? it.cost_per_kg ?? 0)
              const subtotal = Number(it.subtotal ?? Math.round(qty * price))
              return {
                product_name: it.product_name,
                quantity: qty,
                quantity_kg: qty,
                unit: it.unit || 'pcs',
                price_per_unit: price,
                sell_price: price,
                price_per_kg: price,
                cost_per_unit: cost,
                cost_per_kg: cost,
                subtotal: subtotal
              }
            }),
            generatedBy: profile?.full_name || '',
            showProfit:  false,
          }}
        />
      )}
    </>
  )
}
