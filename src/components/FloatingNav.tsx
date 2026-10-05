import { useCallback, useEffect, useRef, useState } from 'react'
import type { PointerEvent as ReactPointerEvent } from 'react'
import { useNavigate } from 'react-router-dom'
import { NAV_ITEMS } from './navItems'
import { useTabBarVisibility } from './TabBarVisibility'

const STORAGE_KEY = 'doener.floatingNav'
const BUTTON = 52
const EDGE_GAP = 10
/** How far the icons sit from the button's centre when fanned out. */
const RADIUS = 78
/** Total sweep of the fan; the icons are spread evenly across it. */
const ARC_DEG = 160
/** Movement beyond this is a drag, not a tap. */
const DRAG_SLOP = 8

interface Spot {
  x: number
  y: number
}

function loadSpot(): Spot | null {
  try {
    const raw = localStorage.getItem(STORAGE_KEY)
    if (!raw) return null
    const parsed = JSON.parse(raw) as Partial<Spot>
    return typeof parsed?.x === 'number' && typeof parsed?.y === 'number'
      ? { x: parsed.x, y: parsed.y }
      : null
  } catch {
    return null
  }
}

/**
 * The workout screen's navigation: a draggable dot that fans the nav icons out
 * around itself.
 *
 * It replaces a swipe up from the bottom edge, which on iOS is the system's
 * own home gesture -- reaching for the menu kept throwing the user out to the
 * home screen instead.
 *
 * Positioned `absolute` inside the app shell rather than `fixed`: the shell is
 * exactly one screen tall and does not scroll, and `fixed` would resolve
 * against the shell's transformed page wrapper anyway (see Overlay.tsx).
 */
export function FloatingNav() {
  const { hiddenByScreen } = useTabBarVisibility()
  const navigate = useNavigate()
  const hostRef = useRef<HTMLDivElement>(null)
  const [spot, setSpot] = useState<Spot | null>(null)
  // Measured rather than read off the ref at render time, so rotating the
  // phone re-aims the fan and re-clamps the button instead of going stale.
  const [hostWidth, setHostWidth] = useState(0)
  const [open, setOpen] = useState(false)
  const [dragging, setDragging] = useState(false)
  const gesture = useRef({ dx: 0, dy: 0, moved: 0 })

  /** Keep the button on screen, clear of the edges, with room for the fan. */
  const clampToHost = useCallback((next: Spot, snapToEdge: boolean): Spot => {
    const host = hostRef.current?.parentElement
    if (!host) return next
    const { width, height } = host.getBoundingClientRect()
    const maxX = width - BUTTON - EDGE_GAP
    // The fan needs vertical room on both sides of the button, or icons would
    // land off screen where they cannot be tapped.
    const minY = Math.min(RADIUS, height / 2 - BUTTON)
    const maxY = height - BUTTON - Math.min(RADIUS, height / 2 - BUTTON)
    const x = Math.min(maxX, Math.max(EDGE_GAP, next.x))
    const y = Math.min(Math.max(maxY, minY), Math.max(minY, next.y))
    if (!snapToEdge) return { x, y }
    // Settle against whichever side is nearer, so it never floats mid-screen.
    return { x: x + BUTTON / 2 < width / 2 ? EDGE_GAP : maxX, y }
  }, [])

  // Track the shell's width for the clamp and the fan direction.
  useEffect(() => {
    const host = hostRef.current?.parentElement
    if (!host) return
    // ResizeObserver fires once on observe, so this also seeds the width.
    const observer = new ResizeObserver(() => {
      setHostWidth(host.clientWidth)
      setSpot((current) => (current ? clampToHost(current, true) : current))
    })
    observer.observe(host)
    return () => observer.disconnect()
  }, [hiddenByScreen, clampToHost])

  // Restore where it was left, or start on the right, clear of the dock.
  useEffect(() => {
    if (!hiddenByScreen || spot !== null) return
    const host = hostRef.current?.parentElement
    const stored = loadSpot()
    // Default clear of the set logger docked at the bottom, so the first tap
    // does not fan icons straight over the rulers. Draggable from there.
    const fallback = host
      ? {
          x: host.clientWidth - BUTTON - EDGE_GAP,
          y: Math.round(host.clientHeight * 0.52),
        }
      : { x: EDGE_GAP, y: EDGE_GAP }
    setSpot(clampToHost(stored ?? fallback, true))
  }, [hiddenByScreen, spot, clampToHost])

  function handlePointerDown(e: ReactPointerEvent<HTMLButtonElement>) {
    if (!spot) return
    e.currentTarget.setPointerCapture(e.pointerId)
    gesture.current = { dx: e.clientX - spot.x, dy: e.clientY - spot.y, moved: 0 }
    setDragging(true)
  }

  function handlePointerMove(e: ReactPointerEvent<HTMLButtonElement>) {
    if (!dragging || !spot) return
    const next = { x: e.clientX - gesture.current.dx, y: e.clientY - gesture.current.dy }
    gesture.current.moved = Math.max(
      gesture.current.moved,
      Math.abs(next.x - spot.x) + Math.abs(next.y - spot.y),
    )
    // The fan would chase the button around, so it closes while dragging.
    if (gesture.current.moved > DRAG_SLOP && open) setOpen(false)
    setSpot(clampToHost(next, false))
  }

  function handlePointerUp(e: ReactPointerEvent<HTMLButtonElement>) {
    if (!dragging) return
    e.currentTarget.releasePointerCapture(e.pointerId)
    setDragging(false)
    if (gesture.current.moved <= DRAG_SLOP) {
      setOpen((o) => !o)
      return
    }
    setSpot((current) => {
      if (!current) return current
      const settled = clampToHost(current, true)
      try {
        localStorage.setItem(STORAGE_KEY, JSON.stringify(settled))
      } catch {
        // Blocked storage just means it starts in the default corner next time.
      }
      return settled
    })
  }

  if (!hiddenByScreen || !spot) return <div ref={hostRef} className="hidden" />

  // Fan away from whichever edge it is parked against.
  const opensRight = hostWidth === 0 || spot.x + BUTTON / 2 < hostWidth / 2
  const centreDeg = opensRight ? 0 : 180
  const stepDeg = ARC_DEG / (NAV_ITEMS.length - 1)

  return (
    <div ref={hostRef} className="md:hidden">
      {/* Tapping anywhere else folds the icons away. */}
      {open && (
        <button
          type="button"
          aria-label="Close navigation"
          onClick={() => setOpen(false)}
          className="absolute inset-0 z-30 cursor-default"
        />
      )}

      {NAV_ITEMS.map(({ to, label, Icon }, i) => {
        const angle = ((centreDeg - ARC_DEG / 2 + i * stepDeg) * Math.PI) / 180
        const x = spot.x + BUTTON / 2 + Math.cos(angle) * RADIUS - 22
        const y = spot.y + BUTTON / 2 + Math.sin(angle) * RADIUS - 22
        return (
          <button
            key={to}
            type="button"
            aria-label={label}
            tabIndex={open ? 0 : -1}
            onClick={() => {
              setOpen(false)
              navigate(to)
            }}
            style={{
              left: open ? x : spot.x + BUTTON / 2 - 22,
              top: open ? y : spot.y + BUTTON / 2 - 22,
            }}
            className={`sticker absolute z-30 flex h-11 w-11 items-center justify-center rounded-full bg-surface text-ink transition-[left,top,opacity,transform] duration-200 ${
              open ? 'scale-100 opacity-100' : 'pointer-events-none scale-50 opacity-0'
            }`}
          >
            <Icon className="h-5 w-5" strokeWidth={2.1} />
          </button>
        )
      })}

      <button
        type="button"
        aria-label={open ? 'Hide navigation' : 'Show navigation'}
        aria-expanded={open}
        onPointerDown={handlePointerDown}
        onPointerMove={handlePointerMove}
        onPointerUp={handlePointerUp}
        onPointerCancel={handlePointerUp}
        style={{ left: spot.x, top: spot.y, width: BUTTON, height: BUTTON }}
        className={`sticker absolute z-40 flex touch-none items-center justify-center rounded-full bg-ink text-bg ${
          dragging ? 'scale-105' : 'transition-transform'
        }`}
      >
        <svg width="20" height="20" viewBox="0 0 24 24" fill="currentColor" aria-hidden>
          <circle cx="12" cy="5" r="2" />
          <circle cx="12" cy="12" r="2" />
          <circle cx="12" cy="19" r="2" />
        </svg>
      </button>
    </div>
  )
}
