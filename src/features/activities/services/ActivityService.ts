import {
  addDoc,
  collection,
  deleteDoc,
  doc,
  getDocs,
  onSnapshot,
  orderBy,
  query,
  serverTimestamp,
  where,
  type QuerySnapshot,
} from 'firebase/firestore'
import { auth, db } from '@/services/firebase/config'
import type { Activity } from '@/types/activity'
import type { ManualActivityFields } from './ManualActivityService'

function activitiesInRangeQuery(
  userId: string,
  startDate: string,
  endDate: string,
) {
  return query(
    collection(db, 'activities'),
    where('userId', '==', userId),
    where('localDate', '>=', startDate),
    where('localDate', '<=', endDate),
    orderBy('localDate', 'asc'),
  )
}

function mapActivities(snapshot: QuerySnapshot): Activity[] {
  return snapshot.docs.map((docSnapshot) => {
    const data = docSnapshot.data() as Omit<Activity, 'id'>
    return { id: docSnapshot.id, ...data }
  })
}

export const ActivityService = {
  /** Adds a validated manual entry (see ManualActivityService.build). */
  async addManualActivity(fields: ManualActivityFields): Promise<string> {
    const docRef = await addDoc(collection(db, 'activities'), {
      ...fields,
      createdAt: serverTimestamp(),
    })
    return docRef.id
  },

  /** Only manual entries can be deleted here; Strava activities follow Strava. */
  async deleteManualActivity(activityId: string): Promise<void> {
    await deleteDoc(doc(db, 'activities', activityId))
  },

  async getActivitiesInRange(
    userId: string,
    startDate: string,
    endDate: string,
  ): Promise<Activity[]> {
    const snapshot = await getDocs(
      activitiesInRangeQuery(userId, startDate, endDate),
    )
    return mapActivities(snapshot)
  },

  subscribeToActivitiesInRange(
    userId: string,
    startDate: string,
    endDate: string,
    callback: (activities: Activity[]) => void,
  ): () => void {
    return onSnapshot(
      activitiesInRangeQuery(userId, startDate, endDate),
      (snapshot) => {
        callback(mapActivities(snapshot))
      },
    )
  },

  /** Pulls Strava activities between two local dates into the ledger (e.g. on joining a campaign mid-month). */
  async importFromStrava(
    startDate: string,
    endDate: string,
  ): Promise<{ imported: number }> {
    const idToken = await auth.currentUser?.getIdToken()
    const res = await fetch('/api/strava-import-activities', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${idToken ?? ''}`,
      },
      body: JSON.stringify({ startDate, endDate }),
    })
    if (!res.ok) throw new Error('Failed to import Strava activities.')
    return res.json() as Promise<{ imported: number }>
  },
}
