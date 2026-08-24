import { GRACE_DAYS, WARNING_DAYS, LICENSE_STATUS } from './licenseConstants'

/**
 * Menghitung status lisensi berdasarkan sisa hari dari tanggal kedaluwarsa.
 *
 * @param {Date|string} todayParam Tanggal hari ini
 * @param {Date|string|null|undefined} expiresAtParam Tanggal kedaluwarsa lisensi
 * @param {number} graceDays Jumlah hari masa tenggang
 * @returns {object} Objek berisi detail status lisensi
 */
export function calculateLicenseStatus(todayParam, expiresAtParam, graceDays = GRACE_DAYS) {
  if (!expiresAtParam) {
    return {
      status: LICENSE_STATUS.PERMANENT,
      daysRemaining: 99999,
      isExpired: false,
      isWarning: false,
      isGrace: false,
      isLocked: false,
    }
  }

  const today = new Date(todayParam)
  today.setHours(0, 0, 0, 0)

  const expiresAt = new Date(expiresAtParam)
  const expiresAtMidnight = new Date(expiresAt)
  expiresAtMidnight.setHours(0, 0, 0, 0)

  const diffTime = expiresAtMidnight.getTime() - today.getTime()
  const daysRemaining = Math.round(diffTime / (1000 * 60 * 60 * 24))

  const isExpired = daysRemaining < 0

  let status = LICENSE_STATUS.ACTIVE
  let isWarning = false
  let isGrace = false
  let isLocked = false

  if (isExpired) {
    const daysPast = -daysRemaining
    if (daysPast <= graceDays) {
      status = LICENSE_STATUS.GRACE
      isGrace = true
    } else {
      status = LICENSE_STATUS.LOCKED
      isLocked = true
    }
  } else {
    if (daysRemaining <= WARNING_DAYS) {
      status = LICENSE_STATUS.WARNING
      isWarning = true
    } else {
      status = LICENSE_STATUS.ACTIVE
    }
  }

  return {
    status,
    daysRemaining,
    isExpired,
    isWarning,
    isGrace,
    isLocked,
  }
}
