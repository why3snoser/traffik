import {
  Banknote,
  ArrowRightLeft,
  Zap,
  Undo2,
  Scale,
  type LucideIcon,
} from 'lucide-react'
import type { ProfitEntry, ProfitType } from '@/types'
import { rubToUsd, usdToUah, fmtUsd, fmtUah } from '@/types'

interface TypeMeta {
  Icon: LucideIcon
  color: string
  glow: string
}

// One soft accent per operation type — all in the app's violet family so the
// whole list keeps a calm, premium feel.
const TYPE_META: Record<ProfitType, TypeMeta> = {
  oplata: {
    Icon: Banknote,
    color: '#C3BCEA',
    glow: 'rgba(139,125,204,0.45)',
  },
  perevod: {
    Icon: ArrowRightLeft,
    color: '#A596E8',
    glow: 'rgba(139,125,204,0.40)',
  },
  iks: {
    Icon: Zap,
    color: '#E4DEFF',
    glow: 'rgba(150,130,220,0.40)',
  },
  vozvrat: {
    Icon: Undo2,
    color: '#E8C06A',
    glow: 'rgba(232,192,106,0.35)',
  },
  vozvrat_yurist: {
    Icon: Scale,
    color: '#6E9FE8',
    glow: 'rgba(110,159,232,0.35)',
  },
}

interface ProfitCardProps {
  entry: ProfitEntry
  label: string
  workerLabel?: string
  r2u: number
  u2ua: number
}

export function ProfitCard({ entry, label, workerLabel, r2u, u2ua }: ProfitCardProps) {
  const meta = TYPE_META[entry.type] ?? TYPE_META.oplata
  const { Icon } = meta

  const usd = rubToUsd(entry.myShare, r2u)
  const uah = usdToUah(usd, u2ua)

  const time = new Date(entry.createdAt).toLocaleTimeString('uk-UA', {
    hour: '2-digit',
    minute: '2-digit',
  })

  const sub = [workerLabel, entry.amount.toLocaleString('uk-UA') + ' ₽']
    .filter(Boolean)
    .join(' · ')

  return (
    <div className="group relative glass-light rounded-[22px] p-4 neon-hover active:scale-[0.98] transition-all duration-200">
      <div className="flex items-center gap-4">
        {/* Icon */}
        <div className="relative flex-shrink-0">
          <div
            className="absolute inset-0 rounded-2xl blur-lg opacity-40"
            style={{ background: meta.glow }}
          />
          <div className="relative w-12 h-12 rounded-2xl bg-gradient-to-br from-white/[0.10] to-white/[0.03] border border-white/10 flex items-center justify-center">
            <Icon size={20} color={meta.color} />
          </div>
        </div>

        {/* Title + info */}
        <div className="flex-1 min-w-0">
          <p className="text-[15px] font-bold text-text truncate">{label}</p>
          {sub && (
            <p className="text-xs text-text-muted mt-1 truncate tabular-nums">{sub}</p>
          )}
          {entry.note && (
            <p className="text-[11px] text-text-muted/70 mt-0.5 truncate">{entry.note}</p>
          )}
        </div>

        {/* Profit */}
        <div className="text-right flex-shrink-0">
          <p className="text-lg font-extrabold gradient-text tabular-nums leading-none">
            +{fmtUsd(usd)}
          </p>
          <p className="text-[11px] text-text-muted mt-1.5 tabular-nums">{fmtUah(uah)} ₴</p>
          <p className="text-[10px] text-text-muted/60 mt-0.5 tabular-nums">{time}</p>
        </div>
      </div>
    </div>
  )
}
