import { NavLink } from 'react-router-dom'
import { Users, DollarSign, User, BarChart2, Gem } from 'lucide-react'
import { useT } from '@/i18n'
import { useStore } from '@/store'
import { rubToUsd, fmtUsd } from '@/types'

export default function Sidebar() {
  const t = useT()
  const { workers, profile } = useStore()
  const totalRub = workers.reduce((s, w) => s + w.totalProfit, 0)
  const totalUsd = rubToUsd(totalRub, profile.settings.rubToUsd)

  const navItems = [
    { to: '/', icon: Users, label: t('nav_workers'), exact: true },
    { to: '/finance', icon: DollarSign, label: t('nav_finance'), exact: false },
    { to: '/stats', icon: BarChart2, label: t('nav_stats'), exact: false },
    { to: '/profile', icon: User, label: t('nav_profile'), exact: false },
  ]

  return (
    <aside className="fixed left-0 top-0 bottom-0 w-56 hidden md:flex flex-col z-40"
      style={{ background: 'linear-gradient(180deg, #0d0a24 0%, #080617 100%)', borderRight: '1px solid rgba(255,255,255,0.06)' }}>

      {/* Brand */}
      <div className="px-5 pt-7 pb-6">
        <div className="flex items-center gap-3">
          <div className="w-9 h-9 rounded-xl btn-gradient flex items-center justify-center shadow-glow-sm">
            <Gem size={16} className="text-white" />
          </div>
          <div>
            <h1 className="text-sm font-bold text-white tracking-wide">TRAFFIK</h1>
            <p className="text-[10px]" style={{ color: 'rgba(167,139,250,0.6)' }}>Personal CRM</p>
          </div>
        </div>
      </div>

      {/* Nav */}
      <nav className="flex-1 px-3 flex flex-col gap-0.5">
        {navItems.map(({ to, icon: Icon, label, exact }) => (
          <NavLink key={to} to={to} end={exact}
            className={({ isActive }) =>
              `flex items-center gap-3 px-3.5 py-2.5 rounded-xl text-sm font-medium transition-all duration-200 ${
                isActive
                  ? 'btn-gradient text-white shadow-glow-sm'
                  : 'text-text-muted hover:text-text hover:bg-white/5'
              }`
            }
          >
            {({ isActive }) => (
              <>
                <Icon size={16} strokeWidth={isActive ? 2.5 : 1.8} />
                {label}
              </>
            )}
          </NavLink>
        ))}
      </nav>

      {/* Balance card at bottom */}
      <div className="p-4">
        <div className="card-gradient rounded-2xl p-4 relative overflow-hidden">
          <div className="absolute -top-4 -right-4 w-20 h-20 rounded-full bg-white/10" />
          <div className="absolute -bottom-6 -left-4 w-24 h-24 rounded-full bg-black/10" />
          <p className="text-white/70 text-[10px] font-medium uppercase tracking-widest mb-1 relative">Total earned</p>
          <p className="text-xl font-bold text-white relative">{fmtUsd(totalUsd)}</p>
          <p className="text-white/60 text-xs mt-0.5 relative">{workers.length} workers</p>
        </div>
      </div>
    </aside>
  )
}
