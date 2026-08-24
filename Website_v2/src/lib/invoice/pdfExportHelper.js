/**
 * pdfExportHelper.js
 * Universal PDF generation, native saving, sharing, and WhatsApp dispatch helper
 * Supports both Web Browsers and Capacitor Native Shell (Android/iOS).
 */

import { pdf } from '@react-pdf/renderer'
import { isCapacitor, openBrowserUrl } from '@/lib/capacitor'
import { formatRupiahPDF, formatDatePDF } from './invoiceUtils'

/**
 * Converts a Blob to a base64 string
 * @param {Blob} blob 
 * @returns {Promise<string>} base64 data URL without prefix or with prefix
 */
export function blobToBase64(blob) {
  return new Promise((resolve, reject) => {
    const reader = new FileReader()
    reader.onerror = reject
    reader.onload = () => {
      const dataUrl = reader.result
      // return both full dataUrl and pure base64
      const base64 = dataUrl.split(',')[1] || dataUrl
      resolve({ dataUrl, base64 })
    }
    reader.readAsDataURL(blob)
  })
}

/**
 * Universally export or download PDF document
 * On Android APK (Capacitor): writes to device cache/documents and opens Native Share Sheet / PDF Viewer
 * On Web: triggers browser download
 * 
 * @param {React.ReactElement} pdfDoc - The @react-pdf/renderer document element
 * @param {string} fileName - Target file name, e.g. "Invoice_SMB-2026-001.pdf"
 * @param {Object} [meta] - Optional metadata (invoiceNumber, title, customerName)
 * @returns {Promise<{ success: boolean, method: string, message?: string }>}
 */
export async function exportInvoicePDF(pdfDoc, fileName = 'Invoice.pdf', meta = {}) {
  try {
    // 1. Generate PDF blob imperatively
    const blob = await pdf(pdfDoc).toBlob()
    if (!blob) {
      throw new Error('Gagal menghasilkan file PDF')
    }

    // 2. Check if running in Capacitor Native (Android/iOS)
    if (isCapacitor()) {
      try {
        const { Filesystem, Directory } = await import('@capacitor/filesystem')
        const { Share } = await import('@capacitor/share')

        const { base64 } = await blobToBase64(blob)

        // Write to Cache Directory so it can be shared immediately
        const safeFileName = fileName.replace(/[/\\?%*:|"<>]/g, '_')
        const writeResult = await Filesystem.writeFile({
          path: safeFileName,
          data: base64,
          directory: Directory.Cache,
        })

        const fileUri = writeResult.uri

        // Check if device can share
        const canShareResult = await Share.canShare()
        if (canShareResult?.value !== false) {
          await Share.share({
            title: fileName,
            text: `Faktur Penjualan: ${meta.invoiceNumber || fileName}`,
            url: fileUri,
            dialogTitle: 'Buka / Simpan / Kirim Faktur PDF',
          })
          return { success: true, method: 'native_share', uri: fileUri }
        }
      } catch (nativeErr) {
        console.warn('[PDF Export] Native filesystem/share failed, attempting web fallback:', nativeErr)
      }
    }

    // 3. Web Fallback (or if Web Share is supported)
    if (typeof navigator !== 'undefined' && navigator.share && navigator.canShare && navigator.canShare({ files: [new File([blob], fileName, { type: 'application/pdf' })] })) {
      try {
        const file = new File([blob], fileName, { type: 'application/pdf' })
        await navigator.share({
          title: fileName,
          text: `Faktur Penjualan: ${meta.invoiceNumber || fileName}`,
          files: [file]
        })
        return { success: true, method: 'web_share' }
      } catch (shareErr) {
        // User might have dismissed the share sheet, proceed to direct download fallback
        if (shareErr.name === 'AbortError') {
          return { success: true, method: 'dismissed' }
        }
      }
    }

    // Standard Web Download
    const blobUrl = URL.createObjectURL(blob)
    const link = document.createElement('a')
    link.href = blobUrl
    link.download = fileName
    link.style.display = 'none'
    document.body.appendChild(link)
    link.click()
    document.body.removeChild(link)
    
    // Clean up
    setTimeout(() => {
      URL.revokeObjectURL(blobUrl)
    }, 2000)

    return { success: true, method: 'web_download' }
  } catch (error) {
    console.error('[PDF Export] Error generating or saving PDF:', error)
    throw error
  }
}

/**
 * Format invoice data into a clean, human-readable WhatsApp message
 * @param {Object} data 
 * @returns {string} Formatted WhatsApp message
 */
export function generateWhatsAppInvoiceText(data) {
  const invNo = data.invoice_number || data.invoiceNumber || 'INV'
  const businessName = data.tenant?.business_name || data.businessName || 'GPK Sembako'
  const customerName = data.customer_name || data.customerName || 'Pelanggan'
  const txnDate = formatDatePDF(data.transaction_date || data.transactionDate || new Date(), true)
  const dueDate = data.due_date ? formatDatePDF(data.due_date) : null
  const paymentStatus = (data.payment_status || 'belum_lunas').toUpperCase()
  
  const items = data.items || []
  let itemsText = ''
  if (items.length > 0) {
    itemsText = items.map((item, idx) => {
      const name = item.product_name || item.name || 'Produk'
      const qty = item.quantity || item.quantity_kg || item.qty || 1
      const unit = item.unit || 'pcs'
      const price = formatRupiahPDF(item.price_per_unit ?? item.sell_price ?? item.price ?? 0)
      const subtotal = formatRupiahPDF(item.subtotal ?? (qty * (item.price_per_unit || 0)))
      return `${idx + 1}. *${name}*\n   ${qty} ${unit} x ${price} = ${subtotal}`
    }).join('\n')
  } else {
    itemsText = '- Tidak ada rincian produk -'
  }

  const totalAmount = formatRupiahPDF(data.total_amount || 0)
  const paidAmount = formatRupiahPDF(data.paid_amount || 0)
  const remainingAmount = formatRupiahPDF(data.remaining_amount || 0)
  const deliveryCost = Number(data.delivery_cost || 0)
  const otherCost = Number(data.other_cost || 0)

  let costAdditions = ''
  if (deliveryCost > 0) costAdditions += `\nOngkir     : ${formatRupiahPDF(deliveryCost)}`
  if (otherCost > 0)    costAdditions += `\nBiaya Lain : ${formatRupiahPDF(otherCost)}`

  let statusDesc = `*${paymentStatus}*`
  if (paymentStatus === 'BELUM_LUNAS' || paymentStatus === 'SEBAGIAN') {
    if (dueDate) {
      statusDesc += ` (Jatuh Tempo: ${dueDate})`
    }
  }

  let text = `*FAKTUR PENJUALAN - ${businessName.toUpperCase()}*\n`
  text += `━━━━━━━━━━━━━━━━━━━━━━━━━\n`
  text += `📋 *No. Faktur* : ${invNo}\n`
  text += `📅 *Tanggal*    : ${txnDate}\n`
  text += `👤 *Pelanggan*  : ${customerName}\n`
  text += `📌 *Status*     : ${statusDesc}\n`
  text += `━━━━━━━━━━━━━━━━━━━━━━━━━\n\n`
  text += `📦 *RINCIAN PESANAN:*\n`
  text += `${itemsText}\n`
  text += `─────────────────────────\n`
  if (costAdditions) text += `${costAdditions}\n`
  text += `💰 *TOTAL TAGIHAN* : *${totalAmount}*\n`
  text += `💵 *Sudah Dibayar* : ${paidAmount}\n`
  text += `💳 *Sisa Tagihan*  : *${remainingAmount}*\n`
  text += `━━━━━━━━━━━━━━━━━━━━━━━━━\n`

  if (data.notes) {
    text += `📝 *Catatan*: ${data.notes}\n\n`
  }

  text += `Terima kasih atas pesanan dan kepercayaannya! 🙏✨\n`
  text += `_Faktur otomatis diterbitkan oleh ${businessName}_`

  return text
}

/**
 * Formats phone number into international WhatsApp format (628xxx)
 * @param {string} phone 
 * @returns {string}
 */
export function formatWhatsAppPhone(phone) {
  if (!phone) return ''
  let cleaned = phone.replace(/[^0-9]/g, '')
  if (cleaned.startsWith('0')) {
    cleaned = '62' + cleaned.slice(1)
  }
  return cleaned
}

/**
 * Share invoice via WhatsApp
 * @param {Object} data 
 */
export function shareInvoiceViaWhatsApp(data) {
  const message = generateWhatsAppInvoiceText(data)
  const phone = formatWhatsAppPhone(data.customer_phone || data.customerPhone || data.customer?.phone || '')
  
  const encodedText = encodeURIComponent(message)
  let waUrl = ''
  if (phone) {
    waUrl = `https://api.whatsapp.com/send?phone=${phone}&text=${encodedText}`
  } else {
    waUrl = `https://api.whatsapp.com/send?text=${encodedText}`
  }

  // Open with appropriate external or browser handler
  if (typeof window !== 'undefined') {
    if (isCapacitor()) {
      openBrowserUrl(waUrl, true)
    } else {
      window.open(waUrl, '_blank', 'noopener,noreferrer')
    }
  }
}

/**
 * Copy formatted invoice text to clipboard
 * @param {Object} data 
 * @returns {Promise<boolean>}
 */
export async function copyInvoiceToClipboard(data) {
  try {
    const text = generateWhatsAppInvoiceText(data)
    if (navigator?.clipboard?.writeText) {
      await navigator.clipboard.writeText(text)
      return true
    }
    return false
  } catch (err) {
    console.error('Failed to copy to clipboard:', err)
    return false
  }
}
