import React, { useState, useMemo, useEffect, useCallback } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { RotateCcw, Plus, Search, Filter, AlertCircle, CheckCircle2, Clock, PackageX, User, Store, ArrowUpRight, ArrowDownLeft, X, ChevronDown, Check, FileText, Link2, Loader2, Trash2 } from 'lucide-react'
import { toast } from 'sonner'
import { BrokerMobileHeader } from '@/dashboard/broker/_shared/components/BrokerMobileHeader'
import { SembakoPageHeader } from '@/dashboard/broker/sembako_broker/components/SembakoPageHeader'
import { SembakoSummaryStrip } from '@/dashboard/broker/sembako_broker/components/SembakoSummaryStrip'
import { C, CustomSelect } from '@/dashboard/broker/sembako_broker/components/sembakoSaleUtils'
import {
  useSembakoProducts,
  useSembakoCustomers,
  useSembakoSuppliers,
  useSembakoSales,
  useSembakoReturns,
  useCreateSembakoReturn,
  useUpdateSembakoReturnStatus,
  useDeleteSembakoReturn
} from '@/lib/hooks/useSembakoData'
import { useNavigate, useParams, useOutletContext, useLocation } from 'react-router-dom'
import { useMediaQuery } from '@/lib/hooks/useMediaQuery'
import { useBackHandler } from '@/lib/hooks/useBackHandler'
import { formatDate } from '@/lib/format'

const fmt = (n) => new Intl.NumberFormat('id-ID').format(Math.round(n || 0))

export default function SembakoRetur() {
  const { brokerType } = useParams()
  const navigate = useNavigate()
  const location = useLocation()
  const isDesktop = useMediaQuery('(min-width: 1024px)')
  const { setSidebarOpen = () => window.dispatchEvent(new Event('toggleMobileSidebar')) } = useOutletContext() || {}

  const { data: products = [] } = useSembakoProducts()
  const { data: customers = [] } = useSembakoCustomers()
  const { data: suppliers = [] } = useSembakoSuppliers()
  const { data: salesList = [] } = useSembakoSales()

  const { data: returnsList = [], isLoading: returnsLoading } = useSembakoReturns()
  const createReturnMut = useCreateSembakoReturn()
  const updateStatusMut = useUpdateSembakoReturnStatus()
  const deleteReturnMut = useDeleteSembakoReturn()

  const [search, setSearch] = useState('')
  const [filterType, setFilterType] = useState('all') // 'all', 'sale_return', 'purchase_return'
  const [sheetOpen, setSheetOpen] = useState(() => {
    const params = new URLSearchParams(window.location.search)
    const act = params.get('action')
    return act === 'new' || act === 'tambah'
  })

  // Sync URL action=new to sheetOpen state
  useEffect(() => {
    const params = new URLSearchParams(location.search)
    const action = params.get('action')
    if (action === 'new' || action === 'tambah') {
      setSheetOpen(true)
    }
  }, [location.search])

  // Confirmation state for deleting/cancelling retur
  const [confirmCancelReturn, setConfirmCancelReturn] = useState(null)
  const [selectedReturnDetail, setSelectedReturnDetail] = useState(null)

  const handleCloseSheet = useCallback(() => {
    setSheetOpen(false)
    const params = new URLSearchParams(location.search)
    if (params.get('action')) {
      params.delete('action')
      const searchStr = params.toString()
      navigate(location.pathname + (searchStr ? `?${searchStr}` : ''), { replace: true })
    }
  }, [location.search, location.pathname, navigate])

  // Close modal on Android hardware back button or Escape
  useBackHandler(sheetOpen, handleCloseSheet)

  // Form State for new Return
  const [form, setForm] = useState({
    selection_mode: 'transaction', // 'transaction' or 'manual'
    type: 'sale_return',
    sale_id: '',
    customer_id: '',
    supplier_id: '',
    party_name: '',
    product_id: '',
    product_name: '',
    quantity: 1,
    unit: 'pcs',
    unit_price: '',
    reason: 'Kemasan Rusak / Cacat',
    action: 'fifo_stock',
    financial_action: 'potong_piutang',
    notes: '',
  })

  // Currently selected transaction/sale object
  const selectedSale = useMemo(() => {
    if (!form.sale_id) return null
    return salesList.find(s => s.id === form.sale_id)
  }, [form.sale_id, salesList])

  // Available items in the selected sale
  const saleItems = useMemo(() => {
    if (!selectedSale) return []
    return selectedSale.sembako_sale_items || selectedSale.items || []
  }, [selectedSale])

  // When sale is picked, auto-set party name and customer id
  const handleSelectSale = (saleId) => {
    const saleObj = salesList.find(s => s.id === saleId)
    if (!saleObj) return
    const firstItem = (saleObj.sembako_sale_items && saleObj.sembako_sale_items[0]) || (saleObj.items && saleObj.items[0])
    setForm(f => ({
      ...f,
      sale_id: saleId,
      customer_id: saleObj.customer_id || '',
      party_name: saleObj.sembako_customers?.customer_name || saleObj.customer_name || '',
      product_id: firstItem?.product_id || '',
      product_name: firstItem?.product_name || '',
      quantity: 1,
      unit: firstItem?.unit || 'pcs',
      unit_price: firstItem?.price_per_unit || firstItem?.sell_price || '',
    }))
  }

  // When specific item in sale is selected
  const handleSelectSaleItem = (productId) => {
    const itemObj = saleItems.find(it => it.product_id === productId)
    if (!itemObj) return
    const uPrice = itemObj.price_per_unit || itemObj.sell_price || itemObj.unit_price || 0
    const uUnit = itemObj.unit || 'pcs'
    const pName = itemObj.product_name || 'Produk'
    const qty = Number(itemObj.quantity || 1)
      
    setForm(prev => ({
      ...prev,
      product_id: itemObj.product_id || productId,
      product_name: pName,
      quantity: qty,
      unit: uUnit,
      unit_price: uPrice,
    }))
  }

  const handleCreateReturn = async (e) => {
    e.preventDefault()
    if (createReturnMut.isPending) return
    if (!form.party_name.trim()) return toast.error('Nama Toko / Supplier wajib diisi')
    if (!form.product_id) return toast.error('Pilih produk yang diretur')
    if (!form.quantity || form.quantity <= 0) return toast.error('Jumlah retur tidak valid')

    const selectedProduct = products.find(p => p.id === form.product_id)
    const unitPrice = form.unit_price ? Number(String(form.unit_price).replace(/\D/g, '')) : (selectedProduct?.sell_price || 0)
    const totalAmount = unitPrice * Number(form.quantity)

    await createReturnMut.mutateAsync({
      return_type: form.type,
      party_name: form.party_name,
      product_id: form.product_id,
      product_name: form.product_name || (selectedProduct ? selectedProduct.product_name : 'Produk Sembako'),
      customer_id: form.customer_id || null,
      supplier_id: form.supplier_id || null,
      sale_id: form.sale_id || null,
      quantity: Number(form.quantity),
      unit: form.unit,
      unit_price: unitPrice,
      total_amount: totalAmount,
      reason: form.reason,
      action: form.action,
      financial_action: form.financial_action || 'potong_piutang',
      notes: form.notes,
    })

    setSheetOpen(false)
    setForm({
      selection_mode: 'transaction',
      type: 'sale_return',
      sale_id: '',
      customer_id: '',
      supplier_id: '',
      party_name: '',
      product_id: '',
      product_name: '',
      quantity: 1,
      unit: 'pcs',
      unit_price: '',
      reason: 'Kemasan Rusak / Cacat',
      action: 'fifo_stock',
      financial_action: 'potong_piutang',
      notes: '',
    })
  }

  const handleToggleStatus = async (id, currentStatus) => {
    const nextStatus = currentStatus === 'pending' ? 'completed' : 'pending'
    await updateStatusMut.mutateAsync({ id, status: nextStatus })
    toast.info(`Status retur diubah ke ${nextStatus === 'completed' ? 'Selesai' : 'Diproses'}`)
  }

  const handleCancelReturn = async (rObj) => {
    await deleteReturnMut.mutateAsync(rObj)
    setConfirmCancelReturn(null)
  }

  const filteredReturns = useMemo(() => {
    return returnsList.filter(r => {
      const invoiceNo = r.sembako_sales?.invoice_number || ''
      const matchSearch = r.party_name.toLowerCase().includes(search.toLowerCase()) ||
        r.product_name.toLowerCase().includes(search.toLowerCase()) ||
        invoiceNo.toLowerCase().includes(search.toLowerCase()) ||
        r.id.toLowerCase().includes(search.toLowerCase())
      const matchType = filterType === 'all' ? true : (r.return_type || r.type) === filterType
      return matchSearch && matchType
    })
  }, [returnsList, search, filterType])

  const totalReturnAmount = useMemo(() => {
    return returnsList.reduce((acc, curr) => acc + Number(curr.total_amount || curr.amount || 0), 0)
  }, [returnsList])

  const pendingCount = useMemo(() => {
    return returnsList.filter(r => r.status === 'pending').length
  }, [returnsList])

  const summaryItems = [
    { label: 'Total Retur', value: `${returnsList.length} Transaksi`, color: 'amber', subLabel: `${pendingCount} perlu diproses` },
    { label: 'Nilai Barang Diretur', value: totalReturnAmount, isCurrency: true, color: 'red', subLabel: 'Penjualan & Pembelian' },
    { label: 'Penanganan Stok', value: 'FIFO Reversal', color: 'green', subLabel: 'Stok gudang otomatis terupdate' },
  ]

  const typeFilters = [
    { id: 'all', label: 'Semua Retur' },
    { id: 'sale_return', label: 'Retur Pelanggan (Jual)' },
    { id: 'purchase_return', label: 'Retur Pabrik (Beli)' },
  ]

  return (
    <div className="bg-background min-h-screen text-foreground pb-28 text-left">
      {!isDesktop && <BrokerMobileHeader title="Retur Produk" onMenuClick={() => setSidebarOpen(true)} />}

      <div className="mx-auto max-w-7xl">
        <SembakoPageHeader
          title="Retur Produk"
          subtitle="Pencatatan klaim barang cacat & pelacakan retur berbasis nota transaksi"
          isDesktop={isDesktop}
          searchQuery={search}
          onSearchChange={setSearch}
          searchPlaceholder="Cari toko, no invoice, produk, atau ID retur..."
          filters={typeFilters}
          activeFilter={filterType}
          onFilterChange={setFilterType}
          actionButton={
            <button
              onClick={() => setSheetOpen(true)}
              className="flex items-center gap-2 px-4 h-10 rounded-xl font-bold text-xs bg-[#0F172A] hover:bg-slate-900 text-white transition-all cursor-pointer shadow-lg shadow-slate-950/10 active:scale-95 shrink-0"
            >
              <Plus size={16} />
              <span>Catat Retur Baru</span>
            </button>
          }
        />

        <SembakoSummaryStrip items={summaryItems} />

        {/* Returns List */}
        <div className="px-4 sm:px-6 pt-2">
          {filteredReturns.length === 0 ? (
            <div className="bg-card border border-border/60 rounded-2xl p-12 text-center text-muted-foreground">
              <RotateCcw size={36} className="mx-auto mb-3 opacity-30 text-[#0F172A]" />
              <p className="text-base font-bold text-foreground">Belum ada riwayat retur produk</p>
              <p className="text-xs text-muted-foreground mt-1 max-w-sm mx-auto">Klik "+ Catat Retur Baru" untuk menambah klaim produk berdasarkan transaksi nota toko atau ke supplier.</p>
            </div>
          ) : (
            <div className="space-y-3">
              {filteredReturns.map(r => {
                const rType = r.return_type || r.type || 'sale_return'
                const invNumber = r.sembako_sales?.invoice_number || (r.sale_id ? `Invoice ID: ${r.sale_id.slice(0, 8)}` : null)
                return (
                  <motion.div
                    key={r.id}
                    initial={{ opacity: 0, y: 6 }}
                    animate={{ opacity: 1, y: 0 }}
                    onClick={() => setSelectedReturnDetail(r)}
                    className="bg-card border border-border/60 hover:border-slate-500/30 rounded-2xl p-4 sm:p-5 transition-all shadow-sm cursor-pointer"
                  >
                    <div className="flex items-center justify-between gap-3 mb-3">
                      <div className="flex flex-wrap items-center gap-2">
                        <span className={`text-[10px] font-extrabold uppercase tracking-wider px-2.5 py-0.5 rounded-md ${rType === 'sale_return' ? 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/20' : 'bg-sky-500/10 text-sky-400 border border-sky-500/20'
                          }`}>
                          {rType === 'sale_return' ? 'Retur dari Toko' : 'Retur ke Pabrik'}
                        </span>
                        {invNumber && (
                          <span className="text-[10px] font-bold px-2 py-0.5 rounded-md bg-[#0F172A]/10 text-amber-400 border border-[#0F172A]/20 flex items-center gap-1">
                            <FileText size={11} /> {invNumber}
                          </span>
                        )}
                        <span className="text-xs font-mono font-bold text-muted-foreground">{r.return_number || r.id}</span>
                      </div>
                      
                      <div className="flex items-center gap-2">
                        <button
                          onClick={(e) => {
                            e.stopPropagation()
                            handleToggleStatus(r.id, r.status)
                          }}
                          className={`text-xs font-bold px-3 py-1 rounded-lg border flex items-center gap-1.5 cursor-pointer transition-all ${r.status === 'completed'
                              ? 'bg-emerald-500/10 border-emerald-500/30 text-emerald-400 hover:bg-emerald-500/20'
                              : 'bg-[#0F172A]/10 border-[#0F172A]/30 text-amber-400 hover:bg-slate-900/20'
                            }`}
                        >
                          {r.status === 'completed' ? <CheckCircle2 size={13} /> : <Clock size={13} />}
                          {r.status === 'completed' ? 'Selesai' : 'Diproses'}
                        </button>
                      </div>
                    </div>

                    <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-t border-border/40 pt-3">
                      <div>
                        <h3 className="text-base font-bold text-foreground font-sans">{r.product_name}</h3>
                        <p className="text-xs text-muted-foreground mt-1 flex items-center gap-2">
                          <Store size={13} className="text-muted-foreground/60" /> <span className="font-semibold text-foreground">{r.party_name}</span>
                          <span>·</span>
                          <span className="text-[#0F172A] font-bold bg-[#0F172A]/10 px-2 py-0.5 rounded-md border border-[#0F172A]/20">{r.quantity} {r.unit}</span>
                        </p>
                        <p className="text-xs text-muted-foreground mt-1.5">
                          Alasan: <span className="text-foreground/80 italic">{r.reason}</span> · Action: <span className="text-amber-400 font-semibold">{r.action === 'fifo_stock' ? 'Masuk Stok (FIFO)' : 'Afkir / Loss'}</span>
                        </p>
                      </div>

                      <div className="text-left sm:text-right bg-background/50 sm:bg-transparent p-3 sm:p-0 rounded-xl border sm:border-0 border-border/40">
                        <p className="text-[10px] font-bold text-muted-foreground uppercase tracking-wider">Nilai Retur</p>
                        <p className="text-lg font-black text-rose-500 mt-0.5">Rp {fmt(r.total_amount || r.amount)}</p>
                      </div>
                    </div>
                  </motion.div>
                )
              })}
            </div>
          )}
        </div>
      </div>

      {/* Modal Konfirmasi Pembatalan Retur */}
      <AnimatePresence>
        {confirmCancelReturn && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-50 bg-black/75 backdrop-blur-md flex items-center justify-center p-4"
            onClick={() => setConfirmCancelReturn(null)}
          >
            <motion.div
              initial={{ scale: 0.95, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.95, opacity: 0 }}
              onClick={e => e.stopPropagation()}
              className="bg-card border border-red-500/30 rounded-2xl max-w-sm w-full p-5 space-y-4 shadow-2xl"
            >
              <div className="flex items-center gap-3 text-red-500">
                <AlertCircle size={24} />
                <h3 className="text-base font-bold text-foreground">Batalkan Retur Barang?</h3>
              </div>
              <p className="text-xs text-muted-foreground leading-relaxed">
                Anda yakin ingin membatalkan retur <strong className="text-foreground">{confirmCancelReturn.product_name}</strong> ({confirmCancelReturn.quantity} {confirmCancelReturn.unit}) dari toko <strong className="text-foreground">{confirmCancelReturn.party_name}</strong>? Penyesuaian stok gudang akan dikembalikan otomatis.
              </p>
              <div className="flex items-center justify-end gap-2 pt-2 border-t border-border/40">
                <button
                  type="button"
                  onClick={() => setConfirmCancelReturn(null)}
                  className="px-4 h-10 rounded-xl font-bold text-xs bg-background border border-border text-muted-foreground hover:text-foreground cursor-pointer"
                >
                  Tutup
                </button>
                <button
                  type="button"
                  disabled={deleteReturnMut.isPending}
                  onClick={() => handleCancelReturn(confirmCancelReturn)}
                  className="px-4 h-10 rounded-xl font-bold text-xs bg-red-600 hover:bg-red-500 text-white cursor-pointer flex items-center gap-1.5 disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {deleteReturnMut.isPending ? (
                    <>
                      <Loader2 size={14} className="animate-spin" />
                      <span>Membatalkan...</span>
                    </>
                  ) : (
                    'Ya, Batalkan Retur'
                  )}
                </button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Modal / Sheet Catat Retur Baru */}
      <AnimatePresence>
        {sheetOpen && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-50 bg-black/75 backdrop-blur-md flex items-end sm:items-center justify-center p-0 sm:p-4"
            onClick={handleCloseSheet}
          >
            <motion.div
              initial={{ y: '100%' }}
              animate={{ y: 0 }}
              exit={{ y: '100%' }}
              transition={{ type: 'spring', stiffness: 320, damping: 32 }}
              onClick={e => e.stopPropagation()}
              className="bg-card border-t-2 border-[#0F172A] sm:border sm:border-border rounded-t-3xl sm:rounded-2xl w-full max-w-lg p-5 max-h-[90vh] overflow-y-auto"
            >
              <div className="flex items-center justify-between pb-3 border-b border-border mb-4">
                <div className="flex items-center gap-2">
                  <RotateCcw className="text-[#0F172A]" size={20} />
                  <h2 className="text-base font-bold text-foreground">Catat Retur Produk</h2>
                </div>
                <button onClick={handleCloseSheet} className="text-muted-foreground hover:text-foreground">
                  <X size={18} />
                </button>
              </div>

              <form onSubmit={handleCreateReturn} className="space-y-4 text-xs">
                {/* Tipe Retur */}
                <div>
                  <label className="block text-muted-foreground font-bold mb-1.5">Tipe Transaksi Retur</label>
                  <div className="grid grid-cols-2 gap-2">
                    <button
                      type="button"
                      onClick={() => setForm({ ...form, type: 'sale_return' })}
                      className={`p-3 rounded-xl border font-bold text-left transition-all ${form.type === 'sale_return' ? 'bg-[#0F172A]/15 border-[#0F172A] text-amber-400' : 'bg-background border-border text-muted-foreground'
                        }`}
                    >
                      <ArrowDownLeft size={16} className="mb-1" />
                      Retur dari Toko / Buyer
                    </button>
                    <button
                      type="button"
                      onClick={() => setForm({ ...form, type: 'purchase_return', selection_mode: 'manual' })}
                      className={`p-3 rounded-xl border font-bold text-left transition-all ${form.type === 'purchase_return' ? 'bg-sky-500/15 border-sky-500 text-sky-400' : 'bg-background border-border text-muted-foreground'
                        }`}
                    >
                      <ArrowUpRight size={16} className="mb-1" />
                      Retur ke Pabrik / Supplier
                    </button>
                  </div>
                </div>

                {/* Mode Pemilihan: Berdasarkan Transaksi vs Manual */}
                {form.type === 'sale_return' && (
                  <div>
                    <label className="block text-muted-foreground font-bold mb-1.5">Metode Pemilihan Retur</label>
                    <div className="grid grid-cols-2 gap-2">
                      <button
                        type="button"
                        onClick={() => setForm({ ...form, selection_mode: 'transaction' })}
                        className={`p-2.5 rounded-xl border font-bold text-left flex items-center gap-2 transition-all ${form.selection_mode === 'transaction'
                            ? 'bg-emerald-500/15 border-emerald-500 text-emerald-400'
                            : 'bg-background border-border text-muted-foreground'
                          }`}
                      >
                        <FileText size={15} />
                        <span>Berdasarkan Transaksi (Invoice)</span>
                      </button>
                      <button
                        type="button"
                        onClick={() => setForm({ ...form, selection_mode: 'manual', sale_id: '' })}
                        className={`p-2.5 rounded-xl border font-bold text-left flex items-center gap-2 transition-all ${form.selection_mode === 'manual'
                            ? 'bg-[#0F172A]/15 border-[#0F172A] text-amber-400'
                            : 'bg-background border-border text-muted-foreground'
                          }`}
                      >
                        <Store size={15} />
                        <span>Manual / Bebas</span>
                      </button>
                    </div>
                  </div>
                )}

                {/* IF SELECTION MODE IS TRANSACTION */}
                {form.type === 'sale_return' && form.selection_mode === 'transaction' && (
                  <>
                    {/* Pilih Invoice Penjualan */}
                    <div>
                      <label className="block text-emerald-400 font-bold mb-1.5 flex items-center gap-1.5">
                        <Link2 size={13} /> Pilih Nota / Invoice Penjualan
                      </label>
                      <CustomSelect
                        value={form.sale_id}
                        onChange={handleSelectSale}
                        placeholder="-- Pilih Invoice Penjualan --"
                        options={[
                          { value: '', label: '-- Pilih Invoice Penjualan --' },
                          ...salesList.map(s => ({
                            value: s.id,
                            label: `${s.invoice_number} · ${s.customer_name} (${formatDate(s.transaction_date)}) - Rp ${fmt(s.total_amount)}`
                          }))
                        ]}
                      />
                    </div>

                    {/* Jika Invoice Dipilih -> Tampilkan Pilihan Produk Dari Invoice Tersebut */}
                    {selectedSale && (
                      <div className="bg-emerald-500/10 border border-emerald-500/20 rounded-xl p-3.5 space-y-3">
                        <div className="flex items-center justify-between text-xs text-emerald-400 font-bold">
                          <span>🔗 Terhubung: {selectedSale.invoice_number}</span>
                          <span>{selectedSale.customer_name}</span>
                        </div>

                        <div>
                          <label className="block text-muted-foreground font-bold mb-1">Pilih Produk Dari Invoice Ini</label>
                          <CustomSelect
                            value={form.product_id}
                            onChange={handleSelectSaleItem}
                            placeholder="-- Pilih Produk Yang Terjual --"
                            options={[
                              { value: '', label: '-- Pilih Produk Yang Terjual --' },
                              ...saleItems.map(item => ({
                                value: item.product_id || item.id,
                                label: `${item.product_name} (${item.quantity} ${item.unit || 'pcs'} @ Rp ${fmt(item.price_per_unit || item.sell_price)})`
                              }))
                            ]}
                          />
                        </div>
                      </div>
                    )}
                  </>
                )}

                {/* IF SELECTION MODE IS MANUAL OR FOR PURCHASE RETURN */}
                {(form.selection_mode === 'manual' || form.type === 'purchase_return') && (
                  <>
                    {/* Pilih Toko / Supplier */}
                    <div>
                      <label className="block text-muted-foreground font-bold mb-1.5">
                        {form.type === 'sale_return' ? 'Pilih Toko / Pelanggan' : 'Pilih Pabrik / Supplier'}
                      </label>
                      <CustomSelect
                        value={form.party_name}
                        onChange={val => setForm({ ...form, party_name: val === 'custom' ? '' : val, is_custom_party: val === 'custom' })}
                        placeholder={`-- ${form.type === 'sale_return' ? 'Pilih Toko Terdaftar' : 'Pilih Supplier Terdaftar'} --`}
                        options={[
                          { value: '', label: `-- ${form.type === 'sale_return' ? 'Pilih Toko Terdaftar' : 'Pilih Supplier Terdaftar'} --` },
                          ...(form.type === 'sale_return'
                            ? customers.map(c => ({ value: c.customer_name, label: `${c.customer_name} ${c.address ? `(${c.address})` : ''}` }))
                            : suppliers.map(s => ({ value: s.supplier_name, label: s.supplier_name }))
                          ),
                          { value: 'custom', label: '✏️ + Input Nama Toko / Supplier Baru' }
                        ]}
                      />

                      {(form.is_custom_party || (form.type === 'sale_return' && customers.length === 0) || (form.type === 'purchase_return' && suppliers.length === 0)) && (
                        <input
                          type="text"
                          value={form.party_name}
                          onChange={e => setForm({ ...form, party_name: e.target.value })}
                          placeholder={form.type === 'sale_return' ? 'Ketik Nama Toko / Pelanggan Baru...' : 'Ketik Nama Pabrik / Supplier Baru...'}
                          className="w-full bg-background border border-border rounded-xl px-3.5 py-2.5 text-xs text-foreground outline-none focus:border-slate-500 mt-2"
                        />
                      )}
                    </div>

                    {/* Pilih Produk Master */}
                    <div>
                      <label className="block text-muted-foreground font-bold mb-1.5">Produk</label>
                      <CustomSelect
                        value={form.product_id}
                        onChange={val => {
                          const p = products.find(prod => prod.id === val)
                          setForm({
                            ...form,
                            product_id: val,
                            product_name: p?.product_name || '',
                            unit_price: p?.sell_price || ''
                          })
                        }}
                        placeholder="-- Pilih Produk --"
                        options={[
                          { value: '', label: '-- Pilih Produk --' },
                          ...products.map(p => ({
                            value: p.id,
                            label: `${p.product_name} (Stok: ${p.current_stock} ${p.unit || 'pcs'})`
                          }))
                        ]}
                      />
                    </div>
                  </>
                )}

                {/* Qty & Unit */}
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="block text-muted-foreground font-bold mb-1.5">Jumlah (Qty)</label>
                    <input
                      type="text"
                      inputMode="decimal"
                      value={form.quantity}
                      onChange={e => {
                        const val = e.target.value
                        if (val === '' || /^[0-9]*[.,]?[0-9]*$/.test(val)) {
                          setForm({ ...form, quantity: val.replace(',', '.') })
                        }
                      }}
                      className="w-full bg-background border border-border rounded-xl px-3.5 py-2.5 text-xs text-foreground outline-none focus:border-slate-500 font-bold"
                    />
                  </div>
                  <div>
                    <label className="block text-muted-foreground font-bold mb-1.5 flex items-center justify-between">
                      <span>Satuan</span>
                      {!!form.product_id && <span className="text-[10px] text-[#0F172A] font-bold flex items-center gap-1">🔒 Terkunci dari Transaksi</span>}
                    </label>
                    {form.product_id ? (
                      <div className="w-full bg-background/50 border border-[#0F172A]/30 rounded-xl px-3.5 py-2.5 text-xs text-amber-400 font-bold flex items-center justify-between cursor-not-allowed select-none">
                        <span className="capitalize">{(form.unit || 'pcs')}</span>
                        <span className="text-[10px] bg-[#0F172A]/15 border border-[#0F172A]/30 px-2 py-0.5 rounded-full text-amber-400 font-bold">🔒 Lock</span>
                      </div>
                    ) : (
                      <CustomSelect
                        value={form.unit}
                        onChange={val => setForm({ ...form, unit: val })}
                        placeholder="Pilih Satuan"
                        options={[
                          { value: 'pcs', label: 'Pcs' },
                          { value: 'dus', label: 'Dus / Karton' },
                          { value: 'bal', label: 'Bal' },
                          { value: 'sak', label: 'Sak / Karung' },
                          { value: 'kg', label: 'Kg' },
                          { value: 'liter', label: 'Liter' },
                          { value: 'pack', label: 'Pack / Bungkus' },
                          { value: 'renceng', label: 'Renceng / Lusin' },
                          { value: 'slop', label: 'Slop' },
                          { value: 'pres', label: 'Pres' },
                        ]}
                      />
                    )}
                  </div>
                </div>

                {/* Alasan Retur */}
                <div>
                  <label className="block text-muted-foreground font-bold mb-1.5">Alasan Retur</label>
                  <CustomSelect
                    value={form.reason}
                    onChange={val => setForm({ ...form, reason: val })}
                    placeholder="Pilih Alasan Retur"
                    options={[
                      { value: 'Kemasan Rusak / Cacat', label: 'Kemasan Rusak / Cacat Fisik' },
                      { value: 'Kadaluwarsa / Expired', label: 'Kadaluwarsa / Expired' },
                      { value: 'Salah Kirim Varian / Barang', label: 'Salah Kirim Varian / Barang' },
                      { value: 'Kualitas Tidak Sesuai Standar', label: 'Kualitas Tidak Sesuai / Rusak' },
                      { value: 'Permintaan Pembatalan Pelanggan', label: 'Permintaan Pembatalan Pelanggan' },
                      { value: 'Lainnya', label: 'Alasan Lainnya' },
                    ]}
                  />
                </div>

                {/* Tindakan Stok (FIFO) */}
                <div>
                  <label className="block text-muted-foreground font-bold mb-1.5">Tindakan terhadap Stok (FIFO)</label>
                  <CustomSelect
                    value={form.action}
                    onChange={val => setForm({ ...form, action: val })}
                    placeholder="Pilih Tindakan Stok"
                    options={[
                      { value: 'fifo_stock', label: 'Kembalikan ke Stok FIFO Gudang (Bisa dijual lagi)' },
                      { value: 'loss', label: 'Buang ke Loss / Afkir (Rusak total)' },
                    ]}
                  />
                </div>

                {/* Penanganan Piutang / Keuangan Toko */}
                {form.type === 'sale_return' && (
                  <div>
                    <label className="block text-muted-foreground font-bold mb-1.5">Penanganan Piutang / Keuangan Toko</label>
                    <CustomSelect
                      value={form.financial_action || 'potong_piutang'}
                      onChange={val => setForm({ ...form, financial_action: val })}
                      placeholder="Pilih Penanganan Piutang"
                      options={[
                        { value: 'potong_piutang', label: '💳 Potong Piutang Toko (Otomatis Kurangi Hutang Nota)' },
                        { value: 'refund_cash', label: '💵 Refund Tunai / Cash (Uang Kembali ke Toko)' },
                        { value: 'store_credit', label: '🏦 Deposit / Kredit Toko (Untuk Pembelian Berikutnya)' },
                      ]}
                    />
                  </div>
                )}

                {/* Submit Button with Loading & Double-click Lock */}
                <button
                  type="submit"
                  disabled={createReturnMut.isPending}
                  className="w-full h-12 bg-[#0F172A] hover:bg-slate-900 font-bold text-white rounded-xl shadow-lg shadow-slate-950/10 transition-all mt-2 cursor-pointer flex items-center justify-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {createReturnMut.isPending ? (
                    <>
                      <Loader2 size={16} className="animate-spin" />
                      <span>Menyimpan Retur...</span>
                    </>
                  ) : (
                    'Simpan Retur Produk'
                  )}
                </button>
              </form>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Modal Detail Retur */}
      <AnimatePresence>
        {selectedReturnDetail && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-50 bg-black/75 backdrop-blur-md flex items-end sm:items-center justify-center p-0 sm:p-4"
            onClick={() => setSelectedReturnDetail(null)}
          >
            <motion.div
              initial={{ y: '100%' }}
              animate={{ y: 0 }}
              exit={{ y: '100%' }}
              transition={{ type: 'spring', stiffness: 320, damping: 32 }}
              onClick={e => e.stopPropagation()}
              className="bg-card border-t-2 border-[#0F172A] sm:border sm:border-border rounded-t-3xl sm:rounded-2xl w-full max-w-lg p-5 max-h-[90vh] overflow-y-auto space-y-4 text-left"
            >
              <div className="flex items-center justify-between pb-3 border-b border-border">
                <div className="flex items-center gap-2">
                  <FileText className="text-[#0F172A]" size={20} />
                  <h2 className="text-base font-bold text-foreground">Detail Retur Produk</h2>
                </div>
                <button onClick={() => setSelectedReturnDetail(null)} className="text-muted-foreground hover:text-foreground">
                  <X size={18} />
                </button>
              </div>

              {/* Status & Badge */}
              <div className="flex items-center justify-between p-3.5 bg-slate-50 dark:bg-white/[0.02] border border-border/60 rounded-xl text-xs">
                <div className="space-y-1">
                  <p className="text-muted-foreground font-bold">Nomor Retur</p>
                  <p className="text-sm font-mono font-black text-foreground">{selectedReturnDetail.return_number || selectedReturnDetail.id}</p>
                </div>
                <button
                  onClick={async () => {
                    await handleToggleStatus(selectedReturnDetail.id, selectedReturnDetail.status);
                    // Update local detail state status
                    setSelectedReturnDetail(prev => ({ ...prev, status: prev.status === 'pending' ? 'completed' : 'pending' }));
                  }}
                  className={`font-bold px-3 h-8 rounded-lg border flex items-center gap-1.5 cursor-pointer transition-all ${selectedReturnDetail.status === 'completed'
                      ? 'bg-emerald-500/10 border-emerald-500/30 text-emerald-400 hover:bg-emerald-500/20'
                      : 'bg-[#0F172A]/10 border-[#0F172A]/30 text-amber-400 hover:bg-slate-900/20'
                    }`}
                >
                  {selectedReturnDetail.status === 'completed' ? <CheckCircle2 size={13} /> : <Clock size={13} />}
                  {selectedReturnDetail.status === 'completed' ? 'Selesai' : 'Diproses'}
                </button>
              </div>

              {/* Main Information */}
              <div className="space-y-3 text-xs">
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <span className="text-muted-foreground font-bold block mb-1">Tipe Retur</span>
                    <span className={`inline-block font-extrabold uppercase px-2.5 py-0.5 rounded-md ${
                      (selectedReturnDetail.return_type || selectedReturnDetail.type) === 'sale_return'
                        ? 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/20'
                        : 'bg-sky-500/10 text-sky-400 border border-sky-500/20'
                    }`}>
                      {(selectedReturnDetail.return_type || selectedReturnDetail.type) === 'sale_return' ? 'Retur dari Toko' : 'Retur ke Pabrik'}
                    </span>
                  </div>
                  <div>
                    <span className="text-muted-foreground font-bold block mb-1">Nama Pihak</span>
                    <span className="text-foreground font-extrabold">{selectedReturnDetail.party_name}</span>
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-3 border-t border-border/40 pt-3">
                  <div>
                    <span className="text-muted-foreground font-bold block mb-1">Produk</span>
                    <span className="text-foreground font-black">{selectedReturnDetail.product_name}</span>
                  </div>
                  <div>
                    <span className="text-muted-foreground font-bold block mb-1">Jumlah</span>
                    <span className="text-[#0F172A] font-extrabold bg-[#0F172A]/10 px-2.5 py-0.5 rounded-md border border-[#0F172A]/20">
                      {selectedReturnDetail.quantity} {selectedReturnDetail.unit}
                    </span>
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-3 border-t border-border/40 pt-3">
                  <div>
                    <span className="text-muted-foreground font-bold block mb-1">Harga Satuan</span>
                    <span className="text-foreground font-semibold">Rp {fmt(selectedReturnDetail.unit_price)}</span>
                  </div>
                  <div>
                    <span className="text-muted-foreground font-bold block mb-1">Total Nilai Retur</span>
                    <span className="text-rose-500 font-black text-sm">Rp {fmt(selectedReturnDetail.total_amount || selectedReturnDetail.amount)}</span>
                  </div>
                </div>

                {selectedReturnDetail.sembako_sales?.invoice_number && (
                  <div className="border-t border-border/40 pt-3">
                    <span className="text-muted-foreground font-bold block mb-1">Nota Penjualan Terhubung</span>
                    <span className="inline-flex items-center gap-1.5 font-bold px-2 py-0.5 rounded-md bg-[#0F172A]/10 text-amber-400 border border-[#0F172A]/20">
                      <FileText size={11} /> {selectedReturnDetail.sembako_sales.invoice_number}
                    </span>
                  </div>
                )}

                <div className="grid grid-cols-2 gap-3 border-t border-border/40 pt-3">
                  <div>
                    <span className="text-muted-foreground font-bold block mb-1">Alasan</span>
                    <span className="text-foreground italic">{selectedReturnDetail.reason || '—'}</span>
                  </div>
                  <div>
                    <span className="text-muted-foreground font-bold block mb-1">Penanganan Stok</span>
                    <span className="text-amber-400 font-semibold">
                      {selectedReturnDetail.action === 'fifo_stock' ? 'Masuk Stok (FIFO)' : 'Afkir / Loss'}
                    </span>
                  </div>
                </div>

                {selectedReturnDetail.notes && (
                  <div className="border-t border-border/40 pt-3">
                    <span className="text-muted-foreground font-bold block mb-1">Catatan Tambahan</span>
                    <p className="text-foreground bg-slate-50 dark:bg-white/[0.01] p-2.5 rounded-xl border border-border/60 leading-relaxed">
                      {selectedReturnDetail.notes}
                    </p>
                  </div>
                )}
              </div>

              {/* Action buttons (including delete) */}
              <div className="flex items-center justify-between gap-3 pt-4 border-t border-border/40">
                <button
                  type="button"
                  onClick={() => {
                    setConfirmCancelReturn(selectedReturnDetail);
                    setSelectedReturnDetail(null); // Close detail when confirming delete
                  }}
                  className="px-4 h-10 rounded-xl font-bold text-xs bg-red-500/10 hover:bg-red-500/20 border border-red-500/30 text-red-400 cursor-pointer flex items-center gap-1.5"
                >
                  <Trash2 size={13} />
                  <span>Batalkan / Hapus Retur</span>
                </button>
                <button
                  type="button"
                  onClick={() => setSelectedReturnDetail(null)}
                  className="px-5 h-10 rounded-xl font-bold text-xs bg-slate-200 hover:bg-slate-300 text-slate-800 dark:bg-white/10 dark:hover:bg-white/20 dark:text-white cursor-pointer"
                >
                  Tutup
                </button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  )
}


