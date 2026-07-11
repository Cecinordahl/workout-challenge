import type { VercelRequest, VercelResponse } from '@vercel/node'
import { db, verifyRequestUser } from './_lib/firebaseAdmin.js'
import { connectionDocId, getConnection } from './_lib/fitnessConnections.js'
import { syncDayFromStrava } from './_lib/stravaDaySync.js'
import type { GoalType } from './_lib/engine/types.js'

interface ChallengeDoc {
  ownerId: string
  durationDays: number
  goalType: GoalType
  targetValue: number
  dailyMinimum: number
  dailyMaximum: number
  randomSeed: string
}

type SyncFailureReason = 'not_connected' | 'already_logged' | 'no_activity_found'

export default async function handler(
  req: VercelRequest,
  res: VercelResponse,
): Promise<void> {
  if (req.method !== 'POST') {
    res.status(405).json({ error: 'Method not allowed' })
    return
  }

  const userId = await verifyRequestUser(req.headers.authorization)
  if (!userId) {
    res.status(401).json({ error: 'Unauthorized' })
    return
  }

  const { challengeId, dayIndex, date } = req.body as {
    challengeId?: string
    dayIndex?: number
    date?: string
  }
  if (!challengeId || dayIndex === undefined || !date) {
    res.status(400).json({ error: 'Missing challengeId, dayIndex, or date' })
    return
  }

  const challengeSnap = await db.collection('challenges').doc(challengeId).get()
  const challenge = challengeSnap.data() as ChallengeDoc | undefined
  if (!challenge || challenge.ownerId !== userId) {
    res.status(404).json({ error: 'Challenge not found' })
    return
  }

  const connection = await getConnection(userId, 'strava')
  if (!connection) {
    const reason: SyncFailureReason = 'not_connected'
    res.status(200).json({ synced: false, reason })
    return
  }

  const resultRef = db.collection('dailyResults').doc(`${challengeId}_${dayIndex}`)
  if ((await resultRef.get()).exists) {
    const reason: SyncFailureReason = 'already_logged'
    res.status(200).json({ synced: false, reason })
    return
  }

  const result = await syncDayFromStrava(
    connectionDocId(userId, 'strava'),
    connection,
    {
      id: challengeId,
      ownerId: userId,
      durationDays: challenge.durationDays,
      goalType: challenge.goalType,
      targetValue: challenge.targetValue,
      dailyMinimum: challenge.dailyMinimum,
      dailyMaximum: challenge.dailyMaximum,
      randomSeed: challenge.randomSeed,
    },
    dayIndex,
    date,
  )

  if (result === 'synced') {
    res.status(200).json({ synced: true })
  } else {
    const reason: SyncFailureReason = 'no_activity_found'
    res.status(200).json({ synced: false, reason })
  }
}
