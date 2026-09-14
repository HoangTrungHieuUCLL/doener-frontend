import type { ReactNode } from 'react'
import { exerciseImageUrl } from '../../lib/exerciseImages'

export function ExerciseCard({
  exerciseKey,
  title,
  subtitle,
  chip,
  framed = true,
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
  className?: string
  children?: ReactNode
}) {
  return (
    <div
      className={`relative overflow-hidden bg-ink ${framed ? 'rounded-[var(--radius-card)] border border-white/20 shadow-[var(--shadow-glass)]' : ''} ${className}`}
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
      <div className="relative flex h-full flex-col justify-end gap-0.5 p-4">
        <h3 className="font-display text-[19px] font-black uppercase leading-none text-white">{title}</h3>
        {subtitle && <p className="mt-1 text-[13px] font-medium text-white/85">{subtitle}</p>}
        {children}
      </div>
    </div>
  )
}
