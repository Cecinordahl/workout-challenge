import { describe, expect, it } from 'vitest'
import {
  mapStravaSportType,
  stravaActivityDocId,
  toActivityFields,
} from './activityMapping.js'
import type { StravaActivity } from './strava.js'

function stravaActivity(
  overrides: Partial<StravaActivity> = {},
): StravaActivity {
  return {
    id: 123456789,
    type: 'Run',
    sport_type: 'Run',
    distance: 5012.4,
    moving_time: 1834,
    start_date_local: '2026-11-30T23:30:00Z',
    ...overrides,
  }
}

describe('mapStravaSportType', () => {
  it.each([
    ['Run', 'run'],
    ['TrailRun', 'run'],
    ['VirtualRun', 'run'],
    ['Walk', 'walk'],
    ['Hike', 'hike'],
    ['Ride', 'ride'],
    ['GravelRide', 'ride'],
    ['VirtualRide', 'ride'],
    ['Wheelchair', 'wheelchair'],
    ['Swim', 'swim'],
  ])('maps %s to %s', (sportType, expected) => {
    expect(
      mapStravaSportType(stravaActivity({ sport_type: sportType, type: '' })),
    ).toBe(expected)
  })

  it('keeps assisted rides out of the human-powered types', () => {
    expect(
      mapStravaSportType(
        stravaActivity({ sport_type: 'EBikeRide', type: 'Ride' }),
      ),
    ).toBe('other')
  })

  it('falls back to the legacy type only without a sport type, then to other', () => {
    expect(
      mapStravaSportType(stravaActivity({ sport_type: '', type: 'Walk' })),
    ).toBe('walk')
    expect(
      mapStravaSportType(
        stravaActivity({ sport_type: 'Unknown', type: 'Walk' }),
      ),
    ).toBe('other')
    expect(
      mapStravaSportType(stravaActivity({ sport_type: 'Yoga', type: 'Yoga' })),
    ).toBe('other')
  })
})

describe('toActivityFields', () => {
  it('converts units and keeps the athlete’s local wall-clock date', () => {
    expect(toActivityFields('user-1', stravaActivity())).toEqual({
      userId: 'user-1',
      source: 'strava',
      externalId: '123456789',
      type: 'run',
      distanceKm: 5.012,
      durationMin: 30.6,
      startLocal: '2026-11-30T23:30:00',
      localDate: '2026-11-30',
    })
  })

  it('uses a deterministic document ID', () => {
    expect(stravaActivityDocId(42)).toBe('strava_42')
  })
})
