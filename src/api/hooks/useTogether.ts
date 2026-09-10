import { useQuery } from '@tanstack/react-query'
import { api } from '../client'
import { queryKeys } from '../queryKeys'
import type { TogetherEntry } from '../types'

/**
 * Polls GET /together every ~6s. Because this hook is only called from the
 * Together page component, TanStack Query's refetchInterval only runs while
 * that component (and therefore this query observer) is mounted -- there is
 * no global interval, so navigating away stops the polling automatically.
 */
export function useTogether() {
  return useQuery({
    queryKey: queryKeys.together(),
    queryFn: () => api.get<TogetherEntry[]>('/together'),
    refetchInterval: 6000,
    refetchIntervalInBackground: false,
  })
}
