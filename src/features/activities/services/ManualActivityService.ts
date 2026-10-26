import {
  ACTIVITY_TYPES,
  KM_PER_MILE,
  MAX_AVERAGE_SPEED_KMH,
  MAX_DURATION_MIN,
} from '@/features/activities/constants'
import type { Activity, ActivityType } from '@/types/activity'
import type { DistanceUnit } from '@/types/user'

export interface ManualActivityInput {
  type: ActivityType
  /** Local date (YYYY-MM-DD) the activity happened. */
  date: string
  /** Local start time (HH:mm); defaults to noon when the user doesn't give one. */
  startTime?: string
  /** In the user's preferred unit. */
  distance: number
  distanceUnit: DistanceUnit
  durationMin: number
}

export type ManualActivityError =
  | 'unknownType'
  | 'invalidDate'
  | 'futureDate'
  | 'invalidTime'
  | 'invalidDistance'
  | 'invalidDuration'
  | 'implausibleSpeed'

export type ManualActivityFields = Omit<Activity, 'id'>

export type ManualActivityResult =
  | { ok: true; fields: ManualActivityFields }
  | { ok: false; errors: ManualActivityError[] }

const ISO_DATE = /^\d{4}-\d{2}-\d{2}$/
const TIME = /^([01]\d|2[0-3]):[0-5]\d$/

function isValidIsoDate(value: string): boolean {
  if (!ISO_DATE.test(value)) return false
  const parsed = new Date(`${value}T00:00:00Z`)
  return (
    !Number.isNaN(parsed.getTime()) &&
    parsed.toISOString().slice(0, 10) === value
  )
}

export const ManualActivityService = {
  /**
   * Validates a hand-logged activity and converts it to ledger fields
   * (kilometres, local start time). `todayIso` is today in the user's own
   * timezone, so "no future dates" means their today, not UTC's.
   */
  build(
    userId: string,
    input: ManualActivityInput,
    todayIso: string,
  ): ManualActivityResult {
    const errors: ManualActivityError[] = []

    if (!ACTIVITY_TYPES.includes(input.type)) errors.push('unknownType')
    if (!isValidIsoDate(input.date)) errors.push('invalidDate')
    else if (input.date > todayIso) errors.push('futureDate')
    if (input.startTime !== undefined && !TIME.test(input.startTime)) {
      errors.push('invalidTime')
    }

    const distanceKm =
      input.distanceUnit === 'mi'
        ? input.distance * KM_PER_MILE
        : input.distance
    if (!Number.isFinite(distanceKm) || distanceKm < 0) {
      errors.push('invalidDistance')
    }
    if (
      !Number.isFinite(input.durationMin) ||
      input.durationMin <= 0 ||
      input.durationMin > MAX_DURATION_MIN
    ) {
      errors.push('invalidDuration')
    }

    if (errors.length === 0) {
      const speedKmh = distanceKm / (input.durationMin / 60)
      const maxSpeed = MAX_AVERAGE_SPEED_KMH[input.type]
      if (speedKmh > maxSpeed) errors.push('implausibleSpeed')
    }
    if (errors.length > 0) return { ok: false, errors }

    const startLocal = `${input.date}T${input.startTime ?? '12:00'}:00`
    return {
      ok: true,
      fields: {
        userId,
        source: 'manual',
        type: input.type,
        distanceKm: Math.round(distanceKm * 1000) / 1000,
        durationMin: Math.round(input.durationMin * 10) / 10,
        startLocal,
        localDate: input.date,
      },
    }
  },

  /**
   * Existing activities that look like the same outing — same day, same
   * type, similar distance — most often a manual entry for something
   * Strava already synced. A warning for the user to confirm, not a block:
   * two similar walks on one day are perfectly possible.
   */
  findPossibleDuplicates(
    candidate: Pick<Activity, 'type' | 'localDate' | 'distanceKm'>,
    existing: Activity[],
  ): Activity[] {
    const tolerance = Math.max(0.3, candidate.distanceKm * 0.05)
    return existing.filter(
      (activity) =>
        activity.localDate === candidate.localDate &&
        activity.type === candidate.type &&
        Math.abs(activity.distanceKm - candidate.distanceKm) <= tolerance,
    )
  },
}
