import { useEffect, useState } from 'react'
import { Play, Square, RotateCcw, Timer as TimerIcon } from 'lucide-react'
import { useStore } from '@/store'
import { rubToUsd, fmtUsd } from '@/types'
import { useT } from '@/i18n'

function fmtTime(ms: number): string {
  const total = Math.floor(ms / 1000)
  const h = Math.floor(total / 3600)
  const m = Math.floor((total % 3600) / 60)
  const s = total % 60
  const mm = String(m).padStart(2, '0')
  const ss = String(s).padStart(2, '0')
  return h > 0 ? `${h}:${mm}:${ss}` : `${mm}:${ss}`
}

export default function WorkerTimer({ workerId }: { workerId: string }) {
  const t = useT()
  const { workers, workerTimers, workerTime, workerBaseline, startWorkerSession, stopWorkerSession, discardWorkerSession, profile } = useStore()

  // Unit suffixes are localized, so the formatter has to live inside the
  // component where `t` is available.
  const fmtDur = (ms: number): string => {
    const h = Math.floor(ms / 3600000)
    const m = Math.round((ms % 3600000) / 60000)
    if (h > 0) return t('dur_hm')(h, m)
    if (m > 0) return t('dur_m')(m)
    return t('dur_s')(Math.max(1, Math.round(ms / 1000)))
  }

  const { rubToUsd: r2u } = profile.settings
  const [now, setNow] = useState(Date.now())
  const [justStopped, setJustStopped] = useState(false)

  const worker = workers.find(w => w.id === workerId)
  const timer = workerTimers[workerId]
  const running = timer?.running ?? false
  const startedAt = timer?.startedAt ?? null
  const totalMs = workerTime[workerId] ?? 0
  const baseline = workerBaseline[workerId]
  const earningsRub = worker && baseline !== undefined ? Math.max(0, worker.totalProfit - baseline) : 0
  const earningsUsd = rubToUsd(earningsRub, r2u)
  const rate = totalMs > 0 ? earningsUsd / (totalMs / 3600000) : 0

  useEffect(() => {
    if (!running) return
    const id = setInterval(() => setNow(Date.now()), 500)
    return () => clearInterval(id)
  }, [running])

  useEffect(() => {
    if (!running) {
      const id = setTimeout(() => setJustStopped(false), 2500)
      return () => clearTimeout(id)
    }
  }, [running])

  if (!worker) return null

  const liveMs = running && startedAt ? now - startedAt : 0

  return (
    <div
      className={`rounded-2xl p-4 mb-4 border transition-all ${running ? 'border-accent/40' : 'border-border'}`}
      style={{
        background: running
          ? 'linear-gradient(160deg, rgba(192,159,230,0.16) 0%, rgba(26,24,34,0.55) 100%)'
          : 'rgba(10,18,34,0.6)',
        boxShadow: running ? '0 0 24px rgba(192,159,230,0.2)' : 'none',
      }}
    >
      <div className="flex items-center justify-between mb-3">
        <div className="flex items-center gap-2">
          <TimerIcon size={14} style={{ color: running ? '#DCC2F2' : undefined }} className={running ? 'animate-pulse' : ''} />
          <span className="text-xs font-bold uppercase tracking-widest" style={{ color: running ? '#DCC2F2' : 'rgba(164,164,179,0.6)' }}>
            {running ? t('timer_running') : t('timer_idle')}
          </span>
        </div>
        <span className="font-mono font-bold text-lg tabular-nums" style={{ color: running ? '#fff' : '#eef3ff' }}>
          {running ? fmtTime(liveMs) : (totalMs > 0 ? fmtDur(totalMs) : '—')}
        </span>
      </div>

      <div className="flex flex-wrap items-center gap-2">
        {running ? (
          <button
            onClick={() => { stopWorkerSession(workerId); setJustStopped(true) }}
            className="flex items-center gap-1.5 px-4 py-2 rounded-xl text-xs font-semibold text-white btn-gradient active:scale-95"
          >
            <Square size={12} fill="#fff" /> {t('timer_stop')}
          </button>
        ) : (
          <button
            onClick={() => startWorkerSession(workerId)}
            className="flex items-center gap-1.5 px-4 py-2 rounded-xl text-xs font-semibold text-white btn-gradient active:scale-95"
          >
            <Play size={12} fill="#fff" /> {t('timer_start')}
          </button>
        )}

        {!running && totalMs > 0 && (
          <>
            <span className="text-[11px] text-text-muted">
              {earningsUsd > 0 ? (
                <>
                  <span className="font-bold" style={{ color: '#C09FE6' }}>+{fmtUsd(earningsUsd)}</span> {t('timer_for')(fmtDur(totalMs))}
                </>
              ) : (
                <>{t('timer_no_ops')(fmtDur(totalMs))}</>
              )}
              {rate > 0 && (
                <span className="font-bold ml-1.5" style={{ color: '#C09FE6' }}>{t('per_hour')(fmtUsd(rate))}</span>
              )}
            </span>
            <button
              onClick={() => discardWorkerSession(workerId)}
              title={t('timer_reset')}
              className="w-7 h-7 rounded-full flex items-center justify-center text-text-muted hover:text-danger active:scale-90"
            >
              <RotateCcw size={13} />
            </button>
          </>
        )}
      </div>

      {!running && totalMs === 0 && (
        <p className="text-[11px] text-text-muted mt-2">
          {t('timer_hint')}
        </p>
      )}

      {justStopped && !running && (
        <p className="text-[11px] font-semibold mt-2 animate-fade-in" style={{ color: '#DCC2F2' }}>
          {t('timer_saved')}
        </p>
      )}
    </div>
  )
}
