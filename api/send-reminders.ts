import type { VercelRequest, VercelResponse } from '@vercel/node'
import {
  FieldValue,
  type DocumentData,
  type Firestore,
  type QueryDocumentSnapshot,
} from 'firebase-admin/firestore'
import { getMessaging } from 'firebase-admin/messaging'
import { db } from './_lib/firebaseAdmin.js'
import {
  currentTimeInTimezone,
  daysBetweenIsoDates,
  isAtOrAfterReminderTime,
  todayInTimezone,
} from './_lib/date.js'
import {
  calculateCurrentStreak,
  type DailyResultStatus,
} from './_lib/streak.js'

interface UserDoc {
  timezone: string
  fcmTokens?: string[]
  notificationSettings: {
    dailyReminder: boolean
    reminderTime: string
    tomorrowWorkoutReady: boolean
    streakReminder: boolean
    /** Absent for user docs written before this setting existed — treat as enabled. */
    missedDayCheck?: boolean
  }
}

interface ChallengeDoc {
  ownerId: string
  title: string
  startDate: string
  durationDays: number
}

interface DailyResultDoc {
  dayIndex: number
  status: 'completed' | 'skipped'
}

type NotificationType =
  | 'dailyReminder'
  | 'tomorrowWorkoutReady'
  | 'streakReminder'
  | 'missedDayCheck'

async function sendPush(
  db: Firestore,
  userId: string,
  tokens: string[],
  title: string,
  body: string,
): Promise<void> {
  if (tokens.length === 0) return
  const response = await getMessaging().sendEachForMulticast({
    tokens,
    notification: { title, body },
  })

  const invalidTokens = response.responses
    .map((result, i) => (result.success ? null : tokens[i]))
    .filter((token): token is string => token !== null)

  if (invalidTokens.length > 0) {
    await db
      .collection('users')
      .doc(userId)
      .update({ fcmTokens: FieldValue.arrayRemove(...invalidTokens) })
  }
}

async function createNotificationIfNew(
  db: Firestore,
  userId: string,
  type: NotificationType,
  todayIso: string,
  title: string,
  body: string,
): Promise<boolean> {
  const ref = db
    .collection('notifications')
    .doc(`${userId}_${type}_${todayIso}`)
  const existing = await ref.get()
  if (existing.exists) return false
  await ref.set({
    userId,
    type,
    title,
    body,
    createdAt: FieldValue.serverTimestamp(),
    read: false,
  })
  return true
}

async function notify(
  db: Firestore,
  userId: string,
  tokens: string[],
  type: NotificationType,
  todayIso: string,
  title: string,
  body: string,
): Promise<void> {
  const sent = await createNotificationIfNew(
    db,
    userId,
    type,
    todayIso,
    title,
    body,
  )
  if (sent) await sendPush(db, userId, tokens, title, body)
}

async function processChallenge(
  db: Firestore,
  challengeSnap: QueryDocumentSnapshot<DocumentData>,
): Promise<void> {
  const challenge = challengeSnap.data() as ChallengeDoc
  const userSnap = await db.collection('users').doc(challenge.ownerId).get()
  if (!userSnap.exists) return
  const user = userSnap.data() as UserDoc

  const nowLocal = currentTimeInTimezone(user.timezone)
  if (
    !isAtOrAfterReminderTime(nowLocal, user.notificationSettings.reminderTime)
  ) {
    return
  }

  const todayIso = todayInTimezone(user.timezone)
  const dayIndex = daysBetweenIsoDates(challenge.startDate, todayIso)
  if (dayIndex < 0 || dayIndex >= challenge.durationDays) return

  const tokens = user.fcmTokens ?? []

  const resultsSnap = await db
    .collection('dailyResults')
    .where('challengeId', '==', challengeSnap.id)
    .where('userId', '==', challenge.ownerId)
    .get()
  const resultsByDay = new Map<number, DailyResultDoc>()
  for (const doc of resultsSnap.docs) {
    const data = doc.data() as DailyResultDoc
    resultsByDay.set(data.dayIndex, data)
  }

  const todayResult = resultsByDay.get(dayIndex)

  if (!todayResult) {
    const recentStatuses: DailyResultStatus[] = []
    for (let i = dayIndex - 1; i >= 0; i--) {
      recentStatuses.push(resultsByDay.get(i)?.status ?? 'missed')
    }
    const streak = calculateCurrentStreak(recentStatuses)

    if (streak > 0 && user.notificationSettings.streakReminder) {
      await notify(
        db,
        challenge.ownerId,
        tokens,
        'streakReminder',
        todayIso,
        'Keep your streak alive!',
        `You have a ${streak}-day streak going in "${challenge.title}" — don't miss today.`,
      )
    } else if (user.notificationSettings.dailyReminder) {
      await notify(
        db,
        challenge.ownerId,
        tokens,
        'dailyReminder',
        todayIso,
        "Time for today's workout",
        `"${challenge.title}" has a workout waiting for you today.`,
      )
    }
  }

  const hasTomorrow = dayIndex + 1 < challenge.durationDays
  if (hasTomorrow && user.notificationSettings.tomorrowWorkoutReady) {
    await notify(
      db,
      challenge.ownerId,
      tokens,
      'tomorrowWorkoutReady',
      todayIso,
      "Tomorrow's workout is ready",
      `Your next day in "${challenge.title}" is ready whenever you are.`,
    )
  }

  const yesterdayDayIndex = dayIndex - 1
  const missedDayCheckEnabled = user.notificationSettings.missedDayCheck ?? true
  if (
    yesterdayDayIndex >= 0 &&
    !resultsByDay.has(yesterdayDayIndex) &&
    missedDayCheckEnabled
  ) {
    await notify(
      db,
      challenge.ownerId,
      tokens,
      'missedDayCheck',
      todayIso,
      "Didn't see a workout logged",
      `We didn't see yesterday's workout logged in "${challenge.title}". Open the app to confirm you skipped it, log it manually, or sync Strava.`,
    )
  }
}

export default async function handler(
  req: VercelRequest,
  res: VercelResponse,
): Promise<void> {
  if (req.headers.authorization !== `Bearer ${process.env.CRON_SECRET}`) {
    res.status(401).json({ error: 'Unauthorized' })
    return
  }

  const activeChallenges = await db
    .collection('challenges')
    .where('status', '==', 'active')
    .get()

  await Promise.all(
    activeChallenges.docs.map((challengeSnap) =>
      processChallenge(db, challengeSnap),
    ),
  )

  res.status(200).json({ processed: activeChallenges.size })
}
