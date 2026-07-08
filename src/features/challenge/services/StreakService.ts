import type { DailyResultStatus } from '@/types/dailyResult'

export const StreakService = {
  /**
   * Counts the current streak from a sequence of day statuses ordered
   * newest first (yesterday, the day before, ...). Completed days extend
   * the streak; skipped days are a no-op (they neither extend nor break
   * it — allowed skips are a deliberate grace mechanic); a missed day ends
   * the streak immediately, since anything further back is no longer part
   * of the current run.
   */
  calculateCurrentStreak(mostRecentFirst: DailyResultStatus[]): number {
    let streak = 0
    for (const status of mostRecentFirst) {
      if (status === 'completed') {
        streak += 1
      } else if (status === 'skipped') {
        continue
      } else {
        break
      }
    }
    return streak
  },
}
