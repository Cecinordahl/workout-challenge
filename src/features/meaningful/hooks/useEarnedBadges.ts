import { useEffect, useState } from 'react'
import type { EarnedBadge } from '@/features/meaningful/domain/types'
import { ParticipationService } from '@/features/meaningful/services/ParticipationService'

export function useEarnedBadges(userId: string) {
  const [state, setState] = useState<{
    userId: string | null
    badges: EarnedBadge[]
  }>({ userId: null, badges: [] })

  useEffect(() => {
    if (!userId) return
    return ParticipationService.subscribeToBadges(userId, (badges) => {
      setState({ userId, badges })
    })
  }, [userId])

  return {
    badges: state.userId === userId ? state.badges : [],
    loading: state.userId !== userId,
  }
}
