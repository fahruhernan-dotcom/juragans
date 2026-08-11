import { useState, useEffect, useMemo, useCallback } from 'react'
import { supabase, isSupabaseConfigured } from '../../lib/supabaseClient'
import {
  Plus, User, RefreshCw, MapPin, Trash2, Search, Filter, Sparkles, X,
  LayoutGrid, Table as TableIcon, CheckCircle2, ArrowUpRight,
  TrendingUp, Check, ShoppingBag, PackageCheck
} from 'lucide-react'

const fmt = (n) => new Intl.NumberFormat('id-ID', { maximumFractionDigits: 0 }).format(Math.round(Number(n) || 0))

const MASTER_SKUS = [
  { sku: 'JBM-250', name: '[HERO SKU] Grade S Murni 250g', category: 'Grade S Murni', gram: 250, hpp_bawang: 30000, hpp_pouch: 356, hpp_stiker: 4277, hpp_total: 34700, price_solo: 40000, price_pusat: 43500 },
  { sku: 'JBM-200', name: 'Grade S Murni 200g', category: 'Grade S Murni', gram: 200, hpp_bawang: 24000, hpp_pouch: 356, hpp_stiker: 3500, hpp_total: 28200, price_solo: 34500, price_pusat: 37500 },
  { sku: 'JBM-150', name: 'Grade S Murni 150g', category: 'Grade S Murni', gram: 150, hpp_bawang: 18000, hpp_pouch: 334, hpp_stiker: 3055, hpp_total: 21700, price_solo: 26000, price_pusat: 26500 },
  { sku: 'JBM-100-TRIAL', name: 'Trial Pack Grade S Murni 100g', category: 'Grade S Murni', gram: 100, hpp_bawang: 12000, hpp_pouch: 245, hpp_stiker: 2689, hpp_total: 15400, price_solo: 21600, price_pusat: 23500 },
  { sku: 'JBM-1K', name: 'Grade S Murni Bal PE 1 Kg', category: 'Grade S Murni', gram: 1000, hpp_bawang: 120000, hpp_pouch: 2200, hpp_stiker: 5000, hpp_total: 127200, price_solo: 152000, price_pusat: 165500 },
  { sku: 'JBA-250', name: '[HERO SKU] Grade A Crispy 250g', category: 'Grade A Crispy', gram: 250, hpp_bawang: 26400, hpp_pouch: 356, hpp_stiker: 4277, hpp_total: 30950, price_solo: 35000, price_pusat: 37500 },
  { sku: 'JBA-200', name: 'Grade A Crispy 200g', category: 'Grade A Crispy', gram: 200, hpp_bawang: 21120, hpp_pouch: 356, hpp_stiker: 3500, hpp_total: 25100, price_solo: 31000, price_pusat: 31500 },
  { sku: 'JBA-100-TRIAL', name: 'Trial Pack Grade A Crispy 100g', category: 'Grade A Crispy', gram: 100, hpp_bawang: 10560, hpp_pouch: 245, hpp_stiker: 2689, hpp_total: 13900, price_solo: 18900, price_pusat: 20500 },
  { sku: 'JBA-1K', name: 'Grade A Crispy Bal PE 1 Kg', category: 'Grade A Crispy', gram: 1000, hpp_bawang: 105600, hpp_pouch: 2200, hpp_stiker: 5000, hpp_total: 112200, price_solo: 125000, price_pusat: 135500 },
]

const INITIAL_SALES = [
  {
    id: 'so-013',
    invoice_number: 'INV/2026/08/013',
    customer_name: 'Yatmo',
    area: 'Jakarta / Jabodetabek',
    order_source: 'whatsapp',
    transaction_date: '2026-08-10T00:00:00.000Z',
    total_weight_kg: 0.5,
    total_amount: 87000,
    total_hpp: 69400,
    net_profit: 17600,
    payment_status: 'belum_lunas',
    delivery_status: 'menunggu_pengiriman',
    shipping_address: 'Jakarta / Jabodetabek',
    notes: 'Kirim via kurir sameday',
    juragan_sale_items: [
      { product_name: '[HERO SKU] Grade S Murni 250g', weight_gram: 250, quantity: 2, unit_price: 43500, subtotal: 87000, cogs_per_unit: 34700, cogs_total: 69400 }
    ]
  },
  {
    id: 'so-012',
    invoice_number: 'INV/2026/08/012',
    customer_name: 'Farhan',
    area: 'Jakarta / Jabodetabek',
    order_source: 'whatsapp',
    transaction_date: '2026-08-10T00:00:00.000Z',
    total_weight_kg: 1.0,
    total_amount: 174000,
    total_hpp: 138800,
    net_profit: 35200,
    payment_status: 'belum_lunas',
    delivery_status: 'menunggu_pengiriman',
    shipping_address: 'Jakarta / Jabodetabek',
    notes: 'Minta dipack kardus tebal',
    juragan_sale_items: [
      { product_name: '[HERO SKU] Grade S Murni 250g', weight_gram: 250, quantity: 4, unit_price: 43500, subtotal: 174000, cogs_per_unit: 34700, cogs_total: 138800 }
    ]
  },
  {
    id: 'so-011',
    invoice_number: 'INV/2026/08/011',
    customer_name: 'Zaki',
    area: 'Solo Raya',
    order_source: 'whatsapp',
    transaction_date: '2026-08-07T00:00:00.000Z',
    total_weight_kg: 0.1,
    total_amount: 18900,
    total_hpp: 13900,
    net_profit: 5000,
    payment_status: 'lunas',
    delivery_status: 'terkirim',
    shipping_address: 'Solo Raya',
    notes: 'Pouch trial kemasan promo',
    juragan_sale_items: [
      { product_name: 'Trial Pack Grade A Crispy 100g', weight_gram: 100, quantity: 1, unit_price: 18900, subtotal: 18900, cogs_per_unit: 13900, cogs_total: 13900 }
    ]
  },
  {
    id: 'so-010',
    invoice_number: 'INV/2026/08/010',
    customer_name: 'Zaki',
    area: 'Solo Raya',
    order_source: 'whatsapp',
    transaction_date: '2026-08-07T00:00:00.000Z',
    total_weight_kg: 0.1,
    total_amount: 21600,
    total_hpp: 15400,
    net_profit: 6200,
    payment_status: 'lunas',
    delivery_status: 'terkirim',
    shipping_address: 'Solo Raya',
    notes: 'Ambil langsung di outlet Solo',
    juragan_sale_items: [
      { product_name: 'Trial Pack Grade S Murni 100g', weight_gram: 100, quantity: 1, unit_price: 21600, subtotal: 21600, cogs_per_unit: 15400, cogs_total: 15400 }
    ]
  },
  {
    id: 'so-009',
    invoice_number: 'INV/2026/08/009',
    customer_name: 'Ares',
    area: 'Solo Raya',
    order_source: 'whatsapp',
    transaction_date: '2026-08-10T00:00:00.000Z',
    total_weight_kg: 0.25,
    total_amount: 40000,
    total_hpp: 34633,
    net_profit: 5367,
    payment_status: 'lunas',
    delivery_status: 'terkirim',
    shipping_address: 'Solo Raya',
    notes: 'Kemasan stiker gold standar',
    juragan_sale_items: [
      { product_name: '[HERO SKU] Grade S Murni 250g', weight_gram: 250, quantity: 1, unit_price: 40000, subtotal: 40000, cogs_per_unit: 34633, cogs_total: 34633 }
    ]
  },
  {
    id: 'so-008',
    invoice_number: 'INV/2026/08/008',
    customer_name: 'Didi',
    area: 'Solo Raya',
    order_source: 'whatsapp',
    transaction_date: '2026-08-07T00:00:00.000Z',
    total_weight_kg: 2.0,
    total_amount: 271000,
    total_hpp: 214900,
    net_profit: 56100,
    payment_status: 'belum_lunas',
    delivery_status: 'menunggu_pengiriman',
    shipping_address: 'Solo Raya',
    notes: '20 pack dipecah kemasan pouch polos saja, tanpa stiker',
    juragan_sale_items: [
      { product_name: 'Trial Pack Grade A Crispy 100g (Pouch Polos)', weight_gram: 100, quantity: 20, unit_price: 13550, subtotal: 271000, cogs_per_unit: 10745, cogs_total: 214900 }
    ]
  },
  {
    id: 'so-007',
    invoice_number: 'INV/2026/08/007',
    customer_name: 'Bukit',
    area: 'Jakarta / Jabodetabek',
    order_source: 'whatsapp',
    transaction_date: '2026-08-07T00:00:00.000Z',
    total_weight_kg: 0.5,
    total_amount: 87000,
    total_hpp: 69400,
    net_profit: 17600,
    payment_status: 'belum_lunas',
    delivery_status: 'menunggu_pengiriman',
    shipping_address: 'Jakarta / Jabodetabek',
    notes: 'Kirim alamat kantor',
    juragan_sale_items: [
      { product_name: '[HERO SKU] Grade S Murni 250g', weight_gram: 250, quantity: 2, unit_price: 43500, subtotal: 87000, cogs_per_unit: 34700, cogs_total: 69400 }
    ]
  },
  {
    id: 'so-006',
    invoice_number: 'INV/2026/08/006',
    customer_name: 'Widi',
    area: 'Jakarta / Jabodetabek',
    order_source: 'whatsapp',
    transaction_date: '2026-08-07T00:00:00.000Z',
    total_weight_kg: 0.6,
    total_amount: 106000,
    total_hpp: 85560,
    net_profit: 20440,
    payment_status: 'belum_lunas',
    delivery_status: 'menunggu_pengiriman',
    shipping_address: 'Jakarta / Jabodetabek',
    notes: 'Pengiriman via Paxel',
    juragan_sale_items: [
      { product_name: 'Grade S Murni 150g', weight_gram: 150, quantity: 4, unit_price: 26500, subtotal: 106000, cogs_per_unit: 21390, cogs_total: 85560 }
    ]
  },
  {
    id: 'so-005',
    invoice_number: 'INV/2026/08/005',
    customer_name: 'Amal',
    area: 'Jakarta / Jabodetabek',
    order_source: 'whatsapp',
    transaction_date: '2026-08-07T00:00:00.000Z',
    total_weight_kg: 0.5,
    total_amount: 87000,
    total_hpp: 69400,
    net_profit: 17600,
    payment_status: 'belum_lunas',
    delivery_status: 'menunggu_pengiriman',
    shipping_address: 'Jakarta / Jabodetabek',
    notes: 'Pesanan langganan bulanan',
    juragan_sale_items: [
      { product_name: '[HERO SKU] Grade S Murni 250g', weight_gram: 250, quantity: 2, unit_price: 43500, subtotal: 87000, cogs_per_unit: 34700, cogs_total: 69400 }
    ]
  },
  {
    id: 'so-004',
    invoice_number: 'INV/2026/08/004',
    customer_name: 'Hendry',
    area: 'Jakarta / Jabodetabek',
    order_source: 'whatsapp',
    transaction_date: '2026-08-07T00:00:00.000Z',
    total_weight_kg: 0.8,
    total_amount: 150000,
    total_hpp: 109560,
    net_profit: 40440,
    payment_status: 'belum_lunas',
    delivery_status: 'menunggu_pengiriman',
    shipping_address: 'Jakarta / Jabodetabek',
    notes: 'Titip pos satpam jika tidak ada orang',
    juragan_sale_items: [
      { product_name: 'Grade S Murni 200g', weight_gram: 200, quantity: 4, unit_price: 37500, subtotal: 150000, cogs_per_unit: 27390, cogs_total: 109560 }
    ]
  },
  {
    id: 'so-003',
    invoice_number: 'INV/2026/08/003',
    customer_name: 'Anggi',
    area: 'Jakarta / Jabodetabek',
    order_source: 'whatsapp',
    transaction_date: '2026-08-07T00:00:00.000Z',
    total_weight_kg: 1.0,
    total_amount: 165500,
    total_hpp: 136950,
    net_profit: 28550,
    payment_status: 'lunas',
    delivery_status: 'menunggu_pengiriman',
    shipping_address: 'Jakarta / Jabodetabek',
    notes: 'Bundling 1kg Deal (5 pack @ 200g)',
    juragan_sale_items: [
      { product_name: 'Grade S Murni 200g', weight_gram: 200, quantity: 5, unit_price: 33100, subtotal: 165500, cogs_per_unit: 27390, cogs_total: 136950 }
    ]
  },
  {
    id: 'so-002',
    invoice_number: 'INV/2026/08/002',
    customer_name: 'Renny',
    area: 'Jakarta / Jabodetabek',
    order_source: 'whatsapp',
    transaction_date: '2026-08-07T00:00:00.000Z',
    total_weight_kg: 0.4,
    total_amount: 75000,
    total_hpp: 54780,
    net_profit: 20220,
    payment_status: 'belum_lunas',
    delivery_status: 'menunggu_pengiriman',
    shipping_address: 'Jakarta / Jabodetabek',
    notes: 'Kirim sore hari',
    juragan_sale_items: [
      { product_name: 'Grade S Murni 200g', weight_gram: 200, quantity: 2, unit_price: 37500, subtotal: 75000, cogs_per_unit: 27390, cogs_total: 54780 }
    ]
  },
  {
    id: 'so-001',
    invoice_number: 'INV/2026/08/001',
    customer_name: 'Adip',
    area: 'Semarang',
    order_source: 'whatsapp',
    transaction_date: '2026-08-05T00:00:00.000Z',
    total_weight_kg: 0.25,
    total_amount: 43500,
    total_hpp: 34700,
    net_profit: 8800,
    payment_status: 'lunas',
    delivery_status: 'terkirim',
    shipping_address: 'Rumah Kost Eksklusif Bulusan, Jl. Bulusan Selatan Raya No.9a, Bulusan, Kec. Tembalang, Kota Semarang, Jawa Tengah 50277 (Kamar 9)',
    notes: 'Semarang Kost Bulusan Kamar 9',
    juragan_sale_items: [
      { product_name: '[HERO SKU] Grade S Murni 250g', weight_gram: 250, quantity: 1, unit_price: 43500, subtotal: 43500, cogs_per_unit: 34700, cogs_total: 34700 }
    ]
  }
]

export default function SalesOrders() {
  const [sales, setSales] = useState(INITIAL_SALES)
  const [loading, setLoading] = useState(false)
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [isAddModalOpen, setIsAddModalOpen] = useState(false)
  const [toastMsg, setToastMsg] = useState('')
  
  // View mode & selected detail sheet
  const [viewMode, setViewMode] = useState('card') // 'card' or 'table'
  const [selectedSale, setSelectedSale] = useState(null)
  const [isDetailSheetOpen, setIsDetailSheetOpen] = useState(false)

  // Search & Filter
  const [searchTerm, setSearchTerm] = useState('')
  const [statusFilter, setStatusFilter] = useState('ALL')
  const [areaFilter, setAreaFilter] = useState('ALL')

  const [newOrder, setNewOrder] = useState({
    customer_name: '',
    area: 'Jakarta / Jabodetabek',
    order_source: 'whatsapp',
    payment_status: 'belum_lunas',
    delivery_status: 'menunggu_pengiriman',
    address: '',
    notes: '',
    items: [
      { sku: 'JBM-250', quantity: 1, is_repack: false }
    ]
  })

  const showToast = (msg) => {
    setToastMsg(msg)
    setTimeout(() => setToastMsg(''), 3000)
  }

  const fetchSales = useCallback(async () => {
    if (!isSupabaseConfigured()) return
    setLoading(true)
    try {
      // Relational fetch: join juragan_sale_items table directly
      const { data, error } = await supabase
        .from('juragan_sales')
        .select('*, juragan_sale_items(*)')
        .order('invoice_number', { ascending: false })
      if (!error && data && data.length > 0) {
        setSales(data)
      }
    } catch (err) {
      console.warn('[SalesOrders] Using local INITIAL_SALES fallback:', err)
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => {
    const timer = setTimeout(() => {
      fetchSales()
    }, 0)
    return () => clearTimeout(timer)
  }, [fetchSales])

  const handleAddItemRow = () => {
    setNewOrder({
      ...newOrder,
      items: [...newOrder.items, { sku: 'JBA-250', quantity: 1, is_repack: false }]
    })
  }

  const handleRemoveItemRow = (index) => {
    if (newOrder.items.length <= 1) return
    const updated = [...newOrder.items]
    updated.splice(index, 1)
    setNewOrder({ ...newOrder, items: updated })
  }

  const handleUpdateItemRow = (index, field, value) => {
    const updated = [...newOrder.items]
    updated[index][field] = value
    setNewOrder({ ...newOrder, items: updated })
  }

  const isSoloArea = newOrder.area.toLowerCase().includes('solo') || newOrder.area.toLowerCase().includes('boyolali') || newOrder.area.toLowerCase().includes('sukoharjo') || newOrder.area.toLowerCase().includes('surakarta')
  const availableSkus = MASTER_SKUS

  let combinedGrossSales = 0
  let combinedTotalHpp = 0
  let combinedTotalWeightGram = 0
  let itemsSummaryList = []

  newOrder.items.forEach(item => {
    const prod = availableSkus.find(p => (p.sku || p.Kode_SKU) === item.sku) || MASTER_SKUS[0]
    const unitPrice = isSoloArea ? (prod.price_solo || prod.harga_solo_rp || 40000) : (prod.price_pusat || prod.harga_pusat_rp || 43500)
    const qty = parseInt(item.quantity) || 1

    const gross = unitPrice * qty
    const hppBawang = prod.hpp_bawang || prod.hpp_produk_beli_rp || 30000
    const hppPouch = prod.hpp_pouch || prod.biaya_kemasan_pouch_rp || 356
    const hppStiker = item.is_repack ? 0 : (prod.hpp_stiker || 4277)
    const hppUnit = hppBawang + hppPouch + hppStiker
    const hppTotal = hppUnit * qty
    const gram = prod.gram || prod.weight_gram || 250

    combinedGrossSales += gross
    combinedTotalHpp += hppTotal
    combinedTotalWeightGram += (gram * qty)

    const name = prod.name || prod.product_name || 'Bawang Goreng'
    const repackStr = item.is_repack ? ' (Pouch Polos)' : ''
    itemsSummaryList.push(`${name} × ${qty} Pouch${repackStr}`)
  })

  const combinedNetProfit = combinedGrossSales - combinedTotalHpp
  const combinedTotalKg = (combinedTotalWeightGram / 1000.0).toFixed(2)

  const handleAddOrder = async (e) => {
    e.preventDefault()
    if (!newOrder.customer_name.trim()) return
    setIsSubmitting(true)

    try {
      const nextInvNum = `INV/2026/08/${(sales.length + 1).toString().padStart(3, '0')}`
      const newId = `so-new-${sales.length + 1}`

      const structuredItems = newOrder.items.map(it => {
        const prod = availableSkus.find(p => (p.sku || p.Kode_SKU) === it.sku) || MASTER_SKUS[0]
        const unitPrice = isSoloArea ? (prod.price_solo || 40000) : (prod.price_pusat || 43500)
        const qty = parseInt(it.quantity) || 1
        const hppBawang = prod.hpp_bawang || 30000
        const hppPouch = prod.hpp_pouch || 356
        const hppStiker = it.is_repack ? 0 : (prod.hpp_stiker || 4277)
        const hppUnit = hppBawang + hppPouch + hppStiker

        return {
          product_name: prod.name || prod.product_name || 'Bawang Goreng',
          weight_gram: prod.gram || 250,
          quantity: qty,
          unit_price: unitPrice,
          subtotal: unitPrice * qty,
          cogs_per_unit: hppUnit,
          cogs_total: hppUnit * qty
        }
      })

      const newSaleObj = {
        id: newId,
        invoice_number: nextInvNum,
        customer_name: newOrder.customer_name.trim(),
        area: newOrder.area,
        order_source: newOrder.order_source,
        transaction_date: new Date().toISOString(),
        total_weight_kg: parseFloat(combinedTotalKg),
        total_amount: combinedGrossSales,
        total_hpp: combinedTotalHpp,
        net_profit: combinedNetProfit,
        payment_status: newOrder.payment_status,
        delivery_status: newOrder.delivery_status,
        shipping_address: newOrder.address || '-',
        notes: newOrder.notes.trim() || 'Pesanan baru terdaftar',
        juragan_sale_items: structuredItems
      }

      setSales(prev => [newSaleObj, ...prev])

      if (isSupabaseConfigured()) {
        const { data: insertedSale } = await supabase.from('juragan_sales').insert([{
          invoice_number: nextInvNum,
          customer_name: newOrder.customer_name.trim(),
          area: newOrder.area,
          order_source: newOrder.order_source,
          total_weight_kg: parseFloat(combinedTotalKg),
          total_amount: combinedGrossSales,
          total_hpp: combinedTotalHpp,
          net_profit: combinedNetProfit,
          payment_status: newOrder.payment_status,
          delivery_status: newOrder.delivery_status,
          shipping_address: newOrder.address || '-',
          notes: newOrder.notes.trim() || 'Pesanan baru terdaftar'
        }]).select()

        if (insertedSale && insertedSale.length > 0) {
          const saleId = insertedSale[0].id
          const saleItemsPayload = structuredItems.map(it => ({
            sale_id: saleId,
            product_name: it.product_name,
            weight_gram: it.weight_gram,
            quantity: it.quantity,
            unit_price: it.unit_price,
            subtotal: it.subtotal,
            cogs_per_unit: it.cogs_per_unit,
            cogs_total: it.cogs_total
          }))
          await supabase.from('juragan_sale_items').insert(saleItemsPayload)
        }
      }

      showToast(`✨ Pesanan ${nextInvNum} berhasil dicatat!`)
      setIsAddModalOpen(false)
      setNewOrder({
        customer_name: '',
        area: 'Jakarta / Jabodetabek',
        order_source: 'whatsapp',
        payment_status: 'belum_lunas',
        delivery_status: 'menunggu_pengiriman',
        address: '',
        notes: '',
        items: [{ sku: 'JBM-250', quantity: 1, is_repack: false }]
      })
    } catch (err) {
      showToast(`Gagal: ${err.message}`)
    } finally {
      setIsSubmitting(false)
    }
  }

  const handleDeleteOrder = async (id, invNum, customerName) => {
    if (!window.confirm(`Hapus pesanan ${invNum} (${customerName})?`)) return
    setSales(prev => prev.filter(s => s.id !== id))
    if (isDetailSheetOpen && selectedSale?.id === id) setIsDetailSheetOpen(false)

    if (isSupabaseConfigured()) {
      try {
        await supabase.from('juragan_sale_items').delete().eq('sale_id', id)
        await supabase.from('juragan_sales').delete().eq('id', id)
      } catch (e) {
        console.warn('DB delete error:', e)
      }
    }
    showToast(`🗑️ Pesanan ${invNum} dihapus`)
  }

  const toggleDeliveryStatus = async (id, currentStatus) => {
    const nextStatus = currentStatus === 'terkirim' ? 'menunggu_pengiriman' : 'terkirim'
    setSales(prev => prev.map(s => s.id === id ? { ...s, delivery_status: nextStatus } : s))
    if (selectedSale?.id === id) {
      setSelectedSale(prev => ({ ...prev, delivery_status: nextStatus }))
    }

    if (isSupabaseConfigured()) {
      try {
        await supabase.from('juragan_sales').update({ delivery_status: nextStatus }).eq('id', id)
      } catch (e) {
        console.warn('DB status update error:', e)
      }
    }
    showToast(`🚚 Status pengiriman diperbarui menjadi ${nextStatus.toUpperCase()}`)
  }

  const togglePaymentStatus = async (id, currentStatus) => {
    const nextStatus = currentStatus === 'lunas' ? 'belum_lunas' : 'lunas'
    setSales(prev => prev.map(s => s.id === id ? { ...s, payment_status: nextStatus } : s))
    if (selectedSale?.id === id) {
      setSelectedSale(prev => ({ ...prev, payment_status: nextStatus }))
    }

    if (isSupabaseConfigured()) {
      try {
        await supabase.from('juragan_sales').update({ payment_status: nextStatus }).eq('id', id)
      } catch (e) {
        console.warn('DB status update error:', e)
      }
    }
    showToast(`💰 Status pembayaran diperbarui menjadi ${nextStatus.toUpperCase()}`)
  }

  const filteredSales = useMemo(() => {
    return sales.filter(s => {
      const matchesSearch =
        (s.customer_name || '').toLowerCase().includes(searchTerm.toLowerCase()) ||
        (s.invoice_number || '').toLowerCase().includes(searchTerm.toLowerCase()) ||
        (s.notes || '').toLowerCase().includes(searchTerm.toLowerCase())

      const matchesStatus =
        statusFilter === 'ALL' ? true :
        statusFilter === 'LUNAS' ? s.payment_status === 'lunas' :
        statusFilter === 'BELUM_LUNAS' ? s.payment_status === 'belum_lunas' :
        statusFilter === 'TERKIRIM' ? s.delivery_status === 'terkirim' :
        statusFilter === 'MENUNGGU' ? s.delivery_status && s.delivery_status.includes('menunggu') : true

      const matchesArea =
        areaFilter === 'ALL' ? true :
        (s.area || '').toLowerCase().includes(areaFilter.toLowerCase())

      return matchesSearch && matchesStatus && matchesArea
    })
  }, [sales, searchTerm, statusFilter, areaFilter])

  const pendingSales = sales.filter(s => s.delivery_status && s.delivery_status.toLowerCase().includes('menunggu'))
  const totalKgPending = pendingSales.reduce((sum, s) => sum + (parseFloat(s.total_weight_kg) || 0), 0)
  const totalGrossOmset = sales.reduce((sum, s) => sum + (parseFloat(s.total_amount) || 0), 0)
  const totalNetProfit = sales.reduce((sum, s) => sum + (parseFloat(s.net_profit) || 0), 0)
  const totalUnpaidAmount = sales.filter(s => s.payment_status === 'belum_lunas').reduce((sum, s) => sum + (parseFloat(s.total_amount) || 0), 0)

  const handleOpenDetail = (sale) => {
    setSelectedSale(sale)
    setIsDetailSheetOpen(true)
  }

  return (
    <div className="space-y-6 text-left font-sans pb-12">
      {/* Toast Notification */}
      {toastMsg && (
        <div className="fixed top-5 right-5 z-50 bg-brand-charcoal text-brand-gold px-5 py-3 rounded-2xl shadow-2xl border border-brand-gold/40 text-xs font-bold flex items-center space-x-2 animate-bounce">
          <Sparkles className="w-4 h-4 text-brand-gold" />
          <span>{toastMsg}</span>
        </div>
      )}

      {/* Header Banner */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 bg-gradient-to-r from-brand-maroon via-brand-maroon-dark to-brand-maroon p-6 rounded-2xl text-white shadow-xl border border-brand-gold/30">
        <div>
          <span className="text-xs uppercase tracking-widest text-brand-gold font-bold">Penjualan & Transaksi</span>
          <h2 className="text-2xl font-black tracking-tight mt-1 text-white">Pesanan & Penjualan Ritel</h2>
          <p className="text-xs text-brand-cream/80 mt-1">Kelola transaksi, pantau piutang aktif, dan kelola rincian item dengan kartu interaktif Gopek-style</p>
        </div>
        <button
          onClick={() => setIsAddModalOpen(true)}
          className="inline-flex items-center space-x-2 px-5 py-3 bg-brand-gold hover:bg-brand-gold-dark text-brand-maroon-dark font-black text-xs rounded-xl shadow-lg transition-all active:scale-95 cursor-pointer border-none"
        >
          <Plus className="w-4 h-4" />
          <span>Catat Pesanan Baru</span>
        </button>
      </div>

      {/* KPI Cards Strip */}
      <div className="grid grid-cols-1 sm:grid-cols-4 gap-4">
        <div className="bg-white p-5 rounded-2xl border-2 border-brand-gold/30 shadow-sm relative overflow-hidden">
          <span className="text-[10px] font-bold text-gray-500 uppercase tracking-wider block">Total Omset Kotor</span>
          <p className="text-2xl font-black text-brand-maroon mt-1">Rp {fmt(totalGrossOmset)}</p>
          <p className="text-xs text-emerald-700 font-bold mt-1">{sales.length} total transaksi</p>
          <TrendingUp className="absolute right-4 bottom-4 w-10 h-10 text-brand-gold/15" />
        </div>

        <div className="bg-white p-5 rounded-2xl border-2 border-amber-300/40 shadow-sm relative overflow-hidden">
          <span className="text-[10px] font-bold text-amber-800 uppercase tracking-wider block">Piutang Aktif (Belum Lunas)</span>
          <p className="text-2xl font-black text-amber-700 mt-1">Rp {fmt(totalUnpaidAmount)}</p>
          <p className="text-xs text-amber-800 font-bold mt-1">{sales.filter(s => s.payment_status === 'belum_lunas').length} invoice pending</p>
        </div>

        <div className="bg-white p-5 rounded-2xl border-2 border-emerald-300/40 shadow-sm relative overflow-hidden">
          <span className="text-[10px] font-bold text-emerald-800 uppercase tracking-wider block">Estimasi Net Profit</span>
          <p className="text-2xl font-black text-emerald-600 mt-1">Rp {fmt(totalNetProfit)}</p>
          <p className="text-xs text-emerald-800 font-bold mt-1">Margin otomatis 3-level HPP</p>
        </div>

        <div className="bg-white p-5 rounded-2xl border-2 border-blue-300/40 shadow-sm relative overflow-hidden">
          <span className="text-[10px] font-bold text-blue-800 uppercase tracking-wider block">Antrean Siap Kirim</span>
          <p className="text-2xl font-black text-blue-600 mt-1">{totalKgPending.toFixed(2)} kg</p>
          <p className="text-xs text-blue-800 font-bold mt-1">{pendingSales.length} paket belum dikirim</p>
        </div>
      </div>

      {/* Search & Filter & View Mode Switcher */}
      <div className="bg-white p-4 rounded-2xl border border-brand-gold/20 shadow-sm flex flex-col sm:flex-row items-center justify-between gap-3">
        <div className="flex-1 w-full flex items-center space-x-2 bg-brand-cream/10 border border-brand-gold/30 rounded-xl px-3 py-2">
          <Search className="w-4 h-4 text-brand-maroon/60 shrink-0" />
          <input
            type="text"
            placeholder="Cari pemesan, invoice, rincian..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full text-xs bg-transparent border-none outline-none font-semibold text-brand-charcoal focus:ring-0"
          />
          {searchTerm && (
            <button onClick={() => setSearchTerm('')} className="text-gray-400 hover:text-gray-600 cursor-pointer border-none bg-transparent">
              <X className="w-3.5 h-3.5" />
            </button>
          )}
        </div>

        <div className="flex flex-wrap items-center space-x-2 w-full sm:w-auto">
          {/* Status Filter */}
          <div className="flex items-center space-x-1.5 bg-brand-cream/10 border border-brand-gold/30 rounded-xl px-3 py-2 text-xs">
            <Filter className="w-3.5 h-3.5 text-brand-maroon shrink-0" />
            <select
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
              className="bg-transparent font-bold text-brand-charcoal outline-none cursor-pointer border-none text-xs"
            >
              <option value="ALL">Semua Status</option>
              <option value="LUNAS">LUNAS ✅</option>
              <option value="BELUM_LUNAS">BELUM LUNAS ⏳</option>
              <option value="MENUNGGU">Menunggu Kirim 🚚</option>
              <option value="TERKIRIM">Terkirim ✅</option>
            </select>
          </div>

          {/* Area Filter */}
          <div className="flex items-center space-x-1.5 bg-brand-cream/10 border border-brand-gold/30 rounded-xl px-3 py-2 text-xs">
            <MapPin className="w-3.5 h-3.5 text-brand-maroon shrink-0" />
            <select
              value={areaFilter}
              onChange={(e) => setAreaFilter(e.target.value)}
              className="bg-transparent font-bold text-brand-charcoal outline-none cursor-pointer border-none text-xs"
            >
              <option value="ALL">Semua Area</option>
              <option value="Jakarta">Jakarta / Jabodetabek</option>
              <option value="Solo">Solo Raya</option>
              <option value="Semarang">Semarang</option>
            </select>
          </div>

          {/* View Switcher Button Group (Card vs Table) */}
          <div className="flex items-center p-1 bg-gray-100 rounded-xl border border-gray-200">
            <button
              onClick={() => setViewMode('card')}
              className={`p-1.5 rounded-lg text-xs font-bold transition-all flex items-center space-x-1 cursor-pointer border-none ${
                viewMode === 'card' ? 'bg-brand-maroon text-brand-gold shadow-sm' : 'text-gray-600 hover:text-gray-900'
              }`}
              title="Tampilan Kartu Interaktif Gopek"
            >
              <LayoutGrid className="w-4 h-4" />
              <span className="hidden md:inline">Kartu</span>
            </button>
            <button
              onClick={() => setViewMode('table')}
              className={`p-1.5 rounded-lg text-xs font-bold transition-all flex items-center space-x-1 cursor-pointer border-none ${
                viewMode === 'table' ? 'bg-brand-maroon text-brand-gold shadow-sm' : 'text-gray-600 hover:text-gray-900'
              }`}
              title="Tampilan Tabel Ringkas"
            >
              <TableIcon className="w-4 h-4" />
              <span className="hidden md:inline">Tabel</span>
            </button>
          </div>

          <button
            onClick={fetchSales}
            className="p-2 text-brand-maroon hover:bg-brand-maroon/10 rounded-xl border border-brand-gold/30 transition-colors cursor-pointer bg-transparent"
            title="Refresh Data"
          >
            <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} />
          </button>
        </div>
      </div>

      {/* ── CARD VIEW (Gopek-style Transaction Cards) ── */}
      {viewMode === 'card' && (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {filteredSales.map((s) => {
            const isLunas = s.payment_status === 'lunas'
            const isTerkirim = s.delivery_status === 'terkirim'
            const firstInitial = (s.customer_name || 'J')[0].toUpperCase()
            const itemsList = s.juragan_sale_items || s.items || []
            const topItem = itemsList[0]

            return (
              <div
                key={s.id}
                onClick={() => handleOpenDetail(s)}
                className="bg-white rounded-2xl border-2 border-brand-gold/30 hover:border-brand-gold p-5 shadow-sm hover:shadow-xl transition-all duration-300 cursor-pointer flex flex-col justify-between group relative text-left"
              >
                <div>
                  {/* Card Header: Avatar + Invoice No + Status Badges */}
                  <div className="flex items-start justify-between gap-3 pb-3 border-b border-brand-gold/15">
                    <div className="flex items-center space-x-3 min-w-0">
                      <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-brand-maroon to-brand-maroon-dark text-brand-gold font-black text-base flex items-center justify-center flex-shrink-0 shadow-md">
                        {firstInitial}
                      </div>
                      <div className="min-w-0">
                        <h3 className="font-black text-sm text-brand-charcoal uppercase truncate group-hover:text-brand-maroon transition-colors">
                          {s.customer_name}
                        </h3>
                        <p className="text-[11px] font-mono font-bold text-gray-500">{s.invoice_number}</p>
                      </div>
                    </div>

                    <div className="flex flex-col items-end gap-1 flex-shrink-0">
                      <span className={`px-2.5 py-0.5 rounded-full text-[9px] font-extrabold uppercase border ${
                        isLunas ? 'bg-emerald-50 text-emerald-700 border-emerald-200' : 'bg-amber-50 text-amber-700 border-amber-200'
                      }`}>
                        {isLunas ? 'LUNAS ✅' : 'BELUM LUNAS ⏳'}
                      </span>
                      <span className={`px-2 py-0.5 rounded-full text-[9px] font-bold uppercase border ${
                        isTerkirim ? 'bg-blue-50 text-blue-700 border-blue-200' : 'bg-amber-50 text-amber-800 border-amber-200'
                      }`}>
                        {isTerkirim ? 'Terkirim 🚚' : 'Menunggu Kirim 📦'}
                      </span>
                    </div>
                  </div>

                  {/* Card Body: Item Name, Area, Weight, Financial Summary */}
                  <div className="py-4 space-y-2.5">
                    {/* Item Name from Database */}
                    <div className="flex items-center space-x-1.5 bg-brand-cream/30 p-2 rounded-xl border border-brand-gold/20">
                      <ShoppingBag className="w-4 h-4 text-brand-maroon shrink-0" />
                      <span className="font-bold text-xs text-brand-charcoal truncate">
                        {topItem ? `${topItem.quantity}× ${topItem.product_name}` : 'Bawang Goreng Boyolali'}
                        {itemsList.length > 1 && ` (+${itemsList.length - 1} item)`}
                      </span>
                    </div>

                    <div className="flex items-center justify-between text-xs text-gray-600 px-1">
                      <span className="flex items-center space-x-1 font-semibold">
                        <MapPin className="w-3.5 h-3.5 text-brand-gold" />
                        <span>{s.area || 'Solo Raya'}</span>
                      </span>
                      <span className="font-bold text-brand-maroon">{s.total_weight_kg} kg</span>
                    </div>

                    <div className="p-3 bg-brand-cream/15 rounded-xl border border-brand-gold/20 flex justify-between items-center">
                      <div>
                        <span className="text-[9px] font-bold text-gray-400 uppercase tracking-widest block">Total Omset</span>
                        <span className="text-base font-black font-mono text-brand-maroon">Rp {fmt(s.total_amount)}</span>
                      </div>
                      <div className="text-right">
                        <span className="text-[9px] font-bold text-gray-400 uppercase tracking-widest block">Estimasi Laba</span>
                        <span className="text-xs font-black font-mono text-emerald-600">+Rp {fmt(s.net_profit)}</span>
                      </div>
                    </div>

                    {s.notes && (
                      <p className="text-xs text-gray-500 line-clamp-1 italic px-1">
                        Catatan: "{s.notes}"
                      </p>
                    )}
                  </div>
                </div>

                {/* Card Footer Actions */}
                <div className="pt-3 border-t border-brand-gold/15 flex items-center justify-between">
                  <span className="text-[11px] font-bold text-brand-gold-dark group-hover:text-brand-maroon transition-colors flex items-center space-x-1">
                    <span>Lihat Rincian Item</span>
                    <ArrowUpRight className="w-3.5 h-3.5" />
                  </span>
                  <div className="flex items-center space-x-1" onClick={(e) => e.stopPropagation()}>
                    <button
                      onClick={() => togglePaymentStatus(s.id, s.payment_status)}
                      className="p-1.5 hover:bg-gray-100 rounded-lg text-gray-500 hover:text-brand-maroon cursor-pointer border-none bg-transparent"
                      title="Ubah Status Bayar"
                    >
                      <CheckCircle2 className="w-4 h-4" />
                    </button>
                    <button
                      onClick={() => handleDeleteOrder(s.id, s.invoice_number, s.customer_name)}
                      className="p-1.5 hover:bg-rose-50 rounded-lg text-rose-500 cursor-pointer border-none bg-transparent"
                      title="Hapus Pesanan"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                </div>
              </div>
            )
          })}
        </div>
      )}

      {/* ── TABLE VIEW (Formatted Interactive Table) ── */}
      {viewMode === 'table' && (
        <div className="bg-white rounded-2xl border border-brand-gold/20 shadow-sm overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="bg-brand-charcoal text-brand-gold uppercase text-[10px] tracking-wider font-bold">
                <tr>
                  <th className="p-3.5">No Invoice</th>
                  <th className="p-3.5">Pemesan & Area</th>
                  <th className="p-3.5">Berat</th>
                  <th className="p-3.5">Total Harga</th>
                  <th className="p-3.5">Pembayaran</th>
                  <th className="p-3.5">Pengiriman</th>
                  <th className="p-3.5">Detail Item Produk</th>
                  <th className="p-3.5 text-center">Aksi</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-brand-maroon/10">
                {filteredSales.map((s) => {
                  const itemsList = s.juragan_sale_items || s.items || []
                  const itemSummaryText = itemsList.map(it => `${it.product_name} (${it.quantity}×)`).join(', ') || 'Bawang Goreng'

                  return (
                    <tr
                      key={s.id}
                      onClick={() => handleOpenDetail(s)}
                      className="hover:bg-brand-cream/20 transition-colors cursor-pointer"
                    >
                      <td className="p-3.5 font-bold font-mono text-brand-maroon">{s.invoice_number}</td>
                      <td className="p-3.5">
                        <div className="font-extrabold text-brand-charcoal flex items-center space-x-1.5 uppercase">
                          <User className="w-3.5 h-3.5 text-brand-maroon/60" />
                          <span>{s.customer_name}</span>
                        </div>
                        <div className="text-[10px] text-gray-500 flex items-center space-x-1 mt-0.5">
                          <MapPin className="w-3.5 h-3.5 text-brand-gold" />
                          <span>{s.area || 'Solo Raya'}</span>
                        </div>
                      </td>
                      <td className="p-3.5 font-bold text-brand-maroon">{s.total_weight_kg} kg</td>
                      <td className="p-3.5 font-bold text-brand-charcoal font-mono">Rp {fmt(s.total_amount)}</td>

                      <td className="p-3.5" onClick={(e) => e.stopPropagation()}>
                        <button
                          onClick={() => togglePaymentStatus(s.id, s.payment_status)}
                          className="cursor-pointer transition-transform active:scale-95 border-none bg-transparent"
                          title="Klik untuk ubah status pembayaran"
                        >
                          {s.payment_status === 'lunas' ? (
                            <span className="px-2.5 py-1 bg-emerald-100 text-emerald-800 rounded-full font-bold text-[10px] inline-flex items-center space-x-1 border border-emerald-300">
                              <span>LUNAS ✅</span>
                            </span>
                          ) : (
                            <span className="px-2.5 py-1 bg-amber-100 text-amber-800 rounded-full font-bold text-[10px] inline-flex items-center space-x-1 border border-amber-300">
                              <span>BELUM LUNAS ⏳</span>
                            </span>
                          )}
                        </button>
                      </td>

                      <td className="p-3.5" onClick={(e) => e.stopPropagation()}>
                        <button
                          onClick={() => toggleDeliveryStatus(s.id, s.delivery_status)}
                          className="cursor-pointer transition-transform active:scale-95 border-none bg-transparent"
                          title="Klik untuk ubah status pengiriman"
                        >
                          {s.delivery_status === 'terkirim' ? (
                            <span className="px-2.5 py-1 bg-emerald-100 text-emerald-800 rounded-full font-bold text-[10px] inline-flex items-center space-x-1 border border-emerald-300">
                              <span>Terkirim</span>
                            </span>
                          ) : (
                            <span className="px-2.5 py-1 bg-blue-100 text-blue-800 rounded-full font-bold text-[10px] inline-flex items-center space-x-1 border border-blue-300">
                              <span>Menunggu Kirim</span>
                            </span>
                          )}
                        </button>
                      </td>

                      <td className="p-3.5 text-gray-800 font-medium max-w-xs truncate">
                        {itemSummaryText}
                      </td>
                      <td className="p-3.5 text-center" onClick={(e) => e.stopPropagation()}>
                        <button
                          onClick={() => handleDeleteOrder(s.id, s.invoice_number, s.customer_name)}
                          className="p-1.5 text-rose-500 hover:bg-rose-50 rounded-lg transition-colors cursor-pointer border-none bg-transparent"
                          title="Hapus Pesanan"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </td>
                    </tr>
                  )
                })}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* ── DETAIL SHEET MODAL (Gopek-style Transaction Detail) ── */}
      {isDetailSheetOpen && selectedSale && (
        <div className="fixed inset-0 z-50 flex justify-end bg-black/50 backdrop-blur-sm animate-in fade-in duration-200">
          <div className="bg-white w-full max-w-md h-full shadow-2xl flex flex-col justify-between overflow-y-auto animate-in slide-in-from-right duration-300 text-left border-l-2 border-brand-gold">
            {/* Sheet Header */}
            <div className="p-6 border-b border-brand-maroon/10 bg-gradient-to-r from-brand-maroon to-brand-maroon-dark text-white relative">
              <button
                onClick={() => setIsDetailSheetOpen(false)}
                className="absolute top-5 right-5 text-white/70 hover:text-white cursor-pointer border-none bg-transparent"
              >
                <X className="w-5 h-5" />
              </button>

              <span className="text-[10px] font-bold uppercase tracking-widest text-brand-gold">Detail Pesanan & Rincian Nota</span>
              <h3 className="text-xl font-black mt-1 text-white">{selectedSale.invoice_number}</h3>
              <p className="text-xs text-brand-cream/80">{selectedSale.customer_name} • {selectedSale.area}</p>
            </div>

            {/* Sheet Content Body */}
            <div className="p-6 space-y-5 flex-1 overflow-y-auto text-xs text-brand-charcoal">
              {/* Customer & Address */}
              <div className="p-4 bg-brand-cream/20 rounded-2xl border border-brand-gold/30 space-y-2">
                <div className="flex justify-between items-center">
                  <span className="text-[10px] font-bold uppercase text-gray-500">Pemesan</span>
                  <span className="font-extrabold text-brand-maroon uppercase text-sm">{selectedSale.customer_name}</span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-[10px] font-bold uppercase text-gray-500">Area Wilayah</span>
                  <span className="font-bold text-gray-700">{selectedSale.area}</span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-[10px] font-bold uppercase text-gray-500">Total Berat</span>
                  <span className="font-bold text-brand-maroon">{selectedSale.total_weight_kg} kg</span>
                </div>
              </div>

              {/* DAFTAR BARANG TABLE (Fetched dynamically from Database / Relational Item Array) */}
              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <span className="text-[10px] font-bold uppercase text-brand-maroon tracking-wider flex items-center space-x-1">
                    <PackageCheck className="w-3.5 h-3.5 text-brand-gold" />
                    <span>Daftar Barang ({selectedSale.juragan_sale_items?.length || selectedSale.items?.length || 1} Item)</span>
                  </span>
                  <span className="text-[10px] text-gray-400 font-medium">Relational DB Item</span>
                </div>

                <div className="bg-gray-50 rounded-2xl border border-gray-200 overflow-hidden">
                  <table className="w-full text-left text-xs border-collapse">
                    <thead className="bg-gray-100 border-b border-gray-200 text-[10px] font-bold uppercase text-gray-500">
                      <tr>
                        <th className="p-3">Produk</th>
                        <th className="p-3 text-center">Qty</th>
                        <th className="p-3 text-right">Harga</th>
                        <th className="p-3 text-right">Subtotal</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-gray-200">
                      {(selectedSale.juragan_sale_items || selectedSale.items || []).map((it, idx) => (
                        <tr key={idx} className="hover:bg-white transition-colors">
                          <td className="p-3 font-extrabold text-brand-charcoal">{it.product_name}</td>
                          <td className="p-3 text-center font-bold text-brand-maroon">{it.quantity} pack</td>
                          <td className="p-3 text-right font-mono text-gray-600">Rp {fmt(it.unit_price)}</td>
                          <td className="p-3 text-right font-mono font-bold text-brand-maroon">Rp {fmt(it.subtotal)}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>

              {/* Status Badges */}
              <div className="grid grid-cols-2 gap-3">
                <div className="p-3 rounded-xl border bg-gray-50 space-y-1">
                  <span className="text-[10px] font-bold uppercase text-gray-400 block">Status Pembayaran</span>
                  <button
                    onClick={() => togglePaymentStatus(selectedSale.id, selectedSale.payment_status)}
                    className="cursor-pointer border-none bg-transparent"
                  >
                    {selectedSale.payment_status === 'lunas' ? (
                      <span className="px-2.5 py-1 bg-emerald-100 text-emerald-800 rounded-full font-bold text-[10px] inline-flex items-center space-x-1 border border-emerald-300">
                        <span>LUNAS ✅</span>
                      </span>
                    ) : (
                      <span className="px-2.5 py-1 bg-amber-100 text-amber-800 rounded-full font-bold text-[10px] inline-flex items-center space-x-1 border border-amber-300">
                        <span>BELUM LUNAS ⏳</span>
                      </span>
                    )}
                  </button>
                </div>

                <div className="p-3 rounded-xl border bg-gray-50 space-y-1">
                  <span className="text-[10px] font-bold uppercase text-gray-400 block">Status Pengiriman</span>
                  <button
                    onClick={() => toggleDeliveryStatus(selectedSale.id, selectedSale.delivery_status)}
                    className="cursor-pointer border-none bg-transparent"
                  >
                    {selectedSale.delivery_status === 'terkirim' ? (
                      <span className="px-2.5 py-1 bg-emerald-100 text-emerald-800 rounded-full font-bold text-[10px] inline-flex items-center space-x-1 border border-emerald-300">
                        <span>Terkirim 🚚</span>
                      </span>
                    ) : (
                      <span className="px-2.5 py-1 bg-blue-100 text-blue-800 rounded-full font-bold text-[10px] inline-flex items-center space-x-1 border border-blue-300">
                        <span>Menunggu Kirim 📦</span>
                      </span>
                    )}
                  </button>
                </div>
              </div>

              {/* Financial Calculation Breakdown */}
              <div className="p-4 bg-white rounded-2xl border-2 border-brand-gold/30 shadow-sm space-y-2">
                <span className="text-[10px] font-bold uppercase text-brand-maroon tracking-wider block">Rincian Finansial & HPP</span>
                <div className="flex justify-between py-1 border-b border-gray-100">
                  <span className="text-gray-500">Total Omset Kotor</span>
                  <span className="font-mono font-bold text-gray-900">Rp {fmt(selectedSale.total_amount)}</span>
                </div>
                <div className="flex justify-between py-1 border-b border-gray-100">
                  <span className="text-gray-500">Total HPP Modal</span>
                  <span className="font-mono font-bold text-amber-700">-Rp {fmt(selectedSale.total_hpp)}</span>
                </div>
                <div className="flex justify-between pt-1">
                  <span className="font-bold text-gray-900">Estimasi Laba Bersih</span>
                  <span className="font-mono font-black text-emerald-600 text-sm">+Rp {fmt(selectedSale.net_profit)}</span>
                </div>
              </div>

              {/* Real Customer Notes */}
              {selectedSale.notes && (
                <div className="space-y-1">
                  <span className="text-[10px] font-bold uppercase text-gray-500">Catatan Khusus Pelanggan</span>
                  <div className="p-3 bg-amber-50/60 rounded-xl border border-amber-200/60 text-amber-900 italic">
                    "{selectedSale.notes}"
                  </div>
                </div>
              )}
            </div>

            {/* Sheet Footer Quick Actions */}
            <div className="p-5 border-t border-brand-maroon/10 bg-gray-50 space-y-2">
              <div className="grid grid-cols-2 gap-2">
                <button
                  onClick={() => toggleDeliveryStatus(selectedSale.id, selectedSale.delivery_status)}
                  className="w-full py-2.5 px-3 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl font-bold text-xs flex items-center justify-center space-x-1 cursor-pointer border-none"
                >
                  <CheckCircle2 className="w-4 h-4" />
                  <span>{selectedSale.delivery_status === 'terkirim' ? 'Batal Kirim' : 'Mark Terkirim'}</span>
                </button>
                <button
                  onClick={() => togglePaymentStatus(selectedSale.id, selectedSale.payment_status)}
                  className="w-full py-2.5 px-3 bg-brand-gold hover:bg-brand-gold-dark text-brand-maroon-dark rounded-xl font-black text-xs flex items-center justify-center space-x-1 cursor-pointer border-none"
                >
                  <Check className="w-4 h-4" />
                  <span>{selectedSale.payment_status === 'lunas' ? 'Set Belum Lunas' : 'Set LUNAS'}</span>
                </button>
              </div>

              <button
                onClick={() => handleDeleteOrder(selectedSale.id, selectedSale.invoice_number, selectedSale.customer_name)}
                className="w-full py-2 px-3 bg-rose-50 text-rose-600 hover:bg-rose-100 rounded-xl font-bold text-xs flex items-center justify-center space-x-1 cursor-pointer border border-rose-200"
              >
                <Trash2 className="w-3.5 h-3.5" />
                <span>Hapus Transaksi Ini</span>
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ── ADD ORDER MODAL ── */}
      {isAddModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm overflow-y-auto">
          <div className="bg-white rounded-2xl border-2 border-brand-gold p-6 max-w-2xl w-full shadow-2xl space-y-4 text-left my-8">
            <div className="border-b border-brand-maroon/10 pb-3 flex justify-between items-center">
              <div>
                <h3 className="font-black text-lg text-brand-maroon">Catat Pesanan Multi-Item</h3>
                <p className="text-[11px] text-gray-500">Mencatat pesanan banyak produk sekaligus langsung ke Supabase DB</p>
              </div>
              <button onClick={() => setIsAddModalOpen(false)} className="text-gray-400 hover:text-gray-600 cursor-pointer border-none bg-transparent">
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleAddOrder} className="space-y-4 text-xs">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="font-bold text-gray-700 block mb-1">Nama Pemesan / Pelanggan *</label>
                  <input
                    type="text"
                    required
                    placeholder="Contoh: Yatmo / Farhan / Didi"
                    value={newOrder.customer_name}
                    onChange={(e) => setNewOrder({ ...newOrder, customer_name: e.target.value })}
                    className="w-full border border-gray-300 rounded-xl p-2.5 font-semibold text-gray-900 outline-none focus:border-brand-gold"
                  />
                </div>

                <div>
                  <label className="font-bold text-gray-700 block mb-1">Area Wilayah Pengiriman</label>
                  <select
                    value={newOrder.area}
                    onChange={(e) => setNewOrder({ ...newOrder, area: e.target.value })}
                    className="w-full border border-gray-300 rounded-xl p-2.5 font-bold text-gray-900 outline-none focus:border-brand-gold cursor-pointer"
                  >
                    <option value="Jakarta / Jabodetabek">Jakarta / Jabodetabek (Harga Pusat)</option>
                    <option value="Solo Raya">Solo Raya (Harga Solo)</option>
                    <option value="Semarang">Semarang (Harga Pusat)</option>
                  </select>
                </div>
              </div>

              {/* Items List inside Form */}
              <div className="space-y-3 pt-2">
                <div className="flex justify-between items-center">
                  <span className="font-black text-brand-maroon uppercase tracking-wider text-[11px]">Daftar Item Produk dalam Pesanan</span>
                  <button
                    type="button"
                    onClick={handleAddItemRow}
                    className="text-xs font-bold text-brand-maroon hover:underline flex items-center space-x-1 cursor-pointer border-none bg-transparent"
                  >
                    <Plus className="w-3.5 h-3.5" />
                    <span>Tambah Item Produk</span>
                  </button>
                </div>

                {newOrder.items.map((item, idx) => (
                  <div key={idx} className="p-3 bg-brand-cream/15 rounded-xl border border-brand-gold/30 space-y-2 relative">
                    <div className="grid grid-cols-1 sm:grid-cols-12 gap-2 items-center">
                      <div className="sm:col-span-6">
                        <label className="text-[10px] font-bold text-gray-500 block mb-0.5">Varian SKU Produk</label>
                        <select
                          value={item.sku}
                          onChange={(e) => handleUpdateItemRow(idx, 'sku', e.target.value)}
                          className="w-full border border-gray-300 rounded-lg p-2 font-semibold text-gray-900 outline-none focus:border-brand-gold cursor-pointer text-xs"
                        >
                          {availableSkus.map(p => (
                            <option key={p.sku || p.Kode_SKU} value={p.sku || p.Kode_SKU}>
                              {p.name || p.product_name} - Rp {fmt(isSoloArea ? (p.price_solo || p.harga_solo_rp || 40000) : (p.price_pusat || p.harga_pusat_rp || 43500))}
                            </option>
                          ))}
                        </select>
                      </div>

                      <div className="sm:col-span-3">
                        <label className="text-[10px] font-bold text-gray-500 block mb-0.5">Jumlah Pack</label>
                        <input
                          type="number"
                          min="1"
                          value={item.quantity}
                          onChange={(e) => handleUpdateItemRow(idx, 'quantity', e.target.value)}
                          className="w-full border border-gray-300 rounded-lg p-2 font-bold text-gray-900 text-center outline-none focus:border-brand-gold text-xs"
                        />
                      </div>

                      <div className="sm:col-span-3 flex items-center justify-between pt-4 sm:pt-0">
                        <label className="flex items-center space-x-1.5 cursor-pointer text-[11px] font-semibold text-gray-700">
                          <input
                            type="checkbox"
                            checked={item.is_repack}
                            onChange={(e) => handleUpdateItemRow(idx, 'is_repack', e.target.checked)}
                            className="rounded border-gray-300 text-brand-maroon focus:ring-brand-gold"
                          />
                          <span>Pouch Polos</span>
                        </label>

                        {newOrder.items.length > 1 && (
                          <button
                            type="button"
                            onClick={() => handleRemoveItemRow(idx)}
                            className="text-rose-500 hover:text-rose-700 p-1 cursor-pointer border-none bg-transparent"
                            title="Hapus Baris Ini"
                          >
                            <Trash2 className="w-4 h-4" />
                          </button>
                        )}
                      </div>
                    </div>
                  </div>
                ))}
              </div>

              {/* Status and Address */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 pt-2">
                <div>
                  <label className="font-bold text-gray-700 block mb-1">Status Pembayaran</label>
                  <select
                    value={newOrder.payment_status}
                    onChange={(e) => setNewOrder({ ...newOrder, payment_status: e.target.value })}
                    className="w-full border border-gray-300 rounded-xl p-2.5 font-bold text-gray-900 outline-none focus:border-brand-gold cursor-pointer"
                  >
                    <option value="belum_lunas">BELUM LUNAS ⏳</option>
                    <option value="lunas">LUNAS ✅</option>
                  </select>
                </div>

                <div>
                  <label className="font-bold text-gray-700 block mb-1">Status Pengiriman</label>
                  <select
                    value={newOrder.delivery_status}
                    onChange={(e) => setNewOrder({ ...newOrder, delivery_status: e.target.value })}
                    className="w-full border border-gray-300 rounded-xl p-2.5 font-bold text-gray-900 outline-none focus:border-brand-gold cursor-pointer"
                  >
                    <option value="menunggu_pengiriman">Menunggu Kirim 📦</option>
                    <option value="terkirim">Terkirim 🚚</option>
                  </select>
                </div>
              </div>

              <div>
                <label className="font-bold text-gray-700 block mb-1">Alamat Lengkap Pengiriman (Opsional)</label>
                <input
                  type="text"
                  placeholder="Contoh: Jl. Bulusan Selatan Raya No.9a, Tembalang, Semarang"
                  value={newOrder.address}
                  onChange={(e) => setNewOrder({ ...newOrder, address: e.target.value })}
                  className="w-full border border-gray-300 rounded-xl p-2.5 font-semibold text-gray-900 outline-none focus:border-brand-gold"
                />
              </div>

              <div>
                <label className="font-bold text-gray-700 block mb-1">Catatan Khusus Pesanan</label>
                <textarea
                  rows="2"
                  placeholder="Contoh: Tanpa stiker, titip pos satpam, dll..."
                  value={newOrder.notes}
                  onChange={(e) => setNewOrder({ ...newOrder, notes: e.target.value })}
                  className="w-full border border-gray-300 rounded-xl p-2.5 font-semibold text-gray-900 outline-none focus:border-brand-gold"
                />
              </div>

              {/* Order Calculation Preview Strip */}
              <div className="p-4 bg-brand-maroon/5 border border-brand-gold/40 rounded-2xl space-y-1.5">
                <div className="flex justify-between items-center text-xs">
                  <span className="font-bold text-gray-600">Total Berat:</span>
                  <span className="font-black text-brand-maroon">{combinedTotalKg} kg</span>
                </div>
                <div className="flex justify-between items-center text-xs">
                  <span className="font-bold text-gray-600">Total HPP Modal:</span>
                  <span className="font-mono font-bold text-amber-700">Rp {fmt(combinedTotalHpp)}</span>
                </div>
                <div className="flex justify-between items-center text-sm pt-1 border-t border-brand-gold/20">
                  <span className="font-black text-brand-maroon">Total Omset Kotor:</span>
                  <span className="font-mono font-black text-brand-maroon text-base">Rp {fmt(combinedGrossSales)}</span>
                </div>
              </div>

              <div className="pt-2 flex justify-end space-x-3">
                <button
                  type="button"
                  onClick={() => setIsAddModalOpen(false)}
                  className="px-5 py-2.5 border border-gray-300 rounded-xl font-bold text-gray-600 hover:bg-gray-100 cursor-pointer bg-transparent"
                >
                  Batal
                </button>
                <button
                  type="submit"
                  disabled={isSubmitting}
                  className="px-6 py-2.5 bg-brand-gold hover:bg-brand-gold-dark text-brand-maroon-dark font-black rounded-xl shadow-md transition-all cursor-pointer border-none"
                >
                  {isSubmitting ? 'Menyimpan...' : 'Simpan Pesanan'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  )
}
