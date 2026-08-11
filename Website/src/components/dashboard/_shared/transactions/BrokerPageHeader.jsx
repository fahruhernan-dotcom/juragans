import React from 'react'
import { Search, Eye } from 'lucide-react'
import { Input } from '@/components/ui/input'
import { cn } from '@/lib/utils'

/**
 * BrokerPageHeader - Universal header for any broker transaction page.
 * Theme-adaptive: light mode uses white surface + dark text; dark mode preserves original dark aesthetic.
 */
export function BrokerPageHeader({ 
  title = "Transaksi",
  subtitle,
  isDesktop,
  searchQuery,
  onSearchChange,
  searchPlaceholder = "Cari data...",
  filters = [],
  activeFilter,
  onFilterChange,
  actionButton,
  isViewOnly 
}) {
  return (
    <header className="px-4 pt-6 pb-3 md:px-5 md:pt-8 md:pb-4 sticky top-0 z-30 space-y-3 md:space-y-4 bg-white dark:bg-[#06090F] border-b border-slate-200 dark:border-white/[0.04]">
      <div className="flex flex-wrap items-center gap-2 md:gap-4 md:flex-nowrap md:justify-between">
        <div className="flex-1 min-w-0">
          <h1 className="font-display text-xl md:text-2xl font-black text-slate-900 dark:text-white tracking-tight uppercase leading-none truncate">{title}</h1>
          {subtitle && (
            <p className={cn("font-bold text-slate-500 dark:text-[#4B6478] uppercase mt-1 tracking-widest", isDesktop ? "text-[10px]" : "text-xs")}>
              {subtitle}
            </p>
          )}
        </div>
        <div className="flex items-center gap-2 md:gap-3 shrink-0 md:flex-1 md:justify-end">
          {onSearchChange && (
            <div className="relative max-w-xs w-full hidden md:block">
              <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 dark:text-[#4B6478]" />
              <Input
                value={searchQuery}
                onChange={(e) => onSearchChange(e.target.value)}
                placeholder={searchPlaceholder}
                className="pl-9 h-10 w-full bg-slate-100 dark:bg-[#111C24] border-slate-200 dark:border-white/5 rounded-xl font-bold text-xs text-slate-900 dark:text-white placeholder:text-slate-400 dark:placeholder:text-[#4B6478]"
              />
            </div>
          )}
          {actionButton}
        </div>
      </div>

      {/* Mobile Search */}
      {onSearchChange && (
        <div className="md:hidden mt-4 relative w-full">
          <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 dark:text-[#4B6478]" />
          <Input
            value={searchQuery}
            onChange={(e) => onSearchChange(e.target.value)}
            placeholder={searchPlaceholder}
            className="pl-9 h-10 w-full bg-slate-100 dark:bg-[#111C24] border-slate-200 dark:border-white/5 rounded-xl font-bold text-xs text-slate-900 dark:text-white placeholder:text-slate-400 dark:placeholder:text-[#4B6478]"
          />
        </div>
      )}

      {/* Filter Chips */}
      {filters.length > 0 && (
        <div className="flex items-center gap-2 overflow-x-auto no-scrollbar pb-1">
          {filters.map(f => (
            <button
              key={f.id}
              onClick={() => onFilterChange?.(f.id)}
              className={cn(
                "px-4 py-1.5 rounded-full text-[10px] font-black uppercase tracking-widest transition-all whitespace-nowrap",
                activeFilter === f.id
                  ? "bg-emerald-500 text-white shadow-lg shadow-emerald-500/20"
                  : "bg-slate-100 dark:bg-[#111C24] text-slate-500 dark:text-[#4B6478] hover:text-emerald-600 dark:hover:text-emerald-400 border border-slate-200 dark:border-white/5"
              )}
            >
              {f.label}
            </button>
          ))}
        </div>
      )}

      {isViewOnly && (
        <div className="bg-slate-50 dark:bg-[#0C1319] border border-slate-200 dark:border-white/[0.08] rounded-xl px-4 py-2 flex items-center gap-2">
          <Eye className="w-4 h-4 text-slate-400 dark:text-[#4B6478]" />
          <span className="text-slate-500 dark:text-[#4B6478] text-xs">
            Kamu dalam mode <strong className="text-slate-700 dark:text-[#94A3B8]">View Only</strong> — hanya bisa melihat data
          </span>
        </div>
      )}
    </header>
  )
}
