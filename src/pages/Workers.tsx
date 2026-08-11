import { useMemo, useRef, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { Plus, TrendingUp, Flame, Pencil, Zap, Users } from 'lucide-react'
import { useStore } from '@/store'
import { BottomSheet } from '@/components/BottomSheet'
import { rubToUsd, usdToUah, fmtUsd, fmtUah } from '@/types'
import { useT } from '@/i18n'
import { WORKER_EMOJIS } from '@/lib/emoji'
import { startOf, localDayKey } from '@/lib/dates'

export default function Workers() {
  const { workers, addWorker, setWorkerAvatar, profile, profits, workerTime, workerBaseline } = useStore()
  const navigate = useNavigate()
  const t = useT()
  const [showAdd, setShowAdd] = useState(false)
  const [name, setName] = useState('')
  const [emoji, setEmoji] = useState('👤')
  const [avatarUrl, setAvatarUrl] = useState('')
  const [editAvatarId, setEditAvatarId] = useState<string | null>(null)
  const [editAvatarUrl, setEditAvatarUrl] = useState('')
  const { rubToUsd: rub2usd, usdToUah: usd2uah } = profile.settings

  /* `addWorker` optimistically sets local state and *then* awaits a Supabase
     insert, so on a slow phone the sheet stays open for seconds with the button
     still enabled. The ref is what actually blocks re-entry — it flips in the
     same tick, before React has re-rendered — and covers the Enter-key path too.
     The state exists only to drive the disabled styling. */
  const savingRef = useRef(false)
  const [saving, setSaving] = useState(false)

  const handleAdd = async () => {
    if (!name.trim() || savingRef.current) return
    savingRef.current = true
    setSaving(true)
    try {
      const w = await addWorker(name.trim(), emoji)
      if (avatarUrl.trim()) await setWorkerAvatar(w.id, avatarUrl.trim())
      setName(''); setEmoji('👤'); setAvatarUrl(''); setShowAdd(false)
      navigate(`/workers/${w.id}`)
    } finally {
      savingRef.current = false
      setSaving(false)
    }
  }

  const totalRub = workers.reduce((s, w) => s + w.totalProfit, 0)
  const totalUsd = rubToUsd(totalRub, rub2usd)
  const totalUah = usdToUah(totalUsd, usd2uah)

  // Streak: consecutive days with any profit ending today (or yesterday).
  // Keyed on the *local* day — `toISOString()` shifts to UTC, which named the
  // previous day east of Greenwich and dropped a day off the count.
  const streak = useMemo(() => {
    const daySet = new Set(profits.map(p => localDayKey(new Date(p.createdAt))))
    const d = new Date()
    d.setHours(0, 0, 0, 0)
    if (!daySet.has(localDayKey(d))) d.setDate(d.getDate() - 1)
    let count = 0
    while (daySet.has(localDayKey(d))) {
      count++
      d.setDate(d.getDate() - 1)
    }
    return count
  }, [profits])

  // Today + aggregate session pace
  const todayStart = startOf('day').getTime()
  const todayRub = profits.filter(p => new Date(p.createdAt).getTime() >= todayStart).reduce((s, p) => s + p.myShare, 0)
  const sessionTotalMs = Object.values(workerTime).reduce((s, x) => s + x, 0)
  const sessionEarnRub = workers.reduce((s, w) => {
    const base = workerBaseline[w.id]
    return s + (base !== undefined ? Math.max(0, w.totalProfit - base) : 0)
  }, 0)
  const pace = sessionTotalMs > 0 ? rubToUsd(sessionEarnRub, rub2usd) / (sessionTotalMs / 3600000) : 0

  return (
    <div className="px-4 pt-6 pb-28 md:pb-8 md:px-8 relative w-full max-w-6xl mx-auto">
      {/* ── Header row — title left, primary action right ─────────────── */}
      <div className="flex items-center justify-between gap-3 mb-5">
        <div className="min-w-0">
          <h1 className="text-2xl font-bold text-text tracking-tight">{t('workers_title')}</h1>
          <p className="text-text-muted text-sm mt-0.5">{t('workers_count')(workers.length)}</p>
        </div>
        <button
          onClick={() => setShowAdd(true)}
          className="group inline-flex flex-shrink-0 items-center gap-2 rounded-xl btn-gradient px-4 py-2.5 text-sm font-semibold"
        >
          <span className="relative flex h-4 w-4 items-center justify-center overflow-hidden">
            <Plus className="absolute transition-all duration-500 group-hover:translate-x-4 group-hover:-translate-y-4" size={15} />
            <Plus className="absolute -translate-x-4 -translate-y-4 transition-all duration-500 group-hover:translate-x-0 group-hover:translate-y-0" size={15} />
          </span>
          {t('workers_new')}
        </button>
      </div>

      {/* ── Overview strip — dense stat cards ─────────────────────────── */}
      {(totalRub > 0 || streak > 0) && (
        <div className="grid grid-cols-2 md:grid-cols-4 gap-3 mb-6 stagger">
          {/* Total */}
          <div className="glass-light rounded-2xl p-4 relative overflow-hidden">
            <div className="flex items-center gap-1.5 mb-1.5">
              <div className="neon-dot neon-pulse" />
              <p className="text-[10px] font-semibold uppercase tracking-widest text-text-muted">{t('workers_total')}</p>
            </div>
            <p className="text-xl font-bold text-white tabular-nums">{fmtUsd(totalUsd)}</p>
            <p className="text-[11px] text-text-muted mt-0.5 tabular-nums">{fmtUah(totalUah)}</p>
          </div>

          {/* Today */}
          <div className="glass-light rounded-2xl p-4">
            <div className="flex items-center gap-1.5 mb-1.5">
              <TrendingUp size={11} className="text-accent-light" />
              <p className="text-[10px] font-semibold uppercase tracking-widest text-text-muted">{t('stats_today')}</p>
            </div>
            <p className="text-xl font-bold tabular-nums" style={{ color: '#DCC2F2' }}>{fmtUsd(rubToUsd(todayRub, rub2usd))}</p>
            <p className="text-[11px] text-text-muted mt-0.5 tabular-nums">{fmtUah(usdToUah(rubToUsd(todayRub, rub2usd), usd2uah))}</p>
          </div>

          {/* Streak */}
          <div className="glass-light rounded-2xl p-4">
            <div className="flex items-center gap-1.5 mb-1.5">
              <Flame size={11} style={{ color: '#E5A860' }} />
              <p className="text-[10px] font-semibold uppercase tracking-widest text-text-muted">{t('stats_activity')}</p>
            </div>
            {streak > 0 ? (
              <>
                <p className="text-xl font-bold text-white tabular-nums">{t('days_count')(streak)}</p>
                <p className="text-[11px] text-text-muted mt-0.5">{t('streak_hint')}</p>
              </>
            ) : (
              <p className="text-sm text-text-muted mt-1">—</p>
            )}
          </div>

          {/* Pace */}
          <div className="glass-light rounded-2xl p-4">
            <div className="flex items-center gap-1.5 mb-1.5">
              <Zap size={11} className="text-accent-light" />
              <p className="text-[10px] font-semibold uppercase tracking-widest text-text-muted">{t('stats_time_money')}</p>
            </div>
            {pace > 0 ? (
              <p className="text-xl font-bold text-white tabular-nums">{t('per_hour')(fmtUsd(pace))}</p>
            ) : (
              <p className="text-sm text-text-muted mt-1">—</p>
            )}
          </div>
        </div>
      )}

      {/* Workers grid */}
      {workers.length === 0 ? (
        <div className="glass-light rounded-2xl flex flex-col items-center justify-center py-20 gap-4">
          <div className="w-16 h-16 rounded-2xl flex items-center justify-center" style={{ background: 'rgba(192,159,230,0.10)', border: '1px solid rgba(192,159,230,0.2)' }}>
            <Users size={26} className="text-accent-light" />
          </div>
          <div className="text-center">
            <p className="text-text font-semibold">{t('workers_empty_title')}</p>
            <p className="text-text-muted text-sm mt-1">{t('workers_empty_hint')}</p>
          </div>
        </div>
      ) : (
        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-3 stagger">
          {workers.map((worker) => {
            const usd = rubToUsd(worker.totalProfit, rub2usd)
            const uah = usdToUah(usd, usd2uah)
            return (
              <div key={worker.id} className="glass-light rounded-2xl overflow-hidden transition-all duration-200 neon-hover group relative">
                {/* Edit avatar — visible by default on touch, where there is
                    no hover to reveal it with. */}
                <button
                  onClick={e => { e.stopPropagation(); setEditAvatarId(worker.id); setEditAvatarUrl(worker.avatarUrl ?? '') }}
                  className="absolute top-2 right-2 z-10 w-8 h-8 md:w-6 md:h-6 rounded-lg flex items-center justify-center opacity-100 md:opacity-0 md:group-hover:opacity-100 transition-opacity"
                  style={{ background: 'rgba(0,0,0,0.6)', backdropFilter: 'blur(4px)' }}>
                  <Pencil size={12} style={{ color: '#C09FE6' }} />
                </button>

                <button className="w-full text-left active:scale-95 transition-transform" onClick={() => navigate(`/workers/${worker.id}`)}>
                  {/* Avatar image or emoji header */}
                  {worker.avatarUrl ? (
                    <div className="relative h-24 overflow-hidden">
                      <img src={worker.avatarUrl} alt={worker.name}
                        className="w-full h-full object-cover"
                        style={{ filter: 'brightness(0.8) saturate(0.6)' }} />
                      <div className="absolute inset-0" style={{ background: 'linear-gradient(to top, rgba(10,10,13,0.92) 0%, transparent 60%)' }} />
                      {worker.totalProfit > 0 && <div className="absolute top-2 left-2 neon-dot neon-pulse" />}
                    </div>
                  ) : (
                    /* `pr-11` (44px) clears the 40px-wide edit button box above.
                       Without it the "has revenue" dot landed at 16px from the
                       right — entirely underneath that opaque button. */
                    <div className="p-4 pb-0 pr-11 flex items-start justify-between">
                      <div className="text-3xl">{worker.emoji}</div>
                      {worker.totalProfit > 0 && <div className="neon-dot neon-pulse" />}
                    </div>
                  )}
                  <div className="p-3 pt-2">
                    <p className="font-semibold text-text truncate text-sm">{worker.name}</p>
                    {worker.totalProfit > 0 ? (
                      <div className="mt-1 flex items-baseline justify-between gap-2">
                        <p className="text-sm font-bold tabular-nums" style={{ color: '#DCC2F2' }}>{fmtUsd(usd)}</p>
                        <p className="text-text-muted text-[11px] tabular-nums truncate">{fmtUah(uah)}</p>
                      </div>
                    ) : (
                      <p className="text-text-muted text-xs mt-1">{t('workers_no_profits')}</p>
                    )}
                  </div>
                </button>
              </div>
            )
          })}
        </div>
      )}

      {/* Edit avatar sheet */}
      <BottomSheet
        open={editAvatarId !== null}
        onClose={() => setEditAvatarId(null)}
        title={t('avatar_title')}
        maxWidth="md"
        centerOnDesktop
        footer={
          <button
            onClick={async () => { if (editAvatarId) await setWorkerAvatar(editAvatarId, editAvatarUrl.trim()); setEditAvatarId(null) }}
            className="w-full btn-gradient rounded-2xl py-3.5 font-semibold shadow-glow">
            {t('save')}
          </button>
        }
      >
        {editAvatarUrl && (
          <div className="w-20 h-20 rounded-2xl overflow-hidden mx-auto mb-4">
            <img src={editAvatarUrl} alt="" className="w-full h-full object-cover" style={{ filter: 'brightness(0.8) saturate(0.6)' }} />
          </div>
        )}
        <input type="url" value={editAvatarUrl} onChange={e => setEditAvatarUrl(e.target.value)}
          placeholder={t('avatar_url_placeholder')}
          className="w-full glass-light rounded-2xl px-4 py-3 text-text placeholder:text-text-muted focus:outline-none focus:border-accent/50 transition-colors text-sm" />
      </BottomSheet>

      {/* Add worker sheet */}
      <BottomSheet
        open={showAdd}
        onClose={() => setShowAdd(false)}
        title={t('workers_new')}
        maxWidth="md"
        centerOnDesktop
        footer={
          <button onClick={handleAdd} disabled={!name.trim() || saving}
            className="w-full btn-gradient rounded-2xl py-3.5 font-semibold disabled:opacity-40 shadow-glow">
            {saving ? '…' : t('workers_create')}
          </button>
        }
      >
        {/* Grid, not wrap — ten 40px pills overflow a 360px sheet. */}
        <div className="grid grid-cols-5 gap-2 mb-4">
          {WORKER_EMOJIS.map(e => (
            <button key={e} onClick={() => setEmoji(e)}
              className={`h-11 rounded-xl text-xl flex items-center justify-center transition-all ${emoji === e ? 'btn-gradient scale-105 shadow-glow-sm' : 'glass-light hover:border-accent/30'}`}>
              {e}
            </button>
          ))}
        </div>
        <input autoFocus type="text" value={name} onChange={e => setName(e.target.value)}
          onKeyDown={e => e.key === 'Enter' && handleAdd()}
          placeholder={t('workers_name_placeholder')}
          className="w-full glass-light rounded-2xl px-4 py-3 text-text placeholder:text-text-muted focus:outline-none focus:border-accent/50 transition-colors mb-3" />
        <input type="url" value={avatarUrl} onChange={e => setAvatarUrl(e.target.value)}
          placeholder={t('avatar_optional_placeholder')}
          className="w-full glass-light rounded-2xl px-4 py-3 text-text placeholder:text-text-muted focus:outline-none focus:border-accent/50 transition-colors text-sm" />
      </BottomSheet>
    </div>
  )
}