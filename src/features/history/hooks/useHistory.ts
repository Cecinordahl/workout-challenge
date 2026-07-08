import { useEffect, useState } from 'react'
import { ChallengeService } from '@/features/challenge/services/ChallengeService'
import { DailyResultService } from '@/features/challenge/services/DailyResultService'
import { HistoryStatsService } from '@/features/history/services/HistoryStatsService'
import type { ChallengeStats } from '@/features/history/services/HistoryStatsService'

export function useHistory(userId: string) {
  const [stats, setStats] = useState<ChallengeStats[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    let cancelled = false

    async function load() {
      setLoading(true)
      const pastChallenges = await ChallengeService.getPastChallenges(userId)
      const perChallengeStats = await Promise.all(
        pastChallenges.map(async (challenge) => {
          const results = await DailyResultService.getResults(
            challenge.id,
            userId,
          )
          return HistoryStatsService.computeChallengeStats(challenge, results)
        }),
      )
      if (!cancelled) {
        setStats(perChallengeStats)
        setLoading(false)
      }
    }

    void load()
    return () => {
      cancelled = true
    }
  }, [userId])

  return { stats, loading }
}
