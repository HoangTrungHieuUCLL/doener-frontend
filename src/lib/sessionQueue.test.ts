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

describe('buildSessionQueue: slotting an exercise in ahead of another', () => {
  it('puts it before its anchor, pushing that one back a place', () => {
    const queue = buildSessionQueue(
      [exercise(1), exercise(2), exercise(3)],
      [{ exerciseId: 4, anchorExerciseId: 2, side: 'before' }],
      [],
      [exercise(1), exercise(2), exercise(3), exercise(4)],
    )
    expect(queue.map((e) => e.id)).toEqual([1, 4, 2, 3])
  })

  it('can slot in ahead of the very first exercise', () => {
    const queue = buildSessionQueue(
      [exercise(1), exercise(2)],
      [{ exerciseId: 9, anchorExerciseId: 1, side: 'before' }],
      [],
      [exercise(1), exercise(2), exercise(9)],
    )
    expect(queue.map((e) => e.id)).toEqual([9, 1, 2])
  })

  it('still reads entries stored before the option existed as "after"', () => {
    const queue = buildSessionQueue(
      [exercise(1), exercise(2)],
      [{ exerciseId: 7, afterExerciseId: 1 }],
      [],
      [exercise(1), exercise(2), exercise(7)],
    )
    expect(queue.map((e) => e.id)).toEqual([1, 7, 2])
  })

  it('sends it to the end when its anchor is no longer in the queue', () => {
    // Not to the front, which a -1 index would give a naive "before" splice.
    const queue = buildSessionQueue(
      [exercise(1), exercise(2)],
      [{ exerciseId: 5, anchorExerciseId: 99, side: 'before' }],
      [],
      [exercise(1), exercise(2), exercise(5)],
    )
    expect(queue.map((e) => e.id)).toEqual([1, 2, 5])
  })

  it('keeps both orderings straight when they stack up', () => {
    const queue = buildSessionQueue(
      [exercise(1), exercise(2)],
      [
        { exerciseId: 3, anchorExerciseId: 2, side: 'before' },
        { exerciseId: 4, anchorExerciseId: 2, side: 'after' },
      ],
      [],
      [exercise(1), exercise(2), exercise(3), exercise(4)],
    )
    expect(queue.map((e) => e.id)).toEqual([1, 3, 2, 4])
  })
})
