import { useState, type FormEvent } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { FullScreenSpinner } from '@/components/layout/FullScreenSpinner'
import { useAuth } from '@/features/authentication/hooks/useAuth'
import { useMyTeams } from '@/features/teams/hooks/useMyTeams'
import { TeamService } from '@/features/teams/services/TeamService'

export function TeamsPage() {
  const { user, profile } = useAuth()
  const { teams, loading, refresh } = useMyTeams(user?.uid ?? '')
  const navigate = useNavigate()

  const [name, setName] = useState('')
  const [error, setError] = useState<string | null>(null)
  const [isSubmitting, setIsSubmitting] = useState(false)

  if (!user || !profile || loading) return <FullScreenSpinner />

  async function handleSubmit(event: FormEvent) {
    event.preventDefault()
    if (!name.trim()) {
      setError('Give your team a name.')
      return
    }
    setError(null)
    setIsSubmitting(true)
    try {
      const { teamId } = await TeamService.createTeam(
        user!.uid,
        profile!.displayName,
        name.trim(),
      )
      await TeamService.syncMyProgressToTeams(user!.uid)
      await refresh()
      void navigate(`/teams/${teamId}`)
    } catch {
      setError('Something went wrong creating your team. Try again.')
    } finally {
      setIsSubmitting(false)
    }
  }

  return (
    <div className="mx-auto max-w-md space-y-4 p-6">
      <h1 className="text-lg font-semibold tracking-tight">Teams</h1>

      {teams.length === 0 ? (
        <p className="text-muted-foreground text-sm">
          You're not on a team yet.
        </p>
      ) : (
        teams.map((team) => (
          <Link key={team.id} to={`/teams/${team.id}`}>
            <Card className="hover:bg-muted/50 transition-colors">
              <CardHeader>
                <CardTitle>{team.name}</CardTitle>
              </CardHeader>
            </Card>
          </Link>
        ))
      )}

      <Card>
        <CardHeader>
          <CardTitle className="text-sm">Create a team</CardTitle>
        </CardHeader>
        <CardContent>
          <form onSubmit={(e) => void handleSubmit(e)} className="space-y-3">
            <div className="space-y-2">
              <Label htmlFor="teamName">Team name</Label>
              <Input
                id="teamName"
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder="Morning Runners"
              />
            </div>
            {error && <p className="text-destructive text-sm">{error}</p>}
            <Button type="submit" className="w-full" disabled={isSubmitting}>
              {isSubmitting ? 'Creating…' : 'Create team'}
            </Button>
          </form>
        </CardContent>
      </Card>
    </div>
  )
}
