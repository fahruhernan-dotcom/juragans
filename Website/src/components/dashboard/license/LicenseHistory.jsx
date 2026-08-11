import { History, RefreshCw } from 'lucide-react'
import { Button } from '@/components/ui/button'

const ACTION_LABELS = {
  license_update: 'Perbarui Lisensi'
}

function HistorySkeleton() {
  return (
    <div className="space-y-3 animate-pulse">
      {[1, 2, 3].map(i => (
        <div key={i} className="flex items-start gap-3">
          <div className="w-7 h-7 rounded-full bg-white/10 shrink-0 mt-0.5" />
          <div className="flex-1 space-y-1.5 pt-0.5">
            <div className="h-3 w-32 bg-white/10 rounded" />
            <div className="h-2.5 w-20 bg-white/5 rounded" />
          </div>
          <div className="h-2.5 w-16 bg-white/5 rounded mt-1" />
        </div>
      ))}
    </div>
  )
}

function EmptyHistory() {
  return (
    <div className="flex flex-col items-center justify-center py-8 gap-3 text-center">
      <div className="w-12 h-12 rounded-2xl bg-white/5 border border-white/10 flex items-center justify-center">
        <History size={22} className="text-slate-600" />
      </div>
      <div>
        <p className="text-xs font-black text-slate-500 uppercase tracking-wider">Belum Ada Riwayat</p>
        <p className="text-[10px] text-slate-600 font-semibold mt-0.5 leading-relaxed">
          Setiap perubahan lisensi yang dilakukan oleh Developer<br />akan otomatis tercatat di sini.
        </p>
      </div>
    </div>
  )
}

export function LicenseHistory({ history, loading, onRefresh }) {
  const formatDate = (dateStr) => {
    try {
      return new Date(dateStr).toLocaleDateString('id-ID', {
        day: '2-digit',
        month: 'long',
        year: 'numeric',
        hour: '2-digit',
        minute: '2-digit'
      })
    } catch { return dateStr }
  }

  return (
    <div className="space-y-3">
      <div className="flex items-center justify-between">
        <h4 className="text-xs font-black text-slate-400 uppercase tracking-widest">
          Riwayat Perubahan
        </h4>
        <Button
          onClick={onRefresh}
          disabled={loading}
          variant="ghost"
          size="icon"
          title="Muat ulang riwayat"
          className="w-7 h-7 text-slate-500 hover:text-white hover:bg-white/10 rounded-lg"
        >
          <RefreshCw size={13} className={loading ? 'animate-spin' : ''} />
        </Button>
      </div>

      {loading ? (
        <HistorySkeleton />
      ) : history.length === 0 ? (
        <EmptyHistory />
      ) : (
        <div className="space-y-0 relative">
          {/* Vertical timeline line */}
          <div className="absolute left-3.5 top-4 bottom-4 w-0.5 bg-white/5" />

          {history.map((entry, idx) => (
            <div key={entry.id || idx} className="flex items-start gap-3 pb-4 last:pb-0 relative">
              {/* Dot */}
              <div className="w-7 h-7 rounded-full bg-[#0F172A] border border-emerald-500/20 flex items-center justify-center shrink-0 mt-0.5 z-[1]">
                <div className="w-2 h-2 rounded-full bg-emerald-500/60" />
              </div>
              
              {/* Content */}
              <div className="flex-1 min-w-0 pt-0.5">
                <p className="text-xs font-bold text-slate-200 leading-tight truncate">
                  {entry.notes || ACTION_LABELS[entry.action_type] || entry.action_type}
                </p>
                <p className="text-[10px] text-slate-500 font-semibold mt-0.5">
                   oleh {entry.user_name || 'Developer'}
                  {entry.user_role ? ` · ${entry.user_role}` : ''}
                </p>
              </div>

              {/* Date stamp */}
              <p className="text-[10px] text-slate-600 font-mono shrink-0 mt-0.5 text-right leading-tight">
                {formatDate(entry.timestamp).split(', ')[0]}<br />
                <span className="text-[9px]">{formatDate(entry.timestamp).split(', ')[1]}</span>
              </p>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}
