import { useTogether } from '../api/hooks/useTogether'
import type { TogetherEntry, WorkoutKey } from '../api/types'
import { Badge } from '../components/ui/Badge'
import { Card } from '../components/ui/Card'
import { formatShortDate } from '../lib/date'

const WORKOUT_LABELS: Record<WorkoutKey, string> = {
  A: 'Workout A',
  B: 'Workout B',
  C: 'Workout C',
  cardio: 'Cardio',
  rest: 'Rest',
  custom: 'Custom',
}

/** Deterministic person-tone assignment (hash of user_id -> two muted
 * tones), so the same person always renders the same color across
 * refreshes without a fixed "who is who" concept. */
function toneFor(userId: number): 'personA' | 'personB' {
  return Math.abs(userId) % 2 === 0 ? 'personA' : 'personB'
}

export function Together() {
  const { data, isLoading, isFetching } = useTogether()

  return (
    <div className="flex flex-col gap-6">
      <header className="flex items-center justify-between">
        <div>
          <h1 className="text-[24px] font-semibold text-ink">Together</h1>
          <p className="text-[14px] text-ink-secondary">How everyone's doing today.</p>
        </div>
        {isFetching && !isLoading && <span className="text-[12px] text-ink-tertiary">Updating…</span>}
      </header>

      {isLoading ? (
        <p className="text-center text-ink-tertiary">Loading…</p>
      ) : !data || data.length === 0 ? (
        <p className="text-[14px] text-ink-tertiary">No one else has joined yet.</p>
      ) : (
        <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
          {data.map((entry) => (
            <PersonCard key={entry.user_id} entry={entry} tone={toneFor(entry.user_id)} />
          ))}
        </div>
      )}
    </div>
  )
}

function PersonCard({ entry, tone }: { entry: TogetherEntry; tone: 'personA' | 'personB' }) {
  const borderClass = tone === 'personA' ? 'border-l-4 border-l-person-a' : 'border-l-4 border-l-person-b'
  const avatarClass = tone === 'personA' ? 'bg-person-a-soft text-person-a-text' : 'bg-person-b-soft text-person-b-text'
  const done = entry.today_status === 'done'

  return (
    <Card className={`flex flex-col gap-3 ${borderClass}`}>
      <div className="flex items-center gap-3">
        <div className={`flex h-10 w-10 shrink-0 items-center justify-center rounded-full text-[15px] font-semibold ${avatarClass}`}>
          {entry.display_name.slice(0, 1).toUpperCase()}
        </div>
        <div className="flex-1">
          <p className="text-[15px] font-semibold text-ink">{entry.display_name}</p>
          <p className="text-[12px] text-ink-tertiary">{entry.session_count} sessions total</p>
        </div>
        {done ? (
          <Badge tone="positive">
            <CheckIcon /> Done today
          </Badge>
        ) : entry.today_plan ? (
          <Badge tone="neutral">Not done yet</Badge>
        ) : (
          <Badge tone="neutral">No plan</Badge>
        )}
      </div>

      <div className="rounded-[var(--radius-control)] bg-surface-alt px-3 py-2">
        <p className="text-[12px] text-ink-tertiary">Today's plan</p>
        <p className="text-[14px] font-medium text-ink">
          {entry.today_plan ? WORKOUT_LABELS[entry.today_plan.workout_key] : 'Nothing scheduled'}
        </p>
      </div>

      {entry.last_session && (
        <div className="rounded-[var(--radius-control)] bg-surface-alt px-3 py-2">
          <p className="text-[12px] text-ink-tertiary">Last session</p>
          <p className="text-[14px] font-medium text-ink">
            {WORKOUT_LABELS[entry.last_session.workout_key]}
            {entry.last_session.total_volume_kg !== null &&
              ` · ${Math.round(entry.last_session.total_volume_kg)} kg`}
          </p>
          <p className="text-[12px] text-ink-tertiary">{formatShortDate(entry.last_session.date)}</p>
        </div>
      )}
    </Card>
  )
}

function CheckIcon() {
  return (
    <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3">
      <path d="M5 13l4 4L19 7" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  )
}
