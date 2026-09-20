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

/** Per-exercise recap of the last session each exercise was logged in.
 *
 * Pass the in-progress session id as `excludeSessionId` so "last time" keeps
 * meaning a *previous* session and doesn't start reflecting sets logged
 * moments ago in the current one. */
export function useLastSets(excludeSessionId: number | null = null) {
  return useQuery({
    queryKey: queryKeys.statsLastSets(excludeSessionId),
    queryFn: () =>
      api.get<LastSet[]>(
        excludeSessionId === null
          ? '/stats/last-sets'
          : `/stats/last-sets?exclude_session_id=${excludeSessionId}`,
      ),
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
