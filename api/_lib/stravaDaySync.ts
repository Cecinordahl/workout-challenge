import { FieldValue } from 'firebase-admin/firestore'
import { db } from './firebaseAdmin.js'
import {
  getValidAccessToken,
  type FitnessConnectionDoc,
} from './fitnessConnections.js'
import { isRunActivity, listActivities, type StravaActivity } from './strava.js'
import { ChallengeEngineV1 } from './engine/ChallengeEngineV1.js'
import type { GoalType } from './engine/types.js'
import { pointsForDay } from './points.js'

export interface ChallengeForSync {
  id: string
  ownerId: string
  durationDays: number
  goalType: GoalType
  targetValue: number
  dailyMinimum: number
  dailyMaximum: number
  randomSeed: string
}

function activityValueFor(
  activity: StravaActivity,
  goalType: GoalType,
): number {
  return goalType === 'distance'
    ? activity.distance / 1000
    : activity.moving_time / 60
}

/**
 * Looks at a day's run activities in chronological order. As soon as the
 * running total reaches the goal, stops and returns that total — so a
 * single qualifying run is used alone, and a too-short run is summed with
 * whichever later runs push the total over the line.
 */
function findQualifyingTotal(
  activities: StravaActivity[],
  dateIso: string,
  goalType: GoalType,
  target: number,
): number | null {
  const dayRuns = activities
    .filter(isRunActivity)
    .filter((a) => a.start_date_local.slice(0, 10) === dateIso)
    .sort((a, b) => a.start_date_local.localeCompare(b.start_date_local))

  let total = 0
  for (const run of dayRuns) {
    total += activityValueFor(run, goalType)
    if (total >= target) return total
  }
  return null
}

export type StravaDaySyncResult = 'synced' | 'no_activity_found'

/**
 * Checks a specific day's Strava activities against that day's plan and, if
 * a qualifying run is found, writes the completed dailyResults doc. Shared
 * by the webhook (always checks "today") and the user-initiated re-sync
 * endpoint (checks a specific past day) so the qualifying-total rules never
 * drift between the two.
 */
export async function syncDayFromStrava(
  connectionId: string,
  connection: FitnessConnectionDoc,
  challenge: ChallengeForSync,
  dayIndex: number,
  dateIso: string,
): Promise<StravaDaySyncResult> {
  const accessToken = await getValidAccessToken(connectionId, connection)

  // Bound the fetch window around the target date's UTC midnight rather
  // than "now" — the exact match against `dateIso` below (via the
  // activity's own local date string) is what actually decides
  // qualification, so this only needs to comfortably cover it regardless
  // of the athlete's timezone offset.
  const DAY_SECONDS = 86_400
  const dateStartSeconds = Math.floor(
    Date.parse(`${dateIso}T00:00:00Z`) / 1000,
  )
  const activities = await listActivities(
    accessToken,
    dateStartSeconds - DAY_SECONDS,
    dateStartSeconds + 2 * DAY_SECONDS,
  )

  const plan = new ChallengeEngineV1().generatePlan({
    durationDays: challenge.durationDays,
    goalType: challenge.goalType,
    targetValue: challenge.targetValue,
    dailyMinimum: challenge.dailyMinimum,
    dailyMaximum: challenge.dailyMaximum,
    randomSeed: challenge.randomSeed,
  })
  const dayPlan = plan[dayIndex]!

  const qualifyingTotal = findQualifyingTotal(
    activities,
    dateIso,
    challenge.goalType,
    dayPlan.value,
  )
  if (qualifyingTotal === null) return 'no_activity_found'

  await db
    .collection('dailyResults')
    .doc(`${challenge.id}_${dayIndex}`)
    .set({
      challengeId: challenge.id,
      userId: challenge.ownerId,
      dayIndex,
      date: dateIso,
      status: 'completed',
      pointsAwarded: pointsForDay(dayPlan.type),
      completedAt: FieldValue.serverTimestamp(),
      source: 'strava',
    })

  return 'synced'
}
