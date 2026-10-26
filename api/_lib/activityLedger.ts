import { FieldValue } from 'firebase-admin/firestore'
import { db } from './firebaseAdmin.js'
import { stravaActivityDocId, toActivityFields } from './activityMapping.js'
import type { StravaActivity } from './strava.js'

function activities() {
  return db.collection('activities')
}

/** Writes (or overwrites) a Strava activity in the user's ledger; returns its local date. */
export async function upsertStravaActivity(
  userId: string,
  activity: StravaActivity,
): Promise<string> {
  const fields = toActivityFields(userId, activity)
  await activities()
    .doc(stravaActivityDocId(activity.id))
    .set({ ...fields, syncedAt: FieldValue.serverTimestamp() })
  return fields.localDate
}

/** Removes a Strava activity the athlete deleted — only if it's theirs. Returns the removed activity's local date. */
export async function deleteStravaActivity(
  userId: string,
  stravaActivityId: number,
): Promise<string | null> {
  const ref = activities().doc(stravaActivityDocId(stravaActivityId))
  const snap = await ref.get()
  if (!snap.exists || snap.get('userId') !== userId) return null
  await ref.delete()
  return snap.get('localDate') as string
}
