import { createContext, useContext, useEffect, useMemo, useState } from 'react'
import type { ReactNode } from 'react'

interface TabBarVisibility {
  /** True while a screen has asked for the bar to get out of the way. */
  hiddenByScreen: boolean
  setHiddenByScreen: (hidden: boolean) => void
}

const Ctx = createContext<TabBarVisibility | null>(null)

export function TabBarVisibilityProvider({ children }: { children: ReactNode }) {
  const [hiddenByScreen, setHiddenByScreen] = useState(false)
  const value = useMemo(() => ({ hiddenByScreen, setHiddenByScreen }), [hiddenByScreen])
  return <Ctx.Provider value={value}>{children}</Ctx.Provider>
}

export function useTabBarVisibility(): TabBarVisibility {
  const ctx = useContext(Ctx)
  if (!ctx) throw new Error('useTabBarVisibility must be used inside TabBarVisibilityProvider')
  return ctx
}

/** Hide the tab bar for as long as the calling component is mounted — a
 * workout wants the whole screen, and FloatingNav carries the navigation. */
export function useHideTabBar(active = true) {
  const { setHiddenByScreen } = useTabBarVisibility()
  useEffect(() => {
    if (!active) return
    setHiddenByScreen(true)
    return () => setHiddenByScreen(false)
  }, [active, setHiddenByScreen])
}
