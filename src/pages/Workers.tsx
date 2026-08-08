import { useMemo, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { Plus, X, TrendingUp, Flame, Pencil } from 'lucide-react'
import { useStore } from '@/store'
import { rubToUsd, usdToUah, fmtUsd, fmtUah } from '@/types'
import { useT } from '@/i18n'

const WORKER_EMOJIS = ['👤', '👩', '🧑', '👑', '🔥', '⚡', '💫', '🎯', '💎', '🦁']

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

  const handleAdd = async () => {
    if (!name.trim()) return
    const w = await addWorker(name.trim(), emoji)
    if (avatarUrl.trim()) await setWorkerAvatar(w.id, avatarUrl.trim())
    setName(''); setEmoji('👤'); setAvatarUrl(''); setShowAdd(false)
    navigate(`/workers/${w.id}`)
  }

  const totalRub = workers.reduce((s, w) => s + w.totalProfit, 0)
  const totalUsd = rubToUsd(totalRub, rub2usd)
  const totalUah = usdToUah(totalUsd, usd2uah)

  // Streak: consecutive days with any profit ending today (or yesterday)
  const streak = useMemo(() => {
    const daySet = new Set(profits.map(p => p.createdAt.slice(0, 10)))
    const d = new Date()
    d.setHours(0, 0, 0, 0)
    if (!daySet.has(d.toISOString().slice(0, 10))) d.setDate(d.getDate() - 1)
    let count = 0
    while (daySet.has(d.toISOString().slice(0, 10))) {
      count++
      d.setDate(d.getDate() - 1)
    }
    return count
  }, [profits])

  // Today + aggregate session pace
  const todayRub = profits.filter(p => p.createdAt.startsWith(new Date().toISOString().slice(0, 10))).reduce((s, p) => s + p.myShare, 0)
  const sessionTotalMs = Object.values(workerTime).reduce((s, x) => s + x, 0)
  const sessionEarnRub = workers.reduce((s, w) => {
    const base = workerBaseline[w.id]
    return s + (base !== undefined ? Math.max(0, w.totalProfit - base) : 0)
  }, 0)
  const pace = sessionTotalMs > 0 ? rubToUsd(sessionEarnRub, rub2usd) / (sessionTotalMs / 3600000) : 0

  return (
    <div className="px-4 pt-6 pb-28 md:pb-8 md:px-8 relative">
      {/* ── Hero — jelly / gradient-glow treatment ───────────────────── */}
      <div className="relative mb-8 text-center">
        {/* Glowing blobs behind the title */}
        <div
          className="absolute left-1/2 top-0 h-72 w-[92%] -translate-x-1/2 opacity-70 pointer-events-none"
          style={{
            background: 'radial-gradient(50% 55% at 50% 20%, rgba(139,125,204,0.45) 0%, rgba(124,111,208,0.15) 45%, transparent 75%)',
            filter: 'blur(38px)',
            transform: 'translateX(-50%) rotate(-6deg)',
          }}
        />
        <div
          className="absolute right-[-6%] top-4 h-40 w-40 rounded-full pointer-events-none opacity-60"
          style={{ background: 'radial-gradient(circle, rgba(90,200,250,0.30) 0%, transparent 70%)', filter: 'blur(28px)' }}
        />
        <div
          className="absolute left-[-6%] top-20 h-40 w-40 rounded-full pointer-events-none opacity-50"
          style={{ background: 'radial-gradient(circle, rgba(232,192,106,0.22) 0%, transparent 70%)', filter: 'blur(30px)' }}
        />

        <div className="relative">
          <h1
            className="mx-auto mb-3 max-w-3xl bg-clip-text text-4xl font-bold tracking-tighter text-transparent md:text-5xl"
            style={{ backgroundImage: 'linear-gradient(to bottom, #E4DEFF 0%, #A596E8 45%, rgba(139,125,204,0.55) 100%)' }}
          >
            {t('workers_title')}
          </h1>
          <p className="mx-auto mb-6 max-w-md text-sm text-text-muted md:text-base">
            {t('workers_count')(workers.length)}
          </p>

          {/* Glass CTA with animated plus */}
          <button
            onClick={() => setShowAdd(true)}
            className="group mx-auto inline-flex items-center gap-2 rounded-xl border border-white/25 bg-white/[0.04] px-4 py-2.5 text-sm font-semibold text-white backdrop-blur-md transition-colors duration-200 hover:border-accent/50 hover:bg-white/[0.07]"
          >
            <span className="relative flex h-5 w-5 items-center justify-center overflow-hidden">
              <Plus className="absolute transition-all duration-500 group-hover:translate-x-4 group-hover:-translate-y-4" size={16} />
              <Plus className="absolute -translate-x-4 -translate-y-4 transition-all duration-500 group-hover:translate-x-0 group-hover:translate-y-0" size={16} />
            </span>
            {t('workers_new')}
          </button>
        </div>
      </div>

      {/* Streak banner */}
      {streak > 0 && (
        <div className="glass-light rounded-2xl px-4 py-3 mb-5 flex items-center gap-3" style={{ borderLeft: '2px solid rgba(255,160,0,0.5)' }}>
          <div className="w-9 h-9 rounded-xl flex items-center justify-center flex-shrink-0" style={{ background: 'rgba(255,160,0,0.12)' }}>
            <Flame size={18} style={{ color: '#ffa000' }} />
          </div>
          <div>
            <p className="text-sm font-bold text-white">{t('streak_row')(streak)}</p>
            <p className="text-[11px] text-text-muted">{t('streak_hint')}</p>
          </div>
        </div>
      )}

      {/* Total banner */}
      {totalRub > 0 && (
        <div className="card-gradient rounded-2xl p-5 mb-6 relative overflow-hidden">
          <div className="absolute -top-8 -right-8 w-36 h-36 rounded-full" style={{ background: 'radial-gradient(circle,rgba(139,125,204,0.12) 0%,transparent 70%)' }} />
          <div className="absolute -bottom-12 -left-8 w-40 h-40 rounded-full" style={{ background: 'radial-gradient(circle,rgba(124,111,208,0.08) 0%,transparent 70%)' }} />
          <div className="relative flex items-center justify-between">
            <div>
              <div className="flex items-center gap-2 mb-2">
                <div className="neon-dot neon-pulse" />
                <p className="text-[10px] font-semibold uppercase tracking-widest" style={{ color: 'rgba(139,125,204,0.7)' }}>{t('workers_total')}</p>
              </div>
              <p className="text-3xl font-bold text-white">{fmtUsd(totalUsd)}</p>
              <p className="text-sm mt-0.5" style={{ color: 'rgba(200,230,201,0.5)' }}>{fmtUah(totalUah)}</p>
            </div>
            <div className="w-12 h-12 rounded-2xl flex items-center justify-center" style={{ background: 'rgba(139,125,204,0.15)', border: '1px solid rgba(139,125,204,0.25)' }}>
              <TrendingUp size={22} style={{ color: '#8B7DCC' }} />
            </div>
          </div>
          <div className="flex flex-wrap gap-2 mt-4 relative">
            <div className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-semibold" style={{ background: 'rgba(139,125,204,0.12)', border: '1px solid rgba(139,125,204,0.2)', color: '#A596E8' }}>
              <TrendingUp size={12} />
              {t('today_label')(fmtUsd(rubToUsd(todayRub, rub2usd)))}
            </div>
            {pace > 0 && (
              <div className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-semibold" style={{ background: 'rgba(90,200,250,0.10)', border: '1px solid rgba(90,200,250,0.2)', color: '#8fd8ff' }}>
                ⚡ {t('per_hour')(fmtUsd(pace))}
              </div>
            )}
          </div>
        </div>
      )}

      {/* Workers grid */}
      {workers.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-24 gap-4">
          <div className="w-20 h-20 rounded-3xl glass-light flex items-center justify-center text-4xl">👥</div>
          <div className="text-center">
            <p className="text-text font-semibold">{t('workers_empty_title')}</p>
            <p className="text-text-muted text-sm mt-1">{t('workers_empty_hint')}</p>
          </div>
        </div>
      ) : (
        <div className="grid grid-cols-2 md:grid-cols-3 gap-3 stagger">
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
                  <Pencil size={12} style={{ color: '#8B7DCC' }} />
                </button>

                <button className="w-full text-left active:scale-95 transition-transform" onClick={() => navigate(`/workers/${worker.id}`)}>
                  {/* Avatar image or emoji header */}
                  {worker.avatarUrl ? (
                    <div className="relative h-24 overflow-hidden">
                      <img src={worker.avatarUrl} alt={worker.name}
                        className="w-full h-full object-cover"
                        style={{ filter: 'brightness(0.8) saturate(0.6)' }} />
                      <div className="absolute inset-0" style={{ background: 'linear-gradient(to top, rgba(13,13,17,0.92) 0%, transparent 60%)' }} />
                      {worker.totalProfit > 0 && <div className="absolute top-2 left-2 neon-dot neon-pulse" />}
                    </div>
                  ) : (
                    <div className="p-4 pb-0 flex items-start justify-between">
                      <div className="text-3xl">{worker.emoji}</div>
                      {worker.totalProfit > 0 && <div className="neon-dot neon-pulse" />}
                    </div>
                  )}
                  <div className="p-3 pt-2">
                    <p className="font-semibold text-text truncate text-sm">{worker.name}</p>
                    {worker.totalProfit > 0 ? (
                      <div className="mt-1">
                        <p className="text-sm font-bold" style={{ color: '#8B7DCC' }}>{fmtUsd(usd)}</p>
                        <p className="text-text-muted text-xs">{fmtUah(uah)}</p>
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

      {/* Edit avatar modal */}
      {editAvatarId && (
        <div className="fixed inset-0 z-50 flex items-end justify-center md:items-center" onClick={() => setEditAvatarId(null)}>
          <div className="absolute inset-0 bg-black/70 backdrop-blur-sm animate-fade-in" />
          <div className="relative w-full max-w-md sheet rounded-t-3xl md:rounded-3xl p-6 pb-10 md:pb-6 animate-pop" onClick={e => e.stopPropagation()}>
            <div className="w-10 h-1 bg-white/10 rounded-full mx-auto mb-5 md:hidden" />
            <div className="flex items-center justify-between mb-5">
              <h3 className="text-lg font-bold text-white">{t('avatar_title')}</h3>
              <button onClick={() => setEditAvatarId(null)} className="text-text-muted hover:text-text"><X size={18} /></button>
            </div>
            {editAvatarUrl && (
              <div className="w-20 h-20 rounded-2xl overflow-hidden mx-auto mb-4">
                <img src={editAvatarUrl} alt="" className="w-full h-full object-cover" style={{ filter: 'brightness(0.8) saturate(0.6)' }} />
              </div>
            )}
            <input type="url" value={editAvatarUrl} onChange={e => setEditAvatarUrl(e.target.value)}
              placeholder={t('avatar_url_placeholder')}
              className="w-full glass-light rounded-2xl px-4 py-3 text-text placeholder:text-text-muted focus:outline-none focus:border-accent/50 transition-colors mb-4 text-sm" />
            <button
              onClick={async () => { await setWorkerAvatar(editAvatarId, editAvatarUrl.trim()); setEditAvatarId(null) }}
              className="w-full btn-gradient rounded-2xl py-3.5 font-semibold shadow-glow">
              {t('save')}
            </button>
          </div>
        </div>
      )}

      {/* Add worker modal */}
      {showAdd && (
        <div className="fixed inset-0 z-50 flex items-end justify-center md:items-center" onClick={() => setShowAdd(false)}>
          <div className="absolute inset-0 bg-black/70 backdrop-blur-sm animate-fade-in" />
          <div className="relative w-full max-w-md sheet rounded-t-3xl md:rounded-3xl p-6 pb-10 md:pb-6 animate-pop" onClick={e => e.stopPropagation()}>
            <div className="w-10 h-1 bg-white/10 rounded-full mx-auto mb-5 md:hidden" />
            <div className="flex items-center justify-between mb-5">
              <h3 className="text-lg font-bold text-white">{t('workers_new')}</h3>
              <button onClick={() => setShowAdd(false)} className="text-text-muted hover:text-text">
                <X size={18} />
              </button>
            </div>
            <div className="flex flex-wrap gap-2 mb-4">
              {WORKER_EMOJIS.map(e => (
                <button key={e} onClick={() => setEmoji(e)}
                  className={`w-10 h-10 rounded-xl text-xl flex items-center justify-center transition-all ${emoji === e ? 'btn-gradient scale-110 shadow-glow-sm' : 'glass-light hover:border-accent/30'}`}>
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
              className="w-full glass-light rounded-2xl px-4 py-3 text-text placeholder:text-text-muted focus:outline-none focus:border-accent/50 transition-colors mb-4 text-sm" />
            <button onClick={handleAdd} disabled={!name.trim()}
              className="w-full btn-gradient rounded-2xl py-3.5 font-semibold disabled:opacity-40 shadow-glow">
              {t('workers_create')}
            </button>
          </div>
        </div>
      )}
    </div>
  )
}
