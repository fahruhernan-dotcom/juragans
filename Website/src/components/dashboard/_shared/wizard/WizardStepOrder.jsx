import { useState } from 'react'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import * as z from 'zod'
import { useQuery } from '@tanstack/react-query'
import { supabase } from '@/lib/supabase'
import { useAuth } from '@/lib/hooks/useAuth'
import { Button } from '@/components/ui/button'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { ChevronLeft, ChevronDown, Check } from 'lucide-react'
import { InputNumber } from '@/components/ui/InputNumber'
import { InputRupiah } from '@/components/ui/InputRupiah'
import { DatePicker } from '@/components/ui/DatePicker'
import { safeNum } from '@/lib/format'
import { TrendingDown, AlertCircle } from 'lucide-react'
import { toast } from 'sonner'

const FIELD_LABELS = {
  rpa_id: 'Pembeli RPA',
  inputMode: 'Mode Input',
  quantity: 'Jumlah Ekor',
  avg_weight_kg: 'Rata-rata Berat',
  total_weight_input: 'Total Berat',
  weight_unit: 'Satuan Berat',
  price_per_kg: 'Harga',
  delivery_cost: 'Biaya Pengiriman',
  payment_status: 'Status Pembayaran',
  paid_amount: 'Jumlah Bayar',
  transaction_date: 'Tanggal Transaksi',
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

const orderSchema = z.object({
  rpa_id: z.string({ 
    required_error: 'Pilih pembeli RPA terlebih dahulu',
    invalid_type_error: 'Pilih pembeli RPA terlebih dahulu'
  }).min(1, 'Pilih pembeli RPA terlebih dahulu'),
  inputMode: z.enum(['ekor', 'berat'], { 
    required_error: 'Pilih mode input',
    invalid_type_error: 'Pilih mode input'
  }),
  quantity: z.coerce.number({ 
    required_error: 'Masukkan jumlah ekor',
    invalid_type_error: 'Jumlah ekor harus berupa angka' 
  }).optional().nullable(),
  avg_weight_kg: z.coerce.number({ 
    required_error: 'Masukkan bobot',
    invalid_type_error: 'Bobot harus berupa angka' 
  }).min(0.1, 'Minimal 0.1 kg').optional().nullable(),
  total_weight_input: z.coerce.number({ 
    required_error: 'Masukkan total berat',
    invalid_type_error: 'Total berat harus berupa angka' 
  }).optional().nullable(),
  weight_unit: z.enum(['kg', 'ton', 'rit'], { 
    required_error: 'Pilih satuan berat',
    invalid_type_error: 'Pilih satuan berat'
  }),
  price_per_kg: z.coerce.number({ 
    required_error: 'Masukkan harga target',
    invalid_type_error: 'Harga target harus berupa angka' 
  }).min(1000, 'Harga minimal Rp 1.000'),
  delivery_cost: z.coerce.number({ 
    invalid_type_error: 'Biaya kirim harus berupa angka' 
  }).optional().nullable(),
  payment_status: z.enum(['lunas', 'belum_lunas', 'sebagian'], { 
    required_error: 'Pilih status pembayaran',
    invalid_type_error: 'Pilih status pembayaran'
  }),
  paid_amount: z.number({ 
    invalid_type_error: 'Jumlah bayar harus berupa angka' 
  }).optional().nullable(),
  transaction_date: z.string({ 
    required_error: 'Pilih tanggal order',
    invalid_type_error: 'Pilih tanggal order'
  }).min(1, 'Pilih tanggal order'),
  due_date: z.string({ 
    invalid_type_error: 'Pilih tanggal jatuh tempo' 
  }).optional().nullable(),
  notes: z.string().trim().max(500, 'Catatan terlalu panjang (max 500 karakter)').optional()
}).refine((data) => {
  if (data.inputMode === 'ekor' && (!data.quantity || data.quantity <= 0)) {
    return false
  }
  return true
}, {
  message: 'Masukkan jumlah ekor (minimal 1)',
  path: ['quantity']
}).refine((data) => {
  if (data.inputMode === 'berat' && (!data.total_weight_input || data.total_weight_input <= 0)) {
    return false
  }
  return true
}, {
  message: 'Masukkan total berat valid',
  path: ['total_weight_input']
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

export default function WizardStepOrder({ onNext, onBack }) {
  const { tenant } = useAuth()
  const [unitOpen, setUnitOpen] = useState(false)

  const { formState: { errors }, watch, setValue, handleSubmit, register } = useForm({
    resolver: zodResolver(orderSchema),
    defaultValues: {
      inputMode: 'ekor',
      avg_weight_kg: 1.85,
      weight_unit: 'kg',
      delivery_cost: 0,
      payment_status: 'belum_lunas',
      paid_amount: 0,
      transaction_date: new Date().toISOString().split('T')[0],
      notes: ''
    }
  })

  const rpaId = watch('rpa_id')
  const inputMode = watch('inputMode')
  const quantity = watch('quantity')
  const avgWeight = watch('avg_weight_kg')
  const totalWeightInput = watch('total_weight_input')
  const weightUnit = watch('weight_unit')
  const pricePerKg = watch('price_per_kg')
  const deliveryCost = watch('delivery_cost')
  const paymentStatus = watch('payment_status')
  const paidAmount = watch('paid_amount')
  const dueDate = watch('due_date')
  const transactionDate = watch('transaction_date')
  const _notes = watch('notes')

  const { data: rpaClients } = useQuery({
    queryKey: ['rpa-clients-active', tenant?.id],
    queryFn: async () => {
      const { data } = await supabase.from('rpa_clients').select('*').eq('tenant_id', tenant.id).eq('is_deleted', false).order('rpa_name')
      return data || []
    },
    enabled: !!tenant?.id
  })

  const weightMult = safeNum(weightUnit === 'ton' ? 1000 : weightUnit === 'rit' ? 5000 : 1)
  const totalWeightKg = inputMode === 'berat'
    ? safeNum(totalWeightInput) * weightMult
    : safeNum(quantity) * safeNum(avgWeight)
 
  const totalRevenue = safeNum(totalWeightKg) * safeNum(pricePerKg)

  const onSubmit = (values) => {
    const finalQty = values.inputMode === 'berat' ? Math.round(totalWeightKg / (safeNum(values.avg_weight_kg) || 1.85)) : safeNum(values.quantity)
    const selectedRPA = rpaClients?.find(r => r.id === values.rpa_id)
      
    onNext({
      rpa_id: values.rpa_id,
      rpa_name: selectedRPA?.rpa_name,
      rpa_phone: selectedRPA?.phone,
      quantity: finalQty,
      avg_weight_kg: safeNum(values.avg_weight_kg) || 1.85,
      total_weight_kg: totalWeightKg,
      price_per_kg: values.price_per_kg,
      total_revenue: totalRevenue,
      delivery_cost: safeNum(values.delivery_cost) || 0,
      payment_status: values.payment_status,
      paid_amount: values.payment_status === 'lunas' ? totalRevenue : safeNum(values.paid_amount),
      transaction_date: values.transaction_date,
      due_date: values.payment_status !== 'lunas' ? values.due_date : null,
      notes: values.notes || null,
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
    <form onSubmit={handleSubmit(onSubmit, onError)} className="space-y-5 px-5 pb-8 flex flex-col h-full min-h-0 relative">
      <div className="flex-1 space-y-5 overflow-y-auto pb-4">
        <p className="text-[11px] font-black uppercase tracking-widest text-[#4B6478]">Step 1 — Order dari Siapa?</p>

        {/* RPA */}
        <div className="space-y-1.5">
          <label style={S.label}>Pilih RPA Buyer *</label>
          <Select onValueChange={(val) => setValue('rpa_id', val, { shouldValidate: true })} value={rpaId}>
            <SelectTrigger id="rpa_id" className={`${S.input} ${errors.rpa_id ? 'border-red-500 ring-2 ring-red-500/20' : ''}`}><SelectValue placeholder="Pilih RPA yang order" /></SelectTrigger>
            <SelectContent className="bg-[#111C24] border-white/10 text-white">
              {rpaClients?.map(r => (
                <SelectItem key={r.id} value={r.id} className="focus:bg-white/5">
                  {r.rpa_name} · {r.payment_terms || 'cash'}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
          {errors.rpa_id && <p className="text-[10px] text-red-500 font-bold">{errors.rpa_id.message}</p>}
        </div>

        {/* Mode Toggle */}
        <div className="space-y-3">
          <div className="flex gap-1.5">
            {['ekor', 'berat'].map(m => (
              <button key={m} type="button" onClick={() => setValue('inputMode', m, { shouldValidate: true })}
                className={`flex-1 p-2 rounded-lg border text-[13px] font-semibold transition-colors ${inputMode === m ? 'border-emerald-500/40 bg-emerald-500/10 text-emerald-400' : 'border-border bg-transparent text-muted-foreground'}`}
              >{m === 'ekor' ? 'Per Ekor' : 'Per Berat'}</button>
            ))}
          </div>

          {inputMode === 'ekor' ? (
            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-1.5">
                <label htmlFor="quantity" style={S.label}>Jumlah Ekor *</label>
                <InputNumber id="quantity" name="quantity" placeholder="500" value={quantity} onChange={(val) => setValue('quantity', val, { shouldValidate: true })} step={1} min={1} className={errors.quantity ? 'border-red-500 ring-1 ring-red-500' : ''} />
                {errors.quantity && <p className="text-[10px] text-red-500 font-bold">{errors.quantity.message}</p>}
              </div>
              <div className="space-y-1.5">
                <label htmlFor="avg_weight_kg_ekor" style={S.label}>Bobot/ekor (kg)</label>
                <InputNumber id="avg_weight_kg" name="avg_weight_kg" step={0.01} min={0.1} placeholder="1.85" value={avgWeight} onChange={(val) => setValue('avg_weight_kg', val, { shouldValidate: true })} className={errors.avg_weight_kg ? 'border-red-500 ring-1 ring-red-500' : ''} />
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
                    placeholder="3000"
                    value={totalWeightInput}
                    onChange={(val) => setValue('total_weight_input', val, { shouldValidate: true })}
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
                        height: '47px',  // Match h-12 adjusted
                        width: '100%',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'space-between',
                        gap: '6px',
                        userSelect: 'none'
                      }}
                      className="mt-0"
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
                                setValue('weight_unit', unit)
                                setUnitOpen(false)
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
                {errors.total_weight_input && <p className="text-[10px] text-red-500 font-bold">{errors.total_weight_input.message}</p>}
              </div>
              <div className="space-y-1.5">
                <label htmlFor="avg_weight_kg_berat" style={S.label}>Bobot Rata-rata (kg/ekor)</label>
                <InputNumber id="avg_weight_kg_berat" name="avg_weight_kg" step={0.01} min={0.1} placeholder="1.85" value={avgWeight} onChange={(val) => setValue('avg_weight_kg', val, { shouldValidate: true })} />
                {errors.avg_weight_kg && <p className="text-[10px] text-red-500 font-bold">{errors.avg_weight_kg.message}</p>}
              </div>
            </div>
          )}
        </div>

        {/* Harga Jual Target */}
        <div className="space-y-1.5">
          <label htmlFor="price_per_kg" style={S.label}>Harga Jual Target (Rp/kg) *</label>
          <InputRupiah id="price_per_kg" name="price_per_kg" value={pricePerKg} onChange={(val) => setValue('price_per_kg', val, { shouldValidate: true })} placeholder="20.500" className={`${S.input} text-lg font-bold ${errors.price_per_kg ? 'border-red-500 ring-2 ring-red-500/20' : ''}`} />
          {errors.price_per_kg && <p className="text-[10px] text-red-500 font-bold">{errors.price_per_kg.message}</p>}
        </div>

        {/* Biaya Pengiriman */}
        <div className="space-y-1.5">
          <label htmlFor="delivery_cost" style={S.label}>Biaya Pengiriman</label>
          <InputRupiah id="delivery_cost" name="delivery_cost" value={deliveryCost} onChange={(val) => setValue('delivery_cost', val, { shouldValidate: true })} placeholder="0" className={S.input} />
        </div>

        {/* Status Pembayaran */}
        <div className="space-y-1.5">
          <label style={S.label}>Status Pembayaran *</label>
          <div className="flex gap-2">
            {PAYMENT_OPTIONS.map(opt => (
              <button key={opt.value} type="button" onClick={() => setValue('payment_status', opt.value, { shouldValidate: true })}
                style={{ flex: 1, padding: '10px 4px', borderRadius: 10, fontSize: 12, fontWeight: 700, cursor: 'pointer', transition: 'all 0.15s', background: paymentStatus === opt.value ? `${opt.color}18` : 'transparent', border: paymentStatus === opt.value ? `2px solid ${opt.color}60` : '1px solid rgba(255,255,255,0.1)', color: paymentStatus === opt.value ? opt.color : '#4B6478' }}
              >{opt.label}</button>
            ))}
          </div>
        </div>

        {paymentStatus === 'sebagian' && (
          <div className="space-y-1.5">
            <label htmlFor="paid_amount" style={S.label}>Sudah Dibayar</label>
            <InputRupiah id="paid_amount" name="paid_amount" value={paidAmount} onChange={(val) => setValue('paid_amount', val, { shouldValidate: true })} placeholder="0" className={`${S.input} ${errors.paid_amount ? 'border-red-500 ring-1 ring-red-500' : ''}`} />
            {errors.paid_amount && <p className="text-[10px] text-red-500 font-bold">{errors.paid_amount.message}</p>}
          </div>
        )}
        {paymentStatus !== 'lunas' && (
          <div className="space-y-1.5">
            <label style={S.label}>Jatuh Tempo</label>
            <DatePicker id="due_date" value={dueDate} onChange={(val) => setValue('due_date', val, { shouldValidate: true })} placeholder="Pilih jatuh tempo" className={errors.due_date ? 'border-red-500 ring-1 ring-red-500' : ''} />
            {errors.due_date && <p className="text-[10px] text-red-500 font-bold">{errors.due_date.message}</p>}
          </div>
        )}

        <div className="space-y-1.5">
          <label style={S.label}>Tanggal Order</label>
          <DatePicker id="transaction_date" value={transactionDate} onChange={(val) => setValue('transaction_date', val, { shouldValidate: true })} placeholder="Pilih tanggal" className={errors.transaction_date ? 'border-red-500 ring-1 ring-red-500' : ''} />
          {errors.transaction_date && <p className="text-[10px] text-red-500 font-bold">{errors.transaction_date.message}</p>}
        </div>

        <div className="space-y-1.5">
          <label htmlFor="notes" style={S.label}>Catatan (Opsional)</label>
          <textarea id="notes" name="notes" className="w-full bg-[#111C24] border border-white/10 rounded-xl p-3 text-[#F1F5F9] text-sm min-h-[72px] outline-none resize-none placeholder:text-muted-foreground" placeholder="Catatan..." {...register('notes')} />
          {errors.notes && <p className="text-[10px] text-red-500 font-bold">{errors.notes.message}</p>}
        </div>
      </div>

      <div className="flex gap-3 pt-2 mt-auto">
        <Button type="button" variant="ghost" onClick={onBack} className="gap-1.5 text-[#4B6478] hover:text-white font-bold h-12 rounded-xl">
          <ChevronLeft size={16} /> Kembali
        </Button>
        <Button type="submit" className="flex-1 h-12 rounded-2xl font-black" style={{ background: '#10B981', color: 'white' }}>
          Lanjut → Cari Kandang
        </Button>
      </div>
    </form>
  )
}
