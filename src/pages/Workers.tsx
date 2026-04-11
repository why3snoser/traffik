import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { Plus, X, TrendingUp } from 'lucide-react'
import { useStore } from '@/store'
import { rubToUsd, usdToUah, fmtUsd, fmtUah } from '@/types'
import { useT } from '@/i18n'

const WORKER_EMOJIS = ['👤', '👩', '🧑', '👑', '🔥', '⚡', '💫', '🎯', '💎', '🦁']

export default function Workers() {
  const { workers, addWorker, profile } = useStore()
  const navigate = useNavigate()
  const t = useT()
  const [showAdd, setShowAdd] = useState(false)
  const [name, setName] = useState('')
  const [emoji, setEmoji] = useState('👤')
  const { rubToUsd: rub2usd, usdToUah: usd2uah } = profile.settings

  const handleAdd = async () => {
    if (!name.trim()) return
    const w = await addWorker(name.trim(), emoji)
    setName(''); setEmoji('👤'); setShowAdd(false)
    navigate(`/workers/${w.id}`)
  }

  const totalRub = workers.reduce((s, w) => s + w.totalProfit, 0)
  const totalUsd = rubToUsd(totalRub, rub2usd)
  const totalUah = usdToUah(totalUsd, usd2uah)

  return (
    <div className="px-4 pt-6 pb-28 md:pb-8 md:px-8">
      {/* Header */}
      <div className="flex items-center justify-between mb-8">
        <div>
          <h1 className="text-2xl font-bold text-white">{t('workers_title')}</h1>
          <p className="text-text-muted text-sm mt-0.5">{t('workers_count')(workers.length)}</p>
        </div>
        <button onClick={() => setShowAdd(true)}
          className="btn-gradient w-10 h-10 rounded-xl flex items-center justify-center shadow-glow-sm active:scale-95 transition-transform">
          <Plus size={20} className="text-white" />
        </button>
      </div>

      {/* Total banner */}
      {totalRub > 0 && (
        <div className="card-gradient rounded-2xl p-5 mb-6 relative overflow-hidden">
          <div className="absolute -top-8 -right-8 w-32 h-32 rounded-full bg-white/10" />
          <div className="absolute -bottom-10 -left-6 w-36 h-36 rounded-full bg-black/10" />
          <div className="relative flex items-center justify-between">
            <div>
              <p className="text-white/70 text-xs font-medium uppercase tracking-widest mb-1">{t('workers_total')}</p>
              <p className="text-3xl font-bold text-white">{fmtUsd(totalUsd)}</p>
              <p className="text-white/60 text-sm mt-0.5">{fmtUah(totalUah)}</p>
            </div>
            <div className="w-12 h-12 rounded-2xl bg-white/15 flex items-center justify-center">
              <TrendingUp size={22} className="text-white" />
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
        <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
          {workers.map((worker) => {
            const usd = rubToUsd(worker.totalProfit, rub2usd)
            const uah = usdToUah(usd, usd2uah)
            return (
              <button key={worker.id} onClick={() => navigate(`/workers/${worker.id}`)}
                className="glass-light rounded-2xl p-4 text-left active:scale-95 transition-all duration-200 hover:border-accent/30 group">
                <div className="text-3xl mb-3">{worker.emoji}</div>
                <p className="font-semibold text-text truncate">{worker.name}</p>
                {worker.totalProfit > 0 ? (
                  <div className="mt-1.5">
                    <p className="text-sm font-bold gradient-text">{fmtUsd(usd)}</p>
                    <p className="text-text-muted text-xs">{fmtUah(uah)}</p>
                  </div>
                ) : (
                  <p className="text-text-muted text-xs mt-1.5">{t('workers_no_profits')}</p>
                )}
              </button>
            )
          })}
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
              className="w-full glass-light rounded-2xl px-4 py-3 text-text placeholder:text-text-muted focus:outline-none focus:border-accent/50 transition-colors mb-4" />
            <button onClick={handleAdd} disabled={!name.trim()}
              className="w-full btn-gradient rounded-2xl py-3.5 text-white font-semibold disabled:opacity-40 shadow-glow">
              {t('workers_create')}
            </button>
          </div>
        </div>
      )}
    </div>
  )
}
