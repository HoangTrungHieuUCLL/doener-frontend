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

/** Formats either a plain "YYYY-MM-DD" date or a full ISO timestamp (as
 * returned by session/PR endpoints) as e.g. "Sep 11". */
export function formatShortDate(iso: string): string {
  const datePart = iso.slice(0, 10)
  const [y, m, d] = datePart.split('-').map(Number)
  const date = new Date(y, (m || 1) - 1, d || 1)
  if (Number.isNaN(date.getTime())) return iso
  return `${MONTH[date.getMonth()]} ${date.getDate()}`
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
