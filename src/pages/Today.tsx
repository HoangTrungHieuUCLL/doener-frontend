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
import { Button } from '../components/ui/Button'
import { Input } from '../components/ui/Input'
import { Card } from '../components/ui/Card'
import { ConfirmDialog } from '../components/ui/ConfirmDialog'
import { AddExerciseSheet } from '../components/AddExerciseSheet'
import { useHideTabBar, useTabBarVisibility } from '../components/TabBarVisibility'
import type { Placement } from '../components/AddExerciseSheet'
import { ExerciseCard } from '../components/ui/ExerciseCard'
import { Sparkline } from '../components/ui/Sparkline'
import { formatRelativeDay, parseUtcTimestamp, todayISO } from '../lib/date'
import { formatDuration, useCountdown, usePausableStopwatch } from '../lib/useStopwatch'
import { useLocalStorageState } from '../lib/useLocalStorageState'
import { useAutoFinish, wasAutoFinished } from '../lib/useAutoFinish'
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
    return (
      <FinishedSummary
        session={session}
        autoFinished={wasAutoFinished(session.id)}
        onStartNew={handleEndSession}
      />
    )
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
  autoFinished,
  onStartNew,
}: {
  session: { total_volume_kg: number | null; workout_key: SessionWorkoutKey }
  /** Ended by the idle timer rather than by hand -- say so, or it reads as a
   *  workout the user does not remember finishing. */
  autoFinished: boolean
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
        <p className="mt-3 text-[15px] text-ink-secondary">
          {autoFinished
            ? `${WORKOUT_LABELS[session.workout_key]} was wrapped up after 30 minutes without a set, timed to your last one.`
            : `${WORKOUT_LABELS[session.workout_key]} is in the books.`}
        </p>
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
  // A workout wants the whole screen; the nav swipes back up from the edge.
  useHideTabBar()
  const { displaySec, activeSec, isPaused, toggle: togglePause } = usePausableStopwatch(startedAt)
  const finishSession = useFinishSession()
  // Excluding this session keeps "last time" meaning a previous workout,
  // even after sets have been logged here.
  const { data: lastSets } = useLastSets(sessionId)
  const { data: prs } = usePrStats()
  const [newPrIds, setNewPrIds] = useState<Record<number, boolean>>({})
  const [confirmReset, setConfirmReset] = useState(false)
  // Scoped to this session: an exercise added today doesn't change the
  // workout itself. Kept in browser storage so it survives a reload before
  // any set has been logged against it.
  const [added, setAdded] = useLocalStorageState<AddedExercise[]>(
    `doener.addedExercises.${sessionId}`,
    [],
  )
  const [picking, setPicking] = useState(false)
  // Whatever the carousel has centred (or the exercise picked in a custom
  // workout): the one the set logger at the bottom logs against.
  const [selectedId, setSelectedId] = useState<number | null>(null)
  // Bumped when the app (not the finger) should move the carousel.
  const [scrollKey, setScrollKey] = useState(0)

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
  function handleSetLogged(exerciseId: number, isNewPr: boolean) {
    if (isNewPr) {
      setNewPrIds((prev) => ({ ...prev, [exerciseId]: true }))
    }
    touchActivity()
    // The confirm finished this exercise, so move to the next one that still
    // needs work. Computed against `exerciseId` rather than `isComplete`,
    // which is still reading the set list from before this log landed.
    const next = queue.find((e) => e.id !== exerciseId && !isComplete(e))
    if (next) {
      setSelectedId(next.id)
      setScrollKey((k) => k + 1)
    }
  }

  async function handleFinish() {
    await finishSession.mutateAsync({ sessionId, duration_sec: activeSec })
  }

  // Left alone for half an hour: close it out at the last set's time, so an
  // abandoned session does not record the idle stretch as training.
  const { touchActivity } = useAutoFinish({
    sessionId,
    startedAtMs: parseUtcTimestamp(startedAt).getTime(),
    hasSets: loggedSets.length > 0,
    onFinish: (durationSec) => {
      finishSession.mutate({ sessionId, duration_sec: durationSec })
    },
  })

  const setsDone = (id: number) => loggedSets.filter((s) => s.exercise_id === id).length
  // One confirm logs every set of an exercise, so anything with a set on it is
  // finished -- including when you chose fewer sets than the plan's target.
  const isComplete = (ex: Exercise) => setsDone(ex.id) > 0

  const firstRemaining = queue.find((e) => !isComplete(e)) ?? null

  // What the set logger at the bottom is logging against, if anything.
  const logTarget =
    workoutKey === 'cardio'
      ? null
      : (exercises.find((e) => e.id === selectedId) ?? (workoutKey === 'custom' ? null : firstRemaining))

  function handleAddExercise(exerciseId: number, placement: Placement) {
    setAdded((prev) => [
      ...prev,
      {
        exerciseId,
        afterExerciseId: placement === 'next' ? (logTarget?.id ?? null) : null,
      },
    ])
    setPicking(false)
  }

  // Only removable until it has sets: once logged, it is part of the record.
  function handleRemoveAdded(exerciseId: number) {
    setAdded((prev) => prev.filter((a) => a.exerciseId !== exerciseId))
    if (selectedId === exerciseId) setSelectedId(null)
  }

  const statusCard = (ex: Exercise) => (
    <ExerciseStatusCard
      key={ex.id}
      exercise={ex}
      loggedSets={loggedSets.filter((s) => s.exercise_id === ex.id)}
      lastSet={lastSetByExercise[ex.id] ?? null}
      best={bestByExercise[ex.id] ?? null}
      isNewPr={Boolean(newPrIds[ex.id])}
    />
  )

  return (
    <div className="flex min-h-0 flex-1 flex-col gap-3">
      {/* The clock, pause, reset and Finish now live in the dock, so the top
          of the screen is just the title and the cards start higher. */}
      <header>
        <h1 className="headline text-[34px]">{WORKOUT_LABELS[workoutKey]}</h1>
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

      {workoutKey === 'cardio' ? (
        <Section title="Cardio">
          <CardioForm sessionId={sessionId} />
        </Section>
      ) : workoutKey === 'custom' ? (
        <CustomExercisePicker
          exercises={exercises}
          loggedSets={loggedSets}
          pickedId={selectedId}
          onPick={setSelectedId}
          renderCard={(ex) => statusCard(ex)}
        />
      ) : queue.length === 0 ? null : (
        <ExerciseCarousel
          exercises={queue}
          centeredId={logTarget?.id ?? null}
          onCenteredChange={setSelectedId}
          scrollKey={scrollKey}
          isComplete={isComplete}
          onAddExercise={() => setPicking(true)}
          // Blank for the workout's own exercises: the heading already names
          // it, and repeating it cost a line the cards could use.
          sectionLabel={(ex) =>
            warmupIds.has(ex.id) ? 'Warm-up' : addedIds.has(ex.id) ? 'Added' : ''
          }
          renderCard={(ex) => (
            <>
              {statusCard(ex)}
              {addedIds.has(ex.id) && (
                <RemoveAddedButton
                  exercise={ex}
                  logged={loggedSets.some((st) => st.exercise_id === ex.id)}
                  onRemove={() => handleRemoveAdded(ex.id)}
                />
              )}
            </>
          )}
        />
      )}

      {picking && (
        <AddExerciseSheet
          exercises={exercises}
          inQueueIds={queueIds}
          currentExerciseName={logTarget?.name ?? null}
          onAdd={handleAddExercise}
          onClose={() => setPicking(false)}
        />
      )}

      {workoutKey !== 'cardio' && (
        <SessionDock
          displaySec={displaySec}
          isPaused={isPaused}
          onTogglePause={togglePause}
          onReset={() => setConfirmReset(true)}
          onFinish={handleFinish}
          finishPending={finishSession.isPending}
        >
          {logTarget && (
            <SetLogDock
              key={logTarget.id}
              exercise={logTarget}
              sessionId={sessionId}
              setCount={setsDone(logTarget.id)}
              lastSet={lastSetByExercise[logTarget.id] ?? null}
              onLogged={(isNewPr) => handleSetLogged(logTarget.id, isNewPr)}
            />
          )}
        </SessionDock>
      )}

    </div>
  )
}

/** The workout as one horizontal, snapping strip of exercise cards. Whatever
 * is centred is what the set logger below works on -- no tapping to select,
 * because on a phone the swipe that brings a card into view is the same
 * gesture that should choose it. */
function ExerciseCarousel({
  exercises,
  centeredId,
  onCenteredChange,
  scrollKey,
  isComplete,
  sectionLabel,
  onAddExercise,
  renderCard,
}: {
  exercises: Exercise[]
  centeredId: number | null
  onCenteredChange: (id: number) => void
  /** Changes when the app wants the track moved to `centeredId` itself. */
  scrollKey: number
  isComplete: (ex: Exercise) => boolean
  sectionLabel: (ex: Exercise) => string
  /** Opens the catalog picker; omitted where adding makes no sense. */
  onAddExercise?: () => void
  renderCard: (ex: Exercise) => ReactNode
}) {
  const trackRef = useRef<HTMLDivElement>(null)
  const centeredIndex = exercises.findIndex((e) => e.id === centeredId)
  const centered = centeredIndex >= 0 ? exercises[centeredIndex] : null

  // Report whichever card's middle is nearest the track's middle. Driven by
  // scroll rather than IntersectionObserver so a half-swipe that settles back
  // does not leave a different exercise selected than the one on screen.
  function handleScroll() {
    const track = trackRef.current
    if (!track) return
    const middle = track.scrollLeft + track.clientWidth / 2
    let bestId: number | null = null
    let bestDistance = Infinity
    for (const child of Array.from(track.children) as HTMLElement[]) {
      const id = Number(child.dataset.exerciseId)
      if (!id) continue
      const distance = Math.abs(child.offsetLeft + child.offsetWidth / 2 - middle)
      if (distance < bestDistance) {
        bestDistance = distance
        bestId = id
      }
    }
    if (bestId !== null && bestId !== centeredId) onCenteredChange(bestId)
  }

  // Centre the active card on mount (open on the thing to do, not on the
  // warm-up already done) and whenever `scrollKey` says the app moved it.
  // Never on a plain centre change -- that would fight the finger mid-swipe.
  useEffect(() => {
    const track = trackRef.current
    if (!track || centeredIndex < 0) return
    const child = track.children[centeredIndex] as HTMLElement | undefined
    if (!child) return
    track.scrollTo({
      left: child.offsetLeft + child.offsetWidth / 2 - track.clientWidth / 2,
      behavior: scrollKey === 0 ? ('instant' as ScrollBehavior) : 'smooth',
    })
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [scrollKey])

  return (
    <section className="flex min-h-0 flex-1 flex-col gap-3">
      <div className="eyebrow flex items-center justify-between text-[12px]">
        <span>{centered ? sectionLabel(centered) : ''}</span>
        <span>
          {centeredIndex + 1} of {exercises.length}
        </span>
      </div>
      <div className="flex items-center gap-2">
        <div className="flex flex-1 gap-1">
          {exercises.map((ex, i) => (
            <span
              key={ex.id}
              className={`h-1.5 flex-1 rounded-full border border-ink/20 ${
                isComplete(ex) ? 'bg-positive' : i === centeredIndex ? 'bg-accent' : 'bg-surface'
              }`}
            />
          ))}
        </div>
        {onAddExercise && (
          <button
            type="button"
            onClick={onAddExercise}
            aria-label="Add an exercise"
            className="sticker press flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-surface text-ink"
          >
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3">
              <path d="M12 5v14M5 12h14" strokeLinecap="round" />
            </svg>
          </button>
        )}
      </div>
      {/* -mx-4 + px-4 lets the cards bleed to the screen edges while the first
          and last still centre. pb-2, not pb-1: overflow-x clips the y axis
          too, and the card's 4px offset shadow sat flush against a 4px pad,
          so sub-pixel rounding shaved it and the card read as cropped. */}
      <div
        ref={trackRef}
        onScroll={handleScroll}
        className="-mx-4 flex min-h-0 flex-1 snap-x snap-mandatory gap-3 overflow-x-auto scroll-smooth px-4 pb-2 [scrollbar-width:none] [&::-webkit-scrollbar]:hidden"
      >
        {exercises.map((ex) => (
          <div
            key={ex.id}
            data-exercise-id={ex.id}
            className={`flex w-[86%] shrink-0 snap-center flex-col gap-2 transition-opacity ${
              ex.id === centeredId ? 'opacity-100' : 'opacity-55'
            }`}
          >
            {renderCard(ex)}
          </div>
        ))}
      </div>
    </section>
  )
}

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
  min = 0,
  max,
  majorEvery,
  labelEvery,
  onChange,
}: {
  label: string
  value: number
  step: number
  /** Lowest selectable value; the ruler cannot be scrolled below it. @default 0 */
  min?: number
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
  const ticks = Math.floor((max - min) / step)
  const index = Math.round((value - min) / step)
  const valueAt = (i: number) => round1(min + Math.min(ticks, Math.max(0, i)) * step)

  useEffect(() => {
    if (value === reported.current || !ref.current) return
    ref.current.scrollTop = Math.round((value - min) / step) * TICK_PX
  }, [value, step, min])

  function handleScroll() {
    if (!ref.current) return
    const next = Math.min(ticks, Math.max(0, Math.round(ref.current.scrollTop / TICK_PX)))
    if (next === index) return
    reported.current = valueAt(next)
    onChange(reported.current)
  }

  function handleKeyDown(e: KeyboardEvent<HTMLDivElement>) {
    const delta = { ArrowLeft: -1, ArrowDown: -1, ArrowRight: 1, ArrowUp: 1 }[e.key]
    if (delta === undefined) return
    e.preventDefault()
    onChange(valueAt(index + delta))
  }

  return (
    <div className="flex items-center gap-1.5">
      <div className="flex w-11 flex-col items-end">
        <span className="eyebrow text-[10px] text-ink-tertiary">{label}</span>
        <span className="font-display text-[22px] font-black leading-none tabular-nums text-ink">{round1(value)}</span>
      </div>
      {/* Scales with the screen, but stays short: the dock is sized by its
          contents, so every pixel here is one the panel adds to its own
          height and, past the screen's, one it loses off the bottom. */}
      <div className="relative h-[clamp(6rem,15vh,8.5rem)] w-14">
        <div
          ref={ref}
          role="slider"
          tabIndex={0}
          aria-label={label}
          aria-orientation="vertical"
          aria-valuemin={min}
          aria-valuemax={max}
          aria-valuenow={value}
          onScroll={handleScroll}
          onKeyDown={handleKeyDown}
          className="flex h-full snap-y snap-mandatory flex-col overflow-y-auto overscroll-contain rounded-[var(--radius-control)] outline-offset-2 [mask-image:linear-gradient(transparent,black_25%,black_75%,transparent)] [scrollbar-width:none] [&::-webkit-scrollbar]:hidden"
        >
          {/* Half-height spacers let the min and the max reach the center line. */}
          <div className="shrink-0" style={{ height: `calc(50% - ${TICK_PX / 2}px)` }} />
          {Array.from({ length: ticks + 1 }, (_, i) => {
            const tick = valueAt(i)
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

/** The exercise photo with its name, target and last result. Logging happens
 * in the SetLogDock; in list mode tapping the card picks it for the dock. */
function ExerciseStatusCard({
  exercise,
  loggedSets,
  lastSet,
  best,
  isNewPr,
  selected,
  onSelect,
}: {
  exercise: Exercise
  loggedSets: SessionSetDetail[]
  lastSet: LastSet | null
  best: PersonalRecord | null
  isNewPr: boolean
  selected?: boolean
  onSelect?: () => void
}) {
  const setCount = loggedSets.length
  return (
    <div
      role={onSelect ? 'button' : undefined}
      tabIndex={onSelect ? 0 : undefined}
      aria-pressed={onSelect ? selected : undefined}
      onClick={onSelect}
      onKeyDown={(e) => {
        if (onSelect && (e.key === 'Enter' || e.key === ' ') && e.target === e.currentTarget) {
          e.preventDefault()
          onSelect()
        }
      }}
      // min-h-0 flex-1 so the card fills the height the carousel hands it,
      // sharing with the remove button when an added exercise has one.
      className={`sticker flex min-h-0 flex-1 flex-col overflow-hidden rounded-[var(--radius-card)] bg-surface ${
        onSelect ? 'cursor-pointer' : ''
      } ${selected ? 'outline outline-[3px] outline-offset-2 outline-accent' : ''}`}
    >
      <ExerciseCard
        framed={false}
        exerciseKey={exercise.key}
        title={exercise.name}
        subtitle={`${setCount} set${setCount === 1 ? '' : 's'} logged · ${targetLabel(exercise)}${exercise.per_side ? ' per side' : ''}`}
        // Target only ever repeated the subtitle; the chip now earns its
        // place by appearing solely for a new record.
        chip={isNewPr ? 'New PR!' : undefined}
        className={onSelect ? 'min-h-[26vh]' : 'min-h-0 flex-1'}
      >
        {/* Sits on the photo, under the name and target. min-h (not h) on the
            card so opening the set breakdown grows the photo instead of
            clipping the panel. */}
        <div onClick={(e) => e.stopPropagation()}>
          <LastResult exercise={exercise} lastSet={lastSet} best={best} thisSessionSets={loggedSets} />
        </div>
      </ExerciseCard>
    </div>
  )
}

/** The bar pinned to the bottom for the whole workout: the session's clock and
 * controls, and — when there is something to log against — the rulers and the
 * one confirm. It is always mounted, so Finish stays reachable after the last
 * exercise is done. */
function SessionDock({
  displaySec,
  isPaused,
  onTogglePause,
  onReset,
  onFinish,
  finishPending,
  children,
}: {
  displaySec: number
  isPaused: boolean
  onTogglePause: () => void
  onReset: () => void
  onFinish: () => void
  finishPending: boolean
  children?: ReactNode
}) {
  const { hiddenByScreen: tabBarHidden } = useTabBarVisibility()
  return (
    // Sticky inside <main> (the scroller). With the tab bar hidden the dock
    // floats on the same 8px inset all round: -mx-2 widens it from the page's
    // 16px gutter to the tab bar's 8px inset, so the two line up, and mb-2
    // matches that below. The margin stays clear of the home indicator; the
    // panel's own bottom padding does that, so the inset does not have to
    // carry it and leave a band of background under the card. On both the
    // margin and the sticky offset, so the gap survives the dock pinning
    // itself on a screen that has to scroll. Otherwise it clears the tab bar.
    // Wide screens have no tab bar either way.
    <div
      className={`sticky z-10 -mx-2 shrink-0 md:bottom-4 md:mx-0 ${
        tabBarHidden ? 'mb-2 bottom-2' : 'bottom-[calc(5.5rem+env(safe-area-inset-bottom))]'
      }`}
    >
      <div
          // The home indicator covers the screen's bottom 34pt, of which the
          // 8px margin below accounts for one; the rest is padding, so "Log
          // set" stays out from under the indicator while the card itself
          // still reaches down to the same inset as its left and right.
          className={`sticker animate-dialog-in flex flex-col gap-2 rounded-[var(--radius-card)] bg-surface p-2.5 shadow-[var(--shadow-lg)] ${
            tabBarHidden ? 'pb-[max(0.625rem,calc(env(safe-area-inset-bottom)_-_0.5rem))]' : ''
          }`}
        >
        <div className="flex items-center gap-1.5">
          <p className="font-display text-[26px] font-black leading-none tabular-nums text-ink">
            {formatDuration(displaySec)}
          </p>
          <span
            className={`rounded-full border-2 border-ink px-1.5 py-px font-display text-[9px] font-extrabold uppercase tracking-[0.05em] ${
              isPaused ? 'bg-surface-alt text-ink' : 'bg-positive text-ink'
            }`}
          >
            {isPaused ? 'Paused' : 'On'}
          </span>
          <span className="flex-1" />
          <button
            type="button"
            onClick={onTogglePause}
            aria-label={isPaused ? 'Resume workout' : 'Pause workout'}
            className="press flex h-8 w-8 shrink-0 items-center justify-center rounded-full border-2 border-ink bg-surface text-ink"
          >
            {isPaused ? (
              <svg width="14" height="14" viewBox="0 0 24 24" fill="currentColor">
                <path d="M8 5v14l11-7z" />
              </svg>
            ) : (
              <svg width="14" height="14" viewBox="0 0 24 24" fill="currentColor">
                <path d="M6 5h4v14H6zM14 5h4v14h-4z" />
              </svg>
            )}
          </button>
          <button
            type="button"
            onClick={onReset}
            aria-label="Reset workout"
            className="press flex h-8 w-8 shrink-0 items-center justify-center rounded-full border-2 border-ink bg-surface text-ink"
          >
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
              <path d="M3 12a9 9 0 1 1 3 6.7M3 12v5h5" strokeLinecap="round" strokeLinejoin="round" />
            </svg>
          </button>
          <button
            type="button"
            onClick={onFinish}
            disabled={finishPending}
            className="press shrink-0 rounded-full border-2 border-ink bg-accent px-3 py-1.5 font-display text-[12px] font-extrabold uppercase tracking-[0.05em] text-white disabled:opacity-40"
          >
            {finishPending ? 'Finishing…' : 'Finish'}
          </button>
        </div>
        {children}
      </div>
    </div>
  )
}

/** Rulers and the single confirm for the exercise in the middle of the
 * carousel. Rendered inside {@link SessionDock}. */
function SetLogDock({
  exercise,
  sessionId,
  setCount,
  lastSet,
  onLogged,
  onClose,
}: {
  exercise: Exercise
  sessionId: number
  setCount: number
  lastSet: LastSet | null
  onLogged: (isNewPr: boolean) => void
  /** Shown as a close button where the logger can be dismissed. */
  onClose?: () => void
}) {
  const logSet = useLogSet()
  // How many sets this confirm will record. Seeded from the plan's target, so
  // the common case is: set the weight, confirm once, exercise done.
  const [sets, setSets] = useState(exercise.sets)
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

  /** One confirm for the whole exercise: the chosen set count is recorded as
   *  that many identical sets. The API takes one set per call, so they go up
   *  in sequence -- each needs the set_number the one before it created. */
  async function logAllSets() {
    const payload =
      exercise.type === 'time'
        ? { sessionId, exercise_id: exercise.id, duration_sec: durationSec }
        : { sessionId, exercise_id: exercise.id, weight_kg: tracksWeight(exercise) ? weight : undefined, reps }
    let anyNewPr = false
    for (let i = 0; i < sets; i++) {
      const result = await logSet.mutateAsync(payload)
      anyNewPr = anyNewPr || result.is_new_pr
    }
    onLogged(anyNewPr)
  }

  return (
    <>
      <div className="flex items-center gap-2 border-t-2 border-ink/10 pt-2">
        <p className="min-w-0 flex-1 truncate font-display text-[13px] font-black uppercase leading-none text-ink">
          {exercise.name}
        </p>
        <span className="shrink-0 text-[11px] font-semibold text-ink-tertiary">
          {setCount > 0 ? `${setCountLabel(setCount)} logged` : `Target ${targetLabel(exercise).replace('target ', '')}`}
        </span>
        {onClose && (
          <button
            type="button"
            onClick={onClose}
            aria-label="Close set logger"
            className="flex h-7 w-7 shrink-0 items-center justify-center rounded-full border-2 border-ink bg-surface text-ink"
          >
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3">
              <path d="M6 6l12 12M18 6L6 18" strokeLinecap="round" />
            </svg>
          </button>
        )}
      </div>

      {/* The rulers get the full width: three of them beside a fixed-width
          button overflowed the row and pushed the button off the screen. This
          row is also the one that stretches, so spare height widens the ruler
          window rather than inflating the photo above it. */}
      <div className="flex justify-center gap-3">
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
        <Ruler label="Sets" value={sets} step={1} min={1} max={12} majorEvery={1} labelEvery={1} onChange={setSets} />
      </div>

      <Button size="md" className="w-full" onClick={logAllSets} disabled={logSet.isPending}>
        {logSet.isPending ? 'Logging…' : sets === 1 ? 'Log set' : `Log ${sets} sets`}
      </Button>
    </>
  )
}

/** "Choose my own exercises" flow: pick any exercise from the full catalog,
 * log as many sets as you like, then go back and pick another (or the same
 * one again) -- repeat freely until you hit Finish workout. */
function CustomExercisePicker({
  exercises,
  loggedSets,
  pickedId,
  onPick,
  renderCard,
}: {
  exercises: Exercise[]
  loggedSets: SessionSetDetail[]
  pickedId: number | null
  onPick: (exerciseId: number | null) => void
  renderCard: (exercise: Exercise) => ReactNode
}) {
  const picked = exercises.find((e) => e.id === pickedId) ?? null

  if (picked) {
    return (
      <div className="flex flex-col gap-3">
        <button
          type="button"
          onClick={() => onPick(null)}
          className="press self-start rounded-full border-2 border-ink bg-surface px-3 py-1.5 font-display text-[12px] font-extrabold uppercase tracking-[0.03em] text-ink shadow-[var(--shadow-pop)]"
        >
          ‹ Choose another exercise
        </button>
        {renderCard(picked)}
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
                  <button key={ex.id} type="button" onClick={() => onPick(ex.id)} className="press text-left">
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
