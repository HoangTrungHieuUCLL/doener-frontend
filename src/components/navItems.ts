import type { ComponentType, SVGProps } from 'react'
import { HistoryIcon, InsightsIcon, PlanIcon, TodayIcon, WorkoutIcon } from './icons'

export interface NavItem {
  to: string
  label: string
  Icon: ComponentType<SVGProps<SVGSVGElement>>
}

/** Shared by the tab bar and the floating nav, so the two can never drift.
 *  Today sits in the middle of the row; Workout is the far-left tab. */
export const NAV_ITEMS: NavItem[] = [
  { to: '/workout', label: 'Workout', Icon: WorkoutIcon },
  { to: '/plan', label: 'Plan', Icon: PlanIcon },
  { to: '/today', label: 'Today', Icon: TodayIcon },
  { to: '/history', label: 'History', Icon: HistoryIcon },
  { to: '/insights', label: 'Insights', Icon: InsightsIcon },
]
