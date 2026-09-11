import { useMemo, useState } from 'react'
import { Bar, BarChart, CartesianGrid, Cell, Line, LineChart, ResponsiveContainer, Tooltip, XAxis, YAxis } from 'recharts'
import { useExercises } from '../api/hooks/useExercises'
import { useConsistency, useExerciseProgress, useVolumeStats } from '../api/hooks/useStats'
import type { WorkoutKey } from '../api/types'
import { Card } from '../components/ui/Card'
import { Calendar } from '../components/ui/Calendar'
import { formatShortDate, monthDates, todayISO } from '../lib/date'

const CATEGORY_COLOR: Record<string, string> = {
  A: 'var(--color-accent)',
  B: 'var(--color-positive)',
  C: 'var(--color-person-b)',
  cardio: 'var(--color-negative)',
}

export function Insights() {
  return (
    <div className="flex flex-col gap-8">
      <header>
        <h1 className="text-[24px] font-semibold text-ink">Insights</h1>
        <p className="text-[14px] text-ink-secondary">Deeper trends behind the numbers.</p>
      </header>

      <ExerciseProgressChart />
      <VolumeByCategoryChart />
      <ConsistencyHeatmap />
    </div>
  )
}

function ExerciseProgressChart() {
  const { data: exercises } = useExercises()
  const nonWarmup = useMemo(
    () => (exercises ?? []).filter((e) => e.category !== 'warmup').sort((a, b) => a.name.localeCompare(b.name)),
    [exercises],
  )
  const [exerciseId, setExerciseId] = useState<number | null>(null)
  const selectedId = exerciseId ?? nonWarmup[0]?.id ?? null
  const { data, isLoading } = useExerciseProgress(selectedId)

  const chartData = (data ?? [])
    .filter((p) => p.weight_kg !== null)
    .map((p) => ({ ...p, label: formatShortDate(p.date) }))

  return (
    <section className="flex flex-col gap-3">
      <div className="flex items-center justify-between">
        <h2 className="text-[13px] font-semibold uppercase tracking-wide text-ink-tertiary">
          Per-exercise progress
        </h2>
        <select
          value={selectedId ?? ''}
          onChange={(e) => setExerciseId(Number(e.target.value))}
          className="tap-target rounded-[var(--radius-control)] border border-border bg-surface px-2 text-[13px] text-ink"
        >
          {nonWarmup.map((ex) => (
            <option key={ex.id} value={ex.id}>
              {ex.name}
            </option>
          ))}
        </select>
      </div>
      <Card>
        {isLoading ? (
          <p className="py-8 text-center text-ink-tertiary">Loading…</p>
        ) : chartData.length === 0 ? (
          <p className="py-8 text-center text-ink-tertiary">No weighted sets logged for this exercise yet.</p>
        ) : (
          <div className="h-52 w-full">
            <ResponsiveContainer width="100%" height="100%">
              <LineChart data={chartData} margin={{ top: 8, right: 12, left: -12, bottom: 0 }}>
                <XAxis
                  dataKey="label"
                  tick={{ fontSize: 11, fill: 'var(--color-ink-tertiary)' }}
                  axisLine={{ stroke: 'var(--color-border)' }}
                  tickLine={false}
                />
                <YAxis
                  tick={{ fontSize: 11, fill: 'var(--color-ink-tertiary)' }}
                  axisLine={false}
                  tickLine={false}
                  width={36}
                />
                <Tooltip
                  contentStyle={{ borderRadius: 10, border: '1px solid var(--color-border)', fontSize: 13 }}
                  formatter={(value) => [`${value} kg`, 'Weight']}
                />
                <Line
                  type="monotone"
                  dataKey="weight_kg"
                  stroke="var(--color-accent-strong)"
                  strokeWidth={2.5}
                  dot={{ r: 3, fill: 'var(--color-accent-strong)' }}
                  activeDot={{ r: 5 }}
                />
              </LineChart>
            </ResponsiveContainer>
          </div>
        )}
      </Card>
    </section>
  )
}

function VolumeByCategoryChart() {
  const { data, isLoading } = useVolumeStats(30)
  const chartData = (data ?? []).map((p) => ({ ...p, label: formatShortDate(p.date) }))

  return (
    <section className="flex flex-col gap-3">
      <h2 className="text-[13px] font-semibold uppercase tracking-wide text-ink-tertiary">
        Volume by category, last {chartData.length || 30} sessions
      </h2>
      <Card>
        {isLoading ? (
          <p className="py-8 text-center text-ink-tertiary">Loading…</p>
        ) : chartData.length === 0 ? (
          <p className="py-8 text-center text-ink-tertiary">No sessions yet.</p>
        ) : (
          <div className="h-52 w-full">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={chartData} margin={{ top: 8, right: 12, left: -12, bottom: 0 }}>
                <CartesianGrid vertical={false} stroke="var(--color-border)" />
                <XAxis
                  dataKey="label"
                  tick={{ fontSize: 11, fill: 'var(--color-ink-tertiary)' }}
                  axisLine={{ stroke: 'var(--color-border)' }}
                  tickLine={false}
                />
                <YAxis
                  tick={{ fontSize: 11, fill: 'var(--color-ink-tertiary)' }}
                  axisLine={false}
                  tickLine={false}
                  width={36}
                />
                <Tooltip
                  contentStyle={{ borderRadius: 10, border: '1px solid var(--color-border)', fontSize: 13 }}
                  formatter={(value, _name, props) => [
                    `${Math.round(Number(value))} kg`,
                    props.payload.workout_key,
                  ]}
                />
                <Bar dataKey="total_volume_kg" radius={[4, 4, 0, 0]}>
                  {chartData.map((p) => (
                    <Cell key={p.session_id} fill={CATEGORY_COLOR[p.workout_key] ?? 'var(--color-accent)'} />
                  ))}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          </div>
        )}
      </Card>
      <div className="flex flex-wrap gap-3 text-[12px] text-ink-tertiary">
        {(['A', 'B', 'C', 'cardio'] as WorkoutKey[]).map((key) => (
          <span key={key} className="flex items-center gap-1.5">
            <span className="h-2 w-2 rounded-full" style={{ background: CATEGORY_COLOR[key] }} />
            {key === 'cardio' ? 'Cardio' : `Workout ${key}`}
          </span>
        ))}
      </div>
    </section>
  )
}

function ConsistencyHeatmap() {
  const [month, setMonth] = useState(() => new Date())
  const dates = useMemo(() => monthDates(month), [month])
  const from = dates[0]
  const to = dates[dates.length - 1]
  const { data, isLoading } = useConsistency(from, to)

  const byDate = useMemo(() => {
    const map: Record<string, { planned: WorkoutKey | null; done: WorkoutKey | null }> = {}
    for (const d of data ?? []) map[d.date] = { planned: d.planned_key, done: d.done_key }
    return map
  }, [data])

  const streak = useMemo(() => {
    let count = 0
    let cursor = new Date()
    for (;;) {
      const iso = cursor.toISOString().slice(0, 10)
      const entry = byDate[iso]
      if (iso === todayISO() && !entry?.done) {
        // today not logged yet doesn't break an existing streak
      } else if (!entry?.done) {
        break
      } else {
        count += 1
      }
      cursor.setDate(cursor.getDate() - 1)
      if (count > 365) break
    }
    return count
  }, [byDate])

  return (
    <section className="flex flex-col gap-3">
      <div className="flex items-center justify-between">
        <h2 className="text-[13px] font-semibold uppercase tracking-wide text-ink-tertiary">Consistency</h2>
        <span className="text-[13px] font-medium text-accent-strong">
          {streak > 0 ? `${streak}-day streak` : 'No current streak'}
        </span>
      </div>
      <Card>
        {isLoading ? (
          <p className="py-8 text-center text-ink-tertiary">Loading…</p>
        ) : (
          <Calendar
            month={month}
            onMonthChange={setMonth}
            renderDay={(iso) => {
              const entry = byDate[iso]
              if (!entry?.planned && !entry?.done) return null
              const color = entry.done ? 'bg-positive' : 'bg-ink-tertiary'
              return <span className={`h-1.5 w-1.5 rounded-full ${color}`} />
            }}
          />
        )}
      </Card>
      <div className="flex gap-4 text-[12px] text-ink-tertiary">
        <span className="flex items-center gap-1.5">
          <span className="h-2 w-2 rounded-full bg-positive" /> Trained
        </span>
        <span className="flex items-center gap-1.5">
          <span className="h-2 w-2 rounded-full bg-ink-tertiary" /> Planned, not done
        </span>
      </div>
    </section>
  )
}
