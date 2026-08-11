import { useState } from 'react'
import { useForm, Controller } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { DatePicker } from '@/components/ui/DatePicker'
import * as z from 'zod'
import { useQuery, useQueryClient } from '@tanstack/react-query'
import { supabase } from '@/lib/supabase'
import { logSupabaseError } from '@/lib/logger/supabaseLogger'
import { useAuth, getBrokerBasePath } from '@/lib/hooks/useAuth'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Card } from '@/components/ui/card'
import { Separator } from '@/components/ui/separator'
import { Loader2, AlertCircle, TrendingUp } from 'lucide-react'
import { toast } from 'sonner'
import { formatIDR, formatWeight } from '@/lib/format'
import { useNavigate } from 'react-router-dom'

const schema = z.object({
  rpa_id: z.string().min(1, 'Pilih buyer RPA'),
  farm_id: z.string().min(1, 'Pilih kandang asal'),
  quantity: z.number().min(1, 'Min 1 ekor'),
  avg_weight_kg: z.number().min(0.1, 'Min 0.1 kg'),
  price_per_kg: z.number().min(1000),
  transaction_date: z.string(),
  due_date: z.string().optional(),
  notes: z.string().optional()
})

export default function FormJualModal({ onClose }) {
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

  const { register, handleSubmit, watch, setValue, control, formState: { errors } } = useForm({
    resolver: zodResolver(schema),
    defaultValues: {
      transaction_date: new Date().toISOString().split('T')[0],
      due_date: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString().split('T')[0] // Default 7 days
    }
  })

  // Queries
  const { data: rpaClients } = useQuery({
    queryKey: ['rpa-clients', tenant?.id],
    queryFn: async () => {
      const { data } = await supabase
        .from('rpa_clients')
        .select('*')
        .eq('tenant_id', tenant.id)
        .eq('is_deleted', false)
      return data || []
    }
  })

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

  const totalWeight = (qty || 0) * (avgW || 0)
  const totalRevenue = totalWeight * (price || 0)

  const onSubmit = async (values) => {
    setIsLoading(true)
    try {
      const total_weight_kg = values.quantity * values.avg_weight_kg
      const total_revenue = total_weight_kg * values.price_per_kg

      const { error: saleError } = await supabase.from('sales').insert({
        tenant_id: tenant.id,
        rpa_id: values.rpa_id,
        farm_id: values.farm_id,
        quantity: values.quantity,
        avg_weight_kg: values.avg_weight_kg,
        total_weight_kg,
        price_per_kg: values.price_per_kg,
        total_revenue,
        net_revenue: total_revenue, // Simplified for now
        payment_status: 'belum_lunas',
        transaction_date: values.transaction_date,
        due_date: values.due_date,
        is_deleted: false,
        notes: values.notes
      })

      if (saleError) {
        logSupabaseError(saleError, { table: 'sales', operation: 'insert', component: 'FormJualModal', actionName: 'broker.sale.create' })
        throw saleError
      }

      // Update RPA balance
      const { data: rpa } = await supabase
        .from('rpa_clients')
        .select('total_outstanding')
        .eq('id', values.rpa_id)
        .single()

      if (rpa) {
        await supabase
          .from('rpa_clients')
          .update({ total_outstanding: (rpa.total_outstanding || 0) + total_revenue })
          .eq('id', values.rpa_id)
      }

      // Update farm stock
      const { data: farm } = await supabase
        .from('farms')
        .select('population')
        .eq('id', values.farm_id)
        .single()

      if (farm) {
        await supabase
          .from('farms')
          .update({ population: (farm.population || 0) - values.quantity })
          .eq('id', values.farm_id)
      }

      queryClient.invalidateQueries({ queryKey: ['broker-stats'] })
      queryClient.invalidateQueries({ queryKey: ['sales'] })
      queryClient.invalidateQueries({ queryKey: ['rpa-clients'] })
      
      toast.success('Penjualan berhasil dicatat!')
      onClose()
    } catch (err) {
      toast.error('Gagal mencatat penjualan: ' + err.message)
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="space-y-6 pb-8">
      {/* 1. Pilih Buyer RPA */}
      <div className="space-y-2">
        <Label className="font-display text-[11px] font-bold text-[#4B6478] uppercase tracking-widest">Pilih Buyer RPA</Label>
        {rpaClients?.length === 0 ? (
          <div className="p-4 bg-amber-500/5 border border-amber-500/20 rounded-xl space-y-3">
            <div className="flex gap-2 text-amber-500">
               <AlertCircle size={16} />
               <p className="text-xs font-medium">Kamu belum punya data RPA. Tambahkan di menu RPA dulu.</p>
            </div>
            <Button 
                type="button"
                variant="outline" 
                className="w-full border-amber-500/20 text-amber-500 h-9 rounded-lg text-xs font-bold"
                onClick={() => navigate('/broker/rpa')}
            >
                Tambah RPA →
            </Button>
          </div>
        ) : (
          <Select onValueChange={(val) => setValue('rpa_id', val)}>
            <SelectTrigger className="bg-[#111C24] border-white/10 h-12 rounded-xl text-[#F1F5F9]">
              <SelectValue placeholder="Pilih buyer" />
            </SelectTrigger>
            <SelectContent className="bg-[#111C24] border-white/10 text-white">
              {rpaClients?.map(rpa => (
                <SelectItem key={rpa.id} value={rpa.id} className="focus:bg-white/5 focus:text-white">
                  {rpa.rpa_name}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        )}
        {errors.rpa_id && <p className="text-[10px] text-red-500 font-bold">{errors.rpa_id.message}</p>}
      </div>

      {/* 2. Pilih Kandang Asal */}
      <div className="space-y-2">
        <Label className="font-display text-[11px] font-bold text-[#4B6478] uppercase tracking-widest">Kandang Asal</Label>
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
        {errors.farm_id && <p className="text-[10px] text-red-500 font-bold">{errors.farm_id.message}</p>}
      </div>

      <div className="grid grid-cols-2 gap-4">
        {/* 3. Jumlah Ekor */}
        <div className="space-y-2">
          <Label className="font-display text-[11px] font-bold text-[#4B6478] uppercase tracking-widest">Jumlah Ekor</Label>
          <Input 
            type="number" 
            placeholder="0"
            className="bg-[#111C24] border-white/10 h-12 rounded-xl text-lg font-bold"
            {...register('quantity', { valueAsNumber: true })}
          />
          {errors.quantity && <p className="text-[10px] text-red-500 font-bold">{errors.quantity.message}</p>}
        </div>

        {/* 4. Bobot */}
        <div className="space-y-2">
          <Label className="font-display text-[11px] font-bold text-[#4B6478] uppercase tracking-widest">Bobot (kg)</Label>
          <div className="relative">
            <Input 
                type="number" 
                step="0.01"
                placeholder="0.00"
                className="bg-[#111C24] border-white/10 h-12 rounded-xl text-lg font-bold pr-10"
                {...register('avg_weight_kg', { valueAsNumber: true })}
            />
            <span className="absolute right-3 top-1/2 -translate-y-1/2 text-[10px] font-black text-[#4B6478] uppercase">kg</span>
          </div>
          {errors.avg_weight_kg && <p className="text-[10px] text-red-500 font-bold">{errors.avg_weight_kg.message}</p>}
        </div>
      </div>

      {/* 5. Harga Jual */}
      <div className="space-y-2">
        <Label className="font-display text-[11px] font-bold text-[#4B6478] uppercase tracking-widest">Harga Jual (Rp/kg)</Label>
        <Input 
            type="number" 
            placeholder="Rp 0"
            className="bg-[#111C24] border-white/10 h-12 rounded-xl text-lg font-bold text-[#10B981]"
            {...register('price_per_kg', { valueAsNumber: true })}
        />
        {errors.price_per_kg && <p className="text-[10px] text-red-500 font-bold">{errors.price_per_kg.message}</p>}
      </div>

        {/* 6. Tanggal */}
        <div className="space-y-2">
          <Label className="font-display text-[11px] font-bold text-[#4B6478] uppercase tracking-widest">Tanggal Jual</Label>
          <Controller
            control={control}
            name="transaction_date"
            render={({ field }) => (
              <DatePicker
                value={field.value}
                onChange={field.onChange}
              />
            )}
          />
        </div>

        {/* 7. Jatuh Tempo */}
        <div className="space-y-2">
          <Label className="font-display text-[11px] font-bold text-[#4B6478] uppercase tracking-widest">Jatuh Tempo</Label>
          <Controller
            control={control}
            name="due_date"
            render={({ field }) => (
              <DatePicker
                value={field.value}
                onChange={field.onChange}
              />
            )}
          />
        </div>

      {/* 8. Catatan */}
      <div className="space-y-2">
        <Label className="font-display text-[11px] font-bold text-[#4B6478] uppercase tracking-widest">Catatan (Opsional)</Label>
        <Textarea 
            className="bg-[#111C24] border-white/10 rounded-xl min-h-[80px]"
            placeholder="Tambah keterangan..."
            {...register('notes')}
        />
      </div>

      {/* Live Preview */}
      {qty > 0 && avgW > 0 && price > 0 && (
        <Card className="bg-emerald-500/5 border-emerald-500/15 rounded-2xl p-4 space-y-3">
          <div className="flex items-center justify-between">
            <p className="text-[10px] font-black text-emerald-400 uppercase tracking-widest">Estimasi Omzet</p>
            <TrendingUp size={14} className="text-emerald-400" />
          </div>
          <div className="space-y-2">
            <div className="flex justify-between text-[13px]">
              <span className="text-muted-foreground">Total Berat</span>
              <span className="font-bold text-white">{formatWeight(totalWeight)}</span>
            </div>
            <Separator className="bg-emerald-500/10" />
            <div className="flex justify-between items-center">
              <span className="text-sm font-bold text-emerald-400">Total Tagihan</span>
              <span className="text-xl font-black text-emerald-400 tabular-nums">{formatIDR(totalRevenue)}</span>
            </div>
          </div>
        </Card>
      )}

      {/* Submit */}
      <Button
        type="submit"
        disabled={isLoading}
        className="w-full h-14 rounded-2xl bg-[#10B981] hover:bg-[#0D9668] text-white font-black text-base shadow-[0_8px_24px_rgba(16,185,129,0.25)] border-none"
      >
        {isLoading ? (
          <><Loader2 size={20} className="animate-spin mr-2" /> Menyimpan...</>
        ) : '+ Catat Penjualan'}
      </Button>
    </form>
  )
}
