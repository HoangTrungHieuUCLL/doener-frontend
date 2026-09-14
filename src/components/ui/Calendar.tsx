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
          className="glass tap-target flex items-center justify-center rounded-full text-[20px] font-bold leading-none text-ink press hover:bg-highlight/60"
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
          className="glass tap-target flex items-center justify-center rounded-full text-[20px] font-bold leading-none text-ink press hover:bg-highlight/60"
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
              className={`tap-target flex aspect-square flex-col items-center justify-center gap-1 rounded-[var(--radius-control)] border font-display text-[14px] font-bold transition-[transform,background-color,color] active:scale-[0.94] ${
                isSelected
                  ? 'border-white/25 bg-accent text-white shadow-[var(--shadow-glass)]'
                  : isToday
                    ? 'border-ink/15 bg-highlight text-ink'
                    : 'border-transparent text-ink hover:bg-white/40'
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
