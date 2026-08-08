import { useEffect } from 'react'
import { AnimatePresence, motion } from 'framer-motion'
import { CheckCircle2 } from 'lucide-react'
import { useStore } from '@/store'
import { fmtUsd, fmtUah } from '@/types'
import { INTL_LOCALE, useLang, useT } from '@/i18n'
import { CARD, CARD_LAST4 } from '@/lib/card'
import { VisaLogo } from './VisaLogo'

/**
 * Receipt that flies in for a moment after a profit is recorded.
 *
 * The reference used `tailwindcss-animate` (`animate-in zoom-in-95`), which this
 * project does not have, so the enter/exit is driven by framer-motion instead.
 */

const VISIBLE_MS = 2600

/** Deterministic PRNG, so the same ticket id always draws the same barcode. */
function seeded(value: string): () => number {
  let h = 0
  for (let i = 0; i < value.length; i++) h = (h << 5) - h + value.charCodeAt(i)
  let n = Math.abs(h) || 1
  return () => {
    n = (n * 16807) % 2147483647
    return Math.abs(Math.sin(n)) % 1
  }
}

function Barcode({ value }: { value: string }) {
  const rand = seeded(value)
  const bars: { x: number; w: number }[] = []
  let x = 0
  for (let i = 0; i < 60; i++) {
    const w = rand() > 0.5 ? 2.5 : 1.5
    bars.push({ x, w })
    x += w + 1.5
  }
  return (
    <div className="flex flex-col items-center gap-1.5">
      <svg
        className="w-full h-10 sm:h-[52px]"
        viewBox={`0 0 ${x} 52`}
        preserveAspectRatio="none"
        aria-hidden
      >
        {bars.map((b, i) => (
          <rect key={i} x={b.x} y={0} width={b.w} height={52} fill="rgba(244,244,247,0.72)" />
        ))}
      </svg>
      <span className="text-[9px] tracking-[0.3em] text-text-muted">{value.slice(0, 12).toUpperCase()}</span>
    </div>
  )
}

function DashedLine() {
  return <div className="w-full border-t-2 border-dashed" style={{ borderColor: 'rgba(216,210,245,0.12)' }} />
}

export function PaymentTicket() {
  const t = useT()
  const lang = useLang()
  const ticket = useStore(s => s.ticket)
  const dismissTicket = useStore(s => s.dismissTicket)

  useEffect(() => {
    if (!ticket) return
    const id = setTimeout(dismissTicket, VISIBLE_MS)
    return () => clearTimeout(id)
  }, [ticket, dismissTicket])

  const when = ticket ? new Date(ticket.createdAt) : null

  return (
    <AnimatePresence>
      {ticket && when && (
        <motion.div
          className="fixed inset-0 z-[70] flex items-center justify-center p-4 sm:p-5"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          transition={{ duration: 0.2 }}
          onClick={dismissTicket}
        >
          <div className="absolute inset-0 bg-black/70 backdrop-blur-sm" />

          <motion.div
            className="relative w-full max-w-[340px]"
            initial={{ opacity: 0, scale: 0.9, y: 26 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.94, y: -18 }}
            transition={{ type: 'spring', stiffness: 220, damping: 24, mass: 0.7 }}
            onClick={e => e.stopPropagation()}
          >
            <div
              className="relative rounded-3xl px-5 py-6 sm:px-6 sm:py-7 overflow-hidden"
              style={{
                background: 'linear-gradient(160deg, #221F2E 0%, #1A1822 55%, #191622 100%)',
                border: '1px solid rgba(216,210,245,0.12)',
                boxShadow: '0 30px 70px -24px rgba(0,0,0,0.85), 0 0 48px rgba(139,125,204,0.16)',
              }}
            >
              {/* Ticket notches — punched out in the page background colour. */}
              <div className="absolute -left-4 top-[47%] w-8 h-8 rounded-full bg-bg" />
              <div className="absolute -right-4 top-[47%] w-8 h-8 rounded-full bg-bg" />

              <div className="flex flex-col items-center gap-2.5 sm:gap-3 mb-5 sm:mb-6">
                <div className="p-2.5 sm:p-3 rounded-full" style={{ background: 'rgba(139,125,204,0.14)' }}>
                  <CheckCircle2 className="w-7 h-7 sm:w-[30px] sm:h-[30px]" style={{ color: '#A596E8' }} />
                </div>
                <div className="text-center">
                  <h3 className="text-base sm:text-lg font-bold text-text">{t('ticket_thanks')}</h3>
                  <p className="text-[11px] sm:text-xs text-text-muted mt-0.5">
                    {ticket.workerName ? `${t('ticket_issued')} · ${ticket.workerName}` : t('ticket_issued')}
                  </p>
                </div>
              </div>

              <DashedLine />

              <div className="grid grid-cols-2 gap-3 sm:gap-4 py-4 sm:py-5">
                <div>
                  <p className="text-[10px] font-semibold uppercase tracking-wider text-text-muted mb-1">{t('ticket_id')}</p>
                  <p className="text-sm font-semibold text-text truncate">#{ticket.id.slice(0, 8)}</p>
                </div>
                <div className="text-right">
                  <p className="text-[10px] font-semibold uppercase tracking-wider text-text-muted mb-1">{t('ticket_amount')}</p>
                  <p className="text-base font-bold" style={{ color: '#A596E8' }}>{fmtUsd(ticket.amountUsd)}</p>
                  <p className="text-[11px] text-text-muted">{fmtUah(ticket.amountUah)}</p>
                </div>
                <div className="col-span-2">
                  <p className="text-[10px] font-semibold uppercase tracking-wider text-text-muted mb-1">{t('ticket_datetime')}</p>
                  <p className="text-sm text-text">
                    {when.toLocaleDateString(INTL_LOCALE[lang], { day: '2-digit', month: 'short', year: 'numeric' })}
                    {' · '}
                    {when.toLocaleTimeString(INTL_LOCALE[lang], { hour: '2-digit', minute: '2-digit' })}
                  </p>
                </div>
              </div>

              <DashedLine />

              <div className="flex items-center justify-between gap-3 py-4 sm:py-5">
                <div className="min-w-0">
                  <p className="text-sm font-semibold text-text truncate">{CARD.holder}</p>
                  <p className="text-xs tracking-widest text-text-muted mt-0.5">•••• {CARD_LAST4}</p>
                </div>
                <VisaLogo className="h-4 w-auto flex-shrink-0 text-text/80" />
              </div>

              <DashedLine />

              <div className="pt-4 sm:pt-5">
                <Barcode value={ticket.id} />
              </div>
            </div>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  )
}
