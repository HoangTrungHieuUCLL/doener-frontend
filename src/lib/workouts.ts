import type { WorkoutKey } from '../api/types'

// Each of A/B/C is a mixed full-body session (legs + push + pull + core);
// named after its primary compound lift rather than an abstract letter.
export const WORKOUT_LABELS: Record<WorkoutKey, string> = {
  A: 'Squat Day',
  B: 'Lunge Day',
  C: 'Hip Thrust Day',
  cardio: 'Cardio',
  rest: 'Rest',
  custom: 'Custom',
}

export const WORKOUT_DOT: Record<WorkoutKey, string> = {
  A: 'bg-accent',
  B: 'bg-positive',
  C: 'bg-person-b',
  cardio: 'bg-negative',
  rest: 'bg-ink-tertiary',
  custom: 'bg-ink-tertiary',
}

// Only these are offered from pickers; "rest"/"custom" exist in the
// backend's WorkoutKey but aren't part of this app's assignable options.
export const WORKOUT_OPTIONS: WorkoutKey[] = ['A', 'B', 'C', 'cardio']
