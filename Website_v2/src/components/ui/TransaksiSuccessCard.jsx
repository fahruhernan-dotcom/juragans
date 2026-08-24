import { motion, AnimatePresence } from 'framer-motion'
import { formatDate, formatIDR, formatEkor } from '@/lib/format'
import { Smartphone } from 'lucide-react'

// ─── Animated check circle ────────────────────────────────────────────────────

function CheckCircleAnimated() {
  return (
    <div className="w-20 h-20 mx-auto mb-5">
      <svg viewBox="0 0 80 80" fill="none" xmlns="http://www.w3.org/2000/svg" className="w-full h-full">
        {/* Background fill */}
        <motion.circle
          cx="40" cy="40" r="36"
          fill="rgba(16, 185, 129, 0.1)"
          initial={{ scale: 0, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          transition={{ duration: 0.3, ease: 'easeOut' }}
        />
        {/* Stroke circle */}
        <motion.circle
          cx="40" cy="40" r="36"
          stroke="#10B981"
          strokeWidth="2.5"
          strokeLinecap="round"
          fill="none"
          pathLength="1"
          initial={{ pathLength: 0, rotate: -90 }}
          animate={{ pathLength: 1, rotate: -90 }}
          style={{ originX: '50%', originY: '50%', rotate: -90 }}
          transition={{ duration: 0.5, ease: 'easeOut' }}
        />
        {/* Checkmark */}
        <motion.path
          d="M24 40 L35 51 L57 28"
          stroke="#34D399"
          strokeWidth="3.5"
          strokeLinecap="round"
          strokeLinejoin="round"
          fill="none"
          initial={{ pathLength: 0 }}
          animate={{ pathLength: 1 }}
          transition={{ duration: 0.4, delay: 0.3, ease: 'easeOut' }}
        />
      </svg>
    </div>
  )
}

// ─── Format helpers ───────────────────────────────────────────────────────────

function formatRp(num) {
  if (!num && num !== 0) return '—'
  return 'Rp ' + Number(num).toLocaleString('id-ID')
}

function formatKg(num) {
  if (!num && num !== 0) return '—'
  const n = Number(num)
  return n >= 1000 ? `${(n / 1000).toFixed(2)} ton` : `${n.toFixed(1)} kg`
}

const generateWAMessage = (data) => {
  if (!data) return ''
  
  const { farmName, rpaName, quantity, totalWeight, sellPrice, transactionDate, tenant } = data
  const dateStr = formatDate(transactionDate)
  const qty = formatEkor(quantity)
  const weight = formatKg(totalWeight)
  const total = formatIDR(sellPrice)
  
  let msg = `*STRUK PENJUALAN - ${tenant?.business_name || 'BROKER'}*\n`
  msg += `--------------------------------\n`
  msg += `*Kepada:* ${rpaName || 'RPA'}\n`
  msg += `*Sumber:* ${farmName || 'Kandang'}\n`
  msg += `*Tanggal:* ${dateStr}\n`
  msg += `--------------------------------\n`
  msg += `*Rincian Barang:*\n`
  msg += `Qty: ${qty}\n`
  msg += `Berat: ${weight}\n`
  msg += `Harga Jual Total: ${total}\n`
  msg += `--------------------------------\n`
  msg += `*TOTAL TAGIHAN: ${total}*\n`
  msg += `--------------------------------\n`
  msg += `_Terima kasih atas kerja samanya._\n`
  msg += `_Dikirim via TernakOS_`
  
  return encodeURIComponent(msg)
}

// ─── TransaksiSuccessCard ─────────────────────────────────────────────────────

/**
 * Props:
 *   isOpen   — boolean
 *   onClose  — () => void
 *   onDetail — () => void (optional)
 *   data     — {
 *     type: 'beli'|'jual'|'lengkap',
 *     farmName, rpaName,
 *     quantity, totalWeight,
 *     buyPrice, sellPrice,
 *     netProfit, transactionDate
 *   }
 */
export default function TransaksiSuccessCard({ isOpen, onClose, onDetail, data }) {
  if (!data) return null

  const {
    farmName, rpaName, quantity, totalWeight,
    buyPrice, sellPrice, netProfit, transactionDate,
  } = data

  const profitColor = netProfit > 0 ? '#34D399' : netProfit < 0 ? '#F87171' : '#94A3B8'
  const isRecorded = data.type === 'recorded'

  return (
    <AnimatePresence>
      {isOpen && (
        <>
          {/* Overlay */}
          <motion.div
            key="overlay"
            className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={onClose}
          />

          {/* Card */}
          <motion.div
            key="card"
            className="fixed inset-0 z-50 flex items-center justify-center p-4 pointer-events-none"
          >
            <motion.div
              className="bg-[#121A23] rounded-3xl p-8 max-w-sm w-full pointer-events-auto border border-white/[0.08]"
              style={{
                boxShadow: '0 0 60px rgba(16, 185, 129, 0.1)',
              }}
              initial={{ scale: 0.9, opacity: 0, y: 20 }}
              animate={{ scale: 1, opacity: 1, y: 0 }}
              exit={{ scale: 0.9, opacity: 0, y: 20 }}
              transition={{ type: 'spring', stiffness: 300, damping: 25 }}
            >
              {/* Check animation */}
              <CheckCircleAnimated />

              {/* Title */}
              <div className="text-center mb-6">
                <h3 className="font-sans text-xl font-bold text-white mb-1">
                  {isRecorded ? 'Pesanan Dicatat!' : 'Transaksi Berhasil!'}
                </h3>
                {transactionDate && (
                  <p className="text-slate-400 font-sans text-sm">
                    {formatDate(transactionDate)}
                  </p>
                )}
              </div>

              {/* Info row */}
              <div className="bg-white/[0.02] rounded-2xl p-4 space-y-2.5 mb-4 border border-white/[0.08]">
                {farmName && (
                  <div className="flex justify-between items-center text-sm">
                    <span className="text-slate-400 font-sans font-normal">Dari</span>
                    <span className="text-[#F1F5F9] font-sans font-semibold truncate ml-4 max-w-[60%] text-right">{farmName}</span>
                  </div>
                )}
                {rpaName && (
                  <div className="flex justify-between items-center text-sm">
                    <span className="text-slate-400 font-sans font-normal">Ke</span>
                    <span className="text-[#F1F5F9] font-sans font-semibold truncate ml-4 max-w-[60%] text-right">{rpaName}</span>
                  </div>
                )}
                {totalWeight > 0 && (
                  <div className="flex justify-between items-center text-sm">
                    <span className="text-slate-400 font-sans font-normal">Berat</span>
                    <span className="text-[#F1F5F9] font-sans font-semibold">
                      {formatKg(totalWeight)}
                      {quantity > 0 && <span className="text-slate-500 font-sans font-normal"> · {quantity} ekor</span>}
                    </span>
                  </div>
                )}
              </div>

              {/* Profit highlight */}
              {netProfit !== undefined && netProfit !== null && (
                <div
                  className="rounded-2xl p-4 mb-6 text-center"
                  style={{
                    background: netProfit >= 0 ? 'rgba(16, 185, 129, 0.06)' : 'rgba(248, 113, 113, 0.06)',
                    border: `1px solid ${netProfit >= 0 ? 'rgba(16, 185, 129, 0.15)' : 'rgba(248, 113, 113, 0.15)'}`,
                  }}
                >
                  <p className="text-[10px] font-sans font-normal uppercase tracking-widest text-slate-400 mb-1">
                    ESTIMASI KEUNTUNGAN
                  </p>
                  <p
                    className="font-sans text-2xl font-bold"
                    style={{ color: profitColor }}
                  >
                    {netProfit >= 0 ? '+' : ''}{formatRp(netProfit)}
                  </p>
                  {buyPrice > 0 && sellPrice > 0 && (
                    <p className="text-[11px] text-slate-500 mt-1">
                      Modal {formatRp(buyPrice)} · Jual {formatRp(sellPrice)}
                    </p>
                  )}
                </div>
              )}

              {/* Buttons */}
              <div className="flex gap-3">
                {onDetail && (
                  <button
                    onClick={() => { onDetail(); onClose() }}
                    className="flex-1 py-3 rounded-2xl border border-emerald-500/30 text-emerald-400 text-sm font-sans font-bold hover:bg-emerald-500/5 transition-colors"
                  >
                    Lihat Detail
                  </button>
                )}
                <button
                  onClick={onClose}
                  className="flex-1 py-3 rounded-2xl bg-white/5 border border-white/10 text-white text-sm font-sans font-bold transition-colors"
                >
                  Tutup
                </button>
              </div>

              {/* WA Link - Hidden if only recorded */}
              {!isRecorded && (
                <button
                  onClick={() => {
                    const phone = data.rpaPhone || ''
                    const cleanPhone = phone.replace(/[^0-9]/g, '')
                    const finalPhone = cleanPhone.startsWith('0') ? '62' + cleanPhone.slice(1) : cleanPhone
                    window.open(`https://wa.me/${finalPhone}?text=${generateWAMessage(data)}`, '_blank')
                  }}
                  className="w-full mt-3 py-4 rounded-2xl bg-emerald-500 hover:bg-emerald-600 text-white text-sm font-bold uppercase tracking-widest transition-all shadow-lg shadow-emerald-500/20 flex items-center justify-center gap-2"
                >
                  <Smartphone size={18} /> Kirim Invoice WA
                </button>
              )}
            </motion.div>
          </motion.div>
        </>
      )}
    </AnimatePresence>
  )
}
