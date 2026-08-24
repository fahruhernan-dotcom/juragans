// ── Invoice number generator ────────────────────────────────────────────────

export const generateInvoiceNumber = (type, date = new Date()) => {
  const dateStr = date.toISOString().slice(0, 10).replace(/-/g, '')
  const rand = Array.from(crypto.getRandomValues(new Uint8Array(3)))
    .map(b => b.toString(16).padStart(2, '0'))
    .join('')
    .toUpperCase()
    .slice(0, 4)

  const prefixes = {
    sale:             'INV',
    purchase:         'PO',
    delivery:         'DO',
    payment_receipt:  'REC',
    peternak_invoice: 'PET',
    rpa_to_toko:      'RPA',
    sembako_sale:     'SMB',
  }
  return `${prefixes[type] || 'INV'}-${dateStr}-${rand}`
}

// ── Rupiah format (tidak pakai Intl — react-pdf tidak support) ───────────────

export const formatRupiahPDF = (n) => {
  if (n == null || n === '') return 'Rp 0'
  const num = Number(n)
  if (isNaN(num)) return 'Rp 0'
  const parts = Math.abs(Math.round(num)).toString().replace(/\B(?=(\d{3})+(?!\d))/g, '.')
  return (num < 0 ? '-Rp ' : 'Rp ') + parts
}

// ── Tanggal Indonesia ─────────────────────────────────────────────────────────

export const formatDatePDF = (val, showDay = false) => {
  if (!val) return '-'
  const d = new Date(val)
  if (isNaN(d.getTime())) return '-'
  const months = ['Jan', 'Feb', 'Mar', 'Apr', 'Mei', 'Jun',
                  'Jul', 'Agu', 'Sep', 'Okt', 'Nov', 'Des']
  const days = ['Minggu', 'Senin', 'Selasa', 'Rabu', 'Kamis', 'Jumat', 'Sabtu']
  
  const dateParts = `${d.getDate()} ${months[d.getMonth()]} ${d.getFullYear()}`
  if (showDay) {
    return `${days[d.getDay()]}, ${dateParts}`
  }
  return dateParts
}

// ── Terbilang Rupiah ──────────────────────────────────────────────────────────

const SATUAN = [
  '', 'satu', 'dua', 'tiga', 'empat', 'lima',
  'enam', 'tujuh', 'delapan', 'sembilan', 'sepuluh', 'sebelas',
]

function _terbilangRibuan(n) {
  if (n === 0) return ''
  if (n < 12) return SATUAN[n]
  if (n < 20) return SATUAN[n - 10] + ' belas'
  if (n < 100) {
    const rem = n % 10
    return SATUAN[Math.floor(n / 10)] + ' puluh' + (rem ? ' ' + SATUAN[rem] : '')
  }
  if (n < 200) return 'seratus' + (n > 100 ? ' ' + _terbilangRibuan(n - 100) : '')
  if (n < 1000) {
    const rem = n % 100
    return SATUAN[Math.floor(n / 100)] + ' ratus' + (rem ? ' ' + _terbilangRibuan(rem) : '')
  }
  if (n < 2000) return 'seribu' + (n > 1000 ? ' ' + _terbilangRibuan(n - 1000) : '')
  if (n < 1_000_000) {
    const thousands = Math.floor(n / 1000)
    const rem = n % 1000
    return _terbilangRibuan(thousands) + ' ribu' + (rem ? ' ' + _terbilangRibuan(rem) : '')
  }
  return n.toString()
}

export const terbilang = (n) => {
  const num = Math.round(Number(n) || 0)
  if (num === 0) return 'nol rupiah'

  const parts = []
  let remainder = Math.abs(num)

  const milyar = Math.floor(remainder / 1_000_000_000)
  remainder %= 1_000_000_000
  if (milyar) parts.push(_terbilangRibuan(milyar) + ' milyar')

  const juta = Math.floor(remainder / 1_000_000)
  remainder %= 1_000_000
  if (juta) parts.push(_terbilangRibuan(juta) + ' juta')

  const ribu = Math.floor(remainder / 1000)
  remainder %= 1000
  if (ribu) parts.push(_terbilangRibuan(ribu) + ' ribu')

  if (remainder) parts.push(_terbilangRibuan(remainder))

  const result = parts.join(' ') + ' rupiah'
  return (num < 0 ? 'minus ' : '') + result.charAt(0).toUpperCase() + result.slice(1)
}
