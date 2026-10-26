import { describe, expect, it } from 'vitest'
import {
  makeCampaign,
  makeDefaultGoals,
  makeGoal,
  makeStatistic,
} from '@/features/meaningful/testing/fixtures'
import { CampaignValidationService } from './CampaignValidationService'

const TODAY = '2026-10-26'

function validate(...args: Parameters<typeof makeCampaign>) {
  return CampaignValidationService.validateCampaign(
    makeCampaign(...args),
    TODAY,
  )
}

describe('CampaignValidationService.validateCampaign', () => {
  it('accepts a complete published campaign', () => {
    expect(validate()).toEqual({ errors: [], warnings: [] })
  })

  it('rejects an out-of-range month and a non-kebab slug', () => {
    const { errors } = validate({ month: 13, slug: 'Bad Slug' })
    expect(errors).toContain('month must be an integer from 1 to 12')
    expect(errors.some((e) => e.includes('kebab-case'))).toBe(true)
  })

  it('rejects verified statistics with missing or invalid source metadata', () => {
    const { errors } = validate({
      statistics: [
        makeStatistic({ id: 'stat-1', sourceUrl: 'not a url' }),
        makeStatistic({ id: 'stat-2', sourceOrg: ' ' }),
        makeStatistic({ id: 'stat-3', lastVerified: null }),
        makeStatistic({ id: 'stat-4', lastVerified: '2026-02-30' }),
        makeStatistic({ id: 'stat-5', sourceUrl: 'http://insecure.org' }),
      ],
    })
    expect(errors).toEqual([
      'statistic "stat-1": sourceUrl must be a valid https URL',
      'statistic "stat-2": missing sourceOrg',
      'statistic "stat-3": verified without a valid lastVerified date',
      'statistic "stat-4": verified without a valid lastVerified date',
      'statistic "stat-5": sourceUrl must be a valid https URL',
    ])
  })

  it('allows incomplete metadata on draft statistics', () => {
    const { errors } = validate({
      statistics: [
        ...makeCampaign().statistics,
        makeStatistic({
          id: 'draft',
          verification: 'draft',
          sourceUrl: '',
          lastVerified: null,
        }),
      ],
    })
    expect(errors).toEqual([])
  })

  it('rejects a lastVerified date in the future', () => {
    const { errors } = validate({
      statistics: [makeStatistic({ id: 'stat-1', lastVerified: '2026-12-01' })],
    })
    expect(errors).toContain(
      'statistic "stat-1": lastVerified is in the future',
    )
  })

  it('warns when a statistic has not been re-verified for over a year', () => {
    const { warnings } = validate({
      statistics: [
        makeStatistic({ id: 'stat-1', lastVerified: '2025-01-01' }),
        ...[2, 3, 4, 5].map((n) => makeStatistic({ id: `stat-${n}` })),
      ],
    })
    expect(warnings).toEqual([
      'statistic "stat-1": last verified over 365 days ago — re-check the source',
    ])
  })

  it('rejects a range whose value lies outside low–high', () => {
    const { errors } = validate({
      statistics: [
        makeStatistic({
          id: 'stat-1',
          value: { kind: 'range', value: 50, low: 10, high: 40 },
        }),
      ],
    })
    expect(errors).toContain(
      'statistic "stat-1": value must lie within its low–high range',
    )
  })

  it('warns when a published campaign has fewer than five verified statistics', () => {
    const { warnings } = validate({
      statistics: [
        makeStatistic({ id: 'stat-1' }),
        makeStatistic({ id: 'stat-2', verification: 'draft' }),
      ],
    })
    expect(warnings).toContain('only 1 verified statistics (aim for 5+)')
  })

  it('does not warn about statistic count for draft campaigns', () => {
    const { warnings } = validate({
      status: 'draft',
      statistics: [makeStatistic({ id: 'stat-1' })],
    })
    expect(warnings).toEqual([])
  })

  it('requires the featured statistic to exist and be verified when published', () => {
    expect(validate({ featuredStatisticId: 'missing' }).errors).toContain(
      'featuredStatisticId "missing" does not exist',
    )
    const unverified = validate({
      statistics: [
        makeStatistic({ id: 'stat-1', verification: 'draft' }),
        ...[2, 3, 4, 5, 6].map((n) => makeStatistic({ id: `stat-${n}` })),
      ],
    })
    expect(unverified.errors).toContain('featured statistic must be verified')
  })

  it('requires exactly one default goal per difficulty', () => {
    const { errors } = validate({
      goals: [
        makeGoal({ id: 'a', difficulty: 'EASY', target: 5 }),
        makeGoal({ id: 'b', difficulty: 'EASY', target: 6 }),
        makeGoal({ id: 'c', difficulty: 'HARD', target: 60 }),
      ],
    })
    expect(errors).toContain(
      'default goals for track "on-foot": expected exactly one EASY goal, found 2',
    )
    expect(errors).toContain(
      'default goals for track "on-foot": expected exactly one MEDIUM goal, found 0',
    )
  })

  it('requires targets to rise with difficulty for the same goal type', () => {
    const { errors } = validate({
      goals: [
        makeGoal({ id: 'a', difficulty: 'EASY', target: 30 }),
        makeGoal({ id: 'b', difficulty: 'MEDIUM', target: 30 }),
        makeGoal({ id: 'c', difficulty: 'HARD', target: 60 }),
      ],
    })
    expect(errors).toContain(
      'default goals for track "on-foot": MEDIUM target must be greater than EASY',
    )
  })

  it('does not compare targets across different goal types', () => {
    const { errors } = validate({
      goals: [
        makeGoal({ id: 'a', difficulty: 'EASY', target: 10 }),
        makeGoal({
          id: 'b',
          difficulty: 'MEDIUM',
          goalType: 'singleActivityDistance',
          target: 6,
        }),
        makeGoal({ id: 'c', difficulty: 'HARD', target: 154 }),
      ],
    })
    expect(errors).toEqual([])
  })

  it('rejects invalid goal targets', () => {
    const { errors } = validate({
      goals: [
        makeGoal({ id: 'a', difficulty: 'EASY', target: 0 }),
        makeGoal({
          id: 'b',
          difficulty: 'MEDIUM',
          goalType: 'activeDays',
          target: 32,
        }),
        makeGoal({ id: 'c', difficulty: 'HARD', target: 60 }),
      ],
    })
    expect(errors).toContain('goal "a": target must be a positive number')
    expect(errors).toContain('goal "b": activeDays target cannot exceed 31')
  })

  it('rejects goals linked to unknown or unverified statistics', () => {
    const statGoals = (statisticId: string) => [
      makeGoal({
        id: `${statisticId}-e`,
        statisticId,
        difficulty: 'EASY',
        target: 10,
      }),
      makeGoal({
        id: `${statisticId}-m`,
        statisticId,
        difficulty: 'MEDIUM',
        target: 30,
      }),
      makeGoal({
        id: `${statisticId}-h`,
        statisticId,
        difficulty: 'HARD',
        target: 60,
      }),
    ]
    const { errors } = validate({
      statistics: [
        ...makeCampaign().statistics,
        makeStatistic({ id: 'draft', verification: 'draft' }),
      ],
      goals: [
        ...makeDefaultGoals(),
        ...statGoals('nope'),
        ...statGoals('draft'),
      ],
    })
    expect(errors).toContain('goal "nope-e": unknown statisticId "nope"')
    expect(errors).toContain(
      'goal "draft-e": linked statistic "draft" is not verified',
    )
  })

  it('rejects a statistic-specific goal easier than the default for its tier', () => {
    const { warnings, errors } = validate({
      goals: [
        ...makeDefaultGoals(),
        makeGoal({
          id: 's-e',
          statisticId: 'stat-2',
          difficulty: 'EASY',
          target: 10,
        }),
        makeGoal({
          id: 's-m',
          statisticId: 'stat-2',
          difficulty: 'MEDIUM',
          target: 30,
        }),
        makeGoal({
          id: 's-h',
          statisticId: 'stat-2',
          difficulty: 'HARD',
          target: 41,
        }),
      ],
    })
    expect(errors).toEqual([
      'goal "s-h" is easier than the default HARD goal on track "on-foot"',
    ])
    expect(warnings).toEqual([])
  })

  it('flags a statistic-specific goal of a different type for manual review', () => {
    const { warnings, errors } = validate({
      goals: [
        ...makeDefaultGoals(),
        makeGoal({
          id: 's-e',
          statisticId: 'stat-2',
          difficulty: 'EASY',
          target: 10,
        }),
        makeGoal({
          id: 's-m',
          statisticId: 'stat-2',
          difficulty: 'MEDIUM',
          goalType: 'singleActivityDistance',
          target: 6,
        }),
        makeGoal({
          id: 's-h',
          statisticId: 'stat-2',
          difficulty: 'HARD',
          target: 154,
        }),
      ],
    })
    expect(errors).toEqual([])
    expect(warnings).toEqual([
      'goal "s-m" uses a different goal type than the default MEDIUM goal — review its difficulty by hand',
    ])
  })

  it('requires default goals for every track', () => {
    const { errors } = validate({
      tracks: [
        { id: 'on-foot', label: 'On foot', activityTypes: ['run', 'walk'] },
        { id: 'cycling', label: 'Cycling', activityTypes: ['ride'] },
      ],
    })
    expect(errors).toContain(
      'default goals for track "cycling": expected exactly one EASY goal, found 0',
    )
  })

  it('rejects an activity type that belongs to two tracks', () => {
    const { errors } = validate({
      tracks: [
        { id: 'on-foot', label: 'On foot', activityTypes: ['run', 'walk'] },
        { id: 'mixed', label: 'Mixed', activityTypes: ['run', 'ride'] },
      ],
    })
    expect(errors).toContain(
      'activity type "run" is in both track "on-foot" and "mixed"',
    )
  })

  it('rejects goals on an unknown track and campaigns without tracks', () => {
    expect(
      validate({
        goals: [...makeDefaultGoals(), makeGoal({ id: 'x', trackId: 'nope' })],
      }).errors,
    ).toContain('goal "x": unknown trackId "nope"')
    expect(validate({ tracks: [] }).errors).toContain(
      'at least one track is required',
    )
  })

  it('rejects non-https links', () => {
    const { errors } = validate({
      supportResources: [{ label: 'Help', url: 'http://help.example' }],
    })
    expect(errors).toContain('link "Help" must be a valid https URL')
  })
})

describe('CampaignValidationService.validateCatalogue', () => {
  it('flags duplicate ids, slugs and published months', () => {
    const results = CampaignValidationService.validateCatalogue(
      [
        makeCampaign({ id: 'a', slug: 'a' }),
        makeCampaign({ id: 'b', slug: 'a' }),
      ],
      TODAY,
    )
    expect(results.get('b')?.errors).toEqual([
      'duplicate campaign slug "a"',
      'another published campaign already uses month 11',
    ])
  })

  it('allows a draft campaign to share a month with a published one', () => {
    const results = CampaignValidationService.validateCatalogue(
      [
        makeCampaign({ id: 'a', slug: 'a' }),
        makeCampaign({ id: 'b', slug: 'b', status: 'draft' }),
      ],
      TODAY,
    )
    expect(results.get('b')?.errors).toEqual([])
  })
})
