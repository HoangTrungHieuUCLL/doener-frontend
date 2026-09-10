import type { ReactNode } from 'react'

type Tone = 'neutral' | 'accent' | 'positive' | 'negative' | 'personA' | 'personB'

const toneClasses: Record<Tone, string> = {
  neutral: 'bg-surface-alt text-ink-secondary',
  accent: 'bg-accent-soft text-accent-strong',
  positive: 'bg-positive-soft text-positive-text',
  negative: 'bg-negative-soft text-negative-text',
  personA: 'bg-person-a-soft text-person-a-text',
  personB: 'bg-person-b-soft text-person-b-text',
}

export function Badge({ tone = 'neutral', children }: { tone?: Tone; children: ReactNode }) {
  return (
    <span
      className={`inline-flex items-center gap-1 rounded-full px-2.5 py-1 text-[12px] font-semibold ${toneClasses[tone]}`}
    >
      {children}
    </span>
  )
}
