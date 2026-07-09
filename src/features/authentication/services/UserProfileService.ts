import {
  arrayRemove,
  arrayUnion,
  doc,
  getDoc,
  onSnapshot,
  serverTimestamp,
  setDoc,
  updateDoc,
  type DocumentSnapshot,
} from 'firebase/firestore'
import { db } from '@/services/firebase/config'
import type { NotificationSettings, UserProfile } from '@/types/user'

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
      fcmTokens: [],
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

  async updateNotificationSettings(
    uid: string,
    settings: NotificationSettings,
  ): Promise<void> {
    await updateDoc(userDocRef(uid), { notificationSettings: settings })
  },

  async addFcmToken(uid: string, token: string): Promise<void> {
    await updateDoc(userDocRef(uid), { fcmTokens: arrayUnion(token) })
  },

  async removeFcmToken(uid: string, token: string): Promise<void> {
    await updateDoc(userDocRef(uid), { fcmTokens: arrayRemove(token) })
  },
}
