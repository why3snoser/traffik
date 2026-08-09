import { useEffect, useRef, type ReactNode } from 'react'
import { createPortal } from 'react-dom'
import { AnimatePresence, motion, useDragControls } from 'framer-motion'
import { X } from 'lucide-react'
import { lockBodyScroll, unlockBodyScroll } from '@/lib/bodyScrollLock'

/**
 * Tracks the *visual* viewport, which is what's actually left after the on-screen
 * keyboard takes its share. `100dvh` only accounts for browser chrome, so without
 * this a focused input near the bottom of a tall sheet sits under the keyboard
 * with no way to scroll to it.
 */
function useVisualViewport(active: boolean) {
  const ref = useRef<HTMLDivElement>(null)

  useEffect(() => {
    const vv = window.visualViewport
    if (!active || !vv) return

    const sync = () => {
      const el = ref.current
      if (!el) return
      el.style.height = `${vv.height}px`
      // iOS scrolls the visual viewport rather than resizing it; follow the offset
      // so the sheet stays pinned to what the user can actually see.
      el.style.transform = `translateY(${vv.offsetTop}px)`
    }

    sync()
    vv.addEventListener('resize', sync)
    vv.addEventListener('scroll', sync)
    return () => {
      vv.removeEventListener('resize', sync)
      vv.removeEventListener('scroll', sync)
    }
  }, [active])

  return ref
}

export type BottomSheetProps = {
  open: boolean
  onClose: () => void
  title?: ReactNode
  children: ReactNode
  /** Pinned below the scroll area — for a primary action that must stay reachable. */
  footer?: ReactNode
  maxWidth?: 'md' | 'lg'
  /** Renders as a centred dialog from `md` up instead of an edge-to-edge sheet. */
  centerOnDesktop?: boolean
}

export function BottomSheet({
  open,
  onClose,
  title,
  children,
  footer,
  maxWidth = 'lg',
  centerOnDesktop = false,
}: BottomSheetProps) {
  const dragControls = useDragControls()
  const viewportRef = useVisualViewport(open)

  // An inline arrow from the call site changes identity every render, which would
  // thrash the lock/unlock effect below.
  const onCloseRef = useRef(onClose)
  onCloseRef.current = onClose

  useEffect(() => {
    if (!open) return
    lockBodyScroll()
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onCloseRef.current()
    }
    document.addEventListener('keydown', onKey)
    return () => {
      document.removeEventListener('keydown', onKey)
      unlockBodyScroll()
    }
  }, [open])

  const widthClass = maxWidth === 'md' ? 'max-w-md' : 'max-w-lg'

  return createPortal(
    <AnimatePresence>
      {open && (
        <div
          ref={viewportRef}
          /* Above BottomNav (40) and page modals (50), below the goal overlay (60). */
          className={`fixed inset-x-0 top-0 z-[55] flex justify-center ${
            centerOnDesktop ? 'items-end md:items-center' : 'items-end'
          }`}
          style={{ height: '100dvh' }}
        >
          <motion.div
            className="absolute inset-0 bg-black/70 backdrop-blur-sm"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.2 }}
            onClick={onClose}
          />

          <motion.div
            role="dialog"
            aria-modal="true"
            className={`relative w-full ${widthClass} sheet flex flex-col rounded-t-3xl ${
              centerOnDesktop ? 'md:rounded-3xl md:mx-4' : ''
            }`}
            /* Not 100% — leaving a strip of backdrop keeps tap-outside-to-close
               discoverable and signals there is a page underneath. */
            style={{ maxHeight: '92%', touchAction: 'none' }}
            initial={{ y: '100%', opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            exit={{ y: '100%', opacity: 0 }}
            transition={{ type: 'spring', damping: 32, stiffness: 340, mass: 0.7 }}
            drag="y"
            dragControls={dragControls}
            /* Drag starts only from the grabber. Listening on the whole sheet would
               swallow the scroll gesture inside the content area. */
            dragListener={false}
            dragConstraints={{ top: 0, bottom: 0 }}
            dragElastic={{ top: 0, bottom: 0.6 }}
            onDragEnd={(_, info) => {
              if (info.offset.y > 110 || info.velocity.y > 650) onClose()
            }}
          >
            {/* Grab area — the handle and the title row both drag the sheet. */}
            <div
              className="flex-shrink-0 px-6 pt-3 cursor-grab active:cursor-grabbing"
              style={{ touchAction: 'none' }}
              onPointerDown={e => dragControls.start(e)}
            >
              <div className="w-10 h-1.5 bg-white/20 rounded-full mx-auto" />
              {title && (
                <div className="flex items-center justify-between gap-3 mt-4">
                  <h3 className="text-lg font-bold text-white truncate">{title}</h3>
                  <button
                    onClick={onClose}
                    aria-label="Close"
                    className="flex-shrink-0 w-9 h-9 -mr-1.5 rounded-full flex items-center justify-center text-text-muted hover:text-text hover:bg-white/5"
                    onPointerDown={e => e.stopPropagation()}
                  >
                    <X size={18} />
                  </button>
                </div>
              )}
            </div>

            <div
              className="flex-1 min-h-0 overflow-y-auto overscroll-contain px-6 pt-4"
              /* The sheet root sets `touch-action: none` so the drag gesture is
                 clean; this subtree has to opt back in or it cannot scroll. */
              style={{
                touchAction: 'pan-y',
                WebkitOverflowScrolling: 'touch',
                paddingBottom: footer ? 8 : 'max(1.5rem, env(safe-area-inset-bottom, 0px))',
              }}
            >
              {children}
            </div>

            {footer && (
              <div
                className="flex-shrink-0 px-6 pt-3 border-t border-white/[0.06]"
                style={{ paddingBottom: 'max(1.5rem, env(safe-area-inset-bottom, 0px))' }}
              >
                {footer}
              </div>
            )}
          </motion.div>
        </div>
      )}
    </AnimatePresence>,
    document.body
  )
}
