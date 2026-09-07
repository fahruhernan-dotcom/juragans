import * as React from 'react'
import { format } from 'date-fns'
import { id as idLocale } from 'date-fns/locale/id'
import { CalendarIcon, X } from 'lucide-react'
import { Calendar } from '@/components/ui/calendar'
import {
  Popover, PopoverContent, PopoverTrigger
} from '@/components/ui/popover'
import { Button } from '@/components/ui/button'
import { cn } from '@/lib/utils'
import { useIsMobile } from '@/lib/hooks/useMediaQuery'
import { MobileWheelDatePicker } from '@/components/ui/MobileWheelDatePicker'

export function DatePicker({ id, value, onChange, placeholder, className, allowClear = true }) {
  const isMobile = useIsMobile()
  const [open, setOpen] = React.useState(false)

  const dateValue = React.useMemo(() => {
    if (!value) return null
    if (value instanceof Date) return isNaN(value.getTime()) ? null : value
    if (typeof value === 'string') {
      const parts = value.split('T')[0].split('-')
      if (parts.length === 3) {
        const [y, m, d] = parts.map(Number)
        const dt = new Date(y, m - 1, d)
        return isNaN(dt.getTime()) ? null : dt
      }
    }
    const parsed = new Date(value)
    return isNaN(parsed.getTime()) ? null : parsed
  }, [value])

  if (isMobile) {
    return (
      <div className="relative w-full">
        <MobileWheelDatePicker 
          value={value} 
          onChange={onChange} 
          placeholder={placeholder || 'PILIH TANGGAL'}
        />
        {value && allowClear && (
          <div
            onClick={(e) => {
              e.preventDefault()
              e.stopPropagation()
              onChange(null)
            }}
            className="absolute right-3 top-1/2 -translate-y-1/2 p-2 hover:bg-white/10 rounded-full cursor-pointer transition-colors z-10"
          >
            <X size={14} className="text-white/50 hover:text-white" />
          </div>
        )}
      </div>
    )
  }

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <div className="relative w-full">
        <PopoverTrigger asChild>
          <Button
            id={id}
            variant="outline"
            className={cn(
              "h-11 w-full rounded-xl px-3.5 flex items-center justify-start gap-2.5 transition-all text-left font-bold cursor-pointer",
              "bg-white border-slate-300 hover:bg-slate-50 hover:border-slate-400 text-slate-900 shadow-xs",
              "dark:bg-slate-900 dark:border-slate-800 dark:hover:bg-slate-800 dark:text-slate-100",
              !value && "text-slate-400 dark:text-slate-500 font-medium",
              className
            )}
          >
            <CalendarIcon size={16} className={cn("transition-colors shrink-0", value ? "text-[#0EA5E9]" : "text-slate-400")} />
            <span className="flex-1 truncate text-xs sm:text-sm">
              {dateValue
                ? format(dateValue, 'dd MMMM yyyy', { locale: idLocale })
                : (placeholder || 'PILIH TANGGAL')}
            </span>
          </Button>
        </PopoverTrigger>
        {value && allowClear && (
          <div
            onClick={(e) => {
              e.preventDefault()
              e.stopPropagation()
              onChange('')
            }}
            className="absolute right-3 top-1/2 -translate-y-1/2 p-1 hover:bg-slate-100 dark:hover:bg-white/10 rounded-full cursor-pointer transition-colors z-10"
            title="Hapus tanggal"
          >
            <X size={13} className="text-slate-400 hover:text-slate-600 dark:text-white/50 dark:hover:text-white" />
          </div>
        )}
      </div>
      <PopoverContent align="start" sideOffset={4} collisionPadding={16} className="w-auto p-0 border-none bg-transparent shadow-none">
        <Calendar
          mode="single"
          selected={dateValue}
          onSelect={(date) => {
            if (date) {
              onChange(format(date, 'yyyy-MM-dd'))
              setOpen(false)
            }
          }}
          locale={idLocale}
          initialFocus
        />
      </PopoverContent>
    </Popover>
  )
}
