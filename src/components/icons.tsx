// Small inline icon set (no external icon dependency) used by navigation.
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

export function TogetherIcon(props: IconProps) {
  return (
    <svg {...base} {...props}>
      <circle cx="9" cy="8.5" r="3" />
      <circle cx="16.5" cy="9.5" r="2.4" />
      <path d="M3.5 19c0-3 2.5-5 5.5-5s5.5 2 5.5 5" />
      <path d="M14.8 14.3c2.4.2 4.2 1.9 4.2 4.7" />
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

export function LogoMark(props: IconProps) {
  return (
    <svg {...base} viewBox="0 0 24 24" {...props}>
      <circle cx="12" cy="7" r="3.2" fill="currentColor" stroke="none" />
      <path d="M12 10.6c-3.4 0-5.6 2-6.3 5.3" />
      <path d="M12 10.6c3.4 0 5.6 2 6.3 5.3" />
      <path d="M8.2 18.6h7.6" />
    </svg>
  )
}
