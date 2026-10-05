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
    const target = exercise.duration_sec === null ? '?s' : formatTimed(exercise, exercise.duration_sec)
    return `target ${exercise.sets}×${target}`
  }
  return `target ${exercise.sets}×${exercise.reps ?? '?'}`
}

/** Timed work with a target of 5+ minutes (running, walking, cycling) is
 * entered and shown in minutes; short holds (plank, bar hang) stay in seconds. */
export function inMinutes(exercise: Exercise): boolean {
  return exercise.type === 'time' && (exercise.duration_sec ?? 0) >= 300
}

/** "20 min" for long timed work, "45s" for short holds. */
export function formatTimed(exercise: Exercise, sec: number): string {
  return inMinutes(exercise) ? `${Math.round(sec / 60)} min` : `${sec}s`
}

// Reps-only moves: nobody loads these, so the logger asks for reps alone.
// Other bodyweight moves (reverse lunge, pull-up) keep kg for added weight.
const REPS_ONLY_KEYS = new Set([
  'warmup_swimmers',
  'warmup_jumping_jacks',
  'warmup_horizontal_arm_swings',
  'warmup_torso_rotation_swings',
  'a_push_up',
  'custom_sit_up',
  'custom_burpee',
  // The assist machine takes weight OFF you, so a heavier stack is an easier
  // set -- tracking it would invert the personal record.
  'custom_assisted_dip',
])

/** Whether sets of this exercise record a weight. */
export function tracksWeight(exercise: Exercise): boolean {
  return exercise.type === 'reps' && !REPS_ONLY_KEYS.has(exercise.key)
}

/** What the logger asks for on this exercise, in plain words. */
export function loggingLabel(exercise: Exercise): string {
  if (exercise.type === 'time') {
    return inMinutes(exercise) ? 'Minutes, for each set.' : 'Seconds held, for each set.'
  }
  if (!tracksWeight(exercise)) return 'Reps, for each set.'
  if (exercise.equipment === 'bodyweight') {
    return 'Reps for each set, plus kg of any added weight (0 if none).'
  }
  return 'Kg and reps, for each set.'
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
