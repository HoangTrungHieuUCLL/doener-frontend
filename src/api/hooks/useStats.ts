import { useQuery } from '@tanstack/react-query'
import { api } from '../client'
import { queryKeys } from '../queryKeys'
import type { ConsistencyDay, ExerciseProgressPoint, LastSet, PersonalRecord, VolumePoint } from '../types'

export function useVolumeStats(limit = 10) {
  return useQuery({
    queryKey: queryKeys.statsVolume(limit),
    queryFn: () => api.get<VolumePoint[]>(`/stats/volume?limit=${limit}`),
  })
}

export function usePrStats() {
  return useQuery({
    queryKey: queryKeys.statsPrs(),
    queryFn: () => api.get<PersonalRecord[]>('/stats/prs'),
  })
}

/** Most recently logged set per exercise, across all past sessions. */
export function useLastSets() {
  return useQuery({
    queryKey: queryKeys.statsLastSets(),
    queryFn: () => api.get<LastSet[]>('/stats/last-sets'),
  })
}

export function useExerciseProgress(exerciseId: number | null) {
  return useQuery({
    queryKey: queryKeys.statsExerciseProgress(exerciseId ?? -1),
    queryFn: () => api.get<ExerciseProgressPoint[]>(`/stats/exercise/${exerciseId}/progress`),
    enabled: exerciseId !== null,
  })
}

export function useConsistency(from: string, to: string) {
  return useQuery({
    queryKey: queryKeys.statsConsistency(from, to),
    queryFn: () => api.get<ConsistencyDay[]>(`/stats/consistency?from=${from}&to=${to}`),
  })
}
