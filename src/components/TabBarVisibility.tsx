import { createContext, useCallback, useContext, useEffect, useMemo, useState } from 'react'
import type { ReactNode } from 'react'

interface TabBarVisibility {
  /** True while a screen has asked for the bar to get out of the way. */
  hiddenByScreen: boolean
  /** True when the user has swiped it back up over a hiding screen. */
  revealed: boolean
  setHiddenByScreen: (hidden: boolean) => void
  setRevealed: (revealed: boolean) => void
}

const Ctx = createContext<TabBarVisibility | null>(null)

export function TabBarVisibilityProvider({ children }: { children: ReactNode }) {
  const [hiddenByScreen, setHiddenByScreen] = useState(false)
  const [revealed, setRevealed] = useState(false)
  const value = useMemo(
    () => ({ hiddenByScreen, revealed, setHiddenByScreen, setRevealed }),
    [hiddenByScreen, revealed],
  )
  return <Ctx.Provider value={value}>{children}</Ctx.Provider>
}

export function useTabBarVisibility(): TabBarVisibility {
  const ctx = useContext(Ctx)
  if (!ctx) throw new Error('useTabBarVisibility must be used inside TabBarVisibilityProvider')
  return ctx
}

/** Hide the tab bar for as long as the calling component is mounted — a
 * workout wants the whole screen, and the nav is a tap away by swiping up. */
export function useHideTabBar(active = true) {
  const { setHiddenByScreen, setRevealed } = useTabBarVisibility()
  useEffect(() => {
    if (!active) return
    setHiddenByScreen(true)
    return () => {
      setHiddenByScreen(false)
      setRevealed(false)
    }
  }, [active, setHiddenByScreen, setRevealed])
}

/** How long the bar stays up after a swipe before tucking itself away again. */
const AUTO_HIDE_MS = 4000

/** A thin strip along the bottom edge that swipes the tab bar back into view,
 * iOS home-indicator style. Only mounted while something is hiding the bar. */
export function TabBarRevealZone() {
  const { hiddenByScreen, revealed, setRevealed } = useTabBarVisibility()

  // Tuck away again on its own, so the bar never sits over a workout for long.
  useEffect(() => {
    if (!revealed) return
    const t = setTimeout(() => setRevealed(false), AUTO_HIDE_MS)
    return () => clearTimeout(t)
  }, [revealed, setRevealed])

  const onTouchStart = useCallback(
    (e: React.TouchEvent) => {
      const startY = e.touches[0].clientY
      const el = e.currentTarget
      function onMove(move: TouchEvent) {
        // An upward drag of ~16px counts; a tap alone should not reveal it,
        // or the strip would fight the bottom of the page.
        if (startY - move.touches[0].clientY > 16) {
          setRevealed(true)
          cleanup()
        }
      }
      function cleanup() {
        el.removeEventListener('touchmove', onMove as EventListener)
        el.removeEventListener('touchend', cleanup)
      }
      el.addEventListener('touchmove', onMove as EventListener, { passive: true })
      el.addEventListener('touchend', cleanup)
    },
    [setRevealed],
  )

  // Only while something is actually hiding the bar: on a normal page the
  // bar is already there and a handle would just sit on top of it.
  if (!hiddenByScreen || revealed) return null

  return (
    <button
      type="button"
      aria-label="Show navigation"
      onTouchStart={onTouchStart}
      onClick={() => setRevealed(true)}
      className="absolute inset-x-0 bottom-0 z-30 flex h-7 items-end justify-center pb-1 md:hidden"
    >
      {/* A small grab handle: the gesture needs something to aim at. */}
      <span className="h-1.5 w-28 rounded-full bg-ink/25" />
    </button>
  )
}
