import { useQuery } from '@tanstack/react-query'
import { api } from '../client'
import { queryKeys } from '../queryKeys'
import type { PersonalRecord, VolumePoint } from '../types'

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
