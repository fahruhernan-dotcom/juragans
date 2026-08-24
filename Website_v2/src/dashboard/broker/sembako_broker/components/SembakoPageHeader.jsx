import React from 'react'
import { Search, Eye } from 'lucide-react'
import { Input } from '@/components/ui/input'
import { cn } from '@/lib/utils'

export function SembakoPageHeader({
  title,
  subtitle,
  isDesktop,
  searchQuery,
  onSearchChange,
  searchPlaceholder = 'Cari data...',
  filters = [],
  activeFilter,
  onFilterChange,
  actionButton,
  isViewOnly = false,
}) {
  return (
    <header className={`px-4 sm:px-6 pt-4 pb-3 ${isDesktop ? 'relative' : 'sticky top-[60px]'} bg-background/95 backdrop-blur-md z-30 border-b border-border/40`}>
      <div className="flex items-center justify-between gap-3 mb-3">
        <div className="min-w-0 hidden lg:block">
          <h1 className="font-sans text-[17px] sm:text-[19px] font-bold text-foreground tracking-tight leading-tight">
            {title}
          </h1>
          {subtitle && (
            <p className="text-[11px] text-muted-foreground mt-0.5 font-medium">
              {subtitle}
            </p>
          )}
        </div>

        <div className="flex items-center gap-2 shrink-0">
          {onSearchChange && (
            <div className="relative max-w-xs hidden md:block">
              <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground" />
              <Input
                value={searchQuery}
                onChange={(e) => onSearchChange(e.target.value)}
                placeholder={searchPlaceholder}
                className="pl-9 h-9 w-52 bg-card border-border/60 rounded-xl font-medium text-xs text-foreground placeholder:text-muted-foreground focus-visible:ring-1 focus-visible:ring-slate-500/30"
              />
            </div>
          )}
          {actionButton}
        </div>
      </div>

      {onSearchChange && (
        <div className="md:hidden relative w-full mb-3">
          <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground" />
          <Input
            value={searchQuery}
            onChange={(e) => onSearchChange(e.target.value)}
            placeholder={searchPlaceholder}
            className="pl-9 h-9 w-full bg-card border-border/60 rounded-xl font-medium text-xs text-foreground placeholder:text-muted-foreground focus-visible:ring-1 focus-visible:ring-slate-500/30"
          />
        </div>
      )}

      {filters.length > 0 && (
        <div className="flex items-center gap-1.5 overflow-x-auto scrollbar-hide pb-0.5">
          {filters.map((filter) => (
            <button
              key={filter.id}
              onClick={() => onFilterChange?.(filter.id)}
              className={cn(
                'px-3 py-1 rounded-full text-[11px] font-semibold transition-all whitespace-nowrap cursor-pointer select-none',
                activeFilter === filter.id
                  ? 'bg-[#0F172A] text-white'
                  : 'bg-card text-muted-foreground hover:text-foreground border border-border/60 hover:border-border'
              )}
            >
              {filter.label}
            </button>
          ))}
        </div>
      )}

      {isViewOnly && (
        <div className="bg-[#0F172A]/10 border border-[#0F172A]/20 rounded-xl px-4 py-2.5 flex items-center gap-2 text-[#0F172A] dark:text-slate-300 text-xs font-semibold mt-3">
          <Eye className="w-4 h-4 shrink-0" />
          <span>
            Mode <strong className="font-bold">View Only</strong> (Hanya bisa melihat data)
          </span>
        </div>
      )}
    </header>
  )
}
