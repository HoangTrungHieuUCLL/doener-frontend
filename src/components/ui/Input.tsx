import type { InputHTMLAttributes } from 'react'

interface InputProps extends InputHTMLAttributes<HTMLInputElement> {
  label?: string
}

export function Input({ label, id, className = '', ...rest }: InputProps) {
  const inputEl = (
    <input
      id={id}
      className={`h-11 w-full rounded-[var(--radius-control)] border border-border bg-surface px-3.5 text-[16px] text-ink placeholder:text-ink-placeholder focus:border-accent focus:outline-none focus:ring-2 focus:ring-accent-soft ${className}`}
      {...rest}
    />
  )

  if (!label) return inputEl

  return (
    <label htmlFor={id} className="flex flex-col gap-1.5">
      <span className="text-[13px] font-medium text-ink-secondary">{label}</span>
      {inputEl}
    </label>
  )
}
