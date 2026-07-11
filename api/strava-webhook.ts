import type { VercelRequest, VercelResponse } from '@vercel/node'
import { db } from './_lib/firebaseAdmin.js'
import { getConnectionByAthleteId } from './_lib/fitnessConnections.js'
import { syncDayFromStrava } from './_lib/stravaDaySync.js'
import type { GoalType } from './_lib/engine/types.js'
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

  await syncDayFromStrava(
    connectionId,
    connection,
    {
      id: challengeDoc.id,
      ownerId: connection.userId,
      durationDays: challenge.durationDays,
      goalType: challenge.goalType,
      targetValue: challenge.targetValue,
      dailyMinimum: challenge.dailyMinimum,
      dailyMaximum: challenge.dailyMaximum,
      randomSeed: challenge.randomSeed,
    },
    dayIndex,
    todayIso,
  )
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
