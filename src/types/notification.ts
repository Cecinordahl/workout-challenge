import type { Timestamp } from 'firebase/firestore'

export type NotificationType =
  | 'dailyReminder'
  | 'tomorrowWorkoutReady'
  | 'streakReminder'
  | 'missedDayCheck'

export interface AppNotification {
  id: string
  userId: string
  type: NotificationType
  title: string
  body: string
  createdAt: Timestamp
  read: boolean
}
