import { useState } from 'react'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import * as z from 'zod'
import { useQuery, useQueryClient } from '@tanstack/react-query'
import { supabase } from '@/lib/supabase'
import { useAuth } from '@/lib/hooks/useAuth'
import { useMediaQuery } from '@/lib/hooks/useMediaQuery'
import { Button } from '@/components/ui/button'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { Input } from '@/components/ui/input'
import { Card } from '@/components/ui/card'
import { Separator } from '@/components/ui/separator'
import { PhoneInput } from '@/components/ui/PhoneInput'
import { ChevronLeft, TrendingUp, TrendingDown, ChevronsUpDown, Check, Plus, ChevronDown, AlertCircle, MapPin } from 'lucide-react'
import { PROVINCES } from '@/lib/constants/regions'

const FIELD_LABELS = {
  rpa_id: 'Pembeli RPA',
  price_per_kg: 'Harga Jual',
  payment_status: 'Status Pembayaran',
  paid_amount: 'Jumlah Bayar',
  transaction_date: 'Tanggal Jual',
  due_date: 'Tanggal Jatuh Tempo',
  notes: 'Catatan'
}

// NUCLEAR OPTION: Global Zod Mapping to eliminate ALL technical jargon
z.setErrorMap((issue, ctx) => {
  // 1. If schema has a specific message, always prioritize it!
  if (ctx?.defaultError && !ctx.defaultError.includes('Expected') && !ctx.defaultError.includes('Invalid') && !ctx.defaultError.includes('Required')) {
    return { message: ctx.defaultError }
  }
  
  // 2. Generic translation for remaining technical issues
  if (issue.code === z.ZodIssueCode.invalid_type) {
    if (issue.received === 'undefined' || issue.received === 'null' || (issue.received === 'string' && issue.code === 'too_small')) {
      return { message: 'Bagian ini wajib diisi' }
    }
    return { message: 'Format data tidak valid' }
  }
  if (issue.code === z.ZodIssueCode.invalid_enum_value) {
    return { message: 'Pilih salah satu opsi di atas' }
  }
  return { message: ctx.defaultError }
})
import { InputRupiah } from '@/components/ui/InputRupiah'
import { DatePicker } from '@/components/ui/DatePicker'
import { formatIDR, safeNum, PAYMENT_TERMS_LABELS, formatIDRShort } from '@/lib/format'
import { toast } from 'sonner'
import {
  Command, CommandEmpty, CommandGroup,
  CommandInput, CommandItem, CommandSeparator, CommandList
} from '@/components/ui/command'
import {
  Popover, PopoverContent, PopoverTrigger
} from '@/components/ui/popover'

const saleSchema = z.object({
  rpa_id: z.string({ 
    required_error: 'Pilih pembeli RPA terlebih dahulu',
    invalid_type_error: 'Pilih pembeli RPA terlebih dahulu'
  }).min(1, 'Pilih pembeli RPA terlebih dahulu'),
  price_per_kg: z.coerce.number({ 
    required_error: 'Masukkan harga jual',
    invalid_type_error: 'Harga jual harus berupa angka' 
  }).min(1000, 'Harga minimal Rp 1.000'),
  payment_status: z.enum(['lunas', 'belum_lunas', 'sebagian'], { 
    required_error: 'Pilih status pembayaran',
    invalid_type_error: 'Pilih status pembayaran'
  }),
  paid_amount: z.coerce.number({ 
    required_error: 'Masukkan jumlah bayar', 
    invalid_type_error: 'Jumlah bayar harus berupa angka' 
  }).min(0, 'Jumlah bayar minimal 0'),
  transaction_date: z.string({ 
    required_error: 'Pilih tanggal penjualan',
    invalid_type_error: 'Pilih tanggal penjualan'
  }).min(1, 'Pilih tanggal penjualan'),
  due_date: z.string().optional().nullable(),
  notes: z.string().trim().max(500, 'Catatan terlalu panjang (max 500 karakter)').optional()
}).refine((data) => {
  if (data.payment_status === 'sebagian' && (data.paid_amount || 0) <= 0) {
    return false
  }
  return true
}, {
  message: 'Masukkan jumlah yang sudah dibayar',
  path: ['paid_amount']
}).refine((data) => {
  if (data.payment_status !== 'lunas' && !data.due_date) {
    return false
  }
  return true
}, {
  message: 'Pilih tanggal jatuh tempo',
  path: ['due_date']
})

const S = {
  label: { fontSize: 11, fontWeight: 700, color: '#4B6478', textTransform: 'uppercase', letterSpacing: '0.1em', display: 'block', marginBottom: 6, fontFamily: 'Sora' },
  input: 'bg-[#111C24] border-white/10 h-12 rounded-xl text-[#F1F5F9]',
}

const PAYMENT_OPTIONS = [
  { value: 'lunas', label: 'Lunas', color: '#10B981' },
  { value: 'belum_lunas', label: 'Belum Lunas', color: '#F87171' },
  { value: 'sebagian', label: 'Sebagian', color: '#F59E0B' },
]

export default function WizardStepJual({ step1Data, onNext, onBack }) {
  const { tenant } = useAuth()
  const queryClient = useQueryClient()
  const isDesktop = useMediaQuery('(min-width: 1024px)')
  const [openRPA, setOpenRPA] = useState(false)
  const [showQuickAddRPA, setShowQuickAddRPA] = useState(false)
  const [openPaymentTerms, setOpenPaymentTerms] = useState(false)
  const [newRPA, setNewRPA] = useState({ rpa_name: '', phone: '', payment_terms: 'cash', province: '' })
  const [provinceOpen, setProvinceOpen] = useState(false)

  const { formState: { errors }, watch, setValue, handleSubmit, register } = useForm({
    resolver: zodResolver(saleSchema),
    defaultValues: {
      payment_status: 'belum_lunas',
      paid_amount: 0,
      transaction_date: new Date().toISOString().split('T')[0],
      notes: ''
    }
  })

  const rpaId = watch('rpa_id')
  const pricePerKg = watch('price_per_kg')
  const paymentStatus = watch('payment_status')
  const paidAmount = watch('paid_amount')
  const dueDate = watch('due_date')
  const transactionDate = watch('transaction_date')
  const _notes = watch('notes')

  const { data: rpaClients } = useQuery({
    queryKey: ['rpa-clients-active-simple', tenant?.id],
    queryFn: async () => {
      const { data } = await supabase.from('rpa_clients').select('*').eq('tenant_id', tenant.id).eq('is_deleted', false).order('rpa_name')
      return data || []
    },
    enabled: !!tenant?.id
  })

  const { data: marketPrice } = useQuery({
    queryKey: ['market-price-latest-sell', tenant?.id],
    queryFn: async () => {
      // 1. Try to get the latest scraper price
      const { data: scraperData } = await supabase.from('market_prices')
        .select('buyer_price')
        .eq('source', 'auto_scraper')
        .order('price_date', { ascending: false })
        .limit(1).maybeSingle()
        
      if (scraperData?.buyer_price) return scraperData.buyer_price

      // 2. Fallback to platform average sell price
      const { data } = await supabase.from('market_prices').select('avg_sell_price').order('price_date', { ascending: false }).limit(1).maybeSingle()
      if (data?.avg_sell_price) return data.avg_sell_price

      // 3. Fallback to last tenant transaction
      if (tenant?.id) {
        const { data: lastTx } = await supabase.from('sales').select('price_per_kg').eq('tenant_id', tenant.id).order('created_at', { ascending: false }).limit(1).maybeSingle()
        if (lastTx?.price_per_kg) return lastTx.price_per_kg
      }
      return 20500
    }
  })

  const selectedRPA = rpaClients?.find(r => r.id === rpaId)

  // Derived from step1
  const qty = safeNum(step1Data?.quantity)
  const totalWeightKg = safeNum(step1Data?.total_weight_kg)
  const avgWeightKg = safeNum(step1Data?.avg_weight_kg)
  const totalModal = safeNum(step1Data?.total_modal)
  const buyPricePerKg = safeNum(step1Data?.price_per_kg)
 
  const totalRevenue = safeNum(totalWeightKg) * safeNum(pricePerKg)
  const profit = safeNum(totalRevenue) - safeNum(totalModal)
  const marginPerKg = safeNum(totalWeightKg) > 0 ? safeNum(profit) / safeNum(totalWeightKg) : 0

  const handleQuickAddRPA = async () => {
    if (!newRPA.rpa_name) return
    
    const { data, error } = await supabase
      .from('rpa_clients')
      .insert({
        tenant_id: tenant?.id,
        rpa_name: newRPA.rpa_name,
        phone: newRPA.phone || null,
        province: newRPA.province || null,
        payment_terms: newRPA.payment_terms || 'cash',
        buyer_type: 'rpa',
        total_outstanding: 0,
        credit_limit: 0
      })
      .select()
      .single()
    
    if (error) {
      toast.error('Gagal tambah RPA: ' + error.message)
      return
    }
    
    queryClient.invalidateQueries({ queryKey: ['rpa-clients-active-simple'] })
    setValue('rpa_id', data.id, { shouldValidate: true })
    setShowQuickAddRPA(false)
    setNewRPA({ rpa_name: '', phone: '', payment_terms: 'cash', province: '' })
    toast.success(`✅ RPA ${data.rpa_name} ditambahkan!`)
  }

  const onSubmit = (values) => {
    onNext({
      rpa_id: values.rpa_id,
      rpa_name: selectedRPA?.rpa_name,
      rpa_phone: selectedRPA?.phone,
      quantity: qty,
      avg_weight_kg: avgWeightKg,
      total_weight_kg: totalWeightKg,
      price_per_kg: values.price_per_kg,
      total_revenue: safeNum(totalRevenue),
      delivery_cost: 0,
      payment_status: values.payment_status,
      paid_amount: values.payment_status === 'lunas' ? totalRevenue : (values.paid_amount || 0),
      transaction_date: values.transaction_date,
      due_date: values.payment_status !== 'lunas' ? values.due_date : null,
      notes: values.notes || null,
      profit,
      net_revenue: totalRevenue,
    })
  }

  const onError = (errors) => {
    const firstError = Object.keys(errors)[0]
    const el = document.getElementById(firstError) || document.getElementsByName(firstError)[0]
    if (el) {
      el.scrollIntoView({ behavior: 'smooth', block: 'center' })

      let description = errors[firstError]?.message
      if (!description || description.includes('expected') || description.toLowerCase().includes('invalid')) {
        description = `Mohon isi bagian ${FIELD_LABELS[firstError] || firstError} dengan benar`
      }

      toast.error('Informasi Belum Lengkap', {
        description,
        icon: <AlertCircle className="text-red-500" />
      })
    }
  }

  return (
    <form onSubmit={handleSubmit(onSubmit, onError)} className="flex flex-col h-full min-h-0 relative">
      <div className={`flex-1 space-y-4 overflow-y-auto ${isDesktop ? 'px-5 pb-24' : 'px-4 pb-20'}`}>
      <p className="text-[11px] font-black uppercase tracking-widest text-[#4B6478]">Step 2 — Jual ke Siapa?</p>

      {/* Step1 Info Card */}
      <div style={{ background: 'rgba(16, 185, 129, 0.06)', border: '1px solid rgba(16, 185, 129, 0.12)', borderRadius: 12, padding: '12px 14px' }}>
        <p style={{ color: '#10B981', fontSize: 12, margin: 0 }}>
          📦 Stok dari <strong>{step1Data?.farm_name || 'Kandang'}</strong> · {safeNum(qty).toLocaleString('id-ID')} ekor · {safeNum(totalWeightKg) > 1000 ? `${(safeNum(totalWeightKg) / 1000).toFixed(2)} ton` : `${safeNum(totalWeightKg).toFixed(1)} kg`} · Modal <strong>{formatIDR(totalModal)}</strong>
        </p>
      </div>

      {/* RPA Client Selection */}
      <div className="space-y-1.5">
        {!isDesktop && openRPA ? (
          <div className="space-y-3 animate-in fade-in slide-in-from-top-1 duration-200">
            <div className="flex items-center justify-between px-1">
              <label style={S.label}>Cari & Pilih RPA Buyer</label>
              <button 
                type="button" 
                onClick={() => setOpenRPA(false)}
                className="text-[10px] font-black text-red-400 uppercase tracking-wider h-6 px-2"
              >
                Tutup ✕
              </button>
            </div>
            <div className="bg-[#111C24] border border-white/10 rounded-2xl overflow-hidden shadow-2xl">
              <Command className="bg-transparent">
                <CommandInput placeholder="Ketik nama RPA atau pembeli..." className="h-12 border-none text-base" autoFocus />
                <CommandList className="max-h-[350px] overflow-y-auto">
                  <CommandEmpty>
                    <div className="py-8 text-center flex flex-col items-center gap-2">
                      <div className="w-12 h-12 rounded-full bg-white/5 flex items-center justify-center">
                        <AlertCircle className="text-muted-foreground" size={20} />
                      </div>
                      <p className="text-xs text-muted-foreground font-medium">Pembeli tidak ditemukan</p>
                    </div>
                  </CommandEmpty>
                  <CommandGroup>
                    {rpaClients?.map(r => (
                      <CommandItem
                        key={r.id}
                        value={r.rpa_name}
                        onSelect={() => {
                          setValue('rpa_id', r.id, { shouldValidate: true })
                          setOpenRPA(false)
                        }}
                        className="cursor-pointer py-4 px-5 border-b border-white/5 last:border-none aria-selected:bg-emerald-500/10"
                      >
                        <div className="flex-1">
                          <p className="text-sm font-black text-white">{r.rpa_name}</p>
                          <p className="text-[11px] text-[#4B6478] font-bold mt-1 uppercase tracking-tighter">
                            {PAYMENT_TERMS_LABELS[r.payment_terms] || r.payment_terms}
                            {safeNum(r.total_outstanding) > 0 ? ` · Hutang: ${formatIDRShort(r.total_outstanding)}` : ''}
                          </p>
                        </div>
                        {rpaId === r.id && <Check size={16} className="text-emerald-400 ml-2" />}
                      </CommandItem>
                    ))}
                  </CommandGroup>
                  <CommandSeparator className="bg-white/5" />
                  <CommandGroup>
                    <CommandItem
                      onSelect={() => {
                        setOpenRPA(false)
                        setShowQuickAddRPA(true)
                      }}
                      className="cursor-pointer py-4 px-5 text-emerald-400 border-t border-white/5"
                    >
                      <Plus size={16} className="mr-3" />
                      <span className="text-[11px] font-black uppercase tracking-[0.15em]">Tambah RPA Baru</span>
                    </CommandItem>
                  </CommandGroup>
                </CommandList>
              </Command>
            </div>
          </div>
        ) : (
          <>
            <label style={S.label}>Pilih RPA Buyer *</label>
            <Popover modal={true} open={isDesktop ? openRPA : false} onOpenChange={(open) => isDesktop && setOpenRPA(open)}>
              <PopoverTrigger asChild>
                <button type="button" 
                  id="rpa_id"
                  onClick={() => !isDesktop && setOpenRPA(true)}
                  style={{
                    width: '100%',
                    padding: isDesktop ? '13px 14px' : '15px 16px',
                    background: 'hsl(var(--input))',
                    border: errors.rpa_id ? '1px solid #ef4444' : '1px solid hsl(var(--border))',
                    borderRadius: '14px',
                    display: 'flex',
                    justifyContent: 'space-between',
                    alignItems: 'center',
                    cursor: 'pointer',
                    fontSize: '16px',
                    color: rpaId ? 'hsl(var(--foreground))' : 'hsl(var(--muted-foreground))',
                    textAlign: 'left',
                    boxShadow: errors.rpa_id ? '0 0 0 1px #ef4444' : 'none'
                  }}>
                  <span className="truncate font-bold">
                    {selectedRPA ? selectedRPA.rpa_name : 'Pilih pembeli RPA'}
                  </span>
                  <div className="flex items-center gap-2">
                    {rpaId && <Check size={14} className="text-emerald-400" />}
                    <ChevronsUpDown size={14} className="flex-shrink-0 text-muted-foreground" />
                  </div>
                </button>
              </PopoverTrigger>
              {isDesktop && (
                <PopoverContent className="p-0 border-white/5 bg-[#111C24]" style={{ width: 'var(--radix-popover-trigger-width)' }} align="start">
                  <Command className="bg-transparent">
                    <CommandInput placeholder="Cari RPA..." className="h-10 border-none" />
                    <CommandList className="max-h-72 overflow-y-auto">
                      <CommandEmpty>
                        <div style={{ padding: '12px 16px', textAlign: 'center', fontSize: '13px', color: 'hsl(var(--muted-foreground))' }}>RPA tidak ditemukan</div>
                      </CommandEmpty>
                      <CommandGroup>
                        {rpaClients?.map(r => (
                          <CommandItem
                            key={r.id}
                            value={r.rpa_name}
                            onSelect={() => {
                              setValue('rpa_id', r.id, { shouldValidate: true })
                              setOpenRPA(false)
                            }}
                            className="cursor-pointer py-3 px-4 border-b border-white/5 last:border-none focus:bg-white/5"
                          >
                            <div className="flex-1">
                              <p style={{ fontSize: '14px', fontWeight: 600, margin: 0, color: 'hsl(var(--foreground))' }}>{r.rpa_name}</p>
                              <p style={{ fontSize: '12px', color: 'hsl(var(--muted-foreground))', margin: 0 }}>
                                {PAYMENT_TERMS_LABELS[r.payment_terms] || r.payment_terms}
                                {safeNum(r.total_outstanding) > 0 ? ` · Hutang: ${formatIDRShort(r.total_outstanding)}` : ''}
                              </p>
                            </div>
                            {rpaId === r.id && <Check size={14} className="text-emerald-400 ml-2" />}
                          </CommandItem>
                        ))}
                      </CommandGroup>
                      <CommandSeparator className="bg-white/5" />
                      <CommandGroup>
                        <CommandItem
                          onSelect={() => {
                            setOpenRPA(false)
                            setShowQuickAddRPA(true)
                          }}
                          className="cursor-pointer py-3 px-4 text-emerald-400 focus:bg-emerald-400/5"
                        >
                          <Plus size={14} className="mr-2" />
                          <span className="text-xs font-black uppercase tracking-widest">Tambah RPA Baru</span>
                        </CommandItem>
                      </CommandGroup>
                    </CommandList>
                  </Command>
                </PopoverContent>
              )}
            </Popover>
          </>
        )}
        {errors.rpa_id && <p className="text-[10px] text-red-500 font-bold">{errors.rpa_id.message}</p>}

        {/* Quick Add RPA */}
        {showQuickAddRPA && (
          <div style={{
            marginTop: 8,
            padding: '14px',
            background: 'rgba(16, 185, 129, 0.06)',
            border: '1px solid rgba(16, 185, 129, 0.20)',
            borderRadius: '12px',
            display: 'flex',
            flexDirection: 'column',
            gap: 10
          }}>
            <p style={{ fontSize: '12px', fontWeight: 700, color: '#10B981', textTransform: 'uppercase', letterSpacing: '0.8px', margin: 0 }}>
              RPA Baru
            </p>
            
            {/* Nama RPA */}
            <div className="grid grid-cols-2 gap-2">
              <div>
                <label htmlFor="new_rpa_name" style={{ fontSize: '11px', color: '#4B6478', textTransform: 'uppercase', letterSpacing: '0.8px', display: 'block', marginBottom: 6 }}>
                  Nama RPA / Pembeli *
                </label>
                <Input
                  id="new_rpa_name"
                  name="new_rpa_name"
                  placeholder="RPA Prima Jaya"
                  value={newRPA.rpa_name}
                  onChange={e => setNewRPA(p => ({ ...p, rpa_name: e.target.value }))}
                  className="h-10 bg-black/20"
                />
              </div>

              <div>
                <label style={{ fontSize: '11px', color: '#4B6478', textTransform: 'uppercase', letterSpacing: '0.8px', display: 'block', marginBottom: 6 }}>
                  Provinsi *
                </label>
                <Popover open={provinceOpen} onOpenChange={setProvinceOpen}>
                  <PopoverTrigger asChild>
                    <button
                      type="button"
                      className="flex h-10 w-full items-center justify-between rounded-md border border-white/10 bg-black/20 px-3 py-2 text-[11px] font-bold text-[#F1F5F9] transition-colors hover:bg-black/30"
                    >
                      <span className="truncate">{newRPA.province || 'Pilih Provinsi'}</span>
                      <ChevronsUpDown className="ml-2 h-3 w-3 shrink-0 opacity-50" />
                    </button>
                  </PopoverTrigger>
                  <PopoverContent className="w-[var(--radix-popover-trigger-width)] p-0 bg-[#111C24] border-white/10 shadow-2xl" align="start">
                    <Command className="bg-transparent">
                      <CommandInput placeholder="Cari provinsi..." className="h-9 text-xs" />
                      <CommandList>
                        <CommandEmpty className="py-2 text-center text-[10px] text-[#4B6478] font-bold uppercase">Tidak ditemukan</CommandEmpty>
                        <CommandGroup className="max-h-[250px] overflow-y-auto overflow-x-hidden">
                          {PROVINCES.map((p) => (
                            <CommandItem
                              key={p}
                              value={p}
                              onSelect={() => {
                                setNewRPA(prev => ({ ...prev, province: p }))
                                setProvinceOpen(false)
                              }}
                              className="text-[11px] font-bold uppercase tracking-wider py-2 group cursor-pointer"
                            >
                              <Check
                                className={`mr-2 h-3 w-3 text-emerald-500 ${newRPA.province === p ? 'opacity-100' : 'opacity-0'}`}
                              />
                              <span className={newRPA.province === p ? 'text-emerald-400' : 'text-[#F1F5F9]'}>{p}</span>
                            </CommandItem>
                          ))}
                        </CommandGroup>
                      </CommandList>
                    </Command>
                  </PopoverContent>
                </Popover>
              </div>
            </div>
            
            {/* HP + Payment Terms */}
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 8 }}>
              <div>
                <label htmlFor="new_rpa_phone" style={{ fontSize: '11px', color: '#4B6478', textTransform: 'uppercase', letterSpacing: '0.8px', display: 'block', marginBottom: 6 }}>
                  No HP
                </label>
                <PhoneInput
                  id="new_rpa_phone"
                  name="new_rpa_phone"
                  placeholder="081..."
                  value={newRPA.phone}
                  onChange={e => setNewRPA(p => ({ ...p, phone: e.target.value }))}
                  className="h-10 bg-black/20"
                />
              </div>
              
              <div>
                <label style={{ fontSize: '11px', color: '#4B6478', textTransform: 'uppercase', letterSpacing: '0.8px', display: 'block', marginBottom: 6 }}>
                  Pembayaran
                </label>
                <div style={{ position: 'relative' }}>
                  <button
                    type="button"
                    onClick={() => setOpenPaymentTerms(!openPaymentTerms)}
                    style={{
                      width: '100%',
                      padding: '13px 12px',
                      background: 'hsl(var(--input))',
                      border: '1px solid hsl(var(--border))',
                      borderRadius: '10px',
                      fontSize: '14px',
                      fontWeight: 600,
                      color: 'hsl(var(--foreground))',
                      cursor: 'pointer',
                      display: 'flex',
                      justifyContent: 'space-between',
                      alignItems: 'center',
                      height: '50px'
                    }}
                  >
                    <span>{PAYMENT_TERMS_LABELS[newRPA.payment_terms] || newRPA.payment_terms}</span>
                    <ChevronDown size={13} color="hsl(var(--muted-foreground))" />
                  </button>
                  
                  {openPaymentTerms && (
                    <>
                      <div
                        style={{ position: 'fixed', inset: 0, zIndex: 40 }}
                        onClick={() => setOpenPaymentTerms(false)}
                      />
                      <div style={{
                        position: 'absolute',
                        top: 'calc(100% + 4px)',
                        left: 0, right: 0,
                        background: 'hsl(var(--popover))',
                        border: '1px solid hsl(var(--border))',
                        borderRadius: '10px',
                        overflow: 'hidden',
                        zIndex: 50,
                        boxShadow: '0 8px 24px rgba(0,0,0,0.4)'
                      }}>
                        {Object.entries(PAYMENT_TERMS_LABELS).map(([val, label], i, arr) => (
                          <button
                            key={val}
                            type="button"
                            onClick={() => {
                              setNewRPA(p => ({ ...p, payment_terms: val }))
                              setOpenPaymentTerms(false)
                            }}
                            style={{
                              width: '100%',
                              padding: '11px 14px',
                              background: newRPA.payment_terms === val ? 'rgba(16, 185, 129, 0.10)' : 'transparent',
                              border: 'none',
                              borderBottom: i < arr.length - 1 ? '1px solid hsl(var(--border))' : 'none',
                              color: newRPA.payment_terms === val ? '#10B981' : 'hsl(var(--foreground))',
                              fontSize: '14px',
                              fontWeight: newRPA.payment_terms === val ? 700 : 400,
                              cursor: 'pointer',
                              textAlign: 'left',
                              display: 'flex',
                              justifyContent: 'space-between',
                              alignItems: 'center'
                            }}
                          >
                            <span>{label}</span>
                            {newRPA.payment_terms === val && <Check size={12} color="#10B981" />}
                          </button>
                        ))}
                      </div>
                    </>
                  )}
                </div>
              </div>
            </div>
            
            <div className="flex gap-2">
              <Button type="button" onClick={handleQuickAddRPA} disabled={!newRPA.rpa_name} className="flex-1 bg-emerald-500 hover:bg-emerald-600 text-white font-black text-[13px] h-10 rounded-lg">SIMPAN & PILIH</Button>
              <Button type="button" variant="ghost" onClick={() => { setShowQuickAddRPA(false); setNewRPA({ rpa_name: '', phone: '', payment_terms: 'cash' }) }} className="px-3 text-muted-foreground font-bold text-[13px] h-10">BATAL</Button>
            </div>
          </div>
        )}
      </div>

      {/* Harga Jual */}
      <div className="space-y-1.5">
        <div className="flex justify-between items-center">
          <label htmlFor="price_per_kg_jual" style={S.label}>Harga Jual (Rp/kg) *</label>
          {marketPrice && (
            <button type="button" onClick={() => setValue('price_per_kg', marketPrice, { shouldValidate: true })}
              className="text-[10px] text-emerald-400 font-black uppercase tracking-wider hover:underline">
              Pakai harga pasar: {safeNum(marketPrice).toLocaleString('id-ID')} →
            </button>
          )}
        </div>
        <InputRupiah id="price_per_kg" name="price_per_kg" value={pricePerKg} onChange={(val) => setValue('price_per_kg', val, { shouldValidate: true })} placeholder="20.500" className={`${S.input} text-lg font-bold text-white ${errors.price_per_kg ? 'border-red-500 ring-1 ring-red-500' : ''}`} />
        {errors.price_per_kg && <p className="text-[10px] text-red-500 font-bold">{errors.price_per_kg.message}</p>}

        {pricePerKg > 0 && buyPricePerKg > 0 && (
          <div className={`flex items-center gap-1.5 text-[11px] font-black uppercase mt-1 ${pricePerKg >= buyPricePerKg ? 'text-emerald-400' : 'text-red-400'}`}>
            {pricePerKg >= buyPricePerKg
              ? <><TrendingUp size={13} strokeWidth={3} /> Margin Rp {safeNum(pricePerKg - buyPricePerKg).toLocaleString('id-ID')}/kg ✓</>
              : <><TrendingDown size={13} strokeWidth={3} /> ⚠️ Di bawah harga beli!</>
            }
          </div>
        )}
      </div>

      {/* Status Pembayaran */}
      <div className="space-y-1.5">
        <label style={S.label}>Status Pembayaran *</label>
        <div className="flex gap-2">
          {PAYMENT_OPTIONS.map(opt => (
            <button key={opt.value} type="button" onClick={() => setValue('payment_status', opt.value, { shouldValidate: true })}
              className={`flex-1 py-3 rounded-xl text-[11px] font-black uppercase tracking-widest transition-all ${paymentStatus === opt.value ? 'ring-2 ring-emerald-500/50 bg-emerald-500/10 text-emerald-400' : 'bg-[#111C24] border border-white/5 text-[#4B6478]'}`}
              style={{
                color: paymentStatus === opt.value ? opt.color : undefined,
                borderColor: paymentStatus === opt.value ? `${opt.color}40` : undefined,
                background: paymentStatus === opt.value ? `${opt.color}10` : undefined,
              }}
            >
              {opt.label}
            </button>
          ))}
        </div>
      </div>

      {/* Conditional: partial payment */}
      {paymentStatus === 'sebagian' && (
        <div className="space-y-1.5">
          <label htmlFor="paid_amount" style={S.label}>Sudah Dibayar</label>
          <InputRupiah id="paid_amount" name="paid_amount" value={paidAmount} onChange={(val) => setValue('paid_amount', val, { shouldValidate: true })} placeholder="0" className={S.input} />
          {errors.paid_amount && <p className="text-[10px] text-red-500 font-bold">{errors.paid_amount.message}</p>}
        </div>
      )}

      {/* Conditional: due date */}
      {paymentStatus !== 'lunas' && (
        <div className="space-y-1.5">
          <label style={S.label}>Jatuh Tempo</label>
          <DatePicker id="due_date" value={dueDate} onChange={(val) => setValue('due_date', val, { shouldValidate: true })} placeholder="Pilih jatuh tempo" className={errors.due_date ? 'border-red-500 ring-1 ring-red-500' : ''} />
          {errors.due_date && <p className="text-[10px] text-red-500 font-bold">{errors.due_date.message}</p>}
        </div>
      )}

      {/* Tanggal */}
      <div className="space-y-1.5">
        <label style={S.label}>Tanggal Jual</label>
        <DatePicker id="transaction_date" value={transactionDate} onChange={(val) => setValue('transaction_date', val, { shouldValidate: true })} placeholder="Pilih tanggal" className={errors.transaction_date ? 'border-red-500 ring-1 ring-red-500' : ''} />
      </div>

      {/* Catatan */}
      <div className="space-y-1.5">
        <label htmlFor="jual_notes" style={S.label}>Catatan (Opsional)</label>
        <Textarea id="jual_notes" name="jual_notes" className="bg-[#111C24] border-white/10 rounded-xl min-h-[72px] text-sm" placeholder="Catatan tambahan..." {...register('notes')} />
        {errors.notes && <p className="text-[10px] text-red-500 font-bold">{errors.notes.message}</p>}
      </div>

      {/* Profit Preview */}
      {totalRevenue > 0 && (
        <Card className={`rounded-2xl p-5 border-emerald-500/15 ${profit >= 0 ? 'bg-emerald-500/5' : 'bg-red-500/5 border-red-500/15'}`}>
          <p className={`text-[10px] font-black uppercase tracking-[0.2em] mb-4 ${profit >= 0 ? 'text-emerald-400' : 'text-red-400'}`}>Profit Kotor Preview</p>
          <div className="space-y-2.5 text-[13px]">
            <div className="flex justify-between items-baseline"><span className="text-[#4B6478] font-bold uppercase text-[11px] tracking-wider">Pendapatan</span><span className="font-bold text-white">{formatIDR(totalRevenue)}</span></div>
            <div className="flex justify-between items-baseline"><span className="text-[#4B6478] font-bold uppercase text-[11px] tracking-wider">Modal</span><span className="font-bold text-red-400">- {formatIDR(totalModal)}</span></div>
            <Separator className="bg-white/5" />
            <div className="flex justify-between items-center py-1">
              <span className={`font-black uppercase text-sm tracking-widest ${profit >= 0 ? 'text-emerald-400' : 'text-red-400'}`}>Kotor</span>
              <span className={`text-2xl font-black tabular-nums tracking-tighter ${profit >= 0 ? 'text-emerald-400' : 'text-red-400'}`}>{profit >= 0 ? '+' : ''}{formatIDR(profit)}</span>
            </div>
            <div className="flex justify-between items-baseline text-[12px]">
              <span className="text-[#4B6478] font-bold uppercase tracking-wider">Margin/kg</span>
              <span className="font-bold text-white">{formatIDR(safeNum(marginPerKg))}/kg</span>
            </div>
            {profit < 0 && <p className="text-[11px] text-red-400 font-bold uppercase mt-2">⚠️ Transaksi ini merugi!</p>}
          </div>
        </Card>
      )}

      </div>
      
      {/* Buttons — Sticky Footer */}
      <div className={`sticky bottom-0 z-10 bg-[#0C1319] border-t border-white/10 flex gap-3 ${isDesktop ? 'p-4 px-5' : 'p-3 px-4'}`}>
        <Button type="button" variant="ghost" onClick={onBack} className={`gap-2 text-[#4B6478] hover:text-white font-bold rounded-xl ${isDesktop ? 'h-12' : 'h-10 text-[11px]'}`}>
          <ChevronLeft size={16} /> KEMBALI
        </Button>
        <Button type="submit" className={`flex-1 rounded-2xl font-black tracking-widest shadow-lg shadow-emerald-500/20 ${isDesktop ? 'h-14 text-sm' : 'h-11 text-[12px]'}`} style={{ background: '#10B981', color: 'white' }}>
          LANJUT KE PENGIRIMAN →
        </Button>
      </div>
    </form>
  )
}
