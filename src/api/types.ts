// Domain types shared across the app. These describe the shape of the Doener
// backend's JSON responses as documented in the product spec. The frontend
// never hardcodes a backend origin -- see api/client.ts.

export type WorkoutKey = 'a' | 'b' | 'c' | 'cardio'

export interface User {
  id: string
  name: string
  email: string
}

export interface AuthResponse {
  token: string
  user: User
}

export type ExerciseCategory = 'warmup' | WorkoutKey

/** How a set of this exercise is logged. */
export type ExerciseLogType = 'reps' | 'time' | 'cardio'

export interface Exercise {
  key: string
  name: string
  category: ExerciseCategory
  equipment: string
  log_type: ExerciseLogType
  per_side: boolean
  rest_sec: number
  target_sets?: number
  target_reps?: number
  order: number
}

export interface Session {
  id: string
  user_id: string
  workout_key: WorkoutKey
  started_at: string
  finished_at: string | null
  total_volume: number | null
  /** Present on the session-detail endpoint (GET /sessions/:id). */
  sets?: SetLog[]
  cardio_logs?: CardioLog[]
}

export interface SetLog {
  id: string
  session_id: string
  exercise_key: string
  side: 'left' | 'right' | null
  weight: number | null
  reps: number | null
  duration_sec: number | null
  is_new_pr: boolean
  created_at: string
}

export interface CardioLog {
  id: string
  session_id: string
  duration_min: number
  distance_km: number | null
  notes: string | null
  created_at: string
}

export interface PlanEntry {
  date: string // YYYY-MM-DD
  workout_key: WorkoutKey
}

export interface SessionListResponse {
  items: Session[]
  total: number
  page: number
  page_size: number
}

export interface VolumePoint {
  date: string
  volume: number
}

export interface PersonalRecord {
  exercise_key: string
  exercise_name: string
  value: number
  unit: 'kg' | 'sec'
  achieved_at: string
}

export interface TogetherEntry {
  user_id: string
  name: string
  today_plan: WorkoutKey | null
  today_done: boolean
  last_session: {
    workout_key: WorkoutKey
    finished_at: string | null
    total_volume: number | null
  } | null
  session_count: number
}
