import { useMemo, useState } from 'react'
import { Calendar, TrendingUp, TrendingDown, Minus, Zap } from 'lucide-react'
import { useStore } from '@/store'
import { PROFIT_LABELS, ProfitType, rubToUsd, usdToUah, fmtUsd, fmtUah } from '@/types'
import { useNavigate } from 'react-router-dom'
import {
  BarChart, Bar, BarXAxis, Grid, ChartTooltip,
  RingChart, Ring, RingCenter,
  Legend, LegendItem, LegendMarker, LegendLabel, LegendProgress, useLegendItem,
} from '@/components/charts'

function startOf(unit: 'day' | 'week' | 'month') {
  const d = new Date()
  if (unit === 'day') { d.setHours(0,0,0,0); return d }
  if (unit === 'week') { const day = d.getDay(); d.setDate(d.getDate() - (day === 0 ? 6 : day - 1)); d.setHours(0,0,0,0); return d }
  d.setDate(1); d.setHours(0,0,0,0); return d
}

// Vertical blue gradient for the daily bar chart (hoisted into the chart <defs>)
function DayBarGradient() {
  return (
    <linearGradient id="financeDayGradient" x1="0%" x2="0%" y1="0%" y2="100%">
      <stop offset="0%" stopColor="#3B9BFF" />
      <stop offset="100%" stopColor="#0A84FF" />
    </linearGradient>
  )
}
DayBarGradient.displayName = 'DayBarGradient'

// One color per profit type for the breakdown legend
const TYPE_COLORS: Record<ProfitType, string> = {
  oplata: '#3B9BFF',
  perevod: '#22d3a5',
  iks: '#f472b6',
  vozvrat: '#f59e0b',
  vozvrat_yurist: '#a78bfa',
}
const medals = ['🥇', '🥈', '🥉']

// Legend row for the Today ring
function RingLegendRow() {
  const { item, percentage } = useLegendItem()
  return (
    <div className="flex items-center justify-between">
      <div className="flex items-center gap-2">
        <LegendMarker />
        <LegendLabel className="text-xs text-text" />
      </div>
      <div className="flex items-baseline gap-2">
        <span className="text-xs font-bold text-white">{fmtUsd(item.value)}</span>
        <span className="text-[10px] font-semibold text-text-muted">{percentage.toFixed(0)}%</span>
      </div>
    </div>
  )
}

// Legend row for "Breakdown by type"
function BreakdownLegendRow() {
  const { item, percentage } = useLegendItem()
  return (
    <div>
      <div className="flex items-center justify-between mb-1.5">
        <div className="flex items-center gap-2">
          <LegendMarker />
          <LegendLabel className="text-xs text-text" />
        </div>
        <div className="flex items-baseline gap-2">
          <span className="text-[10px] font-semibold text-text-muted">{percentage.toFixed(0)}%</span>
          <span className="text-xs font-bold text-accent-light">{fmtUsd(item.value)}</span>
        </div>
      </div>
      <LegendProgress height="h-1.5" />
    </div>
  )
}

// Legend row for worker ranking
function WorkerRankLegendRow() {
  const { item } = useLegendItem()
  const navigate = useNavigate()
  return (
    <button onClick={() => item.id && navigate(`/workers/${item.id}`)} className="flex items-center gap-3 text-left w-full">
      <span className="text-lg w-7 text-center shrink-0">
        {item.isMedal ? item.rank : <span className="text-sm font-bold text-text-muted">{item.rank}</span>}
      </span>
      <span className="text-xl shrink-0">{item.emoji}</span>
      <div className="flex-1">
        <div className="flex justify-between items-baseline">
          <span className="text-sm text-text font-medium">{item.label}</span>
          <div className="text-right">
            <span className="text-sm font-bold text-accent-light">{fmtUsd(item.value)}</span>
            {item.subtext && <span className="text-text-muted text-[10px] ml-1.5">({item.subtext})</span>}
          </div>
        </div>
        <LegendProgress height="h-1" trackClassName="mt-1" />
      </div>
    </button>
  )
}

export default function Finance() {
  const { profits, workers, profile } = useStore()
  const { rubToUsd: r2u, usdToUah: u2ua } = profile.settings
  const [hoverIndex, setHoverIndex] = useState<number | null>(null)

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

  // Daily goal — today earned vs a manageable target
  const dailyTargetUsd = Math.max(5, stats.total > 0 ? stats.total / 30 : 10)
  const dayPct = Math.min(100, (stats.today / dailyTargetUsd) * 100)
  const reachUsd = Math.max(0, dailyTargetUsd - stats.today)
  const ringData = useMemo(() => [
    { label: 'Today', value: stats.today, color: '#0A84FF' },
    { label: 'До цели', value: reachUsd, color: 'rgba(255,255,255,0.10)' },
  ], [stats.today, reachUsd])

  // This month vs last
  const now = new Date()
  const thisKey = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}`
  const prev = new Date(now.getFullYear(), now.getMonth() - 1, 1)
  const lastKey = `${prev.getFullYear()}-${String(prev.getMonth() + 1).padStart(2, '0')}`
  const thisRub = profits.filter(p => p.createdAt.startsWith(thisKey)).reduce((s, p) => s + p.myShare, 0)
  const lastRub = profits.filter(p => p.createdAt.startsWith(lastKey)).reduce((s, p) => s + p.myShare, 0)
  const thisMonthUsd = rubToUsd(thisRub, r2u)
  const monthChange = lastRub > 0 ? ((thisRub - lastRub) / lastRub) * 100 : null

  // Daily earnings — last 14 days
  const dayData = useMemo(() => {
    const rows = []
    for (let i = 13; i >= 0; i--) {
      const d = new Date(); d.setDate(d.getDate() - i)
      const key = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`
      const rub = profits.filter(p => p.createdAt.slice(0, 10) === key).reduce((s, p) => s + p.myShare, 0)
      rows.push({ name: d.toLocaleDateString('uk-UA', { day: 'numeric', month: 'short' }), usd: rubToUsd(rub, r2u) })
    }
    return rows
  }, [profits, r2u])

  // Breakdown by type
  const byType = useMemo(() => {
    const map = new Map<ProfitType, number>()
    profits.forEach(p => map.set(p.type, (map.get(p.type) ?? 0) + p.myShare))
    return Array.from(map.entries())
      .sort((a, b) => b[1] - a[1])
      .map(([type, rub]) => ({ type, label: PROFIT_LABELS[type], usd: rubToUsd(rub, r2u) }))
  }, [profits, r2u])

  // Worker ranking by total profit
  const topWorkers = useMemo(() =>
    [...workers].sort((a, b) => b.totalProfit - a.totalProfit).filter(w => w.totalProfit > 0),
    [workers])

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

  const entryDelays = useMemo(() => {
    const delays = new Map<string, number>()
    let idx = 0
    grouped.forEach(([, entries]) => {
      entries.forEach(entry => { delays.set(entry.id, idx++ * 45) })
    })
    return delays
  }, [grouped])

  return (
    <div className="px-4 pt-6 pb-28 md:pb-8 md:px-8 max-w-2xl">
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-text">Финансы</h1>
        <p className="text-text-muted text-sm mt-1">Все воркеры</p>
      </div>

      {/* Today ring + weekly pace */}
      <div className="glass-light rounded-2xl p-4 mb-5">
        <div className="flex items-center gap-4">
          <div className="shrink-0">
            <RingChart data={ringData} hoveredIndex={hoverIndex} onHoverChange={setHoverIndex} size={170} thickness={16}>
              <Ring index={0} />
              <Ring index={1} />
              <RingCenter value={fmtUsd(stats.today)} sub={Math.round(dayPct) + '%'} />
            </RingChart>
          </div>
          <Legend
            hoveredIndex={hoverIndex}
            onHoverChange={setHoverIndex}
            items={ringData.map(d => ({ label: d.label, value: d.value, maxValue: dailyTargetUsd, color: d.color }))}
            className="flex-1 gap-1"
          >
            <LegendItem>
              <RingLegendRow />
            </LegendItem>
          </Legend>
        </div>
        <div className="mt-3 pt-3 border-t border-white/5 flex items-center justify-between gap-2 text-xs text-text-muted flex-wrap">
          <span className="flex items-center gap-1">
            <Zap size={11} className="text-accent-light" />
            цель {fmtUsd(dailyTargetUsd)}/день
          </span>
          <span>Неделя: <b className="text-white">{fmtUsd(stats.week)}</b> · {fmtUah(usdToUah(stats.week, u2ua))}</span>
        </div>
      </div>

      {/* This month vs last */}
      <div className="glass-light rounded-2xl p-4 mb-5 flex items-center justify-between">
        <div>
          <p className="text-text-muted text-xs mb-1">This month</p>
          <p className="text-xl font-bold text-white">{fmtUsd(thisMonthUsd)}</p>
          <p className="text-text-muted text-xs">{fmtUah(usdToUah(thisMonthUsd, u2ua))}</p>
        </div>
        {monthChange !== null ? (
          <div className={`flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-sm font-bold ${monthChange > 0 ? 'bg-accent/15 text-accent' : monthChange < 0 ? 'bg-danger/20 text-danger' : 'bg-white/5 text-text-muted'}`}>
            {monthChange > 0 ? <TrendingUp size={14} /> : monthChange < 0 ? <TrendingDown size={14} /> : <Minus size={14} />}
            {monthChange > 0 ? '+' : ''}{monthChange.toFixed(0)}%
          </div>
        ) : <div className="w-2" />}
      </div>

      {/* Daily bar chart */}
      <div className="glass-light rounded-2xl p-4 mb-5">
        <h3 className="text-sm font-semibold text-text mb-4">Профит по дням</h3>
        <BarChart data={dayData} xDataKey="name" barGap={0.3} margin={{ top: 10, right: 10, bottom: 24, left: 10 }}>
          <DayBarGradient />
          <Grid horizontal />
          <Bar dataKey="usd" fill="url(#financeDayGradient)" lineCap="round" />
          <BarXAxis />
          <ChartTooltip />
        </BarChart>
      </div>

      {/* Key stats */}
      <div className="grid grid-cols-3 gap-3 mb-5 stagger">
        {[
          { label: 'Week', usd: stats.week },
          { label: 'Month', usd: stats.month },
          { label: 'All time', usd: stats.total },
        ].map(({ label, usd }) => (
          <div key={label} className="glass-light rounded-2xl p-3 text-center neon-hover">
            <p className="text-white font-bold text-sm tabular-nums">{fmtUsd(usd)}</p>
            <p className="text-text-muted text-[10px] mt-0.5">{fmtUah(usdToUah(usd, u2ua))}</p>
            <p className="text-text-muted text-[10px] mt-0.5">{label}</p>
          </div>
        ))}
      </div>

      {/* Breakdown by type */}
      {byType.length > 0 && (
        <div className="glass-light rounded-2xl p-4 mb-5">
          <Legend
            title="Breakdown by type"
            titleClassName="text-sm font-semibold text-text mb-3"
            className="gap-1"
            items={byType.map(t => ({ label: t.label, value: t.usd, maxValue: stats.total, color: TYPE_COLORS[t.type] }))}
          >
            <LegendItem>
              <BreakdownLegendRow />
            </LegendItem>
          </Legend>
        </div>
      )}

      {/* Worker ranking */}
      {topWorkers.length > 0 && (
        <div className="glass-light rounded-2xl p-4 mb-5">
          <Legend
            title="Worker ranking"
            titleClassName="text-sm font-semibold text-text mb-3"
            className="gap-1"
            items={topWorkers.map((w, i) => ({
              label: w.name,
              value: rubToUsd(w.totalProfit, r2u),
              maxValue: rubToUsd(topWorkers[0].totalProfit, r2u),
              color: i === 0 ? '#3B9BFF' : 'rgba(10,132,255,0.45)',
              rank: i < 3 ? medals[i] : String(i + 1),
              isMedal: i < 3,
              emoji: w.emoji,
              id: w.id,
              subtext: fmtUah(usdToUah(rubToUsd(w.totalProfit, r2u), u2ua)),
            }))}
          >
            <LegendItem className="hover:translate-x-1">
              <WorkerRankLegendRow />
            </LegendItem>
          </Legend>
        </div>
      )}

      {/* History */}
      {grouped.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-16 gap-3 text-text-muted">
          <p className="text-sm">Нет записей. Зайди в воркера и добавь профит.</p>
        </div>
      ) : (
        <div className="flex flex-col gap-4">
          {grouped.map(([date, entries]) => {
            const dayUsd = rubToUsd(entries.reduce((s, e) => s + e.myShare, 0), r2u)
            return (
              <div key={date}>
                <div className="flex items-center gap-2 mb-2 px-1">
                  <Calendar size={12} className="text-text-muted" />
                  <span className="text-xs text-text-muted font-medium">{date}</span>
                  <div className="flex-1 h-px bg-border" />
                  <span className="text-xs font-bold text-accent-light tabular-nums">+{fmtUsd(dayUsd)}</span>
                </div>
                <div className="flex flex-col gap-2">
                  {entries.map(entry => {
                    const w = workerMap.get(entry.workerId)
                    const usd = rubToUsd(entry.myShare, r2u)
                    const uah = usdToUah(usd, u2ua)
                    return (
                      <div key={entry.id} className="glass-light rounded-2xl px-4 py-3 neon-hover slide-in-left" style={{ borderLeft: '2px solid rgba(10,132,255,0.30)', animationDelay: `${entryDelays.get(entry.id) ?? 0}ms` }}>
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
                            <p className="text-white font-bold text-sm tabular-nums">+{fmtUsd(usd)}</p>
                            <p className="text-text-muted text-[10px] mt-0.5">{fmtUah(uah)}</p>
                          </div>
                        </div>
                      </div>
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