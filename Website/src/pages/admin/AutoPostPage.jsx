import { Play, CheckCircle, Clock, Database } from 'lucide-react'

export default function AutoPostPage({ posts, onRefresh, workerInfo }) {
  const handleRunAutoPost = async () => {
    try {
      const res = await fetch('http://127.0.0.1:5000/api/run-auto-post', { method: 'POST' })
      const data = await res.json()
      if (res.ok) {
        alert(`✅ ${data.message || 'Auto Post berhasil dipicu!'}`)
      } else {
        alert(`⚠️ ${data.error || 'Gagal memicu Auto Post.'}`)
      }
    } catch {
      alert('❌ Backend Worker Bridge Offline. Jalankan server_bridge.py terlebih dahulu.')
    } finally {
      onRefresh()
    }
  }

  const pending = posts.filter((p) => p.status_post !== 'POSTED').length
  const posted  = posts.filter((p) => p.status_post === 'POSTED').length

  return (
    <div className="space-y-6">
      {/* Trigger card */}
      <div className="bg-white p-6 sm:p-8 rounded-3xl shadow-sm border border-gray-200 flex flex-col md:flex-row md:items-center justify-between gap-6">
        <div>
          <span className="text-xs font-bold text-brand-maroon uppercase tracking-wider block">Metode Chrome Undetected Engine</span>
          <h2 className="text-2xl font-bold text-gray-900 mt-1">Eksekusi Automasi Post Feed / Carousel</h2>
          <p className="text-sm text-gray-600 mt-1">
            Memicu <code className="bg-gray-100 px-1.5 py-0.5 rounded text-xs font-mono">auto_post_selenium.py</code>{' '}
            untuk mengunggah postingan berstatus <span className="font-bold text-amber-700">PENDING</span> ke Instagram.
          </p>
          <div className="mt-3 flex items-center space-x-4 text-sm">
            <span className="text-amber-700 font-bold">{pending} Pending</span>
            <span className="text-gray-300">|</span>
            <span className="text-emerald-700 font-bold">{posted} Posted</span>
          </div>
        </div>

        <button
          onClick={handleRunAutoPost}
          disabled={workerInfo?.is_running}
          className="py-4 px-8 bg-brand-maroon hover:bg-brand-maroon-dark disabled:bg-gray-400 text-white rounded-2xl font-bold text-base shadow-xl flex items-center justify-center space-x-3 transition-all active:scale-95 flex-shrink-0"
        >
          <Play className="w-5 h-5 fill-white" />
          <span>{workerInfo?.is_running ? 'Bot Sedang Berjalan...' : 'Jalankan Auto Post Now'}</span>
        </button>
      </div>

      {/* Posts table */}
      <div className="bg-white rounded-3xl shadow-sm border border-gray-200 overflow-hidden">
        <div className="p-6 border-b border-gray-100 flex items-center justify-between">
          <h3 className="font-bold text-lg text-gray-900 flex items-center space-x-2">
            <Database className="w-5 h-5 text-brand-maroon" />
            <span>Jadwal Postingan (CSV Database)</span>
          </h3>
          <span className="text-xs bg-gray-100 px-3 py-1 rounded-full font-semibold text-gray-600">
            Total: {posts.length} Postingan
          </span>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left text-sm text-gray-600">
            <thead className="bg-gray-50 text-xs font-bold uppercase text-gray-500 border-b border-gray-200">
              <tr>
                <th className="px-6 py-4">ID</th>
                <th className="px-6 py-4">Judul Konten</th>
                <th className="px-6 py-4">Pilar</th>
                <th className="px-6 py-4">Gambar</th>
                <th className="px-6 py-4">Jadwal Tayang</th>
                <th className="px-6 py-4">Status</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {posts.length === 0 && (
                <tr>
                  <td colSpan={6} className="px-6 py-10 text-center text-gray-400 text-sm">
                    Belum ada postingan terjadwal.
                  </td>
                </tr>
              )}
              {posts.map((p) => (
                <tr key={p.id} className="hover:bg-gray-50/80 transition-colors">
                  <td className="px-6 py-4 font-mono font-bold text-gray-900">#{p.id}</td>
                  <td className="px-6 py-4 font-bold text-gray-900 max-w-[220px]">
                    <span className="line-clamp-2 leading-snug">{p.judul_konten}</span>
                  </td>
                  <td className="px-6 py-4">
                    <span className="bg-brand-cream text-brand-maroon text-xs font-semibold px-2.5 py-1 rounded-full">
                      {p.pilar_konten}
                    </span>
                  </td>
                  <td className="px-6 py-4 text-xs font-mono truncate max-w-[160px]">{p.nama_file_gambar}</td>
                  <td className="px-6 py-4 text-xs text-gray-500">{p.jadwal_tayang || '-'}</td>
                  <td className="px-6 py-4">
                    {p.status_post === 'POSTED' ? (
                      <span className="bg-emerald-100 text-emerald-800 text-xs font-bold px-3 py-1 rounded-full flex items-center space-x-1 w-fit">
                        <CheckCircle className="w-3.5 h-3.5" /><span>POSTED</span>
                      </span>
                    ) : (
                      <span className="bg-amber-100 text-amber-800 text-xs font-bold px-3 py-1 rounded-full flex items-center space-x-1 w-fit">
                        <Clock className="w-3.5 h-3.5" /><span>PENDING</span>
                      </span>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  )
}
