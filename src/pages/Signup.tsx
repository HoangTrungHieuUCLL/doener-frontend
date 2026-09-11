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
      <div className="relative w-full max-w-sm border-2 border-ink rounded-[var(--radius-card)] bg-surface px-5 py-8 shadow-[var(--shadow-lg)]">
        <div className="mb-8 flex flex-col items-center gap-3 text-center">
          <LogoMark className="h-16 w-16" />
          <h1 className="headline text-[72px]">Doener</h1>
          <p className="font-display text-[15px] font-extrabold uppercase tracking-[0.03em] text-ink"><span className="marker">Create your account.</span></p>
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
            <p className="rounded-[var(--radius-control)] border-2 border-ink bg-negative-soft px-3 py-2 text-[13px] font-semibold text-negative-text">
              {authError}
            </p>
          )}

          <Button type="submit" size="lg" disabled={submitting} className="w-full">
            {submitting ? 'Creating account…' : 'Sign up'}
          </Button>
        </form>

        <p className="mt-6 text-center text-[14px] text-ink-secondary">
          Already have an account?{' '}
          <Link to="/login" className="font-bold text-accent-strong underline decoration-2 underline-offset-4">
            Log in
          </Link>
        </p>
      </div>
    </div>
  )
}
