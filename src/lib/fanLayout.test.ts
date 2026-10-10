import { describe, expect, it } from 'vitest'
import { clampSpot, fanPositions } from './fanLayout'
import type { FanGeometry } from './fanLayout'

const g: FanGeometry = { button: 52, icon: 40, radius: 112, arcDeg: 176, edgeGap: 10 }

describe('fanPositions', () => {
  it('spreads the icons evenly across the arc', () => {
    const pts = fanPositions({ x: 0, y: 0 }, 8, true, g)
    const centre = { x: 26, y: 26 }
    const angles = pts.map((p) => Math.atan2(p.y + 20 - centre.y, p.x + 20 - centre.x) * (180 / Math.PI))
    const gaps = angles.slice(1).map((a, i) => Math.abs(a - angles[i]))
    for (const gap of gaps) expect(gap).toBeCloseTo(176 / 7, 4)
  })

  it('keeps every icon a full radius from the button, so none overlaps it', () => {
    for (const p of fanPositions({ x: 0, y: 0 }, 8, true, g)) {
      const d = Math.hypot(p.x + 20 - 26, p.y + 20 - 26)
      expect(d).toBeCloseTo(g.radius, 4)
    }
  })

  it('leaves room between neighbours for an icon to sit without overlapping', () => {
    const pts = fanPositions({ x: 0, y: 0 }, 8, true, g)
    for (let i = 1; i < pts.length; i++) {
      expect(Math.hypot(pts[i].x - pts[i - 1].x, pts[i].y - pts[i - 1].y)).toBeGreaterThan(g.icon)
    }
  })

  it('opens the other way when the button is parked on the right', () => {
    const right = fanPositions({ x: 300, y: 400 }, 8, false, g)
    for (const p of right) expect(p.x + 20).toBeLessThanOrEqual(300 + 26 + 0.001)
    const left = fanPositions({ x: 10, y: 400 }, 8, true, g)
    for (const p of left) expect(p.x + 20).toBeGreaterThanOrEqual(10 + 26 - 0.001)
  })

  it('puts a lone icon on the centre line rather than dividing by zero', () => {
    const [only] = fanPositions({ x: 0, y: 0 }, 1, true, g)
    expect(only.x).toBeCloseTo(26 + g.radius - 20, 4)
    expect(only.y).toBeCloseTo(26 - 20, 4)
  })
})

describe('clampSpot', () => {
  const host = { width: 390, height: 844 }

  it('keeps the whole fan on screen, icons included', () => {
    const top = clampSpot({ x: 10, y: -500 }, host, false, g)
    const pts = fanPositions(top, 8, true, g)
    for (const p of pts) expect(p.y).toBeGreaterThanOrEqual(-0.001)

    const bottom = clampSpot({ x: 10, y: 9999 }, host, false, g)
    for (const p of fanPositions(bottom, 8, true, g)) {
      expect(p.y + g.icon).toBeLessThanOrEqual(host.height + 0.001)
    }
  })

  it('snaps to whichever side is nearer', () => {
    expect(clampSpot({ x: 20, y: 400 }, host, true, g).x).toBe(g.edgeGap)
    expect(clampSpot({ x: 300, y: 400 }, host, true, g).x).toBe(390 - 52 - 10)
  })

  it('does not snap mid-drag', () => {
    expect(clampSpot({ x: 150, y: 400 }, host, false, g).x).toBe(150)
  })

  it('gives a short screen the room it has instead of an inverted range', () => {
    const squat = { width: 390, height: 200 }
    const spot = clampSpot({ x: 10, y: 9999 }, squat, false, g)
    expect(spot.y).toBeGreaterThanOrEqual(0)
    expect(spot.y).toBeLessThanOrEqual(squat.height - g.button)
  })
})
