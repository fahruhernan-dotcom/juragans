import React from 'react'
import { Building2, LogOut } from 'lucide-react'
import { supabase } from '@/lib/supabase'

export default function RPADashboard() {
  return (
    <div style={{ 
      minHeight: '100vh', 
      background: '#06090F', 
      display: 'flex', 
      flexDirection: 'column', 
      alignItems: 'center', 
      justifyContent: 'center',
      padding: '20px',
      textAlign: 'center',
      color: '#F1F5F9'
    }}>
      <div style={{
        width: '64px',
        height: '64px',
        borderRadius: '20px',
        background: 'rgba(59,130,246,0.1)',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        color: '#3B82F6',
        marginBottom: '20px'
      }}>
        <Building2 size={32} />
      </div>
      
      <h1 style={{ fontFamily: 'Sora', fontSize: '24px', fontWeight: 800, marginBottom: '12px' }}>
        Dashboard RPA / Buyer
      </h1>
      <p style={{ color: '#4B6478', maxWidth: '280px', marginBottom: '32px', lineHeight: '1.6' }}>
        Fitur pemesanan ayam dan pelacakan pengiriman sedang dalam tahap pengembangan (Fase 3).
      </p>

      <div style={{
        padding: '12px 20px',
        background: 'rgba(59,130,246,0.08)',
        border: '1px solid rgba(59,130,246,0.15)',
        borderRadius: '12px',
        fontSize: '13px',
        fontWeight: 600,
        color: '#3B82F6',
        marginBottom: '40px'
      }}>
        🚀 SEGERA HADIR
      </div>

      <button 
        onClick={() => supabase.auth.signOut({ scope: 'local' })}
        style={{
          background: 'none',
          border: '1px solid rgba(255,255,255,0.1)',
          borderRadius: '12px',
          padding: '12px 24px',
          color: '#94A3B8',
          fontSize: '14px',
          fontWeight: 600,
          display: 'flex',
          alignItems: 'center',
          gap: '8px',
          cursor: 'pointer'
        }}
      >
        <LogOut size={18} /> Keluar
      </button>
    </div>
  )
}
