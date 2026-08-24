import React, { useState, useMemo, useEffect, useRef } from 'react'
import {
  Plus, Search, X, ChevronDown, ToggleLeft, ToggleRight, Trash2, Package,
  FileSpreadsheet, AlertTriangle, Layers, Tag, Calculator, Boxes, Sparkles,
  Edit3, RefreshCw, Layers2, ShieldAlert
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
import {
  useSembakoProducts,
  useCreateSembakoProduct,
  useUpdateSembakoProduct,
  useSoftDeleteSembakoProduct,
  useSembakoRawMaterials,
  useDeleteSembakoRawMaterial,
} from '@/lib/hooks/useSembakoData'
import SembakoBahanBakuSheet from './components/SembakoBahanBakuSheet'
import { formatIDR } from '@/lib/format'
import { useOutletContext, useLocation, useNavigate } from 'react-router-dom'
import { C } from '@/dashboard/broker/sembako_broker/components/sembakoSaleUtils'
import { BrokerMobileHeader } from '@/dashboard/broker/_shared/components/BrokerMobileHeader'
import { SembakoErrorState } from '@/dashboard/broker/sembako_broker/components/SembakoUiPrimitives'
import { SembakoPageHeader } from '@/dashboard/broker/sembako_broker/components/SembakoPageHeader'
import { SembakoSummaryStrip } from '@/dashboard/broker/sembako_broker/components/SembakoSummaryStrip'
import { useMediaQuery } from '@/lib/hooks/useMediaQuery'
import { useBackHandler } from '@/lib/hooks/useBackHandler'

// ── Constants ─────────────────────────────────────────────────────────────────

const TEXT_SEC = '#94A3B8'

const CATEGORIES = [
  'Beras & Biji-bijian',
  'Minyak Goreng & Margarin',
  'Gula, Garam & Pemanis',
  'Tepung & Gandum',
  'Telur & Susu',
  'Bumbu & Rempah Dapur',
  'Mie Instan & Bihun',
  'Minuman, Teh & Kopi',
  'Makanan Ringan (Snack)',
  'Sabun, Cuci & Kebersihan',
  'Kemasan, Plastik & Perlengkapan',
  'Rokok & Tembakau',
  'Lain-lain',
]

const UNITS = [
  'pcs',
  'dus',
  'karton',
  'bal',
  'sak',
  'karung',
  'kg',
  'liter',
  'pack',
  'bungkus',
  'renceng',
  'lusin',
  'ikat',
  'kaleng',
  'botol',
  'slop',
  'pres',
]

const DEFAULT_CONVERSIONS = {
  'sak': 50,
  'karung': 50,
  'karton': 40,
  'dus': 20,
  'bal': 20,
  'bal besar': 20,
  'bal kecil': 10,
  'pres': 10,
  'pack': 10,
  'renceng': 12,
  'lusin': 12,
}

const fmt = (n) => new Intl.NumberFormat('id-ID', { maximumFractionDigits: 0 }).format(Math.round(Number(n) || 0))

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

  const [form, setForm] = useState({
    product_name: product?.product_name || '',
    category: product?.category || 'Beras & Biji-bijian',
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
  const [showBomCalculator, setShowBomCalculator] = useState(false)
  const [catOpen, setCatOpen] = useState(false)
  const [priceInputUnit, setPriceInputUnit] = useState('primary') // 'primary' (Retail) | 'secondary' (Grosir)
  const [tempGrosirSellPrice, setTempGrosirSellPrice] = useState('')
  const [tempGrosirBuyPrice, setTempGrosirBuyPrice] = useState('')

  const convRate = Number(form.conversion_rate) > 0 ? Number(form.conversion_rate) : 1
  const hasGrosirUnit = Boolean(form.secondary_unit && Number(form.conversion_rate) > 0)

  const set = (key, val) => setForm(f => ({ ...f, [key]: val }))

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

  const handleSubmit = async (e) => {
    e.preventDefault()
    if (!form.product_name.trim()) return toast.error('Nama produk wajib diisi')
    const payload = {
      ...form,
      sell_price: form.sell_price ? Number(String(form.sell_price).replace(/\D/g, '')) : null,
      avg_buy_price: form.avg_buy_price ? Number(String(form.avg_buy_price).replace(/\D/g, '')) : null,
      min_stock_alert: form.min_stock_alert ? Number(String(form.min_stock_alert).replace(/\D/g, '')) : null,
      conversion_rate: form.conversion_rate ? Number(form.conversion_rate) : null,
      harga_solo_rp: form.harga_solo_rp ? Number(String(form.harga_solo_rp).replace(/\D/g, '')) : null,
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
          overflowY: 'auto'
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

        <form onSubmit={handleSubmit} style={{ padding: '16px 20px 0', display: 'flex', flexDirection: 'column', gap: 14 }}>
          {/* Nama produk */}
          <Field label="Nama Produk *">
            <input
              id="product-name" name="product_name" type="text"
              value={form.product_name}
              onChange={e => set('product_name', e.target.value)}
              placeholder="contoh: Minyak Goreng 2L (Dus / Karton)"
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
                  placeholder="Contoh: 40 (1 Dus = 40 Pcs)"
                  style={{ ...inputStyle, paddingLeft: 44 }}
                />
                <span style={{ position: 'absolute', left: 12, top: '50%', transform: 'translateY(-50%)', fontSize: 12, color: C.accent, fontWeight: 800 }}>1x</span>
              </div>

              {/* Quick Conversion Chips */}
              <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap', marginTop: 6 }}>
                {[
                  { label: '50 (Sak/Karung)', val: 50 },
                  { label: '40 (Karton)', val: 40 },
                  { label: '20 (Dus/Bal)', val: 20 },
                  { label: '12 (Lusin/Renceng)', val: 12 },
                  { label: '10 (Pack/Pres)', val: 10 }
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

            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10 }}>
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
                        set('sell_price', val ? Math.round(Number(val) / convRate) : '')
                      } else {
                        set('sell_price', val)
                        if (hasGrosirUnit) setTempGrosirSellPrice(val ? Math.round(Number(val) * convRate) : '')
                      }
                    }}
                    placeholder="0"
                    style={{ ...inputStyle, paddingLeft: 36 }}
                  />
                </div>
                {hasGrosirUnit && (
                  <p style={{ fontSize: 10, color: '#0c3d0c', marginTop: 4, fontWeight: 700 }}>
                    {priceInputUnit === 'secondary'
                      ? `💡 = Rp ${fmt(form.sell_price || 0)} / ${form.unit}`
                      : `💡 = Rp ${fmt(Math.round(Number(form.sell_price || 0) * convRate))} / ${form.secondary_unit}`
                    }
                  </p>
                )}
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
                style={{ marginTop: 12, display: 'flex', flexDirection: 'column', gap: 10 }}
              >
                <p style={{ fontSize: 11, color: TEXT_SEC, margin: 0, lineHeight: 1.4 }}>
                  Isi biaya per pcs dari bahan baku & packaging untuk menjumlahkan HPP otomatis:
                </p>

                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 8 }}>
                  <div>
                    <label style={{ fontSize: 10, fontWeight: 700, color: TEXT_SEC, display: 'block', marginBottom: 4 }}>
                      Modal Bawang Curah (Rp)
                    </label>
                    <input
                      type="text"
                      inputMode="numeric"
                      value={form.raw_ingredient_cost ? fmt(form.raw_ingredient_cost) : ''}
                      onChange={e => updateBomCost('raw_ingredient_cost', e.target.value.replace(/\D/g, ''))}
                      placeholder="0"
                      style={inputStyle}
                    />
                  </div>
                  <div>
                    <label style={{ fontSize: 10, fontWeight: 700, color: TEXT_SEC, display: 'block', marginBottom: 4 }}>
                      Pouch / Toples (Rp)
                    </label>
                    <input
                      type="text"
                      inputMode="numeric"
                      value={form.pouch_cost ? fmt(form.pouch_cost) : ''}
                      onChange={e => updateBomCost('pouch_cost', e.target.value.replace(/\D/g, ''))}
                      placeholder="0"
                      style={inputStyle}
                    />
                  </div>
                </div>

                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 8 }}>
                  <div>
                    <label style={{ fontSize: 10, fontWeight: 700, color: TEXT_SEC, display: 'block', marginBottom: 4 }}>
                      Stiker Depan (Rp)
                    </label>
                    <input
                      type="text"
                      inputMode="numeric"
                      value={form.sticker_front_cost ? fmt(form.sticker_front_cost) : ''}
                      onChange={e => updateBomCost('sticker_front_cost', e.target.value.replace(/\D/g, ''))}
                      placeholder="0"
                      style={inputStyle}
                    />
                  </div>
                  <div>
                    <label style={{ fontSize: 10, fontWeight: 700, color: TEXT_SEC, display: 'block', marginBottom: 4 }}>
                      Stiker Belakang (Rp)
                    </label>
                    <input
                      type="text"
                      inputMode="numeric"
                      value={form.sticker_back_cost ? fmt(form.sticker_back_cost) : ''}
                      onChange={e => updateBomCost('sticker_back_cost', e.target.value.replace(/\D/g, ''))}
                      placeholder="0"
                      style={inputStyle}
                    />
                  </div>
                </div>

                <div>
                  <label style={{ fontSize: 10, fontWeight: 700, color: TEXT_SEC, display: 'block', marginBottom: 4 }}>
                    Kardus / Bubblewrap / Safety Pack (Rp)
                  </label>
                  <input
                    type="text"
                    inputMode="numeric"
                    value={form.other_packaging_cost ? fmt(form.other_packaging_cost) : ''}
                    onChange={e => updateBomCost('other_packaging_cost', e.target.value.replace(/\D/g, ''))}
                    placeholder="0"
                    style={inputStyle}
                  />
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
                <label style={{ fontSize: 10, fontWeight: 700, color: TEXT_SEC, display: 'block', marginBottom: 4 }}>
                  Solo Raya (Rp)
                </label>
                <input
                  type="text"
                  inputMode="numeric"
                  value={form.harga_solo_rp ? fmt(form.harga_solo_rp) : ''}
                  onChange={e => set('harga_solo_rp', e.target.value.replace(/\D/g, ''))}
                  placeholder="0"
                  style={inputStyle}
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
              placeholder="contoh: JB-BAMO-100G"
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
              placeholder="Contoh: Kemasan 2 Liter, isi 6 pouch per dus"
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

function CustomSelect({ value, onChange, options, placeholder, id }) {
  const [open, setOpen] = useState(false)
  const selected = options.find(o => o.value === value)

  return (
    <div style={{ position: 'relative', width: '100%' }}>
      <div
        id={id}
        onClick={() => setOpen(!open)}
        style={{
          ...inputStyle,
          cursor: 'pointer',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          border: open ? `1px solid ${C.accent}` : `1px solid ${C.border}`,
          transition: 'all 0.2s'
        }}
      >
        <span style={{ color: value ? C.text : TEXT_SEC, fontSize: '14px' }}>
          {selected ? selected.label : placeholder}
        </span>
        <ChevronDown size={16} color={TEXT_SEC} style={{ transform: open ? 'rotate(180deg)' : 'none', transition: 'transform 0.2s' }} />
      </div>
      <AnimatePresence>
        {open && (
          <>
            <motion.div
              initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
              style={{ position: 'fixed', inset: 0, zIndex: 5050, background: 'transparent' }}
              onClick={() => setOpen(false)}
            />
            <motion.div
              initial={{ opacity: 0, y: -8, scale: 0.95 }}
              animate={{ opacity: 1, y: 0, scale: 1 }}
              exit={{ opacity: 0, y: -8, scale: 0.95 }}
              style={{
                position: 'absolute', top: '100%', left: 0, right: 0, marginTop: '8px',
                background: 'var(--bg-surface)', border: `1px solid var(--border-soft)`, borderRadius: '14px',
                zIndex: 5060, overflow: 'hidden', boxShadow: '0 12px 40px rgba(0,0,0,0.6)',
                backdropFilter: 'blur(10px)',
              }}
            >
              <div style={{ maxHeight: '200px', overflowY: 'auto' }}>
                {options.map(opt => (
                  <div
                    key={opt.value}
                    onClick={() => { onChange(opt.value); setOpen(false) }}
                    style={{
                      padding: '12px 16px', fontSize: '14px', color: value === opt.value ? C.accent : C.text,
                      background: value === opt.value ? 'rgba(15,23,42,0.08)' : 'transparent',
                      cursor: 'pointer', transition: 'all 0.2s',
                      display: 'flex', alignItems: 'center', justifyContent: 'space-between',
                      borderBottom: `1px solid var(--border-soft)`
                    }}
                  >
                    <span>{opt.label}</span>
                    {value === opt.value && <span style={{ fontSize: '10px' }}>✓</span>}
                  </div>
                ))}
              </div>
            </motion.div>
          </>
        )}
      </AnimatePresence>
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
      {/* Badge kategori */}
      {product.category && (
        <span style={{ fontSize: 10, fontFamily: 'DM Sans', fontWeight: 600, color: C.accent, background: 'rgba(15,23,42,0.08)', padding: '2px 8px', borderRadius: 20, letterSpacing: '0.03em' }}>
          {product.category}
        </span>
      )}

      {/* Nama produk */}
      <p style={{ fontFamily: 'Sora', fontWeight: 700, fontSize: 14, color: C.text, margin: '8px 0 4px', lineHeight: 1.3, wordBreak: 'break-word' }}>
        {product.product_name}
      </p>

      {/* Harga jual */}
      <p style={{ fontFamily: 'DM Sans', fontSize: 13, color: C.accent, fontWeight: 600, margin: '0 0 10px' }}>
        Rp {fmt(product.sell_price)} / {product.unit}
      </p>

      {/* Margin badge */}
      {margin && (
        <span style={{ fontSize: 11, fontWeight: 600, color: margin.color, background: `${margin.color}18`, padding: '2px 8px', borderRadius: 20, marginBottom: 8, display: 'inline-block' }}>
          Margin {margin.pct}%
        </span>
      )}

      {/* Stock bar */}
      <div style={{ marginTop: 8 }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 4 }}>
          <span style={{ fontSize: 11, color: '#6B7280', fontFamily: 'DM Sans' }}>Stok</span>
          <span style={{ fontSize: 11, color: sColor, fontFamily: 'DM Sans', fontWeight: 600 }}>
            {fmt(product.current_stock)} {product.unit}
          </span>
        </div>
        {pct !== null && (
          <div style={{ height: 4, background: 'rgba(255,255,255,0.06)', borderRadius: 2, overflow: 'hidden' }}>
            <div style={{ height: '100%', width: `${pct}%`, background: sColor, borderRadius: 2, transition: 'width 0.4s ease' }} />
          </div>
        )}
      </div>

      {/* Warning */}
      {warning && (
        <p style={{ fontSize: 11, color: '#F87171', marginTop: 6, fontFamily: 'DM Sans' }}>
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

  // Raw Materials Hook
  const { data: rawMaterials = [], isLoading: isLoadingRaw, refetch: refetchRaw } = useSembakoRawMaterials()
  const deleteRawMut = useDeleteSembakoRawMaterial()

  const [activeSubTab, setActiveSubTab] = useState('produk') // 'produk' | 'kemasan'
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

  // Raw Materials Sheet State
  const [rawSheetOpen, setRawSheetOpen] = useState(false)
  const [editingRawMaterial, setEditingRawMaterial] = useState(null)
  const [rawToDelete, setRawToDelete] = useState(null)
  const [rawTypeFilter, setRawTypeFilter] = useState('all')

  useEffect(() => {
    const params = new URLSearchParams(location.search)
    const action = params.get('action')
    const tab = params.get('tab')
    if (tab === 'kemasan' || tab === 'bahan') {
      setActiveSubTab('kemasan')
    }
    if (action === 'new' || action === 'tambah') {
      setSheet('new')
    }
  }, [location.search])

  const categories = useMemo(() => {
    const cats = [...new Set(products.map(p => p.category).filter(Boolean))]
    return ['Semua', ...cats]
  }, [products])

  const filtered = useMemo(() => {
    return products.filter(p => {
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
  }, [products, search, catFilter, showInactive])

  const filteredRaw = useMemo(() => {
    return rawMaterials.filter(r => {
      if (rawTypeFilter !== 'all' && r.material_type !== rawTypeFilter) return false
      if (search) {
        const q = search.toLowerCase()
        const matchName = r.material_name?.toLowerCase().includes(q)
        const matchNotes = r.notes?.toLowerCase().includes(q)
        const matchSupplier = r.supplier_name?.toLowerCase().includes(q)
        if (!matchName && !matchNotes && !matchSupplier) return false
      }
      return true
    })
  }, [rawMaterials, rawTypeFilter, search])

  const stats = useMemo(() => {
    const active = products.filter(p => p.is_active && !p.is_deleted)
    const lowStock = active.filter(p => p.min_stock_alert > 0 && p.current_stock <= p.min_stock_alert)
    const nilaiStok = active.reduce((s, p) => s + (p.current_stock * (p.avg_buy_price || 0)), 0)
    return { total: active.length, lowStock: lowStock.length, nilaiStok }
  }, [products])

  const rawStats = useMemo(() => {
    const totalJenis = rawMaterials.length
    const lowStock = rawMaterials.filter(r => r.min_stock_alert > 0 && r.current_stock <= r.min_stock_alert).length
    const totalInvestasi = rawMaterials.reduce((s, r) => s + (Number(r.total_spent) || (Number(r.current_stock) * Number(r.unit_cost || 0))), 0)
    return { totalJenis, lowStock, totalInvestasi }
  }, [rawMaterials])

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
    { label: 'Total Nilai Stok', value: stats.nilaiStok, isCurrency: true, color: 'amber' },
  ] : [
    { label: 'Total Jenis Kemasan & Bahan', value: rawStats.totalJenis, color: 'amber', subLabel: 'Pouch, Stiker, Bawang' },
    { label: 'Kemasan Menipis', value: rawStats.lowStock > 0 ? `${rawStats.lowStock} item` : 'Aman', color: rawStats.lowStock > 0 ? 'red' : 'green', subLabel: rawStats.lowStock > 0 ? 'perlu order pabrik' : 'stok packaging cukup' },
    { label: 'Total Pembelian Bahan', value: rawStats.totalInvestasi, isCurrency: true, color: 'amber' },
  ]

  const categoryFilters = categories.map(c => ({ id: c, label: c }))

  return (
    <div className="min-h-screen bg-background text-foreground pb-[max(140px,calc(110px+env(safe-area-inset-bottom,24px)))] text-left">
      {!isDesktop && <BrokerMobileHeader title={activeSubTab === 'produk' ? 'Produk' : 'Bahan Baku'} onMenuClick={() => setSidebarOpen(true)} />}

      <div className="mx-auto max-w-7xl">
        <SembakoPageHeader
          title={activeSubTab === 'produk' ? 'Manajemen Produk & SKU' : 'Bahan Baku & Kemasan (BOM)'}
          subtitle={activeSubTab === 'produk' ? `Katalog & Harga Multi-Tier · ${stats.total} produk aktif` : `Pouch, Stiker, Kardus & Bawang Curah · Auto HPP Calculation`}
          isDesktop={isDesktop}
          searchQuery={search}
          onSearchChange={setSearch}
          searchPlaceholder={activeSubTab === 'produk' ? 'Cari nama produk / SKU...' : 'Cari nama bahan, kemasan, supplier...'}
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
              ) : (
                <button
                  onClick={() => {
                    setEditingRawMaterial(null)
                    setRawSheetOpen(true)
                  }}
                  className="flex items-center gap-2 px-4 h-10 rounded-xl font-bold text-xs bg-amber-500 hover:bg-amber-400 text-slate-950 transition-all cursor-pointer shadow-lg shadow-amber-500/20 active:scale-95 shrink-0"
                >
                  <Plus size={16} />
                  <span>Tambah Bahan / Kemasan</span>
                </button>
              )}
            </div>
          }
        />

        {/* ── SubTab Selector (Produk Jadi vs Bahan & Kemasan) ── */}
        <div className="px-4 sm:px-6 pt-2">
          <div className="flex items-center gap-2 p-1.5 bg-muted/60 border border-border/80 rounded-2xl w-fit">
            <button
              onClick={() => setActiveSubTab('produk')}
              className={`flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-bold transition-all ${
                activeSubTab === 'produk'
                  ? 'bg-background text-foreground shadow-sm'
                  : 'text-muted-foreground hover:text-foreground'
              }`}
            >
              <Package size={15} />
              <span>Produk Jadi / SKU ({products.length})</span>
            </button>
            <button
              onClick={() => setActiveSubTab('kemasan')}
              className={`flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-bold transition-all ${
                activeSubTab === 'kemasan'
                  ? 'bg-amber-500 text-slate-950 shadow-sm font-black'
                  : 'text-muted-foreground hover:text-foreground'
              }`}
            >
              <Boxes size={15} />
              <span>Bahan Baku & Kemasan ({rawMaterials.length})</span>
            </button>
          </div>
        </div>

        <SembakoSummaryStrip items={summaryItems} />

        {/* ── TAB PRODUK JADI ── */}
        {activeSubTab === 'produk' && (
          <>
            {/* Toggle non-aktif */}
            <div className="px-4 sm:px-6 pt-2 pb-2 flex items-center justify-between">
              <button
                onClick={() => setShowInactive(v => !v)}
                className="border-0 bg-transparent cursor-pointer text-muted-foreground hover:text-foreground flex items-center gap-2 text-xs font-medium transition-colors"
              >
                {showInactive ? <ToggleRight size={22} className="text-[#0F172A]" /> : <ToggleLeft size={22} className="text-muted-foreground" />}
                <span>Tampilkan produk non-aktif</span>
              </button>
            </div>

            {/* Product grid */}
            <div className="px-4 sm:px-6 pt-2 grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-3.5">
              <AnimatePresence>
                {filtered.length === 0 ? (
                  <div className="col-span-full text-center py-16 bg-card border border-border/60 rounded-2xl">
                    <Package size={40} className="mx-auto mb-3 opacity-40 text-muted-foreground" />
                    <p className="font-bold text-base text-foreground mb-1">
                      {search ? 'Produk tidak ditemukan' : 'Belum ada produk'}
                    </p>
                    <p className="text-xs text-muted-foreground mb-4">
                      {search ? 'Coba kata kunci lain' : 'Mulai dengan menambahkan produk yang Anda jual'}
                    </p>
                    {!search && (
                      <button
                        onClick={() => setSheet('new')}
                        className="inline-flex items-center gap-2 px-5 h-10 rounded-xl bg-[#0F172A] hover:bg-slate-900 text-white text-xs font-bold transition-all shadow-lg shadow-slate-950/10"
                      >
                        <Plus size={15} /> Tambah Produk Pertama
                      </button>
                    )}
                  </div>
                ) : (
                  filtered.map(product => (
                    <ProductCard
                      key={product.id}
                      product={product}
                      onEdit={setSheet}
                      onDelete={handleDelete}
                    />
                  ))
                )}
              </AnimatePresence>
            </div>
          </>
        )}

        {/* ── TAB BAHAN BAKU & KEMASAN ── */}
        {activeSubTab === 'kemasan' && (
          <div className="px-4 sm:px-6 pt-2 space-y-4">
            {/* Filter Jenis Kemasan */}
            <div className="flex items-center gap-2 overflow-x-auto pb-1">
              {[
                { id: 'all', label: 'Semua Bahan' },
                { id: 'pouch', label: 'Pouch & Kemasan' },
                { id: 'sticker_depan', label: 'Stiker Depan' },
                { id: 'sticker_belakang', label: 'Stiker Belakang' },
                { id: 'kardus', label: 'Kardus & Safety' },
                { id: 'bawang_mentah', label: 'Bawang Mentah/Curah' },
                { id: 'minyak_bumbu', label: 'Minyak & Bumbu' },
              ].map(f => (
                <button
                  key={f.id}
                  onClick={() => setRawTypeFilter(f.id)}
                  className={`px-3 py-1.5 rounded-xl text-xs font-bold whitespace-nowrap transition-all ${
                    rawTypeFilter === f.id
                      ? 'bg-[#0F172A] text-white'
                      : 'bg-muted text-muted-foreground hover:text-foreground'
                  }`}
                >
                  {f.label}
                </button>
              ))}
            </div>

            {/* Grid Bahan & Kemasan */}
            {isLoadingRaw ? (
              <div className="p-12 text-center text-xs text-muted-foreground">Memuat data kemasan & bahan...</div>
            ) : filteredRaw.length === 0 ? (
              <div className="p-12 text-center bg-card border border-border/80 rounded-3xl space-y-3">
                <Boxes size={40} className="mx-auto text-muted-foreground/40" />
                <div>
                  <p className="font-bold text-sm text-foreground">Belum ada Bahan Baku / Kemasan</p>
                  <p className="text-xs text-muted-foreground mt-0.5">
                    Tambahkan pouch 100g, 200g, 250g, stiker, atau kardus pengiriman dengan sistem auto-kalkulator HPP.
                  </p>
                </div>
                <button
                  onClick={() => {
                    setEditingRawMaterial(null)
                    setRawSheetOpen(true)
                  }}
                  className="inline-flex items-center gap-2 px-4 py-2 rounded-xl bg-amber-500 hover:bg-amber-400 text-slate-950 text-xs font-bold"
                >
                  <Plus size={15} /> Tambah Bahan Sekarang
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
                            {raw.material_type?.replace('_', ' ') || 'KEMASAN'}
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
                            <span className="font-bold text-foreground">{fmt(raw.current_stock)} {raw.unit}</span>
                          </div>
                          <div className="flex justify-between">
                            <span className="text-muted-foreground">HPP Satuan:</span>
                            <span className="font-extrabold text-amber-600 dark:text-amber-400">
                              Rp {fmt(raw.unit_cost)} / {raw.unit}
                            </span>
                          </div>
                          {Number(raw.total_spent) > 0 && (
                            <div className="flex justify-between text-[11px] pt-1 border-t border-border/40">
                              <span className="text-muted-foreground">Total Nilai Pembelian:</span>
                              <span className="font-semibold text-foreground">Rp {fmt(raw.total_spent)}</span>
                            </div>
                          )}
                        </div>
                      </div>

                      <div className="mt-3 pt-2.5 border-t border-border/60 flex items-center justify-between">
                        <span className="text-[11px] text-muted-foreground">
                          {raw.supplier_name ? `Supplier: ${raw.supplier_name}` : 'Supplier Mandiri'}
                        </span>
                        <div className="flex items-center gap-1.5">
                          <button
                            onClick={() => {
                              setEditingRawMaterial(raw)
                              setRawSheetOpen(true)
                            }}
                            className="p-1.5 rounded-lg bg-muted hover:bg-muted/80 text-foreground"
                            title="Edit Bahan"
                          >
                            <Edit3 size={13} />
                          </button>
                          <button
                            onClick={() => handleDeleteRaw(raw)}
                            className="p-1.5 rounded-lg bg-rose-500/10 hover:bg-rose-500/20 text-rose-600"
                            title="Hapus Bahan"
                          >
                            <Trash2 size={13} />
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

      {/* Sheet Bahan Baku & Kemasan */}
      <SembakoBahanBakuSheet
        open={rawSheetOpen}
        onClose={() => {
          setRawSheetOpen(false)
          setEditingRawMaterial(null)
        }}
        initialData={editingRawMaterial}
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
                  Produk ini masih memiliki stok <strong>{fmt(productToDelete.current_stock)} {productToDelete.unit}</strong>.
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
