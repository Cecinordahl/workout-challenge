import {
  addDoc,
  collection,
  doc,
  getDocs,
  limit,
  onSnapshot,
  orderBy,
  query,
  serverTimestamp,
  updateDoc,
  where,
  type DocumentSnapshot,
} from 'firebase/firestore'
import { db } from '@/services/firebase/config'
import type { Challenge, GoalType } from '@/types/challenge'
import { addDaysToIsoDate, todayInTimezone } from '@/utils/date'

const CURRENT_ALGORITHM_VERSION = 'v1'

export interface CreateChallengeInput {
  title: string
  goalType: GoalType
  durationDays: number
  targetValue: number
  dailyMinimum: number
  dailyMaximum: number
  allowedSkips: number
  /** IANA timezone the owner's "day 1" should be anchored to. */
  timezone: string
}

function challengesCollection() {
  return collection(db, 'challenges')
}

function activeChallengeQuery(ownerId: string) {
  return query(
    challengesCollection(),
    where('ownerId', '==', ownerId),
    where('status', '==', 'active'),
    orderBy('createdAt', 'desc'),
    limit(1),
  )
}

function mapChallenge(snapshot: DocumentSnapshot): Challenge | null {
  if (!snapshot.exists()) return null
  const data = snapshot.data() as Omit<Challenge, 'id'>
  return { id: snapshot.id, ...data }
}

export const ChallengeService = {
  async createChallenge(
    ownerId: string,
    input: CreateChallengeInput,
  ): Promise<string> {
    const startDate = todayInTimezone(input.timezone)
    const endDate = addDaysToIsoDate(startDate, input.durationDays - 1)

    const docRef = await addDoc(challengesCollection(), {
      ownerId,
      title: input.title,
      createdAt: serverTimestamp(),
      startDate,
      endDate,
      durationDays: input.durationDays,
      goalType: input.goalType,
      targetValue: input.targetValue,
      dailyMinimum: input.dailyMinimum,
      dailyMaximum: input.dailyMaximum,
      allowedSkips: input.allowedSkips,
      algorithmVersion: CURRENT_ALGORITHM_VERSION,
      randomSeed: crypto.randomUUID(),
      status: 'active',
      locked: false,
      completed: false,
      cancelled: false,
    })
    return docRef.id
  },

  async completeChallenge(challengeId: string): Promise<void> {
    await updateDoc(doc(db, 'challenges', challengeId), {
      status: 'completed',
      completed: true,
    })
  },

  async getPastChallenges(ownerId: string): Promise<Challenge[]> {
    const pastChallengesQuery = query(
      challengesCollection(),
      where('ownerId', '==', ownerId),
      where('status', 'in', ['completed', 'cancelled']),
      orderBy('createdAt', 'desc'),
    )
    const snapshot = await getDocs(pastChallengesQuery)
    return snapshot.docs
      .map((docSnapshot) => mapChallenge(docSnapshot))
      .filter((challenge): challenge is Challenge => challenge !== null)
  },

  async getActiveChallenge(ownerId: string): Promise<Challenge | null> {
    const snapshot = await getDocs(activeChallengeQuery(ownerId))
    const [first] = snapshot.docs
    return first ? mapChallenge(first) : null
  },

  subscribeToActiveChallenge(
    ownerId: string,
    callback: (challenge: Challenge | null) => void,
  ): () => void {
    return onSnapshot(activeChallengeQuery(ownerId), (snapshot) => {
      const [first] = snapshot.docs
      callback(first ? mapChallenge(first) : null)
    })
  },
}
