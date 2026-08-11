import React, { useState } from 'react'
import { AnimatePresence, motion } from 'framer-motion'
import { useQueryClient } from '@tanstack/react-query'
import { X, ChevronLeft, Check, Loader2, Clock } from 'lucide-react'
import { supabase } from '@/lib/supabase'
import { useAuth } from '@/lib/hooks/useAuth'
import { useMediaQuery } from '@/lib/hooks/useMediaQuery'
import { toast } from 'sonner'
import { Sheet, SheetContent, SheetHeader, SheetTitle, SheetDescription } from '@/components/ui/sheet'
import { Button } from '@/components/ui/button'
import { logError } from '@/lib/logger/errorLogger'
import { logSupabaseError } from '@/lib/logger/supabaseLogger'
import WizardStepBeli from './wizard/WizardStepBeli'
import WizardStepJual from './wizard/WizardStepJual'
import WizardStepOrder from './wizard/WizardStepOrder'
import WizardStepPengiriman from './wizard/WizardStepPengiriman'
import TransaksiSuccessCard from '@/components/ui/TransaksiSuccessCard'

// ─── Progress Indicator ──────────────────────────────────────────────────────
function ProgressIndicator({ currentStep, steps }) {
  return (
    <div style={{ display: 'flex', alignItems: 'flex-start', gap: 0, margin: '0 20px 20px', paddingTop: 16, borderTop: '1px solid hsl(var(--border))' }}>
      {steps.map((label, i) => {
        const done = i < currentStep
        const active = i === currentStep
        return (
          <React.Fragment key={i}>
            <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', minWidth: 0 }}>
              <div style={{
                width: 28, height: 28, borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0,
                background: done ? '#10B981' : active ? 'rgba(16, 185, 129, 0.15)' : 'rgba(255,255,255,0.05)',
                border: done ? 'none' : active ? '2px solid #10B981' : '2px solid hsl(var(--border))',
              }}>
                {done
                  ? <Check size={13} color="white" strokeWidth={3} />
                  : <span style={{ fontSize: 12, fontWeight: 700, color: active ? '#10B981' : 'hsl(var(--muted-foreground))', fontFamily: 'Sora' }}>{i + 1}</span>
                }
              </div>
              <span style={{ fontSize: 10, color: done ? '#10B981' : active ? '#10B981' : 'hsl(var(--muted-foreground))', textAlign: 'center', marginTop: 4, whiteSpace: 'nowrap', padding: '0 2px' }}>{label}</span>
            </div>
            {i < steps.length - 1 && (
              <div style={{ flex: 1, height: 1, marginTop: 14, background: i < currentStep ? '#10B981' : 'hsl(var(--border))' }} />
            )}
          </React.Fragment>
        )
      })}
    </div>
  )
}

// ─── Step 0 — Mode Selection ─────────────────────────────────────────────────
function Step0ModeSelect({ onSelect }) {
  const [selected, setSelected] = useState(null)
  const isDesktop = useMediaQuery('(min-width: 1024px)')
  const pad = isDesktop ? '16px' : '12px'
  const emojiSize = isDesktop ? 22 : 18
  const titleSize = isDesktop ? 14 : 13
  const subSize = isDesktop ? 12 : 11

  return (
    <div className={isDesktop ? "space-y-6 px-5 pb-8" : "space-y-4 px-4 pb-6"}>
      <div>
        <p className={isDesktop ? "text-[13px] text-muted-foreground font-medium mb-4" : "text-[12px] text-muted-foreground font-medium mb-3"}>Bagaimana transaksi ini dimulai?</p>
        <div className="space-y-2.5">
          <button
            type="button"
            onClick={() => setSelected('buy_first')}
            style={{
              width: '100%', textAlign: 'left', padding: pad, borderRadius: 14,
              background: selected === 'buy_first' ? 'rgba(16, 185, 129, 0.08)' : 'rgba(16, 185, 129, 0.03)',
              border: selected === 'buy_first' ? '2px solid rgba(16, 185, 129, 0.40)' : '1px solid rgba(16, 185, 129, 0.15)',
              cursor: 'pointer', transition: 'all 0.2s'
            }}
          >
            <div className="flex items-center gap-2 mb-1">
              <span style={{ fontSize: emojiSize }}>🏚️ → 🤝 → 🏭</span>
            </div>
            <p style={{ fontSize: titleSize, fontWeight: 700, color: '#F1F5F9', margin: 0 }}>Beli dari Kandang, Jual ke RPA</p>
            <p style={{ fontSize: subSize, color: '#4B6478', margin: '3px 0 0' }}>Kamu sudah beli stok dari kandang, sekarang mau jual ke pembeli.</p>
          </button>

          <button
            type="button"
            onClick={() => setSelected('order_first')}
            style={{
              width: '100%', textAlign: 'left', padding: pad, borderRadius: 14,
              background: selected === 'order_first' ? 'rgba(96,165,250,0.08)' : 'rgba(96,165,250,0.03)',
              border: selected === 'order_first' ? '2px solid rgba(96,165,250,0.40)' : '1px solid rgba(96,165,250,0.15)',
              cursor: 'pointer', transition: 'all 0.2s'
            }}
          >
            <div className="flex items-center gap-2 mb-1">
              <span style={{ fontSize: emojiSize }}>📋 → 🏚️</span>
            </div>
            <p style={{ fontSize: titleSize, fontWeight: 700, color: '#F1F5F9', margin: 0 }}>Ada Order dari RPA dulu</p>
            <p style={{ fontSize: subSize, color: '#4B6478', margin: '3px 0 0' }}>RPA pesan ke kamu, sekarang kamu cari kandang yang cocok.</p>
          </button>
        </div>
      </div>

      <AnimatePresence>
        {selected && (
          <motion.div
            initial={{ opacity: 0, y: 12 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: 8 }}
          >
            <Button
              className={isDesktop ? "w-full h-14 rounded-2xl font-black text-base" : "w-full h-11 rounded-xl font-black text-[13px]"}
              style={{ background: '#10B981', color: '#06090F', boxShadow: '0 8px 24px rgba(16, 185, 129, 0.25)' }}
              onClick={() => onSelect(selected)}
            >
              Lanjut →
            </Button>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  )
}

// ─── Main Wizard ──────────────────────────────────────────────────────────────
export default function TransaksiWizard({ isOpen, onClose }) {
  const { tenant, _profile } = useAuth()
  const queryClient = useQueryClient()
  const isDesktop = useMediaQuery('(min-width: 1024px)')

  const [mode, setMode] = useState(null)
  const [currentStep, setCurrentStep] = useState(0)
  const [step1Data, setStep1Data] = useState(null)
  const [step2Data, setStep2Data] = useState(null)
  const [step3Data, setStep3Data] = useState({ enabled: false, include_driver_wage: true, include_fuel_cost: true, driver_wage: 0 })
  const [submitting, setSubmitting] = useState(false)
  const [successData, setSuccessData] = useState(null)

  const _resetWizard = () => {
    setMode(null)
    setCurrentStep(0)
    setStep1Data(null)
    setStep2Data(null)
    setStep3Data(p => ({ ...p, enabled: false, include_driver_wage: true, include_fuel_cost: true, driver_wage: 0 }))
    localStorage.removeItem(`ternak_os_wizard_draft_${tenant?.id}`)
  }

  const handleClose = React.useCallback(() => {
    onClose()
  }, [onClose])

  // --- Draft Persistence ---
  React.useEffect(() => {
    if (!isOpen || !tenant?.id || successData) return
    const draft = {
      mode,
      currentStep,
      step1Data,
      step2Data,
      step3Data,
      updatedAt: new Date().toISOString()
    }
    localStorage.setItem(`ternak_os_wizard_draft_${tenant?.id}`, JSON.stringify(draft))
  }, [mode, currentStep, step1Data, step2Data, step3Data, isOpen, tenant?.id, successData])

  // --- Draft Recovery ---
  const [hasDraft, setHasDraft] = useState(false)
  React.useEffect(() => {
    if (isOpen && tenant?.id && currentStep === 0) {
      const saved = localStorage.getItem(`ternak_os_wizard_draft_${tenant?.id}`)
      if (saved) {
        try {
          const parsed = JSON.parse(saved)
          if (parsed.mode && parsed.updatedAt) {
            setHasDraft(true)
          }
        } catch (_e) {
          localStorage.removeItem(`ternak_os_wizard_draft_${tenant?.id}`)
        }
      }
    }
  }, [isOpen, tenant?.id])

  const loadDraft = () => {
    const saved = localStorage.getItem(`ternak_os_wizard_draft_${tenant?.id}`)
    if (saved) {
      const p = JSON.parse(saved)
      setMode(p.mode)
      setCurrentStep(p.currentStep || 0)
      setStep1Data(p.step1Data)
      setStep2Data(p.step2Data)
      setStep3Data(p.step3Data || { enabled: false, include_driver_wage: true, include_fuel_cost: true, driver_wage: 0 })
    }
    setHasDraft(false)
  }

  const steps = mode === 'buy_first'
    ? ['Pembelian', 'Penjualan', 'Pengiriman']
    : ['Order RPA', 'Pembelian', 'Pengiriman']

  const handleSelectMode = (selectedMode) => {
    setMode(selectedMode)
    setCurrentStep(1)
  }

  // ── Submit All ──────────────────────────────────────────────────────────────
  const handleSubmitAll = async () => {
    setSubmitting(true)
    let purchaseId = null
    let saleId = null
    let deliveryId = null
    let failedStep = null

    try {
      const finalDeliveryCost = step3Data?.enabled ? (Number(step3Data.delivery_cost) || 0) : 0

      if (mode === 'buy_first') {
        // 1. Insert purchase
        const { data: purchase, error: purchaseError } = await supabase
          .from('purchases')
          .insert({
            tenant_id: tenant.id,
            farm_id: step1Data.farm_id,
            quantity: step1Data.quantity,
            avg_weight_kg: step1Data.avg_weight_kg,
            total_weight_kg: step1Data.total_weight_kg,
            price_per_kg: step1Data.price_per_kg,
            total_cost: step1Data.total_cost,
            transport_cost: 0,
            other_cost: 0,
            transaction_date: step1Data.transaction_date,
            notes: step1Data.notes || null
          })
          .select()
          .maybeSingle()
        
        if (purchaseError) {
           const isMissingTable = purchaseError.message?.includes('relation "purchases" does not exist')
             || purchaseError.code === 'PGRST116'
             || purchaseError.code === '42P01'
             || String(purchaseError.status) === '404'
             
           if (isMissingTable) {
             console.warn('[ResilientMode] Skipping purchase ID link.')
             purchaseId = null
           } else {
             failedStep = 'purchase_create'
             logSupabaseError(purchaseError, {
               table: 'purchases',
               operation: 'insert',
               component: 'TransaksiWizard',
               actionName: 'broker.purchase.create.wizard',
               tenantId: tenant?.id
             })
             throw purchaseError
           }
        } else {
          purchaseId = purchase?.id || null
        }

        // 2. Insert sale (Include delivery_cost from Step 3)
        const { data: sale, error: saleError } = await supabase
          .from('sales')
          .insert({
            tenant_id: tenant.id,
            rpa_id: step2Data.rpa_id,
            purchase_id: purchaseId,
            quantity: step2Data.quantity,
            avg_weight_kg: step2Data.avg_weight_kg,
            total_weight_kg: step2Data.total_weight_kg,
            price_per_kg: step2Data.price_per_kg,
            total_revenue: step2Data.total_revenue,
            delivery_cost: finalDeliveryCost,
            payment_status: step2Data.payment_status,
            paid_amount: step2Data.paid_amount || 0,
            transaction_date: step2Data.transaction_date,
            due_date: step2Data.due_date || null,
            notes: step2Data.notes || null
          })
          .select()
          .maybeSingle()

        if (saleError) {
          failedStep = 'sale_create'
          logSupabaseError(saleError, {
            table: 'sales',
            operation: 'insert',
            component: 'TransaksiWizard',
            actionName: 'broker.sale.create.wizard',
            tenantId: tenant?.id
          })
          throw saleError
        }
        saleId = sale?.id || null
      } else {
        // order_first: buy first (step2), then link to sale (step1)
        const { data: purchase, error: purchaseError } = await supabase
          .from('purchases')
          .insert({
            tenant_id: tenant.id,
            farm_id: step2Data.farm_id,
            quantity: step2Data.quantity,
            avg_weight_kg: step2Data.avg_weight_kg,
            total_weight_kg: step2Data.total_weight_kg,
            price_per_kg: step2Data.price_per_kg,
            total_cost: step2Data.total_cost,
            transport_cost: 0,
            other_cost: 0,
            transaction_date: step2Data.transaction_date,
            notes: step2Data.notes || null
          })
          .select()
          .maybeSingle()

        if (purchaseError) {
          const isMissingTable = purchaseError.message?.includes('relation "purchases" does not exist')
            || purchaseError.code === 'PGRST116'
            || purchaseError.code === '42P01'
            || String(purchaseError.status) === '404'
          if (isMissingTable) {
            console.warn('[ResilientMode] Purchases table missing mapping. Skipping link.')
            purchaseId = null
          } else {
            failedStep = 'purchase_create'
            logSupabaseError(purchaseError, {
              table: 'purchases',
              operation: 'insert',
              component: 'TransaksiWizard',
              actionName: 'broker.purchase.create.wizard',
              tenantId: tenant?.id
            })
            throw purchaseError
          }
        } else {
          purchaseId = purchase?.id || null
        }

        const { data: sale, error: saleError } = await supabase
          .from('sales')
          .insert({
            tenant_id: tenant.id,
            rpa_id: step1Data.rpa_id,
            purchase_id: purchaseId,
            quantity: step1Data.quantity,
            avg_weight_kg: step1Data.avg_weight_kg,
            total_weight_kg: step1Data.total_weight_kg,
            price_per_kg: step1Data.price_per_kg,
            total_revenue: step1Data.total_revenue,
            delivery_cost: finalDeliveryCost,
            payment_status: step1Data.payment_status,
            paid_amount: step1Data.paid_amount || 0,
            transaction_date: step1Data.transaction_date,
            due_date: step1Data.due_date || null,
            notes: step1Data.notes || null
          })
          .select()
          .maybeSingle()

        if (saleError) {
          failedStep = 'sale_create'
          logSupabaseError(saleError, {
            table: 'sales',
            operation: 'insert',
            component: 'TransaksiWizard',
            actionName: 'broker.sale.create.wizard',
            tenantId: tenant?.id
          })
          throw saleError
        }
        saleId = sale?.id || null
      }

      // 3. Insert delivery if enabled
      if (step3Data?.enabled) {
        // Auto-register manual vehicle if needed
        let finalVehicleId = step3Data.vehicle_id || null
        if (!finalVehicleId && step3Data.vehicle_plate) {
          const { data: newV, error: newVError } = await supabase.from('vehicles').insert({
            tenant_id: tenant.id,
            brand: 'Auto-Registered',
            vehicle_plate: step3Data.vehicle_plate.toUpperCase(),
            vehicle_type: step3Data.vehicle_type || 'Armada',
            ownership: 'lainnya',
            status: 'aktif'
          }).select('id').maybeSingle()
          if (newVError) {
            failedStep = 'vehicle_auto_register'
            logSupabaseError(newVError, {
              table: 'vehicles',
              operation: 'insert',
              component: 'TransaksiWizard',
              actionName: 'broker.transaction.create',
              tenantId: tenant?.id
            })
            throw newVError
          }
          if (newV) finalVehicleId = newV.id
        }

        // Auto-register manual driver if needed
        let finalDriverId = step3Data.driver_id || null
        if (!finalDriverId && step3Data.driver_name) {
          const { data: newD, error: newDError } = await supabase.from('drivers').insert({
            tenant_id: tenant.id,
            full_name: step3Data.driver_name,
            phone: step3Data.driver_phone || null,
            status: 'aktif'
          }).select('id').maybeSingle()
          if (newDError) {
            failedStep = 'driver_auto_register'
            logSupabaseError(newDError, {
              table: 'drivers',
              operation: 'insert',
              component: 'TransaksiWizard',
              actionName: 'broker.transaction.create',
              tenantId: tenant?.id
            })
            throw newDError
          }
          if (newD) finalDriverId = newD.id
        }

        // DEBUG: Ensure everything is captured correctly
        console.log('--- WIZARD SUBMIT DEBUG ---')
        console.log('Mode:', mode)
        console.log('Step 3 Data (Raw):', step3Data)

        const deliveryPayload = {
          tenant_id: tenant.id,
          sale_id: saleId,
          vehicle_id: finalVehicleId,
          driver_id: finalDriverId,
          vehicle_type: step3Data.vehicle_type || '',
          vehicle_plate: step3Data.vehicle_plate || '',
          driver_name: step3Data.driver_name || '',
          driver_phone: step3Data.driver_phone || null,
          initial_count: Number(step3Data.initial_count) || Number(step1Data?.quantity) || Number(step2Data?.quantity) || 0,
          initial_weight_kg: Number(step3Data.initial_weight_kg) || Number(step1Data?.total_weight_kg) || Number(step2Data?.total_weight_kg) || 0,
          load_time: step3Data.load_time || null,
          departure_time: step3Data.departure_time || null,
          delivery_cost: finalDeliveryCost,
          include_driver_wage: step3Data.include_driver_wage ?? true,
          include_fuel_cost: step3Data.include_fuel_cost ?? true,
          driver_wage: step3Data.driver_wage || 0,
          status: 'preparing',
          notes: step3Data.notes || null
        }

        console.log('Inserting Delivery Payload:', deliveryPayload)

        const { data: deliveryData, error: deliveryError } = await supabase
          .from('deliveries')
          .insert(deliveryPayload)
          .select()
          .maybeSingle()

        if (deliveryError) {
          console.error('Delivery Insert Error:', deliveryError)
          failedStep = 'delivery_create'
          logSupabaseError(deliveryError, {
            table: 'deliveries',
            operation: 'insert',
            component: 'TransaksiWizard',
            actionName: 'broker.delivery.create.wizard',
            tenantId: tenant?.id
          })
          throw deliveryError
        }
        if (deliveryData) {
          deliveryId = deliveryData.id
        }
      }

      queryClient.invalidateQueries({ queryKey: ['broker-stats'] })
      queryClient.invalidateQueries({ queryKey: ['purchases'] })
      queryClient.invalidateQueries({ queryKey: ['sales'] })
      queryClient.invalidateQueries({ queryKey: ['deliveries'] })
      queryClient.invalidateQueries({ queryKey: ['rpa-clients'] })

      const buyData = mode === 'buy_first' ? step1Data : step2Data
      const sellData = mode === 'buy_first' ? step2Data : step1Data
      const profit = (sellData?.total_revenue || 0) - (buyData?.total_cost || 0) - finalDeliveryCost

      setSuccessData({
        type: 'recorded',
        farmName: buyData?.farm_name || null,
        rpaName: sellData?.rpa_name || null,
        rpaPhone: sellData?.rpa_phone || null,
        quantity: buyData?.quantity || 0,
        totalWeight: buyData?.total_weight_kg || 0,
        buyPrice: buyData?.total_cost || 0,
        sellPrice: sellData?.total_revenue || 0,
        netProfit: profit,
        transactionDate: buyData?.transaction_date || null,
        tenant: tenant,
      })
    } catch (err) {
      const buyData = mode === 'buy_first' ? step1Data : step2Data
      const sellData = mode === 'buy_first' ? step2Data : step1Data

      logError({
        level: 'error',
        source: 'supabase',
        component: 'TransaksiWizard',
        actionName: 'broker.transaction.create',
        error: err,
        metadata: {
          tenant_id: tenant?.id || null,
          farm_id: buyData?.farm_id || null,
          rpa_id: sellData?.rpa_id || null,
          quantity: buyData?.quantity || null,
          total_weight_kg: buyData?.total_weight_kg || null,
          transaction_date: buyData?.transaction_date || null,
          payment_status: sellData?.payment_status || null,
          purchase_id: purchaseId,
          sale_id: saleId,
          delivery_id: deliveryId,
          partial: Boolean(purchaseId || saleId || deliveryId),
          failed_step: failedStep
        }
      })
      toast.error('Gagal: ' + err.message)
    } finally {
      setSubmitting(false)
    }
  }

  const renderStep = () => {
    if (currentStep === 0) return <Step0ModeSelect onSelect={handleSelectMode} />

    if (mode === 'buy_first') {
      if (currentStep === 1) return (
        <WizardStepBeli
          onNext={(data) => { setStep1Data(data); setCurrentStep(2) }}
          onBack={() => setCurrentStep(0)}
          title="Step 1 — Dari Kandang Mana?"
        />
      )
      if (currentStep === 2) return (
        <WizardStepJual
          step1Data={step1Data}
          onNext={(data) => { setStep2Data(data); setCurrentStep(3) }}
          onBack={() => setCurrentStep(1)}
        />
      )
    } else {
      if (currentStep === 1) return (
        <WizardStepOrder
          onNext={(data) => { setStep1Data(data); setCurrentStep(2) }}
          onBack={() => setCurrentStep(0)}
        />
      )
      if (currentStep === 2) return (
        <WizardStepBeli
          onNext={(data) => { setStep2Data(data); setCurrentStep(3) }}
          onBack={() => setCurrentStep(1)}
          orderData={step1Data}
          title="Step 2 — Beli dari Kandang Mana?"
        />
      )
    }

    if (currentStep === 3) return (
      <WizardStepPengiriman
        step1Data={step1Data}
        step2Data={step2Data}
        mode={mode}
        step3Data={step3Data}
        setStep3Data={setStep3Data}
        onSubmit={handleSubmitAll}
        onBack={() => setCurrentStep(2)}
        submitting={submitting}
      />
    )
  }

  return (
    <>
      <Sheet open={isOpen && !successData} onOpenChange={handleClose}>
        <SheetContent
          side={isDesktop ? 'right' : 'bottom'}
          className="hide-scrollbar"
          hideClose={true}
          style={{
            width: isDesktop ? '520px' : '100%',
            height: isDesktop ? '100vh' : '100dvh',
            maxHeight: isDesktop ? '100vh' : '100dvh',
            padding: 0,
            background: '#0C1319',
            border: '1px solid rgba(255,255,255,0.08)',
            borderRadius: 0,
            display: 'flex', flexDirection: 'column',
            overflow: 'hidden'
          }}
        >
          {/* Header */}
          <SheetHeader style={{
            padding: isDesktop ? '20px 20px 0' : 'env(safe-area-inset-top, 20px) 20px 0',
            flexShrink: 0
          }}>
            {!isDesktop && (
              <div style={{ display: 'flex', justifyContent: 'flex-end', marginBottom: 4 }}>
                <button
                  onClick={handleClose}
                  className="w-10 h-10 rounded-full bg-white/5 flex items-center justify-center text-muted-foreground hover:text-white"
                >
                  <X size={20} />
                </button>
              </div>
            )}
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 4 }}>
              <SheetTitle style={{ fontFamily: 'Sora', fontSize: 22, fontWeight: 800, color: '#F1F5F9', margin: 0 }}>
                Catat Transaksi
              </SheetTitle>
              <SheetDescription className="sr-only">
                Form wizard transaksi broker untuk mencatat pembelian dan penjualan.
              </SheetDescription>
              {isDesktop && (
                <button
                  onClick={handleClose}
                  className="w-10 h-10 rounded-full bg-white/5 flex items-center justify-center text-muted-foreground hover:text-white"
                >
                  <X size={20} />
                </button>
              )}
            </div>
          </SheetHeader>

          {/* Progress */}
          {currentStep > 0 && mode && (
            <ProgressIndicator currentStep={currentStep - 1} steps={steps} />
          )}

          {/* Draft Alert */}
          {hasDraft && currentStep === 0 && (
            <div className="mx-5 mb-4 p-4 rounded-2xl bg-emerald-500/10 border border-emerald-500/20 flex flex-col gap-3">
              <div className="flex items-start gap-3">
                <div className="w-8 h-8 rounded-full bg-emerald-500/20 flex items-center justify-center shrink-0">
                  <Clock size={16} className="text-emerald-400" />
                </div>
                <div>
                  <p className="text-sm font-bold text-white leading-tight">Lanjutkan draf sebelumnya?</p>
                  <p className="text-[11px] text-emerald-400/70 font-medium mt-1">Kamu punya transaksi yang belum selesai dicatat.</p>
                </div>
              </div>
              <div className="flex gap-2">
                <Button onClick={loadDraft} className="flex-1 h-9 bg-emerald-500 hover:bg-emerald-600 text-white font-black text-[11px] rounded-lg">LANJUTKAN</Button>
                <Button variant="ghost" onClick={() => { localStorage.removeItem(`ternak_os_wizard_draft_${tenant?.id}`); setHasDraft(false) }} className="h-9 px-3 text-[#4B6478] font-bold text-[11px]">MULAI BARU</Button>
              </div>
            </div>
          )}

          {/* Step Content */}
          <div style={{ flex: 1, overflowY: 'auto', overflowX: 'hidden' }}>
            <AnimatePresence mode="wait">
              <motion.div
                key={currentStep}
                initial={{ opacity: 0, x: 20 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: -20 }}
                transition={{ duration: 0.22 }}
              >
                {renderStep()}
              </motion.div>
            </AnimatePresence>
          </div>
        </SheetContent>
      </Sheet>

      <TransaksiSuccessCard
        isOpen={!!successData}
        onClose={() => { setSuccessData(null); handleClose() }}
        data={successData}
      />
    </>
  )
}
