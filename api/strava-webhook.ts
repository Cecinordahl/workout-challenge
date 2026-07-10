import type { VercelRequest, VercelResponse } from '@vercel/node'
import { FieldValue } from 'firebase-admin/firestore'
import { db } from './_lib/firebaseAdmin.js'
import {
  getConnectionByAthleteId,
  getValidAccessToken,
} from './_lib/fitnessConnections.js'
import {
  isRunActivity,
  listActivities,
  type StravaActivity,
} from './_lib/strava.js'
import { ChallengeEngineV1 } from './_lib/engine/ChallengeEngineV1.js'
import type { GoalType } from './_lib/engine/types.js'
import { pointsForDay } from './_lib/points.js'
import { daysBetweenIsoDates, todayInTimezone } from './_lib/date.js'

interface UserDoc {
  timezone: string
}

interface ChallengeDoc {
  ownerId: string
  title: string
  startDate: string
  durationDays: number
  goalType: GoalType
  targetValue: number
  dailyMinimum: number
  dailyMaximum: number
  randomSeed: string
  algorithmVersion: string
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
 * Looks at today's run activities in chronological order. As soon as the
 * running total reaches the goal, stops and returns that total — so a
 * single qualifying run is used alone, and a too-short run is summed with
 * whichever later runs push the total over the line.
 */
function findQualifyingTotal(
  activities: StravaActivity[],
  todayIso: string,
  goalType: GoalType,
  target: number,
): number | null {
  const todaysRuns = activities
    .filter(isRunActivity)
    .filter((a) => a.start_date_local.slice(0, 10) === todayIso)
    .sort((a, b) => a.start_date_local.localeCompare(b.start_date_local))

  let total = 0
  for (const run of todaysRuns) {
    total += activityValueFor(run, goalType)
    if (total >= target) return total
  }
  return null
}

async function processAthleteActivity(athleteId: string): Promise<void> {
  const connectionEntry = await getConnectionByAthleteId('strava', athleteId)
  if (!connectionEntry) return
  const { id: connectionId, data: connection } = connectionEntry

  const userSnap = await db.collection('users').doc(connection.userId).get()
  if (!userSnap.exists) return
  const user = userSnap.data() as UserDoc

  const challengeSnap = await db
    .collection('challenges')
    .where('ownerId', '==', connection.userId)
    .where('status', '==', 'active')
    .limit(1)
    .get()
  const challengeDoc = challengeSnap.docs[0]
  if (!challengeDoc) return
  const challenge = challengeDoc.data() as ChallengeDoc

  const todayIso = todayInTimezone(user.timezone)
  const dayIndex = daysBetweenIsoDates(challenge.startDate, todayIso)
  if (dayIndex < 0 || dayIndex >= challenge.durationDays) return

  const resultRef = db
    .collection('dailyResults')
    .doc(`${challengeDoc.id}_${dayIndex}`)
  if ((await resultRef.get()).exists) return // already completed or skipped

  const accessToken = await getValidAccessToken(connectionId, connection)
  const nowSeconds = Math.floor(Date.now() / 1000)
  const activities = await listActivities(
    accessToken,
    nowSeconds - 2 * 86_400,
    nowSeconds + 86_400,
  )

  const plan = new ChallengeEngineV1().generatePlan({
    durationDays: challenge.durationDays,
    goalType: challenge.goalType,
    targetValue: challenge.targetValue,
    dailyMinimum: challenge.dailyMinimum,
    dailyMaximum: challenge.dailyMaximum,
    randomSeed: challenge.randomSeed,
  })
  const todayPlan = plan[dayIndex]!

  const qualifyingTotal = findQualifyingTotal(
    activities,
    todayIso,
    challenge.goalType,
    todayPlan.value,
  )
  if (qualifyingTotal === null) return

  await resultRef.set({
    challengeId: challengeDoc.id,
    userId: connection.userId,
    dayIndex,
    date: todayIso,
    status: 'completed',
    pointsAwarded: pointsForDay(todayPlan.type),
    completedAt: FieldValue.serverTimestamp(),
    source: 'strava',
  })
}

export default async function handler(
  req: VercelRequest,
  res: VercelResponse,
): Promise<void> {
  if (req.method === 'GET') {
    // Strava's subscription-creation handshake.
    const mode = req.query['hub.mode']
    const token = req.query['hub.verify_token']
    const challenge = req.query['hub.challenge']
    if (
      mode === 'subscribe' &&
      token === process.env.STRAVA_WEBHOOK_VERIFY_TOKEN
    ) {
      res.status(200).json({ 'hub.challenge': challenge })
    } else {
      res.status(403).json({ error: 'Verification failed' })
    }
    return
  }

  const event = req.body as {
    aspect_type?: string
    object_type?: string
    owner_id?: number
  }

  if (
    event.aspect_type === 'create' &&
    event.object_type === 'activity' &&
    event.owner_id !== undefined
  ) {
    try {
      await processAthleteActivity(String(event.owner_id))
    } catch (error) {
      // Swallow rather than return an error status: a failure here (a
      // transient Strava/Firestore hiccup) would just make Strava retry
      // the same event, and the next real activity that day re-evaluates
      // the whole day's cumulative total anyway, so there's no lasting gap.
      console.error('Failed to process Strava activity webhook', error)
    }
  }

  res.status(200).json({ received: true })
}
