import { useState } from 'react'
import type { FormEvent } from 'react'
import { Link, useLocation, useNavigate } from 'react-router-dom'
import { useAuth } from '../auth/AuthContext'
import { Button } from '../components/ui/Button'
import { Input } from '../components/ui/Input'
import { LogoMark } from '../components/icons'

export function Login() {
  const { login, authError, clearAuthError } = useAuth()
  const navigate = useNavigate()
  const location = useLocation() as { state?: { from?: { pathname: string } } }
  const [username, setUsername] = useState('')
  const [password, setPassword] = useState('')
  const [submitting, setSubmitting] = useState(false)

  async function handleSubmit(e: FormEvent) {
    e.preventDefault()
    clearAuthError()
    setSubmitting(true)
    try {
      await login(username, password)
      const dest = location.state?.from?.pathname ?? '/today'
      navigate(dest, { replace: true })
    } catch {
      // authError is surfaced via context
    } finally {
      setSubmitting(false)
    }
  }

  return (
    <div className="flex min-h-dvh items-center justify-center bg-bg px-5">
      <div className="w-full max-w-sm">
        <div className="mb-8 flex flex-col items-center gap-2">
          <LogoMark className="h-10 w-10 text-accent" />
          <h1 className="font-serif text-[22px] font-semibold text-ink">Doener</h1>
          <p className="text-[14px] text-ink-secondary">Log in to keep your streak going.</p>
        </div>

        <form onSubmit={handleSubmit} className="flex flex-col gap-4">
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
            autoComplete="current-password"
            required
            value={password}
            onChange={(e) => setPassword(e.target.value)}
          />

          {authError && (
            <p className="rounded-[var(--radius-control)] bg-negative-soft px-3 py-2 text-[13px] text-negative-text">
              {authError}
            </p>
          )}

          <Button type="submit" size="lg" disabled={submitting} className="w-full">
            {submitting ? 'Logging in…' : 'Log in'}
          </Button>
        </form>

        <p className="mt-6 text-center text-[14px] text-ink-secondary">
          New here?{' '}
          <Link to="/signup" className="font-medium text-accent-strong">
            Create an account
          </Link>
        </p>
      </div>
    </div>
  )
}
