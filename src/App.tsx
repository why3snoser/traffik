import { useEffect } from 'react'
import { Routes, Route, useLocation } from 'react-router-dom'
import BottomNav from '@/components/BottomNav'
import Sidebar from '@/components/Sidebar'
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
  const { initialized, initialize } = useStore()
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
      {/* iOS Liquid Glass ambient backdrop */}
      <div id="app-backdrop">
        <div className="aurora-orb" style={{ width: '520px', height: '520px', top: '-12%', right: '-6%', background: 'radial-gradient(circle, rgba(10,132,255,0.30) 0%, transparent 68%)' }} />
        <div className="aurora-orb" style={{ width: '480px', height: '480px', bottom: '-16%', left: '6%', background: 'radial-gradient(circle, rgba(90,200,250,0.22) 0%, transparent 70%)', animationDelay: '-7s' }} />
        <div className="aurora-orb" style={{ width: '380px', height: '380px', top: '34%', left: '34%', background: 'radial-gradient(circle, rgba(255,214,10,0.08) 0%, transparent 70%)', animationDelay: '-14s' }} />
        <div className="aurora-orb" style={{ width: '340px', height: '340px', top: '58%', left: '-5%', background: 'radial-gradient(circle, rgba(0,190,255,0.16) 0%, transparent 70%)', animationDelay: '-3s' }} />
      </div>
      <Sidebar />
      {/* Main content — offset by sidebar on desktop */}
      <div className="flex-1 md:ml-56 min-w-0">
        <div className="max-w-lg mx-auto md:max-w-2xl md:mx-0 relative">
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
      </div>
    </div>
  )
}
