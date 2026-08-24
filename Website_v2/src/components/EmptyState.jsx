import React from 'react'
import { motion } from 'framer-motion'
import { cn } from '@/lib/utils'

const EmptyState = ({ icon: Icon, title, description, action, className }) => (
  <motion.div 
    initial={{ opacity: 0, scale: 0.95 }}
    animate={{ opacity: 1, scale: 1 }}
    className={cn(
        "flex flex-col items-center justify-center py-12 px-6 text-center gap-3",
        className
    )}
  >
    <div className="w-16 h-16 bg-emerald-500/10 border border-emerald-500/20 rounded-full flex items-center justify-center relative group">
      <div className="absolute inset-0 bg-emerald-500/5 rounded-full blur-xl group-hover:bg-emerald-500/10 transition-colors" />
      <Icon size={28} className="text-emerald-400 relative z-10" strokeWidth={1.5} />
    </div>
    
    <h3 className="font-display text-[17px] font-black text-[#F1F5F9] mt-2 uppercase tracking-tight">
      {title}
    </h3>
    
    <p className="font-sans text-[14px] text-[#4B6478] font-bold leading-relaxed max-w-[260px]">
      {description}
    </p>

    {action && (
      <motion.div 
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.2 }}
        className="mt-4"
      >
        {action}
      </motion.div>
    )}
  </motion.div>
)

export default EmptyState
