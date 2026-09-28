import type { Exercise, WorkoutKey } from '../api/types'

export const WORKOUT_LABELS: Record<WorkoutKey, string> = {
  A: 'Workout A',
  B: 'Workout B',
  C: 'Workout C',
  cardio: 'Cardio',
  rest: 'Rest',
  custom: 'Custom',
}

export const WORKOUT_DOT: Record<WorkoutKey, string> = {
  A: 'bg-workout-a',
  B: 'bg-workout-b',
  C: 'bg-workout-c',
  cardio: 'bg-workout-cardio',
  rest: 'bg-ink-tertiary',
  custom: 'bg-ink-tertiary',
}

// Only these are offered from pickers; "rest" exists in the backend's
// WorkoutKey but isn't part of this app's assignable options.
export const WORKOUT_OPTIONS: WorkoutKey[] = ['A', 'B', 'C', 'cardio', 'custom']

export function targetLabel(exercise: Exercise): string {
  if (exercise.type === 'time') {
    return `target ${exercise.sets}×${exercise.duration_sec ?? '?'}s`
  }
  return `target ${exercise.sets}×${exercise.reps ?? '?'}`
}

/** The catalog grouped for browsing, in a sensible order. Used by the
 * custom-workout picker and by "add an exercise" mid-session. */
export const CATALOG_SECTIONS: { key: string; label: string }[] = [
  { key: 'warmup', label: 'Warm-up' },
  { key: 'A', label: WORKOUT_LABELS.A },
  { key: 'B', label: WORKOUT_LABELS.B },
  { key: 'C', label: WORKOUT_LABELS.C },
  { key: 'custom', label: 'Standalone' },
]
