import React, { useState } from 'react'
import { motion } from 'framer-motion'

export function SectionHeader({ label, action, onAction, className = '' }) {
  return (
    <div className={`flex items-baseline justify-between px-5 mb-3 ${className}`}>
      <h2 className="m-0 text-[13px] font-semibold tracking-wide uppercase text-[#94A3B8]">
        {label}
      </h2>
      {action && (
        <button
          onClick={onAction}
          className="bg-transparent border-none p-0 text-emerald-500 text-[14px] font-semibold cursor-pointer active:opacity-70 transition-opacity"
        >
          {action}
        </button>
      )}
    </div>
  )
}

export function Card({ children, className = '', onClick, padded = true }) {
  return (
    <div
      onClick={onClick}
      className={`bg-[#0A0E0C] border border-white/10 rounded-[20px] shadow-sm ${padded ? 'p-5' : 'p-0'} ${onClick ? 'cursor-pointer active:scale-[0.98] transition-transform' : ''} ${className}`}
    >
      {children}
    </div>
  )
}

export function Pill({ tone = 'neutral', children, size = 'sm', className = '' }) {
  const tones = {
    neutral: 'bg-white/10 text-[#94A3B8]',
    accent:  'bg-emerald-500/10 text-emerald-500',
    danger:  'bg-red-500/10 text-red-500',
    warn:    'bg-amber-500/10 text-amber-500',
    ok:      'bg-emerald-500/10 text-emerald-500',
  }
  const bgFg = tones[tone] || tones.neutral
  const sizeClasses = size === 'sm' ? 'px-[9px] py-[3px] text-[11px]' : 'px-3 py-1.5 text-[13px]'
  return (
    <span className={`inline-flex items-center gap-1.5 rounded-full font-semibold tracking-wide leading-tight ${bgFg} ${sizeClasses} ${className}`}>
      {children}
    </span>
  )
}

export function Pressable({ children, onPress, className = '' }) {
  const [active, setActive] = useState(false)
  return (
    <div
      onPointerDown={() => setActive(true)}
      onPointerUp={() => setActive(false)}
      onPointerLeave={() => setActive(false)}
      onClick={onPress}
      className={`cursor-pointer transition-transform duration-120 ease-out ${active ? 'scale-95' : 'scale-100'} ${className}`}
    >
      {children}
    </div>
  )
}

export function BigNumber({ value, unit, sub, colorClass = 'text-white', className = '' }) {
  return (
    <div className={className}>
      <div className="flex items-baseline gap-1">
        <span className={`font-display text-4xl font-semibold leading-none tracking-tight tabular-nums ${colorClass}`}>
          {value}
        </span>
        {unit && <span className="text-[14px] font-medium text-[#94A3B8]">{unit}</span>}
      </div>
      {sub && <div className="mt-1.5 text-[13px] text-[#94A3B8] font-medium">{sub}</div>}
    </div>
  )
}

export function ProgressBar({ value, max = 100, tone = 'accent', className = '' }) {
  const pct = Math.min(100, Math.max(0, (value / max) * 100))
  const fillColors = {
    danger: 'bg-red-500',
    warn: 'bg-amber-500',
    accent: 'bg-emerald-500',
  }
  const fillColor = fillColors[tone] || fillColors.accent
  return (
    <div className={`h-1.5 rounded-full bg-white/10 overflow-hidden ${className}`}>
      <div
        className={`h-full rounded-full transition-all duration-700 ease-out ${fillColor}`}
        style={{ width: `${pct}%` }}
      />
    </div>
  )
}

export function DonutRing({ value, max, size = 64, stroke = 6, color = '#021a02', children, className = '' }) {
  const r = (size - stroke) / 2
  const c = 2 * Math.PI * r
  const pct = Math.min(1, value / max)
  const dash = c * pct
  return (
    <div className={`relative ${className}`} style={{ width: size, height: size }}>
      <svg width={size} height={size} style={{ transform: 'rotate(-90deg)' }}>
        <circle cx={size/2} cy={size/2} r={r} stroke="rgba(255,255,255,0.1)" strokeWidth={stroke} fill="none" />
        <circle
          cx={size/2} cy={size/2} r={r}
          stroke={color} strokeWidth={stroke} fill="none"
          strokeDasharray={`${dash} ${c}`}
          strokeLinecap="round"
          className="transition-[stroke-dasharray] duration-700 ease-out"
        />
      </svg>
      <div className="absolute inset-0 flex items-center justify-center">{children}</div>
    </div>
  )
}

export function Sparkline({ data, color = '#021a02', height = 36, width = 100, className = '' }) {
  if (!data || data.length < 2) return null
  const min = Math.min(...data)
  const max = Math.max(...data)
  const range = max - min || 1
  const pts = data.map((v, i) => {
    const x = (i / (data.length - 1)) * width
    const y = height - ((v - min) / range) * height * 0.9 - height * 0.05
    return [x, y]
  })
  const d = pts.map(([x, y], i) => (i === 0 ? `M${x},${y}` : `L${x},${y}`)).join(' ')
  const area = `${d} L${width},${height} L0,${height} Z`
  return (
    <svg width={width} height={height} className={`block ${className}`}>
      <path d={area} fill={color} fillOpacity="0.12" />
      <path d={d} stroke={color} strokeWidth="1.5" fill="none" strokeLinecap="round" strokeLinejoin="round" />
      <circle cx={pts.at(-1)[0]} cy={pts.at(-1)[1]} r="2.5" fill={color} />
    </svg>
  )
}
