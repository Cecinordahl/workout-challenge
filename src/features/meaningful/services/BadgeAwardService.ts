import type {
  Campaign,
  CampaignParticipation,
  EarnedBadge,
} from '@/features/meaningful/domain/types'
import { CampaignCatalogService } from './CampaignCatalogService'
import type { GoalEvaluation } from './CampaignProgressService'

export const BadgeAwardService = {
  /**
   * The badge a completed participation earns, or null. The tier always
   * comes from the goal the user locked in — never from how far they went
   * past it — and the badge shares the participation's deterministic ID,
   * so a campaign-year can only ever award one badge.
   */
  decideAward(
    campaign: Campaign,
    participation: CampaignParticipation,
    evaluation: GoalEvaluation,
    existingBadgeIds: ReadonlySet<string>,
  ): EarnedBadge | null {
    if (!evaluation.completed || evaluation.completedOn === null) return null
    if (existingBadgeIds.has(participation.id)) return null

    const goal = CampaignCatalogService.getGoal(campaign, participation.goalId)
    if (!goal || goal.trackId !== participation.trackId) return null

    return {
      id: participation.id,
      userId: participation.userId,
      campaignId: campaign.id,
      year: participation.year,
      trackId: participation.trackId,
      statisticId: participation.statisticId,
      goalId: goal.id,
      difficulty: goal.difficulty,
      badgeName: goal.badge.name,
      completedOn: evaluation.completedOn,
      qualifyingActivityIds: evaluation.qualifyingActivityIds,
    }
  },
}
