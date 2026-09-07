import React, { useRef } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { Printer, X, FileText, ShieldCheck } from 'lucide-react'
import { useAuth } from '@/lib/hooks/useAuth'
import { formatIDR } from '@/lib/format'
import { useBackHandler } from '@/lib/hooks/useBackHandler'

export default function FinancialReportPdfModal({ open, onClose, reportType = 'business_result', data, startDate, endDate }) {
  useBackHandler(open, onClose)
  const { tenant, profile } = useAuth()
  const printRef = useRef(null)

  if (!open || !data) return null

  const summary = data?.summary || {}
  const sales = data?.sales || []
  const byProduct = data?.byProduct || {}
  const byCustomer = data?.byCustomer || {}
  const rawExpenses = data?.expenses || []
  const supplierPayments = data?.supplierPayments || []

  // Ensure OPEX categories are properly gathered
  const opexCategories = { ...(data?.expenseByCategory || data?.opexByCategory || {}) }
  if (Object.keys(opexCategories).length === 0 && rawExpenses.length > 0) {
    rawExpenses.forEach(e => {
      const cat = e.category || 'Lainnya'
      opexCategories[cat] = (opexCategories[cat] || 0) + (Number(e.amount) || 0)
    })
  }

  // Calculate total OPEX robustly from totalExpenses, totalOpex, or categoriesSum
  const categoriesSum = Object.values(opexCategories).reduce((s, v) => s + (Number(v) || 0), 0)
  const rawTotalOpex = Number(summary.totalOpex || summary.totalExpenses || 0)
  const displayTotalOpex = Math.max(rawTotalOpex, categoriesSum)

  const businessName = tenant?.name || profile?.full_name || 'Laporan Finansial & Bisnis'
  const businessAddress = tenant?.address || 'Jl. Raya Utama No. 1'
  const printDate = new Date().toLocaleDateString('id-ID', { day: '2-digit', month: 'long', year: 'numeric' })
  const isBusinessResult = reportType === 'business_result'

  // Derived Cash Flow figures for robust display
  const openingCash = (summary.openingCashOnHand || summary.startingCashOnHand || 0) + (summary.openingBankBalance || summary.startingBankBalance || 0)
  const cashIn = summary.cashInPeriod || ((summary.cashInPeriodTunai || 0) + (summary.cashInPeriodTransfer || 0))
  const cashOut = summary.cashOutPeriod || (
    (summary.supplierOutPeriodTunai || 0) +
    (summary.supplierOutPeriodTransfer || 0) +
    (summary.payrollOutPeriodTunai || 0) +
    (summary.priveOutPeriodTunai || 0) +
    (summary.regularExpensesOutPeriodTunai || 0) +
    (summary.deliveryOutPeriodTunai || summary.totalDeliveryCost || 0)
  )
  const endingCash = (summary.endingCashOnHand || 0) + (summary.endingBankBalance || 0)

  // Safe percentage helper to avoid NaN%
  const calcPct = (amount, total) => {
    const base = total !== undefined ? Number(total) : Number(summary.totalRevenue || summary.grossRevenue || 0)
    if (!base || base === 0 || isNaN(base)) return '0.0%'
    const val = (Number(amount || 0) / base) * 100
    return isNaN(val) ? '0.0%' : `${val.toFixed(1)}%`
  }

  const formatStatus = (status) => {
    if (status === 'lunas') return 'LUNAS'
    if (status === 'sebagian') return 'SEBAGIAN'
    return 'BELUM LUNAS'
  }

  const formatDateOnly = (dStr) => {
    if (!dStr) return '-'
    return String(dStr).slice(0, 10)
  }

  return (
    <AnimatePresence>
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        className="fixed inset-0 z-[9999] bg-black/85 backdrop-blur-md flex items-center justify-center p-1.5 sm:p-4 overflow-y-auto"
        onClick={onClose}
      >
        <motion.div
          initial={{ scale: 0.96, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          exit={{ scale: 0.96, opacity: 0 }}
          className="bg-[#0C1319] border border-white/15 rounded-2xl w-full max-w-5xl max-h-[96vh] sm:max-h-[92vh] flex flex-col overflow-hidden shadow-2xl my-auto"
          onClick={e => e.stopPropagation()}
        >
          {/* ── Top Bar Controls (Clean, High Contrast & Responsive) ── */}
          <div className="flex items-center justify-between px-3.5 py-3 sm:px-6 sm:py-3.5 border-b border-slate-800 bg-[#0B1118] print:hidden shrink-0">
            <div className="flex items-center gap-2.5 min-w-0 pr-2">
              <div
                className="w-8 h-8 sm:w-9 sm:h-9 rounded-xl flex items-center justify-center shrink-0"
                style={{ backgroundColor: 'rgba(59, 130, 246, 0.15)', border: '1px solid rgba(59, 130, 246, 0.3)', color: '#60A5FA' }}
              >
                <FileText size={16} />
              </div>
              <div className="min-w-0">
                <h3 className="font-display font-black text-xs sm:text-sm m-0 uppercase tracking-wide truncate" style={{ color: '#FFFFFF' }}>
                  {isBusinessResult ? 'PDF Laporan Hasil Bisnis (P&L)' : 'PDF Laporan Arus Kas (Cash Flow)'}
                </h3>
                <p className="text-[10px] sm:text-[11px] m-0 truncate" style={{ color: '#94A3B8' }}>
                  Periode: {formatDateOnly(startDate)} s.d. {formatDateOnly(endDate)}
                </p>
              </div>
            </div>

            <div className="flex items-center gap-2 shrink-0">
              <button
                type="button"
                onClick={() => window.print()}
                className="flex items-center gap-1.5 px-3 sm:px-4 h-8 sm:h-9 rounded-xl font-bold text-xs bg-emerald-600 hover:bg-emerald-500 text-white transition-all cursor-pointer shadow-md active:scale-95 border-0 shrink-0"
                style={{ backgroundColor: '#059669', color: '#FFFFFF' }}
              >
                <Printer size={14} />
                <span className="hidden xs:inline">Cetak / Save PDF</span>
                <span className="xs:hidden">Cetak</span>
              </button>
              <button
                type="button"
                onClick={onClose}
                className="w-8 h-8 rounded-xl bg-white/10 hover:bg-white/20 flex items-center justify-center text-slate-300 hover:text-white transition-colors border-0 cursor-pointer shrink-0"
              >
                <X size={16} />
              </button>
            </div>
          </div>

          {/* ── Document Preview Box ── */}
          <div className="flex-1 overflow-y-auto overflow-x-auto p-2 sm:p-6 md:p-8 bg-[#18222B] flex justify-center items-start">
            {/* Printable A4 Container */}
            <div
              ref={printRef}
              id="printable-financial-report"
              className="w-full max-w-[210mm] bg-white text-slate-900 p-4 sm:p-8 md:p-10 shadow-2xl rounded-sm text-left font-sans text-xs leading-normal font-normal min-h-[297mm] h-auto my-auto sm:my-0 mb-8 overflow-hidden"
              style={{ colorScheme: 'light', backgroundColor: '#FFFFFF', color: '#0F172A' }}
            >
              {/* CSS Rule for Multi-Page Native Print */}
              <style>{`
                @media print {
                  body * {
                    visibility: hidden !important;
                  }
                  html, body, #root, [class*="fixed"], [class*="overflow-"] {
                    overflow: visible !important;
                    height: auto !important;
                    position: static !important;
                    background: white !important;
                  }
                  #printable-financial-report, #printable-financial-report * {
                    visibility: visible !important;
                  }
                  #printable-financial-report {
                    position: relative !important;
                    left: 0 !important;
                    top: 0 !important;
                    width: 100% !important;
                    max-width: none !important;
                    margin: 0 !important;
                    padding: 8mm 12mm !important;
                    box-shadow: none !important;
                    border-radius: 0 !important;
                    background: white !important;
                    color: black !important;
                    height: auto !important;
                    min-height: auto !important;
                    overflow: visible !important;
                  }
                  tr, table {
                    page-break-inside: auto !important;
                  }
                  tr {
                    page-break-inside: avoid !important;
                    break-inside: avoid !important;
                  }
                  h1, h2, h3 {
                    page-break-after: avoid !important;
                    break-after: avoid !important;
                  }
                  @page {
                    size: A4 portrait;
                    margin: 10mm 10mm 10mm 10mm;
                  }
                }
              `}</style>

              {/* ── Kop Dokumen (Clean & High Contrast) ──────────────────── */}
              <div className="flex flex-col sm:flex-row items-start justify-between gap-3 border-b-2 border-slate-900 pb-3 sm:pb-4 mb-4 sm:mb-6">
                <div>
                  <h1 className="font-serif text-base sm:text-xl font-bold uppercase tracking-wide m-0" style={{ color: '#0F172A' }}>
                    {businessName}
                  </h1>
                  <p className="text-[10px] sm:text-[11px] m-0 mt-0.5 sm:mt-1" style={{ color: '#475569' }}>
                    {businessAddress}
                  </p>
                  <p className="text-[9px] sm:text-[10px] m-0 mt-0.5 flex items-center gap-1" style={{ color: '#64748B' }}>
                    <ShieldCheck size={12} className="text-emerald-600 inline shrink-0" /> Dokumen Audit Keuangan Keagenan Resmi
                  </p>
                </div>
                <div className="text-left sm:text-right shrink-0">
                  <div
                    className="inline-flex items-center gap-1.5 font-black text-[10px] sm:text-[11px] uppercase tracking-wider px-2.5 py-1 rounded-md border mb-1.5"
                    style={{ backgroundColor: '#F8FAFC', color: '#0F172A', borderColor: '#CBD5E1' }}
                  >
                    <FileText size={12} style={{ color: '#2563EB' }} />
                    <span style={{ color: '#0F172A', fontWeight: 800 }}>
                      {isBusinessResult ? 'LAPORAN HASIL BISNIS (P&L)' : 'LAPORAN ARUS KAS (CASH FLOW)'}
                    </span>
                  </div>
                  <p className="text-[10px] sm:text-[11px] font-semibold m-0" style={{ color: '#334155' }}>
                    Periode: <span className="font-bold" style={{ color: '#0F172A' }}>{formatDateOnly(startDate)} s.d. {formatDateOnly(endDate)}</span>
                  </p>
                  <p className="text-[9px] sm:text-[10px] m-0 mt-0.5" style={{ color: '#64748B' }}>
                    Tanggal Cetak: {printDate}
                  </p>
                </div>
              </div>

              {/* ── REPORT CONTENT TYPE 1: BUSINESS RESULT (P&L) ──────────── */}
              {isBusinessResult ? (
                <div className="space-y-5 sm:space-y-6">
                  {/* Summary Ringkasan Kunci (4 KPI Cards) */}
                  <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 sm:gap-3 p-2.5 sm:p-4 rounded-lg border" style={{ backgroundColor: '#F8FAFC', borderColor: '#E2E8F0' }}>
                    <div className="space-y-0.5 sm:space-y-1">
                      <p className="text-[9px] sm:text-[10px] font-bold uppercase tracking-wider m-0" style={{ color: '#64748B' }}>Revenue (Akrual)</p>
                      <p className="text-xs sm:text-sm font-bold m-0 font-mono truncate" style={{ color: '#B45309' }}>{formatIDR(summary.totalRevenue || 0)}</p>
                    </div>
                    <div className="space-y-0.5 sm:space-y-1">
                      <p className="text-[9px] sm:text-[10px] font-bold uppercase tracking-wider m-0" style={{ color: '#64748B' }}>Net Profit ({summary.netMarginPct || calcPct(summary.netProfit)}%)</p>
                      <p className="text-xs sm:text-sm font-bold m-0 font-mono truncate" style={{ color: '#047857' }}>{formatIDR(summary.netProfit || 0)}</p>
                    </div>
                    <div className="space-y-0.5 sm:space-y-1">
                      <p className="text-[9px] sm:text-[10px] font-bold uppercase tracking-wider m-0" style={{ color: '#64748B' }}>Arus Kas Bersih</p>
                      <p className="text-xs sm:text-sm font-bold m-0 font-mono truncate" style={{ color: summary.netCashFlowPeriod >= 0 ? '#047857' : '#BE123C' }}>
                        {formatIDR(summary.netCashFlowPeriod || 0)}
                      </p>
                    </div>
                    <div className="space-y-0.5 sm:space-y-1">
                      <p className="text-[9px] sm:text-[10px] font-bold uppercase tracking-wider m-0" style={{ color: '#64748B' }}>Laba Terkonversi Kas</p>
                      <p className="text-xs sm:text-sm font-bold m-0 font-mono truncate" style={{ color: '#047857' }}>{formatIDR(summary.cashMarginEstimate || summary.realizedNetProfit || 0)}</p>
                    </div>
                  </div>

                  {/* 1. Waterfall P&L Table */}
                  <div>
                    <h3 className="font-bold text-[11px] sm:text-xs uppercase tracking-wider mb-2 border-b border-slate-300 pb-1" style={{ color: '#0F172A' }}>
                      1. Perhitungan Laba Rugi Laporan Bisnis (Profit & Loss Statement)
                    </h3>
                    <div className="overflow-x-auto w-full">
                      <table className="w-full text-left border-collapse text-[10px] sm:text-xs">
                        <thead className="border-b border-slate-300 font-bold" style={{ backgroundColor: '#F1F5F9', color: '#334155' }}>
                          <tr>
                            <th className="p-2">Komponen Pos Keuangan</th>
                            <th className="p-2 text-right">Nilai Nominal (Rp)</th>
                            <th className="p-2 text-right">% dari Omzet</th>
                          </tr>
                        </thead>
                        <tbody className="divide-y divide-slate-200 font-mono">
                          <tr>
                            <td className="p-2 font-bold font-sans" style={{ color: '#0F172A' }}>+ Penjualan Kotor (Gross)</td>
                            <td className="p-2 text-right font-bold whitespace-nowrap" style={{ color: '#0F172A' }}>{formatIDR(summary.totalGrossRevenue || summary.grossRevenue || summary.totalRevenue || 0)}</td>
                            <td className="p-2 text-right font-semibold" style={{ color: '#334155' }}>100.0%</td>
                          </tr>
                          <tr>
                            <td className="p-2 pl-4 font-sans" style={{ color: '#475569' }}>− Retur Penjualan (Returns)</td>
                            <td className="p-2 text-right whitespace-nowrap" style={{ color: '#BE123C' }}>({formatIDR(summary.totalReturns || summary.totalReturnsAmount || 0)})</td>
                            <td className="p-2 text-right" style={{ color: '#475569' }}>{calcPct(summary.totalReturns || summary.totalReturnsAmount || 0)}</td>
                          </tr>
                          <tr style={{ backgroundColor: '#F8FAFC', fontWeight: 700 }}>
                            <td className="p-2 font-sans" style={{ color: '#0F172A' }}>= Penjualan Bersih (Net Sales)</td>
                            <td className="p-2 text-right whitespace-nowrap" style={{ color: '#0F172A' }}>{formatIDR(summary.netMerchandiseRevenue ?? ((summary.totalGrossRevenue || summary.totalRevenue || 0) - (summary.totalReturns || 0)))}</td>
                            <td className="p-2 text-right" style={{ color: '#334155' }}>{calcPct(summary.netMerchandiseRevenue ?? ((summary.totalGrossRevenue || summary.totalRevenue || 0) - (summary.totalReturns || 0)))}</td>
                          </tr>
                          <tr>
                            <td className="p-2 pl-4 font-sans" style={{ color: '#475569' }}>− HPP (COGS FIFO)</td>
                            <td className="p-2 text-right whitespace-nowrap" style={{ color: '#475569' }}>({formatIDR(summary.totalCOGS || summary.cogs || 0)})</td>
                            <td className="p-2 text-right" style={{ color: '#475569' }}>{calcPct(summary.totalCOGS || summary.cogs || 0)}</td>
                          </tr>
                          <tr style={{ backgroundColor: '#ECFDF5', fontWeight: 700, color: '#064E3B' }}>
                            <td className="p-2 font-sans">= GROSS PROFIT (LABA KOTOR)</td>
                            <td className="p-2 text-right whitespace-nowrap">{formatIDR(summary.grossProfit || 0)}</td>
                            <td className="p-2 text-right">{summary.grossMarginPct || calcPct(summary.grossProfit)}%</td>
                          </tr>
                          <tr>
                            <td className="p-2 pl-4 font-sans" style={{ color: '#059669' }}>+ Pendapatan Ongkir / Pengiriman</td>
                            <td className="p-2 text-right whitespace-nowrap" style={{ color: '#059669' }}>{formatIDR(summary.totalDeliveryCost || summary.deliveryCost || 0)}</td>
                            <td className="p-2 text-right" style={{ color: '#059669' }}>{calcPct(summary.totalDeliveryCost || summary.deliveryCost || 0)}</td>
                          </tr>
                          <tr>
                            <td className="p-2 pl-4 font-sans" style={{ color: '#475569' }}>− Biaya Lain-lain</td>
                            <td className="p-2 text-right whitespace-nowrap" style={{ color: '#475569' }}>({formatIDR(summary.totalOtherCost || 0)})</td>
                            <td className="p-2 text-right" style={{ color: '#475569' }}>{calcPct(summary.totalOtherCost || 0)}</td>
                          </tr>
                          <tr>
                            <td className="p-2 pl-4 font-sans" style={{ color: '#475569' }}>− Biaya Operasional Toko & Gudang</td>
                            <td className="p-2 text-right whitespace-nowrap" style={{ color: '#475569' }}>({formatIDR(displayTotalOpex)})</td>
                            <td className="p-2 text-right" style={{ color: '#475569' }}>{calcPct(displayTotalOpex)}</td>
                          </tr>
                          <tr>
                            <td className="p-2 pl-4 font-sans" style={{ color: '#475569' }}>− Beban Gaji Karyawan</td>
                            <td className="p-2 text-right whitespace-nowrap" style={{ color: '#475569' }}>({formatIDR(summary.totalPayroll || 0)})</td>
                            <td className="p-2 text-right" style={{ color: '#475569' }}>{calcPct(summary.totalPayroll || 0)}</td>
                          </tr>
                          <tr style={{ backgroundColor: '#FEF3C7', fontWeight: 900, color: '#78350F', borderTop: '2px solid #0F172A', borderBottom: '2px solid #0F172A' }}>
                            <td className="p-2.5 font-sans">= NET PROFIT AKRUAL (LABA BERSIH)</td>
                            <td className="p-2.5 text-right whitespace-nowrap">{formatIDR(summary.netProfit || 0)}</td>
                            <td className="p-2.5 text-right">{summary.netMarginPct || calcPct(summary.netProfit)}%</td>
                          </tr>
                        </tbody>
                      </table>
                    </div>
                  </div>

                  {/* 2. Margin Per Produk */}
                  {Object.keys(byProduct).length > 0 && (
                    <div>
                      <h3 className="font-bold text-[11px] sm:text-xs uppercase tracking-wider mb-2 border-b border-slate-300 pb-1" style={{ color: '#0F172A' }}>
                        2. Breakdown Performa & Margin Per Produk
                      </h3>
                      <div className="overflow-x-auto w-full">
                        <table className="w-full text-left border-collapse text-[10px] sm:text-xs">
                          <thead className="border-b border-slate-300 font-bold" style={{ backgroundColor: '#F1F5F9', color: '#334155' }}>
                            <tr>
                              <th className="p-2">Nama Produk / Item</th>
                              <th className="p-2 text-center">Qty</th>
                              <th className="p-2 text-right">Revenue</th>
                              <th className="p-2 text-right">HPP</th>
                              <th className="p-2 text-right">Profit</th>
                              <th className="p-2 text-right">Margin %</th>
                            </tr>
                          </thead>
                          <tbody className="divide-y divide-slate-200 font-mono">
                            {Object.entries(byProduct).map(([pName, pData]) => {
                              const profit = pData.revenue - pData.cogs
                              const marginPct = pData.revenue > 0 ? ((profit / pData.revenue) * 100).toFixed(1) : '0.0'
                              return (
                                <tr key={pName}>
                                  <td className="p-2 font-semibold font-sans" style={{ color: '#0F172A' }}>{pName}</td>
                                  <td className="p-2 text-center whitespace-nowrap" style={{ color: '#475569' }}>{pData.qty} {pData.unit || 'pcs'}</td>
                                  <td className="p-2 text-right font-semibold whitespace-nowrap" style={{ color: '#0F172A' }}>{formatIDR(pData.revenue)}</td>
                                  <td className="p-2 text-right whitespace-nowrap" style={{ color: '#64748B' }}>{formatIDR(pData.cogs)}</td>
                                  <td className="p-2 text-right font-bold whitespace-nowrap" style={{ color: '#047857' }}>{formatIDR(profit)}</td>
                                  <td className="p-2 text-right font-bold whitespace-nowrap" style={{ color: '#334155' }}>{marginPct}%</td>
                                </tr>
                              )
                            })}
                          </tbody>
                        </table>
                      </div>
                    </div>
                  )}

                  {/* 3. Top Toko / Pelanggan */}
                  {Object.keys(byCustomer).length > 0 && (
                    <div>
                      <h3 className="font-bold text-[11px] sm:text-xs uppercase tracking-wider mb-2 border-b border-slate-300 pb-1" style={{ color: '#0F172A' }}>
                        3. Top Toko / Pelanggan Terbaik Periode Ini
                      </h3>
                      <div className="overflow-x-auto w-full">
                        <table className="w-full text-left border-collapse text-[10px] sm:text-xs">
                          <thead className="border-b border-slate-300 font-bold" style={{ backgroundColor: '#F1F5F9', color: '#334155' }}>
                            <tr>
                              <th className="p-2">Nama Toko / Pelanggan</th>
                              <th className="p-2 text-center">Jumlah Invoice</th>
                              <th className="p-2 text-right">Total Omzet (Rp)</th>
                              <th className="p-2 text-right">Total Profit (Rp)</th>
                            </tr>
                          </thead>
                          <tbody className="divide-y divide-slate-200 font-mono">
                            {Object.entries(byCustomer).map(([cName, cData]) => (
                              <tr key={cName}>
                                <td className="p-2 font-bold font-sans" style={{ color: '#0F172A' }}>{cName}</td>
                                <td className="p-2 text-center font-medium font-sans" style={{ color: '#475569' }}>{cData.count} invoice</td>
                                <td className="p-2 text-right font-semibold whitespace-nowrap" style={{ color: '#B45309' }}>{formatIDR(cData.revenue)}</td>
                                <td className="p-2 text-right font-bold whitespace-nowrap" style={{ color: '#047857' }}>{formatIDR(cData.profit)}</td>
                              </tr>
                            ))}
                          </tbody>
                        </table>
                      </div>
                    </div>
                  )}
                </div>
              ) : (
                /* ── REPORT CONTENT TYPE 2: CASH FLOW STATEMENT ───────────── */
                <div className="space-y-5 sm:space-y-6">
                  {/* Cash Summary Banner (Responsive 3 Columns) */}
                  <div className="grid grid-cols-3 gap-2 sm:gap-3 p-2.5 sm:p-4 rounded-lg border" style={{ backgroundColor: '#FFFBEB', borderColor: '#FDE68A' }}>
                    <div className="space-y-0.5 sm:space-y-1">
                      <p className="text-[8px] sm:text-[10px] font-bold uppercase tracking-wider m-0" style={{ color: '#78350F' }}>Saldo Kas Awal</p>
                      <p className="text-xs sm:text-sm font-bold m-0 font-mono truncate" style={{ color: '#0F172A' }}>{formatIDR(openingCash)}</p>
                    </div>
                    <div className="space-y-0.5 sm:space-y-1">
                      <p className="text-[8px] sm:text-[10px] font-bold uppercase tracking-wider m-0" style={{ color: '#78350F' }}>Net Arus Kas</p>
                      <p className="text-xs sm:text-sm font-bold m-0 font-mono truncate" style={{ color: (summary.netCashFlowPeriod ?? (cashIn - cashOut)) >= 0 ? '#047857' : '#BE123C' }}>
                        {formatIDR(summary.netCashFlowPeriod ?? (cashIn - cashOut))}
                      </p>
                    </div>
                    <div className="space-y-0.5 sm:space-y-1">
                      <p className="text-[8px] sm:text-[10px] font-bold uppercase tracking-wider m-0" style={{ color: '#78350F' }}>Saldo Kas Akhir</p>
                      <p className="text-xs sm:text-sm font-black m-0 font-mono truncate" style={{ color: '#92400E' }}>{formatIDR(endingCash)}</p>
                    </div>
                  </div>

                  {/* 1. Cash Flow Detailed Table */}
                  <div>
                    <h3 className="font-bold text-[11px] sm:text-xs uppercase tracking-wider mb-2 border-b border-slate-300 pb-1" style={{ color: '#0F172A' }}>
                      1. Rincian Arus Kas Lengkap (Cash Flow Statement)
                    </h3>
                    <div className="overflow-x-auto w-full">
                      <table className="w-full text-left border-collapse text-[10px] sm:text-xs font-mono">
                        <tbody className="divide-y divide-slate-200">
                          {/* Section A: Starting Cash */}
                          <tr style={{ backgroundColor: '#F1F5F9', fontWeight: 800, color: '#0F172A' }}>
                            <td className="p-2 font-sans">SALDO KAS AWAL PERIODE</td>
                            <td className="p-2 text-right whitespace-nowrap">{formatIDR(openingCash)}</td>
                          </tr>
                          <tr style={{ color: '#475569' }}>
                            <td className="p-1.5 pl-4 font-sans">· Saldo Kas Tunai Awal</td>
                            <td className="p-1.5 text-right whitespace-nowrap">{formatIDR(summary.openingCashOnHand || summary.cashTunaiAwal || 0)}</td>
                          </tr>
                          <tr style={{ color: '#475569' }}>
                            <td className="p-1.5 pl-4 font-sans">· Saldo Bank Awal</td>
                            <td className="p-1.5 text-right whitespace-nowrap">{formatIDR(summary.openingBankBalance || summary.cashBankAwal || 0)}</td>
                          </tr>

                          {/* Section B: Cash In */}
                          <tr style={{ backgroundColor: '#ECFDF5', fontWeight: 800, color: '#064E3B', borderTop: '2px solid #6EE7B7' }}>
                            <td className="p-2 font-sans">+ PENERIMAAN KAS (CASH IN)</td>
                            <td className="p-2 text-right whitespace-nowrap">{formatIDR(cashIn)}</td>
                          </tr>
                          <tr style={{ color: '#334155' }}>
                            <td className="p-1.5 pl-4 font-sans">· Penerimaan Pembayaran Tunai (Cash)</td>
                            <td className="p-1.5 text-right whitespace-nowrap">{formatIDR(summary.cashInPeriodTunai || 0)}</td>
                          </tr>
                          <tr style={{ color: '#334155' }}>
                            <td className="p-1.5 pl-4 font-sans">· Penerimaan Pelunasan Transfer Bank</td>
                            <td className="p-1.5 text-right whitespace-nowrap">{formatIDR(summary.cashInPeriodTransfer || 0)}</td>
                          </tr>

                          {/* Section C: Cash Out */}
                          <tr style={{ backgroundColor: '#FFF1F2', fontWeight: 800, color: '#881337', borderTop: '2px solid #FDA4AF' }}>
                            <td className="p-2 font-sans">− PENGELUARAN KAS (CASH OUT)</td>
                            <td className="p-2 text-right whitespace-nowrap">({formatIDR(cashOut)})</td>
                          </tr>
                          <tr style={{ color: '#334155' }}>
                            <td className="p-1.5 pl-4 font-sans">· Pembelian Stok Supplier (Tunai & Transfer)</td>
                            <td className="p-1.5 text-right whitespace-nowrap">({formatIDR((summary.supplierOutPeriodTunai || 0) + (summary.supplierOutPeriodTransfer || 0))})</td>
                          </tr>
                          <tr style={{ color: '#334155' }}>
                            <td className="p-1.5 pl-4 font-sans">· Biaya Pengiriman & Armada (Asumsi Tunai)</td>
                            <td className="p-1.5 text-right whitespace-nowrap">({formatIDR(summary.deliveryOutPeriodTunai || summary.totalDeliveryCost || 0)})</td>
                          </tr>
                          <tr style={{ color: '#334155' }}>
                            <td className="p-1.5 pl-4 font-sans">· Biaya Operasional Toko & Gudang</td>
                            <td className="p-1.5 text-right whitespace-nowrap">({formatIDR(summary.regularExpensesOutPeriodTunai || summary.cashOutOpex || displayTotalOpex)})</td>
                          </tr>
                          {(Number(summary.payrollOutPeriodTunai) > 0 || Number(summary.cashOutPayroll) > 0) && (
                            <tr style={{ color: '#334155' }}>
                              <td className="p-1.5 pl-4 font-sans">· Gaji Pegawai & Tim Management</td>
                              <td className="p-1.5 text-right whitespace-nowrap">({formatIDR(summary.payrollOutPeriodTunai || summary.cashOutPayroll)})</td>
                            </tr>
                          )}
                          {Number(summary.priveOutPeriodTunai) > 0 && (
                            <tr style={{ color: '#334155' }}>
                              <td className="p-1.5 pl-4 font-sans">· Penarikan Pemilik (Prive)</td>
                              <td className="p-1.5 text-right whitespace-nowrap">({formatIDR(summary.priveOutPeriodTunai)})</td>
                            </tr>
                          )}

                          {/* Section D: Ending Cash */}
                          <tr style={{ backgroundColor: '#FEF3C7', fontWeight: 900, color: '#78350F', borderTop: '2px solid #0F172A', borderBottom: '2px solid #0F172A' }}>
                            <td className="p-2.5 font-sans">= SALDO KAS AKHIR PERIODE</td>
                            <td className="p-2.5 text-right whitespace-nowrap">{formatIDR(endingCash)}</td>
                          </tr>
                          <tr style={{ backgroundColor: '#F8FAFC', color: '#334155', fontWeight: 600 }}>
                            <td className="p-1.5 pl-4 font-sans">· Saldo Kas Tunai Akhir (Cash on Hand)</td>
                            <td className="p-1.5 text-right whitespace-nowrap">{formatIDR(summary.endingCashOnHand || summary.cashTunaiAkhir || 0)}</td>
                          </tr>
                          <tr style={{ backgroundColor: '#F8FAFC', color: '#334155', fontWeight: 600 }}>
                            <td className="p-1.5 pl-4 font-sans">· Saldo Bank Akhir</td>
                            <td className="p-1.5 text-right whitespace-nowrap">{formatIDR(summary.endingBankBalance || summary.cashBankAkhir || 0)}</td>
                          </tr>
                        </tbody>
                      </table>
                    </div>
                  </div>
                </div>
              )}

              {/* ── Document Signatures ────────────────────────────────────── */}
              <div className="mt-8 sm:mt-12 pt-6 sm:pt-8 border-t border-slate-300 grid grid-cols-2 gap-4 sm:gap-8 text-center">
                <div>
                  <p className="text-[9px] sm:text-[10px] uppercase font-bold m-0 mb-8 sm:mb-12" style={{ color: '#64748B' }}>Dibuat Oleh (Finance / Kasir)</p>
                  <p className="font-bold underline m-0 text-[10px] sm:text-xs" style={{ color: '#0F172A' }}>{profile?.full_name || 'Staff Keuangan'}</p>
                  <p className="text-[9px] sm:text-[10px] m-0" style={{ color: '#64748B' }}>Tanda Tangan & Nama</p>
                </div>
                <div>
                  <p className="text-[9px] sm:text-[10px] uppercase font-bold m-0 mb-8 sm:mb-12" style={{ color: '#64748B' }}>Disetujui Oleh (Owner / Manager)</p>
                  <p className="font-bold underline m-0 text-[10px] sm:text-xs" style={{ color: '#0F172A' }}>Pemilik Bisnis</p>
                  <p className="text-[9px] sm:text-[10px] m-0" style={{ color: '#64748B' }}>Tanda Tangan & Cap</p>
                </div>
              </div>
            </div>
          </div>
        </motion.div>
      </motion.div>
    </AnimatePresence>
  )
}
