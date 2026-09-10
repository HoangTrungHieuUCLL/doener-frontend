import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { api } from '../client'
import { queryKeys } from '../queryKeys'
import type { PlanEntry, WorkoutKey } from '../types'

export function usePlan(from: string, to: string) {
  return useQuery({
    queryKey: queryKeys.plan(from, to),
    queryFn: () => api.get<PlanEntry[]>(`/plan?from=${from}&to=${to}`),
  })
}

export function useSetPlan() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: (entry: PlanEntry) => api.post<PlanEntry>('/plan', entry),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['plan'] })
    },
  })
}

export type { WorkoutKey }
