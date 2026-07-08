import { useEffect, useState } from 'react'
import { useNavigate, useParams } from 'react-router-dom'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { FullScreenSpinner } from '@/components/layout/FullScreenSpinner'
import { useAuth } from '@/features/authentication/hooks/useAuth'
import { TeamService } from '@/features/teams/services/TeamService'
import type { Team } from '@/types/team'

export function JoinTeamPage() {
  const { code } = useParams<{ code: string }>()
  const { user, profile } = useAuth()
  const navigate = useNavigate()

  const [team, setTeam] = useState<Team | null>(null)
  const [loading, setLoading] = useState(true)
  const [notFound, setNotFound] = useState(false)
  const [isJoining, setIsJoining] = useState(false)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    if (!code) return
    let cancelled = false
    TeamService.getTeamByInviteCode(code)
      .then((result) => {
        if (cancelled) return
        setTeam(result)
        setNotFound(result === null)
        setLoading(false)
      })
      .catch(() => {
        if (!cancelled) {
          setNotFound(true)
          setLoading(false)
        }
      })
    return () => {
      cancelled = true
    }
  }, [code])

  if (!user || !profile || loading) return <FullScreenSpinner />

  if (notFound || !team) {
    return (
      <div className="flex min-h-svh items-center justify-center p-6">
        <p className="text-muted-foreground text-sm">
          This invite link isn't valid.
        </p>
      </div>
    )
  }

  async function handleJoin() {
    if (!code) return
    setIsJoining(true)
    setError(null)
    try {
      const teamId = await TeamService.joinTeam(
        code,
        user!.uid,
        profile!.displayName,
      )
      await TeamService.syncMyProgressToTeams(user!.uid)
      void navigate(`/teams/${teamId}`, { replace: true })
    } catch {
      setError('Something went wrong joining this team. Try again.')
      setIsJoining(false)
    }
  }

  return (
    <div className="flex min-h-svh items-center justify-center p-6">
      <Card className="w-full max-w-sm">
        <CardHeader>
          <CardTitle>Join {team.name}?</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          {error && <p className="text-destructive text-sm">{error}</p>}
          <Button
            className="w-full"
            disabled={isJoining}
            onClick={() => void handleJoin()}
          >
            {isJoining ? 'Joining…' : 'Join team'}
          </Button>
        </CardContent>
      </Card>
    </div>
  )
}
