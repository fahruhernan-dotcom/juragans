import React, { useState, useEffect, useRef, useMemo } from 'react'
import { Sheet, SheetContent, SheetDescription, SheetHeader, SheetTitle, SheetTrigger } from './sheet'
import { Button } from './button'
import { CalendarIcon } from 'lucide-react'
import { format, getDaysInMonth, isValid, subYears } from 'date-fns'
import { id as idLocale } from 'date-fns/locale/id'
import { cn } from '@/lib/utils'

const ITEM_HEIGHT = 40
const VISIBLE_ITEMS = 5
const CONTAINER_HEIGHT = ITEM_HEIGHT * VISIBLE_ITEMS // 200px

function WheelColumn({ items, value, onChange }) {
  const scrollRef = useRef(null)
  const isProgrammaticScroll = useRef(false)
  const debounceRef = useRef(null)

  // Scroll to selected item on mount or when value changes externally (instant — no animation)
  useEffect(() => {
    const index = items.findIndex(item => item.value === value)
    if (index === -1) return
    const apply = () => {
      if (!scrollRef.current) return
      isProgrammaticScroll.current = true
      scrollRef.current.scrollTo({ top: index * ITEM_HEIGHT, behavior: 'instant' })
      setTimeout(() => { isProgrammaticScroll.current = false }, 50)
    }
    // defer one frame so the Sheet open-animation doesn't race with scroll
    requestAnimationFrame(apply)
  }, [value, items])

  const handleScroll = (e) => {
    if (isProgrammaticScroll.current) return

    if (debounceRef.current) clearTimeout(debounceRef.current)
    
    // We don't snap via JS because CSS snap-y handles it.
    // We just wait for scrolling to stop to update the value.
    debounceRef.current = setTimeout(() => {
      const y = e.target.scrollTop
      const index = Math.max(0, Math.min(items.length - 1, Math.round(y / ITEM_HEIGHT)))
      
      if (items[index] && items[index].value !== value) {
        onChange(items[index].value)
      }
    }, 150)
  }

  return (
    <div className="flex-1 relative overflow-hidden touch-none min-w-0" style={{ height: CONTAINER_HEIGHT, touchAction: 'none' }}>
      {/* Highlight Box */}
      <div 
        className="absolute w-full left-0 right-0 pointer-events-none bg-slate-900/[0.03] dark:bg-white/[0.03] border-y border-slate-200 dark:border-white/[0.08] z-0"
        style={{ top: '50%', transform: 'translateY(-50%)', height: ITEM_HEIGHT }}
      />
      
      {/* Scrollable Container */}
      <div
        ref={scrollRef}
        onScroll={handleScroll}
        className="h-full overflow-y-auto scrollbar-hide snap-y snap-mandatory relative z-10"
        style={{ scrollbarWidth: 'none', msOverflowStyle: 'none' }}
      >
        {/* Top Padding */}
        <div style={{ height: (CONTAINER_HEIGHT - ITEM_HEIGHT) / 2 }} className="snap-align-none" />
        
        {items.map((item) => (
          <div 
            key={item.value} 
            className={cn(
              "flex items-center justify-center snap-center transition-all duration-200 text-center line-clamp-1",
              item.value === value 
                ? "text-[17px] text-slate-950 dark:text-white font-semibold tracking-wide" 
                : "text-[15px] text-slate-400 dark:text-slate-500 font-medium opacity-50"
            )}
            style={{ height: ITEM_HEIGHT }}
          >
            {item.label}
          </div>
        ))}

        {/* Bottom Padding */}
        <div style={{ height: (CONTAINER_HEIGHT - ITEM_HEIGHT) / 2 }} className="snap-align-none" />
      </div>
    </div>
  )
}

export function MobileWheelDatePicker({ 
  value, 
  onChange, 
  placeholder = "Pilih Tanggal",
  minYear = 1950,
  maxYear = new Date().getFullYear(),
  defaultAge = 25 // Optional: stops at this age if no value provided
}) {
  const [isOpen, setIsOpen] = useState(false)
  const defaultDate = useMemo(() => subYears(new Date(), defaultAge), [defaultAge])
  
  const parsedDate = value ? new Date(value) : null
  const initDate = (parsedDate && isValid(parsedDate)) ? parsedDate : defaultDate

  const [day, setDay] = useState(initDate.getDate())
  const [month, setMonth] = useState(initDate.getMonth() + 1)
  const [year, setYear] = useState(initDate.getFullYear())

  // Ensure day is valid for month/year
  useEffect(() => {
    const maxDays = getDaysInMonth(new Date(year, month - 1))
    if (day > maxDays) setDay(maxDays)
  }, [month, year, day])

  const days = useMemo(() => {
    const maxDays = getDaysInMonth(new Date(year, month - 1))
    return Array.from({ length: maxDays }, (_, i) => ({ value: i + 1, label: String(i + 1).padStart(2, '0') }))
  }, [month, year])

  const months = useMemo(() => [
    { value: 1, label: 'Jan' }, { value: 2, label: 'Feb' }, { value: 3, label: 'Mar' },
    { value: 4, label: 'Apr' }, { value: 5, label: 'Mei' }, { value: 6, label: 'Jun' },
    { value: 7, label: 'Jul' }, { value: 8, label: 'Agt' }, { value: 9, label: 'Sep' },
    { value: 10, label: 'Okt' }, { value: 11, label: 'Nov' }, { value: 12, label: 'Des' }
  ], [])

  const years = useMemo(() => {
    return Array.from({ length: maxYear - minYear + 1 }, (_, i) => ({
      value: maxYear - i,
      label: String(maxYear - i)
    }))
  }, [minYear, maxYear])

  const handleConfirm = () => {
    const selectedDate = new Date(year, month - 1, day)
    onChange(format(selectedDate, 'yyyy-MM-dd'))
    setIsOpen(false)
  }

  // Update internal state when opened and value exists
  useEffect(() => {
    if (isOpen && parsedDate && isValid(parsedDate)) {
      setDay(parsedDate.getDate())
      setMonth(parsedDate.getMonth() + 1)
      setYear(parsedDate.getFullYear())
    }
  }, [isOpen, value])

  return (
    <Sheet open={isOpen} onOpenChange={setIsOpen}>
      <SheetTrigger asChild>
        <Button
          variant="outline"
          className={cn(
            "h-12 w-full rounded-xl px-4 flex items-center justify-start gap-3 transition-all",
            "bg-slate-50 border-slate-200 hover:bg-slate-100 hover:border-slate-300",
            "dark:bg-slate-900 dark:border-slate-800 dark:hover:bg-slate-800 dark:hover:border-slate-700",
            !value && "text-slate-400 dark:text-slate-500",
            value && "text-slate-900 font-semibold text-sm dark:text-slate-200"
          )}
        >
          <CalendarIcon size={18} className={cn("transition-colors", value ? "text-slate-900 dark:text-slate-200" : "text-slate-400 dark:text-slate-500")} />
          <span className="flex-1 text-left">
            {value && isValid(new Date(value))
              ? format(new Date(value), 'dd MMM yyyy', { locale: idLocale })
              : placeholder}
          </span>
        </Button>
      </SheetTrigger>
      
      <SheetContent side="bottom" className="bg-white dark:bg-[#111C24] border-t border-slate-200 dark:border-white/10 px-0 pb-6 pt-4 rounded-t-3xl overflow-hidden animate-in fade-in slide-in-from-bottom duration-300">
        <SheetHeader className="px-6 mb-4">
          <SheetTitle className="text-center text-lg text-slate-900 dark:text-white font-bold">{placeholder}</SheetTitle>
          <SheetDescription className="sr-only">Pilih tanggal</SheetDescription>
        </SheetHeader>
        
        <div className="flex px-6 items-center justify-center gap-2 relative select-none">
          {/* Fading Overlays */}
          <div className="absolute inset-x-0 top-0 h-[36px] bg-gradient-to-b from-white dark:from-[#111C24] to-transparent z-20 pointer-events-none" />
          <div className="absolute inset-x-0 bottom-0 h-[36px] bg-gradient-to-t from-white dark:from-[#111C24] to-transparent z-20 pointer-events-none" />
          
          <WheelColumn items={days} value={day} onChange={setDay} />
          <WheelColumn items={months} value={month} onChange={setMonth} />
          <WheelColumn items={years} value={year} onChange={setYear} />
        </div>

        <div className="px-6 mt-8">
          <Button 
            onClick={handleConfirm}
            className="w-full h-14 bg-slate-900 hover:bg-slate-800 text-white dark:bg-white dark:hover:bg-slate-100 dark:text-[#111C24] rounded-2xl font-bold text-[15px] shadow-lg shadow-black/5 dark:shadow-white/5"
          >
            Pilih Tanggal
          </Button>
        </div>
      </SheetContent>
    </Sheet>
  )
}
