import type { Exercise, LastSet, SessionSetDetail } from '../api/types'

/** Where every ruler in the set logger opens. */
export interface SetSeed {
  weightKg: number
  reps: number
  durationSec: number
  sets: number
}

/** Default load for an exercise with no history at all. Bodyweight work
 * records added weight, so nothing on the bar is the honest starting point. */
const fallbackWeight = (exercise: Exercise) => (exercise.equipment === 'bodyweight' ? 0 : 20)

/** The set logged furthest into this session, or null if none was. */
function latestThisSession(sessionSets: SessionSetDetail[]): SessionSetDetail | null {
  return sessionSets.reduce<SessionSetDetail | null>(
    (best, set) => (best === null || set.set_number > best.set_number ? set : best),
    null,
  )
}

/**
 * Opens the rulers where the lifter actually was, not where the plan says
 * they should be: the plan's target is only a fallback for an exercise with
 * no history.
 *
 * The load rulers (kg, reps, seconds) prefer a set logged earlier in this
 * same session over the last session's, so coming back to an exercise shows
 * the weight just used rather than last week's. The set count does not: sets
 * already logged today are progress, not a target, and seeding from them
 * would quietly ask for that many *more*.
 */
export function seedFromHistory(
  exercise: Exercise,
  lastSet: LastSet | null,
  sessionSets: SessionSetDetail[],
): SetSeed {
  const today = latestThisSession(sessionSets)
  return {
    weightKg: today?.weight_kg ?? lastSet?.weight_kg ?? fallbackWeight(exercise),
    reps: today?.reps ?? lastSet?.reps ?? exercise.reps ?? 10,
    durationSec: today?.duration_sec ?? lastSet?.duration_sec ?? exercise.duration_sec ?? 30,
    // How many sets the exercise took last time it was trained. The ruler has
    // a floor of 1, so a last session that somehow recorded none falls back.
    sets: lastSet?.sets.length || exercise.sets,
  }
}
