import { useParams, useNavigate } from 'react-router-dom'
import { ArrowLeft, Plus, TrendingUp, User, Trash2, Edit3, ChevronRight } from 'lucide-react'
import { useStore } from '@/store'
import { rubToUsd, usdToUah, fmtUsd, fmtUah } from '@/types'
import { useMemo, useState } from 'react'
import { INTL_LOCALE, useLang, useProfitLabels, useT } from '@/i18n'
import WorkerTimer from '@/components/WorkerTimer'
import { WorkerProfitCard } from '@/components/WorkerProfitCard'
import { BottomSheet } from '@/components/BottomSheet'
import { WORKER_EMOJIS } from '@/lib/emoji'
import { startOf } from '@/lib/dates'

export default function WorkerDetail() {
  const { id } = useParams<{ id: string }>()
  const navigate = useNavigate()
  const t = useT()
  const locale = INTL_LOCALE[useLang()]
  const profitLabels = useProfitLabels()
  const { workers, anketas, profits, deleteWorker, updateWorker, setWorkerAvatar, profile } = useStore()
  const [tab, setTab] = useState<'anketas' | 'profits'>('anketas')
  /* Declared above the `if (!worker)` early return below. That return already
     sits ahead of this file's useMemo calls, so any hook added underneath it
     would widen an existing hook-order violation. */
  const [editOpen, setEditOpen] = useState(false)
  const [editName, setEditName] = useState('')
  const [editEmoji, setEditEmoji] = useState('👤')
  const [editAvatar, setEditAvatar] = useState('')
  const { rubToUsd: r2u, usdToUah: u2ua } = profile.settings

  const worker = workers.find(w => w.id === id)
  if (!worker) return <div className="p-8 text-text-muted">{t('not_found')}</div>

  const myAnketas = anketas.filter(a => a.workerId === id)
  const myProfits = profits.filter(p => p.workerId === id)

  const stats = useMemo(() => {
    const weekStart = startOf('week').getTime()
    const monthStart = startOf('month').getTime()
    return {
      week: myProfits.filter(p => new Date(p.createdAt).getTime() >= weekStart).reduce((s, p) => s + p.myShare, 0),
      month: myProfits.filter(p => new Date(p.createdAt).getTime() >= monthStart).reduce((s, p) => s + p.myShare, 0),
      total: worker.totalProfit,
    }
  }, [myProfits, worker])

  const handleDelete = () => {
    if (confirm(t('worker_delete_confirm')(worker.name))) {
      deleteWorker(worker.id)
      navigate('/')
    }
  }

  const grouped = useMemo(() => {
    const map = new Map<string, typeof myProfits>()
    myProfits.forEach(p => {
      const date = new Date(p.createdAt).toLocaleDateString(locale, { day: 'numeric', month: 'long' })
      if (!map.has(date)) map.set(date, [])
      map.get(date)!.push(p)
    })
    return Array.from(map.entries())
  }, [myProfits, locale])

  return (
    <div className="pb-28 md:pb-8 w-full max-w-3xl mx-auto md:px-8">
      <div className="px-4 md:px-0 pt-6 mb-5">
        <div className="flex items-center gap-3 mb-5">
          <button onClick={() => navigate(-1)} className="w-9 h-9 rounded-xl bg-card border border-border flex items-center justify-center text-text-muted hover:text-text hover:border-white/15">
            <ArrowLeft size={18} />
          </button>
          <div className="flex-1" />
          <button
            onClick={() => {
              setEditName(worker.name)
              setEditEmoji(worker.emoji)
              setEditAvatar(profile.workerAvatars?.[worker.id] ?? '')
              setEditOpen(true)
            }}
            className="w-9 h-9 rounded-xl bg-card border border-border flex items-center justify-center text-text-muted hover:text-text hover:border-white/15">
            <Edit3 size={16} />
          </button>
          <button onClick={handleDelete} className="w-9 h-9 rounded-xl bg-danger/10 border border-danger/20 flex items-center justify-center text-danger">
            <Trash2 size={16} />
          </button>
        </div>

        {/* `min-w-0` is load-bearing: a flex item defaults to `min-width: auto`,
            which floors it at the name's min-content width, so a long unbroken
            name (a pasted @handle) pushed past the viewport edge and was silently
            clipped by `#root { overflow-x: clip }`. This is the worker's own page,
            so the name wraps rather than truncating — there is vertical room. */}
        <div className="flex items-center gap-4 mb-5">
          <div className="w-16 h-16 flex-shrink-0 rounded-2xl bg-card border border-border flex items-center justify-center text-3xl">{worker.emoji}</div>
          <div className="min-w-0 flex-1">
            <h1 className="text-2xl font-bold text-text break-words tracking-tight">{worker.name}</h1>
            <p className="text-text-muted text-sm">{t('worker_anketas')(myAnketas.length)}</p>
          </div>
        </div>

        <div className="grid grid-cols-3 gap-2 mb-5">
          {[
            { label: t('stat_week'), rub: stats.week },
            { label: t('stat_month'), rub: stats.month },
            { label: t('stat_total'), rub: stats.total },
          ].map(({ label, rub }) => (
            <div key={label} className="glass-light rounded-xl p-3">
              <p className="text-text-muted text-[10px] uppercase tracking-widest mb-1">{label}</p>
              <p className="text-sm font-bold text-text tabular-nums">{fmtUsd(rubToUsd(rub, r2u))}</p>
              <p className="text-[10px] text-text-muted tabular-nums">{fmtUah(usdToUah(rubToUsd(rub, r2u), u2ua))}</p>
            </div>
          ))}
        </div>

        {/* Per-worker session timer */}
        <WorkerTimer workerId={id!} />

        <button onClick={() => navigate(`/workers/${id}/profit/new`)}
          className="w-full btn-gradient rounded-2xl py-3.5 font-semibold flex items-center justify-center gap-2 mb-1 active:scale-[0.98] transition-transform">
          <TrendingUp size={18} />
          {t('add_profit_btn')}
        </button>
      </div>

      <div className="flex gap-1 px-4 md:px-0 mb-4 p-1 rounded-2xl" style={{ background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.05)' }}>
        {(['anketas', 'profits'] as const).map(tab_key => (
          <button key={tab_key} onClick={() => setTab(tab_key)}
            className={`flex-1 py-2.5 rounded-xl text-sm font-semibold transition-all ${tab === tab_key ? 'btn-gradient' : 'text-text-muted hover:text-text'}`}>
            {tab_key === 'anketas' ? t('tab_profiles')(myAnketas.length) : t('tab_profits')(myProfits.length)}
          </button>
        ))}
      </div>

      <div className="px-4 md:px-0">
        {tab === 'anketas' && (
          <>
            <button onClick={() => navigate(`/workers/${id}/anketas/new`)}
              className="w-full flex items-center justify-center gap-2 border border-dashed border-border rounded-2xl py-3 text-text-muted text-sm hover:border-accent hover:text-accent transition-colors mb-3">
              <Plus size={16} />
              {t('new_profile')}
            </button>
            {myAnketas.length === 0 ? (
              <div className="flex flex-col items-center justify-center py-12 gap-3">
                <User size={32} className="text-text-muted" />
                <p className="text-text-muted text-sm">{t('no_profiles')}</p>
              </div>
            ) : (
              <div className="flex flex-col gap-2 stagger">
                {myAnketas.map(anketa => (
                  <button key={anketa.id} onClick={() => navigate(`/anketas/${anketa.id}`)}
                    className="glass-light rounded-2xl p-4 text-left active:scale-[0.98] transition-transform flex items-center gap-3 neon-hover">
                    <div className="w-10 h-10 rounded-xl bg-accent-glow border border-accent/20 flex items-center justify-center flex-shrink-0">
                      <span className="text-base font-bold gradient-text">{anketa.name.charAt(0)}</span>
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="font-semibold text-text">{anketa.name}{anketa.age ? `, ${anketa.age}` : ''}</p>
                      <p className="text-text-muted text-xs mt-0.5">
                        {t('cities_count')(anketa.cities.length)}
                        {anketa.telegram && ` · ${anketa.telegram}`}
                      </p>
                    </div>
                    <ChevronRight size={16} className="text-text-muted" />
                  </button>
                ))}
              </div>
            )}
          </>
        )}

        {tab === 'profits' && (
          grouped.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-12 gap-3">
              <TrendingUp size={32} className="text-text-muted" />
              <p className="text-text-muted text-sm">{t('no_profits')}</p>
            </div>
          ) : (
            <div className="flex flex-col gap-4">
              {grouped.map(([date, entries]) => (
                <div key={date}>
                  <div className="flex items-center gap-2 mb-2 px-1">
                    <span className="text-xs text-text-muted font-medium">{date}</span>
                    <div className="flex-1 h-px bg-border" />
                    <span className="text-xs text-success font-medium tabular-nums">
                      +{fmtUsd(rubToUsd(entries.reduce((s, e) => s + e.myShare, 0), r2u))}
                    </span>
                  </div>
                  <div className="flex flex-col gap-2.5">
                    {entries.map(entry => (
                      <WorkerProfitCard
                        key={entry.id}
                        worker={worker}
                        entry={entry}
                        label={profitLabels[entry.type]}
                        r2u={r2u}
                        u2ua={u2ua}
                      />
                    ))}
                  </div>
                </div>
              ))}
            </div>
          )
        )}
      </div>

      {/* Edit worker sheet. The pencil used to navigate to /workers/:id/edit,
          which App.tsx mapped to the workers *list* — so it silently threw the
          user back to the grid. That route is gone; this edits in place. */}
      <BottomSheet
        open={editOpen}
        onClose={() => setEditOpen(false)}
        title={t('form_edit_profile')}
        maxWidth="md"
        centerOnDesktop
        footer={
          <button
            onClick={async () => {
              if (!editName.trim()) return
              await updateWorker(worker.id, { name: editName.trim(), emoji: editEmoji })
              await setWorkerAvatar(worker.id, editAvatar.trim())
              setEditOpen(false)
            }}
            disabled={!editName.trim()}
            className="w-full btn-gradient rounded-2xl py-3.5 font-semibold disabled:opacity-40 shadow-glow">
            {t('save')}
          </button>
        }
      >
        {/* Grid, not wrap — ten 40px pills overflow a 360px sheet. */}
        <div className="grid grid-cols-5 gap-2 mb-4">
          {WORKER_EMOJIS.map(e => (
            <button key={e} onClick={() => setEditEmoji(e)}
              className={`h-11 rounded-xl text-xl flex items-center justify-center transition-all ${editEmoji === e ? 'btn-gradient scale-105 shadow-glow-sm' : 'glass-light hover:border-accent/30'}`}>
              {e}
            </button>
          ))}
        </div>
        <input type="text" value={editName} onChange={e => setEditName(e.target.value)}
          placeholder={t('workers_name_placeholder')}
          className="w-full glass-light rounded-2xl px-4 py-3 text-text placeholder:text-text-muted focus:outline-none focus:border-accent/50 transition-colors mb-3" />
        <input type="url" value={editAvatar} onChange={e => setEditAvatar(e.target.value)}
          placeholder={t('avatar_optional_placeholder')}
          className="w-full glass-light rounded-2xl px-4 py-3 text-text placeholder:text-text-muted focus:outline-none focus:border-accent/50 transition-colors text-sm" />
      </BottomSheet>
    </div>
  )
}