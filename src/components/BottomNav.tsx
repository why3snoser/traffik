import { NavLink } from 'react-router-dom'
import { Users, DollarSign, BarChart2, User } from 'lucide-react'
import { useT } from '@/i18n'

export default function BottomNav() {
  const t = useT()

  const navItems = [
    { to: '/', icon: Users, label: t('nav_workers'), exact: true },
    { to: '/finance', icon: DollarSign, label: t('nav_finance'), exact: false },
    { to: '/stats', icon: BarChart2, label: t('nav_stats'), exact: false },
    { to: '/profile', icon: User, label: t('nav_profile'), exact: false },
  ]

  return (
    <nav className="fixed bottom-0 left-0 right-0 z-40 safe-bottom"
      style={{ background: 'rgba(8,6,23,0.85)', backdropFilter: 'blur(20px)', borderTop: '1px solid rgba(255,255,255,0.07)' }}>
      <div className="flex items-center justify-around px-2 pt-2 pb-2 max-w-lg mx-auto">
        {navItems.map(({ to, icon: Icon, label, exact }) => (
          <NavLink key={to} to={to} end={exact}
            className={({ isActive }) =>
              `flex flex-col items-center gap-0.5 px-4 py-1.5 rounded-xl transition-all ${isActive ? 'text-accent-light' : 'text-text-muted'}`
            }
          >
            {({ isActive }) => (
              <>
                <div className={`p-1.5 rounded-xl transition-all ${isActive ? 'bg-accent-glow' : ''}`}>
                  <Icon size={20} strokeWidth={isActive ? 2.5 : 1.8} />
                </div>
                <span className="text-[10px] font-medium">{label}</span>
              </>
            )}
          </NavLink>
        ))}
      </div>
    </nav>
  )
}
