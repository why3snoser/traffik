import { useEffect } from 'react'
import { Routes, Route, useLocation } from 'react-router-dom'
import { AnimatePresence } from 'framer-motion'
import BottomNav from '@/components/BottomNav'
import Sidebar from '@/components/Sidebar'
import LiquidChrome from '@/components/LiquidChrome'
import GoalView from '@/components/GoalView'
import Workers from '@/pages/Workers'
import WorkerDetail from '@/pages/WorkerDetail'
import AnketaDetail from '@/pages/AnketaDetail'
import AnketaForm from '@/pages/AnketaForm'
import Finance from '@/pages/Finance'
import ProfitForm from '@/pages/ProfitForm'
import Profile from '@/pages/Profile'
import Stats from '@/pages/Stats'
import { useStore } from '@/store'

export default function App() {
  const { initialized, initialize, openedGoalId } = useStore()
  const location = useLocation()

  useEffect(() => {
    initialize()
  }, [])

  if (!initialized) {
    return (
      <div className="min-h-screen flex items-center justify-center">
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
    <div className="min-h-screen flex">
      {/* Ambient backdrop (WebGL) */}
      <div id="app-backdrop">
        <LiquidChrome
          baseColor={[0.10, 0.09, 0.16]}
          speed={0.3}
          amplitude={0.35}
          frequencyX={3}
          frequencyY={3}
          interactive
        />
        {/* Readability scrim — dims the backdrop so text stays readable, light still glows behind glass */}
        <div className="absolute inset-0"
          style={{ background: 'radial-gradient(130% 95% at 50% 8%, rgba(13,13,17,0.42) 0%, rgba(13,13,17,0.70) 100%)' }} />
      </div>
      <Sidebar />
      {/* Main content — offset by sidebar on desktop */}
      <div className="flex-1 md:ml-56 min-w-0">
        {openedGoalId ? (
          <AnimatePresence mode="wait" initial={false}>
            <GoalView key="goal-view" goalId={openedGoalId} />
          </AnimatePresence>
        ) : (
          <div key="app-content" className="max-w-lg mx-auto md:max-w-2xl md:mx-0 relative">
            <main key={location.pathname} className="animate-page-in">
              <Routes>
                <Route path="/" element={<Workers />} />
                <Route path="/workers/:id" element={<WorkerDetail />} />
                <Route path="/workers/:id/edit" element={<Workers />} />
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
        )}
      </div>
    </div>
  )
}
