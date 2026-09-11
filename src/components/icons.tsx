// Small inline icon set (no external icon dependency) used by navigation.
import { useId } from 'react'
import type { SVGProps } from 'react'

type IconProps = SVGProps<SVGSVGElement>

const base = {
  width: 24,
  height: 24,
  viewBox: '0 0 24 24',
  fill: 'none',
  stroke: 'currentColor',
  strokeWidth: 1.8,
  strokeLinecap: 'round' as const,
  strokeLinejoin: 'round' as const,
}

export function TodayIcon(props: IconProps) {
  return (
    <svg {...base} {...props}>
      <circle cx="12" cy="12" r="8.5" />
      <path d="M12 8v4l2.6 2.6" />
    </svg>
  )
}

export function PlanIcon(props: IconProps) {
  return (
    <svg {...base} {...props}>
      <rect x="3.5" y="4.5" width="17" height="16" rx="2.5" />
      <path d="M3.5 9.5h17" />
      <path d="M8 3v3M16 3v3" />
      <path d="M7.5 13.5h2M11 13.5h2M14.5 13.5h2M7.5 17h2M11 17h2" />
    </svg>
  )
}

export function HistoryIcon(props: IconProps) {
  return (
    <svg {...base} {...props}>
      <path d="M4 12a8 8 0 1 0 2.6-5.9" />
      <path d="M4 4v4h4" />
      <path d="M12 8v4.5l3 2" />
    </svg>
  )
}

export function WorkoutIcon(props: IconProps) {
  return (
    <svg {...base} {...props}>
      <path d="M6.5 9.5v5M17.5 9.5v5" />
      <path d="M4 10.5v3M20 10.5v3" />
      <path d="M6.5 12h11" />
    </svg>
  )
}

export function InsightsIcon(props: IconProps) {
  return (
    <svg {...base} {...props}>
      <path d="M4 20V10M10 20V4M16 20v-7M20 20V13" />
    </svg>
  )
}

/** A döner kebab cone on a vertical spit -- meat stack filled with the
 * brand gradient, layer lines across it, skewer running through top to
 * bottom. Each instance gets its own gradient id (via useId) since several
 * copies can be in the DOM at once (desktop + mobile nav). */
export function LogoMark(props: IconProps) {
  const gradientId = `logo-gradient-${useId()}`
  return (
    <svg {...base} viewBox="0 0 24 24" {...props}>
      <defs>
        <linearGradient id={gradientId} x1="4" y1="2.5" x2="20" y2="19" gradientUnits="userSpaceOnUse">
          <stop offset="0" stopColor="#E61A66" />
          <stop offset="1" stopColor="#AA33FF" />
        </linearGradient>
      </defs>
      <path
        d="M12 5.5c2.8 2.6 4.5 6.3 4.5 10.5v3h-9v-3c0-4.2 1.7-7.9 4.5-10.5z"
        fill={`url(#${gradientId})`}
        fillOpacity="0.2"
      />
      <g stroke={`url(#${gradientId})`}>
        <path d="M12 2.5v18" />
        <path d="M9 3h6" />
        <path d="M9.8 10.5q2.2 1 4.4 0" />
        <path d="M8.6 13.8q3.4 1.4 6.8 0" />
        <path d="M7.9 17q4.1 1.6 8.2 0" />
      </g>
    </svg>
  )
}
