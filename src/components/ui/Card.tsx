import type { HTMLAttributes, ReactNode } from 'react'

export function Card({
  children,
  className = '',
  ...rest
}: HTMLAttributes<HTMLDivElement> & { children: ReactNode }) {
  return (
    <div
      className={`rounded-[var(--radius-card)] border border-border bg-surface p-4 shadow-[var(--shadow-card)] ${className}`}
      {...rest}
    >
      {children}
    </div>
  )
}
