import { useState } from 'react'
import { motion } from 'framer-motion'
import { ChevronDown } from 'lucide-react'
import { Collapsible, CollapsibleTrigger, CollapsibleContent } from '@/components/ui/collapsible'

export default function FAQItem({ q, a, isSembako }) {
  const [open, setOpen] = useState(false)
  const accent = isSembako ? 'text-amber-400' : 'text-emerald-400'
  const borderActive = isSembako ? 'border-amber-500/30' : 'border-emerald-500/30'

  return (
    <Collapsible open={open} onOpenChange={setOpen}>
      <div className={`rounded-2xl border transition-all duration-200 overflow-hidden ${open ? `bg-white/[0.03] ${borderActive}` : 'bg-[#111C24] border-white/8 hover:border-white/15'}`}>
        <CollapsibleTrigger asChild>
          <button
            type="button"
            className="w-full flex items-center justify-between gap-4 px-6 py-4 text-left cursor-pointer"
          >
            <span className="text-sm font-semibold text-white leading-snug">{q}</span>
            <motion.span
              animate={{ rotate: open ? 180 : 0 }}
              transition={{ duration: 0.2 }}
              className={`shrink-0 ${open ? accent : 'text-[#4B6478]'}`}
            >
              <ChevronDown size={16} />
            </motion.span>
          </button>
        </CollapsibleTrigger>
        <CollapsibleContent>
          <div className="px-6 pb-5">
            <p className="text-sm text-[#94A3B8] leading-relaxed">{a}</p>
          </div>
        </CollapsibleContent>
      </div>
    </Collapsible>
  )
}
