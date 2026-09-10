// Central query key registry so invalidations stay consistent.
export const queryKeys = {
  exercises: () => ['exercises'] as const,
  session: (id: number) => ['session', id] as const,
  sessions: (limit: number, offset: number) => ['sessions', limit, offset] as const,
  plan: (from: string, to: string) => ['plan', from, to] as const,
  statsVolume: (limit: number) => ['stats', 'volume', limit] as const,
  statsPrs: () => ['stats', 'prs'] as const,
  together: () => ['together'] as const,
}
