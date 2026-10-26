import { describe, expect, it } from 'vitest'
import {
  makeCampaign,
  makeDefaultGoals,
  makeGoal,
  makeStatistic,
} from '@/features/meaningful/testing/fixtures'
import { CampaignCatalogService } from './CampaignCatalogService'

describe('CampaignCatalogService.getPublishedCampaigns', () => {
  it('returns only published campaigns, in calendar order', () => {
    const catalogue = [
      makeCampaign({ id: 'dec', slug: 'dec', month: 12 }),
      makeCampaign({ id: 'draft', slug: 'draft', month: 1, status: 'draft' }),
      makeCampaign({ id: 'nov', slug: 'nov', month: 11 }),
    ]
    expect(
      CampaignCatalogService.getPublishedCampaigns(catalogue).map((c) => c.id),
    ).toEqual(['nov', 'dec'])
  })

  it('hides draft statistics and goals tied to them', () => {
    const catalogue = [
      makeCampaign({
        statistics: [
          makeStatistic({ id: 'stat-1' }),
          makeStatistic({ id: 'draft', verification: 'draft' }),
        ],
        goals: [
          ...makeDefaultGoals(),
          makeGoal({ id: 'draft-goal', statisticId: 'draft' }),
        ],
      }),
    ]
    const [campaign] = CampaignCatalogService.getPublishedCampaigns(catalogue)
    expect(campaign?.statistics.map((s) => s.id)).toEqual(['stat-1'])
    expect(campaign?.goals.map((g) => g.id)).not.toContain('draft-goal')
  })

  it('finds campaigns by slug and month, ignoring drafts', () => {
    const catalogue = [
      makeCampaign({ id: 'nov', slug: 'nov', month: 11 }),
      makeCampaign({ id: 'jan', slug: 'jan', month: 1, status: 'draft' }),
    ]
    expect(CampaignCatalogService.getCampaignBySlug('nov', catalogue)?.id).toBe(
      'nov',
    )
    expect(CampaignCatalogService.getCampaignBySlug('jan', catalogue)).toBe(
      null,
    )
    expect(CampaignCatalogService.getCampaignForMonth(11, catalogue)?.id).toBe(
      'nov',
    )
    expect(CampaignCatalogService.getCampaignForMonth(1, catalogue)).toBe(null)
  })
})

describe('CampaignCatalogService.getGoalsForStatistic', () => {
  const specificGoals = [
    makeGoal({
      id: 's-hard',
      statisticId: 'stat-2',
      difficulty: 'HARD',
      target: 154,
    }),
    makeGoal({
      id: 's-easy',
      statisticId: 'stat-2',
      difficulty: 'EASY',
      target: 6,
    }),
    makeGoal({
      id: 's-medium',
      statisticId: 'stat-2',
      difficulty: 'MEDIUM',
      goalType: 'singleActivityDistance',
      target: 6,
    }),
  ]
  const campaign = makeCampaign({
    goals: [...makeDefaultGoals(), ...specificGoals],
  })

  it("returns a statistic's own goals, ordered Easy → Hard", () => {
    expect(
      CampaignCatalogService.getGoalsForStatistic(campaign, 'stat-2').map(
        (g) => g.id,
      ),
    ).toEqual(['s-easy', 's-medium', 's-hard'])
  })

  it('falls back to the default goals for a statistic without its own', () => {
    expect(
      CampaignCatalogService.getGoalsForStatistic(campaign, 'stat-1').map(
        (g) => g.id,
      ),
    ).toEqual(['goal-easy', 'goal-medium', 'goal-hard'])
  })

  it('returns the default goals when no statistic is selected', () => {
    expect(
      CampaignCatalogService.getGoalsForStatistic(campaign, null).map(
        (g) => g.difficulty,
      ),
    ).toEqual(['EASY', 'MEDIUM', 'HARD'])
  })
})
