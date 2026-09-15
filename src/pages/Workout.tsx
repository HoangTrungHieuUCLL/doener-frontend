import { useMemo, useState } from 'react'
import { useExercises } from '../api/hooks/useExercises'
import type { Exercise } from '../api/types'
import { ExerciseCard } from '../components/ui/ExerciseCard'
import { EXERCISE_GUIDES } from '../lib/exerciseGuides'
import { targetLabel, WORKOUT_LABELS } from '../lib/workouts'

const PRINCIPLES: { title: string; body: string }[] = [
  {
    title: 'Focus',
    body: 'Leave your phone alone and consciously focus on the muscle doing the work each set — that mind-muscle connection makes the training stimulus more intense.',
  },
  {
    title: 'Tempo',
    body: 'The two numbers (e.g. "3/1") are time under tension: the first is seconds lowering the weight, the second is seconds lifting it against resistance. Time under tension is what drives the effect, so keep to it.',
  },
  {
    title: 'Rest',
    body: 'Stick to the listed rest time. Too short and you\'ll have less strength for the next set than planned; too long changes what the workout is training. Time it.',
  },
  {
    title: 'Progression',
    body: 'Quality over quantity — the last rep of a set should still be clean technique. Once every set is easy with good form, add weight next time. For bodyweight moves, progress via better execution, mind-muscle connection, or 1-2 extra reps.',
  },
  {
    title: 'Cardio',
    body: 'Fit in one cardio session a week, 30-45 minutes, at a heart rate of about 120-130 bpm — or a pace where you can still hold a conversation. Run, bike, row, or ski erg, your choice.',
  },
  {
    title: 'Schedule',
    body: 'Aim for 3 workouts a week (A, B, C), ideally with a rest day after each. The exact weekdays don\'t matter — hitting 3 sessions a week does.',
  },
]

const SECTIONS: { key: string; label: string }[] = [
  { key: 'warmup', label: 'Warm-up' },
  { key: 'A', label: WORKOUT_LABELS.A },
  { key: 'B', label: WORKOUT_LABELS.B },
  { key: 'C', label: WORKOUT_LABELS.C },
]

export function Workout() {
  const { data: exercises, isLoading } = useExercises()
  const [expandedId, setExpandedId] = useState<number | null>(null)

  const byCategory = useMemo(() => {
    const map: Record<string, Exercise[]> = {}
    for (const ex of exercises ?? []) {
      ;(map[ex.category] ??= []).push(ex)
    }
    for (const list of Object.values(map)) list.sort((a, b) => a.id - b.id)
    return map
  }, [exercises])

  return (
    <div className="flex flex-col gap-8">
      <header>
        <h1 className="headline text-[56px]">Workout</h1>
        <p className="mt-2 text-[15px] text-ink-secondary">Every exercise, how to do it, and what to watch for.</p>
      </header>

      <details open className="sticker group flex flex-col gap-4 rounded-[var(--radius-card)] bg-highlight-soft p-4">
        <summary className="headline flex cursor-pointer list-none items-center justify-between gap-2 text-[26px] [&::-webkit-details-marker]:hidden">
          <span>How this plan <span className="marker">works</span></span>
          <svg
            width="20"
            height="20"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="3"
            className="shrink-0 transition-transform group-open:rotate-180"
          >
            <path d="M6 9l6 6 6-6" strokeLinecap="round" strokeLinejoin="round" />
          </svg>
        </summary>
        <dl className="flex flex-col gap-3">
          {PRINCIPLES.map(({ title, body }) => (
            <div key={title}>
              <dt className="font-display text-[15px] font-extrabold uppercase tracking-[0.03em] text-ink">{title}</dt>
              <dd className="text-[14px] text-ink-secondary">{body}</dd>
            </div>
          ))}
        </dl>
      </details>

      {isLoading ? (
        <p className="text-center text-ink-tertiary">Loading…</p>
      ) : (
        SECTIONS.map(({ key, label }) => {
          const items = byCategory[key] ?? []
          const expandedEx = items.find((ex) => ex.id === expandedId)
          const guide = expandedEx && EXERCISE_GUIDES[expandedEx.key]
          return (
            <section key={key} className="flex flex-col gap-3">
              <h2 className="eyebrow text-[18px]">{label}</h2>
              <div className="grid grid-cols-2 gap-3">
                {items.map((ex) => {
                  const expanded = expandedId === ex.id
                  return (
                    <button
                      key={ex.id}
                      type="button"
                      onClick={() => setExpandedId(expanded ? null : ex.id)}
                      className="press text-left"
                    >
                      <ExerciseCard
                        exerciseKey={ex.key}
                        title={ex.name}
                        subtitle={`${targetLabel(ex)}${ex.per_side ? ' per side' : ''}`}
                        className={`aspect-square ${expanded ? 'outline outline-2 outline-offset-2 outline-accent' : ''}`}
                      />
                    </button>
                  )
                })}
              </div>
              {expandedEx && guide && (
                <div className="sticker animate-page-in flex flex-col gap-3 rounded-[var(--radius-card)] bg-surface p-4">
                  <p className="headline text-[22px] leading-[1.02]">{expandedEx.name}</p>
                  <div>
                    <p className="eyebrow mb-1.5 text-[12px]">How to</p>
                    <ol className="list-decimal space-y-1 pl-4 text-[14px] text-ink">
                      {guide.howTo.map((step, i) => (
                        <li key={i}>{step}</li>
                      ))}
                    </ol>
                  </div>
                  <div className="rounded-[var(--radius-control)] border-2 border-ink bg-negative-soft p-3">
                    <p className="eyebrow mb-0.5 text-[12px] text-negative-text">Watch out for</p>
                    <p className="text-[13px] text-ink">{guide.caution}</p>
                  </div>
                </div>
              )}
            </section>
          )
        })
      )}
    </div>
  )
}
