import { useState } from 'react'
import { Send } from 'lucide-react'

const PILAR_OPTIONS = [
  'Promosi Produk',
  'Edukasi Pelanggan',
  'Testimoni & Review',
  'Behind The Scenes',
  'Legalitas & Trust',
  'Promo HORECA',
]

export default function NewPostPage({ onRefresh }) {
  const [form, setForm] = useState({
    judul_konten:      '',
    headline_caption:  '',
    isi_caption:       '',
    call_to_action:    'Klik link di bio atau hubungi kami via WhatsApp!',
    hashtags:          '#bawanggoreng #juragananakbawang #bawangmurni #boyolali #kuliner',
    pilar_konten:      'Promosi Produk',
    nama_file_gambar:  '01_foto_utama_produk_pouch_studio.jpg',
    jadwal_tayang:     '',
  })
  const [submitting, setSubmitting] = useState(false)

  const set = (key, val) => setForm((prev) => ({ ...prev, [key]: val }))

  const handleSubmit = async (e) => {
    e.preventDefault()
    setSubmitting(true)
    try {
      const res = await fetch('http://127.0.0.1:5000/api/add-post', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(form),
      })
      if (res.ok) {
        alert('🎉 Postingan baru berhasil ditambahkan ke Jadwal CSV!')
        setForm({
          judul_konten: '', headline_caption: '', isi_caption: '',
          call_to_action: 'Klik link di bio atau hubungi kami via WhatsApp!',
          hashtags: '#bawanggoreng #juragananakbawang #bawangmurni #boyolali #kuliner',
          pilar_konten: 'Promosi Produk',
          nama_file_gambar: '01_foto_utama_produk_pouch_studio.jpg',
          jadwal_tayang: '',
        })
        onRefresh()
      } else {
        alert('⚠️ Gagal menambah postingan.')
      }
    } catch {
      alert('❌ Backend Bridge Offline.')
    } finally {
      setSubmitting(false)
    }
  }

  const inputCls  = 'w-full px-4 py-3 rounded-xl border border-gray-300 text-sm focus:border-brand-maroon outline-none transition-colors'
  const labelCls  = 'block text-xs font-bold text-gray-600 uppercase tracking-wider mb-1.5'

  return (
    <div className="bg-white p-6 sm:p-8 rounded-3xl shadow-sm border border-gray-200 max-w-2xl space-y-6">
      <div>
        <span className="text-xs font-bold text-brand-maroon uppercase tracking-wider block">CSV Post Scheduler</span>
        <h2 className="text-2xl font-bold text-gray-900 mt-1">Tambah Jadwal Postingan Baru</h2>
        <p className="text-sm text-gray-600 mt-1">
          Tambahkan postingan baru ke database CSV. Bot Auto Post akan mengunggahnya ke Instagram.
        </p>
      </div>

      <form onSubmit={handleSubmit} className="space-y-5">
        {/* Pilar & Jadwal */}
        <div className="grid sm:grid-cols-2 gap-4">
          <div>
            <label className={labelCls}>Pilar Konten:</label>
            <select
              value={form.pilar_konten}
              onChange={(e) => set('pilar_konten', e.target.value)}
              className={inputCls}
            >
              {PILAR_OPTIONS.map((o) => <option key={o}>{o}</option>)}
            </select>
          </div>
          <div>
            <label className={labelCls}>Jadwal Tayang:</label>
            <input
              type="datetime-local"
              value={form.jadwal_tayang}
              onChange={(e) => set('jadwal_tayang', e.target.value)}
              className={inputCls}
            />
          </div>
        </div>

        {/* Judul */}
        <div>
          <label className={labelCls}>Judul Konten:</label>
          <input
            type="text"
            required
            placeholder="Contoh: Bawang Murni 100% Boyolali — Tanpa Tepung"
            value={form.judul_konten}
            onChange={(e) => set('judul_konten', e.target.value)}
            className={inputCls}
          />
        </div>

        {/* Headline */}
        <div>
          <label className={labelCls}>Headline Caption (baris pertama):</label>
          <input
            type="text"
            required
            placeholder="Contoh: 👑 100% Murni — Bawang Goreng Premium Boyolali!"
            value={form.headline_caption}
            onChange={(e) => set('headline_caption', e.target.value)}
            className={inputCls}
          />
        </div>

        {/* Isi */}
        <div>
          <label className={labelCls}>Isi Caption Lengkap:</label>
          <textarea
            rows={5}
            required
            placeholder="Tuliskan deskripsi lengkap postingan..."
            value={form.isi_caption}
            onChange={(e) => set('isi_caption', e.target.value)}
            className={inputCls}
          />
        </div>

        {/* CTA */}
        <div>
          <label className={labelCls}>Call to Action:</label>
          <input
            type="text"
            value={form.call_to_action}
            onChange={(e) => set('call_to_action', e.target.value)}
            className={inputCls}
          />
        </div>

        {/* Hashtags */}
        <div>
          <label className={labelCls}>Hashtags:</label>
          <input
            type="text"
            value={form.hashtags}
            onChange={(e) => set('hashtags', e.target.value)}
            className={inputCls}
          />
        </div>

        {/* Gambar */}
        <div>
          <label className={labelCls}>Nama File Gambar (dari folder Aset_Konten):</label>
          <input
            type="text"
            value={form.nama_file_gambar}
            onChange={(e) => set('nama_file_gambar', e.target.value)}
            className={inputCls}
          />
        </div>

        <button
          type="submit"
          disabled={submitting}
          className="w-full py-3.5 bg-brand-maroon hover:bg-brand-maroon-dark disabled:bg-gray-400 text-white font-bold rounded-xl shadow-lg transition-colors flex items-center justify-center space-x-2"
        >
          <Send className="w-4 h-4" />
          <span>{submitting ? 'Menyimpan...' : 'Simpan Postingan Baru ke CSV'}</span>
        </button>
      </form>
    </div>
  )
}
