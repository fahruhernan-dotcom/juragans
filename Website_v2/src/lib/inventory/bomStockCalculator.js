/**
 * bomStockCalculator.js
 * Kalkulator & Engine Sinkronisasi Stok Produk Jadi berbasis Bill of Materials (BOM)
 * Menghitung kapasitas produksi dan stok tersedia berdasarkan ketersediaan bahan baku:
 * - Bawang Curah sesuai Grade (Murni Grade S / Kripsy Grade A) & Gramatur
 * - Kemasan Utama (Pouch 100g, 200g, 250g / Toples)
 * - Stiker Depan (Label Depan)
 * - Stiker Belakang (Nutrisi / P-IRT)
 * - Kemasan Sekunder / Kardus (jika ada)
 */

/**
 * Ekstrak gramatur bawang dari nama produk atau catatan
 * @param {string} productName
 * @param {string} notes
 * @returns {number} gramatur dalam gram (default: 250)
 */
export function extractProductGrammage(productName = '', notes = '') {
  const text = `${productName} ${notes}`.toLowerCase()
  if (text.includes('1 kg') || text.includes('1kg') || text.includes('1.000g') || text.includes('1000g')) return 1000
  if (text.includes('2 kg') || text.includes('2kg') || text.includes('2.000g') || text.includes('2000g')) return 2000
  if (text.includes('500g') || text.includes('500 g') || text.includes('500 gram')) return 500
  if (text.includes('250g') || text.includes('250 g') || text.includes('250 gram')) return 250
  if (text.includes('200g') || text.includes('200 g') || text.includes('200 gram')) return 200
  if (text.includes('150g') || text.includes('150 g') || text.includes('150 gram')) return 150
  if (text.includes('100g') || text.includes('100 g') || text.includes('100 gram')) return 100
  return 250
}

/**
 * Mencocokkan bahan bawang mentah/curah sesuai grade produk
 * @param {object} product
 * @param {Array} rawMaterials
 * @returns {object|null}
 */
export function matchBawangMaterial(product, rawMaterials = []) {
  if (!rawMaterials || rawMaterials.length === 0) return null
  const cat = (product.category || '').toLowerCase()
  const name = (product.product_name || '').toLowerCase()

  const isMurni = cat.includes('murni') || cat.includes('grade s') || name.includes('murni') || name.includes('super')
  const isCrispy = cat.includes('crispy') || cat.includes('kripsy') || cat.includes('grade a') || name.includes('crispy') || name.includes('kripsy')

  if (isMurni) {
    const found = rawMaterials.find(r => {
      const rName = (r.material_name || '').toLowerCase()
      return rName.includes('murni') || rName.includes('grade s')
    })
    if (found) return found
  }

  if (isCrispy) {
    const found = rawMaterials.find(r => {
      const rName = (r.material_name || '').toLowerCase()
      return rName.includes('kripsy') || rName.includes('crispy') || rName.includes('grade a')
    })
    if (found) return found
  }

  // Fallback to any bawang curah
  return rawMaterials.find(r => {
    const rCat = (r.category || '').toLowerCase()
    const rName = (r.material_name || '').toLowerCase()
    return ['bawang_mentah', 'bawang_curah', 'bahan_baku'].includes(rCat) || rName.includes('bawang')
  }) || null
}

/**
 * Mencocokkan kemasan (Pouch / Toples) sesuai gramatur dan tipe produk
 * @param {object} product
 * @param {Array} rawMaterials
 * @returns {object|null}
 */
export function matchKemasanMaterial(product, rawMaterials = []) {
  if (!rawMaterials || rawMaterials.length === 0) return null
  const name = (product.product_name || '').toLowerCase()
  const gram = extractProductGrammage(name, product.notes)

  const isToples = name.includes('toples') || name.includes('jar')
  const isBal = name.includes('curah') || name.includes('bal') || name.includes('1 kg') || name.includes('2 kg')

  if (isBal) {
    return rawMaterials.find(r => {
      const rName = (r.material_name || '').toLowerCase()
      return rName.includes('kardus') || rName.includes('box') || rName.includes('bal') || rName.includes('plastik')
    }) || null
  }

  if (isToples) {
    return rawMaterials.find(r => {
      const rName = (r.material_name || '').toLowerCase()
      return rName.includes('toples') && (rName.includes(String(gram)) || true)
    }) || rawMaterials.find(r => (r.material_name || '').toLowerCase().includes('toples'))
  }

  // Pouch
  const pouchList = rawMaterials.filter(r => {
    const rCat = (r.category || '').toLowerCase()
    const rName = (r.material_name || '').toLowerCase()
    return rCat === 'pouch' || rName.includes('pouch')
  })

  if (pouchList.length > 0) {
    if (gram === 250) {
      const p250 = pouchList.find(r => r.material_name.includes('250'))
      if (p250) return p250
    }
    if (gram === 200 || gram === 150) {
      const p200 = pouchList.find(r => r.material_name.includes('200') || r.material_name.includes('150'))
      if (p200) return p200
    }
    if (gram === 100) {
      const p100 = pouchList.find(r => r.material_name.includes('100'))
      if (p100) return p100
    }
    return pouchList[0]
  }

  return null
}

/**
 * Mencocokkan Stiker Depan
 */
export function matchStickerFrontMaterial(product, rawMaterials = []) {
  if (!rawMaterials || rawMaterials.length === 0) return null
  const name = (product.product_name || '').toLowerCase()
  if (name.includes('curah') || name.includes('bal')) return null // Curah tidak pakai stiker depan satuan

  return rawMaterials.find(r => {
    const rCat = (r.category || '').toLowerCase()
    const rName = (r.material_name || '').toLowerCase()
    return rCat === 'sticker_depan' || rName.includes('stiker depan') || rName.includes('label depan') || (rCat === 'stiker' && rName.includes('depan'))
  }) || null
}

/**
 * Mencocokkan Stiker Belakang
 */
export function matchStickerBackMaterial(product, rawMaterials = []) {
  if (!rawMaterials || rawMaterials.length === 0) return null
  const name = (product.product_name || '').toLowerCase()
  if (name.includes('curah') || name.includes('bal')) return null // Curah tidak pakai stiker belakang satuan

  return rawMaterials.find(r => {
    const rCat = (r.category || '').toLowerCase()
    const rName = (r.material_name || '').toLowerCase()
    return rCat === 'sticker_belakang' || rName.includes('stiker belakang') || rName.includes('label belakang') || (rCat === 'stiker' && rName.includes('belakang'))
  }) || null
}

/**
 * Menghitung kapasitas stok produk jadi dari BOM
 * @param {object} product
 * @param {Array} rawMaterials
 * @returns {object} { totalStock, bottleneck, components: [...] }
 */
export function calculateBomProductStock(product, rawMaterials = []) {
  if (!product || !rawMaterials || rawMaterials.length === 0) {
    return {
      totalStock: Number(product?.current_stock) || 0,
      bottleneck: null,
      components: []
    }
  }

  const name = product.product_name || ''
  const nameLower = name.toLowerCase()

  // ── Penanganan Khusus Produk Bundling ──
  const isBundling = product.category === 'Paket Bundling & Combo' || nameLower.includes('paket') || nameLower.includes('bundling')

  if (isBundling) {
    let multiplier = 1
    let gramPerPack = 300
    if (nameLower.includes('trio') || nameLower.includes('3x100')) {
      multiplier = 3
      gramPerPack = 300
    } else if (nameLower.includes('duo') || nameLower.includes('2x200')) {
      multiplier = 2
      gramPerPack = 400
    } else if (nameLower.includes('reseller') || nameLower.includes('10')) {
      multiplier = 10
      gramPerPack = 2500
    } else if (nameLower.includes('resto') || nameLower.includes('2 kg') || nameLower.includes('2kg')) {
      multiplier = 1
      gramPerPack = 2000
    }

    const bawangMat = matchBawangMaterial(product, rawMaterials)
    const kemasanMat = matchKemasanMaterial(product, rawMaterials)
    const sFrontMat = matchStickerFrontMaterial(product, rawMaterials)
    const sBackMat = matchStickerBackMaterial(product, rawMaterials)

    const components = []

    if (bawangMat) {
      const stockKg = (bawangMat.unit || '').toLowerCase() === 'kg' ? Number(bawangMat.current_stock) || 0 : (Number(bawangMat.current_stock) || 0) / 1000
      const totalGrams = stockKg * 1000
      const cap = Math.floor(totalGrams / gramPerPack)
      components.push({
        type: 'bawang',
        name: bawangMat.material_name,
        available: bawangMat.current_stock,
        unit: bawangMat.unit,
        requiredPerUnit: `${gramPerPack} g`,
        capacity: cap
      })
    }

    if (kemasanMat) {
      const stockPcs = Number(kemasanMat.current_stock) || 0
      const cap = Math.floor(stockPcs / multiplier)
      components.push({
        type: 'kemasan',
        name: kemasanMat.material_name,
        available: stockPcs,
        unit: kemasanMat.unit,
        requiredPerUnit: `${multiplier} pcs`,
        capacity: cap
      })
    }

    if (sFrontMat) {
      const stockPcs = Number(sFrontMat.current_stock) || 0
      const cap = Math.floor(stockPcs / multiplier)
      components.push({
        type: 'stiker_depan',
        name: sFrontMat.material_name,
        available: stockPcs,
        unit: sFrontMat.unit,
        requiredPerUnit: `${multiplier} pcs`,
        capacity: cap
      })
    }

    if (sBackMat) {
      const stockPcs = Number(sBackMat.current_stock) || 0
      const cap = Math.floor(stockPcs / multiplier)
      components.push({
        type: 'stiker_belakang',
        name: sBackMat.material_name,
        available: stockPcs,
        unit: sBackMat.unit,
        requiredPerUnit: `${multiplier} pcs`,
        capacity: cap
      })
    }

    if (components.length === 0) {
      return { totalStock: Number(product.current_stock) || 0, bottleneck: null, components: [] }
    }

    const minCap = Math.min(...components.map(c => c.capacity))
    const totalStock = Math.max(0, minCap)
    const bottleneckComp = components.find(c => c.capacity === minCap)

    return {
      totalStock,
      bottleneck: bottleneckComp ? {
        name: bottleneckComp.name,
        type: bottleneckComp.type,
        capacity: bottleneckComp.capacity,
        available: bottleneckComp.available,
        unit: bottleneckComp.unit
      } : null,
      components
    }
  }

  // ── Penanganan Produk Standar (Grade S Murni / Grade A Crispy / Curah) ──
  const gram = extractProductGrammage(name, product.notes)
  const bawangMat = matchBawangMaterial(product, rawMaterials)
  const kemasanMat = matchKemasanMaterial(product, rawMaterials)
  const sFrontMat = matchStickerFrontMaterial(product, rawMaterials)
  const sBackMat = matchStickerBackMaterial(product, rawMaterials)

  const components = []

  // 1. Kapasitas Bawang Curah
  if (bawangMat) {
    const isKg = (bawangMat.unit || '').toLowerCase() === 'kg'
    const totalGrams = isKg ? (Number(bawangMat.current_stock) || 0) * 1000 : (Number(bawangMat.current_stock) || 0)
    const cap = Math.floor(totalGrams / gram)
    components.push({
      type: 'bawang',
      name: bawangMat.material_name,
      available: bawangMat.current_stock,
      unit: bawangMat.unit,
      requiredPerUnit: `${gram} g`,
      capacity: cap
    })
  }

  // 2. Kapasitas Kemasan Utama (Pouch / Toples / Bal)
  if (kemasanMat) {
    const stockPcs = Number(kemasanMat.current_stock) || 0
    components.push({
      type: 'kemasan',
      name: kemasanMat.material_name,
      available: stockPcs,
      unit: kemasanMat.unit,
      requiredPerUnit: '1 pcs',
      capacity: stockPcs
    })
  }

  // 3. Kapasitas Stiker Depan
  if (sFrontMat) {
    const stockPcs = Number(sFrontMat.current_stock) || 0
    components.push({
      type: 'stiker_depan',
      name: sFrontMat.material_name,
      available: stockPcs,
      unit: sFrontMat.unit,
      requiredPerUnit: '1 pcs',
      capacity: stockPcs
    })
  }

  // 4. Kapasitas Stiker Belakang
  if (sBackMat) {
    const stockPcs = Number(sBackMat.current_stock) || 0
    components.push({
      type: 'stiker_belakang',
      name: sBackMat.material_name,
      available: stockPcs,
      unit: sBackMat.unit,
      requiredPerUnit: '1 pcs',
      capacity: stockPcs
    })
  }

  if (components.length === 0) {
    return {
      totalStock: Number(product.current_stock) || 0,
      bottleneck: null,
      components: []
    }
  }

  // Cari kapasitas terkecil sebagai bottleneck
  const minCap = Math.min(...components.map(c => c.capacity))
  const totalStock = Math.max(0, minCap)
  const bottleneckComp = components.find(c => c.capacity === minCap)

  return {
    totalStock,
    bottleneck: bottleneckComp ? {
      name: bottleneckComp.name,
      type: bottleneckComp.type,
      capacity: bottleneckComp.capacity,
      available: bottleneckComp.available,
      unit: bottleneckComp.unit
    } : null,
    components
  }
}
