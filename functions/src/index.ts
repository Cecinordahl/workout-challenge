import { initializeApp } from 'firebase-admin/app'
import {
  FieldValue,
  getFirestore,
  type DocumentData,
  type QueryDocumentSnapshot,
} from 'firebase-admin/firestore'
import { getMessaging } from 'firebase-admin/messaging'
import { onSchedule } from 'firebase-functions/v2/scheduler'
import { logger } from 'firebase-functions'
import {
  currentTimeInTimezone,
  daysBetweenIsoDates,
  isSameTimeBucket,
  todayInTimezone,
} from './date'
import { calculateCurrentStreak, type DailyResultStatus } from './streak'

initializeApp()

const BUCKET_MINUTES = 30

interface UserDoc {
  displayName: string
  timezone: string
  fcmTokens?: string[]
  notificationSettings: {
    dailyReminder: boolean
    reminderTime: string
    tomorrowWorkoutReady: boolean
    streakReminder: boolean
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

async function sendPush(
  db: FirebaseFirestore.Firestore,
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
  db: FirebaseFirestore.Firestore,
  userId: string,
  type: 'dailyReminder' | 'tomorrowWorkoutReady' | 'streakReminder',
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

/**
 * Runs every 30 minutes, checking every active challenge's owner against
 * their own local reminder time. Each of the three notification types is
 * deduplicated per user per day via a deterministic doc ID, so re-running
 * within the same day never double-sends.
 */
export const sendReminders = onSchedule(
  `every ${BUCKET_MINUTES} minutes`,
  async () => {
    const db = getFirestore()

    const activeChallenges = await db
      .collection('challenges')
      .where('status', '==', 'active')
      .get()

    await Promise.all(
      activeChallenges.docs.map((challengeSnap) =>
        processChallenge(db, challengeSnap),
      ),
    )
  },
)

async function processChallenge(
  db: FirebaseFirestore.Firestore,
  challengeSnap: QueryDocumentSnapshot<DocumentData>,
): Promise<void> {
  const challenge = challengeSnap.data() as ChallengeDoc
  const userSnap = await db.collection('users').doc(challenge.ownerId).get()
  if (!userSnap.exists) return
  const user = userSnap.data() as UserDoc

  const nowLocal = currentTimeInTimezone(user.timezone)
  const { reminderTime } = user.notificationSettings
  if (!isSameTimeBucket(nowLocal, reminderTime, BUCKET_MINUTES)) return

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
      const sent = await createNotificationIfNew(
        db,
        challenge.ownerId,
        'streakReminder',
        todayIso,
        'Keep your streak alive!',
        `You have a ${streak}-day streak going in "${challenge.title}" — don't miss today.`,
      )
      if (sent) {
        await sendPush(
          db,
          challenge.ownerId,
          tokens,
          'Keep your streak alive!',
          `You have a ${streak}-day streak going in "${challenge.title}" — don't miss today.`,
        )
      }
    } else if (user.notificationSettings.dailyReminder) {
      const sent = await createNotificationIfNew(
        db,
        challenge.ownerId,
        'dailyReminder',
        todayIso,
        "Time for today's workout",
        `"${challenge.title}" has a workout waiting for you today.`,
      )
      if (sent) {
        await sendPush(
          db,
          challenge.ownerId,
          tokens,
          "Time for today's workout",
          `"${challenge.title}" has a workout waiting for you today.`,
        )
      }
    }
  }

  const hasTomorrow = dayIndex + 1 < challenge.durationDays
  if (hasTomorrow && user.notificationSettings.tomorrowWorkoutReady) {
    const sent = await createNotificationIfNew(
      db,
      challenge.ownerId,
      'tomorrowWorkoutReady',
      todayIso,
      "Tomorrow's workout is ready",
      `Your next day in "${challenge.title}" is ready whenever you are.`,
    )
    if (sent) {
      await sendPush(
        db,
        challenge.ownerId,
        tokens,
        "Tomorrow's workout is ready",
        `Your next day in "${challenge.title}" is ready whenever you are.`,
      )
    }
  }

  logger.debug('processed challenge', { challengeId: challengeSnap.id })
}
