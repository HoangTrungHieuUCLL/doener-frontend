import { useMemo, useState } from 'react'
import { usePlan, useSetPlan } from '../api/hooks/usePlan'
import type { WorkoutKey } from '../api/types'
import { Card } from '../components/ui/Card'
import { addDays, formatDayLabel, toISODate, todayISO } from '../lib/date'

const WORKOUT_LABELS: Record<WorkoutKey, string> = {
  a: 'Workout A',
  b: 'Workout B',
  c: 'Workout C',
  cardio: 'Cardio',
}

const WORKOUT_OPTIONS: WorkoutKey[] = ['a', 'b', 'c', 'cardio']

export function Plan() {
  const days = useMemo(() => {
    const base = new Date()
    return Array.from({ length: 7 }, (_, i) => toISODate(addDays(base, i)))
  }, [])
  const from = days[0]
  const to = days[days.length - 1]
  const { data: planEntries, isLoading } = usePlan(from, to)
  const setPlan = useSetPlan()
  const [editingDay, setEditingDay] = useState<string | null>(null)

  const planByDate = useMemo(() => {
    const map: Record<string, WorkoutKey> = {}
    for (const entry of planEntries ?? []) {
      map[entry.date] = entry.workout_key
    }
    return map
  }, [planEntries])

  async function assign(date: string, workoutKey: WorkoutKey) {
    await setPlan.mutateAsync({ date, workout_key: workoutKey })
    setEditingDay(null)
  }

  const today = todayISO()

  return (
    <div className="flex flex-col gap-6">
      <header>
        <h1 className="text-[24px] font-semibold text-ink">Plan</h1>
        <p className="text-[14px] text-ink-secondary">This week — tap a day to assign a workout.</p>
      </header>

      {isLoading ? (
        <p className="text-center text-ink-tertiary">Loading…</p>
      ) : (
        <div className="flex flex-col gap-3">
          {days.map((date) => {
            const assigned = planByDate[date]
            const isToday = date === today
            const isEditing = editingDay === date
            return (
              <Card key={date} className={isToday ? 'border-accent' : ''}>
                <button
                  onClick={() => setEditingDay(isEditing ? null : date)}
                  className="tap-target flex w-full items-center justify-between text-left"
                >
                  <div>
                    <p className="text-[15px] font-semibold text-ink">
                      {formatDayLabel(date)}
                      {isToday && <span className="ml-2 text-[12px] font-medium text-accent-strong">Today</span>}
                    </p>
                    <p className="text-[13px] text-ink-secondary">
                      {assigned ? WORKOUT_LABELS[assigned] : 'No workout assigned'}
                    </p>
                  </div>
                  <svg
                    width="18"
                    height="18"
                    viewBox="0 0 24 24"
                    fill="none"
                    stroke="currentColor"
                    strokeWidth="2"
                    className={`text-ink-tertiary transition-transform ${isEditing ? 'rotate-180' : ''}`}
                  >
                    <path d="M6 9l6 6 6-6" strokeLinecap="round" strokeLinejoin="round" />
                  </svg>
                </button>

                {isEditing && (
                  <div className="mt-3 grid grid-cols-2 gap-2 border-t border-border pt-3 sm:grid-cols-4">
                    {WORKOUT_OPTIONS.map((key) => (
                      <button
                        key={key}
                        onClick={() => assign(date, key)}
                        disabled={setPlan.isPending}
                        className={`tap-target rounded-[var(--radius-control)] border px-3 py-2 text-[13px] font-medium ${
                          assigned === key
                            ? 'border-accent bg-accent-soft text-accent-strong'
                            : 'border-border text-ink-secondary'
                        }`}
                      >
                        {WORKOUT_LABELS[key]}
                      </button>
                    ))}
                  </div>
                )}
              </Card>
            )
          })}
        </div>
      )}
    </div>
  )
}
