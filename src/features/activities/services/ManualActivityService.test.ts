import { describe, expect, it } from 'vitest'
import type { Activity } from '@/types/activity'
import {
  ManualActivityService,
  type ManualActivityInput,
} from './ManualActivityService'

const TODAY = '2026-11-15'

function build(overrides: Partial<ManualActivityInput> = {}) {
  return ManualActivityService.build(
    'user-1',
    {
      type: 'run',
      date: '2026-11-10',
      startTime: '07:30',
      distance: 5,
      distanceUnit: 'km',
      durationMin: 30,
      ...overrides,
    },
    TODAY,
  )
}

function activity(overrides: Partial<Activity> = {}): Activity {
  return {
    id: 'strava_1',
    userId: 'user-1',
    source: 'strava',
    type: 'run',
    distanceKm: 5,
    durationMin: 30,
    startLocal: '2026-11-10T07:30:00',
    localDate: '2026-11-10',
    ...overrides,
  }
}

describe('ManualActivityService.build', () => {
  it('builds ledger fields for a valid entry', () => {
    expect(build()).toEqual({
      ok: true,
      fields: {
        userId: 'user-1',
        source: 'manual',
        type: 'run',
        distanceKm: 5,
        durationMin: 30,
        startLocal: '2026-11-10T07:30:00',
        localDate: '2026-11-10',
      },
    })
  })

  it('converts miles to kilometres', () => {
    const result = build({ distance: 3.1, distanceUnit: 'mi' })
    expect(result.ok && result.fields.distanceKm).toBe(4.989)
  })

  it('defaults the start time to noon so the date never shifts', () => {
    const result = build({ startTime: undefined })
    expect(result.ok && result.fields.startLocal).toBe('2026-11-10T12:00:00')
  })

  it('accepts today but rejects dates after today in the user’s timezone', () => {
    expect(build({ date: TODAY }).ok).toBe(true)
    expect(build({ date: '2026-11-16' })).toEqual({
      ok: false,
      errors: ['futureDate'],
    })
  })

  it('rejects malformed dates and times', () => {
    expect(build({ date: '2026-11-31' })).toEqual({
      ok: false,
      errors: ['invalidDate'],
    })
    expect(build({ startTime: '25:00' })).toEqual({
      ok: false,
      errors: ['invalidTime'],
    })
  })

  it('rejects negative distance and out-of-range durations', () => {
    expect(build({ distance: -1 })).toEqual({
      ok: false,
      errors: ['invalidDistance'],
    })
    expect(build({ durationMin: 0 })).toEqual({
      ok: false,
      errors: ['invalidDuration'],
    })
    expect(build({ durationMin: 24 * 60 + 1 })).toEqual({
      ok: false,
      errors: ['invalidDuration'],
    })
  })

  it('rejects implausible speeds for the activity type', () => {
    // 50 km in 60 minutes is fine on a bike, not on foot.
    expect(build({ type: 'ride', distance: 50, durationMin: 60 }).ok).toBe(true)
    expect(build({ type: 'run', distance: 50, durationMin: 60 })).toEqual({
      ok: false,
      errors: ['implausibleSpeed'],
    })
  })

  it('rejects unknown activity types', () => {
    expect(
      build({ type: 'skateboard' as ManualActivityInput['type'] }),
    ).toEqual({ ok: false, errors: ['unknownType'] })
  })
})

describe('ManualActivityService.findPossibleDuplicates', () => {
  const candidate = {
    type: 'run' as const,
    localDate: '2026-11-10',
    distanceKm: 5.1,
  }

  it('flags a same-day activity of the same type and similar distance', () => {
    const synced = activity({ distanceKm: 5.012 })
    expect(
      ManualActivityService.findPossibleDuplicates(candidate, [synced]),
    ).toEqual([synced])
  })

  it('ignores different days, types and clearly different distances', () => {
    expect(
      ManualActivityService.findPossibleDuplicates(candidate, [
        activity({ localDate: '2026-11-11' }),
        activity({ type: 'ride' }),
        activity({ distanceKm: 8 }),
      ]),
    ).toEqual([])
  })

  it('scales the tolerance with distance', () => {
    const long = {
      type: 'ride' as const,
      localDate: '2026-11-10',
      distanceKm: 100,
    }
    expect(
      ManualActivityService.findPossibleDuplicates(long, [
        activity({ type: 'ride', distanceKm: 96 }),
      ]),
    ).toHaveLength(1)
  })
})
