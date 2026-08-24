/**
 * Memformat tanggal lisensi menjadi representasi bahasa Indonesia yang rapi.
 *
 * @param {Date|string|null|undefined} dateStr Input tanggal
 * @returns {string} Tanggal terformat atau "Unlimited / Permanen"
 */
export const formatLicenseDate = (dateStr) => {
  if (!dateStr) return 'Unlimited / Permanen'
  try {
    return new Date(dateStr).toLocaleDateString('id-ID', {
      day: '2-digit',
      month: 'long',
      year: 'numeric'
    })
  } catch {
    return 'Unlimited / Permanen'
  }
}

/**
 * Menghitung dan memformat tanggal batas akhir masa tenggang (grace period).
 *
 * @param {Date|string|null|undefined} dateStr Tanggal kedaluwarsa lisensi
 * @returns {string} Tanggal batas akhir grace terformat atau "N/A"
 */
export const getGraceDate = (dateStr) => {
  if (!dateStr) return 'N/A'
  try {
    const d = new Date(dateStr)
    d.setDate(d.getDate() + 3)
    return d.toLocaleDateString('id-ID', {
      day: '2-digit',
      month: 'long',
      year: 'numeric'
    })
  } catch {
    return 'N/A'
  }
}
