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
      target: 10,
    }),
    makeGoal({
      id: 's-medium',
      statisticId: 'stat-2',
      difficulty: 'MEDIUM',
      goalType: 'singleActivityDistance',
      target: 6,
    }),
  ]
  const cyclingGoals = [
    makeGoal({
      id: 'c-easy',
      trackId: 'cycling',
      difficulty: 'EASY',
      target: 30,
    }),
    makeGoal({
      id: 'c-medium',
      trackId: 'cycling',
      difficulty: 'MEDIUM',
      target: 90,
    }),
    makeGoal({
      id: 'c-hard',
      trackId: 'cycling',
      difficulty: 'HARD',
      target: 180,
    }),
  ]
  const campaign = makeCampaign({
    tracks: [
      { id: 'on-foot', label: 'On foot', activityTypes: ['run', 'walk'] },
      { id: 'cycling', label: 'Cycling', activityTypes: ['ride'] },
    ],
    goals: [...makeDefaultGoals(), ...specificGoals, ...cyclingGoals],
  })

  const ids = (statisticId: string | null, trackId: string) =>
    CampaignCatalogService.getGoalsForStatistic(
      campaign,
      statisticId,
      trackId,
    ).map((g) => g.id)

  it("returns a statistic's own goals, ordered Easy → Hard", () => {
    expect(ids('stat-2', 'on-foot')).toEqual(['s-easy', 's-medium', 's-hard'])
  })

  it('falls back to the track defaults for a statistic without its own', () => {
    expect(ids('stat-1', 'on-foot')).toEqual([
      'goal-easy',
      'goal-medium',
      'goal-hard',
    ])
  })

  it('returns the track defaults when no statistic is selected', () => {
    expect(ids(null, 'on-foot')).toEqual([
      'goal-easy',
      'goal-medium',
      'goal-hard',
    ])
  })

  it('only returns goals for the chosen track', () => {
    expect(ids(null, 'cycling')).toEqual(['c-easy', 'c-medium', 'c-hard'])
    // stat-2 has no cycling set of its own, so cycling falls back to cycling defaults.
    expect(ids('stat-2', 'cycling')).toEqual(['c-easy', 'c-medium', 'c-hard'])
  })
})
