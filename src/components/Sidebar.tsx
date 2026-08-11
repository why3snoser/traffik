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
        background: 'linear-gradient(180deg, rgba(18,17,22,0.92) 0%, rgba(13,13,17,0.94) 100%)',
        backdropFilter: 'blur(20px) saturate(140%)',
        WebkitBackdropFilter: 'blur(20px) saturate(140%)',
        borderRight: '1px solid rgba(255,255,255,0.06)',
      }}
    >
      {/* Brand */}
      <div className="px-5 pt-6 pb-5" style={{ borderBottom: '1px solid rgba(255,255,255,0.05)' }}>
        <div className="flex items-center gap-3">
          <div className="w-9 h-9 rounded-xl btn-gradient flex items-center justify-center">
            <Gem size={15} style={{ color: '#241533' }} />
          </div>
          <div className="min-w-0">
            <h1 className="text-sm font-bold text-white tracking-wide leading-tight">TRAFFIK</h1>
            <p className="text-[10px] truncate" style={{ color: 'rgba(230,214,246,0.5)' }}>{t('sidebar_tagline')}</p>
          </div>
        </div>
      </div>

      {/* Nav */}
      <nav className="flex-1 px-3 pt-4 flex flex-col gap-0.5">
        {navItems.map(({ to, icon: Icon, label, exact }) => (
          <NavLink key={to} to={to} end={exact}
            className={({ isActive }) =>
              `relative flex items-center gap-3 px-3.5 py-2.5 rounded-xl text-[13px] font-medium transition-all duration-200 ${
                isActive
                  ? 'text-white font-semibold'
                  : 'text-text-muted hover:text-text hover:bg-white/[0.04]'
              }`
            }
            style={({ isActive }) => isActive ? {
              background: 'rgba(255,255,255,0.06)',
              border: '1px solid rgba(255,255,255,0.07)',
              boxShadow: 'inset 0 1px 0 rgba(255,255,255,0.06)',
            } : { border: '1px solid transparent' }}
          >
            {({ isActive }) => (
              <>
                {isActive && (
                  <span
                    className="absolute left-0 top-1/2 -translate-y-1/2 h-4 w-[3px] rounded-r-full"
                    style={{ background: 'linear-gradient(180deg,#E4CBF5,#C09FE6)' }}
                  />
                )}
                <Icon size={16} strokeWidth={isActive ? 2.4 : 1.8}
                  style={isActive ? { color: '#DCC2F2' } : undefined} />
                {label}
              </>
            )}
          </NavLink>
        ))}
      </nav>

      {/* Balance card at bottom */}
      <div className="p-3">
        <div className="rounded-2xl p-4 relative overflow-hidden glass-light">
          <div className="flex items-center gap-1.5 mb-1.5 relative">
            <div className="neon-dot neon-pulse" />
            <p className="text-[10px] font-semibold uppercase tracking-widest" style={{ color: 'rgba(230,214,246,0.7)' }}>{t('total_earned')}</p>
          </div>
          <p className="text-xl font-bold text-white relative tabular-nums">{fmtUsd(totalUsd)}</p>
          <p className="text-[11px] mt-0.5 relative text-text-muted">{t('workers_count')(workers.length)}</p>
        </div>
        <p className="text-center text-[9px] mt-2.5" style={{ color: 'rgba(230,214,246,0.3)' }}>TRAFFIK v1.0</p>
      </div>
    </aside>
  )
}