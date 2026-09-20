import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { api } from '../client'
import { queryKeys } from '../queryKeys'
import type {
  CardioLog,
  Session,
  SessionDetail,
  SessionListResponse,
  SessionWorkoutKey,
  SetLog,
} from '../types'

export const PAGE_SIZE = 10

export function useSession(id: number | null) {
  return useQuery({
    queryKey: queryKeys.session(id ?? -1),
    queryFn: () => api.get<SessionDetail>(`/sessions/${id}`),
    enabled: id !== null,
  })
}

/** Page is 1-based in the UI; translated to limit/offset for the API. */
export function useSessionsList(page: number) {
  const limit = PAGE_SIZE
  const offset = (page - 1) * PAGE_SIZE
  return useQuery({
    queryKey: queryKeys.sessions(limit, offset),
    queryFn: () => api.get<SessionListResponse>(`/sessions?limit=${limit}&offset=${offset}`),
    placeholderData: (prev) => prev,
  })
}

export function useStartSession() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: (workout_key: SessionWorkoutKey) =>
      api.post<Session>('/sessions', { workout_key }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['sessions'] })
    },
  })
}

export interface LogSetInput {
  sessionId: number
  exercise_id: number
  weight_kg?: number
  reps?: number
  duration_sec?: number
}

export function useLogSet() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: ({ sessionId, ...body }: LogSetInput) =>
      api.post<SetLog>(`/sessions/${sessionId}/sets`, body),
    onSuccess: (_data, variables) => {
      queryClient.invalidateQueries({ queryKey: queryKeys.session(variables.sessionId) })
      // Refreshes the "Best" line on the exercise card when this set set one.
      queryClient.invalidateQueries({ queryKey: queryKeys.statsPrs() })
      queryClient.invalidateQueries({ queryKey: ['stats', 'volume'] })
      // Deliberately not stats/last-sets: "last time" describes a previous
      // session and must not start reflecting the set just logged. The
      // finish-session invalidation picks it up for the next workout.
    },
  })
}

export interface LogCardioInput {
  sessionId: number
  duration_sec: number
  distance_km: number
}

export function useLogCardio() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: ({ sessionId, ...body }: LogCardioInput) =>
      api.post<CardioLog>(`/sessions/${sessionId}/cardio`, body),
    onSuccess: (_data, variables) => {
      queryClient.invalidateQueries({ queryKey: queryKeys.session(variables.sessionId) })
    },
  })
}

export interface FinishSessionInput {
  sessionId: number
  /** Wall-clock elapsed minus any paused time; omit to let the backend use wall-clock. */
  duration_sec?: number
}

export function useFinishSession() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: ({ sessionId, duration_sec }: FinishSessionInput) =>
      api.post<Session>(`/sessions/${sessionId}/finish`, duration_sec !== undefined ? { duration_sec } : undefined),
    onSuccess: (_data, { sessionId }) => {
      queryClient.invalidateQueries({ queryKey: queryKeys.session(sessionId) })
      queryClient.invalidateQueries({ queryKey: ['sessions'] })
      queryClient.invalidateQueries({ queryKey: ['stats'] })
      queryClient.invalidateQueries({ queryKey: queryKeys.together() })
    },
  })
}
