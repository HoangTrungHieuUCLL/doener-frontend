import { useCallback, useEffect, useRef, useState } from 'react'
import type { ComponentType, PointerEvent as ReactPointerEvent, SVGProps } from 'react'
import { useNavigate } from 'react-router-dom'
import { NAV_ITEMS } from './navItems'
import { useTabBarVisibility } from './TabBarVisibility'
import { useSessionActionsValue } from './SessionActions'
import { clampSpot, fanPositions } from '../lib/fanLayout'
import type { FanGeometry, Point as Spot } from '../lib/fanLayout'

const STORAGE_KEY = 'doener.floatingNav'
/** Sized for eight: the five nav icons plus the three session controls the
 * workout screen lends it. The radius is what keeps them from overlapping at
 * that count -- see fanLayout for the arithmetic, and its tests. */
const FAN: FanGeometry = { button: 52, icon: 40, radius: 112, arcDeg: 176, edgeGap: 10 }
const BUTTON = FAN.button
const EDGE_GAP = FAN.edgeGap
/** Movement beyond this is a drag, not a tap. */
const DRAG_SLOP = 8

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
function Icon({ item }: { item: { Icon: ComponentType<SVGProps<SVGSVGElement>> } }) {
  return <item.Icon className="h-5 w-5" strokeWidth={2.1} />
}

export function FloatingNav() {
  const { hiddenByScreen } = useTabBarVisibility()
  // Whatever the open screen has lent the fan -- the workout's clock controls.
  // They come first so they land nearest the thumb, below the nav icons.
  const sessionActions = useSessionActionsValue()
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
    return clampSpot(next, { width, height }, snapToEdge, FAN)
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
  const items = [
    ...sessionActions.map((a) => ({
      key: `action:${a.id}`,
      label: a.label,
      Icon: a.Icon,
      danger: a.tone === 'danger',
      disabled: a.disabled ?? false,
      run: a.onSelect,
    })),
    ...NAV_ITEMS.map(({ to, label, Icon }) => ({
      key: `nav:${to}`,
      label,
      Icon,
      danger: false,
      disabled: false,
      run: () => navigate(to),
    })),
  ]
  const positions = fanPositions(spot, items.length, opensRight, FAN)
  const parked = { x: spot.x + BUTTON / 2 - FAN.icon / 2, y: spot.y + BUTTON / 2 - FAN.icon / 2 }

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

      {items.map((item, i) => (
        <button
          key={item.key}
          type="button"
          aria-label={item.label}
          tabIndex={open ? 0 : -1}
          disabled={item.disabled}
          onClick={() => {
            setOpen(false)
            item.run()
          }}
          style={{
            left: open ? positions[i].x : parked.x,
            top: open ? positions[i].y : parked.y,
            width: FAN.icon,
            height: FAN.icon,
          }}
          className={`sticker absolute z-30 flex items-center justify-center rounded-full transition-[left,top,opacity,transform] duration-200 disabled:opacity-40 ${
            item.danger ? 'bg-accent text-white' : 'bg-surface text-ink'
          } ${open ? 'scale-100 opacity-100' : 'pointer-events-none scale-50 opacity-0'}`}
        >
          <Icon item={item} />
        </button>
      ))}

      <button
        type="button"
        aria-label={open ? 'Hide navigation' : 'Show navigation'}
        aria-expanded={open}
        onPointerDown={handlePointerDown}
        onPointerMove={handlePointerMove}
        onPointerUp={handlePointerUp}
        onPointerCancel={handlePointerUp}
        style={{ left: spot.x, top: spot.y, width: BUTTON, height: BUTTON }}
        // Border but no `sticker`: the offset drop shadow reads as grime on a
        // control that floats over the content rather than sitting on it.
        className={`absolute z-40 flex touch-none items-center justify-center rounded-full border-2 border-ink bg-ink text-bg ${
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
