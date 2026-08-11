import { cn } from '@/lib/utils'
import { STATUS_COLORS, LICENSE_STATUS } from '@/lib/license/licenseConstants'
import { Lock, AlertTriangle, Shield, CheckCircle, Crown } from 'lucide-react'

const TIMELINE_STEPS = [
  { status: LICENSE_STATUS.ACTIVE,    label: 'Aktif',         icon: CheckCircle,   desc: 'Lisensi valid. Semua fitur aktif.' },
  { status: LICENSE_STATUS.WARNING,   label: 'Hampir Habis',  icon: AlertTriangle, desc: 'H-7 sebelum kedaluwarsa. Segera perpanjang.' },
  { status: LICENSE_STATUS.GRACE,     label: 'Masa Tenggang', icon: Shield,        desc: '3 hari toleransi. Fitur tetap aktif.' },
  { status: LICENSE_STATUS.LOCKED,    label: 'Terkunci',      icon: Lock,          desc: 'Akses ditangguhkan. Hubungi Developer.' },
]

export function LicenseTimeline({ statusInfo, loading }) {
  if (loading) {
    return (
      <div className="animate-pulse space-y-0">
        {[1,2,3,4].map(i => (
          <div key={i} className="flex items-start gap-3 pb-4 last:pb-0">
            <div className="w-8 h-8 rounded-full bg-white/10 shrink-0 mt-0.5" />
            <div className="flex-1 pt-1 space-y-1.5">
              <div className="h-3 w-20 bg-white/10 rounded" />
              <div className="h-2 w-40 bg-white/5 rounded" />
            </div>
          </div>
        ))}
      </div>
    )
  }

  const currentStatus = statusInfo?.status || LICENSE_STATUS.ACTIVE
  const isPermanent = currentStatus === LICENSE_STATUS.PERMANENT

  if (isPermanent) {
    const colors = STATUS_COLORS.PERMANENT
    return (
      <div
        style={{ borderColor: colors.border, backgroundColor: colors.bg }}
        className="rounded-2xl border p-5 flex items-center gap-4"
      >
        <div
          style={{ color: colors.text, backgroundColor: 'rgba(167,139,250,0.1)', borderColor: colors.border }}
          className="w-10 h-10 rounded-full border flex items-center justify-center shrink-0"
        >
          <Crown size={18} />
        </div>
        <div>
          <p style={{ color: colors.text }} className="text-sm font-black uppercase tracking-tight">Lisensi Permanen</p>
          <p className="text-xs text-slate-400 mt-0.5 font-semibold">Masa aktif tanpa batas waktu. Semua fitur selalu aktif.</p>
        </div>
      </div>
    )
  }

  const currentIdx = TIMELINE_STEPS.findIndex(s => s.status === currentStatus)

  return (
    <div className="relative">
      {TIMELINE_STEPS.map((step, idx) => {
        const Icon = step.icon
        const colors = STATUS_COLORS[step.status]
        const isCurrent = idx === currentIdx
        const isPast = idx < currentIdx

        return (
          <div key={step.status} className="flex items-start gap-3 pb-5 last:pb-0 relative">
            {/* Vertical connector line */}
            {idx < TIMELINE_STEPS.length - 1 && (
              <div
                className={cn(
                  'absolute left-4 top-8 bottom-0 w-0.5',
                  isPast || isCurrent ? 'bg-white/20' : 'bg-white/5'
                )}
              />
            )}

            {/* Step circle */}
            <div
              style={isCurrent ? {
                color: colors.text,
                backgroundColor: colors.bg,
                borderColor: colors.border,
                boxShadow: `0 0 0 4px ${colors.bg}`
              } : {}}
              className={cn(
                'w-8 h-8 rounded-full border flex items-center justify-center shrink-0 transition-all',
                isCurrent && 'scale-110',
                !isCurrent && !isPast && 'border-white/10 text-slate-600',
                isPast && 'border-white/10 text-slate-400 bg-white/5'
              )}
            >
              <Icon size={14} className={isCurrent ? 'animate-pulse' : ''} />
            </div>

            {/* Step content */}
            <div className="pt-0.5">
              <p className={cn(
                'text-xs font-black uppercase tracking-wide',
                isCurrent && 'text-white',
                isPast && 'text-slate-500',
                !isCurrent && !isPast && 'text-slate-600'
              )}>
                {step.label}
                {isCurrent && <span className="ml-2 text-[10px] normal-case tracking-normal opacity-70">— Saat Ini</span>}
              </p>
              <p className={cn(
                'text-[10px] mt-0.5 font-semibold leading-relaxed',
                isCurrent ? 'text-slate-400' : 'text-slate-600'
              )}>
                {step.desc}
              </p>
            </div>
          </div>
        )
      })}
    </div>
  )
}
