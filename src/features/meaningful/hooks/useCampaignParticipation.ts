import { useEffect, useMemo, useState } from 'react'
import type { Campaign } from '@/features/meaningful/domain/types'
import { CampaignPeriodService } from '@/features/meaningful/services/CampaignPeriodService'
import { participationId } from '@/features/meaningful/services/ParticipationRulesService'
import {
  ParticipationService,
  type StoredParticipation,
} from '@/features/meaningful/services/ParticipationService'
import { todayInTimezone } from '@/utils/date'

/**
 * The campaign's current-or-next month in the user's timezone, and their
 * live participation in it (null when not joined).
 */
export function useCampaignParticipation(
  userId: string,
  timezone: string,
  campaign: Campaign | null,
) {
  const todayIso = todayInTimezone(timezone)
  const period = useMemo(
    () =>
      campaign
        ? CampaignPeriodService.getCurrentOrNextPeriod(campaign.month, todayIso)
        : null,
    [campaign, todayIso],
  )
  const id =
    campaign && period
      ? participationId(userId, campaign.id, period.year)
      : null

  const [state, setState] = useState<{
    id: string | null
    participation: StoredParticipation | null
  }>({ id: null, participation: null })

  useEffect(() => {
    if (!id) return
    return ParticipationService.subscribeToParticipation(
      id,
      (participation) => {
        setState({ id, participation })
      },
    )
  }, [id])

  return {
    period,
    phase: period ? CampaignPeriodService.getPhase(period, todayIso) : null,
    participation: state.id === id ? state.participation : null,
    loading: id !== null && state.id !== id,
  }
}
