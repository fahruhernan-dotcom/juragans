/**
 * Smart Supplier Assistant Helper for Sembako OS
 */

/**
 * Calculates the best supplier recommendation for a selected product
 * based on transaction frequency, quantity, and recency (90-day weight).
 */
export function getSupplierRecommendation(productId, allBatches = [], suppliers = []) {
  if (!productId || !allBatches.length || !suppliers.length) return null

  // Filter batches for this product
  const productBatches = allBatches.filter(
    b => b.product_id === productId && b.supplier_id && !b.is_deleted
  )

  if (!productBatches.length) return null

  const now = new Date()
  const supplierStats = {}

  productBatches.forEach(b => {
    const supId = b.supplier_id
    const qty = Number(b.qty_masuk) || 0
    const price = Number(b.buy_price) || 0
    const date = b.purchase_date ? new Date(b.purchase_date) : new Date(b.created_at)

    // Calculate age of transaction in days
    const diffDays = Math.ceil(Math.abs(now - date) / (1000 * 60 * 60 * 24))
    const weight = diffDays <= 90 ? 2 : 1

    if (!supplierStats[supId]) {
      supplierStats[supId] = {
        id: supId,
        freqScore: 0,
        qtyScore: 0,
        totalQty: 0,
        txCount: 0,
        totalCost: 0,
        batches: []
      }
    }

    supplierStats[supId].freqScore += weight
    supplierStats[supId].qtyScore += qty * weight
    supplierStats[supId].totalQty += qty
    supplierStats[supId].txCount += 1
    supplierStats[supId].totalCost += qty * price
    supplierStats[supId].batches.push({ date, price })
  })

  // Calculate final score for each supplier
  const scoredSuppliers = Object.values(supplierStats).map(s => {
    const finalScore = s.freqScore + 0.1 * s.qtyScore
    
    // Sort batches by date descending to find the most recent
    s.batches.sort((a, b) => b.date - a.date)
    const lastPrice = s.batches[0]?.price || 0
    const recentDate = s.batches[0]?.date || null
    const avgPrice = s.totalQty > 0 ? Math.round(s.totalCost / s.totalQty) : 0

    return {
      ...s,
      score: finalScore,
      lastPrice,
      recentDate,
      avgPrice
    }
  })

  // Sort by score descending
  scoredSuppliers.sort((a, b) => b.score - a.score)

  const top = scoredSuppliers[0]
  if (!top) return null

  const totalScore = scoredSuppliers.reduce((sum, s) => sum + s.score, 0)
  const ratio = totalScore > 0 ? top.score / totalScore : 0

  let statusText = 'Belum ada supplier dominan'
  let statusColor = 'gray'

  if (top.txCount < 3) {
    statusText = 'Direkomendasikan'
    statusColor = 'yellow'
  } else if (ratio >= 0.75) {
    statusText = 'Sangat Direkomendasikan'
    statusColor = 'green'
  } else if (ratio >= 0.50) {
    statusText = 'Direkomendasikan'
    statusColor = 'yellow'
  }

  const supplierInfo = suppliers.find(s => s.id === top.id)

  return {
    supplierId: top.id,
    supplierName: supplierInfo?.supplier_name || 'Supplier Tidak Dikenal',
    statusText,
    statusColor,
    txCount: top.txCount,
    totalQty: top.totalQty,
    lastPrice: top.lastPrice,
    avgPrice: top.avgPrice,
    recentDate: top.recentDate
  }
}

/**
 * Returns historical context stats of a specific product for a selected supplier.
 */
export function getSupplierHistoryContext(productId, supplierId, allBatches = []) {
  if (!productId || !supplierId || !allBatches.length) return null

  const filterBatches = allBatches.filter(
    b => b.product_id === productId && b.supplier_id === supplierId && !b.is_deleted
  )

  if (!filterBatches.length) return null

  let totalQty = 0
  let totalCost = 0
  const dates = []

  filterBatches.forEach(b => {
    const qty = Number(b.qty_masuk) || 0
    const price = Number(b.buy_price) || 0
    totalQty += qty
    totalCost += qty * price
    if (b.purchase_date) dates.push(new Date(b.purchase_date))
  })

  // Sort batches by purchase date descending to find the last price
  const sorted = [...filterBatches].sort((a, b) => {
    const da = a.purchase_date ? new Date(a.purchase_date) : new Date(a.created_at)
    const db = b.purchase_date ? new Date(b.purchase_date) : new Date(b.created_at)
    return db - da
  })

  const lastPrice = Number(sorted[0]?.buy_price) || 0
  const recentDate = sorted[0]?.purchase_date ? new Date(sorted[0].purchase_date) : null
  const avgPrice = totalQty > 0 ? Math.round(totalCost / totalQty) : 0

  return {
    txCount: filterBatches.length,
    totalQty,
    lastPrice,
    avgPrice,
    recentDate
  }
}

/**
 * Checks for anomalies in input prices or supplier matches.
 */
export function checkSupplierAnomalies(productId, supplierId, inputPriceStr, allBatches = [], suppliers = []) {
  const anomalies = []
  if (!productId || !allBatches.length) return anomalies

  const productBatches = allBatches.filter(
    b => b.product_id === productId && b.supplier_id && !b.is_deleted
  )

  // 1. Supplier mismatch anomaly (Supplier has never supplied this product)
  if (supplierId) {
    const hasHistoryWithProduct = productBatches.some(b => b.supplier_id === supplierId)
    
    // Check if supplier is completely new to the entire business
    const hasAnyHistory = allBatches.some(b => b.supplier_id === supplierId && !b.is_deleted)

    if (!hasAnyHistory) {
      anomalies.push({
        type: 'info',
        message: 'Supplier ini baru dibuat dan belum pernah memiliki riwayat transaksi.'
      })
    } else if (!hasHistoryWithProduct && productBatches.length > 0) {
      // Product has been supplied by others, but not this one
      const recommendation = getSupplierRecommendation(productId, allBatches, suppliers)
      anomalies.push({
        type: 'high_warning',
        message: `Supplier ini belum pernah memasok produk ini. Biasanya dibeli dari ${recommendation?.supplierName || 'supplier lain'}.`
      })
    }
  }

  // 2. Price deviation anomaly
  const inputPrice = Number(String(inputPriceStr).replace(/\D/g, ''))
  if (inputPrice > 0 && productBatches.length > 0) {
    // If supplier is selected and has history, compare to supplier's average.
    // Otherwise, compare to product's overall average.
    const supplierBatches = productBatches.filter(b => b.supplier_id === supplierId)
    const referenceBatches = supplierBatches.length > 0 ? supplierBatches : productBatches
    
    let totalQty = 0
    let totalCost = 0
    referenceBatches.forEach(b => {
      const qty = Number(b.qty_masuk) || 0
      const price = Number(b.buy_price) || 0
      totalQty += qty
      totalCost += qty * price
    })

    const avgPrice = totalQty > 0 ? Math.round(totalCost / totalQty) : 0

    if (avgPrice > 0) {
      const devRatio = (inputPrice - avgPrice) / avgPrice
      const pct = Math.round(Math.abs(devRatio) * 100)

      if (Math.abs(devRatio) >= 0.15) {
        anomalies.push({
          type: 'price_warning',
          direction: devRatio > 0 ? 'mahal' : 'murah',
          percentage: pct,
          avgPrice,
          message: `Harga input (${pct}% lebih ${devRatio > 0 ? 'mahal' : 'murah'}) menyimpang jauh dibanding rata-rata histori (${new Intl.NumberFormat('id-ID').format(avgPrice)}).`
        })
      }
    }
  }

  return anomalies
}
