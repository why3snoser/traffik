import { useEffect, useState } from 'react'
import { motion, AnimatePresence, type Variants } from 'framer-motion'
import {
  Battery,
  Sliders,
  ChevronRight,
  X,
  TrendingUp,
  Timer,
  type LucideIcon,
} from 'lucide-react'
import { useStore } from '@/store'
import { rubToUsd } from '@/types'

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
  value: number
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

const ProductVisual = ({ data, isLeft }: { data: ProductData; isLeft: boolean }) => (
  <motion.div layout="position" className="relative group shrink-0">
    {/* Animated Rings */}
    <motion.div
      animate={{ rotate: 360, borderColor: hexToRgba(data.color, 0.35) }}
      transition={{
        rotate: { duration: 20, repeat: Infinity, ease: 'linear' },
        borderColor: { duration: 1.2, ease: [0.16, 1, 0.3, 1] },
      }}
      className="absolute inset-[-20%] rounded-full border border-dashed border-white/[0.06]"
    />
    <motion.div
      animate={{
        scale: [1, 1.06, 1],
        background: `linear-gradient(135deg, ${hexToRgba(data.color, 0.55)}, ${hexToRgba(data.color, 0.22)})`,
      }}
      transition={{
        scale: { duration: 4, repeat: Infinity, ease: 'easeInOut' },
        background: { duration: 1.2, ease: [0.16, 1, 0.3, 1] },
      }}
      className="absolute inset-[-10%] rounded-full blur-3xl opacity-35"
    />

    {/* Image Container */}
    <div className="relative h-80 w-80 md:h-[450px] md:w-[450px] rounded-full border border-white/5 shadow-2xl flex items-center justify-center overflow-hidden bg-black/35 backdrop-blur-sm">
      <motion.div
        animate={{ y: [-10, 10, -10] }}
        transition={{ repeat: Infinity, duration: 6, ease: 'easeInOut' }}
        className="relative z-10 w-full h-full flex items-center justify-center"
      >
        <AnimatePresence mode="wait">
          {data.image ? (
            data.imageFit === 'cover' ? (
              /* Photo mode — w-full h-full object-cover, clipped round by the circle */
              <motion.img
                key={data.id}
                src={data.image}
                alt={data.title}
                variants={ANIMATIONS.image(isLeft)}
                initial="initial"
                animate="animate"
                exit="exit"
                className="w-full h-full object-cover"
                style={{ objectPosition: 'center' }}
                draggable={false}
              />
            ) : (
              /* Cutout mode — PNG canvas has transparent padding, so the element
                 itself overflows the circle; object-contain keeps the product
                 centered, and per-goal imageScale normalizes differing aspect ratios. */
              <div
                style={{ transform: `scale(${data.imageScale ?? 1.4})` }}
                className="w-full h-full flex items-center justify-center"
              >
                <motion.img
                  key={data.id}
                  src={data.image}
                  alt={data.title}
                  variants={ANIMATIONS.image(isLeft)}
                  initial="initial"
                  animate="animate"
                  exit="exit"
                  className="w-[130%] h-[130%] object-contain drop-shadow-[0_20px_50px_rgba(0,0,0,0.5)]"
                  draggable={false}
                />
              </div>
            )
          ) : (
            <motion.span
              key={data.id}
              variants={ANIMATIONS.image(isLeft)}
              initial="initial"
              animate="animate"
              exit="exit"
              className="text-8xl md:text-[10rem] leading-none"
            >
              {data.label}
            </motion.span>
          )}
        </AnimatePresence>
      </motion.div>
    </div>

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

const ProductDetails = ({ data, isLeft }: { data: ProductData; isLeft: boolean }) => {
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
        {data.label} · Ціль
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
              <span className="font-mono text-xs text-zinc-500">{feature.value.toFixed(0)}%</span>
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
          <button
            type="button"
            className="flex items-center gap-2 text-xs font-semibold uppercase tracking-wider text-zinc-300 transition-all duration-300 group px-2 py-1.5 -mx-2 rounded-lg hover:text-white hover:bg-white/[0.06] active:scale-[0.97]"
          >
            <Sliders size={14} /> Деталі
            <ChevronRight size={14} className="group-hover:translate-x-1 transition-transform" />
          </button>
        </div>
      </motion.div>

      {/* Battery */}
      <motion.div
        variants={ANIMATIONS.item}
        className={`mt-6 flex items-center gap-3 text-zinc-500 ${flexDirClass}`}
      >
        <Battery size={16} />
        <span className="text-sm font-medium">{data.stats.batteryLevel.toFixed(0)}% виконано</span>
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
  <div className="flex justify-center pointer-events-none">
    <motion.div
      layout
      className="pointer-events-auto flex items-center gap-1 p-1.5 rounded-full bg-zinc-900/80 backdrop-blur-2xl border border-white/10 shadow-[0_20px_60px_rgba(0,0,0,0.6)] ring-1 ring-white/5"
    >
      {options.map((opt) => (
        <motion.button
          key={opt.id}
          onClick={() => onToggle(opt.id)}
          whileTap={{ scale: 0.96 }}
          className={`relative focus:outline-none ${buttonClassName}`}
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
              className="absolute -bottom-1 h-1 w-6 rounded-full bg-gradient-to-r from-transparent via-white/60 to-transparent"
            />
          )}
        </motion.button>
      ))}
    </motion.div>
  </div>
)

// =========================================
// MAIN COMPONENT
// =========================================

export default function GoalView({ goalId }: { goalId: string }) {
  const { profile, profits, setOpenedGoalId } = useStore()
  const { rubToUsd: r2u } = profile.settings

  const totalRub = profits.reduce((s, p) => s + p.myShare, 0)
  const totalUsd = rubToUsd(totalRub, r2u)

  const goals = profile.goals
  const [activeId, setActiveId] = useState(goalId)
  const [variantId, setVariantId] = useState<string | null>(null)
  const current = goals.find(g => g.id === activeId) ?? goals[0]
  const currentIndex = Math.max(0, goals.findIndex(g => g.id === current.id))

  // Sub-product switching (Left/Right earbuds) like the reference
  const variants = current.variants ?? []
  const activeVariant = variants.length > 0
    ? (variants.find(v => v.id === variantId) ?? variants[0])
    : undefined

  // When switching to a goal with variants, default to its first variant
  useEffect(() => {
    if (current.variants && current.variants.length > 0 && !current.variants.some(v => v.id === variantId)) {
      setVariantId(current.variants[0].id)
    }
  }, [current.id])

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
      ?? 'Ціль у процесі накопичення. Додавай профіти і рухайся до мрії.',
    image: activeVariant?.image ?? current.imageUrl,
    imagePosition: activeVariant ? undefined : current.imagePosition,
    imageFit: activeVariant ? undefined : current.imageFit,
    imageScale: activeVariant ? undefined : current.imageScale,
    color: activeVariant?.color ?? current.color ?? '#8B7DCC',
    stats: {
      connectionStatus: reached ? 'Досягнута' : 'В процесі',
      batteryLevel: pct,
    },
    features: [
      { label: 'Прогрес', value: pct, icon: TrendingUp },
      { label: 'Залишилось', value: Math.max(0, 100 - pct), icon: Timer },
    ],
  }

  const close = () => setOpenedGoalId(null)

  const handleGoalToggle = (id: string) => {
    setActiveId(id)
    setVariantId(null)
  }

  const handleVariantToggle = (id: string) => setVariantId(id)

  return (
    <motion.div
      layoutId={`goal-card-${goalId}`}
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      transition={{ duration: 0.35 }}
      className="relative w-full h-full min-h-screen bg-black text-zinc-100 overflow-hidden selection:bg-zinc-800 flex flex-col items-center justify-center"
    >
      <BackgroundGradient isLeft={isLeft} color={data.color} />

      {/* Close control — minimal overlay, does not affect composition */}
      <motion.button
        onClick={close}
        initial={{ opacity: 0, x: 8 }}
        animate={{ opacity: 1, x: 0 }}
        whileHover={{ scale: 1.06 }}
        whileTap={{ scale: 0.95 }}
        className="absolute top-6 right-6 z-50 w-10 h-10 rounded-2xl bg-white/[0.06] border border-white/10 flex items-center justify-center text-zinc-300 hover:bg-white/[0.12] hover:text-white hover:border-white/20 transition-colors"
      >
        <X size={18} />
      </motion.button>

      <main className="relative z-10 w-full px-6 py-8 flex flex-col justify-center max-w-7xl mx-auto">
        <motion.div
          layout
          transition={{ type: 'spring', bounce: 0, duration: 0.9 }}
          className={`flex flex-col md:flex-row items-center justify-center gap-12 md:gap-40 lg:gap-60 w-full ${
            isLeft ? 'md:flex-row' : 'md:flex-row-reverse'
          }`}
        >
          {/* Left Column: Visuals */}
          <AnimatePresence mode="wait">
            <motion.div
              key={data.id}
              initial={{ opacity: 0, scale: 0.94, filter: 'blur(8px)' }}
              animate={{ opacity: 1, scale: 1, filter: 'blur(0px)' }}
              exit={{ opacity: 0, scale: 0.9, filter: 'blur(8px)' }}
              transition={{ duration: 0.3, ease: [0.16, 1, 0.3, 1] }}
            >
              <ProductVisual data={data} isLeft={isLeft} />
            </motion.div>
          </AnimatePresence>

          {/* Right Column: Content */}
          <motion.div layout="position" className="w-full max-w-md">
            <AnimatePresence mode="wait">
              <ProductDetails
                key={data.id} // Key forces re-render for animation
                data={data}
                isLeft={isLeft}
              />
            </AnimatePresence>
          </motion.div>
        </motion.div>
      </main>

      <div className="absolute bottom-12 inset-x-0 z-50 pointer-events-none flex flex-col items-center gap-4">
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
