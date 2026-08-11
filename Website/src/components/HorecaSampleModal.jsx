import { useState } from 'react'
import { X, Send, CheckCircle, Gift } from 'lucide-react'

export default function HorecaSampleModal({ isOpen, onClose }) {
  const [namaUsaha, setNamaUsaha] = useState('')
  const [jenisUsaha, setJenisUsaha] = useState('Restoran / Rumah Makan')
  const [lokasi, setLokasi] = useState('')
  const [kebutuhanKg, setKebutuhanKg] = useState('5 - 10 Kg / bulan')

  if (!isOpen) return null

  const handleSubmit = (e) => {
    e.preventDefault()
    const text = `Halo Admin Juragan by Anak Bawang,\n\nSaya ingin mengajukan KLAIM SAMPEL GRATIS untuk Usaha Kuliner:\n• Nama Usaha: ${namaUsaha}\n• Jenis Usaha: ${jenisUsaha}\n• Lokasi Usaha: ${lokasi}\n• Estimasi Kebutuhan: ${kebutuhanKg}\n\nMohon informasi prosedur pengiriman sampel gratisnya. Terima kasih!`
    const waUrl = `https://wa.me/6282133731213?text=${encodeURIComponent(text)}`
    window.open(waUrl, '_blank')
    onClose()
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm animate-fade-in">
      <div className="bg-white rounded-3xl max-w-lg w-full overflow-hidden shadow-2xl border-2 border-brand-gold/30 relative">
        {/* Header */}
        <div className="bg-gradient-to-r from-brand-maroon to-brand-maroon-dark text-white p-6 sm:p-8 relative">
          <button
            onClick={onClose}
            className="absolute top-4 right-4 w-10 h-10 bg-white/10 hover:bg-white/20 text-white rounded-full flex items-center justify-center transition-colors"
          >
            <X className="w-5 h-5" />
          </button>

          <div className="flex items-center space-x-3 mb-2">
            <div className="w-10 h-10 bg-brand-gold text-brand-maroon-dark rounded-xl flex items-center justify-center">
              <Gift className="w-6 h-6" />
            </div>
            <span className="text-xs font-bold uppercase tracking-widest text-brand-gold">HORECA & B2B SPECIAL</span>
          </div>

          <h3 className="font-bold text-2xl text-white">Klaim Sampel Gratis Usaha Kuliner</h3>
          <p className="text-xs text-white/80 mt-1">
            Khusus Pemilik Restoran, Rumah Makan, Katering, & Usaha Kuliner untuk menguji kualitas renyah murni Bawang Juragan.
          </p>
        </div>

        {/* Form */}
        <form onSubmit={handleSubmit} className="p-6 sm:p-8 space-y-4">
          <div>
            <label className="block text-xs font-bold text-brand-maroon uppercase tracking-wider mb-1">
              Nama Restoran / Usaha Kuliner:
            </label>
            <input
              type="text"
              required
              placeholder="Contoh: Rumah Makan Soto Seger Boyolali"
              value={namaUsaha}
              onChange={(e) => setNamaUsaha(e.target.value)}
              className="w-full px-4 py-3 rounded-xl border border-gray-300 focus:border-brand-maroon focus:ring-2 focus:ring-brand-maroon/20 outline-none text-sm"
            />
          </div>

          <div className="grid sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-bold text-brand-maroon uppercase tracking-wider mb-1">
                Jenis Usaha:
              </label>
              <select
                value={jenisUsaha}
                onChange={(e) => setJenisUsaha(e.target.value)}
                className="w-full px-4 py-3 rounded-xl border border-gray-300 focus:border-brand-maroon focus:ring-2 focus:ring-brand-maroon/20 outline-none text-sm bg-white"
              >
                <option>Restoran / Rumah Makan</option>
                <option>Warung Bakso & Soto</option>
                <option>Usaha Katering</option>
                <option>Hotel / Cafe</option>
                <option>Reseller / Agen</option>
              </select>
            </div>

            <div>
              <label className="block text-xs font-bold text-brand-maroon uppercase tracking-wider mb-1">
                Estimasi Kebutuhan Bulanan:
              </label>
              <select
                value={kebutuhanKg}
                onChange={(e) => setKebutuhanKg(e.target.value)}
                className="w-full px-4 py-3 rounded-xl border border-gray-300 focus:border-brand-maroon focus:ring-2 focus:ring-brand-maroon/20 outline-none text-sm bg-white"
              >
                <option>2 - 5 Kg / bulan</option>
                <option>5 - 10 Kg / bulan</option>
                <option>10 - 25 Kg / bulan</option>
                <option>&gt; 25 Kg / bulan (Bulk Horeca)</option>
              </select>
            </div>
          </div>

          <div>
            <label className="block text-xs font-bold text-brand-maroon uppercase tracking-wider mb-1">
              Kota / Lokasi Usaha:
            </label>
            <input
              type="text"
              required
              placeholder="Contoh: Solo / Surakarta, Jawa Tengah"
              value={lokasi}
              onChange={(e) => setLokasi(e.target.value)}
              className="w-full px-4 py-3 rounded-xl border border-gray-300 focus:border-brand-maroon focus:ring-2 focus:ring-brand-maroon/20 outline-none text-sm"
            />
          </div>

          <div className="pt-2">
            <button
              type="submit"
              className="w-full py-4 bg-brand-maroon hover:bg-brand-maroon-dark text-white rounded-2xl font-bold text-sm shadow-xl flex items-center justify-center space-x-2 transition-all duration-300 hover:scale-[1.01]"
            >
              <Send className="w-4 h-4" />
              <span>Kirim Pengajuan Sampel via WhatsApp</span>
            </button>
          </div>

          <p className="text-[11px] text-gray-500 text-center flex items-center justify-center space-x-1">
            <CheckCircle className="w-3.5 h-3.5 text-emerald-600" />
            <span>Sampel gratis akan dikirimkan oleh tim Admin Juragan</span>
          </p>
        </form>
      </div>
    </div>
  )
}
