import { useMemo, useState } from 'react'
import { TrendingUp, TrendingDown, Minus, Trophy, Zap, Star, Flame, Timer } from 'lucide-react'
import { useStore } from '@/store'
import { rubToUsd, usdToUah, fmtUsd, fmtUah, ProfitType, getLevelInfo } from '@/types'
import { useNavigate } from 'react-router-dom'
import { INTL_LOCALE, useLang, useProfitLabels, useT } from '@/i18n'
import {
  AreaChart, Area, Grid, XAxis, ChartTooltip,
  HeatmapChart, HeatmapCells, HeatmapXAxis, HeatmapYAxis, HeatmapTooltip, HeatmapLegend,
  HeatmapInteractionProvider, HeatmapInteractionBoundary,
  BarChart, Bar, BarXAxis,
  Legend, LegendItem, LegendMarker, LegendLabel, LegendProgress, useLegendItem,
  RingChart, Ring, RingCenter,
} from '@/components/charts'
import type { HeatmapColumn } from '@/components/charts/heatmap'
import { ScreenTimeCard } from '@/components/ScreenTimeCard'
import { startOf, localDayKey } from '@/lib/dates'

// Vertical blue gradient for the monthly bars (hoisted into the chart <defs>)
function MonthBarGradient() {
  return (
    <linearGradient id="monthBarGradient" x1="0%" x2="0%" y1="0%" y2="100%">
      <stop offset="0%" stopColor="#A596E8" />
      <stop offset="100%" stopColor="#8B7DCC" />
    </linearGradient>
  )
}
MonthBarGradient.displayName = 'MonthBarGradient'

// One color per profit type for the breakdown legend
const TYPE_COLORS: Record<ProfitType, string> = {
  oplata: '#A596E8',
  perevod: '#22d3a5',
  iks: '#f472b6',
  vozvrat: '#f59e0b',
  vozvrat_yurist: '#a78bfa',
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

// Legend row for "Worker ranking"
function WorkerRankLegendRow() {
  const { item } = useLegendItem()
  const navigate = useNavigate()
  return (
    <button
      onClick={() => item.id && navigate(`/workers/${item.id}`)}
      className="flex items-center gap-3 text-left w-full"
    >
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

// Legend row for the daily-goal ring (Today / До цели)
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

// ── Main Stats Page ──────────────────────────────────────────────────────────
export default function Stats() {
  const t = useT()
  const lang = useLang()
  const locale = INTL_LOCALE[lang]
  const profitLabels = useProfitLabels()
  const { profits, workers, anketas, profile, sessions, clearSessions, workerTime, workerBaseline } = useStore()
  const navigate = useNavigate()
  const { rubToUsd: r2u, usdToUah: u2ua } = profile.settings
  const [isMobile] = useState(() => window.matchMedia("(max-width: 767px)").matches)
  const heatmapBinSize = isMobile ? 16 : 0

  const totalRub = profits.reduce((s, p) => s + p.myShare, 0)
  const totalUsd = rubToUsd(totalRub, r2u)
  const totalUah = usdToUah(totalUsd, u2ua)
  const avgUsd = profits.length > 0 ? totalUsd / profits.length : 0
  const levelInfo = getLevelInfo(totalUah)
  const [hoverIndex, setHoverIndex] = useState<number | null>(null)

  // ── Per-worker time → money insights ─────────────────────────────────
  const workerEarn = (w: { id: string; totalProfit: number }) => {
    const ms = workerTime[w.id] ?? 0
    const base = workerBaseline[w.id]
    const earned = base !== undefined ? Math.max(0, w.totalProfit - base) : 0
    const rate = ms > 0 ? rubToUsd(earned, r2u) / (ms / 3600000) : 0
    return { ms, earnedRub: earned, earnedUsd: rubToUsd(earned, r2u), rate }
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
    return h > 0 ? t('dur_hm')(h, m) : t('dur_m')(m)
  }

  // Daily goal ring — today earned vs a manageable daily target
  const todayStart = startOf('day').getTime()
  const todayRub = profits.filter(p => new Date(p.createdAt).getTime() >= todayStart).reduce((s, p) => s + p.myShare, 0)
  const todayUsd = rubToUsd(todayRub, r2u)
  const dailyTarget = Math.max(5, totalRub > 0 ? totalRub / 30 : 10)
  const dailyTargetUsd = rubToUsd(dailyTarget, r2u)
  const dayPct = Math.min(100, (todayUsd / dailyTargetUsd) * 100)
  const reachUsd = Math.max(0, dailyTargetUsd - todayUsd)
  const ringData = useMemo(() => [
    { label: t('stats_today'), value: todayUsd, color: '#8B7DCC' },
    { label: t('stats_to_goal'), value: reachUsd, color: 'rgba(255,255,255,0.10)' },
  ], [todayUsd, reachUsd, lang])

  // Always the last 6 months, named in the active locale
  const monthlyData = useMemo(() => {
    const rows = []
    for (let i = 5; i >= 0; i--) {
      const d = new Date()
      d.setDate(1)
      d.setMonth(d.getMonth() - i)
      const key = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}`
      const rub = profits.filter(p => p.createdAt.startsWith(key)).reduce((s, p) => s + p.myShare, 0)
      rows.push({ name: d.toLocaleDateString(locale, { month: 'short' }), usd: rubToUsd(rub, r2u) })
    }
    return rows
  }, [profits, r2u, locale])

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
    const days: { date: Date; label: string; usd: number }[] = []
    for (let i = dailyDays - 1; i >= 0; i--) {
      const d = new Date()
      d.setHours(0, 0, 0, 0)
      d.setDate(d.getDate() - i)
      const key = d.toISOString().slice(0, 10)
      const rub = profits.filter(p => p.createdAt.startsWith(key)).reduce((s, p) => s + p.myShare, 0)
      days.push({
        date: d,
        label: d.toLocaleDateString(locale, { day: 'numeric', month: 'short' }),
        usd: rubToUsd(rub, r2u),
      })
    }
    // trailing moving average (7-day) — secondary "wave" layer
    const win = Math.min(7, days.length)
    return days.map((d, i) => {
      const from = Math.max(0, i - win + 1)
      const slice = days.slice(from, i + 1)
      const avg = slice.reduce((s, x) => s + x.usd, 0) / slice.length
      return { ...d, avg: Math.round(avg * 100) / 100 }
    })
  }, [profits, r2u, dailyDays, locale])

  // Profit by type
  const byType = useMemo(() => {
    const map = new Map<ProfitType, number>()
    profits.forEach(p => map.set(p.type, (map.get(p.type) ?? 0) + p.myShare))
    const entries = Array.from(map.entries()).sort((a, b) => b[1] - a[1])
    const maxRub = Math.max(...entries.map(e => e[1]), 1)
    return entries.map(([type, rub]) => ({
      type, label: profitLabels[type],
      usd: rubToUsd(rub, r2u),
      pct: totalRub > 0 ? (rub / totalRub) * 100 : 0,
      barPct: (rub / maxRub) * 100,
    }))
  }, [profits, r2u, totalRub, lang])

  // Streak
  const streak = useMemo(() => {
    // Local day keys, matching Workers.tsx — see src/lib/dates.ts.
    const daySet = new Set(profits.map(p => localDayKey(new Date(p.createdAt))))
    const d = new Date(); d.setHours(0, 0, 0, 0)
    if (!daySet.has(localDayKey(d))) d.setDate(d.getDate() - 1)
    let count = 0
    while (daySet.has(localDayKey(d))) { count++; d.setDate(d.getDate() - 1) }
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
      ? { date: new Date(entries[0][0]).toLocaleDateString(locale, { day: 'numeric', month: 'short' }), usd: rubToUsd(entries[0][1], r2u) }
      : null
  }, [profits, r2u, locale])

  // Heatmap — daily earnings, 26 weeks, Monday-first (GitHub style)
  const heatmapWeeks = 26
  const heatmapDayRub = useMemo(() => {
    const map = new Map<string, number>()
    profits.forEach(p => {
      const k = p.createdAt.slice(0, 10)
      map.set(k, (map.get(k) ?? 0) + p.myShare)
    })
    return map
  }, [profits])

  const heatmapData = useMemo<HeatmapColumn[]>(() => {
    const vals = Array.from(heatmapDayRub.values()).filter(v => v > 0).sort((a, b) => a - b)
    const q = (f: number) => vals.length ? vals[Math.min(vals.length - 1, Math.floor(f * vals.length))] : 0
    const t1 = q(0.25), t2 = q(0.5), t3 = q(0.75)
    const level = (rub: number) => rub <= 0 ? 0 : rub <= t1 ? 1 : rub <= t2 ? 2 : rub <= t3 ? 3 : 4

    const today = new Date(); today.setHours(0, 0, 0, 0)
    const daysSinceMonday = (today.getDay() + 6) % 7
    const start = new Date(today)
    start.setDate(start.getDate() - daysSinceMonday - (heatmapWeeks - 1) * 7)
    const cols: HeatmapColumn[] = []
    const cur = new Date(start)
    cur.setHours(0, 0, 0, 0)
    for (let w = 0; w < heatmapWeeks; w++) {
      const bins = []
      for (let d = 0; d < 7; d++) {
        const day = new Date(cur)
        const key = day.toISOString().slice(0, 10)
        bins.push({ bin: day.getDay(), count: level(heatmapDayRub.get(key) ?? 0), date: day })
        cur.setDate(cur.getDate() + 1)
      }
      cols.push({ bin: w, bins })
    }
    return cols
  }, [heatmapDayRub])

  const topWorkers = useMemo(() =>
    [...workers].sort((a, b) => b.totalProfit - a.totalProfit).filter(w => w.totalProfit > 0),
    [workers])
  const medals = ['🥇', '🥈', '🥉']

  return (
    <div className="px-4 pt-6 pb-28 md:pb-8 md:px-8 max-w-2xl">
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-text">{t('stats_title')}</h1>
        <p className="text-text-muted text-sm mt-1">{t('stats_overview')}</p>
      </div>

      {/* Key stats */}
      <div className="grid grid-cols-3 gap-3 mb-5 stagger">
        {[
          { label: t('stats_earned'), value: fmtUsd(totalUsd), sub: fmtUah(totalUah) },
          { label: t('stats_deals'), value: String(profits.length), sub: t('stats_deals_each')(fmtUsd(avgUsd)) },
          { label: t('fin_members'), value: String(workers.length), sub: t('stats_profiles_sub')(anketas.length) },
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
          <div className="h-full rounded-full transition-all duration-700" style={{ width: `${levelInfo.progress * 100}%`, background: 'linear-gradient(90deg,#8B7DCC,#7C6FD0)' }} />
        </div>
        <p className="text-text-muted text-xs">{Math.round(levelInfo.neededXp - levelInfo.currentXp).toLocaleString()} ₴ {t('level_to_next')(levelInfo.level + 1)}</p>
      </div>

      {/* Today ring + live pace */}
      <div className="glass-light rounded-2xl p-4 mb-5">
        <div className="flex items-center gap-4">
          <div className="shrink-0">
            <RingChart
              data={ringData}
              hoveredIndex={hoverIndex}
              onHoverChange={setHoverIndex}
              size={180}
              thickness={18}
            >
              <Ring index={0} />
              <Ring index={1} />
              <RingCenter value={fmtUsd(todayUsd)} sub={Math.round(dayPct) + '%'} />
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
          <span>{t('stats_sessions_label')} <b className="text-white">{fmtClock(sessionTotalMs)}</b> · {t('stats_all_time')(sessions.length)}</span>
          <span>{t('stats_daily_target')(fmtUsd(dailyTargetUsd))}</span>
          {sessionRate > 0 && <span className="font-bold" style={{ color: '#8B7DCC' }}>{t('per_hour')(fmtUsd(sessionRate))}</span>}
        </div>
      </div>

      {/* This month vs last */}
      <div className="glass-light rounded-2xl p-4 mb-5 flex items-center justify-between">
        <div>
          <p className="text-text-muted text-xs mb-1">{t('stats_this_month')}</p>
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
          <p className="text-text-muted text-xs mb-1">{t('stats_last_month')}</p>
          <p className="text-lg font-bold text-white/60">{fmtUsd(rubToUsd(lastRub, r2u))}</p>
          <p className="text-text-muted text-xs">{fmtUah(usdToUah(rubToUsd(lastRub, r2u), u2ua))}</p>
        </div>
      </div>

      {/* Monthly bar chart */}
      <div className="glass-light rounded-2xl p-4 mb-5">
        <h3 className="text-sm font-semibold text-text mb-4">{t('stats_monthly')}</h3>
        <BarChart
          data={monthlyData}
          xDataKey="name"
          barGap={0.3}
          margin={{ top: 10, right: 10, bottom: 24, left: 10 }}
        >
          <MonthBarGradient />
          <Grid horizontal />
          <Bar dataKey="usd" fill="url(#monthBarGradient)" lineCap="round" />
          <BarXAxis />
          <ChartTooltip />
        </BarChart>
      </div>

      {/* Daily line chart */}
      <div className="glass-light rounded-2xl p-4 mb-5">
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-2">
            <Zap size={14} className="text-accent-light" />
            <h3 className="text-sm font-semibold text-text">{t('stats_daily')}</h3>
          </div>
          {/* Range switcher */}
          <div className="flex gap-1 p-1 rounded-xl" style={{ background: 'rgba(0,0,0,0.35)' }}>
            {(['7d', '30d', '90d'] as const).map(r => (
              <button
                key={r}
                onClick={() => setDailyRange(r)}
                className={`px-2.5 py-1 rounded-lg text-[11px] font-semibold transition-all ${dailyRange === r ? 'bg-accent text-white' : 'text-text-muted hover:text-text'}`}
              >
                {r === '7d' ? t('range_days')(7) : r === '30d' ? t('range_days')(30) : t('range_days')(90)}
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
          <Area dataKey="usd" fill="#8B7DCC" fillOpacity={0.35} strokeWidth={2} fadeEdges dashFromIndex={dailyData.length - 1} />
          <Area dataKey="avg" stroke="rgba(216,210,245,0.55)" fill="rgba(139,125,204,0.12)" strokeWidth={1.5} fillOpacity={0.5} fadeEdges={false} showLine />
          <XAxis numTicks={dailyDays <= 7 ? 7 : 5} tickerHalfWidth={40} />
          <ChartTooltip
            showDatePill={false}
            rows={point => {
              const usd = typeof point.usd === 'number' ? point.usd : 0
              return [
                { color: '#8B7DCC', label: t('stats_earnings'), value: fmtUsd(usd) },
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

      {/* Time on site — sits next to the heatmap: one answers "when in the day",
          the other "which days". */}
      <ScreenTimeCard />

      {/* Streak + Heatmap */}
      <div className="glass-light rounded-2xl p-4 mb-5">
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-2">
            <Flame size={15} style={{ color: '#ffa000' }} />
            <h3 className="text-sm font-semibold text-text">{t('stats_activity')}</h3>
          </div>
          {streak > 0 && (
            <div className="flex items-center gap-1.5 px-3 py-1 rounded-xl text-xs font-bold" style={{ background: 'rgba(255,160,0,0.12)', color: '#ffa000' }}>
              <Flame size={12} />
              {t('days_count')(streak)}
            </div>
          )}
        </div>
        <HeatmapInteractionProvider>
          <HeatmapInteractionBoundary>
            {isMobile ? (
              <div className="overflow-x-auto pb-1">
                <HeatmapChart
                  data={heatmapData}
                  layout="fluid"
                  weekStartDay={1}
                  binSize={heatmapBinSize}
                  margin={{ top: 20, right: 4, bottom: 0, left: 26 }}
                >
                  <HeatmapCells />
                  <HeatmapXAxis />
                  <HeatmapYAxis tickFilter="odd" />
                  <HeatmapTooltip
                    formatLabel={(_count, date) => {
                      const key = date.toISOString().slice(0, 10)
                      const rub = heatmapDayRub.get(key) ?? 0
                      return rub > 0
                        ? `${fmtUsd(rubToUsd(rub, r2u))} · ${fmtUah(usdToUah(rubToUsd(rub, r2u), u2ua))}`
                        : t('no_data')
                    }}
                  />
                </HeatmapChart>
              </div>
            ) : (
              <HeatmapChart
                data={heatmapData}
                layout="fluid"
                weekStartDay={1}
                margin={{ top: 20, right: 4, bottom: 0, left: 26 }}
              >
                <HeatmapCells />
                <HeatmapXAxis />
                <HeatmapYAxis tickFilter="odd" />
                <HeatmapTooltip
                  formatLabel={(_count, date) => {
                    const key = date.toISOString().slice(0, 10)
                    const rub = heatmapDayRub.get(key) ?? 0
                    return rub > 0
                      ? `${fmtUsd(rubToUsd(rub, r2u))} · ${fmtUah(usdToUah(rubToUsd(rub, r2u), u2ua))}`
                      : t('no_data')
                  }}
                />
              </HeatmapChart>
            )}
            <HeatmapLegend lessLabel={t('heat_less')} moreLabel={t('heat_more')} />
          </HeatmapInteractionBoundary>
        </HeatmapInteractionProvider>
      </div>

      {/* Breakdown by type */}
      {byType.length > 0 && (
        <div className="glass-light rounded-2xl p-4 mb-5">
          <Legend
            title="Breakdown by type"
            titleClassName="text-sm font-semibold text-text mb-3"
            className="gap-1"
            items={byType.map(t => ({
              label: t.label,
              value: t.usd,
              maxValue: rubToUsd(totalRub, r2u),
              color: TYPE_COLORS[t.type],
            }))}
          >
            <LegendItem>
              <BreakdownLegendRow />
            </LegendItem>
          </Legend>
        </div>
      )}

      {/* Records */}
      {(bestDay || profits.length > 0) && (
        <div className="glass-light rounded-2xl p-4 mb-5">
          <div className="flex items-center gap-2 mb-3">
            <Trophy size={14} className="text-yellow-400" />
            <h3 className="text-sm font-semibold text-text">{t('stats_records')}</h3>
          </div>
          <div className="grid grid-cols-2 gap-3">
            {bestDay && (
              <div className="bg-black/20 rounded-xl p-3 hover:bg-black/30 transition-colors">
                <p className="text-text-muted text-[10px] uppercase tracking-wide mb-1">{t('stats_best_day')}</p>
                <p className="text-base font-bold text-white">{fmtUsd(bestDay.usd)}</p>
                <p className="text-text-muted text-[10px]">{fmtUah(usdToUah(bestDay.usd, u2ua))}</p>
                <p className="text-text-muted text-xs mt-0.5">{bestDay.date}</p>
              </div>
            )}
            <div className="bg-black/20 rounded-xl p-3 hover:bg-black/30 transition-colors">
              <p className="text-text-muted text-[10px] uppercase tracking-wide mb-1">{t('stats_avg_deal')}</p>
              <p className="text-base font-bold text-white">{fmtUsd(avgUsd)}</p>
              <p className="text-text-muted text-[10px]">{fmtUah(usdToUah(avgUsd, u2ua))}</p>
              <p className="text-text-muted text-xs mt-0.5">{t('stats_deals_total')(profits.length)}</p>
            </div>
          </div>
        </div>
      )}

      {/* Time → money per worker */}
      {trackedWorkers.length > 0 && (
        <div className="glass-light rounded-2xl p-4 mb-5">
          <div className="flex items-center gap-2 mb-3">
            <Timer size={14} className="text-accent-light" />
            <h3 className="text-sm font-semibold text-text">{t('stats_time_money')}</h3>
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
                      <div className="h-full rounded-full transition-all duration-500" style={{ width: `${pct}%`, background: 'linear-gradient(90deg,#8B7DCC,#7C6FD0)' }} />
                    </div>
                    <div className="flex justify-between items-baseline mt-1">
                      <span className="text-xs font-bold" style={{ color: '#8B7DCC' }}>+{fmtUsd(earnedUsd)}</span>
                      {rate > 0 && <span className="text-[10px] text-text-muted">{t('per_hour')(fmtUsd(rate))}</span>}
                    </div>
                  </div>
                </button>
              )
            })}
            <button
              onClick={clearSessions}
              className="text-center text-[10px] text-text-muted hover:text-danger transition-colors"
            >
              {t('clear_all')}
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
              <h3 className="text-sm font-semibold text-text">{t('stats_session_history')}</h3>
            </div>
            <button
              onClick={clearSessions}
              className="text-[10px] text-text-muted hover:text-danger transition-colors"
            >
              {t('clear')}
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
                      {new Date(s.endedAt).toLocaleDateString(locale, { day: 'numeric', month: 'short' })}
                      {' · '}{new Date(s.endedAt).toLocaleTimeString(locale, { hour: '2-digit', minute: '2-digit' })}
                    </p>
                  </div>
                  {usd > 0 ? (
                    <span className="text-xs font-bold" style={{ color: '#8B7DCC' }}>+{fmtUsd(usd)}</span>
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
          <Legend
            title="Member ranking"
            titleClassName="text-sm font-semibold text-text mb-3"
            className="gap-1"
            items={topWorkers.map((w, i) => ({
              label: w.name,
              value: rubToUsd(w.totalProfit, r2u),
              maxValue: rubToUsd(topWorkers[0].totalProfit, r2u),
              color: i === 0 ? '#A596E8' : 'rgba(139,125,204,0.45)',
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
    </div>
  )
}
