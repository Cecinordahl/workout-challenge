import { useEffect, useState } from 'react'
import { ChallengeService } from '@/features/challenge/services/ChallengeService'
import type { Challenge } from '@/types/challenge'

export function useActiveChallenge(ownerId: string) {
  const [challenge, setChallenge] = useState<Challenge | null>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    return ChallengeService.subscribeToActiveChallenge(ownerId, (next) => {
      setChallenge(next)
      setLoading(false)
    })
  }, [ownerId])

  return { challenge, loading }
}
