import { useMemo } from 'react'
import { motion } from 'framer-motion'
import { ChevronUp, ChevronDown, MoreHorizontal, TrendingUp, ArrowRight } from 'lucide-react'
import { useStore } from '@/store'
import { rubToUsd, usdToUah, fmtUsd, fmtUah } from '@/types'
import { useNavigate } from 'react-router-dom'
import { INTL_LOCALE, useLang, useT } from '@/i18n'
import { TransactionList } from '@/components/TransactionList'

function startOf(unit: 'day' | 'week' | 'month') {
  const d = new Date()
  if (unit === 'day') { d.setHours(0,0,0,0); return d }
  if (unit === 'week') { const day = d.getDay(); d.setDate(d.getDate() - (day === 0 ? 6 : day - 1)); d.setHours(0,0,0,0); return d }
  d.setDate(1); d.setHours(0,0,0,0); return d
}

const containerVariants = {
  hidden: { opacity: 0 },
  visible: { opacity: 1, transition: { staggerChildren: 0.08 } },
}

const itemVariants = {
  hidden: { y: 16, opacity: 0 },
  visible: { y: 0, opacity: 1, transition: { type: 'spring', stiffness: 120, damping: 18 } },
}

export default function Finance() {
  const { profits, workers, profile } = useStore()
  const navigate = useNavigate()
  const t = useT()
  const locale = INTL_LOCALE[useLang()]
  const { rubToUsd: r2u, usdToUah: u2ua } = profile.settings

  const stats = useMemo(() => {
    const dayStart = startOf('day').getTime()
    const weekStart = startOf('week').getTime()
    const monthStart = startOf('month').getTime()
    const toUsd = (rub: number) => rubToUsd(rub, r2u)
    return {
      today: toUsd(profits.filter(p => new Date(p.createdAt).getTime() >= dayStart).reduce((s, p) => s + p.myShare, 0)),
      week: toUsd(profits.filter(p => new Date(p.createdAt).getTime() >= weekStart).reduce((s, p) => s + p.myShare, 0)),
      month: toUsd(profits.filter(p => new Date(p.createdAt).getTime() >= monthStart).reduce((s, p) => s + p.myShare, 0)),
      total: toUsd(profits.reduce((s, p) => s + p.myShare, 0)),
    }
  }, [profits, r2u])

  // The list reads newest-first; `profits` order from the store is not guaranteed.
  const recent = useMemo(
    () => [...profits].sort((a, b) => b.createdAt.localeCompare(a.createdAt)),
    [profits],
  )

  const workerMap = useMemo(() =>
    new Map(workers.map(w => [w.id, w])), [workers])

  const activeWorkers = workers
    .filter(w => w.totalProfit > 0)
    .sort((a, b) => b.totalProfit - a.totalProfit)

  const workerProfitsCount = (workerId: string) =>
    profits.filter(p => p.workerId === workerId).length

  const isPositive = stats.today >= 0
  const asOf = new Date().toLocaleDateString(locale, { day: 'numeric', month: 'long', year: 'numeric' })

  return (
    <div className="px-4 pt-6 pb-28 md:pb-8 md:px-8 max-w-2xl">
      <motion.div variants={containerVariants} initial="hidden" animate="visible" className="space-y-6">
        {/* ── Header — portfolio gain ─────────────────────────────────── */}
        <motion.div variants={itemVariants} className="glass-light rounded-[22px] p-5 sm:p-6 relative overflow-hidden">
          <div className="absolute -right-10 -top-10 w-44 h-44 rounded-full pointer-events-none" style={{ background: 'radial-gradient(circle, rgba(139,125,204,0.25) 0%, transparent 65%)' }} />
          <div className="absolute right-4 -bottom-8 w-36 h-36 rounded-full pointer-events-none" style={{ background: 'radial-gradient(circle, rgba(90,200,250,0.12) 0%, transparent 70%)' }} />

          <div className="relative flex flex-col sm:flex-row justify-between items-start sm:items-center">
            <div>
              <p className="text-xs uppercase tracking-widest text-text-muted mb-1">{t('fin_total_income')}</p>
              <h2 className="text-[2rem] sm:text-4xl font-bold tracking-tight gradient-text num-pop tabular-nums">
                {fmtUsd(stats.total)}
              </h2>
              <div className={`mt-1.5 flex items-center gap-1.5 text-sm font-medium ${isPositive ? 'text-success' : 'text-danger'}`}>
                {isPositive ? <ChevronUp className="h-4 w-4" /> : <ChevronDown className="h-4 w-4" />}
                +{fmtUsd(stats.today)} <span className="text-text-muted">{t('fin_today_suffix')}</span>
              </div>
            </div>
            <p className="text-xs text-text-muted mt-2 sm:mt-0">{t('fin_as_of')(asOf)}</p>
          </div>

          {/* Mini stat row */}
          <div className="relative grid grid-cols-3 gap-2 mt-5">
            {[
              { label: t('stat_week'), usd: stats.week },
              { label: t('stat_month'), usd: stats.month },
              { label: t('stat_all_time'), usd: stats.total },
            ].map(({ label, usd }) => (
              <div key={label} className="rounded-xl px-2 sm:px-3 py-2.5 text-center" style={{ background: 'rgba(139,125,204,0.08)', border: '1px solid rgba(139,125,204,0.15)' }}>
                <p className="text-[9px] uppercase tracking-widest text-text-muted mb-1">{label}</p>
                <p className="text-[13px] sm:text-sm font-bold text-white tabular-nums">{fmtUsd(usd)}</p>
              </div>
            ))}
          </div>
        </motion.div>

        {/* ── Holdings — workers ──────────────────────────────────────── */}
        {activeWorkers.length > 0 && (
          <motion.div variants={itemVariants} className="glass-light rounded-[22px] p-5">
            <div className="flex items-center justify-between mb-1">
              <h3 className="text-lg font-semibold text-text">{t('fin_members')}</h3>
              <button className="text-text-muted hover:text-text">
                <MoreHorizontal className="h-5 w-5" />
              </button>
            </div>
            <p className="text-xs text-text-muted mb-2">{t('fin_per_member')}</p>

            <div className="divide-y divide-white/[0.06]">
              {activeWorkers.map(w => {
                const usd = rubToUsd(w.totalProfit, r2u)
                return (
                  <button
                    key={w.id}
                    onClick={() => navigate(`/workers/${w.id}`)}
                    className="w-full flex items-center justify-between py-3 text-left active:scale-[0.98] transition-transform"
                  >
                    <div className="flex items-center gap-3.5 min-w-0">
                      <div className="relative flex-shrink-0 w-10 h-10 rounded-full overflow-hidden flex items-center justify-center bg-accent/15 border border-accent/25 text-lg">
                        {w.avatarUrl ? (
                          <img src={w.avatarUrl} alt={w.name} className="w-full h-full object-cover" style={{ filter: 'brightness(0.85) saturate(0.7)' }} />
                        ) : (
                          <span className="leading-none">{w.emoji}</span>
                        )}
                      </div>
                      <div className="min-w-0">
                        <p className="font-semibold text-text truncate">{w.name}</p>
                        <p className="text-xs text-text-muted tabular-nums">{workerProfitsCount(w.id)} {t('fin_ops_count')(workerProfitsCount(w.id))}</p>
                      </div>
                    </div>
                    <div className="text-right flex-shrink-0">
                      <p className="font-bold text-text tabular-nums">{fmtUsd(usd)}</p>
                      <div className="flex items-center justify-end gap-1 text-xs text-success">
                        <TrendingUp className="h-3.5 w-3.5" />
                        <span className="tabular-nums">{fmtUah(usdToUah(usd, u2ua))}</span>
                      </div>
                    </div>
                  </button>
                )
              })}
            </div>
          </motion.div>
        )}

        {/* ── Profit history — expandable transaction rows ─────────────── */}
        <motion.div variants={itemVariants} className="glass-light rounded-[22px] p-5">
          <div className="flex items-center justify-between mb-3">
            <h3 className="text-lg font-semibold text-text">{t('fin_history')}</h3>
            <span className="text-xs text-text-muted bg-white/[0.04] border border-white/10 px-2 py-1 rounded-lg tabular-nums">
              {t('fin_records')(profits.length)}
            </span>
          </div>

          {recent.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-12 gap-3 text-text-muted">
              <div className="w-14 h-14 rounded-2xl glass-light flex items-center justify-center text-2xl">📊</div>
              <p className="text-sm text-center">{t('fin_empty')}</p>
            </div>
          ) : (
            <TransactionList
              entries={recent}
              workerMap={workerMap}
              r2u={r2u}
              u2ua={u2ua}
              onViewAll={() => navigate('/stats')}
              onOpenWorker={id => navigate(`/workers/${id}`)}
            />
          )}

          {recent.length > 0 && (
            <button
              onClick={() => navigate('/stats')}
              className="group w-full flex items-center justify-center gap-1.5 mt-4 pt-3 border-t border-white/[0.06] text-sm font-semibold text-accent-light"
            >
              {t('fin_analytics')}
              <ArrowRight className="h-4 w-4 transition-transform duration-300 group-hover:translate-x-1" />
            </button>
          )}
        </motion.div>
      </motion.div>
    </div>
  )
}
