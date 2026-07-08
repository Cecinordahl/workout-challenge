import type { GoalType } from '@/types/challenge'

export type { GoalType }

export type DayType = 'normal' | 'hero' | 'recovery'

export interface ChallengeParams {
  durationDays: number
  goalType: GoalType
  /** Total distance (km) or total time (minutes) across the whole challenge. */
  targetValue: number
  dailyMinimum: number
  dailyMaximum: number
  randomSeed: string
}

export interface DailyPlan {
  dayIndex: number
  value: number
  type: DayType
}

export interface IChallengeEngine {
  readonly version: string
  generatePlan(params: ChallengeParams): DailyPlan[]
}
