import * as React from "react"
import { ChevronLeft, ChevronRight } from "lucide-react"
import { DayPicker } from "react-day-picker"

import { cn } from "@/lib/utils"
import { buttonVariants } from "@/components/ui/button"

function Calendar({
  className,
  classNames,
  showOutsideDays = true,
  ...props
}) {
  return (
    <DayPicker
      showOutsideDays={showOutsideDays}
      className={cn("p-4 bg-[#111C24] text-[#F1F5F9] border border-white/10 rounded-[28px] shadow-2xl", className)}
      classNames={{
        months: "flex flex-col sm:flex-row gap-4",
        month: "flex flex-col gap-4 p-1",
        month_caption: "flex justify-center items-center h-10 relative mb-2",
        caption_label: "text-xs font-black uppercase tracking-[0.2em] text-white",
        nav: "flex items-center justify-between absolute inset-x-0 top-0 z-10",
        button_previous: cn(
          buttonVariants({ variant: "ghost" }),
          "h-10 w-10 p-0 opacity-40 hover:opacity-100 hover:bg-white/5 text-white rounded-xl transition-all border border-transparent hover:border-white/10"
        ),
        button_next: cn(
          buttonVariants({ variant: "ghost" }),
          "h-10 w-10 p-0 opacity-40 hover:opacity-100 hover:bg-white/5 text-white rounded-xl transition-all border border-transparent hover:border-white/10"
        ),
        month_grid: "w-full border-collapse",
        weekdays: "flex justify-between mb-4 px-1",
        weekday: "text-[#4B6478] w-10 font-black text-[10px] uppercase tracking-widest text-center",
        week: "flex w-full mt-1.5 justify-between",
        day: "p-0 flex items-center justify-center",
        day_button: cn(
          "h-10 w-10 p-0 font-bold text-[11px] uppercase tracking-tight transition-all rounded-xl flex items-center justify-center hover:bg-[#162230] text-white",
        ),
        today: "text-[#EA580C] font-black underline underline-offset-4",
        selected: "bg-[#EA580C] text-white hover:bg-[#EA580C] hover:text-white focus:bg-[#EA580C] focus:text-white shadow-lg shadow-[#EA580C]/20",
        outside: "text-[#4B6478] opacity-20 pointer-events-none",
        disabled: "text-[#4B6478] opacity-10",
        range_middle: "aria-selected:bg-[#162230] aria-selected:text-white rounded-none",
        range_start: "aria-selected:bg-[#EA580C] aria-selected:text-white rounded-l-xl",
        range_end: "aria-selected:bg-[#EA580C] aria-selected:text-white rounded-r-xl",
        ...classNames,
      }}
      components={{
        Chevron: ({ orientation }) => {
          if (orientation === "left") return <ChevronLeft size={18} strokeWidth={2.5} />
          if (orientation === "right") return <ChevronRight size={18} strokeWidth={2.5} />
          return null
        }
      }}
      {...props}
    />
  )
}

export { Calendar }
