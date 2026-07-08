import { Navigate, Outlet } from 'react-router-dom'
import { useAuth } from '@/features/authentication/hooks/useAuth'
import { useActiveChallenge } from '@/features/challenge/hooks/useActiveChallenge'
import { FullScreenSpinner } from '@/components/layout/FullScreenSpinner'

export function RedirectIfActiveChallenge() {
  const { user } = useAuth()
  const { challenge, loading } = useActiveChallenge(user?.uid ?? '')

  if (!user || loading) return <FullScreenSpinner />
  if (challenge) return <Navigate to="/" replace />
  return <Outlet />
}
