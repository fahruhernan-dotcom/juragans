export const GRACE_DAYS = 3
export const WARNING_DAYS = 7
export const DEVELOPER_WA = import.meta.env?.VITE_WHATSAPP_NUMBER || '082133859391'

export const LICENSE_STATUS = {
  ACTIVE: 'ACTIVE',
  WARNING: 'WARNING',
  GRACE: 'GRACE',
  LOCKED: 'LOCKED',
  PERMANENT: 'PERMANENT'
}

export const STATUS_COLORS = {
  ACTIVE: { text: '#34D399', bg: 'rgba(52, 211, 153, 0.1)', border: 'rgba(52, 211, 153, 0.2)' },
  WARNING: { text: '#FBBF24', bg: 'rgba(251, 191, 36, 0.1)', border: 'rgba(251, 191, 36, 0.2)' },
  GRACE: { text: '#FB923C', bg: 'rgba(251, 146, 60, 0.1)', border: 'rgba(251, 146, 60, 0.2)' },
  LOCKED: { text: '#F87171', bg: 'rgba(248, 113, 113, 0.1)', border: 'rgba(248, 113, 113, 0.2)' },
  PERMANENT: { text: '#A78BFA', bg: 'rgba(167, 139, 250, 0.1)', border: 'rgba(167, 139, 250, 0.2)' }
}
