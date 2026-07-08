import type { Timestamp } from 'firebase/firestore'

export type DistanceUnit = 'km' | 'mi'

export interface NotificationSettings {
  dailyReminder: boolean
  reminderTime: string
  tomorrowWorkoutReady: boolean
  streakReminder: boolean
}

export interface UserProfile {
  id: string
  displayName: string
  email: string
  createdAt: Timestamp
  photoURL?: string
  timezone: string
  distanceUnit: DistanceUnit
  notificationSettings: NotificationSettings
}
