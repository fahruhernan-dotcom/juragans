import React, { useMemo, useState } from 'react'
import { useNavigate, useOutletContext, useSearchParams, useLocation } from 'react-router-dom'
import { BrokerMobileHeader } from '@/dashboard/broker/_shared/components/BrokerMobileHeader'
import { motion } from 'framer-motion'
import {
  ChevronRight,
  MapPin,
  Package,
  Phone,
  Plus,
  Star,
  Store,
  TrendingDown,
  Wallet,
  FileSpreadsheet,
} from 'lucide-react'
import ImportCsvModal from '@/components/ui/ImportCsvModal'
import {
  useCreateSembakoCustomer,
  useCreateSembakoSupplier,
  useSembakoAllBatches,
  useSembakoCustomers,
  useSembakoSales,
  useSembakoSuppliers,
} from '@/lib/hooks/useSembakoData'
import { useMediaQuery } from '@/lib/hooks/useMediaQuery'
import { formatIDR } from '@/lib/format'
import { SembakoPageHeader } from '@/dashboard/broker/sembako_broker/components/SembakoPageHeader'
import { SembakoSummaryStrip } from '@/dashboard/broker/sembako_broker/components/SembakoSummaryStrip'
import {
  SembakoEmptyState,
  SembakoFilterPill,
  SembakoErrorState,
} from '@/dashboard/broker/sembako_broker/components/SembakoUiPrimitives'
import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetHeader,
  SheetTitle,
} from '@/components/ui/sheet'
import { Input } from '@/components/ui/input'
import { PhoneInput } from '@/components/ui/PhoneInput'
import { Button } from '@/components/ui/button'
import { Avatar, AvatarFallback } from '@/components/ui/avatar'
import { Badge } from '@/components/ui/badge'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { cn } from '@/lib/utils'

const MotionButton = motion.button

const CUSTOMER_TYPES = [
  'perseorangan',
  'warung',
  'toko_retail',
  'supermarket',
  'restoran',
  'catering',
  'grosir',
  'semi_grosir',
  'sales_keliling',
  'lainnya',
]

const PAYMENT_TERMS = [
  { value: 'cash', label: 'Cash' },
  { value: 'net3', label: 'NET 3' },
  { value: 'net7', label: 'NET 7' },
  { value: 'net14', label: 'NET 14' },
  { value: 'net30', label: 'NET 30' },
]

export default function SembakoTokoSupplier() {
  const isDesktop = useMediaQuery('(min-width: 1024px)')
  const { setSidebarOpen = () => window.dispatchEvent(new Event('toggleMobileSidebar')) } = useOutletContext() || {}
  const location = useLocation()
  const navigate = useNavigate()
  const [searchParams, setSearchParams] = useSearchParams()
  const [openTokoSheet, setOpenTokoSheet] = useState(() => {
    const params = new URLSearchParams(window.location.search)
    const act = params.get('action')
    return act === 'new' || act === 'tambah'
  })
  const [sub, setSub] = useState(() => searchParams.get('tab') || 'toko')

  // Sync URL search params tab to state
  const tabParam = searchParams.get('tab') || 'toko'
  React.useEffect(() => {
    if (tabParam !== sub) {
      setSub(tabParam)
    }
  }, [tabParam, sub])

  // Sync URL action=new to openTokoSheet state safely
  React.useEffect(() => {
    const params = new URLSearchParams(location.search)
    const action = params.get('action')
    if (action === 'new' || action === 'tambah') {
      setOpenTokoSheet(true)
      setSub('toko')
    }
  }, [location.search])

  const handleTabChange = (newTab) => {
    setSub(newTab)
    setSearchParams(prev => {
      const next = new URLSearchParams(prev)
      next.set('tab', newTab)
      return next
    }, { replace: true })
  }

  const [openSupplierSheet, setOpenSupplierSheet] = useState(false)
  const [search, setSearch] = useState('')
  const [selectedArea, setSelectedArea] = useState('Semua Area')
  const [onlyHutang, setOnlyHutang] = useState(false)
  const [importCsvOpen, setImportCsvOpen] = useState(false)

  const { data: customers = [], isError: isCustError, error: custError, refetch: refetchCust } = useSembakoCustomers()
  const { data: suppliers = [], isError: isSuppError, error: suppError, refetch: refetchSupp } = useSembakoSuppliers()
  const { data: sales = [], isError: isSalesError, error: salesError, refetch: refetchSales } = useSembakoSales()
  const { data: allBatches = [], isError: isBatchError, error: batchError, refetch: refetchBatch } = useSembakoAllBatches()

  const customerStats = useMemo(() => {
    return sales.reduce((acc, sale) => {
      if (!sale.customer_id) return acc

      const current = acc[sale.customer_id] || {
        calculatedOutstanding: 0,
        invoiceCount: 0,
        totalRevenue: 0,
        lastTransactionDate: null,
      }

      current.calculatedOutstanding += sale.remaining_amount || 0
      current.invoiceCount += 1
      current.totalRevenue += sale.total_amount || 0

      if (!current.lastTransactionDate || (sale.transaction_date && sale.transaction_date > current.lastTransactionDate)) {
        current.lastTransactionDate = sale.transaction_date
      }

      acc[sale.customer_id] = current
      return acc
    }, {})
  }, [sales])

  const supplierStats = useMemo(() => {
    return allBatches.reduce((acc, batch) => {
      if (!batch.supplier_id) return acc

      const current = acc[batch.supplier_id] || {
        totalPurchaseValue: 0,
        batchCount: 0,
        lastPurchaseDate: null,
      }

      const cost = Number(batch.total_cost) > 0 ? Number(batch.total_cost) : (Number(batch.qty_masuk || 0) * Number(batch.buy_price || 0))
      current.totalPurchaseValue += cost
      current.batchCount += 1

      if (!current.lastPurchaseDate || (batch.purchase_date && batch.purchase_date > current.lastPurchaseDate)) {
        current.lastPurchaseDate = batch.purchase_date
      }

      acc[batch.supplier_id] = current
      return acc
    }, {})
  }, [allBatches])

  const totalPiutang = useMemo(
    () => customers.reduce((sum, c) => sum + (c.total_outstanding || 0), 0),
    [customers]
  )

  const totalBelanjaSupplier = useMemo(
    () => suppliers.reduce((sum, s) => sum + (s.total_purchase_value || 0), 0),
    [suppliers]
  )

  const totalHutangSupplier = useMemo(
    () => suppliers.reduce((sum, s) => sum + (s.total_outstanding || 0), 0),
    [suppliers]
  )

  const customersWithDebt = useMemo(
    () => customers.filter((customer) => (customer.total_outstanding || 0) > 0).length,
    [customers]
  )

  const activeSuppliers = useMemo(
    () => suppliers.filter((supplier) => (supplier.total_outstanding || 0) > 0).length,
    [suppliers]
  )

  const areas = useMemo(() => {
    const set = new Set(customers.map((customer) => customer.area).filter(Boolean))
    return ['Semua Area', ...Array.from(set).sort()]
  }, [customers])

  const activeFilters = useMemo(() => {
    if (sub === 'supplier') return []

    return [
      { id: 'all', label: 'Semua Toko' },
      { id: 'debt', label: 'Punya Piutang' },
      ...areas.slice(1).map((area) => ({ id: `area:${area}`, label: area })),
    ]
  }, [areas, sub])

  const activeCustomerFilter = onlyHutang
    ? 'debt'
    : selectedArea !== 'Semua Area'
      ? `area:${selectedArea}`
      : 'all'

  const summaryItems = sub === 'toko'
    ? [
      { label: 'Total Piutang', value: totalPiutang, isCurrency: true, color: 'amber' },
      { label: 'Customer Aktif', value: customers.length },
      { label: 'Punya Tagihan', value: customersWithDebt, color: 'red' },
    ]
    : [
      { label: 'Total Hutang', value: totalHutangSupplier, isCurrency: true, color: 'red' },
      { label: 'Total Belanja', value: totalBelanjaSupplier, isCurrency: true, color: 'green' },
      { label: 'Supplier', value: suppliers.length },
    ]

  if (isCustError) return <SembakoErrorState error={custError} onRetry={refetchCust} />
  if (isSuppError) return <SembakoErrorState error={suppError} onRetry={refetchSupp} />
  if (isSalesError) return <SembakoErrorState error={salesError} onRetry={refetchSales} />
  if (isBatchError) return <SembakoErrorState error={batchError} onRetry={refetchBatch} />

  return (
    <div className="min-h-screen bg-background pb-[max(140px,calc(110px+env(safe-area-inset-bottom,24px)))] text-left">
      {!isDesktop && <BrokerMobileHeader title="Toko & Supplier" onMenuClick={() => setSidebarOpen(true)} />}

      <div className="mx-auto max-w-7xl">
        <SembakoPageHeader
          title="Toko & Supplier"
          subtitle="Relasi agen, toko & supplier mitra"
          isDesktop={isDesktop}
          searchQuery={search}
          onSearchChange={setSearch}
          searchPlaceholder={sub === 'toko' ? 'Cari toko, area, atau nomor...' : 'Cari supplier, kontak, atau alamat...'}
          filters={activeFilters}
          activeFilter={activeCustomerFilter}
          onFilterChange={(filterId) => {
            if (filterId === 'all') {
              setOnlyHutang(false)
              setSelectedArea('Semua Area')
              return
            }

            if (filterId === 'debt') {
              setOnlyHutang(true)
              setSelectedArea('Semua Area')
              return
            }

            if (filterId.startsWith('area:')) {
              setOnlyHutang(false)
              setSelectedArea(filterId.replace('area:', ''))
            }
          }}
          actionButton={
            isDesktop ? (
              <div className="flex items-center gap-2">
                <SegmentSwitch sub={sub} setSub={handleTabChange} />
                <button
                  onClick={() => setImportCsvOpen(true)}
                  className="flex items-center gap-1.5 px-3 h-10 rounded-xl font-bold text-xs bg-card border border-border/60 hover:bg-muted text-foreground transition-all cursor-pointer shrink-0"
                >
                  <FileSpreadsheet size={15} className="text-[#0F172A]" />
                  <span>Import CSV</span>
                </button>
                {sub === 'toko' ? (
                  <TokoActions
                    compact
                    open={openTokoSheet}
                    onOpenChange={(v) => {
                      setOpenTokoSheet(v)
                      if (!v && location.search.includes('action=')) {
                        navigate(location.pathname, { replace: true })
                      }
                    }}
                  />
                ) : (
                  <SupplierActions
                    compact
                    open={openSupplierSheet}
                    onOpenChange={setOpenSupplierSheet}
                  />
                )}
              </div>
            ) : (
              <div className="flex items-center gap-2">
                <button
                  onClick={() => setImportCsvOpen(true)}
                  className="flex items-center gap-1.5 px-3 h-10 rounded-xl font-bold text-xs bg-card border border-border/60 hover:bg-muted text-foreground transition-all cursor-pointer shrink-0"
                >
                  <FileSpreadsheet size={15} className="text-[#0F172A]" />
                  <span>Import CSV</span>
                </button>
                {sub === 'toko' ? (
                  <TokoActions
                    compact
                    open={openTokoSheet}
                    onOpenChange={(v) => {
                      setOpenTokoSheet(v)
                      if (!v && location.search.includes('action=')) {
                        navigate(location.pathname, { replace: true })
                      }
                    }}
                  />
                ) : (
                  <SupplierActions
                    compact
                    open={openSupplierSheet}
                    onOpenChange={setOpenSupplierSheet}
                  />
                )}
              </div>
            )
          }
        />

        {!isDesktop && (
          <div className="px-4 sm:px-6 pt-4">
            <SegmentSwitch sub={sub} setSub={handleTabChange} />
          </div>
        )}

        <SembakoSummaryStrip items={summaryItems} />

        <div className="space-y-4 px-4 sm:px-6 pt-2">
          {sub === 'toko' && areas.length > 1 && (
            <div className="flex flex-wrap gap-2">
              <SembakoFilterPill
                label="Semua Area"
                active={selectedArea === 'Semua Area'}
                onClick={() => setSelectedArea('Semua Area')}
              />
              {areas.slice(1).map((area) => (
                <SembakoFilterPill
                  key={area}
                  label={area}
                  active={selectedArea === area}
                  onClick={() => setSelectedArea(area)}
                />
              ))}
            </div>
          )}

          {sub === 'toko' ? (
            <TokoList
              customers={customers}
              customerStats={customerStats}
              search={search}
              selectedArea={selectedArea}
              onlyHutang={onlyHutang}
            />
          ) : (
            <SupplierList
              suppliers={suppliers}
              supplierStats={supplierStats}
              search={search}
              onAddSupplier={() => setOpenSupplierSheet(true)}
            />
          )}
        </div>

      </div>
      <ImportCsvModal
        open={importCsvOpen}
        onClose={() => setImportCsvOpen(false)}
        defaultEntity={sub === 'toko' ? 'customers' : 'suppliers'}
      />
    </div>
  )
}

function SegmentSwitch({ sub, setSub }) {
  return (
    <div className="flex items-center gap-1 rounded-xl border border-border/60 bg-card p-1">
      <button
        onClick={() => setSub('toko')}
        className={cn(
          'h-9 rounded-lg px-4 text-xs font-bold transition-all cursor-pointer select-none',
          sub === 'toko' ? 'bg-[#0F172A] text-white shadow-sm' : 'text-muted-foreground hover:text-foreground'
        )}
      >
        Toko
      </button>
      <button
        onClick={() => setSub('supplier')}
        className={cn(
          'h-9 rounded-lg px-4 text-xs font-bold transition-all cursor-pointer select-none',
          sub === 'supplier' ? 'bg-[#0F172A] text-white shadow-sm' : 'text-muted-foreground hover:text-foreground'
        )}
      >
        Supplier
      </button>
    </div>
  )
}

function TokoActions({ compact = false, open: externalOpen, onOpenChange: externalOnOpenChange }) {
  const [internalOpen, setInternalOpen] = useState(false)
  const isControlled = externalOpen !== undefined
  const open = isControlled ? externalOpen : internalOpen
  const setOpen = (val) => {
    if (isControlled) {
      externalOnOpenChange?.(val)
    } else {
      setInternalOpen(val)
    }
  }
  const createCustomer = useCreateSembakoCustomer()
  const [form, setForm] = useState({
    customer_name: '',
    customer_type: 'perseorangan',
    phone: '',
    address: '',
    area: '',
    payment_terms: 'cash',
    credit_limit: 0,
    reliability_score: 3,
  })

  const handleCreate = async () => {
    if (!form.customer_name.trim()) return
    await createCustomer.mutateAsync(form)
    setOpen(false)
    setForm({
      customer_name: '',
      customer_type: 'perseorangan',
      phone: '',
      address: '',
      area: '',
      payment_terms: 'cash',
      credit_limit: 0,
      reliability_score: 3,
    })
  }

  return (
    <>
      <Button
        onClick={() => setOpen(true)}
        className={cn(
          'bg-[#0F172A] hover:bg-slate-900 text-white dark:bg-tko-brand-500 dark:hover:bg-tko-brand-600 dark:text-tko-forest-950 font-black uppercase tracking-widest shadow-tko-brand',
          compact ? 'h-10 rounded-xl px-4 text-[10px]' : 'h-12 rounded-2xl px-6 text-[11px]'
        )}
      >
        <Plus size={16} className="mr-2" />
        Tambah Toko
      </Button>

      <Sheet open={open} onOpenChange={setOpen}>
        <SheetContent side="right" className="overflow-y-auto border-border/60 bg-card p-6 text-left text-foreground">
          <SheetHeader className="mb-6">
            <SheetTitle className="text-left font-display text-2xl font-black uppercase tracking-tight text-foreground">
              Tambah Toko Baru
            </SheetTitle>
            <SheetDescription className="text-left text-xs text-muted-foreground">
              Simpan customer sembako baru untuk transaksi penjualan dan piutang.
            </SheetDescription>
          </SheetHeader>

          <div className="space-y-4 pb-16">
            <Field label="Nama Toko">
              <Input
                className="h-12 rounded-xl border-border/60 bg-muted font-bold text-foreground placeholder:text-muted-foreground"
                value={form.customer_name}
                onChange={(event) => setForm({ ...form, customer_name: event.target.value })}
              />
            </Field>

            <Field label="Tipe Customer">
              <Select value={form.customer_type} onValueChange={(value) => setForm({ ...form, customer_type: value })}>
                <SelectTrigger className="h-12 rounded-xl border-border/60 bg-muted font-bold text-foreground">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent className="border-border/60 bg-popover text-popover-foreground">
                  {CUSTOMER_TYPES.map((type) => (
                    <SelectItem key={type} value={type} className="text-xs font-bold uppercase hover:bg-muted focus:bg-muted">
                      {type.replaceAll('_', ' ')}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </Field>

            <Field label="No. HP">
              <PhoneInput
                className="h-12 rounded-xl border-border/60 bg-muted font-bold text-foreground placeholder:text-muted-foreground"
                value={form.phone}
                onChange={(event) => setForm({ ...form, phone: event.target.value })}
              />
            </Field>

            <Field label="Area">
              <Input
                className="h-12 rounded-xl border-border/60 bg-muted font-bold text-foreground placeholder:text-muted-foreground"
                value={form.area}
                onChange={(event) => setForm({ ...form, area: event.target.value })}
              />
            </Field>

            <Field label="Alamat">
              <Input
                className="h-12 rounded-xl border-border/60 bg-muted font-bold text-foreground placeholder:text-muted-foreground"
                value={form.address}
                onChange={(event) => setForm({ ...form, address: event.target.value })}
              />
            </Field>

            <Field label="Termin Bayar">
              <Select value={form.payment_terms} onValueChange={(value) => setForm({ ...form, payment_terms: value })}>
                <SelectTrigger className="h-12 rounded-xl border-border/60 bg-muted font-bold text-foreground">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent className="border-border/60 bg-popover text-popover-foreground">
                  {PAYMENT_TERMS.map((term) => (
                    <SelectItem key={term.value} value={term.value} className="text-xs font-bold uppercase hover:bg-muted focus:bg-muted">
                      {term.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </Field>

            <Field label="Keandalan Toko">
              <div className="flex gap-1 pt-1">
                {[1, 2, 3, 4, 5].map((score) => (
                  <button
                    key={score}
                    type="button"
                    onClick={() => setForm({ ...form, reliability_score: score })}
                    className="p-1"
                  >
                    <Star
                      size={22}
                      className={cn(
                        'transition-colors',
                        score <= form.reliability_score
                          ? 'fill-amber-400 text-amber-400'
                          : 'fill-transparent text-slate-400/30'
                      )}
                    />
                  </button>
                ))}
              </div>
            </Field>

            <Button
              onClick={handleCreate}
              disabled={createCustomer.isPending}
              className="mt-4 h-12 w-full rounded-2xl bg-[#0F172A] hover:bg-slate-900 text-white dark:bg-tko-brand-500 dark:hover:bg-tko-brand-600 dark:text-tko-forest-950 font-black uppercase tracking-widest shadow-tko-brand disabled:opacity-50"
            >
              {createCustomer.isPending ? 'Menyimpan...' : 'Simpan Toko'}
            </Button>
          </div>
        </SheetContent>
      </Sheet>
    </>
  )
}

function SupplierActions({ compact = false, open: controlledOpen, onOpenChange: setControlledOpen }) {
  const [internalOpen, setInternalOpen] = useState(false)
  const isControlled = controlledOpen !== undefined
  const open = isControlled ? controlledOpen : internalOpen
  const setOpen = isControlled ? setControlledOpen : setInternalOpen

  const createSupplier = useCreateSembakoSupplier()
  const [form, setForm] = useState({
    supplier_name: '',
    phone: '',
    address: '',
    notes: '',
  })

  const handleCreate = async () => {
    if (!form.supplier_name.trim()) return
    await createSupplier.mutateAsync(form)
    setOpen(false)
    setForm({
      supplier_name: '',
      phone: '',
      address: '',
      notes: '',
    })
  }

  return (
    <>
      <Button
        onClick={() => setOpen(true)}
        className={cn(
          'bg-[#0F172A] hover:bg-slate-900 text-white dark:bg-tko-brand-500 dark:hover:bg-tko-brand-600 dark:text-tko-forest-950 font-black uppercase tracking-widest shadow-tko-brand',
          compact ? 'h-10 rounded-xl px-4 text-[10px]' : 'h-12 rounded-2xl px-6 text-[11px]'
        )}
      >
        <Plus size={16} className="mr-2" />
        Tambah Supplier
      </Button>

      <Sheet open={open} onOpenChange={setOpen}>
        <SheetContent side="right" className="overflow-y-auto border-border/60 bg-card p-6 text-left text-foreground">
          <SheetHeader className="mb-6">
            <SheetTitle className="text-left font-display text-2xl font-black uppercase tracking-tight text-foreground">
              Tambah Supplier
            </SheetTitle>
            <SheetDescription className="text-left text-xs text-muted-foreground">
              Tambahkan partner pengadaan baru untuk pembelian batch stok.
            </SheetDescription>
          </SheetHeader>

          <div className="space-y-4 pb-16">
            <Field label="Nama Supplier">
              <Input
                className="h-12 rounded-xl border-border/60 bg-muted font-bold text-foreground placeholder:text-muted-foreground"
                value={form.supplier_name}
                onChange={(event) => setForm({ ...form, supplier_name: event.target.value })}
              />
            </Field>

            <Field label="No. HP">
              <PhoneInput
                className="h-12 rounded-xl border-border/60 bg-muted font-bold text-foreground placeholder:text-muted-foreground"
                value={form.phone}
                onChange={(event) => setForm({ ...form, phone: event.target.value })}
              />
            </Field>

            <Field label="Alamat">
              <Input
                className="h-12 rounded-xl border-border/60 bg-muted font-bold text-foreground placeholder:text-muted-foreground"
                value={form.address}
                onChange={(event) => setForm({ ...form, address: event.target.value })}
              />
            </Field>

            <Field label="Catatan">
              <Input
                className="h-12 rounded-xl border-border/60 bg-muted font-bold text-foreground placeholder:text-muted-foreground"
                value={form.notes}
                onChange={(event) => setForm({ ...form, notes: event.target.value })}
              />
            </Field>

            <Button
              onClick={handleCreate}
              disabled={createSupplier.isPending}
              className="mt-4 h-12 w-full rounded-2xl bg-[#0F172A] hover:bg-slate-900 text-white dark:bg-tko-brand-500 dark:hover:bg-tko-brand-600 dark:text-tko-forest-950 font-black uppercase tracking-widest shadow-tko-brand disabled:opacity-50"
            >
              {createSupplier.isPending ? 'Menyimpan...' : 'Simpan Supplier'}
            </Button>
          </div>
        </SheetContent>
      </Sheet>
    </>
  )
}

function TokoList({ customers, customerStats, search, selectedArea, onlyHutang }) {
  const navigate = useNavigate()

  const filtered = useMemo(() => {
    return customers
      .filter((customer) => {
        const outstanding = customer.total_outstanding || 0
        const haystack = [customer.customer_name, customer.area, customer.phone]
          .filter(Boolean)
          .join(' ')
          .toLowerCase()

        const matchesSearch = haystack.includes(search.toLowerCase())
        const matchesArea = selectedArea === 'Semua Area' || customer.area === selectedArea
        const matchesDebt = !onlyHutang || outstanding > 0

        return matchesSearch && matchesArea && matchesDebt
      })
      .sort((left, right) => {
        const leftOutstanding = left.total_outstanding || 0
        const rightOutstanding = right.total_outstanding || 0
        return rightOutstanding - leftOutstanding
      })
  }, [customers, onlyHutang, search, selectedArea])

  if (!filtered.length) {
    return (
      <SembakoEmptyState
        icon={Store}
        title="Toko Tidak Ditemukan"
        description="Ubah pencarian atau filter. Daftar toko akan muncul di sini setelah customer tersedia."
      />
    )
  }

  return (
    <div className="grid grid-cols-1 gap-4 md:grid-cols-2 xl:grid-cols-3">
      {filtered.map((customer) => {
        const stats = customerStats[customer.id] || {}
        const outstanding = customer.total_outstanding || 0
        const invoiceCount = stats.invoiceCount || 0
        const lastTxDate = stats.lastTransactionDate
          ? new Date(stats.lastTransactionDate).toLocaleDateString('id-ID', { day: '2-digit', month: 'short', year: '2-digit' })
          : null

        return (
          <MotionButton
            key={customer.id}
            type="button"
            onClick={() => navigate(`customer/${customer.id}`)}
            whileTap={{ scale: 0.985 }}
            className="group w-full rounded-2xl border border-border/60 bg-card px-4 py-3 text-left transition-all hover:border-slate-500/30 hover:bg-card/90 shadow-sm cursor-pointer"
          >
            {/* Row 1: avatar + name + chevron */}
            <div className="flex items-center gap-3">
              <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-[#0F172A]/10 text-xs font-black uppercase text-[#0F172A] border border-[#0F172A]/20">
                {(customer.customer_name || '--').slice(0, 2)}
              </div>
              <div className="min-w-0 flex-1">
                <div className="flex items-center gap-2">
                  <p className="truncate text-sm font-bold text-foreground">
                    {customer.customer_name}
                  </p>
                  <Badge className="h-4 shrink-0 border-none bg-[#0F172A]/10 px-1.5 text-[8px] font-black uppercase tracking-wider text-slate-500">
                    {customer.customer_type || 'customer'}
                  </Badge>
                </div>
                <div className="flex items-center gap-2 mt-0.5 text-xs text-muted-foreground">
                  <span>{customer.area || 'Tanpa Area'}</span>
                  {customer.phone && (
                    <>
                      <span>·</span>
                      <span>{customer.phone}</span>
                    </>
                  )}
                </div>
              </div>
              <ChevronRight className="shrink-0 text-muted-foreground transition-all group-hover:translate-x-0.5 group-hover:text-[#0F172A]" size={16} />
            </div>

            {/* Row 2: metrics strip */}
            <div className="mt-3 flex items-center justify-between rounded-xl bg-background/60 border border-border/40 px-3 py-2">
              <div>
                <p className="text-[9px] font-black uppercase tracking-wider text-muted-foreground">Piutang</p>
                <p className={cn('text-xs font-black tabular-nums', outstanding > 0 ? 'text-rose-500' : 'text-emerald-400')}>
                  {outstanding > 0 ? formatIDR(outstanding) : 'Lunas'}
                </p>
              </div>
              <div className="text-center">
                <p className="text-[9px] font-black uppercase tracking-wider text-muted-foreground">Invoice</p>
                <p className="text-xs font-black text-foreground">{invoiceCount}</p>
              </div>
              <div className="text-right">
                <p className="text-[9px] font-black uppercase tracking-wider text-muted-foreground">Terakhir</p>
                <p className="text-xs font-medium text-foreground">{lastTxDate || '—'}</p>
              </div>
              <div className="flex gap-0.5">
                {[1, 2, 3, 4, 5].map((score) => (
                  <Star
                    key={score}
                    size={10}
                    className={cn(score <= (customer.reliability_score || 0) ? 'fill-amber-400 text-amber-400' : 'text-muted-foreground/30')}
                  />
                ))}
              </div>
            </div>
          </MotionButton>
        )
      })}
    </div>
  )
}

function SupplierList({ suppliers, supplierStats, search, onAddSupplier }) {
  const navigate = useNavigate()
  const createSupplier = useCreateSembakoSupplier()

  const handleQuickAdd = async (preset) => {
    try {
      await createSupplier.mutateAsync({
        supplier_name: preset.name,
        phone: preset.phone,
        address: preset.address,
        notes: preset.notes
      })
    } catch {
      // toast already handled by mutation hook
    }
  }

  const filtered = useMemo(() => {
    return suppliers
      .filter((supplier) => {
        const haystack = [supplier.supplier_name, supplier.phone, supplier.address]
          .filter(Boolean)
          .join(' ')
          .toLowerCase()
        return haystack.includes(search.toLowerCase())
      })
      .sort((left, right) => {
        const leftValue = left.total_outstanding || 0
        const rightValue = right.total_outstanding || 0
        return rightValue - leftValue
      })
  }, [search, suppliers])

  if (!filtered.length) {
    return (
      <div className="space-y-6">
        <SembakoEmptyState
          icon={Package}
          title={search ? "Supplier Tidak Ditemukan" : "Belum Ada Supplier Terdaftar"}
          description={
            search
              ? `Tidak ada supplier yang cocok dengan kata kunci "${search}".`
              : "Belum ada supplier yang tersimpan. Tambahkan supplier baru atau gunakan rekomendasi suplier bawang & kemasan siap pakai."
          }
          actionLabel="+ Tambah Supplier Baru"
          onAction={onAddSupplier}
          color="green"
        />

        {!search && (
          <div className="max-w-lg mx-auto p-5 rounded-3xl bg-amber-50/70 dark:bg-amber-950/20 border border-amber-200/60 dark:border-amber-500/20 text-center space-y-3 shadow-xs">
            <p className="text-xs font-black uppercase tracking-wider text-amber-900 dark:text-amber-300">
              🌾 Rekomendasi Suplier Bawang & Kemasan (1-Klik Tambah)
            </p>
            <p className="text-xs text-slate-600 dark:text-slate-400">
              Klik partner di bawah untuk mendaftarkannya otomatis ke sistem:
            </p>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5 pt-1 text-left">
              {[
                { name: 'Petani Bawang Boyolali', phone: '0812-3456-7890', address: 'Cepogo, Boyolali', notes: 'Bahan Baku Mentah Boyolali' },
                { name: 'Pengepul Pasar Legi Solo', phone: '0857-1122-3344', address: 'Pasar Legi, Solo', notes: 'Bawang Curah & Bumbu' },
                { name: 'Percetakan Kemasan Solo Jaya', phone: '0878-9988-7766', address: 'Banjarsari, Surakarta', notes: 'Pouch, Stiker & Label' },
                { name: 'Pabrik Botol & Toples PET', phone: '0821-4455-6677', address: 'Grogol, Sukoharjo', notes: 'Toples PET & Dus' },
              ].map((p) => (
                <button
                  key={p.name}
                  type="button"
                  onClick={() => handleQuickAdd(p)}
                  disabled={createSupplier.isPending}
                  className="p-3 rounded-2xl bg-white dark:bg-white/5 hover:bg-amber-500 hover:text-white dark:hover:bg-amber-500 border border-amber-200/80 dark:border-white/10 transition group text-left cursor-pointer shadow-xs disabled:opacity-50"
                >
                  <p className="text-xs font-black text-slate-900 dark:text-white group-hover:text-white truncate">
                    +{p.name}
                  </p>
                  <p className="text-[10px] text-slate-500 dark:text-slate-400 group-hover:text-amber-100 mt-0.5">
                    {p.notes} • {p.address}
                  </p>
                </button>
              ))}
            </div>
          </div>
        )}
      </div>
    )
  }

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
      {filtered.map((supplier) => {
        const stats = supplierStats[supplier.id] || {}
        const lastDate = stats.lastPurchaseDate
          ? new Date(stats.lastPurchaseDate).toLocaleDateString('id-ID', { day: '2-digit', month: 'short', year: '2-digit' })
          : null

        return (
          <MotionButton
            key={supplier.id}
            type="button"
            onClick={() => navigate(`supplier/${supplier.id}`)}
            whileTap={{ scale: 0.992 }}
            className="group flex items-center justify-between rounded-2xl border border-border/60 bg-card p-4 text-left shadow-sm transition-all hover:border-slate-500/30 cursor-pointer"
          >
            <div className="flex min-w-0 items-center gap-3">
              <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl border border-[#0F172A]/20 bg-[#0F172A]/10">
                <Package size={20} className="text-[#0F172A]" />
              </div>

              <div className="min-w-0">
                <h3 className="truncate font-sans text-sm font-bold text-foreground">
                  {supplier.supplier_name}
                </h3>

                <div className="mt-1 flex flex-wrap items-center gap-2 text-xs text-muted-foreground">
                  {supplier.phone && <MiniInfo icon={Phone} text={supplier.phone} />}
                  {lastDate && <MiniInfo icon={MapPin} text={`Batch ${lastDate}`} />}
                </div>

                <div className="mt-2 flex flex-wrap gap-3">
                  <MetricBlock label="Sisa Hutang" value={formatIDR(supplier.total_outstanding || 0)} tone={supplier.total_outstanding > 0 ? "red" : "green"} compact />
                  <MetricBlock label="Nilai Belanja" value={formatIDR(supplier.total_purchase_value || 0)} tone="default" compact />
                </div>
              </div>
            </div>

            <ChevronRight className="ml-2 text-muted-foreground transition-all group-hover:translate-x-1 group-hover:text-[#0F172A] shrink-0" size={16} />
          </MotionButton>
        )
      })}
    </div>
  )
}

function Field({ label, children }) {
  return (
    <div className="space-y-2">
      <label className="ml-1 text-[10px] font-black uppercase tracking-widest text-[#94A3B8]">
        {label}
      </label>
      {children}
    </div>
  )
}

function MetricBlock({ label, value, tone = 'default', compact = false }) {
  return (
    <div className="space-y-1">
      <p className="text-[9px] font-black uppercase tracking-widest text-[#94A3B8]">
        {label}
      </p>
      <p
        className={cn(
          'font-display font-black tracking-tight',
          compact ? 'text-base' : 'text-xl',
          tone === 'red' && 'text-[#EF4444]',
          tone === 'green' && 'text-[#34D399]',
          tone === 'amber' && 'text-[#475569] dark:text-[#E2E8F0]',
          tone === 'default' && 'text-foreground'
        )}
      >
        {value}
      </p>
    </div>
  )
}

function MiniInfo({ icon: Icon, text }) {
  const El = Icon
  return (
    <span className="inline-flex max-w-[180px] items-center gap-1 truncate">
      <El size={10} />
      <span className="truncate">{text}</span>
    </span>
  )
}

