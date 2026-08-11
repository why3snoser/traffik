import { motion } from 'framer-motion'
import { Maximize2, Trash2 } from 'lucide-react'
import type { Goal } from '@/types'
import { useT } from '@/i18n'
import { GOAL_FRAME_CARD, GOAL_FRAME_PHOTO_CARD, goalPhotoStyle, resolveGoalImage } from '@/lib/goalImage'

function hexToRgba(hex: string, alpha: number): string {
  const h = hex.replace('#', '')
  const full = h.length === 3 ? h.split('').map(c => c + c).join('') : h
  const int = parseInt(full, 16)
  const r = (int >> 16) & 255
  const g = (int >> 8) & 255
  const b = int & 255
  return `rgba(${r}, ${g}, ${b}, ${alpha})`
}

interface GoalShowcaseCardProps {
  goal: Goal
  totalUsd: number
  fmtUsd: (value: number) => string
  onDelete: (id: string) => void
  onOpen: () => void
}

export function GoalShowcaseCard({ goal, totalUsd, fmtUsd, onDelete, onOpen }: GoalShowcaseCardProps) {
  const t = useT()
  const pct = Math.min(100, (totalUsd / goal.targetAmount) * 100)
  const color = goal.color ?? '#C09FE6'
  const image = resolveGoalImage(goal)
  const isPhoto = goal.imageFit === 'cover' && !!goal.imageUrl

  return (
    <motion.button
      layoutId={`goal-card-${goal.id}`}
      onClick={onOpen}
      whileHover={{ y: -3 }}
      transition={{ type: 'spring', stiffness: 300, damping: 24 }}
      className="group relative w-full text-left overflow-hidden rounded-[26px] border border-white/10 bg-black/30 backdrop-blur-sm p-5 md:p-6 transition-colors hover:border-white/20 cursor-pointer"
    >
      {/* Ambient glow */}
      <motion.div
        animate={{ opacity: [0.15, 0.32, 0.15] }}
        transition={{ duration: 5, repeat: Infinity, ease: 'easeInOut' }}
        className="absolute -top-10 left-1/2 -translate-x-1/2 w-44 h-44 rounded-full blur-2xl pointer-events-none"
        style={{ background: `radial-gradient(circle, ${hexToRgba(color, 0.5)} 0%, transparent 70%)` }}
      />

      <div className="relative flex items-center gap-5 md:gap-7">
        {/* Visual */}
        <div className="relative shrink-0">
          {/* Photo goals skip the ring and the frame — an outline around a
              portrait reads as chrome, and the round crop cut the subject. */}
          {!isPhoto && (
            <div
              className="absolute inset-[-15%] rounded-full border border-dashed goal-ring"
              style={{ borderColor: hexToRgba(color, 0.45) }}
            />
          )}
          <div
            className="absolute inset-0 rounded-full goal-glow blur-xl"
            style={{ background: `radial-gradient(circle, ${hexToRgba(color, 0.5)} 0%, transparent 70%)` }}
          />
          <div
            className={
              isPhoto
                ? `relative ${GOAL_FRAME_PHOTO_CARD} flex items-center justify-center`
                : `relative ${GOAL_FRAME_CARD} ${image.padClass} rounded-full border border-white/10 bg-black/30 flex items-center justify-center overflow-hidden`
            }
          >
            {goal.imageUrl ? (
              <img
                src={goal.imageUrl}
                alt={goal.title}
                className={`w-full h-full ${image.fitClass}`}
                style={isPhoto ? goalPhotoStyle(goal.imagePosition) : image.style}
                draggable={false}
              />
            ) : (
              <span className="text-4xl leading-none goal-float">{goal.emoji}</span>
            )}
          </div>
        </div>

        {/* Content */}
        <div className="flex-1 min-w-0">
          <p className="text-[10px] uppercase tracking-[0.2em] text-zinc-500 mb-1">
            {goal.emoji} · {t('goal_kicker')}
          </p>
          <h4 className="text-xl md:text-2xl font-bold tracking-tight text-transparent bg-clip-text bg-gradient-to-b from-white to-zinc-500 truncate">
            {goal.title}
          </h4>
          {goal.description && (
            <p className="mt-1 text-sm text-zinc-500 line-clamp-2">{goal.description}</p>
          )}

          {/* Mini progress */}
          <div className="mt-3">
            <div className="flex items-center justify-between mb-1.5 text-xs">
              <span className="text-zinc-500">{t('goal_feat_progress')}</span>
              <span className="font-mono text-zinc-500">{pct.toFixed(0)}%</span>
            </div>
            <div className="h-1.5 w-full bg-zinc-800 rounded-full overflow-hidden">
              <motion.div
                initial={{ width: 0 }}
                animate={{ width: `${pct}%` }}
                transition={{ duration: 1, ease: 'easeOut' }}
                className="h-full rounded-full"
                style={{
                  background: `linear-gradient(90deg, ${hexToRgba(color, 0.5)}, ${color})`,
                  boxShadow: `0 0 8px ${hexToRgba(color, 0.4)}`,
                }}
              />
            </div>
          </div>

          <div className="mt-3 flex items-center justify-between">
            <span className="text-xs text-zinc-500 tabular-nums">{fmtUsd(totalUsd)}</span>
            <span className="flex items-center gap-1 text-xs font-medium text-zinc-400 group-hover:text-white transition-colors">
              {t('goal_open')}
              <Maximize2 size={12} className="group-hover:scale-110 transition-transform" />
            </span>
          </div>
        </div>
      </div>

      {/* Delete — hover-reveal is a desktop affordance; on touch there is no
          hover, so the button has to stay visible or it can never be reached. */}
      <button
        onClick={e => {
          e.stopPropagation()
          onDelete(goal.id)
        }}
        className="absolute top-2.5 right-2.5 w-9 h-9 md:w-7 md:h-7 rounded-lg bg-white/[0.05] border border-white/10 flex items-center justify-center text-zinc-500 opacity-100 md:opacity-0 md:group-hover:opacity-100 hover:text-red-400 transition-all"
      >
        <Trash2 size={14} className="md:w-3 md:h-3" />
      </button>
    </motion.button>
  )
}
