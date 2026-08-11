import React from 'react'
import { Card } from '@/components/ui/card'
import { motion } from 'framer-motion'
import { ArrowUpRight, ArrowDownRight } from 'lucide-react'

export default function KPICard({ label, value, sub, icon: Icon, trend, _variant = 'default' }) {
  const isPositive = trend > 0
  const _isNegative = trend < 0

  return (
    <Card className={`p-6 bg-[#0C1319] border border-border rounded-3xl hover:border-white/10 transition-all group relative overflow-hidden`}>
      {/* Decorative background gradient */}
      <div className="absolute top-0 right-0 w-32 h-32 bg-emerald-500/5 blur-3xl rounded-full -mr-16 -mt-16 pointer-events-none" />
      
      <div className="flex items-start justify-between relative z-10">
        <div className="flex flex-col gap-1">
          <p className="text-[11px] font-bold text-muted-foreground uppercase tracking-wider font-body">
            {label}
          </p>
          <div className="flex items-baseline gap-2 mt-1">
            <h3 className="text-3xl font-display font-extrabold text-[#F1F5F9] tracking-tight">
              {value}
            </h3>
            {trend && (
              <div className={`flex items-center gap-0.5 text-[11px] font-bold px-1.5 py-0.5 rounded-full ${
                isPositive ? 'bg-emerald-500/10 text-emerald-400' : 'bg-red-500/10 text-red-400'
              }`}>
                {isPositive ? <ArrowUpRight size={10} strokeWidth={3} /> : <ArrowDownRight size={10} strokeWidth={3} />}
                {Math.abs(trend)}%
              </div>
            )}
          </div>
          {sub && (
            <p className="text-[12px] text-muted-foreground font-medium mt-1">
              {sub}
            </p>
          )}
        </div>
        
        {Icon && (
          <div className="w-12 h-12 rounded-2xl bg-secondary border border-border flex items-center justify-center text-emerald-400 group-hover:scale-110 transition-transform duration-300">
            <Icon size={24} strokeWidth={1.5} />
          </div>
        )}
      </div>
    </Card>
  )
}
