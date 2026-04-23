import { useMemo, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { Plus, X, TrendingUp, Flame, Pencil } from 'lucide-react'
import { useStore } from '@/store'
import { rubToUsd, usdToUah, fmtUsd, fmtUah } from '@/types'
import { useT } from '@/i18n'

const WORKER_EMOJIS = ['👤', '👩', '🧑', '👑', '🔥', '⚡', '💫', '🎯', '💎', '🦁']

export default function Workers() {
  const { workers, addWorker, setWorkerAvatar, profile, profits } = useStore()
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

  return (
    <div className="px-4 pt-6 pb-28 md:pb-8 md:px-8">
      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-bold text-white">{t('workers_title')}</h1>
          <p className="text-text-muted text-sm mt-0.5">{t('workers_count')(workers.length)}</p>
        </div>
        <button onClick={() => setShowAdd(true)}
          className="btn-gradient w-10 h-10 rounded-xl flex items-center justify-center shadow-glow-sm active:scale-95 transition-transform">
          <Plus size={20} />
        </button>
      </div>

      {/* Streak banner */}
      {streak > 0 && (
        <div className="glass-light rounded-2xl px-4 py-3 mb-5 flex items-center gap-3" style={{ borderLeft: '2px solid rgba(255,160,0,0.5)' }}>
          <div className="w-9 h-9 rounded-xl flex items-center justify-center flex-shrink-0" style={{ background: 'rgba(255,160,0,0.12)' }}>
            <Flame size={18} style={{ color: '#ffa000' }} />
          </div>
          <div>
            <p className="text-sm font-bold text-white">{streak} {streak === 1 ? 'день' : streak < 5 ? 'дні' : 'днів'} поспіль 🔥</p>
            <p className="text-[11px] text-text-muted">Продовжуй — не втрачай серію!</p>
          </div>
        </div>
      )}

      {/* Total banner */}
      {totalRub > 0 && (
        <div className="card-gradient rounded-2xl p-5 mb-6 relative overflow-hidden">
          <div className="absolute -top-8 -right-8 w-36 h-36 rounded-full" style={{ background: 'radial-gradient(circle,rgba(0,230,118,0.12) 0%,transparent 70%)' }} />
          <div className="absolute -bottom-12 -left-8 w-40 h-40 rounded-full" style={{ background: 'radial-gradient(circle,rgba(0,150,60,0.08) 0%,transparent 70%)' }} />
          <div className="relative flex items-center justify-between">
            <div>
              <div className="flex items-center gap-2 mb-2">
                <div className="neon-dot neon-pulse" />
                <p className="text-[10px] font-semibold uppercase tracking-widest" style={{ color: 'rgba(0,230,118,0.7)' }}>{t('workers_total')}</p>
              </div>
              <p className="text-3xl font-bold text-white">{fmtUsd(totalUsd)}</p>
              <p className="text-sm mt-0.5" style={{ color: 'rgba(200,230,201,0.5)' }}>{fmtUah(totalUah)}</p>
            </div>
            <div className="w-12 h-12 rounded-2xl flex items-center justify-center" style={{ background: 'rgba(0,230,118,0.15)', border: '1px solid rgba(0,230,118,0.25)' }}>
              <TrendingUp size={22} style={{ color: '#00e676' }} />
            </div>
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
                {/* Edit avatar button */}
                <button
                  onClick={e => { e.stopPropagation(); setEditAvatarId(worker.id); setEditAvatarUrl(worker.avatarUrl ?? '') }}
                  className="absolute top-2 right-2 z-10 w-6 h-6 rounded-lg flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity"
                  style={{ background: 'rgba(0,0,0,0.6)', backdropFilter: 'blur(4px)' }}>
                  <Pencil size={11} style={{ color: '#00e676' }} />
                </button>

                <button className="w-full text-left active:scale-95 transition-transform" onClick={() => navigate(`/workers/${worker.id}`)}>
                  {/* Avatar image or emoji header */}
                  {worker.avatarUrl ? (
                    <div className="relative h-24 overflow-hidden">
                      <img src={worker.avatarUrl} alt={worker.name}
                        className="w-full h-full object-cover"
                        style={{ filter: 'brightness(0.8) saturate(0.6)' }} />
                      <div className="absolute inset-0" style={{ background: 'linear-gradient(to top, rgba(4,14,8,0.9) 0%, transparent 60%)' }} />
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
                        <p className="text-sm font-bold" style={{ color: '#00e676' }}>{fmtUsd(usd)}</p>
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
          <div className="absolute inset-0 bg-black/70 backdrop-blur-sm" />
          <div className="relative w-full max-w-md glass rounded-t-3xl md:rounded-3xl p-6 pb-10 md:pb-6 animate-slide-up" onClick={e => e.stopPropagation()}>
            <div className="w-10 h-1 bg-white/10 rounded-full mx-auto mb-5 md:hidden" />
            <div className="flex items-center justify-between mb-5">
              <h3 className="text-lg font-bold text-white">Аватар воркера</h3>
              <button onClick={() => setEditAvatarId(null)} className="text-text-muted hover:text-text"><X size={18} /></button>
            </div>
            {editAvatarUrl && (
              <div className="w-20 h-20 rounded-2xl overflow-hidden mx-auto mb-4">
                <img src={editAvatarUrl} alt="" className="w-full h-full object-cover" style={{ filter: 'brightness(0.8) saturate(0.6)' }} />
              </div>
            )}
            <input type="url" value={editAvatarUrl} onChange={e => setEditAvatarUrl(e.target.value)}
              placeholder="URL фото (imgbb.com, imgur та ін.)"
              className="w-full glass-light rounded-2xl px-4 py-3 text-text placeholder:text-text-muted focus:outline-none focus:border-accent/50 transition-colors mb-4 text-sm" />
            <button
              onClick={async () => { await setWorkerAvatar(editAvatarId, editAvatarUrl.trim()); setEditAvatarId(null) }}
              className="w-full btn-gradient rounded-2xl py-3.5 font-semibold shadow-glow">
              Зберегти
            </button>
          </div>
        </div>
      )}

      {/* Add worker modal */}
      {showAdd && (
        <div className="fixed inset-0 z-50 flex items-end justify-center md:items-center" onClick={() => setShowAdd(false)}>
          <div className="absolute inset-0 bg-black/70 backdrop-blur-sm" />
          <div className="relative w-full max-w-md glass rounded-t-3xl md:rounded-3xl p-6 pb-10 md:pb-6 animate-slide-up" onClick={e => e.stopPropagation()}>
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
              placeholder="Аватар (URL фото, необов'язково)"
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
