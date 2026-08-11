import React from 'react'
import { AlertTriangle } from 'lucide-react'
import { cn } from '@/lib/utils'

/**
 * BrokerAuditNotice - Universal banner for pending transaction audits.
 */
export function BrokerAuditNotice({ count, message, icon: Icon = AlertTriangle, isDesktop, onClick }) {
  if (!count || count === 0) return null

  return (
    <div 
      onClick={onClick}
      className={cn(
        "mx-5 my-4 p-4 bg-amber-500/10 border border-amber-500/20 rounded-2xl flex items-center gap-4 group transition-all shadow-lg shadow-amber-500/5",
        onClick ? "cursor-pointer hover:bg-amber-500/[0.15] active:scale-[0.98]" : "cursor-default"
      )}
    >
      <div className="w-10 h-10 rounded-xl bg-amber-500/20 flex items-center justify-center text-amber-500 shrink-0 group-hover:scale-110 transition-transform">
        <Icon size={20} />
      </div>
      <div className="flex-1">
        <p className={cn("font-black text-amber-500 uppercase tracking-widest", isDesktop ? "text-[10px]" : "text-xs")}>
          PERHATIAN AUDIT
        </p>
        <p className="text-white/70 text-xs font-medium mt-0.5">
          Ada <span className="text-amber-500 font-bold">{count}</span> {message}
        </p>
      </div>
    </div>
  )
}
