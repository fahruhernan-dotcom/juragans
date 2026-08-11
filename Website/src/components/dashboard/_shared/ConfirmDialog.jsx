import { motion, AnimatePresence } from 'framer-motion'

export default function ConfirmDialog({ isOpen, onClose, onConfirm, title, message, confirmLabel = 'Hapus', cancelLabel = 'Batal', isDanger = true }) {
  return (
    <AnimatePresence>
      {isOpen && (
        <>
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={onClose}
            style={{
              position: 'fixed', inset: 0,
              background: 'rgba(0,0,0,0.7)',
              backdropFilter: 'blur(4px)',
              zIndex: 300,
            }}
          />
          <motion.div
            initial={{ opacity: 0, scale: 0.9, y: 20 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.9, y: 20 }}
            style={{
              position: 'fixed',
              top: '50%',
              left: '50%',
              width: '90%',
              maxWidth: '340px',
              background: '#111C24',
              borderRadius: '20px',
              border: '1px solid rgba(255,255,255,0.08)',
              padding: '24px',
              zIndex: 301,
              x: '-50%',
              y: '-50%',
            }}
          >
            <div style={{
              fontFamily: 'Sora',
              fontSize: '18px',
              fontWeight: 700,
              color: '#F1F5F9',
              marginBottom: '12px',
            }}>
              {title}
            </div>
            <div style={{
              fontSize: '14px',
              color: '#94A3B8',
              lineHeight: 1.6,
              marginBottom: '24px',
            }}>
              {message}
            </div>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px' }}>
              <button
                onClick={onClose}
                style={{
                  padding: '12px',
                  borderRadius: '12px',
                  background: 'rgba(255,255,255,0.06)',
                  border: 'none',
                  color: '#94A3B8',
                  fontFamily: 'DM Sans',
                  fontWeight: 600,
                  fontSize: '14px',
                  cursor: 'pointer',
                }}
              >
                {cancelLabel}
              </button>
              <button
                onClick={onConfirm}
                style={{
                  padding: '12px',
                  borderRadius: '12px',
                  background: isDanger ? '#F87171' : '#10B981',
                  border: 'none',
                  color: isDanger ? 'white' : '#0C1319',
                  fontFamily: 'DM Sans',
                  fontWeight: 700,
                  fontSize: '14px',
                  cursor: 'pointer',
                  boxShadow: isDanger ? '0 4px 12px rgba(248,113,113,0.2)' : '0 4px 12px rgba(16, 185, 129, 0.2)',
                }}
              >
                {confirmLabel}
              </button>
            </div>
          </motion.div>
        </>
      )}
    </AnimatePresence>
  )
}
