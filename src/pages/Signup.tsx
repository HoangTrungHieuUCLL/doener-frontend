import { useState } from 'react'
import type { FormEvent } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { useAuth } from '../auth/AuthContext'
import { Button } from '../components/ui/Button'
import { Input } from '../components/ui/Input'
import { LogoMark } from '../components/icons'

export function Signup() {
  const { signup, authError, clearAuthError } = useAuth()
  const navigate = useNavigate()
  const [username, setUsername] = useState('')
  const [displayName, setDisplayName] = useState('')
  const [password, setPassword] = useState('')
  const [submitting, setSubmitting] = useState(false)

  async function handleSubmit(e: FormEvent) {
    e.preventDefault()
    clearAuthError()
    setSubmitting(true)
    try {
      await signup(username, password, displayName)
      navigate('/today', { replace: true })
    } catch {
      // authError is surfaced via context
    } finally {
      setSubmitting(false)
    }
  }

  return (
    <div className="relative flex min-h-dvh items-center justify-center overflow-hidden bg-bg px-5">
      <div className="brand-blob pointer-events-none absolute -left-24 -top-24 h-72 w-72 rounded-full" />
      <div className="brand-blob pointer-events-none absolute -bottom-28 -right-20 h-80 w-80 rounded-full" />
      <div className="relative w-full max-w-sm">
        <div className="mb-8 flex flex-col items-center gap-2">
          <LogoMark className="h-12 w-12" />
          <h1 className="font-display text-[24px] font-semibold text-ink">Doener</h1>
          <p className="text-[14px] text-ink-secondary">Create your account.</p>
        </div>

        <form onSubmit={handleSubmit} className="flex flex-col gap-4">
          <Input
            id="displayName"
            label="Display name"
            type="text"
            autoComplete="name"
            required
            value={displayName}
            onChange={(e) => setDisplayName(e.target.value)}
          />
          <Input
            id="username"
            label="Username"
            type="text"
            autoComplete="username"
            required
            value={username}
            onChange={(e) => setUsername(e.target.value)}
          />
          <Input
            id="password"
            label="Password"
            type="password"
            autoComplete="new-password"
            required
            minLength={8}
            value={password}
            onChange={(e) => setPassword(e.target.value)}
          />

          {authError && (
            <p className="rounded-[var(--radius-control)] bg-negative-soft px-3 py-2 text-[13px] text-negative-text">
              {authError}
            </p>
          )}

          <Button type="submit" size="lg" disabled={submitting} className="w-full">
            {submitting ? 'Creating account…' : 'Sign up'}
          </Button>
        </form>

        <p className="mt-6 text-center text-[14px] text-ink-secondary">
          Already have an account?{' '}
          <Link to="/login" className="font-medium text-accent-strong">
            Log in
          </Link>
        </p>
      </div>
    </div>
  )
}
