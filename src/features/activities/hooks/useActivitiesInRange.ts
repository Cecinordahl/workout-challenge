import { useEffect, useState } from 'react'
import { ActivityService } from '@/features/activities/services/ActivityService'
import type { Activity } from '@/types/activity'

/** Live list of the user's ledger activities between two local dates (inclusive). */
export function useActivitiesInRange(
  userId: string,
  startDate: string | null,
  endDate: string | null,
) {
  const key = startDate && endDate ? `${userId}|${startDate}|${endDate}` : null
  const [state, setState] = useState<{
    key: string | null
    activities: Activity[]
  }>({ key: null, activities: [] })

  useEffect(() => {
    if (!key || !startDate || !endDate) return
    return ActivityService.subscribeToActivitiesInRange(
      userId,
      startDate,
      endDate,
      (activities) => {
        setState({ key, activities })
      },
    )
  }, [key, userId, startDate, endDate])

  return {
    activities: state.key === key ? state.activities : [],
    loading: key !== null && state.key !== key,
  }
}
