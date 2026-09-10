import { Navigate, Outlet, useLocation } from 'react-router-dom'
import { useAuth } from './AuthContext'

/** Wrap protected routes: redirects unauthenticated users to /login. */
export function RequireAuth() {
  const { isAuthenticated } = useAuth()
  const location = useLocation()

  if (!isAuthenticated) {
    return <Navigate to="/login" replace state={{ from: location }} />
  }
  return <Outlet />
}

/** Wrap /login and /signup: redirects already-authenticated users to /today. */
export function RequireGuest() {
  const { isAuthenticated } = useAuth()

  if (isAuthenticated) {
    return <Navigate to="/today" replace />
  }
  return <Outlet />
}
