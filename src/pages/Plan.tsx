import { useMemo, useState } from 'react'
import { usePlan, useSetPlan } from '../api/hooks/usePlan'
import type { WorkoutKey } from '../api/types'
import { Card } from '../components/ui/Card'
import { Calendar } from '../components/ui/Calendar'
import { formatDayLabel, monthDates, todayISO } from '../lib/date'

const WORKOUT_LABELS: Record<WorkoutKey, string> = {
  A: 'Workout A',
  B: 'Workout B',
  C: 'Workout C',
  cardio: 'Cardio',
  rest: 'Rest',
  custom: 'Custom',
}

const WORKOUT_DOT: Record<WorkoutKey, string> = {
  A: 'bg-accent',
  B: 'bg-positive',
  C: 'bg-person-b',
  cardio: 'bg-negative',
  rest: 'bg-ink-tertiary',
  custom: 'bg-ink-tertiary',
}

// Only these are offered from the Plan UI; "rest"/"custom" exist in the
// backend's WorkoutKey but aren't part of this app's assignable options.
const WORKOUT_OPTIONS: WorkoutKey[] = ['A', 'B', 'C', 'cardio']

export function Plan() {
  const [month, setMonth] = useState(() => new Date())
  const [selectedDay, setSelectedDay] = useState(todayISO())

  const dates = useMemo(() => monthDates(month), [month])
  const from = dates[0]
  const to = dates[dates.length - 1]
  const { data: planEntries, isLoading } = usePlan(from, to)
  const setPlan = useSetPlan()

  const planByDate = useMemo(() => {
    const map: Record<string, WorkoutKey> = {}
    for (const entry of planEntries ?? []) {
      map[entry.date] = entry.workout_key
    }
    return map
  }, [planEntries])

  async function assign(date: string, workoutKey: WorkoutKey) {
    await setPlan.mutateAsync({ date, workout_key: workoutKey })
  }

  const assignedForSelected = planByDate[selectedDay]

  return (
    <div className="flex flex-col gap-6">
      <header>
        <h1 className="text-[24px] font-semibold text-ink">Plan</h1>
        <p className="text-[14px] text-ink-secondary">Tap a day, then pick a workout.</p>
      </header>

      {isLoading ? (
        <p className="text-center text-ink-tertiary">Loading…</p>
      ) : (
        <>
          <Card>
            <Calendar
              month={month}
              onMonthChange={setMonth}
              selected={selectedDay}
              onSelectDay={setSelectedDay}
              renderDay={(iso) => {
                const key = planByDate[iso]
                return key ? <span className={`h-1.5 w-1.5 rounded-full ${WORKOUT_DOT[key]}`} /> : null
              }}
            />
          </Card>

          <Card>
            <p className="text-[15px] font-semibold text-ink">{formatDayLabel(selectedDay)}</p>
            <p className="mb-3 text-[13px] text-ink-secondary">
              {assignedForSelected ? WORKOUT_LABELS[assignedForSelected] : 'No workout assigned'}
            </p>
            <div className="grid grid-cols-2 gap-2 sm:grid-cols-4">
              {WORKOUT_OPTIONS.map((key) => (
                <button
                  key={key}
                  onClick={() => assign(selectedDay, key)}
                  disabled={setPlan.isPending}
                  className={`tap-target rounded-[var(--radius-control)] border px-3 py-2 text-[13px] font-medium ${
                    assignedForSelected === key
                      ? 'border-accent bg-accent-soft text-accent-strong'
                      : 'border-border text-ink-secondary'
                  }`}
                >
                  {WORKOUT_LABELS[key]}
                </button>
              ))}
            </div>
          </Card>
        </>
      )}
    </div>
  )
}
