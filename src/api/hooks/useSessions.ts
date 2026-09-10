import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { api } from '../client'
import { queryKeys } from '../queryKeys'
import type { CardioLog, Session, SessionListResponse, SetLog, WorkoutKey } from '../types'

const PAGE_SIZE = 10

export function useSession(id: string | null) {
  return useQuery({
    queryKey: queryKeys.session(id ?? 'none'),
    queryFn: () => api.get<Session>(`/sessions/${id}`),
    enabled: Boolean(id),
  })
}

export function useSessionsList(page: number) {
  return useQuery({
    queryKey: queryKeys.sessions(page),
    queryFn: () =>
      api.get<SessionListResponse>(`/sessions?page=${page}&page_size=${PAGE_SIZE}`),
    placeholderData: (prev) => prev,
  })
}

export function useStartSession() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: (workout_key: WorkoutKey) => api.post<Session>('/sessions', { workout_key }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['sessions'] })
    },
  })
}

export interface LogSetInput {
  sessionId: string
  exercise_key: string
  side?: 'left' | 'right'
  weight?: number
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
      queryClient.invalidateQueries({ queryKey: queryKeys.statsPrs() })
      queryClient.invalidateQueries({ queryKey: ['stats', 'volume'] })
    },
  })
}

export interface LogCardioInput {
  sessionId: string
  duration_min: number
  distance_km?: number
  notes?: string
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

export function useFinishSession() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: (sessionId: string) => api.post<Session>(`/sessions/${sessionId}/finish`),
    onSuccess: (_data, sessionId) => {
      queryClient.invalidateQueries({ queryKey: queryKeys.session(sessionId) })
      queryClient.invalidateQueries({ queryKey: ['sessions'] })
      queryClient.invalidateQueries({ queryKey: ['stats'] })
      queryClient.invalidateQueries({ queryKey: queryKeys.together() })
    },
  })
}
