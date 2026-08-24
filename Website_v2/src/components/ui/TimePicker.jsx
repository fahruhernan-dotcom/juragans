import React, { useState, useEffect } from 'react'
import { Clock, ChevronUp, ChevronDown } from 'lucide-react'
import { format } from 'date-fns'

const S = {
  label: { fontSize: 11, fontWeight: 700, color: '#4B6478', textTransform: 'uppercase', letterSpacing: '0.1em', display: 'block', marginBottom: 6, fontFamily: 'Sora' },
}

const TimePicker = ({ value, onChange, label, className }) => {
  const getTimeString = () => {
    if (!value || typeof value !== 'string') return '08:00'
    if (value.includes('T')) {
      const parts = value.split('T')
      return parts[1] ? parts[1].substring(0, 5) : '08:00'
    }
    return value.includes(':') ? value : '08:00'
  }

  const timeStr = getTimeString()
  const parts = timeStr.split(':')
  
  // Local state for smooth typing experience
  const [displayHour, setDisplayHour] = useState(parts[0] || '08')
  const [displayMinute, setDisplayMinute] = useState(parts[1] || '00')

  // Sync with prop ONLY if parent value has significantly changed from our normalized local state.
  // This prevents the "09" -> "9" or snapping issue while typing.
  useEffect(() => {
    const ts = getTimeString()
    const p = ts.split(':')
    const h = (p[0] || '08').padStart(2, '0')
    const m = (p[1] || '00').padStart(2, '0')
    
    // Current normalized state
    const currentH = (displayHour || '08').padStart(2, '0')
    const currentM = (displayMinute || '00').padStart(2, '0')

    // Only update if parent really has something different than what we have/are typing
    if (h !== 'NaN' && h !== currentH) setDisplayHour(h)
    if (m !== 'NaN' && m !== currentM) setDisplayMinute(m)
  }, [value])

  const hour = displayHour === 'NaN' ? '08' : displayHour
  const minute = displayMinute === 'NaN' ? '00' : displayMinute
  
  const handleHourChange = (raw) => {
    // Only allow numbers, max 2
    const cleaned = raw.replace(/[^0-9]/g, '').substring(0, 2)
    setDisplayHour(cleaned)
    
    // Trigger parent ONLY if valid and complete (exactly 2 digits)
    // This allows typing "0" then "9" without premature updates
    const parsed = parseInt(cleaned)
    if (!isNaN(parsed) && cleaned.length === 2) {
      const hh = String(Math.min(23, Math.max(0, parsed))).padStart(2, '0')
      const today = format(new Date(), 'yyyy-MM-dd')
      const isISO = value && typeof value === 'string' && value.includes('T')
      if (value && !isISO) {
        onChange(`${hh}:${minute.padStart(2, '0')}`)
      } else {
        onChange(`${today}T${hh}:${minute.padStart(2, '0')}:00+07:00`)
      }
    }
  }
  
  const handleMinuteChange = (raw) => {
    const cleaned = raw.replace(/[^0-9]/g, '').substring(0, 2)
    setDisplayMinute(cleaned)
    
    const parsed = parseInt(cleaned)
    if (!isNaN(parsed) && cleaned.length === 2) {
      const mm = String(Math.min(59, Math.max(0, parsed))).padStart(2, '0')
      const today = format(new Date(), 'yyyy-MM-dd')
      const isISO = value && typeof value === 'string' && value.includes('T')
      if (value && !isISO) {
        onChange(`${hour.padStart(2, '0')}:${mm}`)
      } else {
        onChange(`${today}T${hour.padStart(2, '0')}:${mm}:00+07:00`)
      }
    }
  }

  const normalizeOnBlur = () => {
    const hh = String(parseInt(hour) || 0).padStart(2, '0')
    const mm = String(parseInt(minute) || 0).padStart(2, '0')
    setDisplayHour(hh)
    setDisplayMinute(mm)
    
    const isISO = value && typeof value === 'string' && value.includes('T')
    if (value && !isISO) {
      onChange(`${hh}:${mm}`)
    } else {
      const today = format(new Date(), 'yyyy-MM-dd')
      onChange(`${today}T${hh}:${mm}:00+07:00`)
    }
  }
  
  return (
    <div className={className}>
      {label && <label style={S.label}>{label}</label>}
      
      <div style={{
        display: 'flex',
        alignItems: 'center',
        gap: 6,
        background: '#111C24',
        border: '1px solid rgba(255,255,255,0.05)',
        borderRadius: '16px',
        padding: '10px 14px',
        height: '56px'
      }}>
        <Clock size={15} color="#4B6478" style={{flexShrink: 0}} />
        
        <input
          type="text"
          inputMode="numeric"
          maxLength={2}
          autoComplete="off"
          value={hour}
          onChange={e => handleHourChange(e.target.value)}
          onBlur={normalizeOnBlur}
          className="w-10 bg-transparent border-none outline-none text-base font-black text-white text-center p-0"
        />
        
        <span className="text-lg font-bold text-[#4B6478] mb-0.5">:</span>
        
        <input
          type="text"
          inputMode="numeric"
          maxLength={2}
          autoComplete="off"
          value={minute}
          onChange={e => handleMinuteChange(e.target.value)}
          onBlur={normalizeOnBlur}
          className="w-10 bg-transparent border-none outline-none text-base font-black text-white text-center p-0"
        />
        
        <div className="ml-auto flex flex-col gap-1">
          <button
            type="button"
            onClick={() => handleHourChange(String(parseInt(hour) + 1))}
            className="w-5 h-5 rounded-md bg-white/5 border border-white/5 flex items-center justify-center text-[#4B6478] hover:text-emerald-400 hover:bg-emerald-400/10 transition-all"
          >
            <Clock size={12} strokeWidth={3} className="hidden" /> {/* Fix: Keep structure */}
            <ChevronUp size={12} strokeWidth={3} />
          </button>
          <button
            type="button"
            onClick={() => handleHourChange(String(parseInt(hour) - 1))}
            className="w-5 h-5 rounded-md bg-white/5 border border-white/5 flex items-center justify-center text-[#4B6478] hover:text-emerald-400 hover:bg-emerald-400/10 transition-all"
          >
            <ChevronDown size={12} strokeWidth={3} />
          </button>
        </div>
      </div>
      <style>{`
        input[type=number]::-webkit-inner-spin-button,
        input[type=number]::-webkit-outer-spin-button {
          -webkit-appearance: none;
          margin: 0;
        }
        input[type=number] {
          -moz-appearance: textfield;
        }
      `}</style>
    </div>
  )
}

export { TimePicker }
