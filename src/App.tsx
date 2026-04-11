import { useEffect } from 'react'
import { Routes, Route } from 'react-router-dom'
import BottomNav from '@/components/BottomNav'
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

  useEffect(() => {
    initialize()
  }, [])

  if (!initialized) {
    return (
      <div className="min-h-screen bg-bg flex items-center justify-center">
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
    <div className="min-h-screen bg-bg max-w-lg mx-auto relative">
      <main className="animate-fade-in">
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
      <BottomNav />
    </div>
  )
}
