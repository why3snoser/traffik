import { useEffect } from 'react'
import { Routes, Route, useLocation } from 'react-router-dom'
import BottomNav from '@/components/BottomNav'
import Sidebar from '@/components/Sidebar'
import LiquidChrome from '@/components/LiquidChrome'
import GoalView from '@/components/GoalView'
import { PaymentTicket } from '@/components/PaymentTicket'
import Workers from '@/pages/Workers'
import WorkerDetail from '@/pages/WorkerDetail'
import AnketaDetail from '@/pages/AnketaDetail'
import AnketaForm from '@/pages/AnketaForm'
import Finance from '@/pages/Finance'
import ProfitForm from '@/pages/ProfitForm'
import Profile from '@/pages/Profile'
import Stats from '@/pages/Stats'
import { useStore } from '@/store'
import { startUsageTracking } from '@/lib/usage'

/* Module scope, not a literal in the JSX below. `baseColor` sits in the
   LiquidChrome effect's dep list, and App re-renders on every store write — an
   inline `[0.10, 0.09, 0.16]` is a new array identity each time, so the effect
   tore down the WebGL context (`loseContext()`) and recompiled both shaders on
   every profit, every route change, every ticket auto-dismiss. Typed `number[]`
   rather than `as const`: the prop is `number[]`, and a readonly tuple is not
   assignable to it. */
const BACKDROP_BASE_COLOR: number[] = [0.07, 0.065, 0.11]

export default function App() {
  /* Selectors, not a bare `useStore()`. Subscribing to the whole store re-rendered
     App — and with it the WebGL backdrop and every route — on any state change. */
  const initialized = useStore(s => s.initialized)
  const initialize = useStore(s => s.initialize)
  const openedGoalId = useStore(s => s.openedGoalId)
  const location = useLocation()

  useEffect(() => {
    initialize()
    startUsageTracking()
  }, [])

  if (!initialized) {
    return (
      <div className="min-h-dvh flex items-center justify-center">
        <div className="flex flex-col items-center gap-4">
          <div className="w-12 h-12 rounded-2xl bg-accent-glow border border-accent/20 flex items-center justify-center">
            <div className="w-5 h-5 border-2 border-accent border-t-transparent rounded-full animate-spin" />
          </div>
          <p className="text-text-muted text-sm">Loading...</p>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-dvh flex">
      {/* Ambient backdrop (WebGL) */}
      <div id="app-backdrop">
        <LiquidChrome
          baseColor={BACKDROP_BASE_COLOR}
          speed={0.25}
          amplitude={0.3}
          frequencyX={3}
          frequencyY={3}
          interactive
        />
        {/* Readability scrim — the backdrop is only a faint ambient sheen now;
            cards are near-solid, the workspace reads flat and calm. */}
        <div className="absolute inset-0"
          style={{ background: 'radial-gradient(130% 95% at 50% 8%, rgba(10,10,13,0.72) 0%, rgba(10,10,13,0.88) 100%)' }} />
      </div>
      <Sidebar />
      {/* Main content — offset by sidebar on desktop. Pages own their max
          width now (wide dashboards for the top-level tabs, narrow columns
          for forms), so the shell no longer constrains everyone to a single
          mobile-ish column. */}
      <div className="flex-1 md:ml-56 min-w-0">
        <div className="relative">
          <main key={location.pathname} className="animate-page-in">
            <Routes>
              <Route path="/" element={<Workers />} />
              <Route path="/workers/:id" element={<WorkerDetail />} />
              <Route path="/workers/:workerId/anketas/new" element={<AnketaForm />} />
              <Route path="/workers/:id/profit/new" element={<ProfitForm />} />
              <Route path="/anketas/:id" element={<AnketaDetail />} />
              <Route path="/anketas/:id/edit" element={<AnketaForm />} />
              <Route path="/finance" element={<Finance />} />
              <Route path="/profile" element={<Profile />} />
              <Route path="/stats" element={<Stats />} />
            </Routes>
          </main>
          {/* Bottom nav only on mobile */}
          <div className="md:hidden">
            <BottomNav />
          </div>
        </div>

        {/* The goal overlay is `fixed inset-0` and opaque, so it stacks on top
            of the page instead of replacing it. Routing both through a single
            `mode="wait"` presence kept the page unmounted until the overlay's
            exit finished — and switching goals inside the overlay left a
            `layoutId` handoff in flight that stalled that exit, leaving a
            blank, unclickable screen. The overlay now owns its own fade-out
            and clears the store when it ends, so no presence bookkeeping sits
            between the close button and the page. */}
        {openedGoalId && <GoalView goalId={openedGoalId} />}
      </div>

      {/* Sits outside the content column so the receipt centres on the whole
          viewport, not just the page area beside the sidebar. */}
      <PaymentTicket />
    </div>
  )
}