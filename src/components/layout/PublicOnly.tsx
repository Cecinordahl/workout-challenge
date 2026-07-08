import { Navigate, Outlet } from 'react-router-dom'
import { useAuth } from '@/features/authentication/hooks/useAuth'
import { FullScreenSpinner } from '@/components/layout/FullScreenSpinner'

export function PublicOnly() {
  const { user, initializing } = useAuth()

  if (initializing) return <FullScreenSpinner />
  if (user) return <Navigate to="/" replace />
  return <Outlet />
}
