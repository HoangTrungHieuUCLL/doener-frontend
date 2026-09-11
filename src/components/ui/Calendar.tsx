import type { ReactNode } from 'react'
import {
  addMonths,
  monthDates,
  startOfMonth,
  todayISO,
  MONTH_NAMES,
  WEEKDAY_NAMES,
} from '../../lib/date'

/** Reusable month grid: prev/next controls + one cell per day, content
 * supplied per-day so it works for both the plan picker and a heatmap. */
export function Calendar({
  month,
  onMonthChange,
  selected,
  onSelectDay,
  renderDay,
}: {
  month: Date
  onMonthChange: (month: Date) => void
  selected?: string | null
  onSelectDay?: (iso: string) => void
  renderDay?: (iso: string) => ReactNode
}) {
  const dates = monthDates(month)
  const firstWeekday = startOfMonth(month).getDay()
  const leadingBlanks = Array.from({ length: firstWeekday }, (_, i) => `blank-${i}`)
  const today = todayISO()

  return (
    <div>
      <div className="mb-3 flex items-center justify-between">
        <button
          type="button"
          aria-label="Previous month"
          className="tap-target flex items-center justify-center rounded-[var(--radius-control)] text-ink-secondary hover:bg-surface-alt"
          onClick={() => onMonthChange(addMonths(month, -1))}
        >
          ‹
        </button>
        <p className="text-[15px] font-semibold text-ink">
          {MONTH_NAMES[month.getMonth()]} {month.getFullYear()}
        </p>
        <button
          type="button"
          aria-label="Next month"
          className="tap-target flex items-center justify-center rounded-[var(--radius-control)] text-ink-secondary hover:bg-surface-alt"
          onClick={() => onMonthChange(addMonths(month, 1))}
        >
          ›
        </button>
      </div>

      <div className="grid grid-cols-7 gap-1 text-center text-[11px] font-medium text-ink-tertiary">
        {WEEKDAY_NAMES.map((w) => (
          <div key={w}>{w[0]}</div>
        ))}
      </div>

      <div className="mt-1 grid grid-cols-7 gap-1">
        {leadingBlanks.map((k) => (
          <div key={k} />
        ))}
        {dates.map((iso) => {
          const day = Number(iso.slice(8, 10))
          const isToday = iso === today
          const isSelected = iso === selected
          return (
            <button
              key={iso}
              type="button"
              onClick={() => onSelectDay?.(iso)}
              className={`tap-target flex aspect-square flex-col items-center justify-center gap-0.5 rounded-[var(--radius-control)] text-[13px] transition-colors ${
                isSelected
                  ? 'bg-accent text-white'
                  : isToday
                    ? 'border border-accent text-ink'
                    : 'text-ink hover:bg-surface-alt'
              }`}
            >
              <span>{day}</span>
              {renderDay?.(iso)}
            </button>
          )
        })}
      </div>
    </div>
  )
}
