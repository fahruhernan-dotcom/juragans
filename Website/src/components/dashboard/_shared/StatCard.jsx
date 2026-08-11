import { motion } from 'framer-motion'

export default function StatCard({ label, value, sub, color = '#F1F5F9', icon, onClick }) {
  return (
    <motion.div
      whileTap={onClick ? { scale: 0.97 } : {}}
      onClick={onClick}
      style={{
        background: '#111C24',
        border: '1px solid rgba(255,255,255,0.07)',
        borderRadius: '16px',
        padding: '16px',
        cursor: onClick ? 'pointer' : 'default',
      }}
    >
      <div style={{
        fontSize: '11px',
        fontWeight: 600,
        color: '#4B6478',
        textTransform: 'uppercase',
        letterSpacing: '0.8px',
        marginBottom: '8px',
        display: 'flex',
        alignItems: 'center',
        gap: '6px',
      }}>
        {icon}
        {label}
      </div>
      <div style={{
        fontFamily: 'Sora',
        fontSize: '20px',
        fontWeight: 800,
        color,
        fontVariantNumeric: 'tabular-nums',
        lineHeight: 1.2,
      }}>
        {value}
      </div>
      {sub && (
        <div style={{ fontSize: '11px', color: '#4B6478', marginTop: '4px' }}>
          {sub}
        </div>
      )}
    </motion.div>
  )
}
