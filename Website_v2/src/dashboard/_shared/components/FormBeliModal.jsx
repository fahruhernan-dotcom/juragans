import React, { useState } from 'react'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import * as z from 'zod'
import { useQuery, useQueryClient } from '@tanstack/react-query'
import { supabase } from '@/lib/supabase'
import { useAuth, getBrokerBasePath } from '@/lib/hooks/useAuth'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Card } from '@/components/ui/card'
import { Separator } from '@/components/ui/separator'
import { Loader2, AlertCircle } from 'lucide-react'
import { toast } from 'sonner'
import { logSupabaseError } from '@/lib/logger/supabaseLogger'
import { logError } from '@/lib/logger/errorLogger'
import { formatIDR } from '@/lib/format'
import { useNavigate } from 'react-router-dom'
import { InputRupiah } from '@/components/ui/InputRupiah'
import { DatePicker } from '@/components/ui/DatePicker'

const schema = z.object({
  farm_id: z.string().min(1, 'Pilih kandang'),
  quantity: z.number().min(1, 'Min 1 ekor'),
  avg_weight_kg: z.number().min(0.1, 'Min 0.1 kg'),
  price_per_kg: z.number().min(1000),
  transport_cost: z.number().min(0).default(0),
  other_cost: z.number().min(0).default(0),
  transaction_date: z.string(),
  notes: z.string().optional()
})

export default function FormBeliModal({ onClose }) {
  const { tenant } = useAuth()
  const queryClient = useQueryClient()
  const _navigate = useNavigate()
  const brokerBase = getBrokerBasePath(tenant)
  const navigate = (path, options) => {
    if (typeof path === 'string' && path.startsWith('/broker/') && !path.startsWith(brokerBase)) {
      return _navigate(path.replace('/broker', brokerBase), options)
    }
    return _navigate(path, options)
  }
  const [isLoading, setIsLoading] = useState(false)
  const [inputMode, setInputMode] = useState('ekor') // 'ekor' | 'berat'
  const [totalWeightInput, setTotalWeightInput] = useState('')
  const [weightUnit, setWeightUnit] = useState('kg')

  const { register, handleSubmit, watch, setValue, formState: { errors } } = useForm({
    resolver: zodResolver(schema),
    defaultValues: {
      transaction_date: new Date().toISOString().split('T')[0],
      transport_cost: 0,
      other_cost: 0
    }
  })

  // Queries
  const { data: farms } = useQuery({
    queryKey: ['farms-active', tenant?.id],
    queryFn: async () => {
      const { data } = await supabase
        .from('farms')
        .select('*')
        .eq('tenant_id', tenant.id)
        .eq('status', 'ready')
        .eq('is_deleted', false)
      return data || []
    }
  })

  // Watch for preview
  const qty = watch('quantity')
  const avgW = watch('avg_weight_kg')
  const price = watch('price_per_kg')
  const transport = watch('transport_cost')
  const other = watch('other_cost')

  const totalWeight = inputMode === 'berat' 
    ? (parseFloat(totalWeightInput) || 0) * (weightUnit === 'ton' ? 1000 : weightUnit === 'rit' ? 5000 : 1)
    : (qty || 0) * (avgW || 0)

  const totalCost = totalWeight * (price || 0)

  const onSubmit = async (values) => {
    setIsLoading(true)
    try {
      const finalKg = inputMode === 'berat'
        ? (parseFloat(totalWeightInput) || 0) * (weightUnit === 'ton' ? 1000 : weightUnit === 'rit' ? 5000 : 1)
        : values.quantity * values.avg_weight_kg

      const total_cost = finalKg * values.price_per_kg

      const { error: purchaseError } = await supabase.from('purchases').insert({
        tenant_id: tenant.id,
        farm_id: values.farm_id,
        quantity: inputMode === 'berat' ? Math.round(finalKg / (values.avg_weight_kg || 1.85)) : values.quantity,
        avg_weight_kg: values.avg_weight_kg,
        total_weight_kg: finalKg,
        price_per_kg: values.price_per_kg,
        total_cost,
        transport_cost: values.transport_cost || 0,
        other_cost: values.other_cost || 0,
        transaction_date: values.transaction_date,
        is_deleted: false,
        notes: values.notes || null
      })

      if (purchaseError) {
        logSupabaseError(purchaseError, {
          table: 'purchases',
          operation: 'insert',
          component: 'FormBeliModal',
          actionName: 'broker.purchase.create',
        })
        throw purchaseError
      }

      // Update farm stock — partial commit risk: purchase already inserted.
      const { data: farm } = await supabase
        .from('farms')
        .select('population')
        .eq('id', values.farm_id)
        .single()

      if (farm) {
        const { error: farmUpdErr } = await supabase
          .from('farms')
          .update({ population: (farm.population || 0) - values.quantity })
          .eq('id', values.farm_id)
        if (farmUpdErr) {
          // Non-fatal: purchase exists but farm population not decremented.
          logError({
            level: 'error',
            source: 'supabase',
            component: 'FormBeliModal',
            actionName: 'broker.purchase.create.farm_sync',
            error: farmUpdErr,
            metadata: {
              table: 'farms',
              operation: 'update',
              partial: true,
              farm_id: values.farm_id,
            },
          })
        }
      }

      queryClient.invalidateQueries({ queryKey: ['broker-stats'] })
      queryClient.invalidateQueries({ queryKey: ['purchases'] })
      queryClient.invalidateQueries({ queryKey: ['farms'] })
      
      toast.success('Pembelian berhasil dicatat!')
      onClose()
    } catch (err) {
      toast.error('Gagal mencatat pembelian: ' + err.message)
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="space-y-6 pb-8">
      <div className="space-y-2">
        <Label className="font-display text-[11px] font-bold text-[#4B6478] uppercase tracking-widest">Pilih Kandang</Label>
        {farms?.length === 0 ? (
          <div className="p-4 bg-amber-500/5 border border-amber-500/20 rounded-xl space-y-3">
            <div className="flex gap-2 text-amber-500">
               <AlertCircle size={16} />
               <p className="text-xs font-medium">Kamu belum punya kandang ready. Tambahkan di menu Kandang dulu.</p>
            </div>
            <Button 
                type="button"
                variant="outline" 
                className="w-full border-amber-500/20 text-amber-500 h-9 rounded-lg text-xs font-bold"
                onClick={() => navigate('/broker/kandang')}
            >
                Ke Kandang →
            </Button>
          </div>
        ) : (
          <Select onValueChange={(val) => setValue('farm_id', val)}>
            <SelectTrigger className="bg-[#111C24] border-white/10 h-12 rounded-xl text-[#F1F5F9]">
              <SelectValue placeholder="Pilih kandang sumber" />
            </SelectTrigger>
            <SelectContent className="bg-[#111C24] border-white/10 text-white">
              {farms?.map(farm => (
                <SelectItem key={farm.id} value={farm.id} className="focus:bg-white/5 focus:text-white">
                  {farm.farm_name} · {farm.population} ekor
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        )}
        {errors.farm_id && <p className="text-[10px] text-red-500 font-bold">{errors.farm_id.message}</p>}
      </div>

      <div className="grid grid-cols-2 gap-4">
        {/* Toggle Mode */}
        <div className="col-span-2 flex gap-1.5 mb-1">
          <button
            type="button"
            onClick={() => setInputMode('ekor')}
            className={`flex-1 p-2 rounded-lg border text-[13px] font-semibold transition-colors ${
              inputMode === 'ekor'
                ? 'border-emerald-500/40 bg-emerald-500/10 text-emerald-400'
                : 'border-border bg-transparent text-muted-foreground hover:bg-white/[0.02]'
            }`}
          >
            Per Ekor
          </button>
          <button
            type="button"
            onClick={() => setInputMode('berat')}
            className={`flex-1 p-2 rounded-lg border text-[13px] font-semibold transition-colors ${
              inputMode === 'berat'
                ? 'border-emerald-500/40 bg-emerald-500/10 text-emerald-400'
                : 'border-border bg-transparent text-muted-foreground hover:bg-white/[0.02]'
            }`}
          >
            Per Berat
          </button>
        </div>

        {inputMode === 'ekor' ? (
          <>
            <div className="space-y-2">
              <Label className="font-display text-[11px] font-bold text-[#4B6478] uppercase tracking-widest">Jumlah Ekor *</Label>
              <Input 
                type="number" 
                placeholder="500"
                className="bg-[#111C24] border-white/10 h-12 rounded-xl text-lg font-bold"
                {...register('quantity', { valueAsNumber: true })}
              />
              {errors.quantity && <p className="text-[10px] text-red-500 font-bold">{errors.quantity.message}</p>}
            </div>

            <div className="space-y-2">
              <Label className="font-display text-[11px] font-bold text-[#4B6478] uppercase tracking-widest">Bobot Rata-rata (kg/ekor) *</Label>
              <div className="relative">
                <Input 
                    type="number" 
                    step="0.01"
                    placeholder="1.85"
                    className="bg-[#111C24] border-white/10 h-12 rounded-xl text-lg font-bold pr-10"
                    {...register('avg_weight_kg', { valueAsNumber: true })}
                />
                <span className="absolute right-3 top-1/2 -translate-y-1/2 text-[10px] font-black text-[#4B6478] uppercase">kg</span>
              </div>
              {errors.avg_weight_kg && <p className="text-[10px] text-red-500 font-bold">{errors.avg_weight_kg.message}</p>}
            </div>
          </>
        ) : (
          <div className="col-span-2 space-y-4 pt-1">
            <div className="space-y-2">
              <Label className="font-display text-[11px] font-bold text-[#4B6478] uppercase tracking-widest">Total Berat *</Label>
              <div className="flex gap-2">
                <Input
                  type="number"
                  step="0.1"
                  placeholder="3000"
                  value={totalWeightInput}
                  onChange={(e) => {
                    setTotalWeightInput(e.target.value)
                    const kg = parseFloat(e.target.value) || 0
                    const multiplier = weightUnit === 'ton' ? 1000 : weightUnit === 'rit' ? 5000 : 1
                    const totalKg = kg * multiplier
                    const avgW = parseFloat(watch('avg_weight_kg')) || 1.85
                    setValue('quantity', Math.round(totalKg / avgW))
                  }}
                  className="bg-[#111C24] border-white/10 h-12 rounded-xl text-lg font-bold flex-1"
                />
                <select
                  value={weightUnit}
                  onChange={(e) => {
                    setWeightUnit(e.target.value)
                    const kg = parseFloat(totalWeightInput) || 0
                    const multiplier = e.target.value === 'ton' ? 1000 : e.target.value === 'rit' ? 5000 : 1
                    const totalKg = kg * multiplier
                    const avgW = parseFloat(watch('avg_weight_kg')) || 1.85
                    setValue('quantity', Math.round(totalKg / avgW))
                  }}
                  className="bg-[#111C24] border-white/10 h-12 rounded-xl px-4 text-sm text-foreground cursor-pointer font-bold outline-none"
                >
                  <option value="kg">kg</option>
                  <option value="ton">ton</option>
                  <option value="rit">rit</option>
                </select>
              </div>
            </div>

            <div className="space-y-2">
              <Label className="font-display text-[11px] font-bold text-[#4B6478] uppercase tracking-widest">Bobot Rata-rata (kg/ekor)</Label>
              <Input 
                type="number" 
                step="0.01"
                placeholder="1.85"
                className="bg-[#111C24] border-white/10 h-12 rounded-xl text-lg font-bold"
                {...register('avg_weight_kg', { valueAsNumber: true })}
                onChange={(e) => {
                  setValue('avg_weight_kg', e.target.value, { shouldValidate: true })
                  if (totalWeightInput) {
                    const kg = parseFloat(totalWeightInput) || 0
                    const multiplier = weightUnit === 'ton' ? 1000 : weightUnit === 'rit' ? 5000 : 1
                    setValue('quantity', Math.round((kg * multiplier) / (parseFloat(e.target.value) || 1.85)))
                  }
                }}
              />
              <p className="text-[11px] text-muted-foreground mt-1">Digunakan untuk estimasi jumlah ekor</p>
            </div>
          </div>
        )}
      </div>

      <div className="space-y-2">
        <Label className="font-display text-[11px] font-bold text-[#4B6478] uppercase tracking-widest">Harga Beli (Rp/kg)</Label>
        <InputRupiah 
            value={watch('price_per_kg')}
            onChange={(val) => setValue('price_per_kg', val)}
            placeholder="19.800"
            className="bg-[#111C24] border-white/10 h-12 rounded-xl text-lg font-bold"
        />
        {errors.price_per_kg && <p className="text-[10px] text-red-500 font-bold">{errors.price_per_kg.message}</p>}
      </div>

      <div className="grid grid-cols-2 gap-4">
          <div className="space-y-2">
            <Label className="font-display text-[11px] font-bold text-[#4B6478] uppercase tracking-widest">Biaya Transport</Label>
            <InputRupiah 
                value={watch('transport_cost')}
                onChange={(val) => setValue('transport_cost', val)}
                placeholder="0"
                className="bg-[#111C24] border-white/10 h-12 rounded-xl font-bold"
            />
          </div>
          <div className="space-y-2">
            <Label className="font-display text-[11px] font-bold text-[#4B6478] uppercase tracking-widest">Biaya Lain</Label>
            <InputRupiah 
                value={watch('other_cost')}
                onChange={(val) => setValue('other_cost', val)}
                placeholder="0"
                className="bg-[#111C24] border-white/10 h-12 rounded-xl font-bold"
            />
          </div>
      </div>

      <div className="space-y-2">
        <Label className="font-display text-[11px] font-bold text-[#4B6478] uppercase tracking-widest">Tanggal Transaksi</Label>
        <DatePicker
            value={watch('transaction_date')}
            onChange={(val) => setValue('transaction_date', val)}
            placeholder="Pilih tanggal transaksi"
        />
      </div>

      <div className="space-y-2">
        <Label className="font-display text-[11px] font-bold text-[#4B6478] uppercase tracking-widest">Catatan (Opsional)</Label>
        <Textarea 
            className="bg-[#111C24] border-white/10 rounded-xl min-h-[80px]"
            placeholder="Tambah keterangan..."
            {...register('notes')}
        />
      </div>

      {totalWeight > 0 && price > 0 && (
        <Card className="bg-emerald-500/5 border-emerald-500/15 rounded-2xl p-4 space-y-3">
          <p className="text-[10px] font-black text-emerald-400 uppercase tracking-widest">Ringkasan Pembelian</p>
          <div className="space-y-2">
            <div className="flex justify-between text-[13px]">
              <span className="text-muted-foreground">Total Berat</span>
              <span className="font-bold text-white">
                {totalWeight > 1000 
                  ? `${(totalWeight / 1000).toFixed(2)} ton` 
                  : `${totalWeight.toFixed(1)} kg`}
              </span>
            </div>
            <div className="flex justify-between text-[13px]">
              <span className="text-muted-foreground">Total Beli</span>
              <span className="font-bold text-white">{formatIDR(totalCost)}</span>
            </div>
            {transport > 0 && (
              <div className="flex justify-between text-[13px]">
                <span className="text-muted-foreground">Biaya Transport</span>
                <span className="font-bold text-white">{formatIDR(transport)}</span>
              </div>
            )}
            {other > 0 && (
              <div className="flex justify-between text-[13px]">
                <span className="text-muted-foreground">Biaya Lain</span>
                <span className="font-bold text-white">{formatIDR(other)}</span>
              </div>
            )}
            <Separator className="bg-emerald-500/10" />
            <div className="flex justify-between items-center">
              <span className="text-sm font-bold text-emerald-400">Total Modal</span>
              <span className="text-xl font-black text-emerald-400 tabular-nums">
                {formatIDR(totalCost + (Number(transport) || 0) + (Number(other) || 0))}
              </span>
            </div>
          </div>
        </Card>
      )}

      <Button
        type="submit"
        disabled={isLoading}
        className="w-full h-14 rounded-2xl bg-[#10B981] hover:bg-[#0D9668] text-[#0C1319] font-black text-base shadow-[0_8px_24px_rgba(16,185,129,0.25)] border-none"
      >
        {isLoading ? (
          <><Loader2 size={20} className="animate-spin mr-2" /> Menyimpan...</>
        ) : '+ Catat Pembelian'}
      </Button>
    </form>
  )
}
