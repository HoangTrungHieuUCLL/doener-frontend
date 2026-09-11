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

export interface SetPlanInput {
  date: string
  workout_key: WorkoutKey
}

export function useSetPlan() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: (entry: SetPlanInput) => api.post<PlanEntry>('/plan', entry),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['plan'] })
    },
  })
}

export function useDeletePlan() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: (date: string) => api.delete<void>(`/plan?date=${date}`),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['plan'] })
    },
  })
}

export type { WorkoutKey }
