import { getChallengeEngine } from '@/features/challenge/engine/getChallengeEngine'
import type { DailyPlan } from '@/features/challenge/engine/types'
import type { Challenge } from '@/types/challenge'
import { daysBetweenIsoDates } from '@/utils/date'

export interface ChallengeView {
  /** Index of "today" within the plan, or null if the challenge hasn't started or has ended. */
  dayIndex: number | null
  todayPlan: DailyPlan | null
  tomorrowPlan: DailyPlan | null
  hasStarted: boolean
  hasEnded: boolean
}

/**
 * Regenerates a challenge's full plan on demand (never stored) and reveals
 * only today's workout and a preview of tomorrow's — future days stay
 * hidden by simply never being returned from here.
 */
export const ChallengeViewService = {
  getView(challenge: Challenge, todayIso: string): ChallengeView {
    const engine = getChallengeEngine(challenge.algorithmVersion)
    const plan = engine.generatePlan({
      durationDays: challenge.durationDays,
      goalType: challenge.goalType,
      targetValue: challenge.targetValue,
      dailyMinimum: challenge.dailyMinimum,
      dailyMaximum: challenge.dailyMaximum,
      randomSeed: challenge.randomSeed,
    })

    const dayIndex = daysBetweenIsoDates(challenge.startDate, todayIso)
    const hasStarted = dayIndex >= 0
    const hasEnded = dayIndex >= challenge.durationDays
    const isCurrent = hasStarted && !hasEnded

    return {
      dayIndex: isCurrent ? dayIndex : null,
      todayPlan: isCurrent ? (plan[dayIndex] ?? null) : null,
      tomorrowPlan:
        hasStarted && dayIndex + 1 < challenge.durationDays
          ? (plan[dayIndex + 1] ?? null)
          : null,
      hasStarted,
      hasEnded,
    }
  },
}
