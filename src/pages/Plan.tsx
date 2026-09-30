import { useMemo, useState } from 'react'
import { useDeletePlan, usePlan, useSetPlan } from '../api/hooks/usePlan'
import { useSessionsOnDate } from '../api/hooks/useSessions'
import type { WorkoutKey } from '../api/types'
import { Card } from '../components/ui/Card'
import { Calendar } from '../components/ui/Calendar'
import { Button } from '../components/ui/Button'
import { monthDates, nextWeekdayOccurrences, todayISO, WEEKDAY_NAMES } from '../lib/date'
import { WORKOUT_DOT, WORKOUT_LABELS, WORKOUT_OPTIONS } from '../lib/workouts'

const REPEAT_WEEKS = 8

// Clearer than the generic "Custom" label everywhere else, just for this picker.
const PICKER_LABEL: Partial<Record<WorkoutKey, string>> = { custom: 'Choose my own' }

function weekdayName(iso: string): string {
  const [y, m, d] = iso.split('-').map(Number)
  return WEEKDAY_NAMES[new Date(y, m - 1, d).getDay()]
}

export function Plan() {
  const [month, setMonth] = useState(() => new Date())
  const [multiSelect, setMultiSelect] = useState(false)
  const [selectedDays, setSelectedDays] = useState<string[]>([todayISO()])
  // Single-day mode only: which workout was just picked, awaiting the
  // this-date-vs-every-weekday-vs-cancel choice.
  const [pendingPlan, setPendingPlan] = useState<{ date: string; key: WorkoutKey } | null>(null)
  // Single-day mode, on a day with a finished workout: the picker stays
  // hidden until "Yes" to planning another one, which is then added to that
  // day rather than replacing what was planned.
  const [addingAnother, setAddingAnother] = useState(false)

  const dates = useMemo(() => monthDates(month), [month])
  const from = dates[0]
  const to = dates[dates.length - 1]
  const { data: planEntries, isLoading } = usePlan(from, to)
  const setPlan = useSetPlan()
  const deletePlan = useDeletePlan()

  // Every workout planned per day, in the order they were planned.
  const planByDate = useMemo(() => {
    const map: Record<string, WorkoutKey[]> = {}
    for (const entry of planEntries ?? []) {
      ;(map[entry.date] ??= []).push(entry.workout_key)
    }
    return map
  }, [planEntries])

  const singleDay = !multiSelect && selectedDays.length === 1 ? selectedDays[0] : null
  const { data: daySessions } = useSessionsOnDate(singleDay)
  const workedOut = singleDay !== null && (daySessions?.items ?? []).some((s) => s.finished_at !== null)
  const showPicker = !workedOut || addingAnother

  function toggleMultiSelect() {
    setMultiSelect((prev) => !prev)
    setSelectedDays([])
    setAddingAnother(false)
  }

  function selectDay(iso: string) {
    if (multiSelect) {
      setSelectedDays((prev) => (prev.includes(iso) ? prev.filter((d) => d !== iso) : [...prev, iso]))
    } else {
      setSelectedDays((prev) => (prev[0] === iso ? [] : [iso]))
      setAddingAnother(false)
    }
  }

  async function pickWorkout(key: WorkoutKey) {
    if (addingAnother && singleDay) {
      await setPlan.mutateAsync({ date: singleDay, workout_key: key, append: true })
      setAddingAnother(false)
      setSelectedDays([])
    } else if (multiSelect) {
      assignToSelected(key)
    } else {
      setPendingPlan({ date: selectedDays[0], key })
    }
  }

  async function assignToSelected(key: WorkoutKey) {
    await Promise.all(selectedDays.map((date) => setPlan.mutateAsync({ date, workout_key: key })))
    setSelectedDays([])
  }

  async function planForThisDate() {
    if (!pendingPlan) return
    await setPlan.mutateAsync({ date: pendingPlan.date, workout_key: pendingPlan.key })
    setPendingPlan(null)
    setSelectedDays([])
  }

  async function planForEveryWeekday() {
    if (!pendingPlan) return
    const dates = [pendingPlan.date, ...nextWeekdayOccurrences(pendingPlan.date, REPEAT_WEEKS)]
    await Promise.all(dates.map((date) => setPlan.mutateAsync({ date, workout_key: pendingPlan.key })))
    setPendingPlan(null)
    setSelectedDays([])
  }

  const removableDays = selectedDays.filter((d) => planByDate[d])

  async function removeSelected() {
    await Promise.all(removableDays.map((date) => deletePlan.mutateAsync(date)))
    setSelectedDays([])
  }

  return (
    <div className="flex flex-col gap-6">
      <header>
        <h1 className="headline text-[56px]">Plan</h1>
        <p className="mt-2 text-[15px] text-ink-secondary">
          {multiSelect ? 'Tap days, then pick a workout for all of them.' : 'Tap a day, then pick a workout.'}
        </p>
      </header>

      {isLoading ? (
        <p className="text-center text-ink-tertiary">Loading…</p>
      ) : (
        <>
          <Card>
            <div className="mb-3 flex items-center justify-between">
              <label className="flex items-center gap-2 text-[13px] font-semibold text-ink">
                <input type="checkbox" checked={multiSelect} onChange={toggleMultiSelect} className="h-5 w-5" />
                Choose multiple dates
              </label>
              {selectedDays.length > 0 && (
                <button
                  type="button"
                  onClick={() => setSelectedDays([])}
                  className="font-display text-[12px] font-extrabold uppercase tracking-[0.03em] text-accent-strong underline decoration-2 underline-offset-4"
                >
                  Clear selection
                </button>
              )}
            </div>
            <Calendar
              month={month}
              onMonthChange={setMonth}
              selected={selectedDays}
              onSelectDay={selectDay}
              renderDay={(iso) => {
                const keys = planByDate[iso]
                return keys ? (
                  <span className="flex gap-0.5">
                    {keys.map((key, i) => (
                      <span key={i} className={`dot ${WORKOUT_DOT[key]}`} />
                    ))}
                  </span>
                ) : null
              }}
            />
          </Card>

          <Card>
            <p className="eyebrow mb-3">
              {selectedDays.length === 0
                ? 'No days selected'
                : selectedDays.length === 1
                  ? `${weekdayName(selectedDays[0])} · ${planByDate[selectedDays[0]] ? planByDate[selectedDays[0]].map((k) => WORKOUT_LABELS[k]).join(' + ') : 'no workout assigned'}`
                  : `${selectedDays.length} days selected`}
            </p>
            {!showPicker && (
              <div className="flex flex-col items-start gap-3">
                <p className="headline text-[26px] leading-[1.02]">
                  Good workout {singleDay === todayISO() ? 'today' : `on ${weekdayName(singleDay!)}`}.
                  <br />
                  Planning to do another one?
                </p>
                <Button size="md" onClick={() => setAddingAnother(true)}>
                  Yes
                </Button>
              </div>
            )}
            {showPicker && (
              <div className="grid grid-cols-2 gap-2 sm:grid-cols-4">
                {WORKOUT_OPTIONS.map((key) => (
                  <button
                    key={key}
                    onClick={() => pickWorkout(key)}
                    disabled={setPlan.isPending || selectedDays.length === 0}
                    className={`tap-target press flex items-center justify-center gap-2 rounded-[var(--radius-control)] border-2 border-ink px-3 py-2 font-display text-[13px] font-extrabold uppercase tracking-[0.03em] shadow-[var(--shadow-pop)] disabled:opacity-40 disabled:shadow-none ${
                      !addingAnother && selectedDays.length === 1 && planByDate[selectedDays[0]]?.includes(key)
                        ? 'bg-highlight text-ink'
                        : 'bg-surface text-ink'
                    }`}
                  >
                    <span className={`dot ${WORKOUT_DOT[key]}`} />
                    {PICKER_LABEL[key] ?? WORKOUT_LABELS[key]}
                  </button>
                ))}
              </div>
            )}
            {removableDays.length > 0 && (
              <button
                type="button"
                onClick={removeSelected}
                disabled={deletePlan.isPending}
                className="tap-target press mt-3 w-full rounded-[var(--radius-control)] border-2 border-ink bg-negative-soft px-3 py-2 font-display text-[13px] font-extrabold uppercase tracking-[0.03em] text-negative-text shadow-[var(--shadow-pop)] disabled:opacity-40 disabled:shadow-none"
              >
                Remove plan{removableDays.length > 1 ? `s (${removableDays.length})` : ''}
              </button>
            )}
          </Card>

          {pendingPlan && (
            <div
              className="animate-overlay-in scrim fixed inset-x-0 top-0 z-50 h-[var(--app-h)] flex items-center justify-center p-4"
              onClick={() => setPendingPlan(null)}
            >
              <div
                className="animate-dialog-in glass w-full max-w-xs rounded-[var(--radius-card)] p-5"
                onClick={(e) => e.stopPropagation()}
              >
                {(() => {
                  const existing = planByDate[pendingPlan.date]
                  const changing = existing && !(existing.length === 1 && existing[0] === pendingPlan.key)
                  return (
                    <p className="headline mb-4 text-[22px] leading-[1.02]">
                      {changing
                        ? `${weekdayName(pendingPlan.date)}, ${pendingPlan.date.slice(5)} has already been planned with ${existing.map((k) => WORKOUT_LABELS[k]).join(' + ')}. Change to ${WORKOUT_LABELS[pendingPlan.key]}?`
                        : WORKOUT_LABELS[pendingPlan.key]}
                    </p>
                  )
                })()}
                <div className="flex flex-col gap-2">
                  <Button size="md" onClick={planForThisDate} disabled={setPlan.isPending}>
                    Plan for {weekdayName(pendingPlan.date)}, {pendingPlan.date.slice(5)}
                  </Button>
                  <Button size="md" onClick={planForEveryWeekday} disabled={setPlan.isPending}>
                    Plan for every {weekdayName(pendingPlan.date)}
                  </Button>
                  <Button variant="secondary" size="md" onClick={() => setPendingPlan(null)}>
                    Cancel
                  </Button>
                </div>
              </div>
            </div>
          )}
        </>
      )}
    </div>
  )
}
