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
      <nav
        className="pointer-events-auto"
        style={{
          marginBottom: 'max(8px, env(safe-area-inset-bottom, 0px))',
          width: 'min(94%, 400px)',
          padding: '5px',
          borderRadius: 26,
          background: 'rgba(18,17,22,0.97)',
          backdropFilter: 'blur(24px)',
          WebkitBackdropFilter: 'blur(24px)',
          border: '1px solid rgba(255,255,255,0.07)',
          boxShadow: '0 12px 32px rgba(0,0,0,0.5)',
        }}
      >
        <div className="flex items-center gap-1">
          {navItems.map(({ to, icon: Icon, label, exact }) => (
            <NavLink
              key={to}
              to={to}
              end={exact}
              className={({ isActive }) =>
                `relative flex-1 min-w-0 flex flex-col items-center justify-center gap-1 rounded-[21px] py-2 transition-colors duration-300 ${
                  isActive ? '' : 'text-text-muted hover:text-text'
                }`
              }
            >
              {({ isActive }) => (
                <>
                  {/* The active pill sits behind the whole item (icon + label),
                      not just the icon — one calm rounded highlight instead of
                      a floating chip. Negative z-index paints it above the nav
                      background but below the item content. */}
                  {isActive && (
                    <span
                      className="absolute inset-0 -z-10 rounded-[21px]"
                      style={{
                        background: 'rgba(192,159,230,0.13)',
                        border: '1px solid rgba(192,159,230,0.20)',
                      }}
                    />
                  )}
                  <Icon
                    size={20}
                    strokeWidth={isActive ? 2.4 : 1.9}
                    style={{ color: isActive ? '#DCC2F2' : undefined, transition: 'color 0.3s' }}
                  />
                  {/* Labels are translated, so a long one (e.g. "Statistiken")
                      must clip rather than force the capsule wider than the phone. */}
                  <span
                    className="max-w-full truncate px-1 text-[10px] font-semibold leading-none"
                    style={{ color: isActive ? '#E6D6F6' : undefined }}
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