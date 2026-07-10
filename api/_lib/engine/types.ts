/**
 * Deliberately duplicated from src/features/challenge/engine/types.ts on
 * the client (this file drops the `@/types/challenge` alias import, which
 * doesn't resolve in this separately-bundled runtime) — keep these two in
 * sync if either changes.
 */

export type GoalType = 'distance' | 'time'

export type DayType = 'normal' | 'hero' | 'recovery'

export interface ChallengeParams {
  durationDays: number
  goalType: GoalType
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
