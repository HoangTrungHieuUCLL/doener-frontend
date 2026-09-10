// Central query key registry so invalidations stay consistent.
export const queryKeys = {
  exercises: () => ['exercises'] as const,
  session: (id: string) => ['session', id] as const,
  sessions: (page: number) => ['sessions', page] as const,
  plan: (from: string, to: string) => ['plan', from, to] as const,
  statsVolume: (limit: number) => ['stats', 'volume', limit] as const,
  statsPrs: () => ['stats', 'prs'] as const,
  together: () => ['together'] as const,
}
