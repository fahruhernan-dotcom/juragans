import { useEffect, useRef } from 'react'

/**
 * Centralized LIFO stack for tracking open modals, sheets, drawers, and sidebars.
 * When Android back button is pressed, the topmost active handler will be executed first.
 */
const backHandlerStack = []

/**
 * Dismisses the topmost open modal/sheet in the stack.
 * @returns {boolean} true if a modal was dismissed, false if no modals were open.
 */
export function dismissTopmostModal() {
  while (backHandlerStack.length > 0) {
    const handler = backHandlerStack.pop()
    if (typeof handler?.onClose === 'function') {
      try {
        handler.onClose()
        return true
      } catch (err) {
        console.error('[useBackHandler] Error executing modal onClose:', err)
      }
    }
  }
  return false
}

/**
 * Checks if there are any modals/sheets currently registered in the back stack.
 * @returns {boolean}
 */
export function hasActiveModal() {
  return backHandlerStack.length > 0
}

/**
 * Custom hook to register a modal, sheet, or drawer into the global Android back button stack.
 *
 * @param {boolean} isOpen - Whether the modal or sheet is currently visible.
 * @param {Function} onClose - Callback function to close the modal when back button is pressed.
 */
export function useBackHandler(isOpen, onClose) {
  const onCloseRef = useRef(onClose)

  useEffect(() => {
    onCloseRef.current = onClose
  }, [onClose])

  useEffect(() => {
    if (!isOpen) return

    // Register to LIFO stack
    const handlerEntry = {
      onClose: () => {
        if (onCloseRef.current) {
          onCloseRef.current()
        }
      },
    }
    backHandlerStack.push(handlerEntry)

    // Web / Desktop Escape key listener
    const handleKeyDown = (e) => {
      if (e.key === 'Escape') {
        e.preventDefault()
        e.stopPropagation()
        dismissTopmostModal()
      }
    }
    window.addEventListener('keydown', handleKeyDown, true)

    return () => {
      window.removeEventListener('keydown', handleKeyDown, true)
      const index = backHandlerStack.indexOf(handlerEntry)
      if (index !== -1) {
        backHandlerStack.splice(index, 1)
      }
    }
  }, [isOpen])
}
