/**
 * Local-calendar-day helpers.
 *
 * The app used to mix two different notions of "today": Finance measured from
 * local midnight, while Workers and Stats matched on `toISOString().slice(0,10)`
 * — a *UTC* calendar day. At UTC+3 those windows are three hours apart, so the
 * same figure under the same label disagreed between two screens. Everything
 * goes through here now.
 */

export function startOf(unit: 'day' | 'week' | 'month') {
  const d = new Date()
  if (unit === 'day') { d.setHours(0, 0, 0, 0); return d }
  if (unit === 'week') {
    const day = d.getDay()
    // Monday-first: Sunday (0) belongs to the week that started six days ago.
    d.setDate(d.getDate() - (day === 0 ? 6 : day - 1))
    d.setHours(0, 0, 0, 0)
    return d
  }
  d.setDate(1); d.setHours(0, 0, 0, 0); return d
}

/**
 * `YYYY-MM-DD` for the *local* calendar day, for the `startsWith` / Set-keyed
 * call sites. Deliberately not `toISOString().slice(0,10)`, which converts to
 * UTC first and so names the previous day for anyone east of Greenwich in the
 * early hours — that is what made streaks silently start a day back.
 */
export function localDayKey(d: Date = new Date()) {
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`
}
