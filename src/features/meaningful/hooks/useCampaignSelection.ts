import { useState } from 'react'
import type {
  Campaign,
  CampaignSelection,
} from '@/features/meaningful/domain/types'
import { CampaignCatalogService } from '@/features/meaningful/services/CampaignCatalogService'

/**
 * Picker state for statistic → track → goal. The goal is derived: changing
 * the statistic or track clears a goal that the new combination doesn't offer.
 */
export function useCampaignSelection(
  campaign: Campaign,
  initial: CampaignSelection | null,
) {
  const [statisticId, setStatisticId] = useState<string | null>(
    initial?.statisticId ?? campaign.featuredStatisticId,
  )
  const [trackId, setTrackId] = useState<string>(
    initial?.trackId ?? campaign.tracks[0]?.id ?? '',
  )
  const [chosenGoalId, setGoalId] = useState<string | null>(
    initial?.goalId ?? null,
  )

  const goals = CampaignCatalogService.getGoalsForStatistic(
    campaign,
    statisticId,
    trackId,
  )
  const goalId = goals.some((g) => g.id === chosenGoalId) ? chosenGoalId : null
  const selection: CampaignSelection | null = goalId
    ? { statisticId, trackId, goalId }
    : null

  return {
    statisticId,
    trackId,
    goalId,
    goals,
    selection,
    setStatisticId,
    setTrackId,
    setGoalId,
  }
}
