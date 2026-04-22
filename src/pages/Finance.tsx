import { useMemo } from 'react'
import { Calendar } from 'lucide-react'
import { useStore } from '@/store'
import { PROFIT_LABELS, rubToUsd, usdToUah, fmtUsd, fmtUah } from '@/types'
import { useNavigate } from 'react-router-dom'

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

  return (
    <div className="px-4 pt-6 pb-28">
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-text">Финансы</h1>
        <p className="text-text-muted text-sm mt-1">Все воркеры</p>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 gap-3 mb-6">
        {[
          { label: 'Today', usd: stats.today },
          { label: 'Week', usd: stats.week },
          { label: 'Month', usd: stats.month },
          { label: 'All time', usd: stats.total },
        ].map(({ label, usd }) => (
          <div key={label} className="glass-light rounded-2xl p-4 neon-hover">
            <p className="text-text-muted text-[10px] uppercase tracking-widest mb-2">{label}</p>
            <p className="text-xl font-bold text-white">{fmtUsd(usd)}</p>
            <p className="text-text-muted text-xs mt-0.5">{fmtUah(usdToUah(usd, u2ua))}</p>
          </div>
        ))}
      </div>

      {/* Per worker */}
      {workers.length > 0 && (
        <div className="flex gap-2 overflow-x-auto pb-1 mb-5">
          {workers.filter(w => w.totalProfit > 0).map(w => (
            <button
              key={w.id}
              onClick={() => navigate(`/workers/${w.id}`)}
              className="flex-shrink-0 glass-light rounded-2xl px-4 py-3 text-left hover:bg-white/[0.06] transition-colors"
            >
              <div className="flex items-center gap-2 mb-1">
                <span className="text-base">{w.emoji}</span>
                <span className="text-sm font-medium text-text">{w.name}</span>
              </div>
              <p className="text-success font-bold text-sm">{fmtUsd(rubToUsd(w.totalProfit, r2u))}</p>
            </button>
          ))}
        </div>
      )}

      {/* History */}
      {grouped.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-16 gap-3 text-text-muted">
          <p className="text-sm">Нет записей. Зайди в воркера и добавь профит.</p>
        </div>
      ) : (
        <div className="flex flex-col gap-4">
          {grouped.map(([date, entries]) => (
            <div key={date}>
              <div className="flex items-center gap-2 mb-2 px-1">
                <Calendar size={12} className="text-text-muted" />
                <span className="text-xs text-text-muted font-medium">{date}</span>
                <div className="flex-1 h-px bg-border" />
                <span className="text-xs text-success font-medium">
                  +{fmtUsd(rubToUsd(entries.reduce((s, e) => s + e.myShare, 0), r2u))}
                </span>
              </div>
              <div className="flex flex-col gap-2">
                {entries.map(entry => {
                  const w = workerMap.get(entry.workerId)
                  const usd = rubToUsd(entry.myShare, r2u)
                  const uah = usdToUah(usd, u2ua)
                  return (
                    <div key={entry.id} className="glass-light rounded-2xl px-4 py-3 neon-hover" style={{ borderLeft: '2px solid rgba(0,230,118,0.30)' }}>
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-2.5">
                          {w && <span className="text-base">{w.emoji}</span>}
                          <div>
                            <p className="text-xs text-text font-medium">{PROFIT_LABELS[entry.type]}</p>
                            {(entry.note || entry.amount > 0) && (
                              <p className="text-text-muted text-[10px] mt-0.5">{entry.amount.toLocaleString('uk-UA')} ₽{entry.note ? ` · ${entry.note}` : ''}</p>
                            )}
                          </div>
                        </div>
                        <div className="text-right">
                          <p className="text-accent font-bold text-sm">+{fmtUsd(usd)}</p>
                          <p className="text-text-muted text-[10px] mt-0.5">{fmtUah(uah)}</p>
                        </div>
                      </div>
                    </div>
                  )
                })}
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}
