import React, { useEffect, useRef, useState } from 'react'
import { X, QrCode } from 'lucide-react'
import { toast } from 'sonner'
import { logError } from '@/lib/logger/errorLogger'

// Strict regex for UUID v4
const UUID_REGEX = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i

function isValidUuid(str) {
  return UUID_REGEX.test(str)
}

// Strict parser
function parseAnimalIdFromQr(qrText) {
  if (!qrText) return null
  const text = qrText.trim()

  // 1. Format: animal:<uuid>
  if (text.startsWith('animal:')) {
    const id = text.substring('animal:'.length).trim()
    if (isValidUuid(id)) return id
  }

  // 2. Format: ternakos:animal:<uuid>
  if (text.startsWith('ternakos:animal:')) {
    const id = text.substring('ternakos:animal:'.length).trim()
    if (isValidUuid(id)) return id
  }

  // 3. URLs
  try {
    const isFullUrl = text.startsWith('http://') || text.startsWith('https://')
    const isSameOriginOrFull = isFullUrl || text.startsWith('/')

    if (isSameOriginOrFull) {
      // Parse URL
      const urlString = isFullUrl ? text : `https://ternakos.my.id${text}`
      const url = new URL(urlString)

      // Restrict domains to ternakos.my.id, localhost, or browser same-origin hostname
      const isAllowedDomain = 
        url.hostname === 'ternakos.my.id' || 
        url.hostname === 'localhost' || 
        url.hostname === window.location.hostname

      if (isAllowedDomain) {
        const animalId = url.searchParams.get('animalId')
        if (animalId && isValidUuid(animalId)) {
          return animalId
        }
      }
    }
  } catch (_e) {
    // URL parsing failed
  }

  return null
}

export default function QRScannerModal({ onClose, onScanSuccess }) {
  const [errorMsg, setErrorMsg] = useState('')
  const [isProcessing, setIsProcessing] = useState(false)
  const qrCodeRef = useRef(null)

  useEffect(() => {
    let html5Qrcode = null

    const startScanner = async () => {
      try {
        let Html5QrcodeClass = window.Html5Qrcode
        if (!Html5QrcodeClass) {
          try {
            const dynamicImport = new Function('specifier', 'return import(specifier)')
            const mod = await dynamicImport('html5-qrcode')
            Html5QrcodeClass = mod?.Html5Qrcode || mod?.default
          } catch {
            /* html5-qrcode is optional */
          }
        }


        if (!Html5QrcodeClass) {
          setErrorMsg('Modul pemindai QR belum terpasang.')
          return
        }

        html5Qrcode = new Html5QrcodeClass('qr-reader-container')
        qrCodeRef.current = html5Qrcode

        const config = {
          fps: 10,
          qrbox: (width, height) => {
            const size = Math.min(width, height) * 0.7
            return { width: size, height: size }
          },
          aspectRatio: 1.0,
        }

        await html5Qrcode.start(
          { facingMode: 'environment' },
          config,
          (decodedText) => {
            // Process lock to prevent double scan / navigation
            if (isProcessing) return
            
            const animalId = parseAnimalIdFromQr(decodedText)
            if (animalId) {
              setIsProcessing(true)
              onScanSuccess(animalId)
            } else {
              toast.error('QR ternak tidak valid atau bukan milik bisnis aktif.')
            }
          },
          () => {
            // Ignore scan failure (silent tracking frames)
          }
        )
      } catch (err) {
        const errMsg = err?.message || String(err)
        setErrorMsg('Izin kamera dibutuhkan untuk scan QR.')
        toast.error('Izin kamera dibutuhkan untuk scan QR.')
        logError({
          level: 'warn',
          source: 'frontend',
          component: 'QRScannerModal',
          actionName: 'camera_start',
          error: { message: errMsg, code: 'QR_CAMERA_START_FAILED' },
          metadata: { browser: navigator?.userAgent?.slice(0, 120) ?? null },
        })
      }
    }

    startScanner()


    return () => {
      if (qrCodeRef.current) {
        if (qrCodeRef.current.isScanning) {
          qrCodeRef.current.stop().catch((err) => {
            console.error('Html5Qrcode stop error:', err)
          })
        }
      }
    }
  }, [onScanSuccess, isProcessing])

  return (
    <div className="fixed inset-0 z-[5000] flex flex-col justify-end bg-black/85 backdrop-blur-md">
      {/* Tap out area to close */}
      <div className="flex-1" onClick={onClose} />

      {/* Main scanner container */}
      <div 
        className="w-full max-w-[480px] mx-auto bg-[#0A1015]/95 border-t border-white/[0.08] rounded-t-[2rem] px-6 pt-6 pb-[calc(24px+env(safe-area-inset-bottom,0px))] flex flex-col items-center relative overflow-hidden"
        style={{ height: '75dvh' }}
      >
        {/* Decorative background blur */}
        <div className="absolute -top-20 left-1/2 -translate-x-1/2 w-48 h-48 bg-green-500/10 rounded-full blur-3xl pointer-events-none" />

        {/* Top Handle / Drag indicator */}
        <div className="w-12 h-1 bg-white/10 rounded-full mb-4 shrink-0" />

        {/* Header */}
        <div className="w-full flex items-center justify-between mb-6 shrink-0 z-10">
          <div className="flex items-center gap-2.5">
            <div className="w-9 h-9 rounded-xl bg-green-500/10 border border-green-500/20 flex items-center justify-center">
              <QrCode size={18} className="text-green-400" />
            </div>
            <div>
              <h3 className="font-['Sora'] font-black text-base text-white">Pindai QR Ternak</h3>
              <p className="text-[10px] text-[#4B6478] font-bold uppercase tracking-wider">Arahkan kamera ke name tag ternak</p>
            </div>
          </div>
          <button 
            onClick={onClose}
            className="w-11 h-11 rounded-full bg-white/5 border border-white/10 flex items-center justify-center text-[#94A3B8] hover:text-white hover:bg-white/10 transition-colors"
            aria-label="Tutup"
          >
            <X size={18} />
          </button>
        </div>

        {/* Scanner Body */}
        <div className="flex-1 w-full flex flex-col items-center justify-center relative z-10">
          {errorMsg ? (
            <div className="text-center px-4 max-w-xs">
              <div className="w-14 h-14 rounded-full bg-red-500/10 border border-red-500/20 flex items-center justify-center mx-auto mb-4">
                <span className="text-2xl">📷</span>
              </div>
              <p className="text-sm font-bold text-white mb-2">{errorMsg}</p>
              <p className="text-xs text-[#4B6478] leading-relaxed">Pastikan izin kamera browser telah diaktifkan untuk melakukan pemindaian QR code.</p>
            </div>
          ) : (
            <div className="relative w-full aspect-square max-w-[300px] border border-white/10 rounded-3xl overflow-hidden bg-black/40 shadow-inner">
              {/* HTML5 QR Code Container */}
              <div id="qr-reader-container" className="w-full h-full" />

              {/* Pulsing scanning overlay */}
              <div className="absolute inset-0 border-[3px] border-green-500/30 rounded-3xl pointer-events-none overflow-hidden">
                <div className="absolute top-0 left-0 right-0 h-[2px] bg-gradient-to-r from-transparent via-green-400 to-transparent shadow-[0_0_8px_#22C55E] animate-[scan_2s_ease-in-out_infinite]" />
              </div>
              
              {/* Corner brackets */}
              <div className="absolute top-4 left-4 w-5 h-5 border-t-[3px] border-l-[3px] border-green-400 rounded-tl-lg pointer-events-none" />
              <div className="absolute top-4 right-4 w-5 h-5 border-t-[3px] border-r-[3px] border-green-400 rounded-tr-lg pointer-events-none" />
              <div className="absolute bottom-4 left-4 w-5 h-5 border-b-[3px] border-l-[3px] border-green-400 rounded-bl-lg pointer-events-none" />
              <div className="absolute bottom-4 right-4 w-5 h-5 border-b-[3px] border-r-[3px] border-green-400 rounded-br-lg pointer-events-none" />
            </div>
          )}
        </div>
      </div>

      {/* Animation & Video Cover Style */}
      <style dangerouslySetInnerHTML={{ __html: `
        @keyframes scan {
          0% { transform: translateY(0); }
          50% { transform: translateY(290px); }
          100% { transform: translateY(0); }
        }
        #qr-reader-container video {
          object-fit: cover !important;
          width: 100% !important;
          height: 100% !important;
          border-radius: 20px;
        }
      ` }} />
    </div>
  )
}
