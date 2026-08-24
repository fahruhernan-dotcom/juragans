import { useState, useEffect, useCallback, useRef } from 'react'

const STORAGE_KEY = 'tos_rate_limit'

/**
 * Anti-spam hook for protecting forms from bots and abuse.
 * 
 * Features:
 * 1. Cooldown timer after each submit
 * 2. Max attempts per time window (stored in localStorage)
 * 3. Honeypot field detection
 * 
 * @param {string} formId - Unique identifier for the form (e.g. 'signup', 'forgot-pw')
 * @param {object} options
 * @param {number} options.cooldownSeconds - Cooldown after each submit (default: 60)
 * @param {number} options.maxAttempts - Max attempts before lockout (default: 5)
 * @param {number} options.lockoutMinutes - Lockout duration in minutes (default: 15)
 */
export function useAntiSpam(formId, {
  cooldownSeconds = 60,
  maxAttempts = 5,
  lockoutMinutes = 15
} = {}) {
  const [cooldown, setCooldown] = useState(0)
  const [isLocked, setIsLocked] = useState(false)
  const [lockoutRemaining, setLockoutRemaining] = useState(0)
  const honeypotRef = useRef('')
  const timerRef = useRef(null)

  function getStorageData() {
    try {
      const raw = localStorage.getItem(STORAGE_KEY)
      return raw ? JSON.parse(raw) : {}
    } catch {
      return {}
    }
  }

  function setStorageData(data) {
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(data))
    } catch { /* ignore */ }
  }

  function checkLockout() {
    const data = getStorageData()
    const formData = data[formId]

    if (!formData) {
      setIsLocked(false)
      setLockoutRemaining(0)
      return
    }

    const { lockedUntil, attempts: _attempts, windowStart } = formData
    const now = Date.now()

    // Check if currently locked out
    if (lockedUntil && now < lockedUntil) {
      setIsLocked(true)
      setLockoutRemaining(Math.ceil((lockedUntil - now) / 1000))
      return
    }

    // If lockout expired, reset
    if (lockedUntil && now >= lockedUntil) {
      data[formId] = { attempts: 0, windowStart: now }
      setStorageData(data)
      setIsLocked(false)
      setLockoutRemaining(0)
      return
    }

    // Clean old window (older than lockout period)
    if (windowStart && now - windowStart > lockoutMinutes * 60 * 1000) {
      data[formId] = { attempts: 0, windowStart: now }
      setStorageData(data)
    }

    setIsLocked(false)
    setLockoutRemaining(0)
  }

  // Check lockout status on mount
  useEffect(() => {
    checkLockout()
    return () => {
      if (timerRef.current) clearInterval(timerRef.current)
    }
  }, [])

  // Cooldown countdown
  useEffect(() => {
    if (cooldown <= 0) return
    const interval = setInterval(() => {
      setCooldown(prev => {
        if (prev <= 1) {
          clearInterval(interval)
          return 0
        }
        return prev - 1
      })
    }, 1000)
    return () => clearInterval(interval)
  }, [cooldown])

  // Lockout countdown
  useEffect(() => {
    if (!isLocked) return
    const interval = setInterval(() => {
      checkLockout()
    }, 1000)
    timerRef.current = interval
    return () => clearInterval(interval)
  }, [isLocked])

  function recordAttempt() {
    const data = getStorageData()
    const now = Date.now()
    const formData = data[formId] || { attempts: 0, windowStart: now }

    // Reset window if expired
    if (now - formData.windowStart > lockoutMinutes * 60 * 1000) {
      formData.attempts = 0
      formData.windowStart = now
    }

    formData.attempts = (formData.attempts || 0) + 1

    // Check if should lock
    if (formData.attempts >= maxAttempts) {
      formData.lockedUntil = now + lockoutMinutes * 60 * 1000
      setIsLocked(true)
      setLockoutRemaining(lockoutMinutes * 60)
    }

    data[formId] = formData
    setStorageData(data)
  }

  /**
   * Call this before executing the actual submit.
   * Returns { allowed: boolean, reason?: string }
   */
  const gate = useCallback(() => {
    // 1. Check honeypot
    if (honeypotRef.current) {
      // Bot detected — silently reject (don't reveal why)
      return { allowed: false, reason: 'Terjadi kesalahan. Coba lagi.' }
    }

    // 2. Check lockout
    if (isLocked) {
      const mins = Math.ceil(lockoutRemaining / 60)
      return {
        allowed: false,
        reason: `Terlalu banyak percobaan. Coba lagi dalam ${mins} menit.`
      }
    }

    // 3. Check cooldown
    if (cooldown > 0) {
      return {
        allowed: false,
        reason: `Tunggu ${cooldown} detik sebelum mencoba lagi.`
      }
    }

    return { allowed: true }
  }, [cooldown, isLocked, lockoutRemaining])

  /**
   * Call this after a successful submit to start cooldown & record attempt.
   */
  // eslint-disable-next-line react-hooks/preserve-manual-memoization -- React Compiler infers recordAttempt as dep; it is a stable fn decl, cooldownSeconds is the only varying input
  const onSubmitted = useCallback(() => {
    setCooldown(cooldownSeconds)
    recordAttempt()
  // eslint-disable-next-line react-hooks/preserve-manual-memoization -- closing suppress
  }, [cooldownSeconds])

  /**
   * Honeypot onChange handler — attach to a hidden input.
   */
  const onHoneypotChange = useCallback((e) => {
    honeypotRef.current = e.target.value
  }, [])

  /**
   * The honeypot input element (render this in the form).
   */
  const HoneypotField = useCallback(() => (
    <div style={{
      position: 'absolute',
      left: '-9999px',
      top: '-9999px',
      opacity: 0,
      height: 0,
      width: 0,
      overflow: 'hidden',
      tabIndex: -1
    }} aria-hidden="true">
      <label htmlFor={`${formId}_hp_field`}>Leave empty</label>
      <input
        id={`${formId}_hp_field`}
        name={`${formId}_website`}
        type="text"
        autoComplete="off"
        tabIndex={-1}
        onChange={onHoneypotChange}
      />
    </div>
  ), [formId, onHoneypotChange])

  return {
    cooldown,
    isLocked,
    lockoutRemaining,
    gate,
    onSubmitted,
    HoneypotField,
    /** Whether the submit button should be disabled */
    isBlocked: isLocked || cooldown > 0
  }
}
