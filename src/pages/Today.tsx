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
import type { Exercise, SetLog, WorkoutKey } from '../api/types'
import { ExerciseMotionGuide } from '../components/ExerciseMotionGuide'
import { RestTimer } from '../components/RestTimer'
import { Badge } from '../components/ui/Badge'
import { Button } from '../components/ui/Button'
import { Input } from '../components/ui/Input'
import { Card } from '../components/ui/Card'
import { todayISO } from '../lib/date'
import { formatDuration, useStopwatch } from '../lib/useStopwatch'
import { useLocalStorageState } from '../lib/useLocalStorageState'
import { getMotionGuide } from '../motion/motionGuides'

const ACCENT = '#6e7c91'

const WORKOUT_LABELS: Record<WorkoutKey, string> = {
  a: 'Workout A',
  b: 'Workout B',
  c: 'Workout C',
  cardio: 'Cardio',
}

export function Today() {
  const today = todayISO()
  const { data: exercises, isLoading: exercisesLoading } = useExercises()
  const { data: planEntries } = usePlan(today, today)
  const [activeSessionId, setActiveSessionId] = useLocalStorageState<string | null>(
    'doener.activeSessionId',
    null,
  )
  const { data: session, isLoading: sessionLoading } = useSession(activeSessionId)
  const startSession = useStartSession()

  const plannedKey = planEntries?.find((p) => p.date === today)?.workout_key ?? null
  const [pickedKey, setPickedKey] = useState<WorkoutKey>(plannedKey ?? 'a')

  async function handleStart() {
    const res = await startSession.mutateAsync(plannedKey ?? pickedKey)
    setActiveSessionId(res.id)
  }

  function handleEndSession() {
    setActiveSessionId(null)
  }

  if (exercisesLoading || (activeSessionId && sessionLoading)) {
    return <p className="py-10 text-center text-ink-tertiary">Loading…</p>
  }

  if (!activeSessionId || !session) {
    return (
      <div className="flex flex-col gap-6">
        <header>
          <h1 className="text-[24px] font-semibold text-ink">Today</h1>
          <p className="text-[14px] text-ink-secondary">
            {plannedKey
              ? `Your plan says ${WORKOUT_LABELS[plannedKey]} today.`
              : 'No plan set for today — pick a workout to start.'}
          </p>
        </header>

        {!plannedKey && (
          <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
            {(Object.keys(WORKOUT_LABELS) as WorkoutKey[]).map((key) => (
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
      loggedSets={session.sets ?? []}
      exercises={exercises ?? []}
    />
  )
}

function FinishedSummary({
  session,
  onStartNew,
}: {
  session: { total_volume: number | null; workout_key: WorkoutKey }
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
      {session.total_volume !== null && (
        <Card className="w-full max-w-xs">
          <p className="text-[13px] text-ink-tertiary">Total volume</p>
          <p className="text-[28px] font-semibold text-ink">{Math.round(session.total_volume)} kg</p>
        </Card>
      )}
      <Button onClick={onStartNew}>Back to Today</Button>
    </div>
  )
}

interface ActiveSessionProps {
  sessionId: string
  workoutKey: WorkoutKey
  startedAt: string
  loggedSets: SetLog[]
  exercises: Exercise[]
}

function ActiveSession({ sessionId, workoutKey, startedAt, loggedSets, exercises }: ActiveSessionProps) {
  const elapsed = useStopwatch(startedAt)
  const finishSession = useFinishSession()
  const [restTimer, setRestTimer] = useState<{ key: number; durationSec: number } | null>(null)
  const [newPrKeys, setNewPrKeys] = useState<Record<string, boolean>>({})

  const warmupExercises = useMemo(
    () => exercises.filter((e) => e.category === 'warmup').sort((a, b) => a.order - b.order),
    [exercises],
  )
  const mainExercises = useMemo(
    () =>
      exercises
        .filter((e) => e.category === workoutKey)
        .sort((a, b) => a.order - b.order),
    [exercises, workoutKey],
  )

  function handleSetLogged(exerciseKey: string, restSec: number, isWarmup: boolean, isNewPr: boolean) {
    if (isNewPr) {
      setNewPrKeys((prev) => ({ ...prev, [exerciseKey]: true }))
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
              key={ex.key}
              exercise={ex}
              sessionId={sessionId}
              loggedSets={loggedSets.filter((s) => s.exercise_key === ex.key)}
              isNewPr={Boolean(newPrKeys[ex.key])}
              onLogged={(isNewPr) => handleSetLogged(ex.key, ex.rest_sec, true, isNewPr)}
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
                key={ex.key}
                exercise={ex}
                sessionId={sessionId}
                loggedSets={loggedSets.filter((s) => s.exercise_key === ex.key)}
                isNewPr={Boolean(newPrKeys[ex.key])}
                onLogged={(isNewPr) => handleSetLogged(ex.key, ex.rest_sec, false, isNewPr)}
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

function ExerciseLogCard({
  exercise,
  sessionId,
  loggedSets,
  isNewPr,
  onLogged,
}: {
  exercise: Exercise
  sessionId: string
  loggedSets: SetLog[]
  isNewPr: boolean
  onLogged: (isNewPr: boolean) => void
}) {
  const logSet = useLogSet()
  const guide = getMotionGuide(exercise.key)
  const [weight, setWeight] = useState('')
  const [reps, setReps] = useState('')
  const [durationSec, setDurationSec] = useState('')
  const [side, setSide] = useState<'left' | 'right'>('left')

  const setCount = loggedSets.length

  async function handleSubmit(e: FormEvent) {
    e.preventDefault()
    const payload =
      exercise.log_type === 'time'
        ? { sessionId, exercise_key: exercise.key, duration_sec: Number(durationSec) || 0 }
        : {
            sessionId,
            exercise_key: exercise.key,
            weight: weight ? Number(weight) : undefined,
            reps: reps ? Number(reps) : undefined,
          }
    const withSide = exercise.per_side ? { ...payload, side } : payload
    const result = await logSet.mutateAsync(withSide)
    onLogged(result.is_new_pr)
    setDurationSec('')
  }

  return (
    <Card className="flex flex-col gap-3">
      <div className="flex items-start justify-between gap-3">
        <div>
          <h3 className="text-[16px] font-semibold text-ink">{exercise.name}</h3>
          <p className="text-[12px] text-ink-tertiary">
            {setCount} set{setCount === 1 ? '' : 's'} logged
            {exercise.target_sets ? ` · target ${exercise.target_sets}×${exercise.target_reps ?? ''}` : ''}
          </p>
        </div>
        {isNewPr && <Badge tone="positive">New PR!</Badge>}
      </div>

      {guide && (
        <div className="overflow-hidden rounded-[var(--radius-control)] bg-surface-alt">
          <ExerciseMotionGuide
            poseA={guide.poseA}
            poseB={guide.poseB}
            equipment={guide.equipment}
            accent={ACCENT}
            frameShapes={guide.frameShapes}
            machine={guide.machine}
            handheld={guide.handheld}
            farLimb={guide.farLimb}
            floor={guide.floor}
            label={exercise.name}
            className="h-32 w-full"
          />
        </div>
      )}

      <form onSubmit={handleSubmit} className="flex flex-wrap items-end gap-2">
        {exercise.per_side && (
          <div className="flex overflow-hidden rounded-[var(--radius-control)] border border-border">
            {(['left', 'right'] as const).map((s) => (
              <button
                type="button"
                key={s}
                onClick={() => setSide(s)}
                className={`tap-target px-3 text-[13px] font-medium capitalize ${
                  side === s ? 'bg-accent-soft text-accent-strong' : 'text-ink-secondary'
                }`}
              >
                {s}
              </button>
            ))}
          </div>
        )}
        {exercise.log_type === 'time' ? (
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
    </Card>
  )
}

function CardioForm({ sessionId }: { sessionId: string }) {
  const logCardio = useLogCardio()
  const [durationMin, setDurationMin] = useState('')
  const [distanceKm, setDistanceKm] = useState('')
  const [notes, setNotes] = useState('')
  const [logged, setLogged] = useState(false)

  async function handleSubmit(e: FormEvent) {
    e.preventDefault()
    await logCardio.mutateAsync({
      sessionId,
      duration_min: Number(durationMin) || 0,
      distance_km: distanceKm ? Number(distanceKm) : undefined,
      notes: notes || undefined,
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
        <Input label="Notes" type="text" value={notes} onChange={(e) => setNotes(e.target.value)} />
        <Button type="submit" disabled={logCardio.isPending}>
          {logCardio.isPending ? 'Logging…' : 'Log cardio'}
        </Button>
        {logged && <p className="text-[13px] text-positive-text">Cardio logged.</p>}
      </form>
    </Card>
  )
}
