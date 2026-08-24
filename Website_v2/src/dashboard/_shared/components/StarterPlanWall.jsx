import React from 'react'
import { useNavigate } from 'react-router-dom'
import { Lock, Sparkles, ArrowRight } from 'lucide-react'

/**
 * StarterPlanWall
 * Shown in place of any Pro-gated page when the active tenant is on the Starter plan.
 * Render this as a full page replacement — no redirect.
 */
export default function StarterPlanWall({
  featureName = 'Fitur PRO',
  description  = 'Tugas Harian, Penugasan Tim, dan Manajemen Tim tersedia di paket Pro.',
  upgradePath  = '/dashboard/upgrade',
}) {
  const navigate = useNavigate()

  return (
    <div
      style={{
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        justifyContent: 'center',
        minHeight: '60vh',
        padding: '32px 24px',
        textAlign: 'center',
        gap: 0,
      }}
    >
      {/* Lock icon badge */}
      <div
        style={{
          width: 72,
          height: 72,
          borderRadius: 22,
          background: 'linear-gradient(135deg, oklch(0.65 0.20 290 / 0.18), oklch(0.65 0.20 290 / 0.06))',
          border: '1px solid oklch(0.65 0.20 290 / 0.35)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          marginBottom: 24,
          boxShadow: '0 12px 36px oklch(0.65 0.20 290 / 0.18)',
        }}
      >
        <Lock size={30} color="oklch(0.65 0.20 290)" strokeWidth={2} />
      </div>

      {/* Badge */}
      <span
        style={{
          display: 'inline-flex',
          alignItems: 'center',
          gap: 5,
          padding: '4px 12px',
          borderRadius: 999,
          background: 'oklch(0.65 0.20 290 / 0.12)',
          border: '1px solid oklch(0.65 0.20 290 / 0.30)',
          fontSize: 11,
          fontWeight: 700,
          letterSpacing: 0.6,
          textTransform: 'uppercase',
          color: 'oklch(0.70 0.20 290)',
          marginBottom: 14,
        }}
      >
        <Sparkles size={10} strokeWidth={2.5} />
        {featureName}
      </span>

      {/* Description */}
      <p
        style={{
          fontSize: 14,
          color: '#94A3B8',
          lineHeight: 1.65,
          maxWidth: 280,
          marginBottom: 28,
          fontFamily: 'DM Sans, sans-serif',
        }}
      >
        {description}
      </p>

      {/* Primary CTA */}
      <button
        onClick={() => navigate(upgradePath)}
        style={{
          display: 'inline-flex',
          alignItems: 'center',
          gap: 8,
          padding: '13px 24px',
          borderRadius: 14,
          border: 'none',
          cursor: 'pointer',
          background: 'oklch(0.65 0.20 290)',
          color: '#fff',
          fontSize: 14,
          fontWeight: 700,
          letterSpacing: -0.1,
          fontFamily: 'DM Sans, sans-serif',
          boxShadow: '0 8px 24px oklch(0.65 0.20 290 / 0.40)',
          transition: 'transform 150ms, box-shadow 150ms',
        }}
        onMouseEnter={e => { e.currentTarget.style.transform = 'translateY(-1px)'; e.currentTarget.style.boxShadow = '0 12px 32px oklch(0.65 0.20 290 / 0.55)' }}
        onMouseLeave={e => { e.currentTarget.style.transform = 'none'; e.currentTarget.style.boxShadow = '0 8px 24px oklch(0.65 0.20 290 / 0.40)' }}
      >
        <Sparkles size={15} strokeWidth={2.5} />
        Upgrade ke Pro
        <ArrowRight size={14} strokeWidth={2.5} />
      </button>
    </div>
  )
}
