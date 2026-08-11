export default function EmptyState({ icon = '🐔', title, desc, action }) {
  return (
    <div style={{
      display: 'flex',
      flexDirection: 'column',
      alignItems: 'center',
      justifyContent: 'center',
      padding: '48px 24px',
      textAlign: 'center',
      gap: '12px',
    }}>
      <div style={{ fontSize: '48px', lineHeight: 1 }}>{icon}</div>
      <div style={{
        fontFamily: 'Sora',
        fontSize: '16px',
        fontWeight: 700,
        color: '#F1F5F9',
      }}>
        {title}
      </div>
      {desc && (
        <div style={{ fontSize: '14px', color: '#4B6478', lineHeight: 1.6, maxWidth: '260px' }}>
          {desc}
        </div>
      )}
      {action && (
        <div style={{ marginTop: '8px' }}>
          {action}
        </div>
      )}
    </div>
  )
}
