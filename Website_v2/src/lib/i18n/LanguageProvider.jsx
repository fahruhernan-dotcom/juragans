import React, { createContext, useState, useEffect, useCallback } from 'react'
import id from './dictionaries/id'
import en from './dictionaries/en'

const LANG_KEY = 'ternakos.language'
const DEFAULT_LANG = 'id'

export const SUPPORTED_LANGUAGES = [
  { code: 'id', label: 'Bahasa Indonesia', flag: '🇮🇩', native: 'Indonesia' },
  { code: 'en', label: 'English',          flag: '🇬🇧', native: 'English'   },
]

const DICTIONARIES = { id, en }

export const LanguageContext = createContext(null)

export function LanguageProvider({ children }) {
  const [lang, setLangState] = useState(() => {
    try {
      const stored = localStorage.getItem(LANG_KEY)
      if (stored === 'id' || stored === 'en') return stored
    } catch (_e) { /* ignored */ }
    return DEFAULT_LANG
  })

  useEffect(() => {
    const handler = () => {
      try {
        const updated = localStorage.getItem(LANG_KEY)
        if (updated === 'id' || updated === 'en') {
          setLangState(updated)
        }
      } catch (_e) { /* ignored */ }
    }
    window.addEventListener('ternakos-language-changed', handler)
    window.addEventListener('storage', (e) => {
      if (e.key === LANG_KEY && (e.newValue === 'id' || e.newValue === 'en')) {
        setLangState(e.newValue)
      }
    })
    return () => {
      window.removeEventListener('ternakos-language-changed', handler)
    }
  }, [])

  const setLang = useCallback((code) => {
    if (code !== 'id' && code !== 'en') return
    try {
      localStorage.setItem(LANG_KEY, code)
    } catch (_e) { /* ignored */ }
    setLangState(code)
    window.dispatchEvent(new CustomEvent('ternakos-language-changed'))
  }, [])

  const t = useCallback((key, fallback) => {
    const dict = DICTIONARIES[lang] || DICTIONARIES[DEFAULT_LANG]
    return dict[key] ?? DICTIONARIES[DEFAULT_LANG][key] ?? fallback ?? key
  }, [lang])

  const tRole = useCallback((role) => {
    const normalized = (role || '').toLowerCase()
    return t(`role_${normalized}`, role)
  }, [t])

  const tPlan = useCallback((plan) => {
    const normalized = (plan || '').toLowerCase()
    return t(`plan_${normalized}_label`, plan)
  }, [t])

  const tStatus = useCallback((status) => {
    const normalized = (status || '').toLowerCase()
    return t(`status_${normalized}`, status)
  }, [t])

  const tVertical = useCallback((vertical) => {
    const normalized = (vertical || '').toLowerCase()
    return t(`vertical_${normalized}`, vertical)
  }, [t])

  const value = {
    lang,
    setLang,
    t,
    tRole,
    tPlan,
    tStatus,
    tVertical,
    languages: SUPPORTED_LANGUAGES
  }

  return (
    <LanguageContext.Provider value={value}>
      {children}
    </LanguageContext.Provider>
  )
}
