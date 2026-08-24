import React from 'react'
import { T } from '../constants'

export function Section({ title, icon, iconColor, rightAction, delay = 0, children }) {
  return (
    <div style={{ marginBottom: 18, animation: `fadeInUp 300ms ease ${delay}s both` }}>
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '4px 2px 8px' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
          <span style={{ width: 22, height: 22, borderRadius: 7, background: iconColor + '22', color: iconColor, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
            {icon}
          </span>
          <span style={{ fontSize: 12, fontWeight: 700, color: T.text, letterSpacing: 0.4, textTransform: 'uppercase' }}>{title}</span>
        </div>
        {rightAction}
      </div>
      {children}
    </div>
  )
}

export function SectionLabel({ label }) {
  return (
    <div style={{ fontSize: 11, fontWeight: 700, color: T.textMute, letterSpacing: 0.5, textTransform: 'uppercase', marginBottom: 8, paddingLeft: 2 }}>
      {label}
    </div>
  )
}

export function InfoRow({ label, value, children, noBorder }) {
  return (
    <div style={{
      display: 'flex', alignItems: 'center', justifyContent: 'space-between',
      padding: '10px 4px',
      borderBottom: noBorder ? 'none' : `1px solid ${T.hairline}`,
      gap: 12,
    }}>
      <span style={{ fontSize: 12, color: T.textDim, fontWeight: 500, flexShrink: 0 }}>{label}</span>
      {children || <span style={{ fontSize: 13, color: T.text, fontWeight: 600, textAlign: 'right', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{value}</span>}
    </div>
  )
}
