import React from 'react'

export default function ComingSoon({ title, icon }) {
  return (
    <div style={{ 
      minHeight: '100vh', 
      background: '#06090F',
      display: 'flex', 
      flexDirection: 'column',
      alignItems: 'center', 
      justifyContent: 'center',
      padding: '40px 20px', 
      textAlign: 'center',
      color: '#F1F5F9'
    }}>
      <div style={{ fontSize: '48px', marginBottom: '16px' }}>{icon}</div>
      <div style={{ 
        fontFamily: 'Sora', 
        fontSize: '20px',
        fontWeight: 800, 
        color: '#F1F5F9', 
        marginBottom: '8px' 
      }}>
        {title}
      </div>
      <div style={{ 
        fontSize: '14px', 
        color: '#4B6478', 
        lineHeight: 1.6,
        maxWidth: '260px' 
      }}>
        Halaman ini sedang dalam pengembangan. Segera hadir!
      </div>
      <button 
        onClick={() => window.history.back()}
        style={{
          marginTop: '24px',
          background: 'rgba(255,255,255,0.05)',
          border: '1px solid rgba(255,255,255,0.1)',
          borderRadius: '12px',
          padding: '10px 20px',
          color: '#94A3B8',
          fontSize: '13px',
          fontWeight: 600,
          cursor: 'pointer'
        }}
      >
        Kembali
      </button>
    </div>
  )
}
