import { cn } from '@/lib/utils'
import { STATUS_COLORS, LICENSE_STATUS } from '@/lib/license/licenseConstants'

const STATUS_LABEL = {
  [LICENSE_STATUS.ACTIVE]:    'Aktif',
  [LICENSE_STATUS.WARNING]:   'Hampir Habis',
  [LICENSE_STATUS.GRACE]:     'Masa Tenggang',
  [LICENSE_STATUS.LOCKED]:    'Terkunci',
  [LICENSE_STATUS.PERMANENT]: 'Permanen'
}

export function StatusBadge({ status, animate = false, size = 'md' }) {
  const colors = STATUS_COLORS[status] || STATUS_COLORS.ACTIVE
  const sizeClass = size === 'sm' ? 'px-2 py-0.5 text-[9px]' : 'px-2.5 py-0.5 text-[10px]'

  return (
    <span
      style={{
        color: colors.text,
        backgroundColor: colors.bg,
        border: `1px solid ${colors.border}`
      }}
      className={cn(
        'rounded-lg font-black uppercase tracking-wider',
        sizeClass,
        animate && (status === 'GRACE' || status === 'LOCKED') && 'animate-pulse'
      )}
    >
      {STATUS_LABEL[status] || status}
    </span>
  )
}

export function LicenseStatusCard({
  statusInfo,
  licenseActivatedAt,
  licenseExpiresAt,
  loading,
  formatLicenseDate,
  getGraceDate
}) {
  if (loading) {
    return (
      <div className="bg-white/[0.02] border border-white/5 rounded-2xl p-5 space-y-4 animate-pulse">
        {[1, 2, 3, 4, 5].map(i => (
          <div key={i} className="flex justify-between items-center py-1 border-b border-white/5 last:border-0">
            <div className="h-3 w-24 bg-white/10 rounded-md" />
            <div className="h-3 w-28 bg-white/10 rounded-md" />
          </div>
        ))}
      </div>
    )
  }

  const rows = [
    {
      label: 'Status Lisensi',
      value: <StatusBadge status={statusInfo.status} animate />,
      tooltip: 'Status dihitung otomatis dari tanggal kedaluwarsa'
    },
    {
      label: 'Tanggal Aktif',
      value: formatLicenseDate(licenseActivatedAt)
    },
    {
      label: 'Tanggal Expired',
      value: formatLicenseDate(licenseExpiresAt)
    },
    {
      label: 'Grace Sampai',
      value: getGraceDate(licenseExpiresAt),
      tooltip: 'Aplikasi tetap bisa dipakai selama 3 hari setelah kedaluwarsa'
    },
    {
      label: 'Sisa Masa Aktif',
      value: statusInfo.status === 'PERMANENT'
        ? <span className="font-mono text-violet-400">Unlimited</span>
        : statusInfo.daysRemaining < 0
          ? <span className="font-mono text-rose-400">Terlewat {Math.abs(statusInfo.daysRemaining)} Hari</span>
          : <span className="font-mono text-emerald-400">{statusInfo.daysRemaining} Hari Lagi</span>
    }
  ]

  return (
    <div className="bg-white/[0.02] border border-white/5 rounded-2xl p-5 space-y-0">
      <h4 className="text-xs font-black text-slate-400 uppercase tracking-widest mb-4">Detail Lisensi Saat Ini</h4>
      <div className="space-y-3.5 text-xs font-bold text-slate-300">
        {rows.map((row, i) => (
          <div key={i} className="flex justify-between items-center py-1 border-b border-white/5 last:border-0">
            <span className="text-[#A18E7E]">{row.label}</span>
            <span>{row.value}</span>
          </div>
        ))}
      </div>
    </div>
  )
}
