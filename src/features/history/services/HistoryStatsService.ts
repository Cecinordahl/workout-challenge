import { getChallengeEngine } from '@/features/challenge/engine/getChallengeEngine'
import { StreakService } from '@/features/challenge/services/StreakService'
import type { Challenge, GoalType } from '@/types/challenge'
import type { DailyResult, DailyResultStatus } from '@/types/dailyResult'

export interface ChallengeStats {
  challengeId: string
  title: string
  goalType: GoalType
  targetValue: number
  completedValue: number
  completedDays: number
  durationDays: number
  completionPercent: number
  longestStreak: number
  totalPoints: number
}

export const HistoryStatsService = {
  computeChallengeStats(
    challenge: Challenge,
    results: DailyResult[],
  ): ChallengeStats {
    const engine = getChallengeEngine(challenge.algorithmVersion)
    const plan = engine.generatePlan({
      durationDays: challenge.durationDays,
      goalType: challenge.goalType,
      targetValue: challenge.targetValue,
      dailyMinimum: challenge.dailyMinimum,
      dailyMaximum: challenge.dailyMaximum,
      randomSeed: challenge.randomSeed,
    })
    const resultsByDayIndex = new Map(
      results.map((result) => [result.dayIndex, result]),
    )

    let completedValue = 0
    let completedDays = 0
    let totalPoints = 0
    const statuses: DailyResultStatus[] = []

    for (let dayIndex = 0; dayIndex < challenge.durationDays; dayIndex++) {
      const result = resultsByDayIndex.get(dayIndex)
      const status: DailyResultStatus = result?.status ?? 'missed'
      statuses.push(status)
      if (status === 'completed' && result) {
        completedDays += 1
        totalPoints += result.pointsAwarded
        completedValue += plan[dayIndex]?.value ?? 0
      }
    }

    return {
      challengeId: challenge.id,
      title: challenge.title,
      goalType: challenge.goalType,
      targetValue: challenge.targetValue,
      completedValue: Math.round(completedValue * 10) / 10,
      completedDays,
      durationDays: challenge.durationDays,
      completionPercent: Math.round(
        (completedDays / challenge.durationDays) * 100,
      ),
      longestStreak: StreakService.calculateLongestStreak(statuses),
      totalPoints,
    }
  },
}
