import { CAMPAIGNS } from '../content/campaigns/index.js'
import { DIFFICULTIES } from '../domain/badgeTiers.js'
import type {
  Campaign,
  CampaignGoal,
  CampaignStatistic,
  CampaignTrack,
} from '../domain/types.js'

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

  getCampaignById(
    id: string,
    catalogue: readonly Campaign[] = CAMPAIGNS,
  ): Campaign | null {
    return (
      this.getPublishedCampaigns(catalogue).find((c) => c.id === id) ?? null
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

  getTrack(campaign: Campaign, trackId: string): CampaignTrack | null {
    return campaign.tracks.find((t) => t.id === trackId) ?? null
  },

  getGoal(campaign: Campaign, goalId: string): CampaignGoal | null {
    return campaign.goals.find((g) => g.id === goalId) ?? null
  },

  /**
   * The Easy/Medium/Hard goals offered on a track after picking a
   * statistic: its own set when it has one, otherwise the track's defaults.
   */
  getGoalsForStatistic(
    campaign: Campaign,
    statisticId: string | null,
    trackId: string,
  ): CampaignGoal[] {
    const onTrack = campaign.goals.filter((g) => g.trackId === trackId)
    const specific = onTrack.filter(
      (g) => statisticId !== null && g.statisticId === statisticId,
    )
    const goals =
      specific.length > 0
        ? specific
        : onTrack.filter((g) => g.statisticId === null)
    return [...goals].sort(byDifficulty)
  },
}
