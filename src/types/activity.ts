/** Normalized movement types, independent of any provider's own naming. */
export type ActivityType =
  'run' | 'walk' | 'hike' | 'ride' | 'swim' | 'wheelchair' | 'other'

export type ActivitySource = 'strava' | 'manual'

/** One real activity in the user's ledger — the single source of campaign progress. */
export interface Activity {
  /** Deterministic for synced activities (e.g. `strava_<id>`) so re-syncs can't duplicate. */
  id: string
  userId: string
  source: ActivitySource
  type: ActivityType
  distanceKm: number
  durationMin: number
  /** ISO local datetime without offset (YYYY-MM-DDTHH:mm:ss), as the athlete experienced it. */
  startLocal: string
  /** YYYY-MM-DD in the athlete's local time — decides which campaign month it belongs to. */
  localDate: string
}
