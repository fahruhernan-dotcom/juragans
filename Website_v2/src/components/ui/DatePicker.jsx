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
  const dateValue = value ? (value instanceof Date ? value : new Date(value)) : null

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
    <Popover>
      <div className="relative w-full">
        <PopoverTrigger asChild>
          <Button
            id={id}
            variant="outline"
            className={cn(
              "h-12 w-full rounded-xl px-4 flex items-center justify-start gap-3 transition-all",
              "bg-slate-50 border-slate-200 hover:bg-slate-100 hover:border-slate-300",
              "dark:bg-slate-900 dark:border-slate-800 dark:hover:bg-slate-800 dark:hover:border-slate-700",
              !value && "text-slate-400 dark:text-slate-500",
              value && "text-slate-900 font-semibold text-sm dark:text-slate-200",
              className
            )}
          >
            <CalendarIcon size={18} className={cn("transition-colors", value ? "text-slate-900 dark:text-slate-200" : "text-slate-400 dark:text-slate-500")} />
            <span className="flex-1 text-left">
              {dateValue && !isNaN(dateValue.getTime())
                ? format(dateValue, 'dd MMM yyyy', { locale: idLocale })
                : (placeholder || 'PILIH TANGGAL')}
            </span>
          </Button>
        </PopoverTrigger>
        {value && allowClear && (
          <div
            onClick={(e) => {
              e.preventDefault()
              e.stopPropagation()
              onChange(null)
            }}
            className="absolute right-3 top-1/2 -translate-y-1/2 p-2 hover:bg-slate-100 dark:hover:bg-white/10 rounded-full cursor-pointer transition-colors z-10"
          >
            <X size={14} className="text-slate-400 hover:text-slate-600 dark:text-white/50 dark:hover:text-white" />
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
            }
          }}
          locale={idLocale}
          initialFocus
        />
      </PopoverContent>
    </Popover>
  )
}
