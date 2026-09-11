import { useCallback, useEffect, useRef, useState } from 'react'
import { parseUtcTimestamp } from './date'

/** Counts up in seconds from a given start time. */
export function useStopwatch(startedAt: string | null) {
  const [elapsedSec, setElapsedSec] = useState(0)

  useEffect(() => {
    if (!startedAt) {
      setElapsedSec(0)
      return
    }
    const start = parseUtcTimestamp(startedAt).getTime()
    const tick = () => setElapsedSec(Math.max(0, Math.floor((Date.now() - start) / 1000)))
    tick()
    const id = setInterval(tick, 1000)
    return () => clearInterval(id)
  }, [startedAt])

  return elapsedSec
}

/** Like useStopwatch, but pausable: while paused the displayed value freezes
 * and paused time is tracked separately so `activeSec` (what actually gets
 * submitted on finish) excludes it. */
export function usePausableStopwatch(startedAt: string | null) {
  const wallClockSec = useStopwatch(startedAt)
  const [isPaused, setIsPaused] = useState(false)
  const [pauseStartSec, setPauseStartSec] = useState<number | null>(null)
  const [pausedTotalSec, setPausedTotalSec] = useState(0)

  const toggle = useCallback(() => {
    if (isPaused) {
      // resuming: fold the just-finished pause interval into the total
      setPausedTotalSec((total) => total + (wallClockSec - (pauseStartSec ?? wallClockSec)))
      setPauseStartSec(null)
    } else {
      setPauseStartSec(wallClockSec)
    }
    setIsPaused((prev) => !prev)
  }, [isPaused, pauseStartSec, wallClockSec])

  useEffect(() => {
    setPauseStartSec(null)
    setPausedTotalSec(0)
    setIsPaused(false)
  }, [startedAt])

  const displaySec = isPaused && pauseStartSec !== null ? pauseStartSec : wallClockSec
  const currentPauseSec = isPaused && pauseStartSec !== null ? wallClockSec - pauseStartSec : 0
  const activeSec = Math.max(0, wallClockSec - pausedTotalSec - currentPauseSec)

  return { displaySec, activeSec, isPaused, toggle }
}

export function formatDuration(totalSec: number): string {
  const h = Math.floor(totalSec / 3600)
  const m = Math.floor((totalSec % 3600) / 60)
  const s = totalSec % 60
  if (h > 0) {
    return `${h}:${String(m).padStart(2, '0')}:${String(s).padStart(2, '0')}`
  }
  return `${m}:${String(s).padStart(2, '0')}`
}

/** Counts down from `durationSec`, calling onComplete once when it hits 0. */
export function useCountdown(durationSec: number, key: number, onComplete: () => void) {
  const [remaining, setRemaining] = useState(durationSec)
  const onCompleteRef = useRef(onComplete)
  onCompleteRef.current = onComplete

  useEffect(() => {
    setRemaining(durationSec)
    if (durationSec <= 0) return
    const end = Date.now() + durationSec * 1000
    const id = setInterval(() => {
      const left = Math.max(0, Math.round((end - Date.now()) / 1000))
      setRemaining(left)
      if (left <= 0) {
        clearInterval(id)
        onCompleteRef.current()
      }
    }, 250)
    return () => clearInterval(id)
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [durationSec, key])

  return remaining
}
