// Central query key registry so invalidations stay consistent.
export const queryKeys = {
  exercises: () => ['exercises'] as const,
  session: (id: number) => ['session', id] as const,
  sessions: (limit: number, offset: number) => ['sessions', limit, offset] as const,
  plan: (from: string, to: string) => ['plan', from, to] as const,
  statsVolume: (limit: number) => ['stats', 'volume', limit] as const,
  statsPrs: () => ['stats', 'prs'] as const,
  statsLastSets: (excludeSessionId: number | null) =>
    ['stats', 'last-sets', excludeSessionId] as const,
  statsExerciseProgress: (exerciseId: number) => ['stats', 'exercise', exerciseId, 'progress'] as const,
  statsConsistency: (from: string, to: string) => ['stats', 'consistency', from, to] as const,
  together: () => ['together'] as const,
}
