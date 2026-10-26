import { describe, expect, it } from 'vitest'
import type { CampaignTrack } from '@/features/meaningful/domain/types'
import { makeActivity, makeGoal } from '@/features/meaningful/testing/fixtures'
import { CampaignPeriodService } from './CampaignPeriodService'
import {
  ACTIVE_DAY_MIN_MINUTES,
  CampaignProgressService,
} from './CampaignProgressService'

const november = CampaignPeriodService.getPeriod(11, 2026)
const onFoot: CampaignTrack = {
  id: 'on-foot',
  label: 'On foot',
  activityTypes: ['run', 'walk', 'hike', 'wheelchair'],
}
const cycling: CampaignTrack = {
  id: 'cycling',
  label: 'Cycling',
  activityTypes: ['ride'],
}

function evaluate(
  goal: Parameters<typeof makeGoal>[0],
  activities: ReturnType<typeof makeActivity>[],
  track: CampaignTrack = onFoot,
) {
  return CampaignProgressService.evaluateGoal({
    goal: makeGoal(goal),
    track,
    period: november,
    activities,
  })
}

describe('totalDistance goals', () => {
  it('sums eligible distance and completes on the day the target is crossed', () => {
    const a = makeActivity({ startLocal: '2026-11-02T07:00:00', distanceKm: 4 })
    const b = makeActivity({ startLocal: '2026-11-05T07:00:00', distanceKm: 4 })
    const c = makeActivity({ startLocal: '2026-11-09T07:00:00', distanceKm: 4 })
    const result = evaluate({ goalType: 'totalDistance', target: 10 }, [
      c,
      a,
      b,
    ])

    expect(result.progressValue).toBe(12)
    expect(result.percent).toBe(100)
    expect(result.completed).toBe(true)
    expect(result.completedOn).toBe('2026-11-09')
    expect(result.qualifyingActivityIds).toEqual([a.id, b.id, c.id])
  })

  it('is incomplete below the target', () => {
    const result = evaluate({ goalType: 'totalDistance', target: 10 }, [
      makeActivity({ distanceKm: 7.5 }),
    ])
    expect(result).toMatchObject({
      progressValue: 7.5,
      percent: 75,
      completed: false,
      completedOn: null,
      qualifyingActivityIds: [],
    })
  })

  it('does not lose an exact target to floating-point drift', () => {
    const activities = Array.from({ length: 10 }, (_, i) =>
      makeActivity({
        startLocal: `2026-11-${String(i + 1).padStart(2, '0')}T07:00:00`,
        distanceKm: 0.1,
      }),
    )
    expect(
      evaluate({ goalType: 'totalDistance', target: 1 }, activities).completed,
    ).toBe(true)
  })
})

describe('activity eligibility', () => {
  it('counts the same activity only once', () => {
    const run = makeActivity({ distanceKm: 6 })
    const result = evaluate({ goalType: 'totalDistance', target: 10 }, [
      run,
      { ...run },
      run,
    ])
    expect(result.progressValue).toBe(6)
    expect(result.countedActivityIds).toEqual([run.id])
  })

  it('ignores activities outside the campaign month by local date', () => {
    const result = evaluate({ goalType: 'totalDistance', target: 10 }, [
      makeActivity({ startLocal: '2026-10-31T23:59:00', distanceKm: 5 }),
      makeActivity({ startLocal: '2026-11-01T00:00:00', distanceKm: 1 }),
      makeActivity({ startLocal: '2026-11-30T23:30:00', distanceKm: 2 }),
      makeActivity({ startLocal: '2026-12-01T00:10:00', distanceKm: 5 }),
    ])
    expect(result.progressValue).toBe(3)
  })

  it('never counts a run toward a cycling goal', () => {
    const run = makeActivity({ type: 'run', distanceKm: 50 })
    const ride = makeActivity({ type: 'ride', distanceKm: 20 })
    const result = evaluate(
      { trackId: 'cycling', goalType: 'totalDistance', target: 30 },
      [run, ride],
      cycling,
    )
    expect(result.progressValue).toBe(20)
    expect(result.countedActivityIds).toEqual([ride.id])
  })

  it('never counts a ride toward an on-foot goal', () => {
    const result = evaluate({ goalType: 'totalDistance', target: 10 }, [
      makeActivity({ type: 'ride', distanceKm: 100 }),
    ])
    expect(result.progressValue).toBe(0)
    expect(result.countedActivityIds).toEqual([])
  })

  it('counts a mix of the track’s activity types', () => {
    const result = evaluate({ goalType: 'totalDistance', target: 10 }, [
      makeActivity({ type: 'run', distanceKm: 3 }),
      makeActivity({ type: 'walk', distanceKm: 3 }),
      makeActivity({ type: 'wheelchair', distanceKm: 4 }),
    ])
    expect(result.completed).toBe(true)
  })
})

describe('singleActivityDistance goals', () => {
  it('completes with one activity at or above the threshold', () => {
    const short = makeActivity({
      startLocal: '2026-11-02T07:00:00',
      distanceKm: 4,
    })
    const long = makeActivity({
      startLocal: '2026-11-08T07:00:00',
      distanceKm: 6,
    })
    const result = evaluate({ goalType: 'singleActivityDistance', target: 6 }, [
      short,
      long,
    ])
    expect(result.completed).toBe(true)
    expect(result.completedOn).toBe('2026-11-08')
    expect(result.qualifyingActivityIds).toEqual([long.id])
  })

  it('never combines several activities to meet the threshold', () => {
    const result = evaluate({ goalType: 'singleActivityDistance', target: 6 }, [
      makeActivity({ startLocal: '2026-11-02T07:00:00', distanceKm: 3 }),
      makeActivity({ startLocal: '2026-11-02T18:00:00', distanceKm: 3 }),
      makeActivity({ startLocal: '2026-11-03T07:00:00', distanceKm: 5.9 }),
    ])
    expect(result.completed).toBe(false)
    expect(result.progressValue).toBe(5.9)
    expect(result.percent).toBe(98)
  })

  it('qualifies the earliest activity when several meet the threshold', () => {
    const first = makeActivity({
      startLocal: '2026-11-04T07:00:00',
      distanceKm: 7,
    })
    const second = makeActivity({
      startLocal: '2026-11-12T07:00:00',
      distanceKm: 10,
    })
    const result = evaluate({ goalType: 'singleActivityDistance', target: 6 }, [
      second,
      first,
    ])
    expect(result.qualifyingActivityIds).toEqual([first.id])
    expect(result.progressValue).toBe(10)
  })
})

describe('activeDays goals', () => {
  it('counts each local date once, however many activities it has', () => {
    const result = evaluate({ goalType: 'activeDays', target: 2 }, [
      makeActivity({ startLocal: '2026-11-02T07:00:00' }),
      makeActivity({ startLocal: '2026-11-02T18:00:00' }),
      makeActivity({ startLocal: '2026-11-03T07:00:00' }),
    ])
    expect(result.progressValue).toBe(2)
    expect(result.completedOn).toBe('2026-11-03')
  })

  it(`ignores activities shorter than ${ACTIVE_DAY_MIN_MINUTES} minutes`, () => {
    const result = evaluate({ goalType: 'activeDays', target: 1 }, [
      makeActivity({ durationMin: ACTIVE_DAY_MIN_MINUTES - 1 }),
    ])
    expect(result.completed).toBe(false)
    expect(result.countedActivityIds).toEqual([])
  })
})

describe('totalDuration goals', () => {
  it('sums minutes across activities', () => {
    const result = evaluate({ goalType: 'totalDuration', target: 60 }, [
      makeActivity({ startLocal: '2026-11-02T07:00:00', durationMin: 25 }),
      makeActivity({ startLocal: '2026-11-04T07:00:00', durationMin: 40 }),
    ])
    expect(result).toMatchObject({
      progressValue: 65,
      completed: true,
      completedOn: '2026-11-04',
    })
  })
})
