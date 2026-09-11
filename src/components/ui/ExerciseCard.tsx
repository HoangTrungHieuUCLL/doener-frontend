import type { ReactNode } from 'react'
import { exerciseImageUrl } from '../../lib/exerciseImages'

export function ExerciseCard({
  exerciseKey,
  title,
  subtitle,
  chip,
  className = '',
  children,
}: {
  exerciseKey: string
  title: string
  subtitle?: string
  /** Floating stat chip content, e.g. "3x10" or "45s rest". */
  chip?: ReactNode
  className?: string
  children?: ReactNode
}) {
  return (
    <div
      className={`relative overflow-hidden rounded-[var(--radius-card)] border border-border ${className}`}
    >
      <img
        src={exerciseImageUrl(exerciseKey)}
        alt=""
        loading="lazy"
        className="absolute inset-0 h-full w-full object-cover"
      />
      <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/20 to-transparent" />
      {chip && (
        <span className="scrim-chip absolute right-3 top-3 rounded-full px-2.5 py-1 text-[12px] font-semibold">
          {chip}
        </span>
      )}
      <div className="relative flex h-full flex-col justify-end gap-0.5 p-4">
        <h3 className="text-[16px] font-semibold text-white">{title}</h3>
        {subtitle && <p className="text-[13px] text-white/80">{subtitle}</p>}
        {children}
      </div>
    </div>
  )
}
