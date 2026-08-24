import { useState, useEffect } from 'react'

const THEME_KEY = 'ternakos_accent_color'

export const THEME_PRESETS = [
  { name: 'Emerald',  hex: '#021a02', label: 'Default Broker' },
  { name: 'Slate',    hex: '#0F172A', label: 'Default Sembako' },
  { name: 'Purple',   hex: '#7C3AED', label: 'Default Peternak' },
  { name: 'Amber',    hex: '#F59E0B', label: 'Default RPA' },
  { name: 'Sky',      hex: '#0EA5E9', label: 'Sky Blue' },
  { name: 'Rose',     hex: '#F43F5E', label: 'Rose' },
  { name: 'Teal',     hex: '#14B8A6', label: 'Teal' },
  { name: 'Indigo',   hex: '#6366F1', label: 'Indigo' },
]

export function useTheme() {
  const [accentColor, setAccentColorState] = useState(null)

  useEffect(() => {
    setAccentColorState(localStorage.getItem(THEME_KEY) || null)
    const handler = () =>
      setAccentColorState(localStorage.getItem(THEME_KEY) || null)
    window.addEventListener('ternakos-theme-changed', handler)
    return () => window.removeEventListener('ternakos-theme-changed', handler)
  }, [])

  const setTheme = (color) => {
    if (color) localStorage.setItem(THEME_KEY, color)
    else localStorage.removeItem(THEME_KEY)
    window.dispatchEvent(new CustomEvent('ternakos-theme-changed'))
  }

  const resetTheme = () => setTheme(null)

  return { accentColor, setTheme, resetTheme }
}
