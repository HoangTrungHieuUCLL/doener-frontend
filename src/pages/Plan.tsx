import { useMemo, useState } from 'react'
import { usePlan, useSetPlan } from '../api/hooks/usePlan'
import type { WorkoutKey } from '../api/types'
import { Card } from '../components/ui/Card'
import { Calendar } from '../components/ui/Calendar'
import { Button } from '../components/ui/Button'
import { monthDates, nextWeekdayOccurrences, todayISO, WEEKDAY_NAMES } from '../lib/date'
import { WORKOUT_DOT, WORKOUT_LABELS, WORKOUT_OPTIONS } from '../lib/workouts'

const REPEAT_WEEKS = 8

function weekdayName(iso: string): string {
  const [y, m, d] = iso.split('-').map(Number)
  return WEEKDAY_NAMES[new Date(y, m - 1, d).getDay()]
}

export function Plan() {
  const [month, setMonth] = useState(() => new Date())
  const [selectedDays, setSelectedDays] = useState<string[]>([todayISO()])
  const [repeatPrompt, setRepeatPrompt] = useState<{ date: string; key: WorkoutKey } | null>(null)

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

  function toggleDay(iso: string) {
    setSelectedDays((prev) => (prev.includes(iso) ? prev.filter((d) => d !== iso) : [...prev, iso]))
    setRepeatPrompt(null)
  }

  async function assign(key: WorkoutKey) {
    await Promise.all(selectedDays.map((date) => setPlan.mutateAsync({ date, workout_key: key })))
    if (selectedDays.length === 1) {
      setRepeatPrompt({ date: selectedDays[0], key })
    }
  }

  async function confirmRepeat() {
    if (!repeatPrompt) return
    const dates = nextWeekdayOccurrences(repeatPrompt.date, REPEAT_WEEKS)
    await Promise.all(dates.map((date) => setPlan.mutateAsync({ date, workout_key: repeatPrompt.key })))
    setRepeatPrompt(null)
  }

  return (
    <div className="flex flex-col gap-6">
      <header>
        <h1 className="text-[24px] font-semibold text-ink">Plan</h1>
        <p className="text-[14px] text-ink-secondary">
          Tap one or more days, then pick a workout for all of them.
        </p>
      </header>

      {isLoading ? (
        <p className="text-center text-ink-tertiary">Loading…</p>
      ) : (
        <>
          <Card>
            <Calendar
              month={month}
              onMonthChange={setMonth}
              selected={selectedDays}
              onSelectDay={toggleDay}
              renderDay={(iso) => {
                const key = planByDate[iso]
                return key ? <span className={`h-1.5 w-1.5 rounded-full ${WORKOUT_DOT[key]}`} /> : null
              }}
            />
          </Card>

          <Card>
            <p className="mb-3 text-[13px] font-medium text-ink-secondary">
              {selectedDays.length === 0
                ? 'No days selected'
                : selectedDays.length === 1
                  ? `${weekdayName(selectedDays[0])} · ${planByDate[selectedDays[0]] ? WORKOUT_LABELS[planByDate[selectedDays[0]]] : 'no workout assigned'}`
                  : `${selectedDays.length} days selected`}
            </p>
            <div className="grid grid-cols-2 gap-2 sm:grid-cols-4">
              {WORKOUT_OPTIONS.map((key) => (
                <button
                  key={key}
                  onClick={() => assign(key)}
                  disabled={setPlan.isPending || selectedDays.length === 0}
                  className={`tap-target rounded-[var(--radius-control)] border px-3 py-2 text-[13px] font-medium disabled:opacity-40 ${
                    selectedDays.length === 1 && planByDate[selectedDays[0]] === key
                      ? 'border-accent bg-accent-soft text-accent-strong'
                      : 'border-border text-ink-secondary'
                  }`}
                >
                  {WORKOUT_LABELS[key]}
                </button>
              ))}
            </div>
          </Card>

          {repeatPrompt && (
            <Card className="flex items-center justify-between gap-3">
              <p className="text-[14px] text-ink">
                Repeat {WORKOUT_LABELS[repeatPrompt.key]} every {weekdayName(repeatPrompt.date)} for the
                next {REPEAT_WEEKS} weeks?
              </p>
              <div className="flex shrink-0 gap-2">
                <Button variant="secondary" size="md" onClick={() => setRepeatPrompt(null)}>
                  No
                </Button>
                <Button size="md" onClick={confirmRepeat} disabled={setPlan.isPending}>
                  Yes
                </Button>
              </div>
            </Card>
          )}
        </>
      )}
    </div>
  )
}
