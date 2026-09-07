import React, { useState, useMemo, useEffect } from 'react'
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter
} from '@/components/ui/dialog'
import {
  useTransferStockCustody,
  useSembakoProducts,
  useSembakoEmployees,
  useSembakoStockCustody
} from '@/lib/hooks/useSembakoData'
import {
  Truck,
  ArrowRight,
  RotateCcw,
  UserCheck,
  Package,
  Plus,
  Minus,
  AlertTriangle,
  CheckCircle2,
  Building2
} from 'lucide-react'
import {
  Select,
  SelectTrigger,
  SelectValue,
  SelectContent,
  SelectItem,
} from '@/components/ui/select'
import { toast } from 'sonner'

const fmt = (n) => new Intl.NumberFormat('id-ID').format(Math.round(n || 0))

export function SembakoStockHandoverModal({
  open,
  onOpenChange,
  defaultMode = 'handover_to_staff',
  preselectedEmployeeId = null,
  preselectedProductId = null
}) {
  const { data: products = [] } = useSembakoProducts()
  const { data: employees = [] } = useSembakoEmployees()
  const { data: custodyList = [] } = useSembakoStockCustody()
  const transferMutation = useTransferStockCustody()

  const [mode, setMode] = useState(defaultMode) // 'handover_to_staff' | 'return_to_warehouse'
  const [employeeId, setEmployeeId] = useState(preselectedEmployeeId || '')
  const [productId, setProductId] = useState(preselectedProductId || '')
  const [quantity, setQuantity] = useState(5)
  const [notes, setNotes] = useState('')

  useEffect(() => {
    if (defaultMode) setMode(defaultMode)
    if (preselectedEmployeeId) setEmployeeId(preselectedEmployeeId)
    if (preselectedProductId) setProductId(preselectedProductId)
  }, [defaultMode, preselectedEmployeeId, preselectedProductId, open])

  // Pastikan ada default employee & product jika belum terpilih
  const activeEmployees = useMemo(() => {
    return employees.filter(e => !e.is_deleted && e.status !== 'nonaktif')
  }, [employees])

  const activeProducts = useMemo(() => {
    return products.filter(p => p.is_active && !p.is_deleted)
  }, [products])

  useEffect(() => {
    if (open) {
      if (!employeeId && activeEmployees.length > 0) {
        setEmployeeId(activeEmployees[0].id)
      }
      if (!productId && activeProducts.length > 0) {
        setProductId(activeProducts[0].id)
      }
    }
  }, [open, activeEmployees, activeProducts])

  const selectedEmployee = useMemo(() => {
    return activeEmployees.find(e => e.id === employeeId) || null
  }, [activeEmployees, employeeId])

  const selectedProduct = useMemo(() => {
    return activeProducts.find(p => p.id === productId) || null
  }, [activeProducts, productId])

  // Cari saldo stok saat ini di Gudang & di Pegawai
  const warehouseStock = useMemo(() => {
    if (!selectedProduct) return 0
    const row = custodyList.find(c => c.holder_type === 'warehouse' && c.product_id === selectedProduct.id)
    return row ? Number(row.quantity || 0) : Number(selectedProduct.current_stock || 0)
  }, [custodyList, selectedProduct])

  const employeeStock = useMemo(() => {
    if (!selectedProduct || !employeeId) return 0
    const row = custodyList.find(c => c.holder_type === 'employee' && c.employee_id === employeeId && c.product_id === selectedProduct.id)
    return row ? Number(row.quantity || 0) : 0
  }, [custodyList, selectedProduct, employeeId])

  const maxAvailable = mode === 'handover_to_staff' ? warehouseStock : employeeStock
  const isOverLimit = Number(quantity) > maxAvailable

  const handleTransfer = async () => {
    if (!selectedProduct || !selectedEmployee) {
      toast.error('Pilih produk dan pegawai terlebih dahulu!')
      return
    }
    const qtyNum = Number(quantity) || 0
    if (qtyNum <= 0) {
      toast.error('Masukkan jumlah yang valid lebih dari 0!')
      return
    }
    if (isOverLimit) {
      toast.error(
        mode === 'handover_to_staff'
          ? `Stok di Gudang Utama tidak mencukupi (tersedia: ${warehouseStock} ${selectedProduct.unit || 'pcs'})`
          : `Stok yang dibawa ${selectedEmployee.full_name} tidak mencukupi (hanya membawa: ${employeeStock} ${selectedProduct.unit || 'pcs'})`
      )
      return
    }

    try {
      await transferMutation.mutateAsync({
        transfer_type: mode,
        employee_id: selectedEmployee.id,
        employee_name: selectedEmployee.full_name,
        product_id: selectedProduct.id,
        product_name: selectedProduct.product_name,
        quantity: qtyNum,
        unit: selectedProduct.unit || 'pcs',
        notes: notes || (mode === 'handover_to_staff' ? `Bawa kanvas / antar ${selectedEmployee.full_name}` : `Sisa kembali ke gudang oleh ${selectedEmployee.full_name}`)
      })
      onOpenChange(false)
    } catch (err) {
      // toast handled by hook
    }
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-md max-h-[92vh] overflow-y-auto p-4 sm:p-6 bg-card border-border rounded-2xl">
        <DialogHeader>
          <div className="flex items-center gap-2.5">
            <div className={`w-10 h-10 rounded-xl flex items-center justify-center border ${
              mode === 'handover_to_staff' 
                ? 'bg-indigo-500/15 text-indigo-500 border-indigo-500/30' 
                : 'bg-emerald-500/15 text-emerald-500 border-emerald-500/30'
            }`}>
              {mode === 'handover_to_staff' ? <Truck size={20} /> : <RotateCcw size={20} />}
            </div>
            <div>
              <DialogTitle className="text-base sm:text-lg font-black text-foreground">
                {mode === 'handover_to_staff' ? 'Serah Terima: Bawa Stok ke Pegawai' : 'Pengembalian Sisa Stok ke Gudang'}
              </DialogTitle>
              <DialogDescription className="text-xs text-muted-foreground mt-0.5">
                {mode === 'handover_to_staff'
                  ? 'Keluarkan produk jadi dari Gudang untuk dibawa jualan oleh personil.'
                  : 'Tarik sisa produk yang belum terjual kembali ke Gudang Utama.'}
              </DialogDescription>
            </div>
          </div>
        </DialogHeader>

        {/* Tab Switcher Mode */}
        <div className="flex p-1 rounded-xl bg-muted/60 border border-border my-2">
          <button
            type="button"
            onClick={() => setMode('handover_to_staff')}
            className={`flex-1 py-1.5 px-2 rounded-lg text-xs font-bold transition flex items-center justify-center gap-1.5 ${
              mode === 'handover_to_staff'
                ? 'bg-card text-foreground shadow-xs'
                : 'text-muted-foreground hover:text-foreground'
            }`}
          >
            <Truck size={13} />
            <span>Bawa ke Pegawai</span>
          </button>
          <button
            type="button"
            onClick={() => setMode('return_to_warehouse')}
            className={`flex-1 py-1.5 px-2 rounded-lg text-xs font-bold transition flex items-center justify-center gap-1.5 ${
              mode === 'return_to_warehouse'
                ? 'bg-card text-foreground shadow-xs'
                : 'text-muted-foreground hover:text-foreground'
            }`}
          >
            <RotateCcw size={13} />
            <span>Kembalikan ke Gudang</span>
          </button>
        </div>

        <div className="space-y-3.5 my-2">
          {/* 1. Pilih Pegawai */}
          <div className="space-y-1">
            <label className="text-xs font-bold text-muted-foreground uppercase tracking-wider flex items-center gap-1">
              <UserCheck size={13} />
              Pegawai / Personil (Sales / Kurir)
            </label>
            <Select value={employeeId || ''} onValueChange={setEmployeeId}>
              <SelectTrigger className="h-11 rounded-xl bg-muted/50 border border-border text-foreground font-bold text-xs sm:text-sm">
                <SelectValue placeholder="Pilih Pegawai / Kurir..." />
              </SelectTrigger>
              <SelectContent>
                {activeEmployees.map(emp => (
                  <SelectItem key={emp.id} value={emp.id}>
                    <div className="flex items-center gap-2">
                      <UserCheck size={13} className="text-[#0EA5E9]" />
                      <span>{emp.full_name}</span>
                      {emp.role && <span className="text-[10px] text-muted-foreground">({emp.role})</span>}
                    </div>
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          {/* 2. Pilih Produk Jadi */}
          <div className="space-y-1">
            <label className="text-xs font-bold text-muted-foreground uppercase tracking-wider flex items-center gap-1">
              <Package size={13} />
              Produk Jadi yang Dipindahkan
            </label>
            <Select value={productId || ''} onValueChange={setProductId}>
              <SelectTrigger className="h-11 rounded-xl bg-muted/50 border border-border text-foreground font-bold text-xs sm:text-sm">
                <SelectValue placeholder="Pilih Produk Jadi..." />
              </SelectTrigger>
              <SelectContent>
                {activeProducts.map(p => (
                  <SelectItem key={p.id} value={p.id}>
                    <div className="flex items-center gap-2">
                      <Package size={13} className="text-amber-500" />
                      <span>{p.product_name}</span>
                    </div>
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          {/* Status Saldo Lokasi Asal & Tujuan */}
          <div className="grid grid-cols-2 gap-2 p-3 rounded-xl bg-muted/30 border border-border text-xs">
            <div>
              <p className="text-[10px] text-muted-foreground flex items-center gap-1">
                <Building2 size={11} />
                Stok di Gudang Utama:
              </p>
              <p className="text-sm font-extrabold font-mono text-foreground mt-0.5">
                {fmt(warehouseStock)} {selectedProduct?.unit || 'pcs'}
              </p>
            </div>
            <div>
              <p className="text-[10px] text-muted-foreground flex items-center gap-1">
                <UserCheck size={11} />
                Sedang Dibawa {selectedEmployee?.full_name || 'Pegawai'}:
              </p>
              <p className="text-sm font-extrabold font-mono text-indigo-600 dark:text-indigo-400 mt-0.5">
                {fmt(employeeStock)} {selectedProduct?.unit || 'pcs'}
              </p>
            </div>
          </div>

          {/* 3. Masukkan Jumlah / Qty */}
          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <label className="text-xs font-bold text-muted-foreground uppercase tracking-wider">
                Jumlah {mode === 'handover_to_staff' ? 'Diserahkan' : 'Dikembalikan'}
              </label>
              <span className="text-[11px] text-muted-foreground">
                Tersedia untuk dipindah: <strong>{fmt(maxAvailable)}</strong> {selectedProduct?.unit || 'pcs'}
              </span>
            </div>

            <div className="flex items-center gap-3">
              <button
                type="button"
                onClick={() => setQuantity(prev => Math.max(1, (Number(prev) || 1) - 1))}
                className="w-11 h-11 rounded-xl bg-muted hover:bg-muted/80 text-foreground flex items-center justify-center font-bold text-lg transition"
              >
                <Minus size={18} />
              </button>

              <div className="relative flex-1">
                <input
                  type="number"
                  min="1"
                  max={maxAvailable}
                  value={quantity}
                  onChange={(e) => setQuantity(e.target.value)}
                  className={`w-full h-11 px-4 rounded-xl bg-muted/40 border font-mono font-black text-center text-lg outline-none transition ${
                    isOverLimit ? 'border-rose-500 text-rose-500' : 'border-border text-foreground focus:border-indigo-500'
                  }`}
                />
                <span className="absolute right-3 top-1/2 -translate-y-1/2 text-xs font-bold text-muted-foreground pointer-events-none">
                  {selectedProduct?.unit || 'pcs'}
                </span>
              </div>

              <button
                type="button"
                onClick={() => setQuantity(prev => (Number(prev) || 0) + 1)}
                className="w-11 h-11 rounded-xl bg-muted hover:bg-muted/80 text-foreground flex items-center justify-center font-bold text-lg transition"
              >
                <Plus size={18} />
              </button>
            </div>

            {isOverLimit && (
              <p className="text-[11px] font-semibold text-rose-500 flex items-center gap-1">
                <AlertTriangle size={12} />
                Jumlah melebihi stok yang tersedia ({fmt(maxAvailable)} {selectedProduct?.unit || 'pcs'}).
              </p>
            )}
          </div>

          {/* 4. Catatan */}
          <div className="space-y-1">
            <label className="text-xs font-bold text-muted-foreground uppercase tracking-wider">
              Catatan / Keperluan
            </label>
            <input
              type="text"
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              placeholder={mode === 'handover_to_staff' ? 'e.g. Bawa kanvas Solo Baru / Rute Restoran' : 'e.g. Sisa jualan hari ini'}
              className="w-full h-10 px-3 rounded-xl bg-muted/40 border border-border text-foreground text-xs font-medium outline-none focus:border-indigo-500 transition"
            />
          </div>
        </div>

        <DialogFooter className="gap-2 sm:gap-0 mt-2">
          <button
            type="button"
            onClick={() => onOpenChange(false)}
            className="w-full sm:w-auto px-4 py-2.5 rounded-xl border border-border text-muted-foreground hover:bg-muted font-bold text-xs transition"
          >
            Batal
          </button>
          <button
            type="button"
            disabled={isOverLimit || maxAvailable <= 0 || transferMutation.isPending}
            onClick={handleTransfer}
            className={`w-full sm:w-auto px-5 py-2.5 rounded-xl font-extrabold text-xs text-white flex items-center justify-center gap-2 shadow-md transition-all ${
              isOverLimit || maxAvailable <= 0 || transferMutation.isPending
                ? 'bg-slate-400 cursor-not-allowed opacity-50'
                : mode === 'handover_to_staff'
                ? 'bg-indigo-600 hover:bg-indigo-500 active:scale-98 cursor-pointer shadow-indigo-500/20'
                : 'bg-emerald-600 hover:bg-emerald-500 active:scale-98 cursor-pointer shadow-emerald-500/20'
            }`}
          >
            {transferMutation.isPending ? (
              <>Memproses Perpindahan...</>
            ) : mode === 'handover_to_staff' ? (
              <>
                <Truck size={15} />
                <span>SERAHKAN {fmt(quantity || 0)} {selectedProduct?.unit || 'pcs'} KE {selectedEmployee?.full_name?.toUpperCase() || 'STAF'}</span>
              </>
            ) : (
              <>
                <RotateCcw size={15} />
                <span>KEMBALIKAN {fmt(quantity || 0)} {selectedProduct?.unit || 'pcs'} KE GUDANG</span>
              </>
            )}
          </button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
