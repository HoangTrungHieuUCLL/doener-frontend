import type { HTMLAttributes, ReactNode } from 'react'

export function Card({
  children,
  className = '',
  ...rest
}: HTMLAttributes<HTMLDivElement> & { children: ReactNode }) {
  return (
    <div
      className={`sticker rounded-[var(--radius-card)] bg-surface p-4 ${className}`}
      {...rest}
    >
      {children}
    </div>
  )
}
