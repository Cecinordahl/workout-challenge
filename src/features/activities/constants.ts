import type { ActivityType } from '@/types/activity'

export const ACTIVITY_TYPE_LABELS: Record<ActivityType, string> = {
  run: 'Run',
  walk: 'Walk',
  hike: 'Hike',
  ride: 'Ride',
  swim: 'Swim',
  wheelchair: 'Wheelchair',
  other: 'Other',
}

export const ACTIVITY_TYPES = Object.keys(
  ACTIVITY_TYPE_LABELS,
) as ActivityType[]

/**
 * Average-speed ceilings (km/h) for manual entries — generous enough for
 * fast athletes, low enough to catch a typo like 50 km in 5 minutes.
 */
export const MAX_AVERAGE_SPEED_KMH: Record<ActivityType, number> = {
  run: 25,
  walk: 12,
  hike: 12,
  ride: 60,
  swim: 8,
  wheelchair: 30,
  other: 60,
}

export const MAX_DURATION_MIN = 24 * 60
export const KM_PER_MILE = 1.609344
