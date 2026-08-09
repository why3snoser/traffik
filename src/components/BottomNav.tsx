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
    /* No `safe-bottom` here on purpose. The wrapper used to add
       `padding-bottom: env(safe-area-inset-bottom)` *and* the capsule added
       `margin-bottom: max(10px, env(safe-area-inset-bottom))`, so on a notched
       phone the home-indicator inset was counted twice and the bar floated
       ~70px off the bottom edge. The capsule owns the inset now. */
    <div className="fixed bottom-0 left-0 right-0 z-40 flex justify-center pointer-events-none">
      {/* Floating Liquid Glass capsule — Telegram/iOS 26 feel, riding low */}
      <nav
        className="pointer-events-auto"
        style={{
          marginBottom: 'max(3px, env(safe-area-inset-bottom, 0px))',
          width: 'min(94%, 430px)',
          padding: '4px',
          borderRadius: 24,
          background: 'linear-gradient(180deg, rgba(139,125,204,0.18) 0%, rgba(38,34,54,0.32) 100%)',
          backdropFilter: 'blur(34px) saturate(190%)',
          WebkitBackdropFilter: 'blur(34px) saturate(190%)',
          border: '1px solid rgba(216,210,245,0.22)',
          borderTopColor: 'rgba(216,210,245,0.45)',
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
                `flex-1 min-w-0 flex flex-col items-center gap-0.5 py-1.5 rounded-2xl transition-all duration-300 ${isActive ? '' : 'text-text-muted hover:text-text'}`
              }
            >
              {({ isActive }) => (
                <>
                  <span
                    className="relative flex items-center justify-center h-6 transition-transform duration-300"
                    style={isActive ? { transform: 'translateY(-1px)' } : {}}
                  >
                    <Icon
                      size={21}
                      strokeWidth={isActive ? 2.6 : 1.9}
                      style={{
                        color: isActive ? '#A596E8' : undefined,
                        filter: isActive ? 'drop-shadow(0 0 6px rgba(139,125,204,0.6))' : undefined,
                        transition: 'color 0.3s',
                      }}
                    />
                    {isActive && (
                      <span
                        className="absolute -inset-x-3 -inset-y-1.5 -z-10 rounded-2xl"
                        style={{
                          background: 'linear-gradient(180deg, rgba(139,125,204,0.22), rgba(139,125,204,0.08))',
                          border: '1px solid rgba(216,210,245,0.24)',
                          boxShadow: 'inset 0 1px 1px rgba(255,255,255,0.12)',
                        }}
                      />
                    )}
                  </span>
                  {/* Labels are translated, so a long one (e.g. "Statistiken")
                      must clip rather than force the capsule wider than the phone. */}
                  <span
                    className="max-w-full truncate px-0.5 text-[10px] font-semibold leading-none transition-colors duration-300"
                    style={{ color: isActive ? '#CBC4F0' : undefined }}
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
