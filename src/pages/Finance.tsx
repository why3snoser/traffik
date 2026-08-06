import { useMemo } from 'react'
import { Calendar, ArrowUpRight, TrendingUp } from 'lucide-react'
import { useStore } from '@/store'
import { PROFIT_LABELS, rubToUsd, usdToUah, fmtUsd, fmtUah } from '@/types'
import { useNavigate } from 'react-router-dom'
import { ProfitCard } from '@/components/ProfitCard'

function startOf(unit: 'day' | 'week' | 'month') {
  const d = new Date()
  if (unit === 'day') { d.setHours(0,0,0,0); return d }
  if (unit === 'week') { const day = d.getDay(); d.setDate(d.getDate() - (day === 0 ? 6 : day - 1)); d.setHours(0,0,0,0); return d }
  d.setDate(1); d.setHours(0,0,0,0); return d
}

export default function Finance() {
  const { profits, workers, profile } = useStore()
  const navigate = useNavigate()
  const { rubToUsd: r2u, usdToUah: u2ua } = profile.settings

  const stats = useMemo(() => {
    const dayStart = startOf('day').getTime()
    const weekStart = startOf('week').getTime()
    const monthStart = startOf('month').getTime()
    const toUsd = (rub: number) => rubToUsd(rub, r2u)
    return {
      today: toUsd(profits.filter(p => new Date(p.createdAt).getTime() >= dayStart).reduce((s, p) => s + p.myShare, 0)),
      week: toUsd(profits.filter(p => new Date(p.createdAt).getTime() >= weekStart).reduce((s, p) => s + p.myShare, 0)),
      month: toUsd(profits.filter(p => new Date(p.createdAt).getTime() >= monthStart).reduce((s, p) => s + p.myShare, 0)),
      total: toUsd(profits.reduce((s, p) => s + p.myShare, 0)),
    }
  }, [profits, r2u])

  const grouped = useMemo(() => {
    const map = new Map<string, typeof profits>()
    profits.forEach(p => {
      const date = new Date(p.createdAt).toLocaleDateString('uk-UA', { day: 'numeric', month: 'long' })
      if (!map.has(date)) map.set(date, [])
      map.get(date)!.push(p)
    })
    return Array.from(map.entries())
  }, [profits])

  const workerMap = useMemo(() =>
    new Map(workers.map(w => [w.id, w])), [workers])

  const statItems = [
    { label: 'Today', usd: stats.today, accent: '#E4DEFF' },
    { label: 'Week', usd: stats.week, accent: '#A596E8' },
    { label: 'Month', usd: stats.month, accent: '#C3BCEA' },
    { label: 'All time', usd: stats.total, accent: '#8B7DCC' },
  ]

  return (
    <div className="px-4 pt-6 pb-28 md:pb-8 md:px-8 max-w-2xl relative">
      {/* ── Hero — jelly / gradient-glow treatment ───────────────────── */}
      <div className="relative mb-8 text-center">
        {/* Glowing blob behind the title */}
        <div
          className="absolute left-1/2 top-0 h-72 w-[92%] -translate-x-1/2 opacity-70 pointer-events-none"
          style={{
            background: 'radial-gradient(50% 55% at 50% 20%, rgba(139,125,204,0.45) 0%, rgba(124,111,208,0.15) 45%, transparent 75%)',
            filter: 'blur(38px)',
            transform: 'translateX(-50%) rotate(-6deg)',
          }}
        />
        <div
          className="absolute right-[-6%] top-4 h-40 w-40 rounded-full pointer-events-none opacity-60"
          style={{ background: 'radial-gradient(circle, rgba(90,200,250,0.30) 0%, transparent 70%)', filter: 'blur(28px)' }}
        />
        <div
          className="absolute left-[-6%] top-20 h-40 w-40 rounded-full pointer-events-none opacity-50"
          style={{ background: 'radial-gradient(circle, rgba(232,192,106,0.22) 0%, transparent 70%)', filter: 'blur(30px)' }}
        />

        <div className="relative">
          <h1
            className="mx-auto mb-4 max-w-3xl bg-clip-text text-4xl font-bold tracking-tighter text-transparent md:text-5xl"
            style={{ backgroundImage: 'linear-gradient(to bottom, #E4DEFF 0%, #A596E8 45%, rgba(139,125,204,0.55) 100%)' }}
          >
            Фінанси
          </h1>
          <p className="mx-auto mb-6 max-w-md text-sm text-text-muted md:text-base">
            Профіти по всіх воркерах в одному місці — статистика, історія та динаміка.
          </p>

          {/* Glass CTA with animated arrow */}
          <button
            onClick={() => navigate('/stats')}
            className="group mx-auto inline-flex items-center gap-2 rounded-xl border border-white/25 bg-white/[0.04] px-4 py-2.5 text-sm font-semibold text-white backdrop-blur-md transition-colors duration-200 hover:border-accent/50 hover:bg-white/[0.07]"
          >
            <TrendingUp size={15} className="text-accent-light" />
            Аналітика
            <span className="relative ml-1 flex h-5 w-5 items-center justify-center overflow-hidden">
              <ArrowUpRight className="absolute transition-all duration-500 group-hover:translate-x-4 group-hover:-translate-y-4" size={16} />
              <ArrowUpRight className="absolute -translate-x-4 -translate-y-4 transition-all duration-500 group-hover:translate-x-0 group-hover:translate-y-0" size={16} />
            </span>
          </button>
        </div>
      </div>

      {/* ── Stats ─────────────────────────────────────────────────────── */}
      <div className="relative grid grid-cols-2 gap-3 mb-6">
        {statItems.map(({ label, usd, accent }) => (
          <div key={label} className="glass-light rounded-2xl p-4 neon-hover">
            <p className="text-text-muted text-[10px] uppercase tracking-widest mb-2">{label}</p>
            <p className="text-xl font-bold text-white tabular-nums" style={{ textShadow: `0 0 18px ${accent}33` }}>{fmtUsd(usd)}</p>
            <p className="text-text-muted text-xs mt-0.5 tabular-nums">{fmtUah(usdToUah(usd, u2ua))} ₴</p>
          </div>
        ))}
      </div>

      {/* ── Per worker ────────────────────────────────────────────────── */}
      {workers.length > 0 && (
        <div className="relative flex gap-2 overflow-x-auto pb-1 mb-5">
          {workers.filter(w => w.totalProfit > 0).map(w => (
            <button
              key={w.id}
              onClick={() => navigate(`/workers/${w.id}`)}
              className="group flex-shrink-0 glass-light rounded-2xl px-4 py-3 text-left hover:bg-white/[0.06] transition-colors"
            >
              <div className="flex items-center gap-2 mb-1">
                <span className="text-base">{w.emoji}</span>
                <span className="text-sm font-medium text-text">{w.name}</span>
              </div>
              <p className="text-accent-light font-bold text-sm tabular-nums">{fmtUsd(rubToUsd(w.totalProfit, r2u))}</p>
            </button>
          ))}
        </div>
      )}

      {/* ── History ───────────────────────────────────────────────────── */}
      {grouped.length === 0 ? (
        <div className="relative flex flex-col items-center justify-center py-16 gap-3 text-text-muted">
          <div className="w-16 h-16 rounded-2xl glass-light flex items-center justify-center text-3xl">📊</div>
          <p className="text-sm">Нет записей. Зайди в воркера и добавь профит.</p>
        </div>
      ) : (
        <div className="relative flex flex-col gap-4">
          {grouped.map(([date, entries]) => {
            const dayUsd = rubToUsd(entries.reduce((s, e) => s + e.myShare, 0), r2u)
            return (
              <div key={date}>
                <div className="flex items-center gap-2 mb-2 px-1">
                  <Calendar size={12} className="text-text-muted" />
                  <span className="text-xs text-text-muted font-medium">{date}</span>
                  <div className="flex-1 h-px bg-border" />
                  <span className="text-xs font-bold gradient-text tabular-nums">+{fmtUsd(dayUsd)}</span>
                </div>
                <div className="flex flex-col gap-2.5">
                  {entries.map(entry => {
                    const w = workerMap.get(entry.workerId)
                    return (
                      <ProfitCard
                        key={entry.id}
                        entry={entry}
                        label={PROFIT_LABELS[entry.type]}
                        workerLabel={w ? `${w.emoji} ${w.name}` : undefined}
                        r2u={r2u}
                        u2ua={u2ua}
                      />
                    )
                  })}
                </div>
              </div>
            )
          })}
        </div>
      )}
    </div>
  )
}
