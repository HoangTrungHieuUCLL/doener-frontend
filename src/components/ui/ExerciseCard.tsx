import type { ReactNode } from 'react'
import { exerciseImageUrl } from '../../lib/exerciseImages'

export function ExerciseCard({
  exerciseKey,
  title,
  subtitle,
  chip,
  framed = true,
  compact = false,
  className = '',
  children,
}: {
  exerciseKey: string
  title: string
  subtitle?: string
  /** Floating stat chip content, e.g. "3x10" or "45s rest". */
  chip?: ReactNode
  /** Standalone card with its own ink frame (default), or flush inside a
   * parent card that already draws the frame. */
  framed?: boolean
  /** Smaller type and padding on phones, for the 3-column catalog grid. */
  compact?: boolean
  className?: string
  children?: ReactNode
}) {
  return (
    <div
      className={`relative flex flex-col overflow-hidden bg-ink ${framed ? 'rounded-[var(--radius-card)] border border-white/20 shadow-[var(--shadow-glass)]' : ''} ${className}`}
    >
      <img
        src={exerciseImageUrl(exerciseKey)}
        alt=""
        loading="lazy"
        className="absolute inset-0 h-full w-full object-cover"
      />
      <div className="absolute inset-0 bg-gradient-to-t from-black/85 via-black/25 to-transparent" />
      {chip && (
        <span className="photo-chip absolute right-3 top-3 rounded-full px-2.5 py-0.5 font-display text-[12px] font-extrabold uppercase tracking-[0.03em]">
          {chip}
        </span>
      )}
      <div className={`relative flex flex-1 flex-col justify-end gap-0.5 ${compact ? 'p-2.5 md:p-4' : 'p-4'}`}>
        <h3
          className={`font-display font-black uppercase leading-none break-words text-white ${compact ? 'text-[13px] md:text-[19px]' : 'text-[19px]'}`}
        >
          {title}
        </h3>
        {subtitle && (
          <p className={`mt-1 font-medium text-white/85 ${compact ? 'text-[11px] md:text-[13px]' : 'text-[13px]'}`}>{subtitle}</p>
        )}
        {children}
      </div>
    </div>
  )
}
