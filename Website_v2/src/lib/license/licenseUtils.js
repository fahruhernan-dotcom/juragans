/**
 * Menambahkan lisensi bulanan dengan tanggal jatuh tempo selalu tanggal 28.
 *
 * @param {Date|string|null|undefined} currentExpiresAt Tanggal kedaluwarsa saat ini
 * @param {Date|string} todayParam Tanggal hari ini (default: new Date())
 * @returns {Date} Tanggal kedaluwarsa baru
 */
export function addMonthlyLicense(currentExpiresAt, todayParam = new Date()) {
  const today = new Date(todayParam)

  const baseDate = (currentExpiresAt && new Date(currentExpiresAt) > today)
    ? new Date(currentExpiresAt)
    : today

  const targetDate = new Date(baseDate)
  // If the base date is before the 28th, set to 28th of the same month.
  // Otherwise, move to the next month and set to the 28th.
  if (baseDate.getDate() < 28) {
    targetDate.setDate(28)
  } else {
    targetDate.setMonth(targetDate.getMonth() + 1)
    targetDate.setDate(28)
  }
  targetDate.setHours(23, 59, 59, 999)
  return targetDate
}

/**
 * Menambahkan lisensi tahunan dengan tanggal jatuh tempo selalu tanggal 28 di bulan yang sama tahun depan.
 *
 * @param {Date|string|null|undefined} currentExpiresAt Tanggal kedaluwarsa saat ini
 * @param {Date|string} todayParam Tanggal hari ini (default: new Date())
 * @returns {Date} Tanggal kedaluwarsa baru
 */
export function addYearlyLicense(currentExpiresAt, todayParam = new Date()) {
  const today = new Date(todayParam)

  const baseDate = (currentExpiresAt && new Date(currentExpiresAt) > today)
    ? new Date(currentExpiresAt)
    : today

  const targetDate = new Date(baseDate)
  targetDate.setFullYear(targetDate.getFullYear() + 1)
  targetDate.setDate(28)
  targetDate.setHours(23, 59, 59, 999)

  return targetDate
}

/**
 * Menyetel lisensi menjadi permanen/unlimited.
 *
 * @returns {null} Mengembalikan null yang melambangkan lisensi permanen
 */
export function setPermanent() {
  return null
}

/**
 * Menyetel lisensi dari hari ini + sejumlah hari.
 * Selalu dihitung dari TODAY, mengabaikan sisa hari yang ada.
 * Dipakai untuk fitur reset lisensi.
 *
 * @param {number} days Jumlah hari dari sekarang
 * @returns {Date} Tanggal kedaluwarsa baru
 */
export function setFromToday(days) {
  const target = new Date()
  target.setDate(target.getDate() + days)
  target.setHours(23, 59, 59, 999)
  return target
}
