import type { ComponentType, SVGProps } from 'react'
import { NavLink, Outlet, useLocation } from 'react-router-dom'
import { useAuth } from '../auth/AuthContext'
import { HistoryIcon, InsightsIcon, LogoMark, PlanIcon, TodayIcon, WorkoutIcon } from './icons'

interface NavItem {
  to: string
  label: string
  Icon: ComponentType<SVGProps<SVGSVGElement>>
}

// Today sits in the middle of the row; Workout is the far-left tab.
const NAV_ITEMS: NavItem[] = [
  { to: '/workout', label: 'Workout', Icon: WorkoutIcon },
  { to: '/plan', label: 'Plan', Icon: PlanIcon },
  { to: '/today', label: 'Today', Icon: TodayIcon },
  { to: '/history', label: 'History', Icon: HistoryIcon },
  { to: '/insights', label: 'Insights', Icon: InsightsIcon },
]

function Wordmark({ size }: { size: 'sm' | 'md' }) {
  return (
    <div className="flex items-center gap-2 text-ink">
      <LogoMark className={size === 'md' ? 'h-9 w-9' : 'h-8 w-8'} />
      <span className={`headline ${size === 'md' ? 'text-[26px]' : 'text-[22px]'}`}>Doener</span>
    </div>
  )
}

export function AppShell() {
  const { user, logout } = useAuth()
  const location = useLocation()

  return (
    <div className="flex min-h-dvh w-full flex-col md:flex-row">
      {/* Desktop sidebar */}
      <aside className="glass hidden w-64 shrink-0 flex-col px-4 py-6 md:flex">
        <div className="mb-8 px-2">
          <Wordmark size="md" />
        </div>
        <nav className="flex flex-1 flex-col gap-2">
          {NAV_ITEMS.map(({ to, label, Icon }) => (
            <NavLink
              key={to}
              to={to}
              className={({ isActive }) =>
                `tap-target flex items-center gap-3 rounded-[var(--radius-control)] border-2 px-3 font-display text-[15px] font-extrabold uppercase tracking-[0.03em] transition-[background-color,color,box-shadow,border-color] ${
                  isActive
                    ? 'border-ink bg-highlight text-ink shadow-[var(--shadow-pop)]'
                    : 'border-transparent text-ink-secondary hover:border-ink hover:bg-surface'
                }`
              }
            >
              {({ isActive }) => (
                <>
                  <Icon className="h-5 w-5" strokeWidth={isActive ? 2.4 : 2} />
                  {label}
                </>
              )}
            </NavLink>
          ))}
        </nav>
        <div className="mt-auto flex items-center justify-between gap-2 border-t-2 border-ink px-2 pt-4">
          <span className="truncate text-[13px] font-medium text-ink-secondary">{user?.display_name ?? user?.username}</span>
          <button
            onClick={logout}
            className="tap-target rounded-full px-3 font-display text-[12px] font-extrabold uppercase tracking-[0.03em] text-ink hover:bg-surface-alt"
          >
            Log out
          </button>
        </div>
      </aside>

      {/* Main content */}
      <div className="flex min-h-dvh flex-1 flex-col">
        <header className="glass flex items-center justify-between px-4 py-2.5 md:hidden">
          <Wordmark size="sm" />
          <button
            onClick={logout}
            className="tap-target rounded-full px-3 font-display text-[12px] font-extrabold uppercase tracking-[0.03em] text-ink"
          >
            Log out
          </button>
        </header>

        <main className="flex-1 overflow-y-auto pb-28 md:pb-8">
          <div key={location.pathname} className="animate-page-in mx-auto w-full max-w-3xl px-4 py-6 md:px-8 md:py-10">
            <Outlet />
          </div>
        </main>

        {/* Mobile bottom tab bar: CSS-only glass, not liquidGL -- liquidGL
            sets pointer-events: none on the lens element itself, which
            makes an interactive nav bar (or anything with clickable
            children) unusable. Fine for decorative panes, not for nav. */}
        <nav className="glass fixed inset-x-2 bottom-2 z-20 flex gap-1 rounded-[var(--radius-card)] px-2 pt-2 pb-[max(0.5rem,env(safe-area-inset-bottom))] md:hidden">
          {NAV_ITEMS.map(({ to, label, Icon }) => (
            <NavLink
              key={to}
              to={to}
              className={({ isActive }) =>
                `tap-target flex flex-1 flex-col items-center justify-center gap-1 rounded-[var(--radius-control)] py-1.5 font-display text-[10px] font-extrabold uppercase tracking-[0.05em] transition-colors ${
                  isActive ? 'bg-highlight/80 text-ink' : 'text-ink-secondary'
                }`
              }
            >
              {({ isActive }) => (
                <>
                  <Icon className="h-6 w-6" strokeWidth={isActive ? 2.4 : 1.9} />
                  {label}
                </>
              )}
            </NavLink>
          ))}
        </nav>
      </div>
    </div>
  )
}
