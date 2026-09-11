// Domain types mirroring the Doener backend's Pydantic schemas exactly
// (see app/schemas.py in the backend repo -- that file is the source of
// truth this was transcribed from). The frontend never hardcodes a backend
// origin -- see api/client.ts.

/** Every value the backend can store on a planned day. */
export type WorkoutKey = 'A' | 'B' | 'C' | 'cardio' | 'rest' | 'custom'
/** The subset that can actually be used to start a session. */
export type SessionWorkoutKey = 'A' | 'B' | 'C' | 'cardio'

export interface User {
  id: number
  username: string
  display_name: string
}

export interface UserMe extends User {
  created_at: string
}

export interface AuthResponse {
  access_token: string
  token_type: string
  user: User
}

export type ExerciseType = 'reps' | 'time'

export interface Exercise {
  id: number
  key: string
  name: string
  /** "warmup" | "A" | "B" | "C" */
  category: string
  type: ExerciseType
  sets: number
  reps: number | null
  duration_sec: number | null
  tempo: string | null
  rest_sec: number
  per_side: boolean
  equipment: string | null
}

export interface PlanEntry {
  id: number
  date: string // YYYY-MM-DD
  workout_key: WorkoutKey
}

export interface Session {
  id: number
  date: string
  workout_key: SessionWorkoutKey
  started_at: string
  finished_at: string | null
  duration_sec: number | null
  total_volume_kg: number | null
}

export interface SetLog {
  id: number
  session_id: number
  exercise_id: number
  set_number: number
  weight_kg: number | null
  reps: number | null
  duration_sec: number | null
  is_new_pr: boolean
}

export interface CardioLog {
  id: number
  session_id: number
  duration_sec: number
  distance_km: number
}

export interface SessionSetDetail {
  id: number
  exercise_id: number
  exercise_name: string
  set_number: number
  weight_kg: number | null
  reps: number | null
  duration_sec: number | null
}

export interface CardioDetail {
  duration_sec: number
  distance_km: number
}

/** GET /sessions/:id -- the create/finish endpoints return the narrower
 * `Session` shape (no nested sets/cardio). */
export interface SessionDetail {
  id: number
  date: string
  workout_key: SessionWorkoutKey
  started_at: string
  finished_at: string | null
  duration_sec: number | null
  total_volume_kg: number | null
  sets: SessionSetDetail[]
  cardio: CardioDetail | null
}

export interface SessionListResponse {
  items: Session[]
  total: number
}

export interface PersonalRecord {
  exercise_id: number
  exercise_name: string
  best_weight_kg: number
  achieved_at: string
}

export interface VolumePoint {
  session_id: number
  date: string
  total_volume_kg: number
  workout_key: string
}

export interface LastSet {
  exercise_id: number
  weight_kg: number | null
  reps: number | null
  duration_sec: number | null
}

export interface ExerciseProgressPoint {
  session_id: number
  date: string
  weight_kg: number | null
  reps: number | null
}

export interface ConsistencyDay {
  date: string
  planned_key: WorkoutKey | null
  done_key: WorkoutKey | null
}

export interface TodayPlan {
  workout_key: WorkoutKey
}

export interface LastSessionSummary {
  id: number
  date: string
  workout_key: WorkoutKey
  total_volume_kg: number | null
}

export interface TogetherEntry {
  user_id: number
  username: string
  display_name: string
  today_plan: TodayPlan | null
  today_status: 'done' | 'not_done'
  last_session: LastSessionSummary | null
  session_count: number
}
