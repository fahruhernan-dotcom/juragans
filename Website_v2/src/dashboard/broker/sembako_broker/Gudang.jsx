import React, { useState, useMemo, useCallback } from 'react'
import { cn } from '@/lib/utils'
import {
  Plus, ChevronDown, ChevronUp, X, Search, Package, ArrowRightLeft, History,
  CheckCircle2, RotateCcw, FileSpreadsheet, TrendingUp, Layers, ShoppingCart,
  Settings, Zap, Truck, UserCheck, Sparkles, Building2, AlertTriangle, ArrowRight
} from 'lucide-react'
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
  useSembakoStockCustody,
  useSembakoPackagingLogs,
  useSembakoStockTransfers,
  useSembakoEmployees,
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
import { SembakoCombineStudioModal } from './components/SembakoCombineStudioModal'
import { SembakoStockHandoverModal } from './components/SembakoStockHandoverModal'
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

function StokSaatIni({
  products,
  allBatches = [],
  sales = [],
  rawMaterials = [],
  custodyList = [],
  employees = [],
  onShowHistory,
  onOpenCombine,
  onOpenHandover,
  navigate,
  getModulePath
}) {
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
          placeholder="Cari produk jadi..."
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

        // Custody breakdown: Gudang Utama vs Staf (Reyhan, dll)
        // PENTING: Jika belum pernah di-combine ke custody gudang, stok fisik di gudang WAJIB 0!
        const whCustody = custodyList.find(c => c.holder_type === 'warehouse' && c.product_id === product.id)
        const whStock = whCustody ? Number(whCustody.quantity || 0) : 0

        const staffCustodies = custodyList.filter(c => c.holder_type === 'employee' && c.product_id === product.id && Number(c.quantity) > 0)
        const totalStaffStock = staffCustodies.reduce((s, c) => s + Number(c.quantity || 0), 0)

        const bomCapacity = bomInfo.totalStock
        const displayStock = whStock

        // Sales Performance Analytics for this product
        const productSalesItems = sales.flatMap(s => s.sembako_sale_items || []).filter(it => it.product_id === product.id)
        const totalSold = productSalesItems.reduce((s, it) => s + (Number(it.quantity) || 0), 0)
        const totalRevenue = productSalesItems.reduce((s, it) => {
          const qty = Number(it.quantity) || 0
          const price = Number(it.sell_price || it.price_per_unit || (qty > 0 && it.subtotal ? Number(it.subtotal) / qty : 0) || 0)
          return s + (qty * price)
        }, 0)
        const totalProfit = productSalesItems.reduce((s, it) => {
          const qty = Number(it.quantity) || 0
          const price = Number(it.sell_price || it.price_per_unit || (qty > 0 && it.subtotal ? Number(it.subtotal) / qty : 0) || 0)
          const itemHpp = Number(it.cogs_per_unit) || bomHpp || 0
          return s + (qty * (price - itemHpp))
        }, 0)

        const isLow = product.min_stock_alert > 0 && displayStock > 0 && displayStock <= product.min_stock_alert
        const isOpen = expanded === product.id
        const productValuation = displayStock * bomHpp

        return (
          <div key={product.id} className="mb-2.5 rounded-2xl overflow-hidden border transition-all duration-200" style={{ background: C.card, borderColor: isLow ? 'rgba(248,113,113,0.35)' : C.border }}>
            <div
              onClick={() => setExpanded(isOpen ? null : product.id)}
              className="w-full flex items-center justify-between p-3.5 sm:p-4 text-left bg-transparent border-none cursor-pointer gap-3 hover:bg-slate-500/5 transition-colors"
            >
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2 mb-1.5 flex-wrap">
                  <span className="font-display font-bold text-sm text-foreground truncate">{product.product_name}</span>

                  {/* Status Stok Ready */}
                  {whStock > 0 ? (
                    <span className="text-[10px] font-extrabold bg-emerald-500/15 text-emerald-700 dark:text-emerald-400 border border-emerald-500/30 px-2 py-0.5 rounded-full">
                      ✓ Ready Gudang: {fmt(whStock)} {product.unit}
                    </span>
                  ) : bomCapacity > 0 ? (
                    <span className="text-[10px] font-extrabold bg-amber-500/15 text-amber-700 dark:text-amber-400 border border-amber-500/30 px-2 py-0.5 rounded-full flex items-center gap-1">
                      <Zap size={10} className="fill-current" /> Belum Di-Combine (Bahan Siap: {fmt(bomCapacity)} {product.unit})
                    </span>
                  ) : (
                    <span className="text-[10px] font-extrabold bg-rose-500/15 text-rose-600 border border-rose-500/30 px-2 py-0.5 rounded-full">
                      Stok Habis & Bahan Kosong (0 {product.unit})
                    </span>
                  )}

                  {/* Status Dibawa Tim */}
                  {totalStaffStock > 0 && (
                    <span className="text-[10px] font-extrabold bg-indigo-500/10 text-indigo-700 dark:text-indigo-300 border border-indigo-500/25 px-2 py-0.5 rounded-full flex items-center gap-1">
                      <Truck size={10} /> Dibawa Tim: {fmt(totalStaffStock)} {product.unit}
                    </span>
                  )}

                  {isLow && (
                    <span className="text-[10px] font-extrabold bg-rose-500/15 text-rose-600 border border-rose-500/30 px-2 py-0.5 rounded-full">
                      Stok Menipis
                    </span>
                  )}

                  {totalSold > 0 && (
                    <span className="text-[10px] font-extrabold bg-slate-500/10 text-slate-700 dark:text-slate-300 border border-slate-500/20 px-2 py-0.5 rounded-full">
                      🔥 Terjual {fmt(totalSold)} {product.unit}
                    </span>
                  )}
                </div>

                <div className="flex items-center gap-2.5 sm:gap-3.5 flex-wrap text-xs">
                  <span className={cn("font-bold", whStock > 0 ? "text-emerald-700 dark:text-emerald-400 font-extrabold" : "text-slate-400")}>
                    📦 Gudang: <strong className={whStock > 0 ? "text-emerald-800 dark:text-emerald-300 font-black" : "text-slate-500"}>
                      {whStock > 0 ? `${fmt(whStock)} ${product.unit}` : `0 ${product.unit} (Belum di-combine)`}
                    </strong>
                  </span>
                  {totalStaffStock > 0 && (
                    <span className="text-indigo-600 dark:text-indigo-400 font-bold">
                      🚚 Tim: <strong>{fmt(totalStaffStock)} {product.unit}</strong>
                    </span>
                  )}
                  {bomCapacity > 0 && (
                    <span className="text-amber-700 dark:text-amber-400 font-medium">
                      ⚡ Bahan Siap: <strong className="font-bold">{fmt(bomCapacity)} {product.unit}</strong>
                    </span>
                  )}
                  <span className="text-slate-500 font-medium">
                    Jual: <strong className="text-slate-800 dark:text-slate-200 font-bold">Rp {fmt(product.sell_price)}</strong>
                  </span>
                  <span className="text-slate-500 font-medium">
                    HPP: <strong className="text-slate-700 dark:text-slate-300 font-bold">Rp {fmt(bomHpp)}</strong>
                  </span>
                  <span className="text-slate-600 dark:text-slate-400 bg-slate-100 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 px-2 py-0.5 rounded-md font-semibold text-[11px]">
                    Nilai Aset: Rp {fmt(productValuation)}
                  </span>
                </div>
              </div>

              {/* Quick Action Buttons on Card */}
              <div className="flex items-center gap-1.5 shrink-0" onClick={e => e.stopPropagation()}>
                {bomCapacity > 0 && (
                  <button
                    type="button"
                    onClick={() => onOpenCombine(product)}
                    className="flex items-center gap-1 px-2.5 py-1.5 rounded-xl text-xs font-black bg-gradient-to-r from-amber-500 to-orange-500 hover:from-amber-600 hover:to-orange-600 text-white shadow-xs transition-all active:scale-95 cursor-pointer"
                    title="Buka Meja Combine untuk meracik produk ini"
                  >
                    <Zap size={12} className="fill-white" />
                    <span className="inline">Combine</span>
                  </button>
                )}

                {whStock > 0 && (
                  <button
                    type="button"
                    onClick={() => onOpenHandover(product)}
                    className="flex items-center gap-1 px-2.5 py-1.5 rounded-xl text-xs font-bold bg-slate-900 hover:bg-slate-800 dark:bg-slate-700 text-white shadow-xs transition-all active:scale-95 cursor-pointer"
                    title="Serah terima stok ke tim/Reyhan"
                  >
                    <Truck size={12} />
                    <span className="hidden sm:inline">Bawa Stok</span>
                  </button>
                )}

                <button
                  type="button"
                  onClick={() => setExpanded(isOpen ? null : product.id)}
                  className="p-1 rounded-lg text-slate-400 hover:text-foreground transition-colors cursor-pointer"
                >
                  {isOpen ? <ChevronUp size={18} /> : <ChevronDown size={18} />}
                </button>
              </div>
            </div>

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
                    
                    {/* 1. Rincian Distribusi Fisik: Gudang vs Pegawai/Reyhan */}
                    <div className="p-3 rounded-xl bg-white dark:bg-slate-800/80 border border-slate-200/80 dark:border-slate-700/60 shadow-xs space-y-2">
                      <div className="flex items-center justify-between gap-2">
                        <div className="flex items-center gap-1.5 text-xs font-black text-slate-800 dark:text-slate-200 uppercase tracking-wider">
                          <Building2 size={14} className="text-indigo-600" />
                          <span>Lokasi & Pemegang Fisik Stok Saat Ini</span>
                        </div>
                        <span className="text-[11px] font-bold text-slate-500">
                          Total Fisik Beredar: <strong className="text-foreground font-black">{fmt(whStock + totalStaffStock)} {product.unit}</strong>
                        </span>
                      </div>

                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 pt-1">
                        {/* Gudang Utama */}
                        <div className="p-2.5 rounded-lg bg-emerald-50/50 dark:bg-emerald-950/20 border border-emerald-100 dark:border-emerald-900/40 flex items-center justify-between">
                          <div className="flex items-center gap-2">
                            <span className="text-lg">🏢</span>
                            <div>
                              <p className="text-xs font-bold text-emerald-950 dark:text-emerald-200">Gudang Utama</p>
                              <p className="text-[10px] text-emerald-700 dark:text-emerald-400">Penyimpanan Pusat (Ready)</p>
                            </div>
                          </div>
                          <div className="text-right">
                            <p className="text-sm font-black text-emerald-950 dark:text-emerald-100 font-mono">
                              {fmt(whStock)} {product.unit}
                            </p>
                            {whStock > 0 && (
                              <button
                                type="button"
                                onClick={() => onOpenHandover(product)}
                                className="text-[10px] font-bold text-indigo-600 hover:underline flex items-center gap-1 mt-0.5 cursor-pointer"
                              >
                                <Truck size={10} /> Serah Terima ke Tim
                              </button>
                            )}
                          </div>
                        </div>

                        {/* Bawaan Tim/Pegawai */}
                        <div className="p-2.5 rounded-lg bg-indigo-50/50 dark:bg-indigo-950/20 border border-indigo-100 dark:border-indigo-900/40">
                          <div className="flex items-center justify-between mb-1.5">
                            <div className="flex items-center gap-2">
                              <span className="text-lg">👥</span>
                              <div>
                                <p className="text-xs font-bold text-indigo-950 dark:text-indigo-200">Dipegang Tim Kanvas</p>
                                <p className="text-[10px] text-indigo-700 dark:text-indigo-400">Dibawa keliling/lapangan</p>
                              </div>
                            </div>
                            <p className="text-sm font-black text-indigo-950 dark:text-indigo-100 font-mono">
                              {fmt(totalStaffStock)} {product.unit}
                            </p>
                          </div>

                          {staffCustodies.length > 0 ? (
                            <div className="space-y-1 pt-1 border-t border-indigo-100 dark:border-indigo-900/40">
                              {staffCustodies.map((c, cIdx) => {
                                const emp = employees.find(e => e.id === c.employee_id)
                                const empName = emp?.full_name || c.employee_name || 'Pegawai'
                                return (
                                  <div key={cIdx} className="flex items-center justify-between text-xs py-0.5">
                                    <span className="text-slate-700 dark:text-slate-300 font-medium">👤 {empName}</span>
                                    <div className="flex items-center gap-2">
                                      <span className="font-bold text-indigo-900 dark:text-indigo-200 font-mono">{fmt(c.quantity)} {product.unit}</span>
                                      <button
                                        type="button"
                                        onClick={() => onOpenHandover(product, c.employee_id, 'return_to_warehouse')}
                                        className="text-[10px] font-bold text-rose-600 hover:underline cursor-pointer"
                                        title="Kembalikan sisa ke Gudang"
                                      >
                                        Tarik
                                      </button>
                                    </div>
                                  </div>
                                )
                              })}
                            </div>
                          ) : (
                            <p className="text-[10px] text-slate-400 italic">Belum ada staf yang membawa produk ini</p>
                          )}
                        </div>
                      </div>
                    </div>

                    {/* 2. Ringkasan Kinerja Penjualan */}
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

                    {/* 3. Komposisi Resep BOM & Kapasitas Bahan Baku */}
                    {bomInfo.components && bomInfo.components.length > 0 ? (
                      <div className="p-3 rounded-xl bg-white dark:bg-slate-800/80 border border-slate-200/80 dark:border-slate-700/60 shadow-xs space-y-2">
                        <div className="flex items-center justify-between gap-2">
                          <div className="flex items-center gap-1.5 text-xs font-black text-slate-800 dark:text-slate-200 uppercase tracking-wider">
                            <Layers size={14} className="text-amber-600" />
                            <span>Komposisi Resep & Sisa Bahan Baku</span>
                          </div>
                          <span className="text-[11px] font-bold text-slate-500">
                            Kapasitas Combine: <strong className="text-emerald-700 dark:text-emerald-400 font-black">{fmt(bomInfo.totalStock)} {product.unit}</strong>
                          </span>
                        </div>

                        <div className="space-y-1.5 pt-1">
                          {bomInfo.components.map((comp, cIdx) => (
                            <div
                              key={cIdx}
                              className={cn(
                                "flex items-center justify-between p-2 rounded-lg text-xs transition-colors",
                                comp.isBottleneck
                                  ? "bg-rose-50/70 dark:bg-rose-950/20 border border-rose-200 dark:border-rose-900/40 text-rose-950 dark:text-rose-200 font-medium"
                                  : "bg-slate-50 dark:bg-slate-900/40 border border-slate-100 dark:border-slate-800 text-slate-700 dark:text-slate-300"
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

                    {/* 4. Penjelasan Nilai Modal Asset */}
                    <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-2 p-2.5 rounded-xl bg-slate-100/70 dark:bg-slate-800 border border-slate-200 text-xs">
                      <div className="text-slate-600 dark:text-slate-300">
                        <span className="font-bold text-slate-800 dark:text-slate-100">Modal HPP Produk:</span> Rp {fmt(bomHpp)} / {product.unit}
                        <span className="text-slate-400 mx-1.5">·</span>
                        <span>Estimasi Nilai Aset Gudang: <strong>Rp {fmt(productValuation)}</strong></span>
                      </div>
                      <span className="text-[11px] font-medium text-slate-500">
                        Harga Jual Standar: <strong>Rp {fmt(product.sell_price)}</strong>
                      </span>
                    </div>

                    {/* 5. Aksi Cepat Operasional */}
                    <div className="flex flex-wrap items-center gap-2 pt-1">
                      {bomCapacity > 0 && (
                        <button
                          type="button"
                          onClick={() => onOpenCombine(product)}
                          className="flex items-center gap-1.5 px-3 py-2 rounded-xl bg-gradient-to-r from-amber-500 to-orange-500 hover:from-amber-600 hover:to-orange-600 text-white font-black text-xs shadow-md shadow-amber-500/20 transition-all cursor-pointer active:scale-95"
                        >
                          <Zap size={14} className="fill-white" />
                          <span>⚡ Buka Meja Combine (+{Math.min(10, bomCapacity)})</span>
                        </button>
                      )}

                      {whStock > 0 && (
                        <button
                          type="button"
                          onClick={() => onOpenHandover(product)}
                          className="flex items-center gap-1.5 px-3 py-2 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white font-bold text-xs shadow-xs transition-all cursor-pointer active:scale-95"
                        >
                          <Truck size={14} />
                          <span>🚚 Serah Terima ke Tim</span>
                        </button>
                      )}

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
                        onClick={() => navigate(getModulePath ? getModulePath(`/penjualan?action=new&product=${product.id}`) : `/penjualan?action=new&product=${product.id}`)}
                        className="flex items-center gap-1.5 px-3 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white font-bold text-xs shadow-xs transition-all cursor-pointer active:scale-95"
                      >
                        <ShoppingCart size={14} />
                        <span>Buat Penjualan</span>
                      </button>

                      <button
                        type="button"
                        onClick={() => navigate(getModulePath ? getModulePath('/produk?tab=bahan_baku') : '/produk?tab=bahan_baku')}
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

// ── Tab: Bahan Baku & Kemasan (Komponen Mentah) ───────────────────────────────

function BahanBakuKemasanTab({ rawMaterials = [], onOpenCombine, navigate, getModulePath }) {
  const [search, setSearch] = useState('')

  const filtered = useMemo(() => {
    if (!search) return rawMaterials.filter(r => !r.is_deleted)
    const q = search.toLowerCase()
    return rawMaterials.filter(r =>
      !r.is_deleted &&
      (r.material_name?.toLowerCase().includes(q) || r.category?.toLowerCase().includes(q))
    )
  }, [rawMaterials, search])

  const totalRawAsset = useMemo(() => {
    return rawMaterials.filter(r => !r.is_deleted).reduce((sum, r) => {
      return sum + ((Number(r.current_stock) || 0) * (Number(r.unit_cost) || 0))
    }, 0)
  }, [rawMaterials])

  return (
    <div className="space-y-3">
      {/* Header Info Banner */}
      <div className="p-4 rounded-2xl bg-amber-500/10 border border-amber-500/30 flex flex-col sm:flex-row justify-between sm:items-center gap-3">
        <div>
          <div className="flex items-center gap-2">
            <span className="text-lg">🌾</span>
            <h3 className="font-display font-black text-sm text-foreground">Inventaris Bahan Baku & Kemasan</h3>
          </div>
          <p className="text-xs text-muted-foreground mt-0.5">
            Komponen mentah (Bawang Curah, Pouch, Stiker) yang digunakan saat meracik produk jadi di Meja Combine.
          </p>
        </div>
        <div className="flex items-center gap-2 shrink-0">
          <div className="text-right mr-2">
            <p className="text-[10px] font-bold text-muted-foreground uppercase">Total Nilai Modal Bahan</p>
            <p className="text-sm font-black text-amber-700 dark:text-amber-400 font-mono">Rp {fmt(totalRawAsset)}</p>
          </div>
          <button
            type="button"
            onClick={() => onOpenCombine(null)}
            className="flex items-center gap-1.5 px-3.5 h-9 rounded-xl text-xs font-black bg-gradient-to-r from-amber-500 to-orange-500 hover:from-amber-600 text-white shadow-sm transition-all active:scale-95 cursor-pointer shrink-0"
          >
            <Zap size={14} className="fill-white" />
            <span>⚡ Meja Combine</span>
          </button>
        </div>
      </div>

      {/* Search bar */}
      <div style={{ position: 'relative', marginBottom: 12 }}>
        <Search size={15} color="#6B7280" style={{ position: 'absolute', left: 12, top: '50%', transform: 'translateY(-50%)' }} />
        <input
          type="text"
          value={search} onChange={e => setSearch(e.target.value)}
          placeholder="Cari bahan baku (bawang curah, pouch, stiker, polymailer)..."
          style={{ ...inputSt, paddingLeft: 36 }}
        />
        {search && (
          <button onClick={() => setSearch('')} style={{ position: 'absolute', right: 12, top: '50%', transform: 'translateY(-50%)', background: 'transparent', border: 'none', cursor: 'pointer' }}>
            <X size={14} color="#6B7280" />
          </button>
        )}
      </div>

      {filtered.length === 0 ? (
        <EmptyState label="Belum ada data bahan baku" sub="Tambahkan bahan baku di menu Produk & Stok > Tab Bahan Baku" />
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
          {filtered.map(mat => {
            const stock = Number(mat.current_stock) || 0
            const cost = Number(mat.unit_cost) || 0
            const val = stock * cost
            const isLow = mat.min_stock_alert > 0 && stock <= mat.min_stock_alert

            return (
              <div
                key={mat.id}
                className="p-3.5 rounded-2xl bg-card border border-border/70 hover:border-border transition-all flex flex-col justify-between gap-3 shadow-2xs"
              >
                <div>
                  <div className="flex items-start justify-between gap-2">
                    <div>
                      <p className="font-display font-bold text-sm text-foreground">{mat.material_name}</p>
                      <p className="text-[10px] font-bold text-slate-400 uppercase tracking-wider mt-0.5">{mat.category || 'Bahan Baku'}</p>
                    </div>
                    {isLow && (
                      <span className="text-[9.5px] font-extrabold bg-rose-500/15 text-rose-600 border border-rose-500/30 px-2 py-0.5 rounded-full shrink-0">
                        Menipis
                      </span>
                    )}
                  </div>

                  <div className="mt-3 flex items-baseline justify-between">
                    <div>
                      <p className="text-[10px] font-bold text-slate-400 uppercase">Sisa Stok Fisik</p>
                      <p className={cn("text-base font-black font-mono mt-0.5", stock <= 0 ? "text-rose-600" : "text-emerald-700 dark:text-emerald-400")}>
                        {fmt(stock)} <span className="text-xs font-sans font-bold text-slate-500">{mat.unit}</span>
                      </p>
                    </div>
                    <div className="text-right">
                      <p className="text-[10px] font-bold text-slate-400 uppercase">Nilai Aset Bahan</p>
                      <p className="text-sm font-bold text-foreground font-mono mt-0.5">
                        Rp {fmt(val)}
                      </p>
                    </div>
                  </div>
                </div>

                <div className="pt-2 border-t border-border/50 flex items-center justify-between text-xs text-slate-500">
                  <span>Modal: <strong className="text-foreground">Rp {fmt(cost)}</strong> / {mat.unit}</span>
                  <button
                    type="button"
                    onClick={() => navigate(getModulePath ? getModulePath('/produk?tab=bahan_baku') : '/produk?tab=bahan_baku')}
                    className="text-xs font-bold text-indigo-600 hover:underline cursor-pointer"
                  >
                    Edit Bahan →
                  </button>
                </div>
              </div>
            )
          })}
        </div>
      )}
    </div>
  )
}

// ── Tab: Pemegang Stok (Gudang Utama vs Reyhan & Tim Lapangan) ────────────────

function PemegangStokTab({
  employees = [],
  products = [],
  custodyList = [],
  onOpenHandover
}) {
  const activeEmployees = useMemo(() => {
    return employees.filter(e => !e.is_deleted && e.status !== 'nonaktif')
  }, [employees])

  // Hitung total fisik di Gudang Utama
  const warehouseItems = useMemo(() => {
    return products.filter(p => p.is_active && !p.is_deleted).map(p => {
      const cRow = custodyList.find(c => c.holder_type === 'warehouse' && c.product_id === p.id)
      const qty = cRow ? Number(cRow.quantity || 0) : Number(p.current_stock || 0)
      return {
        product: p,
        quantity: qty,
        unit: p.unit,
        value: qty * (p.avg_buy_price || 0)
      }
    }).filter(it => it.quantity > 0)
  }, [products, custodyList])

  const totalWhPcs = warehouseItems.reduce((s, it) => s + it.quantity, 0)
  const totalWhValue = warehouseItems.reduce((s, it) => s + it.value, 0)

  // Hitung total fisik yang dipegang masing-masing Pegawai (e.g. Reyhan)
  const staffHoldings = useMemo(() => {
    return activeEmployees.map(emp => {
      const itemsHeld = custodyList.filter(c =>
        c.holder_type === 'employee' &&
        c.employee_id === emp.id &&
        Number(c.quantity) > 0
      ).map(c => {
        const prod = products.find(p => p.id === c.product_id)
        const qty = Number(c.quantity || 0)
        const sellPrice = prod?.sell_price || 0
        const buyPrice = prod?.avg_buy_price || 0
        return {
          product_id: c.product_id,
          product_name: c.product_name || prod?.product_name || 'Produk',
          quantity: qty,
          unit: c.unit || prod?.unit || 'pcs',
          sellPrice,
          buyPrice,
          retailValue: qty * sellPrice,
          cogsValue: qty * buyPrice
        }
      })

      const totalPcs = itemsHeld.reduce((s, it) => s + it.quantity, 0)
      const totalRetail = itemsHeld.reduce((s, it) => s + it.retailValue, 0)
      const totalCogs = itemsHeld.reduce((s, it) => s + it.cogsValue, 0)

      return {
        employee: emp,
        items: itemsHeld,
        totalPcs,
        totalRetail,
        totalCogs
      }
    })
  }, [activeEmployees, custodyList, products])

  const totalStaffPcs = staffHoldings.reduce((s, h) => s + h.totalPcs, 0)

  return (
    <div className="space-y-4">
      {/* Banner Ringkasan Pembagian Stok */}
      <div className="p-4 rounded-2xl bg-card border border-border/80 shadow-xs flex flex-col sm:flex-row justify-between sm:items-center gap-3">
        <div>
          <div className="flex items-center gap-2">
            <span className="text-xl">🚚</span>
            <h3 className="font-display font-black text-sm text-foreground">Pemegang & Distribusi Stok Fisik</h3>
          </div>
          <p className="text-xs text-muted-foreground mt-0.5">
            Lacak siapa saja yang membawa stok barang (Gudang Utama vs Reyhan & Tim Kanvas keliling).
          </p>
        </div>
        <div className="flex items-center gap-3 shrink-0">
          <div className="text-right">
            <p className="text-[10px] font-bold text-muted-foreground uppercase">Di Gudang Utama</p>
            <p className="text-sm font-black text-emerald-700 dark:text-emerald-400 font-mono">{fmt(totalWhPcs)} pcs</p>
          </div>
          <div className="text-right pl-3 border-l border-border">
            <p className="text-[10px] font-bold text-muted-foreground uppercase">Dibawa Tim Lapangan</p>
            <p className="text-sm font-black text-indigo-600 dark:text-indigo-400 font-mono">{fmt(totalStaffPcs)} pcs</p>
          </div>
          <button
            type="button"
            onClick={() => onOpenHandover(null, null, 'handover_to_staff')}
            className="flex items-center gap-1.5 px-3.5 h-9 rounded-xl text-xs font-black bg-slate-900 hover:bg-slate-800 text-white shadow-sm transition-all active:scale-95 cursor-pointer ml-2"
          >
            <Truck size={14} />
            <span>Bawa Stok Baru</span>
          </button>
        </div>
      </div>

      {/* Grid: 1. Gudang Utama Card & 2. Pegawai Cards */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        {/* 🏢 KARTU GUDANG UTAMA */}
        <div className="p-4 rounded-2xl bg-card border-2 border-emerald-500/30 flex flex-col justify-between shadow-xs">
          <div>
            <div className="flex items-center justify-between pb-3 border-b border-border">
              <div className="flex items-center gap-2.5">
                <div className="w-10 h-10 rounded-xl bg-emerald-500/15 border border-emerald-500/30 flex items-center justify-center text-emerald-700 dark:text-emerald-400 font-bold text-lg">
                  🏢
                </div>
                <div>
                  <h4 className="font-display font-black text-sm text-foreground leading-tight">Gudang Utama (Pusat)</h4>
                  <p className="text-[10px] font-bold text-emerald-600 dark:text-emerald-400 uppercase tracking-wider mt-0.5">Penyimpanan Ready Stock</p>
                </div>
              </div>
              <div className="text-right">
                <span className="text-xs font-black font-mono text-emerald-700 dark:text-emerald-400 bg-emerald-500/10 border border-emerald-500/20 px-2.5 py-1 rounded-lg">
                  {fmt(totalWhPcs)} pcs ready
                </span>
              </div>
            </div>

            {/* List Barang di Gudang */}
            <div className="py-3 space-y-2 max-h-72 overflow-y-auto pr-1">
              {warehouseItems.length === 0 ? (
                <div className="text-center py-6 text-slate-400 text-xs italic">
                  Belum ada produk ready di Gudang Utama. Lakukan combine produk di Meja Combine!
                </div>
              ) : (
                warehouseItems.map((it, idx) => (
                  <div key={idx} className="flex items-center justify-between text-xs py-1.5 px-2.5 rounded-lg bg-slate-50 dark:bg-slate-900/40 border border-slate-100 dark:border-slate-800">
                    <span className="font-semibold text-foreground truncate pr-2">{it.product.product_name}</span>
                    <div className="flex items-center gap-2 shrink-0">
                      <span className="font-black font-mono text-emerald-700 dark:text-emerald-400">{fmt(it.quantity)} {it.unit}</span>
                      <button
                        type="button"
                        onClick={() => onOpenHandover(it.product, null, 'handover_to_staff')}
                        className="text-[10px] font-bold text-indigo-600 hover:underline cursor-pointer"
                        title="Serah terima ke staf"
                      >
                        Bawa →
                      </button>
                    </div>
                  </div>
                ))
              )}
            </div>
          </div>

          <div className="pt-3 border-t border-border flex items-center justify-between text-xs">
            <span className="text-slate-500">Estimasi Modal: <strong className="text-foreground">Rp {fmt(totalWhValue)}</strong></span>
            <button
              type="button"
              onClick={() => onOpenHandover(null, null, 'handover_to_staff')}
              className="flex items-center gap-1 font-bold text-indigo-600 hover:underline cursor-pointer"
            >
              <span>Beri Stok ke Pegawai</span>
              <ArrowRight size={13} />
            </button>
          </div>
        </div>

        {/* 👥 KARTU PEGAWAI (REYHAN, DLL) */}
        {staffHoldings.map(({ employee, items, totalPcs, totalRetail, totalCogs }) => (
          <div
            key={employee.id}
            className={cn(
              "p-4 rounded-2xl bg-card border flex flex-col justify-between shadow-xs transition-all",
              totalPcs > 0 ? "border-indigo-500/30" : "border-border/60"
            )}
          >
            <div>
              <div className="flex items-center justify-between pb-3 border-b border-border">
                <div className="flex items-center gap-2.5">
                  <div className="w-10 h-10 rounded-xl bg-indigo-500/10 border border-indigo-500/20 flex items-center justify-center text-indigo-600 font-bold text-base">
                    👤
                  </div>
                  <div>
                    <h4 className="font-display font-black text-sm text-foreground leading-tight">{employee.full_name}</h4>
                    <p className="text-[10px] font-bold text-slate-500 uppercase tracking-wider mt-0.5">
                      {employee.role || 'Staf Lapangan'} {employee.phone ? `· ${employee.phone}` : ''}
                    </p>
                  </div>
                </div>
                <div className="text-right">
                  <span className={cn(
                    "text-xs font-black font-mono px-2.5 py-1 rounded-lg border",
                    totalPcs > 0
                      ? "bg-indigo-500/10 text-indigo-700 dark:text-indigo-300 border-indigo-500/25"
                      : "bg-slate-100 dark:bg-slate-800 text-slate-400 border-slate-200 dark:border-slate-700"
                  )}>
                    {fmt(totalPcs)} pcs dibawa
                  </span>
                </div>
              </div>

              {/* Items bawaan pegawai */}
              <div className="py-3 space-y-2 max-h-72 overflow-y-auto pr-1">
                {items.length === 0 ? (
                  <div className="text-center py-6 text-slate-400 text-xs italic">
                    {employee.full_name} saat ini belum membawa stok barang untuk kanvas/keliling.
                  </div>
                ) : (
                  items.map((it, idx) => (
                    <div key={idx} className="flex items-center justify-between text-xs py-1.5 px-2.5 rounded-lg bg-slate-50 dark:bg-slate-900/40 border border-slate-100 dark:border-slate-800">
                      <div className="min-w-0 pr-2">
                        <p className="font-semibold text-foreground truncate">{it.product_name}</p>
                        <p className="text-[10px] text-slate-400">Jual: Rp {fmt(it.sellPrice)} / {it.unit}</p>
                      </div>
                      <div className="flex items-center gap-2 shrink-0">
                        <span className="font-black font-mono text-indigo-700 dark:text-indigo-300">
                          {fmt(it.quantity)} {it.unit}
                        </span>
                        <button
                          type="button"
                          onClick={() => onOpenHandover({ id: it.product_id, product_name: it.product_name, unit: it.unit }, employee.id, 'return_to_warehouse')}
                          className="px-2 py-0.5 rounded text-[10px] font-extrabold bg-rose-500/10 text-rose-600 hover:bg-rose-500/20 border border-rose-500/20 cursor-pointer"
                          title="Kembalikan sisa ke Gudang"
                        >
                          ↩ Retur
                        </button>
                      </div>
                    </div>
                  ))
                )}
              </div>
            </div>

            <div className="pt-3 border-t border-border flex items-center justify-between text-xs">
              <span className="text-slate-500">
                Nilai Jual: <strong className="text-foreground">Rp {fmt(totalRetail)}</strong>
              </span>
              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={() => onOpenHandover(null, employee.id, 'handover_to_staff')}
                  className="flex items-center gap-1 font-bold text-indigo-600 hover:underline cursor-pointer"
                >
                  <Plus size={12} />
                  <span>Beri Stok</span>
                </button>
                {totalPcs > 0 && (
                  <button
                    type="button"
                    onClick={() => onOpenHandover(null, employee.id, 'return_to_warehouse')}
                    className="flex items-center gap-1 font-bold text-rose-600 hover:underline cursor-pointer ml-2"
                  >
                    <RotateCcw size={12} />
                    <span>Tarik Semua</span>
                  </button>
                )}
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  )
}

// ── Tab: Riwayat Masuk & Combine ──────────────────────────────────────────────

function RiwayatMasuk({ batches = [], packagingLogs = [], isLoading, isError, error, refetch }) {
  const { data: returnsList = [] } = useSembakoReturns()

  if (isLoading) return <LoadingRow />
  if (isError) return <SembakoErrorState error={error} onRetry={refetch} />

  const returEntries = returnsList.map(r => ({
    id: `retur-${r.id}`,
    entry_type: 'return',
    product_name: r.product_name,
    qty_masuk: r.quantity,
    unit: r.unit,
    buy_price: (r.total_amount || 0) / (r.quantity || 1),
    created_at: r.created_at,
    party_name: r.party_name,
    status: r.status,
    raw_return: r
  }))

  const pkgEntries = packagingLogs.map(l => ({
    id: `pkg-${l.id}`,
    entry_type: 'combine',
    product_name: l.product_name,
    qty_masuk: l.output_qty,
    unit: l.unit || 'pcs',
    buy_price: l.cogs_per_unit || 0,
    created_at: l.created_at,
    pack_number: l.pack_number,
    materials_deducted: l.materials_deducted,
    created_by: l.created_by,
    notes: l.notes
  }))

  const filteredBatches = batches.filter(b => !b.batch_code?.startsWith('BTC-RET') && !b.notes?.includes('Retur'))

  const combined = [
    ...filteredBatches.map(b => ({
      ...b,
      entry_type: 'batch',
      product_name: b.sembako_products?.product_name || '-',
      unit: b.sembako_products?.unit || 'pcs'
    })),
    ...returEntries,
    ...pkgEntries
  ].sort((a, b) => new Date(b.created_at || b.date_received || b.purchase_date) - new Date(a.created_at || a.date_received || a.purchase_date))

  if (combined.length === 0) return <EmptyState label="Belum ada riwayat stok masuk & combine" sub="Stok bertambah saat combine kemasan, pembelian pabrik, atau retur toko dicatat" />

  return (
    <div className="space-y-2.5">
      {combined.map(item => {
        if (item.entry_type === 'combine') {
          return (
            <div key={item.id} className="p-3 sm:p-3.5 rounded-xl border bg-amber-500/5 border-amber-500/30 flex justify-between items-start gap-3">
              <div className="flex-1 min-w-0 pr-2">
                <div className="flex items-center gap-2 mb-1 flex-wrap">
                  <span className="font-display font-bold text-sm text-foreground">{item.product_name}</span>
                  <span className="text-[10px] font-black bg-amber-500/20 text-amber-700 dark:text-amber-400 border border-amber-500/40 px-2 py-0.5 rounded-full uppercase tracking-wider flex items-center gap-1">
                    <Zap size={10} className="fill-current" /> RACIK KEMASAN / COMBINE
                  </span>
                </div>
                <div className="text-xs text-slate-500 font-mono font-bold">{item.pack_number}</div>
                <div className="text-xs text-slate-600 dark:text-slate-400 mt-1">
                  Bahan Terpakai: <span className="font-medium text-slate-700 dark:text-slate-300">
                    {Array.isArray(item.materials_deducted)
                      ? item.materials_deducted.map(m => `${m.material_name}: ${m.deduct_qty} ${m.unit}`).join(' · ')
                      : (item.notes || 'Bahan baku terpotong otomatis')}
                  </span>
                </div>
                <div className="text-[11px] text-slate-400 mt-1">
                  Tgl: {fmtDate(item.created_at)} {item.created_by ? `· Operator: ${item.created_by}` : ''}
                </div>
              </div>
              <div className="text-right shrink-0">
                <div className="font-display font-black text-sm text-emerald-600 dark:text-emerald-400">
                  +{fmt(item.qty_masuk)} {item.unit}
                </div>
                <div className="text-xs text-slate-500 font-medium">HPP: Rp {fmt(item.buy_price)}</div>
                <div className="text-[10px] font-bold text-emerald-600 dark:text-emerald-400 mt-1">✓ Masuk Gudang</div>
              </div>
            </div>
          )
        }

        if (item.entry_type === 'return') {
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
  const tabsList = useMemo(() => {
    const list = [
      '📦 Produk Jadi (Ready Stock)',
      '🌾 Bahan Baku & Kemasan',
      '👥 Pemegang Stok (Reyhan & Tim)',
      '📥 Riwayat Masuk & Combine',
      '📤 Riwayat Keluar',
      '🔄 Retur Gudang',
    ]
    if (showAudit) list.push('📜 Log Perubahan')
    return list
  }, [showAudit])

  const location = useLocation()
  const navigate = useNavigate()
  const [searchParams] = useSearchParams()
  const isDesktop = useMediaQuery('(min-width: 1024px)')
  const { setSidebarOpen = () => window.dispatchEvent(new Event('toggleMobileSidebar')) } = useOutletContext() || {}
  const preProductId = searchParams.get('product') || null

  const getModulePath = useCallback((subPath) => {
    const isBroker = location.pathname.includes('/broker/')
    const base = isBroker ? location.pathname.split('/gudang')[0] : ''
    return `${base}${subPath}`
  }, [location.pathname])

  const { data: products = [], isLoading: productsLoading, isError: productsIsError, error: productsError, refetch: productsRefetch } = useSembakoProducts()
  const { data: suppliers = [], isError: supErr, error: supError, refetch: supRefetch } = useSembakoSuppliers()
  const { data: allBatches = [], isLoading: batchesLoading, isError: batchesIsError, error: batchesError, refetch: batchesRefetch } = useSembakoAllBatches()
  const { data: sales = [], isLoading: salesLoading } = useSembakoSales()
  const { data: rawMaterials = [], isLoading: rawLoading } = useSembakoRawMaterials()
  const { data: custodyList = [], isLoading: custodyLoading } = useSembakoStockCustody()
  const { data: packagingLogs = [], isLoading: pkgLoading } = useSembakoPackagingLogs()
  const { data: employees = [] } = useSembakoEmployees()

  const [activeTab, setActiveTab] = useState(0)
  const [importCsvOpen, setImportCsvOpen] = useState(false)

  // Meja Combine & Serah Terima Modals
  const [combineModalOpen, setCombineModalOpen] = useState(false)
  const [combineProductId, setCombineProductId] = useState(null)

  const [handoverModalOpen, setHandoverModalOpen] = useState(false)
  const [handoverMode, setHandoverMode] = useState('handover_to_staff') // 'handover_to_staff' | 'return_to_warehouse'
  const [handoverEmployeeId, setHandoverEmployeeId] = useState(null)
  const [handoverProductId, setHandoverProductId] = useState(null)

  const handleOpenCombine = (prod = null) => {
    setCombineProductId(prod?.id || null)
    setCombineModalOpen(true)
  }

  const handleOpenHandover = (prod = null, empId = null, mode = 'handover_to_staff') => {
    setHandoverProductId(prod?.id || null)
    setHandoverEmployeeId(empId || null)
    setHandoverMode(mode)
    setHandoverModalOpen(true)
  }

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
    // 1. Nilai Bahan Baku Mentah & Kemasan
    const rawValuation = rawMaterials.reduce((sum, r) => {
      return sum + ((Number(r.current_stock) || 0) * (Number(r.unit_cost) || 0))
    }, 0)

    // 2. Nilai Produk Jadi Fisik yang sudah di-Combine di Gudang Utama
    const finishedGoodsValuation = products.filter(p => p.is_active && !p.is_deleted).reduce((sum, p) => {
      const cRow = custodyList.find(c => c.holder_type === 'warehouse' && c.product_id === p.id)
      const whQty = cRow ? Number(cRow.quantity || 0) : 0
      const hpp = calculateBomProductHpp(p, rawMaterials) || p.avg_buy_price || 0
      return sum + (whQty * hpp)
    }, 0)

    // 3. Nilai Batch Standalone (jika ada)
    const standaloneBatchValuation = allBatches.reduce((sum, b) => {
      if (b.qty_sisa > 0 && !b.is_deleted) {
        return sum + (Number(b.qty_sisa) * Number(b.buy_price || 0))
      }
      return sum
    }, 0)

    return rawValuation + finishedGoodsValuation + standaloneBatchValuation
  }, [rawMaterials, allBatches, products, custodyList])

  const lowStockCount = useMemo(() => {
    const lowProds = products.filter(p => p.is_active && !p.is_deleted && p.min_stock_alert > 0 && p.current_stock > 0 && p.current_stock <= p.min_stock_alert).length
    const lowRaws = rawMaterials.filter(r => r.min_stock_alert > 0 && r.current_stock <= r.min_stock_alert).length
    return lowProds + lowRaws
  }, [products, rawMaterials])

  const totalWhPcs = useMemo(() => {
    return products.filter(p => p.is_active && !p.is_deleted).reduce((sum, p) => {
      const cRow = custodyList.find(c => c.holder_type === 'warehouse' && c.product_id === p.id)
      return sum + (cRow ? Number(cRow.quantity || 0) : 0)
    }, 0)
  }, [products, custodyList])

  const totalStaffPcs = useMemo(() => {
    return custodyList.filter(c => c.holder_type === 'employee').reduce((sum, c) => sum + Number(c.quantity || 0), 0)
  }, [custodyList])

  const summaryItems = [
    { label: 'Nilai Modal Gudang (Fisik)', value: totalStokNilai, isCurrency: true, color: 'amber' },
    { label: 'Produk Ready di Gudang', value: `${fmt(totalWhPcs)} pcs`, color: 'emerald' },
    { label: 'Stok Dibawa Tim / Kanvas', value: `${fmt(totalStaffPcs)} pcs`, color: 'indigo' },
    { label: 'Bahan Baku & Kemasan', value: `${rawMaterials.length} jenis` },
    { label: 'Stok Menipis', value: lowStockCount > 0 ? `${lowStockCount} item` : 'Stok Aman', color: lowStockCount > 0 ? 'red' : 'green' },
  ]

  return (
    <div className="min-h-screen bg-background pb-[max(140px,calc(110px+env(safe-area-inset-bottom,24px)))] text-left">
      {!isDesktop && <BrokerMobileHeader title="Gudang" onMenuClick={() => setSidebarOpen(true)} />}

      <div className="mx-auto max-w-7xl">
        <SembakoPageHeader
          title="Gudang"
          subtitle="Manajemen Stok Fisik, Meja Combine, & Pemegang Stok Tim"
          isDesktop={isDesktop}
          actionButton={
            <div className="flex items-center gap-2 flex-wrap">
              <button
                onClick={() => handleOpenCombine(null)}
                className="flex items-center gap-1.5 px-3.5 h-10 rounded-xl font-black text-xs bg-gradient-to-r from-amber-500 to-orange-500 hover:from-amber-600 hover:to-orange-600 text-white transition-all cursor-pointer shadow-md shadow-amber-500/20 active:scale-95 shrink-0"
              >
                <Zap size={16} className="fill-white" />
                <span>⚡ Meja Combine Produk</span>
              </button>
              <button
                onClick={() => handleOpenHandover(null, null, 'handover_to_staff')}
                className="flex items-center gap-1.5 px-3.5 h-10 rounded-xl font-bold text-xs bg-indigo-600 hover:bg-indigo-500 text-white transition-all cursor-pointer shadow-md shadow-indigo-600/20 active:scale-95 shrink-0"
              >
                <Truck size={16} />
                <span>🚚 Serah Terima Stok</span>
              </button>
              <button
                onClick={() => navigate(getModulePath('/produk?tab=bahan_baku'))}
                className="flex items-center gap-1.5 px-3 h-10 rounded-xl font-bold text-xs bg-card border border-border/60 hover:bg-muted text-foreground transition-all cursor-pointer shrink-0"
              >
                <Layers size={15} className="text-slate-600" />
                <span className="hidden sm:inline">Bahan Baku</span>
              </button>
              <button
                onClick={() => setImportCsvOpen(true)}
                className="flex items-center gap-1 px-2.5 h-10 rounded-xl font-bold text-xs bg-card border border-border/60 hover:bg-muted text-foreground transition-all cursor-pointer shrink-0"
                title="Import CSV"
              >
                <FileSpreadsheet size={15} className="text-slate-600" />
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
            productsLoading || batchesLoading || salesLoading || rawLoading || custodyLoading
              ? <ProductSkeleton />
              : productsIsError || batchesIsError || supErr
                ? <SembakoErrorState error={productsError || batchesError || supError} onRetry={() => { productsRefetch(); batchesRefetch(); supRefetch(); }} />
                : <StokSaatIni
                  products={products}
                  allBatches={allBatches}
                  sales={sales}
                  rawMaterials={rawMaterials}
                  custodyList={custodyList}
                  employees={employees}
                  onShowHistory={p => { setHistoryProduct(p); setShowHistorySheet(true) }}
                  onOpenCombine={handleOpenCombine}
                  onOpenHandover={handleOpenHandover}
                  navigate={navigate}
                />
          )}
          {activeTab === 1 && (
            <BahanBakuKemasanTab
              rawMaterials={rawMaterials}
              onOpenCombine={handleOpenCombine}
              navigate={navigate}
            />
          )}
          {activeTab === 2 && (
            <PemegangStokTab
              employees={employees}
              products={products}
              custodyList={custodyList}
              onOpenHandover={handleOpenHandover}
            />
          )}
          {activeTab === 3 && (
            <RiwayatMasuk
              batches={allBatches}
              packagingLogs={packagingLogs}
              isLoading={batchesLoading || pkgLoading}
              isError={batchesIsError}
              error={batchesError}
              refetch={() => { batchesRefetch(); }}
            />
          )}
          {activeTab === 4 && <RiwayatKeluar />}
          {activeTab === 5 && <ReturGudangTab />}
          {activeTab === 6 && <AuditLogTab />}
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

      {/* Modal Meja Combine Produk (Game Crafting Style) */}
      <SembakoCombineStudioModal
        open={combineModalOpen}
        onOpenChange={setCombineModalOpen}
        preselectedProductId={combineProductId}
      />

      {/* Modal Serah Terima & Bawa Stok (Reyhan & Tim) */}
      <SembakoStockHandoverModal
        open={handoverModalOpen}
        onOpenChange={setHandoverModalOpen}
        defaultMode={handoverMode}
        preselectedEmployeeId={handoverEmployeeId}
        preselectedProductId={handoverProductId}
      />

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
  const { data: packagingLogs = [], isLoading: pLoad, refetch: pRefetch } = useSembakoPackagingLogs()
  const { data: stockTransfers = [], isLoading: tLoad, refetch: tRefetch } = useSembakoStockTransfers()

  const isError = bErr || sErr
  const error = bError || sError
  const isLoading = bLoad || sLoad || rLoad || pLoad || tLoad
  const refetch = () => { bRefetch(); sRefetch(); pRefetch?.(); tRefetch?.() }

  const movements = useMemo(() => {
    if (!product) return []

    const logs = []

    // 1. Stock In from Meja Combine / Packaging Logs (Hasil Racik & Kemas)
    packagingLogs
      .filter(p => p.product_id === product.id)
      .forEach(p => {
        logs.push({
          id: `pack-${p.id}`,
          date: p.created_at,
          type: 'COMBINE',
          qty: Number(p.output_qty || 0),
          ref: p.pack_number || 'COMBINE',
          notes: p.notes || 'Hasil Meja Combine Produk',
          color: 'text-emerald-500'
        })
      })

    // 2. Stock Transfers (Handover ke staf: -qty, Return dari staf ke gudang: +qty)
    stockTransfers
      .filter(t => t.product_id === product.id)
      .forEach(t => {
        const isHandover = t.transfer_type === 'handover_to_staff'
        logs.push({
          id: `trf-${t.id}`,
          date: t.created_at,
          type: isHandover ? 'BAWA' : 'KEMBALI',
          qty: isHandover ? -Number(t.quantity || 0) : Number(t.quantity || 0),
          ref: t.transfer_number || (isHandover ? 'SERAH TERIMA' : 'PENGEMBALIAN'),
          notes: isHandover ? `Dibawa oleh ${t.employee_name}` : `Dikembalikan oleh ${t.employee_name}`,
          color: isHandover ? 'text-indigo-400' : 'text-emerald-400'
        })
      })

    // 3. Stock In (Batches, excluding BTC-RET)
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

    // 4. Stock In from Returns (completed)
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

    // 5. Stock Out (Sales & Adjustments)
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
  }, [product, batches, stockOuts, returnsList, packagingLogs, stockTransfers])

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

