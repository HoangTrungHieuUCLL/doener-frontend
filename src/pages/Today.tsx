import { useMemo, useState } from 'react'
import type { FormEvent, ReactNode } from 'react'
import { useExercises } from '../api/hooks/useExercises'
import { usePlan } from '../api/hooks/usePlan'
import {
  useFinishSession,
  useLogCardio,
  useLogSet,
  useSession,
  useStartSession,
} from '../api/hooks/useSessions'
import type { Exercise, SessionSetDetail, SessionWorkoutKey } from '../api/types'
import { RestTimer } from '../components/RestTimer'
import { Badge } from '../components/ui/Badge'
import { Button } from '../components/ui/Button'
import { Input } from '../components/ui/Input'
import { Card } from '../components/ui/Card'
import { todayISO } from '../lib/date'
import { formatDuration, useStopwatch } from '../lib/useStopwatch'
import { useLocalStorageState } from '../lib/useLocalStorageState'

const WORKOUT_LABELS: Record<SessionWorkoutKey, string> = {
  A: 'Workout A',
  B: 'Workout B',
  C: 'Workout C',
  cardio: 'Cardio',
}

const SESSION_WORKOUT_KEYS: SessionWorkoutKey[] = ['A', 'B', 'C', 'cardio']

function isSessionWorkoutKey(key: string | undefined | null): key is SessionWorkoutKey {
  return key === 'A' || key === 'B' || key === 'C' || key === 'cardio'
}

export function Today() {
  const today = todayISO()
  const { data: exercises, isLoading: exercisesLoading } = useExercises()
  const { data: planEntries } = usePlan(today, today)
  const [activeSessionId, setActiveSessionId] = useLocalStorageState<number | null>(
    'doener.activeSessionId',
    null,
  )
  const { data: session, isLoading: sessionLoading } = useSession(activeSessionId)
  const startSession = useStartSession()

  const planWorkoutKey = planEntries?.find((p) => p.date === today)?.workout_key ?? null
  const plannedKey = isSessionWorkoutKey(planWorkoutKey) ? planWorkoutKey : null
  const [pickedKey, setPickedKey] = useState<SessionWorkoutKey>(plannedKey ?? 'A')

  async function handleStart() {
    const res = await startSession.mutateAsync(plannedKey ?? pickedKey)
    setActiveSessionId(res.id)
  }

  function handleEndSession() {
    setActiveSessionId(null)
  }

  if (exercisesLoading || (activeSessionId !== null && sessionLoading)) {
    return <p className="py-10 text-center text-ink-tertiary">Loading…</p>
  }

  if (activeSessionId === null || !session) {
    return (
      <div className="flex flex-col gap-6">
        <header>
          <h1 className="text-[24px] font-semibold text-ink">Today</h1>
          <p className="text-[14px] text-ink-secondary">
            {plannedKey
              ? `Your plan says ${WORKOUT_LABELS[plannedKey]} today.`
              : planWorkoutKey
                ? `Your plan says "${planWorkoutKey}" today — pick a workout to log.`
                : 'No plan set for today — pick a workout to start.'}
          </p>
        </header>

        {!plannedKey && (
          <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
            {SESSION_WORKOUT_KEYS.map((key) => (
              <button
                key={key}
                onClick={() => setPickedKey(key)}
                className={`tap-target rounded-[var(--radius-card)] border px-3 py-4 text-[15px] font-medium transition-colors ${
                  pickedKey === key
                    ? 'border-accent bg-accent-soft text-accent-strong'
                    : 'border-border bg-surface text-ink-secondary'
                }`}
              >
                {WORKOUT_LABELS[key]}
              </button>
            ))}
          </div>
        )}

        <Button size="lg" onClick={handleStart} disabled={startSession.isPending}>
          {startSession.isPending
            ? 'Starting…'
            : `Start ${WORKOUT_LABELS[plannedKey ?? pickedKey]}`}
        </Button>
      </div>
    )
  }

  if (session.finished_at) {
    return <FinishedSummary session={session} onStartNew={handleEndSession} />
  }

  return (
    <ActiveSession
      sessionId={session.id}
      workoutKey={session.workout_key}
      startedAt={session.started_at}
      loggedSets={session.sets}
      exercises={exercises ?? []}
    />
  )
}

function FinishedSummary({
  session,
  onStartNew,
}: {
  session: { total_volume_kg: number | null; workout_key: SessionWorkoutKey }
  onStartNew: () => void
}) {
  return (
    <div className="flex flex-col items-center gap-5 py-10 text-center">
      <div className="flex h-16 w-16 items-center justify-center rounded-full bg-positive-soft text-positive-text">
        <svg width="30" height="30" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
          <path d="M5 13l4 4L19 7" strokeLinecap="round" strokeLinejoin="round" />
        </svg>
      </div>
      <div>
        <h1 className="text-[22px] font-semibold text-ink">Workout complete</h1>
        <p className="text-[14px] text-ink-secondary">{WORKOUT_LABELS[session.workout_key]} is in the books.</p>
      </div>
      {session.total_volume_kg !== null && (
        <Card className="w-full max-w-xs">
          <p className="text-[13px] text-ink-tertiary">Total volume</p>
          <p className="text-[28px] font-semibold text-ink">{Math.round(session.total_volume_kg)} kg</p>
        </Card>
      )}
      <Button onClick={onStartNew}>Back to Today</Button>
    </div>
  )
}

interface ActiveSessionProps {
  sessionId: number
  workoutKey: SessionWorkoutKey
  startedAt: string
  loggedSets: SessionSetDetail[]
  exercises: Exercise[]
}

function ActiveSession({ sessionId, workoutKey, startedAt, loggedSets, exercises }: ActiveSessionProps) {
  const elapsed = useStopwatch(startedAt)
  const finishSession = useFinishSession()
  const [restTimer, setRestTimer] = useState<{ key: number; durationSec: number } | null>(null)
  const [newPrIds, setNewPrIds] = useState<Record<number, boolean>>({})

  const warmupExercises = useMemo(
    () => exercises.filter((e) => e.category === 'warmup').sort((a, b) => a.id - b.id),
    [exercises],
  )
  const mainExercises = useMemo(
    () => exercises.filter((e) => e.category === workoutKey).sort((a, b) => a.id - b.id),
    [exercises, workoutKey],
  )

  function handleSetLogged(exerciseId: number, restSec: number, isWarmup: boolean, isNewPr: boolean) {
    if (isNewPr) {
      setNewPrIds((prev) => ({ ...prev, [exerciseId]: true }))
    }
    if (!isWarmup && restSec > 0) {
      setRestTimer((prev) => ({ key: (prev?.key ?? 0) + 1, durationSec: restSec }))
    }
  }

  async function handleFinish() {
    await finishSession.mutateAsync(sessionId)
  }

  return (
    <div className="flex flex-col gap-6 pb-6">
      <header className="flex items-center justify-between">
        <div>
          <h1 className="text-[24px] font-semibold text-ink">{WORKOUT_LABELS[workoutKey]}</h1>
          <p className="text-[14px] text-ink-secondary">In progress</p>
        </div>
        <div className="text-right">
          <p className="text-[12px] uppercase tracking-wide text-ink-tertiary">Elapsed</p>
          <p className="text-[22px] font-semibold tabular-nums text-ink">{formatDuration(elapsed)}</p>
        </div>
      </header>

      {restTimer && (
        <RestTimer
          restartKey={restTimer.key}
          durationSec={restTimer.durationSec}
          onDismiss={() => setRestTimer(null)}
        />
      )}

      {warmupExercises.length > 0 && (
        <Section title="Warm-up">
          {warmupExercises.map((ex) => (
            <ExerciseLogCard
              key={ex.id}
              exercise={ex}
              sessionId={sessionId}
              loggedSets={loggedSets.filter((s) => s.exercise_id === ex.id)}
              isNewPr={Boolean(newPrIds[ex.id])}
              onLogged={(isNewPr) => handleSetLogged(ex.id, ex.rest_sec, true, isNewPr)}
            />
          ))}
        </Section>
      )}

      {workoutKey === 'cardio' ? (
        <Section title="Cardio">
          <CardioForm sessionId={sessionId} />
        </Section>
      ) : (
        mainExercises.length > 0 && (
          <Section title={WORKOUT_LABELS[workoutKey]}>
            {mainExercises.map((ex) => (
              <ExerciseLogCard
                key={ex.id}
                exercise={ex}
                sessionId={sessionId}
                loggedSets={loggedSets.filter((s) => s.exercise_id === ex.id)}
                isNewPr={Boolean(newPrIds[ex.id])}
                onLogged={(isNewPr) => handleSetLogged(ex.id, ex.rest_sec, false, isNewPr)}
              />
            ))}
          </Section>
        )
      )}

      <Button size="lg" variant="primary" onClick={handleFinish} disabled={finishSession.isPending}>
        {finishSession.isPending ? 'Finishing…' : 'Finish workout'}
      </Button>
    </div>
  )
}

function Section({ title, children }: { title: string; children: ReactNode }) {
  return (
    <section className="flex flex-col gap-3">
      <h2 className="text-[13px] font-semibold uppercase tracking-wide text-ink-tertiary">{title}</h2>
      <div className="flex flex-col gap-3">{children}</div>
    </section>
  )
}

function targetLabel(exercise: Exercise): string {
  if (exercise.type === 'time') {
    return `target ${exercise.sets}×${exercise.duration_sec ?? '?'}s`
  }
  return `target ${exercise.sets}×${exercise.reps ?? '?'}`
}

function ExerciseLogCard({
  exercise,
  sessionId,
  loggedSets,
  isNewPr,
  onLogged,
}: {
  exercise: Exercise
  sessionId: number
  loggedSets: SessionSetDetail[]
  isNewPr: boolean
  onLogged: (isNewPr: boolean) => void
}) {
  const logSet = useLogSet()
  const [weight, setWeight] = useState('')
  const [reps, setReps] = useState('')
  const [durationSec, setDurationSec] = useState('')

  const setCount = loggedSets.length

  async function handleSubmit(e: FormEvent) {
    e.preventDefault()
    const payload =
      exercise.type === 'time'
        ? { sessionId, exercise_id: exercise.id, duration_sec: Number(durationSec) || 0 }
        : {
            sessionId,
            exercise_id: exercise.id,
            weight_kg: weight ? Number(weight) : undefined,
            reps: reps ? Number(reps) : undefined,
          }
    const result = await logSet.mutateAsync(payload)
    onLogged(result.is_new_pr)
    setDurationSec('')
  }

  return (
    <Card className="flex flex-col gap-3">
      <div className="flex items-start justify-between gap-3">
        <div>
          <h3 className="text-[16px] font-semibold text-ink">{exercise.name}</h3>
          <p className="text-[12px] text-ink-tertiary">
            {setCount} set{setCount === 1 ? '' : 's'} logged · {targetLabel(exercise)}
            {exercise.per_side ? ' per side' : ''}
          </p>
        </div>
        {isNewPr && <Badge tone="positive">New PR!</Badge>}
      </div>

      <form onSubmit={handleSubmit} className="flex flex-wrap items-end gap-2">
        {exercise.type === 'time' ? (
          <Input
            aria-label="Duration (seconds)"
            type="number"
            inputMode="numeric"
            placeholder="Seconds"
            className="w-28"
            value={durationSec}
            onChange={(e) => setDurationSec(e.target.value)}
          />
        ) : (
          <>
            <Input
              aria-label="Weight (kg)"
              type="number"
              inputMode="decimal"
              placeholder="kg"
              className="w-20"
              value={weight}
              onChange={(e) => setWeight(e.target.value)}
            />
            <Input
              aria-label="Reps"
              type="number"
              inputMode="numeric"
              placeholder="reps"
              className="w-20"
              value={reps}
              onChange={(e) => setReps(e.target.value)}
            />
          </>
        )}
        <Button type="submit" size="md" disabled={logSet.isPending}>
          Log set
        </Button>
      </form>
      {exercise.per_side && (
        <p className="text-[12px] text-ink-tertiary">
          Log one set per side — alternate left and right as you go.
        </p>
      )}
    </Card>
  )
}

function CardioForm({ sessionId }: { sessionId: number }) {
  const logCardio = useLogCardio()
  const [durationMin, setDurationMin] = useState('')
  const [distanceKm, setDistanceKm] = useState('')
  const [logged, setLogged] = useState(false)

  async function handleSubmit(e: FormEvent) {
    e.preventDefault()
    await logCardio.mutateAsync({
      sessionId,
      duration_sec: Math.round((Number(durationMin) || 0) * 60),
      distance_km: Number(distanceKm) || 0,
    })
    setLogged(true)
  }

  return (
    <Card className="flex flex-col gap-3">
      <form onSubmit={handleSubmit} className="flex flex-col gap-3">
        <div className="flex gap-2">
          <Input
            label="Minutes"
            type="number"
            inputMode="numeric"
            value={durationMin}
            onChange={(e) => setDurationMin(e.target.value)}
          />
          <Input
            label="Distance (km)"
            type="number"
            inputMode="decimal"
            value={distanceKm}
            onChange={(e) => setDistanceKm(e.target.value)}
          />
        </div>
        <Button type="submit" disabled={logCardio.isPending}>
          {logCardio.isPending ? 'Logging…' : 'Log cardio'}
        </Button>
        {logged && <p className="text-[13px] text-positive-text">Cardio logged.</p>}
      </form>
    </Card>
  )
}
