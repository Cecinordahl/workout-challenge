import { useState } from 'react'
import { useParams } from 'react-router-dom'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { FullScreenSpinner } from '@/components/layout/FullScreenSpinner'
import { useAuth } from '@/features/authentication/hooks/useAuth'
import { useTeam } from '@/features/teams/hooks/useTeam'

export function TeamDetailPage() {
  const { teamId } = useParams<{ teamId: string }>()
  const { user } = useAuth()
  const { team, leaderboard, loading } = useTeam(teamId ?? '')
  const [copied, setCopied] = useState(false)

  if (loading || !team) return <FullScreenSpinner />

  const inviteUrl = `${window.location.origin}/invite/${team.inviteCode}`

  async function handleCopy() {
    await navigator.clipboard.writeText(inviteUrl)
    setCopied(true)
    setTimeout(() => setCopied(false), 2000)
  }

  return (
    <div className="mx-auto max-w-md space-y-4 p-6">
      <h1 className="text-lg font-semibold tracking-tight">{team.name}</h1>

      <Card>
        <CardHeader>
          <CardTitle className="text-sm">Invite link</CardTitle>
        </CardHeader>
        <CardContent className="space-y-2">
          <p className="text-muted-foreground truncate text-sm">{inviteUrl}</p>
          <Button
            variant="outline"
            className="w-full"
            onClick={() => void handleCopy()}
          >
            {copied ? 'Copied!' : 'Copy invite link'}
          </Button>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle className="text-sm">Leaderboard</CardTitle>
        </CardHeader>
        <CardContent className="space-y-2">
          {leaderboard.map((member, index) => (
            <div
              key={member.id}
              className="flex items-center justify-between border-b py-2 last:border-b-0"
            >
              <div>
                <p className="text-sm font-medium">
                  {index + 1}. {member.displayName}
                  {member.userId === user?.uid && (
                    <span className="text-muted-foreground"> (you)</span>
                  )}
                </p>
                <p className="text-muted-foreground text-xs">
                  {member.currentChallengeTitle ?? 'No active challenge'}
                </p>
              </div>
              <div className="flex gap-2">
                <Badge variant="secondary">{member.currentStreak} streak</Badge>
                <Badge variant="secondary">{member.currentPoints} pts</Badge>
              </div>
            </div>
          ))}
        </CardContent>
      </Card>
    </div>
  )
}
