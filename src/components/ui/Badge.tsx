import type { ReactNode } from 'react'

type Tone = 'neutral' | 'accent' | 'highlight' | 'positive' | 'negative'

const toneClasses: Record<Tone, string> = {
  neutral: 'bg-surface-alt text-ink',
  accent: 'bg-accent text-white',
  highlight: 'bg-highlight text-ink',
  positive: 'bg-positive text-ink',
  negative: 'bg-negative-soft text-negative-text',
}

export function Badge({ tone = 'neutral', children }: { tone?: Tone; children: ReactNode }) {
  return (
    <span
      className={`inline-flex items-center gap-1 rounded-full border-2 border-ink px-2.5 py-0.5 font-display text-[12px] font-extrabold uppercase tracking-[0.03em] ${toneClasses[tone]}`}
    >
      {children}
    </span>
  )
}
