import { useEffect, useMemo, useRef, useState } from 'react'
import type { FormEvent, KeyboardEvent, ReactNode } from 'react'
import { useExercises } from '../api/hooks/useExercises'
import { usePlan } from '../api/hooks/usePlan'
import { useLastSets, usePrStats } from '../api/hooks/useStats'
import {
  useFinishSession,
  useLogCardio,
  useLogSet,
  useSession,
  useSessionsOnDate,
  useStartSession,
} from '../api/hooks/useSessions'
import type {
  Exercise,
  LastSet,
  LastSetEntry,
  PersonalRecord,
  SessionSetDetail,
  SessionWorkoutKey,
} from '../api/types'
import { RestTimer } from '../components/RestTimer'
import { Button } from '../components/ui/Button'
import { Input } from '../components/ui/Input'
import { Card } from '../components/ui/Card'
import { ConfirmDialog } from '../components/ui/ConfirmDialog'
import { AddExerciseSheet } from '../components/AddExerciseSheet'
import type { Placement } from '../components/AddExerciseSheet'
import { ExerciseCard } from '../components/ui/ExerciseCard'
import { Sparkline } from '../components/ui/Sparkline'
import { formatRelativeDay, todayISO } from '../lib/date'
import { formatDuration, useCountdown, usePausableStopwatch } from '../lib/useStopwatch'
import { useLocalStorageState } from '../lib/useLocalStorageState'
import { CATALOG_SECTIONS, WORKOUT_LABELS, formatTimed, inMinutes, targetLabel, tracksWeight } from '../lib/workouts'
import { buildSessionQueue } from '../lib/sessionQueue'
import type { AddedExercise } from '../lib/sessionQueue'

function isSessionWorkoutKey(key: string | undefined | null): key is SessionWorkoutKey {
  return key === 'A' || key === 'B' || key === 'C' || key === 'cardio' || key === 'custom'
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

  const { data: todaysSessions } = useSessionsOnDate(today)
  const finishedToday = (todaysSessions?.items ?? []).filter((s) => s.finished_at !== null)

  // A day can hold several planned workouts. The next one to start is the
  // first that no finished session today has used up yet.
  const plannedKey = useMemo(() => {
    const done = finishedToday.map((s) => s.workout_key as string)
    for (const entry of planEntries ?? []) {
      if (entry.date !== today || !isSessionWorkoutKey(entry.workout_key)) continue
      const used = done.indexOf(entry.workout_key)
      if (used === -1) return entry.workout_key
      done.splice(used, 1)
    }
    return null
  }, [planEntries, finishedToday, today])

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
      <div className="flex flex-col items-center gap-10 pt-6 text-center">
        <header className="flex flex-col items-center gap-3">
          <h1 className="headline text-[64px]">Today</h1>
          {!plannedKey && finishedToday.length === 0 && (
            <p className="max-w-xs text-[15px] text-ink-secondary">
              Nothing planned for today — head to Plan to assign a workout.
            </p>
          )}
          {!plannedKey && finishedToday.length > 0 && (
            <p className="max-w-xs text-[15px] text-ink-secondary">
              Good workout today. Planning another one? Head to Plan to add it.
            </p>
          )}
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
      // Re-mount per session so session-scoped state (added exercises, PR
      // flags, rest timer) never carries over into the next workout.
      key={session.id}
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
      className="press relative flex h-64 w-64 max-h-[75vw] max-w-[75vw] items-center justify-center rounded-full border-[3px] border-ink bg-accent p-6 text-center text-white shadow-[var(--shadow-lg)]"
    >
      <svg className="absolute inset-0 -rotate-90" viewBox="0 0 120 120">
        <circle cx="60" cy="60" r={radius} fill="none" stroke="rgba(255,255,255,0.3)" strokeWidth="4" strokeDasharray="2 4" />
        {active && (
          <circle
            cx="60"
            cy="60"
            r={radius}
            fill="none"
            stroke="var(--color-highlight)"
            strokeWidth="6"
            strokeLinecap="round"
            strokeDasharray={circumference}
            strokeDashoffset={circumference * (1 - progress)}
            style={{ transition: 'stroke-dashoffset 1s linear' }}
          />
        )}
      </svg>
      <span className="headline text-[34px] tabular-nums">
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
      <div className="animate-pop-in flex h-24 w-24 items-center justify-center rounded-full border-[3px] border-ink bg-positive text-ink shadow-[var(--shadow-lg)]">
        <svg width="36" height="36" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
          <path d="M5 13l4 4L19 7" strokeLinecap="round" strokeLinejoin="round" />
        </svg>
      </div>
      <div>
        <h1 className="headline text-[44px]">Workout <span className="marker">complete</span></h1>
        <p className="mt-3 text-[15px] text-ink-secondary">{WORKOUT_LABELS[session.workout_key]} is in the books.</p>
      </div>
      {session.total_volume_kg !== null && (
        <Card className="w-full max-w-xs">
          <p className="eyebrow text-ink-tertiary">Total volume</p>
          <p className="headline mt-1 text-[48px] text-accent-strong">{Math.round(session.total_volume_kg)} kg</p>
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
  // Excluding this session keeps "last time" meaning a previous workout,
  // even after sets have been logged here.
  const { data: lastSets } = useLastSets(sessionId)
  const { data: prs } = usePrStats()
  const [restTimer, setRestTimer] = useState<{ key: number; durationSec: number } | null>(null)
  const [newPrIds, setNewPrIds] = useState<Record<number, boolean>>({})
  const [viewMode, setViewMode] = useLocalStorageState<'focus' | 'list'>('doener.todayView', 'focus')
  const [confirmReset, setConfirmReset] = useState(false)
  // Scoped to this session: an exercise added today doesn't change the
  // workout itself. Kept in browser storage so it survives a reload before
  // any set has been logged against it.
  const [added, setAdded] = useLocalStorageState<AddedExercise[]>(
    `doener.addedExercises.${sessionId}`,
    [],
  )
  const [picking, setPicking] = useState(false)

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

  const bestByExercise = useMemo(() => {
    const map: Record<number, PersonalRecord> = {}
    for (const pr of prs ?? []) map[pr.exercise_id] = pr
    return map
  }, [prs])

  const warmupExercises = useMemo(
    () => exercises.filter((e) => e.category === 'warmup').sort((a, b) => a.id - b.id),
    [exercises],
  )
  const mainExercises = useMemo(
    () => exercises.filter((e) => e.category === workoutKey).sort((a, b) => a.id - b.id),
    [exercises, workoutKey],
  )

  // One-at-a-time queue: warm-up first, then the main workout, then anything
  // added mid-session. Cardio has no exercise list (just CardioForm), so it
  // never uses focus mode.
  const queue = useMemo(
    () =>
      workoutKey === 'cardio'
        ? []
        : buildSessionQueue([...warmupExercises, ...mainExercises], added, loggedSets, exercises),
    [workoutKey, warmupExercises, mainExercises, added, loggedSets, exercises],
  )
  const warmupIds = useMemo(() => new Set(warmupExercises.map((e) => e.id)), [warmupExercises])
  const queueIds = useMemo(() => new Set(queue.map((e) => e.id)), [queue])
  const addedIds = useMemo(() => new Set(added.map((a) => a.exerciseId)), [added])
  // Everything in the queue the workout itself didn't put there.
  const extraExercises = useMemo(
    () => queue.filter((e) => !warmupIds.has(e.id) && !mainExercises.some((m) => m.id === e.id)),
    [queue, warmupIds, mainExercises],
  )

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

  const currentExercise = currentIndex < queue.length ? queue[currentIndex] : null

  function handleAddExercise(exerciseId: number, placement: Placement) {
    setAdded((prev) => [
      ...prev,
      {
        exerciseId,
        afterExerciseId: placement === 'next' ? (currentExercise?.id ?? null) : null,
      },
    ])
    setPicking(false)
  }

  // Only removable until it has sets: once logged, it is part of the record.
  function handleRemoveAdded(exerciseId: number) {
    setAdded((prev) => prev.filter((a) => a.exerciseId !== exerciseId))
  }

  return (
    <div className="flex flex-col gap-6 pb-6">
      <header className="flex flex-col gap-4">
        <div className="flex flex-wrap items-center justify-between gap-x-3 gap-y-2">
          <h1 className="headline text-[44px]">{WORKOUT_LABELS[workoutKey]}</h1>
          <p>
            <span className={`inline-flex items-center gap-1.5 rounded-full border-2 border-ink px-2 py-0.5 font-display text-[11px] font-extrabold uppercase tracking-[0.05em] ${isPaused ? 'bg-surface-alt text-ink' : 'bg-positive text-ink'}`}>
              {isPaused ? 'Paused' : 'In progress'}
            </span>
          </p>
        </div>
        <div className="sticker flex items-center gap-3 rounded-[var(--radius-card)] bg-surface py-2 pl-4 pr-2">
          <div className="flex-1">
            <p className="eyebrow text-[11px] text-ink-tertiary">Elapsed</p>
            <p className="font-display text-[34px] font-black leading-none tabular-nums text-ink">{formatDuration(displaySec)}</p>
          </div>
          <button
            type="button"
            onClick={togglePause}
            aria-label={isPaused ? 'Resume workout' : 'Pause workout'}
            className="tap-target press flex items-center justify-center rounded-full border-2 border-ink bg-surface text-[20px] font-bold text-ink shadow-[var(--shadow-pop)] hover:bg-highlight"
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
            className="tap-target press flex items-center justify-center rounded-full border-2 border-ink bg-surface text-[20px] font-bold text-ink shadow-[var(--shadow-pop)] hover:bg-highlight"
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

      {workoutKey !== 'cardio' && workoutKey !== 'custom' && (
        <div className="flex gap-1 rounded-full border-2 border-ink bg-surface p-1">
          {(['focus', 'list'] as const).map((mode) => (
            <button
              key={mode}
              type="button"
              onClick={() => setViewMode(mode)}
              className={`tap-target flex-1 rounded-full font-display text-[13px] font-extrabold uppercase tracking-[0.05em] transition-colors ${
                viewMode === mode ? 'bg-ink text-bg' : 'text-ink-tertiary hover:text-ink'
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
      ) : workoutKey === 'custom' ? (
        <CustomExercisePicker
          exercises={exercises}
          sessionId={sessionId}
          loggedSets={loggedSets}
          lastSetByExercise={lastSetByExercise}
          bestByExercise={bestByExercise}
          newPrIds={newPrIds}
          onLogged={(exerciseId, restSec, isNewPr) => handleSetLogged(exerciseId, restSec, false, isNewPr)}
        />
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
                  best={bestByExercise[ex.id] ?? null}
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
                  best={bestByExercise[ex.id] ?? null}
                  isNewPr={Boolean(newPrIds[ex.id])}
                  onLogged={(isNewPr) => handleSetLogged(ex.id, ex.rest_sec, false, isNewPr)}
                />
              ))}
            </Section>
          )}
          {extraExercises.length > 0 && (
            <Section title="Added this session">
              {extraExercises.map((ex) => (
                <div key={ex.id} className="flex flex-col gap-2">
                  <ExerciseLogCard
                    exercise={ex}
                    sessionId={sessionId}
                    loggedSets={loggedSets.filter((s) => s.exercise_id === ex.id)}
                    lastSet={lastSetByExercise[ex.id] ?? null}
                    best={bestByExercise[ex.id] ?? null}
                    isNewPr={Boolean(newPrIds[ex.id])}
                    onLogged={(isNewPr) => handleSetLogged(ex.id, ex.rest_sec, false, isNewPr)}
                  />
                  <RemoveAddedButton
                    exercise={ex}
                    logged={loggedSets.some((s) => s.exercise_id === ex.id)}
                    onRemove={() => handleRemoveAdded(ex.id)}
                  />
                </div>
              ))}
            </Section>
          )}
        </>
      ) : currentIndex < queue.length ? (
        <section className="flex flex-col gap-3">
          <div className="eyebrow flex items-center justify-between text-[12px]">
            <span>
              {warmupIds.has(queue[currentIndex].id)
                ? 'Warm-up'
                : addedIds.has(queue[currentIndex].id)
                  ? 'Added'
                  : WORKOUT_LABELS[workoutKey]}
            </span>
            <span>
              {currentIndex + 1} of {queue.length}
            </span>
          </div>
          <div className="h-3.5 w-full overflow-hidden rounded-full border-2 border-ink bg-surface">
            <div
              className="h-full border-r-2 border-ink bg-accent transition-all"
              style={{ width: `${((currentIndex + 1) / queue.length) * 100}%` }}
            />
          </div>
          <ExerciseLogCard
            key={queue[currentIndex].id}
            exercise={queue[currentIndex]}
            sessionId={sessionId}
            loggedSets={loggedSets.filter((s) => s.exercise_id === queue[currentIndex].id)}
            lastSet={lastSetByExercise[queue[currentIndex].id] ?? null}
            best={bestByExercise[queue[currentIndex].id] ?? null}
            isNewPr={Boolean(newPrIds[queue[currentIndex].id])}
            onLogged={(isNewPr) =>
              handleSetLogged(queue[currentIndex].id, queue[currentIndex].rest_sec, warmupIds.has(queue[currentIndex].id), isNewPr)
            }
          />
          {addedIds.has(queue[currentIndex].id) && (
            <RemoveAddedButton
              exercise={queue[currentIndex]}
              logged={loggedSets.some((s) => s.exercise_id === queue[currentIndex].id)}
              onRemove={() => handleRemoveAdded(queue[currentIndex].id)}
            />
          )}
        </section>
      ) : (
        <p className="headline py-6 text-center text-[28px]">
          All exercises done — ready to finish.
        </p>
      )}

      {workoutKey !== 'cardio' && workoutKey !== 'custom' && (
        <Button variant="secondary" size="md" onClick={() => setPicking(true)}>
          + Add an exercise
        </Button>
      )}

      {picking && (
        <AddExerciseSheet
          exercises={exercises}
          inQueueIds={queueIds}
          currentExerciseName={currentExercise?.name ?? null}
          onAdd={handleAddExercise}
          onClose={() => setPicking(false)}
        />
      )}

      <Button size="lg" variant="primary" onClick={handleFinish} disabled={finishSession.isPending}>
        {finishSession.isPending ? 'Finishing…' : 'Finish workout'}
      </Button>
    </div>
  )
}

/** Added exercises can be taken back off the list, but only while nothing
 * has been logged against them -- a logged set is part of the record. */
function RemoveAddedButton({
  exercise,
  logged,
  onRemove,
}: {
  exercise: Exercise
  logged: boolean
  onRemove: () => void
}) {
  if (logged) return null
  return (
    <button
      type="button"
      onClick={onRemove}
      className="press self-center rounded-full border-2 border-ink bg-surface px-3 py-1.5 font-display text-[12px] font-extrabold uppercase tracking-[0.03em] text-ink-secondary shadow-[var(--shadow-pop)]"
    >
      Remove {exercise.name}
    </button>
  )
}

function Section({ title, children }: { title: string; children: ReactNode }) {
  return (
    <section className="flex flex-col gap-3">
      <h2 className="eyebrow">{title}</h2>
      <div className="flex flex-col gap-3">{children}</div>
    </section>
  )
}

const TICK_PX = 12 // matches the w-3 on each tick

/** Number picker: a vertical ruler of `step`-sized ticks that snaps to a
 * fixed center line -- flick it for a big jump, nudge it for a small one.
 * Values grow downward, so swiping up raises the number (like an iOS picker). A
 * value between ticks (22.5 kg from an older log) is kept as-is until the
 * ruler moves. Long ticks every `majorEvery`, numbers every `labelEvery`. */
function Ruler({
  label,
  value,
  step,
  max,
  majorEvery,
  labelEvery,
  onChange,
}: {
  label: string
  value: number
  step: number
  max: number
  majorEvery: number
  labelEvery: number
  onChange: (next: number) => void
}) {
  const ref = useRef<HTMLDivElement>(null)
  // The last value this ruler reported. Only a value from elsewhere (re-seeded
  // from the last set, arrow keys) moves the ruler; moving it for its own
  // reports would fight the finger mid-fling.
  const reported = useRef<number | null>(null)
  const ticks = Math.floor(max / step)
  const index = Math.round(value / step)

  useEffect(() => {
    if (value === reported.current || !ref.current) return
    ref.current.scrollTop = Math.round(value / step) * TICK_PX
  }, [value, step])

  function handleScroll() {
    if (!ref.current) return
    const next = Math.min(ticks, Math.max(0, Math.round(ref.current.scrollTop / TICK_PX)))
    if (next === index) return
    reported.current = round1(next * step)
    onChange(reported.current)
  }

  function handleKeyDown(e: KeyboardEvent<HTMLDivElement>) {
    const delta = { ArrowLeft: -1, ArrowDown: -1, ArrowRight: 1, ArrowUp: 1 }[e.key]
    if (delta === undefined) return
    e.preventDefault()
    onChange(round1(Math.min(ticks, Math.max(0, index + delta)) * step))
  }

  return (
    <div className="flex flex-col items-center gap-1">
      <span className="eyebrow text-[11px] text-ink-tertiary">{label}</span>
      <div className="flex items-center gap-2">
        <span className="w-16 text-right font-display text-[28px] font-black tabular-nums text-ink">{round1(value)}</span>
        <div className="relative h-36 w-14">
          <div
            ref={ref}
            role="slider"
            tabIndex={0}
            aria-label={label}
            aria-orientation="vertical"
            aria-valuemin={0}
            aria-valuemax={max}
            aria-valuenow={value}
            onScroll={handleScroll}
            onKeyDown={handleKeyDown}
            className="flex h-full snap-y snap-mandatory flex-col overflow-y-auto overscroll-contain rounded-[var(--radius-control)] outline-offset-2 [mask-image:linear-gradient(transparent,black_25%,black_75%,transparent)] [scrollbar-width:none] [&::-webkit-scrollbar]:hidden"
          >
            {/* Half-height spacers let 0 and the max reach the center line. */}
            <div className="shrink-0" style={{ height: `calc(50% - ${TICK_PX / 2}px)` }} />
            {Array.from({ length: ticks + 1 }, (_, i) => {
              const tick = round1(i * step)
              return (
                <div key={i} className="relative flex h-3 w-full shrink-0 snap-center items-center">
                  <span className={`h-0.5 rounded-full ${tick % majorEvery === 0 ? 'w-6 bg-ink' : 'w-3 bg-ink/35'}`} />
                  {tick % labelEvery === 0 && (
                    <span className="absolute left-8 text-[10px] font-semibold tabular-nums text-ink-tertiary">{tick}</span>
                  )}
                </div>
              )
            })}
            <div className="shrink-0" style={{ height: `calc(50% - ${TICK_PX / 2}px)` }} />
          </div>
          <div className="pointer-events-none absolute top-1/2 left-0 h-1 w-6 -translate-y-1/2 rounded-full bg-accent" />
        </div>
      </div>
    </div>
  )
}

function round1(n: number): number {
  return Math.round(n * 10) / 10
}

type SetShape = { weight_kg: number | null; reps: number | null; duration_sec: number | null }

/** "40 kg x 10" for weighted work, "45s" or "20 min" for timed work. */
function describeSet(exercise: Exercise, set: SetShape): string {
  if (exercise.type === 'time') {
    return set.duration_sec === null ? '—' : formatTimed(exercise, set.duration_sec)
  }
  if (!tracksWeight(exercise)) return set.reps === null ? '—' : `${set.reps} reps`
  const parts: string[] = []
  if (set.weight_kg !== null) parts.push(`${round1(set.weight_kg)} kg`)
  if (set.reps !== null) parts.push(`× ${set.reps}`)
  return parts.length > 0 ? parts.join(' ') : '—'
}

/** The set worth quoting from a session: the heaviest (or longest held),
 * which is what you actually compare against when deciding today's weight. */
function topSet<T extends SetShape>(exercise: Exercise, sets: T[]): T | null {
  if (sets.length === 0) return null
  const score = (s: SetShape) =>
    exercise.type === 'time'
      ? (s.duration_sec ?? 0)
      : (tracksWeight(exercise) ? (s.weight_kg ?? 0) * 1000 : 0) + (s.reps ?? 0)
  return sets.reduce((best, s) => (score(s) > score(best) ? s : best), sets[0])
}

function setCountLabel(n: number): string {
  return `${n} set${n === 1 ? '' : 's'}`
}

/** What you did last time with this exercise, what you have done with it so
 * far today, and your best ever -- so progress is visible while logging
 * rather than only on the History and Insights tabs. */
function LastResult({
  exercise,
  lastSet,
  best,
  thisSessionSets,
}: {
  exercise: Exercise
  lastSet: LastSet | null
  best: PersonalRecord | null
  thisSessionSets: SessionSetDetail[]
}) {
  // Tolerate a backend that predates the richer recap payload: the two
  // services deploy independently, so this can briefly run against one that
  // still returns only the flat last-set fields.
  const lastSessionSets = lastSet?.sets ?? []
  const last = topSet(exercise, lastSessionSets)
  // Timed and reps-only exercises have no weight to hold a record against.
  const showBest = tracksWeight(exercise) && best !== null

  const trendValues = (lastSet?.trend ?? [])
    .map((p) =>
      exercise.type === 'time' ? p.top_duration_sec : tracksWeight(exercise) ? p.top_weight_kg : p.top_reps,
    )
    .filter((v): v is number => v !== null)

  return (
    <details className="group mt-3 rounded-[var(--radius-control)] bg-surface/90 px-3 py-2.5 backdrop-blur-sm">
      <summary className="flex cursor-pointer list-none items-center gap-3 [&::-webkit-details-marker]:hidden">
        <div className="min-w-0 flex-1">
          <p className="eyebrow text-[11px] text-ink-tertiary">
            Last time
            {lastSet && <span className="normal-case tracking-normal"> · {formatRelativeDay(lastSet.date)}</span>}
          </p>
          {last && lastSet ? (
            <p className="font-display text-[19px] font-black leading-tight tabular-nums text-ink">
              {describeSet(exercise, last)}
              <span className="ml-1.5 text-[13px] font-bold text-ink-tertiary">
                {setCountLabel(lastSessionSets.length)}
              </span>
            </p>
          ) : (
            <p className="text-[14px] text-ink-secondary">No logs yet — this one sets your baseline.</p>
          )}
          {thisSessionSets.length > 0 && (
            <p className="mt-0.5 text-[13px] font-semibold text-accent-strong">
              This session · {setCountLabel(thisSessionSets.length)}
            </p>
          )}
        </div>

        <div className="flex shrink-0 flex-col items-end gap-1">
          {showBest && (
            <p className="eyebrow text-[11px] text-ink-tertiary">
              Best <span className="text-ink">{round1(best.best_weight_kg)} kg</span>
            </p>
          )}
          {trendValues.length > 1 && (
            <Sparkline
              values={trendValues}
              className="h-6 w-[72px]"
              label={`Trend over the last ${trendValues.length} sessions`}
            />
          )}
        </div>

        {(lastSet !== null || thisSessionSets.length > 0) && (
          <svg
            width="16"
            height="16"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="3"
            className="shrink-0 text-ink-tertiary transition-transform group-open:rotate-180"
          >
            <path d="M6 9l6 6 6-6" strokeLinecap="round" strokeLinejoin="round" />
          </svg>
        )}
      </summary>

      {(lastSet !== null || thisSessionSets.length > 0) && (
        <div className="mt-3 flex flex-col gap-2">
          {lastSessionSets.length > 0 && (
            <SetBreakdown exercise={exercise} label="Last time" sets={lastSessionSets} />
          )}
          {thisSessionSets.length > 0 && (
            <SetBreakdown exercise={exercise} label="This session" sets={thisSessionSets} tone="accent" />
          )}
        </div>
      )}
    </details>
  )
}

function SetBreakdown({
  exercise,
  label,
  sets,
  tone = 'neutral',
}: {
  exercise: Exercise
  label: string
  sets: (LastSetEntry | SessionSetDetail)[]
  tone?: 'neutral' | 'accent'
}) {
  return (
    <div>
      <p className="eyebrow mb-1 text-[11px] text-ink-tertiary">{label}</p>
      <ul className="flex flex-wrap gap-1.5">
        {sets.map((set) => (
          <li
            key={set.set_number}
            className={`rounded-full border-2 px-2 py-0.5 font-display text-[12px] font-extrabold tabular-nums ${
              tone === 'accent'
                ? 'border-accent bg-accent-soft text-accent-strong'
                : 'border-ink/15 bg-surface-alt text-ink'
            }`}
          >
            <span className="opacity-50">{set.set_number}</span> {describeSet(exercise, set)}
          </li>
        ))}
      </ul>
    </div>
  )
}

function ExerciseLogCard({
  exercise,
  sessionId,
  loggedSets,
  lastSet,
  best,
  isNewPr,
  onLogged,
}: {
  exercise: Exercise
  sessionId: number
  loggedSets: SessionSetDetail[]
  lastSet: LastSet | null
  best: PersonalRecord | null
  isNewPr: boolean
  onLogged: (isNewPr: boolean) => void
}) {
  const logSet = useLogSet()
  const [weight, setWeight] = useState(lastSet?.weight_kg ?? (exercise.equipment === 'bodyweight' ? 0 : 20))
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
        : { sessionId, exercise_id: exercise.id, weight_kg: tracksWeight(exercise) ? weight : undefined, reps }
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
            weight_kg: tracksWeight(exercise) ? (lastSet.weight_kg ?? undefined) : undefined,
            reps: lastSet.reps ?? undefined,
          }
    const result = await logSet.mutateAsync(payload)
    onLogged(result.is_new_pr)
  }

  return (
    <div className="sticker flex flex-col overflow-hidden rounded-[var(--radius-card)] bg-surface">
      <ExerciseCard
        framed={false}
        exerciseKey={exercise.key}
        title={exercise.name}
        subtitle={`${setCount} set${setCount === 1 ? '' : 's'} logged · ${targetLabel(exercise)}${exercise.per_side ? ' per side' : ''}`}
        chip={isNewPr ? 'New PR!' : targetLabel(exercise)}
        className="min-h-[40vh] border-b-2 border-ink"
      >
        {/* Sits on the photo, under the name and target. min-h (not h) on the
            card so opening the set breakdown grows the photo instead of
            clipping the panel. */}
        <LastResult
          exercise={exercise}
          lastSet={lastSet}
          best={best}
          thisSessionSets={loggedSets}
        />
      </ExerciseCard>

      <div className="flex items-start justify-center gap-6 p-4">
        {exercise.type === 'time' ? (
          inMinutes(exercise) ? (
            <Ruler
              label="Minutes"
              value={Math.round(durationSec / 60)}
              step={1}
              max={180}
              majorEvery={5}
              labelEvery={10}
              onChange={(minutes) => setDurationSec(minutes * 60)}
            />
          ) : (
            <Ruler
              label="Seconds"
              value={durationSec}
              step={5}
              max={300}
              majorEvery={15}
              labelEvery={30}
              onChange={setDurationSec}
            />
          )
        ) : (
          <>
            {tracksWeight(exercise) && (
              <Ruler label="Kg" value={weight} step={1} max={200} majorEvery={5} labelEvery={10} onChange={setWeight} />
            )}
            <Ruler label="Reps" value={reps} step={1} max={50} majorEvery={5} labelEvery={5} onChange={setReps} />
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

/** "Choose my own exercises" flow: pick any exercise from the full catalog,
 * log as many sets as you like, then go back and pick another (or the same
 * one again) -- repeat freely until you hit Finish workout. */
function CustomExercisePicker({
  exercises,
  sessionId,
  loggedSets,
  lastSetByExercise,
  bestByExercise,
  newPrIds,
  onLogged,
}: {
  exercises: Exercise[]
  sessionId: number
  loggedSets: SessionSetDetail[]
  lastSetByExercise: Record<number, LastSet>
  bestByExercise: Record<number, PersonalRecord>
  newPrIds: Record<number, boolean>
  onLogged: (exerciseId: number, restSec: number, isNewPr: boolean) => void
}) {
  const [pickedId, setPickedId] = useState<number | null>(null)
  const picked = exercises.find((e) => e.id === pickedId) ?? null

  if (picked) {
    return (
      <div className="flex flex-col gap-3">
        <button
          type="button"
          onClick={() => setPickedId(null)}
          className="press self-start rounded-full border-2 border-ink bg-surface px-3 py-1.5 font-display text-[12px] font-extrabold uppercase tracking-[0.03em] text-ink shadow-[var(--shadow-pop)]"
        >
          ‹ Choose another exercise
        </button>
        <ExerciseLogCard
          exercise={picked}
          sessionId={sessionId}
          loggedSets={loggedSets.filter((s) => s.exercise_id === picked.id)}
          lastSet={lastSetByExercise[picked.id] ?? null}
          best={bestByExercise[picked.id] ?? null}
          isNewPr={Boolean(newPrIds[picked.id])}
          onLogged={(isNewPr) => onLogged(picked.id, picked.rest_sec, isNewPr)}
        />
      </div>
    )
  }

  return (
    <div className="flex flex-col gap-6">
      {CATALOG_SECTIONS.map(({ key, label }) => {
        const items = exercises.filter((e) => e.category === key).sort((a, b) => a.id - b.id)
        if (items.length === 0) return null
        return (
          <Section key={key} title={label}>
            <div className="grid grid-cols-2 gap-3">
              {items.map((ex) => {
                const setCount = loggedSets.filter((s) => s.exercise_id === ex.id).length
                return (
                  <button key={ex.id} type="button" onClick={() => setPickedId(ex.id)} className="press text-left">
                    <ExerciseCard
                      exerciseKey={ex.key}
                      title={ex.name}
                      subtitle={setCount > 0 ? `${setCount} set${setCount === 1 ? '' : 's'} logged` : targetLabel(ex)}
                      className="aspect-square"
                    />
                  </button>
                )
              })}
            </div>
          </Section>
        )
      })}
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
        {logged && <p className="text-[13px] font-semibold text-positive-text">Cardio logged.</p>}
      </form>
    </Card>
  )
}
