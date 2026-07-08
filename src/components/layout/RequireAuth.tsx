import { Navigate, Outlet, useLocation } from 'react-router-dom'
import { useAuth } from '@/features/authentication/hooks/useAuth'
import { FullScreenSpinner } from '@/components/layout/FullScreenSpinner'

export function RequireAuth() {
  const { user, initializing } = useAuth()
  const location = useLocation()

  if (initializing) return <FullScreenSpinner />
  if (!user) return <Navigate to="/login" state={{ from: location }} replace />
  return <Outlet />
}
