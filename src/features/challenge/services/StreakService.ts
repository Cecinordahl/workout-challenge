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

  /**
   * The longest run achieved anywhere in a finished challenge's day
   * sequence (order doesn't matter — oldest-first or newest-first give the
   * same result), using the same completed/skipped/missed rules.
   */
  calculateLongestStreak(statuses: DailyResultStatus[]): number {
    let longest = 0
    let current = 0
    for (const status of statuses) {
      if (status === 'completed') {
        current += 1
        longest = Math.max(longest, current)
      } else if (status === 'skipped') {
        continue
      } else {
        current = 0
      }
    }
    return longest
  },
}
