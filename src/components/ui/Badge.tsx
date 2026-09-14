import type { ReactNode } from 'react'

type Tone = 'neutral' | 'accent' | 'highlight' | 'positive' | 'negative'

// Neutral is decorative (default/unset state) so it goes full glass;
// the rest carry status meaning and keep a solid, legible fill.
const toneClasses: Record<Tone, string> = {
  neutral: 'glass text-ink',
  accent: 'bg-accent text-white border border-white/25',
  highlight: 'bg-highlight text-ink border border-ink/15',
  positive: 'bg-positive text-ink border border-ink/15',
  negative: 'bg-negative-soft text-negative-text border border-ink/10',
}

export function Badge({ tone = 'neutral', children }: { tone?: Tone; children: ReactNode }) {
  return (
    <span
      className={`inline-flex items-center gap-1 rounded-full px-2.5 py-0.5 font-display text-[12px] font-extrabold uppercase tracking-[0.03em] ${toneClasses[tone]}`}
    >
      {children}
    </span>
  )
}
