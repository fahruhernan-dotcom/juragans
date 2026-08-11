import React, { useState, useEffect, useCallback, useRef } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { ChevronRight, ChevronLeft, Check, X, MapPin } from 'lucide-react'
import { useAuth } from '@/lib/hooks/useAuth'
import { supabase } from '@/lib/supabase'
import { logSupabaseError } from '@/lib/logger/supabaseLogger'

const CARD_BG = '#0C1319'
const MUTED = '#64748B'
const TEXT = '#F1F5F9'
const SPOTLIGHT_PAD = 12
const SPOTLIGHT_RADIUS = 14

function useIsDesktop() {
  const [isDesktop, setIsDesktop] = useState(false)
  useEffect(() => {
    const update = () => setIsDesktop(window.innerWidth >= 768)
    update()
    window.addEventListener('resize', update)
    return () => window.removeEventListener('resize', update)
  }, [])
  return isDesktop
}

function useViewport() {
  const [vp, setVp] = useState({ w: 0, h: 0 })
  useEffect(() => {
    const update = () => setVp({ w: window.innerWidth, h: window.innerHeight })
    update()
    window.addEventListener('resize', update)
    return () => window.removeEventListener('resize', update)
  }, [])
  return vp
}

function ProgressDots({ total, current, accent }) {
  return (
    <div style={{ display: 'flex', gap: 5, alignItems: 'center' }}>
      {Array.from({ length: total }).map((_, i) => (
        <div key={i} style={{
          width: i === current ? 18 : 7, height: 7,
          borderRadius: 4,
          background: i === current ? accent : 'rgba(255,255,255,0.15)',
          transition: 'all 0.3s ease',
        }} />
      ))}
    </div>
  )
}

function SpotlightSVG({ rect, accent }) {
  const vp = useViewport()
  if (!vp.w) return null

  const x = rect ? rect.x - SPOTLIGHT_PAD : 0
  const y = rect ? rect.y - SPOTLIGHT_PAD : 0
  const rw = rect ? rect.w + SPOTLIGHT_PAD * 2 : 0
  const rh = rect ? rect.h + SPOTLIGHT_PAD * 2 : 0

  return (
    <svg
      style={{ position: 'fixed', inset: 0, width: '100%', height: '100%', zIndex: 9998, pointerEvents: 'none' }}
    >
      {rect ? (
        <>
          <defs>
            <mask id="tut-mask">
              <rect width="100%" height="100%" fill="white" />
              <rect x={x} y={y} width={rw} height={rh} rx={SPOTLIGHT_RADIUS} ry={SPOTLIGHT_RADIUS} fill="black" />
            </mask>
          </defs>
          <rect width="100%" height="100%" fill="rgba(0,0,0,0.82)" mask="url(#tut-mask)" />
          <rect x={x} y={y} width={rw} height={rh} rx={SPOTLIGHT_RADIUS} ry={SPOTLIGHT_RADIUS}
            fill="none" stroke={accent} strokeWidth="2.5" opacity="0.85" />
          <rect x={x - 5} y={y - 5} width={rw + 10} height={rh + 10} rx={SPOTLIGHT_RADIUS + 5} ry={SPOTLIGHT_RADIUS + 5}
            fill="none" stroke={accent} strokeWidth="1" opacity="0.25" />
        </>
      ) : (
        <rect width="100%" height="100%" fill="rgba(0,0,0,0.78)" />
      )}
    </svg>
  )
}

function ClickBlocker({ rect }) {
  const vp = useViewport()
  if (!vp.w) return <div style={{ position: 'fixed', inset: 0, zIndex: 9997 }} />
  if (!rect) return <div style={{ position: 'fixed', inset: 0, zIndex: 9997 }} />

  const x = rect.x - SPOTLIGHT_PAD
  const y = rect.y - SPOTLIGHT_PAD
  const rw = rect.w + SPOTLIGHT_PAD * 2
  const rh = rect.h + SPOTLIGHT_PAD * 2

  return (
    <>
      <div style={{ position: 'fixed', top: 0, left: 0, right: 0, height: y, zIndex: 9997 }} />
      <div style={{ position: 'fixed', top: y + rh, left: 0, right: 0, bottom: 0, zIndex: 9997 }} />
      <div style={{ position: 'fixed', top: y, left: 0, width: x, height: rh, zIndex: 9997 }} />
      <div style={{ position: 'fixed', top: y, left: x + rw, right: 0, height: rh, zIndex: 9997 }} />
    </>
  )
}

function TooltipCard({ step, stepIdx, totalSteps, rect, isLast, isDesktop, accent, accentDim, onNext, onPrev, onSkip }) {
  const vp = useViewport()
  const Icon = step.icon
  if (!vp.w) return null

  const CARD_W = isDesktop ? 296 : Math.min(296, vp.w - 32)

  let style = {}
  let arrowSide = null

  if (rect) {
    const pad = SPOTLIGHT_PAD
    const elBottom = rect.y + rect.h + pad + 12
    const elTop    = rect.y - pad - 12
    const elCenterX = rect.x + rect.w / 2
    const clampLeft = (v) => Math.max(16, Math.min(vp.w - CARD_W - 16, v))

    if (elBottom + 220 < vp.h) {
      style = { top: elBottom, left: clampLeft(elCenterX - CARD_W / 2) }
      arrowSide = 'top'
    } else if (elTop - 220 > 0) {
      style = { bottom: vp.h - elTop, left: clampLeft(elCenterX - CARD_W / 2) }
      arrowSide = 'bottom'
    } else {
      style = { bottom: 96, left: clampLeft(elCenterX - CARD_W / 2) }
    }
  } else {
    style = { bottom: isDesktop ? 48 : 96, left: Math.max(16, (vp.w - CARD_W) / 2) }
  }

  return (
    <motion.div
      key={stepIdx}
      initial={{ opacity: 0, y: arrowSide === 'top' ? -10 : 10, scale: 0.95 }}
      animate={{ opacity: 1, y: 0, scale: 1 }}
      exit={{ opacity: 0, scale: 0.94 }}
      transition={{ duration: 0.2, ease: 'easeOut' }}
      style={{
        position: 'fixed', ...style,
        width: CARD_W,
        background: CARD_BG,
        borderRadius: 20,
        border: '1px solid rgba(255,255,255,0.1)',
        padding: '18px 18px 14px',
        zIndex: 10000,
        boxShadow: `0 24px 64px rgba(0,0,0,0.75), 0 0 0 1px ${accent}1a`,
      }}
    >
      {arrowSide === 'top' && (
        <div style={{ position: 'absolute', top: -7, left: 22, width: 14, height: 7, overflow: 'hidden' }}>
          <div style={{ width: 12, height: 12, background: CARD_BG, border: '1px solid rgba(255,255,255,0.1)', borderRadius: 2, transform: 'rotate(45deg) translate(1px, 1px)' }} />
        </div>
      )}
      {arrowSide === 'bottom' && (
        <div style={{ position: 'absolute', bottom: -7, left: 22, width: 14, height: 7, overflow: 'hidden', display: 'flex', alignItems: 'flex-end' }}>
          <div style={{ width: 12, height: 12, background: CARD_BG, border: '1px solid rgba(255,255,255,0.1)', borderRadius: 2, transform: 'rotate(45deg) translate(1px, -1px)' }} />
        </div>
      )}

      <div style={{ display: 'flex', alignItems: 'flex-start', gap: 10, marginBottom: 10 }}>
        <div style={{ width: 34, height: 34, borderRadius: 10, flexShrink: 0, background: accentDim, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
          <Icon size={17} color={accent} />
        </div>
        <div style={{ flex: 1 }}>
          <div style={{ fontSize: 10, color: MUTED, fontWeight: 700, letterSpacing: '0.08em', marginBottom: 2 }}>
            LANGKAH {stepIdx} / {totalSteps - 1}
          </div>
          <div style={{ fontSize: 14, fontWeight: 800, color: TEXT, lineHeight: 1.25, fontFamily: 'DM Sans, sans-serif' }}>
            {step.title}
          </div>
        </div>
        <button
          onClick={onSkip}
          style={{ background: 'none', border: 'none', color: MUTED, cursor: 'pointer', padding: '2px 2px', lineHeight: 0, flexShrink: 0 }}
          aria-label="Lewati tutorial"
        >
          <X size={15} />
        </button>
      </div>

      <p style={{ fontSize: 12.5, color: '#94A3B8', lineHeight: 1.65, margin: '0 0 12px' }}>
        {step.desc}
      </p>

      {!rect && step.navHint && (
        <div style={{ display: 'inline-flex', alignItems: 'center', gap: 5, background: 'rgba(255,255,255,0.04)', border: '1px solid rgba(255,255,255,0.08)', borderRadius: 7, padding: '5px 10px', marginBottom: 12 }}>
          <MapPin size={11} color={MUTED} />
          <span style={{ fontSize: 11, color: MUTED, fontWeight: 700 }}>Buka sidebar → {step.navHint}</span>
        </div>
      )}

      <div style={{ height: 1, background: 'rgba(255,255,255,0.06)', marginBottom: 12 }} />

      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
        <ProgressDots total={totalSteps} current={stepIdx} accent={accent} />
        <div style={{ display: 'flex', gap: 7 }}>
          <button onClick={onPrev} style={{ background: 'rgba(255,255,255,0.06)', border: '1px solid rgba(255,255,255,0.1)', borderRadius: 10, padding: '7px 12px', color: '#94A3B8', fontSize: 12, fontWeight: 700, cursor: 'pointer', display: 'flex', alignItems: 'center', gap: 3 }}>
            <ChevronLeft size={13} />
          </button>
          <button onClick={onNext} style={{ background: isLast ? '#16A34A' : accent, border: 'none', borderRadius: 10, padding: '7px 15px', color: '#fff', fontSize: 12, fontWeight: 800, cursor: 'pointer', display: 'flex', alignItems: 'center', gap: 5, boxShadow: `0 4px 14px ${accent}40` }}>
            {isLast ? <><Check size={13} strokeWidth={3} /> Mulai!</> : <>Lanjut <ChevronRight size={13} /></>}
          </button>
        </div>
      </div>
    </motion.div>
  )
}

// Mobile-only bottom sheet for spotlight steps.
// Does NOT open sidebar (avoids Radix focus trap blocking button taps).
function MobileStepSheet({ step, stepIdx, totalSteps, isLast, accent, accentDim, onNext, onPrev, onSkip, hasSpotlight = false }) {
  const Icon = step.icon

  return (
    <div style={{
      position: 'fixed', inset: 0,
      zIndex: 9999,
      display: 'flex', alignItems: 'flex-end',
      // SpotlightSVG handles backdrop when element is found
      background: hasSpotlight ? 'transparent' : 'rgba(0,0,0,0.55)',
      backdropFilter: hasSpotlight ? 'none' : 'blur(3px)',
      pointerEvents: 'none',
    }}>
      <motion.div
        key={stepIdx}
        initial={{ y: '100%' }}
        animate={{ y: 0 }}
        exit={{ y: '100%' }}
        transition={{ duration: 0.3, ease: [0.32, 0.72, 0, 1] }}
        style={{
          width: '100%',
          background: CARD_BG,
          borderRadius: '24px 24px 0 0',
          border: '1px solid rgba(255,255,255,0.08)',
          borderBottom: 'none',
          padding: '16px 20px',
          paddingBottom: 'max(20px, env(safe-area-inset-bottom))',
          boxShadow: '0 -16px 48px rgba(0,0,0,0.5)',
          pointerEvents: 'auto', // only the sheet captures touches
        }}
      >
        {/* drag handle */}
        <div style={{ width: 32, height: 4, borderRadius: 2, background: 'rgba(255,255,255,0.15)', margin: '0 auto 16px' }} />

        {/* header row */}
        <div style={{ display: 'flex', alignItems: 'flex-start', gap: 12, marginBottom: 12 }}>
          <div style={{ width: 42, height: 42, borderRadius: 13, background: accentDim, display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
            <Icon size={20} color={accent} />
          </div>
          <div style={{ flex: 1 }}>
            <div style={{ fontSize: 10, color: MUTED, fontWeight: 700, letterSpacing: '0.08em', marginBottom: 2 }}>
              LANGKAH {stepIdx} / {totalSteps - 1}
            </div>
            <div style={{ fontSize: 16, fontWeight: 800, color: TEXT, lineHeight: 1.25, fontFamily: 'DM Sans, sans-serif' }}>
              {step.title}
            </div>
          </div>
          <button
            onClick={onSkip}
            style={{
              background: 'rgba(255,255,255,0.06)',
              border: '1px solid rgba(255,255,255,0.1)',
              borderRadius: 10,
              color: MUTED,
              cursor: 'pointer',
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              width: 44, height: 44,
              flexShrink: 0,
            }}
            aria-label="Lewati tutorial"
          >
            <X size={16} />
          </button>
        </div>

        <p style={{ fontSize: 14, color: '#94A3B8', lineHeight: 1.65, margin: '0 0 12px' }}>
          {step.desc}
        </p>

        {step.navHint && (
          <div style={{
            display: 'flex', alignItems: 'center', gap: 8,
            background: `${accent}18`,
            border: `1px solid ${accent}35`,
            borderRadius: 10, padding: '9px 12px', marginBottom: 16,
          }}>
            <MapPin size={13} color={accent} />
            <span style={{ fontSize: 13, color: accent, fontWeight: 700 }}>
              Menu → {step.navHint}
            </span>
          </div>
        )}

        <div style={{ height: 1, background: 'rgba(255,255,255,0.06)', marginBottom: 14 }} />

        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
          <ProgressDots total={totalSteps} current={stepIdx} accent={accent} />
          <div style={{ display: 'flex', gap: 8 }}>
            <button
              onClick={onPrev}
              style={{
                background: 'rgba(255,255,255,0.06)',
                border: '1px solid rgba(255,255,255,0.1)',
                borderRadius: 12, padding: '0 16px',
                color: '#94A3B8', fontSize: 13, fontWeight: 700,
                cursor: 'pointer',
                display: 'flex', alignItems: 'center', gap: 4,
                minHeight: 44, minWidth: 44,
              }}
            >
              <ChevronLeft size={15} />
            </button>
            <button
              onClick={onNext}
              style={{
                background: isLast ? '#16A34A' : accent,
                border: 'none',
                borderRadius: 12, padding: '0 20px',
                color: '#fff', fontSize: 14, fontWeight: 800,
                cursor: 'pointer',
                display: 'flex', alignItems: 'center', gap: 6,
                boxShadow: `0 4px 14px ${accent}40`,
                minHeight: 44,
              }}
            >
              {isLast
                ? <><Check size={14} strokeWidth={3} /> Mulai!</>
                : <>Lanjut <ChevronRight size={14} /></>
              }
            </button>
          </div>
        </div>
      </motion.div>
    </div>
  )
}

function WelcomeModal({ step, steps, stepIdx, direction, accent, accentDim, onNext, onSkip, isDesktop }) {
  const Icon = step.icon
  const variants = {
    enter: (d) => ({ x: d > 0 ? 28 : -28, opacity: 0 }),
    center: { x: 0, opacity: 1 },
    exit: (d) => ({ x: d > 0 ? -28 : 28, opacity: 0 }),
  }

  const content = (
    <AnimatePresence mode="wait" custom={direction}>
      <motion.div key={stepIdx} custom={direction} variants={variants}
        initial="enter" animate="center" exit="exit"
        transition={{ duration: 0.22, ease: 'easeOut' }}
      >
        <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
          <div style={{ width: 68, height: 68, borderRadius: 20, background: accentDim, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
            <Icon size={32} color={accent} />
          </div>
          <div>
            <h2 style={{ fontFamily: 'DM Sans, sans-serif', fontWeight: 800, fontSize: isDesktop ? 22 : 20, color: TEXT, margin: 0, lineHeight: 1.3 }}>
              {step.title}
            </h2>
            <p style={{ fontSize: 14, color: '#94A3B8', margin: '10px 0 0', lineHeight: 1.7 }}>
              {step.desc}
            </p>
          </div>
          {step.bullets && (
            <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
              {step.bullets.map((b, i) => (
                <div key={i} style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                  <div style={{ width: 22, height: 22, borderRadius: 6, background: accentDim, display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                    <Check size={12} color={accent} strokeWidth={3} />
                  </div>
                  <span style={{ fontSize: 13, color: '#CBD5E1', fontWeight: 600 }}>{b}</span>
                </div>
              ))}
            </div>
          )}
        </div>
      </motion.div>
    </AnimatePresence>
  )

  if (isDesktop) {
    return (
      <div style={{ position: 'fixed', inset: 0, zIndex: 9999, display: 'flex', alignItems: 'center', justifyContent: 'center', background: 'rgba(0,0,0,0.75)', backdropFilter: 'blur(6px)' }}>
        <motion.div
          initial={{ opacity: 0, scale: 0.95 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ duration: 0.24, ease: 'easeOut' }}
          style={{ width: '100%', maxWidth: 560, background: CARD_BG, borderRadius: 24, border: '1px solid rgba(255,255,255,0.08)', overflow: 'hidden', display: 'flex', boxShadow: '0 32px 80px rgba(0,0,0,0.6)' }}
        >
          <div style={{ width: '38%', background: `linear-gradient(160deg, ${accentDim} 0%, rgba(0,0,0,0) 100%)`, borderRight: '1px solid rgba(255,255,255,0.06)', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', padding: '40px 20px', gap: 24 }}>
            <div style={{ width: 88, height: 88, borderRadius: 26, background: accentDim, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
              <Icon size={44} color={accent} />
            </div>
            <ProgressDots total={steps.length} current={stepIdx} accent={accent} />
            <span style={{ fontSize: 12, color: MUTED, fontWeight: 700, letterSpacing: '0.06em' }}>
              {stepIdx + 1} / {steps.length}
            </span>
          </div>
          <div style={{ flex: 1, padding: '32px 28px', display: 'flex', flexDirection: 'column' }}>
            <div style={{ flex: 1 }}>{content}</div>
            <div style={{ paddingTop: 24, display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <button onClick={onSkip} style={{ background: 'none', border: 'none', color: MUTED, fontSize: 13, fontWeight: 600, cursor: 'pointer', padding: '8px 4px' }}>
                Lewati tutorial
              </button>
              <button onClick={onNext} style={{ display: 'flex', alignItems: 'center', gap: 8, background: accent, border: 'none', borderRadius: 12, padding: '11px 22px', color: '#fff', fontSize: 14, fontWeight: 800, cursor: 'pointer', boxShadow: `0 4px 16px ${accent}40` }}>
                Mulai tour <ChevronRight size={15} />
              </button>
            </div>
          </div>
        </motion.div>
      </div>
    )
  }

  return (
    <div style={{ position: 'fixed', inset: 0, zIndex: 9999, display: 'flex', alignItems: 'flex-end', background: 'rgba(0,0,0,0.84)', backdropFilter: 'blur(4px)' }}>
      <motion.div
        initial={{ y: '100%' }}
        animate={{ y: 0 }}
        transition={{ duration: 0.32, ease: [0.32, 0.72, 0, 1] }}
        style={{ width: '100%', maxHeight: '82vh', background: CARD_BG, borderRadius: '24px 24px 0 0', border: '1px solid rgba(255,255,255,0.08)', borderBottom: 'none', display: 'flex', flexDirection: 'column', padding: '16px 20px 0', boxShadow: '0 -16px 48px rgba(0,0,0,0.5)' }}
      >
        <div style={{ width: 32, height: 4, borderRadius: 2, background: 'rgba(255,255,255,0.15)', margin: '0 auto 14px', flexShrink: 0 }} />
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 20, flexShrink: 0 }}>
          <ProgressDots total={steps.length} current={stepIdx} accent={accent} />
          <button onClick={onSkip} style={{ background: 'none', border: 'none', color: MUTED, fontSize: 13, fontWeight: 700, cursor: 'pointer', padding: '10px 4px 10px 16px', minHeight: 44 }}>
            Lewati
          </button>
        </div>
        <div style={{ flex: 1, overflowY: 'auto', paddingBottom: 8 }}>{content}</div>
        <div style={{ paddingTop: 16, paddingBottom: 'max(20px, env(safe-area-inset-bottom))', flexShrink: 0, borderTop: '1px solid rgba(255,255,255,0.06)' }}>
          <button onClick={onNext} style={{ width: '100%', background: accent, border: 'none', borderRadius: 14, padding: '15px 0', color: '#fff', fontSize: 15, fontWeight: 800, cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8, boxShadow: `0 4px 20px ${accent}44` }}>
            Mulai tour <ChevronRight size={16} />
          </button>
        </div>
      </motion.div>
    </div>
  )
}

export default function TutorialOverlay({ steps, storageKey, accent, accentDim }) {
  const { user, profile, tenant } = useAuth()
  const isDesktop = useIsDesktop()

  const [visible, setVisible]       = useState(false)
  const [mode, setMode]             = useState('welcome')
  const [stepIdx, setStepIdx]       = useState(0)
  const [direction, setDirection]   = useState(1)
  const [targetRect, setTargetRect] = useState(null)
  const retryRef = useRef(null)

  const targetAuthId = user?.id || profile?.auth_user_id
  const targetTenantId = tenant?.id || profile?.tenant_id

  useEffect(() => {
    if (!targetTenantId || !targetAuthId) return

    // Fast path: localStorage already has a value
    try {
      if (localStorage.getItem(storageKey)) return
    } catch { /* ok */ }

    if (targetAuthId === '00000000-0000-0000-0000-000000000001') {
      return
    }

    // Fallback: check DB (handles new device / cleared cache)
    supabase
      .from('profiles')
      .select('tutorials_completed')
      .eq('auth_user_id', targetAuthId)
      .eq('tenant_id', targetTenantId)
      .single()
      .then(({ data }) => {
        if (data?.tutorials_completed?.[storageKey]) {
          try { localStorage.setItem(storageKey, data.tutorials_completed[storageKey]) } catch { /* ok */ }
        } else {
          setVisible(true)
        }
      })
      .catch(() => {})
  }, [targetTenantId, targetAuthId, storageKey, profile])

  const queryTarget = useCallback((step) => {
    if (!step?.selector) { setTargetRect(null); return }
    const el = document.querySelector(step.selector)
    if (el) {
      const r = el.getBoundingClientRect()
      if (r.width > 0 && r.height > 0 && r.top >= 0 && r.top < window.innerHeight) {
        setTargetRect({ x: r.x, y: r.y, w: r.width, h: r.height })
        return
      }
    }
    setTargetRect(null)
  }, [])

  useEffect(() => {
    if (mode !== 'spotlight') return
    const step = steps[stepIdx]

    // Desktop: open sidebar first so elements inside it become visible
    // Mobile: query directly — no sidebar dispatch (avoids Radix focus trap)
    if (isDesktop) {
      window.dispatchEvent(new Event('open-mobile-sidebar'))
    }

    clearTimeout(retryRef.current)
    retryRef.current = setTimeout(() => queryTarget(step), isDesktop ? 340 : 80)

    const onResize = () => queryTarget(step)
    window.addEventListener('resize', onResize)
    return () => {
      clearTimeout(retryRef.current)
      window.removeEventListener('resize', onResize)
    }
  }, [mode, stepIdx, isDesktop, steps, queryTarget])

  if (!visible) return null
  if (profile?.role !== 'owner') return null

  const step   = steps[stepIdx]
  const isLast = stepIdx === steps.length - 1

  const dismiss = async (reason) => {
    const value = reason === 'complete' ? new Date().toISOString() : reason
    try { localStorage.setItem(storageKey, value) } catch { /* ok */ }
    setVisible(false)

    // Sync ke DB — fire and forget. Using direct UPDATE instead of the
    // append_tutorial_completed RPC because the deployed function signature
    // only accepts (p_key, p_value) — passing p_tenant_id makes the RPC return
    // 404. The authenticated role has GRANT UPDATE on tutorials_completed
    // (see supabase/17_column_grants.sql), so a read-merge-write works fine.
    if (targetAuthId && targetTenantId) {
      try {
        const { data: current, error: readErr } = await supabase
          .from('profiles')
          .select('tutorials_completed')
          .eq('auth_user_id', targetAuthId)
          .eq('tenant_id', targetTenantId)
          .single()

        if (readErr) {
          logSupabaseError(readErr, {
            table: 'profiles',
            operation: 'select',
            component: 'TutorialOverlay',
            actionName: 'tutorial.complete.read',
          })
        } else {
          const merged = {
            ...(current?.tutorials_completed || {}),
            [storageKey]: value,
          }
          const { error: writeErr } = await supabase
            .from('profiles')
            .update({ tutorials_completed: merged })
            .eq('auth_user_id', targetAuthId)
            .eq('tenant_id', targetTenantId)

          if (writeErr) {
            logSupabaseError(writeErr, {
              table: 'profiles',
              operation: 'update',
              component: 'TutorialOverlay',
              actionName: 'tutorial.complete.write',
            })
          }
        }
      } catch (err) {
        logSupabaseError(err, {
          table: 'profiles',
          operation: 'update',
          component: 'TutorialOverlay',
          actionName: 'tutorial.complete.exception',
        })
      }
    }
  }

  const goNext = () => {
    if (mode === 'welcome') { setMode('spotlight'); setStepIdx(1); return }
    if (isLast) { dismiss('complete'); return }
    setDirection(1)
    setStepIdx(i => i + 1)
  }

  const goPrev = () => {
    if (mode === 'spotlight' && stepIdx <= 1) {
      setMode('welcome'); setStepIdx(0); setTargetRect(null); return
    }
    setDirection(-1)
    setStepIdx(i => i - 1)
  }

  if (mode === 'welcome') {
    return (
      <WelcomeModal
        step={step} steps={steps} stepIdx={stepIdx}
        direction={direction} isDesktop={isDesktop}
        accent={accent} accentDim={accentDim}
        onNext={goNext} onSkip={() => dismiss('skip')}
      />
    )
  }

  // Mobile: spotlight when element found, navHint-only when not (no sidebar open = no Radix focus trap)
  if (!isDesktop) {
    return (
      <>
        {targetRect && <SpotlightSVG rect={targetRect} accent={accent} />}
        <AnimatePresence mode="wait">
          <MobileStepSheet
            key={stepIdx}
            step={step}
            stepIdx={stepIdx}
            totalSteps={steps.length}
            isLast={isLast}
            accent={accent}
            accentDim={accentDim}
            onNext={goNext}
            onPrev={goPrev}
            onSkip={() => dismiss('skip')}
            hasSpotlight={!!targetRect}
          />
        </AnimatePresence>
      </>
    )
  }

  // Desktop spotlight: spotlight + click blocker + tooltip
  return (
    <>
      <SpotlightSVG rect={targetRect} accent={accent} />
      <ClickBlocker rect={targetRect} />
      <AnimatePresence mode="wait">
        <TooltipCard
          key={stepIdx}
          step={step}
          stepIdx={stepIdx}
          totalSteps={steps.length}
          rect={targetRect}
          isLast={isLast}
          isDesktop={isDesktop}
          accent={accent}
          accentDim={accentDim}
          onNext={goNext}
          onPrev={goPrev}
          onSkip={() => dismiss('skip')}
        />
      </AnimatePresence>
    </>
  )
}
