import type { Timestamp } from 'firebase/firestore'

/** Status as actually stored in Firestore. "missed" is never written — it's
 * derived at read time from the absence of a record for a past day. */
export type StoredDailyResultStatus = 'completed' | 'skipped'

export type DailyResultStatus = StoredDailyResultStatus | 'missed'

export interface DailyResult {
  id: string
  challengeId: string
  userId: string
  dayIndex: number
  date: string
  status: StoredDailyResultStatus
  pointsAwarded: number
  completedAt: Timestamp
}
