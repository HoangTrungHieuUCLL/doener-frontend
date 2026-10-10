import { createContext, useContext, useEffect, useMemo, useRef, useState } from 'react'
import type { ComponentType, ReactNode, SVGProps } from 'react'

/** A control a screen lends to the floating nav for as long as it is open. */
export interface SessionAction {
  /** Stable across re-renders; identifies the action, not its current label. */
  id: string
  label: string
  Icon: ComponentType<SVGProps<SVGSVGElement>>
  onSelect: () => void
  /** 'danger' marks the one that ends the session, so it cannot be mistaken
   *  for a navigation icon when the fan is open. */
  tone?: 'default' | 'danger'
  disabled?: boolean
}

interface SessionActionsValue {
  actions: SessionAction[]
  setActions: (actions: SessionAction[]) => void
}

const Ctx = createContext<SessionActionsValue | null>(null)

export function SessionActionsProvider({ children }: { children: ReactNode }) {
  const [actions, setActions] = useState<SessionAction[]>([])
  const value = useMemo(() => ({ actions, setActions }), [actions])
  return <Ctx.Provider value={value}>{children}</Ctx.Provider>
}

export function useSessionActionsValue(): SessionAction[] {
  return useContext(Ctx)?.actions ?? []
}

/**
 * Lends the floating nav a set of controls for the calling component's
 * lifetime, the way useHideTabBar lends it the whole screen.
 *
 * The workout screen re-renders every second as its clock ticks, so
 * registering on every render would loop. Only what the fan actually draws
 * takes part in the dependency; the callbacks are read back through a ref at
 * the moment of the tap, so they are never stale despite not re-registering.
 */
export function useSessionActions(actions: SessionAction[]): void {
  const ctx = useContext(Ctx)
  if (!ctx) throw new Error('useSessionActions must be used inside SessionActionsProvider')
  const { setActions } = ctx

  const latest = useRef(actions)
  // Before the registration effect below, so that on the render where the
  // shape changes the callbacks it captures are already the current ones.
  useEffect(() => {
    latest.current = actions
  })

  const shape = actions
    .map((a) => `${a.id}:${a.label}:${a.tone ?? ''}:${a.disabled ? 1 : 0}`)
    .join('|')

  useEffect(() => {
    setActions(
      latest.current.map((a) => ({
        ...a,
        onSelect: () => latest.current.find((x) => x.id === a.id)?.onSelect(),
      })),
    )
    return () => setActions([])
  }, [shape, setActions])
}
