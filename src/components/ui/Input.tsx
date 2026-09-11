import type { InputHTMLAttributes } from 'react'

interface InputProps extends InputHTMLAttributes<HTMLInputElement> {
  label?: string
}

export function Input({ label, id, className = '', ...rest }: InputProps) {
  const inputEl = (
    <input
      id={id}
      className={`h-12 w-full rounded-[var(--radius-control)] border-2 border-ink bg-surface px-3.5 text-[16px] text-ink placeholder:text-ink-placeholder focus:outline-none focus:ring-4 focus:ring-accent-soft focus:border-accent ${className}`}
      {...rest}
    />
  )

  if (!label) return inputEl

  return (
    <label htmlFor={id} className="flex flex-col gap-1.5">
      <span className="eyebrow text-[12px]">{label}</span>
      {inputEl}
    </label>
  )
}
