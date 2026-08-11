import { useState, useEffect } from 'react'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import * as z from 'zod'
import { useQuery, useQueryClient } from '@tanstack/react-query'
import { supabase } from '@/lib/supabase'
import { Link } from 'react-router-dom'
import { useAuth } from '@/lib/hooks/useAuth'
import { getSubscriptionStatus } from '@/lib/subscriptionUtils'
import { useMediaQuery } from '@/lib/hooks/useMediaQuery'
import { Button } from '@/components/ui/button'
import { Separator } from '@/components/ui/separator'
import { PhoneInput } from '@/components/ui/PhoneInput'
import { AlertCircle, ChevronLeft, Check, Plus, Search, Truck, MapPin, Calculator, Info, Zap, Smartphone, Loader2, ChevronsUpDown } from 'lucide-react'
import { InputRupiah } from '@/components/ui/InputRupiah'
import { Input } from '@/components/ui/input'
import { formatIDR, safeNum } from '@/lib/format'
import { Card } from '@/components/ui/card'
import { toast } from 'sonner'
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover'
import { Command, CommandEmpty, CommandGroup, CommandInput, CommandItem, CommandSeparator } from '@/components/ui/command'
import { Badge } from '@/components/ui/badge'
import { differenceInDays, parseISO } from 'date-fns'
import { TimePicker } from '@/components/ui/TimePicker'
const FIELD_LABELS = {
  vehicle_id: 'Kendaraan',
  driver_id: 'Sopir',
  delivery_cost: 'Biaya Pengiriman',
  load_time: 'Jam Muat',
  departure_time: 'Jam Berangkat',
  notes: 'Catatan'
}

// NUCLEAR OPTION: Global Zod Mapping to eliminate ALL technical jargon
z.setErrorMap((issue, ctx) => {
  const defaultMsg = ctx?.defaultError || ''
  
  if (ctx?.defaultError && !ctx.defaultError.includes('Expected') && !ctx.defaultError.includes('Invalid') && !ctx.defaultError.includes('Required')) {
    return { message: ctx.defaultError }
  }
  if (issue.code === z.ZodIssueCode.invalid_type) {
    if (issue.received === 'undefined' || issue.received === 'null' || (issue.received === 'string' && issue.code === 'too_small')) {
      return { message: 'Bagian ini wajib diisi' }
    }
    return { message: 'Format data tidak valid' }
  }
  return { message: defaultMsg || 'Input tidak valid' }
})

// Helper to add 1 hour spare time to HH:MM format (Harden to handle ISO and avoid NaN)
const addSpareTime = (timeStr) => {
  if (!timeStr || typeof timeStr !== 'string') return timeStr
  
  let h, m
  if (timeStr.includes('T')) {
    // Handle ISO: 2024-01-01T10:00:00+07:00
    const timePart = timeStr.split('T')[1]
    const p = timePart.split(':')
    h = parseInt(p[0])
    m = parseInt(p[1])
  } else if (timeStr.includes(':')) {
    // Handle HH:mm
    const p = timeStr.split(':')
    h = parseInt(p[0])
    m = parseInt(p[1])
  } else {
    return timeStr
  }

  if (isNaN(h) || isNaN(m)) return timeStr
  
  const newH = (h + 1) % 24
  const hh = String(newH).padStart(2, '0')
  const mm = String(m).padStart(2, '0')

  if (timeStr.includes('T')) {
    const datePart = timeStr.split('T')[0]
    return `${datePart}T${hh}:${mm}:00+07:00`
  }
  return `${hh}:${mm}`
}

const pengirimanSchema = z.object({
  vehicle_id: z.string().nullable().optional(),
  driver_id: z.string().nullable().optional(),
  delivery_cost: z.coerce.number({ 
    required_error: 'Masukkan biaya pengiriman',
    invalid_type_error: 'Biaya pengiriman harus berupa angka' 
  }).optional().nullable(),
  load_time: z.string({ 
    required_error: 'Jam muat wajib diisi',
    invalid_type_error: 'Jam muat wajib diisi' 
  }).min(1, 'Jam muat wajib diisi').nullable(),
  departure_time: z.string({ 
    required_error: 'Jam berangkat wajib diisi',
    invalid_type_error: 'Jam berangkat wajib diisi' 
  }).min(1, 'Jam berangkat wajib diisi').nullable(),
  include_driver_wage: z.boolean().optional().default(true),
  include_fuel_cost: z.boolean().optional().default(true),
  driver_wage: z.number().optional().default(0),
  notes: z.string().trim().max(500, 'Catatan terlalu panjang (max 500 karakter)').optional()
}).refine(data => data.load_time !== data.departure_time, {
  message: 'Jam berangkat harus berbeda dengan jam muat',
  path: ['departure_time']
})

const S = {
  label: { fontSize: 11, fontWeight: 700, color: '#4B6478', textTransform: 'uppercase', letterSpacing: '0.1em', display: 'block', marginBottom: 6, fontFamily: 'Sora' },
  input: 'w-full bg-[#111C24] border border-white/10 h-12 rounded-xl px-3 text-[#F1F5F9] font-bold outline-none placeholder:text-muted-foreground',
}

export default function WizardStepPengiriman({ step1Data, step2Data, mode, step3Data, setStep3Data, onSubmit, onBack, submitting }) {
  const { tenant } = useAuth()
  const queryClient = useQueryClient()
  const isDesktop = useMediaQuery('(min-width: 1024px)')

  const sub = getSubscriptionStatus(tenant)
  const isStarter = sub.status !== 'active' && sub.status !== 'trial'
  const [vehicleMode, setVehicleMode] = useState('armada')
  const [driverMode, setDriverMode] = useState('driver')
  const [openVehicle, setOpenVehicle] = useState(false)
  const [openDriver, setOpenDriver] = useState(false)

  const [showQuickAddVehicle, setShowQuickAddVehicle] = useState(false)
  const [newVehicle, setNewVehicle] = useState({ brand: '', vehicle_plate: '' })
  const [showQuickAddDriver, setShowQuickAddDriver] = useState(false)
  const [newDriver, setNewDriver] = useState({ full_name: '', phone: '' })
  const [isAdding, setIsAdding] = useState(false)

  const { formState: { errors }, watch, setValue, register, trigger } = useForm({
    resolver: zodResolver(pengirimanSchema),
    defaultValues: {
      vehicle_id: step3Data.vehicle_id || null,
      driver_id: step3Data.driver_id || null,
      delivery_cost: step3Data.delivery_cost || 0,
      load_time: step3Data.load_time || null,
      departure_time: step3Data.departure_time || null,
      include_driver_wage: step3Data.include_driver_wage ?? true,
      include_fuel_cost: step3Data.include_fuel_cost ?? true,
      driver_wage: step3Data.driver_wage || 0,
      notes: step3Data.notes || ''
    }
  })

  const formValues = watch()

  const { data: vehicles } = useQuery({
    queryKey: ['vehicles-active', tenant?.id],
    queryFn: async () => {
      const { data } = await supabase.from('vehicles').select('*').eq('tenant_id', tenant.id).eq('status', 'aktif').eq('is_deleted', false).order('vehicle_plate')
      return data || []
    },
    enabled: !!tenant?.id && !!step3Data.enabled
  })

  const { data: drivers } = useQuery({
    queryKey: ['drivers-active', tenant?.id],
    queryFn: async () => {
      const { data } = await supabase.from('drivers').select('*').eq('tenant_id', tenant.id).eq('status', 'aktif').eq('is_deleted', false).order('full_name')
      return data || []
    },
    enabled: !!tenant?.id && !!step3Data.enabled
  })

  const vehicleLimitReached = isStarter && (vehicles?.length ?? 0) >= 1
  const driverLimitReached  = isStarter && (drivers?.length ?? 0) >= 1

  // Sync form values to parent state via subscription (avoids infinite loop)
  useEffect(() => {
    const subscription = watch((values) => {
      setStep3Data(prev => ({ ...prev, ...values }))
    })
    return () => subscription.unsubscribe()
  }, [watch, setStep3Data])

  const driversList = drivers || []
  const selectedDriver = driversList.find(d => d.id === formValues.driver_id)
  const selectedVehicle = (vehicles || []).find(v => v.id === formValues.vehicle_id)

  useEffect(() => {
    if (selectedDriver && formValues.include_driver_wage) {
       // Only auto-fill if the current wage is 0 or it's a fresh driver selection
       // (The bug was || selectedDriver?.id which made it always true)
       if (!formValues.driver_wage || formValues.driver_wage === 0) {
          setValue('driver_wage', selectedDriver.wage_per_trip || 0)
       }
    }
  }, [selectedDriver?.id, formValues.include_driver_wage])

  const shouldRenderNewDriverForm = driverMode === 'manual' || (driverMode === 'driver' && drivers?.length === 0) || showQuickAddDriver;
  const shouldRenderNewVehicleForm = vehicleMode === 'manual' || (vehicleMode === 'armada' && vehicles?.length === 0) || showQuickAddVehicle;

  const buyData = mode === 'buy_first' ? step1Data : step2Data
  const sellData = mode === 'buy_first' ? step2Data : step1Data

  const farmName = buyData?.farm_name || '—'
  const rpaName = sellData?.rpa_name || '—'
  const totalWeightKg = safeNum(buyData?.total_weight_kg)
  const qty = safeNum(buyData?.quantity)
  const totalRevenue = safeNum(sellData?.total_revenue)
  const totalModal = safeNum(buyData?.total_modal)
  
  const deliveryCost = safeNum(formValues.delivery_cost)
  const profitBersih = totalRevenue - totalModal - deliveryCost

  const handlePreSubmit = async () => {
    if (step3Data.enabled) {
      // Manual Validation for required Quick Add vs Select
      if (vehicleMode === 'armada' && !formValues.vehicle_id) {
        toast.error("Informasi Belum Lengkap", { description: "Pilih atau isi data kendaraan terlebih dahulu" })
        const el = document.getElementById('vehicle_trigger')
        if (el) el.scrollIntoView({ behavior: 'smooth', block: 'center' })
        return
      }
      if (vehicleMode === 'manual' && !formValues.vehicle_id) {
        toast.error("Informasi Belum Lengkap", { description: "Simpan data kendaraan baru terlebih dahulu (Klik SIMPAN & PILIH)" })
        const el = document.getElementById('new_vehicle_brand')
        if (el) el.scrollIntoView({ behavior: 'smooth', block: 'center' })
        return
      }
      if (driverMode === 'driver' && !formValues.driver_id) {
        toast.error("Informasi Belum Lengkap", { description: "Pilih atau isi data sopir terlebih dahulu" })
        const el = document.getElementById('driver_trigger')
        if (el) el.scrollIntoView({ behavior: 'smooth', block: 'center' })
        return
      }
      if (driverMode === 'manual' && !formValues.driver_id) {
        toast.error("Informasi Belum Lengkap", { description: "Simpan data sopir baru terlebih dahulu (Klik SIMPAN & PILIH)" })
        const el = document.getElementById('new_driver_name')
        if (el) el.scrollIntoView({ behavior: 'smooth', block: 'center' })
        return
      }

      // Trigger Zod validation
      const isValid = await trigger()
      if (!isValid) {
        const firstErrorKey = Object.keys(errors)[0]
        const firstErrorMessage = errors[firstErrorKey]?.message || "Harap lengkapi semua data wajib"
        const labelText = FIELD_LABELS[firstErrorKey] || firstErrorKey
        
        toast.error("Informasi Belum Lengkap", { 
          description: `${labelText}: ${firstErrorMessage}`
        })

        const el = document.getElementById(firstErrorKey) || 
                   document.getElementById(`${firstErrorKey}_trigger`) || 
                   document.getElementsByName(firstErrorKey)[0]
        if (el) el.scrollIntoView({ behavior: 'smooth', block: 'center' })
        return
      }
    }
    
    onSubmit()
  }

  const handleQuickAddVehicle = async () => {
    if (!newVehicle.brand || !newVehicle.vehicle_plate) return
    if (vehicleLimitReached) {
      toast.error('Limit Starter: maks 1 kendaraan. Upgrade ke Pro untuk unlimited.')
      return
    }
    setIsAdding(true)
    
    const { data, error } = await supabase
      .from('vehicles')
      .insert({
        tenant_id: tenant?.id,
        brand: newVehicle.brand,
        vehicle_plate: newVehicle.vehicle_plate.toUpperCase(),
        vehicle_type: 'truk',
        ownership: 'milik_sendiri',
        status: 'aktif'
      })
      .select()
      .single()
    
    if (error) {
      toast.error('Gagal tambah kendaraan: ' + error.message)
    } else {
      queryClient.invalidateQueries({ queryKey: ['vehicles-active', tenant?.id] })
      setValue('vehicle_id', data.id)
      setStep3Data(p => ({ ...p, vehicle_type: data.vehicle_type, vehicle_plate: data.vehicle_plate }))
      setShowQuickAddVehicle(false)
      setVehicleMode('armada')
      setNewVehicle({ brand: '', vehicle_plate: '' })
      toast.success(`✅ Kendaraan ${data.vehicle_plate} ditambahkan!`)
    }
    setIsAdding(false)
  }

  const handleQuickAddDriver = async () => {
    if (!newDriver.full_name) return
    if (driverLimitReached) {
      toast.error('Limit Starter: maks 1 sopir. Upgrade ke Pro untuk unlimited.')
      return
    }
    setIsAdding(true)
    
    const { data, error } = await supabase
      .from('drivers')
      .insert({
        tenant_id: tenant?.id,
        full_name: newDriver.full_name,
        phone: newDriver.phone || null,
        status: 'aktif'
      })
      .select()
      .single()
    
    if (error) {
      toast.error('Gagal tambah sopir: ' + error.message)
    } else {
      queryClient.invalidateQueries({ queryKey: ['drivers-active', tenant?.id] })
      setValue('driver_id', data.id)
      setStep3Data(p => ({ ...p, driver_name: data.full_name, driver_phone: data.phone }))
      setShowQuickAddDriver(false)
      setDriverMode('driver')
      setNewDriver({ full_name: '', phone: '' })
      toast.success(`✅ Sopir ${data.full_name} ditambahkan!`)
    }
    setIsAdding(false)
  }

  const vehicleLabel = (v) => {
    const parts = []
    if (v.brand) parts.push(v.brand)
    if (v.capacity_ekor) parts.push(`cap ${safeNum(v.capacity_ekor).toLocaleString('id-ID')} ekor`)
    return parts.join(' · ')
  }

  const driverSubLabel = (d) => {
    const hp = d.phone || 'Tidak ada HP'
    const expiry = d.sim_expires_at ? parseISO(d.sim_expires_at) : null
    let statusBadge = null
    
    if (expiry) {
      const daysLeft = differenceInDays(expiry, new Date())
      if (daysLeft < 30) {
        statusBadge = (
          <Badge variant="outline" className={`ml-1.5 py-0 px-1 text-[9px] font-black uppercase ${daysLeft < 0 ? 'border-red-500/50 bg-red-500/10 text-red-400' : 'border-amber-500/50 bg-amber-500/10 text-amber-400'}`}>
            {daysLeft < 0 ? 'SIM Mati' : `SIM -${daysLeft} Hari`}
          </Badge>
        )
      }
    }
    return { hp, statusBadge }
  }


  return (
    <div className="flex flex-col h-full min-h-0 relative">
      <div className={`flex-1 space-y-4 overflow-y-auto ${isDesktop ? 'px-5 pb-24' : 'px-4 pb-20'}`}>
      <p className="text-[10px] font-black uppercase tracking-widest text-[#4B6478]">Step 3 — Detail Pengiriman</p>

      {/* Summary Card */}
      <Card className={`bg-[#111C24] border-white/5 rounded-2xl overflow-hidden relative ${isDesktop ? 'p-5' : 'p-4'}`}>
        <div className="absolute top-0 right-0 p-4 opacity-5">
          <Truck size={isDesktop ? 80 : 60} />
        </div>
        <div className={`relative z-10 ${isDesktop ? 'space-y-4' : 'space-y-3'}`}>
          <div className="flex justify-between items-start">
            <div>
              <p className="text-[9px] font-black text-[#4B6478] uppercase tracking-[0.2em] mb-1">Rute Transaksi</p>
              <h4 className={`font-black text-white ${isDesktop ? 'text-base' : 'text-[13px]'}`}>{farmName} <span className="text-[#4B6478] mx-1">→</span> {rpaName}</h4>
            </div>
            <div className="text-right">
              <p className="text-[9px] font-black text-[#4B6478] uppercase tracking-[0.2em] mb-1">Volume</p>
              <p className={`font-bold text-white ${isDesktop ? 'text-sm' : 'text-[12px]'}`}>{safeNum(qty).toLocaleString('id-ID')} ekor · {safeNum(totalWeightKg).toFixed(1)} kg</p>
            </div>
          </div>

          <Separator className="bg-white/5" />

          <div className="grid grid-cols-2 gap-3">
            <div>
              <p className="text-[9px] font-black text-[#4B6478] uppercase tracking-[0.1em] mb-0.5">Pendapatan</p>
              <p className={`font-bold text-emerald-400 ${isDesktop ? 'text-sm' : 'text-[12px]'}`}>{formatIDR(totalRevenue)}</p>
            </div>
            <div>
              <p className="text-[9px] font-black text-[#4B6478] uppercase tracking-[0.1em] mb-0.5">Modal + Kirim</p>
              <p className={`font-bold text-red-400 ${isDesktop ? 'text-sm' : 'text-[12px]'}`}>{formatIDR(safeNum(totalModal) + safeNum(deliveryCost))}</p>
            </div>
          </div>

          <div className="pt-2 flex justify-between items-center border-t border-white/5">
            <span className="text-[10px] font-black text-[#4B6478] uppercase tracking-widest">Est. Profit</span>
            <span className={`font-black tabular-nums ${profitBersih >= 0 ? 'text-emerald-400' : 'text-red-400'} ${isDesktop ? 'text-xl' : 'text-base'}`}>
              {profitBersih >= 0 ? '+' : ''}{formatIDR(profitBersih)}
            </span>
          </div>
        </div>
      </Card>

      {/* Toggle Catat Pengiriman */}
      <div className={`flex items-center justify-between bg-emerald-500/5 border border-emerald-500/10 rounded-2xl ${isDesktop ? 'p-4' : 'p-3.5'}`}>
        <div>
          <p className={`font-black text-emerald-400 uppercase tracking-wider ${isDesktop ? 'text-[13px]' : 'text-[12px]'}`}>Lengkapi Detail Pengiriman?</p>
          <p className="text-[10px] text-[#4B6478] font-medium mt-0.5">Wajib jika ingin cetak Surat Jalan</p>
        </div>
        <button
          type="button"
          onClick={() => setStep3Data(p => ({ ...p, enabled: !p.enabled }))}
          style={{
            width: 44, height: 24, borderRadius: 12, cursor: 'pointer', transition: 'all 0.2s', border: 'none',
            background: step3Data.enabled ? '#10B981' : 'rgba(255,255,255,0.1)',
            position: 'relative', flexShrink: 0
          }}
        >
          <span style={{
            position: 'absolute', top: 3, left: step3Data.enabled ? 23 : 3,
            width: 18, height: 18, borderRadius: '50%', background: 'white', transition: 'left 0.2s',
            boxShadow: '0 2px 4px rgba(0,0,0,0.2)'
          }} />
        </button>
      </div>

      {step3Data.enabled && (
        <div className="space-y-5 animate-in fade-in slide-in-from-top-2 duration-300">
          {/* Kendaraan */}
          <div className="space-y-2.5">
            <label htmlFor="vehicle_trigger" style={S.label}>Pilih Kendaraan *</label>
            <div className="flex gap-1.5 mb-2">
              {['armada', 'manual'].map(m => (
                <button key={m} type="button" 
                  onClick={() => {
                    setVehicleMode(m)
                    if (m === 'manual') setValue('vehicle_id', null, { shouldValidate: true })
                  }}
                  className={`flex-1 py-2.5 rounded-xl border text-[10px] font-black uppercase tracking-widest transition-all ${vehicleMode === m ? 'border-emerald-500/40 bg-emerald-500/10 text-emerald-400' : 'border-white/5 bg-white/[0.02] text-[#4B6478]'}`}
                >{m === 'armada' ? 'Armada Sendiri' : 'Input Manual'}</button>
              ))}
            </div>

            {vehicleMode === 'armada' && vehicles?.length > 0 ? (
              <Popover open={openVehicle} onOpenChange={setOpenVehicle}>
                <PopoverTrigger asChild>
                  <button id="vehicle_trigger" type="button" style={{
                    width: '100%', padding: '13px 14px', background: 'hsl(var(--input))', 
                    border: errors.vehicle_id ? '1px solid #EF4444' : '1px solid hsl(var(--border))', 
                    borderRadius: '10px',
                    display: 'flex', justifyContent: 'space-between', alignItems: 'center', cursor: 'pointer', fontSize: '16px',
                    color: formValues.vehicle_id ? 'hsl(var(--foreground))' : 'hsl(var(--muted-foreground))', textAlign: 'left',
                    boxShadow: errors.vehicle_id ? '0 0 0 1px #EF4444' : 'none'
                  }}>
                    <span className="truncate">
                      {selectedVehicle ? `${selectedVehicle.vehicle_plate} · ${selectedVehicle.vehicle_type}` : 'Pilih kendaraan armada'}
                    </span>
                    <ChevronsUpDown size={14} className="ml-2 flex-shrink-0 text-muted-foreground" />
                  </button>
                </PopoverTrigger>
                <PopoverContent className="p-0 border-white/5 bg-[#111C24]" style={{ width: 'var(--radix-popover-trigger-width)' }} align="start">
                  <Command className="bg-transparent">
                    <CommandInput placeholder="Cari plat/jenis..." className="h-10 border-none" />
                    <CommandEmpty>Kendaraan tidak ditemukan</CommandEmpty>
                    <CommandGroup className="max-h-64 overflow-y-auto">
                      {vehicles?.map(v => (
                        <CommandItem
                          key={v.id}
                          value={v.vehicle_plate + ' ' + v.vehicle_type}
                          onSelect={() => {
                            setValue('vehicle_id', v.id, { shouldValidate: true })
                            setStep3Data(p => ({ ...p, vehicle_type: v.vehicle_type, vehicle_plate: v.vehicle_plate }))
                            setOpenVehicle(false)
                            setShowQuickAddVehicle(false)
                          }}
                          className="cursor-pointer py-3 px-4 border-b border-white/5 last:border-none focus:bg-white/5"
                        >
                          <div className="flex-1">
                            <p className="text-sm font-bold text-white">{v.vehicle_plate} · {v.vehicle_type}</p>
                            <p className="text-[11px] text-[#4B6478] font-medium mt-0.5">{vehicleLabel(v)}</p>
                          </div>
                          {formValues.vehicle_id === v.id && <Check size={14} className="text-emerald-400 ml-2" />}
                        </CommandItem>
                      ))}
                    </CommandGroup>
                    <CommandSeparator className="bg-white/5" />
                    <CommandGroup>
                      {vehicleLimitReached ? (
                        <div className="px-4 py-3 flex items-center gap-2">
                          <span className="text-[10px] font-black uppercase tracking-widest text-[#4B6478]">Limit Starter (maks 1)</span>
                          <Link to="/upgrade" className="text-[10px] font-black text-emerald-400 hover:underline">Upgrade →</Link>
                        </div>
                      ) : (
                        <CommandItem
                          onSelect={() => {
                            setOpenVehicle(false)
                            setShowQuickAddVehicle(true)
                          }}
                          className="cursor-pointer py-3 px-4 text-emerald-400 focus:bg-emerald-400/5"
                        >
                          <Plus size={14} className="mr-2" />
                          <span className="text-xs font-black uppercase tracking-widest">Tambah Kendaraan Baru</span>
                        </CommandItem>
                      )}
                    </CommandGroup>
                  </Command>
                </PopoverContent>
              </Popover>
            ) : null}

            {shouldRenderNewVehicleForm && (
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
                  Kendaraan Baru
                </p>
                <div className="grid grid-cols-2 gap-2">
                  <div className="space-y-1">
                    <label htmlFor="new_vehicle_brand" style={{ fontSize: 9, fontWeight: 800, color: '#4B6478', textTransform: 'uppercase' }}>Nama Kendaraan *</label>
                    <Input id="new_vehicle_brand" name="new_vehicle_brand" placeholder="Truk Canter" value={newVehicle.brand} onChange={e => setNewVehicle(p => ({ ...p, brand: e.target.value }))} className="h-9 bg-black/20" />
                  </div>
                  <div className="space-y-1">
                    <label htmlFor="new_vehicle_plate" style={{ fontSize: 9, fontWeight: 800, color: '#4B6478', textTransform: 'uppercase' }}>No. Plat *</label>
                    <Input id="new_vehicle_plate" name="new_vehicle_plate" placeholder="B 1234 ABC" value={newVehicle.vehicle_plate} onChange={e => setNewVehicle(p => ({ ...p, vehicle_plate: e.target.value.toUpperCase() }))} className="h-9 bg-black/20 uppercase font-black" />
                  </div>
                </div>
                <div className="flex gap-2 mt-1">
                  <Button type="button" onClick={handleQuickAddVehicle} disabled={isAdding || !newVehicle.brand || !newVehicle.vehicle_plate} className="flex-1 bg-emerald-500 hover:bg-emerald-600 text-white font-black text-[11px] h-9 rounded-lg">
                    {isAdding ? 'PROSES...' : 'SIMPAN & PILIH'}
                  </Button>
                  <Button type="button" variant="ghost" 
                    onClick={() => {
                      setShowQuickAddVehicle(false)
                      setNewVehicle({ brand: '', vehicle_plate: '' })
                    }} 
                    className="px-3 text-muted-foreground font-bold text-[11px] h-9"
                  >
                    BATAL
                  </Button>
                </div>
              </div>
            )}
            {errors.vehicle_id && <p className="text-[10px] text-red-500 font-bold">{errors.vehicle_id.message}</p>}
          </div>

          {/* Sopir */}
          <div className="space-y-2.5">
            <label htmlFor="driver_trigger" style={S.label}>Pilih Sopir *</label>
            <div className="flex gap-1.5 mb-2">
              {['driver', 'manual'].map(m => (
                <button key={m} type="button" 
                  onClick={() => {
                    setDriverMode(m)
                    if (m === 'manual') setValue('driver_id', null, { shouldValidate: true })
                  }}
                  className={`flex-1 py-2.5 rounded-xl border text-[10px] font-black uppercase tracking-widest transition-all ${driverMode === m ? 'border-emerald-500/40 bg-emerald-500/10 text-emerald-400' : 'border-white/5 bg-white/[0.02] text-[#4B6478]'}`}
                >{m === 'driver' ? 'Sopir Terdaftar' : 'Input Manual'}</button>
              ))}
            </div>

            {driverMode === 'driver' && drivers?.length > 0 ? (
              <div>
                <Popover open={openDriver} onOpenChange={(open) => setOpenDriver(open)}>
                  <PopoverTrigger asChild>
                    <button id="driver_trigger" type="button" style={{
                      width: '100%', padding: '13px 14px', background: 'hsl(var(--input))', 
                      border: errors.driver_id ? '1px solid #EF4444' : '1px solid hsl(var(--border))', 
                      borderRadius: '10px',
                      display: 'flex', justifyContent: 'space-between', alignItems: 'center', cursor: 'pointer', fontSize: '16px',
                      color: formValues.driver_id ? 'hsl(var(--foreground))' : 'hsl(var(--muted-foreground))', textAlign: 'left',
                      boxShadow: errors.driver_id ? '0 0 0 1px #EF4444' : 'none'
                    }}>
                      <span className="truncate">
                        {selectedDriver ? selectedDriver.full_name : 'Pilih sopir terdaftar'}
                      </span>
                      <ChevronsUpDown size={14} className="ml-2 flex-shrink-0 text-muted-foreground" />
                    </button>
                  </PopoverTrigger>
                  <PopoverContent className="p-0 border-white/5 bg-[#111C24]" style={{ width: 'var(--radix-popover-trigger-width)' }} align="start">
                    <Command className="bg-transparent">
                      <CommandInput placeholder="Cari nama sopir..." className="h-10 border-none" />
                      <CommandEmpty>Sopir tidak ditemukan</CommandEmpty>
                      <CommandGroup className="max-h-64 overflow-y-auto">
                        {drivers?.map(d => (
                          <CommandItem
                            key={d.id}
                            value={d.full_name}
                            onSelect={() => {
                              setValue('driver_id', d.id, { shouldValidate: true })
                              setStep3Data(p => ({ ...p, driver_name: d.full_name, driver_phone: d.phone }))
                              setOpenDriver(false)
                              setShowQuickAddDriver(false)
                            }}
                            className="cursor-pointer py-3 px-4 border-b border-white/5 last:border-none focus:bg-white/5"
                          >
                            <div className="flex-1">
                              <p className="text-sm font-bold text-white">{d.full_name}</p>
                              <div className="flex items-center mt-0.5">
                                <p className="text-[11px] text-[#4B6478] font-medium">{driverSubLabel(d).hp}</p>
                                {driverSubLabel(d).statusBadge}
                              </div>
                            </div>
                            {formValues.driver_id === d.id && <Check size={14} className="text-emerald-400 ml-2" />}
                          </CommandItem>
                        ))}
                        </CommandGroup>
                        <CommandSeparator className="bg-white/5" />
                        <CommandGroup>
                          {driverLimitReached ? (
                            <div className="px-4 py-3 flex items-center gap-2">
                              <span className="text-[10px] font-black uppercase tracking-widest text-[#4B6478]">Limit Starter (maks 1)</span>
                              <Link to="/upgrade" className="text-[10px] font-black text-emerald-400 hover:underline">Upgrade →</Link>
                            </div>
                          ) : (
                            <CommandItem
                              onSelect={() => {
                                setOpenDriver(false)
                                setShowQuickAddDriver(true)
                              }}
                              className="cursor-pointer py-3 px-4 text-emerald-400 focus:bg-emerald-400/5"
                            >
                              <Plus size={14} className="mr-2" />
                              <span className="text-xs font-black uppercase tracking-widest">Tambah Sopir Baru</span>
                            </CommandItem>
                          )}
                        </CommandGroup>
                      </Command>
                    </PopoverContent>
                  </Popover>
                
                {formValues.driver_id && selectedDriver?.wage_per_trip !== null && selectedDriver?.wage_per_trip !== undefined && (
                  <p className="text-[10px] text-emerald-400 mt-1.5 font-black uppercase italic tracking-wider">
                    Estimasi Upah: {formatIDR(selectedDriver.wage_per_trip)}
                  </p>
                )}
              </div>
            ) : null}

            {shouldRenderNewDriverForm && (
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
                    Sopir Baru
                  </p>
                  <div className="grid grid-cols-2 gap-2">
                    <div className="space-y-1">
                      <label htmlFor="new_driver_name" style={{ fontSize: 9, fontWeight: 800, color: '#4B6478', textTransform: 'uppercase' }}>Nama Sopir *</label>
                      <Input id="new_driver_name" name="new_driver_name" placeholder="Pak Ahmad" value={newDriver.full_name} onChange={e => setNewDriver(p => ({ ...p, full_name: e.target.value }))} className="h-9 bg-black/20" />
                    </div>
                    <div className="space-y-1">
                      <label htmlFor="new_driver_phone" style={{ fontSize: 9, fontWeight: 800, color: '#4B6478', textTransform: 'uppercase' }}>No HP</label>
                      <PhoneInput id="new_driver_phone" name="new_driver_phone" placeholder="081..." value={newDriver.phone} onChange={e => setNewDriver(p => ({ ...p, phone: e.target.value }))} className="h-9 bg-black/20" />
                    </div>
                  </div>
                  <div className="flex gap-2 mt-1">
                    <Button type="button" onClick={handleQuickAddDriver} disabled={isAdding || !newDriver.full_name} className="flex-1 bg-emerald-500 hover:bg-emerald-600 text-white font-black text-[11px] h-9 rounded-lg">
                      {isAdding ? 'PROSES...' : 'SIMPAN & PILIH'}
                    </Button>
                    <Button type="button" variant="ghost" 
                      onClick={() => {
                        setShowQuickAddDriver(false)
                        setNewDriver({ full_name: '', phone: '' })
                      }} 
                      className="px-3 text-muted-foreground font-bold text-[11px] h-9"
                    >
                      BATAL
                    </Button>
                  </div>
                </div>
              )}
              {errors.driver_id && <p className="text-[10px] text-red-500 font-bold">{errors.driver_id.message}</p>}
          </div>

          {/* Times with Custom TimePicker */}
          <div className="grid grid-cols-2 gap-3">
            <div>
              <TimePicker label="Jam Muat" value={formValues.load_time} 
                onChange={val => {
                  setValue('load_time', val, { shouldValidate: true })
                  if (val) {
                    setValue('departure_time', addSpareTime(val), { shouldValidate: true })
                  }
                }} 
              />
              {errors.load_time && <p className="text-[10px] text-red-500 font-bold mt-1">{errors.load_time.message}</p>}
            </div>
            <div>
              <TimePicker label="Jam Berangkat" value={formValues.departure_time} onChange={val => setValue('departure_time', val, { shouldValidate: true })} />
              {errors.departure_time && <p className="text-[10px] text-red-500 font-bold mt-1">{errors.departure_time.message}</p>}
            </div>
          </div>

          {/* TOTAL BIAYA PENGIRIMAN */}
          <div className="space-y-3">
            <label htmlFor="delivery_cost" style={S.label}>Total Biaya Pengiriman *</label>
            
            <InputRupiah id="delivery_cost" name="delivery_cost" value={formValues.delivery_cost || 0} onChange={v => setValue('delivery_cost', v, { shouldValidate: true })} placeholder="0" className={`bg-[#111C24] ${errors.delivery_cost ? 'border-red-500 ring-1 ring-red-500' : 'border-emerald-500/20'} ${isDesktop ? 'h-14 text-xl' : 'h-11 text-base'} rounded-2xl font-bold text-white shadow-inner`} />
            
            {/* Toggles Container */}
            <div className="flex flex-wrap gap-4 py-1">
              <ToggleRow 
                label="Biaya Sopir" 
                active={formValues.include_driver_wage} 
                onClick={() => {
                  const newState = !formValues.include_driver_wage
                  setValue('include_driver_wage', newState)
                  if (!newState) setValue('driver_wage', 0)
                  else if (selectedDriver?.wage_per_trip) setValue('driver_wage', selectedDriver.wage_per_trip)
                }} 
              />
              <ToggleRow 
                label="Biaya Solar" 
                active={formValues.include_fuel_cost} 
                onClick={() => setValue('include_fuel_cost', !formValues.include_fuel_cost)} 
              />
            </div>

            {/* UPAH SOPIR INPUT - SHOW IF TOGGLE IS ON */}
            {formValues.include_driver_wage && (
              <div className="bg-white/5 border border-white/5 p-3 rounded-2xl flex justify-between items-center group animate-in zoom-in-95 duration-200">
                <div className="space-y-0.5">
                  <p className="text-[9px] font-black text-[#4B6478] uppercase tracking-widest">Detail Upah Sopir</p>
                  <p className="text-[11px] font-bold text-emerald-400">Termasuk dalam biaya kirim</p>
                </div>
                <div className="w-32">
                   <InputRupiah 
                     value={formValues.driver_wage} 
                     onChange={v => setValue('driver_wage', v, { shouldValidate: true })}
                     className="h-9 bg-black/20 border-white/5 text-right font-black text-xs"
                   />
                </div>
              </div>
            )}

            <p className="text-[10px] text-[#4B6478] font-bold uppercase mt-1 italic leading-relaxed">
              Biaya operasional yang sudah tercakup dalam total pembayaran.
            </p>
            {errors.delivery_cost && <p className="text-[10px] text-red-500 font-bold">{errors.delivery_cost.message}</p>}
          </div>

          {/* Catatan */}
          <div className="space-y-1.5">
            <label htmlFor="notes" style={S.label}>Catatan Pengiriman</label>
            <textarea id="notes" name="notes" className="w-full bg-[#111C24] border border-white/10 rounded-xl p-4 text-[#F1F5F9] text-sm min-h-[80px] outline-none resize-none placeholder:text-[#4B6478]" placeholder="Tambahkan keterangan rute, kondisi ayam, dll..." {...register('notes')} />
            {errors.notes && <p className="text-[10px] text-red-500 font-bold">{errors.notes.message}</p>}
          </div>
        </div>
      )}

      </div>
      
      {/* Buttons — Sticky Footer */}
      <div className={`sticky bottom-0 z-10 bg-[#0C1319] border-t border-white/10 ${isDesktop ? 'p-4 px-5 space-y-4' : 'p-3 px-4 space-y-3'}`}>
        <button type="button" onClick={handlePreSubmit} disabled={submitting}
          className={`w-full rounded-2xl font-black tracking-[0.15em] text-white flex items-center justify-center gap-2.5 transition-all active:scale-[0.98] ${isDesktop ? 'h-14 text-sm' : 'h-11 text-[12px]'}`}
          style={{ background: '#10B981', boxShadow: '0 12px 24px -8px rgba(16, 185, 129, 0.4)', opacity: submitting ? 0.7 : 1 }}
        >
          {submitting ? <><Loader2 size={18} className="animate-spin" /> MENYIMPAN...</> : <><Truck size={18} /> SIMPAN TRANSAKSI</>}
        </button>

        <div className="flex items-center gap-3">
          <Button type="button" variant="ghost" onClick={onBack} className={`gap-2 text-[#4B6478] hover:text-white font-bold rounded-xl flex-1 border border-white/5 ${isDesktop ? 'h-12' : 'h-9 text-[11px]'}`}>
            <ChevronLeft size={16} /> KEMBALI
          </Button>
          {!step3Data.enabled && (
             <button type="button" onClick={handlePreSubmit} disabled={submitting}
              className="flex-1 text-[11px] text-[#4B6478] font-black uppercase tracking-widest hover:text-emerald-400 transition-colors"
            >
              Lewati & Simpan
            </button>
          )}
        </div>
      </div>
    </div>
  )
}

function ToggleRow({ label, active, onClick }) {
  return (
    <button
      type="button"
      onClick={onClick}
      className="flex items-center gap-3 transition-opacity active:opacity-70 group"
    >
      <div 
        className={`w-10 h-5 rounded-full relative transition-colors ${active ? 'bg-emerald-500' : 'bg-white/10'}`}
      >
        <div 
          className={`absolute top-1 w-3 h-3 rounded-full bg-white transition-all ${active ? 'left-6' : 'left-1'}`}
        />
      </div>
      <span className={`text-[11px] font-black uppercase tracking-widest transition-colors ${active ? 'text-white' : 'text-[#4B6478] group-hover:text-slate-300'}`}>
        {label}
      </span>
    </button>
  )
}
