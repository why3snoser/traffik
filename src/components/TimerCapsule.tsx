import { useEffect, useState } from 'react'
import { Play, Square, RotateCcw, Check } from 'lucide-react'
import { useStore } from '@/store'
import { rubToUsd, fmtUsd } from '@/types'

function fmtTime(ms: number): string {
  const total = Math.floor(ms / 1000)
  const h = Math.floor(total / 3600)
  const m = Math.floor((total % 3600) / 60)
  const s = total % 60
  const mm = String(m).padStart(2, '0')
  const ss = String(s).padStart(2, '0')
  return h > 0 ? `${h}:${mm}:${ss}` : `${mm}:${ss}`
}

export default function TimerCapsule() {
  const { timer, sessions, startSession, stopSession, discardSession, profile } = useStore()
  const { rubToUsd: r2u } = profile.settings
  const [now, setNow] = useState(Date.now())
  const [showRecap, setShowRecap] = useState(false)
  const [lastSession, setLastSession] = useState<{ dur: number; usd: number } | null>(null)

  useEffect(() => {
    if (!timer.running) return
    const id = setInterval(() => setNow(Date.now()), 500)
    return () => clearInterval(id)
  }, [timer.running])

  const elapsed = timer.running && timer.startedAt ? now - timer.startedAt : 0
  const best = sessions.reduce((m, s) => Math.max(m, s.durationMs), 0)
  const totalSessionMs = sessions.reduce((sum, s) => sum + s.durationMs, 0)

  const handleStop = () => {
    const usd = rubToUsd(timer.profitRubAtStart, r2u)
    const profitNow = useStore.getState().profits.reduce((sum, p) => sum + p.myShare, 0)
    const deltaUsd = rubToUsd(profitNow, r2u) - usd
    stopSession()
    const dur = timer.startedAt ? Date.now() - timer.startedAt : 0
    setLastSession({ dur, usd: deltaUsd })
    setShowRecap(true)
    setTimeout(() => setShowRecap(false), 4200)
  }

  return (
    <>
      {/* Floating capsule — bottom-left, above content, below bottom nav on mobile */}
      <div className="fixed left-3 bottom-24 md:bottom-5 z-40 pointer-events-none md:left-5 flex flex-col items-start gap-2">
        {showRecap && lastSession && (
          <div className="pointer-events-auto glass rounded-2xl px-4 py-3 animate-slide-up border-accent/30"
            style={{ boxShadow: '0 0 24px rgba(10,132,255,0.35)', minWidth: 220 }}>
            <div className="flex items-center gap-2 mb-1">
              <span className="w-5 h-5 rounded-full bg-success/20 flex items-center justify-center">
                <Check size={12} style={{ color: '#64B5FF' }} />
              </span>
              <p className="text-sm font-bold text-white">Сессия завершена</p>
            </div>
            <p className="text-xs text-text-muted">
              {fmtTime(lastSession.dur)}
              {lastSession.usd > 0 && (
                <span className="ml-1.5 font-bold" style={{ color: '#0A84FF' }}>
                  +{fmtUsd(lastSession.usd)}
                </span>
              )}
            </p>
          </div>
        )}

        <div
          className="pointer-events-auto flex items-center gap-2 rounded-full px-3 py-2 transition-all"
          style={{
            background: timer.running
              ? 'linear-gradient(180deg, rgba(10,132,255,0.35) 0%, rgba(6,30,60,0.5) 100%)'
              : 'linear-gradient(180deg, rgba(120,150,205,0.18) 0%, rgba(40,58,96,0.28) 100%)',
            backdropFilter: 'blur(30px) saturate(190%)',
            WebkitBackdropFilter: 'blur(30px) saturate(190%)',
            border: '1px solid rgba(150,200,255,0.25)',
            boxShadow: timer.running
              ? '0 0 22px rgba(10,132,255,0.5), inset 0 1px 1px rgba(255,255,255,0.2)'
              : '0 10px 30px rgba(0,0,0,0.5), inset 0 1px 1px rgba(255,255,255,0.15)',
          }}
        >
          {timer.running ? (
            <>
              <span className="relative flex h-2.5 w-2.5">
                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-accent opacity-75" />
                <span className="relative inline-flex rounded-full h-2.5 w-2.5 bg-accent" />
              </span>
              <span className="font-mono font-bold text-white tabular-nums min-w-[52px] text-center text-sm">
                {fmtTime(elapsed)}
              </span>
              <button
                onClick={handleStop}
                title="Завершить сессию"
                className="w-8 h-8 rounded-full flex items-center justify-center btn-gradient active:scale-90"
              >
                <Square size={12} fill="#fff" />
              </button>
            </>
          ) : (
            <>
              <Play size={14} style={{ color: '#64B5FF' }} />
              <span className="text-[11px] font-semibold text-text-muted whitespace-nowrap">
                {totalSessionMs > 0
                  ? `${fmtTime(best)} · ${sessions.length}`
                  : 'Таймер сессии'}
              </span>
              <button
                onClick={() => startSession()}
                title="Запустить сессию"
                className="w-8 h-8 rounded-full flex items-center justify-center btn-gradient active:scale-90"
              >
                <Play size={12} fill="#fff" />
              </button>
            </>
          )}
          {!timer.running && totalSessionMs > 0 && (
            <button
              onClick={discardSession}
              title="Сбросить"
              className="w-7 h-7 rounded-full flex items-center justify-center text-text-muted hover:text-danger active:scale-90"
            >
              <RotateCcw size={13} />
            </button>
          )}
        </div>
      </div>
    </>
  )
}
