import { describe, expect, it } from 'vitest'
import { makeGoal, makeStatistic } from '@/features/meaningful/testing/fixtures'
import { CampaignFormatService } from './CampaignFormatService'
import { CampaignPeriodService } from './CampaignPeriodService'

describe('CampaignFormatService statistics', () => {
  it('never presents an estimate as an exact count', () => {
    expect(
      CampaignFormatService.statisticValue({
        kind: 'estimate',
        value: 727_000,
      }),
    ).toBe('~727,000')
    expect(
      CampaignFormatService.statisticValue({ kind: 'exact', value: 33 }),
    ).toBe('33')
  })

  it('shows ranges with their uncertainty', () => {
    const value = {
      kind: 'range' as const,
      value: 41_000_000,
      low: 35_300_000,
      high: 47_500_000,
    }
    expect(CampaignFormatService.statisticValue(value)).toBe('~41.0 million')
    expect(CampaignFormatService.statisticRange(value)).toBe(
      'Range 35.3 million–47.5 million',
    )
    expect(
      CampaignFormatService.statisticRange({ kind: 'exact', value: 1 }),
    ).toBe(null)
  })

  it('never shows a bare headline number', () => {
    const headline = (unit: string, value = 73) =>
      CampaignFormatService.statisticHeadline(
        makeStatistic({ unit, value: { kind: 'estimate', value } }),
      )
    expect(headline('% of suicide deaths')).toEqual({
      value: '~73%',
      unit: null,
    })
    expect(headline('deaths', 727_000)).toEqual({
      value: '~727,000',
      unit: 'deaths',
    })
    expect(
      CampaignFormatService.statisticHeadline(
        makeStatistic({
          unit: 'rank among causes of death',
          value: { kind: 'exact', value: 3 },
        }),
      ),
    ).toEqual({ value: 'No. 3', unit: null })
  })

  it('formats the verification date', () => {
    expect(CampaignFormatService.verifiedLabel('2026-10-26')).toBe(
      'Checked 26 Oct 2026',
    )
  })
})

describe('CampaignFormatService goals', () => {
  it('describes each goal type in plain words', () => {
    expect(
      CampaignFormatService.goalTarget(makeGoal({ target: 60 }), 'km'),
    ).toBe('60 km in total')
    expect(
      CampaignFormatService.goalTarget(
        makeGoal({ goalType: 'singleActivityDistance', target: 6 }),
        'km',
      ),
    ).toBe('6 km in a single activity')
    expect(
      CampaignFormatService.goalTarget(
        makeGoal({ goalType: 'activeDays', target: 14 }),
        'km',
      ),
    ).toBe('14 active days')
    expect(
      CampaignFormatService.goalTarget(
        makeGoal({ goalType: 'totalDuration', target: 300 }),
        'km',
      ),
    ).toBe('300 minutes in total')
  })

  it('adds miles for users who prefer them, keeping km as the defined target', () => {
    expect(
      CampaignFormatService.goalTarget(makeGoal({ target: 60 }), 'mi'),
    ).toBe('60 km (37.3 mi) in total')
  })

  it('formats progress in the goal unit', () => {
    expect(
      CampaignFormatService.goalProgress(makeGoal({ target: 60 }), 12.46, 'km'),
    ).toBe('12.5 / 60 km')
    expect(
      CampaignFormatService.goalProgress(
        makeGoal({ goalType: 'activeDays', target: 14 }),
        3,
        'km',
      ),
    ).toBe('3 / 14 days')
  })
})

describe('CampaignFormatService.distance', () => {
  it('uses the preferred unit', () => {
    expect(CampaignFormatService.distance(5.25, 'km')).toBe('5.3 km')
    expect(CampaignFormatService.distance(10, 'mi')).toBe('6.2 mi')
  })
})

describe('CampaignFormatService periods', () => {
  it('labels periods and phases', () => {
    expect(
      CampaignFormatService.periodLabel(
        CampaignPeriodService.getPeriod(11, 2026),
      ),
    ).toBe('November 2026')
    expect(CampaignFormatService.phaseLabel('active')).toBe('Happening now')
  })
})
