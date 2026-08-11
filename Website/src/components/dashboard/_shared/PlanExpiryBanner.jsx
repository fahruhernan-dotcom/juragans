import { Link } from 'react-router-dom'
import { getSubscriptionStatus } from '@/lib/subscriptionUtils'

export function PlanExpiryBanner({ tenant }) {
  const sub = getSubscriptionStatus(tenant)
  if (sub.plan === 'starter' || (!sub.isExpiringSoon && sub.status !== 'expired')) return null

  const isExpired = sub.status === 'expired'
  const bg     = isExpired ? 'rgba(239,68,68,0.1)'  : 'rgba(251,191,36,0.08)'
  const border = isExpired ? 'rgba(239,68,68,0.25)' : 'rgba(251,191,36,0.2)'
  const color  = isExpired ? '#F87171'               : '#FBBF24'

  return (
    <div style={{
      background: bg, borderBottom: `1px solid ${border}`,
      padding: '8px 16px', display: 'flex', alignItems: 'center',
      justifyContent: 'space-between', gap: '12px',
    }}>
      <p style={{ fontSize: '12px', fontWeight: 700, color, margin: 0 }}>
        {isExpired
          ? '⚠️ Langganan kamu sudah berakhir. Beberapa fitur terkunci.'
          : `⏰ Langganan berakhir dalam ${sub.daysLeft} hari.`}
      </p>
      <Link
        to="/upgrade"
        style={{
          fontSize: '11px', fontWeight: 900, color,
          border: `1px solid ${color}`, borderRadius: '8px',
          padding: '3px 10px', whiteSpace: 'nowrap', textDecoration: 'none',
          background: isExpired ? 'rgba(239,68,68,0.08)' : 'rgba(251,191,36,0.08)',
        }}
      >
        Perpanjang →
      </Link>
    </div>
  )
}
