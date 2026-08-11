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
      return (
        <div style={{
          padding: '40px 20px',
          textAlign: 'center',
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          gap: '12px'
        }}>
          <div style={{
            width: 56, height: 56,
            borderRadius: '50%',
            background: 'rgba(248,113,113,0.10)',
            border: '1px solid rgba(248,113,113,0.20)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            fontSize: 24
          }}>
            ⚠️
          </div>
          <p style={{
            fontFamily: 'Sora',
            fontSize: 16,
            fontWeight: 700,
            color: '#F1F5F9',
            margin: 0
          }}>
            Terjadi kesalahan
          </p>
          <p style={{
            fontSize: 13,
            color: '#4B6478',
            margin: 0
          }}>
            {this.state.error?.message || 'Unknown error'}
          </p>
          <button
            onClick={() => this.setState({
              hasError: false, error: null
            })}
            style={{
              background: '#021a02',
              color: 'white',
              border: 'none',
              borderRadius: 8,
              padding: '8px 16px',
              fontSize: 13,
              fontWeight: 600,
              cursor: 'pointer',
              marginTop: 4
            }}
          >
            Coba Lagi
          </button>
        </div>
      )
    }
    
    return this.props.children
  }
}
