import React, { useState } from 'react'
import { X, Plus, ChevronDown, ChevronUp, Package, Tag, Calendar, AlertCircle, Check } from 'lucide-react'
import { motion, AnimatePresence } from 'framer-motion'
import { toast } from 'sonner'
import { 
  useAddStockBatch, 
  useCreateSembakoSupplier, 
  useUpdateSembakoProduct,
  useCreateSembakoProduct,
  useSembakoAllBatches
} from '@/lib/hooks/useSembakoData'
import { DatePicker } from '@/components/ui/DatePicker'
import { C, CustomSelect, InputRupiah, UniversalMultiUnitCalculator } from './sembakoSaleUtils'
import { useAuth } from '@/lib/hooks/useAuth'
import { recordAuditLog } from '@/lib/hooks/useSembakoAudit'
import { useBackHandler } from '@/lib/hooks/useBackHandler'
import { useMediaQuery } from '@/lib/hooks/useMediaQuery'
import {
  getSupplierRecommendation,
  getSupplierHistoryContext,
  checkSupplierAnomalies
} from '@/lib/hooks/sembako/sembakoSupplierAssistant'

const TEXT_SEC = '#64748B'

const fmt = (n) => new Intl.NumberFormat('id-ID').format(Math.round(n || 0))

const getFactor = (u) => {
  if (u === 'karton' || u === 'bal besar') return 40
  if (u === 'dus' || u === 'box') return 20
  if (u === 'lusin' || u === 'renceng') return 12
  if (u === 'bal kecil' || u === 'pak' || u === 'slop' || u === 'strip') return 10
  return 1
}

const UNIVERSAL_PACKAGING_OPTIONS = [
  { value: 'pcs', label: 'Pcs / Biji / Satuan Utama' },
  { value: 'pak', label: 'Pak / Strip (10 unit)' },
  { value: 'lusin', label: 'Lusin / Renceng (12 unit)' },
  { value: 'dus', label: 'Dus / Box (20 unit)' },
  { value: 'karton', label: 'Karton / Bal (40 unit)' },
]

function genBatchCode() {
  const now = new Date()
  const d = now.toISOString().slice(0, 10).replace(/-/g, '')
  const ms  = now.getTime().toString(36).slice(-3).toUpperCase()
  const r   = Math.random().toString(36).slice(2, 5).toUpperCase()
  return `BATCH-${d}-${ms}${r}`
}

const inputSt = {
  width: '100%',
  height: 48,
  background: '#F8FAFC',
  border: `1px solid #E2E8F0`,
  borderRadius: 12,
  padding: '0 14px',
  color: '#0F172A',
  fontFamily: 'DM Sans',
  fontSize: 14,
  fontWeight: 600,
  outline: 'none',
}

const SField = ({ label, children }) => (
  <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
    <label style={{ fontFamily: 'DM Sans', fontSize: 11, fontWeight: 800, color: '#64748B', textTransform: 'uppercase', letterSpacing: '0.06em' }}>{label}</label>
    {children}
  </div>
)

export function SembakoTambahStokSheet({ preselectedProductId, products = [], suppliers = [], onClose }) {
  useBackHandler(true, onClose)
  const isDesktop = useMediaQuery('(min-width: 768px)')
  const addBatch  = useAddStockBatch()
  const createSup = useCreateSembakoSupplier()
  const createProd = useCreateSembakoProduct()
  const { data: allBatches = [] } = useSembakoAllBatches()

  const [form, setForm] = useState({
    product_id:    preselectedProductId || '',
    supplier_id:   '',
    selectedUnit:  '',
    priceMode:     'per_base',
    qty_masuk:     '',
    buy_price:     '',
    sell_price:    '',
    purchase_date: new Date().toISOString().slice(0, 10),
    expiry_date:   '',
    notes:         '',
    batch_code:    genBatchCode(),
  })
  const [newSupplier, setNewSupplier] = useState('')
  const [showAddSup,  setShowAddSup]  = useState(false)
  const [showAdvanced, setShowAdvanced] = useState(false)
  const [showAddProd, setShowAddProd] = useState(false)
  const [newProdName, setNewProdName] = useState('')
  const [newProdUnit, setNewProdUnit] = useState('pcs')
  const [isUnitDropdownOpen, setIsUnitDropdownOpen] = useState(false)
  const updateProduct = useUpdateSembakoProduct()

  const selectedProduct = products.find(p => p.id === form.product_id)
  const baseUnit = selectedProduct?.unit || 'pcs'
  const currentFactor = getFactor(form.selectedUnit || baseUnit)
  const isMultiUnitPackaging = currentFactor > 1
  const priceMode = form.priceMode || 'per_base' // 'per_base' | 'per_kemasan'

  const inputBuyPrice = Number(String(form.buy_price).replace(/\D/g, ''))
  const inputSellPrice = Number(String(form.sell_price).replace(/\D/g, ''))

  // Effective per-base unit prices for calculation and DB storage
  const effectiveBuyPricePerBase = isMultiUnitPackaging
    ? (priceMode === 'per_kemasan' ? (inputBuyPrice > 0 ? Math.round(inputBuyPrice / currentFactor) : 0) : inputBuyPrice)
    : inputBuyPrice

  const effectiveSellPricePerBase = isMultiUnitPackaging
    ? (priceMode === 'per_kemasan' ? (inputSellPrice > 0 ? Math.round(inputSellPrice / currentFactor) : 0) : inputSellPrice)
    : inputSellPrice

  // Total purchase value
  const totalPurchaseValue = isMultiUnitPackaging
    ? (priceMode === 'per_kemasan'
        ? Number(form.qty_masuk || 0) * inputBuyPrice
        : Number(form.qty_masuk || 0) * currentFactor * inputBuyPrice)
    : Number(form.qty_masuk || 0) * inputBuyPrice

  // 1. Get recommendation for the selected product
  const recommendation = React.useMemo(() => {
    return getSupplierRecommendation(form.product_id, allBatches, suppliers)
  }, [form.product_id, allBatches, suppliers])

  // 2. Get history context for the selected supplier (always compared on base unit)
  const historyContext = React.useMemo(() => {
    return getSupplierHistoryContext(form.product_id, form.supplier_id, allBatches)
  }, [form.product_id, form.supplier_id, allBatches])

  // 3. Get anomalies based on effective per-base price
  const anomalies = React.useMemo(() => {
    return checkSupplierAnomalies(form.product_id, form.supplier_id, effectiveBuyPricePerBase, allBatches, suppliers)
  }, [form.product_id, form.supplier_id, effectiveBuyPricePerBase, allBatches, suppliers])

  const showPriceTrend = !!(form.supplier_id && historyContext && effectiveBuyPricePerBase > 0 && effectiveBuyPricePerBase !== historyContext.lastPrice)
  const priceDiff = effectiveBuyPricePerBase - (historyContext?.lastPrice || 0)
  const priceDiffPct = (historyContext?.lastPrice || 0) > 0 ? Math.round((priceDiff / (historyContext?.lastPrice || 1)) * 100) : 0
  const isUp = priceDiff > 0

  const handleAddProduct = async () => {
    if (!newProdName.trim()) return toast.error('Nama produk wajib diisi')
    try {
      const p = await createProd.mutateAsync({
        product_name: newProdName.trim(),
        category: 'lainnya',
        unit: newProdUnit,
        current_stock: 0,
        avg_buy_price: 0,
        sell_price: 0,
        is_active: true,
      })
      if (p?.id) set('product_id', p.id)
      setNewProdName('')
      setShowAddProd(false)
      toast.success('Produk berhasil ditambahkan!')
    } catch { /* handled by hook */ }
  }

  const set = (key, val) => {
    if (key === 'priceMode') {
      const prevMode = form.priceMode || 'per_base'
      const newMode = val
      const factor = currentFactor
      const curBuy = Number(String(form.buy_price || '').replace(/\D/g, ''))
      const curSell = Number(String(form.sell_price || '').replace(/\D/g, ''))

      let newBuy = form.buy_price
      let newSell = form.sell_price

      if (factor > 1) {
        if (prevMode === 'per_base' && newMode === 'per_kemasan') {
          if (curBuy > 0) newBuy = String(curBuy * factor)
          if (curSell > 0) newSell = String(curSell * factor)
        } else if (prevMode === 'per_kemasan' && newMode === 'per_base') {
          if (curBuy > 0) newBuy = String(Math.round(curBuy / factor))
          if (curSell > 0) newSell = String(Math.round(curSell / factor))
        }
      }

      setForm(f => ({ ...f, priceMode: newMode, buy_price: newBuy, sell_price: newSell }))
      return
    }

    if (key === 'selectedUnit') {
      const prevUnit = form.selectedUnit || baseUnit
      const newUnit = val
      const prevFactor = getFactor(prevUnit)
      const newFactor = getFactor(newUnit)
      const mode = form.priceMode || 'per_base'

      const curQty = Number(form.qty_masuk || 0)
      const baseQty = curQty * prevFactor
      const newQty = newFactor > 0 ? (baseQty / newFactor) : baseQty

      let newBuy = form.buy_price
      let newSell = form.sell_price
      if (mode === 'per_kemasan') {
        const curBuy = Number(String(form.buy_price || '').replace(/\D/g, ''))
        const curSell = Number(String(form.sell_price || '').replace(/\D/g, ''))
        if (curBuy > 0) newBuy = String(prevFactor > 0 ? Math.round((curBuy / prevFactor) * newFactor) : curBuy * newFactor)
        if (curSell > 0) newSell = String(prevFactor > 0 ? Math.round((curSell / prevFactor) * newFactor) : curSell * newFactor)
      }

      setForm(f => ({
        ...f,
        selectedUnit: newUnit,
        qty_masuk: curQty > 0 ? String(newQty) : f.qty_masuk,
        buy_price: newBuy,
        sell_price: newSell
      }))
      return
    }

    if (key === 'product_id') {
      const p = products.find(x => x.id === val)
      setForm(f => ({
        ...f,
        product_id: val,
        selectedUnit: p?.unit || 'pcs',
        priceMode: 'per_base',
        buy_price: p?.avg_buy_price ? String(p.avg_buy_price) : '',
        sell_price: p?.sell_price ? String(p.sell_price) : '',
      }))
      return
    }

    setForm(f => ({ ...f, [key]: val }))
  }

  const handleAddSupplier = async () => {
    if (!newSupplier.trim()) return
    try {
      const sup = await createSup.mutateAsync({ supplier_name: newSupplier.trim() })
      set('supplier_id', sup.id)
      setNewSupplier('')
      setShowAddSup(false)
    } catch { /* ignore */ }
  }

  const DRAFT_STOCK_IN_KEY = 'sembako_stock_in_wizard_draft'

  React.useEffect(() => {
    try {
      const saved = localStorage.getItem(DRAFT_STOCK_IN_KEY)
      if (saved) {
        const parsed = JSON.parse(saved)
        const validProd = products.some(p => p.id === parsed.product_id) ? parsed.product_id : (preselectedProductId || '')
        const validSup = suppliers.some(s => s.id === parsed.supplier_id) ? parsed.supplier_id : ''
        setForm(f => ({
          ...f,
          ...parsed,
          product_id: validProd,
          supplier_id: validSup,
          batch_code: parsed.batch_code || f.batch_code
        }))
      }
    } catch { /* ok */ }
  }, [products, suppliers, preselectedProductId])

  React.useEffect(() => {
    if (form.product_id || form.qty_masuk || form.buy_price) {
      localStorage.setItem(DRAFT_STOCK_IN_KEY, JSON.stringify(form))
    }
  }, [form])

  const clearStockInDraft = () => {
    localStorage.removeItem(DRAFT_STOCK_IN_KEY)
    setForm({
      product_id: preselectedProductId || '',
      supplier_id: '',
      selectedUnit: '',
      priceMode: 'per_base',
      qty_masuk: '',
      buy_price: '',
      sell_price: '',
      purchase_date: new Date().toISOString().slice(0, 10),
      expiry_date: '',
      notes: '',
      batch_code: genBatchCode(),
    })
  }

  const handleCancelReset = () => {
    clearStockInDraft()
    toast.success('Draft stok masuk telah dibersihkan')
    onClose()
  }

  const { profile } = useAuth()
  const handleSubmit = async (e) => {
    e.preventDefault()
    if (!form.product_id) return toast.error('Pilih produk dulu')
    if (!form.supplier_id) return toast.error('Pilih supplier dulu')
    
    // Validate supplier existence
    const validSupplier = suppliers.find(s => s.id === form.supplier_id)
    if (!validSupplier) {
      return toast.error('Supplier yang dipilih tidak valid atau sudah tidak ada. Silakan pilih supplier lain.')
    }

    if (!form.qty_masuk || Number(form.qty_masuk) <= 0) return toast.error('Jumlah harus > 0')
    
    if (inputBuyPrice <= 0) return toast.error('Harga beli wajib diisi')

    const factor = getFactor(form.selectedUnit || baseUnit)
    const baseQty = Number(form.qty_masuk) * factor
    const baseBuyPrice = effectiveBuyPricePerBase
    const baseSellPrice = effectiveSellPricePerBase

    const unitNote = factor > 1
      ? `Penerimaan ${form.qty_masuk} ${form.selectedUnit} (@ Rp ${fmt(priceMode === 'per_kemasan' ? inputBuyPrice : inputBuyPrice * factor)} / ${form.selectedUnit} | Rp ${fmt(baseBuyPrice)} / ${baseUnit})`
      : null
    const finalNotes = [form.notes, unitNote].filter(Boolean).join(' - ')

    await addBatch.mutateAsync({
      product_id:    form.product_id,
      supplier_id:   form.supplier_id || null,
      qty_masuk:     baseQty,
      buy_price:     baseBuyPrice,
      purchase_date: form.purchase_date,
      expiry_date:   form.expiry_date || null,
      notes:         finalNotes || null,
      batch_code:    form.batch_code || genBatchCode(),
    })

    if (selectedProduct && baseSellPrice > 0 && baseSellPrice !== selectedProduct.sell_price) {
      await updateProduct.mutateAsync({
        id: form.product_id,
        sell_price: baseSellPrice
      })
    }

    recordAuditLog({
      action_type: 'STOK_MASUK',
      product_name: selectedProduct?.product_name || 'Stok Masuk',
      old_value: selectedProduct?.current_stock || 0,
      new_value: (selectedProduct?.current_stock || 0) + baseQty,
      notes: `Stok Masuk (+${baseQty} ${selectedProduct?.unit || ''}${factor > 1 ? ` [${form.qty_masuk} ${form.selectedUnit}]` : ''})`,
      profile,
    })

    toast.success('Stok masuk berhasil disimpan!')
    clearStockInDraft()
    onClose()
  }

  return (
    <motion.div
      initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
      style={{
        position: 'fixed', inset: 0, zIndex: 5000,
        background: 'rgba(15,23,42,0.4)', backdropFilter: 'blur(8px)',
        display: 'flex',
        alignItems: isDesktop ? 'center' : 'flex-end',
        justifyContent: 'center',
        padding: isDesktop ? '24px' : '0',
      }}
      onClick={onClose}
    >
      <motion.div
        initial={isDesktop ? { scale: 0.95, opacity: 0 } : { y: '100%' }}
        animate={isDesktop ? { scale: 1, opacity: 1 } : { y: 0 }}
        exit={isDesktop ? { scale: 0.95, opacity: 0 } : { y: '100%' }}
        transition={{ type: 'spring', stiffness: 350, damping: 30 }}
        style={{
          background: '#FFFFFF',
          borderRadius: isDesktop ? '24px' : '24px 24px 0 0',
          width: '100%', maxWidth: '560px',
          border: `1px solid ${C.border}`,
          boxShadow: '0 10px 30px rgba(15,23,42,0.08)',
          maxHeight: isDesktop ? '88vh' : 'calc(100dvh - env(safe-area-inset-top, 24px) - 16px)',
          display: 'flex', flexDirection: 'column',
          overflow: 'hidden',
        }}
        onClick={e => e.stopPropagation()}
      >
        {!isDesktop && (
          <div style={{ display: 'flex', justifyContent: 'center', padding: '12px 0 4px', shrink: 0 }}>
            <div style={{ width: 36, height: 4, borderRadius: 2, background: 'rgba(15,23,42,0.1)' }} />
          </div>
        )}

        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '16px 20px', borderBottom: `1px solid ${C.border}`, shrink: 0 }}>
          <div>
            <h2 style={{ fontFamily: 'Sora', fontSize: 18, fontWeight: 800, color: C.text, margin: 0, letterSpacing: '-0.02em' }}>Tambah Stok Masuk</h2>
            <p style={{ fontFamily: 'DM Sans', fontSize: 12, color: '#64748B', opacity: 0.8, margin: '2px 0 0' }}>Input data penerimaan barang / stok baru</p>
          </div>
          <button
            onClick={onClose}
            style={{
              background: 'rgba(15,23,42,0.05)', border: '1px solid rgba(15,23,42,0.08)',
              borderRadius: 12, width: 36, height: 36, display: 'flex', alignItems: 'center', justifyContent: 'center',
              cursor: 'pointer', transition: 'all 0.2s'
            }}
          >
            <X size={18} color="#0F172A" />
          </button>
        </div>

        <form onSubmit={handleSubmit} style={{ flex: 1, overflowY: 'auto', padding: isDesktop ? '20px 24px 24px' : '16px 20px max(40px, calc(24px + env(safe-area-inset-bottom, 24px)))', display: 'flex', flexDirection: 'column', gap: 16 }}>
          {/* Card 1: Informasi Produk & Supplier */}
          <div style={{ background: 'rgba(15,23,42,0.015)', border: `1px solid ${C.border}`, borderRadius: 16, padding: 14, display: 'flex', flexDirection: 'column', gap: 14 }}>
            <SField label="Produk *">
              <AnimatePresence mode="wait">
                {showAddProd ? (
                  <motion.div key="add" initial={{ opacity: 0, y: 6 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: 4 }} style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
                    <div style={{ display: 'flex', gap: 8 }}>
                      <input
                        value={newProdName}
                        onChange={e => setNewProdName(e.target.value)}
                        placeholder="Nama produk baru"
                        style={{ ...inputSt, flex: 1 }}
                        autoFocus
                      />
                      <div style={{ width: 110 }}>
                        <CustomSelect
                          value={newProdUnit}
                          onChange={val => setNewProdUnit(val)}
                          options={['pcs', 'dus', 'karton', 'bal', 'sak', 'karung', 'kg', 'liter', 'pack', 'bungkus', 'renceng', 'lusin', 'ikat', 'kaleng', 'botol', 'slop', 'pres'].map(u => ({ value: u, label: u }))}
                          placeholder="Satuan"
                        />
                      </div>
                    </div>
                    <div style={{ display: 'flex', gap: 8 }}>
                      <button type="button" onClick={handleAddProduct} disabled={createProd.isPending || !newProdName.trim()}
                        style={{ flex: 1, background: C.accent, border: 'none', borderRadius: 10, height: 40, color: 'white', fontFamily: 'DM Sans', fontSize: 13, fontWeight: 700, cursor: 'pointer', opacity: (createProd.isPending || !newProdName.trim()) ? 0.6 : 1 }}>
                        {createProd.isPending ? 'Menyimpan...' : '✓ Simpan Produk'}
                      </button>
                      <button type="button" onClick={() => setShowAddProd(false)} style={{ background: 'transparent', border: `1px solid ${C.border}`, borderRadius: 10, width: 40, height: 40, cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                        <X size={14} color="#6B7280" />
                      </button>
                    </div>
                  </motion.div>
                ) : (
                  <motion.div key="select" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}>
                    <CustomSelect
                      id="stok-product"
                      value={form.product_id}
                      onChange={val => {
                        const p = products.find(x => x.id === val)
                        const lastB = allBatches.find(b => b.product_id === val)
                        setForm(f => ({ 
                          ...f, 
                          product_id: val,
                          buy_price: lastB?.buy_price || p?.avg_buy_price || '',
                          sell_price: p?.sell_price || ''
                        }))
                      }}
                      options={products.map(p => ({ value: p.id, label: `${p.product_name} (${p.unit})` }))}
                      placeholder="-- Pilih produk --"
                      onAddNew={() => setShowAddProd(true)}
                    />
                    {products.length === 0 && (
                      <button type="button" onClick={() => setShowAddProd(true)}
                        style={{ marginTop: 8, width: '100%', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 6, height: 40, borderRadius: 10, background: '#F1F5F9', border: `1px dashed ${C.border}`, color: '#0F172A', fontSize: 13, fontWeight: 700, fontFamily: 'DM Sans', cursor: 'pointer' }}>
                        <Plus size={14} /> Tambah Produk Baru
                      </button>
                    )}
                  </motion.div>
                )}
              </AnimatePresence>
            </SField>

            <SField label="Supplier *">
              {showAddSup ? (
                <div style={{ display: 'flex', gap: 8 }}>
                  <input
                    id="new-supplier" name="new_supplier" type="text"
                    value={newSupplier}
                    onChange={e => setNewSupplier(e.target.value)}
                    placeholder="Nama supplier baru"
                    style={{ ...inputSt, flex: 1 }}
                  />
                  <button type="button" onClick={handleAddSupplier} disabled={createSup.isPending || !newSupplier.trim()}
                    style={{ background: '#0F172A', border: 'none', borderRadius: 10, padding: '0 14px', color: 'white', fontFamily: 'DM Sans', fontSize: 13, cursor: 'pointer' }}>
                    {createSup.isPending ? '...' : 'Tambah'}
                  </button>
                  <button type="button" onClick={() => setShowAddSup(false)} style={{ background: 'transparent', border: 'none', cursor: 'pointer', color: '#6B7280' }}>
                    <X size={16} />
                  </button>
                </div>
              ) : (
                <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
                  <div style={{ display: 'flex', gap: 8 }}>
                    <CustomSelect
                      id="stok-supplier"
                      value={form.supplier_id}
                      onChange={val => {
                        set('supplier_id', val)
                        const ctx = getSupplierHistoryContext(form.product_id, val, allBatches)
                        if (ctx?.lastPrice) {
                          const fillPrice = (form.priceMode === 'per_kemasan' && currentFactor > 1)
                            ? ctx.lastPrice * currentFactor
                            : ctx.lastPrice
                          set('buy_price', String(fillPrice))
                        }
                      }}
                      options={suppliers.map(s => ({ value: s.id, label: s.supplier_name }))}
                      placeholder="-- Pilih supplier --"
                      style={{ flex: 1 }}
                    />
                    <button type="button" onClick={() => setShowAddSup(true)}
                      style={{ background: '#F1F5F9', border: `1px solid ${C.border}`, borderRadius: 10, padding: '0 14px', height: 48, color: '#0F172A', fontSize: 13, fontWeight: 700, fontFamily: 'DM Sans', cursor: 'pointer', flexShrink: 0 }}>
                      + Baru
                    </button>
                  </div>

                  {/* Recommendation Shortcut Badge */}
                  {recommendation && form.supplier_id !== recommendation.supplierId && (
                    <div style={{ display: 'flex', gap: 6, alignItems: 'center', marginTop: 4 }}>
                      <span style={{ fontSize: 11, color: '#64748B', opacity: 0.8, fontFamily: 'DM Sans' }}>
                        💡 Rekomendasi:
                      </span>
                      <button
                        type="button"
                        onClick={() => {
                          set('supplier_id', recommendation.supplierId)
                          if (recommendation.lastPrice) {
                            const fillPrice = (form.priceMode === 'per_kemasan' && currentFactor > 1)
                              ? recommendation.lastPrice * currentFactor
                              : recommendation.lastPrice
                            set('buy_price', String(fillPrice))
                          }
                        }}
                        style={{
                          background: '#F1F5F9',
                          border: '1px solid #E2E8F0',
                          borderRadius: 6,
                          padding: '2px 8px',
                          color: '#475569',
                          fontSize: 10,
                          fontWeight: 800,
                          cursor: 'pointer',
                          fontFamily: 'DM Sans',
                          transition: 'all 0.2s'
                        }}
                      >
                        {recommendation.supplierName} ({recommendation.statusText})
                      </button>
                    </div>
                  )}

                  {/* Selected Supplier Context History Info */}
                  {form.supplier_id && historyContext && (
                    <div style={{ background: '#F8FAFC', border: '1px solid #E2E8F0', borderRadius: 10, padding: '10px 12px', marginTop: 4, display: 'flex', flexDirection: 'column', gap: 4 }}>
                      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', fontSize: 11, fontFamily: 'DM Sans' }}>
                        <span style={{ color: '#475569', fontWeight: 700 }}>Riwayat Supplier ini:</span>
                        <span style={{ color: '#64748B' }}>Terakhir: {new Date(historyContext.recentDate).toLocaleDateString('id-ID', { day: 'numeric', month: 'short', year: '2-digit' })}</span>
                      </div>
                      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 8, fontSize: 10, fontFamily: 'DM Sans', color: '#0F172A', opacity: 0.8 }}>
                        <div>• Transaksi: {historyContext.txCount} kali</div>
                        <div>• Total Beli: {fmt(historyContext.totalQty)} {selectedProduct?.unit || ''}</div>
                        <div>• Rerata Modal: Rp {fmt(historyContext.avgPrice)}</div>
                        <div>• Modal Terakhir: Rp {fmt(historyContext.lastPrice)}</div>
                      </div>
                    </div>
                  )}

                  {/* Warnings / Anomalies under Supplier Dropdown */}
                  {anomalies.map((anom, idx) => {
                    if (anom.type === 'high_warning') {
                      return (
                        <div key={idx} style={{ display: 'flex', gap: 8, background: '#FEF2F2', border: '1px solid #FEE2E2', padding: '10px 12px', borderRadius: 10, marginTop: 4, itemsCenter: 'center' }}>
                          <AlertCircle size={14} color="#EF4444" style={{ flexShrink: 0 }} />
                          <span style={{ fontSize: 11, color: '#DC2626', fontWeight: 600, fontFamily: 'DM Sans', lineHeight: '1.4' }}>
                            {anom.message}
                          </span>
                        </div>
                      )
                    }
                    if (anom.type === 'info') {
                      return (
                        <div key={idx} style={{ display: 'flex', gap: 8, background: '#EFF6FF', border: '1px solid #DBEAFE', padding: '10px 12px', borderRadius: 10, marginTop: 4, itemsCenter: 'center' }}>
                          <AlertCircle size={14} color="#3B82F6" style={{ flexShrink: 0 }} />
                          <span style={{ fontSize: 11, color: '#2563EB', fontWeight: 600, fontFamily: 'DM Sans', lineHeight: '1.4' }}>
                            {anom.message}
                          </span>
                        </div>
                      )
                    }
                    return null
                  })}
                </div>
              )}
            </SField>
          </div>

          {/* Card 2: Jumlah & Pricing */}
          <div style={{ background: 'rgba(15,23,42,0.015)', border: `1px solid ${C.border}`, borderRadius: 16, padding: 14, display: 'flex', flexDirection: 'column', gap: 14 }}>
            
            {/* Satuan Penerimaan / Kemasan Dropdown */}
            {selectedProduct && (
              <SField label="Satuan Penerimaan / Kemasan">
                <div style={{ position: 'relative' }}>
                  <button
                    type="button"
                    onClick={() => setIsUnitDropdownOpen(!isUnitDropdownOpen)}
                    style={{
                      ...inputSt,
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'space-between',
                      cursor: 'pointer',
                      background: '#FFFFFF',
                    }}
                  >
                    <span style={{ textTransform: 'capitalize' }}>{form.selectedUnit || baseUnit}</span>
                    <ChevronDown size={16} color="#64748B" style={{ transform: isUnitDropdownOpen ? 'rotate(180deg)' : 'none', transition: 'transform 0.2s' }} />
                  </button>
                  {isUnitDropdownOpen && (
                    <>
                      <div style={{ position: 'fixed', inset: 0, zIndex: 5050 }} onClick={() => setIsUnitDropdownOpen(false)} />
                      <div
                        style={{
                          position: 'absolute',
                          left: 0,
                          right: 0,
                          top: '100%',
                          marginTop: 6,
                          background: '#FFFFFF',
                          border: '1px solid #E2E8F0',
                          borderRadius: 12,
                          boxShadow: '0 10px 25px rgba(0,0,0,0.1)',
                          zIndex: 5060,
                          overflow: 'hidden',
                          padding: '4px 0',
                        }}
                      >
                        {UNIVERSAL_PACKAGING_OPTIONS.map(opt => (
                          <button
                            key={opt.value}
                            type="button"
                            onClick={() => {
                              set('selectedUnit', opt.value)
                              setIsUnitDropdownOpen(false)
                            }}
                            style={{
                              width: '100%',
                              textAlign: 'left',
                              padding: '10px 14px',
                              fontSize: 13,
                              fontFamily: 'DM Sans',
                              fontWeight: 600,
                              color: '#0F172A',
                              background: 'transparent',
                              border: 'none',
                              cursor: 'pointer',
                              display: 'flex',
                              alignItems: 'center',
                              justifyContent: 'space-between',
                            }}
                            onMouseEnter={e => e.currentTarget.style.background = '#F8FAFC'}
                            onMouseLeave={e => e.currentTarget.style.background = 'transparent'}
                          >
                            <span>{opt.label}</span>
                            {(form.selectedUnit || baseUnit) === opt.value && (
                              <Check size={16} color="#16A34A" strokeWidth={3} />
                            )}
                          </button>
                        ))}
                      </div>
                    </>
                  )}
                </div>
              </SField>
            )}

            <SField label={`Jumlah Masuk (${form.selectedUnit || baseUnit}) *`}>
              <input
                id="stok-qty" name="qty_masuk" type="text" inputMode="decimal"
                value={form.qty_masuk}
                onChange={e => {
                  const val = e.target.value
                  if (val === '' || /^[0-9]*[.,]?[0-9]*$/.test(val)) {
                    set('qty_masuk', val.replace(',', '.'))
                  }
                }}
                placeholder="0"
                style={inputSt}
              />
              {/* If user selected a packaging unit, show conversion */}
              {currentFactor > 1 && Number(form.qty_masuk) > 0 && (
                <div style={{ display: 'flex', alignItems: 'center', gap: 6, marginTop: 4, padding: '6px 10px', background: '#F0FDF4', borderRadius: 8, border: '1px solid #DCFCE7' }}>
                  <Package size={13} color="#16A34A" />
                  <span style={{ fontSize: 11, color: '#15803D', fontWeight: 700, fontFamily: 'DM Sans' }}>
                    Setara dengan <strong style={{ color: '#166534' }}>{Number(form.qty_masuk) * currentFactor} {baseUnit}</strong> stok gudang
                  </span>
                </div>
              )}
              {selectedProduct && (
                <UniversalMultiUnitCalculator
                  targetUnit={baseUnit}
                  onApply={qty => {
                    set('selectedUnit', baseUnit)
                    set('qty_masuk', String(qty))
                  }}
                />
              )}
            </SField>

            {/* Selector Mode Input Harga */}
            {isMultiUnitPackaging && (
              <div>
                <p style={{ fontSize: 11, fontWeight: 700, color: '#64748B', marginBottom: 6, fontFamily: 'DM Sans' }}>
                  Pilihan Satuan Harga Input:
                </p>
                <div style={{ display: 'flex', background: '#F1F5F9', borderRadius: 10, padding: 3, gap: 4 }}>
                  <button
                    type="button"
                    onClick={() => set('priceMode', 'per_base')}
                    style={{
                      flex: 1,
                      padding: '8px 10px',
                      borderRadius: 8,
                      border: 'none',
                      background: priceMode === 'per_base' ? '#FFFFFF' : 'transparent',
                      boxShadow: priceMode === 'per_base' ? '0 1px 3px rgba(0,0,0,0.08)' : 'none',
                      color: priceMode === 'per_base' ? '#0F172A' : '#64748B',
                      fontWeight: priceMode === 'per_base' ? 800 : 600,
                      fontSize: 11,
                      fontFamily: 'DM Sans',
                      cursor: 'pointer',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      gap: 6,
                      transition: 'all 0.15s',
                    }}
                  >
                    <span>🏷️ Harga per {baseUnit}</span>
                  </button>
                  <button
                    type="button"
                    onClick={() => set('priceMode', 'per_kemasan')}
                    style={{
                      flex: 1,
                      padding: '8px 10px',
                      borderRadius: 8,
                      border: 'none',
                      background: priceMode === 'per_kemasan' ? '#FFFFFF' : 'transparent',
                      boxShadow: priceMode === 'per_kemasan' ? '0 1px 3px rgba(0,0,0,0.08)' : 'none',
                      color: priceMode === 'per_kemasan' ? '#0F172A' : '#64748B',
                      fontWeight: priceMode === 'per_kemasan' ? 800 : 600,
                      fontSize: 11,
                      fontFamily: 'DM Sans',
                      cursor: 'pointer',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      gap: 6,
                      transition: 'all 0.15s',
                    }}
                  >
                    <span>📦 Harga per {form.selectedUnit}</span>
                  </button>
                </div>
              </div>
            )}

            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
              <SField label={`Harga Beli / ${isMultiUnitPackaging ? (priceMode === 'per_kemasan' ? form.selectedUnit : baseUnit) : (form.selectedUnit || baseUnit)} *`}>
                <InputRupiah
                  value={form.buy_price}
                  onChange={val => set('buy_price', val)}
                  placeholder="Rp 0"
                />
                {isMultiUnitPackaging && (
                  <p style={{ fontSize: 10, color: '#64748B', fontWeight: 600, marginTop: 4, fontFamily: 'DM Sans' }}>
                    {priceMode === 'per_kemasan'
                      ? (inputBuyPrice > 0 ? `≈ Rp ${fmt(Math.round(inputBuyPrice / currentFactor))} / ${baseUnit}` : `Otomatis dihitung / ${baseUnit}`)
                      : (inputBuyPrice > 0 ? `≈ Rp ${fmt(inputBuyPrice * currentFactor)} / ${form.selectedUnit}` : `Otomatis dihitung / ${form.selectedUnit}`)}
                  </p>
                )}
                {showPriceTrend && (
                  <p style={{ fontSize: 10, color: isUp ? '#EF4444' : '#10B981', fontWeight: 700, marginTop: 4, fontFamily: 'DM Sans' }}>
                    {isUp ? '📈 Naik' : '📉 Turun'} {Math.abs(priceDiffPct)}% dari pembelian terakhir (Rp {fmt(historyContext.lastPrice)} / ${baseUnit})
                  </p>
                )}
                {anomalies.map((anom, idx) => {
                  if (anom.type === 'price_warning') {
                    return (
                      <div key={idx} style={{ display: 'flex', gap: 6, alignItems: 'center', marginTop: 4 }}>
                        <AlertCircle size={12} color="#EF4444" style={{ flexShrink: 0 }} />
                        <span style={{ fontSize: 10, color: '#DC2626', fontWeight: 700, fontFamily: 'DM Sans' }}>
                          {anom.message}
                        </span>
                      </div>
                    )
                  }
                  return null
                })}
              </SField>
              <SField label={`Harga Jual / ${isMultiUnitPackaging ? (priceMode === 'per_kemasan' ? form.selectedUnit : baseUnit) : (form.selectedUnit || baseUnit)}`}>
                <InputRupiah
                  value={form.sell_price}
                  onChange={val => set('sell_price', val)}
                  placeholder="Rp 0"
                />
                {isMultiUnitPackaging && (
                  <p style={{ fontSize: 10, color: '#64748B', fontWeight: 600, marginTop: 4, fontFamily: 'DM Sans' }}>
                    {priceMode === 'per_kemasan'
                      ? (inputSellPrice > 0 ? `≈ Rp ${fmt(Math.round(inputSellPrice / currentFactor))} / ${baseUnit}` : `Otomatis dihitung / ${baseUnit}`)
                      : (inputSellPrice > 0 ? `≈ Rp ${fmt(inputSellPrice * currentFactor)} / ${form.selectedUnit}` : `Otomatis dihitung / ${form.selectedUnit}`)}
                  </p>
                )}
                <p style={{ fontSize: 10, color: '#64748B', opacity: 0.7, marginTop: 4, fontFamily: 'DM Sans' }}>Harga ke toko / pelanggan</p>
              </SField>
            </div>

            {form.qty_masuk && form.buy_price && (
              <div style={{ background: '#F8FAFC', border: `1px solid ${C.border}`, borderRadius: 12, padding: '12px 16px', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <span style={{ fontFamily: 'DM Sans', fontSize: 13, fontWeight: 700, color: '#64748B' }}>Total Nilai Pembelian</span>
                <span style={{ fontFamily: 'Sora', fontSize: 16, fontWeight: 800, color: C.accent }}>
                  Rp {fmt(totalPurchaseValue)}
                </span>
              </div>
            )}
          </div>

          {/* Card 3: Tanggal & Catatan */}
          <div style={{ background: 'rgba(15,23,42,0.015)', border: `1px solid ${C.border}`, borderRadius: 16, padding: 14, display: 'flex', flexDirection: 'column', gap: 14 }}>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
              <SField label="Tanggal Masuk">
                <DatePicker
                  value={form.purchase_date}
                  onChange={val => set('purchase_date', val)}
                  placeholder="Pilih tanggal"
                />
              </SField>
              <SField label="Tanggal Kadaluarsa">
                <DatePicker
                  value={form.expiry_date}
                  onChange={val => set('expiry_date', val)}
                  placeholder="Pilih tanggal"
                />
              </SField>
            </div>

            <SField label="Catatan">
              <input
                id="stok-notes" name="notes" type="text"
                value={form.notes}
                onChange={e => set('notes', e.target.value)}
                placeholder="Opsional (cth: Faktur #1234)"
                style={inputSt}
              />
            </SField>

            <button
              type="button"
              onClick={() => setShowAdvanced(v => !v)}
              style={{ display: 'flex', alignItems: 'center', gap: 6, background: 'transparent', border: 'none', cursor: 'pointer', color: TEXT_SEC, fontSize: 11, fontWeight: 700, fontFamily: 'DM Sans', padding: '2px 0' }}
            >
              {showAdvanced ? <ChevronUp size={14} /> : <ChevronDown size={14} />}
              Detail Lanjutan (Kode Batch)
            </button>
            <AnimatePresence>
              {showAdvanced && (
                <motion.div initial={{ opacity: 0, height: 0 }} animate={{ opacity: 1, height: 'auto' }} exit={{ opacity: 0, height: 0 }} style={{ overflow: 'hidden' }}>
                  <SField label="Kode Batch">
                    <input
                      id="batch-code" name="batch_code" type="text"
                      value={form.batch_code} readOnly
                      style={{ ...inputSt, opacity: 0.6, cursor: 'not-allowed' }}
                    />
                  </SField>
                </motion.div>
              )}
            </AnimatePresence>
          </div>

          <div style={{ display: 'flex', gap: 10, marginTop: 6 }}>
            <button
              type="button"
              onClick={handleCancelReset}
              style={{
                height: 58, padding: '0 16px', borderRadius: 16, background: '#FEF2F2', color: '#DC2626',
                fontFamily: 'Sora', fontSize: 13, fontWeight: 800, border: '1px solid #FEE2E2', cursor: 'pointer',
              }}
            >
              Batal & Reset
            </button>
             <button
              type="submit"
              disabled={!form.product_id || !form.supplier_id || !form.qty_masuk || !form.buy_price || addBatch.isPending}
              style={{
                flex: 1, height: 58, minHeight: 58, borderRadius: 16, background: '#0F172A', color: 'white',
                fontFamily: 'Sora', fontSize: 16, fontWeight: 800, border: 'none', cursor: 'pointer',
                boxShadow: '0 4px 12px rgba(15,23,42,0.08)',
                opacity: (!form.product_id || !form.supplier_id || !form.qty_masuk || !form.buy_price || addBatch.isPending) ? 0.6 : 1,
                transition: 'all 0.2s',
                display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8,
                letterSpacing: '-0.01em',
              }}
            >
              {addBatch.isPending ? 'Menyimpan...' : 'Simpan Stok Masuk'}
            </button>
          </div>
        </form>
      </motion.div>
    </motion.div>
  )
}
