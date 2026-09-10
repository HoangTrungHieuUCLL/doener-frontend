import { useEffect } from 'react'
import { notifyRestComplete } from '../lib/feedback'
import { formatDuration, useCountdown } from '../lib/useStopwatch'

interface RestTimerProps {
  /** Bump this to restart the timer (e.g. exercise key + set count). */
  restartKey: number
  durationSec: number
  onDismiss: () => void
}

export function RestTimer({ restartKey, durationSec, onDismiss }: RestTimerProps) {
  const remaining = useCountdown(durationSec, restartKey, () => {
    notifyRestComplete()
  })

  useEffect(() => {
    if (remaining === 0) {
      const t = setTimeout(onDismiss, 1600)
      return () => clearTimeout(t)
    }
  }, [remaining, onDismiss])

  const pct = durationSec > 0 ? 1 - remaining / durationSec : 1

  return (
    <div className="flex items-center gap-3 rounded-[var(--radius-control)] border border-accent-soft bg-accent-soft px-4 py-3">
      <div className="relative h-11 w-11 shrink-0">
        <svg viewBox="0 0 44 44" className="h-11 w-11 -rotate-90">
          <circle cx="22" cy="22" r="18" fill="none" stroke="#ffffff" strokeWidth="4" />
          <circle
            cx="22"
            cy="22"
            r="18"
            fill="none"
            stroke="var(--color-accent-strong)"
            strokeWidth="4"
            strokeLinecap="round"
            strokeDasharray={2 * Math.PI * 18}
            strokeDashoffset={2 * Math.PI * 18 * (1 - pct)}
          />
        </svg>
      </div>
      <div className="flex-1">
        <p className="text-[13px] font-medium text-ink-secondary">
          {remaining > 0 ? 'Resting…' : 'Rest complete'}
        </p>
        <p className="text-[20px] font-semibold tabular-nums text-ink">{formatDuration(remaining)}</p>
      </div>
      <button
        onClick={onDismiss}
        className="tap-target rounded-full px-3 text-[13px] font-medium text-accent-strong"
      >
        Skip
      </button>
    </div>
  )
}
