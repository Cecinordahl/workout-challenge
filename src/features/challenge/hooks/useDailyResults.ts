import { useEffect, useState } from 'react'
import { DailyResultService } from '@/features/challenge/services/DailyResultService'
import type { DailyResult } from '@/types/dailyResult'

export function useDailyResults(challengeId: string, userId: string) {
  const [results, setResults] = useState<DailyResult[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    return DailyResultService.subscribeToResults(
      challengeId,
      userId,
      (next) => {
        setResults(next)
        setLoading(false)
      },
    )
  }, [challengeId, userId])

  return { results, loading }
}
