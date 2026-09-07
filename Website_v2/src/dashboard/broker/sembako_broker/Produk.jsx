import React, { useState, useMemo, useEffect, useRef } from 'react'
import {
  Plus, Search, X, ChevronDown, ToggleLeft, ToggleRight, Trash2, Package,
  FileSpreadsheet, AlertTriangle, Layers, Tag, Calculator, Boxes, Sparkles,
  Edit3, RefreshCw, Layers2, ShieldAlert, PackagePlus, History, SlidersHorizontal
} from 'lucide-react'
import ImportCsvModal from '@/components/ui/ImportCsvModal'
import { motion, AnimatePresence } from 'framer-motion'
import { toast } from 'sonner'
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@/components/ui/alert-dialog'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import {
  useSembakoProducts,
  useCreateSembakoProduct,
  useUpdateSembakoProduct,
  useSoftDeleteSembakoProduct,
  useSembakoRawMaterials,
  useDeleteSembakoRawMaterial,
} from '@/lib/hooks/useSembakoData'
import { useSembakoSales } from '@/lib/hooks/sembako/sembakoSales'
import SembakoBahanBakuSheet from './components/SembakoBahanBakuSheet'
import { SembakoRestockBahanModal } from './components/SembakoRestockBahanModal'
import { SembakoAdjustStockModal } from './components/SembakoAdjustStockModal'
import { SembakoBahanBeliHistoryModal } from './components/SembakoBahanBeliHistoryModal'
import { formatIDR } from '@/lib/format'
import { useOutletContext, useLocation, useNavigate } from 'react-router-dom'
import { C, CustomSelect } from '@/dashboard/broker/sembako_broker/components/sembakoSaleUtils'
import { BrokerMobileHeader } from '@/dashboard/broker/_shared/components/BrokerMobileHeader'
import { SembakoErrorState, SembakoEmptyState } from '@/dashboard/broker/sembako_broker/components/SembakoUiPrimitives'
import { SembakoPageHeader } from '@/dashboard/broker/sembako_broker/components/SembakoPageHeader'
import { SembakoSummaryStrip } from '@/dashboard/broker/sembako_broker/components/SembakoSummaryStrip'
import { useMediaQuery } from '@/lib/hooks/useMediaQuery'
import { useBackHandler } from '@/lib/hooks/useBackHandler'
import { calculateBomProductStock } from '@/lib/inventory/bomStockCalculator'

// ── Constants ─────────────────────────────────────────────────────────────────

const TEXT_SEC = '#94A3B8'

export function parseProductGrammage(product) {
  if (!product) return 999999
  const name = (product.product_name || '').toLowerCase()
  const sku = (product.sku || '').toLowerCase()

  // 1. Check direct KG notations
  if (name.includes('2 kg') || name.includes('2kg') || sku.includes('2kg') || sku.includes('2k')) return 2000
  if (name.includes('1 kg') || name.includes('1kg') || sku.includes('1kg') || sku.includes('1k')) return 1000

  // 2. Check combo / bundling expressions e.g. "2x 250g", "2x250"
  const comboMatch = name.match(/(\d+)\s*x\s*(\d+)\s*g?/i)
  if (comboMatch) {
    const qty = parseInt(comboMatch[1], 10)
    const g = parseInt(comboMatch[2], 10)
    return qty * g
  }

  // e.g. "150g + 250g"
  const addMatch = name.match(/(\d+)\s*g?\s*\+\s*(\d+)\s*g?/i)
  if (addMatch) {
    const g1 = parseInt(addMatch[1], 10)
    const g2 = parseInt(addMatch[2], 10)
    return g1 + g2
  }

  // 3. Regular single gram pattern e.g. 100g, 150g, 200g, 250g, 500g
  const gramMatch = name.match(/(\d+)\s*(?:g|gr|gram)/i)
  if (gramMatch) {
    return parseInt(gramMatch[1], 10)
  }

  // 4. Fallback check from numbers in name
  const numMatches = name.match(/\b(\d{2,4})\b/)
  if (numMatches) {
    const val = parseInt(numMatches[1], 10)
    if (val >= 50 && val <= 5000) return val
  }

  // 5. SKU fallback e.g. JBM-150, JBA-250, JBA-100
  const skuMatch = sku.match(/(\d+)/)
  if (skuMatch) {
    const val = parseInt(skuMatch[1], 10)
    if (val <= 10) return val * 1000
    if (val >= 50) return val
  }

  if ((product.unit || '').toLowerCase() === 'kg') return 1000

  return 999999
}

export function formatGrammageLabel(product) {
  const g = parseProductGrammage(product)
  if (g === 999999) return null
  if (g >= 1000) {
    const kg = g / 1000
    return `${kg} Kg`
  }
  return `${g}g`
}

const CATEGORY_PRIORITY = {
  'Grade S Murni': 1,
  'Grade A Crispy': 2,
  'Paket Bundling & Combo': 3,
  'Bawang Curah / Bal': 4,
}

const CATEGORY_META = {
  'Grade S Murni': {
    icon: '🧅',
    label: 'Grade S Murni',
    desc: '100% Bawang Merah Asli Tanpa Campuran Tepung',
    badge: 'bg-emerald-50 text-emerald-800 border-emerald-200 dark:bg-emerald-950/40 dark:text-emerald-300 dark:border-emerald-800'
  },
  'Grade A Crispy': {
    icon: '🧄',
    label: 'Grade A Crispy',
    desc: 'Bawang Goreng Renyah Gurih (~5% Tepung)',
    badge: 'bg-amber-50 text-amber-800 border-amber-200 dark:bg-amber-950/40 dark:text-amber-300 dark:border-amber-800'
  },
  'Paket Bundling & Combo': {
    icon: '🎁',
    label: 'Paket Bundling & Combo',
    desc: 'Paket Hemat, Combo Rumahan & Reseller',
    badge: 'bg-purple-50 text-purple-800 border-purple-200 dark:bg-purple-950/40 dark:text-purple-300 dark:border-purple-800'
  }
}

const CATEGORIES = [
  'Grade S Murni',
  'Grade A Crispy',
  'Paket Bundling & Combo',
  'Bawang Curah / Bal',
  'Kemasan & Packaging',
  'Bahan Baku Mentah',
  'Lain-lain',
]

const BAWANG_GORENG_TEMPLATES = [
  // ── GRADE S MURNI (100% Bawang Asli - 0% Tepung) ──
  {
    grade: 'Grade S Murni',
    gradeLabel: '🧅 Grade S Murni (100% Asli)',
    name: '[HERO] Murni Pouch 250g',
    category: 'Grade S Murni',
    unit: 'pcs',
    secondary_unit: 'karton',
    conversion_rate: 20,
    sku: 'JBM-250',
    sell_price: 40000,
    avg_buy_price: 29943,
    harga_solo_rp: 39500,
    harga_luar_kota_rp: 43500,
    harga_grosir_rp: 39500,
    raw_ingredient_cost: 26250,
    pouch_cost: 1283,
    sticker_front_cost: 1083,
    sticker_back_cost: 1083,
    other_packaging_cost: 244,
    min_stock_alert: 10,
    notes: '100% Bawang Asli Boyolali Murni, Pouch Ziplock 250g (1 Karton = 20 Pouch)',
  },
  {
    grade: 'Grade S Murni',
    gradeLabel: '🧅 Grade S Murni (100% Asli)',
    name: 'Murni Pouch 200g',
    category: 'Grade S Murni',
    unit: 'pcs',
    secondary_unit: 'karton',
    conversion_rate: 20,
    sku: 'JBM-200',
    sell_price: 34500,
    avg_buy_price: 24538,
    harga_solo_rp: 34500,
    harga_luar_kota_rp: 37500,
    harga_grosir_rp: 32000,
    raw_ingredient_cost: 21000,
    pouch_cost: 1128,
    sticker_front_cost: 1083,
    sticker_back_cost: 1083,
    other_packaging_cost: 244,
    min_stock_alert: 10,
    notes: '100% Bawang Asli Boyolali Murni, Pouch Ziplock 200g (1 Karton = 20 Pouch)',
  },
  {
    grade: 'Grade S Murni',
    gradeLabel: '🧅 Grade S Murni (100% Asli)',
    name: 'Murni Pouch 150g',
    category: 'Grade S Murni',
    unit: 'pcs',
    secondary_unit: 'karton',
    conversion_rate: 20,
    sku: 'JBM-150',
    sell_price: 26000,
    avg_buy_price: 19360,
    harga_solo_rp: 26000,
    harga_luar_kota_rp: 26500,
    harga_grosir_rp: 25000,
    raw_ingredient_cost: 15750,
    pouch_cost: 1200,
    sticker_front_cost: 1083,
    sticker_back_cost: 1083,
    other_packaging_cost: 244,
    min_stock_alert: 10,
    notes: '100% Bawang Asli Boyolali Murni, Pouch Ziplock 150g (1 Karton = 20 Pouch)',
  },
  {
    grade: 'Grade S Murni',
    gradeLabel: '🧅 Grade S Murni (100% Asli)',
    name: 'Trial Pack Murni 100g',
    category: 'Grade S Murni',
    unit: 'pcs',
    secondary_unit: 'karton',
    conversion_rate: 40,
    sku: 'JBM-100-TRIAL',
    sell_price: 21600,
    avg_buy_price: 14135,
    harga_solo_rp: 21600,
    harga_luar_kota_rp: 23500,
    harga_grosir_rp: 18000,
    raw_ingredient_cost: 10500,
    pouch_cost: 1225,
    sticker_front_cost: 1083,
    sticker_back_cost: 1083,
    other_packaging_cost: 244,
    min_stock_alert: 15,
    notes: 'Trial Pack Tester 100g Murni (1 Karton = 40 Pouch)',
  },
  {
    grade: 'Grade S Murni',
    gradeLabel: '🧅 Grade S Murni (100% Asli)',
    name: 'Murni Bal PE 1 Kg',
    category: 'Grade S Murni',
    unit: 'kg',
    secondary_unit: 'bal',
    conversion_rate: 10,
    sku: 'JBM-1K',
    sell_price: 152000,
    avg_buy_price: 107500,
    harga_solo_rp: 152000,
    harga_luar_kota_rp: 165500,
    harga_grosir_rp: 135000,
    raw_ingredient_cost: 105000,
    pouch_cost: 0,
    sticker_front_cost: 1083,
    sticker_back_cost: 0,
    other_packaging_cost: 1417,
    min_stock_alert: 5,
    notes: 'Kemasan Bal PE Grosir 1 Kg Murni (1 Bal = 10 Kg)',
  },
  {
    grade: 'Grade S Murni',
    gradeLabel: '🧅 Grade S Murni (100% Asli)',
    name: 'Bawang Murni 2 kg Bal HORECA',
    category: 'Grade S Murni',
    unit: 'kg',
    secondary_unit: 'bal',
    conversion_rate: 10,
    sku: 'JBM-HORECA-2KG',
    sell_price: 304000,
    avg_buy_price: 215000,
    harga_solo_rp: 304000,
    harga_luar_kota_rp: 331000,
    harga_grosir_rp: 270000,
    raw_ingredient_cost: 210000,
    pouch_cost: 0,
    sticker_front_cost: 1083,
    sticker_back_cost: 0,
    other_packaging_cost: 3917,
    min_stock_alert: 5,
    notes: 'Suplai Restoran & Kuliner Bal PE 2 kg (1 Bal = 10 Kg)',
  },

  // ── GRADE A CRISPY (~5% Tepung Renyah) ──
  {
    grade: 'Grade A Crispy',
    gradeLabel: '🧄 Grade A Crispy (Extra Renyah)',
    name: '[HERO] Grade A Pouch 250g',
    category: 'Grade A Crispy',
    unit: 'pcs',
    secondary_unit: 'karton',
    conversion_rate: 20,
    sku: 'JBA-250',
    sell_price: 35000,
    avg_buy_price: 27443,
    harga_solo_rp: 35000,
    harga_luar_kota_rp: 37500,
    harga_grosir_rp: 32500,
    raw_ingredient_cost: 23750,
    pouch_cost: 1283,
    sticker_front_cost: 1083,
    sticker_back_cost: 1083,
    other_packaging_cost: 244,
    min_stock_alert: 10,
    notes: 'Grade A Crispy Renyah Mantap 250g (1 Karton = 20 Pouch)',
  },
  {
    grade: 'Grade A Crispy',
    gradeLabel: '🧄 Grade A Crispy (Extra Renyah)',
    name: 'Grade A Pouch 200g',
    category: 'Grade A Crispy',
    unit: 'pcs',
    secondary_unit: 'karton',
    conversion_rate: 20,
    sku: 'JBA-200',
    sell_price: 31000,
    avg_buy_price: 22538,
    harga_solo_rp: 31000,
    harga_luar_kota_rp: 31500,
    harga_grosir_rp: 26000,
    raw_ingredient_cost: 19000,
    pouch_cost: 1128,
    sticker_front_cost: 1083,
    sticker_back_cost: 1083,
    other_packaging_cost: 244,
    min_stock_alert: 10,
    notes: 'Grade A Crispy Renyah Mantap 200g (1 Karton = 20 Pouch)',
  },
  {
    grade: 'Grade A Crispy',
    gradeLabel: '🧄 Grade A Crispy (Extra Renyah)',
    name: 'Grade A Pouch 150g',
    category: 'Grade A Crispy',
    unit: 'pcs',
    secondary_unit: 'karton',
    conversion_rate: 20,
    sku: 'JBA-150',
    sell_price: 25000,
    avg_buy_price: 17860,
    harga_solo_rp: 25000,
    harga_luar_kota_rp: 26500,
    harga_grosir_rp: 21000,
    raw_ingredient_cost: 14250,
    pouch_cost: 1200,
    sticker_front_cost: 1083,
    sticker_back_cost: 1083,
    other_packaging_cost: 244,
    min_stock_alert: 10,
    notes: 'Grade A Crispy Renyah Mantap 150g (1 Karton = 20 Pouch)',
  },
  {
    grade: 'Grade A Crispy',
    gradeLabel: '🧄 Grade A Crispy (Extra Renyah)',
    name: 'Trial Pack Grade A 100g',
    category: 'Grade A Crispy',
    unit: 'pcs',
    secondary_unit: 'karton',
    conversion_rate: 40,
    sku: 'JBA-100-TRIAL',
    sell_price: 18900,
    avg_buy_price: 13135,
    harga_solo_rp: 18900,
    harga_luar_kota_rp: 20500,
    harga_grosir_rp: 15000,
    raw_ingredient_cost: 9500,
    pouch_cost: 1225,
    sticker_front_cost: 1083,
    sticker_back_cost: 1083,
    other_packaging_cost: 244,
    min_stock_alert: 15,
    notes: 'Trial Pack Tester 100g Grade A (1 Karton = 40 Pouch)',
  },
  {
    grade: 'Grade A Crispy',
    gradeLabel: '🧄 Grade A Crispy (Extra Renyah)',
    name: 'Grade A Bal PE 1 Kg',
    category: 'Grade A Crispy',
    unit: 'kg',
    secondary_unit: 'bal',
    conversion_rate: 10,
    sku: 'JBA-1K',
    sell_price: 125000,
    avg_buy_price: 97500,
    harga_solo_rp: 125000,
    harga_luar_kota_rp: 135500,
    harga_grosir_rp: 116000,
    raw_ingredient_cost: 95000,
    pouch_cost: 0,
    sticker_front_cost: 1083,
    sticker_back_cost: 0,
    other_packaging_cost: 1417,
    min_stock_alert: 5,
    notes: 'Kemasan Bal PE Grosir 1 Kg Grade A (1 Bal = 10 Kg)',
  },
  {
    grade: 'Grade A Crispy',
    gradeLabel: '🧄 Grade A Crispy (Extra Renyah)',
    name: 'Bawang Grade A 2 kg Bal HORECA',
    category: 'Grade A Crispy',
    unit: 'kg',
    secondary_unit: 'bal',
    conversion_rate: 10,
    sku: 'JBA-HORECA-2KG',
    sell_price: 250000,
    avg_buy_price: 195000,
    harga_solo_rp: 250000,
    harga_luar_kota_rp: 271000,
    harga_grosir_rp: 232000,
    raw_ingredient_cost: 190000,
    pouch_cost: 0,
    sticker_front_cost: 1083,
    sticker_back_cost: 0,
    other_packaging_cost: 3917,
    min_stock_alert: 5,
    notes: 'Suplai Restoran & Kuliner Bal PE 2 kg Grade A (1 Bal = 10 Kg)',
  },

  // ── PAKET BUNDLING & COMBO ──
  {
    grade: 'Paket Bundling & Combo',
    gradeLabel: '🎁 Paket Bundling & Combo',
    name: 'Paket Hemat Bundling (2x 250g Murni)',
    category: 'Paket Bundling & Combo',
    unit: 'pack',
    secondary_unit: '',
    conversion_rate: '',
    sku: 'BDL-MURNI-2X250',
    sell_price: 87000,
    avg_buy_price: 59886,
    harga_solo_rp: 80000,
    harga_luar_kota_rp: 87000,
    harga_grosir_rp: 78000,
    raw_ingredient_cost: 52500,
    pouch_cost: 2566,
    sticker_front_cost: 2166,
    sticker_back_cost: 2166,
    other_packaging_cost: 488,
    min_stock_alert: 5,
    notes: 'Paket Hemat Bundling 2x 250g Murni (Hemat Rp 5.000)',
  },
  {
    grade: 'Paket Bundling & Combo',
    gradeLabel: '🎁 Paket Bundling & Combo',
    name: 'Paket Combo Rumahan (150g + 250g Murni)',
    category: 'Paket Bundling & Combo',
    unit: 'pack',
    secondary_unit: '',
    conversion_rate: '',
    sku: 'BDL-MURNI-150-250',
    sell_price: 70000,
    avg_buy_price: 49303,
    harga_solo_rp: 65000,
    harga_luar_kota_rp: 70000,
    harga_grosir_rp: 63000,
    raw_ingredient_cost: 42000,
    pouch_cost: 2483,
    sticker_front_cost: 2166,
    sticker_back_cost: 2166,
    other_packaging_cost: 488,
    min_stock_alert: 5,
    notes: 'Paket Combo Rumahan 150g + 250g Murni',
  },
  {
    grade: 'Paket Bundling & Combo',
    gradeLabel: '🎁 Paket Bundling & Combo',
    name: 'Paket Hemat Bundling (2x 250g Grade A)',
    category: 'Paket Bundling & Combo',
    unit: 'pack',
    secondary_unit: '',
    conversion_rate: '',
    sku: 'BDL-GRDA-2X250',
    sell_price: 75000,
    avg_buy_price: 54886,
    harga_solo_rp: 70000,
    harga_luar_kota_rp: 75000,
    harga_grosir_rp: 65000,
    raw_ingredient_cost: 47500,
    pouch_cost: 2566,
    sticker_front_cost: 2166,
    sticker_back_cost: 2166,
    other_packaging_cost: 488,
    min_stock_alert: 5,
    notes: 'Paket Hemat Bundling 2x 250g Grade A Crispy',
  },
  {
    grade: 'Paket Bundling & Combo',
    gradeLabel: '🎁 Paket Bundling & Combo',
    name: 'Paket Combo Rumahan (150g + 250g Grade A)',
    category: 'Paket Bundling & Combo',
    unit: 'pack',
    secondary_unit: '',
    conversion_rate: '',
    sku: 'BDL-GRDA-150-250',
    sell_price: 64000,
    avg_buy_price: 45303,
    harga_solo_rp: 60000,
    harga_luar_kota_rp: 64000,
    harga_grosir_rp: 53500,
    raw_ingredient_cost: 38000,
    pouch_cost: 2483,
    sticker_front_cost: 2166,
    sticker_back_cost: 2166,
    other_packaging_cost: 488,
    min_stock_alert: 5,
    notes: 'Paket Combo Rumahan 150g + 250g Grade A Crispy',
  },
]

const UNITS = [
  'pcs',
  'pouch',
  'toples',
  'karton',
  'dus',
  'bal',
  'kg',
  'pack',
  'bungkus',
  'renceng',
  'lusin',
  'gram',
]

const DEFAULT_CONVERSIONS = {
  'karton': 20,
  'dus': 20,
  'bal': 20,
  'pack': 10,
  'pres': 10,
  'renceng': 12,
  'lusin': 12,
  'sak': 50,
  'karung': 50,
}

const fmt = (n) => new Intl.NumberFormat('id-ID', { maximumFractionDigits: 0 }).format(Math.round(Number(n) || 0))
const fmtStock = (n) => {
  const num = Number(n) || 0
  return new Intl.NumberFormat('id-ID', {
    minimumFractionDigits: 0,
    maximumFractionDigits: 3
  }).format(num)
}

// ── Stock bar helpers ─────────────────────────────────────────────────────────

function stockPercent(product) {
  const { current_stock, min_stock_alert } = product
  if (!min_stock_alert || min_stock_alert <= 0) return null
  return Math.min(100, Math.round((current_stock / (min_stock_alert * 3)) * 100))
}

function stockColor(pct) {
  if (pct === null) return '#4B5563'
  if (pct > 50) return '#021a02'
  if (pct > 20) return '#FBBF24'
  return '#F87171'
}

function stockLabel(product) {
  const { current_stock, min_stock_alert, unit } = product
  if (!min_stock_alert || current_stock > min_stock_alert) return null
  return `Stok menipis: ${current_stock} ${unit}`
}

// ── Margin badge ──────────────────────────────────────────────────────────────

function marginInfo(product) {
  const { sell_price, avg_buy_price } = product
  if (!sell_price || !avg_buy_price || avg_buy_price === 0) return null
  const margin = ((sell_price - avg_buy_price) / sell_price) * 100
  return { pct: margin.toFixed(1), color: margin > 15 ? '#021a02' : margin > 5 ? '#FBBF24' : '#F87171' }
}

import { useAuth } from '@/lib/hooks/useAuth'
import { recordAuditLog } from '@/lib/hooks/useSembakoAudit'

// ── Sheet overlay ─────────────────────────────────────────────────────────────

function ProductSheet({ product, onClose, onDelete }) {
  useBackHandler(true, onClose)
  const { profile } = useAuth()
  const isEdit = !!product?.id
  const createMut = useCreateSembakoProduct()
  const updateMut = useUpdateSembakoProduct()
  const { data: rawMaterials = [] } = useSembakoRawMaterials()

  const [form, setForm] = useState({
    product_name: product?.product_name || '',
    category: product?.category || 'Grade S Murni',
    unit: product?.unit || 'pcs',
    sku: product?.sku || '',
    sell_price: product?.sell_price || '',
    avg_buy_price: product?.avg_buy_price || '',
    current_stock: product?.current_stock || 0,
    min_stock_alert: product?.min_stock_alert || '',
    notes: product?.notes || '',
    is_active: product?.is_active ?? true,
    secondary_unit: product?.secondary_unit || '',
    conversion_rate: product?.conversion_rate || '',
    // Multi-tier regional pricing
    harga_solo_rp: product?.harga_solo_rp || '',
    harga_luar_kota_rp: product?.harga_luar_kota_rp || '',
    harga_grosir_rp: product?.harga_grosir_rp || '',
    // BOM breakdown
    raw_ingredient_cost: product?.raw_ingredient_cost || '',
    pouch_cost: product?.pouch_cost || '',
    sticker_front_cost: product?.sticker_front_cost || '',
    sticker_back_cost: product?.sticker_back_cost || '',
    other_packaging_cost: product?.other_packaging_cost || '',
  })
  const [bomSelections, setBomSelections] = useState({
    bawangId: '',
    pouchId: '',
    stickerFrontId: '',
    stickerBackId: '',
    packagingId: ''
  })
  const [selectedGradeTab, setSelectedGradeTab] = useState('Grade S Murni')
  const [showBomCalculator, setShowBomCalculator] = useState(false)
  const [catOpen, setCatOpen] = useState(false)
  const [priceInputUnit, setPriceInputUnit] = useState('primary') // 'primary' (Retail) | 'secondary' (Grosir)
  const [tempGrosirSellPrice, setTempGrosirSellPrice] = useState('')
  const [tempGrosirBuyPrice, setTempGrosirBuyPrice] = useState('')

  const convRate = Number(form.conversion_rate) > 0 ? Number(form.conversion_rate) : 1
  const hasGrosirUnit = Boolean(form.secondary_unit && Number(form.conversion_rate) > 0)

  const set = (key, val) => setForm(f => ({ ...f, [key]: val }))

  // Live calculation of available stock capacity from BOM materials
  const liveBomStock = useMemo(() => {
    return calculateBomProductStock(form, rawMaterials)
  }, [form, rawMaterials])

  // Helper to match rawMaterials based on saved costs / product name
  const detectBomSelections = (formObj, materials) => {
    if (!materials || materials.length === 0) return {}
    const nameLower = (formObj.product_name || '').toLowerCase()
    const isBal = nameLower.includes('bal') || nameLower.includes('curah') || nameLower.includes('mentah')
    
    // Match Bawang
    let matchedBawang = null
    if (nameLower.includes('murni') || formObj.category === 'Grade S Murni') {
      matchedBawang = materials.find(r => r.material_name.toLowerCase().includes('murni')) || materials.find(r => ['bawang_mentah', 'bawang_curah'].includes(r.category))
    } else {
      matchedBawang = materials.find(r => r.material_name.toLowerCase().includes('kripsy') || r.material_name.toLowerCase().includes('grade a')) || materials.find(r => ['bawang_mentah', 'bawang_curah'].includes(r.category))
    }
    if (!matchedBawang) {
      matchedBawang = materials.find(r => ['bawang_mentah', 'bawang_curah', 'mentah', 'bawang'].includes((r.category || '').toLowerCase()) || (r.material_name || '').toLowerCase().includes('bawang'))
    }

    // Match Pouch - prioritize matching saved cost or size if not bal
    let matchedPouch = null
    const hasPouchCost = Number(formObj.pouch_cost) > 0
    if (hasPouchCost || !isBal) {
      if (nameLower.includes('100') && !nameLower.includes('1000')) {
        matchedPouch = materials.find(r => r.category === 'pouch' && r.material_name.includes('100'))
      } else if (nameLower.includes('150')) {
        matchedPouch = materials.find(r => r.category === 'pouch' && (r.material_name.includes('150') || r.material_name.includes('100') || r.material_name.includes('200')))
      } else if (nameLower.includes('200')) {
        matchedPouch = materials.find(r => r.category === 'pouch' && r.material_name.includes('200'))
      } else if (nameLower.includes('250')) {
        matchedPouch = materials.find(r => r.category === 'pouch' && r.material_name.includes('250'))
      } else if (nameLower.includes('1 kg') || nameLower.includes('1kg') || nameLower.includes('1000')) {
        matchedPouch = materials.find(r => r.category === 'pouch' && (r.material_name.toLowerCase().includes('1 kg') || r.material_name.toLowerCase().includes('1kg') || r.material_name.includes('1000')))
      }
      if (!matchedPouch && hasPouchCost) {
        matchedPouch = materials.find(r => (r.category === 'pouch' || r.material_name.toLowerCase().includes('pouch')) && Math.round(Number(r.unit_cost)) === Math.round(Number(formObj.pouch_cost)))
          || materials.find(r => r.category === 'pouch' || r.material_name.toLowerCase().includes('pouch'))
      }
    }

    // Match Sticker Front
    let sFront = null
    if (Number(formObj.sticker_front_cost) > 0 || !isBal) {
      sFront = materials.find(r => r.category === 'sticker_depan' || r.material_name.toLowerCase().includes('stiker depan') || r.material_name.toLowerCase().includes('label depan'))
    }

    // Match Sticker Back
    let sBack = null
    if (Number(formObj.sticker_back_cost) > 0 || (!isBal && !nameLower.includes('polos'))) {
      sBack = materials.find(r => r.category === 'sticker_belakang' || r.material_name.toLowerCase().includes('stiker belakang'))
    }

    // Match Packaging
    let pPack = null
    if (Number(formObj.other_packaging_cost) > 0) {
      pPack = materials.find(r => (['polymailer', 'kardus', 'packing'].includes(r.category) || r.material_name.toLowerCase().includes('polymailer') || r.material_name.toLowerCase().includes('plastik')) && Math.round(Number(r.unit_cost)) === Math.round(Number(formObj.other_packaging_cost)))
        || materials.find(r => ['polymailer', 'kardus', 'packing'].includes(r.category) || r.material_name.toLowerCase().includes('polymailer') || r.material_name.toLowerCase().includes('plastik'))
    } else {
      pPack = materials.find(r => ['polymailer', 'kardus', 'packing'].includes(r.category) || r.material_name.toLowerCase().includes('polymailer') || r.material_name.toLowerCase().includes('plastik'))
    }

    return {
      bawangId: matchedBawang?.id ? String(matchedBawang.id) : '',
      pouchId: matchedPouch?.id ? String(matchedPouch.id) : '',
      stickerFrontId: sFront?.id ? String(sFront.id) : '',
      stickerBackId: sBack?.id ? String(sBack.id) : '',
      packagingId: pPack?.id ? String(pPack.id) : ''
    }
  }

  // Synchronize form & BOM dropdown selections when product prop changes in Edit mode
  useEffect(() => {
    if (product?.id) {
      const initialForm = {
        product_name: product.product_name || '',
        category: product.category || 'Grade S Murni',
        unit: product.unit || 'pcs',
        sku: product.sku || '',
        sell_price: product.sell_price || product.harga_solo_rp || '',
        avg_buy_price: product.avg_buy_price || '',
        current_stock: product.current_stock || 0,
        min_stock_alert: product.min_stock_alert || '',
        notes: product.notes || '',
        is_active: product.is_active ?? true,
        secondary_unit: product.secondary_unit || '',
        conversion_rate: product.conversion_rate || '',
        harga_solo_rp: product.harga_solo_rp || product.sell_price || '',
        harga_luar_kota_rp: product.harga_luar_kota_rp || '',
        harga_grosir_rp: product.harga_grosir_rp || '',
        raw_ingredient_cost: product.raw_ingredient_cost || '',
        pouch_cost: product.pouch_cost || '',
        sticker_front_cost: product.sticker_front_cost || '',
        sticker_back_cost: product.sticker_back_cost || '',
        other_packaging_cost: product.other_packaging_cost || '',
      }
      setForm(initialForm)
      if (rawMaterials.length > 0) {
        setBomSelections(detectBomSelections(initialForm, rawMaterials))
      }
    }
  }, [product, rawMaterials])

  // Auto calculate total HPP from BOM components if user changes any BOM field
  const updateBomCost = (key, val) => {
    setForm(f => {
      const updated = { ...f, [key]: val }
      const totalHppFromBom =
        (Number(updated.raw_ingredient_cost) || 0) +
        (Number(updated.pouch_cost) || 0) +
        (Number(updated.sticker_front_cost) || 0) +
        (Number(updated.sticker_back_cost) || 0) +
        (Number(updated.other_packaging_cost) || 0)

      if (totalHppFromBom > 0) {
        updated.avg_buy_price = totalHppFromBom
      }
      return updated
    })
  }

  // 1-Click Autofill BOM costs based on current inventory pricing
  const autofillBomFromMaster = (customName) => {
    const rawName = typeof customName === 'string' ? customName : (form.product_name || '')
    const nameLower = rawName.toLowerCase()
    let pouchCost = 0
    let stickerFrontCost = 0
    let stickerBackCost = 0
    let rawIngredientCost = 0
    let otherPackCost = 0

    const isBal = nameLower.includes('bal') || nameLower.includes('curah') || nameLower.includes('mentah')

    // Match Pouch
    let matchedPouch = null
    if (!isBal) {
      if (nameLower.includes('100') && !nameLower.includes('1000')) {
        matchedPouch = rawMaterials.find(r => r.category === 'pouch' && r.material_name.includes('100'))
      } else if (nameLower.includes('150')) {
        matchedPouch = rawMaterials.find(r => r.category === 'pouch' && (r.material_name.includes('150') || r.material_name.includes('100') || r.material_name.includes('200')))
      } else if (nameLower.includes('200')) {
        matchedPouch = rawMaterials.find(r => r.category === 'pouch' && r.material_name.includes('200'))
      } else if (nameLower.includes('250')) {
        matchedPouch = rawMaterials.find(r => r.category === 'pouch' && r.material_name.includes('250'))
      } else if (nameLower.includes('1 kg') || nameLower.includes('1kg') || nameLower.includes('1000')) {
        matchedPouch = rawMaterials.find(r => r.category === 'pouch' && (r.material_name.toLowerCase().includes('1 kg') || r.material_name.toLowerCase().includes('1kg') || r.material_name.includes('1000') || r.material_name.includes('1 KG')))
      }
      if (!matchedPouch) matchedPouch = rawMaterials.find(r => r.category === 'pouch' || r.material_name.toLowerCase().includes('pouch'))
    }
    if (matchedPouch) pouchCost = Math.round(Number(matchedPouch.unit_cost) || 0)

    // Match Sticker Front
    const sFront = rawMaterials.find(r => r.category === 'sticker_depan' || r.material_name.toLowerCase().includes('stiker depan') || r.material_name.toLowerCase().includes('label depan'))
    if (sFront) stickerFrontCost = Math.round(Number(sFront.unit_cost) || 0)

    // Match Sticker Back
    let sBack = null
    if (!isBal) {
      sBack = rawMaterials.find(r => r.category === 'sticker_belakang' || r.material_name.toLowerCase().includes('stiker belakang'))
      if (sBack) stickerBackCost = Math.round(Number(sBack.unit_cost) || 0)
    }

    // Match Bawang Curah
    let bCurah = null
    if (nameLower.includes('murni') || form.category === 'Grade S Murni') {
      bCurah = rawMaterials.find(r => r.material_name.toLowerCase().includes('murni')) || rawMaterials.find(r => ['bawang_mentah', 'bawang_curah'].includes(r.category))
    } else {
      bCurah = rawMaterials.find(r => r.material_name.toLowerCase().includes('kripsy') || r.material_name.toLowerCase().includes('grade a')) || rawMaterials.find(r => ['bawang_mentah', 'bawang_curah'].includes(r.category))
    }
    if (!bCurah) bCurah = rawMaterials.find(r => r.category === 'bawang_mentah' || r.material_name.toLowerCase().includes('bawang'))

    if (bCurah) {
      let gram = 100
      if (nameLower.includes('250')) gram = 250
      else if (nameLower.includes('200')) gram = 200
      else if (nameLower.includes('150')) gram = 150
      else if (nameLower.includes('100')) gram = 100
      else if (nameLower.includes('1 kg') || nameLower.includes('1kg')) gram = 1000
      else if (nameLower.includes('2 kg') || nameLower.includes('2kg')) gram = 2000

      const isKg = (bCurah.unit || '').toLowerCase() === 'kg'
      const unitCost = Number(bCurah.unit_cost) || 0
      rawIngredientCost = isKg ? Math.round(unitCost * gram / 1000) : Math.round(unitCost * gram)
    }

    // Match Polymailer / Packing
    const pPack = rawMaterials.find(r => ['polymailer', 'kardus', 'packing'].includes(r.category) || r.material_name.toLowerCase().includes('polymailer') || r.material_name.toLowerCase().includes('plastik'))
    if (pPack) otherPackCost = Math.round(Number(pPack.unit_cost) || 0)

    const totalHpp = rawIngredientCost + pouchCost + stickerFrontCost + stickerBackCost + otherPackCost

    setForm(f => ({
      ...f,
      raw_ingredient_cost: rawIngredientCost,
      pouch_cost: pouchCost,
      sticker_front_cost: stickerFrontCost,
      sticker_back_cost: stickerBackCost,
      other_packaging_cost: otherPackCost,
      avg_buy_price: totalHpp > 0 ? totalHpp : f.avg_buy_price
    }))

    setBomSelections({
      bawangId: bCurah?.id ? String(bCurah.id) : '',
      pouchId: matchedPouch?.id ? String(matchedPouch.id) : '',
      stickerFrontId: sFront?.id ? String(sFront.id) : '',
      stickerBackId: sBack?.id ? String(sBack.id) : '',
      packagingId: pPack?.id ? String(pPack.id) : ''
    })

    return { rawIngredientCost, pouchCost, stickerFrontCost, stickerBackCost, otherPackCost, totalHpp }
  }

  const applyTemplate = (tmpl) => {
    const bomRes = autofillBomFromMaster(tmpl.name)
    setForm(f => ({
      ...f,
      product_name: tmpl.name,
      category: tmpl.category,
      unit: tmpl.unit,
      secondary_unit: tmpl.secondary_unit,
      conversion_rate: tmpl.conversion_rate,
      sku: tmpl.sku,
      sell_price: tmpl.sell_price || f.sell_price,
      avg_buy_price: tmpl.avg_buy_price || (bomRes.totalHpp > 0 ? bomRes.totalHpp : f.avg_buy_price),
      harga_solo_rp: tmpl.harga_solo_rp || f.harga_solo_rp,
      harga_luar_kota_rp: tmpl.harga_luar_kota_rp || f.harga_luar_kota_rp,
      harga_grosir_rp: tmpl.harga_grosir_rp || f.harga_grosir_rp,
      min_stock_alert: tmpl.min_stock_alert,
      notes: tmpl.notes,
      raw_ingredient_cost: tmpl.raw_ingredient_cost || bomRes.rawIngredientCost || '',
      pouch_cost: tmpl.pouch_cost !== undefined ? tmpl.pouch_cost : (bomRes.pouchCost || ''),
      sticker_front_cost: tmpl.sticker_front_cost !== undefined ? tmpl.sticker_front_cost : (bomRes.stickerFrontCost || ''),
      sticker_back_cost: tmpl.sticker_back_cost !== undefined ? tmpl.sticker_back_cost : (bomRes.stickerBackCost || ''),
      other_packaging_cost: tmpl.other_packaging_cost !== undefined ? tmpl.other_packaging_cost : (bomRes.otherPackCost || ''),
    }))
    toast.success(`Template ${tmpl.category} "${tmpl.name}" diterapkan!`)
  }

  const handleSubmit = async (e) => {
    e.preventDefault()
    const rawSellPrice = form.sell_price ? Number(String(form.sell_price).replace(/\D/g, '')) : null
    const rawSoloPrice = form.harga_solo_rp ? Number(String(form.harga_solo_rp).replace(/\D/g, '')) : null
    const resolvedSellPrice = rawSellPrice || rawSoloPrice || null
    const resolvedSoloPrice = rawSoloPrice || rawSellPrice || null

    const payload = {
      ...form,
      sell_price: resolvedSellPrice,
      harga_solo_rp: resolvedSoloPrice,
      avg_buy_price: form.avg_buy_price ? Number(String(form.avg_buy_price).replace(/\D/g, '')) : null,
      min_stock_alert: form.min_stock_alert ? Number(String(form.min_stock_alert).replace(/\D/g, '')) : null,
      conversion_rate: form.conversion_rate ? Number(form.conversion_rate) : null,
      harga_luar_kota_rp: form.harga_luar_kota_rp ? Number(String(form.harga_luar_kota_rp).replace(/\D/g, '')) : null,
      harga_grosir_rp: form.harga_grosir_rp ? Number(String(form.harga_grosir_rp).replace(/\D/g, '')) : null,
      raw_ingredient_cost: form.raw_ingredient_cost ? Number(String(form.raw_ingredient_cost).replace(/\D/g, '')) : null,
      pouch_cost: form.pouch_cost ? Number(String(form.pouch_cost).replace(/\D/g, '')) : null,
      sticker_front_cost: form.sticker_front_cost ? Number(String(form.sticker_front_cost).replace(/\D/g, '')) : null,
      sticker_back_cost: form.sticker_back_cost ? Number(String(form.sticker_back_cost).replace(/\D/g, '')) : null,
      other_packaging_cost: form.other_packaging_cost ? Number(String(form.other_packaging_cost).replace(/\D/g, '')) : null,
    }
    if (isEdit) {
      await updateMut.mutateAsync({ id: product.id, ...payload })
      recordAuditLog({
        action_type: 'EDIT_PRODUK',
        product_name: form.product_name,
        old_value: `Rp ${Number(product.sell_price || 0).toLocaleString('id-ID')}`,
        new_value: `Rp ${Number(payload.sell_price || 0).toLocaleString('id-ID')}`,
        notes: `Perubahan data produk (${form.category}, Satuan: ${form.unit})`,
        profile,
      })
    } else {
      await createMut.mutateAsync(payload)
      recordAuditLog({
        action_type: 'TAMBAH_PRODUK',
        product_name: form.product_name,
        old_value: 'Produk Baru',
        new_value: `Rp ${Number(payload.sell_price || 0).toLocaleString('id-ID')}`,
        notes: `Penambahan produk baru`,
        profile,
      })
    }
    onClose()
  }

  const isLoading = createMut.isPending || updateMut.isPending

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      style={{ position: 'fixed', inset: 0, zIndex: 5000, background: 'rgba(0,0,0,0.75)', backdropFilter: 'blur(6px)', display: 'flex', alignItems: 'flex-end', justifyContent: 'center' }}
      onClick={onClose}
    >
      <motion.div
        initial={{ y: '100%' }}
        animate={{ y: 0 }}
        exit={{ y: '100%' }}
        transition={{ type: 'spring', stiffness: 320, damping: 32 }}
        style={{
          background: 'var(--bg-surface)',
          borderRadius: '24px 24px 0 0',
          width: '100%',
          maxWidth: '560px',
          padding: '0 0 max(36px, calc(20px + env(safe-area-inset-bottom, 20px)))',
          borderTop: '2px solid var(--brand-500)',
          boxShadow: 'var(--shadow-tko-lg)',
          maxHeight: '92vh',
          overflowY: 'auto',
          overflowX: 'hidden',
          boxSizing: 'border-box'
        }}
        onClick={e => e.stopPropagation()}
      >
        {/* Handle */}
        <div style={{ display: 'flex', justifyContent: 'center', padding: '12px 0 6px' }}>
          <div style={{ width: 40, height: 4, borderRadius: 2, background: 'var(--border-soft)' }} />
        </div>

        {/* Header */}
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '6px 20px 14px', borderBottom: '1px solid var(--border-soft)' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
            <div style={{ width: 34, height: 34, borderRadius: 10, background: 'rgba(15,23,42,0.12)', display: 'flex', alignItems: 'center', justifyContent: 'center', border: '1px solid rgba(15,23,42,0.3)' }}>
              <Package size={18} color="#0F172A" />
            </div>
            <div>
              <h2 style={{ fontFamily: 'Sora', fontSize: 16, fontWeight: 800, color: 'var(--text-primary)', margin: 0 }}>
                {isEdit ? 'Edit Produk' : 'Tambah Produk Baru'}
              </h2>
              <p style={{ fontSize: 11, color: 'var(--text-muted)', margin: 0 }}>Katalog Produk & Inventaris</p>
            </div>
          </div>
          <button onClick={onClose} style={{ background: 'var(--bg-subtle)', border: 'none', borderRadius: 8, width: 32, height: 32, display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer' }}>
            <X size={16} color="var(--text-muted)" />
          </button>
        </div>

        {/* FIFO Info Banner */}
        <div style={{ margin: '14px 20px 0', background: 'rgba(15,23,42,0.08)', border: '1px solid rgba(15,23,42,0.15)', borderRadius: 12, padding: '10px 12px', display: 'flex', alignItems: 'center', gap: 10 }}>
          <span style={{ fontSize: 14 }}>⚡</span>
          <p style={{ fontSize: 11, color: '#475569', fontWeight: 600, margin: 0, lineHeight: 1.4 }}>
            <strong style={{ color: '#0F172A' }}>Metode Stok FIFO (First-In, First-Out)</strong>: Stok tertua dipotong otomatis saat penjualan untuk perhitungan HPP & margin yang akurat.
          </p>
        </div>

        {/* Template Cepat Produk Resmi: Grade S Murni & Grade A Crispy */}
        {!isEdit && (
          <div style={{ margin: '14px 20px 0', background: 'var(--bg-subtle)', padding: '12px 14px', borderRadius: 16, border: '1px solid var(--border-soft)', display: 'flex', flexDirection: 'column', gap: 10 }}>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
              <span style={{ fontSize: 11, fontWeight: 800, color: 'var(--text-primary)', textTransform: 'uppercase', letterSpacing: '0.04em', display: 'flex', alignItems: 'center', gap: 6 }}>
                <span>🧅</span> Template Cepat Produk Resmi:
              </span>
              <span style={{ fontSize: 10, color: '#0c3d0c', fontWeight: 800, background: '#DCFCE7', padding: '2px 8px', borderRadius: 6 }}>
                ⚡ 1-Click HPP & Harga
              </span>
            </div>

            {/* Segmented Switch: Grade S Murni vs Grade A Crispy */}
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 6 }}>
              <button
                type="button"
                onClick={() => setSelectedGradeTab('Grade S Murni')}
                style={{
                  padding: '8px 10px',
                  borderRadius: 10,
                  border: selectedGradeTab === 'Grade S Murni' ? '1.5px solid #0F172A' : '1px solid var(--border-soft)',
                  background: selectedGradeTab === 'Grade S Murni' ? '#0F172A' : 'var(--bg-surface)',
                  color: selectedGradeTab === 'Grade S Murni' ? '#FFFFFF' : 'var(--text-primary)',
                  fontSize: 11.5,
                  fontWeight: 800,
                  cursor: 'pointer',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  gap: 6,
                  transition: 'all 0.15s'
                }}
              >
                <span>🧅</span>
                <span>Grade S Murni (100% Asli)</span>
              </button>

              <button
                type="button"
                onClick={() => setSelectedGradeTab('Grade A Crispy')}
                style={{
                  padding: '8px 10px',
                  borderRadius: 10,
                  border: selectedGradeTab === 'Grade A Crispy' ? '1.5px solid #0F172A' : '1px solid var(--border-soft)',
                  background: selectedGradeTab === 'Grade A Crispy' ? '#0F172A' : 'var(--bg-surface)',
                  color: selectedGradeTab === 'Grade A Crispy' ? '#FFFFFF' : 'var(--text-primary)',
                  fontSize: 11.5,
                  fontWeight: 800,
                  cursor: 'pointer',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  gap: 6,
                  transition: 'all 0.15s'
                }}
              >
                <span>🧄</span>
                <span>Grade A Crispy (~5% Tepung)</span>
              </button>
            </div>

            {/* List of SKU Presets for Selected Grade */}
            <div style={{ display: 'flex', gap: 8, overflowX: 'auto', paddingBottom: 4 }}>
              {BAWANG_GORENG_TEMPLATES.filter(t => t.grade === selectedGradeTab).map((tmpl) => {
                const isSelected = form.sku === tmpl.sku
                return (
                  <button
                    key={tmpl.sku}
                    type="button"
                    onClick={() => applyTemplate(tmpl)}
                    style={{
                      padding: '8px 12px',
                      borderRadius: 10,
                      background: isSelected ? '#0F172A' : 'var(--bg-surface)',
                      color: isSelected ? '#FFFFFF' : 'var(--text-primary)',
                      border: isSelected ? '1.5px solid #0F172A' : '1px solid var(--border-soft)',
                      cursor: 'pointer',
                      whiteSpace: 'nowrap',
                      display: 'flex',
                      flexDirection: 'column',
                      alignItems: 'flex-start',
                      gap: 2,
                      minWidth: '130px',
                      transition: 'all 0.15s',
                      boxShadow: isSelected ? '0 4px 12px rgba(15,23,42,0.15)' : 'none'
                    }}
                  >
                    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', width: '100%', gap: 6 }}>
                      <span style={{ fontSize: 11, fontWeight: 800 }}>{tmpl.name}</span>
                      <span style={{ fontSize: 9, fontWeight: 700, padding: '1px 5px', borderRadius: 4, background: isSelected ? 'rgba(255,255,255,0.2)' : '#F1F5F9', color: isSelected ? '#FFFFFF' : '#475569' }}>
                        {tmpl.sku}
                      </span>
                    </div>
                    <div style={{ fontSize: 10, opacity: isSelected ? 0.9 : 0.75, display: 'flex', gap: 6 }}>
                      <span>Jual: <strong>Rp {fmt(tmpl.sell_price)}</strong></span>
                      <span>·</span>
                      <span>HPP: Rp {fmt(tmpl.avg_buy_price)}</span>
                    </div>
                  </button>
                )
              })}
            </div>
          </div>
        )}

        <form onSubmit={handleSubmit} style={{ padding: '16px 20px 0', display: 'flex', flexDirection: 'column', gap: 14, width: '100%', maxWidth: '100%', boxSizing: 'border-box' }}>
          {/* Nama produk */}
          <Field label="Nama Produk *">
            <input
              id="product-name" name="product_name" type="text"
              value={form.product_name}
              onChange={e => set('product_name', e.target.value)}
              placeholder="contoh: [HERO] Murni Pouch 250g / Grade A Pouch 250g"
              style={inputStyle}
            />
          </Field>

          {/* Kategori — autocomplete dropdown */}
          <Field label="Kategori Produk">
            <div style={{ position: 'relative' }}>
              <div style={{ position: 'relative' }}>
                <input
                  id="product-category" name="category" type="text"
                  value={form.category}
                  onChange={e => { set('category', e.target.value); setCatOpen(true) }}
                  onFocus={() => setCatOpen(true)}
                  onBlur={() => setTimeout(() => setCatOpen(false), 200)}
                  placeholder="Pilih atau ketik kategori"
                  style={{ ...inputStyle, paddingRight: 36 }}
                  autoComplete="off"
                />
                <button
                  type="button"
                  onClick={() => setCatOpen(!catOpen)}
                  style={{ position: 'absolute', right: 12, top: '50%', transform: 'translateY(-50%)', background: 'transparent', border: 'none', cursor: 'pointer', display: 'flex' }}
                >
                  <ChevronDown size={16} color={TEXT_SEC} style={{ transform: catOpen ? 'rotate(180deg)' : 'none', transition: 'transform 0.2s' }} />
                </button>
              </div>

              <AnimatePresence>
                {catOpen && (
                  <motion.div
                    initial={{ opacity: 0, y: -4 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, y: -4 }}
                    style={{
                      position: 'absolute', top: '100%', left: 0, right: 0, zIndex: 100,
                      background: 'var(--bg-surface)', border: `1px solid var(--border-soft)`, borderRadius: 12,
                      marginTop: 6, overflow: 'hidden', boxShadow: '0 10px 25px rgba(0,0,0,0.6)',
                      maxHeight: '180px', overflowY: 'auto'
                    }}
                  >
                    {CATEGORIES
                      .filter(c => !form.category || c.toLowerCase().includes(form.category.toLowerCase()))
                      .map(c => (
                        <button
                          key={c} type="button"
                          onMouseDown={() => { set('category', c); setCatOpen(false) }}
                          style={{
                            display: 'block', width: '100%', padding: '12px 14px', border: 'none',
                            background: form.category === c ? 'rgba(15,23,42,0.12)' : 'transparent',
                            color: form.category === c ? '#0F172A' : 'var(--text-primary)',
                            fontSize: 13, fontFamily: 'DM Sans', fontWeight: form.category === c ? 700 : 500, textAlign: 'left', cursor: 'pointer',
                            transition: 'background 0.2s',
                            borderBottom: `1px solid var(--border-soft)`
                          }}
                        >
                          {c}
                        </button>
                      ))}
                    {form.category && !CATEGORIES.find(c => c.toLowerCase() === form.category.toLowerCase()) && (
                      <div style={{ padding: '12px 14px', fontSize: 13, color: TEXT_SEC, fontStyle: 'italic', background: 'rgba(15,23,42,0.03)' }}>
                        Kategori baru: "{form.category}"
                      </div>
                    )}
                  </motion.div>
                )}
              </AnimatePresence>
            </div>
          </Field>

          {/* Unit */}
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10 }}>
            <Field label="Satuan Utama (Retail)">
              <CustomSelect
                id="product-unit"
                value={form.unit}
                onChange={val => set('unit', val)}
                options={UNITS.map(u => ({ value: u, label: u }))}
                placeholder="Pilih"
              />
            </Field>
            <Field label="Satuan Penjualan (Karton/Dus/Bal)">
              <CustomSelect
                id="product-sec-unit"
                value={form.secondary_unit}
                onChange={val => {
                  setForm(f => {
                    const defaultRate = DEFAULT_CONVERSIONS[val] || ''
                    return {
                      ...f,
                      secondary_unit: val,
                      conversion_rate: val ? (f.conversion_rate || defaultRate) : ''
                    }
                  })
                }}
                options={['', ...UNITS].map(u => ({ value: u, label: u || 'Tidak ada' }))}
                placeholder="Pilih Satuan Penjualan"
              />
            </Field>
          </div>

          {/* Conversion Rate */}
          {form.secondary_unit && (
            <Field label={`Konversi: Isi per ${form.secondary_unit} (${form.unit})`}>
              <div style={{ position: 'relative' }}>
                <input
                  type="number"
                  value={form.conversion_rate}
                  onChange={e => set('conversion_rate', e.target.value)}
                  placeholder="Contoh: 20 (1 Karton = 20 Pouch)"
                  style={{ ...inputStyle, paddingLeft: 44 }}
                />
                <span style={{ position: 'absolute', left: 12, top: '50%', transform: 'translateY(-50%)', fontSize: 12, color: C.accent, fontWeight: 800 }}>1x</span>
              </div>

              {/* Quick Conversion Chips */}
              <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap', marginTop: 6 }}>
                {[
                  { label: '20 (Karton / Dus)', val: 20 },
                  { label: '40 (Karton Besar)', val: 40 },
                  { label: '10 (Pack / Bal)', val: 10 },
                  { label: '12 (Lusin)', val: 12 },
                  { label: '50 (Sak / Bal Besar)', val: 50 }
                ].map(chip => (
                  <button
                    key={chip.val}
                    type="button"
                    onClick={() => set('conversion_rate', chip.val)}
                    style={{
                      padding: '3px 8px', borderRadius: 6,
                      background: Number(form.conversion_rate) === chip.val ? '#0c3d0c' : '#F1F5F9',
                      color: Number(form.conversion_rate) === chip.val ? '#FFFFFF' : '#475569',
                      border: `1px solid ${Number(form.conversion_rate) === chip.val ? '#0c3d0c' : '#E2E8F0'}`,
                      fontSize: 10, fontWeight: 700, cursor: 'pointer',
                      transition: 'all 0.15s'
                    }}
                  >
                    {chip.label}
                  </button>
                ))}
              </div>

              <p style={{ fontSize: 10, color: TEXT_SEC, marginTop: 4, fontStyle: 'italic' }}>
                * Saat jual "{form.secondary_unit}", stok terpotong otomatis sebanyak {form.conversion_rate || '...'} "{form.unit}".
              </p>
            </Field>
          )}

          {/* Unit Price Basis Selector & Inputs */}
          <div>
            {hasGrosirUnit && (
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 8, background: 'rgba(12,61,12,0.04)', border: '1px solid rgba(12,61,12,0.12)', borderRadius: 12, padding: '6px 10px' }}>
                <span style={{ fontSize: 11, fontWeight: 800, color: '#0c3d0c', textTransform: 'uppercase', letterSpacing: '0.04em' }}>
                  Pilihan Input Harga
                </span>
                <div style={{ display: 'flex', gap: 4, background: '#E2E8F0', borderRadius: 8, padding: 2 }}>
                  <button
                    type="button"
                    onClick={() => {
                      setPriceInputUnit('primary')
                      setTempGrosirSellPrice('')
                      setTempGrosirBuyPrice('')
                    }}
                    style={{
                      padding: '4px 10px', borderRadius: 6, border: 'none', cursor: 'pointer',
                      fontSize: 11, fontWeight: 800,
                      background: priceInputUnit === 'primary' ? '#FFFFFF' : 'transparent',
                      color: priceInputUnit === 'primary' ? '#0c3d0c' : '#64748B',
                      boxShadow: priceInputUnit === 'primary' ? '0 1px 3px rgba(0,0,0,0.1)' : 'none',
                      transition: 'all 0.15s'
                    }}
                  >
                    Per {form.unit || 'Satuan'} (Utama)
                  </button>
                  <button
                    type="button"
                    onClick={() => {
                      setPriceInputUnit('secondary')
                      if (form.sell_price) setTempGrosirSellPrice(String(Math.round(Number(form.sell_price) * convRate)))
                      if (form.avg_buy_price) setTempGrosirBuyPrice(String(Math.round(Number(form.avg_buy_price) * convRate)))
                    }}
                    style={{
                      padding: '4px 10px', borderRadius: 6, border: 'none', cursor: 'pointer',
                      fontSize: 11, fontWeight: 800,
                      background: priceInputUnit === 'secondary' ? '#0c3d0c' : 'transparent',
                      color: priceInputUnit === 'secondary' ? '#FFFFFF' : '#64748B',
                      boxShadow: priceInputUnit === 'secondary' ? '0 1px 3px rgba(0,0,0,0.1)' : 'none',
                      transition: 'all 0.15s'
                    }}
                  >
                    Per {form.secondary_unit} (Penjualan)
                  </button>
                </div>
              </div>
            )}

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5 w-full min-w-0">
              {/* Harga Jual */}
              <Field label={hasGrosirUnit && priceInputUnit === 'secondary' ? `Harga Jual (per ${form.secondary_unit})` : `Harga Jual (per ${form.unit || 'Satuan'})`}>
                <div style={{ position: 'relative' }}>
                  <span style={{ position: 'absolute', left: 12, top: '50%', transform: 'translateY(-50%)', fontSize: 12, fontWeight: 700, color: '#0F172A' }}>Rp</span>
                  <input
                    id="sell-price" name="sell_price" type="text" inputMode="numeric"
                    value={
                      hasGrosirUnit && priceInputUnit === 'secondary'
                        ? (tempGrosirSellPrice ? fmt(tempGrosirSellPrice) : (form.sell_price ? fmt(Math.round(Number(form.sell_price) * convRate)) : ''))
                        : (form.sell_price ? fmt(form.sell_price) : '')
                    }
                    onChange={e => {
                      const val = e.target.value.replace(/\D/g, '')
                      if (hasGrosirUnit && priceInputUnit === 'secondary') {
                        setTempGrosirSellPrice(val)
                        const baseVal = val ? Math.round(Number(val) / convRate) : ''
                        setForm(prev => ({
                          ...prev,
                          sell_price: baseVal,
                          harga_solo_rp: (!prev.harga_solo_rp || String(prev.harga_solo_rp) === String(prev.sell_price)) ? baseVal : prev.harga_solo_rp
                        }))
                      } else {
                        setForm(prev => ({
                          ...prev,
                          sell_price: val,
                          harga_solo_rp: (!prev.harga_solo_rp || String(prev.harga_solo_rp) === String(prev.sell_price)) ? val : prev.harga_solo_rp
                        }))
                        if (hasGrosirUnit) setTempGrosirSellPrice(val ? Math.round(Number(val) * convRate) : '')
                      }
                    }}
                    placeholder="0"
                    style={{ ...inputStyle, paddingLeft: 36 }}
                  />
                </div>
                <p style={{ fontSize: 10, color: '#0c3d0c', marginTop: 4, fontWeight: 700 }}>
                  {hasGrosirUnit && priceInputUnit === 'secondary'
                    ? `💡 = Rp ${fmt(form.sell_price || 0)} / ${form.unit}`
                    : hasGrosirUnit
                    ? `💡 = Rp ${fmt(Math.round(Number(form.sell_price || 0) * convRate))} / ${form.secondary_unit}`
                    : `💡 Terhubung ke Harga Solo Raya: Rp ${fmt(form.harga_solo_rp || form.sell_price || 0)}`
                  }
                </p>
              </Field>

              {/* Harga Beli / HPP */}
              <Field label={hasGrosirUnit && priceInputUnit === 'secondary' ? `Harga Beli/HPP (per ${form.secondary_unit})` : `Harga Beli/HPP (per ${form.unit || 'Satuan'})`}>
                <div style={{ position: 'relative' }}>
                  <span style={{ position: 'absolute', left: 12, top: '50%', transform: 'translateY(-50%)', fontSize: 12, fontWeight: 700, color: '#94A3B8' }}>Rp</span>
                  <input
                    id="buy-price" name="avg_buy_price" type="text" inputMode="numeric"
                    value={
                      hasGrosirUnit && priceInputUnit === 'secondary'
                        ? (tempGrosirBuyPrice ? fmt(tempGrosirBuyPrice) : (form.avg_buy_price ? fmt(Math.round(Number(form.avg_buy_price) * convRate)) : ''))
                        : (form.avg_buy_price ? fmt(form.avg_buy_price) : '')
                    }
                    onChange={e => {
                      const val = e.target.value.replace(/\D/g, '')
                      if (hasGrosirUnit && priceInputUnit === 'secondary') {
                        setTempGrosirBuyPrice(val)
                        set('avg_buy_price', val ? Math.round(Number(val) / convRate) : '')
                      } else {
                        set('avg_buy_price', val)
                        if (hasGrosirUnit) setTempGrosirBuyPrice(val ? Math.round(Number(val) * convRate) : '')
                      }
                    }}
                    placeholder="0"
                    style={{ ...inputStyle, paddingLeft: 36 }}
                  />
                </div>
                {hasGrosirUnit && (
                  <p style={{ fontSize: 10, color: '#64748B', marginTop: 4, fontWeight: 600 }}>
                    {priceInputUnit === 'secondary'
                      ? `💡 = Rp ${fmt(form.avg_buy_price || 0)} / ${form.unit}`
                      : `💡 = Rp ${fmt(Math.round(Number(form.avg_buy_price || 0) * convRate))} / ${form.secondary_unit}`
                    }
                  </p>
                )}
              </Field>
            </div>

            {/* Live Profit Margin Indicator */}
            {Number(form.sell_price) > 0 && Number(form.avg_buy_price) > 0 && (
              <div style={{
                marginTop: 10, background: 'rgba(12,61,12,0.06)', border: '1px solid rgba(12,61,12,0.15)',
                borderRadius: 12, padding: '8px 12px', display: 'flex', alignItems: 'center', justifyContent: 'space-between'
              }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                  <span style={{ fontSize: 14 }}>📈</span>
                  <div>
                    <div style={{ fontSize: 11, fontWeight: 800, color: '#0c3d0c' }}>
                      Margin Laba: Rp {fmt(Number(form.sell_price) - Number(form.avg_buy_price))} / {form.unit} ({(((Number(form.sell_price) - Number(form.avg_buy_price)) / Number(form.sell_price)) * 100).toFixed(1)}%)
                    </div>
                    {hasGrosirUnit && (
                      <div style={{ fontSize: 10, color: '#166534', fontWeight: 600, marginTop: 1 }}>
                        Laba per {form.secondary_unit}: Rp {fmt((Number(form.sell_price) - Number(form.avg_buy_price)) * convRate)}
                      </div>
                    )}
                  </div>
                </div>
              </div>
            )}
          </div>

          {/* ── Dynamic BOM (Bill of Materials) & HPP Calculator ── */}
          <div style={{
            background: 'var(--bg-subtle)',
            border: '1px solid var(--border-soft)',
            borderRadius: 14,
            padding: '12px 14px',
            width: '100%',
            maxWidth: '100%',
            boxSizing: 'border-box',
            overflow: 'hidden'
          }}>
            <button
              type="button"
              onClick={() => setShowBomCalculator(!showBomCalculator)}
              style={{
                display: 'flex', alignItems: 'center', justifyContent: 'space-between',
                width: '100%', background: 'transparent', border: 'none', cursor: 'pointer', padding: 0
              }}
            >
              <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                <Calculator size={16} color={C.accent} />
                <span style={{ fontFamily: 'Sora', fontSize: 12, fontWeight: 800, color: 'var(--text-primary)' }}>
                  Kalkulator HPP dari Bahan & Kemasan (BOM)
                </span>
              </div>
              <span style={{ fontSize: 11, fontWeight: 700, color: C.accent }}>
                {showBomCalculator ? 'Tutup ▲' : 'Rincikan ▼'}
              </span>
            </button>

            {showBomCalculator && (
              <motion.div
                initial={{ opacity: 0, height: 0 }}
                animate={{ opacity: 1, height: 'auto' }}
                style={{ marginTop: 12, display: 'flex', flexDirection: 'column', gap: 12 }}
              >
                {/* Header status bar */}
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: 6, background: '#F8FAFC', padding: '8px 12px', borderRadius: 10, border: '1px solid #E2E8F0' }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                    <span style={{ fontSize: 13 }}>📦</span>
                    <span style={{ fontSize: 11, fontWeight: 700, color: '#334155' }}>
                      Database Kemasan: <strong>{rawMaterials.length} jenis bahan</strong> terdeteksi
                    </span>
                  </div>
                  <button
                    type="button"
                    onClick={() => autofillBomFromMaster()}
                    style={{
                      padding: '4px 10px',
                      borderRadius: 8,
                      background: '#DCFCE7',
                      border: '1px solid #86EFAC',
                      color: '#15803D',
                      fontSize: 10.5,
                      fontWeight: 800,
                      cursor: 'pointer',
                      display: 'flex',
                      alignItems: 'center',
                      gap: 4
                    }}
                  >
                    ⚡ Auto-Match Semua Bahan
                  </button>
                </div>

                {/* 1. Modal Bawang Curah */}
                <div style={{ background: 'var(--bg-surface)', border: '1px solid var(--border-soft)', borderRadius: 12, padding: '10px 12px', display: 'flex', flexDirection: 'column', gap: 6 }}>
                  <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                    <label style={{ fontSize: 11, fontWeight: 800, color: 'var(--text-primary)', display: 'flex', alignItems: 'center', gap: 6 }}>
                      <span>🧅</span> 1. Modal Bawang Curah / Mentah
                    </label>
                    <span style={{ fontSize: 10.5, fontWeight: 700, color: '#0c3d0c' }}>
                      {form.raw_ingredient_cost ? `Rp ${fmt(form.raw_ingredient_cost)}` : 'Rp 0'}
                    </span>
                  </div>

                  {rawMaterials.length > 0 && (
                    <Select
                      value={bomSelections.bawangId || 'none'}
                      onValueChange={val => {
                        const actualVal = val === 'none' ? '' : val
                        setBomSelections(prev => ({ ...prev, bawangId: actualVal }))
                        if (actualVal) {
                          const mat = rawMaterials.find(r => String(r.id) === actualVal)
                          if (mat) {
                            const unitCost = Number(mat.unit_cost) || 0
                            const isKg = (mat.unit || '').toLowerCase() === 'kg'
                            let gram = 250
                            if (form.product_name.includes('100')) gram = 100
                            else if (form.product_name.includes('150')) gram = 150
                            else if (form.product_name.includes('200')) gram = 200
                            else if (form.product_name.includes('1 kg') || form.product_name.includes('1kg')) gram = 1000
                            else if (form.product_name.includes('2 kg') || form.product_name.includes('2kg')) gram = 2000
                            const cost = isKg ? Math.round(unitCost * gram / 1000) : Math.round(unitCost * gram)
                            updateBomCost('raw_ingredient_cost', String(cost))
                          }
                        }
                      }}
                    >
                      <SelectTrigger className="h-9 w-full bg-card border-border/80 text-xs font-semibold rounded-xl">
                        <SelectValue placeholder="-- Pilih dari Stok Bawang Curah --" />
                      </SelectTrigger>
                      <SelectContent className="z-[9999]">
                        <SelectItem value="none">-- Pilih dari Stok Bawang Curah --</SelectItem>
                        {rawMaterials
                          .filter(r => ['bawang_mentah', 'bawang_curah', 'mentah', 'bawang'].includes((r.category || '').toLowerCase()) || (r.material_name || '').toLowerCase().includes('bawang'))
                          .map(r => (
                            <SelectItem key={r.id} value={String(r.id)}>
                              {r.material_name} (Stok: {r.current_stock || 0} {r.unit}) — Rp {fmt(r.unit_cost)} / {r.unit}
                            </SelectItem>
                          ))}
                      </SelectContent>
                    </Select>
                  )}

                  {/* Grammage quick buttons */}
                  <div style={{ display: 'flex', gap: 4, flexWrap: 'wrap', alignItems: 'center', marginTop: 2 }}>
                    <span style={{ fontSize: 10, color: TEXT_SEC, fontWeight: 700 }}>Hitung Cepat:</span>
                    {[
                      { label: '100g', g: 100 },
                      { label: '150g', g: 150 },
                      { label: '200g', g: 200 },
                      { label: '250g', g: 250 },
                      { label: '500g', g: 500 },
                      { label: '1 Kg', g: 1000 },
                      { label: '2 Kg', g: 2000 }
                    ].map(btn => (
                      <button
                        key={btn.label}
                        type="button"
                        onClick={() => {
                          const bCurah = rawMaterials.find(r => String(r.id) === bomSelections.bawangId) || rawMaterials.find(r => ['bawang_mentah', 'bawang_curah', 'mentah'].includes((r.category || '').toLowerCase()) || (r.material_name || '').toLowerCase().includes('bawang'))
                          const unitCost = bCurah ? Number(bCurah.unit_cost) || 105000 : 105000
                          const cost = Math.round(unitCost * btn.g / 1000)
                          updateBomCost('raw_ingredient_cost', String(cost))
                          if (bCurah) setBomSelections(prev => ({ ...prev, bawangId: String(bCurah.id) }))
                        }}
                        style={{
                          padding: '2px 7px',
                          borderRadius: 6,
                          background: '#F1F5F9',
                          border: '1px solid #CBD5E1',
                          fontSize: 10,
                          fontWeight: 700,
                          color: '#334155',
                          cursor: 'pointer'
                        }}
                      >
                        {btn.label}
                      </button>
                    ))}
                  </div>

                  <div style={{ position: 'relative', marginTop: 4 }}>
                    <span style={{ position: 'absolute', left: 10, top: '50%', transform: 'translateY(-50%)', fontSize: 11, fontWeight: 700, color: '#94A3B8' }}>Rp</span>
                    <input
                      type="text"
                      inputMode="numeric"
                      value={form.raw_ingredient_cost ? fmt(form.raw_ingredient_cost) : ''}
                      onChange={e => updateBomCost('raw_ingredient_cost', e.target.value.replace(/\D/g, ''))}
                      placeholder="0 (Biaya bawang per pcs)"
                      style={{ ...inputStyle, paddingLeft: 30, fontSize: 11 }}
                    />
                  </div>
                </div>

                {/* 2. Pouch / Toples (Kemasan Utama) */}
                <div style={{ background: 'var(--bg-surface)', border: '1px solid var(--border-soft)', borderRadius: 12, padding: '10px 12px', display: 'flex', flexDirection: 'column', gap: 6 }}>
                  <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                    <label style={{ fontSize: 11, fontWeight: 800, color: 'var(--text-primary)', display: 'flex', alignItems: 'center', gap: 6 }}>
                      <span>🛍️</span> 2. Pouch / Toples (Kemasan Utama)
                    </label>
                    <span style={{ fontSize: 10.5, fontWeight: 700, color: '#0c3d0c' }}>
                      {form.pouch_cost ? `Rp ${fmt(form.pouch_cost)}` : 'Rp 0'}
                    </span>
                  </div>

                  {rawMaterials.length > 0 && (
                    <Select
                      value={bomSelections.pouchId || 'none'}
                      onValueChange={val => {
                        const actualVal = val === 'none' ? '' : val
                        setBomSelections(prev => ({ ...prev, pouchId: actualVal }))
                        const mat = rawMaterials.find(r => String(r.id) === actualVal)
                        updateBomCost('pouch_cost', mat ? String(Math.round(Number(mat.unit_cost) || 0)) : '')
                      }}
                    >
                      <SelectTrigger className="h-9 w-full bg-card border-border/80 text-xs font-semibold rounded-xl">
                        <SelectValue placeholder="-- Pilih Kemasan Pouch / Toples --" />
                      </SelectTrigger>
                      <SelectContent className="z-[9999]">
                        <SelectItem value="none">-- Pilih Kemasan Pouch / Toples --</SelectItem>
                        {rawMaterials
                          .filter(r => ['pouch', 'toples', 'kemasan', 'plastik'].includes((r.category || '').toLowerCase()) || (r.material_name || '').toLowerCase().includes('pouch') || (r.material_name || '').toLowerCase().includes('toples'))
                          .map(r => (
                            <SelectItem key={r.id} value={String(r.id)}>
                              {r.material_name} (Stok: {r.current_stock || 0} {r.unit}) — Rp {fmt(r.unit_cost)} / {r.unit}
                            </SelectItem>
                          ))}
                      </SelectContent>
                    </Select>
                  )}

                  <div style={{ position: 'relative' }}>
                    <span style={{ position: 'absolute', left: 10, top: '50%', transform: 'translateY(-50%)', fontSize: 11, fontWeight: 700, color: '#94A3B8' }}>Rp</span>
                    <input
                      type="text"
                      inputMode="numeric"
                      value={form.pouch_cost ? fmt(form.pouch_cost) : ''}
                      onChange={e => updateBomCost('pouch_cost', e.target.value.replace(/\D/g, ''))}
                      placeholder="0 (Harga per pouch/toples)"
                      style={{ ...inputStyle, paddingLeft: 30, fontSize: 11 }}
                    />
                  </div>
                </div>

                {/* 3 & 4. Stiker Depan & Belakang */}
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5 w-full min-w-0">
                  {/* Stiker Depan */}
                  <div style={{ background: 'var(--bg-surface)', border: '1px solid var(--border-soft)', borderRadius: 12, padding: '10px 12px', display: 'flex', flexDirection: 'column', gap: 6, minWidth: 0, width: '100%', boxSizing: 'border-box', overflow: 'hidden' }}>
                    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                      <label style={{ fontSize: 11, fontWeight: 800, color: 'var(--text-primary)', display: 'flex', alignItems: 'center', gap: 4 }}>
                        <span>🏷️</span> Stiker Depan
                      </label>
                      <span style={{ fontSize: 10, fontWeight: 700, color: '#0c3d0c' }}>
                        {form.sticker_front_cost ? `Rp ${fmt(form.sticker_front_cost)}` : 'Rp 0'}
                      </span>
                    </div>

                    {rawMaterials.length > 0 && (
                      <Select
                        value={bomSelections.stickerFrontId || 'none'}
                        onValueChange={val => {
                          const actualVal = val === 'none' ? '' : val
                          setBomSelections(prev => ({ ...prev, stickerFrontId: actualVal }))
                          const mat = rawMaterials.find(r => String(r.id) === actualVal)
                          updateBomCost('sticker_front_cost', mat ? String(Math.round(Number(mat.unit_cost) || 0)) : '')
                        }}
                      >
                        <SelectTrigger className="h-8 w-full min-w-0 max-w-full bg-card border-border/80 text-[11px] font-semibold rounded-lg">
                          <SelectValue placeholder="-- Pilih Stiker Depan --" />
                        </SelectTrigger>
                        <SelectContent className="z-[9999]">
                          <SelectItem value="none">-- Pilih Stiker Depan --</SelectItem>
                          {rawMaterials
                            .filter(r => ['sticker_depan', 'stiker', 'kemasan'].includes((r.category || '').toLowerCase()) || (r.material_name || '').toLowerCase().includes('depan') || (r.material_name || '').toLowerCase().includes('front') || (r.material_name || '').toLowerCase().includes('label'))
                            .map(r => (
                              <SelectItem key={r.id} value={String(r.id)}>
                                {r.material_name} (Rp {fmt(r.unit_cost)})
                              </SelectItem>
                            ))}
                        </SelectContent>
                      </Select>
                    )}

                    <div style={{ position: 'relative' }}>
                      <span style={{ position: 'absolute', left: 10, top: '50%', transform: 'translateY(-50%)', fontSize: 11, fontWeight: 700, color: '#94A3B8' }}>Rp</span>
                      <input
                        type="text"
                        inputMode="numeric"
                        value={form.sticker_front_cost ? fmt(form.sticker_front_cost) : ''}
                        onChange={e => updateBomCost('sticker_front_cost', e.target.value.replace(/\D/g, ''))}
                        placeholder="0"
                        style={{ ...inputStyle, paddingLeft: 30, fontSize: 11 }}
                      />
                    </div>
                  </div>

                  {/* Stiker Belakang */}
                  <div style={{ background: 'var(--bg-surface)', border: '1px solid var(--border-soft)', borderRadius: 12, padding: '10px 12px', display: 'flex', flexDirection: 'column', gap: 6, minWidth: 0, width: '100%', boxSizing: 'border-box', overflow: 'hidden' }}>
                    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                      <label style={{ fontSize: 11, fontWeight: 800, color: 'var(--text-primary)', display: 'flex', alignItems: 'center', gap: 4 }}>
                        <span>🏷️</span> Stiker Belakang
                      </label>
                      <span style={{ fontSize: 10, fontWeight: 700, color: '#0c3d0c' }}>
                        {form.sticker_back_cost ? `Rp ${fmt(form.sticker_back_cost)}` : 'Rp 0'}
                      </span>
                    </div>

                    {rawMaterials.length > 0 && (
                      <Select
                        value={bomSelections.stickerBackId || 'none'}
                        onValueChange={val => {
                          const actualVal = val === 'none' ? '' : val
                          setBomSelections(prev => ({ ...prev, stickerBackId: actualVal }))
                          const mat = rawMaterials.find(r => String(r.id) === actualVal)
                          updateBomCost('sticker_back_cost', mat ? String(Math.round(Number(mat.unit_cost) || 0)) : '')
                        }}
                      >
                        <SelectTrigger className="h-8 w-full min-w-0 max-w-full bg-card border-border/80 text-[11px] font-semibold rounded-lg">
                          <SelectValue placeholder="-- Pilih Stiker Belakang --" />
                        </SelectTrigger>
                        <SelectContent className="z-[9999]">
                          <SelectItem value="none">-- Pilih Stiker Belakang --</SelectItem>
                          {rawMaterials
                            .filter(r => ['sticker_belakang', 'stiker', 'kemasan'].includes((r.category || '').toLowerCase()) || (r.material_name || '').toLowerCase().includes('belakang') || (r.material_name || '').toLowerCase().includes('back'))
                            .map(r => (
                              <SelectItem key={r.id} value={String(r.id)}>
                                {r.material_name} (Rp {fmt(r.unit_cost)})
                              </SelectItem>
                            ))}
                        </SelectContent>
                      </Select>
                    )}

                    <div style={{ position: 'relative' }}>
                      <span style={{ position: 'absolute', left: 10, top: '50%', transform: 'translateY(-50%)', fontSize: 11, fontWeight: 700, color: '#94A3B8' }}>Rp</span>
                      <input
                        type="text"
                        inputMode="numeric"
                        value={form.sticker_back_cost ? fmt(form.sticker_back_cost) : ''}
                        onChange={e => updateBomCost('sticker_back_cost', e.target.value.replace(/\D/g, ''))}
                        placeholder="0"
                        style={{ ...inputStyle, paddingLeft: 30, fontSize: 11 }}
                      />
                    </div>
                  </div>
                </div>

                {/* 5. Kardus / Safety Pack */}
                <div style={{ background: 'var(--bg-surface)', border: '1px solid var(--border-soft)', borderRadius: 12, padding: '10px 12px', display: 'flex', flexDirection: 'column', gap: 6 }}>
                  <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                    <label style={{ fontSize: 11, fontWeight: 800, color: 'var(--text-primary)', display: 'flex', alignItems: 'center', gap: 6 }}>
                      <span>📦</span> 5. Kardus / Polymailer / Safety Packing
                    </label>
                    <span style={{ fontSize: 10.5, fontWeight: 700, color: '#0c3d0c' }}>
                      {form.other_packaging_cost ? `Rp ${fmt(form.other_packaging_cost)}` : 'Rp 0'}
                    </span>
                  </div>

                  {rawMaterials.length > 0 && (
                    <Select
                      value={bomSelections.packagingId || 'none'}
                      onValueChange={val => {
                        const actualVal = val === 'none' ? '' : val
                        setBomSelections(prev => ({ ...prev, packagingId: actualVal }))
                        const mat = rawMaterials.find(r => String(r.id) === actualVal)
                        updateBomCost('other_packaging_cost', mat ? String(Math.round(Number(mat.unit_cost) || 0)) : '')
                      }}
                    >
                      <SelectTrigger className="h-9 w-full bg-card border-border/80 text-xs font-semibold rounded-xl">
                        <SelectValue placeholder="-- Pilih Kardus / Polymailer / Bubblewrap --" />
                      </SelectTrigger>
                      <SelectContent className="z-[9999]">
                        <SelectItem value="none">-- Pilih Kardus / Polymailer / Bubblewrap --</SelectItem>
                        {rawMaterials
                          .filter(r => ['kardus', 'polymailer', 'packing', 'kemasan'].includes((r.category || '').toLowerCase()) || (r.material_name || '').toLowerCase().includes('kardus') || (r.material_name || '').toLowerCase().includes('polymailer'))
                          .map(r => (
                            <SelectItem key={r.id} value={String(r.id)}>
                              {r.material_name} (Stok: {r.current_stock || 0} {r.unit}) — Rp {fmt(r.unit_cost)} / {r.unit}
                            </SelectItem>
                          ))}
                      </SelectContent>
                    </Select>
                  )}

                  <div style={{ position: 'relative' }}>
                    <span style={{ position: 'absolute', left: 10, top: '50%', transform: 'translateY(-50%)', fontSize: 11, fontWeight: 700, color: '#94A3B8' }}>Rp</span>
                    <input
                      type="text"
                      inputMode="numeric"
                      value={form.other_packaging_cost ? fmt(form.other_packaging_cost) : ''}
                      onChange={e => updateBomCost('other_packaging_cost', e.target.value.replace(/\D/g, ''))}
                      placeholder="0"
                      style={{ ...inputStyle, paddingLeft: 30, fontSize: 11 }}
                    />
                  </div>
                </div>

                {/* Total Live Summary & Producible Capacity */}
                <div style={{
                  background: '#F0FDF4',
                  border: '1.5px solid #86EFAC',
                  borderRadius: 12,
                  padding: '12px 14px',
                  display: 'flex',
                  flexDirection: 'column',
                  gap: 8
                }}>
                  <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                    <div>
                      <div style={{ fontSize: 10.5, fontWeight: 800, color: '#166534', textTransform: 'uppercase', letterSpacing: '0.04em' }}>
                        ⚡ Total HPP BOM Kemasan & Bahan
                      </div>
                      <div style={{ fontSize: 10, color: '#15803D', marginTop: 1 }}>
                        Otomatis diterapkan ke field Harga Beli / HPP Produk
                      </div>
                    </div>
                    <div style={{ textAlign: 'right' }}>
                      <div style={{ fontSize: 16, fontWeight: 900, color: '#0c3d0c' }}>
                        Rp {fmt(
                          (Number(form.raw_ingredient_cost) || 0) +
                          (Number(form.pouch_cost) || 0) +
                          (Number(form.sticker_front_cost) || 0) +
                          (Number(form.sticker_back_cost) || 0) +
                          (Number(form.other_packaging_cost) || 0)
                        )}
                      </div>
                      <div style={{ fontSize: 9.5, color: '#166534', fontWeight: 700 }}>
                        per {form.unit || 'pcs'}
                      </div>
                    </div>
                  </div>

                  {/* Live Kapasitas Produksi dari Bahan Baku */}
                  <div style={{
                    paddingTop: 8,
                    borderTop: '1px dashed #86EFAC',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'space-between',
                    flexWrap: 'wrap',
                    gap: 4
                  }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 5 }}>
                      <span style={{ fontSize: 11 }}>📦</span>
                      <span style={{ fontSize: 11, fontWeight: 800, color: '#14532D' }}>
                        Kapasitas Siap Kemas:
                      </span>
                      <span style={{ fontSize: 12, fontWeight: 900, color: '#0c3d0c' }}>
                        {liveBomStock.totalStock} {form.unit || 'pcs'}
                      </span>
                    </div>
                    {liveBomStock.bottleneck ? (
                      <span style={{ fontSize: 10, fontWeight: 700, color: '#991B1B', background: '#FEE2E2', padding: '2px 8px', borderRadius: 6 }}>
                        🔴 Batas: {liveBomStock.bottleneck.name} ({liveBomStock.bottleneck.capacity} pcs)
                      </span>
                    ) : (
                      <span style={{ fontSize: 10, fontWeight: 700, color: '#166534', background: '#DCFCE7', padding: '2px 8px', borderRadius: 6 }}>
                        🟢 Stok Bahan Siap
                      </span>
                    )}
                  </div>
                </div>
              </motion.div>
            )}
          </div>

          {/* ── Multi-Tier Pricing (Solo, Luar Kota, Grosir) ── */}
          <div style={{
            background: 'var(--bg-subtle)',
            border: '1px solid var(--border-soft)',
            borderRadius: 14,
            padding: '12px 14px',
            display: 'flex', flexDirection: 'column', gap: 10
          }}>
            <span style={{ fontFamily: 'Sora', fontSize: 12, fontWeight: 800, color: 'var(--text-primary)' }}>
              Harga Multi-Tier / Wilayah (Opsional)
            </span>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: 8 }}>
              <div>
                <label style={{ fontSize: 10, fontWeight: 800, color: '#0c3d0c', display: 'flex', alignItems: 'center', gap: 4, marginBottom: 4 }}>
                  <span>Solo Raya (Rp)</span>
                  <span style={{ fontSize: 9, background: '#DCFCE7', color: '#166534', padding: '1px 5px', borderRadius: 4 }}>Utama</span>
                </label>
                <input
                  type="text"
                  inputMode="numeric"
                  value={form.harga_solo_rp ? fmt(form.harga_solo_rp) : ''}
                  onChange={e => {
                    const val = e.target.value.replace(/\D/g, '')
                    setForm(prev => ({
                      ...prev,
                      harga_solo_rp: val,
                      sell_price: (!prev.sell_price || String(prev.sell_price) === String(prev.harga_solo_rp)) ? val : prev.sell_price
                    }))
                    if (hasGrosirUnit && priceInputUnit === 'secondary') {
                      setTempGrosirSellPrice(val ? String(Math.round(Number(val) * convRate)) : '')
                    }
                  }}
                  placeholder="0"
                  style={{ ...inputStyle, borderColor: '#86EFAC' }}
                />
              </div>
              <div>
                <label style={{ fontSize: 10, fontWeight: 700, color: TEXT_SEC, display: 'block', marginBottom: 4 }}>
                  Luar Kota (Rp)
                </label>
                <input
                  type="text"
                  inputMode="numeric"
                  value={form.harga_luar_kota_rp ? fmt(form.harga_luar_kota_rp) : ''}
                  onChange={e => set('harga_luar_kota_rp', e.target.value.replace(/\D/g, ''))}
                  placeholder="0"
                  style={inputStyle}
                />
              </div>
              <div>
                <label style={{ fontSize: 10, fontWeight: 700, color: TEXT_SEC, display: 'block', marginBottom: 4 }}>
                  Grosir/Resto (Rp)
                </label>
                <input
                  type="text"
                  inputMode="numeric"
                  value={form.harga_grosir_rp ? fmt(form.harga_grosir_rp) : ''}
                  onChange={e => set('harga_grosir_rp', e.target.value.replace(/\D/g, ''))}
                  placeholder="0"
                  style={inputStyle}
                />
              </div>
            </div>
          </div>

          {/* SKU / Kode Produk */}
          <Field label="Kode SKU Produk (Opsional)">
            <input
              id="product-sku" name="sku" type="text"
              value={form.sku}
              onChange={e => set('sku', e.target.value.toUpperCase())}
              placeholder="contoh: JB-BGO-250G / JB-BMG-100G"
              style={inputStyle}
            />
          </Field>

          {/* Stok alert */}
          <Field label="Alert Stok Minimum">
            <input
              id="min-stock" name="min_stock_alert" type="text" inputMode="numeric"
              value={form.min_stock_alert || ''}
              onChange={e => set('min_stock_alert', e.target.value.replace(/\D/g, ''))}
              placeholder="contoh: 10 (Peringatan saat stok menipis)"
              style={inputStyle}
            />
          </Field>

          {/* Keterangan */}
          <Field label="Keterangan Tambahan">
            <textarea
              id="product-notes" name="notes"
              value={form.notes}
              onChange={e => set('notes', e.target.value)}
              placeholder="Contoh: Kemasan Pouch Standing Zipper 250g, 1 Karton = 20 Pouch"
              rows={2}
              style={{ ...inputStyle, resize: 'none', lineHeight: '1.5' }}
            />
          </Field>

          {/* Toggle aktif */}
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '8px 0' }}>
            <label htmlFor="product-active" style={{ fontFamily: 'DM Sans', fontSize: 14, color: TEXT_SEC, cursor: 'pointer' }}>
              Produk Aktif
            </label>
            <button
              id="product-active" type="button"
              onClick={() => set('is_active', !form.is_active)}
              style={{ background: 'transparent', border: 'none', cursor: 'pointer', color: form.is_active ? C.accent : '#4B5563', display: 'flex' }}
            >
              {form.is_active
                ? <ToggleRight size={32} color={C.accent} />
                : <ToggleLeft size={32} color="#4B5563" />}
            </button>
          </div>

          {/* Submit */}
          <button
            type="submit"
            disabled={isLoading || !form.product_name.trim()}
            style={{
              marginTop: 4,
              width: '100%',
              height: 50,
              background: form.product_name.trim() && !isLoading ? C.accent : 'rgba(15,23,42,0.35)',
              border: 'none', borderRadius: 14,
              color: 'white', fontFamily: 'Sora', fontSize: 15, fontWeight: 700,
              cursor: form.product_name.trim() && !isLoading ? 'pointer' : 'not-allowed',
              boxShadow: form.product_name.trim() ? '0 4px 16px rgba(15,23,42,0.2)' : 'none',
            }}
          >
            {isLoading ? 'Menyimpan...' : isEdit ? 'Simpan Perubahan' : 'Tambah Produk'}
          </button>

          {/* Danger Zone: Hapus Produk */}
          {isEdit && onDelete && (
            <div style={{ marginTop: 6, paddingTop: 14, borderTop: '1px solid var(--border-soft)' }}>
              <button
                type="button"
                onClick={() => {
                  onClose()
                  onDelete(product)
                }}
                className="w-full h-11 rounded-xl border border-rose-200 dark:border-rose-900/40 bg-rose-50/50 dark:bg-rose-950/20 text-rose-600 dark:text-rose-400 font-bold text-xs flex items-center justify-center gap-2 hover:bg-rose-100/60 active:scale-[0.99] transition-all cursor-pointer"
              >
                <Trash2 size={15} />
                <span>Hapus Produk Ini</span>
              </button>
            </div>
          )}
        </form>
      </motion.div>
    </motion.div>
  )
}

// ── UI Helpers ───────────────────────────────────────────────────────────────

function Field({ label, children }) {
  return (
    <div style={{ marginBottom: 12 }}>
      <label style={{ display: 'block', fontSize: 12, fontFamily: 'DM Sans', color: TEXT_SEC, marginBottom: 6 }}>
        {label}
      </label>
      {children}
    </div>
  )
}




const inputStyle = {
  width: '100%',
  background: 'rgba(255,255,255,0.04)',
  border: `1px solid ${C.border}`,
  borderRadius: 10,
  padding: '10px 14px',
  color: C.text,
  fontSize: 14,
  fontFamily: 'DM Sans',
  outline: 'none',
  boxSizing: 'border-box',
  appearance: 'none',
  WebkitAppearance: 'none',
  colorScheme: 'dark',
}


// ── Product card ──────────────────────────────────────────────────────────────

function ProductCard({ product, onEdit, onDelete }) {
  const pct = stockPercent(product)
  const sColor = stockColor(pct)
  const margin = marginInfo(product)
  const warning = stockLabel(product)

  const components = product.bom_components || []
  const bottleneck = product.bom_bottleneck

  return (
    <motion.div
      layout
      initial={{ opacity: 0, scale: 0.95 }}
      animate={{ opacity: 1, scale: 1 }}
      exit={{ opacity: 0, scale: 0.95 }}
      style={{
        background: C.card,
        border: `1px solid ${C.border}`,
        borderRadius: 16,
        padding: '14px 14px 12px',
        cursor: 'pointer',
        position: 'relative',
        opacity: product.is_active ? 1 : 0.5,
      }}
      onClick={() => onEdit(product)}
      whileTap={{ scale: 0.98 }}
    >
      {/* Header: Kategori, Gramasi & SKU */}
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 6, flexWrap: 'wrap' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
          {product.category && (
            <span style={{ fontSize: 10, fontFamily: 'DM Sans', fontWeight: 700, color: C.accent, background: 'rgba(15,23,42,0.08)', padding: '2px 8px', borderRadius: 20, letterSpacing: '0.03em' }}>
              {product.category}
            </span>
          )}
          {formatGrammageLabel(product) && (
            <span style={{ fontSize: 9.5, fontFamily: 'DM Sans', fontWeight: 800, color: '#0F172A', background: '#F1F5F9', border: '1px solid #CBD5E1', padding: '1.5px 6px', borderRadius: 6 }}>
              ⚖️ {formatGrammageLabel(product)}
            </span>
          )}
        </div>
        {product.sku && (
          <span style={{ fontSize: 9.5, fontFamily: 'monospace', fontWeight: 700, color: TEXT_SEC, background: 'rgba(255,255,255,0.06)', padding: '1px 6px', borderRadius: 6 }}>
            {product.sku}
          </span>
        )}
      </div>

      {/* Nama produk */}
      <p style={{ fontFamily: 'Sora', fontWeight: 700, fontSize: 14, color: C.text, margin: '8px 0 4px', lineHeight: 1.3, wordBreak: 'break-word' }}>
        {product.product_name}
      </p>

      {/* Harga jual & Margin */}
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 8, gap: 6 }}>
        <p style={{ fontFamily: 'DM Sans', fontSize: 13, color: C.accent, fontWeight: 700, margin: 0 }}>
          Rp {fmt(product.sell_price)} / {product.unit}
        </p>
        {margin && (
          <span style={{ fontSize: 10.5, fontWeight: 700, color: margin.color, background: `${margin.color}18`, padding: '2px 8px', borderRadius: 20 }}>
            Margin {margin.pct}%
          </span>
        )}
      </div>

      {/* Stock bar (Single Source of Truth from BOM / Batches) */}
      <div style={{ marginTop: 6, padding: '8px 10px', background: 'rgba(255,255,255,0.03)', borderRadius: 10, border: '1px solid var(--border-soft)' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 4 }}>
          <span style={{ fontSize: 10.5, color: '#6B7280', fontFamily: 'DM Sans', fontWeight: 600, display: 'flex', alignItems: 'center', gap: 4 }}>
            <span>⚡</span> Stok Siap Kemas:
          </span>
          <span style={{ fontSize: 12, color: sColor, fontFamily: 'DM Sans', fontWeight: 800 }}>
            {fmtStock(product.current_stock)} {product.unit}
          </span>
        </div>
        {pct !== null && (
          <div style={{ height: 4, background: 'rgba(255,255,255,0.06)', borderRadius: 2, overflow: 'hidden' }}>
            <div style={{ height: '100%', width: `${pct}%`, background: sColor, borderRadius: 2, transition: 'width 0.4s ease' }} />
          </div>
        )}

        {/* Breakdown Komponen BOM */}
        {components.length > 0 && (
          <div style={{ marginTop: 6, paddingTop: 6, borderTop: '1px dashed var(--border-soft)', display: 'flex', flexDirection: 'column', gap: 3 }}>
            <div style={{ display: 'flex', gap: 4, flexWrap: 'wrap', alignItems: 'center' }}>
              {components.map(c => {
                const isBottleneck = bottleneck && c.type === bottleneck.type
                const icon = c.type === 'bawang' ? '🧅' : c.type === 'kemasan' ? '🛍️' : '🏷️'
                return (
                  <span
                    key={c.type}
                    title={`${c.name}: Stok ${c.available} ${c.unit} (Cukup untuk ${c.capacity} pcs)`}
                    style={{
                      fontSize: 9.5,
                      fontWeight: isBottleneck ? 800 : 600,
                      padding: '1px 5px',
                      borderRadius: 6,
                      background: isBottleneck ? '#FEE2E2' : 'rgba(255,255,255,0.06)',
                      color: isBottleneck ? '#991B1B' : '#475569',
                      border: isBottleneck ? '1px solid #FCA5A5' : '1px solid transparent'
                    }}
                  >
                    {icon} {c.capacity}
                  </span>
                )
              })}
            </div>
            {bottleneck && (
              <div style={{ fontSize: 9.5, color: '#DC2626', fontWeight: 700, marginTop: 2, display: 'flex', alignItems: 'center', gap: 3 }}>
                <span>🔴 Batas:</span>
                <span style={{ overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', maxWidth: 190 }}>
                  {bottleneck.name} ({bottleneck.capacity} pcs)
                </span>
              </div>
            )}
          </div>
        )}
      </div>

      {/* Warning Alert */}
      {warning && (
        <p style={{ fontSize: 10.5, color: '#F87171', marginTop: 6, fontFamily: 'DM Sans', fontWeight: 600 }}>
          ⚠ {warning}
        </p>
      )}
    </motion.div>
  )
}

// ── Stats bar ─────────────────────────────────────────────────────────────────

function StatCard({ label, value, sub, color }) {
  return (
    <div style={{ background: C.card, border: `1px solid ${C.border}`, borderRadius: 12, padding: '12px 14px' }}>
      <p style={{ fontSize: 11, color: TEXT_SEC, fontFamily: 'DM Sans', margin: '0 0 4px' }}>{label}</p>
      <p style={{ fontSize: 18, fontWeight: 800, fontFamily: 'Sora', color: color || C.text, margin: 0 }}>{value}</p>
      {sub && <p style={{ fontSize: 11, color: '#6B7280', fontFamily: 'DM Sans', marginTop: 2 }}>{sub}</p>}
    </div>
  )
}

// ── Main Component ────────────────────────────────────────────────────────────

export default function Produk() {
  const isDesktop = useMediaQuery('(min-width: 1024px)')
  const { setSidebarOpen = () => window.dispatchEvent(new Event('toggleMobileSidebar')) } = useOutletContext() || {}
  const location = useLocation()
  const navigate = useNavigate()
  const { data: products = [], isLoading, isError, error, refetch } = useSembakoProducts()
  const deleteMut = useSoftDeleteSembakoProduct()

  // Raw Materials & Sales Hooks
  const { data: rawMaterials = [], isLoading: isLoadingRaw, refetch: refetchRaw } = useSembakoRawMaterials()
  const { data: sales = [] } = useSembakoSales()
  const deleteRawMut = useDeleteSembakoRawMaterial()

  const [activeSubTab, setActiveSubTab] = useState('produk') // 'produk' | 'bahan_baku' | 'kemasan'
  const [search, setSearch] = useState('')
  const [catFilter, setCatFilter] = useState('Semua')
  const [sheet, setSheet] = useState(() => {
    const params = new URLSearchParams(window.location.search)
    const act = params.get('action')
    return (act === 'new' || act === 'tambah') ? 'new' : null
  })
  const [showInactive, setShowInactive] = useState(false)
  const [productToDelete, setProductToDelete] = useState(null)
  const [importCsvOpen, setImportCsvOpen] = useState(false)

  // Raw Materials Sheet, Restock Modal, Adjust Modal & Purchase History State
  const [rawSheetOpen, setRawSheetOpen] = useState(false)
  const [editingRawMaterial, setEditingRawMaterial] = useState(null)
  const [rawToDelete, setRawToDelete] = useState(null)
  const [rawTypeFilter, setRawTypeFilter] = useState('all')
  const [restockMaterial, setRestockMaterial] = useState(null)
  const [restockModalOpen, setRestockModalOpen] = useState(false)
  const [adjustMaterial, setAdjustMaterial] = useState(null)
  const [adjustModalOpen, setAdjustModalOpen] = useState(false)
  const [historyMaterial, setHistoryMaterial] = useState(null)
  const [historyModalOpen, setHistoryModalOpen] = useState(false)

  // Helper: Get internal customization usage notes & counts for raw material / packaging
  const getMaterialCustomUsage = (mat) => {
    if (!mat) return { count: 0, totalQty: 0, latestNote: null }
    const matName = (mat.material_name || '').toLowerCase().trim()
    let count = 0
    let totalQty = 0
    let latestNote = null

    sales.forEach((sale) => {
      (sale.sembako_sale_items || []).forEach((it) => {
        const isMatchId = it.custom_packaging_id && it.custom_packaging_id === mat.id
        const isMatchName = it.custom_packaging_name && it.custom_packaging_name.toLowerCase().trim() === matName
        const isMatchNotes = it.notes && it.notes.toLowerCase().includes(matName)
        if (it.use_custom_packaging && (isMatchId || isMatchName || isMatchNotes)) {
          count += 1
          totalQty += (Number(it.quantity) || 0)
          if (!latestNote && it.custom_packaging_note) {
            latestNote = it.custom_packaging_note
          }
        }
      })
    })

    return { count, totalQty, latestNote }
  }

  useEffect(() => {
    const params = new URLSearchParams(location.search)
    const action = params.get('action')
    const tab = params.get('tab')
    if (tab === 'bahan' || tab === 'bahan_baku') {
      setActiveSubTab('bahan_baku')
    } else if (tab === 'kemasan') {
      setActiveSubTab('kemasan')
    }
    if (action === 'new' || action === 'tambah') {
      setSheet('new')
    }
  }, [location.search])

  const [productSortBy, setProductSortBy] = useState('gram_asc') // 'gram_asc' | 'gram_desc' | 'price_asc' | 'price_desc' | 'name_asc'

  const categories = useMemo(() => {
    const cats = [...new Set(products.map(p => p.category).filter(Boolean))]
    cats.sort((a, b) => {
      const pA = CATEGORY_PRIORITY[a] || 99
      const pB = CATEGORY_PRIORITY[b] || 99
      if (pA !== pB) return pA - pB
      return a.localeCompare(b)
    })
    return ['Semua', ...cats]
  }, [products])

  const sortProductList = (list) => {
    return [...list].sort((a, b) => {
      if (productSortBy === 'gram_asc') {
        const gA = parseProductGrammage(a)
        const gB = parseProductGrammage(b)
        if (gA !== gB) return gA - gB
        return (Number(a.sell_price) || 0) - (Number(b.sell_price) || 0)
      }
      if (productSortBy === 'gram_desc') {
        const gA = parseProductGrammage(a)
        const gB = parseProductGrammage(b)
        if (gA !== gB) return gB - gA
        return (Number(b.sell_price) || 0) - (Number(a.sell_price) || 0)
      }
      if (productSortBy === 'price_asc') {
        return (Number(a.sell_price) || 0) - (Number(b.sell_price) || 0)
      }
      if (productSortBy === 'price_desc') {
        return (Number(b.sell_price) || 0) - (Number(a.sell_price) || 0)
      }
      if (productSortBy === 'name_asc') {
        return (a.product_name || '').localeCompare(b.product_name || '')
      }
      return 0
    })
  }

  // Partition Bahan Baku vs Kemasan
  const isBahanBakuItem = (r) => {
    const cat = (r.category || r.material_type || '').toLowerCase()
    const name = (r.material_name || '').toLowerCase()
    return ['bawang_mentah', 'bawang_curah', 'bawang_putih', 'minyak_goreng', 'tepung_bumbu', 'bahan_baku', 'bahan_lain', 'mentah'].includes(cat) ||
      name.includes('bawang') || name.includes('brambang') || name.includes('minyak') || name.includes('tepung') || name.includes('garam') ||
      r.unit === 'kg' || r.unit === 'karung' || r.unit === 'liter'
  }

  const bahanBakuList = useMemo(() => {
    return rawMaterials.filter(r => isBahanBakuItem(r))
  }, [rawMaterials])

  const kemasanList = useMemo(() => {
    return rawMaterials.filter(r => !isBahanBakuItem(r))
  }, [rawMaterials])

  const currentRawList = activeSubTab === 'bahan_baku' ? bahanBakuList : kemasanList

  const filtered = useMemo(() => {
    const rawFiltered = products.filter(p => {
      if (!showInactive && !p.is_active) return false
      if (catFilter !== 'Semua' && p.category !== catFilter) return false
      if (search) {
        const q = search.toLowerCase()
        const matchName = p.product_name.toLowerCase().includes(q)
        const matchSku = p.sku && p.sku.toLowerCase().includes(q)
        if (!matchName && !matchSku) return false
      }
      return true
    })
    return sortProductList(rawFiltered)
  }, [products, search, catFilter, showInactive, productSortBy])

  // Grouped products for "Semua" categorized view
  const groupedProducts = useMemo(() => {
    if (catFilter !== 'Semua' || search) return null

    const groups = {}
    filtered.forEach(p => {
      const cat = p.category || 'Lain-lain'
      if (!groups[cat]) groups[cat] = []
      groups[cat].push(p)
    })

    const sortedCatKeys = Object.keys(groups).sort((a, b) => {
      const pA = CATEGORY_PRIORITY[a] || 99
      const pB = CATEGORY_PRIORITY[b] || 99
      if (pA !== pB) return pA - pB
      return a.localeCompare(b)
    })

    return sortedCatKeys.map(cat => ({
      category: cat,
      items: sortProductList(groups[cat]),
      meta: CATEGORY_META[cat] || {
        icon: '📦',
        desc: '',
        badge: 'bg-muted text-muted-foreground border-border'
      }
    }))
  }, [filtered, catFilter, search, productSortBy])

  const filteredRaw = useMemo(() => {
    return currentRawList.filter(r => {
      if (rawTypeFilter !== 'all') {
        const cat = (r.category || r.material_type || '').toLowerCase()
        if (cat !== rawTypeFilter) return false
      }
      if (search) {
        const q = search.toLowerCase()
        const matchName = r.material_name?.toLowerCase().includes(q)
        const matchNotes = r.notes?.toLowerCase().includes(q)
        const matchSupplier = r.supplier_name?.toLowerCase().includes(q)
        if (!matchName && !matchNotes && !matchSupplier) return false
      }
      return true
    })
  }, [currentRawList, rawTypeFilter, search])

  const stats = useMemo(() => {
    const active = products.filter(p => p.is_active && !p.is_deleted)
    const lowStock = active.filter(p => p.min_stock_alert > 0 && p.current_stock <= p.min_stock_alert)
    const nilaiStok = active.reduce((s, p) => s + (p.fifo_asset_value !== undefined && p.fifo_asset_value > 0 ? p.fifo_asset_value : (p.current_stock * (p.avg_buy_price || 0))), 0)
    return { total: active.length, lowStock: lowStock.length, nilaiStok }
  }, [products])

  const bahanStats = useMemo(() => {
    const totalJenis = bahanBakuList.length
    const lowStock = bahanBakuList.filter(r => r.min_stock_alert > 0 && r.current_stock <= r.min_stock_alert).length
    const totalInvestasi = bahanBakuList.reduce((s, r) => s + (r.fifo_asset_value !== undefined && r.fifo_asset_value > 0 ? r.fifo_asset_value : (Number(r.total_spent) || (Number(r.current_stock) * Number(r.unit_cost || 0)))), 0)
    return { totalJenis, lowStock, totalInvestasi }
  }, [bahanBakuList])

  const kemasanStats = useMemo(() => {
    const totalJenis = kemasanList.length
    const lowStock = kemasanList.filter(r => r.min_stock_alert > 0 && r.current_stock <= r.min_stock_alert).length
    const totalInvestasi = kemasanList.reduce((s, r) => s + (r.fifo_asset_value !== undefined && r.fifo_asset_value > 0 ? r.fifo_asset_value : (Number(r.total_spent) || (Number(r.current_stock) * Number(r.unit_cost || 0)))), 0)
    return { totalJenis, lowStock, totalInvestasi }
  }, [kemasanList])

  const handleDelete = (product) => {
    setProductToDelete(product)
  }

  const confirmDeleteProduct = () => {
    if (!productToDelete) return
    deleteMut.mutate(productToDelete.id)
    setProductToDelete(null)
  }

  const handleDeleteRaw = (item) => {
    setRawToDelete(item)
  }

  const confirmDeleteRaw = () => {
    if (!rawToDelete) return
    deleteRawMut.mutate(rawToDelete.id)
    setRawToDelete(null)
  }

  if (isLoading) return (
    <div style={{ minHeight: '100vh', background: C.bg, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
      <p style={{ color: TEXT_SEC, fontFamily: 'DM Sans' }}>Memuat produk...</p>
    </div>
  )

  if (isError) return (
    <div style={{ minHeight: '100vh', background: C.bg, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
      <SembakoErrorState error={error} onRetry={refetch} />
    </div>
  )

  const summaryItems = activeSubTab === 'produk' ? [
    { label: 'Total Produk Aktif', value: stats.total, color: 'amber' },
    { label: 'Stok Menipis', value: stats.lowStock > 0 ? `${stats.lowStock} produk` : 'Stok Aman', color: stats.lowStock > 0 ? 'red' : 'green', subLabel: stats.lowStock > 0 ? 'perlu restock' : 'semua aman' },
    { label: 'Total Nilai Stok Produk', value: stats.nilaiStok, isCurrency: true, color: 'amber' },
  ] : activeSubTab === 'bahan_baku' ? [
    { label: 'Total Bahan Baku Mentah', value: bahanStats.totalJenis, color: 'emerald', subLabel: 'Bawang Merah, Minyak, Tepung' },
    { label: 'Bahan Mentah Menipis', value: bahanStats.lowStock > 0 ? `${bahanStats.lowStock} item` : 'Aman', color: bahanStats.lowStock > 0 ? 'red' : 'green', subLabel: bahanStats.lowStock > 0 ? 'perlu order ke Petani/Pengepul' : 'stok bahan cukup' },
    { label: 'Total Nilai Stok Bahan Mentah', value: bahanStats.totalInvestasi, isCurrency: true, color: 'emerald' },
  ] : [
    { label: 'Total Jenis Kemasan & Pack', value: kemasanStats.totalJenis, color: 'amber', subLabel: 'Pouch, Stiker, Kardus, Polymailer' },
    { label: 'Kemasan Menipis', value: kemasanStats.lowStock > 0 ? `${kemasanStats.lowStock} item` : 'Aman', color: kemasanStats.lowStock > 0 ? 'red' : 'green', subLabel: kemasanStats.lowStock > 0 ? 'perlu order ke Percetakan/Pabrik' : 'stok kemasan cukup' },
    { label: 'Total Nilai Stok Kemasan', value: kemasanStats.totalInvestasi, isCurrency: true, color: 'amber' },
  ]

  const categoryFilters = categories.map(c => ({ id: c, label: c }))

  return (
    <div className="min-h-screen bg-background text-foreground pb-[max(140px,calc(110px+env(safe-area-inset-bottom,24px)))] text-left">
      {!isDesktop && <BrokerMobileHeader title={activeSubTab === 'produk' ? 'Produk' : activeSubTab === 'bahan_baku' ? 'Bahan Baku' : 'Kemasan'} onMenuClick={() => setSidebarOpen(true)} />}

      <div className="mx-auto max-w-7xl">
        <SembakoPageHeader
          title={
            activeSubTab === 'produk'
              ? 'Manajemen Produk & SKU'
              : activeSubTab === 'bahan_baku'
              ? 'Bahan Baku Mentah (Suplai Petani)'
              : 'Kemasan & Packaging (Suplai Vendor)'
          }
          subtitle={
            activeSubTab === 'produk'
              ? `Katalog & Harga Multi-Tier · ${stats.total} produk aktif`
              : activeSubTab === 'bahan_baku'
              ? `Bawang Merah Boyolali, Minyak & Bumbu · ${bahanBakuList.length} jenis komoditas mentah`
              : `Pouch Ziplock, Stiker Label, Kardus & Polymailer · ${kemasanList.length} jenis packaging`
          }
          isDesktop={isDesktop}
          searchQuery={search}
          onSearchChange={setSearch}
          searchPlaceholder={
            activeSubTab === 'produk'
              ? 'Cari nama produk / SKU...'
              : activeSubTab === 'bahan_baku'
              ? 'Cari bawang mentah, minyak, supplier petani...'
              : 'Cari pouch, stiker, kardus, supplier percetakan...'
          }
          filters={activeSubTab === 'produk' ? categoryFilters : []}
          activeFilter={catFilter}
          onFilterChange={setCatFilter}
          actionButton={
            <div className="flex items-center gap-2">
              {activeSubTab === 'produk' ? (
                <>
                  <button
                    onClick={() => setImportCsvOpen(true)}
                    className="flex items-center gap-1.5 px-3 h-10 rounded-xl font-bold text-xs bg-muted hover:bg-muted/80 text-foreground border border-border transition-all cursor-pointer shrink-0"
                  >
                    <FileSpreadsheet size={15} className="text-[#0F172A]" />
                    <span>Import CSV</span>
                  </button>
                  <button
                    onClick={() => setSheet('new')}
                    className="flex items-center gap-2 px-4 h-10 rounded-xl font-bold text-xs bg-[#0F172A] hover:bg-slate-900 text-white transition-all cursor-pointer shadow-lg shadow-slate-950/10 active:scale-95 shrink-0"
                  >
                    <Plus size={16} />
                    <span>Tambah Produk</span>
                  </button>
                </>
              ) : activeSubTab === 'bahan_baku' ? (
                <button
                  onClick={() => {
                    setEditingRawMaterial(null)
                    setRawSheetOpen(true)
                  }}
                  className="flex items-center gap-2 px-4 h-10 rounded-xl font-bold text-xs bg-emerald-600 hover:bg-emerald-500 text-white transition-all cursor-pointer shadow-lg shadow-emerald-600/20 active:scale-95 shrink-0"
                >
                  <Plus size={16} />
                  <span>+ Tambah Bahan Baku Mentah</span>
                </button>
              ) : (
                <button
                  onClick={() => {
                    setEditingRawMaterial(null)
                    setRawSheetOpen(true)
                  }}
                  className="flex items-center gap-2 px-4 h-10 rounded-xl font-bold text-xs bg-amber-500 hover:bg-amber-400 text-slate-950 transition-all cursor-pointer shadow-lg shadow-amber-500/20 active:scale-95 shrink-0"
                >
                  <Plus size={16} />
                  <span>+ Tambah Kemasan & Packaging</span>
                </button>
              )}
            </div>
          }
        />

        {/* ── SubTab Selector (Produk Jadi vs Bahan Baku vs Kemasan) ── */}
        <div className="px-4 sm:px-6 pt-2">
          <div className="flex flex-wrap items-center gap-2 p-1.5 bg-muted/60 border border-border/80 rounded-2xl w-fit">
            <button
              onClick={() => {
                setActiveSubTab('produk')
                setRawTypeFilter('all')
              }}
              className={`flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-bold transition-all cursor-pointer ${
                activeSubTab === 'produk'
                  ? 'bg-background text-foreground shadow-sm font-black'
                  : 'text-muted-foreground hover:text-foreground'
              }`}
            >
              <Package size={15} />
              <span>1. Produk Jadi / SKU ({products.length})</span>
            </button>
            <button
              onClick={() => {
                setActiveSubTab('bahan_baku')
                setRawTypeFilter('all')
              }}
              className={`flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-bold transition-all cursor-pointer ${
                activeSubTab === 'bahan_baku'
                  ? 'bg-emerald-600 text-white shadow-sm font-black'
                  : 'text-muted-foreground hover:text-foreground'
              }`}
            >
              <span>🧅</span>
              <span>2. Bahan Baku Mentah ({bahanBakuList.length})</span>
            </button>
            <button
              onClick={() => {
                setActiveSubTab('kemasan')
                setRawTypeFilter('all')
              }}
              className={`flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-bold transition-all cursor-pointer ${
                activeSubTab === 'kemasan'
                  ? 'bg-amber-500 text-slate-950 shadow-sm font-black'
                  : 'text-muted-foreground hover:text-foreground'
              }`}
            >
              <Boxes size={15} />
              <span>3. Kemasan & Packaging ({kemasanList.length})</span>
            </button>
          </div>
        </div>

        <SembakoSummaryStrip items={summaryItems} />

        {/* ── TAB PRODUK JADI ── */}
        {activeSubTab === 'produk' && (
          <>
            {/* Toolbar: Toggle non-aktif & Sort Selector */}
            <div className="px-4 sm:px-6 pt-3 pb-2 flex flex-wrap items-center justify-between gap-3">
              <button
                onClick={() => setShowInactive(v => !v)}
                className="border-0 bg-transparent cursor-pointer text-muted-foreground hover:text-foreground flex items-center gap-2 text-xs font-medium transition-colors"
              >
                {showInactive ? <ToggleRight size={22} className="text-[#0F172A]" /> : <ToggleLeft size={22} className="text-muted-foreground" />}
                <span>Tampilkan produk non-aktif</span>
              </button>

              <div className="flex items-center gap-2 ml-auto">
                <SlidersHorizontal size={13} className="text-muted-foreground" />
                <span className="text-[11px] font-bold text-muted-foreground">Urutkan:</span>
                <Select value={productSortBy} onValueChange={setProductSortBy}>
                  <SelectTrigger className="h-8 bg-card border border-border/80 rounded-xl px-2.5 text-xs font-bold text-foreground focus:ring-1 focus:ring-slate-500 shadow-sm">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent className="z-[9999]">
                    <SelectItem value="gram_asc">⚖️ Gramasi: 100g → 2kg (Terkecil)</SelectItem>
                    <SelectItem value="gram_desc">⚖️ Gramasi: 2kg → 100g (Terbesar)</SelectItem>
                    <SelectItem value="price_asc">💰 Harga Terendah</SelectItem>
                    <SelectItem value="price_desc">💰 Harga Tertinggi</SelectItem>
                    <SelectItem value="name_asc">🔤 Nama Produk (A-Z)</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>

            {/* Product list */}
            <div className="px-4 sm:px-6">
              {filtered.length === 0 ? (
                <SembakoEmptyState
                  icon={Package}
                  title="Belum ada produk"
                  description={
                    search || catFilter !== 'Semua'
                      ? 'Tidak ada produk yang cocok dengan pencarian atau filter yang dipilih.'
                      : 'Mulai dengan menambahkan produk sembako pertama Anda atau impor dari template master Bawang Goreng.'
                  }
                  actionLabel="Tambah Produk"
                  onAction={() => setSheet('new')}
                />
              ) : groupedProducts ? (
                <div className="space-y-8 pb-6">
                  {groupedProducts.map(({ category, items, meta }) => (
                    <div key={category} className="space-y-3.5">
                      {/* Category Section Header */}
                      <div className="flex flex-wrap items-center justify-between gap-2 pt-2 pb-2.5 border-b border-border/70">
                        <div className="flex items-center gap-2.5">
                          <span className="text-lg leading-none">{meta.icon || '📦'}</span>
                          <h3 className="font-sans font-extrabold text-sm sm:text-base text-foreground tracking-tight m-0">
                            {category}
                          </h3>
                          <span className={`text-[10.5px] font-extrabold px-2.5 py-0.5 rounded-full border ${meta.badge}`}>
                            {items.length} SKU
                          </span>
                        </div>
                        {meta.desc && (
                          <span className="text-xs text-muted-foreground font-medium hidden sm:inline-block">
                            {meta.desc}
                          </span>
                        )}
                      </div>

                      {/* Grid for this Category */}
                      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3.5">
                        {items.map(product => (
                          <ProductCard
                            key={product.id}
                            product={product}
                            onEdit={(p) => setSheet(p)}
                            onDelete={handleDelete}
                          />
                        ))}
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3.5 pb-6">
                  {filtered.map(product => (
                    <ProductCard
                      key={product.id}
                      product={product}
                      onEdit={(p) => setSheet(p)}
                      onDelete={handleDelete}
                    />
                  ))}
                </div>
              )}
            </div>
          </>
        )}

        {/* ── TAB BAHAN BAKU MENTAH (SUPLAI PETANI) ── */}
        {activeSubTab === 'bahan_baku' && (
          <div className="px-4 sm:px-6 pt-2 space-y-4">
            {/* Filter Jenis Bahan Baku Mentah */}
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 overflow-x-auto pb-1">
              <div className="flex items-center gap-2 overflow-x-auto">
                {[
                  { id: 'all', label: 'Semua Bahan Mentah' },
                  { id: 'bawang_mentah', label: '🧅 Bawang Merah Mentah' },
                  { id: 'bawang_putih', label: '🧄 Bawang Putih' },
                  { id: 'minyak_goreng', label: '🛢️ Minyak Goreng' },
                  { id: 'tepung_bumbu', label: '🌾 Tepung & Bumbu' },
                  { id: 'bahan_lain', label: '📦 Lainnya' },
                ].map(f => (
                  <button
                    key={f.id}
                    onClick={() => setRawTypeFilter(f.id)}
                    className={`px-3 py-1.5 rounded-xl text-xs font-bold whitespace-nowrap transition-all cursor-pointer ${
                      rawTypeFilter === f.id
                        ? 'bg-emerald-600 text-white'
                        : 'bg-muted text-muted-foreground hover:text-foreground'
                    }`}
                  >
                    {f.label}
                  </button>
                ))}
              </div>

              <button
                onClick={() => {
                  setHistoryMaterial(null)
                  setHistoryModalOpen(true)
                }}
                className="shrink-0 px-3.5 py-1.5 rounded-xl text-xs font-bold whitespace-nowrap bg-emerald-500/10 hover:bg-emerald-500/20 text-emerald-700 dark:text-emerald-400 border border-emerald-500/20 flex items-center gap-1.5 transition-all cursor-pointer shadow-sm"
                title="Rekap Riwayat Pembelian Bahan Baku Mentah"
              >
                <History size={14} />
                <span>Rekap Belanja Petani</span>
              </button>
            </div>

            {/* Grid Bahan Baku */}
            {isLoadingRaw ? (
              <div className="p-12 text-center text-xs text-muted-foreground">Memuat data bahan baku mentah...</div>
            ) : filteredRaw.length === 0 ? (
              <div className="p-12 text-center bg-card border border-border/80 rounded-3xl space-y-3">
                <div className="w-12 h-12 rounded-2xl bg-emerald-100 dark:bg-emerald-950/40 text-emerald-700 dark:text-emerald-400 flex items-center justify-center mx-auto text-2xl">
                  🧅
                </div>
                <div>
                  <p className="font-bold text-sm text-foreground">Belum ada Bahan Baku Mentah</p>
                  <p className="text-xs text-muted-foreground mt-0.5">
                    Catat stok komoditas mentah seperti Bawang Merah Boyolali, Bawang Putih, Minyak Goreng, dan Tepung dari Petani/Pengepul.
                  </p>
                </div>
                <button
                  onClick={() => {
                    setEditingRawMaterial(null)
                    setRawSheetOpen(true)
                  }}
                  className="inline-flex items-center gap-2 px-4 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-bold cursor-pointer transition"
                >
                  <Plus size={15} /> Tambah Bahan Baku Mentah Sekarang
                </button>
              </div>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3.5">
                {filteredRaw.map(raw => {
                  const isLow = raw.min_stock_alert > 0 && raw.current_stock <= raw.min_stock_alert
                  return (
                    <motion.div
                      key={raw.id}
                      layout
                      className="bg-card border border-border/80 hover:border-emerald-500/50 rounded-2xl p-4 flex flex-col justify-between transition-all"
                    >
                      <div>
                        <div className="flex items-center justify-between gap-2 mb-2">
                          <span className="px-2 py-0.5 rounded-md text-[10px] font-bold uppercase bg-emerald-500/10 text-emerald-700 dark:text-emerald-400 border border-emerald-500/20">
                            {raw.category?.replace('_', ' ') || raw.material_type?.replace('_', ' ') || 'BAHAN MENTAH'}
                          </span>
                          {isLow && (
                            <span className="px-2 py-0.5 rounded-md text-[10px] font-bold bg-rose-500/10 text-rose-600 border border-rose-500/20">
                              Stok Menipis
                            </span>
                          )}
                        </div>

                        <h3 className="font-bold text-sm text-foreground">{raw.material_name}</h3>
                        {raw.notes && <p className="text-[11px] text-muted-foreground line-clamp-1 mt-0.5">{raw.notes}</p>}

                        <div className="mt-3 p-2.5 rounded-xl bg-muted/40 border border-border/50 space-y-1.5 text-xs">
                          <div className="flex justify-between">
                            <span className="text-muted-foreground">Stok Tersedia:</span>
                            <span className="font-bold text-foreground">{fmtStock(raw.current_stock)} {raw.unit}</span>
                          </div>
                          <div className="flex justify-between">
                            <span className="text-muted-foreground">HPP Beli per {raw.unit}:</span>
                            <span className="font-extrabold text-emerald-600 dark:text-emerald-400">
                              Rp {fmt(raw.unit_cost)} / {raw.unit}
                            </span>
                          </div>
                          {Number(raw.total_spent) > 0 && (
                            <div className="flex justify-between text-[11px] pt-1 border-t border-border/40">
                              <span className="text-muted-foreground">Total Nota Petani:</span>
                              <span className="font-semibold text-foreground">Rp {fmt(raw.total_spent)}</span>
                            </div>
                          )}
                        </div>

                        {(() => {
                          const customUsage = getMaterialCustomUsage(raw)
                          if (customUsage.count === 0) return null
                          return (
                            <div className="mt-2 p-2 rounded-xl bg-amber-500/10 border border-amber-500/20 text-xs space-y-1">
                              <div className="flex items-center justify-between text-amber-900 dark:text-amber-300 font-bold">
                                <span className="flex items-center gap-1">
                                  <span>✨</span> Terpakai Kustom:
                                </span>
                                <span className="font-mono">{customUsage.totalQty} {raw.unit}</span>
                              </div>
                              {customUsage.latestNote && (
                                <p className="text-[10.5px] text-amber-800/80 dark:text-amber-300/80 italic line-clamp-1">
                                  "{customUsage.latestNote}"
                                </p>
                              )}
                            </div>
                          )
                        })()}
                      </div>

                      <div className="mt-3 pt-2.5 border-t border-border/60 space-y-2">
                        <div className="flex items-center justify-between text-[11px] text-muted-foreground">
                          <span>{raw.supplier_name ? `Petani/Suplier: ${raw.supplier_name}` : 'Petani / Pengepul Mandiri'}</span>
                          <div className="flex items-center gap-1">
                            <button
                              onClick={() => {
                                setHistoryMaterial(raw)
                                setHistoryModalOpen(true)
                              }}
                              className="p-1.5 rounded-lg bg-emerald-500/10 hover:bg-emerald-500/20 text-emerald-700 dark:text-emerald-400 border border-emerald-500/20 transition-colors cursor-pointer"
                              title="Riwayat Pembelian Bahan Baku Ini"
                            >
                              <History size={12} />
                            </button>
                            <button
                              onClick={() => {
                                setEditingRawMaterial(raw)
                                setRawSheetOpen(true)
                              }}
                              className="p-1.5 rounded-lg bg-muted hover:bg-muted/80 text-foreground transition-colors cursor-pointer"
                              title="Edit Detail Bahan Mentah"
                            >
                              <Edit3 size={12} />
                            </button>
                            <button
                              onClick={() => handleDeleteRaw(raw)}
                              className="p-1.5 rounded-lg bg-rose-500/10 hover:bg-rose-500/20 text-rose-600 transition-colors cursor-pointer"
                              title="Hapus Bahan Mentah"
                            >
                              <Trash2 size={12} />
                            </button>
                          </div>
                        </div>

                        <div className="flex items-center gap-1.5">
                          <button
                            onClick={() => {
                              setRestockMaterial(raw)
                              setRestockModalOpen(true)
                            }}
                            className="flex-1 flex items-center justify-center gap-1.5 py-2 px-3 rounded-xl bg-emerald-600 hover:bg-emerald-500 active:scale-95 text-white font-bold text-xs shadow-sm hover:shadow transition-all cursor-pointer"
                          >
                            <PackagePlus size={14} />
                            <span>+ Tambah Stok</span>
                          </button>
                          <button
                            onClick={() => {
                              setAdjustMaterial(raw)
                              setAdjustModalOpen(true)
                            }}
                            className="flex items-center justify-center gap-1 py-2 px-3 rounded-xl bg-muted hover:bg-muted/80 text-foreground font-bold text-xs border border-border/80 transition-all cursor-pointer"
                            title="Koreksi / Adjust Stok Fisik (Opname)"
                          >
                            <SlidersHorizontal size={13} />
                            <span>Adjust</span>
                          </button>
                        </div>
                      </div>
                    </motion.div>
                  )
                })}
              </div>
            )}
          </div>
        )}

        {/* ── TAB KEMASAN & PACKAGING (SUPLAI PERCETAKAN & VENDOR) ── */}
        {activeSubTab === 'kemasan' && (
          <div className="px-4 sm:px-6 pt-2 space-y-4">
            {/* Filter Jenis Kemasan & Rekap Belanja */}
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 overflow-x-auto pb-1">
              <div className="flex items-center gap-2 overflow-x-auto">
                {[
                  { id: 'all', label: 'Semua Kemasan' },
                  { id: 'pouch', label: '🛍️ Pouch Ziplock' },
                  { id: 'toples', label: '🫙 Toples Plastik' },
                  { id: 'sticker_depan', label: '🏷️ Stiker Depan' },
                  { id: 'sticker_belakang', label: '🏷️ Stiker Belakang' },
                  { id: 'kardus', label: '📦 Kardus Dus' },
                  { id: 'polymailer', label: '✉️ Polymailer' },
                  { id: 'bubblewrap_safety', label: '🛡️ Safety Pack' },
                ].map(f => (
                  <button
                    key={f.id}
                    onClick={() => setRawTypeFilter(f.id)}
                    className={`px-3 py-1.5 rounded-xl text-xs font-bold whitespace-nowrap transition-all cursor-pointer ${
                      rawTypeFilter === f.id
                        ? 'bg-amber-500 text-slate-950'
                        : 'bg-muted text-muted-foreground hover:text-foreground'
                    }`}
                  >
                    {f.label}
                  </button>
                ))}
              </div>

              <button
                onClick={() => {
                  setHistoryMaterial(null)
                  setHistoryModalOpen(true)
                }}
                className="shrink-0 px-3.5 py-1.5 rounded-xl text-xs font-bold whitespace-nowrap bg-amber-500/10 hover:bg-amber-500/20 text-amber-700 dark:text-amber-400 border border-amber-500/20 flex items-center gap-1.5 transition-all cursor-pointer shadow-sm"
                title="Rekap Riwayat Pembelian Semua Kemasan"
              >
                <History size={14} />
                <span>Rekap Belanja Kemasan</span>
              </button>
            </div>

            {/* Grid Kemasan */}
            {isLoadingRaw ? (
              <div className="p-12 text-center text-xs text-muted-foreground">Memuat data kemasan & packaging...</div>
            ) : filteredRaw.length === 0 ? (
              <div className="p-12 text-center bg-card border border-border/80 rounded-3xl space-y-3">
                <Boxes size={40} className="mx-auto text-muted-foreground/40" />
                <div>
                  <p className="font-bold text-sm text-foreground">Belum ada Kemasan & Packaging</p>
                  <p className="text-xs text-muted-foreground mt-0.5">
                    Tambahkan pouch 100g, 200g, 250g, stiker label, kardus, atau polymailer dari percetakan/vendor.
                  </p>
                </div>
                <button
                  onClick={() => {
                    setEditingRawMaterial(null)
                    setRawSheetOpen(true)
                  }}
                  className="inline-flex items-center gap-2 px-4 py-2 rounded-xl bg-amber-500 hover:bg-amber-400 text-slate-950 text-xs font-bold cursor-pointer transition"
                >
                  <Plus size={15} /> Tambah Kemasan Sekarang
                </button>
              </div>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3.5">
                {filteredRaw.map(raw => {
                  const isLow = raw.min_stock_alert > 0 && raw.current_stock <= raw.min_stock_alert
                  return (
                    <motion.div
                      key={raw.id}
                      layout
                      className="bg-card border border-border/80 hover:border-amber-500/50 rounded-2xl p-4 flex flex-col justify-between transition-all"
                    >
                      <div>
                        <div className="flex items-center justify-between gap-2 mb-2">
                          <span className="px-2 py-0.5 rounded-md text-[10px] font-bold uppercase bg-amber-500/10 text-amber-600 dark:text-amber-400 border border-amber-500/20">
                            {raw.category?.replace('_', ' ') || raw.material_type?.replace('_', ' ') || 'KEMASAN'}
                          </span>
                          {isLow && (
                            <span className="px-2 py-0.5 rounded-md text-[10px] font-bold bg-rose-500/10 text-rose-600 border border-rose-500/20">
                              Stok Menipis
                            </span>
                          )}
                        </div>

                        <h3 className="font-bold text-sm text-foreground">{raw.material_name}</h3>
                        {raw.notes && <p className="text-[11px] text-muted-foreground line-clamp-1 mt-0.5">{raw.notes}</p>}

                        <div className="mt-3 p-2.5 rounded-xl bg-muted/40 border border-border/50 space-y-1.5 text-xs">
                          <div className="flex justify-between">
                            <span className="text-muted-foreground">Stok Tersedia:</span>
                            <span className="font-bold text-foreground">{fmtStock(raw.current_stock)} {raw.unit}</span>
                          </div>
                          <div className="flex justify-between">
                            <span className="text-muted-foreground">HPP Satuan:</span>
                            <span className="font-extrabold text-amber-600 dark:text-amber-400">
                              Rp {fmt(raw.unit_cost)} / {raw.unit}
                            </span>
                          </div>
                          {Number(raw.total_spent) > 0 && (
                            <div className="flex justify-between text-[11px] pt-1 border-t border-border/40">
                              <span className="text-muted-foreground">Total Nota Pembelian:</span>
                              <span className="font-semibold text-foreground">Rp {fmt(raw.total_spent)}</span>
                            </div>
                          )}
                        </div>

                        {(() => {
                          const customUsage = getMaterialCustomUsage(raw)
                          if (customUsage.count === 0) return null
                          return (
                            <div className="mt-2 p-2 rounded-xl bg-amber-500/10 border border-amber-500/20 text-xs space-y-1">
                              <div className="flex items-center justify-between text-amber-900 dark:text-amber-300 font-bold">
                                <span className="flex items-center gap-1">
                                  <span>✨</span> Terpakai Kustom:
                                </span>
                                <span className="font-mono">{customUsage.totalQty} {raw.unit}</span>
                              </div>
                              {customUsage.latestNote && (
                                <p className="text-[10.5px] text-amber-800/80 dark:text-amber-300/80 italic line-clamp-1">
                                  "{customUsage.latestNote}"
                                </p>
                              )}
                            </div>
                          )
                        })()}
                      </div>

                      <div className="mt-3 pt-2.5 border-t border-border/60 space-y-2">
                        <div className="flex items-center justify-between text-[11px] text-muted-foreground">
                          <span>{raw.supplier_name ? `Percetakan/Vendor: ${raw.supplier_name}` : 'Vendor Percetakan'}</span>
                          <div className="flex items-center gap-1">
                            <button
                              onClick={() => {
                                setHistoryMaterial(raw)
                                setHistoryModalOpen(true)
                              }}
                              className="p-1.5 rounded-lg bg-amber-500/10 hover:bg-amber-500/20 text-amber-700 dark:text-amber-400 border border-amber-500/20 transition-colors cursor-pointer"
                              title="Riwayat Pembelian Kemasan Ini"
                            >
                              <History size={12} />
                            </button>
                            <button
                              onClick={() => {
                                setEditingRawMaterial(raw)
                                setRawSheetOpen(true)
                              }}
                              className="p-1.5 rounded-lg bg-muted hover:bg-muted/80 text-foreground transition-colors cursor-pointer"
                              title="Edit Detail Kemasan"
                            >
                              <Edit3 size={12} />
                            </button>
                            <button
                              onClick={() => handleDeleteRaw(raw)}
                              className="p-1.5 rounded-lg bg-rose-500/10 hover:bg-rose-500/20 text-rose-600 transition-colors cursor-pointer"
                              title="Hapus Kemasan"
                            >
                              <Trash2 size={12} />
                            </button>
                          </div>
                        </div>

                        <div className="flex items-center gap-1.5">
                          <button
                            onClick={() => {
                              setRestockMaterial(raw)
                              setRestockModalOpen(true)
                            }}
                            className="flex-1 flex items-center justify-center gap-1.5 py-2 px-3 rounded-xl bg-amber-500 hover:bg-amber-600 active:scale-95 text-slate-950 font-bold text-xs shadow-sm hover:shadow transition-all cursor-pointer"
                          >
                            <PackagePlus size={14} />
                            <span>+ Tambah Stok</span>
                          </button>
                          <button
                            onClick={() => {
                              setAdjustMaterial(raw)
                              setAdjustModalOpen(true)
                            }}
                            className="flex items-center justify-center gap-1 py-2 px-3 rounded-xl bg-muted hover:bg-muted/80 text-foreground font-bold text-xs border border-border/80 transition-all cursor-pointer"
                            title="Koreksi / Adjust Stok Fisik (Opname)"
                          >
                            <SlidersHorizontal size={13} />
                            <span>Adjust</span>
                          </button>
                        </div>
                      </div>
                    </motion.div>
                  )
                })}
              </div>
            )}
          </div>
        )}
      </div>

      {/* Sheet Produk */}
      <AnimatePresence>
        {sheet && (
          <ProductSheet
            product={sheet === 'new' ? null : sheet}
            onClose={() => setSheet(null)}
            onDelete={handleDelete}
          />
        )}
      </AnimatePresence>

      {/* Sheet Bahan Baku & Kemasan (Full Edit/Create) */}
      <SembakoBahanBakuSheet
        open={rawSheetOpen}
        onOpenChange={(v) => {
          setRawSheetOpen(v)
          if (!v) setEditingRawMaterial(null)
        }}
        onClose={() => {
          setRawSheetOpen(false)
          setEditingRawMaterial(null)
        }}
        initialData={editingRawMaterial}
        targetType={activeSubTab === 'bahan_baku' ? 'bahan_baku' : 'kemasan'}
      />

      {/* Modal Restok Cepat (Quick Add Stock) */}
      <SembakoRestockBahanModal
        open={restockModalOpen}
        onOpenChange={(v) => {
          setRestockModalOpen(v)
          if (!v) setRestockMaterial(null)
        }}
        material={restockMaterial}
        onClose={() => {
          setRestockModalOpen(false)
          setRestockMaterial(null)
        }}
      />

      {/* Modal Adjust Stok Cepat / Opname (Pure Physical Stock Adjustment) */}
      <SembakoAdjustStockModal
        open={adjustModalOpen}
        onOpenChange={(v) => {
          setAdjustModalOpen(v)
          if (!v) setAdjustMaterial(null)
        }}
        material={adjustMaterial}
        onClose={() => {
          setAdjustModalOpen(false)
          setAdjustMaterial(null)
        }}
      />

      {/* Modal Riwayat Belanja / Batch History */}
      <SembakoBahanBeliHistoryModal
        open={historyModalOpen}
        onOpenChange={(v) => {
          setHistoryModalOpen(v)
          if (!v) setHistoryMaterial(null)
        }}
        material={historyMaterial}
        onClose={() => {
          setHistoryModalOpen(false)
          setHistoryMaterial(null)
        }}
      />

      {/* Modal Hapus Bahan Baku */}
      <AlertDialog open={!!rawToDelete} onOpenChange={(v) => !v && setRawToDelete(null)}>
        <AlertDialogContent className="bg-white dark:bg-[#0C1319] border border-slate-200 dark:border-white/10 rounded-3xl max-w-md p-6 shadow-2xl">
          <AlertDialogHeader className="space-y-3">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-2xl bg-rose-500/15 border border-rose-500/30 flex items-center justify-center text-rose-600 dark:text-rose-400 shrink-0">
                <AlertTriangle size={20} />
              </div>
              <div>
                <AlertDialogTitle className="text-slate-900 dark:text-white font-black text-base tracking-tight font-['Sora']">
                  Hapus Bahan / Kemasan
                </AlertDialogTitle>
                <p className="text-xs text-slate-500 dark:text-slate-400">
                  Hapus item kemasan "{rawToDelete?.material_name}" dari data inventaris?
                </p>
              </div>
            </div>
          </AlertDialogHeader>
          <AlertDialogFooter className="gap-2.5 mt-5">
            <AlertDialogCancel className="flex-1 h-11 rounded-xl bg-slate-100 dark:bg-white/10 hover:bg-slate-200 dark:hover:bg-white/15 text-slate-700 dark:text-white font-bold text-xs border-none cursor-pointer">
              Batal
            </AlertDialogCancel>
            <AlertDialogAction
              onClick={confirmDeleteRaw}
              className="flex-1 h-11 rounded-xl bg-rose-600 hover:bg-rose-700 text-white font-black text-xs tracking-wide border-none shadow-lg shadow-rose-600/20 cursor-pointer"
            >
              Ya, Hapus
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      {/* Modal Hapus Produk */}
      <AlertDialog open={!!productToDelete} onOpenChange={(v) => !v && setProductToDelete(null)}>
        <AlertDialogContent className="bg-white dark:bg-[#0C1319] border border-slate-200 dark:border-white/10 rounded-3xl max-w-md p-6 shadow-2xl">
          <AlertDialogHeader className="space-y-3">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-2xl bg-rose-500/15 border border-rose-500/30 flex items-center justify-center text-rose-600 dark:text-rose-400 shrink-0">
                <AlertTriangle size={20} />
              </div>
              <div>
                <AlertDialogTitle className="text-slate-900 dark:text-white font-black text-base tracking-tight font-['Sora']">
                  Konfirmasi Hapus Produk
                </AlertDialogTitle>
                <p className="text-xs text-slate-500 dark:text-slate-400">
                  Tindakan ini akan menghapus produk dari katalog aktif.
                </p>
              </div>
            </div>

            {/* Target Product Summary Card */}
            {productToDelete && (
              <div className="p-3.5 rounded-2xl bg-slate-50 dark:bg-white/5 border border-slate-200/80 dark:border-white/10 space-y-1.5 text-left">
                <div className="flex items-center justify-between">
                  <span className="text-[10px] font-black uppercase tracking-wider text-slate-400">Nama Produk</span>
                  {productToDelete.category && (
                    <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-slate-200 dark:bg-white/10 text-slate-700 dark:text-slate-300">
                      {productToDelete.category}
                    </span>
                  )}
                </div>
                <p className="font-bold text-sm text-slate-900 dark:text-white">
                  {productToDelete.product_name}
                </p>
                <div className="flex items-center justify-between text-xs pt-1 border-t border-slate-200/60 dark:border-white/10">
                  <span className="text-slate-500">Harga Jual:</span>
                  <span className="font-bold text-slate-800 dark:text-slate-200">
                    Rp {fmt(productToDelete.sell_price)} / {productToDelete.unit}
                  </span>
                </div>
              </div>
            )}

            {/* Warning if stock > 0 */}
            {productToDelete && (productToDelete.current_stock || 0) > 0 ? (
              <div className="p-3 rounded-2xl bg-rose-50 dark:bg-rose-950/30 border border-rose-200 dark:border-rose-900/40 text-left space-y-1">
                <p className="text-xs font-bold text-rose-700 dark:text-rose-300 flex items-center gap-1.5">
                  <span>⚠️</span> Masih Memiliki Stok Aktif!
                </p>
                <p className="text-[11px] text-rose-600/90 dark:text-rose-300/80 leading-relaxed">
                  Produk ini masih memiliki stok <strong>{fmtStock(productToDelete.current_stock)} {productToDelete.unit}</strong>.
                  Menghapusnya dapat mempengaruhi keakuratan nilai inventaris gudang.
                </p>
              </div>
            ) : (
              <div className="p-3 rounded-2xl bg-amber-50 dark:bg-amber-950/30 border border-amber-200 dark:border-amber-900/40 text-left">
                <p className="text-[11px] text-amber-700 dark:text-amber-300 leading-relaxed">
                  💡 <strong>Tip:</strong> Jika produk hanya sementara tidak dijual, Anda cukup menonaktifkannya melalui toggle <em>"Produk Aktif"</em> di formulir edit agar riwayat transaksi tetap aman.
                </p>
              </div>
            )}
          </AlertDialogHeader>

          <AlertDialogFooter className="gap-2.5 mt-5">
            <AlertDialogCancel className="flex-1 h-11 rounded-xl bg-slate-100 dark:bg-white/10 hover:bg-slate-200 dark:hover:bg-white/15 text-slate-700 dark:text-white font-bold text-xs border-none cursor-pointer">
              Batal
            </AlertDialogCancel>
            <AlertDialogAction
              onClick={confirmDeleteProduct}
              className="flex-1 h-11 rounded-xl bg-rose-600 hover:bg-rose-700 text-white font-black text-xs tracking-wide border-none shadow-lg shadow-rose-600/20 cursor-pointer"
            >
              Ya, Hapus Produk
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      <ImportCsvModal
        open={importCsvOpen}
        onClose={() => setImportCsvOpen(false)}
        defaultEntity="products"
      />
    </div>
  )
}
