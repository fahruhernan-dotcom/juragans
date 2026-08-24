import { Component } from 'react'
import { logError } from '@/lib/logger/errorLogger'

export default class ErrorBoundary extends Component {
  constructor(props) {
    super(props)
    this.state = { hasError: false, error: null }
  }
  
  static getDerivedStateFromError(error) {
    return { hasError: true, error }
  }
  
  componentDidCatch(error, info) {
    console.error('ErrorBoundary caught:', error, info)
    
    // Auto-reload on ChunkLoadError / failed dynamically imported module
    const isChunkLoadError = error && (
      /failed to fetch dynamically imported module/i.test(error.message) ||
      /chunkloaderror/i.test(error.message) ||
      error.message?.includes('Loading chunk')
    );

    if (isChunkLoadError) {
      const lastReload = sessionStorage.getItem('last_chunk_reload');
      const now = Date.now();
      // Only reload if the last reload was more than 10 seconds ago to prevent infinite loop if offline
      if (!lastReload || now - parseInt(lastReload, 10) > 10000) {
        sessionStorage.setItem('last_chunk_reload', String(now));
        console.warn('Dynamic import chunk failed. Forcing page reload to sync assets...');
        window.location.reload();
        return;
      }
    }

    // Fire-and-forget — never await in lifecycle methods
    logError({
      level: 'error',
      source: 'react_error_boundary',
      component: this.props.name || 'ErrorBoundary',
      error: {
        message: error?.message,
        stack: error?.stack,
        code: null,
        details: info?.componentStack
          ? String(info.componentStack).slice(0, 1000)
          : null,
      },
      metadata: {},
    })
  }
  
  render() {
    if (this.state.hasError) {
      const err = this.state.error
      const copyError = () => {
        const text = `=== ERROR BOUNDARY LOG ===\nMessage: ${err?.message}\nStack: ${err?.stack}\nUserAgent: ${navigator.userAgent}`
        navigator.clipboard?.writeText?.(text).then(() => {
          alert('Log error berhasil disalin!')
        }).catch(() => {
          prompt('Salin log error:', text)
        })
      }

      const resetSession = () => {
        try {
          localStorage.clear()
          sessionStorage.clear()
        } catch {
          /* ok */
        }
        window.location.href = '/login'
      }

      return (
        <div style={{
          minHeight: '80vh',
          padding: '24px 16px',
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          justifyContent: 'center',
          fontFamily: "'Sora', -apple-system, BlinkMacSystemFont, sans-serif"
        }}>
          <div style={{
            background: '#111C24',
            border: '1px solid rgba(239, 68, 68, 0.3)',
            borderRadius: '16px',
            padding: '20px',
            maxWidth: '480px',
            width: '100%',
            boxShadow: '0 12px 32px rgba(0,0,0,0.5)',
            textAlign: 'center',
            display: 'flex',
            flexDirection: 'column',
            gap: '12px'
          }}>
            <div style={{
              width: 52, height: 52,
              borderRadius: '50%',
              background: 'rgba(239, 68, 68, 0.12)',
              border: '1px solid rgba(239, 68, 68, 0.25)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              fontSize: 24,
              margin: '0 auto'
            }}>
              ⚠️
            </div>
            
            <h2 style={{
              fontSize: 16,
              fontWeight: 800,
              color: '#F87171',
              margin: 0
            }}>
              Terjadi Kesalahan Tampilan
            </h2>
            
            <div style={{
              background: 'rgba(0,0,0,0.3)',
              padding: '10px 12px',
              borderRadius: '10px',
              border: '1px solid rgba(255,255,255,0.06)',
              textAlign: 'left'
            }}>
              <p style={{
                fontSize: 12,
                color: '#F1F5F9',
                fontWeight: 600,
                margin: '0 0 6px 0',
                wordBreak: 'break-word'
              }}>
                {err?.message || 'Unknown render error'}
              </p>
              {err?.stack && (
                <pre style={{
                  fontSize: 10,
                  color: '#94A3B8',
                  margin: 0,
                  maxHeight: '100px',
                  overflowY: 'auto',
                  whiteSpace: 'pre-wrap',
                  wordBreak: 'break-all'
                }}>
                  {err.stack.slice(0, 500)}
                </pre>
              )}
            </div>

            <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap' }}>
              <button
                onClick={() => this.setState({ hasError: false, error: null })}
                style={{
                  flex: 1,
                  background: '#16A34A',
                  color: 'white',
                  border: 'none',
                  borderRadius: 8,
                  padding: '10px',
                  fontSize: 12,
                  fontWeight: 700,
                  cursor: 'pointer'
                }}
              >
                Coba Lagi
              </button>
              <button
                onClick={copyError}
                style={{
                  flex: 1,
                  background: '#0284C7',
                  color: 'white',
                  border: 'none',
                  borderRadius: 8,
                  padding: '10px',
                  fontSize: 12,
                  fontWeight: 700,
                  cursor: 'pointer'
                }}
              >
                📋 Salin Log
              </button>
              <button
                onClick={resetSession}
                style={{
                  flex: 1,
                  background: 'rgba(239,68,68,0.2)',
                  color: '#F87171',
                  border: '1px solid rgba(239,68,68,0.3)',
                  borderRadius: 8,
                  padding: '10px',
                  fontSize: 12,
                  fontWeight: 700,
                  cursor: 'pointer'
                }}
              >
                🔄 Reset
              </button>
            </div>
          </div>
        </div>
      )
    }
    
    return this.props.children
  }
}
