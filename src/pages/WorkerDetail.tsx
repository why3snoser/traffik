import { useParams, useNavigate } from 'react-router-dom'
import { ArrowLeft, Plus, TrendingUp, User, Trash2, Edit3, ChevronRight } from 'lucide-react'
import { useStore } from '@/store'
import { rubToUsd, usdToUah, fmtUsd, fmtUah } from '@/types'
import { useMemo, useState } from 'react'
import { useT } from '@/i18n'

function startOf(unit: 'week' | 'month') {
  const d = new Date()
  if (unit === 'week') { const day = d.getDay(); d.setDate(d.getDate() - (day === 0 ? 6 : day - 1)); d.setHours(0,0,0,0) }
  else { d.setDate(1); d.setHours(0,0,0,0) }
  return d
}

export default function WorkerDetail() {
  const { id } = useParams<{ id: string }>()
  const navigate = useNavigate()
  const t = useT()
  const { workers, anketas, profits, deleteWorker, profile } = useStore()
  const [tab, setTab] = useState<'anketas' | 'profits'>('anketas')
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
      const date = new Date(p.createdAt).toLocaleDateString('en-GB', { day: 'numeric', month: 'long' })
      if (!map.has(date)) map.set(date, [])
      map.get(date)!.push(p)
    })
    return Array.from(map.entries())
  }, [myProfits])

  const PROFIT_TYPE_LABELS: Record<string, string> = {
    oplata: t('type_oplata'),
    perevod: t('type_perevod'),
    iks: t('type_iks'),
    vozvrat: t('type_vozvrat'),
    vozvrat_yurist: t('type_vozvrat_yurist'),
  }

  return (
    <div className="pb-28">
      <div className="px-4 pt-6 mb-5">
        <div className="flex items-center gap-3 mb-5">
          <button onClick={() => navigate(-1)} className="w-9 h-9 rounded-xl bg-card border border-border flex items-center justify-center text-text-muted">
            <ArrowLeft size={18} />
          </button>
          <div className="flex-1" />
          <button onClick={() => navigate(`/workers/${id}/edit`)} className="w-9 h-9 rounded-xl bg-card border border-border flex items-center justify-center text-text-muted">
            <Edit3 size={16} />
          </button>
          <button onClick={handleDelete} className="w-9 h-9 rounded-xl bg-danger/10 border border-danger/20 flex items-center justify-center text-danger">
            <Trash2 size={16} />
          </button>
        </div>

        <div className="flex items-center gap-4 mb-5">
          <div className="w-16 h-16 rounded-2xl bg-card border border-border flex items-center justify-center text-3xl">{worker.emoji}</div>
          <div>
            <h1 className="text-2xl font-bold text-text">{worker.name}</h1>
            <p className="text-text-muted text-sm">{t('worker_anketas')(myAnketas.length)}</p>
          </div>
        </div>

        <div className="grid grid-cols-3 gap-2 mb-5">
          {[
            { label: t('stat_week'), rub: stats.week },
            { label: t('stat_month'), rub: stats.month },
            { label: t('stat_total'), rub: stats.total },
          ].map(({ label, rub }) => (
            <div key={label} className="bg-card border border-border rounded-xl p-3">
              <p className="text-text-muted text-[10px] mb-1">{label}</p>
              <p className="text-sm font-bold text-text">{fmtUsd(rubToUsd(rub, r2u))}</p>
              <p className="text-[10px] text-text-muted">{fmtUah(usdToUah(rubToUsd(rub, r2u), u2ua))}</p>
            </div>
          ))}
        </div>

        <button onClick={() => navigate(`/workers/${id}/profit/new`)}
          className="w-full bg-accent rounded-2xl py-3.5 text-white font-semibold flex items-center justify-center gap-2 mb-1 active:scale-[0.98] transition-transform shadow-glow">
          <TrendingUp size={18} />
          {t('add_profit_btn')}
        </button>
      </div>

      <div className="flex gap-1 px-4 mb-4">
        {(['anketas', 'profits'] as const).map(tab_key => (
          <button key={tab_key} onClick={() => setTab(tab_key)}
            className={`flex-1 py-2.5 rounded-xl text-sm font-semibold transition-all ${tab === tab_key ? 'bg-accent text-white' : 'bg-card text-text-muted'}`}>
            {tab_key === 'anketas' ? t('tab_profiles')(myAnketas.length) : t('tab_profits')(myProfits.length)}
          </button>
        ))}
      </div>

      <div className="px-4">
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
              <div className="flex flex-col gap-2">
                {myAnketas.map(anketa => (
                  <button key={anketa.id} onClick={() => navigate(`/anketas/${anketa.id}`)}
                    className="bg-card border border-border rounded-2xl p-4 text-left active:scale-[0.98] transition-transform flex items-center gap-3">
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
                    <span className="text-xs text-success font-medium">
                      +{fmtUsd(rubToUsd(entries.reduce((s, e) => s + e.myShare, 0), r2u))}
                    </span>
                  </div>
                  <div className="flex flex-col gap-2">
                    {entries.map(entry => (
                      <div key={entry.id} className="bg-card border border-border rounded-2xl px-4 py-3">
                        <div className="flex items-baseline justify-between">
                          <span className="text-xs text-text-muted">{PROFIT_TYPE_LABELS[entry.type]}</span>
                          <span className="text-success font-bold">{fmtUsd(rubToUsd(entry.myShare, r2u))}</span>
                        </div>
                        <div className="flex items-baseline gap-1 mt-0.5">
                          <span className="text-text-muted text-xs">{fmtUah(usdToUah(rubToUsd(entry.myShare, r2u), u2ua))}</span>
                          <span className="text-text-muted text-xs">· {t('profit_entry')(entry.amount.toLocaleString('en-US') + ' ₽')}</span>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              ))}
            </div>
          )
        )}
      </div>
    </div>
  )
}
