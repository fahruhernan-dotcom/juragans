import React, { useState, useEffect } from 'react'

export function GlobalErrorDialog() {
  const [errorInfo, setErrorInfo] = useState(null)

  useEffect(() => {
    const handleGlobalError = (event) => {
      try {
        const message = event?.message || event?.error?.message || String(event)
        const stack = event?.error?.stack || 'No stack trace available'
        const filename = event?.filename || ''
        const lineno = event?.lineno || ''

        // Abaikan error dari ekstensi browser (Chrome extensions, add-ons)
        if (
          filename.includes('chrome-extension://') ||
          filename.includes('moz-extension://') ||
          stack.includes('chrome-extension://') ||
          stack.includes('moz-extension://') ||
          message.includes('chrome-extension://')
        ) {
          return
        }

        console.error('[GlobalErrorCaught]:', message, stack)
        setErrorInfo({
          type: 'Runtime Error',
          message,
          source: filename ? `${filename}:${lineno}` : 'Unknown Source',
          stack,
          timestamp: new Date().toLocaleTimeString(),
        })
      } catch (e) {
        console.warn('Error handling error:', e)
      }
    }

    const handleRejection = (event) => {
      try {
        const reason = event?.reason
        const message = reason?.message || String(reason || 'Unhandled Promise Rejection')
        const stack = reason?.stack || 'No stack trace'

        // Abaikan promise rejection dari ekstensi browser pihak ketiga
        if (
          stack.includes('chrome-extension://') ||
          stack.includes('moz-extension://') ||
          message.includes('chrome-extension://') ||
          (typeof reason === 'string' && reason.includes('chrome-extension://'))
        ) {
          return
        }

        console.error('[UnhandledPromiseRejectionCaught]:', message, stack)
        setErrorInfo({
          type: 'Promise Rejection',
          message,
          source: 'Async / Network',
          stack,
          timestamp: new Date().toLocaleTimeString(),
        })
      } catch (e) {
        console.warn('Error handling rejection:', e)
      }
    }

    window.addEventListener('error', handleGlobalError)
    window.addEventListener('unhandledrejection', handleRejection)

    return () => {
      window.removeEventListener('error', handleGlobalError)
      window.removeEventListener('unhandledrejection', handleRejection)
    }
  }, [])

  if (!errorInfo) return null

  const copyToClipboard = () => {
    const text = `=== JURAGANS ERROR DIAGNOSTIC REPORT ===\nType: ${errorInfo.type}\nTime: ${errorInfo.timestamp}\nSource: ${errorInfo.source}\nMessage: ${errorInfo.message}\nStack: ${errorInfo.stack}\nUserAgent: ${navigator.userAgent}`
    navigator.clipboard?.writeText?.(text).then(() => {
      alert('Info error berhasil disalin ke clipboard!')
    }).catch(() => {
      prompt('Salin teks error di bawah:', text)
    })
  }

  const handleResetSession = () => {
    try {
      localStorage.clear()
      sessionStorage.clear()
    } catch {
      /* ok */
    }
    window.location.href = '/login'
  }

  return (
    <div
      style={{
        position: 'fixed',
        inset: 0,
        zIndex: 999999,
        background: 'rgba(5, 10, 15, 0.92)',
        backdropFilter: 'blur(8px)',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        padding: '16px',
        fontFamily: "'Sora', -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif",
      }}
    >
      <div
        style={{
          background: '#111C24',
          border: '1px solid rgba(239, 68, 68, 0.4)',
          borderRadius: '18px',
          width: '100%',
          maxWidth: '520px',
          maxHeight: '85vh',
          display: 'flex',
          flexDirection: 'column',
          boxShadow: '0 20px 50px rgba(0,0,0,0.6)',
          overflow: 'hidden',
        }}
      >
        {/* Header */}
        <div
          style={{
            padding: '16px 20px',
            background: 'rgba(239, 68, 68, 0.12)',
            borderBottom: '1px solid rgba(239, 68, 68, 0.2)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
          }}
        >
          <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
            <span style={{ fontSize: '20px' }}>🚨</span>
            <div>
              <h3 style={{ margin: 0, fontSize: '15px', fontWeight: 800, color: '#F87171' }}>
                Diagnostik Masalah Terdeteksi
              </h3>
              <span style={{ fontSize: '11px', color: '#94A3B8' }}>
                {errorInfo.type} • {errorInfo.timestamp}
              </span>
            </div>
          </div>
          <button
            onClick={() => setErrorInfo(null)}
            style={{
              background: 'rgba(255,255,255,0.08)',
              border: 'none',
              borderRadius: '8px',
              color: '#CBD5E1',
              padding: '6px 10px',
              fontSize: '12px',
              cursor: 'pointer',
            }}
          >
            ✕ Tutup
          </button>
        </div>

        {/* Content */}
        <div style={{ padding: '16px 20px', overflowY: 'auto', flex: 1, display: 'flex', flexDirection: 'column', gap: '12px' }}>
          <div>
            <span style={{ fontSize: '11px', color: '#64748B', fontWeight: 700, textTransform: 'uppercase' }}>
              Pesan Error:
            </span>
            <p
              style={{
                margin: '4px 0 0',
                fontSize: '13px',
                fontWeight: 600,
                color: '#F1F5F9',
                background: 'rgba(0,0,0,0.3)',
                padding: '10px 12px',
                borderRadius: '10px',
                border: '1px solid rgba(255,255,255,0.06)',
                wordBreak: 'break-word',
              }}
            >
              {errorInfo.message}
            </p>
          </div>

          <div>
            <span style={{ fontSize: '11px', color: '#64748B', fontWeight: 700, textTransform: 'uppercase' }}>
              Detail Lokasi:
            </span>
            <p style={{ margin: '4px 0 0', fontSize: '11px', color: '#94A3B8', wordBreak: 'break-all' }}>
              {errorInfo.source}
            </p>
          </div>

          <div>
            <span style={{ fontSize: '11px', color: '#64748B', fontWeight: 700, textTransform: 'uppercase' }}>
              Stack Trace:
            </span>
            <pre
              style={{
                margin: '4px 0 0',
                fontSize: '10px',
                color: '#CBD5E1',
                background: '#070D12',
                padding: '10px 12px',
                borderRadius: '10px',
                border: '1px solid rgba(255,255,255,0.06)',
                overflowX: 'auto',
                maxHeight: '140px',
                whiteSpace: 'pre-wrap',
                wordBreak: 'break-all',
              }}
            >
              {errorInfo.stack}
            </pre>
          </div>
        </div>

        {/* Footer Actions */}
        <div
          style={{
            padding: '14px 20px',
            background: 'rgba(0,0,0,0.2)',
            borderTop: '1px solid rgba(255,255,255,0.06)',
            display: 'flex',
            gap: '8px',
            flexWrap: 'wrap',
          }}
        >
          <button
            onClick={copyToClipboard}
            style={{
              flex: 1,
              background: '#0284C7',
              color: 'white',
              border: 'none',
              borderRadius: '10px',
              padding: '10px 14px',
              fontSize: '12px',
              fontWeight: 700,
              cursor: 'pointer',
            }}
          >
            📋 Salin Log Error
          </button>
          <button
            onClick={handleResetSession}
            style={{
              flex: 1,
              background: 'rgba(239, 68, 68, 0.2)',
              color: '#F87171',
              border: '1px solid rgba(239, 68, 68, 0.4)',
              borderRadius: '10px',
              padding: '10px 14px',
              fontSize: '12px',
              fontWeight: 700,
              cursor: 'pointer',
            }}
          >
            🔄 Reset & Masuk Ulang
          </button>
        </div>
      </div>
    </div>
  )
}
