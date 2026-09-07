import React, { useState, useEffect } from 'react'
import {
  Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter
} from '@/components/ui/dialog'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { DatePicker } from '@/components/ui/DatePicker'
import {
  Select,
  SelectTrigger,
  SelectValue,
  SelectContent,
  SelectItem,
} from '@/components/ui/select'
import { formatIDR } from '@/lib/format'
import { DollarSign, CheckCircle2, Factory } from 'lucide-react'
import { usePayPurchaseInvoice } from '@/lib/hooks/useSembakoData'
import { toast } from 'sonner'

export function SembakoPayPurchaseDebtModal({ isOpen, onClose, invoice }) {
  const payMutation = usePayPurchaseInvoice()

  const [amount, setAmount] = useState('')
  const [paymentDate, setPaymentDate] = useState(new Date().toISOString().slice(0, 10))
  const [paymentMethod, setPaymentMethod] = useState('Transfer Bank BCA')
  const [notes, setNotes] = useState('')

  useEffect(() => {
    if (invoice && isOpen) {
      setAmount(String(invoice.remaining_debt || ''))
      setPaymentDate(new Date().toISOString().slice(0, 10))
      setPaymentMethod('Transfer Bank BCA')
      setNotes(`Pelunasan sisa tagihan faktur ${invoice.invoice_number}`)
    }
  }, [invoice, isOpen])

  const handleSubmit = async (e) => {
    e.preventDefault()
    const numAmount = parseFloat(String(amount).replace(/\D/g, '')) || 0
    if (numAmount <= 0) {
      toast.error('Nominal pembayaran harus lebih dari Rp 0!')
      return
    }

    try {
      await payMutation.mutateAsync({
        invoice_number: invoice.invoice_number,
        supplier_id: invoice.supplier_id,
        amount: numAmount,
        payment_date: paymentDate,
        payment_method: paymentMethod,
        notes: notes.trim(),
      })
      onClose()
    } catch (_err) {
      // Handled in mutation toast
    }
  }

  if (!isOpen || !invoice) return null

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-md bg-white text-slate-900 border border-slate-200 rounded-2xl p-6 shadow-2xl">
        <DialogHeader className="pb-3 border-b border-slate-100">
          <div className="flex items-center gap-2 text-[#0EA5E9] font-black text-xs uppercase tracking-wider mb-1">
            <Factory size={15} />
            <span>Pelunasan Hutang Pabrik</span>
          </div>
          <DialogTitle className="text-lg font-black text-slate-900">
            Bayar Tagihan Faktur {invoice.invoice_number}
          </DialogTitle>
          <DialogDescription className="text-xs text-slate-500">
            Penerbit Tagihan: <strong className="text-slate-700">{invoice.supplier_name}</strong>
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-4 pt-2 text-xs">
          <div className="bg-rose-50 border border-rose-200 rounded-xl p-3 flex justify-between items-center">
            <span className="font-bold text-rose-800">Sisa Hutang Saat Ini:</span>
            <span className="font-mono font-black text-base text-rose-900">
              {formatIDR(invoice.remaining_debt)}
            </span>
          </div>

          <div>
            <label className="block text-[11px] font-bold text-slate-700 uppercase tracking-wider mb-1">
              Nominal yang Dibayarkan (Rp) *
            </label>
            <div className="relative">
              <span className="absolute left-3 top-1/2 -translate-y-1/2 text-xs font-bold text-slate-400 select-none pointer-events-none">
                Rp
              </span>
              <Input
                type="text"
                inputMode="numeric"
                value={amount ? Number(String(amount).replace(/\D/g, '')).toLocaleString('id-ID') : ''}
                onChange={(e) => setAmount(e.target.value.replace(/\D/g, ''))}
                placeholder="0"
                className="h-11 pl-9 text-xs font-mono font-bold bg-white text-slate-900 border-slate-300 focus:border-[#0EA5E9] focus:ring-2 focus:ring-[#0EA5E9]/20 transition-all"
              />
            </div>
          </div>

          <div>
            <label className="block text-[11px] font-bold text-slate-700 uppercase tracking-wider mb-1">
              Metode Pembayaran / Rekening
            </label>
            <Select value={paymentMethod} onValueChange={setPaymentMethod}>
              <SelectTrigger className="h-11 bg-white border-slate-300 font-bold text-xs text-slate-900">
                <SelectValue placeholder="Pilih rekening / metode pembayaran" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="Transfer Bank BCA">
                  <div className="flex items-center gap-2">
                    <span className="text-blue-600 font-bold">💳</span>
                    <span>Transfer Rekening Bank BCA</span>
                  </div>
                </SelectItem>
                <SelectItem value="Transfer Bank Mandiri / BRI">
                  <div className="flex items-center gap-2">
                    <span className="text-indigo-600 font-bold">🏦</span>
                    <span>Transfer Bank Mandiri / BRI</span>
                  </div>
                </SelectItem>
                <SelectItem value="Kas Operasional Juragan">
                  <div className="flex items-center gap-2">
                    <span className="text-amber-600 font-bold">💵</span>
                    <span>Kas Operasional Juragan (Cash Toko)</span>
                  </div>
                </SelectItem>
                <SelectItem value="Dana Pribadi Owner (Sdr. Fahru)">
                  <div className="flex items-center gap-2">
                    <span className="text-emerald-600 font-bold">👤</span>
                    <span>Dana Pribadi Owner (Sdr. Fahru)</span>
                  </div>
                </SelectItem>
                <SelectItem value="Tunai">
                  <div className="flex items-center gap-2">
                    <span className="text-slate-600 font-bold">🤝</span>
                    <span>Tunai / Cash</span>
                  </div>
                </SelectItem>
              </SelectContent>
            </Select>
          </div>

          <div>
            <label className="block text-[11px] font-bold text-slate-700 uppercase tracking-wider mb-1">
              Tanggal Pembayaran
            </label>
            <DatePicker
              value={paymentDate}
              onChange={setPaymentDate}
              placeholder="Pilih tanggal pembayaran"
              className="h-11 bg-white border-slate-300"
            />
          </div>

          <DialogFooter className="pt-3 border-t border-slate-100 flex items-center justify-end gap-2">
            <Button
              type="button"
              variant="outline"
              onClick={onClose}
              className="h-10 px-4 rounded-xl font-bold text-xs"
            >
              Batal
            </Button>
            <Button
              type="submit"
              disabled={payMutation.isPending}
              className="h-10 px-5 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white font-black text-xs gap-1.5 cursor-pointer shadow-md shadow-emerald-600/20"
            >
              <CheckCircle2 size={14} />
              <span>{payMutation.isPending ? 'Memproses...' : 'Simpan Pembayaran'}</span>
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  )
}
