/** A tiny inline trend line -- deliberately not Recharts, which is sized for
 * the full charts on Insights and would mean a ResponsiveContainer per
 * exercise card. Draws into a fixed viewBox and stretches to its container,
 * with non-scaling strokes so the ink weight matches the rest of the UI. */
export function Sparkline({
  values,
  className = '',
  label,
}: {
  values: number[]
  className?: string
  /** Accessible description; the graphic is decorative without it. */
  label?: string
}) {
  const width = 100
  const height = 28
  const pad = 3

  if (values.length === 0) return null

  const min = Math.min(...values)
  const max = Math.max(...values)
  const span = max - min

  const x = (i: number) =>
    values.length === 1 ? width / 2 : pad + (i * (width - pad * 2)) / (values.length - 1)
  // A flat series sits on the midline rather than collapsing to the floor.
  const y = (v: number) =>
    span === 0 ? height / 2 : height - pad - ((v - min) / span) * (height - pad * 2)

  const points = values.map((v, i) => `${x(i)},${y(v)}`).join(' ')
  const lastX = x(values.length - 1)
  const lastY = y(values[values.length - 1])

  return (
    <svg
      viewBox={`0 0 ${width} ${height}`}
      className={className}
      role={label ? 'img' : 'presentation'}
      aria-label={label}
      aria-hidden={label ? undefined : true}
    >
      {values.length > 1 && (
        <polyline
          points={points}
          fill="none"
          stroke="var(--color-accent)"
          strokeWidth="2"
          strokeLinecap="round"
          strokeLinejoin="round"
          vectorEffect="non-scaling-stroke"
        />
      )}
      <circle
        cx={lastX}
        cy={lastY}
        r="2.5"
        fill="var(--color-accent)"
        stroke="var(--color-surface)"
        strokeWidth="1.5"
        vectorEffect="non-scaling-stroke"
      />
    </svg>
  )
}
