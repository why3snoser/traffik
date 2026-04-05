import { useMemo } from 'react'
import { useStore } from '@/store'
import { rubToUsd, usdToUah, fmtUsd, fmtUah } from '@/types'
import { useNavigate } from 'react-router-dom'

export default function Stats() {
  const { profits, workers, anketas, profile } = useStore()
  const navigate = useNavigate()
  const { rubToUsd: r2u, usdToUah: u2ua } = profile.settings

  const monthlyData = useMemo(() => {
    const map = new Map<string, number>()
    profits.forEach(p => {
      const d = new Date(p.createdAt)
      const key = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}`
      map.set(key, (map.get(key) ?? 0) + p.myShare)
    })
    const entries = Array.from(map.entries()).sort((a, b) => a[0].localeCompare(b[0])).slice(-6)
    const max = Math.max(...entries.map(e => e[1]), 1)
    return entries.map(([key, val]) => ({
      label: new Date(key + '-01').toLocaleDateString('ru-RU', { month: 'short' }),
      usd: rubToUsd(val, r2u),
      pct: (val / max) * 100,
    }))
  }, [profits, r2u])

  const totalRub = profits.reduce((s, p) => s + p.myShare, 0)
  const totalUsd = rubToUsd(totalRub, r2u)
  const avgUsd = profits.length > 0 ? totalUsd / profits.length : 0

  const topWorkers = useMemo(() =>
    [...workers].sort((a, b) => b.totalProfit - a.totalProfit).filter(w => w.totalProfit > 0),
    [workers])

  return (
    <div className="px-4 pt-6 pb-28">
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-text">Статистика</h1>
        <p className="text-text-muted text-sm mt-1">Общий обзор</p>
      </div>

      {/* Key stats */}
      <div className="grid grid-cols-3 gap-3 mb-6">
        {[
          { label: 'Заработано', value: fmtUsd(totalUsd), sub: fmtUah(usdToUah(totalUsd, u2ua)) },
          { label: 'Сделок', value: String(profits.length), sub: `~${fmtUsd(avgUsd)}/шт` },
          { label: 'Воркеров', value: String(workers.length), sub: `${anketas.length} анкет` },
        ].map(({ label, value, sub }) => (
          <div key={label} className="bg-card border border-border rounded-2xl p-3 text-center">
            <p className="text-text font-bold text-sm">{value}</p>
            <p className="text-text-muted text-[10px] mt-0.5">{sub}</p>
            <p className="text-text-muted text-[10px] mt-0.5">{label}</p>
          </div>
        ))}
      </div>

      {/* Chart */}
      {monthlyData.length > 0 && (
        <div className="bg-card border border-border rounded-2xl p-4 mb-5">
          <h3 className="text-sm font-semibold text-text mb-4">По месяцам</h3>
          <div className="flex items-end gap-2 h-28">
            {monthlyData.map(d => (
              <div key={d.label} className="flex-1 flex flex-col items-center gap-1.5">
                <span className="text-[10px] text-success font-medium">{d.pct > 90 ? fmtUsd(d.usd) : ''}</span>
                <div
                  className="w-full rounded-t-lg transition-all"
                  style={{ height: `${Math.max(d.pct, 4)}%`, backgroundColor: `rgba(124,92,252,${0.2 + d.pct / 100 * 0.8})` }}
                />
                <span className="text-[10px] text-text-muted">{d.label}</span>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Workers ranking */}
      {topWorkers.length > 0 && (
        <div className="bg-card border border-border rounded-2xl p-4">
          <h3 className="text-sm font-semibold text-text mb-3">Рейтинг воркеров</h3>
          <div className="flex flex-col gap-3">
            {topWorkers.map((w, i) => {
              const usd = rubToUsd(w.totalProfit, r2u)
              return (
                <button key={w.id} onClick={() => navigate(`/workers/${w.id}`)} className="flex items-center gap-3 text-left">
                  <span className="text-sm font-bold text-text-muted w-5">{i + 1}</span>
                  <span className="text-xl">{w.emoji}</span>
                  <div className="flex-1">
                    <div className="flex justify-between items-baseline mb-1">
                      <span className="text-sm text-text font-medium">{w.name}</span>
                      <span className="text-sm text-success font-bold">{fmtUsd(usd)}</span>
                    </div>
                    <div className="h-1.5 bg-black/30 rounded-full overflow-hidden">
                      <div
                        className="h-full bg-accent rounded-full"
                        style={{ width: `${(w.totalProfit / topWorkers[0].totalProfit) * 100}%` }}
                      />
                    </div>
                  </div>
                </button>
              )
            })}
          </div>
        </div>
      )}
    </div>
  )
}
