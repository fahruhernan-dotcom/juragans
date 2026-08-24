import React from 'react'
import { formatIDR } from '@/lib/format'
import { cn } from '@/lib/utils'

/**
 * BrokerSummaryStrip - Universal summary strip for financial overview.
 * Supports dynamic number of columns and custom labels/values.
 */
export function BrokerSummaryStrip({ isDesktop, items = [] }) {
  if (!items || items.length === 0) return null

  return (
    <div className="bg-emerald-500/[0.04] border-b border-white/5 px-5 py-3.5 flex justify-between items-center overflow-x-auto no-scrollbar">
      {items.map((item, idx) => (
        <div 
          key={item.label} 
          className={cn(
            "space-y-0.5 min-w-[100px]",
            item.alignment === 'center' ? "text-center px-4 border-x border-white/5" : 
            item.alignment === 'right' ? "text-right pl-4" : 
            "text-left pr-4",
            // Remove border-x if it's not the middle element in a multi-column layout
            idx === 0 && "border-l-0 pl-0",
            idx === items.length - 1 && "border-r-0 pr-0"
          )}
        >
          <p className={cn("font-black text-[#4B6478] uppercase tracking-[0.15em] leading-none mb-1", isDesktop ? "text-[9px]" : "text-xs")}>
            {item.label}
          </p>
          <p className={cn(
            "font-display text-[13px] font-black tabular-nums",
            item.color === 'emerald' ? 'text-emerald-400' : 
            item.color === 'red' ? 'text-red-400' : 
            'text-[#F1F5F9]'
          )}>
            {item.prefix || ''}{item.isCurrency ? formatIDR(Math.abs(item.value)) : item.value}{item.suffix || ''}
          </p>
        </div>
      ))}
    </div>
  )
}
