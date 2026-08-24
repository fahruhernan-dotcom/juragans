import React, { useState, useMemo } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import {
  ShieldAlert,
  Search,
  Filter,
  Trash2,
  Edit,
  ArrowRightLeft,
  Package,
  ShoppingCart,
  RefreshCw,
  User,
  Calendar,
  Clock,
  Download,
  AlertCircle,
  FileSpreadsheet,
  CheckCircle2,
  ShieldCheck,
  Building2,
  Store
} from 'lucide-react'
import {
  useSembakoAuditLogs,
  useClearSembakoAuditLogs,
  useDeleteSingleAuditLog,
  usePurgeAuditLogsBeforeDate
} from '@/lib/hooks/useSembakoAudit'
import { useAuth } from '@/lib/hooks/useAuth'
import { isDevUser } from '@/lib/auth/business-roles'
import { formatIDR, formatDate } from '@/lib/format'
import { Badge } from '@/components/ui/badge'
import { Input } from '@/components/ui/input'
import { Button } from '@/components/ui/button'
import { cn } from '@/lib/utils'
import EmptyState from '@/components/EmptyState'
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog"

function getActionStyle(action_type) {
  const type = String(action_type || '').toUpperCase()
  if (type.includes('DELETE_SUPPLIER') || type.includes('HAPUS_SUPPLIER')) {
    return { label: 'HAPUS SUPPLIER', icon: Trash2, bg: 'bg-rose-500/15', text: 'text-rose-500', border: 'border-rose-500/30' }
  }
  if (type.includes('DELETE_CUSTOMER') || type.includes('HAPUS_TOKO') || type.includes('HAPUS_CUSTOMER')) {
    return { label: 'HAPUS TOKO', icon: Trash2, bg: 'bg-rose-500/15', text: 'text-rose-500', border: 'border-rose-500/30' }
  }
  if (type.includes('DELETE') || type.includes('HAPUS')) {
    return { label: 'HAPUS DATA', icon: Trash2, bg: 'bg-rose-500/15', text: 'text-rose-500', border: 'border-rose-500/30' }
  }
  if (type.includes('EDIT_SUPPLIER')) {
    return { label: 'EDIT SUPPLIER', icon: Edit, bg: 'bg-purple-500/15', text: 'text-purple-400', border: 'border-purple-500/30' }
  }
  if (type.includes('EDIT_CUSTOMER')) {
    return { label: 'EDIT TOKO', icon: Edit, bg: 'bg-purple-500/15', text: 'text-purple-400', border: 'border-purple-500/30' }
  }
  if (type.includes('EDIT')) {
    return { label: 'EDIT DATA', icon: Edit, bg: 'bg-purple-500/15', text: 'text-purple-400', border: 'border-purple-500/30' }
  }
  if (type.includes('ADJ') || type.includes('ADJUST')) {
    return { label: 'PENYESUAIAN STOK', icon: ArrowRightLeft, bg: 'bg-amber-500/15', text: 'text-amber-400', border: 'border-amber-500/30' }
  }
  if (type.includes('MASUK') || type.includes('IN')) {
    return { label: 'STOK MASUK', icon: Package, bg: 'bg-emerald-500/15', text: 'text-emerald-400', border: 'border-emerald-500/30' }
  }
  if (type.includes('KELUAR') || type.includes('SALE') || type.includes('OUT')) {
    return { label: 'PENJUALAN', icon: ShoppingCart, bg: 'bg-sky-500/15', text: 'text-sky-400', border: 'border-sky-500/30' }
  }
  if (type.includes('RETUR')) {
    return { label: 'RETUR BARANG', icon: RefreshCw, bg: 'bg-orange-500/15', text: 'text-orange-400', border: 'border-orange-500/30' }
  }
  return { label: type || 'AKTIVITAS', icon: ShieldCheck, bg: 'bg-slate-500/15', text: 'text-slate-400', border: 'border-slate-500/30' }
}

function formatRelativeTime(dateString) {
  if (!dateString) return '-'
  const d = new Date(dateString)
  const now = new Date()
  const diffMs = now - d
  const diffSec = Math.floor(diffMs / 1000)
  const diffMin = Math.floor(diffSec / 60)
  const diffHours = Math.floor(diffMin / 60)
  const diffDays = Math.floor(diffHours / 24)

  if (diffSec < 60) return 'Baru saja'
  if (diffMin < 60) return `${diffMin} mnt lalu`
  if (diffHours < 24) return `${diffHours} jam lalu`
  if (diffDays === 1) return `Kemarin ${d.toLocaleTimeString('id-ID', { hour: '2-digit', minute: '2-digit' })}`
  return `${d.toLocaleDateString('id-ID', { day: 'numeric', month: 'short' })} ${d.toLocaleTimeString('id-ID', { hour: '2-digit', minute: '2-digit' })}`
}

export function SembakoAuditLogView() {
  const { profile } = useAuth()
  const isDev = isDevUser(profile)
  const { data: auditLogs = [], isLoading, isFetching, refetch } = useSembakoAuditLogs()
  const clearLogsMut = useClearSembakoAuditLogs()
  const deleteSingleMut = useDeleteSingleAuditLog()
  const purgeBeforeMut = usePurgeAuditLogsBeforeDate()
  const [search, setSearch] = useState('')
  const [filterType, setFilterType] = useState('ALL') // 'ALL' | 'DELETE' | 'EDIT' | 'STOCK' | 'TRANSACTION'
  const [openClearDialog, setOpenClearDialog] = useState(false)
  const [selectedTargetLog, setSelectedTargetLog] = useState(null)
  const [deleteMode, setDeleteMode] = useState('single') // 'single' | 'before'

  // Summary Metrics
  const stats = useMemo(() => {
    let totalDeletes = 0
    let totalEdits = 0
    let totalStockAdj = 0

    auditLogs.forEach(l => {
      const t = String(l.action_type || '').toUpperCase()
      if (t.includes('DELETE') || t.includes('HAPUS')) totalDeletes++
      if (t.includes('EDIT')) totalEdits++
      if (t.includes('ADJ') || t.includes('ADJUST')) totalStockAdj++
    })

    return {
      total: auditLogs.length,
      totalDeletes,
      totalEdits,
      totalStockAdj
    }
  }, [auditLogs])

  // Filtered Logs
  const filteredLogs = useMemo(() => {
    return auditLogs.filter(log => {
      const type = String(log.action_type || '').toUpperCase()
      const searchLower = search.toLowerCase().trim()

      // 1. Type Category filter
      if (filterType === 'DELETE' && !type.includes('DELETE') && !type.includes('HAPUS')) return false
      if (filterType === 'EDIT' && !type.includes('EDIT')) return false
      if (filterType === 'STOCK' && !type.includes('ADJ') && !type.includes('MASUK') && !type.includes('KELUAR')) return false
      if (filterType === 'TRANSACTION' && !type.includes('SALE') && !type.includes('KELUAR') && !type.includes('RETUR')) return false

      // 2. Search query filter
      if (searchLower) {
        const matchName = String(log.product_name || '').toLowerCase().includes(searchLower)
        const matchUser = String(log.user_name || '').toLowerCase().includes(searchLower)
        const matchNotes = String(log.notes || '').toLowerCase().includes(searchLower)
        const matchAction = String(log.action_type || '').toLowerCase().includes(searchLower)
        if (!matchName && !matchUser && !matchNotes && !matchAction) return false
      }

      return true
    })
  }, [auditLogs, filterType, search])

  // Export to CSV
  const handleExportCSV = () => {
    if (!filteredLogs.length) return
    const headers = ['Waktu', 'Aktor / User', 'Role', 'Jenis Aksi', 'Nama Entitas / Produk', 'Nilai Lama', 'Nilai Baru', 'Catatan']
    const rows = filteredLogs.map(l => [
      `"${new Date(l.timestamp).toLocaleString('id-ID')}"`,
      `"${l.user_name || '-'}"`,
      `"${l.user_role || '-'}"`,
      `"${l.action_type || '-'}"`,
      `"${(l.product_name || '-').replace(/"/g, '""')}"`,
      `"${(l.old_value || '-').replace(/"/g, '""')}"`,
      `"${(l.new_value || '-').replace(/"/g, '""')}"`,
      `"${(l.notes || '-').replace(/"/g, '""')}"`
    ])

    const csvContent = 'data:text/csv;charset=utf-8,\uFEFF' + [headers.join(','), ...rows.map(e => e.join(','))].join('\n')
    const encodedUri = encodeURI(csvContent)
    const link = document.createElement('a')
    link.setAttribute('href', encodedUri)
    link.setAttribute('download', `audit_log_sembako_${new Date().toISOString().slice(0, 10)}.csv`)
    document.body.appendChild(link)
    link.click()
    document.body.removeChild(link)
  }

  return (
    <div className="space-y-6 text-left">
      {/* ── Metric Summary Cards ── */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
        <div className="p-4 rounded-2xl bg-card border border-border/60 shadow-sm space-y-1">
          <span className="text-[10px] font-black uppercase tracking-widest text-muted-foreground">Total Log Audit</span>
          <div className="font-display text-2xl font-black text-foreground">{stats.total}</div>
          <span className="text-[11px] text-muted-foreground block">Semua rekaman aktivitas</span>
        </div>

        <div className="p-4 rounded-2xl bg-rose-500/5 border border-rose-500/20 shadow-sm space-y-1">
          <div className="flex items-center justify-between">
            <span className="text-[10px] font-black uppercase tracking-widest text-rose-500">Aksi Hapus</span>
            <Trash2 size={14} className="text-rose-500" />
          </div>
          <div className="font-display text-2xl font-black text-rose-500">{stats.totalDeletes}</div>
          <span className="text-[11px] text-rose-500/70 block">Toko, Supplier & Data</span>
        </div>

        <div className="p-4 rounded-2xl bg-purple-500/5 border border-purple-500/20 shadow-sm space-y-1">
          <div className="flex items-center justify-between">
            <span className="text-[10px] font-black uppercase tracking-widest text-purple-500">Perubahan Data</span>
            <Edit size={14} className="text-purple-500" />
          </div>
          <div className="font-display text-2xl font-black text-purple-500">{stats.totalEdits}</div>
          <span className="text-[11px] text-purple-500/70 block">Edit profil & kontak mitra</span>
        </div>

        <div className="p-4 rounded-2xl bg-amber-500/5 border border-amber-500/20 shadow-sm space-y-1">
          <div className="flex items-center justify-between">
            <span className="text-[10px] font-black uppercase tracking-widest text-amber-500">Penyesuaian Stok</span>
            <ArrowRightLeft size={14} className="text-amber-500" />
          </div>
          <div className="font-display text-2xl font-black text-amber-500">{stats.totalStockAdj}</div>
          <span className="text-[11px] text-amber-500/70 block">Stock opname & koreksi</span>
        </div>
      </div>

      {/* ── Search & Filter Controls ── */}
      <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3 pt-1">
        <div className="relative flex-1 max-w-md">
          <Search size={16} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-muted-foreground" />
          <Input
            value={search}
            onChange={e => setSearch(e.target.value)}
            placeholder="Cari user, toko, supplier, atau catatan..."
            className="pl-9 bg-card border-border/60 h-11 rounded-xl text-xs font-bold"
          />
        </div>

        <div className="flex items-center gap-2 flex-wrap sm:flex-nowrap">
          <Button
            variant="outline"
            size="sm"
            onClick={() => refetch()}
            disabled={isFetching}
            className="h-11 rounded-xl bg-card border-border/60 font-bold text-xs gap-1.5 px-3.5 cursor-pointer hover:bg-muted"
          >
            <RefreshCw size={14} className={cn(isFetching && "animate-spin text-foreground")} />
            <span className="hidden sm:inline">Refresh</span>
          </Button>

          <Button
            variant="outline"
            size="sm"
            onClick={handleExportCSV}
            disabled={!filteredLogs.length}
            className="h-11 rounded-xl bg-card border-border/60 font-bold text-xs gap-1.5 px-3.5 cursor-pointer hover:bg-muted text-foreground"
          >
            <FileSpreadsheet size={14} className="text-emerald-500" />
            <span>Ekspor CSV</span>
          </Button>

          {isDev && (
            <Button
              variant="outline"
              size="sm"
              onClick={() => setOpenClearDialog(true)}
              disabled={clearLogsMut.isPending || !auditLogs.length}
              className="h-11 rounded-xl bg-card border-rose-500/30 hover:bg-rose-500/10 text-rose-500 font-bold text-xs gap-1.5 px-3.5 cursor-pointer"
            >
              <Trash2 size={14} className="text-rose-500" />
              <span>Bersihkan Log</span>
            </Button>
          )}
        </div>
      </div>

      {/* ── Category Filter Tabs ── */}
      <div className="flex items-center gap-1.5 overflow-x-auto pb-1 scrollbar-none">
        {[
          { id: 'ALL', label: 'Semua Aktivitas' },
          { id: 'DELETE', label: '🗑️ Hapus Toko / Supplier' },
          { id: 'EDIT', label: '✏️ Edit Data Mitra' },
          { id: 'STOCK', label: '📦 Mutasi & Stok' },
          { id: 'TRANSACTION', label: '🛒 Penjualan & Retur' },
        ].map(tab => (
          <button
            key={tab.id}
            onClick={() => setFilterType(tab.id)}
            className={cn(
              "px-3.5 py-2 rounded-xl text-xs font-bold whitespace-nowrap transition-all cursor-pointer border select-none active:scale-95",
              filterType === tab.id
                ? "bg-[#0F172A] text-white dark:bg-tko-brand-500 dark:text-tko-forest-950 border-transparent shadow-sm"
                : "bg-card hover:bg-muted text-muted-foreground border-border/60"
            )}
          >
            {tab.label}
          </button>
        ))}
      </div>

      {/* ── Log Feed List ── */}
      {isLoading ? (
        <div className="space-y-3 py-6">
          {[1, 2, 3, 4].map(i => (
            <div key={i} className="h-24 rounded-2xl bg-card/60 border border-border/40 animate-pulse" />
          ))}
        </div>
      ) : filteredLogs.length === 0 ? (
        <div className="py-12 bg-card/40 rounded-3xl border border-border/40 text-center">
          <EmptyState
            icon={AlertCircle}
            title="Tidak Ada Catatan Log"
            sub={search ? "Tidak ditemukan aktivitas yang cocok dengan kata kunci pencarian Anda." : "Belum ada aktivitas yang terekam pada filter ini."}
          />
        </div>
      ) : (
        <div className="space-y-3">
          {filteredLogs.map((log) => {
            const badge = getActionStyle(log.action_type)
            const Icon = badge.icon
            const hasOldVal = log.old_value && log.old_value !== '-' && log.old_value !== '0' && log.old_value !== log.new_value

            return (
              <motion.div
                key={log.id}
                initial={{ opacity: 0, y: 8 }}
                animate={{ opacity: 1, y: 0 }}
                className="p-4 sm:p-5 rounded-2xl bg-card border border-border/60 hover:border-border transition-all shadow-sm space-y-3"
              >
                {/* Header: Action Badge, Actor & Timestamp */}
                <div className="flex flex-wrap items-center justify-between gap-2 border-b border-border/40 pb-3">
                  <div className="flex items-center gap-2 flex-wrap">
                    <span
                      className={cn(
                        "px-2.5 py-1 rounded-lg text-[10px] font-black uppercase tracking-wider flex items-center gap-1.5 border",
                        badge.bg, badge.text, badge.border
                      )}
                    >
                      <Icon size={12} />
                      {badge.label}
                    </span>

                    <span className="text-xs font-bold text-foreground flex items-center gap-1.5 bg-muted/60 px-2.5 py-0.5 rounded-md border border-border/40">
                      <User size={12} className="text-muted-foreground" />
                      <span>{log.user_name || 'Pengguna'}</span>
                      {log.user_role && (
                        <span className="text-[9px] font-black uppercase text-muted-foreground tracking-wider bg-background px-1.5 py-0.2 rounded border border-border/50">
                          {log.user_role}
                        </span>
                      )}
                    </span>
                  </div>

                  <div className="flex items-center gap-2">
                    <div className="flex items-center gap-2 text-muted-foreground text-xs font-medium">
                      <Clock size={12} className="text-muted-foreground" />
                      <span>{formatRelativeTime(log.timestamp)}</span>
                      <span className="text-[10px] opacity-60">({new Date(log.timestamp).toLocaleTimeString('id-ID', { hour: '2-digit', minute: '2-digit' })})</span>
                    </div>

                    {isDev && (
                      <button
                        type="button"
                        onClick={() => {
                          setSelectedTargetLog(log)
                          setDeleteMode('single')
                        }}
                        className="w-7 h-7 rounded-lg flex items-center justify-center text-muted-foreground/60 hover:text-rose-500 hover:bg-rose-500/10 transition-colors cursor-pointer"
                        title="Hapus log ini atau semua ke bawah (Khusus Dev)"
                      >
                        <Trash2 size={13} />
                      </button>
                    )}
                  </div>
                </div>

                {/* Content: Entity Name, Details & Value Change */}
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pt-0.5">
                  <div className="space-y-1 flex-1">
                    <p className="font-display font-black text-sm text-foreground tracking-tight">
                      {log.product_name}
                    </p>
                    {log.notes && (
                      <p className="text-xs text-muted-foreground font-medium leading-relaxed">
                        {log.notes}
                      </p>
                    )}
                  </div>

                  {/* Value / Difference Card */}
                  {(hasOldVal || log.new_value !== '-') && (
                    <div className="shrink-0 bg-muted/50 border border-border/50 px-3.5 py-2 rounded-xl text-right">
                      <span className="text-[9px] font-black uppercase tracking-widest text-muted-foreground block mb-0.5">
                        Status / Nilai
                      </span>
                      {hasOldVal ? (
                        <div className="flex items-center gap-2 text-xs font-bold">
                          <span className="text-muted-foreground line-through">{log.old_value}</span>
                          <span className="text-amber-500 font-black">→</span>
                          <span className="text-foreground font-black">{log.new_value}</span>
                        </div>
                      ) : (
                        <span className="text-xs font-black text-foreground">{log.new_value}</span>
                      )}
                    </div>
                  )}
                </div>
              </motion.div>
            )
          })}
        </div>
      )}

      {/* ── Clear Logs Confirmation Dialog ── */}
      <AlertDialog open={openClearDialog} onOpenChange={setOpenClearDialog}>
        <AlertDialogContent className="bg-card border border-border/60 rounded-3xl max-w-md p-6 shadow-2xl text-left">
          <AlertDialogHeader className="space-y-3 text-left">
            <div className="w-12 h-12 rounded-2xl bg-rose-500/10 border border-rose-500/20 flex items-center justify-center text-rose-500">
              <Trash2 size={24} />
            </div>
            <div>
              <AlertDialogTitle className="text-foreground font-black text-lg tracking-tight font-display">
                Bersihkan Seluruh Riwayat Log?
              </AlertDialogTitle>
              <AlertDialogDescription className="text-muted-foreground text-xs leading-relaxed mt-1.5">
                Tindakan ini akan menghapus seluruh catatan rekaman log audit lama dari perangkat dan database cloud. Seluruh data transaksi, toko, supplier, dan stok aktif tetap tersimpan aman.
              </AlertDialogDescription>
            </div>
          </AlertDialogHeader>
          <AlertDialogFooter className="gap-2.5 mt-4">
            <AlertDialogCancel className="flex-1 h-11 rounded-xl bg-muted hover:bg-muted/80 text-foreground font-bold text-xs border-border/60 cursor-pointer">
              Batal
            </AlertDialogCancel>
            <AlertDialogAction
              onClick={async () => {
                await clearLogsMut.mutateAsync()
                setOpenClearDialog(false)
              }}
              className="flex-1 h-11 rounded-xl bg-rose-600 hover:bg-rose-700 text-white font-bold text-xs border-none shadow-md shadow-rose-500/20 cursor-pointer"
            >
              {clearLogsMut.isPending ? 'Membersihkan...' : 'Ya, Bersihkan Log'}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      {/* ── Single Log / Range Purge Dialog ── */}
      <AlertDialog open={Boolean(selectedTargetLog)} onOpenChange={(open) => !open && setSelectedTargetLog(null)}>
        <AlertDialogContent className="bg-card border border-border/60 rounded-3xl max-w-md p-6 shadow-2xl text-left">
          <AlertDialogHeader className="space-y-3 text-left">
            <div className="w-12 h-12 rounded-2xl bg-rose-500/10 border border-rose-500/20 flex items-center justify-center text-rose-500">
              <Trash2 size={24} />
            </div>
            <div>
              <AlertDialogTitle className="text-foreground font-black text-lg tracking-tight font-display">
                Hapus Catatan Log Audit
              </AlertDialogTitle>
              <AlertDialogDescription className="text-muted-foreground text-xs leading-relaxed mt-1.5">
                Pilih opsi penghapusan untuk rekaman <strong className="text-foreground">{selectedTargetLog?.product_name}</strong> ({selectedTargetLog && new Date(selectedTargetLog.timestamp).toLocaleString('id-ID')}).
              </AlertDialogDescription>
            </div>
          </AlertDialogHeader>

          <div className="space-y-2 py-2">
            <label className="text-[10px] font-black uppercase tracking-wider text-muted-foreground">Pilih Lingkup Penghapusan:</label>
            <div className="grid grid-cols-1 gap-2">
              <button
                type="button"
                onClick={() => setDeleteMode('single')}
                className={cn(
                  "p-3 rounded-xl text-left border transition-all cursor-pointer",
                  deleteMode === 'single'
                    ? "bg-rose-500/10 border-rose-500/40 text-foreground shadow-sm"
                    : "bg-muted/30 border-border/50 text-muted-foreground hover:bg-muted/50"
                )}
              >
                <div className="font-bold text-xs">Hapus Log Ini Saja</div>
                <div className="text-[11px] opacity-70">Hanya menghapus baris rekaman log ini dari audit trail.</div>
              </button>

              <button
                type="button"
                onClick={() => setDeleteMode('before')}
                className={cn(
                  "p-3 rounded-xl text-left border transition-all cursor-pointer",
                  deleteMode === 'before'
                    ? "bg-rose-500/10 border-rose-500/40 text-foreground shadow-sm"
                    : "bg-muted/30 border-border/50 text-muted-foreground hover:bg-muted/50"
                )}
              >
                <div className="font-bold text-xs text-rose-600 dark:text-rose-400">Hapus Log Ini & Semua Log Lebih Lama (Ke Bawah)</div>
                <div className="text-[11px] opacity-70">Membersihkan log ini beserta seluruh catatan log sebelum tanggal/waktu ini.</div>
              </button>
            </div>
          </div>

          <AlertDialogFooter className="gap-2.5 mt-2">
            <AlertDialogCancel className="flex-1 h-11 rounded-xl bg-muted hover:bg-muted/80 text-foreground font-bold text-xs border-border/60 cursor-pointer">
              Batal
            </AlertDialogCancel>
            <AlertDialogAction
              onClick={async () => {
                if (deleteMode === 'before') {
                  await purgeBeforeMut.mutateAsync(selectedTargetLog.timestamp)
                } else {
                  await deleteSingleMut.mutateAsync(selectedTargetLog.id)
                }
                setSelectedTargetLog(null)
              }}
              className="flex-1 h-11 rounded-xl bg-rose-600 hover:bg-rose-700 text-white font-bold text-xs border-none shadow-md shadow-rose-500/20 cursor-pointer"
            >
              {deleteSingleMut.isPending || purgeBeforeMut.isPending ? 'Menghapus...' : 'Konfirmasi Hapus'}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  )
}
export default SembakoAuditLogView
