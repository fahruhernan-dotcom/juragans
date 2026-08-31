import React, { useState, useMemo } from 'react'
import { cn } from '@/lib/utils'
import { Plus, ChevronDown, ChevronUp, X, Search, Package, ArrowRightLeft, History, CheckCircle2, RotateCcw, FileSpreadsheet, TrendingUp, Layers, ShoppingCart, Settings } from 'lucide-react'
import ImportCsvModal from '@/components/ui/ImportCsvModal'
import { motion, AnimatePresence } from 'framer-motion'
import { toast } from 'sonner'
import {
  useSembakoProducts,
  useSembakoSuppliers,
  useSembakoAllBatches,
  useSembakoStockOut,
  useAdjustBatchStock,
  useAddStockBatch,
  useSembakoReturns,
  useUpdateSembakoReturnStatus,
  useSembakoSales,
  useSembakoRawMaterials,
} from '@/lib/hooks/useSembakoData'
import { calculateBomProductStock, calculateBomProductHpp } from '@/lib/inventory/bomStockCalculator'
import { useSearchParams, useOutletContext, useLocation, useNavigate } from 'react-router-dom'
import { DatePicker } from '@/components/ui/DatePicker'
import { C, fmtDate, CustomSelect, InputRupiah } from '@/dashboard/broker/sembako_broker/components/sembakoSaleUtils'
import { BrokerMobileHeader } from '@/dashboard/broker/_shared/components/BrokerMobileHeader'
import { SembakoErrorState } from '@/dashboard/broker/sembako_broker/components/SembakoUiPrimitives'
import { SembakoPageHeader } from '@/dashboard/broker/sembako_broker/components/SembakoPageHeader'
import { SembakoSummaryStrip } from '@/dashboard/broker/sembako_broker/components/SembakoSummaryStrip'
import { useAuth } from '@/lib/hooks/useAuth'
import { canViewAuditLogs } from '@/lib/auth/business-roles'
import { useSembakoAuditLogs, recordAuditLog } from '@/lib/hooks/useSembakoAudit'
import { useMediaQuery } from '@/lib/hooks/useMediaQuery'
import { SembakoTambahStokSheet } from './components/SembakoTambahStokSheet'
import { useBackHandler } from '@/lib/hooks/useBackHandler'

// ── Constants ─────────────────────────────────────────────────────────────────

const TEXT_SEC = '#A8764A'

const fmt = (n) => new Intl.NumberFormat('id-ID', { maximumFractionDigits: 0 }).format(Math.round(Number(n) || 0))

const inputSt = {
  width: '100%', height: '40px', background: C.input,
  border: `1px solid ${C.border}`, borderRadius: '10px',
  padding: '0 12px', color: C.text, fontSize: '13px',
  fontFamily: 'DM Sans', fontWeight: 600, outline: 'none',
  boxSizing: 'border-box',
}

// ── Tab: Stok Saat Ini ────────────────────────────────────────────────────────

function StokSaatIni({ products, allBatches = [], sales = [], rawMaterials = [], onShowHistory, navigate }) {
  const [expanded, setExpanded] = useState(null)
  const [search, setSearch] = useState('')

  const filtered = useMemo(() => {
    if (!search) return products.filter(p => p.is_active && !p.is_deleted)
    return products.filter(p =>
      (p.is_active && !p.is_deleted) &&
      p.product_name.toLowerCase().includes(search.toLowerCase())
    )
  }, [products, search])

  return (
    <div>
      <div style={{ position: 'relative', marginBottom: 12 }}>
        <Search size={15} color="#6B7280" style={{ position: 'absolute', left: 12, top: '50%', transform: 'translateY(-50%)' }} />
        <input
          id="gudang-search" name="gudang_search" type="text"
          value={search} onChange={e => setSearch(e.target.value)}
          placeholder="Cari produk..."
          style={{ ...inputSt, paddingLeft: 36 }}
        />
        {search && (
          <button onClick={() => setSearch('')} style={{ position: 'absolute', right: 12, top: '50%', transform: 'translateY(-50%)', background: 'transparent', border: 'none', cursor: 'pointer' }}>
            <X size={14} color="#6B7280" />
          </button>
        )}
      </div>

      {filtered.length === 0 && (
        <div style={{ textAlign: 'center', padding: '48px 20px', background: 'rgba(255,255,255,0.02)', borderRadius: 20, border: `1px dashed ${C.border}` }}>
          <Package size={40} color="#4B5563" style={{ margin: '0 auto 12px', opacity: 0.4 }} />
          <p style={{ fontFamily: 'DM Sans', fontSize: 14, fontWeight: 600, color: TEXT_SEC }}>Belum ada produk aktif</p>
          <p style={{ fontFamily: 'DM Sans', fontSize: 12, color: '#4B5563', marginTop: 6, opacity: 0.7 }}>
            Tambahkan produk terlebih dahulu di halaman Produk & Stok
          </p>
        </div>
      )}

      {filtered.map(product => {
        const bomInfo = calculateBomProductStock(product, rawMaterials)
        const bomHpp = calculateBomProductHpp(product, rawMaterials) || product.avg_buy_price || 0
        const displayStock = (product.current_stock !== undefined && product.current_stock !== null) 
          ? Number(product.current_stock) 
          : bomInfo.totalStock

        // Sales Performance Analytics for this product
        const productSalesItems = sales.flatMap(s => s.sembako_sale_items || []).filter(it => it.product_id === product.id)
        const totalSold = productSalesItems.reduce((s, it) => s + (Number(it.quantity) || 0), 0)
        const totalRevenue = productSalesItems.reduce((s, it) => s + ((Number(it.quantity) || 0) * (Number(it.price_per_unit) || 0)), 0)
        const totalProfit = productSalesItems.reduce((s, it) => {
          const itemHpp = Number(it.cogs_per_unit) || bomHpp || 0
          return s + ((Number(it.quantity) || 0) * ((Number(it.price_per_unit) || 0) - itemHpp))
        }, 0)

        const isLow = product.min_stock_alert > 0 && displayStock <= product.min_stock_alert
        const isOpen = expanded === product.id
        const productValuation = displayStock * bomHpp

        return (
          <div key={product.id} className="mb-2.5 rounded-2xl overflow-hidden border transition-all duration-200" style={{ background: C.card, borderColor: isLow ? 'rgba(248,113,113,0.35)' : C.border }}>
            <button
              type="button"
              onClick={() => setExpanded(isOpen ? null : product.id)}
              className="w-full flex items-center justify-between p-3.5 sm:p-4 text-left bg-transparent border-none cursor-pointer gap-3 hover:bg-slate-500/5 transition-colors"
            >
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2 mb-1.5 flex-wrap">
                  <span className="font-display font-bold text-sm text-foreground truncate">{product.product_name}</span>
                  {isLow && (
                    <span className="text-[10px] font-extrabold bg-rose-500/15 text-rose-600 border border-rose-500/30 px-2 py-0.5 rounded-full">
                      Stok Menipis
                    </span>
                  )}
                  {totalSold > 0 && (
                    <span className="text-[10px] font-extrabold bg-indigo-500/10 text-indigo-700 border border-indigo-500/20 px-2 py-0.5 rounded-full">
                      🔥 Terjual {fmt(totalSold)} {product.unit}
                    </span>
                  )}
                </div>

                <div className="flex items-center gap-2.5 sm:gap-3.5 flex-wrap text-xs">
                  <span className={cn("font-bold", isLow ? "text-rose-600 font-extrabold" : "text-emerald-700 font-extrabold")}>
                    📦 {fmt(displayStock)} {product.unit}
                  </span>
                  <span className="text-slate-500 font-medium">
                    Jual: <strong className="text-slate-800 font-bold">Rp {fmt(product.sell_price)}</strong>
                  </span>
                  <span className="text-slate-500 font-medium">
                    HPP: <strong className="text-slate-700 font-bold">Rp {fmt(bomHpp)}</strong>
                  </span>
                  <span className="text-slate-600 bg-slate-100 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 px-2 py-0.5 rounded-md font-semibold text-[11px]">
                    Nilai Aset: Rp {fmt(productValuation)}
                  </span>
                </div>
              </div>

              <div className="flex items-center gap-2 shrink-0">
                {isOpen ? <ChevronUp size={18} className="text-slate-400" /> : <ChevronDown size={18} className="text-slate-400" />}
              </div>
            </button>

            <AnimatePresence>
              {isOpen && (
                <motion.div
                  initial={{ height: 0, opacity: 0 }}
                  animate={{ height: 'auto', opacity: 1 }}
                  exit={{ height: 0, opacity: 0 }}
                  transition={{ duration: 0.2 }}
                  className="overflow-hidden border-t"
                  style={{ borderColor: C.border }}
                >
                  <div className="p-3.5 sm:p-4 space-y-3.5 bg-slate-50/40 dark:bg-slate-900/30">
                    {/* 1. Ringkasan Kinerja Penjualan */}
                    <div className="p-3 rounded-xl bg-white dark:bg-slate-800/80 border border-slate-200/80 dark:border-slate-700/60 shadow-xs">
                      <div className="flex items-center justify-between gap-2 mb-2.5">
                        <div className="flex items-center gap-1.5 text-xs font-black text-slate-800 dark:text-slate-200 uppercase tracking-wider">
                          <TrendingUp size={14} className="text-indigo-600" />
                          <span>Performa Penjualan Produk Ini</span>
                        </div>
                        {totalSold > 0 && (
                          <span className="text-[10px] font-bold text-slate-400">
                            {productSalesItems.length} transaksi
                          </span>
                        )}
                      </div>

                      <div className="grid grid-cols-3 gap-2 text-center sm:text-left">
                        <div className="p-2 rounded-lg bg-indigo-50/60 dark:bg-indigo-950/20 border border-indigo-100 dark:border-indigo-900/40">
                          <p className="text-[10px] font-bold text-indigo-900/70 dark:text-indigo-300 uppercase">Total Terjual</p>
                          <p className="text-sm font-black text-indigo-950 dark:text-indigo-100 font-mono mt-0.5">
                            {fmt(totalSold)} <span className="text-[11px] font-sans font-normal text-indigo-700">{product.unit}</span>
                          </p>
                        </div>
                        <div className="p-2 rounded-lg bg-emerald-50/60 dark:bg-emerald-950/20 border border-emerald-100 dark:border-emerald-900/40">
                          <p className="text-[10px] font-bold text-emerald-900/70 dark:text-emerald-300 uppercase">Total Omset</p>
                          <p className="text-sm font-black text-emerald-950 dark:text-emerald-100 font-mono mt-0.5">
                            Rp {fmt(totalRevenue)}
                          </p>
                        </div>
                        <div className="p-2 rounded-lg bg-amber-50/60 dark:bg-amber-950/20 border border-amber-100 dark:border-amber-900/40">
                          <p className="text-[10px] font-bold text-amber-900/70 dark:text-amber-300 uppercase">Laba Kotor</p>
                          <p className={cn("text-sm font-black font-mono mt-0.5", totalProfit >= 0 ? "text-amber-950 dark:text-amber-100" : "text-rose-600")}>
                            {totalProfit >= 0 ? `+Rp ${fmt(totalProfit)}` : `Rp ${fmt(totalProfit)}`}
                          </p>
                        </div>
                      </div>
                    </div>

                    {/* 2. Komposisi Resep BOM & Kapasitas Bahan Baku */}
                    {bomInfo.components && bomInfo.components.length > 0 ? (
                      <div className="p-3 rounded-xl bg-white dark:bg-slate-800/80 border border-slate-200/80 dark:border-slate-700/60 shadow-xs space-y-2">
                        <div className="flex items-center justify-between gap-2">
                          <div className="flex items-center gap-1.5 text-xs font-black text-slate-800 dark:text-slate-200 uppercase tracking-wider">
                            <Layers size={14} className="text-amber-600" />
                            <span>Komposisi Resep & Sisa Bahan Baku</span>
                          </div>
                          <span className="text-[11px] font-bold text-slate-500">
                            Kapasitas: <strong className="text-emerald-700 font-black">{fmt(bomInfo.totalStock)} {product.unit}</strong>
                          </span>
                        </div>

                        <div className="space-y-1.5 pt-1">
                          {bomInfo.components.map((comp, cIdx) => (
                            <div
                              key={cIdx}
                              className={cn(
                                "flex items-center justify-between p-2 rounded-lg text-xs transition-colors",
                                comp.isBottleneck
                                  ? "bg-rose-50/70 border border-rose-200 text-rose-950 font-medium"
                                  : "bg-slate-50 dark:bg-slate-900/40 border border-slate-100 dark:border-slate-800 text-slate-700"
                              )}
                            >
                              <div className="flex items-center gap-2 min-w-0">
                                <span className="font-semibold truncate">{comp.name}</span>
                                {comp.isBottleneck && (
                                  <span className="text-[9.5px] font-extrabold bg-rose-600 text-white px-1.5 py-0.5 rounded-md uppercase tracking-wider shrink-0">
                                    Pembatas Stok
                                  </span>
                                )}
                              </div>
                              <div className="text-right shrink-0 flex items-center gap-3">
                                <span className="text-slate-500 text-[11px]">
                                  Sisa: <strong className="text-slate-800 dark:text-slate-200 font-bold">{comp.available} {comp.unit}</strong>
                                </span>
                                <span className="text-slate-500 text-[11px]">
                                  Kapasitas: <strong className={cn("font-bold", comp.isBottleneck ? "text-rose-600" : "text-emerald-700")}>{comp.maxUnits} {product.unit}</strong>
                                </span>
                              </div>
                            </div>
                          ))}
                        </div>
                      </div>
                    ) : null}

                    {/* 3. Penjelasan Nilai Modal Asset */}
                    <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-2 p-2.5 rounded-xl bg-slate-100/70 dark:bg-slate-800 border border-slate-200 text-xs">
                      <div className="text-slate-600 dark:text-slate-300">
                        <span className="font-bold text-slate-800 dark:text-slate-100">Modal HPP Produk:</span> Rp {fmt(bomHpp)} / {product.unit}
                        <span className="text-slate-400 mx-1.5">·</span>
                        <span>Estimasi Nilai Aset: <strong>Rp {fmt(productValuation)}</strong></span>
                      </div>
                      <span className="text-[11px] font-medium text-slate-500">
                        Harga Jual Standar: <strong>Rp {fmt(product.sell_price)}</strong>
                      </span>
                    </div>

                    {/* 4. Aksi Cepat Operasional */}
                    <div className="flex flex-wrap items-center gap-2 pt-1">
                      <button
                        type="button"
                        onClick={() => onShowHistory(product)}
                        className="flex items-center gap-1.5 px-3 py-2 rounded-xl bg-slate-900 hover:bg-slate-800 text-white font-bold text-xs shadow-xs transition-all cursor-pointer active:scale-95"
                      >
                        <History size={14} />
                        <span>Kartu Stok & Riwayat</span>
                      </button>

                      <button
                        type="button"
                        onClick={() => navigate(`/dashboard/broker/sembako/penjualan?action=new&product=${product.id}`)}
                        className="flex items-center gap-1.5 px-3 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white font-bold text-xs shadow-xs transition-all cursor-pointer active:scale-95"
                      >
                        <ShoppingCart size={14} />
                        <span>Buat Penjualan</span>
                      </button>

                      <button
                        type="button"
                        onClick={() => navigate('/dashboard/broker/sembako/produk?tab=bahan_baku')}
                        className="flex items-center gap-1.5 px-3 py-2 rounded-xl bg-white dark:bg-slate-800 border border-slate-300 dark:border-slate-700 hover:bg-slate-50 text-slate-700 dark:text-slate-200 font-bold text-xs transition-all cursor-pointer active:scale-95"
                      >
                        <Settings size={14} />
                        <span>Kelola Resep / Bahan Baku</span>
                      </button>
                    </div>
                  </div>
                </motion.div>
              )}
            </AnimatePresence>
          </div>
        )
      })}
    </div>
  )
}

// ── Tab: Riwayat Masuk ────────────────────────────────────────────────────────

function RiwayatMasuk({ batches = [], isLoading, isError, error, refetch }) {
  const { data: returnsList = [] } = useSembakoReturns()

  if (isLoading) return <LoadingRow />
  if (isError) return <SembakoErrorState error={error} onRetry={refetch} />

  const returEntries = returnsList.map(r => ({
    id: `retur-${r.id}`,
    is_retur: true,
    product_name: r.product_name,
    qty_masuk: r.quantity,
    unit: r.unit,
    buy_price: (r.total_amount || 0) / (r.quantity || 1),
    created_at: r.created_at,
    party_name: r.party_name,
    status: r.status,
    raw_return: r
  }))

  const filteredBatches = batches.filter(b => !b.batch_code?.startsWith('BTC-RET') && !b.notes?.includes('Retur'))

  const combined = [
    ...filteredBatches.map(b => ({
      ...b,
      is_retur: false,
      product_name: b.sembako_products?.product_name || '-',
      unit: b.sembako_products?.unit || 'pcs'
    })),
    ...returEntries
  ].sort((a, b) => new Date(b.created_at || b.date_received) - new Date(a.created_at || a.date_received))

  if (combined.length === 0) return <EmptyState label="Belum ada riwayat stok masuk" sub="Stok bertambah saat pembelian pabrik / retur toko dicatat" />

  return (
    <div>
      {combined.map(item => {
        if (item.is_retur) {
          const isDone = item.status === 'completed'
          return (
            <div key={item.id} style={{ marginBottom: 8, background: 'rgba(15,23,42,0.04)', border: `1px solid rgba(15,23,42,0.12)`, borderRadius: 12, padding: '12px 14px', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <div style={{ flex: 1, minWidth: 0, paddingRight: 8 }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 2 }}>
                  <span style={{ fontFamily: 'Sora', fontSize: 13, fontWeight: 700, color: C.text }}>{item.product_name}</span>
                  <span style={{ fontSize: 10, background: 'rgba(15,23,42,0.08)', color: '#475569', padding: '1px 8px', borderRadius: 20, fontFamily: 'DM Sans', fontWeight: 800 }}>RETUR TOKO</span>
                </div>
                <div style={{ fontSize: 11, color: '#94A3B8', fontFamily: 'DM Sans', fontWeight: 600 }}>Toko: {item.party_name}</div>
                <div style={{ fontSize: 11, color: '#6B7280', fontFamily: 'DM Sans', marginTop: 2 }}>
                  Tgl Retur: {fmtDate(item.created_at)}
                </div>
              </div>
              <div style={{ textAlign: 'right' }}>
                <div style={{ fontFamily: 'Sora', fontSize: 13, fontWeight: 700, color: '#475569' }}>
                  +{fmt(item.qty_masuk)} {item.unit}
                </div>
                <div style={{ fontSize: 11, color: isDone ? '#34D399' : '#F59E0B', fontFamily: 'DM Sans', fontWeight: 700, marginTop: 2 }}>
                  {isDone ? '✓ Di Gudang' : '⏳ Pending Validasi'}
                </div>
              </div>
            </div>
          )
        }

        const batchCode = item.batch_code || `BTC-${String(item.id || '').slice(0, 8).toUpperCase()}`
        const dateStr = fmtDate(item.purchase_date || item.created_at)
        return (
          <div key={item.id} style={{ marginBottom: 8, background: C.card, border: `1px solid ${C.border}`, borderRadius: 12, padding: '12px 14px', display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
            <div style={{ flex: 1, minWidth: 0, paddingRight: 8 }}>
              <div style={{ fontFamily: 'Sora', fontSize: 13, fontWeight: 700, color: C.text, marginBottom: 2, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                {item.product_name}
              </div>
              <div style={{ fontSize: 11, color: '#94A3B8', fontFamily: 'DM Sans', fontWeight: 600 }}>{batchCode}</div>
              <div style={{ fontSize: 11, color: '#6B7280', fontFamily: 'DM Sans', marginTop: 2 }}>
                Tgl Masuk: {dateStr}
                {item.sembako_suppliers?.supplier_name && ` · ${item.sembako_suppliers.supplier_name}`}
              </div>
            </div>
            <div style={{ textAlign: 'right' }}>
              <div style={{ fontFamily: 'Sora', fontSize: 13, fontWeight: 700, color: C.accent }}>
                +{fmt(item.qty_masuk)} {item.unit}
              </div>
              <div style={{ fontSize: 11, color: TEXT_SEC, fontFamily: 'DM Sans' }}>@ Rp {fmt(item.buy_price)}</div>
              <div style={{ fontSize: 11, color: '#6B7280', fontFamily: 'DM Sans' }}>
                Sisa: {fmt(item.qty_sisa)}
              </div>
            </div>
          </div>
        )
      })}
    </div>
  )
}

// ── Tab: Retur Gudang (Validasi Terima Barang) ───────────────────────────────

function ReturGudangTab() {
  const { data: returnsList = [], isLoading } = useSembakoReturns()
  const updateStatusMut = useUpdateSembakoReturnStatus()

  if (isLoading) return <LoadingRow />
  if (returnsList.length === 0) return <EmptyState label="Belum ada klaim retur produk" sub="Retur dari pelanggan akan muncul di sini untuk divalidasi ke gudang" />

  const handleValidate = async (rObj) => {
    try {
      await updateStatusMut.mutateAsync({ id: rObj.id, status: 'completed' })
      toast.success(`Barang retur (${rObj.product_name}) telah divalidasi & diterima di Gudang!`)
    } catch (err) {
      toast.error('Gagal memvalidasi retur barang')
    }
  }

  return (
    <div className="space-y-3">
      {returnsList.map(r => {
        const isDone = r.status === 'completed'
        return (
          <div key={r.id} className="p-4 rounded-2xl bg-card border border-border flex flex-col sm:flex-row justify-between sm:items-center gap-3">
            <div className="space-y-1">
              <div className="flex items-center gap-2 flex-wrap">
                <span className="font-bold text-sm text-foreground">{r.product_name}</span>
                <span className="text-xs font-bold text-amber-400 bg-[#0F172A]/15 border border-[#0F172A]/30 px-2 py-0.5 rounded-full">
                  +{r.quantity} {r.unit}
                </span>
                <span className={cn(
                  "text-[10px] font-bold px-2.5 py-0.5 rounded-full uppercase tracking-wider",
                  isDone ? "bg-emerald-500/15 text-emerald-400 border border-emerald-500/30" : "bg-[#0F172A]/15 text-amber-400 border border-[#0F172A]/30"
                )}>
                  {isDone ? "✓ Sudah Diterima di Gudang" : "⏳ Menunggu Validasi Gudang"}
                </span>
              </div>
              <p className="text-xs text-muted-foreground">
                Toko / Pihak: <strong className="text-foreground">{r.party_name}</strong> · Alasan: {r.reason || 'Klaim Retur'}
              </p>
              <p className="text-[11px] text-slate-400">
                Nilai Retur: <strong className="text-amber-400">Rp {fmt(r.total_amount || r.amount || 0)}</strong> · Tgl: {fmtDate(r.created_at)}
              </p>
            </div>

            {!isDone && (
              <button
                onClick={() => handleValidate(r)}
                disabled={updateStatusMut.isPending}
                className="flex items-center justify-center gap-2 px-4 h-9 rounded-xl text-xs font-bold bg-emerald-600 hover:bg-emerald-500 text-white transition-all cursor-pointer shadow-lg shadow-emerald-600/20 active:scale-95 shrink-0"
              >
                <CheckCircle2 size={15} />
                <span>Validasi Barang Sudah di Gudang</span>
              </button>
            )}
          </div>
        )
      })}
    </div>
  )
}

// ── Tab: Riwayat Keluar ───────────────────────────────────────────────────────

function RiwayatKeluar() {
  const { data: stockOuts = [], isLoading, isError, error, refetch } = useSembakoStockOut()

  if (isLoading) return <LoadingRow />
  if (isError) return <SembakoErrorState error={error} onRetry={refetch} />

  if (stockOuts.length === 0) return <EmptyState label="Belum ada riwayat stok keluar" sub="Stok berkurang otomatis saat penjualan dicatat" />

  return (
    <div>
      {stockOuts.map(s => (
        <div key={s.id} style={{ marginBottom: 8, background: C.card, border: `1px solid ${C.border}`, borderRadius: 12, padding: '12px 14px', display: 'flex', justifyContent: 'space-between' }}>
          <div style={{ flex: 1, minWidth: 0, paddingRight: 8 }}>
            <div style={{ fontFamily: 'Sora', fontSize: 13, fontWeight: 700, color: C.text, marginBottom: 2, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
              {s.sembako_products?.product_name || '-'}
            </div>
            <div style={{ fontSize: 11, color: '#94A3B8', fontFamily: 'DM Sans' }}>
              {s.sembako_stock_batches?.batch_code || '-'}
            </div>
            {s.sembako_sales?.invoice_number && (
              <div style={{ fontSize: 11, color: '#6B7280', fontFamily: 'DM Sans' }}>{s.sembako_sales.invoice_number}</div>
            )}
            <div style={{ fontSize: 11, color: '#6B7280', fontFamily: 'DM Sans' }}>{fmtDate(s.created_at)}</div>
          </div>
          <div style={{ textAlign: 'right' }}>
            <div style={{ fontFamily: 'Sora', fontSize: 13, fontWeight: 700, color: '#F87171' }}>
              -{fmt(s.qty_keluar)} {s.sembako_products?.unit}
            </div>
          </div>
        </div>
      ))}
    </div>
  )
}

function getActionStyle(action_type) {
  const type = String(action_type || '').toUpperCase()
  if (type.includes('DELETE_SUPPLIER') || type.includes('HAPUS_SUPPLIER')) {
    return { label: '🗑️ HAPUS SUPPLIER', bg: 'rgba(239,68,68,0.15)', color: '#F87171', border: 'rgba(239,68,68,0.3)' }
  }
  if (type.includes('DELETE_CUSTOMER') || type.includes('HAPUS_TOKO') || type.includes('HAPUS_CUSTOMER')) {
    return { label: '🗑️ HAPUS TOKO', bg: 'rgba(239,68,68,0.15)', color: '#F87171', border: 'rgba(239,68,68,0.3)' }
  }
  if (type.includes('DELETE') || type.includes('HAPUS')) {
    return { label: '🗑️ HAPUS DATA', bg: 'rgba(239,68,68,0.15)', color: '#F87171', border: 'rgba(239,68,68,0.3)' }
  }
  if (type.includes('EDIT_SUPPLIER')) {
    return { label: '✏️ EDIT SUPPLIER', bg: 'rgba(168,85,247,0.15)', color: '#C084FC', border: 'rgba(168,85,247,0.3)' }
  }
  if (type.includes('EDIT_CUSTOMER')) {
    return { label: '✏️ EDIT TOKO', bg: 'rgba(168,85,247,0.15)', color: '#C084FC', border: 'rgba(168,85,247,0.3)' }
  }
  if (type.includes('ADJ') || type.includes('ADJUST')) {
    return { label: '⚖ PENYESUAIAN STOK', bg: 'rgba(245,158,11,0.15)', color: '#FBBF24', border: 'rgba(245,158,11,0.3)' }
  }
  if (type.includes('MASUK') || type.includes('IN')) {
    return { label: '📦 STOK MASUK', bg: 'rgba(16,185,129,0.15)', color: '#34D399', border: 'rgba(16,185,129,0.3)' }
  }
  if (type.includes('KELUAR') || type.includes('SALE') || type.includes('OUT')) {
    return { label: '🛒 PENJUALAN / KELUAR', bg: 'rgba(56,189,248,0.15)', color: '#38BDF8', border: 'rgba(56,189,248,0.3)' }
  }
  if (type.includes('EDIT')) {
    return { label: '✏️ EDIT DATA', bg: 'rgba(168,85,247,0.15)', color: '#C084FC', border: 'rgba(168,85,247,0.3)' }
  }
  if (type.includes('TAMBAH')) {
    return { label: '✨ DATA BARU', bg: 'rgba(20,184,166,0.15)', color: '#2DD4BF', border: 'rgba(20,184,166,0.3)' }
  }
  return { label: `📋 ${type}`, bg: 'rgba(15,23,42,0.12)', color: '#0F172A', border: 'rgba(15,23,42,0.2)' }
}

function AuditLogTab() {
  const { data: auditLogs = [], isLoading } = useSembakoAuditLogs()

  if (isLoading) return <LoadingRow />
  if (auditLogs.length === 0) return <EmptyState label="Belum ada catatan log perubahan" sub="Setiap perubahan stok & transaksi terekam di sini" />

  return (
    <div className="flex flex-col gap-3">
      {auditLogs.map(log => {
        const badge = getActionStyle(log.action_type)
        const hasOldVal = log.old_value && log.old_value !== '-' && log.old_value !== '0' && log.old_value !== log.new_value

        return (
          <div
            key={log.id}
            className="p-4 rounded-2xl bg-card border border-border/60 hover:border-border transition-all space-y-3"
          >
            {/* Header: Action Badge & Actor */}
            <div className="flex flex-wrap items-center justify-between gap-2 border-b border-border/40 pb-2.5">
              <div className="flex items-center gap-2">
                <span
                  style={{ background: badge.bg, color: badge.color, border: `1px solid ${badge.border}` }}
                  className="px-2.5 py-1 rounded-lg text-[10px] font-black uppercase tracking-wider"
                >
                  {badge.label}
                </span>
                <span className="text-xs font-bold text-slate-500 dark:text-slate-300 flex items-center gap-1.5">
                  <span>👤 {log.user_name}</span>
                  {log.user_role && (
                    <span className="text-[9px] font-black text-tko-text-muted bg-tko-bg-subtle border border-border/60 px-1.5 py-0.5 rounded uppercase tracking-wider">
                      {log.user_role}
                    </span>
                  )}
                </span>
              </div>
              <span className="text-[11px] font-medium text-slate-500 dark:text-slate-400">
                📅 {fmtDate(log.timestamp)}
              </span>
            </div>

            {/* Content: Product & Change Flow */}
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pt-0.5">
              <div className="space-y-1">
                <p className="font-display font-bold text-sm text-foreground leading-tight">
                  {log.product_name}
                </p>
                {log.notes && (
                  <p className="text-xs text-muted-foreground font-medium leading-relaxed flex items-center gap-1.5">
                    <span className="text-slate-500">💬</span> {log.notes}
                  </p>
                )}
              </div>

              {/* Perubahan Stok / Value Card */}
              <div className="shrink-0 bg-tko-bg-subtle border border-border/60 px-3.5 py-2 rounded-xl text-right">
                <p className="text-[9px] font-black text-slate-500 dark:text-slate-500 uppercase tracking-widest mb-0.5">Perubahan</p>
                {hasOldVal ? (
                  <div className="flex items-center gap-2 text-xs font-bold">
                    <span className="text-muted-foreground line-through">{log.old_value}</span>
                    <span className="text-orange-500 font-black">→</span>
                    <span className="text-orange-400 font-black">{log.new_value}</span>
                  </div>
                ) : (
                  <span className="text-xs font-black text-orange-400">{log.new_value}</span>
                )}
              </div>
            </div>
          </div>
        )
      })}
    </div>
  )
}

// ── Helpers ───────────────────────────────────────────────────────────────────

function SkeletonBox({ w = '100%', h = 16, r = 8, mb = 0, opacity = 1 }) {
  return (
    <div style={{
      width: w, height: h, borderRadius: r,
      background: 'linear-gradient(90deg, rgba(15,23,42,0.06) 0%, rgba(15,23,42,0.12) 50%, rgba(15,23,42,0.06) 100%)',
      backgroundSize: '200% 100%',
      animation: 'shimmer 1.4s infinite',
      marginBottom: mb, opacity,
    }} />
  )
}

function LoadingRow() {
  return (
    <div>
      <style>{`@keyframes shimmer { 0%{background-position:200% 0} 100%{background-position:-200% 0} }`}</style>
      {[1, 2, 3].map(i => (
        <div key={i} style={{ background: C.card, border: `1px solid ${C.border}`, borderRadius: 14, padding: '14px', marginBottom: 8 }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <div style={{ flex: 1 }}>
              <SkeletonBox w="55%" h={14} r={6} mb={8} />
              <SkeletonBox w="35%" h={12} r={6} />
            </div>
            <SkeletonBox w={48} h={12} r={6} />
          </div>
        </div>
      ))}
    </div>
  )
}

function ProductSkeleton() {
  return (
    <div>
      <style>{`@keyframes shimmer { 0%{background-position:200% 0} 100%{background-position:-200% 0} }`}</style>
      {[1, 2, 3, 4].map(i => (
        <div key={i} style={{ background: C.card, border: `1px solid ${C.border}`, borderRadius: 14, padding: '14px 14px', marginBottom: 8 }}>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
            <div style={{ flex: 1 }}>
              <SkeletonBox w={`${45 + i * 8}%`} h={14} r={6} mb={8} />
              <SkeletonBox w="28%" h={12} r={6} />
            </div>
            <div style={{ textAlign: 'right' }}>
              <SkeletonBox w={40} h={12} r={6} mb={6} />
              <SkeletonBox w={16} h={16} r={4} />
            </div>
          </div>
        </div>
      ))}
    </div>
  )
}

function EmptyState({ label, sub }) {
  return (
    <div style={{ textAlign: 'center', padding: '48px 0' }}>
      <Package size={32} color="#4B5563" style={{ margin: '0 auto 12px' }} />
      <p style={{ fontFamily: 'Sora', fontSize: 14, color: TEXT_SEC, marginBottom: 4 }}>{label}</p>
      {sub && <p style={{ fontFamily: 'DM Sans', fontSize: 12, color: '#4B5563' }}>{sub}</p>}
    </div>
  )
}

function Chip({ label, value, color }) {
  return (
    <div style={{ background: 'rgba(255,255,255,0.03)', border: `1px solid ${C.border}`, padding: '8px 14px', borderRadius: 12, flexShrink: 0 }}>
      <p style={{ fontSize: 10, color: '#6B7280', fontFamily: 'DM Sans', marginBottom: 2 }}>{label}</p>
      <p style={{ fontSize: 14, fontWeight: 700, color: color, fontFamily: 'Sora' }}>{value}</p>
    </div>
  )
}

// ── Main Component ────────────────────────────────────────────────────────────

export default function Gudang() {
  const { profile } = useAuth()
  const showAudit = canViewAuditLogs(profile)
  const tabsList = useMemo(() => showAudit ? ['Stok Saat Ini', 'Riwayat Masuk', 'Riwayat Keluar', '🔄 Retur Gudang', '📜 Log Perubahan'] : ['Stok Saat Ini', 'Riwayat Masuk', 'Riwayat Keluar', '🔄 Retur Gudang'], [showAudit])
  const location = useLocation()
  const navigate = useNavigate()
  const [searchParams] = useSearchParams()
  const isDesktop = useMediaQuery('(min-width: 1024px)')
  const { setSidebarOpen = () => window.dispatchEvent(new Event('toggleMobileSidebar')) } = useOutletContext() || {}
  const preProductId = searchParams.get('product') || null

  const { data: products = [], isLoading: productsLoading, isError: productsIsError, error: productsError, refetch: productsRefetch } = useSembakoProducts()
  const { data: suppliers = [], isError: supErr, error: supError, refetch: supRefetch } = useSembakoSuppliers()
  const { data: allBatches = [], isLoading: batchesLoading, isError: batchesIsError, error: batchesError, refetch: batchesRefetch } = useSembakoAllBatches()
  const { data: sales = [], isLoading: salesLoading } = useSembakoSales()
  const { data: rawMaterials = [], isLoading: rawLoading } = useSembakoRawMaterials()

  const [activeTab, setActiveTab] = useState(0)
  const [importCsvOpen, setImportCsvOpen] = useState(false)
  const [showTambahSheet, setShowTambahSheet] = useState(() => {
    const params = new URLSearchParams(window.location.search)
    const act = params.get('action')
    return !!preProductId || act === 'add-stock' || act === 'tambah'
  })
  const [tambahProductId, setTambahProductId] = useState(preProductId)

  React.useEffect(() => {
    const params = new URLSearchParams(location.search)
    const action = params.get('action')
    if (action === 'add-stock' || action === 'tambah') {
      setShowTambahSheet(true)
    }
  }, [location.search])

  const [showAdjustSheet, setShowAdjustSheet] = useState(false)
  const [selectedBatch, setSelectedBatch] = useState(null)
  const [selectedProduct, setSelectedProduct] = useState(null)

  const [showHistorySheet, setShowHistorySheet] = useState(false)
  const [historyProduct, setHistoryProduct] = useState(null)

  const openTambah = (productId = null) => {
    setTambahProductId(productId)
    setShowTambahSheet(true)
  }

  const openAdjust = (batch, product) => {
    setSelectedBatch(batch)
    setSelectedProduct(product)
    setShowAdjustSheet(true)
  }

  const totalStokNilai = useMemo(() => {
    // Real physical asset = Total Nilai Bahan Baku & Kemasan Fisik
    const rawValuation = rawMaterials.reduce((sum, r) => {
      return sum + ((Number(r.current_stock) || 0) * (Number(r.unit_cost) || 0))
    }, 0)

    // Tambahkan batch produk fisik non-BOM / mandiri jika ada
    const standaloneBatchValuation = allBatches.reduce((sum, b) => {
      if (b.qty_sisa > 0 && !b.is_deleted) {
        return sum + (Number(b.qty_sisa) * Number(b.buy_price || 0))
      }
      return sum
    }, 0)

    if (rawMaterials.length > 0) {
      return rawValuation + standaloneBatchValuation
    }

    return products.filter(p => p.is_active && !p.is_deleted).reduce((sum, p) => {
      return sum + ((Number(p.current_stock) || 0) * (Number(p.avg_buy_price) || 0))
    }, 0)
  }, [rawMaterials, allBatches, products])

  const lowStockCount = useMemo(() => {
    const lowProds = products.filter(p => p.is_active && !p.is_deleted && p.min_stock_alert > 0 && p.current_stock <= p.min_stock_alert).length
    const lowRaws = rawMaterials.filter(r => r.min_stock_alert > 0 && r.current_stock <= r.min_stock_alert).length
    return lowProds + lowRaws
  }, [products, rawMaterials])

  const summaryItems = [
    { label: 'Nilai Modal Gudang (Fisik)', value: totalStokNilai, isCurrency: true, color: 'amber' },
    { label: 'Total Produk Aktif', value: products.filter(p => p.is_active && !p.is_deleted).length },
    { label: 'Bahan Baku & Kemasan', value: `${rawMaterials.length} jenis` },
    { label: 'Stok Menipis', value: lowStockCount > 0 ? `${lowStockCount} item` : 'Stok Aman', color: lowStockCount > 0 ? 'red' : 'green' },
  ]

  return (
    <div className="min-h-screen bg-background pb-[max(140px,calc(110px+env(safe-area-inset-bottom,24px)))] text-left">
      {!isDesktop && <BrokerMobileHeader title="Gudang" onMenuClick={() => setSidebarOpen(true)} />}

      <div className="mx-auto max-w-7xl">
        <SembakoPageHeader
          title="Gudang"
          subtitle="Manajemen Stok & Batch Produk Sembako"
          isDesktop={isDesktop}
          actionButton={
            <div className="flex items-center gap-2">
              <button
                onClick={() => setImportCsvOpen(true)}
                className="flex items-center gap-1.5 px-3 h-10 rounded-xl font-bold text-xs bg-card border border-border/60 hover:bg-muted text-foreground transition-all cursor-pointer shrink-0"
              >
                <FileSpreadsheet size={15} className="text-slate-600" />
                <span>Import CSV</span>
              </button>
              <button
                onClick={() => navigate('/dashboard/broker/sembako/produk?tab=bahan_baku')}
                className="flex items-center gap-2 px-4 h-10 rounded-xl font-bold text-xs bg-[#0F172A] hover:bg-slate-900 text-white transition-all cursor-pointer shadow-lg shadow-slate-900/10 active:scale-95 shrink-0"
              >
                <Layers size={16} />
                <span>Kelola Bahan Baku</span>
              </button>
            </div>
          }
        />

        <SembakoSummaryStrip items={summaryItems} />

        {/* Tabs */}
        <div className="flex px-4 sm:px-6 gap-2 border-b border-border/60 mt-2 overflow-x-auto scrollbar-hide">
          {tabsList.map((tab, i) => (
            <button
              key={tab}
              onClick={() => setActiveTab(i)}
              className={cn(
                'py-2.5 px-4 font-bold text-xs border-b-2 transition-all cursor-pointer whitespace-nowrap select-none',
                activeTab === i
                  ? 'border-[#0F172A] text-[#0F172A] dark:border-white dark:text-white'
                  : 'border-transparent text-muted-foreground hover:text-foreground'
              )}
            >
              {tab}
            </button>
          ))}
        </div>

        {/* Tab content */}
        <div className="px-4 sm:px-6 pt-4">
          {activeTab === 0 && (
            productsLoading || batchesLoading || salesLoading || rawLoading
              ? <ProductSkeleton />
              : productsIsError || batchesIsError || supErr
                ? <SembakoErrorState error={productsError || batchesError || supError} onRetry={() => { productsRefetch(); batchesRefetch(); supRefetch(); }} />
                : <StokSaatIni
                  products={products}
                  allBatches={allBatches}
                  sales={sales}
                  rawMaterials={rawMaterials}
                  onShowHistory={p => { setHistoryProduct(p); setShowHistorySheet(true) }}
                  navigate={navigate}
                />
          )}
          {activeTab === 1 && (
            <RiwayatMasuk
              batches={allBatches}
              isLoading={batchesLoading}
              isError={batchesIsError}
              error={batchesError}
              refetch={batchesRefetch}
            />
          )}
          {activeTab === 2 && <RiwayatKeluar />}
          {activeTab === 3 && <ReturGudangTab />}
          {activeTab === 4 && <AuditLogTab />}
        </div>
      </div>

      {/* Sheet Stok Masuk */}
      <AnimatePresence>
        {showTambahSheet && (
          <SembakoTambahStokSheet
            preselectedProductId={tambahProductId}
            products={products.filter(p => p.is_active && !p.is_deleted)}
            suppliers={suppliers}
            onClose={() => {
              setShowTambahSheet(false)
              setTambahProductId(null)
              if (location.search.includes('action=')) {
                navigate(location.pathname, { replace: true })
              }
            }}
          />
        )}
      </AnimatePresence>

      {/* Sheet Adjust Stok (Owner Only) */}
      <AnimatePresence>
        {showAdjustSheet && (
          <AdjustStokSheet
            batch={selectedBatch}
            product={selectedProduct}
            onClose={() => { setShowAdjustSheet(false); setSelectedBatch(null); setSelectedProduct(null) }}
          />
        )}
      </AnimatePresence>

      {/* Sheet Kartu Stok (Unified Log) */}
      <AnimatePresence>
        {showHistorySheet && (
          <KartuStokSheet
            product={historyProduct}
            onClose={() => { setShowHistorySheet(false); setHistoryProduct(null) }}
          />
        )}
      </AnimatePresence>

      <ImportCsvModal
        open={importCsvOpen}
        onClose={() => setImportCsvOpen(false)}
        defaultEntity="purchases"
      />
    </div>
  )
}

function KartuStokSheet({ product, onClose }) {
  useBackHandler(true, onClose)
  const { data: batches = [], isLoading: bLoad, isError: bErr, error: bError, refetch: bRefetch } = useSembakoAllBatches()
  const { data: stockOuts = [], isLoading: sLoad, isError: sErr, error: sError, refetch: sRefetch } = useSembakoStockOut()
  const { data: returnsList = [], isLoading: rLoad } = useSembakoReturns()

  const isError = bErr || sErr
  const error = bError || sError
  const isLoading = bLoad || sLoad || rLoad
  const refetch = () => { bRefetch(); sRefetch() }

  const movements = useMemo(() => {
    if (!product) return []

    const logs = []

    // 1. Stock In (Batches, excluding BTC-RET)
    batches
      .filter(b => b.product_id === product.id && !b.batch_code?.startsWith('BTC-RET') && !b.notes?.includes('Retur'))
      .forEach(b => {
        logs.push({
          id: `in-${b.id}`,
          date: b.purchase_date || b.created_at,
          type: 'IN',
          qty: b.qty_masuk,
          ref: b.batch_code,
          notes: b.sembako_suppliers?.supplier_name || 'Stok Masuk',
          color: 'text-emerald-500'
        })
      })

    // 2. Stock In from Returns (completed)
    returnsList
      .filter(r => r.product_id === product.id && r.status === 'completed' && !r.is_deleted)
      .forEach(r => {
        logs.push({
          id: `ret-${r.id}`,
          date: r.created_at,
          type: 'RET',
          qty: r.quantity,
          ref: r.return_number || `RET-${r.id.slice(0, 6).toUpperCase()}`,
          notes: `Retur Toko: ${r.party_name || '-'}`,
          color: 'text-amber-400'
        })
      })

    // 3. Stock Out (Sales & Adjustments)
    stockOuts.filter(s => s.product_id === product.id).forEach(s => {
      logs.push({
        id: `out-${s.id}`,
        date: s.created_at,
        type: s.reason === 'adjustment' ? 'ADJ' : 'OUT',
        qty: -s.qty_keluar,
        ref: s.sembako_sales?.invoice_number || s.sembako_stock_batches?.batch_code,
        notes: s.notes || (s.reason === 'adjustment' ? 'Penyesuaian' : 'Penjualan'),
        color: s.reason === 'adjustment' ? 'text-orange-500' : 'text-red-500'
      })
    })

    return logs.sort((a, b) => new Date(b.date) - new Date(a.date))
  }, [product, batches, stockOuts, returnsList])

  return (
    <motion.div
      initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
      style={{ position: 'fixed', inset: 0, zIndex: 5000, background: 'rgba(0,0,0,0.8)', display: 'flex', alignItems: 'flex-end', justifyContent: 'center' }}
      onClick={onClose}
    >
      <motion.div
        initial={{ y: '100%' }} animate={{ y: 0 }} exit={{ y: '100%' }}
        style={{ background: 'var(--bg-surface)', borderRadius: '24px 24px 0 0', width: '100%', maxWidth: '540px', padding: '0 0 max(32px, calc(16px + env(safe-area-inset-bottom, 16px)))', borderTop: `1px solid ${C.border}`, height: '85vh', display: 'flex', flexDirection: 'column' }}
        onClick={e => e.stopPropagation()}
      >
        <div style={{ textAlign: 'center', padding: '12px 0' }}>
          <div style={{ width: 40, height: 4, background: 'rgba(255,255,255,0.1)', borderRadius: 2, margin: '0 auto' }} />
        </div>

        <div style={{ padding: '4px 20px 24px', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
          <div className="flex items-center gap-3">
            <div>
              <h2 className="font-display font-black text-white uppercase text-lg leading-none">Kartu Stok</h2>
              <p className="text-[10px] font-black text-orange-500 uppercase tracking-widest mt-1">{product?.product_name}</p>
            </div>
          </div>
          <button onClick={onClose} className="p-2 rounded-lg bg-white/5 text-[#4B6478]">
            <X size={20} />
          </button>
        </div>

        <div className="flex-1 overflow-y-auto px-4 space-y-3 pb-20">
          {isError ? (
            <div className="py-10"><SembakoErrorState error={error} onRetry={refetch} /></div>
          ) : isLoading ? (
            <p className="text-center py-20 text-[#4B6478] font-bold text-xs uppercase">Memuat data...</p>
          ) : movements.length === 0 ? (
            <p className="text-center py-20 text-[#4B6478] font-bold text-xs uppercase">Belum ada riwayat pergerakan</p>
          ) : (
            movements.map(m => (
              <div key={m.id} className="bg-white/5 border border-white/5 rounded-2xl p-4 flex justify-between items-center">
                <div className="space-y-1">
                  <div className="flex items-center gap-2">
                    <span className={cn("text-[9px] font-black px-2 py-0.5 rounded-full bg-white/10 uppercase tracking-widest", m.color)}>
                      {m.type}
                    </span>
                    <span className="text-[10px] font-bold text-[#4B6478] uppercase">{fmtDate(m.date)}</span>
                  </div>
                  <p className="text-sm font-black text-white leading-tight uppercase">{m.ref}</p>
                  <p className="text-[11px] font-bold text-[#4B6478] uppercase truncate max-w-[200px]">{m.notes}</p>
                </div>
                <div className="text-right">
                  <p className={cn("font-display text-lg font-black tabular-nums", m.color)}>
                    {m.qty > 0 ? '+' : ''}{m.qty}
                  </p>
                  <p className="text-[10px] font-black text-[#4B6478] uppercase">{product?.unit}</p>
                </div>
              </div>
            ))
          )}
        </div>
      </motion.div>
    </motion.div>
  )
}

const SField = ({ label, children }) => (
  <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
    <label style={{ fontFamily: 'DM Sans', fontSize: 11, fontWeight: 800, color: '#FDBA74', textTransform: 'uppercase', letterSpacing: '0.06em' }}>{label}</label>
    {children}
  </div>
)

function AdjustStokSheet({ batch, product, onClose }) {
  useBackHandler(true, onClose)
  const { profile } = useAuth()
  const adjustMut = useAdjustBatchStock()
  const addBatch  = useAddStockBatch()
  const [qtyChange, setQtyChange] = useState('')
  const [reason, setReason] = useState('broken') // 'broken' | 'lost' | 'found' | 'other'
  const [notes, setNotes] = useState('')

  const handleAdjust = async (e) => {
    e.preventDefault()
    const change = Number(qtyChange)
    if (isNaN(change) || change === 0) return toast.error('Jumlah perubahan tidak boleh 0')

    const finalChange = (reason === 'broken' || reason === 'lost') ? -Math.abs(change) : change
    const initialStock = batch?.qty_sisa ?? product?.current_stock ?? 0

    if (batch?.id) {
      await adjustMut.mutateAsync({
        batch_id: batch.id,
        qty_change: finalChange,
        reason,
        notes
      })
    } else {
      await addBatch.mutateAsync({
        product_id: product.id,
        supplier_id: null,
        qty_masuk: Math.max(0, finalChange),
        buy_price: product.avg_buy_price || 0,
        purchase_date: new Date().toISOString().slice(0, 10),
        notes: `Penyesuaian stok (${reason}): ${notes || 'Adjust awal'}`
      })
    }

    const nextStock = Math.max(0, initialStock + finalChange)

    recordAuditLog({
      action_type: 'STOK_ADJ',
      product_name: product?.product_name || 'Produk Gudang',
      old_value: `${initialStock} ${product?.unit || ''}`,
      new_value: `${nextStock} ${product?.unit || ''}`,
      notes: `Penyesuaian stok (${reason.toUpperCase()}): ${notes || 'Tidak ada catatan'}`,
      profile,
    })

    onClose()
  }

  const isLoading = adjustMut.isPending || addBatch.isPending

  return (
    <motion.div
      initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
      style={{ position: 'fixed', inset: 0, zIndex: 5000, background: 'rgba(0,0,0,0.8)', display: 'flex', alignItems: 'flex-end', justifyContent: 'center' }}
      onClick={onClose}
    >
      <motion.div
        initial={{ y: '100%' }} animate={{ y: 0 }} exit={{ y: '100%' }}
        style={{ background: 'var(--bg-surface)', borderRadius: '20px 20px 0 0', width: '100%', maxWidth: '540px', padding: '0 0 max(36px, calc(20px + env(safe-area-inset-bottom, 20px)))', borderTop: `2px solid ${C.accent}`, maxHeight: '92vh', overflowY: 'auto' }}
        onClick={e => e.stopPropagation()}
      >
        <div style={{ textAlign: 'center', padding: '12px 0' }}>
          <div style={{ width: 40, height: 4, background: 'rgba(255,255,255,0.1)', borderRadius: 2, margin: '0 auto' }} />
        </div>

        <div style={{ padding: '4px 20px 24px', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-orange-500/10 flex items-center justify-center text-orange-500">
              <ArrowRightLeft size={20} />
            </div>
            <div>
              <h2 className="font-display font-black text-white uppercase text-lg leading-none">Otoritas Penyesuaian</h2>
              <p className="text-[10px] font-black text-orange-500 uppercase tracking-widest mt-1">Hanya untuk Owner</p>
            </div>
          </div>
          <button onClick={onClose} className="p-2 rounded-lg bg-white/5 text-[#4B6478] hover:bg-white/10">
            <X size={20} />
          </button>
        </div>

        <form onSubmit={handleAdjust} style={{ padding: '0 20px', display: 'flex', flexDirection: 'column', gap: 16 }}>
          <div className="p-4 rounded-2xl bg-white/5 border border-white/5 space-y-1">
            <p className="text-[10px] font-black text-[#4B6478] uppercase tracking-widest">{product.product_name}</p>
            <p className="text-sm font-black text-white uppercase tracking-tight">Batch: {batch?.batch_code || 'Batch Utama'}</p>
            <p className="text-xs font-bold text-slate-400">Stok Digital Saat Ini: {batch?.qty_sisa ?? product.current_stock ?? 0} {product.unit}</p>
          </div>

          <SField label="Aksi">
            <div className="grid grid-cols-2 gap-2">
              {[
                { id: 'broken', label: 'RUSAK (-)', color: 'text-red-400', bg: 'bg-red-500/10' },
                { id: 'lost', label: 'HILANG (-)', color: 'text-red-400', bg: 'bg-red-500/10' },
                { id: 'found', label: 'TEMUAN (+)', color: 'text-emerald-400', bg: 'bg-emerald-500/10' },
                { id: 'other', label: 'LAINNYA', color: 'text-blue-400', bg: 'bg-blue-500/10' }
              ].map(opt => (
                <button
                  key={opt.id} type="button"
                  onClick={() => setReason(opt.id)}
                  className={cn(
                    "h-12 rounded-xl text-[10px] font-black uppercase tracking-widest border transition-all",
                    reason === opt.id ? "border-slate-400 bg-slate-500/20 text-white shadow-lg" : "border-white/5 bg-white/5 text-[#4B6478]"
                  )}
                >
                  {opt.label}
                </button>
              ))}
            </div>
          </SField>

          <SField label={`Jumlah Fisik yang di-Adjust (${product.unit})`}>
            <input
              type="number" step="0.01"
              value={qtyChange}
              onChange={e => setQtyChange(e.target.value)}
              placeholder="0"
              style={inputSt}
              autoFocus
            />
          </SField>

          {/* Real-time Projected Stock Preview */}
          {(() => {
            const currentStockNum = Number(batch?.qty_sisa ?? product?.current_stock ?? 0)
            const valNum = Math.abs(Number(qtyChange) || 0)
            const isDecrease = reason === 'broken' || reason === 'lost'
            const delta = isDecrease ? -valNum : valNum
            const projectedStock = Math.max(0, currentStockNum + delta)
            const hasValue = qtyChange !== '' && !isNaN(Number(qtyChange)) && Number(qtyChange) !== 0

            return (
              <div className="p-3.5 rounded-xl bg-slate-500/10 border border-slate-500/30 flex items-center justify-between">
                <div>
                  <p className="text-[10px] font-black text-slate-400 uppercase tracking-wider">
                    {hasValue ? 'Hasil Stok Setelah Adjust' : 'Estimasi Stok Setelah Adjust'}
                  </p>
                  <div className="flex items-center gap-2 mt-1">
                    <span className="text-xs text-slate-400 font-bold">
                      Saat Ini: <strong className="text-white">{currentStockNum}</strong> {product.unit}
                    </span>
                    {hasValue && (
                      <>
                        <span className="text-xs font-black text-slate-500">→</span>
                        <span className="text-sm font-black text-white font-display">
                          {projectedStock.toFixed(2).replace(/\.00$/, '')} {product.unit}
                        </span>
                      </>
                    )}
                  </div>
                </div>
                {hasValue && (
                  <div className={cn("px-2.5 py-1 rounded-lg text-xs font-black uppercase tracking-wider", isDecrease ? "bg-red-500/20 text-red-400 border border-red-500/30" : "bg-emerald-500/20 text-emerald-400 border border-emerald-500/30")}>
                    {isDecrease ? `-${valNum}` : `+${valNum}`} {product.unit}
                  </div>
                )}
              </div>
            )
          })()}

          <SField label="Keterangan / Alasan">
            <textarea
              value={notes}
              onChange={e => setNotes(e.target.value)}
              placeholder="Contoh: Pecah saat pemindahan atau salah hitung awal"
              style={{ ...inputSt, minHeight: 80, fontSize: 13, padding: 12 }}
            />
          </SField>

          <div className="pt-4">
            <button
              type="submit"
              disabled={isLoading || !qtyChange}
              className="w-full h-14 rounded-2xl bg-[#0F172A] hover:bg-slate-900 text-white font-black uppercase tracking-[0.2em] shadow-xl shadow-slate-950/40 transition-all active:scale-95 disabled:opacity-50"
            >
              {isLoading ? 'MEMPROSES...' : 'SIMPAN PENYESUAIAN'}
            </button>
          </div>
        </form>
      </motion.div>
    </motion.div>
  )
}

