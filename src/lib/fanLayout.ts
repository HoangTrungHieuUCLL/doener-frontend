/** Geometry for the floating nav's fan of icons. Pure, so the arithmetic that
 * decides whether an icon lands off the screen can be checked without a DOM. */

export interface FanGeometry {
  /** Diameter of the draggable button the icons fan out from. */
  button: number
  /** Diameter of each fanned icon. */
  icon: number
  /** Distance from the button's centre to each icon's centre. */
  radius: number
  /** Total sweep the icons are spread across, in degrees. Must stay under
   * 180: at exactly 180 the end icons sit level with the button, and beyond
   * it they wrap back across it and off the edge it is parked against. */
  arcDeg: number
  /** Closest the button may sit to an edge. */
  edgeGap: number
}

export interface Point {
  x: number
  y: number
}

/**
 * Where each icon's top-left corner goes, for a button whose top-left is at
 * `spot`. The fan opens away from the edge the button is parked against, so
 * the icons never sit off the side of the screen.
 */
export function fanPositions(
  spot: Point,
  count: number,
  opensRight: boolean,
  g: FanGeometry,
): Point[] {
  const centre = { x: spot.x + g.button / 2, y: spot.y + g.button / 2 }
  const centreDeg = opensRight ? 0 : 180
  // One item would divide by zero; it belongs on the centre line.
  const stepDeg = count > 1 ? g.arcDeg / (count - 1) : 0
  const startDeg = count > 1 ? centreDeg - g.arcDeg / 2 : centreDeg
  return Array.from({ length: count }, (_, i) => {
    const angle = ((startDeg + i * stepDeg) * Math.PI) / 180
    return {
      x: centre.x + Math.cos(angle) * g.radius - g.icon / 2,
      y: centre.y + Math.sin(angle) * g.radius - g.icon / 2,
    }
  })
}

/**
 * Keeps the button on screen with room for its fan, and settles it against
 * the nearer side so it never floats mid-screen.
 *
 * The vertical room counts the icon's own radius, not just the fan's: the
 * icons at the ends of a wide arc sit almost a full radius above and below
 * the button, and half an icon beyond that again.
 */
export function clampSpot(
  next: Point,
  host: { width: number; height: number },
  snapToEdge: boolean,
  g: FanGeometry,
): Point {
  const maxX = host.width - g.button - g.edgeGap
  const reach = g.radius + g.icon / 2
  // A screen too short for the full reach gets the most it can give rather
  // than an inverted range.
  const minY = Math.min(reach, Math.max(0, host.height / 2 - g.button))
  const maxY = host.height - g.button - minY
  const x = Math.min(maxX, Math.max(g.edgeGap, next.x))
  const y = Math.min(Math.max(maxY, minY), Math.max(minY, next.y))
  if (!snapToEdge) return { x, y }
  return { x: x + g.button / 2 < host.width / 2 ? g.edgeGap : maxX, y }
}
