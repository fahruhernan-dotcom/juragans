import { useState } from 'react'
import { Lock, ShieldCheck, ArrowRight, X } from 'lucide-react'

export default function AdminLoginModal({ isOpen, onClose, onSuccess }) {
  const [pin, setPin] = useState('')
  const [error, setError] = useState(false)

  if (!isOpen) return null

  const handleLogin = (e) => {
    e.preventDefault()
    if (pin === 'juragan2026' || pin === 'admin123') {
      setError(false)
      onSuccess()
      onClose()
    } else {
      setError(true)
    }
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/70 backdrop-blur-sm animate-fade-in">
      <div className="bg-white rounded-3xl max-w-md w-full overflow-hidden shadow-2xl border-2 border-brand-gold/30 relative">
        <div className="bg-gradient-to-r from-brand-maroon to-brand-maroon-dark text-white p-6 text-center relative">
          <button
            onClick={onClose}
            className="absolute top-4 right-4 w-9 h-9 bg-white/10 hover:bg-white/20 text-white rounded-full flex items-center justify-center transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
          <div className="w-12 h-12 bg-brand-gold text-brand-maroon-dark rounded-full flex items-center justify-center mx-auto mb-3">
            <Lock className="w-6 h-6" />
          </div>
          <h3 className="font-bold text-xl text-white">Login Dashboard Worker & Admin</h3>
          <p className="text-xs text-white/80 mt-1">
            Masukan PIN keamanan internal untuk mengontrol automasi posting & bisnis.
          </p>
        </div>

        <form onSubmit={handleLogin} className="p-6 space-y-4">
          <div>
            <label className="block text-xs font-bold text-brand-maroon uppercase tracking-wider mb-2 text-center">
              PIN Keamanan Admin:
            </label>
            <input
              type="password"
              autoFocus
              maxLength={15}
              placeholder="Masukan PIN (default: juragan2026)"
              value={pin}
              onChange={(e) => setPin(e.target.value)}
              className={`w-full text-center text-lg font-mono tracking-widest px-4 py-3 rounded-xl border-2 outline-none transition-colors ${
                error
                  ? 'border-red-500 bg-red-50 text-red-900 focus:ring-2 focus:ring-red-200'
                  : 'border-gray-300 focus:border-brand-maroon focus:ring-2 focus:ring-brand-maroon/20'
              }`}
            />
            {error && (
              <p className="text-xs text-red-600 text-center font-semibold mt-1">
                PIN Salah! Silakan coba PIN: juragan2026
              </p>
            )}
          </div>

          <button
            type="submit"
            className="w-full py-3.5 bg-brand-maroon hover:bg-brand-maroon-dark text-white rounded-xl font-bold text-sm shadow-lg flex items-center justify-center space-x-2 transition-all duration-300 active:scale-95"
          >
            <span>Buka Command Center</span>
            <ArrowRight className="w-4 h-4" />
          </button>

          <p className="text-[11px] text-gray-500 text-center flex items-center justify-center space-x-1">
            <ShieldCheck className="w-3.5 h-3.5 text-brand-maroon" />
            <span>Terproteksi Akses Internal Pekerja</span>
          </p>
        </form>
      </div>
    </div>
  )
}
