import { useEffect, useMemo, useState } from 'react'
import type { FormEvent, ReactNode } from 'react'
import { useExercises } from '../api/hooks/useExercises'
import { usePlan } from '../api/hooks/usePlan'
import { useLastSets } from '../api/hooks/useStats'
import {
  useFinishSession,
  useLogCardio,
  useLogSet,
  useSession,
  useStartSession,
} from '../api/hooks/useSessions'
import type { Exercise, LastSet, SessionSetDetail, SessionWorkoutKey } from '../api/types'
import { RestTimer } from '../components/RestTimer'
import { Badge } from '../components/ui/Badge'
import { Button } from '../components/ui/Button'
import { Input } from '../components/ui/Input'
import { Card } from '../components/ui/Card'
import { ConfirmDialog } from '../components/ui/ConfirmDialog'
import { ExerciseCard } from '../components/ui/ExerciseCard'
import { todayISO } from '../lib/date'
import { formatDuration, useCountdown, usePausableStopwatch } from '../lib/useStopwatch'
import { useLocalStorageState } from '../lib/useLocalStorageState'
import { WORKOUT_LABELS, targetLabel } from '../lib/workouts'

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

  async function beginSession() {
    if (!plannedKey) return
    const res = await startSession.mutateAsync(plannedKey)
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
      <div className="flex flex-col items-center gap-8 pt-8 text-center">
        <header>
          <h1 className="text-[24px] font-semibold text-ink">Today</h1>
          <p className="text-[14px] text-ink-secondary">
            {plannedKey
              ? `Your plan says ${WORKOUT_LABELS[plannedKey]} today.`
              : 'Nothing planned for today — head to Plan to assign a workout.'}
          </p>
        </header>

        {plannedKey && <StartButton label={`Start ${WORKOUT_LABELS[plannedKey]}`} onStart={beginSession} />}
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
      onReset={handleEndSession}
    />
  )
}

/** A circular "Start" button that, on tap, becomes a 3-2-1 countdown ring
 * (tap again to cancel) before actually starting the session. */
function StartButton({ label, onStart }: { label: string; onStart: () => void }) {
  const [active, setActive] = useState(false)
  const remaining = useCountdown(active ? 3 : 0, 0, () => {
    setActive(false)
    onStart()
  })

  const radius = 54
  const circumference = 2 * Math.PI * radius
  const progress = active ? (3 - remaining) / 3 : 0

  return (
    <button
      type="button"
      onClick={() => setActive((a) => !a)}
      aria-label={active ? 'Cancel start' : label}
      className="relative flex h-36 w-36 items-center justify-center rounded-full bg-accent-strong text-white transition-colors"
    >
      <svg className="absolute inset-0 -rotate-90" viewBox="0 0 120 120">
        <circle cx="60" cy="60" r={radius} fill="none" stroke="rgba(255,255,255,0.25)" strokeWidth="6" />
        {active && (
          <circle
            cx="60"
            cy="60"
            r={radius}
            fill="none"
            stroke="white"
            strokeWidth="6"
            strokeLinecap="round"
            strokeDasharray={circumference}
            strokeDashoffset={circumference * (1 - progress)}
            style={{ transition: 'stroke-dashoffset 1s linear' }}
          />
        )}
      </svg>
      <span className="text-[20px] font-semibold tabular-nums">
        {active ? (remaining > 0 ? remaining : 'Go!') : label}
      </span>
    </button>
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
  /** Session was reset (finished as-is); parent should forget this session id. */
  onReset: () => void
}

function ActiveSession({ sessionId, workoutKey, startedAt, loggedSets, exercises, onReset }: ActiveSessionProps) {
  const { displaySec, activeSec, isPaused, toggle: togglePause } = usePausableStopwatch(startedAt)
  const finishSession = useFinishSession()
  const { data: lastSets } = useLastSets()
  const [restTimer, setRestTimer] = useState<{ key: number; durationSec: number } | null>(null)
  const [newPrIds, setNewPrIds] = useState<Record<number, boolean>>({})
  const [viewMode, setViewMode] = useLocalStorageState<'focus' | 'list'>('doener.todayView', 'focus')
  const [confirmReset, setConfirmReset] = useState(false)

  async function handleReset() {
    await finishSession.mutateAsync({ sessionId, duration_sec: activeSec })
    setConfirmReset(false)
    onReset()
  }

  const lastSetByExercise = useMemo(() => {
    const map: Record<number, LastSet> = {}
    for (const s of lastSets ?? []) map[s.exercise_id] = s
    return map
  }, [lastSets])

  const warmupExercises = useMemo(
    () => exercises.filter((e) => e.category === 'warmup').sort((a, b) => a.id - b.id),
    [exercises],
  )
  const mainExercises = useMemo(
    () => exercises.filter((e) => e.category === workoutKey).sort((a, b) => a.id - b.id),
    [exercises, workoutKey],
  )

  // One-at-a-time queue: warm-up first, then the main workout. Cardio has no
  // exercise list (just CardioForm), so it never uses focus mode.
  const queue = useMemo(
    () => (workoutKey === 'cardio' ? [] : [...warmupExercises, ...mainExercises]),
    [workoutKey, warmupExercises, mainExercises],
  )
  const warmupIds = useMemo(() => new Set(warmupExercises.map((e) => e.id)), [warmupExercises])

  // Derived purely from logged sets -- no separate "current exercise" state
  // to keep in sync. The moment enough sets are logged for the exercise in
  // front, the next incomplete one in the queue becomes current.
  const currentIndex = useMemo(() => {
    let i = 0
    while (i < queue.length) {
      const done = loggedSets.filter((s) => s.exercise_id === queue[i].id).length
      if (done < queue[i].sets) break
      i++
    }
    return i
  }, [queue, loggedSets])

  function handleSetLogged(exerciseId: number, restSec: number, isWarmup: boolean, isNewPr: boolean) {
    if (isNewPr) {
      setNewPrIds((prev) => ({ ...prev, [exerciseId]: true }))
    }
    if (!isWarmup && restSec > 0 && !isPaused) {
      setRestTimer((prev) => ({ key: (prev?.key ?? 0) + 1, durationSec: restSec }))
    }
  }

  async function handleFinish() {
    await finishSession.mutateAsync({ sessionId, duration_sec: activeSec })
  }

  return (
    <div className="flex flex-col gap-6 pb-6">
      <header className="flex items-center justify-between">
        <div>
          <h1 className="text-[24px] font-semibold text-ink">{WORKOUT_LABELS[workoutKey]}</h1>
          <p className="text-[14px] text-ink-secondary">{isPaused ? 'Paused' : 'In progress'}</p>
        </div>
        <div className="flex items-center gap-3">
          <div className="text-right">
            <p className="text-[12px] uppercase tracking-wide text-ink-tertiary">Elapsed</p>
            <p className="text-[22px] font-semibold tabular-nums text-ink">{formatDuration(displaySec)}</p>
          </div>
          <button
            type="button"
            onClick={togglePause}
            aria-label={isPaused ? 'Resume workout' : 'Pause workout'}
            className="tap-target flex items-center justify-center rounded-full border border-border text-ink-secondary hover:bg-surface-alt"
          >
            {isPaused ? (
              <svg width="18" height="18" viewBox="0 0 24 24" fill="currentColor">
                <path d="M8 5v14l11-7z" />
              </svg>
            ) : (
              <svg width="18" height="18" viewBox="0 0 24 24" fill="currentColor">
                <path d="M6 5h4v14H6zM14 5h4v14h-4z" />
              </svg>
            )}
          </button>
          <button
            type="button"
            onClick={() => setConfirmReset(true)}
            aria-label="Reset workout"
            className="tap-target flex items-center justify-center rounded-full border border-border text-ink-secondary hover:bg-surface-alt"
          >
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <path d="M3 12a9 9 0 1 1 3 6.7M3 12v5h5" strokeLinecap="round" strokeLinejoin="round" />
            </svg>
          </button>
        </div>
      </header>

      {confirmReset && (
        <ConfirmDialog
          title="Reset this workout?"
          message="Your progress so far will be saved to history, and you can start fresh."
          confirmLabel="Reset"
          onConfirm={handleReset}
          onCancel={() => setConfirmReset(false)}
          pending={finishSession.isPending}
        />
      )}

      {workoutKey !== 'cardio' && (
        <div className="flex gap-1 rounded-[var(--radius-control)] bg-surface-alt p-1">
          {(['focus', 'list'] as const).map((mode) => (
            <button
              key={mode}
              type="button"
              onClick={() => setViewMode(mode)}
              className={`tap-target flex-1 rounded-[calc(var(--radius-control)-4px)] text-[13px] font-medium capitalize transition-colors ${
                viewMode === mode ? 'bg-surface text-ink shadow-sm' : 'text-ink-tertiary'
              }`}
            >
              {mode}
            </button>
          ))}
        </div>
      )}

      {restTimer && (
        <RestTimer
          restartKey={restTimer.key}
          durationSec={restTimer.durationSec}
          onDismiss={() => setRestTimer(null)}
        />
      )}

      {workoutKey === 'cardio' ? (
        <Section title="Cardio">
          <CardioForm sessionId={sessionId} />
        </Section>
      ) : viewMode === 'list' ? (
        <>
          {warmupExercises.length > 0 && (
            <Section title="Warm-up">
              {warmupExercises.map((ex) => (
                <ExerciseLogCard
                  key={ex.id}
                  exercise={ex}
                  sessionId={sessionId}
                  loggedSets={loggedSets.filter((s) => s.exercise_id === ex.id)}
                  lastSet={lastSetByExercise[ex.id] ?? null}
                  isNewPr={Boolean(newPrIds[ex.id])}
                  onLogged={(isNewPr) => handleSetLogged(ex.id, ex.rest_sec, true, isNewPr)}
                />
              ))}
            </Section>
          )}
          {mainExercises.length > 0 && (
            <Section title={WORKOUT_LABELS[workoutKey]}>
              {mainExercises.map((ex) => (
                <ExerciseLogCard
                  key={ex.id}
                  exercise={ex}
                  sessionId={sessionId}
                  loggedSets={loggedSets.filter((s) => s.exercise_id === ex.id)}
                  lastSet={lastSetByExercise[ex.id] ?? null}
                  isNewPr={Boolean(newPrIds[ex.id])}
                  onLogged={(isNewPr) => handleSetLogged(ex.id, ex.rest_sec, false, isNewPr)}
                />
              ))}
            </Section>
          )}
        </>
      ) : currentIndex < queue.length ? (
        <section className="flex flex-col gap-3">
          <div className="flex items-center justify-between text-[12px] font-medium text-ink-tertiary">
            <span>{warmupIds.has(queue[currentIndex].id) ? 'Warm-up' : WORKOUT_LABELS[workoutKey]}</span>
            <span>
              {currentIndex + 1} of {queue.length}
            </span>
          </div>
          <div className="h-1 w-full overflow-hidden rounded-full bg-surface-alt">
            <div
              className="h-full rounded-full bg-accent transition-all"
              style={{ width: `${((currentIndex + 1) / queue.length) * 100}%` }}
            />
          </div>
          <ExerciseLogCard
            key={queue[currentIndex].id}
            exercise={queue[currentIndex]}
            sessionId={sessionId}
            loggedSets={loggedSets.filter((s) => s.exercise_id === queue[currentIndex].id)}
            lastSet={lastSetByExercise[queue[currentIndex].id] ?? null}
            isNewPr={Boolean(newPrIds[queue[currentIndex].id])}
            onLogged={(isNewPr) =>
              handleSetLogged(queue[currentIndex].id, queue[currentIndex].rest_sec, warmupIds.has(queue[currentIndex].id), isNewPr)
            }
          />
        </section>
      ) : (
        <p className="py-6 text-center text-[15px] font-medium text-ink-secondary">
          All exercises done — ready to finish.
        </p>
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

function Stepper({
  label,
  value,
  step,
  min = 0,
  onChange,
}: {
  label: string
  value: number
  step: number
  min?: number
  onChange: (next: number) => void
}) {
  return (
    <div className="flex flex-col items-center gap-1">
      <span className="text-[11px] uppercase tracking-wide text-ink-tertiary">{label}</span>
      <div className="flex items-center gap-1">
        <button
          type="button"
          aria-label={`Decrease ${label}`}
          onClick={() => onChange(Math.max(min, round1(value - step)))}
          className="tap-target flex items-center justify-center rounded-full border border-border text-ink-secondary hover:bg-surface-alt"
        >
          −
        </button>
        <span className="w-12 text-center text-[16px] font-semibold tabular-nums text-ink">{value}</span>
        <button
          type="button"
          aria-label={`Increase ${label}`}
          onClick={() => onChange(round1(value + step))}
          className="tap-target flex items-center justify-center rounded-full border border-border text-ink-secondary hover:bg-surface-alt"
        >
          +
        </button>
      </div>
    </div>
  )
}

function round1(n: number): number {
  return Math.round(n * 10) / 10
}

function ExerciseLogCard({
  exercise,
  sessionId,
  loggedSets,
  lastSet,
  isNewPr,
  onLogged,
}: {
  exercise: Exercise
  sessionId: number
  loggedSets: SessionSetDetail[]
  lastSet: LastSet | null
  isNewPr: boolean
  onLogged: (isNewPr: boolean) => void
}) {
  const logSet = useLogSet()
  const [weight, setWeight] = useState(lastSet?.weight_kg ?? 20)
  const [reps, setReps] = useState(lastSet?.reps ?? exercise.reps ?? 10)
  const [durationSec, setDurationSec] = useState(lastSet?.duration_sec ?? exercise.duration_sec ?? 30)

  // Re-seed once lastSet finishes loading (it starts null on first render).
  useEffect(() => {
    if (lastSet) {
      if (lastSet.weight_kg !== null) setWeight(lastSet.weight_kg)
      if (lastSet.reps !== null) setReps(lastSet.reps)
      if (lastSet.duration_sec !== null) setDurationSec(lastSet.duration_sec)
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [lastSet?.exercise_id])

  const setCount = loggedSets.length

  async function logCurrentValues() {
    const payload =
      exercise.type === 'time'
        ? { sessionId, exercise_id: exercise.id, duration_sec: durationSec }
        : { sessionId, exercise_id: exercise.id, weight_kg: weight, reps }
    const result = await logSet.mutateAsync(payload)
    onLogged(result.is_new_pr)
  }

  async function repeatLastSet() {
    if (!lastSet) return
    const payload =
      exercise.type === 'time'
        ? { sessionId, exercise_id: exercise.id, duration_sec: lastSet.duration_sec ?? 0 }
        : {
            sessionId,
            exercise_id: exercise.id,
            weight_kg: lastSet.weight_kg ?? undefined,
            reps: lastSet.reps ?? undefined,
          }
    const result = await logSet.mutateAsync(payload)
    onLogged(result.is_new_pr)
  }

  return (
    <div className="flex flex-col overflow-hidden rounded-[var(--radius-card)] border border-border bg-surface">
      <ExerciseCard
        exerciseKey={exercise.key}
        title={exercise.name}
        subtitle={`${setCount} set${setCount === 1 ? '' : 's'} logged · ${targetLabel(exercise)}${exercise.per_side ? ' per side' : ''}`}
        chip={isNewPr ? <Badge tone="positive">New PR!</Badge> : targetLabel(exercise)}
        className="h-28"
      />

      <div className="flex flex-wrap items-center justify-center gap-4 p-4">
        {exercise.type === 'time' ? (
          <Stepper label="Seconds" value={durationSec} step={5} onChange={setDurationSec} />
        ) : (
          <>
            <Stepper label="Kg" value={weight} step={2.5} onChange={setWeight} />
            <Stepper label="Reps" value={reps} step={1} onChange={setReps} />
          </>
        )}
      </div>

      <div className="flex gap-2 px-4 pb-4">
        {lastSet && (
          <Button variant="secondary" size="md" onClick={repeatLastSet} disabled={logSet.isPending} className="flex-1">
            Repeat last
          </Button>
        )}
        <Button size="md" onClick={logCurrentValues} disabled={logSet.isPending} className="flex-1">
          Log set
        </Button>
      </div>
    </div>
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
