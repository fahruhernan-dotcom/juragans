import { useEffect, useRef } from 'react'

/**
 * useEdgeSwipeSidebar
 * Global edge swipe hook for mobile devices.
 * 
 * Features:
 * - Detects touches starting in the left edge/zone of the screen (0 to 85px or 25% of screen width)
 * - Triggers onOpen when swiping right toward the center (dx >= 50px)
 * - Triggers onClose when swiping left while sidebar is open (dx <= -45px)
 * - Prevents conflict with vertical scrolling by checking horizontal ratio (Math.abs(dx) > Math.abs(dy) * 1.15)
 * - Passive window-level touch listeners for maximum responsiveness across all child components
 * 
 * @param {Object} params
 * @param {boolean} params.isOpen - Current sidebar open state
 * @param {() => void} params.onOpen - Function to open sidebar
 * @param {() => void} params.onClose - Function to close sidebar
 * @param {boolean} [params.enabled=true] - Whether edge swipe is enabled (e.g. only on mobile)
 */
export function useEdgeSwipeSidebar({ isOpen, onOpen, onClose, enabled = true }) {
  const touchStartRef = useRef(null)

  useEffect(() => {
    if (!enabled || typeof window === 'undefined') return

    const handleTouchStart = (e) => {
      if (e.touches.length !== 1) return
      const touch = e.touches[0]
      touchStartRef.current = {
        x: touch.clientX,
        y: touch.clientY,
        time: Date.now(),
      }
    }

    const handleTouchEnd = (e) => {
      if (!touchStartRef.current || e.changedTouches.length !== 1) {
        touchStartRef.current = null
        return
      }

      const touch = e.changedTouches[0]
      const dx = touch.clientX - touchStartRef.current.x
      const dy = touch.clientY - touchStartRef.current.y
      const startX = touchStartRef.current.x
      const screenWidth = window.innerWidth
      const edgeThreshold = Math.min(Math.max(screenWidth * 0.25, 75), 110) // 75px - 110px from left edge

      const isHorizontal = Math.abs(dx) > Math.abs(dy) * 1.15

      if (isHorizontal) {
        // Swipe from left edge to center to open
        if (!isOpen && startX <= edgeThreshold && dx >= 50) {
          onOpen?.()
        }
        // Swipe left to close when open
        else if (isOpen && dx <= -45) {
          onClose?.()
        }
      }

      touchStartRef.current = null
    }

    const handleTouchCancel = () => {
      touchStartRef.current = null
    }

    // Attach to window so swipes starting on cards/tables/charts are captured reliably
    window.addEventListener('touchstart', handleTouchStart, { passive: true })
    window.addEventListener('touchend', handleTouchEnd, { passive: true })
    window.addEventListener('touchcancel', handleTouchCancel, { passive: true })

    return () => {
      window.removeEventListener('touchstart', handleTouchStart)
      window.removeEventListener('touchend', handleTouchEnd)
      window.removeEventListener('touchcancel', handleTouchCancel)
    }
  }, [isOpen, onOpen, onClose, enabled])
}
