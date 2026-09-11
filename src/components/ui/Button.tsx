import type { ButtonHTMLAttributes, ReactNode } from 'react'

type Variant = 'primary' | 'secondary' | 'ghost' | 'danger'
type Size = 'md' | 'lg'

interface ButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: Variant
  size?: Size
  children: ReactNode
}

// Outlined variants sit on a hard ink shadow and sink into it on press
// (`press` utility); ghost stays flat.
const variantClasses: Record<Variant, string> = {
  primary:
    'bg-accent text-white border-2 border-ink shadow-[var(--shadow-pop)] press disabled:opacity-40 disabled:shadow-none',
  secondary:
    'bg-surface text-ink border-2 border-ink shadow-[var(--shadow-pop)] press disabled:opacity-40 disabled:shadow-none',
  ghost: 'bg-transparent text-ink-secondary active:bg-surface-alt disabled:opacity-40',
  danger:
    'bg-negative text-white border-2 border-ink shadow-[var(--shadow-pop)] press disabled:opacity-40 disabled:shadow-none',
}

const sizeClasses: Record<Size, string> = {
  md: 'h-11 px-4 text-[14px]',
  lg: 'h-14 px-6 text-[17px]',
}

export function Button({
  variant = 'primary',
  size = 'md',
  className = '',
  children,
  ...rest
}: ButtonProps) {
  return (
    <button
      className={`tap-target inline-flex items-center justify-center gap-2 rounded-[var(--radius-control)] font-display font-extrabold uppercase tracking-[0.03em] disabled:cursor-not-allowed ${variantClasses[variant]} ${sizeClasses[size]} ${className}`}
      {...rest}
    >
      {children}
    </button>
  )
}
