/**
 * useBrowserNotifications — Real browser Notification API preference hook.
 *
 * Scope: Controls browser/device notification preferences.
 *        Does NOT implement FCM, service workers, or backend push.
 *        Notifications fire when app is open in browser tab.
 *
 * localStorage keys:
 *   ternakos.notifications.enabled   → 'true' | 'false'
 *   ternakos.notifications.billing   → 'true' | 'false'
 *   ternakos.notifications.business  → 'true' | 'false'
 *   ternakos.notifications.system    → 'true' | 'false'
 */

import { useState, useEffect, useCallback } from 'react'

const KEYS = {
  enabled:  'ternakos.notifications.enabled',
  billing:  'ternakos.notifications.billing',
  business: 'ternakos.notifications.business',
  system:   'ternakos.notifications.system',
}

function readBool(key, defaultValue = false) {
  try {
    const v = localStorage.getItem(key)
    if (v === null) return defaultValue
    return v === 'true'
  } catch {
    return defaultValue
  }
}

function writeBool(key, value) {
  try { localStorage.setItem(key, value ? 'true' : 'false') } catch { /* ok */ }
}

function getPermission() {
  if (typeof window === 'undefined') return 'default'
  if (!('Notification' in window)) return 'unsupported'
  return Notification.permission // 'default' | 'granted' | 'denied'
}

export function useBrowserNotifications() {
  const supported = typeof window !== 'undefined' && 'Notification' in window

  const [permission, setPermission]   = useState(getPermission)
  const [enabled,    setEnabledState] = useState(false)
  const [categories, setCategoriesState] = useState({
    billing:  true,
    business: true,
    system:   true,
  })

  // Hydrate from localStorage
  useEffect(() => {
    const perm = getPermission()
    setPermission(perm)

    const isGranted = perm === 'granted'
    const savedEnabled = readBool(KEYS.enabled, false)
    setEnabledState(isGranted && savedEnabled)

    setCategoriesState({
      billing:  readBool(KEYS.billing,  true),
      business: readBool(KEYS.business, true),
      system:   readBool(KEYS.system,   true),
    })
  }, [])

  /**
   * Request browser notification permission and enable if granted.
   * Calling this when permission is already 'denied' is a no-op
   * (browser will not show prompt again; user must change in browser settings).
   */
  const requestEnable = useCallback(async () => {
    if (!supported) return

    const perm = getPermission()

    if (perm === 'denied') {
      // Cannot re-request — browser blocks prompt. UI shows denied state.
      setPermission('denied')
      setEnabledState(false)
      writeBool(KEYS.enabled, false)
      return
    }

    if (perm === 'granted') {
      // Already granted, just toggle enabled state on
      setEnabledState(true)
      writeBool(KEYS.enabled, true)
      setPermission('granted')
      return
    }

    // perm === 'default' — request permission
    try {
      const result = await Notification.requestPermission()
      setPermission(result)
      if (result === 'granted') {
        setEnabledState(true)
        writeBool(KEYS.enabled, true)
      } else {
        setEnabledState(false)
        writeBool(KEYS.enabled, false)
      }
    } catch {
      setEnabledState(false)
      writeBool(KEYS.enabled, false)
    }
  }, [supported])

  /**
   * Disable notifications (only works if permission is granted).
   * Does not revoke browser permission — just saves preference.
   */
  const setEnabled = useCallback((value) => {
    if (!supported) return
    if (getPermission() !== 'granted') return
    setEnabledState(!!value)
    writeBool(KEYS.enabled, !!value)
  }, [supported])

  /**
   * Update a single category toggle.
   * @param {'billing'|'business'|'system'} key
   * @param {boolean} value
   */
  const setCategory = useCallback((key, value) => {
    if (!KEYS[key]) return
    setCategoriesState(prev => ({ ...prev, [key]: !!value }))
    writeBool(KEYS[key], !!value)
  }, [])

  return {
    supported,
    permission,         // 'default' | 'granted' | 'denied' | 'unsupported'
    enabled,            // true only when granted + saved enabled
    categories,         // { billing, business, system }
    requestEnable,      // async — prompts if default, enables if granted, shows status if denied
    setEnabled,         // toggle off when already granted
    setCategory,        // save individual category
  }
}
