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
    <aside
      className="fixed left-0 top-0 bottom-0 w-56 hidden md:flex flex-col z-40"
      style={{
        background: 'linear-gradient(180deg, rgba(70,100,160,0.16) 0%, rgba(24,38,66,0.12) 100%)',
        backdropFilter: 'blur(28px) saturate(170%)',
        WebkitBackdropFilter: 'blur(28px) saturate(170%)',
        borderRight: '1px solid rgba(216,210,245,0.14)',
        borderTopRightRadius: '16px',
        borderBottomRightRadius: '16px',
      }}
    >
      {/* Brand */}
      <div className="px-5 pt-7 pb-6">
        <div className="flex items-center gap-3">
          <div className="w-9 h-9 rounded-xl btn-gradient flex items-center justify-center" style={{ boxShadow: '0 0 16px rgba(139,125,204,0.4)' }}>
            <Gem size={16} style={{ color: '#fff' }} />
          </div>
          <div>
            <h1 className="text-sm font-bold text-white tracking-wide">TRAFFIK</h1>
            <p className="text-[10px]" style={{ color: 'rgba(216,210,245,0.6)' }}>Personal CRM</p>
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
                  ? 'text-white font-bold shadow-glow-sm'
                  : 'text-text-muted hover:text-text hover:bg-white/5'
              }`
            }
            style={({ isActive }) => isActive ? { background: 'linear-gradient(180deg,#8B7DCC,#7C6FD0)', boxShadow: 'inset 0 1px 1px rgba(255,255,255,0.35), 0 0 20px rgba(139,125,204,0.35)' } : {}}
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
        <div className="rounded-2xl p-4 relative overflow-hidden glass-light" style={{ borderTopColor: 'rgba(205,228,255,0.4)' }}>
          <div className="absolute -top-6 -right-6 w-24 h-24 rounded-full" style={{ background: 'radial-gradient(circle,rgba(139,125,204,0.18) 0%,transparent 70%)' }} />
          <div className="flex items-center gap-1.5 mb-2 relative">
            <div className="neon-dot neon-pulse" />
            <p className="text-[10px] font-semibold uppercase tracking-widest" style={{ color: 'rgba(216,210,245,0.8)' }}>Total earned</p>
          </div>
          <p className="text-2xl font-bold text-white relative">{fmtUsd(totalUsd)}</p>
          <p className="text-xs mt-1 relative" style={{ color: 'rgba(200,220,255,0.5)' }}>{workers.length} workers</p>
        </div>
        <p className="text-center text-[9px] mt-3" style={{ color: 'rgba(216,210,245,0.35)' }}>TRAFFIK v1.0</p>
      </div>
    </aside>
  )
}