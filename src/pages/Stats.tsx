import { useMemo } from 'react'
import { TrendingUp, TrendingDown, Minus, Trophy, Zap, Star } from 'lucide-react'
import { useStore } from '@/store'
import { rubToUsd, usdToUah, fmtUsd, fmtUah, PROFIT_LABELS, ProfitType, getLevelInfo } from '@/types'
import { useNavigate } from 'react-router-dom'

export default function Stats() {
  const { profits, workers, anketas, profile } = useStore()
  const navigate = useNavigate()
  const { rubToUsd: r2u, usdToUah: u2ua } = profile.settings

  const totalRub = profits.reduce((s, p) => s + p.myShare, 0)
  const totalUsd = rubToUsd(totalRub, r2u)
  const totalUah = usdToUah(totalUsd, u2ua)
  const avgUsd = profits.length > 0 ? totalUsd / profits.length : 0
  const levelInfo = getLevelInfo(totalUah)

  // Monthly data (last 6 months)
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

  // This month vs last month
  const now = new Date()
  const thisMonthKey = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}`
  const lastMonthDate = new Date(now.getFullYear(), now.getMonth() - 1, 1)
  const lastMonthKey = `${lastMonthDate.getFullYear()}-${String(lastMonthDate.getMonth() + 1).padStart(2, '0')}`
  const thisMonthRub = profits.filter(p => p.createdAt.startsWith(thisMonthKey)).reduce((s, p) => s + p.myShare, 0)
  const lastMonthRub = profits.filter(p => p.createdAt.startsWith(lastMonthKey)).reduce((s, p) => s + p.myShare, 0)
  const monthChange = lastMonthRub > 0 ? ((thisMonthRub - lastMonthRub) / lastMonthRub) * 100 : null

  // Daily data (last 14 days)
  const dailyData = useMemo(() => {
    const days = []
    for (let i = 13; i >= 0; i--) {
      const d = new Date()
      d.setDate(d.getDate() - i)
      const key = d.toISOString().slice(0, 10)
      const rub = profits.filter(p => p.createdAt.startsWith(key)).reduce((s, p) => s + p.myShare, 0)
      days.push({ label: d.toLocaleDateString('ru-RU', { day: 'numeric', month: 'short' }), usd: rubToUsd(rub, r2u) })
    }
    const max = Math.max(...days.map(d => d.usd), 1)
    return days.map(d => ({ ...d, pct: (d.usd / max) * 100 }))
  }, [profits, r2u])

  // Profit by type
  const byType = useMemo(() => {
    const map = new Map<ProfitType, number>()
    profits.forEach(p => map.set(p.type, (map.get(p.type) ?? 0) + p.myShare))
    const entries = Array.from(map.entries()).sort((a, b) => b[1] - a[1])
    const max = Math.max(...entries.map(e => e[1]), 1)
    return entries.map(([type, rub]) => ({
      type, label: PROFIT_LABELS[type],
      usd: rubToUsd(rub, r2u),
      pct: totalRub > 0 ? (rub / totalRub) * 100 : 0,
      barPct: (rub / max) * 100,
    }))
  }, [profits, r2u, totalRub])

  // Best day
  const bestDay = useMemo(() => {
    const map = new Map<string, number>()
    profits.forEach(p => {
      const key = p.createdAt.slice(0, 10)
      map.set(key, (map.get(key) ?? 0) + p.myShare)
    })
    const entries = Array.from(map.entries()).sort((a, b) => b[1] - a[1])
    return entries[0] ? {
      date: new Date(entries[0][0]).toLocaleDateString('ru-RU', { day: 'numeric', month: 'short' }),
      usd: rubToUsd(entries[0][1], r2u),
    } : null
  }, [profits, r2u])

  // Top workers
  const topWorkers = useMemo(() =>
    [...workers].sort((a, b) => b.totalProfit - a.totalProfit).filter(w => w.totalProfit > 0),
    [workers])

  const medals = ['🥇', '🥈', '🥉']

  return (
    <div className="px-4 pt-6 pb-28 md:pb-8 md:px-8 max-w-2xl">
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-text">Stats</h1>
        <p className="text-text-muted text-sm mt-1">Overview</p>
      </div>

      {/* Key stats */}
      <div className="grid grid-cols-3 gap-3 mb-5">
        {[
          { label: 'Earned', value: fmtUsd(totalUsd), sub: fmtUah(totalUah) },
          { label: 'Deals', value: String(profits.length), sub: `~${fmtUsd(avgUsd)}/ea` },
          { label: 'Workers', value: String(workers.length), sub: `${anketas.length} profiles` },
        ].map(({ label, value, sub }) => (
          <div key={label} className="glass-light rounded-2xl p-3 text-center">
            <p className="text-text font-bold text-sm">{value}</p>
            <p className="text-text-muted text-[10px] mt-0.5">{sub}</p>
            <p className="text-text-muted text-[10px] mt-0.5">{label}</p>
          </div>
        ))}
      </div>

      {/* Level progress card */}
      <div className="glass-light rounded-2xl p-4 mb-5">
        <div className="flex items-center justify-between mb-3">
          <div className="flex items-center gap-2">
            <Star size={15} className="text-yellow-400" />
            <span className="text-sm font-semibold text-text">Level {levelInfo.level}</span>
          </div>
          <span className="text-xs text-text-muted">{levelInfo.currentXp.toLocaleString()} / {levelInfo.neededXp.toLocaleString()} ₴</span>
        </div>
        <div className="h-2 bg-black/30 rounded-full overflow-hidden mb-2">
          <div className="h-full rounded-full transition-all duration-700" style={{ width: `${levelInfo.progress * 100}%`, background: 'linear-gradient(90deg,#7c3aed,#ec4899)' }} />
        </div>
        <p className="text-text-muted text-xs">{Math.round(levelInfo.neededXp - levelInfo.currentXp).toLocaleString()} ₴ to level {levelInfo.level + 1}</p>
      </div>

      {/* This month vs last month */}
      {(thisMonthRub > 0 || lastMonthRub > 0) && (
        <div className="glass-light rounded-2xl p-4 mb-5 flex items-center justify-between">
          <div>
            <p className="text-text-muted text-xs mb-1">This month</p>
            <p className="text-xl font-bold text-white">{fmtUsd(rubToUsd(thisMonthRub, r2u))}</p>
            <p className="text-text-muted text-xs">{fmtUah(usdToUah(rubToUsd(thisMonthRub, r2u), u2ua))}</p>
          </div>
          {monthChange !== null && (
            <div className={`flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-sm font-bold ${monthChange > 0 ? 'bg-emerald-500/20 text-emerald-400' : monthChange < 0 ? 'bg-red-500/20 text-red-400' : 'bg-white/5 text-text-muted'}`}>
              {monthChange > 0 ? <TrendingUp size={14} /> : monthChange < 0 ? <TrendingDown size={14} /> : <Minus size={14} />}
              {monthChange > 0 ? '+' : ''}{monthChange.toFixed(0)}%
            </div>
          )}
          <div className="text-right">
            <p className="text-text-muted text-xs mb-1">Last month</p>
            <p className="text-lg font-bold text-white/60">{fmtUsd(rubToUsd(lastMonthRub, r2u))}</p>
            <p className="text-text-muted text-xs">{fmtUah(usdToUah(rubToUsd(lastMonthRub, r2u), u2ua))}</p>
          </div>
        </div>
      )}

      {/* Monthly chart */}
      {monthlyData.length > 0 && (
        <div className="glass-light rounded-2xl p-4 mb-5">
          <h3 className="text-sm font-semibold text-text mb-4">Monthly earnings</h3>
          <div className="flex items-end gap-2" style={{ height: '120px' }}>
            {monthlyData.map(d => (
              <div key={d.label} className="flex-1 flex flex-col items-center gap-1 h-full justify-end">
                <span className="text-[9px] font-semibold" style={{ color: '#22d3a5' }}>{fmtUsd(d.usd)}</span>
                <div
                  className="w-full rounded-t-lg transition-all"
                  style={{
                    height: `${Math.max(d.pct, 4)}%`,
                    background: `linear-gradient(180deg, rgba(124,92,252,${0.4 + d.pct / 100 * 0.6}) 0%, rgba(236,72,153,${0.2 + d.pct / 100 * 0.4}) 100%)`,
                  }}
                />
                <span className="text-[10px] text-text-muted">{d.label}</span>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Daily chart (last 14 days) */}
      {dailyData.some(d => d.usd > 0) && (
        <div className="glass-light rounded-2xl p-4 mb-5">
          <div className="flex items-center gap-2 mb-4">
            <Zap size={14} className="text-accent-light" />
            <h3 className="text-sm font-semibold text-text">Last 14 days</h3>
          </div>
          <div className="flex items-end gap-1" style={{ height: '72px' }}>
            {dailyData.map((d, i) => (
              <div key={i} className="flex-1 h-full flex flex-col justify-end">
                <div
                  className="w-full rounded-t transition-all"
                  title={d.usd > 0 ? fmtUsd(d.usd) : ''}
                  style={{
                    height: `${Math.max(d.pct, d.usd > 0 ? 6 : 2)}%`,
                    backgroundColor: d.usd > 0 ? `rgba(124,92,252,${0.4 + d.pct / 100 * 0.6})` : 'rgba(255,255,255,0.05)',
                  }}
                />
              </div>
            ))}
          </div>
          <div className="flex mt-2">
            <span className="text-[9px] text-text-muted">{dailyData[0].label}</span>
            <span className="flex-1" />
            <span className="text-[9px] text-text-muted">{dailyData[13].label}</span>
          </div>
        </div>
      )}

      {/* Profit by type */}
      {byType.length > 0 && (
        <div className="glass-light rounded-2xl p-4 mb-5">
          <h3 className="text-sm font-semibold text-text mb-4">Breakdown by type</h3>
          <div className="flex flex-col gap-3">
            {byType.map(({ type, label, usd, pct, barPct }) => (
              <div key={type}>
                <div className="flex justify-between items-baseline mb-1.5">
                  <span className="text-xs text-text">{label}</span>
                  <div className="flex items-baseline gap-2">
                    <span className="text-[10px] text-text-muted">{pct.toFixed(0)}%</span>
                    <span className="text-xs font-bold" style={{ color: '#22d3a5' }}>{fmtUsd(usd)}</span>
                  </div>
                </div>
                <div className="h-1.5 bg-black/30 rounded-full overflow-hidden">
                  <div
                    className="h-full rounded-full transition-all"
                    style={{ width: `${barPct}%`, background: 'linear-gradient(90deg,#7c3aed,#ec4899)' }}
                  />
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Records */}
      {(bestDay || profits.length > 0) && (
        <div className="glass-light rounded-2xl p-4 mb-5">
          <div className="flex items-center gap-2 mb-3">
            <Trophy size={14} className="text-yellow-400" />
            <h3 className="text-sm font-semibold text-text">Records</h3>
          </div>
          <div className="grid grid-cols-2 gap-3">
            {bestDay && (
              <div className="bg-black/20 rounded-xl p-3">
                <p className="text-text-muted text-[10px] uppercase tracking-wide mb-1">Best day</p>
                <p className="text-lg font-bold text-white">{fmtUsd(bestDay.usd)}</p>
                <p className="text-text-muted text-xs">{bestDay.date}</p>
              </div>
            )}
            <div className="bg-black/20 rounded-xl p-3">
              <p className="text-text-muted text-[10px] uppercase tracking-wide mb-1">Avg deal</p>
              <p className="text-lg font-bold text-white">{fmtUsd(avgUsd)}</p>
              <p className="text-text-muted text-xs">{profits.length} deals total</p>
            </div>
          </div>
        </div>
      )}

      {/* Workers ranking */}
      {topWorkers.length > 0 && (
        <div className="glass-light rounded-2xl p-4">
          <h3 className="text-sm font-semibold text-text mb-3">Worker ranking</h3>
          <div className="flex flex-col gap-3">
            {topWorkers.map((w, i) => {
              const usd = rubToUsd(w.totalProfit, r2u)
              const pct = (w.totalProfit / topWorkers[0].totalProfit) * 100
              return (
                <button key={w.id} onClick={() => navigate(`/workers/${w.id}`)} className="flex items-center gap-3 text-left w-full">
                  <span className="text-lg w-7 text-center">{i < 3 ? medals[i] : <span className="text-text-muted text-sm font-bold">{i + 1}</span>}</span>
                  <span className="text-xl">{w.emoji}</span>
                  <div className="flex-1">
                    <div className="flex justify-between items-baseline mb-1">
                      <span className="text-sm text-text font-medium">{w.name}</span>
                      <span className="text-sm font-bold" style={{ color: '#22d3a5' }}>{fmtUsd(usd)}</span>
                    </div>
                    <div className="h-1.5 bg-black/30 rounded-full overflow-hidden">
                      <div
                        className="h-full rounded-full transition-all"
                        style={{ width: `${pct}%`, background: i === 0 ? 'linear-gradient(90deg,#7c3aed,#ec4899)' : 'rgba(124,92,252,0.45)' }}
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
