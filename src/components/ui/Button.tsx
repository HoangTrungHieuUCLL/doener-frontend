import type { ButtonHTMLAttributes, ReactNode } from 'react'

type Variant = 'primary' | 'secondary' | 'ghost' | 'danger'
type Size = 'md' | 'lg'

interface ButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: Variant
  size?: Size
  children: ReactNode
}

// Solid variants keep a vivid fill (still need to read as buttons at a
// glance) but swap the hard ink outline for a soft glass edge + glow;
// secondary is full glass; ghost stays flat.
const variantClasses: Record<Variant, string> = {
  primary:
    'bg-accent/90 text-white border border-white/25 shadow-[var(--shadow-glass)] press disabled:opacity-40 disabled:shadow-none',
  secondary: 'glass text-ink press disabled:opacity-40 disabled:shadow-none',
  ghost: 'bg-transparent text-ink-secondary active:bg-ink/5 disabled:opacity-40',
  danger:
    'bg-negative/90 text-white border border-white/25 shadow-[var(--shadow-glass)] press disabled:opacity-40 disabled:shadow-none',
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
