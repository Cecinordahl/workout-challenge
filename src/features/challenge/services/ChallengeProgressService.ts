import { ChallengeViewService } from '@/features/challenge/services/ChallengeViewService'
import { StreakService } from '@/features/challenge/services/StreakService'
import type { Challenge } from '@/types/challenge'
import type { DailyResult, DailyResultStatus } from '@/types/dailyResult'

export interface ChallengeProgress {
  dayIndex: number | null
  todayResult: DailyResult | undefined
  currentStreak: number
  totalPoints: number
  completedDays: number
  skipsUsed: number
}

export const ChallengeProgressService = {
  /**
   * Computes points/streak/completion progress for a challenge as of
   * `todayIso`. Shared by the dashboard (the owner's own progress) and the
   * team leaderboard (every member's progress), so the two never drift.
   */
  computeProgress(
    challenge: Challenge,
    results: DailyResult[],
    todayIso: string,
  ): ChallengeProgress {
    const view = ChallengeViewService.getView(challenge, todayIso)
    const resultsByDayIndex = new Map(results.map((r) => [r.dayIndex, r]))
    const dayIndex = view.dayIndex
    const todayResult =
      dayIndex !== null ? resultsByDayIndex.get(dayIndex) : undefined

    const recentStatuses: DailyResultStatus[] = []
    if (dayIndex !== null) {
      // Today only counts once it has an outcome — while still unacted-on,
      // it's neither a completion nor a miss, since the day isn't over yet.
      if (todayResult) recentStatuses.push(todayResult.status)
      for (let i = dayIndex - 1; i >= 0; i--) {
        recentStatuses.push(resultsByDayIndex.get(i)?.status ?? 'missed')
      }
    }

    return {
      dayIndex,
      todayResult,
      currentStreak: StreakService.calculateCurrentStreak(recentStatuses),
      totalPoints: results.reduce((sum, r) => sum + r.pointsAwarded, 0),
      completedDays: results.filter((r) => r.status === 'completed').length,
      skipsUsed: results.filter((r) => r.status === 'skipped').length,
    }
  },
}
