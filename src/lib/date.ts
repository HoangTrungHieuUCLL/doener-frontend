export function toISODate(date: Date): string {
  const y = date.getFullYear()
  const m = String(date.getMonth() + 1).padStart(2, '0')
  const d = String(date.getDate()).padStart(2, '0')
  return `${y}-${m}-${d}`
}

export function addDays(date: Date, days: number): Date {
  const d = new Date(date)
  d.setDate(d.getDate() + days)
  return d
}

export function todayISO(): string {
  return toISODate(new Date())
}

const WEEKDAY = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat']
const MONTH = [
  'Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec',
]

export function formatDayLabel(iso: string): string {
  const [y, m, d] = iso.split('-').map(Number)
  const date = new Date(y, m - 1, d)
  return `${WEEKDAY[date.getDay()]} ${MONTH[date.getMonth()]} ${date.getDate()}`
}

/** Parses a full API timestamp as UTC, even when it arrives with no
 * timezone marker. The backend always writes UTC (datetime.now(timezone.utc)),
 * but a naive datetime can round-trip through the database (SQLite, notably)
 * without its offset, coming back as e.g. "2026-09-11T08:47:29.100644" --
 * `new Date(...)` on a string like that parses it as local time instead,
 * which is wrong by exactly the viewer's UTC offset. */
export function parseUtcTimestamp(iso: string): Date {
  const hasTimezone = /[Zz]$|[+-]\d{2}:?\d{2}$/.test(iso)
  return new Date(hasTimezone ? iso : `${iso}Z`)
}

/** Formats either a plain "YYYY-MM-DD" date or a full ISO timestamp (as
 * returned by session/PR endpoints) as e.g. "Sep 11". */
export function formatShortDate(iso: string): string {
  const datePart = iso.slice(0, 10)
  const [y, m, d] = datePart.split('-').map(Number)
  const date = new Date(y, (m || 1) - 1, d || 1)
  if (Number.isNaN(date.getTime())) return iso
  return `${MONTH[date.getMonth()]} ${date.getDate()}`
}

/** A calendar date relative to today, for "when did I last do this":
 * "Today", "Yesterday", "Tue · 5 days ago" within the last week, and a
 * plain "Sep 11" beyond that. Compares calendar days in local time, so it
 * never reports "Today" for a date that has already rolled over. */
export function formatRelativeDay(iso: string, now: Date = new Date()): string {
  const [y, m, d] = iso.slice(0, 10).split('-').map(Number)
  const then = new Date(y, (m || 1) - 1, d || 1)
  if (Number.isNaN(then.getTime())) return iso
  const today = new Date(now.getFullYear(), now.getMonth(), now.getDate())
  const days = Math.round((today.getTime() - then.getTime()) / 86_400_000)

  if (days === 0) return 'Today'
  if (days === 1) return 'Yesterday'
  if (days > 1 && days < 7) return `${WEEKDAY[then.getDay()]} · ${days} days ago`
  return formatShortDate(iso)
}

export const MONTH_NAMES = MONTH
export const WEEKDAY_NAMES = WEEKDAY

/** First day (1st, local time) of the month containing `date`. */
export function startOfMonth(date: Date): Date {
  return new Date(date.getFullYear(), date.getMonth(), 1)
}

/** Number of days in the month containing `date`. */
export function daysInMonth(date: Date): number {
  return new Date(date.getFullYear(), date.getMonth() + 1, 0).getDate()
}

export function addMonths(date: Date, months: number): Date {
  return new Date(date.getFullYear(), date.getMonth() + months, 1)
}

/** All ISO dates in the calendar month containing `date`, in order. */
export function monthDates(date: Date): string[] {
  const first = startOfMonth(date)
  const count = daysInMonth(date)
  return Array.from({ length: count }, (_, i) => toISODate(addDays(first, i)))
}

/** The next `count` dates that fall on the same weekday as `iso` (weekly
 * cadence), not including `iso` itself. */
export function nextWeekdayOccurrences(iso: string, count: number): string[] {
  const [y, m, d] = iso.split('-').map(Number)
  const base = new Date(y, m - 1, d)
  return Array.from({ length: count }, (_, i) => toISODate(addDays(base, 7 * (i + 1))))
}
