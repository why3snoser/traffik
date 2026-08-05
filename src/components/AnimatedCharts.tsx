import { useEffect, useRef, useState } from 'react'
import { motion } from 'motion/react'
import { scaleBand, scaleLinear, scalePoint } from '@visx/scale'
import { LinearGradient } from '@visx/gradient'
import { ParentSize } from '@visx/responsive'
import { curveMonotoneX } from '@visx/curve'
import { line as d3Line } from '@visx/shape'
import NumberFlow from '@number-flow/react'
import { fmtUsd, fmtUah, usdToUah } from '@/types'

const EASE = [0.22, 1, 0.36, 1] as const

// Measure a container's width via ResizeObserver (keeps tooltips from being clipped)
function useWidth<T extends HTMLElement>() {
  const ref = useRef<T | null>(null)
  const [width, setWidth] = useState(0)
  useEffect(() => {
    const el = ref.current
    if (!el) return
    const ro = new ResizeObserver(entries => {
      const w = entries[0]?.contentRect.width ?? 0
      setWidth(prev => (Math.abs(prev - w) > 1 ? w : prev))
    })
    ro.observe(el)
    return () => ro.disconnect()
  }, [])
  return { ref, width }
}

// ── Animated area chart (visx curve + motion) ────────────────────────────────
const lineGen =
  d3Line<{ x: number; y: number }>()
    .x(d => d.x)
    .y(d => d.y)
    .curve(curveMonotoneX)

export function AnimatedAreaChart({
  data,
  u2ua,
}: {
  data: { label: string; usd: number }[]
  u2ua: number
}) {
  const { ref, width } = useWidth<HTMLDivElement>()
  const svgRef = useRef<SVGSVGElement | null>(null)
  const [hover, setHover] = useState<number | null>(null)

  const H = 160
  const m = { top: 16, right: 6, left: 6, bottom: 26 }
  const innerH = H - m.top - m.bottom
  const innerW = Math.max(width - m.left - m.right, 1)

  const x = scalePoint({ domain: data.map(d => d.label), range: [0, innerW], padding: 0.5 })
  const y = scaleLinear({ domain: [0, Math.max(...data.map(d => d.usd), 1)], range: [innerH, 0] })

  const pts = data.map((d, i) => ({
    i,
    x: x(d.label) ?? 0,
    y: y(d.usd),
    usd: d.usd,
    label: d.label,
  }))

  const lineD = lineGen(pts) ?? ''
  const areaD = `${lineD} L ${pts[pts.length - 1].x} ${innerH} L ${pts[0].x} ${innerH} Z`

  const maxUsd = Math.max(...data.map(d => d.usd), 0)
  const tickStep = pts.length > 8 ? Math.ceil(pts.length / 6) : 1

  const handleMove = (e: React.MouseEvent<SVGSVGElement>) => {
    const svg = svgRef.current
    if (!svg) return
    const rect = svg.getBoundingClientRect()
    const px = e.clientX - rect.left - m.left
    let idx = 0
    let best = Infinity
    pts.forEach(p => {
      const d = Math.abs(p.x - px)
      if (d < best) { best = d; idx = p.i }
    })
    setHover(idx)
  }

  const h = hover !== null ? pts[hover] : null

  return (
    <div ref={ref} className="relative" style={{ height: H }}>
      {width > 0 && (
        <svg
          ref={svgRef}
          width={width}
          height={H}
          onMouseMove={handleMove}
          onMouseLeave={() => setHover(null)}
          style={{ cursor: 'crosshair', touchAction: 'pan-y' }}
        >
          <defs>
            <LinearGradient id="da-fill" from="#6CC0FF" to="#007AFF" vertical fromOpacity={0.5} toOpacity={0.02} />
            <LinearGradient id="da-line" from="#8FD0FF" to="#007AFF" />
            <linearGradient id="da-fade" x1="0" y1="0" x2="1" y2="0">
              <stop offset="0%" stopColor="#fff" stopOpacity="0" />
              <stop offset="12%" stopColor="#fff" stopOpacity="1" />
              <stop offset="88%" stopColor="#fff" stopOpacity="1" />
              <stop offset="100%" stopColor="#fff" stopOpacity="0" />
            </linearGradient>
            <mask id="da-fade-mask">
              <rect x={0} y={0} width={innerW} height={innerH} fill="url(#da-fade)" />
            </mask>
          </defs>

          {/* horizontal grid */}
          {[0, 1, 2, 3, 4].map(t => {
            const gy = (t / 4) * innerH
            return (
              <line
                key={t}
                x1={m.left}
                x2={m.left + innerW}
                y1={m.top + gy}
                y2={m.top + gy}
                stroke="rgba(255,255,255,0.06)"
                strokeDasharray="4,4"
              />
            )
          })}

          <g transform={`translate(${m.left},${m.top})`}>
            {/* area fill with faded edges */}
            {maxUsd > 0 && (
              <motion.path
                d={areaD}
                fill="url(#da-fill)"
                mask="url(#da-fade-mask)"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                transition={{ duration: 0.7, delay: 0.35 }}
              />
            )}

            {/* crosshair + dot on hover */}
            {h && (
              <g style={{ pointerEvents: 'none' }}>
                <line
                  x1={h.x}
                  x2={h.x}
                  y1={0}
                  y2={innerH}
                  stroke="rgba(255,255,255,0.28)"
                  strokeDasharray="3,3"
                />
                <circle cx={h.x} cy={h.y} r={4.5} fill="#0A0E1A" stroke="#9BD4FF" strokeWidth={2} />
                <circle cx={h.x} cy={h.y} r={2} fill="#9BD4FF" />
              </g>
            )}

            {/* smooth line, draw-on */}
            <motion.path
              d={lineD}
              fill="none"
              stroke="url(#da-line)"
              strokeWidth={2}
              strokeLinecap="round"
              initial={{ pathLength: 0, opacity: 0.4 }}
              animate={{ pathLength: 1, opacity: 1 }}
              transition={{ duration: 1.1, ease: EASE }}
              style={{ filter: 'drop-shadow(0 0 5px rgba(10,132,255,0.45))', pointerEvents: 'none' }}
            />

            {/* x labels */}
            {pts.map((p, i) =>
              i % tickStep === 0 ? (
                <text
                  key={i}
                  x={p.x}
                  y={innerH + 18}
                  textAnchor="middle"
                  fontSize={9}
                  fill={hover === i ? 'rgba(255,255,255,0.9)' : 'rgba(255,255,255,0.4)'}
                  fontWeight={hover === i ? 700 : 600}
                >
                  {p.label}
                </text>
              ) : null
            )}

            {/* y-max faint label */}
            {maxUsd > 0 && (
              <text
                x={innerW}
                y={-4}
                textAnchor="end"
                fontSize={8}
                fill="rgba(255,255,255,0.3)"
              >
                {fmtUsd(maxUsd)}
              </text>
            )}

            {/* hover capture overlay */}
            <rect
              x={0}
              y={-m.top}
              width={innerW}
              height={innerH + m.top}
              fill="transparent"
            />
          </g>
        </svg>
      )}

      {/* tooltip */}
      {h && width > 0 && (
        <div
          className="pointer-events-none absolute z-10 text-xs font-bold text-white rounded-xl px-2.5 py-1.5 whitespace-nowrap"
          style={{
            left: m.left + h.x,
            top: m.top + h.y,
            transform: 'translate(-50%, -100%)',
            background: 'rgba(4,12,6,0.97)',
            border: '1px solid rgba(10,132,255,0.4)',
            backdropFilter: 'blur(14px)',
            boxShadow: '0 4px 24px rgba(0,0,0,0.6), 0 0 12px rgba(10,132,255,0.12)',
            color: '#fff',
          }}
        >
          {h.usd > 0 ? (
            <>
              {fmtUsd(h.usd)}
              <span className="text-white/50 font-normal"> ({fmtUah(usdToUah(h.usd, u2ua))})</span>
            </>
          ) : '—'}
          <div className="text-white/50 font-normal text-[10px] mt-0.5">{h.label}</div>
        </div>
      )}
    </div>
  )
}

// ── Animated monthly bar chart (visx + motion) ───────────────────────────────
export function AnimatedBarChart({ data }: { data: { label: string; usd: number }[] }) {
  return (
    <div className="relative" style={{ height: 140 }}>
      <ParentSize debounceTime={0}>
        {({ width }) => <Bars width={width} data={data} />}
      </ParentSize>
    </div>
  )
}
function Bars({ width, data }: { width: number; data: { label: string; usd: number }[] }) {
  const [hover, setHover] = useState<number | null>(null)
  const height = 140
  const margin = { top: 16, left: 2, right: 2, bottom: 22 }
  const xMax = Math.max(width - margin.left - margin.right, 1)
  const yMax = height - margin.top - margin.bottom

  const x = scaleBand({ domain: data.map(d => d.label), range: [margin.left, margin.left + xMax], padding: 0.34 })
  const y = scaleLinear({ domain: [0, Math.max(...data.map(d => d.usd), 1)], range: [yMax, 0] })

  return (
    <svg width={width} height={height} role="img" aria-label="Monthly earnings bar chart">
      <LinearGradient id="mb-grad" from="#6CC0FF" to="#007AFF" />
      {data.map((d, i) => {
        const bw = Math.min(x.bandwidth(), 42)
        const bx = (x(d.label) ?? 0) + (x.bandwidth() - bw) / 2
        const bh = Math.max(yMax - y(d.usd), d.usd > 0 ? 1 : 0)
        const by = yMax - bh
        const active = hover === i
        return (
          <g key={d.label}>
            <motion.rect
              x={x(d.label) ?? 0}
              y={margin.top}
              width={x.bandwidth()}
              height={yMax - margin.top}
              rx={8}
              fill="#0A84FF"
              initial={{ opacity: 0 }}
              animate={{ opacity: active ? 0.1 : 0 }}
              transition={{ duration: 0.15 }}
              onMouseEnter={() => setHover(i)}
              onMouseLeave={() => setHover(null)}
              style={{ cursor: 'pointer' }}
            />
            <motion.g animate={{ opacity: active ? 1 : 0 }} initial={{ opacity: 0 }}>
              <text x={bx + bw / 2} y={by - 7} textAnchor="middle" fontSize={9} fontWeight={700} fill="#FFFFFF">
                {fmtUsd(d.usd)}
              </text>
            </motion.g>
            <motion.rect
              x={bx}
              width={bw}
              rx={6}
              initial={{ height: 0, y: yMax }}
              animate={{ height: bh, y: by }}
              transition={{ duration: 0.65, delay: i * 0.06, ease: EASE }}
              fill={d.usd > 0 ? 'url(#mb-grad)' : 'rgba(255,255,255,0.05)'}
              style={{
                filter: active
                  ? 'drop-shadow(0 0 7px rgba(10,132,255,0.65))'
                  : d.usd > 0
                    ? 'drop-shadow(0 0 4px rgba(10,132,255,0.25))'
                    : 'none',
              }}
            />
            <text
              x={(x(d.label) ?? 0) + x.bandwidth() / 2}
              y={height - 7}
              textAnchor="middle"
              fontSize={9}
              fontWeight={600}
              fill="rgba(255,255,255,0.45)"
            >
              {d.label}
            </text>
          </g>
        )
      })}
    </svg>
  )
}

// ── Animated daily-goal ring (motion + NumberFlow) ───────────────────────────
export function AnimatedRing({
  pct,
  label,
  sub,
  value,
}: {
  pct: number
  label: string
  sub: string
  value: number
}) {
  const R = 40
  const C = 2 * Math.PI * R
  const clamped = Math.min(100, Math.max(0, pct))
  return (
    <div className="relative w-28 h-28">
      <svg viewBox="0 0 100 100" className="w-full h-full -rotate-90">
        <defs>
          <linearGradient id="ring-grad" x1="0" y1="0" x2="1" y2="1">
            <stop offset="0%" stopColor="#64B5FF" />
            <stop offset="100%" stopColor="#007AFF" />
          </linearGradient>
        </defs>
        <circle cx="50" cy="50" r={R} fill="none" stroke="rgba(255,255,255,0.06)" strokeWidth="8" />
        <motion.circle
          cx="50"
          cy="50"
          r={R}
          fill="none"
          stroke="url(#ring-grad)"
          strokeWidth="8"
          strokeLinecap="round"
          strokeDasharray={C}
          initial={{ strokeDashoffset: C }}
          animate={{ strokeDashoffset: C * (1 - clamped / 100) }}
          transition={{ duration: 1, ease: EASE }}
          style={{ filter: 'drop-shadow(0 0 6px rgba(10,132,255,0.5))' }}
        />
      </svg>
      <div className="absolute inset-0 flex flex-col items-center justify-center">
        <NumberFlow
          value={value}
          locales="en-US"
          format={{ style: 'currency', currency: 'USD', minimumFractionDigits: 2, maximumFractionDigits: 2 }}
          className="text-lg font-bold text-white"
        />
        <span className="text-[9px] text-text-muted">{sub}</span>
      </div>
      <p className="text-center text-[10px] text-text-muted mt-1">{label}</p>
    </div>
  )
}