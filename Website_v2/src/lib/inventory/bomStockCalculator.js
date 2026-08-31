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
  const notes = (product.notes || '').toLowerCase()
  const gram = extractProductGrammage(name, product.notes)

  const isToples = name.includes('toples') || name.includes('jar')
  const isAlu = name.includes('alumunium') || name.includes('alu') || notes.includes('alumunium') || notes.includes('alu')

  // 1. If product is Toples / Jar
  if (isToples) {
    const toplesMat = rawMaterials.find(r => {
      const rName = (r.material_name || '').toLowerCase()
      return rName.includes('toples') && (rName.includes(String(gram)) || rName.includes(`${gram}g`))
    }) || rawMaterials.find(r => (r.material_name || '').toLowerCase().includes('toples'))
    if (toplesMat) return toplesMat
  }

  // 2. If product is 1 KG / 1000g (e.g. Murni Bal PE 1 Kg, Grade A Bal PE 1 Kg, Pouch 1 KG)
  if (gram === 1000 || name.includes('1 kg') || name.includes('1kg') || name.includes('1.000g') || name.includes('1000g')) {
    const mat1k = rawMaterials.find(r => {
      const rName = (r.material_name || '').toLowerCase()
      return (r.category === 'pouch' || r.category === 'kemasan' || rName.includes('pouch') || rName.includes('plastik') || rName.includes('kemasan') || rName.includes('pe')) &&
        (rName.includes('1 kg') || rName.includes('1kg') || rName.includes('1.000') || rName.includes('1000') || rName.includes('1k')) &&
        !rName.includes('polymailer')
    })
    if (mat1k) return mat1k
  }

  // 3. If product is 2 KG / 2000g (e.g. Bawang Murni 2 kg Bal HORECA)
  if (gram === 2000 || name.includes('2 kg') || name.includes('2kg') || name.includes('2000g')) {
    const mat2k = rawMaterials.find(r => {
      const rName = (r.material_name || '').toLowerCase()
      return (rName.includes('2 kg') || rName.includes('2kg') || rName.includes('2000') || rName.includes('horeca')) &&
        !rName.includes('polymailer')
    })
    if (mat2k) return mat2k
  }

  // 4. If Alumunium Foil pouch
  if (isAlu) {
    const aluMat = rawMaterials.find(r => {
      const rName = (r.material_name || '').toLowerCase()
      return (rName.includes('alumunium') || rName.includes('alu')) && rName.includes(String(gram))
    }) || rawMaterials.find(r => (r.material_name || '').toLowerCase().includes('alumunium') || (r.material_name || '').toLowerCase().includes('alu'))
    if (aluMat) return aluMat
  }

  // 5. Standard Pouch / Standing Pouch
  const pouchList = rawMaterials.filter(r => {
    const rCat = (r.category || '').toLowerCase()
    const rName = (r.material_name || '').toLowerCase()
    return (rCat === 'pouch' || rCat === 'kemasan' || rName.includes('pouch')) && !rName.includes('polymailer')
  })

  if (pouchList.length > 0) {
    if (gram === 250) {
      const p250 = pouchList.find(r => r.material_name.includes('250') && !r.material_name.toLowerCase().includes('alu'))
        || pouchList.find(r => r.material_name.includes('250'))
      if (p250) return p250
    }
    if (gram === 200) {
      const p200 = pouchList.find(r => r.material_name.includes('200') && !r.material_name.toLowerCase().includes('alu'))
        || pouchList.find(r => r.material_name.includes('200'))
      if (p200) return p200
    }
    if (gram === 150) {
      const p150 = pouchList.find(r => r.material_name.includes('150'))
        || pouchList.find(r => r.material_name.includes('200') && !r.material_name.toLowerCase().includes('alu'))
        || pouchList.find(r => r.material_name.includes('100'))
      if (p150) return p150
    }
    if (gram === 100) {
      const p100 = pouchList.find(r => r.material_name.includes('100') && !r.material_name.toLowerCase().includes('alu'))
        || pouchList.find(r => r.material_name.includes('100'))
      if (p100) return p100
    }
    if (gram === 1000) {
      const p1k = pouchList.find(r => r.material_name.toLowerCase().includes('1 kg') || r.material_name.toLowerCase().includes('1kg') || r.material_name.includes('1000'))
      if (p1k) return p1k
    }
    return pouchList[0]
  }

  // 6. Curah / Bal fallback
  const isBal = name.includes('curah') || name.includes('bal')
  if (isBal) {
    return rawMaterials.find(r => {
      const rName = (r.material_name || '').toLowerCase()
      return (rName.includes('kardus') || rName.includes('box') || rName.includes('bal') || rName.includes('plastik')) && !rName.includes('polymailer')
    }) || null
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
 * @param {object|string|null} customKemasan - Override kemasan kustom jika ada
 * @returns {object} { totalStock, bottleneck, components: [...] }
 */
export function calculateBomProductStock(product, rawMaterials = [], customKemasan = null) {
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
    let kemasanMat = matchKemasanMaterial(product, rawMaterials)
    if (customKemasan) {
      if (typeof customKemasan === 'object' && customKemasan.current_stock !== undefined) {
        kemasanMat = customKemasan
      } else if (typeof customKemasan === 'string') {
        const found = rawMaterials.find(r => r.id === customKemasan || r.material_name === customKemasan)
        if (found) kemasanMat = found
      }
    }
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
  let kemasanMat = matchKemasanMaterial(product, rawMaterials)
  if (customKemasan) {
    if (typeof customKemasan === 'object' && customKemasan.current_stock !== undefined) {
      kemasanMat = customKemasan
    } else if (typeof customKemasan === 'string') {
      const found = rawMaterials.find(r => r.id === customKemasan || r.material_name === customKemasan)
      if (found) kemasanMat = found
    }
  }
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

/**
 * Menghitung HPP Pokok Produk Jadi dari komponen bahan baku & kemasan terkini
 * @param {object} product
 * @param {Array} rawMaterials
 * @param {object|number|null} customKemasan - Override kemasan jika menggunakan pouch khusus
 * @returns {number} HPP per unit (dalam Rupiah)
 */
/**
 * Mencocokkan Plastik Polymailer / Packing Luar
 */
export function matchOtherPackagingMaterial(product, rawMaterials = []) {
  if (!rawMaterials || rawMaterials.length === 0) return null
  const name = (product?.product_name || '').toLowerCase()
  if (name.includes('curah') || name.includes('bal')) return null

  return rawMaterials.find(r => {
    const rCat = (r.category || '').toLowerCase()
    const rName = (r.material_name || '').toLowerCase()
    return rCat === 'packing' || rName.includes('polymailer') || rName.includes('plastik packing') || (rCat === 'packaging' && rName.includes('polymailer'))
  }) || null
}

/**
 * Menghitung HPP standar produk berdasarkan BOM bahan baku saat ini
 * @param {object} product 
 * @param {Array} rawMaterials 
 * @param {object|number|null} customKemasan - Override kemasan jika menggunakan pouch khusus
 * @param {object} options - { noFrontSticker, noBackSticker, noStickers, noPolymailer, noOtherPackaging }
 * @returns {number} HPP per unit (dalam Rupiah)
 */
export function calculateBomProductHpp(product, rawMaterials = [], customKemasan = null, options = {}) {
  if (!product || !rawMaterials || rawMaterials.length === 0) {
    return Number(product?.avg_buy_price) || 0
  }
  const name = product.product_name || ''
  const nameLower = name.toLowerCase()
  const isBundling = product.category === 'Paket Bundling & Combo' || nameLower.includes('paket') || nameLower.includes('bundling')

  const noFront = Boolean(options?.noFrontSticker || options?.noStickers)
  const noBack = Boolean(options?.noBackSticker || options?.noStickers)
  const noPolymailer = Boolean(options?.noPolymailer || options?.noOtherPackaging || options?.noOtherPkg)

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
    let kemasanMat = matchKemasanMaterial(product, rawMaterials)
    if (customKemasan) {
      kemasanMat = typeof customKemasan === 'object' ? customKemasan : { unit_cost: Number(customKemasan) || 0 }
    }
    const sFrontMat = noFront ? null : matchStickerFrontMaterial(product, rawMaterials)
    const sBackMat = noBack ? null : matchStickerBackMaterial(product, rawMaterials)
    const otherMat = noPolymailer ? null : matchOtherPackagingMaterial(product, rawMaterials)

    const getMatCost = (mat) => Number(mat?.active_fifo_cost ?? mat?.unit_cost) || 0

    let totalCost = 0
    if (bawangMat) {
      const isKg = (bawangMat.unit || '').toLowerCase() === 'kg'
      const costPerGram = isKg ? getMatCost(bawangMat) / 1000 : getMatCost(bawangMat)
      totalCost += gramPerPack * costPerGram
    }
    if (kemasanMat) totalCost += multiplier * getMatCost(kemasanMat)
    if (sFrontMat) totalCost += multiplier * getMatCost(sFrontMat)
    if (sBackMat) totalCost += multiplier * getMatCost(sBackMat)
    if (otherMat) totalCost += multiplier * getMatCost(otherMat)

    return totalCost > 0 ? Math.round(totalCost) : (Number(product.avg_buy_price) || 0)
  }

  const getMatCost = (mat) => Number(mat?.active_fifo_cost ?? mat?.unit_cost) || 0
  const gram = extractProductGrammage(name, product.notes)
  const bawangMat = matchBawangMaterial(product, rawMaterials)
  let kemasanMat = matchKemasanMaterial(product, rawMaterials)
  if (customKemasan) {
    kemasanMat = typeof customKemasan === 'object' ? customKemasan : { unit_cost: Number(customKemasan) || 0 }
  }
  const sFrontMat = noFront ? null : matchStickerFrontMaterial(product, rawMaterials)
  const sBackMat = noBack ? null : matchStickerBackMaterial(product, rawMaterials)
  const otherMat = noPolymailer ? null : matchOtherPackagingMaterial(product, rawMaterials)

  let totalCost = 0
  if (bawangMat) {
    const isKg = (bawangMat.unit || '').toLowerCase() === 'kg'
    const costPerGram = isKg ? getMatCost(bawangMat) / 1000 : getMatCost(bawangMat)
    totalCost += gram * costPerGram
  }
  if (kemasanMat) totalCost += getMatCost(kemasanMat)
  if (sFrontMat) totalCost += getMatCost(sFrontMat)
  if (sBackMat) totalCost += getMatCost(sBackMat)
  if (otherMat) totalCost += getMatCost(otherMat)

  return totalCost > 0 ? Math.round(totalCost) : (Number(product.avg_buy_price) || 0)
}

