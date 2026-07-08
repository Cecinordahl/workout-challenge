import {
  doc,
  getDoc,
  onSnapshot,
  serverTimestamp,
  setDoc,
  type DocumentSnapshot,
} from 'firebase/firestore'
import { db } from '@/services/firebase/config'
import type { UserProfile } from '@/types/user'

type UserProfileDocData = Omit<UserProfile, 'id'>

function userDocRef(uid: string) {
  return doc(db, 'users', uid)
}

function mapUserProfile(snapshot: DocumentSnapshot): UserProfile | null {
  if (!snapshot.exists()) return null
  const data = snapshot.data() as UserProfileDocData
  return { id: snapshot.id, ...data }
}

export const UserProfileService = {
  async createProfile(
    uid: string,
    input: { displayName: string; email: string },
  ): Promise<void> {
    await setDoc(userDocRef(uid), {
      displayName: input.displayName,
      email: input.email,
      createdAt: serverTimestamp(),
      timezone: Intl.DateTimeFormat().resolvedOptions().timeZone,
      distanceUnit: 'km',
      notificationSettings: {
        dailyReminder: true,
        reminderTime: '18:00',
        tomorrowWorkoutReady: true,
        streakReminder: true,
      },
    })
  },

  async getProfile(uid: string): Promise<UserProfile | null> {
    const snapshot = await getDoc(userDocRef(uid))
    return mapUserProfile(snapshot)
  },

  subscribeToProfile(
    uid: string,
    callback: (profile: UserProfile | null) => void,
  ): () => void {
    return onSnapshot(userDocRef(uid), (snapshot) => {
      callback(mapUserProfile(snapshot))
    })
  },
}
