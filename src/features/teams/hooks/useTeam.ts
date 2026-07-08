import { useEffect, useState } from 'react'
import { TeamService } from '@/features/teams/services/TeamService'
import type { Team, TeamMember } from '@/types/team'

export function useTeam(teamId: string) {
  const [team, setTeam] = useState<Team | null>(null)
  const [teamLoading, setTeamLoading] = useState(true)
  const [members, setMembers] = useState<TeamMember[]>([])
  const [membersLoading, setMembersLoading] = useState(true)

  useEffect(() => {
    let cancelled = false
    TeamService.getTeam(teamId)
      .then((result) => {
        if (!cancelled) {
          setTeam(result)
          setTeamLoading(false)
        }
      })
      .catch(() => {
        if (!cancelled) setTeamLoading(false)
      })
    return () => {
      cancelled = true
    }
  }, [teamId])

  useEffect(() => {
    return TeamService.subscribeToTeamMembers(teamId, (next) => {
      setMembers(next)
      setMembersLoading(false)
    })
  }, [teamId])

  const leaderboard = [...members].sort(
    (a, b) => b.currentPoints - a.currentPoints,
  )

  return {
    team,
    leaderboard,
    loading: teamLoading || membersLoading,
  }
}
