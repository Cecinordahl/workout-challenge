import { Timestamp } from 'firebase/firestore'
import { describe, expect, it } from 'vitest'
import { HistoryStatsService } from './HistoryStatsService'
import { ChallengeEngineV1 } from '@/features/challenge/engine/ChallengeEngineV1'
import type { Challenge } from '@/types/challenge'
import type { DailyResult } from '@/types/dailyResult'

function makeChallenge(overrides: Partial<Challenge> = {}): Challenge {
  return {
    id: 'challenge-1',
    ownerId: 'user-1',
    title: 'Test Challenge',
    createdAt: Timestamp.now(),
    startDate: '2026-01-01',
    endDate: '2026-01-07',
    durationDays: 7,
    goalType: 'distance',
    targetValue: 20,
    dailyMinimum: 1,
    dailyMaximum: 5,
    allowedSkips: 2,
    algorithmVersion: 'v1',
    randomSeed: 'history-fixture',
    status: 'completed',
    locked: true,
    completed: true,
    cancelled: false,
    ...overrides,
  }
}

function makeResult(overrides: Partial<DailyResult> = {}): DailyResult {
  return {
    id: 'result-1',
    challengeId: 'challenge-1',
    userId: 'user-1',
    dayIndex: 0,
    date: '2026-01-01',
    status: 'completed',
    pointsAwarded: 10,
    completedAt: Timestamp.now(),
    ...overrides,
  }
}

describe('HistoryStatsService.computeChallengeStats', () => {
  it('treats days with no record as missed, and only sums completed days', () => {
    const challenge = makeChallenge()
    const plan = new ChallengeEngineV1().generatePlan({
      durationDays: challenge.durationDays,
      goalType: challenge.goalType,
      targetValue: challenge.targetValue,
      dailyMinimum: challenge.dailyMinimum,
      dailyMaximum: challenge.dailyMaximum,
      randomSeed: challenge.randomSeed,
    })

    // Complete days 0, 1, 2 only; days 3-6 have no record (missed).
    const results = [0, 1, 2].map((dayIndex) =>
      makeResult({
        id: `result-${dayIndex}`,
        dayIndex,
        pointsAwarded: 10,
      }),
    )

    const stats = HistoryStatsService.computeChallengeStats(challenge, results)

    const expectedValue =
      Math.round((plan[0]!.value + plan[1]!.value + plan[2]!.value) * 10) / 10

    expect(stats.completedDays).toBe(3)
    expect(stats.completedValue).toBeCloseTo(expectedValue, 5)
    expect(stats.totalPoints).toBe(30)
    expect(stats.completionPercent).toBe(Math.round((3 / 7) * 100))
  })

  it('computes 100% completion and correct longest streak for a perfect challenge', () => {
    const challenge = makeChallenge()
    const results = Array.from({ length: 7 }, (_, dayIndex) =>
      makeResult({ id: `result-${dayIndex}`, dayIndex, pointsAwarded: 10 }),
    )

    const stats = HistoryStatsService.computeChallengeStats(challenge, results)

    expect(stats.completedDays).toBe(7)
    expect(stats.completionPercent).toBe(100)
    expect(stats.longestStreak).toBe(7)
    expect(stats.totalPoints).toBe(70)
  })

  it('does not let skips or misses inflate the streak or points', () => {
    const challenge = makeChallenge()
    const results = [
      makeResult({
        id: 'r0',
        dayIndex: 0,
        status: 'completed',
        pointsAwarded: 10,
      }),
      makeResult({
        id: 'r1',
        dayIndex: 1,
        status: 'skipped',
        pointsAwarded: 0,
      }),
      makeResult({
        id: 'r2',
        dayIndex: 2,
        status: 'completed',
        pointsAwarded: 10,
      }),
      // day 3 missing entirely -> missed, breaks the streak
      makeResult({
        id: 'r4',
        dayIndex: 4,
        status: 'completed',
        pointsAwarded: 10,
      }),
    ]

    const stats = HistoryStatsService.computeChallengeStats(challenge, results)

    expect(stats.completedDays).toBe(3)
    expect(stats.totalPoints).toBe(30)
    expect(stats.longestStreak).toBe(2) // days 0 and 2 (skip is neutral)
  })

  it('returns zeroed stats when nothing was ever completed', () => {
    const challenge = makeChallenge()
    const stats = HistoryStatsService.computeChallengeStats(challenge, [])

    expect(stats.completedDays).toBe(0)
    expect(stats.completedValue).toBe(0)
    expect(stats.completionPercent).toBe(0)
    expect(stats.longestStreak).toBe(0)
    expect(stats.totalPoints).toBe(0)
  })
})
