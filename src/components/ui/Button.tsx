import { Glass } from '@samasante/liquid-glass'
import type { ButtonHTMLAttributes, ReactNode } from 'react'

type Variant = 'primary' | 'secondary' | 'ghost' | 'danger'
type Size = 'md' | 'lg'

interface ButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: Variant
  size?: Size
  children: ReactNode
}

// primary/secondary/danger render as a real liquid-glass lens (it refracts
// whatever's behind the button); ghost has no box to refract, stays flat.
const variantTint: Record<Exclude<Variant, 'ghost'>, string> = {
  primary: 'color-mix(in oklab, var(--color-accent) 65%, transparent)',
  secondary: 'var(--color-glass)',
  danger: 'color-mix(in oklab, var(--color-negative) 65%, transparent)',
}

const variantTextClasses: Record<Variant, string> = {
  primary: 'text-white',
  secondary: 'text-ink',
  ghost: 'text-ink-secondary',
  danger: 'text-white',
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
  disabled,
  ...rest
}: ButtonProps) {
  if (variant === 'ghost') {
    return (
      <button
        disabled={disabled}
        className={`tap-target inline-flex items-center justify-center gap-2 rounded-[var(--radius-control)] bg-transparent font-display font-extrabold uppercase tracking-[0.03em] text-ink-secondary transition-colors active:bg-ink/5 disabled:cursor-not-allowed disabled:opacity-40 ${sizeClasses[size]} ${className}`}
        {...rest}
      >
        {children}
      </button>
    )
  }

  return (
    <Glass
      className={`inline-flex rounded-[var(--radius-control)] shadow-[var(--shadow-glass)] transition-transform active:scale-[0.97] ${disabled ? 'opacity-40' : ''} ${sizeClasses[size]} ${className}`}
      style={{ background: variantTint[variant] }}
    >
      <button
        disabled={disabled}
        className={`tap-target flex h-full w-full items-center justify-center gap-2 bg-transparent font-display font-extrabold uppercase tracking-[0.03em] disabled:cursor-not-allowed ${variantTextClasses[variant]}`}
        {...rest}
      >
        {children}
      </button>
    </Glass>
  )
}
