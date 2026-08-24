import React from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { Sparkles, Download, ArrowRight, X, ShieldCheck, CheckCircle2, AlertCircle } from 'lucide-react'

/**
 * AppUpdateModal Component
 * Interactive modal popup displaying the new APK version details,
 * changelog, and a one-click download/update button.
 */
export function AppUpdateModal({
  isOpen,
  onClose,
  currentVersion = 'v0.9.5',
  latestRelease,
  isMandatory = false,
  onDownload,
}) {
  if (!isOpen || !latestRelease) return null

  const newVersion = latestRelease.version || 'v0.9.5'
  const releaseNotes = latestRelease.release_notes || 'Peningkatan performa dan perbaikan sistem.'

  // Split release notes into formatted list
  const notesList = releaseNotes
    .split('\n')
    .map(line => line.trim().replace(/^[•\-*]\s*/, ''))
    .filter(Boolean)

  return (
    <AnimatePresence>
      <div className="fixed inset-0 z-[9999] flex items-center justify-center p-4">
        {/* Backdrop */}
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          onClick={isMandatory ? undefined : onClose}
          className="fixed inset-0 bg-slate-950/70 backdrop-blur-sm"
        />

        {/* Modal Card */}
        <motion.div
          initial={{ opacity: 0, scale: 0.95, y: 15 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          exit={{ opacity: 0, scale: 0.95, y: 15 }}
          transition={{ type: 'spring', duration: 0.4, bounce: 0.2 }}
          className="relative w-full max-w-md bg-white rounded-3xl shadow-2xl border border-slate-100 overflow-hidden z-10"
        >
          {/* Header Graphic Gradient */}
          <div className="relative p-6 pb-5 bg-gradient-to-br from-slate-900 via-slate-800 to-emerald-950 text-white overflow-hidden">
            {/* Background Glow */}
            <div className="absolute -top-12 -right-12 w-36 h-36 bg-emerald-500/20 rounded-full blur-2xl pointer-events-none" />
            <div className="absolute -bottom-8 -left-8 w-28 h-28 bg-sky-500/20 rounded-full blur-xl pointer-events-none" />

            {/* Close Button (if not mandatory) */}
            {!isMandatory && (
              <button
                onClick={onClose}
                className="absolute top-4 right-4 w-8 h-8 rounded-full bg-white/10 hover:bg-white/20 active:scale-95 text-slate-300 hover:text-white flex items-center justify-center transition-all cursor-pointer"
                aria-label="Tutup"
              >
                <X size={16} />
              </button>
            )}

            {/* Header Badge & Title */}
            <div className="flex items-center gap-2 mb-2.5">
              <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[11px] font-black uppercase tracking-wider bg-emerald-500/20 text-emerald-300 border border-emerald-500/30">
                <Sparkles size={12} className="text-emerald-400 animate-pulse" />
                Pembaruan Tersedia
              </span>
              {isMandatory && (
                <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-bold bg-amber-500/20 text-amber-300 border border-amber-500/30">
                  <AlertCircle size={11} /> Wajib
                </span>
              )}
            </div>

            <h3 className="text-xl font-black tracking-tight text-white font-['Sora']">
              Versi Baru Telah Hadir!
            </h3>
            <p className="text-xs text-slate-300 mt-1 leading-relaxed">
              Nikmati fitur terbaru, stabilitas lebih tinggi, dan pengalaman transaksi lebih cepat.
            </p>

            {/* Version Transition Box */}
            <div className="mt-4 flex items-center justify-between bg-white/10 backdrop-blur-md rounded-2xl p-3 border border-white/15">
              <div className="text-left">
                <span className="text-[10px] font-medium text-slate-300 block uppercase tracking-wider">Terpasang</span>
                <span className="text-xs font-bold text-slate-200">{currentVersion}</span>
              </div>
              <div className="w-7 h-7 rounded-full bg-emerald-500/30 border border-emerald-400/40 flex items-center justify-center text-emerald-300 shadow-inner">
                <ArrowRight size={14} />
              </div>
              <div className="text-right">
                <span className="text-[10px] font-medium text-emerald-300 block uppercase tracking-wider">Versi Baru</span>
                <span className="text-xs font-black text-emerald-400">{newVersion}</span>
              </div>
            </div>
          </div>

          {/* Changelog Body */}
          <div className="p-6 space-y-4">
            <div>
              <h4 className="text-xs font-black uppercase tracking-wider text-slate-400 mb-2.5 flex items-center gap-1.5">
                <CheckCircle2 size={13} className="text-emerald-500" />
                Apa yang Baru di {newVersion}?
              </h4>

              <div className="space-y-2 max-h-48 overflow-y-auto pr-1">
                {notesList.length > 0 ? (
                  notesList.map((note, idx) => (
                    <div key={idx} className="flex items-start gap-2.5 text-xs text-slate-700 leading-relaxed bg-slate-50 p-2.5 rounded-xl border border-slate-100">
                      <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 mt-1.5 shrink-0" />
                      <span>{note}</span>
                    </div>
                  ))
                ) : (
                  <p className="text-xs text-slate-500 italic bg-slate-50 p-3 rounded-xl border border-slate-100">
                    {releaseNotes}
                  </p>
                )}
              </div>
            </div>

            {/* Security Badge */}
            <div className="flex items-center gap-2 px-3 py-2 rounded-xl bg-slate-50 border border-slate-200/60 text-[11px] text-slate-500">
              <ShieldCheck size={14} className="text-emerald-600 shrink-0" />
              <span>Paket APK resmi (~10 MB) langsung dari server terverifikasi.</span>
            </div>

            {/* Action Buttons */}
            <div className="space-y-2 pt-2">
              <button
                type="button"
                onClick={() => {
                  onDownload(latestRelease.apk_download_url)
                  if (!isMandatory) onClose()
                }}
                className="w-full h-12 rounded-2xl font-black text-sm text-white bg-gradient-to-r from-emerald-600 via-emerald-500 to-teal-600 hover:from-emerald-700 hover:to-teal-700 active:scale-[0.99] shadow-lg shadow-emerald-500/25 flex items-center justify-center gap-2 transition-all cursor-pointer"
              >
                <Download size={17} />
                Download & Pasang Pembaruan
              </button>

              {!isMandatory && (
                <button
                  type="button"
                  onClick={onClose}
                  className="w-full h-10 rounded-xl font-bold text-xs text-slate-500 hover:text-slate-700 hover:bg-slate-100 transition-colors cursor-pointer"
                >
                  Nanti Saja
                </button>
              )}
            </div>
          </div>
        </motion.div>
      </div>
    </AnimatePresence>
  )
}
