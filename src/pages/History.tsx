import { useState } from 'react'
import { Line, LineChart, ResponsiveContainer, Tooltip, XAxis, YAxis } from 'recharts'
import { PAGE_SIZE, useSessionsList } from '../api/hooks/useSessions'
import { usePrStats, useVolumeStats } from '../api/hooks/useStats'
import { Badge } from '../components/ui/Badge'
import { Card } from '../components/ui/Card'
import { Button } from '../components/ui/Button'
import { formatShortDate } from '../lib/date'
import { WORKOUT_DOT, WORKOUT_LABELS } from '../lib/workouts'

export function History() {
  return (
    <div className="flex flex-col gap-8">
      <header>
        <h1 className="headline text-[56px]">History</h1>
        <p className="mt-2 text-[15px] text-ink-secondary">Your training over time.</p>
      </header>

      <VolumeChart />
      <PrList />
      <SessionList />
    </div>
  )
}

function VolumeChart() {
  const { data, isLoading } = useVolumeStats(10)

  const chartData = (data ?? []).map((p) => ({ ...p, label: formatShortDate(p.date) }))

  return (
    <section className="flex flex-col gap-3">
      <h2 className="eyebrow">
        Volume, last {chartData.length || 10} sessions
      </h2>
      <Card>
        {isLoading ? (
          <p className="py-8 text-center text-ink-tertiary">Loading…</p>
        ) : chartData.length === 0 ? (
          <p className="py-8 text-center text-ink-tertiary">No sessions yet.</p>
        ) : (
          <div className="h-52 w-full">
            <ResponsiveContainer width="100%" height="100%">
              <LineChart data={chartData} margin={{ top: 8, right: 12, left: -4, bottom: 0 }}>
                <XAxis
                  dataKey="label"
                  tick={{ fontSize: 11, fill: 'var(--color-ink-tertiary)' }}
                  axisLine={{ stroke: 'var(--color-ink)', strokeWidth: 2 }}
                  tickLine={false}
                />
                <YAxis
                  tick={{ fontSize: 11, fill: 'var(--color-ink-tertiary)' }}
                  axisLine={false}
                  tickLine={false}
                  width={44}
                />
                <Tooltip
                  contentStyle={{
                    borderRadius: 12,
                    border: '2px solid var(--color-ink)',
                    boxShadow: 'var(--shadow-pop)',
                    fontSize: 13,
                    fontWeight: 600,
                  }}
                  formatter={(value) => [`${Math.round(Number(value))} kg`, 'Volume']}
                />
                <Line
                  type="monotone"
                  dataKey="total_volume_kg"
                  stroke="var(--color-accent)"
                  strokeWidth={3.5}
                  dot={{ r: 4, fill: 'var(--color-highlight)', stroke: 'var(--color-ink)', strokeWidth: 2 }}
                  activeDot={{ r: 6, fill: 'var(--color-highlight)', stroke: 'var(--color-ink)', strokeWidth: 2 }}
                />
              </LineChart>
            </ResponsiveContainer>
          </div>
        )}
      </Card>
    </section>
  )
}

function PrList() {
  const { data, isLoading } = usePrStats()

  return (
    <section className="flex flex-col gap-3">
      <h2 className="eyebrow">Personal records</h2>
      {isLoading ? (
        <p className="text-center text-ink-tertiary">Loading…</p>
      ) : !data || data.length === 0 ? (
        <p className="text-[14px] text-ink-tertiary">No personal records yet — log a set to start one.</p>
      ) : (
        <div className="flex flex-col gap-2">
          {data.map((pr) => (
            <Card key={pr.exercise_id} className="flex items-center justify-between py-3">
              <div>
                <p className="font-display text-[16px] font-extrabold uppercase text-ink">{pr.exercise_name}</p>
                <p className="text-[12px] text-ink-tertiary">{formatShortDate(pr.achieved_at)}</p>
              </div>
              <Badge tone="highlight">{pr.best_weight_kg} kg</Badge>
            </Card>
          ))}
        </div>
      )}
    </section>
  )
}

function SessionList() {
  const [page, setPage] = useState(1)
  const { data, isLoading, isPlaceholderData } = useSessionsList(page)

  const items = data?.items ?? []
  const hasMore = data ? page * PAGE_SIZE < data.total : false

  return (
    <section className="flex flex-col gap-3">
      <h2 className="eyebrow">Sessions</h2>
      {isLoading ? (
        <p className="text-center text-ink-tertiary">Loading…</p>
      ) : items.length === 0 ? (
        <p className="text-[14px] text-ink-tertiary">No sessions logged yet.</p>
      ) : (
        <div className="flex flex-col gap-2">
          {items.map((s) => (
            <Card key={s.id} className="flex items-center justify-between py-3">
              <div>
                <p className="flex items-center gap-2 font-display text-[16px] font-extrabold uppercase text-ink">
                  <span className={`dot ${WORKOUT_DOT[s.workout_key]}`} />
                  {WORKOUT_LABELS[s.workout_key]}
                </p>
                <p className="text-[12px] text-ink-tertiary">
                  {formatShortDate(s.started_at)}
                  {!s.finished_at && ' · in progress'}
                </p>
              </div>
              {s.total_volume_kg !== null && (
                <span className="font-display text-[18px] font-black tabular-nums text-ink">
                  {Math.round(s.total_volume_kg)} kg
                </span>
              )}
            </Card>
          ))}
        </div>
      )}

      <div className="flex items-center justify-between pt-1">
        <Button
          variant="secondary"
          size="md"
          disabled={page <= 1}
          onClick={() => setPage((p) => Math.max(1, p - 1))}
        >
          Previous
        </Button>
        <span className="eyebrow text-[12px] text-ink-tertiary">Page {page}</span>
        <Button
          variant="secondary"
          size="md"
          disabled={!hasMore || isPlaceholderData}
          onClick={() => setPage((p) => p + 1)}
        >
          Next
        </Button>
      </div>
    </section>
  )
}
