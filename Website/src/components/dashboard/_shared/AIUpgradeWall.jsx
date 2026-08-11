import React from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { Lock, Sparkles, Zap, ArrowRight, X } from 'lucide-react'
import { useNavigate } from 'react-router-dom'
import { PLAN_LABELS, UPGRADE_MESSAGES } from '@/lib/constants/planGating'

/**
 * AIUpgradeWall — A premium "Modern Classy" modal to prompt users to upgrade.
 *
 * @param {object} props
 * @param {boolean} props.isOpen - Whether the modal is open
 * @param {function} props.onClose - Close handler
 * @param {'analisis_performa' | 'prediksi_hasil' | 'chat_exceeded'} props.type - The reason for the lock
 * @param {'pro' | 'business'} props.requiredPlan - The plan needed to unlock
 */
export default function AIUpgradeWall({ isOpen, onClose, type = 'analisis_performa', requiredPlan = 'pro' }) {
  const navigate = useNavigate()
  const planInfo = PLAN_LABELS[requiredPlan] || PLAN_LABELS.pro
  const message = UPGRADE_MESSAGES[type] || 'Fitur ini tersedia di plan yang lebih tinggi.'

  if (!isOpen) return null

  return (
    <AnimatePresence>
      <div className="fixed inset-0 z-[100] flex items-center justify-center p-4">
        {/* Backdrop */}
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          onClick={onClose}
          className="absolute inset-0 bg-black/80 backdrop-blur-sm"
        />

        {/* Modal */}
        <motion.div
          initial={{ opacity: 0, scale: 0.9, y: 20 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          exit={{ opacity: 0, scale: 0.9, y: 20 }}
          className="relative w-full max-w-lg bg-[#0C1319] border border-white/10 rounded-[32px] overflow-hidden shadow-2xl"
        >
          {/* Header Image/Pattern */}
          <div className="absolute top-0 inset-x-0 h-32 bg-gradient-to-b from-emerald-500/10 to-transparent pointer-events-none" />
          
          {/* Close Button */}
          <button
            onClick={onClose}
            className="absolute top-6 right-6 w-10 h-10 rounded-full bg-white/5 border border-white/10 flex items-center justify-center text-slate-400 hover:text-white transition-all z-10"
          >
            <X size={20} />
          </button>

          <div className="relative p-8 pt-12 flex flex-col items-center text-center">
            {/* Icon Container */}
            <div className="relative mb-6">
              <div className="absolute inset-0 bg-emerald-500/20 blur-2xl rounded-full" />
              <div className="relative w-20 h-20 rounded-[28px] bg-[#121B24] border border-emerald-500/30 flex items-center justify-center">
                <Lock size={32} className="text-emerald-400" />
              </div>
              <motion.div
                animate={{ rotate: 360 }}
                transition={{ duration: 10, repeat: Infinity, ease: 'linear' }}
                className="absolute -top-2 -right-2 w-8 h-8 rounded-full bg-amber-500/20 border border-amber-500/30 flex items-center justify-center"
              >
                <Sparkles size={14} className="text-amber-500" />
              </motion.div>
            </div>

            {/* Badge */}
            <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-emerald-500/10 border border-emerald-500/20 mb-4">
              <Zap size={12} className="text-emerald-400" />
              <span className="text-[10px] font-black uppercase tracking-widest text-emerald-400">
                Fitur Premium {planInfo.name}
              </span>
            </div>

            {/* Typography */}
            <h2 className="font-display font-black text-2xl text-white mb-3">
              Buka Potensi Penuh AI
            </h2>
            <p className="text-[#94A3B8] text-sm leading-relaxed mb-8 max-w-[320px]">
              {message}
            </p>

            {/* Features Preview */}
            <div className="w-full grid grid-cols-1 gap-3 mb-10 text-left">
              {[
                'Analisis Performa (ADG & FCR) Otomatis',
                'Prediksi Waktu Panen & Estimasi Hasil',
                'Saran Manajemen Pakan Berbasis Data',
              ].map((f, i) => (
                <div key={i} className="flex items-center gap-3 p-3 rounded-2xl bg-white/[0.03] border border-white/5">
                  <div className="w-5 h-5 rounded-full bg-emerald-500/10 flex items-center justify-center flex-shrink-0">
                    <ArrowRight size={12} className="text-emerald-400" />
                  </div>
                  <span className="text-[13px] font-medium text-slate-300">{f}</span>
                </div>
              ))}
            </div>

            {/* Actions */}
            <div className="w-full flex flex-col gap-3">
              <button
                onClick={() => navigate('/dashboard/addons')}
                className="w-full h-14 bg-emerald-500 hover:bg-emerald-400 text-[#052c1e] text-base font-black rounded-2xl shadow-xl shadow-emerald-500/20 transition-all active:scale-[0.98] flex items-center justify-center gap-2"
              >
                Pilih Plan Sekarang
              </button>
              <button
                onClick={onClose}
                className="w-full h-12 bg-transparent hover:bg-white/5 text-slate-400 text-sm font-bold rounded-2xl transition-all"
              >
                Mungkin Nanti
              </button>
            </div>
            
            <p className="mt-8 text-[9px] font-bold text-slate-600 uppercase tracking-[0.2em]">
              TernakOS Intelligence Platform
            </p>
          </div>
        </motion.div>
      </div>
    </AnimatePresence>
  )
}
