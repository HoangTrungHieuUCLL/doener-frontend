import { useMemo, useState } from 'react'
import { useExercises } from '../api/hooks/useExercises'
import type { Exercise } from '../api/types'
import { ExerciseCard } from '../components/ui/ExerciseCard'
import { EXERCISE_GUIDES } from '../lib/exerciseGuides'
import { targetLabel, WORKOUT_LABELS } from '../lib/workouts'

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
