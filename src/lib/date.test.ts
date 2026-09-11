import { describe, expect, it } from 'vitest'
import { addMonths, daysInMonth, monthDates, startOfMonth } from './date'

describe('calendar month math', () => {
  it('startOfMonth returns the 1st', () => {
    expect(startOfMonth(new Date(2026, 1, 15)).getDate()).toBe(1)
  })

  it('daysInMonth handles February in a leap vs non-leap year', () => {
    expect(daysInMonth(new Date(2024, 1, 1))).toBe(29) // 2024 is a leap year
    expect(daysInMonth(new Date(2025, 1, 1))).toBe(28)
  })

  it('addMonths rolls over the year boundary', () => {
    const next = addMonths(new Date(2025, 11, 5), 1)
    expect(next.getFullYear()).toBe(2026)
    expect(next.getMonth()).toBe(0)
  })

  it('monthDates returns every ISO date in the month, in order', () => {
    const dates = monthDates(new Date(2025, 3, 10)) // April 2025, 30 days
    expect(dates).toHaveLength(30)
    expect(dates[0]).toBe('2025-04-01')
    expect(dates[29]).toBe('2025-04-30')
  })
})
