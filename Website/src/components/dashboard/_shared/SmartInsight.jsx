import React from 'react';
import { motion } from 'framer-motion';
import { TrendingUp, TrendingDown, Sparkles } from 'lucide-react';
import { cn } from '@/lib/utils';

/**
 * SmartInsight - A premium UI component for dashboard insights
 * Inspired by modern SaaS design (21dev style)
 * 
 * @param {Object} insight - { type: 'up' | 'down', value: string, text: string }
 * @param {string} className - Additional CSS classes
 */
export default function SmartInsight({ insight, className }) {
  if (!insight) return null;

  const isUp = insight.type === 'up';
  
  return (
    <motion.div
      initial={{ opacity: 0, scale: 0.95, y: 10 }}
      animate={{ opacity: 1, scale: 1, y: 0 }}
      transition={{ duration: 0.4, ease: [0.23, 1, 0.32, 1] }}
      className={cn(
        "inline-flex items-center gap-2.5 px-3.5 py-1.5 rounded-full border transition-all duration-300",
        isUp 
          ? "bg-emerald-500/10 border-emerald-500/20 text-emerald-600 dark:text-emerald-400 shadow-sm" 
          : "bg-rose-500/10 border-rose-500/20 text-rose-600 dark:text-rose-400 shadow-sm",
        className
      )}
    >
      <div className={cn(
        "flex items-center justify-center w-5 h-5 rounded-full shrink-0",
        isUp ? "bg-emerald-500/20" : "bg-rose-500/20"
      )}>
        {isUp ? (
          <TrendingUp size={12} strokeWidth={3} />
        ) : (
          <TrendingDown size={12} strokeWidth={3} />
        )}
      </div>

      <div className="flex items-center gap-1.5">
        <span className="text-[11px] font-black tracking-wide uppercase">
          {isUp ? 'Profit Growth' : 'Profit Declining'}
        </span>
        {insight.value !== undefined &&
          insight.value !== null &&
          insight.value !== '' &&
          insight.value !== '-' &&
          insight.value !== '- %' &&
          !String(insight.value).includes('NaN') &&
          !String(insight.value).includes('undefined') &&
          !isNaN(Number(insight.value)) && (
            <>
              <span className="w-1 h-1 rounded-full bg-current opacity-30" />
              <span className="text-[12px] font-bold tabular-nums">
                {isUp ? '+' : '-'}{insight.value}%
              </span>
            </>
          )}
      </div>

      <div className="h-3 w-px bg-current opacity-10 mx-0.5" />

      <p className="text-[11px] font-semibold text-slate-600 dark:text-slate-200 whitespace-nowrap">
        dibanding minggu lalu
      </p>

      {isUp && (
        <motion.div
          animate={{ 
            opacity: [0.4, 1, 0.4],
            scale: [1, 1.2, 1]
          }}
          transition={{ 
            duration: 2,
            repeat: Infinity,
            ease: "easeInOut"
          }}
        >
          <Sparkles size={10} className="text-emerald-300" />
        </motion.div>
      )}
    </motion.div>
  );
}
