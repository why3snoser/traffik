import { NavLink } from 'react-router-dom'
import { Users, DollarSign, User } from 'lucide-react'

export default function BottomNav() {
  const navItems = [
    { to: '/', icon: Users, label: 'Воркеры', exact: true },
    { to: '/finance', icon: DollarSign, label: 'Финансы', exact: false },
    {
      to: '/stats',
      icon: () => (
        <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeLinecap="round" strokeLinejoin="round">
          <line x1="18" y1="20" x2="18" y2="10" /><line x1="12" y1="20" x2="12" y2="4" /><line x1="6" y1="20" x2="6" y2="14" />
        </svg>
      ),
      label: 'Статистика',
      exact: false,
    },
    { to: '/profile', icon: User, label: 'Профиль', exact: false },
  ]

  return (
    <nav className="fixed bottom-0 left-0 right-0 glass border-t border-border z-40 safe-bottom">
      <div className="flex items-center justify-around px-2 pt-2 pb-2 max-w-lg mx-auto">
        {navItems.map(({ to, icon: Icon, label, exact }) => (
          <NavLink
            key={to}
            to={to}
            end={exact}
            className={({ isActive }) =>
              `flex flex-col items-center gap-0.5 px-4 py-1.5 rounded-xl transition-all ${isActive ? 'text-accent-light' : 'text-text-muted hover:text-text'}`
            }
          >
            {({ isActive }) => (
              <>
                <div className={`p-1.5 rounded-xl transition-all ${isActive ? 'bg-accent-glow' : ''}`} style={{ strokeWidth: isActive ? 2.5 : 1.8 }}>
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
