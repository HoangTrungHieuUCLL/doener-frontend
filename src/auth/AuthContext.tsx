import { createContext, useCallback, useContext, useEffect, useMemo, useState } from 'react'
import type { ReactNode } from 'react'
import { api, ApiError, TOKEN_STORAGE_KEY, UNAUTHORIZED_EVENT } from '../api/client'
import type { AuthResponse, User } from '../api/types'

const USER_STORAGE_KEY = 'doener.auth.user'

interface AuthState {
  token: string | null
  user: User | null
}

interface AuthContextValue extends AuthState {
  isAuthenticated: boolean
  isBootstrapping: boolean
  login: (username: string, password: string) => Promise<void>
  signup: (username: string, password: string, displayName: string) => Promise<void>
  logout: () => void
  authError: string | null
  clearAuthError: () => void
}

const AuthContext = createContext<AuthContextValue | null>(null)

function readStoredState(): AuthState {
  try {
    const token = localStorage.getItem(TOKEN_STORAGE_KEY)
    const rawUser = localStorage.getItem(USER_STORAGE_KEY)
    const user = rawUser ? (JSON.parse(rawUser) as User) : null
    return { token, user }
  } catch {
    return { token: null, user: null }
  }
}

function persistState(state: AuthState) {
  try {
    if (state.token) {
      localStorage.setItem(TOKEN_STORAGE_KEY, state.token)
    } else {
      localStorage.removeItem(TOKEN_STORAGE_KEY)
    }
    if (state.user) {
      localStorage.setItem(USER_STORAGE_KEY, JSON.stringify(state.user))
    } else {
      localStorage.removeItem(USER_STORAGE_KEY)
    }
  } catch {
    // localStorage unavailable (private mode etc.) -- in-memory state still works
  }
}

export function AuthProvider({ children }: { children: ReactNode }) {
  // Held in memory (React state) and mirrored to localStorage so a refresh
  // doesn't log the user out.
  const [state, setState] = useState<AuthState>(() => readStoredState())
  const [authError, setAuthError] = useState<string | null>(null)
  // Bootstrapping is synchronous (localStorage read happens in useState
  // initializer above), but keep the flag for consumers that want to avoid
  // a flash of the login screen before the first render settles.
  const [isBootstrapping] = useState(false)

  const setAuth = useCallback((next: AuthState) => {
    setState(next)
    persistState(next)
  }, [])

  const logout = useCallback(() => {
    setAuth({ token: null, user: null })
  }, [setAuth])

  useEffect(() => {
    const handleUnauthorized = () => {
      setAuth({ token: null, user: null })
      setAuthError('Your session expired. Please log in again.')
    }
    window.addEventListener(UNAUTHORIZED_EVENT, handleUnauthorized)
    return () => window.removeEventListener(UNAUTHORIZED_EVENT, handleUnauthorized)
  }, [setAuth])

  const login = useCallback(
    async (username: string, password: string) => {
      setAuthError(null)
      try {
        const res = await api.post<AuthResponse>(
          '/auth/login',
          { username, password },
          { skipAuth: true },
        )
        setAuth({ token: res.access_token, user: res.user })
      } catch (err) {
        const message = err instanceof ApiError ? err.message : 'Could not log in. Try again.'
        setAuthError(message)
        throw err
      }
    },
    [setAuth],
  )

  const signup = useCallback(
    async (username: string, password: string, displayName: string) => {
      setAuthError(null)
      try {
        const res = await api.post<AuthResponse>(
          '/auth/signup',
          { username, password, display_name: displayName },
          { skipAuth: true },
        )
        setAuth({ token: res.access_token, user: res.user })
      } catch (err) {
        const message = err instanceof ApiError ? err.message : 'Could not sign up. Try again.'
        setAuthError(message)
        throw err
      }
    },
    [setAuth],
  )

  const clearAuthError = useCallback(() => setAuthError(null), [])

  const value = useMemo<AuthContextValue>(
    () => ({
      token: state.token,
      user: state.user,
      isAuthenticated: Boolean(state.token),
      isBootstrapping,
      login,
      signup,
      logout,
      authError,
      clearAuthError,
    }),
    [state, isBootstrapping, login, signup, logout, authError, clearAuthError],
  )

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>
}

export function useAuth(): AuthContextValue {
  const ctx = useContext(AuthContext)
  if (!ctx) {
    throw new Error('useAuth must be used within an AuthProvider')
  }
  return ctx
}
