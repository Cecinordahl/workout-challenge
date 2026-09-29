import {
  collection,
  deleteDoc,
  doc,
  getDocs,
  onSnapshot,
  orderBy,
  query,
  serverTimestamp,
  setDoc,
  where,
  type QuerySnapshot,
} from 'firebase/firestore'
import { db } from '@/services/firebase/config'
import type { DailyResult, StoredDailyResultStatus } from '@/types/dailyResult'

function dailyResultDocId(challengeId: string, dayIndex: number): string {
  return `${challengeId}_${dayIndex}`
}

function resultsForChallengeQuery(challengeId: string, userId: string) {
  return query(
    collection(db, 'dailyResults'),
    where('challengeId', '==', challengeId),
    where('userId', '==', userId),
    orderBy('dayIndex', 'asc'),
  )
}

function mapResults(snapshot: QuerySnapshot): DailyResult[] {
  return snapshot.docs.map((docSnapshot) => {
    const data = docSnapshot.data() as Omit<DailyResult, 'id'>
    return { id: docSnapshot.id, ...data }
  })
}

async function writeResult(
  challengeId: string,
  userId: string,
  dayIndex: number,
  date: string,
  status: StoredDailyResultStatus,
  pointsAwarded: number,
): Promise<void> {
  const ref = doc(db, 'dailyResults', dailyResultDocId(challengeId, dayIndex))
  await setDoc(ref, {
    challengeId,
    userId,
    dayIndex,
    date,
    status,
    pointsAwarded,
    completedAt: serverTimestamp(),
    source: 'manual',
  })
}

export const DailyResultService = {
  async completeDay(
    challengeId: string,
    userId: string,
    dayIndex: number,
    date: string,
    pointsAwarded: number,
  ): Promise<void> {
    await writeResult(
      challengeId,
      userId,
      dayIndex,
      date,
      'completed',
      pointsAwarded,
    )
  },

  async skipDay(
    challengeId: string,
    userId: string,
    dayIndex: number,
    date: string,
  ): Promise<void> {
    await writeResult(challengeId, userId, dayIndex, date, 'skipped', 0)
  },

  /** Removes a day's result entirely, e.g. to undo an accidental "Complete" or "Skip" click. */
  async undoDay(challengeId: string, dayIndex: number): Promise<void> {
    const ref = doc(db, 'dailyResults', dailyResultDocId(challengeId, dayIndex))
    await deleteDoc(ref)
  },

  subscribeToResults(
    challengeId: string,
    userId: string,
    callback: (results: DailyResult[]) => void,
  ): () => void {
    return onSnapshot(
      resultsForChallengeQuery(challengeId, userId),
      (snapshot) => {
        callback(mapResults(snapshot))
      },
    )
  },

  async getResults(
    challengeId: string,
    userId: string,
  ): Promise<DailyResult[]> {
    const snapshot = await getDocs(
      resultsForChallengeQuery(challengeId, userId),
    )
    return mapResults(snapshot)
  },
}
