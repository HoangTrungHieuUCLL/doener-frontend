import type { Exercise, SessionSetDetail } from '../api/types'

/** An exercise added to a session that didn't originally include it.
 * Anchored to a neighbouring exercise rather than to an index, so it stays
 * put as the queue advances; a `null` anchor means "at the end of the list". */
export interface AddedExercise {
  exerciseId: number
  anchorExerciseId: number | null
  /** Which side of the anchor it lands on. "before" is how an exercise gets
   * done ahead of the one in progress, pushing that one back a place. */
  side: 'before' | 'after'
}

/** The shape stored before an exercise could be slotted in ahead of another.
 * Entries written then were all "after", so they read straight across. */
interface LegacyAddedExercise {
  exerciseId: number
  afterExerciseId: number | null
}

/** Accepts either shape, since browser storage can still hold the old one
 * from a session that was already in progress when this shipped. */
export function normaliseAdded(entry: AddedExercise | LegacyAddedExercise): AddedExercise {
  if ('side' in entry) return entry
  return { exerciseId: entry.exerciseId, anchorExerciseId: entry.afterExerciseId, side: 'after' }
}

/** The session's exercise list: the workout's own exercises, plus anything
 * added mid-session, plus anything already logged that neither accounts for
 * (browser storage can be cleared, but logged sets are on the server).
 *
 * An exercise never appears twice. Sets are recorded per exercise, so two
 * slots for the same exercise would share one set count and complete
 * together -- the data model cannot tell them apart. */
export function buildSessionQueue(
  base: Exercise[],
  added: (AddedExercise | LegacyAddedExercise)[],
  loggedSets: SessionSetDetail[],
  exercises: Exercise[],
): Exercise[] {
  const byId = new Map(exercises.map((e) => [e.id, e]))
  const queue = [...base]
  const present = new Set(base.map((e) => e.id))

  function insert(exerciseId: number, anchorExerciseId: number | null, side: 'before' | 'after') {
    const exercise = byId.get(exerciseId)
    if (!exercise || present.has(exerciseId)) return
    present.add(exerciseId)
    // An anchor that is not in the queue is no anchor at all -- it may have
    // been removed since -- so the exercise goes to the end rather than
    // silently to the front, which splice(0) would do for a -1 "before".
    const anchor = anchorExerciseId === null ? -1 : queue.findIndex((e) => e.id === anchorExerciseId)
    if (anchor === -1) queue.push(exercise)
    else queue.splice(side === 'before' ? anchor : anchor + 1, 0, exercise)
  }

  for (const entry of added) {
    const { exerciseId, anchorExerciseId, side } = normaliseAdded(entry)
    insert(exerciseId, anchorExerciseId, side)
  }
  for (const set of loggedSets) insert(set.exercise_id, null, 'after')
  return queue
}
