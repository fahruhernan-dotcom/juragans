import { useState, useEffect } from 'react'
import { useAuth } from '@/lib/hooks/useAuth'
import { supabase } from '@/lib/supabase'
import { useQueryClient } from '@tanstack/react-query'
import { toast } from 'sonner'
import { logSupabaseError } from '@/lib/logger/supabaseLogger'
import { 
  Sheet, 
  SheetContent, 
  SheetHeader, 
  SheetTitle, 
  SheetDescription 
} from '@/components/ui/sheet'
import { Button } from '@/components/ui/button'
import { Label } from '@/components/ui/label'
import { 
  Select, 
  SelectContent, 
  SelectItem, 
  SelectTrigger, 
  SelectValue 
} from '@/components/ui/select'
import { InputRupiah } from '@/components/ui/InputRupiah'
import { formatIDR, safeNum } from '@/lib/format'
import { Loader2 } from 'lucide-react'

export function FormBayarModal({ isOpen, onClose, sale, onSuccess }) {
  const { tenant } = useAuth()
  const queryClient = useQueryClient()
  const [amount, setAmount] = useState('')
  const [method, setMethod] = useState('transfer')
  const [isLoading, setIsLoading] = useState(false)

  const totalRevenue = Number(sale?.total_revenue || 0)
  const remaining = totalRevenue - safeNum(sale?.paid_amount)
  
  useEffect(() => {
    if (isOpen) setAmount(remaining)
  }, [isOpen, remaining])

  const handleSubmit = async (e) => {
    e.preventDefault()
    if (!amount || Number(amount) <= 0) {
      return toast.error('Jumlah bayar tidak valid')
    }
    
    setIsLoading(true)
    try {
      const payAmount = Number(amount)
      const newPaid = safeNum(sale.paid_amount) + payAmount
      const total = totalRevenue
      
      let status = 'belum_lunas'
      if (newPaid >= total) status = 'lunas'
      else if (newPaid > 0) status = 'sebagian'

      const { error: err1 } = await supabase.from('payments').insert({
        tenant_id: tenant.id,
        sale_id: sale.id,
        amount: payAmount,
        payment_method: method,
        payment_date: new Date().toISOString().split('T')[0]
      })
      if (err1) {
        logSupabaseError(err1, {
          table: 'payments',
          operation: 'insert',
          component: 'FormBayarModal',
          actionName: 'submitPayment',
        })
        throw err1
      }

      const { error: err2 } = await supabase.from('sales').update({
        paid_amount: newPaid,
        payment_status: status
      }).eq('id', sale.id)
      if (err2) {
        logSupabaseError(err2, {
          table: 'sales',
          operation: 'update',
          component: 'FormBayarModal',
          actionName: 'submitPayment',
        })
        throw err2
      }

      toast.success('Pembayaran berhasil dicatat')
      
      // Invalidate relevant queries
      queryClient.invalidateQueries({ queryKey: ['sales', tenant?.id] })
      queryClient.invalidateQueries({ queryKey: ['sales', sale.id] })
      queryClient.invalidateQueries({ queryKey: ['broker-stats'] })
      queryClient.invalidateQueries({ queryKey: ['cashflow'] })
      
      if (onSuccess) onSuccess()
      onClose()
    } catch (err) {
      toast.error('Gagal mencatat pembayaran')
      console.error(err)
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <Sheet open={isOpen} onOpenChange={onClose}>
      <SheetContent side="right" className="bg-[#0C1319] border-l border-white/8 w-full sm:max-w-[480px] p-6 overflow-y-auto">
        <SheetHeader className="mb-6">
          <SheetTitle className="font-display text-2xl font-black text-white uppercase tracking-tight text-left">
            CATAT PEMBAYARAN
          </SheetTitle>
          <SheetDescription className="sr-only">Form Catat Pembayaran</SheetDescription>
        </SheetHeader>

        <form onSubmit={handleSubmit} className="space-y-5">
          <div>
            <div className="p-4 bg-white/[0.02] border border-white/5 rounded-2xl mb-5 text-left">
              <p className="text-[10px] font-black text-[#4B6478] uppercase tracking-widest mb-1">Total Tagihan</p>
              <p className="font-display text-2xl font-black text-white tabular-nums">{formatIDR(totalRevenue)}</p>
              <div className="flex justify-between mt-3 text-xs">
                <span className="text-[#4B6478] font-bold">Sisa Tagihan</span>
                <span className="font-black text-red-400 tabular-nums">{formatIDR(remaining)}</span>
              </div>
            </div>

            <div className="space-y-4">
              <div className="space-y-2 text-left">
                <Label className="text-[11px] font-bold text-[#4B6478] uppercase ml-1">Jumlah Bayar *</Label>
                <InputRupiah 
                  value={amount}
                  onChange={setAmount}
                />
              </div>

              <div className="space-y-2 text-left">
                <Label className="text-[11px] font-bold text-[#4B6478] uppercase ml-1">Metode Bayar *</Label>
                <Select value={method} onValueChange={(val) => setMethod(val)}>
                  <SelectTrigger className="h-12 bg-[#111C24] border-white/5 rounded-xl font-bold uppercase">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent className="bg-[#0C1319] border-white/10 uppercase">
                    <SelectItem value="transfer" className="font-bold cursor-pointer">Transfer Bank</SelectItem>
                    <SelectItem value="cash" className="font-bold cursor-pointer">Tunai (Cash)</SelectItem>
                    <SelectItem value="giro" className="font-bold cursor-pointer">Giro / Cek</SelectItem>
                    <SelectItem value="qris" className="font-bold cursor-pointer">QRIS</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>
          </div>

          <div className="pt-2">
            <Button
              type="submit"
              disabled={isLoading}
              className="w-full h-14 bg-[#10B981] hover:bg-emerald-600 text-[#0C1319] font-black text-xs uppercase tracking-widest rounded-xl shadow-lg"
            >
              {isLoading ? <Loader2 size={16} className="animate-spin" /> : 'KONFIRMASI PEMBAYARAN'}
            </Button>
          </div>
        </form>
      </SheetContent>
    </Sheet>
  )
}
