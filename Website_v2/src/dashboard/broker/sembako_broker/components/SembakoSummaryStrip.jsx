import React from 'react'
import { formatIDR } from '@/lib/format'

const COLOR_MAP = {
  red:   { bar: '#EF4444' },
  green: { bar: '#10B981' },
  amber: { bar: '#334155' },
  default:{ bar: '#334155' },
}

export function SembakoSummaryStrip({ items = [] }) {
  if (!items.length) return null

  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 px-4 sm:px-6 py-4">
      {items.map((item) => {
        const c = COLOR_MAP[item.color] || COLOR_MAP.default
        const displayValue = item.isCurrency
          ? formatIDR(Math.abs(item.value || 0))
          : (item.value ?? '—')

        return (
          <div
            key={item.label}
            className="relative overflow-hidden rounded-2xl p-4 transition-all shadow-tko-sm border border-l-4 bg-white dark:bg-[#0A0F16] border-slate-200/80 dark:border-white/10"
            style={{
              borderLeftColor: c.bar,
            }}
          >
            <div className="flex items-center gap-1.5 mb-1.5">
              <span className="w-1.5 h-1.5 rounded-full" style={{ background: c.bar }} />
              <p className="text-[10px] font-black uppercase tracking-widest text-slate-550 dark:text-slate-400">
                {item.label}
              </p>
            </div>

            <p className="text-xl sm:text-2xl font-black text-foreground tracking-tight font-sans truncate leading-tight">
              {displayValue}
            </p>

            {item.subLabel && (
              <p className="text-[11px] font-semibold mt-1.5 text-slate-500 dark:text-slate-400 line-clamp-1">
                {item.subLabel}
              </p>
            )}
          </div>
        )
      })}
    </div>
  )
}
