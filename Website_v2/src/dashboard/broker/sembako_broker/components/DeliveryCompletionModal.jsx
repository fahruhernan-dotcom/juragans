import React, { useState, useEffect } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { CheckCircle2, Truck, Fuel, Utensils, Coffee, CircleParking, Package, AlertCircle, Loader2 } from 'lucide-react'
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from '@/components/ui/dialog'
import { Sheet, SheetContent, SheetHeader, SheetTitle, SheetDescription } from '@/components/ui/sheet'
import { useMediaQuery } from '@/lib/hooks/useMediaQuery'
import { InputRupiah, C, sLabel } from './sembakoSaleUtils'
import { useCompleteDeliveryWithCost } from '@/lib/hooks/useSembakoData'
import { formatIDR } from '@/lib/format'

const PRESET_CATEGORIES = [
  { id: 'bensin', label: 'BBM / Bensin', icon: Fuel, color: '#3B82F6', bg: '#EFF6FF', border: '#BFDBFE' },
  { id: 'makan', label: 'Uang Makan / Konsumsi', icon: Coffee, color: '#F59E0B', bg: '#FFFBEB', border: '#FDE68A' },
  { id: 'parkir_tol', label: 'Tol / Parkir', icon: CircleParking, color: '#8B5CF6', bg: '#F5F3FF', border: '#DDD6FE' },
  { id: 'bongkar', label: 'Bongkar Muat', icon: Package, color: '#EC4899', bg: '#FDF2F8', border: '#FBCFE8' },
]

export function DeliveryCompletionModal({ isOpen, onClose, sale, delivery }) {
  const isDesktop = useMediaQuery('(min-width: 768px)')
  const completeMutation = useCompleteDeliveryWithCost()

  const [hasCost, setHasCost] = useState(false)
  const [extraCost, setExtraCost] = useState(0)
  const [selectedChips, setSelectedChips] = useState([])
  const [costNotes, setCostNotes] = useState('')

  useEffect(() => {
    if (isOpen) {
      setHasCost(false)
      setExtraCost(0)
      setSelectedChips([])
      setCostNotes('')
    }
  }, [isOpen])

  if (!sale) return null

  const customerName = sale.sembako_customers?.customer_name || sale.customer_name || 'Umum'
  const driverName = delivery?.driver_name || sale.driver_name || 'Sopir / Kurir'

  const handleToggleChip = (chip) => {
    const isSelected = selectedChips.includes(chip.label)
    let newChips
    if (isSelected) {
      newChips = selectedChips.filter(c => c !== chip.label)
    } else {
      newChips = [...selectedChips, chip.label]
    }
    setSelectedChips(newChips)
    
    // Auto-update notes if empty or matches previous chips
    if (newChips.length > 0) {
      setCostNotes(newChips.join(', '))
    }
  }

  const handleConfirm = async () => {
    try {
      await completeMutation.mutateAsync({
        saleId: sale.id,
        deliveryId: delivery?.id,
        extraCost: hasCost ? Number(extraCost) || 0 : 0,
        costNotes: hasCost ? costNotes.trim() : '',
        driverName: driverName,
      })
      onClose()
    } catch {
      // Handled by hook toast
    }
  }

  const content = (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 16, padding: isDesktop ? '10px 0 0' : '10px 0 24px' }}>
      {/* Header Context Card */}
      <div style={{ background: '#F8FAFC', border: `1px solid ${C.border}`, borderRadius: 14, padding: '12px 14px', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
          <div style={{ width: 38, height: 38, borderRadius: 10, background: '#E2E8F0', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
            <Truck size={20} color="#0F172A" />
          </div>
          <div>
            <p style={{ fontSize: 13, fontWeight: 800, color: '#0F172A', fontFamily: 'DM Sans' }}>{sale.invoice_number}</p>
            <p style={{ fontSize: 11, color: '#64748B', fontWeight: 600 }}>{customerName} • {driverName}</p>
          </div>
        </div>
        <div style={{ textAlign: 'right' }}>
          <span style={{ fontSize: 10, fontWeight: 700, color: '#64748B', textTransform: 'uppercase', letterSpacing: '0.05em' }}>Nilai Nota</span>
          <p style={{ fontSize: 13, fontWeight: 800, color: '#0F172A', fontFamily: 'Sora' }}>{formatIDR(sale.total_amount)}</p>
        </div>
      </div>

      {/* Choice: Ada Biaya Tambahan? */}
      <div>
        <p style={{ ...sLabel, marginBottom: 8 }}>Apakah ada biaya tambahan operasional / pengeluaran sopir?</p>
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10 }}>
          <button
            type="button"
            onClick={() => {
              setHasCost(false)
              setExtraCost(0)
            }}
            style={{
              padding: '12px 14px',
              borderRadius: 12,
              border: `2px solid ${!hasCost ? '#10B981' : '#E2E8F0'}`,
              background: !hasCost ? '#F0FDF4' : '#FFFFFF',
              color: !hasCost ? '#15803D' : '#64748B',
              fontWeight: 800,
              fontSize: 12,
              fontFamily: 'DM Sans',
              cursor: 'pointer',
              display: 'flex',
              flexDirection: 'column',
              alignItems: 'center',
              gap: 4,
              transition: 'all 0.2s',
            }}
          >
            <span style={{ fontSize: 16 }}>🟢</span>
            <span>Tidak Ada (Rp 0)</span>
            <span style={{ fontSize: 10, opacity: 0.8, fontWeight: 600 }}>Langsung Terkirim</span>
          </button>

          <button
            type="button"
            onClick={() => setHasCost(true)}
            style={{
              padding: '12px 14px',
              borderRadius: 12,
              border: `2px solid ${hasCost ? '#F59E0B' : '#E2E8F0'}`,
              background: hasCost ? '#FFFBEB' : '#FFFFFF',
              color: hasCost ? '#B45309' : '#64748B',
              fontWeight: 800,
              fontSize: 12,
              fontFamily: 'DM Sans',
              cursor: 'pointer',
              display: 'flex',
              flexDirection: 'column',
              alignItems: 'center',
              gap: 4,
              transition: 'all 0.2s',
            }}
          >
            <span style={{ fontSize: 16 }}>⛽</span>
            <span>Ada Pengeluaran</span>
            <span style={{ fontSize: 10, opacity: 0.8, fontWeight: 600 }}>BBM / Makan / Tol</span>
          </button>
        </div>
      </div>

      {/* Extra Cost Form if hasCost is true */}
      <AnimatePresence>
        {hasCost && (
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: 'auto' }}
            exit={{ opacity: 0, height: 0 }}
            style={{ display: 'flex', flexDirection: 'column', gap: 12, overflow: 'hidden' }}
          >
            {/* Quick Category Chips */}
            <div>
              <p style={{ ...sLabel, marginBottom: 6 }}>Kategori Pengeluaran (Pilih Cepat)</p>
              <div style={{ display: 'flex', flexWrap: 'wrap', gap: 6 }}>
                {PRESET_CATEGORIES.map(cat => {
                  const Icon = cat.icon
                  const active = selectedChips.includes(cat.label)
                  return (
                    <button
                      key={cat.id}
                      type="button"
                      onClick={() => handleToggleChip(cat)}
                      style={{
                        padding: '6px 12px',
                        borderRadius: 20,
                        border: `1px solid ${active ? cat.color : '#E2E8F0'}`,
                        background: active ? cat.bg : '#F8FAFC',
                        color: active ? cat.color : '#475569',
                        fontSize: 11,
                        fontWeight: 700,
                        fontFamily: 'DM Sans',
                        cursor: 'pointer',
                        display: 'flex',
                        alignItems: 'center',
                        gap: 6,
                        transition: 'all 0.15s',
                      }}
                    >
                      <Icon size={13} color={active ? cat.color : '#64748B'} />
                      <span>{cat.label}</span>
                    </button>
                  )
                })}
              </div>
            </div>

            {/* Nominal Biaya Tambahan */}
            <div>
              <p style={sLabel}>Total Biaya Tambahan (Rp) *</p>
              <InputRupiah
                value={extraCost}
                onChange={setExtraCost}
                placeholder="Rp 0"
              />
            </div>

            {/* Catatan / Keterangan */}
            <div>
              <p style={sLabel}>Rincian / Keterangan</p>
              <input
                type="text"
                value={costNotes}
                onChange={e => setCostNotes(e.target.value)}
                placeholder="Contoh: Isi bensin pertalite 50rb + tol 20rb"
                style={{
                  width: '100%',
                  background: '#FFFFFF',
                  border: '1px solid #CBD5E1',
                  borderRadius: 12,
                  padding: '10px 14px',
                  fontSize: 13,
                  fontFamily: 'DM Sans',
                  color: '#0F172A',
                  outline: 'none',
                }}
              />
            </div>

            {/* Live Profit Impact Indicator */}
            {extraCost > 0 && (
              <div style={{ background: '#FFFBEB', border: '1px solid #FEF3C7', borderRadius: 10, padding: '10px 12px', display: 'flex', alignItems: 'flex-start', gap: 8 }}>
                <AlertCircle size={15} color="#D97706" style={{ flexShrink: 0, marginTop: 1 }} />
                <p style={{ fontSize: 11, color: '#B45309', fontWeight: 600, fontFamily: 'DM Sans', margin: 0, lineHeight: 1.4 }}>
                  Biaya <strong>{formatIDR(extraCost)}</strong> akan dicatat ke pengeluaran operasional nota ini dan otomatis memotong laba bersih transaksi.
                </p>
              </div>
            )}
          </motion.div>
        )}
      </AnimatePresence>

      {/* Action Buttons */}
      <div style={{ display: 'flex', gap: 10, marginTop: 6, paddingTop: 10, borderTop: `1px solid ${C.border}` }}>
        <button
          type="button"
          onClick={onClose}
          disabled={completeMutation.isPending}
          style={{
            flex: 1,
            padding: '12px',
            borderRadius: 12,
            border: '1px solid #E2E8F0',
            background: '#F8FAFC',
            color: '#64748B',
            fontWeight: 700,
            fontSize: 13,
            cursor: 'pointer',
          }}
        >
          Batal
        </button>
        <button
          type="button"
          onClick={handleConfirm}
          disabled={completeMutation.isPending || (hasCost && (!extraCost || extraCost <= 0))}
          style={{
            flex: 2,
            padding: '12px',
            borderRadius: 12,
            border: 'none',
            background: '#10B981',
            color: '#06090F',
            fontWeight: 900,
            fontSize: 13,
            cursor: (completeMutation.isPending || (hasCost && (!extraCost || extraCost <= 0))) ? 'not-allowed' : 'pointer',
            opacity: (completeMutation.isPending || (hasCost && (!extraCost || extraCost <= 0))) ? 0.6 : 1,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            gap: 8,
          }}
        >
          {completeMutation.isPending ? (
            <>
              <Loader2 size={16} className="animate-spin" />
              <span>Menyimpan...</span>
            </>
          ) : (
            <>
              <CheckCircle2 size={16} />
              <span>Konfirmasi & Selesai</span>
            </>
          )}
        </button>
      </div>
    </div>
  )

  if (isDesktop) {
    return (
      <Dialog open={isOpen} onOpenChange={open => !open && onClose()}>
        <DialogContent style={{ maxWidth: 460, borderRadius: 20, background: '#FFFFFF', padding: 24 }}>
          <DialogHeader>
            <DialogTitle style={{ fontSize: 18, fontWeight: 900, color: '#0F172A', fontFamily: 'DM Sans' }}>
              Konfirmasi Pesanan Terkirim
            </DialogTitle>
            <DialogDescription style={{ fontSize: 12, color: '#64748B' }}>
              Pastikan status pengiriman dan pencatatan biaya operasional sopir di lapangan.
            </DialogDescription>
          </DialogHeader>
          {content}
        </DialogContent>
      </Dialog>
    )
  }

  return (
    <Sheet open={isOpen} onOpenChange={open => !open && onClose()}>
      <SheetContent side="bottom" style={{ borderTopLeftRadius: 24, borderTopRightRadius: 24, background: '#FFFFFF', maxHeight: '90vh', overflowY: 'auto', padding: '24px 20px 32px' }}>
        <SheetHeader style={{ textAlign: 'left', marginBottom: 6 }}>
          <SheetTitle style={{ fontSize: 17, fontWeight: 900, color: '#0F172A', fontFamily: 'DM Sans' }}>
            Konfirmasi Pesanan Terkirim
          </SheetTitle>
          <SheetDescription style={{ fontSize: 11, color: '#64748B' }}>
            Pastikan status pengiriman dan pencatatan biaya operasional sopir di lapangan.
          </SheetDescription>
        </SheetHeader>
        {content}
      </SheetContent>
    </Sheet>
  )
}
