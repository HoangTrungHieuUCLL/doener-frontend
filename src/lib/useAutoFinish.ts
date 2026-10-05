import { useCallback, useEffect, useRef } from 'react'

/** A session with no set logged for this long is treated as abandoned. */
export const IDLE_LIMIT_MS = 30 * 60 * 1000

const activityKey = (sessionId: number) => `doener.lastSetAt.${sessionId}`
/** Read by the finished-summary screen to explain why the session ended. */
export const autoFinishedKey = (sessionId: number) => `doener.autoFinished.${sessionId}`

/** Whether a session whose last set landed at `lastActivityMs` has gone stale. */
export function isIdle(lastActivityMs: number, now: number = Date.now()): boolean {
  return now - lastActivityMs >= IDLE_LIMIT_MS
}

/**
 * Seconds to record for an auto-finished session: start to LAST SET, never to
 * now, so idle time is not banked as training. Clamped at zero, since a clock
 * change or a hand-edited stamp can put the last activity before the start.
 */
export function idleFinishDurationSec(lastActivityMs: number, startedAtMs: number): number {
  return Math.max(0, Math.round((lastActivityMs - startedAtMs) / 1000))
}

function readStamp(key: string): number | null {
  try {
    const raw = localStorage.getItem(key)
    if (!raw) return null
    const n = Number(raw)
    return Number.isFinite(n) ? n : null
  } catch {
    return null
  }
}

function writeStamp(key: string, value: number) {
  try {
    localStorage.setItem(key, String(value))
  } catch {
    // Private mode and blocked storage are fine: the session just never
    // auto-finishes, which is the safe direction to fail in.
  }
}

/**
 * Finishes a workout that has been left alone for {@link IDLE_LIMIT_MS}.
 *
 * The recorded duration runs to the LAST LOGGED SET, not to now, so a session
 * forgotten overnight does not bank the idle hours as training time.
 *
 * The check runs on mount as well as on a timer, so a session abandoned with
 * the app closed is finished the next time it is opened rather than waiting
 * for a tab that is no longer running. Timestamps live in browser storage
 * because the API's set rows carry no created_at to read this from.
 */
export function useAutoFinish({
  sessionId,
  startedAtMs,
  hasSets,
  onFinish,
}: {
  sessionId: number
  startedAtMs: number
  /** Whether any set has been logged; without one the clock runs from the start. */
  hasSets: boolean
  /** Called once with the seconds to record. Must be idempotent-safe. */
  onFinish: (durationSec: number) => void
}) {
  const firedRef = useRef(false)
  const onFinishRef = useRef(onFinish)
  useEffect(() => {
    onFinishRef.current = onFinish
  }, [onFinish])

  /** Call after every logged set to restart the idle clock. */
  const touchActivity = useCallback(() => {
    writeStamp(activityKey(sessionId), Date.now())
  }, [sessionId])

  useEffect(() => {
    // Seed on first sight so a session that never gets a set still ages out.
    if (readStamp(activityKey(sessionId)) === null) {
      writeStamp(activityKey(sessionId), hasSets ? Date.now() : startedAtMs)
    }

    function check() {
      if (firedRef.current) return
      const lastActivity = readStamp(activityKey(sessionId)) ?? startedAtMs
      if (!isIdle(lastActivity)) return
      firedRef.current = true
      writeStamp(autoFinishedKey(sessionId), 1)
      onFinishRef.current(idleFinishDurationSec(lastActivity, startedAtMs))
    }

    check()
    const id = setInterval(check, 30_000)
    // A phone that slept through the limit fires no timers, so re-check when
    // the tab comes back rather than waiting for the next interval.
    document.addEventListener('visibilitychange', check)
    return () => {
      clearInterval(id)
      document.removeEventListener('visibilitychange', check)
    }
  }, [sessionId, startedAtMs, hasSets])

  return { touchActivity }
}

/** True if this session was ended by the idle timer rather than by hand. */
export function wasAutoFinished(sessionId: number): boolean {
  return readStamp(autoFinishedKey(sessionId)) === 1
}
