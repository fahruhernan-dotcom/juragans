import React from 'react'
import { Check } from 'lucide-react'
import { useTheme, THEME_PRESETS } from '../../lib/hooks/useTheme'

/**
 * Compact color-swatch theme picker.
 * Renders a row of 8 preset color swatches.
 * Active swatch shows a checkmark. Clicking a swatch changes the accent color.
 */
export default function ThemePicker() {
  const { accentColor, setTheme } = useTheme()

  return (
    <div>
      <p style={{ fontSize: 11, fontWeight: 600, color: '#4B6478', textTransform: 'uppercase', letterSpacing: '0.08em', marginBottom: 10 }}>
        Tema Warna
      </p>
      <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
        {THEME_PRESETS.map((preset) => {
          const isActive = accentColor === preset.hex
          return (
            <button
              key={preset.hex}
              title={preset.label}
              onClick={() => setTheme(isActive ? null : preset.hex)}
              style={{
                width: 32,
                height: 32,
                borderRadius: '50%',
                background: preset.hex,
                border: isActive ? `3px solid ${preset.hex}` : '3px solid transparent',
                outline: isActive ? '2px solid rgba(255,255,255,0.5)' : '2px solid transparent',
                cursor: 'pointer',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                transition: 'transform 0.15s, outline 0.15s',
                transform: isActive ? 'scale(1.15)' : 'scale(1)',
                flexShrink: 0,
              }}
            >
              {isActive && <Check size={14} color="white" strokeWidth={3} />}
            </button>
          )
        })}
      </div>
      {accentColor && (
        <button
          onClick={() => setTheme(null)}
          style={{ marginTop: 8, fontSize: 11, color: '#4B6478', background: 'none', border: 'none', cursor: 'pointer', padding: 0 }}
        >
          Reset ke default
        </button>
      )}
    </div>
  )
}
