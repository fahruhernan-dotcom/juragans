import { useContext } from 'react'
import { LanguageContext } from './LanguageProvider'

export function useLanguage() {
  const context = useContext(LanguageContext)
  if (!context) {
    return {
      lang: 'id',
      setLang: () => {},
      t: (key, fallback) => fallback ?? key,
      tRole: (role) => role,
      tPlan: (plan) => plan,
      tStatus: (status) => status,
      tVertical: (vertical) => vertical,
      languages: []
    }
  }
  return context
}
