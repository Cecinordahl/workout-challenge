import { CAMPAIGNS } from '@/features/meaningful/content/campaigns'
import { DIFFICULTIES } from '@/features/meaningful/domain/badgeTiers'
import type {
  Campaign,
  CampaignGoal,
  CampaignStatistic,
} from '@/features/meaningful/domain/types'

/** Strips draft statistics, and any goal tied to one, so they can never reach the UI. */
function toPublicView(campaign: Campaign): Campaign {
  const statistics = campaign.statistics.filter(
    (s) => s.verification === 'verified',
  )
  const verifiedIds = new Set(statistics.map((s) => s.id))
  return {
    ...campaign,
    statistics,
    goals: campaign.goals.filter(
      (g) => g.statisticId === null || verifiedIds.has(g.statisticId),
    ),
  }
}

function byDifficulty(a: CampaignGoal, b: CampaignGoal): number {
  return DIFFICULTIES.indexOf(a.difficulty) - DIFFICULTIES.indexOf(b.difficulty)
}

export const CampaignCatalogService = {
  /** Published campaigns in calendar order, with only verified statistics. */
  getPublishedCampaigns(
    catalogue: readonly Campaign[] = CAMPAIGNS,
  ): Campaign[] {
    return catalogue
      .filter((c) => c.status === 'published')
      .map(toPublicView)
      .sort((a, b) => a.month - b.month)
  },

  getCampaignBySlug(
    slug: string,
    catalogue: readonly Campaign[] = CAMPAIGNS,
  ): Campaign | null {
    return (
      this.getPublishedCampaigns(catalogue).find((c) => c.slug === slug) ?? null
    )
  },

  getCampaignForMonth(
    month: number,
    catalogue: readonly Campaign[] = CAMPAIGNS,
  ): Campaign | null {
    return (
      this.getPublishedCampaigns(catalogue).find((c) => c.month === month) ??
      null
    )
  },

  getFeaturedStatistic(campaign: Campaign): CampaignStatistic | null {
    return (
      campaign.statistics.find((s) => s.id === campaign.featuredStatisticId) ??
      null
    )
  },

  /**
   * The Easy/Medium/Hard goals offered after picking a statistic: its own
   * set when it has one, otherwise the campaign's default set.
   */
  getGoalsForStatistic(
    campaign: Campaign,
    statisticId: string | null,
  ): CampaignGoal[] {
    const specific = campaign.goals.filter(
      (g) => statisticId !== null && g.statisticId === statisticId,
    )
    const goals =
      specific.length > 0
        ? specific
        : campaign.goals.filter((g) => g.statisticId === null)
    return [...goals].sort(byDifficulty)
  },
}
