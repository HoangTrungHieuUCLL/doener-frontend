import { describe, expect, it } from 'vitest'
import { seedFromHistory } from './setSeed'
import type { Exercise, LastSet, SessionSetDetail } from '../api/types'

const bench: Exercise = {
  id: 1, key: 'bench', name: 'Bench Press', category: 'main', type: 'reps',
  sets: 4, reps: 8, duration_sec: null, tempo: null, rest_sec: 90,
  per_side: false, equipment: 'barbell',
} as Exercise

const hang: Exercise = {
  ...bench, id: 2, key: 'bar_hang', name: 'Bar Hang', type: 'time',
  sets: 3, reps: null, duration_sec: 30, equipment: 'bodyweight',
} as Exercise

const lastSet = (over: Partial<LastSet>): LastSet => ({
  exercise_id: 1, weight_kg: 60, reps: 6, duration_sec: null,
  session_id: 9, date: '2026-10-01', sets: [], trend: [], ...over,
})

const sessionSet = (over: Partial<SessionSetDetail>): SessionSetDetail => ({
  id: 1, exercise_id: 1, exercise_name: 'Bench Press', set_number: 1,
  weight_kg: null, reps: null, duration_sec: null, ...over,
})

describe('seedFromHistory', () => {
  it('falls back to the plan when nothing has ever been logged', () => {
    expect(seedFromHistory(bench, null, [])).toEqual({
      weightKg: 20, reps: 8, durationSec: 30, sets: 4,
    })
  })

  it('starts bodyweight work at no added weight, not at 20kg', () => {
    expect(seedFromHistory(hang, null, []).weightKg).toBe(0)
  })

  it('opens on the last session rather than the plan', () => {
    const seed = seedFromHistory(bench, lastSet({ weight_kg: 72.5, reps: 5 }), [])
    expect(seed.weightKg).toBe(72.5)
    expect(seed.reps).toBe(5)
  })

  it('takes the set count from how many were done last time', () => {
    const three = [sessionSet({}), sessionSet({ set_number: 2 }), sessionSet({ set_number: 3 })]
    expect(seedFromHistory(bench, lastSet({ sets: three }), []).sets).toBe(3)
  })

  it('keeps the plan’s set count when the last session recorded none', () => {
    expect(seedFromHistory(bench, lastSet({ sets: [] }), []).sets).toBe(4)
  })

  it('prefers a set logged earlier in this session over the last one', () => {
    const seed = seedFromHistory(
      bench,
      lastSet({ weight_kg: 60, reps: 6 }),
      [sessionSet({ set_number: 1, weight_kg: 65, reps: 5 })],
    )
    expect(seed.weightKg).toBe(65)
    expect(seed.reps).toBe(5)
  })

  it('takes the furthest set of this session, whatever order they arrive in', () => {
    const seed = seedFromHistory(bench, null, [
      sessionSet({ set_number: 3, weight_kg: 70 }),
      sessionSet({ set_number: 1, weight_kg: 60 }),
      sessionSet({ set_number: 2, weight_kg: 65 }),
    ])
    expect(seed.weightKg).toBe(70)
  })

  it('does not let sets done today stand in for the set count', () => {
    // Two logged today, three done last time: the ruler asks for three, not
    // two -- today's are progress, not a target.
    const three = [sessionSet({}), sessionSet({ set_number: 2 }), sessionSet({ set_number: 3 })]
    const seed = seedFromHistory(bench, lastSet({ sets: three }), [
      sessionSet({ set_number: 1 }), sessionSet({ set_number: 2 }),
    ])
    expect(seed.sets).toBe(3)
  })

  it('seeds a timed exercise from the seconds last held', () => {
    const seed = seedFromHistory(hang, lastSet({ exercise_id: 2, duration_sec: 45, weight_kg: null, reps: null }), [])
    expect(seed.durationSec).toBe(45)
  })

  it('reads through a null field to the next source instead of swallowing it', () => {
    // A reps exercise records no duration, so the session set's null must not
    // mask the plan's value.
    const seed = seedFromHistory(bench, null, [sessionSet({ set_number: 1, weight_kg: 65, reps: null })])
    expect(seed.reps).toBe(8)
    expect(seed.weightKg).toBe(65)
  })
})
