const REMEMBER_KEY = 'ternakos_remember_me'

export function setRememberMe(value) {
  if (typeof window === 'undefined') return
  window.localStorage.setItem(REMEMBER_KEY, value ? 'true' : 'false')
}

function getStorage() {
  if (typeof window === 'undefined') return null
  const remember = window.localStorage.getItem(REMEMBER_KEY) === 'true'
  return remember ? window.localStorage : window.sessionStorage
}

export const supabaseAuthStorage = {
  getItem: (key) => getStorage()?.getItem(key) ?? null,
  setItem: (key, value) => getStorage()?.setItem(key, value),
  removeItem: (key) => {
    if (typeof window === 'undefined') return
    // Clear from both so no leftover token survives in the wrong storage
    window.localStorage.removeItem(key)
    window.sessionStorage.removeItem(key)
  },
}
