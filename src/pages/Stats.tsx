import { useMemo, useState } from 'react'
import { TrendingUp, TrendingDown, Minus, Trophy, Zap, Star, Flame, Timer } from 'lucide-react'
import { useStore } from '@/store'
import { rubToUsd, usdToUah, fmtUsd, fmtUah, PROFIT_LABELS, ProfitType, getLevelInfo, ProfitEntry } from '@/types'
import { useNavigate } from 'react-router-dom'
import { AnimatedBarChart, AnimatedRing } from '@/components/AnimatedCharts'
import { AreaChart, Area, Grid, XAxis, ChartTooltip } from '@/components/charts'

// ── Heatmap Calendar ────────────────────────────────────────────────────────
function HeatmapCalendar({ profits, r2u }: { profits: ProfitEntry[]; r2u: number }) {
  const dayMap = useMemo(() => {
    const m = new Map<string, number>()
    profits.forEach(p => {
      const k = p.createdAt.slice(0, 10)
      m.set(k, (m.get(k) ?? 0) + p.myShare)
    })
    return m
  }, [profits])

  const weeks = useMemo(() => {
    const todayD = new Date(); todayD.setHours(0, 0, 0, 0)
    const dow = todayD.getDay()
    const start = new Date(todayD)
    start.setDate(start.getDate() - (dow === 0 ? 6 : dow - 1) - 14 * 7)
    const ws: Array<Array<{ date: Date; key: string; rub: number }>> = []
    const cur = new Date(start)
    for (let w = 0; w < 15; w++) {
      const week: typeof ws[0] = []
      for (let d = 0; d < 7; d++) {
        const key = cur.toISOString().slice(0, 10)
        week.push({ date: new Date(cur), key, rub: dayMap.get(key) ?? 0 })
        cur.setDate(cur.getDate() + 1)
      }
      ws.push(week)
    }
    return ws
  }, [dayMap])

  const maxRub = Math.max(...Array.from(dayMap.values()), 1)
  const today = new Date(); today.setHours(23, 59, 59, 999)

  const getColor = (rub: number, date: Date) => {
    if (date > today) return 'rgba(255,255,255,0.02)'
    if (rub === 0) return 'rgba(10,132,255,0.07)'
    const t = rub / maxRub
    return `rgba(10,132,255,${(0.22 + t * 0.78).toFixed(2)})`
  }

  const DAYS = ['Пн', 'Вт', 'Ср', 'Чт', 'Пт', 'Сб', 'Нд']

  // Hover tooltip state — follows the cursor
  const [tip, setTip] = useState<{ x: number; y: number; date: string; rub: number; usd: number } | null>(null)

  return (
    <div className="overflow-x-auto pb-1">
      <div className="flex gap-1" style={{ minWidth: 'max-content' }}>
        {/* Day labels */}
        <div className="flex flex-col gap-1 pr-1.5 pt-5">
          {DAYS.map(d => (
            <div key={d} className="h-3.5 flex items-center text-[9px] text-text-muted leading-none">{d}</div>
          ))}
        </div>
        {/* Columns */}
        <div className="flex flex-col">
          {/* Month labels */}
          <div className="flex gap-1 mb-1 h-4">
            {weeks.map((week, wi) => (
              <div key={wi} className="w-3.5 text-[9px] text-text-muted text-center leading-none flex items-center justify-center">
                {week[0].date.getDate() <= 7 ? week[0].date.toLocaleDateString('uk-UA', { month: 'short' }).slice(0, 3) : ''}
              </div>
            ))}
          </div>
          {/* Grid */}
          <div className="flex gap-1 relative">
            {weeks.map((week, wi) => (
              <div key={wi} className="flex flex-col gap-1">
                {week.map(({ date, key, rub }) => {
                  const usd = rubToUsd(rub, r2u)
                  return (
                    <div
                      key={key}
                      className="w-3.5 h-3.5 rounded-[4px] cursor-pointer transition-all duration-100 hover:scale-150 hover:z-10 relative"
                      style={{
                        backgroundColor: getColor(rub, date),
                        boxShadow: tip && tip.date === key ? '0 0 0 1.5px #fff, 0 0 10px rgba(10,132,255,0.6)' : 'none',
                      }}
                      onMouseEnter={e => {
                        const rect = e.currentTarget.getBoundingClientRect()
                        setTip({ x: rect.left + rect.width / 2, y: rect.top, date: key, rub, usd })
                      }}
                      onMouseLeave={() => setTip(t => (t && t.date === key ? null : t))}
                    />
                  )
                })}
              </div>
            ))}

            {/* Floating tooltip */}
            {tip && (
              <div
                className="pointer-events-none fixed z-50 rounded-xl px-2.5 py-1.5 text-xs font-bold text-white whitespace-nowrap"
                style={{
                  left: tip.x,
                  top: tip.y - 4,
                  transform: 'translate(-50%, -100%)',
                  background: 'rgba(4,12,6,0.97)',
                  border: '1px solid rgba(10,132,255,0.4)',
                  boxShadow: '0 4px 20px rgba(0,0,0,0.6), 0 0 12px rgba(10,132,255,0.15)',
                }}
              >
                {tip.date}
                {tip.rub > 0 ? (
                  <>
                    <div className="text-white/90 font-semibold">{fmtUsd(tip.usd)}</div>
                    <div className="text-white/40 font-normal text-[10px]">{fmtUah(usdToUah(tip.usd, r2u))}</div>
                  </>
                ) : (
                  <div className="text-white/40 font-normal text-[10px]">нет профита</div>
                )}
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  )
}

// ── Main Stats Page ──────────────────────────────────────────────────────────
export default function Stats() {
  const { profits, workers, anketas, profile, sessions, clearSessions, workerTime, workerBaseline } = useStore()
  const navigate = useNavigate()
  const { rubToUsd: r2u, usdToUah: u2ua } = profile.settings

  const totalRub = profits.reduce((s, p) => s + p.myShare, 0)
  const totalUsd = rubToUsd(totalRub, r2u)
  const totalUah = usdToUah(totalUsd, u2ua)
  const avgUsd = profits.length > 0 ? totalUsd / profits.length : 0
  const levelInfo = getLevelInfo(totalUah)

  // ── Per-worker time → money insights ─────────────────────────────────
  const workerEarn = (w: { id: string; totalProfit: number }) => {
    const t = workerTime[w.id] ?? 0
    const base = workerBaseline[w.id]
    const earned = base !== undefined ? Math.max(0, w.totalProfit - base) : 0
    const rate = t > 0 ? rubToUsd(earned, r2u) / (t / 3600000) : 0
    return { ms: t, earnedRub: earned, earnedUsd: rubToUsd(earned, r2u), rate }
  }
  const trackedWorkers = workers
    .map(w => ({ w, ...workerEarn(w) }))
    .filter(x => x.ms > 0 || x.earnedRub > 0)
    .sort((a, b) => b.earnedUsd - a.earnedUsd)

  const sessionTotalMs = Object.values(workerTime).reduce((s, x) => s + x, 0)
  const sessionProfitUsd = trackedWorkers.reduce((s, x) => s + x.earnedUsd, 0)
  const sessionRate = sessionTotalMs > 0 ? sessionProfitUsd / (sessionTotalMs / 3600000) : 0
  const fmtClock = (ms: number) => {
    const h = Math.floor(ms / 3600000); const m = Math.floor((ms % 3600000) / 60000)
    return h > 0 ? `${h}ч ${m}мин` : `${m}мин`
  }

  // Daily goal ring — today earned vs a manageable daily target
  const nowDay = new Date().toISOString().slice(0, 10)
  const todayRub = profits.filter(p => p.createdAt.startsWith(nowDay)).reduce((s, p) => s + p.myShare, 0)
  const todayUsd = rubToUsd(todayRub, r2u)
  const dailyTarget = Math.max(5, totalRub > 0 ? totalRub / 30 : 10)
  const dailyTargetUsd = rubToUsd(dailyTarget, r2u)
  const dayPct = Math.min(100, (todayUsd / dailyTargetUsd) * 100)

  // Always last 6 months (uk-UA locale)
  const monthlyData = useMemo(() => {
    const rows = []
    for (let i = 5; i >= 0; i--) {
      const d = new Date()
      d.setDate(1)
      d.setMonth(d.getMonth() - i)
      const key = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}`
      const rub = profits.filter(p => p.createdAt.startsWith(key)).reduce((s, p) => s + p.myShare, 0)
      rows.push({ label: d.toLocaleDateString('uk-UA', { month: 'short' }), usd: rubToUsd(rub, r2u) })
    }
    const max = Math.max(...rows.map(r => r.usd), 0.01)
    return rows.map(r => ({ ...r, pct: (r.usd / max) * 100 }))
  }, [profits, r2u])

  // This month vs last
  const now = new Date()
  const thisKey = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}`
  const prev = new Date(now.getFullYear(), now.getMonth() - 1, 1)
  const lastKey = `${prev.getFullYear()}-${String(prev.getMonth() + 1).padStart(2, '0')}`
  const thisRub = profits.filter(p => p.createdAt.startsWith(thisKey)).reduce((s, p) => s + p.myShare, 0)
  const lastRub = profits.filter(p => p.createdAt.startsWith(lastKey)).reduce((s, p) => s + p.myShare, 0)
  const monthChange = lastRub > 0 ? ((thisRub - lastRub) / lastRub) * 100 : null

  // Daily line chart with range switcher (7 / 30 / 90 days, uk-UA)
  const [dailyRange, setDailyRange] = useState<'7d' | '30d' | '90d'>('30d')
  const dailyDays = { '7d': 7, '30d': 30, '90d': 90 }[dailyRange]
  const dailyData = useMemo(() => {
    const days = []
    for (let i = dailyDays - 1; i >= 0; i--) {
      const d = new Date()
      d.setHours(0, 0, 0, 0)
      d.setDate(d.getDate() - i)
      const key = d.toISOString().slice(0, 10)
      const rub = profits.filter(p => p.createdAt.startsWith(key)).reduce((s, p) => s + p.myShare, 0)
      days.push({
        date: d,
        label: d.toLocaleDateString('uk-UA', { day: 'numeric', month: 'short' }),
        usd: rubToUsd(rub, r2u),
      })
    }
    return days
  }, [profits, r2u, dailyDays])

  // Profit by type
  const byType = useMemo(() => {
    const map = new Map<ProfitType, number>()
    profits.forEach(p => map.set(p.type, (map.get(p.type) ?? 0) + p.myShare))
    const entries = Array.from(map.entries()).sort((a, b) => b[1] - a[1])
    const maxRub = Math.max(...entries.map(e => e[1]), 1)
    return entries.map(([type, rub]) => ({
      type, label: PROFIT_LABELS[type],
      usd: rubToUsd(rub, r2u),
      pct: totalRub > 0 ? (rub / totalRub) * 100 : 0,
      barPct: (rub / maxRub) * 100,
    }))
  }, [profits, r2u, totalRub])

  // Streak
  const streak = useMemo(() => {
    const daySet = new Set(profits.map(p => p.createdAt.slice(0, 10)))
    const d = new Date(); d.setHours(0, 0, 0, 0)
    if (!daySet.has(d.toISOString().slice(0, 10))) d.setDate(d.getDate() - 1)
    let count = 0
    while (daySet.has(d.toISOString().slice(0, 10))) { count++; d.setDate(d.getDate() - 1) }
    return count
  }, [profits])

  // Best day
  const bestDay = useMemo(() => {
    const map = new Map<string, number>()
    profits.forEach(p => {
      const k = p.createdAt.slice(0, 10)
      map.set(k, (map.get(k) ?? 0) + p.myShare)
    })
    const entries = Array.from(map.entries()).sort((a, b) => b[1] - a[1])
    return entries[0]
      ? { date: new Date(entries[0][0]).toLocaleDateString('uk-UA', { day: 'numeric', month: 'short' }), usd: rubToUsd(entries[0][1], r2u) }
      : null
  }, [profits, r2u])

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
      <div className="grid grid-cols-3 gap-3 mb-5 stagger">
        {[
          { label: 'Earned', value: fmtUsd(totalUsd), sub: fmtUah(totalUah) },
          { label: 'Deals', value: String(profits.length), sub: `~${fmtUsd(avgUsd)}/ea` },
          { label: 'Workers', value: String(workers.length), sub: `${anketas.length} profiles` },
        ].map(({ label, value, sub }) => (
          <div key={label} className="glass-light rounded-2xl p-3 text-center neon-hover" style={{ transition: 'transform 0.2s ease, box-shadow 0.2s ease, border-color 0.2s ease, background 0.2s ease' }}>
            <p className="text-text font-bold text-sm">{value}</p>
            <p className="text-text-muted text-[10px] mt-0.5">{sub}</p>
            <p className="text-text-muted text-[10px] mt-0.5">{label}</p>
          </div>
        ))}
      </div>

      {/* Level */}
      <div className="glass-light rounded-2xl p-4 mb-5">
        <div className="flex items-center justify-between mb-3">
          <div className="flex items-center gap-2">
            <Star size={15} className="text-yellow-400" />
            <span className="text-sm font-semibold text-text">Level {levelInfo.level}</span>
          </div>
          <span className="text-xs text-text-muted">{levelInfo.currentXp.toLocaleString()} / {levelInfo.neededXp.toLocaleString()} ₴</span>
        </div>
        <div className="h-2 bg-black/30 rounded-full overflow-hidden mb-2">
          <div className="h-full rounded-full transition-all duration-700" style={{ width: `${levelInfo.progress * 100}%`, background: 'linear-gradient(90deg,#0A84FF,#007AFF)' }} />
        </div>
        <p className="text-text-muted text-xs">{Math.round(levelInfo.neededXp - levelInfo.currentXp).toLocaleString()} ₴ to level {levelInfo.level + 1}</p>
      </div>

      {/* Today ring + live pace */}
      <div className="glass-light rounded-2xl p-4 mb-5 flex items-center justify-between gap-4">
        <div className="flex items-center gap-4">
          <AnimatedRing pct={dayPct} label="Дневная цель" value={todayUsd} sub={Math.round(dayPct) + '%'} />
          <div>
            <p className="text-text-muted text-[10px] uppercase tracking-widest mb-1">Today</p>
            <p className="text-xl font-bold text-white">{fmtUsd(todayUsd)}</p>
            <p className="text-text-muted text-xs mt-0.5">{fmtUah(usdToUah(todayUsd, u2ua))}</p>
            <div className="flex items-center gap-1 mt-2">
              <Zap size={11} className="text-accent-light" />
              <span className="text-xs text-text-muted">
                цель {fmtUsd(dailyTargetUsd)}/день
              </span>
            </div>
          </div>
        </div>
        <div className="text-right">
          <p className="text-text-muted text-[10px] uppercase tracking-widest mb-1">Сессии</p>
          <p className="text-lg font-bold text-white">{fmtClock(sessionTotalMs)}</p>
          <p className="text-text-muted text-xs mt-0.5">{sessions.length} за всё время</p>
          {sessionRate > 0 && (
            <p className="text-xs font-bold mt-1" style={{ color: '#0A84FF' }}>
              {fmtUsd(sessionRate)}/час
            </p>
          )}
        </div>
      </div>

      {/* This month vs last */}
      <div className="glass-light rounded-2xl p-4 mb-5 flex items-center justify-between">
        <div>
          <p className="text-text-muted text-xs mb-1">This month</p>
          <p className="text-xl font-bold text-white">{fmtUsd(rubToUsd(thisRub, r2u))}</p>
          <p className="text-text-muted text-xs">{fmtUah(usdToUah(rubToUsd(thisRub, r2u), u2ua))}</p>
        </div>
        {monthChange !== null ? (
          <div className={`flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-sm font-bold ${monthChange > 0 ? 'bg-accent/15 text-accent' : monthChange < 0 ? 'bg-danger/20 text-danger' : 'bg-white/5 text-text-muted'}`}>
            {monthChange > 0 ? <TrendingUp size={14} /> : monthChange < 0 ? <TrendingDown size={14} /> : <Minus size={14} />}
            {monthChange > 0 ? '+' : ''}{monthChange.toFixed(0)}%
          </div>
        ) : <div className="w-2" />}
        <div className="text-right">
          <p className="text-text-muted text-xs mb-1">Last month</p>
          <p className="text-lg font-bold text-white/60">{fmtUsd(rubToUsd(lastRub, r2u))}</p>
          <p className="text-text-muted text-xs">{fmtUah(usdToUah(rubToUsd(lastRub, r2u), u2ua))}</p>
        </div>
      </div>

      {/* Monthly bar chart */}
      <div className="glass-light rounded-2xl p-4 mb-5">
        <h3 className="text-sm font-semibold text-text mb-4">Monthly earnings</h3>
        <AnimatedBarChart data={monthlyData} />
      </div>

      {/* Daily line chart */}
      <div className="glass-light rounded-2xl p-4 mb-5">
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-2">
            <Zap size={14} className="text-accent-light" />
            <h3 className="text-sm font-semibold text-text">Daily earnings</h3>
          </div>
          {/* Range switcher */}
          <div className="flex gap-1 p-1 rounded-xl" style={{ background: 'rgba(0,0,0,0.35)' }}>
            {(['7d', '30d', '90d'] as const).map(r => (
              <button
                key={r}
                onClick={() => setDailyRange(r)}
                className={`px-2.5 py-1 rounded-lg text-[11px] font-semibold transition-all ${dailyRange === r ? 'bg-accent text-white' : 'text-text-muted hover:text-text'}`}
              >
                {r === '7d' ? '7 д' : r === '30d' ? '30 д' : '90 д'}
              </button>
            ))}
          </div>
        </div>
        <AreaChart
          data={dailyData as unknown as Record<string, unknown>[]}
          key={dailyRange}
          margin={{ top: 18, right: 10, bottom: 8, left: 10 }}
          aspectRatio="7 / 2.8"
          animationDuration={900}
        >
          <Grid horizontal numTicksRows={4} />
          <Area dataKey="usd" fill="#0A84FF" fillOpacity={0.35} strokeWidth={2} />
          <XAxis numTicks={dailyDays <= 7 ? 7 : 5} tickerHalfWidth={40} />
          <ChartTooltip
            showDatePill={false}
            rows={point => {
              const usd = typeof point.usd === 'number' ? point.usd : 0
              return [
                { color: '#0A84FF', label: 'Заработок', value: fmtUsd(usd) },
                { color: 'rgba(255,255,255,0.25)', label: '₴', value: fmtUah(usdToUah(usd, u2ua)) },
              ]
            }}
          />
        </AreaChart>
        <div className="flex mt-2">
          <span className="text-[9px] text-text-muted">{dailyData[0]?.label}</span>
          <span className="flex-1" />
          <span className="text-[9px] text-text-muted">{dailyData[dailyData.length - 1]?.label}</span>
        </div>
      </div>

      {/* Streak + Heatmap */}
      <div className="glass-light rounded-2xl p-4 mb-5">
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-2">
            <Flame size={15} style={{ color: '#ffa000' }} />
            <h3 className="text-sm font-semibold text-text">Активність</h3>
          </div>
          {streak > 0 && (
            <div className="flex items-center gap-1.5 px-3 py-1 rounded-xl text-xs font-bold" style={{ background: 'rgba(255,160,0,0.12)', color: '#ffa000' }}>
              <Flame size={12} />
              {streak} {streak === 1 ? 'день' : streak < 5 ? 'дні' : 'днів'}
            </div>
          )}
        </div>
        <HeatmapCalendar profits={profits} r2u={r2u} />
        <div className="flex items-center gap-2 mt-3">
          <span className="text-[10px] text-text-muted">Менше</span>
          {[0.07, 0.25, 0.5, 0.75, 1].map(o => (
            <div key={o} className="w-3 h-3 rounded-sm" style={{ background: o === 0.07 ? 'rgba(10,132,255,0.07)' : `rgba(10,132,255,${o})` }} />
          ))}
          <span className="text-[10px] text-text-muted">Більше</span>
        </div>
      </div>

      {/* Breakdown by type */}
      {byType.length > 0 && (
        <div className="glass-light rounded-2xl p-4 mb-5">
          <h3 className="text-sm font-semibold text-text mb-4">Breakdown by type</h3>
          <div className="flex flex-col gap-3">
            {byType.map(({ type, label, usd, pct, barPct }) => (
              <div key={type} className="group cursor-default">
                <div className="flex justify-between items-baseline mb-1.5">
                  <span className="text-xs text-text">{label}</span>
                  <div className="flex items-baseline gap-2">
                    <span className="text-[10px] text-text-muted">{pct.toFixed(0)}%</span>
                    <span className="text-xs font-bold" style={{ color: '#0A84FF' }}>{fmtUsd(usd)}</span>
                  </div>
                </div>
                <div className="h-1.5 bg-black/30 rounded-full overflow-hidden">
                  <div className="h-full rounded-full transition-all duration-500 group-hover:opacity-70" style={{ width: `${barPct}%`, background: 'linear-gradient(90deg,#0A84FF,#007AFF)' }} />
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
              <div className="bg-black/20 rounded-xl p-3 hover:bg-black/30 transition-colors">
                <p className="text-text-muted text-[10px] uppercase tracking-wide mb-1">Best day</p>
                <p className="text-base font-bold text-white">{fmtUsd(bestDay.usd)}</p>
                <p className="text-text-muted text-[10px]">{fmtUah(usdToUah(bestDay.usd, u2ua))}</p>
                <p className="text-text-muted text-xs mt-0.5">{bestDay.date}</p>
              </div>
            )}
            <div className="bg-black/20 rounded-xl p-3 hover:bg-black/30 transition-colors">
              <p className="text-text-muted text-[10px] uppercase tracking-wide mb-1">Avg deal</p>
              <p className="text-base font-bold text-white">{fmtUsd(avgUsd)}</p>
              <p className="text-text-muted text-[10px]">{fmtUah(usdToUah(avgUsd, u2ua))}</p>
              <p className="text-text-muted text-xs mt-0.5">{profits.length} deals total</p>
            </div>
          </div>
        </div>
      )}

      {/* Time → money per worker */}
      {trackedWorkers.length > 0 && (
        <div className="glass-light rounded-2xl p-4 mb-5">
          <div className="flex items-center gap-2 mb-3">
            <Timer size={14} className="text-accent-light" />
            <h3 className="text-sm font-semibold text-text">Время → деньги</h3>
          </div>
          <div className="flex flex-col gap-3 stagger">
            {trackedWorkers.map(({ w, ms, earnedUsd, rate }) => {
              const pct = totalUsd > 0 ? (earnedUsd / sessionProfitUsd) * 100 : 0
              return (
                <button key={w.id} onClick={() => navigate(`/workers/${w.id}`)} className="flex items-center gap-3 text-left w-full rounded-xl p-2 hover:bg-white/5 transition-all duration-200">
                  <span className="text-xl">{w.emoji}</span>
                  <div className="flex-1 min-w-0">
                    <div className="flex justify-between items-baseline mb-1">
                      <span className="text-sm text-text font-medium truncate">{w.name}</span>
                      <span className="text-xs text-text-muted whitespace-nowrap ml-2">{fmtClock(ms)}</span>
                    </div>
                    <div className="h-1.5 bg-black/30 rounded-full overflow-hidden">
                      <div className="h-full rounded-full transition-all duration-500" style={{ width: `${pct}%`, background: 'linear-gradient(90deg,#0A84FF,#007AFF)' }} />
                    </div>
                    <div className="flex justify-between items-baseline mt-1">
                      <span className="text-xs font-bold" style={{ color: '#0A84FF' }}>+{fmtUsd(earnedUsd)}</span>
                      {rate > 0 && <span className="text-[10px] text-text-muted">{fmtUsd(rate)}/час</span>}
                    </div>
                  </div>
                </button>
              )
            })}
            <button
              onClick={clearSessions}
              className="text-center text-[10px] text-text-muted hover:text-danger transition-colors"
            >
              Очистить всё
            </button>
          </div>
        </div>
      )}

      {/* Session history */}
      {sessions.length > 0 && (
        <div className="glass-light rounded-2xl p-4 mb-5">
          <div className="flex items-center justify-between mb-3">
            <div className="flex items-center gap-2">
              <Timer size={14} className="text-accent-light" />
              <h3 className="text-sm font-semibold text-text">Session history</h3>
            </div>
            <button
              onClick={clearSessions}
              className="text-[10px] text-text-muted hover:text-danger transition-colors"
            >
              Очистить
            </button>
          </div>
          <div className="flex flex-col gap-2">
            {sessions.slice(0, 6).map(s => {
              const usd = rubToUsd(s.profitDeltaRub, r2u)
              const w = workers.find(x => x.id === s.workerId)
              return (
                <div key={s.id} className="flex items-center gap-3 bg-black/20 rounded-xl px-3 py-2">
                  <span className="text-base">{w ? w.emoji : '⏱️'}</span>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-baseline gap-2">
                      <p className="text-xs font-medium text-text">{w ? w.name : ''}{w ? ' · ' : ''}{fmtClock(s.durationMs)}</p>
                    </div>
                    <p className="text-[10px] text-text-muted truncate">
                      {new Date(s.endedAt).toLocaleDateString('uk-UA', { day: 'numeric', month: 'short' })}
                      {' · '}{new Date(s.endedAt).toLocaleTimeString('uk-UA', { hour: '2-digit', minute: '2-digit' })}
                    </p>
                  </div>
                  {usd > 0 ? (
                    <span className="text-xs font-bold" style={{ color: '#0A84FF' }}>+{fmtUsd(usd)}</span>
                  ) : (
                    <span className="text-[10px] text-text-muted">—</span>
                  )}
                </div>
              )
            })}
          </div>
        </div>
      )}

      {/* Worker ranking */}
      {topWorkers.length > 0 && (
        <div className="glass-light rounded-2xl p-4">
          <h3 className="text-sm font-semibold text-text mb-3">Worker ranking</h3>
          <div className="flex flex-col gap-3 stagger">
            {topWorkers.map((w, i) => {
              const usd = rubToUsd(w.totalProfit, r2u)
              const pct = (w.totalProfit / topWorkers[0].totalProfit) * 100
              return (
                <button key={w.id} onClick={() => navigate(`/workers/${w.id}`)} className="flex items-center gap-3 text-left w-full rounded-xl p-2 hover:bg-white/5 transition-all duration-200 hover:translate-x-1">
                  <span className="text-lg w-7 text-center">{i < 3 ? medals[i] : <span className="text-text-muted text-sm font-bold">{i + 1}</span>}</span>
                  <span className="text-xl">{w.emoji}</span>
                  <div className="flex-1">
                    <div className="flex justify-between items-baseline mb-1">
                      <span className="text-sm text-text font-medium">{w.name}</span>
                      <div className="text-right">
                        <span className="text-sm font-bold" style={{ color: '#0A84FF' }}>{fmtUsd(usd)}</span>
                        <span className="text-text-muted text-[10px] ml-1.5">({fmtUah(usdToUah(usd, u2ua))})</span>
                      </div>
                    </div>
                    <div className="h-1.5 bg-black/30 rounded-full overflow-hidden">
                      <div className="h-full rounded-full transition-all duration-500" style={{ width: `${pct}%`, background: i === 0 ? 'linear-gradient(90deg,#0A84FF,#007AFF)' : 'rgba(10,132,255,0.45)' }} />
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
