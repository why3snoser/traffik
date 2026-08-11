import { useEffect, useState } from 'react'
import { motion, AnimatePresence, type Variants } from 'framer-motion'
import {
  Gauge,
  Wallet,
  X,
  TrendingUp,
  Timer,
  type LucideIcon,
} from 'lucide-react'
import { useStore } from '@/store'
import { rubToUsd, fmtUsd } from '@/types'
import { useT } from '@/i18n'
import { GOAL_FRAME_PHOTO_SHOWCASE, GOAL_FRAME_SHOWCASE, goalPhotoStyle, resolveGoalImage } from '@/lib/goalImage'
import { lockBodyScroll, unlockBodyScroll } from '@/lib/bodyScrollLock'

function hexToRgba(hex: string, alpha: number): string {
  const h = hex.replace('#', '')
  const full = h.length === 3 ? h.split('').map(c => c + c).join('') : h
  const int = parseInt(full, 16)
  const r = (int >> 16) & 255
  const g = (int >> 8) & 255
  const b = int & 255
  return `rgba(${r}, ${g}, ${b}, ${alpha})`
}

// =========================================
// DATA TYPES
// =========================================

interface FeatureMetric {
  label: string
  /** 0-100, drives the bar width. */
  value: number
  /** What the right-hand readout shows — a percentage or a money figure. */
  display: string
  icon: LucideIcon
}

interface ProductData {
  id: string
  label: string
  title: string
  description: string
  image?: string
  imagePosition?: string
  imageFit?: 'contain' | 'cover'
  imageScale?: number
  color: string
  stats: {
    connectionStatus: string
    batteryLevel: number
  }
  amounts: {
    saved: number
    target: number
  }
  features: FeatureMetric[]
}

// =========================================
// ANIMATION VARIANTS (copied from reference)
// =========================================

const ANIMATIONS = {
  container: {
    hidden: { opacity: 0 },
    visible: {
      opacity: 1,
      transition: { staggerChildren: 0.1, delayChildren: 0.1 },
    },
    exit: {
      opacity: 0,
      transition: { duration: 0.2 },
    },
  } satisfies Variants,
  item: {
    hidden: { opacity: 0, y: 20, filter: 'blur(10px)' },
    visible: {
      opacity: 1,
      y: 0,
      filter: 'blur(0px)',
      transition: { type: 'spring', stiffness: 100, damping: 20 },
    },
    exit: { opacity: 0, y: -10, filter: 'blur(5px)' },
  } satisfies Variants,
  image: (isLeft: boolean): Variants => ({
    initial: {
      opacity: 0,
      scale: 1.5,
      filter: 'blur(15px)',
      rotate: isLeft ? -30 : 30,
      x: isLeft ? -80 : 80,
    },
    animate: {
      opacity: 1,
      scale: 1,
      filter: 'blur(0px)',
      rotate: 0,
      x: 0,
      transition: { type: 'spring', stiffness: 260, damping: 20 },
    },
    exit: {
      opacity: 0,
      scale: 0.6,
      filter: 'blur(20px)',
      transition: { duration: 0.25 },
    },
  }),
}

// =========================================
// SUB-COMPONENTS
// =========================================

const BackgroundGradient = ({ isLeft, color }: { isLeft: boolean; color: string }) => (
  <div className="absolute inset-0 pointer-events-none">
    <motion.div
      animate={{
        background: isLeft
          ? `radial-gradient(circle at 0% 50%, ${hexToRgba(color, 0.15)}, transparent 50%)`
          : `radial-gradient(circle at 100% 50%, ${hexToRgba(color, 0.15)}, transparent 50%)`,
      }}
      transition={{ duration: 1.2, ease: [0.16, 1, 0.3, 1] }}
      className="absolute inset-0"
    />
  </div>
)
/**
 * The visual persists across goal switches — only the artwork inside it is
 * keyed, so the image flies in from the side while the rings and the frame stay
 * put, exactly like the reference. Wrapping this in an outer `AnimatePresence`
 * would fade the whole assembly instead and swallow the image's exit.
 */
const ProductVisual = ({ data, isLeft }: { data: ProductData; isLeft: boolean }) => {
  const layout = resolveGoalImage(data, true)
  const isCover = data.imageFit === 'cover'
  const ringWhite = 'rgba(255, 255, 255, 0.1)'

  const motionProps = {
    variants: ANIMATIONS.image(isLeft),
    initial: 'initial' as const,
    animate: 'animate' as const,
    exit: 'exit' as const,
  }

  return (
  <motion.div layout="position" className="relative group shrink-0">
    {!isCover && (
      <>
        {/* Animated rings — dashed white outline with the accent lit on the side
            the composition is anchored to. */}
        <motion.div
          animate={{
            rotate: 360,
            borderLeftColor: isLeft ? hexToRgba(data.color, 0.5) : ringWhite,
            borderRightColor: isLeft ? ringWhite : hexToRgba(data.color, 0.5),
          }}
          transition={{
            rotate: { duration: 20, repeat: Infinity, ease: 'linear' },
            borderLeftColor: { duration: 1.2, ease: [0.16, 1, 0.3, 1] },
            borderRightColor: { duration: 1.2, ease: [0.16, 1, 0.3, 1] },
          }}
          className="absolute inset-[-20%] rounded-full border border-dashed border-white/10"
        />
        <motion.div
          animate={{
            scale: [1, 1.05, 1],
            background: `linear-gradient(to bottom right, ${hexToRgba(data.color, 0.85)}, ${hexToRgba(data.color, 0.2)})`,
          }}
          transition={{
            scale: { duration: 4, repeat: Infinity, ease: 'easeInOut' },
            background: { duration: 1.2, ease: [0.16, 1, 0.3, 1] },
          }}
          className="absolute inset-0 rounded-full blur-2xl opacity-40"
        />
      </>
    )}

    {/* Image Container — consistent responsive height via aspect-square */}
    {isCover ? (
      /* Photo goal — no frame: the shot floats on its own ambient light and its
         edges dissolve, so nothing outlines it and nothing gets cropped. */
      <div className="relative">
        <motion.div
          animate={{ scale: [1, 1.06, 1], opacity: [0.4, 0.6, 0.4] }}
          transition={{ duration: 5, repeat: Infinity, ease: 'easeInOut' }}
          className="absolute inset-[-14%] rounded-full blur-3xl pointer-events-none"
          style={{ background: `radial-gradient(circle, ${hexToRgba(data.color, 0.55)} 0%, transparent 70%)` }}
        />
        <motion.div
          animate={{ y: [-8, 8, -8] }}
          transition={{ repeat: Infinity, duration: 6, ease: 'easeInOut' }}
          className={`relative ${GOAL_FRAME_PHOTO_SHOWCASE}`}
        >
          <AnimatePresence mode="wait">
            {data.image ? (
              <motion.img
                key={data.id}
                src={data.image}
                alt={data.title}
                {...motionProps}
                className="w-full h-full object-cover"
                style={goalPhotoStyle(data.imagePosition)}
                draggable={false}
              />
            ) : (
              <motion.span
                key={data.id}
                {...motionProps}
                className="text-8xl leading-none w-full h-full flex items-center justify-center"
              >
                {data.label}
              </motion.span>
            )}
          </AnimatePresence>
        </motion.div>
      </div>
    ) : (
    <div className={`relative ${GOAL_FRAME_SHOWCASE} rounded-full border border-white/5 shadow-2xl flex items-center justify-center overflow-hidden bg-black/25 backdrop-blur-sm`}>
      <motion.div
        animate={{ y: [-10, 10, -10] }}
        transition={{ repeat: Infinity, duration: 6, ease: 'easeInOut' }}
        className="relative z-10 w-full h-full flex items-center justify-center"
      >
        {/* Cutout mode — the safe box carries the padding and the per-goal
            scale, so the animated image is free to own `transform`. */}
        <div
          className={`w-full h-full ${layout.padClass} flex items-center justify-center drop-shadow-[0_20px_50px_rgba(0,0,0,0.5)]`}
          style={layout.style}
        >
          <AnimatePresence mode="wait">
            {data.image ? (
              <motion.img
                key={data.id}
                src={data.image}
                alt={data.title}
                {...motionProps}
                className={`w-full h-full ${layout.fitClass}`}
                draggable={false}
              />
            ) : (
              <motion.span
                key={data.id}
                {...motionProps}
                className="text-8xl md:text-[10rem] leading-none"
              >
                {data.label}
              </motion.span>
            )}
          </AnimatePresence>
        </div>
      </motion.div>
    </div>
    )}

    {/* Status Label */}
    <motion.div
      layout="position"
      className="absolute -bottom-8 left-1/2 -translate-x-1/2 whitespace-nowrap"
    >
      <div className="flex items-center gap-2 text-xs uppercase tracking-widest text-zinc-500 bg-zinc-950/80 px-4 py-2 rounded-full border border-white/5 backdrop-blur">
        <span className="h-1.5 w-1.5 rounded-full animate-pulse" style={{ background: data.color }} />
        {data.stats.connectionStatus}
      </div>
    </motion.div>
  </motion.div>
  )
}
const ProductDetails = ({ data, isLeft, t }: { data: ProductData; isLeft: boolean; t: ReturnType<typeof useT> }) => {
  const alignClass = isLeft ? 'items-start text-left' : 'items-end text-right'
  const flexDirClass = isLeft ? 'flex-row' : 'flex-row-reverse'

  return (
    <motion.div
      variants={ANIMATIONS.container}
      initial="hidden"
      animate="visible"
      exit="exit"
      className={`flex flex-col ${alignClass}`}
    >
      <motion.h2
        variants={ANIMATIONS.item}
        className="text-sm font-bold uppercase tracking-[0.2em] text-zinc-500 mb-2"
      >
        {data.label} · {t('goal_kicker')}
      </motion.h2>
      <motion.h1
        variants={ANIMATIONS.item}
        className="text-4xl md:text-5xl font-bold tracking-tight mb-2 text-transparent bg-clip-text bg-gradient-to-b from-white to-zinc-500"
      >
        {data.title}
      </motion.h1>
      <motion.p
        variants={ANIMATIONS.item}
        className={`text-zinc-400 mb-8 max-w-sm leading-relaxed ${isLeft ? 'mr-auto' : 'ml-auto'}`}
      >
        {data.description}
      </motion.p>

      {/* Feature Grid */}
      <motion.div
        variants={ANIMATIONS.item}
        className="w-full space-y-6 bg-zinc-900/40 p-6 rounded-2xl border border-white/5 backdrop-blur-sm"
      >
        {data.features.map((feature, idx) => (
          <div key={feature.label} className="group">
            <div className={`flex items-center justify-between mb-3 text-sm ${flexDirClass}`}>
              <div
                className={`flex items-center gap-2 ${feature.value > 50 ? 'text-zinc-200' : 'text-zinc-400'}`}
              >
                <feature.icon size={16} style={{ color: feature.value > 50 ? data.color : undefined }} />{' '}
                <span>{feature.label}</span>
              </div>
              <span className="font-mono text-xs text-zinc-500">{feature.display}</span>
            </div>
            <div className="relative h-2 w-full bg-zinc-800 rounded-full overflow-hidden">
              <motion.div
                initial={{ width: 0 }}
                animate={{ width: `${feature.value}%` }}
                transition={{ duration: 1, delay: 0.4 + idx * 0.15 }}
                className={`absolute top-0 bottom-0 ${isLeft ? 'left-0' : 'right-0'} opacity-80`}
                style={{ background: data.color }}
              />
            </div>
          </div>
        ))}

        <div className={`pt-4 flex ${isLeft ? 'justify-start' : 'justify-end'}`}>
          <div className={`flex items-center gap-2 text-xs font-semibold uppercase tracking-wider text-zinc-300 ${flexDirClass}`}>
            <Wallet size={14} style={{ color: data.color }} />
            <span className="tabular-nums">
              {t('goal_saved_of')(fmtUsd(data.amounts.saved), fmtUsd(data.amounts.target))}
            </span>
          </div>
        </div>
      </motion.div>

      {/* Progress readout */}
      <motion.div
        variants={ANIMATIONS.item}
        className={`mt-6 flex items-center gap-3 text-zinc-500 ${flexDirClass}`}
      >
        <Gauge size={16} />
        <span className="text-sm font-medium">{t('goal_pct_done')(data.stats.batteryLevel.toFixed(0))}</span>
      </motion.div>
    </motion.div>
  )
}

const Switcher = ({
  options,
  activeId,
  onToggle,
  buttonClassName = 'w-14 h-12 rounded-full text-2xl',
  surfaceId = 'island-surface',
}: {
  options: { id: string; label: string }[]
  activeId: string
  onToggle: (id: string) => void
  buttonClassName?: string
  surfaceId?: string
}) => (
  /* The dock is centred while it fits and scrolls once it doesn't — six goals
     already overflow a phone, and an unreachable goal is worse than a swipe. */
  <div className="w-full pointer-events-none px-4">
    <div className="scroll-row pointer-events-auto py-1">
      <motion.div
        layout
        className="mx-auto w-max flex items-center gap-1 p-1.5 rounded-full bg-zinc-900/80 backdrop-blur-2xl border border-white/10 shadow-[0_20px_60px_rgba(0,0,0,0.6)] ring-1 ring-white/5"
      >
        {options.map((opt) => (
          <motion.button
            key={opt.id}
            onClick={() => onToggle(opt.id)}
            whileTap={{ scale: 0.96 }}
            className={`relative shrink-0 flex items-center justify-center focus:outline-none ${buttonClassName}`}
          >
            {activeId === opt.id && (
              <motion.div
                layoutId={surfaceId}
                className="absolute inset-0 rounded-full bg-gradient-to-b from-white/10 to-white/5 shadow-inner"
                transition={{ type: 'spring', stiffness: 220, damping: 22 }}
              />
            )}
            <span
              className={`relative z-10 transition-colors duration-300 ${activeId === opt.id ? 'text-white' : 'text-zinc-500 hover:text-zinc-300'}`}
            >
              {opt.label}
            </span>
            {activeId === opt.id && (
              <motion.span
                initial={{ opacity: 0, scale: 0.8 }}
                animate={{ opacity: 1, scale: 1 }}
                className="absolute -bottom-1 left-1/2 -translate-x-1/2 h-1 w-6 rounded-full bg-gradient-to-r from-transparent via-white/60 to-transparent"
              />
            )}
          </motion.button>
        ))}
      </motion.div>
    </div>
  </div>
)

// =========================================
// MAIN COMPONENT
// =========================================

export default function GoalView({ goalId }: { goalId: string }) {
  const t = useT()
  const { profile, profits, setOpenedGoalId } = useStore()
  const { rubToUsd: r2u } = profile.settings

  const totalRub = profits.reduce((s, p) => s + p.myShare, 0)
  const totalUsd = rubToUsd(totalRub, r2u)

  const goals = profile.goals
  const [activeId, setActiveId] = useState(goalId)
  const [variantId, setVariantId] = useState<string | null>(null)
  // Undefined only if every goal was deleted while the overlay was open —
  // handled by an early return below, once all hooks have run.
  const current = goals.find(g => g.id === activeId) ?? goals[0]
  const currentIndex = Math.max(0, goals.findIndex(g => g.id === current?.id))

  // Sub-product switching (Left/Right earbuds) like the reference
  const variants = current?.variants ?? []
  const activeVariant = variants.length > 0
    ? (variants.find(v => v.id === variantId) ?? variants[0])
    : undefined

  // When switching to a goal with variants, default to its first variant
  useEffect(() => {
    if (variants.length > 0 && !variants.some(v => v.id === variantId)) {
      setVariantId(variants[0].id)
    }
  }, [current?.id])

  /**
   * Closing is a two-step: fade out here, then drop `openedGoalId` so the
   * overlay unmounts. Handing the fade to `AnimatePresence` instead made the
   * page wait on this subtree's exit, and a `layoutId` handoff still in flight
   * from a goal switch could stall it indefinitely — a blank frozen screen.
   */
  const [closing, setClosing] = useState(false)
  const close = () => setClosing(true)

  // Fullscreen overlay: Escape closes it and the page behind it stays put.
  // Uses the shared refcounted lock — a second mechanism writing
  // `document.body.style.overflow` directly would fight that counter, and
  // `overflow: hidden` alone does not stop iOS Safari rubber-banding anyway.
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') setClosing(true)
    }
    window.addEventListener('keydown', onKey)
    lockBodyScroll()
    return () => {
      window.removeEventListener('keydown', onKey)
      unlockBodyScroll()
    }
  }, [])

  // Backstop: an animation that never reports completion (backgrounded tab,
  // interrupted transition) must not be able to trap the user in the overlay.
  useEffect(() => {
    if (!closing) return
    const id = window.setTimeout(() => setOpenedGoalId(null), 450)
    return () => window.clearTimeout(id)
  }, [closing, setOpenedGoalId])

  // Last goal deleted from under the overlay — drop it instead of rendering
  // nothing on top of the page.
  useEffect(() => {
    if (!current) setOpenedGoalId(null)
  }, [current, setOpenedGoalId])

  // Every goal gone: nothing to show, so step aside rather than crash on the
  // reads below. All hooks above have already run, so this early return is safe.
  if (!current) return null

  const isLeft = activeVariant ? activeVariant.id === 'left' : currentIndex % 2 === 0

  const pct = Math.min(100, (totalUsd / current.targetAmount) * 100)
  const remaining = current.targetAmount - totalUsd
  const reached = remaining <= 0

  const data: ProductData = {
    id: activeVariant ? `${current.id}:${activeVariant.id}` : current.id,
    label: activeVariant?.label ?? current.emoji,
    title: activeVariant?.title ?? current.title,
    description: activeVariant?.description
      ?? current.description
      ?? t('goal_desc_fallback'),
    image: activeVariant?.image ?? current.imageUrl,
    // A variant may carry artwork of a different kind than the goal's own — a
    // cutout beside a plain photo — so it gets to override the fit it is drawn
    // with, falling back to the goal when it does not care.
    imagePosition: activeVariant ? activeVariant.imagePosition : current.imagePosition,
    imageFit: activeVariant?.imageFit ?? current.imageFit,
    imageScale: activeVariant ? undefined : current.imageScale,
    color: activeVariant?.color ?? current.color ?? '#C09FE6',
    stats: {
      connectionStatus: reached ? t('goal_status_reached') : t('goal_status_active'),
      batteryLevel: pct,
    },
    amounts: {
      saved: Math.min(totalUsd, current.targetAmount),
      target: current.targetAmount,
    },
    features: [
      { label: t('goal_feat_progress'), value: pct, display: `${pct.toFixed(0)}%`, icon: TrendingUp },
      {
        label: t('goal_feat_remaining'),
        value: Math.max(0, 100 - pct),
        display: fmtUsd(Math.max(0, remaining)),
        icon: Timer,
      },
    ],
  }

  const handleGoalToggle = (id: string) => {
    setActiveId(id)
    setVariantId(null)
    // Keep the store pointing at what's on screen, so the overlay survives a
    // re-render (or a reopen) showing the goal the user actually switched to.
    setOpenedGoalId(id)
  }

  const handleVariantToggle = (id: string) => setVariantId(id)

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: closing ? 0 : 1 }}
      transition={{ duration: 0.3 }}
      onAnimationComplete={() => {
        if (closing) setOpenedGoalId(null)
      }}
      style={{ pointerEvents: closing ? 'none' : undefined }}
      className="fixed inset-0 z-[60] bg-black text-zinc-100 overflow-hidden selection:bg-zinc-800"
    >
      <BackgroundGradient isLeft={isLeft} color={data.color} />

      {/* Close control — minimal overlay, does not affect composition */}
      <motion.button
        onClick={close}
        aria-label={t('goal_close')}
        initial={{ opacity: 0, x: 8 }}
        animate={{ opacity: 1, x: 0 }}
        whileHover={{ scale: 1.06 }}
        whileTap={{ scale: 0.95 }}
        style={{ top: 'max(1.5rem, calc(env(safe-area-inset-top, 0px) + 0.5rem))' }}
        className="absolute right-5 md:right-6 z-50 w-11 h-11 rounded-2xl bg-white/[0.06] border border-white/10 flex items-center justify-center text-zinc-300 hover:bg-white/[0.12] hover:text-white hover:border-white/20 transition-colors"
      >
        <X size={18} />
      </motion.button>

      {/* Scrolls when the stacked mobile composition is taller than the screen.
          Top padding clears the close button, bottom clears the switcher dock
          — which grows by a row when the goal has variants. */}
      <main
        className="absolute inset-0 z-10 overflow-y-auto overscroll-contain flex px-5 md:px-6 pt-24 md:pt-16"
        style={{
          paddingBottom: `calc(env(safe-area-inset-bottom, 0px) + ${variants.length > 0 ? '13rem' : '9.5rem'})`,
        }}
      >
        <motion.div
          layout
          transition={{ type: 'spring', bounce: 0, duration: 0.9 }}
          className={`m-auto flex flex-col md:flex-row items-center justify-center gap-14 sm:gap-20 md:gap-32 lg:gap-48 w-full max-w-7xl ${
            isLeft ? 'md:flex-row' : 'md:flex-row-reverse'
          }`}
        >
          {/* Left Column: Visuals */}
          <ProductVisual data={data} isLeft={isLeft} />

          {/* Right Column: Content */}
          <motion.div layout="position" className="w-full max-w-md">
            <AnimatePresence mode="wait">
              <ProductDetails
                key={data.id} // Key forces re-render for animation
                data={data}
                isLeft={isLeft}
                t={t}
              />
            </AnimatePresence>
          </motion.div>
        </motion.div>
      </main>

      <div
        className="absolute inset-x-0 bottom-0 z-50 pointer-events-none flex flex-col items-center gap-3"
        style={{ paddingBottom: `calc(env(safe-area-inset-bottom, 0px) + 2rem)` }}
      >
        {variants.length > 0 && (
          <Switcher
            options={variants.map(v => ({ id: v.id, label: v.label }))}
            activeId={activeVariant!.id}
            onToggle={handleVariantToggle}
            buttonClassName="w-24 h-12 rounded-full text-sm font-medium"
          />
        )}
        <Switcher
          options={goals.map(g => ({ id: g.id, label: g.emoji }))}
          activeId={current.id}
          onToggle={handleGoalToggle}
          buttonClassName="w-14 h-12 rounded-full text-2xl"
          surfaceId="goal-island-surface"
        />
      </div>
    </motion.div>
  )
}
