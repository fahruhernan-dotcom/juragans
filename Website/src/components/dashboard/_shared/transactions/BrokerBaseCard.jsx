import React from 'react'
import { Card } from '@/components/ui/card'
import { cn } from '@/lib/utils'

/**
 * BrokerBaseCard - Universal card container for any broker transaction list.
 * Handles premium hover effects, borders, and consistent spacing.
 */
export function BrokerBaseCard({
  onClick,
  isLoss,
  children,
  footer,
  header,
  className,
  isDesktop = true
}) {
  return (
    <Card
      onClick={onClick}
      className={cn(
        "bg-white dark:bg-[#0A0F16] rounded-[22px] overflow-hidden relative cursor-pointer hover:bg-slate-50/50 dark:hover:bg-white/[0.02] active:scale-[0.99] border border-slate-200/80 dark:border-white/10 shadow-tko-sm hover:shadow-tko-md transition-all group",
        isLoss ? "border-red-500/50 dark:border-red-500/30 shadow-red-500/5" : "",
        className
      )}
    >
      <div className={cn(isDesktop ? "p-5 space-y-6" : "p-3.5 space-y-3")}>
        {header && (
          <div className={cn("flex gap-2", isDesktop ? "justify-between items-start" : "flex-col")}>
            {header}
          </div>
        )}

        {children}
      </div>

      {footer && (
        <div className={cn(
          "flex justify-between items-center",
          isDesktop ? "px-6 py-3" : "px-4 py-2.5",
          isLoss ? "bg-[#3d0f0f] border-t border-[#F87171]" : "bg-[#0C1319] border-t border-white/5"
        )}>
          {footer}
        </div>
      )}
    </Card>
  )
}
