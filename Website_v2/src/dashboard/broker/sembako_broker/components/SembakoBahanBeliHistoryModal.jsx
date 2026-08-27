import React, { useState, useMemo } from 'react'
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter
} from '@/components/ui/dialog'
import { useSembakoAuditLogs } from '@/lib/hooks/useSembakoAudit'
import { formatIDR, formatDate } from '@/lib/format'
import { History, Search, Calendar, Store, ArrowUpRight, FileText, User, Layers, Tag, X } from 'lucide-react'

export function SembakoBahanBeliHistoryModal({ open, onOpenChange, material, onClose }) {
  const { data: logs = [], isLoading } = useSembakoAuditLogs()
  const [search, setSearch] = useState('')

  const handleClose = () => {
    if (onClose) onClose()
    if (onOpenChange) onOpenChange(false)
  }

  // Filter and parse logs specifically for raw material restocks
  const restockHistory = useMemo(() => {
    return logs
      .filter((l) => {
        if (l.action_type !== 'RESTOCK_BAHAN') return false
        if (material?.material_name && l.product_name !== material.material_name) return false
        return true
      })
      .map((l) => {
        let meta = {}
        try {
          if (l.notes && l.notes.startsWith('{')) {
            meta = JSON.parse(l.notes)
          }
        } catch {
          // ignore
        }

        const dateStr = l.timestamp || l.created_at
        return {
          id: l.id,
          timestamp: dateStr,
          product_name: l.product_name,
          user_name: l.user_name || 'Admin',
          user_role: l.user_role || 'Staff',
          qty_added: meta.qty_added || 0,
          unit: meta.unit || material?.unit || 'pcs',
          unit_cost: meta.unit_cost || 0,
          total_spent: meta.total_spent || 0,
          prev_stock: meta.prev_stock ?? '-',
          new_stock: meta.new_stock ?? '-',
          supplier_name: meta.supplier_name || 'Supplier Mandiri',
          notes: meta.notes || (l.notes && !l.notes.startsWith('{') ? l.notes : ''),
          raw_log: l
        }
      })
      .filter((item) => {
        if (!search.trim()) return true
        const q = search.toLowerCase()
        return (
          item.product_name?.toLowerCase().includes(q) ||
          item.supplier_name?.toLowerCase().includes(q) ||
          item.notes?.toLowerCase().includes(q) ||
          item.user_name?.toLowerCase().includes(q)
        )
      })
  }, [logs, material, search])

  // Summary stats
  const stats = useMemo(() => {
    const totalTransactions = restockHistory.length
    const totalSpent = restockHistory.reduce((acc, h) => acc + (Number(h.total_spent) || 0), 0)
    const totalQty = restockHistory.reduce((acc, h) => acc + (Number(h.qty_added) || 0), 0)
    const avgCost = totalQty > 0 ? Math.round(totalSpent / totalQty) : (material?.unit_cost || 0)
    return { totalTransactions, totalSpent, totalQty, avgCost }
  }, [restockHistory, material])

  const titleText = material
    ? `Riwayat Pembelian: ${material.material_name}`
    : 'Rekap Riwayat Pembelian Semua Bahan Baku'

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="w-full max-w-3xl bg-white dark:bg-[#0E1726] text-slate-900 dark:text-slate-100 rounded-3xl border border-slate-200 dark:border-white/10 p-0 overflow-hidden shadow-2xl max-h-[90vh] flex flex-col">
        {/* Header */}
        <DialogHeader className="p-5 bg-amber-50/70 dark:bg-amber-950/20 border-b border-amber-200/50 dark:border-amber-500/20 flex-shrink-0">
          <div className="flex items-center justify-between gap-4">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-2xl bg-amber-500 text-white flex items-center justify-center font-bold shadow-md shrink-0">
                <History size={20} />
              </div>
              <div>
                <DialogTitle className="text-base font-black text-slate-900 dark:text-white font-['Sora']">
                  {titleText}
                </DialogTitle>
                <DialogDescription className="text-xs text-slate-500 dark:text-slate-400 font-medium">
                  {material ? (
                    <>
                      Stok Sekarang: <span className="font-bold text-foreground">{material.current_stock} {material.unit}</span> · HPP Terkini: <span className="font-bold text-amber-600 dark:text-amber-400">{formatIDR(material.unit_cost)}</span>
                    </>
                  ) : (
                    'Semua catatan mutasi belanja pouch, stiker, dan bahan baku.'
                  )}
                </DialogDescription>
              </div>
            </div>

            <button
              type="button"
              onClick={handleClose}
              className="w-8 h-8 rounded-full bg-slate-200/70 dark:bg-white/10 hover:bg-slate-300 dark:hover:bg-white/20 text-slate-600 dark:text-slate-200 flex items-center justify-center transition cursor-pointer shrink-0 z-30"
              title="Tutup"
            >
              <X size={16} />
            </button>
          </div>

          {/* Top Summary Cards */}
          <div className="grid grid-cols-3 gap-2.5 mt-4">
            <div className="p-3 rounded-2xl bg-white dark:bg-white/5 border border-amber-200/60 dark:border-amber-500/20">
              <p className="text-[10px] font-bold uppercase text-slate-500 tracking-wider">Total Frekuensi</p>
              <p className="text-base font-black text-slate-900 dark:text-white mt-0.5">
                {stats.totalTransactions} <span className="text-xs font-semibold text-muted-foreground">kali restok</span>
              </p>
            </div>
            <div className="p-3 rounded-2xl bg-white dark:bg-white/5 border border-amber-200/60 dark:border-amber-500/20">
              <p className="text-[10px] font-bold uppercase text-slate-500 tracking-wider">Total Belanja</p>
              <p className="text-base font-black text-amber-600 dark:text-amber-400 mt-0.5">
                {formatIDR(stats.totalSpent)}
              </p>
            </div>
            <div className="p-3 rounded-2xl bg-white dark:bg-white/5 border border-amber-200/60 dark:border-amber-500/20">
              <p className="text-[10px] font-bold uppercase text-slate-500 tracking-wider">Rata-rata Harga Beli</p>
              <p className="text-base font-black text-emerald-600 dark:text-emerald-400 mt-0.5">
                {formatIDR(stats.avgCost)} <span className="text-[10px] font-semibold text-muted-foreground">/{material?.unit || 'unit'}</span>
              </p>
            </div>
          </div>
        </DialogHeader>

        {/* Search Bar */}
        <div className="px-5 py-3 border-b border-slate-100 dark:border-white/5 bg-slate-50/50 dark:bg-white/[0.02] flex items-center gap-2 flex-shrink-0">
          <div className="relative flex-1">
            <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
            <input
              type="text"
              placeholder="Cari berdasarkan nama supplier, nomor nota, atau catatan..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="w-full pl-9 pr-3.5 py-2 rounded-xl bg-white dark:bg-white/5 border border-slate-200 dark:border-white/10 text-xs text-slate-900 dark:text-white placeholder-slate-400 focus:outline-none focus:border-amber-500"
            />
          </div>
        </div>

        {/* History List Table / Cards */}
        <div className="flex-1 overflow-y-auto p-5 space-y-3">
          {isLoading ? (
            <div className="py-12 text-center text-xs text-slate-400">
              Memuat riwayat transaksi...
            </div>
          ) : restockHistory.length === 0 ? (
            <div className="py-12 text-center space-y-2">
              <div className="w-12 h-12 rounded-2xl bg-slate-100 dark:bg-white/5 flex items-center justify-center mx-auto text-slate-400">
                <History size={24} />
              </div>
              <p className="text-xs font-bold text-slate-700 dark:text-slate-300">Belum Ada Riwayat Belanja</p>
              <p className="text-[11px] text-slate-400 max-w-sm mx-auto">
                Riwayat akan otomatis tercatat setiap kali Anda melakukan restok melalui tombol <strong>+ Tambah Stok</strong>.
              </p>
            </div>
          ) : (
            <div className="space-y-2.5">
              {restockHistory.map((item) => (
                <div
                  key={item.id}
                  className="p-3.5 rounded-2xl bg-slate-50/80 dark:bg-white/[0.03] border border-slate-200/80 dark:border-white/5 hover:border-amber-500/40 transition-all flex flex-col sm:flex-row sm:items-center justify-between gap-3 text-xs"
                >
                  {/* Left: Date, Supplier, Product */}
                  <div className="space-y-1 min-w-0 flex-1">
                    <div className="flex items-center gap-2 flex-wrap">
                      <span className="flex items-center gap-1 font-bold text-slate-900 dark:text-white text-xs">
                        <Calendar size={12} className="text-amber-500" />
                        {formatDate(item.timestamp)}
                      </span>
                      <span className="px-2 py-0.5 rounded-md text-[10px] font-bold bg-amber-500/10 text-amber-700 dark:text-amber-400 border border-amber-500/20">
                        +{item.qty_added} {item.unit}
                      </span>
                    </div>

                    <div className="flex items-center gap-3 text-[11px] text-muted-foreground flex-wrap pt-0.5">
                      <span className="flex items-center gap-1 font-medium">
                        <Store size={11} className="text-slate-400" />
                        {item.supplier_name}
                      </span>
                      <span className="flex items-center gap-1 font-medium">
                        <User size={11} className="text-slate-400" />
                        {item.user_name}
                      </span>
                    </div>

                    {item.notes && (
                      <p className="text-[10.5px] text-slate-500 dark:text-slate-400 italic mt-0.5">
                        "{item.notes}"
                      </p>
                    )}
                  </div>

                  {/* Right: Pricing Details */}
                  <div className="sm:text-right border-t sm:border-t-0 pt-2 sm:pt-0 border-slate-200 dark:border-white/5 flex sm:flex-col justify-between sm:justify-center items-center sm:items-end gap-1">
                    <div>
                      <p className="text-[10px] text-muted-foreground">Harga Beli Satuan:</p>
                      <p className="font-extrabold text-xs text-slate-900 dark:text-white">
                        {formatIDR(item.unit_cost)} <span className="text-[10px] font-normal text-muted-foreground">/{item.unit}</span>
                      </p>
                    </div>
                    <div>
                      <p className="text-[10px] text-muted-foreground">Total Nota:</p>
                      <p className="font-black text-xs text-amber-600 dark:text-amber-400">
                        {formatIDR(item.total_spent)}
                      </p>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Footer */}
        <DialogFooter className="p-4 bg-slate-50 dark:bg-white/[0.02] border-t border-slate-100 dark:border-white/5 flex items-center justify-between flex-shrink-0">
          <span className="text-[11px] text-muted-foreground">
            Menampilkan <strong>{restockHistory.length}</strong> catatan pembelian
          </span>
          <button
            type="button"
            onClick={handleClose}
            className="px-5 py-2 rounded-xl bg-slate-900 dark:bg-white hover:bg-slate-800 dark:hover:bg-slate-100 text-white dark:text-slate-900 font-bold text-xs cursor-pointer transition shadow-sm"
          >
            Tutup
          </button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
