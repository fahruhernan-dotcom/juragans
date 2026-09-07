import React, { useState, useMemo, useEffect, useRef } from 'react'
import {
  X, Plus, Trash2, Calendar, Factory, Calculator,
  CheckCircle2, Clock, AlertCircle, Sparkles, Building2,
  Package, Tag, Layers, ArrowRight, ShieldCheck, DollarSign,
  RotateCcw, Save
} from 'lucide-react'
import { useAuth } from '@/lib/hooks/useAuth'
import {
  useSembakoProducts,
  useSembakoRawMaterials,
  useSembakoSuppliers,
  useCreatePurchaseInvoice,
  useUpdatePurchaseInvoice,
} from '@/lib/hooks/useSembakoData'
import { formatIDR, formatDate } from '@/lib/format'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Textarea } from '@/components/ui/textarea'
import { DatePicker } from '@/components/ui/DatePicker'
import {
  Select,
  SelectTrigger,
  SelectValue,
  SelectContent,
  SelectItem,
  SelectLabel,
  SelectGroup,
} from '@/components/ui/select'
import { toast } from 'sonner'
import { cn } from '@/lib/utils'

const DRAFT_STORAGE_KEY = 'sembako_purchase_invoice_draft'
const DEFAULT_PAYMENT_METHOD = 'Kas Operasional Juragan'

function generateDefaultInvoiceNumber() {
  const now = new Date()
  const year = now.getFullYear()
  const month = String(now.getMonth() + 1).padStart(2, '0')
  const rand = String(Math.floor(Math.random() * 900) + 100)
  return `INV/PABRIK/${year}/${month}/${rand}`
}

function formatNumberIdr(val) {
  if (val === '' || val === null || val === undefined) return ''
  const clean = String(val).replace(/\D/g, '')
  if (!clean) return ''
  return new Intl.NumberFormat('id-ID').format(Number(clean))
}

function sanitizeItems(rawItems) {
  if (!Array.isArray(rawItems) || rawItems.length === 0) return null
  return rawItems.map(it => {
    const rawQty = String(it.quantity ?? '').replace(/[^0-9.]/g, '')
    const parts = rawQty.split('.')
    const cleanQty = parts.length > 2 ? `${parts[0]}.${parts.slice(1).join('')}` : rawQty
    const cleanPrice = String(it.unit_price ?? '').replace(/\D/g, '')
    const cleanSheets = String(it.sheetCount ?? '').replace(/\D/g, '')
    const cleanCuts = String(it.cutsPerSheet ?? '').replace(/\D/g, '') || '12'
    const cleanPrint = String(it.printCostPerSheet ?? '').replace(/\D/g, '') || '6500'
    const cleanCutting = String(it.cuttingCostPerSheet ?? '').replace(/\D/g, '') || '6500'

    const qtyNum = Math.max(0, parseFloat(cleanQty) || 0)
    const priceNum = Math.max(0, parseFloat(cleanPrice) || 0)
    const calculatedSubtotal = Math.max(0, Math.round(qtyNum * priceNum))

    return {
      ...it,
      quantity: cleanQty || '1',
      unit_price: cleanPrice,
      subtotal: Math.max(0, Number(it.subtotal) || calculatedSubtotal),
      sheetCount: cleanSheets,
      cutsPerSheet: cleanCuts,
      printCostPerSheet: cleanPrint,
      cuttingCostPerSheet: cleanCutting,
      isStickerMode: Boolean(it.isStickerMode),
    }
  })
}

const ITEM_CATEGORIES = [
  { id: 'bawang_sku', label: '🧅 Bawang Jadi (SKU Produk)', defaultUnit: 'kg' },
  { id: 'bawang_curah', label: '🌾 Bawang Curah Mentah', defaultUnit: 'kg' },
  { id: 'kemasan', label: '🛍️ Kemasan / Pouch', defaultUnit: 'pcs' },
  { id: 'polymailer', label: '✉️ Plastik Polymailer', defaultUnit: 'pcs' },
  { id: 'sticker_depan', label: '🏷️ Stiker Label Depan', defaultUnit: 'pcs' },
  { id: 'sticker_belakang', label: '🏷️ Stiker Belakang Nutrisi', defaultUnit: 'pcs' },
  { id: 'kardus', label: '📦 Kardus & Packing', defaultUnit: 'box' },
  { id: 'bubblewrap_safety', label: '🛡️ Bubblewrap / Lakban Fragile', defaultUnit: 'roll' },
  { id: 'ongkir', label: '🚚 Ongkir / Ekspedisi Jasa', defaultUnit: 'trip' },
  { id: 'custom', label: '✨ Item Kustom Bebas', defaultUnit: 'pcs' },
]

export function SembakoCreatePurchaseInvoiceSheet({ open, onOpenChange, editInvoice = null, onSuccessPreview }) {
  const { tenant } = useAuth()
  const { data: suppliers = [] } = useSembakoSuppliers()
  const { data: products = [] } = useSembakoProducts()
  const { data: rawMaterials = [] } = useSembakoRawMaterials()
  const createInvoiceMutation = useCreatePurchaseInvoice()
  const updateInvoiceMutation = useUpdatePurchaseInvoice()
  const isSubmitting = createInvoiceMutation.isPending || updateInvoiceMutation.isPending

  const hasInitializedRef = useRef(false)
  const [hasDraftLoaded, setHasDraftLoaded] = useState(false)

  // Form states
  const [supplierId, setSupplierId] = useState('')
  const [supplierName, setSupplierName] = useState('')
  const [isAddingNewSupplier, setIsAddingNewSupplier] = useState(false)
  const [newSupplierName, setNewSupplierName] = useState('')
  const [newSupplierPhone, setNewSupplierPhone] = useState('')

  const [invoiceNumber, setInvoiceNumber] = useState('')
  const [transactionDate, setTransactionDate] = useState(new Date().toISOString().slice(0, 10))
  const [dueDate, setDueDate] = useState('')
  const [paymentStatus, setPaymentStatus] = useState('lunas') // 'lunas' | 'tempo' | 'sebagian'
  const [paymentMethod, setPaymentMethod] = useState(DEFAULT_PAYMENT_METHOD)
  const [paidAmount, setPaidAmount] = useState('')
  const [notes, setNotes] = useState('')

  // Multi-item table state
  const [items, setItems] = useState([
    {
      type: 'sku',
      item_id: '',
      product_name: '',
      category: 'bawang_sku',
      quantity: '1',
      unit: 'kg',
      unit_price: '',
      subtotal: 0,
      notes: '',
      // Optional Sticker Calculator state
      isStickerMode: false,
      sheetCount: '',
      cutsPerSheet: '12',
      printCostPerSheet: '6500',
      cuttingCostPerSheet: '6500',
      includeCutting: true,
    }
  ])

  // Reset or initialize on open with draft restoration or editInvoice prefill
  useEffect(() => {
    if (!open) {
      hasInitializedRef.current = false
      return
    }

    if (hasInitializedRef.current) return

    // 1. If editInvoice is provided, prefill all fields from existing invoice
    if (editInvoice) {
      setInvoiceNumber(editInvoice.invoice_number || '')
      setSupplierId(editInvoice.supplier_id || '')
      setSupplierName(editInvoice.supplier_name || '')
      setIsAddingNewSupplier(false)
      setNewSupplierName('')
      setNewSupplierPhone('')
      setTransactionDate(editInvoice.transaction_date || new Date().toISOString().slice(0, 10))
      setDueDate(editInvoice.due_date || '')
      setPaymentStatus(editInvoice.payment_status || 'lunas')
      setPaymentMethod(editInvoice.payment_method || DEFAULT_PAYMENT_METHOD)
      setPaidAmount(editInvoice.paid_amount ? String(editInvoice.paid_amount).replace(/\D/g, '') : '')
      setNotes(editInvoice.notes || '')

      if (Array.isArray(editInvoice.items) && editInvoice.items.length > 0) {
        const mapped = editInvoice.items.map(it => ({
          type: it.type || (it.category === 'bawang_sku' ? 'sku' : 'raw_material'),
          item_id: it.item_id || it.id || '',
          product_name: it.product_name || it.item_name || '',
          category: it.category || (it.type === 'sku' ? 'bawang_sku' : 'kemasan'),
          quantity: String(it.quantity || '1'),
          unit: it.unit || 'pcs',
          unit_price: String(it.unit_price || ''),
          subtotal: Number(it.subtotal || 0),
          notes: it.notes || '',
          isStickerMode: Boolean(it.isStickerMode || (it.category || '').includes('sticker') || (it.product_name || '').toLowerCase().includes('stiker')),
          sheetCount: it.sheetCount ? String(it.sheetCount) : '',
          cutsPerSheet: it.cutsPerSheet ? String(it.cutsPerSheet) : '12',
          printCostPerSheet: it.printCostPerSheet ? String(it.printCostPerSheet) : '6500',
          cuttingCostPerSheet: it.cuttingCostPerSheet ? String(it.cuttingCostPerSheet) : '6500',
          includeCutting: it.includeCutting !== undefined ? it.includeCutting : true,
        }))
        setItems(mapped)
      }

      setHasDraftLoaded(false)
      hasInitializedRef.current = true
      return
    }

    // 2. Check if draft exists in localStorage (Create Mode only)
    try {
      const saved = localStorage.getItem(DRAFT_STORAGE_KEY)
      if (saved) {
        const parsed = JSON.parse(saved)
        if (parsed && typeof parsed === 'object') {
          if (parsed.supplierId) setSupplierId(parsed.supplierId)
          if (parsed.supplierName) setSupplierName(parsed.supplierName)
          if (parsed.isAddingNewSupplier !== undefined) setIsAddingNewSupplier(parsed.isAddingNewSupplier)
          if (parsed.newSupplierName) setNewSupplierName(parsed.newSupplierName)
          if (parsed.newSupplierPhone) setNewSupplierPhone(parsed.newSupplierPhone)
          if (parsed.invoiceNumber) setInvoiceNumber(parsed.invoiceNumber)
          if (parsed.transactionDate) setTransactionDate(parsed.transactionDate)
          if (parsed.dueDate) setDueDate(parsed.dueDate)
          if (parsed.paymentStatus) setPaymentStatus(parsed.paymentStatus)
          setPaymentMethod(parsed.paymentMethod || DEFAULT_PAYMENT_METHOD)
          if (parsed.paidAmount !== undefined) setPaidAmount(String(parsed.paidAmount).replace(/\D/g, ''))
          if (parsed.notes) setNotes(parsed.notes)

          const cleaned = sanitizeItems(parsed.items)
          if (cleaned && cleaned.length > 0) {
            setItems(cleaned)
          }

          setHasDraftLoaded(true)
          hasInitializedRef.current = true
          return
        }
      }
    } catch (e) {
      console.warn('Failed to parse purchase invoice draft:', e)
    }

    // 3. Default initialization if no draft exists
    setInvoiceNumber(generateDefaultInvoiceNumber())
    setTransactionDate(new Date().toISOString().slice(0, 10))
    setDueDate('')
    setPaymentStatus('lunas')
    setPaymentMethod(DEFAULT_PAYMENT_METHOD)
    setPaidAmount('')
    setNotes(
      '1. Faktur pengambilan stok bahan baku dan produk dari pabrik mitra.\n' +
      '2. Lunas terbayar menggunakan kas operasional toko.\n' +
      '3. Bukti sah penambahan HPP modal stok awal masuk sistem inventaris FIFO.'
    )
    setIsAddingNewSupplier(false)

    // Preselect first supplier if available
    if (suppliers.length > 0 && !supplierId) {
      setSupplierId(suppliers[0].id)
      setSupplierName(suppliers[0].supplier_name)
    }

    // Initialize first item
    if (products.length > 0) {
      const firstProd = products[0]
      setItems([
        {
          type: 'sku',
          item_id: firstProd.id,
          product_name: firstProd.product_name,
          category: 'bawang_sku',
          quantity: '2',
          unit: firstProd.unit || 'kg',
          unit_price: String(firstProd.avg_buy_price || 120000),
          subtotal: 2 * (Number(firstProd.avg_buy_price) || 120000),
          notes: 'Stok Baru Masuk Gudang',
          isStickerMode: false,
          sheetCount: '',
          cutsPerSheet: '12',
          printCostPerSheet: '6500',
          cuttingCostPerSheet: '6500',
          includeCutting: true,
        }
      ])
    }

    hasInitializedRef.current = true
  }, [open, editInvoice])

  // Async population if suppliers load after modal opens (Create Mode only)
  useEffect(() => {
    if (open && !editInvoice && suppliers.length > 0 && !supplierId && !isAddingNewSupplier) {
      setSupplierId(suppliers[0].id)
      setSupplierName(suppliers[0].supplier_name)
    }
  }, [open, editInvoice, suppliers, supplierId, isAddingNewSupplier])

  // Async population if products load after modal opens (only if default empty item in Create Mode)
  useEffect(() => {
    if (open && !editInvoice && products.length > 0) {
      setItems(prev => {
        if (prev.length === 1 && !prev[0].item_id && prev[0].category === 'bawang_sku') {
          const firstProd = products[0]
          return [{
            ...prev[0],
            item_id: firstProd.id,
            product_name: firstProd.product_name,
            unit: firstProd.unit || 'kg',
            unit_price: prev[0].unit_price || String(firstProd.avg_buy_price || 120000),
            subtotal: Math.max(0, (Number(prev[0].quantity) || 1) * (Number(prev[0].unit_price || firstProd.avg_buy_price) || 120000))
          }]
        }
        return prev
      })
    }
  }, [open, editInvoice, products])

  // Auto-save form draft to localStorage (only in Create Mode, NOT in Edit Mode)
  useEffect(() => {
    if (!open || editInvoice || !hasInitializedRef.current) return
    if (!invoiceNumber && items.length === 0) return

    const draftData = {
      supplierId,
      supplierName,
      isAddingNewSupplier,
      newSupplierName,
      newSupplierPhone,
      invoiceNumber,
      transactionDate,
      dueDate,
      paymentStatus,
      paymentMethod,
      paidAmount,
      notes,
      items,
    }

    try {
      localStorage.setItem(DRAFT_STORAGE_KEY, JSON.stringify(draftData))
    } catch (err) {
      console.warn('Failed saving purchase draft:', err)
    }
  }, [
    open,
    editInvoice,
    supplierId,
    supplierName,
    isAddingNewSupplier,
    newSupplierName,
    newSupplierPhone,
    invoiceNumber,
    transactionDate,
    dueDate,
    paymentStatus,
    paymentMethod,
    paidAmount,
    notes,
    items,
  ])

  // Reset draft to clean defaults or restore original edit data
  const handleResetDraft = () => {
    if (editInvoice) {
      if (!window.confirm('Muat ulang data asli faktur ini?')) return
      setInvoiceNumber(editInvoice.invoice_number || '')
      setSupplierId(editInvoice.supplier_id || '')
      setSupplierName(editInvoice.supplier_name || '')
      setIsAddingNewSupplier(false)
      setNewSupplierName('')
      setNewSupplierPhone('')
      setTransactionDate(editInvoice.transaction_date || new Date().toISOString().slice(0, 10))
      setDueDate(editInvoice.due_date || '')
      setPaymentStatus(editInvoice.payment_status || 'lunas')
      setPaymentMethod(editInvoice.payment_method || DEFAULT_PAYMENT_METHOD)
      setPaidAmount(editInvoice.paid_amount ? String(editInvoice.paid_amount).replace(/\D/g, '') : '')
      setNotes(editInvoice.notes || '')
      if (Array.isArray(editInvoice.items) && editInvoice.items.length > 0) {
        setItems(editInvoice.items)
      }
      return
    }

    if (!window.confirm('Reset formulir dan hapus draf yang tersimpan?')) return
    try {
      localStorage.removeItem(DRAFT_STORAGE_KEY)
    } catch (e) {}
    setHasDraftLoaded(false)
    setInvoiceNumber(generateDefaultInvoiceNumber())
    setTransactionDate(new Date().toISOString().slice(0, 10))
    setDueDate('')
    setPaymentStatus('lunas')
    setPaymentMethod(DEFAULT_PAYMENT_METHOD)
    setPaidAmount('')
    setNotes(
      '1. Faktur pengambilan stok bahan baku dan produk dari pabrik mitra.\n' +
      '2. Lunas terbayar menggunakan kas operasional toko.\n' +
      '3. Bukti sah penambahan HPP modal stok awal masuk sistem inventaris FIFO.'
    )
    setIsAddingNewSupplier(false)
    setNewSupplierName('')
    setNewSupplierPhone('')
    if (suppliers.length > 0) {
      setSupplierId(suppliers[0].id)
      setSupplierName(suppliers[0].supplier_name)
    }
    if (products.length > 0) {
      const firstProd = products[0]
      setItems([
        {
          type: 'sku',
          item_id: firstProd.id,
          product_name: firstProd.product_name,
          category: 'bawang_sku',
          quantity: '2',
          unit: firstProd.unit || 'kg',
          unit_price: String(firstProd.avg_buy_price || 120000),
          subtotal: 2 * (Number(firstProd.avg_buy_price) || 120000),
          notes: 'Stok Baru Masuk Gudang',
          isStickerMode: false,
          sheetCount: '',
          cutsPerSheet: '12',
          printCostPerSheet: '6500',
          cuttingCostPerSheet: '6500',
          includeCutting: true,
        }
      ])
    }
    toast.success('Formulir berhasil direset ke nilai awal.')
  }

  // Handle supplier selection
  const handleSupplierChange = (e) => {
    const val = e.target.value
    if (val === '__new__') {
      setIsAddingNewSupplier(true)
      setSupplierId('')
      setSupplierName('')
    } else {
      setIsAddingNewSupplier(false)
      setSupplierId(val)
      const found = suppliers.find(s => s.id === val)
      setSupplierName(found ? found.supplier_name : '')
    }
  }

  // Add Item Row
  const handleAddItem = () => {
    setItems(prev => [
      ...prev,
      {
        type: 'sku',
        item_id: products[0]?.id || '',
        product_name: products[0]?.product_name || '',
        category: 'bawang_sku',
        quantity: '1',
        unit: products[0]?.unit || 'kg',
        unit_price: String(products[0]?.avg_buy_price || 105000),
        subtotal: Number(products[0]?.avg_buy_price || 105000),
        notes: '',
        isStickerMode: false,
        sheetCount: '',
        cutsPerSheet: '12',
        printCostPerSheet: '6500',
        cuttingCostPerSheet: '6500',
        includeCutting: true,
      }
    ])
  }

  // Remove Item Row
  const handleRemoveItem = (index) => {
    if (items.length <= 1) {
      toast.error('Minimal harus ada 1 item barang pada faktur pembelian!')
      return
    }
    setItems(prev => prev.filter((_, i) => i !== index))
  }

  // Update item field
  const handleItemChange = (index, field, value) => {
    setItems(prev => {
      const copy = [...prev]
      let current = { ...copy[index] }

      if (field === 'quantity') {
        // Strictly block negative and non-numeric chars (allow positive decimals e.g. 2.5)
        const sanitized = String(value).replace(/[^0-9.]/g, '')
        const parts = sanitized.split('.')
        current.quantity = parts.length > 2 ? `${parts[0]}.${parts.slice(1).join('')}` : sanitized
        const qtyNum = Math.max(0, parseFloat(current.quantity) || 0)
        const priceNum = Math.max(0, parseFloat(String(current.unit_price).replace(/\D/g, '')) || 0)
        if (current.unit_price !== '') {
          current.subtotal = Math.max(0, Math.round(qtyNum * priceNum))
        } else if (current.subtotal !== '' && qtyNum > 0) {
          current.unit_price = String(Math.round(Number(current.subtotal) / qtyNum))
        }
      } else if (field === 'unit_price') {
        const rawStr = String(value).replace(/\D/g, '')
        current.unit_price = rawStr
        const qtyNum = Math.max(0, parseFloat(current.quantity) || 0)
        const priceNum = rawStr === '' ? 0 : (parseFloat(rawStr) || 0)
        current.subtotal = rawStr === '' ? '' : Math.max(0, Math.round(qtyNum * priceNum))
      } else if (field === 'subtotal') {
        const rawStr = String(value).replace(/\D/g, '')
        const cleanSub = rawStr === '' ? '' : (parseInt(rawStr, 10) || 0)
        current.subtotal = cleanSub
        const qtyNum = Math.max(0, parseFloat(current.quantity) || 0)
        if (rawStr !== '' && qtyNum > 0) {
          current.unit_price = String(Math.round(Number(cleanSub) / qtyNum))
        } else if (rawStr !== '') {
          current.unit_price = String(cleanSub)
        } else {
          current.unit_price = ''
        }
      } else {
        current[field] = value
      }

      // Category changed: update type and presets
      if (field === 'category') {
        const cat = value
        if (cat === 'bawang_sku') {
          current.type = 'sku'
          const p = products[0]
          current.item_id = p?.id || ''
          current.product_name = p?.product_name || ''
          current.unit = p?.unit || 'kg'
          current.unit_price = String(p?.avg_buy_price || 105000)
          current.isStickerMode = false
        } else if (cat === 'kemasan') {
          current.type = 'raw_material'
          const m = rawMaterials.find(r => r.category === 'pouch' || r.category === 'kemasan') || rawMaterials[0]
          current.item_id = m?.id || ''
          current.product_name = m?.material_name || 'Standing Pouch'
          current.unit = m?.unit || 'pcs'
          current.unit_price = String(m?.unit_cost || 1500)
          current.isStickerMode = false
        } else if (cat === 'sticker_depan' || cat === 'sticker_belakang') {
          current.type = 'raw_material'
          const isDepan = cat === 'sticker_depan'
          const m = rawMaterials.find(r => isDepan ? (r.category === 'sticker_depan' || r.material_name.toLowerCase().includes('depan')) : (r.category === 'sticker_belakang' || r.material_name.toLowerCase().includes('belakang'))) || rawMaterials[0]
          current.item_id = m?.id || ''
          current.product_name = m?.material_name || (isDepan ? 'Stiker Depan' : 'Stiker Belakang')
          current.unit = m?.unit || 'pcs'
          current.unit_price = String(m?.unit_cost || 1083)
          current.isStickerMode = true
        } else if (cat === 'bawang_curah') {
          current.type = 'raw_material'
          const m = rawMaterials.find(r => r.category === 'bawang_mentah' || r.category === 'bawang_curah') || rawMaterials[0]
          current.item_id = m?.id || ''
          current.product_name = m?.material_name || 'Bawang Goreng Curah'
          current.unit = m?.unit || 'kg'
          current.unit_price = String(m?.unit_cost || 95000)
          current.isStickerMode = false
        } else if (cat === 'kardus') {
          current.type = 'raw_material'
          const m = rawMaterials.find(r => r.category === 'kardus' || r.category === 'box') || rawMaterials[0]
          current.item_id = m?.id || ''
          current.product_name = m?.material_name || 'Kardus Master Box'
          current.unit = m?.unit || 'box'
          current.unit_price = String(m?.unit_cost || 4500)
          current.isStickerMode = false
        } else if (cat === 'polymailer') {
          current.type = 'raw_material'
          const m = rawMaterials.find(r => 
            (r.category || '').toLowerCase() === 'polymailer' || 
            (r.category || '').toLowerCase() === 'packing' || 
            (r.material_name || '').toLowerCase().includes('polymailer') || 
            (r.material_name || '').toLowerCase().includes('plastik')
          )
          current.item_id = m?.id || ''
          current.product_name = m?.material_name || 'Plastik Polymailer Ekspedisi'
          current.unit = m?.unit || 'pcs'
          current.unit_price = String(m?.unit_cost || 350)
          current.isStickerMode = false
        } else if (cat === 'bubblewrap_safety') {
          current.type = 'raw_material'
          const m = rawMaterials.find(r => 
            (r.category || '').toLowerCase().includes('bubble') || 
            (r.material_name || '').toLowerCase().includes('bubble') || 
            (r.material_name || '').toLowerCase().includes('lakban')
          )
          current.item_id = m?.id || ''
          current.product_name = m?.material_name || 'Bubblewrap Safety Packing'
          current.unit = m?.unit || 'roll'
          current.unit_price = String(m?.unit_cost || 15000)
          current.isStickerMode = false
        } else if (cat === 'ongkir') {
          current.type = 'custom'
          current.item_id = ''
          current.product_name = 'Biaya Ongkir & Ekspedisi JNE'
          current.unit = 'trip'
          current.unit_price = '20000'
          current.isStickerMode = false
        } else {
          current.type = 'custom'
          current.item_id = ''
          current.product_name = ''
          current.unit = 'pcs'
          current.unit_price = ''
          current.isStickerMode = false
        }
      }

      // If choosing SKU from dropdown
      if (field === 'sku_pick') {
        const p = products.find(prod => prod.id === value)
        if (p) {
          current.item_id = p.id
          current.product_name = p.product_name
          current.unit = p.unit || 'kg'
          if (!current.unit_price) current.unit_price = String(p.avg_buy_price || 105000)
        }
      }

      // If choosing Raw Material from dropdown
      if (field === 'raw_pick') {
        const m = rawMaterials.find(mat => mat.id === value)
        if (m) {
          current.item_id = m.id
          current.product_name = m.material_name
          current.unit = m.unit || 'pcs'
          if (!current.unit_price) current.unit_price = String(m.unit_cost || 1000)
        }
      }

      // Re-calculate subtotal strictly positive if not manually editing subtotal
      if (field !== 'subtotal') {
        const qtyNum = Math.max(0, parseFloat(current.quantity) || 0)
        const priceNum = Math.max(0, parseFloat(String(current.unit_price).replace(/\D/g, '')) || 0)
        current.subtotal = Math.max(0, Math.round(qtyNum * priceNum))
      }

      copy[index] = current
      return copy
    })
  }

  // Direct adjustment of overall Total Tagihan Pabrik
  const handleTotalAmountChange = (val) => {
    const rawStr = String(val).replace(/\D/g, '')
    const cleanNum = rawStr === '' ? 0 : (parseInt(rawStr, 10) || 0)

    setItems(prev => {
      if (prev.length === 0) return prev
      const copy = [...prev]

      // If single item: update its subtotal & unit_price directly
      if (copy.length === 1) {
        const it = { ...copy[0] }
        it.subtotal = rawStr === '' ? '' : cleanNum
        const qty = Math.max(0, parseFloat(it.quantity) || 0)
        if (rawStr !== '' && qty > 0) {
          it.unit_price = String(Math.round(cleanNum / qty))
        } else if (rawStr !== '') {
          it.unit_price = String(cleanNum)
        } else {
          it.unit_price = ''
        }
        copy[0] = it
        return copy
      }

      // If multiple items: adjust the last item so the aggregate sum equals cleanNum
      const otherItemsSum = copy.slice(0, -1).reduce((acc, it) => acc + (Number(it.subtotal) || 0), 0)
      const lastIdx = copy.length - 1
      const lastItem = { ...copy[lastIdx] }
      const newLastSubtotal = Math.max(0, cleanNum - otherItemsSum)
      lastItem.subtotal = newLastSubtotal
      const qty = Math.max(0, parseFloat(lastItem.quantity) || 0)
      if (qty > 0) {
        lastItem.unit_price = String(Math.round(newLastSubtotal / qty))
      }
      copy[lastIdx] = lastItem
      return copy
    })
  }

  // Handle Sticker Sheet Calculator Live Sync strictly non-negative
  const handleStickerMathChange = (index, updates) => {
    setItems(prev => {
      const copy = [...prev]
      const it = { ...copy[index], ...updates }

      // Strictly strip non-digits to completely prevent negative signs
      const cleanSheetStr = String(it.sheetCount ?? '').replace(/\D/g, '')
      const cleanCutStr = String(it.cutsPerSheet ?? '').replace(/\D/g, '')
      const cleanPrintStr = String(it.printCostPerSheet ?? '').replace(/\D/g, '')
      const cleanCuttingStr = String(it.cuttingCostPerSheet ?? '').replace(/\D/g, '')

      const sheets = Math.max(0, parseInt(cleanSheetStr, 10) || 0)
      const cuts = Math.max(1, parseInt(cleanCutStr, 10) || 12)
      const printPrice = Math.max(0, parseInt(cleanPrintStr, 10) || 0)
      const cutPrice = it.includeCutting ? Math.max(0, parseInt(cleanCuttingStr, 10) || 0) : 0
      const costPerSheet = Math.max(0, printPrice + cutPrice)

      const totalPcs = Math.max(0, Math.round(sheets * cuts))
      const totalNota = Math.max(0, Math.round(sheets * costPerSheet))
      const hppPcs = cuts > 0 ? Math.max(0, Math.round(costPerSheet / cuts)) : 0

      it.sheetCount = cleanSheetStr
      it.cutsPerSheet = cleanCutStr || '12'
      it.printCostPerSheet = cleanPrintStr
      it.cuttingCostPerSheet = cleanCuttingStr
      it.quantity = String(totalPcs)
      it.unit_price = String(hppPcs)
      it.subtotal = totalNota
      it.notes = sheets > 0
        ? `Cetak ${sheets} lbr A3+ @ Rp ${printPrice.toLocaleString('id-ID')} + Cutting Rp ${cutPrice.toLocaleString('id-ID')}/lbr (${cuts} pcs/lbr)`
        : ''

      copy[index] = it
      return copy
    })
  }

  // Aggregated totals
  const totalAmount = useMemo(() => {
    return items.reduce((acc, item) => acc + (Number(item.subtotal) || 0), 0)
  }, [items])

  const totalQuantity = useMemo(() => {
    return items.reduce((acc, item) => acc + (Number(item.quantity) || 0), 0)
  }, [items])

  const remainingDebt = useMemo(() => {
    if (paymentStatus === 'lunas') return 0
    if (paymentStatus === 'tempo') return totalAmount
    const p = parseFloat(String(paidAmount).replace(/\D/g, '')) || 0
    return Math.max(0, totalAmount - p)
  }, [paymentStatus, totalAmount, paidAmount])

  // Submit Handler
  const handleSubmit = async (e) => {
    e.preventDefault()

    const finalSuppName = isAddingNewSupplier ? newSupplierName.trim() : supplierName.trim()
    if (!finalSuppName) {
      toast.error('Nama Supplier / Pabrik harus diisi atau dipilih!')
      return
    }

    if (!invoiceNumber.trim()) {
      toast.error('Nomor invoice harus diisi!')
      return
    }

    if (items.length === 0) {
      toast.error('Minimal masukkan 1 barang pembelian!')
      return
    }

    // Validate items
    for (let i = 0; i < items.length; i++) {
      const it = items[i]
      if (!it.product_name) {
        toast.error(`Nama item baris ke-${i + 1} belum dipilih atau diisi!`)
        return
      }
      if (Number(it.quantity) <= 0) {
        toast.error(`Kuantitas baris ke-${i + 1} (${it.product_name}) harus lebih dari 0!`)
        return
      }
      if (Number(it.unit_price) <= 0) {
        toast.error(`Harga satuan pabrik baris ke-${i + 1} (${it.product_name}) harus lebih dari 0!`)
        return
      }
    }

    const payload = {
      supplier_id: isAddingNewSupplier ? null : supplierId,
      supplier_name: finalSuppName,
      supplier_phone: isAddingNewSupplier ? newSupplierPhone : '',
      invoice_number: invoiceNumber.trim(),
      transaction_date: transactionDate,
      due_date: paymentStatus !== 'lunas' && dueDate ? dueDate : null,
      payment_status: paymentStatus,
      payment_method: paymentMethod,
      paid_amount: paymentStatus === 'lunas' ? totalAmount : (parseFloat(String(paidAmount).replace(/\D/g, '')) || 0),
      items: items.map(it => ({
        type: it.type,
        item_id: it.item_id || null,
        product_name: it.product_name,
        category: it.category,
        quantity: Math.max(0, Number(it.quantity)),
        unit: it.unit || 'kg',
        unit_price: Math.max(0, parseFloat(String(it.unit_price).replace(/\D/g, '')) || 0),
        subtotal: Math.max(0, Number(it.subtotal)),
        notes: it.notes || '',
      })),
      total_quantity: totalQuantity,
      total_amount: totalAmount,
      notes: notes.trim(),
    }

    try {
      let res
      if (editInvoice) {
        res = await updateInvoiceMutation.mutateAsync({
          oldInvoiceNumber: editInvoice.invoice_number,
          ...payload
        })
      } else {
        res = await createInvoiceMutation.mutateAsync(payload)
      }

      // Clear persisted draft upon successful creation
      try {
        localStorage.removeItem(DRAFT_STORAGE_KEY)
      } catch (e) {}
      hasInitializedRef.current = false
      setHasDraftLoaded(false)

      onOpenChange(false)

      // Optionally trigger immediate print preview
      if (onSuccessPreview) {
        onSuccessPreview({
          ...payload,
          id: res?.invoice_number || payload.invoice_number,
          remaining_debt: remainingDebt,
        })
      }
    } catch (_err) {
      // Error is handled in mutation hook toast
    }
  }

  if (!open) return null

  return (
    <div
      className="fixed inset-0 z-[8000] bg-slate-950/70 backdrop-blur-sm flex justify-end transition-all"
      onClick={() => {
        if (!editInvoice) {
          toast.info('Draf formulir pembelian tersimpan di browser Anda.')
        }
        onOpenChange(false)
      }}
    >
      <div
        className="w-full max-w-3xl bg-white text-slate-900 h-full overflow-y-auto shadow-2xl flex flex-col font-sans"
        style={{ fontFamily: "'Inter', sans-serif" }}
        onClick={(e) => e.stopPropagation()}
      >
        {/* ── Header ── */}
        <div className="px-6 py-5 border-b border-slate-200 bg-[#F8FAFC] flex items-center justify-between sticky top-0 z-30">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-[#0EA5E9]/15 text-[#0EA5E9] flex items-center justify-center font-black">
              <Factory size={20} />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h2 className="text-base font-black text-slate-900 leading-tight">
                  {editInvoice ? 'Edit Faktur Tagihan Pabrik' : 'Catat Tagihan Pabrik / Pembelian Bahan'}
                </h2>
                {editInvoice ? (
                  <span className="px-2 py-0.5 rounded-full bg-sky-100 text-sky-800 text-[10px] font-extrabold border border-sky-300">
                    Mode Edit: {editInvoice.invoice_number}
                  </span>
                ) : hasDraftLoaded ? (
                  <span className="px-2 py-0.5 rounded-full bg-amber-100 text-amber-800 text-[10px] font-extrabold border border-amber-300">
                    Draf Dimuat
                  </span>
                ) : null}
              </div>
              <p className="text-xs text-slate-500 font-medium mt-0.5">
                {editInvoice
                  ? 'Perbarui rincian barang, supplier, metode pembayaran, atau nominal tagihan pabrik'
                  : 'Faktur pengambilan stok pabrik, pembelian pouch, cetak stiker, dan kemasan'}
              </p>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={handleResetDraft}
              className="px-2.5 py-1.5 rounded-xl border border-slate-200 hover:bg-slate-100 text-slate-600 text-xs font-bold flex items-center gap-1.5 transition-colors cursor-pointer"
              title={editInvoice ? 'Muat ulang data asli faktur ini' : 'Reset isian formulir ke nilai awal'}
            >
              <RotateCcw size={13} />
              <span className="hidden sm:inline">{editInvoice ? 'Reset Nilai' : 'Reset Draf'}</span>
            </button>
            <button
              type="button"
              onClick={() => {
                if (!editInvoice) {
                  toast.info('Draf formulir pembelian tersimpan di browser Anda.')
                }
                onOpenChange(false)
              }}
              className="w-9 h-9 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-500 hover:text-slate-800 flex items-center justify-center transition-colors cursor-pointer"
              title="Tutup"
            >
              <X size={18} />
            </button>
          </div>
        </div>

        {/* ── Form Body ── */}
        <form onSubmit={handleSubmit} className="p-6 space-y-6 flex-1">

          {/* Section 1: Data Supplier & Faktur */}
          <div className="bg-[#F8FAFC] rounded-2xl p-4 sm:p-5 border border-slate-200 space-y-4">
            <div className="flex items-center gap-2 text-xs font-black text-slate-900 uppercase tracking-wider">
              <Building2 size={15} className="text-[#0EA5E9]" />
              <span>1. Supplier & Nomor Invoice Pabrik</span>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              {/* Supplier Picker */}
              <div>
                <label className="block text-[11px] font-bold text-slate-700 uppercase tracking-wider mb-1.5">
                  Penerbit Tagihan (Supplier / Pabrik) *
                </label>
                {!isAddingNewSupplier ? (
                  <div className="space-y-1.5">
                    <Select
                      value={supplierId || ''}
                      onValueChange={(val) => {
                        if (val === '__new__') {
                          setIsAddingNewSupplier(true)
                          setSupplierId('')
                          setSupplierName('')
                        } else {
                          setIsAddingNewSupplier(false)
                          setSupplierId(val)
                          const found = suppliers.find(s => s.id === val)
                          setSupplierName(found ? found.supplier_name : '')
                        }
                      }}
                    >
                      <SelectTrigger className="h-11 bg-white border-slate-300 font-bold text-xs text-slate-900">
                        <SelectValue placeholder="Pilih Supplier / Pabrik Mitra..." />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectGroup>
                          <SelectLabel>Pabrik & Supplier Terdaftar</SelectLabel>
                          {suppliers.map(s => (
                            <SelectItem key={s.id} value={s.id}>
                              <div className="flex items-center gap-2">
                                <Building2 size={13} className="text-[#0EA5E9]" />
                                <span>{s.supplier_name}</span>
                                {s.phone && <span className="text-[10px] text-slate-400 font-mono">({s.phone})</span>}
                              </div>
                            </SelectItem>
                          ))}
                        </SelectGroup>
                        <div className="p-1 border-t border-slate-100">
                          <SelectItem value="__new__" className="text-[#0EA5E9] font-bold focus:bg-sky-50 focus:text-[#0EA5E9]">
                            <div className="flex items-center gap-1.5">
                              <Plus size={14} />
                              <span>+ Daftarkan Supplier / Pabrik Baru</span>
                            </div>
                          </SelectItem>
                        </div>
                      </SelectContent>
                    </Select>
                  </div>
                ) : (
                  <div className="space-y-2 p-3 bg-white rounded-xl border border-dashed border-[#0EA5E9]">
                    <div className="flex justify-between items-center">
                      <span className="text-[10px] font-black text-[#0EA5E9] uppercase">Supplier Baru</span>
                      <button
                        type="button"
                        onClick={() => setIsAddingNewSupplier(false)}
                        className="text-[10px] font-bold text-slate-400 hover:text-slate-700 underline"
                      >
                        Batal
                      </button>
                    </div>
                    <Input
                      placeholder="Nama Pabrik / Vendor (misal: Pabrik Bawang Boyolali)"
                      value={newSupplierName}
                      onChange={(e) => setNewSupplierName(e.target.value)}
                      className="h-10 text-xs font-bold"
                    />
                    <Input
                      placeholder="No. WhatsApp / Telepon (opsional)"
                      value={newSupplierPhone}
                      onChange={(e) => setNewSupplierPhone(e.target.value)}
                      className="h-9 text-xs"
                    />
                  </div>
                )}
              </div>

              {/* No. Invoice */}
              <div>
                <label className="block text-[11px] font-bold text-slate-700 uppercase tracking-wider mb-1.5">
                  No. Invoice / Surat Jalan Pabrik *
                </label>
                <Input
                  value={invoiceNumber}
                  onChange={(e) => setInvoiceNumber(e.target.value)}
                  placeholder="Contoh: INV/PABRIK/2026/08/001"
                  className="h-11 text-xs font-mono font-bold bg-white"
                />
                <p className="text-[10px] text-slate-500 mt-1">
                  Dapat diubah sesuai nomor faktur fisik yang diberikan pihak pabrik
                </p>
              </div>

              {/* Tanggal Transaksi */}
              <div>
                <label className="block text-[11px] font-bold text-slate-700 uppercase tracking-wider mb-1.5">
                  Tanggal Pengambilan / Transaksi *
                </label>
                <DatePicker
                  value={transactionDate}
                  onChange={setTransactionDate}
                  placeholder="Pilih tanggal transaksi"
                  className="h-11 bg-white border-slate-300"
                />
              </div>

              {/* Ditujukan Kepada */}
              <div>
                <label className="block text-[11px] font-bold text-slate-700 uppercase tracking-wider mb-1.5">
                  Ditujukan Kepada
                </label>
                <Input
                  disabled
                  value={`Owner (${tenant?.business_name || 'Juragan by Anak Bawang'})`}
                  className="h-11 text-xs font-medium bg-slate-100 text-slate-600 cursor-not-allowed"
                />
              </div>
            </div>
          </div>

          {/* Section 2: Status Pembayaran & Sumber Dana */}
          <div className="bg-[#F8FAFC] rounded-2xl p-4 sm:p-5 border border-slate-200 space-y-4">
            <div className="flex items-center gap-2 text-xs font-black text-slate-900 uppercase tracking-wider">
              <DollarSign size={15} className="text-[#059669]" />
              <span>2. Status Pelunasan & Sumber Dana</span>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
              <button
                type="button"
                onClick={() => setPaymentStatus('lunas')}
                className={cn(
                  "p-3 rounded-xl border text-left flex flex-col justify-between transition-all cursor-pointer",
                  paymentStatus === 'lunas'
                    ? "bg-emerald-50 border-emerald-300 ring-2 ring-emerald-500/20"
                    : "bg-white border-slate-200 hover:border-slate-300"
                )}
              >
                <div className="flex items-center justify-between mb-1">
                  <span className="text-xs font-black text-emerald-800 uppercase">Lunas (Paid)</span>
                  <CheckCircle2 size={16} className={paymentStatus === 'lunas' ? "text-emerald-600" : "text-slate-300"} />
                </div>
                <p className="text-[10px] text-slate-500">Dibayar penuh saat pengambilan</p>
              </button>

              <button
                type="button"
                onClick={() => setPaymentStatus('tempo')}
                className={cn(
                  "p-3 rounded-xl border text-left flex flex-col justify-between transition-all cursor-pointer",
                  paymentStatus === 'tempo'
                    ? "bg-rose-50 border-rose-300 ring-2 ring-rose-500/20"
                    : "bg-white border-slate-200 hover:border-slate-300"
                )}
              >
                <div className="flex items-center justify-between mb-1">
                  <span className="text-xs font-black text-rose-800 uppercase">Tempo / Hutang</span>
                  <Clock size={16} className={paymentStatus === 'tempo' ? "text-rose-600" : "text-slate-300"} />
                </div>
                <p className="text-[10px] text-slate-500">Bayar nanti saat jatuh tempo</p>
              </button>

              <button
                type="button"
                onClick={() => setPaymentStatus('sebagian')}
                className={cn(
                  "p-3 rounded-xl border text-left flex flex-col justify-between transition-all cursor-pointer",
                  paymentStatus === 'sebagian'
                    ? "bg-blue-50 border-blue-300 ring-2 ring-blue-500/20"
                    : "bg-white border-slate-200 hover:border-slate-300"
                )}
              >
                <div className="flex items-center justify-between mb-1">
                  <span className="text-xs font-black text-blue-800 uppercase">Sebagian (DP)</span>
                  <AlertCircle size={16} className={paymentStatus === 'sebagian' ? "text-blue-600" : "text-slate-300"} />
                </div>
                <p className="text-[10px] text-slate-500">Uang muka, sisa tempo</p>
              </button>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 pt-2">
              {/* Sumber Dana */}
              <div>
                <label className="block text-[11px] font-bold text-slate-700 uppercase tracking-wider mb-1.5">
                  Sumber Dana / Metode Pelunasan
                </label>
                <Select value={paymentMethod} onValueChange={setPaymentMethod}>
                  <SelectTrigger className="h-11 bg-white border-slate-300 font-bold text-xs text-slate-900">
                    <SelectValue placeholder="Pilih sumber dana pembayaran" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="Dana Pribadi Owner (Sdr. Fahru)">
                      <div className="flex items-center gap-2">
                        <span className="text-emerald-600 font-bold">👤</span>
                        <span>Dana Pribadi Owner (Sdr. Fahru) — Modal Disetor</span>
                      </div>
                    </SelectItem>
                    <SelectItem value="Transfer Bank BCA">
                      <div className="flex items-center gap-2">
                        <span className="text-blue-600 font-bold">💳</span>
                        <span>Transfer Rekening Bank BCA</span>
                      </div>
                    </SelectItem>
                    <SelectItem value="Transfer Bank Mandiri / BRI">
                      <div className="flex items-center gap-2">
                        <span className="text-indigo-600 font-bold">🏦</span>
                        <span>Transfer Bank Mandiri / BRI</span>
                      </div>
                    </SelectItem>
                    <SelectItem value="Kas Operasional Juragan">
                      <div className="flex items-center gap-2">
                        <span className="text-amber-600 font-bold">💵</span>
                        <span>Kas Operasional Juragan (Cash Toko)</span>
                      </div>
                    </SelectItem>
                    <SelectItem value="Tunai / COD Pabrik">
                      <div className="flex items-center gap-2">
                        <span className="text-slate-600 font-bold">🤝</span>
                        <span>Tunai / COD Pabrik</span>
                      </div>
                    </SelectItem>
                  </SelectContent>
                </Select>
                <p className="text-[10px] text-slate-500 mt-1">
                  {paymentMethod.includes('Dana Pribadi')
                    ? '💡 Dicatat sebagai setoran modal owner tanpa menggerus kas operasional toko'
                    : '💡 Mengurangi kas likuid operasional'}
                </p>
              </div>

              {/* Tanggal Jatuh Tempo (if tempo/sebagian) */}
              {paymentStatus !== 'lunas' && (
                <div>
                  <label className="block text-[11px] font-bold text-slate-700 uppercase tracking-wider mb-1.5">
                    Tanggal Jatuh Tempo Pelunasan
                  </label>
                  <DatePicker
                    value={dueDate}
                    onChange={setDueDate}
                    placeholder="Pilih tanggal jatuh tempo"
                    className="h-11 bg-white border-slate-300"
                  />
                </div>
              )}

              {/* Input DP jika sebagian */}
              {paymentStatus === 'sebagian' && (
                <div>
                  <label className="block text-[11px] font-bold text-slate-700 uppercase tracking-wider mb-1.5">
                    Nominal Uang Muka / DP Dibayar (Rp) *
                  </label>
                  <div className="relative">
                    <span className="absolute left-3 top-1/2 -translate-y-1/2 text-xs font-bold text-slate-400 select-none pointer-events-none">
                      Rp
                    </span>
                    <Input
                      type="text"
                      inputMode="numeric"
                      value={formatNumberIdr(paidAmount)}
                      onChange={(e) => setPaidAmount(e.target.value.replace(/\D/g, ''))}
                      placeholder="0"
                      className="h-11 pl-9 text-xs font-mono font-bold bg-white text-slate-900 border-slate-300 focus:border-[#0EA5E9] focus:ring-2 focus:ring-[#0EA5E9]/20 transition-all"
                    />
                  </div>
                  <p className="text-[10px] text-slate-500 mt-1">
                    Sisa hutang akan otomatis: {formatIDR(remainingDebt)}
                  </p>
                </div>
              )}
            </div>
          </div>

          {/* Section 3: Multi-Item Table (Bawang, Pouch, Stiker, dsb.) */}
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2 text-xs font-black text-slate-900 uppercase tracking-wider">
                <Package size={15} className="text-[#0EA5E9]" />
                <span>3. Rincian Barang Pembelian (Multi-Item)</span>
              </div>
              <Button
                type="button"
                size="sm"
                onClick={handleAddItem}
                className="h-9 px-3 rounded-xl bg-[#0F172A] hover:bg-slate-800 text-white text-xs font-bold gap-1.5 cursor-pointer"
              >
                <Plus size={14} />
                <span>Tambah Baris Item</span>
              </Button>
            </div>

            <div className="space-y-3">
              {items.map((item, idx) => (
                <div
                  key={idx}
                  className="bg-white border border-slate-200 rounded-2xl p-4 shadow-xs space-y-3 relative group"
                >
                  <div className="flex items-center justify-between border-b border-slate-100 pb-2">
                    <div className="flex items-center gap-2">
                      <span className="w-6 h-6 rounded-lg bg-slate-100 text-slate-700 text-xs font-black flex items-center justify-center">
                        {idx + 1}
                      </span>
                      <span className="text-xs font-bold text-slate-800">
                        {item.product_name || 'Barang Baru'}
                      </span>
                    </div>

                    <div className="flex items-center gap-2">
                      {/* Sticker A3+ Sheet Calculator Toggle */}
                      {(item.category === 'sticker_depan' || item.category === 'sticker_belakang') && (
                        <button
                          type="button"
                          onClick={() => handleItemChange(idx, 'isStickerMode', !item.isStickerMode)}
                          className={cn(
                            "text-[10px] font-black px-2.5 py-1 rounded-lg border transition-all flex items-center gap-1",
                            item.isStickerMode
                              ? "bg-amber-50 text-amber-800 border-amber-300"
                              : "bg-slate-50 text-slate-600 border-slate-200 hover:bg-slate-100"
                          )}
                        >
                          <Calculator size={12} />
                          <span>Kalkulator Lembar A3+</span>
                        </button>
                      )}

                      {items.length > 1 && (
                        <button
                          type="button"
                          onClick={() => handleRemoveItem(idx)}
                          className="w-7 h-7 rounded-lg text-rose-500 hover:bg-rose-50 flex items-center justify-center transition-colors cursor-pointer"
                          title="Hapus Baris Ini"
                        >
                          <Trash2 size={14} />
                        </button>
                      )}
                    </div>
                  </div>

                  {/* Item Selectors Grid */}
                  <div className="grid grid-cols-1 sm:grid-cols-12 gap-3 items-start">
                    {/* Category Selector */}
                    <div className="sm:col-span-4">
                      <label className="block text-[10px] font-bold text-slate-500 uppercase tracking-wider mb-1">
                        Kategori Barang
                      </label>
                      <Select
                        value={item.category}
                        onValueChange={(val) => handleItemChange(idx, 'category', val)}
                      >
                        <SelectTrigger className="h-10 bg-slate-50 border-slate-200 text-xs font-bold text-slate-800">
                          <SelectValue placeholder="Pilih Kategori" />
                        </SelectTrigger>
                        <SelectContent>
                          {ITEM_CATEGORIES.map(cat => (
                            <SelectItem key={cat.id} value={cat.id}>
                              {cat.label}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>

                    {/* Specific Item Picker */}
                    <div className="sm:col-span-8">
                      <label className="block text-[10px] font-bold text-slate-500 uppercase tracking-wider mb-1">
                        Nama Produk / Varian *
                      </label>
                      {item.category === 'bawang_sku' ? (
                        <Select
                          value={item.item_id || ''}
                          onValueChange={(val) => handleItemChange(idx, 'sku_pick', val)}
                        >
                          <SelectTrigger className="h-10 bg-white border-slate-300 font-bold text-xs text-slate-900">
                            <SelectValue placeholder="Pilih varian SKU produk..." />
                          </SelectTrigger>
                          <SelectContent>
                            {products.map(p => (
                              <SelectItem key={p.id} value={p.id}>
                                <div className="flex items-center justify-between gap-3 w-full">
                                  <span>{p.product_name} ({p.unit || 'kg'})</span>
                                  <span className="text-[10px] font-mono text-slate-400">
                                    HPP: {formatIDR(p.avg_buy_price || 0)}
                                  </span>
                                </div>
                              </SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                      ) : ['bawang_curah', 'kemasan', 'sticker_depan', 'sticker_belakang', 'kardus', 'polymailer', 'bubblewrap_safety'].includes(item.category) ? (
                        (() => {
                          const filtered = rawMaterials.filter(r => {
                            if (item.category === 'kemasan') return r.category === 'pouch' || r.category === 'kemasan' || r.material_name.toLowerCase().includes('pouch')
                            if (item.category === 'bawang_curah') return r.category === 'bawang_mentah' || r.category === 'bawang_curah' || r.category === 'bahan_baku'
                            if (item.category === 'sticker_depan') return r.category === 'sticker_depan' || r.material_name.toLowerCase().includes('depan')
                            if (item.category === 'sticker_belakang') return r.category === 'sticker_belakang' || r.material_name.toLowerCase().includes('belakang')
                            if (item.category === 'kardus') return r.category === 'kardus' || r.category === 'box'
                            if (item.category === 'polymailer') return (r.category || '').toLowerCase() === 'polymailer' || (r.category || '').toLowerCase() === 'packing' || (r.material_name || '').toLowerCase().includes('polymailer') || (r.material_name || '').toLowerCase().includes('plastik')
                            if (item.category === 'bubblewrap_safety') return (r.category || '').toLowerCase().includes('bubble') || (r.material_name || '').toLowerCase().includes('bubble') || (r.material_name || '').toLowerCase().includes('lakban')
                            return true
                          })

                          if (filtered.length > 0 && item.item_id !== '__custom__') {
                            return (
                              <Select
                                value={item.item_id || ''}
                                onValueChange={(val) => {
                                  if (val === '__custom__') {
                                    handleItemChange(idx, 'item_id', '__custom__')
                                    if (!item.product_name) {
                                      handleItemChange(idx, 'product_name', item.category === 'polymailer' ? 'Plastik Polymailer Ekspedisi' : '')
                                    }
                                  } else {
                                    handleItemChange(idx, 'raw_pick', val)
                                  }
                                }}
                              >
                                <SelectTrigger className="h-10 bg-white border-slate-300 font-bold text-xs text-slate-900">
                                  <SelectValue placeholder={`Pilih ${item.category === 'polymailer' ? 'polymailer' : 'bahan'}...`} />
                                </SelectTrigger>
                                <SelectContent>
                                  {filtered.map(r => (
                                    <SelectItem key={r.id} value={r.id}>
                                      <div className="flex items-center justify-between gap-3 w-full">
                                        <span>{r.material_name} ({r.unit || 'pcs'})</span>
                                        <span className="text-[10px] font-bold px-1.5 py-0.5 rounded bg-slate-100 text-slate-600">
                                          Stok: {r.current_stock}
                                        </span>
                                      </div>
                                    </SelectItem>
                                  ))}
                                  <SelectItem value="__custom__">
                                    + Input Manual / Tulis Nama Sendiri
                                  </SelectItem>
                                </SelectContent>
                              </Select>
                            )
                          }

                          return (
                            <div className="flex gap-1.5">
                              <Input
                                placeholder={item.category === 'polymailer' ? 'Contoh: Plastik Polymailer 20x30 cm...' : 'Masukkan nama bahan / kemasan...'}
                                value={item.product_name}
                                onChange={(e) => handleItemChange(idx, 'product_name', e.target.value)}
                                className="h-10 text-xs font-bold bg-white flex-1"
                              />
                              {filtered.length > 0 && (
                                <button
                                  type="button"
                                  onClick={() => handleItemChange(idx, 'item_id', filtered[0].id)}
                                  className="px-2.5 py-1 text-[10px] font-bold bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-lg shrink-0"
                                  title="Pilih dari daftar bahan yang sudah ada"
                                >
                                  Daftar
                                </button>
                              )}
                            </div>
                          )
                        })()
                      ) : (
                        <Input
                          placeholder="Masukkan nama barang / biaya..."
                          value={item.product_name}
                          onChange={(e) => handleItemChange(idx, 'product_name', e.target.value)}
                          className="h-10 text-xs font-bold"
                        />
                      )}
                    </div>
                  </div>

                  {/* Sticker A3+ Sheet Calculator Panel */}
                  {item.isStickerMode && (
                    <div className="bg-amber-50/70 border border-amber-200/80 rounded-xl p-3 space-y-2 text-xs">
                      <div className="flex items-center gap-1.5 font-bold text-amber-900 text-[11px]">
                        <Calculator size={13} className="text-amber-700" />
                        <span>Kalkulator Cetak Lembar A3+ & Cutting (Sampoerna)</span>
                      </div>
                      <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
                        <div>
                          <label className="text-[10px] text-slate-600 block mb-1">Jumlah Lembar A3+</label>
                          <Input
                            type="text"
                            inputMode="numeric"
                            placeholder="Misal: 10"
                            value={item.sheetCount}
                            onChange={(e) => handleStickerMathChange(idx, { sheetCount: e.target.value.replace(/\D/g, '') })}
                            className="h-8 text-xs font-bold bg-white"
                          />
                        </div>
                        <div>
                          <label className="text-[10px] text-slate-600 block mb-1">Isi Pcs / Lembar</label>
                          <Input
                            type="text"
                            inputMode="numeric"
                            placeholder="12"
                            value={item.cutsPerSheet}
                            onChange={(e) => handleStickerMathChange(idx, { cutsPerSheet: e.target.value.replace(/\D/g, '') })}
                            className="h-8 text-xs font-bold bg-white"
                          />
                        </div>
                        <div>
                          <label className="text-[10px] text-slate-600 block mb-1">Biaya Cetak / Lbr</label>
                          <div className="relative">
                            <span className="absolute left-2.5 top-1/2 -translate-y-1/2 text-[10px] font-bold text-slate-400 select-none pointer-events-none">Rp</span>
                            <Input
                              type="text"
                              inputMode="numeric"
                              value={formatNumberIdr(item.printCostPerSheet)}
                              onChange={(e) => handleStickerMathChange(idx, { printCostPerSheet: e.target.value.replace(/\D/g, '') })}
                              placeholder="6.500"
                              className="h-8 pl-7 text-xs font-mono font-bold bg-white text-slate-900"
                            />
                          </div>
                        </div>
                        <div>
                          <label className="text-[10px] text-slate-600 block mb-1">Jasa Cutting / Lbr</label>
                          <div className="relative">
                            <span className="absolute left-2.5 top-1/2 -translate-y-1/2 text-[10px] font-bold text-slate-400 select-none pointer-events-none">Rp</span>
                            <Input
                              type="text"
                              inputMode="numeric"
                              value={formatNumberIdr(item.cuttingCostPerSheet)}
                              onChange={(e) => handleStickerMathChange(idx, { cuttingCostPerSheet: e.target.value.replace(/\D/g, '') })}
                              placeholder="6.500"
                              className="h-8 pl-7 text-xs font-mono font-bold bg-white text-slate-900"
                            />
                          </div>
                        </div>
                      </div>
                      <p className="text-[10px] text-amber-800 font-medium">
                        💡 Otomatis menghasilkan <strong>{item.quantity || 0} pcs</strong> dengan HPP <strong>{formatIDR(item.unit_price || 0)}/pcs</strong> dan Subtotal <strong>{formatIDR(item.subtotal || 0)}</strong>
                      </p>
                    </div>
                  )}

                  {/* Quantities & Price Grid */}
                  <div className="grid grid-cols-1 sm:grid-cols-12 gap-3 items-center">
                    {/* Quantity */}
                    <div className="sm:col-span-2">
                      <label className="block text-[10px] font-bold text-slate-500 uppercase tracking-wider mb-1">
                        Kuantitas *
                      </label>
                      <Input
                        type="text"
                        inputMode="decimal"
                        value={item.quantity}
                        onChange={(e) => handleItemChange(idx, 'quantity', e.target.value)}
                        placeholder="1"
                        className="h-10 text-xs font-bold bg-white"
                      />
                    </div>

                    {/* Unit */}
                    <div className="sm:col-span-2">
                      <label className="block text-[10px] font-bold text-slate-500 uppercase tracking-wider mb-1">
                        Satuan
                      </label>
                      <Input
                        value={item.unit}
                        onChange={(e) => handleItemChange(idx, 'unit', e.target.value)}
                        className="h-10 text-xs font-bold bg-white"
                      />
                    </div>

                    {/* Unit Price */}
                    <div className="sm:col-span-4">
                      <label className="block text-[10px] font-bold text-slate-500 uppercase tracking-wider mb-1">
                        Harga Satuan Pabrik (Rp) *
                      </label>
                      <div className="relative">
                        <span className="absolute left-3 top-1/2 -translate-y-1/2 text-xs font-bold text-slate-400 select-none pointer-events-none">
                          Rp
                        </span>
                        <Input
                          type="text"
                          inputMode="numeric"
                          value={formatNumberIdr(item.unit_price)}
                          onChange={(e) => {
                            const raw = e.target.value.replace(/\D/g, '')
                            handleItemChange(idx, 'unit_price', raw)
                          }}
                          placeholder="0"
                          className="h-10 pl-9 text-xs font-mono font-bold bg-white text-slate-900 border-slate-300 focus:border-[#0EA5E9] focus:ring-2 focus:ring-[#0EA5E9]/20 transition-all"
                        />
                      </div>
                    </div>

                    {/* Subtotal / Total Tagihan Item */}
                    <div className="sm:col-span-4">
                      <div className="flex items-center justify-between mb-1">
                        <label className="block text-[10px] font-bold text-slate-700 uppercase tracking-wider">
                          Total Tagihan Item (Rp) *
                        </label>
                        <span className="text-[9px] font-extrabold text-emerald-600 bg-emerald-50 px-1.5 py-0.5 rounded border border-emerald-200">
                          Bisa Langsung Isi
                        </span>
                      </div>
                      <div className="relative">
                        <span className="absolute left-3 top-1/2 -translate-y-1/2 text-xs font-bold text-slate-400 select-none pointer-events-none">
                          Rp
                        </span>
                        <Input
                          type="text"
                          inputMode="numeric"
                          value={formatNumberIdr(item.subtotal)}
                          onChange={(e) => {
                            const raw = e.target.value.replace(/\D/g, '')
                            handleItemChange(idx, 'subtotal', raw)
                          }}
                          placeholder="0"
                          className="h-10 pl-9 text-xs font-mono font-black bg-emerald-50/40 text-[#0F766E] border-emerald-300 focus:border-[#0EA5E9] focus:ring-2 focus:ring-[#0EA5E9]/20 transition-all"
                        />
                      </div>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Section 4: Catatan Pembayaran & Operasional */}
          <div className="bg-[#F8FAFC] rounded-2xl p-4 sm:p-5 border border-slate-200 space-y-2">
            <label className="block text-xs font-black text-slate-900 uppercase tracking-wider">
              4. Catatan Pembayaran & Operasional
            </label>
            <Textarea
              rows={3}
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              placeholder="Catatan pengambilan stok, pelunasan modal HPP, dsb."
              className="text-xs bg-white resize-none"
            />
          </div>

          {/* Section 5: Total Summary Highlight */}
          <div className="bg-[#E0F2FE] border border-[#BAE6FD] rounded-2xl p-4 sm:p-5 flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
            <div>
              <p className="text-[10px] font-black uppercase tracking-wider text-slate-700">
                Total Akumulasi Barang
              </p>
              <p className="text-base font-black text-slate-900">
                {items.length} Macam Barang ({totalQuantity.toLocaleString('id-ID')} Total Kuantitas)
              </p>
              <p className="text-[11px] text-slate-500 font-medium mt-0.5">
                {items.length === 1
                  ? '💡 Masukkan langsung total tagihan di field samping atau di rincian barang'
                  : '💡 Akumulasi total otomatis dari seluruh rincian barang'}
              </p>
            </div>

            <div className="w-full sm:w-auto sm:text-right">
              <label className="block text-[10px] font-black uppercase tracking-wider text-slate-700 mb-1">
                Total Tagihan Pabrik (Rp) *
              </label>
              <div className="relative inline-block w-full sm:w-64">
                <span className="absolute left-3.5 top-1/2 -translate-y-1/2 text-sm font-bold text-slate-400 select-none pointer-events-none">
                  Rp
                </span>
                <Input
                  type="text"
                  inputMode="numeric"
                  value={formatNumberIdr(totalAmount)}
                  onChange={(e) => {
                    const raw = e.target.value.replace(/\D/g, '')
                    handleTotalAmountChange(raw)
                  }}
                  placeholder="0"
                  className="h-12 pl-10 pr-4 text-lg sm:text-xl font-black text-[#0F766E] font-mono bg-white border-sky-300 focus:border-[#0EA5E9] focus:ring-2 focus:ring-[#0EA5E9]/20 shadow-xs"
                />
              </div>
              {paymentStatus !== 'lunas' && (
                <p className="text-xs font-bold text-rose-600 mt-1">
                  Sisa Hutang: {formatIDR(remainingDebt)}
                </p>
              )}
            </div>
          </div>

          {/* ── Action Buttons ── */}
          <div className="pt-2 flex items-center justify-end gap-3 sticky bottom-0 bg-white/95 backdrop-blur-sm py-3 border-t border-slate-200 -mx-6 px-6 z-20">
            <Button
              type="button"
              variant="outline"
              onClick={() => {
                if (!editInvoice) {
                  toast.info('Draf formulir pembelian tersimpan di browser Anda.')
                }
                onOpenChange(false)
              }}
              className="h-11 px-5 rounded-xl font-bold text-xs cursor-pointer"
            >
              Batal
            </Button>

            <Button
              type="submit"
              disabled={isSubmitting}
              className="h-11 px-6 rounded-xl bg-[#0F172A] hover:bg-slate-800 text-white font-black text-xs uppercase tracking-wider gap-2 shadow-lg cursor-pointer"
            >
              {isSubmitting ? (
                <span>Menyimpan & Menyesuaikan Stok...</span>
              ) : (
                <>
                  <CheckCircle2 size={16} />
                  <span>{editInvoice ? 'Simpan Perubahan Faktur' : 'Simpan & Terbitkan Faktur'}</span>
                </>
              )}
            </Button>
          </div>

        </form>
      </div>
    </div>
  )
}
