import { useEffect, useRef, useState } from 'react'
import { AnimatePresence, motion } from 'framer-motion'
import { Check, ChevronDown } from 'lucide-react'
import { cn } from '@/lib/utils'
import { LANGUAGES, useLang, type Lang } from '@/i18n'
import { useStore } from '@/store'

/**
 * Language picker — a compact pill that lives in the top-right corner of the
 * profile page and opens its menu down-and-left, so the list never runs off the
 * right edge of the screen it is pinned to.
 */
export function LanguageSelector() {
  const lang = useLang()
  const updateSettings = useStore(s => s.updateSettings)
  const [open, setOpen] = useState(false)
  const ref = useRef<HTMLDivElement>(null)

  const selected = LANGUAGES.find(l => l.code === lang) ?? LANGUAGES[0]

  useEffect(() => {
    if (!open) return
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
        className={cn(
          'flex items-center gap-1.5 rounded-full border border-border bg-card/70 backdrop-blur-md',
          'py-1.5 pl-2.5 pr-2 text-xs font-semibold text-text transition-colors',
          'hover:border-accent/40',
          open && 'border-accent/40'
        )}
      >
        <span className="text-sm leading-none">{selected.flag}</span>
        <span className="leading-none tracking-wide">{selected.short}</span>
        <ChevronDown
          size={13}
          className={cn('text-text-muted transition-transform', open && 'rotate-180')}
        />
      </button>

      <AnimatePresence>
        {open && (
          <motion.div
            role="listbox"
            initial={{ opacity: 0, y: -6, scale: 0.98 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: -6, scale: 0.98 }}
            transition={{ duration: 0.16, ease: [0.22, 1, 0.36, 1] }}
            className="absolute right-0 top-full mt-2 w-44 z-50 overflow-hidden rounded-2xl border border-border bg-card/95 backdrop-blur-xl shadow-[0_16px_40px_-12px_rgba(0,0,0,0.75)]"
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
                    'flex w-full items-center gap-2 px-3 py-2.5 text-left text-sm transition-colors',
                    active
                      ? 'bg-accent/15 font-semibold text-accent-light'
                      : 'text-text hover:bg-white/5'
                  )}
                >
                  <span className="text-base leading-none">{l.flag}</span>
                  <span className="flex-1 truncate">{l.label}</span>
                  {active && <Check size={15} className="shrink-0" />}
                </button>
              )
            })}
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  )
}
