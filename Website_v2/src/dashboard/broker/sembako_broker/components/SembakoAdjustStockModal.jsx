import React, { useState, useEffect } from 'react'
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter
} from '@/components/ui/dialog'
import { useUpdateSembakoRawMaterial } from '@/lib/hooks/useSembakoData'
import { recordAuditLog } from '@/lib/hooks/useSembakoAudit'
import { recordInventoryMutation } from '@/lib/hooks/sembako/sembakoMutations'
import { useAuth } from '@/lib/hooks/useAuth'
import { formatIDR } from '@/lib/format'
import { SlidersHorizontal, ArrowRight, ShieldCheck, CheckCircle2, AlertCircle, Package } from 'lucide-react'
import { toast } from 'sonner'

export function SembakoAdjustStockModal({ open, onOpenChange, material, onClose }) {
  const { profile } = useAuth()
  const updateMutation = useUpdateSembakoRawMaterial()

  const [newStock, setNewStock] = useState('')
  const [reason, setReason] = useState('')

  const currentStock = parseFloat(material?.current_stock) || 0
  const unit = material?.unit || 'pcs'
  const unitCost = parseFloat(material?.unit_cost) || 0

  useEffect(() => {
    if (material && open) {
      setNewStock(material.current_stock !== undefined && material.current_stock !== null ? String(material.current_stock) : '0')
      setReason('')
    }
  }, [material, open])

  const handleClose = () => {
    if (onClose) onClose()
    if (onOpenChange) onOpenChange(false)
  }

  const nNewStock = parseFloat(newStock)
  const isInvalid = isNaN(nNewStock) || nNewStock < 0
  const diff = !isInvalid ? (nNewStock - currentStock) : 0
  const isSame = diff === 0
  const isValid = !isInvalid

  const handleQuickAdjust = (delta) => {
    const base = isValid ? nNewStock : currentStock
    const nextVal = Math.max(0, parseFloat((base + delta).toFixed(3)))
    setNewStock(String(nextVal))
  }

  const handleSubmit = async (e) => {
    e.preventDefault()
    if (isInvalid || isSame) return

    const payload = {
      id: material.id,
      current_stock: nNewStock,
    }

    if (reason.trim()) {
      const stamp = new Date().toLocaleDateString('id-ID', { day: 'numeric', month: 'short' })
      const noteEntry = `[Opname ${stamp}: ${diff >= 0 ? '+' : ''}${diff} ${unit} - ${reason.trim()}]`
      payload.notes = material.notes ? `${material.notes} | ${noteEntry}` : noteEntry
    }

    try {
      await updateMutation.mutateAsync(payload)

      // 1. Record persistent inventory mutation in database
      recordInventoryMutation({
        material_id: material.id,
        material_name: material.material_name,
        material_category: material.category,
        mutation_type: 'ADJUST',
        action_type: 'OPNAME',
        quantity: diff,
        unit,
        unit_cost: unitCost,
        total_cost: Math.abs(diff) * unitCost,
        prev_stock: currentStock,
        new_stock: nNewStock,
        ref_type: 'opname',
        notes: reason.trim() || 'Penyesuaian stok opname fisik',
        created_by: profile?.full_name || profile?.email || 'Admin',
      }).catch(() => {})

      // 2. Record audit log
      try {
        recordAuditLog({
          action_type: 'ADJUST_BAHAN',
          product_name: material.material_name,
          old_value: `${currentStock} ${unit}`,
          new_value: `${nNewStock} ${unit} (${diff >= 0 ? '+' : ''}${diff} ${unit})`,
          notes: JSON.stringify({
            prev_stock: currentStock,
            new_stock: nNewStock,
            delta_qty: diff,
            unit,
            unit_cost: unitCost,
            reason: reason.trim() || 'Penyesuaian stok opname fisik'
          }),
          profile
        })
      } catch { /* ignore audit failure */ }

      toast.success(`Stok ${material.material_name} berhasil disesuaikan menjadi ${nNewStock} ${unit}!`)
      handleClose()
    } catch {
      // Error handled by mutation
    }
  }

  const isSaving = updateMutation.isPending

  const quickReasonPresets = [
    '📦 Kemasan Rusak/Cacat',
    '🔍 Selisih Hitung Opname',
    '🎁 Sampel/Bonus Promosi',
    '🧅 Susut/Sortir Fisik'
  ]

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-md w-full bg-white text-slate-900 border border-slate-200 rounded-3xl p-0 overflow-hidden shadow-2xl max-h-[92vh] flex flex-col">
        <DialogHeader className="p-5 border-b border-slate-100 bg-slate-50/80 shrink-0">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-2xl bg-amber-100 text-amber-800 flex items-center justify-center font-bold border border-amber-200 shrink-0">
              <SlidersHorizontal size={20} />
            </div>
            <div>
              <DialogTitle className="text-base font-bold text-slate-900 font-['Sora']">
                Adjust Stok Fisik (Opname)
              </DialogTitle>
              <DialogDescription className="text-xs text-slate-500">
                Koreksi jumlah stok riil tanpa mengubah harga beli / HPP satuan.
              </DialogDescription>
            </div>
          </div>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="flex-1 overflow-y-auto p-5 space-y-4 text-xs">
          {/* Target Material Card */}
          <div className="p-3.5 rounded-2xl bg-slate-50 border border-slate-200 space-y-2">
            <div className="flex items-center justify-between">
              <span className="text-[10px] font-black uppercase tracking-wider text-slate-400">
                {material?.category?.replace('_', ' ') || 'ITEM'}
              </span>
              <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-emerald-100 text-emerald-800 flex items-center gap-1">
                <ShieldCheck size={12} /> HPP Terkunci: {formatIDR(unitCost)}/{unit}
              </span>
            </div>
            <div className="flex items-center justify-between">
              <p className="font-bold text-sm text-slate-900 font-['Sora']">
                {material?.material_name}
              </p>
              <div className="text-right">
                <span className="text-[10px] text-slate-500 block">Stok Sistem Saat Ini:</span>
                <span className="font-extrabold text-sm text-slate-800 font-mono">
                  {currentStock} {unit}
                </span>
              </div>
            </div>
          </div>

          {/* Main Stock Input */}
          <div className="space-y-1.5">
            <label className="text-[11px] font-black text-slate-700 uppercase tracking-wider block">
              Stok Fisik Hasil Opname Nyata ({unit}) <span className="text-rose-500">*</span>
            </label>
            <div className="relative">
              <input
                type="text"
                inputMode="decimal"
                required
                autoFocus
                placeholder={`Misal: ${currentStock}`}
                value={newStock}
                onChange={(e) => {
                  const val = e.target.value.replace(/[^0-9.]/g, '')
                  setNewStock(val)
                }}
                className="w-full px-4 py-3 rounded-2xl bg-amber-500/[0.06] border-2 border-amber-400 text-slate-950 text-lg font-black text-center focus:bg-white focus:border-amber-600 focus:outline-none transition shadow-inner font-mono"
              />
            </div>

            {/* Quick Adjustment Stepper Buttons */}
            <div className="flex items-center justify-center gap-1.5 pt-1">
              {[-10, -5, -1, 1, 5, 10].map((delta) => (
                <button
                  key={delta}
                  type="button"
                  onClick={() => handleQuickAdjust(delta)}
                  className={`px-2.5 py-1 rounded-lg text-[10.5px] font-bold border transition cursor-pointer active:scale-95 ${
                    delta < 0
                      ? 'bg-rose-50 hover:bg-rose-100 text-rose-700 border-rose-200'
                      : 'bg-emerald-50 hover:bg-emerald-100 text-emerald-700 border-emerald-200'
                  }`}
                >
                  {delta > 0 ? `+${delta}` : delta}
                </button>
              ))}
            </div>
          </div>

          {/* Live Difference Indicator */}
          {isValid && (
            <div
              className={`p-3 rounded-xl border flex items-center justify-between text-xs font-semibold ${
                diff === 0
                  ? 'bg-slate-100 border-slate-200 text-slate-600'
                  : diff < 0
                  ? 'bg-rose-50 border-rose-200 text-rose-800'
                  : 'bg-emerald-50 border-emerald-200 text-emerald-800'
              }`}
            >
              <div className="flex items-center gap-2">
                {diff === 0 ? (
                  <Package size={16} />
                ) : diff < 0 ? (
                  <AlertCircle size={16} className="text-rose-600" />
                ) : (
                  <CheckCircle2 size={16} className="text-emerald-600" />
                )}
                <span>
                  {diff === 0
                    ? 'Tidak ada selisih'
                    : diff < 0
                    ? `Stok berkurang ${Math.abs(diff)} ${unit}`
                    : `Stok bertambah +${diff} ${unit}`}
                </span>
              </div>
              <div className="flex items-center gap-1.5 font-mono text-xs">
                <span>{currentStock}</span>
                <ArrowRight size={12} className="text-slate-400" />
                <span className="font-extrabold">{nNewStock} {unit}</span>
              </div>
            </div>
          )}

          {/* Alasan / Catatan Penyesuaian */}
          <div className="space-y-1.5 pt-1">
            <label className="text-[10px] font-black text-slate-600 uppercase tracking-wider block">
              Alasan Penyesuaian (Opsional)
            </label>
            <input
              type="text"
              placeholder="Contoh: Kemasan sobek / selisih hitung fisik gudang"
              value={reason}
              onChange={(e) => setReason(e.target.value)}
              className="w-full px-3 py-2.5 rounded-xl bg-slate-50 border border-slate-200 text-slate-900 text-xs focus:bg-white focus:border-amber-500 focus:outline-none"
            />
            {/* Quick Reason Chips */}
            <div className="flex items-center gap-1.5 flex-wrap pt-0.5">
              {quickReasonPresets.map((preset) => (
                <button
                  key={preset}
                  type="button"
                  onClick={() => setReason(preset)}
                  className={`text-[10px] px-2 py-0.5 rounded-lg border font-medium transition cursor-pointer ${
                    reason === preset
                      ? 'bg-amber-500 text-white border-amber-600'
                      : 'bg-white hover:bg-slate-100 text-slate-600 border-slate-200'
                  }`}
                >
                  {preset}
                </button>
              ))}
            </div>
          </div>

          <DialogFooter className="pt-3 pb-1 border-t border-slate-100 flex items-center justify-end gap-2 shrink-0 bg-white/95 backdrop-blur-sm sticky bottom-0 z-10 -mx-5 -mb-5 px-5 py-3">
            <button
              type="button"
              onClick={handleClose}
              className="px-4 py-2.5 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold text-xs cursor-pointer transition"
            >
              Batal
            </button>
            <button
              type="submit"
              disabled={isSaving || !isValid}
              className="px-5 py-2.5 rounded-xl bg-[#0F172A] hover:bg-slate-900 text-white font-bold text-xs flex items-center justify-center gap-2 shadow-lg shadow-slate-950/10 cursor-pointer disabled:opacity-50 transition"
            >
              {isSaving ? 'Menyimpan...' : `Simpan Stok (${isValid ? nNewStock : currentStock} ${unit})`}
            </button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  )
}

export default SembakoAdjustStockModal
