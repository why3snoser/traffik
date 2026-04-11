import { NavLink } from 'react-router-dom'
import { Users, DollarSign, User, BarChart2 } from 'lucide-react'
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
    <aside className="fixed left-0 top-0 bottom-0 w-56 bg-surface border-r border-border hidden md:flex flex-col z-40">
      {/* Brand */}
      <div className="px-5 py-6 border-b border-border">
        <div className="flex items-center gap-3">
          <div className="w-9 h-9 rounded-xl bg-accent-glow border border-accent/30 flex items-center justify-center">
            <span className="text-base">💎</span>
          </div>
          <div>
            <h1 className="text-base font-bold gradient-text leading-none">Traffik</h1>
            <p className="text-text-muted text-[10px] mt-0.5">CRM</p>
          </div>
        </div>
      </div>

      {/* Nav */}
      <nav className="flex-1 p-3 flex flex-col gap-0.5 overflow-y-auto">
        {navItems.map(({ to, icon: Icon, label, exact }) => (
          <NavLink key={to} to={to} end={exact}
            className={({ isActive }) =>
              `flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-medium transition-all ${isActive ? 'bg-accent-glow text-accent-light border border-accent/20' : 'text-text-muted hover:text-text hover:bg-card'}`
            }
          >
            {({ isActive }) => (
              <>
                <Icon size={17} strokeWidth={isActive ? 2.5 : 1.8} />
                {label}
              </>
            )}
          </NavLink>
        ))}
      </nav>

      {/* Footer stats */}
      <div className="p-4 border-t border-border">
        <p className="text-text-muted text-[10px] uppercase tracking-wider mb-1">{t('stat_total')}</p>
        <p className="text-lg font-bold gradient-text">{fmtUsd(totalUsd)}</p>
        <p className="text-text-muted text-xs">{workers.length} {t('nav_workers').toLowerCase()}</p>
      </div>
    </aside>
  )
}
