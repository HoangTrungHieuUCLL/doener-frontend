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
    <div className="sticker flex items-center gap-3 rounded-[var(--radius-card)] bg-highlight px-4 py-3">
      <div className="relative h-11 w-11 shrink-0">
        <svg viewBox="0 0 44 44" className="h-11 w-11 -rotate-90">
          <circle cx="22" cy="22" r="18" fill="none" stroke="rgba(20,20,20,0.15)" strokeWidth="4" />
          <circle
            cx="22"
            cy="22"
            r="18"
            fill="none"
            stroke="var(--color-ink)"
            strokeWidth="4"
            strokeLinecap="round"
            strokeDasharray={2 * Math.PI * 18}
            strokeDashoffset={2 * Math.PI * 18 * (1 - pct)}
          />
        </svg>
      </div>
      <div className="flex-1">
        <p className="eyebrow text-[12px]">
          {remaining > 0 ? 'Resting…' : 'Rest complete'}
        </p>
        <p className="font-display text-[26px] font-black leading-none tabular-nums text-ink">{formatDuration(remaining)}</p>
      </div>
      <button
        onClick={onDismiss}
        className="tap-target press rounded-full border-2 border-ink bg-surface px-4 font-display text-[13px] font-extrabold uppercase text-ink shadow-[var(--shadow-pop)]"
      >
        Skip
      </button>
    </div>
  )
}
