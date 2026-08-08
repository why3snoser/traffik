import { useRef, useState } from 'react'
import { motion, useMotionValue, useSpring, useTransform } from 'framer-motion'
import { Eye, EyeOff, Wifi } from 'lucide-react'
import { useT } from '@/i18n'
import { CARD } from '@/lib/card'

/**
 * Bank-card treatment of the balance.
 *
 * Three transforms stack, and each one lives on its own element on purpose —
 * framer-motion composes `transform` from the motion values it owns on a single
 * element, so a pointer-driven tilt and a state-driven flip cannot share one:
 *
 *   wrapper   perspective (plain CSS, never animated)
 *     tilt    rotateX/rotateY from the pointer + press scale   ← motion values
 *     flip    rotateY 0↔180 from `flipped`                     ← animate prop
 *       front / back, each `backface-visibility: hidden`
 *
 * Collapsing tilt and flip onto one element makes the flip snap instead of
 * animating, because a plain number in `style` is applied without a transition.
 */

const TILT_DEG = 9
const SPRING = { type: 'spring' as const, stiffness: 140, damping: 18, mass: 0.6 }

interface CreditCardProps {
  /** Headline balance, already formatted (e.g. `$1,234.56`). */
  balancePrimary: string
  /** Secondary currency line, already formatted. */
  balanceSecondary: string
  cardHolder?: string
  cardNumber?: string
  expiry?: string
  cvv?: string
}

/** Chip contacts — the gold rectangle alone reads as a sticker without them. */
function Chip() {
  return (
    <div
      className="relative w-11 h-8 md:w-12 md:h-9 rounded-[6px] overflow-hidden shrink-0"
      style={{
        background: 'linear-gradient(135deg, #F3DFA6 0%, #D9BC74 38%, #B8944F 70%, #E6D096 100%)',
        boxShadow: 'inset 0 1px 1px rgba(255,255,255,0.55), 0 2px 6px rgba(0,0,0,0.35)',
      }}
    >
      <div className="absolute inset-y-[18%] left-1/2 w-px -translate-x-1/2 bg-black/25" />
      <div className="absolute inset-x-[14%] top-1/3 h-px bg-black/25" />
      <div className="absolute inset-x-[14%] top-2/3 h-px bg-black/25" />
      <div className="absolute inset-y-[30%] left-[26%] w-px bg-black/20" />
      <div className="absolute inset-y-[30%] right-[26%] w-px bg-black/20" />
    </div>
  )
}

export function CreditCard({
  balancePrimary,
  balanceSecondary,
  cardHolder = CARD.holder,
  cardNumber = CARD.number,
  expiry = CARD.expiry,
  cvv = CARD.cvv,
}: CreditCardProps) {
  const t = useT()
  const [flipped, setFlipped] = useState(false)
  const [revealed, setRevealed] = useState(false)
  const [pressed, setPressed] = useState(false)
  const cardRef = useRef<HTMLDivElement>(null)

  // Raw pointer offset, then a spring so the tilt eases instead of tracking the
  // cursor rigidly — and so releasing it settles rather than snapping to flat.
  const px = useMotionValue(0)
  const py = useMotionValue(0)
  const sx = useSpring(px, { stiffness: 180, damping: 20 })
  const sy = useSpring(py, { stiffness: 180, damping: 20 })
  const rotateX = useTransform(sy, [-0.5, 0.5], [TILT_DEG, -TILT_DEG])
  const rotateY = useTransform(sx, [-0.5, 0.5], [-TILT_DEG, TILT_DEG])

  const handleMove = (e: React.MouseEvent) => {
    const rect = cardRef.current?.getBoundingClientRect()
    if (!rect) return
    px.set((e.clientX - rect.left) / rect.width - 0.5)
    py.set((e.clientY - rect.top) / rect.height - 0.5)
  }

  const resetTilt = () => {
    px.set(0)
    py.set(0)
  }

  const toggleFlip = () => {
    setPressed(true)
    window.setTimeout(() => setPressed(false), 180)
    setFlipped(f => !f)
  }

  const maskedNumber = `•••• •••• •••• ${cardNumber.replace(/\s/g, '').slice(-4)}`

  /** Both faces share the surface; only the gradient and the pre-rotation differ. */
  const faceClass =
    'absolute inset-0 rounded-[24px] overflow-hidden border border-white/10'
  const faceShadow =
    'inset 0 1px 0 rgba(255,255,255,0.18), inset 0 -1px 0 rgba(0,0,0,0.3), 0 24px 60px -22px rgba(0,0,0,0.8), 0 0 44px rgba(139,125,204,0.16), 0 8px 24px rgba(0,0,0,0.45)'
  const hiddenBack = { backfaceVisibility: 'hidden' as const, WebkitBackfaceVisibility: 'hidden' as const }

  return (
    <div className="w-full max-w-[27rem] mb-6">
      <motion.div
        initial={{ opacity: 0, y: 16 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5, ease: [0.22, 1, 0.36, 1] }}
        className="relative"
      >
        {/* Ambient light the card sits in — kept outside the 3D space so the
            tilt does not drag the glow around with it. Both orbs are the app's
            accent, not a second hue, so the card does not read as its own brand. */}
        <div className="absolute -inset-6 pointer-events-none z-0">
          <div
            className="absolute -top-2 -right-2 w-32 h-32 rounded-full blur-3xl opacity-60"
            style={{ background: 'radial-gradient(circle, rgba(165,150,232,0.45) 0%, transparent 70%)' }}
          />
          <div
            className="absolute -bottom-2 -left-2 w-36 h-36 rounded-full blur-3xl opacity-50"
            style={{ background: 'radial-gradient(circle, rgba(139,125,204,0.40) 0%, transparent 70%)' }}
          />
        </div>

        <div style={{ perspective: 1200 }} className="relative z-10">
          <motion.div
            ref={cardRef}
            role="button"
            tabIndex={0}
            aria-label={t('card_flip_aria')}
            onMouseMove={handleMove}
            onMouseLeave={resetTilt}
            onClick={toggleFlip}
            onKeyDown={e => {
              if (e.key === 'Enter' || e.key === ' ') {
                e.preventDefault()
                toggleFlip()
              }
            }}
            style={{ rotateX, rotateY, transformStyle: 'preserve-3d' }}
            animate={{ scale: pressed ? 0.97 : 1 }}
            transition={SPRING}
            className="relative w-full aspect-[1.586] cursor-pointer select-none outline-none focus-visible:ring-2 focus-visible:ring-accent/60 rounded-[24px]"
          >
            <motion.div
              animate={{ rotateY: flipped ? 180 : 0 }}
              transition={{ type: 'spring', stiffness: 120, damping: 17 }}
              style={{ transformStyle: 'preserve-3d' }}
              className="absolute inset-0"
            >
              {/* ── Front ─────────────────────────────────────────────── */}
              <div
                className={faceClass}
                style={{
                  ...hiddenBack,
                  // Graphite base rising into the app accent, rather than the
                  // reference's violet→pink. Same family as `.card-gradient`
                  // and the page backdrop, just richer, so the card is the
                  // brightest thing on the page without being another palette.
                  background:
                    'linear-gradient(145deg, #302A44 0%, #241F35 26%, #3E3661 52%, #5A4E92 78%, #8B7DCC 100%)',
                  boxShadow: faceShadow,
                }}
              >
                {/* Sheen sweep — softer than the reference, since a bright
                    sweep reads much stronger over a dark base than a light one. */}
                <motion.div
                  animate={{ x: ['-130%', '130%'] }}
                  transition={{ duration: 2.6, repeat: Infinity, repeatDelay: 3.4, ease: 'linear' }}
                  className="absolute inset-y-0 w-1/2 pointer-events-none"
                  style={{
                    background:
                      'linear-gradient(105deg, transparent 0%, rgba(216,210,245,0.13) 50%, transparent 100%)',
                  }}
                />
                {/* Embossed guilloche arcs, the way a real card catches light */}
                <div
                  className="absolute -right-16 -top-20 w-64 h-64 rounded-full pointer-events-none"
                  style={{ border: '1px solid rgba(216,210,245,0.13)' }}
                />
                <div
                  className="absolute -right-8 -bottom-28 w-72 h-72 rounded-full pointer-events-none"
                  style={{ border: '1px solid rgba(216,210,245,0.08)' }}
                />
                <div
                  className="absolute inset-0 pointer-events-none"
                  style={{ background: 'radial-gradient(120% 90% at 15% 0%, rgba(216,210,245,0.14) 0%, transparent 55%)' }}
                />

                <div className="relative h-full flex flex-col justify-between p-5 md:p-6 text-white">
                  {/* Chip + contactless, reveal toggle */}
                  <div className="flex items-start justify-between">
                    <div className="flex items-center gap-3">
                      <Chip />
                      <Wifi className="w-5 h-5 md:w-6 md:h-6 rotate-90 opacity-80" strokeWidth={2.2} />
                    </div>
                    <button
                      type="button"
                      aria-label={t('card_reveal_aria')}
                      onClick={e => {
                        // The card itself flips on click; the toggle must not.
                        e.stopPropagation()
                        setRevealed(r => !r)
                      }}
                      className="w-9 h-9 -mr-1 -mt-1 rounded-full bg-white/15 border border-white/20 backdrop-blur-sm flex items-center justify-center hover:bg-white/25"
                    >
                      {revealed ? <EyeOff size={16} /> : <Eye size={16} />}
                    </button>
                  </div>

                  {/* Balance — the reason this card exists */}
                  <div className="-mt-1">
                    <p className="text-[10px] uppercase tracking-[0.18em] text-white/65 mb-0.5">
                      {t('card_balance')}
                    </p>
                    <p className="text-2xl md:text-[2rem] font-bold tracking-tight leading-none tabular-nums drop-shadow-[0_2px_10px_rgba(0,0,0,0.35)]">
                      {revealed ? balancePrimary : '••••••'}
                    </p>
                    <p className="text-xs md:text-sm text-white/70 mt-1 tabular-nums">
                      {revealed ? balanceSecondary : '•••••••'}
                    </p>
                  </div>

                  <p className="font-mono text-base md:text-xl tracking-[0.14em] text-white/95 drop-shadow-[0_1px_6px_rgba(0,0,0,0.4)]">
                    {revealed ? cardNumber : maskedNumber}
                  </p>

                  <div className="flex items-end justify-between gap-3">
                    <div className="min-w-0">
                      <p className="text-[8px] md:text-[9px] uppercase tracking-[0.18em] text-white/60 mb-0.5">
                        {t('card_holder')}
                      </p>
                      <p className="text-xs md:text-sm font-semibold uppercase tracking-wide truncate">
                        {cardHolder}
                      </p>
                    </div>
                    <div className="shrink-0">
                      <p className="text-[8px] md:text-[9px] uppercase tracking-[0.18em] text-white/60 mb-0.5">
                        {t('card_expires')}
                      </p>
                      <p className="text-xs md:text-sm font-semibold tabular-nums">
                        {revealed ? expiry : '••/••'}
                      </p>
                    </div>
                    <p className="shrink-0 text-lg md:text-xl font-bold italic tracking-tight leading-none drop-shadow-[0_2px_8px_rgba(0,0,0,0.4)]">
                      TRAFFIK
                    </p>
                  </div>
                </div>
              </div>

              {/* ── Back ──────────────────────────────────────────────── */}
              <div
                className={faceClass}
                style={{
                  ...hiddenBack,
                  transform: 'rotateY(180deg)',
                  background:
                    'linear-gradient(145deg, #2A2440 0%, #221D33 34%, #3A3259 68%, #4E4483 100%)',
                  boxShadow: faceShadow,
                }}
              >
                <div className="absolute inset-x-0 top-5 md:top-6 h-11 md:h-12 bg-black/85" />

                <div className="absolute inset-x-5 md:inset-x-6 top-[4.75rem] md:top-[5.25rem] flex items-center gap-2">
                  <div className="flex-1 h-9 md:h-10 rounded bg-[repeating-linear-gradient(45deg,#efeaf7_0px,#efeaf7_6px,#ded6ee_6px,#ded6ee_12px)]" />
                  <div className="w-16 md:w-20 h-9 md:h-10 rounded bg-white/95 flex items-center justify-center">
                    <span className="font-mono text-sm md:text-base font-bold tracking-widest text-zinc-900">
                      {revealed ? cvv : '•••'}
                    </span>
                  </div>
                </div>

                <div className="absolute inset-x-5 md:inset-x-6 bottom-5 md:bottom-6 flex items-end justify-between gap-3">
                  <p className="text-[9px] md:text-[10px] leading-snug text-white/60 max-w-[62%]">
                    {t('card_back_note')}
                  </p>
                  <p className="font-mono text-[10px] md:text-xs tracking-widest text-white/80 tabular-nums">
                    {maskedNumber.slice(-4)}
                  </p>
                </div>
              </div>
            </motion.div>
          </motion.div>
        </div>
      </motion.div>

      <p className="mt-3 text-[11px] text-text-muted">{t('card_hint')}</p>
    </div>
  )
}
