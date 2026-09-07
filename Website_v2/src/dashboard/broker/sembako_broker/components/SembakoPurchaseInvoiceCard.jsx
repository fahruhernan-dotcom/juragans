import React, { useState } from 'react'
import {
  Factory, Calendar, Clock, CheckCircle2, AlertCircle,
  Printer, DollarSign, ChevronRight, FileText, ChevronDown,
  Layers, Package, Building2, Edit3, Trash2
} from 'lucide-react'
import { formatIDR, formatDate } from '@/lib/format'
import { Button } from '@/components/ui/button'
import { cn } from '@/lib/utils'

export function SembakoPurchaseInvoiceCard({
  invoice,
  onOpenPreview,
  onOpenPayDebt,
  onOpenEdit,
  onDelete,
  isDesktop
}) {
  const [expanded, setExpanded] = useState(false)

  const isLunas = invoice.payment_status === 'lunas'
  const isTempo = invoice.payment_status === 'tempo' || invoice.payment_status === 'belum_lunas'
  const isSebagian = invoice.payment_status === 'sebagian'

  const items = Array.isArray(invoice.items) ? invoice.items : []

  return (
    <div className="bg-white border border-slate-200/90 rounded-2xl p-4 sm:p-5 shadow-xs hover:shadow-md transition-all">
      {/* Top Meta Bar */}
      <div className="flex flex-wrap items-center justify-between gap-2 pb-3 border-b border-slate-100">
        <div className="flex items-center gap-2">
          <span className="px-2.5 py-1 rounded-lg bg-slate-100 text-slate-900 font-mono font-bold text-xs">
            {invoice.invoice_number}
          </span>
          <span className="text-xs text-slate-500 font-medium flex items-center gap-1">
            <Calendar size={12} className="text-slate-400" />
            {formatDate(invoice.transaction_date)}
          </span>
        </div>

        <div className="flex items-center gap-1.5">
          {isLunas ? (
            <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-[10px] font-black uppercase tracking-wider bg-emerald-50 text-emerald-700 border border-emerald-200">
              <CheckCircle2 size={12} /> LUNAS
            </span>
          ) : isTempo ? (
            <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-[10px] font-black uppercase tracking-wider bg-rose-50 text-rose-700 border border-rose-200">
              <Clock size={12} /> TEMPO / HUTANG
            </span>
          ) : (
            <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-[10px] font-black uppercase tracking-wider bg-blue-50 text-blue-700 border border-blue-200">
              <AlertCircle size={12} /> SEBAGIAN
            </span>
          )}
        </div>
      </div>

      {/* Main Details Body */}
      <div className="py-3.5 grid grid-cols-1 sm:grid-cols-12 gap-3 sm:gap-4 items-center">
        {/* Supplier & Method */}
        <div className="sm:col-span-5 space-y-1">
          <div className="flex items-center gap-1.5 text-slate-900 font-black text-sm sm:text-base leading-snug">
            <Factory size={16} className="text-[#0EA5E9] shrink-0" />
            <span className="truncate">{invoice.supplier_name || 'Pabrik Bawang'}</span>
          </div>
          <p className="text-xs text-slate-500 font-medium pl-5">
            Sumber Dana: <span className="text-slate-700 font-bold">{invoice.payment_method}</span>
          </p>
          {invoice.due_date && !isLunas && (
            <p className="text-[11px] text-amber-700 font-bold pl-5 flex items-center gap-1">
              <Clock size={11} /> Jth Tempo: {formatDate(invoice.due_date)}
            </p>
          )}
        </div>

        {/* Items Preview Count & Breakdown */}
        <div className="sm:col-span-4 space-y-1">
          <span className="text-[10px] font-black text-slate-400 uppercase tracking-wider block">
            Rincian Barang Masuk
          </span>
          <div className="flex flex-wrap gap-1">
            {items.slice(0, 3).map((it, i) => (
              <span
                key={i}
                className="text-[10px] font-bold px-2 py-0.5 rounded-md bg-slate-100 text-slate-700 border border-slate-200/80"
              >
                {it.quantity} {it.unit} {it.product_name || it.item_name}
              </span>
            ))}
            {items.length > 3 && (
              <span className="text-[10px] font-bold px-1.5 py-0.5 rounded-md bg-slate-100 text-slate-500">
                +{items.length - 3} lainnya
              </span>
            )}
          </div>
        </div>

        {/* Financial Total & Remaining Debt */}
        <div className="sm:col-span-3 sm:text-right space-y-0.5 pt-2 sm:pt-0 border-t sm:border-t-0 border-slate-100">
          <span className="text-[10px] font-black text-slate-400 uppercase tracking-wider block">
            Total Tagihan
          </span>
          <p className="text-base sm:text-lg font-black text-slate-900 font-mono">
            {formatIDR(invoice.total_amount)}
          </p>
          {!isLunas && (
            <p className="text-xs font-bold text-rose-600">
              Sisa Hutang: {formatIDR(invoice.remaining_debt)}
            </p>
          )}
        </div>
      </div>

      {/* Expandable Item Details if any */}
      {expanded && items.length > 0 && (
        <div className="mt-2 pt-3 border-t border-slate-100 space-y-1.5 bg-slate-50/70 rounded-xl p-3 text-xs">
          <p className="text-[10px] font-black uppercase tracking-wider text-slate-500 mb-1">
            Daftar Lengkap Barang Faktur Ini:
          </p>
          {items.map((it, idx) => (
            <div key={idx} className="flex justify-between items-center text-slate-700 py-0.5">
              <span>{idx + 1}. {it.product_name || it.item_name} ({it.quantity} {it.unit})</span>
              <span className="font-mono font-bold text-slate-900">{formatIDR(it.subtotal)}</span>
            </div>
          ))}
          {invoice.notes && (
            <div className="pt-2 mt-2 border-t border-slate-200 text-slate-600 text-[11px]">
              <span className="font-bold">Catatan:</span> {invoice.notes}
            </div>
          )}
        </div>
      )}

      {/* Card Actions Footer */}
      <div className="mt-3 pt-3 border-t border-slate-100 flex flex-wrap items-center justify-between gap-2">
        <button
          type="button"
          onClick={() => setExpanded(!expanded)}
          className="text-xs font-bold text-slate-500 hover:text-slate-800 flex items-center gap-1 cursor-pointer"
        >
          <span>{expanded ? 'Sembunyikan Rincian' : 'Lihat Rincian Item'}</span>
          <ChevronDown size={14} className={cn("transition-transform", expanded && "rotate-180")} />
        </button>

        <div className="flex items-center gap-2">
          {onOpenEdit && (
            <Button
              type="button"
              size="sm"
              variant="outline"
              onClick={() => onOpenEdit(invoice)}
              className="h-9 px-3 rounded-xl border-slate-200 hover:bg-sky-50 hover:text-sky-700 hover:border-sky-200 text-slate-700 text-xs font-bold gap-1.5 cursor-pointer shadow-xs"
              title="Edit faktur pembelian ini"
            >
              <Edit3 size={13} className="text-sky-600" />
              <span className="hidden sm:inline">Edit</span>
            </Button>
          )}

          {onDelete && (
            <Button
              type="button"
              size="sm"
              variant="outline"
              onClick={() => onDelete(invoice)}
              className="h-9 px-3 rounded-xl border-slate-200 hover:bg-rose-50 hover:text-rose-700 hover:border-rose-200 text-slate-700 text-xs font-bold gap-1.5 cursor-pointer shadow-xs"
              title="Hapus faktur dan kembalikan stok"
            >
              <Trash2 size={13} className="text-rose-600" />
              <span className="hidden sm:inline">Hapus</span>
            </Button>
          )}

          {!isLunas && onOpenPayDebt && (
            <Button
              size="sm"
              onClick={() => onOpenPayDebt(invoice)}
              className="h-9 px-3 rounded-xl bg-rose-600 hover:bg-rose-700 text-white text-xs font-bold gap-1.5 cursor-pointer shadow-xs"
            >
              <DollarSign size={13} />
              <span>Bayar Hutang</span>
            </Button>
          )}

          <Button
            size="sm"
            onClick={() => onOpenPreview(invoice)}
            className="h-9 px-3.5 rounded-xl bg-[#0EA5E9] hover:bg-[#0284C7] text-white text-xs font-black gap-1.5 cursor-pointer shadow-xs"
          >
            <Printer size={13} />
            <span>Lihat / Cetak Faktur</span>
          </Button>
        </div>
      </div>
    </div>
  )
}
