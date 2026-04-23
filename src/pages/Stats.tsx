import { useMemo, useState, useRef } from 'react'
import { TrendingUp, TrendingDown, Minus, Trophy, Zap, Star, Flame } from 'lucide-react'
import { useStore } from '@/store'
import { rubToUsd, usdToUah, fmtUsd, fmtUah, PROFIT_LABELS, ProfitType, getLevelInfo, ProfitEntry } from '@/types'
import { useNavigate } from 'react-router-dom'

// ── SVG Line Chart ───────────────────────────────────────────────────────────
function LineChart({ data, chartId, u2ua }: { data: { usd: number; label: string }[]; chartId: string; u2ua: number }) {
  const [hover, setHover] = useState<number | null>(null)
  const svgRef = useRef<SVGSVGElement>(null)
  const W = 500, H = 90, PAD_TOP = 10, PAD_X = 6
  const max = Math.max(...data.map(d => d.usd), 0.01)

  const pts = data.map((d, i) => ({
    x: PAD_X + (i / Math.max(data.length - 1, 1)) * (W - PAD_X * 2),
    y: PAD_TOP + (1 - d.usd / max) * (H - PAD_TOP - 4),
    ...d,
  }))

  const smooth = pts.map((p, i) => {
    if (i === 0) return `M ${p.x} ${p.y}`
    const prev = pts[i - 1]
    const cx = (prev.x + p.x) / 2
    return `C ${cx} ${prev.y} ${cx} ${p.y} ${p.x} ${p.y}`
  }).join(' ')
  const area = `${smooth} L ${pts[pts.length - 1].x} ${H} L ${pts[0].x} ${H} Z`

  const handleMouseMove = (e: React.MouseEvent<SVGSVGElement>) => {
    if (!svgRef.current) return
    const rect = svgRef.current.getBoundingClientRect()
    const pct = (e.clientX - rect.left) / rect.width
    setHover(Math.min(Math.max(Math.floor(pct * data.length), 0), data.length - 1))
  }

  const tooltipTransform = hover === null ? '' : hover <= 1 ? 'translateX(0%)' : hover >= data.length - 2 ? 'translateX(-100%)' : 'translateX(-50%)'

  return (
    <div className="relative" style={{ height: H }}>
      <svg
        ref={svgRef}
        viewBox={`0 0 ${W} ${H}`}
        preserveAspectRatio="none"
        className="w-full h-full"
        style={{ cursor: 'crosshair' }}
        onMouseMove={handleMouseMove}
        onMouseLeave={() => setHover(null)}
      >
        <defs>
          <linearGradient id={`${chartId}-area`} x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%" stopColor="#00e676" stopOpacity="0.4" />
            <stop offset="100%" stopColor="#00e676" stopOpacity="0.02" />
          </linearGradient>
          <linearGradient id={`${chartId}-line`} x1="0" y1="0" x2="1" y2="0">
            <stop offset="0%" stopColor="#00e676" />
            <stop offset="100%" stopColor="#00c853" />
          </linearGradient>
        </defs>

        {/* Chart paths — pointer-events:none so SVG catches mouse */}
        <path d={area} fill={`url(#${chartId}-area)`} style={{ pointerEvents: 'none' }} />
        <path d={smooth} fill="none" stroke={`url(#${chartId}-line)`} strokeWidth="1.8" strokeLinecap="round" style={{ pointerEvents: 'none' }} />

        {/* Static dots for non-zero days */}
        {pts.map((p, i) =>
          p.usd > 0 && hover !== i ? (
            <circle key={i} cx={p.x} cy={p.y} r="2" fill="rgba(0,230,118,0.7)" style={{ pointerEvents: 'none' }} />
          ) : null
        )}

        {/* Hover indicator */}
        {hover !== null && (
          <g style={{ pointerEvents: 'none' }}>
            <line x1={pts[hover].x} y1={0} x2={pts[hover].x} y2={H} stroke="rgba(255,255,255,0.15)" strokeWidth="1" strokeDasharray="3,3" />
            <circle cx={pts[hover].x} cy={pts[hover].y} r="5.5" fill="#080617" stroke="#00c853" strokeWidth="2" />
            <circle cx={pts[hover].x} cy={pts[hover].y} r="2.5" fill="#00c853" />
          </g>
        )}
      </svg>

      {hover !== null && (
        <div
          className="absolute z-10 text-xs font-bold text-white rounded-xl px-2.5 py-1.5 pointer-events-none whitespace-nowrap"
          style={{
            top: -2,
            left: `${((hover + 0.5) / data.length) * 100}%`,
            transform: tooltipTransform,
            background: 'rgba(4,12,6,0.97)',
            border: '1px solid rgba(0,230,118,0.35)',
            backdropFilter: 'blur(14px)',
            boxShadow: '0 4px 24px rgba(0,0,0,0.6), 0 0 16px rgba(0,230,118,0.08)',
          }}
        >
          {data[hover].usd > 0 ? (
            <>
              {fmtUsd(data[hover].usd)}
              <span className="text-white/50 font-normal"> ({fmtUah(usdToUah(data[hover].usd, u2ua))})</span>
            </>
          ) : '—'}
          <div className="text-white/50 font-normal text-[10px] mt-0.5">{data[hover].label}</div>
        </div>
      )}
    </div>
  )
}

// ── Bar Chart with hover ─────────────────────────────────────────────────────
function BarChart({ data }: { data: { label: string; usd: number; pct: number }[] }) {
  const [hover, setHover] = useState<number | null>(null)
  return (
    <div className="flex items-end gap-2" style={{ height: 120 }}>
      {data.map((d, i) => (
        <div
          key={d.label}
          className="flex-1 flex flex-col items-center gap-1 h-full justify-end cursor-default"
          onMouseEnter={() => setHover(i)}
          onMouseLeave={() => setHover(null)}
        >
          <span className="text-[9px] font-semibold transition-all duration-150" style={{ color: '#00e676', opacity: hover === i ? 1 : 0 }}>
            {fmtUsd(d.usd)}
          </span>
          <div
            className="w-full rounded-t-lg transition-all duration-200"
            style={{
              height: `${Math.max(d.pct, d.usd > 0 ? 6 : 2)}%`,
              background: hover === i
                ? 'linear-gradient(180deg,#00c853 0%,#00e676 100%)'
                : d.usd > 0
                  ? `linear-gradient(180deg,rgba(0,230,118,${0.35 + d.pct / 100 * 0.65}) 0%,rgba(0,200,83,${0.15 + d.pct / 100 * 0.35}) 100%)`
                  : 'rgba(255,255,255,0.05)',
              boxShadow: hover === i ? '0 0 12px rgba(0,200,83,0.4)' : 'none',
            }}
          />
          <span className="text-[10px] text-text-muted">{d.label}</span>
        </div>
      ))}
    </div>
  )
}

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
    if (rub === 0) return 'rgba(0,230,118,0.07)'
    const t = rub / maxRub
    return `rgba(0,230,118,${(0.22 + t * 0.78).toFixed(2)})`
  }

  const DAYS = ['Пн', 'Вт', 'Ср', 'Чт', 'Пт', 'Сб', 'Нд']

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
          <div className="flex gap-1">
            {weeks.map((week, wi) => (
              <div key={wi} className="flex flex-col gap-1">
                {week.map(({ date, key, rub }) => {
                  const usd = rubToUsd(rub, r2u)
                  return (
                    <div
                      key={key}
                      className="w-3.5 h-3.5 rounded-sm cursor-default transition-all duration-100 hover:scale-125"
                      style={{ backgroundColor: getColor(rub, date) }}
                      title={`${date.toLocaleDateString('uk-UA', { day: 'numeric', month: 'short' })}${rub > 0 ? ` · ${fmtUsd(usd)}` : ''}`}
                    />
                  )
                })}
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  )
}

// ── Main Stats Page ──────────────────────────────────────────────────────────
export default function Stats() {
  const { profits, workers, anketas, profile } = useStore()
  const navigate = useNavigate()
  const { rubToUsd: r2u, usdToUah: u2ua } = profile.settings

  const totalRub = profits.reduce((s, p) => s + p.myShare, 0)
  const totalUsd = rubToUsd(totalRub, r2u)
  const totalUah = usdToUah(totalUsd, u2ua)
  const avgUsd = profits.length > 0 ? totalUsd / profits.length : 0
  const levelInfo = getLevelInfo(totalUah)

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

  // Daily line chart (last 14 days, uk-UA)
  const dailyData = useMemo(() => {
    const days = []
    for (let i = 13; i >= 0; i--) {
      const d = new Date()
      d.setDate(d.getDate() - i)
      const key = d.toISOString().slice(0, 10)
      const rub = profits.filter(p => p.createdAt.startsWith(key)).reduce((s, p) => s + p.myShare, 0)
      days.push({ label: d.toLocaleDateString('uk-UA', { day: 'numeric', month: 'short' }), usd: rubToUsd(rub, r2u) })
    }
    return days
  }, [profits, r2u])

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
          <div className="h-full rounded-full transition-all duration-700" style={{ width: `${levelInfo.progress * 100}%`, background: 'linear-gradient(90deg,#00e676,#00c853)' }} />
        </div>
        <p className="text-text-muted text-xs">{Math.round(levelInfo.neededXp - levelInfo.currentXp).toLocaleString()} ₴ to level {levelInfo.level + 1}</p>
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
        <BarChart data={monthlyData} />
      </div>

      {/* Daily line chart */}
      <div className="glass-light rounded-2xl p-4 mb-5">
        <div className="flex items-center gap-2 mb-4">
          <Zap size={14} className="text-accent-light" />
          <h3 className="text-sm font-semibold text-text">Daily — last 14 days</h3>
        </div>
        <LineChart data={dailyData} chartId="daily" u2ua={u2ua} />
        <div className="flex mt-2">
          <span className="text-[9px] text-text-muted">{dailyData[0]?.label}</span>
          <span className="flex-1" />
          <span className="text-[9px] text-text-muted">{dailyData[13]?.label}</span>
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
            <div key={o} className="w-3 h-3 rounded-sm" style={{ background: o === 0.07 ? 'rgba(0,230,118,0.07)' : `rgba(0,230,118,${o})` }} />
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
                    <span className="text-xs font-bold" style={{ color: '#00e676' }}>{fmtUsd(usd)}</span>
                  </div>
                </div>
                <div className="h-1.5 bg-black/30 rounded-full overflow-hidden">
                  <div className="h-full rounded-full transition-all duration-500 group-hover:opacity-70" style={{ width: `${barPct}%`, background: 'linear-gradient(90deg,#00e676,#00c853)' }} />
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
                        <span className="text-sm font-bold" style={{ color: '#00e676' }}>{fmtUsd(usd)}</span>
                        <span className="text-text-muted text-[10px] ml-1.5">({fmtUah(usdToUah(usd, u2ua))})</span>
                      </div>
                    </div>
                    <div className="h-1.5 bg-black/30 rounded-full overflow-hidden">
                      <div className="h-full rounded-full transition-all duration-500" style={{ width: `${pct}%`, background: i === 0 ? 'linear-gradient(90deg,#00e676,#00c853)' : 'rgba(0,230,118,0.45)' }} />
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
