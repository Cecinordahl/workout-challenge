import { FieldValue } from 'firebase-admin/firestore'
import { db } from './firebaseAdmin.js'
import { stravaActivityDocId, toActivityFields } from './activityMapping.js'
import type { StravaActivity } from './strava.js'

function activities() {
  return db.collection('activities')
}

/** Writes (or overwrites) a Strava activity in the user's ledger. */
export async function upsertStravaActivity(
  userId: string,
  activity: StravaActivity,
): Promise<void> {
  await activities()
    .doc(stravaActivityDocId(activity.id))
    .set({
      ...toActivityFields(userId, activity),
      syncedAt: FieldValue.serverTimestamp(),
    })
}

/** Removes a Strava activity the athlete deleted — only if it's theirs. */
export async function deleteStravaActivity(
  userId: string,
  stravaActivityId: number,
): Promise<void> {
  const ref = activities().doc(stravaActivityDocId(stravaActivityId))
  const snap = await ref.get()
  if (snap.exists && snap.get('userId') === userId) await ref.delete()
}
