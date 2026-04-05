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

export default function App() {
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
