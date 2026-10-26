import type { StravaActivity } from './strava.js'

/**
 * Deliberately duplicated from src/types/activity.ts on the client (see
 * the note in ./date.ts). Keep the two in sync.
 */
export type ActivityType =
  'run' | 'walk' | 'hike' | 'ride' | 'swim' | 'wheelchair' | 'other'

export interface ActivityFields {
  userId: string
  source: 'strava'
  externalId: string
  type: ActivityType
  distanceKm: number
  durationMin: number
  startLocal: string
  localDate: string
}

/**
 * Strava sport types → our normalized types. Assisted and motorised-style
 * activities (e-bikes, velomobiles) deliberately map to 'other' so they
 * never count toward a human-powered distance goal; anything unlisted does
 * too, so a new Strava sport type can't silently start counting.
 */
const STRAVA_SPORT_TYPES: Record<string, ActivityType> = {
  Run: 'run',
  TrailRun: 'run',
  VirtualRun: 'run',
  Walk: 'walk',
  Hike: 'hike',
  Ride: 'ride',
  MountainBikeRide: 'ride',
  GravelRide: 'ride',
  VirtualRide: 'ride',
  Handcycle: 'ride',
  Wheelchair: 'wheelchair',
  Swim: 'swim',
}

export function mapStravaSportType(activity: StravaActivity): ActivityType {
  // The legacy `type` is coarser (an e-bike ride is just "Ride"), so it's
  // only a fallback for activities without a sport_type at all.
  const key = activity.sport_type || activity.type
  return STRAVA_SPORT_TYPES[key] ?? 'other'
}

/** Ledger document ID for a Strava activity — deterministic, so re-syncs overwrite rather than duplicate. */
export function stravaActivityDocId(stravaActivityId: number): string {
  return `strava_${stravaActivityId}`
}

export function toActivityFields(
  userId: string,
  activity: StravaActivity,
): ActivityFields {
  // Strava's start_date_local carries a misleading "Z" suffix; it's really
  // the athlete's wall-clock time, which is exactly what campaign months use.
  const startLocal = activity.start_date_local.slice(0, 19)
  return {
    userId,
    source: 'strava',
    externalId: String(activity.id),
    type: mapStravaSportType(activity),
    distanceKm: Math.round(activity.distance) / 1000,
    durationMin: Math.round((activity.moving_time / 60) * 10) / 10,
    startLocal,
    localDate: startLocal.slice(0, 10),
  }
}
