import { ChevronRight } from 'lucide-react'
import type { Worker, ProfitEntry } from '@/types'
import { rubToUsd, usdToUah, fmtUsd, fmtUah, fmtRub, getLevelInfo } from '@/types'
import { INTL_LOCALE, useLang } from '@/i18n'

interface WorkerProfitCardProps {
  worker: Worker
  entry: ProfitEntry
  label: string
  r2u: number
  u2ua: number
}

export function WorkerProfitCard({ worker, entry, label, r2u, u2ua }: WorkerProfitCardProps) {
  const usd = rubToUsd(entry.myShare, r2u)
  const uah = usdToUah(usd, u2ua)
  const workerUah = usdToUah(rubToUsd(worker.totalProfit, r2u), u2ua)
  const level = getLevelInfo(workerUah).level

  const time = new Date(entry.createdAt).toLocaleTimeString(INTL_LOCALE[useLang()], {
    hour: '2-digit',
    minute: '2-digit',
  })

  return (
    <div className="group relative glass-light rounded-[22px] p-4 neon-hover active:scale-[0.98] transition-all duration-200">
      <div className="flex items-center gap-3.5">
        {/* Round avatar */}
        <div className="relative flex-shrink-0">
          <div
            className="absolute inset-0 rounded-full blur-lg opacity-40"
            style={{ background: 'rgba(139,125,204,0.45)' }}
          />
          <div className="relative w-12 h-12 rounded-full bg-gradient-to-br from-white/[0.10] to-white/[0.03] border border-white/10 flex items-center justify-center overflow-hidden">
            {worker.avatarUrl ? (
              <img src={worker.avatarUrl} alt={worker.name} className="w-full h-full object-cover" style={{ filter: 'brightness(0.85) saturate(0.7)' }} />
            ) : (
              <span className="text-xl leading-none">{worker.emoji}</span>
            )}
          </div>
        </div>

        {/* Name + level + label */}
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2">
            <p className="text-[15px] font-bold text-text truncate">{worker.name}</p>
            <span
              className="flex-shrink-0 px-1.5 py-0.5 rounded-md text-[9px] font-bold tracking-wider"
              style={{ background: 'rgba(139,125,204,0.14)', border: '1px solid rgba(139,125,204,0.25)', color: '#A596E8' }}
            >
              LVL {level}
            </span>
          </div>
          <p className="text-xs text-text-muted mt-1 truncate">{label}</p>
          {entry.note && (
            <p className="text-[11px] text-text-muted/70 mt-0.5 truncate">{entry.note}</p>
          )}
        </div>

        {/* Earned + profit */}
        <div className="text-right flex-shrink-0">
          <p className="text-lg font-extrabold gradient-text tabular-nums leading-none">
            +{fmtUsd(usd)}
          </p>
          <p className="text-[11px] text-text-muted mt-1.5 tabular-nums">{fmtUah(uah)} ₴</p>
          <p className="text-[10px] text-text-muted/60 mt-0.5 tabular-nums">{fmtRub(entry.amount)} · {time}</p>
        </div>

        <ChevronRight size={18} className="flex-shrink-0 text-text-muted/50 group-hover:text-accent-light transition-colors" />
      </div>
    </div>
  )
}
