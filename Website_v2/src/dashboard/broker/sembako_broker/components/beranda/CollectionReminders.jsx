// CollectionReminders.jsx — Overdue collection warnings
import { useMemo } from 'react'
import { motion } from 'framer-motion'
import { Clock, ChevronRight } from 'lucide-react'
import { formatIDR } from '@/lib/format'
import { C } from '../sembakoSaleUtils'

const MC = {
  bg: 'var(--bg-page)',
  card: 'var(--bg-surface)',
  input: 'var(--bg-subtle)',
  accent: 'var(--brand-500)',
  amber: '#D97706',
  green: '#16A34A',
  red: '#DC2626',
  text: 'var(--text-primary)',
  muted: 'var(--text-muted)',
  border: 'var(--border-soft)',
  borderAm: 'var(--border-muted)',
}

export function CollectionReminders({ sales, navigate, brokerBase, maxItems = 5, isMobile }) {
  const reminders = useMemo(() => {
    const now = new Date()
    return sales
      .filter(s => s.payment_status !== 'lunas' && s.due_date && !s.is_deleted)
      .map(s => {
        const due = new Date(s.due_date)
        const diff = Math.ceil((due - now) / (1000 * 60 * 60 * 24))
        return { ...s, daysDiff: diff }
      })
      .filter(s => s.daysDiff <= 3) // Today, overdue, or next 3 days
      .sort((a, b) => a.daysDiff - b.daysDiff)
  }, [sales])

  const visibleReminders = useMemo(() => reminders.slice(0, maxItems), [reminders, maxItems])

  if (reminders.length === 0) return null

  return (
    <motion.div initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }}
      style={{
        background: '#FEF2F2',
        border: '1px solid #FEE2E2',
        borderRadius: '16px',
        padding: '14px',
        marginBottom: isMobile ? '12px' : '24px',
        boxShadow: '0 1px 3px rgba(220,38,38,0.03)',
      }}
    >
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '12px' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
          <Clock size={16} color={MC.red} />
          <span style={{ fontSize: '11px', fontWeight: 800, color: MC.red, letterSpacing: '0.1em' }}>PENAGIHAN JATUH TEMPO</span>
          <span style={{ background: '#FEE2E2', color: MC.red, fontSize: '9px', fontWeight: 800, padding: '2px 6px', borderRadius: '5px' }}>{reminders.length}</span>
        </div>
        {isMobile && reminders.length > maxItems && (
          <button
            onClick={() => navigate(`${brokerBase}/penjualan`)}
            style={{ background: 'transparent', border: 'none', cursor: 'pointer', color: MC.accent, fontSize: '11px', fontWeight: 700, padding: 0 }}
          >
            Lihat semua
          </button>
        )}
      </div>
      <div style={isMobile ? { display: 'flex', flexDirection: 'column', gap: '8px' } : { display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(280px, 1fr))', gap: '10px' }}>
        {visibleReminders.map(s => (
          <div 
            key={s.id} 
            onClick={() => navigate(`${brokerBase}/penjualan?saleId=${s.id}`)}
            style={{ 
              background: MC.card, 
              borderRadius: '12px', 
              padding: '12px', 
              border: '1px solid #FCA5A5', 
              display: 'flex', 
              justifyContent: 'space-between', 
              alignItems: 'center', 
              boxShadow: '0 1px 2px rgba(0,0,0,0.03)',
              cursor: 'pointer',
            }}
            className="hover:bg-slate-50 dark:hover:bg-white/5 active:scale-[0.98] transition-all"
          >
             <div>
                <p style={{ fontSize: '13px', fontWeight: 800, color: MC.text }}>{s.sembako_customers?.customer_name || s.customer_name}</p>
                <p style={{ fontSize: '11px', color: s.daysDiff < 0 ? MC.red : MC.amber, fontWeight: 750 }}>
                  {s.daysDiff < 0 ? `Telat ${Math.abs(s.daysDiff)} hari` : s.daysDiff === 0 ? 'Jatuh tempo HARI INI' : `H-${s.daysDiff} Jatuh tempo`}
                </p>
             </div>
             <div style={{ textAlign: 'right' }}>
                <p style={{ fontSize: '14px', fontWeight: 850, color: MC.text }}>{formatIDR(s.remaining_amount)}</p>
                <span 
                 style={{ fontSize: '10px', color: MC.accent, fontWeight: 750, display: 'inline-block' }}>
                   Detail <ChevronRight size={10} style={{ display: 'inline', verticalAlign: 'middle', marginTop: '-2px' }} />
                </span>
             </div>
          </div>
        ))}
      </div>
    </motion.div>
  )
}
