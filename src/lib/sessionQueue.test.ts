import { describe, expect, it } from 'vitest'
import type { Exercise, SessionSetDetail } from '../api/types'
import { buildSessionQueue } from './sessionQueue'

function exercise(id: number, name = `Exercise ${id}`): Exercise {
  return {
    id,
    key: `ex_${id}`,
    name,
    category: 'A',
    type: 'reps',
    sets: 3,
    reps: 10,
    duration_sec: null,
    tempo: null,
    rest_sec: 60,
    per_side: false,
    equipment: null,
  }
}

function loggedSet(exerciseId: number): SessionSetDetail {
  return {
    id: exerciseId * 100,
    exercise_id: exerciseId,
    exercise_name: `Exercise ${exerciseId}`,
    set_number: 1,
    weight_kg: 40,
    reps: 10,
    duration_sec: null,
  }
}

const catalog = [1, 2, 3, 4, 5].map((id) => exercise(id))
const ids = (queue: Exercise[]) => queue.map((e) => e.id)

describe('buildSessionQueue', () => {
  const base = [exercise(1), exercise(2), exercise(3)]

  it('returns the workout unchanged when nothing was added', () => {
    expect(ids(buildSessionQueue(base, [], [], catalog))).toEqual([1, 2, 3])
  })

  it('appends an exercise added to the end', () => {
    const queue = buildSessionQueue(base, [{ exerciseId: 4, afterExerciseId: null }], [], catalog)
    expect(ids(queue)).toEqual([1, 2, 3, 4])
  })

  it('splices an exercise added as "do it next" after the current one', () => {
    const queue = buildSessionQueue(base, [{ exerciseId: 5, afterExerciseId: 1 }], [], catalog)
    expect(ids(queue)).toEqual([1, 5, 2, 3])
  })

  it('keeps an anchored exercise in place regardless of insertion order', () => {
    const queue = buildSessionQueue(
      base,
      [
        { exerciseId: 4, afterExerciseId: null },
        { exerciseId: 5, afterExerciseId: 2 },
      ],
      [],
      catalog,
    )
    expect(ids(queue)).toEqual([1, 2, 5, 3, 4])
  })

  it('never lists the same exercise twice', () => {
    // Adding one the workout already contains must not duplicate it: both
    // slots would share a set count and complete together.
    const queue = buildSessionQueue(base, [{ exerciseId: 2, afterExerciseId: 3 }], [], catalog)
    expect(ids(queue)).toEqual([1, 2, 3])
  })

  it('recovers a logged exercise that is no longer in the added list', () => {
    // Browser storage can be cleared mid-session; the sets are on the server.
    const queue = buildSessionQueue(base, [], [loggedSet(5)], catalog)
    expect(ids(queue)).toEqual([1, 2, 3, 5])
  })

  it('does not double up an added exercise that has also been logged', () => {
    const queue = buildSessionQueue(
      base,
      [{ exerciseId: 4, afterExerciseId: 1 }],
      [loggedSet(4)],
      catalog,
    )
    expect(ids(queue)).toEqual([1, 4, 2, 3])
  })

  it('ignores an exercise id that is not in the catalog', () => {
    const queue = buildSessionQueue(base, [{ exerciseId: 999, afterExerciseId: null }], [], catalog)
    expect(ids(queue)).toEqual([1, 2, 3])
  })

  it('falls back to the end when the anchor is gone', () => {
    const queue = buildSessionQueue(base, [{ exerciseId: 4, afterExerciseId: 99 }], [], catalog)
    expect(ids(queue)).toEqual([1, 2, 3, 4])
  })

  it('leaves the caller\'s base array untouched', () => {
    buildSessionQueue(base, [{ exerciseId: 4, afterExerciseId: null }], [], catalog)
    expect(ids(base)).toEqual([1, 2, 3])
  })
})
