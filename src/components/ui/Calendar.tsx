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
  /** A single selected date, several (multi-select), or none. */
  selected?: string | string[] | null
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
          className="tap-target flex items-center justify-center rounded-full border-2 border-ink bg-surface text-[20px] font-bold leading-none text-ink shadow-[var(--shadow-pop)] press hover:bg-highlight"
          onClick={() => onMonthChange(addMonths(month, -1))}
        >
          ‹
        </button>
        <p className="headline text-[22px]">
          {MONTH_NAMES[month.getMonth()]} {month.getFullYear()}
        </p>
        <button
          type="button"
          aria-label="Next month"
          className="tap-target flex items-center justify-center rounded-full border-2 border-ink bg-surface text-[20px] font-bold leading-none text-ink shadow-[var(--shadow-pop)] press hover:bg-highlight"
          onClick={() => onMonthChange(addMonths(month, 1))}
        >
          ›
        </button>
      </div>

      <div className="grid grid-cols-7 gap-1 text-center font-display text-[12px] font-extrabold text-ink-tertiary">
        {WEEKDAY_NAMES.map((w) => (
          <div key={w}>{w[0]}</div>
        ))}
      </div>

      <div key={`${month.getFullYear()}-${month.getMonth()}`} className="animate-page-in mt-1 grid grid-cols-7 gap-1">
        {leadingBlanks.map((k) => (
          <div key={k} />
        ))}
        {dates.map((iso) => {
          const day = Number(iso.slice(8, 10))
          const isToday = iso === today
          const isSelected = Array.isArray(selected) ? selected.includes(iso) : iso === selected
          return (
            <button
              key={iso}
              type="button"
              onClick={() => onSelectDay?.(iso)}
              className={`tap-target flex aspect-square flex-col items-center justify-center gap-1 rounded-[var(--radius-control)] border-2 font-display text-[14px] font-bold transition-[transform,background-color,color] active:scale-[0.94] ${
                isSelected
                  ? 'border-ink bg-accent text-white shadow-[var(--shadow-pop)]'
                  : isToday
                    ? 'border-ink bg-highlight text-ink'
                    : 'border-transparent text-ink hover:bg-surface-alt'
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
