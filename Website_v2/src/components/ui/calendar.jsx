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
      className={cn("p-3 sm:p-4 bg-white dark:bg-[#111C24] text-slate-900 dark:text-[#F1F5F9] border border-slate-200 dark:border-white/10 rounded-2xl shadow-2xl", className)}
      classNames={{
        months: "flex flex-col sm:flex-row gap-4",
        month: "flex flex-col gap-3 p-1",
        month_caption: "flex justify-center items-center h-10 relative mb-2",
        caption_label: "text-xs font-black uppercase tracking-wider text-slate-900 dark:text-white",
        nav: "flex items-center justify-between absolute inset-x-0 top-0 z-10",
        button_previous: cn(
          buttonVariants({ variant: "ghost" }),
          "h-8 w-8 sm:h-9 sm:w-9 p-0 text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-white/10 rounded-xl transition-all border border-slate-200 dark:border-transparent cursor-pointer"
        ),
        button_next: cn(
          buttonVariants({ variant: "ghost" }),
          "h-8 w-8 sm:h-9 sm:w-9 p-0 text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-white/10 rounded-xl transition-all border border-slate-200 dark:border-transparent cursor-pointer"
        ),
        month_grid: "w-full border-collapse",
        weekdays: "flex justify-between mb-3 px-1",
        weekday: "text-slate-400 dark:text-[#4B6478] w-9 sm:w-10 font-black text-[10px] uppercase tracking-wider text-center",
        week: "flex w-full mt-1.5 justify-between",
        day: "p-0 flex items-center justify-center",
        day_button: cn(
          "h-9 w-9 sm:h-10 sm:w-10 p-0 font-bold text-xs uppercase tracking-tight transition-all rounded-xl flex items-center justify-center text-slate-800 dark:text-white hover:bg-slate-100 dark:hover:bg-[#162230] cursor-pointer"
        ),
        today: "text-[#0EA5E9] font-black underline underline-offset-4",
        selected: "!bg-[#0F172A] !text-white hover:!bg-slate-800 focus:!bg-[#0F172A] shadow-md rounded-xl font-black",
        outside: "text-slate-300 dark:text-[#4B6478] opacity-30 pointer-events-none",
        disabled: "text-slate-300 dark:text-[#4B6478] opacity-20 pointer-events-none",
        range_middle: "aria-selected:bg-slate-100 dark:aria-selected:bg-[#162230] aria-selected:text-slate-900 dark:aria-selected:text-white rounded-none",
        range_start: "aria-selected:!bg-[#0F172A] aria-selected:!text-white rounded-l-xl",
        range_end: "aria-selected:!bg-[#0F172A] aria-selected:!text-white rounded-r-xl",
        ...classNames,
      }}
      components={{
        Chevron: ({ orientation }) => {
          if (orientation === "left") return <ChevronLeft size={16} strokeWidth={2.5} />
          if (orientation === "right") return <ChevronRight size={16} strokeWidth={2.5} />
          return null
        }
      }}
      {...props}
    />
  )
}

export { Calendar }
