import { FolderSync } from 'lucide-react'

export default function SyncPage({ workerInfo }) {
  const handleRunSync = async () => {
    try {
      const res  = await fetch('http://127.0.0.1:5000/api/run-sync', { method: 'POST' })
      const data = await res.json()
      if (res.ok) {
        alert(`✅ ${data.message || 'Sync Drive berhasil dipicu!'}`)
      } else {
        alert(`⚠️ ${data.error || 'Gagal memicu Sync.'}`)
      }
    } catch {
      alert('❌ Backend Worker Bridge Offline. Jalankan server_bridge.py terlebih dahulu.')
    }
  }

  return (
    <div className="bg-white p-6 sm:p-8 rounded-3xl shadow-sm border border-gray-200 space-y-6">
      <div>
        <span className="text-xs font-bold text-brand-maroon uppercase tracking-wider block">Google Drive Cloud Sync</span>
        <h2 className="text-2xl font-bold text-gray-900 mt-1">Sinkronisasi Aset Foto & Dokumen</h2>
        <p className="text-sm text-gray-600 mt-1">
          Menjalankan{' '}
          <code className="bg-gray-100 px-1.5 py-0.5 rounded text-xs font-mono">run_sync.py</code>{' '}
          untuk mengunduh foto produk terbaru dari Google Drive ke folder lokal proyek.
        </p>
      </div>

      <div className="grid sm:grid-cols-3 gap-4">
        {[
          { icon: '📁', title: 'Foto Produk Studio',   desc: 'Foto pouch, bal PE, dan produk jadi dari Google Drive.' },
          { icon: '🎨', title: 'Template Konten',       desc: 'Template Story & Feed Canva yang sudah diekspor.' },
          { icon: '📋', title: 'Database Harga CSV',    desc: 'CSV terbaru harga dan SKU dari Google Sheets ekspor.' },
        ].map(({ icon, title, desc }) => (
          <div key={title} className="border border-gray-200 rounded-2xl p-5 bg-gray-50 space-y-2">
            <span className="text-2xl">{icon}</span>
            <h4 className="font-bold text-sm text-gray-900">{title}</h4>
            <p className="text-xs text-gray-600">{desc}</p>
          </div>
        ))}
      </div>

      <button
        onClick={handleRunSync}
        disabled={workerInfo?.is_running}
        className="py-4 px-8 bg-emerald-600 hover:bg-emerald-700 disabled:bg-gray-400 text-white rounded-2xl font-bold text-base shadow-xl flex items-center justify-center space-x-3 transition-all active:scale-95"
      >
        <FolderSync className="w-5 h-5 text-white" />
        <span>{workerInfo?.is_running ? 'Syncing...' : 'Sync Gambar Drive Now'}</span>
      </button>
    </div>
  )
}
