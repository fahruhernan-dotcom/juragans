import { useState } from 'react'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import * as z from 'zod'
import { useQuery, useQueryClient } from '@tanstack/react-query'
import { supabase } from '@/lib/supabase'
import { useAuth } from '@/lib/hooks/useAuth'
import { useMediaQuery } from '@/lib/hooks/useMediaQuery'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { Card } from '@/components/ui/card'
import { Separator } from '@/components/ui/separator'
import { PhoneInput } from '@/components/ui/PhoneInput'
import { AlertCircle, ChevronLeft, ChevronsUpDown, Check, Plus, ChevronDown, TrendingDown, MapPin } from 'lucide-react'
import { PROVINCES } from '@/lib/constants/regions'
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue
} from '@/components/ui/select'

const FIELD_LABELS = {
  farm_id: 'Kandang',
  quantity: 'Jumlah Ekor',
  avg_weight_kg: 'Rata-rata Berat',
  price_per_kg: 'Harga Beli',
  transaction_date: 'Tanggal Beli',
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
import { InputNumber } from '@/components/ui/InputNumber'
import { InputRupiah } from '@/components/ui/InputRupiah'
import { DatePicker } from '@/components/ui/DatePicker'
import { formatIDR, safeNum, formatWeight } from '@/lib/format'
import { toast } from 'sonner'
import {
  Command, CommandEmpty, CommandGroup,
  CommandInput, CommandItem, CommandSeparator, CommandList
} from '@/components/ui/command'
import {
  Popover, PopoverContent, PopoverTrigger
} from '@/components/ui/popover'

const schema = z.object({
  farm_id: z.string({ 
    required_error: 'Pilih kandang terlebih dahulu',
    invalid_type_error: 'Pilih kandang terlebih dahulu'
  }).min(1, 'Pilih kandang terlebih dahulu'),
  quantity: z.coerce.number({ 
    required_error: 'Masukkan jumlah ekor',
    invalid_type_error: 'Jumlah ekor harus berupa angka' 
  }).min(1, 'Minimal 1 ekor'),
  avg_weight_kg: z.coerce.number({ 
    required_error: 'Masukkan bobot',
    invalid_type_error: 'Bobot harus berupa angka' 
  }).min(0.1, 'Minimal 0.1 kg'),
  price_per_kg: z.coerce.number({ 
    required_error: 'Masukkan harga',
    invalid_type_error: 'Harga harus berupa angka' 
  }).min(1000, 'Harga minimal Rp 1.000'),
  transaction_date: z.string({ 
    required_error: 'Pilih tanggal transaksi',
    invalid_type_error: 'Pilih tanggal transaksi'
  }).min(1, 'Pilih tanggal transaksi'),
  notes: z.string().trim().max(500, 'Catatan terlalu panjang (max 500 karakter)').optional()
})

const S = {
  label: { fontSize: 11, fontWeight: 700, color: '#4B6478', textTransform: 'uppercase', letterSpacing: '0.1em', display: 'block', marginBottom: 6, fontFamily: 'Sora' },
  input: 'bg-[#111C24] border-white/10 h-12 rounded-xl text-[#F1F5F9]',
}

export default function WizardStepBeli({ onNext, onBack, title = 'Step 1 — Dari Kandang Mana?', orderData }) {
  const { tenant } = useAuth()
  const queryClient = useQueryClient()
  const isDesktop = useMediaQuery('(min-width: 1024px)')
  const [inputMode, setInputMode] = useState('berat')
  const [totalWeightInput, setTotalWeightInput] = useState('')
  const [weightUnit, setWeightUnit] = useState('kg')
  const [unitOpen, setUnitOpen] = useState(false)
  const [openKandang, setOpenKandang] = useState(false)
  const [showQuickAddKandang, setShowQuickAddKandang] = useState(false)
  const [newFarm, setNewFarm] = useState({ farm_name: '', owner_name: '', phone: '', province: '' })
  const [provinceOpen, setProvinceOpen] = useState(false)

  const { register, handleSubmit, watch, setValue, formState: { errors } } = useForm({
    resolver: zodResolver(schema),
    defaultValues: {
      transaction_date: new Date().toISOString().split('T')[0],
      avg_weight_kg: 1.85,
    }
  })

  const { data: marketBuyPrice } = useQuery({
    queryKey: ['market-price-latest-buy', tenant?.id],
    queryFn: async () => {
      // 1. Try to get the latest scraper price (Chickin.id reference)
      const { data: scraperData } = await supabase.from('market_prices')
        .select('farm_gate_price')
        .eq('source', 'auto_scraper')
        .order('price_date', { ascending: false })
        .limit(1).maybeSingle()
        
      if (scraperData?.farm_gate_price) return scraperData.farm_gate_price

      // 2. Fallback to platform average buy price
      const { data } = await supabase.from('market_prices').select('avg_buy_price').order('price_date', { ascending: false }).limit(1).maybeSingle()
      if (data?.avg_buy_price) return data.avg_buy_price
      
      // 3. Fallback to last tenant transaction
      if (tenant?.id) {
        const { data: lastTx } = await supabase.from('purchases').select('price_per_kg').eq('tenant_id', tenant.id).order('created_at', { ascending: false }).limit(1).maybeSingle()
        if (lastTx?.price_per_kg) return lastTx.price_per_kg
      }
      return 19800
    }
  })

  const { data: farms } = useQuery({
    queryKey: ['farms-active-simple', tenant?.id],
    queryFn: async () => {
      const { data } = await supabase.from('farms')
        .select('*')
        .eq('tenant_id', tenant.id)
        .eq('is_deleted', false)
        .order('farm_name')
      return data || []
    },
    enabled: !!tenant?.id
  })

  const qty = watch('quantity')
  const avgW = watch('avg_weight_kg')
  const price = watch('price_per_kg')
  const farmId = watch('farm_id')

  const selectedKandang = farms?.find(f => f.id === farmId)

  const weightMultiplier = weightUnit === 'ton' ? 1000 : weightUnit === 'rit' ? 5000 : 1
  const totalWeight = inputMode === 'berat'
    ? (parseFloat(totalWeightInput) || 0) * weightMultiplier
    : safeNum(qty) * safeNum(avgW)
  const totalCost = safeNum(totalWeight) * safeNum(price)

  const handleQuickAddFarm = async () => {
    if (!newFarm.farm_name || !newFarm.owner_name || !tenant?.id) return
    
    const { data, error } = await supabase
      .from('farms')
      .insert({
        tenant_id: tenant?.id,
        farm_name: newFarm.farm_name,
        owner_name: newFarm.owner_name,
        phone: newFarm.phone || null,
        province: newFarm.province || null,
        status: 'growing',
        available_stock: 0,
        chicken_type: 'broiler'
      })
      .select()
      .single()
    
    if (error) {
      toast.error('Gagal tambah kandang: ' + error.message)
      return
    }
    
    queryClient.invalidateQueries({ queryKey: ['farms-active-simple'] })
    setValue('farm_id', data.id)
    setShowQuickAddKandang(false)
    setNewFarm({ farm_name: '', owner_name: '', phone: '', province: '' })
    toast.success(`✅ Kandang ${data.farm_name} ditambahkan!`)
  }

  const farmLabel = (farm) => {
    const parts = [farm.owner_name]
    if (farm.location) parts.push(farm.location)
    if (farm.available_stock > 0) {
      parts.push(`${safeNum(farm.available_stock).toLocaleString('id-ID')} ekor`)
    }
    return parts.join(' · ')
  }

  const onSubmit = (values) => {
    const finalKg = inputMode === 'berat'
      ? (parseFloat(totalWeightInput) || 0) * weightMultiplier
      : safeNum(values.quantity) * safeNum(values.avg_weight_kg)
    const total_cost = safeNum(finalKg) * safeNum(values.price_per_kg)

    onNext({
      farm_id: values.farm_id,
      farm_name: selectedKandang?.farm_name,
      quantity: inputMode === 'berat' ? Math.round(finalKg / (values.avg_weight_kg || 1.85)) : values.quantity,
      avg_weight_kg: values.avg_weight_kg,
      total_weight_kg: finalKg,
      price_per_kg: values.price_per_kg,
      total_cost,
      transport_cost: 0,
      other_cost: 0,
      total_modal: total_cost,
      transaction_date: values.transaction_date,
      notes: values.notes || null
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
      <p className="text-[11px] font-black uppercase tracking-widest text-[#4B6478]">{title}</p>

      {orderData && (
        <div style={{ background: 'rgba(96,165,250,0.06)', border: '1px solid rgba(96,165,250,0.20)', borderRadius: 12, padding: '12px 14px' }}>
          <p style={{ color: '#93C5FD', fontSize: 12, margin: 0 }}>
            📋 Order dari <strong>{orderData.rpa_name}</strong> · Target jual Rp {safeNum(orderData.price_per_kg).toLocaleString('id-ID')}/kg
          </p>
        </div>
      )}

      {/* Kandang Selection */}
      <div className="space-y-1.5">
        {!isDesktop && openKandang ? (
          <div className="space-y-3 animate-in fade-in slide-in-from-top-1 duration-200">
            <div className="flex items-center justify-between px-1">
              <label style={S.label}>Cari & Pilih Kandang</label>
              <button 
                type="button" 
                onClick={() => setOpenKandang(false)}
                className="text-[10px] font-black text-red-400 uppercase tracking-wider h-6 px-2"
              >
                Tutup ✕
              </button>
            </div>
            <div className="bg-[#111C24] border border-white/10 rounded-2xl overflow-hidden shadow-2xl">
              <Command className="bg-transparent">
                <CommandInput placeholder="Ketik nama kandang atau pemilik..." className="h-12 border-none text-base" autoFocus />
                <CommandList className="max-h-[350px] overflow-y-auto">
                  <CommandEmpty>
                    <div className="py-8 text-center flex flex-col items-center gap-2">
                      <div className="w-12 h-12 rounded-full bg-white/5 flex items-center justify-center">
                        <AlertCircle className="text-muted-foreground" size={20} />
                      </div>
                      <p className="text-xs text-muted-foreground font-medium">Kandang tidak ditemukan</p>
                    </div>
                  </CommandEmpty>
                  <CommandGroup>
                    {farms?.map(farm => (
                      <CommandItem
                        key={farm.id}
                        value={farm.farm_name}
                        onSelect={() => {
                          setValue('farm_id', farm.id, { shouldValidate: true })
                          setOpenKandang(false)
                        }}
                        className="cursor-pointer py-4 px-5 border-b border-white/5 last:border-none aria-selected:bg-emerald-500/10"
                      >
                        <div className="flex-1">
                          <p className="text-sm font-black text-white">{farm.farm_name}</p>
                          <p className="text-[11px] text-[#4B6478] font-bold mt-1 uppercase tracking-tighter">{farmLabel(farm)}</p>
                        </div>
                        {farmId === farm.id && <Check size={16} className="text-emerald-400 ml-2" />}
                      </CommandItem>
                    ))}
                  </CommandGroup>
                  <CommandSeparator className="bg-white/5" />
                  <CommandGroup>
                    <CommandItem
                      onSelect={() => {
                        setOpenKandang(false)
                        setShowQuickAddKandang(true)
                      }}
                      className="cursor-pointer py-4 px-5 text-emerald-400 border-t border-white/5"
                    >
                      <Plus size={16} className="mr-3" />
                      <span className="text-[11px] font-black uppercase tracking-[0.15em]">Tambah Kandang Baru</span>
                    </CommandItem>
                  </CommandGroup>
                </CommandList>
              </Command>
            </div>
          </div>
        ) : (
          <>
            <label style={S.label}>Pilih Kandang *</label>
            <Popover modal={true} open={isDesktop ? openKandang : false} onOpenChange={(open) => isDesktop && setOpenKandang(open)}>
              <PopoverTrigger asChild>
                <button type="button" 
                  id="farm_id"
                  onClick={() => !isDesktop && setOpenKandang(true)}
                  style={{
                    width: '100%',
                    padding: isDesktop ? '13px 14px' : '15px 16px',
                    background: 'hsl(var(--input))',
                    border: errors.farm_id ? '1px solid #ef4444' : '1px solid hsl(var(--border))',
                    borderRadius: '14px',
                    display: 'flex',
                    justifyContent: 'space-between',
                    alignItems: 'center',
                    cursor: 'pointer',
                    fontSize: '16px',
                    color: farmId ? 'hsl(var(--foreground))' : 'hsl(var(--muted-foreground))',
                    textAlign: 'left',
                    boxShadow: errors.farm_id ? '0 0 0 1px #ef4444' : 'none'
                  }}>
                  <span className="truncate font-bold">
                    {selectedKandang ? selectedKandang.farm_name : 'Pilih kandang sumber'}
                  </span>
                  <div className="flex items-center gap-2">
                    {farmId && <Check size={14} className="text-emerald-400" />}
                    <ChevronsUpDown size={14} className="flex-shrink-0 text-muted-foreground" />
                  </div>
                </button>
              </PopoverTrigger>
              {isDesktop && (
                <PopoverContent className="p-0 border-white/5 bg-[#111C24]" style={{ width: 'var(--radix-popover-trigger-width)' }} align="start">
                  <Command className="bg-transparent">
                    <CommandInput placeholder="Cari kandang..." className="h-10 border-none" />
                    <CommandList className="max-h-72 overflow-y-auto">
                      <CommandEmpty>
                        <div className="py-2 text-center text-xs text-muted-foreground">Kandang tidak ditemukan</div>
                      </CommandEmpty>
                      <CommandGroup>
                        {farms?.map(farm => (
                          <CommandItem
                            key={farm.id}
                            value={farm.farm_name}
                            onSelect={() => {
                              setValue('farm_id', farm.id)
                              setOpenKandang(false)
                            }}
                            className="cursor-pointer py-3 px-4 border-b border-white/5 last:border-none focus:bg-white/5"
                          >
                            <div className="flex-1">
                              <p className="text-sm font-bold text-white">{farm.farm_name}</p>
                              <p className="text-[11px] text-[#4B6478] font-medium mt-0.5">{farmLabel(farm)}</p>
                            </div>
                            {farmId === farm.id && <Check size={14} className="text-emerald-400 ml-2" />}
                          </CommandItem>
                        ))}
                      </CommandGroup>
                      <CommandSeparator className="bg-white/5" />
                      <CommandGroup>
                        <CommandItem
                          onSelect={() => {
                            setOpenKandang(false)
                            setShowQuickAddKandang(true)
                          }}
                          className="cursor-pointer py-3 px-4 text-emerald-400 focus:bg-emerald-400/5"
                        >
                          <Plus size={14} className="mr-2" />
                          <span className="text-xs font-black uppercase tracking-widest">Tambah Kandang Baru</span>
                        </CommandItem>
                      </CommandGroup>
                    </CommandList>
                  </Command>
                </PopoverContent>
              )}
            </Popover>
          </>
        )}
        {errors.farm_id && <p className="text-[10px] text-red-500 font-bold">{errors.farm_id.message}</p>}

        {/* Quick Add Kandang */}
        {showQuickAddKandang && (
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
            <p style={{ fontSize: '11px', fontWeight: 900, color: '#10B981', textTransform: 'uppercase', letterSpacing: '0.1em', margin: 0 }}>
              Kandang Baru
            </p>
            <div className="grid grid-cols-2 gap-2">
              <div className="space-y-1">
                <label htmlFor="new_farm_name" style={{ fontSize: 9, fontWeight: 800, color: '#4B6478', textTransform: 'uppercase' }}>Nama Kandang *</label>
                <Input id="new_farm_name" name="new_farm_name" placeholder="Farm A" value={newFarm.farm_name} onChange={e => setNewFarm(p => ({ ...p, farm_name: e.target.value }))} className="h-9 bg-black/20" />
              </div>
              <div className="space-y-1">
                <label htmlFor="new_farm_owner" style={{ fontSize: 9, fontWeight: 800, color: '#4B6478', textTransform: 'uppercase' }}>Nama Pemilik *</label>
                <Input id="new_farm_owner" name="new_farm_owner" placeholder="Pak Budi" value={newFarm.owner_name} onChange={e => setNewFarm(p => ({ ...p, owner_name: e.target.value }))} className="h-9 bg-black/20" />
              </div>
            </div>
            <div className="grid grid-cols-2 gap-2">
              <div className="space-y-1">
                <label htmlFor="new_farm_phone" style={{ fontSize: 9, fontWeight: 800, color: '#4B6478', textTransform: 'uppercase' }}>No HP</label>
                <PhoneInput 
                  id="new_farm_phone"
                  name="new_farm_phone"
                  placeholder="081..." 
                  value={newFarm.phone} 
                  onChange={e => setNewFarm(p => ({ ...p, phone: e.target.value }))} 
                  className="h-9 bg-black/20" 
                />
              </div>
              <div className="space-y-1">
                <label htmlFor="new_farm_province" style={{ fontSize: 9, fontWeight: 800, color: '#4B6478', textTransform: 'uppercase' }}>Provinsi *</label>
                <Popover open={provinceOpen} onOpenChange={setProvinceOpen}>
                  <PopoverTrigger asChild>
                    <button
                      type="button"
                      className="flex h-9 w-full items-center justify-between rounded-md border border-white/10 bg-black/20 px-3 py-2 text-[11px] font-bold text-[#F1F5F9] transition-colors hover:bg-black/30"
                    >
                      <span className="truncate">{newFarm.province || 'Pilih Provinsi'}</span>
                      <ChevronsUpDown className="ml-2 h-3 w-3 shrink-0 opacity-50" />
                    </button>
                  </PopoverTrigger>
                  <PopoverContent className="w-[var(--radix-popover-trigger-width)] p-0 bg-[#111C24] border-white/10" align="start">
                    <Command className="bg-transparent">
                      <CommandInput placeholder="Cari provinsi..." className="h-9 text-xs" />
                      <CommandList>
                        <CommandEmpty className="py-2 text-center text-[10px] text-[#4B6478] font-bold uppercase">Tidak ditemukan</CommandEmpty>
                        <CommandGroup className="max-h-[250px] overflow-y-auto">
                          {PROVINCES.map((p) => (
                            <CommandItem
                              key={p}
                              value={p}
                              onSelect={(_val) => {
                                setNewFarm(prev => ({ ...prev, province: p }))
                                setProvinceOpen(false)
                              }}
                              className="text-[11px] font-bold uppercase tracking-wider py-2 group cursor-pointer"
                            >
                              <Check
                                className={`mr-2 h-3 w-3 text-emerald-500 ${newFarm.province === p ? 'opacity-100' : 'opacity-0'}`}
                              />
                              <span className={newFarm.province === p ? 'text-emerald-400' : 'text-[#F1F5F9]'}>{p}</span>
                            </CommandItem>
                          ))}
                        </CommandGroup>
                      </CommandList>
                    </Command>
                  </PopoverContent>
                </Popover>
              </div>
            </div>
            <div className="flex gap-2 mt-1">
              <Button type="button" onClick={handleQuickAddFarm} disabled={!newFarm.farm_name || !newFarm.owner_name} className="flex-1 bg-emerald-500 hover:bg-emerald-600 text-white font-black text-[11px] h-9 rounded-lg">SIMPAN & PILIH</Button>
              <Button type="button" variant="ghost" onClick={() => setShowQuickAddKandang(false)} className="px-3 text-muted-foreground font-bold text-[11px] h-9">BATAL</Button>
            </div>
          </div>
        )}
      </div>

      {/* Mode Toggle + Quantity */}
      <div className="space-y-3">
        <div className="flex gap-1.5">
          {['berat', 'ekor'].map(m => (
            <button key={m} type="button" onClick={() => setInputMode(m)}
              className={`flex-1 p-2 rounded-lg border text-[11px] font-black uppercase tracking-widest transition-all ${inputMode === m ? 'border-emerald-500/40 bg-emerald-500/10 text-emerald-400' : 'border-white/5 bg-white/[0.02] text-[#4B6478]'}`}
            >
              {m === 'berat' ? 'Per Berat' : 'Per Ekor'}
            </button>
          ))}
        </div>

        {inputMode === 'ekor' ? (
          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-1.5">
              <label htmlFor="quantity" style={S.label}>Jumlah Ekor *</label>
              <InputNumber id="quantity" name="quantity" placeholder="500" step={1} min={1} value={watch('quantity')} onChange={(val) => setValue('quantity', val, { shouldValidate: true })} className={errors.quantity ? 'border-red-500 ring-1 ring-red-500' : ''} />
              {errors.quantity && <p className="text-[10px] text-red-500 font-bold">{errors.quantity.message}</p>}
            </div>
            <div className="space-y-1.5">
              <label htmlFor="avg_weight_kg_ekor" style={S.label}>Bobot/ekor (kg) *</label>
              <InputNumber id="avg_weight_kg" name="avg_weight_kg" step={0.01} min={0.1} placeholder="1.85" value={watch('avg_weight_kg')} onChange={(val) => setValue('avg_weight_kg', val, { shouldValidate: true })} className={errors.avg_weight_kg ? 'border-red-500 ring-1 ring-red-500' : ''} />
              {errors.avg_weight_kg && <p className="text-[10px] text-red-500 font-bold">{errors.avg_weight_kg.message}</p>}
            </div>
          </div>
        ) : (
          <div className="space-y-3">
            <div className="space-y-1.5">
              <label htmlFor="total_weight_input" style={S.label}>Total Berat *</label>
              <div className="grid grid-cols-[1fr,100px] gap-2">
                <InputNumber
                  id="total_weight_input"
                  name="total_weight_input"
                  step={weightUnit === 'kg' ? 100 : 0.1}
                  min={0}
                  placeholder="0"
                  value={totalWeightInput}
                  onChange={(val) => {
                    setTotalWeightInput(val.toString())
                    const kg = (parseFloat(val) || 0) * weightMultiplier
                    setValue('quantity', Math.round(kg / (safeNum(watch('avg_weight_kg')) || 1.85)))
                  }}
                />
                <div style={{ position: 'relative' }}>
                  <button
                    type="button"
                    onClick={() => setUnitOpen(!unitOpen)}
                    style={{
                      padding: '13px 12px',
                      background: 'hsl(var(--secondary))',
                      border: '1px solid hsl(var(--border))',
                      borderRadius: '10px',
                      fontSize: '15px',
                      fontWeight: 700,
                      color: 'hsl(var(--foreground))',
                      cursor: 'pointer',
                      height: '50px',
                      width: '100%',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'space-between',
                      gap: '6px',
                      userSelect: 'none'
                    }}
                  >
                    <span className="uppercase">{weightUnit}</span>
                    <ChevronDown
                      size={14}
                      color="hsl(var(--muted-foreground))"
                      style={{
                        transform: unitOpen ? 'rotate(180deg)' : 'rotate(0)',
                        transition: 'transform 0.15s'
                      }}
                    />
                  </button>

                  {unitOpen && (
                    <>
                      <div
                        style={{ position: 'fixed', inset: 0, zIndex: 40 }}
                        onClick={() => setUnitOpen(false)}
                      />
                      <div style={{
                        position: 'absolute',
                        top: 'calc(100% + 4px)',
                        left: 0,
                        right: 0,
                        background: 'hsl(var(--popover))',
                        border: '1px solid hsl(var(--border))',
                        borderRadius: '10px',
                        overflow: 'hidden',
                        zIndex: 50,
                        boxShadow: '0 8px 24px rgba(0,0,0,0.4)'
                      }}>
                        {['kg', 'ton', 'rit'].map(unit => (
                            <button
                              key={unit}
                              type="button"
                              onClick={() => {
                                setWeightUnit(unit)
                                setUnitOpen(false)
                                const mult = unit === 'ton' ? 1000 : unit === 'rit' ? 5000 : 1
                                const kg = (parseFloat(totalWeightInput) || 0) * mult
                                setValue('quantity', Math.round(kg / (parseFloat(watch('avg_weight_kg')) || 1.85)))
                              }}
                            style={{
                              width: '100%',
                              padding: '11px 14px',
                              background: weightUnit === unit ? 'rgba(16, 185, 129, 0.10)' : 'transparent',
                              border: 'none',
                              borderBottom: unit !== 'rit' ? '1px solid hsl(var(--border))' : 'none',
                              color: weightUnit === unit ? '#10B981' : 'hsl(var(--foreground))',
                              fontSize: '14px',
                              fontWeight: weightUnit === unit ? 700 : 400,
                              cursor: 'pointer',
                              textAlign: 'left',
                              display: 'flex',
                              alignItems: 'center',
                              justifyContent: 'space-between'
                            }}
                          >
                            <span className="uppercase">{unit}</span>
                            {weightUnit === unit && <Check size={13} color="#10B981" />}
                          </button>
                        ))}
                      </div>
                    </>
                  )}
                </div>
              </div>
            </div>
            <div className="space-y-1.5">
              <label htmlFor="avg_weight_kg_berat" style={S.label}>Bobot Rata-rata (kg/ekor)</label>
              <InputNumber
                id="avg_weight_kg_berat"
                name="avg_weight_kg"
                step={0.01}
                min={0.1}
                placeholder="1.85"
                value={watch('avg_weight_kg')}
                onChange={(val) => {
                  const numVal = parseFloat(val) || 1.85
                  setValue('avg_weight_kg', numVal, { shouldValidate: true })
                  if (totalWeightInput) {
                    const kg = (parseFloat(totalWeightInput) || 0) * weightMultiplier
                    setValue('quantity', Math.round(kg / numVal))
                  }
                }}
              />
              <p className="text-[10px] font-bold text-[#4B6478] italic uppercase">Estimasi: {safeNum(qty).toLocaleString('id-ID')} ekor</p>
            </div>
          </div>
        )}
      </div>

      {/* Harga Beli */}
      <div className="space-y-1.5">
        <div className="flex justify-between items-center">
          <label htmlFor="price_per_kg" style={S.label}>Harga Beli (Rp/kg) *</label>
          {marketBuyPrice && (
            <button type="button" onClick={() => setValue('price_per_kg', marketBuyPrice, { shouldValidate: true })}
              className="text-[10px] text-emerald-400 font-black uppercase tracking-wider hover:underline">
              Pakai harga pasar: {safeNum(marketBuyPrice).toLocaleString('id-ID')} →
            </button>
          )}
        </div>
        <InputRupiah id="price_per_kg" name="price_per_kg" value={watch('price_per_kg')} onChange={(val) => setValue('price_per_kg', val, { shouldValidate: true })} placeholder="19.800" className={`${S.input} text-lg font-bold text-white ${errors.price_per_kg ? 'border-red-500 ring-1 ring-red-500' : ''}`} />
        {errors.price_per_kg && <p className="text-[10px] text-red-500 font-bold">{errors.price_per_kg.message}</p>}
      </div>

      {/* Tanggal */}
      <div className="space-y-1.5">
        <label style={S.label}>Tanggal Transaksi</label>
        <DatePicker id="transaction_date" value={watch('transaction_date')} onChange={(val) => setValue('transaction_date', val)} placeholder="Pilih tanggal" className={errors.transaction_date ? 'border-red-500 ring-1 ring-red-500' : ''} />
        {errors.transaction_date && <p className="text-[10px] text-red-500 font-bold">{errors.transaction_date.message}</p>}
      </div>

      {/* Catatan */}
      <div className="space-y-1.5">
        <label htmlFor="notes" style={S.label}>Catatan (Opsional)</label>
        <Textarea id="notes" name="notes" className="bg-[#111C24] border-white/10 rounded-xl min-h-[72px] text-sm" placeholder="Tambah keterangan..." {...register('notes')} />
      </div>

      {/* Ringkasan */}
      {totalWeight > 0 && price > 0 && (
        <Card className="bg-emerald-500/5 border-emerald-500/15 rounded-2xl p-5 space-y-4">
          <div className="flex justify-between items-center">
            <p className="text-[10px] font-black text-emerald-400 uppercase tracking-[0.2em]">Ringkasan Pembelian</p>
            <span className="text-[10px] font-bold text-[#4B6478]">{safeNum(qty).toLocaleString('id-ID')} ekor</span>
          </div>
          <div className="space-y-2.5">
            <div className="flex justify-between items-baseline">
              <span className="text-[12px] font-bold text-[#4B6478] uppercase tracking-wider">Total Berat</span>
              <span className="text-base font-black text-white">{formatWeight(totalWeight)}</span>
            </div>
            <div className="flex justify-between items-baseline">
              <span className="text-[12px] font-bold text-[#4B6478] uppercase tracking-wider">Harga Beli</span>
              <span className="text-base font-bold text-white">{formatIDR(price)}/kg</span>
            </div>
            <Separator className="bg-emerald-500/10" />
            <div className="flex justify-between items-center pt-1">
              <span className="text-sm font-black text-emerald-400 uppercase tracking-widest">Total Bayar</span>
              <span className="text-2xl font-black text-emerald-400 tabular-nums tracking-tighter">{formatIDR(totalCost)}</span>
            </div>
          </div>
        </Card>
      )}

      </div>
      
      {/* Buttons — Sticky Footer */}
      <div className={`sticky bottom-0 z-10 bg-[#0C1319] border-t border-white/10 flex gap-3 ${isDesktop ? 'p-4 px-5' : 'p-3 px-4'}`}>
        <Button type="button" variant="ghost" onClick={onBack} className={`gap-2 text-[#4B6478] hover:text-white font-bold rounded-xl ${isDesktop ? 'h-12' : 'h-10 text-[11px]'}`}>
          <ChevronLeft size={16} /> KEMBALI
        </Button>
        <Button type="submit" disabled={!farmId || !price || !qty} className={`flex-1 rounded-2xl font-black tracking-widest shadow-lg shadow-emerald-500/20 ${isDesktop ? 'h-14 text-sm' : 'h-11 text-[12px]'}`} style={{ background: '#10B981', color: 'white' }}>
          LANJUT {orderData ? 'KE SUBMIT' : 'KE PENJUALAN'} →
        </Button>
      </div>
    </form>
  )
}
