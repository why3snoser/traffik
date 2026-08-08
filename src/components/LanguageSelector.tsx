import { useEffect, useRef, useState } from 'react'
import { AnimatePresence, motion } from 'framer-motion'
import { Check, ChevronDown } from 'lucide-react'
import { cn } from '@/lib/utils'
import { LANGUAGES, useLang, type Lang } from '@/i18n'
import { useStore } from '@/store'

/**
 * Language picker for the settings sheet.
 *
 * The dropdown opens *upward* (`bottom-full`): the settings sheet is anchored to
 * the bottom of the viewport, so a downward menu would open off-screen on a phone.
 * The sheet itself scrolls, though, so opening also centres the button in it —
 * otherwise the upward menu is clipped whenever the button sits near the top edge.
 */
export function LanguageSelector() {
  const lang = useLang()
  const updateSettings = useStore(s => s.updateSettings)
  const [open, setOpen] = useState(false)
  const ref = useRef<HTMLDivElement>(null)

  const selected = LANGUAGES.find(l => l.code === lang) ?? LANGUAGES[0]

  useEffect(() => {
    if (!open) return
    ref.current?.scrollIntoView({ block: 'center', behavior: 'smooth' })
    const onDown = (e: MouseEvent) => {
      if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false)
    }
    const onEsc = (e: KeyboardEvent) => {
      if (e.key === 'Escape') setOpen(false)
    }
    document.addEventListener('mousedown', onDown)
    document.addEventListener('keydown', onEsc)
    return () => {
      document.removeEventListener('mousedown', onDown)
      document.removeEventListener('keydown', onEsc)
    }
  }, [open])

  const pick = (code: Lang) => {
    updateSettings({ language: code })
    setOpen(false)
  }

  return (
    <div className="relative" ref={ref}>
      <button
        type="button"
        onClick={() => setOpen(o => !o)}
        aria-haspopup="listbox"
        aria-expanded={open}
        className="w-full flex items-center gap-2 rounded-2xl border border-border bg-card px-4 py-3 text-sm text-text hover:border-accent/40 transition-colors"
      >
        <span className="text-base leading-none">{selected.flag}</span>
        <span className="flex-1 text-left font-medium">{selected.label}</span>
        <ChevronDown
          size={16}
          className={cn('text-text-muted transition-transform', open && 'rotate-180')}
        />
      </button>

      <AnimatePresence>
        {open && (
          <motion.div
            role="listbox"
            initial={{ opacity: 0, y: 6, scale: 0.98 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 6, scale: 0.98 }}
            transition={{ duration: 0.16, ease: [0.22, 1, 0.36, 1] }}
            className="absolute bottom-full left-0 right-0 mb-2 z-50 overflow-hidden rounded-2xl border border-border bg-card/95 backdrop-blur-xl shadow-[0_16px_40px_-12px_rgba(0,0,0,0.75)]"
          >
            {LANGUAGES.map(l => {
              const active = l.code === lang
              return (
                <button
                  key={l.code}
                  type="button"
                  role="option"
                  aria-selected={active}
                  onClick={() => pick(l.code)}
                  className={cn(
                    'flex w-full items-center gap-2 px-4 py-3 text-left text-sm transition-colors',
                    active
                      ? 'bg-accent/15 font-semibold text-accent-light'
                      : 'text-text hover:bg-white/5'
                  )}
                >
                  <span className="text-base leading-none">{l.flag}</span>
                  <span className="flex-1">{l.label}</span>
                  {active && <Check size={15} />}
                </button>
              )
            })}
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  )
}
