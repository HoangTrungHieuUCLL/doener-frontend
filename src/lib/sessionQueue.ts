import type { Exercise, SessionSetDetail } from '../api/types'

/** An exercise added to a session that didn't originally include it.
 * Anchored to the exercise it follows rather than to an index, so it stays
 * put as the queue advances; `null` means "at the end of the list". */
export interface AddedExercise {
  exerciseId: number
  afterExerciseId: number | null
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
  added: AddedExercise[],
  loggedSets: SessionSetDetail[],
  exercises: Exercise[],
): Exercise[] {
  const byId = new Map(exercises.map((e) => [e.id, e]))
  const queue = [...base]
  const present = new Set(base.map((e) => e.id))

  function insert(exerciseId: number, afterExerciseId: number | null) {
    const exercise = byId.get(exerciseId)
    if (!exercise || present.has(exerciseId)) return
    present.add(exerciseId)
    const anchor = afterExerciseId === null ? -1 : queue.findIndex((e) => e.id === afterExerciseId)
    if (anchor === -1) queue.push(exercise)
    else queue.splice(anchor + 1, 0, exercise)
  }

  for (const entry of added) insert(entry.exerciseId, entry.afterExerciseId)
  for (const set of loggedSets) insert(set.exercise_id, null)
  return queue
}
