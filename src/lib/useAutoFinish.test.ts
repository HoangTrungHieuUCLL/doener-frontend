import { describe, expect, it } from 'vitest'
import { IDLE_LIMIT_MS, idleFinishDurationSec, isIdle } from './useAutoFinish'

const MIN = 60_000

describe('isIdle', () => {
  const now = Date.UTC(2026, 9, 5, 12, 0, 0)

  it('is not idle while sets are still going in', () => {
    expect(isIdle(now - 29 * MIN, now)).toBe(false)
    expect(isIdle(now, now)).toBe(false)
  })

  it('is idle at the limit and beyond', () => {
    expect(isIdle(now - IDLE_LIMIT_MS, now)).toBe(true)
    expect(isIdle(now - 3 * 60 * MIN, now)).toBe(true)
  })
})

describe('idleFinishDurationSec', () => {
  it('records start to the last set, not the idle time after it', () => {
    const started = Date.UTC(2026, 9, 5, 12, 0, 0)
    const lastSet = started + 9 * MIN
    // Forgotten for hours afterwards -- only the 9 worked minutes count.
    expect(idleFinishDurationSec(lastSet, started)).toBe(9 * 60)
  })

  it('is zero for a session abandoned before any set', () => {
    const started = Date.UTC(2026, 9, 5, 12, 0, 0)
    expect(idleFinishDurationSec(started, started)).toBe(0)
  })

  it('never goes negative when the stamp predates the start', () => {
    const started = Date.UTC(2026, 9, 5, 12, 0, 0)
    expect(idleFinishDurationSec(started - 31 * MIN, started)).toBe(0)
  })

  it('rounds to whole seconds', () => {
    const started = Date.UTC(2026, 9, 5, 12, 0, 0)
    expect(idleFinishDurationSec(started + 1499, started)).toBe(1)
    expect(idleFinishDurationSec(started + 1500, started)).toBe(2)
  })
})
