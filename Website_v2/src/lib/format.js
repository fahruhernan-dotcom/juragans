import { format, parseISO, isValid, formatDistanceToNow } from 'date-fns'
import { id } from 'date-fns/locale/id'

export const safeNum = (v, fallback = 0) => {
  const num = Number(v)
  return isNaN(num) || v === null || v === undefined ? fallback : num
}
export const safeNumber = safeNum

export const toTitleCase = (str) => {
  if (!str) return ''
  return str.toLowerCase()
    .replace(/_/g, ' ')
    .split(' ')
    .filter(word => word.length > 0)
    .map(word => word.charAt(0).toUpperCase() + word.slice(1))
    .join(' ')
}

export const safePercent = (num, den, fallback = 0) => {
  const n = Number(num)
  const d = Number(den)
  return d === 0 || isNaN(n) || isNaN(d) ? fallback : (n / d) * 100
}

export const formatIDR = (n) => {
  const num = safeNum(n)
  return 'Rp ' + num.toLocaleString('id-ID')
}

export const formatIDRShort = (n) => {
  const num = safeNum(n)
  if (num >= 1_000_000_000)
    return 'Rp ' + (num/1_000_000_000).toFixed(1) + 'M'
  if (num >= 1_000_000)
    return 'Rp ' + (num/1_000_000).toFixed(1) + 'jt'
  if (num >= 1_000)
    return 'Rp ' + (num/1_000).toFixed(0) + 'rb'
  return 'Rp ' + num.toLocaleString('id-ID')
}

export const formatDate = (dateValue, fallback = '-') => {
  if (!dateValue) return fallback
  
  try {
    let date
    if (dateValue instanceof Date) {
      date = dateValue
    } else if (typeof dateValue === 'string') {
      date = parseISO(dateValue)
    } else {
      return fallback
    }
    
    if (!isValid(date)) return fallback
    
    return format(date, 'd MMM yyyy', { locale: id })
  } catch {
    return fallback
  }
}

export const formatDateFull = (dateValue, fallback = '-') => {
  if (!dateValue) return fallback
  
  try {
    const date = dateValue instanceof Date
      ? dateValue
      : parseISO(dateValue)
    
    if (!isValid(date)) return fallback
    
    return format(date, 'EEEE, d MMMM yyyy', { locale: id })
  } catch {
    return fallback
  }
}

export const formatRelative = (dateValue, fallback = '-') => {
  if (!dateValue) return fallback
  
  try {
    const date = dateValue instanceof Date ? dateValue : parseISO(dateValue)
    if (!isValid(date)) return fallback
    const diffMs = Date.now() - date.getTime()
    if (diffMs < 60000) return 'Baru saja'
    if (diffMs > 7 * 86400000) return format(date, 'd MMM yyyy', { locale: id })
    return formatDistanceToNow(date, { addSuffix: true, locale: id })
  } catch {
    return fallback
  }
}


export const formatWeight = (kg) => {
  const num = safeNum(kg)
  return num.toLocaleString('id-ID', { maximumFractionDigits: 2 }) + ' kg'
}

export const formatKg = (n) => formatWeight(n)

export const formatEkor = (n) =>
  safeNum(n).toLocaleString('id-ID') + ' ekor'

export const calcMargin = (buyPrice, sellPrice) =>
  sellPrice - buyPrice

export const calcROI = (modal, profit) =>
  modal > 0 ? ((profit / modal) * 100).toFixed(1) : 0

export const calcMortalityRate = (initial, died) =>
  initial > 0 ? ((died / initial) * 100).toFixed(2) : 0

export const calcShrinkage = (initialKg, arrivedKg) => ({
  kg: (initialKg - arrivedKg).toFixed(2),
  percent: initialKg > 0
    ? (((initialKg - arrivedKg) / initialKg) * 100).toFixed(1)
    : 0,
})

// Map nilai database → label tampilan yang rapi
export const BUYER_TYPE_LABELS = {
  'rpa':            'RPA (Rumah Potong Ayam)',
  'pedagang_pasar': 'Pedagang Pasar',
  'restoran':       'Restoran',
  'pengepul':       'Pengepul',
  'supermarket':    'Supermarket',
  'lainnya':        'Lainnya',
}

export const PAYMENT_TERMS_LABELS = {
  'cash':  'Cash',
  'net3':  'NET 3 Hari',
  'net7':  'NET 7 Hari',
  'net14': 'NET 14 Hari',
  'net30': 'NET 30 Hari',
}

export const PAYMENT_STATUS_LABELS = {
  'lunas':        'Lunas',
  'belum_lunas':  'Belum Lunas',
  'sebagian':     'Sebagian',
}

export const formatBuyerType = (value) =>
  BUYER_TYPE_LABELS[value] || value

export const formatPaymentTerms = (value) =>
  PAYMENT_TERMS_LABELS[value] || value

export const formatPaymentStatus = (value) =>
  PAYMENT_STATUS_LABELS[value] || value

export const calcTotalJual = (sale, delivery) => {
  if (!sale) return 0
  // Prioritize total_revenue from DB if present
  if (sale.total_revenue !== undefined && sale.total_revenue !== null) {
    return safeNum(sale.total_revenue)
  }
  
  // Fallback: calculation based on arrived weight
  const weight = safeNum(delivery?.arrived_weight_kg || sale.total_weight_kg)
  const price = safeNum(sale.price_per_kg)
  return weight * price
}

export const calcKerugianSusut = (delivery, sale) => {
  // Can accept objects (delivery, sale) or direct values (shrinkageKg, pricePerKg)
  if (typeof delivery === 'object') {
    const shrinkageKg = safeNum(delivery?.shrinkage_kg || (safeNum(delivery?.initial_weight_kg) - safeNum(delivery?.arrived_weight_kg)))
    const price = safeNum(sale?.price_per_kg)
    return shrinkageKg * price
  }
  // Direct values fallback
  return safeNum(delivery) * safeNum(sale)
}

export const calcNetProfit = (sale) => {
  const revenue = Number(sale?.total_revenue) || 0
  const totalCost = Number(sale?.purchases?.total_cost) || 0
  const transportCost = Number(sale?.purchases?.transport_cost) || 0
  const otherCost = Number(sale?.purchases?.other_cost) || 0
  const deliveryCost = Number(sale?.delivery_cost) || 0
  
  return revenue - totalCost - transportCost - otherCost - deliveryCost
}

export const calcRemainingAmount = (sale) => {
  return (Number(sale?.total_revenue) || 0) - (Number(sale?.paid_amount) || 0)
}

/**
 * Kalkulasi net profit per siklus ternak (Peternak)
 * @param {Object} cycle - breeding_cycle object dengan relasi
 * @returns {number} net profit dalam rupiah
 */
export const calcPeternakNetProfit = (cycle) => {
  // PENDAPATAN
  const harvestRevenue = (cycle?.harvest_records || []).reduce((sum, h) => {
    return sum + (Number(h.total_revenue) || 0)
  }, 0)
  
  // BIAYA PRODUKSI
  const cycleExpenses = (cycle?.cycle_expenses || []).reduce((sum, e) => {
    return sum + (Number(e.amount) || 0)
  }, 0)
  
  // BIAYA DOC (dari purchase/awal siklus)
  const docCost = Number(cycle?.doc_cost) || 0
  
  // BIAYA PAKAN
  const feedCost = Number(cycle?.total_feed_cost) || 0
  
  // BIAYA TENAGA KERJA
  const workerCost = (cycle?.worker_payments || []).reduce((sum, w) => {
    return sum + (Number(w.amount) || 0)
  }, 0)
  
  return harvestRevenue - cycleExpenses - docCost - feedCost - workerCost
}

/**
 * Kalkulasi FCR (Feed Conversion Ratio) per siklus
 * @param {Object} cycle - breeding_cycle object
 * @returns {number} FCR value (lower = better, ideal < 1.6)
 */
export const calcFCR = (cycle) => {
  const totalFeedKg = Number(cycle?.total_feed_consumed_kg) || 0
  const totalHarvestKg = (cycle?.harvest_records || []).reduce((sum, h) => {
    return sum + (Number(h.total_weight_kg) || 0)
  }, 0)
  
  if (totalHarvestKg === 0) return 0
  return Number((totalFeedKg / totalHarvestKg).toFixed(2))
}

/**
 * Kalkulasi IP (Indeks Performa) per siklus
 * @param {Object} cycle - breeding_cycle object
 * @returns {number} IP value (higher = better, ideal > 300)
 */
export const calcIndeksPerforma = (cycle) => {
  const docCount = Number(cycle?.doc_count) || 0
  if (docCount === 0) return 0
  
  const survivalRate = ((docCount - (cycle?.total_mortality || 0)) / docCount) * 100
  const avgWeight = Number(cycle?.avg_harvest_weight_kg) || 0
  const agedays = Number(cycle?.age_days) || 1
  const fcr = calcFCR(cycle)
  
  if (fcr === 0) return 0
  return Number(((survivalRate * avgWeight * 100) / (fcr * agedays)).toFixed(1))
}

/**
 * Normalisasi nomor HP ke format 08...
 * Menghilangkan karakter non-digit dan mengubah +62/62 menjadi 0
 * @param {string} str - Nomor HP input
 * @returns {string} Nomor HP yang sudah dinormalisasi
 */
export const normalizePhone = (str) => {
  if (!str) return ''
  // Bersihkan dari segela karakter non-digit
  let cleaned = str.replace(/\D/g, '') 
  
  // Jika diawali 62, ubah jadi 0
  if (cleaned.startsWith('62')) {
    cleaned = '0' + cleaned.slice(2)
  } 
  // Jika langsung diawali angka 8, tambahkan 0 di depan
  else if (cleaned.startsWith('8')) {
    cleaned = '0' + cleaned
  }
  
  return cleaned
}
