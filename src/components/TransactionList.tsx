import { useMemo, useState } from 'react'
import { AnimatePresence, motion } from 'framer-motion'
import { ArrowRight, CreditCard as CardIcon, X } from 'lucide-react'
import type { ProfitEntry, Worker } from '@/types'
import { rubToUsd, usdToUah, fmtUsd, fmtUah } from '@/types'
import { INTL_LOCALE, useLang, useProfitLabels, useT } from '@/i18n'
import { CARD, CARD_LAST4 } from '@/lib/card'
import { TYPE_META } from '@/components/ProfitCard'
import { VisaLogo } from '@/components/VisaLogo'

/**
 * Transaction history as a day-grouped row list that expands into a
 * receipt-style detail.
 *
 * The row → detail transition is a shared-element handoff: the icon, name, type
 * and amount carry `layoutId`s that framer projects between the two branches.
 * That is also why `AnimatePresence` runs in its default sync mode — `mode="wait"`
 * unmounts the row before the detail mounts, so there is nothing to hand off
 * from, and a handoff left in flight can stall the exit permanently.
 */

interface TransactionListProps {
  entries: ProfitEntry[]
  workerMap: Map<string, Worker>
  r2u: number
  u2ua: number
  onViewAll: () => void
  onOpenWorker: (workerId: string) => void
}

const SWAP = { duration: 0.2 }

/* Refund-family operations get their amount tinted with the operation colour
   instead of the generic success green, so they can be spotted at a glance. */
const REFUND_TYPES = new Set<string>(['vozvrat', 'vozvrat_yurist'])

type Row = {
  entry: ProfitEntry
  worker?: Worker
  usd: number
  uah: number
  date: string
  time: string
}

type DayGroup = {
  key: string
  label: string
  totalUsd: number
  rows: Row[]
}

/* Member avatar (photo or emoji) with a small operation-type badge in the
   corner; falls back to the bare type icon when the entry has no member. */
function TxAvatar({ row, size, layoutId }: { row: Row; size: 'sm' | 'lg'; layoutId: string }) {
  const { Icon, color, glow } = TYPE_META[row.entry.type] ?? TYPE_META.oplata
  const box = size === 'lg' ? 'h-12 w-12 text-xl' : 'h-10 w-10 text-lg'
  return (
    <motion.div layoutId={layoutId} className="relative flex-shrink-0" transition={{ duration: 0.45 }}>
      <div className={`flex ${box} items-center justify-center overflow-hidden rounded-full border border-white/10 bg-accent/10`}>
        {row.worker?.avatarUrl ? (
          <img
            src={row.worker.avatarUrl}
            alt={row.worker.name}
            className="h-full w-full object-cover"
            style={{ filter: 'brightness(0.85) saturate(0.7)' }}
          />
        ) : row.worker ? (
          <span className="leading-none">{row.worker.emoji}</span>
        ) : (
          <Icon size={size === 'lg' ? 20 : 16} style={{ color }} />
        )}
      </div>
      <span
        className="absolute -bottom-0.5 -right-0.5 flex h-[18px] w-[18px] items-center justify-center rounded-full"
        style={{ background: '#17161C', border: '1px solid rgba(255,255,255,0.12)', boxShadow: `0 0 10px ${glow}` }}
      >
        <Icon size={10} style={{ color }} />
      </span>
    </motion.div>
  )
}

export function TransactionList({
  entries,
  workerMap,
  r2u,
  u2ua,
  onViewAll,
  onOpenWorker,
}: TransactionListProps) {
  const t = useT()
  const locale = INTL_LOCALE[useLang()]
  const profitLabels = useProfitLabels()
  const [selectedId, setSelectedId] = useState<string | null>(null)

  const rows = useMemo(
    () =>
      entries.map(e => {
        const d = new Date(e.createdAt)
        const usd = rubToUsd(e.myShare, r2u)
        return {
          entry: e,
          worker: workerMap.get(e.workerId),
          usd,
          uah: usdToUah(usd, u2ua),
          date: d.toLocaleDateString(locale, { day: 'numeric', month: 'long', year: 'numeric' }),
          time: d.toLocaleTimeString(locale, { hour: '2-digit', minute: '2-digit' }),
        }
      }),
    [entries, workerMap, r2u, u2ua, locale],
  )

  /* Rows arrive newest-first from the parent, so consecutive same-day rows
     collapse into one group with a day header and a per-day total. */
  const groups = useMemo<DayGroup[]>(() => {
    const now = new Date()
    const dayLabel = (d: Date) => {
      if (d.toDateString() === now.toDateString()) return t('today_label')('').trim()
      const opts: Intl.DateTimeFormatOptions =
        d.getFullYear() === now.getFullYear()
          ? { day: 'numeric', month: 'long' }
          : { day: 'numeric', month: 'long', year: 'numeric' }
      return d.toLocaleDateString(locale, opts)
    }
    const out: DayGroup[] = []
    for (const row of rows) {
      const d = new Date(row.entry.createdAt)
      const key = d.toDateString()
      let g = out[out.length - 1]
      if (!g || g.key !== key) {
        g = { key, label: dayLabel(d), totalUsd: 0, rows: [] }
        out.push(g)
      }
      g.totalUsd += row.usd
      g.rows.push(row)
    }
    return out
  }, [rows, locale, t])

  const selected = rows.find(r => r.entry.id === selectedId) ?? null

  return (
    <motion.div layout transition={{ duration: 0.45, ease: 'easeInOut' }} className="overflow-hidden">
      <AnimatePresence initial={false}>
        {!selected ? (
          <motion.div key="list" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} transition={SWAP}>
            {/* Capped shorter on phones — a tall inner scroller nested inside the
                page scroll is awkward to flick past on touch. */}
            <div className="max-h-[340px] sm:max-h-[460px] overflow-y-auto pr-1 -mr-1">
              {groups.map((g, gi) => (
                <div key={g.key}>
                  <div className={`flex items-baseline justify-between px-2.5 pb-1.5 ${gi === 0 ? 'pt-1' : 'pt-4'}`}>
                    <p className="text-[11px] font-semibold uppercase tracking-wider text-text-muted">{g.label}</p>
                    <p className="text-[11px] tabular-nums text-text-muted">+{fmtUsd(g.totalUsd)}</p>
                  </div>
                  <div className="flex flex-col gap-0.5">
                    {g.rows.map(row => {
                      const isRefund = REFUND_TYPES.has(row.entry.type)
                      const { color } = TYPE_META[row.entry.type] ?? TYPE_META.oplata
                      return (
                        <motion.button
                          key={row.entry.id}
                          layoutId={`tx-${row.entry.id}`}
                          onClick={() => setSelectedId(row.entry.id)}
                          className="flex w-full items-center justify-between gap-3 rounded-2xl p-2.5 sm:p-2 text-left transition-colors hover:bg-white/[0.05] active:bg-white/[0.07]"
                        >
                          <div className="flex min-w-0 items-center gap-3">
                            <TxAvatar row={row} size="sm" layoutId={`tx-icon-${row.entry.id}`} />
                            <div className="min-w-0">
                              <motion.p layoutId={`tx-name-${row.entry.id}`} className="truncate text-sm font-semibold text-text">
                                {row.worker ? row.worker.name : profitLabels[row.entry.type]}
                              </motion.p>
                              <motion.p layoutId={`tx-type-${row.entry.id}`} className="truncate text-xs text-text-muted">
                                {profitLabels[row.entry.type]} · <span className="tabular-nums">{row.time}</span>
                              </motion.p>
                            </div>
                          </div>
                          <motion.p
                            layoutId={`tx-amount-${row.entry.id}`}
                            className={`flex-shrink-0 text-sm font-bold tabular-nums ${isRefund ? '' : 'text-success'}`}
                            style={isRefund ? { color } : undefined}
                          >
                            +{fmtUsd(row.usd)}
                          </motion.p>
                        </motion.button>
                      )
                    })}
                  </div>
                </div>
              ))}
            </div>

            <motion.button
              whileTap={{ scale: 0.97 }}
              onClick={onViewAll}
              className="group mt-3 flex w-full items-center justify-center gap-1.5 rounded-xl border border-white/10 bg-white/[0.04] py-3 sm:py-2.5 text-sm font-semibold text-accent-light"
            >
              {t('fin_all_tx')}
              <ArrowRight className="h-4 w-4 transition-transform duration-300 group-hover:translate-x-1" />
            </motion.button>
          </motion.div>
        ) : (
          <TransactionDetail
            row={selected}
            label={profitLabels[selected.entry.type]}
            onClose={() => setSelectedId(null)}
            onOpenWorker={onOpenWorker}
          />
        )}
      </AnimatePresence>
    </motion.div>
  )
}

function TransactionDetail({
  row,
  label,
  onClose,
  onOpenWorker,
}: {
  row: Row
  label: string
  onClose: () => void
  onOpenWorker: (workerId: string) => void
}) {
  const t = useT()
  const locale = INTL_LOCALE[useLang()]
  const { color } = TYPE_META[row.entry.type] ?? TYPE_META.oplata
  const isRefund = REFUND_TYPES.has(row.entry.type)
  const shortId = row.entry.id.replace(/-/g, '').slice(0, 8).toUpperCase()

  return (
    <motion.div key="detail" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} transition={SWAP}>
      <div className="mb-4 flex items-start justify-between">
        <motion.div layoutId={`tx-${row.entry.id}`} className="flex items-center">
          <TxAvatar row={row} size="lg" layoutId={`tx-icon-${row.entry.id}`} />
        </motion.div>
        <button
          onClick={onClose}
          aria-label={t('fin_close_details')}
          className="flex h-9 w-9 sm:h-7 sm:w-7 flex-shrink-0 items-center justify-center rounded-full border border-white/10 bg-white/[0.06] text-text-muted transition-colors hover:text-text"
        >
          <X className="h-4 w-4" />
        </button>
      </div>

      <div className="flex items-start justify-between gap-3 border-b border-dashed border-white/15 pb-4">
        <div className="min-w-0 space-y-1">
          <motion.p layoutId={`tx-name-${row.entry.id}`} className="truncate text-sm font-semibold text-text">
            {row.worker ? row.worker.name : label}
          </motion.p>
          <motion.p layoutId={`tx-type-${row.entry.id}`} className="truncate text-xs text-text-muted">
            {label}
          </motion.p>
        </div>
        <div className="flex-shrink-0 text-right">
          <motion.p
            layoutId={`tx-amount-${row.entry.id}`}
            className={`text-lg font-bold tabular-nums ${isRefund ? '' : 'text-success'}`}
            style={isRefund ? { color } : undefined}
          >
            +{fmtUsd(row.usd)}
          </motion.p>
          <p className="text-xs tabular-nums text-text-muted">{fmtUah(row.uah)}</p>
        </div>
      </div>

      <motion.div initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.18 }}>
        <div className="mt-4 space-y-2 text-xs text-text-muted">
          <div className="flex justify-between gap-3">
            <span className="flex-shrink-0">{t('ticket_id')}</span>
            <span className="font-mono text-right text-text">#{shortId}</span>
          </div>
          <div className="flex justify-between gap-3">
            <span className="flex-shrink-0">{t('ticket_datetime')}</span>
            <span className="text-right tabular-nums text-text">{row.date}, {row.time}</span>
          </div>
          <div className="flex justify-between gap-3">
            <span className="flex-shrink-0">{t('profit_sum_short')}</span>
            <span className="text-right tabular-nums text-text">{row.entry.amount.toLocaleString(locale)} ₽</span>
          </div>
          {row.entry.note && (
            <div className="flex justify-between gap-3">
              <span className="flex-shrink-0">{t('profit_note_label')}</span>
              <span className="max-w-[60%] break-words text-right text-text">{row.entry.note}</span>
            </div>
          )}
        </div>

        <div className="mt-4 border-t border-dashed border-white/15 pt-4">
          <p className="text-xs font-medium text-text">{t('fin_paid_via')(CARD.brand)}</p>
          <div className="mt-2 flex items-center gap-2">
            <CardIcon className="h-4 w-4 text-accent-light" />
            <p className="text-sm tabular-nums text-text">•••• {CARD_LAST4}</p>
            <span className="ml-auto text-text-muted">
              <VisaLogo />
            </span>
          </div>
        </div>

        {row.worker && (
          <button
            onClick={() => onOpenWorker(row.worker!.id)}
            className="group mt-4 flex w-full items-center justify-center gap-1.5 rounded-xl border border-white/10 bg-white/[0.04] py-3 sm:py-2.5 text-sm font-semibold text-accent-light"
          >
            {row.worker.name}
            <ArrowRight className="h-4 w-4 transition-transform duration-300 group-hover:translate-x-1" />
          </button>
        )}
      </motion.div>
    </motion.div>
  )
}