import React, { forwardRef } from 'react'
import { ClipboardPaste, Loader2 } from 'lucide-react'
import { Input } from './input'
import { cn } from '@/lib/utils'
import { normalizePhone } from '@/lib/format'
import { toast } from 'sonner'

const PhoneInput = forwardRef(({ className, onChange, value, ...props }, ref) => {
  const [isPasting, setIsPasting] = React.useState(false)

  const handlePasteClick = async () => {
    try {
      setIsPasting(true)
      const text = await navigator.clipboard.readText()
      if (text) {
        const normalized = normalizePhone(text)
        if (onChange) {
          // Mocking event for compatibility with various form libraries
          onChange({ target: { value: normalized } })
        }
        toast.success('Nomor HP ditempel & dinormalisasi', {
          description: `${text} → ${normalized}`,
          duration: 2000
        })
      }
    } catch (_err) {
      toast.error('Gagal membaca clipboard', {
        description: 'Pastikan Anda memberi izin akses clipboard di browser.'
      })
    } finally {
      setIsPasting(false)
    }
  }

  // Handle manual typing/paste normalization
  const handleChange = (e) => {
    const val = e.target.value
    // We only clean non-digits here during typing to prevent invalid chars
    // But full normalization (like adding 0) usually happens on blur or if pasted
    const cleaned = val.replace(/[^\d+]/g, '') 
    if (onChange) {
      onChange({ ...e, target: { ...e.target, value: cleaned } })
    }
  }

  const handleBlur = (e) => {
    const val = e.target.value
    const normalized = normalizePhone(val)
    if (onChange && normalized !== val) {
      onChange({ ...e, target: { ...e.target, value: normalized } })
    }
    if (props.onBlur) props.onBlur(e)
  }

  return (
    <div className="relative group w-full">
      <Input
        type="tel"
        ref={ref}
        value={value}
        onChange={handleChange}
        onBlur={handleBlur}
        className={cn("pr-12 font-black tracking-wider uppercase", className)}
        placeholder="0812..."
        {...props}
      />
      <button
        type="button"
        onClick={handlePasteClick}
        disabled={isPasting}
        className="absolute right-2 top-1/2 -translate-y-1/2 w-8 h-8 rounded-lg bg-emerald-500/10 border border-emerald-500/20 flex items-center justify-center text-emerald-400 hover:bg-emerald-500/20 transition-all active:scale-90 z-10"
        title="Tempel dari Clipboard"
      >
        {isPasting ? <Loader2 size={14} className="animate-spin text-emerald-400" /> : <ClipboardPaste size={14} />}
      </button>
    </div>
  )
})

PhoneInput.displayName = 'PhoneInput'

export { PhoneInput }
