import { useState } from 'react'
import { motion } from 'motion/react'
import { scaleBand, scaleLinear } from '@visx/scale'
import { LinearGradient } from '@visx/gradient'
import { ParentSize } from '@visx/responsive'
import NumberFlow from '@number-flow/react'
import { fmtUsd } from '@/types'

const EASE = [0.22, 1, 0.36, 1] as const

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
  const height = 132
  const margin = { top: 14, left: 2, right: 2, bottom: 26 }
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