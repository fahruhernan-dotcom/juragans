import { Sparkles } from 'lucide-react'

const STORY_PRESETS = [
  {
    id: 1,
    title: 'Preset Legalitas Halal BPJPH',
    desc: 'Menayangkan Sertifikat Halal & Kepercayaan Konsumen.',
    badge: 'STORY #1',
  },
  {
    id: 2,
    title: 'Preset Promo Kuah Bakso/Soto',
    desc: 'Menayangkan Foto Appetizing Taburan Bawang Goreng Juragan.',
    badge: 'STORY #2',
  },
  {
    id: 3,
    title: 'Preset Sampel Gratis Restoran',
    desc: 'Menayangkan penawaran sampel gratis B2B Horeca.',
    badge: 'STORY #3',
  },
]

export default function AutoStoryPage({ workerInfo }) {
  const handleRunAutoStory = async () => {
    try {
      const res  = await fetch('http://127.0.0.1:5000/api/run-auto-story', { method: 'POST' })
      const data = await res.json()
      if (res.ok) {
        alert(`✅ ${data.message || 'Auto Story berhasil dipicu!'}`)
      } else {
        alert(`⚠️ ${data.error || 'Gagal memicu Auto Story.'}`)
      }
    } catch {
      alert('❌ Backend Worker Bridge Offline. Jalankan server_bridge.py terlebih dahulu.')
    }
  }

  return (
    <div className="bg-white p-6 sm:p-8 rounded-3xl shadow-sm border border-gray-200 space-y-6">
      <div>
        <span className="text-xs font-bold text-brand-maroon uppercase tracking-wider block">Instagram Story Publisher</span>
        <h2 className="text-2xl font-bold text-gray-900 mt-1">Automasi Tayangan Story Harian</h2>
        <p className="text-sm text-gray-600 mt-1">
          Upload preset story harian secara otomatis ke Instagram Story menggunakan Chrome Undetected Engine.
        </p>
      </div>

      {/* Story preset cards */}
      <div className="grid sm:grid-cols-3 gap-4">
        {STORY_PRESETS.map((s) => (
          <div key={s.id} className="border-2 border-brand-gold/30 rounded-2xl p-5 space-y-3 bg-brand-cream/20">
            <span className="text-xs font-bold text-brand-maroon bg-brand-gold/30 px-2.5 py-0.5 rounded-full">
              {s.badge}
            </span>
            <h4 className="font-bold text-base text-gray-900">{s.title}</h4>
            <p className="text-xs text-gray-600">{s.desc}</p>
          </div>
        ))}
      </div>

      <button
        onClick={handleRunAutoStory}
        disabled={workerInfo?.is_running}
        className="py-4 px-8 bg-gradient-to-r from-purple-600 to-pink-600 hover:from-purple-700 hover:to-pink-700 disabled:from-gray-400 disabled:to-gray-400 text-white rounded-2xl font-bold text-base shadow-xl flex items-center justify-center space-x-3 transition-all active:scale-95"
      >
        <Sparkles className="w-5 h-5 text-white" />
        <span>{workerInfo?.is_running ? 'Bot Sedang Berjalan...' : 'Publish Auto Story Now'}</span>
      </button>
    </div>
  )
}
