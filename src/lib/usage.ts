import { useEffect, useState } from 'react'
import { supabase } from '@/lib/supabase'

/**
 * Presence tracking — how much time is spent on the site, split by hour of the
 * day and by the device it was spent on.
 *
 * The unit of storage is one row per (day, device): the tab only ever writes
 * the row for the device it is running on, so a plain upsert is safe and the
 * phone can never clobber what the desktop wrote — no read-modify-write, no
 * RPC. Everything is mirrored into localStorage first, so a reload (or a
 * dropped connection) never loses the minutes accumulated since the last sync.
 */

export type DeviceKind = 'desktop' | 'mobile' | 'tablet'

export interface UsageDay {
  /** Local calendar day, `YYYY-MM-DD`. */
  day: string
  device: DeviceKind
  /** 24 buckets — active milliseconds spent in each local hour. */
  hours: number[]
  totalMs: number
  visits: number
}

const LS_KEY = 'traffik_usage_v1'
const TICK_MS = 15_000
/**
 * A visible tab fires its interval on schedule, so anything much longer than
 * one tick means the machine was asleep rather than in use. Capping the credit
 * keeps a closed laptop lid from turning into eight hours of "screen time".
 */
const MAX_TICK_MS = TICK_MS * 2
const FLUSH_MS = 30_000
/** Coming back after this long counts as a new visit rather than the same one. */
const NEW_VISIT_GAP_MS = 30 * 60_000

// ── Module state ─────────────────────────────────────────────────────────
let device: DeviceKind | null = null
let buffer: UsageDay | null = null
let started = false
let lastTick = 0
let hiddenSince = 0
let flushTimer = 0
let tickTimer = 0
const listeners = new Set<() => void>()

// ── Helpers ──────────────────────────────────────────────────────────────

/** Local calendar day — the hour-of-day view only makes sense in local time. */
function dayKey(d = new Date()): string {
  const m = String(d.getMonth() + 1).padStart(2, '0')
  const day = String(d.getDate()).padStart(2, '0')
  return `${d.getFullYear()}-${m}-${day}`
}

function emptyDay(day: string, dev: DeviceKind): UsageDay {
  return { day, device: dev, hours: Array(24).fill(0), totalMs: 0, visits: 0 }
}

function normalizeHours(raw: unknown): number[] {
  const out = Array(24).fill(0)
  if (Array.isArray(raw)) {
    for (let i = 0; i < 24; i++) {
      const v = Number(raw[i])
      out[i] = Number.isFinite(v) && v > 0 ? v : 0
    }
  }
  return out
}

function clone(d: UsageDay): UsageDay {
  return { ...d, hours: [...d.hours] }
}

export function detectDevice(): DeviceKind {
  if (device) return device
  const ua = navigator.userAgent
  const touchPoints = navigator.maxTouchPoints ?? 0

  // iPadOS 13+ reports itself as a Mac; the touch points give it away.
  if (/iPad/i.test(ua) || (/Macintosh/i.test(ua) && touchPoints > 1)) return (device = 'tablet')
  if (/Tablet|PlayBook|Silk/i.test(ua) || (/Android/i.test(ua) && !/Mobile/i.test(ua))) return (device = 'tablet')

  const uaData = (navigator as Navigator & { userAgentData?: { mobile?: boolean } }).userAgentData
  if (typeof uaData?.mobile === 'boolean') return (device = uaData.mobile ? 'mobile' : 'desktop')

  if (/Mobi|Android|iPhone|iPod/i.test(ua)) return (device = 'mobile')

  const coarse = window.matchMedia?.('(pointer: coarse)').matches ?? false
  if (coarse) return (device = window.innerWidth >= 768 ? 'tablet' : 'mobile')

  return (device = 'desktop')
}

function readStored(): UsageDay | null {
  try {
    const raw = JSON.parse(localStorage.getItem(LS_KEY) ?? 'null')
    if (raw && typeof raw === 'object' && typeof raw.day === 'string' && typeof raw.device === 'string') {
      return {
        day: raw.day,
        device: raw.device as DeviceKind,
        hours: normalizeHours(raw.hours),
        totalMs: Number(raw.totalMs) || 0,
        visits: Number(raw.visits) || 0,
      }
    }
  } catch { /* ignore */ }
  return null
}

function writeStored(d: UsageDay) {
  try { localStorage.setItem(LS_KEY, JSON.stringify(d)) } catch { /* ignore */ }
}

async function push(d: UsageDay) {
  try {
    await supabase.from('usage_days').upsert({
      day: d.day,
      device: d.device,
      hours: d.hours,
      total_ms: d.totalMs,
      visits: d.visits,
      updated_at: new Date().toISOString(),
    }, { onConflict: 'day,device' })
  } catch (e) {
    console.error('Usage sync error:', e)
  }
}

function notify() {
  listeners.forEach(l => l())
}

function scheduleFlush() {
  if (flushTimer) return
  flushTimer = window.setTimeout(() => { flushTimer = 0; flushNow() }, FLUSH_MS)
}

function flushNow() {
  if (flushTimer) { clearTimeout(flushTimer); flushTimer = 0 }
  if (buffer) push(buffer)
}

/** Past midnight: bank the finished day and open a fresh one. */
function rollOver(today: string) {
  const finished = buffer
  buffer = emptyDay(today, detectDevice())
  buffer.visits = 1
  writeStored(buffer)
  if (finished) push(finished)
  notify()
}

function tick() {
  if (!buffer) return
  const now = Date.now()
  const elapsed = Math.min(now - lastTick, MAX_TICK_MS)
  lastTick = now
  if (document.visibilityState !== 'visible' || elapsed <= 0) return

  const today = dayKey()
  if (today !== buffer.day) { rollOver(today); return }

  buffer.hours[new Date().getHours()] += elapsed
  buffer.totalMs += elapsed
  writeStored(buffer)
  scheduleFlush()
  notify()
}

function onVisibility() {
  if (document.visibilityState === 'hidden') {
    hiddenSince = Date.now()
    flushNow()
    return
  }
  // Back on screen — restart the clock so the hidden stretch is never credited.
  lastTick = Date.now()
  const today = dayKey()
  if (buffer && today !== buffer.day) {
    rollOver(today)
  } else if (buffer && hiddenSince && Date.now() - hiddenSince > NEW_VISIT_GAP_MS) {
    buffer.visits += 1
    writeStored(buffer)
    scheduleFlush()
    notify()
  }
  hiddenSince = 0
}

/**
 * Begin tracking. Safe to call more than once — StrictMode double-invokes
 * effects in development, and a second tracker would double-count every hour.
 */
export function startUsageTracking() {
  if (started || typeof window === 'undefined') return
  started = true

  const dev = detectDevice()
  const today = dayKey()
  const stored = readStored()

  // A buffer left over from an earlier day (or another device profile in the
  // same browser) may hold minutes that were never flushed — bank it first.
  if (stored && (stored.day !== today || stored.device !== dev)) push(stored)

  buffer = stored && stored.day === today && stored.device === dev ? stored : emptyDay(today, dev)
  buffer.visits += 1
  writeStored(buffer)

  lastTick = Date.now()
  tickTimer = window.setInterval(tick, TICK_MS)
  document.addEventListener('visibilitychange', onVisibility)
  window.addEventListener('pagehide', flushNow)

  push(buffer)
  notify()
}

export function stopUsageTracking() {
  if (!started) return
  started = false
  clearInterval(tickTimer)
  document.removeEventListener('visibilitychange', onVisibility)
  window.removeEventListener('pagehide', flushNow)
  flushNow()
}

export function subscribeUsage(fn: () => void): () => void {
  listeners.add(fn)
  return () => { listeners.delete(fn) }
}

/** The live, not-yet-flushed buffer for this device's current day. */
export function localUsage(): UsageDay | null {
  return buffer ? clone(buffer) : null
}

// ── Reading ──────────────────────────────────────────────────────────────

/** Rows for the last `days` calendar days, with the live local buffer merged in. */
export async function loadUsage(days: number): Promise<UsageDay[]> {
  const from = new Date()
  from.setHours(0, 0, 0, 0)
  from.setDate(from.getDate() - (days - 1))
  const fromKey = dayKey(from)

  let rows: UsageDay[] = []
  const { data, error } = await supabase.from('usage_days').select('*').gte('day', fromKey)
  if (error) {
    console.error('Usage load error:', error)
  } else {
    rows = (data ?? []).map(r => ({
      day: String(r.day).slice(0, 10),
      device: r.device as DeviceKind,
      hours: normalizeHours(r.hours),
      totalMs: Number(r.total_ms) || 0,
      visits: Number(r.visits) || 0,
    }))
  }

  // The local buffer is always fresher than whatever was last flushed.
  const local = buffer
  if (local && local.day >= fromKey) {
    const i = rows.findIndex(r => r.day === local.day && r.device === local.device)
    if (i >= 0) rows[i] = clone(local)
    else rows.push(clone(local))
  }
  return rows
}

export interface UsageSummary {
  /** Active ms per hour of day, summed across every device and day in range. */
  byHour: number[]
  /** Devices that saw any time, biggest first. */
  byDevice: { device: DeviceKind; ms: number }[]
  totalMs: number
  visits: number
  /** Hour with the most time, or `null` when there is no data yet. */
  peakHour: number | null
}

export function aggregateUsage(rows: UsageDay[]): UsageSummary {
  const byHour = Array(24).fill(0)
  const perDevice = new Map<DeviceKind, number>()
  let totalMs = 0
  let visits = 0

  for (const row of rows) {
    for (let h = 0; h < 24; h++) byHour[h] += row.hours[h] ?? 0
    perDevice.set(row.device, (perDevice.get(row.device) ?? 0) + row.totalMs)
    totalMs += row.totalMs
    visits += row.visits
  }

  const byDevice = Array.from(perDevice.entries())
    .filter(([, ms]) => ms > 0)
    .map(([d, ms]) => ({ device: d, ms }))
    .sort((a, b) => b.ms - a.ms)

  const peak = byHour.reduce((best, ms, h) => (ms > byHour[best] ? h : best), 0)

  return { byHour, byDevice, totalMs, visits, peakHour: byHour[peak] > 0 ? peak : null }
}

/**
 * Usage for the last `days` days. Re-reads on range change and follows the
 * local buffer live, so the bar for the current hour grows while you watch it.
 */
export function useUsage(days: number) {
  const [rows, setRows] = useState<UsageDay[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    let alive = true
    setLoading(true)
    loadUsage(days).then(r => {
      if (!alive) return
      setRows(r)
      setLoading(false)
    })

    // Patch just the local row on every tick instead of re-querying Supabase.
    const unsubscribe = subscribeUsage(() => {
      const local = localUsage()
      if (!alive || !local) return
      setRows(prev => {
        const i = prev.findIndex(r => r.day === local.day && r.device === local.device)
        if (i < 0) return [...prev, local]
        const next = [...prev]
        next[i] = local
        return next
      })
    })

    return () => { alive = false; unsubscribe() }
  }, [days])

  return { rows, loading }
}
