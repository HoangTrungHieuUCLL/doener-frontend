import type { HTMLAttributes, ReactNode } from 'react'

export function Card({
  children,
  className = '',
  ...rest
}: HTMLAttributes<HTMLDivElement> & { children: ReactNode }) {
  return (
    <div
      className={`glass rounded-[var(--radius-card)] p-4 ${className}`}
      {...rest}
    >
      {children}
    </div>
  )
}
