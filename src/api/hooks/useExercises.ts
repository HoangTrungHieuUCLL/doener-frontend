import { useQuery } from '@tanstack/react-query'
import { api } from '../client'
import { queryKeys } from '../queryKeys'
import type { Exercise } from '../types'

export function useExercises() {
  return useQuery({
    queryKey: queryKeys.exercises(),
    queryFn: () => api.get<Exercise[]>('/exercises'),
    // Exercise catalog is effectively static seed data.
    staleTime: 1000 * 60 * 60,
  })
}
