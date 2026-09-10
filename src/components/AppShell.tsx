import type { ComponentType, SVGProps } from 'react'
import { NavLink, Outlet } from 'react-router-dom'
import { useAuth } from '../auth/AuthContext'
import { HistoryIcon, LogoMark, PlanIcon, TodayIcon, TogetherIcon } from './icons'

interface NavItem {
  to: string
  label: string
  Icon: ComponentType<SVGProps<SVGSVGElement>>
}

const NAV_ITEMS: NavItem[] = [
  { to: '/today', label: 'Today', Icon: TodayIcon },
  { to: '/plan', label: 'Plan', Icon: PlanIcon },
  { to: '/history', label: 'History', Icon: HistoryIcon },
  { to: '/together', label: 'Together', Icon: TogetherIcon },
]

export function AppShell() {
  const { user, logout } = useAuth()

  return (
    <div className="flex min-h-dvh w-full flex-col md:flex-row">
      {/* Desktop sidebar */}
      <aside className="hidden w-60 shrink-0 flex-col border-r border-border bg-surface px-4 py-6 md:flex">
        <div className="mb-8 flex items-center gap-2 px-2 text-ink">
          <LogoMark className="h-7 w-7 text-accent" />
          <span className="text-[17px] font-semibold">Doener</span>
        </div>
        <nav className="flex flex-1 flex-col gap-1">
          {NAV_ITEMS.map(({ to, label, Icon }) => (
            <NavLink
              key={to}
              to={to}
              className={({ isActive }) =>
                `tap-target flex items-center gap-3 rounded-[var(--radius-control)] px-3 text-[15px] font-medium transition-colors ${
                  isActive
                    ? 'bg-accent-soft text-accent-strong'
                    : 'text-ink-secondary hover:bg-surface-alt'
                }`
              }
            >
              <Icon className="h-5 w-5" />
              {label}
            </NavLink>
          ))}
        </nav>
        <div className="mt-auto flex items-center justify-between gap-2 border-t border-border pt-4 px-2">
          <span className="truncate text-[13px] text-ink-tertiary">{user?.display_name ?? user?.username}</span>
          <button
            onClick={logout}
            className="tap-target rounded-[var(--radius-control)] px-2 text-[13px] font-medium text-ink-secondary hover:bg-surface-alt"
          >
            Log out
          </button>
        </div>
      </aside>

      {/* Main content */}
      <div className="flex min-h-dvh flex-1 flex-col">
        <header className="flex items-center justify-between border-b border-border bg-surface px-4 py-3 md:hidden">
          <div className="flex items-center gap-2 text-ink">
            <LogoMark className="h-6 w-6 text-accent" />
            <span className="text-[17px] font-semibold">Doener</span>
          </div>
          <button
            onClick={logout}
            className="tap-target rounded-full px-3 text-[13px] font-medium text-ink-secondary"
          >
            Log out
          </button>
        </header>

        <main className="flex-1 overflow-y-auto pb-24 md:pb-8">
          <div className="mx-auto w-full max-w-3xl px-4 py-5 md:px-8 md:py-8">
            <Outlet />
          </div>
        </main>

        {/* Mobile bottom tab bar */}
        <nav className="fixed inset-x-0 bottom-0 z-20 flex border-t border-border bg-surface/95 backdrop-blur pb-[env(safe-area-inset-bottom)] md:hidden">
          {NAV_ITEMS.map(({ to, label, Icon }) => (
            <NavLink
              key={to}
              to={to}
              className={({ isActive }) =>
                `tap-target flex flex-1 flex-col items-center justify-center gap-0.5 py-2 text-[11px] font-medium ${
                  isActive ? 'text-accent-strong' : 'text-ink-tertiary'
                }`
              }
            >
              {({ isActive }) => (
                <>
                  <Icon className="h-6 w-6" strokeWidth={isActive ? 2.1 : 1.8} />
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
