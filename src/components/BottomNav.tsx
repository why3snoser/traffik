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
    <div className="fixed bottom-0 left-0 right-0 z-40 safe-bottom flex justify-center pointer-events-none">
      {/* Floating Liquid Glass capsule — Telegram/iOS 26 feel */}
      <nav
        className="pointer-events-auto"
        style={{
          marginBottom: 'max(10px, env(safe-area-inset-bottom))',
          width: 'min(92%, 400px)',
          padding: '6px',
          borderRadius: 26,
          background: 'linear-gradient(180deg, rgba(120,150,205,0.18) 0%, rgba(40,58,96,0.26) 100%)',
          backdropFilter: 'blur(34px) saturate(190%)',
          WebkitBackdropFilter: 'blur(34px) saturate(190%)',
          border: '1px solid rgba(190,215,255,0.22)',
          borderTopColor: 'rgba(220,238,255,0.45)',
          boxShadow: 'inset 0 1px 1px rgba(255,255,255,0.18), 0 18px 44px rgba(0,0,0,0.55)',
        }}
      >
        <div className="flex items-center justify-around">
          {navItems.map(({ to, icon: Icon, label, exact }) => (
            <NavLink
              key={to}
              to={to}
              end={exact}
              className={({ isActive }) =>
                `flex-1 flex flex-col items-center gap-1 py-2 rounded-2xl transition-all duration-300 ${isActive ? '' : 'text-text-muted hover:text-text'}`
              }
            >
              {({ isActive }) => (
                <>
                  <span
                    className="relative flex items-center justify-center h-6 transition-transform duration-300"
                    style={isActive ? { transform: 'translateY(-1px)' } : {}}
                  >
                    <Icon
                      size={22}
                      strokeWidth={isActive ? 2.6 : 1.9}
                      style={{
                        color: isActive ? '#64B5FF' : undefined,
                        filter: isActive ? 'drop-shadow(0 0 6px rgba(10,132,255,0.6))' : undefined,
                        transition: 'color 0.3s',
                      }}
                    />
                    {isActive && (
                      <span
                        className="absolute -inset-x-3 -inset-y-1.5 -z-10 rounded-2xl"
                        style={{
                          background: 'linear-gradient(180deg, rgba(10,132,255,0.22), rgba(10,132,255,0.08))',
                          border: '1px solid rgba(120,190,255,0.28)',
                          boxShadow: 'inset 0 1px 1px rgba(255,255,255,0.12)',
                        }}
                      />
                    )}
                  </span>
                  <span
                    className="text-[10px] font-semibold leading-none transition-colors duration-300"
                    style={{ color: isActive ? '#8FC5FF' : undefined }}
                  >
                    {label}
                  </span>
                </>
              )}
            </NavLink>
          ))}
        </div>
      </nav>
    </div>
  )
}