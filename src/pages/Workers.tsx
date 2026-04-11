import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { Plus, X } from 'lucide-react'
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
    <div className="px-4 pt-6 pb-28">
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-bold text-text">{t('workers_title')}</h1>
          <p className="text-text-muted text-sm mt-0.5">{t('workers_count')(workers.length)}</p>
        </div>
        <button onClick={() => setShowAdd(true)} className="w-10 h-10 rounded-xl bg-accent flex items-center justify-center shadow-glow-sm">
          <Plus size={20} className="text-white" />
        </button>
      </div>

      {totalRub > 0 && (
        <div className="bg-gradient-to-r from-accent/15 to-success/10 border border-accent/20 rounded-2xl p-4 mb-5">
          <p className="text-text-muted text-xs mb-1">{t('workers_total')}</p>
          <p className="text-2xl font-bold text-text">{fmtUsd(totalUsd)}</p>
          <p className="text-text-muted text-sm">{fmtUah(totalUah)}</p>
        </div>
      )}

      {workers.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-20 gap-4">
          <div className="w-20 h-20 rounded-3xl bg-card border border-border flex items-center justify-center text-4xl">👥</div>
          <div className="text-center">
            <p className="text-text font-semibold">{t('workers_empty_title')}</p>
            <p className="text-text-muted text-sm mt-1">{t('workers_empty_hint')}</p>
          </div>
        </div>
      ) : (
        <div className="grid grid-cols-2 gap-3">
          {workers.map((worker) => {
            const usd = rubToUsd(worker.totalProfit, rub2usd)
            const uah = usdToUah(usd, usd2uah)
            return (
              <button key={worker.id} onClick={() => navigate(`/workers/${worker.id}`)}
                className="bg-card border border-border rounded-2xl p-4 text-left active:scale-95 transition-transform">
                <div className="text-3xl mb-3">{worker.emoji}</div>
                <p className="font-semibold text-text truncate">{worker.name}</p>
                {worker.totalProfit > 0 ? (
                  <div className="mt-1">
                    <p className="text-success font-bold text-sm">{fmtUsd(usd)}</p>
                    <p className="text-text-muted text-xs">{fmtUah(uah)}</p>
                  </div>
                ) : (
                  <p className="text-text-muted text-xs mt-1">{t('workers_no_profits')}</p>
                )}
              </button>
            )
          })}
        </div>
      )}

      {showAdd && (
        <div className="fixed inset-0 z-50 flex items-end justify-center" onClick={() => setShowAdd(false)}>
          <div className="absolute inset-0 bg-black/60 backdrop-blur-sm" />
          <div className="relative w-full max-w-lg bg-surface rounded-t-3xl p-6 pb-10 animate-slide-up border-t border-border" onClick={e => e.stopPropagation()}>
            <div className="w-10 h-1 bg-border rounded-full mx-auto mb-5" />
            <div className="flex items-center justify-between mb-5">
              <h3 className="text-lg font-bold text-text">{t('workers_new')}</h3>
              <button onClick={() => setShowAdd(false)} className="text-text-muted"><X size={18} /></button>
            </div>
            <div className="flex flex-wrap gap-2 mb-4">
              {WORKER_EMOJIS.map(e => (
                <button key={e} onClick={() => setEmoji(e)}
                  className={`w-10 h-10 rounded-xl text-xl flex items-center justify-center transition-all ${emoji === e ? 'bg-accent-glow border border-accent/40 scale-110' : 'bg-card border border-border'}`}>
                  {e}
                </button>
              ))}
            </div>
            <input autoFocus type="text" value={name} onChange={e => setName(e.target.value)}
              onKeyDown={e => e.key === 'Enter' && handleAdd()}
              placeholder={t('workers_name_placeholder')}
              className="w-full bg-card border border-border rounded-2xl px-4 py-3 text-text placeholder:text-text-muted focus:outline-none focus:border-accent mb-4" />
            <button onClick={handleAdd} disabled={!name.trim()}
              className="w-full bg-accent rounded-2xl py-3.5 text-white font-semibold disabled:opacity-40">
              {t('workers_create')}
            </button>
          </div>
        </div>
      )}
    </div>
  )
}
