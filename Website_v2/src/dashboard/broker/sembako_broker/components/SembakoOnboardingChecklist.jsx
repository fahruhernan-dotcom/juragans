import React, { useMemo, useState, useEffect } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { Package, Warehouse, ShoppingCart, Store, Check, ChevronRight, X, Rocket } from 'lucide-react'
import { useNavigate, useParams } from 'react-router-dom'
import { C } from './sembakoSaleUtils'

const ONBOARDING_KEY = 'sembako_onboarding_dismissed'

const STEPS = [
  {
    id: 'product',
    label: 'Tambah Produk',
    desc: 'Daftarkan produk yang Anda jual',
    icon: Package,
    navPath: '/produk',
  },
  {
    id: 'stock',
    label: 'Catat Stok Masuk',
    desc: 'Input stok barang dari supplier',
    icon: Warehouse,
    navPath: '/gudang',
  },
  {
    id: 'customer',
    label: 'Tambah Toko / Customer',
    desc: 'Daftarkan pelanggan atau toko',
    icon: Store,
    navPath: '/toko-supplier',
  },
  {
    id: 'sale',
    label: 'Catat Penjualan',
    desc: 'Buat invoice pertama Anda',
    icon: ShoppingCart,
    navPath: '/penjualan?action=new',
  },
]

/**
 * First-run onboarding checklist that auto-detects completion.
 * Shows only when all data is empty; persists dismiss in localStorage.
 */
export function SembakoOnboardingChecklist({ productsCount, batchesCount, customersCount, salesCount, onStokOpen }) {
  const navigate = useNavigate()
  const { brokerType } = useParams()
  const brokerBase = `/broker/${brokerType}`

  const [dismissed, setDismissed] = useState(false)
  useEffect(() => {
    try { if (localStorage.getItem(ONBOARDING_KEY) === 'true') setDismissed(true) } catch { /* ok */ }
  }, [])

  const completionMap = useMemo(() => ({
    product:  productsCount > 0,
    stock:    batchesCount > 0,
    customer: customersCount > 0,
    sale:     salesCount > 0,
  }), [productsCount, batchesCount, customersCount, salesCount])

  const completedCount = Object.values(completionMap).filter(Boolean).length
  const allDone = completedCount === STEPS.length
  const progressPct = Math.round((completedCount / STEPS.length) * 100)

  // Don't show if dismissed or all steps completed
  if (dismissed || allDone) return null

  const handleDismiss = () => {
    setDismissed(true)
    try { localStorage.setItem(ONBOARDING_KEY, 'true') } catch { /* ok */ }
  }

  const handleStepClick = (step) => {
    if (step.id === 'stock' && onStokOpen) {
      onStokOpen()
    } else {
      navigate(`${brokerBase}${step.navPath}`)
    }
  }

  return (
    <motion.div
      initial={{ opacity: 0, y: 12 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.4, ease: 'easeOut' }}
      style={{
        background: 'linear-gradient(135deg, #FFFFFF 0%, #F8FAFC 100%)',
        borderRadius: '20px',
        border: '1px solid var(--border-soft, #E2E8F0)',
        boxShadow: '0 4px 20px -2px rgba(15, 23, 42, 0.05), 0 2px 6px -1px rgba(15, 23, 42, 0.03)',
        padding: '20px',
        marginBottom: '18px',
        position: 'relative',
      }}
    >
      {/* Dismiss button */}
      <button
        onClick={handleDismiss}
        style={{
          position: 'absolute', top: 12, right: 12,
          width: 28, height: 28, borderRadius: 8,
          background: 'rgba(0,0,0,0.04)', border: 'none',
          display: 'flex', alignItems: 'center', justifyContent: 'center',
          cursor: 'pointer',
        }}
      >
        <X size={14} color="#64748B" />
      </button>

      {/* Header */}
      <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '14px' }}>
        <div style={{
          width: 36, height: 36, borderRadius: 10,
          background: 'rgba(12, 61, 12, 0.08)',
          display: 'flex', alignItems: 'center', justifyContent: 'center',
        }}>
          <Rocket size={18} color="#0c3d0c" />
        </div>
        <div>
          <h3 style={{
            fontSize: '15px', fontWeight: 800, color: 'var(--text-primary, #0F172A)',
            fontFamily: 'DM Sans', margin: 0, lineHeight: 1.2,
          }}>
            Mulai Perjalanan Bisnis Anda
          </h3>
          <p style={{
            fontSize: '11px', color: 'var(--text-muted, #64748B)', margin: 0, marginTop: '2px',
            fontWeight: 600,
          }}>
            Selesaikan {STEPS.length} langkah untuk memulai
          </p>
        </div>
      </div>

      {/* Progress bar */}
      <div style={{ marginBottom: '16px' }}>
        <div style={{
          display: 'flex', justifyContent: 'space-between', alignItems: 'center',
          marginBottom: '6px',
        }}>
          <span style={{ fontSize: '10px', fontWeight: 800, color: 'var(--text-muted, #64748B)', letterSpacing: '0.08em' }}>
            PROGRESS
          </span>
          <span style={{
            fontSize: '10px', fontWeight: 800, letterSpacing: '0.05em',
            color: '#0c3d0c',
          }}>
            {completedCount}/{STEPS.length}
          </span>
        </div>
        <div style={{
          height: 6, borderRadius: 3, background: '#E2E8F0',
          overflow: 'hidden',
        }}>
          <motion.div
            initial={{ width: 0 }}
            animate={{ width: `${progressPct}%` }}
            transition={{ duration: 0.5, ease: 'easeOut' }}
            style={{
              height: '100%', borderRadius: 3,
              background: 'linear-gradient(90deg, #0c3d0c, #16a34a)',
            }}
          />
        </div>
      </div>

      {/* Steps */}
      <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
        {STEPS.map((step, idx) => {
          const done = completionMap[step.id]
          const Icon = step.icon
          return (
            <motion.button
              key={step.id}
              onClick={() => !done && handleStepClick(step)}
              disabled={done}
              whileTap={!done ? { scale: 0.98 } : {}}
              style={{
                display: 'flex', alignItems: 'center', gap: '12px',
                padding: '12px 14px', borderRadius: '14px',
                background: done ? 'rgba(12, 61, 12, 0.04)' : '#FFFFFF',
                border: `1px solid ${done ? 'rgba(12, 61, 12, 0.2)' : 'var(--border-soft, #E2E8F0)'}`,
                boxShadow: '0 1px 3px rgba(0,0,0,0.03)',
                cursor: done ? 'default' : 'pointer',
                textAlign: 'left', width: '100%',
                opacity: done ? 0.75 : 1,
                transition: 'all 0.2s',
              }}
            >
              {/* Step number / check */}
              <div style={{
                width: 30, height: 30, borderRadius: 9, flexShrink: 0,
                background: done ? 'rgba(12, 61, 12, 0.12)' : 'rgba(12, 61, 12, 0.08)',
                display: 'flex', alignItems: 'center', justifyContent: 'center',
              }}>
                {done
                  ? <Check size={14} color="#0c3d0c" strokeWidth={3} />
                  : <span style={{ fontSize: '11px', fontWeight: 900, color: '#0c3d0c' }}>{idx + 1}</span>
                }
              </div>

              {/* Label */}
              <div style={{ flex: 1, minWidth: 0 }}>
                <p style={{
                  fontSize: '13px', fontWeight: 700, color: done ? '#0c3d0c' : 'var(--text-primary, #0F172A)',
                  margin: 0, lineHeight: 1.2,
                  textDecoration: done ? 'line-through' : 'none',
                }}>
                  {step.label}
                </p>
                <p style={{ fontSize: '11px', color: 'var(--text-muted, #64748B)', margin: 0, marginTop: '2px' }}>
                  {step.desc}
                </p>
              </div>

              {/* Arrow */}
              {!done && (
                <ChevronRight size={16} color="#94A3B8" style={{ flexShrink: 0 }} />
              )}
            </motion.button>
          )
        })}
      </div>
    </motion.div>
  )
}
