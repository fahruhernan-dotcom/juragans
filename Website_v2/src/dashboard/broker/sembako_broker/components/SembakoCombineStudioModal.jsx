import React, { useState, useMemo, useEffect } from 'react'
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter
} from '@/components/ui/dialog'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue
} from '@/components/ui/select'
import {
  useExecuteCombineProduct,
  useSembakoProducts,
  useSembakoRawMaterials
} from '@/lib/hooks/useSembakoData'
import {
  extractProductGrammage,
  matchBawangMaterial,
  matchKemasanMaterial,
  matchStickerFrontMaterial,
  matchStickerBackMaterial
} from '@/lib/inventory/bomStockCalculator'
import {
  Sparkles,
  Layers,
  Plus,
  Minus,
  AlertTriangle,
  Zap,
  Info,
  Check
} from 'lucide-react'
import { toast } from 'sonner'

const fmt = (n) => new Intl.NumberFormat('id-ID').format(Math.round(n || 0))

export function SembakoCombineStudioModal({ open, onOpenChange, preselectedProductId = null }) {
  const { data: products = [] } = useSembakoProducts()
  const { data: rawMaterials = [] } = useSembakoRawMaterials()
  const executeCombine = useExecuteCombineProduct()

  const activeProducts = useMemo(() => {
    return products.filter(p => p.is_active && !p.is_deleted)
  }, [products])

  const [selectedProductId, setSelectedProductId] = useState(preselectedProductId || '')
  const [combineQty, setCombineQty] = useState(10)
  const [notes, setNotes] = useState('')
  const [disabledComponents, setDisabledComponents] = useState({})
  const [selectedMaterials, setSelectedMaterials] = useState({
    bawang: '',
    kemasan: '',
    stiker_depan: '',
    stiker_belakang: '',
    packing: ''
  })

  // Initialize selected product
  useEffect(() => {
    if (preselectedProductId) {
      setSelectedProductId(preselectedProductId)
    } else if (activeProducts.length > 0 && !selectedProductId) {
      setSelectedProductId(activeProducts[0].id)
    }
  }, [preselectedProductId, activeProducts, selectedProductId])

  const currentProduct = useMemo(() => {
    return activeProducts.find(p => p.id === selectedProductId) || activeProducts[0] || null
  }, [activeProducts, selectedProductId])

  // Filter pilihan bahan baku sesuai tipe / kategori
  const materialOptions = useMemo(() => {
    const isBawang = r => {
      const cat = (r.category || '').toLowerCase()
      const name = (r.material_name || '').toLowerCase()
      return cat.includes('bawang') || cat.includes('bahan_baku') || cat.includes('mentah') || cat.includes('curah') || name.includes('bawang')
    }
    const isKemasan = r => {
      const cat = (r.category || '').toLowerCase()
      const name = (r.material_name || '').toLowerCase()
      return !name.includes('polymailer') && (
        cat.includes('pouch') ||
        cat.includes('kemasan') ||
        cat.includes('toples') ||
        name.includes('pouch') ||
        name.includes('toples') ||
        name.includes('plastik') ||
        name.includes('jar') ||
        name.includes('pe') ||
        name.includes('standing')
      )
    }
    const isStickerFront = r => {
      const cat = (r.category || '').toLowerCase()
      const name = (r.material_name || '').toLowerCase()
      return (
        cat === 'sticker_depan' ||
        name.includes('stiker depan') ||
        name.includes('label depan') ||
        (cat.includes('stiker') && !name.includes('belakang') && !name.includes('back')) ||
        (name.includes('label') && !name.includes('belakang'))
      )
    }
    const isStickerBack = r => {
      const cat = (r.category || '').toLowerCase()
      const name = (r.material_name || '').toLowerCase()
      return (
        cat === 'sticker_belakang' ||
        name.includes('stiker belakang') ||
        name.includes('label belakang') ||
        (cat.includes('stiker') && (name.includes('belakang') || name.includes('back') || name.includes('nutrition') || name.includes('p-irt'))) ||
        name.includes('belakang')
      )
    }
    const isPacking = r => {
      const cat = (r.category || '').toLowerCase()
      const name = (r.material_name || '').toLowerCase()
      return (
        cat.includes('polymailer') ||
        cat.includes('kardus') ||
        cat.includes('packing') ||
        name.includes('polymailer') ||
        name.includes('kardus') ||
        name.includes('box') ||
        name.includes('bubble')
      )
    }

    return {
      bawang: rawMaterials.filter(isBawang),
      kemasan: rawMaterials.filter(isKemasan),
      stiker_depan: rawMaterials.filter(isStickerFront),
      stiker_belakang: rawMaterials.filter(isStickerBack),
      packing: rawMaterials.filter(isPacking)
    }
  }, [rawMaterials])

  // Inisialisasi pilihan bahan default saat produk dipilih atau modal dibuka
  useEffect(() => {
    if (!open || !currentProduct || rawMaterials.length === 0) return

    const matchedBawang = matchBawangMaterial(currentProduct, rawMaterials) || materialOptions.bawang[0] || null
    const matchedKemasan = matchKemasanMaterial(currentProduct, rawMaterials) || materialOptions.kemasan[0] || null
    const matchedStickerFront = matchStickerFrontMaterial(currentProduct, rawMaterials) || materialOptions.stiker_depan[0] || null
    const matchedStickerBack = matchStickerBackMaterial(currentProduct, rawMaterials) || materialOptions.stiker_belakang[0] || null
    const matchedPacking = rawMaterials.find(r => (r.category || '').toLowerCase().includes('polymailer') || (r.material_name || '').toLowerCase().includes('polymailer')) || materialOptions.packing[0] || null

    setSelectedMaterials({
      bawang: matchedBawang ? String(matchedBawang.id) : '',
      kemasan: matchedKemasan ? String(matchedKemasan.id) : '',
      stiker_depan: matchedStickerFront ? String(matchedStickerFront.id) : '',
      stiker_belakang: matchedStickerBack ? String(matchedStickerBack.id) : '',
      packing: matchedPacking ? String(matchedPacking.id) : ''
    })

    // Komponen default: stiker depan & belakang otomatis aktif jika stok tersedia (> 0)
    // Kardus / packing ekspedisi default dilewati
    const initDisabled = {
      bawang: false,
      kemasan: false,
      stiker_depan: !matchedStickerFront || (Number(matchedStickerFront.current_stock) || 0) <= 0,
      stiker_belakang: !matchedStickerBack || (Number(matchedStickerBack.current_stock) || 0) <= 0,
      packing: true
    }

    setDisabledComponents(initDisabled)
  }, [selectedProductId, open, rawMaterials])

  // Hitung komponen resep untuk produk yang dipilih
  const recipe = useMemo(() => {
    if (!currentProduct || rawMaterials.length === 0) return null

    const gram = extractProductGrammage(currentProduct.product_name, currentProduct.notes)
    const nameLower = (currentProduct.product_name || '').toLowerCase()
    const isBundling = currentProduct.category === 'Paket Bundling & Combo' || nameLower.includes('paket') || nameLower.includes('bundling')
    let packagingMultiplier = 1
    if (isBundling) {
      if (nameLower.includes('trio') || nameLower.includes('3x100')) packagingMultiplier = 3
      else if (nameLower.includes('duo') || nameLower.includes('2x200')) packagingMultiplier = 2
      else if (nameLower.includes('reseller') || nameLower.includes('10')) packagingMultiplier = 10
    }

    const slotConfigs = [
      {
        type: 'bawang',
        badge: 'BAWANG CURAH',
        title: 'Bawang Curah',
        icon: '🧅',
        isOptional: false,
        options: materialOptions.bawang,
        calculateNeed: (mat) => {
          const isKg = (mat?.unit || '').toLowerCase() === 'kg'
          return isKg ? gram / 1000 : gram
        },
        getUnitLabel: (mat, need) => {
          const isKg = (mat?.unit || '').toLowerCase() === 'kg'
          return isKg ? `${need} kg (${gram}g)` : `${need} g`
        }
      },
      {
        type: 'kemasan',
        badge: 'KEMASAN / POUCH',
        title: 'Kemasan / Pouch',
        icon: '🛍️',
        isOptional: false,
        options: materialOptions.kemasan,
        calculateNeed: () => packagingMultiplier,
        getUnitLabel: (mat, need) => `${need} ${mat?.unit || 'pcs'}`
      },
      {
        type: 'stiker_depan',
        badge: 'STIKER DEPAN',
        title: 'Stiker Depan',
        icon: '🏷️',
        isOptional: true,
        options: materialOptions.stiker_depan,
        calculateNeed: () => packagingMultiplier,
        getUnitLabel: (mat, need) => `${need} ${mat?.unit || 'pcs'}`
      },
      {
        type: 'stiker_belakang',
        badge: 'STIKER BELAKANG',
        title: 'Stiker Belakang',
        icon: '🏷️',
        isOptional: true,
        options: materialOptions.stiker_belakang,
        calculateNeed: () => packagingMultiplier,
        getUnitLabel: (mat, need) => `${need} ${mat?.unit || 'pcs'}`
      },
      {
        type: 'packing',
        badge: 'PACKING TAMBAHAN',
        title: 'Kardus / Polymailer',
        icon: '📦',
        isOptional: true,
        options: materialOptions.packing,
        calculateNeed: () => 1,
        getUnitLabel: (mat, need) => `${need} ${mat?.unit || 'pcs'}`
      }
    ]

    const items = []

    slotConfigs.forEach(cfg => {
      const selectedId = selectedMaterials[cfg.type]
      const mat = rawMaterials.find(r => String(r.id) === String(selectedId)) || null
      const neededPerUnit = mat ? cfg.calculateNeed(mat) : 0
      const curStock = mat ? (Number(mat.current_stock) || 0) : 0
      const maxPossible = (mat && neededPerUnit > 0) ? Math.floor(curStock / neededPerUnit) : 0

      items.push({
        type: cfg.type,
        badge: cfg.badge,
        label: cfg.title,
        icon: cfg.icon,
        isOptional: cfg.isOptional,
        material: mat,
        options: cfg.options,
        neededPerUnit,
        unitLabel: mat ? cfg.getUnitLabel(mat, neededPerUnit) : '-',
        unitCost: mat ? (Number(mat.unit_cost) || 0) : 0,
        currentStock: curStock,
        unit: mat?.unit || 'pcs',
        maxPossible
      })
    })

    // Filter item aktif (harus ada bahannya dan tidak dikecualikan / dilewati)
    const activeItems = items.filter(it => it.material && !disabledComponents[it.type])
    const maxCraftable = activeItems.length > 0 ? Math.min(...activeItems.map(it => it.maxPossible)) : 0
    const bottleneck = activeItems.find(it => it.maxPossible === maxCraftable) || null

    return {
      gram,
      items,
      activeItems,
      maxCraftable: Math.max(0, maxCraftable),
      bottleneck
    }
  }, [currentProduct, rawMaterials, selectedMaterials, disabledComponents, materialOptions])

  // Adjust combineQty if it exceeds maxCraftable
  useEffect(() => {
    if (recipe && recipe.maxCraftable > 0 && combineQty > recipe.maxCraftable) {
      setCombineQty(Math.min(10, recipe.maxCraftable))
    }
  }, [recipe?.maxCraftable])

  const safeQty = Math.max(1, Number(combineQty) || 1)
  const isOverCapacity = Boolean(recipe && safeQty > recipe.maxCraftable)

  // Hitung estimasi biaya HPP dari komponen yang diaktifkan
  const estimatedHppPerUnit = useMemo(() => {
    if (!recipe?.activeItems) return 0
    return recipe.activeItems.reduce((sum, it) => sum + (it.neededPerUnit * it.unitCost), 0)
  }, [recipe?.activeItems])

  const totalAssetGenerated = safeQty * estimatedHppPerUnit

  const toggleComponent = (type) => {
    setDisabledComponents(prev => ({
      ...prev,
      [type]: !prev[type]
    }))
  }

  const handleMaterialChange = (type, value) => {
    if (value === 'none') {
      setSelectedMaterials(prev => ({ ...prev, [type]: '' }))
      setDisabledComponents(prev => ({ ...prev, [type]: true }))
    } else {
      setSelectedMaterials(prev => ({ ...prev, [type]: value }))
      setDisabledComponents(prev => ({ ...prev, [type]: false }))
    }
  }

  const handleCombine = async () => {
    if (!currentProduct || !recipe) return
    if (recipe.activeItems.length === 0) {
      toast.error('Pilih minimal 1 komponen bahan baku untuk digabungkan!')
      return
    }
    if (isOverCapacity) {
      toast.error(`Stok bahan baku tidak mencukupi untuk membuat ${safeQty} ${currentProduct.unit || 'pcs'}!`)
      return
    }

    const materialsPayload = recipe.activeItems.map(it => ({
      material_id: it.material.id,
      material_name: it.material.material_name,
      deduct_qty: it.neededPerUnit * safeQty
    }))

    console.log('[CombineModal] Materials payload yang akan dipotong:', materialsPayload)
    console.log('[CombineModal] Product:', currentProduct?.product_name, '| Qty:', safeQty)
    console.log('[CombineModal] Active items:', recipe.activeItems.map(it => ({
      type: it.type,
      material_name: it.material?.material_name,
      material_id: it.material?.id,
      neededPerUnit: it.neededPerUnit,
      deduct_total: it.neededPerUnit * safeQty,
      unit: it.material?.unit
    })))

    const skippedLabels = recipe.items
      .filter(it => !it.material || disabledComponents[it.type])
      .map(it => it.label)
    const skippedNote = skippedLabels.length > 0 ? ` (Tanpa: ${skippedLabels.join(', ')})` : ''

    try {
      await executeCombine.mutateAsync({
        product: currentProduct,
        output_qty: safeQty,
        materials: materialsPayload,
        notes: notes ? `${notes}${skippedNote}` : `Combine via Meja Racik (${safeQty} ${currentProduct.unit || 'pcs'})${skippedNote}`
      })
      onOpenChange(false)
    } catch (err) {
      // handled by hook toast
    }
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-3xl max-h-[92vh] overflow-y-auto p-4 sm:p-6 bg-card border-border rounded-2xl">
        <DialogHeader>
          <div className="flex items-center gap-2.5">
            <div className="w-10 h-10 rounded-xl bg-amber-500/20 text-amber-500 flex items-center justify-center border border-amber-500/30">
              <Sparkles size={20} className="animate-pulse" />
            </div>
            <div>
              <DialogTitle className="text-base sm:text-lg font-black text-foreground flex items-center gap-2">
                <span>Meja Combine & Racik Produk Jadi</span>
                <span className="text-[10px] font-extrabold uppercase px-2 py-0.5 rounded-full bg-emerald-500/15 text-emerald-600 dark:text-emerald-400 border border-emerald-500/30">
                  Game Style
                </span>
              </DialogTitle>
              <DialogDescription className="text-xs text-muted-foreground mt-0.5">
                Pilih atau ubah bahan baku, kemasan, dan stiker sesuai kebutuhan untuk digabungkan menjadi produk siap jual.
              </DialogDescription>
            </div>
          </div>
        </DialogHeader>

        <div className="space-y-4 my-2">
          {/* 1. Pilih Produk Target */}
          <div className="space-y-1.5">
            <label className="text-xs font-bold text-muted-foreground uppercase tracking-wider">
              1. Pilih Produk yang Ingin Dibuat / Diracing
            </label>
            <Select
              value={selectedProductId}
              onValueChange={(val) => {
                setSelectedProductId(val)
                setCombineQty(10)
              }}
            >
              <SelectTrigger className="w-full h-11 px-3 rounded-xl bg-muted/40 border border-border text-foreground font-bold text-sm outline-none focus:ring-2 focus:ring-amber-500 transition cursor-pointer">
                <SelectValue placeholder="Pilih Produk Jadi..." />
              </SelectTrigger>
              <SelectContent className="z-[9999]">
                {activeProducts.map(p => (
                  <SelectItem key={p.id} value={p.id}>
                    {p.product_name} · (Stok Gudang Sekarang: {fmt(p.current_stock || 0)} {p.unit || 'pcs'})
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          {/* 2. Visual Crafting Grid (Slot Komponen Pembentuk) */}
          <div className="p-3.5 rounded-2xl bg-muted/30 border border-border/80 space-y-3">
            <div className="flex items-center justify-between flex-wrap gap-2">
              <span className="text-xs font-extrabold text-foreground flex items-center gap-1.5 uppercase tracking-wider">
                <Layers size={14} className="text-amber-500" />
                Slot Resep Komponen Pembentuk (Bisa Diubah per Tipe)
              </span>
              {recipe && (
                <span className={`text-[11px] font-bold px-2.5 py-0.5 rounded-full border ${
                  recipe.maxCraftable > 0 
                    ? 'bg-emerald-500/15 text-emerald-700 dark:text-emerald-300 border-emerald-500/30' 
                    : 'bg-rose-500/15 text-rose-600 border-rose-500/30'
                }`}>
                  Bisa di-combine: <strong>{fmt(recipe.maxCraftable)}</strong> {currentProduct?.unit || 'pcs'}
                </span>
              )}
            </div>

            {recipe?.items && recipe.items.length > 0 ? (
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                {recipe.items.map((it) => {
                  const isExcluded = Boolean(disabledComponents[it.type]) || !it.material
                  const isShortage = !isExcluded && safeQty > it.maxPossible
                  const isZeroStock = it.material && it.currentStock <= 0

                  return (
                    <div
                      key={it.type}
                      className={`p-3 rounded-xl border flex flex-col justify-between gap-2.5 transition-all min-w-0 w-full box-border overflow-hidden ${
                        isExcluded
                          ? 'bg-muted/20 border-border/40 opacity-70'
                          : isShortage
                          ? 'bg-rose-500/10 border-rose-500/30'
                          : 'bg-card border-border/70 hover:border-amber-500/40 shadow-xs'
                      }`}
                    >
                      {/* Slot Header: Badge & Status & Toggle Button */}
                      <div className="flex items-center justify-between gap-2 flex-wrap">
                        <div className="flex items-center gap-1.5 min-w-0 flex-wrap">
                          <span className="text-[10px] font-extrabold uppercase px-1.5 py-0.5 rounded bg-muted text-muted-foreground flex items-center gap-1">
                            <span>{it.icon}</span>
                            <span>{it.badge}</span>
                          </span>
                          {isExcluded ? (
                            <span className="text-[9.5px] font-bold text-slate-400">
                              Dilewati
                            </span>
                          ) : isZeroStock ? (
                            <span className="text-[9.5px] font-bold text-rose-500 flex items-center gap-0.5">
                              <AlertTriangle size={10} /> Stok Habis
                            </span>
                          ) : isShortage ? (
                            <span className="text-[9.5px] font-bold text-rose-500 flex items-center gap-0.5">
                              <AlertTriangle size={10} /> Kurang
                            </span>
                          ) : (
                            <span className="text-[9.5px] font-bold text-emerald-600 dark:text-emerald-400 flex items-center gap-0.5">
                              <Check size={10} /> Cukup
                            </span>
                          )}
                        </div>

                        {/* Toggle Checkbox / Button */}
                        <button
                          type="button"
                          onClick={() => toggleComponent(it.type)}
                          className={`px-2 py-0.5 rounded-lg text-[10px] font-extrabold flex items-center gap-1 transition-all cursor-pointer shrink-0 ${
                            isExcluded
                              ? 'bg-slate-200 dark:bg-slate-700 text-slate-700 dark:text-slate-200 hover:bg-slate-300'
                              : 'bg-emerald-500/15 text-emerald-700 dark:text-emerald-400 border border-emerald-500/30 hover:bg-rose-500/15 hover:text-rose-600 hover:border-rose-500/30'
                          }`}
                          title={isExcluded ? 'Gunakan komponen ini dalam racikan' : 'Lewati komponen ini jika tidak memakai stiker/bahan ini'}
                        >
                          {isExcluded ? (
                            <>
                              <Plus size={10} />
                              <span>Pakai</span>
                            </>
                          ) : (
                            <>
                              <Check size={10} />
                              <span>Dipakai</span>
                            </>
                          )}
                        </button>
                      </div>

                      {/* Dropdown Pemilihan Bahan Sesuai Tipe */}
                      <div className="w-full min-w-0">
                        <Select
                          value={selectedMaterials[it.type] || 'none'}
                          onValueChange={(val) => handleMaterialChange(it.type, val)}
                        >
                          <SelectTrigger className="h-9 w-full min-w-0 max-w-full bg-muted/40 border-border/80 text-xs font-bold rounded-xl truncate">
                            <SelectValue placeholder={`-- Pilih ${it.label} --`} />
                          </SelectTrigger>
                          <SelectContent className="z-[9999]">
                            {it.isOptional && (
                              <SelectItem value="none">-- Tanpa {it.label} (Dilewati) --</SelectItem>
                            )}
                            {it.options && it.options.length > 0 ? (
                              it.options.map(mat => (
                                <SelectItem key={mat.id} value={String(mat.id)}>
                                  {mat.material_name} (Stok: {fmt(mat.current_stock || 0)} {mat.unit}) — Rp {fmt(mat.unit_cost)}
                                </SelectItem>
                              ))
                            ) : (
                              <SelectItem value="empty" disabled>Belum ada bahan {it.label}</SelectItem>
                            )}
                          </SelectContent>
                        </Select>
                      </div>

                      {/* Info Kebutuhan per unit & Sisa Stok */}
                      <div className="flex items-center justify-between pt-2 border-t border-border/40 text-[11px] flex-wrap gap-1">
                        <span className="text-muted-foreground">
                          Kebutuhan: <strong className="text-foreground font-semibold">{it.unitLabel}</strong>
                        </span>
                        <span className="text-muted-foreground">
                          {isExcluded ? (
                            <span className="text-slate-400 font-medium">Tidak dipotong dari stok</span>
                          ) : (
                            <>
                              Tersedia: <strong className={isZeroStock ? 'text-rose-500 font-bold' : 'text-foreground'}>{fmt(it.currentStock)} {it.unit}</strong>
                              {' · '}
                              Maks: <strong className={`font-mono font-bold ${isShortage ? 'text-rose-500' : 'text-emerald-600 dark:text-emerald-400'}`}>{fmt(it.maxPossible)} unit</strong>
                            </>
                          )}
                        </span>
                      </div>
                    </div>
                  )
                })}
              </div>
            ) : (
              <div className="p-4 text-center text-xs text-muted-foreground bg-card rounded-xl border border-dashed border-border">
                Belum ada data bahan baku untuk racikan produk ini.
              </div>
            )}

            {/* Bottleneck Notice with Quick Helper */}
            {recipe?.bottleneck && (
              <div className="flex items-center justify-between gap-2 p-2.5 rounded-xl bg-amber-500/10 border border-amber-500/20 text-xs text-amber-800 dark:text-amber-300 flex-wrap">
                <div className="flex items-center gap-2">
                  <Info size={14} className="shrink-0 text-amber-600" />
                  <span>
                    Pembatas utama: <strong>{recipe.bottleneck.material?.material_name || recipe.bottleneck.label}</strong> (Maks. {fmt(recipe.bottleneck.maxPossible)} unit).
                  </span>
                </div>
                {recipe.bottleneck.maxPossible === 0 && recipe.bottleneck.isOptional && (
                  <button
                    type="button"
                    onClick={() => toggleComponent(recipe.bottleneck.type)}
                    className="px-2 py-0.5 rounded-lg text-[10px] font-extrabold bg-amber-500/20 hover:bg-amber-500/30 text-amber-900 dark:text-amber-200 border border-amber-500/30 cursor-pointer"
                  >
                    Lewati {recipe.bottleneck.label}
                  </button>
                )}
              </div>
            )}
          </div>

          {/* 3. Masukkan Jumlah yang Ingin Dibuat */}
          <div className="p-4 rounded-2xl bg-card border border-border space-y-3">
            <div className="flex items-center justify-between flex-wrap gap-2">
              <label className="text-xs font-bold text-foreground uppercase tracking-wider">
                2. Jumlah Produk yang Akan Di-Combine
              </label>
              <div className="flex items-center gap-1.5">
                {[10, 25, 50, 100].map(val => (
                  <button
                    key={val}
                    type="button"
                    onClick={() => setCombineQty(val)}
                    className="px-2 py-0.5 rounded-lg text-xs font-bold bg-muted hover:bg-muted/80 text-foreground transition cursor-pointer"
                  >
                    +{val}
                  </button>
                ))}
                {recipe && recipe.maxCraftable > 0 && (
                  <button
                    type="button"
                    onClick={() => setCombineQty(recipe.maxCraftable)}
                    className="px-2.5 py-0.5 rounded-lg text-xs font-extrabold bg-amber-500/20 text-amber-600 dark:text-amber-400 border border-amber-500/30 hover:bg-amber-500/30 transition cursor-pointer"
                  >
                    MAX ({recipe.maxCraftable})
                  </button>
                )}
              </div>
            </div>

            <div className="flex items-center gap-3">
              <button
                type="button"
                onClick={() => setCombineQty(prev => Math.max(1, (Number(prev) || 1) - 1))}
                className="w-11 h-11 rounded-xl bg-muted hover:bg-muted/80 text-foreground flex items-center justify-center font-bold text-lg transition cursor-pointer"
              >
                <Minus size={18} />
              </button>

              <div className="relative flex-1">
                <input
                  type="number"
                  min="1"
                  value={combineQty}
                  onChange={(e) => setCombineQty(e.target.value)}
                  className={`w-full h-11 px-4 rounded-xl bg-muted/40 border font-mono font-black text-center text-lg outline-none transition ${
                    isOverCapacity ? 'border-rose-500 text-rose-500' : 'border-border text-foreground focus:border-amber-500'
                  }`}
                />
                <span className="absolute right-3 top-1/2 -translate-y-1/2 text-xs font-bold text-muted-foreground pointer-events-none">
                  {currentProduct?.unit || 'pcs'}
                </span>
              </div>

              <button
                type="button"
                onClick={() => setCombineQty(prev => (Number(prev) || 0) + 1)}
                className="w-11 h-11 rounded-xl bg-muted hover:bg-muted/80 text-foreground flex items-center justify-center font-bold text-lg transition cursor-pointer"
              >
                <Plus size={18} />
              </button>
            </div>

            {isOverCapacity && (
              <div className="flex items-center justify-between gap-2 p-2 rounded-xl bg-rose-500/10 border border-rose-500/20 text-xs text-rose-600">
                <span className="flex items-center gap-1 text-[11px] font-semibold">
                  <AlertTriangle size={12} className="shrink-0" />
                  Jumlah melebihi stok bahan baku yang tersedia ({fmt(recipe.maxCraftable)} {currentProduct?.unit || 'pcs'}).
                </span>
                {recipe.maxCraftable > 0 && (
                  <button
                    type="button"
                    onClick={() => setCombineQty(recipe.maxCraftable)}
                    className="px-2 py-0.5 rounded-lg text-[10px] font-extrabold bg-rose-500/20 hover:bg-rose-500/30 text-rose-700 dark:text-rose-200 shrink-0 cursor-pointer"
                  >
                    Set ke {recipe.maxCraftable}
                  </button>
                )}
              </div>
            )}

            {/* Estimasi Kalkulasi HPP & Aset */}
            <div className="grid grid-cols-2 gap-2 pt-2 border-t border-border/50 text-xs">
              <div className="p-2.5 rounded-xl bg-muted/30 border border-border/50">
                <p className="text-[10px] text-muted-foreground font-medium">Estimasi Modal HPP / unit:</p>
                <p className="font-extrabold text-foreground font-mono text-sm mt-0.5">
                  Rp {fmt(estimatedHppPerUnit)}
                </p>
              </div>
              <div className="p-2.5 rounded-xl bg-muted/30 border border-border/50">
                <p className="text-[10px] text-muted-foreground font-medium">Nilai Aset Masuk ke Gudang:</p>
                <p className="font-extrabold text-emerald-600 dark:text-emerald-400 font-mono text-sm mt-0.5">
                  Rp {fmt(totalAssetGenerated)}
                </p>
              </div>
            </div>
          </div>
        </div>

        <DialogFooter className="gap-2 sm:gap-0 mt-2">
          <button
            type="button"
            onClick={() => onOpenChange(false)}
            className="w-full sm:w-auto px-4 py-2.5 rounded-xl border border-border text-muted-foreground hover:bg-muted font-bold text-xs transition cursor-pointer"
          >
            Batal
          </button>
          <button
            type="button"
            disabled={isOverCapacity || !recipe || recipe.activeItems.length === 0 || executeCombine.isPending || recipe.maxCraftable === 0}
            onClick={handleCombine}
            className={`w-full sm:w-auto px-5 py-2.5 rounded-xl font-extrabold text-xs text-white flex items-center justify-center gap-2 shadow-md transition-all ${
              isOverCapacity || !recipe || recipe.activeItems.length === 0 || executeCombine.isPending || recipe.maxCraftable === 0
                ? 'bg-slate-400 cursor-not-allowed opacity-60'
                : 'bg-amber-600 hover:bg-amber-500 active:scale-98 cursor-pointer shadow-amber-500/20'
            }`}
          >
            {executeCombine.isPending ? (
              <>Menggabungkan Komponen...</>
            ) : recipe?.maxCraftable === 0 ? (
              <span>⚠️ Stok Bahan Tidak Mencukupi (0 {currentProduct?.unit || 'pcs'})</span>
            ) : isOverCapacity ? (
              <span>⚠️ Melebihi Maksimal ({recipe?.maxCraftable} {currentProduct?.unit || 'pcs'})</span>
            ) : (
              <>
                <Zap size={15} className="fill-white" />
                <span>⚡ COMBINE {fmt(safeQty)} {currentProduct?.unit || 'pcs'} KE GUDANG</span>
              </>
            )}
          </button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
