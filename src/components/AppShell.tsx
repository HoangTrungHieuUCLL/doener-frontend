import { Glass } from '@samasante/liquid-glass'
import type { ComponentType, SVGProps } from 'react'
import { NavLink, Outlet, useLocation } from 'react-router-dom'
import { useAuth } from '../auth/AuthContext'
import { HistoryIcon, InsightsIcon, LogoMark, PlanIcon, TodayIcon, WorkoutIcon } from './icons'
import { TabBarRevealZone, TabBarVisibilityProvider, useTabBarVisibility } from './TabBarVisibility'

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
  return (
    <TabBarVisibilityProvider>
      <AppShellInner />
    </TabBarVisibilityProvider>
  )
}

function AppShellInner() {
  const { user, logout } = useAuth()
  const location = useLocation()
  const { hiddenByScreen, revealed } = useTabBarVisibility()
  const tabBarHidden = hiddenByScreen && !revealed

  // Exactly one screen tall, with <main> as the only scroller: the page itself
  // never scrolls, so the header and bottom tab bar stay put instead of riding
  // iOS's scroll and toolbar resizing.
  return (
    <div className="relative flex h-[var(--app-h)] w-full flex-col overflow-hidden md:flex-row">
      {/* Desktop sidebar */}
      <aside className="glass hidden w-64 shrink-0 flex-col overflow-y-auto px-4 py-6 md:flex">
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
      <div className="flex min-h-0 flex-1 flex-col">
        {/* Installed to the home screen, the app runs edge-to-edge under the status
            bar (viewport-fit=cover + black-translucent), so pad past it. */}
        <header className="glass flex items-center justify-between px-4 pt-[calc(0.625rem+env(safe-area-inset-top))] pb-2.5 md:hidden">
          <Wordmark size="sm" />
          <button
            onClick={logout}
            className="tap-target rounded-full px-3 font-display text-[12px] font-extrabold uppercase tracking-[0.03em] text-ink"
          >
            Log out
          </button>
        </header>

        {/* Bottom room for the tab bar lives on the inner wrapper, not on <main>:
            padding on the scroll container would also push up anything sticky
            to its bottom edge (the workout set logger). */}
        <main data-app-scroller className="flex-1 overflow-y-auto">
          {/* The Workout catalog is a photo grid, so it spreads to the full width;
              every other page keeps a readable column. */}
          <div
            key={location.pathname}
            className={`animate-page-in mx-auto w-full px-4 pt-6 md:px-8 md:pt-10 md:pb-18 ${
              tabBarHidden
                ? 'pb-[calc(2.5rem+env(safe-area-inset-bottom))]'
                : 'pb-[calc(8.5rem+env(safe-area-inset-bottom))]'
            } ${
              location.pathname === '/workout' ? '' : 'max-w-3xl'
            }`}
          >
            <Outlet />
          </div>
        </main>

        {/* Mobile bottom tab bar: a real liquid-glass lens that refracts the
            content scrolling behind it, keeping the card frame (ink border +
            card shadow, via `sticker`) and the sidebar-style active tab.
            `sticker` sets only a border and a shadow -- no background -- so it
            frames the lens instead of covering it.

            <Glass> IS the positioned box and wraps the real <nav>: it measures
            and refracts its children, and a childless Glass collapses to zero
            size with nothing to fit itself to. The NavLink anchors inside stay
            clickable (unlike liquidGL, dropped in d572ec7, which set
            pointer-events: none on the element it was applied to).

            md:hidden sits on a plain wrapper, not on Glass: Glass inline-styles
            display: inline-block, and an inline style beats the utility class.

            Offset by env(safe-area-inset-bottom): installed as a home-screen
            app on iOS, the viewport runs edge-to-edge under the home
            indicator, so a plain bottom-2 would float the bar (rounded corners
            included) into that exclusion zone. Requires viewport-fit=cover in
            index.html's viewport meta, or safe-area-inset-* is always 0. */}
        <TabBarRevealZone />

        <div
          className={`transition-[transform,opacity] duration-300 md:hidden ${
            tabBarHidden ? 'pointer-events-none translate-y-[140%] opacity-0' : 'translate-y-0 opacity-100'
          }`}
        >
          <Glass
            className="sticker absolute inset-x-2 bottom-[calc(0.5rem+env(safe-area-inset-bottom))] z-20 rounded-[var(--radius-card)]"
            // A thinner tint than --color-glass: the less milk, the more of the
            // frost and the edge-light reads as glass rather than as paint.
            style={{ background: 'rgba(255, 255, 255, 0.26)' }}
            // Bending the LIVE page needs backdrop-filter: url(), which is
            // Chromium-only, so on iOS Safari this lens frosts, tints and
            // edge-lights but cannot refract. frost / specular / sheen / glow
            // are therefore what carry the glass on a phone; depth, curvature,
            // bend and dispersion only add refraction where it is supported.
            optics={{
              frost: 8,
              saturate: 1.35,
              specular: 0.95,
              sheen: 0.6,
              sheenWidth: 6,
              sheenAngle: 290,
              glow: 0.16,
              depth: 0.32,
              curvature: 0.45,
              bend: 0.68,
              bendWidth: 0.4,
              dispersion: 0.5,
              strength: 0.45,
            }}
          >
            <nav className="flex gap-1 p-1.5">
              {NAV_ITEMS.map(({ to, label, Icon }) => (
                <NavLink
                  key={to}
                  to={to}
                  className={({ isActive }) =>
                    `tap-target flex flex-1 flex-col items-center justify-center gap-1 rounded-[var(--radius-control)] border-2 py-1.5 font-display text-[10px] font-extrabold uppercase tracking-[0.05em] transition-[background-color,color,box-shadow,border-color] ${
                      isActive
                        ? 'border-ink bg-highlight text-ink shadow-[var(--shadow-pop)]'
                        : 'border-transparent text-ink-secondary'
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
          </Glass>
        </div>
      </div>
    </div>
  )
}
