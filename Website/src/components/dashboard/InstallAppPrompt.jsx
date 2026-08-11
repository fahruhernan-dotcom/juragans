import { useState, useEffect } from 'react'
import { X } from 'lucide-react'

const DISMISSED_KEY = 'ternakos-install-dismissed'

export default function InstallAppPrompt() {
  const [deferredPrompt, setDeferredPrompt] = useState(null)
  const [visible, setVisible] = useState(false)
  const [isIOS, setIsIOS] = useState(false)

  useEffect(() => {
    // Already installed as standalone app
    const isStandalone =
      window.matchMedia('(display-mode: standalone)').matches ||
      window.navigator.standalone === true

    if (isStandalone) return

    // User previously dismissed
    if (localStorage.getItem(DISMISSED_KEY)) return

    // iOS Safari — no beforeinstallprompt, show manual instruction
    const ios = /iphone|ipad|ipod/i.test(navigator.userAgent)
    const safari = /^((?!chrome|android).)*safari/i.test(navigator.userAgent)
    if (ios && safari) {
      setIsIOS(true)
      setVisible(true)
      return
    }

    // Android Chrome / Edge / desktop — listen for install event
    const handler = (e) => {
      e.preventDefault()
      setDeferredPrompt(e)
      setVisible(true)
    }
    window.addEventListener('beforeinstallprompt', handler)
    return () => window.removeEventListener('beforeinstallprompt', handler)
  }, [])

  const handleInstall = async () => {
    if (!deferredPrompt) return
    deferredPrompt.prompt()
    const { outcome } = await deferredPrompt.userChoice
    setDeferredPrompt(null)
    setVisible(false)
    // Only suppress future prompts if user dismissed — if accepted, no need either way
    if (outcome === 'dismissed') {
      localStorage.setItem(DISMISSED_KEY, '1')
    }
  }

  const handleDismiss = () => {
    localStorage.setItem(DISMISSED_KEY, '1')
    setVisible(false)
  }

  if (!visible) return null

  return (
    <div
      role="banner"
      className="fixed bottom-[84px] left-3 right-3 lg:bottom-6 lg:left-auto lg:right-5 lg:max-w-xs z-[70]
                 bg-[#0C1319] border border-white/10 rounded-2xl shadow-2xl p-3.5 flex items-start gap-3"
    >
      <img
        src="/icons/icon-192.png"
        alt="TernakOS"
        className="w-10 h-10 rounded-xl flex-shrink-0 mt-0.5"
      />
      <div className="flex-1 min-w-0">
        <p className="text-sm font-semibold text-white leading-tight">Install TernakOS</p>
        {isIOS ? (
          <p className="text-xs text-[#94A3B8] mt-1 leading-relaxed">
            Buka Safari → ketuk <strong className="text-[#CBD5E1]">Share</strong> →{' '}
            <strong className="text-[#CBD5E1]">Add to Home Screen</strong>
          </p>
        ) : (
          <>
            <p className="text-xs text-[#94A3B8] mt-0.5">Akses lebih cepat dari home screen</p>
            <div className="flex gap-2 mt-2">
              <button
                onClick={handleInstall}
                className="px-3 py-1.5 bg-green-700 hover:bg-green-600 active:bg-green-800
                           text-white text-xs font-medium rounded-lg transition-colors"
              >
                Install PWA
              </button>
              <a
                href="https://github.com/fahruhernan-dotcom/SaaS/actions/runs/26570279873/artifacts/7264021711"
                target="_blank"
                rel="noopener noreferrer"
                className="px-3 py-1.5 bg-[#1E293B] hover:bg-[#334155] border border-white/10
                           text-white text-xs font-medium rounded-lg transition-colors flex items-center justify-center"
              >
                Download APK
              </a>
            </div>
          </>
        )}
      </div>
      <button
        onClick={handleDismiss}
        aria-label="Tutup"
        className="flex-shrink-0 mt-0.5 text-[#64748B] hover:text-[#CBD5E1] transition-colors p-0.5"
      >
        <X size={16} />
      </button>
    </div>
  )
}
