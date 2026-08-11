import { useMemo, useState } from 'react'
import { motion } from 'framer-motion'
import { Monitor, Smartphone, Tablet, Clock } from 'lucide-react'
import { useT } from '@/i18n'
import { aggregateUsage, detectDevice, useUsage, type DeviceKind } from '@/lib/usage'

const DEVICE_ICON: Record<DeviceKind, typeof Monitor> = {
  desktop: Monitor,
  mobile: Smartphone,
  tablet: Tablet,
}

/** Mirrors `PROFIT_TYPE_KEYS` in `@/i18n` — keeps the label lookup type-safe. */
const DEVICE_LABEL_KEY = {
  desktop: 'device_desktop',
  mobile: 'device_mobile',
  tablet: 'device_tablet',
} as const

const RANGES = [
  { id: 'today', days: 1 },
  { id: '7d', days: 7 },
  { id: '30d', days: 30 },
] as const

type RangeId = typeof RANGES[number]['id']

/**
 * "When do I use this, and from what" — total time on the site, broken down by
 * hour of the day and by device.
 *
 * Bars are summed across every day in range, so the shape answers "what time of
 * day am I usually here", not "what happened on one particular date" — that is
 * what the activity heatmap below it is for.
 */
export function ScreenTimeCard() {
  const t = useT()
  const [range, setRange] = useState<RangeId>('today')
  const days = RANGES.find(r => r.id === range)!.days
  const { rows, loading } = useUsage(days)
  const thisDevice = detectDevice()

  const { byHour, byDevice, totalMs, visits, peakHour } = useMemo(
    () => aggregateUsage(rows),
    [rows]
  )

  const maxHour = Math.max(...byHour, 1)
  const currentHour = new Date().getHours()
  const empty = totalMs <= 0

  const fmtDur = (ms: number) => {
    const h = Math.floor(ms / 3600000)
    const m = Math.floor((ms % 3600000) / 60000)
    if (h > 0) return t('dur_hm')(h, m)
    if (m > 0) return t('dur_m')(m)
    return t('dur_s')(Math.floor(ms / 1000))
  }

  return (
    <div className="glass-light rounded-2xl p-4 mb-5">
      {/* Header + range switcher — same control as the daily-earnings chart */}
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center gap-2">
          <Clock size={14} className="text-accent-light" />
          <h3 className="text-sm font-semibold text-text">{t('screen_time_title')}</h3>
        </div>
        <div className="flex gap-1 p-1 rounded-xl" style={{ background: 'rgba(0,0,0,0.35)' }}>
          {RANGES.map(r => (
            <button
              key={r.id}
              onClick={() => setRange(r.id)}
              className={`px-2.5 py-1 rounded-lg text-[11px] font-semibold transition-all ${
                range === r.id ? 'bg-accent text-white' : 'text-text-muted hover:text-text'
              }`}
            >
              {r.id === 'today' ? t('range_today') : t('range_days')(r.days)}
            </button>
          ))}
        </div>
      </div>

      <div className="flex flex-col sm:flex-row sm:gap-5">
        {/* ── Left: total + hour-of-day bars ── */}
        <div className="flex-1 min-w-0">
          <div className="flex items-baseline gap-2 mb-3">
            <span className="text-3xl font-bold text-white tabular-nums">
              {loading && empty ? '—' : fmtDur(totalMs)}
            </span>
            {peakHour !== null && (
              <span className="text-[11px] text-text-muted">
                {t('screen_time_peak')(peakHour)}
              </span>
            )}
          </div>

          <div className="relative">
            {/* Horizontal guides */}
            <div className="absolute inset-x-0 top-0 h-28 flex flex-col justify-between pointer-events-none">
              <div className="border-t border-dashed border-white/10" />
              <div className="border-t border-dashed border-white/10" />
              <div className="border-t border-dashed border-white/10" />
            </div>

            {/* Scale hint — what the tallest bar is worth */}
            {!empty && (
              <span className="absolute right-0 -top-4 text-[9px] text-text-muted tabular-nums">
                {fmtDur(maxHour)}
              </span>
            )}

            {/* Bars — one per hour of the day */}
            <div key={range} className="mb-1.5 flex h-28 items-end gap-[2px] relative z-10">
              {byHour.map((ms, hour) => {
                const ratio = ms / maxHour
                // Anything above zero keeps a sliver of height so a short visit
                // is still visible next to a long one.
                const height = ms > 0 ? Math.max(ratio, 0.05) : 0
                const isNow = range === 'today' && hour === currentHour
                const strong = ratio > 0.6 || isNow

                return (
                  <motion.div
                    key={hour}
                    title={`${String(hour).padStart(2, '0')}:00 — ${ms > 0 ? fmtDur(ms) : t('no_data')}`}
                    initial={{ scaleY: 0 }}
                    animate={{ scaleY: 1 }}
                    transition={{ delay: hour * 0.02, type: 'spring', stiffness: 100, damping: 12 }}
                    className="flex-1 rounded-t-sm origin-bottom"
                    style={{
                      height: `${height * 100}%`,
                      minHeight: ms > 0 ? 3 : 0,
                      background: strong
                        ? 'linear-gradient(180deg,#DCC2F2,#C09FE6)'
                        : 'rgba(255,255,255,0.12)',
                      boxShadow: isNow ? '0 0 10px rgba(192,159,230,0.55)' : undefined,
                    }}
                  />
                )
              })}
            </div>

            {/* Hour ticks */}
            <div className="flex justify-between text-[9px] text-text-muted tabular-nums">
              {['00', '06', '12', '18', '23'].map(h => <span key={h}>{h}</span>)}
            </div>

            {empty && !loading && (
              <p className="absolute inset-x-0 top-9 text-center text-[11px] text-text-muted px-4">
                {t('screen_time_empty')}
              </p>
            )}
          </div>
        </div>

        {/* ── Right: split by device ── */}
        <div className="w-px bg-white/10 hidden sm:block" />
        <div className="grid grid-cols-3 gap-2 mt-4 sm:mt-0 sm:flex sm:flex-col sm:justify-center sm:gap-3.5 sm:w-32 shrink-0">
          {byDevice.length === 0 ? (
            <p className="col-span-3 text-[11px] text-text-muted text-center sm:text-left">
              {t('no_data')}
            </p>
          ) : (
            byDevice.map(({ device, ms }, i) => {
              const Icon = DEVICE_ICON[device]
              const pct = totalMs > 0 ? Math.round((ms / totalMs) * 100) : 0
              return (
                <motion.div
                  key={device}
                  initial={{ opacity: 0, x: 20 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: i * 0.1 + 0.3 }}
                  className="flex items-center gap-2.5 rounded-xl bg-black/20 px-2 py-2 sm:bg-transparent sm:px-0 sm:py-0"
                >
                  <Icon size={16} className="text-accent-light shrink-0" strokeWidth={2.2} />
                  <div className="min-w-0">
                    <p className="text-xs font-semibold text-text tabular-nums leading-tight">
                      {fmtDur(ms)}
                    </p>
                    <p className="text-[9px] text-text-muted truncate">
                      {t(DEVICE_LABEL_KEY[device])} · {pct}%
                      {device === thisDevice && ` · ${t('screen_time_now')}`}
                    </p>
                  </div>
                </motion.div>
              )
            })
          )}
        </div>
      </div>

      {visits > 0 && (
        <p className="mt-3 pt-3 border-t border-white/5 text-[11px] text-text-muted">
          {t('screen_time_visits')(visits)}
        </p>
      )}
    </div>
  )
}
