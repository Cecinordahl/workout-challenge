import type {
  Campaign,
  CampaignParticipation,
  CampaignSelection,
} from '@/features/meaningful/domain/types'
import { CampaignCatalogService } from './CampaignCatalogService'
import type { GoalEvaluation } from './CampaignProgressService'

export type SelectionError =
  'locked' | 'unknownTrack' | 'unknownStatistic' | 'goalNotOffered'

export type SelectionResult =
  | { ok: true; selection: CampaignSelection }
  | { ok: false; error: SelectionError }

/** One participation (and at most one badge) per user, campaign and year. */
export function participationId(
  userId: string,
  campaignId: string,
  year: number,
): string {
  return `${userId}_${campaignId}_${year}`
}

export const ParticipationRulesService = {
  /**
   * Checks a statistic/track/goal choice against what the (public) campaign
   * actually offers. The choice can change freely until the participation
   * locks, then never again.
   */
  validateSelection(
    campaign: Campaign,
    participation: CampaignParticipation | null,
    selection: CampaignSelection,
  ): SelectionResult {
    if (participation?.lockedAt) return { ok: false, error: 'locked' }
    if (!CampaignCatalogService.getTrack(campaign, selection.trackId)) {
      return { ok: false, error: 'unknownTrack' }
    }
    if (
      selection.statisticId !== null &&
      !campaign.statistics.some((s) => s.id === selection.statisticId)
    ) {
      return { ok: false, error: 'unknownStatistic' }
    }
    const offered = CampaignCatalogService.getGoalsForStatistic(
      campaign,
      selection.statisticId,
      selection.trackId,
    )
    if (!offered.some((g) => g.id === selection.goalId)) {
      return { ok: false, error: 'goalNotOffered' }
    }
    return { ok: true, selection }
  },

  /**
   * Locks the selection as soon as any activity counts toward it, so a
   * user can't swap to an easier goal or a different track mid-month.
   * Returns the participation unchanged when nothing needs to change.
   */
  applyLock(
    participation: CampaignParticipation,
    evaluation: GoalEvaluation,
    nowIso: string,
  ): CampaignParticipation {
    if (participation.lockedAt || evaluation.countedActivityIds.length === 0) {
      return participation
    }
    return { ...participation, lockedAt: nowIso }
  },
}
