import type { Timestamp } from 'firebase/firestore'

export type GoalType = 'distance' | 'time'

export type ChallengeStatus = 'active' | 'completed' | 'cancelled'

export interface Challenge {
  id: string
  ownerId: string
  title: string
  createdAt: Timestamp
  /** ISO date (YYYY-MM-DD), interpreted in the owner's timezone. */
  startDate: string
  /** ISO date (YYYY-MM-DD), interpreted in the owner's timezone. */
  endDate: string
  durationDays: number
  goalType: GoalType
  targetValue: number
  dailyMinimum: number
  dailyMaximum: number
  allowedSkips: number
  algorithmVersion: string
  randomSeed: string
  status: ChallengeStatus
  locked: boolean
  completed: boolean
  cancelled: boolean
}
