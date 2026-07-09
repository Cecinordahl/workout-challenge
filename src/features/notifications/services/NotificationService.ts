import {
  collection,
  doc,
  onSnapshot,
  orderBy,
  query,
  updateDoc,
  where,
  type QuerySnapshot,
} from 'firebase/firestore'
import { db } from '@/services/firebase/config'
import { requestFcmToken } from '@/services/firebase/messaging'
import { UserProfileService } from '@/features/authentication/services/UserProfileService'
import type { AppNotification } from '@/types/notification'

function mapNotifications(snapshot: QuerySnapshot): AppNotification[] {
  return snapshot.docs.map((docSnapshot) => {
    const data = docSnapshot.data() as Omit<AppNotification, 'id'>
    return { id: docSnapshot.id, ...data }
  })
}

export const NotificationService = {
  /**
   * Requests browser notification permission and, if granted, registers
   * this device's FCM token on the user's profile. Safe to call even where
   * push isn't supported/available — it's a best-effort enhancement, not a
   * requirement for the in-app notification list below.
   */
  async enablePush(userId: string): Promise<boolean> {
    const token = await requestFcmToken()
    if (!token) return false
    await UserProfileService.addFcmToken(userId, token)
    return true
  },

  subscribeToNotifications(
    userId: string,
    callback: (notifications: AppNotification[]) => void,
  ): () => void {
    const notificationsQuery = query(
      collection(db, 'notifications'),
      where('userId', '==', userId),
      orderBy('createdAt', 'desc'),
    )
    return onSnapshot(notificationsQuery, (snapshot) => {
      callback(mapNotifications(snapshot))
    })
  },

  async markAsRead(notificationId: string): Promise<void> {
    await updateDoc(doc(db, 'notifications', notificationId), { read: true })
  },
}
