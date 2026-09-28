import { useState } from 'react'
import type { Exercise } from '../api/types'
import { Button } from './ui/Button'
import { ExerciseCard } from './ui/ExerciseCard'
import { CATALOG_SECTIONS, targetLabel } from '../lib/workouts'

export type Placement = 'next' | 'end'

/** Pick any exercise from the catalog and drop it into the session in
 * progress, either as the next thing to do or as extra work at the end. */
/** Catalog sections in browsing order, except that a section with nothing
 * left to add drops to the bottom -- during Workout A its own exercises and
 * the warm-ups are all in the session already, and they would otherwise fill
 * the first screen with tiles that cannot be tapped. */
function orderedSections(exercises: Exercise[], inQueueIds: Set<number>) {
  const sections = CATALOG_SECTIONS.map(({ key, label }) => ({
    key,
    label,
    items: exercises.filter((e) => e.category === key).sort((a, b) => a.id - b.id),
  })).filter((section) => section.items.length > 0)

  const addable = (section: { items: Exercise[] }) =>
    section.items.some((e) => !inQueueIds.has(e.id))
  return [...sections.filter(addable), ...sections.filter((s) => !addable(s))]
}

export function AddExerciseSheet({
  exercises,
  inQueueIds,
  currentExerciseName,
  onAdd,
  onClose,
}: {
  exercises: Exercise[]
  /** Already part of this session -- offered, but not addable twice. */
  inQueueIds: Set<number>
  /** The exercise being worked on, or null when the list is finished. */
  currentExerciseName: string | null
  onAdd: (exerciseId: number, placement: Placement) => void
  onClose: () => void
}) {
  const [picked, setPicked] = useState<Exercise | null>(null)

  return (
    <div
      className="animate-overlay-in scrim fixed inset-0 z-50 flex items-end justify-center sm:items-center"
      onClick={onClose}
    >
      <div
        role="dialog"
        aria-modal="true"
        aria-label="Add an exercise"
        className="animate-dialog-in flex max-h-[85vh] w-full max-w-md flex-col rounded-t-[var(--radius-card)] border-2 border-ink bg-bg shadow-[var(--shadow-lg)] sm:rounded-[var(--radius-card)]"
        onClick={(e) => e.stopPropagation()}
      >
        <header className="flex items-center justify-between gap-3 border-b-2 border-ink/10 p-4">
          <p className="headline text-[26px]">
            {picked ? 'Add to this workout' : (
              <>
                Add an <span className="marker">exercise</span>
              </>
            )}
          </p>
          <button
            type="button"
            onClick={onClose}
            aria-label="Close"
            className="tap-target press flex shrink-0 items-center justify-center rounded-full border-2 border-ink bg-surface text-ink shadow-[var(--shadow-pop)]"
          >
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3">
              <path d="M6 6l12 12M18 6L6 18" strokeLinecap="round" />
            </svg>
          </button>
        </header>

        {picked ? (
          <div className="flex flex-col gap-4 p-4">
            <ExerciseCard
              exerciseKey={picked.key}
              title={picked.name}
              subtitle={`${targetLabel(picked)}${picked.per_side ? ' per side' : ''}`}
              className="h-40"
            />
            <div className="flex flex-col gap-2">
              <Button
                size="md"
                onClick={() => onAdd(picked.id, 'next')}
                disabled={currentExerciseName === null}
              >
                Do it next
              </Button>
              {currentExerciseName !== null && (
                <p className="-mt-1 text-center text-[12px] text-ink-tertiary">
                  Straight after {currentExerciseName}
                </p>
              )}
              <Button variant="secondary" size="md" onClick={() => onAdd(picked.id, 'end')}>
                Add to the end
              </Button>
              <Button variant="ghost" size="md" onClick={() => setPicked(null)}>
                Pick a different one
              </Button>
            </div>
          </div>
        ) : (
          <div className="flex flex-col gap-6 overflow-y-auto p-4">
            {orderedSections(exercises, inQueueIds).map(({ key, label, items }) => {
              return (
                <section key={key} className="flex flex-col gap-3">
                  <h3 className="eyebrow">{label}</h3>
                  <div className="grid grid-cols-2 gap-3">
                    {items.map((ex) => {
                      // Sets are recorded per exercise, so the same exercise
                      // cannot appear twice in one session -- its sets would
                      // be indistinguishable between the two slots.
                      const already = inQueueIds.has(ex.id)
                      return (
                        <button
                          key={ex.id}
                          type="button"
                          disabled={already}
                          onClick={() => setPicked(ex)}
                          className={`text-left ${already ? 'cursor-not-allowed opacity-45' : 'press'}`}
                        >
                          <ExerciseCard
                            exerciseKey={ex.key}
                            title={ex.name}
                            subtitle={already ? 'Already in this workout' : targetLabel(ex)}
                            className="aspect-[4/3]"
                          />
                        </button>
                      )
                    })}
                  </div>
                </section>
              )
            })}
          </div>
        )}
      </div>
    </div>
  )
}
