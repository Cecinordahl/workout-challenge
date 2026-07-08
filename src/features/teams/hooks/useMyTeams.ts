import { useCallback, useEffect, useState } from 'react'
import { TeamService } from '@/features/teams/services/TeamService'
import type { Team } from '@/types/team'

export function useMyTeams(userId: string) {
  const [teams, setTeams] = useState<Team[]>([])
  const [loading, setLoading] = useState(true)

  const refresh = useCallback(async () => {
    setLoading(true)
    const myTeams = await TeamService.getMyTeams(userId)
    setTeams(myTeams)
    setLoading(false)
  }, [userId])

  useEffect(() => {
    let cancelled = false
    void TeamService.getMyTeams(userId).then((myTeams) => {
      if (!cancelled) {
        setTeams(myTeams)
        setLoading(false)
      }
    })
    return () => {
      cancelled = true
    }
  }, [userId])

  return { teams, loading, refresh }
}
