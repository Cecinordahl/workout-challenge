/**
 * Deliberately duplicated from
 * src/features/challenge/services/StreakService.ts on the client — keep the
 * completed/skipped/missed rules in sync if either changes.
 */

export type DailyResultStatus = 'completed' | 'skipped' | 'missed'

export function calculateCurrentStreak(
  mostRecentFirst: DailyResultStatus[],
): number {
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
}
