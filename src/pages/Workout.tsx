import { useMemo, useState } from 'react'
import { useExercises } from '../api/hooks/useExercises'
import type { Exercise } from '../api/types'
import { Card } from '../components/ui/Card'
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
        <h1 className="font-serif text-[24px] font-semibold text-ink">Workout</h1>
        <p className="text-[14px] text-ink-secondary">Every exercise, how to do it, and what to watch for.</p>
      </header>

      <Card className="flex flex-col gap-3">
        <p className="text-[13px] font-semibold uppercase tracking-wide text-ink-tertiary">How this plan works</p>
        <dl className="flex flex-col gap-2.5">
          {PRINCIPLES.map(({ title, body }) => (
            <div key={title}>
              <dt className="text-[14px] font-semibold text-ink">{title}</dt>
              <dd className="text-[13px] text-ink-secondary">{body}</dd>
            </div>
          ))}
        </dl>
      </Card>

      {isLoading ? (
        <p className="text-center text-ink-tertiary">Loading…</p>
      ) : (
        SECTIONS.map(({ key, label }) => (
          <section key={key} className="flex flex-col gap-3">
            <h2 className="text-[13px] font-semibold uppercase tracking-wide text-ink-tertiary">{label}</h2>
            <div className="flex flex-col gap-3">
              {(byCategory[key] ?? []).map((ex) => {
                const expanded = expandedId === ex.id
                const guide = EXERCISE_GUIDES[ex.key]
                return (
                  <div
                    key={ex.id}
                    className="flex flex-col overflow-hidden rounded-[var(--radius-card)] border border-border bg-surface"
                  >
                    <button
                      type="button"
                      onClick={() => setExpandedId(expanded ? null : ex.id)}
                      className="text-left"
                    >
                      <ExerciseCard
                        exerciseKey={ex.key}
                        title={ex.name}
                        subtitle={`${targetLabel(ex)}${ex.per_side ? ' per side' : ''}`}
                        className="h-28"
                      />
                    </button>
                    {expanded && guide && (
                      <div className="animate-page-in flex flex-col gap-3 p-4">
                        <div>
                          <p className="mb-1 text-[12px] font-semibold uppercase tracking-wide text-ink-tertiary">
                            How to
                          </p>
                          <ol className="list-decimal space-y-1 pl-4 text-[14px] text-ink">
                            {guide.howTo.map((step, i) => (
                              <li key={i}>{step}</li>
                            ))}
                          </ol>
                        </div>
                        <div className="rounded-[var(--radius-control)] bg-negative-soft p-3">
                          <p className="mb-0.5 text-[12px] font-semibold uppercase tracking-wide text-negative-text">
                            Watch out for
                          </p>
                          <p className="text-[13px] text-ink">{guide.caution}</p>
                        </div>
                      </div>
                    )}
                  </div>
                )
              })}
            </div>
          </section>
        ))
      )}
    </div>
  )
}
